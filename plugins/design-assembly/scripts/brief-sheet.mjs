// The screen brief as a document: the twelve slots of one screen set on the frame every document
// of this plugin shares. The page for the person who decides lists the slots that are still open,
// one thing to decide each; the slots stand in a table, each with its state and where every answer
// was read; and the last part says what the sheet does not see. Built from the facts of the answer
// for a machine and from nothing else, so the same facts give the same page.
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { plural } from "./document.mjs";
import { REVIEW } from "./review-record.mjs";
import { VERSION } from "./stamp.mjs";

const PLUGIN = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const LIMITS = JSON.parse(readFileSync(path.join(PLUGIN, "references/limits.json"), "utf8")).limits;
const AREA = "brief";

const capital = (text) => `${text.charAt(0).toUpperCase()}${text.slice(1)}`;
const sentence = (text) => `${capital(text)}.`;

// How many rows of a ledger a source names one by one before it counts the rest.
const ROWS_NAMED = 3;
// Where in its file an answer was read, in a few words: the row, the key and the line it names.
function placeWords({ row, rows, key, line, section, note }) {
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
    note ?? null,
  ]
    .filter(Boolean)
    .join(", ");
}
// Where an answer was read: the file, then the place in it.
export const sourceWords = (source) => [source.file, placeWords(source)].filter(Boolean).join(", ");

// The open limits of the brief, which the sheet says it does not see.
export const briefLimits = () => LIMITS.filter((row) => row.area === AREA && row.status === "open");

const openOf = (result) => result.slots.filter((slot) => slot.state !== "settled");
const titleOf = (slot) => `Slot ${slot.number}, ${slot.name}`;

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
    lede: "A settled slot gives the file and the row or line of every answer. An open slot says why nothing answers it.",
    columns: ["Read from", "What the repository says"],
    groups: result.slots.map((slot) => ({
      title: `${slot.number} · ${capital(slot.name)}`,
      note: slot.state,
      rows: [
        ...slot.answer.map((item) => [
          { code: item.source.file, text: placeWords(item.source) },
          item.says,
        ]),
        ...slot.why.map((reason) => ["Nothing", `Open: ${reason}`]),
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

// The steps after the sheet, in order: settle what is open, build, run what grades the screen.
function nextOf(result) {
  const { screen, reference, checks } = result;
  const open = openOf(result);
  return [
    ...(open.length > 0
      ? [
          {
            command: null,
            why: `Settle ${plural(open.length, "open slot", "open slots")} with the owner before the screen is built: the sheet names them and asks nothing.`,
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

// The sheet as data for the frame. `origin` is where the page comes from: the repository's name,
// its last commit and that commit's day.
export function sheetOf(result, origin) {
  const { screen, slots } = result;
  const open = openOf(result);
  const settled = slots.length - open.length;
  return {
    kind: "screen-brief",
    title: "Screen brief",
    lede: "One screen, and every choice its builder meets: what the repository has settled, with where it says so, and what is still open.",
    origin,
    version: VERSION,
    scope: scopeOf(result),
    decision: {
      conclusion:
        open.length === 0
          ? `All ${slots.length} slots of ${screen.id} are settled: the repository says something for each.`
          : `${settled} of ${slots.length} slots of ${screen.id} are settled; ${plural(open.length, "is", "are")} open, and a builder would have to guess there.`,
      figures: [
        { value: String(settled), of: String(slots.length), label: "slots the repository settles" },
        { value: String(open.length), label: "slots still open" },
        { value: String(result.rules.length), label: "rules that apply to the screen" },
      ],
      attention: open.slice(0, 3).map((slot) => ({
        title: sentence(titleOf(slot)).slice(0, -1),
        detail: slot.why.length > 0 ? sentence(slot.why[0]) : slot.question,
      })),
      decide: open.map((slot) => ({
        what: `${titleOf(slot)}: ${slot.question}`,
        detail: slot.why.map(sentence).join(" "),
      })),
    },
    findings: open.map((slot) => ({
      severity: "medium",
      title: `${titleOf(slot)} is open`,
      detail: slot.question,
      evidence: [
        ...slot.why.map(sentence),
        ...slot.answer.map((item) => `${item.says} (${sourceWords(item.source)}).`),
      ],
    })),
    register: registerOf(result),
    recommendations: [],
    next: nextOf(result),
    blind: blindOf(),
    empty: {
      findings:
        "Every slot is settled: the repository says something for each. Whether it says enough is for the builder and the owner to judge.",
      decide: "Nothing waits on your decision: every slot of this sheet is settled.",
      recommendations:
        "No recommendation: the sheet carries what is decided and names what is not, and recommends nothing of its own.",
    },
  };
}
