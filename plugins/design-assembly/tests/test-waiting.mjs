// The waiting list as one file per question (step 8.3a of specification 0005). A building agent
// queues a question with `decide --ask` and edits no shared file; `decide` shows that question with
// every other; an answer is written into that question's own file; one shared file is split into
// one file per question and stops before a question could be lost.
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import {
  existsSync,
  lstatSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { execPath } from "node:process";
import { after, test } from "node:test";
import { fileURLToPath } from "node:url";

import { sheet } from "../scripts/decide.mjs";
import {
  itemProblem,
  mustAsk,
  readWaiting,
  WAITING_FOLDER,
  WAITING_LIST,
} from "../templates/tools/design-assembly/waiting.mjs";

const PLUGIN = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DECIDE = path.join(PLUGIN, "scripts/decide.mjs");
const WHO = ["--by", "Test Person", "--on", "2026-11-17"];

const made = [];
after(() => made.forEach((dir) => rmSync(dir, { recursive: true, force: true })));
const empty = () => {
  const dir = mkdtempSync(path.join(tmpdir(), "design-waiting-"));
  made.push(dir);
  return dir;
};
const put = (dir, file, text) => {
  mkdirSync(path.dirname(path.join(dir, file)), { recursive: true });
  writeFileSync(path.join(dir, file), text);
};
const text = (dir, file) => readFileSync(path.join(dir, file), "utf8");
const data = (dir, file) => JSON.parse(text(dir, file));
const cli = (...args) => spawnSync(execPath, [DECIDE, ...args], { encoding: "utf8" });
const ids = (list) => list.map((item) => item.id);

// Every file of a folder with the hash of its bytes.
function snapshot(dir, at = "") {
  return readdirSync(path.join(dir, at))
    .sort()
    .flatMap((name) => {
      const relative = path.posix.join(at, name);
      const full = path.join(dir, relative);
      if (lstatSync(full).isDirectory()) return [`${relative}/`, ...snapshot(dir, relative)];
      return [`${relative} ${createHash("sha256").update(readFileSync(full)).digest("hex")}`];
    });
}
const changed = (before, now) => now.filter((line) => !before.includes(line));
const files = (lines) =>
  lines.filter((line) => !line.endsWith("/")).map((line) => line.split(" ")[0]);

const LIST = {
  version: 1,
  about: "Questions for the owner.",
  rows: [
    { id: "A1", question: "The bar sits on top", recommendation: "Keep it", hard_to_undo: false },
    {
      id: "A2",
      question: "Which money unit?",
      recommendation: "VND",
      answer: "keep",
      by: "Owner",
      on: "2026-11-16",
    },
    { id: "A10", question: "Ten comes after two", recommendation: "Keep it" },
    { id: "D1", kind: "permission", question: "Allow the paid measurement" },
  ],
};
// A repository whose waiting list is already one file per question.
function folderRepo() {
  const dir = empty();
  for (const row of LIST.rows)
    put(dir, `${WAITING_FOLDER}/${row.id}.json`, `${JSON.stringify(row, null, 2)}\n`);
  return dir;
}
const ASK = [
  "--ask",
  "Does the list of orders get a column for the courier?",
  "--recommend",
  "Add it, after the date",
  "--because",
  "the order screen shows the courier; the list does not",
  "--easy-to-undo",
];

test("decide --ask writes one new file for the question and touches no other file", () => {
  const dir = folderRepo();
  const before = snapshot(dir);
  const run = cli("--target", dir, ...ASK, "--on", "2026-11-17", "--json");
  assert.equal(run.status, 1, run.stderr);
  const result = JSON.parse(run.stdout);
  const added = files(changed(before, snapshot(dir)));
  assert.equal(added.length, 1, added.join(", "));
  assert.match(added[0], new RegExp(`^${WAITING_FOLDER}/[^/]+\\.json$`));
  assert.equal(added[0], `${WAITING_FOLDER}/${result.asked.id}.json`);
  // Nothing that was there changed, byte for byte.
  assert.deepEqual(
    before.filter((line) => !snapshot(dir).includes(line)),
    [],
  );
  const question = data(dir, added[0]);
  assert.equal(question.id, result.asked.id);
  assert.equal(question.question, ASK[1]);
  assert.equal(question.recommendation, ASK[3]);
  assert.equal(question.basis, ASK[5]);
  assert.equal(question.hard_to_undo, false);
  assert.equal(question.asked_on, "2026-11-17");
  assert.equal(question.answer, undefined);
  // An ordinary question: the agent goes on with its own recommendation.
  assert.equal(result.asked.may_go_on, true);
});

test("decide shows an asked question with every other question, in the order of their ids", () => {
  const dir = folderRepo();
  const run = cli("--target", dir, ...ASK, "--id", "A3", "--json");
  assert.equal(run.status, 1, run.stderr);
  const now = sheet(dir);
  assert.deepEqual(ids(now.questions), ["A1", "A3", "A10"]);
  assert.deepEqual(ids(now.answered), ["A2"]);
  assert.deepEqual(ids(now.permissions), ["D1"]);
  const shown = cli("--target", dir);
  assert.equal(shown.status, 1);
  assert.match(shown.stdout, /A3: Does the list of orders get a column for the courier\?/);
  assert.match(shown.stdout, /recommendation: Add it, after the date/);
});

test("two agents asking on two branches write two files, so the branches merge with nothing in common", () => {
  const one = folderRepo();
  const two = folderRepo();
  const base = snapshot(one);
  assert.equal(cli("--target", one, ...ASK).status, 1);
  const other = [...ASK];
  other[1] = "Does the order screen show the weight?";
  assert.equal(cli("--target", two, ...other).status, 1);
  const a = files(changed(base, snapshot(one)));
  const b = files(changed(base, snapshot(two)));
  assert.equal(a.length, 1);
  assert.equal(b.length, 1);
  assert.notEqual(a[0], b[0]);
});

test("the first question of a repository with no waiting list starts the folder", () => {
  const dir = empty();
  const run = cli("--target", dir, ...ASK, "--json");
  assert.equal(run.status, 1, run.stderr);
  assert.deepEqual(readdirSync(dir), ["design"]);
  assert.equal(readdirSync(path.join(dir, WAITING_FOLDER)).length, 1);
  assert.equal(sheet(dir).questions.length, 1);
});

test("a new kind of screen and the brand colour are the owner's: the agent is told to stop", () => {
  const dir = empty();
  const page = cli("--target", dir, ...ASK, "--item", "pattern:board", "--json");
  assert.equal(page.status, 1, page.stderr);
  assert.equal(JSON.parse(page.stdout).asked.may_go_on, false);
  assert.match(cli("--target", empty(), ...ASK, "--item", "pattern:board").stdout, /stop/i);
  const colour = cli("--target", empty(), ...ASK, "--item", "source-color:#0246ff", "--json");
  assert.equal(JSON.parse(colour.stdout).asked.may_go_on, false);
  const row = cli("--target", empty(), ...ASK, "--item", "decision:copy-content", "--json");
  assert.equal(JSON.parse(row.stdout).asked.may_go_on, true);
  assert.equal(mustAsk("pattern:board"), true);
  assert.equal(mustAsk("source-color:#0246ff"), true);
  assert.equal(mustAsk("decision:copy-content"), false);
  assert.equal(mustAsk(undefined), false);
});

test("an asked question needs its words, a recommendation, a basis and whether it is hard to undo", () => {
  const without = (flag, takes = true) => {
    const at = ASK.indexOf(flag);
    return [...ASK.slice(0, at), ...ASK.slice(at + (takes ? 2 : 1))];
  };
  for (const args of [
    without("--recommend"),
    without("--because"),
    without("--easy-to-undo", false),
    [...ASK, "--hard-to-undo"],
    [...ASK, "--item", "screen:orders"],
    [...ASK, "--id", "has space"],
  ]) {
    const dir = empty();
    const run = cli("--target", dir, ...args);
    assert.equal(run.status, 2, `${args.join(" ")}\n${run.stdout}`);
    assert.deepEqual(readdirSync(dir), [], args.join(" "));
  }
  // An id that waits already is not written over.
  const dir = folderRepo();
  const before = snapshot(dir);
  const twice = cli("--target", dir, ...ASK, "--id", "A1");
  assert.equal(twice.status, 2);
  assert.match(twice.stderr, /A1/);
  assert.deepEqual(snapshot(dir), before);
  // Asking and answering are two calls.
  assert.equal(cli("--target", dir, ...ASK, "--answers", "x").status, 2);
});

test("a waiting list kept as one shared file is not added to: it is split first", () => {
  const dir = empty();
  put(dir, WAITING_LIST, `${JSON.stringify(LIST, null, 2)}\n`);
  const before = snapshot(dir);
  const run = cli("--target", dir, ...ASK);
  assert.equal(run.status, 2);
  assert.match(run.stderr, /--split/);
  assert.deepEqual(snapshot(dir), before);
});

test("an answer is written into the question's own file, and no other file changes", () => {
  const dir = folderRepo();
  const before = snapshot(dir);
  const answers = path.join(empty(), "answers.txt");
  writeFileSync(answers, "A10 giữ\n");
  const run = cli("--target", dir, ...WHO, "--answers", answers, "--json");
  // A1 still waits.
  assert.equal(run.status, 1, run.stderr);
  assert.deepEqual(files(changed(before, snapshot(dir))), [`${WAITING_FOLDER}/A10.json`]);
  assert.deepEqual(JSON.parse(run.stdout).files, [
    { path: `${WAITING_FOLDER}/A10.json`, change: "update" },
  ]);
  const row = data(dir, `${WAITING_FOLDER}/A10.json`);
  assert.equal(row.answer, "keep");
  assert.equal(row.by, "Test Person");
  assert.equal(row.on, "2026-11-17");
});

test("--split turns the shared file into one file per question, and loses none", () => {
  const dir = empty();
  put(dir, WAITING_LIST, `${JSON.stringify(LIST, null, 2)}\n`);
  const before = snapshot(dir);
  const preview = cli("--target", dir, "--split", "--dry-run");
  assert.equal(preview.status, 0, preview.stderr);
  assert.deepEqual(snapshot(dir), before);
  for (const row of LIST.rows)
    assert.match(preview.stdout, new RegExp(`${WAITING_FOLDER}/${row.id}\\.json`));
  assert.match(preview.stdout, new RegExp(`remove +${WAITING_LIST.replace(".", "\\.")}`));
  const sheetBefore = sheet(dir);
  const run = cli("--target", dir, "--split");
  assert.equal(run.status, 0, run.stderr);
  assert.equal(existsSync(path.join(dir, WAITING_LIST)), false);
  assert.deepEqual(readdirSync(path.join(dir, WAITING_FOLDER)).sort(), [
    "A1.json",
    "A10.json",
    "A2.json",
    "D1.json",
  ]);
  for (const row of LIST.rows) assert.deepEqual(data(dir, `${WAITING_FOLDER}/${row.id}.json`), row);
  assert.deepEqual(sheet(dir), sheetBefore);
  // Nothing left to split.
  assert.equal(cli("--target", dir, "--split").status, 2);
});

test("the waiting list cannot be read with two sources, a file named for another id, or a file that is not a question", () => {
  const both = folderRepo();
  put(both, WAITING_LIST, `${JSON.stringify(LIST)}\n`);
  assert.throws(() => readWaiting(both), /two sources/);
  assert.equal(cli("--target", both).status, 2);

  const misnamed = folderRepo();
  put(misnamed, `${WAITING_FOLDER}/B7.json`, JSON.stringify({ id: "B8", question: "?" }));
  assert.throws(() => readWaiting(misnamed), /B7\.json.*B8/);

  const broken = folderRepo();
  put(broken, `${WAITING_FOLDER}/C1.json`, "{ not json");
  assert.throws(() => readWaiting(broken), /C1\.json is not JSON/);

  const strange = folderRepo();
  put(
    strange,
    `${WAITING_FOLDER}/C2.json`,
    JSON.stringify({ id: "C2", question: "?", item: "screen:x" }),
  );
  assert.throws(() => readWaiting(strange), /item/);

  // A file that is not JSON beside them is no question, and is left alone.
  const noted = folderRepo();
  put(noted, `${WAITING_FOLDER}/README.md`, "What this folder is.\n");
  assert.deepEqual(ids(readWaiting(noted).rows), ["A1", "A2", "A10", "D1"]);
});

test("the item a question names is one of three kinds, each exact", () => {
  assert.equal(itemProblem("decision:copy-content"), null);
  assert.equal(itemProblem("pattern:board"), null);
  assert.equal(itemProblem("source-color:oklch(0.51 0.274 263.68)"), null);
  for (const bad of ["decision:", "board", "screen:x", "pattern:a/b", "", 3]) {
    assert.notEqual(itemProblem(bad), null, String(bad));
  }
});

test("an id that would make a hidden file is refused, and --split stops before it loses a question", () => {
  const dir = folderRepo();
  const before = snapshot(dir);
  const hidden = cli("--target", dir, ...ASK, "--id", ".x");
  assert.equal(hidden.status, 2);
  assert.deepEqual(snapshot(dir), before);
  // A shared file with such a row cannot be split: the file it would get is never read.
  const shared = empty();
  const rows = [...LIST.rows, { id: ".hidden", question: "Lost?" }];
  put(shared, WAITING_LIST, `${JSON.stringify({ ...LIST, rows }, null, 2)}\n`);
  assert.deepEqual(ids(sheet(shared).questions), ["A1", "A10", ".hidden"]);
  const split = cli("--target", shared, "--split");
  assert.equal(split.status, 2);
  assert.match(split.stderr, /\.hidden/);
  assert.equal(existsSync(path.join(shared, WAITING_LIST)), true);
  assert.equal(existsSync(path.join(shared, WAITING_FOLDER)), false);
});

test("an id the shared file always took is still read there, and stops a split rather than a gate", () => {
  const shared = empty();
  const rows = [...LIST.rows, { id: "B/1", question: "Kept as it was?" }];
  put(shared, WAITING_LIST, `${JSON.stringify({ ...LIST, rows }, null, 2)}\n`);
  assert.deepEqual(ids(readWaiting(shared).rows), ["A1", "A2", "A10", "D1", "B/1"]);
  const split = cli("--target", shared, "--split");
  assert.equal(split.status, 2);
  assert.match(split.stderr, /B\/1/);
  assert.equal(existsSync(path.join(shared, WAITING_FOLDER)), false);
});

test("asking again about an item the owner answered says what the answer was, not to pick another id", () => {
  const dir = folderRepo();
  put(
    dir,
    `${WAITING_FOLDER}/pattern-board.json`,
    JSON.stringify({
      id: "pattern-board",
      question: "Add a board?",
      item: "pattern:board",
      answer: "keep",
      by: "Owner",
      on: "2026-11-17",
    }),
  );
  const kept = cli("--target", dir, ...ASK, "--item", "pattern:board");
  assert.equal(kept.status, 2);
  assert.match(kept.stderr, /answered.*kept.*go on/i);
  put(
    dir,
    `${WAITING_FOLDER}/pattern-board.json`,
    JSON.stringify({
      id: "pattern-board",
      question: "Add a board?",
      item: "pattern:board",
      answer: "refuse",
      said: "use the list",
      by: "Owner",
      on: "2026-11-17",
    }),
  );
  const refused = cli("--target", dir, ...ASK, "--item", "pattern:board");
  assert.match(refused.stderr, /refused.*use the list.*stop/i);
  put(
    dir,
    `${WAITING_FOLDER}/pattern-board.json`,
    JSON.stringify({ id: "pattern-board", question: "Add a board?", item: "pattern:board" }),
  );
  assert.match(
    cli("--target", dir, ...ASK, "--item", "pattern:board").stderr,
    /waits on the owner/,
  );
});

// A question the command that takes a block in queues: the need it is about, and the candidates
// the owner picks from, the recommended one first and "by-hand" last.
const NEED_QUESTION = {
  id: "intake-narrow-list",
  question: "Which block answers the need narrow-list?",
  recommendation: "filter-bar, from the outside source kit",
  basis: "filter-bar holds every word of narrow list",
  hard_to_undo: false,
  item: "need:narrow-list",
  asked_on: "2026-11-19",
  candidates: [
    { name: "filter-bar", store: "sources/kit", why: "holds every word" },
    { name: "list-filter", store: "sources/kit", why: "holds every word" },
    { name: "by-hand", store: "by-hand", why: "made in the repository" },
  ],
};

test("a question can name a need, or what came before a ledger, and carry the candidates to pick from", () => {
  assert.equal(itemProblem("need:narrow-list"), null);
  assert.equal(itemProblem("before:intake"), null);
  for (const bad of ["need:", "need:Narrow", "need:a--b", "before:", "before:a/b"]) {
    assert.notEqual(itemProblem(bad), null, bad);
  }
  // Neither is the owner's alone: an agent that asks one goes on.
  assert.equal(mustAsk("need:narrow-list"), false);
  const dir = empty();
  put(dir, `${WAITING_FOLDER}/${NEED_QUESTION.id}.json`, JSON.stringify(NEED_QUESTION));
  assert.deepEqual(ids(readWaiting(dir).rows), [NEED_QUESTION.id]);
  // Candidates are a list of named things, each named once.
  for (const candidates of [[], "filter-bar", [{ store: "x" }], [{ name: "a" }, { name: "a" }]]) {
    put(
      dir,
      `${WAITING_FOLDER}/${NEED_QUESTION.id}.json`,
      JSON.stringify({ ...NEED_QUESTION, candidates }),
    );
    assert.throws(() => readWaiting(dir), /candidates/, JSON.stringify(candidates));
  }
});

test("an answer to a question with candidates names one of them, or by-hand; any other value is refused", () => {
  const dir = empty();
  const file = `${WAITING_FOLDER}/${NEED_QUESTION.id}.json`;
  put(dir, file, JSON.stringify(NEED_QUESTION));
  const answers = path.join(empty(), "answers.txt");
  const answer = (line) => {
    writeFileSync(answers, `${line}\n`);
    return cli("--target", dir, "--answers", answers, ...WHO, "--json");
  };
  const before = snapshot(dir);
  const stranger = answer(`${NEED_QUESTION.id} data-grid-9`);
  assert.equal(stranger.status, 2, stranger.stdout);
  assert.match(stranger.stderr, /data-grid-9.*filter-bar, list-filter, by-hand/);
  assert.deepEqual(snapshot(dir), before);
  const other = answer(`${NEED_QUESTION.id} list-filter`);
  assert.equal(other.status, 0, other.stderr);
  assert.equal(data(dir, file).answer, "value");
  assert.equal(data(dir, file).said, "list-filter");
  // The gate reads the same rule: a value no candidate has cannot be read.
  put(dir, file, JSON.stringify({ ...data(dir, file), said: "data-grid-9" }));
  assert.throws(() => readWaiting(dir), /data-grid-9/);
});

test("an answer to what came before a ledger names some of its candidates, by a comma between them", () => {
  const dir = empty();
  const file = `${WAITING_FOLDER}/intake-before.json`;
  const question = {
    id: "intake-before",
    question: "List these components as made before the intake ledger?",
    recommendation: "list all of them",
    basis: "screens use them and no block records them",
    hard_to_undo: false,
    item: "before:intake",
    candidates: [{ name: "AppFrame" }, { name: "Notice" }, { name: "ItemList" }],
  };
  put(dir, file, JSON.stringify(question));
  const answers = path.join(empty(), "answers.txt");
  writeFileSync(answers, "intake-before AppFrame, Ghost\n");
  const wrong = cli("--target", dir, "--answers", answers, ...WHO);
  assert.equal(wrong.status, 2);
  assert.match(wrong.stderr, /Ghost/);
  writeFileSync(answers, "intake-before AppFrame, Notice\n");
  const right = cli("--target", dir, "--answers", answers, ...WHO);
  assert.equal(right.status, 0, right.stderr);
  assert.equal(data(dir, file).said, "AppFrame, Notice");
});

test("the sheet shows the candidates of a question, to a person and to a machine", () => {
  const dir = empty();
  put(dir, `${WAITING_FOLDER}/${NEED_QUESTION.id}.json`, JSON.stringify(NEED_QUESTION));
  const shown = cli("--target", dir);
  assert.equal(shown.status, 1, shown.stderr);
  assert.match(shown.stdout, /candidates:/);
  assert.match(shown.stdout, /1\. filter-bar \(sources\/kit\)/);
  assert.match(shown.stdout, /3\. by-hand/);
  const machine = JSON.parse(cli("--target", dir, "--json").stdout);
  assert.deepEqual(
    machine.questions[0].candidates.map((item) => item.name),
    ["filter-bar", "list-filter", "by-hand"],
  );
});
