// Column types: what is read from the data model, the table a person owns, the file derived from
// both, and the three things a screen may not set on a table itself. Every check is shown going
// red on a real change.
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { execPath } from "node:process";
import { after, test } from "node:test";
import { fileURLToPath } from "node:url";

import {
  BASES,
  buildColumns,
  cellProblems,
  readDisplays,
  typesProblem,
} from "../templates/tools/design-assembly/columns.mjs";
import { parseLedger, TOOL } from "../templates/tools/design-assembly/ledger.mjs";
import { withRecordLayout } from "../templates/tools/design-assembly/patterns.mjs";
import { withoutBlock } from "../templates/tools/design-assembly/theme.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const PLUGIN = path.resolve(HERE, "..");
const ROOT = path.resolve(PLUGIN, "../..");
const APPLY = path.join(PLUGIN, "scripts/apply.mjs");
const ADOPT = path.join(PLUGIN, "scripts/adopt.mjs");
const LAYERS = JSON.parse(readFileSync(path.join(PLUGIN, "references/layers.json"), "utf8")).layers;
const TYPES = "design/column-types.json";
const COLUMNS = "design/columns.json";

const made = [];
after(() => made.forEach((dir) => rmSync(dir, { recursive: true, force: true })));

function folder(files) {
  const dir = mkdtempSync(path.join(tmpdir(), "design-assembly-columns-"));
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

const ORDER = [
  "name: Order",
  "description: A sample.",
  "",
  "properties:",
  "  id: { type: integer, required: true }",
  "  customer: { type: string, required: true, display: text }",
  "  total: { type: number, display: number }",
  "  placed:",
  "    type: date",
  "    display: date",
  "",
  "code:",
  "  display: not-a-property",
  "",
].join("\n");
const SCREEN = [
  'import { TableCell, TableRow } from "@/components/ui/table";',
  "",
  "export const Row = () => (",
  "  <TableRow>",
  '    <TableCell className="font-medium">a</TableCell>',
  '    <div className="h-8 w-40 text-right">not a table part</div>',
  "  </TableRow>",
  ");",
  "",
].join("\n");

const own = (file) => readFileSync(path.join(ROOT, file), "utf8");
const floor = (extra = {}) =>
  folder({
    "src/index.css": withoutBlock(own("src/index.css")),
    Makefile: own("Makefile"),
    "components.json": own("components.json"),
    "src/components/ui/table.tsx": own("src/components/ui/table.tsx"),
    "src/screens/Row.tsx": SCREEN,
    "ontology/entities/Order.yaml": ORDER,
    "ontology/entities/_template.yaml": ORDER.replace("Order", "Template"),
    "design/blueprint.json": blueprint(),
    ...extra,
  });

const run = (script, ...args) => spawnSync(execPath, [script, ...args], { encoding: "utf8" });
const check = (dir) => run(path.join(dir, "tools/design-assembly/check.mjs"), "--target", dir);
const columns = (dir, ...args) =>
  run(path.join(dir, "tools/design-assembly/columns.mjs"), "--target", dir, ...args);
const text = (dir, file) => readFileSync(path.join(dir, file), "utf8");
const put = (dir, file, content) => writeFileSync(path.join(dir, file), content);
const edit = (dir, file, change) => {
  const before = text(dir, file);
  const next = change(before);
  assert.notEqual(next, before, `the edit of ${file} changed nothing`);
  put(dir, file, next);
};
const rowsOf = (dir) =>
  Object.fromEntries(parseLedger(text(dir, "design/decisions.yaml")).map((r) => [r.id, r]));

test("a field names its column type once, in the data model", () => {
  const dir = floor();
  // Written on the property's line or under it; only properties count, and the template is not
  // an entity.
  assert.deepEqual(readDisplays(dir), {
    "Order.customer": "text",
    "Order.total": "number",
    "Order.placed": "date",
  });
});

test("the table of column types is checked, and alignment is derived from the base type", () => {
  const table = { version: 1, padding_ch: 2, types: { money: { base: "number", sample: 9 } } };
  const good = JSON.stringify(table);
  assert.equal(typesProblem(good, { "Order.total": "money" }), null);
  assert.match(typesProblem(null, {}), /is missing/);
  assert.match(typesProblem(good, { "Order.total": "price" }), /Order\.total names 'price'/);
  const bad = { ...table, types: { Money: { base: "amount", sample: 0 } } };
  const problem = typesProblem(JSON.stringify(bad), {});
  assert.match(problem, /'Money' is not a lower-case name/);
  assert.match(problem, /base must be one of text, number, date, datetime, boolean, select/);
  assert.match(problem, /sample must be a whole number of characters, 1 or more/);

  // Only a quantity is aligned to the right: digits that are not compared stay on the left.
  assert.deepEqual(
    Object.entries(BASES).filter(([, side]) => side === "right"),
    [["number", "right"]],
  );
  assert.deepEqual(buildColumns(table, { "Order.total": "money" }), {
    version: 1,
    padding_ch: 2,
    types: { money: { base: "number", align: "right", sample: 9 } },
    fields: { "Order.total": "money" },
  });
});

test("a screen that sets alignment, width or row height on a table is found", () => {
  const cell = (classes) => `export const A = () => <TableCell className=${classes} />;\n`;
  const files = {
    "src/a.tsx": cell('"text-right"'),
    "src/b.tsx": cell('{cn("p-2", wide && "md:min-w-40")}'),
    "src/c.tsx": 'export const C = () => <TableRow className="h-8 text-xs" />;\n',
    "src/d.tsx": SCREEN,
    // The system's own components may: that is where the rule is applied.
    "src/components/ui/typed.tsx": cell('"text-right w-40"'),
  };
  const skip = ["src/components/ui/"];
  assert.match(
    cellProblems(files, "align", skip),
    /^src\/a\.tsx: <TableCell> sets text-right itself: /,
  );
  assert.match(
    cellProblems(files, "width", skip),
    /^src\/b\.tsx: <TableCell> sets md:min-w-40 itself: /,
  );
  assert.match(
    cellProblems(files, "density", skip),
    /^src\/c\.tsx: <TableRow> sets h-8 itself; src\/c\.tsx: <TableRow> sets text-xs itself: /,
  );
  // Other elements, and other classes on a cell, are not this rule's business.
  assert.equal(cellProblems({ "src/d.tsx": SCREEN }, "align", skip), null);
  assert.equal(cellProblems({ "src/d.tsx": SCREEN }, "density", skip), null);
});

test("the guide installs the layer: the table, the derived file, four rows and the table parts", () => {
  const dir = floor();
  const applied = run(APPLY, "--target", dir);
  assert.equal(applied.status, 0, applied.stderr);
  assert.match(applied.stdout, /column types: 3 field\(s\) of the data model name a column type/);
  for (const file of [
    TYPES,
    COLUMNS,
    "src/components/ui/typed-table.tsx",
    "tests/typed-table.test.tsx",
  ]) {
    assert.ok(existsSync(path.join(dir, file)), file);
  }
  assert.deepEqual(Object.keys(JSON.parse(text(dir, TYPES)).types), Object.keys(BASES));
  assert.deepEqual(JSON.parse(text(dir, COLUMNS)).fields, readDisplays(dir));
  const rows = rowsOf(dir);
  for (const id of ["display-kind", "column-align", "column-width", "table-density"]) {
    assert.equal(rows[id].check, TOOL, id);
    assert.equal(rows[id].layer, "components", id);
  }
  // The rows that hold only part of the rule say which part.
  assert.match(rows["column-width"].note, /the sum itself is done by whatever draws the table/);
  assert.match(rows["table-density"].note, /the choice between the two densities/);
  assert.equal(check(dir).status, 0, check(dir).stderr);

  // What a person owns is never written again: the table, and the code once it is there.
  edit(dir, TYPES, (json) => json.replace('"sample": 16', '"sample": 20'));
  edit(dir, "src/components/ui/typed-table.tsx", (source) => `// ours now\n${source}`);
  const again = run(APPLY, "--target", dir);
  assert.equal(again.status, 0, again.stderr);
  assert.match(text(dir, TYPES), /"sample": 20/);
  assert.match(text(dir, "src/components/ui/typed-table.tsx"), /^\/\/ ours now/);
  // And the derived file follows the table.
  assert.equal(JSON.parse(text(dir, COLUMNS)).types.text.sample, 20);
  assert.equal(check(dir).status, 0, check(dir).stderr);
});

test("each rule is held: breaking it turns the gate red, and names the place", () => {
  const breaks = {
    "column-align": (dir) =>
      edit(dir, "src/screens/Row.tsx", (s) => s.replace("font-medium", "text-right font-medium")),
    "column-width": (dir) =>
      edit(dir, "src/screens/Row.tsx", (s) => s.replace("font-medium", "w-40 font-medium")),
    "table-density": (dir) =>
      edit(dir, "src/screens/Row.tsx", (s) =>
        s.replace("<TableRow>", '<TableRow className="h-8">'),
      ),
    "display-kind": (dir) =>
      edit(dir, "ontology/entities/Order.yaml", (s) => s.replace("display: text", "display: name")),
  };
  for (const [id, change] of Object.entries(breaks)) {
    const dir = floor();
    assert.equal(run(APPLY, "--target", dir).status, 0);
    assert.equal(check(dir).status, 0, id);
    change(dir);
    const broken = check(dir);
    assert.equal(broken.status, 1, id);
    assert.match(broken.stderr, new RegExp(`${id}: `), id);
  }
});

test("the derived file is held to the table and the data model, whichever side moved", () => {
  const dir = floor();
  assert.equal(run(APPLY, "--target", dir).status, 0);
  const stale =
    /column-align: design\/columns\.json is not what design\/column-types\.json and the data model give/;

  edit(dir, TYPES, (json) => json.replace('"sample": 6', '"sample": 8'));
  assert.match(check(dir).stderr, stale);
  assert.equal(columns(dir).status, 1);
  assert.match(columns(dir, "--write").stdout, /wrote design\/columns\.json \(3 fields\)/);
  assert.equal(check(dir).status, 0, check(dir).stderr);

  edit(dir, "ontology/entities/Order.yaml", (s) =>
    s.replace("id: { type: integer", "id: { display: number, type: integer"),
  );
  assert.match(check(dir).stderr, stale);
  assert.equal(columns(dir, "--write").status, 0);

  // A column switched to the other side by hand.
  edit(dir, COLUMNS, (json) => json.replace('"align": "right"', '"align": "left"'));
  assert.match(check(dir).stderr, /column-align: .*\(number\)/);
});

test("a table that does not cover the data model gets no rows, and the guide says why", () => {
  const dir = floor({
    "ontology/entities/Order.yaml": ORDER.replace("display: number", "display: money"),
  });
  const applied = run(APPLY, "--target", dir);
  assert.equal(applied.status, 0, applied.stderr);
  assert.match(
    applied.stdout,
    /note: column types: .*Order\.total names 'money', which is not a column type/,
  );
  const rows = rowsOf(dir);
  assert.equal(rows["display-kind"], undefined);
  assert.equal(rows["column-align"], undefined);
  assert.equal(check(dir).status, 0, check(dir).stderr);
});

test("with no typed field the kinds are not claimed; a screen already setting widths gets no row", () => {
  const dir = floor({
    "ontology/entities/Order.yaml": ORDER.replaceAll(/,? *display: \w+/g, ""),
    "src/screens/Row.tsx": SCREEN.replace("font-medium", "w-40"),
  });
  const applied = run(APPLY, "--target", dir);
  assert.equal(applied.status, 0, applied.stderr);
  assert.match(
    applied.stdout,
    /hint: no field names a column type yet\. The three table rules are held all the same/,
  );
  assert.match(
    applied.stdout,
    /note: column-width: src\/screens\/Row\.tsx: <TableCell> sets w-40 itself/,
  );
  // No typed field, so nothing to type yet: the table parts and their tests are not installed.
  assert.ok(!existsSync(path.join(dir, "src/components/ui/typed-table.tsx")));
  assert.ok(!existsSync(path.join(dir, "tests/typed-table.test.tsx")));
  const rows = rowsOf(dir);
  assert.equal(rows["display-kind"], undefined);
  assert.equal(rows["column-width"], undefined);
  assert.equal(rows["column-align"].check, TOOL);
  assert.equal(check(dir).status, 0, check(dir).stderr);
});

test("adopting writes no table and no code: it asks for the table, then holds what is there", () => {
  const dir = floor();
  const asked = run(ADOPT, "--target", dir);
  assert.equal(asked.status, 0, asked.stderr);
  assert.match(
    asked.stdout,
    /display-kind: the data model names 3 column type\(s\) \(text, number, date\) and there is no design\/column-types\.json/,
  );
  assert.ok(!existsSync(path.join(dir, TYPES)));
  assert.ok(!existsSync(path.join(dir, "src/components/ui/typed-table.tsx")));

  const table = { version: 1, padding_ch: 2, types: {} };
  for (const name of ["text", "number", "date"]) table.types[name] = { base: name, sample: 8 };
  put(dir, TYPES, `${JSON.stringify(table, null, 2)}\n`);
  const adopted = run(ADOPT, "--target", dir);
  assert.equal(adopted.status, 0, adopted.stderr);
  assert.match(
    adopted.stdout,
    /display-kind: 3 field\(s\) of the data model each name a column type/,
  );
  assert.equal(rowsOf(dir)["column-align"].check, TOOL);
  assert.ok(existsSync(path.join(dir, COLUMNS)));
  assert.ok(!existsSync(path.join(dir, "src/components/ui/typed-table.tsx")));
  assert.equal(check(dir).status, 0, check(dir).stderr);
});

test("the table parts the guide installs are the ones the reference implementation runs", () => {
  for (const [template, file] of [
    ["typed-table.tsx.template", "src/components/ui/typed-table.tsx"],
    ["typed-table.test.tsx.template", "tests/typed-table.test.tsx"],
    ["held-label.tsx.template", "src/components/held-label.tsx"],
    ["held-label.test.tsx.template", "tests/held-label.test.tsx"],
    ["open-record.ts.template", "src/lib/open-record.ts"],
    ["record-panel.test.tsx.template", "tests/record-panel.test.tsx"],
  ]) {
    assert.equal(text(PLUGIN, `templates/owned/${template}`), own(file), file);
  }
  // The record panel is the same but for its one line, which follows this repository's answer.
  const layout = JSON.parse(own("design/blueprint.json")).layers.patterns.choice.record_panel;
  assert.equal(
    withRecordLayout(text(PLUGIN, "templates/owned/record-panel.tsx.template"), layout),
    own("src/components/record-panel.tsx"),
  );
});

test("the typed table parts are held to the rule too: a screen cannot restyle them", () => {
  const files = {
    "src/a.tsx":
      'export const A = () => <TypedCell field="Order.total" className="min-w-40 text-left" />;\n',
    "src/b.tsx":
      'export const B = () => <TypedHead field="Order.total" header={h} className="w-24 text-center" />;\n',
    "src/c.tsx": 'export const C = () => <TypedRow className="h-9" />;\n',
  };
  assert.match(
    cellProblems(files, "align"),
    /src\/a\.tsx: <TypedCell> sets text-left itself; src\/b\.tsx: <TypedHead> sets text-center itself/,
  );
  assert.match(
    cellProblems(files, "width"),
    /<TypedCell> sets min-w-40 itself; .*<TypedHead> sets w-24 itself/,
  );
  assert.match(cellProblems(files, "density"), /src\/c\.tsx: <TypedRow> sets h-9 itself/);
});

test("the guide leaves a page of rules for the agent that builds next, naming only what is there", () => {
  const dir = floor();
  assert.equal(run(APPLY, "--target", dir).status, 0);
  const page = text(dir, ".claude/rules/design-assembly.md");
  assert.match(page, /^---\npaths: \["src\/\*\*\/\*\.tsx"\]\n---\n/);
  assert.match(
    page,
    /To add a column: give the property its `display` key, run `make gen` and `make design-columns`/,
  );
  assert.match(page, /Build the table from `TypedTable`, `TypedRow`, `TypedHead` and `TypedCell`/);
  assert.match(page, /run `make design-tokens`/);
  // No toast here: the page does not send the agent to a module that does not exist.
  assert.doesNotMatch(page, /notify\.ts/);
  assert.match(page, /told through the repository's one module for it/);
  // Every path the page names in backticks is in the repository.
  for (const [, file] of page.matchAll(/`((?:src|design|tools|mk|ontology)\/[^`*<]*[^`*</])`/g)) {
    assert.ok(existsSync(path.join(dir, file)), file);
  }

  // Without a typed field there are no typed parts, and the page does not name them.
  const bare = floor({ "ontology/entities/Order.yaml": ORDER.replaceAll(/,? *display: \w+/g, "") });
  assert.equal(run(APPLY, "--target", bare).status, 0);
  const plain = text(bare, ".claude/rules/design-assembly.md");
  assert.doesNotMatch(plain, /TypedTable|display` key on its property/);
  assert.match(plain, /Alignment and width come from the column type of the field/);
});
