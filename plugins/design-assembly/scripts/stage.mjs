// A place to draw a repository's own screens: its development server and a browser, both taken
// from the repository's own packages. Used by the scripts that show instead of describe.
import { createRequire } from "node:module";
import path from "node:path";
import { pathToFileURL } from "node:url";

import { ADAPTERS } from "../templates/tools/design-assembly/adapters/index.mjs";

// The adapters a stage is drawn with: one of each kind it needs. `build` is the first build, the
// one a repository whose packages name none is drawn with.
const of = (kind) => ADAPTERS.find((adapter) => adapter.kind === kind);
export const stageAdapters = { build: of("build"), browser: of("browser"), source: of("source") };
const BUILDS = ADAPTERS.filter((adapter) => adapter.kind === "build");

// The build a repository is drawn with: the one it shows most surely it builds with, by its
// settings file or its own development command, then by its packages; on a tie, the first in the
// list; and the first build when it names none.
export function buildOf(target) {
  let found = null;
  let best = 0;
  for (const adapter of BUILDS) {
    const sure = Number(adapter.detect(target)) || 0;
    if (sure > best) [found, best] = [adapter, sure];
  }
  return found ?? stageAdapters.build;
}

// Why a stage could not open when a package it needs is not installed: the build, named as such
// where the browser is there, or nothing to draw with where neither is.
export const missingProblem = (error, browserInstalled) =>
  browserInstalled
    ? `the repository's own build is not installed (${error.message.split("\n")[0]})`
    : `the repository has no browser to draw with (${error.message.split("\n")[0]})`;

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
// read with its words resolved. `can` says which of `modules`, `load` and `transform` the build's
// server does: one that does not is given none of them, and the caller says what it did not draw.
// `modules` are extra modules the stage serves beside the repository's own, by address: code that
// exists only while the stage is open, so nothing is added to the repository to draw it.
// `transform` may change a module of the repository as it is served, never on disk: it gets the
// source and the file, and returns the new source or null.
export async function openStage(target, { modules = {}, transform = null } = {}) {
  const require = createRequire(path.join(target, "package.json"));
  const build = buildOf(target);
  let server;
  let browser;
  const close = async () => {
    await browser?.close();
    await server?.close();
  };
  // The build first, then the browser: a failure says which of the two it was.
  try {
    server = await build.serve(require, target, {
      modules: build.serves.modules ? modules : {},
      transform: build.serves.transform ? transform : null,
    });
  } catch (error) {
    await close();
    return {
      problem:
        error.code === "MODULE_NOT_FOUND"
          ? missingProblem(error, stageAdapters.browser.installed(require))
          : `the stage could not open: ${error.message.split("\n")[0]}`,
    };
  }
  try {
    browser = await stageAdapters.browser.launch(require);
  } catch (error) {
    await close();
    return { problem: problemOf(error) };
  }
  return {
    origin: server.origin,
    browser,
    load: server.load,
    close,
    build: build.id,
    can: { ...build.serves },
  };
}
