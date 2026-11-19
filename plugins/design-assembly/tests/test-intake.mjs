// intake: a block is taken into the store by the ladder of three rungs, and every choice goes
// through the waiting list, so no row of the ledger carries a person's name before a person
// answered (specification 0006, part B3). The repository's own store first; then the starter kit
// or a pinned source, as candidates the owner picks from; then made by hand, with why.
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import {
  chmodSync,
  existsSync,
  lstatSync,
  readdirSync,
  readFileSync,
  writeFileSync,
} from "node:fs";
import path from "node:path";
import { env, execPath } from "node:process";
import { after, test } from "node:test";
import { fileURLToPath } from "node:url";

import { shapeProblems } from "../templates/tools/design-assembly/contract.mjs";
import { readIntakeLedger } from "../templates/tools/design-assembly/intake-ledger.mjs";
import { ledgerText } from "../templates/tools/design-assembly/screen-fragments.mjs";
import { readWaiting } from "../templates/tools/design-assembly/waiting.mjs";
import { VERSION } from "../scripts/stamp.mjs";
import {
  BLOCKS,
  block,
  cleanUp,
  COMPONENT,
  empty,
  healthyFiles,
  json,
  put,
  repo,
  sha,
} from "./helpers/store-repo.mjs";

const PLUGIN = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const INTAKE = path.join(PLUGIN, "scripts/intake.mjs");
const DECIDE = path.join(PLUGIN, "scripts/decide.mjs");
const INVENTORY = path.join(PLUGIN, "scripts/inventory.mjs");
// The day of the answer is not today: the row carries the answer's day, never the clock's.
const OWNER = ["--by", "The Owner", "--on", "2026-11-18"];

after(cleanUp);

const text = (dir, file) => readFileSync(path.join(dir, file), "utf8");
const data = (dir, file) => JSON.parse(text(dir, file));
const node = (script, args, options = {}) =>
  spawnSync(execPath, [script, ...args], { encoding: "utf8", ...options });
const intake = (dir, ...args) => node(INTAKE, ["--target", dir, ...args]);
const intakeJson = (dir, ...args) => {
  const run = intake(dir, ...args, "--json");
  return {
    status: run.status,
    stderr: run.stderr,
    result: run.stdout ? JSON.parse(run.stdout) : null,
  };
};
// The owner's answer, written the one way an answer is written: through the decision sheet.
function answer(dir, line) {
  const file = path.join(empty(), "answers.txt");
  writeFileSync(file, `${line}\n`);
  const run = node(DECIDE, ["--target", dir, "--answers", file, ...OWNER]);
  assert.equal(run.status === 0 || run.status === 1, true, run.stderr);
}

// Every file of a folder with the hash of its bytes.
function snapshot(dir, at = "") {
  return readdirSync(path.join(dir, at))
    .sort()
    .flatMap((name) => {
      const relative = path.posix.join(at, name);
      const full = path.join(dir, relative);
      if (lstatSync(full).isDirectory()) return [`${relative}/`, ...snapshot(dir, relative)];
      return [`${relative} ${createHash("sha256").update(readFileSync(full)).digest("hex")}`];
    });
}
// The files new or changed between two snapshots.
const changed = (before, now) =>
  now
    .filter((line) => !line.endsWith("/") && !before.includes(line))
    .map((line) => line.slice(0, line.lastIndexOf(" ")))
    .sort();

const THEME = json({ version: 1, checks: {} });
// The repository of the store's tests, taken in by the plugin: it has tool data.
const store = (files = {}) => repo({ ...healthyFiles(), "design/theme.json": THEME, ...files });
const ledger = (dir, file = "design/intake.yaml") =>
  readIntakeLedger(ledgerText(dir, file, "intake"));
const blocksOf = (dir, file) => ledger(dir, file).blocks;
const shapeOf = (dir, file = "design/intake.yaml") =>
  shapeProblems("intake", ledgerText(dir, file, "intake"), file);
const NO_NAME = /approved|The Owner/;

test("rung one: a block the ledger keeps for the need is the answer, and nothing is written", () => {
  const dir = store();
  const before = snapshot(dir);
  const { status, result } = intakeJson(dir, "--need", "many-rows");
  assert.equal(status, 0);
  assert.equal(result.rung, "store");
  assert.equal(result.row.name, "DataRegion");
  assert.equal(result.row.file, "src/components/data-region.tsx");
  assert.deepEqual(result.files, []);
  assert.equal(result.waiting, null);
  assert.deepEqual(snapshot(dir), before);
});

test("rung two: no block for the need, so the candidates go to the waiting list and the ledger is not touched", () => {
  const dir = store();
  const before = snapshot(dir);
  const { status, result } = intakeJson(dir, "--need", "narrow-list", "filter", "bar");
  assert.equal(status, 1);
  assert.equal(result.rung, "external");
  assert.equal(result.waiting, "intake-narrow-list");
  assert.deepEqual(changed(before, snapshot(dir)), ["design/waiting/intake-narrow-list.json"]);
  assert.deepEqual(
    result.files.map((item) => item.path),
    ["design/waiting/intake-narrow-list.json"],
  );
  const question = data(dir, "design/waiting/intake-narrow-list.json");
  assert.equal(question.item, "need:narrow-list");
  assert.equal(question.hard_to_undo, false);
  assert.deepEqual(
    question.candidates.map((item) => item.name),
    ["filter-bar", "by-hand"],
  );
  const [first] = question.candidates;
  assert.equal(first.store, "sources/kit");
  assert.equal(first.install, "npx add-from-kit filter-bar");
  assert.match(question.recommendation, /filter-bar/);
  assert.doesNotMatch(JSON.stringify(question), NO_NAME);
  // A block of the repository that holds the words under another need is near, never taken for it.
  assert.deepEqual(
    result.near.map((item) => item.name),
    ["FilterBar"],
  );
  // The gate reads the question.
  assert.equal(readWaiting(dir).rows.length, 1);
});

test("no row carries a person's name before a person answered: calling again only says it waits", () => {
  const dir = store();
  intake(dir, "--need", "narrow-list", "filter", "bar");
  const before = snapshot(dir);
  for (let time = 0; time < 2; time += 1) {
    const { status, result } = intakeJson(dir, "--need", "narrow-list", "filter", "bar");
    assert.equal(status, 1);
    assert.equal(result.row, null);
    assert.match(result.next, /waits on the owner/);
  }
  assert.deepEqual(snapshot(dir), before);
  assert.equal(blocksOf(dir).length, BLOCKS.length);
});

test("after the owner keeps an outside candidate: its install line is given, never run, and the row waits for the file", () => {
  const dir = store();
  intake(dir, "--need", "narrow-list", "filter", "bar");
  answer(dir, "intake-narrow-list giữ");
  // A stand-in for the install line's program, which leaves a mark if anything runs it.
  const bin = empty();
  const mark = path.join(bin, "ran");
  writeFileSync(path.join(bin, "npx"), `#!/bin/sh\ntouch ${mark}\n`);
  chmodSync(path.join(bin, "npx"), 0o755);
  const before = snapshot(dir);
  const run = node(INTAKE, ["--target", dir, "--need", "narrow-list", "--json"], {
    env: { ...env, PATH: `${bin}${path.delimiter}${env.PATH}` },
  });
  assert.equal(run.status, 1, run.stderr);
  const result = JSON.parse(run.stdout);
  assert.equal(result.chosen.name, "filter-bar");
  assert.equal(result.install, "npx add-from-kit filter-bar");
  assert.match(result.next, /--file/);
  assert.equal(existsSync(mark), false);
  assert.deepEqual(snapshot(dir), before);
});

test("with the file on disk, the row is written with the name and the day of the answer, and the hash of the file", () => {
  const dir = store();
  intake(dir, "--need", "narrow-list", "filter", "bar");
  answer(dir, "intake-narrow-list giữ");
  const code = COMPONENT("NarrowList");
  put(dir, "src/components/narrow-list.tsx", code);
  const before = snapshot(dir);
  const { status, result } = intakeJson(
    dir,
    "--need",
    "narrow-list",
    "--file",
    "src/components/narrow-list.tsx",
  );
  assert.equal(status, 0);
  assert.equal(result.rung, "external");
  assert.deepEqual(changed(before, snapshot(dir)), ["design/intake.yaml"]);
  const row = blocksOf(dir).find((item) => item.need === "narrow-list");
  assert.deepEqual(row, {
    name: "NarrowList",
    file: "src/components/narrow-list.tsx",
    source: "filter-bar",
    from: "kit",
    pin: "2026-11-11T01:42:13.053Z",
    need: "narrow-list",
    description: "Narrow a list",
    approved: "2026-11-18",
    approved_by: "The Owner",
    taken: sha(code),
  });
  assert.deepEqual(result.row, row);
  assert.deepEqual(shapeOf(dir), []);
  // Every block that was there is still there, as it was.
  assert.deepEqual(blocksOf(dir).slice(0, BLOCKS.length), ledger(repo(healthyFiles())).blocks);
});

test("the second time the same need is asked, nobody is called: rung one, and nothing changes", () => {
  const dir = store();
  intake(dir, "--need", "narrow-list", "filter", "bar");
  answer(dir, "intake-narrow-list giữ");
  put(dir, "src/components/narrow-list.tsx", COMPONENT("NarrowList"));
  intake(dir, "--need", "narrow-list", "--file", "src/components/narrow-list.tsx");
  const before = snapshot(dir);
  const { status, result } = intakeJson(dir, "--need", "narrow-list");
  assert.equal(status, 0);
  assert.equal(result.rung, "store");
  assert.equal(result.waiting, null);
  assert.deepEqual(snapshot(dir), before);
});

test("the starter kit: once kept, its templates are copied where the guide puts them, and the row says it came from the kit", () => {
  const dir = store();
  const { status, result } = intakeJson(dir, "--need", "label-while-action-waits");
  assert.equal(status, 1);
  assert.equal(result.rung, "starter");
  assert.equal(result.candidates[0].name, "HeldLabel");
  assert.deepEqual(result.candidates[0].to, [
    "src/components/held-label.tsx",
    "tests/held-label.test.tsx",
  ]);
  answer(dir, "intake-label-while-action-waits giữ");
  const before = snapshot(dir);
  const preview = intakeJson(dir, "--need", "label-while-action-waits", "--dry-run");
  assert.equal(preview.status, 0);
  assert.deepEqual(snapshot(dir), before);
  const real = intakeJson(dir, "--need", "label-while-action-waits");
  assert.equal(real.status, 0, real.stderr);
  const written = changed(before, snapshot(dir));
  assert.deepEqual(written, [
    "design/intake.yaml",
    "src/components/held-label.tsx",
    "tests/held-label.test.tsx",
  ]);
  // The preview named exactly the files the real run wrote.
  assert.deepEqual(preview.result.files.map((item) => item.path).sort(), written);
  const template = readFileSync(
    path.join(PLUGIN, "templates/owned/held-label.tsx.template"),
    "utf8",
  );
  assert.equal(text(dir, "src/components/held-label.tsx"), template);
  const row = blocksOf(dir).find((item) => item.need === "label-while-action-waits");
  assert.equal(row.source, "HeldLabel");
  assert.equal(row.from, "starter");
  assert.equal(row.pin, `design-assembly ${VERSION}`);
  assert.equal(row.taken, sha(template));
  assert.equal(row.approved_by, "The Owner");
  assert.deepEqual(shapeOf(dir), []);
  // The inventory reads it as taken from the kit and unchanged.
  const stock = JSON.parse(node(INVENTORY, ["--target", dir, "--json"]).stdout);
  assert.equal(stock.findings.filter((item) => item.kind === "modified").length, 0);
});

test("a starter template is never written over a file of the repository's own, and one already there as the template is only recorded", () => {
  const dir = store();
  intake(dir, "--need", "label-while-action-waits");
  answer(dir, "intake-label-while-action-waits giữ");
  put(dir, "tests/held-label.test.tsx", "// the repository's own test\n");
  const before = snapshot(dir);
  const run = intake(dir, "--need", "label-while-action-waits");
  assert.equal(run.status, 2);
  assert.match(run.stderr, /tests\/held-label\.test\.tsx/);
  assert.deepEqual(snapshot(dir), before);
  // The same files as the templates, put there by the guide: only the row is written.
  for (const [template, file] of [
    ["held-label.tsx.template", "src/components/held-label.tsx"],
    ["held-label.test.tsx.template", "tests/held-label.test.tsx"],
  ]) {
    put(dir, file, readFileSync(path.join(PLUGIN, "templates/owned", template), "utf8"));
  }
  const again = snapshot(dir);
  const { status } = intakeJson(dir, "--need", "label-while-action-waits");
  assert.equal(status, 0);
  assert.deepEqual(changed(again, snapshot(dir)), ["design/intake.yaml"]);
});

test("rung three, made by hand: the reason is printed as given, and the file is named once the owner keeps it", () => {
  const dir = store();
  const why = "Ghép tay nhanh hơn";
  const { status, result } = intakeJson(dir, "--need", "status-line", "--by-hand", "--why", why);
  assert.equal(status, 1);
  assert.equal(result.rung, "by-hand");
  const question = data(dir, "design/waiting/intake-status-line.json");
  assert.equal(question.recommendation, "make it by hand");
  assert.match(question.basis, new RegExp(why));
  assert.equal(question.candidates.at(-1).name, "by-hand");
  // Asked by hand where a store has a candidate: by hand comes first, so keeping takes it.
  const chosen = store();
  intake(chosen, "--need", "narrow-list", "filter", "bar", "--by-hand", "--why", why);
  const asked = data(chosen, "design/waiting/intake-narrow-list.json");
  assert.deepEqual(
    asked.candidates.map((item) => item.name),
    ["by-hand", "filter-bar"],
  );
  answer(dir, "intake-status-line giữ");
  const waiting = intakeJson(dir, "--need", "status-line");
  assert.equal(waiting.status, 1);
  assert.match(waiting.result.next, /--file/);
  const missing = intake(dir, "--need", "status-line", "--file", "src/components/nowhere.tsx");
  assert.equal(missing.status, 2);
  put(dir, "src/components/status-line.tsx", COMPONENT("StatusLine"));
  const done = intakeJson(dir, "--need", "status-line", "--file", "src/components/status-line.tsx");
  assert.equal(done.status, 0, done.stderr);
  const row = blocksOf(dir).find((item) => item.need === "status-line");
  assert.equal(row.name, "StatusLine");
  assert.equal(row.source, "by-hand");
  assert.equal(row.from, undefined);
  assert.equal(row.description, why);
  assert.deepEqual(shapeOf(dir), []);
});

test("no candidate at all: the question is made by hand, and says the stores that were searched", () => {
  const dir = store();
  const { status, result } = intakeJson(dir, "--need", "weather-map", "weather", "map");
  assert.equal(status, 1);
  assert.equal(result.rung, "by-hand");
  assert.deepEqual(
    result.candidates.map((item) => item.name),
    ["by-hand"],
  );
  assert.match(data(dir, "design/waiting/intake-weather-map.json").basis, /starter|source/);
});

test("the owner's answer names another candidate, or refuses: the row follows it, or nothing is written", () => {
  const dir = store();
  intake(dir, "--need", "narrow-list", "filter", "bar");
  answer(dir, "intake-narrow-list by-hand");
  put(dir, "src/components/narrow-list.tsx", COMPONENT("NarrowList"));
  const { status } = intakeJson(
    dir,
    "--need",
    "narrow-list",
    "--file",
    "src/components/narrow-list.tsx",
  );
  assert.equal(status, 0);
  assert.equal(blocksOf(dir).find((item) => item.need === "narrow-list").source, "by-hand");

  const refused = store();
  intake(refused, "--need", "narrow-list", "filter", "bar");
  answer(refused, "intake-narrow-list bác the list needs no filter");
  put(refused, "src/components/narrow-list.tsx", COMPONENT("NarrowList"));
  const before = snapshot(refused);
  const run = intakeJson(
    refused,
    "--need",
    "narrow-list",
    "--file",
    "src/components/narrow-list.tsx",
  );
  assert.equal(run.status, 1);
  assert.match(run.result.next, /refused.*the list needs no filter/);
  assert.deepEqual(snapshot(refused), before);
});

test("a repository with no intake ledger gets one file, design/intake.yaml, that the gate reads", () => {
  const files = healthyFiles();
  delete files["design/intake.yaml"];
  const dir = repo({ ...files, "design/theme.json": THEME });
  intake(dir, "--need", "narrow-list", "filter", "bar");
  answer(dir, "intake-narrow-list giữ");
  put(dir, "src/components/narrow-list.tsx", COMPONENT("NarrowList"));
  const { status, result } = intakeJson(
    dir,
    "--need",
    "narrow-list",
    "--file",
    "src/components/narrow-list.tsx",
  );
  assert.equal(status, 0);
  assert.deepEqual(
    result.files.map((item) => [item.path, item.change]),
    [["design/intake.yaml", "create"]],
  );
  assert.deepEqual(shapeOf(dir), []);
  assert.deepEqual(
    blocksOf(dir).map((item) => item.need),
    ["narrow-list"],
  );
});

test("a ledger kept as one file per block gets one new file, named after the need, and nothing else changes", () => {
  const files = healthyFiles();
  delete files["design/intake.yaml"];
  const dir = repo({
    ...files,
    "design/theme.json": THEME,
    "design/intake/_shared.yaml": "version: 1\n",
  });
  // Each block as its own file: the entry's lines, no longer under the list.
  for (const said of BLOCKS) {
    const entry = block(said)
      .replace(/^ {2}- /, "")
      .replace(/^ {4}/gm, "");
    put(dir, `design/intake/${said.need}.yaml`, `${entry}\n`);
  }
  assert.equal(blocksOf(dir).length, BLOCKS.length);
  intake(dir, "--need", "narrow-list", "filter", "bar");
  answer(dir, "intake-narrow-list giữ");
  put(dir, "src/components/narrow-list.tsx", COMPONENT("NarrowList"));
  const before = snapshot(dir);
  const { status } = intakeJson(
    dir,
    "--need",
    "narrow-list",
    "--file",
    "src/components/narrow-list.tsx",
  );
  assert.equal(status, 0);
  assert.deepEqual(changed(before, snapshot(dir)), ["design/intake/narrow-list.yaml"]);
  assert.deepEqual(shapeOf(dir), []);
  assert.equal(blocksOf(dir).find((item) => item.need === "narrow-list").approved, "2026-11-18");
});

test("a ledger in the repository's own words is written in those words, and read back in the contract's", () => {
  const own = [
    "version: 1",
    "keys: { blocks: khoi, name: ten, file: tep, source: nguon, need: nhu_cau, approved: duyet, approved_by: nguoi_duyet, description: mo_ta, from: tu, pin: ghim, taken: bam }",
    "values: { by-hand: tao-tay }",
    "khoi:",
    "  - ten: DataRegion",
    "    tep: src/components/data-region.tsx",
    "    nguon: tao-tay",
    "    nhu_cau: many-rows",
    "    duyet: 2026-11-12",
    "",
  ].join("\n");
  const dir = store({ "design/intake.yaml": own });
  intake(dir, "--need", "status-line", "--by-hand", "--why", "No store has one");
  answer(dir, "intake-status-line giữ");
  put(dir, "src/components/status-line.tsx", COMPONENT("StatusLine"));
  const { status } = intakeJson(
    dir,
    "--need",
    "status-line",
    "--file",
    "src/components/status-line.tsx",
  );
  assert.equal(status, 0);
  const written = text(dir, "design/intake.yaml");
  assert.match(written, /^ {2}- ten: StatusLine$/m);
  assert.match(written, /^ {4}nguon: tao-tay$/m);
  assert.match(written, /^ {4}nguoi_duyet: The Owner$/m);
  assert.doesNotMatch(written, /^\s+(approved_by|source):/m);
  const row = blocksOf(dir).find((item) => item.need === "status-line");
  assert.equal(row.source, "tao-tay");
  assert.equal(row.approved_by, "The Owner");
  assert.deepEqual(shapeOf(dir), []);
});

test("what came before the ledger: proposed once, kept by the owner, then listed, so the inventory finds nothing unrecorded", () => {
  const files = healthyFiles();
  const dir = repo({
    ...files,
    "design/theme.json": THEME,
    "design/intake.yaml": "version: 1\nblocks:\n" + BLOCKS.map(block).join("\n") + "\n",
  });
  const unrecorded = () =>
    JSON.parse(node(INVENTORY, ["--target", dir, "--json"]).stdout).findings.filter(
      (item) => item.kind === "unrecorded",
    );
  assert.equal(unrecorded().length, 1);
  const before = snapshot(dir);
  const asked = intakeJson(dir, "--before");
  assert.equal(asked.status, 1);
  assert.equal(asked.result.rung, "before");
  assert.equal(asked.result.waiting, "intake-before");
  assert.deepEqual(changed(before, snapshot(dir)), ["design/waiting/intake-before.json"]);
  const question = data(dir, "design/waiting/intake-before.json");
  assert.equal(question.item, "before:intake");
  assert.deepEqual(
    question.candidates.map((item) => [item.name, item.file]),
    [["AppFrame", "src/components/app-frame.tsx"]],
  );
  assert.doesNotMatch(JSON.stringify(question), NO_NAME);
  answer(dir, "intake-before giữ");
  const kept = snapshot(dir);
  const { status, result } = intakeJson(dir, "--before");
  assert.equal(status, 0, JSON.stringify(result));
  assert.deepEqual(changed(kept, snapshot(dir)), ["design/intake.yaml"]);
  assert.deepEqual(ledger(dir).before, [
    {
      name: "AppFrame",
      file: "src/components/app-frame.tsx",
      why: "made before the intake ledger was kept",
      approved: "2026-11-18",
      approved_by: "The Owner",
    },
  ]);
  assert.deepEqual(shapeOf(dir), []);
  assert.deepEqual(unrecorded(), []);
  // Asked again, nothing is left to list, and nothing changes.
  const listed = snapshot(dir);
  assert.equal(intake(dir, "--before").status, 0);
  assert.deepEqual(snapshot(dir), listed);
});

test("the waiting list kept as one shared file, a ledger a newer plugin wrote, or an older tool: nothing is written", () => {
  const shared = store({
    "design/waiting-list.json": json({ version: 1, rows: [] }),
  });
  let before = snapshot(shared);
  let run = intake(shared, "--need", "narrow-list", "filter", "bar");
  assert.equal(run.status, 2);
  assert.match(run.stderr, /split/);
  assert.deepEqual(snapshot(shared), before);

  const newer = store({ "design/intake.yaml": "version: 9\nblocks: []\n" });
  before = snapshot(newer);
  run = intake(newer, "--need", "narrow-list", "filter", "bar");
  assert.equal(run.status, 2);
  assert.deepEqual(snapshot(newer), before);

  // A tool copied in before questions carried candidates would read the question as broken.
  const older = store({
    "design/tool-stamp.json": json({ version: "0.11.0", tree: "0".repeat(40) }),
  });
  before = snapshot(older);
  run = intake(older, "--need", "narrow-list", "filter", "bar");
  assert.equal(run.status, 2);
  assert.match(run.stderr, /upgrade/);
  assert.deepEqual(snapshot(older), before);
});

test("a retired or merged block keeps its need: a new one is asked for under another key", () => {
  const retired = store({
    "design/intake.yaml": `version: 1\nblocks:\n${block({ ...BLOCKS[1], retired: true })}\n`,
  });
  const run = intake(retired, "--need", "filter-list");
  assert.equal(run.status, 2);
  assert.match(run.stderr, /retired/);
});

test("a repository the plugin has not taken in: the question is written, and the command says no gate holds it yet", () => {
  const dir = repo({ "package.json": json({ name: "bare" }) });
  const { status, result, stderr } = intakeJson(dir, "--need", "weather-map");
  assert.equal(status, 1, stderr);
  assert.equal(result.rung, "by-hand");
  assert.match(result.notes.join(" "), /no gate/);
  assert.equal(existsSync(path.join(dir, "design/waiting/intake-weather-map.json")), true);
});

test("a wrong call ends with 2, prints no answer, and writes nothing", () => {
  const dir = store();
  const before = snapshot(dir);
  for (const args of [
    [],
    ["--need"],
    ["--need", "Narrow List"],
    ["--need", "narrow-list", "--why", "because"],
    ["--need", "narrow-list", "--by-hand"],
    ["--need", "narrow-list", "--before"],
    ["--before", "--file", "src/x.tsx"],
    ["--need", "narrow-list", "--kind", "screen-kind"],
    ["--need", "narrow-list", "--file", "../outside.tsx"],
  ]) {
    const run = intake(dir, ...args, "--json");
    assert.equal(run.status, 2, `${args.join(" ")}: ${run.stdout}`);
    assert.equal(run.stdout, "", args.join(" "));
    assert.doesNotMatch(run.stderr, /\n\s+at /, args.join(" "));
  }
  assert.deepEqual(snapshot(dir), before);
});

test("the same repository and the same call give the same answer twice", () => {
  const dir = store();
  const first = intake(dir, "--need", "many-rows", "--json").stdout;
  assert.equal(intake(dir, "--need", "many-rows", "--json").stdout, first);
  const preview = intake(
    dir,
    "--need",
    "narrow-list",
    "filter",
    "bar",
    "--dry-run",
    "--json",
  ).stdout;
  assert.equal(
    intake(dir, "--need", "narrow-list", "filter", "bar", "--dry-run", "--json").stdout,
    preview,
  );
});

test("a ledger the writer cannot add to so that it reads back the same is never written: a list key given twice", () => {
  // The reader keeps the last of two lists of one name; a block added to the first would be lost.
  const twice = `version: 1\nblocks:\n${block(BLOCKS[0])}\nblocks:\n${block(BLOCKS[1])}\n`;
  const dir = store({ "design/intake.yaml": twice });
  intake(dir, "--need", "status-line", "--by-hand", "--why", "No store has one");
  answer(dir, "intake-status-line giữ");
  put(dir, "src/components/status-line.tsx", COMPONENT("StatusLine"));
  const before = snapshot(dir);
  const run = intake(dir, "--need", "status-line", "--file", "src/components/status-line.tsx");
  assert.equal(run.status, 2);
  assert.match(run.stderr, /would not read back/);
  assert.deepEqual(snapshot(dir), before);
});

test("what came before: the owner may list only some, and the rest stay out of the list", () => {
  const files = healthyFiles();
  const dir = repo({
    ...files,
    "design/theme.json": THEME,
    "design/intake.yaml": "version: 1\nblocks:\n" + BLOCKS.map(block).join("\n") + "\n",
    "src/components/badge-line.tsx": COMPONENT("BadgeLine"),
    "src/pages/Team.tsx": `import { BadgeLine } from "@/components/badge-line";\n${files["src/pages/Team.tsx"]}`,
  });
  intake(dir, "--before");
  const question = data(dir, "design/waiting/intake-before.json");
  assert.deepEqual(
    question.candidates.map((item) => item.name),
    ["AppFrame", "BadgeLine"],
  );
  answer(dir, "intake-before AppFrame");
  const { status, result } = intakeJson(dir, "--before");
  assert.equal(status, 0, JSON.stringify(result));
  assert.deepEqual(
    ledger(dir).before.map((item) => item.name),
    ["AppFrame"],
  );
  assert.match(result.next, /BadgeLine.*not listed/);
});

test("a reason the ledger cannot keep is refused when asked, before the owner answers for it", () => {
  const dir = store();
  const before = snapshot(dir);
  for (const why of ["two\nlines", `# both " and '`, "null"]) {
    const run = intake(dir, "--need", "status-line", "--by-hand", "--why", why);
    assert.equal(run.status, 2, why);
    assert.match(run.stderr, /--why/);
  }
  assert.deepEqual(snapshot(dir), before);
});

test("after a refusal the need is asked again only with something new: other words, or by hand", () => {
  const dir = store();
  intake(dir, "--need", "narrow-list", "filter", "bar");
  answer(dir, "intake-narrow-list bác none of these");
  const same = snapshot(dir);
  assert.equal(intake(dir, "--need", "narrow-list", "filter", "bar").status, 1);
  assert.deepEqual(snapshot(dir), same);
  const again = intakeJson(
    dir,
    "--need",
    "narrow-list",
    "--by-hand",
    "--why",
    "A filter of our own",
  );
  assert.equal(again.status, 1);
  assert.equal(again.result.waiting, "intake-narrow-list-2");
  assert.deepEqual(changed(same, snapshot(dir)), ["design/waiting/intake-narrow-list-2.json"]);
  // The refused question stays as it was.
  assert.equal(data(dir, "design/waiting/intake-narrow-list.json").answer, "refuse");
  answer(dir, "intake-narrow-list-2 giữ");
  put(dir, "src/components/narrow-list.tsx", COMPONENT("NarrowList"));
  const done = intakeJson(dir, "--need", "narrow-list", "--file", "src/components/narrow-list.tsx");
  assert.equal(done.status, 0, done.stderr);
  assert.equal(done.result.row.source, "by-hand");
});

test("rung one answers whatever the waiting list holds: kept as one file, or a question that cannot be read", () => {
  for (const extra of [
    { "design/waiting-list.json": json({ version: 1, rows: [] }) },
    { "design/waiting/broken.json": "{" },
  ]) {
    const dir = store(extra);
    const { status, result } = intakeJson(dir, "--need", "many-rows");
    assert.equal(status, 0, JSON.stringify(extra));
    assert.equal(result.rung, "store");
  }
});

test("what came before a ledger the tool data names otherwise is asked about under that ledger's name", () => {
  const files = healthyFiles();
  delete files["design/intake.yaml"];
  const named = "design/Store_Ledger.yaml";
  const dir = repo({
    ...files,
    "design/theme.json": json({
      version: 1,
      checks: { "ledger-shapes": [{ kind: "ledger-shapes", ledgers: { intake: named } }] },
    }),
    [named]: "version: 1\nblocks:\n" + BLOCKS.map(block).join("\n") + "\n",
  });
  const { status, result } = intakeJson(dir, "--before");
  assert.equal(status, 1, JSON.stringify(result));
  assert.equal(data(dir, "design/waiting/intake-before.json").item, "before:store-ledger");
});

test("a question about a need with no candidates says so, and nothing is written", () => {
  const dir = store({
    "design/waiting/intake-foo.json": json({
      id: "intake-foo",
      question: "Which block?",
      item: "need:foo",
      answer: "keep",
      by: "The Owner",
      on: "2026-11-18",
    }),
  });
  const before = snapshot(dir);
  const run = intake(dir, "--need", "foo");
  assert.equal(run.status, 2);
  assert.match(run.stderr, /no candidates/);
  assert.deepEqual(snapshot(dir), before);
});
