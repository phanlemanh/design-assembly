// The ledger of screens: written once from the code, read back as the same data, held to the code
// by the gate, and read by the screen checks in place of the code, so states built by a function
// are no longer read as missing. When the reference repository is on this machine, its ledger is
// read too.
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { env } from "node:process";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

import { shapeProblems } from "../templates/tools/design-assembly/contract.mjs";
import { statesProblem } from "../templates/tools/design-assembly/patterns.mjs";
import { ledgerText } from "../templates/tools/design-assembly/screen-fragments.mjs";
import {
  builtScreens,
  readScreenLedger,
  renderScreenLedger,
} from "../templates/tools/design-assembly/screen-ledger.mjs";
import {
  kindsProblem,
  ledgerFromCode,
  screenLedgerProblem,
} from "../templates/tools/design-assembly/screens.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "../../..");

const PAGE = [
  "---",
  "nhom: list",
  "doi_tuong: A list.",
  "khuon:",
  "  ten: TypedTable",
  "nhan_dien:",
  '  - "src/example/**/*.tsx"',
  "mau_dang_chay:",
  "  tep: src/example/ItemsScreen.tsx",
  "khe_bat_buoc: [columns]",
  "cam_ngoai_khuon: [Table]",
  "ngoai_le: []",
  "nhan_viec: Find an item",
  "---",
  "",
].join("\n");
const PAGES = { "design/patterns/list.md": PAGE };
const SOURCES = {
  "src/example/ItemsScreen.tsx": "export function ItemsScreen() {}\n",
  "src/example/ArchiveScreen.tsx": "export function ArchiveScreen() {}\n",
};
const CORE = ["loading", "empty", "error", "no-results"];
const REQUIRED = JSON.stringify({ version: 1, required: CORE, exempt: {} });

// Two screens, the second with its states built by a function: what an agent wrote in a control run.
const CODE = [
  'const listStates = (name: string) => ["loading", "empty", "error", "no-results"].map((state) => ({ name: state, shows: name }));',
  "export const SCREENS = [",
  "  {",
  '    path: "/",',
  "    title: LABELS.itemsTitle,",
  '    load: () => import("@/example/ItemsScreen").then((m) => m.ItemsScreen),',
  '    states: [{ name: "loading", shows: "a" }, { name: "empty", shows: "b" }, { name: "error", shows: "c" }, { name: "no-results", shows: "d" }],',
  "  },",
  "  {",
  '    path: "/archive",',
  "    title: LABELS.archiveTitle,",
  '    load: () => import("@/example/ArchiveScreen").then((m) => m.ArchiveScreen),',
  "    states: listStates(LABELS.archiveTitle),",
  "  },",
  "];",
  "",
].join("\n");

test("the guide's first ledger is read from the code, and reads back as the same data", () => {
  const data = ledgerFromCode(CODE, PAGES, SOURCES);
  assert.deepEqual(data.screens, [
    {
      id: "items",
      route: "/",
      title: "itemsTitle",
      family: "list",
      status: "built",
      states: CORE,
    },
    // States built by a function cannot be read from the text: the screen gets none.
    {
      id: "archive",
      route: "/archive",
      title: "archiveTitle",
      family: "list",
      status: "built",
      states: [],
    },
  ]);
  const text = renderScreenLedger(data);
  assert.deepEqual(shapeProblems("screens", text), []);
  const back = readScreenLedger(text);
  assert.equal(back.version, 1);
  assert.deepEqual(
    back.screens.map(({ id, route, title, family, status }) => ({
      id,
      route,
      title,
      family,
      status,
    })),
    data.screens.map(({ id, route, title, family, status }) => ({
      id,
      route,
      title,
      family,
      status,
    })),
  );
  assert.deepEqual(back.screens[0].states, CORE);
  // A title the code does not name from the words is null, and null reads back as null.
  const bare = renderScreenLedger({
    screens: [{ id: "x", route: "/x", title: null, family: null, status: "built" }],
  });
  assert.deepEqual(builtScreens(readScreenLedger(bare)), [
    { id: "x", path: "/x", title: null, family: null, states: [] },
  ]);
});

test("with a ledger, the screen checks read states from it: a function no longer reads as none", () => {
  // Read from the code, the screen whose states a function builds declares none.
  assert.match(
    statesProblem(REQUIRED, CODE),
    /\/archive declares no state named loading, empty, error, no-results/,
  );
  // The ledger names them, as the code has them when it runs.
  const data = ledgerFromCode(CODE, PAGES, SOURCES);
  data.screens[1].states = CORE;
  const ledger = renderScreenLedger(data);
  assert.equal(statesProblem(REQUIRED, CODE, "design/states.json", ledger), null);
  assert.equal(kindsProblem(PAGES, CODE, SOURCES, "design/patterns", ledger), null);
  // And a screen the ledger lists without a required state is still named.
  data.screens[0].states = ["loading", "error", "no-results"];
  assert.match(
    statesProblem(REQUIRED, CODE, "design/states.json", renderScreenLedger(data)),
    /^\/ declares no state named empty$/,
  );
});

test("the gate holds the ledger to the code: the same screens, each of a described kind", () => {
  const data = ledgerFromCode(CODE, PAGES, SOURCES);
  assert.equal(screenLedgerProblem(renderScreenLedger(data), CODE, PAGES), null);
  // A screen the code has and the ledger does not, and the other way round.
  const fewer = renderScreenLedger({ screens: data.screens.slice(0, 1) });
  assert.match(
    screenLedgerProblem(fewer, CODE, PAGES),
    /\/archive is a screen of src\/screens\.ts and not a built screen of design\/screens\.yaml/,
  );
  const more = renderScreenLedger({
    screens: [...data.screens, { id: "gone", route: "/gone", title: null, family: null }],
  });
  assert.match(
    screenLedgerProblem(more, CODE, PAGES),
    /\/gone is a built screen of design\/screens\.yaml/,
  );
  // A planned screen is declared ahead: the code need not have it.
  const planned = renderScreenLedger({
    screens: [
      ...data.screens,
      { id: "soon", route: "/soon", title: null, family: null, status: "planned" },
    ],
  });
  assert.equal(screenLedgerProblem(planned, CODE, PAGES), null);
  // An id twice, and a family that is the kind of no page.
  const twice = renderScreenLedger({
    screens: [...data.screens, { ...data.screens[0], route: "/again" }],
  });
  assert.match(screenLedgerProblem(twice, CODE, PAGES), /lists the id items twice/);
  const stray = renderScreenLedger({
    screens: [{ ...data.screens[0], family: "grid" }, data.screens[1]],
  });
  assert.match(screenLedgerProblem(stray, CODE, PAGES), /the family grid is the kind of no page/);
  assert.match(screenLedgerProblem(null, CODE, PAGES), /design\/screens\.yaml is missing/);
});

test("this repository's ledger has its shape and agrees with its code", () => {
  // In whichever shape this repository keeps it: one file, or one file per screen.
  const text = ledgerText(ROOT, "design/screens.yaml");
  assert.deepEqual(shapeProblems("screens", text), []);
  const code = readFileSync(path.join(ROOT, "src/screens.ts"), "utf8");
  const pages = {
    "design/patterns/danh-sach.md": readFileSync(
      path.join(ROOT, "design/patterns/danh-sach.md"),
      "utf8",
    ),
  };
  assert.equal(screenLedgerProblem(text, code, pages), null);
  assert.ok(builtScreens(readScreenLedger(text)).length >= 2);
});

const REFERENCE = env.DESIGN_ASSEMBLY_REFERENCE_LEDGER
  ? path.resolve(ROOT, env.DESIGN_ASSEMBLY_REFERENCE_LEDGER)
  : null;
const noReference = !REFERENCE || !existsSync(path.join(REFERENCE, "design/screens.yaml"));

test(
  "the reference repository's ledger of screens reads, with its own keys and the one shape",
  {
    skip:
      noReference &&
      "set DESIGN_ASSEMBLY_REFERENCE_LEDGER to a repository with a ledger of screens",
  },
  () => {
    const text = readFileSync(path.join(REFERENCE, "design/screens.yaml"), "utf8");
    const ledger = readScreenLedger(text);
    assert.ok(builtScreens(ledger).length > 0);
    // Its own keys on a screen are its extension, and read without complaint; since it adopted
    // this plugin it carries the version the contract asks for.
    assert.deepEqual(shapeProblems("screens", text, "screens.yaml"), []);
  },
);
