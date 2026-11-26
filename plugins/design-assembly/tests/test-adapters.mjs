// The adapters: each declares its kind and the names it owns, and no name an adapter owns appears
// in the plugin's core code. The core is the scripts, the tool a repository runs, and the make file
// the guide installs; the adapters' folder and the code a repository owns once installed are not.
import "./helpers/own-cores.mjs";
import assert from "node:assert/strict";
import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

import {
  ADAPTER_KINDS,
  ADAPTERS,
  libraryNamesIn,
} from "../templates/tools/design-assembly/adapters/index.mjs";

const PLUGIN = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const CORE = ["scripts", "templates/tools/design-assembly", "templates/mk"];

// The files of the core, by path from the plugin's folder: a folder's own files, never its
// subfolders, so the adapters' folder is left out.
function coreFiles() {
  return CORE.flatMap((folder) =>
    readdirSync(path.join(PLUGIN, folder))
      .map((name) => `${folder}/${name}`)
      .filter((file) => !statSync(path.join(PLUGIN, file)).isDirectory()),
  );
}

test("each adapter says what kind it is and which names it owns", () => {
  const ids = ADAPTERS.map((adapter) => adapter.id);
  assert.equal(new Set(ids).size, ids.length);
  for (const adapter of ADAPTERS) {
    assert.ok(adapter.kind in ADAPTER_KINDS, adapter.id);
    assert.ok(adapter.names.length > 0, adapter.id);
    // An adapter is named for the library it knows, and owns that name.
    assert.ok(adapter.names.includes(adapter.id), adapter.id);
  }
  // One adapter for each kind the plugin needs today.
  assert.deepEqual(
    [...new Set(ADAPTERS.map((adapter) => adapter.kind))].sort(),
    Object.keys(ADAPTER_KINDS).sort(),
  );
});

test("a name is found whole and in any case, and only an adapter's name", () => {
  assert.deepEqual(libraryNamesIn('@import "tailwindcss";'), ["tailwindcss"]);
  assert.deepEqual(libraryNamesIn("import React from 'react'"), ["react"]);
  assert.deepEqual(libraryNamesIn("require('@playwright/test')"), ["@playwright/test"]);
  // A word that holds a name is not the name; a library no adapter knows is not looked for.
  assert.deepEqual(libraryNamesIn("a reactive list, a next step, a theme"), []);
});

test("the core names no library and no build tool: only an adapter does", () => {
  const found = coreFiles()
    .map((file) => [file, libraryNamesIn(readFileSync(path.join(PLUGIN, file), "utf8"))])
    .filter(([, names]) => names.length > 0)
    .map(([file, names]) => `${file}: ${names.join(", ")}`);
  assert.deepEqual(found, []);
  assert.ok(coreFiles().length >= 25);
});
