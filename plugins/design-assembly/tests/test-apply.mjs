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

import { withoutBlock } from "../templates/tools/design-assembly/theme.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const PLUGIN = path.resolve(HERE, "..");
const ROOT = path.resolve(PLUGIN, "../..");
const APPLY = path.join(PLUGIN, "scripts/apply.mjs");
const LAYERS = JSON.parse(readFileSync(path.join(PLUGIN, "references/layers.json"), "utf8")).layers;

const made = [];
after(() => made.forEach((dir) => rmSync(dir, { recursive: true, force: true })));

const CHOICES = {
  context: { product_type: "application" },
  accessibility: { conformance_level: "AA" },
  foundations: { source_color: "#0246ff" },
  conformance: { gate: "make-check" },
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
const edit = (dir, file, change) => {
  const full = path.join(dir, file);
  const before = readFileSync(full, "utf8");
  const next = change(before);
  assert.notEqual(next, before, `the edit of ${file} changed nothing`);
  writeFileSync(full, next);
};

test("apply writes its files, the checks pass, and a second run changes nothing", () => {
  const dir = repository();
  const first = apply(dir);
  assert.equal(first.status, 0, first.stderr);
  for (const file of [
    "src/index.css",
    "design/decisions.json",
    "design/decisions/foundations.md",
    "tools/design-assembly/check.mjs",
    "mk/design-assembly.mk",
  ]) {
    assert.match(first.stdout, new RegExp(`(create|update)\\s+${file.replaceAll(".", "\\.")}`));
  }
  const checked = check(dir);
  assert.equal(checked.status, 0, checked.stderr);
  assert.match(checked.stdout, /6 checks ok, each seen failing on a changed copy/);

  const second = apply(dir);
  assert.equal(second.status, 0, second.stderr);
  const states = second.stdout.split("\n").filter((line) => /^\w+\s+\S+\.\w+$/.test(line));
  assert.ok(states.length >= 5);
  for (const line of states) assert.match(line, /^unchanged /);
});

test("a dry run reports what it would do and writes nothing", () => {
  const dir = repository();
  const result = apply(dir, "--dry-run");
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /create\s+design\/decisions\.json/);
  assert.equal(check(dir).status !== 0, true);
  assert.doesNotMatch(readFileSync(path.join(dir, "src/index.css"), "utf8"), /design-assembly/);
});

test("the determinism rate counts only decisions held by a check", () => {
  const dir = repository();
  assert.equal(apply(dir).status, 0);
  const ledger = JSON.parse(readFileSync(path.join(dir, "design/decisions.json"), "utf8"));
  const held = ledger.decisions.filter((decision) => decision.check).length;
  const result = check(dir, "--rate");
  assert.equal(result.status, 0, result.stderr);
  assert.ok(held > 0 && held < ledger.decisions.length);
  assert.match(result.stdout, new RegExp(`determinism rate: ${held}/${ledger.decisions.length} `));
  assert.match(result.stdout, /no check\s+judgment\s+foundations\.source-color/);
});

test("editing the generated block by hand makes the check fail", () => {
  const dir = repository();
  assert.equal(apply(dir).status, 0);
  edit(dir, "src/index.css", (css) =>
    css.replace(/(--palette-primary-50: oklch\()[\d.]+/, "$10.5"),
  );
  const result = check(dir);
  assert.equal(result.status, 1);
  assert.match(result.stderr, /foundations\.tonal-palette: the generated block is not what/);
});

test("a later rule that lowers the contrast makes the check fail, and the rate drop", () => {
  const dir = repository();
  assert.equal(apply(dir).status, 0);
  edit(dir, "src/index.css", (css) => `${css}\n:root {\n  --primary: oklch(0.9 0.05 264);\n}\n`);
  const result = check(dir, "--rate");
  assert.equal(result.status, 1);
  assert.match(result.stderr, /color-role\.primary\.light: --primary on --background in :root/);
  assert.match(result.stderr, /below 4\.5:1/);
  assert.match(result.stdout, /FAILING\s+formula\s+foundations\.color-role\.primary\.light/);
});

test("a gate that cannot fail is reported", () => {
  const dir = repository();
  assert.equal(apply(dir).status, 0);
  edit(dir, "mk/design-assembly.mk", (mk) => mk.replace("\t@node tools", "\t-@node tools"));
  const result = check(dir);
  assert.equal(result.status, 1);
  assert.match(result.stderr, /conformance\.gate: .*cannot fail/);
});

test("the check still runs when the repository is reached through a link", () => {
  const dir = repository();
  assert.equal(apply(dir).status, 0);
  const link = `${dir}-link`;
  symlinkSync(dir, link);
  made.push(link);
  const result = run(path.join(link, "tools/design-assembly/check.mjs"), "--target", link);
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /checks ok, each seen failing on a changed copy/);
});

test("a repository without the floor is refused", () => {
  const dir = mkdtempSync(path.join(tmpdir(), "design-assembly-"));
  made.push(dir);
  const result = apply(dir);
  assert.equal(result.status, 2);
  assert.match(result.stderr, /no design floor to build on/);
});

test("a blueprint that is not approved, or names a bad colour, is refused with the reason", () => {
  const bad = blueprint({
    foundations: {
      status: "decided",
      source: "user",
      choice: { source_color: "blue" },
      why: "x",
    },
  });
  const colour = apply(repository(bad));
  assert.equal(colour.status, 2);
  assert.match(colour.stderr, /source color must be a #rrggbb colour/);

  const draft = apply(repository({ ...blueprint(), status: "designing" }));
  assert.equal(draft.status, 2);
  assert.match(draft.stderr, /status must be "approved"/);

  const missing = blueprint({ accessibility: { status: "decided", source: "user", why: "x" } });
  const level = apply(repository(missing));
  assert.equal(level.status, 2);
  assert.match(level.stderr, /accessibility: no conformance level/);
});
