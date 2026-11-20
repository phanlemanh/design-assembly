// What the commands that hand their questions to the decision sheet share: a question given as
// the very call of the decision sheet that asks it, where a question stands on the waiting list
// already, and a list of questions made into new files of the waiting list, all or nothing. The
// review's harvest and the screen brief ask through here, so a question reads the same whoever
// asks it. The questions are made by the decision sheet's own code and held in memory: nothing
// here writes.
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { newerLedgers } from "../templates/tools/design-assembly/contract.mjs";
import { Refusal } from "./command.mjs";
import { askedIdOf, askedIn, askOf, readState } from "./decide.mjs";

const PLUGIN = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

// One word of a call, as a shell takes it whole.
export const quote = (text) => `'${String(text).replace(/'/g, "'\\''")}'`;

// A question as the call of the decision sheet that asks it. `ask` has the question, the
// recommendation, the basis as words, whether it is hard to undo, and, where it has them, the item
// it is about and the id of its file.
export function callOf(ask, { target, plugin = PLUGIN }) {
  return [
    "node",
    quote(path.join(plugin, "scripts/decide.mjs")),
    "--target",
    quote(target),
    "--ask",
    quote(ask.question),
    "--recommend",
    quote(ask.recommendation),
    "--because",
    quote(ask.basis),
    ask.hard_to_undo ? "--hard-to-undo" : "--easy-to-undo",
    ...(ask.item ? ["--item", quote(ask.item)] : []),
    ...(ask.id ? ["--id", quote(ask.id)] : []),
  ].join(" ");
}

// Where a question stands on the waiting list already: it waits, or the owner answered it; null
// where it is not there.
export function standing(state, ask) {
  const before = askedIn(state, { id: askedIdOf(ask), item: ask.item });
  if (!before) return null;
  return before.answer ? { answered: before.id, answer: before.answer } : { waits: before.id };
}

// Questions as new files of the waiting list, made by the decision sheet's own code and held in
// memory. `asks` is a list, each entry a question or null; the answer says, in the same order,
// where each question went: its new file, or that it waits or was answered already; `list` is the
// waiting list as it is once the files are written. Refused as a whole, and nothing made, where
// one question cannot be asked, or where its file is there already and the list does not read it:
// `who`, the command that asks, makes new files and never writes over one. `on` is the day each
// question is dated with, today where it is not given.
export function askAll(target, asks, { on, who }) {
  const newer = newerLedgers(target);
  if (newer.length > 0) throw new Refusal(`${newer.join("; ")}. Nothing was written`);
  let state = readState(target);
  const files = {};
  const queued = asks.map((ask) => {
    if (ask === null) return null;
    const known = standing(state, ask);
    if (known) return known;
    const asked = askOf(target, state, {
      question: ask.question,
      recommend: ask.recommendation,
      because: ask.basis,
      hard: ask.hard_to_undo === true,
      easy: ask.hard_to_undo !== true,
      item: ask.item,
      id: ask.id,
      on,
    });
    if (existsSync(path.join(target, asked.file))) {
      throw new Refusal(
        `${asked.file} is there already, and the waiting list does not read it as a question: ${who} writes no file over another. Nothing was written`,
      );
    }
    state = asked.state;
    files[asked.file] = asked.content;
    return { id: asked.asked.id, file: asked.file };
  });
  return { files, queued, list: state.list };
}
