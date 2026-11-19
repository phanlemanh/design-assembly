// The repository's store, read the same way by every command that reads it: the tool data, the
// intake ledger, and the components. find and inventory read it through here, so a block, a file
// or a component means the same thing to both.
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

import {
  libraryFolders,
  ownFolder,
  readComponents,
  readFolder,
  regenerated,
} from "../templates/tools/design-assembly/components.mjs";
import { newerProblem } from "../templates/tools/design-assembly/contract.mjs";
import {
  INTAKE_LEDGER,
  readIntakeLedger,
} from "../templates/tools/design-assembly/intake-ledger.mjs";
import { ledgerText, readFragments } from "../templates/tools/design-assembly/screen-fragments.mjs";
import { fragmentsFolder } from "../templates/tools/design-assembly/screen-ledger.mjs";
import { readYaml } from "../templates/tools/design-assembly/yaml.mjs";
import { plural } from "./document.mjs";

export const isMap = (value) =>
  value !== null && typeof value === "object" && !Array.isArray(value);

// A value a person wrote as words: a string, or a number or a yes and no written bare. A list or a
// map is not words, and is left out rather than printed as such.
export const text = (value) =>
  typeof value === "string"
    ? value
    : typeof value === "number" || typeof value === "boolean"
      ? String(value)
      : null;

// A file a ledger names, written the way the components are: forward slashes, no `./`.
export const fileOf = (value) => {
  const said = text(value);
  return said ? path.posix.normalize(said.replaceAll("\\", "/")) : null;
};

// Whether a path the tool data names stays inside the repository.
export const insideRoot = (root, file) => {
  const relative = path.relative(path.resolve(root), path.resolve(root, file));
  return !relative.startsWith("..") && !path.isAbsolute(relative);
};

// What a pin says, in a few words: the day it was fetched, or its version.
export const pinOf = (pin) => text(pin?.fetched_at) ?? text(pin?.version) ?? null;

// The tool data, or null when the repository has none. Data that is not JSON is a repository that
// cannot be read: the call ends with 2.
export function readTheme(root) {
  const file = path.join(root, "design/theme.json");
  return existsSync(file) ? JSON.parse(readFileSync(file, "utf8")) : null;
}

// The file the intake ledger is kept at: the one the shapes check names, else the usual one.
export function intakeFileOf(theme) {
  const named = Object.values(theme?.checks ?? {})
    .flat()
    .map((check) => check?.ledgers?.intake)
    .find((file) => typeof file === "string");
  return named ?? INTAKE_LEDGER;
}

// The intake ledger, read in the contract's keys: where it is kept, what was read, its blocks (the
// entries that are maps), what was left out and why, or why it could not be read at all.
export function readIntake(root, theme) {
  const file = intakeFileOf(theme);
  const kept = readFragments(root, file, "intake") ? `${fragmentsFolder(file)}/` : file;
  const found = { file, kept, read: null, ledger: null, blocks: [], notes: [], why: null };
  if (!insideRoot(root, file)) {
    return {
      ...found,
      why: `${file}, the intake ledger the tool data names, is outside the repository`,
    };
  }
  const said = ledgerText(root, file, "intake");
  if (said === null) return { ...found, why: `no intake ledger at ${file}` };
  const newer = newerProblem("intake", readYaml(said), kept);
  if (newer) return { ...found, read: [kept], why: newer };
  const ledger = readIntakeLedger(said);
  const listed = ledger.blocks ?? [];
  const entries = Array.isArray(listed) ? listed : [];
  const blocks = entries.filter(isMap);
  const odd = entries.length - blocks.length;
  const notes = [
    ...(Array.isArray(listed) ? [] : [`${kept}: its blocks are not a list`]),
    ...(odd > 0
      ? [`${plural(odd, "entry is not a block", "entries are not blocks")}, left out`]
      : []),
  ];
  return { ...found, read: [kept], ledger, blocks, notes };
}

// The components of the repository, as the tool's manifest would list them now; where the tool
// data names no manifest, read through the components adapter from the library's folder and the
// repository's own beside it.
export function componentsOf(root) {
  let made;
  try {
    made = regenerated(root);
  } catch (error) {
    return {
      read: null,
      problem: `the component-manifest check of design/theme.json cannot be read: ${error.message}`,
      components: [],
    };
  }
  if (made) return { read: made.read, components: made.data.components };
  const folders = libraryFolders(root);
  const read = ownFolder(folders[0]) ?? folders[0];
  if (!existsSync(path.join(root, read))) return { read: null, missing: read, components: [] };
  try {
    return {
      read,
      components: readComponents(readFolder(root, read), { library: folders }).components,
    };
  } catch (error) {
    return { read: null, problem: `${read} cannot be read: ${error.message}`, components: [] };
  }
}
