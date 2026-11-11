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

import { contrast, formatOklch } from "../templates/tools/design-assembly/color.mjs";
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

// The layers the theme is computed from. A preview needs only these.
const THEME_LAYERS = ["accessibility", "foundations"];

// One line per problem in the blueprint. Empty means it can be applied, or, with `preview`, that a
// preview can be shown: a preview is what the person looks at BEFORE approving, so it accepts a
// blueprint that is still being designed, and built layers that are still pending, as long as the
// layers the theme comes from are decided.
export function blueprintProblems(blueprint, { preview = false } = {}) {
  const found = [];
  if (!preview && blueprint.status !== "approved") {
    found.push(
      'status must be "approved" before applying (a preview with --dry-run does not need it)',
    );
  }
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
      const enoughForPreview = preview && !THEME_LAYERS.includes(layer.id);
      if (!enoughForPreview) found.push(`${layer.id}: must be decided`);
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
      // Which level to commit to is a person's call on risk; what the level requires is checked in
      // every contrast decision below.
      kind: "judgment",
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
  // A plain string is an option rejected without a reason; written that way, not as "undefined".
  for (const item of rejected) {
    if (typeof item === "string") lines.push(`- ${item}: no reason recorded`);
    else lines.push(`- ${item.option}: ${item.why ?? "no reason recorded"}`);
  }
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

const USAGE = `usage: node apply.mjs --target DIR [--dry-run]

  --dry-run  Preview without writing: the primary color role for light and dark, the contrast
             ratio each reaches, and the files that would change. Works before approval, as soon
             as accessibility and foundations are decided.
  (none)     Write. Needs design/blueprint.json with status "approved" and every built layer
             decided.
`;

// What the person needs to see to approve the foundations: one line per mode, with the numbers.
export function themeSummary(theme) {
  const ratio = (value) => `${value.toFixed(2)}:1`;
  const lines = [`contrast threshold for text: ${theme.thresholds.text}:1`];
  for (const mode of theme.modes) {
    const name = mode.selector === ":root" ? "light" : "dark";
    const kept = mode.adjusted
      ? "the source color does not reach the threshold here, so the primary keeps its hue and moves its lightness"
      : "the primary is the source color itself";
    lines.push(
      `${name}: primary ${formatOklch(mode.primary)}, ${ratio(contrast(mode.primary, mode.background))} on the background; ` +
        `on-primary ${formatOklch(mode.onPrimary)}, ${ratio(contrast(mode.onPrimary, mode.primary))} on the primary. ${kept}.`,
    );
  }
  return lines;
}

function main() {
  const args = argv.slice(2);
  if (args.includes("--help") || args.includes("-h")) {
    stdout.write(USAGE);
    exit(0);
  }
  const at = args.indexOf("--target");
  if (at === -1 || !args[at + 1]) {
    stderr.write(USAGE);
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
  const problems = blueprintProblems(blueprint, { preview: dryRun });
  if (problems.length > 0) {
    const what = dryRun ? "previewed" : "applied";
    stop(`${BLUEPRINT} cannot be ${what}:\n  ${problems.join("\n  ")}`);
  }

  const css = readFileSync(path.join(target, "src/index.css"), "utf8");
  const theme = buildTheme(
    {
      sourceColor: blueprint.layers.foundations.choice.source_color,
      conformanceLevel: blueprint.layers.accessibility.choice.conformance_level,
    },
    css,
  );
  for (const line of themeSummary(theme)) stdout.write(`${line}\n`);

  const pending = LAYERS.filter((l) => l.built && blueprint.layers[l.id].status !== "decided");
  if (pending.length > 0) {
    stdout.write(
      `files: shown once these layers are decided: ${pending.map((l) => l.title).join(", ")}\n`,
    );
    return;
  }
  const { files } = plan(target, blueprint);
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
  if (dryRun) stdout.write("preview only: nothing was written\n");
}

if (argv[1] && realpathSync(argv[1]) === realpathSync(fileURLToPath(import.meta.url))) main();
