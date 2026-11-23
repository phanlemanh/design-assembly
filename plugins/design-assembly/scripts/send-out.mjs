// The bridge out, its second half (specification 0014, criterion 14 and open question 7): the
// design system bundle goes to a plug from outside only with the owner's leave, given for this
// repository and this plug, written as a row of the decision ledger with their name and day, and
// taken back the same way. With the leave, a run says first what goes where; the skill then sends
// it, and says so with --pushed: the push is recorded where the repository keeps it, and the owner
// is asked once whether to make the system the default there. This module sends nothing anywhere
// and calls no network: it reads and writes files of the repository.
import { existsSync, readFileSync, unlinkSync } from "node:fs";
import path from "node:path";

import { LEDGERS } from "../templates/tools/design-assembly/contract.mjs";
import {
  exportFiles,
  exportProblem,
  exportsName,
  readInputs,
  stampOf,
  SYSTEM_FOLDER,
  SYSTEM_PARTS,
} from "../templates/tools/design-assembly/exports.mjs";
import { lineWidth, renderJson } from "../templates/tools/design-assembly/json.mjs";
import { mergeLedger, readLedger } from "../templates/tools/design-assembly/ledger.mjs";
import {
  questionFile,
  readWaiting,
  STAMP,
  WAITING_LIST,
} from "../templates/tools/design-assembly/waiting.mjs";
import { writeFiles, writtenFiles } from "./apply.mjs";
import { readCapabilities, wordHolds } from "./capabilities.mjs";
import { fileChange, Refusal } from "./command.mjs";

// Where a repository keeps the record of what it sent, plug by plug.
export const PUSHED = "design/export/pushed.json";
const SOCKET = "handoff";
const DECISIONS = LEDGERS.decisions.file;
const THEME = "design/theme.json";
const leaveId = (plug) => `send-${plug}`;
const defaultId = (plug) => `default-${plug}`;
const VERBS = { keep: "confirmed", value: "answered" };

const read = (root, file) =>
  existsSync(path.join(root, file)) ? readFileSync(path.join(root, file), "utf8") : null;
const parse = (text) => {
  try {
    return JSON.parse(text ?? "null");
  } catch {
    return null;
  }
};

// The plug file of a plug of the handoff socket that sends something out, or a refusal.
function plugOf(id, caps = readCapabilities()) {
  const plug = caps.plugs.find((item) => item.id === id);
  if (!plug || !(plug.sockets ?? []).includes(SOCKET) || !plug.sends) {
    throw new Refusal(`${id} is no plug of the ${SOCKET} socket that sends anything out`);
  }
  return plug;
}

// The exports, checked to say what the ledgers say now: a bundle behind them is never sent.
function freshExports(root) {
  const inputs = readInputs(root);
  const name = exportsName(parse(read(root, THEME)));
  if (!name) throw new Refusal("there are no exports yet: write them first with bring-out");
  const stale = Object.keys(exportFiles(inputs, name)).filter(
    (file) => exportProblem(inputs, name, file, read(root, file)) !== null,
  );
  if (stale.length > 0) {
    throw new Refusal(
      `the exports are behind the ledgers: write them again with make design-exports before anything is sent (${stale.join(", ")})`,
    );
  }
  return stampOf(inputs);
}

// The record of what was sent, plug by plug, or an empty one.
export function pushedOf(root) {
  const data = parse(read(root, PUSHED));
  const pushes = Array.isArray(data?.pushes)
    ? data.pushes.filter(
        (item) => typeof item?.plug === "string" && typeof item?.stamp === "string",
      )
    : [];
  return { version: 1, pushes };
}

// The leave of a row of the ledger: given, taken back, or none.
function leaveOf(row) {
  if (!row) return { state: "none" };
  const stamp = STAMP.exec(String(row.note ?? ""));
  if (!stamp) return { state: "none" };
  return { state: stamp[1] === "refused" ? "back" : "given", by: stamp[2], on: stamp[3] };
}

// The question that asks the leave: the plug the owner named at the handoff socket is recommended
// on their word; any other is not sent until the owner says so.
function leaveQuestion(plug, on, changed = null) {
  const entry = plug.recommended_by_owner?.[SOCKET] ?? null;
  const owner = wordHolds(plug, SOCKET) ? entry : null;
  const allow = {
    name: "allow",
    about: "Send it, for this repository and this plug only, until the leave is taken back.",
  };
  const notNow = { name: "not-now", about: "Keep it in the repository: nothing is sent." };
  const now = `${BUNDLE.join(", ")}; to: ${plug.sends}`;
  return {
    id: leaveId(plug.id),
    kind: "question",
    group: changed ? ASKED_AGAIN : "sending out",
    question: changed
      ? `Asked again: the leave was given for ${changed}. May the design system bundle of this repository now be sent to ${plug.id} as ${now}, for this repository and this plug only?`
      : `May the design system bundle of this repository be sent to ${plug.id}, for this repository and this plug only?`,
    recommendation: leaveRecommendation(owner, entry, changed),
    basis: leaveBasis(plug, owner, entry, changed, now),
    hard_to_undo: true,
    where: `${SYSTEM_FOLDER}, sent to ${plug.id}`,
    if_refused: "nothing is sent, and the bundle stays in the repository",
    item: `decision:${leaveId(plug.id)}`,
    asked_on: on,
    candidates: owner ? [allow, notNow] : [notNow, allow],
  };
}

// What a leave question recommends: allow only where the owner's word holds for this very place.
function leaveRecommendation(owner, entry, changed) {
  if (changed) {
    return owner
      ? "allow: asked again because the files that go changed; the owner's word was said of this very place"
      : "not-now: what goes, or where it goes, changed since the leave was given, and the owner's word was not said of what would go now";
  }
  if (owner) return "allow: the owner named this plug at the handoff socket, for this very place";
  return entry
    ? "not-now: the owner's word at the handoff socket was said of another place"
    : "not-now: nothing names this plug at the handoff socket";
}

// What a leave question rests on, in words.
function leaveBasis(plug, owner, entry, changed, now) {
  if (changed) {
    const word = owner
      ? `; decision ${owner.record}, the owner's word said of this very place`
      : "";
    return `the leave recorded ${changed}; what would go now: ${now}${word}`;
  }
  if (owner) {
    return `decision ${owner.record}, and the owner's word "${owner.said}" on ${owner.on}, said of: ${owner.sends ?? plug.sends}; what goes: the files of ${SYSTEM_FOLDER}`;
  }
  if (entry) {
    return `decision ${entry.record}: the owner's word "${entry.said}" on ${entry.on} was said of ${entry.sends}; the plug now sends ${plug.sends}`;
  }
  return `no word of the owner names ${plug.id} at the handoff socket; what would go: the files of ${SYSTEM_FOLDER}; where: ${plug.sends}`;
}

// The question that asks to make the system the default where it was sent.
function defaultQuestion(plug, accountHasDefault, on) {
  const yes = {
    name: "yes",
    about: "Make it the default there, so every design made there follows it.",
  };
  const no = { name: "no", about: "Leave the default there as it is." };
  return {
    id: defaultId(plug.id),
    kind: "question",
    group: "sending out",
    question: `Make the design system just sent the default in ${plug.names[0]}?`,
    recommendation: accountHasDefault
      ? "no: the account has a default system already"
      : "yes: the account has no default system yet",
    basis: accountHasDefault
      ? "the account has a default system of its own, and changing it changes every design made there"
      : "with no default, nothing made there follows this repository's system",
    hard_to_undo: false,
    where: `${plug.id}, the account's default system`,
    if_refused: "the system stays there, not the default",
    asked_on: on,
    candidates: accountHasDefault ? [no, yes] : [yes, no],
  };
}

// The choice an answered question made: the first candidate kept, the one named, or the last.
const chosenOf = (question) =>
  question.answer === "keep"
    ? (question.candidates?.[0]?.name ?? "not-now")
    : question.answer === "value"
      ? String(question.said).trim()
      : "not-now";

// What the owner did with a question that gave no leave, in words that say what they did.
const didOf = (question) =>
  question.answer === "keep"
    ? `kept ${chosenOf(question)}`
    : question.answer === "value"
      ? `answered ${chosenOf(question)}`
      : "refused the question";

// The row of the ledger that records the leave, with the owner's name and day.
// What a leave is given for, as its row records it: the files that go, and where they go. A leave
// counts only for what it records.
const BUNDLE = SYSTEM_PARTS.map((part) => `${SYSTEM_FOLDER}/${part}`);
const leaveSource = (plug) => `leave: ${BUNDLE.join(", ")}; to: ${plug.sends}`;
const leaveRow = (plug, note) => ({
  id: leaveId(plug.id),
  layer: "governance",
  kind: "judgment",
  source: leaveSource(plug),
  note,
});

// The candidate the rule puts first for a plug: leave, where the owner named it at the handoff
// socket; else not now. What `keep` means is read from this rule, never from a file.
// A leave asked again because what goes or where it goes changed is in a group of its own, which
// changes its words. Who comes first is one rule for every asking: allow only where the owner's
// word holds for the place the plug sends to now, else not now.
const ASKED_AGAIN = "sending out, asked again";
const firstByRule = (plug) => (wordHolds(plug, SOCKET) ? "allow" : "not-now");

// The waiting list, read without the id of the leave's own row, so a row and its question left
// together by a run that stopped between them can be read and taken apart. One kept as a shared
// file stops the run, before anything is written: a question would change that file.
function waitingOf(root, rows, plug) {
  const ids = rows.map((row) => String(row.id)).filter((rowId) => rowId !== leaveId(plug.id));
  const waiting = readWaiting(root, ids);
  if (waiting?.shape === "file") {
    throw new Refusal(
      `the waiting list is one shared file, ${WAITING_LIST}: split it first, with decide --split`,
    );
  }
  return waiting;
}

// What the leave is, read from the ledger and the waiting list: a row that gives it or took it
// back, a question that waits, an answer to write, or a refusal. Gives the row to write, the
// question to ask, and what to say. A question beside a row is always taken away.
function leaveState(root, plug, on) {
  const rows = readLedger(root) ?? [];
  const id = leaveId(plug.id);
  const question = (waitingOf(root, rows, plug)?.rows ?? []).find((row) => row.id === id);
  const row = rows.find((item) => String(item.id) === id);
  const leave = leaveOf(row);
  const stray = question ? questionFile(id) : null;
  if (leave.state === "given" && row.source !== leaveSource(plug)) {
    return {
      given: false,
      drop: true,
      ask: leaveQuestion(plug, on, String(row.source).replace(/^leave: /, "")),
      says: `the leave was given for ${String(row.source).replace(/^leave: /, "")}; it would now go to ${plug.sends}: asked again, since what goes or where it goes changed (now ${BUNDLE.join(", ")})`,
    };
  }
  if (leave.state === "given") return { given: true, remove: stray };
  if (leave.state === "back") {
    return {
      given: false,
      remove: stray,
      says: `${leave.by} took the leave back on ${leave.on}: nothing is sent; to ask again, run this with --reask`,
    };
  }
  if (!question) {
    return {
      given: false,
      ask: leaveQuestion(plug, on),
      says: "the owner is asked for leave first",
    };
  }
  const first = question.candidates?.[0]?.name;
  if (first !== firstByRule(plug)) {
    throw new Refusal(
      `${questionFile(id)} leads with ${first}, which the rule does not give for ${plug.id}: ${firstByRule(plug)} comes first; take the file away and run this again to be asked anew`,
    );
  }
  if (question.answer === undefined) {
    return { given: false, waits: true, says: "the leave waits on the owner" };
  }
  if (chosenOf(question) !== "allow") {
    return {
      given: false,
      says: `${question.by} ${didOf(question)} on ${question.on}: nothing is sent; to ask again, run this with --reask`,
    };
  }
  return {
    given: true,
    row: leaveRow(plug, `${VERBS[question.answer]} by ${question.by} on ${question.on}`),
    remove: questionFile(id),
  };
}

// The record of a push, with the stamp of the ledgers it was written from.
function pushedWith(root, plug, stamp, on) {
  const record = pushedOf(root);
  const pushes = [
    ...record.pushes.filter((item) => item.plug !== plug.id),
    { plug: plug.id, stamp, on },
  ];
  return { ...record, pushes: pushes.sort((a, b) => a.plug.localeCompare(b.plug)) };
}

// The leave asked again: a row that gave it or took it back is taken away, and the question is
// asked anew, in place of any answered one.
function reasked(root, plug, on, files) {
  waitingOf(root, readLedger(root) ?? [], plug);
  const question = leaveQuestion(plug, on);
  files[DECISIONS] = mergeLedger(read(root, DECISIONS), [], [leaveId(plug.id)]);
  files[questionFile(question.id)] = renderJson(question, lineWidth(root));
  return {
    waits: [question.id],
    says: "the leave is asked again; the owner answers on the decision sheet",
  };
}

// One run of the bridge out to a plug: the leave asked or read, and with it what goes where; with
// `pushed`, the push recorded and the default asked (on the first push, and again only once its
// question is taken away); with `revoke`, the leave taken back; with `reask`, asked again.
export function sendOut(root, plugId, options = {}) {
  const {
    on,
    pushed = false,
    accountHasDefault = false,
    revoke = false,
    reask = false,
    by = null,
    caps = readCapabilities(),
    dryRun = false,
  } = options;
  const plug = plugOf(plugId, caps);
  const files = {};
  const removed = [];
  const done = (result) => {
    const lines = writeFiles(root, files, dryRun);
    const gone = removed.filter((file) => existsSync(path.join(root, file)));
    if (!dryRun) for (const file of gone) unlinkSync(path.join(root, file));
    return {
      send: null,
      waits: [],
      says: null,
      ...result,
      files: [...writtenFiles(lines), ...gone.map((file) => fileChange(file, "delete"))],
      dry_run: dryRun,
    };
  };
  if (revoke) {
    if (!by) throw new Refusal("--revoke needs --by NAME, the person who takes the leave back");
    waitingOf(root, readLedger(root) ?? [], plug);
    files[DECISIONS] = mergeLedger(read(root, DECISIONS), [
      leaveRow(plug, `refused by ${by} on ${on}: leave taken back`),
    ]);
    // The question of the leave goes with it: a row and a question of one id cannot both stand.
    removed.push(questionFile(leaveId(plug.id)));
    return done({ says: `${by} took the leave back on ${on}: nothing is sent` });
  }
  if (reask) return done(reasked(root, plug, on, files));
  const stamp = freshExports(root);
  const leave = leaveState(root, plug, on);
  if (leave.drop) files[DECISIONS] = mergeLedger(read(root, DECISIONS), [], [leaveId(plug.id)]);
  if (leave.ask) files[questionFile(leave.ask.id)] = renderJson(leave.ask, lineWidth(root));
  if (leave.remove) removed.push(leave.remove);
  if (!leave.given)
    return done({ waits: leave.ask || leave.waits ? [leaveId(plug.id)] : [], says: leave.says });
  if (leave.row) files[DECISIONS] = mergeLedger(read(root, DECISIONS), [leave.row]);
  const send = {
    plug: plug.id,
    files: BUNDLE,
    to: plug.sends,
    stamp,
  };
  if (!pushed)
    return done({
      send,
      says: "the leave is given: send the files, then run this again with --pushed",
    });
  files[PUSHED] = renderJson(pushedWith(root, plug, stamp, on), lineWidth(root));
  const asked = existsSync(path.join(root, questionFile(defaultId(plug.id))));
  if (!asked) {
    const question = defaultQuestion(plug, accountHasDefault, on);
    files[questionFile(question.id)] = renderJson(question, lineWidth(root));
  }
  return done({
    send,
    waits: [defaultId(plug.id)],
    says: "the push is recorded; the default waits on the owner",
  });
}

// The pushes a repository recorded, each with whether the ledgers have moved past it.
export function pushedLines(root) {
  const record = pushedOf(root);
  if (record.pushes.length === 0) return [];
  const ledgers = stampOf(readInputs(root));
  return record.pushes.map(({ plug, on, stamp }) => ({
    plug,
    on,
    stamp,
    ledgers,
    behind: stamp !== ledgers,
  }));
}
