// What a repository's brand assets are, read from its rows of the sources ledger, and what they lack
// (spec 0017, criteria 14 and 15): the mark by role and variant, and the icon set with its sizes and
// its stroke. Status and audit say what is lacking without turning the gate red, each with the step
// that fills it; the handoff book shows the rows. A repository with no row of the two kinds has
// nothing here, and nothing is said.
import { readFileSync } from "node:fs";
import path from "node:path";

import {
  readIconSets,
  readLogoSources,
} from "../templates/tools/design-assembly/sources-ledger.mjs";

// What a person answers of an icon set, read from its row as written: no reader of the tool keeps it.
function answered(root, file) {
  try {
    const row = JSON.parse(readFileSync(path.join(root, file), "utf8"));
    const sizes = Array.isArray(row.sizes)
      ? row.sizes.filter((size) => typeof size === "number")
      : [];
    return { sizes, stroke: typeof row.stroke === "number" ? row.stroke : null };
  } catch {
    return { sizes: [], stroke: null };
  }
}

// The brand assets as rows, or null when the repository has no row of either kind.
export function brandAssets(root) {
  const marks = readLogoSources(root);
  const sets = readIconSets(root);
  if (marks.length === 0 && sets.length === 0) return null;
  return {
    marks: marks.map((mark) => ({
      row: mark.file,
      id: mark.id,
      title: mark.title,
      licence: mark.licence,
      // Where the licence came from when no person wrote it, or null.
      licence_from: mark.licence_from,
      files: (mark.pin?.files ?? []).map((entry) => ({
        file: entry.file,
        role: entry.role,
        variant: entry.variant,
        sha256: entry.sha256,
      })),
      // How the pin differs from the files the repository holds now, or null.
      differs: mark.drift[0] ?? mark.problems[0] ?? null,
    })),
    icons: sets.map((set) => ({
      row: set.file,
      id: set.id,
      title: set.title,
      module: set.module,
      folder: set.folder,
      from: set.from,
      licence: set.licence,
      licence_from: set.licence_from,
      ...answered(root, set.file),
      differs: set.drift[0] ?? set.problems[0] ?? null,
    })),
  };
}

// What the brand assets lack, one entry per lack, each with the row it is about and the step that
// fills it. Nothing here is red: no check holds these, and the gate does not turn red for them.
export function brandGaps(root) {
  const assets = brandAssets(root);
  if (assets === null) return [];
  const gaps = [];
  for (const mark of assets.marks) {
    if (mark.files.length === 0) continue;
    const into = `logo-source --into ${mark.id}`;
    if (!mark.files.some((file) => file.variant === "mono")) {
      gaps.push({
        row: mark.row,
        what: `the mark ${mark.title} has no one-colour variant`,
        next: `draw one, by hand or with a plug of the brand assets socket (plugs lists them), then add it with ${into} --file PATH:ROLE:mono`,
      });
    }
    if (!mark.files.some((file) => file.role === "favicon")) {
      gaps.push({
        row: mark.row,
        what: `the mark ${mark.title} has no page icon`,
        next: `add the file the page declares with ${into} --file PATH:favicon:VARIANT`,
      });
    }
  }
  for (const set of assets.icons) {
    if (set.sizes.length > 0) continue;
    gaps.push({
      row: set.row,
      what: `the icon set ${set.title} records no sizes`,
      next: `write the sizes the screens use, in px, into sizes of ${set.row}, a person's answer: icon-source writes the row and not its sizes`,
    });
  }
  return gaps;
}

// The lines that say each lack, as status and audit print them.
export const gapLines = (gaps) => gaps.map((gap) => `${gap.row}: ${gap.what}; next: ${gap.next}`);
