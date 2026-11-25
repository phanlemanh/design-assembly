// The move of `core` that takes a block of the family core down into a member (spec 0016, slice 1
// of item 7.2, answer 7): the block's files are copied from the repository's copy of the core, at
// its pin, into the repository's own components, and its conform record is started, as taken down.
// From there the block goes the way of an item of an outside source: conformed, then taken in with
// intake, which asks the owner. Nothing is linked: the code is the repository's from then on.
// Called again once the copy holds a newer block, it writes the files that changed, and conform
// --taken-down applies the patches again. It reads the copy, never the core folder, fetches
// nothing, and runs nothing.
//   --take BLOCK [--need KEY] [--to DIR] [--dry-run]
// BLOCK is the block's need in the core; KEY, the repository's own need, is BLOCK when not given.
// Exit: 0 the block is taken down, or was already; 1 it is taken down and turns off a rule the
// repository holds, which is settled before intake; 2 a wrong call, a repository of no family, a
// copy that cannot be read, a block the copy does not hold or that is not offered here, a file in
// the way, or a file changed by hand. On 2 nothing is written.
import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

import { libraryFolders, ownFolder } from "../templates/tools/design-assembly/components.mjs";
import {
  CONFORM_FOLDER,
  PINNED_CORE,
  shapeProblems,
} from "../templates/tools/design-assembly/contract.mjs";
import { lineWidth, renderJson } from "../templates/tools/design-assembly/json.mjs";
import { writeFiles, writtenFiles } from "./apply.mjs";
import { finish, Refusal, refuse } from "./command.mjs";
import { folderRulesOff, mandatoryOff, mandatoryRules, unexempted } from "./conform-rules.mjs";
import { blockFileText, CORE_SOURCE, CORE_WORDS, readFamilyStore } from "./core-blocks.mjs";
import { componentsOf, fileOf, insideRoot, readIntake, readTheme, text } from "./store.mjs";

export const TAKE_MOVES = ["--take"];
export const TAKE_FLAGS = { "--take": "value", "--need": "value", "--to": "value" };
// The flags of this move that no other move of the command takes.
export const TAKE_ONLY = ["--need", "--to"];
export const TAKE_USAGE =
  "       node core.mjs --take BLOCK [--need KEY] [--to DIR] [--dry-run] [--target DIR] [--json]\n";

const NEED = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const NOTHING = ". Nothing was written";
const sha = (content) => createHash("sha256").update(content).digest("hex");
const byFile = (a, b) => (a.file < b.file ? -1 : a.file > b.file ? 1 : 0);
const plural = (count, one, many) => `${count} ${count === 1 ? one : many}`;
const readText = (root, file) => {
  const full = path.join(root, file);
  return insideRoot(root, file) && existsSync(full) ? readFileSync(full, "utf8") : null;
};

// The conform record of the need, when the repository has one: whole, or a refusal.
function recordOf(root, file) {
  const said = readText(root, file);
  if (said === null) return null;
  const problems = shapeProblems("conform", said, file);
  if (problems.length > 0) throw new Refusal(`${problems.slice(0, 3).join("; ")}${NOTHING}`);
  return JSON.parse(said);
}

// The block of the copy a call names, or a refusal that says why it cannot be taken here.
function blockOf(root, wanted) {
  const store = readFamilyStore(root);
  if (!store.declared) {
    throw new Refusal(
      "this repository declares no family, so it has no family core to take a block from: core --join declares one",
    );
  }
  if (store.unreadable) {
    throw new Refusal(
      `the copy of the family core here cannot be read (${store.unreadable}): pin it again with core --join${NOTHING}`,
    );
  }
  const block = store.blocks.find((each) => each.need === wanted);
  if (!block) {
    const held = store.blocks.map((each) => each.need).join(", ");
    throw new Refusal(
      `this repository's copy of the family core holds no block for ${wanted}: it holds ${held || "none"}${NOTHING}`,
    );
  }
  if (block.broken) throw new Refusal(`${block.name}: ${block.broken}${NOTHING}`);
  if (block.lacking.length > 0) {
    throw new Refusal(
      `${block.name} needs the ${block.lacking.join(" and ")} ${block.lacking.length === 1 ? "adapter" : "adapters"}, which this repository lacks: it is not offered here${NOTHING}`,
    );
  }
  return { store, block };
}

// The folder the repository keeps its own components in: beside the library's folder where the
// library keeps one to itself, else the library's folder.
function ownComponents(root) {
  const [library] = libraryFolders(root);
  return ownFolder(library) ?? library;
}

// The folder a call names, written as the repository writes a path, inside the repository.
function folderOf(root, named) {
  const said = fileOf(named)?.replace(/\/+$/, "");
  if (!said || !insideRoot(root, said)) {
    throw new Refusal(`--to ${named} is outside the repository${NOTHING}`);
  }
  // A folder named by its full path is the same folder: every file is read and written by its
  // path from the repository's root, so the check for a file in the way reads the right one.
  const folder =
    path.relative(path.resolve(root), path.resolve(root, said)).split(path.sep).join("/") || ".";
  // Compared without regard to case: on a disk that tells no case apart they are one folder.
  const lower = folder.toLowerCase();
  const copy = PINNED_CORE.snapshot.toLowerCase();
  if (lower === copy || lower.startsWith(`${copy}/`)) {
    throw new Refusal(
      `--to ${named} is inside the copy of the core: a block is taken into the repository's own code${NOTHING}`,
    );
  }
  if (folder.split("/").some((part) => part.startsWith(".") && part !== ".")) {
    throw new Refusal(
      `--to ${named} is a hidden folder, or lies in one: a block is taken into the repository's own code${NOTHING}`,
    );
  }
  return folder;
}

// The one folder the files of a record are this block's files in, or null when there is none.
function folderOfRecord(record, block) {
  const folders = new Set();
  for (const entry of record.conformed) {
    const name = block.files
      .map((file) => file.file)
      .filter((each) => entry.file === each || entry.file.endsWith(`/${each}`))
      .sort((a, b) => b.length - a.length)[0];
    if (!name) return null;
    folders.add(entry.file === name ? "." : entry.file.slice(0, -(name.length + 1)));
  }
  return folders.size === 1 ? [...folders][0] : null;
}

// A block taken down for the first time: every file copied where the repository keeps its own
// components, or in the folder named, and the conform record started from them as taken down.
function firstTake(root, { block, need, to, recordFile }) {
  const folder = to === null ? ownComponents(root) : folderOf(root, to);
  // A component of the block's name somewhere else in the repository: find does not offer the
  // block then, and taking it would leave two components of one name.
  const dests = block.files.map((file) => path.posix.join(folder, file.file));
  const elsewhere = componentsOf(root).components.find(
    (component) => component.name === block.name && !dests.includes(component.file),
  );
  if (elsewhere) {
    throw new Refusal(
      `${block.name} is already in the repository, in ${elsewhere.file}: a block of that name is not offered here, and is not taken beside it${NOTHING}`,
    );
  }
  const files = {};
  const entries = [];
  for (const file of block.files) {
    const dest = path.posix.join(folder, file.file);
    const content = blockFileText(root, file.kept);
    const there = readText(root, dest);
    if (there !== null && there !== content) {
      throw new Refusal(
        `${dest} is there already and is not the block's file: it is never written over; name another folder with --to${NOTHING}`,
      );
    }
    files[dest] = content;
    entries.push({ file: dest, sha256: sha(content) });
  }
  entries.sort(byFile);
  const record = {
    version: 1,
    need,
    source: CORE_SOURCE,
    item: block.need,
    pin_sha256: block.pin_sha256,
    taken: entries,
    conformed: entries.map((entry) => ({ ...entry })),
    patches: [],
    exemptions: [],
  };
  const said = renderJson(record, lineWidth(root));
  const problems = shapeProblems("conform", said, recordFile);
  if (problems.length > 0) throw new Refusal(`${problems.slice(0, 3).join("; ")}${NOTHING}`);
  return { record, files, writes: { ...files, [recordFile]: said } };
}

// A newer block taken down over one conformed before: the files that changed are written as the
// copy holds them now; a file changed by hand since is never written over. The record is left to
// conform --taken-down, which applies the patches again.
function nextTake(root, { block, need, to, record, recordFile }) {
  const folder = to === null ? folderOfRecord(record, block) : folderOf(root, to);
  const held = record.conformed.map((entry) => entry.file).sort();
  const dests = block.files.map((file) => ({
    file,
    dest: folder === null ? null : path.posix.join(folder, file.file),
  }));
  const now = dests.map((each) => each.dest).sort();
  if (folder === null || JSON.stringify(now) !== JSON.stringify(held)) {
    throw new Refusal(
      `the block ${block.need} is ${block.files.map((file) => file.file).join(", ")} in the copy now, and ${recordFile} holds ${held.join(", ")}: the two are not the same files in one folder. Remove ${recordFile} and the block's files by hand, take the block down afresh, and record each change again with conform --patch${NOTHING}`,
    );
  }
  const files = {};
  for (const { file, dest } of dests) {
    const taken = record.taken.find((entry) => entry.file === dest)?.sha256;
    const conformed = record.conformed.find((entry) => entry.file === dest)?.sha256;
    // A file of the block that did not change keeps the repository's patches as they are.
    if (file.sha256 === taken) continue;
    const there = readText(root, dest);
    if (there !== null && ![taken, conformed, file.sha256].includes(sha(there))) {
      throw new Refusal(
        `${dest} is neither the file as taken down nor the file ${recordFile} holds after patching: it was changed by hand. Record the change with conform --need ${need} --patch ${dest} --reason SENTENCE, or put the file back, before the newer block is taken down${NOTHING}`,
      );
    }
    files[dest] = blockFileText(root, file.kept);
  }
  return { record, files, writes: files };
}

// Takes a block of the family core down for a need, or says what it would write.
export function takeBlock(root, { block: wanted, need = wanted, to = null, dryRun = false }) {
  const { store, block } = blockOf(root, wanted);
  const recordFile = `${CONFORM_FOLDER}/${need}.json`;
  const record = recordOf(root, recordFile);
  if (record && (record.source !== CORE_SOURCE || record.item !== block.need)) {
    throw new Refusal(
      `${recordFile} holds ${record.item} from the source ${record.source}: one need, one item${NOTHING}`,
    );
  }
  const row = readIntake(root, readTheme(root)).blocks.find((each) => text(each.need) === need);
  const ours = row && text(row.from) === CORE_SOURCE && text(row.source) === block.need;
  if (row && !(ours && record)) {
    throw new Refusal(
      `the intake ledger already answers ${need} with ${text(row.name) ?? "a block"}: one need, one solution${NOTHING}`,
    );
  }
  const base = {
    family: store.family,
    pin: store.pin,
    block: block.need,
    name: block.name,
    need,
    block_pin: block.pin_sha256,
    record: recordFile,
    taken_in: Boolean(row),
    dry_run: dryRun,
  };
  if (record && record.pin_sha256 === block.pin_sha256) {
    return {
      ...base,
      state: "already",
      files: [],
      written: [],
      rules: [],
      folders: [],
      main: null,
    };
  }
  const made = record
    ? nextTake(root, { block, need, to, record, recordFile })
    : firstTake(root, { block, need, to, recordFile });
  // The rules the block turns off as it is taken down, read from the files about to be written: a
  // mandatory rule is patched, any other needs its exemption, before the block is taken in.
  const codeOf = (file) => made.files[file] ?? readText(root, file);
  const mandatory = mandatoryRules(root);
  const rules = record
    ? []
    : [
        ...mandatoryOff(root, made.record, codeOf, mandatory),
        ...unexempted(root, made.record, codeOf, mandatory),
      ];
  // A rule the configuration turns off for the folder the block lands in is not the block's
  // doing: another folder, one the configuration does not name, has none.
  const folders = record
    ? []
    : [...new Set(folderRulesOff(root, made.record).map((each) => each.folder))];
  const written = writeFiles(root, made.writes, dryRun);
  const first = block.files[0].file;
  const main =
    made.record.conformed.find((entry) => entry.file === first || entry.file.endsWith(`/${first}`))
      ?.file ?? null;
  return {
    ...base,
    state: record ? "newer" : "taken",
    files: writtenFiles(written),
    written,
    rules,
    folders,
    main,
  };
}

function takeReport(result) {
  const from = `${CORE_WORDS} at ${result.pin}`;
  if (result.state === "already") {
    return [
      `${result.name} is taken down for ${result.need} already, as this repository's copy of ${from} holds it: nothing to take down`,
      result.taken_in
        ? "it is taken in: the intake ledger has its row"
        : `next: conform --need ${result.need} says whether its record holds; then intake --need ${result.need} --file PATH takes it in`,
    ];
  }
  const verb = result.dry_run ? "would take" : "took";
  const lines = [
    result.state === "newer"
      ? `${verb} the newer ${result.name} down for ${result.need} from ${from}: ${plural(result.files.length, "file", "files")} of it changed`
      : `${verb} ${result.name} down for ${result.need} from ${from}`,
    `${result.dry_run ? "would write" : "files"}:`,
    ...(result.written.length === 0
      ? ["  nothing to write"]
      : result.written.map((line) => `  ${line}`)),
  ];
  if (result.rules.length > 0) {
    lines.push(
      "rules the block turns off, settled before it is taken in:",
      ...result.rules.map((line) => `  ${line}`),
    );
  }
  if (result.folders.length > 0) {
    lines.push(
      `the repository's configuration names ${result.folders.join(" and ")}, which is read as setting ${result.folders.length === 1 ? "that folder" : "those folders"} apart from a rule: in a folder it does not name, given with --to DIR, the block is held to every rule${result.dry_run ? "" : `; to move it, remove the files just written and ${result.record}, then take it down again`}`,
    );
  }
  lines.push(
    result.state === "newer"
      ? `next: conform --need ${result.need} --taken-down, which applies the repository's patches again on the newer files and records the block as taken down`
      : result.rules.length > 0
        ? `next: patch the code and record it with conform --need ${result.need} --patch PATH --reason SENTENCE, or let the block off a rule that is not mandatory with conform --need ${result.need} --exempt RULE --file PATH --reason SENTENCE; then intake --need ${result.need} --file ${result.main}`
        : `next: intake --need ${result.need} --file ${result.main}, which writes its row once the owner kept it`,
    `nothing was fetched: the files ${result.dry_run ? "would be" : "were"} copied from ${PINNED_CORE.snapshot}, this repository's copy of the core`,
  );
  return lines;
}

// Runs the move, the call read by the core command.
export function takeMain(call, usage) {
  const { flags } = call;
  const allowed = new Set(["--take", "--need", "--to", "--dry-run"]);
  const stray = Object.keys(flags).find((flag) => !allowed.has(flag) && flags[flag] !== undefined);
  if (stray) return refuse(`${stray} is not taken by --take`, usage);
  const wanted = flags["--take"];
  if (!NEED.test(wanted)) {
    return refuse(
      `--take ${wanted} is not a block's need: lower-case letters and digits, a dash between words`,
      usage,
    );
  }
  const need = flags["--need"] ?? wanted;
  if (!NEED.test(need)) {
    return refuse(
      `--need ${need} is not a need key: lower-case letters and digits, a dash between words`,
      usage,
    );
  }
  const result = takeBlock(call.target, {
    block: wanted,
    need,
    to: flags["--to"] ?? null,
    dryRun: flags["--dry-run"] === true,
  });
  // The lines written are for a person; a machine gets the files as a list.
  const said = Object.fromEntries(Object.entries(result).filter(([key]) => key !== "written"));
  return finish({
    json: call.json,
    result: said,
    text: `${takeReport(result).join("\n")}\n`,
    work: result.rules.length > 0,
  });
}
