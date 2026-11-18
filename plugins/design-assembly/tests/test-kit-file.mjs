// Where the tests find a file of the acceptance kit: at the kit's root, or inside the folder of one
// of its plugins, for a kit that keeps each plugin in a folder of its own.
import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";

import { kitFile } from "./helpers/kit.mjs";

const FILE = "floor/dist/reader.mjs";

function kit(...places) {
  const dir = mkdtempSync(path.join(tmpdir(), "design-assembly-kit-"));
  for (const place of places) {
    mkdirSync(path.dirname(path.join(dir, place)), { recursive: true });
    writeFileSync(path.join(dir, place), "");
  }
  return dir;
}

test("a kit that keeps the file at its root is read there", () => {
  const dir = kit(FILE);
  assert.equal(kitFile(dir, FILE), path.join(dir, FILE));
});

test("a kit that keeps each plugin in its own folder is read in the plugin that has the file", () => {
  const dir = kit(`plugins/other/README.md`, `plugins/core/${FILE}`);
  assert.equal(kitFile(dir, FILE), path.join(dir, "plugins/core", FILE));
});

test("no kit, or a kit without the file, gives nothing, so the test that needs it is skipped", () => {
  assert.equal(kitFile(undefined, FILE), null);
  assert.equal(kitFile("", FILE), null);
  assert.equal(kitFile(kit("plugins/core/other.mjs"), FILE), null);
  assert.equal(kitFile(path.join(tmpdir(), "design-assembly-no-such-kit"), FILE), null);
});
