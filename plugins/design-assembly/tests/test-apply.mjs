// Runs the whole path on a throwaway repository: apply, check, apply again, then break things.
// The floor is the real one of the repository this plugin lives in, not a hand-written stand-in.
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { execPath } from "node:process";
import { after, test } from "node:test";
import { fileURLToPath } from "node:url";

import { parseLedger, TOOL } from "../templates/tools/design-assembly/ledger.mjs";
import { withoutBlock } from "../templates/tools/design-assembly/theme.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const PLUGIN = path.resolve(HERE, "..");
const ROOT = path.resolve(PLUGIN, "../..");
const APPLY = path.join(PLUGIN, "scripts/apply.mjs");
const LAYERS = JSON.parse(readFileSync(path.join(PLUGIN, "references/layers.json"), "utf8")).layers;

const made = [];
after(() => made.forEach((dir) => rmSync(dir, { recursive: true, force: true })));

const CHOICES = {
  context: { product_type: "application", conformance_level: "AA" },
  foundations: { source_color: "#0246ff" },
};

function blueprint(change = {}) {
  const layers = {};
  for (const layer of LAYERS) {
    layers[layer.id] = layer.built
      ? { status: "decided", source: "proposed", choice: CHOICES[layer.id], why: "For the test." }
      : { status: "planned" };
  }
  return { version: 1, status: "approved", layers: { ...layers, ...change } };
}

// A fresh repository that has the floor: the stylesheet and the Makefile of this one.
function repository(content = blueprint()) {
  const dir = mkdtempSync(path.join(tmpdir(), "design-assembly-"));
  made.push(dir);
  mkdirSync(path.join(dir, "src"));
  mkdirSync(path.join(dir, "design"));
  const css = withoutBlock(readFileSync(path.join(ROOT, "src/index.css"), "utf8"));
  writeFileSync(path.join(dir, "src/index.css"), css);
  writeFileSync(path.join(dir, "Makefile"), readFileSync(path.join(ROOT, "Makefile"), "utf8"));
  writeFileSync(path.join(dir, "design/blueprint.json"), JSON.stringify(content, null, 2));
  return dir;
}

const run = (script, ...args) => spawnSync(execPath, [script, ...args], { encoding: "utf8" });
const apply = (dir, ...args) => run(APPLY, "--target", dir, ...args);
const check = (dir, ...args) =>
  run(path.join(dir, "tools/design-assembly/check.mjs"), "--target", dir, ...args);
const text = (dir, file) => readFileSync(path.join(dir, file), "utf8");
const edit = (dir, file, change) => {
  const before = text(dir, file);
  const next = change(before);
  assert.notEqual(next, before, `the edit of ${file} changed nothing`);
  writeFileSync(path.join(dir, file), next);
};

test("apply writes its files, the checks pass, and a second run changes nothing", () => {
  const dir = repository();
  const first = apply(dir);
  assert.equal(first.status, 0, first.stderr);
  for (const file of [
    "src/index.css",
    "design/theme.json",
    "design/decisions.yaml",
    "design/decisions/foundations.md",
    "tools/design-assembly/check.mjs",
    "tools/design-assembly/ledger.mjs",
    "mk/design-assembly.mk",
  ]) {
    assert.match(first.stdout, new RegExp(`(create|update)\\s+${file.replaceAll(".", "\\.")}`));
  }
  const checked = check(dir);
  assert.equal(checked.status, 0, checked.stderr);
  const theme = JSON.parse(text(dir, "design/theme.json"));
  const decisions = Object.keys(theme.checks).length;
  const checks = Object.values(theme.checks).flat().length;
  assert.ok(decisions >= 6 && checks >= 9, `${decisions} decisions, ${checks} checks`);
  assert.match(
    checked.stdout,
    new RegExp(
      `${decisions} decisions held by ${checks} checks, each seen failing on a changed copy`,
    ),
  );

  const second = apply(dir);
  assert.equal(second.status, 0, second.stderr);
  const states = second.stdout.split("\n").filter((line) => /^\w+\s+\S+\.\w+$/.test(line));
  assert.ok(states.length >= 7);
  for (const line of states) assert.match(line, /^unchanged /);
});

test("the ledger is the standard one: every row this plugin holds points at its tool, and back", () => {
  const dir = repository();
  assert.equal(apply(dir).status, 0);
  const rows = parseLedger(text(dir, "design/decisions.yaml"));
  const theme = JSON.parse(text(dir, "design/theme.json"));
  const pointed = rows.filter((row) => row.check === TOOL).map((row) => row.id);
  assert.deepEqual(pointed.sort(), Object.keys(theme.checks).sort());
  for (const row of rows) {
    assert.deepEqual(
      Object.keys(row).filter((key) => !["id", "layer", "kind", "source", "check"].includes(key)),
      [],
    );
    if (row.kind === "judgment") assert.equal(row.check, undefined, row.id);
  }

  // A row that points at the tool with nothing behind it is caught...
  edit(
    dir,
    "design/decisions.yaml",
    (yaml) =>
      `${yaml}  - id: made-up\n    layer: foundations\n    kind: standard\n    source: "nowhere"\n    check: "${TOOL}"\n`,
  );
  const orphanRow = check(dir);
  assert.equal(orphanRow.status, 1);
  assert.match(
    orphanRow.stderr,
    /made-up: the ledger points at this tool, which holds no check for it/,
  );

  // ...and so is a decision the tool holds that the ledger no longer lists.
  const other = repository();
  assert.equal(apply(other).status, 0);
  edit(other, "design/decisions.yaml", (yaml) =>
    yaml.replace(/ {2}- id: radius-value\n(?: {4}.*\n)+/, ""),
  );
  const orphanCheck = check(other);
  assert.equal(orphanCheck.status, 1);
  assert.match(
    orphanCheck.stderr,
    /radius-value: held by this tool but not a row of design\/decisions\.yaml/,
  );
});

test("rows another team wrote are kept byte for byte, and only this plugin's rows are touched", () => {
  const dir = repository();
  const theirs = [
    "# Their own header, with a comment the plugin must not lose.",
    "version: 1",
    "decisions:",
    "  - id: raw-controls",
    "    layer: core",
    "    kind: standard",
    '    source: "their component library"',
    "    # a comment inside a row",
    "  - id: radius-value",
    "    layer: foundations",
    "    kind: closed",
    '    source: "an older value"',
    "",
  ].join("\n");
  writeFileSync(path.join(dir, "design/decisions.yaml"), theirs);
  assert.equal(apply(dir).status, 0);
  const merged = text(dir, "design/decisions.yaml");
  assert.ok(merged.startsWith("# Their own header, with a comment the plugin must not lose.\n"));
  assert.match(
    merged,
    / {2}- id: raw-controls\n {4}layer: core\n {4}kind: standard\n {4}source: "their component library"\n {4}# a comment inside a row\n/,
  );
  const rows = parseLedger(merged);
  assert.equal(rows.filter((row) => row.id === "radius-value").length, 1);
  assert.equal(rows.find((row) => row.id === "radius-value").check, TOOL);
  assert.equal(rows[0].id, "raw-controls");
  // The older layer name is read, not refused: the gate still passes, and the rate notes it.
  const rated = check(dir, "--rate");
  assert.equal(rated.status, 0, rated.stderr);
  assert.match(rated.stdout, /note: older layer name, raw-controls: layer 'core'/);
  assert.match(rated.stdout, /no check standard raw-controls/);
  assert.match(apply(dir).stdout, /^unchanged design\/decisions\.yaml$/m);
});

test("tool data laid out differently by a formatter is left alone; changed data is rewritten", () => {
  const dir = repository();
  assert.equal(apply(dir).status, 0);
  const file = path.join(dir, "design/theme.json");
  const compact = `${JSON.stringify(JSON.parse(readFileSync(file, "utf8")))}\n`;
  writeFileSync(file, compact);
  const again = apply(dir);
  assert.match(again.stdout, /^unchanged design\/theme\.json$/m);
  assert.equal(readFileSync(file, "utf8"), compact);

  writeFileSync(file, compact.replace('"version":1', '"version":0'));
  assert.match(apply(dir).stdout, /^update\s+design\/theme\.json$/m);
});

test("a preview works before approval, shows the numbers, and writes nothing", () => {
  const dir = repository({ ...blueprint(), status: "designing" });
  const result = apply(dir, "--dry-run");
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /^light: primary oklch\([^)]+\), (\d+\.\d\d):1 on the background/m);
  assert.match(result.stdout, /^dark: primary oklch\([^)]+\), (\d+\.\d\d):1 on the background/m);
  for (const [, ratio] of result.stdout.matchAll(/(\d+\.\d\d):1 on the/g)) {
    assert.ok(Number(ratio) >= 4.5, `a previewed ratio of ${ratio}:1 is below the threshold`);
  }
  assert.match(result.stdout, /create\s+design\/decisions\.yaml/);
  assert.match(result.stdout, /preview only: nothing was written/);
  assert.doesNotMatch(text(dir, "src/index.css"), /design-assembly/);
  assert.notEqual(check(dir).status, 0);

  const write = apply(dir);
  assert.equal(write.status, 2);
  assert.match(write.stderr, /status must be "approved" before applying/);

  const early = apply(
    repository({ ...blueprint({ foundations: { status: "pending" } }), status: "designing" }),
    "--dry-run",
  );
  assert.equal(early.status, 2);
  assert.match(early.stderr, /cannot be previewed:\n {2}foundations: must be decided/);
});

test("--help prints the options and exits cleanly", () => {
  const result = run(APPLY, "--help");
  assert.equal(result.status, 0);
  assert.match(result.stdout, /--dry-run {2}Preview without writing/);
});

test("the determinism rate is read from the ledger, and only a person's call goes unchecked", () => {
  const dir = repository();
  assert.equal(apply(dir).status, 0);
  const rows = parseLedger(text(dir, "design/decisions.yaml"));
  const held = rows.filter((row) => row.check).length;
  const result = check(dir, "--rate");
  assert.equal(result.status, 0, result.stderr);
  assert.ok(held > 0 && held < rows.length);
  assert.match(result.stdout, new RegExp(`determinism rate: ${held}/${rows.length} `));
  assert.match(result.stdout, new RegExp(`${held} held and re-run here, 0 claimed`));
  const unchecked = result.stdout
    .split("\n")
    .filter((line) => /^\s+(recorded|no check) /.test(line));
  assert.equal(unchecked.length, rows.length - held);
  for (const line of unchecked) assert.match(line, /recorded judgment /);
});

test("editing the generated block by hand makes the check fail", () => {
  const dir = repository();
  assert.equal(apply(dir).status, 0);
  edit(dir, "src/index.css", (css) =>
    css.replace(/(--palette-primary-50: oklch\()[\d.]+/, "$10.5"),
  );
  const result = check(dir);
  assert.equal(result.status, 1);
  assert.match(result.stderr, /tonal-palette: the generated block is not what/);
});

test("a later rule that lowers the contrast makes the check fail, and the rate drop", () => {
  const dir = repository();
  assert.equal(apply(dir).status, 0);
  edit(dir, "src/index.css", (css) => `${css}\n:root {\n  --primary: oklch(0.9 0.05 264);\n}\n`);
  const result = check(dir, "--rate");
  assert.equal(result.status, 1);
  assert.match(result.stderr, /color-contrast: --primary on --background in :root/);
  assert.match(result.stderr, /below 4\.5:1/);
  assert.match(result.stdout, /FAILING {2}formula {2}color-contrast/);
});

test("type scale, spacing and shape: each decision fails when the stylesheet stops holding it", () => {
  const modular = {
    status: "decided",
    source: "user",
    why: "For the test.",
    choice: {
      ...CHOICES.foundations,
      type_scale: "modular",
      type_ratio: "major-third",
      spacing_unit: "4px",
      corner_radius: "small",
    },
  };
  const dir = repository(blueprint({ foundations: modular }));
  const applied = apply(dir);
  assert.equal(applied.status, 0, applied.stderr);
  assert.doesNotMatch(applied.stdout, /decided before/);
  assert.match(
    applied.stdout,
    /type scale: modular, size\/line height in px: xs 10\/16, sm 13\/20, base 16\/24/,
  );
  assert.match(
    applied.stdout,
    /note: text-xs is 10px, smaller than the floor's smallest size \(12px\)/,
  );
  assert.match(applied.stdout, /corner radius: 0\.5rem/);
  assert.equal(check(dir).status, 0);
  assert.match(text(dir, "src/index.css"), /--radius: 0\.5rem;/);
  assert.match(text(dir, "src/index.css"), /--text-base: 1rem;/);
  const row = parseLedger(text(dir, "design/decisions.yaml")).find(
    (r) => r.id === "type-scale-values",
  );
  assert.equal(row.kind, "formula");
  assert.equal(row.source, "modular scale, major-third");

  const cases = [
    [
      ":root {\n  --text-lg: 1rem;\n}\n",
      /type-scale-values: text-lg \(16px\) is not larger than text-base/,
    ],
    [":root {\n  --spacing: 0.5rem;\n}\n", /spacing-values: --spacing declared in src\/index\.css/],
    [
      ":root {\n  --radius: 2rem;\n}\n",
      /radius-value: --radius in :root is 2rem, not the decided 0\.5rem/,
    ],
  ];
  for (const [rule, message] of cases) {
    const broken = repository(blueprint({ foundations: modular }));
    assert.equal(apply(broken).status, 0);
    edit(broken, "src/index.css", (css) => `${css}\n${rule}`);
    const result = check(broken);
    assert.equal(result.status, 1, `${rule} was not caught`);
    assert.match(result.stderr, message);
  }
});

test("the standard type scale is held by keeping the floor's variables out of the stylesheet", () => {
  const dir = repository();
  assert.equal(apply(dir).status, 0);
  edit(dir, "src/index.css", (css) => `${css}\n:root {\n  --text-sm: 0.8rem;\n}\n`);
  const result = check(dir);
  assert.equal(result.status, 1);
  assert.match(result.stderr, /type-scale-values: --text-sm declared in src\/index\.css/);
});

test("a blueprint decided before type scale and shape existed keeps the floor's values, and says so", () => {
  const dir = repository();
  const result = apply(dir);
  assert.equal(result.status, 0, result.stderr);
  assert.match(
    result.stdout,
    /note: foundations was decided before type_scale, spacing_unit, corner_radius could be chosen/,
  );
  assert.match(text(dir, "src/index.css"), /--radius: 0\.625rem;/);
  const record = text(dir, "design/decisions/foundations.md");
  assert.match(record, /- corner radius: `floor` \(not asked: the floor's value\)/);
  assert.doesNotMatch(record, /modular scale/);
  assert.match(record, /- `color-contrast`: formula, checked by this plugin's tool/);
});

test("a gate that cannot fail is reported", () => {
  const dir = repository();
  assert.equal(apply(dir).status, 0);
  edit(dir, "mk/design-assembly.mk", (mk) => mk.replace("\t@node tools", "\t-@node tools"));
  const result = check(dir);
  assert.equal(result.status, 1);
  assert.match(result.stderr, /checks-in-gate: .*cannot fail/);
});

test("the check still runs when the repository is reached through a link", () => {
  const dir = repository();
  assert.equal(apply(dir).status, 0);
  const link = `${dir}-link`;
  symlinkSync(dir, link);
  made.push(link);
  const result = run(path.join(link, "tools/design-assembly/check.mjs"), "--target", link);
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /decisions held by \d+ checks, each seen failing on a changed copy/);
});

test("a repository without the floor is refused", () => {
  const dir = mkdtempSync(path.join(tmpdir(), "design-assembly-"));
  made.push(dir);
  const result = apply(dir);
  assert.equal(result.status, 2);
  assert.match(result.stderr, /no design floor to build on/);
});

test("a blueprint that is not approved, or misses or mistypes a choice, is refused with the reason", () => {
  const bad = blueprint({
    foundations: { status: "decided", source: "user", choice: { source_color: "blue" }, why: "x" },
  });
  const colour = apply(repository(bad));
  assert.equal(colour.status, 2);
  assert.match(colour.stderr, /source color must be a #rrggbb colour/);

  const draft = apply(repository({ ...blueprint(), status: "designing" }));
  assert.equal(draft.status, 2);
  assert.match(draft.stderr, /status must be "approved"/);

  const missing = blueprint({
    context: {
      status: "decided",
      source: "user",
      why: "x",
      choice: { product_type: "application" },
    },
  });
  const level = apply(repository(missing));
  assert.equal(level.status, 2);
  assert.match(level.stderr, /context: no conformance level/);

  const old = blueprint({ accessibility: { status: "decided" } });
  delete old.layers.patterns;
  const shape = apply(repository(old));
  assert.equal(shape.status, 2);
  assert.match(shape.stderr, /patterns: missing/);
});
