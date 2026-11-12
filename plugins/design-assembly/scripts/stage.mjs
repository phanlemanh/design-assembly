// A place to draw a repository's own screens: its development server and a browser, both taken
// from the repository's own packages. Used by the scripts that show instead of describe.
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { pathToFileURL } from "node:url";

// Opens the stage, or says why the repository has nothing to draw with. `load` reads a module of
// the repository the way its own build would, so a list written in its source language can be
// read with its words resolved.
export async function openStage(target) {
  const require = createRequire(path.join(target, "package.json"));
  let chromium;
  let createServer;
  try {
    ({ chromium } = require("@playwright/test"));
    const vite = path.dirname(require.resolve("vite/package.json"));
    const entry = JSON.parse(readFileSync(path.join(vite, "package.json"), "utf8")).exports?.["."];
    const file =
      typeof entry === "string"
        ? entry
        : (entry?.import?.default ?? entry?.import ?? entry?.default);
    ({ createServer } = await import(pathToFileURL(path.join(vite, file)).href));
  } catch (error) {
    return {
      problem: `the repository has no browser to draw with (${error.message.split("\n")[0]})`,
    };
  }
  let server;
  let browser;
  const close = async () => {
    await browser?.close();
    await server?.close();
  };
  try {
    server = await createServer({
      root: target,
      logLevel: "silent",
      server: { host: "127.0.0.1", port: 5290, strictPort: false },
    });
    await server.listen();
    browser = await chromium.launch();
  } catch (error) {
    await close();
    return { problem: `the stage could not open: ${error.message.split("\n")[0]}` };
  }
  return {
    origin: server.resolvedUrls.local[0].replace(/\/$/, ""),
    browser,
    load: (module) => server.ssrLoadModule(module),
    close,
  };
}
