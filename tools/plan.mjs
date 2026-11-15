// The plan of record, held by a command instead of by memory. `docs/plan/plan.json` says which
// stage is open and what each item is; this tool prints where the work stands, and checks that
// the plan is in order and that a branch says which item it serves.
// Usage: node tools/plan.mjs            where the work stands
//        node tools/plan.mjs --check    problems, for the gate
import { spawnSync } from "node:child_process";
import { readFileSync, realpathSync } from "node:fs";
import path from "node:path";
import { argv, exit, stdout } from "node:process";
import { fileURLToPath } from "node:url";

const SELF = fileURLToPath(import.meta.url);
const ROOT = path.resolve(path.dirname(SELF), "..");
export const PLAN_FILE = "docs/plan/plan.json";

const STAGE_STATES = ["done", "current", "next", "later"];
const ITEM_STATES = ["todo", "doing", "done"];
const OFF_PLAN = "off-plan";

// The stage that is open, the ones allowed to run beside it, and what comes after.
export function position(plan) {
  const stages = plan.stages ?? [];
  const current = stages.find((stage) => stage.state === "current") ?? null;
  const beside = current
    ? stages.filter((stage) => (current.parallel ?? []).includes(stage.id))
    : [];
  const open = new Set([current, ...beside].filter(Boolean).map((stage) => stage.id));
  const next = stages.find((stage) => stage.state !== "done" && !open.has(stage.id)) ?? null;
  return { current, beside, open, next };
}

// Every way the plan itself is out of order, one line each. Empty means it can be followed.
export function planProblems(plan) {
  const found = [];
  const stages = plan.stages ?? [];
  if (!plan.approved?.by || !plan.approved?.on) found.push("no person approved this plan");
  const currents = stages.filter((stage) => stage.state === "current");
  if (currents.length === 0) found.push("no stage is current");
  if (currents.length > 1) found.push(`${currents.length} stages are current; one is`);
  const { current, open } = position(plan);
  const ids = new Set(stages.map((stage) => stage.id));
  let closedSoFar = true;
  for (const stage of stages) {
    if (!STAGE_STATES.includes(stage.state)) found.push(`stage ${stage.id} has no known state`);
    if ((stage.done_when ?? []).length === 0) {
      found.push(`stage ${stage.id} does not say when it is done`);
    }
    for (const item of stage.items ?? []) {
      if (!ITEM_STATES.includes(item.state)) found.push(`item ${item.id} has no known state`);
    }
    if (stage.state === "done") {
      if (!closedSoFar) found.push(`stage ${stage.id} is done after a stage that is not`);
      for (const item of stage.items ?? []) {
        if (item.state !== "done")
          found.push(`stage ${stage.id} is done but item ${item.id} is not`);
      }
      if (!stage.closed?.on || !stage.closed?.evidence) {
        found.push(`stage ${stage.id} is done with no record of when and on what evidence`);
      }
      continue;
    }
    closedSoFar = false;
    if (open.has(stage.id) || !current) continue;
    // Work may not start in a stage that is not open yet.
    for (const item of stage.items ?? []) {
      if (item.state !== "todo") {
        found.push(`item ${item.id} is ${item.state} while stage ${current.id} is still open`);
      }
    }
  }
  for (const entry of plan.parked ?? []) {
    if (!ids.has(entry.stage)) {
      found.push(
        `"${entry.what}" is set aside for stage ${entry.stage}, which the plan does not have`,
      );
    }
  }
  return found;
}

// The values of the `Plan:` trailers of one commit message: lines of its last paragraph.
export function trailers(message) {
  const last =
    message
      .trim()
      .split(/\n\s*\n/)
      .at(-1) ?? "";
  return last
    .split("\n")
    .map((line) => /^Plan:\s*(.+)$/.exec(line.trim())?.[1].trim())
    .filter(Boolean);
}

// What is wrong with how a branch ties itself to the plan, given the messages of its own commits.
export function commitProblems(plan, messages) {
  if (messages.length === 0) return [];
  const said = messages.flatMap(trailers);
  if (said.length === 0) {
    return [
      `no commit of this branch names an item of the plan: add a line "Plan: <item>" or "Plan: ${OFF_PLAN} — <why>" at the end of a commit message`,
    ];
  }
  const found = [];
  const { open } = position(plan);
  const stageOf = new Map(
    (plan.stages ?? []).flatMap((stage) => (stage.items ?? []).map((item) => [item.id, stage])),
  );
  for (const value of said) {
    if (value.startsWith(OFF_PLAN)) {
      const why = value.slice(OFF_PLAN.length).replace(/^[\s—:-]+/, "");
      if (!why) found.push(`Plan: ${value} is ${OFF_PLAN} with no reason`);
      continue;
    }
    const stage = stageOf.get(value);
    if (!stage) found.push(`Plan: ${value} names no item of the plan`);
    else if (stage.state !== "done" && !open.has(stage.id)) {
      found.push(`Plan: ${value} is an item of stage ${stage.id}, which is not open`);
    }
  }
  return found;
}

const git = (...args) => spawnSync("git", ["-C", ROOT, ...args], { encoding: "utf8" });

// The messages of the commits this branch adds to main, merges left out; null when main cannot be
// seen from here.
function branchMessages() {
  if (git("rev-parse", "--verify", "--quiet", "origin/main").status !== 0) return null;
  const log = git("log", "--no-merges", "--format=%B%x00", "origin/main..HEAD");
  if (log.status !== 0) return null;
  return log.stdout
    .split("\0")
    .map((message) => message.trim())
    .filter(Boolean);
}

// How many commits on main said they were off the plan, since the plan was approved.
function offPlanOnMain(plan) {
  const log = git(
    "log",
    "--format=%B%x00",
    `--since=${plan.approved?.on ?? "1970-01-01"}`,
    "origin/main",
  );
  if (log.status !== 0) return null;
  return log.stdout
    .split("\0")
    .filter((message) => trailers(message).some((v) => v.startsWith(OFF_PLAN))).length;
}

function report(plan) {
  const { current, beside, next } = position(plan);
  const lines = [`plan: approved by ${plan.approved?.by} on ${plan.approved?.on}`];
  const show = (stage, label) => {
    const done = stage.items.filter((item) => item.state === "done").length;
    lines.push(
      "",
      `${label}: stage ${stage.id} — ${stage.name} (${done} of ${stage.items.length} items done)`,
    );
    for (const item of stage.items) {
      lines.push(
        `  ${item.state.padEnd(5)} ${item.id}  ${item.what}${item.ref ? `  [${item.ref}]` : ""}`,
      );
    }
    lines.push("  done when:");
    for (const text of stage.done_when) lines.push(`    - ${text}`);
    if (stage.needs_owner?.length) lines.push(`  needs the owner: ${stage.needs_owner.join("; ")}`);
  };
  if (current) show(current, "open now");
  for (const stage of beside) show(stage, "may run beside it");
  if (next) lines.push("", `after that: stage ${next.id} — ${next.name}`);
  lines.push("", `set aside, not lost: ${(plan.parked ?? []).length}`);
  for (const entry of plan.parked ?? [])
    lines.push(`  stage ${entry.stage}: ${entry.what} (${entry.why_not_now})`);
  const off = offPlanOnMain(plan);
  lines.push(
    "",
    `commits on main that said they were off the plan: ${off ?? "cannot be read here"}`,
  );
  return lines;
}

function main() {
  const plan = JSON.parse(readFileSync(path.join(ROOT, PLAN_FILE), "utf8"));
  if (!argv.includes("--check")) {
    stdout.write(`${report(plan).join("\n")}\n`);
    return;
  }
  const messages = branchMessages();
  const found = [...planProblems(plan), ...commitProblems(plan, messages ?? [])];
  if (found.length > 0) {
    stdout.write(
      `plan: ${found.length} problem(s)\n${found.map((line) => `  ${line}`).join("\n")}\n`,
    );
    exit(1);
  }
  const { current } = position(plan);
  const tie =
    messages === null
      ? "main cannot be seen from here, so the branch's tie to the plan was not checked"
      : messages.length === 0
        ? "no commit of its own on this branch"
        : "this branch names its item";
  stdout.write(`plan: in order, stage ${current.id} open; ${tie}\n`);
}

if (argv[1] && realpathSync(argv[1]) === realpathSync(SELF)) main();
