// An icon drawn beyond the pinned set goes up the ladder of spec 0015 (spec 0017, criterion 18): the
// pinned set first, drawing the last rung. The file, drawn by a person or an outside plug and kept
// in the repository, is recorded only when no pinned set has an icon of that name; its row says
// the need and why the set did not answer it; and it stays in the folder of an icon set row, which
// the check of the icons used does not read. Nothing is drawn, fetched or installed here: a set is
// read from the files the repository already holds.
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";

import { Refusal } from "./command.mjs";
import { filesPin } from "./font-source.mjs";
import { shapeProblems } from "../templates/tools/design-assembly/contract.mjs";
import { lineWidth, renderJson } from "../templates/tools/design-assembly/json.mjs";
import {
  ICON_DRAWN,
  inside,
  readIconSets,
} from "../templates/tools/design-assembly/sources-ledger.mjs";
import { toolPredates } from "./tool-knows.mjs";

// The most files of an installed package read for the names of its icons: past them, the names
// cannot be read whole, and nothing is recorded.
const MOST_FILES = 50000;
// The files of a package that hold code or a drawing, whose names may be icons' names; a file named
// index is the package's way in, never an icon.
const ICON_FILE = /\.(?:c|m)?[jt]sx?$|\.svg$/;
const NOT_AN_ICON = new Set(["index"]);

// An icon's name as one dashed lowercase word: SealCheck, seal_check and seal-check are one name.
export const iconName = (name) =>
  String(name ?? "")
    .trim()
    .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
    .replace(/([A-Z])([A-Z][a-z])/g, "$1-$2")
    .replace(/[\s_]+/g, "-")
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

// The name a file gives the icon it holds: its name up to the first dot.
const nameOfFile = (file) => iconName(path.posix.basename(String(file)).split(".")[0]);

// The names of the files of code or drawing under an installed package, its own packages left out.
// It throws past `most` files: a set read in part could lack an icon it has.
export function namesUnder(full, { most = MOST_FILES, said = full } = {}) {
  const names = new Set();
  const stack = [full];
  let read = 0;
  while (stack.length > 0) {
    const folder = stack.pop();
    for (const entry of readdirSync(folder, { withFileTypes: true })) {
      if (entry.name.startsWith(".") || entry.name === "node_modules") continue;
      if (entry.isDirectory()) stack.push(path.join(folder, entry.name));
      else if (entry.isFile() && ICON_FILE.test(entry.name)) {
        read += 1;
        if (read > most) {
          throw new Refusal(
            `${said} holds more than ${most} files, so the names of its icons cannot be read whole: a person decides whether it has the icon. Nothing was written`,
          );
        }
        const name = nameOfFile(entry.name);
        if (!NOT_AN_ICON.has(name)) names.add(name);
      }
    }
  }
  return names;
}

// Whether a pinned set has an icon of the name, read from what the repository holds: a package by
// the names of its installed files, a folder by the names of the files its row pins (the drawn file
// itself left out). It throws where a package is not installed, so nothing could be read.
function setHas(root, set, name, drawnFile) {
  if (set.pin?.package) {
    const full = path.join(root, "node_modules", set.pin.package);
    if (!existsSync(full) || !statSync(full).isDirectory()) {
      throw new Refusal(
        `${set.pin.package} is not installed here, so whether it has an icon ${name} cannot be read: install it as the repository installs a package; nothing is fetched here. Nothing was written`,
      );
    }
    return namesUnder(full, { said: set.pin.package }).has(name);
  }
  return (set.pin?.files ?? []).some(
    (entry) => entry.file !== drawnFile && nameOfFile(entry.file) === name,
  );
}

// Why the repository's copy of the tool cannot hold a drawn icon, or null.
const drawnPredates = (root) =>
  toolPredates(root, {
    file: "sources-ledger.mjs",
    word: "ICON_DRAWN",
    part: "the drawn icons of an icon set row",
  });

// The row a drawn icon is written into, as it would be written: the row of the folder that holds
// the file, with the file added to its pin and to its drawn icons, or a new row for that folder.
// `rowOf` writes a new row of an icon set from a folder, as icon-source --folder does.
function drawnRow(root, { file, entry, sets, on, rowOf }) {
  const holder = sets.find((set) => set.folder && file.startsWith(`${set.folder}/`));
  if (!holder) {
    const written = rowOf(path.posix.dirname(file), on);
    const { proposed, ...rest } = written.row;
    return { file: written.file, row: { ...rest, [ICON_DRAWN]: [entry], proposed }, fresh: true };
  }
  const row = JSON.parse(readFileSync(path.join(root, holder.file), "utf8"));
  const kept = Array.isArray(row.pin?.files) ? row.pin.files : [];
  if (kept.some((pinned) => pinned?.file === file)) {
    throw new Refusal(
      `${file} is pinned by ${holder.file} already: an icon drawn again is a changed file of that row, changed by hand. Nothing was written`,
    );
  }
  const [added] = filesPin(root, [file]).pin.files;
  const drawn = Array.isArray(row[ICON_DRAWN]) ? row[ICON_DRAWN] : [];
  return {
    file: holder.file,
    row: { ...row, pin: { ...row.pin, files: [...kept, added] }, [ICON_DRAWN]: [...drawn, entry] },
    fresh: false,
    licensed: typeof row.licence === "string" && row.licence.trim() !== "",
  };
}

// What --draw would write, and the lines that say why: the file, the sets that lack it, and the
// row it goes into. It throws one sentence where the icon is not drawn.
export function planDrawn(root, { file: given, need, why, on, rowOf }) {
  if (typeof need !== "string" || typeof why !== "string" || why.trim() === "") {
    throw new Refusal(
      "--draw takes --need, the icon the screen needs, and --why, why the pinned set does not answer it",
    );
  }
  const name = iconName(need);
  if (name === "") throw new Refusal(`--need ${need} holds no letter or digit`);
  const predates = drawnPredates(root);
  if (predates) throw new Refusal(`${predates}, then run this again. Nothing was written`);
  const full = inside(root, given);
  if (full === null || !existsSync(full) || !statSync(full).isFile()) {
    throw new Refusal(`${given} is no file of the repository. Nothing was written`);
  }
  const file = path.relative(root, full).split(path.sep).join("/");
  const sets = readIconSets(root);
  if (sets.length === 0) {
    throw new Refusal(
      "the sources ledger pins no icon set: an icon is drawn only when the pinned set lacks it, so pin the set first with icon-source --package or --folder. Nothing was written",
    );
  }
  const lacking = [];
  for (const set of sets) {
    const said = `${set.pin?.package ?? set.folder ?? set.id} (${set.file})`;
    if (setHas(root, set, name, file)) {
      throw new Refusal(
        `${said} has an icon ${name}: take it from the pinned set; an icon is drawn only when the set lacks it. Nothing was written`,
      );
    }
    lacking.push(`${said} has no icon ${name}`);
  }
  const entry = { file, need: need.trim(), why: why.trim(), on };
  const target = drawnRow(root, { file, entry, sets, on, rowOf });
  const content = renderJson(target.row, lineWidth(root));
  const problems = shapeProblems("sources", content, target.file);
  if (problems.length > 0) throw new Refusal(`${problems.join("; ")}. Nothing was written`);
  if (target.fresh && existsSync(path.join(root, target.file))) {
    throw new Refusal(
      `${target.file} is already there and pins no folder that holds ${file}: a row is never written over. Nothing was written`,
    );
  }
  return { ...target, content, entry, lacking, folder: target.row.folder };
}
