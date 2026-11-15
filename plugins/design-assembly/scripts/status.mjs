// The status: what the owner of a repository asks at any moment. Which tier the repository has
// reached, one line per rhythm of its life, what waits on the owner with a recommendation for each,
// whether the repository's copy of the tool is the installed plugin's, and the command to run next.
// Read-only: it writes nothing, anywhere. The same repository always gives the same answer.
// Usage: node status.mjs [--target DIR] [--json]
// Exit: 0 nothing waits; 1 something waits on a person, the tool differs, or a decision is failing
// or gone around; 2 a wrong call, or a repository that cannot be read.
import { Buffer } from "node:buffer";
import { createHash } from "node:crypto";
import { existsSync, lstatSync, readdirSync, readFileSync, readlinkSync, statSync } from "node:fs";
import path from "node:path";
import { stdout } from "node:process";
import { fileURLToPath } from "node:url";

import { SLIPS_FILE } from "../templates/tools/design-assembly/governance.mjs";
import { readLedger, TOOL } from "../templates/tools/design-assembly/ledger.mjs";
import { finish, readCall, refuse, start } from "./command.mjs";
import { inventory, PERSON_CALLS, UNCONFIRMED } from "./inventory.mjs";

const PLUGIN = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const json = (file) => JSON.parse(readFileSync(path.join(PLUGIN, file), "utf8"));
const VERSION = json(".claude-plugin/plugin.json").version;
const LIMITS = json("references/limits.json").limits;
// Named from the plugin's own folder: installed elsewhere, the plugin has no `plugins/` around it.
const LIMITS_FILE = "references/limits.json of this plugin";

// Where the repository keeps its copy of the tool, and where the plugin keeps the one it installs.
const TOOL_COPY = path.posix.dirname(TOOL.slice("tool:".length));
const TOOL_SOURCE = path.join(PLUGIN, "templates", TOOL_COPY);
// The tool stamp: which version of the plugin the repository's copy of the tool came from, and the
// hash git gives that folder. No command writes it yet; status reads it when it is there.
export const STAMP = "design/tool-stamp.json";

// How many waiting answers a person is shown in full. The rest are named, and --json has them all.
const SHOWN = 5;
const MEASURED = "a measurement on this repository: ";
// The command that lists the places where a check fails or source goes around a decision.
const AUDIT = "/design-assembly:audit";

const hashOf = (type, body) =>
  createHash("sha1").update(`${type} ${body.length}\0`).update(body).digest();

// The tree object git would write for a folder, or null when the folder is missing or holds no
// file. Names that start with a dot are left out: a file an editor or the system drops into the
// folder is not the tool.
function treeOf(dir) {
  if (!existsSync(dir) || !statSync(dir).isDirectory()) return null;
  const entries = [];
  for (const name of readdirSync(dir)) {
    if (name.startsWith(".")) continue;
    const full = path.join(dir, name);
    const found = lstatSync(full);
    if (found.isDirectory()) {
      const hash = treeOf(full);
      // git sorts a folder as if its name ended with a slash, and keeps no empty folder.
      if (hash) entries.push({ mode: "40000", name, hash, order: `${name}/` });
    } else if (found.isSymbolicLink()) {
      const hash = hashOf("blob", Buffer.from(readlinkSync(full)));
      entries.push({ mode: "120000", name, hash, order: name });
    } else {
      const mode = found.mode & 0o111 ? "100755" : "100644";
      entries.push({ mode, name, hash: hashOf("blob", readFileSync(full)), order: name });
    }
  }
  if (entries.length === 0) return null;
  entries.sort((a, b) => Buffer.compare(Buffer.from(a.order), Buffer.from(b.order)));
  return hashOf(
    "tree",
    Buffer.concat(
      entries.flatMap((entry) => [Buffer.from(`${entry.mode} ${entry.name}\0`), entry.hash]),
    ),
  );
}

// The hash git gives a folder as a tree, in hex, so that a stamp written by git and one computed
// here are the same text.
export function treeHash(dir) {
  return treeOf(dir)?.toString("hex") ?? null;
}

function readStamp(root) {
  const file = path.join(root, STAMP);
  if (!existsSync(file)) return null;
  let data;
  try {
    data = JSON.parse(readFileSync(file, "utf8"));
  } catch {
    throw new Error(`${STAMP} is not JSON`);
  }
  if (typeof data?.version !== "string" || !/^[0-9a-f]{40}$/.test(String(data?.tree))) {
    throw new Error(`${STAMP} does not give a version and the tree of ${TOOL_COPY}`);
  }
  return { version: data.version, tree: data.tree };
}

// The repository's copy of the tool against the installed plugin's. Content decides, not the
// version number: two folders with the same tree are the same tool.
function toolOf(root) {
  const recorded = readStamp(root);
  const installed = { version: VERSION, tree: treeHash(TOOL_SOURCE) };
  const copy = treeHash(path.join(root, TOOL_COPY));
  const noStamp = "the repository does not record which version it took";
  let says;
  if (copy === null) {
    says = recorded
      ? `the repository has a stamp for version ${recorded.version} and no copy of the tool`
      : "the repository has no copy of the tool, so there is nothing to compare (no stamp)";
  } else if (recorded && recorded.tree !== copy) {
    says = `the repository's copy was changed after it was stamped as version ${recorded.version}`;
  } else if (copy !== installed.tree) {
    says = recorded
      ? `the repository's copy is stamped as version ${recorded.version}; the installed plugin is version ${installed.version}, and its tool is another`
      : `the repository's copy differs from the installed plugin's, version ${installed.version} (no stamp: ${noStamp}, so it cannot be said where the copy came from or whether it was changed here)`;
  } else {
    says = recorded
      ? `the repository's copy is the installed plugin's, version ${installed.version}, as stamped`
      : `the repository's copy is the installed plugin's, version ${installed.version} (no stamp: ${noStamp})`;
  }
  const differs =
    copy === null
      ? recorded !== null
      : copy !== installed.tree || (recorded?.tree ?? copy) !== copy;
  return { recorded, installed, copy, differs, says };
}

const standardBasis = (decision) =>
  `a standard: this plugin's list of standard decisions names it${decision.core ? " as a core decision, one a tier cannot be reached without" : ""}`;

// What the machine recommends for a row nobody has confirmed, and what the recommendation rests on:
// a measurement taken on this repository now, or a standard. It never recommends an answer it
// cannot ground; where only a person can tell, it says so.
function recommend(row, decision) {
  if (!decision) {
    return {
      recommendation: `Read ${row.source} and confirm it, or give your own answer.`,
      basis: `${MEASURED}the row is the repository's own, beyond the standard decisions, and names ${row.check ? `${row.check}, which was not run here` : "no check"}`,
    };
  }
  if (decision.state === "bypassed") {
    return {
      recommendation: "Do not confirm it yet: the repository's own source goes around it.",
      basis: `${MEASURED}${decision.bypassed} place(s) in source go around it; the audit lists them`,
    };
  }
  if (decision.state === "failing") {
    return {
      recommendation: "Do not confirm it yet: its check does not pass.",
      basis: `${MEASURED}${decision.by}; the audit says why`,
    };
  }
  if (decision.state === "held") {
    return {
      recommendation: "Confirm it as it stands, or change it knowingly: a check holds it today.",
      basis: `${MEASURED}its check was run now and holds what the row says`,
    };
  }
  if (decision.state === "claimed") {
    return {
      recommendation: "Confirm it as it stands, knowing its check was not run here.",
      basis: `${MEASURED}the row names ${decision.by}, which can be found; it was not run again here`,
    };
  }
  if (/read from the repository/.test(row.note ?? "")) {
    return {
      recommendation: "Confirm it: it is what the repository already has.",
      basis: `${MEASURED}the answer was read from the repository and is kept in ${row.source}`,
    };
  }
  return {
    recommendation: `Read the proposal in ${row.source} and confirm it, or give your own answer: no check can make this call.`,
    basis: standardBasis(decision),
  };
}

// What waits on the owner: every row of the ledger that says nobody has confirmed it, then every
// call only a person can make that a ledger has no row for. Each is a question, never an answer.
function waitingOf(audit, rows) {
  const decisionOf = (id) => audit.decisions.find((decision) => decision.id === id);
  const proposals = rows
    .filter((row) => UNCONFIRMED.test(row.note ?? ""))
    .map((row) => {
      const decision = decisionOf(row.id);
      return {
        id: row.id,
        question: decision?.question ?? `Does the repository's own decision "${row.id}" stand?`,
        ...recommend(row, decision),
        // The guide records a person's confirmation and writes the row again without its note.
        answer: "/design-assembly:new",
      };
    });
  // A repository with no ledger has not met the plugin: nothing waits there yet.
  const inGuide = audit.next.startsWith("/design-assembly:new");
  const calls = rows.length === 0 ? [] : Object.entries(PERSON_CALLS);
  const unanswered = calls
    .map(([id, flag]) => [decisionOf(id), flag])
    .filter(([decision]) => decision && !decision.in_ledger)
    .map(([decision, flag]) => {
      const shown = decision.seen?.replace(/: a person confirms it$/, "");
      return {
        id: decision.id,
        question: decision.question,
        recommendation: "Answer it: only a person can, and the ledger has no row for it.",
        basis: shown ? `${MEASURED}${shown}` : standardBasis(decision),
        answer: inGuide ? "/design-assembly:new" : `/design-assembly:adopt ${flag}`,
      };
    });
  return [...proposals, ...unanswered];
}

const RHYTHMS = [
  ["start", "the repository is born"],
  ["adopt", "the repository meets the plugin"],
  ["intake", "a feature needs a new block"],
  ["change", "every change"],
  ["periodic", "periodically, and before handing over"],
];
const VALUES = {
  generated: "the guide chose the values, and the stylesheet carries them",
  own: "the repository brought a primary color role of its own, so the guide is not for it",
  default: "no values chosen: the primary color role is still a grey default",
  none: "no stylesheet that declares color roles",
};

// One line per rhythm of a repository's life, each read from the repository as it is now.
function rhythmsOf(audit, broken) {
  const c = audit.coverage;
  const l = audit.ledger;
  const shaped = audit.contract.filter((item) => item.differs.length === 0).length;
  const d = audit.departures;
  const departed = d.lint + d.excused + d.left;
  const slips =
    audit.slips === null
      ? "no record of what slipped past the checks"
      : audit.slips.count === 0
        ? `${SLIPS_FILE}: no line yet`
        : `${SLIPS_FILE}: ${audit.slips.count} line(s)${audit.slips.latest ? `, the latest on ${audit.slips.latest}` : ""}`;
  const says = {
    start: VALUES[audit.values],
    adopt: l
      ? `${l.total} row(s) in the ledger; ${c.answered} of ${c.core} core decisions answered (${c.held} held and re-run here, ${c.claimed} claimed and not re-run, ${c.recorded} recorded)`
      : "no ledger: nothing is recorded yet",
    intake: "not built in this version of the plugin: nothing records which need got which block",
    change: l
      ? `${l.automatic} of ${l.total} row(s) name a check that can be found; ${broken.length} failing or bypassed; ${shaped} of ${audit.contract.length} ledger file(s) have the one shape of the contract`
      : "no check that this plugin can see in the gate",
    periodic: `${slips}${departed > 0 ? `; ${departed} departure(s) on purpose` : ""}`,
  };
  return RHYTHMS.map(([id, name]) => ({ id, name, says: says[id] }));
}

// The commands to run next, in order: what is broken first, then what answers the owner, then what
// the audit decides from the files. Only commands this plugin has.
function nextOf(audit, waiting, broken) {
  const next = [];
  if (broken.length > 0) {
    next.push({
      command: AUDIT,
      why: `${broken.length} decision(s) failing or bypassed (${broken
        .slice(0, SHOWN)
        .map((decision) => decision.id)
        .join(", ")}${broken.length > SHOWN ? ", ..." : ""}): the audit lists the places`,
    });
  }
  const commands = [...new Set(waiting.map((item) => item.answer.split(" ")[0]))];
  for (const command of commands) {
    const mine = waiting.filter((item) => item.answer.split(" ")[0] === command);
    next.push({
      command,
      why: `${mine.length} answer(s) wait on the owner (${mine.map((item) => item.id).join(", ")})`,
    });
  }
  // The audit's last line names a command when the scripts have something left to do.
  const named = /^(\/design-assembly:[a-z-]+),? (.*)$/.exec(audit.next);
  if (named && !next.some((step) => step.command === named[1])) {
    next.push({ command: named[1], why: named[2] });
  }
  return next;
}

export function status(root) {
  const audit = inventory(root);
  const rows = readLedger(root) ?? [];
  const broken = audit.decisions.filter((d) => ["failing", "bypassed"].includes(d.state));
  const waiting = waitingOf(audit, rows);
  return {
    tier: audit.tier,
    // Core decisions only, as the audit counts them. Two numbers: a claim was not run again here.
    held: audit.coverage.held,
    claimed: audit.coverage.claimed,
    rhythms: rhythmsOf(audit, broken),
    waiting,
    tool: toolOf(root),
    next: nextOf(audit, waiting, broken),
  };
}

const TIER_NOTE = {
  reached: "reached",
  claimed: "claimed: complete, but it rests on checks that were not re-run here",
};

export function report(result) {
  const { tier, waiting, tool, next } = result;
  const above = tier.next ? `Next tier: ${tier.next}` : "No tier is above it";
  const lines = [
    tier.id
      ? `tier: ${tier.id}, ${TIER_NOTE[tier.state]}. ${above}`
      : `tier: none reached. ${above}`,
    `  core decisions: ${result.held} held and re-run here, ${result.claimed} claimed and not re-run`,
    "",
    "rhythms:",
    ...result.rhythms.map((rhythm) => `  ${rhythm.name}: ${rhythm.says}`),
    "",
  ];
  if (waiting.length === 0) lines.push("waiting on the owner: nothing in the ledgers");
  else {
    lines.push(`waiting on the owner: ${waiting.length}`);
    waiting.slice(0, SHOWN).forEach((item, index) => {
      lines.push(
        `  ${index + 1}. ${item.id}: ${item.question}`,
        `     recommendation: ${item.recommendation}`,
        `     because: ${item.basis}`,
        `     answer with: ${item.answer}`,
      );
    });
    if (waiting.length > SHOWN) {
      const rest = waiting.slice(SHOWN).map((item) => item.id);
      lines.push(`  and ${rest.length} more, listed with --json: ${rest.join(", ")}`);
    }
  }
  lines.push("", `tool: ${tool.says}`);
  if (tool.differs) {
    lines.push(
      "  no command of this version brings the installed tool into a repository (limit adopt-does-not-refresh-tool)",
    );
  }
  // Where this report is blind, so that "nothing waits" does not read as more than it is.
  const blind = LIMITS.filter((limit) => limit.area === "status" && limit.status === "open");
  lines.push(
    `status does not see: ${blind.map((limit) => limit.id).join(", ")} (${LIMITS_FILE})`,
    "",
  );
  if (next.length === 0) lines.push("next: nothing to run now");
  next.forEach((step, index) => {
    lines.push(`${index === 0 ? "next:" : "then:"} ${step.command}, ${step.why}`);
  });
  return `${lines.join("\n")}\n`;
}

const USAGE = "usage: node status.mjs [--target DIR] [--json]\n";

// Something is left when an answer waits on a person, when the tool differs, or when a check
// fails or source goes around a decision: `next` then starts with the audit.
export const leavesWork = (result) =>
  result.waiting.length > 0 ||
  result.tool.differs ||
  result.next.some((step) => step.command === AUDIT);

function main(args) {
  const call = readCall(args);
  if (call.problem) return refuse(call.problem, USAGE);
  if (call.help) return void stdout.write(USAGE);
  const result = status(call.target);
  return finish({ json: call.json, result, text: report(result), work: leavesWork(result) });
}

await start(import.meta.url, main);
