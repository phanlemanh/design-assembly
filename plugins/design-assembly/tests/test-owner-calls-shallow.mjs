// The two checks of the decision ledger in a shallow checkout, as continuous integration makes one:
// the history they need to find where the branch left the main one is fetched from the remote, and
// a checkout that cannot fetch it still fails rather than let a new kind of screen through.
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { env } from "node:process";
import { after, test } from "node:test";

import { noteLines, runChecks } from "../templates/tools/design-assembly/check.mjs";
import {
  branchDone,
  branchFacts,
  branchNotes,
  wallProblem,
} from "../templates/tools/design-assembly/owner-calls.mjs";

const made = [];
after(() => made.forEach((dir) => rmSync(dir, { recursive: true, force: true })));
const folder = () => {
  const dir = mkdtempSync(path.join(tmpdir(), "design-owner-calls-shallow-"));
  made.push(dir);
  return dir;
};
const put = (dir, file, text) => {
  mkdirSync(path.dirname(path.join(dir, file)), { recursive: true });
  writeFileSync(path.join(dir, file), text);
};
const git = (dir, ...args) => {
  const run = spawnSync("git", ["-C", dir, ...args], { encoding: "utf8" });
  assert.equal(run.status, 0, `git ${args.join(" ")}: ${run.stderr}`);
  return run.stdout.trim();
};
const commit = (dir, message) => {
  git(dir, "add", "-A");
  git(dir, "commit", "-q", "-m", message);
  return git(dir, "rev-parse", "HEAD");
};

const LEDGER = "design/decisions.yaml";
const CSS = "src/index.css";
const PAGES = "design/patterns";
const LEDGER_TEXT =
  'version: 1\ndecisions:\n  - id: "color-role"\n    layer: "foundations"\n    kind: "standard"\n    source: "the stylesheet"\n';
const CSS_TEXT = ":root {\n  --primary: oklch(0.51 0.27 263);\n}\n";

// The remote: `past` empty commits, then a main branch with the ledger, a feature branch that adds
// a page of a kind of screen after `ahead` commits of its own, and main moved on by one commit
// since the feature left it.
function remote({ main = "main", ahead = 1, page = true, past = 0 } = {}) {
  const dir = folder();
  git(dir, "init", "-q", "-b", main);
  git(dir, "config", "user.name", "Test Person");
  git(dir, "config", "user.email", "test@example.com");
  if (past > 0) {
    const empty = git(dir, "hash-object", "-t", "tree", "-w", "--stdin");
    let tip = git(dir, "commit-tree", empty, "-m", "past 0");
    for (let step = 1; step < past; step += 1) {
      tip = git(dir, "commit-tree", empty, "-p", tip, "-m", `past ${step}`);
    }
    git(dir, "update-ref", `refs/heads/${main}`, tip);
  }
  put(dir, LEDGER, LEDGER_TEXT);
  put(dir, CSS, CSS_TEXT);
  put(dir, `${PAGES}/list.md`, "# List\n");
  commit(dir, "start");
  git(dir, "checkout", "-q", "-b", "feature");
  for (let step = 1; step < ahead; step += 1) {
    put(dir, "notes.md", `step ${step}\n`);
    commit(dir, `step ${step}`);
  }
  if (page) put(dir, `${PAGES}/board.md`, "# Board\n");
  else put(dir, "notes.md", "last step\n");
  const feature = commit(dir, "feature");
  git(dir, "checkout", "-q", main);
  put(dir, "README.md", "main moved on\n");
  commit(dir, "main moved on");
  // The pull request's merge commit, kept under a ref of its own as the hosting service keeps it.
  git(dir, "checkout", "-q", "--detach");
  git(dir, "merge", "-q", "--no-edit", "-m", "merge", "feature");
  const merge = git(dir, "rev-parse", "HEAD");
  git(dir, "update-ref", "refs/pull/1/merge", merge);
  git(dir, "checkout", "-q", main);
  return { dir, url: `file://${dir}`, feature, merge };
}

// One commit fetched by its id into an empty repository, then the remote named: the way the
// reference repository's own script rebuilds the runner.
function byId({ url, feature }, { origin = true } = {}) {
  const dir = folder();
  git(dir, "init", "-q");
  git(dir, "fetch", "-q", "--depth", "1", url, feature);
  git(dir, "checkout", "-q", "FETCH_HEAD");
  if (origin) git(dir, "remote", "add", "origin", url);
  return dir;
}

// A pull request the way a checkout action of continuous integration fetches it: the merge commit
// alone, under a remote ref, with the remote named first.
function pullRequest({ url, merge }) {
  const dir = folder();
  git(dir, "init", "-q");
  git(dir, "remote", "add", "origin", url);
  git(dir, "fetch", "-q", "--depth=1", "origin", `+${merge}:refs/remotes/pull/1/merge`);
  git(dir, "checkout", "-q", "refs/remotes/pull/1/merge");
  return dir;
}

const facts = (dir, main = null, history = undefined) =>
  branchFacts(dir, { pages: PAGES, stylesheet: CSS, ledger: LEDGER, main, history });
const wall = (branch) => wallProblem({ branch, waiting: { rows: [] } });
const shallow = (dir) => git(dir, "rev-parse", "--is-shallow-repository") === "true";

test("a commit fetched alone by its id: the main branch is fetched, and the new page is the owner's call", () => {
  const dir = byId(remote());
  assert.ok(shallow(dir));
  const branch = facts(dir);
  assert.equal(branch.problem, undefined, JSON.stringify(branch));
  assert.deepEqual(branch.pages_added, ["board"]);
  assert.match(wall(branch), /pattern:board/);
  assert.match(branch.fetched, /origin/);
  // A fetch the check made is work done, said as such, never listed with the debts.
  assert.doesNotMatch(branchNotes(branch).join(" "), /fetched/);
  assert.match(branchDone(branch).join(" "), /fetched/);
});

test("the gate says a fetch it made as done, not as a debt", () => {
  const branch = facts(byId(remote({ page: false })));
  assert.equal(branch.problem, undefined, JSON.stringify(branch));
  const state = {
    theme: { checks: { "owner-calls": [{ kind: "owner-calls" }] } },
    branch,
    waiting: { rows: [] },
  };
  const [result] = runChecks(state);
  assert.equal(result.problem, null);
  assert.deepEqual(result.notes, []);
  assert.deepEqual(result.done, [branch.fetched]);
  const lines = noteLines([result, { id: "screen-actions", notes: ["a debt"], done: [] }]);
  assert.deepEqual(lines, [`  owner-calls: ${branch.fetched}`, "  screen-actions, debt: a debt"]);
});

// A stand-in for ssh that records how it was called, then runs the command git asks of the far
// side on this machine: the last word it is given. So a remote reached over ssh needs no server.
function fakeSsh(name = "fake-ssh") {
  const dir = folder();
  const said = path.join(dir, "called.log");
  const script = path.join(dir, name);
  writeFileSync(
    script,
    `#!/bin/sh\necho "$@" >> '${said}'\nfor last; do :; done\nexec sh -c "$last"\n`,
    { mode: 0o755 },
  );
  return { dir, script, said: () => (existsSync(said) ? readFileSync(said, "utf8") : "") };
}

// A shallow checkout whose remote is reached over ssh, at a host that does not exist: only the
// command the machine configured can reach it.
function overSsh(source) {
  const dir = byId(source);
  git(dir, "remote", "set-url", "origin", `ssh://nowhere.invalid${source.dir}`);
  return dir;
}

// Sets environment variables for one call, undefined meaning unset, and puts back what was there.
function withEnv(values, call) {
  const set = (entries) => {
    for (const [key, value] of entries) {
      if (value === undefined) delete env[key];
      else env[key] = value;
    }
  };
  const before = Object.keys(values).map((key) => [key, env[key]]);
  set(Object.entries(values));
  try {
    return call();
  } finally {
    set(before);
  }
}

test("an ssh command the checkout configures is the one the fetch uses", () => {
  const source = remote();
  const ssh = fakeSsh();
  const dir = overSsh(source);
  git(dir, "config", "core.sshCommand", ssh.script);
  const branch = withEnv({ GIT_SSH_COMMAND: undefined, GIT_SSH: undefined }, () => facts(dir));
  assert.equal(branch.problem, undefined, JSON.stringify(branch));
  assert.deepEqual(branch.pages_added, ["board"]);
  assert.match(ssh.said(), /git-upload-pack/);
});

test("an ssh program the environment names is the one the fetch uses", () => {
  const source = remote();
  const ssh = fakeSsh();
  const dir = overSsh(source);
  const branch = withEnv({ GIT_SSH_COMMAND: undefined, GIT_SSH: ssh.script }, () => facts(dir));
  assert.equal(branch.problem, undefined, JSON.stringify(branch));
  assert.match(ssh.said(), /git-upload-pack/);
});

test("with no ssh command configured, ssh is told never to ask for a password", () => {
  const source = remote();
  const ssh = fakeSsh("ssh");
  const dir = overSsh(source);
  const branch = withEnv(
    {
      GIT_SSH_COMMAND: undefined,
      GIT_SSH: undefined,
      PATH: `${ssh.dir}${path.delimiter}${env.PATH}`,
    },
    () => facts(dir),
  );
  assert.equal(branch.problem, undefined, JSON.stringify(branch));
  assert.match(ssh.said(), /BatchMode=yes/);
});

test("a shallow checkout of a branch that adds nothing the owner decides is green", () => {
  const dir = byId(remote({ page: false }));
  const branch = facts(dir);
  assert.deepEqual(branch.pages_added, []);
  assert.equal(wall(branch), null);
});

test("a pull request checked out as its merge commit alone: what the feature adds is read", () => {
  const dir = pullRequest(remote());
  const branch = facts(dir);
  assert.equal(branch.problem, undefined, JSON.stringify(branch));
  assert.deepEqual(branch.pages_added, ["board"]);
  assert.equal(branch.colour.base, branch.colour.now);
});

test("a branch far ahead of where it left the main branch is still found, history fetched in steps", () => {
  const dir = byId(remote({ ahead: 80, past: 150 }));
  const branch = facts(dir);
  assert.equal(branch.problem, undefined, JSON.stringify(branch));
  assert.deepEqual(branch.pages_added, ["board"]);
  // In steps, not the whole history at once: the checkout is still shallow.
  assert.ok(shallow(dir));
});

test("a main branch of another name in the tool data is fetched by that name", () => {
  const dir = byId(remote({ main: "trunk" }));
  const branch = facts(dir, "trunk");
  assert.equal(branch.problem, undefined, JSON.stringify(branch));
  assert.deepEqual(branch.pages_added, ["board"]);
});

test("the main branch checked out alone, as on a push to it, needs nothing fetched", () => {
  const { url, dir: source } = remote();
  const dir = folder();
  git(dir, "init", "-q");
  git(dir, "remote", "add", "origin", url);
  const tip = git(source, "rev-parse", "main");
  git(dir, "fetch", "-q", "--depth=1", "origin", `+${tip}:refs/remotes/origin/main`);
  git(dir, "checkout", "-q", "-B", "main", "refs/remotes/origin/main");
  const branch = facts(dir);
  assert.equal(branch.problem, undefined, JSON.stringify(branch));
  assert.equal(branch.fetched, undefined);
  assert.deepEqual(branch.pages_added, []);
});

test("a shallow checkout with no remote to fetch from still fails, and says why", () => {
  const dir = byId(remote(), { origin: false });
  const branch = facts(dir);
  assert.match(branch.problem, /shallow/);
  assert.match(wall(branch), /pass unseen/);
});

test("a remote that cannot be reached still fails, with what git said", () => {
  const dir = byId(remote());
  git(dir, "remote", "set-url", "origin", `file://${path.join(folder(), "gone")}`);
  const branch = facts(dir);
  assert.match(branch.problem, /could not fetch/);
  assert.match(wall(branch), /pass unseen/);
});

test("a commit of its own the remote does not have: the main branch alone is deepened, then the whole history fetched", () => {
  const dir = byId(remote());
  git(dir, "config", "user.name", "Test Person");
  git(dir, "config", "user.email", "test@example.com");
  put(dir, "derived.md", "written in the checkout\n");
  commit(dir, "a commit of the checkout's own");
  const branch = facts(dir);
  assert.equal(branch.problem, undefined, JSON.stringify(branch));
  assert.deepEqual(branch.pages_added, ["board"]);
});

test("history too long for the steps is fetched whole, as the last resort", () => {
  const dir = byId(remote({ ahead: 10 }));
  const branch = facts(dir, null, { step: 1, rounds: 0 });
  assert.equal(branch.problem, undefined, JSON.stringify(branch));
  assert.deepEqual(branch.pages_added, ["board"]);
  assert.equal(shallow(dir), false);
});

test("a remote whose own checkout is on the feature branch: the main branch is still main, not its HEAD", () => {
  const source = remote();
  // The reference repository rebuilds its runner from a working folder, whose HEAD is the branch
  // being worked on: taking that for the main branch compares the branch with itself.
  git(source.dir, "checkout", "-q", "feature");
  const branch = facts(byId(source));
  assert.equal(branch.problem, undefined, JSON.stringify(branch));
  assert.equal(branch.main, "origin/main");
  assert.deepEqual(branch.pages_added, ["board"]);
});

test("a remote with neither main nor master: its HEAD is not taken for the main branch, and the check fails", () => {
  const source = remote({ main: "develop" });
  git(source.dir, "checkout", "-q", "feature");
  const branch = facts(byId(source));
  assert.match(branch.problem, /neither main nor master/);
  assert.match(wall(branch), /pass unseen/);
});

test("a main branch named with the remote's prefix is fetched by its own name", () => {
  const source = remote({ main: "trunk" });
  for (const name of ["origin/trunk", "refs/heads/trunk"]) {
    const branch = facts(byId(source), name);
    assert.equal(branch.problem, undefined, `${name}: ${JSON.stringify(branch)}`);
    assert.deepEqual(branch.pages_added, ["board"]);
  }
});
