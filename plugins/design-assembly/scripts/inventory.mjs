// The audit tier: reads a repository and says, for each standard decision of a design system,
// whether it is undecided, bypassed, decided but not held, claimed, held or recorded; then which
// tier the repository has reached. Read-only. Works on any repository, with or without the design
// floor. The same repository state always gives the same report.
// Usage: node inventory.mjs --target DIR [--json] [--all]
import { existsSync, readdirSync, readFileSync, realpathSync, statSync } from "node:fs";
import path from "node:path";
import { argv, exit, stderr, stdout } from "node:process";
import { fileURLToPath } from "node:url";

import { readState, runChecks } from "../templates/tools/design-assembly/check.mjs";
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
import { findProofs } from "./proofs.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const reference = (name) =>
  JSON.parse(readFileSync(path.join(HERE, "../references", name), "utf8"));
const TIERS = reference("tiers.json").tiers;
const STANDARD = reference("standard-decisions.json");

const SKIP_DIRS = new Set(["node_modules", "dist", "coverage", "test-results", "generated"]);
// Code the repository did not write: a vendor's components are not the repository's decisions.
const VENDOR = /(^|\/)components\/(ui|reui)\//;
// A decision is answered when the ledger has a row for it that is held, claimed or recorded.
// What the audit can see without a row is said beside the decision, and is not an answer.
const ANSWERED = ["held", "claimed", "recorded"];

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
function fromLedger(root, row, held, proofs) {
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
      : facts.tailwind;
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
  const calls = decisions.filter(
    (d) => ["product-type", "conformance-level", "source-color"].includes(d.id) && !d.in_ledger,
  );
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
    .flatMap(([, text]) => text.match(/eslint-disable[^\n]*/g) ?? []);
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
    tailwind: sheets.some((file) => /@import\s+["']tailwindcss["']/.test(read(root, file) ?? "")),
    eslint: ["eslint.config.js", "eslint.config.mjs", "eslint.config.ts"]
      .map((file) => read(root, file) ?? "")
      .join("\n"),
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
    const found = row ? fromLedger(root, row, held, facts.proofs) : fromRepository(decision, facts);
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
    ledger:
      rows.length === 0
        ? null
        : {
            ...ledgerRate(root, rows),
            own_decisions: rows.filter((r) => !standardIds.has(r.id)).map((r) => r.id),
            old_layer_names: oldLayerNames(rows),
          },
    sockets: facts.sockets,
    tiers,
    departures: departures(root),
    slips: slips(root),
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
  const open = result.decisions.filter(
    (d) => d.state === "recorded" && /has not (confirmed|reviewed)/.test(d.note ?? ""),
  );
  if (open.length > 0) {
    lines.push(
      `  ${open.length} of the recorded are a proposal a person has not confirmed: ${open.map((d) => d.id).join(", ")}`,
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

function main() {
  const args = argv.slice(2);
  const at = args.indexOf("--target");
  if (at === -1 || !args[at + 1]) {
    stderr.write("usage: node inventory.mjs --target DIR [--json] [--all]\n");
    exit(2);
  }
  const root = path.resolve(args[at + 1]);
  if (!existsSync(root)) {
    stderr.write(`design-assembly: ${root} does not exist\n`);
    exit(2);
  }
  const result = inventory(root);
  stdout.write(
    args.includes("--json")
      ? `${JSON.stringify(result, null, 2)}\n`
      : report(result, { all: args.includes("--all") }),
  );
}

if (argv[1] && realpathSync(argv[1]) === realpathSync(fileURLToPath(import.meta.url))) main();
