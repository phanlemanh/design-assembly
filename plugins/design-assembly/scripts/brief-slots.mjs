// The slots of a screen brief (specification 0010) and what reads each one. The catalogue of the
// slots is data, references/brief-slots.json: a closed list, each slot saying where its answer is
// read from, or that no ledger holds it. One reader a slot stands in brief-readers.mjs; here they
// are run over one screen and each slot comes out settled, with the file and the row or line every
// answer comes from, or open, with why. Read-only, and read from the repository alone.
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { readSources } from "../templates/tools/design-assembly/governance.mjs";
import { REGISTRY } from "../templates/tools/design-assembly/patterns.mjs";
import { KEYS, modelOf, readModel } from "../templates/tools/design-assembly/screen-actions.mjs";
import { ledgerText } from "../templates/tools/design-assembly/screen-fragments.mjs";
import { readScreenLedger } from "../templates/tools/design-assembly/screen-ledger.mjs";
import {
  frontMatter,
  readKinds,
  readPages,
  screenFiles,
} from "../templates/tools/design-assembly/screens.mjs";
import { READERS } from "./brief-readers.mjs";

export { READERS };

const PLUGIN = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
export const CATALOGUE = "references/brief-slots.json";
// The states a slot of a sheet is in. `asked` is a question that waits on the owner: nothing
// here puts a slot in it yet.
export const SLOT_STATES = ["settled", "asked", "open"];
// When a slot is held by no ledger: on every sheet, or while the screen is not built.
const UNHELD_WHEN = ["always", "planned"];

export const readCatalogue = (plugin = PLUGIN) =>
  JSON.parse(readFileSync(path.join(plugin, CATALOGUE), "utf8"));

const written = (value) => typeof value === "string" && value.trim() !== "";

// Every way the catalogue and the readers do not fit, one line each: a slot out of its place, a
// slot nothing reads that is not said to be held by no ledger, a slot said to be held by none
// that is read all the same, and a reader with no slot. Empty means every slot of a sheet has
// either a reader or a reason it has none.
export function catalogueProblems(catalogue, readers = READERS) {
  const found = [];
  const slots = Array.isArray(catalogue?.slots) ? catalogue.slots : [];
  const seen = new Set();
  slots.forEach((slot, index) => {
    const at = slot?.id ?? `slot ${index + 1}`;
    if (slot?.number !== index + 1) {
      found.push(`${at}: its number is ${slot?.number}, and it stands in place ${index + 1}`);
    }
    if (seen.has(slot?.id)) found.push(`${at}: a second slot has this id`);
    seen.add(slot?.id);
    if (!written(slot?.name) || !written(slot?.question)) {
      found.push(`${at}: no name, or no question it answers`);
    }
    const read = typeof readers[slot?.id] === "function";
    const never = slot?.unheld?.when === "always";
    const sourced = Array.isArray(slot?.reads) && slot.reads.length > 0;
    if (!read && !never) {
      found.push(
        `${at}: no reader reads this slot, and the catalogue does not say that no ledger holds it`,
      );
    }
    if (read && never) found.push(`${at}: said to be held by no ledger, and a reader reads it`);
    if (read && !never && !sourced) {
      found.push(`${at}: a reader reads it, and the catalogue does not say from where`);
    }
    if (slot?.unheld && !(UNHELD_WHEN.includes(slot.unheld.when) && written(slot.unheld.why))) {
      found.push(`${at}: held by no ledger, with no reason or at no time the catalogue knows`);
    }
  });
  for (const id of Object.keys(readers)) {
    if (!seen.has(id)) found.push(`${id}: a reader with no slot of the catalogue`);
  }
  return found;
}

const read = (target, file) =>
  existsSync(path.join(target, file)) ? readFileSync(path.join(target, file), "utf8") : null;

// The page of the screen's kind: what the floor's own reader gives of it, its front matter and
// its text; null where no page describes the kind.
function kindOf(pages, family) {
  const page = readKinds(pages).find((kind) => kind.kind === family) ?? null;
  if (page === null) return null;
  return { ...page, text: pages[page.file], front: frontMatter(pages[page.file]) ?? {} };
}

// What every reader is given: the screen and its own row with the file the row is kept in, the
// keys the ledger spells its columns with, the page of the screen's kind, the data model as the
// files have it (`raw`) and as who-holds-what (`model`), the screen list of the application, and
// the number a slot of the catalogue has, for an answer that waits on another slot.
function contextOf(target, facts, catalogue) {
  const [own] = facts.ledger_rows;
  const text = ledgerText(target);
  const ledger = readScreenLedger(text);
  const spelled = ledger?.keys && typeof ledger.keys === "object" ? ledger.keys : {};
  const registry = read(target, REGISTRY);
  const raw = readModel(target);
  // Each built screen with the source file that draws it, and its id in the ledger: read when a
  // reader asks, since it reads every source file.
  const drawn = () =>
    screenFiles(registry ?? "", readSources(target), registry === null ? text : null).map(
      (screen) => ({
        ...screen,
        id: ledger.screens.find((item) => item.route === screen.path)?.id ?? null,
      }),
    );
  return {
    target,
    facts,
    screen: { ...facts.screen, route: facts.screen.route ?? null },
    row: own.row,
    status: String(own.row.status ?? "built"),
    // Where a key of the screen's own row is read from.
    at: (key) => ({ file: own.ledger, row: own.id, ...(key ? { key } : {}) }),
    keys: { ...KEYS, ...spelled },
    kind: kindOf(readPages(target), facts.screen.family),
    raw,
    model: modelOf(raw),
    registry,
    drawn,
    numberOf: (id) => catalogue.slots.find((slot) => slot.id === id)?.number ?? id,
  };
}

// The twelve slots of one screen, in the catalogue's order, and what the readers found beside
// their answers, for the answer a machine reads. A slot no ledger holds, on every sheet or while
// the screen is not built, is open with the catalogue's own reason and is not read.
export function slotsOf(target, facts, { catalogue = readCatalogue(), readers = READERS } = {}) {
  const context = contextOf(target, facts, catalogue);
  const data = {};
  const slots = catalogue.slots.map((slot) => {
    const unheld = [context.status, "always"].includes(slot.unheld?.when);
    const found = unheld ? { answer: [], why: [slot.unheld.why] } : readers[slot.id](context);
    Object.assign(data, found.data ?? {});
    return {
      number: slot.number,
      id: slot.id,
      name: slot.name,
      question: slot.question,
      state: found.why.length === 0 ? "settled" : "open",
      answer: found.answer,
      why: found.why,
    };
  });
  return { slots, data };
}
