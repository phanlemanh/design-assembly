// The rows of the intake ledger for the pieces of the starter kit a build lays. A piece the build
// lays is the starter kit's, at the plugin's version, and the ledger says so as the build writes
// it: with the need the piece answers and the hash of its file as laid, so that the gate's rule
// "choose before making" does not read it as made by the branch, find names its true source, and
// the inventory sees a later edit. The owner's go-ahead to build is the approval: no question is
// asked for a piece, and no person is named on its row.
//
// A piece is recorded when the file it is held by is what the build lays for it: laid by this run,
// or still as laid on a repository built before the build wrote rows. A file the repository has
// edited is not the starter kit's any more, and is left to the gate. A row the ledger has, by its
// file or its need, is never written over or written twice; nor is a piece the ledger's list of
// what came before names, by its file or its name: the repository has recorded it already.
import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { readIntakeLedger, spellingOf } from "../templates/tools/design-assembly/intake-ledger.mjs";
import { joinFound, readFragments } from "../templates/tools/design-assembly/screen-fragments.mjs";
import { today } from "./asking.mjs";
import { ledgerWith } from "./intake-write.mjs";
import { VERSION } from "./stamp.mjs";

const PLUGIN = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const STARTER = JSON.parse(readFileSync(path.join(PLUGIN, "references/starter.json"), "utf8"));

// The source and the pin of a piece of the starter kit, as intake writes them when it copies one.
export const STARTER_SOURCE = "starter";
export const starterPin = () => `design-assembly ${VERSION}`;

const read = (root, file) =>
  existsSync(path.join(root, file)) ? readFileSync(path.join(root, file), "utf8") : null;
const sha = (content) => createHash("sha256").update(content).digest("hex");
const words = (value) => (value === undefined || value === null ? "" : String(value));

// The intake ledger at `file` as one text, in whichever shape the repository keeps it.
function ledgerText(root, file) {
  const found = readFragments(root, file, "intake");
  return found ? joinFound(found) : read(root, file);
}

// The rows for the pieces this build lays, or that a build laid and nobody changed. `files` are the
// files this run writes; `placeOf(template)` is where the build puts a template, or null;
// `asLaid(template)` is the text the build lays for it; `onMain(file)` says the main branch has the
// file.
export function starterRows(
  root,
  { file, files, placeOf, asLaid, onMain = () => false, day = today() },
) {
  const ledger = readIntakeLedger(ledgerText(root, file));
  const listed = (value) => (Array.isArray(value) ? value : []);
  const held = listed(ledger?.blocks);
  const before = listed(ledger?.before);
  const recorded = new Set([...held, ...before].map((entry) => words(entry?.file)));
  const answered = new Set(held.map((block) => words(block?.need)));
  const named = new Set(before.map((entry) => words(entry?.name)));
  return STARTER.items.flatMap((item) => {
    const [template] = item.files;
    const place = placeOf(template);
    if (!place || recorded.has(place) || answered.has(item.need) || named.has(item.name)) return [];
    const there = read(root, place);
    // A piece already on the disk is recorded only where the gate would hold it: a file the branch
    // adds. One the main branch has is the repository's as it stands, and its answers do not move.
    if (there !== null && onMain(place)) return [];
    const after = files[place] ?? there;
    if (after === null || after === undefined || after !== asLaid(template)) return [];
    return [
      {
        name: item.name,
        file: place,
        source: STARTER_SOURCE,
        from: STARTER_SOURCE,
        pin: starterPin(),
        need: item.need,
        ...(item.description ? { description: item.description } : {}),
        approved: day,
        taken: sha(after),
      },
    ];
  });
}

// The files that write those rows into the ledger: one call for a ledger kept as one file, one new
// file per row for a ledger kept as one file per block. Nothing when there is no row.
export function starterIntakeFiles(root, file, rows) {
  if (rows.length === 0) return {};
  const spelled = readIntakeLedger(ledgerText(root, file))?.spelled ?? spellingOf({});
  if (readFragments(root, file, "intake") === null) {
    return ledgerWith(root, file, "blocks", rows, spelled);
  }
  return Object.assign({}, ...rows.map((row) => ledgerWith(root, file, "blocks", [row], spelled)));
}
