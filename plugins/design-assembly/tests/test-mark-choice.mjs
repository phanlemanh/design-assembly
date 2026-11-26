// The owner chooses a mark among the candidates a question offers (spec 0017, criterion 10; the
// limit logo-choice-of-another-candidate-reads-as-otherwise): a question about logo:<id> may offer
// candidates, the recommended one first. Keeping chooses the first; answering with the name of
// another chooses that one. The wall reads either as the owner's choice, holds that the branch's
// logo row is the chosen candidate's (the row says which candidate its package holds), and stays
// red for a refusal, for an answer that names no offered candidate, and for a row of another
// candidate. The gate, status, the decision sheet and logo-source --package say which candidate
// was chosen, by whom and when. Every other item and question reads as it did in 0.74.0, and a
// repository whose installed tool predates this is not turned red by it. No command reaches the
// network, and the made-up names are only data of these tests.
import "./helpers/own-cores.mjs";
import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import {
  cpSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  realpathSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { env, execPath } from "node:process";
import { after, test } from "node:test";
import { fileURLToPath, pathToFileURL } from "node:url";

import { RELEASES } from "../scripts/stamp.mjs";
import { noteLines, runChecks } from "../templates/tools/design-assembly/check.mjs";
import { branchFacts, wallProblem } from "../templates/tools/design-assembly/owner-calls.mjs";
import { readWaiting, WAITING_FOLDER } from "../templates/tools/design-assembly/waiting.mjs";
import { adopted, listIn, OWNER } from "./helpers/core-family.mjs";

const PLUGIN = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const ROOT = path.resolve(PLUGIN, "../..");
const NO_NETWORK = path.join(PLUGIN, "tests/helpers/no-network.mjs");

const made = [];
after(() => made.forEach((dir) => rmSync(dir, { recursive: true, force: true })));
const empty = () => {
  const dir = realpathSync(mkdtempSync(path.join(tmpdir(), "design-mark-choice-")));
  made.push(dir);
  return dir;
};
const put = (dir, file, content) => {
  mkdirSync(path.dirname(path.join(dir, file)), { recursive: true });
  writeFileSync(path.join(dir, file), content);
};
const text = (dir, file) => readFileSync(path.join(dir, file), "utf8");
const json = (dir, file) => JSON.parse(text(dir, file));
const pretty = (data) => `${JSON.stringify(data, null, 2)}\n`;
const sha = (bytes) => createHash("sha256").update(bytes).digest("hex");
const script = (name, plugin = PLUGIN) => path.join(plugin, "scripts", name);
const said = (done) => done.stdout + done.stderr;
// Every command of these tests runs with the network unreachable, and says what it reached for.
const run = (file, ...args) => {
  const log = path.join(empty(), "reached.log");
  const result = spawnSync(execPath, ["--import", NO_NETWORK, file, ...args], {
    encoding: "utf8",
    env: { ...env, DESIGN_ASSEMBLY_NETWORK_LOG: log, DESIGN_ASSEMBLY_CORES: listIn() },
  });
  return { ...result, reached: existsSync(log) ? readFileSync(log, "utf8") : "" };
};
const gate = (dir) => run(path.join(dir, "tools/design-assembly/check.mjs"), "--target", dir);
const logoSource = (dir, ...args) => run(script("logo-source.mjs"), "--target", dir, ...args);
const decide = (dir, ...args) => run(script("decide.mjs"), "--target", dir, ...args);
const status = (dir, ...args) => run(script("status.mjs"), "--target", dir, ...args);
const git = (dir, ...args) => {
  const done = spawnSync("git", ["-C", dir, ...args], { encoding: "utf8" });
  assert.equal(done.status, 0, `git ${args.join(" ")}: ${done.stderr}`);
  return done.stdout;
};

// A made-up product, three made-up candidates for its mark, and the files of two of them.
const PRODUCT = "Fen Kestrel";
const FIRST = "wing-arc";
const SECOND = "two-feathers";
const THIRD = "dot-grid";
const CANDIDATES = [{ name: FIRST }, { name: SECOND }, { name: THIRD }];
const FEATHERS_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><path d="M10 28V6M22 28V6" stroke="#7a4b1f" stroke-width="4"/></svg>\n`;
const ROW = "design/sources/logo.json";
const QUESTION = "mark-kestrel";
const ASKED = "2026-11-26";
const ANSWERED = "2026-11-27";

// A question about the mark, with candidates where given, and the owner's answer where given.
const question = ({ answer, words, candidates = CANDIDATES } = {}) => ({
  id: QUESTION,
  kind: "question",
  question: `Which of the three marks does ${PRODUCT} carry?`,
  recommendation: FIRST,
  basis: "the arc reads at the size of a page icon",
  hard_to_undo: true,
  item: "logo:logo",
  asked_on: ASKED,
  ...(candidates ? { candidates } : {}),
  ...(answer ? { answer, by: OWNER, on: ANSWERED } : {}),
  ...(words !== undefined ? { said: words } : {}),
});
const ask = (dir, row) => put(dir, `${WAITING_FOLDER}/${row.id}.json`, pretty(row));

// A logo row, whole, saying which candidate its package holds where given.
const logoRow = (candidate, file = "public/brand/mark.svg", bytes = FEATHERS_SVG) => ({
  version: 1,
  id: "logo",
  kind: "logo",
  title: PRODUCT,
  pin: { files: [{ file, sha256: sha(bytes), role: "mark", variant: "color" }] },
  licence: `${PRODUCT} is ours; used in the product and on its pages.`,
  made: { by: "logo-design", on: ASKED, ...(candidate ? { candidate } : {}) },
});

// A repository on git, its main branch with a ledger and no mark, and a branch made from it.
function onGit() {
  const dir = empty();
  git(dir, "init", "-q", "-b", "main");
  git(dir, "config", "user.name", "Test Person");
  git(dir, "config", "user.email", "test@example.com");
  put(dir, "design/decisions.yaml", "version: 1\ndecisions: []\n");
  put(dir, "src/index.css", ":root {\n  --primary: oklch(0.5 0.1 60);\n}\n");
  put(dir, "public/brand/mark.svg", FEATHERS_SVG);
  git(dir, "add", "-A");
  git(dir, "commit", "-q", "-m", "start");
  git(dir, "checkout", "-q", "-b", "feature");
  return dir;
}
const where = {
  pages: "design/patterns",
  stylesheet: "src/index.css",
  ledger: "design/decisions.yaml",
};
const facts = (dir) => branchFacts(dir, where);
const waitingOf = (dir) => {
  try {
    return { rows: readWaiting(dir)?.rows ?? [] };
  } catch (error) {
    return { problem: error.message };
  }
};
const wall = (dir) => wallProblem({ branch: facts(dir), waiting: waitingOf(dir) });
// What the gate's wall prints on a pass: its lines, as the gate prints them.
const wallLines = (dir) =>
  noteLines(
    runChecks({
      theme: { checks: { "owner-calls": [{ kind: "owner-calls" }] } },
      branch: facts(dir),
      waiting: waitingOf(dir),
    }),
  );
const chose = (candidate) =>
  `the owner chose ${candidate} in ${QUESTION}, by ${OWNER} on ${ANSWERED}`;

// ---- point 1: choosing the recommended candidate, or another one, opens the wall --------------

test("keeping the recommended candidate opens the wall as before, and the gate says which candidate the owner chose", () => {
  const dir = onGit();
  put(dir, ROW, pretty(logoRow(FIRST)));
  ask(dir, question());
  assert.match(
    wall(dir),
    /logo:logo: .* is the owner's call; mark-kestrel waits on the owner's answer/,
  );
  ask(dir, question({ answer: "keep" }));
  assert.equal(wall(dir), null);
  assert.deepEqual(wallLines(dir), [`  owner-calls: logo:logo: ${chose(FIRST)}`]);
});

test("answering with the name of another offered candidate opens the wall too, for the row of that candidate", () => {
  const dir = onGit();
  put(dir, ROW, pretty(logoRow(SECOND)));
  ask(dir, question({ answer: "value", words: SECOND }));
  assert.equal(wall(dir), null);
  assert.deepEqual(wallLines(dir), [`  owner-calls: logo:logo: ${chose(SECOND)}`]);
});

test("a kept answer on a row that names no candidate, and a question with no candidates, read as before", () => {
  const dir = onGit();
  put(dir, ROW, pretty(logoRow(null)));
  ask(dir, question({ answer: "keep", candidates: null }));
  assert.equal(wall(dir), null);
  assert.deepEqual(wallLines(dir), []);
  ask(dir, question({ answer: "keep" }));
  assert.equal(wall(dir), null);
});

// ---- point 2: a refusal, an answer that names no offered candidate, or a row of another ------

test("a refusal stays red", () => {
  const dir = onGit();
  put(dir, ROW, pretty(logoRow(SECOND)));
  ask(dir, question({ answer: "refuse", words: "none of the three; draw a bird" }));
  assert.match(
    wall(dir),
    /logo:logo: a new mark, or a changed file of one \(design\/sources\/logo\.json\), is the owner's call, and the owner refused in mark-kestrel: none of the three; draw a bird/,
  );
});

test("an answer that names no offered candidate stays red, and says so", () => {
  const dir = onGit();
  put(dir, ROW, pretty(logoRow(SECOND)));
  // A candidate the question did not offer: the waiting list cannot be read with it.
  ask(dir, question({ answer: "value", words: "a kestrel's eye" }));
  assert.match(
    wall(dir),
    /the waiting list cannot be read: design\/waiting\/mark-kestrel\.json: a kestrel's eye is not among its candidates: wing-arc, two-feathers, dot-grid/,
  );
  // The owner's own words on a question that offered no candidates: no mark is chosen from them.
  ask(dir, question({ answer: "value", words: SECOND, candidates: null }));
  assert.match(
    wall(dir),
    /logo:logo: .* is the owner's call, and the owner answered otherwise in mark-kestrel: two-feathers; mark-kestrel offered no candidates, so no mark is chosen from them/,
  );
});

test("an answer for a candidate other than the one the branch's row holds stays red, and names both", () => {
  const dir = onGit();
  put(dir, ROW, pretty(logoRow(FIRST)));
  ask(dir, question({ answer: "value", words: SECOND }));
  assert.equal(
    wall(dir),
    `logo:logo: ${chose(SECOND)}, and design/sources/logo.json holds the mark of ${FIRST}: write the row from the package of ${SECOND} with logo-source --package`,
  );
  // Keeping chooses the first: a row of the second is not it.
  put(dir, ROW, pretty(logoRow(SECOND)));
  ask(dir, question({ answer: "keep" }));
  assert.equal(
    wall(dir),
    `logo:logo: ${chose(FIRST)}, and design/sources/logo.json holds the mark of ${SECOND}: write the row from the package of ${FIRST} with logo-source --package`,
  );
  // A row that names no candidate cannot be told to be the one chosen other than the first.
  put(dir, ROW, pretty(logoRow(null)));
  ask(dir, question({ answer: "value", words: SECOND }));
  assert.equal(
    wall(dir),
    `logo:logo: ${chose(SECOND)}, and design/sources/logo.json names no candidate, so it cannot be told to be the mark of ${SECOND}: write the row from the package of ${SECOND} with logo-source --package`,
  );
});

// ---- the package says which candidate it holds, and the row keeps it ---------------------------

const PACKAGE = "design/brand/kestrel";
const manifest = (candidate) => ({
  version: 1,
  kind: "logo-package",
  made: { by: "logo-design", on: ASKED },
  title: PRODUCT,
  ...(candidate ? { candidate } : {}),
  idea: "Two feathers standing side by side.",
  palette: [{ name: "bark", value: "#7a4b1f" }],
  build: { grid: 32, stroke: 4 },
  files: [{ file: "feathers.svg", sha256: sha(FEATHERS_SVG), role: "mark", variant: "color" }],
});
function packaged(candidate = SECOND) {
  const dir = adopted();
  put(dir, `${PACKAGE}/feathers.svg`, FEATHERS_SVG);
  put(dir, `${PACKAGE}/manifest.json`, pretty(manifest(candidate)));
  return dir;
}

test("logo-source --package writes the candidate its manifest names into the row, and names who chose it and when, for either kind of answer", () => {
  const dir = packaged();
  ask(dir, question({ answer: "value", words: SECOND }));
  const done = logoSource(dir, "--package", PACKAGE, "--on", ANSWERED);
  assert.equal(done.status, 1, said(done));
  assert.equal(done.reached, "");
  assert.deepEqual(json(dir, ROW).made, { by: "logo-design", on: ASKED, candidate: SECOND });
  assert.match(
    done.stdout,
    new RegExp(
      `chosen: by ${OWNER} on ${ANSWERED}, in ${QUESTION} of the waiting list: candidate ${SECOND}`,
    ),
  );
  assert.doesNotMatch(done.stdout, /then: a new mark/);
  const data = JSON.parse(
    logoSource(dir, "--package", PACKAGE, "--id", "spare", "--dry-run", "--json").stdout,
  );
  // Another id is another item: no answer for it.
  assert.equal(data.chosen, null);

  const first = packaged(FIRST);
  ask(first, question({ answer: "keep" }));
  const kept = JSON.parse(logoSource(first, "--package", PACKAGE, "--dry-run", "--json").stdout);
  assert.deepEqual(kept.chosen, { by: OWNER, on: ANSWERED, question: QUESTION, candidate: FIRST });
  assert.equal(kept.mark.made.candidate, FIRST);
});

test("logo-source --package refuses a package of a candidate the question did not offer, or of one the owner did not choose", () => {
  for (const [candidate, answer, sentence] of [
    [
      "eye-ring",
      question(),
      /the package holds the mark of eye-ring, which mark-kestrel of the waiting list does not offer: wing-arc, two-feathers, dot-grid\. Nothing was written/,
    ],
    [
      FIRST,
      question({ answer: "value", words: SECOND }),
      new RegExp(
        `${chose(SECOND)}, and the package holds the mark of ${FIRST}: leave the package of ${SECOND}, then run this again\\. Nothing was written`,
      ),
    ],
    [
      null,
      question({ answer: "value", words: SECOND }),
      new RegExp(
        `${chose(SECOND)}, and the package names no candidate, so it cannot be told to be the mark of ${SECOND}: its manifest says which candidate it holds, as candidate\\. Nothing was written`,
      ),
    ],
  ]) {
    const dir = packaged(candidate);
    ask(dir, answer);
    const done = logoSource(dir, "--package", PACKAGE);
    assert.equal(done.status, 2, said(done));
    assert.match(done.stderr, sentence);
    assert.equal(existsSync(path.join(dir, ROW)), false);
  }
});

test("the manifest of a package may say which candidate it holds, and nothing else new", async () => {
  const { LOGO_PACKAGE } = await import("../templates/tools/design-assembly/contract.mjs");
  assert.deepEqual(LOGO_PACKAGE.problems(manifest(SECOND), "m.json"), []);
  assert.deepEqual(LOGO_PACKAGE.problems(manifest(null), "m.json"), []);
  assert.match(
    LOGO_PACKAGE.problems({ ...manifest(null), candidate: " " }, "m.json").join("; "),
    /m\.json\.candidate/,
  );
  assert.match(
    text(PLUGIN, "references/contract.md"),
    /`candidate`, not required, which of the candidates/,
  );
});

// ---- decide asks with candidates, and the sheet and status say who chose which -----------------

const askWith = (dir, ...more) =>
  decide(
    dir,
    "--ask",
    `Which of the three marks does ${PRODUCT} carry?`,
    "--item",
    "logo:logo",
    "--id",
    QUESTION,
    "--recommend",
    FIRST,
    "--because",
    "the arc reads at the size of a page icon",
    "--hard-to-undo",
    "--on",
    ASKED,
    ...more,
  );

test("decide --ask offers the candidates of the mark, the recommended one first, and takes them only for logo:<id>", () => {
  const dir = adopted();
  const done = askWith(dir, "--candidate", FIRST, "--candidate", SECOND, "--candidate", THIRD);
  assert.ok([0, 1].includes(done.status), said(done));
  assert.equal(done.reached, "");
  assert.match(done.stdout, /stop: logo:logo is the owner's call/);
  assert.deepEqual(json(dir, `${WAITING_FOLDER}/${QUESTION}.json`).candidates, CANDIDATES);
  const sheet = decide(dir);
  assert.match(
    sheet.stdout,
    /candidates: keep takes the first; or answer with the name of another/,
  );
  assert.match(sheet.stdout, /1\. wing-arc\n {8}2\. two-feathers\n {8}3\. dot-grid/);

  const other = decide(
    adopted(),
    "--ask",
    "Which kind of screen?",
    "--item",
    "pattern:board",
    "--recommend",
    "a board",
    "--because",
    "cards",
    "--hard-to-undo",
    "--candidate",
    "board",
  );
  assert.equal(other.status, 2, said(other));
  assert.match(
    other.stderr,
    /--candidate is taken with --item logo:ID: the mark is the choice among named things a question asks with it\. Nothing was written/,
  );
  const twice = askWith(adopted(), "--candidate", FIRST, "--candidate", FIRST);
  assert.equal(twice.status, 2);
  assert.match(twice.stderr, /candidates names wing-arc twice/);
});

test("the decision sheet takes the name of another candidate as the owner's choice, and says who chose which and when", () => {
  const dir = adopted();
  askWith(dir, "--candidate", FIRST, "--candidate", SECOND, "--candidate", THIRD);
  const answers = path.join(empty(), "answers.txt");
  writeFileSync(answers, `${QUESTION} ${SECOND}\n`);
  const done = decide(dir, "--answers", answers, "--by", OWNER, "--on", ANSWERED);
  assert.ok([0, 1].includes(done.status), said(done));
  const row = json(dir, `${WAITING_FOLDER}/${QUESTION}.json`);
  assert.equal(row.answer, "value");
  assert.equal(row.said, SECOND);
  const sheet = decide(dir);
  assert.match(
    sheet.stdout,
    new RegExp(`answered: 1, listed with --json\n  chosen: logo:logo, ${chose(SECOND)}`),
  );
  assert.doesNotMatch(sheet.stdout, /refused or given another answer/);
  const data = JSON.parse(decide(dir, "--json").stdout);
  assert.deepEqual(
    data.answered.find((item) => item.id === QUESTION),
    {
      id: QUESTION,
      source: "waiting-list",
      answer: "value",
      said: SECOND,
      by: OWNER,
      on: ANSWERED,
      item: "logo:logo",
      chosen: SECOND,
    },
  );
  // Asked again, the agent is told which candidate to build on.
  const again = askWith(dir, "--candidate", FIRST, "--candidate", SECOND);
  assert.equal(again.status, 2);
  assert.match(
    again.stderr,
    new RegExp(
      `logo:logo was answered in ${QUESTION}, by ${OWNER} on ${ANSWERED}: the owner chose ${SECOND}; build on the mark of ${SECOND}, not your recommendation`,
    ),
  );
  // A name the question did not offer is refused, and nothing is written.
  const fresh = adopted();
  askWith(fresh, "--candidate", FIRST, "--candidate", SECOND);
  writeFileSync(answers, `${QUESTION} eye-ring\n`);
  const stranger = decide(fresh, "--answers", answers, "--by", OWNER, "--on", ANSWERED);
  assert.equal(stranger.status, 2);
  assert.match(stranger.stderr, /eye-ring is not among its candidates: wing-arc, two-feathers/);
});

test("status says which candidate of the mark the owner chose, by whom and when", () => {
  const dir = adopted();
  ask(dir, question({ answer: "value", words: SECOND }));
  const done = status(dir);
  assert.match(
    done.stdout,
    new RegExp(
      `marks chosen on the decision sheet:\n  logo:logo: ${SECOND}, by ${OWNER} on ${ANSWERED}, in ${QUESTION} of the waiting list`,
    ),
  );
  const data = JSON.parse(status(dir, "--json").stdout);
  assert.deepEqual(data.marks_chosen, [
    { item: "logo:logo", candidate: SECOND, question: QUESTION, by: OWNER, on: ANSWERED },
  ]);
  // No choice, no key and no line.
  const plain = adopted();
  assert.doesNotMatch(status(plain).stdout, /marks chosen/);
  assert.equal(JSON.parse(status(plain, "--json").stdout).marks_chosen, undefined);
});

test("from the question to the gate: the owner chooses the second candidate, the package of it becomes the row, and the gate is green and says so", () => {
  const dir = packaged(SECOND);
  git(dir, "init", "-q", "-b", "main");
  git(dir, "config", "user.name", "Test Person");
  git(dir, "config", "user.email", "test@example.com");
  rmSync(path.join(dir, PACKAGE), { recursive: true });
  git(dir, "add", "-A");
  git(dir, "commit", "-q", "-m", "start");
  git(dir, "checkout", "-q", "-b", "mark");
  const before = gate(dir);
  assert.equal(before.status, 0, said(before));
  askWith(dir, "--candidate", FIRST, "--candidate", SECOND, "--candidate", THIRD);
  const answers = path.join(empty(), "answers.txt");
  writeFileSync(answers, `${QUESTION} ${SECOND}\n`);
  decide(dir, "--answers", answers, "--by", OWNER, "--on", ANSWERED);
  put(dir, `${PACKAGE}/feathers.svg`, FEATHERS_SVG);
  put(dir, `${PACKAGE}/manifest.json`, pretty(manifest(SECOND)));
  const written = logoSource(dir, "--package", PACKAGE);
  assert.equal(written.status, 1, said(written));
  const row = json(dir, ROW);
  put(dir, ROW, pretty({ ...row, licence: `${PRODUCT} is ours; used everywhere.` }));
  const after = gate(dir);
  assert.equal(after.status, 0, said(after));
  assert.match(after.stdout, new RegExp(`owner-calls: logo:logo: ${chose(SECOND)}`));
});

// ---- point 4: every other item and question reads as it did in 0.74.0 ---------------------------

const RELEASE = RELEASES.find((release) => release.version === "0.74.0");
// The plugin of 0.74.0, its scripts and templates taken from the trees of git the list of releases
// records, beside this plugin's references.
let older = null;
function pluginOf(release) {
  if (older) return older;
  const dir = empty();
  older = dir;
  for (const [folder, tree] of [
    ["scripts", release.scripts],
    ["templates", release.templates],
  ]) {
    mkdirSync(path.join(dir, folder), { recursive: true });
    const archive = execFileSync("git", ["-C", ROOT, "archive", tree], { maxBuffer: 1 << 30 });
    execFileSync("tar", ["-x", "-C", path.join(dir, folder)], { input: archive });
  }
  for (const folder of ["references", ".claude-plugin"]) {
    cpSync(path.join(PLUGIN, folder), path.join(dir, folder), { recursive: true });
  }
  return dir;
}

// A branch that adds two kinds of screen and a new root colour, and a waiting list with every
// kind of answer to them and to other questions, the mark's without candidates among them.
function everyOtherQuestion() {
  const dir = onGit();
  put(dir, "design/patterns/board.md", "# Board\n");
  put(dir, "design/patterns/calendar.md", "# Calendar\n");
  put(dir, "design/patterns/inbox.md", "# Inbox\n");
  put(dir, "src/index.css", ":root {\n  --primary: oklch(0.6 0.2 30);\n}\n");
  put(dir, ROW, pretty(logoRow(null)));
  const row = (id, item, more) => ask(dir, { id, question: `About ${item}?`, item, ...more });
  const by = { by: OWNER, on: ANSWERED };
  row("q-board", "pattern:board", { answer: "keep", ...by });
  row("q-calendar", "pattern:calendar", { answer: "value", said: "a timeline instead", ...by });
  row("q-inbox", "pattern:inbox", { recommendation: "a list", hard_to_undo: true });
  row("q-colour", "source-color:oklch(0.6 0.2 30)", { answer: "refuse", said: "keep blue", ...by });
  row("q-mark", "logo:logo", { answer: "keep", ...by });
  row("q-need", "need:date-picker", {
    candidates: [{ name: "calendar-a" }, { name: "calendar-b" }],
    answer: "value",
    said: "calendar-b",
    ...by,
  });
  row("q-before", "before:screens", {
    candidates: [{ name: "home" }, { name: "list" }],
    recommendation: "both",
  });
  row("q-open", "decision:spacing", { recommendation: "a scale of four", hard_to_undo: false });
  return dir;
}

test("the wall reads a kind of screen, the brand colour, and a mark kept with no candidates exactly as 0.74.0 did", async () => {
  const old = pluginOf(RELEASE);
  const tool = path.join(old, "templates/tools/design-assembly");
  const before = await import(pathToFileURL(path.join(tool, "owner-calls.mjs")).href);
  const dir = everyOtherQuestion();
  const waiting = waitingOf(dir);
  const was = before.wallProblem({ branch: before.branchFacts(dir, where), waiting });
  assert.match(was, /pattern:calendar/);
  assert.equal(wall(dir), was);
  // Each answer alone, as the owner may leave it.
  for (const id of ["q-board", "q-calendar", "q-inbox", "q-colour"]) {
    const rows = waiting.rows.filter((item) => item.id === id);
    assert.equal(
      wallProblem({ branch: facts(dir), waiting: { rows } }),
      before.wallProblem({ branch: before.branchFacts(dir, where), waiting: { rows } }),
      id,
    );
  }
});

test("the decision sheet, as text and as data, reads every other question exactly as 0.74.0 did", () => {
  const old = pluginOf(RELEASE);
  const dir = everyOtherQuestion();
  for (const args of [[], ["--json"]]) {
    const was = run(script("decide.mjs", old), "--target", dir, ...args);
    const now = decide(dir, ...args);
    assert.equal(now.stdout, was.stdout, args.join(" "));
    assert.equal(now.status, was.status);
  }
});

// ---- point 5: a repository whose installed tool predates this is not turned red by it ----------

function withOlderTool(dir, release) {
  const tool = path.join(dir, "tools/design-assembly");
  rmSync(tool, { recursive: true });
  mkdirSync(tool, { recursive: true });
  const archive = execFileSync("git", ["-C", ROOT, "archive", release.tool]);
  execFileSync("tar", ["-x", "-C", tool], { input: archive });
  put(dir, "design/tool-stamp.json", pretty({ version: release.version, tree: release.tool }));
  return dir;
}

test("on a repository whose installed tool of 0.74.0 predates it, decide --ask --candidate writes nothing and names upgrade first, and the gate stays green", () => {
  const dir = withOlderTool(adopted(), RELEASE);
  assert.equal(gate(dir).status, 0);
  const done = askWith(dir, "--candidate", FIRST, "--candidate", SECOND);
  assert.equal(done.status, 2, said(done));
  assert.match(
    done.stderr,
    /the repository's copy of the tool, tools\/design-assembly, predates reading which candidate of the mark the owner chose, so its gate would stay red for a mark chosen other than the first: bring the tool up with upgrade first, then ask again\. Nothing was written/,
  );
  assert.equal(existsSync(path.join(dir, WAITING_FOLDER)), false);
  // Asked without candidates, as before.
  const plain = askWith(dir);
  assert.ok([0, 1].includes(plain.status), said(plain));
  assert.equal(gate(dir).status, 0);
});

test("on a repository whose installed tool of 0.74.0 predates it, a row that says its candidate keeps the gate as green", () => {
  const dir = withOlderTool(packaged(FIRST), RELEASE);
  ask(dir, question({ answer: "keep", candidates: null }));
  const written = logoSource(dir, "--package", PACKAGE);
  assert.equal(written.status, 1, said(written));
  assert.equal(json(dir, ROW).made.candidate, FIRST);
  put(dir, ROW, pretty({ ...json(dir, ROW), licence: "Ours." }));
  const after = gate(dir);
  assert.equal(after.status, 0, said(after));
});

// ---- no network, and the names are only data of these tests ------------------------------------

test("the commands of this fix reach for nothing on the network", () => {
  const dir = packaged();
  ask(dir, question({ answer: "value", words: SECOND }));
  for (const done of [
    logoSource(dir, "--package", PACKAGE, "--dry-run"),
    decide(dir),
    status(dir),
    gate(dir),
  ]) {
    assert.equal(done.reached, "", said(done));
  }
});

test("the made-up names of these tests are only data of the repositories they make", () => {
  const named = (folder) =>
    readdirSync(path.join(PLUGIN, folder), { recursive: true })
      .map((file) => path.join(folder, String(file)))
      .filter((file) => statSync(path.join(PLUGIN, file)).isFile())
      .filter((file) => {
        const words = readFileSync(path.join(PLUGIN, file), "utf8").toLowerCase();
        return ["kestrel", "two-feathers", "wing-arc"].some((name) => words.includes(name));
      });
  for (const folder of ["scripts", "templates", "references", "skills", "hooks"]) {
    assert.deepEqual(named(folder), [], folder);
  }
});
