// Where the check of floating parts lives, and who says it holds an item (specification 0015,
// addendum, item 11.7, criteria 20 and 21): the gate holds the browser test that opens the floating
// parts wherever a conform record is there; the guide and adopting write that test where the
// repository runs browser tests and has none, and never write over one; and the question of intake
// says what the gate holds of an outside item, and when the repository's own check does not run.
// Intake runs no browser. Nothing calls a model or the network.
import "./helpers/own-cores.mjs";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import path from "node:path";
import { execPath } from "node:process";
import { after, test } from "node:test";
import { fileURLToPath } from "node:url";

import { floatingParts } from "../scripts/apply.mjs";
import { KINDS_FOR_TEST } from "../templates/tools/design-assembly/check.mjs";
import { CONFORM_FOLDER } from "../templates/tools/design-assembly/contract.mjs";
import {
  FLOATING_CHECK,
  FLOATING_TEST,
  gateWords,
} from "../templates/tools/design-assembly/floating-parts.mjs";
import { cleanUp, healthyFiles, json, repo } from "./helpers/store-repo.mjs";

const PLUGIN = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const INTAKE = path.join(PLUGIN, "scripts/intake.mjs");
const DECIDE = path.join(PLUGIN, "scripts/decide.mjs");
const TEMPLATE = readFileSync(
  path.join(PLUGIN, "templates/owned/floating-parts.spec.ts.template"),
  "utf8",
);

after(cleanUp);

const node = (script, args) => spawnSync(execPath, [script, ...args], { encoding: "utf8" });
const read = (dir, file) => readFileSync(path.join(dir, file), "utf8");
const BROWSER = json({
  dependencies: { react: "19.0.0" },
  devDependencies: { "@playwright/test": "^1", "@axe-core/playwright": "^4" },
});
const OWN_CHECK = "tests/e2e/pages.spec.ts";
const OWN_CHECK_TEXT =
  'import AxeBuilder from "@axe-core/playwright";\nconst found = await new AxeBuilder({ page }).analyze();\n';
const ROW_CHECK = `version: 1\ndecisions:\n  - id: wcag-aa\n    layer: templates\n    kind: standard\n    source: "the repository's own browser test of it"\n    check: "e2e:${OWN_CHECK}"\n`;
const ITEM = { name: "filter-bar", files: [{ path: "narrow-list.tsx" }], dependencies: [] };

// ---- the gate holds the browser test --------------------------------------------------------------

const floating = KINDS_FOR_TEST[FLOATING_CHECK.kind];
const stateOf = ({ records = 1, test = TEMPLATE } = {}) => ({
  files: { [FLOATING_TEST]: test },
  ledgerFolders: {
    [CONFORM_FOLDER]: Object.fromEntries(
      Array.from({ length: records }, (_, index) => [`${CONFORM_FOLDER}/need-${index}.json`, "{}"]),
    ),
  },
});

test("the gate holds the browser test of the floating parts wherever a conform record is there", () => {
  assert.equal(floating.run(stateOf(), FLOATING_CHECK), null);
  // No record: nothing to open, nothing to hold.
  assert.equal(floating.run(stateOf({ records: 0, test: null }), FLOATING_CHECK), null);
  assert.match(
    floating.run(stateOf({ test: null }), FLOATING_CHECK),
    /^tests\/e2e\/floating-parts\.spec\.ts is missing: it is the browser test that opens the floating parts of the items of 1 conform record/,
  );
  assert.match(
    floating.run(stateOf({ test: "// emptied\n" }), FLOATING_CHECK),
    /does not call floatingCheck/,
  );
  // The check is seen failing on a copy it changes.
  const clean = stateOf({ records: 0 });
  assert.notEqual(floating.run(floating.change(clean, FLOATING_CHECK), FLOATING_CHECK), null);
});

// ---- the guide and adopting write it ---------------------------------------------------------------

test("the guide and adopting write the browser test where the repository runs browser tests and has none, and never write over one", () => {
  const withBrowser = repo({ ...healthyFiles(), "package.json": BROWSER });
  assert.deepEqual(floatingParts(withBrowser), {
    checks: [FLOATING_CHECK],
    files: { [FLOATING_TEST]: TEMPLATE },
  });
  const own = repo({
    ...healthyFiles(),
    "package.json": BROWSER,
    [FLOATING_TEST]: "// the repository's own\n",
  });
  assert.deepEqual(floatingParts(own), { checks: [FLOATING_CHECK], files: {} });
  const none = repo(healthyFiles());
  assert.deepEqual(floatingParts(none), { checks: [], files: {} });
});

// ---- criterion 20: the question of intake ---------------------------------------------------------

const store = (files = {}) =>
  repo({
    ...healthyFiles(),
    "package.json": BROWSER,
    "design/theme.json": json({ version: 1, checks: {} }),
    "tools/kit/snapshot/filter-bar.json": json(ITEM),
    ...files,
  });
const ask = (dir) => node(INTAKE, ["--target", dir, "--need", "narrow-list", "filter", "bar"]);
const candidate = (dir) =>
  JSON.parse(read(dir, "design/waiting/intake-narrow-list.json")).candidates.find(
    (item) => item.name === "filter-bar",
  );

test("criterion 20: the question of intake says the gate opens the item's floating parts and runs the repository's own check with them open", () => {
  const dir = store({
    [FLOATING_TEST]: TEMPLATE,
    "design/decisions.yaml": ROW_CHECK,
    [OWN_CHECK]: OWN_CHECK_TEXT,
  });
  assert.equal(ask(dir).status, 1);
  const said = candidate(dir).gate;
  assert.match(
    said,
    /once taken in, the gate's browser test \(tests\/e2e\/floating-parts\.spec\.ts\) opens each floating part of it/,
  );
  assert.match(
    said,
    /the repository's own accessibility check \(tests\/e2e\/pages\.spec\.ts\) runs with each part open/,
  );
  assert.equal(said, gateWords(dir));
  // The decision sheet shows it beside the candidate.
  const sheet = node(DECIDE, ["--target", dir]);
  assert.match(sheet.stdout, /the gate: once taken in, the gate's browser test/);
});

test("criterion 20: where the repository has no check of its conformance level, the question says its check does not run, and that names and text are held all the same", () => {
  const dir = store({ [FLOATING_TEST]: TEMPLATE });
  ask(dir);
  const said = candidate(dir).gate;
  assert.match(said, /opens each floating part of it/);
  assert.match(
    said,
    /the repository's own accessibility check does not run with the floating parts open; their names and the item's text are held all the same/,
  );
  // Without the browser test, the question says the gate does not open them.
  const bare = store();
  ask(bare);
  assert.match(
    candidate(bare).gate,
    /^the gate does not open its floating parts: tests\/e2e\/floating-parts\.spec\.ts is missing \(upgrade writes it\)$/,
  );
});

test("intake runs no browser: it imports nothing that starts one", () => {
  const source = read(PLUGIN, "scripts/intake.mjs");
  assert.doesNotMatch(source, /playwright-floating-parts|checkScreen|\.launch\(/);
});
