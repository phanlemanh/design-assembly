// Adopting on throwaway repositories: one with the floor of the repository this plugin lives in,
// one that keeps a brand colour of its own across several stylesheets. Every claim is shown in
// both directions: the check passes on the repository as found, and fails once the value moves.
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { execPath } from "node:process";
import { after, test } from "node:test";
import { fileURLToPath } from "node:url";

import { audit } from "../scripts/audit.mjs";
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
    // A mix in a colour space the reader does not compute: still a colour it cannot read.
    "  --primary: color-mix(in srgb, var(--brand-blue) 60%, white);",
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
  assert.equal(parseColor("color-mix(in srgb, #0246ff 60%, white)"), null);
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
  // Adopting ends with 1 while a call only a person can make is open, here and in the tests
  // below: it did its work, and says an answer is still owed.
  assert.equal(result.status, 1, result.stderr);
  assert.match(result.stdout, /preview only: nothing was written/);
  assert.throws(() => text(dir, "design/decisions.yaml"));
  assert.throws(() => text(dir, "tools/design-assembly/check.mjs"));
});

test("on the floor: rows for the proofs it has, checks around its values, nothing else touched", () => {
  const dir = floor();
  const untouched = ["src/index.css", "eslint.config.js", "tests/e2e/floor.spec.ts", "Makefile"];
  const before = untouched.map((file) => text(dir, file));
  const result = adopt(dir, "--conformance-level", "AA");
  assert.equal(result.status, 1, result.stderr);
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
  // The decision sheet and the wall come with the gate.
  assert.equal(rows["decision-sheet"].check, TOOL);
  assert.equal(rows["owner-calls"].check, TOOL);
  assert.equal(rows["decision-sheet"].layer, "governance");
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
  // The six values and checks around them, the typefaces as found, the shapes of the ledgers
  // adopting leaves, the decision sheet and the wall.
  assert.match(checked.stdout, /10 decisions held by \d+ checks, each seen failing/);
  assert.equal(rows.typeface.source, "the stylesheet's typefaces, as found");
  // The floor's font package is not installed in this throwaway copy: what it loads cannot be read,
  // so font-loaded is not added, and adopting says why.
  assert.equal(rows["font-loaded"], undefined);
  assert.match(result.stdout, /font-loaded: .*@fontsource-variable\/geist.*not installed here/);

  // Adopting leaves the page of rules too, written from what it now holds.
  const page = text(dir, ".claude/rules/design-assembly.md");
  // This repository has no screen and no control, so the page states no rule about either.
  assert.doesNotMatch(page, /A control is at least|toast library|## Words/);
  assert.match(page, /run `make design-tokens`/);
  assert.doesNotMatch(page, /TypedTable|notify\.ts/);

  const again = adopt(dir, "--conformance-level", "AA");
  assert.equal(again.status, 1, again.stderr);
  assert.match(again.stdout, /rows to add: 0/);
  assert.doesNotMatch(again.stdout, /^\s+(create|update)\s/m);
});

test("adopting keeps on the rules page what the owner fixed in a blueprint the guide wrote", () => {
  const dir = floor({
    "design/blueprint.json": JSON.stringify({
      version: 1,
      layers: { context: { principles: [{ id: "clear-hierarchy", source: "user" }] } },
    }),
  });
  assert.equal(adopt(dir, "--conformance-level", "AA").status, 1);
  const page = text(dir, ".claude/rules/design-assembly.md");
  assert.match(page, /## What the owner fixed before any value\n\n- `principle-clear-hierarchy`: /);
  // A blueprint that cannot be read is said, not refused: the page goes without the section.
  const other = floor({ "design/blueprint.json": "{ not json" });
  const said = adopt(other, "--conformance-level", "AA");
  assert.equal(said.status, 1, said.stderr);
  assert.match(said.stdout, /design\/blueprint\.json cannot be read as JSON/);
  assert.doesNotMatch(text(other, ".claude/rules/design-assembly.md"), /What the owner fixed/);
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
    assert.equal(adopt(dir, "--conformance-level", "AA").status, 1);
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
  assert.equal(result.status, 1, result.stderr);
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
  assert.equal(result.status, 1, result.stderr);
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
    /color-contrast: --primary on --background in light mode \(:root\) has a contrast ratio of/,
  );
});

test("a value that would fail today gets no row: the script does not adopt a broken state", () => {
  const dir = folder({
    ...BRAND,
    "src/styles/brand.css": BRAND["src/styles/brand.css"].replace("#0246ff", "#9db8ff"),
  });
  const result = adopt(dir, "--conformance-level", "AA");
  assert.equal(result.status, 1, result.stderr);
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
  assert.equal(adopt(dir).status, 1);
  assert.ok(text(dir, "design/decisions.yaml").startsWith(mine.trimEnd()));
  assert.equal(JSON.parse(text(dir, "design/theme.json")).checks["radius-value"], undefined);
  assert.equal(check(dir).status, 0, check(dir).stderr);
});

test("a tagged browser test is claimed; an untagged one is not", () => {
  const spec = `// decision:wcag-aa\n${own("tests/e2e/floor.spec.ts")}`;
  const dir = floor({ "tests/e2e/floor.spec.ts": spec });
  assert.equal(adopt(dir).status, 1);
  const rows = Object.fromEntries(rowsOf(dir).map((row) => [row.id, row]));
  assert.equal(rows["wcag-aa"].check, "e2e:tests/e2e/floor.spec.ts");
  assert.equal(rows["no-sideways-scroll"], undefined);
});

test("without a gate that can run the tool, no value check is added and a person is told", () => {
  const dir = floor({ Makefile: "check:\n\t@echo nothing\n" });
  const result = adopt(dir, "--conformance-level", "AA");
  assert.equal(result.status, 1, result.stderr);
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

  assert.equal(adopt(dir, "--conformance-level", "AA").status, 1);
  const changed = adopt(dir, "--conformance-level", "AAA");
  assert.equal(changed.status, 2);
  assert.match(changed.stderr, /already records conformance level AA/);
});

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

test("the guide does not write over adopted values unless a person says to replace them", () => {
  const dir = floor({ "design/blueprint.json": blueprint() });
  assert.equal(adopt(dir, "--conformance-level", "AA").status, 1);
  const css = text(dir, "src/index.css");

  const refused = run(APPLY, "--target", dir);
  assert.equal(refused.status, 2);
  assert.match(refused.stderr, /hold values adopted from this repository/);
  assert.equal(text(dir, "src/index.css"), css);

  const preview = run(APPLY, "--target", dir, "--dry-run");
  assert.equal(preview.status, 1, preview.stderr);
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

test("the audit and adopting give one answer about the same repository", () => {
  const dir = floor();
  const before = audit(dir);
  // Nothing has a row yet, so nothing is answered: the audit says what it sees and what to do.
  assert.equal(before.coverage.answered, 0);
  assert.match(
    before.next,
    /^\/design-assembly:new, .*The guide ends by adopting what the repository already proves/,
  );
  const seen = before.decisions
    .filter((d) => d.seen?.startsWith("a proof the repository already runs"))
    .map((d) => d.id);
  const untagged = before.decisions.find((d) => d.id === "wcag-aa");
  assert.match(untagged.seen, /a proof the ledger cannot point at yet/);

  const result = adopt(dir);
  assert.equal(result.status, 1, result.stderr);
  const rows = rowsOf(dir);
  const claimed = rows.filter((row) => row.check && row.check !== TOOL).map((row) => row.id);
  // Every proof the audit saw has a row after adopting: claimed, or held by this plugin's own
  // tool where it proves the same thing itself. And adopting claimed nothing the audit did not see.
  for (const id of seen)
    assert.ok(
      rows.some((row) => row.id === id),
      id,
    );
  for (const id of claimed) assert.ok(seen.includes(id), id);
  const after = audit(dir);
  for (const id of claimed) {
    assert.equal(after.decisions.find((d) => d.id === id).state, "claimed", id);
  }
  // What is left for adopting is a person's word.
  assert.match(after.next, /^\/design-assembly:adopt, .*to confirm with a person/);
});

test("a repository with a brand colour of its own is sent to adopting, never to the guide", () => {
  const dir = folder(BRAND);
  assert.match(
    audit(dir).next,
    /^\/design-assembly:adopt, .*Not the guide: the stylesheet has a primary color role of its own \(var\(--brand-blue\)\)/,
  );
});

test("the preview says which value each check holds, and a write says that it wrote", () => {
  const dir = floor();
  const preview = adopt(dir, "--dry-run");
  assert.match(preview.stdout, /radius-value: --radius stays 0\.625rem/);
  assert.match(preview.stdout, /type-scale-values: the framework's type sizes: fails when/);
  assert.doesNotMatch(preview.stdout, /^done:/m);
  const written = adopt(dir);
  assert.match(
    written.stdout,
    /^done: \d+ row\(s\) added to the ledger, 0 given a check, \d+ file\(s\) written$/m,
  );
  assert.match(
    adopt(dir).stdout,
    /^done: 0 row\(s\) added to the ledger, 0 given a check, 0 file\(s\) written$/m,
  );
});

test("the product type is written on a person's word, like the conformance level", () => {
  const dir = floor();
  assert.match(adopt(dir, "--dry-run").stdout, /product-type: say what kind of product this is/);
  const bad = adopt(dir, "--product-type", "game");
  assert.equal(bad.status, 2);
  assert.match(bad.stderr, /product type must be one of application, content-site/);
  assert.equal(adopt(dir, "--product-type", "application").status, 1);
  const row = rowsOf(dir).find((item) => item.id === "product-type");
  assert.equal(row.kind, "judgment");
  assert.equal(JSON.parse(text(dir, "design/theme.json")).inputs.productType, "application");
  assert.doesNotMatch(adopt(dir).stdout, /product-type: say/);
});

test("what cannot be read is said on every run, not only the first", () => {
  const dir = folder(BRAND);
  assert.equal(adopt(dir, "--conformance-level", "AA").status, 1);
  const again = adopt(dir);
  assert.match(again.stdout, /rows to add: 0/);
  assert.match(again.stdout, /contrast ratios today:/);
  assert.match(
    again.stdout,
    /cannot be read here:\n\s+color-contrast: dark: .*color-mix.*Not checked/,
  );
  // And the audit says what the held row covers.
  const held = audit(dir).decisions.find((d) => d.id === "color-contrast");
  assert.equal(held.state, "held");
  assert.match(held.note, /light mode; the pairs that could not be read are not checked/);
});

// The repository's own formatter, when it is installed next to this plugin.
const PRETTIER = path.join(ROOT, "node_modules/.bin/prettier");

test(
  "every file the scripts write is laid out as the repository's formatter leaves it",
  { skip: !existsSync(PRETTIER) && "the formatter is not installed here" },
  () => {
    const width = JSON.parse(own(".prettierrc.json")).printWidth;
    const withComponents = {
      ".prettierrc.json": own(".prettierrc.json"),
      "components.json": own("components.json"),
      "src/components/ui/button.tsx": own("src/components/ui/button.tsx"),
      "src/components/ui/card.tsx": own("src/components/ui/card.tsx"),
    };
    const adopted = floor(withComponents);
    assert.equal(adopt(adopted, "--conformance-level", "AA").status, 1);
    const guided = floor({ ...withComponents, "design/blueprint.json": blueprint() });
    assert.equal(run(APPLY, "--target", guided).status, 0);
    for (const dir of [adopted, guided]) {
      const files = ["theme.json", "tokens.json", "component-registry.json"].map((name) =>
        path.join(dir, "design", name),
      );
      const checked = spawnSync(PRETTIER, ["--check", "--print-width", String(width), ...files], {
        encoding: "utf8",
      });
      assert.equal(checked.status, 0, checked.stdout + checked.stderr);
    }
  },
);

test("a row of the repository's own that has no check is named, and pointed only on a person's word", () => {
  const mine = [
    "# our own ledger",
    "version: 1",
    "decisions:",
    "  - id: target-size",
    "    layer: components",
    "    kind: standard",
    '    source: "WCAG 2.2"   # decided in March',
    "  - id: undo-or-confirm",
    "    layer: patterns",
    "    kind: formula",
    '    source: "reversibility"',
    "  - id: conformance-level",
    "    layer: context",
    "    kind: judgment",
    '    source: "the accessibility statement"',
    "",
  ].join("\n");
  const dir = floor({
    "design/decisions.yaml": mine,
    "src/components/ui/button.tsx": own("src/components/ui/button.tsx"),
    "tests/change.test.tsx": "// decision:undo-or-confirm\nit('asks first', () => {});\n",
  });

  // The audit sees the proof the row does not point at.
  const seen = audit(dir).decisions.find((d) => d.id === "undo-or-confirm");
  assert.equal(seen.state, "not-held");
  assert.match(seen.seen, /a proof the row does not point at, test:tests\/change\.test\.tsx/);

  // Without the person's word: both rows are named, and stay byte for byte as they were.
  const listed = adopt(dir, "--conformance-level", "AA");
  assert.equal(listed.status, 1, listed.stderr);
  assert.match(
    listed.stdout,
    /rows of yours with no check, that could have one \(pass --hold with their names\):\n(.*\n)*\s+target-size: every control that declares a height is at least 24px/,
  );
  assert.match(listed.stdout, /\s+undo-or-confirm: test:tests\/change\.test\.tsx/);
  assert.ok(text(dir, "design/decisions.yaml").startsWith(mine.trimEnd()));
  assert.equal(JSON.parse(text(dir, "design/theme.json")).checks["target-size"], undefined);

  // A name that is not such a row is refused.
  const wrong = adopt(dir, "--hold", "conformance-level");
  assert.equal(wrong.status, 2);
  assert.match(
    wrong.stderr,
    /--hold takes rows of the ledger that have no check; conformance-level is not one/,
  );

  // With it: each row gains one line, and nothing else in it moves.
  const held = adopt(dir, "--hold", "target-size,undo-or-confirm");
  assert.equal(held.status, 1, held.stderr);
  assert.match(held.stdout, /rows of yours that now point at a check:/);
  assert.match(held.stdout, /^done: 0 row\(s\) added to the ledger, 2 given a check, /m);
  const after = text(dir, "design/decisions.yaml");
  assert.ok(
    after.startsWith(
      mine
        .trimEnd()
        .replace("# decided in March", `# decided in March\n    check: "${TOOL}"`)
        .replace('"reversibility"', '"reversibility"\n    check: "test:tests/change.test.tsx"'),
    ),
    after,
  );
  assert.equal(check(dir).status, 0, check(dir).stderr);
  // The pointer is real: a control that shrinks now turns the gate red.
  edit(dir, "src/components/ui/button.tsx", (source) => source.replace('xs: "h-6 ', 'xs: "h-5 '));
  assert.match(check(dir).stderr, /target-size: Button \(size=xs: h-5, 20px\)/);
});

test("the brand colour question shows the colour, not only the variable that points at it", () => {
  const dir = folder(BRAND);
  assert.match(
    adopt(dir, "--dry-run").stdout,
    /source-color: --primary is var\(--brand-blue\) in src\/app\/globals\.css, which is #0246ff\./,
  );
});
