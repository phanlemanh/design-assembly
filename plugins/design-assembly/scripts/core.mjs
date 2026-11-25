// The core of a family of products (spec 0016, slice 1 of item 7.1): read the first repository of
// a family and lay out the lock-or-default sheet; build the core folder from the answers a person
// gave on that sheet; and check the shape of a core folder. The first repository is read and never
// written; the core is a folder on this machine, outside every repository of the family. It calls
// no model and no network, and pushes nothing.
// Usage: node core.mjs [--target DIR] [--family NAME] [--core DIR] [--json]
//        node core.mjs --build --family NAME --core DIR --by NAME [--lock ID]... [--default ID]...
//                      [--on DATE] [--dry-run] [--target DIR] [--json]
//        node core.mjs --check --core DIR [--json]
//        node core.mjs --change ID --core DIR --by NAME --why TEXT [--value VALUE]
//                      [--hold locked|default] [--from DIR] [--on DATE] [--dry-run] [--json]
// Changing an answer of a built core is scripts/core-change.mjs (slice 4 of item 7.1).
// Exit: reading, 1 when the sheet waits on a person, 0 when no answer of the repository is settled
// and there is nothing to build from; building, 0 once the core is written (or would be); checking,
// 0 when the shape holds and 1 when a part of it is wrong, each problem naming the file and the
// place; 2 a wrong call, a repository or a core that cannot be read, or a core of a newer shape.
// On 2 nothing is written.
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readdirSync, realpathSync, statSync, writeFileSync } from "node:fs";
import path from "node:path";
import { stdout } from "node:process";

import {
  ADDRESS,
  CORE,
  corePartShapeProblems,
  familyCoreProblems,
  newerCoreParts,
} from "../templates/tools/design-assembly/contract.mjs";
import { renderJson } from "../templates/tools/design-assembly/json.mjs";
import { isDay } from "../templates/tools/design-assembly/waiting.mjs";
import { today } from "./asking.mjs";
import { changeOf, finish, readCall, Refusal, refuse, start } from "./command.mjs";
import { changeCall } from "./core-change.mjs";
import { givenProblem, givenValue, placeOf, readFirst, sheetOf } from "./core-read.mjs";

const WIDTH = 100;
const KIND_WORDS = {
  blueprint: "built by the guide: its blueprint and its decision ledger",
  ledgers: "adopted: its decision ledger, token file and widths",
  none: "no ledger of design decisions",
};

// A folder by its real path, read through the nearest folder that exists.
function real(dir) {
  let at = path.resolve(dir);
  const rest = [];
  while (!existsSync(at)) {
    rest.unshift(path.basename(at));
    at = path.dirname(at);
  }
  return { path: path.join(realpathSync(at), ...rest), existing: realpathSync(at) };
}

// Whether one folder is the other or lies inside it.
function within(inner, outer) {
  const relative = path.relative(real(outer).path, real(inner).path);
  return relative === "" || (!relative.startsWith("..") && !path.isAbsolute(relative));
}

// The root of the git work tree a folder lies in, or null when it lies in none. Read from the
// nearest folder that exists.
function workTreeOf(dir) {
  const run = spawnSync("git", ["-C", real(dir).existing, "rev-parse", "--show-toplevel"], {
    encoding: "utf8",
  });
  return run.status === 0 && run.stdout.trim() !== "" ? realpathSync(run.stdout.trim()) : null;
}

// Why the folder cannot take a new core, or null. A part of a newer shape is said first, and the
// plugin then writes nothing there.
function placeProblem(core, first) {
  for (const root of new Set([first.path, first.home])) {
    if (within(core, root)) {
      return `${core} is inside the first repository, ${root}: the core is never written inside a repository of the family`;
    }
    if (within(root, core)) {
      return `the first repository, ${root}, lies inside ${core}: the core is a folder of its own`;
    }
  }
  // Outside every repository: a folder inside a git work tree is inside a repository, which may be
  // one of the family; the root of a repository of its own is the core's own, and may be.
  const tree = workTreeOf(core);
  if (tree !== null && tree !== real(core).path) {
    return `${core} lies inside the git work tree of ${tree}: the core is outside every repository, and may be the root of a repository of its own`;
  }
  if (!existsSync(core)) return null;
  if (!statSync(core).isDirectory()) return `${core} is a file, not a folder`;
  const newer = newerCoreParts(core);
  if (newer.length > 0) return newer.join("; ");
  if (existsSync(path.join(core, CORE.parts.declaration.file))) {
    return `${core} holds a family core already: change its answers with --change`;
  }
  // A repository of its own, made for the core, holds git's own folder and nothing else.
  if (readdirSync(core).some((name) => name !== ".git")) return `${core} is not empty`;
  return null;
}

// The answers named on the sheet, in the order the first repository gives them, each with its
// hold. Refused when an answer is not one a person settled there, or is named twice.
function answersOf(first, { lock, defaults, values = {}, by, on }) {
  const both = lock.filter((id) => defaults.includes(id));
  if (both.length > 0) {
    throw new Refusal(
      `${both.join(", ")} is named both locked and default: an answer has one hold`,
    );
  }
  for (const id of [...lock, ...defaults]) {
    if (first.candidates.some((item) => item.id === id)) continue;
    const left = first.left_out.find((item) => item.id === id);
    throw new Refusal(
      left
        ? `${id} is not an answer a person settled in ${first.repository}: ${left.why}`
        : `${id} is no answer of ${first.repository} that may go into a core`,
    );
  }
  for (const id of Object.keys(values)) {
    const item = first.candidates.find((one) => one.id === id);
    if (!item || !(lock.includes(id) || defaults.includes(id))) {
      throw new Refusal(`--value ${id}: name ${id} with --lock or --default to give its value`);
    }
    if (!item.unread) {
      throw new Refusal(
        `--value ${id}: its value was read from ${item.origin.ledger} of ${first.repository}; the core keeps what the repository settled`,
      );
    }
    const wrong = givenProblem(id, values[id]);
    if (wrong) throw new Refusal(`--value ${id}=${values[id]}: ${wrong}`);
  }
  for (const id of [...lock, ...defaults]) {
    const item = first.candidates.find((one) => one.id === id);
    if (item.unread && !(id in values)) {
      throw new Refusal(
        `${id}: its value could not be read from ${first.repository} (${item.unread}); give it as the person answered, with --value ${id}=<value>`,
      );
    }
  }
  return first.candidates
    .filter((item) => lock.includes(item.id) || defaults.includes(item.id))
    .map((item) => {
      const hold = lock.includes(item.id) ? "locked" : "default";
      const settled = item.origin.by
        ? `Settled in ${item.origin.repository} by ${item.origin.by}${item.origin.on ? ` on ${item.origin.on}` : ""}`
        : `Settled in ${item.origin.repository}, whose ${item.origin.ledger} names no one`;
      const given = item.unread ? givenValue(item.id, values[item.id]) : undefined;
      return {
        id: item.id,
        question: item.question,
        kind: item.kind,
        value: given ?? item.value,
        hold,
        check: item.check,
        why: `${settled}; made ${hold === "locked" ? "locked" : "a default"} on the lock-or-default sheet.${given === undefined ? "" : " Its value is the person's, given on the sheet: the ledgers did not hold it."}`,
        by,
        on,
        origin: given === undefined ? item.origin : { ...item.origin, given: { by, on } },
      };
    });
}

// The parts of a new core, by their file in the core folder.
function partsOf(first, answers, { family, by, on }) {
  const { version } = CORE;
  return {
    [CORE.parts.declaration.file]: {
      version,
      family,
      first: { repository: first.repository, read_on: on, commit: first.commit },
      members: [],
      owner: { by, on },
    },
    [CORE.parts.answers.file]: { version, answers },
    [CORE.parts.blocks.file]: { version, blocks: [] },
  };
}

const PART_OF = Object.fromEntries(
  Object.entries(CORE.parts)
    .filter(([, spec]) => spec.file)
    .map(([part, spec]) => [spec.file, part]),
);

// The first repository as an answer gives it: its name, the folder read, its main folder, its commit
// and how it keeps its answers.
const firstOf = ({ repository, path: read, home, commit, kind }) => ({
  repository,
  path: read,
  home,
  commit,
  kind,
});

// Builds the core from the sheet's answers, or says what it would write. The first repository is
// read and never written.
export function buildCore(
  root,
  { family, core, lock = [], defaults = [], values = {}, by, on, dryRun },
) {
  if (lock.length + defaults.length === 0) {
    throw new Refusal(
      "name at least one answer with --lock or --default: a core holds the answers a family shares",
    );
  }
  const first = readFirst(root);
  const answers = answersOf(first, { lock, defaults, values, by, on });
  const place = placeProblem(core, first);
  if (place) throw new Refusal(`${place}. Nothing was written`);
  const parts = partsOf(first, answers, { family, by, on });
  const problems = Object.entries(parts).flatMap(([file, data]) =>
    corePartShapeProblems(PART_OF[file], data, file),
  );
  if (problems.length > 0) {
    throw new Refusal(
      `the core would not hold its own shape: ${problems.join("; ")}. Nothing was written`,
    );
  }
  const files = Object.keys(parts).map((file) => changeOf(root, path.join(core, file)));
  if (!dryRun) {
    for (const [file, data] of Object.entries(parts)) {
      const full = path.join(core, file);
      mkdirSync(path.dirname(full), { recursive: true });
      writeFileSync(full, renderJson(data, WIDTH));
    }
  }
  return {
    first: firstOf(first),
    family,
    core,
    answers,
    files,
    dry_run: dryRun,
  };
}

// The first repository read, and the sheet a person answers before a core is built.
export function readForCore(root, { family = null, core = null }) {
  const first = readFirst(root);
  const place = core ?? placeOf(first.home, family);
  const sheet = first.candidates.length > 0 ? sheetOf(first, { family, core: place }) : [];
  return {
    first: firstOf(first),
    family,
    core: place,
    candidates: first.candidates,
    left_out: first.left_out,
    sheet,
  };
}

// The shape of a core folder.
export function checkCore(core) {
  if (!existsSync(core) || !statSync(core).isDirectory()) {
    throw new Refusal(`${core} is not a folder`);
  }
  const newer = newerCoreParts(core);
  if (newer.length > 0) throw new Refusal(`${newer.join("; ")}. Nothing was written`);
  return { core, version: CORE.version, problems: familyCoreProblems(core) };
}

const shownValue = (value) => (typeof value === "string" ? value : JSON.stringify(value));
// An answer as a person reads it: a value a member compares, a value the repository does not hold,
// or a rule, whose words are what its row says and never a value to compare.
const answerWords = (item) =>
  item.unread
    ? `value not read (${item.unread}): give it with --value ${item.id}=<value>`
    : item.kind === "rule"
      ? `rule, as its row says "${item.value}"`
      : `value ${shownValue(item.value)}`;
const settledWords = ({ by, on, ledger }) =>
  by ? `settled by ${by}${on ? ` on ${on}` : ""}` : `${ledger} names no one`;

function readReport(result) {
  const { first, candidates, left_out: leftOut, sheet } = result;
  const lines = [
    `first repository: ${first.repository} (${KIND_WORDS[first.kind]})${first.commit ? `, at ${first.commit.slice(0, 7)}` : ", not in git"}`,
  ];
  if (candidates.length === 0) {
    lines.push(
      "no answer of this repository is settled by a person, so no core can be built from it yet: a person settles its answers first (new, adopt, decide)",
    );
  } else {
    lines.push(`answers a person settled, which may go into the core: ${candidates.length}`);
    for (const item of candidates) {
      lines.push(
        `  ${item.start.padEnd(8)} ${item.id}: ${answerWords(item)}; ${item.check ? `held by ${item.check}` : "no check holds it"}; ${settledWords(item.origin)}${item.own ? `; not proposed: ${item.own}` : ""}`,
      );
    }
  }
  if (leftOut.length > 0) {
    lines.push(`left out: ${leftOut.length}`);
    for (const item of leftOut) lines.push(`  ${item.id}: ${item.why}`);
  }
  if (sheet.length > 0) {
    lines.push(
      `the lock-or-default sheet, ${sheet.length} questions in one sitting; a person answers them, then the core is built with --build:`,
    );
    sheet.forEach((question, index) => {
      lines.push(`  ${index + 1}. ${question.question}`);
      lines.push(`     recommended: ${question.recommendation}`);
      lines.push(`     because: ${question.basis}`);
      lines.push(`     written to: ${question.where}`);
      lines.push(`     if refused: ${question.if_refused}`);
    });
  }
  lines.push(`nothing was written, in ${first.repository} or anywhere`);
  return `${lines.join("\n")}\n`;
}

function buildReport(result) {
  const lines = [
    `family core${result.dry_run ? " (not written: --dry-run)" : ""}: ${result.family}, at ${result.core}`,
    `answers: ${result.answers.length}, read from ${result.first.repository}`,
    ...result.answers.map(
      (item) =>
        `  ${item.hold.padEnd(8)} ${item.id}: ${answerWords(item)}${item.origin.given ? " (given on the sheet)" : ""}; ${item.check ? `held by ${item.check}` : "no check holds it"}`,
    ),
    `${result.dry_run ? "would write" : "wrote"}:`,
    ...result.files.map((file) => `  ${file.change.padEnd(7)} ${file.path}`),
    `nothing was written in ${result.first.repository}; nothing was sent anywhere`,
  ];
  return `${lines.join("\n")}\n`;
}

function checkReport({ core, version, problems }) {
  if (problems.length === 0) return `family core at ${core}: its shape holds (shape ${version})\n`;
  return `${[`family core at ${core}: ${problems.length} problem(s)`, ...problems.map((line) => `  ${line}`)].join("\n")}\n`;
}

const USAGE =
  "usage: node core.mjs [--target DIR] [--family NAME] [--core DIR] [--json]\n" +
  "       node core.mjs --build --family NAME --core DIR --by NAME [--lock ID]... [--default ID]... [--value ID=VALUE]... [--on DATE] [--dry-run] [--target DIR] [--json]\n" +
  "       node core.mjs --check --core DIR [--json]\n" +
  "       node core.mjs --change ID --core DIR --by NAME --why TEXT [--value VALUE] [--hold locked|default] [--from DIR] [--on DATE] [--dry-run] [--json]\n";
const FLAGS = {
  "--family": "value",
  "--core": "value",
  "--build": "switch",
  "--check": "switch",
  "--lock": "names",
  "--default": "names",
  "--value": "list",
  "--by": "value",
  "--on": "value",
  "--dry-run": "switch",
  "--change": "value",
  "--hold": "value",
  "--from": "value",
  "--why": "value",
};
const BUILD_ONLY = ["--lock", "--default", "--value", "--by", "--on", "--dry-run"];
const CHANGE_ONLY = ["--hold", "--from", "--why"];
const blank = (value) => value === undefined || String(value).trim() === "";

async function main(args) {
  const call = readCall(args, FLAGS);
  if (call.problem) return refuse(call.problem, USAGE);
  if (call.help) return void stdout.write(USAGE);
  const { flags } = call;
  const core = flags["--core"] === undefined ? null : path.resolve(flags["--core"]);
  if (flags["--build"] && flags["--check"]) {
    return refuse("--build and --check are two calls; give one", USAGE);
  }
  if (flags["--change"] !== undefined) {
    if (flags["--build"] || flags["--check"]) {
      return refuse("--change is a call of its own; give one of --build, --check, --change", USAGE);
    }
    const strayBuild = ["--lock", "--default", "--family"].find((flag) => flag in flags);
    if (strayBuild) return refuse(`${strayBuild} is a flag of --build, not of --change`, USAGE);
    return changeCall(call, USAGE);
  }
  const strayChange = CHANGE_ONLY.find((flag) => flag in flags);
  if (strayChange) return refuse(`${strayChange} is a flag of --change`, USAGE);
  if (flags["--check"]) {
    if (!core) return refuse("say which core to check, with --core DIR", USAGE);
    const result = checkCore(core);
    return finish({
      json: call.json,
      result,
      text: checkReport(result),
      work: result.problems.length > 0,
    });
  }
  if (!flags["--build"]) {
    const stray = BUILD_ONLY.find((flag) => flag in flags);
    if (stray) return refuse(`${stray} is an answer of the sheet, given with --build`, USAGE);
    const family = blank(flags["--family"]) ? null : flags["--family"].trim();
    const result = readForCore(call.target, { family, core });
    return finish({
      json: call.json,
      result,
      text: readReport(result),
      work: result.sheet.length > 0,
    });
  }
  if (blank(flags["--family"])) return refuse("say the family's name, with --family NAME", USAGE);
  if (!core) return refuse("say where the core lives, with --core DIR", USAGE);
  if (blank(flags["--by"])) {
    return refuse(
      "say who answered the sheet, with --by NAME: nothing is locked without a person",
      USAGE,
    );
  }
  // A name, never an address: the core is the family's data and may be shared.
  for (const flag of ["--by", "--family"]) {
    if (ADDRESS.test(flags[flag])) {
      return refuse(
        `${flag} holds an e-mail address; a core keeps a person's name, never an address`,
        USAGE,
      );
    }
  }
  const values = {};
  for (const pair of flags["--value"] ?? []) {
    const at = pair.indexOf("=");
    const id = pair.slice(0, at).trim();
    if (at < 1 || id === "" || pair.slice(at + 1).trim() === "") {
      return refuse(`--value ${pair}: write it ID=VALUE, as --value record-panel=over`, USAGE);
    }
    if (id in values) return refuse(`--value ${id} is given twice`, USAGE);
    if (ADDRESS.test(pair)) return refuse(`--value ${id} holds an e-mail address`, USAGE);
    values[id] = pair.slice(at + 1);
  }
  const on = flags["--on"] ?? today();
  if (!isDay(on)) return refuse(`--on ${on} is not a day written YYYY-MM-DD`, USAGE);
  const result = buildCore(call.target, {
    family: flags["--family"].trim(),
    core,
    lock: flags["--lock"] ?? [],
    defaults: flags["--default"] ?? [],
    values,
    by: flags["--by"].trim(),
    on,
    dryRun: flags["--dry-run"] === true,
  });
  return finish({ json: call.json, result, text: buildReport(result), work: false });
}

await start(import.meta.url, main);
