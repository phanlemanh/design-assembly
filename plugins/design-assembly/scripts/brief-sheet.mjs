// The screen brief as a document: the twelve slots of one screen set on the frame every document
// of this plugin shares. The page for the person who decides lists the slots that are open or
// asked, one thing to decide each; each open slot's recommendation stands with what it rests on;
// the slots stand in a table, each with its state and where every answer was read; and the last
// part says what the sheet does not see. Built from the facts of the answer for a machine and from
// nothing else, so the same facts give the same page. The call that asks a slot names folders of
// this machine, so the page gives the command to run and leaves the call to the terminal.
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { plural } from "./document.mjs";
import { REVIEW } from "./review-record.mjs";
import { VERSION } from "./stamp.mjs";

const PLUGIN = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const LIMITS = JSON.parse(readFileSync(path.join(PLUGIN, "references/limits.json"), "utf8")).limits;
const AREA = "brief";
export const BRIEF = "/design-assembly:brief";
export const DECIDE = "/design-assembly:decide";

const capital = (text) => `${text.charAt(0).toUpperCase()}${text.slice(1)}`;
const sentence = (text) => `${capital(text)}.`;

// How many rows of a ledger a source names one by one before it counts the rest.
const ROWS_NAMED = 3;
// Where in its file an answer was read, in a few words: the row, the key and the line it names.
function placeWords({ row, rows, key, line, section, note, by, on }) {
  const many =
    rows === undefined
      ? null
      : rows.length > ROWS_NAMED
        ? `rows ${rows.slice(0, ROWS_NAMED).join(", ")} and ${rows.length - ROWS_NAMED} more`
        : `rows ${rows.join(", ")}`;
  return [
    row !== undefined ? `row ${row}` : null,
    many,
    key !== undefined ? `\`${key}\`` : null,
    line !== undefined ? `line ${line}` : null,
    section !== undefined ? `under «${section}»` : null,
    by !== undefined ? `answered by ${by} on ${on}` : null,
    note ?? null,
  ]
    .filter(Boolean)
    .join(", ");
}
// Where an answer was read: the file, then the place in it.
export const sourceWords = (source) => [source.file, placeWords(source)].filter(Boolean).join(", ");

// The open limits of the brief, which the sheet says it does not see.
export const briefLimits = () => LIMITS.filter((row) => row.area === AREA && row.status === "open");

const inState = (result, state) => result.slots.filter((slot) => slot.state === state);
const titleOf = (slot) => `Slot ${slot.number}, ${slot.name}`;
// Whether a builder goes on with the recommendation of a question that waits: only where the
// question recommends something and says that it is easy to undo.
export function standOf(asked) {
  if (asked.recommendation === null) {
    return "nothing to go on with: do not build on it until the owner answers";
  }
  if (asked.hard_to_undo === true)
    return "hard to undo: do not build on it until the owner answers";
  if (asked.hard_to_undo !== false) {
    return "the question does not say whether it is hard to undo: do not build on it until the owner answers";
  }
  return "go on with the recommendation until the owner answers; the answer then stands in its place";
}
const goOn = (asked) => sentence(standOf(asked));

// What was examined, for the cover.
function scopeOf(result) {
  const { screen, slots } = result;
  const built = screen.status === "built";
  return [
    `The screen ${screen.id}, ${screen.route === null ? "with no route named" : `opened at ${screen.route}`}: ${built ? "built" : "declared ahead and not built yet"}`,
    built && screen.file ? `Drawn by ${screen.file}` : "No source file draws it yet",
    `${plural(slots.length, "slot", "slots")} of the catalogue, each read from the repository as it is`,
    "Read with no model called and no clock read; nothing was drawn and nothing was written",
  ];
}

// The twelve slots as the table under the findings: one group a slot, a row for each answer with
// where it was read, and for an open slot a row for each reason.
function registerOf(result) {
  return {
    title: "The twelve slots, each with where its answers were read",
    lede: "A settled slot gives the file and the row or line of every answer, or the owner's answer with their name and the day. An asked slot gives the question that waits. An open slot says why nothing answers it.",
    columns: ["Read from", "What the repository says"],
    groups: result.slots.map((slot) => ({
      title: `${slot.number} · ${capital(slot.name)}`,
      note: slot.state,
      rows: [
        ...slot.answer.map((item) => [
          { code: item.source.file, text: placeWords(item.source) },
          item.says,
        ]),
        ...(slot.asked
          ? [
              [
                { code: slot.asked.file, text: `row ${slot.asked.id}` },
                `Asked: ${slot.asked.question} Recommended: ${slot.asked.recommendation ?? "nothing"}`,
              ],
            ]
          : []),
        ...slot.why.map((reason) => [
          "Nothing",
          `${slot.state === "open" ? "Open" : "Not said by the repository"}: ${reason}`,
        ]),
      ],
    })),
  };
}

// What the sheet did not see: the open limits of the brief, and of every document.
function blindOf() {
  const group = (title, rows) => rows.map(({ id, note }) => ({ group: title, id, note }));
  return [
    ...group("What the sheet does not hold", briefLimits()),
    ...group(
      "Of every document",
      LIMITS.filter((row) => row.area === "document" && row.status === "open"),
    ),
  ];
}

// The steps after the sheet, in order: put what is open to the owner, have what is asked
// answered, build, run what grades the screen.
function nextOf(result) {
  const { screen, reference, checks } = result;
  const open = inState(result, "open").filter((slot) => slot.ask);
  const asked = inState(result, "asked");
  return [
    ...(open.length > 0
      ? [
          {
            command: `${BRIEF} ${screen.id} --queue`,
            why: `Put ${plural(open.length, "open slot", "open slots")} to the owner: each becomes one question of the waiting list, with its recommendation. The sheet asks nothing until then.`,
          },
        ]
      : []),
    ...(asked.length > 0
      ? [
          {
            command: DECIDE,
            why: `${plural(asked.length, "question waits", "questions wait")} on the owner: answered there, each slot is settled by the answer.`,
          },
        ]
      : []),
    {
      command: null,
      why: reference
        ? `Build the screen from the settled slots, like the reference screen ${reference.file}.`
        : "Build the screen from the settled slots.",
    },
    ...checks.map((check) => ({
      command: null,
      why: `Run ${check.check}: it holds ${plural(check.rows.length, "row", "rows")} of the decisions ledger.`,
    })),
    {
      command: `${REVIEW} ${screen.id}`,
      why: "Once the screen is built, draw it and measure it.",
    },
  ];
}

// The one sentence of the page for the person: how the slots stand.
function conclusionOf({ screen, summary }) {
  const { slots, settled, asked, open, settled_waiting: waiting } = summary;
  const held =
    waiting > 0
      ? `, and ${waiting} of them ${waiting === 1 ? "holds" : "hold"} a line that waits on another slot`
      : "";
  if (settled === slots) {
    return `All ${slots} slots of ${screen.id} are settled${held}: the repository or the owner says something for each.`;
  }
  const left = [
    open > 0 ? `${plural(open, "is", "are")} open, and a builder would have to guess there` : null,
    asked > 0 ? `${plural(asked, "is", "are")} asked and wait on the owner` : null,
  ].filter(Boolean);
  return `${settled} of ${slots} slots of ${screen.id} are settled${held}; ${left.join("; ")}.`;
}

// What the owner must decide: one thing for each slot that is open or asked.
function decideOf(result) {
  return [
    ...inState(result, "open").map((slot) => ({
      what: `${titleOf(slot)}: ${slot.question}`,
      detail: [
        ...slot.why.map(sentence),
        slot.ask
          ? `Recommended: ${slot.ask.recommendation}`
          : sentence(`It cannot be asked as it stands: ${slot.cannot_ask}`),
      ].join(" "),
    })),
    ...inState(result, "asked").map((slot) => ({
      what: `${titleOf(slot)}: asked, and waiting on your answer`,
      detail: `${slot.asked.question} Recommended: ${slot.asked.recommendation ?? "nothing"} ${goOn(slot.asked)}`,
    })),
  ];
}

// The slots that are not settled, as findings: an open one a builder would guess at, an asked one
// that waits.
function findingsOf(result) {
  return [
    ...inState(result, "open").map((slot) => ({
      severity: "medium",
      title: `${titleOf(slot)} is open`,
      detail: slot.question,
      evidence: [
        ...slot.why.map(sentence),
        ...slot.answer.map((item) => `${item.says} (${sourceWords(item.source)}).`),
        ...(slot.cannot_ask
          ? [sentence(`It cannot be asked as it stands: ${slot.cannot_ask}`)]
          : []),
      ],
    })),
    ...inState(result, "asked").map((slot) => ({
      severity: "low",
      title: `${titleOf(slot)} is asked and waits on the owner`,
      detail: slot.asked.question,
      evidence: [
        `Asked as ${slot.asked.id}, in ${slot.asked.file}.`,
        `Recommended: ${slot.asked.recommendation ?? "nothing"}`,
        goOn(slot.asked),
        ...slot.why.map(sentence),
      ],
    })),
  ];
}

// What the sheet recommends for each open slot, with what it rests on.
function recommendationsOf(result) {
  return inState(result, "open")
    .filter((slot) => slot.ask)
    .map((slot) => ({
      what: `${titleOf(slot)}: ${slot.ask.recommendation}`,
      basis: slot.ask.basis,
      action: `Ask the owner with ${BRIEF} ${result.screen.id} --queue, and go on with this until the answer comes.`,
    }));
}

// The sheet as data for the frame. `origin` is where the page comes from: the repository's name,
// its last commit and that commit's day.
export function sheetOf(result, origin) {
  const { summary } = result;
  const unsettled = [...inState(result, "open"), ...inState(result, "asked")];
  return {
    kind: "screen-brief",
    title: "Screen brief",
    lede: "One screen, and every choice its builder meets: what is settled, with where it says so, what waits on the owner, and what is still open.",
    origin,
    version: VERSION,
    scope: scopeOf(result),
    decision: {
      conclusion: conclusionOf(result),
      figures: [
        { value: String(summary.settled), of: String(summary.slots), label: "slots settled" },
        { value: String(summary.asked), label: "slots asked, waiting on the owner" },
        { value: String(summary.open), label: "slots still open" },
        { value: String(result.rules.length), label: "rules that apply to the screen" },
      ],
      attention: unsettled.slice(0, 3).map((slot) => ({
        title: sentence(titleOf(slot)).slice(0, -1),
        detail: slot.why.length > 0 ? sentence(slot.why[0]) : slot.question,
      })),
      decide: decideOf(result),
    },
    findings: findingsOf(result),
    register: registerOf(result),
    recommendations: recommendationsOf(result),
    next: nextOf(result),
    blind: blindOf(),
    empty: {
      findings:
        "Every slot is settled: the repository or the owner says something for each. Whether it says enough is for the builder and the owner to judge.",
      decide: "Nothing waits on your decision: every slot of this sheet is settled.",
      recommendations:
        "No recommendation of the sheet's own: no slot is open. A question that waits carries its recommendation on the decision sheet.",
    },
  };
}
