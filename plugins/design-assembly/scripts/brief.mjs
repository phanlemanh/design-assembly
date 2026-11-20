// The screen brief (specification 0010): one sheet for the builder of one screen, read once. It
// takes a screen of the ledger of screens, built or declared ahead, and says of each of twelve
// slots, a closed list, whether the repository has settled it, with the file and the row or line
// the answer comes from, or that it is still open, with why. It asks no question and answers none:
// what is open is the owner's, and is named. No model is called and no clock is read, so the same
// repository gives the same sheet, byte for byte.
// Read-only: it writes nothing in the repository. With --out it writes the sheet as a document
// into that folder and nowhere else.
// Usage: node brief.mjs <screen id> [--target DIR] [--json] [--out DIR [--format html|pdf]]
// Exit: 0 all twelve slots are settled; 1 a slot is open, or the document was written in fewer
// formats than asked; 2 a wrong call, a screen the ledger does not have, or a repository that
// cannot be read.
import { stdout } from "node:process";

import { briefLimits, sheetOf, sourceWords } from "./brief-sheet.mjs";
import { slotsOf } from "./brief-slots.mjs";
import { finish, readCall, refuse, start } from "./command.mjs";
import { DOCUMENT_FLAGS, handOver, plural, requested } from "./document.mjs";
import { factsOf } from "./review-pack.mjs";

const USAGE =
  "usage: node brief.mjs <screen id> [--target DIR] [--json] [--out DIR [--format html|pdf]]\n";

// The brief of one screen, as data: the screen, what the readers found for the keys a machine is
// promised, the twelve slots, and the ones still open. Nothing is written. `catalogue` is the
// list of slots to read, the plugin's own when not given.
export function brief(target, id, { catalogue } = {}) {
  const facts = factsOf(target, id, { unbuilt: true });
  const { slots, data } = slotsOf(target, facts, catalogue ? { catalogue } : {});
  const [own] = facts.ledger_rows;
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
    slots,
    open: slots
      .filter((slot) => slot.state === "open")
      .map(({ number, id: slot, name, question, why }) => ({
        number,
        id: slot,
        name,
        question,
        why,
      })),
  };
}

// Whether the sheet leaves work for a person: a slot that is not settled.
export const workLeft = (result) => result.slots.some((slot) => slot.state !== "settled");

function slotLines(slot) {
  return [
    `${String(slot.number).padStart(2)} ${slot.name}: ${slot.state}`,
    ...slot.answer.map((item) => `     ${item.says}  [${sourceWords(item.source)}]`),
    ...slot.why.map((reason) => `     open: ${reason}`),
  ];
}

// The answer for a person at a terminal.
export function report(result) {
  const { screen, slots, open } = result;
  const built = screen.status === "built";
  const settled = slots.filter((slot) => slot.state === "settled").length;
  return [
    `screen brief: ${screen.id} (${screen.route ?? "no route"}), ${built ? "built" : "declared ahead, not built yet"}`,
    `  ${settled} of ${plural(slots.length, "slot", "slots")} settled, ${open.length} open`,
    "",
    ...slots.flatMap(slotLines),
    "",
    ...(open.length > 0
      ? [
          `open, for the owner to settle before the screen is ${built ? "changed" : "built"}:`,
          ...open.map(
            (slot) => `  ${String(slot.number).padStart(2)} ${slot.name}: ${slot.question}`,
          ),
          "  the sheet asks nothing and answers nothing: these are named, and they are the owner's",
          "",
        ]
      : []),
    "what the sheet does not see:",
    ...briefLimits().map((limit) => `  ${limit.id}: ${limit.note}`),
    "",
  ].join("\n");
}

async function main(args) {
  const call = readCall(args, DOCUMENT_FLAGS, { words: true });
  if (call.problem) return refuse(call.problem, USAGE);
  if (call.help) return void stdout.write(USAGE);
  if (call.words.length === 0) {
    return refuse("say which screen to brief, by its id in the ledger of screens", USAGE);
  }
  if (call.words.length > 1) return refuse("a brief is of one screen at a time", USAGE);
  // A wrong call for a document is refused before anything is read.
  const asked = requested(call);
  const result = brief(call.target, call.words[0]);
  const handed = await handOver(asked, call.target, (origin) => sheetOf(result, origin));
  return finish({
    json: call.json,
    result: { ...result, ...handed.data },
    text: `${report(result)}${handed.text}`,
    work: workLeft(result) || handed.work,
  });
}

await start(import.meta.url, main);
