// An item of an outside source is taken down, conformed, and only then taken in (specification
// 0015, slice 2, criteria 3 to 6): the question says what the item brings before the owner keeps
// it; the conform record holds every file as taken down and after patching, each patch with its
// reason and each exemption with its rule; a file of the repository that uses an item not taken in
// turns the gate red; and intake refuses a row while the record is missing or a rule is off with
// no exemption. Nothing calls a model or the network.
import "./helpers/own-cores.mjs";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { cpSync, existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { execPath } from "node:process";
import { after, test } from "node:test";
import { fileURLToPath } from "node:url";

import {
  CONFORM_FOLDER,
  LEDGERS,
  shapeProblems,
} from "../templates/tools/design-assembly/contract.mjs";
import { KINDS_FOR_TEST, readState, runChecks } from "../templates/tools/design-assembly/check.mjs";
import { readIntakeLedger } from "../templates/tools/design-assembly/intake-ledger.mjs";
import { ledgerText } from "../templates/tools/design-assembly/screen-fragments.mjs";
import {
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
const ROOT = path.resolve(PLUGIN, "../..");
const INTAKE = path.join(PLUGIN, "scripts/intake.mjs");
const DECIDE = path.join(PLUGIN, "scripts/decide.mjs");
const OWNER = ["--by", "The Owner", "--on", "2026-11-18"];

after(cleanUp);
const made = [];
after(() => made.forEach((dir) => rmSync(dir, { recursive: true, force: true })));

const read = (dir, file) => readFileSync(path.join(dir, file), "utf8");
const node = (script, args) => spawnSync(execPath, [script, ...args], { encoding: "utf8" });
const intake = (dir, ...args) => node(INTAKE, ["--target", dir, ...args]);
function answer(dir, line) {
  const file = path.join(empty(), "answers.txt");
  writeFileSync(file, `${line}\n`);
  const run = node(DECIDE, ["--target", dir, "--answers", file, ...OWNER]);
  assert.equal(run.status === 0 || run.status === 1, true, run.stderr);
}

// ---- criterion 5: the shape of the conform record ------------------------------------------------

const MAIN = "src/components/kit/narrow-list.tsx";
const CHIP = "src/components/kit/narrow-chip.tsx";
const MAIN_TAKEN = `${COMPONENT("NarrowList")}// as taken down\n`;
const MAIN_CODE = COMPONENT("NarrowList");
const CHIP_CODE = COMPONENT("NarrowChip");
const record = (fields = {}) => ({
  version: 1,
  need: "narrow-list",
  source: "kit",
  item: "filter-bar",
  taken: [
    { file: MAIN, sha256: sha(MAIN_TAKEN) },
    { file: CHIP, sha256: sha(CHIP_CODE) },
  ],
  patches: [{ file: MAIN, reason: "the words of the list come from the repository's labels" }],
  exemptions: [],
  conformed: [
    { file: MAIN, sha256: sha(MAIN_CODE) },
    { file: CHIP, sha256: sha(CHIP_CODE) },
  ],
  ...fields,
});
const RECORD_FILE = `${CONFORM_FOLDER}/narrow-list.json`;
const shape = (data, file = RECORD_FILE) => shapeProblems("conform", JSON.stringify(data), file);
const without = (key) => {
  const data = record();
  delete data[key];
  return data;
};

test("criterion 5: the conform record holds every file as taken down and after patching, each patch and each exemption with its reason", () => {
  assert.equal(LEDGERS.conform.folder, CONFORM_FOLDER);
  assert.deepEqual(shape(record()), []);
  for (const key of ["source", "item", "taken", "patches", "exemptions", "conformed"]) {
    assert.ok(shape(without(key)).includes(`${RECORD_FILE}.${key} is missing`), key);
  }
  assert.deepEqual(shape(record({ patches: [{ file: MAIN }] })), [
    `${RECORD_FILE}.patches[0].reason is missing`,
  ]);
  for (const key of ["rule", "file", "reason"]) {
    const exemption = { rule: "no-console", file: MAIN, reason: "the source logs on purpose" };
    delete exemption[key];
    assert.ok(
      shape(record({ exemptions: [exemption] })).includes(
        `${RECORD_FILE}.exemptions[0].${key} is missing`,
      ),
      key,
    );
  }
  assert.deepEqual(shape(record({ taken: [], conformed: [] })), [
    `${RECORD_FILE}.taken names no file: a record holds every file of its item as taken down`,
  ]);
  assert.deepEqual(shape(record({ conformed: [{ file: MAIN, sha256: sha(MAIN_CODE) }] })), [
    `${RECORD_FILE}.conformed leaves out ${CHIP}, which taken holds: a record holds every file after patching`,
  ]);
  assert.deepEqual(
    shape(record({ patches: [{ file: "src/other.tsx", reason: "a stray change" }] })),
    [`${RECORD_FILE}.patches[0].file is src/other.tsx, which is no file of the item`],
  );
  assert.deepEqual(shape(record(), `${CONFORM_FOLDER}/other.json`), [
    `${CONFORM_FOLDER}/other.json is named other.json and its need is narrow-list: a record is named after its need`,
  ]);
});

// ---- criterion 4: a file of the repository that uses an item not taken in ----------------------

const USER = "src/pages/People.tsx";
const USES = `import { NarrowList } from "@/components/kit/narrow-list";\nexport default function People() {\n  return <NarrowList rows={[]} />;\n}\n`;
const NO_ROWS = "version: 1\nblocks: []\n";
const takenDownState = ({ intakeText = NO_ROWS, user = USES } = {}) => ({
  files: { [LEDGERS.intake.file]: intakeText },
  ledgerFolders: { [CONFORM_FOLDER]: { [RECORD_FILE]: JSON.stringify(record()) } },
  sources: {
    src: {
      [MAIN]: MAIN_CODE,
      [CHIP]: CHIP_CODE,
      ...(user ? { [USER]: user } : {}),
    },
  },
});
const CHECK = { kind: "taken-down", sources: "src" };
const takenDown = KINDS_FOR_TEST["taken-down"];

test("criterion 4: a file that uses an item taken down and not taken in turns the gate red, naming the item", () => {
  assert.equal(
    takenDown.run(takenDownState(), CHECK),
    `${USER} uses ${MAIN}, a file of filter-bar from the source kit, which was taken down for the need narrow-list and is not taken in: conform it and take it in with intake --need narrow-list, or stop using it`,
  );
  // Its own files may use one another; nothing outside it uses it, so nothing is wrong.
  assert.equal(takenDown.run(takenDownState({ user: null }), CHECK), null);
  // Taken in: a row of the intake ledger answers the need.
  const taken = `version: 1\nblocks:\n  - name: NarrowList\n    file: ${MAIN}\n    source: filter-bar\n    from: kit\n    need: narrow-list\n    approved: 2026-11-18\n`;
  assert.equal(takenDown.run(takenDownState({ intakeText: taken }), CHECK), null);
  // The check is seen failing on a copy it changes.
  const clean = {
    files: { [LEDGERS.intake.file]: NO_ROWS },
    ledgerFolders: {},
    sources: { src: {} },
  };
  assert.equal(takenDown.run(clean, CHECK), null);
  assert.notEqual(takenDown.run(takenDown.change(clean, CHECK), CHECK), null);
});

test("criterion 4, broken: on a copy of this repository a page that imports an item not taken in turns ledger-shapes red", () => {
  const dir = mkdtempSync(path.join(tmpdir(), "design-conform-"));
  made.push(dir);
  for (const file of ["design", "src", "tools/design-assembly", "Makefile", "mk", "package.json"]) {
    if (existsSync(path.join(ROOT, file))) {
      cpSync(path.join(ROOT, file), path.join(dir, file), { recursive: true });
    }
  }
  const shapes = () => runChecks(readState(dir)).find((item) => item.id === "ledger-shapes");
  assert.equal(shapes().problem, null);
  assert.equal(shapes().seenFailing, true);
  put(dir, MAIN, MAIN_CODE);
  put(dir, CHIP, CHIP_CODE);
  put(dir, RECORD_FILE, json(record()));
  put(dir, USER, USES);
  assert.match(
    shapes().problem,
    /src\/pages\/People\.tsx uses src\/components\/kit\/narrow-list\.tsx, a file of filter-bar from the source kit/,
  );
});

// ---- criteria 3 and 6: the question, and intake's refusal ---------------------------------------

const ITEM = {
  name: "filter-bar",
  files: [{ path: "narrow-list.tsx" }, { path: "narrow-chip.tsx" }],
  dependencies: ["date-fns", "@tanstack/react-virtual"],
  registryDependencies: ["button", "input", "@kit/narrow-core"],
};
const BUTTON = 'export function Button() {\n  return <button type="button" />;\n}\n';
const store = (files = {}) =>
  repo({
    ...healthyFiles(),
    "design/theme.json": json({ version: 1, checks: {} }),
    "tools/kit/snapshot/filter-bar.json": json(ITEM),
    "src/components/ui/button.tsx": BUTTON,
    ...files,
  });
const ask = (dir) => intake(dir, "--need", "narrow-list", "filter", "bar");
const kept = (dir) => {
  ask(dir);
  answer(dir, "intake-narrow-list giữ");
};
const takeIn = (dir) => intake(dir, "--need", "narrow-list", "--file", MAIN, "--json");
const rowOf = (dir) =>
  readIntakeLedger(ledgerText(dir, "design/intake.yaml", "intake")).blocks.find(
    (block) => block.need === "narrow-list",
  );

test("criterion 3: before the owner keeps an outside candidate, the question says what it brings, read from the pinned snapshot", () => {
  const dir = store();
  assert.equal(ask(dir).status, 1);
  const question = JSON.parse(read(dir, "design/waiting/intake-narrow-list.json"));
  const [first] = question.candidates;
  assert.equal(first.name, "filter-bar");
  assert.deepEqual(first.brings, {
    files: 2,
    packages: ["date-fns", "@tanstack/react-virtual"],
    asks_for: ["button", "input", "@kit/narrow-core"],
    writes_over: ["src/components/ui/button.tsx"],
    words:
      "2 files of its own; the packages date-fns, @tanstack/react-virtual; 3 more items it asks for (button, input, @kit/narrow-core), whose files the snapshot does not hold; it asks to write over src/components/ui/button.tsx",
  });
  // The decision sheet shows it beside the candidate.
  const sheet = node(DECIDE, ["--target", dir]);
  assert.match(sheet.stdout, /brings 2 files of its own; the packages date-fns/);
  // A source whose snapshot does not hold the item says that it cannot tell.
  const blind = store();
  rmSync(path.join(blind, "tools/kit/snapshot/filter-bar.json"));
  ask(blind);
  const said = JSON.parse(read(blind, "design/waiting/intake-narrow-list.json")).candidates[0];
  assert.deepEqual(said.brings, {
    words:
      "what it brings cannot be read: the pinned snapshot holds no tools/kit/snapshot/filter-bar.json",
  });
});

test("criterion 6, broken: intake refuses a row for an outside item while its conform record is missing, and writes nothing", () => {
  const dir = store({ [MAIN]: MAIN_CODE, [CHIP]: CHIP_CODE });
  kept(dir);
  const before = read(dir, "design/intake.yaml");
  const run = takeIn(dir);
  assert.equal(run.status, 2, run.stdout);
  assert.match(
    run.stderr,
    /narrow-list takes filter-bar from the outside source kit, and no conform record design\/conform\/narrow-list\.json holds its files as taken down and after patching, its patches and its exemptions: conform it first\. Nothing was written/,
  );
  assert.equal(read(dir, "design/intake.yaml"), before);
  // A record that breaks its shape is refused the same way, with what is wrong.
  put(dir, RECORD_FILE, json(without("exemptions")));
  assert.match(takeIn(dir).stderr, /design\/conform\/narrow-list\.json\.exemptions is missing/);
  // A record of another item, or one whose files on disk are not the files it holds, is refused.
  put(dir, RECORD_FILE, json(record({ item: "data-grid-1" })));
  assert.match(takeIn(dir).stderr, /holds data-grid-1, and the owner kept filter-bar/);
  put(dir, RECORD_FILE, json(record()));
  put(dir, CHIP, `${CHIP_CODE}// changed after the record\n`);
  assert.match(
    takeIn(dir).stderr,
    /src\/components\/kit\/narrow-chip\.tsx is not the file the conform record holds after patching/,
  );
  assert.equal(read(dir, "design/intake.yaml"), before);
});

test("criterion 6, broken: intake refuses a row while a rule is turned off in a file of the item with no exemption for it", () => {
  const off = `// eslint-disable-next-line react-hooks/set-state-in-effect\n${MAIN_CODE}`;
  const nocheck = `// @ts-nocheck\n${CHIP_CODE}`;
  const files = (main, chip) => ({ [MAIN]: main, [CHIP]: chip });
  const conformedOf = (main, chip) => [
    { file: MAIN, sha256: sha(main) },
    { file: CHIP, sha256: sha(chip) },
  ];
  const dir = store(files(off, CHIP_CODE));
  kept(dir);
  const before = read(dir, "design/intake.yaml");
  put(dir, RECORD_FILE, json(record({ conformed: conformedOf(off, CHIP_CODE) })));
  assert.match(
    takeIn(dir).stderr,
    /src\/components\/kit\/narrow-list\.tsx turns off react-hooks\/set-state-in-effect, and the conform record has no exemption for that rule in that file\. Nothing was written/,
  );
  put(dir, CHIP, nocheck);
  put(dir, MAIN, MAIN_CODE);
  put(dir, RECORD_FILE, json(record({ conformed: conformedOf(MAIN_CODE, nocheck) })));
  assert.match(
    takeIn(dir).stderr,
    /narrow-chip\.tsx turns off @ts-nocheck, and the conform record has no exemption/,
  );
  assert.equal(read(dir, "design/intake.yaml"), before);
  // With the exemption, the row is written, and points at its record.
  put(
    dir,
    RECORD_FILE,
    json(
      record({
        conformed: conformedOf(MAIN_CODE, nocheck),
        exemptions: [
          {
            rule: "@ts-nocheck",
            file: CHIP,
            reason: "the source is not typed to this repository's strict level",
          },
        ],
      }),
    ),
  );
  // The list of exemptions goes to the owner first (the addendum of spec 0015, criterion 25).
  const asked = takeIn(dir);
  assert.equal(asked.status, 1, asked.stderr);
  assert.equal(read(dir, "design/intake.yaml"), before);
  answer(dir, "exemptions-narrow-list giữ");
  const done = takeIn(dir);
  assert.equal(done.status, 0, done.stderr);
  const row = rowOf(dir);
  assert.equal(row.conform, RECORD_FILE);
  assert.equal(row.taken, sha(MAIN_CODE));
  assert.deepEqual(
    shapeProblems("intake", ledgerText(dir, "design/intake.yaml", "intake"), "design/intake.yaml"),
    [],
  );
});

test("a ledger written by 0.50.0 still reads: a row of an outside item with no conform key keeps its place, and the gate leaves it be", () => {
  // The fixture's ledger holds an outside block taken in before records existed.
  const dir = store();
  const before = readIntakeLedger(ledgerText(dir, "design/intake.yaml", "intake"));
  const outside = before.blocks.find((block) => block.from === "kit");
  assert.ok(outside && outside.conform === undefined);
  assert.deepEqual(
    shapeProblems("intake", ledgerText(dir, "design/intake.yaml", "intake"), "design/intake.yaml"),
    [],
  );
  const store1 = intake(dir, "--need", outside.need, "--json");
  assert.equal(store1.status, 0, store1.stderr);
  assert.equal(JSON.parse(store1.stdout).rung, "store");
  // No record, nothing taken down: the check has nothing to say.
  const state = {
    files: { [LEDGERS.intake.file]: ledgerText(dir, "design/intake.yaml", "intake") },
    ledgerFolders: {},
    sources: { src: { [USER]: USES } },
  };
  assert.equal(takenDown.run(state, CHECK), null);
});

// ---- review: a source declares its folder, and the gate sees an item with no record --------------

const FOLDER = "src/components/kit";
const SOURCE_FILE = "design/sources/kit.json";
const declared = (fields = {}) =>
  JSON.stringify({
    version: 1,
    id: "kit",
    pin: { version: "1.0.0" },
    catalog: "design/kit-catalog.json",
    folder: FOLDER,
    ...fields,
  });
const folderState = ({
  source = declared(),
  intakeText = NO_ROWS,
  records = {},
  user = USES,
} = {}) => ({
  files: { [LEDGERS.intake.file]: intakeText },
  ledgerFolders: { "design/sources": { [SOURCE_FILE]: source }, [CONFORM_FOLDER]: records },
  sources: { src: { [MAIN]: MAIN_CODE, [CHIP]: CHIP_CODE, [USER]: user } },
});
const OLD_ROW = `version: 1\nblocks:\n  - name: NarrowList\n    file: ${MAIN}\n    source: filter-bar\n    from: kit\n    need: narrow-list\n    approved: 2026-11-18\n    taken: ${sha(MAIN_CODE)}\n`;

test("review, criterion 4: a file of a source's declared folder that no record lists and the code imports turns the gate red, naming the file and the source", () => {
  assert.deepEqual(
    shapeProblems("sources", declared(), SOURCE_FILE).filter((line) => /folder/.test(line)),
    [],
  );
  assert.deepEqual(
    shapeProblems("sources", declared({ folder: 3 }), SOURCE_FILE).filter((line) =>
      /folder/.test(line),
    ),
    [`${SOURCE_FILE}.folder is number, the contract says string`],
  );
  assert.equal(
    takenDown.run(folderState(), CHECK),
    `${USER} uses ${MAIN}, in the folder ${FOLDER} of the source kit, which no conform record of an item taken in lists: write the conform record of the item it belongs to and take it in with intake, or stop using it`,
  );
  // A source that declares no folder, as every source written by 0.50.0, says nothing.
  assert.equal(
    takenDown.run(folderState({ source: declared({ folder: undefined }) }), CHECK),
    null,
  );
  // The record of an item taken in lists the file: nothing to say.
  const taken = `version: 1\nblocks:\n  - name: NarrowList\n    file: ${MAIN}\n    source: filter-bar\n    from: kit\n    need: narrow-list\n    approved: 2026-11-18\n    conform: ${RECORD_FILE}\n`;
  assert.equal(
    takenDown.run(
      folderState({ intakeText: taken, records: { [RECORD_FILE]: JSON.stringify(record()) } }),
      CHECK,
    ),
    null,
  );
  // The item's own files import one another inside the folder: never named.
  assert.equal(
    takenDown.run(folderState({ user: 'import { NarrowChip } from "./narrow-chip";\n' }), CHECK),
    null,
  );
});

test("review, criterion 4: an item taken in by 0.50.0 or earlier, whose row names one file, keeps the gate green until its source declares a folder, and then says what to do", () => {
  // No folder declared: the row's file and its other files are used, and nothing is said.
  const chipUser = `${USES}import { NarrowChip } from "@/components/kit/narrow-chip";\nexport const Chip = NarrowChip;\n`;
  assert.equal(
    takenDown.run(
      folderState({ source: declared({ folder: undefined }), intakeText: OLD_ROW, user: chipUser }),
      CHECK,
    ),
    null,
  );
  // Declared: the file the row names is taken in; another file of the item is named, with what to do.
  assert.equal(
    takenDown.run(folderState({ intakeText: OLD_ROW, user: chipUser }), CHECK),
    `${USER} uses ${CHIP}, in the folder ${FOLDER} of the source kit, which no conform record of an item taken in lists: write the conform record of the item it belongs to and take it in with intake, or stop using it`,
  );
});
