// Writes the row of the icon set the product uses into the sources ledger,
// design/sources/<id>.json, from what the repository already holds: a package its lockfile pins, at
// the version pinned, or a folder of the repository's own icon files, each hashed where it is
// (spec 0017, item 12.1). It fetches and installs nothing: a package the lockfile does not pin, or
// a folder that holds no file of the repository, gets no row. The licence is a person's to write:
// the row says a command proposed it, is not held until the licence is there, and `status` asks for
// it. A row that exists is never written over, and a package a row pins gets no second row. Where
// the gate is installed, the check of the pin is laid under the row that holds the ledgers' shapes.
// With --draw, an icon drawn because the pinned set lacks it is recorded in the row of the folder
// that holds it, with the need and why, and only where no pinned set has an icon of that name.
// Usage: node icon-source.mjs [--target DIR] (--package NAME | --folder PATH) [--title TEXT]
//                             [--id ID] [--on DATE] [--dry-run] [--json]
//        node icon-source.mjs [--target DIR] --draw FILE --need NAME --why TEXT [--on DATE]
// Exit: 1 the row is written, or would be, and its licence waits on a person; 2 a wrong call, an
// icon set the repository does not hold, or a row that is already there.
import { existsSync, readdirSync, readFileSync, realpathSync, statSync } from "node:fs";
import path from "node:path";
import { stdout } from "node:process";

import { writeFiles, writtenFiles } from "./apply.mjs";
import { finish, readCall, Refusal, refuse, start } from "./command.mjs";
import { filesPin, idOf, today } from "./font-source.mjs";
import { adapterOf } from "../templates/tools/design-assembly/adapters/index.mjs";
import { pinnedPackage } from "../templates/tools/design-assembly/adapters/lockfile.mjs";
import { newerProblem, shapeProblems } from "../templates/tools/design-assembly/contract.mjs";
import { lineWidth, renderJson } from "../templates/tools/design-assembly/json.mjs";
import { LEDGER } from "../templates/tools/design-assembly/ledger.mjs";
import {
  ICON_SET_CHECK,
  ICON_SET_KIND,
  ICON_USE_CHECK,
  readIconSets,
  SOURCES_FOLDER,
  SOURCES_VERSION,
} from "../templates/tools/design-assembly/sources-ledger.mjs";
import { isDay } from "../templates/tools/design-assembly/waiting.mjs";
import { toolPredates } from "./tool-knows.mjs";
import { iconsDecision, iconsToday, proposedIconSet, recommendedIconSet } from "./icon-use.mjs";
import { planDrawn } from "./icon-drawn.mjs";

// The command a row says proposed it, when this script is called by itself.
const BY = "icon-source";
// The tool data of the gate, and the row whose checks hold the ledgers' shapes.
const THEME = "design/theme.json";
const SHAPES_ROW = "ledger-shapes";

// The pin of an icon set that is a package: the version the lockfile pins it at, and the licence
// the lockfile says the package states, for a person to read. It throws when the repository's
// lockfile does not pin the package: this command installs and fetches nothing.
export function iconPackagePin(root, name) {
  const locked = pinnedPackage(root, name);
  if (locked.lockfile === null) {
    throw new Error(
      `the repository has no lockfile this tool reads, so the version of ${name} cannot be pinned: nothing is fetched, and a person writes the row`,
    );
  }
  if (locked.version === null) {
    throw new Error(
      `${locked.lockfile} does not pin ${name}: install it as the repository installs a package, then run this again; nothing is fetched here`,
    );
  }
  return {
    pin: { package: name, version: locked.version },
    stated: locked.license
      ? `${locked.lockfile} says the package ${name} states the licence ${locked.license}: read it, and write the licence the icon set is used under in your own words`
      : null,
  };
}

// The path of a folder as a row names it, from the repository's root, or null when it is not a
// folder inside the repository. A link that leads out of it is outside.
function folderOf(root, folder) {
  const full = path.resolve(root, String(folder));
  const relative = path.relative(path.resolve(root), full);
  if (relative === "" || relative.startsWith("..") || path.isAbsolute(relative)) return null;
  if (!existsSync(full) || !statSync(full).isDirectory()) return null;
  const led = path.relative(realpathSync(root), realpathSync(full));
  if (led === "" || led.startsWith("..") || path.isAbsolute(led)) return null;
  return relative.split(path.sep).join("/");
}

// Every file under a folder, by its path from the root, in order; hidden files left out.
function filesUnder(root, folder) {
  return readdirSync(path.join(root, folder))
    .filter((name) => !name.startsWith("."))
    .sort()
    .flatMap((name) => {
      const relative = `${folder}/${name}`;
      const full = path.join(root, relative);
      return statSync(full).isDirectory() ? filesUnder(root, relative) : [relative];
    });
}

// The pin of an icon set kept as files of the repository: each file under the folder, hashed where
// it is. It throws on a folder that is not the repository's, or that holds no file.
export function iconFolderPin(root, folder) {
  const named = folderOf(root, folder);
  if (named === null) throw new Error(`${folder} is not a folder of the repository`);
  const found = filesUnder(root, named);
  if (found.length === 0) throw new Error(`${named} holds no file to pin`);
  return { folder: named, ...filesPin(root, found) };
}

// Where an icon set comes from, in the words a person reads.
const fromOf = (pin) =>
  pin.package
    ? `the package ${pin.package} at ${pin.version}, as the lockfile pins it`
    : `${pin.files.length} file(s) of the repository, hashed where they are`;

// The row of an icon set, as it would be written, with its file. The row has no licence: no tool
// writes one. `own` says the repository used the set before the row was written.
export function iconSetRow(root, { origin, title, id, own = false, by = BY, on }) {
  const module = origin.pin.package ?? null;
  const named = id ?? idOf(module ?? path.posix.basename(origin.folder));
  const row = {
    version: SOURCES_VERSION,
    id: named,
    kind: ICON_SET_KIND,
    title: title ?? module ?? path.posix.basename(origin.folder),
    ...(module ? { module } : {}),
    ...(origin.folder ? { folder: origin.folder } : {}),
    pin: origin.pin,
    ...(own ? { own: true } : {}),
    proposed: { by, on },
  };
  const file = `${SOURCES_FOLDER}/${named}.json`;
  const content = renderJson(row, lineWidth(root));
  return { file, row, content, problems: shapeProblems("sources", content, file) };
}

// The row of the ledger that already pins a package, or null.
const rowPinning = (root, name) =>
  readIconSets(root).find((set) => set.pin?.package === name) ?? null;

// The tool data with the check of the icon sets' pins laid under the row that holds the ledgers'
// shapes, or null where the gate is not installed, holds no such row, or has the check already.
export function withPinCheck(root) {
  const full = path.join(root, THEME);
  if (!existsSync(full)) return null;
  let theme;
  try {
    theme = JSON.parse(readFileSync(full, "utf8"));
  } catch {
    return null;
  }
  const shapes = theme?.checks?.[SHAPES_ROW];
  if (!Array.isArray(shapes)) return null;
  if (shapes.some((check) => check?.kind === ICON_SET_CHECK.kind)) return null;
  const checks = { ...theme.checks, [SHAPES_ROW]: [...shapes, ICON_SET_CHECK] };
  return renderJson({ ...theme, checks }, lineWidth(root));
}

// Why no row of the kind is written here, or null: the repository's copy of the tool predates the
// kind, and its gate would read the row as a library with no catalog.
export const iconToolPredates = (root) =>
  toolPredates(root, {
    file: "sources-ledger.mjs",
    word: "ICON_SET_KIND",
    part: `the kind ${ICON_SET_KIND}`,
  });

// The package of the recommended icon set. It throws where there is none to write: the ledger has an
// icon set already, or nothing is recommended.
function recommendedPackage(root) {
  const rec = recommendedIconSet(root);
  if (rec.row)
    throw new Error(`${rec.row} is the icon set of the sources ledger: nothing to recommend`);
  if (rec.none) throw new Error("no icon set is recommended here: give --package or --folder");
  return rec.package;
}

// What a person does next with a row a command wrote.
export const iconLicenceStep = (file) =>
  `write the licence the icon set is used under into licence of ${file}, in a person's words: until then the row is not held`;

// The icon set the component library's settings name, with the row adopt proposes for it as the
// repository's own, or why none is proposed; null where the settings name none. A row that pins
// its package already is left to that row. Nothing is fetched to find out.
export function ownIconSet(root, { on, by }) {
  const library = adapterOf("components");
  if (!library?.iconLibraryIn) return null;
  let settings;
  try {
    settings = JSON.parse(readFileSync(path.join(root, library.settingsFile), "utf8"));
  } catch {
    return null;
  }
  const word = library.iconLibraryIn(settings);
  if (word === null) return null;
  const named = `${library.settingsFile} names the icon set ${word}`;
  const name = library.iconPackages[word];
  // What this tool cannot read is said as such, and leaves the person nothing new to answer: a
  // word it does not know, or a lockfile it does not read.
  if (!name) {
    return {
      unreadable: `${named}, which this plugin cannot map to a package: a person writes the row with icon-source --package`,
    };
  }
  const listed = rowPinning(root, name);
  if (listed) return { exists: `${listed.file} is already there, and pins ${name}` };
  if (pinnedPackage(root, name).lockfile === null) {
    return {
      unreadable: `${named}, and the repository has no lockfile this tool reads, so the version of ${name} cannot be pinned: a person writes the row with icon-source --package`,
    };
  }
  let origin;
  try {
    origin = iconPackagePin(root, name);
  } catch (error) {
    return { cannot: `${named}, and ${error.message}` };
  }
  const written = iconSetRow(root, { origin, own: true, by, on });
  if (existsSync(path.join(root, written.file))) {
    return { exists: `${written.file} is already there` };
  }
  if (written.problems.length > 0)
    return { cannot: `${named}, and ${written.problems.join("; ")}` };
  const predates = iconToolPredates(root);
  if (predates) {
    return {
      cannot: `${named}, and ${predates}, then run adopt again; it would then propose ${written.file}, ${fromOf(origin.pin)}`,
    };
  }
  return {
    row: written.file,
    content: written.content,
    module: name,
    named_by: library.settingsFile,
    from: fromOf(origin.pin),
    stated: origin.stated,
  };
}

const USAGE = `usage: node icon-source.mjs [--target DIR] [--package NAME | --folder PATH | --recommended]
                            [--title TEXT] [--id ID] [--on DATE] [--dry-run] [--json]

  With none of the three, says which icon set is recommended here and writes nothing: none where
  the sources ledger has an icon set row; the set the code already imports, where it imports one;
  else the set the pieces of the plugin's starter kit import.

  --package   The package the icons come in, the module the code imports them from. The row pins
              the version the repository's lockfile pins it at; a package the lockfile does not
              pin gets no row.
  --folder    The folder of the repository its own icon files are kept in, by its path from the
              root. Each file under it is hashed where it is.
  --recommended  The row of the recommended set, written as --package writes it: only where the
              lockfile pins it.
  --draw      An icon file of the repository, drawn because the pinned set lacks it, with --need
              (the icon a screen needs) and --why (why the pinned set does not answer it). It is
              recorded only where no pinned set has an icon of that name, read from the files
              the repository holds; it goes into the row of the folder that holds it, keeping
              every pin of that row, or a new row for that folder.
  --title     The name the row gives the set. Without it, the package, or the folder's name.
  --id        The row's id, and the name of its file. Without it, made from the package or the
              folder's name.
  --on        The day the row is written, as YYYY-MM-DD. Without it, today.
  --dry-run   Say what would be written, and write nothing.
  --json      The row, its file, what the lockfile states of the licence, and the next step.

  Writes one file, ${SOURCES_FOLDER}/<id>.json, and never writes over one, nor writes a second row for a
  package a row pins. Where the gate is installed, it also lays the check of the icon sets' pins
  in ${THEME}, and answers icons in design/decisions.yaml with the row, held by the check of the
  icons the code uses. It fetches and installs nothing. The row has no licence: a person writes it, and
  the row is held from then on.

  Ends with 1 when the row is written, since its licence waits on a person, and when a set is
  recommended, since a person chooses it; with 0 when the ledger already has an icon set; with 2 on
  a wrong call, an icon set the repository does not hold, or a row that is already there.
`;

const FLAGS = {
  "--package": "value",
  "--folder": "value",
  "--title": "value",
  "--id": "value",
  "--on": "value",
  "--recommended": "switch",
  "--draw": "value",
  "--need": "value",
  "--why": "value",
  "--dry-run": "switch",
};

// An icon drawn beyond the pinned set, recorded in a row of the repository's own icon files
// (spec 0017, criterion 18): its file pinned, its need and why written beside it.
function draw(call, on) {
  const root = call.target;
  const flags = call.flags;
  const dryRun = flags["--dry-run"] === true;
  const rowOf = (folder, day) => {
    try {
      return iconSetRow(root, { origin: iconFolderPin(root, folder), on: day });
    } catch (error) {
      throw new Refusal(`${error.message}. Nothing was written`);
    }
  };
  const planned = planDrawn(root, {
    file: flags["--draw"],
    need: flags["--need"],
    why: flags["--why"],
    on,
    rowOf,
  });
  const theme = withPinCheck(root);
  const lines = writeFiles(
    root,
    { [planned.file]: planned.content, ...(theme ? { [THEME]: theme } : {}) },
    dryRun,
  );
  const waits = planned.fresh || !planned.licensed;
  const next = iconLicenceStep(planned.file);
  const text = [
    `icon drawn: ${planned.entry.file}, for the need ${planned.entry.need}: ${planned.entry.why}`,
    `  the pinned set lacks it: ${planned.lacking.join("; ")}`,
    ...lines.map((line) => `  ${line}`),
    `gate: ${planned.entry.file} is in the folder ${planned.folder} of ${planned.file}, which the check ${ICON_USE_CHECK.kind} does not read`,
    ...(waits ? [`next: ${next}`] : []),
    ...(dryRun ? ["preview only: nothing was written"] : []),
  ];
  return finish({
    json: call.json,
    result: {
      dry_run: dryRun,
      row: planned.file,
      drawn: planned.entry,
      lacking: planned.lacking,
      next: waits ? next : null,
      files: writtenFiles(lines),
    },
    text: `${text.join("\n")}\n`,
    work: waits,
  });
}

// Where the lockfile stands on the recommended set, and how its row is written, in a person's words.
function lockLine(rec) {
  const install = `install it as the repository installs a package, then write its row with icon-source --recommended; nothing is installed here`;
  if (rec.lockfile === null) {
    return `the repository has no lockfile this tool reads: ${install.replace("install it", `install ${rec.package}`)}`;
  }
  if (rec.version === null) return `${rec.lockfile} does not pin ${rec.package}: ${install}`;
  return `${rec.lockfile} pins ${rec.package} at ${rec.version}: write its row with icon-source --recommended`;
}

// The icon set recommended here, said and never written (spec 0017, criterion 12).
function recommend(call) {
  const root = call.target;
  const rec = recommendedIconSet(root);
  if (rec.row) {
    return finish({
      json: call.json,
      result: { recommended: null, row: rec.row },
      text: `icon set: ${rec.row} is the icon set of the sources ledger: nothing to recommend\n`,
      work: false,
    });
  }
  if (rec.none) {
    return finish({
      json: call.json,
      result: { recommended: null, row: null },
      text: "icon set: no row of the kind icon-set in the sources ledger, and the pieces of the starter kit import no icon package this plugin knows: write the row of the set you choose with icon-source --package NAME, or --folder PATH\n",
      work: true,
    });
  }
  const why =
    rec.because === "imported"
      ? `the icon set the code already imports (${rec.files} file(s))`
      : `the icon set the pieces of the starter kit import (${rec.pieces.join(", ")})`;
  const text = [
    "icon set: no row of the kind icon-set in the sources ledger",
    `recommended: ${rec.package}, ${why}: one set in the repository, not two`,
    `  ${lockLine(rec)}`,
    "  or choose another set, and write its row with icon-source --package NAME, or --folder PATH for icons kept as files of the repository",
    "nothing was written",
  ];
  return finish({
    json: call.json,
    result: { recommended: rec, row: null },
    text: `${text.join("\n")}\n`,
    work: true,
  });
}

function main(args) {
  const call = readCall(args, FLAGS);
  if (call.problem) return refuse(call.problem, USAGE);
  if (call.help) return void stdout.write(USAGE);
  const root = call.target;
  const flags = call.flags;
  const named = ["--package", "--folder", "--recommended"].filter((flag) => flags[flag]);
  if (flags["--draw"] !== undefined) {
    if (named.length > 0) return refuse(`give --draw or ${named[0]}, not both`, USAGE);
    const day = flags["--on"] ?? today();
    if (!isDay(day))
      throw new Refusal(`--on takes a day written YYYY-MM-DD, and ${day} is not one`);
    return draw(call, day);
  }
  if (flags["--need"] !== undefined || flags["--why"] !== undefined) {
    return refuse("--need and --why go with --draw, the file of the icon drawn", USAGE);
  }
  if (named.length === 0) return recommend(call);
  if (named.length > 1) {
    return refuse(
      "give --package, --folder or --recommended, one of the three: where the icon set comes from",
      USAGE,
    );
  }
  const on = flags["--on"] ?? today();
  if (!isDay(on)) throw new Refusal(`--on takes a day written YYYY-MM-DD, and ${on} is not one`);
  const dryRun = flags["--dry-run"] === true;
  let origin;
  try {
    origin = flags["--folder"]
      ? iconFolderPin(root, flags["--folder"])
      : iconPackagePin(root, flags["--package"] ?? recommendedPackage(root));
  } catch (error) {
    throw new Refusal(`${error.message}. Nothing was written`);
  }
  const written = iconSetRow(root, { origin, title: flags["--title"], id: flags["--id"], on });
  if (written.problems.length > 0) {
    throw new Refusal(`${written.problems.join("; ")}. Nothing was written`);
  }
  const full = path.join(root, written.file);
  if (existsSync(full)) {
    // A row of a newer shape, or any other, is a person's file: never written over.
    // One that is not JSON is a person's file too, and is said to be there.
    let newer;
    try {
      newer = newerProblem("sources", JSON.parse(readFileSync(full, "utf8")), written.file);
    } catch {
      newer = null;
    }
    throw new Refusal(
      `${newer ?? `${written.file} is already there`}: a row is never written over. Change it by hand, or give another --id`,
    );
  }
  const listed = origin.pin.package ? rowPinning(root, origin.pin.package) : null;
  if (listed) {
    throw new Refusal(
      `${listed.file} already pins ${origin.pin.package}: a package has one row. Change that row by hand. Nothing was written`,
    );
  }
  const predates = iconToolPredates(root);
  if (predates) throw new Refusal(`${predates}, then run this again. Nothing was written`);
  const pinned = withPinCheck(root);
  // Where the gate is installed, the row answers the standard question icons, held by the check of
  // the icons the code uses; what that check finds today is said.
  const icons = iconsDecision(root, {
    file: written.file,
    ...(pinned ? { themeText: pinned } : {}),
  });
  const theme = icons?.theme ?? pinned;
  const redToday = icons?.theme
    ? iconsToday(root, [...readIconSets(root), proposedIconSet(written.file, written.content)])
    : [];
  const lines = writeFiles(
    root,
    {
      [written.file]: written.content,
      ...(theme ? { [THEME]: theme } : {}),
      ...(icons?.ledger ? { [LEDGER]: icons.ledger } : {}),
    },
    dryRun,
  );
  const next = iconLicenceStep(written.file);
  const text = [
    `icon set: ${written.row.title}, from ${fromOf(origin.pin)}`,
    ...lines.map((line) => `  ${line}`),
    ...(pinned ? [`gate: the check ${ICON_SET_CHECK.kind} holds the pin from now on`] : []),
    ...(icons?.theme
      ? [
          `gate: the check ${ICON_USE_CHECK.kind} holds which icons the code uses, under the row icons of ${LEDGER}`,
        ]
      : []),
    ...(redToday.length > 0
      ? [
          `gate: red today: ${redToday.slice(0, 3).join("; ")}${redToday.length > 3 ? `; and ${redToday.length - 3} more` : ""}`,
        ]
      : []),
    ...(icons?.predates ? [`gate: ${icons.predates}`] : []),
    ...(icons?.kept ? [`gate: ${icons.kept}`] : []),
    ...(origin.stated ? [`licence: ${origin.stated}`] : []),
    `next: ${next}`,
    ...(dryRun ? ["preview only: nothing was written"] : []),
  ];
  return finish({
    json: call.json,
    result: {
      dry_run: dryRun,
      row: written.file,
      icon_set: written.row,
      stated: origin.stated,
      check_laid: pinned !== null,
      icons_laid: Boolean(icons?.theme),
      red_today: redToday,
      next,
      files: writtenFiles(lines),
    },
    text: `${text.join("\n")}\n`,
    // The licence waits on a person, whatever was written.
    work: true,
  });
}

await start(import.meta.url, main);
