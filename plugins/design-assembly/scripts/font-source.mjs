// Writes the row of a font into the sources ledger, design/sources/<id>.json, from what the
// repository already holds: a package its lockfile pins, at the version pinned, or font files
// that are in the repository, each hashed where it is. It fetches nothing: a package the lockfile does not pin, or a file that
// is not there, gets no row. The licence is a person's to write: the row says a command proposed
// it, is not held until the licence is there, and `status` asks for it. A row that exists is
// never written over.
// Usage: node font-source.mjs [--target DIR] --family NAME (--package NAME | --files PATH[,PATH])
//                             [--variable --NAME] [--id ID] [--on DATE] [--dry-run] [--json]
// Exit: 1 the row is written, or would be, and its licence waits on a person; 2 a wrong call, a
// font the repository does not hold, or a row that is already there.
import { createHash } from "node:crypto";
import { existsSync, readFileSync, realpathSync, statSync } from "node:fs";
import path from "node:path";
import { stdout } from "node:process";

import { writeFiles, writtenFiles } from "./apply.mjs";
import { finish, readCall, Refusal, refuse, start } from "./command.mjs";
import { buildOf } from "../templates/tools/design-assembly/adapters/index.mjs";
import { pinnedPackage } from "../templates/tools/design-assembly/adapters/lockfile.mjs";
import { newerProblem, shapeProblems } from "../templates/tools/design-assembly/contract.mjs";
import {
  declaredFonts,
  firstFamily,
  readLoads,
} from "../templates/tools/design-assembly/fonts.mjs";
import { lineWidth, renderJson } from "../templates/tools/design-assembly/json.mjs";
import {
  FONT_KIND,
  readFontSources,
  SOURCES_FOLDER,
  SOURCES_VERSION,
} from "../templates/tools/design-assembly/sources-ledger.mjs";
import { expand } from "../templates/tools/design-assembly/styles.mjs";
import { isDay } from "../templates/tools/design-assembly/waiting.mjs";

// The command a row says proposed it, when this script is called by itself.
const BY = "font-source";

// The day as a row writes it, YYYY-MM-DD, by the clock of this machine.
export const today = () => {
  const now = new Date();
  const two = (value) => String(value).padStart(2, "0");
  return `${now.getFullYear()}-${two(now.getMonth() + 1)}-${two(now.getDate())}`;
};

// A row's id made of the words of a family: lowercase letters, digits and dashes.
export const idOf = (words) =>
  String(words)
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

// The path of a file as a row names it, from the repository's root, or null when it is not a file
// inside the repository.
function fileOf(root, file) {
  const full = path.resolve(root, String(file));
  const relative = path.relative(path.resolve(root), full);
  if (relative === "" || relative.startsWith("..") || path.isAbsolute(relative)) return null;
  if (!existsSync(full) || !statSync(full).isFile()) return null;
  // A link inside the repository may lead out of it: where it leads is what counts.
  const led = path.relative(realpathSync(root), realpathSync(full));
  if (led.startsWith("..") || path.isAbsolute(led)) return null;
  return relative.split(path.sep).join("/");
}

// The pin of a font that is a package: the version the lockfile pins it at, and the licence the
// lockfile says the package states, for a person to read. It throws when the repository's
// lockfile does not pin the package: this command installs and fetches nothing.
export function packagePin(root, name) {
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
      ? `${locked.lockfile} says the package ${name} states the licence ${locked.license}: read it, and write the licence the font is used under in your own words`
      : null,
  };
}

// The pin of a font kept as files: each file by its path from the root, hashed where it is.
// `more` adds what is known of a file, such as its weight. It throws on a file that is not there.
export function filesPin(root, files, more = () => ({})) {
  const entries = files.map((file) => {
    const named = fileOf(root, file);
    if (named === null) throw new Error(`${file} is not a file of the repository`);
    const sha256 = createHash("sha256")
      .update(readFileSync(path.join(root, named)))
      .digest("hex");
    return { file: named, sha256, ...more(file) };
  });
  return { pin: { files: entries }, stated: null };
}

// The row of a font, as it would be written, with its file. `origin` is the pin and what the
// lockfile states; `own` says the repository loaded the font before the row was written. The row
// has no licence: no tool writes one.
export function fontRow(root, { family, variable, id, origin, own = false, by = BY, on }) {
  const named = id ?? idOf(family);
  const row = {
    version: SOURCES_VERSION,
    id: named,
    kind: FONT_KIND,
    title: family,
    family,
    ...(variable ? { variable } : {}),
    pin: origin.pin,
    ...(own ? { own: true } : {}),
    proposed: { by, on },
  };
  const file = `${SOURCES_FOLDER}/${named}.json`;
  const content = renderJson(row, lineWidth(root));
  return { file, row, content, problems: shapeProblems("sources", content, file) };
}

// An address a stylesheet takes a font file from, as a file of the repository, or null: an
// address with a scheme leads out of it; one from the root of the site leads into the folder the
// build serves from there, when the build has one; any other is followed from the stylesheet.
function addressedFile(root, url, stylesheet, publicFolder) {
  if (/^([a-z][a-z0-9+.-]*:|\/\/)/i.test(url)) return null;
  const bare = url.replace(/[?#].*$/, "");
  if (bare.startsWith("/")) return publicFolder ? fileOf(root, `${publicFolder}${bare}`) : null;
  return fileOf(root, path.posix.join(path.posix.dirname(stylesheet), bare));
}

// Where a font the repository loads comes from, as a pin a row can hold; or `cannot`, why the
// repository holds nothing to pin it by. Nothing is fetched to find out.
function originOf(root, load, stylesheet) {
  const person = "nothing is fetched, and a person writes the row";
  try {
    if (load.package) return packagePin(root, load.package);
    if (load.urls) {
      const files = load.urls.map((url) =>
        addressedFile(root, url, stylesheet, buildOf(root).publicFolder),
      );
      const away = load.urls.filter((url, index) => files[index] === null);
      if (away.length > 0) {
        return {
          cannot: `its rule takes it from ${away.join(", ")}, which is no file of the repository: ${person}`,
        };
      }
      return filesPin(root, files);
    }
    if ((load.files ?? []).length > 0) return filesPin(root, load.files);
  } catch (error) {
    return { cannot: error.message };
  }
  return {
    cannot: `it names no font file of the repository, so there is nothing here to pin: ${person}`,
  };
}

// The fonts the repository loads today for running text and for headings: each typeface the
// stylesheet names first, that something loads, with the row that says it is the repository's
// own, or why no row can be written. A font a row of the ledger already names is left to that row.
export function ownFonts(root, styles, stylesheet, { on, by }) {
  const { loads } = readLoads(root, styles.css, stylesheet);
  const rows = readFontSources(root);
  const seen = new Set();
  const found = [];
  for (const variable of declaredFonts(styles)) {
    const first = firstFamily(expand(styles, ":root", `var(${variable})`));
    if (first.generic !== undefined) continue;
    const key = first.variable ?? first.name.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    const load = first.variable
      ? loads.find((item) => item.variable === first.variable)
      : loads.find((item) => item.family?.toLowerCase() === key);
    // A typeface nothing loads is the font-loaded check's to say.
    if (!load) continue;
    const shown = first.variable ? `var(${first.variable})` : `"${first.name}"`;
    const listed = rows.find((row) =>
      first.variable ? row.variable === first.variable : row.family?.toLowerCase() === key,
    );
    if (listed) {
      found.push({ shown, by: load.by, exists: listed.file });
      continue;
    }
    const origin = originOf(root, load, stylesheet);
    if (origin.cannot) {
      found.push({ shown, by: load.by, cannot: origin.cannot });
      continue;
    }
    // A font a loader sets under a variable has no name a stylesheet says: its first file's.
    const family =
      first.name ?? path.posix.basename(origin.pin.files[0].file).replace(/\.[^.]+$/, "");
    const written = fontRow(root, {
      family,
      variable: first.variable,
      origin,
      own: true,
      by,
      on,
    });
    if (existsSync(path.join(root, written.file))) {
      found.push({ shown, by: load.by, exists: written.file });
    } else if (written.problems.length > 0) {
      found.push({ shown, by: load.by, cannot: written.problems.join("; ") });
    } else {
      found.push({
        shown,
        by: load.by,
        row: written.file,
        content: written.content,
        family,
        own: true,
        from: origin.pin.package
          ? `the package ${origin.pin.package} at ${origin.pin.version}, as the lockfile pins it`
          : `${origin.pin.files.length} file(s) of the repository, hashed where they are`,
        stated: origin.stated,
      });
    }
  }
  return found;
}

// What a person does next with a row a command wrote.
export const licenceStep = (file) =>
  `write the licence the font is used under into licence of ${file}, in a person's words: until then the row is not held and the font cannot be chosen`;

const USAGE = `usage: node font-source.mjs [--target DIR] --family NAME (--package NAME | --files PATH[,PATH])
                            [--variable --NAME] [--id ID] [--on DATE] [--dry-run] [--json]

  --family    The name a stylesheet calls the font by.
  --package   The package the font comes in. The row pins the version the repository's lockfile
              pins it at; a package the lockfile does not pin gets no row.
  --files     The font files, already in the repository, by their paths from its root, a comma
              between them. Each is hashed where it is.
  --variable  The CSS variable a font loader of the build sets for the font, when it has one: the
              stylesheet then names that variable instead of the family.
  --id        The row's id, and the name of its file. Without it, made from the family.
  --on        The day the row is written, as YYYY-MM-DD. Without it, today.
  --dry-run   Say what would be written, and write nothing.
  --json      The row, its file, what the lockfile states of the licence, and the next step.

  Writes one file, ${SOURCES_FOLDER}/<id>.json, and never writes over one. It fetches nothing.
  The row has no licence: a person writes it, and the row is held from then on.

  Ends with 1 when the row is written, since its licence waits on a person; with 2 on a wrong
  call, a font the repository does not hold, or a row that is already there.
`;

const FLAGS = {
  "--family": "value",
  "--package": "value",
  "--files": "value",
  "--variable": "value",
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
  const family = flags["--family"];
  if (!family) return refuse("--family says the name a stylesheet calls the font by", USAGE);
  const files = (flags["--files"] ?? "").split(",").filter(Boolean);
  if (Boolean(flags["--package"]) === files.length > 0) {
    return refuse("give --package or --files, one of the two: where the font comes from", USAGE);
  }
  const on = flags["--on"] ?? today();
  if (!isDay(on)) throw new Refusal(`--on takes a day written YYYY-MM-DD, and ${on} is not one`);
  const dryRun = flags["--dry-run"] === true;
  let origin;
  try {
    origin = flags["--package"] ? packagePin(root, flags["--package"]) : filesPin(root, files);
  } catch (error) {
    throw new Refusal(`${error.message}. Nothing was written`);
  }
  const written = fontRow(root, {
    family,
    variable: flags["--variable"],
    id: flags["--id"],
    origin,
    on,
  });
  if (written.problems.length > 0) {
    throw new Refusal(`${written.problems.join("; ")}. Nothing was written`);
  }
  const full = path.join(root, written.file);
  if (existsSync(full)) {
    // A row of a newer shape, or any other, is a person's file: never written over.
    const newer = newerProblem("sources", JSON.parse(readFileSync(full, "utf8")), written.file);
    throw new Refusal(
      `${newer ?? `${written.file} is already there`}: a row is never written over. Change it by hand, or give another --id`,
    );
  }
  const lines = writeFiles(root, { [written.file]: written.content }, dryRun);
  const next = licenceStep(written.file);
  const text = [
    `font: ${family}, from ${
      origin.pin.package
        ? `the package ${origin.pin.package} at ${origin.pin.version}, as the lockfile pins it`
        : `${origin.pin.files.length} file(s) of the repository, hashed where they are`
    }`,
    ...lines.map((line) => `  ${line}`),
    ...(origin.stated ? [`licence: ${origin.stated}`] : []),
    `next: ${next}`,
    ...(dryRun ? ["preview only: nothing was written"] : []),
  ];
  return finish({
    json: call.json,
    result: {
      dry_run: dryRun,
      row: written.file,
      font: written.row,
      stated: origin.stated,
      next,
      files: writtenFiles(lines),
    },
    text: `${text.join("\n")}\n`,
    // The licence waits on a person, whatever was written.
    work: true,
  });
}

await start(import.meta.url, main);
