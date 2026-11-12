// The audit tier: reads a repository and says, for each foundations decision, whether it is
// undecided, bypassed, decided but not held, claimed, or held. Read-only. Works on any repository,
// with or without the design floor. The same repository state always gives the same report.
// Usage: node inventory.mjs --target DIR [--json]
import { existsSync, readdirSync, readFileSync, realpathSync, statSync } from "node:fs";
import path from "node:path";
import { argv, exit, stderr, stdout } from "node:process";
import { fileURLToPath } from "node:url";

import { readState, runChecks } from "../templates/tools/design-assembly/check.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const TIERS = JSON.parse(readFileSync(path.join(HERE, "../references/tiers.json"), "utf8")).tiers;

const SKIP_DIRS = new Set(["node_modules", "dist", "coverage", "test-results", "generated"]);
// Code the repository did not write: a vendor's components are not the repository's decisions.
const VENDOR = /(^|\/)components\/(ui|reui)\//;

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

// Places in the repository's own source that go around a decision.
const BYPASS = {
  color: /\[#[0-9a-fA-F]{3,8}\]|["'`\s:]#[0-9a-fA-F]{6}\b/g,
  type: /\btext-\[[^\]]*(?:px|rem|em)\]/g,
  spacing: /\b(?:p|px|py|pt|pb|pl|pr|m|mx|my|mt|mb|ml|mr|gap|space-x|space-y)-\[[^\]]+\]/g,
  shape: /\brounded(?:-[a-z]{1,2})?-\[[^\]]+\]/g,
};

function bypasses(root, sources) {
  const result = Object.fromEntries(
    Object.keys(BYPASS).map((key) => [key, { count: 0, files: [] }]),
  );
  for (const file of sources) {
    const text = read(root, file) ?? "";
    for (const [key, pattern] of Object.entries(BYPASS)) {
      const hits = text.match(pattern)?.length ?? 0;
      if (hits > 0) {
        result[key].count += hits;
        result[key].files.push(`${file} (${hits})`);
      }
    }
  }
  return result;
}

// The repository's own ledger in block-style YAML: a list of maps with plain values.
export function readYamlLedger(text) {
  const rows = [];
  for (const line of text.split("\n")) {
    const start = /^\s*-\s+id:\s*(.+)$/.exec(line);
    if (start) {
      rows.push({ id: unquote(start[1]) });
      continue;
    }
    const field = /^\s+([a-z_]+):\s*(.*)$/.exec(line);
    if (field && rows.length > 0) rows[rows.length - 1][field[1]] = unquote(field[2]);
  }
  return rows;
}
const unquote = (value) => value.trim().replace(/^["']|["']$/g, "");

function ledgers(root) {
  const own = read(root, "design/decisions.json");
  const foreign = read(root, "design/decisions.yaml");
  let results = null;
  if (own !== null) {
    const state = readState(root);
    results = runChecks(state).map((r) => ({
      ...r,
      held: r.checked && r.problem === null && r.seenFailing,
    }));
  }
  return {
    own: results,
    foreign: foreign === null ? null : readYamlLedger(foreign),
  };
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

const TOPICS = [
  {
    id: "color-role",
    term: "color role",
    variable: "--primary",
    bypass: "color",
    own: /^foundations\.color-role/,
    foreign: /colou?r/,
    lint: /no-raw-colors|no-hardcoded-color/,
  },
  {
    id: "type-scale",
    term: "type scale",
    variable: null,
    bypass: "type",
    own: /^foundations\.type-scale/,
    foreign: /type|font/,
    lint: /no-arbitrary-values|no-arbitrary-text-size/,
  },
  {
    id: "spacing-scale",
    term: "spacing scale",
    variable: null,
    bypass: "spacing",
    own: /^foundations\.spacing-scale/,
    foreign: /spacing|space/,
    lint: /no-arbitrary-values/,
  },
  {
    id: "shape",
    term: "shape",
    variable: "--radius",
    bypass: "shape",
    own: /^foundations\.shape/,
    foreign: /radius|shape/,
    lint: /no-arbitrary-values/,
  },
];

function topicRow(topic, facts) {
  const declared = topic.variable
    ? facts.declared.filter((d) => d.name === topic.variable && d.scope === ":root")
    : [];
  const decided = topic.variable ? declared.length > 0 : facts.tailwind;
  const value = topic.variable
    ? (declared.at(-1)?.value ?? null)
    : facts.tailwind
      ? "the framework's default scale"
      : null;
  const bypass = facts.bypass[topic.bypass];
  const ownRows = (facts.ledgers.own ?? []).filter((r) => topic.own.test(r.id));
  const foreignRows = (facts.ledgers.foreign ?? []).filter(
    (r) => r.layer === "foundations" && topic.foreign.test(r.id) && r.check,
  );
  const lint = topic.lint.exec(facts.eslint)?.[0] ?? null;

  let state;
  let heldBy = null;
  if (!decided) state = "undecided";
  else if (bypass.count > 0) state = "bypassed";
  else if (ownRows.length > 0 && ownRows.every((r) => r.held)) {
    state = "held";
    heldBy = `${ownRows.length} check(s) of design/decisions.json, run now`;
  } else if (foreignRows.length > 0) {
    state = "claimed";
    heldBy = `design/decisions.yaml: ${foreignRows.map((r) => `${r.id} (${r.check})`).join(", ")}`;
  } else if (lint) {
    state = "claimed";
    heldBy = `lint rule ${lint}`;
  } else state = "decided-not-held";

  return {
    id: topic.id,
    term: topic.term,
    state,
    value,
    where: declared.map((d) => d.file).filter((file, index, all) => all.indexOf(file) === index),
    held_by: heldBy,
    bypassed: bypass.count,
    bypassed_in: bypass.files.slice(0, 5),
  };
}

// A decision only a person makes. It is recorded or it is not: no check holds it, by design.
function judgmentRow(id, term, value, where) {
  return {
    id,
    term,
    state: value ? "recorded" : "undecided",
    value: value ?? null,
    where,
    held_by: null,
    bypassed: 0,
    bypassed_in: [],
  };
}

function need(root, item, facts) {
  if (item.kind === "readable") {
    return { ok: facts.declared.length > 0, what: "a stylesheet that declares custom properties" };
  }
  if (item.kind === "decisions") {
    const open = facts.rows.filter((r) => !["held", "claimed", "recorded"].includes(r.state));
    return {
      ok: open.length === 0,
      what: `every ${item.layer} decision held or recorded`,
      missing: open.map((r) => `${r.term}: ${r.state}`),
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
  const setup = JSON.parse(read(root, ".repo-setup.json") ?? "{}");
  const blueprint = JSON.parse(read(root, "design/blueprint.json") ?? "{}");
  const facts = {
    declared: declarations(root, sheets),
    tailwind: sheets.some((file) => /@import\s+["']tailwindcss["']/.test(read(root, file) ?? "")),
    bypass: bypasses(root, sources),
    ledgers: ledgers(root),
    eslint: ["eslint.config.js", "eslint.config.mjs", "eslint.config.ts"]
      .map((file) => read(root, file) ?? "")
      .join("\n"),
    sockets: sockets(root),
  };
  const foreign = facts.ledgers.foreign ?? [];
  const level =
    blueprint.layers?.accessibility?.choice?.conformance_level ??
    foreign.find((r) => /conformance|accessib|a11y|wcag/i.test(`${r.id} ${r.source ?? ""}`))
      ?.source;
  const productType =
    blueprint.layers?.context?.choice?.product_type ??
    { tool: "application", content: "content-site" }[setup.vars?.design_surface];
  facts.rows = [
    judgmentRow(
      "product-type",
      "product type",
      productType,
      productType ? ["recorded in the repository"] : [],
    ),
    judgmentRow(
      "conformance-level",
      "conformance level",
      level,
      level ? ["recorded in the repository"] : [],
    ),
    ...TOPICS.map((topic) => topicRow(topic, facts)),
  ];

  let reachable = true;
  const tiers = TIERS.map((tier) => {
    const needs = tier.needs.map((item) => need(root, item, facts));
    const complete = needs.every((n) => n.ok);
    const state = !complete
      ? "missing"
      : !tier.verified
        ? "present"
        : reachable
          ? "reached"
          : "blocked";
    if (state !== "reached") reachable = false;
    return { id: tier.id, maps_to: tier.maps_to, state, needs };
  });

  const count = (state) => facts.rows.filter((r) => r.state === state).length;
  return {
    stylesheets: sheets,
    source_files: sources.length,
    decisions: facts.rows,
    rate: { held: count("held"), claimed: count("claimed"), total: facts.rows.length },
    ledgers: {
      "design/decisions.json": facts.ledgers.own
        ? {
            decisions: facts.ledgers.own.length,
            held: facts.ledgers.own.filter((r) => r.held).length,
          }
        : null,
      "design/decisions.yaml": facts.ledgers.foreign
        ? { decisions: foreign.length, with_check: foreign.filter((r) => r.check).length }
        : null,
    },
    sockets: facts.sockets,
    tiers,
  };
}

const LABEL = {
  held: "held",
  claimed: "claimed",
  recorded: "recorded",
  "decided-not-held": "not held",
  bypassed: "BYPASSED",
  undecided: "undecided",
};

export function report(result) {
  const lines = [];
  lines.push(`stylesheets: ${result.stylesheets.join(", ") || "none found under src/"}`);
  lines.push(`source files read: ${result.source_files} (vendor components left out)`, "");
  lines.push("decisions:");
  for (const row of result.decisions) {
    lines.push(`  ${LABEL[row.state].padEnd(9)} ${row.term}${row.value ? `: ${row.value}` : ""}`);
    if (row.held_by) lines.push(`            by ${row.held_by}`);
    if (row.bypassed > 0) {
      lines.push(
        `            ${row.bypassed} place(s) go around it: ${row.bypassed_in.join(", ")}`,
      );
    }
  }
  const { held, claimed, total } = result.rate;
  lines.push(
    "",
    `determinism rate now: ${held}/${total} held and re-run here; ${claimed} more claimed by the repository, not re-run`,
  );
  for (const [file, ledger] of Object.entries(result.ledgers)) {
    if (ledger === null) continue;
    const detail = "held" in ledger ? `${ledger.held} held` : `${ledger.with_check} name a check`;
    lines.push(`ledger ${file}: ${ledger.decisions} decisions, ${detail}`);
  }
  lines.push("", "tiers:");
  for (const tier of result.tiers) {
    const level = tier.maps_to ? ` (${tier.maps_to})` : "";
    const note = {
      reached: "reached",
      missing: "not reached",
      blocked: "complete, but a lower tier is not",
      present: "artifacts present, not verified in this version",
    }[tier.state];
    lines.push(`  ${tier.id}${level}: ${note}`);
    for (const item of tier.needs.filter((n) => !n.ok)) {
      lines.push(
        `      missing: ${item.what}${item.missing?.length ? ` (${item.missing.join("; ")})` : ""}`,
      );
    }
  }
  return `${lines.join("\n")}\n`;
}

function main() {
  const args = argv.slice(2);
  const at = args.indexOf("--target");
  if (at === -1 || !args[at + 1]) {
    stderr.write("usage: node inventory.mjs --target DIR [--json]\n");
    exit(2);
  }
  const root = path.resolve(args[at + 1]);
  if (!existsSync(root)) {
    stderr.write(`design-assembly: ${root} does not exist\n`);
    exit(2);
  }
  const result = inventory(root);
  stdout.write(args.includes("--json") ? `${JSON.stringify(result, null, 2)}\n` : report(result));
}

if (argv[1] && realpathSync(argv[1]) === realpathSync(fileURLToPath(import.meta.url))) main();
