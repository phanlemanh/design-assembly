// The rules an item of an outside source is let off, as the repository turns them off: in a comment
// of one of its files, or for its whole folder in the formatter's ignore list, the lint
// configuration or the type check's configuration (spec 0015). The conform command and intake read
// them the same way, and each needs its exemption in the item's conform record.
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

import { adapterOf } from "../templates/tools/design-assembly/adapters/index.mjs";
import { SOURCES_FOLDER } from "../templates/tools/design-assembly/sources-ledger.mjs";

// The repository's lint, as its adapter knows it: where its configuration is kept, and how a comment
// that turns a rule off is written.
const LINT = adapterOf("lint");

// The rules a file turns off: each rule a comment of the lint names, `*` for one that names none,
// and `@ts-nocheck`, `@ts-ignore` and `@ts-expect-error`.
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
  for (const word of ["@ts-nocheck", "@ts-ignore", "@ts-expect-error"]) {
    if (code.includes(word)) rules.add(word);
  }
  return [...rules];
}

// The files of the repository's configuration that can turn a rule off for a whole folder, by the
// rule an exemption names: the formatter's ignore list, the lint configuration, the type check's.
export const FOLDER_CONFIGS = {
  "formatter-ignore": [".prettierignore"],
  "lint-config": LINT?.configFiles ?? [],
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
export function unexempted(root, record, codeOf) {
  const exempt = new Set((record.exemptions ?? []).map((entry) => `${entry.file}\n${entry.rule}`));
  const lines = [];
  for (const entry of record.conformed ?? []) {
    const code = codeOf(entry.file);
    if (code === null) continue;
    for (const rule of rulesTurnedOff(code)) {
      if (!exempt.has(`${entry.file}\n${rule}`)) {
        lines.push(
          `${entry.file} turns off ${rule}, and the conform record has no exemption for that rule in that file`,
        );
      }
    }
  }
  for (const { rule, file, folder } of folderRulesOff(root, record)) {
    if (!exempt.has(`${file}\n${rule}`)) {
      lines.push(
        `${file} names the folder ${folder} of the item, so ${rule} is turned off for it, and the record has no exemption ${rule} for ${file}`,
      );
    }
  }
  return lines;
}
