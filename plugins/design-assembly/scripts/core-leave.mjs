// The move of `core` by which a repository leaves its family (spec 0016, criterion 25, the second
// half of slice 4 of item 7.1). It undoes, in order, each thing joining wrote: the declaration and
// the copy of the core are removed; each row of the decision ledger that carried a mark of the core
// says the answer is the repository's own since that day, and keeps the mark it carried; the
// blueprint's marks are turned the same way; the gate's check of locked answers is taken off; the
// questions about the core that wait on the owner are taken off the waiting list; the core's list
// of members loses the repository, only where the core folder can be reached; and the machine's
// list records that the repository left, so it is not asked at once whether it is of a family. No
// value of the repository changes. The move calls no model and no network.
import {
  existsSync,
  readdirSync,
  readFileSync,
  rmdirSync,
  statSync,
  unlinkSync,
  writeFileSync,
} from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  CORE,
  COPIED_PARTS,
  CORE_VALUES,
  coreMarkOf,
  corePartShapeProblems,
  familyCoreProblems,
  FAMILY_CORE_CHECK,
  leftMarkText,
  newerCoreParts,
  newerLedgers,
  PINNED_CORE,
  readPinnedCore,
} from "../templates/tools/design-assembly/contract.mjs";
import { lineWidth, renderJson } from "../templates/tools/design-assembly/json.mjs";
import { LEDGER, parseLedger } from "../templates/tools/design-assembly/ledger.mjs";
import { CORE_ID, isCoreSource } from "../templates/tools/design-assembly/sources-ledger.mjs";
import { readWaiting, WAITING_LIST } from "../templates/tools/design-assembly/waiting.mjs";
import { writeFiles, writtenFiles } from "./apply.mjs";
import { fileChange, Refusal } from "./command.mjs";
import { exportsBehind } from "./core-join.mjs";
import { addLine, coreProblem, homeOf, readList } from "./core-list.mjs";
import { setNote } from "./core-marks.mjs";
import { reportFileOf } from "./core-report.mjs";
import { readIntake, readTheme, text as words } from "./store.mjs";

const PLUGIN = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const CHOICES = Object.fromEntries(
  JSON.parse(readFileSync(path.join(PLUGIN, "references/layers.json"), "utf8")).layers.map(
    (layer) => [layer.id, (layer.choices ?? []).map((choice) => choice.key)],
  ),
);
const WIDTH = 100;
const THEME = "design/theme.json";
const BLUEPRINT = "design/blueprint.json";
const SHAPES_ROW = "ledger-shapes";
// A question about a core names an answer and a pin: every one of them, of whatever pin.
const CORE_QUESTION = /^core-.+-[0-9a-f]{12}$/;
// What the source of a row says once the copy that alone held its value could not be read.
const VALUE_NOT_KEPT =
  "not kept: the copy of the family core that held this value could not be read when the repository left";
// How the machine's list records a repository that left a family.
export const LEFT = "left";

const read = (root, file) =>
  existsSync(path.join(root, file)) ? readFileSync(path.join(root, file), "utf8") : null;
const isMap = (value) => value !== null && typeof value === "object" && !Array.isArray(value);
const shown = (value) => (typeof value === "string" ? value : JSON.stringify(value));
// Words as a note of the ledger can keep them: the readers of the ledger undo no escape, so no
// double quote and no backslash; and one line.
const clean = (text) =>
  String(text).replace(/"/g, "'").replace(/\\/g, "/").replace(/\s+/g, " ").trim();

// What the declaration says, read for leaving: the family, the pin and the files of the copy, each
// as far as the file gives it. A declaration that is not valid JSON gives none of them. Null when
// the repository declares no family: no file, or a library someone named `core`.
function declarationOf(root) {
  const text = read(root, PINNED_CORE.file);
  if (text === null) return null;
  let source;
  try {
    source = JSON.parse(text);
  } catch {
    return { family: null, pin: null, files: [] };
  }
  if (!isCoreSource(source)) return null;
  const listed = Array.isArray(source.pin?.files) ? source.pin.files : [];
  const hash = listed.find((entry) => entry?.file === CORE.parts.answers.file)?.sha256;
  return {
    family: typeof source.family === "string" && source.family.trim() !== "" ? source.family : null,
    pin: /^[0-9a-f]{64}$/.test(String(hash)) ? hash.slice(0, 12) : null,
    files: listed.map((entry) => entry?.file).filter((file) => typeof file === "string"),
  };
}

// Sets one field of one row of the ledger and changes nothing else of the file.
export function setField(text, id, key, value) {
  const lines = text.split("\n");
  const isRow = (line) => /^\s*-\s+id:/.test(line);
  const idOf = (line) =>
    /^\s*-\s+id:\s*(.*)$/
      .exec(line)[1]
      .trim()
      .replace(/^(["'])(.*)\1$/, "$2");
  const start = lines.findIndex((line) => isRow(line) && idOf(line) === id);
  if (start === -1) return text;
  let end = lines.findIndex((line, index) => index > start && isRow(line));
  if (end === -1) end = lines.length;
  const field = new RegExp(`^(\\s*${key}:\\s*)`);
  const at = lines.findIndex((line, index) => index > start && index < end && field.test(line));
  if (at === -1) return text;
  lines[at] = `${field.exec(lines[at])[1]}${JSON.stringify(value)}`;
  return lines.join("\n");
}

// The ledger with every mark of the core turned: the row says the answer is the repository's own
// since `on`, who said the repository leaves and why, and the mark it carried. The rest of each
// note stays. A row whose value only the copy of the core held (its source is the declaration)
// keeps the value as its source. Gives the text and what was turned, row by row.
// `only`, when given, names the rows turned (the answers the family core retired, criterion 24), and
// `how` says why the answer is the repository's own: it left its family, or the core retired it.
export function turnLedger(text, { on, by, why, answers, only = null, how = "left" }) {
  let out = text;
  const rows = [];
  for (const row of parseLedger(text)) {
    const found = coreMarkOf(row.note);
    if (!found.mark) continue;
    const id = String(row.id);
    if (only && !only.includes(id)) continue;
    const once = { mark: found.mark, pin: found.pin, why: found.why, by: found.by, on: found.on };
    const head = leftMarkText({ since: on, why: clean(why), by, once, how });
    out = setNote(out, id, [head, found.rest].filter((part) => part !== "").join("; "));
    const turned = { id, once: found.mark, pin: found.pin };
    if (String(row.source ?? "") === PINNED_CORE.file) {
      const answer = answers?.find((item) => item.id === id);
      const kept = answer ? clean(shown(answer.value)) : VALUE_NOT_KEPT;
      out = setField(out, id, "source", kept);
      Object.assign(turned, answer ? { value_kept: kept } : { value_lost: true });
    }
    rows.push(turned);
  }
  return { text: out, rows };
}

// Who settled the answer a choice of the blueprint was inherited from: the family's owner, as the
// core recorded it; the person leaving, where the copy could not be read.
function settlerOf(layer, key, answers, fallback) {
  const id = Object.entries(CORE_VALUES).find(
    ([, place]) => place.layer === layer && (place.key === key || place.ratio === key),
  )?.[0];
  const answer = answers?.find((item) => item.id === id);
  return answer?.by && answer?.on ? { by: answer.by, on: answer.on } : fallback;
}

// The blueprint with its marks of the core turned the same way: under `own`, by choice key, since
// when the choice is the repository's own, who said the repository leaves and why, and what the
// choice once was, inherited (with the pin and the hold) or a default changed (with its reason).
// A choice once inherited stays a person's answer: it is listed under `confirmed`, with who
// settled it, so the guide does not write it again as its own proposal. No choice changes.
// `only`, when given, names the choices turned, each as `<layer>.<key>`; the others keep their marks.
// `how` is said under each entry turned when the core retired the answer.
export function turnBlueprint(blueprint, { on, by, why, pin, answers, only = null, how = "left" }) {
  const layers = {};
  const turned = [];
  for (const [id, whole] of Object.entries(blueprint.layers ?? {})) {
    if (!isMap(whole) || (!isMap(whole.inherited) && !isMap(whole.changed))) {
      layers[id] = whole;
      continue;
    }
    const picked = (marks) =>
      Object.fromEntries(
        Object.entries(isMap(marks) ? marks : {}).filter(
          ([key]) => !only || only.includes(`${id}.${key}`),
        ),
      );
    const kept = (marks) =>
      Object.fromEntries(
        Object.entries(isMap(marks) ? marks : {}).filter(
          ([key]) => only && !only.includes(`${id}.${key}`),
        ),
      );
    const entry = { ...whole, inherited: picked(whole.inherited), changed: picked(whole.changed) };
    const stay = { inherited: kept(whole.inherited), changed: kept(whole.changed) };
    if (Object.keys(entry.inherited).length + Object.keys(entry.changed).length === 0) {
      layers[id] = whole;
      continue;
    }
    const { inherited = {}, changed = {}, ...rest } = entry;
    const said = how === "left" ? {} : { how };
    const own = { ...(isMap(rest.own) ? rest.own : {}) };
    const confirmed = Array.isArray(rest.confirmed) ? [...rest.confirmed] : [];
    const answered = { ...(isMap(rest.answered) ? rest.answered : {}) };
    for (const [key, mark] of Object.entries(isMap(inherited) ? inherited : {})) {
      own[key] = {
        since: on,
        by,
        why,
        ...said,
        once: "inherited",
        ...(mark?.pin ? { pin: mark.pin } : {}),
        ...(mark?.hold ? { hold: mark.hold } : {}),
      };
      if (rest.source !== "user" && (CHOICES[id] ?? []).includes(key)) {
        if (!confirmed.includes(key)) confirmed.push(key);
        answered[key] ??= settlerOf(id, key, answers, { by, on });
      }
      turned.push({ layer: id, key, once: "inherited" });
    }
    for (const [key, reason] of Object.entries(isMap(changed) ? changed : {})) {
      own[key] = {
        since: on,
        by,
        why,
        ...said,
        once: "changed",
        ...(pin ? { pin } : {}),
        changed: reason,
      };
      turned.push({ layer: id, key, once: "changed" });
    }
    layers[id] = {
      ...rest,
      ...(Object.keys(stay.inherited).length > 0 ? { inherited: stay.inherited } : {}),
      ...(Object.keys(stay.changed).length > 0 ? { changed: stay.changed } : {}),
      ...(confirmed.length > 0 ? { confirmed } : {}),
      ...(Object.keys(answered).length > 0 ? { answered } : {}),
      own,
    };
  }
  return { blueprint: { ...blueprint, layers }, turned };
}

// The tool data with the check of locked answers taken off `ledger-shapes`, or that there is none.
function takenCheck(root) {
  const text = read(root, THEME);
  if (text === null) return { taken: "none" };
  let theme;
  try {
    theme = JSON.parse(text);
  } catch {
    if (!text.includes(FAMILY_CORE_CHECK.kind)) return { taken: "none" };
    throw new Refusal(
      `${THEME} is not valid JSON, and it names the check ${FAMILY_CORE_CHECK.kind}: mend it first. Nothing was written`,
    );
  }
  const shapes = theme?.checks?.[SHAPES_ROW];
  if (!Array.isArray(shapes) || !shapes.some((check) => check?.kind === FAMILY_CORE_CHECK.kind)) {
    return { taken: "none" };
  }
  const checks = {
    ...theme.checks,
    [SHAPES_ROW]: shapes.filter((check) => check?.kind !== FAMILY_CORE_CHECK.kind),
  };
  return { taken: "now", text: renderJson({ ...theme, checks }, lineWidth(root)) };
}

// The questions about a core on the waiting list: those that wait on the owner are taken off, a
// file each, or a row each of the shared file; those the owner answered stay, as the record of
// what was said. A waiting list that cannot be read stops the move: nothing is half taken off.
function coreQuestions(root) {
  let waiting;
  try {
    waiting = readWaiting(root);
  } catch (error) {
    throw new Refusal(
      `the waiting list cannot be read (${error.message.split("\n")[0]}): mend it first, so the questions about the core can be taken off. Nothing was written`,
    );
  }
  const none = { removed: [], kept: [], files: {}, gone: [] };
  if (!waiting) return none;
  const about = waiting.rows.filter(
    (row) => CORE_QUESTION.test(String(row.id)) && row.kind !== "permission",
  );
  const waits = about.filter((row) => !row.answer).map((row) => row.id);
  const kept = about.filter((row) => row.answer).map((row) => row.id);
  if (waits.length === 0) return { ...none, kept };
  if (waiting.shape === "folder") {
    return { removed: waits, kept, files: {}, gone: waits.map((id) => waiting.files[id]) };
  }
  const list = {
    ...waiting.list,
    rows: waiting.list.rows.filter((row) => !waits.includes(row.id)),
  };
  return {
    removed: waits,
    kept,
    files: { [WAITING_LIST]: renderJson(list, lineWidth(root)) },
    gone: [],
  };
}

// The files of the copy to remove, and what else lies in its folder, which is left. Only the folder
// the plugin keeps the copy in is ever touched, and only the files the pin lists and the parts a
// copy holds: a file anybody else put there stays, and is said.
function copyFiles(root, declaration) {
  const folder = PINNED_CORE.snapshot;
  const full = path.join(root, folder);
  if (!existsSync(full) || !statSync(full).isDirectory()) return { gone: [], left: [] };
  const inside = (file) =>
    !path.posix.isAbsolute(file) && !path.posix.normalize(file).split("/").includes("..");
  const names = new Set(
    [...COPIED_PARTS.map((part) => CORE.parts[part].file), ...declaration.files]
      .filter(inside)
      .map((file) => path.posix.join(folder, path.posix.normalize(file))),
  );
  const every = (at) =>
    readdirSync(path.join(root, at)).flatMap((name) => {
      const relative = path.posix.join(at, name);
      return statSync(path.join(root, relative)).isDirectory() ? every(relative) : [relative];
    });
  const found = every(folder);
  return {
    gone: found.filter((file) => names.has(file)),
    left: found.filter((file) => !names.has(file)),
  };
}

// Removes the folders the removed files leave empty, from each file's folder up to the repository's
// own, which stays.
function pruneFolders(root, files) {
  for (const file of files) {
    let at = path.posix.dirname(file);
    while (at !== "." && at !== "/" && !at.startsWith("..")) {
      const full = path.join(root, at);
      if (!existsSync(full) || readdirSync(full).length > 0) break;
      rmdirSync(full);
      at = path.posix.dirname(at);
    }
  }
}

// The core folder the repository is a member of, to take its line out of: the one the call names,
// else the one core of this family on the machine's list that names the repository. Never a guess
// between two. `folder` is null when none can be reached, with why.
function coreFolderOf({ core, family, repository }) {
  if (core) {
    return existsSync(core) && statSync(core).isDirectory()
      ? { folder: core }
      : { folder: null, why: `${core} is not a folder that can be reached now` };
  }
  if (family === null) {
    return {
      folder: null,
      why: "the declaration could not be read, so the family is not known: name the core with --core DIR",
    };
  }
  const list = readList();
  if (list.missing) return { folder: null, why: "this machine keeps no list of cores" };
  if (list.problem) {
    return { folder: null, why: `the machine's list of cores cannot be read (${list.problem})` };
  }
  const ofFamily = list.cores.filter((entry) => entry.family === family);
  if (ofFamily.length === 0) {
    return {
      folder: null,
      why: `the machine's list of cores (${list.file}) holds no core of this family`,
    };
  }
  const readable = ofFamily.filter((entry) => coreProblem(entry.path) === null);
  const naming = readable.filter((entry) => membersOf(entry.path).includes(repository));
  if (naming.length > 1) {
    throw new Refusal(
      `say which core to leave, with --core DIR: the machine's list holds ${naming.length} cores of this family that name ${repository}: ${naming.map((entry) => entry.path).join(", ")}. Nothing was written`,
    );
  }
  if (naming.length === 1) return { folder: naming[0].path };
  // No core that can be read names the repository: one that cannot be read may, so nothing is
  // said to be done there.
  const broken = ofFamily.find((entry) => coreProblem(entry.path) !== null);
  if (broken) return { folder: null, why: coreProblem(broken.path) };
  return { folder: readable[0].path };
}

function membersOf(folder) {
  try {
    const data = JSON.parse(readFileSync(path.join(folder, CORE.parts.declaration.file), "utf8"));
    return (data.members ?? []).map((member) => member?.repository);
  } catch {
    return [];
  }
}

// What the move does in the core folder: the line of the repository it takes out of the core's
// list of members, or why it takes none. The folder is read here and written by the caller, after
// the repository's own files. A core of another family is a wrong call.
function coreLineOf({ core, family, repository }) {
  const found = coreFolderOf({ core, family, repository });
  // The repository's report goes with its line (slice 2 of item 7.2): the core counts the needs
  // of the repositories of the family, and one that left is of it no more.
  const reportFile = reportFileOf(repository);
  const left = `if the core's ${CORE.parts.declaration.file} names ${repository} under members, take that line out there by hand, delete its report, ${reportFile}, if it is there, and hold the shape with core --check --core DIR`;
  if (found.folder === null) return { reached: false, file: null, why: found.why, left };
  const file = path.join(found.folder, CORE.parts.declaration.file);
  const report = existsSync(path.join(found.folder, reportFile))
    ? path.join(found.folder, reportFile)
    : null;
  const unwritable = (why) => ({ reached: true, file, line: null, why, left });
  const newer = newerCoreParts(found.folder);
  if (newer.length > 0) return unwritable(newer[0]);
  const wrong = familyCoreProblems(found.folder);
  if (wrong.length > 0) {
    return unwritable(`${found.folder} is not a family core whose shape holds: ${wrong[0]}`);
  }
  const text = readFileSync(file, "utf8");
  const declaration = JSON.parse(text);
  if (family !== null && declaration.family !== family) {
    throw new Refusal(
      `${found.folder} is the core of ${declaration.family}, and this repository declares the family ${family}: name the core it is a member of, or none. Nothing was written`,
    );
  }
  const line = declaration.members.find((member) => member.repository === repository);
  if (!line) return { reached: true, file, line: null, report, why: null, left: null };
  const next = {
    ...declaration,
    members: declaration.members.filter((member) => member.repository !== repository),
  };
  const problems = corePartShapeProblems("declaration", next, CORE.parts.declaration.file);
  if (problems.length > 0) return unwritable(problems[0]);
  return {
    reached: true,
    file,
    line,
    report,
    text: renderJson(next, WIDTH),
    why: null,
    left: null,
  };
}

// The blocks the repository took in from the core (slice 1 of item 7.2): each stays where it is, as
// the repository's own, and its row of the intake ledger is not rewritten. `from` and `pin` on the
// row then say where the block once came from. An intake ledger that cannot be read names none.
function blocksKept(root) {
  let theme;
  try {
    theme = readTheme(root);
  } catch {
    return [];
  }
  return readIntake(root, theme)
    .blocks.filter((block) => words(block.from) === CORE_ID && !block.retired && !block.merged_into)
    .map((block) => ({
      need: words(block.need),
      name: words(block.name),
      file: words(block.file),
      source: words(block.source),
      pin: words(block.pin),
    }));
}

// Leaves the family, or says what leaving would do. `left` is false, and nothing is written, on a
// repository that declares no family.
export function leaveCore(root, { core = null, by, why, on, dryRun }) {
  const declaration = declarationOf(root);
  const home = homeOf(root);
  const repository = path.basename(home);
  if (declaration === null) {
    return { left: false, repository, why: "this repository declares no family", dry_run: dryRun };
  }
  const newer = newerLedgers(root);
  if (newer.length > 0) throw new Refusal(`${newer.join("; ")}. Nothing was written`);
  const said = { on, by: clean(by), why: clean(why) };
  const pinned = readPinnedCore(root);
  const unreadable = pinned?.unreadable ?? null;
  const answers = unreadable ? null : pinned.answers;
  const pin = pinned?.label ?? declaration.pin;
  const family = declaration.family;

  // Everything is read and decided first, so a wrong call writes nothing.
  const coreLine = coreLineOf({ core, family, repository });
  const files = {};
  const ledgerText = read(root, LEDGER);
  const ledger = ledgerText === null ? { rows: [] } : turnLedger(ledgerText, { ...said, answers });
  if (ledgerText !== null && ledger.text !== ledgerText) files[LEDGER] = ledger.text;
  let choices = [];
  const blueprintText = read(root, BLUEPRINT);
  if (blueprintText !== null) {
    let blueprint;
    try {
      blueprint = JSON.parse(blueprintText);
    } catch {
      throw new Refusal(`${BLUEPRINT} is not valid JSON: mend it first. Nothing was written`);
    }
    const made = turnBlueprint(blueprint, { ...said, pin, answers });
    choices = made.turned;
    if (choices.length > 0) files[BLUEPRINT] = renderJson(made.blueprint, lineWidth(root));
  }
  const check = takenCheck(root);
  if (check.taken === "now") files[THEME] = check.text;
  const questions = coreQuestions(root);
  Object.assign(files, questions.files);
  const copy = copyFiles(root, declaration);
  const gone = [PINNED_CORE.file, ...copy.gone, ...questions.gone];
  const exports = exportsBehind(root, {
    ...files,
    ...Object.fromEntries(gone.map((file) => [file, null])),
  });

  const written = writeFiles(root, files, dryRun);
  if (!dryRun) {
    for (const file of gone) unlinkSync(path.join(root, file));
    pruneFolders(root, gone);
  }
  // The core's list of members: said first, then written, only where the folder can be written.
  const coreFile = { ...coreLine, written: false };
  delete coreFile.text;
  if (coreLine.text && !dryRun) {
    try {
      writeFileSync(coreLine.file, coreLine.text);
      coreFile.written = true;
    } catch (error) {
      coreFile.why = `${error.message.split("\n")[0]}: the core's list of members is left as it was`;
      coreFile.left = `take the line of ${repository} out of members in ${coreLine.file} by hand, where the core can be written, and hold the shape with core --check`;
    }
  }
  // Its report in the core: said first, then deleted, only where the folder can be written.
  const coreReport = { file: coreLine.report ?? null, deleted: false, why: null };
  if (coreLine.report && !dryRun) {
    try {
      unlinkSync(coreLine.report);
      coreReport.deleted = true;
    } catch (error) {
      coreReport.why = `${error.message.split("\n")[0]}: the report is left as it was`;
      const more = `delete ${coreLine.report} by hand, where the core can be written, and hold the shape with core --check`;
      coreFile.left = coreFile.left ? `${coreFile.left}; and ${more}` : more;
    }
  }
  delete coreFile.report;
  const list = addLine({ repository: home, on, how: LEFT }, { dryRun });
  return {
    left: true,
    repository,
    family,
    pin,
    on,
    by: said.by,
    why: said.why,
    copy: { readable: unreadable === null, why: unreadable, left_in_place: copy.left },
    blocks_kept: blocksKept(root),
    rows: ledger.rows,
    blueprint: choices,
    check: check.taken,
    questions: { removed: questions.removed, kept: questions.kept },
    core_file: coreFile,
    core_report: coreReport,
    list,
    exports,
    files: [...writtenFiles(written), ...gone.map((file) => fileChange(file, "delete"))],
    written: [...written, ...gone.map((file) => `${"delete".padEnd(9)} ${file}`)],
    dry_run: dryRun,
  };
}
