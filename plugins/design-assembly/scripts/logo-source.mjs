// Writes the row of the product's mark into the sources ledger, design/sources/<id>.json, from
// files the repository already keeps: each file named with its role and its variant, and hashed
// where it is. It draws nothing, fetches nothing and changes no file of the mark: a file that is not
// there gets no row. The licence is a person's to write (who holds the right to use the mark, and
// where it may be used): the row says a command proposed it, is not held until the licence is
// there, and `status` asks for it. A row that exists is never written over. Where the gate is laid,
// the check that holds the pin of every logo row is laid beside the row.
// Usage: node logo-source.mjs [--target DIR] --file PATH:ROLE:VARIANT [--file ...] [--title NAME]
//                             [--id ID] [--on DATE] [--dry-run] [--json]
// Exit: 1 the row is written, or would be, and its licence waits on a person; 2 a wrong call, a
// file the repository does not hold, or a row that is already there.
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { stdout } from "node:process";

import { writeFiles, writtenFiles } from "./apply.mjs";
import { finish, readCall, Refusal, refuse, start } from "./command.mjs";
import { filesPin, idOf, today } from "./font-source.mjs";
import { buildOf } from "../templates/tools/design-assembly/adapters/index.mjs";
import { newerProblem, shapeProblems } from "../templates/tools/design-assembly/contract.mjs";
import { lineWidth, renderJson } from "../templates/tools/design-assembly/json.mjs";
import {
  LOGO_KIND,
  LOGO_PINS_CHECK,
  LOGO_ROLES,
  LOGO_VARIANTS,
  readLogoSources,
  SOURCES_FOLDER,
  SOURCES_VERSION,
} from "../templates/tools/design-assembly/sources-ledger.mjs";
import { isDay } from "../templates/tools/design-assembly/waiting.mjs";
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
export function logoRow(root, { files, title, id, own = false, by = BY, on }) {
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
    proposed: { by, on },
  };
  const file = `${SOURCES_FOLDER}/${named}.json`;
  const content = renderJson(row, lineWidth(root));
  return { file, row, content, problems: shapeProblems("sources", content, file) };
}

// The tool data with the check that holds the pin of every logo row laid beside the shapes of the
// ledgers, or null when there is no gate to lay it in or it is there already.
export function themeWithLogoPins(root, text) {
  let theme;
  try {
    theme = JSON.parse(text ?? "null");
  } catch {
    return null;
  }
  const shapes = theme?.checks?.[SHAPES_ROW];
  if (!Array.isArray(shapes) || shapes.some((check) => check?.kind === LOGO_PINS_CHECK.kind)) {
    return null;
  }
  const checks = { ...theme.checks, [SHAPES_ROW]: [...shapes, LOGO_PINS_CHECK] };
  return renderJson({ ...theme, checks }, lineWidth(root));
}

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

const USAGE = `usage: node logo-source.mjs [--target DIR] --file PATH:ROLE:VARIANT [--file ...]
                            [--title NAME] [--id ID] [--on DATE] [--dry-run] [--json]

  --file      A file of the mark, already in the repository, by its path from its root, with its
              role and its variant; once per file. Each is hashed where it is.
              Roles: ${LOGO_ROLES.join(", ")}.
              Variants: ${LOGO_VARIANTS.join(", ")}.
  --title     The name of the product the mark stands for. Without it, the name the repository's
              package gives.
  --id        The row's id, and the name of its file. Without it, ${LOGO_ID}.
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
  "--on": "value",
  "--dry-run": "switch",
};

function main(args) {
  const call = readCall(args, FLAGS);
  if (call.problem) return refuse(call.problem, USAGE);
  if (call.help) return void stdout.write(USAGE);
  const root = call.target;
  const flags = call.flags;
  if (flags["--package"] !== undefined) {
    throw new Refusal(
      "a package of mark files with its manifest is not read yet: give each file already in the repository with --file PATH:ROLE:VARIANT. Nothing was written",
    );
  }
  const given = flags["--file"] ?? [];
  if (given.length === 0) {
    return refuse("--file names a file of the mark, as PATH:ROLE:VARIANT, once per file", USAGE);
  }
  const files = given.map(namedFile);
  const on = flags["--on"] ?? today();
  if (!isDay(on)) throw new Refusal(`--on takes a day written YYYY-MM-DD, and ${on} is not one`);
  const id = flags["--id"] === undefined ? undefined : idOf(flags["--id"]);
  if (id === "") throw new Refusal(`--id ${flags["--id"]} holds no letter or digit`);
  const dryRun = flags["--dry-run"] === true;
  let written;
  try {
    written = logoRow(root, {
      files,
      title: flags["--title"] ?? packageName(root),
      id,
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
  const text = [
    `mark: ${written.row.title ?? written.row.id}, from ${files.length} file(s) of the repository, hashed where they are`,
    ...files.map((entry) => `  ${entry.file}: ${entry.role}, ${entry.variant}`),
    ...lines.map((line) => `  ${line}`),
    ...(theme ? [`gate: the check ${LOGO_PINS_CHECK.kind} holds the pin of every logo row`] : []),
    `next: ${next}`,
    ...(dryRun ? ["preview only: nothing was written"] : []),
  ];
  return finish({
    json: call.json,
    result: {
      dry_run: dryRun,
      row: written.file,
      mark: written.row,
      next,
      files: writtenFiles(lines),
    },
    text: `${text.join("\n")}\n`,
    // The licence waits on a person, whatever was written.
    work: true,
  });
}

await start(import.meta.url, main);
