// Upgrade: brings the installed plugin's tool into a repository that already runs a copy of it.
// Before it writes anything it says, every time: which tool files change; which ledgers the tool
// writes would be written again differently, entry by entry (added, removed, changed); which
// decisions change state; and whether the design-assembly step of the repository's gate would be
// green or red afterwards. It writes the tool folder, the tool stamp, the gate step beside them and
// those machine-written ledgers, and nothing else: never a ledger row a person wrote, the
// stylesheet, the Makefile, or a tool of the repository's own. When upgrading would lose an entry from a ledger, or leave the gate red, it
// writes nothing and ends with 1, unless the person said they accept exactly that.
// Usage: node upgrade.mjs [--target DIR] [--dry-run] [--json] [--accept-lost-entries]
//                         [--accept-red-gate] [--out DIR [--format html|pdf]]
// Exit: 0 already on the installed tool, or upgraded (or, previewed, safe to upgrade); 1 it stopped
// because an entry would be lost or the gate would be red, and waits on a person; 2 a wrong call, a
// repository with no copy of the tool, or one that cannot be read.
import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import path from "node:path";
import { stdout } from "node:process";
import { fileURLToPath, pathToFileURL } from "node:url";

import { gateProblems, ledgerView, readState } from "../templates/tools/design-assembly/check.mjs";
import { regenerated as columnsNow } from "../templates/tools/design-assembly/columns.mjs";
import { regenerated as componentsNow } from "../templates/tools/design-assembly/components.mjs";
import { newerLedgers } from "../templates/tools/design-assembly/contract.mjs";
import { keptOutOfGit } from "../templates/tools/design-assembly/derived.mjs";
import { GATE_STEP } from "../templates/tools/design-assembly/host-make.mjs";
import { TAKEN_DOWN_CHECK } from "../templates/tools/design-assembly/check.mjs";
import { CHOOSE_FIRST_CHECK } from "../templates/tools/design-assembly/choose-first.mjs";
import { INTAKE_LEDGER } from "../templates/tools/design-assembly/intake-ledger.mjs";
import { lineWidth, renderJson } from "../templates/tools/design-assembly/json.mjs";
import { regenerated as tokensNow } from "../templates/tools/design-assembly/tokens.mjs";
import { sameContent } from "./apply.mjs";
import { fileChange, finish, readCall, Refusal, refuse, start } from "./command.mjs";
import { DOCUMENT_FLAGS, handOver, plural, requested } from "./document.mjs";
import {
  installedTree,
  readStamp,
  releaseOf,
  STAMP,
  stampText,
  TOOL_COPY,
  TOOL_SOURCE,
  treeHash,
  VERSION,
} from "./stamp.mjs";

const PLUGIN = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const LIMITS = JSON.parse(readFileSync(path.join(PLUGIN, "references/limits.json"), "utf8")).limits;
const LIMITS_FILE = "references/limits.json of this plugin";
const UPGRADE = "/design-assembly:upgrade";
const THEME = "design/theme.json";
// What each check an upgrade adds under a row turns the gate red for, as the preview says it.
const ADDED_CHECKS = {
  [TAKEN_DOWN_CHECK.kind]: "when the code uses an item of an outside source not taken in",
  [CHOOSE_FIRST_CHECK.kind]:
    "when a branch adds a component file with no row of the intake ledger, or a row made by hand without the words searched and the nearest candidate",
};
// The gate step the plugin installs beside the tool: upgrade writes it too, whole, when it differs.
const GATE_SOURCE = path.join(PLUGIN, "templates", GATE_STEP);

// What the person passes to say they accept what the preview showed. Never passed for them.
export const ACCEPT = { lost: "--accept-lost-entries", red: "--accept-red-gate" };

// The ledgers the tool writes, by their name in the contract, each asked of the installed tool.
const WRITERS = [
  ["tokens", tokensNow],
  ["components", componentsNow],
  ["columns", columnsNow],
];
// How many entries of one kind a person is shown for one ledger. --json has them all.
const SHOWN = 8;

// ---- entries of a ledger ------------------------------------------------------------------------

const scalar = (value) => value === null || typeof value !== "object";
// The field a record of a list is known by, when it has one.
const keyed = (item) =>
  item && typeof item === "object" && !Array.isArray(item)
    ? (["name", "id", "file"].find((key) => typeof item[key] === "string") ?? null)
    : null;

// A ledger as entries, each a key a person can read and the value it holds. A token (an object
// with `$value`) is one entry; a list of words is one entry per word; a list of records is read
// record by record, by name; anything else is followed down to its values. So a relation lost
// from a component, one name in its list of parts, is one entry removed.
export function entriesOf(data, at = "", into = new Map(), skip = null) {
  if (scalar(data)) {
    into.set(at, JSON.stringify(data));
    return into;
  }
  if (Array.isArray(data)) {
    if (data.every(scalar)) {
      for (const item of data) into.set(`${at}[${String(item)}]`, "true");
      if (data.length === 0) into.set(at, "[]");
      return into;
    }
    data.forEach((item, index) => {
      const field = keyed(item);
      entriesOf(item, `${at}[${field ? item[field] : index}]`, into, field);
    });
    return into;
  }
  if ("$value" in data) {
    into.set(at, JSON.stringify(data));
    return into;
  }
  // A record read by its name does not hold its name a second time.
  const keys = Object.keys(data).filter((key) => key !== skip);
  if (keys.length === 0) into.set(at, "{}");
  for (const key of keys) entriesOf(data[key], at === "" ? key : `${at}.${key}`, into);
  return into;
}

// The entries one version of a ledger has that the other has not, and those that hold another
// value, each list in the order of the key.
export function ledgerChanges(before, after) {
  const was = entriesOf(before ?? {});
  const now = entriesOf(after ?? {});
  const sorted = (list) => list.sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));
  return {
    added: sorted([...now.keys()].filter((key) => !was.has(key))),
    removed: sorted([...was.keys()].filter((key) => !now.has(key))),
    changed: sorted([...now.keys()].filter((key) => was.has(key) && was.get(key) !== now.get(key))),
  };
}

// ---- the tool folder ----------------------------------------------------------------------------

// Every file of a folder, by its path below it, without names that start with a dot: what the tree
// of the stamp is made of.
function filesOf(dir, at = "") {
  const full = path.join(dir, at);
  if (!existsSync(full)) return [];
  return readdirSync(full)
    .filter((name) => !name.startsWith("."))
    .sort()
    .flatMap((name) => {
      const relative = at === "" ? name : `${at}/${name}`;
      return statSync(path.join(dir, relative)).isDirectory() ? filesOf(dir, relative) : [relative];
    });
}

// The files of the repository's copy that the installed tool writes, changes or no longer has.
function toolChanges(root) {
  const copy = path.join(root, TOOL_COPY);
  const mine = filesOf(TOOL_SOURCE);
  const theirs = new Set(filesOf(copy));
  const changes = mine
    .map((file) => {
      if (!theirs.has(file)) return { file, change: "create" };
      const same = readFileSync(path.join(TOOL_SOURCE, file)).equals(
        readFileSync(path.join(copy, file)),
      );
      return same ? null : { file, change: "update" };
    })
    .filter(Boolean);
  const gone = [...theirs].filter((file) => !mine.includes(file));
  return [...changes, ...gone.map((file) => ({ file, change: "delete" }))]
    .map(({ file, change }) => fileChange(`${TOOL_COPY}/${file}`, change))
    .sort((a, b) => (a.path < b.path ? -1 : 1));
}

// ---- what the decisions say, before and after ---------------------------------------------------

// A message of a thrown error as one line that does not carry where the repository sits.
const said = (root, error) =>
  String(error?.message ?? error)
    .split("\n")[0]
    .replaceAll(root, ".");

// How each row of the ledger is held under the repository's own copy of the tool, as it runs in its
// gate today; or why that cannot be said. The copy is the repository's code, run as its gate runs it.
async function before(root) {
  try {
    const tool = await import(pathToFileURL(path.join(root, TOOL_COPY, "check.mjs")).href);
    if (typeof tool.readState !== "function" || typeof tool.ledgerView !== "function") {
      return {
        view: null,
        why: "the repository's copy of the tool does not say how each row is held",
      };
    }
    const state = tool.readState(root);
    if (state.theme === null || state.ledger === null) {
      return { view: null, why: `${THEME} or the ledger is missing` };
    }
    return { view: tool.ledgerView(state) };
  } catch (error) {
    return {
      view: null,
      why: `the repository's copy of the tool could not be run: ${said(root, error)}`,
    };
  }
}

// The same under the installed tool, on the repository as the upgrade would leave it: its files as
// they are, with the ledgers the tool writes and the gate step as it would write them. And the step
// of the gate.
function after(root, written) {
  const state = readState(root);
  state.files = { ...state.files, ...written };
  if (THEME in written) state.theme = JSON.parse(written[THEME]);
  if (GATE_STEP in written) state.gate = written[GATE_STEP];
  if (state.theme === null || state.ledger === null) {
    const missing = `${THEME} or the ledger is missing, so the gate step of this tool fails`;
    return { view: null, gate: { green: false, problems: [missing] } };
  }
  const { problems } = gateProblems(state);
  return {
    view: ledgerView(state),
    gate: {
      green: problems.length === 0,
      problems: problems.map((line) => line.replaceAll(root, ".")),
    },
  };
}

function changedStates(was, now) {
  if (!was || !now) return [];
  const old = new Map(was.map((row) => [row.id, row.state]));
  const next = new Map(now.map((row) => [row.id, row.state]));
  const ids = [...new Set([...old.keys(), ...next.keys()])];
  return ids
    .filter((id) => old.get(id) !== next.get(id))
    .map((id) => ({ id, from: old.get(id) ?? "no row", to: next.get(id) ?? "no row" }));
}

// ---- the plan -----------------------------------------------------------------------------------

const read = (root, file) =>
  existsSync(path.join(root, file)) ? readFileSync(path.join(root, file), "utf8") : null;

// A ledger as data, or null when it is missing or is not JSON: then every entry written is new.
function parsed(text) {
  if (text === null) return null;
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

// The lines of `before` that `after` does not have, blank lines and comments left out, in order.
export function droppedLines(before, after) {
  if (before === null) return [];
  const kept = new Set(after.split("\n").map((line) => line.trimEnd()));
  return before
    .split("\n")
    .map((line) => line.trimEnd())
    .filter((line) => line.trim() !== "" && !line.trim().startsWith("#") && !kept.has(line));
}

// Everything the upgrade of the repository at `root` would do, and what stops it. Nothing written.
export async function upgradePlan(root, accept = {}) {
  // Read first, whatever comes next: a repository that cannot be read is said to be so.
  const themeText = read(root, THEME);
  if (themeText !== null) {
    try {
      JSON.parse(themeText);
    } catch {
      throw new Error(`${THEME} is not JSON`);
    }
  }
  const tree = treeHash(path.join(root, TOOL_COPY));
  if (tree === null) {
    throw new Refusal(
      `the repository has no copy of the tool in ${TOOL_COPY}, so there is nothing to upgrade: adopt it first (/design-assembly:adopt), or run the guide (/design-assembly:new)`,
    );
  }
  const newer = newerLedgers(root);
  if (newer.length > 0) throw new Refusal(`${newer.join("; ")}. Nothing was written`);
  const stamp = readStamp(root);
  const from = {
    version: stamp?.version ?? releaseOf(tree),
    tree,
    stamp,
    edited: stamp ? stamp.tree !== tree : null,
  };
  const to = { version: VERSION, tree: installedTree() };
  const tool = toolChanges(root);
  const stamped = stamp?.version === to.version && stamp?.tree === to.tree;
  // The gate step is the plugin's whole: one that is not the installed plugin's is written again.
  const gateStep = read(root, GATE_STEP);
  const installedStep = readFileSync(GATE_SOURCE, "utf8");
  // Upgrade cannot tell a hand edit from an older plugin's step: it names every line of the
  // repository's step the installed one does not have, so a person sees what goes.
  const gateChange =
    gateStep === installedStep
      ? null
      : {
          ...fileChange(GATE_STEP, gateStep === null ? "create" : "update"),
          dropped: droppedLines(gateStep, installedStep),
        };

  // The ledgers are written again only when the tool changes: on the installed tool, a ledger
  // that is out of date is the gate's to say.
  const ledgers = [];
  const written = {};
  // A file the repository keeps out of git is derived and no person's: it is written again, and
  // nothing in it can be lost. On a clean checkout it is not there at all.
  const outOfGit = themeText === null ? [] : keptOutOfGit(JSON.parse(themeText));
  if (tool.length > 0) {
    for (const [ledger, writer] of WRITERS) {
      const made = writer(root);
      if (!made) continue;
      if (made.problem) {
        ledgers.push({
          ledger,
          file: made.file,
          added: [],
          removed: [],
          changed: [],
          problem: made.problem,
        });
        continue;
      }
      const text = read(root, made.file);
      if (text !== null && sameContent(made.file, text, made.content)) continue;
      const changes = ledgerChanges(parsed(text), made.data);
      ledgers.push(
        outOfGit.includes(made.file)
          ? { ledger, file: made.file, ...changes, removed: [], derived: true }
          : { ledger, file: made.file, ...changes },
      );
      written[made.file] = made.content;
    }
  }
  if (gateChange) written[GATE_STEP] = installedStep;
  // A check a newer tool holds under a row the repository already has, and the tool data lacks:
  // under ledger-shapes, the check of items taken down and the check that holds the choice, which
  // reads the intake ledger the row's other checks name. Said before it is written.
  const theme = themeText === null ? null : JSON.parse(themeText);
  const shapes = theme?.checks?.["ledger-shapes"];
  const intakeFile = Array.isArray(shapes)
    ? shapes.map((check) => check?.ledgers?.intake ?? check?.intake).find(Boolean)
    : undefined;
  const missing = Array.isArray(shapes)
    ? [
        TAKEN_DOWN_CHECK,
        {
          ...CHOOSE_FIRST_CHECK,
          ...(intakeFile && intakeFile !== INTAKE_LEDGER ? { intake: intakeFile } : {}),
        },
      ].filter((added) => !shapes.some((check) => check?.kind === added.kind))
    : [];
  const checksAdded = missing.map((added) => ({ row: "ledger-shapes", kind: added.kind }));
  if (checksAdded.length > 0) {
    const checks = { ...theme.checks, "ledger-shapes": [...shapes, ...missing] };
    written[THEME] = renderJson({ ...theme, checks }, lineWidth(root));
  }
  const was = tool.length > 0 ? await before(root) : { view: null };
  const now = after(root, written);
  const decisions = changedStates(was.view, now.view);
  const unseen = tool.length > 0 && was.view === null ? [was.why] : [];

  const lost = ledgers.filter((ledger) => ledger.removed.length > 0);
  const losing = lost.reduce((sum, ledger) => sum + ledger.removed.length, 0);
  const changes = tool.length > 0 || !stamped || gateChange !== null || checksAdded.length > 0;
  const blocked = [];
  const accepted = [];
  if (changes && losing > 0) {
    if (accept.lost) accepted.push(ACCEPT.lost);
    else {
      blocked.push({
        why: `writing the ledgers again would lose ${plural(losing, "entry", "entries")} from ${lost.map((ledger) => ledger.file).join(", ")}`,
        accept: ACCEPT.lost,
      });
    }
  }
  if (changes && !now.gate.green) {
    if (accept.red) accepted.push(ACCEPT.red);
    else {
      blocked.push({
        why: `the gate would be red after upgrading: ${now.gate.problems[0]}${now.gate.problems.length > 1 ? `; and ${now.gate.problems.length - 1} more` : ""}`,
        accept: ACCEPT.red,
      });
    }
  }
  const files =
    blocked.length > 0
      ? []
      : [
          ...tool,
          ...Object.keys(written).map((file) =>
            fileChange(file, read(root, file) === null ? "create" : "update"),
          ),
          ...(stamped ? [] : [fileChange(STAMP, stamp === null ? "create" : "update")]),
        ];
  return {
    from,
    to,
    tool_files: tool,
    ledgers,
    decisions,
    gate: now.gate,
    blocked,
    accepted,
    gate_step: gateChange,
    checks_added: checksAdded,
    not_seen: unseen,
    files,
    written,
  };
}

// Writes what the plan says, and nothing else.
function write(root, plan) {
  for (const file of plan.files) {
    const full = path.join(root, file.path);
    if (file.change === "delete") {
      rmSync(full);
      continue;
    }
    mkdirSync(path.dirname(full), { recursive: true });
    if (file.path === STAMP) writeFileSync(full, stampText());
    else if (file.path.startsWith(`${TOOL_COPY}/`)) {
      writeFileSync(
        full,
        readFileSync(path.join(TOOL_SOURCE, file.path.slice(TOOL_COPY.length + 1))),
      );
    } else writeFileSync(full, plan.written[file.path]);
  }
}

// ---- for a person -------------------------------------------------------------------------------

const fromText = ({ version, stamp, edited }) => {
  if (stamp) {
    return `version ${version}, as stamped${edited ? "; the copy was changed after it was stamped" : ""}`;
  }
  return version
    ? `version ${version} by its content (no stamp)`
    : "an unknown version (no stamp): compared by content";
};

function listed(lines, label, keys) {
  if (keys.length === 0) return;
  for (const key of keys.slice(0, SHOWN)) lines.push(`    ${label} ${key}`);
  if (keys.length > SHOWN)
    lines.push(`    and ${keys.length - SHOWN} more ${label}, listed with --json`);
}

export function report(plan, dryRun) {
  const lines = [`from: ${fromText(plan.from)}`, `to: version ${plan.to.version}`];
  if (plan.tool_files.length === 0) {
    lines.push("", "tool: the repository's copy is already the installed plugin's tool");
  } else {
    lines.push("", `tool files: ${plan.tool_files.length}`);
    for (const file of plan.tool_files) lines.push(`  ${file.change.padEnd(9)} ${file.path}`);
    lines.push("", "ledgers the tool writes, written again by the installed tool:");
    if (plan.ledgers.length === 0) lines.push("  none would differ");
    for (const ledger of plan.ledgers) {
      if (ledger.problem) {
        lines.push(`  ${ledger.file}: cannot be written: ${ledger.problem}`);
        continue;
      }
      if (ledger.derived) {
        lines.push(
          `  ${ledger.file}: kept out of git: nothing in it is a person's, so it is written again from the source`,
        );
        continue;
      }
      const { added, removed, changed } = ledger;
      lines.push(
        `  ${ledger.file}: ${added.length} added, ${removed.length} removed, ${changed.length} changed${added.length + removed.length + changed.length === 0 ? " (only the order or the layout differs)" : ""}`,
      );
      listed(lines, "removed", removed);
      listed(lines, "added", added);
      listed(lines, "changed", changed);
    }
    lines.push("", "decisions that change state:");
    if (plan.not_seen.length > 0) lines.push(`  cannot be said: ${plan.not_seen.join("; ")}`);
    else if (plan.decisions.length === 0) lines.push("  none");
    for (const item of plan.decisions) lines.push(`  ${item.id}: ${item.from} -> ${item.to}`);
  }
  lines.push(
    "",
    plan.gate.green
      ? "gate after upgrading: green (the design-assembly step of the repository's gate)"
      : `gate after upgrading: red (the design-assembly step of the repository's gate), ${plural(plan.gate.problems.length, "problem", "problems")}:`,
  );
  if (!plan.gate.green) {
    for (const line of plan.gate.problems.slice(0, SHOWN)) lines.push(`  ${line}`);
  }
  if (plan.gate_step) {
    lines.push(
      plan.gate_step.change === "create"
        ? `gate step: ${plan.gate_step.path} is missing, and is written as the installed plugin's`
        : `gate step: ${plan.gate_step.path} differs from the installed plugin's, and is written again`,
    );
    for (const line of plan.gate_step.dropped.slice(0, SHOWN))
      lines.push(`  drops: ${line.trim()}`);
    if (plan.gate_step.dropped.length > SHOWN) {
      lines.push(
        `  and ${plan.gate_step.dropped.length - SHOWN} more lines it drops, listed with --json`,
      );
    }
  }
  for (const item of plan.checks_added ?? []) {
    lines.push(
      `check: ${item.row} gains ${item.kind}, which turns the gate red ${ADDED_CHECKS[item.kind]}`,
    );
  }
  for (const item of plan.accepted) lines.push(`accepted by the person: ${item}`);
  lines.push("", "files:");
  if (plan.files.length === 0) lines.push("  nothing to write");
  for (const file of plan.files) lines.push(`  ${file.change.padEnd(9)} ${file.path}`);
  const blind = LIMITS.filter((limit) => limit.area === "upgrade" && limit.status === "open");
  lines.push(`upgrade does not see: ${blind.map((limit) => limit.id).join(", ")} (${LIMITS_FILE})`);
  if (plan.blocked.length > 0) {
    for (const item of plan.blocked) {
      lines.push(
        `stopped: ${item.why}. Read what is listed above; if you accept it, run again with ${item.accept}`,
      );
    }
    lines.push("nothing was written");
  } else if (dryRun) lines.push("preview only: nothing was written");
  else if (plan.files.length === 0) lines.push("done: nothing to upgrade");
  else
    lines.push(
      `done: ${plural(plan.files.length, "file", "files")} written, the stamp says version ${plan.to.version}`,
    );
  return `${lines.join("\n")}\n`;
}

// ---- the release notes --------------------------------------------------------------------------

// The release notes: what the installed version changes in this repository, on the frame every
// document shares, made from the facts of the answer and nothing else.
export function documentOf(plan, dryRun, origin) {
  const losing = plan.ledgers.flatMap((ledger) =>
    ledger.removed.map((key) => `${ledger.file}: ${key}`),
  );
  // Only the gate step may differ: the tool is current, and the step is written all the same.
  const toolCurrent = plan.tool_files.length === 0;
  const current = toolCurrent && plan.gate_step === null;
  const stopped = plan.blocked.length > 0;
  const measured = (text) => ({ kind: "measurement", text });
  const conclusion = current
    ? `This repository already runs the tool of version ${plan.to.version}.`
    : `Upgrading from ${fromText(plan.from)} to version ${plan.to.version} changes ${plural(plan.tool_files.length, "tool file", "tool files")}${plan.gate_step ? ", the gate step" : ""} and ${plural(plan.ledgers.length, "ledger", "ledgers")}; ${stopped ? "it stops and waits on you" : plan.gate.green ? "the gate stays green" : "the gate is red, as you accepted"}.`;
  const attention = [
    losing.length > 0 && {
      title: `${plural(losing.length, "ledger entry would be lost", "ledger entries would be lost")}`,
      detail: "An entry the installed tool would not write again. Read each one before you accept.",
    },
    !plan.gate.green && {
      title: "The gate would be red after upgrading",
      detail: plan.gate.problems[0],
    },
    plan.decisions.length > 0 && {
      title: `${plural(plan.decisions.length, "decision changes state", "decisions change state")}`,
      detail: plan.decisions.map((item) => `${item.id}: ${item.from} to ${item.to}`).join("; "),
    },
    !toolCurrent && {
      title: `${plural(plan.tool_files.length, "tool file changes", "tool files change")}`,
      detail: "The repository's copy becomes the installed plugin's tool, and the stamp says so.",
    },
  ].filter(Boolean);
  const findings = [
    losing.length > 0 && {
      severity: "high",
      title: "Writing the ledgers again would lose entries",
      detail:
        "The installed tool would not write these entries again. The upgrade stops unless you accept it.",
      evidence: losing.slice(0, 20),
    },
    !plan.gate.green && {
      severity: "high",
      title: "The gate would be red after upgrading",
      evidence: plan.gate.problems.slice(0, 10),
    },
    plan.decisions.length > 0 && {
      severity: "medium",
      title: "Decisions that change state",
      evidence: plan.decisions.map((item) => `${item.id}: ${item.from} to ${item.to}`),
    },
    ...plan.ledgers
      .filter((ledger) => ledger.removed.length === 0)
      .map((ledger) => ({
        severity: "low",
        title: `${ledger.file} is written again`,
        evidence: ledger.problem
          ? [ledger.problem]
          : [
              `${ledger.added.length} added, ${ledger.changed.length} changed`,
              ...[...ledger.added, ...ledger.changed].slice(0, 10),
            ],
      })),
    !toolCurrent && {
      severity: "note",
      title: "The tool files that change",
      evidence: plan.tool_files.map((file) => `${file.change} ${file.path}`),
    },
    plan.gate_step && {
      severity: "note",
      title: `${plan.gate_step.path} is written as the installed plugin's`,
      evidence: [
        plan.gate_step.change === "create"
          ? "the repository has no gate step"
          : "the repository's gate step differs from the installed plugin's",
        ...plan.gate_step.dropped.slice(0, 10).map((line) => `it drops: ${line.trim()}`),
      ],
    },
  ].filter(Boolean);
  const recommendations = [
    ...plan.blocked.map((item) => ({
      what: "Read what would be lost or broken before you accept it",
      basis: measured(item.why),
      action: `Accept it only if you mean to: run the upgrade again with ${item.accept}.`,
      command: `${UPGRADE} ${item.accept}`,
    })),
    !current &&
      !stopped &&
      dryRun && {
        what: "Upgrade: nothing it writes loses an entry or turns the gate red",
        basis: measured(
          `${plural(plan.files.length, "file", "files")} would be written; the gate after upgrading is ${plan.gate.green ? "green" : "red, as accepted"}`,
        ),
        action: "Run the upgrade, then the repository's gate.",
        command: UPGRADE,
      },
  ].filter(Boolean);
  const next = [
    ...plan.blocked.map((item) => ({
      command: `${UPGRADE} ${item.accept}`,
      why: `only if you accept that ${item.why}`,
    })),
    !current && !stopped && dryRun && { command: UPGRADE, why: "write what this preview lists" },
    !current &&
      !stopped &&
      !dryRun && { command: "make check", why: "the repository's whole gate, after the upgrade" },
  ].filter(Boolean);
  const blind = LIMITS.filter(
    (limit) => ["upgrade", "document"].includes(limit.area) && limit.status === "open",
  );
  return {
    kind: "release-notes",
    title: "Release notes",
    lede: `What version ${plan.to.version} of the plugin changes in this repository.`,
    origin,
    version: VERSION,
    scope: [
      `The repository's copy of the tool, ${TOOL_COPY}, against the installed plugin's`,
      `The tool stamp, ${STAMP}: ${plan.from.stamp ? `version ${plan.from.stamp.version}` : "none in this repository"}`,
      "The ledgers the tool writes, written again by the installed tool",
      `The gate step, ${GATE_STEP}, against the installed plugin's`,
      "The design-assembly step of the repository's gate, on the repository as the upgrade would leave it",
    ],
    decision: {
      conclusion,
      figures: [
        { value: String(plan.tool_files.length), label: "tool files change" },
        { value: String(losing.length), label: "ledger entries would be lost" },
        { value: String(plan.decisions.length), label: "decisions change state" },
      ],
      attention: attention.slice(0, 3),
      decide: plan.blocked.map((item) => ({
        what: "Accept it, or leave the repository as it is",
        detail: item.why,
        command: `${UPGRADE} ${item.accept}`,
      })),
    },
    findings,
    recommendations,
    next,
    blind: blind.map(({ id, note }) => ({ id, note })),
  };
}

// ---- the command --------------------------------------------------------------------------------

const USAGE = `usage: node upgrade.mjs [--target DIR] [--dry-run] [--json] [--accept-lost-entries]
                        [--accept-red-gate] [--out DIR [--format html|pdf]]

  --target               The repository to upgrade. The folder this is run from when not given.
  --dry-run              Show what would change. Nothing is written.
  --accept-lost-entries  The person read the entries the ledgers would lose, and accepts it.
  --accept-red-gate      The person read why the gate would be red, and accepts it.
  --json                 One JSON document: from, to, tool_files, ledgers, decisions, gate,
                         blocked, accepted, gate_step, files.
  --out                  Also write the release notes into that folder.

  Writes the tool folder, the tool stamp, the gate step and the ledgers the tool writes. Never a
  ledger row a person wrote, the stylesheet, the Makefile, or a tool of the repository's own.

  Ends with 0 when there is nothing to upgrade or the upgrade is done (or, previewed, can be
  done), 1 when it stopped because an entry would be lost or the gate would be red, 2 on a wrong
  call, a repository with no copy of the tool, or one that cannot be read.
`;

const FLAGS = {
  "--dry-run": "switch",
  [ACCEPT.lost]: "switch",
  [ACCEPT.red]: "switch",
  ...DOCUMENT_FLAGS,
};

async function main(args) {
  const call = readCall(args, FLAGS);
  if (call.problem) return refuse(call.problem, USAGE);
  if (call.help) return void stdout.write(USAGE);
  const root = call.target;
  const dryRun = call.flags["--dry-run"] === true;
  // A wrong call for a document is refused before anything is read.
  const asked = requested(call);
  const plan = await upgradePlan(root, {
    lost: call.flags[ACCEPT.lost] === true,
    red: call.flags[ACCEPT.red] === true,
  });
  if (!dryRun && plan.blocked.length === 0) write(root, plan);
  const handed = await handOver(asked, root, (origin) => documentOf(plan, dryRun, origin));
  // A machine gets what the report is written from; the files as a list, never their content.
  const facts = Object.fromEntries(Object.entries(plan).filter(([key]) => key !== "written"));
  return finish({
    json: call.json,
    result: {
      dry_run: dryRun,
      ...facts,
      files: [...plan.files, ...(handed.data.files ?? [])],
      ...(handed.data.not_written ? { not_written: handed.data.not_written } : {}),
    },
    text: `${report(plan, dryRun)}${handed.text}`,
    work: plan.blocked.length > 0 || handed.work,
  });
}

await start(import.meta.url, main);
