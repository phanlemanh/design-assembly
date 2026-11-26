// The six findings of the inventory, both ways: on a healthy repository it finds nothing and
// --strict ends with 0; each install makes its own finding show, once, and no other; taking the
// install out makes it go; all six installed give all six.
import "./helpers/own-cores.mjs";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import path from "node:path";
import { execPath } from "node:process";
import { after, test } from "node:test";
import { fileURLToPath } from "node:url";

import { FINDINGS, inventory } from "../scripts/inventory.mjs";
import { cleanUp, INSTALLS, storeRepo } from "./helpers/store-repo.mjs";

const SCRIPT = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../scripts/inventory.mjs",
);
after(cleanUp);

const kinds = (result) => result.findings.map((finding) => finding.kind).sort();
const strict = (dir) =>
  spawnSync(execPath, [SCRIPT, "--target", dir, "--strict", "--json"], { encoding: "utf8" });

test("every kind of finding is one the fixtures install: the six of the brief, and a record that exempts a mandatory rule", () => {
  assert.deepEqual([...FINDINGS].sort(), Object.keys(INSTALLS).sort());
});

test("a healthy repository gives no finding, and --strict ends with 0", () => {
  const dir = storeRepo();
  const result = inventory(dir);
  assert.deepEqual(result.findings, [], JSON.stringify(result.findings, null, 2));
  const call = strict(dir);
  assert.equal(call.status, 0, call.stderr);
  assert.deepEqual(JSON.parse(call.stdout).findings, []);
});

for (const kind of Object.keys(INSTALLS)) {
  test(`installing ${kind} shows ${kind} once and nothing else; taking it out again shows nothing`, () => {
    const result = inventory(storeRepo(kind));
    assert.deepEqual(kinds(result), [kind], JSON.stringify(result.findings, null, 2));
    const [finding] = result.findings;
    assert.ok(finding.items.length > 0, "a finding names what it is about");
    assert.ok(finding.evidence.length > 0, "a finding carries its evidence");
    const call = strict(storeRepo(kind));
    assert.equal(call.status, 1, `${kind}: --strict ends with 1 on a finding`);
    assert.deepEqual(inventory(storeRepo()).findings, []);
  });
}

test("all six installed give all six, each once", () => {
  const result = inventory(storeRepo(...Object.keys(INSTALLS)));
  assert.deepEqual(
    kinds(result),
    Object.keys(INSTALLS).sort(),
    JSON.stringify(result.findings, null, 2),
  );
});

test("each finding names the files or blocks it is about", () => {
  const about = (kind) =>
    inventory(storeRepo(kind)).findings[0].items.map((item) => item.file ?? item.name);
  assert.deepEqual(about("unused"), ["src/components/orphan.tsx"]);
  assert.deepEqual(about("unrecorded"), ["src/components/badge-line.tsx"]);
  assert.deepEqual(about("duplicate").sort(), [
    "src/components/data-region-copy.tsx",
    "src/components/data-region.tsx",
  ]);
  assert.deepEqual(about("outdated"), ["src/components/data-region.tsx"]);
  assert.deepEqual(about("modified"), ["src/components/filter-bar.tsx"]);
  assert.deepEqual(about("promote"), ["src/pages/Items.tsx"]);
});
