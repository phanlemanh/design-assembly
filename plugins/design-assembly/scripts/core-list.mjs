// The machine's list of cores (spec 0016, criterion 17): each core this machine built or pinned,
// with where it lives, and each repository whose person said it is of no family listed here, or
// that left its family (`how: "left"`), so that it is not asked at once whether it is of one. It is
// one file on this machine, outside every repository, and no command sends it anywhere. With it the
// machine recognises a family: on a repository that declares none, `new` and `adopt` ask one
// question, whether it is of the same family as a core of the list. A list that is missing or
// cannot be read means no question and no error.
//
// Where it lives: the file `DESIGN_ASSEMBLY_CORES` names, when that is set (the plugin's tests set
// it, so that none reads or writes the list of the person running them); else
// `$XDG_CONFIG_HOME/design-assembly/cores.json`; else `~/.config/design-assembly/cores.json`.
import { spawnSync } from "node:child_process";
import {
  existsSync,
  mkdirSync,
  readFileSync,
  realpathSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { homedir } from "node:os";
import path from "node:path";
import { env } from "node:process";

import {
  familyCoreProblems,
  newerCoreParts,
  PINNED_CORE,
} from "../templates/tools/design-assembly/contract.mjs";
import { renderJson } from "../templates/tools/design-assembly/json.mjs";

export const LIST_VERSION = 1;

// The main folder of a repository: the one git keeps its history beside, read through the folder
// git shares with every working folder of it, so a separate working folder (a worktree) gives the
// repository's main folder and not its own; the folder itself outside git.
export function homeOf(root) {
  const run = spawnSync(
    "git",
    ["-C", root, "rev-parse", "--path-format=absolute", "--git-common-dir"],
    { encoding: "utf8" },
  );
  const common = run.status === 0 ? run.stdout.trim() : "";
  if (common && path.basename(common) === ".git") return realpathSync(path.dirname(common));
  return realpathSync(root);
}
const WIDTH = 100;

// The file of the list on this machine.
export function listFile() {
  if (env.DESIGN_ASSEMBLY_CORES) return path.resolve(env.DESIGN_ASSEMBLY_CORES);
  const config = env.XDG_CONFIG_HOME ? env.XDG_CONFIG_HOME : path.join(homedir(), ".config");
  return path.join(config, "design-assembly", "cores.json");
}

const isMap = (value) => value !== null && typeof value === "object" && !Array.isArray(value);

// The list as data: { file, cores, declined, pushed, problem }. `problem` says why it cannot be
// read, and the list then holds nothing; a list that is not there holds nothing and has no problem.
// `pushed` has each push of a core this machine recorded (core-publish.mjs).
export function readList(file = listFile()) {
  const empty = { file, cores: [], declined: [], pushed: [], problem: null, missing: false };
  if (!existsSync(file)) return { ...empty, missing: true };
  let data;
  try {
    data = JSON.parse(readFileSync(file, "utf8"));
  } catch {
    return { ...empty, problem: `${file} is not valid JSON` };
  }
  if (!isMap(data) || !Array.isArray(data.cores) || !Array.isArray(data.declined ?? [])) {
    return { ...empty, problem: `${file} does not hold a list of cores` };
  }
  if (typeof data.version === "number" && data.version > LIST_VERSION) {
    return {
      ...empty,
      problem: `${file} has shape ${data.version} and this plugin knows shape ${LIST_VERSION}`,
    };
  }
  const cores = data.cores.filter(
    (entry) => isMap(entry) && typeof entry.path === "string" && typeof entry.family === "string",
  );
  const declined = (data.declined ?? []).filter(
    (entry) => isMap(entry) && typeof entry.repository === "string",
  );
  const pushed = (Array.isArray(data.pushed) ? data.pushed : []).filter(
    (entry) => isMap(entry) && typeof entry.path === "string" && typeof entry.to === "string",
  );
  return { ...empty, cores, declined, pushed };
}

// Why a core of the list cannot be read now, or null: its folder gone, its shape wrong or newer.
export function coreProblem(folder) {
  if (!existsSync(folder) || !statSync(folder).isDirectory()) return `${folder} is not there`;
  const newer = newerCoreParts(folder);
  if (newer.length > 0) return newer[0];
  const wrong = familyCoreProblems(folder);
  return wrong.length > 0 ? wrong[0] : null;
}

// The list with one more line, as the text written: a core built or pinned (`how`), each folder
// once, a repository that is of none of them, or a push of a core (`to`), the last to each place. Throws when the list on disk cannot be read: a
// list nobody can read is never written over.
function withLine(list, line) {
  if (list.problem) throw new Error(list.problem);
  const data = {
    version: LIST_VERSION,
    cores: list.cores,
    declined: list.declined,
    // The pushes recorded stay: a line of another kind never takes them away.
    ...(list.pushed.length > 0 || line.to ? { pushed: list.pushed } : {}),
  };
  if (line.to) {
    // A push of a core: the last one to each place it was pushed to.
    data.pushed = [
      ...data.pushed.filter((entry) => !(entry.path === line.path && entry.to === line.to)),
      line,
    ];
  } else if (line.path) {
    data.cores = [...data.cores.filter((entry) => entry.path !== line.path), line];
  } else {
    data.declined = [
      ...data.declined.filter((entry) => entry.repository !== line.repository),
      line,
    ];
  }
  return renderJson(data, WIDTH);
}

// Writes one line into the list: what was written, or why not. Never throws: the list is the
// machine's help, and a command that built or pinned a core has done its work without it.
export function addLine(line, { dryRun = false } = {}) {
  const list = readList();
  let text;
  try {
    text = withLine(list, line);
  } catch (error) {
    return { file: list.file, written: false, why: `${error.message}: the list was left as it is` };
  }
  if (!dryRun) {
    try {
      mkdirSync(path.dirname(list.file), { recursive: true });
      writeFileSync(list.file, text);
    } catch (error) {
      return { file: list.file, written: false, why: error.message.split("\n")[0] };
    }
  }
  return { file: list.file, written: !dryRun, why: null };
}

// The one question a repository is asked about a family, or null with why none is asked: the
// repository declares a family already, its person said it is of none, the list is missing or
// cannot be read, or holds no core that can be read now. The repository is named by its main
// folder, so a separate working folder of it is the same repository.
export function familyQuestion(root) {
  if (existsSync(path.join(root, PINNED_CORE.file))) {
    return { question: null, why: "the repository declares its family already" };
  }
  const list = readList();
  if (list.missing) return { question: null, why: "this machine keeps no list of cores" };
  if (list.problem)
    return { question: null, why: `the list of cores cannot be read (${list.problem})` };
  const home = homeOf(root);
  const said = list.declined.find((entry) => entry.repository === home);
  if (said) {
    return {
      question: null,
      why:
        said.how === "left"
          ? `this repository left its family on ${said.on ?? "a day not recorded"}: it joins one again with core --join`
          : `a person said on ${said.on ?? "a day not recorded"} that this repository is of no family listed here`,
    };
  }
  const readable = list.cores.filter((entry) => coreProblem(entry.path) === null);
  if (readable.length === 0) {
    return { question: null, why: "no core of the list can be read now" };
  }
  const names = readable.map((entry) => `${entry.family} (${entry.path})`);
  const first = readable[0];
  return {
    why: null,
    cores: readable.map(({ family, path: folder }) => ({ family, path: folder })),
    question: {
      id: "family",
      question: `Is this repository of the same family as ${names.join(", or as ")}?`,
      recommendation: `Say which, or that it is of none. Yes: core --join --core ${first.path} --by <your name>. No: core --decline`,
      basis:
        "This machine built or pinned a core before, so the next repository may be of its family; a repository of a family is not asked again what the core answered. A no is kept on this machine, never in the repository, and this repository is not asked again.",
      where: list.file,
      if_refused: "The repository stands alone, as before: nothing of it changes.",
      hard_to_undo: false,
    },
  };
}
