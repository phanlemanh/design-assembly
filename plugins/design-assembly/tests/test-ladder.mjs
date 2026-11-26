// The ladder command on throwaway repositories: one that has not adopted the plugin, and one that
// has. It measures every step on both, to the end, and writes to neither.
import "./helpers/own-cores.mjs";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { execPath } from "node:process";
import { after, test } from "node:test";
import { fileURLToPath } from "node:url";

import { withoutBlock } from "../templates/tools/design-assembly/theme.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const PLUGIN = path.resolve(HERE, "..");
const ROOT = path.resolve(PLUGIN, "../..");
const LADDER = path.join(ROOT, "docs/trials/ladder.mjs");
const ADOPT = path.join(PLUGIN, "scripts/adopt.mjs");
const REGISTER = "design/component-registry.json";

const made = [];
after(() => made.forEach((dir) => rmSync(dir, { recursive: true, force: true })));

const own = (file) => readFileSync(path.join(ROOT, file), "utf8");
const node = (script, ...args) => spawnSync(execPath, [script, ...args], { encoding: "utf8" });
const git = (dir, ...args) => {
  const identity = ["-c", "user.name=ladder", "-c", "user.email=ladder@example.invalid"];
  const run = spawnSync("git", ["-C", dir, ...identity, "-c", "commit.gpgsign=false", ...args], {
    encoding: "utf8",
  });
  assert.equal(run.status, 0, run.stderr);
  return run.stdout;
};

// A small repository with a stylesheet, two components and a gate, committed. A file given as
// null is left out.
function repository(extra = {}) {
  const dir = mkdtempSync(path.join(tmpdir(), "design-assembly-ladder-test-"));
  made.push(dir);
  const files = {
    "src/index.css": withoutBlock(own("src/index.css")),
    "components.json": own("components.json"),
    "src/components/ui/button.tsx": own("src/components/ui/button.tsx"),
    "src/components/ui/card.tsx": own("src/components/ui/card.tsx"),
    Makefile: "CHECK_TARGETS := lint\n-include mk/*.mk\ncheck: $(CHECK_TARGETS)\nlint:\n\t@true\n",
    ...extra,
  };
  for (const [file, content] of Object.entries(files)) {
    if (content === null) continue;
    mkdirSync(path.dirname(path.join(dir, file)), { recursive: true });
    writeFileSync(path.join(dir, file), content);
  }
  git(dir, "init", "-q");
  commit(dir, "start");
  return dir;
}
const commit = (dir, message) => {
  git(dir, "add", "-A");
  git(dir, "commit", "-q", "-m", message);
};

// The register as a tool of the repository's own writes it: one entry per file, with its parts.
const OWN_REGISTER = `${JSON.stringify(
  {
    components: [
      {
        file: "src/components/ui/button.tsx",
        level: "atom",
        parts: [{ name: "Button", props: [], variants: {} }],
      },
    ],
  },
  null,
  2,
)}\n`;

// The rows of the table in the order printed: the measurements of each step, without its name.
const STEPS = ["start", "1. ", "2. ", "3. "];
function rowsOf(stdout) {
  const rows = stdout.split("\n").filter((line) => STEPS.some((step) => line.startsWith(step)));
  assert.deepEqual(
    rows.map((line) => STEPS.find((step) => line.startsWith(step))),
    STEPS,
    stdout,
  );
  return rows.map((line) => line.split("\t").slice(1));
}

// Everything that could show a write: the files git sees changed, the commit, the register.
const stateOf = (dir) => ({
  status: git(dir, "status", "--porcelain"),
  head: git(dir, "rev-parse", "HEAD"),
  register: existsSync(path.join(dir, REGISTER))
    ? readFileSync(path.join(dir, REGISTER), "utf8")
    : null,
});

test("the ladder measures every step on a repository that has not adopted the plugin", () => {
  const dir = repository({ [REGISTER]: OWN_REGISTER });
  const before = stateOf(dir);
  const run = node(LADDER, "--reference", dir);
  assert.equal(run.status, 0, run.stdout + run.stderr);
  const rows = rowsOf(run.stdout);
  // Nothing is held before adopting, and adopting is what moves the rungs.
  const [shapesAtStart, , , heldAtStart] = rows[0];
  const [shapesAtEnd, , , heldAtEnd] = rows[3];
  assert.equal(heldAtStart, "0");
  assert.ok(Number(heldAtEnd) > 0, run.stdout);
  // The register of the repository's own tool is not in the contract's shape; the plugin's is.
  assert.notEqual(shapesAtStart, shapesAtEnd);
  assert.match(shapesAtEnd, /^(\d+) of \1$/);
  assert.match(run.stdout, /register, this plugin's against the repository's own tool, by name/);
  assert.doesNotMatch(run.stdout, /no step moved a rung/);
  assert.match(run.stdout, /reference repository changed: no/);
  assert.deepEqual(stateOf(dir), before);
});

test("the ladder measures every step when adopting refuses one, and says which and why", () => {
  // No stylesheet declares --primary, so the source colour of step two cannot be recorded and
  // adopting refuses that call. The ladder goes on, and the row of that step is where the copy is.
  // With no gate to join either, as in a repository not born on the floor, no step takes anything in.
  const dir = repository({ "src/index.css": "body {\n  margin: 0;\n}\n", Makefile: null });
  const before = stateOf(dir);
  const run = node(LADDER, "--reference", dir);
  assert.equal(run.status, 0, run.stdout + run.stderr);
  assert.equal(run.stderr, "");
  const rows = rowsOf(run.stdout);
  assert.match(
    run.stdout,
    /^refused at step 2\. [^\n]*: adopting wrote nothing for it: .*--primary/m,
  );
  assert.doesNotMatch(run.stdout, /^refused at step (1|3)\./m);
  // The rows are equal because nothing was taken in, not because the copy had adopted already.
  for (const row of rows) assert.deepEqual(row, rows[0], run.stdout);
  assert.doesNotMatch(run.stdout, /already taken/);
  assert.match(
    run.stdout,
    /no step moved a rung: the copy has no ledger, and adopting took nothing in/,
  );
  assert.match(run.stdout, /reference repository changed: no/);
  assert.deepEqual(stateOf(dir), before);
});

test("the ladder measures every step on a repository that has already adopted the plugin", () => {
  const dir = repository();
  // Adopted as a repository does it: the plugin writes its ledgers and its tool, the owner gives
  // the three answers, and all of it is committed. The second run adds the rows that need the
  // files of the first.
  const answers = ["--conformance-level", "AA", "--product-type", "application"];
  for (const round of [1, 2]) {
    const adopted = node(ADOPT, "--target", dir, ...answers, "--record", "source-color");
    assert.equal(adopted.status, 0, `round ${round}: ${adopted.stderr}`);
  }
  commit(dir, "adopt the plugin");
  const before = stateOf(dir);
  const run = node(LADDER, "--reference", dir);
  assert.equal(run.status, 0, run.stdout + run.stderr);
  const rows = rowsOf(run.stdout);
  // Every step finds its work done: the plugin's register is still there at the last one, and
  // each row is the repository as it stands, with every ledger in shape.
  const [shapesAtStart, , , heldAtStart] = rows[0];
  assert.match(shapesAtStart, /^(\d+) of \1$/);
  assert.ok(Number(heldAtStart) > 0, run.stdout);
  for (const row of rows) assert.deepEqual(row, rows[0], run.stdout);
  assert.match(run.stdout, /no step moved a rung/);
  // There is no register of another tool to compare with, and the command says so.
  assert.match(run.stdout, /register: the one in the repository is this plugin's own/);
  assert.match(run.stdout, /reference repository changed: no/);
  assert.deepEqual(stateOf(dir), before);
});
