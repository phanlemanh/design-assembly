// The ledger of screens on disk, in either shape a repository keeps it in: one file, or a folder
// with one file per screen. Keeping the folder is the repository's choice, off until it asks:
// --split cuts the one file into fragments, --join takes that back, and --print gives the ledger
// as one text to whatever still reads one. Each says first what it will write, and --split stops
// when an entry would be lost. Nothing here touches git.
// Usage: node tools/design-assembly/screen-fragments.mjs [--split | --join | --print] [--dry-run]
//          [--target DIR]
import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  realpathSync,
  rmdirSync,
  unlinkSync,
  writeFileSync,
} from "node:fs";
import path from "node:path";
import { argv, cwd, exit, stderr, stdout } from "node:process";
import { fileURLToPath } from "node:url";

import { lineWidth, renderJson } from "./json.mjs";
import {
  FRAGMENTS_SHARED,
  fragmentsFolder,
  isFragment,
  joinLedger,
  lostEntries,
  readScreenLedger,
  SCREEN_LEDGER,
  splitLedger,
} from "./screen-ledger.mjs";

// The check that says a repository keeps its ledger of screens as fragments, as the tool data
// lists it. It joins the checks of the decision that holds the shapes of the ledgers: a repository
// the guide built and one that adopted both have that decision.
export const FRAGMENTS = "screen-fragments";
export const SHAPES_DECISION = "ledger-shapes";
const THEME = "design/theme.json";

const read = (root, file) =>
  existsSync(path.join(root, file)) ? readFileSync(path.join(root, file), "utf8") : null;

// The fragments a repository keeps for the ledger at `file`: the shared part and one text per
// screen, in the order of the ids; `beside` says the one file is there as well. Null when the
// folder does not hold the shared part: a folder of that name with other things in it is not a
// ledger.
export function readFragments(root, file = SCREEN_LEDGER) {
  const folder = fragmentsFolder(file);
  const shared = read(root, `${folder}/${FRAGMENTS_SHARED}`);
  if (shared === null) return null;
  const names = readdirSync(path.join(root, folder), { withFileTypes: true })
    .filter((entry) => entry.isFile() && isFragment(entry.name))
    .map((entry) => entry.name)
    .sort();
  return {
    folder,
    shared,
    fragments: names.map((name) => ({
      name,
      file: `${folder}/${name}`,
      text: readFileSync(path.join(root, folder, name), "utf8"),
    })),
    beside: existsSync(path.join(root, file)),
  };
}

// The ledger of screens as one text, whichever shape the repository keeps: the folder when it is
// there, else the one file, else null. Every tool of this plugin reads the ledger through here.
export function ledgerText(root, file = SCREEN_LEDGER) {
  const found = readFragments(root, file);
  return found ? joinLedger(found.shared, found.fragments) : read(root, file);
}

// The check to list beside the ledger's own when the checks of its decision are built again: the
// repository keeps fragments when its disk has them, or when its tool data already says so. The
// choice is carried, never made here.
export function fragmentsChecks(root, theme, file = SCREEN_LEDGER) {
  const asked = Object.values(theme?.checks ?? {})
    .flat()
    .some((check) => check?.kind === FRAGMENTS);
  return asked || readFragments(root, file) !== null
    ? [{ kind: FRAGMENTS, file, fragments: fragmentsFolder(file) }]
    : [];
}

// The tool data with the ledger kept as fragments, or as one file again. Only the ledger's own
// list of checks changes; data that already says so, or that does not hold the ledger at all,
// comes back as it was.
export function withFragments(theme, file, on) {
  const checks = theme?.checks?.[SHAPES_DECISION];
  if (!Array.isArray(checks)) return theme;
  const has = checks.some((check) => check.kind === FRAGMENTS && check.file === file);
  if (on === has) return theme;
  const others = checks.filter((check) => check.kind !== FRAGMENTS);
  const next = on
    ? [...others, { kind: FRAGMENTS, file, fragments: fragmentsFolder(file) }]
    : others;
  return { ...theme, checks: { ...theme.checks, [SHAPES_DECISION]: next } };
}

// The tool data of the repository, or null when it has none that reads.
function themeOf(root) {
  try {
    return JSON.parse(read(root, THEME) ?? "null");
  } catch {
    return null;
  }
}

// The path the repository's gate names for its ledger of screens, else the usual one.
function ledgerFile(root) {
  const named = (themeOf(root)?.checks?.[SHAPES_DECISION] ?? [])
    .map((check) => check?.ledgers?.screens)
    .find((file) => typeof file === "string");
  return named ?? SCREEN_LEDGER;
}

// Writes the choice into the tool data, and says whether a gate holds the ledger here.
function record(root, file, on) {
  const theme = themeOf(root);
  const next = withFragments(theme, file, on);
  if (next !== theme) writeFileSync(path.join(root, THEME), renderJson(next, lineWidth(root)));
  return Array.isArray(theme?.checks?.[SHAPES_DECISION]);
}

const NAME = "ledger of screens";
const count = (n) => `${n} ${n === 1 ? "screen" : "screens"}`;

// What cutting the one file into fragments would write, and why it must not.
export function splitPlan(root, file = SCREEN_LEDGER) {
  const folder = fragmentsFolder(file);
  const before = read(root, file);
  const { shared, fragments, problems } = splitLedger(before);
  const joined = joinLedger(shared, fragments);
  const stops = [...problems];
  if (problems.length === 0) {
    const lost = lostEntries(before, joined);
    const gained = lostEntries(joined, before);
    if (lost.length > 0) stops.push(`read back, the fragments lose ${lost.slice(0, 5).join(", ")}`);
    if (gained.length > 0) {
      stops.push(
        `read back, the fragments say what the file does not: ${gained.slice(0, 5).join(", ")}`,
      );
    }
  }
  // A file already in the folder under a fragment's name would be read as a screen from then on.
  const there = existsSync(path.join(root, folder))
    ? readdirSync(path.join(root, folder)).filter((name) => isFragment(name))
    : [];
  if (there.length > 0) {
    stops.push(
      `${folder} already holds ${there.slice(0, 5).join(", ")}, which would be read as ${there.length === 1 ? "a screen" : "screens"}: move ${there.length === 1 ? "it" : "them"} first`,
    );
  }
  return {
    file,
    folder,
    writes: [
      { file: `${folder}/${FRAGMENTS_SHARED}`, text: shared },
      ...fragments.map((fragment) => ({ file: `${folder}/${fragment.name}`, text: fragment.text })),
    ],
    screens: fragments.length,
    stops,
  };
}

function split(root, file, dry) {
  const folder = fragmentsFolder(file);
  const found = readFragments(root, file);
  if (found?.beside) {
    stderr.write(
      `${NAME}: ${file} is there beside ${folder}, which already holds the fragments. The folder is what is read: remove ${file}, or take the folder away and split again. Nothing was written.\n`,
    );
    return 1;
  }
  if (found) {
    // The fragments are there; the tool data is brought in line when it did not say so yet.
    if (!dry) record(root, file, true);
    stdout.write(
      `${NAME}: already one file per screen under ${folder} (${count(found.fragments.length)}); nothing to split\n`,
    );
    return 0;
  }
  if (read(root, file) === null) {
    stdout.write(`${NAME}: this repository has no ledger of screens (${file}); nothing to split\n`);
    return 0;
  }
  const plan = splitPlan(root, file);
  if (plan.stops.length > 0) {
    stderr.write(
      `${NAME}: ${file} cannot be cut into one file per screen: ${plan.stops.join("; ")}. Nothing was written.\n`,
    );
    return 1;
  }
  stdout.write(`${NAME}: ${file} becomes one file per screen under ${folder}\n`);
  for (const item of plan.writes) stdout.write(`  create ${item.file}\n`);
  stdout.write(`  remove ${file}\n`);
  stdout.write(
    `  ${count(plan.screens)}, each in a file named after its id; read back, no entry is lost\n`,
  );
  stdout.write("  the screens are read in the order of their ids from now on\n");
  if (dry) {
    stdout.write("  nothing was written (--dry-run)\n");
    return 0;
  }
  const before = read(root, file);
  const made = !existsSync(path.join(root, folder));
  // Everything this run wrote is taken away again when a step fails, so a repository is never
  // left with half a folder beside its one file.
  const written = [];
  const undo = () => {
    for (const name of written) {
      if (existsSync(path.join(root, name))) unlinkSync(path.join(root, name));
    }
    if (made && existsSync(path.join(root, folder))) rmdirSync(path.join(root, folder));
  };
  try {
    mkdirSync(path.join(root, folder), { recursive: true });
    for (const item of plan.writes) {
      written.push(item.file);
      writeFileSync(path.join(root, item.file), item.text);
    }
    // What the disk now gives is read once more before the one file goes.
    const now = ledgerText(root, file);
    const lost = [...lostEntries(before, now), ...lostEntries(now, before)];
    if (lost.length > 0) {
      undo();
      stderr.write(
        `${NAME}: read back from the disk, the fragments differ from ${file} at ${lost.slice(0, 5).join(", ")}. They were taken away again; nothing was changed.\n`,
      );
      return 1;
    }
    unlinkSync(path.join(root, file));
  } catch (error) {
    try {
      undo();
    } catch {
      // What could not be taken away is named by the gate: the one file beside the folder.
    }
    stderr.write(
      `${NAME}: the fragments could not be written (${String(error?.message ?? error)
        .split("\n")[0]
        .replaceAll(root, ".")}). What was written was taken away again; ${file} is as it was.\n`,
    );
    return 1;
  }
  const held = record(root, file, true);
  stdout.write(
    held
      ? `  the choice is written in ${THEME}: the gate holds each fragment to its name and its shape\n`
      : "  no gate here holds the ledger of screens, so nothing checks the fragments in this repository\n",
  );
  stdout.write(
    `  to finish: commit the folder and the removal of ${file} in one change. Whatever of the repository's own still reads ${file} must read the folder now; --print gives the ledger as one text\n`,
  );
  return 0;
}

function join(root, file, dry) {
  const folder = fragmentsFolder(file);
  const found = readFragments(root, file);
  if (!found) {
    const one = read(root, file);
    stdout.write(
      one === null
        ? `${NAME}: this repository has no ledger of screens (${file}); nothing to join\n`
        : `${NAME}: already one file, ${file}; nothing to join\n`,
    );
    if (one !== null && !dry) record(root, file, false);
    return 0;
  }
  if (found.beside) {
    stderr.write(
      `${NAME}: ${file} is there beside ${folder}, and joining would write over it. Remove it first; the folder is what is read. Nothing was written.\n`,
    );
    return 1;
  }
  const text = joinLedger(found.shared, found.fragments);
  const removes = [`${folder}/${FRAGMENTS_SHARED}`, ...found.fragments.map((item) => item.file)];
  stdout.write(`${NAME}: the fragments under ${folder} become one file again\n`);
  stdout.write(`  create ${file}\n`);
  for (const name of removes) stdout.write(`  remove ${name}\n`);
  stdout.write(`  ${count(found.fragments.length)}, in the order of their ids\n`);
  if (dry) {
    stdout.write("  nothing was written (--dry-run)\n");
    return 0;
  }
  // The fragments are kept in hand until the one file is written and they are all gone: when a
  // step fails they are put back, and the one file is taken away again.
  const kept = removes.map((name) => [name, readFileSync(path.join(root, name), "utf8")]);
  try {
    writeFileSync(path.join(root, file), text);
    for (const name of removes) unlinkSync(path.join(root, name));
  } catch (error) {
    try {
      for (const [name, was] of kept) writeFileSync(path.join(root, name), was);
      if (existsSync(path.join(root, file))) unlinkSync(path.join(root, file));
    } catch {
      // What could not be put back is named by the gate: the one file beside the folder.
    }
    stderr.write(
      `${NAME}: the one file could not be written (${String(error?.message ?? error)
        .split("\n")[0]
        .replaceAll(root, ".")}). The fragments were put back; nothing was changed.\n`,
    );
    return 1;
  }
  // The folder goes when nothing of the repository's own is left in it.
  if (readdirSync(path.join(root, folder)).length === 0) rmdirSync(path.join(root, folder));
  record(root, file, false);
  stdout.write(`  to finish: commit ${file} and the removal of the fragments in one change\n`);
  return 0;
}

function print(root, file) {
  const text = ledgerText(root, file);
  if (text === null) {
    stderr.write(`${NAME}: this repository has no ledger of screens (${file})\n`);
    return 0;
  }
  stdout.write(text);
  return 0;
}

const MODES = ["--split", "--join", "--print"];
const USAGE = "screen-fragments.mjs [--split | --join | --print] [--dry-run] [--target DIR]";

function main(args) {
  const at = args.indexOf("--target");
  const folder = at === -1 ? null : args[at + 1];
  if (at !== -1 && (folder === undefined || folder.startsWith("--"))) {
    stderr.write(`${NAME}: --target takes a folder. Usage: ${USAGE}\n`);
    return 1;
  }
  const unknown = args.filter(
    (arg, index) =>
      (at === -1 || index !== at + 1) && ![...MODES, "--dry-run", "--target"].includes(arg),
  );
  if (unknown.length > 0) {
    stderr.write(`${NAME}: ${unknown.join(", ")} is not understood. Usage: ${USAGE}\n`);
    return 1;
  }
  const root = folder === null ? cwd() : path.resolve(folder);
  const asked = MODES.filter((flag) => args.includes(flag));
  if (asked.length > 1) {
    stderr.write(`${NAME}: give one of --split, --join and --print, not ${asked.join(" and ")}\n`);
    return 1;
  }
  const dry = args.includes("--dry-run");
  if (dry && !["--split", "--join"].includes(asked[0])) {
    stderr.write(`${NAME}: --dry-run goes with --split or --join. Usage: ${USAGE}\n`);
    return 1;
  }
  const file = ledgerFile(root);
  if (asked[0] === "--split") return split(root, file, dry);
  if (asked[0] === "--join") return join(root, file, dry);
  if (asked[0] === "--print") return print(root, file);
  // Asked nothing: which shape the repository keeps.
  const found = readFragments(root, file);
  const one = read(root, file);
  if (found) {
    stdout.write(
      `${NAME}: one file per screen, ${found.folder} (${count(found.fragments.length)}); --join makes it one file again\n`,
    );
  } else if (one !== null) {
    stdout.write(
      `${NAME}: one file, ${file} (${count(readScreenLedger(one).screens.length)}); --split keeps it as one file per screen\n`,
    );
  } else stdout.write(`${NAME}: this repository has no ledger of screens (${file})\n`);
  return 0;
}

// Runs only when this file is the script. Real paths on both sides: a folder reached through a
// link would otherwise look like an import.
if (argv[1] && realpathSync(argv[1]) === realpathSync(fileURLToPath(import.meta.url))) {
  exit(main(argv.slice(2)));
}
