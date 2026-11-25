// The common contract of every command (specification 0004), written once: how a command is
// called, what it prints, and how it ends. A new command reads its call with `readCall`, ends
// with `finish` or `refuse`, and is started with `start`.
//
//   --target DIR  the repository to work on; the folder the command is run from when not given
//   --json        one JSON document on the output, and nothing else there
//   exit 0        done, and nothing is left
//   exit 1        done, and there is work for a person or something to fix
//   exit 2        a wrong call, or a repository that cannot be read; no answer is printed
import { existsSync, realpathSync, statSync } from "node:fs";
import path from "node:path";
import process, { argv, cwd, stderr, stdout } from "node:process";
import { fileURLToPath } from "node:url";

export const EXIT = { done: 0, work: 1, wrong: 2 };

// The flags every command takes. `switch` takes no value, `value` takes one, `list` may be given
// more than once, and `names` is a list of names, one name a value. The names a session lists hold
// letters, digits, colons, hyphens and underscores; a value with white space, a comma or a
// semicolon in it is several names joined, an empty one is none, and either is a wrong call.
const COMMON = { "--target": "value", "--json": "switch", "--help": "switch", "-h": "switch" };

// What a list of names is joined by when it reaches a command as one value.
const JOINS = /[\s,;]/;
// How many names of a refused value the message shows: enough to know it, not every name a
// session lists.
const NAMED_WORDS = 3;

// Why a value of a `names` flag is not one name, or null when it is.
function namesProblem(flag, value) {
  const how = `Give each name a flag of its own: ${flag} <name> ${flag} <name>`;
  if (value.trim() === "") return `${flag} was given an empty value; a name is never empty. ${how}`;
  if (!JOINS.test(value)) return null;
  const names = [...value.matchAll(/[^\s,;]+/g)];
  const cut = names.length > NAMED_WORDS ? names[NAMED_WORDS - 1] : names.at(-1);
  const end = cut ? cut.index + cut[0].length : value.length;
  const shown = `${value.slice(0, end).replace(/\s+/g, " ").trim()}${names.length > NAMED_WORDS ? " …" : ""}`;
  return `${flag} was given "${shown}", which joins names by white space, a comma or a semicolon; a name holds none of them. ${how}`;
}

// Reads a call against the flags a command declares, beside the common ones. Gives the target,
// whether the answer is for a machine, whether help was asked, and the command's own flags; or
// `problem`, one line, when the call is wrong: a flag the command does not have, a flag with no
// value, a value of a `names` flag that is not one name, or a target that is not a folder. A command that takes words, as what to search for, says
// so with `words`: every argument that is neither a flag nor a flag's value is then one of them, in
// order; anything that starts with a dash is still read as a flag.
export function readCall(args, flags = {}, { words: takesWords = false } = {}) {
  const known = { ...COMMON, ...flags };
  const found = {};
  const words = [];
  for (let index = 0; index < args.length; index += 1) {
    const flag = args[index];
    const kind = Object.hasOwn(known, flag) ? known[flag] : undefined;
    if (!kind && takesWords && !flag.startsWith("-")) {
      words.push(flag);
      continue;
    }
    if (!kind) return { problem: `${flag} is not a flag of this command` };
    if (kind === "switch") {
      found[flag] = true;
      continue;
    }
    const value = args[index + 1];
    if (value === undefined || value.startsWith("--")) return { problem: `${flag} needs a value` };
    index += 1;
    if (kind === "names") {
      const problem = namesProblem(flag, value);
      if (problem) return { problem };
    }
    if (kind === "list" || kind === "names") (found[flag] ??= []).push(value);
    else found[flag] = value;
  }
  const target = path.resolve(found["--target"] ?? cwd());
  if (!existsSync(target) || !statSync(target).isDirectory()) {
    return { problem: `${target} is not a folder` };
  }
  const own = Object.fromEntries(Object.entries(found).filter(([flag]) => !(flag in COMMON)));
  return {
    target,
    json: found["--json"] === true,
    help: found["--help"] === true || found["-h"] === true,
    flags: own,
    ...(takesWords ? { words } : {}),
  };
}

// Ends a call that did its work. For a machine the result is the one document on the output; for
// a person it is the text. `work` says something is left for a person, or to fix.
export function finish({ json, result, text, work }) {
  stdout.write(json ? `${JSON.stringify(result, null, 2)}\n` : text);
  process.exitCode = work ? EXIT.work : EXIT.done;
}

// Ends a call that is wrong, or one on a repository that cannot be read: the reason goes to the
// error stream, with how the command is called when the call itself was wrong, and nothing is
// printed as an answer.
export function refuse(message, usage = "") {
  stderr.write(`design-assembly: ${message}\n${usage}`);
  process.exitCode = EXIT.wrong;
}

// Thrown by a command to stop with a refusal from anywhere inside it.
export class Refusal extends Error {}

// One file a command writes or would write, as a machine reads it. `path` is relative to the
// target, the way the repository names it.
export const fileChange = (file, change) => ({ path: file.split(path.sep).join("/"), change });

// A file a command writes to a folder the caller names, which may lie outside the target: named as
// the repository names it when it is inside, and by its full path when it is not.
export function nameIn(target, file) {
  const relative = path.relative(target, file);
  return relative.startsWith("..") || path.isAbsolute(relative) ? file : relative;
}

// Such a file as a machine reads it. `change` says whether the file was there before, so ask
// before writing it.
export const changeOf = (target, file) =>
  fileChange(nameIn(target, file), existsSync(file) ? "update" : "create");

// Runs a command when its file is the one that was started, and not when it is imported. Anything
// it throws is a repository that cannot be read: the call ends with 2, never with a stack trace
// that a caller would take for "done, with work left".
export async function start(url, main) {
  if (!argv[1] || realpathSync(argv[1]) !== realpathSync(fileURLToPath(url))) return;
  try {
    await main(argv.slice(2));
  } catch (error) {
    refuse(
      error instanceof Refusal
        ? error.message
        : `this repository cannot be read: ${error.message.split("\n")[0]}`,
    );
  }
}
