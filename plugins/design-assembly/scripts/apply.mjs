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
import { contrast, formatOklch, parseColor } from "../templates/tools/design-assembly/color.mjs";
import {
  BASES,
  buildColumns,
  cellProblems,
  COLUMNS_FILE,
  readDisplays,
  TYPES_FILE,
  typesProblem,
} from "../templates/tools/design-assembly/columns.mjs";
import {
  COMPONENTS_DECISION,
  COMPONENTS_FOLDER,
  componentsProblem,
  readComponents,
  readFolder,
  REGISTRY,
  targetSizes,
} from "../templates/tools/design-assembly/components.mjs";
import {
  importsProblem,
  PARTS_FILE,
  readSources,
  SLIPS_FILE,
  slipsProblem,
  SOURCE_FOLDER,
  starterParts,
} from "../templates/tools/design-assembly/governance.mjs";
import { lineWidth, renderJson } from "../templates/tools/design-assembly/json.mjs";
import {
  channelsProblem,
  CORE_STATES,
  errorCopyProblem,
  RECORD_LINE,
  REGISTRY as SCREENS,
  STATES_FILE,
  statesProblem,
  withRecordLayout,
  wordsProblem,
} from "../templates/tools/design-assembly/patterns.mjs";
import { mergeLedger, parseLedger, TOOL } from "../templates/tools/design-assembly/ledger.mjs";
import {
  KINDS_FOLDER,
  kindsProblem,
  PAGES_TEST,
  readKinds,
  readPages,
  referenceProblem,
  SIZES_FILE,
  sizesProblem,
  STARTER_WIDTHS,
} from "../templates/tools/design-assembly/screens.mjs";
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

// A layer built after the first version: a blueprint that still has it `planned` was written
// before it could be asked, so its answer is the guide's proposal until the person gives one.
const LATER_LAYERS = ["patterns"];

// How a record opens: the person's answer, else the proposal for the product type.
export function recordLayout(blueprint) {
  const entry = blueprint.layers?.patterns ?? {};
  const answer = entry.status === "decided" ? entry.choice?.record_panel : undefined;
  if (answer) {
    const confirmed = entry.source === "user" || (entry.confirmed ?? []).includes("record_panel");
    return { layout: answer, confirmed, source: entry.source };
  }
  const type = blueprint.layers?.context?.choice?.product_type;
  return { layout: type === "content-site" ? "in-place" : "beside", confirmed: false };
}

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
    if (entry.status === "planned" && LATER_LAYERS.includes(layer.id)) continue;
    if (entry.status !== "decided") {
      const enoughForPreview = preview && !THEME_LAYERS.includes(layer.id);
      if (!enoughForPreview) found.push(`${layer.id}: must be decided`);
      continue;
    }
    if (!SOURCES.includes(entry.source)) {
      found.push(`${layer.id}: source must be one of ${SOURCES.join(", ")}`);
    }
    if (typeof entry.why !== "string" || entry.why.trim() === "") found.push(`${layer.id}: no why`);
    const keys = layer.choices.map((choice) => choice.key);
    const strange = (Array.isArray(entry.confirmed) ? entry.confirmed : []).filter(
      (key) => !keys.includes(key),
    );
    if (entry.confirmed !== undefined && !Array.isArray(entry.confirmed)) {
      found.push(`${layer.id}: confirmed is a list of choice keys`);
    } else if (strange.length > 0) {
      found.push(
        `${layer.id}: confirmed names ${strange.join(", ")}, which is not a choice of this layer`,
      );
    }
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
  if (color !== undefined && parseColor(String(color)) === null) {
    found.push("foundations: source color must be written as #rrggbb or oklch(L C H)");
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
export function componentsPlan(target, alreadyHeld, pending = {}) {
  const folder = componentsFolder(target);
  // `pending` holds files about to be written: a component installed in the same run is listed.
  const arriving = Object.entries(pending).filter(([file]) => file.startsWith(`${folder}/`));
  const sources = { ...readFolder(target, folder), ...Object.fromEntries(arriving) };
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

// The check that every control reaches the target size of a conformance level, with its ledger
// row; or what stands in its way. `nothing`: no control declares a height that can be read.
// `below`: controls that are too small today, so no check is added.
export function targetPlan(target, level) {
  const folder = componentsFolder(target);
  const min = THRESHOLDS[level]?.target;
  if (!min) return { nothing: true };
  const sizes = targetSizes(readFolder(target, folder), min);
  if (sizes.measured.length === 0) return { nothing: true, ...sizes };
  if (sizes.below.length > 0) return { ...sizes, min };
  const rest = sizes.unmeasured.length > 0 ? `; not measured: ${sizes.unmeasured.join(", ")}` : "";
  return {
    ...sizes,
    min,
    below: [],
    what: `every control that declares a height is at least ${min}px high (smallest: ${sizes.smallest}${rest})`,
    row: {
      id: "target-size",
      layer: "components",
      kind: "standard",
      source: `WCAG 2.2 level ${level}, target size`,
      check: TOOL,
      note: "the height each control declares in its own classes; its width, and controls that take their size from elsewhere, are not measured",
    },
    checks: [{ kind: "target-size", folder, min }],
  };
}

// The table a repository starts from: one column type per base type. The sample lengths are a
// proposal for a person to correct: they depend on the language and on how values are formatted.
const STARTER_TYPES = {
  version: 1,
  padding_ch: 2,
  types: Object.fromEntries(
    Object.entries({ text: 16, number: 6, date: 10, datetime: 16, boolean: 5, select: 14 }).map(
      ([name, sample]) => [name, { base: name, sample }],
    ),
  ),
};
// Code the repository owns once it is there: written when missing, never written over.
const OWNED = {
  "typed-table.tsx.template": (folder) => `${folder}/typed-table.tsx`,
  "typed-table.test.tsx.template": () => "tests/typed-table.test.tsx",
};
// Code the browser test of every page asks for, installed with it where the floor's table is: the
// column of a row's actions that stays in view, the one button that holds two or more of them,
// and a button's label that keeps its width while its action waits. None needs a typed field, so
// a repository has them before its first one.
const ROW_PARTS = {
  "table-actions.tsx.template": (folder) => `${folder}/table-actions.tsx`,
  "table-actions.test.tsx.template": () => "tests/table-actions.test.tsx",
  "row-actions.tsx.template": (folder) => `${folder}/row-actions.tsx`,
  "row-actions.test.tsx.template": () => "tests/row-actions.test.tsx",
  "held-label.tsx.template": (folder) => `${path.posix.dirname(folder)}/held-label.tsx`,
  "held-label.test.tsx.template": () => "tests/held-label.test.tsx",
};
// How one record of a list opens, installed with the same parts: the panel that arranges it as the
// blueprint decides, and what keeps the open record in the address.
const RECORD_PARTS = {
  "record-panel.tsx.template": (folder) => `${path.posix.dirname(folder)}/record-panel.tsx`,
  "open-record.ts.template": (folder) =>
    `${path.posix.dirname(path.posix.dirname(folder))}/lib/open-record.ts`,
  "record-panel.test.tsx.template": () => "tests/record-panel.test.tsx",
};
const RECORD_TEMPLATE = "record-panel.tsx.template";

// The data table layer: the repository's column types, the file code reads, the rows and checks
// that hold alignment, width and density, and the table parts that apply them. `starter` writes
// the table of column types when the repository has none; without it, no table means `nothing`.
// `code` installs the table parts where the floor's table component is.
export function columnsPlan(target, { starter, code }) {
  const read = (file) =>
    existsSync(path.join(target, file)) ? readFileSync(path.join(target, file), "utf8") : null;
  const displays = readDisplays(target);
  const files = {};
  let typesText = read(TYPES_FILE);
  if (typesText === null) {
    if (!starter) return { nothing: true, displays };
    typesText = renderJson(STARTER_TYPES, lineWidth(target));
    files[TYPES_FILE] = typesText;
  }
  const problem = typesProblem(typesText, displays);
  if (problem) return { files, problem, displays };
  files[COLUMNS_FILE] = renderJson(
    buildColumns(JSON.parse(typesText), displays),
    lineWidth(target),
  );

  const folder = componentsFolder(target);
  const floorTable = folder === COMPONENTS_FOLDER && read(`${folder}/table.tsx`) !== null;
  // The table parts are installed with the first typed field: before that there is no column to
  // type, and their own tests would have nothing to run on.
  if (code && floorTable && Object.keys(displays).length > 0) {
    for (const [name, place] of Object.entries(OWNED)) {
      const file = place(folder);
      if (read(file) === null) {
        files[file] = readFileSync(path.join(PLUGIN, "templates/owned", name), "utf8");
      }
    }
  }

  const skip = [`${folder}/`, "src/generated/"];
  const sources = readFolder(target, "src");
  const inSync = { kind: "columns", file: COLUMNS_FILE, types: TYPES_FILE };
  const rules = {
    "column-align": {
      rule: "align",
      source: "the column type of the field",
      what: "a column is aligned by its column type, and no screen sets alignment on a cell",
      checks: [inSync],
    },
    "column-width": {
      rule: "width",
      source: "the header and the sample length of the column type",
      what: "the sample lengths are the table's, and no screen sets a width on a cell",
      note: "the sample lengths and the padding, and that no screen sets a width; the sum itself is done by whatever draws the table, such as the typed table parts with their own tests",
      checks: [inSync],
    },
    "table-density": {
      rule: "density",
      source: "whether the columns fit at their least width",
      what: "no screen sets a row height or text size on a table row",
      note: "that no screen sets a row height; the choice between the two densities is made by whatever draws the table, such as the typed table parts with their own tests",
      checks: [],
    },
  };
  const held = {};
  const failing = [];
  const fields = Object.keys(displays).length;
  if (fields > 0) {
    held["display-kind"] = {
      what: `${fields} field(s) of the data model each name a column type of ${TYPES_FILE}`,
      row: { layer: "components", kind: "closed", source: TYPES_FILE, check: TOOL },
      checks: [{ kind: "column-types", file: TYPES_FILE }],
    };
  }
  for (const [id, item] of Object.entries(rules)) {
    const bypass = cellProblems(sources, item.rule, skip);
    if (bypass) {
      failing.push({ id, why: bypass });
      continue;
    }
    held[id] = {
      what: item.what,
      row: {
        layer: "components",
        kind: "formula",
        source: item.source,
        check: TOOL,
        ...(item.note ? { note: item.note } : {}),
      },
      checks: [...item.checks, { kind: "cells", folder: "src", skip, rule: item.rule }],
    };
  }
  return { files, held, failing, displays, fields, bases: Object.keys(BASES) };
}

// The patterns and content layer, as far as a tool can read it from source: the states every
// screen declares, that no screen writes its own words, and that an error message has both of its
// parts. A rule the repository does not meet today gets no row: it is listed under `failing`.
// `starter` writes the list of required states when the repository has none.
export function patternsPlan(target, { starter, code = false }) {
  const read = (file) =>
    existsSync(path.join(target, file)) ? readFileSync(path.join(target, file), "utf8") : null;
  const folder = componentsFolder(target);
  const skip = [`${folder}/`, "src/generated/"];
  const sources = readFolder(target, "src");
  const files = {};
  const held = {};
  const failing = [];
  const propose = (id, problem, item) => {
    if (problem) failing.push({ id, why: problem });
    else held[id] = item;
  };

  const registry = read(SCREENS);
  let statesText = read(STATES_FILE);
  if (registry !== null && statesText === null && starter) {
    statesText = renderJson({ version: 1, required: CORE_STATES, exempt: {} }, lineWidth(target));
    files[STATES_FILE] = statesText;
  }
  if (registry !== null && statesText !== null) {
    propose("state-matrix", statesProblem(statesText, registry), {
      what: `every screen of ${SCREENS} declares the states of ${STATES_FILE}`,
      row: {
        layer: "patterns",
        kind: "closed",
        source: STATES_FILE,
        check: TOOL,
        note: "that every screen declares the required states; that each one can be reached, and what it shows, is for the repository's own browser tests",
      },
      checks: [{ kind: "states", file: STATES_FILE, registry: SCREENS }],
    });
  }
  if (Object.keys(sources).some((file) => !skip.some((prefix) => file.startsWith(prefix)))) {
    propose("labels", wordsProblem(sources, skip), {
      what: "no screen writes its own words: text and spoken labels come from one place",
      row: {
        layer: "content",
        kind: "closed",
        source: "one place for every word a screen shows",
        check: TOOL,
        note: "text between tags and in attributes a person reads or hears; text built in code is not read",
      },
      checks: [{ kind: "words", folder: "src", skip }],
    });
    const errors = errorCopyProblem(sources, skip);
    if (!errors?.includes("nothing is measured")) {
      propose("error-copy", errors, {
        what: "every error message a screen shows says what happened and what to do next",
        row: {
          layer: "content",
          kind: "closed",
          source: "an error message says what happened, then what to do next",
          check: TOOL,
          note: "that every error message has both parts; whether the words are right is a person's review",
        },
        checks: [{ kind: "error-copy", folder: "src", skip }],
      });
    }
  }
  if (Object.keys(sources).some((file) => !skip.some((prefix) => file.startsWith(prefix)))) {
    propose("notification-channel", channelsProblem(readSources(target, "src"), skip), {
      what: "no screen opens a browser dialog or calls a toast library itself",
      row: {
        layer: "patterns",
        kind: "closed",
        source: "one channel for each kind of message",
        check: TOOL,
        note: "that no screen opens a browser dialog or calls a toast library itself; which channel a message takes is for the repository's own tests and a person's review",
      },
      checks: [{ kind: "channels", folder: "src", sources: "src", skip }],
    });
  }
  // The toast and the one module screens tell results through: installed where the toast library
  // is already a dependency and the floor's components are, and never written over.
  const notes = [];
  if (code && folder === COMPONENTS_FOLDER) {
    const uses = JSON.parse(read("package.json") ?? "{}").dependencies ?? {};
    if ("sonner" in uses) {
      const owned = {
        "sonner.tsx.template": `${folder}/sonner.tsx`,
        "notify.ts.template": "src/lib/notify.ts",
      };
      for (const [name, file] of Object.entries(owned)) {
        if (read(file) === null) {
          files[file] = readFileSync(path.join(PLUGIN, "templates/owned", name), "utf8");
        }
      }
    } else {
      notes.push(
        "no toast is installed. The channel rule is held all the same. To tell results in a toast, add the sonner package and run the guide again: it installs the toast and the module screens tell results through",
      );
    }
  }
  return { files, held, failing, notes };
}

// What the page-level browser test proves, by the decision each tag in it names.
const PAGE_PROOFS = {
  "one-main-one-h1": { layer: "templates", kind: "standard" },
  "no-sideways-scroll": { layer: "templates", kind: "formula" },
  "wcag-aa": { layer: "templates", kind: "standard" },
  "focus-after-action": { layer: "patterns", kind: "standard" },
  "row-actions-in-view": { layer: "patterns", kind: "standard" },
};
// Where the floor lists every state of every screen for its browser checks.
const ROUTES = "tests/e2e/routes.ts";

// The templates layer, as far as a tool can read it from source: that every screen is of a kind
// with a page of its own, that each kind names a real screen as its reference, and that pages are
// checked at the widths a person listed. `starter` writes the list of widths when the repository
// has none; `code` installs the browser test that reads it. What a kind's page says is a person's:
// no page is ever written here.
export function templatesPlan(target, { starter, code = false, pending = {}, layout = null }) {
  const read = (file) =>
    file in pending
      ? pending[file]
      : existsSync(path.join(target, file))
        ? readFileSync(path.join(target, file), "utf8")
        : null;
  const files = {};
  const held = {};
  const rows = [];
  const failing = [];
  const notes = [];
  let recordPanel = null;
  const propose = (id, problem, item) => {
    if (problem) failing.push({ id, why: problem });
    else held[id] = item;
  };
  // A row a person may have written or confirmed is theirs: it is never written again.
  const ledger = parseLedger(read(FILES.ledger) ?? "");
  const known = [];
  const record = (row) => {
    const theirs = ledger.find((item) => item.id === row.id);
    if (theirs) known.push(theirs);
    else rows.push(row);
  };

  const registry = read(SCREENS);
  const pages = readPages(target);
  const sources = readFolder(target, "src");
  if (registry !== null && Object.keys(pages).length > 0) {
    propose("page-layouts", kindsProblem(pages, registry, sources), {
      what: `every screen of ${SCREENS} is of one kind, and each kind has its page under ${KINDS_FOLDER}`,
      row: {
        layer: "templates",
        kind: "closed",
        source: `${KINDS_FOLDER}, one page per kind of screen`,
        check: TOOL,
        note: "that every screen is of exactly one kind, and that the kind's page names its main task; what the page says is a person's review",
      },
      checks: [{ kind: "screen-kinds", pages: KINDS_FOLDER, registry: SCREENS, folder: "src" }],
    });
    if ("page-layouts" in held) {
      propose(
        "reference-implementation",
        referenceProblem(pages, registry, read(STATES_FILE), sources),
        {
          what: "each kind of screen names a real screen as its reference, with every required state",
          row: {
            layer: "templates",
            kind: "closed",
            source: "the screen each kind's page names as its reference",
            check: TOOL,
            note: "that the screen is listed, is of that kind and declares every required state; whether it is a good example is a person's review",
          },
          checks: [
            {
              kind: "reference-screens",
              pages: KINDS_FOLDER,
              registry: SCREENS,
              file: STATES_FILE,
              folder: "src",
            },
          ],
        },
      );
      // The main task is written on each page; that it is the right one is a person's call.
      record({
        id: "primary-task",
        layer: "context",
        kind: "judgment",
        source: `${KINDS_FOLDER}, the main task each page names`,
        note: `written for ${readKinds(pages).length} kind(s) of screen; a person has not confirmed it`,
      });
    }
  } else if (registry !== null && starter) {
    notes.push(
      `no page describes a kind of screen yet. Write one page per kind under ${KINDS_FOLDER} with the person, then run the guide again: it then holds that every screen is of a kind, and that each kind has a reference screen`,
    );
  }

  // The widths and the browser test: where the floor's browser checks already run.
  const uses = JSON.parse(read("package.json") ?? "{}");
  const installed = { ...uses.dependencies, ...uses.devDependencies };
  if (read(ROUTES) !== null && "@axe-core/playwright" in installed) {
    let sizes = read(SIZES_FILE);
    if (sizes === null && starter) {
      sizes = renderJson({ version: 1, widths: STARTER_WIDTHS }, lineWidth(target));
      files[SIZES_FILE] = sizes;
    }
    let test = read(PAGES_TEST);
    if (test === null && code) {
      test = readFileSync(path.join(PLUGIN, "templates/owned/templates.spec.ts.template"), "utf8");
      files[PAGES_TEST] = test;
    }
    const folder = componentsFolder(target);
    if (
      code &&
      test !== null &&
      folder === COMPONENTS_FOLDER &&
      read(`${folder}/table.tsx`) !== null
    ) {
      for (const [name, place] of Object.entries(ROW_PARTS)) {
        const file = place(folder);
        if (read(file) === null) {
          files[file] = readFileSync(path.join(PLUGIN, "templates/owned", name), "utf8");
        }
      }
      // The record panel is the repository's from then on, but for its one line that says how a
      // record opens: the guide writes the blueprint's answer there, every time it runs.
      for (const [name, place] of Object.entries(layout ? RECORD_PARTS : {})) {
        const file = place(folder);
        const now = read(file);
        if (now === null) {
          const text = readFileSync(path.join(PLUGIN, "templates/owned", name), "utf8");
          files[file] = name === RECORD_TEMPLATE ? withRecordLayout(text, layout) : text;
        } else if (name === RECORD_TEMPLATE && RECORD_LINE.test(now)) {
          files[file] = withRecordLayout(now, layout);
        }
        if (name === RECORD_TEMPLATE) recordPanel = file;
      }
    }
    if (sizes !== null && test !== null) {
      propose("test-screen-sizes", sizesProblem(sizes, test), {
        what: `pages are checked at the widths of ${SIZES_FILE}`,
        row: {
          layer: "templates",
          kind: "formula",
          source: `${SIZES_FILE}: the reflow width of WCAG 2.2, and the widths a person adds`,
          check: TOOL,
          note: "that the widths reach down to the reflow width, and that the browser test opens the file and names its widths; the test itself is not run again here, so a test that skips a width is not caught",
        },
        checks: [{ kind: "screen-sizes", file: SIZES_FILE, test: PAGES_TEST }],
      });
      for (const [id, proof] of Object.entries(PAGE_PROOFS)) {
        if (!new RegExp(`decision:${id}(?![\\w-])`).test(test)) continue;
        record({
          id,
          layer: proof.layer,
          kind: proof.kind,
          source: "the repository's own browser test of it",
          check: `e2e:${PAGES_TEST}`,
        });
      }
    }
  }
  return { files, held, rows, known, failing, notes, recordPanel };
}

// The record a repository starts with: a table and no line. A line is added when a fault is found
// that every check let through.
const STARTER_SLIPS = [
  "# What slipped past the checks",
  "",
  "One line per fault that every check let through and a person or a later check then found. Say",
  "which layer should have caught it (context, foundations, components, patterns, content,",
  "templates or governance) and what was done: a new check, a new rule, or a reason to leave it.",
  "",
  "| Date | What slipped | Layer that should have caught it | What was done |",
  "| ---- | ------------ | -------------------------------- | ------------- |",
  "",
].join("\n");

// The governance layer, as far as a tool can read it from source: that no part of the code
// imports a part above it, and that the record of what slipped past the checks can be acted on.
// `starter` writes the list of parts, once the kinds of screen are described, and the empty
// record. Both files are a person's from then on.
export function governancePlan(target, { starter, pending = {} }) {
  const read = (file) =>
    file in pending
      ? pending[file]
      : existsSync(path.join(target, file))
        ? readFileSync(path.join(target, file), "utf8")
        : null;
  const files = {};
  const held = {};
  const failing = [];
  const propose = (id, problem, item) => {
    if (problem) failing.push({ id, why: problem });
    else held[id] = item;
  };
  const pages = readPages(target);
  const sources = readSources(target);
  let parts = read(PARTS_FILE);
  // The screens are the files the pages of kinds name: without a page there is no top to measure.
  if (parts === null && starter && Object.keys(pages).length > 0) {
    parts = renderJson(starterParts(componentsFolder(target)), lineWidth(target));
    files[PARTS_FILE] = parts;
  }
  if (parts !== null) {
    propose("tier-direction", importsProblem(parts, sources, pages), {
      what: `no part of ${SOURCE_FOLDER} imports a part listed above it in ${PARTS_FILE}`,
      row: {
        layer: "governance",
        kind: "closed",
        source: `${PARTS_FILE}, the parts of the code from the top down`,
        check: TOOL,
        note: "imports written in source between files of the repository, static and dynamic; what a file reaches through a package is not read",
      },
      checks: [
        { kind: "import-direction", file: PARTS_FILE, sources: SOURCE_FOLDER, pages: KINDS_FOLDER },
      ],
    });
  }
  let slips = read(SLIPS_FILE);
  if (slips === null && starter) {
    slips = STARTER_SLIPS;
    files[SLIPS_FILE] = slips;
  }
  if (slips !== null) {
    propose("escapes", slipsProblem(slips), {
      what: `every line of ${SLIPS_FILE} names a date, a layer and what was done`,
      row: {
        layer: "governance",
        kind: "closed",
        source: `${SLIPS_FILE}, one line per fault that every check let through`,
        check: TOOL,
        note: "that every line can be acted on; that a fault gets a line at all is a person's habit, and an empty record passes",
      },
      checks: [{ kind: "slips", file: SLIPS_FILE }],
    });
  }
  return { files, held, failing };
}

// The page an agent reads before it touches a screen: the rules this tool holds in this
// repository, and the command to run after each kind of change. Written from what is installed, so
// it never names a rule that is not held or a file that is not there.
export const RULES_PAGE = ".claude/rules/design-assembly.md";

export function rulesPage(checks, has) {
  const held = (id) => id in checks;
  const lines = [
    "---",
    'paths: ["src/**/*.tsx"]',
    "---",
    "",
    "# Design rules the gate holds",
    "",
    "`make design-assembly` checks what this page lists, and `make check` runs it. A failure names",
    "the decision and what is wrong. `design/decisions.yaml` lists every design decision of this",
    "repository and what holds it. This page is written by the design-assembly scripts: do not edit",
    "it.",
  ];
  const section = (title, items) => {
    const shown = items.filter(Boolean);
    if (shown.length > 0) lines.push("", `## ${title}`, "", ...shown.map((item) => `- ${item}`));
  };
  const typed = has("src/components/ui/typed-table.tsx");
  section("A table of data", [
    held("display-kind") &&
      "A column shows a field of the data model. The field names its column type once: a `display` key on its property in `ontology/entities/`, with a type listed in `design/column-types.json`.",
    held("column-align") &&
      "To add a column: give the property its `display` key, run `make gen` and `make design-columns`, add the header to the repository's words, then use the field in the screen.",
    held("column-align") &&
      (typed
        ? "Build the table from `TypedTable`, `TypedRow`, `TypedHead` and `TypedCell` (`src/components/ui/typed-table.tsx`). They take alignment, width and row height from the column type."
        : "Alignment and width come from the column type of the field."),
    held("column-align") &&
      "Never put a text-alignment or width class on a table cell, or a height or text-size class on a table row, typed or plain.",
  ]);
  const pages = has("tests/e2e/templates.spec.ts");
  const rows = held("column-align") || pages;
  const heldLabel = has("src/components/held-label.tsx");
  section("Actions on a row", [
    rows &&
      (has("src/components/ui/table-actions.tsx")
        ? "A column that holds a row's actions and no data uses `TableActionsHead` and `TableActions` (`src/components/ui/table-actions.tsx`). When the table is wider than its place it scrolls sideways inside itself, and that column stays in place."
        : "When a table is wider than its place it scrolls sideways inside itself, and the column of a row's actions stays in place."),
    rows &&
      (typed
        ? "The first column of a typed table stays in place too from 640px up. On a phone it scrolls with the data, so every column can still be read."
        : "The first column stays in place too only where that leaves room to read the columns between."),
    rows &&
      (has("src/components/ui/row-actions.tsx")
        ? "A row shows one action as a button. Two or more go behind one button on the row, at every width: `RowActions` (`src/components/ui/row-actions.tsx`), given a `name` that says which row it acts on and the actions as buttons, those that can be taken back first and a delete last. Two text buttons do not fit beside the data at 320px, and one rule for every width keeps one way to reach each state. The button shows only an ellipsis, ⋯, so it takes the same small room at every width; a screen reader hears its name. Its list floats below the button and never widens the column; one is open at a time; pressing an action closes it and gives focus back to the row's button, which you hold with `pending` while the action waits; from one second of `pending` on, it turns itself into a turning circle and a screen reader hears `busyName`, which says what it is doing: each row keeps its own clock, so write no timer of your own. A state behind it is reached by pressing the row's button, then the action. Never build a list of a row's actions of a screen's own."
        : "A row shows one action as a button. Two or more go behind one button on the row, at every width, that opens them as a list of buttons: two text buttons do not fit beside the data at 320px, and one rule for every width keeps one way to reach each state. It is a disclosure, not an ARIA menu, so every action stays a button the browser test can press and every state behind it can be listed. The actions that can be taken back come first, a delete comes last."),
    rows &&
      "Each row waits on its own: while one row's action waits, the other rows can still be used.",
    rows &&
      (heldLabel
        ? "A button that says it is working keeps its width: write its label with `HeldLabel` (`src/components/held-label.tsx`), giving both the label and the label while it waits."
        : "A button that says it is working keeps its width: the label while it waits takes no more room than the label before."),
  ]);
  section("A record beside a list", [
    held("record-panel") &&
      has("src/components/record-panel.tsx") &&
      "A record opened from a list opens with `WithRecord` (`src/components/record-panel.tsx`), and the screen keeps which one is open with `useOpenRecord` (`src/lib/open-record.ts`). It opens as the person chose in `design/blueprint.json`: beside the list, over it, or in its place. Never build a panel, a sheet or a page of a screen's own for it.",
    held("record-panel") &&
      "A record that opens over the list starts below the application frame's header, the page's banner, and never covers it. While it is open the header can still be pressed, which closes it; the keyboard and a screen reader reach the header once it is closed.",
    held("record-panel") &&
      "The record's name in its row is the button that opens it. The record's title is its name; it shows the record's fields under the same headers as the table's columns.",
    held("record-panel") &&
      "A screen that opens a record lists a state for it in `src/screens.ts`, reached by pressing that button, so the browser test measures it at every width.",
    held("record-panel") &&
      "To change how a record opens, change the answer in `design/blueprint.json` and run the guide again. Never edit the `RECORD_LAYOUT` line by hand: the gate fails when it differs from the answer.",
  ]);
  section("Words", [
    held("labels") &&
      "A screen writes no word itself: not between tags, not in `aria-label`, `placeholder`, `title` or `alt`, not as a header or label in code. Take every word from the repository's one place for words.",
    held("error-copy") &&
      "An error message is an `Alert` of the destructive kind with a title that says what happened and a description that says what to do next.",
  ]);
  section("States", [
    held("state-matrix") &&
      "Every screen in `src/screens.ts` declares the states listed in `design/states.json`. A screen that loads no data is excused in that file, with a reason: that is a person's decision.",
  ]);
  const notify = has("src/lib/notify.ts");
  section("Telling a person", [
    held("notification-channel") &&
      (notify
        ? "The result of an action is told through `notifyDone` in `src/lib/notify.ts`; pass it the undo when the action can be taken back."
        : "The result of an action is told through the repository's one module for it."),
    held("notification-channel") &&
      notify &&
      "An action done at once that fails is told through `notifyFailed` in the same module: what was not done, what to do next, and a button that tries again. Never drop a failure, and never tell a failed undo as done.",
    held("notification-channel") &&
      notify &&
      "A failure where the dialog or form is still open is shown in it, not in a toast. What the person typed is kept.",
    held("notification-channel") &&
      notify &&
      "An action on a row that asks first closes its dialog as soon as the person confirms: the row's own control waits for the answer, so the other rows can still be used. From there it is an action done at once: done, it is told through `notifyDone`; failed, through `notifyFailed`, whose button tries again without asking again.",
    held("notification-channel") &&
      notify &&
      "Anything a toast's button does can also be done from the screen itself: the toast is never the only way.",
    held("notification-channel") &&
      notify &&
      "When a person leaves a screen its toasts go with it: whatever moves between screens calls `notifyClear` of the same module.",
    held("notification-channel") &&
      "Never call a toast library from a screen, and never `alert`, `confirm` or `prompt`. One module calls the toast library; a second one, whatever its name, fails the gate.",
  ]);
  section("After an action", [
    pages &&
      "Focus never falls on nothing: the browser test of every page fails when, after the last action of a state, nothing has focus.",
    pages &&
      "While an action done at once waits for its answer, the control that started it is held and keeps focus. A control that is removed, or disabled in a way that drops it from the keyboard, loses focus. From one second on, the control says it is working.",
    pages &&
      "When a control leaves the page (its row is removed, its dialog closes on a deleted item, its state is replaced), move focus: to the same control on the row after it (the button that opens a row's actions, where they are behind one), else on the row before, else to the button of the state shown in place of the table, else to the screen's top heading.",
    pages &&
      "When an undo brings a row back, focus goes to that row's same control, so a person is where the thing they took back now is.",
    pages &&
      "Wherever focus is sent, it shows: a heading or any element given `tabIndex={-1}` to receive focus gets the same visible ring as a control.",
    pages &&
      "At every width, every control of the first row of a table is inside the window, and the columns that stay in place leave room to read the widest column that scrolls: the browser test fails when either is not so.",
    pages &&
      notify &&
      "A button of a toast gives focus back to where the person was before the toast: the notification module does this.",
  ]);
  section("A screen", [
    held("page-layouts") &&
      "Every screen is of one kind. A kind has a page under `design/patterns`: read it before building a screen of that kind, and build it like the reference screen the page names.",
    held("page-layouts") &&
      "A new screen is listed in `src/screens.ts`, and its file is one the page of its kind names. A screen of a new kind needs its page first: that is a person's decision.",
    held("test-screen-sizes") &&
      "Every state of every screen is checked in a browser at the widths of `design/screen-sizes.json`: one main region, one top heading, no sideways scroll, the accessibility checks. A screen with an action done at once lists a state for that action failing.",
  ]);
  section("The system itself", [
    held("tier-direction") &&
      "The code has parts, listed from the top down in `design/parts.json`. A file imports only its own part and the parts listed after it: a component never imports a screen. What two screens share: logic and data move down a part; a piece of drawing they share becomes a component of the repository's own, in the part between the screens and the component library (named `shared` where the guide wrote the list). One screen's own drawing stays in that screen. This holds for what screens of one kind copy from its reference screen too: loading, trying again and filtering that two list screens do alike are one shared piece, not two copies.",
    held("escapes") &&
      "When you find a fault that every check let through, add a line to `design/escapes.md` before you fix it: the date, what slipped, the layer that should have caught it, and what was done.",
    (held("tier-direction") || held("escapes")) &&
      "A departure on purpose stays beside the rule it bends, with its reason: a lint exception, a screen excused from the states, a file left out of its kind.",
  ]);
  section("No check holds these: a person reviews them", [
    has("ontology/glossary.md") &&
      "A screen that needs a concept or an action the data model does not name adds it to `ontology/` first, in the same change, and says in the change's description that the data model changed and a person reviews it before it merges. Only where the repository forbids an agent to change the data model does the agent stop and ask. It never names the concept in a screen alone.",
    "A row of `design/decisions.yaml` is for a rule a second screen must follow. A choice that only one screen makes stays in that screen.",
    held("page-layouts") &&
      "One item changing never sends the whole list back to its loading state: the row stays until the answer, then the list changes in place.",
    held("page-layouts") &&
      "An undo puts the thing back where it was and shows no second toast: the screen shows the result. A failed undo says where the thing is now.",
    held("page-layouts") &&
      "An empty state says why it is empty and how items get there. It has a button only when the person can fill it from this screen; otherwise at most one link inside its text. Never a link dressed as a primary button, and never a copy of the navigation.",
    held("page-layouts") &&
      "A screen does not link to other screens from beside its heading: moving between screens belongs to the application's frame, in the same place and order on every screen. The place beside the heading is for the screen's main action.",
  ]);
  const target = checks["target-size"]?.[0]?.min;
  section("Controls", [
    target &&
      `A control is at least ${target}px high. Do not add a smaller size to a component, and do not shrink one in a screen.`,
  ]);
  section("After a change", [
    held("design-tokens") && "A value in the stylesheet changed: run `make design-tokens`.",
    held("component-manifest") &&
      "A component or one of its variants changed: run `make design-components`. Look a component and its variants up in `design/component-registry.json` before reading its source.",
    held("column-align") &&
      "A field's column type or the table of column types changed: run `make design-columns`.",
    "Never edit by hand the files those commands write, `design/theme.json`, `tools/design-assembly/` or `mk/design-assembly.mk`.",
  ]);
  return `${lines.join("\n")}\n`;
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
  // A person's call that the guide proposed is not theirs yet: the row says so until they confirm.
  // A layer the guide proposed may hold one answer the person has since given: `confirmed` lists
  // those choice keys, so that one row stops saying it is a proposal and the others still do.
  const proposed = (layer, key) => {
    const entry = blueprint.layers[layer];
    if ((entry.confirmed ?? []).includes(key)) return {};
    if (entry.source === "proposed") {
      return { note: "proposed by the guide; a person has not confirmed it" };
    }
    // Read off the repository is not a person's answer either, until a person says so.
    if (entry.source === "repo") {
      return { note: "read from the repository; a person has not confirmed it" };
    }
    return {};
  };
  const call = (id, layer, key) => ({
    id,
    layer,
    kind: "judgment",
    source: recorded,
    ...proposed(layer, key),
  });
  const rows = [
    call("product-type", "context", "product_type"),
    call("conformance-level", "context", "conformance_level"),
    call("source-color", "foundations", "source_color"),
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
    "tonal-palette": [{ kind: "generated" }, { kind: "blueprint", file: BLUEPRINT }],
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
  const columns = columnsPlan(target, { starter: true, code: true });
  const patterns = patternsPlan(target, { starter: true, code: true });
  const opening = recordLayout(blueprint);
  const templates = templatesPlan(target, {
    starter: true,
    code: true,
    pending: patterns.files,
    layout: opening.layout,
  });
  const governance = governancePlan(target, { starter: true });
  // The component manifest is read from the components as they are about to be: with the parts
  // this run installs among them.
  const components = componentsPlan(target, Boolean(prior[COMPONENTS_DECISION]), {
    ...columns.files,
    ...patterns.files,
    ...templates.files,
  });
  const derived = [
    [TOKENS_DECISION, tokens],
    [COMPONENTS_DECISION, components],
  ];
  for (const [id, artifact] of derived.filter(([, item]) => item.file)) {
    rows.push(artifact.row);
    checks[id] = artifact.checks;
    files[artifact.file] = artifact.content;
  }
  Object.assign(files, columns.files);
  for (const [id, item] of Object.entries(columns.held ?? {})) {
    rows.push({ id, ...item.row });
    checks[id] = item.checks;
  }
  Object.assign(files, patterns.files);
  for (const [id, item] of Object.entries(patterns.held)) {
    rows.push({ id, ...item.row });
    checks[id] = item.checks;
  }
  Object.assign(files, templates.files);
  for (const [id, item] of Object.entries(templates.held)) {
    rows.push({ id, ...item.row });
    checks[id] = item.checks;
  }
  rows.push(...templates.rows);
  // How a record opens: a person's call, held where the record panel is installed.
  if (templates.recordPanel) {
    const unconfirmed = opening.confirmed
      ? ""
      : opening.source === "repo"
        ? "read from the repository; a person has not confirmed it. The check: "
        : "proposed by the guide; a person has not confirmed it. The check: ";
    rows.push({
      id: "record-panel",
      layer: "patterns",
      kind: "closed",
      source: `${BLUEPRINT}, list-detail layout: ${opening.layout}`,
      check: TOOL,
      note: `${unconfirmed}that the record panel opens a record as the blueprint decides; the browser test of every page measures the arrangement at every width, and a screen that opens a record with a panel of its own is not caught`,
    });
    checks["record-panel"] = [
      { kind: "record-layout", file: templates.recordPanel, blueprint: BLUEPRINT },
    ];
  }
  Object.assign(files, governance.files);
  for (const [id, item] of Object.entries(governance.held)) {
    rows.push({ id, ...item.row });
    checks[id] = item.checks;
  }
  const targets = targetPlan(target, inputs.conformanceLevel);
  if (targets.row) {
    rows.push(targets.row);
    checks["target-size"] = targets.checks;
  }
  // A check this tool already holds is never dropped because its rule is broken today: the row
  // stays, so the check stays, and the gate fails with the real reason.
  const pointed = parseLedger(read(FILES.ledger) ?? "")
    .filter((row) => row.check === TOOL)
    .map((row) => row.id);
  const kept = Object.keys(prior).filter((id) => !(id in checks) && pointed.includes(id));
  for (const id of kept) checks[id] = prior[id];
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
  files[RULES_PAGE] = rulesPage(checks, (file) => file in files || read(file) !== null);
  // The ledger may hold rows this plugin did not write: they are kept exactly as they are.
  files[FILES.ledger] = mergeLedger(read(FILES.ledger), rows);
  for (const layer of LAYERS.filter((l) => l.built)) {
    const entry = blueprint.layers[layer.id];
    if (entry.status !== "decided") continue;
    const values = layer.id === "foundations" ? foundations.choice : entry.choice;
    const listed = [...rows, ...templates.known];
    files[`design/decisions/${layer.id}.md`] = record(layer, entry, listed, values);
  }
  return {
    files: { ...files, ...vendored() },
    theme,
    tokens,
    components,
    targets,
    columns,
    patterns,
    templates,
    governance,
    kept,
  };
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
  if (!existsSync(blueprintPath) && dryRun) {
    stdout.write(
      `the floor is in place. ${BLUEPRINT} is not there yet: write it, in the shape the guide's first step gives, then run this again.\n`,
    );
    exit(0);
  }
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

  const pending = LAYERS.filter(
    (l) =>
      l.built &&
      blueprint.layers[l.id].status !== "decided" &&
      !(LATER_LAYERS.includes(l.id) && blueprint.layers[l.id].status === "planned"),
  );
  if (pending.length > 0) {
    stdout.write(
      `files: shown once these layers are decided: ${pending.map((l) => l.title).join(", ")}\n`,
    );
    return;
  }
  const { files, tokens, components, targets, columns, patterns, templates, governance, kept } =
    plan(target, blueprint);
  const unmet = (id) =>
    kept.includes(id)
      ? "Its check stays, and the gate fails until that changes"
      : "No check is added until that changes";
  for (const [id, item] of Object.entries(patterns.held)) stdout.write(`${id}: ${item.what}\n`);
  for (const item of patterns.failing) {
    stdout.write(`note: ${item.id}: ${item.why}. ${unmet(item.id)}.\n`);
  }
  for (const note of patterns.notes) stdout.write(`hint: ${note}.\n`);
  for (const [id, item] of Object.entries(templates.held)) stdout.write(`${id}: ${item.what}\n`);
  if (templates.recordPanel) {
    const opening = recordLayout(blueprint);
    const whose = opening.confirmed ? "as the person chose" : "proposed, until a person chooses";
    stdout.write(`record-panel: a record opens ${opening.layout}, ${whose}\n`);
  }
  for (const row of templates.rows) {
    const how = row.check ? `proved by ${row.check}` : "recorded, for a person to confirm";
    stdout.write(`${row.id}: ${how}\n`);
  }
  for (const item of templates.failing) {
    stdout.write(`note: ${item.id}: ${item.why}. ${unmet(item.id)}.\n`);
  }
  for (const note of templates.notes) stdout.write(`hint: ${note}.\n`);
  for (const [id, item] of Object.entries(governance.held)) stdout.write(`${id}: ${item.what}\n`);
  for (const item of governance.failing) {
    stdout.write(`note: ${item.id}: ${item.why}. ${unmet(item.id)}.\n`);
  }
  if (columns.problem) {
    stdout.write(
      `note: column types: ${columns.problem}. No check is added until the table is right.\n`,
    );
  } else {
    stdout.write(
      `column types: ${columns.fields} field(s) of the data model name a column type; alignment, width and density come from it\n`,
    );
    if (columns.fields === 0) {
      stdout.write(
        "hint: no field names a column type yet. The three table rules are held all the same. Give a field of the data model a `display` key and run the guide again: it then holds display-kind and installs the typed table parts.\n",
      );
    }
    for (const item of columns.failing) {
      stdout.write(`note: ${item.id}: ${item.why}. ${unmet(item.id)}.\n`);
    }
  }
  if (targets.what) stdout.write(`target size: ${targets.what}\n`);
  else if (targets.below?.length > 0) {
    stdout.write(
      `note: target size: ${targets.below.join("; ")} are below the ${targets.min}px the conformance level asks. No check is added: the components change first, or the level does.\n`,
    );
  }
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
