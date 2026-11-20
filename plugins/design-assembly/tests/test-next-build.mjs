// The second build this plugin draws with. Which build a repository is drawn with is read off its
// packages; a Next.js application is served by its own development server, from its own packages,
// and the handoff book draws its screens there. What that server cannot do, serve a module of the
// plugin's own beside the repository's, is said, never guessed around.
import assert from "node:assert/strict";
import { spawn, spawnSync } from "node:child_process";
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  realpathSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import process, { execPath } from "node:process";
import { setTimeout as wait } from "node:timers/promises";
import { after, test } from "node:test";
import { fileURLToPath } from "node:url";

import { createRequire } from "node:module";

import { ADAPTERS } from "../templates/tools/design-assembly/adapters/index.mjs";
import { adapter as nextBuild } from "../templates/tools/design-assembly/adapters/nextjs-build.mjs";
import { collectFacts } from "../scripts/book.mjs";
import { buildOf, missingProblem, openStage } from "../scripts/stage.mjs";
import { nextRepository, ROOT } from "./helpers/next-repo.mjs";

const PLUGIN = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const removals = [];
after(() => removals.forEach((remove) => remove()));
const sample = () => {
  const made = nextRepository();
  removals.push(made.remove);
  return made.dir;
};
const packages = (dependencies, { scripts, files = [] } = {}) => {
  const dir = mkdtempSync(path.join(tmpdir(), "design-build-"));
  removals.push(() => rmSync(dir, { recursive: true, force: true }));
  if (dependencies) {
    writeFileSync(
      path.join(dir, "package.json"),
      JSON.stringify({ devDependencies: dependencies, ...(scripts ? { scripts } : {}) }),
    );
  }
  for (const file of files) writeFileSync(path.join(dir, file), "export default {};\n");
  return dir;
};
// The folder a process works in: read from /proc on Linux, asked of lsof elsewhere. Null when it
// cannot be read, as for a process that has already ended.
function workingFolder(pid) {
  try {
    return realpathSync(`/proc/${pid}/cwd`);
  } catch {
    const said = spawnSync("lsof", ["-a", "-p", pid, "-d", "cwd", "-Fn"], { encoding: "utf8" });
    return /^n(.+)$/m.exec(said.stdout ?? "")?.[1] ?? null;
  }
}
// The development servers still alive that work in one folder: the servers a run on that sample
// started. Servers of other runs on this machine, another checkout or a check running at the same
// time, work elsewhere and are not counted.
const servers = (dir) => {
  const own = realpathSync(dir);
  return spawnSync("pgrep", ["-f", "next/dist/bin/next dev --hostname 127.0.0.1"], {
    encoding: "utf8",
  })
    .stdout.trim()
    .split("\n")
    .filter(Boolean)
    .filter((pid) => workingFolder(pid) === own);
};
const installed = existsSync(path.join(ROOT, "node_modules/next/package.json"));

test("each build adapter says how it knows a repository and what its server can do", () => {
  const builds = ADAPTERS.filter((adapter) => adapter.kind === "build");
  assert.deepEqual(
    builds.map((adapter) => adapter.id),
    ["vite", "next.js"],
  );
  for (const adapter of builds) {
    assert.equal(typeof adapter.detect, "function", adapter.id);
    assert.deepEqual(Object.keys(adapter.serves).sort(), ["load", "modules", "transform"]);
  }
  assert.deepEqual(builds[0].serves, { modules: true, load: true, transform: true });
  assert.deepEqual(builds[1].serves, { modules: false, load: false, transform: false });
});

test("a repository is drawn with the build its packages name, the first build when they name none", () => {
  assert.equal(buildOf(packages({ vite: "^8.0.0" })).id, "vite");
  assert.equal(buildOf(packages({ next: "^16.0.0" })).id, "next.js");
  // Both named: the one whose settings file the repository keeps, or that its own development
  // command runs, else the first build in the list, as before there was a second.
  const both = { vite: "^8.0.0", next: "^16.0.0" };
  assert.equal(buildOf(packages(both)).id, "vite");
  assert.equal(buildOf(packages(both, { files: ["next.config.mjs"] })).id, "next.js");
  assert.equal(buildOf(packages(both, { scripts: { dev: "next dev" } })).id, "next.js");
  assert.equal(buildOf(packages(both, { files: ["vite.config.ts"] })).id, "vite");
  // An application that tests with the first build's runner is still built with the second.
  const tested = packages(both, { files: ["next.config.ts", "vitest.config.ts"] });
  assert.equal(buildOf(tested).id, "next.js");
  assert.equal(buildOf(packages(null)).id, "vite");
  const broken = packages(null);
  writeFileSync(path.join(broken, "package.json"), "{ not json");
  assert.equal(buildOf(broken).id, "vite");
  assert.equal(buildOf(ROOT).id, "vite");
});

test("without the packages of its build, a repository is told which is missing", async () => {
  // Neither the build nor the browser is installed: there is nothing to draw with.
  const bare = await openStage(packages({ next: "^16.0.0" }));
  assert.match(bare.problem, /the repository has no browser to draw with/);
  // The browser is there and the build is not: the build is named, not the browser.
  assert.match(
    missingProblem(new Error("Cannot find module 'next/dist/bin/next'"), true),
    /^the repository's own build is not installed \(Cannot find module/,
  );
  assert.match(
    missingProblem(new Error("Cannot find module 'x'"), false),
    /no browser to draw with/,
  );
});

test("the book reads the screens of a repository with no screen list from its ledger of screens", () => {
  const facts = collectFacts(sample());
  assert.deepEqual(
    facts.screens.map((screen) => [screen.path, screen.states]),
    [
      ["/", ["ready"]],
      ["/items", ["ready"]],
    ],
  );
  assert.deepEqual(facts.widths, [390, 1280]);
});

test(
  "a Next.js application is served by its own development server, which closes with the stage",
  { skip: !installed && "next is not installed here" },
  async () => {
    const dir = sample();
    const stage = await openStage(dir);
    assert.equal(stage.problem, undefined, stage.problem);
    try {
      assert.equal(stage.build, "next.js");
      assert.deepEqual(stage.can, { modules: false, load: false, transform: false });
      const page = await stage.browser.newPage();
      await page.goto(`${stage.origin}/items`, { waitUntil: "networkidle" });
      assert.equal(await page.locator("main h1").textContent(), "Items");
      await page.close();
    } finally {
      await stage.close();
    }
    // Once closed, nothing answers there any more.
    await assert.rejects(
      globalThis.fetch(stage.origin, { signal: globalThis.AbortSignal.timeout(3000) }),
    );
  },
);

test(
  "the handoff book draws every screen of a Next.js application at its widths, and says what it did not draw",
  { skip: !installed && "next is not installed here" },
  () => {
    const dir = sample();
    // A screen with no main region: drawn as nothing, and said, while the others are drawn.
    mkdirSync(path.join(dir, "app/plain"), { recursive: true });
    writeFileSync(
      path.join(dir, "app/plain/page.jsx"),
      "export default function Plain() {\n  return <div>Plain</div>;\n}\n",
    );
    writeFileSync(
      path.join(dir, "design/screens.yaml"),
      readFileSync(path.join(dir, "design/screens.yaml"), "utf8").replace(
        "screens:\n",
        "screens:\n  - id: plain\n    route: /plain\n    title: Plain\n    family: list\n    status: built\n    states:\n      - ready\n",
      ),
    );
    const out = path.join(dir, "book-out");
    const drawn = spawnSync(
      execPath,
      [path.join(PLUGIN, "scripts/book.mjs"), "--target", dir, "--out", out, "--json"],
      { encoding: "utf8", timeout: 300000 },
    );
    // A book with a part not drawn is a book all the same, and the call says work is left.
    assert.equal(drawn.status, 1, drawn.stderr);
    const page = readFileSync(path.join(out, "book.html"), "utf8");
    for (const [route, width] of [
      ["/", 390],
      ["/", 1280],
      ["/items", 390],
      ["/items", 1280],
    ]) {
      assert.match(
        page,
        new RegExp(
          `<img src="data:image/png;base64,[^"]{2000,}" alt="${route.replace("/", "\\/")} ready, ${width}px" />`,
        ),
        `${route} at ${width}`,
      );
    }
    const shown = spawnSync(
      execPath,
      [path.join(PLUGIN, "scripts/book.mjs"), "--target", dir, "--out", out],
      { encoding: "utf8", timeout: 300000 },
    );
    assert.match(
      shown.stdout,
      /note: the components are not drawn: this build serves no module of the plugin's own beside the repository's/,
    );
    assert.doesNotMatch(shown.stdout, /no picture was drawn/);
    assert.match(shown.stdout, /note: \/plain was not drawn: it shows no main region/);
    // Each picture is of its own route: the two screens are not one picture twice.
    const picture = (route) =>
      new RegExp(`<img src="(data:image/png;base64,[^"]+)" alt="${route} ready, 1280px"`).exec(
        page,
      )?.[1];
    assert.ok(picture("\\/") && picture("\\/items"));
    assert.notEqual(picture("\\/"), picture("\\/items"));
    // The development server stopped with the book.
    assert.deepEqual(servers(dir), []);
  },
);

test(
  "the sheet's record section says so where the build cannot change a module as it is served",
  { skip: !installed && "next is not installed here" },
  () => {
    const dir = sample();
    mkdirSync(path.join(dir, "src"), { recursive: true });
    const shown = spawnSync(
      execPath,
      [
        path.join(PLUGIN, "scripts/specimen.mjs"),
        "--target",
        dir,
        "--section",
        "record",
        "--out",
        path.join(dir, "sheet"),
      ],
      { encoding: "utf8", timeout: 300000 },
    );
    assert.equal(shown.status, 0, shown.stderr);
    assert.match(
      shown.stdout,
      /no sheet was drawn: this build cannot change a module as it is served/,
    );
    // Known before any server is started: nothing was built in the repository.
    assert.ok(!existsSync(path.join(dir, ".next")));
  },
);

// A stand-in for the build's command, in a folder of its own: it says it is ready and starts a
// worker that ignores a polite stop, or it stops before it is ready.
const FAKE_BIN = `const { spawn } = require("node:child_process");
if (process.env.FAKE_BUILD === "stop") {
  console.log("the stand-in stopped on purpose");
  process.exit(3);
}
const worker = spawn(process.execPath, ["-e", "process.on('SIGTERM', () => {}); setInterval(() => {}, 1000);"], { stdio: "ignore" });
require("node:fs").writeFileSync(process.env.FAKE_WORKER, String(worker.pid));
process.on("SIGTERM", () => process.exit(0));
console.log("Ready in 5ms");
setInterval(() => {}, 1000);
`;
function standIn() {
  const dir = packages({ next: "^16.0.0" });
  const bin = path.join(dir, "node_modules/next/dist/bin");
  mkdirSync(bin, { recursive: true });
  writeFileSync(path.join(dir, "node_modules/next/package.json"), '{ "name": "next" }');
  writeFileSync(path.join(bin, "next.js"), FAKE_BIN);
  return dir;
}
const alive = (pid) => {
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
};

test("closing the build's server stops every process it started, even one that ignores a polite stop", async () => {
  const dir = standIn();
  const marker = path.join(dir, "worker.pid");
  process.env.FAKE_WORKER = marker;
  delete process.env.FAKE_BUILD;
  const server = await nextBuild.serve(createRequire(path.join(dir, "package.json")), dir);
  const worker = Number(readFileSync(marker, "utf8"));
  assert.ok(alive(worker));
  await server.close();
  await server.close();
  await wait(300);
  assert.ok(!alive(worker), "the worker outlived the server");
});

test("a build's server that stops before it is ready says what it said last", async () => {
  const dir = standIn();
  process.env.FAKE_WORKER = path.join(dir, "worker.pid");
  process.env.FAKE_BUILD = "stop";
  try {
    await assert.rejects(
      nextBuild.serve(createRequire(path.join(dir, "package.json")), dir),
      /the development server stopped before it was ready: the stand-in stopped on purpose/,
    );
  } finally {
    delete process.env.FAKE_BUILD;
  }
});

test("a server is counted only in the folder it works in, so a run elsewhere on the machine does not count", async (t) => {
  const here = mkdtempSync(path.join(tmpdir(), "next-servers-here-"));
  const elsewhere = mkdtempSync(path.join(tmpdir(), "next-servers-elsewhere-"));
  // A stand-in for a development server: its command line reads like one, and it waits.
  const standIn = spawn(
    execPath,
    ["-e", "setInterval(() => {}, 1000)", "next/dist/bin/next dev --hostname 127.0.0.1"],
    { cwd: here, stdio: "ignore" },
  );
  t.after(() => {
    standIn.kill();
    rmSync(here, { recursive: true, force: true });
    rmSync(elsewhere, { recursive: true, force: true });
  });
  await wait(300);
  assert.deepEqual(servers(here), [String(standIn.pid)]);
  assert.deepEqual(servers(elsewhere), []);
});
