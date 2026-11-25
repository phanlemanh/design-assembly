// How the move by which a repository leaves its family is called, and what it prints (spec 0016,
// criterion 25). The core command reads its flags and hands the move here.
//   --leave   0 once the repository left (or would, with --dry-run) and nothing is left to do, and
//             on a repository of no family, which is told so; 1 when the repository left and its
//             line could not be taken out of the core's list of members, with what is left to do
//             there; 2 on a wrong call, or a repository that cannot be read; then nothing is
//             written.
import path from "node:path";

import { ADDRESS } from "../templates/tools/design-assembly/contract.mjs";
import { isDay } from "../templates/tools/design-assembly/waiting.mjs";
import { today } from "./asking.mjs";
import { finish, refuse } from "./command.mjs";
import { leaveCore } from "./core-leave.mjs";

export const LEAVE_MOVE = "--leave";
export const LEAVE_FLAGS = { [LEAVE_MOVE]: "switch" };
export const LEAVE_USAGE =
  "       node core.mjs --leave --by NAME --why REASON [--core DIR] [--on DATE] [--dry-run] [--target DIR] [--json]\n";
// The flags the move takes besides the common ones.
const TAKES = [LEAVE_MOVE, "--by", "--why", "--core", "--on", "--dry-run"];
const blank = (value) => value === undefined || String(value).trim() === "";

const ONCE_WORDS = {
  inherited: "once inherited",
  changed: "once a default of the core this repository changed, with its reason",
  kept: "once kept against the core as an exception, with its reason",
};

// The repository's report in the core goes with its line: said before it is deleted.
function reportLines({ core_report: report, repository }) {
  if (!report?.file) return [];
  const line = `in the core folder: ${report.file}: deletes the report of ${repository}: the family counts the needs of its own repositories`;
  if (report.deleted) return [`${line} (deleted)`];
  return [report.why ? `${line}; not deleted: ${report.why}` : `${line} (not deleted: --dry-run)`];
}

function coreLines(result) {
  return [...memberLineLines(result), ...reportLines(result)];
}

function memberLineLines({ core_file: core, repository, dry_run: dryRun }) {
  if (!core.reached) {
    return [
      `the core folder was not reached (${core.why}): the repository ${dryRun ? "would leave" : "left"} all the same`,
      `  left to do in the core: ${core.left}`,
    ];
  }
  if (core.line) {
    const line = `in the core folder: ${core.file}: takes the line ${JSON.stringify(core.line)} out of members`;
    if (core.written) return [`${line} (written)`];
    if (!core.why) return [`${line} (not written: --dry-run)`];
    return [`${line}; not written: ${core.why}`, `  left to do in the core: ${core.left}`];
  }
  if (core.why) {
    return [
      `in the core folder: ${core.file} was not changed: ${core.why}`,
      `  left to do in the core: ${core.left}`,
    ];
  }
  return [
    `in the core folder: ${core.file} names no line for ${repository} under members: nothing to take out`,
  ];
}

function leaveReport(result) {
  if (!result.left) {
    return [`${result.repository} is of no family: ${result.why}. Nothing was written`];
  }
  const dry = result.dry_run;
  const lines = [
    `${result.repository} ${dry ? "would leave" : "left"} ${result.family ? `the family ${result.family}` : "its family"}${result.pin ? `, pinned at ${result.pin}` : ""}: said by ${result.by} on ${result.on}: ${result.why}`,
  ];
  if (!result.copy.readable) {
    lines.push(
      `the copy of the core here cannot be read (${result.copy.why}): the move works from the declaration and the marks alone`,
    );
  }
  lines.push(
    `answers that ${dry ? "would be" : "are"} the repository's own from ${result.on}, each value as it was: ${result.rows.length}`,
    ...result.rows.map((row) => {
      const value = row.value_kept
        ? `; its value, ${row.value_kept}, was held by the copy alone and is kept as the row's source`
        : row.value_lost
          ? "; its value was held by the copy alone, which could not be read: settle it again"
          : "";
      return `  ${row.id}: ${ONCE_WORDS[row.once]}, at ${row.pin}${value}`;
    }),
  );
  if (result.blueprint.length > 0) {
    lines.push(
      `choices of the blueprint marked as the repository's own: ${result.blueprint.map((item) => `${item.layer}.${item.key} (once ${item.once})`).join(", ")}`,
    );
  }
  lines.push(
    result.questions.removed.length > 0
      ? `questions about the core${dry ? " that would be" : ""} taken off the waiting list: ${result.questions.removed.join(", ")}`
      : "no question about the core waits on the owner",
  );
  if (result.questions.kept.length > 0) {
    lines.push(
      `  answered already, kept as the record of what was said: ${result.questions.kept.join(", ")}`,
    );
  }
  lines.push(
    result.check === "now"
      ? `the gate's check family-core ${dry ? "would be" : "is"} taken off ledger-shapes`
      : "the gate held no check of the core here",
    `in this repository${dry ? ", would write" : ""}:`,
    ...result.written.map((line) => `  ${line}`),
  );
  for (const file of result.copy.left_in_place) {
    lines.push(`  left in place: ${file} is no file of the copy the pin lists`);
  }
  // A block taken in from the core is the repository's code: it stays, and its row is not rewritten.
  const kept = result.blocks_kept ?? [];
  if (kept.length > 0) {
    const pins = [...new Set(kept.map((block) => block.pin).filter(Boolean))];
    lines.push(
      `${kept.length} block${kept.length === 1 ? "" : "s"} taken from the core ${kept.length === 1 ? "stays" : "stay"}, as this repository's own from now on: ${kept.map((block) => `${block.name} (${block.file}), for ${block.need}`).join("; ")}; ${kept.length === 1 ? "its row" : "their rows"} of the intake ledger ${kept.length === 1 ? "keeps" : "keep"} from: core and the pin ${pins.join(", ")} as where ${kept.length === 1 ? "it" : "they"} once came from, and ${kept.length === 1 ? "it is" : "they are"} compared with no core any more`,
    );
  }
  if (result.exports) {
    lines.push(
      `the exports ${dry ? "would be" : "are"} behind the design ledgers (${result.exports.behind.join(", ")}), so the gate's row ${result.exports.row} is red until they are written again: ${result.exports.command}`,
    );
  }
  lines.push(...coreLines(result));
  lines.push(
    result.list.why
      ? `the machine's list of cores (${result.list.file}) was not written: ${result.list.why}`
      : `the machine's list of cores ${dry ? "would record" : "records"} that this repository left a family on ${result.on}, so it is not asked at once whether it is of one: ${result.list.file}`,
    dry
      ? "nothing was written: --dry-run"
      : "the repository stands alone from now on; it can join a family again with core --join",
    "nothing was sent anywhere",
  );
  return lines;
}

// Runs the move, the call read by the core command.
export function leaveCall(call, usage) {
  const { flags } = call;
  const stray = Object.keys(flags).find(
    (flag) => !TAKES.includes(flag) && flags[flag] !== undefined,
  );
  if (stray) return refuse(`${stray} is not taken by ${LEAVE_MOVE}`, usage);
  const on = flags["--on"] ?? today();
  if (!isDay(on)) return refuse(`--on ${on} is not a day written YYYY-MM-DD`, usage);
  if (blank(flags["--by"])) {
    return refuse("say who said the repository leaves, with --by NAME", usage);
  }
  const reasons = flags["--why"] ?? [];
  if (reasons.length !== 1 || blank(reasons[0])) {
    return refuse(
      reasons.length > 1
        ? `--why is given once to ${LEAVE_MOVE}`
        : "say why the repository leaves, with --why REASON: the reason is kept in each answer's mark",
      usage,
    );
  }
  // A name and a reason, never an address: the marks are written into the repository's ledgers.
  for (const [flag, value] of [
    ["--by", flags["--by"]],
    ["--why", reasons[0]],
  ]) {
    if (ADDRESS.test(value)) {
      return refuse(
        `${flag} holds an e-mail address; a name and a reason, never an address`,
        usage,
      );
    }
  }
  const result = leaveCore(call.target, {
    core: blank(flags["--core"]) ? null : path.resolve(flags["--core"]),
    by: flags["--by"].trim(),
    why: reasons[0].trim(),
    on,
    dryRun: flags["--dry-run"] === true,
  });
  // The lines written are for a person; a machine gets the files as a list.
  const forMachine = Object.fromEntries(
    Object.entries(result).filter(([key]) => key !== "written"),
  );
  return finish({
    json: call.json,
    result: forMachine,
    text: `${leaveReport(result).join("\n")}\n`,
    work: result.left === true && Boolean(result.core_file.left),
  });
}
