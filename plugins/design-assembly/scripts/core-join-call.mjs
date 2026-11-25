// How the moves of a member are called and what they print (spec 0016, slice 2 of item 7.1). The
// core command reads its flags and hands each of these moves here.
//   --join     declare the family and pin the core: 0 when every answer stands, 1 when a locked
//              answer the repository holds otherwise waits on the owner
//   --settle   put the owner's answers about those into the ledger: 0, or 1 while one waits
//   --inherit  give the guide's blueprint what the core answers: 0, or 1 when the blueprint holds
//              otherwise what the core answers
//   --ask      the one question about a family: 1 when it is asked, 0 when none is, with why
//   --decline  this repository is of no family of the list: 0
// Every move ends with 2 on a wrong call, a repository or a core that cannot be read; then nothing
// is written.
import path from "node:path";

import { isDay } from "../templates/tools/design-assembly/waiting.mjs";
import { today } from "./asking.mjs";
import { finish, refuse } from "./command.mjs";
import { askFamily, declineFamily, inheritCore, joinCore, settleCore } from "./core-join.mjs";
import { coreProblem, readList } from "./core-list.mjs";

export const MEMBER_MOVES = ["--join", "--settle", "--inherit", "--ask", "--decline"];
export const MEMBER_FLAGS = {
  "--join": "switch",
  "--settle": "switch",
  "--inherit": "switch",
  "--ask": "switch",
  "--decline": "switch",
  "--why": "list",
};
export const MEMBER_USAGE =
  "       node core.mjs --join [--core DIR] --by NAME [--on DATE] [--dry-run] [--target DIR] [--json]\n" +
  "       node core.mjs --settle --by NAME [--why ID=REASON]... [--on DATE] [--dry-run] [--target DIR] [--json]\n" +
  "       node core.mjs --inherit [--dry-run] [--target DIR] [--json]\n" +
  "       node core.mjs --ask [--target DIR] [--json]\n" +
  "       node core.mjs --decline [--on DATE] [--dry-run] [--target DIR] [--json]\n";

// The flags each move takes besides the common ones.
const TAKES = {
  "--join": ["--core", "--by", "--on", "--dry-run"],
  "--settle": ["--by", "--why", "--on", "--dry-run"],
  "--inherit": ["--dry-run"],
  "--ask": [],
  "--decline": ["--on", "--dry-run"],
};
const ADDRESS = /[^\s@<>()]+@[^\s@<>()]+\.[^\s@<>()]+/;
const blank = (value) => value === undefined || String(value).trim() === "";
const shown = (value) => (typeof value === "string" ? value : JSON.stringify(value));

// The core a repository joins when the call names none: the one core of the machine's list that
// can be read. Never a guess between two.
function listedCore() {
  const list = readList();
  const readable = list.cores.filter((entry) => coreProblem(entry.path) === null);
  if (readable.length === 1) return readable[0].path;
  throw new Error(
    readable.length === 0
      ? `say which core to join, with --core DIR: the machine's list of cores (${list.file}) holds none that can be read`
      : `say which core to join, with --core DIR: the machine's list holds ${readable.length}: ${readable.map((entry) => entry.path).join(", ")}`,
  );
}

const STATE_WORDS = {
  inherited: "inherited",
  changed: "changed, with its reason",
  kept: "kept against the core, with its reason",
  differs: "differs from the locked answer: a question waits on the owner",
  unreasoned:
    "a default this repository holds otherwise, with no reason yet: give one with --settle --why",
};

function answerLines(answers) {
  return answers.map((answer) => {
    const here =
      answer.held_here === undefined ? "" : `; this repository holds ${shown(answer.held_here)}`;
    const question = answer.question
      ? `; ${answer.answered ? `answered: ${answer.answered}` : `question ${answer.question}`}`
      : "";
    const row = answer.row === "added" ? "; a row added to the ledger" : "";
    return `  ${answer.hold.padEnd(8)} ${answer.id}: ${shown(answer.value)}: ${STATE_WORDS[answer.state] ?? answer.state}${here}${question}${row}`;
  });
}

const fileLines = (written) =>
  written.length === 0 ? ["  nothing to write"] : written.map((line) => `  ${line}`);

// The exports a move leaves behind the ledgers, and the command that writes them again: the gate's
// row of the exports is red until it runs.
const exportLines = ({ exports, dry_run: dryRun }) =>
  exports
    ? [
        `the exports ${dryRun ? "would be" : "are"} behind the design ledgers (${exports.behind.join(", ")}), so the gate's row ${exports.row} is red until they are written again: ${exports.command}`,
      ]
    : [];

function joinReport(result) {
  const lines = [
    `${result.dry_run ? "would pin" : "pinned"} the family core ${result.family} (${result.core}) at ${result.pin}: ${result.repository} ${result.again ? "pins it again" : "declares it is of this family"}`,
    `answers of the core: ${result.answers.length}`,
    ...answerLines(result.answers),
  ];
  const { check } = result;
  lines.push(
    check.laid === "now"
      ? "the gate holds the locked answers from now on: a check of family-core under ledger-shapes"
      : check.laid === "already"
        ? "the gate holds the locked answers already"
        : `the gate does not hold the locked answers here yet: ${check.why}`,
  );
  lines.push(
    `in this repository${result.dry_run ? ", would write" : ""}:`,
    ...fileLines(result.written),
    ...exportLines(result),
  );
  const core = result.core_file;
  lines.push(
    `in the core folder: ${core.file}: ${core.says}${core.why ? `; not written: ${core.why}` : result.dry_run ? " (not written: --dry-run)" : core.written ? " (written)" : " (already so)"}`,
  );
  lines.push(
    result.list.why
      ? `the machine's list of cores (${result.list.file}) was not written: ${result.list.why}`
      : `the machine's list of cores${result.dry_run ? " would hold" : " holds"} this core: ${result.list.file}`,
    "nothing was sent anywhere",
  );
  return lines;
}

function settleReport(result) {
  return [
    `family core ${result.family} at ${result.pin}: ${result.answers.length} answers`,
    ...answerLines(result.answers),
    `${result.dry_run ? "would write" : "files"}:`,
    ...fileLines(result.written),
    ...exportLines(result),
  ];
}

function inheritReport(result) {
  const lines = [
    `the guide's blueprint and the family core ${result.family} at ${result.pin}:`,
    ...(result.filled.length > 0
      ? [
          "answered by the core:",
          ...result.filled.map(
            (item) =>
              `  ${item.id}: ${shown(item.value)}; ${item.hold === "locked" ? "not asked" : "filled in, may be changed with a reason"}; ${item.settled}`,
          ),
        ]
      : ["the core answers no choice of the blueprint"]),
  ];
  for (const item of result.conflicts) {
    lines.push(
      `the blueprint holds ${shown(item.blueprint)} for ${item.id}, and the core ${item.hold === "locked" ? "locks" : "starts from"} ${shown(item.core)}: ${item.why}`,
    );
  }
  lines.push(
    `questions of the guide: ${result.questions.length}; asked: ${result.asked}; not asked: ${result.questions.filter((item) => item.state === "inherited").length}; filled in: ${result.questions.filter((item) => item.state === "filled").length}`,
    ...result.questions.map((item) => `  ${item.state.padEnd(9)} ${item.place}`),
    `${result.dry_run ? "would write" : "files"}:`,
    ...fileLines(result.written),
    ...exportLines(result),
  );
  return lines;
}

function askReport(result) {
  if (!result.question) return [`no question about a family: ${result.why}`];
  const { question } = result;
  return [
    `one question: ${question.question}`,
    `  recommended: ${question.recommendation}`,
    `  because: ${question.basis}`,
    `  kept in: ${question.where}`,
    `  if refused: ${question.if_refused}`,
  ];
}

// Runs one move of a member, the call read by the core command.
export function memberMain(move, call, usage) {
  const { flags } = call;
  const stray = Object.keys(flags).find(
    (flag) => flag !== move && !TAKES[move].includes(flag) && flags[flag] !== undefined,
  );
  if (stray) return refuse(`${stray} is not taken by ${move}`, usage);
  const on = flags["--on"] ?? today();
  if (!isDay(on)) return refuse(`--on ${on} is not a day written YYYY-MM-DD`, usage);
  const dryRun = flags["--dry-run"] === true;
  const by = blank(flags["--by"]) ? null : flags["--by"].trim();
  if (["--join", "--settle"].includes(move)) {
    if (!by) return refuse(`say who said so, with --by NAME`, usage);
    if (ADDRESS.test(by))
      return refuse("--by holds an e-mail address; a name, never an address", usage);
  }
  const done = (result, lines, work) =>
    finish({ json: call.json, result, text: `${lines.join("\n")}\n`, work });
  // The lines written are for a person; a machine gets the files as a list.
  const strip = (result) =>
    Object.fromEntries(Object.entries(result).filter(([key]) => key !== "written"));
  if (move === "--join") {
    let core;
    try {
      core = flags["--core"] ? path.resolve(flags["--core"]) : listedCore();
    } catch (error) {
      return refuse(error.message, usage);
    }
    const result = joinCore(call.target, { core, by, on, dryRun });
    const lines = joinReport(result);
    const waits = result.answers.some((answer) => answer.state === "differs");
    return done(strip(result), lines, waits);
  }
  if (move === "--settle") {
    const why = {};
    for (const pair of flags["--why"] ?? []) {
      const at = pair.indexOf("=");
      const id = pair.slice(0, at).trim();
      if (at < 1 || pair.slice(at + 1).trim() === "") {
        return refuse(`--why ${pair}: write it ID=REASON`, usage);
      }
      if (ADDRESS.test(pair)) return refuse(`--why ${id} holds an e-mail address`, usage);
      why[id] = pair.slice(at + 1).trim();
    }
    const result = settleCore(call.target, { by, on, why, dryRun });
    const waits = result.answers.some((answer) => ["differs", "unreasoned"].includes(answer.state));
    return done(strip(result), settleReport(result), waits);
  }
  if (move === "--inherit") {
    const result = inheritCore(call.target, { dryRun });
    return done(strip(result), inheritReport(result), result.conflicts.length > 0);
  }
  if (move === "--ask") {
    const result = askFamily(call.target);
    return done(result, askReport(result), Boolean(result.question));
  }
  const result = declineFamily(call.target, { on, dryRun });
  return done(
    result,
    [
      `${result.dry_run ? "would record" : "recorded"} on this machine that ${result.repository} is of no family listed here: it is not asked again (${result.list}); nothing was written in the repository`,
    ],
    false,
  );
}
