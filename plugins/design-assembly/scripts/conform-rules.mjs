// The rules an item of an outside source is let off, as the repository turns them off: in a comment
// of one of its files, or for its whole folder in the formatter's ignore list, the lint
// configuration or the type check's configuration (spec 0015). The conform command and intake read
// them the same way, and each needs its exemption in the item's conform record. A rule a row of
// the repository's decision ledger holds is mandatory: no exemption lets an item off it (the
// addendum of spec 0015, item 11.8).
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

import { adapterOf } from "../templates/tools/design-assembly/adapters/index.mjs";
import { libraryFolders } from "../templates/tools/design-assembly/components.mjs";
import { LEDGER, parseLedger } from "../templates/tools/design-assembly/ledger.mjs";
import { SOURCES_FOLDER } from "../templates/tools/design-assembly/sources-ledger.mjs";

// The repository's lint, as its adapter knows it: where its configuration is kept, and how a comment
// that turns a rule off is written.
const LINT = adapterOf("lint");

// The rules a file turns off: each rule a comment of the lint names, `*` for one that names none,
// each rule a comment sets below an error, and `@ts-nocheck`, `@ts-ignore` and `@ts-expect-error`.
export function rulesTurnedOff(code) {
  const rules = new Set();
  for (const [comment] of code.matchAll(LINT?.exception ?? /$^/g)) {
    const listed = comment
      .replace(/^\S*-disable(?:-next-line|-line)?/, "")
      .replace(/\*\/.*$/, "")
      .split("--")[0]
      .split(",")
      .map((each) => each.trim())
      .filter(Boolean);
    if (listed.length === 0) rules.add("*");
    for (const rule of listed) rules.add(rule);
  }
  // A rule set below an error inside the file, the lint's other way to turn one off.
  for (const rule of LINT?.rulesLowered?.(code) ?? []) rules.add(rule);
  for (const word of ["@ts-nocheck", "@ts-ignore", "@ts-expect-error"]) {
    if (code.includes(word)) rules.add(word);
  }
  return [...rules];
}

// The files of the repository's configuration that can turn a rule off for a whole folder, by the
// rule an exemption names: the formatter's ignore list, the lint configuration, the type check's.
export const FOLDER_CONFIGS = {
  "formatter-ignore": [".prettierignore"],
  "lint-config": [...(LINT?.configFiles ?? []), ...(LINT?.ignoreFiles ?? [])],
  "typecheck-exclude": ["tsconfig.json", "tsconfig.app.json", "tsconfig.strict.json"],
};

const readText = (root, file) => {
  const full = path.join(root, file);
  return existsSync(full) ? readFileSync(full, "utf8") : null;
};

// The folders of an item: the folder its source declares, and the folder of each of its files.
function foldersOf(root, record) {
  const folders = new Set();
  try {
    const source = JSON.parse(readText(root, `${SOURCES_FOLDER}/${record.source}.json`) ?? "null");
    if (typeof source?.folder === "string" && source.folder.trim() !== "") {
      folders.add(source.folder.replace(/\/+$/, ""));
    }
  } catch {
    // A source that cannot be read declares no folder; the shape check names it.
  }
  for (const entry of record.conformed ?? []) {
    if (typeof entry?.file === "string") folders.add(path.posix.dirname(entry.file));
  }
  return [...folders].sort((a, b) => a.length - b.length || (a < b ? -1 : 1));
}

// Each rule the repository turns off for the item's folder, with the file of the configuration that
// does it: a file of the configuration that names one of the item's folders. Read as text: a glob
// that covers the folder without naming it is not seen.
export function folderRulesOff(root, record) {
  const folders = foldersOf(root, record);
  const found = [];
  for (const [rule, files] of Object.entries(FOLDER_CONFIGS)) {
    for (const file of files) {
      const text = readText(root, file);
      if (text === null) continue;
      const folder = folders.find((each) => text.includes(each));
      if (folder) found.push({ rule, file, folder });
    }
  }
  return found;
}

// What the item turns off and the record does not let it off, one sentence each: a rule a comment of
// one of its files turns off, and a rule its folder is let off by the configuration.
export function unexempted(root, record, codeOf, mandatory = new Map()) {
  const exempt = new Set((record.exemptions ?? []).map((entry) => `${entry.file}\n${entry.rule}`));
  // A mandatory rule is never exempted: mandatoryOff names it, to be patched.
  const held = (rule) => mandatory.has(rule) || (mandatory.size > 0 && rule === EVERY_RULE);
  const lines = [];
  for (const entry of record.conformed ?? []) {
    const code = codeOf(entry.file);
    if (code === null) continue;
    for (const rule of rulesTurnedOff(code)) {
      if (held(rule)) continue;
      if (!exempt.has(`${entry.file}\n${rule}`)) {
        lines.push(
          `${entry.file} turns off ${rule}, and the conform record has no exemption for that rule in that file`,
        );
      }
    }
  }
  for (const { rule, file, folder } of folderRulesOff(root, record)) {
    if (mandatory.size > 0 && rule === WHOLE_LINT && !inBaseLibrary(root, folder)) continue;
    if (!exempt.has(`${file}\n${rule}`)) {
      lines.push(
        `${file} names the folder ${folder} of the item, so ${rule} is turned off for it, and the record has no exemption ${rule} for ${file}`,
      );
    }
  }
  return lines;
}

// ---- mandatory rules ----------------------------------------------------------------------------------

// What a comment that names no rule turns off: every rule.
export const EVERY_RULE = "*";
// The exemption that lets a whole folder off the lint, every rule of it.
const WHOLE_LINT = "lint-config";

// The rules the repository holds mandatory, each with the decisions that hold it: a row of the
// decision ledger whose check points at the rule, as the lint's adapter writes it, and a check of
// the tool data that runs it. The
// list is the repository's own; a repository whose ledger points at no rule has none.
export function mandatoryRules(root) {
  const held = new Map();
  const hold = (rule, id) => {
    if (typeof rule !== "string" || rule.trim() === "") return;
    held.set(rule, [...new Set([...(held.get(rule) ?? []), String(id)])]);
  };
  // With no lint the adapters know, no rule can be pointed at.
  if (!LINT?.prefix) return held;
  const prefix = `${LINT.prefix}:`;
  try {
    for (const row of parseLedger(readText(root, LEDGER) ?? "")) {
      const check = typeof row.check === "string" ? row.check.trim() : "";
      if (check.startsWith(prefix)) hold(check.slice(prefix.length), row.id);
    }
  } catch {
    // A ledger that cannot be read holds nothing here; its own check names it.
  }
  try {
    const theme = JSON.parse(readText(root, "design/theme.json") ?? "null");
    for (const [id, checks] of Object.entries(theme?.checks ?? {})) {
      for (const check of Array.isArray(checks) ? checks : []) {
        if (check?.kind === "lint") hold(check.rule, id);
      }
    }
  } catch {
    // Tool data that cannot be read holds nothing here.
  }
  return held;
}

// The decisions that hold a rule, in words.
const heldBy = (ids) =>
  ids.length > 1 ? `the decisions ${ids.join(", ")} hold` : `the decision ${ids[0]} holds`;
// Every mandatory rule with its decisions, in words, for what turns every rule off.
const everyHeld = (mandatory) =>
  [...mandatory].map(([rule, ids]) => `${rule} (${ids.join(", ")})`).join(", ");

// Whether a folder is the base library's own, which the repository's configuration sets apart
// before any item comes: its files are the library's parts, held by the repository's rule for them.
function inBaseLibrary(root, folder) {
  const [base] = libraryFolders(root);
  return Boolean(base) && (folder === base || folder.startsWith(`${base}/`));
}

// Each way the item turns a mandatory rule off, one sentence each, whatever its record exempts: an
// exemption of the rule, a comment of one of its files that turns it off or turns every rule off,
// and a lint configuration or ignore file that sets a folder of the item apart, which is every
// rule. The base library's own folder is the repository's, not the item's.
export function mandatoryOff(root, record, codeOf, mandatory = mandatoryRules(root)) {
  if (mandatory.size === 0) return [];
  const lines = [];
  for (const entry of record.exemptions ?? []) {
    const ids = mandatory.get(entry.rule);
    if (ids) {
      lines.push(
        `the record exempts ${entry.rule}, which ${heldBy(ids)}, for ${entry.file}: a mandatory rule is never exempted; patch the code, and take the exemption out of the record`,
      );
    }
  }
  for (const entry of record.conformed ?? []) {
    const code = codeOf(entry.file);
    if (code === null) continue;
    for (const rule of rulesTurnedOff(code)) {
      const ids = mandatory.get(rule);
      if (ids) {
        lines.push(
          `${entry.file} turns off ${rule}, which ${heldBy(ids)}: a mandatory rule is patched, never turned off`,
        );
      } else if (rule === EVERY_RULE) {
        lines.push(
          `${entry.file} turns off every rule with a comment that names none, among them the mandatory ${everyHeld(mandatory)}: name the rules it turns off`,
        );
      }
    }
  }
  for (const { rule, file, folder } of folderRulesOff(root, record)) {
    if (rule !== WHOLE_LINT || inBaseLibrary(root, folder)) continue;
    lines.push(
      `${file} sets the folder ${folder} of the item apart from every rule of the lint, among them the mandatory ${everyHeld(mandatory)}: hold the folder to them, and patch the code`,
    );
  }
  return [...new Set(lines)];
}

// Why an exemption the conform command is asked to record cannot be, or null: a mandatory rule, a
// comment that names no rule, or a lint configuration that sets a folder of the item apart.
export function exemptionRefused(root, record, { rule, file }, mandatory = mandatoryRules(root)) {
  if (mandatory.size === 0) return null;
  const ids = mandatory.get(rule);
  if (ids) {
    return `${rule} is mandatory, for ${heldBy(ids)} it: a mandatory rule is never exempted; patch the code instead`;
  }
  if (rule === EVERY_RULE) {
    return `${EVERY_RULE} is every rule, among them the mandatory ${everyHeld(mandatory)}: exempt the rules by name`;
  }
  if (rule === WHOLE_LINT) {
    const apart = folderRulesOff(root, record).find(
      (each) => each.rule === WHOLE_LINT && each.file === file && !inBaseLibrary(root, each.folder),
    );
    if (apart) {
      return `${file} sets the folder ${apart.folder} of the item apart from every rule of the lint, among them the mandatory ${everyHeld(mandatory)}: hold the folder to them`;
    }
  }
  return null;
}
