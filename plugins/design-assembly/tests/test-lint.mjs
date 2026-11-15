// Re-running a repository's own lint: on a throwaway repository whose lint has one rule that
// rejects a raw table and one that rejects only part of what breaks a class name. The rule that
// rejects every probe gains the tool's check, and the gate fails once that rule is turned off; the
// other stays claimed, with what it lets through.
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { execPath } from "node:process";
import { after, test } from "node:test";
import { fileURLToPath } from "node:url";

import { inventory } from "../scripts/inventory.mjs";
import { heldHere } from "../templates/tools/design-assembly/check.mjs";
import { lintPointer, PROBED, probesFor } from "../templates/tools/design-assembly/probes.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const PLUGIN = path.resolve(HERE, "..");
const ROOT = path.resolve(PLUGIN, "../..");
const ADOPT = path.join(PLUGIN, "scripts/adopt.mjs");
const LINTED = existsSync(path.join(ROOT, "node_modules/eslint"));

const made = [];
after(() => made.forEach((dir) => rmSync(dir, { recursive: true, force: true })));

const TABLE = "JSXOpeningElement[name.name='table']";
const TEMPLATE = "JSXAttribute[name.name='className'] TemplateLiteral";

function config(selectors, extra = "") {
  const rules = selectors.map((selector) => `{ selector: "${selector}", message: "no" }`);
  return [
    'import tseslint from "typescript-eslint";',
    "",
    "export default [",
    "  {",
    '    files: ["src/**/*.tsx"],',
    "    languageOptions: { parser: tseslint.parser },",
    `    rules: { "no-restricted-syntax": ["error", ${rules.join(", ")}]${extra} },`,
    "  },",
    "];",
    "",
  ].join("\n");
}

const row = (id, layer, kind) =>
  `  - id: ${id}\n    layer: ${layer}\n    kind: ${kind}\n    source: "the team"\n    check: "eslint:no-restricted-syntax"\n`;
const LEDGER = [
  "version: 1",
  "decisions:",
  row("raw-table", "components", "standard"),
  row("whole-class-names", "foundations", "closed"),
].join("\n");

function repository() {
  const dir = mkdtempSync(path.join(tmpdir(), "design-assembly-lint-"));
  made.push(dir);
  const files = {
    "package.json": '{ "name": "probe", "private": true, "type": "module" }\n',
    Makefile: "CHECK_TARGETS := lint\n-include mk/*.mk\ncheck: $(CHECK_TARGETS)\n",
    "eslint.config.js": config([TABLE, TEMPLATE]),
    "design/decisions.yaml": LEDGER,
    "src/app/page.tsx": "export function Page() {\n  return <main />;\n}\n",
  };
  for (const [file, content] of Object.entries(files)) {
    mkdirSync(path.dirname(path.join(dir, file)), { recursive: true });
    writeFileSync(path.join(dir, file), content);
  }
  // The repository's lint is this repository's packages.
  symlinkSync(path.join(ROOT, "node_modules"), path.join(dir, "node_modules"));
  return dir;
}

const run = (script, ...args) => spawnSync(execPath, [script, ...args], { encoding: "utf8" });

test("every decision the tool probes has texts that break it, and a control", () => {
  const component = { name: "Button", from: "@/components/ui/button" };
  for (const id of PROBED) {
    const set = probesFor(id, { component, rules: ["team/a-rule"] });
    assert.ok(set, id);
    assert.ok(set.probes.length > 0, id);
    assert.ok(
      set.probes.every((probe) => probe.text !== set.control && probe.label),
      id,
    );
  }
  // What breaks the direction of imports depends on each repository's parts.
  assert.equal(probesFor("tier-direction"), null);
  // Without a component of the library, a restyled component cannot be probed.
  assert.equal(probesFor("no-restyled-component"), null);
});

test("a row is held here when it points at the tool, or at the rule the tool re-runs", () => {
  const lint = { "raw-table": [{ kind: "lint", rule: "no-restricted-syntax", at: "src/a.tsx" }] };
  assert.ok(heldHere({ id: "raw-table", check: lintPointer("no-restricted-syntax") }, lint));
  assert.ok(!heldHere({ id: "raw-table", check: lintPointer("other/rule") }, lint));
  assert.ok(!heldHere({ id: "raw-table", check: lintPointer("no-restricted-syntax") }, {}));
  assert.ok(heldHere({ id: "x", check: "tool:tools/design-assembly/check.mjs" }, {}));
});

test(
  "adopting re-runs the lint: a rule that rejects every probe is held, one that lets some through is not",
  { skip: !LINTED && "no lint installed here" },
  () => {
    const dir = repository();
    const before = readFileSync(path.join(dir, "design/decisions.yaml"), "utf8");
    const adopted = run(ADOPT, "--target", dir);
    assert.equal(adopted.status, 1, adopted.stderr);
    assert.match(
      adopted.stdout,
      /now re-run by this tool[^\n]*\n {2}raw-table: every probe is rejected, by no-restricted-syntax/,
    );
    // A class name built with `+` is not rejected by a rule that reads template strings only.
    assert.match(
      adopted.stdout,
      /whole-class-names: the repository's lint lets through `<div className=\{"text-" \+ tone\} \/>`/,
    );

    // The rows are the repository's, and stay as they were.
    const after = readFileSync(path.join(dir, "design/decisions.yaml"), "utf8");
    assert.ok(after.includes(before.split("decisions:\n")[1].trim()));
    const theme = JSON.parse(readFileSync(path.join(dir, "design/theme.json"), "utf8"));
    assert.deepEqual(theme.checks["raw-table"], [
      { kind: "lint", rule: "no-restricted-syntax", at: "src/app/page.tsx" },
    ]);
    assert.equal(theme.checks["whole-class-names"], undefined);

    // The audit counts the row as held, and the other as claimed.
    const audit = inventory(dir);
    const state = (id) => audit.decisions.find((decision) => decision.id === id);
    assert.equal(state("raw-table").state, "held");
    assert.match(state("raw-table").by, /re-run by this plugin's tool/);
    assert.equal(state("whole-class-names").state, "claimed");

    // The gate holds it from now on: it passes, and fails once the rule no longer rejects a table.
    const check = path.join(dir, "tools/design-assembly/check.mjs");
    const green = run(check, "--target", dir);
    assert.equal(green.status, 0, green.stderr);
    writeFileSync(path.join(dir, "eslint.config.js"), config([TEMPLATE]));
    const red = run(check, "--target", dir);
    assert.equal(red.status, 1);
    assert.match(red.stderr, /raw-table: the repository's lint lets through `<table \/>`/);
  },
);

test(
  "another rule that rejects every probe does not hold a row that names a different rule",
  { skip: !LINTED && "no lint installed here" },
  () => {
    const dir = repository();
    // The row names a rule that is an error on screen files but rejects no table; the rule that
    // rejects a table is another one.
    const imports = ', "no-restricted-imports": ["error", "left-pad"]';
    writeFileSync(path.join(dir, "eslint.config.js"), config([TABLE, TEMPLATE], imports));
    writeFileSync(
      path.join(dir, "design/decisions.yaml"),
      LEDGER.replace(
        'id: raw-table\n    layer: components\n    kind: standard\n    source: "the team"\n    check: "eslint:no-restricted-syntax"',
        'id: raw-table\n    layer: components\n    kind: standard\n    source: "the team"\n    check: "eslint:no-restricted-imports"',
      ),
    );
    const adopted = run(ADOPT, "--target", dir, "--dry-run");
    assert.equal(adopted.status, 1, adopted.stderr);
    assert.match(
      adopted.stdout,
      /raw-table: the repository's lint lets through `<table \/>`: no-restricted-imports does not reject it/,
    );
    assert.doesNotMatch(adopted.stdout, /raw-table: every probe is rejected/);

    // A check written by hand for that rule fails, and names the rule.
    const check = { kind: "lint", rule: "no-restricted-imports", at: "src/app/page.tsx" };
    const theme = { version: 1, checks: { "raw-table": [check] } };
    writeFileSync(path.join(dir, "design/theme.json"), `${JSON.stringify(theme, null, 2)}\n`);
    const tool = path.join(PLUGIN, "templates/tools/design-assembly/check.mjs");
    const red = run(tool, "--target", dir);
    assert.notEqual(red.status, 0);
    assert.match(
      red.stderr,
      /raw-table: the repository's lint lets through `<table \/>`: no-restricted-imports does not reject it/,
    );
  },
);

test(
  "a repository without a lint to run keeps its rows claimed, and says why",
  { skip: !LINTED && "no lint installed here" },
  () => {
    const dir = repository();
    rmSync(path.join(dir, "node_modules"));
    const adopted = run(ADOPT, "--target", dir, "--dry-run");
    assert.equal(adopted.status, 1, adopted.stderr);
    assert.match(adopted.stdout, /raw-table: the repository has no lint installed/);
  },
);
