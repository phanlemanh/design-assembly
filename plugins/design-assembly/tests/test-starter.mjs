// Laying the ledgers without asking anyone: what Repo Standards calls once a repository has its
// floor. On a throwaway repository with the floor of the repository this plugin lives in, its
// screens, a component and the floor's browser test, `adopt --starter` writes every ledger the
// contract says a repository has from birth, asks nothing, leaves each person's call on the
// waiting list, and leaves the guide free to write over what came from the floor.
import "./helpers/own-cores.mjs";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { execPath } from "node:process";
import { after, test } from "node:test";
import { fileURLToPath } from "node:url";

import { BORN, LEDGERS, missingAtBirth } from "../templates/tools/design-assembly/contract.mjs";
import { withoutBlock } from "../templates/tools/design-assembly/theme.mjs";
import { blueprint, own, REGISTRY, SOURCE } from "./helpers/guided-repo.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const PLUGIN = path.resolve(HERE, "..");
const ADOPT = path.join(PLUGIN, "scripts/adopt.mjs");
const APPLY = path.join(PLUGIN, "scripts/apply.mjs");
const STATUS = path.join(PLUGIN, "scripts/status.mjs");

const made = [];
after(() => made.forEach((dir) => rmSync(dir, { recursive: true, force: true })));

function folder(files) {
  const dir = mkdtempSync(path.join(tmpdir(), "design-assembly-starter-"));
  made.push(dir);
  for (const [file, content] of Object.entries(files)) {
    mkdirSync(path.dirname(path.join(dir, file)), { recursive: true });
    writeFileSync(path.join(dir, file), content);
  }
  return dir;
}

const BUTTON = [
  'import * as React from "react";',
  "",
  'export function Button(props: React.ComponentProps<"button">) {',
  "  return <button {...props} />;",
  "}",
  "",
].join("\n");

// A repository the way Repo Standards leaves it once the floor is laid, before any guide ran: the
// floor's stylesheet, gate, lint and guards, its screens, one component of the library and the
// floor's browser test with the routes it opens.
function born(extra = {}) {
  return folder({
    "src/index.css": withoutBlock(own("src/index.css")),
    Makefile: own("Makefile"),
    "eslint.config.js": own("eslint.config.js"),
    "tools/design_guards.mjs": own("tools/design_guards.mjs"),
    "mk/design.mk": own("mk/design.mk"),
    "design/terms.json": own("design/terms.json"),
    "tests/e2e/floor.spec.ts": own("tests/e2e/floor.spec.ts"),
    "tests/e2e/routes.ts": 'export const ROUTES = ["/", "/archive"];\n',
    "package.json": JSON.stringify({ devDependencies: { "@axe-core/playwright": "^4.0.0" } }),
    "src/screens.ts": REGISTRY,
    "src/pages/List.tsx": SOURCE,
    "src/pages/Archive.tsx": SOURCE,
    "src/components/ui/button.tsx": BUTTON,
    ...extra,
  });
}

const run = (script, ...args) => spawnSync(execPath, [script, ...args], { encoding: "utf8" });
const starter = (dir, ...args) => run(ADOPT, "--target", dir, "--starter", ...args);
const check = (dir) => run(path.join(dir, "tools/design-assembly/check.mjs"), "--target", dir);
const text = (dir, file) => readFileSync(path.join(dir, file), "utf8");

test("the contract says of every ledger whether a repository has it from birth", () => {
  for (const [kind, ledger] of Object.entries(LEDGERS)) {
    assert.ok(Object.values(BORN).includes(ledger.born), `${kind}: born is ${ledger.born}`);
  }
  // The ones a person's first entry brings: a block taken in, a data model's columns, a part, an
  // answer of the guide, a source, a page about a kind of screen.
  const later = Object.keys(LEDGERS).filter((kind) => LEDGERS[kind].born === BORN.firstEntry);
  assert.deepEqual(later.sort(), [
    "blueprint",
    "columns",
    "conform",
    "intake",
    "parts",
    "screen-kinds",
    "sources",
  ]);
});

test("the page of the contract says of each ledger what the contract says", () => {
  const page = readFileSync(path.join(PLUGIN, "references/contract.md"), "utf8");
  for (const [kind, ledger] of Object.entries(LEDGERS)) {
    const said = ledger.born === BORN.floor ? "yes" : "first entry";
    assert.match(page, new RegExp(`\\| \`${kind}\`[^\\n]*\\| ${said} +\\|`), kind);
  }
});

test("on a newly born repository: every ledger it has from birth, no question, the gate green", () => {
  const dir = born();
  const css = text(dir, "src/index.css");
  assert.notDeepEqual(missingAtBirth(dir), []);
  const result = starter(dir);
  // Something still waits on a person, and that is said, not asked.
  assert.equal(result.status, 1, result.stderr);
  assert.equal(text(dir, "src/index.css"), css);
  assert.deepEqual(missingAtBirth(dir), []);
  for (const file of [
    "design/states.json",
    "design/screens.yaml",
    "design/screen-sizes.json",
    "design/column-types.json",
    "design/component-registry.json",
  ]) {
    assert.ok(existsSync(path.join(dir, file)), file);
  }
  // Every value adopted here is named as the floor's.
  const theme = JSON.parse(text(dir, "design/theme.json"));
  assert.ok(theme.adopted.length > 0);
  assert.deepEqual(theme.adopted_from_floor, theme.adopted);
  const checked = check(dir);
  assert.equal(checked.status, 0, checked.stderr);

  // Each person's call stays a question on the waiting list.
  // Answers wait on the owner, so status ends with 1: work is left, for a person.
  const status = run(STATUS, "--target", dir);
  assert.equal(status.status, 1, status.stderr);
  assert.match(status.stdout, /ledgers from birth: all \d+ are here/);
  assert.match(status.stdout, /waiting on the owner: \d+/);
  assert.match(status.stdout, /source-color: /);

  // Laying them again changes nothing, byte for byte.
  const files = ["design/decisions.yaml", "design/theme.json", "design/states.json"];
  const first = files.map((file) => text(dir, file));
  const again = starter(dir);
  assert.equal(again.status, 1, again.stderr);
  assert.match(again.stdout, /rows to add: 0/);
  assert.doesNotMatch(again.stdout, /^\s+(create|update)\s/m);
  assert.deepEqual(
    files.map((file) => text(dir, file)),
    first,
  );
});

test("status names each ledger a repository should have from birth and has not", () => {
  const dir = born();
  assert.equal(run(ADOPT, "--target", dir).status, 1);
  const status = run(STATUS, "--target", dir);
  assert.equal(status.status, 1, status.stderr);
  const missing = missingAtBirth(dir);
  // Adopting without --starter lays none of the ledgers a person keeps.
  for (const file of ["design/states.json", "design/screens.yaml", "design/screen-sizes.json"]) {
    assert.ok(missing.includes(file), missing.join(", "));
    assert.equal(existsSync(path.join(dir, file)), false, file);
  }
  assert.match(
    status.stdout,
    new RegExp(`ledgers from birth: ${missing.length} missing: .*design/states\\.json`),
  );
});

// The stylesheet of a repository whose setup was given a brand colour: the floor's, with that
// colour as its primary color role.
const BRAND = "#0246ff";
const branded = () =>
  withoutBlock(own("src/index.css")).replace(/(:root \{[^}]*?--primary: )[^;]+;/, `$1${BRAND};`);

test("a repository born with a brand colour gets every ledger from birth, and nothing of it is the floor's", () => {
  const css = branded();
  assert.match(css, new RegExp(`--primary: ${BRAND};`));
  const dir = born({ "src/index.css": css });
  const result = starter(dir);
  assert.equal(result.status, 1, result.stderr);
  assert.equal(text(dir, "src/index.css"), css);
  assert.deepEqual(missingAtBirth(dir), []);
  // What it holds is the repository's own: no value is named as the floor's.
  const theme = JSON.parse(text(dir, "design/theme.json"));
  assert.ok(theme.adopted.length > 0);
  assert.equal(theme.adopted_from_floor, undefined);
  const checked = check(dir);
  assert.equal(checked.status, 0, checked.stderr);

  // The brand colour is not confirmed for anyone: that call waits on a person.
  const status = run(STATUS, "--target", dir);
  assert.equal(status.status, 1, status.stderr);
  assert.match(status.stdout, /ledgers from birth: all \d+ are here/);
  assert.match(status.stdout, /source-color: /);

  // Laying them again changes nothing, byte for byte.
  const files = ["design/decisions.yaml", "design/theme.json", "design/states.json"];
  const first = files.map((file) => text(dir, file));
  const again = starter(dir);
  assert.equal(again.status, 1, again.stderr);
  assert.match(again.stdout, /rows to add: 0/);
  assert.doesNotMatch(again.stdout, /^\s+(create|update)\s/m);
  assert.deepEqual(
    files.map((file) => text(dir, file)),
    first,
  );

  // The guide still does not write over the colour, or over any value held here.
  writeFileSync(path.join(dir, "design/blueprint.json"), blueprint());
  const refused = run(APPLY, "--target", dir);
  assert.equal(refused.status, 2);
  assert.match(refused.stderr, /generating would replace/);
  assert.equal(text(dir, "src/index.css"), css);
});

test("a brand colour given after the ledgers were laid takes nothing more for the floor's", () => {
  const dir = born();
  assert.equal(starter(dir).status, 1);
  const laid = JSON.parse(text(dir, "design/theme.json"));
  assert.equal(laid.adopted.includes("color-contrast"), false);
  writeFileSync(
    path.join(dir, "src/index.css"),
    text(dir, "src/index.css").replace(/(:root \{[^}]*?--primary: )[^;]+;/, `$1${BRAND};`),
  );
  // With the level stated, this run has a value to record that the first one had not: the
  // contrast of the brand colour, which is the repository's own.
  const again = starter(dir, "--conformance-level", "AA");
  assert.equal(again.status, 1, again.stderr);
  const theme = JSON.parse(text(dir, "design/theme.json"));
  assert.ok(theme.adopted.includes("color-contrast"), theme.adopted.join(", "));
  assert.deepEqual(theme.adopted_from_floor, laid.adopted_from_floor);
});

test("what came from the floor does not stop the guide; what a repository adopted still does", () => {
  const laid = born();
  assert.equal(starter(laid).status, 1);
  writeFileSync(path.join(laid, "design/blueprint.json"), blueprint());
  const applied = run(APPLY, "--target", laid);
  assert.equal(applied.status, 0, applied.stderr);
  assert.equal(JSON.parse(text(laid, "design/theme.json")).adopted_from_floor, undefined);
  assert.equal(check(laid).status, 0, check(laid).stderr);

  const adopted = born();
  assert.equal(run(ADOPT, "--target", adopted, "--conformance-level", "AA").status, 1);
  writeFileSync(path.join(adopted, "design/blueprint.json"), blueprint());
  const refused = run(APPLY, "--target", adopted);
  assert.equal(refused.status, 2);
  assert.match(refused.stderr, /hold values adopted from this repository/);
});

test("a value adopted later without --starter is the repository's own, and the guide keeps it", () => {
  // Without a conformance level the contrast is not adopted on the floor; stated later through
  // plain adopting, it is the repository's own.
  const dir = born();
  assert.equal(starter(dir).status, 1);
  assert.equal(
    JSON.parse(text(dir, "design/theme.json")).adopted.includes("color-contrast"),
    false,
  );
  assert.equal(run(ADOPT, "--target", dir, "--conformance-level", "AA").status, 1);
  const theme = JSON.parse(text(dir, "design/theme.json"));
  assert.ok(theme.adopted.includes("color-contrast"));
  assert.equal(theme.adopted_from_floor.includes("color-contrast"), false);
  writeFileSync(path.join(dir, "design/blueprint.json"), blueprint());
  const refused = run(APPLY, "--target", dir);
  assert.equal(refused.status, 2);
  assert.match(refused.stderr, /^.*color-contrast hold values adopted from this repository/m);
  assert.doesNotMatch(refused.stderr, /radius-value/);
});

test("a repository that adopted values of its own gets its missing ledgers, and keeps the values", () => {
  const dir = born();
  assert.equal(run(ADOPT, "--target", dir, "--conformance-level", "AA").status, 1);
  const before = JSON.parse(text(dir, "design/theme.json"));
  assert.equal(existsSync(path.join(dir, "design/states.json")), false);
  const result = starter(dir);
  assert.equal(result.status, 1, result.stderr);
  assert.deepEqual(missingAtBirth(dir), []);
  // Nothing it adopted becomes the floor's.
  const theme = JSON.parse(text(dir, "design/theme.json"));
  assert.deepEqual(theme.adopted, before.adopted);
  assert.equal(theme.adopted_from_floor, undefined);
  assert.equal(check(dir).status, 0, check(dir).stderr);
  writeFileSync(path.join(dir, "design/blueprint.json"), blueprint());
  const refused = run(APPLY, "--target", dir);
  assert.equal(refused.status, 2);
  assert.match(refused.stderr, /hold values adopted from this repository/);
});

test("status says when none of the ledgers from birth is there yet, and how to lay them", () => {
  const dir = born();
  const status = run(STATUS, "--target", dir);
  assert.match(
    status.stdout,
    /ledgers from birth: none of \d+ is here yet; on a floor, \/design-assembly:adopt --starter lays them/,
  );
});
