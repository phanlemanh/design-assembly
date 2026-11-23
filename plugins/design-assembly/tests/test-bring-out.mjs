// The bridge out (specification 0014, criteria 10 and 14): the design ledgers of a repository
// written out for tools that do not read them, a DESIGN.md first and a design system bundle (a
// README, tokens of both themes, type, spacing, corners, the components and the assets) second,
// each stamped with the state of the ledgers it was written from; the gate goes red when a ledger
// changes and an export is not written again. Every run is on a copy; nothing calls the network.
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
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

import { candidateFrom } from "../scripts/bring-in.mjs";
import { bringOut } from "../scripts/bring-out.mjs";
import { readState, runChecks } from "../templates/tools/design-assembly/check.mjs";
import {
  designMdProblems,
  DESIGN_MD,
  SYSTEM_FOLDER,
  stampIn,
} from "../templates/tools/design-assembly/exports.mjs";

const PLUGIN = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const ROOT = path.resolve(PLUGIN, "../..");
const BRING_OUT = path.join(PLUGIN, "scripts/bring-out.mjs");
const LEDGERS = [
  "design/tokens.json",
  "design/blueprint.json",
  "design/theme.json",
  "design/component-registry.json",
  "design/sources",
  "design/decisions.yaml",
];

const made = [];
after(() => made.forEach((dir) => rmSync(dir, { recursive: true, force: true })));
const read = (dir, file) => readFileSync(path.join(dir, file), "utf8");
const put = (dir, file, text) => {
  mkdirSync(path.dirname(path.join(dir, file)), { recursive: true });
  writeFileSync(path.join(dir, file), text);
};
const cli = (...args) => spawnSync(execPath, [BRING_OUT, ...args], { encoding: "utf8" });

// A copy of this repository's ledgers, its stylesheet and its tool, without its exports.
function copyRepo() {
  const dir = mkdtempSync(path.join(tmpdir(), "design-bring-out-"));
  made.push(dir);
  for (const file of [...LEDGERS, "src/index.css", "tools/design-assembly", "Makefile", "mk"]) {
    if (existsSync(path.join(ROOT, file)))
      cpSync(path.join(ROOT, file), path.join(dir, file), { recursive: true });
  }
  put(dir, "package.json", `${JSON.stringify({ name: "fixture-product" })}\n`);
  const theme = JSON.parse(read(dir, "design/theme.json"));
  delete theme.checks["design-exports"];
  put(dir, "design/theme.json", `${JSON.stringify(theme, null, 2)}\n`);
  put(
    dir,
    "design/decisions.yaml",
    read(dir, "design/decisions.yaml").replace(/ {2}- id: design-exports\n(?: {4}.*\n)*/, ""),
  );
  rmSync(path.join(dir, DESIGN_MD), { force: true });
  rmSync(path.join(dir, SYSTEM_FOLDER), { recursive: true, force: true });
  return dir;
}
const exportsCheck = (dir) =>
  runChecks(readState(dir)).find((item) => item.id === "design-exports");

test("criterion 10: the DESIGN.md is written from the ledgers, stamped, and reads as its specification says", () => {
  const dir = copyRepo();
  const result = bringOut(dir, { dryRun: false });
  const text = read(dir, DESIGN_MD);
  assert.ok(result.files.some((file) => file.path === DESIGN_MD));
  assert.match(text, /^---\nversion: alpha\nname: "fixture-product"\n/);
  assert.match(text, /^ {2}primary: "#0246ff"$/m);
  // A role that follows another is a reference to it, as the ledger holds it.
  assert.match(text, /^ {2}sidebar-primary: "\{colors\.primary\}"$/m);
  assert.match(text, /^ {2}dark:$/m);
  assert.match(text, /^ {2}base: 10px$/m);
  assert.match(text, /^ {2}unit: "4px"$/m);
  const stamp = stampIn(text);
  assert.match(stamp, /^[0-9a-f]{12}$/);
  assert.deepEqual(designMdProblems(text), []);
  // The sections stand in the order the specification fixes.
  const headings = [...text.matchAll(/^## (.+)$/gm)].map((match) => match[1]);
  assert.deepEqual(headings, [
    "Overview",
    "Colors",
    "Typography",
    "Layout",
    "Shapes",
    "Do's and Don'ts",
  ]);
  // A file that breaks the specification is named with what is wrong.
  assert.equal(
    designMdProblems(text.replace('  primary: "#0246ff"\n', ""))[0],
    "DESIGN.md: its colours have no primary",
  );
  assert.deepEqual(
    designMdProblems(text.replace('"{colors.primary}"', '"{colors.nowhere}"')).slice(0, 1),
    ["DESIGN.md: colors.sidebar-primary refers to {colors.nowhere}, which is no token"],
  );
});

test("criterion 10, broken: a ledger changed and the DESIGN.md not written again turns the gate red, naming both states", () => {
  const dir = copyRepo();
  bringOut(dir, { dryRun: false });
  const held = exportsCheck(dir);
  assert.equal(held.problem, null);
  assert.equal(held.seenFailing, true);
  const stamp = stampIn(read(dir, DESIGN_MD));
  const tokens = JSON.parse(read(dir, "design/tokens.json"));
  tokens.color.primary.$value = "#cc0000";
  put(dir, "design/tokens.json", `${JSON.stringify(tokens, null, 2)}\n`);
  const stale = exportsCheck(dir);
  assert.match(
    stale.problem,
    new RegExp(
      `DESIGN\\.md was written from the design ledgers at ${stamp}; they are now at [0-9a-f]{12}: write it again with make design-exports`,
    ),
  );
  // Written again, the gate is green.
  bringOut(dir, { dryRun: false });
  assert.equal(exportsCheck(dir).problem, null);
});

test("criterion 14: the system bundle holds a README, tokens of both themes, type, spacing, corners, the components listed and the fonts", () => {
  const dir = copyRepo();
  bringOut(dir, { dryRun: false });
  for (const file of ["README.md", "tokens.json", "components.md", "assets.json"]) {
    assert.ok(existsSync(path.join(dir, SYSTEM_FOLDER, file)), file);
  }
  const tokens = JSON.parse(read(dir, `${SYSTEM_FOLDER}/tokens.json`));
  assert.equal(tokens.color.primary.$value, "#0246ff");
  assert.match(tokens.color.dark.primary.$value, /^#[0-9a-f]{6}/);
  assert.equal(tokens.color["sidebar-primary"].$value, "{color.primary}");
  assert.equal(tokens.radius.base.$value, "10px");
  assert.equal(tokens.spacing.unit.$value, "4px");
  assert.equal(tokens.font.size.base.$value, "16px");
  assert.equal(tokens.font.family.body.$value, "Geist Variable");
  assert.match(tokens.$description, /written from the design ledgers at [0-9a-f]{12}/i);
  assert.match(read(dir, `${SYSTEM_FOLDER}/README.md`), /^# fixture-product\n/);
  assert.match(read(dir, `${SYSTEM_FOLDER}/components.md`), /\bItemList\b/);
  const assets = JSON.parse(read(dir, `${SYSTEM_FOLDER}/assets.json`));
  assert.equal(assets.fonts[0].family, "Geist Variable");
  // What goes out comes back in as the ledger holds it: the bridge in reads the bundle to the
  // owner's own values, so a copy made elsewhere from it starts where the ledger is.
  const back = candidateFrom(path.join(dir, SYSTEM_FOLDER));
  assert.deepEqual(back.values, {
    source_color: "#0246ff",
    type_scale: "standard",
    corner_radius: "floor",
  });
  assert.equal(back.name, "fixture-product");
});

test("criterion 14, broken: a bundle file changed by hand, or left behind a ledger, turns the gate red with its name", () => {
  const dir = copyRepo();
  bringOut(dir, { dryRun: false });
  const file = `${SYSTEM_FOLDER}/tokens.json`;
  const tokens = JSON.parse(read(dir, file));
  tokens.color.primary.$value = "#123456";
  put(dir, file, `${JSON.stringify(tokens, null, 2)}\n`);
  assert.match(
    exportsCheck(dir).problem,
    new RegExp(`${file.replaceAll(".", "\\.")} differs from what the design ledgers give`),
  );
  bringOut(dir, { dryRun: false });
  const registry = JSON.parse(read(dir, "design/component-registry.json"));
  registry.components = registry.components.slice(1);
  put(dir, "design/component-registry.json", `${JSON.stringify(registry, null, 2)}\n`);
  assert.match(exportsCheck(dir).problem, /components\.md was written from the design ledgers at/);
});

test("the command: written once, then nothing; --dry-run names the files; a repository with no tokens is refused", () => {
  const dir = copyRepo();
  const preview = cli("--target", dir, "--json", "--dry-run");
  assert.equal(preview.status, 0, preview.stderr);
  const planned = JSON.parse(preview.stdout);
  assert.deepEqual(Object.keys(planned), ["stamp", "exports", "files", "dry_run"]);
  assert.ok(!existsSync(path.join(dir, DESIGN_MD)));
  const real = cli("--target", dir, "--json");
  assert.equal(real.status, 0, real.stderr);
  assert.deepEqual(JSON.parse(real.stdout).files, planned.files);
  assert.ok(planned.files.some((file) => file.path === "design/theme.json"));
  assert.ok(planned.files.some((file) => file.path === "design/decisions.yaml"));
  assert.match(
    read(dir, "design/decisions.yaml"),
    /- id: design-exports\n {4}layer: governance\n {4}kind: formula\n/,
  );
  const again = JSON.parse(cli("--target", dir, "--json").stdout);
  assert.deepEqual(again.files, []);
  const bare = mkdtempSync(path.join(tmpdir(), "design-bring-out-"));
  made.push(bare);
  const refused = cli("--target", bare, "--json");
  assert.equal(refused.status, 2);
  assert.equal(refused.stdout, "");
  assert.match(refused.stderr, /^design-assembly: design\/tokens\.json is missing/);
});

test("this repository holds its own exports, and its gate holds them", () => {
  assert.ok(existsSync(path.join(ROOT, DESIGN_MD)));
  assert.deepEqual(designMdProblems(read(ROOT, DESIGN_MD)), []);
  const held = exportsCheck(ROOT);
  assert.equal(held?.problem, null);
  assert.equal(held?.held, true);
});

test("the skill of the command exists, runs the script, and sends nothing anywhere", () => {
  const skill = readFileSync(path.join(PLUGIN, "skills/bring-out/SKILL.md"), "utf8");
  assert.match(skill, /^---\nname: bring-out\ndescription: \S/);
  assert.match(skill, /scripts\/bring-out\.mjs --target <repo>/);
  assert.match(skill, /sends nothing to any account or service/);
  assert.match(skill, /make design-exports/);
});

test("review: a markdown export changed by hand, or an export the tool data stops listing, turns the gate red", () => {
  const dir = copyRepo();
  bringOut(dir, { dryRun: false });
  put(
    dir,
    DESIGN_MD,
    read(dir, DESIGN_MD).replace("- Do take every colour", "- Do take any colour"),
  );
  assert.match(
    exportsCheck(dir).problem,
    /DESIGN\.md differs from what the design ledgers give: it was changed by hand/,
  );
  // Laid out again by a formatter, it is the same export.
  bringOut(dir, { dryRun: false });
  put(dir, DESIGN_MD, read(dir, DESIGN_MD).replace(/\n\n/g, "\n\n\n").replace(/ {2}/g, "  "));
  assert.equal(exportsCheck(dir).problem, null);
  // One file dropped from the tool data's list is named.
  const theme = JSON.parse(read(dir, "design/theme.json"));
  theme.checks["design-exports"] = theme.checks["design-exports"].filter(
    (check) => !check.file.endsWith("assets.json"),
  );
  put(dir, "design/theme.json", `${JSON.stringify(theme, null, 2)}\n`);
  assert.match(
    exportsCheck(dir).problem,
    /design\/export\/system\/assets\.json is an export the tool data does not hold/,
  );
});

test("review: a repository whose copy of the tool is older than the exports is refused, and a broken tool data is named", () => {
  const dir = copyRepo();
  rmSync(path.join(dir, "tools/design-assembly/exports.mjs"));
  assert.throws(
    () => bringOut(dir, { dryRun: true }),
    /copy of the tool has no exports\.mjs: bring it up with upgrade first/,
  );
  const broken = copyRepo();
  put(broken, "design/theme.json", "{ no");
  assert.throws(() => bringOut(broken, { dryRun: true }), /design\/theme\.json is not JSON/);
});
