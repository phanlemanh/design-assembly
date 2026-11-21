// The browser test by role, as the guide installs it: only where the repository joins its ledger
// of screens with its model, has the adapter's test browser and keeps the file of ways in, which
// the guide never writes. The row of the ledger comes with the test, the gate holds both files,
// and the installed test of every page stays as it was, byte for byte.
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  unlinkSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { execPath } from "node:process";
import { after, test } from "node:test";
import { fileURLToPath } from "node:url";

import { floorFiles } from "./helpers/guided-repo.mjs";
import { patternsPlan, plan } from "../scripts/apply.mjs";
import { adapter as browser } from "../templates/tools/design-assembly/adapters/playwright.mjs";
import { parseLedger, TOOL } from "../templates/tools/design-assembly/ledger.mjs";
import {
  SEEN_DECISION,
  SEEN_TEST,
} from "../templates/tools/design-assembly/screen-actions-seen.mjs";
import { PAGES_TEST } from "../templates/tools/design-assembly/screens.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const PLUGIN = path.resolve(HERE, "..");
const APPLY = path.join(PLUGIN, "scripts/apply.mjs");
const STATUS = path.join(PLUGIN, "scripts/status.mjs");
const DOOR = browser.door.file;
const TEMPLATE = readFileSync(
  path.join(PLUGIN, "templates/owned/screen-actions-seen.spec.ts.template"),
  "utf8",
);
const DOORS = "export const DOORS = { user: async () => {} };\n";
// A test of every page a repository installed from an earlier version: never written over.
const EARLIER_PAGES_TEST = "// decision:one-main-one-h1\n// installed by an earlier version\n";

const made = [];
after(() => made.forEach((dir) => rmSync(dir, { recursive: true, force: true })));

const sha = (text) => createHash("sha256").update(text).digest("hex");
const run = (script, ...args) => spawnSync(execPath, [script, ...args], { encoding: "utf8" });
const apply = (dir) => run(APPLY, "--target", dir);
const gate = (dir) => run(path.join(dir, "tools/design-assembly/check.mjs"), "--target", dir);
const text = (dir, file) => readFileSync(path.join(dir, file), "utf8");
const has = (dir, file) => existsSync(path.join(dir, file));
const rowsOf = (dir) =>
  Object.fromEntries(parseLedger(text(dir, "design/decisions.yaml")).map((r) => [r.id, r]));
const put = (dir, file, content) => {
  mkdirSync(path.dirname(path.join(dir, file)), { recursive: true });
  writeFileSync(path.join(dir, file), content);
};

// The guide's small repository with a domain model of one role and two actions, the floor's
// browser checks, and its ledger of screens saying what each screen shows, opens with and offers.
// `extra` adds files or puts them in place of one; null leaves one out.
function repository(extra = {}) {
  const dir = mkdtempSync(path.join(tmpdir(), "design-assembly-seen-install-"));
  made.push(dir);
  const files = {
    ...floorFiles(),
    "tests/e2e/routes.ts": "export const ROUTES = [];\n",
    "package.json": JSON.stringify({
      devDependencies: { "@axe-core/playwright": "^4", "@playwright/test": "^1" },
    }),
    "ontology/roles.yaml": "roles:\n  - name: user\n",
    "ontology/actions.yaml": [
      "actions:",
      "  - name: listItems",
      "    entity: Item",
      "    kind: query",
      "    roles: [user]",
      "  - name: addItem",
      "    entity: Item",
      "    kind: create",
      "    roles: [user]",
      "",
    ].join("\n"),
    "ontology/entities/Item.yaml": "name: Item\n",
    ...extra,
  };
  for (const [file, content] of Object.entries(files))
    if (content !== null) put(dir, file, content);
  // The guide writes the ledger of screens from the code; a person then says what each screen
  // shows, opens with and offers.
  const first = apply(dir);
  assert.equal(first.status, 0, first.stderr);
  const ledger = text(dir, "design/screens.yaml")
    .replace(
      /( {4}status: built\n)/,
      "$1    shows:\n      - Item\n    entry: listItems\n    actions:\n      - addItem\n",
    )
    .replace(
      /(id: archive[\s\S]*? {4}status: built\n)/,
      "$1    shows:\n      - Item\n    entry: listItems\n    actions: []\n",
    );
  writeFileSync(path.join(dir, "design/screens.yaml"), ledger);
  return dir;
}

test("without the file of ways in, nothing is installed, no row is written, and status names it", () => {
  const dir = repository();
  const done = apply(dir);
  assert.equal(done.status, 0, done.stderr);
  // The join of the ledger and the model is held; what each role sees in a browser is not yet.
  assert.ok("screen-actions" in rowsOf(dir));
  assert.ok(!(SEEN_DECISION in rowsOf(dir)));
  assert.equal(has(dir, SEEN_TEST), false);
  // The guide writes no sign-in code: the file of ways in is the repository's.
  assert.equal(has(dir, DOOR), false);
  const checked = gate(dir);
  assert.equal(checked.status, 0, checked.stderr);
  const said = run(STATUS, "--target", dir).stdout;
  assert.match(
    said,
    new RegExp(`${SEEN_DECISION} has no row: ${DOOR.replace(/[./]/g, "\\$&")} is missing`),
  );
});

test("without the adapter's test browser, status names that instead", () => {
  const dir = repository({ [DOOR]: DOORS, "package.json": JSON.stringify({}) });
  const done = apply(dir);
  assert.equal(done.status, 0, done.stderr);
  assert.ok(!(SEEN_DECISION in rowsOf(dir)));
  assert.equal(has(dir, SEEN_TEST), false);
  const said = run(STATUS, "--target", dir).stdout;
  assert.match(said, new RegExp(`${SEEN_DECISION} has no row: .*${browser.accessibilityPackage}`));
});

test("with the file of ways in, the test is installed, the row is held, and the door is untouched", () => {
  const dir = repository({ [DOOR]: DOORS, [PAGES_TEST]: EARLIER_PAGES_TEST });
  const before = sha(text(dir, PAGES_TEST));
  const done = apply(dir);
  assert.equal(done.status, 0, done.stderr);
  assert.equal(text(dir, SEEN_TEST), TEMPLATE);
  assert.equal(text(dir, DOOR), DOORS);
  // The test of every page installed before is the same, byte for byte.
  assert.equal(sha(text(dir, PAGES_TEST)), before);
  const row = rowsOf(dir)[SEEN_DECISION];
  assert.equal(row.check, TOOL);
  assert.equal(row.layer, "templates");
  const theme = JSON.parse(text(dir, "design/theme.json"));
  assert.deepEqual(theme.checks[SEEN_DECISION], [
    {
      kind: SEEN_DECISION,
      test: SEEN_TEST,
      door: DOOR,
      file: "design/screens.yaml",
      model: "ontology",
    },
  ]);
  const checked = gate(dir);
  assert.equal(checked.status, 0, checked.stderr);
  // A second run changes nothing, and a test the repository changed is never written over.
  writeFileSync(path.join(dir, SEEN_TEST), `${TEMPLATE}// the repository's own line\n`);
  apply(dir);
  assert.match(text(dir, SEEN_TEST), /the repository's own line/);
});

test("the install path writes the test file only: never a way in, never sign-in code", () => {
  const without = repository();
  const withDoor = repository({ [DOOR]: DOORS });
  const blueprint = JSON.parse(text(without, "design/blueprint.json"));
  const filesOf = (dir) => Object.keys(plan(dir, blueprint).files).sort();
  const added = filesOf(withDoor).filter((file) => !filesOf(without).includes(file));
  assert.deepEqual(added, [SEEN_TEST]);
  for (const dir of [without, withDoor]) {
    assert.ok(!filesOf(dir).includes(DOOR));
    assert.ok(!filesOf(dir).some((file) => /sign-?in|login|auth/i.test(file)));
  }
});

test("adopting proposes the row only where the test is already there, and writes no test", () => {
  const dir = repository({ [DOOR]: DOORS });
  assert.ok(!(SEEN_DECISION in patternsPlan(dir, { starter: false }).held));
  assert.ok(!(SEEN_TEST in patternsPlan(dir, { starter: false }).files));
  put(dir, SEEN_TEST, TEMPLATE);
  const held = patternsPlan(dir, { starter: false }).held[SEEN_DECISION];
  assert.equal(held.row.check, TOOL);
});

test("once the row is held, the gate fails when the door, the test or its tag is gone", () => {
  const dir = repository({ [DOOR]: DOORS });
  apply(dir);
  assert.equal(gate(dir).status, 0);
  unlinkSync(path.join(dir, DOOR));
  const noDoor = gate(dir);
  assert.notEqual(noDoor.status, 0);
  assert.match(
    noDoor.stderr,
    new RegExp(`${SEEN_DECISION}: ${DOOR.replace(/[./]/g, "\\$&")} is missing`),
  );
  put(dir, DOOR, DOORS);
  unlinkSync(path.join(dir, SEEN_TEST));
  const noTest = gate(dir);
  assert.notEqual(noTest.status, 0);
  assert.match(
    noTest.stderr,
    new RegExp(`${SEEN_DECISION}: ${SEEN_TEST.replace(/[./]/g, "\\$&")} is missing`),
  );
  put(dir, SEEN_TEST, TEMPLATE.replace("// decision:screen-actions-seen\n", ""));
  const untagged = gate(dir);
  assert.notEqual(untagged.status, 0);
  assert.match(untagged.stderr, /does not name decision:screen-actions-seen/);
});
