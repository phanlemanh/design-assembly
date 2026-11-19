// Writing to the intake ledger: one block added, or entries added to its list of what came before
// it, in whichever shape the repository keeps it (one file, or one file per block) and in the
// repository's own spelling of each key. Everything is made in memory and read back with the
// reader every tool uses before it is given to be written: a ledger that would not read back with
// the new entry, and every entry it had, is never written.
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

import { readIntakeLedger } from "../templates/tools/design-assembly/intake-ledger.mjs";
import { joinFound, readFragments } from "../templates/tools/design-assembly/screen-fragments.mjs";
import { fragmentsFolder } from "../templates/tools/design-assembly/screen-ledger.mjs";
import { FRAGMENTS_SHARED } from "../templates/tools/design-assembly/screen-ledger.mjs";
import { Refusal } from "./command.mjs";

const HEADER = [
  "# The intake ledger: one entry per block the repository took in, with the need it answers, where",
  "# it came from and at which pin, and who approved it on which day. intake writes an entry once the",
  "# owner answered for it.",
];

// A value as the ledgers' reader reads it back: plain where it can be, else quoted. The reader
// undoes no escape, so a value that holds both quotes, a line break, or reads as nothing, cannot
// be written.
export function yamlValue(value) {
  const said = String(value);
  if (said === "" || /[\r\n]/.test(said) || /^(null|~)$/i.test(said)) {
    throw new Refusal(`${JSON.stringify(said)} cannot be written to the ledger as a value`);
  }
  const plain = !/^[\s\-?:,[\]{}#&*!|>'"%@`]/.test(said) && !/(:\s|\s#|:$|\s$)/.test(said);
  if (plain) return said;
  if (!said.includes('"')) return `"${said}"`;
  if (!said.includes("'")) return `'${said}'`;
  throw new Refusal(`${said} holds both quotes, so the ledger cannot keep it`);
}

// The lines of one entry, its keys in the repository's spelling, at the indent given: the first
// line opens the entry of a list with a dash, unless the entry is a file of its own.
function entryLines(entry, spelled, { indent = "  ", list = true } = {}) {
  return Object.entries(entry).map(([key, value], index) => {
    const own = spelled[key];
    if (own === null || own === undefined) {
      throw new Refusal(
        `the intake ledger gives no spelling for ${key}: add one under keys, then ask again`,
      );
    }
    const line = `${own}: ${yamlValue(value)}`;
    if (!list) return line;
    return index === 0 ? `${indent}- ${line}` : `${indent}  ${line}`;
  });
}

// The text with entries added to the list under `key` at the top level: after its last entry, in
// place of `[]`, or as a new list at the end when the text has none.
function withEntries(text, key, entries, spelled) {
  const lines = text.split("\n");
  const at = lines.findIndex((line) => new RegExp(`^${key}:(\\s|$)`).test(line));
  const added = entries.flatMap((entry) => entryLines(entry, spelled));
  if (at === -1) {
    const body = lines.at(-1) === "" ? lines.slice(0, -1) : lines;
    return [...body, `${key}:`, ...added, ""].join("\n");
  }
  const rest = lines[at].slice(key.length + 1).trim();
  if (rest === "[]")
    return [...lines.slice(0, at), `${key}:`, ...added, ...lines.slice(at + 1)].join("\n");
  if (rest !== "" && !rest.startsWith("#")) {
    throw new Refusal(
      `the list ${key} of the intake ledger is written on one line: write it one entry per line, then ask again`,
    );
  }
  let last = at;
  for (let index = at + 1; index < lines.length; index += 1) {
    const line = lines[index];
    if (line.trim() === "" || line.trim().startsWith("#")) continue;
    if (/^\s/.test(line) || /^-(\s|$)/.test(line)) last = index;
    else break;
  }
  // Entries take the indent of the list's own first entry.
  const first = lines.slice(at + 1, last + 1).find((line) => /^\s*-(\s|$)/.test(line));
  const indent = first ? /^(\s*)-/.exec(first)[1] : "  ";
  const placed = entries.flatMap((entry) => entryLines(entry, spelled, { indent }));
  return [...lines.slice(0, last + 1), ...placed, ...lines.slice(last + 1)].join("\n");
}

// Two lists of entries are the same when they hold the same entries, whatever their order: a ledger
// kept as one file per block reads its blocks in the order of their files' names.
const same = (a, b) => {
  const lines = (list) => list.map((entry) => JSON.stringify(entry)).sort();
  return JSON.stringify(lines(a)) === JSON.stringify(lines(b));
};

// Whether a ledger text reads back as the one before with the entries added to `part`, and
// everything else as it was.
function readsBack(before, after, part, entries) {
  const was = before === null ? { blocks: [] } : readIntakeLedger(before);
  const now = readIntakeLedger(after);
  const old = was[part] ?? [];
  const other = part === "blocks" ? "before" : "blocks";
  return (
    Array.isArray(now[part]) &&
    same(now[part], [...old, ...entries]) &&
    same(now[other] ?? [], was[other] ?? [])
  );
}

const read = (root, file) =>
  existsSync(path.join(root, file)) ? readFileSync(path.join(root, file), "utf8") : null;

// The files to write so that the ledger at `file` holds the entries added to `part`: "blocks" or
// "before". `spelled` is the repository's spelling of each key, the contract's when it has no
// ledger yet. A block of a ledger kept as one file per block is a new file named after its need.
export function ledgerWith(root, file, part, entries, spelled) {
  const listKey = spelled[part];
  if (listKey === null || listKey === undefined) {
    throw new Refusal(
      `the intake ledger gives no spelling for ${part}: add one under keys, then ask again`,
    );
  }
  const refused = () =>
    new Refusal(
      `the intake ledger would not read back with the new ${part === "blocks" ? "block" : "entries"} and every entry it had, so nothing was written`,
    );
  const found = readFragments(root, file, "intake");
  if (found) {
    const joined = joinFound(found);
    if (part === "blocks") {
      const [entry] = entries;
      const name = `${fragmentsFolder(file)}/${entry.need}.yaml`;
      if (read(root, name) !== null) throw new Refusal(`${name} is there already`);
      const content = `${entryLines(entry, spelled, { list: false }).join("\n")}\n`;
      const fragments = [
        ...found.fragments,
        { name: `${entry.need}.yaml`, file: name, text: content },
      ];
      if (!readsBack(joined, joinFound({ ...found, fragments }), part, entries)) throw refused();
      return { [name]: content };
    }
    const shared = `${fragmentsFolder(file)}/${FRAGMENTS_SHARED}`;
    const content = withEntries(found.shared, listKey, entries, spelled);
    if (!readsBack(joined, joinFound({ ...found, shared: content }), part, entries))
      throw refused();
    return { [shared]: content };
  }
  const before = read(root, file);
  const start =
    before ??
    [...HEADER, "version: 1", part === "blocks" ? "blocks:" : "blocks: []", ""].join("\n");
  const content = withEntries(start, listKey, entries, spelled);
  if (!readsBack(before, content, part, entries)) throw refused();
  return { [file]: content };
}
