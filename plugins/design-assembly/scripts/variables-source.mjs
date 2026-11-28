// Keeps an export of variables that was brought in under the sources ledger (spec 0018, criterion
// 13): it writes the row design/sources/<id>.json, of the kind `variables`, from a file the
// repository already keeps, hashed where it is, with the day it was taken and the plug it came
// through. It copies, fetches and changes no file: a file that is not in the repository gets no
// row. What is kept is the JSON of the variables; a file that is not one is refused, so the design
// file an export was read from is never pinned. A row that exists is never written over.
// With --check it writes nothing: it says, for every row of the kind, whether its file is still the
// one it was pinned with, naming the row and the file when it is not.
// With --again, the file of a row already there is pinned as it is now, with the day; every other
// word of the row stays.
// Usage: node variables-source.mjs [--target DIR] --file PATH [--plug ID] [--id ID] [--title NAME]
//                                  [--on DATE] [--dry-run] [--json]
//        node variables-source.mjs [--target DIR] --again --id ID [--on DATE] [--dry-run] [--json]
//        node variables-source.mjs [--target DIR] --check [--json]
// Exit: 0 the row is written, or would be, or every kept export is the file it was pinned with;
// 1 with --check, a file differs from its pin; 2 a wrong call, a file the repository does not hold
// or that is no export of variables, or a row that is already there. On 2 nothing is written.
import { existsSync, readFileSync, realpathSync, statSync } from "node:fs";
import path from "node:path";
import { stdout } from "node:process";

import { newerProblem, shapeProblems } from "../templates/tools/design-assembly/contract.mjs";
import { lineWidth, renderJson } from "../templates/tools/design-assembly/json.mjs";
import {
  isVariablesSource,
  readVariablesSources,
  SOURCES_FOLDER,
  SOURCES_VERSION,
  unreadSourceFiles,
  VARIABLES_KIND,
} from "../templates/tools/design-assembly/sources-ledger.mjs";
import { isDay } from "../templates/tools/design-assembly/waiting.mjs";
import { writeFiles, writtenFiles } from "./apply.mjs";
import { readCapabilities } from "./capabilities.mjs";
import { finish, readCall, Refusal, refuse, start } from "./command.mjs";
import { filesPin, idOf, today } from "./font-source.mjs";
import { kindOf } from "./outside-tokens.mjs";
import { toolPredates } from "./tool-knows.mjs";

// The id of a row when none is given: the plug's id before it, when the export came through a plug.
export const VARIABLES_ID = "variables";
const NOTHING = "Nothing was written";

// Why no row of the kind is written here, or null: the repository's copy of the tool predates the
// kind, and its gate would read the row as a library with no catalog.
const kindPredates = (root) =>
  toolPredates(root, {
    file: "sources-ledger.mjs",
    word: "VARIABLES_KIND",
    part: `the kind ${VARIABLES_KIND}`,
  });

// The pin of the files named, each hashed where it is, with its size. Each must be a file of the
// repository, outside the folder of the ledger's own rows, and an export of variables as the
// bridge in reads one. It throws one sentence on the first that is not.
export function exportPin(root, files) {
  let pinned;
  try {
    pinned = filesPin(root, files, (file) => ({
      bytes: statSync(path.resolve(root, String(file))).size,
    })).pin.files;
  } catch (error) {
    throw new Error(
      `${error.message}: put the export in the repository first, outside ${SOURCES_FOLDER}, and name it by its path from the root`,
      { cause: error },
    );
  }
  const held = realpathSync.native(root);
  for (const { file } of pinned) {
    // The path as the disk spells it: where the case of letters does not tell two names apart, a
    // path typed another way reaches the same file, and would be pinned by a name that is not its.
    const spelt = path
      .relative(held, realpathSync.native(path.join(root, file)))
      .split(path.sep)
      .join("/");
    if (spelt !== file) {
      throw new Error(
        `${file} is written otherwise than the repository holds it, which is ${spelt}: name the file as it is on disk`,
      );
    }
    if (path.posix.dirname(file) === SOURCES_FOLDER) {
      throw new Error(
        `${file} is in the folder of the ledger's own rows, where it would be read as a row: keep the export in another folder`,
      );
    }
    const full = path.join(root, file);
    const text = readFileSync(full, "utf8");
    let kind;
    try {
      kind = kindOf(full, text);
    } catch {
      throw new Error(
        `${file} is not JSON: what is kept is the JSON of the variables, and a design file itself is never pinned`,
      );
    }
    if (kind !== "variables") {
      throw new Error(
        `${file} is not an export of variables: it lists no variables by collection (meta.variables and meta.variableCollections)`,
      );
    }
  }
  // The size before the hash, as a person reads a pin.
  return pinned.map(({ file, sha256, bytes }) => ({ file, bytes, sha256 }));
}

// The row of an export of variables, as it would be written, with its file.
export function variablesRow(root, { file, plug = null, id, title = null, on }) {
  const named = id ?? (plug ? `${plug}-${VARIABLES_ID}` : VARIABLES_ID);
  const row = {
    version: SOURCES_VERSION,
    id: named,
    kind: VARIABLES_KIND,
    ...(title ? { title } : {}),
    ...(plug ? { plug } : {}),
    pin: { fetched_at: on, files: exportPin(root, [file]) },
  };
  const rowFile = `${SOURCES_FOLDER}/${named}.json`;
  const content = renderJson(row, lineWidth(root));
  return { file: rowFile, row, content, problems: shapeProblems("sources", content, rowFile) };
}

// Every kept export against its pin: a line for each row, and the sentences of the ones that
// differ, each naming the row and the file.
export function checkPins(root) {
  const rows = readVariablesSources(root);
  // A file of the ledger that is not JSON may have been such a row: it is said, never passed over.
  const torn = unreadSourceFiles(root).map(
    (file) =>
      `${file} is not valid JSON, so whether it pins an export of variables is not known: mend the file, then run this again`,
  );
  const differs = [...torn, ...rows.flatMap((row) => [...row.problems, ...row.drift])];
  const lines = rows.flatMap((row) => {
    const wrong = [...row.problems, ...row.drift];
    if (wrong.length === 0) {
      const files = row.pin.files.map((entry) => entry.file).join(", ");
      const through = row.plug ? `, through the plug ${row.plug}` : "";
      return [
        `${row.file}: ${files} is the file it was pinned with on ${row.fetched_at}${through}`,
      ];
    }
    return [
      ...wrong,
      `  next: put the pinned file back; or, when the file as it is now is the one to keep, pin it again with variables-source --again --id ${row.id}`,
    ];
  });
  return {
    rows: rows.map(({ id, file, plug, fetched_at: fetched, pin, problems, drift }) => ({
      id,
      file,
      plug,
      fetched_at: fetched,
      files: (pin?.files ?? []).map((entry) => entry.file),
      differs: [...problems, ...drift],
    })),
    differs,
    text:
      rows.length === 0 && torn.length === 0
        ? "no export of variables is kept here: no row of the sources ledger is of the kind variables\n"
        : `${[...torn, ...lines].join("\n")}\n`,
  };
}

const USAGE = `usage: node variables-source.mjs [--target DIR] --file PATH [--plug ID] [--id ID] [--title NAME]
                                 [--on DATE] [--dry-run] [--json]
       node variables-source.mjs [--target DIR] --again --id ID [--on DATE] [--dry-run] [--json]
       node variables-source.mjs [--target DIR] --check [--json]

  --file      The export of variables, already in the repository, by its path from its root, in a
              folder other than ${SOURCES_FOLDER}. It is hashed where it is, and must be the JSON of
              variables by collection the bridge in reads: any other file is refused.
  --plug      The id of the plug the export came through, as the plugs board names it.
  --id        The row's id, and the name of its file. Without it, ${VARIABLES_ID}, after the plug's
              id when --plug is given.
  --title     A name for the system the export holds, in a person's words.
  --on        The day the export was taken, as YYYY-MM-DD. Without it, today.
  --again     Pin the file of the row --id names as it is now, with the day; every other word of
              the row stays.
  --check     Write nothing: say, for every row of the kind ${VARIABLES_KIND}, whether its file is
              still the one it was pinned with.
  --dry-run   Say what would be written, and write nothing.
  --json      The row, its file, and what was written; with --check, each row and what differs.

  Writes one file, ${SOURCES_FOLDER}/<id>.json, and never writes over one except with --again.
  It copies, fetches and changes no other file.

  Ends with 1 when --check finds a file that differs from its pin; with 2 on a wrong call, a file
  the repository does not hold or that is no export of variables, or a row that is already there.
`;

const FLAGS = {
  "--file": "value",
  "--plug": "value",
  "--id": "value",
  "--title": "value",
  "--on": "value",
  "--again": "switch",
  "--check": "switch",
  "--dry-run": "switch",
};

function main(args) {
  const call = readCall(args, FLAGS);
  if (call.problem) return refuse(call.problem, USAGE);
  if (call.help) return void stdout.write(USAGE);
  const root = call.target;
  const flags = call.flags;
  const modes = [
    flags["--file"] !== undefined,
    flags["--again"] === true,
    flags["--check"] === true,
  ];
  if (modes.filter(Boolean).length > 1) {
    return refuse("give --file, --again or --check, one of them", USAGE);
  }
  if (flags["--check"] === true) {
    const { rows, differs, text } = checkPins(root);
    return finish({ json: call.json, result: { rows, differs }, text, work: differs.length > 0 });
  }
  if (flags["--file"] === undefined && flags["--again"] !== true) {
    return refuse(
      "--file names the export of variables, already in the repository, by its path from its root; --check compares every kept export with its pin",
      USAGE,
    );
  }
  const on = flags["--on"] ?? today();
  if (!isDay(on)) throw new Refusal(`--on takes a day written YYYY-MM-DD, and ${on} is not one`);
  const id = flags["--id"] === undefined ? undefined : idOf(flags["--id"]);
  if (id === "") throw new Refusal(`--id ${flags["--id"]} holds no letter or digit`);
  const dryRun = flags["--dry-run"] === true;
  if (flags["--again"] === true) {
    for (const flag of ["--plug", "--title"]) {
      if (flags[flag] !== undefined) {
        return refuse(
          `--again changes the pin alone: ${flag} is written into the row by hand`,
          USAGE,
        );
      }
    }
    return pinAgain(root, { id, on, dryRun, json: call.json });
  }

  const plug = flags["--plug"] ?? null;
  if (plug !== null && !readCapabilities().plugs.some((each) => each.id === plug)) {
    throw new Refusal(
      `--plug ${plug} names no plug file of the plugin: give the id the plugs board names, or leave it out. ${NOTHING}`,
    );
  }
  let written;
  try {
    written = variablesRow(root, {
      file: flags["--file"],
      plug,
      id,
      title: flags["--title"] ?? null,
      on,
    });
  } catch (error) {
    throw new Refusal(`${error.message}. ${NOTHING}`);
  }
  if (written.problems.length > 0) {
    throw new Refusal(`${written.problems.join("; ")}. ${NOTHING}`);
  }
  // A row the installed gate cannot read would turn it red: upgrade comes first.
  const predates = kindPredates(root);
  if (predates) throw new Refusal(`${predates}, then run this again. ${NOTHING}`);
  const full = path.join(root, written.file);
  if (existsSync(full)) {
    // A row of a newer shape, or a file that is not JSON, is a person's file too.
    let newer;
    try {
      newer = newerProblem("sources", JSON.parse(readFileSync(full, "utf8")), written.file);
    } catch {
      newer = null;
    }
    throw new Refusal(
      `${newer ?? `${written.file} is already there`}: a row is never written over. Pin its file again with --again --id ${written.row.id}, or give another --id`,
    );
  }
  const lines = writeFiles(root, { [written.file]: written.content }, dryRun);
  const [kept] = written.row.pin.files;
  const text = [
    `export of variables: ${kept.file}, hashed where it is, taken on ${on}${plug ? `, through the plug ${plug}` : ""}`,
    ...lines.map((line) => `  ${line}`),
    `next: variables-source --check says when ${kept.file} is no longer the file that was pinned`,
    ...(dryRun ? ["preview only: nothing was written"] : []),
  ];
  return finish({
    json: call.json,
    result: {
      dry_run: dryRun,
      row: written.file,
      source: written.row,
      files: writtenFiles(lines),
    },
    text: `${text.join("\n")}\n`,
    work: false,
  });
}

// The file of a row already there, pinned as it is now, with the day: every other word of the row,
// and of each file's entry, stays as it was. A row that is not there, or is of another kind, is
// refused, and so is a file that is gone or is no longer an export of variables.
function pinAgain(root, { id, on, dryRun, json }) {
  if (id === undefined) {
    throw new Refusal("--again takes --id, the row whose file is pinned again");
  }
  const file = `${SOURCES_FOLDER}/${id}.json`;
  let row;
  try {
    row = JSON.parse(readFileSync(path.join(root, file), "utf8"));
  } catch {
    row = null;
  }
  if (!isVariablesSource(row)) {
    throw new Refusal(
      `${file} is no row of the kind ${VARIABLES_KIND}: write one first, with variables-source --file. ${NOTHING}`,
    );
  }
  const predates = kindPredates(root);
  if (predates) throw new Refusal(`${predates}, then run this again. ${NOTHING}`);
  const kept = Array.isArray(row.pin?.files) ? row.pin.files : [];
  if (
    kept.length === 0 ||
    kept.some((entry) => typeof entry?.file !== "string" || entry.file === "")
  ) {
    throw new Refusal(
      `${file} names no file in its pin: there is nothing to pin again. ${NOTHING}`,
    );
  }
  let pinned;
  try {
    pinned = exportPin(
      root,
      kept.map((entry) => entry?.file),
    );
  } catch (error) {
    throw new Refusal(`${error.message}. ${NOTHING}`);
  }
  const next = {
    ...row,
    pin: {
      ...row.pin,
      fetched_at: on,
      files: pinned.map((entry, index) => ({ ...kept[index], ...entry })),
    },
  };
  const content = renderJson(next, lineWidth(root));
  const problems = shapeProblems("sources", content, file);
  if (problems.length > 0) throw new Refusal(`${problems.join("; ")}. ${NOTHING}`);
  const lines = writeFiles(root, { [file]: content }, dryRun);
  const text = [
    `export of variables: ${pinned.map((entry) => entry.file).join(", ")} pinned again as it is now, taken on ${on}; every other word of ${file} is kept`,
    ...lines.map((line) => `  ${line}`),
    ...(dryRun ? ["preview only: nothing was written"] : []),
  ];
  return finish({
    json,
    result: { dry_run: dryRun, row: file, source: next, files: writtenFiles(lines) },
    text: `${text.join("\n")}\n`,
    work: false,
  });
}

await start(import.meta.url, main);
