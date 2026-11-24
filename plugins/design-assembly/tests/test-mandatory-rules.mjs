// A mandatory rule cannot be exempted, and the exemptions reach the owner (specification 0015,
// addendum, item 11.8, criteria 22 to 25). A rule is mandatory when a row of the repository's own
// decision ledger holds it; conform and intake refuse every way an item turns one off; a record
// written before keeps the gate green and is named; and before intake writes the row of an outside
// item, the owner keeps or refuses the list of its exemptions. Nothing calls a model or the network.
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { readFileSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import { execPath } from "node:process";
import { after, test } from "node:test";
import { fileURLToPath } from "node:url";

import { CONFORM_FOLDER, shapeProblems } from "../templates/tools/design-assembly/contract.mjs";
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
const INTAKE = path.join(PLUGIN, "scripts/intake.mjs");
const CONFORM = path.join(PLUGIN, "scripts/conform.mjs");
const DECIDE = path.join(PLUGIN, "scripts/decide.mjs");
const INVENTORY = path.join(PLUGIN, "scripts/inventory.mjs");
const OWNER = ["--by", "The Owner", "--on", "2026-11-18"];

after(cleanUp);

const read = (dir, file) => readFileSync(path.join(dir, file), "utf8");
const node = (script, args) => spawnSync(execPath, [script, ...args], { encoding: "utf8" });
const intake = (dir, ...args) => node(INTAKE, ["--target", dir, ...args]);
const conform = (dir, ...args) =>
  node(CONFORM, ["--target", dir, "--need", "narrow-list", ...args]);
function answer(dir, line) {
  const file = path.join(empty(), "answers.txt");
  writeFileSync(file, `${line}\n`);
  const run = node(DECIDE, ["--target", dir, "--answers", file, ...OWNER]);
  assert.equal(run.status === 0 || run.status === 1, true, run.stderr);
}

const MAIN = "src/components/kit/narrow-list.tsx";
const CHIP = "src/components/kit/narrow-chip.tsx";
const BASE = "src/components/ui/narrow-popover.tsx";
const MAIN_CODE = COMPONENT("NarrowList");
const CHIP_CODE = COMPONENT("NarrowChip");
const BASE_CODE = COMPONENT("NarrowPopover");
const RECORD_FILE = `${CONFORM_FOLDER}/narrow-list.json`;
const MANDATORY = "shadcn/require-static-classes";
const HELD_BY = "whole-class-names";

// The repository's own decision ledger: one row holds a lint rule, as the sample application's does.
const DECISIONS = [
  "version: 1",
  "decisions:",
  `  - id: ${HELD_BY}`,
  "    layer: foundations",
  "    kind: standard",
  '    source: "class names are written whole"',
  `    check: "eslint:${MANDATORY}"`,
  "  - id: spacing",
  "    layer: foundations",
  "    kind: standard",
  '    source: "the spacing scale"',
  '    check: "eslint:shadcn/no-arbitrary-values"',
  "",
].join("\n");

const ITEM = {
  name: "filter-bar",
  files: [{ path: "narrow-list.tsx" }, { path: "narrow-chip.tsx" }],
};
const store = (files = {}) =>
  repo({
    ...healthyFiles(),
    "design/theme.json": json({ version: 1, checks: {} }),
    "design/decisions.yaml": DECISIONS,
    "tools/kit/snapshot/filter-bar.json": json(ITEM),
    [MAIN]: MAIN_CODE,
    [CHIP]: CHIP_CODE,
    ...files,
  });
const record = (fields = {}) => {
  const main = fields.main ?? MAIN_CODE;
  const chip = fields.chip ?? CHIP_CODE;
  const extra = fields.extra ?? [];
  return {
    version: 1,
    need: "narrow-list",
    source: "kit",
    item: "filter-bar",
    taken: [
      { file: MAIN, sha256: sha(main) },
      { file: CHIP, sha256: sha(chip) },
      ...extra.map(([file, code]) => ({ file, sha256: sha(code) })),
    ],
    patches: [],
    exemptions: fields.exemptions ?? [],
    conformed: [
      { file: MAIN, sha256: sha(main) },
      { file: CHIP, sha256: sha(chip) },
      ...extra.map(([file, code]) => ({ file, sha256: sha(code) })),
    ],
  };
};
const kept = (dir) => {
  intake(dir, "--need", "narrow-list", "filter", "bar");
  answer(dir, "intake-narrow-list giữ");
};
const takeIn = (dir) => intake(dir, "--need", "narrow-list", "--file", MAIN, "--json");
const rowOf = (dir) =>
  readIntakeLedger(ledgerText(dir, "design/intake.yaml", "intake")).blocks.find(
    (block) => block.need === "narrow-list",
  );
const exemption = (rule, file = MAIN, reason = "the source writes it so") => ({
  rule,
  file,
  reason,
});

// ---- criterion 22: conform refuses a mandatory rule ----------------------------------------------

test("criterion 22: conform --exempt refuses a rule a row of the decision ledger holds, and names the row", () => {
  const dir = store({ [RECORD_FILE]: json(record()) });
  const refused = conform(
    dir,
    "--exempt",
    MANDATORY,
    "--file",
    MAIN,
    "--reason",
    "it is the source's",
  );
  assert.equal(refused.status, 2, refused.stdout);
  assert.match(refused.stderr, new RegExp(`${MANDATORY}.*${HELD_BY}`));
  assert.deepEqual(JSON.parse(read(dir, RECORD_FILE)).exemptions, []);
  // A rule no row holds is still let off, with its reason.
  const allowed = conform(
    dir,
    "--exempt",
    "react-hooks/exhaustive-deps",
    "--file",
    MAIN,
    "--reason",
    "the source's effect",
  );
  assert.equal(allowed.status, 0, allowed.stderr);
  // A repository whose decision ledger points at no rule holds none mandatory: the same rule is let
  // off with its reason (limit no-mandatory-rule-declared).
  const none = store({ [RECORD_FILE]: json(record()) });
  rmSync(path.join(none, "design/decisions.yaml"));
  const free = conform(
    none,
    "--exempt",
    MANDATORY,
    "--file",
    MAIN,
    "--reason",
    "it is the source's",
  );
  assert.equal(free.status, 0, free.stderr);
});

test("criterion 22: conform --exempt refuses a lint configuration that lets the item's folder off every rule, and takes it for the base library's own folder", () => {
  const dir = store({
    [RECORD_FILE]: json(record({ extra: [[BASE, BASE_CODE]] })),
    [BASE]: BASE_CODE,
    "eslint.config.js": 'export default [{ ignores: ["src/components/kit/**"] }];\n',
  });
  const refused = conform(
    dir,
    "--exempt",
    "lint-config",
    "--file",
    "eslint.config.js",
    "--reason",
    "the item's folder is the source's",
  );
  assert.equal(refused.status, 2, refused.stdout);
  assert.match(refused.stderr, /every rule/);
  assert.match(refused.stderr, new RegExp(HELD_BY));
  // The base library's own folder, set apart by the repository's configuration, is let off.
  put(dir, "eslint.config.js", 'export default [{ ignores: ["src/components/ui/**"] }];\n');
  const base = conform(
    dir,
    "--exempt",
    "lint-config",
    "--file",
    "eslint.config.js",
    "--reason",
    "the repository's own configuration sets its component library apart",
  );
  assert.equal(base.status, 0, base.stderr);
});

// ---- criterion 22: intake refuses every way an item turns a mandatory rule off --------------------

const WAYS = [
  {
    name: "a comment for its line",
    main: `${MAIN_CODE}const a = 1; // eslint-disable-line ${MANDATORY}\n`,
    rule: MANDATORY,
  },
  {
    name: "a comment for the next line",
    main: `// eslint-disable-next-line ${MANDATORY}\n${MAIN_CODE}`,
    rule: MANDATORY,
  },
  {
    name: "a comment for the whole file",
    main: `/* eslint-disable ${MANDATORY} */\n${MAIN_CODE}`,
    rule: MANDATORY,
  },
  {
    name: "a comment that names no rule, so every rule",
    main: `/* eslint-disable */\n${MAIN_CODE}`,
    rule: "*",
  },
  {
    name: "the lint configuration, for the item's folder",
    files: { "eslint.config.js": 'export default [{ ignores: ["src/components/kit/**"] }];\n' },
    exempt: exemption("lint-config", "eslint.config.js"),
  },
  {
    name: "an ignore file of the lint, for the item's folder",
    files: { ".eslintignore": "src/components/kit/\n" },
    exempt: exemption("lint-config", ".eslintignore"),
  },
];

for (const way of WAYS) {
  test(`criterion 22, broken: intake refuses an item that turns a mandatory rule off by ${way.name}, even with an exemption`, () => {
    const main = way.main ?? MAIN_CODE;
    const exemptions = [way.exempt ?? exemption(way.rule)];
    const dir = store({
      [MAIN]: main,
      ...(way.files ?? {}),
      [RECORD_FILE]: json(record({ main, exemptions })),
    });
    kept(dir);
    const before = read(dir, "design/intake.yaml");
    const run = takeIn(dir);
    assert.equal(run.status, 2, run.stdout);
    assert.match(run.stderr, new RegExp(HELD_BY));
    assert.match(run.stderr, /Nothing was written/);
    assert.equal(read(dir, "design/intake.yaml"), before);
  });
}

// ---- criterion 23: what stays exemptable -----------------------------------------------------------

test("criterion 23: strict type checks, rules no row holds and the base library's folder stay exemptable, each with its reason", () => {
  const main = `// @ts-nocheck\n// eslint-disable-next-line react-hooks/exhaustive-deps\n${MAIN_CODE}`;
  const exemptions = [
    exemption("@ts-nocheck"),
    exemption("react-hooks/exhaustive-deps"),
    exemption("lint-config", "eslint.config.js", "the repository sets its component library apart"),
  ];
  const dir = store({
    [MAIN]: main,
    [BASE]: BASE_CODE,
    "eslint.config.js": 'export default [{ ignores: ["src/components/ui/**"] }];\n',
    [RECORD_FILE]: json(record({ main, exemptions, extra: [[BASE, BASE_CODE]] })),
  });
  kept(dir);
  const run = takeIn(dir);
  // Not refused: the list of exemptions goes to the owner first (criterion 25).
  assert.equal(run.status, 1, run.stderr);
  assert.equal(JSON.parse(run.stdout).waiting, "exemptions-narrow-list");
});

// ---- criterion 24: a record written before -----------------------------------------------------------

test("criterion 24: a record written before, with an exemption of a rule now mandatory, is named, never red, and not conformed again while it is there", () => {
  const main = `// eslint-disable-next-line ${MANDATORY}\n${MAIN_CODE}`;
  const dir = store({
    [MAIN]: main,
    [RECORD_FILE]: json(record({ main, exemptions: [exemption(MANDATORY)] })),
  });
  // Its shape holds: nothing the gate reads turns red.
  assert.deepEqual(shapeProblems("conform", read(dir, RECORD_FILE), RECORD_FILE), []);
  const plain = conform(dir, "--json");
  assert.equal(plain.status, 1, plain.stderr);
  assert.match(
    JSON.parse(plain.stdout).problems.join("\n"),
    new RegExp(`exempts ${MANDATORY}, which the decision ${HELD_BY} holds`),
  );
  const inventory = JSON.parse(node(INVENTORY, ["--target", dir, "--json"]).stdout);
  const named = inventory.findings.filter((finding) => finding.kind === "exempts-mandatory");
  assert.equal(named.length, 1, JSON.stringify(inventory.findings));
  assert.match(named[0].evidence.join("\n"), new RegExp(HELD_BY));
  // Conforming it again with the exemption still there is refused.
  const again = conform(dir, "--taken-down");
  assert.equal(again.status, 2, again.stdout);
  assert.match(again.stderr, new RegExp(`${MANDATORY}.*${HELD_BY}`));
  const exempt = conform(dir, "--exempt", "@ts-nocheck", "--file", CHIP, "--reason", "untyped");
  assert.equal(exempt.status, 2, exempt.stdout);
});

// ---- criterion 25: the list of exemptions reaches the owner -------------------------------------------

const ALLOWED = (main) =>
  [
    exemption("@ts-nocheck", MAIN, "the source is not typed to this repository's strict level"),
    exemption("react-hooks/exhaustive-deps", MAIN, "the source's effect reads one value"),
    exemption("react-hooks/exhaustive-deps", CHIP, "the source's effect reads one value"),
  ].map((entry) => ({ ...entry, file: entry.file === MAIN ? MAIN : CHIP, code: main }));
const allowedStore = () => {
  const main = `// @ts-nocheck\n// eslint-disable-next-line react-hooks/exhaustive-deps\n${MAIN_CODE}`;
  const chip = `// eslint-disable-next-line react-hooks/exhaustive-deps\n${CHIP_CODE}`;
  const exemptions = ALLOWED(main).map(({ rule, file, reason }) => ({ rule, file, reason }));
  const dir = store({
    [MAIN]: main,
    [CHIP]: chip,
    [RECORD_FILE]: json(record({ main, chip, exemptions })),
  });
  return { dir, exemptions, main, chip };
};

test("criterion 25: before the row is written, the list of exemptions goes to the owner as one question, and nothing is written until it is kept", () => {
  const { dir, exemptions } = allowedStore();
  kept(dir);
  const before = read(dir, "design/intake.yaml");
  const asked = takeIn(dir);
  assert.equal(asked.status, 1, asked.stderr);
  assert.equal(read(dir, "design/intake.yaml"), before);
  const question = JSON.parse(read(dir, "design/waiting/exemptions-narrow-list.json"));
  assert.equal(question.item, "exemptions:narrow-list");
  assert.deepEqual(question.exemptions, exemptions);
  assert.equal(question.answer, undefined);
  // The decision sheet lays the list out by rule, each with its reason and its files.
  const sheet = node(DECIDE, ["--target", dir]).stdout;
  assert.match(sheet, /exemptions-narrow-list/);
  assert.match(sheet, /react-hooks\/exhaustive-deps \(2\): the source's effect reads one value/);
  assert.match(
    sheet,
    /src\/components\/kit\/narrow-list\.tsx, src\/components\/kit\/narrow-chip\.tsx/,
  );
  // Asked again while it waits: nothing more is written.
  assert.equal(takeIn(dir).status, 1);
  assert.equal(read(dir, "design/intake.yaml"), before);
  answer(dir, "exemptions-narrow-list giữ");
  const done = takeIn(dir);
  assert.equal(done.status, 0, done.stderr);
  assert.equal(rowOf(dir).conform, RECORD_FILE);
});

test("criterion 25: a refused list writes nothing, and an exemption added after the owner kept the list does not ride in on the old answer", () => {
  const refused = allowedStore();
  kept(refused.dir);
  const before = read(refused.dir, "design/intake.yaml");
  takeIn(refused.dir);
  answer(refused.dir, "exemptions-narrow-list bác patch the effect instead");
  const run = takeIn(refused.dir);
  assert.equal(run.status, 1, run.stderr);
  assert.equal(read(refused.dir, "design/intake.yaml"), before);
  assert.equal(rowOf(refused.dir), undefined);

  const later = allowedStore();
  kept(later.dir);
  takeIn(later.dir);
  answer(later.dir, "exemptions-narrow-list giữ");
  // One more exemption, after the answer.
  const chip = `// @ts-nocheck\n${later.chip}`;
  put(later.dir, CHIP, chip);
  put(
    later.dir,
    RECORD_FILE,
    json(
      record({
        main: later.main,
        chip,
        exemptions: [...later.exemptions, exemption("@ts-nocheck", CHIP, "untyped too")],
      }),
    ),
  );
  const again = takeIn(later.dir);
  assert.equal(again.status, 1, again.stderr);
  assert.equal(JSON.parse(again.stdout).waiting, "exemptions-narrow-list-2");
  assert.equal(rowOf(later.dir), undefined);
});

test("criterion 25: an item with no exemption is written once the candidate is kept, with no second question", () => {
  const dir = store({ [RECORD_FILE]: json(record()) });
  kept(dir);
  const done = takeIn(dir);
  assert.equal(done.status, 0, done.stderr);
  rmSync(path.join(dir, RECORD_FILE));
});
