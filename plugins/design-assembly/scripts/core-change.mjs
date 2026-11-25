// The family's owner changes an answer of the core (spec 0016, criterion 22, slice 4 of item 7.1):
// its value, its hold (a default raised to locked, a locked answer lowered to a default), or an
// answer the core does not hold yet, added from a repository where a person settled it, read as the
// build reads the first repository. Every change records who made it, on which day and why, as an
// entry of the answer's history; how the answer came into the core is never rewritten. The move
// writes the core's answers and nothing else: no member repository is written or told, nothing is
// committed, and it calls no model and no network.
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync, realpathSync, statSync, writeFileSync } from "node:fs";
import path from "node:path";

import {
  ADDRESS,
  CORE,
  CORE_HOLDS,
  corePartShapeProblems,
  familyCoreProblems,
  newerCoreParts,
} from "../templates/tools/design-assembly/contract.mjs";
import { renderJson } from "../templates/tools/design-assembly/json.mjs";
import { isDay } from "../templates/tools/design-assembly/waiting.mjs";
import { today } from "./asking.mjs";
import { fileChange, finish, Refusal, refuse } from "./command.mjs";
import { givenProblem, givenValue, readFirst } from "./core-read.mjs";

const WIDTH = 100;
const ANSWERS = CORE.parts.answers.file;
const DECLARATION = CORE.parts.declaration.file;

// What the command says before an answer becomes locked (decision 0023, point 8): a core starts
// with few locks. The person still decides.
export const LOCK_RULE =
  "Lock an answer only once a difference between the family's repositories has done real harm: a core starts with few locks. You decide; this command does not refuse.";

const MEMBERS_LATER =
  "no member repository was written or told: members learn of the change when they next read the core, which a later slice builds";

const readJsonFile = (file) => JSON.parse(readFileSync(file, "utf8"));
const sameValue = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const shown = (value) => (typeof value === "string" ? value : JSON.stringify(value));

// The root of the git work tree a folder lies in, or null when it lies in none.
function workTreeOf(dir) {
  const run = spawnSync("git", ["-C", dir, "rev-parse", "--show-toplevel"], { encoding: "utf8" });
  return run.status === 0 && run.stdout.trim() !== "" ? realpathSync(run.stdout.trim()) : null;
}

// The core to change: its family's name and its answers part. Refused, with nothing written, when
// it is not a core, holds a part of a newer shape, lies inside a repository that is not its own, or
// does not hold its shape.
function readCore(core) {
  if (!existsSync(core) || !statSync(core).isDirectory()) {
    throw new Refusal(`${core} is not a folder`);
  }
  const newer = newerCoreParts(core);
  if (newer.length > 0) throw new Refusal(`${newer.join("; ")}. Nothing was written`);
  const tree = workTreeOf(core);
  if (tree !== null && tree !== realpathSync(core)) {
    throw new Refusal(
      `${core} lies inside the git work tree of ${tree}: the core is outside every repository, and may be the root of a repository of its own. Nothing was written`,
    );
  }
  if (!existsSync(path.join(core, DECLARATION))) {
    throw new Refusal(`${core} holds no family core: ${DECLARATION} is not there`);
  }
  const problems = familyCoreProblems(core);
  if (problems.length > 0) {
    throw new Refusal(
      `the core at ${core} does not hold its shape, so it is not changed: ${problems.join("; ")}. Run core --check --core ${core}; nothing was written`,
    );
  }
  return {
    family: readJsonFile(path.join(core, DECLARATION)).family,
    data: readJsonFile(path.join(core, ANSWERS)),
  };
}

// The day an answer last changed: its history's last day, or the day it came into the core.
const lastDay = (answer) => answer.history?.at(-1)?.on ?? answer.on;

// A value the person gives, checked for its form exactly as the build checks `--value`, and kept
// as the build keeps it.
function givenFor(id, text) {
  const wrong = givenProblem(id, text);
  if (wrong) throw new Refusal(`--value ${text}: ${wrong}`);
  return givenValue(id, text);
}

// An answer the core holds, changed: its value, its hold, or both. Gives what it was and what it
// became; the answer itself only when something changed.
function changedAnswer(answer, { value, hold, from, by, on, why }) {
  const { id } = answer;
  if (from) {
    throw new Refusal(
      `${id} is in the core already: change its value with --value or its hold with --hold; --from adds an answer the core does not hold`,
    );
  }
  if (value === undefined && hold === undefined) {
    throw new Refusal(
      "say what changes: --value VALUE for its value, --hold locked or --hold default for its hold",
    );
  }
  if (value !== undefined && answer.kind === "rule") {
    throw new Refusal(
      `${id} is a rule, whose words are its row's: a rule is not given a value to compare`,
    );
  }
  const was = { value: answer.value, hold: answer.hold };
  const became = {
    value: value === undefined ? was.value : givenFor(id, value),
    hold: hold ?? was.hold,
  };
  if (sameValue(was.value, became.value) && was.hold === became.hold) {
    return { was, became, answer: null };
  }
  const since = lastDay(answer);
  if (on < since) {
    throw new Refusal(
      `--on ${on} is before ${since}, the day of the answer's last change: a history goes forward`,
    );
  }
  const step = { was, became, by, on, why };
  return {
    was,
    became,
    answer: { ...answer, ...became, history: [...(answer.history ?? []), step] },
  };
}

// An answer the core does not hold, added from a repository where a person settled it, read as the
// build reads the first repository. A value that repository does not hold is the person's to give.
function addedAnswer(id, { value, hold, from, by, on, why }) {
  if (!from) {
    throw new Refusal(
      `${id} is no answer of the core: to add it, name the repository a person settled it in with --from DIR, and its hold with --hold locked or --hold default`,
    );
  }
  if (!hold) throw new Refusal(`say whether ${id} comes in locked or a default, with --hold`);
  if (!existsSync(from) || !statSync(from).isDirectory()) {
    throw new Refusal(`--from ${from} is not a folder`);
  }
  const source = readFirst(from);
  const item = source.candidates.find((one) => one.id === id);
  if (!item) {
    const left = source.left_out.find((one) => one.id === id);
    throw new Refusal(
      left
        ? `${id} is not an answer a person settled in ${source.repository}: ${left.why}`
        : `${id} is no answer of ${source.repository} that may go into a core`,
    );
  }
  if (item.unread && value === undefined) {
    throw new Refusal(
      `${id}: its value could not be read from ${source.repository} (${item.unread}); give it as the person answered, with --value <value>`,
    );
  }
  if (!item.unread && value !== undefined) {
    throw new Refusal(
      `--value: the value of ${id} was read from ${item.origin.ledger} of ${source.repository}; the core keeps what the repository settled`,
    );
  }
  const given = item.unread ? givenFor(id, value) : undefined;
  const settled = item.origin.by
    ? `Settled in ${source.repository} by ${item.origin.by}${item.origin.on ? ` on ${item.origin.on}` : ""}`
    : `Settled in ${source.repository}, whose ${item.origin.ledger} names no one`;
  const answer = {
    id,
    question: item.question,
    kind: item.kind,
    value: given ?? item.value,
    hold,
    check: item.check,
    why: `${settled}; added to the core ${hold === "locked" ? "locked" : "as a default"}: ${why}${given === undefined ? "" : ". Its value is the person's, given when it was added: the ledgers did not hold it."}`,
    by,
    on,
    origin: given === undefined ? item.origin : { ...item.origin, given: { by, on } },
  };
  return {
    was: null,
    became: { value: answer.value, hold },
    answer,
    from: source.repository,
  };
}

// What a change is called, by what it changed.
function changeName(was, became) {
  if (was === null) return "added";
  const value = !sameValue(was.value, became.value);
  const hold = was.hold !== became.hold;
  return value && hold ? "value and hold" : value ? "value" : hold ? "hold" : "none";
}

// Changes one answer of the core in its folder, or says what it would change. Writes the answers
// part only, at the shape this plugin knows, and only when something changes.
export function changeCore(core, request) {
  const { id, by, on, why, dryRun } = request;
  const { family, data } = readCore(core);
  const answers = data.answers;
  const index = answers.findIndex((answer) => answer.id === id);
  const outcome = index >= 0 ? changedAnswer(answers[index], request) : addedAnswer(id, request);
  const change = changeName(outcome.was, outcome.became);
  const file = path.join(core, ANSWERS);
  const base = {
    core,
    family,
    id,
    change,
    was: outcome.was,
    became: outcome.became,
    from: outcome.from ?? null,
    by,
    on,
    why,
    reminder: null,
    members_told: false,
    dry_run: dryRun,
  };
  if (outcome.answer === null) return { ...base, files: [] };
  const next = {
    ...data,
    version: CORE.version,
    answers:
      index >= 0
        ? answers.map((answer, at) => (at === index ? outcome.answer : answer))
        : [...answers, outcome.answer],
  };
  const problems = corePartShapeProblems("answers", next, ANSWERS);
  if (problems.length > 0) {
    throw new Refusal(
      `the core would not hold its own shape: ${problems.join("; ")}. Nothing was written`,
    );
  }
  if (!dryRun) writeFileSync(file, renderJson(next, WIDTH));
  const raised = outcome.became.hold === "locked" && outcome.was?.hold !== "locked";
  return {
    ...base,
    reminder: raised ? LOCK_RULE : null,
    check: outcome.answer.check,
    files: [fileChange(file, "update")],
  };
}

// The change as a person reads it.
export function changeReport(result) {
  const { id, was, became } = result;
  if (result.change === "none") {
    return `${id} is already ${shown(was.value)}, ${was.hold}: this changes nothing, and nothing was written\n`;
  }
  const what =
    result.change === "added"
      ? `${id}, added from ${result.from}: ${shown(became.value)}, ${became.hold}`
      : [
          ...(sameValue(was.value, became.value)
            ? []
            : [`${id}, its value: ${shown(was.value)} became ${shown(became.value)}`]),
          ...(was.hold === became.hold
            ? []
            : [`${id}, its hold: ${was.hold} became ${became.hold}`]),
        ].join("\n");
  const lines = [
    ...(result.reminder ? [result.reminder] : []),
    `family core${result.dry_run ? " (not written: --dry-run)" : ""}: ${result.family}, at ${result.core}`,
    what,
    `  by ${result.by} on ${result.on}, because ${result.why}`,
    ...(result.reminder && result.check === null
      ? ["  no check holds it: no member counts it as held"]
      : []),
    `${result.dry_run ? "would write" : "wrote"}:`,
    ...result.files.map((file) => `  ${file.change}  ${file.path}`),
    MEMBERS_LATER,
    "nothing was committed or sent anywhere",
  ];
  return `${lines.join("\n")}\n`;
}

const blank = (value) => value === undefined || String(value).trim() === "";

// A call of the move, read from the command's flags: refused when a reason, a person or the core is
// missing, or a name, a reason or a value holds an e-mail address; otherwise the change, said.
export function changeCall(call, usage) {
  const { flags } = call;
  const id = String(flags["--change"]).trim();
  if (id === "") return refuse("say which answer changes, with --change ID", usage);
  if (flags["--core"] === undefined)
    return refuse("say which core to change, with --core DIR", usage);
  if (blank(flags["--by"])) {
    return refuse(
      "say who changes the core, with --by NAME: nothing is locked, unlocked or changed without a person",
      usage,
    );
  }
  if (blank(flags["--why"])) {
    return refuse("say why, with --why TEXT: every change of a core records its reason", usage);
  }
  const values = flags["--value"] ?? [];
  if (values.length > 1)
    return refuse("--value is given once in a change: one answer, one value", usage);
  const hold = flags["--hold"];
  if (hold !== undefined && !CORE_HOLDS.includes(hold)) {
    return refuse(`--hold is locked or default, not ${hold}`, usage);
  }
  // A name, never an address: the core is the family's data and may be shared.
  for (const [flag, text] of [
    ["--by", flags["--by"]],
    ["--why", flags["--why"]],
    ["--value", values[0]],
  ]) {
    if (text !== undefined && ADDRESS.test(text)) {
      return refuse(
        `${flag} holds an e-mail address; a core keeps a person's name, never an address`,
        usage,
      );
    }
  }
  const on = flags["--on"] ?? today();
  if (!isDay(on)) return refuse(`--on ${on} is not a day written YYYY-MM-DD`, usage);
  const result = changeCore(path.resolve(flags["--core"]), {
    id,
    value: values[0],
    hold,
    from: flags["--from"] === undefined ? null : path.resolve(flags["--from"]),
    by: flags["--by"].trim(),
    on,
    why: flags["--why"].trim(),
    dryRun: flags["--dry-run"] === true,
  });
  return finish({ json: call.json, result, text: changeReport(result), work: false });
}
