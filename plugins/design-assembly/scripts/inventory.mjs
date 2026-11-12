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

const HERE = path.dirname(fileURLToPath(import.meta.url));
const reference = (name) =>
  JSON.parse(readFileSync(path.join(HERE, "../references", name), "utf8"));
const TIERS = reference("tiers.json").tiers;
const STANDARD = reference("standard-decisions.json");

const SKIP_DIRS = new Set(["node_modules", "dist", "coverage", "test-results", "generated"]);
// Code the repository did not write: a vendor's components are not the repository's decisions.
const VENDOR = /(^|\/)components\/(ui|reui)\//;
// A decision is answered when it is held, claimed or recorded.
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
function fromLedger(root, row, held) {
  if (row.kind === "judgment") return { state: "recorded", by: "the ledger" };
  if (!row.check) return { state: "not-held", by: null };
  if (row.check === TOOL) {
    return held.has(row.id)
      ? { state: "held", by: "this plugin's tool, run now" }
      : { state: "failing", by: "this plugin's tool reports a problem" };
  }
  const broken = pointerProblem(root, row.id, row.check);
  return broken ? { state: "failing", by: broken } : { state: "claimed", by: row.check };
}

// The state of a decision with no row, from what the repository shows.
function fromRepository(decision, facts) {
  const usage = USAGE[decision.id];
  if (usage) {
    const decided = usage.variable
      ? facts.declared.some((d) => d.name === usage.variable && d.scope === ":root")
      : facts.tailwind;
    if (!decided) return { state: "undecided", by: null };
    const lint = usage.lint.exec(facts.eslint)?.[0];
    return lint
      ? { state: "claimed", by: `lint rule ${lint}, not a row of the ledger` }
      : { state: "not-held", by: null };
  }
  const seen = {
    "product-type": facts.setup.vars?.design_surface && ".repo-setup.json",
    "source-color":
      (facts.setup.vars?.brand_primary && ".repo-setup.json") ||
      (facts.declared.some((d) => d.name === "--primary" && d.scope === ":root") &&
        "the stylesheet's --primary"),
    "conformance-level":
      facts.rows.find(
        (r) => /\bA{2,3}\b/.test(r.source ?? "") && /wcag/i.test(`${r.id} ${r.source}`),
      ) && "the source of an accessibility row of the ledger",
  }[decision.id];
  // No row and nothing the audit can read: it cannot tell "never decided" from "decided somewhere
  // the ledger does not say". Either way the next step is a row.
  return seen ? { state: "recorded", by: seen } : { state: "no-row", by: null };
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
  if (item.kind === "file") {
    const file = facts.sockets[item.socket] ?? item.path;
    return { ok: existsSync(path.join(root, file)), what: file };
  }
  if (item.kind === "any-file") {
    const found = item.paths.find((file) => existsSync(path.join(root, file)));
    return { ok: Boolean(found), what: found ?? `one of ${item.paths.join(", ")}` };
  }
  if (item.kind === "folder") {
    const files = walk(root, item.path, (file) => file.endsWith(item.extension)).filter(
      (file) => !/(README|lech-lot)\.md$/.test(file),
    );
    return {
      ok: files.length > 0,
      what: `${item.path}/*${item.extension} (${files.length} found)`,
    };
  }
  throw new Error(`unknown need ${item.kind}`);
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
  const held = new Set(
    state.theme
      ? runChecks(state)
          .filter((r) => r.held)
          .map((r) => r.id)
      : [],
  );

  facts.decisions = STANDARD.decisions.map((decision) => {
    const row = rows.find((r) => r.id === decision.id);
    const found = row ? fromLedger(root, row, held) : fromRepository(decision, facts);
    const around = bypass[decision.id] ?? { count: 0, files: [] };
    return {
      id: decision.id,
      layer: decision.layer,
      tier: decision.tier ?? STANDARD.layers[decision.layer].tier,
      core: decision.sources.length >= 2,
      question: decision.question,
      in_ledger: Boolean(row),
      // Source that goes around a decision outranks whatever claims to hold it.
      state:
        around.count > 0 && !["undecided", "no-row"].includes(found.state)
          ? "bypassed"
          : found.state,
      by: found.by,
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
  lines.push(`source files read: ${result.source_files} (vendor components left out)`);
  const c = result.coverage;
  lines.push(
    "",
    `coverage: ${c.answered} of ${c.core} core decisions answered (${c.held} held and re-run here, ${c.claimed} claimed and not re-run, ${c.recorded} recorded)`,
  );
  if (result.ledger) {
    const l = result.ledger;
    lines.push(
      `ledger design/decisions.yaml: ${l.total} decisions, ${l.automatic} with a check that resolves`,
    );
    if (l.own_decisions.length > 0)
      lines.push(
        `  ${l.own_decisions.length} of them are the repository's own, beyond the standard ones`,
      );
    if (l.old_layer_names.length > 0)
      lines.push(`  ${l.old_layer_names.length} row(s) use an older layer name`);
  } else lines.push("ledger design/decisions.yaml: none");
  lines.push("", "tiers:");
  for (const tier of result.tiers) {
    lines.push(`  ${tier.id}${tier.maps_to ? ` (${tier.maps_to})` : ""}: ${NOTE[tier.state]}`);
    for (const item of tier.needs) {
      if (item.missing === undefined && !item.ok) lines.push(`      missing: ${item.what}`);
      if (item.missing !== undefined) lines.push(`      ${item.what}`);
    }
    const mine = result.decisions.filter((d) => d.tier === tier.id && d.core);
    for (const decision of mine.filter((d) => all || !ANSWERED.includes(d.state))) {
      lines.push(...line(decision));
    }
  }
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
