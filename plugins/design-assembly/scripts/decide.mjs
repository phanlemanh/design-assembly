// The decision sheet: every question that waits on the owner of a repository, on one sheet, each
// with one recommendation and what it rests on, answered in one go. Without answers it writes
// nothing. With answers it writes each one where the question lives, with the name of the person
// who answered and the date; a refusal stays, with what the person said. It never writes an answer
// nobody gave, and it calls no model.
// Usage: node decide.mjs [--target DIR] [--only ID[,ID]] [--answers FILE [--by NAME] [--on DATE]]
//                        [--dry-run] [--json]
// Exit: 0 no question waits; 1 questions wait on the owner; 2 a wrong call, answers that cannot be
// taken, or a repository that cannot be read. On 2 nothing is written. The call is read and ended
// by the common contract of every command (command.mjs).
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { stdout } from "node:process";
import { fileURLToPath } from "node:url";

import { LEDGERS, newerLedgers } from "../templates/tools/design-assembly/contract.mjs";
import { lineWidth, renderJson } from "../templates/tools/design-assembly/json.mjs";
import { LEDGER, readLedger } from "../templates/tools/design-assembly/ledger.mjs";
import { writeFiles, writtenFiles } from "./apply.mjs";
import { finish, readCall, Refusal, refuse, start } from "./command.mjs";
import { UNCONFIRMED } from "./inventory.mjs";
import { status } from "./status.mjs";

const PLUGIN = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const json = (file) => JSON.parse(readFileSync(path.join(PLUGIN, file), "utf8"));
const LIMITS = json("references/limits.json").limits;
const LAYERS = json("references/layers.json").layers;
const LIMITS_FILE = "references/limits.json of this plugin";
const BLUEPRINT = LEDGERS.blueprint.file;

// The waiting list: questions that wait on the owner and are not rows of a design ledger, kept as
// data so that this command can list them and write the answers back. A repository may have none.
// It is not one of the ledgers of the contract: the gate of a repository does not read it.
export const WAITING_LIST = "design/waiting-list.json";
const LIST_VERSION = 1;
const ROW_KINDS = ["question", "permission"];
const ROW_KEYS = [
  "id",
  "kind",
  "group",
  "question",
  "recommendation",
  "basis",
  "hard_to_undo",
  "where",
  "if_refused",
  "answer",
  "said",
  "by",
  "on",
];
const ROW_TEXTS = ["group", "question", "recommendation", "basis", "where", "if_refused", "said"];
const ANSWERS = ["keep", "refuse", "value"];
// The words an answer starts with, in the two languages the sheet is answered in. Anything else is
// a value: the person's own answer, in their words.
const WORDS = {
  giữ: "keep",
  giu: "keep",
  keep: "keep",
  bác: "refuse",
  bac: "refuse",
  refuse: "refuse",
};
// What a row of the ledger says once a person answered it.
const VERBS = { keep: "confirmed", refuse: "refused", value: "answered" };
const ANSWER_OF = Object.fromEntries(Object.entries(VERBS).map(([answer, verb]) => [verb, answer]));
const STAMP = /(?:^|; )(confirmed|refused|answered) by (.+?) on (\d{4}-\d{2}-\d{2})(?:: (.*))?$/;
const DAY = /^\d{4}-\d{2}-\d{2}$/;
// The layers every other layer is built on: an answer there is hard to undo.
const BASE_LAYERS = ["context", "foundations"];

const read = (root, file) =>
  existsSync(path.join(root, file)) ? readFileSync(path.join(root, file), "utf8") : null;

const isDay = (value) =>
  DAY.test(String(value)) && new Date(`${value}T00:00:00Z`).toISOString().startsWith(value);

// Every way the waiting list cannot be read, one line each.
function listProblems(list, ledgerIds) {
  if (list === null || typeof list !== "object" || Array.isArray(list)) return ["is not an object"];
  if (typeof list.version !== "number") return ["no version"];
  if (list.version > LIST_VERSION) {
    return [`has version ${list.version}, newer than this plugin reads (${LIST_VERSION})`];
  }
  if (!Array.isArray(list.rows)) return ["no rows"];
  const found = [];
  const seen = new Set();
  for (const [index, row] of list.rows.entries()) {
    const id = typeof row?.id === "string" ? row.id : "";
    const at = id || `row ${index + 1}`;
    if (!/^[^\s,]+$/.test(id)) {
      found.push(`${at}: no id, or an id with a space or a comma in it`);
      continue;
    }
    if (seen.has(id)) found.push(`${at}: a second row has this id`);
    seen.add(id);
    if (ledgerIds.includes(id)) found.push(`${at}: the ledger has a row with this id`);
    for (const key of Object.keys(row)) {
      if (!ROW_KEYS.includes(key)) found.push(`${at}: unknown key '${key}'`);
    }
    if (row.kind !== undefined && !ROW_KINDS.includes(row.kind)) {
      found.push(`${at}: kind must be one of ${ROW_KINDS.join(", ")}`);
    }
    for (const key of ROW_TEXTS) {
      if (row[key] !== undefined && (typeof row[key] !== "string" || row[key].trim() === "")) {
        found.push(`${at}: ${key} is not a written text`);
      }
    }
    if (row.question === undefined) found.push(`${at}: no question`);
    if (row.hard_to_undo !== undefined && typeof row.hard_to_undo !== "boolean") {
      found.push(`${at}: hard_to_undo is true or false`);
    }
    const named = row.by !== undefined || row.on !== undefined;
    if (row.kind === "permission") {
      if (row.answer !== undefined || named || row.said !== undefined) {
        found.push(`${at}: a permission carries no answer`);
      }
    } else if (row.answer === undefined) {
      if (named) found.push(`${at}: a name and a date with no answer`);
      if (row.said !== undefined) found.push(`${at}: words with no answer`);
    } else {
      if (!ANSWERS.includes(row.answer)) {
        found.push(`${at}: answer must be one of ${ANSWERS.join(", ")}`);
      }
      if (typeof row.by !== "string" || row.by.trim() === "" || !isDay(row.on)) {
        found.push(`${at}: an answer with no name of who gave it, or no date`);
      }
      if (row.answer === "value" && row.said === undefined) {
        found.push(`${at}: a value with no words`);
      }
    }
  }
  return found;
}

function readList(root, ledgerIds) {
  const text = read(root, WAITING_LIST);
  if (text === null) return null;
  let list;
  try {
    list = JSON.parse(text);
  } catch {
    throw new Error(`${WAITING_LIST} is not JSON`);
  }
  const problems = listProblems(list, ledgerIds);
  if (problems.length > 0) throw new Error(`${WAITING_LIST}: ${problems.join("; ")}`);
  return list;
}

// Everything the sheet is made from, read once: the rows of the ledger, what the status says waits
// in them, and the waiting list.
function readState(root) {
  const rows = readLedger(root) ?? [];
  const waiting = status(root).waiting;
  const list = readList(
    root,
    rows.map((row) => String(row.id)),
  );
  return { rows, waiting, list };
}

// The sheet of a repository as it is now. `questions` take an answer here. `elsewhere` wait on the
// owner too, and another command records their answer. `permissions` are the owner's to give, step
// by step: no answer settles one, so they are listed and never counted.
function sheetOf({ rows, waiting, list }) {
  const rowOf = (id) => rows.find((row) => String(row.id) === id);
  const questions = [];
  const elsewhere = [];
  for (const item of waiting) {
    const row = rowOf(item.id);
    if (row && UNCONFIRMED.test(row.note ?? "")) {
      questions.push({
        id: item.id,
        source: "ledger",
        group: null,
        question: item.question,
        recommendation: item.recommendation,
        basis: item.basis,
        hard_to_undo: BASE_LAYERS.includes(row.layer),
        where: LEDGER,
        if_refused: null,
      });
    } else {
      // A call only a person can make, with no row yet: the row is written while adopting.
      elsewhere.push({
        id: item.id,
        source: "ledger",
        question: item.question,
        recommendation: item.recommendation,
        basis: item.basis,
        answer_with: item.answer,
      });
    }
  }
  const answered = [];
  for (const row of rows) {
    const stamped = STAMP.exec(row.note ?? "");
    if (!stamped || UNCONFIRMED.test(row.note)) continue;
    answered.push({
      id: String(row.id),
      source: "ledger",
      answer: ANSWER_OF[stamped[1]],
      said: stamped[4] ?? null,
      by: stamped[2],
      on: stamped[3],
    });
  }
  const permissions = [];
  for (const row of list?.rows ?? []) {
    if (row.kind === "permission") {
      permissions.push({
        id: row.id,
        source: "waiting-list",
        group: row.group ?? null,
        what: row.question,
      });
    } else if (row.answer) {
      answered.push({
        id: row.id,
        source: "waiting-list",
        answer: row.answer,
        said: row.said ?? null,
        by: row.by,
        on: row.on,
      });
    } else {
      questions.push({
        id: row.id,
        source: "waiting-list",
        group: row.group ?? null,
        question: row.question,
        // The list is a person's or a machine's writing: where it gives no recommendation the
        // sheet says so, and where it gives no basis or does not say how hard it is to undo, null.
        recommendation: row.recommendation ?? "none given: the waiting list does not recommend one",
        basis: row.basis ?? null,
        hard_to_undo: row.hard_to_undo ?? null,
        where: row.where ?? null,
        if_refused: row.if_refused ?? null,
      });
    }
  }
  return { questions, answered, elsewhere, permissions };
}

const PARTS = ["questions", "answered", "elsewhere", "permissions"];

// The sheet narrowed to the ids named. An id the sheet does not have is a wrong call.
function narrow(result, only) {
  if (only === null) return result;
  const known = new Set(PARTS.flatMap((part) => result[part].map((item) => item.id)));
  const strangers = only.filter((id) => !known.has(id));
  if (strangers.length > 0) {
    throw new Error(`--only names ${strangers.join(", ")}, which this sheet does not have`);
  }
  return Object.fromEntries(
    PARTS.map((part) => [part, result[part].filter((item) => only.includes(item.id))]),
  );
}

export function sheet(root, { only = null } = {}) {
  return narrow(sheetOf(readState(root)), only);
}

// The answers of a file: one line per answer, the id, then a word or a value. Empty lines and lines
// that start with # are skipped.
export function parseAnswers(text) {
  const answers = [];
  for (const [index, raw] of text.split(/\r?\n/).entries()) {
    const line = raw.normalize("NFC").trim();
    if (line === "" || line.startsWith("#")) continue;
    const at = `line ${index + 1}`;
    const [, id, rest] = /^(\S+)(?:\s+(.*))?$/.exec(line);
    if (!rest) throw new Error(`${at}: ${id} has no answer after it`);
    if (answers.some((answer) => answer.id === id)) {
      throw new Error(`${at}: ${id} is answered twice`);
    }
    const [, word, more] = /^(\S+)(?:\s+(.*))?$/.exec(rest);
    const answer = WORDS[word.toLowerCase()];
    if (answer) answers.push({ id, answer, said: more ?? null });
    else answers.push({ id, answer: "value", said: rest });
  }
  return answers;
}

const stampOf = ({ answer, said }, by, on) =>
  `${VERBS[answer]} by ${by} on ${on}${said ? `: ${said}` : ""}`;

// The note of a row with the clause that says nobody confirmed it taken out, and the answer put
// last. Whatever else the note says is kept.
function answeredNote(note, stamp) {
  const parts = note.split(/(; |\. )/);
  for (let index = 0; index < parts.length; index += 2) {
    if (!UNCONFIRMED.test(parts[index])) continue;
    // The clause goes with the separator before it, or the one after it when it comes first.
    parts.splice(index === 0 ? 0 : index - 1, 2);
    index -= 2;
  }
  const rest = parts.join("").trim();
  return rest === "" ? stamp : `${rest}; ${stamp}`;
}

// The value of a `note:` line as it is written in the file, with its quoting undone.
function noteValue(written) {
  const value = written.trim();
  if (value.startsWith('"')) return JSON.parse(value);
  if (value.startsWith("'") && value.endsWith("'")) return value.slice(1, -1).replace(/''/g, "'");
  return value;
}

// The ledger with the note of one row rewritten. Only that line changes: every other byte of the
// file, the rest of the row included, stays as it is.
function restamp(text, id, stamp) {
  const lines = text.split("\n");
  const isRow = (line) => /^\s*-\s+id:/.test(line);
  const idOf = (line) =>
    /^\s*-\s+id:\s*(.*)$/
      .exec(line)[1]
      .trim()
      .replace(/^(["'])(.*)\1$/, "$2");
  const start = lines.findIndex((line) => isRow(line) && idOf(line) === id);
  let end = lines.findIndex((line, index) => index > start && isRow(line));
  if (end === -1) end = lines.length;
  const at = lines.findIndex(
    (line, index) => index > start && index < end && /^\s*note:/.test(line),
  );
  if (start === -1 || at === -1) throw new Error(`${LEDGER}: the note of ${id} cannot be found`);
  const [, lead, written] = /^(\s*note:\s*)(.*)$/.exec(lines[at]);
  let before;
  try {
    before = noteValue(written);
  } catch {
    throw new Error(`${LEDGER}: the note of ${id} cannot be read`);
  }
  // The readers of the ledger do not undo an escape, so a note is written without one.
  if (/["\\]/.test(stamp)) {
    throw new Error(
      `${id}: a note of the ledger cannot keep a double quote or a backslash; say it without`,
    );
  }
  const note = answeredNote(String(before), stamp);
  if (UNCONFIRMED.test(note)) {
    throw new Error(
      `${id}: with these words the row would still read as not confirmed; say it in other words`,
    );
  }
  lines[at] = `${lead}${JSON.stringify(note)}`;
  return { text: lines.join("\n"), note };
}

// Where the guide reads that a person confirmed one of its proposals: the row it writes from the
// blueprint says "proposal" again on its next run unless the blueprint lists the choice.
function confirmInBlueprint(blueprint, row) {
  if (!String(row.source ?? "").startsWith(BLUEPRINT)) return null;
  const key = String(row.id).replaceAll("-", "_");
  const layer = LAYERS.find((item) => (item.choices ?? []).some((choice) => choice.key === key));
  const entry = layer ? blueprint?.layers?.[layer.id] : null;
  if (!entry || entry.status !== "decided" || entry.source === "user") return null;
  if ((entry.confirmed ?? []).includes(key)) return null;
  entry.confirmed = [...(entry.confirmed ?? []), key];
  return `${layer.id} lists ${key} as confirmed, so the guide keeps the answer`;
}

// The answers put where each question lives. Returns the files to write, what changes in each, and
// the sheet as it is once they are written. Throws, and nothing is written, when one answer cannot
// be taken.
function record(root, state, answers, { by, on, only }) {
  const before = sheetOf(state);
  const find = (part, id) => before[part].find((item) => item.id === id);
  for (const { id } of answers) {
    if (find("questions", id) && (only === null || only.includes(id))) continue;
    const done = find("answered", id);
    const call = find("elsewhere", id);
    if (find("permissions", id)) {
      throw new Error(
        `${id} is a permission: the owner gives it step by step, and no answer on this sheet settles it`,
      );
    }
    if (done) {
      throw new Error(
        `${id} was answered by ${done.by} on ${done.on}; this command does not change a recorded answer`,
      );
    }
    if (call) {
      throw new Error(
        `${id} has no row in the ledger yet: answer it with ${call.answer_with}, which writes the row`,
      );
    }
    if (find("questions", id)) throw new Error(`${id} is not one of the questions --only names`);
    throw new Error(`${id} is not a question of this sheet`);
  }

  const files = {};
  const changes = {};
  const say = (file, what) => (changes[file] = [...(changes[file] ?? []), what]);
  const rowOf = (id) => state.rows.find((row) => String(row.id) === id);
  const inLedger = answers.filter(({ id }) => find("questions", id).source === "ledger");
  const inList = answers.filter(({ id }) => find("questions", id).source === "waiting-list");

  if (inLedger.length > 0) {
    let text = read(root, LEDGER);
    const blueprintText = read(root, BLUEPRINT);
    const blueprint = blueprintText === null ? null : JSON.parse(blueprintText);
    for (const answer of inLedger) {
      const stamped = restamp(text, answer.id, stampOf(answer, by, on));
      text = stamped.text;
      say(LEDGER, `${answer.id}: the note becomes "${stamped.note}"`);
      if (answer.answer !== "keep") continue;
      const confirmed = confirmInBlueprint(blueprint, rowOf(answer.id));
      if (confirmed) say(BLUEPRINT, confirmed);
    }
    files[LEDGER] = text;
    if (changes[BLUEPRINT]) files[BLUEPRINT] = renderJson(blueprint, lineWidth(root));
  }
  if (inList.length > 0) {
    const rows = state.list.rows.map((row) => {
      const answer = inList.find((item) => item.id === row.id);
      if (!answer) return row;
      say(WAITING_LIST, `${row.id}: ${stampOf(answer, by, on)}`);
      const { answer: kind, said } = answer;
      return { ...row, answer: kind, ...(said ? { said } : {}), by, on };
    });
    files[WAITING_LIST] = renderJson({ ...state.list, rows }, lineWidth(root));
  }

  // The sheet once the answers are written: each answered question moves, in the order of the sheet.
  const given = (item) => answers.find((answer) => answer.id === item.id);
  const moved = before.questions.filter(given).map((item) => {
    const { answer, said } = given(item);
    return { id: item.id, source: item.source, answer, said, by, on };
  });
  const ledgerOrder = state.rows.map((row) => String(row.id));
  const listOrder = (state.list?.rows ?? []).map((row) => row.id);
  const place = (item) =>
    item.source === "ledger"
      ? ledgerOrder.indexOf(item.id)
      : ledgerOrder.length + listOrder.indexOf(item.id);
  const after = {
    ...before,
    questions: before.questions.filter((item) => !given(item)),
    answered: [...before.answered, ...moved].sort((a, b) => place(a) - place(b)),
  };
  return { files, changes, after, moved };
}

const PREVIEW = "preview only: nothing was written; the sheet below is as it would be";
const SAID = { keep: "kept", refuse: "refused", value: "answered" };

// The sheet as a person reads it.
export function report(result) {
  const { questions, answered, elsewhere, permissions } = result;
  const waits = questions.length + elsewhere.length;
  const also = [
    elsewhere.length > 0 ? `${elsewhere.length} of them answered with another command` : null,
    permissions.length > 0
      ? `${permissions.length} permission(s) only the owner gives, not counted`
      : null,
  ].filter(Boolean);
  const lines = [
    `decision sheet: ${waits === 0 ? "no question waits" : `${waits} question(s) wait`} on the owner${also.length > 0 ? `; ${also.join("; ")}` : ""}`,
  ];
  if (questions.length > 0) {
    const marked = questions.filter((item) => item.hard_to_undo === true).length;
    const silent = questions.filter((item) => item.hard_to_undo === null).length;
    lines.push(
      `hard to undo: ${marked} marked${silent > 0 ? `; ${silent} row(s) of the waiting list do not say` : ""}`,
    );
  }
  let group;
  for (const item of questions) {
    const heading =
      item.source === "ledger"
        ? `from the ledger, ${LEDGER}: a row nobody confirmed`
        : (item.group ?? "from the waiting list");
    if (heading !== group) lines.push("", heading);
    group = heading;
    lines.push(
      `  ${item.id}${item.hard_to_undo === true ? " [hard to undo]" : ""}: ${item.question}`,
      `      recommendation: ${item.recommendation}`,
      `      because: ${item.basis ?? "the waiting list gives no basis apart from the recommendation"}`,
    );
    if (item.source !== "ledger" && item.where) lines.push(`      where: ${item.where}`);
    if (item.if_refused) lines.push(`      if refused: ${item.if_refused}`);
  }
  if (elsewhere.length > 0) {
    lines.push("", "waiting too, answered with another command: the ledger has no row for it yet");
    for (const item of elsewhere) {
      lines.push(
        `  ${item.id}: ${item.question}`,
        `      recommendation: ${item.recommendation}`,
        `      because: ${item.basis}`,
        `      answer with: ${item.answer_with}`,
      );
    }
  }
  if (permissions.length > 0) {
    lines.push(
      "",
      "only the owner gives these, step by step: keeping or refusing does not answer them",
    );
    for (const item of permissions) lines.push(`  ${item.id}: ${item.what}`);
  }
  lines.push(
    "",
    `answered: ${answered.length}${answered.length > 0 ? ", listed with --json" : ""}`,
  );
  const open = answered.filter((item) => item.answer !== "keep").map((item) => item.id);
  if (open.length > 0) {
    lines.push(
      `  refused or given another answer, and no command changes anything for it yet (limit decide-records-a-refusal-and-changes-nothing): ${open.join(", ")}`,
    );
  }
  if (questions.length > 0) {
    lines.push(
      "",
      "to answer: /design-assembly:decide, or a file with one line per answer, given with --answers FILE",
      "  ID giữ             keep it as it is recommended (or: keep)",
      "  ID bác SENTENCE    refuse it; the sentence says what to change (or: refuse)",
      "  ID VALUE           your own answer, in your words",
    );
  }
  // Where this sheet is blind, so that "no question waits" does not read as more than it is.
  const blind = LIMITS.filter((limit) => limit.area === "decide" && limit.status === "open");
  lines.push(
    "",
    `decide does not see: ${blind.map((limit) => limit.id).join(", ")} (${LIMITS_FILE})`,
  );
  return `${lines.join("\n")}\n`;
}

// What a run with answers says before the sheet: each answer, then each file and what changes in it.
function recordReport({ moved, changes }, written, { by, on, dryRun }) {
  const lines = [
    `${dryRun ? "answers that would be recorded" : "answers recorded"}: ${moved.length}, by ${by} on ${on}`,
    ...moved.map(
      (item) => `  ${item.id}: ${SAID[item.answer]}${item.said ? `: ${item.said}` : ""}`,
    ),
    "files:",
  ];
  for (const line of written) {
    const file = line.slice(line.lastIndexOf(" ") + 1);
    lines.push(`  ${line}: ${(changes[file] ?? []).join("; ")}`);
  }
  if (dryRun) lines.push(PREVIEW);
  lines.push("");
  return `${lines.join("\n")}\n`;
}

// The name git has for whoever works in the repository, or null.
function nameFromGit(root) {
  const run = spawnSync("git", ["-C", root, "config", "user.name"], { encoding: "utf8" });
  const name = run.status === 0 ? run.stdout.trim() : "";
  return name === "" ? null : name;
}

const today = () => {
  const now = new Date();
  const two = (value) => String(value).padStart(2, "0");
  return `${now.getFullYear()}-${two(now.getMonth() + 1)}-${two(now.getDate())}`;
};

const USAGE = `usage: node decide.mjs [--target DIR] [--only ID[,ID]] [--answers FILE [--by NAME] [--on DATE]]
                      [--dry-run] [--json]

  --only     Narrow the sheet, the data and the exit code to these questions.
  --answers  A file a person's answers were written to, one line per answer:
               ID giữ            keep it as it is recommended (or: keep)
               ID bác SENTENCE   refuse it; the sentence says what to change (or: refuse)
               ID VALUE          the person's own answer, in their words
             Empty lines and lines that start with # are skipped. One answer that cannot be
             taken refuses the whole file.
  --by       Who answered. Without it, the name git has for the repository.
  --on       The day they answered, as YYYY-MM-DD. Without it, today.
  --dry-run  With --answers: say which files would be written and what would change in each,
             and write nothing.
  --json     The sheet as data: questions, answered, elsewhere, permissions, and the files written.
`;

const FLAGS = {
  "--only": "value",
  "--answers": "value",
  "--by": "value",
  "--on": "value",
  "--dry-run": "switch",
};

// The answers of the file the call names, put where each question lives, or a refusal that says
// why none of them was written.
function recordCall(root, state, call, only) {
  const refused = (why) => new Refusal(`${why}. Nothing was written`);
  const named = call.flags["--answers"];
  const file = path.resolve(named);
  if (!existsSync(file) || !statSync(file).isFile()) throw refused(`${named} is not a file`);
  const on = call.flags["--on"] ?? today();
  if (!isDay(on)) throw refused(`--on takes a day written YYYY-MM-DD, and ${on} is not one`);
  const by = (call.flags["--by"] ?? nameFromGit(root) ?? "").trim();
  if (by === "") {
    throw refused(
      "nobody is named as the person who answered: say who with --by NAME (git has no name for this repository)",
    );
  }
  if (/["\\]/.test(by)) throw refused("a name cannot hold a double quote or a backslash");
  // A ledger a newer plugin wrote is never written over by this one.
  const newer = newerLedgers(root);
  if (newer.length > 0) throw refused(newer.join("; "));
  try {
    const answers = parseAnswers(readFileSync(file, "utf8"));
    if (answers.length === 0) throw new Error(`${named} holds no answer`);
    return { by, on, ...record(root, state, answers, { by, on, only }) };
  } catch (error) {
    throw refused(error.message);
  }
}

function main(args) {
  const call = readCall(args, FLAGS);
  if (call.problem) return refuse(call.problem, USAGE);
  if (call.help) return void stdout.write(USAGE);
  const answering = call.flags["--answers"] !== undefined;
  if (!answering && (call.flags["--by"] !== undefined || call.flags["--on"] !== undefined)) {
    return refuse("--by and --on say who answered and when; they go with --answers", USAGE);
  }
  const root = call.target;
  const dryRun = call.flags["--dry-run"] === true;
  const only =
    call.flags["--only"] === undefined
      ? null
      : call.flags["--only"]
          .split(",")
          .map((id) => id.trim())
          .filter(Boolean);

  // Anything this throws is a repository that cannot be read.
  const state = readState(root);
  // Before anything is written: an id --only names that the sheet does not have is a wrong call.
  let now;
  try {
    now = narrow(sheetOf(state), only);
  } catch (error) {
    throw new Refusal(error.message);
  }
  if (!answering) {
    return finish({
      json: call.json,
      result: { dry_run: dryRun, ...now, files: [] },
      text: `${dryRun ? "preview only: no answers, so nothing to write\n\n" : ""}${report(now)}`,
      work: leavesWork(now),
    });
  }
  const recorded = recordCall(root, state, call, only);
  const written = writeFiles(root, recorded.files, dryRun);
  const after = narrow(recorded.after, only);
  // To a machine: the sheet as it is once the answers are written, the files as a list, and what
  // changes in each; never their content.
  return finish({
    json: call.json,
    result: {
      dry_run: dryRun,
      ...after,
      files: writtenFiles(written),
      recorded: { by: recorded.by, on: recorded.on, changes: recorded.changes },
    },
    text: `${recordReport(recorded, written, { by: recorded.by, on: recorded.on, dryRun })}${report(after)}`,
    work: leavesWork(after),
  });
}

// Something waits on the owner that an answer would settle: a question of the sheet, or a call
// another command records. A permission never counts.
const leavesWork = (result) => result.questions.length + result.elsewhere.length > 0;

await start(import.meta.url, main);
