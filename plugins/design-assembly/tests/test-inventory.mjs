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

import { inventory, readYamlLedger, report } from "../scripts/inventory.mjs";
import { withoutBlock } from "../templates/tools/design-assembly/theme.mjs";

const PLUGIN = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const ROOT = path.resolve(PLUGIN, "../..");
const read = (file) => JSON.parse(readFileSync(path.join(PLUGIN, file), "utf8"));
const LAYERS = read("references/layers.json").layers;
const { tiers } = read("references/tiers.json");
const vocabulary = read("references/vocabulary.json");

const made = [];
after(() => made.forEach((dir) => rmSync(dir, { recursive: true, force: true })));

const put = (dir, file, text) => {
  mkdirSync(path.dirname(path.join(dir, file)), { recursive: true });
  writeFileSync(path.join(dir, file), text);
};
const empty = () => {
  const dir = mkdtempSync(path.join(tmpdir(), "design-audit-"));
  made.push(dir);
  return dir;
};
// A repository with the real floor of this one: its stylesheet without the generated block.
function floor() {
  const dir = empty();
  put(dir, "src/index.css", withoutBlock(readFileSync(path.join(ROOT, "src/index.css"), "utf8")));
  put(dir, "Makefile", readFileSync(path.join(ROOT, "Makefile"), "utf8"));
  return dir;
}
// The same, after the guide was applied with every built layer decided.
function applied() {
  const dir = floor();
  const choices = {
    context: { product_type: "application" },
    accessibility: { conformance_level: "AA" },
    foundations: {
      source_color: "#0246ff",
      type_scale: "standard",
      spacing_unit: "4px",
      corner_radius: "small",
    },
    conformance: { gate: "make-check" },
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

test("a folder with nothing in it: every decision is undecided and no tier is reached", () => {
  const result = inventory(empty());
  assert.deepEqual([...new Set(result.decisions.map((row) => row.state))], ["undecided"]);
  assert.deepEqual(result.rate, { held: 0, claimed: 0, total: result.decisions.length });
  assert.equal(tier(result, "audit").state, "missing");
  assert.match(report(result), /stylesheets: none found under src\//);
});

test("a floor with no ledger and no lint: decided, but nothing holds it", () => {
  const result = inventory(floor());
  for (const id of ["color-role", "type-scale", "spacing-scale", "shape"]) {
    assert.equal(state(result, id), "decided-not-held", id);
  }
  assert.equal(state(result, "product-type"), "undecided");
  assert.equal(result.rate.held, 0);
  assert.equal(tier(result, "audit").state, "reached");
  assert.equal(tier(result, "foundations").state, "missing");
});

test("after the guide is applied the checks are re-run, and the decisions count as held", () => {
  const dir = applied();
  const result = inventory(dir);
  for (const id of ["color-role", "type-scale", "spacing-scale", "shape"]) {
    assert.equal(state(result, id), "held", id);
  }
  assert.equal(state(result, "product-type"), "recorded");
  assert.equal(state(result, "conformance-level"), "recorded");
  assert.deepEqual(result.rate, { held: 4, claimed: 0, total: 6 });

  // A rule that breaks a decision turns "held" back into "not held": the checks are run, not trusted.
  put(
    dir,
    "src/index.css",
    `${readFileSync(path.join(dir, "src/index.css"), "utf8")}\n:root {\n  --radius: 3rem;\n}\n`,
  );
  assert.equal(state(inventory(dir), "shape"), "decided-not-held");
});

test("values written around the system are counted, and vendor components are left out", () => {
  const dir = applied();
  const bad =
    'export const Bad = () => <p className="text-[13px] bg-[#123456] rounded-[7px] p-[5px]" />;\n';
  put(dir, "src/Bad.tsx", bad);
  put(dir, "src/components/ui/vendor.tsx", bad);
  const result = inventory(dir);
  for (const id of ["color-role", "type-scale", "spacing-scale", "shape"]) {
    const row = result.decisions.find((entry) => entry.id === id);
    assert.equal(row.state, "bypassed", id);
    assert.equal(row.bypassed, 1, id);
    assert.deepEqual(row.bypassed_in, ["src/Bad.tsx (1)"]);
  }
  assert.equal(result.rate.held, 0);
  assert.match(
    report(result),
    /BYPASSED\s+shape.*\n\s+1 place\(s\) go around it: src\/Bad\.tsx \(1\)/,
  );
});

test("another team's ledger is read: a decision that names a check is claimed, not re-run", () => {
  const dir = floor();
  const ledger = [
    "version: 1",
    "decisions:",
    "  - id: color-role",
    "    layer: foundations",
    "    kind: standard",
    '    check: "eslint:team/no-hardcoded-color"',
    "  - id: radius",
    "    layer: foundations",
    "    kind: standard",
    '    check: ""',
    "  - id: a11y",
    "    layer: accessibility",
    '    source: "WCAG 2.2 AA"',
    "",
  ].join("\n");
  put(dir, "design/decisions.yaml", ledger);
  assert.equal(readYamlLedger(ledger).length, 3);
  const result = inventory(dir);
  assert.equal(state(result, "color-role"), "claimed");
  assert.equal(state(result, "shape"), "decided-not-held");
  assert.equal(state(result, "conformance-level"), "recorded");
  assert.deepEqual(result.ledgers["design/decisions.yaml"], { decisions: 3, with_check: 1 });
  assert.equal(result.rate.claimed, 1);
  assert.equal(result.rate.held, 0);
});

test("foundations is reached only when the tokens file sits where the kit reads it", () => {
  const dir = applied();
  const before = tier(inventory(dir), "foundations");
  assert.equal(before.state, "missing");
  assert.deepEqual(
    before.needs.filter((need) => !need.ok).map((need) => need.what),
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
  assert.equal(tier(inventory(dir), "foundations").state, "reached");
  // A higher tier is never called reached in this version: its artifacts are only seen.
  put(dir, "design/component-registry.json", "{}\n");
  assert.equal(tier(inventory(dir), "core-components").state, "present");
});

test("the same repository gives the same report, and the audit writes nothing", () => {
  const dir = applied();
  const listing = () => spawnSync("git", ["-C", dir, "status", "--porcelain"]).stdout;
  const first = JSON.stringify(inventory(dir));
  const run = spawnSync(
    execPath,
    [path.join(PLUGIN, "scripts/inventory.mjs"), "--target", dir, "--json"],
    { encoding: "utf8" },
  );
  assert.equal(run.status, 0, run.stderr);
  assert.equal(JSON.stringify(JSON.parse(run.stdout)), first);
  assert.equal(JSON.stringify(inventory(dir)), first);
  assert.equal(String(listing()), String(listing()));
  assert.ok(!readFileSync(path.join(dir, "src/index.css"), "utf8").includes("audit"));
});

test("every tier is named with vocabulary terms and maps to the architecture levels in order", () => {
  const known = new Set(vocabulary.terms.map((entry) => entry.term));
  for (const entry of tiers) {
    assert.ok(entry.terms.length > 0, entry.id);
    for (const term of entry.terms)
      assert.ok(known.has(term), `${entry.id}: "${term}" is not a term`);
    assert.ok(entry.gives.length > 0 && entry.needs.length > 0, entry.id);
  }
  const levels = tiers.map((entry) => entry.maps_to).filter(Boolean);
  assert.deepEqual(levels, [...levels].sort());
  assert.equal(tiers[0].id, "audit");
});
