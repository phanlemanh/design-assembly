// The audit on throwaway repositories in each starting state: nothing, a floor, a floor that is
// bypassed, another team's ledger, and one the guide has been applied to.
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { execPath } from "node:process";
import { after, test } from "node:test";
import { fileURLToPath } from "node:url";

import { inventory, report } from "../scripts/inventory.mjs";
import { withoutBlock } from "../templates/tools/design-assembly/theme.mjs";

const PLUGIN = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const ROOT = path.resolve(PLUGIN, "../..");
const reference = (file) => JSON.parse(readFileSync(path.join(PLUGIN, "references", file), "utf8"));
const LAYERS = reference("layers.json").layers;
const STANDARD = reference("standard-decisions.json");
const { tiers } = reference("tiers.json");
const vocabulary = reference("vocabulary.json");

const made = [];
after(() => made.forEach((dir) => rmSync(dir, { recursive: true, force: true })));

const put = (dir, file, text) => {
  mkdirSync(path.dirname(path.join(dir, file)), { recursive: true });
  writeFileSync(path.join(dir, file), text);
};
const text = (dir, file) => readFileSync(path.join(dir, file), "utf8");
const empty = () => {
  const dir = mkdtempSync(path.join(tmpdir(), "design-audit-"));
  made.push(dir);
  return dir;
};
// A repository with the real floor of this one: its stylesheet without the generated block.
function floor() {
  const dir = empty();
  put(dir, "src/index.css", withoutBlock(text(ROOT, "src/index.css")));
  put(dir, "Makefile", text(ROOT, "Makefile"));
  return dir;
}
// The same, after the guide was applied with every built layer decided.
function applied() {
  const dir = floor();
  const choices = {
    context: { product_type: "application", conformance_level: "AA" },
    foundations: {
      source_color: "#0246ff",
      type_scale: "standard",
      spacing_unit: "4px",
      corner_radius: "small",
    },
  };
  const layers = Object.fromEntries(
    LAYERS.map((layer) => [
      layer.id,
      layer.built
        ? { status: "decided", source: "proposed", choice: choices[layer.id], why: "For the test." }
        : { status: "planned" },
    ]),
  );
  put(dir, "design/blueprint.json", JSON.stringify({ version: 1, status: "approved", layers }));
  const run = spawnSync(execPath, [path.join(PLUGIN, "scripts/apply.mjs"), "--target", dir]);
  assert.equal(run.status, 0, String(run.stderr));
  return dir;
}
const state = (result, id) => result.decisions.find((row) => row.id === id).state;
const tier = (result, id) => result.tiers.find((entry) => entry.id === id);

test("a folder with nothing in it: nothing is answered and no tier is reached", () => {
  const result = inventory(empty());
  assert.equal(result.decisions.length, STANDARD.decisions.length);
  assert.deepEqual([...new Set(result.decisions.map((row) => row.state))].sort(), [
    "no-row",
    "undecided",
  ]);
  assert.equal(result.coverage.answered, 0);
  assert.equal(result.ledger, null);
  assert.equal(tier(result, "audit").state, "missing");
  assert.match(report(result), /stylesheets: none found under src\//);
  assert.match(report(result), /ledger design\/decisions\.yaml: none/);
});

test("a floor with no ledger and no lint: its scales are decided, and nothing holds them", () => {
  const result = inventory(floor());
  for (const id of ["color-role", "type-scale", "spacing", "radius"]) {
    assert.equal(state(result, id), "not-held", id);
  }
  assert.equal(state(result, "source-color"), "recorded");
  assert.equal(state(result, "product-type"), "no-row");
  assert.equal(result.coverage.held, 0);
  assert.equal(tier(result, "audit").state, "reached");
  assert.equal(tier(result, "foundations").state, "missing");
});

test("after the guide is applied its checks are re-run, and those decisions count as held", () => {
  const dir = applied();
  const result = inventory(dir);
  for (const id of [
    "tonal-palette",
    "color-contrast",
    "type-scale-values",
    "radius-value",
    "checks-in-gate",
  ]) {
    assert.equal(state(result, id), "held", id);
  }
  assert.equal(state(result, "product-type"), "recorded");
  assert.equal(state(result, "conformance-level"), "recorded");
  assert.ok(result.coverage.held >= 2);
  assert.deepEqual(result.ledger.own_decisions, []);

  // A rule that breaks a decision turns "held" into "failing": the checks are run, not trusted.
  put(dir, "src/index.css", `${text(dir, "src/index.css")}\n:root {\n  --radius: 3rem;\n}\n`);
  assert.equal(state(inventory(dir), "radius-value"), "failing");
});

test("values written around the system are counted, and vendor components are left out", () => {
  const dir = applied();
  const bad =
    'export const Bad = () => <p className="text-[13px] bg-[#123456] rounded-[7px] p-[5px]" />;\n';
  put(dir, "src/Bad.tsx", bad);
  put(dir, "src/components/ui/vendor.tsx", bad);
  const result = inventory(dir);
  for (const id of ["color-role", "type-scale", "spacing", "radius"]) {
    const row = result.decisions.find((entry) => entry.id === id);
    assert.equal(row.state, "bypassed", id);
    assert.equal(row.bypassed, 1, id);
    assert.deepEqual(row.bypassed_in, ["src/Bad.tsx (1)"]);
  }
  assert.match(
    report(result),
    /BYPASSED\s+radius: .*\n\s+1 place\(s\) go around it: src\/Bad\.tsx \(1\)/,
  );
});

test("another team's ledger: a row that names a check is claimed, a broken pointer is failing", () => {
  const dir = floor();
  put(
    dir,
    "eslint.config.js",
    'export default [{ rules: { "team/no-hardcoded-color": "error" } }];\n',
  );
  const ledger = [
    "version: 1",
    "decisions:",
    "  - id: color-role",
    "    layer: foundations",
    "    kind: standard",
    '    source: "team variables"',
    '    check: "eslint:team/no-hardcoded-color"',
    "  - id: radius",
    "    layer: foundations",
    "    kind: standard",
    '    source: "team radius"',
    "  - id: raw-controls",
    "    layer: core",
    "    kind: standard",
    '    source: "team library"',
    '    check: "test:tests/missing.test.ts"',
    "  - id: wcag-aa",
    "    layer: conformance",
    "    kind: standard",
    '    source: "WCAG 2.2 AA via axe"',
    "  - id: team-only-rule",
    "    layer: governance",
    "    kind: closed",
    '    source: "team handbook"',
    "",
  ].join("\n");
  put(dir, "design/decisions.yaml", ledger);
  const result = inventory(dir);
  assert.equal(state(result, "color-role"), "claimed");
  assert.equal(state(result, "radius"), "not-held");
  assert.equal(state(result, "raw-controls"), "failing");
  assert.equal(state(result, "conformance-level"), "recorded");
  assert.deepEqual(result.ledger.own_decisions, ["team-only-rule"]);
  assert.equal(result.ledger.total, 5);
  assert.equal(result.ledger.automatic, 1);
  assert.deepEqual(result.ledger.old_layer_names, [
    "raw-controls: layer 'core'",
    "wcag-aa: layer 'conformance'",
  ]);
  assert.equal(result.coverage.held, 0);
  assert.match(
    report(result),
    /FAILING\s+raw-controls: .*\n\s+by test:tests\/missing\.test\.ts: no such file/,
  );
});

test("a tier is reached only with every core decision answered and its artifact in place", () => {
  const dir = applied();
  const before = tier(inventory(dir), "foundations");
  assert.equal(before.state, "missing");
  const open = before.needs.find((need) => need.missing !== undefined);
  assert.ok(open.missing.length > 0);
  assert.ok(
    open.missing.every((line) => / (no-row|not-held|undecided)$/.test(line)),
    open.missing.join("; "),
  );

  // Answer what is open through the ledger, with rows that name checks the audit can resolve.
  put(
    dir,
    "eslint.config.js",
    'export default [{ rules: { "x/a": 2, "x/b": 2, "x/c": 2, "x/d": 2, "x/e": 2 } }];\n',
  );
  const rows = ["color-role", "color-palette", "type-scale", "spacing", "radius"].map(
    (id, index) =>
      `  - id: ${id}\n    layer: foundations\n    kind: standard\n    source: "team"\n    check: "eslint:x/${"abcde"[index]}"\n`,
  );
  put(dir, "design/decisions.yaml", `${text(dir, "design/decisions.yaml")}${rows.join("")}`);
  const answered = tier(inventory(dir), "foundations");
  assert.deepEqual(
    answered.needs.filter((need) => !need.ok).map((need) => need.what),
    ["design/tokens.json"],
  );

  put(dir, "_acceptance/config.yaml", "design_floor:\n  tokens: design/brand.tokens.json\n");
  assert.deepEqual(
    tier(inventory(dir), "foundations")
      .needs.filter((need) => !need.ok)
      .map((need) => need.what),
    ["design/brand.tokens.json"],
  );
  put(dir, "design/brand.tokens.json", "{}\n");
  // Complete, but five decisions rest on lint rules the audit did not run: claimed, not reached.
  assert.equal(tier(inventory(dir), "foundations").state, "claimed");
  assert.equal(tier(inventory(dir), "core-components").state, "missing");
});

test("the same repository gives the same report, and the audit writes nothing", () => {
  const dir = applied();
  spawnSync("git", ["-C", dir, "init", "-q"]);
  spawnSync("git", ["-C", dir, "add", "-A"]);
  const first = JSON.stringify(inventory(dir));
  const run = spawnSync(
    execPath,
    [path.join(PLUGIN, "scripts/inventory.mjs"), "--target", dir, "--json"],
    { encoding: "utf8" },
  );
  assert.equal(run.status, 0, run.stderr);
  assert.equal(JSON.stringify(JSON.parse(run.stdout)), first);
  assert.equal(JSON.stringify(inventory(dir)), first);
  const changed = spawnSync("git", ["-C", dir, "status", "--porcelain"], {
    encoding: "utf8",
  }).stdout;
  assert.deepEqual(
    changed.split("\n").filter((line) => line && !line.startsWith("A ")),
    [],
  );
});

test("tiers, layers and standard decisions are one consistent set, named with vocabulary terms", () => {
  const known = new Set(vocabulary.terms.map((entry) => entry.term));
  for (const entry of tiers) {
    for (const term of entry.terms)
      assert.ok(known.has(term), `${entry.id}: "${term}" is not a term`);
    assert.ok(entry.gives.length > 0 && entry.needs.length > 0, entry.id);
  }
  assert.equal(tiers[0].id, "audit");
  const levels = tiers.map((entry) => entry.maps_to).filter(Boolean);
  assert.deepEqual(levels, [...levels].sort());

  const tierIds = new Set(tiers.map((entry) => entry.id));
  const ids = new Set();
  for (const decision of STANDARD.decisions) {
    assert.ok(!ids.has(decision.id), `${decision.id} is listed twice`);
    ids.add(decision.id);
    assert.ok(decision.layer in STANDARD.layers, `${decision.id}: unknown layer ${decision.layer}`);
    assert.ok(tierIds.has(decision.tier ?? STANDARD.layers[decision.layer].tier), decision.id);
    assert.ok(["standard", "formula", "closed", "judgment"].includes(decision.kind), decision.id);
    assert.ok(decision.question.endsWith("?"), decision.id);
    assert.ok(decision.sources.length > 0, decision.id);
    for (const source of decision.sources)
      assert.ok(source in STANDARD.sources, `${decision.id}: ${source}`);
  }
  // Every tier above the audit has core decisions to answer, or it could be reached by doing nothing.
  for (const entry of tiers.slice(1)) {
    const core = STANDARD.decisions.filter(
      (d) => (d.tier ?? STANDARD.layers[d.layer].tier) === entry.id && d.sources.length >= 2,
    );
    assert.ok(core.length > 0, `${entry.id} has no core decision`);
  }
});
