// The decision sheet on throwaway repositories: rows of the ledger nobody confirmed, and a waiting
// list kept as data. Nothing is written before a person answers; an answer carries a name and a
// date; a refusal stays, with what the owner said. Then this repository's own waiting list: every
// row of the page it was converted from is in the data, and the machine answered none.
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import {
  cpSync,
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
import { env as ENV, execPath } from "node:process";
import { after, test } from "node:test";
import { fileURLToPath } from "node:url";

import { parseAnswers, report, sheet, WAITING_LIST } from "../scripts/decide.mjs";
import { status } from "../scripts/status.mjs";
import { withoutBlock } from "../templates/tools/design-assembly/theme.mjs";
import { readWaiting, WAITING_FOLDER } from "../templates/tools/design-assembly/waiting.mjs";

const PLUGIN = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const ROOT = path.resolve(PLUGIN, "../..");
const DECIDE = path.join(PLUGIN, "scripts/decide.mjs");
const APPLY = path.join(PLUGIN, "scripts/apply.mjs");
const reference = (file) => JSON.parse(readFileSync(path.join(PLUGIN, "references", file), "utf8"));
const LAYERS = reference("layers.json").layers;
const LEDGER = "design/decisions.yaml";
const BLUEPRINT = "design/blueprint.json";
const WHO = ["--by", "Test Person", "--on", "2026-11-15"];

const made = [];
after(() => made.forEach((dir) => rmSync(dir, { recursive: true, force: true })));

const put = (dir, file, text) => {
  mkdirSync(path.dirname(path.join(dir, file)), { recursive: true });
  writeFileSync(path.join(dir, file), text);
};
const text = (dir, file) => readFileSync(path.join(dir, file), "utf8");
const data = (dir, file) => JSON.parse(text(dir, file));
const edit = (dir, file, change) => put(dir, file, change(text(dir, file)));
const empty = () => {
  const dir = mkdtempSync(path.join(tmpdir(), "design-decide-"));
  made.push(dir);
  return dir;
};
// A repository the guide was applied to with every answer proposed by the guide: three rows of its
// ledger are a person's calls that nobody confirmed. Applying is slow, so it is built once.
let proposed = null;
function build() {
  const dir = empty();
  put(dir, "src/index.css", withoutBlock(text(ROOT, "src/index.css")));
  put(dir, "Makefile", text(ROOT, "Makefile"));
  const choices = {
    context: { product_type: "application", conformance_level: "AA" },
    patterns: { record_panel: "beside" },
    foundations: {
      source_color: "#0246ff",
      type_scale: "standard",
      spacing_unit: "4px",
      corner_radius: "small",
    },
  };
  const layers = Object.fromEntries(
    LAYERS.map((layer) => [
      layer.id,
      layer.built
        ? { status: "decided", source: "proposed", choice: choices[layer.id], why: "For the test." }
        : { status: "planned" },
    ]),
  );
  put(dir, BLUEPRINT, JSON.stringify({ version: 1, status: "approved", layers }));
  const run = spawnSync(execPath, [APPLY, "--target", dir]);
  assert.equal(run.status, 0, String(run.stderr));
  return dir;
}
// The waiting list of the throwaway repository: a question that says everything a row can say, one
// that says only what it must, and a permission.
const LIST = {
  version: 1,
  rows: [
    {
      id: "Q1",
      group: "Chosen by the machine",
      question: "The navigation bar sits on top",
      recommendation: "Keep it",
      basis: "the machine built it; decision 0025",
      hard_to_undo: true,
      where: "0025",
      if_refused: "Build the frame again",
    },
    { id: "Q2", question: "Which unit does the sample use for money?", recommendation: "VND" },
    { id: "P1", kind: "permission", question: "Allow the paid measurement" },
  ],
};
function repo({ list = LIST } = {}) {
  proposed ??= build();
  const dir = empty();
  cpSync(proposed, dir, { recursive: true });
  if (list) put(dir, WAITING_LIST, `${JSON.stringify(list, null, 2)}\n`);
  return dir;
}
const answersFile = (lines) => {
  const file = path.join(empty(), "answers.txt");
  writeFileSync(file, `${lines.join("\n")}\n`);
  return file;
};

// Every file of a folder with the hash of its bytes: two equal snapshots are one tree, byte for byte.
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
const changed = (before, after) => after.filter((line) => !before.includes(line));
const cli = (...args) => spawnSync(execPath, [DECIDE, ...args], { encoding: "utf8" });
const ids = (list) => list.map((item) => item.id);
const CALLS = ["product-type", "conformance-level", "source-color"];
const noteOf = (dir, id) =>
  new RegExp(`  - id: ${id}\\n(?:    (?!note:).*\\n)*    note: (.*)\\n`).exec(
    text(dir, LEDGER),
  )?.[1];

test("with no answers the sheet lists every question, ends with 1, and leaves the tree byte for byte", () => {
  const dir = repo();
  const before = snapshot(dir);
  const run = cli("--target", dir);
  assert.equal(run.status, 1);
  const result = sheet(dir);
  assert.deepEqual(ids(result.questions), [...CALLS, "Q1", "Q2"]);
  assert.deepEqual(ids(result.permissions), ["P1"]);
  assert.deepEqual(result.answered, []);
  for (const item of result.questions) {
    assert.ok(run.stdout.includes(`${item.id}`), item.id);
    assert.ok(run.stdout.includes(item.question), item.id);
    assert.ok(run.stdout.includes(`recommendation: ${item.recommendation}`), item.id);
  }
  assert.match(run.stdout, /^decision sheet: 5 question\(s\) wait on the owner/m);
  assert.ok(run.stdout.includes("P1: Allow the paid measurement"));
  assert.equal(cli("--target", dir, "--json").status, 1);
  assert.equal(cli("--target", dir, "--dry-run").status, 1);
  assert.equal(spawnSync(execPath, [DECIDE], { cwd: dir }).status, 1);
  assert.deepEqual(snapshot(dir), before);
  // The snapshot can see a change: one byte more is another tree.
  put(dir, "Makefile", `${text(dir, "Makefile")}\n`);
  assert.notDeepEqual(snapshot(dir), before);
});

test("the machine gets the keys the specification lists: each question with its recommendation, its basis, and whether it is hard to undo", () => {
  const dir = repo();
  const result = JSON.parse(cli("--target", dir, "--json").stdout);
  // The five lists of the sheet, between the two keys every command that writes gives.
  assert.deepEqual(Object.keys(result), [
    "dry_run",
    "questions",
    "answered",
    "elsewhere",
    "permissions",
    "replaced",
    "files",
  ]);
  assert.deepEqual(result, { dry_run: false, ...sheet(dir), files: [] });
  for (const item of result.questions) {
    assert.deepEqual(Object.keys(item), [
      "id",
      "source",
      "group",
      "question",
      "recommendation",
      "basis",
      "hard_to_undo",
      "where",
      "if_refused",
    ]);
    for (const key of ["id", "source", "question", "recommendation"]) {
      assert.ok(String(item[key] ?? "").trim() !== "", `${item.id}: no ${key}`);
    }
  }
  const of = (id) => result.questions.find((item) => item.id === id);
  // A row of the ledger takes its recommendation and its basis from the status: one rule, one place.
  const waiting = status(dir).waiting.find((item) => item.id === "source-color");
  assert.equal(of("source-color").source, "ledger");
  assert.equal(of("source-color").question, waiting.question);
  assert.equal(of("source-color").recommendation, waiting.recommendation);
  assert.equal(of("source-color").basis, waiting.basis);
  assert.match(of("source-color").basis, /^(a measurement on this repository|a standard): /);
  // A row of the waiting list says what the list says, and nothing is made up where it is silent.
  assert.deepEqual(of("Q1"), {
    id: "Q1",
    source: "waiting-list",
    group: "Chosen by the machine",
    question: "The navigation bar sits on top",
    recommendation: "Keep it",
    basis: "the machine built it; decision 0025",
    hard_to_undo: true,
    where: "0025",
    if_refused: "Build the frame again",
  });
  assert.equal(of("Q2").basis, null);
  assert.equal(of("Q2").hard_to_undo, null);
  assert.deepEqual(result.permissions, [
    { id: "P1", source: "waiting-list", group: null, what: "Allow the paid measurement" },
  ]);
});

test("a question that is hard to undo is marked, and one that is not is not", () => {
  const dir = repo();
  // A row of a layer the others are built on is hard to undo; a row of a later layer is not.
  edit(dir, LEDGER, (ledger) =>
    ledger.replace(
      /(- id: checks-in-gate\n(?: {4}.*\n)*? {4}check: .*\n)/,
      '$1    note: "proposed by the guide; a person has not confirmed it"\n',
    ),
  );
  const result = sheet(dir);
  const of = (id) => result.questions.find((item) => item.id === id);
  assert.equal(of("source-color").hard_to_undo, true);
  assert.equal(of("product-type").hard_to_undo, true);
  assert.equal(of("checks-in-gate").hard_to_undo, false);
  const printed = report(result);
  assert.match(printed, /^ {2}source-color \[hard to undo\]: /m);
  assert.match(printed, /^ {2}Q1 \[hard to undo\]: /m);
  assert.match(printed, /^ {2}checks-in-gate: /m);
  assert.match(printed, /^ {2}Q2: /m);
  // What refusing costs is printed under every question that says it, and under no other.
  assert.ok(printed.includes("      if refused: Build the frame again\n"));
  assert.equal(printed.match(/^ {6}if refused: /gm).length, 1);
  // The sheet does not let silence read as "easy to undo".
  assert.match(printed, /^hard to undo: 4 marked; 1 row\(s\) of the waiting list do not say$/m);
});

test("--only narrows the sheet, the data and the exit code to the questions named", () => {
  const dir = repo();
  const run = cli("--target", dir, "--only", "Q2,source-color", "--json");
  assert.equal(run.status, 1);
  const result = JSON.parse(run.stdout);
  assert.deepEqual(ids(result.questions), ["source-color", "Q2"]);
  assert.deepEqual(result.permissions, []);
  const printed = cli("--target", dir, "--only", "Q2").stdout;
  assert.ok(printed.includes("Q2: Which unit"));
  assert.ok(!printed.includes("Q1") && !printed.includes("product-type"));
  // A permission can be named: it is listed, and it does not count as a question.
  const permission = cli("--target", dir, "--only", "P1", "--json");
  assert.equal(permission.status, 0);
  assert.deepEqual(ids(JSON.parse(permission.stdout).permissions), ["P1"]);
  // An id the sheet does not have is a wrong call.
  const stranger = cli("--target", dir, "--only", "Q2,Q9");
  assert.equal(stranger.status, 2);
  assert.equal(stranger.stdout, "");
  assert.match(stranger.stderr, /^design-assembly: .*Q9/);
});

test("an answers file is one line per answer: the id, then giữ, bác with a sentence, or a value", () => {
  const read = parseAnswers(
    [
      "# what the owner said on the call",
      "",
      "A1 giữ",
      "A2   Giữ  ",
      "A3 keep",
      "A4 giữ",
      "B1 bác Đổi màn mẫu thứ hai thành «mục sắp hết hạn»",
      "B2 bác",
      "B3 refuse say it in English",
      "C1 Màn thật",
      "C2 giữ nhưng làm sau lát đầu",
    ].join("\n"),
  );
  assert.deepEqual(read, [
    { id: "A1", answer: "keep", said: null },
    { id: "A2", answer: "keep", said: null },
    { id: "A3", answer: "keep", said: null },
    { id: "A4", answer: "keep", said: null },
    { id: "B1", answer: "refuse", said: "Đổi màn mẫu thứ hai thành «mục sắp hết hạn»" },
    { id: "B2", answer: "refuse", said: null },
    { id: "B3", answer: "refuse", said: "say it in English" },
    { id: "C1", answer: "value", said: "Màn thật" },
    { id: "C2", answer: "keep", said: "nhưng làm sau lát đầu" },
  ]);
  // A line with an id and nothing after it is not an answer, and an id is answered once.
  assert.throws(() => parseAnswers("A1\n"), /line 1.*no answer/);
  assert.throws(() => parseAnswers("A1 giữ\n\nA1 bác\n"), /line 3.*A1.*twice/);
});

test("answers are written with the person's name and the date, answered questions leave the sheet, and it ends with 0 when none waits", () => {
  const dir = repo();
  const ledger = text(dir, LEDGER);
  const first = cli(
    "--target",
    dir,
    ...WHO,
    "--answers",
    answersFile([
      "product-type giữ",
      "source-color bác Lam đậm hơn, gần màu thương hiệu",
      "Q1 giữ",
      "Q2 đồng, viết tắt là đ",
    ]),
  );
  assert.equal(first.status, 1, first.stderr);
  assert.match(first.stdout, /^answers recorded: 4, by Test Person on 2026-11-15$/m);

  // The rows of the ledger carry who answered and when, in the note, the one key the shape of the
  // ledger has for words. Every other byte of the ledger is as it was.
  assert.equal(
    noteOf(dir, "product-type"),
    '"proposed by the guide; confirmed by Test Person on 2026-11-15"',
  );
  assert.equal(
    noteOf(dir, "source-color"),
    '"proposed by the guide; refused by Test Person on 2026-11-15: Lam đậm hơn, gần màu thương hiệu"',
  );
  const untouched = (whole) =>
    whole
      .split("\n")
      .filter(
        (line) => !/^ {4}note: "proposed by the guide; (a person|confirmed|refused)/.test(line),
      );
  assert.deepEqual(untouched(text(dir, LEDGER)), untouched(ledger));
  assert.equal(text(dir, LEDGER).split("\n").length, ledger.split("\n").length);
  // The rows of the waiting list carry the same, as data.
  const rows = data(dir, WAITING_LIST).rows;
  assert.deepEqual(rows[0], {
    ...LIST.rows[0],
    answer: "keep",
    by: "Test Person",
    on: "2026-11-15",
  });
  assert.deepEqual(rows[1], {
    ...LIST.rows[1],
    answer: "value",
    said: "đồng, viết tắt là đ",
    by: "Test Person",
    on: "2026-11-15",
  });
  assert.deepEqual(rows[2], LIST.rows[2]);

  // What is answered leaves the sheet and is listed as answered; what is not still waits.
  const now = sheet(dir);
  assert.deepEqual(ids(now.questions), ["conformance-level"]);
  assert.deepEqual(now.answered, [
    {
      id: "product-type",
      source: "ledger",
      answer: "keep",
      said: null,
      by: "Test Person",
      on: "2026-11-15",
    },
    {
      id: "source-color",
      source: "ledger",
      answer: "refuse",
      said: "Lam đậm hơn, gần màu thương hiệu",
      by: "Test Person",
      on: "2026-11-15",
    },
    {
      id: "Q1",
      source: "waiting-list",
      answer: "keep",
      said: null,
      by: "Test Person",
      on: "2026-11-15",
    },
    {
      id: "Q2",
      source: "waiting-list",
      answer: "value",
      said: "đồng, viết tắt là đ",
      by: "Test Person",
      on: "2026-11-15",
    },
  ]);
  // The run that wrote the answers already showed the sheet as it now is.
  assert.ok(first.stdout.endsWith(report(now)));
  // The status reads the same rows, and no longer lists what a person answered.
  assert.deepEqual(ids(status(dir).waiting), ["conformance-level"]);

  // The last answer: nothing waits, and the run ends with 0. The permission is still listed.
  const last = cli(
    "--target",
    dir,
    "--by",
    "Another Person",
    "--on",
    "2026-11-16",
    "--answers",
    answersFile(["conformance-level AAA"]),
  );
  assert.equal(last.status, 0, last.stderr);
  assert.equal(
    noteOf(dir, "conformance-level"),
    '"proposed by the guide; answered by Another Person on 2026-11-16: AAA"',
  );
  const done = cli("--target", dir);
  assert.equal(done.status, 0);
  assert.match(done.stdout, /^decision sheet: no question waits on the owner/m);
  assert.ok(done.stdout.includes("P1: Allow the paid measurement"));
  assert.deepEqual(ids(sheet(dir).answered), [...CALLS, "Q1", "Q2"]);
});

test("a refusal is not deleted: the row stays, with what the owner said, and every later sheet names it", () => {
  const dir = repo();
  const rowsBefore = text(dir, LEDGER).match(/^ {2}- id: /gm).length;
  const run = cli(
    "--target",
    dir,
    ...WHO,
    "--answers",
    answersFile(["source-color bác", "Q1 bác Put the bar on the left"]),
  );
  assert.equal(run.status, 1, run.stderr);
  assert.equal(text(dir, LEDGER).match(/^ {2}- id: /gm).length, rowsBefore);
  assert.equal(
    noteOf(dir, "source-color"),
    '"proposed by the guide; refused by Test Person on 2026-11-15"',
  );
  const row = data(dir, WAITING_LIST).rows.find((item) => item.id === "Q1");
  assert.equal(row.question, LIST.rows[0].question);
  assert.deepEqual(
    [row.answer, row.said, row.by, row.on],
    ["refuse", "Put the bar on the left", "Test Person", "2026-11-15"],
  );
  // No command changes the value for a refusal: the sheet keeps saying so, by name.
  const later = cli("--target", dir).stdout;
  assert.match(later, /refused or given another answer.*: source-color, Q1$/m);
});

test("a kept answer stays kept when the guide runs again", () => {
  const dir = repo();
  const run = cli(
    "--target",
    dir,
    ...WHO,
    "--answers",
    answersFile(["product-type giữ", "source-color bác"]),
  );
  assert.equal(run.status, 1, run.stderr);
  // The guide writes these rows again from the blueprint: the blueprint says which a person confirmed.
  assert.deepEqual(data(dir, BLUEPRINT).layers.context.confirmed, ["product_type"]);
  assert.equal(data(dir, BLUEPRINT).layers.foundations.confirmed, undefined);
  assert.equal(spawnSync(execPath, [APPLY, "--target", dir]).status, 0);
  const waiting = ids(status(dir).waiting);
  assert.ok(
    !waiting.includes("product-type"),
    "the guide turned a person's answer back into a proposal",
  );
  // What the guide does not keep is a limit, written down: the refusal is a question again.
  assert.ok(waiting.includes("source-color"));
  assert.ok(
    reference("limits.json").limits.some(
      (limit) => limit.id === "decide-guide-rewrites-an-answered-row" && limit.status === "open",
    ),
  );
});

test("--dry-run writes nothing, and names exactly the files the real run then writes", () => {
  const dir = repo();
  const before = snapshot(dir);
  const answers = answersFile(["product-type giữ", "Q2 bác Use USD"]);
  const preview = cli("--target", dir, ...WHO, "--answers", answers, "--dry-run");
  assert.equal(preview.status, 1, preview.stderr);
  assert.deepEqual(snapshot(dir), before);
  assert.match(
    preview.stdout,
    /^answers that would be recorded: 2, by Test Person on 2026-11-15$/m,
  );
  assert.match(
    preview.stdout,
    /^preview only: nothing was written; the sheet below is as it would be$/m,
  );
  const named = (out) =>
    [...out.matchAll(/^ {2}(create|update) +(\S+?):/gm)].map((found) => found[2]);
  assert.deepEqual(named(preview.stdout), [LEDGER, BLUEPRINT, WAITING_LIST]);
  // What changes in each file is said, row by row.
  assert.match(preview.stdout, /design\/decisions\.yaml: .*product-type/);
  assert.match(preview.stdout, /design\/waiting-list\.json: .*Q2/);

  const real = cli("--target", dir, ...WHO, "--answers", answers);
  assert.equal(real.status, 1, real.stderr);
  const touched = changed(before, snapshot(dir)).map((line) => line.split(" ")[0]);
  assert.deepEqual(touched.sort(), named(preview.stdout).sort());
  assert.deepEqual(named(real.stdout), named(preview.stdout));
  // The preview is the real run's output, but for the two lines that say nothing was written.
  const same = (out) =>
    out
      .replace("answers that would be recorded", "answers recorded")
      .replace("preview only: nothing was written; the sheet below is as it would be\n", "");
  assert.equal(same(preview.stdout), real.stdout);
  // A preview with no answers has nothing to write, and says so.
  assert.match(
    cli("--target", repo(), "--dry-run").stdout,
    /^preview only: no answers, so nothing to write$/m,
  );
});

test("a malformed answers file, an unknown id or an answer the sheet cannot take ends with 2 and writes nothing", () => {
  const dir = repo();
  cli("--target", dir, ...WHO, "--answers", answersFile(["Q1 giữ"]));
  const before = snapshot(dir);
  const wrong = [
    [["Q2"], /line 1.*no answer/],
    [["Q2 giữ", "Q2 bác"], /Q2.*twice/],
    [["Q9 giữ"], /Q9 is not a question of this sheet/],
    [["Q2 giữ", "nothing-like-it bác x"], /nothing-like-it is not a question/],
    [["P1 giữ"], /P1 is a permission/],
    [["Q1 bác Changed my mind"], /Q1 was answered by Test Person on 2026-11-15/],
    [["source-color bác the palette has not reviewed well"], /source-color.*other words/],
  ];
  for (const [lines, why] of wrong) {
    const run = cli("--target", dir, ...WHO, "--answers", answersFile(lines));
    assert.equal(run.status, 2, lines.join(" | "));
    assert.equal(run.stdout, "", lines.join(" | "));
    assert.match(run.stderr, /^design-assembly: /, lines.join(" | "));
    assert.match(run.stderr, why, lines.join(" | "));
    assert.match(run.stderr, /Nothing was written/, lines.join(" | "));
  }
  // One bad line refuses the whole file: the good line before it is not written either.
  assert.deepEqual(snapshot(dir), before);
  // An answer outside what --only names is a wrong call too.
  const outside = cli(
    "--target",
    dir,
    ...WHO,
    "--only",
    "Q2",
    "--answers",
    answersFile(["product-type giữ"]),
  );
  assert.equal(outside.status, 2);
  assert.deepEqual(snapshot(dir), before);
  // And an id --only names that the sheet does not have stops the run before an answer is written.
  const stranger = cli(
    "--target",
    dir,
    ...WHO,
    "--only",
    "Q2,Q9",
    "--answers",
    answersFile(["Q2 giữ"]),
  );
  assert.equal(stranger.status, 2);
  assert.match(stranger.stderr, /Q9/);
  assert.deepEqual(snapshot(dir), before);
  // With --json the machine is told what was written, and where.
  const told = JSON.parse(
    cli("--target", dir, ...WHO, "--answers", answersFile(["Q2 giữ"]), "--dry-run", "--json")
      .stdout,
  );
  assert.equal(told.dry_run, true);
  assert.deepEqual(told.files, [{ path: WAITING_LIST, change: "update" }]);
  assert.deepEqual(told.recorded, {
    by: "Test Person",
    on: "2026-11-15",
    changes: { [WAITING_LIST]: ["Q2: confirmed by Test Person on 2026-11-15"] },
  });
  assert.ok(told.answered.some((item) => item.id === "Q2"));
  assert.deepEqual(snapshot(dir), before);
});

test("exit codes: 2 on a wrong call or a repository that cannot be read, with nothing printed as an answer", () => {
  const dir = repo();
  const answers = answersFile(["Q1 giữ"]);
  const wrong = [
    ["--target"],
    ["--target", path.join(tmpdir(), "design-decide-no-such-folder")],
    ["--target", DECIDE],
    ["--target", dir, "--all"],
    ["--target", dir, "somewhere"],
    ["--target", dir, "--only"],
    ["--target", dir, "--answers"],
    ["--target", dir, "--answers", path.join(tmpdir(), "design-decide-no-such-file")],
    ["--target", dir, "--answers", answers, "--by", "Test Person", "--on", "15/11/2026"],
    ["--target", dir, "--answers", answers, "--by", "Test Person", "--on", "2026-02-30"],
    ["--target", dir, "--answers", answers, "--by", " ", "--on", "2026-11-15"],
    // Who answered and when go with an answer.
    ["--target", dir, "--by", "Test Person"],
    ["--target", dir, "--on", "2026-11-15"],
  ];
  const before = snapshot(dir);
  for (const args of wrong) {
    const run = cli(...args);
    assert.equal(run.status, 2, args.join(" "));
    assert.equal(run.stdout, "", args.join(" "));
    assert.match(run.stderr, /^(usage|design-assembly): /, args.join(" "));
  }
  assert.deepEqual(snapshot(dir), before);

  // A waiting list that cannot be read is not "nothing waits".
  const unreadable = [
    ["{ not json", /is not JSON/],
    [JSON.stringify({ version: 1 }), /no rows/],
    [JSON.stringify({ version: 2, rows: [] }), /newer/],
    [JSON.stringify({ version: 1, rows: [{ id: "Q1" }] }), /Q1: no question/],
    [
      JSON.stringify({ version: 1, rows: [LIST.rows[1], LIST.rows[1]] }),
      /Q2: a second row has this id/,
    ],
    [
      JSON.stringify({ version: 1, rows: [{ ...LIST.rows[1], anwser: "keep" }] }),
      /Q2: unknown key 'anwser'/,
    ],
    [
      JSON.stringify({ version: 1, rows: [{ ...LIST.rows[1], answer: "keep" }] }),
      /Q2: an answer with no name/,
    ],
    [
      JSON.stringify({ version: 1, rows: [{ ...LIST.rows[1], by: "Someone", on: "2026-11-15" }] }),
      /Q2: a name and a date with no answer/,
    ],
    [
      JSON.stringify({
        version: 1,
        rows: [{ ...LIST.rows[2], answer: "keep", by: "S", on: "2026-11-15" }],
      }),
      /P1: a permission carries no answer/,
    ],
    [
      JSON.stringify({ version: 1, rows: [{ ...LIST.rows[1], id: "source-color" }] }),
      /source-color: the ledger has a row with this id/,
    ],
  ];
  for (const [content, why] of unreadable) {
    const broken = repo({ list: null });
    put(broken, WAITING_LIST, content);
    const run = cli("--target", broken, "--json");
    assert.equal(run.status, 2, content);
    assert.equal(run.stdout, "", content);
    assert.match(
      run.stderr,
      /^design-assembly: this repository cannot be read: design\/waiting-list\.json/,
      content,
    );
    assert.match(run.stderr, why, content);
  }
  const theme = repo();
  put(theme, "design/theme.json", "{ not json");
  assert.equal(cli("--target", theme).status, 2);
});

test("the same repository gives the same sheet twice, to a person and to a machine", () => {
  const dir = repo();
  const first = cli("--target", dir);
  const json = cli("--target", dir, "--json");
  assert.equal(cli("--target", dir).stdout, first.stdout);
  assert.equal(cli("--target", dir, "--json").stdout, json.stdout);
  assert.equal(first.stdout, report(sheet(dir)));
  // With no --target it reads the folder it is run from.
  const here = spawnSync(execPath, [DECIDE, "--json"], { cwd: dir, encoding: "utf8" });
  assert.equal(here.stdout, json.stdout);
  // The sheet does not carry where the repository sits on this machine.
  assert.ok(!first.stdout.includes(dir) && !json.stdout.includes(dir));
  // The same answers on two copies of one repository write the same bytes.
  const [one, two] = [repo(), repo()];
  const answers = answersFile(["product-type giữ", "Q1 bác No", "Q2 USD"]);
  const runs = [one, two].map((copy) => cli("--target", copy, ...WHO, "--answers", answers));
  assert.equal(runs[0].stdout, runs[1].stdout);
  assert.deepEqual(snapshot(one), snapshot(two));
  assert.equal(cli("--target", one).stdout, cli("--target", two).stdout);
});

test("no row carries a person's name before a person answered", () => {
  const dir = repo();
  cli("--target", dir);
  cli("--target", dir, "--json");
  cli("--target", dir, ...WHO, "--answers", answersFile(["Q2 giữ"]), "--dry-run");
  const stamp = /(confirmed|refused|answered) by |"(answer|by|on)":/;
  assert.doesNotMatch(text(dir, LEDGER), stamp);
  assert.doesNotMatch(text(dir, WAITING_LIST), stamp);
  // One answer names one row: the others still carry nobody's name.
  cli("--target", dir, ...WHO, "--answers", answersFile(["Q2 giữ"]));
  assert.equal(text(dir, LEDGER).match(stamp), null);
  assert.equal(text(dir, WAITING_LIST).match(/"by":/g).length, 1);
});

test("who answered: named with --by, else the name git has for the repository, else the call is wrong", () => {
  const env = { ...ENV, GIT_CONFIG_GLOBAL: "/dev/null", GIT_CONFIG_NOSYSTEM: "1" };
  const run = (dir, ...args) =>
    spawnSync(execPath, [DECIDE, "--target", dir, "--on", "2026-11-15", ...args], {
      encoding: "utf8",
      env,
    });
  const dir = repo();
  const answers = answersFile(["Q2 giữ"]);
  const nobody = run(dir, "--answers", answers);
  assert.equal(nobody.status, 2);
  assert.match(nobody.stderr, /--by/);
  assert.equal(data(dir, WAITING_LIST).rows[1].by, undefined);
  const git = (...args) => spawnSync("git", ["-C", dir, ...args], { encoding: "utf8", env });
  if (git("init", "-q").status === 0) {
    git("config", "user.name", "Repository Owner");
    assert.equal(run(dir, "--answers", answers).status, 1);
    assert.equal(data(dir, WAITING_LIST).rows[1].by, "Repository Owner");
  }
  // The date, when not given, is today's.
  const today = repo();
  assert.equal(cli("--target", today, "--by", "Test Person", "--answers", answers).status, 1);
  assert.match(data(today, WAITING_LIST).rows[1].on, /^\d{4}-\d{2}-\d{2}$/);
});

test("a call the ledger has no row for is listed, counted, and sent to the command that records it", () => {
  const dir = repo();
  edit(dir, LEDGER, (ledger) => ledger.replace(/ {2}- id: product-type\n(?: {4}.*\n)*/, ""));
  const result = sheet(dir);
  assert.deepEqual(ids(result.questions), ["conformance-level", "source-color", "Q1", "Q2"]);
  assert.deepEqual(ids(result.elsewhere), ["product-type"]);
  assert.match(result.elsewhere[0].answer_with, /^\/design-assembly:adopt --product-type /);
  assert.ok(report(result).includes(result.elsewhere[0].answer_with));
  // It waits on the owner, so the run ends with 1 even when it alone is left.
  assert.equal(cli("--target", dir, "--only", "product-type").status, 1);
  // The sheet cannot take its answer: a row for it is written while adopting.
  const run = cli("--target", dir, ...WHO, "--answers", answersFile(["product-type application"]));
  assert.equal(run.status, 2);
  assert.match(run.stderr, /product-type.*\/design-assembly:adopt --product-type/);
});

test("a repository with nothing waiting: no ledger and no waiting list, or a waiting list alone", () => {
  const bare = empty();
  assert.deepEqual(sheet(bare), {
    questions: [],
    answered: [],
    elsewhere: [],
    permissions: [],
    replaced: [],
  });
  const run = cli("--target", bare);
  assert.equal(run.status, 0);
  assert.match(run.stdout, /^decision sheet: no question waits on the owner/m);
  assert.deepEqual(readdirSync(bare), []);
  // A waiting list needs no design ledger beside it.
  put(bare, WAITING_LIST, JSON.stringify(LIST));
  assert.deepEqual(ids(sheet(bare).questions), ["Q1", "Q2"]);
  assert.equal(
    cli("--target", bare, ...WHO, "--answers", answersFile(["Q1 giữ", "Q2 giữ"])).status,
    0,
  );
  assert.equal(existsSync(path.join(bare, LEDGER)), false);
});

test("every sheet says what decide cannot see, and names no command the plugin does not have", () => {
  const open = reference("limits.json").limits.filter(
    (limit) => limit.area === "decide" && limit.status === "open",
  );
  assert.ok(open.length > 0, "no limit is written for decide");
  for (const dir of [empty(), repo()]) {
    const result = sheet(dir);
    const printed = report(result);
    for (const limit of open) assert.ok(printed.includes(limit.id), limit.id);
    const named = `${printed}\n${JSON.stringify(result)}`.match(/\/design-assembly:[a-z-]+/g) ?? [];
    for (const command of new Set(named)) {
      const skill = path.join(PLUGIN, "skills", command.split(":")[1], "SKILL.md");
      assert.ok(existsSync(skill), `${command} is not a command of this plugin`);
    }
  }
});

test("the skill of the command exists, calls the script, and forbids answering for the person", () => {
  const skill = readFileSync(path.join(PLUGIN, "skills/decide/SKILL.md"), "utf8");
  assert.match(skill, /^---\nname: decide\ndescription: \S/);
  assert.match(skill, /scripts\/decide\.mjs --target/);
  assert.match(skill, /Never write an answer the person did not give/);
});

// The page this repository kept its waiting list on, as it stood on the main branch the day the
// list became data.
const PAGE_COMMIT = "100eb310cebad864d83cfc59c67f6a03ab8f76b9";
const PAGE = "docs/review-queue.md";
// The rows of B and C whose recommendation was written again on 2026-11-15.
const REFRESHED = ["B1", "B5", "C1", "C3", "C6"];
// The questions that came from the page, by their ids; any other was asked by a command since, about
// an item of its own.
const fromPage = (row) => /^[A-D]\d+$/.test(row.id);
const PAGE_ITEMS = /^(need|before):/;
// The rows of every table of the page, in order: the section heading, then the cells of the row.
function pageRows(page) {
  const rows = [];
  let heading = null;
  for (const line of page.split("\n")) {
    if (line.startsWith("## ")) heading = line.slice(3).trim();
    const cells = /^\|(.*)\|$/
      .exec(line)?.[1]
      .split("|")
      .map((cell) => cell.trim());
    if (!cells || cells[0] === "#" || /^-+$/.test(cells[0])) continue;
    rows.push({ heading, cells });
  }
  return rows;
}

test("this repository's waiting list is data: 25 questions and 2 permissions, and an answer there names a person", () => {
  const all = readWaiting(ROOT).rows;
  const rows = all.filter(fromPage);
  // Every other question was asked by a command since, about a block to take in.
  for (const row of all.filter((item) => !fromPage(item))) {
    assert.match(String(row.item), PAGE_ITEMS, row.id);
  }
  const expected = [
    ...Array.from({ length: 13 }, (_, index) => `A${index + 1}`),
    ...Array.from({ length: 5 }, (_, index) => `B${index + 1}`),
    ...Array.from({ length: 7 }, (_, index) => `C${index + 1}`),
    "D2",
    "D3",
  ];
  assert.deepEqual(ids(rows), expected);
  const result = sheet(ROOT);
  const page = (list) => list.filter(fromPage);
  assert.equal(page(result.questions).length + page(result.answered).length, 25);
  assert.deepEqual(
    [...ids(page(result.questions)), ...ids(page(result.answered))].sort(),
    expected.slice(0, 25).sort(),
  );
  assert.deepEqual(ids(result.permissions), ["D2", "D3"]);
  for (const item of result.questions) {
    assert.ok(String(item.recommendation ?? "").trim() !== "", `${item.id}: no recommendation`);
  }
  // An answer in this list names a person and a date, and the page of the list points at the data.
  for (const row of rows.filter((item) => item.answer)) {
    assert.ok(row.by && /^\d{4}-\d{2}-\d{2}$/.test(row.on), `${row.id}: answered by nobody`);
  }
  // Kept as one file per question since step 8.3a of specification 0005.
  assert.equal(readWaiting(ROOT).shape, "folder");
  assert.ok(text(ROOT, PAGE).includes(WAITING_FOLDER));
});

test("no row of the page was lost when the list became data: every cell is in the data word for word", (t) => {
  const shown = spawnSync("git", ["-C", ROOT, "show", `${PAGE_COMMIT}:${PAGE}`], {
    encoding: "utf8",
  });
  if (shown.status !== 0) return t.skip("the history that holds the page is not in this checkout");
  const page = pageRows(shown.stdout);
  assert.equal(page.length, 27);
  const rows = readWaiting(ROOT).rows.filter(fromPage);
  assert.equal(rows.length, page.length);
  // Which fields hold the cells of a row, by the section of the page the row was in. The page's
  // recommendation is the third cell of a row of B or C; it is checked apart, below.
  const fields = {
    A: ["id", "question", "where", "if_refused"],
    B: ["id", "question"],
    C: ["id", "question"],
    D: ["id", "question"],
  };
  const rewritten = [];
  page.forEach(({ heading, cells }, index) => {
    const row = rows[index];
    const section = cells[0][0];
    assert.deepEqual(
      fields[section].map((field) => row[field]),
      cells.slice(0, fields[section].length),
      cells[0],
    );
    assert.equal(row.group, heading, cells[0]);
    assert.equal(row.kind ?? "question", section === "D" ? "permission" : "question", cells[0]);
    if ("BC".includes(section) && row.recommendation !== cells[2]) rewritten.push(row.id);
  });
  // A recommendation overtaken by what happened since the page was written is written again, and
  // the row's basis says what changed. Every other recommendation is the page's, word for word.
  assert.deepEqual(rewritten, REFRESHED);
});

test("every question of this repository's waiting list is ready to be decided: a basis, what refusing costs, and whether it is hard to undo", () => {
  const result = sheet(ROOT);
  const rows = readWaiting(ROOT)
    .rows.filter(fromPage)
    .filter((row) => row.kind !== "permission");
  assert.equal(rows.length, 25);
  for (const row of rows) {
    assert.ok(String(row.basis ?? "").trim().length > 40, `${row.id}: no basis`);
    assert.equal(typeof row.hard_to_undo, "boolean", `${row.id}: hard to undo is not said`);
    assert.ok(String(row.if_refused ?? "").trim() !== "", `${row.id}: no cost of refusing`);
    // The basis says why the row is, or is not, hard to undo.
    assert.match(row.basis, row.hard_to_undo ? /Khó đảo: / : /Dễ đảo[^:]*: /, row.id);
  }
  // The sheet shows all of it: the mark on each row that has it, counted in the header, and what
  // refusing costs under every question.
  const printed = report(result);
  const marked = result.questions.filter((item) => item.hard_to_undo === true);
  for (const item of result.questions) {
    const mark = item.hard_to_undo ? " [hard to undo]" : "";
    assert.ok(printed.includes(`  ${item.id}${mark}: ${item.question}\n`), item.id);
    assert.ok(printed.includes(`      because: ${item.basis}\n`), item.id);
    assert.ok(printed.includes(`      if refused: ${item.if_refused}\n`), item.id);
  }
  assert.equal((printed.match(/ \[hard to undo\]: /g) ?? []).length, marked.length);
  if (result.questions.length > 0) {
    assert.match(printed, new RegExp(`^hard to undo: ${marked.length} marked$`, "m"));
  }
  assert.doesNotMatch(printed, /do not say|gives no basis/);
});
