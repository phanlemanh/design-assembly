// The one line at the start of a session (spec 0016, criterion 18 and answer 12): the plugin's first
// hook prints at most one line, and only when something about the family's core waits in the
// repository the session opened; in every other case it prints nothing, and whatever goes wrong it
// ends with 0. It calls no model, no network and no git. Fixtures only, each with a list of cores
// of its own.
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import { env, execPath } from "node:process";
import { after, test } from "node:test";

import {
  adopted,
  change,
  cleanup,
  COPY,
  core,
  coreFolder,
  DECLARATION,
  empty,
  FAMILY,
  floor,
  git,
  guided,
  join,
  json,
  listIn,
  member,
  MEMBER,
  noMakefile,
  OTHER,
  PLUGIN,
  put,
  read,
  run,
  snapshot,
} from "./helpers/core-family.mjs";

after(cleanup);

const SCRIPT = path.join(PLUGIN, "scripts/session-line.mjs");
const NO_NETWORK = path.join(PLUGIN, "tests/helpers/no-network.mjs");
const HOOKS = path.join(PLUGIN, "hooks/hooks.json");
// Runs the script the hook runs, in a folder, as a session would: the folder is the project.
const line = (dir, list, { args = [], extra = {}, guard = false } = {}) =>
  spawnSync(execPath, [...(guard ? ["--import", NO_NETWORK] : []), SCRIPT, ...args], {
    encoding: "utf8",
    cwd: dir,
    env: { ...env, CLAUDE_PROJECT_DIR: dir, DESIGN_ASSEMBLY_CORES: list, ...extra },
  });
// Nothing said, nothing wrong.
const silent = (done, what) => {
  assert.equal(done.status, 0, `${what}: ${done.stderr}`);
  assert.equal(done.stdout, "", what);
  assert.equal(done.stderr, "", what);
};
const oneLine = (done) => {
  assert.equal(done.status, 0, done.stderr);
  assert.equal(done.stderr, "");
  assert.equal(done.stdout.split("\n").length, 2, "one line, and its end");
  assert.ok(done.stdout.startsWith("design-assembly: "));
  return done.stdout.trimEnd();
};
const moveCore = (place, list) =>
  change(place, list, "record-panel", [
    "--hold",
    "default",
    "--why",
    "one app opens records in place",
  ]);

// ---- the silent cases --------------------------------------------------------------------------

test("silent on a repository of no family, of every kind, and on a folder that is no repository", () => {
  // A machine that holds a core: a repository that stands alone is still told nothing.
  const list = listIn();
  writeFileSync(
    list,
    json({
      version: 1,
      cores: [{ family: FAMILY, path: coreFolder(), on: "2026-11-26", how: "built" }],
      declined: [],
    }),
  );
  const kinds = { "no ledgers": () => floor(), adopted, guided, "no Makefile": noMakefile };
  for (const [kind, make] of Object.entries(kinds)) {
    const dir = make();
    const before = snapshot(dir);
    silent(line(dir, list), kind);
    silent(line(dir, list, { args: ["--hook"] }), `${kind}, as the hook`);
    silent(line(dir, listIn()), `${kind}, no list`);
    assert.deepEqual(snapshot(dir), before, kind);
  }
  // A folder that is no repository, and one that does not exist.
  silent(line(empty(), list), "an empty folder");
  const gone = path.join(empty(), "gone");
  silent(
    spawnSync(execPath, [SCRIPT, "--hook"], {
      encoding: "utf8",
      env: { ...env, CLAUDE_PROJECT_DIR: gone, DESIGN_ASSEMBLY_CORES: list },
    }),
    "a folder that is not there",
  );
});

test("silent on a member where nothing waits, and where the core cannot be looked at", () => {
  const { dir, place, list } = member();
  silent(line(dir, list), "the core is where it was pinned");
  moveCore(place, list);
  // The core moved, and this machine cannot look: no list, a list nobody reads, a folder gone.
  silent(line(dir, listIn()), "no list");
  const broken = listIn();
  writeFileSync(broken, "{ not json");
  silent(line(dir, broken), "a broken list");
  const lost = listIn();
  writeFileSync(
    lost,
    json({
      version: 1,
      cores: [
        { family: FAMILY, path: path.join(empty(), "gone"), on: "2026-11-26", how: "pinned" },
      ],
      declined: [],
    }),
  );
  silent(line(dir, lost), "a core folder that is gone");
  // A core whose answers cannot be read says nothing either.
  writeFileSync(path.join(place, "answers.json"), "{ not json");
  silent(line(dir, list), "a core that cannot be read");
});

test("never fails a session: a broken copy, a broken declaration, a broken waiting list, and no git", () => {
  const { dir, place, list } = member();
  moveCore(place, list);
  assert.match(oneLine(line(dir, list)), /is ahead of this repository's pin/);

  // No git on this machine: the same line, read from the folder alone.
  const noGit = line(dir, list, { extra: { PATH: path.join(empty(), "no-such-bin") } });
  assert.match(oneLine(noGit), /is ahead of this repository's pin/);

  // A waiting list nobody can read stops no other part of the line.
  put(dir, "design/waiting-list.json", "{ not json");
  assert.match(oneLine(line(dir, list)), /is ahead of this repository's pin/);
  rmSync(path.join(dir, "design/waiting-list.json"));

  // A copy that differs from its hashes: the repository inherits nothing, and the line is silent.
  const copy = path.join(dir, COPY, "answers.json");
  const kept = readFileSync(copy, "utf8");
  writeFileSync(copy, kept.replace("locked", "default"));
  silent(line(dir, list), "a copy that differs from its hashes");
  writeFileSync(copy, "{ not json");
  silent(line(dir, list), "a copy that is not JSON");
  writeFileSync(copy, kept);
  // A declaration that is not JSON, and one that is a folder.
  const declared = readFileSync(path.join(dir, DECLARATION), "utf8");
  writeFileSync(path.join(dir, DECLARATION), "{ not json");
  silent(line(dir, list), "a declaration that is not JSON");
  rmSync(path.join(dir, DECLARATION));
  mkdirSync(path.join(dir, DECLARATION));
  silent(line(dir, list), "a declaration that is a folder");
  rmSync(path.join(dir, DECLARATION), { recursive: true });
  writeFileSync(path.join(dir, DECLARATION), declared);
  assert.match(oneLine(line(dir, list)), /is ahead of this repository's pin/);
});

// ---- the three things that wait ----------------------------------------------------------------

test("one line when the core moved ahead of the pin; the hook hands it to the person and to the session", () => {
  const { dir, place, list } = member();
  moveCore(place, list);
  const before = snapshot(dir);
  const said = oneLine(line(dir, list));
  assert.equal(
    said,
    `design-assembly: the family core ${FAMILY} is ahead of this repository's pin (1 answer changed). core --moved shows each change, and nothing here changes until a person accepts.`,
  );
  // As the hook: one line of JSON, the line shown to the person and added to the session's context.
  const hook = line(dir, list, { args: ["--hook"] });
  assert.equal(hook.status, 0, hook.stderr);
  assert.equal(hook.stdout.split("\n").length, 2);
  assert.deepEqual(JSON.parse(hook.stdout), {
    systemMessage: said,
    hookSpecificOutput: { hookEventName: "SessionStart", additionalContext: said },
  });
  // From a folder inside the repository the same repository is found.
  mkdirSync(path.join(dir, "src/deep"), { recursive: true });
  const inside = spawnSync(execPath, [SCRIPT], {
    encoding: "utf8",
    cwd: path.join(dir, "src/deep"),
    env: { ...env, CLAUDE_PROJECT_DIR: "", DESIGN_ASSEMBLY_CORES: list },
  });
  assert.equal(inside.stdout, "", "outside git the folder itself is the repository");
  git(dir, "init", "-q", "-b", "main");
  const within = spawnSync(execPath, [SCRIPT], {
    encoding: "utf8",
    cwd: path.join(dir, "src/deep"),
    env: { ...env, CLAUDE_PROJECT_DIR: "", DESIGN_ASSEMBLY_CORES: list },
  });
  assert.equal(within.stdout.trimEnd(), said);
  rmSync(path.join(dir, ".git"), { recursive: true });
  rmSync(path.join(dir, "src/deep"), { recursive: true });
  // The line writes nothing, and reaches for no network.
  assert.deepEqual(snapshot(dir), before);
  const log = path.join(empty(), "network.log");
  const guarded = line(dir, list, { guard: true, extra: { DESIGN_ASSEMBLY_NETWORK_LOG: log } });
  assert.equal(guarded.stdout.trimEnd(), said);
  assert.ok(!existsSync(log), "the network was reached");
});

test("one line when a question about the core waits on the owner, and when a locked answer is held otherwise", () => {
  // Joining a core that locks another colour: a question waits.
  const dir = adopted();
  const place = coreFolder({ colour: OTHER });
  const list = listIn();
  assert.equal(join(dir, place, list).status, 1);
  assert.equal(
    oneLine(line(dir, list)),
    "design-assembly: 1 question about the core waits on the owner. decide shows the decision sheet.",
  );
  // The owner's reason given in the session closes the question: nothing is said from then on.
  const twin = adopted();
  const twinList = listIn();
  assert.equal(join(twin, coreFolder({ colour: OTHER }), twinList).status, 1);
  assert.match(oneLine(line(twin, twinList)), /1 question about the core waits on the owner/);
  const closed = core(
    [
      "--target",
      twin,
      "--settle",
      "--by",
      MEMBER,
      "--why",
      "source-color=this product keeps its own brand",
    ],
    twinList,
  );
  assert.equal(closed.status, 0, closed.stderr);
  silent(line(twin, twinList), "a question answered in the session");
  // The question taken away with no answer: the locked answer is held otherwise with no exception.
  const waiting = path.join(dir, "design/waiting");
  rmSync(waiting, { recursive: true });
  assert.equal(
    oneLine(line(dir, list)),
    "design-assembly: 1 locked answer is held otherwise here with no exception. core --settle records the owner's answer, and the gate is red until then.",
  );
  // An exception with its reason: nothing waits, and nothing is said.
  const settled = core(
    [
      "--target",
      dir,
      "--settle",
      "--by",
      MEMBER,
      "--why",
      "source-color=this product keeps its own brand",
    ],
    list,
  );
  assert.equal(settled.status, 0, settled.stderr);
  silent(line(dir, list), "an exception with its reason");
});

test("everything that waits at once is still one line; from a separate working folder the line is the same", () => {
  const dir = adopted();
  const place = coreFolder({ colour: OTHER });
  const list = listIn();
  assert.equal(join(dir, place, list).status, 1);
  moveCore(place, list);
  change(place, list, "failed-action", [
    "--hold",
    "default",
    "--why",
    "kept by a test in each app",
  ]);
  const said = oneLine(line(dir, list));
  assert.equal(
    said,
    `design-assembly: the family core ${FAMILY} is ahead of this repository's pin (2 answers changed); 1 question about the core waits on the owner. core --moved shows each change, and nothing here changes until a person accepts.`,
  );
  git(dir, "init", "-q", "-b", "main");
  git(dir, "add", "-A");
  git(dir, "commit", "-q", "-m", "joined");
  const work = path.join(path.dirname(dir), "member-work");
  assert.equal(git(dir, "worktree", "add", "-q", work).status, 0);
  assert.equal(oneLine(line(work, list)), said);
  // Two cores of the family on this machine: the one whose members name this repository, found
  // from the separate folder without git being run.
  const twin = coreFolder({ colour: OTHER, name: "twin-core" });
  const both = read(path.dirname(list), "cores.json");
  writeFileSync(
    list,
    json({
      ...both,
      cores: [...both.cores, { family: FAMILY, path: twin, on: "2026-11-26", how: "built" }],
    }),
  );
  assert.equal(oneLine(line(work, list, { extra: { PATH: path.join(empty(), "none") } })), said);
});

test("a repository that left its family is told nothing: no line, and no word of a core from status or inventory", () => {
  // A member with everything waiting at once: the core moved, and a question waits on the owner.
  const dir = adopted();
  const place = coreFolder({ colour: OTHER });
  const list = listIn();
  assert.equal(join(dir, place, list).status, 1);
  moveCore(place, list);
  assert.match(
    oneLine(line(dir, list)),
    /is ahead of this repository's pin .*; 1 question about the core waits/,
  );
  for (const script of ["status.mjs", "inventory.mjs"]) {
    assert.match(run(script, ["--target", dir], list).stdout, /is ahead of the pin/, script);
  }
  // It leaves, on its owner's word.
  const left = core(
    ["--target", dir, "--leave", "--by", MEMBER, "--why", "the product goes its own way"],
    list,
  );
  assert.equal(left.status, 0, left.stderr);
  // From then on it stands alone: the line is silent, as the hook and by hand, with the core still
  // on this machine's list and still ahead of what the repository once pinned.
  silent(line(dir, list), "after leaving");
  silent(line(dir, list, { args: ["--hook"] }), "after leaving, as the hook");
  for (const script of ["status.mjs", "inventory.mjs"]) {
    const told = run(script, ["--target", dir, "--json"], list);
    assert.ok(!("core" in JSON.parse(told.stdout)), script);
    assert.doesNotMatch(
      run(script, ["--target", dir], list).stdout,
      /ahead of the pin|family core/,
      script,
    );
  }
  // The moves of a member refuse, and write nothing.
  const before = snapshot(dir);
  for (const args of [["--moved"], ["--accept-all", "--by", MEMBER]]) {
    const refused = core(["--target", dir, ...args], list);
    assert.equal(refused.status, 2, args[0]);
    assert.match(refused.stderr, /this repository declares no family/);
  }
  assert.deepEqual(snapshot(dir), before);
  // Joining again, it is told again.
  assert.equal(join(dir, place, list).status, 1);
  assert.match(oneLine(line(dir, list)), /1 question about the core waits on the owner/);
});

// ---- the hook as the plugin declares it --------------------------------------------------------

test("the plugin declares the hook in hooks/hooks.json, and its command says nothing where node is missing", () => {
  const declared = JSON.parse(readFileSync(HOOKS, "utf8"));
  // The file wraps the events in `hooks`; only the start of a session is hooked, by one command.
  assert.deepEqual(Object.keys(declared.hooks), ["SessionStart"]);
  assert.equal(declared.hooks.SessionStart.length, 1);
  const [entry] = declared.hooks.SessionStart;
  assert.equal(entry.matcher, "startup|resume");
  assert.equal(entry.hooks.length, 1);
  const [hook] = entry.hooks;
  assert.equal(hook.type, "command");
  assert.ok(hook.timeout <= 10);
  assert.match(hook.command, /\$\{CLAUDE_PLUGIN_ROOT\}\/scripts\/session-line\.mjs/);
  assert.ok(existsSync(SCRIPT));

  // The command itself, run by a shell as a session runs it.
  const { dir, place, list } = member();
  moveCore(place, list);
  const shell = (extra) =>
    spawnSync("/bin/bash", ["-c", hook.command], {
      encoding: "utf8",
      cwd: dir,
      env: {
        ...env,
        CLAUDE_PLUGIN_ROOT: PLUGIN,
        CLAUDE_PROJECT_DIR: dir,
        DESIGN_ASSEMBLY_CORES: list,
        ...extra,
      },
    });
  const ran = shell({ PATH: `${path.dirname(execPath)}:${env.PATH}` });
  assert.equal(ran.status, 0, ran.stderr);
  assert.match(JSON.parse(ran.stdout).systemMessage, /is ahead of this repository's pin/);
  // No node, and a plugin folder that is gone: nothing said, and the session opens.
  silent(shell({ PATH: path.join(empty(), "no-such-bin") }), "no node");
  silent(
    shell({
      PATH: `${path.dirname(execPath)}:${env.PATH}`,
      CLAUDE_PLUGIN_ROOT: path.join(empty(), "gone"),
    }),
    "no plugin folder",
  );
});
