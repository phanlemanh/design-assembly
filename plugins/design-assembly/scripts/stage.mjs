// A place to draw a repository's own screens: its development server and a browser, both taken
// from the repository's own packages. Used by the scripts that show instead of describe.
import { createRequire } from "node:module";
import path from "node:path";

import { ADAPTERS } from "../templates/tools/design-assembly/adapters/index.mjs";

// The adapters a stage is drawn with: one of each kind it needs.
const of = (kind) => ADAPTERS.find((adapter) => adapter.kind === kind);
export const stageAdapters = { build: of("build"), browser: of("browser"), source: of("source") };

// Opens the stage, or says why the repository has nothing to draw with. `load` reads a module of
// the repository the way its own build would, so a list written in its source language can be
// read with its words resolved.
// `modules` are extra modules the stage serves beside the repository's own, by address: code that
// exists only while the stage is open, so nothing is added to the repository to draw it.
// `transform` may change a module of the repository as it is served, never on disk: it gets the
// source and the file, and returns the new source or null.
export async function openStage(target, { modules = {}, transform = null } = {}) {
  const require = createRequire(path.join(target, "package.json"));
  let server;
  let browser;
  const close = async () => {
    await browser?.close();
    await server?.close();
  };
  try {
    server = await stageAdapters.build.serve(require, target, { modules, transform });
    browser = await stageAdapters.browser.launch(require);
  } catch (error) {
    await close();
    const missing = /Cannot find (module|package)/.test(error.message);
    return {
      problem: missing
        ? `the repository has no browser to draw with (${error.message.split("\n")[0]})`
        : `the stage could not open: ${error.message.split("\n")[0]}`,
    };
  }
  return { origin: server.origin, browser, load: server.load, close };
}
