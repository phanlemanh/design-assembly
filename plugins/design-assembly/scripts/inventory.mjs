// The audit tier: reads a repository and says, for each standard decision of a design system,
// whether it is undecided, bypassed, decided but not held, claimed, held or recorded; then which
// tier the repository has reached. Read-only. Works on any repository, with or without the design
// floor. The same repository state always gives the same report. With --out it also hands the
// report over as a document, the design audit report, written to that folder and nowhere else.
// Usage: node inventory.mjs [--target DIR] [--json] [--all] [--out DIR [--format html|pdf]]
// Exit: 0 done; 1 a decision is not held, failing or gone around, or the document was written in
// fewer formats than asked; 2 a wrong call, or a repository that cannot be read.
import { differences, presentLedgers } from "../templates/tools/design-assembly/contract.mjs";
import { adapterOf } from "../templates/tools/design-assembly/adapters/index.mjs";
import { adapter as values } from "../templates/tools/design-assembly/adapters/tailwind.mjs";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { stdout } from "node:process";
import { fileURLToPath } from "node:url";

import { heldHere, readState, runChecks } from "../templates/tools/design-assembly/check.mjs";
import {
  ledgerRate,
  oldLayerNames,
  pointerProblem,
  readLedger,
  TOOL,
} from "../templates/tools/design-assembly/ledger.mjs";

import { loadStyles, resolve } from "../templates/tools/design-assembly/styles.mjs";
import {
  readSlips,
  readSources,
  SLIPS_FILE,
} from "../templates/tools/design-assembly/governance.mjs";
import { readKinds, readPages } from "../templates/tools/design-assembly/screens.mjs";
import { readBlock } from "../templates/tools/design-assembly/theme.mjs";
import { finish, readCall, refuse, start } from "./command.mjs";
import { DOCUMENT_FLAGS, handOver, plural, requested } from "./document.mjs";
import { findProofs } from "./proofs.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const reference = (name) =>
  JSON.parse(readFileSync(path.join(HERE, "../references", name), "utf8"));
const VERSION = JSON.parse(
  readFileSync(path.join(HERE, "../.claude-plugin/plugin.json"), "utf8"),
).version;
const TIERS = reference("tiers.json").tiers;
const STANDARD = reference("standard-decisions.json");
// What this plugin is known not to hold. A report that does not say where it is blind reads as a
// stronger report than it is.
const LIMITS = reference("limits.json").limits;

// Named from the plugin's own folder: installed elsewhere, the plugin has no `plugins/` around it.
const LIMITS_FILE = "references/limits.json of this plugin";
const LINT = adapterOf("lint");
const SKIP_DIRS = new Set(["node_modules", "dist", "coverage", "test-results", "generated"]);
// Code the repository did not write: a vendor's components are not the repository's decisions.
const VENDOR = /(^|\/)components\/(ui|reui)\//;
// A decision is answered when the ledger has a row for it that is held, claimed or recorded.
// What the audit can see without a row is said beside the decision, and is not an answer.
const ANSWERED = ["held", "claimed", "recorded"];
// A row whose note says this is an answer nobody has made theirs yet: the guide proposed it, or it
// was read off the repository. The audit names such rows, and the status lists them as waiting.
export const UNCONFIRMED = /has not (confirmed|reviewed)/;
// The command that lists each decision's state, and the one that takes a person's answers.
export const AUDIT = "/design-assembly:audit";
export const DECIDE = "/design-assembly:decide";
// The calls only a person can make, each with the flag that states the answer when adopting.
export const PERSON_CALLS = {
  "product-type": "--product-type TYPE",
  "conformance-level": "--conformance-level LEVEL",
  "source-color": "--record source-color",
};

function walk(root, dir, keep) {
  const full = path.join(root, dir);
  if (!existsSync(full)) return [];
  return readdirSync(full)
    .sort()
    .flatMap((name) => {
      if (name.startsWith(".") || SKIP_DIRS.has(name)) return [];
      const relative = path.posix.join(dir, name);
      if (statSync(path.join(root, relative)).isDirectory()) return walk(root, relative, keep);
      return keep(relative) ? [relative] : [];
    });
}

const read = (root, file) =>
  existsSync(path.join(root, file)) ? readFileSync(path.join(root, file), "utf8") : null;

// Custom properties declared in top-level :root, .dark and @theme blocks of every stylesheet.
function declarations(root, sheets) {
  const found = [];
  for (const file of sheets) {
    const css = read(root, file) ?? "";
    for (const block of css.matchAll(/(?:^|\n)(:root|\.dark|@theme(?: inline)?)\s*\{([^}]*)\}/g)) {
      for (const line of block[2].matchAll(/(--[\w-]+)\s*:\s*([^;]+);/g)) {
        found.push({ file, scope: block[1], name: line[1], value: line[2].trim() });
      }
    }
  }
  return found;
}

// What the audit can see without a ledger: the four decisions about using a scale, each with the
// variable that shows it is decided, the lint rule that would hold it, and how source goes around it.
const USAGE = {
  "color-role": {
    variable: "--primary",
    lint: /no-raw-colors|no-hardcoded-color/,
    bypass: /\[#[0-9a-fA-F]{3,8}\]|["'`\s:]#[0-9a-fA-F]{6}\b/g,
  },
  "type-scale": {
    variable: null,
    lint: /no-arbitrary-values|no-arbitrary-text-size/,
    bypass: /\btext-\[[^\]]*(?:px|rem|em)\]/g,
  },
  spacing: {
    variable: null,
    lint: /no-arbitrary-values|no-off-scale-spacing/,
    bypass: /\b(?:p|px|py|pt|pb|pl|pr|m|mx|my|mt|mb|ml|mr|gap|space-x|space-y)-\[[^\]]+\]/g,
  },
  radius: {
    variable: "--radius",
    lint: /no-arbitrary-values/,
    bypass: /\brounded(?:-[a-z]{1,2})?-\[[^\]]+\]/g,
  },
};

function bypasses(root, sources) {
  const result = Object.fromEntries(Object.keys(USAGE).map((id) => [id, { count: 0, files: [] }]));
  for (const file of sources) {
    const text = read(root, file) ?? "";
    for (const [id, { bypass }] of Object.entries(USAGE)) {
      const hits = text.match(bypass)?.length ?? 0;
      if (hits > 0) {
        result[id].count += hits;
        result[id].files.push(`${file} (${hits})`);
      }
    }
  }
  return result;
}

// The sockets the acceptance kit reads from a repository, when its config names them.
function sockets(root) {
  const config = read(root, "_acceptance/config.yaml") ?? "";
  const pick = (key) =>
    new RegExp(`^\\s+${key}:\\s*["']?([^"'#\\n]+)`, "m").exec(config)?.[1].trim();
  return {
    "design_floor.tokens": pick("tokens") ?? null,
    "design_floor.registry": pick("registry") ?? null,
    "feature_loop.ui_standards_skill": pick("ui_standards_skill") ?? null,
    "design_pass.ds_skill": pick("ds_skill") ?? null,
  };
}

// The state of a decision the repository's ledger has a row for.
function fromLedger(root, row, held, proofs, checks) {
  if (row.kind === "judgment") return { state: "recorded", by: "the ledger", note: row.note };
  if (!row.check) {
    // The row names no check. A proof the repository runs may be there all the same.
    const proof = proofs.find((item) => item.id === row.id && !item.problem);
    return {
      state: "not-held",
      by: null,
      seen: proof
        ? `a proof the row does not point at, ${proof.check}: adopting with --hold ${row.id} adds the pointer`
        : null,
    };
  }
  if (row.check === TOOL) {
    return held.has(row.id)
      ? { state: "held", by: "this plugin's tool, run now", note: row.note }
      : { state: "failing", by: "this plugin's tool reports a problem" };
  }
  if (heldHere(row, checks)) {
    return held.has(row.id)
      ? { state: "held", by: `${row.check}, re-run by this plugin's tool`, note: row.note }
      : { state: "failing", by: `this plugin's tool re-runs ${row.check} and reports a problem` };
  }
  const broken = pointerProblem(root, row.id, row.check);
  return broken ? { state: "failing", by: broken } : { state: "claimed", by: row.check };
}

// Above this chroma a primary color role has a hue of its own: the floor's default is a grey.
const OWN_HUE_CHROMA = 0.05;

// A decision with no row. The audit says what the repository shows, and never counts it as an
// answer: a proof it already runs (adopting adds the row), or a value that looks like the answer
// (a person confirms it).
function fromRepository(decision, facts) {
  const usage = USAGE[decision.id];
  if (usage) {
    const decided = usage.variable
      ? facts.declared.some((d) => d.name === usage.variable && d.scope === ":root")
      : facts.framework;
    if (!decided) return { state: "undecided", by: null };
  }
  const proof = facts.proofs.find((item) => item.id === decision.id);
  if (proof) {
    return {
      state: "no-row",
      seen: proof.problem
        ? `a proof the ledger cannot point at yet (${proof.problem})`
        : `a proof the repository already runs, ${proof.check}: adopting adds the row`,
    };
  }
  const primary = facts.primary;
  const looks = {
    "product-type":
      facts.setup.vars?.design_surface &&
      `.repo-setup.json records design_surface: ${facts.setup.vars.design_surface}`,
    "source-color":
      primary &&
      (primary.own
        ? `the stylesheet's --primary is ${primary.value}`
        : `the stylesheet's --primary is ${primary.value}, a grey default and not a brand colour`),
    "conformance-level":
      facts.rows.find(
        (r) => /\bA{2,3}\b/.test(r.source ?? "") && /wcag/i.test(`${r.id} ${r.source}`),
      ) && "an accessibility row of the ledger names a level",
  }[decision.id];
  return { state: "no-row", seen: looks ? `${looks}: a person confirms it` : null };
}

// What to do next, decided from the files and not from a reading of this report.
function nextStep(facts, decisions) {
  if (facts.styles === null) {
    return "nothing to read: the guide and adopting both need a stylesheet that declares color roles";
  }
  const proofs = decisions.filter((d) => d.seen?.startsWith("a proof the repository already runs"));
  const calls = decisions.filter((d) => Object.keys(PERSON_CALLS).includes(d.id) && !d.in_ledger);
  const unheld = decisions.filter((d) => d.state === "not-held");
  const untagged = decisions.filter((d) =>
    d.seen?.startsWith("a proof the ledger cannot point at"),
  );
  const reasons = [
    ...(proofs.length > 0 ? [`${proofs.length} proof(s) seen without a row`] : []),
    ...(calls.length > 0 ? [`${calls.map((d) => d.id).join(", ")} to confirm with a person`] : []),
    ...(unheld.length > 0
      ? [`${unheld.length} row(s) with no check, some of which it may be able to hold`]
      : []),
  ];
  const adopt = `/design-assembly:adopt, to record what the repository already has${reasons.length > 0 ? ` (${reasons.join("; ")})` : ""}`;
  if (facts.generated || facts.adopted) {
    if (reasons.length > 0) return adopt;
    // Nothing for the scripts to do. Say what the repository can still close by itself.
    const own = [
      ...(untagged.length > 0
        ? [
            `${untagged.length} proof(s) need a decision:<id> tag in their test before a row can point at them (${untagged.map((d) => d.id).join(", ")})`,
          ]
        : []),
      ...(decisions.some((d) => d.id === "display-kind" && !d.in_ledger)
        ? ["display-kind closes when a field of the data model names its column type"]
        : []),
      ...(facts.screens && !facts.kinds
        ? [
            "the kinds of screen close when each has its page under design/patterns and the guide runs again (reference-implementation, primary-task)",
          ]
        : []),
    ];
    return `nothing more to generate or adopt now${own.length > 0 ? `. The repository can still close: ${own.join("; ")}` : ""}. The rest of what is open belongs to layers this version does not build`;
  }
  if (facts.primary?.own) {
    return `${adopt}. Not the guide: the stylesheet has a primary color role of its own (${facts.primary.value}), which the guide would replace`;
  }
  return `/design-assembly:new, to choose the values the repository does not have (its primary color role is a grey default). The guide ends by adopting what the repository already proves${reasons.length > 0 ? ` (${reasons.join("; ")})` : ""}`;
}

function need(root, item, facts, tier) {
  if (item.kind === "readable") {
    const ok = facts.declared.length > 0 || facts.rows.length > 0;
    return { ok, what: "a stylesheet that declares custom properties, or a ledger" };
  }
  if (item.kind === "decisions") {
    const core = facts.decisions.filter((d) => d.tier === tier.id && d.core);
    const open = core.filter((d) => !ANSWERED.includes(d.state));
    return {
      ok: open.length === 0,
      what: `${core.length - open.length} of ${core.length} core decisions answered`,
      missing: open.map((d) => `${d.id}: ${d.state}`),
    };
  }
  const about = item.about ? ` (${item.about})` : "";
  if (item.kind === "file") {
    const file = facts.sockets[item.socket] ?? item.path;
    return { ok: existsSync(path.join(root, file)), what: `${file}${about}` };
  }
  if (item.kind === "any-file") {
    const found = item.paths.find((file) => existsSync(path.join(root, file)));
    return { ok: Boolean(found), what: found ?? `one of ${item.paths.join(", ")}${about}` };
  }
  if (item.kind === "folder") {
    const files = walk(root, item.path, (file) => file.endsWith(item.extension)).filter(
      (file) => !/(README|lech-lot)\.md$/.test(file),
    );
    return {
      ok: files.length > 0,
      what: `${item.path}/*${item.extension} (${files.length} found)${about}`,
    };
  }
  throw new Error(`unknown need ${item.kind}`);
}

// Departures on purpose, counted where each one lives: beside the rule it bends.
function departures(root) {
  // In the repository's own source: a component library it took in is not its departure.
  // An exception says why after `--`; one that does not is counted apart: it is not shown to be on
  // purpose.
  const exceptions = Object.entries(readSources(root))
    .filter(([file]) => !VENDOR.test(file))
    .flatMap(([, text]) => text.match(LINT.exception) ?? []);
  const lint = exceptions.length;
  const unexplained = exceptions.filter((line) => !/\s--\s*\S/.test(line)).length;
  let excused;
  try {
    excused = Object.keys(JSON.parse(read(root, "design/states.json") ?? "{}").exempt ?? {}).length;
  } catch {
    excused = 0;
  }
  const left = readKinds(readPages(root)).reduce((sum, kind) => sum + kind.exceptions, 0);
  return { lint, unexplained, excused, left };
}

// The highest tier with every tier below it in place, and the first one that is not.
function tierOf(tiers) {
  const open = tiers.findIndex((tier) => !["reached", "claimed"].includes(tier.state));
  const top = open === -1 ? tiers.at(-1) : tiers[open - 1];
  return {
    id: top?.id ?? null,
    state: top?.state ?? "none",
    next: open === -1 ? null : tiers[open].id,
  };
}

// What the next tier still lacks: each of its core decisions that is not answered, with its
// state, and each artifact that is not there.
function missingOf(tiers, decisions, next) {
  const tier = tiers.find((item) => item.id === next);
  if (!tier) return [];
  const open = decisions.filter((d) => d.tier === tier.id && d.core && !ANSWERED.includes(d.state));
  return [
    ...open.map((d) => ({ tier: tier.id, decision: d.id, state: d.state })),
    ...tier.needs
      .filter((item) => item.missing === undefined && !item.ok)
      .map((item) => ({ tier: tier.id, artifact: item.what })),
  ];
}

// The states that leave work behind: a row with no check, a check that fails, and source that goes
// around a decision. The audit ends with 1 on any of them.
export const BROKEN = ["not-held", "failing", "bypassed"];

// The record of what slipped past the checks: how many lines, and the date of the latest.
function slips(root) {
  const text = read(root, SLIPS_FILE);
  if (text === null) return null;
  const dates = readSlips(text)
    .map((cells) => cells[0] ?? "")
    .filter((date) => /^\d{4}-\d{2}-\d{2}$/.test(date))
    .sort();
  return { count: readSlips(text).length, latest: dates.at(-1) ?? null };
}

export function inventory(root) {
  const sheets = walk(root, "src", (file) => file.endsWith(".css"));
  const sources = walk(root, "src", (file) => /\.[jt]sx$/.test(file) && !VENDOR.test(file));
  const rows = readLedger(root) ?? [];
  const facts = {
    declared: declarations(root, sheets),
    // The stylesheet is built on the framework its values adapter knows.
    framework: sheets.some((file) => values.importsFramework.test(read(root, file) ?? "")),
    lintConfig: LINT.configFiles.map((file) => read(root, file) ?? "").join("\n"),
    setup: JSON.parse(read(root, ".repo-setup.json") ?? "{}"),
    sockets: sockets(root),
    rows,
  };
  const bypass = bypasses(root, sources);
  const state = readState(root);
  const styles = existsSync(path.join(root, state.stylesheet))
    ? loadStyles(root, state.stylesheet)
    : null;
  const primary = styles ? resolve(styles, ":root", "--primary") : null;
  facts.styles = styles;
  facts.primary = primary && {
    value: primary.value,
    own: !primary.color || primary.color.c > OWN_HUE_CHROMA,
  };
  facts.generated = styles !== null && readBlock(styles.css) !== null;
  facts.adopted = (state.theme?.adopted ?? []).length > 0;
  facts.proofs = findProofs(root);
  // Whether the repository lists its screens, and whether any kind of screen has a page.
  facts.screens = existsSync(path.join(root, "src/screens.ts"));
  facts.kinds = Object.keys(readPages(root)).length > 0;
  const held = new Set(
    state.theme
      ? runChecks(state)
          .filter((r) => r.held)
          .map((r) => r.id)
      : [],
  );

  facts.decisions = STANDARD.decisions.map((decision) => {
    const row = rows.find((r) => r.id === decision.id);
    const found = row
      ? fromLedger(root, row, held, facts.proofs, state.theme?.checks)
      : fromRepository(decision, facts);
    const around = bypass[decision.id] ?? { count: 0, files: [] };
    return {
      id: decision.id,
      layer: decision.layer,
      tier: decision.tier ?? STANDARD.layers[decision.layer].tier,
      core: decision.sources.length >= 2,
      question: decision.question,
      in_ledger: Boolean(row),
      // Source that goes around a decision outranks whatever claims to hold it.
      state: around.count > 0 && found.state !== "undecided" ? "bypassed" : found.state,
      by: found.by ?? null,
      seen: found.seen ?? null,
      note: found.note ?? null,
      bypassed: around.count,
      bypassed_in: around.files.slice(0, 5),
    };
  });

  let lower = "reached";
  const tiers = TIERS.map((tier) => {
    const needs = tier.needs.map((item) => need(root, item, facts, tier));
    const mine = facts.decisions.filter((d) => d.tier === tier.id && d.core);
    const complete = needs.every((n) => n.ok);
    const rerun = mine.every((d) => ["held", "recorded"].includes(d.state));
    let result = !complete ? "missing" : rerun ? "reached" : "claimed";
    if (result !== "missing" && lower === "missing") result = "blocked";
    lower = result === "reached" || result === "claimed" ? lower : "missing";
    return { id: tier.id, maps_to: tier.maps_to, state: result, needs };
  });
  const beyond = facts.decisions.filter((d) => !d.core && d.in_ledger);

  const core = facts.decisions.filter((d) => d.core);
  const count = (list, name) => list.filter((d) => d.state === name).length;
  const standardIds = new Set(STANDARD.decisions.map((d) => d.id));
  const tier = tierOf(tiers);
  const open = LIMITS.filter((limit) => limit.status === "open");
  return {
    stylesheets: sheets,
    source_files: sources.length,
    decisions: facts.decisions,
    coverage: {
      core: core.length,
      answered: core.filter((d) => ANSWERED.includes(d.state)).length,
      held: count(core, "held"),
      claimed: count(core, "claimed"),
      recorded: count(core, "recorded"),
    },
    // Rows of the ledger for standard decisions that are not core: one source names them.
    beyond_core: {
      held: count(beyond, "held"),
      claimed: count(beyond, "claimed"),
      recorded: count(beyond, "recorded"),
      ids: beyond.filter((d) => ANSWERED.includes(d.state)).map((d) => d.id),
    },
    next: nextStep(facts, facts.decisions),
    // Where the values of the stylesheet come from: the guide generated them, the repository
    // brought a primary color role of its own, it still has a grey default, or no stylesheet is read.
    values:
      styles === null
        ? "none"
        : facts.generated
          ? "generated"
          : facts.primary?.own
            ? "own"
            : "default",
    ledger:
      rows.length === 0
        ? null
        : {
            ...ledgerRate(root, rows),
            own_decisions: rows.filter((r) => !standardIds.has(r.id)).map((r) => r.id),
            old_layer_names: oldLayerNames(rows),
          },
    // The ledgers the repository has, and how each differs from the contract's one shape.
    contract: presentLedgers(root).map(({ kind, file, problems }) => ({
      kind,
      file,
      differs: differences(problems, file),
    })),
    sockets: facts.sockets,
    // The tier reached, as one answer, and what the next one lacks; then every tier in full.
    tier,
    missing: missingOf(tiers, facts.decisions, tier.next),
    tiers,
    departures: departures(root),
    slips: slips(root),
    limits: {
      open: open.length,
      high: open.filter((limit) => limit.severity === "high").map((limit) => limit.id),
      closed: LIMITS.filter((limit) => limit.status === "closed").length,
    },
    // Where this plugin is blind: every open row of its limits ledger, in the ledger's own words.
    blind: open.map(({ id, area, severity, note }) => ({ id, area, severity, note })),
  };
}

const LABEL = {
  held: "held",
  claimed: "claimed",
  recorded: "recorded",
  "not-held": "not held",
  failing: "FAILING",
  bypassed: "BYPASSED",
  undecided: "undecided",
  "no-row": "no row",
};
const NOTE = {
  reached: "reached",
  claimed: "claimed: complete, but it rests on checks the audit did not re-run",
  missing: "not reached",
  blocked: "complete, but a lower tier is not",
};

function line(decision) {
  const lines = [`      ${LABEL[decision.state].padEnd(9)} ${decision.id}: ${decision.question}`];
  if (decision.by) lines.push(`                by ${decision.by}`);
  if (decision.note) {
    lines.push(
      `                ${decision.state === "held" ? "covers" : "note"}: ${decision.note}`,
    );
  }
  if (decision.seen) lines.push(`                seen: ${decision.seen}`);
  if (decision.bypassed > 0) {
    lines.push(
      `                ${decision.bypassed} place(s) go around it: ${decision.bypassed_in.join(", ")}`,
    );
  }
  return lines;
}

// The answers nobody has made theirs yet. `recorded`: a person's call the guide proposed or read
// off the repository. `held`: a choice a check holds, which is still the proposal it holds.
const proposalsOf = (decisions) => ({
  recorded: decisions.filter((d) => d.state === "recorded" && UNCONFIRMED.test(d.note ?? "")),
  held: decisions.filter(
    (d) => d.state !== "recorded" && /a person has not confirmed it/.test(d.note ?? ""),
  ),
});

// By default the report lists what is open in each tier; `all` lists every core decision.
export function report(result, { all = false } = {}) {
  const lines = [];
  lines.push(`stylesheets: ${result.stylesheets.join(", ") || "none found under src/"}`);
  lines.push(
    `source files read: ${result.source_files} screens and components of the repository's own, searched for values that go around a scale (the component library's files are left out)`,
  );
  const c = result.coverage;
  lines.push(
    "",
    `coverage: ${c.answered} of ${c.core} core decisions answered (${c.held} held and re-run here, ${c.claimed} claimed and not re-run, ${c.recorded} recorded)`,
  );
  const b = result.beyond_core;
  if (b.held + b.claimed + b.recorded > 0) {
    lines.push(
      `  beyond the core, the ledger also answers: ${b.held} held, ${b.claimed} claimed, ${b.recorded} recorded (${b.ids.join(", ")})`,
    );
  }
  // A decision beyond the core that its check now fails is as broken as a core one: named first.
  const brokenBeyond = result.decisions.filter(
    (d) => !d.core && d.in_ledger && (d.state === "failing" || d.state === "bypassed"),
  );
  for (const decision of brokenBeyond) lines.push(...line(decision));
  // A person's call that nobody has confirmed is not an answer yet: named in every report.
  const { recorded: open, held: proposedHeld } = proposalsOf(result.decisions);
  if (open.length > 0) {
    lines.push(
      `  ${open.length} of the recorded are a proposal a person has not confirmed: ${open.map((d) => d.id).join(", ")}`,
    );
  }
  // A choice a check holds can still be one nobody made: the check holds the proposal.
  if (proposedHeld.length > 0) {
    lines.push(
      `  ${proposedHeld.length} held by a check are still a proposal a person has not confirmed: ${proposedHeld.map((d) => d.id).join(", ")}`,
    );
  }
  if (result.ledger) {
    const l = result.ledger;
    lines.push(
      `ledger design/decisions.yaml: ${l.total} rows in all, ${l.automatic} of them naming a check that can be found`,
    );
    if (l.own_decisions.length > 0)
      lines.push(
        `  ${l.own_decisions.length} of them are the repository's own, beyond the standard ones: ${l.own_decisions.slice(0, 5).join(", ")}${l.own_decisions.length > 5 ? ", ..." : ""}`,
      );
    if (l.old_layer_names.length > 0)
      lines.push(`  ${l.old_layer_names.length} row(s) use an older layer name`);
  } else lines.push("ledger design/decisions.yaml: none");
  const shaped = result.contract.filter((item) => item.differs.length === 0);
  if (result.contract.length > 0) {
    lines.push(
      `contract: ${shaped.length} of ${result.contract.length} ledger file(s) have the one shape every reader relies on`,
    );
    for (const item of result.contract.filter((entry) => entry.differs.length > 0)) {
      const more = item.differs.length > 3 ? `; and ${item.differs.length - 3} more` : "";
      lines.push(`  ${item.file} differs: ${item.differs.slice(0, 3).join("; ")}${more}`);
    }
  }
  const d = result.departures;
  if (d.lint + d.excused + d.left > 0) {
    lines.push(
      `departures on purpose: ${d.lint} lint exception(s) in its own source${d.unexplained > 0 ? ` (${d.unexplained} with no reason after --, so not shown to be on purpose)` : ""}, ${d.excused} screen(s) excused from the states, ${d.left} file(s) left out of a kind of screen`,
    );
  }
  if (result.slips) {
    lines.push(
      result.slips.count === 0
        ? `${SLIPS_FILE}: no line yet. An empty record is not proof that nothing slipped`
        : `${SLIPS_FILE}: ${result.slips.count} line(s)${result.slips.latest ? `, the latest on ${result.slips.latest}` : ""}`,
    );
  }
  // The plugin's own blind spots, so nothing above reads as more than it is.
  const l = result.limits;
  lines.push(`this plugin's known limits: ${l.open} open, ${l.closed} closed, in ${LIMITS_FILE}`);
  if (l.high.length > 0) {
    lines.push(
      `  ${l.high.length} of the open ones can leave a check green while what it holds is broken: ${l.high.join(", ")}`,
    );
  }
  lines.push("", "tiers:");
  for (const tier of result.tiers) {
    lines.push(`  ${tier.id}: ${NOTE[tier.state]}`);
    for (const item of tier.needs) {
      if (item.missing === undefined && !item.ok) lines.push(`      missing: ${item.what}`);
      if (item.missing !== undefined) lines.push(`      ${item.what}`);
    }
    const mine = result.decisions.filter((d) => d.tier === tier.id && d.core);
    for (const decision of mine.filter((d) => all || !ANSWERED.includes(d.state))) {
      lines.push(...line(decision));
    }
  }
  lines.push("", `next: ${result.next}`);
  return `${lines.join("\n")}\n`;
}

// How many of a list are written out on the page for the person; the rest are named.
const SHOWN = 5;
const LEDGER_FILE = "design/decisions.yaml";

// The design audit report: the same audit as a document on the frame every document shares, made
// from the facts of the audit and from nothing else. `origin` says which state of the repository
// it is made from. Like the screen, it lists the core decisions still open; `all` lists every one.
export function documentOf(result, origin, { all = false } = {}) {
  const c = result.coverage;
  const { tier, missing, decisions } = result;
  const ids = (found) => found.map((d) => d.id).join(", ");
  const gone = decisions.filter((d) => d.state === "bypassed");
  const failing = decisions.filter((d) => d.state === "failing");
  const unheld = decisions.filter((d) => d.state === "not-held");
  const broken = [...gone, ...failing, ...unheld];
  const proposals = proposalsOf(decisions);
  const unconfirmed = [...proposals.recorded, ...proposals.held];
  const proven = decisions.filter((d) => d.seen?.startsWith("a proof the repository already runs"));
  const calls = decisions.filter((d) => d.id in PERSON_CALLS && !d.in_ledger);
  const undecided = decisions.filter((d) => d.core && d.state === "undecided");
  const claimedTiers = result.tiers.filter((item) => item.state === "claimed");
  const differing = result.contract.filter((item) => item.differs.length > 0);
  const heavy = result.blind.filter((limit) => limit.severity === "high");
  const places = (d) =>
    `${plural(d.bypassed, "place in source goes", "places in source go")} around it: ${d.bypassed_in.join(", ")}`;
  // The audit's own last line, split into the command it names and the reason it gives.
  const named = /^(\/design-assembly:[a-z-]+),? (.*)$/.exec(result.next);
  const sentence = (line) => `${line.charAt(0).toUpperCase()}${line.slice(1)}.`;

  const reached = tier.id
    ? `Tier reached: ${tier.id}${tier.state === "claimed" ? ", on checks that were not run again here" : ""}`
    : "No tier is reached yet";
  const attention = [
    gone.length + failing.length > 0 && {
      title: `${plural(gone.length + failing.length, "decision is", "decisions are")} failing, or gone around in source`,
      detail: `${ids([...gone, ...failing])}. A check of the gate would fail on each today.`,
    },
    unheld.length > 0 && {
      title: `${plural(unheld.length, "row of the ledger names", "rows of the ledger name")} no check`,
      detail: `${ids(unheld)}. The answer is written down, and nothing holds it.`,
    },
    unconfirmed.length > 0 && {
      title: `${plural(unconfirmed.length, "answer is a proposal", "answers are proposals")} nobody confirmed`,
      detail: `${ids(unconfirmed)}. Each counts as answered, and is not yet a person's.`,
    },
    tier.next && {
      title: `The next tier, ${tier.next}, lacks ${plural(missing.length, "thing", "things")}`,
      detail: missing
        .slice(0, SHOWN)
        .map((item) => item.decision ?? item.artifact)
        .join(", "),
    },
    claimedTiers.length > 0 && {
      title: `${plural(claimedTiers.length, "tier rests", "tiers rest")} on checks the audit did not run again`,
      detail: `${claimedTiers.map((item) => item.id).join(", ")}. A claim names a check that can be found; it was not run for this report.`,
    },
    heavy.length > 0 && {
      title: `${plural(heavy.length, "open limit", "open limits")} of this plugin can leave a check green while what it holds is broken`,
      detail: "They are listed in the last part of this report.",
    },
    differing.length > 0 && {
      title: `${plural(differing.length, "ledger file does", "ledger files do")} not have the shape of the contract`,
      detail: differing.map((item) => item.file).join(", "),
    },
  ].filter(Boolean);

  const asked = (found) => ({
    items: found.slice(0, SHOWN).map((d) => `${d.id}: ${d.question}`),
    more:
      found.length > SHOWN
        ? `and ${found.length - SHOWN} more, in the findings: ${ids(found.slice(SHOWN))}`
        : null,
  });
  const decide = [
    unconfirmed.length > 0 && {
      what: `Confirm or change ${plural(unconfirmed.length, "proposal", "proposals")}`,
      ...asked(unconfirmed),
      command: DECIDE,
    },
    calls.length > 0 && {
      what: `Make ${plural(calls.length, "call", "calls")} only a person can make`,
      detail: "The ledger has no row for them yet.",
      ...asked(calls),
    },
    undecided.length > 0 && {
      what: `Decide ${plural(undecided.length, "thing", "things")} nothing in the repository answers`,
      ...asked(undecided),
    },
  ].filter(Boolean);

  const findings = [
    ...gone.map((d) => ({
      severity: "high",
      title: `${d.id} is gone around in the repository's own source`,
      detail: d.question,
      evidence: [places(d), ...(d.by ? [`what claims to hold it: ${d.by}`] : [])],
    })),
    ...failing.map((d) => ({
      severity: "high",
      title: `${d.id} is failing`,
      detail: d.question,
      evidence: [d.by ?? "its check does not pass, and the audit could not say why"],
    })),
    ...unheld.map((d) => ({
      severity: "medium",
      title: `${d.id} has a row in the ledger, and no check`,
      detail: d.question,
      evidence: [d.seen ?? "the row names no check, and no proof of it is seen in the repository"],
    })),
    unconfirmed.length > 0 && {
      severity: "medium",
      title: `${plural(unconfirmed.length, "answer is a proposal", "answers are proposals")} nobody confirmed`,
      detail:
        "The guide proposed the answer, or it was read off the repository. It counts as answered and is not a person's yet.",
      evidence: unconfirmed.map((d) => `${d.id}: ${d.note}`),
    },
    ...differing.map((item) => ({
      severity: "medium",
      title: `${item.file} does not have the shape of the contract`,
      detail: "Every reader of a ledger relies on its one shape.",
      evidence: item.differs,
    })),
    result.departures.unexplained > 0 && {
      severity: "medium",
      title: `${plural(result.departures.unexplained, "lint exception gives", "lint exceptions give")} no reason`,
      detail: "An exception with nothing after its two dashes is not shown to be on purpose.",
      evidence: [
        `${result.departures.lint} lint exceptions in the repository's own source, ${result.departures.unexplained} of them with no reason`,
      ],
    },
    claimedTiers.length > 0 && {
      severity: "low",
      title: `${plural(claimedTiers.length, "tier is", "tiers are")} complete on checks the audit did not run again`,
      detail: `${c.claimed} core decisions are claimed: the ledger names a check that exists and is wired in, and nothing here ran it.`,
      evidence: claimedTiers.map((item) => {
        const count = item.needs.find((need) => need.missing !== undefined);
        return `${item.id}${count ? `: ${count.what}` : ""}`;
      }),
    },
    tier.next && {
      severity: "low",
      title: `The tier ${tier.next} is not reached`,
      detail: "A tier needs every one of its core decisions answered and its artifacts in place.",
      evidence:
        missing.length > 0
          ? missing.map((item) =>
              item.decision
                ? `decision ${item.decision}: ${LABEL[item.state]}`
                : `missing: ${item.artifact}`,
            )
          : ["a tier below it is not in place"],
    },
    (result.ledger?.old_layer_names.length ?? 0) > 0 && {
      severity: "low",
      title: `${plural(result.ledger.old_layer_names.length, "row uses", "rows use")} an older layer name`,
      detail: "They are read as they are, and can be renamed whenever convenient.",
      evidence: [`in ${LEDGER_FILE}`],
    },
    result.slips && {
      severity: "note",
      title: "The record of what slipped past the checks",
      evidence: [
        result.slips.count === 0
          ? `${SLIPS_FILE}: no line yet. An empty record is not proof that nothing slipped`
          : `${SLIPS_FILE}: ${plural(result.slips.count, "line", "lines")}${result.slips.latest ? `, the latest on ${result.slips.latest}` : ""}`,
      ],
    },
    result.departures.lint + result.departures.excused + result.departures.left > 0 && {
      severity: "note",
      title: "Departures on purpose",
      evidence: [
        `${result.departures.lint} lint exceptions in the repository's own source`,
        `${result.departures.excused} screens excused from the states`,
        `${result.departures.left} files left out of a kind of screen`,
      ],
    },
  ].filter(Boolean);

  const seenOf = (d) =>
    [
      d.by && `by ${d.by}`,
      d.seen && `seen: ${d.seen}`,
      d.bypassed > 0 && places(d),
      d.note && `note: ${d.note}`,
    ]
      .filter(Boolean)
      .join("; ") || "nothing in the repository answers it";
  const register = {
    title: all ? "Every core decision, by tier" : "Every tier, with the core decisions still open in it",
    lede: all
      ? "A decision seen in two or more sources is core; a tier needs its core decisions."
      : "A tier with no row under it has no core decision open. Run the audit with --all for every core decision.",
    columns: ["State", "Decision", "What holds it, or what the audit sees"],
    groups: result.tiers.map((item) => ({
      title: item.id,
      note: [
        NOTE[item.state],
        ...item.needs
          .filter((need) => need.missing !== undefined || !need.ok)
          .map((need) => (need.missing !== undefined ? need.what : `missing: ${need.what}`)),
      ].join("; "),
      rows: decisions
        .filter((d) => d.tier === item.id && d.core && (all || !ANSWERED.includes(d.state)))
        .map((d) => [LABEL[d.state], { code: d.id, text: d.question }, seenOf(d)]),
    })),
  };

  const open = missing.filter((item) => item.decision);
  const absent = missing.filter((item) => item.artifact);
  const pointed = unheld.filter((d) => d.seen);
  const bare = unheld.filter((d) => !d.seen);
  const nextLine = sentence(result.next);
  const recommendations = [
    gone.length > 0 && {
      what: `Bring ${plural(gone.length, "decision", "decisions")} back onto the scale, before anything else`,
      basis: {
        kind: "measurement",
        text: gone.map((d) => `${d.id}: ${places(d)}`).join(". "),
      },
      action:
        "Change each place listed to a value of the scale, then run the audit again. A check would fail on them today.",
      command: AUDIT,
    },
    failing.length > 0 && {
      what: `Make ${plural(failing.length, "failing check", "failing checks")} pass, or change the row knowingly`,
      basis: { kind: "measurement", text: failing.map((d) => `${d.id}: ${d.by}`).join(". ") },
      action:
        "Read the reason under each finding. The gate of the repository fails on the same.",
    },
    pointed.length > 0 && {
      what: `Point ${plural(pointed.length, "row", "rows")} at the proof the repository already runs`,
      basis: { kind: "measurement", text: pointed.map((d) => `${d.id}: ${d.seen}`).join(". ") },
      action: "Adopt with --hold for each row named: it adds the pointer and changes nothing else.",
      command: `/design-assembly:adopt --hold ${pointed[0]?.id}`,
    },
    bare.length > 0 && {
      what: `Give ${plural(bare.length, "row", "rows")} a check, or accept that nothing holds ${bare.length === 1 ? "it" : "them"}`,
      basis: {
        kind: "measurement",
        text: `the ${bare.length === 1 ? "row names" : "rows name"} no check, and no proof is seen in the repository: ${ids(bare)}`,
      },
      action: "Write a check and name it in the row. Until then the audit counts the row as not held.",
    },
    proven.length > 0 && {
      what: `Record ${plural(proven.length, "decision", "decisions")} the repository already proves`,
      basis: { kind: "measurement", text: proven.map((d) => `${d.id}: ${d.seen}`).join(". ") },
      action: "Adopt: it adds a row for each, and changes no value, rule or test.",
      command: "/design-assembly:adopt",
    },
    unconfirmed.length > 0 && {
      what: `Have a person confirm or change ${plural(unconfirmed.length, "proposal", "proposals")}`,
      basis: {
        kind: "measurement",
        text: `the note of each row says a person has not confirmed it: ${ids(unconfirmed)}`,
      },
      action: "Answer them on the decision sheet, in one go.",
      command: DECIDE,
    },
    tier.next &&
      missing.length > 0 && {
        what: `Close what the tier ${tier.next} lacks: ${plural(open.length, "core decision", "core decisions")} and ${plural(absent.length, "artifact", "artifacts")}`,
        basis: {
          kind: "standard",
          text: `this plugin's list of standard decisions names each decision as core, seen in two or more of its sources, and its list of tiers asks for each artifact: ${missing.map((item) => item.decision ?? item.artifact).join(", ")}`,
        },
        action: named ? sentence(named[2]) : nextLine,
        command: named?.[1],
      },
  ].filter(Boolean);

  const next = [
    gone.length + failing.length > 0 && {
      command: null,
      why: `Fix ${plural(gone.length + failing.length, "decision", "decisions")} that fail or are gone around, at the places the findings list: ${ids([...gone, ...failing])}`,
    },
    gone.length + failing.length > 0 && {
      command: AUDIT,
      why: "Run the audit again, to see them closed",
    },
    unconfirmed.length > 0 && {
      command: DECIDE,
      why: `${plural(unconfirmed.length, "proposal waits", "proposals wait")} for a person: ${ids(unconfirmed)}`,
    },
    named && { command: named[1], why: sentence(named[2]) },
  ].filter(Boolean);

  // Where this report is blind: its own limits in full, then the heavy ones of everything it
  // counts on; the lighter ones are counted, and named where to find them.
  const mine = result.blind.filter((limit) => ["audit", "document"].includes(limit.area));
  const others = heavy.filter((limit) => !mine.includes(limit));
  const lighter = result.blind.filter((limit) => !mine.includes(limit) && !others.includes(limit));
  const byArea = [...new Set(lighter.map((limit) => limit.area))].map(
    (area) => `${area} ${lighter.filter((limit) => limit.area === area).length}`,
  );
  return {
    kind: "design-audit-report",
    title: "Design audit report",
    lede: "How far the design system of this repository has got: what answers each standard decision and what holds the answer, the tier reached, and what the next one lacks.",
    origin,
    version: VERSION,
    scope: [
      `Stylesheets: ${result.stylesheets.join(", ") || "none found under src/"}`,
      `${plural(result.source_files, "source file", "source files")} of the repository's own screens and components, searched for values written around a scale`,
      result.ledger
        ? `The ledger ${LEDGER_FILE}: ${plural(result.ledger.total, "row", "rows")}, ${result.ledger.automatic} naming a check that can be found`
        : `No ledger: ${LEDGER_FILE} is not there`,
      `${decisions.length} standard decisions, ${c.core} of them core`,
      `${plural(result.contract.length, "ledger file", "ledger files")}, against the one shape of the contract`,
      `${result.tiers.length} deliverable tiers, lowest first`,
    ],
    decision: {
      conclusion: `${c.answered} of ${c.core} core decisions are answered, and ${broken.length === 0 ? "none is" : plural(broken.length, "decision is", "decisions are")} failing, unheld or gone around. ${reached}.`,
      figures: [
        { value: String(c.answered), of: String(c.core), label: "core decisions answered" },
        { value: String(c.held), label: "held, and run again here" },
        { value: String(c.claimed), label: "claimed, and not run again" },
        { value: String(c.recorded), label: "recorded: a person's call" },
      ],
      attention: attention.slice(0, 3),
      decide,
    },
    findings,
    register,
    recommendations,
    next,
    blind: [
      ...mine.map(({ id, note }) => ({ id, note, group: "Of this report itself" })),
      ...others.map(({ id, note }) => ({
        id,
        note,
        group: "Of what it counts on, where a check can stay green while what it holds is broken",
      })),
    ],
    after: {
      next: named ? null : nextLine,
      blind:
        lighter.length > 0
          ? `${plural(lighter.length, "more open limit of this plugin is", "more open limits of this plugin are")} lighter. Each is a row of ${LIMITS_FILE}, and is given under blind with --json. By area: ${byArea.join(", ")}.`
          : null,
    },
    empty: {
      findings: "No decision is failing, unheld or gone around, and no tier rests on a claim.",
    },
  };
}

const CALL =
  "usage: node inventory.mjs [--target DIR] [--json] [--all] [--out DIR [--format html|pdf]]\n";

async function main(args) {
  const call = readCall(args, { "--all": "switch", ...DOCUMENT_FLAGS });
  if (call.problem) return refuse(call.problem, CALL);
  if (call.help) return void stdout.write(CALL);
  // A wrong call for a document is refused before anything is read.
  const asked = requested(call);
  const all = call.flags["--all"] === true;
  const result = inventory(call.target);
  const handed = await handOver(asked, call.target, (origin) =>
    documentOf(result, origin, { all }),
  );
  return finish({
    json: call.json,
    result: { ...result, ...handed.data },
    text: `${report(result, { all })}${handed.text}`,
    work: result.decisions.some((decision) => BROKEN.includes(decision.state)) || handed.work,
  });
}

await start(import.meta.url, main);
