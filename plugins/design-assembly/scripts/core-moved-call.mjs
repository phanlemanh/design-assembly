// How the moves of slice 3 of item 7.1 are called and what they print (spec 0016, criteria 9, 14
// and 19). The core command reads its flags and hands each of these moves here.
//   --moved       whether the family's core moved ahead of this repository's pin, change by change:
//                 1 when it did, 0 when it did not or cannot be looked at (said, never an error).
//                 With --draw, the changes a picture shows are drawn before and after, or the
//                 reason there is no picture is given beside the values
//   --accept ID   take the core's answer for the answers named; --accept-all takes every one:
//                 0 when nothing is left, 1 when a changed answer was left or a question waits on
//                 the owner
//   --publish     what would go where if the core were pushed, and whether the family's owner gave
//                 leave: 0 when the leave covers it or was taken back, 1 when a person is asked
//                 first. With --allow the leave is recorded, with --revoke taken back, with
//                 --pushed a push the session made is recorded: 0
// Every move ends with 2 on a wrong call, a repository or a core that cannot be read; then nothing
// is written. None calls a model or the network.
import path from "node:path";

import { ADDRESS } from "../templates/tools/design-assembly/contract.mjs";
import { isDay } from "../templates/tools/design-assembly/waiting.mjs";
import { today } from "./asking.mjs";
import { finish, Refusal, refuse } from "./command.mjs";
import { acceptCore } from "./core-accept.mjs";
import { addLine } from "./core-list.mjs";
import {
  ACCEPT_WORDS,
  blockChangeLines,
  BLOCKS_WORDS,
  changeLines,
  countWords,
  hereWords,
  movedOf,
  proposalLines,
} from "./core-moved.mjs";
import {
  allowPublish,
  allowReport,
  planReport,
  publishPlan,
  pushReport,
  recordPush,
  revokePublish,
  revokeReport,
} from "./core-publish.mjs";

export const MOVED_MOVES = ["--moved", "--accept", "--accept-all", "--publish"];
export const MOVED_FLAGS = {
  "--moved": "switch",
  "--accept": "names",
  "--accept-all": "switch",
  "--draw": "switch",
  "--only": "names",
  "--out": "value",
  "--publish": "switch",
  "--allow": "switch",
  "--revoke": "switch",
  "--pushed": "switch",
  "--to": "value",
  "--remote": "value",
};
export const MOVED_USAGE =
  "       node core.mjs --moved [--core DIR] [--draw [--only ID]... [--out DIR]] [--target DIR] [--json]\n" +
  "       node core.mjs --accept ID [--accept ID]... --by NAME [--core DIR] [--on DATE] [--dry-run] [--target DIR] [--json]\n" +
  "       node core.mjs --accept-all --by NAME [--core DIR] [--on DATE] [--dry-run] [--target DIR] [--json]\n" +
  "       node core.mjs --publish --core DIR [--to PLACE] [--remote NAME] [--json]\n" +
  "       node core.mjs --publish --core DIR --allow --to PLACE --by NAME [--on DATE] [--dry-run] [--json]\n" +
  "       node core.mjs --publish --core DIR --revoke --by NAME [--on DATE] [--dry-run] [--json]\n" +
  "       node core.mjs --publish --core DIR --pushed --by NAME [--to PLACE] [--on DATE] [--dry-run] [--json]\n";

// The flags each move takes besides the common ones.
const TAKES = {
  "--moved": ["--core", "--draw", "--only", "--out"],
  "--accept": ["--core", "--by", "--on", "--dry-run"],
  "--accept-all": ["--core", "--by", "--on", "--dry-run"],
  "--publish": [
    "--core",
    "--to",
    "--remote",
    "--allow",
    "--revoke",
    "--pushed",
    "--by",
    "--on",
    "--dry-run",
  ],
};
const blank = (value) => value === undefined || String(value).trim() === "";
const shown = (value) => (typeof value === "string" ? value : JSON.stringify(value));

// The exports a move leaves behind the ledgers, as the moves of a member say it.
const exportLines = ({ exports, dry_run: dryRun }) =>
  exports
    ? [
        `the exports ${dryRun ? "would be" : "are"} behind the design ledgers (${exports.behind.join(", ")}), so the gate's row ${exports.row} is red until they are written again: ${exports.command}`,
      ]
    : [];

function movedReport(moved, listed) {
  if (moved.state === "unreadable") {
    // The pin is the hash of a copy that can be read: where it cannot, none is said.
    return [
      `family core: ${moved.family ?? "the family this repository declares"}: the pin cannot be read`,
      `the copy of the core here cannot be read (${moved.why}): the repository inherits nothing, and whether the core moved is not looked at; pin it again with core --join`,
    ];
  }
  const lines = [`family core: ${moved.family}, pinned here at ${moved.pin}`];
  if (moved.state === "unreachable") {
    lines.push(
      `the core's folder cannot be looked at: ${moved.why}`,
      "whether the core moved is not known; the repository goes on with its copy, and nothing is wrong with it",
      "to look at a core kept elsewhere on this machine, name its folder: core --moved --core DIR",
    );
    return lines;
  }
  if (listed) {
    lines.push(
      listed.why
        ? `the machine's list of cores (${listed.file}) was not written: ${listed.why}`
        : `the machine's list of cores holds this core from now on (${listed.file}), so status and the session's first line look there`,
    );
  }
  if (moved.state === "same") {
    lines.push(`the core (${moved.core}) is where this repository pinned it: nothing waits`);
  } else {
    lines.push(
      `the core (${moved.core}) is ahead of the pin: it is at ${moved.core_pin}, with ${countWords(moved.changes)}`,
    );
    if (moved.form_only) {
      lines.push(
        "its answers file is written otherwise and no answer differs: accepting moves the pin and changes no answer",
      );
    }
    for (const change of moved.changes) {
      const [first, ...rest] = changeLines(change);
      lines.push(`  ${first}`, ...rest.map((line) => `  ${line}`));
      const here = hereWords(change);
      if (here) lines.push(`    here: ${here}`);
    }
  }
  for (const change of moved.block_changes ?? []) {
    lines.push(...blockChangeLines(change).map((line) => `  ${line}`));
  }
  if (moved.blocks_differ) lines.push(BLOCKS_WORDS);
  lines.push(...proposalLines(moved));
  if (moved.state === "ahead") lines.push(ACCEPT_WORDS, "nothing was written");
  return lines;
}

const STATE_WORDS = {
  inherited: "inherited",
  changed: "this repository holds its own, recorded with its reason",
  kept: "kept against the core, with its reason",
  differs: "this repository holds another: a question waits on the owner",
  unreasoned: "a default this repository holds otherwise, with no reason yet",
};

function acceptReport(result) {
  if (result.nothing) {
    return [
      `the core (${result.core}) is where this repository pinned it (${result.pin}): there is nothing to accept, and nothing was written`,
    ];
  }
  const lines = [
    `${result.dry_run ? "would accept" : "accepted"} from the family core ${result.family} (${result.core}), as ${result.by} said on ${result.on}: ${
      [
        ...result.accepted.map((change) => change.id),
        ...(result.blocks_accepted ?? []).map(
          (change) => `the retiring of the block ${change.need}`,
        ),
      ].join(", ") || "no answer, only how the file is written"
    }`,
  ];
  for (const change of result.blocks_accepted ?? []) {
    const [first] = blockChangeLines(change);
    lines.push(`  ${first.replace(/; accepting it .*$/, "")}`);
  }
  for (const change of result.accepted) {
    const [first, ...rest] = changeLines(change);
    lines.push(`  ${first}`, ...rest.map((line) => `  ${line}`));
    const answer = result.answers.find((item) => item.id === change.id);
    if (answer) {
      const here =
        answer.held_here === undefined ? "" : `; this repository holds ${shown(answer.held_here)}`;
      const question = answer.question ? `; question ${answer.question}` : "";
      lines.push(`    here: ${STATE_WORDS[answer.state] ?? answer.state}${here}${question}`);
    }
  }
  for (const row of result.turned?.rows ?? []) {
    lines.push(
      `  the row ${row.id} is this repository's own${result.dry_run ? " once written" : ""}: once ${row.once} from the family core at ${row.pin}, and the core retired it`,
    );
  }
  for (const choice of result.turned?.choices ?? []) {
    lines.push(
      `  the blueprint's ${choice.layer}.${choice.key} is this repository's own, under own`,
    );
  }
  for (const block of result.turned?.blocks ?? []) {
    lines.push(
      `  ${block.name} (${block.need}, ${block.file}) stays where it is, as this repository's own: its row of the intake ledger says so under own, and still says where it once came from`,
    );
  }
  for (const need of result.turned?.not_taken_in ?? []) {
    lines.push(`  ${need} was never taken in here: it only leaves the copy`);
  }
  lines.push(
    result.pin === result.pin_was && result.accepted.length === 0
      ? `the pin stays at ${result.pin}: no answer was accepted`
      : result.whole
        ? `the pin ${result.dry_run ? "would move" : "moved"} from ${result.pin_was} to ${result.pin}, the core's own: the copy is the core's answers, byte for byte`
        : `the pin ${result.dry_run ? "would move" : "moved"} from ${result.pin_was} to ${result.pin}: the copy holds the core's answer for what was accepted and the earlier one for what was left, so the core (${result.core_pin}) still shows as ahead`,
  );
  if (result.left.length > 0) {
    lines.push(`left as they were, still to accept or not: ${result.left.join(", ")}`);
  }
  if (result.waiting.length > 0) {
    lines.push(
      `waiting on the owner: ${result.waiting.join(", ")}: nothing of the repository was written over; answer on the decision sheet, then core --settle`,
    );
  }
  for (const file of result.withdrawn) {
    lines.push(
      `${result.dry_run ? "would take away" : "took away"} ${file.path}: it asked about the earlier pin`,
    );
  }
  if (result.stale.length > 0) {
    lines.push(
      `${result.stale.join(", ")} still stand on the shared waiting list and ask about the earlier pin: split the list with decide --split, then answer or take them away`,
    );
  }
  lines.push(
    `in this repository${result.dry_run ? ", would write" : ""}:`,
    ...(result.written.length === 0
      ? ["  nothing to write"]
      : result.written.map((line) => `  ${line}`)),
    ...exportLines(result),
  );
  const core = result.core_file;
  lines.push(
    `in the core folder: ${core.file}: ${core.says}${core.why ? `; not written: ${core.why}` : core.already ? " (already so)" : result.dry_run ? " (not written: --dry-run)" : " (written)"}`,
  );
  if (result.blocks_differ) lines.push(BLOCKS_WORDS);
  lines.push("nothing was sent anywhere");
  return lines;
}

// Runs one move of this slice, the call read by the core command.
export async function movedMain(move, call, usage) {
  const { flags } = call;
  const stray = Object.keys(flags).find(
    (flag) => flag !== move && !TAKES[move].includes(flag) && flags[flag] !== undefined,
  );
  if (stray) return refuse(`${stray} is not taken by ${move}`, usage);
  const on = flags["--on"] ?? today();
  if (!isDay(on)) return refuse(`--on ${on} is not a day written YYYY-MM-DD`, usage);
  const dryRun = flags["--dry-run"] === true;
  const by = blank(flags["--by"]) ? null : flags["--by"].trim();
  if (by && ADDRESS.test(by)) {
    return refuse("--by holds an e-mail address; a name, never an address", usage);
  }
  const core = flags["--core"] === undefined ? null : path.resolve(flags["--core"]);
  const done = (result, lines, work) =>
    finish({ json: call.json, result, text: `${lines.join("\n")}\n`, work });
  const strip = (result) =>
    Object.fromEntries(Object.entries(result).filter(([key]) => key !== "written"));

  if (move === "--moved") {
    if (!flags["--draw"] && (flags["--only"] || flags["--out"])) {
      return refuse("--only and --out go with --draw", usage);
    }
    const moved = movedOf(call.target, { core });
    if (moved === null) {
      throw new Refusal("this repository declares no family: there is no core to look at");
    }
    // A core the person pointed at is kept in the machine's list, so the next look finds it.
    const listed =
      core !== null && moved.core
        ? addLine({ family: moved.family, path: moved.core, on, how: "pinned" })
        : null;
    const lines = movedReport(moved, listed);
    let eye = null;
    if (flags["--draw"] && moved.state === "ahead") {
      const { eyeLines, lookByEye } = await import("./core-eye.mjs");
      eye = await lookByEye(call.target, moved.changes, {
        only: flags["--only"] ?? [],
        ...(flags["--out"] ? { out: flags["--out"] } : {}),
      });
      lines.push(...eyeLines(eye));
    } else if (flags["--draw"]) {
      lines.push("nothing to draw: no change of the core is looked at");
    }
    return done(
      { ...moved, ...(listed ? { list: listed } : {}), ...(eye ? { eye } : {}) },
      lines,
      moved.state === "ahead",
    );
  }

  if (move === "--accept" || move === "--accept-all") {
    if (!by)
      return refuse("say who accepts, with --by NAME: nothing follows a core by itself", usage);
    const result = acceptCore(call.target, {
      ids: flags["--accept"] ?? [],
      all: move === "--accept-all",
      by,
      on,
      core,
      dryRun,
    });
    const work = !result.nothing && (result.left.length > 0 || result.waiting.length > 0);
    return done(strip(result), acceptReport(result), work);
  }

  // --publish
  if (!core) return refuse("say which core, with --core DIR", usage);
  const steps = ["--allow", "--revoke", "--pushed"].filter((flag) => flags[flag]);
  if (steps.length > 1) return refuse(`${steps.join(" and ")} are two calls; give one`, usage);
  const remote = flags["--remote"] ?? undefined;
  const text = (result, report) => finish({ json: call.json, result, text: report, work: false });
  if (steps.length === 0) {
    const leftover = ["--by", "--on", "--dry-run"].find((flag) => flags[flag] !== undefined);
    if (leftover) return refuse(`${leftover} goes with --allow, --revoke or --pushed`, usage);
    const plan = publishPlan(core, { to: flags["--to"], remote });
    return finish({ json: call.json, result: plan, text: planReport(plan), work: plan.waits });
  }
  if (!by) return refuse("say who said so, with --by NAME", usage);
  if (steps[0] === "--allow") {
    const result = allowPublish(core, { to: flags["--to"], remote, by, on, dryRun });
    return text(result, allowReport(result));
  }
  if (steps[0] === "--revoke") {
    if (flags["--to"] !== undefined) return refuse("--to is not taken by --revoke", usage);
    const result = revokePublish(core, { by, on, dryRun });
    return text(result, revokeReport(result));
  }
  const result = recordPush(core, { to: flags["--to"], remote, by, on, dryRun });
  return text(result, pushReport(result));
}
