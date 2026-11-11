// Writes what the guide decided into a repository. Adds and updates only its own files and its own
// block in src/index.css. Running it again with the same blueprint changes nothing.
// Usage: node apply.mjs --target DIR [--dry-run]
import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  realpathSync,
  writeFileSync,
} from "node:fs";
import path from "node:path";
import { argv, exit, stderr, stdout } from "node:process";
import { fileURLToPath } from "node:url";

import { formatOklch } from "../templates/tools/design-assembly/color.mjs";
import {
  applyBlock,
  buildTheme,
  renderBlock,
  THRESHOLDS,
} from "../templates/tools/design-assembly/theme.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const PLUGIN = path.resolve(HERE, "..");
const BLUEPRINT = "design/blueprint.json";
const LAYER_STATUSES = ["pending", "decided", "planned"];
const SOURCES = ["user", "proposed", "repo"];

const readJson = (file) => JSON.parse(readFileSync(file, "utf8"));
export const LAYERS = readJson(path.join(PLUGIN, "references/layers.json")).layers;

// One line per problem in the blueprint. Empty means it can be applied.
export function blueprintProblems(blueprint) {
  const found = [];
  if (blueprint.status !== "approved") found.push('status must be "approved" before applying');
  for (const layer of LAYERS) {
    const entry = blueprint.layers?.[layer.id];
    if (!entry) {
      found.push(`${layer.id}: missing`);
      continue;
    }
    if (!LAYER_STATUSES.includes(entry.status)) {
      found.push(`${layer.id}: status must be one of ${LAYER_STATUSES.join(", ")}`);
    }
    if (!layer.built) {
      if (entry.status !== "planned")
        found.push(`${layer.id}: not built yet, status must be planned`);
      continue;
    }
    if (entry.status !== "decided") {
      found.push(`${layer.id}: must be decided`);
      continue;
    }
    if (!SOURCES.includes(entry.source)) {
      found.push(`${layer.id}: source must be one of ${SOURCES.join(", ")}`);
    }
    if (typeof entry.why !== "string" || entry.why.trim() === "") found.push(`${layer.id}: no why`);
    for (const choice of layer.choices) {
      const value = entry.choice?.[choice.key];
      if (value === undefined) found.push(`${layer.id}: no ${choice.name}`);
      else if (choice.options && !(value in choice.options)) {
        found.push(
          `${layer.id}: ${choice.name} must be one of ${Object.keys(choice.options).join(", ")}`,
        );
      }
    }
  }
  const color = blueprint.layers?.foundations?.choice?.source_color;
  if (color !== undefined && !/^#[0-9a-f]{6}$/i.test(String(color))) {
    found.push("foundations: source color must be a #rrggbb colour");
  }
  return found;
}

// Why this folder cannot take the result, or null. The guide builds on a floor; it does not lay one.
export function floorProblem(target) {
  if (!existsSync(path.join(target, "src/index.css"))) {
    return "src/index.css is missing: this repository has no design floor to build on";
  }
  const makefile = path.join(target, "Makefile");
  if (!existsSync(makefile) || !/^-?include mk\/\*\.mk/m.test(readFileSync(makefile, "utf8"))) {
    return "the Makefile does not include mk/*.mk, so the checks could not join make check";
  }
  return null;
}

function decisions(blueprint, theme) {
  const choice = (layer) => blueprint.layers[layer].choice;
  const source = (layer) => blueprint.layers[layer].source;
  const level = choice("accessibility").conformance_level;
  const rows = [
    {
      id: "context.product-type",
      layer: "context",
      kind: "judgment",
      value: choice("context").product_type,
      source: source("context"),
    },
    {
      id: "accessibility.conformance-level",
      layer: "accessibility",
      kind: "standard",
      value: level,
      source: source("accessibility"),
    },
    {
      id: "foundations.source-color",
      layer: "foundations",
      kind: "judgment",
      value: choice("foundations").source_color,
      source: source("foundations"),
    },
    {
      id: "foundations.tonal-palette",
      layer: "foundations",
      kind: "formula",
      value: `${theme.palette.length} tones`,
      check: { kind: "generated" },
    },
  ];
  for (const mode of theme.modes) {
    const scope = mode.selector;
    const suffix = scope === ":root" ? "light" : "dark";
    rows.push(
      {
        id: `foundations.color-role.primary.${suffix}`,
        layer: "foundations",
        kind: "formula",
        value: formatOklch(mode.primary),
        check: {
          kind: "contrast",
          scope,
          foreground: "--primary",
          background: "--background",
          min: THRESHOLDS[level].text,
        },
      },
      {
        id: `foundations.color-role.on-primary.${suffix}`,
        layer: "foundations",
        kind: "formula",
        value: formatOklch(mode.onPrimary),
        check: {
          kind: "contrast",
          scope,
          foreground: "--primary-foreground",
          background: "--primary",
          min: THRESHOLDS[level].text,
        },
      },
    );
  }
  rows.push({
    id: "conformance.gate",
    layer: "conformance",
    kind: "standard",
    value: choice("conformance").gate,
    source: source("conformance"),
    check: { kind: "gate" },
  });
  return {
    version: 1,
    inputs: { sourceColor: choice("foundations").source_color, conformanceLevel: level },
    decisions: rows,
  };
}

// One page per decided layer: what was chosen, why, what was turned down, what the machine holds.
function record(layer, entry, rows) {
  const lines = [`# ${layer.title[0].toUpperCase()}${layer.title.slice(1)}`, ""];
  lines.push(`Status: decided (${entry.source}).`, "", "## Choice", "");
  for (const choice of layer.choices) {
    lines.push(`- ${choice.name}: \`${entry.choice[choice.key]}\``);
  }
  lines.push("", "## Why", "", entry.why.trim(), "", "## Rejected", "");
  const rejected = entry.rejected ?? [];
  if (rejected.length === 0) lines.push("Nothing was turned down.");
  for (const item of rejected) lines.push(`- ${item.option}: ${item.why}`);
  lines.push("", "## What is held", "");
  for (const row of rows.filter((r) => r.layer === layer.id)) {
    const how = row.check ? `checked (${row.check.kind})` : "no check";
    lines.push(`- \`${row.id}\`: ${row.kind}, ${how}`);
  }
  return `${lines.join("\n")}\n`;
}

// Every file the guide owns in the target, with the content it should have.
export function plan(target, blueprint) {
  const cssPath = path.join(target, "src/index.css");
  const css = readFileSync(cssPath, "utf8");
  const inputs = {
    sourceColor: blueprint.layers.foundations.choice.source_color,
    conformanceLevel: blueprint.layers.accessibility.choice.conformance_level,
  };
  const theme = buildTheme(inputs, css);
  const ledger = decisions(blueprint, theme);
  const files = { "src/index.css": applyBlock(css, renderBlock(theme)) };
  files["design/decisions.json"] = `${JSON.stringify(ledger, null, 2)}\n`;
  for (const layer of LAYERS.filter((l) => l.built)) {
    files[`design/decisions/${layer.id}.md`] = record(
      layer,
      blueprint.layers[layer.id],
      ledger.decisions,
    );
  }
  const templates = path.join(PLUGIN, "templates");
  for (const folder of ["tools/design-assembly", "mk"]) {
    for (const name of readdirSync(path.join(templates, folder))) {
      files[`${folder}/${name}`] = readFileSync(path.join(templates, folder, name), "utf8");
    }
  }
  return { files, theme };
}

function main() {
  const args = argv.slice(2);
  const at = args.indexOf("--target");
  if (at === -1 || !args[at + 1]) {
    stderr.write("usage: node apply.mjs --target DIR [--dry-run]\n");
    exit(2);
  }
  const target = path.resolve(args[at + 1]);
  const dryRun = args.includes("--dry-run");
  const stop = (message) => {
    stderr.write(`design-assembly: ${message}\n`);
    exit(2);
  };
  const floor = floorProblem(target);
  if (floor) stop(floor);
  const blueprintPath = path.join(target, BLUEPRINT);
  if (!existsSync(blueprintPath)) stop(`${BLUEPRINT} is missing. Run the guide first.`);
  const blueprint = readJson(blueprintPath);
  const problems = blueprintProblems(blueprint);
  if (problems.length > 0) stop(`${BLUEPRINT} cannot be applied:\n  ${problems.join("\n  ")}`);

  const { files, theme } = plan(target, blueprint);
  for (const [file, content] of Object.entries(files)) {
    const full = path.join(target, file);
    const before = existsSync(full) ? readFileSync(full, "utf8") : null;
    const state = before === null ? "create" : before === content ? "unchanged" : "update";
    if (state !== "unchanged" && !dryRun) {
      mkdirSync(path.dirname(full), { recursive: true });
      writeFileSync(full, content);
    }
    stdout.write(`${state.padEnd(9)} ${file}\n`);
  }
  for (const mode of theme.modes.filter((m) => m.adjusted)) {
    stdout.write(
      `note: in ${mode.selector} the source color does not meet the contrast threshold; ` +
        `primary was moved to ${formatOklch(mode.primary)}\n`,
    );
  }
}

if (argv[1] && realpathSync(argv[1]) === realpathSync(fileURLToPath(import.meta.url))) main();
