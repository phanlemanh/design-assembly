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
  coreBlockFile,
  coreMarkOf,
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
import { LEDGER, parseLedger } from "../templates/tools/design-assembly/ledger.mjs";
import { CORE_ID, CORE_KIND } from "../templates/tools/design-assembly/sources-ledger.mjs";
import { readWaiting, WAITING_LIST } from "../templates/tools/design-assembly/waiting.mjs";
import { writeFiles, writtenFiles } from "./apply.mjs";
import { changeOf, Refusal } from "./command.mjs";
import { addLine, familyQuestion, homeOf, readList } from "./core-list.mjs";
import { guideQuestions, markLedger, readMember, settledWords, stateOf } from "./core-marks.mjs";
import { coreQuestionId } from "./core-moved.mjs";
import { retiredIn } from "./core-records.mjs";
import { planReport, plans, reportTexts, writePlan } from "./core-report.mjs";
import { acceptRetired } from "./core-retire.mjs";
import { askAll } from "./queue.mjs";

const WIDTH = 100;
const THEME = "design/theme.json";
const BLUEPRINT = "design/blueprint.json";
const TOOL_CONTRACT = "tools/design-assembly/contract.mjs";
// The reason a default of the core the repository held otherwise before it joined is recorded with.
const BEFORE_JOINING = "the repository's own answer from before it joined the family";
// The question about a locked answer the repository holds otherwise names the answer and the pin.
export const questionId = coreQuestionId;

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
  // The files of every block, each where the core keeps it: the shape check above held each to
  // its hash, and to being text.
  const blockFiles = Object.fromEntries(
    JSON.parse(texts[CORE.parts.blocks.file]).blocks.flatMap((block) =>
      block.files.map(({ file }) => {
        const kept = coreBlockFile(block.need, file);
        return [kept, readFileSync(path.join(core, kept), "utf8")];
      }),
    ),
  );
  return {
    texts,
    blockFiles,
    declaration: JSON.parse(texts[CORE.parts.declaration.file]),
    answers: JSON.parse(texts[CORE.parts.answers.file]).answers,
  };
}

// The exceptions and the follows the owner answered on the waiting list, by the id of the answer,
// for the questions about this pin: a refusal with its words is an exception with its reason; a
// keep is a follow, which the repository carries out itself.
export function answeredOf(root, pin, answers) {
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

// The reason each default of a core is recorded with where the repository held it otherwise before
// it joined: its own answer stays, under the name of the person who said it is of the family.
export const reasonsBeforeJoining = (answers, { by, on }) =>
  Object.fromEntries(
    answers
      .filter((answer) => answer.hold === "default")
      .map((answer) => [answer.id, { why: BEFORE_JOINING, by, on }]),
  );

// The answers of the core put into a repository's ledger, the questions for the locked answers it
// holds otherwise, and where each answer stands. `reasons` and `exceptions` are given now, by id.
// `pending` has the texts a command is about to write, read in place of what is on disk: the
// ledger and the files a value is read from, so a command that lays them asks in the same run;
// `who` is the command that asks, as a refusal names it.
export function holdAnswers(
  root,
  pinned,
  { on, reasons = {}, exceptions = {}, ask = true, pending = {}, who = "core" },
) {
  const values = memberValues(pinned, memberFiles(root, pending));
  const answered = answeredOf(root, pinned.label, pinned.answers);
  const given = { reasons, exceptions: { ...answered.exceptions, ...exceptions } };
  const files = {};
  const text = pending[LEDGER] ?? read(root, LEDGER);
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
    const made = askAll(root, asks, { on, who });
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
  // The questions this very call makes, by the id of the answer: the file each goes to.
  const asked = Object.fromEntries(
    differing
      .map((answer, index) => [answer.id, queued[index]?.file])
      .filter(([, file]) => Boolean(file)),
  );
  return { files, answers: report, asked };
}

// The questions about this pin that still wait although their answer is recorded: a locked answer
// the repository keeps as an exception, with the reason a person gave in the session. Each is
// answered as the decision sheet would write it, a refusal with the reason, the name and the day
// the row's note holds, so nothing waits on the owner that the owner already said. `ledger` is the
// text of the ledger as it is about to be written.
function closeAnswered(root, pinned, ledger) {
  const none = { files: {}, closed: [] };
  let waiting;
  try {
    waiting = readWaiting(root);
  } catch {
    return none;
  }
  if (!waiting || ledger === null) return none;
  const rows = parseLedger(ledger);
  const closed = [];
  const answered = waiting.rows.map((row) => {
    const answer = pinned.answers.find((item) => questionId(item.id, pinned.label) === row.id);
    if (!answer || row.answer || row.kind === "permission") return row;
    const mark = coreMarkOf(rows.find((item) => String(item.id) === answer.id)?.note);
    if (mark.mark !== "kept" || mark.pin !== pinned.label || !mark.why) return row;
    closed.push(row.id);
    return { ...row, answer: "refuse", said: mark.why, by: mark.by, on: mark.on };
  });
  if (closed.length === 0) return none;
  const width = lineWidth(root);
  const files =
    waiting.shape === "folder"
      ? Object.fromEntries(
          closed.map((id) => [
            waiting.files[id],
            renderJson(
              answered.find((row) => row.id === id),
              width,
            ),
          ]),
        )
      : { [WAITING_LIST]: renderJson({ ...waiting.list, rows: answered }, width) };
  return { files, closed };
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
      `this repository declares the family ${before.family} already, and ${folder} is the core of ${declaration.family}: a repository is of one family: leave the one it is of first, with core --leave. Nothing was written`,
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
  // The repository's report to the core (slice 2 of item 7.2): what its intake ledger tells now,
  // written with the member's line, and the store's entries that follow the uses it tells. A
  // report that would not hold the core's shape is not written, and the repository joins all the
  // same.
  const plan = planReport(root, folder);
  const tells = plan.problems.length === 0;
  const reports = {
    ...reportTexts(folder),
    ...(tells && plan.text !== null ? { [plan.file]: plan.text } : {}),
  };
  const copy = {
    [CORE.parts.declaration.file]: renderJson(declared, WIDTH),
    [CORE.parts.answers.file]: answersText,
    [CORE.parts.blocks.file]:
      tells && plan.index ? plan.index.text : read0.texts[CORE.parts.blocks.file],
    // What a member takes a block from: the files of every block, so that a block is taken on
    // any machine, at the pin, with the core out of reach (slice 1 of item 7.2).
    ...read0.blockFiles,
    // What every repository of the family told the core it answered, names only: find and intake
    // read these from the copy, the same on every machine.
    ...reports,
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
    reasons: reasonsBeforeJoining(read0.answers, { by, on }),
  });
  Object.assign(files, held.files);
  // Pinned again: what the core retired since the earlier pin is accepted with it, and becomes the
  // repository's own as on `core --accept` (slice 3 of item 7.2).
  const turned =
    before && !before.unreadable
      ? acceptRetired(root, {
          answerIds: before.answers
            .filter((answer) => !read0.answers.some((now) => now.id === answer.id))
            .map((answer) => answer.id),
          blockNeeds: (before.blocks ?? [])
            .filter(
              (block) =>
                !JSON.parse(read0.texts[CORE.parts.blocks.file]).blocks.some(
                  (now) => now.need === block.need,
                ),
            )
            .map((block) => block.need),
          answers: before.answers,
          records: retiredIn(folder),
          on,
          files,
        })
      : { files: {}, turned: { rows: [], choices: [], blocks: [], not_taken_in: [] } };
  Object.assign(files, turned.files);
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
  // The report: said first with the member's line, then written, the store's entries before it.
  const coreReport = {
    file: path.join(folder, plan.file),
    index: path.join(folder, CORE.parts.blocks.file),
    change: tells ? plan.change : "none",
    text: tells ? plan.text : null,
    needs: plan.data.needs.length,
    uses: (plan.data.uses ?? []).length,
    used: tells ? (plan.index?.used ?? []) : [],
    left_out: plan.left_out,
    written: false,
    why: tells
      ? null
      : `the report would not hold the core's shape (${plan.problems.join("; ")}), so it was not written: the repository joins all the same`,
  };
  // A ledger that tells nothing leaves a report the core holds as it is: said only then.
  if (plan.kept) coreReport.unread = plan.why;
  // The report goes with the member's line: where that line could not be written, the core would
  // hold a report of a repository its declaration does not name.
  if (coreWrite.why) {
    coreReport.why = "the member's line was not written, so the report was not either";
  } else if (!dryRun && tells && plans(plan)) {
    try {
      writePlan(folder, plan);
      coreReport.written = true;
    } catch (error) {
      coreReport.why = `${error.message.split("\n")[0]}: the report is left as it was; run core --report where the core can be written`;
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
    turned: turned.turned,
    check,
    core_file: coreWrite,
    core_report: coreReport,
    copied_reports: Object.keys(reports).length,
    list,
    exports,
    // The code the copy holds since slice 1 of item 7.2: the files of the blocks, when any.
    copied_blocks: {
      blocks: new Set(Object.keys(read0.blockFiles).map((file) => file.split("/")[1])).size,
      files: Object.keys(read0.blockFiles).length,
      folder: path.posix.join(PINNED_CORE.snapshot, CORE.parts.blocks.folder),
    },
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
  // A question the person answered here, with the reason, is closed with that answer.
  const answered = closeAnswered(root, pinned, held.files[LEDGER] ?? read(root, LEDGER));
  Object.assign(held.files, answered.files);
  const exports = Object.keys(held.files).length > 0 ? exportsBehind(root, held.files) : null;
  const written = writeFiles(root, held.files, dryRun);
  return {
    family: pinned.family,
    pin: pinned.label,
    answers: held.answers,
    closed: answered.closed,
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
    // A choice inherited again is no longer the repository's own from a family it left.
    if (entry.own) {
      entry.own = Object.fromEntries(
        Object.entries(entry.own).filter(([key]) => !Object.hasOwn(wanted, key)),
      );
      if (Object.keys(entry.own).length === 0) delete entry.own;
    }
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
