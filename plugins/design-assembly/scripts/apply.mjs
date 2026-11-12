// Writes what the guide decided into a repository. Adds and updates only its own files, its own
// block in src/index.css and its own rows of the ledger. Running it again with the same blueprint
// changes nothing.
// Usage: node apply.mjs --target DIR [--dry-run] [--replace]
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
import {
  COMPONENTS_DECISION,
  COMPONENTS_FOLDER,
  componentsProblem,
  readComponents,
  readFolder,
  REGISTRY,
} from "../templates/tools/design-assembly/components.mjs";
import { lineWidth, renderJson } from "../templates/tools/design-assembly/json.mjs";
import { mergeLedger, TOOL } from "../templates/tools/design-assembly/ledger.mjs";
import { SPACING_UNIT_PX, TYPE_VARIABLES } from "../templates/tools/design-assembly/scale.mjs";
import { loadStyles, resolve } from "../templates/tools/design-assembly/styles.mjs";
import {
  readTokens,
  renderTokens,
  TOKENS,
  TOKENS_DECISION,
  tokensProblem,
} from "../templates/tools/design-assembly/tokens.mjs";
import {
  applyBlock,
  buildTheme,
  readBlock,
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

// Why this plugin's checks could not join the repository's gate, or null.
export function gateProblem(target) {
  const makefile = path.join(target, "Makefile");
  if (!existsSync(makefile) || !/^-?include mk\/\*\.mk/m.test(readFileSync(makefile, "utf8"))) {
    return "the Makefile does not include mk/*.mk, so the checks could not join make check";
  }
  return null;
}

// Why this folder cannot take the result, or null. The guide builds on a floor; it does not lay one.
export function floorProblem(target) {
  if (!existsSync(path.join(target, FILES.css))) {
    return `${FILES.css} is missing: this repository has no design floor to build on`;
  }
  return gateProblem(target);
}

// The decisions whose values the guide generates.
const GENERATED_VALUES = ["color-contrast", "type-scale-values", "spacing-values", "radius-value"];
// Above this chroma a primary color role has a hue of its own: the floor's default is a grey.
const OWN_HUE_CHROMA = 0.05;

// Why generating would write over a value the repository holds as its own, or null. The guide
// generates the primary color roles; a repository that already has them keeps them unless a
// person says to replace them.
export function ownValuesProblem(target) {
  const read = (file) =>
    existsSync(path.join(target, file)) ? readFileSync(path.join(target, file), "utf8") : null;
  const adopted = (JSON.parse(read(FILES.theme) ?? "{}").adopted ?? []).filter((id) =>
    GENERATED_VALUES.includes(id),
  );
  if (adopted.length > 0) {
    return `${adopted.join(", ")} hold values adopted from this repository, and generating would replace them`;
  }
  // Once the generated block is there, the primary color roles are the guide's own.
  if (readBlock(read(FILES.css) ?? "") !== null) return null;
  const primary = resolve(loadStyles(target, FILES.css), ":root", "--primary");
  if (primary && (!primary.color || primary.color.c > OWN_HUE_CHROMA)) {
    return `${FILES.css} already declares a primary color role of its own (${primary.value}), and generating would replace it`;
  }
  return null;
}

// A path the acceptance kit is told to read from this repository, or null.
function socket(target, key) {
  const config = path.join(target, "_acceptance/config.yaml");
  const text = existsSync(config) ? readFileSync(config, "utf8") : "";
  return new RegExp(`^\\s+${key}:\\s*["']?([^"'#\\n]+)`, "m").exec(text)?.[1].trim() ?? null;
}

// Where the design tokens file goes: the path the acceptance kit is told to read, else the default.
export function tokensFile(target) {
  return socket(target, "tokens") ?? TOKENS;
}

// The folder that holds the repository's components: where its component settings say, else the
// usual place.
export function componentsFolder(target) {
  const settings = path.join(target, "components.json");
  const alias = existsSync(settings)
    ? JSON.parse(readFileSync(settings, "utf8")).aliases?.ui
    : null;
  return typeof alias === "string" && alias.startsWith("@/")
    ? `src/${alias.slice(2)}`
    : COMPONENTS_FOLDER;
}

// The component manifest for the source as it is, with its ledger row and its check; or why it
// is left alone. `nothing` means the repository has no components to list.
export function componentsPlan(target, alreadyHeld) {
  const folder = componentsFolder(target);
  const sources = readFolder(target, folder);
  if (Object.keys(sources).length === 0) return { nothing: true };
  const file = socket(target, "registry") ?? REGISTRY;
  const full = path.join(target, file);
  const before = existsSync(full) ? readFileSync(full, "utf8") : null;
  if (before !== null && !alreadyHeld && componentsProblem(before, sources, file, folder)) {
    return {
      skipped: `${file} is already there and is not what ${folder} gives. It is kept, and no component manifest is written`,
    };
  }
  return {
    file,
    content: renderJson(readComponents(sources), lineWidth(target)),
    row: {
      id: COMPONENTS_DECISION,
      layer: "components",
      kind: "formula",
      source: `${folder}, written out by make design-components`,
      check: TOOL,
    },
    checks: [{ kind: "components", file, folder }],
  };
}

// The design tokens file for a stylesheet, with its ledger row and its check; or why it is left
// alone. A file this plugin did not write, and that says something else than the stylesheet, is a
// person's file: it is never written over.
export function tokensPlan(target, styles, stylesheet, alreadyHeld) {
  const file = tokensFile(target);
  const full = path.join(target, file);
  const before = existsSync(full) ? readFileSync(full, "utf8") : null;
  if (before !== null && !alreadyHeld && tokensProblem(before, styles, file, stylesheet)) {
    return {
      skipped: `${file} is already there and is not what ${stylesheet} gives. It is kept, and no design tokens file is written`,
    };
  }
  const { tokens, unresolved } = readTokens(styles);
  return {
    file,
    content: renderTokens(tokens),
    unresolved,
    row: {
      id: TOKENS_DECISION,
      layer: "foundations",
      kind: "formula",
      source: `${stylesheet}, written out by make design-tokens`,
      check: TOOL,
    },
    checks: [{ kind: "tokens", file }],
  };
}

// The tool and its gate step, as they are copied into a repository.
export function vendored() {
  const files = {};
  const templates = path.join(PLUGIN, "templates");
  for (const folder of ["tools/design-assembly", "mk"]) {
    for (const name of readdirSync(path.join(templates, folder)).sort()) {
      files[`${folder}/${name}`] = readFileSync(path.join(templates, folder, name), "utf8");
    }
  }
  return files;
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
      note: "the primary color roles in light and dark mode: the primary on the background, and the text on the primary",
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
  return { rows, inputs: foundations.inputs, checks };
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
  const { rows, inputs, checks } = decisions(blueprint, theme, foundations);
  const files = { [FILES.css]: applyBlock(css, renderBlock(theme)) };
  // The design tokens file is read from the stylesheet as it is about to be written.
  const held = JSON.parse(read(FILES.theme) ?? "{}").checks?.[TOKENS_DECISION];
  const tokens = tokensPlan(target, loadStyles(target, FILES.css, files), FILES.css, Boolean(held));
  const prior = JSON.parse(read(FILES.theme) ?? "{}").checks ?? {};
  const components = componentsPlan(target, Boolean(prior[COMPONENTS_DECISION]));
  const derived = [
    [TOKENS_DECISION, tokens],
    [COMPONENTS_DECISION, components],
  ];
  for (const [id, artifact] of derived.filter(([, item]) => item.file)) {
    rows.push(artifact.row);
    checks[id] = artifact.checks;
    files[artifact.file] = artifact.content;
  }
  // Everything generated here replaces what was adopted for the same decision; the stylesheet the
  // tool data names is kept.
  const before = JSON.parse(read(FILES.theme) ?? "{}");
  const data = {
    version: 1,
    ...(before.stylesheet ? { stylesheet: before.stylesheet } : {}),
    inputs,
    checks,
  };
  files[FILES.theme] = renderJson(data, lineWidth(target));
  // The ledger may hold rows this plugin did not write: they are kept exactly as they are.
  files[FILES.ledger] = mergeLedger(read(FILES.ledger), rows);
  for (const layer of LAYERS.filter((l) => l.built)) {
    const entry = blueprint.layers[layer.id];
    const values = layer.id === "foundations" ? foundations.choice : entry.choice;
    files[`design/decisions/${layer.id}.md`] = record(layer, entry, rows, values);
  }
  return { files: { ...files, ...vendored() }, theme, tokens, components };
}

// Writes the files that differ, or only says what it would do. One line per file.
export function writeFiles(target, files, dryRun) {
  return Object.entries(files).map(([file, content]) => {
    const full = path.join(target, file);
    const before = existsSync(full) ? readFileSync(full, "utf8") : null;
    const state =
      before === null ? "create" : sameContent(file, before, content) ? "unchanged" : "update";
    if (state !== "unchanged" && !dryRun) {
      mkdirSync(path.dirname(full), { recursive: true });
      writeFileSync(full, content);
    }
    return `${state.padEnd(9)} ${file}`;
  });
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

const USAGE = `usage: node apply.mjs --target DIR [--dry-run] [--replace]

  --dry-run  Preview without writing: the primary color role for light and dark, the contrast
             ratio each reaches, the type scale, the corner radius, and the files that would
             change. Works before approval, as soon as context and foundations are decided.
  (none)     Write. Needs design/blueprint.json with status "approved" and every built layer
             decided.
  --replace  Generate even where the repository holds values of its own: a primary color role
             with its own hue, or values taken in by the adopt script. Without it the guide
             refuses to write over them.
`;

// What the person needs to see to approve the foundations: one line per mode, with the numbers.
export function themeSummary(theme) {
  const ratio = (value) => `${value.toFixed(2)}:1`;
  const lines = [`contrast threshold for text: ${theme.thresholds.text}:1`];
  for (const mode of theme.modes) {
    const name = mode.selector === ":root" ? "light" : "dark";
    const kept = mode.adjusted
      ? "the source color does not reach the threshold here, so the primary keeps its hue and moves its lightness; chroma follows where the screen cannot show it"
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
  if (!existsSync(blueprintPath)) {
    stop(
      `the floor is in place. ${BLUEPRINT} is missing: write it, in the shape the guide's first step gives, then run this again.`,
    );
  }
  const blueprint = readJson(blueprintPath);
  const problems = blueprintProblems(blueprint, { preview: dryRun });
  if (problems.length > 0) {
    const what = dryRun ? "previewed" : "applied";
    stop(`${BLUEPRINT} cannot be ${what}:\n  ${problems.join("\n  ")}`);
  }

  const own = args.includes("--replace") ? null : ownValuesProblem(target);
  if (own && !dryRun) {
    stop(
      `${own}.\n  Keep them: run the adopt script instead.\n  Replace them: run this again with --replace.`,
    );
  }

  const css = readFileSync(path.join(target, FILES.css), "utf8");
  const foundations = themeInputs(blueprint);
  const theme = buildTheme(foundations.inputs, css);
  for (const line of themeSummary(theme)) stdout.write(`${line}\n`);
  if (own) {
    stdout.write(`note: ${own}. Writing will be refused: adopt the values, or pass --replace.\n`);
  }
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
  const { files, tokens, components } = plan(target, blueprint);
  for (const artifact of [tokens, components]) {
    if (artifact.skipped) stdout.write(`note: ${artifact.skipped}.\n`);
  }
  for (const variable of tokens.unresolved ?? []) {
    stdout.write(`note: ${variable} points nowhere, so it is not in the design tokens file.\n`);
  }
  for (const line of writeFiles(target, files, dryRun)) stdout.write(`${line}\n`);
  if (dryRun) stdout.write("preview only: nothing was written\n");
}

if (argv[1] && realpathSync(argv[1]) === realpathSync(fileURLToPath(import.meta.url))) main();
