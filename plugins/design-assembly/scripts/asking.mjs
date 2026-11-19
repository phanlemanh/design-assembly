// What the commands that change the store share: the intake ledger read once, the waiting list read
// when a question is read or written, and a question written as one file of it, checked as the gate
// checks it. intake and change ask the owner through here, so a question means the same to both.
import { lineWidth, renderJson } from "../templates/tools/design-assembly/json.mjs";
import { BY_HAND, spellingOf } from "../templates/tools/design-assembly/intake-ledger.mjs";
import { readLedger } from "../templates/tools/design-assembly/ledger.mjs";
import {
  questionFile,
  readWaiting,
  rowProblems,
  WAITING_LIST,
} from "../templates/tools/design-assembly/waiting.mjs";
import { readYaml } from "../templates/tools/design-assembly/yaml.mjs";
import { Refusal } from "./command.mjs";
import { readStamp } from "./stamp.mjs";
import { readIntake, readTheme, text } from "./store.mjs";

// The day, as the waiting list writes it.
export const today = () => {
  const now = new Date();
  const two = (value) => String(value).padStart(2, "0");
  return `${now.getFullYear()}-${two(now.getMonth() + 1)}-${two(now.getDate())}`;
};

// Whether one version comes before another, by their numbers.
export const older = (version, than) => {
  const parts = (value) => String(value).split(".").map(Number);
  const [a, b] = [parts(version), parts(than)];
  for (let index = 0; index < 3; index += 1) {
    if ((a[index] || 0) !== (b[index] || 0)) return (a[index] || 0) < (b[index] || 0);
  }
  return false;
};

// The intake ledger and what stands around it, read once. A ledger that cannot be read stops the
// call before anything is written; a repository with none goes on when `none` is allowed. `since`
// is the first version of the tool that reads the questions this command asks.
export function readStore(root, { since, none: allowed = true }) {
  const theme = readTheme(root);
  const intake = readIntake(root, theme);
  const none = intake.why !== null && intake.why.startsWith("no intake ledger");
  if (!intake.ledger && !(none && allowed)) throw new Refusal(`${intake.why}. Nothing was written`);
  const spelled = intake.ledger?.spelled ?? spellingOf(readYaml(""));
  const byHand = text(intake.ledger?.values?.[BY_HAND]) ?? BY_HAND;
  return { root, theme, intake, spelled, byHand, stamp: readStamp(root), since };
}

// The waiting list, read once when a question is read or written. One kept as one shared file
// stops the call: a question would change that file.
export function waitingOf(state) {
  if (state.waiting === undefined) {
    const ledgerIds = (readLedger(state.root) ?? []).map((row) => String(row.id));
    state.waiting = readWaiting(state.root, ledgerIds);
  }
  if (state.waiting?.shape === "file") {
    throw new Refusal(
      `the waiting list is one shared file, ${WAITING_LIST}, and a question would change it: split it first, with decide --split. Nothing was written`,
    );
  }
  return state.waiting;
}

// The ledger as one that can take a new entry or a change to one: its blocks are a list.
export function writable(state) {
  if (!Array.isArray(state.intake.ledger?.blocks ?? [])) {
    throw new Refusal(`${state.intake.kept}: its blocks are not a list. Nothing was written`);
  }
}

// The questions the waiting list asks about an item, the last asked last.
export const rowsOf = (state, item) =>
  (waitingOf(state)?.rows ?? []).filter((row) => row.item === item);
export const rowOf = (state, item) => rowsOf(state, item).at(-1);

// What the owner said, in a few words.
export const answerOf = (row) =>
  row.answer === "refuse"
    ? `refused by ${row.by} on ${row.on}${row.said ? `: ${row.said}` : ""}`
    : `answered by ${row.by} on ${row.on}`;

// A question as one file of the waiting list, checked as the gate checks it. A tool copied in before
// `since` would read it as broken: no question is written there until the repository upgrades.
export function questionFiles(state, row) {
  if (state.stamp && older(state.stamp.version, state.since)) {
    throw new Refusal(
      `the tool of this repository is ${state.stamp.version}, which reads this question as broken: bring it up to ${state.since} or later with upgrade first, then ask again. Nothing was written`,
    );
  }
  const clash = (waitingOf(state)?.rows ?? []).find(
    (other) => other.id.toLowerCase() === row.id.toLowerCase(),
  );
  if (clash) {
    throw new Refusal(
      `the waiting list has a question ${clash.id} about something else: take it away or answer it first. Nothing was written`,
    );
  }
  const problems = rowProblems(row, row.id);
  if (problems.length > 0) throw new Refusal(`${problems.join("; ")}. Nothing was written`);
  return { [questionFile(row.id)]: renderJson(row, lineWidth(state.root)) };
}
