// The decision sheet: every question that waits on the owner of a repository, on one sheet, each
// with one recommendation and what it rests on, answered in one go. Without answers it writes
// nothing. With answers it writes each one where the question lives, with the name of the person
// who answered and the date; a refusal stays, with what the person said. It never writes an answer
// nobody gave, and it calls no model.
// A building agent that meets a question nobody answered queues it with --ask: one new file of the
// waiting list, and no shared file touched. One shared waiting list is split with --split.
// Usage: node decide.mjs [--target DIR] [--only ID[,ID]] [--answers FILE [--by NAME] [--on DATE]]
//                        [--ask QUESTION --recommend TEXT --because TEXT (--hard-to-undo |
//                        --easy-to-undo) [--item KIND:WHICH] [--id ID] [--on DATE]]
//                        [--split] [--dry-run] [--json]
// Exit: 0 no question waits; 1 questions wait on the owner; 2 a wrong call, answers that cannot be
// taken, or a repository that cannot be read. On 2 nothing is written. The call is read and ended
// by the common contract of every command (command.mjs).
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, readFileSync, statSync, unlinkSync } from "node:fs";
import path from "node:path";
import { stdout } from "node:process";
import { fileURLToPath } from "node:url";

import { LEDGERS, newerLedgers } from "../templates/tools/design-assembly/contract.mjs";
import { lineWidth, renderJson } from "../templates/tools/design-assembly/json.mjs";
import { LEDGER, readLedger } from "../templates/tools/design-assembly/ledger.mjs";
import { ledgerText } from "../templates/tools/design-assembly/screen-fragments.mjs";
import {
  readScreenLedger,
  SCREEN_LEDGER,
} from "../templates/tools/design-assembly/screen-ledger.mjs";
import {
  answerProblem,
  folderRows,
  takesMany,
  ID,
  isDay,
  itemProblem,
  mustAsk,
  questionFile,
  readWaiting,
  replacedBy,
  rowProblems,
  STAMP,
  UNCONFIRMED,
  WAITING_FOLDER,
  WAITING_LIST,
} from "../templates/tools/design-assembly/waiting.mjs";
import { ROW_CHOICES, writeFiles, writtenFiles } from "./apply.mjs";
import { fileChange, finish, readCall, Refusal, refuse, start } from "./command.mjs";
import { principleOfRow } from "./principles.mjs";
import { status } from "./status.mjs";

const PLUGIN = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const json = (file) => JSON.parse(readFileSync(path.join(PLUGIN, file), "utf8"));
const LIMITS = json("references/limits.json").limits;
const LAYERS = json("references/layers.json").layers;
const LIMITS_FILE = "references/limits.json of this plugin";
const BLUEPRINT = LEDGERS.blueprint.file;

// The waiting list (waiting.mjs): questions that wait on the owner and are not rows of a design
// ledger. A repository may have none. It is not one of the ledgers of the contract.
export { WAITING_FOLDER, WAITING_LIST };
const ANSWERS_SAID = { keep: "kept", refuse: "refused", value: "answered" };
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
// The layers every other layer is built on: an answer there is hard to undo.
const BASE_LAYERS = ["context", "foundations"];

const read = (root, file) =>
  existsSync(path.join(root, file)) ? readFileSync(path.join(root, file), "utf8") : null;

// Everything the sheet is made from, read once: the rows of the ledger, what the status says waits
// in them, and the waiting list.
export function readState(root) {
  const rows = readLedger(root) ?? [];
  const waiting = status(root).waiting;
  const list = readWaiting(
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
  // A question a newer one replaces waits no longer: it is listed apart, and takes no answer.
  const replaced = [];
  const newer = replacedBy(list?.rows ?? []);
  for (const row of list?.rows ?? []) {
    if (row.kind !== "permission" && !row.answer && newer.has(row.id)) {
      replaced.push({ id: row.id, source: "waiting-list", replaced_by: newer.get(row.id) });
    } else if (row.kind === "permission") {
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
        // A choice among named things: what the owner picks from, the recommended one first.
        ...(row.candidates ? { item: row.item ?? null, candidates: row.candidates } : {}),
      });
    }
  }
  return { questions, answered, elsewhere, permissions, replaced };
}

const PARTS = ["questions", "answered", "elsewhere", "permissions", "replaced"];

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

// Confirming a row the guide writes for more than one choice confirms each, with who answered and
// when: the guide asks for that on these choices.
const CHOICES_OF_ROW = ROW_CHOICES;

// Where the guide reads that a person confirmed one of its proposals: the row it writes from the
// blueprint says "proposal" again on its next run unless the blueprint lists the choice.
function confirmInBlueprint(blueprint, row, { by, on } = {}) {
  if (!String(row.source ?? "").startsWith(BLUEPRINT)) return null;
  // A design principle is the owner's once the blueprint says they gave it.
  const principle = principleOfRow(blueprint, row.id);
  if (principle) {
    if (principle.confirmed || blueprint.layers.context.status !== "decided") return null;
    const entry = blueprint.layers.context.principles.find((item) => item.id === principle.id);
    entry.source = "user";
    return `context lists the principle ${principle.id} as the owner's, so the guide keeps it`;
  }
  const keys = CHOICES_OF_ROW[String(row.id)] ?? [String(row.id).replaceAll("-", "_")];
  const layer = LAYERS.find((item) =>
    (item.choices ?? []).some((choice) => choice.key === keys[0]),
  );
  const entry = layer ? blueprint?.layers?.[layer.id] : null;
  if (!entry || entry.status !== "decided" || entry.source === "user") return null;
  const fresh = keys.filter((key) => !(entry.confirmed ?? []).includes(key));
  if (fresh.length === 0) return null;
  entry.confirmed = [...(entry.confirmed ?? []), ...fresh];
  if (String(row.id) in CHOICES_OF_ROW) {
    entry.answered = {
      ...entry.answered,
      ...Object.fromEntries(fresh.map((key) => [key, { by, on }])),
    };
  }
  return `${layer.id} lists ${fresh.join(", ")} as confirmed, so the guide keeps the answer`;
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
    const gone = find("replaced", id);
    if (gone) {
      throw new Error(
        `${id} was replaced by ${gone.replaced_by}, which asks the same about more: answer ${gone.replaced_by}`,
      );
    }
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
  // A question with candidates is answered by naming one of them, or the ones it lets be picked.
  for (const { id, answer, said } of answers) {
    const row = state.list?.rows.find((item) => item.id === id);
    const problem = answer === "value" && row ? answerProblem(row, said) : null;
    if (problem) throw new Error(`${id}: ${problem}`);
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
      const confirmed = confirmInBlueprint(blueprint, rowOf(answer.id), { by, on });
      if (confirmed) say(BLUEPRINT, confirmed);
    }
    files[LEDGER] = text;
    if (changes[BLUEPRINT]) files[BLUEPRINT] = renderJson(blueprint, lineWidth(root));
  }
  if (inList.length > 0) {
    const rows = state.list.rows.map((row) => {
      const answer = inList.find((item) => item.id === row.id);
      if (!answer) return row;
      const { answer: kind, said } = answer;
      return { ...row, answer: kind, ...(said ? { said } : {}), by, on };
    });
    for (const answer of inList) {
      say(state.list.files[answer.id], `${answer.id}: ${stampOf(answer, by, on)}`);
    }
    // One file per question: only the answered questions' own files are written.
    if (state.list.shape === "folder") {
      for (const answer of inList) {
        const row = rows.find((item) => item.id === answer.id);
        files[state.list.files[answer.id]] = renderJson(row, lineWidth(root));
      }
    } else {
      files[WAITING_LIST] = renderJson({ ...state.list.list, rows }, lineWidth(root));
    }
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
const SAID = ANSWERS_SAID;

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
    if (item.candidates) {
      lines.push(
        takesMany(item)
          ? "      candidates: keep takes them all; or answer with the names to take, a comma between them"
          : "      candidates: keep takes the first; or answer with the name of another",
      );
      for (const [index, candidate] of item.candidates.entries()) {
        const about = [candidate.store, candidate.pin, candidate.file].filter(Boolean).join(", ");
        lines.push(
          `        ${index + 1}. ${candidate.name}${about ? ` (${about})` : ""}${candidate.why ? `: ${candidate.why}` : ""}`,
        );
        if (candidate.reference) lines.push(`           see ${candidate.reference}`);
      }
    }
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
  if (result.replaced.length > 0) {
    lines.push("", "replaced by a newer question that asks the same about more, not counted:");
    for (const item of result.replaced) lines.push(`  ${item.id}: answer ${item.replaced_by}`);
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

// The day as a waiting list writes it, YYYY-MM-DD, by the clock of this machine.
export const today = () => {
  const now = new Date();
  const two = (value) => String(value).padStart(2, "0");
  return `${now.getFullYear()}-${two(now.getMonth() + 1)}-${two(now.getDate())}`;
};

const USAGE = `usage: node decide.mjs [--target DIR] [--only ID[,ID]] [--answers FILE [--by NAME] [--on DATE]]
                      [--ask QUESTION --recommend TEXT --because TEXT (--hard-to-undo | --easy-to-undo)
                       [--item KIND:WHICH] [--id ID] [--on DATE]]
                      [--split] [--dry-run] [--json]

  --only     Narrow the sheet, the data and the exit code to these questions.
  --answers  A file a person's answers were written to, one line per answer:
               ID giữ            keep it as it is recommended (or: keep)
               ID bác SENTENCE   refuse it; the sentence says what to change (or: refuse)
               ID VALUE          the person's own answer, in their words
             Empty lines and lines that start with # are skipped. One answer that cannot be
             taken refuses the whole file.
  --by       Who answered. Without it, the name git has for the repository.
  --on       The day they answered, as YYYY-MM-DD. Without it, today.
  --ask      Queue a question nobody has answered, as one new file of ${WAITING_FOLDER}; no other
             file is touched. Give what the agent recommends (--recommend), what it rests on
             (--because) and whether it is hard to undo. The agent then goes on with its own
             recommendation, except for a call that is the owner's alone (see --item).
  --item     What the question is about, when it is one item: decision:ID (a row of the ledger),
             pattern:NAME (a new page of a kind of screen), source-color:VALUE (the root colour),
             screen:ID:SLOT (one slot of the brief of one screen, which the ledger of
             screens must have), screens:principles or screens:model-changes:NAMES (one slot
             asked once for every screen it concerns). A new kind of screen and
             the brand colour are the owner's calls: the agent stops, and the gate stays red
             until the owner keeps it.
  --id       The question's id, and the name of its file. Without it, made from the item, or
             from the words of the question.
  --replaces The ids of questions that wait and that this one asks the same about more, a comma
             between them: they wait no longer, and their files stay as they are.
  --split    Turn a waiting list kept as one shared file, ${WAITING_LIST}, into one file per
             question; stops, and writes nothing, if a question could be lost.
  --dry-run  With --answers, --ask or --split: say which files would be written and what would
             change in each, and write nothing.
  --json     The sheet as data: questions, answered, elsewhere, permissions, replaced, and the files
             written.
`;

const FLAGS = {
  "--only": "value",
  "--answers": "value",
  "--by": "value",
  "--on": "value",
  "--ask": "value",
  "--recommend": "value",
  "--because": "value",
  "--hard-to-undo": "switch",
  "--easy-to-undo": "switch",
  "--item": "value",
  "--id": "value",
  "--replaces": "value",
  "--split": "switch",
  "--dry-run": "switch",
};
const ASKING = [
  "--recommend",
  "--because",
  "--hard-to-undo",
  "--easy-to-undo",
  "--item",
  "--id",
  "--replaces",
];

// A short name made of the words of an item: lowercase letters, digits and dashes.
const slug = (words) =>
  words
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48)
    .replace(/-+$/, "");

// The id of an asked question: the one given, else made from its item, else from its words. Made
// from its words, two agents that ask two questions on two branches write two files.
export function askedIdOf({ question, item, id }) {
  if (id !== undefined) return id;
  if (item !== undefined) return slug(item) || `q-${hash(item)}`;
  return `q-${hash(question.normalize("NFC").trim())}`;
}
const hash = (words) => createHash("sha256").update(words).digest("hex").slice(0, 8);

// A question asked with --ask, from the flags of the call.
function askCall(root, state, call) {
  const flags = call.flags;
  return askOf(root, state, {
    question: flags["--ask"],
    recommend: flags["--recommend"],
    because: flags["--because"],
    hard: flags["--hard-to-undo"] === true,
    easy: flags["--easy-to-undo"] === true,
    item: flags["--item"],
    id: flags["--id"],
    replaces:
      flags["--replaces"] === undefined
        ? undefined
        : String(flags["--replaces"])
            .split(",")
            .map((id) => id.trim())
            .filter(Boolean),
    on: flags["--on"],
  });
}

// Why a question about a slot of a screen cannot be asked, or null: the item names a screen the
// ledger of screens does not have, so no sheet would ever read the question or its answer. An
// item of another kind is not looked up here.
const SCREEN_ITEM = "screen:";
function strangerScreen(root, item) {
  if (!item.startsWith(SCREEN_ITEM)) return null;
  const id = item.slice(SCREEN_ITEM.length, item.lastIndexOf(":"));
  const text = ledgerText(root);
  if (text === null) {
    return `this repository keeps no ledger of screens (${SCREEN_LEDGER}), so there is no screen ${id} to ask about`;
  }
  let screens;
  try {
    screens = readScreenLedger(text).screens.map((screen) => String(screen?.id));
  } catch (error) {
    return `the ledger of screens (${SCREEN_LEDGER}) cannot be read (${error.message}), so the screen ${id} cannot be looked up`;
  }
  if (screens.length === 0) {
    return `the ledger of screens (${SCREEN_LEDGER}) lists no screen, so there is no screen ${id} to ask about`;
  }
  return screens.includes(id)
    ? null
    : `${id} is not a screen of the ledger of screens; it has: ${screens.join(", ")}. No sheet would read a question about it`;
}

// A question an agent asks, as one new file of the waiting list, made in memory: its file, what
// the file holds, the list once it is in, and the sheet after. Refused, and nothing written, when
// the question is not whole, when the list is one shared file, or when its id waits already. The
// review command asks its questions through here too, so a question reads the same whoever asks.
export function askOf(root, state, ask) {
  const refused = (why) => new Refusal(`${why}. Nothing was written`);
  if (ask.hard === ask.easy) {
    throw refused(
      "say whether the answer is hard to undo: --hard-to-undo or --easy-to-undo, one of them",
    );
  }
  for (const [key, flag, what] of [
    ["recommend", "--recommend", "what the agent recommends, and goes on with"],
    ["because", "--because", "what the recommendation rests on"],
  ]) {
    if (typeof ask[key] !== "string" || ask[key].trim() === "") {
      throw refused(`a question is asked with ${flag}: ${what}`);
    }
  }
  if (ask.item !== undefined && itemProblem(ask.item)) {
    throw refused(`--item: ${itemProblem(ask.item)}`);
  }
  const stranger = ask.item === undefined ? null : strangerScreen(root, ask.item);
  if (stranger) throw refused(`--item: ${stranger}`);
  if (state.list?.shape === "file") {
    throw refused(
      `the waiting list is one shared file, ${WAITING_LIST}, and asking would change it: split it first, with --split`,
    );
  }
  const id = askedIdOf(ask);
  if (!ID.test(id)) {
    throw refused(
      `${id} cannot be the id of a question: no space, comma or slash, and no dot first`,
    );
  }
  const ledgerIds = state.rows.map((row) => String(row.id));
  if (ledgerIds.includes(id))
    throw refused(`${id} is the id of a row of ${LEDGER}: give another --id`);
  // The same item asked before, or the same id: the answer, or the wait, is already there.
  const item = ask.item;
  const before = askedIn(state, { id, item });
  if (before) throw refused(askedBefore(before, item));
  const on = ask.on ?? today();
  if (!isDay(on)) throw refused(`--on takes a day written YYYY-MM-DD, and ${on} is not one`);
  // A question replaces only questions that wait on the owner: never an answer, a permission, or
  // one another question replaced already.
  const replaces = ask.replaces?.length > 0 ? ask.replaces : undefined;
  const newer = replacedBy(state.list?.rows ?? []);
  for (const other of replaces ?? []) {
    const row = (state.list?.rows ?? []).find((candidate) => candidate.id === other);
    if (!row) throw refused(`--replaces: ${other} is not a question of the waiting list`);
    if (row.kind === "permission") throw refused(`--replaces: ${other} is a permission`);
    if (row.answer) {
      throw refused(
        `--replaces: ${other} was answered by ${row.by} on ${row.on}; an answer is never replaced`,
      );
    }
    if (newer.has(other)) {
      throw refused(`--replaces: ${other} was replaced by ${newer.get(other)} already`);
    }
  }
  const row = {
    id,
    question: ask.question.trim(),
    recommendation: ask.recommend.trim(),
    basis: ask.because.trim(),
    hard_to_undo: ask.hard,
    ...(item !== undefined ? { item } : {}),
    ...(replaces ? { replaces } : {}),
    asked_on: on,
  };
  const problems = rowProblems(row, id);
  if (problems.length > 0) throw refused(problems.join("; "));
  const file = questionFile(id);
  const list = {
    shape: "folder",
    rows: [...(state.list?.rows ?? []), row],
    files: { ...state.list?.files, [id]: file },
  };
  return {
    file,
    content: renderJson(row, lineWidth(root)),
    asked: { id, file, item: row.item ?? null, may_go_on: !mustAsk(row.item) },
    state: { ...state, list },
    after: sheetOf({
      ...state,
      list: {
        ...list,
        rows: [...list.rows].sort((a, b) => a.id.localeCompare(b.id, "en", { numeric: true })),
      },
    }),
  };
}

// The question of the waiting list that has this id or is about this item, or null.
export const askedIn = (state, { id, item }) =>
  (state.list?.rows ?? []).find(
    (row) => (item !== undefined && row.item === item) || row.id.toLowerCase() === id.toLowerCase(),
  ) ?? null;

// Why a question is not asked again: what the owner answered, or that it waits.
function askedBefore(row, item) {
  if (item === undefined || row.item !== item) {
    return `a question with the id ${row.id} is in the waiting list already: give another --id`;
  }
  const on = `${row.id}, by ${row.by} on ${row.on}`;
  const said = row.said ? `: ${row.said}` : "";
  if (row.answer === "keep")
    return `${item} was answered in ${on}: the owner kept it; go on with it`;
  if (row.answer === "refuse") {
    return `${item} was answered in ${on}: the owner refused it${said}; stop, and do not build on it`;
  }
  if (row.answer === "value") {
    return `${item} was answered in ${on}, in the owner's own words${said}; stop, and build what they said, not your recommendation`;
  }
  return `${item} is asked already in ${row.id}, which waits on the owner`;
}

// What an asked question tells the agent that asked it.
function askReport(asked, written, dryRun) {
  const lines = [
    `${dryRun ? "a question would be asked" : "asked"}: ${asked.id}, ${written}`,
    asked.may_go_on
      ? "go on with your recommendation: the owner answers it on this sheet once, and the answer stays for the next time"
      : `stop: ${asked.item} is the owner's call. Do not build on it until the owner keeps it here; until then the gate is red for it`,
  ];
  if (dryRun) lines.push(PREVIEW);
  return `${lines.join("\n")}\n\n`;
}

// A waiting list kept as one shared file, as one file per question. The files are made in memory
// and read back before anything is written: a question that would not come back the same stops it.
function splitCall(root, state, dryRun) {
  const refused = (why) => new Refusal(`${why}. Nothing was written`);
  if (state.list === null) throw refused(`this repository has no waiting list to split`);
  if (state.list.shape === "folder") {
    throw refused(`the waiting list is one file per question already, in ${WAITING_FOLDER}`);
  }
  const width = lineWidth(root);
  const files = Object.fromEntries(
    state.list.rows.map((row) => [questionFile(row.id), renderJson(row, width)]),
  );
  const lower = new Set();
  for (const row of state.list.rows) {
    const key = row.id.toLowerCase();
    if (lower.has(key)) {
      throw refused(
        `two questions, one of them ${row.id}, differ only by capitals: one file would hold both`,
      );
    }
    lower.add(key);
  }
  // An id the shared file took that cannot name a file of the folder: it would be lost there.
  const unnamed = state.list.rows.filter((row) => !ID.test(row.id)).map((row) => row.id);
  if (unnamed.length > 0) {
    throw refused(
      `${unnamed.join(", ")} cannot name a file of ${WAITING_FOLDER} (a space, a comma, a slash, or a dot first): give each another id in ${WAITING_LIST} first`,
    );
  }
  const lost = state.list.rows.filter(
    (row) => JSON.stringify(JSON.parse(files[questionFile(row.id)])) !== JSON.stringify(row),
  );
  if (lost.length > 0)
    throw refused(`${lost.map((row) => row.id).join(", ")} would not be kept as written`);
  const written = writeFiles(root, files, dryRun);
  if (!dryRun) {
    // Read back from the disk before the shared file goes: every question, as it was.
    const back = folderRows(root);
    const same =
      back.problems.length === 0 &&
      back.rows.length === state.list.rows.length &&
      state.list.rows.every((row) => {
        const found = back.rows.find((item) => item.id === row.id);
        return found && JSON.stringify(found) === JSON.stringify(row);
      });
    if (!same) {
      for (const file of Object.keys(files)) {
        if (existsSync(path.join(root, file))) unlinkSync(path.join(root, file));
      }
      throw refused(
        `the folder did not read back as ${WAITING_LIST} holds it (${back.problems[0] ?? `${back.rows.length} of ${state.list.rows.length} questions`}): the files written were taken away again, and ${WAITING_LIST} is kept`,
      );
    }
    unlinkSync(path.join(root, WAITING_LIST));
  }
  const kept = state.list.list.about;
  return {
    files: [...writtenFiles(written), fileChange(WAITING_LIST, "remove")],
    text: [
      `${dryRun ? "would split" : "split"} ${WAITING_LIST} into ${state.list.rows.length} file(s) under ${WAITING_FOLDER}:`,
      ...written.map((line) => `  ${line}`),
      `  remove    ${WAITING_LIST}`,
      ...(kept ? [`the list's own "about" is not a question and has no file: ${kept}`] : []),
      ...(dryRun ? [PREVIEW] : []),
      "",
    ].join("\n"),
  };
}

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
  const asking = call.flags["--ask"] !== undefined;
  const splitting = call.flags["--split"] === true;
  if ([answering, asking, splitting].filter(Boolean).length > 1) {
    return refuse(
      "answering, asking and splitting are three calls: give one of --answers, --ask, --split",
      USAGE,
    );
  }
  if (!asking && ASKING.some((flag) => call.flags[flag] !== undefined)) {
    return refuse(
      `${ASKING.filter((flag) => call.flags[flag] !== undefined).join(", ")} go with --ask`,
      USAGE,
    );
  }
  if (asking && call.flags["--by"] !== undefined) {
    return refuse("--by says who answered; it goes with --answers", USAGE);
  }
  if (
    !answering &&
    !asking &&
    (call.flags["--by"] !== undefined || call.flags["--on"] !== undefined)
  ) {
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
  if (splitting) {
    const split = splitCall(root, state, dryRun);
    return finish({
      json: call.json,
      result: { dry_run: dryRun, files: split.files },
      text: split.text,
      work: false,
    });
  }
  if (asking) {
    const newer = newerLedgers(root);
    if (newer.length > 0) throw new Refusal(`${newer.join("; ")}. Nothing was written`);
    const asked = askCall(root, state, call);
    const written = writeFiles(root, { [asked.file]: asked.content }, dryRun);
    const after = narrow(asked.after, only);
    return finish({
      json: call.json,
      result: { dry_run: dryRun, ...after, asked: asked.asked, files: writtenFiles(written) },
      text: `${askReport(asked.asked, `written to ${asked.file}`, dryRun)}${report(after)}`,
      work: leavesWork(after),
    });
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
