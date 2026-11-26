// No test of the plugin reads the machine's real list of cores, or one the environment names: every
// test file loads tests/helpers/own-cores.mjs before anything else, and that gives its process, and
// every process it starts, a list of its own. Shown in two ways: each file loads it first, and the
// adopt tests pass with the environment naming a list that knows a core locking the source colour
// and the home folder holding such a list where the real one would be.
import "./helpers/own-cores.mjs";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import path from "node:path";
import { env, execPath } from "node:process";
import { after, test } from "node:test";

import { OWN_CORES } from "./helpers/own-cores.mjs";
import { BUILT_ON, cleanup, coreFolder, empty, json, PLUGIN } from "./helpers/core-family.mjs";

after(cleanup);

const TESTS = path.join(PLUGIN, "tests");
const FIRST = 'import "./helpers/own-cores.mjs";';

test("every test file loads its own list of cores before anything else", () => {
  const files = readdirSync(TESTS).filter((name) => /^test-.*\.mjs$/.test(name));
  assert.ok(files.length > 0);
  const late = files.filter((name) => {
    const imports = readFileSync(path.join(TESTS, name), "utf8")
      .split("\n")
      .filter((line) => line.startsWith("import "));
    return imports[0] !== FIRST;
  });
  assert.deepEqual(late, []);
  // The list is a file of this test's own, not the person's.
  assert.equal(env.DESIGN_ASSEMBLY_CORES, OWN_CORES);
  assert.ok(!OWN_CORES.startsWith(path.join(homedir(), ".config")));
});

test("the adopt tests pass whatever list of cores the environment names, and read none under the home folder", () => {
  // A list that knows a core locking the source colour: named by the environment, and kept where
  // the real list would be, under a home folder of this test's own.
  const place = coreFolder({ name: "ambient-core" });
  const list = (file) => {
    mkdirSync(path.dirname(file), { recursive: true });
    writeFileSync(
      file,
      json({
        version: 1,
        cores: [{ family: "Fam Ambient", path: place, on: BUILT_ON, how: "built" }],
        declined: [],
      }),
    );
    return file;
  };
  const home = empty();
  const named = list(path.join(empty(), "cores.json"));
  list(path.join(home, ".config/design-assembly/cores.json"));
  // The test runner tells a process it starts that it runs under it; the run below is a run of its
  // own, which reports as one.
  const outside = Object.fromEntries(
    Object.entries(env).filter(([name]) => name !== "NODE_TEST_CONTEXT"),
  );
  const done = spawnSync(
    execPath,
    ["--test", "--test-reporter=spec", path.join(TESTS, "test-adopt.mjs")],
    {
      encoding: "utf8",
      env: {
        ...outside,
        DESIGN_ASSEMBLY_CORES: named,
        HOME: home,
        XDG_CONFIG_HOME: path.join(home, ".config"),
      },
    },
  );
  assert.equal(
    done.status,
    0,
    done.stdout
      .split("\n")
      .filter((line) => /^✖/.test(line))
      .join("\n"),
  );
  assert.match(done.stdout, /^ℹ fail 0$/m);
});
