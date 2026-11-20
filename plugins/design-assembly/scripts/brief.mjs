// The screen brief (specification 0010): one sheet for the builder of one screen, read once. It
// takes a screen of the ledger of screens, built or declared ahead, and says of each of twelve
// slots, a closed list, one of three things. Settled: the repository answers it, with the file and
// the row or line the answer comes from, or the owner answered a question about it, with their
// name and the day the answer carries. Asked: a question about that slot of that screen waits on
// the owner, with its recommendation. Open: nothing says, and the sheet gives the very call of the
// decision sheet that asks it, with a recommendation and what it rests on. The sheet asks no
// question itself and answers none: every question goes through the decision sheet. No model is
// called and no clock is read for the sheet, so the same repository gives the same sheet, byte
// for byte; the one day a clock gives is the day a queued question says it was asked.
// Read-only but for one flag. With --out it writes the sheet as a document into that folder and
// nowhere else. Only with --queue does anything reach the repository: each open slot as one new
// file of the waiting list, made by the decision sheet's own code, all of them or none, and never
// over a file that is there; that file carries the day the question was asked, as every question
// of the waiting list does.
// Usage: node brief.mjs <screen id> [--target DIR] [--queue] [--json] [--out DIR [--format html|pdf]]
// Exit: 0 all twelve slots are settled; 1 a slot is asked or open, or the document was written in
// fewer formats than asked; 2 a wrong call, a screen the ledger does not have, a question that
// cannot be asked, or a repository that cannot be read.
import { stdout } from "node:process";

import { writeFiles, writtenFiles } from "./apply.mjs";
import { older } from "./asking.mjs";
import { briefLimits, DECIDE, sheetOf, sourceWords, standOf } from "./brief-sheet.mjs";
import { slotsOf } from "./brief-slots.mjs";
import { finish, readCall, Refusal, refuse, start } from "./command.mjs";
import { DOCUMENT_FLAGS, handOver, plural, requested } from "./document.mjs";
import { askAll } from "./queue.mjs";
import { factsOf } from "./review-pack.mjs";
import { readStamp } from "./stamp.mjs";

const USAGE =
  "usage: node brief.mjs <screen id> [--target DIR] [--queue] [--json] [--out DIR [--format html|pdf]]\n";
const FLAGS = { ...DOCUMENT_FLAGS, "--queue": "switch" };
// The first version of the tool whose waiting list reads a question about a slot of a screen.
const QUESTIONS_SINCE = "0.24.0";

// How the slots of a sheet stand, counted: how many are settled, asked and open, how many of the
// settled ones the owner's answer settled, and how many hold a line that waits on another slot.
// One thing missing opens one slot, so such a slot is settled; the count says it is not whole.
export function summaryOf(slots) {
  const settled = slots.filter((slot) => slot.state === "settled");
  const count = (state) => slots.filter((slot) => slot.state === state).length;
  return {
    slots: slots.length,
    settled: settled.length,
    asked: count("asked"),
    open: count("open"),
    settled_by_answer: settled.filter((slot) => slot.settled_by).length,
    settled_waiting: settled.filter((slot) =>
      slot.answer.some((item) => item.waits_on !== undefined),
    ).length,
  };
}

// The brief of one screen, as data: the screen, what the readers found for the keys a machine is
// promised, the twelve slots, how they stand, the ones that are asked and the ones still open.
// Nothing is written. `catalogue` is the list of slots to read, the plugin's own when not given;
// `waiting` is the waiting list to look questions up on, the repository's own when not given.
export function brief(target, id, { catalogue, waiting } = {}) {
  const facts = factsOf(target, id, { unbuilt: true });
  const { slots, data } = slotsOf(target, facts, {
    ...(catalogue ? { catalogue } : {}),
    ...(waiting === undefined ? {} : { waiting }),
  });
  const [own] = facts.ledger_rows;
  const listed = (state, more) =>
    slots
      .filter((slot) => slot.state === state)
      .map(({ number, id: slot, name, question, why, ...rest }) => ({
        number,
        id: slot,
        name,
        question,
        why,
        ...more(rest),
      }));
  return {
    screen: {
      ...facts.screen,
      route: facts.screen.route ?? null,
      status: String(own.row.status ?? "built"),
      ledger: own.ledger,
    },
    kind: data.kind ?? null,
    reference: data.reference ?? null,
    components: data.components ?? [],
    states: data.states ?? [],
    // The lines of the rules page, the principles and the direction, as the review pack has them.
    rules: facts.rules.lines,
    actions: data.actions ?? [],
    checks: data.checks ?? [],
    principles: facts.principles,
    unfixed_principles: facts.unfixed_principles,
    direction: facts.direction,
    widths: facts.widths,
    widths_declared: facts.declared,
    model_changes: data.model_changes ?? { actions: [], entities: [] },
    summary: summaryOf(slots),
    slots,
    asked: listed("asked", ({ asked }) => ({ asked })),
    // An open slot gives its question and the call that asks it, or why it cannot be asked.
    open: listed("open", ({ ask, call, cannot_ask }) => (ask ? { ask, call } : { cannot_ask })),
  };
}

// Whether the sheet leaves work for a person: a slot that is not settled.
export const workLeft = (result) => result.slots.some((slot) => slot.state !== "settled");

// The open slots of a sheet as new files of the waiting list, made in memory by the decision
// sheet's own code: the files, and the sheet as it is once they are written. Refused as a whole
// where one question cannot be asked. `on` is the day the questions are dated with, today where
// it is not given.
export function queueOf(target, id, { catalogue, on } = {}) {
  const before = brief(target, id, { catalogue });
  const asking = before.open.filter((slot) => slot.ask);
  // A tool copied in before the item kind was known reads such a question as broken, and its gate
  // would then read no question at all: none is written there until the repository upgrades.
  const stamp = asking.length > 0 ? readStamp(target) : null;
  if (stamp && older(stamp.version, QUESTIONS_SINCE)) {
    throw new Refusal(
      `the tool of this repository is ${stamp.version}, which reads a question about a slot of a screen as broken: bring it up to ${QUESTIONS_SINCE} or later with upgrade first, then ask again. Nothing was written`,
    );
  }
  const { files, list, queued } = askAll(
    target,
    asking.map((slot) => ({ ...slot.ask, basis: slot.ask.basis.text })),
    { on, who: "the brief" },
  );
  // A slot the sheet reads as open has no question of its own on the list. Where the decision
  // sheet finds one all the same, it is a question about something else under the slot's id.
  const taken = asking.filter((slot, index) => !queued[index].file);
  if (taken.length > 0) {
    throw new Refusal(
      `${taken.map((slot) => slot.ask.id).join(", ")} is in the waiting list already, as a question about something else: the brief cannot ask ${plural(taken.length, "that slot", "those slots")} under ${taken.length === 1 ? "that id" : "those ids"}. Nothing was written`,
    );
  }
  return {
    files,
    result: asking.length === 0 ? before : brief(target, id, { catalogue, waiting: list }),
  };
}

const numbered = (slot) => String(slot.number).padStart(2);

function slotLines(slot) {
  const unsaid = slot.state === "open" ? "open" : "not said by the repository";
  return [
    `${numbered(slot)} ${slot.name}: ${slot.state}`,
    ...slot.answer.map((item) => `     ${item.says}  [${sourceWords(item.source)}]`),
    ...slot.why.map((reason) => `     ${unsaid}: ${reason}`),
  ];
}

// The open slots, each with the question the decision sheet would be asked and the call that asks.
function openLines({ screen, open }) {
  if (open.length === 0) return [];
  const asking = open.filter((slot) => slot.ask);
  return [
    `open, for the owner to settle before the screen is ${screen.status === "built" ? "changed" : "built"}:`,
    ...open.flatMap((slot) => [
      `  ${numbered(slot)} ${slot.name}: ${slot.question}`,
      ...(slot.ask
        ? [
            `       recommendation: ${slot.ask.recommendation}`,
            `       because: ${slot.ask.basis.text}`,
            `       ask it: ${slot.call}`,
          ]
        : [`       cannot be asked: ${slot.cannot_ask}`]),
    ]),
    asking.length > 0
      ? `  nothing was written: run again with --queue to put ${plural(asking.length, "question", "questions")} on the waiting list, or run each call`
      : "  nothing was written, and --queue would write nothing: none of these can be asked as it stands",
    "",
  ];
}

// The slots whose question waits, each with its recommendation and whether a builder goes on.
function askedLines({ asked }) {
  if (asked.length === 0) return [];
  return [
    "asked, waiting on the owner's answer:",
    ...asked.flatMap((slot) => [
      `  ${numbered(slot)} ${slot.name}: ${slot.asked.id}, ${slot.asked.file}`,
      `       question: ${slot.asked.question}`,
      `       recommendation: ${slot.asked.recommendation ?? "none given"}`,
      `       ${standOf(slot.asked)}`,
    ]),
    `  the owner answers on the decision sheet, ${DECIDE}; the sheet answers nothing itself`,
    "",
  ];
}

// The answer for a person at a terminal.
export function report(result) {
  const { screen, slots, summary } = result;
  const built = screen.status === "built";
  const waiting =
    summary.settled_waiting > 0
      ? `; ${summary.settled_waiting} of the settled slots ${summary.settled_waiting === 1 ? "holds" : "hold"} a line that waits on another slot`
      : "";
  return [
    `screen brief: ${screen.id} (${screen.route ?? "no route"}), ${built ? "built" : "declared ahead, not built yet"}`,
    `  ${summary.settled} of ${plural(slots.length, "slot", "slots")} settled, ${summary.asked} asked, ${summary.open} open${waiting}`,
    "",
    ...slots.flatMap(slotLines),
    "",
    ...openLines(result),
    ...askedLines(result),
    "what the sheet does not see:",
    ...briefLimits().map((limit) => `  ${limit.id}: ${limit.note}`),
    "",
  ].join("\n");
}

async function main(args) {
  const call = readCall(args, FLAGS, { words: true });
  if (call.problem) return refuse(call.problem, USAGE);
  if (call.help) return void stdout.write(USAGE);
  if (call.words.length === 0) {
    return refuse("say which screen to brief, by its id in the ledger of screens", USAGE);
  }
  if (call.words.length > 1) return refuse("a brief is of one screen at a time", USAGE);
  // A wrong call for a document is refused before anything is read.
  const asked = requested(call);
  const queue = call.flags["--queue"] === true;
  // The questions are made before anything is written: one that cannot be asked leaves nothing
  // behind, in the repository or in the folder of the document.
  const queued = queue ? queueOf(call.target, call.words[0]) : null;
  const result = queued ? queued.result : brief(call.target, call.words[0]);
  const handed = await handOver(asked, call.target, (origin) => sheetOf(result, origin));
  // Only new files of the waiting list, only when asked, and last: once they are written nothing
  // else of the call can fail.
  const lines = queued ? writeFiles(call.target, queued.files, false) : [];
  const told = queued
    ? [
        lines.length > 0
          ? `queued: ${plural(lines.length, "question", "questions")}, each a new file of the waiting list`
          : "queued: nothing, no slot of this sheet is open and can be asked",
        ...lines.map((line) => `  ${line}`),
        "",
        "",
      ].join("\n")
    : "";
  return finish({
    json: call.json,
    result: {
      ...result,
      ...handed.data,
      ...(queue ? { files: [...(handed.data.files ?? []), ...writtenFiles(lines)] } : {}),
    },
    text: `${told}${report(result)}${handed.text}`,
    work: workLeft(result) || handed.work,
  });
}

await start(import.meta.url, main);
