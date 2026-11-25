// The gate of a repository that keeps no Makefile (decision 0023, point 6): one check command,
// declared where the repository keeps its own, a script of its package file, and declared to the
// acceptance kit when the repository uses one. The tool is laid as anywhere else; the make step is
// not, and no Makefile is ever written. A repository with a Makefile is wired as it always was.
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

import {
  CHECK_COMMAND,
  MK_FOLDER,
  PACKAGE_FILE,
  readPackage,
  withCheckScript,
} from "../templates/tools/design-assembly/host-make.mjs";

// Where the acceptance kit keeps what it is told of a repository, and the key under which its
// executors list a command it runs.
export const KIT_CONFIG = "_acceptance/config.yaml";
const KIT_KEY = "design_assembly";

// The check-in-gate row and its check, for where the gate is.
export function gateCandidate(host) {
  if (host.kind === "script") {
    return {
      what: `the package script ${host.name} runs this tool, in a way that can fail`,
      row: { kind: "standard", source: `the package script ${host.name}` },
      checks: [{ kind: "gate", script: host.name }],
    };
  }
  return {
    what: "make check runs this tool, in a way that can fail",
    row: { kind: "standard", source: "make check" },
    checks: [{ kind: "gate" }],
  };
}

// The package file as the gate's check reads it in a trial: with the script, as it will be written.
export function trialPackage(root, host) {
  const pkg = readPackage(root);
  return host.kind === "script" && !host.have ? withCheckScript(pkg, host.name) : pkg;
}

// The files the tool brings, for where the gate is: with a script, the make step is left out and
// the package file gains the script, unless it already runs the check.
export function gateFiles(root, host, files) {
  if (host.kind !== "script") return files;
  const kept = Object.fromEntries(
    Object.entries(files).filter(([file]) => !file.startsWith(`${MK_FOLDER}/`)),
  );
  return host.have
    ? kept
    : { ...kept, [PACKAGE_FILE]: withCheckScript(readPackage(root), host.name) };
}

// The package manager the repository names in a package file, at its folder or above it up to
// the top of its git checkout: the word before `@` of `packageManager`. Null when none names one.
function managerOf(root) {
  let dir = root;
  for (;;) {
    try {
      const data = JSON.parse(readFileSync(path.join(dir, PACKAGE_FILE), "utf8"));
      const named = /^([\w-]+)@/.exec(String(data.packageManager ?? ""))?.[1];
      if (named) return named;
    } catch {
      // A folder with no package file, or one that cannot be read, names none.
    }
    if (existsSync(path.join(dir, ".git"))) return null;
    const up = path.dirname(dir);
    if (up === dir) return null;
    dir = up;
  }
}

// The acceptance kit's file the repository keeps, at its folder or above it up to the top of its
// git checkout, or null.
function kitOf(root) {
  let dir = root;
  for (;;) {
    if (existsSync(path.join(dir, KIT_CONFIG))) return dir;
    if (existsSync(path.join(dir, ".git"))) return null;
    const up = path.dirname(dir);
    if (up === dir) return null;
    dir = up;
  }
}

// The kit's file with the gate's command added under its executors' scripts, or null when the file
// has no executors to add it to. The kit reads its file line by line, with two spaces a level.
function withKitLine(text, command) {
  const line = `    ${KIT_KEY}: "${command}"`;
  const lines = text.split("\n");
  const executors = lines.findIndex((item) => item === "executors:");
  if (executors === -1) return null;
  let end = lines.findIndex((item, at) => at > executors && /^\S/.test(item));
  if (end === -1) end = lines.length;
  const script = lines.findIndex((item, at) => at > executors && at < end && item === "  script:");
  if (script !== -1) lines.splice(script + 1, 0, line);
  else lines.splice(executors + 1, 0, "  script:", line);
  return lines.join("\n");
}

// What the person is told of the gate, and the kit's file when the gate is written to it: the
// command they run, and the line the kit needs. The kit's file is written only where it lies in the
// folder being adopted; one above it is said, and never written.
export function gateSaid(root, host) {
  if (host.kind !== "script") return { lines: [], files: {} };
  const manager = managerOf(root);
  const run = manager ? `${manager} run ${host.name}` : `node tools/design-assembly/check.mjs`;
  const lines = [
    `gate: the package script ${host.name} of ${PACKAGE_FILE} runs this plugin's check (${CHECK_COMMAND}); the repository keeps no Makefile, so none is written. Run it with: ${run}`,
  ];
  if (host.taken?.length > 0) {
    lines.push(
      `  ${host.taken.join(", ")} is already a script of ${PACKAGE_FILE} that runs something else, so it is left as it is and the gate is ${host.name}`,
    );
  }
  const kit = kitOf(root);
  if (kit === null) return { lines, files: {} };
  const text = readFileSync(path.join(kit, KIT_CONFIG), "utf8");
  if (text.includes(CHECK_COMMAND)) {
    lines.push(`  the acceptance kit's ${KIT_CONFIG} already runs it`);
    return { lines, files: {} };
  }
  const away = path.relative(kit, root).split(path.sep).join("/");
  const command = away === "" ? CHECK_COMMAND : `cd ${away} && ${CHECK_COMMAND}`;
  const added = away === "" ? withKitLine(text, command) : null;
  if (added !== null) {
    lines.push(`  declared to the acceptance kit: ${KIT_CONFIG}, executors.script.${KIT_KEY}`);
    return { lines, files: { [KIT_CONFIG]: added } };
  }
  const where = away === "" ? KIT_CONFIG : path.join(path.relative(root, kit), KIT_CONFIG);
  lines.push(
    `  declare it to the acceptance kit, which this command does not write outside the folder it adopts: under executors.script of ${where}, add ${KIT_KEY}: "${command}"`,
  );
  return { lines, files: {} };
}
