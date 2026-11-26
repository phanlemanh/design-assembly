// Writes the row of the product's mark into the sources ledger, design/sources/<id>.json, from
// files the repository already keeps: each file named with its role and its variant, and hashed
// where it is. It draws nothing, fetches nothing and changes no file of the mark: a file that is not
// there gets no row. The licence is a person's to write (who holds the right to use the mark, and
// where it may be used): the row says a command proposed it, is not held until the licence is
// there, and `status` asks for it. A row that exists is never written over. Where the gate is laid,
// the check that holds the pin of every logo row is laid beside the row.
// With --into, the files are added to a row already there, and nothing it pins or says is changed.
// With --package, the files are those of a package an outside plug left, read with its manifest:
// each compared with the hash the manifest lists, the row saying which plug made the mark and on
// which day; who chose it is read from the decision sheet, never from the package.
// Usage: node logo-source.mjs [--target DIR] (--file PATH:ROLE:VARIANT [--file ...] | --package DIR)
//                             [--title NAME] [--id ID | --into ID] [--on DATE] [--dry-run] [--json]
// Exit: 0 files added to a row a person finished; 1 the row is written, or would be, and its
// licence waits on a person; 2 a wrong call, a file the repository does not hold, or a row that is
// already there.
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { stdout } from "node:process";

import { writeFiles, writtenFiles } from "./apply.mjs";
import { finish, readCall, Refusal, refuse, start } from "./command.mjs";
import { filesPin, idOf, today } from "./font-source.mjs";
import { chosenOnSheet, readLogoPackage } from "./logo-package.mjs";
import { buildOf } from "../templates/tools/design-assembly/adapters/index.mjs";
import { newerProblem, shapeProblems } from "../templates/tools/design-assembly/contract.mjs";
import { lineWidth, renderJson } from "../templates/tools/design-assembly/json.mjs";
import {
  isLogo,
  LOGO_KIND,
  LOGO_PINS_CHECK,
  LOGO_USE_CHECK,
  LOGO_ROLES,
  LOGO_VARIANTS,
  readLogoSources,
  SOURCES_FOLDER,
  SOURCES_VERSION,
} from "../templates/tools/design-assembly/sources-ledger.mjs";
import { isDay } from "../templates/tools/design-assembly/waiting.mjs";
import { TOOL_COPY } from "./stamp.mjs";
import { toolPredates } from "./tool-knows.mjs";

// The command a row says proposed it, when this script is called by itself.
const BY = "logo-source";
// The id of a mark's row when none is given: a repository has one mark, with all its files.
export const LOGO_ID = "logo";
const THEME = "design/theme.json";
const SHAPES_ROW = "ledger-shapes";
// The variant adopt writes for a page icon, which a person checks: a page icon is most often the
// mark in its colours.
const PLAIN_VARIANT = "color";

// A file named on the command line, as PATH:ROLE:VARIANT, read from the right so that a path may
// hold a colon. Throws one sentence when the role or the variant is missing or unknown.
export function namedFile(given) {
  const parts = String(given).split(":");
  if (parts.length < 3 || parts.slice(0, -2).join(":") === "") {
    throw new Refusal(
      `--file ${given} names no role and variant: give each file with its role and its variant, as PATH:ROLE:VARIANT`,
    );
  }
  const [role, variant] = parts.slice(-2);
  const file = parts.slice(0, -2).join(":");
  if (!LOGO_ROLES.includes(role)) {
    throw new Refusal(`${role} is not a role of a mark file: one of ${LOGO_ROLES.join(", ")}`);
  }
  if (!LOGO_VARIANTS.includes(variant)) {
    throw new Refusal(
      `${variant} is not a variant of a mark file: one of ${LOGO_VARIANTS.join(", ")}`,
    );
  }
  return { file, role, variant };
}

// The name of the product as the repository's own package gives it, or null: a title is the
// repository's data, never the plugin's.
function packageName(root) {
  try {
    const name = JSON.parse(readFileSync(path.join(root, "package.json"), "utf8")).name;
    return typeof name === "string" && name.trim() !== "" ? name : null;
  } catch {
    return null;
  }
}

// The row of a mark, as it would be written, with its file. Each named file is hashed where it is,
// and keeps the role and the variant it was named with. It throws on a file that is not there, or
// one named twice. The row has no licence: no tool writes one.
export function logoRow(root, { files, title, id, own = false, made = null, by = BY, on }) {
  const seen = new Set();
  for (const entry of files) {
    if (seen.has(entry.file)) {
      throw new Error(
        `${entry.file} is named twice: each file of the mark has one role and one variant`,
      );
    }
    seen.add(entry.file);
  }
  const { pin } = filesPin(
    root,
    files.map((entry) => entry.file),
  );
  const named = id ?? LOGO_ID;
  const row = {
    version: SOURCES_VERSION,
    id: named,
    kind: LOGO_KIND,
    ...(title ? { title } : {}),
    pin: {
      files: pin.files.map((entry, index) => ({
        ...entry,
        role: files[index].role,
        variant: files[index].variant,
      })),
    },
    ...(own ? { own: true } : {}),
    ...(made ? { made } : {}),
    proposed: { by, on },
  };
  const file = `${SOURCES_FOLDER}/${named}.json`;
  const content = renderJson(row, lineWidth(root));
  return { file, row, content, problems: shapeProblems("sources", content, file) };
}

// Why the check of the mark's use is not laid, or null: the repository's copy of the tool predates
// it, and its gate would not know it. Upgrade brings the tool and lays the check.
export function logoUsePredates(root) {
  const said = toolPredates(root, {
    file: "check.mjs",
    word: "LOGO_USE_CHECK",
    part: `the check ${LOGO_USE_CHECK.kind}`,
  });
  return said === null
    ? null
    : `the repository's copy of the tool, ${TOOL_COPY}, predates the check ${LOGO_USE_CHECK.kind}: bring the tool up with upgrade, which lays it`;
}

// The checks a logo row is held by, beside the shapes of the ledgers: its pins, and the mark's use
// where the repository's copy of the tool knows that check.
export const logoChecks = (root) => [
  LOGO_PINS_CHECK,
  ...(logoUsePredates(root) === null ? [LOGO_USE_CHECK] : []),
];

// The tool data with the checks that hold every logo row laid beside the shapes of the ledgers, or
// null when there is no gate to lay them in or they are there already.
export function themeWithLogoPins(root, text) {
  let theme;
  try {
    theme = JSON.parse(text ?? "null");
  } catch {
    return null;
  }
  const shapes = theme?.checks?.[SHAPES_ROW];
  if (!Array.isArray(shapes)) return null;
  const missing = logoChecks(root).filter(
    (laid) => !shapes.some((check) => check?.kind === laid.kind),
  );
  if (missing.length === 0) return null;
  const checks = { ...theme.checks, [SHAPES_ROW]: [...shapes, ...missing] };
  return renderJson({ ...theme, checks }, lineWidth(root));
}

// What the gate says it holds once the checks of a logo row are laid, and what upgrade lays later.
export function gateLines(root) {
  const left = logoUsePredates(root);
  return [
    `gate: the check ${LOGO_PINS_CHECK.kind} holds the pin of every logo row`,
    left
      ? `gate: ${left}`
      : `gate: the check ${LOGO_USE_CHECK.kind} holds that the page icons and the images of the app frame are files of a logo row`,
  ];
}

// What a person does once a mark is new or its files changed: the owner chooses it.
export const ownerStep = (id) =>
  `a new mark, or a changed file of one, is the owner's call: ask with decide --ask --item logo:${id}, and build on it once the owner keeps it`;

// Why no logo row is written here, or null: the repository's copy of the tool predates the kind,
// and its gate would read the row as a library with no catalog and not know the check of its pins.
export const logoToolPredates = (root) =>
  toolPredates(root, {
    file: "sources-ledger.mjs",
    word: "LOGO_KIND",
    part: `the kind ${LOGO_KIND}`,
  });

// What a person does next with a row a command wrote.
export const licenceStep = (file) =>
  `write who holds the right to use the mark, and where it may be used, into licence of ${file}, in a person's words: until then the row is not held and the mark cannot be chosen`;

// The repository's own mark, read from the icons its pages declare, as the adapter of its build
// reads them: the row that would be proposed from them, the row already there, and what cannot be
// read, which a person writes. Nothing is fetched to find out, and no file is changed.
export function ownMark(root, { on, by }) {
  const build = buildOf(root);
  const person = "a person writes the row with logo-source";
  if (typeof build.markFiles !== "function") {
    return {
      cannot: [
        `the ${build.id} build is not read for the icons its pages declare, so nothing is proposed: ${person}`,
      ],
    };
  }
  const declared = build.markFiles(root);
  if (declared.length === 0) return {};
  const cannot = declared
    .filter((icon) => icon.file === null)
    .map(
      (icon) =>
        `the page declares the icon ${icon.said}, which is no file of the repository, so nothing is proposed for it: ${person}`,
    );
  const found = declared.filter((icon) => icon.file !== null);
  const rows = readLogoSources(root);
  if (rows.length > 0) {
    const pinned = new Set(
      rows.flatMap((row) => (row.pin?.files ?? []).map((entry) => entry.file)),
    );
    return {
      cannot: [
        ...cannot,
        ...found
          .filter((icon) => !pinned.has(icon.file))
          .map(
            (icon) =>
              `the page declares the icon ${icon.file}, which no logo row pins: add it to the row by hand, with its role and its variant`,
          ),
      ],
      exists: rows.map((row) => row.file),
    };
  }
  if (found.length === 0) return { cannot };
  const files = found.map((icon) => ({ file: icon.file, role: icon.role, variant: PLAIN_VARIANT }));
  let written;
  try {
    written = logoRow(root, { files, title: packageName(root), own: true, by, on });
  } catch (error) {
    return { cannot: [...cannot, `${error.message}: ${person}`] };
  }
  if (existsSync(path.join(root, written.file))) return { cannot, exists: [written.file] };
  if (written.problems.length > 0) return { cannot: [...cannot, written.problems.join("; ")] };
  return {
    cannot,
    proposed: {
      row: written.file,
      content: written.content,
      files,
      from: `${files.length} file(s) of the repository, hashed where they are`,
    },
  };
}

const USAGE = `usage: node logo-source.mjs [--target DIR] (--file PATH:ROLE:VARIANT [--file ...] | --package DIR)
                            [--title NAME] [--id ID] [--on DATE] [--dry-run] [--json]

  --file      A file of the mark, already in the repository, by its path from its root, with its
              role and its variant; once per file. Each is hashed where it is.
              Roles: ${LOGO_ROLES.join(", ")}.
              Variants: ${LOGO_VARIANTS.join(", ")}.
  --package   A folder of the repository holding a package of mark files an outside plug left,
              with its manifest, manifest.json, beside them: every file is compared with the
              hash the manifest lists, and the package holds no file it does not name. The row
              says which plug made the mark and on which day; who chose it is read from the
              waiting list. In place of --file.
  --title     The name of the product the mark stands for. Without it, the title of the package's
              manifest, else the name the repository's package gives.
  --id        The row's id, and the name of its file. Without it, ${LOGO_ID}.
  --into      The id of a logo row already there: the files are added to it, each hashed where it
              is, and nothing the row pins or says is changed. A file it pins is refused.
  --on        The day the row is written, as YYYY-MM-DD. Without it, today.
  --dry-run   Say what would be written, and write nothing.
  --json      The row, its file, and the next step.

  Writes one file, ${SOURCES_FOLDER}/<id>.json, and never writes over one; where the gate is laid,
  the check that holds the pin of every logo row is added to ${THEME}. It draws, fetches and
  changes nothing else. The row has no licence: a person writes who holds the right to use the mark
  and where, and the row is held from then on.

  Ends with 1 when the row is written, since its licence waits on a person; with 2 on a wrong
  call, a file the repository does not hold, or a row that is already there.
`;

const FLAGS = {
  "--file": "list",
  "--package": "value",
  "--title": "value",
  "--id": "value",
  "--into": "value",
  "--on": "value",
  "--dry-run": "switch",
};

function main(args) {
  const call = readCall(args, FLAGS);
  if (call.problem) return refuse(call.problem, USAGE);
  if (call.help) return void stdout.write(USAGE);
  const root = call.target;
  const flags = call.flags;
  const given = flags["--file"] ?? [];
  const fromPackage = flags["--package"] !== undefined;
  if (fromPackage && given.length > 0) {
    return refuse(
      "give --file or --package, not both: where the files of the mark come from",
      USAGE,
    );
  }
  if (!fromPackage && given.length === 0) {
    return refuse(
      "--file names a file of the mark, as PATH:ROLE:VARIANT, once per file; or --package names a package of them",
      USAGE,
    );
  }
  let pack = null;
  if (fromPackage) {
    try {
      pack = readLogoPackage(root, flags["--package"]);
    } catch (error) {
      throw new Refusal(`${error.message}. Nothing was written`);
    }
  }
  const files = pack ? pack.files : given.map(namedFile);
  const on = flags["--on"] ?? today();
  if (!isDay(on)) throw new Refusal(`--on takes a day written YYYY-MM-DD, and ${on} is not one`);
  const id = flags["--id"] === undefined ? undefined : idOf(flags["--id"]);
  if (id === "") throw new Refusal(`--id ${flags["--id"]} holds no letter or digit`);
  const dryRun = flags["--dry-run"] === true;
  if (flags["--into"] !== undefined) {
    if (id !== undefined) throw new Refusal("give --id or --into, not both");
    if (pack)
      throw new Refusal("give --package or --into, not both: a package makes a row of its own");
    return addInto(root, { into: flags["--into"], files, dryRun, json: call.json });
  }
  let written;
  try {
    written = logoRow(root, {
      files,
      title: flags["--title"] ?? pack?.title ?? packageName(root),
      id,
      made: pack?.made ?? null,
      on,
    });
  } catch (error) {
    throw new Refusal(`${error.message}. Nothing was written`);
  }
  if (written.problems.length > 0) {
    throw new Refusal(`${written.problems.join("; ")}. Nothing was written`);
  }
  // A row the installed gate cannot read would turn it red: upgrade comes first.
  const predates = logoToolPredates(root);
  if (predates) throw new Refusal(`${predates}, then run this again. Nothing was written`);
  const full = path.join(root, written.file);
  if (existsSync(full)) {
    // A row of a newer shape, or any other, is a person's file: never written over.
    // A file that is not JSON is a person's too: it is said to be there.
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
  const theme = existsSync(path.join(root, THEME))
    ? themeWithLogoPins(root, readFileSync(path.join(root, THEME), "utf8"))
    : null;
  const lines = writeFiles(
    root,
    { [written.file]: written.content, ...(theme ? { [THEME]: theme } : {}) },
    dryRun,
  );
  const next = licenceStep(written.file);
  // Who chose the mark: the owner's answer on the decision sheet, never a word of the package.
  const chosen = chosenOnSheet(root, written.row.id);
  const name = written.row.title ?? written.row.id;
  const text = [
    pack
      ? `mark: ${name}, from the package ${pack.folder}, made by ${pack.made.by} on ${pack.made.on}; its ${files.length} file(s) match the hashes its manifest lists`
      : `mark: ${name}, from ${files.length} file(s) of the repository, hashed where they are`,
    ...files.map((entry) => `  ${entry.file}: ${entry.role}, ${entry.variant}`),
    ...lines.map((line) => `  ${line}`),
    ...(theme ? gateLines(root) : []),
    ...(chosen
      ? [`chosen: by ${chosen.by} on ${chosen.on}, in ${chosen.question} of the waiting list`]
      : []),
    `next: ${next}`,
    ...(chosen ? [] : [`then: ${ownerStep(written.row.id)}`]),
    ...(dryRun ? ["preview only: nothing was written"] : []),
  ];
  return finish({
    json: call.json,
    result: {
      dry_run: dryRun,
      row: written.file,
      mark: written.row,
      ...(pack ? { package: pack.folder, made: pack.made } : {}),
      chosen,
      next,
      files: writtenFiles(lines),
    },
    text: `${text.join("\n")}\n`,
    // The licence waits on a person, whatever was written.
    work: true,
  });
}

// Files added to a logo row already there, each hashed where it is: every file the row pins, and
// every word it says, stays as it was. A file the row pins already is refused, and so is a row that
// is not there or is not a logo.
function addInto(root, { into, files, dryRun, json }) {
  const id = idOf(into);
  if (id === "") throw new Refusal(`--into ${into} holds no letter or digit`);
  const file = `${SOURCES_FOLDER}/${id}.json`;
  let row;
  try {
    row = JSON.parse(readFileSync(path.join(root, file), "utf8"));
  } catch {
    row = null;
  }
  if (!isLogo(row)) {
    throw new Refusal(
      `${file} is no logo row: write one first, with logo-source --file. Nothing was written`,
    );
  }
  const predates = logoToolPredates(root);
  if (predates) throw new Refusal(`${predates}, then run this again. Nothing was written`);
  const kept = Array.isArray(row.pin?.files) ? row.pin.files : [];
  for (const entry of files) {
    if (kept.some((pinned) => pinned?.file === entry.file)) {
      throw new Refusal(
        `${entry.file} is pinned by ${file} already: a file of the mark is named once. Nothing was written`,
      );
    }
  }
  let added;
  try {
    added = logoRow(root, { files, id, on: today() }).row.pin.files;
  } catch (error) {
    throw new Refusal(`${error.message}. Nothing was written`);
  }
  const next = { ...row, pin: { ...row.pin, files: [...kept, ...added] } };
  const content = renderJson(next, lineWidth(root));
  const problems = shapeProblems("sources", content, file);
  if (problems.length > 0) throw new Refusal(`${problems.join("; ")}. Nothing was written`);
  const theme = existsSync(path.join(root, THEME))
    ? themeWithLogoPins(root, readFileSync(path.join(root, THEME), "utf8"))
    : null;
  const lines = writeFiles(root, { [file]: content, ...(theme ? { [THEME]: theme } : {}) }, dryRun);
  const waits = typeof row.licence !== "string" || row.licence.trim() === "";
  const text = [
    `mark: ${row.title ?? row.id}, ${files.length} file(s) added to ${file}, hashed where they are; every file it pinned is kept`,
    ...files.map((entry) => `  ${entry.file}: ${entry.role}, ${entry.variant}`),
    ...lines.map((line) => `  ${line}`),
    ...(theme ? gateLines(root) : []),
    ...(waits ? [`next: ${licenceStep(file)}`] : []),
    `${waits ? "then" : "next"}: ${ownerStep(id)}`,
    ...(dryRun ? ["preview only: nothing was written"] : []),
  ];
  return finish({
    json,
    result: { dry_run: dryRun, row: file, mark: next, added, files: writtenFiles(lines) },
    text: `${text.join("\n")}\n`,
    work: waits,
  });
}

await start(import.meta.url, main);
