// A repository that keeps its ledger of screens as one file per screen may also keep a copy of the
// ledger as one file at the old path, for its own tools and tests that read that path. The copy is
// derived: the folder is the ledger, the copy is written from it and kept out of git. It is the
// repository's choice, off until it asks. One command writes every derived file a repository keeps
// out of git, so it can run before anything of the repository's own reads one; the gate runs it
// first, and the plugin's make step runs it before the tests when the tests are a step of the gate.
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  unlinkSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { execPath } from "node:process";
import { after, test } from "node:test";
import { fileURLToPath } from "node:url";

import { fragmentsProblem } from "../templates/tools/design-assembly/check.mjs";
import { ledgerText, readFragments } from "../templates/tools/design-assembly/screen-fragments.mjs";
import { readScreenLedger } from "../templates/tools/design-assembly/screen-ledger.mjs";
import { floorFiles } from "./helpers/guided-repo.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const PLUGIN = path.resolve(HERE, "..");
const APPLY = path.join(PLUGIN, "scripts/apply.mjs");
const LEDGER = "design/screens.yaml";
const FOLDER = "design/screens";
const IGNORE = `\n# Written from ${FOLDER} by the design gate\n${LEDGER}\n`;

const made = [];
after(() => made.forEach((dir) => rmSync(dir, { recursive: true, force: true })));

function folder(files) {
  const dir = mkdtempSync(path.join(tmpdir(), "design-assembly-copy-"));
  made.push(dir);
  for (const [file, content] of Object.entries(files)) {
    mkdirSync(path.dirname(path.join(dir, file)), { recursive: true });
    writeFileSync(path.join(dir, file), content);
  }
  return dir;
}

const run = (script, ...args) => spawnSync(execPath, [script, ...args], { encoding: "utf8" });
const tool = (dir, name, ...args) =>
  run(path.join(dir, "tools/design-assembly", name), "--target", dir, ...args);
const check = (dir) => tool(dir, "check.mjs");
const fragments = (dir, ...args) => tool(dir, "screen-fragments.mjs", ...args);
const derived = (dir, ...args) => tool(dir, "derived.mjs", ...args);
const text = (dir, file) => readFileSync(path.join(dir, file), "utf8");
const has = (dir, file) => existsSync(path.join(dir, file));
const git = (dir, ...args) =>
  spawnSync(
    "git",
    ["-C", dir, "-c", "user.name=test", "-c", "user.email=test@example.com", ...args],
    { encoding: "utf8" },
  );
const shapeChecks = (dir) => JSON.parse(text(dir, "design/theme.json")).checks["ledger-shapes"];
const kindsOf = (dir) => shapeChecks(dir).map((item) => item.kind);

// A repository the guide built, in git, with its ledger of screens split and committed.
function split() {
  const dir = folder(floorFiles());
  const said = run(APPLY, "--target", dir);
  assert.equal(said.status, 0, said.stderr);
  assert.equal(git(dir, "init", "-q").status, 0);
  assert.equal(fragments(dir, "--split").status, 0);
  git(dir, "add", "-A");
  assert.equal(git(dir, "commit", "-q", "-m", "split").status, 0);
  assert.equal(check(dir).status, 0, check(dir).stderr);
  return dir;
}

// The same, with the copy asked for and its file ignored by git, as a person finishes it.
function copied() {
  const dir = split();
  const asked = fragments(dir, "--copy");
  assert.equal(asked.status, 0, asked.stderr);
  writeFileSync(path.join(dir, ".gitignore"), IGNORE);
  const held = check(dir);
  assert.equal(held.status, 0, held.stderr);
  return dir;
}

test("a repository that keeps fragments and never asked for a copy gets no file at the old path", () => {
  const dir = split();
  assert.ok(!has(dir, LEDGER), "the gate wrote the one file");
  assert.deepEqual(kindsOf(dir), ["shapes", "screen-fragments"]);
  const drawn = derived(dir);
  assert.equal(drawn.status, 0, drawn.stderr);
  assert.match(drawn.stdout, /keeps no derived file out of git/);
  assert.ok(!has(dir, LEDGER), "the command wrote the one file");
});

test("asked for, the copy is written by the gate from the folder and kept out of git", () => {
  const dir = split();
  const asked = fragments(dir, "--copy");
  assert.equal(asked.status, 0, asked.stderr);
  assert.match(asked.stdout, new RegExp(`add ${LEDGER} to \\.gitignore`));
  assert.deepEqual(kindsOf(dir), ["shapes", "screen-fragments", "untracked"]);
  assert.deepEqual(
    shapeChecks(dir).find((item) => item.kind === "untracked"),
    { kind: "untracked", file: LEDGER },
  );
  // The person has not ignored it yet: the gate writes the copy and says what is left.
  const red = check(dir);
  assert.equal(red.status, 1);
  assert.match(red.stderr, new RegExp(`${LEDGER} is kept out of git, but git does not ignore it`));
  assert.equal(text(dir, LEDGER), ledgerText(dir, LEDGER));
  writeFileSync(path.join(dir, ".gitignore"), IGNORE);
  const green = check(dir);
  assert.equal(green.status, 0, green.stderr);
  // The copy is the ledger as one text, in the order of the ids.
  const copy = readScreenLedger(text(dir, LEDGER)).screens.map((screen) => screen.id);
  assert.deepEqual(copy, [...copy].sort());
  assert.equal(git(dir, "status", "--porcelain").stdout.includes(LEDGER), false);
});

test("the copy follows the folder: a changed fragment is in it at the next run, a hand edit is not kept", () => {
  const dir = copied();
  const [first] = readFragments(dir, LEDGER).fragments;
  writeFileSync(
    path.join(dir, first.file),
    text(dir, first.file).replace(/^title: .*$/m, "title: renamedTitle"),
  );
  const drawn = check(dir);
  assert.equal(drawn.status, 0, drawn.stderr);
  assert.match(drawn.stdout, new RegExp(`wrote ${LEDGER} again`));
  assert.match(text(dir, LEDGER), /title: renamedTitle/);
  writeFileSync(path.join(dir, LEDGER), `${text(dir, LEDGER)}# a hand edit\n`);
  assert.equal(check(dir).status, 0);
  assert.equal(text(dir, LEDGER), ledgerText(dir, LEDGER));
});

test("one command writes every derived file before anything else reads one, and says what it wrote", () => {
  const dir = copied();
  unlinkSync(path.join(dir, LEDGER));
  const drawn = derived(dir);
  assert.equal(drawn.status, 0, drawn.stderr);
  assert.match(drawn.stdout, new RegExp(`wrote ${LEDGER} from ${FOLDER}`));
  assert.equal(text(dir, LEDGER), ledgerText(dir, LEDGER));
  // Run again, it has nothing to write.
  const again = derived(dir);
  assert.equal(again.status, 0, again.stderr);
  assert.doesNotMatch(again.stdout, /wrote/);
  assert.match(again.stdout, /up to date/);
});

test("a clean clone has no copy until the command or the gate writes it", () => {
  const dir = copied();
  git(dir, "add", "-A");
  assert.equal(git(dir, "commit", "-q", "-m", "copy").status, 0);
  const clone = mkdtempSync(path.join(tmpdir(), "design-assembly-clone-"));
  made.push(clone);
  rmSync(clone, { recursive: true });
  assert.equal(spawnSync("git", ["clone", "-q", dir, clone]).status, 0);
  assert.ok(!has(clone, LEDGER), "git carried the copy");
  const drawn = derived(clone);
  assert.equal(drawn.status, 0, drawn.stderr);
  assert.equal(text(clone, LEDGER), ledgerText(clone, LEDGER));
  assert.equal(check(clone).status, 0, check(clone).stderr);
});

test("the fragments check names a copy that differs from the folder, in a state read without writing it first", () => {
  const found = {
    folder: FOLDER,
    shared: "version: 1\n",
    fragments: [],
    beside: true,
    besideText: "version: 1\nscreens: []\n# by hand\n",
  };
  const fragmentsCheck = { kind: "screen-fragments", file: LEDGER, fragments: FOLDER };
  // Not asked for: two sources, as before.
  assert.match(fragmentsProblem(found, fragmentsCheck, null), /two sources/);
  // Asked for and differing: the folder is the ledger, so the change goes there.
  assert.match(
    fragmentsProblem(found, fragmentsCheck, "version: 1\nscreens: []\n"),
    /differs from design\/screens: the folder is the ledger/,
  );
  // Asked for and the same: nothing to say.
  assert.equal(
    fragmentsProblem(
      { ...found, besideText: "version: 1\nscreens: []\n" },
      fragmentsCheck,
      "version: 1\nscreens: []\n",
    ),
    null,
  );
});

test("a copy cannot be asked for where the ledger is one file, or where no gate holds it", () => {
  const one = folder(floorFiles());
  assert.equal(run(APPLY, "--target", one).status, 0);
  const theme = text(one, "design/theme.json");
  const refused = fragments(one, "--copy");
  assert.equal(refused.status, 1);
  assert.match(refused.stderr, /--split first/);
  assert.equal(text(one, "design/theme.json"), theme);
  // A ledger in fragments that no gate holds: nothing would write the copy.
  const bare = folder({ [LEDGER]: "version: 1\nscreens:\n  - id: a\n    route: /\n" });
  // No tool installed there: the plugin's own command is asked.
  const own = path.join(PLUGIN, "templates/tools/design-assembly/screen-fragments.mjs");
  assert.equal(run(own, "--target", bare, "--split").status, 0);
  const none = run(own, "--target", bare, "--copy");
  assert.equal(none.status, 1);
  assert.match(none.stderr, /no gate here holds the ledger of screens/);
  assert.ok(!has(bare, LEDGER));
});

test("--no-copy takes the choice back and takes away a copy that matches the folder", () => {
  const dir = copied();
  const back = fragments(dir, "--no-copy");
  assert.equal(back.status, 0, back.stderr);
  assert.deepEqual(kindsOf(dir), ["shapes", "screen-fragments"]);
  assert.ok(!has(dir, LEDGER), "the copy is still there beside the folder");
  assert.match(back.stdout, /\.gitignore/);
  assert.equal(check(dir).status, 0, check(dir).stderr);
  // Asked again, nothing changes.
  const theme = text(dir, "design/theme.json");
  assert.equal(fragments(dir, "--no-copy").status, 0);
  assert.equal(text(dir, "design/theme.json"), theme);
});

test("asking twice changes nothing, and the two flags together are refused", () => {
  const dir = copied();
  const theme = text(dir, "design/theme.json");
  assert.equal(fragments(dir, "--copy").status, 0);
  assert.equal(text(dir, "design/theme.json"), theme);
  const both = fragments(dir, "--copy", "--no-copy");
  assert.equal(both.status, 1);
  assert.equal(text(dir, "design/theme.json"), theme);
});

test("joining with a copy puts the one file in its place and takes both choices back", () => {
  const dir = copied();
  const before = ledgerText(dir, LEDGER);
  const joined = fragments(dir, "--join");
  assert.equal(joined.status, 0, joined.stderr);
  assert.equal(text(dir, LEDGER), before);
  assert.ok(!has(dir, FOLDER), "the fragments are still there");
  assert.deepEqual(kindsOf(dir), ["shapes"]);
  assert.match(joined.stdout, new RegExp(`take ${LEDGER} out of \\.gitignore`));
});

test("a copy edited by hand is not joined over: the command refuses and changes nothing", () => {
  const dir = copied();
  writeFileSync(path.join(dir, LEDGER), `${text(dir, LEDGER)}# a hand edit\n`);
  const theme = text(dir, "design/theme.json");
  const refused = fragments(dir, "--join");
  assert.equal(refused.status, 1);
  assert.match(refused.stderr, /beside design\/screens/);
  assert.ok(has(dir, FOLDER));
  assert.equal(text(dir, "design/theme.json"), theme);
});

test("the choice outlives the next run of the guide", () => {
  const dir = copied();
  assert.equal(run(APPLY, "--target", dir).status, 0);
  assert.deepEqual(kindsOf(dir), ["shapes", "screen-fragments", "untracked"]);
  assert.equal(check(dir).status, 0, check(dir).stderr);
});

test("a repository that adopted keeps a copy the same way, and adopting again leaves the choice alone", () => {
  const ledger = [
    "version: 1",
    "statuses:",
    "  - built",
    "screens:",
    ...["archive", "items"].flatMap((id) => [
      `  - id: ${id}`,
      `    route: ${id === "items" ? "/" : "/archive"}`,
      "    title: null",
      "    family: list",
      "    status: built",
      "    states:",
      "      - ready",
    ]),
    "",
  ].join("\n");
  const dir = folder(floorFiles({ [LEDGER]: ledger }));
  // Adopting leaves work for a person, so it ends with 1.
  assert.equal(run(path.join(PLUGIN, "scripts/adopt.mjs"), "--target", dir).status, 1);
  assert.equal(git(dir, "init", "-q").status, 0);
  assert.equal(fragments(dir, "--split").status, 0);
  assert.equal(fragments(dir, "--copy").status, 0);
  writeFileSync(path.join(dir, ".gitignore"), IGNORE);
  assert.equal(check(dir).status, 0, check(dir).stderr);
  assert.equal(text(dir, LEDGER), ledgerText(dir, LEDGER));
  const theme = text(dir, "design/theme.json");
  assert.equal(run(path.join(PLUGIN, "scripts/adopt.mjs"), "--target", dir).status, 1);
  assert.equal(text(dir, "design/theme.json"), theme);
  assert.deepEqual(kindsOf(dir), ["shapes", "screen-fragments", "untracked"]);
  assert.equal(check(dir).status, 0, check(dir).stderr);
});

// A Makefile of the floor's kind: the gate's steps in one list, the steps of the setup appended.
const makefile = (steps) =>
  [
    `CHECK_TARGETS := ${steps}`,
    "-include mk/*.mk",
    "test:",
    `\t@test -f ${LEDGER} && echo test-saw-the-copy`,
    "check: $(CHECK_TARGETS)",
    "",
  ].join("\n");

test("the plugin's make step writes the derived files before the tests when they are a step of the gate", () => {
  const dir = copied();
  writeFileSync(path.join(dir, "Makefile"), makefile("test"));
  unlinkSync(path.join(dir, LEDGER));
  const ran = spawnSync("make", ["-s", "test"], { cwd: dir, encoding: "utf8" });
  assert.equal(ran.status, 0, ran.stderr);
  assert.match(ran.stdout, /test-saw-the-copy/);
});

test("where the tests are not a step of the gate, the make step leaves them alone", () => {
  const dir = copied();
  writeFileSync(path.join(dir, "Makefile"), makefile("lint"));
  unlinkSync(path.join(dir, LEDGER));
  const ran = spawnSync("make", ["-s", "test"], { cwd: dir, encoding: "utf8" });
  assert.notEqual(ran.status, 0, "the tests ran with the copy written");
  assert.ok(!has(dir, LEDGER));
});

test("a repository that keeps nothing out of git sees no change on make test, even with an older tool", () => {
  const dir = split();
  writeFileSync(
    path.join(dir, "Makefile"),
    ["CHECK_TARGETS := test", "-include mk/*.mk", "test:", "\t@echo ran-the-tests", ""].join("\n"),
  );
  const quiet = spawnSync("make", ["-s", "test"], { cwd: dir, encoding: "utf8" });
  assert.equal(quiet.status, 0, quiet.stderr);
  assert.equal(quiet.stdout, "ran-the-tests\n");
  // A tool installed before the command was: the step is skipped, the tests still run.
  unlinkSync(path.join(dir, "tools/design-assembly/derived.mjs"));
  const older = spawnSync("make", ["-s", "test"], { cwd: dir, encoding: "utf8" });
  assert.equal(older.status, 0, older.stderr);
  assert.equal(older.stdout, "ran-the-tests\n");
});

test("tool data that is not JSON is named by the command and by the gate, with nothing written", () => {
  const dir = copied();
  unlinkSync(path.join(dir, LEDGER));
  writeFileSync(path.join(dir, "design/theme.json"), "{not json");
  for (const said of [derived(dir), check(dir)]) {
    assert.equal(said.status, 1);
    assert.match(said.stderr, /design\/theme\.json is not JSON/);
    assert.doesNotMatch(said.stderr, /^\s+at /m, "a stack trace reached the person");
  }
  assert.ok(!has(dir, LEDGER));
});
