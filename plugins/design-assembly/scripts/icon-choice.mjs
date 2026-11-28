// Which icon set the product takes is the owner's call (spec 0017 as amended, decision 0134). A
// command that writes the row of an icon set nobody chose puts one question for the owner on the
// waiting list, through the same code decide --ask asks with, and tells the builder to stop; the
// wall owner-calls then holds a branch that adds the row until the owner keeps that very item,
// icon-set:<id>. Where the owner kept the item before the row was written, nothing is asked and the
// command says who chose it; where the owner refused it, or answered in other words, no row is
// written. Nothing here writes: the question is made in memory, for the command to write beside
// its row.
import { iconSetItem } from "../templates/tools/design-assembly/waiting.mjs";
import { Refusal } from "./command.mjs";
import { iconItemPredates } from "./decide.mjs";
import { askAll } from "./queue.mjs";

// Why the set is recommended, in the words of the question: the set the code already imports, or
// the one the pieces of the starter kit import, when the row is of that very set; else what the
// call named. `rec` is what this plugin recommended before the row was written.
export function reasonOf({ pin, folder, rec, need }) {
  if (need) return `it holds the icons drawn because the pinned set lacks them (${need})`;
  if (!pin.package) return `the repository keeps the files of ${folder} as its own icons`;
  if (rec?.package === pin.package) {
    return rec.because === "imported"
      ? `the code already imports it (${rec.files} file(s)), and the repository keeps one set, not two`
      : `the pieces of the starter kit import it (${rec.pieces.join(", ")}), and the repository keeps one set, not two`;
  }
  const other = rec?.package
    ? `; this plugin would recommend ${rec.package} here, ${rec.because === "imported" ? "the set the code already imports" : "the set the pieces of the starter kit import"}`
    : "";
  return `the call that wrote the row named it${other}`;
}

// The question that asks the owner whether the product takes the set of a row.
function questionOf({ row, file, from, reason, on, who }) {
  const pin = row.pin ?? {};
  return {
    question: pin.package
      ? `Does the product take the icon set ${row.title}, the package ${pin.package} at ${pin.version}?`
      : `Does the product take the icons kept in ${row.folder} as an icon set of its own?`,
    recommendation: `Keep ${row.title}: ${reason}.`,
    basis: `${file} was written by ${who} on ${on} from ${from}, and no answer of the owner chose the set before the row was written`,
    // Every screen that draws an icon takes it from the set.
    hard_to_undo: true,
    item: iconSetItem(row.id),
  };
}

// Where the owner stands on the set of a row that is about to be written, and the question to
// write beside it when nobody chose the set:
//   item    icon-set:<id>
//   files   the question as one new file of the waiting list, or none
//   asked   the question written now, by its id and its file, or null
//   waits   the id of a question about the item that waits already, or null
//   chosen  who kept the item, on which day and in which question, or null
// It throws one sentence, and nothing is to be written, where the owner refused the set or
// answered in other words, and where the repository's copy of the tool predates the item.
export function ownersChoice(root, { row, file, from, reason, on, who }) {
  const item = iconSetItem(row.id);
  const predates = iconItemPredates(root);
  if (predates) throw new Refusal(`${predates}, then run this again. Nothing was written`);
  const { files, queued, list } = askAll(root, [questionOf({ row, file, from, reason, on, who })], {
    on,
    who,
  });
  const [where] = queued;
  const none = { item, files: {}, asked: null, waits: null, chosen: null };
  const known = where.answered ?? where.waits;
  if (known === undefined) return { ...none, files, asked: { id: where.id, file: where.file } };
  const before = (list?.rows ?? []).find((asked) => asked.id === known);
  if (before?.item !== item) {
    throw new Refusal(
      `the waiting list has a question ${known} about something else, so the owner cannot be asked about ${item} under that id: take it away or answer it first. Nothing was written`,
    );
  }
  // The wall opens for any answer of the owner that keeps the item, whichever question holds it:
  // so does this.
  const kept = (list?.rows ?? []).find((asked) => asked.item === item && asked.answer === "keep");
  if (kept) return { ...none, chosen: { by: kept.by, on: kept.on, question: kept.id } };
  if (where.waits) return { ...none, waits: where.waits };
  const by = `in ${before.id}, by ${before.by} on ${before.on}`;
  const words = before.said ? `: ${before.said}` : "";
  throw new Refusal(
    before.answer === "refuse"
      ? `the owner refused ${item} ${by}${words}: no row is written for a set the owner refused. Nothing was written`
      : `the owner answered ${item} ${by}, in their own words${words}: write the row of the set they named, not this one. Nothing was written`,
  );
}

// What the command says of the owner's call, one line.
export function choiceLine(choice) {
  if (choice.chosen) {
    return `chosen: by ${choice.chosen.by} on ${choice.chosen.on}, in ${choice.chosen.question} of the waiting list`;
  }
  if (choice.waits) {
    return `owner: ${choice.item} is asked already in ${choice.waits}, which waits on the owner. Stop, and build on it once the owner keeps it; until then the gate is red on a branch that adds the row`;
  }
  return `owner: asked in ${choice.asked.file}: which icon set the product takes is the owner's call. Stop, and build on it once the owner keeps it; until then the gate is red on a branch that adds the row`;
}

// The owner's call as a machine reads it.
export const choiceData = ({ item, asked, waits, chosen }) => ({ item, asked, waits, chosen });
