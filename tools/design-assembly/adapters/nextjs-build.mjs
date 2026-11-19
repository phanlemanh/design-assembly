// The build adapter for Next.js: the repository's own development server, taken from its packages
// and run as the repository runs it, on a free port of this machine only. Unlike a server that
// runs inside this process, it cannot serve a module of the plugin's own beside the repository's,
// load one of the repository's modules for the plugin, or change a module as it is served: it
// says so in `serves`, and the scripts that need those say what they could not draw.
import { spawn } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { createServer } from "node:net";
import path from "node:path";
import process from "node:process";
import { setTimeout as wait } from "node:timers/promises";

// How long the server may take to say it is ready, and to stop once asked.
const READY_MS = 120_000;
const STOP_MS = 5_000;
const READY = /\bReady in\b/;

export const adapter = {
  // Named for its library, as every adapter is; the routes adapter of the same library is `nextjs`.
  id: "next.js",
  kind: "build",
  names: ["next.js", "nextjs"],
  serves: { modules: false, load: false, transform: false },
  detect,
  serve,
};

// How surely the repository builds with Next.js: 2 when it keeps Next.js's settings file or its
// own development command runs it, 1 when its packages only name it, 0 when they do not.
function detect(root) {
  let data;
  try {
    data = JSON.parse(readFileSync(path.join(root, "package.json"), "utf8"));
  } catch {
    return 0;
  }
  if (!(data.dependencies?.next ?? data.devDependencies?.next)) return 0;
  const settings = ["js", "mjs", "cjs", "ts", "mts"].some((ext) =>
    existsSync(path.join(root, `next.config.${ext}`)),
  );
  return settings || /^next\b/.test(String(data.scripts?.dev ?? "")) ? 2 : 1;
}

// A port nothing listens on now, on this machine only.
function freePort() {
  return new Promise((done, fail) => {
    const probe = createServer();
    probe.once("error", fail);
    probe.listen(0, "127.0.0.1", () => {
      const { port } = probe.address();
      probe.close(() => done(port));
    });
  });
}

const lastLine = (text) =>
  text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .at(-1) ?? "it said nothing";

// Opens the server: `require` resolves from the repository, and a build that is not installed
// throws as resolving does. Returns the origin and a way to close; it loads no module for the
// plugin. The server and the workers it starts are one group, stopped together on every way out:
// once closed, when it stops before it is ready, and when this process ends without closing it.
// A group of processes is a thing of macOS and Linux; on Windows the server is not stopped.
async function serve(require, target) {
  const bin = require.resolve("next/dist/bin/next");
  const port = await freePort();
  const child = spawn(
    process.execPath,
    [bin, "dev", "--hostname", "127.0.0.1", "--port", String(port)],
    {
      cwd: target,
      env: { ...process.env, NEXT_TELEMETRY_DISABLED: "1" },
      stdio: ["ignore", "pipe", "pipe"],
      detached: true,
    },
  );
  let said = "";
  let failed = null;
  child.stdout.on("data", (chunk) => (said += chunk));
  child.stderr.on("data", (chunk) => (said += chunk));
  child.once("error", (error) => (failed = error));
  const exited = new Promise((done) => child.once("close", done));
  const gone = () => child.exitCode !== null || child.signalCode !== null;
  const stop = (signal) => {
    try {
      process.kill(-child.pid, signal);
    } catch {
      // The group is gone already.
    }
  };
  // This process may end without closing: the group goes with it.
  const onExit = () => stop("SIGKILL");
  process.once("exit", onExit);
  let closed = false;
  const close = async () => {
    if (closed) return;
    closed = true;
    process.off("exit", onExit);
    if (child.pid === undefined) return;
    if (!gone()) {
      stop("SIGTERM");
      await Promise.race([exited, wait(STOP_MS)]);
    }
    // A worker may outlive its leader: the last word to the group is always the strongest.
    stop("SIGKILL");
  };
  const started = Date.now();
  while (!READY.test(said)) {
    if (failed) {
      await close();
      throw new Error(`the development server could not start: ${failed.message}`);
    }
    if (gone()) {
      await close();
      throw new Error(`the development server stopped before it was ready: ${lastLine(said)}`);
    }
    if (Date.now() - started > READY_MS) {
      await close();
      throw new Error(`the development server was not ready within ${READY_MS / 1000} seconds`);
    }
    await wait(200);
  }
  return { origin: `http://127.0.0.1:${port}`, load: null, close };
}
