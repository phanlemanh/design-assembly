// The moves of `core` by which a repository becomes a member of a family (spec 0016, slice 2 of item
// 7.1): it declares its family and pins the core (`--join`), with a copy of the core kept inside it
// and compared by hash; each answer it already holds is compared with the core's, and each that
// differs from a locked one becomes a question on the waiting list, nothing of the repository being
// written over; the answers to those questions are put into the ledger (`--settle`); the guide's
// blueprint takes what the core answers (`--inherit`); and the machine's list of cores is asked for
// the one question about a family (`--ask`), or told the repository is of none (`--decline`). No
// move calls a model or the network.
import { existsSync, readFileSync, realpathSync, statSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";
import path from "node:path";

import {
  CORE,
  COPIED_PARTS,
  corePartShapeProblems,
  familyCoreProblems,
  FAMILY_CORE_CHECK,
  memberFiles,
  memberValues,
  newerCoreParts,
  newerLedgers,
  PINNED_CORE,
  readPinnedCore,
  CORE_VALUES,
} from "../templates/tools/design-assembly/contract.mjs";
import {
  DESIGN_MD,
  EXPORTS_DECISION,
  exportsName,
  readInputs,
  stampIn,
  stampOf,
  SYSTEM_FOLDER,
  SYSTEM_PARTS,
} from "../templates/tools/design-assembly/exports.mjs";
import { lineWidth, renderJson } from "../templates/tools/design-assembly/json.mjs";
import { LEDGER } from "../templates/tools/design-assembly/ledger.mjs";
import { CORE_ID, CORE_KIND } from "../templates/tools/design-assembly/sources-ledger.mjs";
import { readWaiting } from "../templates/tools/design-assembly/waiting.mjs";
import { writeFiles, writtenFiles } from "./apply.mjs";
import { changeOf, Refusal } from "./command.mjs";
import { addLine, familyQuestion, homeOf, readList } from "./core-list.mjs";
import { guideQuestions, markLedger, readMember, settledWords, stateOf } from "./core-marks.mjs";
import { askAll } from "./queue.mjs";

const WIDTH = 100;
const THEME = "design/theme.json";
const BLUEPRINT = "design/blueprint.json";
const TOOL_CONTRACT = "tools/design-assembly/contract.mjs";
// The reason a default of the core the repository held otherwise before it joined is recorded with.
const BEFORE_JOINING = "the repository's own answer from before it joined the family";
// The question about a locked answer the repository holds otherwise names the answer and the pin.
const QUESTION_PREFIX = "core-";
export const questionId = (id, pin) => `${QUESTION_PREFIX}${id}-${pin}`;

const read = (root, file) =>
  existsSync(path.join(root, file)) ? readFileSync(path.join(root, file), "utf8") : null;
const sha256 = (text) => createHash("sha256").update(text).digest("hex");
const shown = (value) => (typeof value === "string" ? value : JSON.stringify(value));

// Whether one folder is the other or lies inside it, by real paths.
function within(inner, outer) {
  const relative = path.relative(realpathSync(outer), realpathSync(inner));
  return relative === "" || (!relative.startsWith("..") && !path.isAbsolute(relative));
}

// A core folder read for a repository to pin: each part as its text, the declaration as data.
// Refused when the folder is not a core, holds a part of a newer shape, or a part of a wrong shape.
function readCoreFolder(core) {
  if (!existsSync(core) || !statSync(core).isDirectory()) {
    throw new Refusal(`${core} is not a folder. Nothing was written`);
  }
  const newer = newerCoreParts(core);
  if (newer.length > 0) throw new Refusal(`${newer.join("; ")}. Nothing was written`);
  const problems = familyCoreProblems(core);
  if (problems.length > 0) {
    throw new Refusal(
      `${core} is not a family core whose shape holds: ${problems.slice(0, 3).join("; ")}. Nothing was written`,
    );
  }
  const texts = Object.fromEntries(
    COPIED_PARTS.map((part) => {
      const file = CORE.parts[part].file;
      return [file, readFileSync(path.join(core, file), "utf8")];
    }),
  );
  return {
    texts,
    declaration: JSON.parse(texts[CORE.parts.declaration.file]),
    answers: JSON.parse(texts[CORE.parts.answers.file]).answers,
  };
}

// The exceptions and the follows the owner answered on the waiting list, by the id of the answer,
// for the questions about this pin: a refusal with its words is an exception with its reason; a
// keep is a follow, which the repository carries out itself.
function answeredOf(root, pin, answers) {
  let waiting;
  try {
    waiting = readWaiting(root);
  } catch {
    return { exceptions: {}, follows: {}, unreasoned: {}, waits: {} };
  }
  const found = { exceptions: {}, follows: {}, unreasoned: {}, waits: {} };
  for (const answer of answers) {
    const row = (waiting?.rows ?? []).find((item) => item.id === questionId(answer.id, pin));
    if (!row) continue;
    if (!row.answer) found.waits[answer.id] = row.id;
    else if (row.answer === "refuse" && row.said) {
      found.exceptions[answer.id] = { why: row.said, by: row.by, on: row.on };
    } else if (row.answer === "refuse") found.unreasoned[answer.id] = row;
    else found.follows[answer.id] = row;
  }
  return found;
}

// The question for a locked answer the repository holds otherwise: follow the core, or keep its
// own as an exception with a reason.
function askOfDiffering(answer, held, pin) {
  return {
    id: questionId(answer.id, pin),
    question: `${answer.question} The family core this repository joined locks ${shown(answer.value)} (${settledWords(answer)}); this repository holds ${shown(held.value)} in ${held.from}. Follow the core, or keep this repository's answer as an exception?`,
    recommendation: `Follow the core: change ${held.from} to ${shown(answer.value)}. Answer keep to follow it; answer refuse, with the reason, to keep this repository's answer as an exception`,
    basis:
      "A locked answer is one every repository of the family keeps as it is; the repository wins only by an exception with a reason, which the gate then holds. Nothing of the repository is changed before the answer.",
    hard_to_undo: false,
  };
}

// The answers of the core put into a repository's ledger, the questions for the locked answers it
// holds otherwise, and where each answer stands. `reasons` and `exceptions` are given now, by id.
function holdAnswers(root, pinned, { on, reasons = {}, exceptions = {}, ask = true }) {
  const values = memberValues(pinned, memberFiles(root));
  const answered = answeredOf(root, pinned.label, pinned.answers);
  const given = { reasons, exceptions: { ...answered.exceptions, ...exceptions } };
  const files = {};
  const text = read(root, LEDGER);
  let states;
  if (text === null) {
    // Without a ledger no row is marked; where each answer stands is read the same way.
    states = pinned.answers.map((answer) => ({
      id: answer.id,
      ...stateOf(answer, pinned, values[answer.id], null, given),
    }));
  } else {
    const marked = markLedger(text, pinned, values, given);
    if (marked.text !== text) files[LEDGER] = marked.text;
    states = marked.states.map((item) => ({ ...item, added: marked.added.includes(item.id) }));
  }
  const differing = pinned.answers.filter(
    (answer) => states.find((item) => item.id === answer.id)?.state === "differs",
  );
  const asks = differing.map((answer) =>
    answered.waits[answer.id] || answered.follows[answer.id] || answered.unreasoned[answer.id]
      ? null
      : askOfDiffering(answer, values[answer.id], pinned.label),
  );
  let queued = [];
  if (ask && asks.some(Boolean)) {
    const made = askAll(root, asks, { on, who: "core" });
    Object.assign(files, made.files);
    queued = made.queued;
  }
  const report = pinned.answers.map((answer) => {
    const item = states.find((one) => one.id === answer.id);
    const index = differing.indexOf(answer);
    return {
      id: answer.id,
      hold: answer.hold,
      kind: answer.kind,
      value: answer.value,
      state: item.state,
      held_here: values[answer.id]?.value,
      ...(item.added ? { row: "added" } : {}),
      settled: settledWords(answer),
      ...(index === -1
        ? {}
        : {
            question:
              queued[index]?.id ??
              queued[index]?.waits ??
              answered.waits[answer.id] ??
              answered.follows[answer.id]?.id ??
              answered.unreasoned[answer.id]?.id ??
              null,
            answered: answered.follows[answer.id]
              ? "follow"
              : answered.unreasoned[answer.id]
                ? "refused with no reason"
                : null,
          }),
    };
  });
  return { files, answers: report };
}

// The exports a repository keeps that a move leaves behind the ledgers they are written from, with
// the command that writes them again: the files a move writes (`files`) are read in place of what
// is on disk. Null where the repository keeps no exports, or every one is as the ledgers give.
// The exports are never written here: writing them is the repository's own step.
export function exportsBehind(root, files = {}) {
  let theme;
  try {
    theme = JSON.parse((THEME in files ? files[THEME] : read(root, THEME)) ?? "null");
  } catch {
    return null;
  }
  if (exportsName(theme) === null) return null;
  const stamp = stampOf(readInputs(root, files));
  const behind = [DESIGN_MD, ...SYSTEM_PARTS.map((part) => `${SYSTEM_FOLDER}/${part}`)].filter(
    (file) => {
      const text = file in files ? files[file] : read(root, file);
      return text !== null && stampIn(text) !== stamp;
    },
  );
  return behind.length === 0
    ? null
    : { behind, stamp, row: EXPORTS_DECISION, command: "make design-exports" };
}

// The theme with the check of locked answers laid under `ledger-shapes`, or why it is not: a
// repository with no gate of this plugin's has nothing to lay it in, and a tool copied in before the
// check existed would read it as unknown.
function laidCheck(root) {
  const text = read(root, THEME);
  if (text === null)
    return { laid: "no", why: `${THEME} is not there: adopt or the guide lays it` };
  let theme;
  try {
    theme = JSON.parse(text);
  } catch {
    return { laid: "no", why: `${THEME} is not valid JSON` };
  }
  const shapes = theme?.checks?.["ledger-shapes"];
  if (!Array.isArray(shapes)) {
    return { laid: "no", why: "the ledger has no row ledger-shapes: adopt or the guide lays it" };
  }
  if (shapes.some((check) => check?.kind === FAMILY_CORE_CHECK.kind)) return { laid: "already" };
  if (!(read(root, TOOL_CONTRACT) ?? "").includes("FAMILY_CORE_CHECK")) {
    return {
      laid: "no",
      why: `the tool of this repository is older than the check of locked answers: bring it up with upgrade, which lays the check`,
    };
  }
  const checks = { ...theme.checks, "ledger-shapes": [...shapes, FAMILY_CORE_CHECK] };
  return { laid: "now", text: renderJson({ ...theme, checks }, lineWidth(root)) };
}

// Declares the repository's family and pins the core: the row of the sources ledger, the copy of
// the core and its hashes; then compares each answer the repository holds with the core's. The
// core's list of members gains the repository, said before it is written, and only where the core
// folder can be written. The machine's list of cores gains the core.
export function joinCore(root, { core, by, on, dryRun }) {
  const newer = newerLedgers(root);
  if (newer.length > 0) throw new Refusal(`${newer.join("; ")}. Nothing was written`);
  const folder = realpathSync(core);
  const home = homeOf(root);
  if (within(folder, root) || within(root, folder) || within(folder, home)) {
    throw new Refusal(
      `${folder} and this repository lie one inside the other: the core is a folder of its own, outside every repository of the family. Nothing was written`,
    );
  }
  const read0 = readCoreFolder(folder);
  const { declaration } = read0;
  const before = readPinnedCore(root);
  if (before?.family && before.family !== declaration.family) {
    throw new Refusal(
      `this repository declares the family ${before.family} already, and ${folder} is the core of ${declaration.family}: a repository is of one family, and leaving one is not built yet. Nothing was written`,
    );
  }
  const repository = path.basename(home);
  const answersText = read0.texts[CORE.parts.answers.file];
  const pin = sha256(answersText).slice(0, 12);
  const was = declaration.members.find((member) => member.repository === repository);
  const member = { repository, joined: was?.joined ?? on, pin };
  const declared = {
    ...declaration,
    members: [...declaration.members.filter((item) => item.repository !== repository), member],
  };
  const problems = corePartShapeProblems("declaration", declared, CORE.parts.declaration.file);
  if (problems.length > 0) throw new Refusal(`${problems.join("; ")}. Nothing was written`);
  const copy = {
    [CORE.parts.declaration.file]: renderJson(declared, WIDTH),
    [CORE.parts.answers.file]: answersText,
    [CORE.parts.blocks.file]: read0.texts[CORE.parts.blocks.file],
  };
  const source = {
    version: 1,
    id: CORE_ID,
    kind: CORE_KIND,
    title: declaration.family,
    family: declaration.family,
    snapshot: PINNED_CORE.snapshot,
    // The copy's list of blocks: a tool older than the kind reads the row as a library that offers
    // nothing, and holds its shape.
    catalog: path.posix.join(PINNED_CORE.snapshot, CORE.parts.blocks.file),
    pin: {
      files: Object.entries(copy).map(([file, text]) => ({ file, sha256: sha256(text) })),
      taken_on: on,
    },
    joined: before?.joined?.by ? before.joined : { by, on },
  };
  const files = {
    [PINNED_CORE.file]: renderJson(source, lineWidth(root)),
    ...Object.fromEntries(
      Object.entries(copy).map(([file, text]) => [
        path.posix.join(PINNED_CORE.snapshot, file),
        text,
      ]),
    ),
  };
  const pinned = {
    family: declaration.family,
    label: pin,
    answers: read0.answers,
  };
  const held = holdAnswers(root, pinned, {
    on,
    // A default the repository held otherwise before it joined keeps that answer, and says so.
    reasons: Object.fromEntries(
      read0.answers
        .filter((answer) => answer.hold === "default")
        .map((answer) => [answer.id, { why: BEFORE_JOINING, by, on }]),
    ),
  });
  Object.assign(files, held.files);
  const check = laidCheck(root);
  if (check.laid === "now") files[THEME] = check.text;
  const exports = exportsBehind(root, files);
  const written = writeFiles(root, files, dryRun);
  // The core's list of members: said first, then written, only where the folder can be written.
  const coreFile = path.join(folder, CORE.parts.declaration.file);
  const coreWrite = {
    file: coreFile,
    says: `${repository} ${was ? "pins again" : "joins"} on ${on}, at pin ${pin}`,
    change: changeOf(root, coreFile).change,
    written: false,
    why: null,
  };
  if (!dryRun && copy[CORE.parts.declaration.file] !== read0.texts[CORE.parts.declaration.file]) {
    try {
      writeFileSync(coreFile, copy[CORE.parts.declaration.file]);
      coreWrite.written = true;
    } catch (error) {
      coreWrite.why = `${error.message.split("\n")[0]}: the core's list of members is left as it was; run this again where the core can be written`;
    }
  }
  const list = addLine({ family: declaration.family, path: folder, on, how: "pinned" }, { dryRun });
  return {
    repository,
    family: declaration.family,
    core: folder,
    pin,
    again: Boolean(was || before),
    answers: held.answers,
    check,
    core_file: coreWrite,
    list,
    exports,
    files: writtenFiles(written),
    written,
    dry_run: dryRun,
  };
}

// Puts the owner's answers about the locked answers the repository holds otherwise into its ledger:
// a follow once the repository holds the core's answer; an exception with its reason. A reason may
// also be given here, `why` by id, for an exception or for a default the repository changed. A
// locked answer that differs and has no question yet is asked.
export function settleCore(root, { by, on, why = {}, dryRun }) {
  const member = readMember(root);
  if (member === null) {
    throw new Refusal("this repository declares no family: join one first with core --join");
  }
  if (member.pinned.unreadable) {
    throw new Refusal(
      `the copy of the family core here cannot be read (${member.pinned.unreadable}): pin it again with core --join. Nothing was written`,
    );
  }
  const { pinned } = member;
  const given = { reasons: {}, exceptions: {} };
  for (const [id, text] of Object.entries(why)) {
    const answer = pinned.answers.find((item) => item.id === id);
    if (!answer)
      throw new Refusal(`--why ${id}: the core this repository pinned has no answer ${id}`);
    const entry = { why: text, by, on };
    if (answer.hold === "locked") given.exceptions[id] = entry;
    else given.reasons[id] = entry;
  }
  const held = holdAnswers(root, pinned, { on, ...given });
  const exports = Object.keys(held.files).length > 0 ? exportsBehind(root, held.files) : null;
  const written = writeFiles(root, held.files, dryRun);
  return {
    family: pinned.family,
    pin: pinned.label,
    answers: held.answers,
    exports,
    files: writtenFiles(written),
    written,
    dry_run: dryRun,
  };
}

// The choice of the blueprint an answer of the core is, as the blueprint writes it.
function choiceOf(id, value) {
  if (id === "type-scale-values") {
    const ratio = /^modular (\S+)$/.exec(String(value))?.[1];
    return ratio ? { type_scale: "modular", type_ratio: ratio } : { type_scale: String(value) };
  }
  return { [CORE_VALUES[id].key]: value };
}

// The guide's blueprint with what the core answers: a choice the blueprint does not hold yet takes
// the core's answer, and says it is inherited, from which pin and whether locked; one it holds the
// same is marked so; one it holds otherwise is left as it is and said. The questions of the guide,
// each with whether it is still asked. The blueprint is the guide's file: it must be there.
export function inheritCore(root, { dryRun }) {
  const member = readMember(root);
  if (member === null) {
    throw new Refusal("this repository declares no family: the guide asks every question");
  }
  if (member.pinned.unreadable) {
    throw new Refusal(
      `the copy of the family core here cannot be read (${member.pinned.unreadable}): the repository inherits nothing, and the guide asks every question. Pin it again with core --join`,
    );
  }
  const text = read(root, BLUEPRINT);
  if (text === null) {
    throw new Refusal(
      `${BLUEPRINT} is not there: write it in the shape the guide's first step gives, then run this again`,
    );
  }
  let blueprint;
  try {
    blueprint = JSON.parse(text);
  } catch {
    throw new Refusal(`${BLUEPRINT} is not valid JSON`);
  }
  const { pinned } = member;
  const layers = { ...blueprint.layers };
  const filled = [];
  const conflicts = [];
  for (const answer of pinned.answers) {
    const place = CORE_VALUES[answer.id];
    if (!place?.layer || answer.kind !== "value") continue;
    const entry = { ...layers[place.layer] };
    const wanted = choiceOf(answer.id, answer.value);
    const choice = { ...entry.choice };
    const holds = Object.hasOwn(choice, place.key);
    const same = Object.entries(wanted).every(([key, value]) => choice[key] === value);
    if (holds && !same) {
      conflicts.push({
        id: answer.id,
        hold: answer.hold,
        core: answer.value,
        blueprint: choice[place.key],
        why:
          answer.hold === "locked"
            ? "a locked answer: write the core's answer, or keep yours as an exception with its reason (core --settle --why)"
            : `a default the blueprint changed: say why under changed.${place.key}, with why, by and on`,
      });
      continue;
    }
    entry.choice = { ...choice, ...wanted };
    entry.inherited = {
      ...entry.inherited,
      ...Object.fromEntries(
        Object.keys(wanted).map((key) => [key, { pin: pinned.label, hold: answer.hold }]),
      ),
    };
    // A layer whose every choice the core answered is decided: nothing of it is asked.
    const layer = place.layer;
    const keys = Object.values(CORE_VALUES)
      .filter((item) => item.layer === layer)
      .map((item) => item.key);
    if (
      layer === "patterns" &&
      entry.status !== "decided" &&
      keys.every((key) => key in entry.choice)
    ) {
      Object.assign(entry, {
        status: "decided",
        source: "user",
        why: `Inherited from the family core at ${pinned.label}: ${settledWords(answer)}.`,
        rejected: entry.rejected ?? [],
      });
    }
    layers[place.layer] = entry;
    filled.push({
      id: answer.id,
      hold: answer.hold,
      value: answer.value,
      settled: settledWords(answer),
    });
  }
  const files = { [BLUEPRINT]: renderJson({ ...blueprint, layers }, lineWidth(root)) };
  const exports = exportsBehind(root, files);
  const written = writeFiles(root, files, dryRun);
  const questions = guideQuestions(pinned);
  return {
    family: pinned.family,
    pin: pinned.label,
    filled,
    conflicts,
    questions,
    asked: questions.filter((item) => item.state === "asked").length,
    exports,
    files: writtenFiles(written),
    written,
    dry_run: dryRun,
  };
}

// The one question about a family a repository is asked, or why none is.
export const askFamily = (root) => familyQuestion(root);

// Records on this machine that the repository is of no family listed here: it is not asked again.
// Nothing is written in the repository.
export function declineFamily(root, { on, dryRun }) {
  const list = readList();
  if (list.problem) {
    throw new Refusal(`${list.problem}: the list was left as it is. Nothing was written`);
  }
  const repository = homeOf(root);
  const line = addLine({ repository, on }, { dryRun });
  if (line.why) throw new Refusal(`${line.why}. Nothing was written`);
  return { repository, list: line.file, written: line.written, dry_run: dryRun };
}
