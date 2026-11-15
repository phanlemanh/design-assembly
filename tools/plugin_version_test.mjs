// The plugin's version goes up with every change a repository receives, held by the gate. Run on
// throwaway repositories with `node --test tools/plugin_version_test.mjs`.
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { execPath } from "node:process";
import { after, test } from "node:test";
import { fileURLToPath } from "node:url";

import { compare, FILES, readNow, versionProblems } from "./plugin_version.mjs";

const SELF = path.join(path.dirname(fileURLToPath(import.meta.url)), "plugin_version.mjs");
const ROOT = path.resolve(path.dirname(SELF), "..");
const TOOL = "plugins/design-assembly/templates/tools/design-assembly";

const made = [];
after(() => made.forEach((dir) => rmSync(dir, { recursive: true, force: true })));

const put = (dir, file, text) => {
  mkdirSync(path.dirname(path.join(dir, file)), { recursive: true });
  writeFileSync(path.join(dir, file), text);
};
const text = (dir, file) => readFileSync(path.join(dir, file), "utf8");
const git = (dir, ...args) => spawnSync("git", ["-C", dir, ...args], { encoding: "utf8" });
const run = (dir, ...args) =>
  spawnSync(execPath, [SELF, "--root", dir, "--base", "origin/main", ...args], {
    encoding: "utf8",
  });

// A repository shaped like this one: the two manifests, a record of releases, the templates and
// scripts of the plugin, and its own copy of the tool.
function repository(version = "0.0.1") {
  const dir = mkdtempSync(path.join(tmpdir(), "plugin-version-"));
  made.push(dir);
  put(dir, FILES.plugin, `{\n  "name": "design-assembly",\n  "version": "${version}"\n}\n`);
  put(
    dir,
    FILES.marketplace,
    `{\n  "name": "x",\n  "plugins": [\n    {\n      "name": "design-assembly",\n      "version": "${version}"\n    }\n  ]\n}\n`,
  );
  put(dir, FILES.releases, `{\n  "about": "For the test.",\n  "releases": []\n}\n`);
  put(dir, `${TOOL}/check.mjs`, "export const check = 1;\n");
  put(dir, "plugins/design-assembly/templates/mk/design-assembly.mk", "x:\n");
  put(dir, "plugins/design-assembly/scripts/status.mjs", "export const status = 1;\n");
  put(dir, "tools/design-assembly/check.mjs", "export const check = 1;\n");
  return dir;
}
// Main as this repository's remote has it: everything committed so far.
function release(dir) {
  for (const args of [
    ["init", "-q"],
    ["add", "-A"],
    ["-c", "user.name=t", "-c", "user.email=t@t", "commit", "-q", "-m", "release"],
    ["update-ref", "refs/remotes/origin/main", "HEAD"],
  ]) {
    const done = git(dir, ...args);
    assert.equal(done.status, 0, done.stderr);
  }
}

test("this repository's version is the one recorded for what a repository receives", () => {
  const checked = spawnSync(execPath, [SELF], { encoding: "utf8" });
  assert.equal(checked.status, 0, checked.stderr);
  const now = readNow(ROOT);
  assert.equal(now.releases.at(-1).version, now.plugin);
});

test("a version is recorded once, and the gate is green on it", (t) => {
  const dir = repository();
  const unrecorded = run(dir);
  assert.equal(unrecorded.status, 1);
  assert.match(unrecorded.stderr, /records no version: run make plugin-version VERSION=0\.0\.1/);
  const bumped = run(dir, "--bump", "0.1.0");
  assert.equal(bumped.status, 0, bumped.stderr);
  // Both manifests say it, the record holds the three trees, and the repository's stamp follows.
  assert.match(text(dir, FILES.plugin), /"version": "0\.1\.0"/);
  assert.match(text(dir, FILES.marketplace), /"version": "0\.1\.0"/);
  const [record] = JSON.parse(text(dir, FILES.releases)).releases;
  assert.deepEqual(Object.keys(record), ["version", "templates", "scripts", "tool"]);
  assert.equal(record.version, "0.1.0");
  assert.deepEqual(JSON.parse(text(dir, FILES.stamp)), { version: "0.1.0", tree: record.tool });
  if (git(dir, "--version").status !== 0) return t.skip("git is not here");
  const green = run(dir);
  assert.equal(green.status, 0, green.stderr);
  assert.match(green.stdout, /cannot be seen here/);
});

test("a template changed without a bump turns the gate red, and the bump turns it green", (t) => {
  if (spawnSync("git", ["--version"]).status !== 0) return t.skip("git is not here");
  const dir = repository();
  assert.equal(run(dir, "--bump", "0.1.0").status, 0);
  release(dir);
  assert.equal(run(dir).status, 0, run(dir).stderr);

  // One byte of a template, and of this repository's copy, so that only the version is wrong.
  put(dir, `${TOOL}/check.mjs`, "export const check = 2;\n");
  put(dir, "tools/design-assembly/check.mjs", "export const check = 2;\n");
  const red = run(dir);
  assert.equal(red.status, 1);
  assert.match(
    red.stderr,
    /templates\/tools\/design-assembly changed after version 0\.1\.0 was released: .*make plugin-version VERSION=<next>/,
  );
  // A released version is never recorded again.
  const again = run(dir, "--bump", "0.1.0");
  assert.equal(again.status, 1);
  assert.match(again.stderr, /0\.1\.0 is released on main/);
  assert.equal(run(dir, "--bump", "0.0.9").status, 1);
  // The next version records the new trees, and the gate is green again.
  assert.equal(run(dir, "--bump", "0.1.1").status, 0);
  const green = run(dir);
  assert.equal(green.status, 0, green.stderr);
  const versions = JSON.parse(text(dir, FILES.releases)).releases.map((item) => item.version);
  assert.deepEqual(versions, ["0.1.0", "0.1.1"]);

  // A script a repository runs counts too.
  put(dir, "plugins/design-assembly/scripts/status.mjs", "export const status = 2;\n");
  assert.match(run(dir).stderr, /scripts changed after version 0\.1\.1 was recorded/);
  // Not yet released, so it is recorded again in place.
  assert.equal(run(dir, "--bump", "0.1.1").status, 0);
  assert.equal(run(dir).status, 0);
  assert.equal(JSON.parse(text(dir, FILES.releases)).releases.length, 2);
});

test("what else holds the version: two manifests that agree, a record that only goes up, a released row never rewritten, and the repository's copy of the tool", () => {
  const dir = repository();
  run(dir, "--bump", "0.1.0");
  const now = readNow(dir);
  assert.deepEqual(versionProblems(now, null), []);
  assert.match(
    versionProblems({ ...now, marketplace: "0.0.1" }, null)[0],
    /marketplace\.json gives version 0\.0\.1, .*plugin\.json gives 0\.1\.0/,
  );
  const older = { ...now.releases[0], version: "0.0.5" };
  assert.ok(
    versionProblems({ ...now, releases: [now.releases[0], older] }, null).some((line) =>
      /0\.0\.5 is recorded after 0\.1\.0: versions only go up/.test(line),
    ),
  );
  const rewritten = [{ ...now.releases[0], tool: "0".repeat(40) }];
  assert.ok(
    versionProblems(now, rewritten).some((line) => /released on main with other trees/.test(line)),
  );
  assert.ok(
    versionProblems({ ...now, copy: "1".repeat(40) }, null).some((line) =>
      /tools\/design-assembly is not the plugin's tool/.test(line),
    ),
  );
  assert.ok(
    versionProblems({ ...now, stamp: null }, null).some((line) =>
      /tool-stamp\.json does not stamp version 0\.1\.0/.test(line),
    ),
  );
  assert.ok(compare("0.10.0", "0.9.9") > 0 && compare("1.0.0", "1.0.0") === 0);
});
