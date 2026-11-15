// The status: what the owner of a repository asks at any moment. Which tier the repository has
// reached, one line per rhythm of its life, what waits on the owner with a recommendation for each,
// whether the repository's copy of the tool is the installed plugin's, and the command to run next.
// Read-only: it writes nothing in the repository. The same repository always gives the same answer.
// With --out it also hands the answer over as a document, the status report, written to that
// folder and nowhere else.
// Usage: node status.mjs [--target DIR] [--json] [--out DIR [--format html|pdf]]
// Exit: 0 nothing waits; 1 something waits on a person, the tool differs, or a decision is failing
// or gone around, or the document was written in fewer formats than asked; 2 a wrong call, or a
// repository that cannot be read.
import { Buffer } from "node:buffer";
import { createHash } from "node:crypto";
import { existsSync, lstatSync, readdirSync, readFileSync, readlinkSync, statSync } from "node:fs";
import path from "node:path";
import { stdout } from "node:process";
import { fileURLToPath } from "node:url";

import { SLIPS_FILE } from "../templates/tools/design-assembly/governance.mjs";
import { readLedger, TOOL } from "../templates/tools/design-assembly/ledger.mjs";
import { finish, readCall, refuse, start } from "./command.mjs";
import { sheet, WAITING_LIST } from "./decide.mjs";
import { DOCUMENT_FLAGS, handOver, plural, requested } from "./document.mjs";
import { AUDIT, DECIDE, inventory, PERSON_CALLS, UNCONFIRMED } from "./inventory.mjs";

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

// What waits on the owner in the ledgers: every row that says nobody has confirmed it, then every
// call only a person can make that a ledger has no row for. Each is a question, never an answer.
function waitingOf(audit, rows) {
  const decisionOf = (id) => audit.decisions.find((decision) => decision.id === id);
  const proposals = rows
    .filter((row) => UNCONFIRMED.test(row.note ?? ""))
    .map((row) => {
      const decision = decisionOf(row.id);
      return {
        id: row.id,
        source: "ledger",
        question: decision?.question ?? `Does the repository's own decision "${row.id}" stand?`,
        ...recommend(row, decision),
        // The decision sheet writes a person's answer into the row, with their name and the date.
        answer: DECIDE,
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
        source: "ledger",
        question: decision.question,
        recommendation: "Answer it: only a person can, and the ledger has no row for it.",
        basis: shown ? `${MEASURED}${shown}` : standardBasis(decision),
        answer: inGuide ? "/design-assembly:new" : `/design-assembly:adopt ${flag}`,
      };
    });
  return [...proposals, ...unanswered];
}

// A question of the waiting list that waits, as status lists it. What the list says for it is
// read off the repository, and is given as that: a list that grounds nothing is said to.
const fromList = (item) => ({
  id: item.id,
  source: "waiting-list",
  question: item.question,
  recommendation: item.recommendation,
  basis: `${MEASURED}${
    item.basis
      ? `the waiting list, ${WAITING_LIST}, gives this ground: ${item.basis}`
      : `the waiting list, ${WAITING_LIST}, gives no ground for it`
  }`,
  answer: DECIDE,
});

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
      why: `${plural(broken.length, "decision is", "decisions are")} failing or bypassed (${broken
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
      why: `${plural(mine.length, "answer waits", "answers wait")} on the owner (${mine
        .slice(0, SHOWN)
        .map((item) => item.id)
        .join(", ")}${mine.length > SHOWN ? ", ..." : ""})`,
    });
  }
  // The audit's last line names a command when the scripts have something left to do.
  const named = /^(\/design-assembly:[a-z-]+),? (.*)$/.exec(audit.next);
  if (named && !next.some((step) => step.command === named[1])) {
    next.push({ command: named[1], why: named[2] });
  }
  return next;
}

// Everything status reads from the ledgers, read once.
function readLedgers(root) {
  const audit = inventory(root);
  const rows = readLedger(root) ?? [];
  const broken = audit.decisions.filter((d) => ["failing", "bypassed"].includes(d.state));
  return { audit, broken, waiting: waitingOf(audit, rows), tool: toolOf(root) };
}

function resultOf({ audit, broken, tool }, waiting) {
  return {
    tier: audit.tier,
    // Core decisions only, as the audit counts them. Two numbers: a claim was not run again here.
    held: audit.coverage.held,
    claimed: audit.coverage.claimed,
    rhythms: rhythmsOf(audit, broken),
    waiting,
    tool,
    next: nextOf(audit, waiting, broken),
  };
}

// The reading `fullStatus` holds while it asks the decision sheet what waits in the waiting list:
// the sheet asks for this very reading, and gets it back instead of a second run of every check.
let reading = null;

// The status as the ledgers alone give it, before the waiting list is read. The decision sheet is
// built on this reading, under this name, and reads the waiting list for itself; the command and
// its document give `fullStatus`.
export function status(root) {
  if (reading?.root === root) return reading.result;
  const read = readLedgers(root);
  return resultOf(read, read.waiting);
}

// The whole status: what the ledgers say, and every question of the waiting list that nobody has
// answered. Which row of the list waits is the decision sheet's rule, asked of it and not written
// here a second time: a permission and an answered row do not wait.
export function fullStatus(root) {
  const read = readLedgers(root);
  reading = { root, result: resultOf(read, read.waiting) };
  let listed;
  try {
    listed = sheet(root).questions.filter((item) => item.source === "waiting-list");
  } finally {
    reading = null;
  }
  return resultOf(read, [...read.waiting, ...listed.map(fromList)]);
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
  if (waiting.length === 0) {
    lines.push("waiting on the owner: nothing in the ledgers or the waiting list");
  } else {
    const listed = waiting.filter((item) => item.source === "waiting-list").length;
    lines.push(
      `waiting on the owner: ${waiting.length}${listed > 0 ? ` (${waiting.length - listed} in the ledgers, ${listed} in the waiting list)` : ""}`,
    );
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

// The status report: the same answer as a document on the frame every document shares, made from
// the facts of the answer and from nothing else. `origin` says which state of the repository it is
// made from. What the screen cuts short the report cuts short too, and says where the rest is.
export function documentOf(result, origin) {
  const { tier, waiting, tool, next } = result;
  const broken = next.find((step) => step.command === AUDIT) ?? null;
  const listed = waiting.filter((item) => item.source === "waiting-list");
  const answers = plural(waiting.length, "answer waits", "answers wait");
  const where =
    listed.length > 0
      ? `${waiting.length - listed.length} in the ledgers, ${listed.length} in the waiting list`
      : "all of them in the ledgers";
  const reached = tier.id
    ? `The repository has reached the tier ${tier.id}${tier.state === "claimed" ? ", on checks that were not run again here" : ""}`
    : "The repository has reached no tier yet";
  const left = broken
    ? ", and a decision is failing or gone around"
    : tool.differs
      ? ", and its copy of the tool is not the installed plugin's"
      : "";
  const claimedTier = tier.state === "claimed";

  // Everything worth a person's attention, the heaviest first; the page shows the first three.
  const attention = [
    broken && {
      title: "A decision is failing, or source goes around one",
      detail: "It is work to fix, not a question to answer. The audit lists each place.",
    },
    waiting.length > 0 && {
      title: `${answers} on the owner`,
      detail: `${where}. A proposal is not an answer until a person gives it.`,
    },
    tool.differs && {
      title: "The repository's copy of the tool is not the installed plugin's",
      detail: tool.says,
    },
    claimedTier && {
      title: `The tier ${tier.id} rests on checks nothing here ran again`,
      detail: `${result.held} core decisions were run again here; ${result.claimed} are claimed.`,
    },
    tier.next && {
      title: `The next tier is ${tier.next}`,
      detail: "The audit says what it still lacks.",
    },
  ].filter(Boolean);

  // What the person must decide, by the command that takes the answer. The first questions are
  // written out, as on the screen; the rest are named.
  const shown = waiting.slice(0, SHOWN);
  const commands = [...new Set(waiting.map((item) => item.answer.split(" ")[0]))];
  const decide = commands.map((command) => {
    const mine = waiting.filter((item) => item.answer.split(" ")[0] === command);
    const rest = mine.filter((item) => !shown.includes(item));
    return {
      what: `Answer ${plural(mine.length, "question", "questions")}`,
      items: mine
        .filter((item) => shown.includes(item))
        .map((item) => `${item.id}: ${item.question}`),
      more:
        rest.length > 0
          ? `and ${rest.length} more, each on the decision sheet: ${rest.map((item) => item.id).join(", ")}`
          : null,
      command,
    };
  });

  const findings = [
    broken && {
      severity: "high",
      title: "A decision is failing, or source goes around one",
      detail:
        "A check of the gate fails, or the repository's own source writes a value around a decision. Nothing here waits on an answer.",
      evidence: [broken.why],
    },
    tool.differs && {
      severity: "medium",
      title: "The repository's copy of the tool is not the installed plugin's",
      detail: "The gate of the repository runs its own copy, whatever the plugin has since become.",
      evidence: [
        tool.says,
        `the repository's copy, as a tree: ${tool.copy ?? "none"}`,
        `the installed plugin's, version ${tool.installed.version}: ${tool.installed.tree}`,
      ],
    },
    waiting.length > 0 && {
      severity: "medium",
      title: `${answers} on the owner`,
      detail:
        "Each is a question with a recommendation, never an answer: nothing is decided until a person says so.",
      evidence: commands.map((command) => {
        const mine = waiting.filter((item) => item.answer.split(" ")[0] === command);
        return `answered with ${command}: ${mine.map((item) => item.id).join(", ")}`;
      }),
    },
    !tool.differs && {
      severity: "note",
      title: "The repository's copy of the tool",
      evidence: [tool.says],
    },
    claimedTier && {
      severity: "low",
      title: `The tier ${tier.id} rests on checks nothing here ran again`,
      detail: "A claim names a check that can be found. It was not run for this report.",
      evidence: [
        `${result.held} core decisions held and run again here`,
        `${result.claimed} core decisions claimed and not run again`,
      ],
    },
  ].filter(Boolean);

  // A basis is written "what it rests on: the fact". The two kinds status ever gives.
  const basisOf = (line) =>
    line.startsWith(MEASURED)
      ? { kind: "measurement", text: line.slice(MEASURED.length) }
      : { kind: "standard", text: line.replace(/^a standard: /, "") };
  const recommendations = [
    broken && {
      what: "Fix what is failing or gone around before anything is confirmed",
      basis: { kind: "measurement", text: broken.why },
      action: "Run the audit: it names each decision and each place.",
      command: AUDIT,
    },
    tool.differs && {
      what: "Leave the repository's copy of the tool as it is for now",
      basis: { kind: "measurement", text: tool.says },
      action:
        "Nothing to run: no command of this version brings the installed tool into a repository (limit adopt-does-not-refresh-tool). Do not copy its files by hand unless you mean to.",
    },
    ...shown.map((item) => ({
      about: `${item.id}: ${item.question}`,
      what: item.recommendation,
      basis: basisOf(item.basis),
      action: "Give your answer; the recommendation is not one.",
      command: item.answer,
    })),
  ].filter(Boolean);
  const unshown = waiting.slice(SHOWN).map((item) => item.id);

  const blind = LIMITS.filter(
    (limit) => ["status", "document"].includes(limit.area) && limit.status === "open",
  );
  return {
    kind: "status-report",
    title: "Status report",
    lede: "Where the design system of this repository stands, what waits on its owner, and what to run next.",
    origin,
    version: VERSION,
    scope: [
      "The ledgers of the design system, read as the audit reads them",
      `The waiting list, ${WAITING_LIST}, when the repository keeps one`,
      `The repository's copy of the tool, ${TOOL_COPY}, against the installed plugin's`,
      `The tool stamp, ${STAMP}: ${tool.recorded ? `version ${tool.recorded.version}` : "none in this repository"}`,
    ],
    decision: {
      conclusion: `${reached}; ${waiting.length === 0 ? "nothing waits on its owner" : `${answers} on its owner`}${left}.`,
      figures: [
        { value: String(waiting.length), label: "answers wait on the owner" },
        { value: String(result.held), label: "core decisions held, and run again here" },
        { value: String(result.claimed), label: "core decisions claimed, and not run again" },
      ],
      attention: attention.slice(0, 3),
      decide,
    },
    findings,
    register: {
      title: "Each rhythm of the repository's life, as read now",
      columns: ["Rhythm", "What the repository says"],
      rows: result.rhythms.map((rhythm) => [rhythm.name, rhythm.says]),
    },
    recommendations,
    next: next.map((step) => ({ command: step.command, why: step.why })),
    blind: blind.map(({ id, note }) => ({ id, note })),
    after: {
      recommendations:
        unshown.length > 0
          ? `${plural(unshown.length, "more question has", "more questions have")} a recommendation of their own, on the decision sheet (${DECIDE}) and with --json: ${unshown.join(", ")}.`
          : null,
    },
  };
}

const USAGE = "usage: node status.mjs [--target DIR] [--json] [--out DIR [--format html|pdf]]\n";

// Something is left when an answer waits on a person, when the tool differs, or when a check
// fails or source goes around a decision: `next` then starts with the audit.
export const leavesWork = (result) =>
  result.waiting.length > 0 ||
  result.tool.differs ||
  result.next.some((step) => step.command === AUDIT);

async function main(args) {
  const call = readCall(args, DOCUMENT_FLAGS);
  if (call.problem) return refuse(call.problem, USAGE);
  if (call.help) return void stdout.write(USAGE);
  // A wrong call for a document is refused before anything is read.
  const asked = requested(call);
  const result = fullStatus(call.target);
  const handed = await handOver(asked, call.target, (origin) => documentOf(result, origin));
  return finish({
    json: call.json,
    result: { ...result, ...handed.data },
    text: `${report(result)}${handed.text}`,
    work: leavesWork(result) || handed.work,
  });
}

await start(import.meta.url, main);
