// The decision ledger stands in for the head of design (step 8.3b of specification 0005). Two
// checks of the gate, on throwaway git repositories:
//   decision-sheet  the total comparison: a judgment this branch writes that nobody confirmed and
//                   that no question asks, a decision that source goes around, a test that proves a
//                   decision the ledger has no row for
//   owner-calls     the wall: a branch that adds a page of a kind of screen, or changes the root
//                   colour line, is red until the waiting list holds the owner's answer for it
import "./helpers/own-cores.mjs";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { after, test } from "node:test";

import {
  branchFacts,
  rootColour,
  sheetProblem,
  taggedTests,
  wallProblem,
} from "../templates/tools/design-assembly/owner-calls.mjs";
import { parseLedger } from "../templates/tools/design-assembly/ledger.mjs";
import { readWaiting, WAITING_FOLDER } from "../templates/tools/design-assembly/waiting.mjs";

const made = [];
after(() => made.forEach((dir) => rmSync(dir, { recursive: true, force: true })));
const put = (dir, file, text) => {
  mkdirSync(path.dirname(path.join(dir, file)), { recursive: true });
  writeFileSync(path.join(dir, file), text);
};
const git = (dir, ...args) => {
  const run = spawnSync("git", ["-C", dir, ...args], { encoding: "utf8" });
  assert.equal(run.status, 0, `git ${args.join(" ")}: ${run.stderr}`);
  return run.stdout;
};

const LEDGER = "design/decisions.yaml";
const CSS = "src/index.css";
const PAGES = "design/patterns";
const ledgerOf = (rows) =>
  `version: 1\ndecisions:\n${rows
    .map((row) =>
      Object.entries(row)
        .map(
          ([key, value], index) =>
            `${index === 0 ? "  - " : "    "}${key}: ${JSON.stringify(value)}`,
        )
        .join("\n"),
    )
    .join("\n")}\n`;
const ROWS = [
  { id: "product-type", layer: "context", kind: "judgment", source: "design/blueprint.json" },
  {
    id: "color-role",
    layer: "foundations",
    kind: "standard",
    source: "the stylesheet's color roles",
  },
];
const css = (primary) =>
  `:root {\n  --background: oklch(1 0 0);\n  --primary: ${primary};\n}\n.dark {\n  --primary: oklch(0.9 0 0);\n}\n`;

// A repository with one commit on main, and a branch made from it.
function repo() {
  const dir = mkdtempSync(path.join(tmpdir(), "design-owner-calls-"));
  made.push(dir);
  git(dir, "init", "-q", "-b", "main");
  git(dir, "config", "user.name", "Test Person");
  git(dir, "config", "user.email", "test@example.com");
  put(dir, LEDGER, ledgerOf(ROWS));
  put(dir, CSS, css("oklch(0.51 0.27 263)"));
  put(dir, `${PAGES}/list.md`, "---\nmain_task: find a record\n---\n# List\n");
  put(dir, `${PAGES}/README.md`, "What a page is.\n");
  put(dir, "src/App.tsx", 'export const App = () => <main className="bg-primary">x</main>;\n');
  git(dir, "add", "-A");
  git(dir, "commit", "-q", "-m", "start");
  git(dir, "checkout", "-q", "-b", "feature");
  return dir;
}
const facts = (dir) => branchFacts(dir, { pages: PAGES, stylesheet: CSS, ledger: LEDGER });
const waitingOf = (dir) => {
  try {
    return { rows: readWaiting(dir)?.rows ?? [] };
  } catch (error) {
    return { problem: error.message };
  }
};
const ask = (dir, row) => put(dir, `${WAITING_FOLDER}/${row.id}.json`, JSON.stringify(row));
const kept = (id, item) => ({
  id,
  question: "?",
  item,
  answer: "keep",
  by: "Owner",
  on: "2026-11-17",
});
const wall = (dir) => wallProblem({ branch: facts(dir), waiting: waitingOf(dir) });
const read = (dir, file) => readFileSync(path.join(dir, file), "utf8");
const sheetOf = (dir, extra = {}) =>
  sheetProblem({
    ledger: parseLedger(read(dir, LEDGER)),
    branch: facts(dir),
    waiting: waitingOf(dir),
    blueprint: null,
    sources: { "src/App.tsx": read(dir, "src/App.tsx") },
    tagged: taggedTests(dir),
    ...extra,
  });

test("the root colour line is the last --primary of a top-level :root, as written", () => {
  assert.equal(rootColour(css("#0246ff")), "#0246ff");
  assert.equal(
    rootColour(`${css("#0246ff")}\n:root {\n  --primary:   oklch(0.5  0.2 250);\n}\n`),
    "oklch(0.5 0.2 250)",
  );
  assert.equal(rootColour(".dark { --primary: red; }"), null);
  assert.equal(rootColour(null), null);
});

test("the wall: a branch that adds nothing the owner decides is green, on main as on a branch", () => {
  const dir = repo();
  assert.equal(wall(dir), null);
  const branch = facts(dir);
  assert.deepEqual(branch.pages_added, []);
  assert.equal(branch.colour.base, branch.colour.now);
  git(dir, "checkout", "-q", "main");
  assert.equal(wall(dir), null);
});

test("the wall: a new page of a kind of screen is red until the owner keeps it, by its exact name", () => {
  const dir = repo();
  put(dir, `${PAGES}/board.md`, "---\nmain_task: move a card\n---\n# Board\n");
  assert.match(wall(dir), /pattern:board/);
  assert.match(wall(dir), /decide --ask/);
  // Asked and not yet answered: still red, and it says it waits.
  ask(dir, { id: "pattern-board", question: "Add a board?", item: "pattern:board" });
  assert.match(wall(dir), /pattern-board.*waits/);
  // Refused: red, and it says so.
  ask(dir, { ...kept("pattern-board", "pattern:board"), answer: "refuse", said: "use the list" });
  assert.match(wall(dir), /refused/);
  // Kept for another page: still red for this one.
  ask(dir, kept("pattern-board", "pattern:boards"));
  assert.match(wall(dir), /pattern:board\b/);
  ask(dir, kept("pattern-board", "pattern:board"));
  assert.equal(wall(dir), null);
  // A page that is not a kind of screen, or one that was there already, is not new.
  put(dir, `${PAGES}/lech-lot.md`, "not a kind\n");
  put(dir, `${PAGES}/list.md`, "---\nmain_task: find two records\n---\n# List\n");
  assert.equal(wall(dir), null);
  // Committed on the branch, it is still what the branch adds.
  rmSync(path.join(dir, WAITING_FOLDER), { recursive: true });
  git(dir, "add", "-A");
  git(dir, "commit", "-q", "-m", "board");
  assert.match(wall(dir), /pattern:board/);
});

test("the wall: a changed root colour is red until the owner keeps that colour", () => {
  const dir = repo();
  put(dir, CSS, css("#0246ff"));
  assert.match(wall(dir), /source-color:#0246ff/);
  ask(dir, kept("colour", "source-color:#0246fe"));
  assert.match(wall(dir), /source-color:#0246ff/);
  ask(dir, kept("colour", "source-color:#0246ff"));
  assert.equal(wall(dir), null);
  // The dark line is not the root line.
  const dark = repo();
  put(dark, CSS, css("oklch(0.51 0.27 263)").replace("oklch(0.9 0 0)", "oklch(0.8 0 0)"));
  assert.equal(wall(dark), null);
  // A root line taken away is a change too.
  const gone = repo();
  put(gone, CSS, ":root {\n  --background: oklch(1 0 0);\n}\n");
  assert.match(wall(gone), /root colour/);
});

test("the wall cannot tell what a branch adds without its main branch, and says so instead of passing", () => {
  const dir = repo();
  git(dir, "branch", "-m", "main", "trunk");
  put(dir, `${PAGES}/board.md`, "# Board\n");
  assert.match(wall(dir), /main branch/);
  // Outside git nothing is compared: the check passes and says it did not compare.
  const bare = mkdtempSync(path.join(tmpdir(), "design-owner-calls-"));
  made.push(bare);
  assert.equal(branchFacts(bare, { pages: PAGES, stylesheet: CSS, ledger: LEDGER }), null);
  assert.equal(wallProblem({ branch: null, waiting: { rows: [] } }), null);
});

test("an unreadable waiting list makes both checks red", () => {
  const dir = repo();
  put(dir, `${WAITING_FOLDER}/x.json`, "{ not json");
  assert.match(wall(dir), /waiting list/);
  assert.match(sheetOf(dir), /waiting list/);
});

test("the total comparison: a judgment this branch writes is red unless a person answered it or a question asks it", () => {
  const dir = repo();
  assert.equal(sheetOf(dir), null);
  const row = {
    id: "information-order",
    layer: "context",
    kind: "judgment",
    source: "design/patterns",
  };
  put(dir, LEDGER, ledgerOf([...ROWS, row]));
  assert.match(sheetOf(dir), /information-order/);
  assert.deepEqual(facts(dir).judgments, ["information-order"]);
  // The row says nobody confirmed it: the decision sheet asks it.
  put(
    dir,
    LEDGER,
    ledgerOf([...ROWS, { ...row, note: "written by an agent; a person has not confirmed it" }]),
  );
  assert.equal(sheetOf(dir), null);
  // A person's answer, written by the decision sheet.
  put(dir, LEDGER, ledgerOf([...ROWS, { ...row, note: "confirmed by Owner on 2026-11-17" }]));
  assert.equal(sheetOf(dir), null);
  // A question of the waiting list names it.
  put(dir, LEDGER, ledgerOf([...ROWS, row]));
  ask(dir, { id: "order", question: "Is this the order?", item: "decision:information-order" });
  assert.equal(sheetOf(dir), null);
  // A judgment changed on the branch is written on the branch.
  const changed = repo();
  put(changed, LEDGER, ledgerOf([{ ...ROWS[0], note: "a tool for teams" }, ROWS[1]]));
  assert.match(sheetOf(changed), /product-type/);
  // A row the guide wrote from a person's answer in the blueprint is that person's.
  const blueprint = {
    layers: {
      context: { status: "decided", source: "user", choice: { product_type: "application" } },
    },
  };
  assert.equal(sheetOf(changed, { blueprint }), null);
  const proposed = { layers: { context: { ...blueprint.layers.context, source: "proposed" } } };
  assert.match(sheetOf(changed, { blueprint: proposed }), /product-type/);
  const confirmed = {
    layers: { context: { ...proposed.layers.context, confirmed: ["product_type"] } },
  };
  assert.equal(sheetOf(changed, { blueprint: confirmed }), null);
  // A judgment that was on main before the branch is not this branch's.
  git(dir, "checkout", "-q", "main");
  rmSync(path.join(dir, WAITING_FOLDER), { recursive: true });
  put(dir, LEDGER, ledgerOf([...ROWS, row]));
  git(dir, "commit", "-q", "-am", "on main");
  assert.equal(sheetOf(dir), null);
});

test("the total comparison: source that goes around a decided scale is red, as the audit says", () => {
  const dir = repo();
  put(dir, "src/App.tsx", 'export const App = () => <main className="bg-[#ff0000]">x</main>;\n');
  assert.match(sheetOf(dir), /color-role.*src\/App\.tsx/);
  // Without a row the decision is not decided here, and the audit has nothing to compare.
  put(dir, LEDGER, ledgerOf([ROWS[0]]));
  assert.equal(sheetOf(dir), null);
  // A vendor's component is not the repository's source.
  assert.equal(
    sheetProblem({
      ledger: ROWS,
      sources: { "src/components/ui/button.tsx": 'className="bg-[#ff0000]"' },
    }),
    null,
  );
});

test("the total comparison: a test that proves a decision the ledger has no row for is red", () => {
  const dir = repo();
  put(dir, "tests/row.test.ts", "// decision:color-role\n// decision:row-actions-in-view\n");
  assert.deepEqual(taggedTests(dir), [
    { id: "color-role", check: "test:tests/row.test.ts" },
    { id: "row-actions-in-view", check: "test:tests/row.test.ts" },
  ]);
  assert.match(sheetOf(dir), /row-actions-in-view.*tests\/row\.test\.ts/);
  assert.doesNotMatch(sheetOf(dir), /color-role/);
  put(
    dir,
    LEDGER,
    ledgerOf([
      ...ROWS,
      { id: "row-actions-in-view", layer: "patterns", kind: "standard", source: "x" },
    ]),
  );
  assert.equal(sheetOf(dir), null);
});

test("the branch where a repository meets the plugin is not compared: the person answers there", () => {
  const dir = repo();
  git(dir, "checkout", "-q", "main");
  git(dir, "rm", "-q", LEDGER);
  git(dir, "commit", "-q", "-m", "before the plugin");
  git(dir, "checkout", "-q", "-B", "guide");
  put(
    dir,
    LEDGER,
    ledgerOf([...ROWS, { id: "primary-task", layer: "context", kind: "judgment", source: "x" }]),
  );
  put(dir, `${PAGES}/board.md`, "# Board\n");
  put(dir, CSS, css("#0246ff"));
  const branch = facts(dir);
  assert.equal(branch.born, true);
  assert.equal(wall(dir), null);
  assert.equal(sheetOf(dir), null);
});

test("the page of rules tells a building agent how to ask, and that the owner's calls stop it", async () => {
  const { rulesPage, DECISION_SHEET, OWNER_CALLS } = await import("../scripts/apply.mjs");
  const both = rulesPage(
    { "decision-sheet": DECISION_SHEET.checks, "owner-calls": OWNER_CALLS.checks },
    () => false,
  );
  assert.match(both, /## Questions only the owner answers/);
  assert.match(both, /\/design-assembly:decide --ask/);
  assert.ok(both.includes(`one new file, \`${WAITING_FOLDER}/<id>.json\``));
  assert.match(both, /--item pattern:NAME.*--item source-color:VALUE.*stop there/);
  const neither = rulesPage({}, () => false);
  assert.doesNotMatch(neither, /Questions only the owner answers|--ask/);
});

test("a repository with no commit yet is not compared: it starts here", () => {
  const dir = mkdtempSync(path.join(tmpdir(), "design-owner-calls-"));
  made.push(dir);
  git(dir, "init", "-q", "-b", "main");
  put(
    dir,
    LEDGER,
    ledgerOf([...ROWS, { id: "primary-task", layer: "context", kind: "judgment", source: "x" }]),
  );
  put(dir, `${PAGES}/board.md`, "# Board\n");
  put(dir, CSS, css("#0246ff"));
  put(dir, "src/App.tsx", "export const App = () => null;\n");
  git(dir, "add", "-A");
  const branch = facts(dir);
  assert.equal(branch.born, true);
  assert.equal(branch.base, null);
  assert.equal(wall(dir), null);
  assert.equal(sheetOf(dir), null);
});

test("a stale local main is not taken for the fork point: the newest base of the main branches is", () => {
  const dir = repo();
  // The main branch moved on at the remote, with a new page and colour, and this branch started there.
  git(dir, "checkout", "-q", "main");
  put(dir, `${PAGES}/board.md`, "# Board\n");
  git(dir, "add", "-A");
  git(dir, "commit", "-q", "-m", "board on main");
  git(dir, "update-ref", "refs/remotes/origin/main", "HEAD");
  git(dir, "reset", "-q", "--hard", "HEAD~1");
  git(dir, "checkout", "-q", "-B", "later", "origin/main");
  assert.equal(wall(dir), null);
});

test("a base git cannot read is a problem, not a branch where the plugin arrives", () => {
  const dir = repo();
  const broken = branchFacts(dir, {
    pages: PAGES,
    stylesheet: CSS,
    ledger: "design/../../outside.yaml",
  });
  assert.notEqual(broken?.born, true);
  assert.ok(broken.problem, JSON.stringify(broken));
});

test("a target in a folder of a larger git repository is compared the same way", () => {
  const top = repo();
  git(top, "checkout", "-q", "main");
  mkdirSync(path.join(top, "app"));
  for (const file of [LEDGER, CSS, `${PAGES}/list.md`, "src/App.tsx"]) {
    put(top, `app/${file}`, read(top, file));
  }
  git(top, "add", "-A");
  git(top, "commit", "-q", "-m", "app");
  git(top, "checkout", "-q", "-b", "sub");
  const dir = path.join(top, "app");
  assert.equal(wall(dir), null);
  put(dir, `${PAGES}/board.md`, "# Board\n");
  put(dir, CSS, css("#0246ff"));
  assert.match(wall(dir), /pattern:board/);
  assert.match(wall(dir), /source-color:#0246ff/);
});

test("a main branch of another name is named in the tool data; without it the check says how", () => {
  const dir = repo();
  git(dir, "branch", "-m", "main", "trunk");
  put(dir, `${PAGES}/board.md`, "# Board\n");
  assert.match(wall(dir), /fetch-depth|"main"/);
  const named = branchFacts(dir, { pages: PAGES, stylesheet: CSS, ledger: LEDGER, main: "trunk" });
  assert.deepEqual(named.pages_added, ["board"]);
  assert.match(wallProblem({ branch: named, waiting: { rows: [] } }), /pattern:board/);
});
