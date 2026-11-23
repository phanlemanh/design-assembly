// The bridge out (specification 0014): writes the design ledgers of a repository out for tools that
// do not read them, a DESIGN.md and a design system bundle, each stamped with the state of the
// ledgers, and puts them under the gate: one check of the tool data per export, and the row of the
// decision ledger that points at the tool. After a ledger changes, the gate is red until the exports
// are written again. It reads and writes files of the repository only; it sends nothing anywhere.
// With --send PLUG it reads, or asks, the owner's leave to send the system bundle to that plug, and
// with it says what goes where (send-out.mjs); --pushed records a push the skill made, --revoke
// takes the leave back.
// Usage: node bring-out.mjs [--target DIR] [--name NAME] [--dry-run] [--json]
//        node bring-out.mjs --send PLUG [--pushed [--account-has-default]] [--revoke --by NAME | --reask]
//                           [--on DATE] [--target DIR] [--dry-run] [--json]
// Exit: 0 the exports are written, or would be; 2 a wrong call, or a repository with no design
// tokens file to write them from. On 2 nothing is written.
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { stdout } from "node:process";

import {
  EXPORTS_DECISION,
  exportFiles,
  exportsName,
  readInputs,
  stampOf,
} from "../templates/tools/design-assembly/exports.mjs";
import { lineWidth, renderJson } from "../templates/tools/design-assembly/json.mjs";
import { LEDGERS } from "../templates/tools/design-assembly/contract.mjs";
import { mergeLedger, readLedger, TOOL } from "../templates/tools/design-assembly/ledger.mjs";
import { writeFiles, writtenFiles } from "./apply.mjs";
import { today } from "./asking.mjs";
import { finish, readCall, Refusal, refuse, start } from "./command.mjs";
import { sendOut } from "./send-out.mjs";
import { isDay } from "../templates/tools/design-assembly/waiting.mjs";

const THEME = "design/theme.json";
// The file of the repository's copy of the tool that writes and checks the exports.
const TOOL_EXPORTS = "tools/design-assembly/exports.mjs";

// The tool data, read, or a refusal that says why it cannot be.
function themeOf(text) {
  if (text === null) {
    throw new Refusal(`${THEME} is missing: the gate has nothing to hold the exports with`);
  }
  try {
    return JSON.parse(text);
  } catch {
    throw new Refusal(`${THEME} is not JSON: the gate cannot hold the exports until it is`);
  }
}
const DECISIONS = LEDGERS.decisions.file;

const read = (root, file) =>
  existsSync(path.join(root, file)) ? readFileSync(path.join(root, file), "utf8") : null;

// The name the exports go by: the one asked for, else the one they already have, else the name of
// the repository's package, else its folder's.
function nameOf(root, asked, theme) {
  if (asked) return asked;
  const kept = exportsName(theme);
  if (kept) return kept;
  try {
    const name = JSON.parse(read(root, "package.json") ?? "{}").name;
    if (typeof name === "string" && name.trim() !== "") return name;
  } catch {
    // A package file that cannot be read gives no name; the folder's is used.
  }
  return path.basename(root);
}

// The tool data with one check of the exports for each file, under the decision that holds them.
function themeWith(theme, files, name) {
  const checks = files.map((file) => ({ kind: "export", file, name }));
  return { ...theme, checks: { ...theme.checks, [EXPORTS_DECISION]: checks } };
}

// The row that says the exports are written from the ledgers and held by the tool, when the ledger
// has none.
const ROW = {
  id: EXPORTS_DECISION,
  layer: "governance",
  kind: "formula",
  source: "the design ledgers, written out by make design-exports",
  check: TOOL,
};

// What a run writes: every export, the tool data that holds them, and the row that points at it.
export function bringOut(root, { name = null, dryRun = false } = {}) {
  const inputs = readInputs(root);
  if (!inputs.tokens) {
    throw new Refusal(
      "design/tokens.json is missing or cannot be read: there is nothing to write out until the guide or adopting wrote it",
    );
  }
  if (!existsSync(path.join(root, TOOL_EXPORTS))) {
    throw new Refusal(
      "the repository's copy of the tool has no exports.mjs: bring it up with upgrade first, so its gate can hold the exports",
    );
  }
  const theme = themeOf(read(root, THEME));
  const called = nameOf(root, name, theme);
  const exports = exportFiles(inputs, called);
  const files = {
    ...exports,
    [THEME]: renderJson(themeWith(theme, Object.keys(exports), called), lineWidth(root)),
  };
  const rows = readLedger(root) ?? [];
  if (!rows.some((row) => String(row.id) === EXPORTS_DECISION)) {
    files[DECISIONS] = mergeLedger(read(root, DECISIONS), [ROW]);
  }
  return {
    stamp: stampOf(inputs),
    exports: Object.keys(exports),
    files: writtenFiles(writeFiles(root, files, dryRun)),
    dry_run: dryRun,
  };
}

// What was written, as a person reads it.
function report(result) {
  const lines = [`the design ledgers are at ${result.stamp}`];
  if (result.files.length === 0)
    lines.push("every export already says what they say: nothing written");
  for (const file of result.files) {
    lines.push(`${result.dry_run ? "would write" : "wrote"} ${file.path}`);
  }
  lines.push("the gate holds them: after a ledger changes, run make design-exports");
  return `${lines.join("\n")}\n`;
}

// What a run of --send says, as a person reads it.
function sendReport(result) {
  const lines = [];
  if (result.send) {
    lines.push(`sends: ${result.send.files.join(", ")}`, `to: ${result.send.to}`);
    lines.push(`written from the design ledgers at ${result.send.stamp}`);
  }
  if (result.says) lines.push(result.says);
  for (const id of result.waits)
    lines.push(`waiting on the owner: ${id} (/design-assembly:decide)`);
  for (const file of result.files) {
    lines.push(`${result.dry_run ? "would" : "did"} ${file.change} ${file.path}`);
  }
  return `${lines.join("\n")}\n`;
}

const USAGE =
  "usage: node bring-out.mjs [--target DIR] [--name NAME] [--dry-run] [--json]\n" +
  "       node bring-out.mjs --send PLUG [--pushed [--account-has-default]] [--revoke --by NAME | --reask] [--on DATE] [--target DIR] [--dry-run] [--json]\n";
const FLAGS = {
  "--name": "value",
  "--dry-run": "switch",
  "--send": "value",
  "--pushed": "switch",
  "--account-has-default": "switch",
  "--revoke": "switch",
  "--reask": "switch",
  "--by": "value",
  "--on": "value",
};

// A run of --send, from its call.
function sendCall(call) {
  const on = call.flags["--on"] ?? today();
  if (!isDay(on)) throw new Refusal(`--on ${on} is not a day written YYYY-MM-DD`);
  const result = sendOut(call.target, call.flags["--send"], {
    on,
    pushed: call.flags["--pushed"] === true,
    accountHasDefault: call.flags["--account-has-default"] === true,
    revoke: call.flags["--revoke"] === true,
    reask: call.flags["--reask"] === true,
    by: call.flags["--by"] ?? null,
    dryRun: call.flags["--dry-run"] === true,
  });
  return finish({
    json: call.json,
    result,
    text: sendReport(result),
    work: result.waits.length > 0,
  });
}

async function main(args) {
  const call = readCall(args, FLAGS);
  if (call.problem) return refuse(call.problem, USAGE);
  if (call.help) return void stdout.write(USAGE);
  if (call.flags["--send"]) return sendCall(call);
  for (const flag of ["--pushed", "--revoke", "--reask", "--account-has-default", "--by", "--on"]) {
    if (call.flags[flag] !== undefined) return refuse(`${flag} goes with --send PLUG`, USAGE);
  }
  const result = bringOut(call.target, {
    name: call.flags["--name"] ?? null,
    dryRun: call.flags["--dry-run"] === true,
  });
  return finish({ json: call.json, result, text: report(result), work: false });
}

await start(import.meta.url, main);
