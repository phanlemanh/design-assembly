// The slots of a screen brief (specification 0010) and what reads each one. The catalogue of the
// slots is data, references/brief-slots.json: a closed list, each slot saying where its answer is
// read from, or that no ledger holds it. One reader a slot stands in brief-readers.mjs; here they
// are run over one screen and each slot comes out settled, with the file and the row or line every
// answer comes from, or with why the repository does not say. A slot the repository does not
// settle is then looked up on the waiting list, by the item `screen:<screen id>:<slot>`: a
// question that waits there makes it asked, an answer of the owner's settles it, with their name
// and the day the answer carries, and with neither it is open and gives the question the decision
// sheet would be asked, as the very call that asks it. What the working tree says is set beside
// what the repository had where this branch left the main one (brief-branch.mjs): a line read
// from a row this branch wrote says so, and a question that waits is held against what stands
// now. Read-only, and read from the repository alone.
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
import { branchOf, modelWritten, rowWritten } from "./brief-branch.mjs";
import { MEASURES, PLACES, READERS, STANDS } from "./brief-readers.mjs";
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
    for (const [name, other] of Object.entries(ask?.cases ?? {})) {
      if (!written(other?.recommend)) {
        found.push(`${slot?.id}: its recommendation for the case ${name} says nothing`);
      }
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

// What this branch wrote, as the readers are given it: whether anything was compared and with
// which main branch, how the screen's own row stands against the one the base has, what the data
// model gained, lost or changed, and the other screens of the ledger this branch changed, each
// with what of it changed: its row, or the source file that draws it. A screen this branch adds
// is a screen of its own and not one it changed. Where nothing was compared
// the row is not said to be anyone's, and nothing is listed.
function branchFacts(target, { own, raw, others, drawn }) {
  const found = branchOf(target);
  const { compared, main, on_main, why } = found;
  const said = { compared, main, on_main, why };
  if (!compared) return { ...said, row: { new: false, changed: [] }, model: [], touched: () => [] };
  const rowAt = (id) => found.screens.find((item) => String(item?.id) === String(id));
  return {
    ...said,
    row: rowWritten(rowAt(own.id), own.row),
    model: modelWritten(found.model, raw),
    touched: () => {
      const files = drawn();
      return others
        .map((item) => {
          const written = rowWritten(rowAt(item.id), item);
          const file = files.find((screen) => screen.id === String(item.id))?.file ?? null;
          return {
            id: String(item.id),
            added: written.new,
            row: written.changed,
            file: file !== null && found.changed.has(file) ? file : null,
          };
        })
        .filter((item) => !item.added && (item.row.length > 0 || item.file !== null));
    },
  };
}

// What every reader is given: the screen and its own row with the file the row is kept in, the
// keys the ledger spells its columns with, the page of the screen's kind, the data model as the
// files have it (`raw`) and as who-holds-what (`model`), the screen list of the application, the
// ledger of screens and the rows of its other screens, what this branch wrote, and the number a
// slot of the catalogue has, for an answer that waits on another slot.
function contextOf(target, facts, catalogue) {
  const [own] = facts.ledger_rows;
  const text = ledgerText(target);
  const ledger = readScreenLedger(text);
  const spelled = ledger?.keys && typeof ledger.keys === "object" ? ledger.keys : {};
  const keys = { ...KEYS, ...spelled };
  const registry = read(target, REGISTRY);
  const raw = readModel(target);
  const others = ledger.screens.filter((item) => String(item?.id) !== facts.screen.id);
  // Each built screen with the source file that draws it, and its id in the ledger: read when a
  // reader asks, since it reads every source file.
  const drawn = () =>
    screenFiles(registry ?? "", readSources(target), registry === null ? text : null).map(
      (screen) => ({
        ...screen,
        id: ledger.screens.find((item) => item.route === screen.path)?.id ?? null,
      }),
    );
  const branch = branchFacts(target, { own, raw, others, drawn });
  // Whether what is read from the row is this branch's own: the whole row where the base has none,
  // one key where its value changed, and, with no key named, what the row says of the data model.
  const written = (key) => {
    if (branch.row.new) return "new";
    const named = key ? [key] : [keys.shows, keys.entry, keys.actions];
    return named.some((name) => branch.row.changed.includes(name)) ? "changed" : null;
  };
  return {
    target,
    facts,
    screen: { ...facts.screen, route: facts.screen.route ?? null },
    row: own.row,
    status: String(own.row.status ?? "built"),
    // Where a key of the screen's own row is read from, and whether this branch wrote it.
    at: (key) => ({
      file: own.ledger,
      row: own.id,
      ...(key ? { key } : {}),
      ...(written(key) ? { branch: written(key) } : {}),
    }),
    // Whether a part of the data model a line is read from is this branch's own: an action or an
    // entity by its name, a field as Entity.field.
    inModel: (what, name) => {
      const mine = branch.model.find((item) => item.what === what && item.name === name);
      return mine ? { branch: mine.change === "added" ? "new" : "changed" } : {};
    },
    keys,
    kind: kindOf(readPages(target), facts.screen.family),
    raw,
    model: modelOf(raw),
    registry,
    drawn,
    ledger,
    others,
    branch,
    numberOf: (id) => catalogue.slots.find((slot) => slot.id === id)?.number ?? id,
  };
}

// The words of a recommendation of the catalogue, with what the sheet measured put where the
// words leave room for it, written {name}.
const filled = (words, fill = {}) =>
  words.replace(/\{([a-z_]+)\}/g, (whole, name) => (name in fill ? fill[name] : whole));

// What an open slot puts to the owner: the question, with the screen and why nothing settles it,
// the catalogue's recommendation for that slot, and what it rests on, with what the sheet
// measured and read of this repository. The item names the slot of the screen, so that the answer
// is found again; the id is the name of the question's file.
function questionOf(slot, found, context) {
  const { screen, status } = context;
  const read = found.why.join("; ");
  // What the sheet measured for this slot, and which of the catalogue's recommendations what it
  // read or measured calls for: the slot's own where neither names another.
  const measured = MEASURES[slot.id]?.(context) ?? null;
  const which = found.case ?? measured?.case;
  const recommend = slot.ask.cases?.[which]?.recommend ?? slot.ask.recommend;
  return {
    item: screenItem(screen.id, slot.id),
    id: questionId(screen.id, slot.id),
    question: `For the screen ${screen.id}, ${status === "built" ? "which is built" : "declared ahead and not built yet"}, slot ${slot.number}, ${slot.name}: ${slot.question} Nothing in the repository settles it: ${read}.`,
    recommendation: filled(recommend, measured?.fill),
    basis: {
      kind: slot.ask.basis.kind,
      text: [slot.ask.basis.text, measured?.text, `The sheet read: ${read}.`]
        .filter(Boolean)
        .join(" "),
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

// A question that waits, held against what stands in the repository now, where the sheet can
// read it: `against` is each thing that goes against its recommendation, `now` each thing that
// stands beside it and that the sheet cannot judge, the recommendation being in words of its own.
// Both say what the branch holds against the main one, whenever the question was asked, and both
// are empty for a slot nothing reads this way.
function standsNow(slot, row, context) {
  const found = STANDS[slot.id]?.(context, row.recommendation ?? null, slot) ?? {};
  return { against: found.against ?? [], now: found.now ?? [] };
}

// A slot the repository settles while a question about it still waits on the owner: the question,
// with its recommendation held against what the repository says now. Nothing where no question
// waits.
function stillWaits(slot, context, waiting) {
  const stands = standingOf(waiting, context.screen.id, slot.id);
  if (!stands || stands.row.answer) return {};
  const { row, file } = stands;
  return {
    waits: {
      id: row.id,
      file,
      question: row.question,
      recommendation: row.recommendation ?? null,
      ...standsNow(slot, row, context),
    },
  };
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
        ...standsNow(slot, row, context),
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

// The twelve slots of one screen, in the catalogue's order, with what the readers found beside
// their answers, for the answer a machine reads, how the sheet stands against the main branch,
// and the places beyond the slots where a choice of this screen hides. A slot no ledger holds, on every sheet or while
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
    const settled = found.why.length === 0;
    // A settled slot one of whose lines was read from what this branch wrote.
    const mine = settled && found.answer.some((item) => item.source.branch);
    return {
      number: slot.number,
      id: slot.id,
      name: slot.name,
      question: slot.question,
      state: "settled",
      answer: found.answer,
      why: found.why,
      ...(mine ? { written_on_branch: true } : {}),
      ...(settled
        ? stillWaits(slot, context, list)
        : unsettled(slot, found, context, { waiting: list, target, plugin })),
    };
  });
  const { compared, main, on_main, why } = context.branch;
  const places = catalogue.slots.flatMap((slot) =>
    (PLACES[slot.id]?.(context) ?? []).map((place) => ({
      slot: slot.id,
      number: slot.number,
      name: slot.name,
      ...place,
    })),
  );
  return { slots, data, branch: { compared, main, on_main, why }, places };
}
