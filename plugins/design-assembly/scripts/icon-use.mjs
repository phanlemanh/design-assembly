// What the plugin says and lays about the icons the code uses (spec 0017, item 12.1, slice 2): the
// list of icon packages, a reference file a person edits; the row `icons` of the decision
// ledger, which answers the standard question by pointing at the icon set row, and the check of the
// gate that holds it; and the icon set the guide recommends to a repository that has none, read
// from the plugin's data. Nothing here fetches, installs or draws.
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { pinnedPackage } from "../templates/tools/design-assembly/adapters/lockfile.mjs";
import {
  inLibrary,
  keepsSettings,
  libraryParts,
} from "../templates/tools/design-assembly/components.mjs";
import {
  iconUseProblems,
  importsOf,
  packageOf,
  readSources,
} from "../templates/tools/design-assembly/governance.mjs";
import { lineWidth, renderJson } from "../templates/tools/design-assembly/json.mjs";
import {
  LEDGER,
  mergeLedger,
  parseLedger,
  TOOL,
} from "../templates/tools/design-assembly/ledger.mjs";
import { sourceFolder } from "../templates/tools/design-assembly/source-folders.mjs";
import {
  ICON_USE_CHECK,
  readIconSets,
} from "../templates/tools/design-assembly/sources-ledger.mjs";
import { toolPredates } from "./tool-knows.mjs";

const PLUGIN = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const readJson = (file) => JSON.parse(readFileSync(path.join(PLUGIN, file), "utf8"));

// The icon packages the plugin knows, by the name code imports them from.
export const ICON_PACKAGES = readJson("references/icon-packages.json").packages;
// The id of the standard question the row answers.
export const ICONS_ROW = "icons";
const THEME = "design/theme.json";

const readText = (root, file) => {
  const full = path.join(root, file);
  return existsSync(full) ? readFileSync(full, "utf8") : null;
};

// The check of the icons used, as it is laid for the icon set row `file`: the folder of source it
// reads, and the list of icon packages as it is today.
export const iconsCheck = (root, file) => ({
  ...ICON_USE_CHECK,
  source: file,
  sources: sourceFolder(root).folder,
  packages: ICON_PACKAGES,
});

// The row of the decision ledger that answers `icons` with the icon set row `file`.
export const iconsRow = (file) => ({
  id: ICONS_ROW,
  layer: "components",
  kind: "standard",
  source: file,
  check: TOOL,
});

// The sentence that says why the check is not laid here, or null: the repository's copy of the tool,
// the one its gate runs, does not know the check, and would read it as unknown.
export function iconUsePredates(root) {
  const older = toolPredates(root, {
    file: "check.mjs",
    word: "ICON_USE_CHECK",
    part: `the check ${ICON_USE_CHECK.kind}`,
  });
  if (older === null) return null;
  return `the repository's copy of the tool, tools/design-assembly, predates the check ${ICON_USE_CHECK.kind}, so the gate does not hold yet which icons the code uses: bring the tool up with upgrade, which lays it`;
}

// The tool data and the decision ledger with `icons` answered by the icon set row `file`, or null
// where the gate is not installed or the tool data already holds icons. A row of icons a person
// wrote is never written over: `kept` says what it leaves unheld. `themeText` is the tool data as it is to be written.
// A copy of the tool that predates the check gets nothing, and the sentence that says why.
// `toolKnows` says the tool written in the same run knows the check, as an upgrade's does.
export function iconsDecision(
  root,
  { file, themeText = readText(root, THEME), toolKnows = false },
) {
  const ledgerText = readText(root, LEDGER);
  if (themeText === null || ledgerText === null) return null;
  let theme;
  try {
    theme = JSON.parse(themeText);
  } catch {
    return null;
  }
  if (!theme?.checks || typeof theme.checks !== "object") return null;
  if (ICONS_ROW in theme.checks) return null;
  // A row of icons a person wrote, held by another proof or by none, stays theirs; what that leaves
  // unheld is said, with the way to have it held.
  if (parseLedger(ledgerText).some((row) => row.id === ICONS_ROW)) {
    return {
      kept: `${LEDGER} answers icons already: the row is left as it is, so the gate does not hold which icons the code uses; to have it held, take that row out and run upgrade, which answers icons with ${file}`,
    };
  }
  const predates = toolKnows ? null : iconUsePredates(root);
  if (predates) return { predates };
  const checks = { ...theme.checks, [ICONS_ROW]: [iconsCheck(root, file)] };
  return {
    theme: renderJson({ ...theme, checks }, lineWidth(root)),
    ledger: mergeLedger(ledgerText, [iconsRow(file)]),
  };
}

// An icon set row written now, `content` at `file`, as the gate reads one: what it imports from and
// where its files are. Its pin is the lockfile's as the row was made, so nothing has drifted.
export function proposedIconSet(file, content) {
  const row = JSON.parse(content);
  return {
    id: row.id,
    file,
    module: row.module ?? row.pin?.package ?? null,
    folder: row.folder ?? null,
    pin: row.pin,
    drift: [],
  };
}

// Where the code does not take its icons from the icon sets `sets` today, as the check would say.
export function iconsToday(root, sets) {
  const library = keepsSettings(root) ? libraryParts(root) : [];
  return iconUseProblems(readSources(root, sourceFolder(root).folder), {
    sets,
    packages: ICON_PACKAGES,
    library: (file) => inLibrary(file, library),
  });
}

// The icon packages the pieces of the starter kit import, each with the pieces that import it,
// read from the table of pieces and the templates they are made of: data, not this code.
export function starterIconSets() {
  const found = new Map();
  for (const item of readJson("references/starter.json").items) {
    for (const file of item.files) {
      const full = path.join(PLUGIN, "templates/owned", file);
      if (!existsSync(full)) continue;
      for (const name of importsOf(readFileSync(full, "utf8"))) {
        const known = packageOf(name, ICON_PACKAGES);
        if (known) found.set(known, [...new Set([...(found.get(known) ?? []), item.name])]);
      }
    }
  }
  return [...found].map(([name, pieces]) => ({ package: name, pieces }));
}

// The icon packages the repository's code imports today, each with how many files import it.
export function codeIconSets(root) {
  const counted = new Map();
  for (const text of Object.values(readSources(root, sourceFolder(root).folder))) {
    const names = new Set(importsOf(text).map((name) => packageOf(name, ICON_PACKAGES)));
    for (const name of names) if (name) counted.set(name, (counted.get(name) ?? 0) + 1);
  }
  return [...counted]
    .sort((a, b) => b[1] - a[1] || ICON_PACKAGES.indexOf(a[0]) - ICON_PACKAGES.indexOf(b[0]))
    .map(([name, files]) => ({ package: name, files }));
}

// The icon set the guide recommends: none where the ledger has an icon set row; the set the code
// already imports most, where it imports one; else the set the starter kit's pieces import, so the
// repository holds one set and not two. With where the lockfile stands on it.
export function recommendedIconSet(root) {
  const [row] = readIconSets(root);
  if (row) return { row: row.file };
  const [used] = codeIconSets(root);
  const starter = [...starterIconSets()].sort((a, b) => b.pieces.length - a.pieces.length)[0];
  const chosen = used
    ? { package: used.package, because: "imported", files: used.files }
    : starter
      ? { package: starter.package, because: "starter", pieces: starter.pieces }
      : null;
  if (chosen === null) return { none: true };
  const locked = pinnedPackage(root, chosen.package);
  return { ...chosen, lockfile: locked.lockfile ?? null, version: locked.version ?? null };
}
