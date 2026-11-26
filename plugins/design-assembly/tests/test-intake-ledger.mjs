// The intake ledger: which need got which block, from where, and who approved it on which day. It
// joins the contract with one shape, and a repository may keep it as one file per block, named
// after the need, so that two changes that each take in a block write two files and never meet.
// The fragments are the screens' own way of keeping a ledger, given another list and another key
// to name each file by; a repository that spells the keys its own way says so under `keys`.
import "./helpers/own-cores.mjs";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { execPath } from "node:process";
import { after, test } from "node:test";
import { fileURLToPath } from "node:url";

import { fragmentsProblem } from "../templates/tools/design-assembly/check.mjs";
import { LEDGERS, shapeProblems, UNSETTLED } from "../templates/tools/design-assembly/contract.mjs";
import {
  INTAKE_LEDGER,
  intakeList,
  readIntakeLedger,
} from "../templates/tools/design-assembly/intake-ledger.mjs";
import { ledgerText, readFragments } from "../templates/tools/design-assembly/screen-fragments.mjs";
import {
  joinLedger,
  lostEntries,
  splitLedger,
} from "../templates/tools/design-assembly/screen-ledger.mjs";
import { floorFiles } from "./helpers/guided-repo.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const PLUGIN = path.resolve(HERE, "..");
const APPLY = path.join(PLUGIN, "scripts/apply.mjs");
const FOLDER = "design/intake";
const SCREENS = "design/screens.yaml";

export const INTAKE = [
  "# The intake ledger: one entry per block taken in, after the owner saw it.",
  "version: 1",
  "blocks:",
  "  - name: DataRegion",
  "    file: src/components/data-region.tsx",
  "    source: data-grid-6",
  "    need: many-rows",
  "    description: A list of many rows to read, filter and search",
  "    record: rows-reader",
  "    approved: 2026-11-12",
  "  # Made by hand: nothing outside had a page head of this kind.",
  "  - name: PageHeader",
  "    file: src/components/page-header.tsx",
  "    source: made-by-hand",
  "    need: page-head",
  "    approved: 2026-11-12",
  "    approved_by: the owner",
  "",
].join("\n");

// The same ledger as a repository that spells its keys in its own language keeps it.
const OWN_KEYS = [
  "version: 1",
  "keys: { blocks: khoi, name: ten, file: tep, source: nguon, need: nhu_cau, description: mo_ta, record: ho_so, approved: duyet }",
  "khoi:",
  "  - ten: DataRegion",
  "    tep: src/components/data-region.tsx",
  "    nguon: data-grid-6",
  "    nhu_cau: many-rows",
  "    ho_so: rows-reader",
  "    duyet: 2026-11-12",
  "  - ten: PageHeader",
  "    tep: src/components/page-header.tsx",
  "    nguon: made-by-hand",
  "    nhu_cau: page-head",
  "    duyet: 2026-11-12",
  "",
].join("\n");

const made = [];
after(() => made.forEach((dir) => rmSync(dir, { recursive: true, force: true })));

function folder(files) {
  const dir = mkdtempSync(path.join(tmpdir(), "design-assembly-intake-"));
  made.push(dir);
  for (const [file, content] of Object.entries(files)) {
    mkdirSync(path.dirname(path.join(dir, file)), { recursive: true });
    writeFileSync(path.join(dir, file), content);
  }
  return dir;
}

const run = (script, ...args) => spawnSync(execPath, [script, ...args], { encoding: "utf8" });
const tool = (dir, name, ...args) =>
  run(path.join(dir, "tools/design-assembly", name), "--target", dir, ...args);
const check = (dir) => tool(dir, "check.mjs");
const fragments = (dir, ...args) => tool(dir, "screen-fragments.mjs", ...args);
const intake = (dir, ...args) => fragments(dir, "--ledger", "intake", ...args);
const text = (dir, file) => readFileSync(path.join(dir, file), "utf8");
const has = (dir, file) => existsSync(path.join(dir, file));
const theme = (dir) => JSON.parse(text(dir, "design/theme.json"));
const shapeChecks = (dir) => theme(dir).checks["ledger-shapes"];
const git = (dir, ...args) =>
  spawnSync(
    "git",
    ["-C", dir, "-c", "user.name=test", "-c", "user.email=test@example.com", ...args],
    { encoding: "utf8" },
  );

// A repository the guide built with an intake ledger of two blocks, its gate green.
function guided(ledger = INTAKE, file = INTAKE_LEDGER) {
  const dir = folder(floorFiles({ [file]: ledger }));
  const said = run(APPLY, "--target", dir);
  assert.equal(said.status, 0, said.stderr);
  const held = check(dir);
  assert.equal(held.status, 0, held.stderr);
  return dir;
}

// The same, with the intake ledger kept as one file per block.
function split() {
  const dir = guided();
  const cut = intake(dir, "--split");
  assert.equal(cut.status, 0, cut.stderr);
  const held = check(dir);
  assert.equal(held.status, 0, held.stderr);
  return dir;
}

const drop = (ledger, line) =>
  ledger
    .split("\n")
    .filter((item) => item !== line)
    .join("\n");

test("the intake ledger is a ledger of the contract, and no ledger the contract names is unsettled", () => {
  assert.equal(LEDGERS.intake.file, INTAKE_LEDGER);
  assert.equal(INTAKE_LEDGER, "design/intake.yaml");
  assert.equal(LEDGERS.intake.version, 1);
  assert.deepEqual(LEDGERS.intake.fragments, {
    folder: FOLDER,
    shared: "_shared.yaml",
    named_by: "need",
  });
  assert.ok(!("intake" in UNSETTLED));
  assert.deepEqual(UNSETTLED, {});
});

test("a ledger of that shape holds, in the contract's keys and in a repository's own", () => {
  assert.deepEqual(shapeProblems("intake", INTAKE), []);
  assert.deepEqual(shapeProblems("intake", OWN_KEYS), []);
  const own = readIntakeLedger(OWN_KEYS);
  assert.deepEqual(
    own.blocks.map((block) => [block.name, block.need, block.approved]),
    [
      ["DataRegion", "many-rows", "2026-11-12"],
      ["PageHeader", "page-head", "2026-11-12"],
    ],
  );
  // Keys the repository keeps of its own are read without complaint.
  assert.deepEqual(
    shapeProblems("intake", INTAKE.replace("    record: rows-reader", "    team: rows")),
    [],
  );
});

test("the shape fails without an approval day, on a need not written as a key, and on two lines for one need", () => {
  const file = INTAKE_LEDGER;
  assert.match(
    shapeProblems("intake", drop(INTAKE, "    approved: 2026-11-12")).join("; "),
    /design\/intake\.yaml\.blocks\[\d\]\.approved is missing/,
  );
  assert.match(
    shapeProblems("intake", INTAKE.replace("approved: 2026-11-12", "approved: last week")).join(
      "; ",
    ),
    /approved is "last week", which is not written as the contract says/,
  );
  assert.match(
    shapeProblems("intake", INTAKE.replace("need: many-rows", "need: Many Rows")).join("; "),
    /need is "Many Rows", which is not written as the contract says/,
  );
  assert.match(
    shapeProblems("intake", INTAKE.replace("need: page-head", "need: many-rows"), file).join("; "),
    /two blocks answer the need many-rows: one need, one solution/,
  );
  // In a repository's own keys the missing key is named the repository's way too.
  assert.match(
    shapeProblems("intake", drop(OWN_KEYS, "    duyet: 2026-11-12")).join("; "),
    /approved \(duyet\) is missing/,
  );
});

test("cut into one file per block, each named after its need, the ledger reads back the same", () => {
  const list = intakeList(INTAKE);
  assert.deepEqual(list, { list: "blocks", name: "need" });
  const { shared, fragments: parts, problems } = splitLedger(INTAKE, list);
  assert.deepEqual(problems, []);
  assert.deepEqual(
    parts.map((part) => part.name),
    ["many-rows.yaml", "page-head.yaml"],
  );
  assert.match(parts[1].text, /^# Made by hand/);
  assert.doesNotMatch(shared, /^blocks:/m);
  const joined = joinLedger(shared, parts, list);
  assert.deepEqual(lostEntries(INTAKE, joined, list), []);
  assert.deepEqual(lostEntries(joined, INTAKE, list), []);
  // A repository's own spelling names its list and its key.
  const own = intakeList(OWN_KEYS);
  assert.deepEqual(own, { list: "khoi", name: "nhu_cau" });
  const cut = splitLedger(OWN_KEYS, own);
  assert.deepEqual(cut.problems, []);
  assert.deepEqual(
    cut.fragments.map((part) => part.name),
    ["many-rows.yaml", "page-head.yaml"],
  );
  assert.deepEqual(lostEntries(OWN_KEYS, joinLedger(cut.shared, cut.fragments, own), own), []);
});

test("cutting stops where two blocks answer one need, or a block names none", () => {
  const twice = splitLedger(INTAKE.replace("need: page-head", "need: many-rows"), {
    list: "blocks",
    name: "need",
  });
  assert.match(twice.problems.join("; "), /2 entries share the need many-rows/);
  const none = splitLedger(drop(INTAKE, "    need: page-head"), { list: "blocks", name: "need" });
  assert.match(none.problems.join("; "), /an entry has no need, so its file has no name/);
});

test("the gate holds the intake ledger's shape once the guide finds one, at its usual path", () => {
  const dir = guided();
  const shapes = shapeChecks(dir).find((item) => item.kind === "shapes");
  assert.equal(shapes.ledgers.intake, INTAKE_LEDGER);
  writeFileSync(
    path.join(dir, INTAKE_LEDGER),
    drop(text(dir, INTAKE_LEDGER), "    approved: 2026-11-12"),
  );
  const red = check(dir);
  assert.equal(red.status, 1);
  assert.match(red.stderr, /design\/intake\.yaml\.blocks\[\d\]\.approved is missing/);
});

test("split, the intake ledger is one file per block, held by the gate, and the screens stay as they were", () => {
  const dir = guided();
  const said = intake(dir, "--split");
  assert.equal(said.status, 0, said.stderr);
  assert.match(said.stdout, /intake ledger: design\/intake\.yaml becomes one file per block/);
  assert.match(said.stdout, /create design\/intake\/many-rows\.yaml/);
  assert.match(said.stdout, /2 blocks, each in a file named after its need/);
  assert.ok(!has(dir, INTAKE_LEDGER));
  assert.ok(has(dir, `${FOLDER}/_shared.yaml`));
  assert.match(text(dir, `${FOLDER}/page-head.yaml`), /^# Made by hand[^\n]*\nname: PageHeader\n/);
  assert.deepEqual(
    shapeChecks(dir).filter((item) => item.kind === "screen-fragments"),
    [{ kind: "screen-fragments", of: "intake", file: INTAKE_LEDGER, fragments: FOLDER }],
  );
  // The ledger of screens is still the one file.
  assert.ok(has(dir, SCREENS));
  const held = check(dir);
  assert.equal(held.status, 0, held.stderr);
  // Read back as one text, nothing of the ledger is lost.
  assert.deepEqual(lostEntries(INTAKE, ledgerText(dir, INTAKE_LEDGER, "intake")), []);
});

test("the gate is red on a fragment not named after its need, on one without its day, and beside the one file", () => {
  const dir = split();
  const page = `${FOLDER}/page-head.yaml`;
  writeFileSync(path.join(dir, `${FOLDER}/page-header.yaml`), text(dir, page));
  rmSync(path.join(dir, page));
  const misnamed = check(dir);
  assert.equal(misnamed.status, 1);
  assert.match(
    misnamed.stderr,
    /design\/intake\/page-header\.yaml holds the block for the need page-head: the file's name is the need, so it is design\/intake\/page-head\.yaml/,
  );
  writeFileSync(path.join(dir, page), text(dir, `${FOLDER}/page-header.yaml`));
  rmSync(path.join(dir, `${FOLDER}/page-header.yaml`));
  assert.equal(check(dir).status, 0);
  writeFileSync(path.join(dir, page), drop(text(dir, page), "approved: 2026-11-12"));
  const undated = check(dir);
  assert.equal(undated.status, 1);
  assert.match(undated.stderr, /design\/intake\/page-head\.yaml: approved is missing/);
  writeFileSync(path.join(dir, page), `${text(dir, page)}approved: 2026-11-12\n`);
  assert.equal(check(dir).status, 0);
  writeFileSync(path.join(dir, INTAKE_LEDGER), INTAKE);
  const twice = check(dir);
  assert.equal(twice.status, 1);
  assert.match(
    twice.stderr,
    /design\/intake\.yaml is there beside design\/intake, so the ledger has two sources/,
  );
});

test("the check of the fragments says each problem in the words of the ledger it holds", () => {
  const found = {
    folder: FOLDER,
    shared: "version: 1\n",
    fragments: [
      {
        name: "x.yaml",
        file: `${FOLDER}/x.yaml`,
        text: "name: A\nfile: src/a.tsx\nsource: made-by-hand\nneed: y\n",
      },
    ],
    beside: false,
    ledger: "intake",
  };
  const said = fragmentsProblem(found, {
    kind: "screen-fragments",
    of: "intake",
    file: INTAKE_LEDGER,
    fragments: FOLDER,
  });
  assert.match(said, /design\/intake\/x\.yaml holds the block for the need y/);
  assert.match(said, /design\/intake\/x\.yaml: approved is missing/);
  assert.equal(
    fragmentsProblem(null, {
      kind: "screen-fragments",
      of: "intake",
      file: INTAKE_LEDGER,
      fragments: FOLDER,
    }),
    "design/intake.yaml is kept as one file per block under design/intake, and design/intake/_shared.yaml is not there: bring the folder back, or run the tool's screen-fragments.mjs --ledger intake --join on what is left",
  );
});

test("two branches that each take in a block merge without meeting in the design folder", () => {
  const dir = split();
  assert.equal(git(dir, "init", "-q", "-b", "main").status, 0);
  git(dir, "add", "-A");
  assert.equal(git(dir, "commit", "-q", "-m", "base").status, 0);
  const block = (need) =>
    `name: Block${need.length}\nfile: src/components/${need}.tsx\nsource: made-by-hand\nneed: ${need}\napproved: 2026-11-16\n`;
  for (const need of ["date-picker", "empty-hint"]) {
    git(dir, "switch", "-q", "-c", need, "main");
    writeFileSync(path.join(dir, `${FOLDER}/${need}.yaml`), block(need));
    git(dir, "add", "-A");
    assert.equal(git(dir, "commit", "-q", "-m", need).status, 0);
  }
  git(dir, "switch", "-q", "date-picker");
  const merged = git(dir, "merge", "-q", "--no-edit", "empty-hint");
  assert.equal(merged.status, 0, merged.stdout + merged.stderr);
  const touched = git(dir, "diff", "--name-only", "main", "HEAD").stdout.trim().split("\n");
  assert.deepEqual(touched.sort(), [`${FOLDER}/date-picker.yaml`, `${FOLDER}/empty-hint.yaml`]);
  const held = check(dir);
  assert.equal(held.status, 0, held.stderr);
});

test("a ledger at a path of the repository's own, in its own keys, splits by its own key", () => {
  const file = "design/block-book.yaml";
  const dir = folder(floorFiles({ [file]: OWN_KEYS }));
  assert.equal(run(APPLY, "--target", dir).status, 0);
  // The person names the path in the tool data, as for any ledger kept elsewhere.
  const data = theme(dir);
  const shapes = data.checks["ledger-shapes"].find((item) => item.kind === "shapes");
  shapes.ledgers = { ...shapes.ledgers, intake: file };
  writeFileSync(path.join(dir, "design/theme.json"), JSON.stringify(data, null, 2));
  assert.equal(check(dir).status, 0, check(dir).stderr);
  const said = intake(dir, "--split");
  assert.equal(said.status, 0, said.stderr);
  assert.ok(has(dir, "design/block-book/many-rows.yaml"));
  assert.match(text(dir, "design/block-book/_shared.yaml"), /^keys: \{ blocks: khoi/m);
  assert.match(text(dir, "design/block-book/_shared.yaml"), /^# khoi: one file per entry/m);
  const held = check(dir);
  assert.equal(held.status, 0, held.stderr);
  writeFileSync(
    path.join(dir, "design/block-book/page-head.yaml"),
    drop(text(dir, "design/block-book/page-head.yaml"), "duyet: 2026-11-12"),
  );
  const red = check(dir);
  assert.equal(red.status, 1);
  assert.match(red.stderr, /design\/block-book\/page-head\.yaml: approved \(duyet\) is missing/);
});

test("both ledgers split and both copied: each choice is its own, and one command writes both copies", () => {
  const dir = split();
  assert.equal(fragments(dir, "--split").status, 0);
  assert.equal(git(dir, "init", "-q").status, 0);
  assert.equal(intake(dir, "--copy").status, 0);
  assert.equal(fragments(dir, "--copy").status, 0);
  const kept = shapeChecks(dir).filter((item) => item.kind === "untracked");
  assert.deepEqual(kept.map((item) => item.file).sort(), [INTAKE_LEDGER, SCREENS].sort());
  assert.equal(
    shapeChecks(dir).filter((item) => item.kind === "screen-fragments").length,
    2,
    "a second split took the first one's check away",
  );
  writeFileSync(path.join(dir, ".gitignore"), `${INTAKE_LEDGER}\n${SCREENS}\n`);
  const drawn = tool(dir, "derived.mjs");
  assert.equal(drawn.status, 0, drawn.stderr);
  assert.match(drawn.stdout, /wrote design\/intake\.yaml from design\/intake/);
  assert.match(drawn.stdout, /wrote design\/screens\.yaml from design\/screens/);
  assert.equal(text(dir, INTAKE_LEDGER), ledgerText(dir, INTAKE_LEDGER, "intake"));
  const held = check(dir);
  assert.equal(held.status, 0, held.stderr);
  // Taking one copy back leaves the other.
  assert.equal(intake(dir, "--no-copy").status, 0);
  assert.ok(!has(dir, INTAKE_LEDGER));
  assert.deepEqual(
    shapeChecks(dir)
      .filter((item) => item.kind === "untracked")
      .map((item) => item.file),
    [SCREENS],
  );
  assert.ok(has(dir, SCREENS));
});

test("one command takes the split back, and the screens are left alone", () => {
  const dir = split();
  const said = intake(dir, "--join");
  assert.equal(said.status, 0, said.stderr);
  assert.match(said.stdout, /2 blocks, in the order of their needs/);
  assert.ok(has(dir, INTAKE_LEDGER));
  assert.ok(!has(dir, FOLDER));
  assert.deepEqual(lostEntries(INTAKE, text(dir, INTAKE_LEDGER)), []);
  assert.deepEqual(
    shapeChecks(dir).filter((item) => item.kind === "screen-fragments"),
    [],
  );
  assert.equal(check(dir).status, 0);
  assert.equal(readFragments(dir, INTAKE_LEDGER, "intake"), null);
});

test("asked of a ledger it does not know, or with no name, the command refuses and changes nothing", () => {
  const dir = guided();
  const before = text(dir, INTAKE_LEDGER);
  const unknown = fragments(dir, "--ledger", "tokens", "--split");
  assert.equal(unknown.status, 1);
  assert.match(unknown.stderr, /--ledger takes one of screens, intake/);
  const bare = fragments(dir, "--split", "--ledger");
  assert.equal(bare.status, 1);
  assert.match(bare.stderr, /--ledger takes one of screens, intake/);
  assert.equal(text(dir, INTAKE_LEDGER), before);
  assert.ok(!has(dir, FOLDER));
  // Asked nothing, it says which shape the ledger has.
  const said = intake(dir);
  assert.equal(said.status, 0);
  assert.match(said.stdout, /intake ledger: one file, design\/intake\.yaml \(2 blocks\)/);
});

test("a repository with no intake ledger is told so, and nothing is written", () => {
  const dir = folder(floorFiles());
  assert.equal(run(APPLY, "--target", dir).status, 0);
  const said = intake(dir, "--split");
  assert.equal(said.status, 0);
  assert.match(said.stdout, /this repository has no intake ledger \(design\/intake\.yaml\)/);
  assert.ok(!has(dir, FOLDER));
  const shapes = shapeChecks(dir).find((item) => item.kind === "shapes");
  assert.ok(!("intake" in shapes.ledgers));
});

test("a repository that adopts with its intake ledger already in fragments is held as such", () => {
  const { shared, fragments: parts } = splitLedger(INTAKE, intakeList(INTAKE));
  const dir = folder(
    floorFiles({
      [`${FOLDER}/_shared.yaml`]: shared,
      ...Object.fromEntries(parts.map((part) => [`${FOLDER}/${part.name}`, part.text])),
    }),
  );
  // Adopting leaves work for a person, so it ends with 1.
  assert.equal(run(path.join(PLUGIN, "scripts/adopt.mjs"), "--target", dir).status, 1);
  const checks = shapeChecks(dir);
  assert.equal(checks.find((item) => item.kind === "shapes").ledgers.intake, INTAKE_LEDGER);
  assert.deepEqual(
    checks.filter((item) => item.kind === "screen-fragments"),
    [{ kind: "screen-fragments", of: "intake", file: INTAKE_LEDGER, fragments: FOLDER }],
  );
  assert.ok(!has(dir, INTAKE_LEDGER), "adopting wrote the one file");
  const held = check(dir);
  assert.equal(held.status, 0, held.stderr);
});

test("the rules page says the screens are one file per screen only when the screens are", () => {
  const dir = split();
  // The guide runs again: the choice outlives it, and the page it writes for agents is the truth.
  const again = run(APPLY, "--target", dir);
  assert.equal(again.status, 0, again.stderr);
  assert.deepEqual(
    shapeChecks(dir).filter((item) => item.kind === "screen-fragments"),
    [{ kind: "screen-fragments", of: "intake", file: INTAKE_LEDGER, fragments: FOLDER }],
  );
  const page = text(dir, ".claude/rules/design-assembly.md");
  assert.doesNotMatch(page, /design\/screens\/<id>\.yaml/);
  assert.doesNotMatch(page, /design\/screens\/_shared\.yaml/);
  assert.match(page, /design\/screens\.yaml/);
});

test("every word of the command and the gate is the repository's own key where it spells one", () => {
  const ledger = OWN_KEYS.replace("need: nhu_cau", "need: slot").replaceAll("nhu_cau:", "slot:");
  const file = INTAKE_LEDGER;
  const dir = guided(ledger, file);
  const said = intake(dir, "--split");
  assert.equal(said.status, 0, said.stderr);
  assert.match(said.stdout, /each in a file named after its slot;/);
  assert.match(said.stdout, /the blocks are read in the order of their slot from now on/);
  assert.doesNotMatch(said.stdout, /need/);
  const page = `${FOLDER}/page-head.yaml`;
  writeFileSync(path.join(dir, `${FOLDER}/other.yaml`), text(dir, page));
  rmSync(path.join(dir, page));
  const red = check(dir);
  assert.equal(red.status, 1);
  assert.match(
    red.stderr,
    /the file's name is the need \(slot\), so it is design\/intake\/page-head\.yaml/,
  );
});

test("a spelling the reader cannot read as a key is named, and nothing throws on one", () => {
  const odd = INTAKE.replace("version: 1", 'version: 1\nkeys: { blocks: "a(", need: "b, c" }');
  const said = shapeProblems("intake", odd).join("; ");
  assert.match(said, /keys spells blocks as "a\(", which the reader cannot read as a key/);
  assert.match(said, /keys spells need as "b, c", which the reader cannot read as a key/);
  // Such a spelling is not used: the list and the key are the contract's.
  assert.deepEqual(intakeList(odd), { list: "blocks", name: "need" });
  const found = {
    folder: FOLDER,
    shared: 'version: 1\nkeys: { blocks: "a(", need: "b, c" }\n',
    fragments: [
      {
        name: "page-head.yaml",
        file: `${FOLDER}/page-head.yaml`,
        text: "name: H\nfile: src/h.tsx\nsource: made-by-hand\nneed: page-head\napproved: 2026-11-16\n",
      },
    ],
    beside: false,
    ledger: "intake",
  };
  const check = { kind: "screen-fragments", of: "intake", file: INTAKE_LEDGER, fragments: FOLDER };
  assert.equal(fragmentsProblem(found, check), null);
});

test("two keys spelled one way are named, never one of them dropped without a word", () => {
  const clash = INTAKE.replace("version: 1", "version: 1\nkeys: { need: name }");
  assert.match(
    shapeProblems("intake", clash).join("; "),
    /keys spells name and need both as name: each key of the contract needs a spelling of its own/,
  );
  const twice = INTAKE.replace("version: 1", "version: 1\nkeys: { name: title, file: title }");
  assert.match(
    shapeProblems("intake", twice).join("; "),
    /keys spells name and file both as title/,
  );
  // A swap is two spellings, each its own.
  const swap = [
    "version: 1",
    "keys: { need: name, name: label }",
    "blocks:",
    "  - label: Header",
    "    file: src/header.tsx",
    "    source: made-by-hand",
    "    name: page-head",
    "    approved: 2026-11-16",
    "",
  ].join("\n");
  assert.deepEqual(shapeProblems("intake", swap), []);
  assert.deepEqual(
    readIntakeLedger(swap).blocks.map((block) => [block.name, block.need]),
    [["Header", "page-head"]],
  );
});
