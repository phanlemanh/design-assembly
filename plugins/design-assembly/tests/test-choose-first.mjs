// The gate holds the choice (specification 0015, slice 5, criterion 11 and question 7): a component
// file a branch adds with no row of the intake ledger turns the gate red; a row made by hand that a
// branch writes without the words it searched and the nearest candidate, or with a nearest name no
// store holds, turns it red; and a second row for one need turns it red. What a branch adds is read
// against where it left the main branch, so a repository that is green today stays green on the
// files and rows it already has. Nothing calls a model or the network.
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { cpSync, existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { after, test } from "node:test";
import { fileURLToPath } from "node:url";

import { KINDS_FOR_TEST, readState, runChecks } from "../templates/tools/design-assembly/check.mjs";
import {
  CHOOSE_FIRST_CHECK,
  NOTHING_ANSWERS,
  STARTER_NAMES,
} from "../templates/tools/design-assembly/choose-first.mjs";
import { CONFORM_FOLDER, LEDGERS } from "../templates/tools/design-assembly/contract.mjs";
import { SOURCES_FOLDER } from "../templates/tools/design-assembly/sources-ledger.mjs";
import { COMPONENT, put } from "./helpers/store-repo.mjs";

const PLUGIN = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const ROOT = path.resolve(PLUGIN, "../..");
const made = [];
after(() => made.forEach((dir) => rmSync(dir, { recursive: true, force: true })));

const chooseFirst = KINDS_FOR_TEST["choose-first"];
const CHECK = { kind: "choose-first" };
const NEW_FILE = "src/components/status-badge.tsx";
const OLD_FILE = "src/components/item-list.tsx";
const NO_ROWS = "version: 1\nblocks: []\n";

// What the check reads, as readState gives it: the ledger now, and what the branch left behind.
const choiceState = ({
  intakeText = NO_ROWS,
  baseIntake = NO_ROWS,
  baseFiles = [OLD_FILE],
  components = [
    { name: "ItemList", file: OLD_FILE },
    { name: "StatusBadge", file: NEW_FILE },
  ],
  held = ["ItemList", "StatusBadge", "data-grid-1"],
  sources = {},
  records = {},
  compared = true,
} = {}) => ({
  files: { [LEDGERS.intake.file]: intakeText },
  ledgerFolders: { [SOURCES_FOLDER]: sources, [CONFORM_FOLDER]: records },
  choice: {
    components,
    held,
    base: compared ? { files: baseFiles, intake: baseIntake } : null,
    note: compared ? null : "not in a git repository",
  },
});

const row = (fields) =>
  `version: 1\nblocks:\n  - ${Object.entries(fields)
    .map(([key, value]) => `${key}: ${value}`)
    .join("\n    ")}\n`;
const BY_HAND = {
  name: "StatusBadge",
  file: NEW_FILE,
  source: "by-hand",
  need: "status-badge",
  description: "No store shows a state in one word",
  approved: "2026-11-24",
};

// ---- a component file the branch adds -------------------------------------------------------------

test("criterion 11: a component file this branch adds with no row turns the gate red, naming the file", () => {
  const problem = chooseFirst.run(choiceState(), CHECK);
  assert.match(problem, /src\/components\/status-badge\.tsx/);
  assert.match(problem, /StatusBadge/);
  assert.match(problem, /intake --need/);
  // The file the main branch already has is not named: it is not this branch's.
  assert.doesNotMatch(problem, /item-list/);
});

test("criterion 11: a file the branch adds is held once a row, a source's folder or a conform record has it", () => {
  const recorded = row({ ...BY_HAND, searched: "status badge", nearest: NOTHING_ANSWERS });
  assert.equal(chooseFirst.run(choiceState({ intakeText: recorded }), CHECK), null);
  const folder = {
    [`${SOURCES_FOLDER}/kit.json`]: JSON.stringify({ id: "kit", folder: "src/components/" }),
  };
  assert.equal(chooseFirst.run(choiceState({ sources: folder }), CHECK), null);
  const record = {
    version: 1,
    need: "status-badge",
    source: "kit",
    item: "badge",
    taken: [{ file: NEW_FILE, sha256: "0".repeat(64) }],
    conformed: [{ file: NEW_FILE, sha256: "0".repeat(64) }],
    patches: [],
    exemptions: [],
  };
  const records = { [`${CONFORM_FOLDER}/status-badge.json`]: JSON.stringify(record) };
  assert.equal(chooseFirst.run(choiceState({ records }), CHECK), null);
});

test("criterion 11: the list of what came before lets a file through only when the main branch already had the entry", () => {
  // Written on this branch for a file this branch adds: nothing came before, so it is red.
  const byFile = `version: 1\nblocks: []\nbefore:\n  - name: Other\n    file: ${NEW_FILE}\n    why: made before\n`;
  assert.match(chooseFirst.run(choiceState({ intakeText: byFile }), CHECK), /status-badge\.tsx/);
  const byName = `version: 1\nblocks: []\nbefore:\n  - name: StatusBadge\n    file: ${NEW_FILE}\n    why: made before\n`;
  assert.match(chooseFirst.run(choiceState({ intakeText: byName }), CHECK), /status-badge\.tsx/);
  // The main branch's list named the component at its old place: the branch moved the file.
  const moved = `version: 1\nblocks: []\nbefore:\n  - name: StatusBadge\n    file: src/components/old-badge.tsx\n    why: made before\n`;
  const movedNow = moved.replace("src/components/old-badge.tsx", NEW_FILE);
  assert.equal(chooseFirst.run(choiceState({ baseIntake: moved, intakeText: moved }), CHECK), null);
  assert.equal(
    chooseFirst.run(choiceState({ baseIntake: moved, intakeText: movedNow }), CHECK),
    null,
  );
  // The main branch's list named the file itself.
  const atBase = `version: 1\nblocks: []\nbefore:\n  - name: Other\n    file: ${NEW_FILE}\n    why: made before\n`;
  assert.equal(
    chooseFirst.run(choiceState({ baseIntake: atBase, intakeText: atBase }), CHECK),
    null,
  );
});

test("criterion 11: the files and rows the main branch already has are not held to it: a green repository stays green", () => {
  // The branch adds nothing: every file and row is the main branch's, however it was written.
  const old = row({ ...BY_HAND, file: OLD_FILE, need: "old-need" });
  const state = choiceState({
    intakeText: old,
    baseIntake: old,
    baseFiles: [OLD_FILE, NEW_FILE],
  });
  assert.equal(chooseFirst.run(state, CHECK), null);
});

test("criterion 11: outside git nothing is compared, and the check says so instead of failing", () => {
  const state = choiceState({ compared: false });
  assert.equal(chooseFirst.run(state, CHECK), null);
  assert.deepEqual(chooseFirst.notes(state, CHECK), ["not in a git repository"]);
});

// ---- a row made by hand the branch writes ---------------------------------------------------------

test("criterion 11: a row made by hand this branch writes without the words searched turns the gate red", () => {
  const problem = chooseFirst.run(
    choiceState({ intakeText: row({ ...BY_HAND, nearest: NOTHING_ANSWERS }) }),
    CHECK,
  );
  assert.match(problem, /status-badge/);
  assert.match(problem, /searched/);
});

test("criterion 11: a row made by hand this branch writes without the nearest candidate turns the gate red", () => {
  const problem = chooseFirst.run(
    choiceState({ intakeText: row({ ...BY_HAND, searched: "status badge" }) }),
    CHECK,
  );
  assert.match(problem, /status-badge/);
  assert.match(problem, /nearest/);
});

test("criterion 11: a nearest candidate no store holds turns the gate red; a name a store holds, or none, passes", () => {
  const named = (nearest) =>
    chooseFirst.run(
      choiceState({ intakeText: row({ ...BY_HAND, searched: "status badge", nearest }) }),
      CHECK,
    );
  assert.match(named("MadeUpThing"), /MadeUpThing/);
  // A component of the repository, an item of a pinned catalog, a piece of the starter kit.
  assert.equal(named("ItemList"), null);
  assert.equal(named("data-grid-1"), null);
  assert.equal(named(STARTER_NAMES[0]), null);
  assert.equal(named(NOTHING_ANSWERS), null);
});

test("criterion 11: a row the repository spells its own way is read in its keys", () => {
  const own =
    "version: 1\nkeys: { blocks: khoi, name: ten, file: tep, source: nguon, need: nhu_cau, approved: duyet }\nvalues: { by-hand: tao-tay }\nkhoi:\n  - ten: StatusBadge\n    tep: src/components/status-badge.tsx\n    nguon: tao-tay\n    nhu_cau: status-badge\n    duyet: 2026-11-24\n";
  assert.match(chooseFirst.run(choiceState({ intakeText: own }), CHECK), /searched/);
  const taken = own.replace("tao-tay\n    nhu_cau", "data-grid-1\n    nhu_cau");
  assert.equal(chooseFirst.run(choiceState({ intakeText: taken }), CHECK), null);
});

test("criterion 11: a repository that starts saying how it writes made by hand does not turn its older rows into new ones", () => {
  // The main branch wrote tao-tay with no word on what it means; this branch declares it.
  const rows =
    "khoi:\n  - ten: StatusBadge\n    tep: src/components/status-badge.tsx\n    nguon: tao-tay\n    nhu_cau: status-badge\n    duyet: 2026-11-24\n";
  const keys =
    "version: 1\nkeys: { blocks: khoi, name: ten, file: tep, source: nguon, need: nhu_cau, approved: duyet }\n";
  const state = choiceState({
    baseIntake: `${keys}${rows}`,
    intakeText: `${keys}values: { by-hand: tao-tay }\n${rows}`,
    baseFiles: [OLD_FILE, NEW_FILE],
  });
  assert.equal(chooseFirst.run(state, CHECK), null);
  // A row this branch turns into one made by hand is the branch's.
  const taken = rows.replace("nguon: tao-tay", "nguon: data-grid-1");
  const turned = choiceState({
    baseIntake: `${keys}values: { by-hand: tao-tay }\n${taken}`,
    intakeText: `${keys}values: { by-hand: tao-tay }\n${rows}`,
    baseFiles: [OLD_FILE, NEW_FILE],
  });
  assert.match(chooseFirst.run(turned, CHECK), /searched/);
});

test("the check is seen failing on a copy it changes", () => {
  const clean = choiceState({ components: [{ name: "ItemList", file: OLD_FILE }] });
  assert.equal(chooseFirst.run(clean, CHECK), null);
  assert.notEqual(chooseFirst.run(chooseFirst.change(clean, CHECK), CHECK), null);
  // Outside git too: the changed copy compares with a branch that left nothing behind.
  const outside = choiceState({ compared: false, components: [] });
  assert.notEqual(chooseFirst.run(chooseFirst.change(outside, CHECK), CHECK), null);
});

test("the starter kit's names the gate reads are the starter kit's", () => {
  const starter = JSON.parse(readFileSync(path.join(PLUGIN, "references/starter.json"), "utf8"));
  assert.deepEqual([...STARTER_NAMES].sort(), starter.items.map((item) => item.name).sort());
  assert.deepEqual(CHOOSE_FIRST_CHECK, { kind: "choose-first" });
});

// ---- on a copy of this repository, in git ---------------------------------------------------------

const git = (dir, ...args) => {
  const run = spawnSync("git", ["-C", dir, ...args], { encoding: "utf8" });
  assert.equal(run.status, 0, `git ${args.join(" ")}: ${run.stderr}`);
  return run.stdout;
};

// A copy of this repository with its gate, committed as the main branch, then a branch off it.
function copyInGit() {
  const dir = mkdtempSync(path.join(tmpdir(), "design-choose-first-"));
  made.push(dir);
  for (const file of [
    "design",
    "src",
    "tools/design-assembly",
    "Makefile",
    "mk",
    "package.json",
    "components.json",
  ]) {
    if (existsSync(path.join(ROOT, file))) {
      cpSync(path.join(ROOT, file), path.join(dir, file), { recursive: true });
    }
  }
  git(dir, "init", "-q", "-b", "main");
  git(dir, "config", "user.name", "Test Person");
  git(dir, "config", "user.email", "test@example.com");
  git(dir, "add", "-A");
  git(dir, "commit", "-q", "-m", "start");
  git(dir, "checkout", "-q", "-b", "feature");
  return dir;
}
const shapesOf = (dir) => runChecks(readState(dir)).find((item) => item.id === "ledger-shapes");
const FRAGMENT = (extra = "") =>
  `name: StatusBadge\nfile: ${NEW_FILE}\nsource: by-hand\nneed: status-badge\ndescription: No store shows a state in one word\napproved: 2026-11-24\n${extra}`;

test("criterion 11, broken: on a copy of this repository a component file the branch adds with no row turns ledger-shapes red", () => {
  const dir = copyInGit();
  assert.equal(shapesOf(dir).problem, null);
  assert.equal(shapesOf(dir).seenFailing, true);
  put(dir, NEW_FILE, COMPONENT("StatusBadge"));
  assert.match(shapesOf(dir).problem, /src\/components\/status-badge\.tsx/);
  // Listing it as made before, on this branch, is no way round: the main branch never had it.
  const shared = path.join(dir, "design/intake/_shared.yaml");
  const was = readFileSync(shared, "utf8");
  put(
    dir,
    "design/intake/_shared.yaml",
    `${was}  - name: StatusBadge\n    file: ${NEW_FILE}\n    why: made before the intake ledger was kept\n`,
  );
  assert.match(shapesOf(dir).problem, /src\/components\/status-badge\.tsx/);
  put(dir, "design/intake/_shared.yaml", was);
  // A row made by hand records it, with the words searched and the nearest candidate.
  put(dir, "design/intake/status-badge.yaml", FRAGMENT("searched: status badge\nnearest: none\n"));
  assert.equal(shapesOf(dir).problem, null);
});

test("criterion 11, broken: on a copy of this repository a row made by hand without the words searched or the nearest candidate turns ledger-shapes red", () => {
  const dir = copyInGit();
  put(dir, NEW_FILE, COMPONENT("StatusBadge"));
  put(dir, "design/intake/status-badge.yaml", FRAGMENT());
  assert.match(shapesOf(dir).problem, /status-badge.*searched/s);
  put(dir, "design/intake/status-badge.yaml", FRAGMENT("searched: status badge\n"));
  assert.match(shapesOf(dir).problem, /nearest/);
  put(
    dir,
    "design/intake/status-badge.yaml",
    FRAGMENT("searched: status badge\nnearest: MadeUpThing\n"),
  );
  assert.match(shapesOf(dir).problem, /MadeUpThing/);
});

test("criterion 11, broken: on a copy of this repository a second row for one need turns ledger-shapes red", () => {
  // Held since the store was built (specification 0006): one need, one solution. Kept here so
  // the gate that holds the choice is seen holding all three of its cases.
  const dir = copyInGit();
  const ledger = path.join(dir, "design/intake/list-load-retry-filter.yaml");
  const twin = readFileSync(ledger, "utf8").replace("name: useList", "name: useOtherList");
  put(dir, "design/intake/list-load-retry-filter-2.yaml", twin);
  assert.match(shapesOf(dir).problem, /list-load-retry-filter/);
});

test("criterion 11: a repository green today stays green once it upgrades: what the main branch has is not this branch's", () => {
  const dir = copyInGit();
  // On the main branch: a component with no row, and a row made by hand without the new keys.
  git(dir, "checkout", "-q", "main");
  put(dir, NEW_FILE, COMPONENT("StatusBadge"));
  put(dir, "design/intake/status-badge.yaml", FRAGMENT());
  git(dir, "add", "-A");
  git(dir, "commit", "-q", "-m", "written before the gate held the choice");
  assert.equal(shapesOf(dir).problem, null);
  git(dir, "checkout", "-q", "-B", "feature");
  assert.equal(shapesOf(dir).problem, null);
});
