// How the member's report is called and what it prints (spec 0016, criterion 12, slice 2 of item
// 7.2). The core command reads its flags and hands the move here.
//   --report   a repository of a family tells the core which needs it answered and which blocks of
//              the core it uses: 0 once written (or it would be, or the core says so already); 2
//              on a wrong call, a repository of no family, or a core that cannot be reached or
//              read; then nothing is written anywhere, and the repository goes on as it is.
// The move prints the file whole before it writes it, writes only in the core folder, and never in
// the repository. It calls no model and no network, and commits nothing.
import { existsSync, realpathSync, statSync } from "node:fs";
import path from "node:path";

import { CORE, readPinnedCore } from "../templates/tools/design-assembly/contract.mjs";
import { fileChange, finish, refuse, Refusal } from "./command.mjs";
import { homeOf } from "./core-list.mjs";
import { coreOf } from "./core-moved.mjs";
import { readStore } from "./core-promote.mjs";
import { ofFamily, planReport, plans, REPORT_HOLDS, writePlan } from "./core-report.mjs";

export const REPORT_MOVE = "--report";
export const REPORT_FLAGS = { [REPORT_MOVE]: "switch" };
export const REPORT_USAGE =
  "       node core.mjs --report [--core DIR] [--dry-run] [--target DIR] [--json]\n";
const TAKES = [REPORT_MOVE, "--core", "--dry-run"];
const INDEX = CORE.parts.blocks.file;
const NOTHING = ". Nothing was written";
export const MEMBERS_KNOW =
  "the other members know these needs once they pin the core again (core --join): find and intake there then say when one of them is needed";

// The core a repository reports to, where this machine can reach it: its family's, found as every
// move of a member finds it; or, for the first repository of a family, which declares nothing
// until its owner says so (spec 0016, answer 11), the one the call names.
function reach(root, core) {
  const repository = path.basename(homeOf(root));
  const pinned = readPinnedCore(root);
  let folder;
  if (pinned === null) {
    if (core === null) {
      throw new Refusal(
        `this repository declares no family: there is no core to report to. core --join declares one; the first repository of a family, which joins only when its owner says so, names the core with --core DIR${NOTHING}`,
      );
    }
    if (!existsSync(core) || !statSync(core).isDirectory()) {
      throw new Refusal(`${core} is not a folder${NOTHING}`);
    }
    folder = realpathSync(core);
  } else {
    if (pinned.unreadable) {
      throw new Refusal(
        `the copy of the family core here cannot be read (${pinned.unreadable}): pin it again with core --join${NOTHING}`,
      );
    }
    const place = coreOf(pinned, { core, repository: () => repository });
    if (place.path === null) {
      throw new Refusal(
        `the core's folder cannot be reached (${place.why}): nothing was reported and nothing was written, and the repository goes on as it is. Run this where the core's folder is, or name it with --core DIR`,
      );
    }
    folder = place.path;
  }
  const { declaration } = readStore(folder);
  if (!ofFamily(declaration, repository)) {
    throw new Refusal(
      `${repository} is neither the first repository of the family ${declaration.family} nor one of its members: only a repository of the family reports to its core${pinned === null ? "" : "; pin the core again with core --join, which writes its line there"}${NOTHING}`,
    );
  }
  return { folder, family: declaration.family, repository };
}

// Writes the report of a repository into its family's core, or says what it would write.
export function reportToCore(root, { core = null, dryRun }) {
  const { folder, family, repository } = reach(root, core);
  const plan = planReport(root, folder);
  if (plan.problems.length > 0) {
    throw new Refusal(
      `the report would not hold the core's shape: ${plan.problems.join("; ")}${NOTHING}`,
    );
  }
  if (!dryRun && plans(plan)) writePlan(folder, plan);
  return {
    core: folder,
    family,
    repository,
    report: plan.text === null ? null : plan.data,
    file: plan.file,
    change: plan.change,
    text: plan.text,
    used: plan.index?.used ?? [],
    left_out: plan.left_out,
    unread: plan.why,
    kept: plan.kept,
    files: [
      ...(plan.index ? [fileChange(path.join(folder, INDEX), "update")] : []),
      ...(plan.text !== null && plan.change !== "unchanged"
        ? [fileChange(path.join(folder, plan.file), plan.change)]
        : []),
    ],
    dry_run: dryRun,
  };
}

// The file of a report as a person reads it before it is written: whole.
export const wholeLines = (text, indent = "    ") => [
  `  the file, whole (${REPORT_HOLDS}):`,
  ...text
    .trimEnd()
    .split("\n")
    .map((line) => `${indent}${line}`),
];
// How the store's entry follows a use, in words.
export const usedWords = (repository, one) =>
  `${one.name} (${one.need}) is used by ${repository}${one.second_use ? " too: a second use" : ""}`;
// The rows left out of a report, each with why.
export const leftLines = (left) =>
  left.length === 0
    ? []
    : [
        `left out of the report: ${left.length}`,
        ...left.map((one) => `  ${one.name}${one.need ? ` (${one.need})` : ""}: ${one.why}`),
      ];

// The report as a person reads it, before and after it is written.
export function reportLines(result) {
  const { repository, core } = result;
  const lines = [`family core: ${result.family}, at ${core}`];
  const writes = result.text !== null && result.change !== "unchanged";
  if (result.unread) {
    lines.push(
      `the intake ledger of ${repository} tells nothing (${result.unread}): nothing is reported${result.kept ? `, and the report the core holds of ${repository} is left as it is` : ""}`,
    );
  } else if (result.change === "none") {
    lines.push(
      `${repository} has nothing to report: no block of its own whose row says what it is for, and no block of the core taken in`,
    );
  } else if (!writes && result.used.length === 0) {
    lines.push(`the report of ${repository} in the core says this already: nothing was written`);
  }
  if (writes || result.used.length > 0) {
    lines.push(
      `${result.dry_run ? "would write" : "wrote"} the report of ${repository}, in the core folder only:`,
    );
    for (const one of result.used) {
      lines.push(
        `  ${"update".padEnd(9)} ${path.join(core, INDEX)}: ${usedWords(repository, one)}`,
      );
    }
    if (writes) {
      lines.push(
        `  ${result.change.padEnd(9)} ${path.join(core, result.file)}`,
        ...wholeLines(result.text),
      );
    }
  }
  lines.push(...leftLines(result.left_out), `nothing was written in ${repository}`);
  if (writes) lines.push(MEMBERS_KNOW);
  lines.push("nothing was committed or sent anywhere");
  return lines;
}

// Runs the move, the call read by the core command.
export function reportCall(call, usage) {
  const { flags } = call;
  const stray = Object.keys(flags).find(
    (flag) => !TAKES.includes(flag) && flags[flag] !== undefined,
  );
  if (stray) return refuse(`${stray} is not taken by ${REPORT_MOVE}`, usage);
  const result = reportToCore(call.target, {
    core: flags["--core"] === undefined ? null : path.resolve(flags["--core"]),
    dryRun: flags["--dry-run"] === true,
  });
  return finish({
    json: call.json,
    result,
    text: `${reportLines(result).join("\n")}\n`,
    work: false,
  });
}
