// The governance layer, as far as a tool reads it from source: no part of the code imports a
// part listed above it, and the record of what slipped past the checks can be acted on. Each rule
// is shown going red on a real change.
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { execPath } from "node:process";
import { after, test } from "node:test";
import { fileURLToPath } from "node:url";

import {
  againstDirection,
  importsOf,
  importsProblem,
  PARTS_FILE,
  partOf,
  readSlips,
  SLIPS_FILE,
  slipsProblem,
  starterParts,
} from "../templates/tools/design-assembly/governance.mjs";
import { parseLedger, TOOL } from "../templates/tools/design-assembly/ledger.mjs";
import { CORE_STATES } from "../templates/tools/design-assembly/patterns.mjs";
import { kindsProblem } from "../templates/tools/design-assembly/screens.mjs";
import { withoutBlock } from "../templates/tools/design-assembly/theme.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const PLUGIN = path.resolve(HERE, "..");
const ROOT = path.resolve(PLUGIN, "../..");
const APPLY = path.join(PLUGIN, "scripts/apply.mjs");
const AUDIT = path.join(PLUGIN, "scripts/inventory.mjs");
const LAYERS = JSON.parse(readFileSync(path.join(PLUGIN, "references/layers.json"), "utf8")).layers;

const made = [];
after(() => made.forEach((dir) => rmSync(dir, { recursive: true, force: true })));

function folder(files) {
  const dir = mkdtempSync(path.join(tmpdir(), "design-assembly-governance-"));
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

const PAGE = [
  "---",
  "nhom: list",
  "doi_tuong: A screen that shows many items of one type.",
  "khuon: { ten: Table, nhap: '@/components/ui/table' }",
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
].join("\n");
const PAGES = { "design/patterns/list.md": PAGE };
const states = ["ready", ...CORE_STATES]
  .map((name) => `{ name: "${name}", shows: LABELS.title }`)
  .join(", ");
const SOURCES = {
  "src/main.tsx": 'import { SCREENS } from "./screens";\nexport const all = SCREENS;\n',
  "src/screens.ts": `import { LABELS } from "@/lib/labels";\nexport const SCREENS = [\n  { path: "/", load: () => import("@/pages/List").then((m) => m.Page), states: [${states}] },\n];\n`,
  "src/pages/List.tsx":
    'import { Badge } from "@/components/ui/badge";\nimport { LABELS } from "@/lib/labels";\n\nexport function Page() {\n  return (\n    <main>\n      <h1>{LABELS.title}</h1>\n      <Badge />\n    </main>\n  );\n}\n',
  "src/components/ui/badge.tsx":
    'import { join } from "../../lib/join";\n\nexport function Badge() {\n  return <span className={join()} />;\n}\n',
  "src/lib/join.ts": 'export const join = () => "inline-flex";\n',
  "src/lib/labels.ts": 'export const LABELS = { title: "Items" };\n',
};
const PARTS = JSON.stringify(starterParts("src/components/ui"));

const own = (file) => readFileSync(path.join(ROOT, file), "utf8");
const floor = (extra = {}) =>
  folder({
    "src/index.css": withoutBlock(own("src/index.css")),
    Makefile: own("Makefile"),
    "design/blueprint.json": blueprint(),
    "design/patterns/list.md": PAGE,
    ...SOURCES,
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

test("imports are read as written: static, for effect and dynamic, and not from comments", () => {
  const found = importsOf(
    [
      'import { a } from "@/lib/a";',
      "import type { B } from './b';",
      'import "./styles.css";',
      'export { c } from "../c";',
      'const d = () => import("@/pages/D");',
      '// import { e } from "@/pages/E";',
      '/* import("@/pages/F") */',
    ].join("\n"),
  );
  assert.deepEqual(found.sort(), ["../c", "./b", "./styles.css", "@/lib/a", "@/pages/D"]);
});

test("a file is of the first part that names it, and screens are the files the pages name", () => {
  const parts = JSON.parse(PARTS).parts;
  const of = partOf(parts, SOURCES, PAGES);
  const name = (file) => parts[of[file]]?.name;
  assert.equal(name("src/main.tsx"), "app");
  assert.equal(name("src/screens.ts"), "app");
  assert.equal(name("src/pages/List.tsx"), "screens");
  assert.equal(name("src/components/ui/badge.tsx"), "components");
  assert.equal(name("src/lib/labels.ts"), "base");
});

test("a part imports only itself and the parts listed after it", () => {
  assert.equal(importsProblem(PARTS, SOURCES, PAGES), null);
  // A component that reaches up to a screen, through the alias or a relative path.
  for (const up of ['import { Page } from "@/pages/List";', 'import "../../pages/List";']) {
    const sources = {
      ...SOURCES,
      "src/components/ui/badge.tsx": `${up}\nexport const Badge = 1;\n`,
    };
    assert.match(
      importsProblem(PARTS, sources, PAGES),
      /src\/components\/ui\/badge\.tsx \(components\) imports src\/pages\/List\.tsx \(screens\)/,
    );
  }
  // A dynamic import counts: a lint rule on static imports would miss it.
  const lazy = { ...SOURCES, "src/lib/join.ts": 'export const up = () => import("@/screens");\n' };
  assert.match(
    importsProblem(PARTS, lazy, PAGES),
    /src\/lib\/join\.ts \(base\) imports src\/screens\.ts \(app\)/,
  );
  // A package, and a file outside the sources, are not read.
  const outside = {
    ...SOURCES,
    "src/lib/join.ts": 'import x from "react";\nimport y from "../../design/columns.json";\n',
  };
  assert.equal(importsProblem(PARTS, outside, PAGES), null);
});

test("the list of parts is checked before the imports are", () => {
  assert.match(importsProblem(null, SOURCES, PAGES), /design\/parts\.json is missing/);
  assert.match(importsProblem("{", SOURCES, PAGES), /not valid JSON/);
  const one = JSON.stringify({ parts: [{ name: "all", files: ["src/**"] }] });
  assert.match(importsProblem(one, SOURCES, PAGES), /fewer than two parts/);
  const twice = JSON.stringify({
    parts: [
      { name: "a", files: ["src/*.ts"] },
      { name: "a", files: ["src/**"] },
    ],
  });
  assert.match(importsProblem(twice, SOURCES, PAGES), /names a part twice/);
  const empty = JSON.stringify({ parts: [{ name: "a", files: ["src/**"] }, { name: "b" }] });
  assert.match(importsProblem(empty, SOURCES, PAGES), /b names no files and no kinds of screen/);
  // A file no part names is not passed over.
  const narrow = JSON.stringify({
    parts: [
      { name: "screens", kinds: "design/patterns" },
      { name: "components", files: ["src/components/**"] },
    ],
  });
  assert.match(importsProblem(narrow, SOURCES, PAGES), /src\/lib\/join\.ts.* of no part/);
  // Every file in one part: nothing is measured, and the check says so.
  const flat = JSON.stringify({
    parts: [
      { name: "all", files: ["src/**"] },
      { name: "none", files: ["lib/**"] },
    ],
  });
  assert.match(importsProblem(flat, SOURCES, PAGES), /fewer than two parts .* have files/);
});

test("the changed copy the gate runs on always goes against the direction", () => {
  const changed = againstDirection(PARTS, SOURCES, PAGES);
  assert.match(importsProblem(PARTS, changed, PAGES), /\(base\) imports src\/main\.tsx \(app\)/);
});

test("every line of the record names a date, what slipped, a layer and what was done", () => {
  const head = "# Slips\n\n| Date | What | Layer | Done |\n| ---- | ---- | ----- | ---- |\n";
  assert.equal(slipsProblem(head), null);
  const good = `${head}| 2026-01-05 | a hover colour too faint | foundations | check extended |\n`;
  assert.equal(slipsProblem(good), null);
  assert.deepEqual(readSlips(good), [
    ["2026-01-05", "a hover colour too faint", "foundations", "check extended"],
  ]);
  assert.match(slipsProblem(null), /is missing/);
  assert.match(slipsProblem("# Slips\n\nNothing yet.\n"), /has no table/);
  assert.match(slipsProblem(`${head}| yesterday | x | patterns | y |\n`), /no date written/);
  assert.match(
    slipsProblem(`${head}| 2026-01-05 |  | patterns | y |\n`),
    /does not say what slipped/,
  );
  assert.match(slipsProblem(`${head}| 2026-01-05 | x | the tests | y |\n`), /names no layer/);
  assert.match(
    slipsProblem(`${head}| 2026-01-05 | x | patterns |  |\n`),
    /does not say what was done/,
  );
  // The layer may sit in a sentence, in any language, as long as its name is there whole.
  assert.equal(slipsProblem(`${head}| 2026-01-05 | x | tầng patterns | y |\n`), null);
  assert.match(slipsProblem(`${head}| 2026-01-05 | x | anti-patterns | y |\n`), /names no layer/);
});

test("a file left out of a kind of screen says why", () => {
  const page = PAGE.replace(
    "ngoai_le: []",
    "ngoai_le:\n  - tep: src/pages/Old.tsx\n    ly_do: waits for its move",
  );
  const registry = SOURCES["src/screens.ts"];
  assert.equal(kindsProblem({ "design/patterns/list.md": page }, registry, SOURCES), null);
  const silent = PAGE.replace("ngoai_le: []", "ngoai_le:\n  - tep: src/pages/Old.tsx");
  assert.match(
    kindsProblem({ "design/patterns/list.md": silent }, registry, SOURCES),
    /leaves out src\/pages\/Old\.tsx without a reason/,
  );
});

test("the guide installs both rules, and each goes red when it is broken", () => {
  const breaks = {
    "tier-direction": (dir) => edit(dir, "src/lib/join.ts", (s) => `import "@/pages/List";\n${s}`),
    escapes: (dir) => edit(dir, SLIPS_FILE, (s) => `${s}| soon | x | patterns | y |\n`),
  };
  for (const [id, change] of Object.entries(breaks)) {
    const dir = floor();
    const applied = run(APPLY, "--target", dir);
    assert.equal(applied.status, 0, applied.stderr);
    assert.match(applied.stdout, new RegExp(`^${id}: `, "m"));
    const rows = rowsOf(dir);
    assert.equal(rows[id].check, TOOL, id);
    assert.equal(rows[id].layer, "governance", id);
    assert.ok(rows[id].note, id);
    assert.equal(check(dir).status, 0, check(dir).stderr);
    change(dir);
    const broken = check(dir);
    assert.equal(broken.status, 1, id);
    assert.match(broken.stderr, new RegExp(`${id}: `), id);
  }
});

test("both files are written once, are a person's from then on, and a second run changes nothing", () => {
  const dir = floor();
  assert.equal(run(APPLY, "--target", dir).status, 0);
  assert.deepEqual(JSON.parse(text(dir, PARTS_FILE)), starterParts("src/components/ui"));
  assert.equal(readSlips(text(dir, SLIPS_FILE)).length, 0);
  edit(dir, SLIPS_FILE, (s) => `${s}| 2026-02-01 | a fault | templates | a new check |\n`);
  edit(dir, PARTS_FILE, (s) => s.replace('"base"', '"foundation"'));
  const again = run(APPLY, "--target", dir);
  assert.equal(again.status, 0, again.stderr);
  assert.doesNotMatch(again.stdout, /^(create|update)/m);
  assert.match(text(dir, PARTS_FILE), /"foundation"/);
  assert.equal(readSlips(text(dir, SLIPS_FILE)).length, 1);
});

test("without a page of a kind there is no top part, so no direction is held; the record still is", () => {
  const dir = floor();
  rmSync(path.join(dir, "design/patterns"), { recursive: true });
  const applied = run(APPLY, "--target", dir);
  assert.equal(applied.status, 0, applied.stderr);
  const rows = rowsOf(dir);
  assert.equal(rows["tier-direction"], undefined);
  assert.equal(rows.escapes.check, TOOL);
  assert.doesNotMatch(applied.stdout, /design\/parts\.json/);
});

test("code that already goes against the direction gets no row, and the guide names the import", () => {
  const dir = floor({
    "src/lib/join.ts": 'import "@/pages/List";\nexport const join = () => "";\n',
  });
  const applied = run(APPLY, "--target", dir);
  assert.equal(applied.status, 0, applied.stderr);
  assert.match(
    applied.stdout,
    /note: tier-direction: src\/lib\/join\.ts \(base\) imports src\/pages\/List\.tsx \(screens\)/,
  );
  assert.equal(rowsOf(dir)["tier-direction"], undefined);
  assert.equal(check(dir).status, 0, check(dir).stderr);
});

test("the audit counts the record and the departures on purpose, and reaches the tier", () => {
  const page = PAGE.replace(
    "ngoai_le: []",
    "ngoai_le:\n  - tep: src/pages/Old.tsx\n    ly_do: waits for its move",
  );
  const dir = floor({
    "design/patterns/list.md": page,
    "src/lib/join.ts":
      '// eslint-disable-next-line no-console -- shown once\nexport const join = () => "";\n',
  });
  assert.equal(run(APPLY, "--target", dir).status, 0);
  const empty = run(AUDIT, "--target", dir);
  assert.equal(empty.status, 0, empty.stderr);
  assert.match(empty.stdout, /design\/escapes\.md: no line yet\. An empty record is not proof/);
  assert.match(
    empty.stdout,
    /departures on purpose: 1 lint exception\(s\), 0 screen\(s\) excused from the states, 1 file\(s\) left out of a kind of screen/,
  );
  assert.doesNotMatch(empty.stdout, /no row\s+tier-direction/);
  assert.doesNotMatch(empty.stdout, /missing: one of design\/escapes\.md/);
  edit(
    dir,
    SLIPS_FILE,
    (s) => `${s}| 2026-02-01 | a | templates | b |\n| 2026-03-09 | c | patterns | d |\n`,
  );
  assert.match(
    run(AUDIT, "--target", dir).stdout,
    /design\/escapes\.md: 2 line\(s\), the latest on 2026-03-09/,
  );
});

test("the rules page names the parts and the record only where they are held", () => {
  const dir = floor();
  assert.equal(run(APPLY, "--target", dir).status, 0);
  const page = text(dir, ".claude/rules/design-assembly.md");
  assert.match(page, /## The system itself\n\n- The code has parts/);
  assert.match(page, /add a line to `design\/escapes\.md` before you fix it/);
  const bare = floor();
  rmSync(path.join(bare, "design/patterns"), { recursive: true });
  assert.equal(run(APPLY, "--target", bare).status, 0);
  assert.doesNotMatch(text(bare, ".claude/rules/design-assembly.md"), /The code has parts/);
});
