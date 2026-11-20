// The two checkouts the plugin's tests read on this machine are looked for beside this
// repository's main checkout. A git worktree is kept somewhere else, where ".." is another folder,
// and the tests that need those checkouts were skipped there without a word. Run on a throwaway
// repository with `node --test tools/reference_paths_test.mjs`.
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { copyFileSync, mkdirSync, mkdtempSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import process from "node:process";
import { after, test } from "node:test";
import { fileURLToPath } from "node:url";

const RULES = path.join(path.dirname(fileURLToPath(import.meta.url)), "../mk/plugin.mk");
const SHOW = 'include mk/plugin.mk\nshow:\n\t@echo "$(REFERENCE_LEDGER)|$(ACCEPTANCE_KIT)"\n';
// A value named on the command line of the run this test is part of reaches every make below it;
// the defaults are what is read here, so those names are taken out.
const NAMED = ["MAKEFLAGS", "MFLAGS", "MAKEOVERRIDES", "REFERENCE_LEDGER", "ACCEPTANCE_KIT"];
const env = Object.fromEntries(Object.entries(process.env).filter(([key]) => !NAMED.includes(key)));

const made = [];
after(() => made.forEach((dir) => rmSync(dir, { recursive: true, force: true })));

const git = (dir, ...args) => {
  const identity = ["-c", "user.name=test", "-c", "user.email=test@example.com"];
  const done = spawnSync("git", ["-C", dir, ...identity, ...args], { encoding: "utf8", env });
  assert.equal(done.status, 0, done.stderr);
};
// The two paths make would hand the tests when it runs in `dir`.
const paths = (dir, ...args) => {
  const shown = spawnSync("make", ["-s", "show", ...args], { cwd: dir, encoding: "utf8", env });
  assert.equal(shown.status, 0, shown.stderr);
  return shown.stdout.trim().split("|");
};
// A folder with this repository's rules for the plugin and a target that prints the two paths.
function folder(dir) {
  mkdirSync(path.join(dir, "mk"), { recursive: true });
  copyFileSync(RULES, path.join(dir, "mk/plugin.mk"));
  writeFileSync(path.join(dir, "Makefile"), SHOW);
  return dir;
}
// A place on the machine with a repository in it, as `home/repo`.
function home() {
  const dir = realpathSync(mkdtempSync(path.join(tmpdir(), "reference-paths-")));
  made.push(dir);
  const repo = folder(path.join(dir, "repo"));
  git(repo, "init", "-q");
  git(repo, "add", ".");
  git(repo, "commit", "-q", "-m", "rules");
  return { dir, repo };
}

test("the main checkout looks beside itself, spelled as it always was", () => {
  const { repo } = home();
  for (const found of paths(repo)) assert.match(found, /^\.\.\/[a-z-]+$/);
});

test("a worktree kept inside the repository looks beside the main checkout", () => {
  const { dir, repo } = home();
  const names = paths(repo).map((found) => path.basename(found));
  for (const name of names) mkdirSync(path.join(dir, name));
  const worktree = path.join(repo, ".claude/worktrees/side");
  git(repo, "worktree", "add", "-q", "-b", "side", worktree);

  const found = paths(worktree).map((value) => realpathSync(path.resolve(worktree, value)));

  assert.deepEqual(
    found,
    names.map((name) => path.join(dir, name)),
  );
});

test("a path named on the command line is the one used, in a worktree too", () => {
  const { repo } = home();
  const worktree = path.join(repo, ".claude/worktrees/side");
  git(repo, "worktree", "add", "-q", "-b", "side", worktree);

  const [reference, kit] = paths(worktree, "REFERENCE_LEDGER=/named/ledger");

  assert.equal(reference, "/named/ledger");
  assert.notEqual(kit, "/named/ledger");
});

test("a folder that is not a repository looks beside itself", () => {
  const dir = realpathSync(mkdtempSync(path.join(tmpdir(), "reference-paths-")));
  made.push(dir);
  for (const found of paths(folder(path.join(dir, "plain")))) assert.match(found, /^\.\.\//);
});
