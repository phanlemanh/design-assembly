// conform: an item of an outside source, taken down for a need, is conformed to the repository
// before it is taken in (spec 0015). The conform record of the need holds every file as taken down
// and after patching, each patch with its reason and its diff, and each rule the item is let off.
// The command starts the record from the files on disk; records a change made to a file as a
// patch, the diff from the file as last committed to the file as it is; records an exemption;
// applies the patches again, in order, on a newer item as taken down, and stops, naming the patch,
// where one no longer fits; and with no other flag says whether the record holds: each file as the
// record holds it after patching, the patches leading back to the files as taken down, and every
// rule turned off in a file of the item or for its folder exempted. A hand edit of the item is never
// taken for a patch: only the command records one. It reads the repository, its git for the last
// committed file and the local git to make and apply a diff; it fetches nothing, uses no network,
// and runs no install line.
// Usage: node conform.mjs --need KEY [--source ID --item NAME --file PATH...] [--taken-down]
//        [--patch PATH --reason SENTENCE] [--exempt RULE --file PATH --reason SENTENCE]
//        [--dry-run] [--target DIR] [--json]
// Exit: 0 the record holds, or what was asked is written; 1 something waits: a file changed with no
// patch, a patch that cannot be applied again, a rule turned off with no exemption; 2 a wrong call,
// a record or a file that cannot be read, a patch that no longer fits, a file not on disk. On 2
// nothing is written.
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { stdout } from "node:process";

import {
  FOLDER_RULES,
  LEDGERS,
  shapeProblems,
} from "../templates/tools/design-assembly/contract.mjs";
import { lineWidth, renderJson } from "../templates/tools/design-assembly/json.mjs";
import { SOURCES_FOLDER } from "../templates/tools/design-assembly/sources-ledger.mjs";
import { writeFiles, writtenFiles } from "./apply.mjs";
import { finish, readCall, Refusal, refuse, start } from "./command.mjs";
import { unexempted } from "./conform-rules.mjs";
import { insideRoot } from "./store.mjs";

const NEED = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const NOTHING = ". Nothing was written";
const sha = (content) => createHash("sha256").update(content).digest("hex");
const recordFile = (need) => `${LEDGERS.conform.folder}/${need}.json`;
const byFile = (a, b) => (a.file < b.file ? -1 : a.file > b.file ? 1 : 0);

// ---- the local git, to make and apply a diff --------------------------------------------------------

function git(cwd, args) {
  return spawnSync("git", ["-c", "core.autocrlf=false", ...args], { cwd, encoding: "utf8" });
}

// A folder of its own for one diff, taken away once it is used.
function scratch(work) {
  const dir = mkdtempSync(path.join(tmpdir(), "design-conform-"));
  try {
    return work(dir);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}
const putIn = (dir, file, content) => {
  mkdirSync(path.dirname(path.join(dir, file)), { recursive: true });
  writeFileSync(path.join(dir, file), content);
};

// The unified diff that turns `before` into `after` for `file`, with the file's own path in it.
export function diffOf(file, before, after) {
  return scratch((dir) => {
    git(dir, ["init", "-q"]);
    putIn(dir, file, before);
    git(dir, ["add", "--", file]);
    putIn(dir, file, after);
    return git(dir, ["diff", "--no-color", "-U3", "--", file]).stdout;
  });
}

// The file `diff` turns `content` into, or null when the diff no longer fits it. `reverse` undoes it.
export function applied(file, content, diff, { reverse = false } = {}) {
  return scratch((dir) => {
    putIn(dir, file, content);
    writeFileSync(path.join(dir, ".change.diff"), diff);
    const run = git(dir, [
      "apply",
      ...(reverse ? ["-R"] : []),
      "--whitespace=nowarn",
      ".change.diff",
    ]);
    return run.status === 0 ? readFileSync(path.join(dir, file), "utf8") : null;
  });
}

// ---- the repository -----------------------------------------------------------------------------------

const readText = (root, file) => {
  const full = path.join(root, file);
  return insideRoot(root, file) && existsSync(full) ? readFileSync(full, "utf8") : null;
};

// The record of the need, read and checked: whole, or a refusal.
function readRecord(root, need) {
  const file = recordFile(need);
  const text = readText(root, file);
  if (text === null) {
    throw new Refusal(
      `there is no conform record ${file}: start it with --source, --item and --file once the item is taken down`,
    );
  }
  const problems = shapeProblems("conform", text, file);
  if (problems.length > 0) throw new Refusal(problems.slice(0, 3).join("; "));
  return JSON.parse(text);
}

// The index of a patch as a person reads it, from 1, among all the patches of the record.
const patchName = (record, patch) =>
  `patch ${record.patches.indexOf(patch) + 1} of ${patch.file} ("${patch.reason}")`;
const patchesOf = (record, file) => record.patches.filter((patch) => patch.file === file);
const hashOf = (list, file) => list.find((entry) => entry.file === file)?.sha256;

// ---- what each call does ------------------------------------------------------------------------------

// Starts the record from the files of the item as taken down: their hashes, no patch, no exemption.
function started(root, need, { source, item, files }) {
  const file = recordFile(need);
  if (existsSync(path.join(root, file))) {
    throw new Refusal(
      `${file} is there already: after taking the item down again, run with --taken-down${NOTHING}`,
    );
  }
  if (!item) throw new Refusal(`--source needs --item, the item's name in the source${NOTHING}`);
  if (!existsSync(path.join(root, SOURCES_FOLDER, `${source}.json`))) {
    throw new Refusal(
      `${source} is no pinned source: ${SOURCES_FOLDER}/${source}.json is not there${NOTHING}`,
    );
  }
  if (files.length === 0) throw new Refusal(`name each file of the item with --file${NOTHING}`);
  const entries = files
    .map((each) => {
      const content = readText(root, each);
      if (content === null) throw new Refusal(`${each} is not a file of this repository${NOTHING}`);
      return { file: each, sha256: sha(content) };
    })
    .sort(byFile);
  return {
    record: {
      version: 1,
      need,
      source,
      item,
      taken: entries,
      conformed: entries.map((entry) => ({ ...entry })),
      patches: [],
      exemptions: [],
    },
    said: `started ${file}: ${entries.length} files of ${item} from ${source}, as taken down`,
  };
}

// Records the change made to a file of the item since it was last committed as the record holds it.
function patchedRecord(root, record, { file, reason }) {
  if (!reason) throw new Refusal(`--patch needs --reason, why the change is made${NOTHING}`);
  if (!hashOf(record.conformed, file)) {
    throw new Refusal(
      `${file} is no file of the conform record ${recordFile(record.need)}${NOTHING}`,
    );
  }
  const committed = git(root, ["show", `HEAD:${file}`]);
  if (committed.status !== 0) {
    throw new Refusal(
      `${file} is not committed: commit it as the record holds it after patching, then make the change and record it${NOTHING}`,
    );
  }
  const before = committed.stdout;
  if (sha(before) !== hashOf(record.conformed, file)) {
    throw new Refusal(
      `the committed ${file} is not the file the record holds after patching: commit the file as the record holds it, then make the change and record it${NOTHING}`,
    );
  }
  const after = readText(root, file);
  if (after === null) throw new Refusal(`${file} is not on disk${NOTHING}`);
  if (after === before)
    throw new Refusal(`${file} has not changed since it was committed${NOTHING}`);
  const patch = { file, reason, diff: diffOf(file, before, after) };
  return {
    record: {
      ...record,
      patches: [...record.patches, patch],
      conformed: record.conformed.map((entry) =>
        entry.file === file ? { file, sha256: sha(after) } : entry,
      ),
    },
    said: `recorded patch ${record.patches.length + 1} of ${file}: ${reason}`,
  };
}

// Records a rule the item is let off, in one of its files, or for its folder in a configuration.
function exemptedRecord(root, record, { rule, file, reason }) {
  if (!file || !reason) {
    throw new Refusal(`--exempt needs --file and --reason${NOTHING}`);
  }
  const ofItem = Boolean(hashOf(record.conformed, file));
  if (!ofItem && !FOLDER_RULES.includes(rule)) {
    throw new Refusal(
      `${file} is no file of the item, and ${rule} is none of ${FOLDER_RULES.join(", ")}, the rules a whole folder is let off${NOTHING}`,
    );
  }
  if (!ofItem && readText(root, file) === null) {
    throw new Refusal(`${file} is not a file of this repository${NOTHING}`);
  }
  if (record.exemptions.some((entry) => entry.rule === rule && entry.file === file)) {
    throw new Refusal(`the record already lets ${file} off ${rule}${NOTHING}`);
  }
  return {
    record: { ...record, exemptions: [...record.exemptions, { rule, file, reason }] },
    said: `recorded the exemption ${rule} for ${file}: ${reason}`,
  };
}

// Applies the patches again on the files as taken down: each file on disk that is not the record's
// file after patching is a newer file as taken down; its patches are applied in order.
function retakenRecord(root, record) {
  const files = {};
  const taken = [];
  const conformed = [];
  let changed = false;
  for (const entry of record.conformed) {
    const content = readText(root, entry.file);
    if (content === null) {
      throw new Refusal(
        `${entry.file} is not on disk: take the item down again, then run this again${NOTHING}`,
      );
    }
    if (sha(content) === entry.sha256) {
      taken.push({ file: entry.file, sha256: hashOf(record.taken, entry.file) });
      conformed.push(entry);
      continue;
    }
    changed = true;
    let result = content;
    for (const patch of patchesOf(record, entry.file)) {
      if (typeof patch.diff !== "string") {
        throw new Refusal(
          `${patchName(record, patch)} records a reason and no diff: it cannot be applied again until it is recorded with --patch${NOTHING}`,
        );
      }
      const next = applied(entry.file, result, patch.diff);
      if (next === null) {
        throw new Refusal(
          `${patchName(record, patch)} no longer fits the file as taken down: make the change again on the newer file, record it with --patch, and drop the old patch${NOTHING}`,
        );
      }
      result = next;
    }
    if (result !== content) files[entry.file] = result;
    taken.push({ file: entry.file, sha256: sha(content) });
    conformed.push({ file: entry.file, sha256: sha(result) });
  }
  if (!changed) return { record, files, said: "the item is already conformed: nothing to apply" };
  return {
    record: { ...record, taken, conformed },
    files,
    said: `applied the patches again on the item as taken down: ${Object.keys(files).length} files written`,
  };
}

// What keeps the record from holding: a file changed with no patch, a patch with no diff, patches
// that do not lead back to the files as taken down, a rule turned off with no exemption.
export function recordProblems(root, record) {
  const problems = [];
  record.patches.forEach((patch) => {
    if (typeof patch.diff !== "string") {
      problems.push(
        `${patchName(record, patch)} records a reason and no diff, as a record written by hand before the conform command: it cannot be applied again until it is recorded with --patch`,
      );
    }
  });
  for (const entry of record.conformed) {
    const content = readText(root, entry.file);
    if (content === null) {
      problems.push(`${entry.file} is not on disk`);
      continue;
    }
    if (sha(content) !== entry.sha256) {
      problems.push(
        `${entry.file} is not the file the record holds after patching, and no patch records the change`,
      );
      continue;
    }
    const own = patchesOf(record, entry.file);
    if (own.some((patch) => typeof patch.diff !== "string")) continue;
    let back = content;
    for (const patch of [...own].reverse()) {
      back = back === null ? null : applied(entry.file, back, patch.diff, { reverse: true });
    }
    if (back === null || sha(back) !== hashOf(record.taken, entry.file)) {
      problems.push(
        `the patches of ${entry.file} do not lead back from the file after patching to the file as taken down`,
      );
    }
  }
  problems.push(...unexempted(root, record, (file) => readText(root, file)));
  return problems;
}

// ---- the command --------------------------------------------------------------------------------------

const USAGE =
  "usage: node conform.mjs --need KEY [--source ID --item NAME --file PATH...] [--taken-down]\n" +
  "                        [--patch PATH --reason SENTENCE] [--exempt RULE --file PATH --reason SENTENCE]\n" +
  "                        [--dry-run] [--target DIR] [--json]\n";
const FLAGS = {
  "--need": "value",
  "--source": "value",
  "--item": "value",
  "--file": "list",
  "--taken-down": "switch",
  "--patch": "value",
  "--reason": "value",
  "--exempt": "value",
  "--dry-run": "switch",
};

// The one thing a call asks, or why it asks none or two.
function askedOf(flags) {
  const asked = [
    flags["--source"] ? "start" : null,
    flags["--taken-down"] ? "taken-down" : null,
    flags["--patch"] ? "patch" : null,
    flags["--exempt"] ? "exempt" : null,
  ].filter(Boolean);
  if (asked.length > 1) return { problem: `ask one thing at a time, not ${asked.join(" and ")}` };
  return { asked: asked[0] ?? "check" };
}

export function conform(root, flags, { dryRun = false } = {}) {
  const need = flags["--need"];
  const { asked, problem } = askedOf(flags);
  if (problem) throw new Refusal(problem);
  let made;
  if (asked === "start") {
    made = started(root, need, {
      source: flags["--source"],
      item: flags["--item"],
      files: flags["--file"] ?? [],
    });
  } else {
    const record = readRecord(root, need);
    if (asked === "patch") {
      made = patchedRecord(root, record, { file: flags["--patch"], reason: flags["--reason"] });
    } else if (asked === "exempt") {
      const [file] = flags["--file"] ?? [];
      made = exemptedRecord(root, record, {
        rule: flags["--exempt"],
        file,
        reason: flags["--reason"],
      });
    } else if (asked === "taken-down") {
      made = retakenRecord(root, record);
    } else {
      const problems = recordProblems(root, record);
      return {
        need,
        asked,
        conformed: record.conformed,
        problems,
        files: [],
        said:
          problems.length === 0 ? `${recordFile(need)} holds` : `${recordFile(need)} does not hold`,
      };
    }
  }
  const writes = {
    ...(made.files ?? {}),
    [recordFile(need)]: renderJson(made.record, lineWidth(root)),
  };
  const files = writtenFiles(writeFiles(root, writes, dryRun));
  return { need, asked, conformed: made.record.conformed, problems: [], files, said: made.said };
}

function report(result) {
  const lines = [`conform ${result.need}: ${result.said}`];
  for (const line of result.problems) lines.push(`  ${line}`);
  for (const file of result.files) lines.push(`  ${file.change.padEnd(9)} ${file.path}`);
  return `${lines.join("\n")}\n`;
}

async function main(args) {
  const call = readCall(args, FLAGS);
  if (call.problem) return refuse(call.problem, USAGE);
  if (call.help) return void stdout.write(USAGE);
  const need = call.flags["--need"];
  if (!need || !NEED.test(need)) {
    return refuse("--need takes the need's key, in small letters and dashes", USAGE);
  }
  const result = conform(call.target, call.flags, { dryRun: call.flags["--dry-run"] === true });
  return finish({
    json: call.json,
    result: { ...result, dry_run: call.flags["--dry-run"] === true },
    text: report(result),
    work: result.problems.length > 0,
  });
}

await start(import.meta.url, main);
