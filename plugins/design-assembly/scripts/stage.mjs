// A place to draw a repository's own screens: its development server and a browser, both taken
// from the repository's own packages. Used by the scripts that show instead of describe.
import { createRequire } from "node:module";
import path from "node:path";
import { pathToFileURL } from "node:url";

import { ADAPTERS } from "../templates/tools/design-assembly/adapters/index.mjs";

// The adapters a stage is drawn with: one of each kind it needs.
const of = (kind) => ADAPTERS.find((adapter) => adapter.kind === kind);
export const stageAdapters = { build: of("build"), browser: of("browser"), source: of("source") };

// Why a stage or a browser could not be opened, in one line.
const problemOf = (error, what = "the stage") =>
  /Cannot find (module|package)/.test(error.message)
    ? `the repository has no browser to draw with (${error.message.split("\n")[0]})`
    : `${what} could not open: ${error.message.split("\n")[0]}`;

// Prints a page that is already a file into a pdf, with the repository's own browser and nothing
// else of the stage: a page that carries everything it shows needs no server. The one way a page
// of this plugin becomes a pdf; `paper` is the size of a sheet, as the browser adapter takes it.
// Gives the problem that stopped it, or nothing.
export async function printPdf(target, page, pdf, paper) {
  const require = createRequire(path.join(target, "package.json"));
  let browser;
  try {
    browser = await stageAdapters.browser.launch(require);
  } catch (error) {
    return { problem: problemOf(error, "the browser") };
  }
  try {
    const context = await browser.newContext({
      viewport: { width: 1440, height: 900 },
      deviceScaleFactor: 2,
    });
    const sheet = await context.newPage();
    await sheet.goto(pathToFileURL(page).href);
    await sheet.pdf({ path: pdf, printBackground: true, ...paper });
  } catch (error) {
    return { problem: `the pdf could not be written: ${error.message.split("\n")[0]}` };
  } finally {
    await browser.close();
  }
  return {};
}

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
    return { problem: problemOf(error) };
  }
  return { origin: server.origin, browser, load: server.load, close };
}
