// Writes what the guide decided into a repository. Adds and updates only its own files, its own
// block in src/index.css and its own rows of the ledger. Running it again with the same blueprint
// changes nothing.
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

import { FILES } from "../templates/tools/design-assembly/check.mjs";
import { contrast, formatOklch } from "../templates/tools/design-assembly/color.mjs";
import { mergeLedger, TOOL } from "../templates/tools/design-assembly/ledger.mjs";
import { SPACING_UNIT_PX, TYPE_STEPS } from "../templates/tools/design-assembly/scale.mjs";
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
const THEME_LAYERS = ["context", "foundations"];

// Foundations choices added after the first version. A blueprint decided before they existed keeps
// the floor's values, and the guide says so instead of refusing it.
const FOUNDATIONS_DEFAULTS = {
  type_scale: "standard",
  spacing_unit: "4px",
  corner_radius: "floor",
};

// The floor's text-xs. A modular step below it is shown as a note, not refused: no standard sets a
// minimum text size.
const FLOOR_SMALLEST_PX = 12;
const TYPE_VARIABLES = TYPE_STEPS.flatMap(([step]) => [
  `--text-${step}`,
  `--text-${step}--line-height`,
]);

// Whether a choice applies, given the other choices of its layer.
const applies = (choice, values) =>
  Object.entries(choice.when ?? {}).every(([key, value]) => values[key] === value);

export function themeInputs(blueprint) {
  const decided = blueprint.layers?.foundations?.choice ?? {};
  const choice = { ...FOUNDATIONS_DEFAULTS, ...decided };
  const defaulted = Object.keys(FOUNDATIONS_DEFAULTS).filter((key) => !(key in decided));
  return {
    inputs: {
      sourceColor: choice.source_color,
      conformanceLevel: blueprint.layers?.context?.choice?.conformance_level,
      typeScale: choice.type_scale,
      ...(choice.type_scale === "modular" ? { typeRatio: choice.type_ratio } : {}),
      cornerRadius: choice.corner_radius,
    },
    choice,
    defaulted,
  };
}

// One line per problem in the blueprint. Empty means it can be applied, or, with `preview`, that a
// preview can be shown: a preview is what the person looks at BEFORE approving, so it accepts a
// blueprint that is still being designed.
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
    const values =
      layer.id === "foundations" ? themeInputs(blueprint).choice : (entry.choice ?? {});
    for (const choice of layer.choices.filter((c) => applies(c, values))) {
      const value = values[choice.key];
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

// The decisions this plugin answers, as ledger rows, and the checks its tool runs for each.
// Ids are those of references/standard-decisions.json.
function decisions(blueprint, theme, foundations) {
  const level = blueprint.layers.context.choice.conformance_level;
  const modular = foundations.choice.type_scale === "modular";
  const recorded = `${BLUEPRINT}`;
  const rows = [
    { id: "product-type", layer: "context", kind: "judgment", source: recorded },
    { id: "conformance-level", layer: "context", kind: "judgment", source: recorded },
    { id: "source-color", layer: "foundations", kind: "judgment", source: recorded },
    {
      id: "tonal-palette",
      layer: "foundations",
      kind: "formula",
      source: "the source color, tones 0 to 100",
      check: TOOL,
    },
    {
      id: "color-contrast",
      layer: "foundations",
      kind: "formula",
      source: `WCAG 2.2 level ${level}, contrast ratio for text`,
      check: TOOL,
    },
    {
      id: "type-scale-values",
      layer: "foundations",
      kind: modular ? "formula" : "standard",
      source: modular
        ? `modular scale, ${foundations.choice.type_ratio}`
        : "the framework's type scale",
      check: TOOL,
    },
    {
      id: "spacing-values",
      layer: "foundations",
      kind: "standard",
      source: `the framework's ${SPACING_UNIT_PX}px unit`,
      check: TOOL,
    },
    {
      id: "radius-value",
      layer: "foundations",
      kind: "closed",
      source: `shape scale, ${foundations.choice.corner_radius}`,
      check: TOOL,
    },
    {
      id: "checks-in-gate",
      layer: "governance",
      kind: "standard",
      source: "make check",
      check: TOOL,
    },
  ];
  const contrastChecks = theme.modes.flatMap((mode) => [
    {
      kind: "contrast",
      scope: mode.selector,
      foreground: "--primary",
      background: "--background",
      min: THRESHOLDS[level].text,
    },
    {
      kind: "contrast",
      scope: mode.selector,
      foreground: "--primary-foreground",
      background: "--primary",
      min: THRESHOLDS[level].text,
    },
  ]);
  const checks = {
    "tonal-palette": [{ kind: "generated" }],
    "color-contrast": contrastChecks,
    "type-scale-values": [
      modular ? { kind: "scale" } : { kind: "absent", variables: TYPE_VARIABLES },
    ],
    "spacing-values": [{ kind: "absent", variables: ["--spacing"] }],
    "radius-value": [
      { kind: "value", scope: ":root", variable: "--radius", expected: theme.radius },
    ],
    "checks-in-gate": [{ kind: "gate" }],
  };
  return { rows, data: { version: 1, inputs: foundations.inputs, checks } };
}

// One page per decided layer: what was chosen, why, what was turned down, what the machine holds.
function record(layer, entry, rows, values) {
  const lines = [`# ${layer.title[0].toUpperCase()}${layer.title.slice(1)}`, ""];
  lines.push(`Status: decided (${entry.source}).`, "", "## Choice", "");
  for (const choice of layer.choices.filter((c) => applies(c, values))) {
    const chosen = choice.key in (entry.choice ?? {});
    const note = chosen ? "" : " (not asked: the floor's value)";
    lines.push(`- ${choice.name}: \`${values[choice.key]}\`${note}`);
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
    const how = row.check ? "checked by this plugin's tool" : "a person's call, no check";
    lines.push(`- \`${row.id}\`: ${row.kind}, ${how}`);
  }
  return `${lines.join("\n")}\n`;
}

// Every file the guide owns in the target, with the content it should have.
export function plan(target, blueprint) {
  const read = (file) =>
    existsSync(path.join(target, file)) ? readFileSync(path.join(target, file), "utf8") : null;
  const css = read(FILES.css);
  const foundations = themeInputs(blueprint);
  const theme = buildTheme(foundations.inputs, css);
  const { rows, data } = decisions(blueprint, theme, foundations);
  const files = { [FILES.css]: applyBlock(css, renderBlock(theme)) };
  files[FILES.theme] = `${JSON.stringify(data, null, 2)}\n`;
  // The ledger may hold rows this plugin did not write: they are kept exactly as they are.
  files[FILES.ledger] = mergeLedger(read(FILES.ledger), rows);
  for (const layer of LAYERS.filter((l) => l.built)) {
    const entry = blueprint.layers[layer.id];
    const values = layer.id === "foundations" ? foundations.choice : entry.choice;
    files[`design/decisions/${layer.id}.md`] = record(layer, entry, rows, values);
  }
  const templates = path.join(PLUGIN, "templates");
  for (const folder of ["tools/design-assembly", "mk"]) {
    for (const name of readdirSync(path.join(templates, folder)).sort()) {
      files[`${folder}/${name}`] = readFileSync(path.join(templates, folder, name), "utf8");
    }
  }
  return { files, theme };
}

// A JSON file is the same when it holds the same data: the repository's formatter may lay it out
// differently, and rewriting it after every format would make the guide fight the formatter.
export function sameContent(file, before, after) {
  if (before === after) return true;
  if (!file.endsWith(".json")) return false;
  try {
    return JSON.stringify(JSON.parse(before)) === JSON.stringify(JSON.parse(after));
  } catch {
    return false;
  }
}

const USAGE = `usage: node apply.mjs --target DIR [--dry-run]

  --dry-run  Preview without writing: the primary color role for light and dark, the contrast
             ratio each reaches, the type scale, the corner radius, and the files that would
             change. Works before approval, as soon as context and foundations are decided.
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
  if (theme.type) {
    const steps = theme.type.map((s) => `${s.step} ${s.size}/${s.lineHeight}`).join(", ");
    lines.push(`type scale: modular, size/line height in px: ${steps}`);
    const small = theme.type.filter((s) => s.size < FLOOR_SMALLEST_PX);
    if (small.length > 0) {
      lines.push(
        `note: ${small.map((s) => `text-${s.step} is ${s.size}px`).join(", ")}, smaller than the ` +
          `floor's smallest size (${FLOOR_SMALLEST_PX}px). Use those steps sparingly, or pick a smaller ratio.`,
      );
    }
  } else if (theme.radius !== null) {
    lines.push("type scale: the floor's standard sizes, unchanged");
  }
  if (theme.radius !== null) {
    lines.push(`spacing scale: the floor's ${SPACING_UNIT_PX}px unit, unchanged`);
    lines.push(
      `corner radius: ${theme.radius}; the floor derives its smaller and larger radii from it`,
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

  const css = readFileSync(path.join(target, FILES.css), "utf8");
  const foundations = themeInputs(blueprint);
  const theme = buildTheme(foundations.inputs, css);
  for (const line of themeSummary(theme)) stdout.write(`${line}\n`);
  if (foundations.defaulted.length > 0) {
    stdout.write(
      `note: foundations was decided before ${foundations.defaulted.join(", ")} could be chosen; ` +
        "the floor's values are kept. Run the guide again to choose them.\n",
    );
  }

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
    const state =
      before === null ? "create" : sameContent(file, before, content) ? "unchanged" : "update";
    if (state !== "unchanged" && !dryRun) {
      mkdirSync(path.dirname(full), { recursive: true });
      writeFileSync(full, content);
    }
    stdout.write(`${state.padEnd(9)} ${file}\n`);
  }
  if (dryRun) stdout.write("preview only: nothing was written\n");
}

if (argv[1] && realpathSync(argv[1]) === realpathSync(fileURLToPath(import.meta.url))) main();
