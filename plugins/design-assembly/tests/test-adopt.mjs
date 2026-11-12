// Adopting on throwaway repositories: one with the floor of the repository this plugin lives in,
// one that keeps a brand colour of its own across several stylesheets. Every claim is shown in
// both directions: the check passes on the repository as found, and fails once the value moves.
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { execPath } from "node:process";
import { after, test } from "node:test";
import { fileURLToPath } from "node:url";

import { parseColor } from "../templates/tools/design-assembly/color.mjs";
import { parseLedger, TOOL } from "../templates/tools/design-assembly/ledger.mjs";
import { loadStyles, resolve } from "../templates/tools/design-assembly/styles.mjs";
import { withoutBlock } from "../templates/tools/design-assembly/theme.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const PLUGIN = path.resolve(HERE, "..");
const ROOT = path.resolve(PLUGIN, "../..");
const ADOPT = path.join(PLUGIN, "scripts/adopt.mjs");
const APPLY = path.join(PLUGIN, "scripts/apply.mjs");
const LAYERS = JSON.parse(readFileSync(path.join(PLUGIN, "references/layers.json"), "utf8")).layers;

const made = [];
after(() => made.forEach((dir) => rmSync(dir, { recursive: true, force: true })));

function folder(files) {
  const dir = mkdtempSync(path.join(tmpdir(), "design-assembly-adopt-"));
  made.push(dir);
  for (const [file, content] of Object.entries(files)) {
    mkdirSync(path.dirname(path.join(dir, file)), { recursive: true });
    writeFileSync(path.join(dir, file), content);
  }
  return dir;
}

const own = (file) => readFileSync(path.join(ROOT, file), "utf8");

// The floor as this repository has it, before any guide ran: its stylesheet, its lint rules, its
// guard tool and its browser test.
function floor(extra = {}) {
  return folder({
    "src/index.css": withoutBlock(own("src/index.css")),
    Makefile: own("Makefile"),
    "eslint.config.js": own("eslint.config.js"),
    "tools/design_guards.mjs": own("tools/design_guards.mjs"),
    "mk/design.mk": own("mk/design.mk"),
    "design/terms.json": own("design/terms.json"),
    "tests/e2e/floor.spec.ts": own("tests/e2e/floor.spec.ts"),
    ...extra,
  });
}

// A repository with values of its own: the brand colour sits in an imported file, color roles
// point at it, white comes from the framework, and dark mode mixes its primary.
const BRAND = {
  "components.json": JSON.stringify({ tailwind: { css: "src/app/globals.css" } }),
  Makefile: "CHECK_TARGETS := lint\n-include mk/*.mk\ncheck: $(CHECK_TARGETS)\n",
  "node_modules/tailwindcss/theme.css":
    "@theme default {\n  --color-white: #fff;\n  --color-neutral-950: oklch(14.5% 0 none);\n}\n",
  "src/app/globals.css": [
    '@import "tailwindcss";',
    '@import "../styles/brand.css";',
    "",
    ":root {",
    "  --radius: 0.625rem;",
    "  --background: var(--color-white);",
    "  --primary: var(--brand-blue);",
    "  --primary-foreground: var(--color-white);",
    "}",
    "",
  ].join("\n"),
  "src/styles/brand.css": [
    '@import "./dark.css";',
    "",
    ":root {",
    "  --brand-blue: #0246ff;",
    "}",
    "",
  ].join("\n"),
  "src/styles/dark.css": [
    ":root.dark {",
    "  --background: var(--color-neutral-950);",
    "  --primary: color-mix(in oklch, var(--brand-blue) 60%, white);",
    "  --primary-foreground: var(--color-neutral-950);",
    "}",
    "",
  ].join("\n"),
};

const run = (script, ...args) => spawnSync(execPath, [script, ...args], { encoding: "utf8" });
const adopt = (dir, ...args) => run(ADOPT, "--target", dir, ...args);
const check = (dir) => run(path.join(dir, "tools/design-assembly/check.mjs"), "--target", dir);
const text = (dir, file) => readFileSync(path.join(dir, file), "utf8");
const rowsOf = (dir) => parseLedger(text(dir, "design/decisions.yaml"));
const edit = (dir, file, change) => {
  const before = text(dir, file);
  const next = change(before);
  assert.notEqual(next, before, `the edit of ${file} changed nothing`);
  writeFileSync(path.join(dir, file), next);
};

test("colours are read as stylesheets write them: short hex, percent lightness, a missing hue", () => {
  assert.deepEqual(parseColor("#fff"), parseColor("#ffffff"));
  assert.deepEqual(parseColor("oklch(14.5% 0 none)"), { l: 0.145, c: 0, h: 0 });
  assert.equal(parseColor("color-mix(in oklch, #0246ff 60%, white)"), null);
});

test("a value is followed through imports and var() to the framework's theme", () => {
  const dir = folder(BRAND);
  const styles = loadStyles(dir, "src/app/globals.css");
  assert.deepEqual(styles.files, [
    "src/app/globals.css",
    "src/styles/brand.css",
    "src/styles/dark.css",
  ]);
  assert.deepEqual(resolve(styles, ":root", "--primary").color, parseColor("#0246ff"));
  assert.deepEqual(resolve(styles, ":root", "--background").color, parseColor("#ffffff"));
  assert.equal(resolve(styles, ":root.dark", "--background").color.l, 0.145);
  // A mixed colour is kept as written and not guessed at.
  const mixed = resolve(styles, ":root.dark", "--primary");
  assert.match(mixed.value, /^color-mix/);
  assert.equal(mixed.color, null);
});

test("a preview writes nothing", () => {
  const dir = floor();
  const result = adopt(dir, "--dry-run");
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /preview only: nothing was written/);
  assert.throws(() => text(dir, "design/decisions.yaml"));
  assert.throws(() => text(dir, "tools/design-assembly/check.mjs"));
});

test("on the floor: rows for the proofs it has, checks around its values, nothing else touched", () => {
  const dir = floor();
  const untouched = ["src/index.css", "eslint.config.js", "tests/e2e/floor.spec.ts", "Makefile"];
  const before = untouched.map((file) => text(dir, file));
  const result = adopt(dir, "--conformance-level", "AA");
  assert.equal(result.status, 0, result.stderr);
  assert.deepEqual(
    untouched.map((file) => text(dir, file)),
    before,
  );

  const rows = Object.fromEntries(rowsOf(dir).map((row) => [row.id, row]));
  assert.equal(rows["color-role"].check, "eslint:shadcn/no-raw-colors");
  assert.equal(rows["raw-table"].check, "eslint:no-restricted-syntax");
  assert.equal(rows["lint-exceptions"].check, "tool:tools/design_guards.mjs");
  for (const id of ["color-contrast", "radius-value", "type-scale-values", "spacing-values"]) {
    assert.equal(rows[id].check, TOOL, id);
  }
  assert.equal(rows["checks-in-gate"].check, TOOL);
  assert.equal(rows["conformance-level"].kind, "judgment");
  assert.equal(rows["conformance-level"].check, undefined);
  // The brand colour is a person's call: seen, shown, not written.
  assert.equal(rows["source-color"], undefined);
  assert.match(result.stdout, /source-color: --primary is .* run again with --record source-color/);
  // A proof that carries no tag is reported, never claimed.
  assert.equal(rows["wcag-aa"], undefined);
  assert.match(result.stdout, /wcag-aa: e2e:tests\/e2e\/floor\.spec\.ts: the file does not name/);

  const theme = JSON.parse(text(dir, "design/theme.json"));
  assert.equal(theme.stylesheet, "src/index.css");
  assert.deepEqual(theme.adopted.sort(), [
    "color-contrast",
    "radius-value",
    "spacing-values",
    "type-scale-values",
  ]);
  const checked = check(dir);
  assert.equal(checked.status, 0, checked.stderr);
  assert.match(checked.stdout, /5 decisions held by \d+ checks, each seen failing/);

  const again = adopt(dir, "--conformance-level", "AA");
  assert.equal(again.status, 0, again.stderr);
  assert.match(again.stdout, /rows to add: 0/);
  assert.doesNotMatch(again.stdout, /^\s+(create|update)\s/m);
});

test("each adopted value is held: moving it turns the gate red", () => {
  const changes = {
    "color-contrast": (css) =>
      css.replace(/(:root \{[^}]*?--primary: )[^;]+;/, "$1oklch(0.9 0 0);"),
    "radius-value": (css) => css.replace(/--radius: [^;]+;/, "--radius: 3px;"),
    "spacing-values": (css) => `${css}\n:root {\n  --spacing: 5px;\n}\n`,
    "type-scale-values": (css) => `${css}\n:root {\n  --text-lg: 99px;\n}\n`,
  };
  for (const [id, change] of Object.entries(changes)) {
    const dir = floor();
    assert.equal(adopt(dir, "--conformance-level", "AA").status, 0);
    assert.equal(check(dir).status, 0, id);
    edit(dir, "src/index.css", change);
    const broken = check(dir);
    assert.equal(broken.status, 1, id);
    assert.match(broken.stderr, new RegExp(`${id}: `), id);
  }
});

test("without a stated conformance level the ratios are shown and no contrast check is added", () => {
  const dir = floor();
  const result = adopt(dir);
  assert.equal(result.status, 0, result.stderr);
  assert.match(
    result.stdout,
    /contrast ratios today:\n\s+light \(:root\): --primary on --background \d+\.\d\d:1/,
  );
  assert.match(result.stdout, /conformance-level: say which level/);
  const ids = rowsOf(dir).map((row) => row.id);
  assert.ok(!ids.includes("color-contrast") && !ids.includes("conformance-level"));
  assert.equal(check(dir).status, 0);
});

test("a repository's own brand colour is held where it can be read, and the rest is said aloud", () => {
  const dir = folder(BRAND);
  const sheets = ["src/app/globals.css", "src/styles/brand.css", "src/styles/dark.css"];
  const before = sheets.map((file) => text(dir, file));
  const result = adopt(dir, "--conformance-level", "AA", "--record", "source-color");
  assert.equal(result.status, 0, result.stderr);
  assert.deepEqual(
    sheets.map((file) => text(dir, file)),
    before,
  );
  assert.match(result.stdout, /light \(:root\): --primary on --background 6\.\d\d:1/);
  assert.match(result.stdout, /cannot be read here:\n\s+color-contrast: dark: .*color-mix/);

  const rows = Object.fromEntries(rowsOf(dir).map((row) => [row.id, row]));
  assert.equal(rows["color-contrast"].check, TOOL);
  assert.match(rows["color-contrast"].note, /light mode; the pairs that could not be read/);
  assert.equal(rows["source-color"].kind, "judgment");
  assert.equal(rows["source-color"].source, "src/app/globals.css");

  const theme = JSON.parse(text(dir, "design/theme.json"));
  assert.equal(theme.stylesheet, "src/app/globals.css");
  assert.deepEqual(
    theme.checks["color-contrast"].map((item) => item.scope),
    [":root", ":root"],
  );
  assert.equal(check(dir).status, 0, check(dir).stderr);

  // The brand colour lives two imports away from the color role that uses it.
  edit(dir, "src/styles/brand.css", (css) => css.replace("#0246ff", "#9db8ff"));
  const broken = check(dir);
  assert.equal(broken.status, 1);
  assert.match(
    broken.stderr,
    /color-contrast: --primary on --background in :root has a contrast ratio of/,
  );
});

test("a value that would fail today gets no row: the script does not adopt a broken state", () => {
  const dir = folder({
    ...BRAND,
    "src/styles/brand.css": BRAND["src/styles/brand.css"].replace("#0246ff", "#9db8ff"),
  });
  const result = adopt(dir, "--conformance-level", "AA");
  assert.equal(result.status, 0, result.stderr);
  assert.match(
    result.stdout,
    /would fail today, so nothing was added:\n\s+color-contrast: light: /,
  );
  const ids = rowsOf(dir).map((row) => row.id);
  assert.ok(!ids.includes("color-contrast"));
  assert.ok(ids.includes("radius-value"));
  assert.equal(check(dir).status, 0, check(dir).stderr);
});

test("a row already in the ledger is left byte for byte, and gets no second proof", () => {
  const mine = [
    "# our own ledger",
    "version: 1",
    "decisions:",
    "  - id: radius-value",
    "    layer: foundations",
    "    kind: judgment",
    '    source: "the brand book"   # kept by hand',
    "",
  ].join("\n");
  const dir = floor({ "design/decisions.yaml": mine });
  assert.equal(adopt(dir).status, 0);
  assert.ok(text(dir, "design/decisions.yaml").startsWith(mine.trimEnd()));
  assert.equal(JSON.parse(text(dir, "design/theme.json")).checks["radius-value"], undefined);
  assert.equal(check(dir).status, 0, check(dir).stderr);
});

test("a tagged browser test is claimed; an untagged one is not", () => {
  const spec = `// decision:wcag-aa\n${own("tests/e2e/floor.spec.ts")}`;
  const dir = floor({ "tests/e2e/floor.spec.ts": spec });
  assert.equal(adopt(dir).status, 0);
  const rows = Object.fromEntries(rowsOf(dir).map((row) => [row.id, row]));
  assert.equal(rows["wcag-aa"].check, "e2e:tests/e2e/floor.spec.ts");
  assert.equal(rows["no-sideways-scroll"], undefined);
});

test("without a gate that can run the tool, no value check is added and a person is told", () => {
  const dir = floor({ Makefile: "check:\n\t@echo nothing\n" });
  const result = adopt(dir, "--conformance-level", "AA");
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /checks-in-gate: the Makefile does not include mk\/\*\.mk/);
  const rows = rowsOf(dir);
  assert.ok(rows.every((row) => row.check !== TOOL));
  assert.ok(rows.some((row) => row.id === "color-role"));
  assert.throws(() => text(dir, "tools/design-assembly/check.mjs"));
});

test("flags that would put words in a person's mouth are refused", () => {
  const dir = floor();
  const level = adopt(dir, "--conformance-level", "A");
  assert.equal(level.status, 2);
  assert.match(level.stderr, /conformance level must be one of AA, AAA/);
  const record = adopt(dir, "--record", "product-type");
  assert.equal(record.status, 2);
  assert.match(record.stderr, /cannot write a row for product-type/);
  assert.throws(() => text(dir, "design/decisions.yaml"));

  assert.equal(adopt(dir, "--conformance-level", "AA").status, 0);
  const changed = adopt(dir, "--conformance-level", "AAA");
  assert.equal(changed.status, 2);
  assert.match(changed.stderr, /already records conformance level AA/);
});

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

test("the guide does not write over adopted values unless a person says to replace them", () => {
  const dir = floor({ "design/blueprint.json": blueprint() });
  assert.equal(adopt(dir, "--conformance-level", "AA").status, 0);
  const css = text(dir, "src/index.css");

  const refused = run(APPLY, "--target", dir);
  assert.equal(refused.status, 2);
  assert.match(refused.stderr, /hold values adopted from this repository/);
  assert.equal(text(dir, "src/index.css"), css);

  const preview = run(APPLY, "--target", dir, "--dry-run");
  assert.equal(preview.status, 0, preview.stderr);
  assert.match(preview.stdout, /note: .*Writing will be refused/);
  assert.equal(text(dir, "src/index.css"), css);

  const replaced = run(APPLY, "--target", dir, "--replace");
  assert.equal(replaced.status, 0, replaced.stderr);
  assert.equal(JSON.parse(text(dir, "design/theme.json")).adopted, undefined);
  assert.equal(check(dir).status, 0, check(dir).stderr);
});

test("the guide does not write over a primary color role that has a hue of its own", () => {
  const css = withoutBlock(own("src/index.css")).replace(
    /(:root \{[^}]*?--primary: )[^;]+;/,
    "$1#0246ff;",
  );
  const dir = floor({ "src/index.css": css, "design/blueprint.json": blueprint() });
  const refused = run(APPLY, "--target", dir);
  assert.equal(refused.status, 2);
  assert.match(refused.stderr, /already declares a primary color role of its own \(#0246ff\)/);
  assert.equal(text(dir, "src/index.css"), css);
  assert.equal(run(APPLY, "--target", dir, "--replace").status, 0);
});
