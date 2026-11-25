// What the tests of slice 2 of item 7.2 share (spec 0016, criteria 12 and 13): a family of small
// repositories whose intake ledgers say what each block is for, a core folder beside them, and the
// calls of the commands. Every repository and core is a fixture in a temporary folder; nothing here
// calls a model or the network, and each test keeps a list of cores of its own.
import assert from "node:assert/strict";
import path from "node:path";

import { coreFolder, join, json, listIn, OWNER, run, storeRepo } from "./core-blocks-repo.mjs";
import { BLOCKS, block, COMPONENT } from "./store-repo.mjs";

export const FILTER_BAR = COMPONENT("FilterBar");
export const ON = "2026-11-28";
export const WHY = "The orders screen filters a long list";
// What each block of the fixture is for, as its row says: the need in one plain sentence.
export const SAYS = {
  "many-rows": "A table for many rows of one kind",
  "filter-list": "A bar of filters over a long list",
  "row-actions-column": "The actions of one row of a table",
};

// A row of the intake ledger with what its block is for.
const row = (said) =>
  `${block(said)}${said.description === null ? "" : `\n    description: ${said.description ?? SAYS[said.need]}`}`;
// An intake ledger of rows that each say what their block is for.
export const ledgerOf = (blocks = BLOCKS) =>
  ["version: 1", "blocks:", ...blocks.map(row), ""].join("\n");
export const [DATA_REGION_ROW, FILTER_BAR_ROW, TABLE_ACTIONS_ROW] = BLOCKS;

export const core = (args, list, extra) => run("core.mjs", args, list, extra);
export const report = (dir, list, more = []) =>
  core(["--target", dir, "--report", ...more], list, { guard: true });

// A repository of the fixture with the rows given, each saying what its block is for.
export const repoOf = (name, { rows = BLOCKS, files = {} } = {}) =>
  storeRepo({ "design/intake.yaml": ledgerOf(rows), ...files }, name);
// A repository with no FilterBar of its own: it holds the outside table and the starter piece.
export const withoutFilterBar = (name, files = {}) =>
  repoOf(name, {
    rows: [DATA_REGION_ROW, TABLE_ACTIONS_ROW],
    files: {
      "src/components/filter-bar.tsx": null,
      "src/pages/Team.tsx": "export default function Team() {\n  return null;\n}\n",
      ...files,
    },
  });

// A family: the first repository, which holds FilterBar as its own block and never joined; a core
// beside it that names it first; and a list of cores of the test's own.
export function family({ firstRows = BLOCKS, blocks = [] } = {}) {
  const first = repoOf("first-app", { rows: firstRows });
  const place = coreFolder({ blocks });
  const list = listIn();
  return { first, place, list };
}
// A member of the family, joined: the join must end well.
export function joined(dir, place, list) {
  const done = join(dir, place, list);
  assert.equal(done.status, 0, done.stdout + done.stderr);
  return done;
}
export const promote = (dir, place, list, need, more = []) =>
  core(
    [
      "--target",
      dir,
      "--promote",
      need,
      "--core",
      place,
      "--by",
      OWNER,
      "--why",
      "Every product of the family filters its lists",
      "--on",
      ON,
      ...more,
    ],
    list,
    { guard: true },
  );
export const reportFile = (name) => path.posix.join("members", `${name}.json`);
export { json };
