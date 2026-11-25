// The family's owner promotes a block into the core (spec 0016, criterion 21, answer 13, slice 3 of
// item 7.2): a block of a repository's own store, one with a row in its intake ledger, is copied
// into the core folder's block store: its files under `blocks/<need>/` with the hash of each, the
// adapters it needs, the repository it is used in, who promoted it, when and why, and
// `second_use: false`, which the output says as "no second use yet". The move writes only in the
// core folder, and says first what it writes there; the repository is read and never written.
// Members learn of the block as they learn of any change of the store: `core --moved` says the
// store differs, and `core --join` pins it. The replace of a block a need already has is the same
// move, with `--replace`; the grant of a member's proposal for a block goes through it too
// (core-propose.mjs). No model and no network are called, and nothing is committed.
import { Buffer } from "node:buffer";
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";

import { ADAPTER_KINDS, adapterOf } from "../templates/tools/design-assembly/adapters/index.mjs";
import {
  blockFilesKey,
  CORE,
  coreBlockFile,
  corePartShapeProblems,
  hiddenInBlock,
  isTextFile,
  staysInBlock,
} from "../templates/tools/design-assembly/contract.mjs";
import { isByHand } from "../templates/tools/design-assembly/intake-ledger.mjs";
import { renderJson } from "../templates/tools/design-assembly/json.mjs";
import {
  readPinnedSources,
  SOURCES_FOLDER,
} from "../templates/tools/design-assembly/sources-ledger.mjs";
import { fileChange, Refusal } from "./command.mjs";
import { CORE_SOURCE } from "./core-blocks.mjs";
import { readCore } from "./core-change.mjs";
import { homeOf } from "./core-list.mjs";
import { STARTER_SOURCE } from "./starter-intake.mjs";
import { fileOf, insideRoot, readIntake, readTheme, text } from "./store.mjs";

const WIDTH = 100;
const INDEX = CORE.parts.blocks.file;
const DECLARATION = CORE.parts.declaration.file;
const RETIRED = CORE.parts.retired.file;
const NOTHING = ". Nothing was written";
// What a block reached by its default adapters needs: the kinds every block of code the starter kit
// lays names, read in the repository the block is promoted from.
export const DEFAULT_ADAPTERS = ["components", "source"];
// How a block gets a row of the intake ledger, said when a file has none.
export const HOW_A_ROW =
  "a block gets its row when intake takes it in: find, then the owner's yes on the decision sheet, then intake --need NEED --file PATH; a file with no row is the repository's code, not a block of its store";
// What the store's entry of a block promoted on the owner's word says until a second repository
// uses it.
export const NO_SECOND_USE = "no second use yet";
export const MEMBERS_LEARN =
  "no member repository was written: each member sees the store differs where it can look at this folder (core --moved, status), and core --join pins the newer store; a member takes the block down with core --take";

const sha = (bytes) => createHash("sha256").update(bytes).digest("hex");
const readJson = (file) => JSON.parse(readFileSync(file, "utf8"));
const readPart = (core, file, empty) =>
  existsSync(path.join(core, file)) ? readJson(path.join(core, file)) : empty;

// The core's store as it stands: its declaration, its list of blocks and what it retired. The core
// is checked first, as the change move checks it: a folder that is no core, a part of a newer
// shape, a core inside a repository not its own, or one that does not hold its shape is refused.
export function readStore(core) {
  readCore(core);
  return {
    declaration: readJson(path.join(core, DECLARATION)),
    index: readJson(path.join(core, INDEX)),
    retired: readPart(core, RETIRED, { version: CORE.version, answers: [], blocks: [] }),
  };
}

// The row of the intake ledger a call names: by its need, or by its file when the name is a path.
function rowOf(root, named) {
  const intake = readIntake(root, readTheme(root));
  if (intake.read === null || intake.ledger === null) {
    throw new Refusal(
      `${named} has no row: this repository keeps no intake ledger, and ${HOW_A_ROW}${NOTHING}`,
    );
  }
  if (intake.why) throw new Refusal(`${intake.why}${NOTHING}`);
  const asFile = named.includes("/") || named.includes(".");
  const said = asFile ? fileOf(named) : named;
  const row = intake.blocks.find((block) =>
    asFile ? fileOf(block.file) === said : text(block.need) === said,
  );
  if (!row) {
    throw new Refusal(
      `${asFile ? `${said} is named by no row` : `${said} has no row`} of the intake ledger of this repository (${intake.kept}): ${HOW_A_ROW}${NOTHING}`,
    );
  }
  return { row, ledger: intake.ledger };
}

// Where a row says its block came from: the repository's own, the starter kit, the family core, or
// an outside source with its id (null when the row names none and the repository pins more than one).
function originOf(root, ledger, row) {
  const from = text(row.from);
  if (from === STARTER_SOURCE) return { kind: "starter" };
  if (from === CORE_SOURCE && !row.own) return { kind: "core", pin: text(row.pin) };
  if (from === CORE_SOURCE) return { kind: "own" };
  if (!text(row.source) || isByHand(ledger, row)) return { kind: "own" };
  const sources = readPinnedSources(root);
  if (from) {
    return { kind: "outside", id: from, source: sources.find((each) => each.id === from) ?? null };
  }
  if (sources.length === 1) return { kind: "outside", id: sources[0].id, source: sources[0] };
  // No source named, and none or several pinned: which one it came from is not known.
  return { kind: "outside", id: null, word: text(row.source), pinned: sources.length };
}

// Why the repository may not promote the row's block, or null.
function originRefusal(origin, row) {
  const name = text(row.name) ?? text(row.need);
  if (origin.kind === "starter") {
    return `${name} is a piece of the starter kit: every repository has it from the plugin, so the core keeps only what the plugin does not give`;
  }
  if (origin.kind === "core") {
    return `${name} was taken from the family core${origin.pin ? ` at ${origin.pin}` : ""}: it is the core's already. A change to it goes up as a proposal (core --propose ${text(row.need)} --block)`;
  }
  if (origin.kind === "outside" && origin.id === null && origin.pinned > 1) {
    return `the row of ${name} names no source it came from, and this repository pins ${origin.pinned}: say which with its from key first`;
  }
  if (origin.kind === "outside" && origin.id === null) {
    return `the row of ${name} says it came from ${origin.word}, which is no source this repository pins, and the intake ledger does not say ${origin.word} is its word for made by hand. If the block was made by hand, say so under values (values: { by-hand: ${origin.word} }) in the intake ledger; if it came from an outside source, pin that source with its licence line, and name it with from`;
  }
  return null;
}

// The licence line of the outside source a block came from, as the source states it, or a refusal
// when it states none: what its code may be passed on under is then not known.
function licenceOf(origin) {
  const words = text(origin.source?.licence)?.trim();
  if (!words) {
    throw new Refusal(
      `the block came from the outside source ${origin.id}, ${origin.source ? "whose row states no licence line" : "which this repository does not pin"}: whether its code may be passed on to the family's other repositories is not known. Write the source's licence line (licence, in ${SOURCES_FOLDER}/${origin.id}.json) and ask again${NOTHING}`,
    );
  }
  return { source: origin.id, words };
}

// The files of a row's block in the repository: those its conform record holds after patching,
// else the one file the row names. Each is inside the repository, is there and is text.
function filesOf(root, row) {
  const recordFile = fileOf(row.conform);
  let files = [fileOf(row.file)];
  if (recordFile && insideRoot(root, recordFile) && existsSync(path.join(root, recordFile))) {
    const record = readJson(path.join(root, recordFile));
    const listed = (Array.isArray(record.conformed) ? record.conformed : [])
      .map((entry) => fileOf(entry?.file))
      .filter(Boolean);
    if (listed.length > 0) files = listed;
  }
  return files.map((file) => {
    if (!file || !insideRoot(root, file)) {
      throw new Refusal(`${file ?? "a file of the row"} is outside the repository${NOTHING}`);
    }
    const full = path.join(root, file);
    if (!existsSync(full))
      throw new Refusal(`${file}, a file of the block, is not there${NOTHING}`);
    const bytes = readFileSync(full);
    if (!isTextFile(bytes)) {
      throw new Refusal(`${file} is not text: a block's files are code, kept as text${NOTHING}`);
    }
    return { from: file, bytes };
  });
}

// The names the core keeps a block's files under, in the folder of its need: one file by its own
// name; several by their path from the folder they share.
export function namesInBlock(paths) {
  if (paths.length === 1) return [path.posix.basename(paths[0])];
  const parts = paths.map((file) => file.split("/"));
  let shared = 0;
  while (parts.every((each) => shared < each.length - 1 && each[shared] === parts[0][shared])) {
    shared += 1;
  }
  return parts.map((each) => each.slice(shared).join("/"));
}

// The adapters a block needs: those the call names, each a kind this plugin knows and one the
// repository has, since the block works there; else the default kinds the repository has.
function adaptersOf(root, named) {
  if (named.length > 0) {
    for (const kind of named) {
      if (!Object.hasOwn(ADAPTER_KINDS, kind)) {
        throw new Refusal(
          `--adapter ${kind} is no kind of adapter: one of ${Object.keys(ADAPTER_KINDS).join(", ")}${NOTHING}`,
        );
      }
      if (!adapterOf(kind)?.present?.(root)) {
        throw new Refusal(
          `--adapter ${kind}: this repository has no ${kind} adapter, and the block is promoted from where it works${NOTHING}`,
        );
      }
    }
    return { adapters: [...new Set(named)], from: "named" };
  }
  const found = DEFAULT_ADAPTERS.filter((kind) => adapterOf(kind)?.present?.(root));
  return { adapters: found, from: "default" };
}

// Writes a block's files into the core folder, or says what it would: each file under the folder
// of its need, and a file the block had before and has no more taken away, its name and hash kept
// in the block's history. Gives each change as a path of the core folder.
export function placeBlock(core, { need, contents, before = [], dryRun }) {
  const changes = [];
  for (const [file, bytes] of Object.entries(contents)) {
    const kept = coreBlockFile(need, file);
    const full = path.join(core, kept);
    const was = existsSync(full) ? readFileSync(full) : null;
    const change =
      was === null ? "create" : Buffer.compare(was, bytes) === 0 ? "unchanged" : "update";
    changes.push({ path: path.join(core, kept), change });
    if (!dryRun && change !== "unchanged") {
      mkdirSync(path.dirname(full), { recursive: true });
      writeFileSync(full, bytes);
    }
  }
  for (const { file } of before) {
    if (file in contents) continue;
    const full = path.join(core, coreBlockFile(need, file));
    if (!existsSync(full)) continue;
    changes.push({ path: full, change: "remove" });
    if (!dryRun) rmSync(full);
  }
  return changes.map((entry) => fileChange(entry.path, entry.change));
}

// The store's list with one block put in, checked against the shape before anything is written.
export function storeWith(index, entry) {
  const at = index.blocks.findIndex((block) => block.need === entry.need);
  const next = {
    ...index,
    version: CORE.version,
    blocks:
      at === -1
        ? [...index.blocks, entry]
        : index.blocks.map((block, place) => (place === at ? entry : block)),
  };
  const problems = corePartShapeProblems("blocks", next, INDEX);
  if (problems.length > 0) {
    throw new Refusal(`the core would not hold its own shape: ${problems.join("; ")}${NOTHING}`);
  }
  return next;
}

// The block that replaces another of the same need: the files it gets, the history that says what
// it had, who replaced it, when and why, and the repositories that use it.
export function replacedBlock(was, { files, adapters, repository, by, on, why, licence }) {
  const usedBy = [...new Set([...(was.used_by ?? []), repository])];
  return {
    ...was,
    files,
    adapters,
    used_by: usedBy,
    second_use: Boolean(was.second_use) || usedBy.length > 1,
    ...(licence ? { licence } : {}),
    history: [
      ...(was.history ?? []),
      { was: { files: was.files }, became: { files }, by, on, why },
    ],
  };
}

// Promotes the block of a row of the repository's intake ledger into the core, or says what it
// would write, or why a person is asked first (a licence line), or why it is refused.
export function promoteBlock(root, request) {
  const { core, named, by, on, why, replace = false, licenceAllows = false, dryRun } = request;
  const { declaration, index, retired } = readStore(core);
  const repository = path.basename(homeOf(root));
  const ofFamily =
    declaration.first?.repository === repository ||
    declaration.members.some((member) => member.repository === repository);
  if (!ofFamily) {
    throw new Refusal(
      `${repository} is neither the first repository of the family ${declaration.family} nor one of its members: a block is promoted from a repository of the family. Join it first with core --join${NOTHING}`,
    );
  }
  const { row, ledger } = rowOf(root, named);
  const need = text(row.need);
  const name = text(row.name) ?? need;
  if (row.retired || row.merged_into) {
    throw new Refusal(
      `${name} is ${row.retired ? "retired" : `merged into ${text(row.merged_into)}`} in this repository: a block the repository no longer uses is not promoted${NOTHING}`,
    );
  }
  const origin = originOf(root, ledger, row);
  const refusal = originRefusal(origin, row);
  if (refusal) throw new Refusal(`${refusal}${NOTHING}`);
  const licence = origin.kind === "outside" ? licenceOf(origin) : null;
  const base = {
    core,
    family: declaration.family,
    repository,
    need,
    name,
    origin: origin.kind,
    ...(licence ? { licence_line: licence } : {}),
    by,
    on,
    why,
    dry_run: dryRun,
  };
  // A licence may forbid passing the code on: a person reads the line and says so first.
  if (licence && !licenceAllows) {
    return { ...base, waits: true, files: [] };
  }
  if (retired.blocks.some((block) => block.need === need)) {
    throw new Refusal(
      `the core retired a block of ${need}, and keeps its files under ${coreBlockFile(need, "")}: a retired need is not promoted again${NOTHING}`,
    );
  }
  const found = filesOf(root, row);
  const names = namesInBlock(found.map((each) => each.from));
  for (const file of names) {
    if (!staysInBlock(file) || hiddenInBlock(file)) {
      throw new Refusal(
        `${file} cannot be kept under ${coreBlockFile(need, "")}: a block's file stays in its folder and is not hidden${NOTHING}`,
      );
    }
  }
  const contents = Object.fromEntries(names.map((file, place) => [file, found[place].bytes]));
  const files = names.map((file, place) => ({ file, sha256: sha(found[place].bytes) }));
  const { adapters, from: adaptersFrom } = adaptersOf(root, request.adapters ?? []);
  const was = index.blocks.find((block) => block.need === need);
  if (was && !replace) {
    throw new Refusal(
      `the core answers ${need} already, with ${was.name} (promoted by ${was.promoted.by} on ${was.promoted.on}): to replace its files with these, add --replace; the core then records who replaced them, when and why, and each member sees it when it looks${NOTHING}`,
    );
  }
  if (!was && replace) {
    throw new Refusal(
      `--replace: the core answers no ${need} yet; leave --replace out to promote it${NOTHING}`,
    );
  }
  const other = index.blocks.find((block) => block.name === name && block.need !== need);
  if (other) {
    throw new Refusal(
      `the core keeps a block named ${name} for ${other.need}: two blocks of one name would meet in a member${NOTHING}`,
    );
  }
  const licenceEntry = licence ? { ...licence, allowed: { by, on } } : null;
  if (was && JSON.stringify(blockFilesKey(was.files)) === JSON.stringify(blockFilesKey(files))) {
    return { ...base, unchanged: true, replaced: false, files: [], block: was };
  }
  const entry = was
    ? replacedBlock(was, { files, adapters, repository, by, on, why, licence: licenceEntry })
    : {
        need,
        name,
        ...(text(row.description) ? { description: text(row.description) } : {}),
        files,
        adapters,
        used_by: [repository],
        promoted: { by, on, why },
        second_use: false,
        ...(licenceEntry ? { licence: licenceEntry } : {}),
      };
  const next = storeWith(index, entry);
  const written = [
    ...placeBlock(core, { need, contents, before: was?.files ?? [], dryRun }),
    fileChange(path.join(core, INDEX), "update"),
  ];
  if (!dryRun) writeFileSync(path.join(core, INDEX), renderJson(next, WIDTH));
  return {
    ...base,
    replaced: Boolean(was),
    block: entry,
    adapters_from: adaptersFrom,
    files: written,
  };
}

// The promotion as a person reads it.
export function promoteReport(result) {
  const lines = [];
  const where = `family core${result.dry_run ? " (not written: --dry-run)" : ""}: ${result.family}, at ${result.core}`;
  if (result.waits) {
    return [
      where,
      `${result.name} (${result.need}) came from the outside source ${result.licence_line.source}, whose licence line says:`,
      `  ${result.licence_line.words}`,
      "a licence may forbid passing the code on to the family's other repositories: a person reads the line and says whether it allows that",
      `if it does, run this again with --licence-allows, and the core records the line with who said so and when; if not, the block stays in ${result.repository} alone`,
      "nothing was written",
    ];
  }
  if (result.unchanged) {
    return [
      where,
      `${result.name} (${result.need}) in the core holds these files already: this changes nothing, and nothing was written`,
    ];
  }
  const block = result.block;
  lines.push(
    where,
    result.replaced
      ? `${result.dry_run ? "would replace" : "replaced"} the files of ${block.name} (${block.need}) with those of ${result.repository}`
      : `${result.dry_run ? "would promote" : "promoted"} ${block.name} (${block.need}) from ${result.repository}: ${result.replaced ? "" : NO_SECOND_USE}`,
    `  by ${result.by} on ${result.on}, because ${result.why}`,
    `  files: ${block.files.map((file) => file.file).join(", ")}`,
    `  adapters: ${block.adapters.length > 0 ? block.adapters.join(", ") : "none"}${result.adapters_from === "default" ? ` (the kinds a block of code needs that ${result.repository} has; name others with --adapter)` : ""}`,
    `  used by: ${block.used_by.join(", ")}${block.second_use ? "" : `; ${NO_SECOND_USE}`}`,
  );
  if (block.licence) {
    lines.push(
      `  licence: ${block.licence.words} (from ${block.licence.source}; ${block.licence.allowed.by} said on ${block.licence.allowed.on} it allows passing the code on)`,
    );
  }
  lines.push(
    `${result.dry_run ? "would write" : "wrote"}, in the core folder only:`,
    ...result.files.map((file) => `  ${file.change.padEnd(9)} ${file.path}`),
    `nothing was written in ${result.repository}`,
    MEMBERS_LEARN,
    "nothing was committed or sent anywhere",
  );
  return lines;
}
