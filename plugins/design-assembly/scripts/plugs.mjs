// The setup step that chooses a plug for each socket, the part a script can do: the board of every
// socket with the plugin's plug and the plugs from outside that can fill it, where each stands in
// the repository, its measure and what it needs; a question on the waiting list for a socket where
// a measured plug is here, four at most a round; and, once the owner answered on the decision sheet,
// the row of the decision ledger that records the choice with their name and day. It reads the
// repository and the plugin's files; it calls no model and no network, and it answers nothing for
// anyone. What a session holds, the skill that runs it lists and passes in: the names of its skills
// and servers, matched here to the names the plug files declare, and no other.
// With --out it writes the overview page of every socket, on the frame every document shares.
// Usage: node plugs.mjs [--target DIR] [--skill NAME]... [--server NAME]... [--needs-sign-in NAME]...
//                       [--session]
//                       [--on DATE] [--dry-run] [--short] [--json] [--out DIR [--format html|pdf]]
// Exit: 0 no question waits; 1 a question waits on the owner; 2 a wrong call, a waiting list or a
// plug file that cannot be read, or a question that recommends what may not be recommended. On 2
// nothing is written. The call is read and ended by the common contract of every command.
import { existsSync, readFileSync, unlinkSync } from "node:fs";
import path from "node:path";
import { stdout } from "node:process";

import { LEDGERS } from "../templates/tools/design-assembly/contract.mjs";
import { lineWidth, renderJson } from "../templates/tools/design-assembly/json.mjs";
import { mergeLedger, readLedger } from "../templates/tools/design-assembly/ledger.mjs";
import {
  isDay,
  questionFile,
  readWaiting,
  WAITING_LIST,
} from "../templates/tools/design-assembly/waiting.mjs";
import { writeFiles, writtenFiles } from "./apply.mjs";
import { today } from "./asking.mjs";
import {
  fallbackOf,
  NO_SESSION,
  NONE,
  PRESENT,
  plugRowId,
  plugSource,
  readCapabilities,
  socketsOf,
} from "./capabilities.mjs";
import { fileChange, finish, readCall, Refusal, refuse, start } from "./command.mjs";
import { DOCUMENT_FLAGS, handOver, requested } from "./document.mjs";
import { documentOf } from "./plugs-page.mjs";

// At most this many questions about plugs wait at once; the rest are asked in a later round.
export const ROUND = 4;
// The file a plug's measure and the owner's word come from, as a question names it.
const PLUG_FILE = (id) => `references/plugs/${id}.json of the plugin`;
// What an answer says of the row it becomes, as the decision sheet stamps a row.
const VERBS = { keep: "confirmed", value: "answered", refuse: "refused" };
const DECISIONS = LEDGERS.decisions.file;

const list = (value) => (Array.isArray(value) ? value : []);
const plural = (count, one, many) => `${count} ${count === 1 ? one : many}`;
const socketOfId = (id) => (id.startsWith("plug-") ? id.slice("plug-".length) : null);

// Every socket with what the setup step shows of it: the plugin's plug, the plug chosen, and each
// plug from outside with where it stands here, its measure, the owner's word, and what it needs.
export function boardOf(
  root,
  caps = readCapabilities(),
  rows = readLedger(root) ?? [],
  session = NO_SESSION,
) {
  const files = new Map(caps.plugs.map((plug) => [plug.id, plug]));
  return socketsOf(root, caps, rows, session).map((socket) => {
    const item = caps.table.capabilities.find((capability) => capability.id === socket.id);
    return {
      id: socket.id,
      name: socket.name,
      stage: item.stage,
      closed: item.socket?.closed === true,
      plugin: socket.plug,
      chosen: socket.chosen,
      candidates: socket.outside.map((outside) => {
        const plug = files.get(outside.id);
        return {
          id: outside.id,
          about: plug.about,
          state: outside.state,
          measured: outside.measured,
          beats_plugin: plug.measured?.[socket.id]?.beats_plugin ?? null,
          owner: plug.recommended_by_owner?.[socket.id] ?? null,
          needs: outside.needs,
          sends: plug.sends ?? null,
          skills: list(plug.skills),
          mcp_servers: list(plug.mcp_servers),
        };
      }),
    };
  });
}

// What a plug may be recommended for at a socket: it beat the plugin's plug, or the owner named it.
const mayLead = (candidate) => candidate.beats_plugin === true || candidate.owner !== null;
// The candidate a question asks about: measured, or named by the owner.
const askable = (candidate) => candidate.measured !== "unmeasured" || candidate.owner !== null;

// The basis of a recommendation, in words.
function basisOf(lead, present, socket) {
  if (lead?.beats_plugin === true) {
    return `measured in decision ${lead.measured}, where it beat the plugin's plug at holding the decision or at what the user must guess`;
  }
  if (lead) {
    return `decision ${lead.owner.record}, and the owner's word "${lead.owner.said}" on ${lead.owner.on}`;
  }
  const measures = present
    .map((candidate) => `${candidate.id} (decision ${candidate.measured})`)
    .join(", ");
  const keeps = socket.plugin ? "the plugin's plug" : "an empty socket";
  return `${measures} did not beat the plugin's plug at holding the decision or at what the user must guess; an outside plug is recommended only when its measure wins, so ${keeps} comes first`;
}

// The recommendation for a socket, or null when nothing is asked there: the candidates a question
// gives, the recommendation first, and what that rests on. Only a socket with a measured plug in
// the repository is asked; an unmeasured plug is never the recommendation, and an outside plug is
// one only when its measure won or the owner named it at this socket.
export function recommendationOf(socket) {
  if (socket.closed) return null;
  const present = socket.candidates.filter(
    (candidate) => PRESENT.includes(candidate.state) && askable(candidate),
  );
  if (present.length === 0) return null;
  const lead =
    present.find((candidate) => candidate.beats_plugin === true) ??
    present.find((candidate) => candidate.owner !== null) ??
    null;
  const keep = socket.plugin
    ? { name: socket.plugin, about: "The plugin's own plug, as today." }
    : { name: NONE, about: "The socket stays empty, as today." };
  const outside = present.map((candidate) => ({ name: candidate.id, about: candidate.about }));
  const candidates = lead
    ? [
        outside.find((item) => item.name === lead.id),
        keep,
        ...outside.filter((item) => item.name !== lead.id),
      ]
    : [keep, ...outside];
  return { candidates, keep, basis: basisOf(lead, present, socket) };
}

// Why a question about a socket's plug recommends what it may not, or null. Its first candidate is
// its recommendation: the plugin's plug, an empty socket where the plugin has none, or a plug from
// outside whose measure beat the plugin's plug there, or that the owner named there.
export function recommendationProblem(question, board) {
  const file = questionFile(question.id);
  const socket = board.find((item) => item.id === socketOfId(question.id));
  if (!socket) return `${file} asks about no socket of the capability table`;
  const name = list(question.candidates)[0]?.name;
  if (name === (socket.plugin ?? NONE)) return null;
  const candidate = socket.candidates.find((item) => item.id === name);
  if (!candidate) return `${file} recommends ${name}, which is no plug of the ${socket.id} socket`;
  if (mayLead(candidate)) return null;
  if (candidate.measured === "unmeasured") {
    return `${file} recommends ${name}, which was never measured at the ${socket.id} socket: an unmeasured plug is never the recommendation`;
  }
  return `${file} recommends ${name}, which was measured in ${candidate.measured} and did not beat the plugin's plug at the ${socket.id} socket, and no word of the owner names it there`;
}

// The question a socket is asked, as one file of the waiting list.
function questionOf(socket, asked, on) {
  const [first] = asked.candidates;
  const plugFiles = asked.candidates
    .filter((candidate) => candidate.name !== asked.keep.name)
    .map((candidate) => PLUG_FILE(candidate.name));
  return {
    id: plugRowId(socket.id),
    kind: "question",
    group: "plugs",
    question: `Which plug works the ${socket.name} socket in this repository?`,
    recommendation: `${first.name}: ${first.about}`,
    basis: asked.basis,
    hard_to_undo: false,
    where: `the ${socket.id} socket; ${plugFiles.join("; ")}`,
    if_refused:
      asked.keep.name === NONE
        ? `the ${socket.id} socket stays empty`
        : `the ${socket.id} socket keeps the plugin's plug ${asked.keep.name}`,
    item: `decision:${plugRowId(socket.id)}`,
    asked_on: on,
    candidates: asked.candidates,
  };
}

// The plug an answered question chose: the first candidate kept, the one named, or on a refusal
// what the socket keeps.
function chosenBy(question, socket) {
  if (question.answer === "keep") return question.candidates[0].name;
  if (question.answer === "value") return String(question.said).trim();
  return socket.plugin ?? NONE;
}

// The row of the decision ledger an answered question becomes, with the owner's name and day, and
// the plug it chose.
function rowOf(question, socket) {
  const plug = chosenBy(question, socket);
  const said = question.answer === "refuse" && question.said ? `: ${question.said}` : "";
  return {
    row: {
      id: question.id,
      layer: "governance",
      kind: "judgment",
      source: plugSource(plug),
      note: `${VERBS[question.answer]} by ${question.by} on ${question.on}${said}`,
    },
    chose: { id: question.id, plug, by: question.by, on: question.on },
  };
}

// The waiting list as this command reads it: its questions about plugs, each about a socket and
// recommending only what may be recommended, and whether it is one shared file, which a question
// would change.
function plugQuestions(root, rows, board) {
  // A plug row and its answered question may stand together for a moment, between the row being
  // written and the question taken away: the question is then only taken away.
  const ids = rows.map((row) => String(row.id)).filter((id) => !id.startsWith("plug-"));
  const waiting = readWaiting(root, ids);
  const questions = (waiting?.rows ?? []).filter(
    (row) => row.id.startsWith("plug-") && row.kind !== "permission",
  );
  for (const question of questions) {
    const problem = recommendationProblem(question, board);
    if (problem) {
      throw new Refusal(
        `${problem}. Nothing was written; take ${questionFile(question.id)} away and run this again to be asked anew`,
      );
    }
  }
  return { questions, shared: waiting?.shape === "file" };
}

// What a run does: the answered questions become rows and leave the waiting list; the sockets that
// can be asked and are not are asked, up to the round. `files` holds the text of every file to
// write, `removed` the questions to take away.
// `session` is what the session holds as the call listed it, or null when the call listed none: a
// chosen plug is then not said to be missing from a session nobody looked at.
export function plan(root, { caps = readCapabilities(), on = today(), session = null } = {}) {
  const listed = session !== null;
  session = session ?? NO_SESSION;
  if (caps.problems.length > 0) {
    throw new Refusal(`the plugin's plug files cannot be read: ${caps.problems.join("; ")}`);
  }
  let rows = readLedger(root) ?? [];
  const before = boardOf(root, caps, rows, session);
  const { questions, shared } = plugQuestions(root, rows, before);
  // In the order the route passes the sockets: the order of the capability table.
  const place = (question) => before.findIndex((socket) => socket.id === socketOfId(question.id));
  const answered = questions
    .filter((question) => question.answer !== undefined)
    .sort((a, b) => place(a) - place(b));
  const written = answered
    .filter((question) => !rows.some((row) => String(row.id) === question.id))
    .map((question) =>
      rowOf(
        question,
        before.find((socket) => socket.id === socketOfId(question.id)),
      ),
    );
  const files = {};
  if (written.length > 0) {
    // Read as text, so that every byte of the rows already there is kept.
    const full = path.join(root, DECISIONS);
    const ledger = existsSync(full) ? readFileSync(full, "utf8") : null;
    const added = written.map((entry) => entry.row);
    files[DECISIONS] = mergeLedger(ledger, added);
    rows = [...rows, ...added];
  }
  const board = boardOf(root, caps, rows, session);
  const open = questions
    .filter((question) => question.answer === undefined)
    .sort((a, b) => place(a) - place(b));
  const settled = new Set([
    ...questions.map((question) => question.id),
    ...rows.map((row) => String(row.id)),
  ]);
  const toAsk = board
    .filter((socket) => !settled.has(plugRowId(socket.id)))
    .map((socket) => ({ socket, asked: recommendationOf(socket) }))
    .filter((entry) => entry.asked !== null);
  const room = Math.max(0, ROUND - open.length);
  const asked = toAsk.slice(0, room).map(({ socket, asked: one }) => questionOf(socket, one, on));
  if (shared && (asked.length > 0 || answered.length > 0)) {
    throw new Refusal(
      `the waiting list is one shared file, ${WAITING_LIST}, and this would change it: split it first, with decide --split. Nothing was written`,
    );
  }
  for (const question of asked) {
    files[questionFile(question.id)] = renderJson(question, lineWidth(root));
  }
  return {
    sockets: board,
    session_listed: listed,
    questions: [...open, ...asked],
    later: toAsk.slice(room).map(({ socket }) => plugRowId(socket.id)),
    rows: written.map((entry) => entry.chose),
    files,
    removed: answered.map((question) => questionFile(question.id)),
  };
}

// Writes what a run decided, or only says what it would write. Gives the result as a machine reads
// it: every file written or taken away, in the order of the writes.
export function carryOut(root, planned, dryRun) {
  const lines = writeFiles(root, planned.files, dryRun);
  const removed = planned.removed.filter((file) => existsSync(path.join(root, file)));
  if (!dryRun) for (const file of removed) unlinkSync(path.join(root, file));
  return {
    sockets: planned.sockets,
    session_listed: planned.session_listed,
    questions: planned.questions,
    later: planned.later,
    rows: planned.rows,
    files: [...writtenFiles(lines), ...removed.map((file) => fileChange(file, "delete"))],
    dry_run: dryRun,
  };
}

// One candidate on the board, in a line.
function candidateLine(candidate) {
  const measure =
    candidate.measured === "unmeasured" ? "unmeasured" : `measured in ${candidate.measured}`;
  const owner = candidate.owner
    ? `, recommended by the owner ("${candidate.owner.said}", ${candidate.owner.on})`
    : "";
  const needs = candidate.needs.length > 0 ? `, needs ${candidate.needs.join(", ")}` : "";
  return [
    `    ${candidate.id.padEnd(22)} ${candidate.state}, ${measure}${owner}${needs}`,
    ...(candidate.sends ? [`      sends: ${candidate.sends}`] : []),
  ];
}

// One socket on the board: its plug, the plug chosen, and its candidates.
function socketLines(socket) {
  const plug = socket.closed
    ? `${socket.plugin}, closed`
    : (socket.plugin ?? "empty: no plug of the plugin");
  const chosen = socket.chosen
    ? `; chosen: ${socket.chosen.plug} by ${socket.chosen.by} on ${socket.chosen.on}, ${socket.chosen.state}`
    : "";
  return [
    `  ${socket.id.padEnd(22)} ${plug}${chosen}`,
    ...socket.candidates.flatMap(candidateLine),
  ];
}

// What the board says of each chosen plug that is not here: where the session was listed, the line
// a route says as it falls back; where it was not, that this run cannot tell.
function missingLines({ sockets, session_listed: listed }) {
  if (listed) return sockets.map(fallbackOf).filter(Boolean);
  return sockets
    .filter((socket) => socket.chosen?.state === "chosen-but-missing")
    .map(
      (socket) =>
        `${socket.chosen.plug} was chosen for the ${socket.name} socket and the repository does not show it; the session was not listed, so whether it is here is not known (run with --session and its skills and servers)`,
    );
}

// The board and what waits, as a person reads it.
export function report(result, { short = false } = {}) {
  const { sockets, questions, later, rows } = result;
  const open = sockets.filter((socket) => !socket.closed);
  const outside = open.filter((socket) => socket.candidates.length > 0);
  const measured = outside.filter((socket) =>
    socket.candidates.some((candidate) => candidate.measured !== "unmeasured"),
  );
  const lines = [
    `Plugs: ${sockets.length} sockets: ${plural(sockets.length - open.length, "is", "are")} closed, ${open.length - outside.length} have only the plugin's plug, ${outside.length} have plugs from outside, ${measured.length} of them a measured one.`,
  ];
  for (const stage of short ? [] : [...new Set(sockets.map((socket) => socket.stage))]) {
    lines.push(stage, ...sockets.filter((socket) => socket.stage === stage).flatMap(socketLines));
  }
  lines.push(...missingLines(result));
  const waiting = sockets.flatMap((socket) =>
    socket.candidates.filter((candidate) => candidate.state === "needs-sign-in"),
  );
  for (const id of [...new Set(waiting.map((candidate) => candidate.id))]) {
    lines.push(
      `${id} waits for a sign-in: give its server access in the session, then run this again.`,
    );
  }
  for (const row of rows) {
    lines.push(`Written: ${row.id} chooses ${row.plug}, by ${row.by} on ${row.on}.`);
  }
  if (questions.length > 0) {
    lines.push(
      `Waiting on the owner: ${plural(questions.length, "question", "questions")}; answer on the decision sheet (/design-assembly:decide), then run this again.`,
    );
    for (const question of questions) {
      lines.push(
        `  ${question.id}: ${question.question}`,
        `      recommendation: ${question.recommendation}`,
        `      because: ${question.basis}`,
        `      if refused: ${question.if_refused}`,
      );
    }
  }
  if (later.length > 0) {
    lines.push(`Asked in a later round: ${later.join(", ")}.`);
  }
  const chosenOutside = sockets.some(
    (socket) => socket.chosen && !["plugin", "empty"].includes(socket.chosen.state),
  );
  const measuredHere = sockets.some((socket) => recommendationOf(socket) !== null);
  if (questions.length === 0 && later.length === 0 && !chosenOutside && !measuredHere) {
    lines.push(
      "No outside plug that was measured is in this repository or this session; every socket keeps the plugin's plug.",
    );
  }
  return `${lines.join("\n")}\n`;
}

const USAGE =
  "usage: node plugs.mjs [--target DIR] [--skill NAME]... [--server NAME]... [--needs-sign-in NAME]... [--session]\n" +
  "                      [--on DATE] [--dry-run] [--short] [--json] [--out DIR [--format html|pdf]]\n";
const FLAGS = {
  ...DOCUMENT_FLAGS,
  "--skill": "list",
  "--server": "list",
  "--needs-sign-in": "list",
  "--on": "value",
  "--dry-run": "switch",
  "--short": "switch",
  "--session": "switch",
};

// What the session holds, as the call lists it, or null when the call lists no session: --session
// says the names given are all it holds, even none.
function sessionOf(flags) {
  const named = ["--skill", "--server", "--needs-sign-in"].some((flag) => flags[flag]);
  if (!flags["--session"] && !named) return null;
  return {
    skills: flags["--skill"] ?? [],
    servers: flags["--server"] ?? [],
    signIn: flags["--needs-sign-in"] ?? [],
  };
}

async function main(args) {
  const call = readCall(args, FLAGS);
  if (call.problem) return refuse(call.problem, USAGE);
  if (call.help) return void stdout.write(USAGE);
  const on = call.flags["--on"] ?? today();
  if (!isDay(on)) return refuse(`--on ${on} is not a day written YYYY-MM-DD`, USAGE);
  // A wrong call for a document is refused before anything is read or written.
  const asked = requested(call);
  const planned = plan(call.target, { on, session: sessionOf(call.flags) });
  const result = carryOut(call.target, planned, call.flags["--dry-run"] === true);
  const handed = await handOver(asked, call.target, (origin) => documentOf(result, origin));
  return finish({
    json: call.json,
    result: {
      sockets: result.sockets,
      session_listed: result.session_listed,
      questions: result.questions,
      later: result.later,
      rows: result.rows,
      files: [...result.files, ...(handed.data.files ?? [])],
      dry_run: result.dry_run,
      ...(handed.data.not_written ? { not_written: handed.data.not_written } : {}),
    },
    text: `${report(result, { short: call.flags["--short"] === true })}${handed.text}`,
    work: result.questions.length > 0 || handed.work,
  });
}

await start(import.meta.url, main);
