// The templates layer, as far as a tool reads it from source: every screen is of one kind with a
// page of its own, each kind names a real screen as its reference, and pages are checked at the
// widths a person listed. Each rule is shown going red on a real change.
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { execPath } from "node:process";
import { after, test } from "node:test";
import { fileURLToPath } from "node:url";

import { parseLedger, TOOL } from "../templates/tools/design-assembly/ledger.mjs";
import { CORE_STATES } from "../templates/tools/design-assembly/patterns.mjs";
import {
  frontMatter,
  globPattern,
  kindsProblem,
  PAGES_TEST,
  readKinds,
  referenceProblem,
  screenFiles,
  SIZES_FILE,
  sizesProblem,
  STARTER_WIDTHS,
} from "../templates/tools/design-assembly/screens.mjs";
import { withoutBlock } from "../templates/tools/design-assembly/theme.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const PLUGIN = path.resolve(HERE, "..");
const ROOT = path.resolve(PLUGIN, "../..");
const APPLY = path.join(PLUGIN, "scripts/apply.mjs");
const AUDIT = path.join(PLUGIN, "scripts/inventory.mjs");
const ADOPT = path.join(PLUGIN, "scripts/adopt.mjs");
const LAYERS = JSON.parse(readFileSync(path.join(PLUGIN, "references/layers.json"), "utf8")).layers;

const made = [];
after(() => made.forEach((dir) => rmSync(dir, { recursive: true, force: true })));

function folder(files) {
  const dir = mkdtempSync(path.join(tmpdir(), "design-assembly-screens-"));
  made.push(dir);
  for (const [file, content] of Object.entries(files)) {
    mkdirSync(path.dirname(path.join(dir, file)), { recursive: true });
    writeFileSync(path.join(dir, file), content);
  }
  return dir;
}

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
const screen = (route, module, names = ALL) =>
  `  { path: "${route}", load: () => import("${module}").then((m) => m.Page), states: [${names
    .map((name) => `{ name: "${name}", shows: LABELS.title }`)
    .join(", ")}] },`;
const registry = (...screens) => `export const SCREENS = [\n${screens.join("\n")}\n];\n`;
const REGISTRY = registry(screen("/", "@/pages/List"));
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
const SOURCES = { "src/pages/List.tsx": SOURCE };

// A page in the format the acceptance kit reads.
const page = (change = {}) => {
  const fields = {
    nhom: "list",
    doi_tuong: "A screen that shows many items of one type.",
    khuon: '\n  ten: Table\n  nhap: "@/components/ui/table"',
    nhan_dien: '\n  - "src/pages/**/*.tsx"',
    mau_dang_chay: "\n  tep: src/pages/List.tsx",
    khe_bat_buoc: "[]",
    cam_ngoai_khuon: "[]",
    ngoai_le: "[]",
    nhan_viec: "Find one item, then work with it",
    ...change,
  };
  const lines = Object.entries(fields)
    .filter(([, value]) => value !== null)
    .map(([key, value]) => `${key}:${value.startsWith("\n") ? value : ` ${value}`}`);
  return `---\n${lines.join("\n")}\n---\n\n## When to use\n\nA list of items.\n`;
};
const PAGES = { "design/patterns/list.md": page() };
const STATES = JSON.stringify({ version: 1, required: CORE_STATES, exempt: {} });

const own = (file) => readFileSync(path.join(ROOT, file), "utf8");
const floor = (extra = {}) =>
  folder({
    "src/index.css": withoutBlock(own("src/index.css")),
    Makefile: own("Makefile"),
    "src/screens.ts": REGISTRY,
    "src/pages/List.tsx": SOURCE,
    "design/blueprint.json": blueprint(),
    "design/patterns/list.md": page(),
    // What the floor's browser checks leave in a repository.
    "tests/e2e/routes.ts": "export const ROUTES = [];\n",
    "package.json": JSON.stringify({
      devDependencies: { "@axe-core/playwright": "^4", "@playwright/test": "^1" },
    }),
    ...extra,
  });

const run = (script, ...args) => spawnSync(execPath, [script, ...args], { encoding: "utf8" });
const check = (dir) => run(path.join(dir, "tools/design-assembly/check.mjs"), "--target", dir);
const text = (dir, file) => readFileSync(path.join(dir, file), "utf8");
const edit = (dir, file, change) => {
  const before = text(dir, file);
  const next = change(before);
  assert.notEqual(next, before, `the edit of ${file} changed nothing`);
  writeFileSync(path.join(dir, file), next);
};
const rowsOf = (dir) =>
  Object.fromEntries(parseLedger(text(dir, "design/decisions.yaml")).map((r) => [r.id, r]));

test("a page's front matter is read in block style and in one-line style", () => {
  const read = frontMatter(
    [
      "---",
      "nhom: list",
      'doi_tuong: "Many items: one type"',
      "khuon: { ten: Table, nhap: '@/components/ui/table' }",
      "nhan_dien:",
      '- "src/pages/**/*.tsx"',
      "mau_dang_chay:",
      "  tep: src/pages/List.tsx # the first one",
      "khe_bat_buoc: [title, rows]",
      "ngoai_le:",
      "  - tep: src/pages/Old.tsx",
      "    khoi: [Table, Grid]",
      "    ly_do: waits for its move",
      "  - tep: src/pages/Settings.tsx",
      "    ly_do: has a kind of its own",
      "---",
      "",
      "Body.",
    ].join("\n"),
  );
  assert.equal(read.doi_tuong, "Many items: one type");
  assert.deepEqual(read.khuon, { ten: "Table", nhap: "@/components/ui/table" });
  assert.deepEqual(read.nhan_dien, ["src/pages/**/*.tsx"]);
  assert.equal(read.mau_dang_chay.tep, "src/pages/List.tsx");
  assert.deepEqual(read.khe_bat_buoc, ["title", "rows"]);
  assert.deepEqual(read.ngoai_le[0].khoi, ["Table", "Grid"]);
  assert.equal(read.ngoai_le[1].ly_do, "has a kind of its own");
  assert.equal(frontMatter("# No front matter\n"), null);
});

test("a kind is read from its page: name, main task, files, reference, and files that left it", () => {
  const [kind] = readKinds({
    "design/patterns/list.md": page({
      ngoai_le:
        "\n  - tep: src/pages/Old.tsx\n    khoi: Table\n    ly_do: waits\n  - tep: src/pages/Settings.tsx\n    ly_do: its own kind",
    }),
  });
  assert.equal(kind.name, "list");
  assert.equal(kind.kind, "list");
  assert.equal(kind.task, "Find one item, then work with it");
  assert.deepEqual(kind.globs, ["src/pages/**/*.tsx"]);
  assert.equal(kind.reference, "src/pages/List.tsx");
  // Only the exception without a named part takes the file out of the kind.
  assert.deepEqual(kind.left, ["src/pages/Settings.tsx"]);
  // The list of globs may also sit under a file key.
  const [keyed] = readKinds({
    "design/patterns/list.md": page({ nhan_dien: '\n  tep:\n    - "src/pages/*.tsx"' }),
  });
  assert.deepEqual(keyed.globs, ["src/pages/*.tsx"]);
});

test("a glob crosses folders only with two stars, and brackets in a path are plain text", () => {
  assert.ok(globPattern("src/pages/**/*.tsx").test("src/pages/List.tsx"));
  assert.ok(globPattern("src/pages/**/*.tsx").test("src/pages/a/b/List.tsx"));
  assert.ok(!globPattern("src/pages/*.tsx").test("src/pages/a/List.tsx"));
  assert.ok(globPattern("src/app/(app)/[slug]/*.tsx").test("src/app/(app)/[slug]/page.tsx"));
  assert.ok(!globPattern("src/pages/*.tsx").test("src/pages/List.tsx.bak"));
});

test("each screen is matched to the source file its loader imports", () => {
  const sources = { ...SOURCES, "src/pages/detail/index.tsx": SOURCE };
  const text = registry(
    screen("/", "@/pages/List"),
    screen("/detail", "@/pages/detail"),
    screen("/gone", "@/pages/Gone"),
    '  { path: "/bare", states: [] },',
  );
  assert.deepEqual(
    screenFiles(text, sources).map((item) => [item.path, item.file]),
    [
      ["/", "src/pages/List.tsx"],
      ["/detail", "src/pages/detail/index.tsx"],
      ["/gone", null],
      ["/bare", null],
    ],
  );
});

test("every screen is of exactly one kind, and a kind's page names its task and its files", () => {
  assert.equal(kindsProblem(PAGES, REGISTRY, SOURCES), null);
  assert.match(kindsProblem({}, REGISTRY, SOURCES), /no page under design\/patterns/);
  // A screen whose file no page names.
  const two = registry(screen("/", "@/pages/List"), screen("/form", "@/forms/Edit"));
  const sources = { ...SOURCES, "src/forms/Edit.tsx": SOURCE };
  assert.match(kindsProblem(PAGES, two, sources), /\/form \(src\/forms\/Edit\.tsx\) is of no kind/);
  // A screen two pages both name.
  const both = { ...PAGES, "design/patterns/form.md": page({ nhom: "form" }) };
  assert.match(kindsProblem(both, REGISTRY, SOURCES), /is of list and form/);
  // A file that left a kind is not of it.
  const left = {
    "design/patterns/list.md": page({
      ngoai_le: "\n  - tep: src/pages/List.tsx\n    ly_do: its own kind",
    }),
  };
  assert.match(kindsProblem(left, REGISTRY, SOURCES), /is of no kind/);
  // A page that does not say what the kind is for.
  const silent = { "design/patterns/list.md": page({ nhan_viec: null }) };
  assert.match(kindsProblem(silent, REGISTRY, SOURCES), /has no nhan_viec: the main task/);
  const renamed = { "design/patterns/list.md": page({ nhom: "grid" }) };
  assert.match(kindsProblem(renamed, REGISTRY, SOURCES), /names the kind grid, not list/);
  // A screen whose file cannot be told is not passed over.
  const bare = registry('  { path: "/bare", states: [] },');
  assert.match(kindsProblem(PAGES, bare, SOURCES), /\/bare: cannot tell which file draws it/);
  assert.match(kindsProblem(PAGES, "", SOURCES), /no screen is listed/);
});

test("a kind's reference is a listed screen of that kind with every required state", () => {
  assert.equal(referenceProblem(PAGES, REGISTRY, STATES, SOURCES), null);
  const none = { "design/patterns/list.md": page({ mau_dang_chay: null }) };
  assert.match(referenceProblem(none, REGISTRY, STATES, SOURCES), /names no reference screen/);
  // A showcase that is not a screen of the product.
  const showcase = { "design/patterns/list.md": page({ mau_dang_chay: "\n  tep: src/demo.tsx" }) };
  assert.match(
    referenceProblem(showcase, REGISTRY, STATES, SOURCES),
    /src\/demo\.tsx is not the file of a listed screen/,
  );
  // A screen of another kind.
  const sources = { ...SOURCES, "src/forms/Edit.tsx": SOURCE };
  const two = registry(screen("/", "@/pages/List"), screen("/form", "@/forms/Edit"));
  const other = {
    "design/patterns/list.md": page({ mau_dang_chay: "\n  tep: src/forms/Edit.tsx" }),
  };
  assert.match(referenceProblem(other, two, STATES, sources), /is not of the kind list/);
  // A screen that does not show every state cannot be the example of them.
  const thin = registry(screen("/", "@/pages/List", ["ready", "loading"]));
  assert.match(
    referenceProblem(PAGES, thin, STATES, SOURCES),
    /\/ declares no state named empty, error, no-results/,
  );
  const excused = JSON.stringify({ required: CORE_STATES, exempt: { "/": "loads no data" } });
  assert.match(referenceProblem(PAGES, REGISTRY, excused, SOURCES), /is excused from the states/);
});

test("the widths reach down to the reflow width, and the browser test reads them", () => {
  const sizes = (widths) => JSON.stringify({ version: 1, widths });
  const reads =
    "const sizes = read('../../design/screen-sizes.json');\nfor (const w of sizes.widths) {}";
  assert.equal(sizesProblem(sizes([320, 1440]), reads), null);
  assert.equal(sizesProblem(sizes([280]), reads), null);
  assert.match(sizesProblem(null, reads), /is missing/);
  assert.match(sizesProblem("{", reads), /not valid JSON/);
  assert.match(sizesProblem(sizes([]), reads), /lists no width/);
  assert.match(sizesProblem(sizes([320.5]), reads), /whole number/);
  assert.match(sizesProblem(sizes([390, 1440]), reads), /narrowest width is 390px/);
  assert.match(sizesProblem(sizes([320]), null), /is missing, so no page is checked/);
  assert.match(sizesProblem(sizes([320]), "for (const width of [1440]) {}"), /does not read/);
  // A comment that names the file is not a test that reads it.
  const said = "// widths of design/screen-sizes.json\nfor (const width of [1440]) {}";
  assert.match(sizesProblem(sizes([320]), said), /does not read/);
  const block = "/* screen-sizes.json, its widths */\nfor (const width of [1440]) {}";
  assert.match(sizesProblem(sizes([320]), block), /does not read/);
  // Nor is a test that opens the file and then goes through widths of its own.
  const unused = "const sizes = read('design/screen-sizes.json');\nfor (const w of [1440]) {}";
  assert.match(sizesProblem(sizes([320]), unused), /does not go through its widths/);
  // Nor one that only names the field in a type and then lists widths of its own.
  const typed =
    "const sizes = read('design/screen-sizes.json') as { widths: number[] };\nfor (const w of [320, 1440]) {}";
  assert.match(sizesProblem(sizes([320]), typed), /does not go through its widths/);
});

test("the guide installs the layer, and each rule goes red when it is broken", () => {
  const breaks = {
    "page-layouts": (dir) =>
      edit(dir, "src/screens.ts", (s) => s.replace("@/pages/List", "@/forms/Edit")),
    "reference-implementation": (dir) =>
      edit(dir, "src/screens.ts", (s) => s.replace('{ name: "empty", shows: LABELS.title }, ', "")),
    "test-screen-sizes": (dir) => edit(dir, SIZES_FILE, (s) => s.replace("320", "390")),
  };
  for (const [id, change] of Object.entries(breaks)) {
    const dir = floor({ "src/forms/Edit.tsx": SOURCE });
    const applied = run(APPLY, "--target", dir);
    assert.equal(applied.status, 0, applied.stderr);
    assert.match(applied.stdout, new RegExp(`^${id}: `, "m"));
    const rows = rowsOf(dir);
    assert.equal(rows[id].check, TOOL, id);
    assert.equal(rows[id].layer, "templates", id);
    assert.ok(rows[id].note, id);
    assert.equal(check(dir).status, 0, check(dir).stderr);
    change(dir);
    const broken = check(dir);
    assert.equal(broken.status, 1, id);
    assert.match(broken.stderr, new RegExp(`${id}: `), id);
  }
});

test("with the browser test come the parts it asks for, before the data model types a field", () => {
  // No field of the data model names a column type, so the typed table is not installed.
  const parts = [
    "src/components/ui/table-actions.tsx",
    "tests/table-actions.test.tsx",
    "src/components/held-label.tsx",
    "tests/held-label.test.tsx",
  ];
  const bare = floor();
  assert.equal(run(APPLY, "--target", bare).status, 0);
  for (const file of parts) assert.ok(!existsSync(path.join(bare, file)), file);

  const dir = floor({ "src/components/ui/table.tsx": own("src/components/ui/table.tsx") });
  const applied = run(APPLY, "--target", dir);
  assert.equal(applied.status, 0, applied.stderr);
  assert.ok(!existsSync(path.join(dir, "src/components/ui/typed-table.tsx")));
  for (const file of parts) assert.ok(existsSync(path.join(dir, file)), file);
  // The rules page names them, so an agent that meets the red test knows what to reach for.
  const rules = text(dir, ".claude/rules/design-assembly.md");
  assert.match(rules, /`TableActionsHead` and `TableActions`/);
  assert.match(rules, /`HeldLabel`/);
  // They are the repository's from then on: an edit is kept.
  edit(dir, parts[0], (s) => `${s}// kept\n`);
  assert.equal(run(APPLY, "--target", dir).status, 0);
  assert.match(text(dir, parts[0]), /\/\/ kept\n$/);
});

test("with the table comes the record panel, opening a record as the blueprint decides", () => {
  const parts = [
    "src/components/record-panel.tsx",
    "src/lib/open-record.ts",
    "tests/record-panel.test.tsx",
  ];
  const bare = floor();
  assert.equal(run(APPLY, "--target", bare).status, 0);
  for (const file of parts) assert.ok(!existsSync(path.join(bare, file)), file);
  assert.equal(rowsOf(bare)["record-panel"], undefined);

  const dir = floor({ "src/components/ui/table.tsx": own("src/components/ui/table.tsx") });
  const applied = run(APPLY, "--target", dir);
  assert.equal(applied.status, 0, applied.stderr);
  for (const file of parts) assert.ok(existsSync(path.join(dir, file)), file);
  assert.match(
    applied.stdout,
    /record-panel: a record opens beside, proposed, until a person chooses/,
  );
  const row = rowsOf(dir)["record-panel"];
  assert.equal(row.check, TOOL);
  assert.equal(row.layer, "patterns");
  assert.match(row.note, /a person has not confirmed it/);
  // The audit names it: a check holds the proposal, and nobody has made the choice yet.
  assert.match(
    run(AUDIT, "--target", dir).stdout,
    /held by a check are still a proposal a person has not confirmed: record-panel/,
  );
  assert.match(
    text(dir, ".claude/rules/design-assembly.md"),
    /## A record beside a list\n\n- .*`WithRecord`/,
  );
  assert.equal(check(dir).status, 0, check(dir).stderr);

  // The person's letter: the guide writes it into the panel, and the row stops being a proposal.
  edit(dir, "design/blueprint.json", (s) => {
    const blueprint = JSON.parse(s);
    blueprint.layers.patterns = {
      status: "decided",
      source: "user",
      choice: { record_panel: "over" },
      why: "Chosen on the sheet.",
    };
    return JSON.stringify(blueprint);
  });
  // Changed without running the guide again, the answer is not in force, and the gate says so.
  const stale = check(dir);
  assert.equal(stale.status, 1);
  assert.match(
    stale.stderr,
    /record-panel: .*decides that a record opens over, and .* opens it beside/,
  );
  assert.equal(run(APPLY, "--target", dir).status, 0);
  assert.match(text(dir, parts[0]), /RECORD_LAYOUT: RecordLayout = "over";/);
  assert.doesNotMatch(rowsOf(dir)["record-panel"].note, /not confirmed/);
  assert.doesNotMatch(run(AUDIT, "--target", dir).stdout, /not confirmed: record-panel/);
  assert.equal(check(dir).status, 0, check(dir).stderr);
  // The rest of the panel is the repository's: an edit is kept; the line itself is held.
  edit(dir, parts[0], (s) => `${s}// kept\n`);
  assert.equal(run(APPLY, "--target", dir).status, 0);
  assert.match(text(dir, parts[0]), /\/\/ kept\n$/);
  edit(dir, parts[0], (s) => s.replace('= "over";', '= "in-place";'));
  const edited = check(dir);
  assert.equal(edited.status, 1);
  assert.match(edited.stderr, /record-panel: /);
});

test("a blueprint written before the record layout could be asked is applied with the proposal", () => {
  const dir = floor({ "src/components/ui/table.tsx": own("src/components/ui/table.tsx") });
  edit(dir, "design/blueprint.json", (s) => {
    const blueprint = JSON.parse(s);
    blueprint.layers.patterns = { status: "planned" };
    blueprint.layers.context.choice.product_type = "content-site";
    return JSON.stringify(blueprint);
  });
  const applied = run(APPLY, "--target", dir);
  assert.equal(applied.status, 0, applied.stderr);
  assert.match(text(dir, "src/components/record-panel.tsx"), /= "in-place";/);
  assert.match(
    rowsOf(dir)["record-panel"].note,
    /proposed by the guide; a person has not confirmed it/,
  );
  assert.ok(!existsSync(path.join(dir, "design/decisions/patterns.md")));
});

test("the guide writes the widths and the browser test once, and points three rows at the test", () => {
  const dir = floor();
  const applied = run(APPLY, "--target", dir);
  assert.equal(applied.status, 0, applied.stderr);
  assert.deepEqual(JSON.parse(text(dir, SIZES_FILE)).widths, STARTER_WIDTHS);
  assert.equal(text(dir, PAGES_TEST), text(PLUGIN, "templates/owned/templates.spec.ts.template"));
  const rows = rowsOf(dir);
  for (const id of ["one-main-one-h1", "no-sideways-scroll", "wcag-aa"]) {
    assert.equal(rows[id].check, `e2e:${PAGES_TEST}`, id);
    assert.equal(rows[id].layer, "templates", id);
  }
  // The same test also proves where focus is after an action, and that a row's actions are in
  // view: decisions about behaviour.
  for (const id of ["focus-after-action", "row-actions-in-view"]) {
    assert.equal(rows[id].check, `e2e:${PAGES_TEST}`, id);
    assert.equal(rows[id].layer, "patterns", id);
  }
  // Both files are the repository's from then on: a person's widths and edits are kept.
  edit(dir, SIZES_FILE, (s) => s.replace("1440", "1024"));
  edit(dir, PAGES_TEST, (s) => `${s}// kept\n`);
  const again = run(APPLY, "--target", dir);
  assert.equal(again.status, 0, again.stderr);
  assert.deepEqual(JSON.parse(text(dir, SIZES_FILE)).widths, [320, 1024]);
  assert.match(text(dir, PAGES_TEST), /\/\/ kept\n$/);
  assert.equal(check(dir).status, 0, check(dir).stderr);
});

test("the browser test the guide installs is the reference implementation's", () => {
  assert.equal(text(PLUGIN, "templates/owned/templates.spec.ts.template"), own(PAGES_TEST));
});

test("the main task is recorded as a person's call, and a row a person changed is kept", () => {
  const dir = floor();
  assert.equal(run(APPLY, "--target", dir).status, 0);
  const row = rowsOf(dir)["primary-task"];
  assert.equal(row.kind, "judgment");
  assert.equal(row.check, undefined);
  assert.match(row.note, /a person has not confirmed it/);
  // The person confirms: the note goes. Running the guide again leaves the row alone.
  edit(dir, "design/decisions.yaml", (s) => s.replace(/\n {4}note: "written for 1 kind.*"/, ""));
  const pages = text(dir, "design/decisions/context.md");
  const again = run(APPLY, "--target", dir);
  assert.equal(again.status, 0, again.stderr);
  assert.equal(rowsOf(dir)["primary-task"].note, undefined);
  assert.match(again.stdout, /unchanged design\/decisions\.yaml/);
  assert.equal(text(dir, "design/decisions/context.md"), pages);
  assert.match(pages, /`primary-task`: judgment, a person's call, no check/);
});

test("a second run changes nothing", () => {
  const dir = floor();
  assert.equal(run(APPLY, "--target", dir).status, 0);
  const again = run(APPLY, "--target", dir);
  assert.equal(again.status, 0, again.stderr);
  assert.doesNotMatch(again.stdout, /^(create|update)/m);
});

test("without a page, no kind is held and the guide says what to write; no page is ever written", () => {
  const dir = floor({ "design/patterns/list.md": "# Not a kind\n" });
  rmSync(path.join(dir, "design/patterns"), { recursive: true });
  const applied = run(APPLY, "--target", dir);
  assert.equal(applied.status, 0, applied.stderr);
  assert.match(applied.stdout, /hint: no page describes a kind of screen yet/);
  const rows = rowsOf(dir);
  assert.equal(rows["page-layouts"], undefined);
  assert.equal(rows["reference-implementation"], undefined);
  assert.equal(rows["primary-task"], undefined);
  assert.doesNotMatch(applied.stdout, /design\/patterns\//);
  assert.equal(check(dir).status, 0, check(dir).stderr);
});

test("a screen of no kind gets no row, and the guide says which screen", () => {
  const dir = floor({
    "src/forms/Edit.tsx": SOURCE,
    "src/screens.ts": registry(screen("/", "@/pages/List"), screen("/form", "@/forms/Edit")),
  });
  const applied = run(APPLY, "--target", dir);
  assert.equal(applied.status, 0, applied.stderr);
  assert.match(
    applied.stdout,
    /note: page-layouts: \/form \(src\/forms\/Edit\.tsx\) is of no kind/,
  );
  assert.equal(rowsOf(dir)["page-layouts"], undefined);
  assert.equal(check(dir).status, 0, check(dir).stderr);
});

test("where the floor's browser checks are not installed, no width and no browser test is written", () => {
  const dir = floor({ "package.json": JSON.stringify({ devDependencies: {} }) });
  const applied = run(APPLY, "--target", dir);
  assert.equal(applied.status, 0, applied.stderr);
  assert.doesNotMatch(applied.stdout, /screen-sizes|templates\.spec/);
  assert.equal(rowsOf(dir)["wcag-aa"], undefined);
  // The kinds are held all the same: they need no browser.
  assert.equal(rowsOf(dir)["page-layouts"].check, TOOL);
});

test("adopting claims the page checks from a browser test that names them, and writes none", () => {
  const dir = floor({
    [PAGES_TEST]: text(PLUGIN, "templates/owned/templates.spec.ts.template"),
  });
  const adopted = run(ADOPT, "--target", dir);
  assert.equal(adopted.status, 0, adopted.stderr);
  const rows = rowsOf(dir);
  for (const id of [
    "one-main-one-h1",
    "no-sideways-scroll",
    "wcag-aa",
    "focus-after-action",
    "row-actions-in-view",
  ]) {
    assert.equal(rows[id].check, `e2e:${PAGES_TEST}`, id);
  }
  assert.doesNotMatch(adopted.stdout, /screen-sizes\.json/);
});

test("the audit says which recorded rows nobody confirmed, and that the kinds of screen are open", () => {
  // No page yet: the next step names the kinds of screen instead of saying nothing is left.
  const bare = floor();
  rmSync(path.join(bare, "design/patterns"), { recursive: true });
  assert.equal(run(APPLY, "--target", bare).status, 0);
  const before = run(AUDIT, "--target", bare);
  assert.equal(before.status, 0, before.stderr);
  assert.match(before.stdout, /next: .*the kinds of screen close when each has its page/);
  // With a page: the main task is recorded, and the report says a person has not confirmed it.
  const dir = floor();
  assert.equal(run(APPLY, "--target", dir).status, 0);
  const audited = run(AUDIT, "--target", dir);
  assert.match(
    audited.stdout,
    /of the recorded are a proposal a person has not confirmed: .*primary-task/,
  );
  assert.doesNotMatch(audited.stdout, /the kinds of screen close/);
  // The person confirms by taking the note away: the row is no longer named.
  edit(dir, "design/decisions.yaml", (s) => s.replace(/\n {4}note: "written for 1 kind.*"/, ""));
  const confirmed = run(AUDIT, "--target", dir);
  assert.doesNotMatch(confirmed.stdout, /not confirmed: .*primary-task/);
});

test("the rules page says who wrote it and names the screen rules only where they are held", () => {
  const dir = floor();
  assert.equal(run(APPLY, "--target", dir).status, 0);
  const page = text(dir, ".claude/rules/design-assembly.md");
  assert.match(page, /written by the design-assembly scripts/);
  assert.match(page, /## A screen\n\n- Every screen is of one kind/);
  assert.match(page, /design\/screen-sizes\.json/);
  assert.match(page, /## After an action\n\n- Focus never falls on nothing/);
  // Rules nobody checks are listed apart, under a heading that says so.
  assert.match(
    page,
    /## No check holds these: a person reviews them\n\n(?:- .*\n)*- One item changing/,
  );
  const bare = floor();
  rmSync(path.join(bare, "design/patterns"), { recursive: true });
  assert.equal(run(APPLY, "--target", bare).status, 0);
  assert.doesNotMatch(
    text(bare, ".claude/rules/design-assembly.md"),
    /Every screen is of one kind/,
  );
});
