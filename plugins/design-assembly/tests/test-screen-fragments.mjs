// The ledger of screens kept as one file per screen. It is the repository's choice: off until one
// command asks for it, taken back by another. The reader takes both shapes, the file's name is the
// screen's id, and splitting an existing ledger loses nothing.
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import {
  chmodSync,
  cpSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  renameSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { env, execPath } from "node:process";
import { after, test } from "node:test";
import { fileURLToPath } from "node:url";

import {
  LEDGERS,
  presentLedgers,
  shapeProblems,
} from "../templates/tools/design-assembly/contract.mjs";
import { fragmentsProblem } from "../templates/tools/design-assembly/check.mjs";
import { parseLedger } from "../templates/tools/design-assembly/ledger.mjs";
import { CORE_STATES } from "../templates/tools/design-assembly/patterns.mjs";
import { ledgerText, readFragments } from "../templates/tools/design-assembly/screen-fragments.mjs";
import {
  FRAGMENTS_MARKER,
  joinLedger,
  ledgerOfFiles,
  lostEntries,
  readScreenLedger,
  splitLedger,
} from "../templates/tools/design-assembly/screen-ledger.mjs";
import { withoutBlock } from "../templates/tools/design-assembly/theme.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const PLUGIN = path.resolve(HERE, "..");
const ROOT = path.resolve(PLUGIN, "../..");
const APPLY = path.join(PLUGIN, "scripts/apply.mjs");
const ADOPT = path.join(PLUGIN, "scripts/adopt.mjs");
const AUDIT = path.join(PLUGIN, "scripts/inventory.mjs");
const TOOL_SOURCE = path.join(PLUGIN, "templates/tools/design-assembly");
const LAYERS = JSON.parse(readFileSync(path.join(PLUGIN, "references/layers.json"), "utf8")).layers;
const LEDGER = "design/screens.yaml";
const FOLDER = "design/screens";
const SHARED = `${FOLDER}/_shared.yaml`;

const made = [];
after(() => made.forEach((dir) => rmSync(dir, { recursive: true, force: true })));

function folder(files) {
  const dir = mkdtempSync(path.join(tmpdir(), "design-assembly-fragments-"));
  made.push(dir);
  for (const [file, content] of Object.entries(files)) {
    mkdirSync(path.dirname(path.join(dir, file)), { recursive: true });
    writeFileSync(path.join(dir, file), content);
  }
  return dir;
}

const run = (script, ...args) => spawnSync(execPath, [script, ...args], { encoding: "utf8" });
const check = (dir) => run(path.join(dir, "tools/design-assembly/check.mjs"), "--target", dir);
// The command of the installed tool where the repository has a copy, else the plugin's own.
const fragments = (dir, ...args) => {
  const copy = path.join(dir, "tools/design-assembly/screen-fragments.mjs");
  const script = existsSync(copy) ? copy : path.join(TOOL_SOURCE, "screen-fragments.mjs");
  return run(script, "--target", dir, ...args);
};
const text = (dir, file) => readFileSync(path.join(dir, file), "utf8");
const has = (dir, file) => existsSync(path.join(dir, file));
const edit = (dir, file, change) => {
  const before = text(dir, file);
  const next = change(before);
  assert.notEqual(next, before, `the edit of ${file} changed nothing`);
  writeFileSync(path.join(dir, file), next);
};
const git = (dir, ...args) =>
  spawnSync(
    "git",
    ["-C", dir, "-c", "user.name=test", "-c", "user.email=test@example.com", ...args],
    { encoding: "utf8" },
  );
// The choice is written beside the check of the ledgers' shapes, a decision a repository holds
// whether the guide built it or it adopted.
const kindsOf = (dir) =>
  (JSON.parse(text(dir, "design/theme.json")).checks["ledger-shapes"] ?? []).map(
    (item) => item.kind,
  );
// The data of a ledger with its screens by id, so two ledgers compare whatever their order.
const dataOf = (ledgerAsText) => {
  const { screens, ...rest } = readScreenLedger(ledgerAsText);
  return { ...rest, screens: Object.fromEntries(screens.map((screen) => [screen.id, screen])) };
};

// ---- the text of a ledger, split and joined ------------------------------------------------------

// The layout the guide writes.
const WRITTEN = [
  "# The ledger of screens: every screen of the application.",
  "# Keep this file in block style.",
  "version: 1",
  "statuses:",
  "  - built",
  "  - planned",
  "screens:",
  "  - id: archive",
  "    route: /archive",
  "    title: archiveTitle",
  "    family: list",
  "    status: built",
  "    states:",
  "      - ready",
  "      - loading",
  "  - id: items",
  "    route: /",
  "    title: itemsTitle",
  "    family: list",
  "    status: built",
  "    actions: []",
  "    states:",
  "      - ready",
  "",
].join("\n");

// A ledger a repository wrote by hand: its own keys, lists on one line, a frame and a comment
// between screens, entries not in the order of their ids, and a key after the list.
const BY_HAND = [
  "# Our register of screens.",
  "#   vao  the action a role must hold",
  "version: 1",
  "families:",
  "  grid: Grid",
  "audiences: [staff, public]",
  "statuses: [built, planned]",
  "khung:",
  "  nut: [editView]",
  "  hien: [SavedView]",
  "screens:",
  "  - id: today",
  "    route: /",
  "    title: Today",
  "    family: null",
  "    audience: staff",
  "    status: built",
  "    vao: null",
  "    nut: []",
  "  # The grid, the screen most people work in.",
  "  - id: inventory",
  "    route: /inventory",
  "    title: Inventory",
  "    family: grid",
  "    audience: staff",
  "    status: built",
  "    vao: listItems",
  "    nut:",
  "      - saveView",
  "      # planned for the next round",
  "      - editView",
  "    hien: [Item, SavedView]",
  "# Actions that have no screen.",
  "no_screen:",
  "  exportAll:",
  "    later: the reports round",
  "",
].join("\n");

test("a ledger split and joined is the same text in the layout the guide writes", () => {
  const { shared, fragments: parts, problems } = splitLedger(WRITTEN);
  assert.deepEqual(problems, []);
  assert.deepEqual(
    parts.map((part) => part.name),
    ["archive.yaml", "items.yaml"],
  );
  assert.equal(joinLedger(shared, parts), WRITTEN);
  // The shared part keeps everything that is not a screen, and says where the screens are.
  assert.match(shared, /^# Keep this file in block style\.$/m);
  assert.match(shared, /^version: 1$/m);
  assert.ok(shared.includes(FRAGMENTS_MARKER));
  assert.doesNotMatch(shared, /archive/);
  // A fragment is the entry itself, at the left margin.
  assert.equal(
    parts[1].text,
    [
      "id: items",
      "route: /",
      "title: itemsTitle",
      "family: list",
      "status: built",
      "actions: []",
      "states:",
      "  - ready",
      "",
    ].join("\n"),
  );
});

test("a ledger written by hand splits and joins to the same data, comments and own keys kept", () => {
  const { shared, fragments: parts, problems } = splitLedger(BY_HAND);
  assert.deepEqual(problems, []);
  // One file per screen, in the order of the ids.
  assert.deepEqual(
    parts.map((part) => part.name),
    ["inventory.yaml", "today.yaml"],
  );
  const joined = joinLedger(shared, parts);
  assert.deepEqual(dataOf(joined), dataOf(BY_HAND));
  assert.deepEqual(lostEntries(BY_HAND, joined), []);
  // Each fragment read alone is that screen's entry, its own keys included.
  const before = dataOf(BY_HAND).screens;
  for (const part of parts) {
    const alone = readScreenLedger(joinLedger("version: 1\n", [part])).screens[0];
    assert.deepEqual(alone, before[alone.id]);
  }
  assert.match(parts[0].text, /^# The grid, the screen most people work in\.$/m);
  assert.match(parts[0].text, /# planned for the next round/);
  // What is not a screen stays in the shared part: the frame, the families, what has no screen.
  for (const kept of ["khung:", "families:", "no_screen:", "# Actions that have no screen."]) {
    assert.ok(shared.includes(kept), kept);
  }
  // The joined ledger keeps the one shape of the contract.
  assert.deepEqual(shapeProblems("screens", joined), []);
});

test("a list of screens at the margin of its key, and an empty one, split and join to the same data", () => {
  const margin = [
    "version: 1",
    "screens:",
    "- id: b",
    "  route: /b",
    "  states:",
    "  - ready",
    "- id: a",
    "  route: /a",
    "",
  ].join("\n");
  const split = splitLedger(margin);
  assert.deepEqual(split.problems, []);
  assert.deepEqual(dataOf(joinLedger(split.shared, split.fragments)), dataOf(margin));
  const none = splitLedger("version: 1\nscreens: []\n");
  assert.deepEqual(none.problems, []);
  assert.deepEqual(none.fragments, []);
  assert.deepEqual(readScreenLedger(joinLedger(none.shared, [])).screens, []);
});

test("splitting stops where an entry could not stand as a file of its own", () => {
  const ledger = (...entries) =>
    `version: 1\nscreens:\n${entries.map((entry) => `  - ${entry}\n    route: /x\n`).join("")}`;
  assert.match(
    splitLedger(ledger("id: a", "id: a")).problems.join("; "),
    /2 entries share the id a/,
  );
  assert.match(
    splitLedger(ledger("id: Orders", "id: orders")).problems.join("; "),
    /Orders and orders would be one file/,
  );
  assert.match(
    splitLedger(ledger("id: admin/users")).problems.join("; "),
    /the id admin\/users cannot be the name of a file/,
  );
  assert.match(
    splitLedger(ledger("id: _shared")).problems.join("; "),
    /the id _shared cannot be the name of a file/,
  );
  assert.match(splitLedger(ledger("title: None")).problems.join("; "), /an entry has no id/);
  // A name one widely used system keeps for itself, or one that ends in a dot.
  for (const id of ["con", "nul.v2", "list."]) {
    assert.match(
      splitLedger(ledger(`id: ${id}`)).problems.join("; "),
      /cannot be the name of a file/,
      id,
    );
  }
  // A note on the line of the key: the reader takes it for the value, so the cause is named.
  assert.match(
    splitLedger("version: 1\nscreens: # every screen\n  - id: a\n    route: /a\n").problems.join(
      "; ",
    ),
    /carries a note.*a line of its own/,
  );
  // A list written on one line is not cut by this tool.
  assert.match(
    splitLedger("version: 1\nscreens: [{id: a, route: /a}]\n").problems.join("; "),
    /block style/,
  );
  assert.match(splitLedger("version: 1\n").problems.join("; "), /no list of screens/);
});

test("an entry dropped from a fragment, or a whole fragment, is named as lost", () => {
  const { shared, fragments: parts } = splitLedger(BY_HAND);
  const fewer = joinLedger(
    shared,
    parts.filter((part) => part.name !== "today.yaml"),
  );
  assert.ok(lostEntries(BY_HAND, fewer).some((entry) => entry.startsWith("screens[today]")));
  const cut = parts.map((part) =>
    part.name === "inventory.yaml"
      ? { ...part, text: part.text.replace("  - editView\n", "") }
      : part,
  );
  assert.deepEqual(lostEntries(BY_HAND, joinLedger(shared, cut)), [
    "screens[inventory].nut[editView]",
  ]);
  // The shared part loses a key.
  assert.deepEqual(
    lostEntries(BY_HAND, joinLedger(shared.replace("  hien: [SavedView]\n", ""), parts)),
    ["khung.hien[SavedView]"],
  );
});

test("one reader for both shapes: the folder when it holds the shared part, else the one file", () => {
  const { shared, fragments: parts } = splitLedger(WRITTEN);
  const asFiles = Object.fromEntries([
    ["../design/screens/_shared.yaml", shared],
    ...parts.map((part) => [`../design/screens/${part.name}`, part.text]),
  ]);
  assert.equal(ledgerOfFiles(asFiles), WRITTEN);
  assert.equal(ledgerOfFiles({ "../design/screens.yaml": WRITTEN }), WRITTEN);
  assert.equal(ledgerOfFiles({}), null);
  // Fragments are read in the order of their names, whatever order they are given in.
  const reversed = Object.fromEntries(Object.entries(asFiles).reverse());
  assert.equal(ledgerOfFiles(reversed), WRITTEN);
  // A folder without the shared part is some other folder of that name: the file is the ledger.
  assert.equal(
    ledgerOfFiles({
      "design/screens.yaml": WRITTEN,
      "design/screens/notes.yaml": "id: stray\n",
    }),
    WRITTEN,
  );
});

// ---- on a repository -----------------------------------------------------------------------------

function blueprint() {
  const choices = {
    context: { product_type: "application", conformance_level: "AA" },
    patterns: { record_panel: "beside" },
    foundations: { source_color: "#0246ff" },
  };
  const layers = {};
  for (const layer of LAYERS) {
    layers[layer.id] = layer.built
      ? { status: "decided", source: "proposed", choice: choices[layer.id], why: "For the test." }
      : { status: "planned" };
  }
  return JSON.stringify({ version: 1, status: "approved", layers });
}

const ALL = ["ready", ...CORE_STATES];
const screen = (route, source) =>
  `  { path: "${route}", load: () => import("${source}").then((m) => m.Page), states: [${ALL.map(
    (name) => `{ name: "${name}", shows: LABELS.title }`,
  ).join(", ")}] },`;
const REGISTRY = `export const SCREENS = [\n${screen("/", "@/pages/List")}\n${screen("/archive", "@/pages/Archive")}\n];\n`;
const SOURCE = [
  'import { LABELS } from "@/lib/labels";',
  "",
  "export function Page() {",
  "  return (",
  "    <main>",
  "      <h1>{LABELS.title}</h1>",
  "    </main>",
  "  );",
  "}",
  "",
].join("\n");
const PAGE = [
  "---",
  "nhom: list",
  "doi_tuong: A screen that shows many items of one type.",
  "khuon:",
  "  ten: Table",
  '  nhap: "@/components/ui/table"',
  "nhan_dien:",
  '  - "src/pages/**/*.tsx"',
  "mau_dang_chay:",
  "  tep: src/pages/List.tsx",
  "khe_bat_buoc: []",
  "cam_ngoai_khuon: []",
  "ngoai_le: []",
  "nhan_viec: Find one item, then work with it",
  "---",
  "",
  "## When to use",
  "",
  "A list of items.",
  "",
].join("\n");
const own = (file) => readFileSync(path.join(ROOT, file), "utf8");
const floorFiles = (extra = {}) => ({
  "src/index.css": withoutBlock(own("src/index.css")),
  Makefile: own("Makefile"),
  "src/screens.ts": REGISTRY,
  "src/pages/List.tsx": SOURCE,
  "src/pages/Archive.tsx": SOURCE,
  "design/blueprint.json": blueprint(),
  "design/patterns/list.md": PAGE,
  ...extra,
});
// A repository the guide built: two screens, a ledger of them, the gate green.
const built = (extra = {}) => {
  const dir = folder(floorFiles(extra));
  const said = run(APPLY, "--target", dir);
  assert.equal(said.status, 0, said.stderr);
  assert.ok(has(dir, LEDGER), "the guide wrote no ledger of screens");
  assert.equal(check(dir).status, 0, check(dir).stderr);
  return dir;
};
const fragmentNames = (dir) => readdirSync(path.join(dir, FOLDER)).sort();

test("splitting a repository's ledger says first what it will write, then writes it, and the gate stays green", () => {
  const dir = built();
  const before = text(dir, LEDGER);
  const ids = readScreenLedger(before).screens.map((item) => item.id);
  assert.equal(ids.length, 2);
  // Shown first: nothing is written.
  const shown = fragments(dir, "--split", "--dry-run");
  assert.equal(shown.status, 0, shown.stderr);
  for (const id of ids) assert.match(shown.stdout, new RegExp(`create ${FOLDER}/${id}\\.yaml`));
  assert.match(shown.stdout, new RegExp(`create ${SHARED}`));
  assert.match(shown.stdout, new RegExp(`remove ${LEDGER}`));
  assert.match(shown.stdout, /2 screens.*no entry is lost/);
  assert.ok(has(dir, LEDGER) && !has(dir, FOLDER), "a dry run wrote something");
  assert.deepEqual(kindsOf(dir), ["shapes"]);
  // Then for real.
  const done = fragments(dir, "--split");
  assert.equal(done.status, 0, done.stderr);
  assert.deepEqual(fragmentNames(dir), ["_shared.yaml", ...ids.map((id) => `${id}.yaml`)].sort());
  assert.ok(!has(dir, LEDGER), "the one file is still there beside its fragments");
  assert.deepEqual(kindsOf(dir), ["shapes", "screen-fragments"]);
  // The reader gives the same data from the folder as the file gave.
  assert.deepEqual(dataOf(ledgerText(dir, LEDGER)), dataOf(before));
  const held = check(dir);
  assert.equal(held.status, 0, held.stderr);
  assert.match(held.stdout, /each seen failing on a changed copy/);
  // Asked again, it has nothing left to split and changes nothing.
  const theme = text(dir, "design/theme.json");
  const again = fragments(dir, "--split");
  assert.equal(again.status, 0, again.stderr);
  assert.match(again.stdout, /already one file per screen/);
  assert.equal(text(dir, "design/theme.json"), theme);
});

test("the gate is red when a fragment's name is not its id, when a field is missing, and when two shapes sit side by side", () => {
  const breaks = {
    "its name is not its id": [
      (dir) => renameSync(path.join(dir, FOLDER, "list.yaml"), path.join(dir, FOLDER, "main.yaml")),
      /design\/screens\/main\.yaml holds the screen list: the file's name is the screen's id/,
    ],
    "a required field is missing": [
      (dir) => edit(dir, `${FOLDER}/list.yaml`, (s) => s.replace(/^status: .*\n/m, "")),
      /design\/screens\/list\.yaml: status is missing/,
    ],
    "it has no id": [
      (dir) => edit(dir, `${FOLDER}/list.yaml`, (s) => s.replace(/^id: .*\n/m, "")),
      /design\/screens\/list\.yaml names no id/,
    ],
    "the one file is back beside the folder": [
      (dir) => writeFileSync(path.join(dir, LEDGER), "version: 1\nscreens: []\n"),
      /design\/screens\.yaml is there beside design\/screens/,
    ],
    "the folder is gone": [
      (dir) => rmSync(path.join(dir, FOLDER), { recursive: true }),
      /design\/screens\/_shared\.yaml is not there/,
    ],
  };
  for (const [name, [change, said]] of Object.entries(breaks)) {
    const dir = built();
    assert.equal(fragments(dir, "--split").status, 0, name);
    assert.equal(check(dir).status, 0, check(dir).stderr);
    change(dir);
    const broken = check(dir);
    assert.equal(broken.status, 1, name);
    assert.match(broken.stderr, said, name);
  }
});

test("two branches that each add a screen merge without meeting in the design folder", () => {
  const dir = built();
  assert.equal(fragments(dir, "--split").status, 0);
  git(dir, "init", "-q", "-b", "main");
  git(dir, "add", "-A");
  assert.equal(git(dir, "commit", "-q", "-m", "start").status, 0);
  const planned = (id) => `id: ${id}\nroute: /${id}\ntitle: null\nfamily: list\nstatus: planned\n`;
  for (const id of ["reports", "settings"]) {
    git(dir, "checkout", "-q", "-b", id, "main");
    writeFileSync(path.join(dir, FOLDER, `${id}.yaml`), planned(id));
    git(dir, "add", "-A");
    assert.equal(git(dir, "commit", "-q", "-m", `add ${id}`).status, 0);
  }
  git(dir, "checkout", "-q", "main");
  for (const id of ["reports", "settings"]) {
    const merged = git(dir, "merge", "-q", "--no-edit", id);
    assert.equal(merged.status, 0, merged.stdout + merged.stderr);
  }
  assert.deepEqual(
    readScreenLedger(ledgerText(dir, LEDGER)).screens.map((item) => item.id),
    ["archive", "list", "reports", "settings"],
  );
  assert.equal(check(dir).status, 0, check(dir).stderr);
});

test("the same two branches meet in the one file when the repository never asked", () => {
  const dir = built();
  git(dir, "init", "-q", "-b", "main");
  git(dir, "add", "-A");
  git(dir, "commit", "-q", "-m", "start");
  const planned = (id) =>
    `  - id: ${id}\n    route: /${id}\n    title: null\n    family: list\n    status: planned\n`;
  for (const id of ["reports", "settings"]) {
    git(dir, "checkout", "-q", "-b", id, "main");
    writeFileSync(path.join(dir, LEDGER), `${text(dir, LEDGER)}${planned(id)}`);
    git(dir, "add", "-A");
    git(dir, "commit", "-q", "-m", `add ${id}`);
  }
  git(dir, "checkout", "-q", "main");
  assert.equal(git(dir, "merge", "-q", "--no-edit", "reports").status, 0);
  const second = git(dir, "merge", "-q", "--no-edit", "settings");
  assert.notEqual(
    second.status,
    0,
    "the control did not conflict, so the test above proves little",
  );
  assert.match(second.stdout, /CONFLICT.*design\/screens\.yaml/);
});

test("a ledger whose last screen is only planned is held all the same, as one file and as fragments", () => {
  // The gate shows each check failing on a changed copy. Its copy used to drop the last entry of
  // the ledger; a planned screen is not in the code, so dropping it changed nothing.
  const dir = built();
  edit(
    dir,
    LEDGER,
    (s) =>
      `${s}  - id: zebra\n    route: /zebra\n    title: null\n    family: list\n    status: planned\n`,
  );
  const one = check(dir);
  assert.equal(one.status, 0, one.stderr);
  assert.equal(fragments(dir, "--split").status, 0);
  const parts = check(dir);
  assert.equal(parts.status, 0, parts.stderr);
});

test("the choice outlives the next run of the guide, which writes no second ledger", () => {
  const dir = built();
  assert.equal(fragments(dir, "--split").status, 0);
  const again = run(APPLY, "--target", dir);
  assert.equal(again.status, 0, again.stderr);
  assert.ok(!has(dir, LEDGER), "the guide wrote the one file again beside the fragments");
  assert.deepEqual(kindsOf(dir), ["shapes", "screen-fragments"]);
  assert.equal(check(dir).status, 0, check(dir).stderr);
  // The page of rules the guide writes for an agent names the folder.
  assert.match(text(dir, ".claude/rules/design-assembly.md"), /design\/screens\/<id>\.yaml/);
  // And a run after that changes nothing.
  const third = run(APPLY, "--target", dir);
  assert.equal(third.status, 0, third.stderr);
  assert.doesNotMatch(third.stdout, /^(create|update)/m);
});

test("one command takes it back: the one file returns with the same data and the folder's fragments go", () => {
  const dir = built();
  const before = text(dir, LEDGER);
  assert.equal(fragments(dir, "--split").status, 0);
  // A file of the repository's own in the folder is not a fragment, and is left where it is.
  writeFileSync(path.join(dir, FOLDER, "README.md"), "Notes.\n");
  const shown = fragments(dir, "--join", "--dry-run");
  assert.equal(shown.status, 0, shown.stderr);
  assert.match(shown.stdout, new RegExp(`create ${LEDGER}`));
  assert.match(shown.stdout, new RegExp(`remove ${SHARED}`));
  assert.ok(!has(dir, LEDGER));
  const back = fragments(dir, "--join");
  assert.equal(back.status, 0, back.stderr);
  // The same data comes back; the screens stand in the order of their ids.
  assert.deepEqual(dataOf(text(dir, LEDGER)), dataOf(before));
  assert.deepEqual(fragmentNames(dir), ["README.md"]);
  assert.deepEqual(kindsOf(dir), ["shapes"]);
  assert.equal(check(dir).status, 0, check(dir).stderr);
  const again = fragments(dir, "--join");
  assert.equal(again.status, 0, again.stderr);
  assert.match(again.stdout, /already one file/);
  // Both at once is a wrong call.
  const both = fragments(dir, "--split", "--join");
  assert.equal(both.status, 1);
  assert.match(both.stderr, /one of --split, --join and --print/);
});

test("a repository that never asked sees no change, even with a folder of that name", () => {
  // The folder holds pictures of screens and a stray file: not a ledger kept as fragments.
  const dir = built({
    "design/screens/list.png": "not a picture",
    "design/screens/notes.yaml": "id: stray\nroute: /stray\n",
  });
  assert.deepEqual(kindsOf(dir), ["shapes"]);
  assert.equal(readFragments(dir, LEDGER), null);
  assert.equal(ledgerText(dir, LEDGER), text(dir, LEDGER));
  const said = fragments(dir);
  assert.equal(said.status, 0, said.stderr);
  assert.match(said.stdout, /one file, design\/screens\.yaml/);
  // The gate holds the one file as before: a screen cut from it is still a failure.
  edit(dir, LEDGER, (s) => s.slice(0, s.lastIndexOf("\n  - id:") + 1));
  const broken = check(dir);
  assert.equal(broken.status, 1);
  assert.match(broken.stderr, /screen-ledger: .*not a built screen of design\/screens\.yaml/);
});

test("splitting stops and writes nothing when two entries would be one file", () => {
  const dir = built();
  // Two entries with one id: the second would take the first one's file.
  edit(dir, LEDGER, (s) => s.replace(/^ {2}- id: archive$/m, "  - id: list"));
  const before = text(dir, LEDGER);
  const said = fragments(dir, "--split");
  assert.equal(said.status, 1, said.stdout);
  assert.match(said.stderr, /2 entries share the id list/);
  assert.match(said.stderr, /nothing was written/i);
  assert.equal(text(dir, LEDGER), before);
  assert.ok(!has(dir, FOLDER));
  assert.deepEqual(kindsOf(dir), ["shapes"]);
});

test("a call that is not understood is refused, and changes nothing", () => {
  const dir = built();
  const before = text(dir, LEDGER);
  const wrong = [
    [["--spilt"], /--spilt is not understood/],
    [["--dry-run"], /--dry-run goes with --split or --join/],
    [["--print", "--dry-run"], /--dry-run goes with --split or --join/],
  ];
  for (const [args, said] of wrong) {
    const refused = fragments(dir, ...args);
    assert.equal(refused.status, 1, args.join(" "));
    assert.match(refused.stderr, said);
  }
  // --target with no folder after it, or with a flag where the folder goes.
  const script = path.join(dir, "tools/design-assembly/screen-fragments.mjs");
  for (const args of [
    ["--split", "--target"],
    ["--target", "--split"],
  ]) {
    const refused = spawnSync(execPath, [script, ...args], { encoding: "utf8", cwd: dir });
    assert.equal(refused.status, 1, args.join(" "));
    assert.match(refused.stderr, /--target takes a folder/);
  }
  assert.equal(text(dir, LEDGER), before);
  assert.ok(!has(dir, FOLDER));
});

test("when the fragments cannot be written, what was written is taken away and the one file stays", () => {
  const dir = built();
  const before = text(dir, LEDGER);
  // The folder is there and cannot be written to.
  mkdirSync(path.join(dir, FOLDER));
  chmodSync(path.join(dir, FOLDER), 0o555);
  try {
    const failed = fragments(dir, "--split");
    assert.equal(failed.status, 1, failed.stdout);
    assert.match(failed.stderr, /could not be written.*design\/screens\.yaml is as it was/);
  } finally {
    chmodSync(path.join(dir, FOLDER), 0o755);
  }
  assert.equal(text(dir, LEDGER), before);
  assert.deepEqual(fragmentNames(dir), []);
  assert.deepEqual(kindsOf(dir), ["shapes"]);
  assert.equal(check(dir).status, 0, check(dir).stderr);
});

test("with both shapes side by side neither command guesses: each refuses and changes nothing", () => {
  const dir = built();
  const one = text(dir, LEDGER);
  assert.equal(fragments(dir, "--split").status, 0);
  writeFileSync(path.join(dir, LEDGER), one);
  const names = fragmentNames(dir);
  for (const flag of ["--split", "--join"]) {
    const refused = fragments(dir, flag);
    assert.equal(refused.status, 1, flag);
    assert.match(refused.stderr, /design\/screens\.yaml is there beside design\/screens/, flag);
    assert.match(refused.stderr, /Nothing was written/, flag);
  }
  assert.equal(text(dir, LEDGER), one);
  assert.deepEqual(fragmentNames(dir), names);
});

test("two fragments whose names differ only by capitals are named by the gate", () => {
  const found = {
    folder: FOLDER,
    shared: "version: 1\n",
    beside: false,
    fragments: ["Orders", "orders"].map((id) => ({
      name: `${id}.yaml`,
      file: `${FOLDER}/${id}.yaml`,
      text: `id: ${id}\nroute: /${id}\ntitle: null\nfamily: null\nstatus: built\n`,
    })),
  };
  const check = { kind: "screen-fragments", file: LEDGER, fragments: FOLDER };
  assert.match(
    fragmentsProblem(found, check),
    /Orders\.yaml and .*orders\.yaml differ only by capitals/,
  );
  assert.equal(fragmentsProblem({ ...found, fragments: found.fragments.slice(1) }, check), null);
});

test("a repository that adopted splits the same way, and adopting again leaves the choice alone", () => {
  const dir = folder(floorFiles({ [LEDGER]: WRITTEN.replaceAll("itemsTitle", "null") }));
  // Adopting leaves work for a person, so it ends with 1.
  assert.equal(run(ADOPT, "--target", dir).status, 1);
  assert.ok(has(dir, "tools/design-assembly/screen-fragments.mjs"));
  const done = fragments(dir, "--split");
  assert.equal(done.status, 0, done.stderr);
  assert.deepEqual(fragmentNames(dir), ["_shared.yaml", "archive.yaml", "items.yaml"]);
  assert.equal(check(dir).status, 0, check(dir).stderr);
  assert.deepEqual(kindsOf(dir), ["shapes", "screen-fragments"]);
  const theme = text(dir, "design/theme.json");
  assert.equal(run(ADOPT, "--target", dir).status, 1);
  assert.equal(text(dir, "design/theme.json"), theme);
  assert.ok(!has(dir, LEDGER));
  assert.equal(check(dir).status, 0, check(dir).stderr);
  // The gate of a repository that adopted holds a fragment to its name as well.
  renameSync(path.join(dir, FOLDER, "items.yaml"), path.join(dir, FOLDER, "main.yaml"));
  const broken = check(dir);
  assert.equal(broken.status, 1, broken.stdout);
  assert.match(broken.stderr, /ledger-shapes: design\/screens\/main\.yaml holds the screen items/);
  renameSync(path.join(dir, FOLDER, "main.yaml"), path.join(dir, FOLDER, "items.yaml"));
  // The audit still counts the ledger of screens among the ledgers that have their shape.
  const listed = presentLedgers(dir).find((ledger) => ledger.kind === "screens");
  assert.deepEqual(listed, { kind: "screens", file: FOLDER, problems: [] });
  const audit = JSON.parse(run(AUDIT, "--target", dir, "--json").stdout);
  assert.ok(audit.contract.some((ledger) => ledger.file === FOLDER && ledger.has_shape !== false));
});

test("a repository that adopts with its ledger already in fragments is held as such from the start", () => {
  const { shared, fragments: parts } = splitLedger(WRITTEN.replaceAll("itemsTitle", "null"));
  const dir = folder(
    floorFiles({
      [SHARED]: shared,
      ...Object.fromEntries(parts.map((part) => [`${FOLDER}/${part.name}`, part.text])),
    }),
  );
  assert.equal(run(ADOPT, "--target", dir).status, 1);
  assert.deepEqual(kindsOf(dir), ["shapes", "screen-fragments"]);
  assert.ok(!has(dir, LEDGER), "adopting wrote the one file");
  assert.equal(check(dir).status, 0, check(dir).stderr);
});

test("a repository with nothing yet is told there is nothing to split, and nothing is written", () => {
  const dir = folder({ "README.md": "An empty repository.\n" });
  for (const flag of ["--split", "--join", "--print"]) {
    const said = fragments(dir, flag);
    assert.equal(said.status, 0, `${flag}: ${said.stderr}`);
    assert.match(said.stdout + said.stderr, /no ledger of screens/, flag);
  }
  assert.deepEqual(readdirSync(dir), ["README.md"]);
  // The reader has nothing to give either, and says so with null.
  assert.equal(ledgerText(dir, LEDGER), null);
  assert.deepEqual(
    presentLedgers(dir).filter((ledger) => ledger.kind === "screens"),
    [],
  );
});

test("a ledger no gate holds is split all the same, and the command says nothing checks it there", () => {
  // No tool data, no copy of the tool, not a git repository: only the ledger.
  const dir = folder({ [LEDGER]: BY_HAND });
  const done = fragments(dir, "--split");
  assert.equal(done.status, 0, done.stderr);
  assert.match(done.stdout, /no gate here holds the ledger of screens/);
  assert.deepEqual(fragmentNames(dir), ["_shared.yaml", "inventory.yaml", "today.yaml"]);
  assert.ok(!has(dir, "design/theme.json"));
  assert.deepEqual(dataOf(ledgerText(dir, LEDGER)), dataOf(BY_HAND));
  // What still reads one file is given the text on demand.
  const printed = fragments(dir, "--print");
  assert.equal(printed.status, 0, printed.stderr);
  assert.deepEqual(dataOf(printed.stdout), dataOf(BY_HAND));
  assert.ok(!has(dir, LEDGER), "--print wrote the file");
});

// ---- the screens joined with the domain model, in either shape ----------------------------------

const MODEL = {
  "ontology/actions.yaml": [
    "actions:",
    "  - name: listItems",
    "    entity: Item",
    "    kind: query",
    "    roles: [staff]",
    "  - name: saveView",
    "    entity: SavedView",
    "    kind: command",
    "    roles: [staff]",
    "  - name: editView",
    "    entity: SavedView",
    "    kind: command",
    "    roles: [staff]",
    "  - name: exportAll",
    "    entity: Item",
    "    kind: command",
    "    roles: [staff]",
    "",
  ].join("\n"),
  "ontology/roles.yaml": "roles:\n  - name: staff\n",
};
const ACTIONS = path.join(TOOL_SOURCE, "screen-actions.mjs");
const KEYS = "entry=vao,actions=nut,frame=khung,shows=hien";

test("the screens join the domain model the same from one file and from fragments, own keys mapped", () => {
  const dir = folder({ [LEDGER]: BY_HAND, ...MODEL });
  const asked = () => run(ACTIONS, "--target", dir, "--keys", KEYS, "--json");
  const one = asked();
  assert.notEqual(one.status, 2, one.stderr);
  const table = JSON.parse(one.stdout).table;
  assert.ok(
    table.some((row) => row.screen === "inventory" && row.buttons.includes("saveView")),
    "the mapped keys were not read from the one file",
  );
  assert.equal(fragments(dir, "--split").status, 0);
  assert.ok(!has(dir, LEDGER));
  const parts = asked();
  const sorted = (rows) =>
    [...rows].sort((a, b) => `${a.screen} ${a.role}`.localeCompare(`${b.screen} ${b.role}`));
  assert.deepEqual(sorted(JSON.parse(parts.stdout).table), sorted(table));
  assert.deepEqual(JSON.parse(parts.stdout).problems, JSON.parse(one.stdout).problems);
});

// ---- what the guide installs ---------------------------------------------------------------------

test("the test the guide installs reads either shape, and is the reference implementation's", () => {
  const template = text(PLUGIN, "templates/owned/screens-ledger.test.ts.template");
  assert.equal(template, own("tests/screens-ledger.test.ts"));
  // It no longer names the one file as the only place the ledger can be.
  assert.doesNotMatch(template, /import \w+ from "\.\.\/design\/screens\.yaml\?raw"/);
  assert.match(template, /ledgerOfFiles/);
  assert.match(template, /design\/screens\/\*\.yaml/);
});

test("the pages of the plugin say the second way to keep the ledger, and name its check", () => {
  const contract = text(PLUGIN, "references/contract.md");
  const { folder: named, shared } = LEDGERS.screens.fragments;
  assert.equal(named, FOLDER);
  assert.ok(contract.includes(`\`${named}/<id>.yaml\``));
  assert.ok(contract.includes(`\`${named}/${shared}\``));
  const checks = text(PLUGIN, "references/checks.md");
  assert.match(checks, /^\| `screen-fragments` /m);
  for (const flag of ["--split", "--join", "--print", "--dry-run"]) {
    assert.ok(checks.includes(`\`${flag}\``), flag);
  }
});

test("this repository keeps its ledger of screens as one file per screen", () => {
  assert.ok(!existsSync(path.join(ROOT, LEDGER)), `${LEDGER} is still in this repository`);
  const found = readFragments(ROOT, LEDGER);
  assert.ok(found && found.fragments.length >= 2);
  assert.deepEqual(shapeProblems("screens", ledgerText(ROOT, LEDGER)), []);
  const theme = JSON.parse(own("design/theme.json"));
  assert.ok(theme.checks["ledger-shapes"].some((item) => item.kind === "screen-fragments"));
  const rows = parseLedger(own("design/decisions.yaml"));
  assert.ok(rows.some((row) => row.id === "screen-ledger"));
});

// ---- the reference repository, on a copy --------------------------------------------------------

const REFERENCE = env.DESIGN_ASSEMBLY_REFERENCE_LEDGER
  ? path.resolve(ROOT, env.DESIGN_ASSEMBLY_REFERENCE_LEDGER)
  : null;
const noReference = !REFERENCE || !existsSync(path.join(REFERENCE, LEDGER));

test(
  "a copy of the reference repository's ledger splits with no entry lost, and joins its model the same",
  {
    skip:
      noReference &&
      "set DESIGN_ASSEMBLY_REFERENCE_LEDGER to a repository with a ledger of screens",
  },
  () => {
    // Only a copy is written to: the ledger and the model, in a folder of this test's own.
    const dir = folder({});
    mkdirSync(path.join(dir, "design"));
    cpSync(path.join(REFERENCE, LEDGER), path.join(dir, LEDGER));
    if (existsSync(path.join(REFERENCE, "ontology"))) {
      cpSync(path.join(REFERENCE, "ontology"), path.join(dir, "ontology"), { recursive: true });
    }
    const before = text(dir, LEDGER);
    const reference = readFileSync(path.join(REFERENCE, LEDGER), "utf8");
    const asked = () => run(ACTIONS, "--target", dir, "--keys", KEYS, "--json").stdout;
    const joinedBefore = JSON.parse(asked());
    const done = fragments(dir, "--split");
    assert.equal(done.status, 0, done.stderr);
    const count = readScreenLedger(before).screens.length;
    assert.equal(fragmentNames(dir).length, count + 1);
    const joined = ledgerText(dir, LEDGER);
    assert.deepEqual(lostEntries(before, joined), []);
    assert.deepEqual(dataOf(joined), dataOf(before));
    assert.deepEqual(shapeProblems("screens", joined, "screens.yaml"), []);
    const joinedAfter = JSON.parse(asked());
    assert.deepEqual(joinedAfter.problems, joinedBefore.problems);
    assert.equal(joinedAfter.table.length, joinedBefore.table.length);
    // And back to one file, with the same data again.
    assert.equal(fragments(dir, "--join").status, 0);
    assert.deepEqual(dataOf(text(dir, LEDGER)), dataOf(before));
    // The reference repository itself was only read.
    assert.equal(readFileSync(path.join(REFERENCE, LEDGER), "utf8"), reference);
  },
);
