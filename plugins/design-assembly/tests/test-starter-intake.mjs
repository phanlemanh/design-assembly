// The pieces of the starter kit the build lays carry their true source (found by trial 19 of item
// 10.4): on a repository with no design system, the build of new lays the starter kit's code, and
// the gate's choose-first rule (spec 0015, criterion 11) read those files as made by the branch
// with no row, so a new repository's gate was red, and find called them the repository's own.
// The build now writes a row of the intake ledger for each piece it lays: the starter kit, at its
// pin, with the hash of the file as laid. A piece the repository edits later is still seen, and a
// file a person adds is held as before. Nothing calls a model or the network.
import "./helpers/own-cores.mjs";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import {
  cpSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { execPath } from "node:process";
import { after, test } from "node:test";
import { fileURLToPath } from "node:url";

import { VERSION } from "../scripts/stamp.mjs";
import { readState, runChecks } from "../templates/tools/design-assembly/check.mjs";
import { readIntakeLedger } from "../templates/tools/design-assembly/intake-ledger.mjs";

const PLUGIN = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const ROOT = path.resolve(PLUGIN, "../..");
const APPLY = path.join(PLUGIN, "scripts/apply.mjs");
const FIND = path.join(PLUGIN, "scripts/find.mjs");
const LAYERS = JSON.parse(readFileSync(path.join(PLUGIN, "references/layers.json"), "utf8")).layers;

const made = [];
after(() => made.forEach((dir) => rmSync(dir, { recursive: true, force: true })));

const CHOICES = {
  context: { product_type: "application", conformance_level: "AA" },
  patterns: { record_panel: "beside" },
  foundations: { source_color: "#0246ff" },
};
const blueprint = () => ({
  version: 1,
  status: "approved",
  layers: Object.fromEntries(
    LAYERS.map((layer) => [
      layer.id,
      layer.built
        ? { status: "decided", source: "proposed", choice: CHOICES[layer.id], why: "For the test." }
        : { status: "planned" },
    ]),
  ),
});

// The floor a repository is born with, before any design system: its base components, its browser
// test and the packages it runs, taken from this repository but for what the starter kit lays.
const FLOOR_PARTS = [
  "alert",
  "badge",
  "button",
  "card",
  "dialog",
  "empty",
  "input",
  "label",
  "select",
  "skeleton",
  "table",
].map((name) => `src/components/ui/${name}.tsx`);
const FLOOR = [
  ...FLOOR_PARTS,
  "src/index.css",
  "Makefile",
  "package.json",
  "components.json",
  "tests/e2e/routes.ts",
];

const git = (dir, ...args) => {
  const run = spawnSync("git", ["-C", dir, ...args], { encoding: "utf8" });
  assert.equal(run.status, 0, run.stderr);
  return run.stdout;
};

// A repository with the floor and no design system, committed on its main branch, where the build
// of new then runs, as trial 19 ran it.
function bornRepository() {
  const dir = mkdtempSync(path.join(tmpdir(), "design-assembly-starter-"));
  made.push(dir);
  for (const file of FLOOR) {
    mkdirSync(path.dirname(path.join(dir, file)), { recursive: true });
    cpSync(path.join(ROOT, file), path.join(dir, file));
  }
  mkdirSync(path.join(dir, "design"));
  writeFileSync(path.join(dir, "design/blueprint.json"), JSON.stringify(blueprint(), null, 2));
  git(dir, "init", "-q", "-b", "main");
  git(dir, "add", "-A");
  git(
    dir,
    "-c",
    "user.name=Test",
    "-c",
    "user.email=test@example.invalid",
    "commit",
    "-qm",
    "floor",
  );
  return dir;
}

const run = (script, ...args) => spawnSync(execPath, [script, ...args], { encoding: "utf8" });
const build = (dir) => {
  const result = run(APPLY, "--target", dir);
  assert.equal(result.status, 0, result.stderr);
  return result;
};
const text = (dir, file) => readFileSync(path.join(dir, file), "utf8");
const sha = (content) => createHash("sha256").update(content).digest("hex");
const shapesOf = (dir) => runChecks(readState(dir)).find((item) => item.id === "ledger-shapes");
const blocksOf = (dir) =>
  existsSync(path.join(dir, "design/intake.yaml"))
    ? (readIntakeLedger(text(dir, "design/intake.yaml"))?.blocks ?? [])
    : [];

// The pieces of the starter kit the build lays on this floor, by the file each is held by.
const LAID = {
  HeldLabel: "src/components/held-label.tsx",
  WithRecord: "src/components/record-panel.tsx",
  TableActions: "src/components/ui/table-actions.tsx",
  RowActions: "src/components/ui/row-actions.tsx",
  useList: "src/lib/list.ts",
};

test("trial 19: after the build of new lays the starter kit, the gate holds with no question, and each piece carries the starter kit at its pin", () => {
  const dir = bornRepository();
  build(dir);
  const shapes = shapesOf(dir);
  assert.equal(shapes.problem, null);
  const blocks = blocksOf(dir);
  for (const [name, file] of Object.entries(LAID)) {
    const block = blocks.find((each) => each.file === file);
    assert.ok(block, `${file} has no row of the intake ledger`);
    assert.equal(block.name, name);
    assert.equal(block.source, "starter");
    assert.equal(block.from, "starter");
    assert.equal(block.pin, `design-assembly ${VERSION}`);
    assert.equal(block.taken, sha(text(dir, file)), `${file} is held to the file as laid`);
    assert.match(block.approved, /^\d{4}-\d{2}-\d{2}$/);
    assert.equal(block.searched, undefined, "a piece of the starter kit is not made by hand");
  }
  // Nothing waits on the owner because of the pieces: the build asked nothing more.
  assert.doesNotMatch(build(dir).stdout, /create\s+design\/waiting\//);
  // find names its true source, not the repository's own.
  const found = run(FIND, "held label", "--target", dir);
  assert.equal(found.status, 0, found.stderr);
  assert.match(
    found.stdout,
    /HeldLabel \(block, intake\)[^\n]*\n(?: {4}[^\n]*\n)* {4}from: starter starter, pinned design-assembly /,
  );
  assert.doesNotMatch(found.stdout, /source: own/);
});

test("a second build writes no row twice, and a row the ledger has is never written over", () => {
  const dir = bornRepository();
  build(dir);
  const first = text(dir, "design/intake.yaml");
  build(dir);
  assert.equal(text(dir, "design/intake.yaml"), first);
});

test("a repository built before the fix: a piece still as laid is recorded by the next build, one the repository edited is not, and the gate still names it", () => {
  const dir = bornRepository();
  build(dir);
  // As a build of 0.58.0 left it: the pieces laid, no intake ledger.
  rmSync(path.join(dir, "design/intake.yaml"));
  const edited = LAID.HeldLabel;
  writeFileSync(path.join(dir, edited), `${text(dir, edited)}\n// changed by the repository\n`);
  build(dir);
  const blocks = blocksOf(dir);
  assert.ok(blocks.some((block) => block.file === LAID.WithRecord && block.source === "starter"));
  assert.ok(!blocks.some((block) => block.file === edited), "an edited file is not the starter's");
  const shapes = shapesOf(dir);
  assert.match(
    shapes.problem,
    /src\/components\/held-label\.tsx holds HeldLabel, a component this branch adds with no row/,
  );
});

test("a piece the main branch already has stays as it is: the build writes no row, so find and the inventory answer as before", () => {
  const dir = bornRepository();
  build(dir);
  rmSync(path.join(dir, "design/intake.yaml"));
  git(dir, "add", "-A");
  git(
    dir,
    "-c",
    "user.name=Test",
    "-c",
    "user.email=test@example.invalid",
    "commit",
    "-qm",
    "built",
  );
  build(dir);
  assert.deepEqual(blocksOf(dir), []);
  assert.equal(shapesOf(dir).problem, null);
});

test("a piece the list of what came before names is the repository's record already: the build writes no row for it", () => {
  const dir = bornRepository();
  build(dir);
  rmSync(path.join(dir, "design/intake.yaml"));
  writeFileSync(
    path.join(dir, "design/intake.yaml"),
    [
      "version: 1",
      "blocks: []",
      "before:",
      "  - name: HeldLabel",
      `    file: ${LAID.HeldLabel}`,
      "    why: made before the intake ledger was kept",
      "  - name: WithRecord",
      "    file: src/components/elsewhere.tsx",
      "    why: made before the intake ledger was kept",
      "",
    ].join("\n"),
  );
  build(dir);
  const blocks = blocksOf(dir);
  assert.ok(!blocks.some((block) => block.name === "HeldLabel" || block.name === "WithRecord"));
  assert.ok(blocks.some((block) => block.name === "useList" && block.source === "starter"));
});

test("a piece the repository edits after it was laid is still seen: its file no longer matches the hash the row holds", () => {
  const dir = bornRepository();
  build(dir);
  const file = LAID.WithRecord;
  writeFileSync(path.join(dir, file), `${text(dir, file)}\n// changed by the repository\n`);
  const block = blocksOf(dir).find((each) => each.file === file);
  assert.notEqual(block.taken, sha(text(dir, file)));
  const found = run(path.join(PLUGIN, "scripts/inventory.mjs"), "--target", dir);
  assert.match(found.stdout, /modified: src\/components\/record-panel\.tsx\n/);
});

test("choose first is unchanged for a file a person adds: a component with no row is red", () => {
  const dir = bornRepository();
  build(dir);
  writeFileSync(
    path.join(dir, "src/components/status-chip.tsx"),
    "export function StatusChip() {\n  return null;\n}\n",
  );
  const shapes = shapesOf(dir);
  assert.match(shapes.problem, /src\/components\/status-chip\.tsx holds StatusChip/);
});
