// The slots of a screen brief (specification 0010) and what reads each one. The catalogue of the
// slots is data, references/brief-slots.json: a closed list, each slot saying where its answer is
// read from, or that no ledger holds it. One reader a slot stands in brief-readers.mjs; here they
// are run over one screen and each slot comes out settled, with the file and the row or line every
// answer comes from, or with why the repository does not say. A slot the repository does not
// settle is then looked up on the waiting list, by the item `screen:<screen id>:<slot>`: a
// question that waits there makes it asked, an answer of the owner's settles it, with their name
// and the day the answer carries, and with neither it is open and gives the question the decision
// sheet would be asked, as the very call that asks it. Read-only, and read from the repository
// alone.
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
import {
  ID,
  itemProblem,
  readWaiting,
  SCREEN_SLOTS,
  screenItem,
} from "../templates/tools/design-assembly/waiting.mjs";
import { MEASURES, READERS } from "./brief-readers.mjs";
import { BASES } from "./document.mjs";
import { callOf } from "./queue.mjs";

export { READERS };

const PLUGIN = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
export const CATALOGUE = "references/brief-slots.json";
// The states a slot of a sheet is in. `asked` is a question about that slot of that screen that
// waits on the owner.
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

// Every way the catalogue cannot ask an open slot, one line each: a slot with no recommendation,
// with nothing a recommendation rests on, or that does not say whether it is hard to undo, and a
// slot the waiting list cannot name, whose question could then not be found again. Empty means
// every open slot of a sheet can be put to the owner.
export function askProblems(catalogue) {
  const slots = Array.isArray(catalogue?.slots) ? catalogue.slots : [];
  const found = [];
  for (const slot of slots) {
    const ask = slot?.ask;
    const whole =
      written(ask?.recommend) &&
      ask.basis?.kind in BASES &&
      written(ask.basis.text) &&
      typeof ask.hard_to_undo === "boolean";
    if (!whole) {
      found.push(
        `${slot?.id}: an open slot must recommend something, say what that rests on (a principle, a standard or a measurement), and say whether it is hard to undo`,
      );
    }
    if (!SCREEN_SLOTS.includes(slot?.id)) {
      found.push(
        `${slot?.id}: the waiting list cannot name this slot (it names: ${SCREEN_SLOTS.join(", ")})`,
      );
    }
  }
  const ids = slots.map((slot) => slot?.id);
  for (const id of SCREEN_SLOTS) {
    if (!ids.includes(id)) found.push(`${id}: the waiting list names a slot the catalogue lacks`);
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
// files have it (`raw`) and as who-holds-what (`model`), the screen list of the application, the
// rows of the other screens of the ledger, and the number a slot of the catalogue has, for an
// answer that waits on another slot.
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
    others: ledger.screens.filter((item) => String(item?.id) !== facts.screen.id),
    numberOf: (id) => catalogue.slots.find((slot) => slot.id === id)?.number ?? id,
  };
}

// What an open slot puts to the owner: the question, with the screen and why nothing settles it,
// the catalogue's recommendation for that slot, and what it rests on, with what the sheet
// measured and read of this repository. The item names the slot of the screen, so that the answer
// is found again; the id is the name of the question's file.
function questionOf(slot, found, context) {
  const { screen, status } = context;
  const read = found.why.join("; ");
  const measured = MEASURES[slot.id]?.(context) ?? null;
  return {
    item: screenItem(screen.id, slot.id),
    id: questionId(screen.id, slot.id),
    question: `For the screen ${screen.id}, ${status === "built" ? "which is built" : "declared ahead and not built yet"}, slot ${slot.number}, ${slot.name}: ${slot.question} Nothing in the repository settles it: ${read}.`,
    recommendation: slot.ask.recommend,
    basis: {
      kind: slot.ask.basis.kind,
      text: [slot.ask.basis.text, measured, `The sheet read: ${read}.`].filter(Boolean).join(" "),
    },
    hard_to_undo: slot.ask.hard_to_undo,
  };
}

// The id of the question the sheet asks about one slot of one screen, and the name of its file.
const questionId = (screen, slot) => `screen-${screen}-${slot}`;

// The question of the waiting list about one slot of one screen, with the file it is kept in: the
// one the owner answered where there is one, else the one that waits; null where nobody asked. A
// question is about the slot when its item says so, or when it has the id the sheet asks under
// and names no item, as the decision sheet finds a question asked before.
function standingOf(waiting, screen, slot) {
  const item = screenItem(screen, slot);
  const id = questionId(screen, slot).toLowerCase();
  const rows = (waiting?.rows ?? []).filter(
    (row) =>
      row.kind !== "permission" &&
      (row.item === item || (row.item === undefined && String(row.id).toLowerCase() === id)),
  );
  const row = rows.find((candidate) => candidate.answer) ?? rows[0] ?? null;
  return row === null ? null : { row, file: waiting.files[row.id] };
}

// What the owner answered, as a line of the slot's answer: their words, or the recommendation
// they kept or refused, read from the question's own file, with their name and the day.
function answeredLine({ row, file }) {
  const recommended = row.recommendation ?? `what was asked («${row.question}»)`;
  const says =
    row.answer === "keep"
      ? `The owner kept the recommendation: ${recommended}`
      : row.answer === "refuse"
        ? `The owner refused the recommendation «${recommended}»${row.said ? `: ${row.said}` : ", and said nothing in its place"}`
        : `The owner answered: ${row.said}`;
  return { says, source: { file, row: row.id, by: row.by, on: row.on } };
}

// Why the decision sheet would refuse the question of a slot, or null: the waiting list cannot
// name the screen, the question's id cannot name a file, or a question about something else has
// that id already, as the decision sheet finds one, whatever its capitals.
function unaskable(ask, waiting) {
  const item = itemProblem(ask.item);
  if (item) return `the waiting list cannot take the item: ${item}`;
  if (!ID.test(ask.id)) return `${ask.id} cannot be the id of a question of the waiting list`;
  const taken = (waiting?.rows ?? []).find(
    (row) => String(row.id).toLowerCase() === ask.id.toLowerCase(),
  );
  return taken
    ? `${taken.id} is in the waiting list already, as a question about something else`
    : null;
}

// One slot the repository does not settle, by where its question stands: settled by the owner's
// answer, asked and waiting, or open, with the question to ask and the call that asks it. An open
// slot whose question the decision sheet would refuse gives no call, and says why.
function unsettled(slot, found, context, { waiting, target, plugin }) {
  const stands = standingOf(waiting, context.screen.id, slot.id);
  if (stands?.row.answer) {
    const { row, file } = stands;
    return {
      state: "settled",
      answer: [...found.answer, answeredLine(stands)],
      settled_by: {
        id: row.id,
        file,
        answer: row.answer,
        said: row.said ?? null,
        by: row.by,
        on: row.on,
      },
    };
  }
  if (stands) {
    const { row, file } = stands;
    return {
      state: "asked",
      asked: {
        id: row.id,
        file,
        question: row.question,
        recommendation: row.recommendation ?? null,
        basis: row.basis ?? null,
        hard_to_undo: row.hard_to_undo ?? null,
      },
    };
  }
  if (!slot.ask) {
    return { state: "open", cannot_ask: "the list of slots gives it no recommendation" };
  }
  const ask = questionOf(slot, found, context);
  const refused = unaskable(ask, waiting);
  if (refused) return { state: "open", cannot_ask: refused };
  return {
    state: "open",
    ask,
    call: callOf({ ...ask, basis: ask.basis.text }, plugin ? { target, plugin } : { target }),
  };
}

// The twelve slots of one screen, in the catalogue's order, and what the readers found beside
// their answers, for the answer a machine reads. A slot no ledger holds, on every sheet or while
// the screen is not built, is not read: the catalogue's own reason says why the repository does
// not settle it. `waiting` is the waiting list to look questions up on, the repository's own when
// not given; one that cannot be read stops the sheet, since a slot's state would not be known.
export function slotsOf(
  target,
  facts,
  { catalogue = readCatalogue(), readers = READERS, waiting, plugin } = {},
) {
  const context = contextOf(target, facts, catalogue);
  const list =
    waiting === undefined
      ? readWaiting(
          target,
          facts.decisions.map((row) => String(row.id)),
        )
      : waiting;
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
      state: "settled",
      answer: found.answer,
      why: found.why,
      ...(found.why.length === 0
        ? {}
        : unsettled(slot, found, context, { waiting: list, target, plugin })),
    };
  });
  return { slots, data };
}
