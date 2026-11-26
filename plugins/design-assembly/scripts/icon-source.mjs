// Writes the row of the icon set the product uses into the sources ledger,
// design/sources/<id>.json, from what the repository already holds: a package its lockfile pins, at
// the version pinned, or a folder of the repository's own icon files, each hashed where it is
// (spec 0017, item 12.1). It fetches and installs nothing: a package the lockfile does not pin, or
// a folder that holds no file of the repository, gets no row. The licence is a person's to write:
// the row says a command proposed it, is not held until the licence is there, and `status` asks for
// it. A row that exists is never written over, and a package a row pins gets no second row. Where
// the gate is installed, the check of the pin is laid under the row that holds the ledgers' shapes.
// Usage: node icon-source.mjs [--target DIR] (--package NAME | --folder PATH) [--title TEXT]
//                             [--id ID] [--on DATE] [--dry-run] [--json]
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
import {
  ICON_SET_CHECK,
  ICON_SET_KIND,
  readIconSets,
  SOURCES_FOLDER,
  SOURCES_VERSION,
} from "../templates/tools/design-assembly/sources-ledger.mjs";
import { isDay } from "../templates/tools/design-assembly/waiting.mjs";
import { toolPredates } from "./tool-knows.mjs";

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

const USAGE = `usage: node icon-source.mjs [--target DIR] (--package NAME | --folder PATH) [--title TEXT]
                            [--id ID] [--on DATE] [--dry-run] [--json]

  --package   The package the icons come in, the module the code imports them from. The row pins
              the version the repository's lockfile pins it at; a package the lockfile does not
              pin gets no row.
  --folder    The folder of the repository its own icon files are kept in, by its path from the
              root. Each file under it is hashed where it is.
  --title     The name the row gives the set. Without it, the package, or the folder's name.
  --id        The row's id, and the name of its file. Without it, made from the package or the
              folder's name.
  --on        The day the row is written, as YYYY-MM-DD. Without it, today.
  --dry-run   Say what would be written, and write nothing.
  --json      The row, its file, what the lockfile states of the licence, and the next step.

  Writes one file, ${SOURCES_FOLDER}/<id>.json, and never writes over one, nor writes a second row for a
  package a row pins. Where the gate is installed, it also lays the check of the icon sets' pins
  in ${THEME}. It fetches and installs nothing. The row has no licence: a person writes it, and
  the row is held from then on.

  Ends with 1 when the row is written, since its licence waits on a person; with 2 on a wrong
  call, an icon set the repository does not hold, or a row that is already there.
`;

const FLAGS = {
  "--package": "value",
  "--folder": "value",
  "--title": "value",
  "--id": "value",
  "--on": "value",
  "--dry-run": "switch",
};

function main(args) {
  const call = readCall(args, FLAGS);
  if (call.problem) return refuse(call.problem, USAGE);
  if (call.help) return void stdout.write(USAGE);
  const root = call.target;
  const flags = call.flags;
  if (Boolean(flags["--package"]) === Boolean(flags["--folder"])) {
    return refuse(
      "give --package or --folder, one of the two: where the icon set comes from",
      USAGE,
    );
  }
  const on = flags["--on"] ?? today();
  if (!isDay(on)) throw new Refusal(`--on takes a day written YYYY-MM-DD, and ${on} is not one`);
  const dryRun = flags["--dry-run"] === true;
  let origin;
  try {
    origin = flags["--package"]
      ? iconPackagePin(root, flags["--package"])
      : iconFolderPin(root, flags["--folder"]);
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
  const theme = withPinCheck(root);
  const lines = writeFiles(
    root,
    { [written.file]: written.content, ...(theme ? { [THEME]: theme } : {}) },
    dryRun,
  );
  const next = iconLicenceStep(written.file);
  const text = [
    `icon set: ${written.row.title}, from ${fromOf(origin.pin)}`,
    ...lines.map((line) => `  ${line}`),
    ...(theme ? [`gate: the check ${ICON_SET_CHECK.kind} holds the pin from now on`] : []),
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
      check_laid: theme !== null,
      next,
      files: writtenFiles(lines),
    },
    text: `${text.join("\n")}\n`,
    // The licence waits on a person, whatever was written.
    work: true,
  });
}

await start(import.meta.url, main);
