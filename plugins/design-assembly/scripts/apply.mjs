// Writes what the guide decided into a repository. Adds and updates only its own files, its own
// block in src/index.css and its own rows of the ledger. Running it again with the same blueprint
// changes nothing.
// Usage: node apply.mjs [--target DIR] [--dry-run] [--replace] [--json]
// Exit: 0 done; 1 a built layer is not decided yet, or the preview shows a write that would be
// refused; 2 a wrong call, a blueprint that cannot be written from, or a repository that cannot
// be read.
import {
  DEFAULT_FOLDER,
  sourceFolder,
} from "../templates/tools/design-assembly/source-folders.mjs";
import { existsSync, mkdirSync, readdirSync, statSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { stdout } from "node:process";
import { fileURLToPath } from "node:url";

import { fileChange, finish, readCall, Refusal, refuse, start } from "./command.mjs";
import { directionOf, directionProblem, directionsFor } from "./directions.mjs";
import {
  FIXED_SECTION,
  principleLines,
  principleProblems,
  principleRecord,
  principleRows,
  principlesOf,
  recommendations,
  ROW_PREFIX,
} from "./principles.mjs";
import { STAMP, stampText } from "./stamp.mjs";
import { starterIntakeFiles, starterRows } from "./starter-intake.mjs";
import { branchBase } from "../templates/tools/design-assembly/owner-calls.mjs";
import { FILES, heldHere, TAKEN_DOWN_CHECK } from "../templates/tools/design-assembly/check.mjs";
import { CHOOSE_FIRST_CHECK } from "../templates/tools/design-assembly/choose-first.mjs";
import { contrast, formatOklch, parseColor } from "../templates/tools/design-assembly/color.mjs";
import {
  followsOf,
  measurePairs,
  modeOf,
  pairChecks,
  roleSentences,
  ROLES_FILE,
  wordsOf,
  wordsProblems,
} from "./color-roles.mjs";
import {
  BASES,
  buildColumns,
  cellProblems,
  COLUMNS_FILE,
  readDisplays,
  TYPES_FILE,
  typesProblem,
} from "../templates/tools/design-assembly/columns.mjs";
import { buildOf } from "../templates/tools/design-assembly/adapters/index.mjs";
import { adapter as browser } from "../templates/tools/design-assembly/adapters/playwright.mjs";
import { adapter as library } from "../templates/tools/design-assembly/adapters/shadcn.mjs";
import {
  LEDGERS,
  newerLedgers,
  shapeProblems,
} from "../templates/tools/design-assembly/contract.mjs";
import {
  COMPONENTS_DECISION,
  outOfGitChecks,
  COMPONENTS_FOLDER,
  componentsProblem,
  libraryFolders,
  libraryParts,
  ownFolder,
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
import {
  gateHost,
  joinsMkFiles,
  MK_FOLDER,
  readMakefile,
} from "../templates/tools/design-assembly/host-make.mjs";
import { lineWidth, renderJson } from "../templates/tools/design-assembly/json.mjs";
import { isDay, WAITING_FOLDER } from "../templates/tools/design-assembly/waiting.mjs";
import {
  declaredFonts,
  fontProblems,
  FONT_VARIABLES,
  readLoads,
} from "../templates/tools/design-assembly/fonts.mjs";
import {
  channelsProblem,
  CORE_STATES,
  emptyStateProblem,
  errorCopyProblem,
  RECORD_LINE,
  REGISTRY as SCREENS,
  screenLinksProblem,
  screenPaths,
  STATES_FILE,
  statesProblem,
  withRecordLayout,
  wordsProblem,
} from "../templates/tools/design-assembly/patterns.mjs";
import { mergeLedger, parseLedger, TOOL } from "../templates/tools/design-assembly/ledger.mjs";
import { FAMILY_CORE_CHECK, readPinnedCore } from "../templates/tools/design-assembly/contract.mjs";
import { familyQuestion } from "./core-list.mjs";
import {
  blueprintCoreProblems,
  blueprintReasons,
  coreWidths,
  inheritedSummary,
  keepLeftMarks,
  markLedger,
  readMember,
} from "./core-marks.mjs";
import {
  KINDS_FOLDER,
  kindsProblem,
  ledgerFromCode,
  PAGES_TEST,
  readKinds,
  readPages,
  referenceProblem,
  screenLedgerProblem,
  SIZES_FILE,
  sizesProblem,
  STARTER_WIDTHS,
} from "../templates/tools/design-assembly/screens.mjs";
import {
  FRAGMENTS,
  FRAGMENT_LEDGERS,
  fragmentsChecks,
  ledgerOf,
  ledgerText as screensText,
} from "../templates/tools/design-assembly/screen-fragments.mjs";
import {
  FRAGMENTS_SHARED,
  fragmentsFolder,
  readScreenLedger,
  renderScreenLedger,
  SCREEN_LEDGER,
} from "../templates/tools/design-assembly/screen-ledger.mjs";
import {
  MODEL,
  offersOf,
  readModel,
  screenActionsProblem,
} from "../templates/tools/design-assembly/screen-actions.mjs";
import {
  MARK,
  SEEN_DECISION,
  SEEN_TEST,
  seenFilesProblem,
} from "../templates/tools/design-assembly/screen-actions-seen.mjs";
import {
  FLOATING_CHECK,
  FLOATING_TEST,
  hasTestBrowser,
} from "../templates/tools/design-assembly/floating-parts.mjs";

// The repository's own test that the ledger of screens and the code agree while the code runs.
const LEDGER_TEST = "tests/screens-ledger.test.ts";
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
  LOGO_PINS_CHECK,
  LOGO_USE_CHECK,
  readFontSources,
  readLogoSources,
  sourcedLogo,
  sourceLogoId,
} from "../templates/tools/design-assembly/sources-ledger.mjs";
import {
  applyBlock,
  buildTheme,
  ownWritten,
  readBlock,
  renderBlock,
  sourcedFont,
  sourceFontFile,
  sourceFontId,
  THRESHOLDS,
} from "../templates/tools/design-assembly/theme.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const PLUGIN = path.resolve(HERE, "..");

// The browser test that opens the floating parts of the items of outside sources, as the guide,
// adopting and upgrading write it where the repository has none: two lines that call the check.
export const floatingTest = () =>
  readFileSync(path.join(PLUGIN, "templates/owned/floating-parts.spec.ts.template"), "utf8");
// The check under the ledgers' shapes that holds it, and the file to write, where the repository
// has the adapter's test browser; nothing where it has not.
export function floatingParts(target) {
  if (!hasTestBrowser(target)) return { checks: [], files: {} };
  const there = existsSync(path.join(target, FLOATING_TEST));
  return { checks: [FLOATING_CHECK], files: there ? {} : { [FLOATING_TEST]: floatingTest() } };
}
export const BLUEPRINT = "design/blueprint.json";
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

// Foundations choices added after that, with no value of the floor's to fall back on: a blueprint
// decided before them leaves the stylesheet as it is, and the choice waits on the owner. Both are
// answered together, and the owner's answer says who gave it and when.
export const LATER_CHOICES = ["text_font", "heading_font"];
// The rows the guide writes for more than one choice, by the choices they stand for.
export const ROW_CHOICES = { typeface: LATER_CHOICES };

// A layer built after the first version: a blueprint that still has it `planned` was written
// before it could be asked, so its answer is the guide's proposal until the person gives one.
const LATER_LAYERS = ["patterns"];

// What a font of the sources ledger is read from in a repository: the reading the gate makes.
export const fontsOf = (target, stylesheet = FILES.css) => ({
  sources: readFontSources(target),
  stylesheet,
  faces: buildOf(target).fontFaces ?? null,
});

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

// The closed list of status tones: each tone, the role it writes and its colour in each mode.
export const STATUS_TONES = readJson(path.join(PLUGIN, "references/status-tones.json")).tones;

function colorRoleInputs(blueprint) {
  const foundations = blueprint.layers?.foundations ?? {};
  const words = foundations.roles;
  if (!words || typeof words !== "object") return {};
  const colorRoles = Object.fromEntries(
    Object.entries(words).map(([question, word]) => [question, word?.source]),
  );
  const follows = followsOf(words);
  const choice = foundations.choice ?? {};
  // The values the two formulas read: the neutral family, and the entries of the closed list for
  // the tones chosen, with the brand's own colours the owner gave for them.
  const formula = (question) => words[question]?.source === "formula";
  const tones = formula("color-roles-status")
    ? STATUS_TONES.filter((entry) => [choice.status_tones ?? []].flat().includes(entry.tone)).map(
        ({ tone, role, light, dark, always }) => ({
          tone,
          role,
          light,
          dark,
          ...(always ? { always } : {}),
        }),
      )
    : [];
  const exceptions = Object.fromEntries(
    Object.entries(foundations.brand_exceptions ?? {}).map(([role, own]) => [
      role,
      { light: own?.light, dark: own?.dark },
    ]),
  );
  return {
    colorRoles,
    ...(Object.keys(follows).length > 0 ? { follows } : {}),
    ...(formula("color-roles-neutral") && choice.neutral_family !== undefined
      ? { neutralFamily: choice.neutral_family }
      : {}),
    ...(tones.length > 0 ? { statusTones: tones } : {}),
    ...(Object.keys(exceptions).length > 0 ? { exceptions } : {}),
  };
}

// The choices of the foundations that answer a question of the table of colour roles, and why
// each is wrong: given once the owner's word for its question is formula, and only then; one
// option, or for one that takes many, a list of its options holding those it always holds.
function askedChoiceProblems(layer, values, words) {
  const found = [];
  for (const choice of layer.choices.filter((item) => item.asked_by)) {
    const value = values[choice.key];
    const formula = words?.[choice.asked_by]?.source === "formula";
    if (value === undefined) {
      if (formula) found.push(`${layer.id}: no ${choice.name}`);
      continue;
    }
    if (!formula) {
      found.push(
        `${layer.id}: the ${choice.name} is written only once roles.${choice.asked_by} is formula, the owner's word that the formula writes its roles`,
      );
      continue;
    }
    const names = Object.keys(choice.options);
    if (!choice.many) {
      if (!names.includes(value)) {
        found.push(`${layer.id}: ${choice.name} must be one of ${names.join(", ")}`);
      }
      continue;
    }
    const twice = Array.isArray(value)
      ? value.filter((item, index) => value.indexOf(item) !== index)
      : [];
    if (!Array.isArray(value) || value.some((item) => !names.includes(item))) {
      found.push(`${layer.id}: ${choice.name} are among ${names.join(", ")}, as a list`);
    } else if (twice.length > 0) {
      found.push(`${layer.id}: ${choice.name} name ${[...new Set(twice)].join(", ")} twice`);
    } else if ((choice.always ?? []).some((item) => !value.includes(item))) {
      found.push(`${layer.id}: ${choice.name} always take ${choice.always.join(", ")}`);
    }
  }
  return found;
}

// A brand's own status colour, as the blueprint gives it: for the role of a tone the owner chose,
// in both modes, with why and the owner's name and day.
function exceptionProblems(foundations) {
  const own = foundations?.brand_exceptions;
  if (own === undefined) return [];
  if (own === null || typeof own !== "object" || Array.isArray(own)) {
    return [
      "foundations: brand_exceptions maps the role of a status tone to the brand's own colour",
    ];
  }
  const chosen = [foundations.choice?.status_tones ?? []].flat();
  return Object.entries(own).flatMap(([role, said]) => {
    const at = `foundations: brand_exceptions.${role}`;
    const tone = STATUS_TONES.find((entry) => entry.role === role);
    if (!tone) return [`${at} is not the role of a status tone`];
    const found = [];
    if (!chosen.includes(tone.tone)) found.push(`${at}: the ${tone.tone} tone is not chosen`);
    for (const mode of ["light", "dark"]) {
      if (parseColor(String(said?.[mode] ?? "")) === null) {
        found.push(`${at}: its ${mode} colour must be written as #rrggbb or oklch(L C H)`);
      }
    }
    if (typeof said?.why !== "string" || said.why.trim() === "") found.push(`${at}: no why`);
    if (!(typeof said?.by === "string" && said.by.trim() !== "" && isDay(said?.on))) {
      found.push(
        `${at} is the owner's word, and the blueprint does not say who gave it and when: write by and on (YYYY-MM-DD)`,
      );
    }
    return found;
  });
}

// What the note of the contrast row says: how many pairs are measured, and which wait.
function contrastNote(checks) {
  const waiting = checks.filter((check) => check.waits);
  return `every pair of the plugin's table of colour roles (${ROLES_FILE}) in light and dark mode, ${checks.length} in all: text at the threshold for text, a ring at the threshold for parts that are not text${waiting.length > 0 ? `; ${waiting.length} below the threshold wait on the owner and are named on every run` : ""}`;
}

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
      ...(choice.text_font !== undefined ? { textFont: choice.text_font } : {}),
      ...(choice.heading_font !== undefined ? { headingFont: choice.heading_font } : {}),
      // The mark, where the blueprint names one: it writes no value of the theme, and the gate
      // compares it with the blueprint as it compares every answer.
      ...(choice.mark !== undefined ? { mark: choice.mark } : {}),
      // The owner's word for each question of the table of colour roles, and the roles it makes
      // follow another. A blueprint without words leaves the floor's roles as they are.
      ...colorRoleInputs(blueprint),
    },
    choice,
    defaulted,
  };
}

// One line per problem in the blueprint. Empty means it can be applied, or, with `preview`, that a
// preview can be shown: a preview is what the person looks at BEFORE approving, so it accepts a
// blueprint that is still being designed. `sources` is the fonts of the sources ledger, as
// `readFontSources` gives them: a typeface that names one is held against its row. `logos` is the
// logo rows, as `readLogoSources` gives them, which a mark that names one is held against.
export function blueprintProblems(blueprint, { preview = false, sources, logos } = {}) {
  const found = [];
  if (!preview && blueprint.status !== "approved") {
    found.push(
      'status must be "approved" before applying (a preview with --dry-run does not need it)',
    );
  }
  found.push(...principleProblems(blueprint, { preview }));
  const direction = directionProblem(blueprint);
  if (direction) found.push(direction);
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
    const anyLater = LATER_CHOICES.some((key) => values[key] !== undefined);
    for (const choice of layer.choices.filter((c) => applies(c, values) && !c.asked_by)) {
      const value = values[choice.key];
      if (value === undefined) {
        // A choice that reads as one of its options when the blueprint does not name it.
        if (choice.unset !== undefined) continue;
        if (!LATER_CHOICES.includes(choice.key) || anyLater) {
          found.push(`${layer.id}: no ${choice.name}`);
        }
      } else if (choice.sourced?.kind === "logo" && sourceLogoId(value) !== null) {
        // A logo row: it can be chosen when the row is there, whole, with its licence and a pin
        // that still holds. Where the ledger was not read, only the form of the value is held.
        if (logos === undefined) continue;
        try {
          sourcedLogo(value, logos);
        } catch (error) {
          found.push(`${layer.id}: ${choice.name} ${value}: ${error.message}`);
        }
      } else if (choice.sourced?.kind === "font" && sourceFontId(value) !== null) {
        // A row of the sources ledger: it can be chosen when the row is there and whole. Where
        // the ledger was not read, only the form of the value is held.
        if (sources === undefined) continue;
        try {
          sourcedFont(value, sources);
        } catch (error) {
          found.push(`${layer.id}: ${choice.name} ${value}: ${error.message}`);
        }
      } else if (choice.options && !(value in choice.options)) {
        const sourced = choice.sourced
          ? `, or ${choice.sourced.prefix}<id> for a ${choice.sourced.kind} of the sources ledger`
          : "";
        found.push(
          `${layer.id}: ${choice.name} must be one of ${Object.keys(choice.options).join(", ")}${sourced}`,
        );
      }
    }
    found.push(...answeredProblems(layer, entry, values));
    found.push(...askedChoiceProblems(layer, values, blueprint.layers?.foundations?.roles));
  }
  found.push(...exceptionProblems(blueprint.layers?.foundations));
  const words = blueprint.layers?.foundations?.roles;
  if (words !== undefined) found.push(...wordsProblems(words));
  const color = blueprint.layers?.foundations?.choice?.source_color;
  if (color !== undefined && parseColor(String(color)) === null) {
    found.push("foundations: source color must be written as #rrggbb or oklch(L C H)");
  }
  return found;
}

// Who gave a later choice and when, where it is the owner's answer: the guide writes it into the
// blueprint with the answer, and the decision sheet writes it when the owner confirms a proposal.
function answeredProblems(layer, entry, values) {
  const found = [];
  for (const choice of layer.choices) {
    if (values[choice.key] === undefined) continue;
    const owners = entry.source === "user" || (entry.confirmed ?? []).includes(choice.key);
    const said = entry.answered?.[choice.key];
    // A later choice must say who gave it, and so must one that reads as an option when unset, such
    // as the mark; any other may, and then says it whole.
    const later = LATER_CHOICES.includes(choice.key) || choice.unset !== undefined;
    if (!later && said === undefined) continue;
    if (later && !owners) continue;
    if (!owners) {
      found.push(
        `${layer.id}: answered.${choice.key} says who gave ${choice.name}, and the blueprint records it as a proposal: write the layer as the owner's, or list it under confirmed`,
      );
      continue;
    }
    const named = typeof said?.by === "string" && said.by.trim() !== "" && isDay(said?.on);
    if (!named) {
      found.push(
        `${layer.id}: ${choice.name} is the owner's answer, and the blueprint does not say who gave it and when: write answered.${choice.key} with by and on (YYYY-MM-DD)`,
      );
    }
  }
  return found;
}

// Why this plugin's checks could not join the repository's gate, or null: a Makefile that reads
// every mk file, or, where the repository keeps no Makefile, a script of its package.
export function gateProblem(target) {
  return gateHost(target).problem ?? null;
}

// Why the guide's checks could not join make check, or null: the guide lays its gate step there.
function makeGateProblem(target) {
  if (!joinsMkFiles(readMakefile(target))) {
    return "the Makefile does not include mk/*.mk, so the checks could not join make check";
  }
  return null;
}

// Why this folder cannot take the result, or null. The guide builds on a floor; it does not lay one.
export function floorProblem(target) {
  if (!existsSync(path.join(target, FILES.css))) {
    return `${FILES.css} is missing: this repository has no design floor to build on`;
  }
  return makeGateProblem(target);
}

// The key of the tool data that names, one by one, the adopted values that came from the floor:
// laid by `adopt --starter`, never by adopting a repository's own values.
export const FROM_FLOOR = "adopted_from_floor";

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
  const theme = JSON.parse(read(FILES.theme) ?? "{}");
  // Values laid on a floor came from the floor, not from the repository: the guide may write over
  // them, as it would over the floor itself. Each is named; any other adopted value is the
  // repository's own.
  const floor = theme[FROM_FLOOR] ?? [];
  const adopted = (theme.adopted ?? []).filter(
    (id) => GENERATED_VALUES.includes(id) && !floor.includes(id),
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

// Whether the floor's browser checks run here: the routes they open and the accessibility package.
function browserTestHere(target) {
  const read = (file) =>
    existsSync(path.join(target, file)) ? readFileSync(path.join(target, file), "utf8") : null;
  const uses = JSON.parse(read("package.json") ?? "{}");
  const installed = { ...uses.dependencies, ...uses.devDependencies };
  return read(ROUTES) !== null && browser.accessibilityPackage in installed;
}

// The table of screen widths a repository starts from, where the floor's browser checks run and
// the repository has none: the file and its text, or nothing.
export function startingSizes(target) {
  if (!browserTestHere(target) || existsSync(path.join(target, SIZES_FILE))) return {};
  // A repository of a family starts from the widths its core holds, where it holds them.
  const widths = coreWidths(target) ?? STARTER_WIDTHS;
  return { [SIZES_FILE]: renderJson({ version: 1, widths }, lineWidth(target)) };
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
  return libraryFolders(target)[0] ?? COMPONENTS_FOLDER;
}

// The tool data the repository has today, or null.
function priorTheme(target) {
  const file = path.join(target, FILES.theme);
  try {
    return existsSync(file) ? JSON.parse(readFileSync(file, "utf8")) : null;
  } catch {
    return null;
  }
}

// The component manifest for the source as it is, with its ledger row and its check; or why it
// is left alone. `nothing` means the repository has no components to list.
export function componentsPlan(target, alreadyHeld, pending = {}) {
  const folder = componentsFolder(target);
  // Components of the repository's own sit beside the library's folder, and are listed too.
  const own = ownFolder(folder);
  const read = own ?? folder;
  // `pending` holds files about to be written: a component installed in the same run is listed.
  const arriving = Object.entries(pending).filter(([file]) => file.startsWith(`${read}/`));
  const sources = { ...readFolder(target, read), ...Object.fromEntries(arriving) };
  if (!Object.keys(sources).some((name) => name.startsWith(`${folder}/`))) return { nothing: true };
  // Another library's folder, installed from a second registry, is a library too. Where the
  // library shares its folder with the repository's own components, its parts are its files.
  const others = libraryFolders(target).filter((item) => item !== folder);
  const parts = own ? null : libraryParts(target);
  // The folder `@/` stands for: said in the check only where it is not the usual one.
  const { folder: source } = sourceFolder(target);
  const away = source === DEFAULT_FOLDER ? {} : { source };
  const options = { library: parts ?? [folder, ...others], pages: readPages(target), ...away };
  const file = socket(target, "registry") ?? REGISTRY;
  const full = path.join(target, file);
  const before = existsSync(full) ? readFileSync(full, "utf8") : null;
  if (before !== null && !alreadyHeld && componentsProblem(before, sources, file, read, options)) {
    return {
      skipped: `${file} is already there and is not what ${read} gives. It is kept, and no component manifest is written`,
    };
  }
  return {
    file,
    content: renderJson(readComponents(sources, options), lineWidth(target)),
    row: {
      id: COMPONENTS_DECISION,
      layer: "components",
      kind: "formula",
      source: `${read}, written out by make design-components`,
      check: TOOL,
    },
    checks: [
      {
        kind: "components",
        file,
        folder,
        ...(others.length > 0 ? { libraries: others } : {}),
        ...(own ? { own } : {}),
        ...(parts ? { library: parts } : {}),
        pages: KINDS_FOLDER,
        ...away,
      },
      // A repository that keeps the manifest out of git said so in its tool data: the choice is
      // carried over, never made here, and it follows the manifest when its path changes.
      ...outOfGitChecks(priorTheme(target), file),
    ],
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
  // What every list screen shares: loading, trying again, filtering, one row changing in place.
  "list.ts.template": (folder) => `${path.posix.dirname(path.posix.dirname(folder))}/lib/list.ts`,
  "list.test.tsx.template": () => "tests/list.test.tsx",
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
// The toast and the one module screens tell results through, with the frame that draws the toaster.
const TOAST_PARTS = (folder) => ({
  [library.toast.template]: `${folder}/${library.toast.file}`,
  "notify.ts.template": "src/lib/notify.ts",
  "notify.test.tsx.template": "tests/notify.test.tsx",
  "app-frame.tsx.template": `${path.posix.dirname(folder)}/app-frame.tsx`,
  "app-frame.test.tsx.template": "tests/frame.test.tsx",
});

// Where a template of the starter kit goes in a repository: the place the guide writes it, from
// the folder of its components. Null for a template the guide does not place.
export function ownedFileOf(target, template) {
  const folder = componentsFolder(target);
  const placed = { ...OWNED, ...ROW_PARTS, ...RECORD_PARTS }[template];
  return placed ? placed(folder) : (TOAST_PARTS(folder)[template] ?? null);
}

// The rows of the intake ledger for the pieces of the starter kit, in the ledger the gate reads.
function starterIntakePlan(target, files, layout) {
  const named = priorTheme(target)?.checks?.["ledger-shapes"];
  const file =
    (Array.isArray(named) ? named.map((check) => check?.ledgers?.intake).find(Boolean) : null) ??
    LEDGERS.intake.file;
  const asLaid = (template) => {
    const text = readFileSync(path.join(PLUGIN, "templates/owned", template), "utf8");
    return template === RECORD_TEMPLATE && layout ? withRecordLayout(text, layout) : text;
  };
  // Whether the main branch has a file: outside git, or with no commit yet, it has none.
  const found = branchBase(target, { fetch: false });
  const onMain = (file) =>
    Boolean(found?.git && found.base) &&
    found.git("cat-file", "-e", `${found.base}:${file}`).status === 0;
  const rows = starterRows(target, {
    file,
    files,
    placeOf: (template) => ownedFileOf(target, template),
    asLaid,
    onMain,
  });
  return starterIntakeFiles(target, file, rows);
}

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

  const skip = [...libraryParts(target), "src/generated/"];
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
  const skip = [...libraryParts(target), "src/generated/"];
  const sources = readFolder(target, "src");
  const files = {};
  const held = {};
  const failing = [];
  const propose = (id, problem, item) => {
    if (problem) failing.push({ id, why: problem });
    else held[id] = item;
  };

  const registry = read(SCREENS);
  // The ledger of screens: written once from the code that lists them, then a person's. It is
  // read in whichever shape the repository keeps it, one file or one file per screen, and a
  // repository that keeps fragments is never given the one file again.
  let ledgerText = screensText(target, SCREEN_LEDGER);
  if (registry !== null && ledgerText === null && starter) {
    ledgerText = renderScreenLedger(ledgerFromCode(registry, readPages(target), sources));
    files[SCREEN_LEDGER] = ledgerText;
  }
  const withLedger = ledgerText === null ? {} : { ledger: SCREEN_LEDGER };
  // A repository that keeps fragments has no such file: its ledger is named by its folder.
  const asFragments = fragmentsChecks(target, priorTheme(target), SCREEN_LEDGER);
  const ledgerName = asFragments.length > 0 ? fragmentsFolder(SCREEN_LEDGER) : SCREEN_LEDGER;
  if (registry !== null && ledgerText !== null) {
    const shape = shapeProblems("screens", ledgerText, ledgerName);
    propose(
      "screen-ledger",
      shape.length > 0
        ? shape.slice(0, 3).join("; ")
        : screenLedgerProblem(ledgerText, registry, readPages(target), ledgerName),
      {
        what: `${ledgerName} lists the screens ${SCREENS} lists, each of a described kind`,
        row: {
          layer: "templates",
          kind: "closed",
          source: `${ledgerName}, every screen with its kind and states`,
          check: TOOL,
          note: `that the ledger has its shape and lists the screens the code lists, each family a kind with a page; that each screen's title and states are the code's is held by the repository's own test, ${LEDGER_TEST}`,
        },
        checks: [
          { kind: "screen-ledger", file: SCREEN_LEDGER, registry: SCREENS, pages: KINDS_FOLDER },
        ],
      },
    );
    // The test that reads the ledger and the code while the code runs: installed once, then the
    // repository's own.
    if (code && read(LEDGER_TEST) === null && read("src/lib/labels.ts") !== null) {
      files[LEDGER_TEST] = readFileSync(
        path.join(PLUGIN, "templates/owned/screens-ledger.test.ts.template"),
        "utf8",
      );
    }
  }
  // The ledger of screens joined with the domain model, once the ledger says what a screen shows,
  // opens with or offers, and the repository declares actions. Its names are the repository's.
  const model = readModel(target);
  if (
    ledgerText !== null &&
    model.present &&
    shapeProblems("screens", ledgerText, SCREEN_LEDGER).length === 0 &&
    offersOf(readScreenLedger(ledgerText)).declared
  ) {
    propose("screen-actions", screenActionsProblem(ledgerText, model, SCREEN_LEDGER), {
      what: `every action of ${MODEL}/ is offered on a screen of ${SCREEN_LEDGER} to every role that may run it, and no screen shows a record or a button to a role without the right`,
      row: {
        layer: "templates",
        kind: "closed",
        source: `${SCREEN_LEDGER}, what each screen shows, opens with and offers, against ${MODEL}/`,
        check: TOOL,
        note: "reads the ledger and the model as written: where a button sits is not checked, and that a role without the right does not see it while the screen runs is checked only by the browser test of the row screen-actions-seen, where the repository has it",
      },
      checks: [{ kind: "screen-actions", file: SCREEN_LEDGER, model: MODEL }],
    });
  }
  // What each role sees in a browser, once the join above is held and the repository has the
  // adapter's test browser and its own file of ways in. The test is installed with the guide's
  // code; adopting holds it only where it is already there. No way in is ever written here.
  if ("screen-actions" in held && seenMissing(target).length === 0) {
    let test = read(SEEN_TEST);
    if (test === null && code) {
      test = readFileSync(
        path.join(PLUGIN, "templates/owned/screen-actions-seen.spec.ts.template"),
        "utf8",
      );
      files[SEEN_TEST] = test;
    }
    if (test !== null) {
      const door = browser.door.file;
      propose(
        SEEN_DECISION,
        seenFilesProblem({ door: read(door), test }, { doorFile: door, testFile: SEEN_TEST }),
        {
          what: `each role sees in a browser the buttons ${SCREEN_LEDGER} and ${MODEL}/ give it on every built screen it opens, and no button it may not press`,
          row: {
            layer: "templates",
            kind: "closed",
            source: `${SEEN_TEST}, entering as each role by ${door}, against the gate's table of screens by role`,
            check: TOOL,
            note: `that the browser test is there, reads the gate's own plan and enters by ${door}, and that the file is there; the test itself runs with the repository's browser checks. A control is known only by its ${MARK} mark, so a control of an action that lacks it is not seen; what a role that may not open a screen is shown instead, and the frame's navigation, are not checked`,
          },
          checks: [
            { kind: SEEN_DECISION, test: SEEN_TEST, door, file: SCREEN_LEDGER, model: MODEL },
          ],
        },
      );
    }
  }
  let statesText = read(STATES_FILE);
  if (registry !== null && statesText === null && starter) {
    statesText = renderJson({ version: 1, required: CORE_STATES, exempt: {} }, lineWidth(target));
    files[STATES_FILE] = statesText;
  }
  if (registry !== null && statesText !== null) {
    propose("state-matrix", statesProblem(statesText, registry, STATES_FILE, ledgerText), {
      what: `every screen of ${SCREENS} declares the states of ${STATES_FILE}`,
      row: {
        layer: "patterns",
        kind: "closed",
        source: STATES_FILE,
        check: TOOL,
        note: "that every screen declares the required states; that each one can be reached, and what it shows, is for the repository's own browser tests",
      },
      checks: [{ kind: "states", file: STATES_FILE, registry: SCREENS, ...withLedger }],
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
    propose("empty-state-actions", emptyStateProblem(readSources(target, "src"), skip), {
      what: "no empty state dresses a link as a button",
      row: {
        layer: "patterns",
        kind: "closed",
        source: "an empty state offers a button only where the person can fill the list there",
        check: TOOL,
        note: "that no empty state dresses a link as a button; whether it says why it is empty and how items arrive is a person's review",
      },
      checks: [{ kind: "empty-state", sources: "src", skip }],
    });
    if (registry !== null) {
      propose(
        "navigation-in-frame",
        screenLinksProblem(readSources(target, "src"), screenPaths(registry, ledgerText), skip),
        {
          what: "no screen links to another screen: moving between screens is the frame's",
          row: {
            layer: "templates",
            kind: "closed",
            source: "the application's frame, the same place and order on every screen",
            check: TOOL,
            note: "that no file below the frame links to a listed screen by its path; that the frame shows every screen in order is for the repository's own tests",
          },
          checks: [
            { kind: "screen-links", sources: "src", registry: SCREENS, skip, ...withLedger },
          ],
        },
      );
    }
  }
  // The toast and the one module screens tell results through: installed where the toast library
  // is already a dependency and the floor's components are, and never written over.
  const notes = [];
  if (code && folder === COMPONENTS_FOLDER) {
    const uses = JSON.parse(read("package.json") ?? "{}").dependencies ?? {};
    if (library.toast.package in uses) {
      // The frame comes with them: it draws the toaster once, and clears a screen's toasts when a
      // person moves on.
      const owned = TOAST_PARTS(folder);
      // The test of the toast's mark comes only with a module that takes an action's name: one
      // installed before that stays the repository's as it is, and the test would be red there.
      const module = read(owned["notify.ts.template"]);
      const named = module === null || /\baction\?: string\b/.test(module);
      for (const [name, file] of Object.entries(owned)) {
        if (name === "notify.test.tsx.template" && !named) continue;
        if (read(file) === null) {
          files[file] = readFileSync(path.join(PLUGIN, "templates/owned", name), "utf8");
        }
      }
    } else {
      notes.push(
        `no toast is installed. The channel rule is held all the same. To tell results in a toast, add the ${library.toast.package} package and run the guide again: it installs the toast and the module screens tell results through`,
      );
    }
  }
  return { files, held, failing, notes };
}

// What a repository lacks for the browser test by role, one line each: the adapter's test browser
// where the floor's browser checks run, and the file of ways in that the repository writes and
// keeps. Empty when it has both. The guide and status ask this one place.
export function seenMissing(target) {
  const read = (file) =>
    existsSync(path.join(target, file)) ? readFileSync(path.join(target, file), "utf8") : null;
  const uses = JSON.parse(read("package.json") ?? "{}");
  const installed = { ...uses.dependencies, ...uses.devDependencies };
  const missing = [];
  if (read(ROUTES) === null || !(browser.accessibilityPackage in installed)) {
    missing.push(
      `the repository has no test browser of the adapter: ${ROUTES} and the ${browser.accessibilityPackage} package, where the floor's browser checks run`,
    );
  }
  if (read(browser.door.file) === null) {
    missing.push(
      `${browser.door.file} is missing: one way in per role of the model, which the repository writes and keeps (${browser.door.shape}); the guide writes no sign-in code`,
    );
  }
  return missing;
}

// What the page-level browser test proves, by the decision each tag in it names.
const PAGE_PROOFS = {
  "one-main-one-h1": { layer: "templates", kind: "standard" },
  "no-sideways-scroll": { layer: "templates", kind: "formula" },
  "wcag-aa": { layer: "templates", kind: "standard" },
  "focus-after-action": { layer: "patterns", kind: "standard" },
  "row-actions-in-view": { layer: "patterns", kind: "standard" },
  "asked-action-closes": { layer: "patterns", kind: "standard" },
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
  // The ledger this run is about to write, else the one on disk in whichever shape it is kept.
  const ledgerText =
    SCREEN_LEDGER in pending ? pending[SCREEN_LEDGER] : screensText(target, SCREEN_LEDGER);
  const withLedger = ledgerText === null ? {} : { ledger: SCREEN_LEDGER };
  if (registry !== null && Object.keys(pages).length > 0) {
    propose("page-layouts", kindsProblem(pages, registry, sources, KINDS_FOLDER, ledgerText), {
      what: `every screen of ${SCREENS} is of one kind, and each kind has its page under ${KINDS_FOLDER}`,
      row: {
        layer: "templates",
        kind: "closed",
        source: `${KINDS_FOLDER}, one page per kind of screen`,
        check: TOOL,
        note: "that every screen is of exactly one kind, and that the kind's page names its main task; what the page says is a person's review",
      },
      checks: [
        {
          kind: "screen-kinds",
          pages: KINDS_FOLDER,
          registry: SCREENS,
          folder: "src",
          ...withLedger,
        },
      ],
    });
    if ("page-layouts" in held) {
      propose(
        "reference-implementation",
        referenceProblem(pages, registry, read(STATES_FILE), sources, ledgerText),
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
              ...withLedger,
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
  if (browserTestHere(target)) {
    let sizes = read(SIZES_FILE);
    if (sizes === null && starter) {
      Object.assign(files, startingSizes(target));
      sizes = files[SIZES_FILE];
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
  // The decision sheet stands in for the head of design: every choice points at a row, every
  // judgment nobody confirmed waits on the sheet, and a new kind of screen and the brand colour
  // wait for the owner. Both are held whatever this run finds, so that a branch that would fail
  // them later fails them: a wall that only stands when nothing pushes on it holds nothing.
  held["decision-sheet"] = DECISION_SHEET;
  held["owner-calls"] = OWNER_CALLS;
  return { files, held, failing };
}

// The two rows and their checks, as the guide and adopting write them.
export const DECISION_SHEET = {
  what: "every judgment this branch writes was answered by a person or is asked on the decision sheet, no source goes around a decided scale, and no test proves a decision without a row",
  row: {
    layer: "governance",
    kind: "closed",
    source:
      "every choice points at a row, and every judgment nobody confirmed waits on the decision sheet",
    check: TOOL,
    note: "what this branch writes is read from git against the main branch; a person's answer is read from the note of a row, as the decision sheet writes it; the choices it reads are values, components, kinds of screen, states, words and column types, and free layout inside a screen is not read",
  },
  checks: [
    { kind: "decision-sheet", sources: SOURCE_FOLDER, blueprint: BLUEPRINT, tests: "tests" },
  ],
};
export const OWNER_CALLS = {
  what: "a branch that adds a page of a kind of screen, or changes the root colour line, waits for the owner's answer that keeps that very item",
  row: {
    layer: "governance",
    kind: "closed",
    source:
      "a new kind of screen and the brand colour wait for the owner's answer in the waiting list",
    check: TOOL,
    note: `a new page under ${KINDS_FOLDER}, and the root colour line of the stylesheet, against the main branch; enforcing it on the hosting service is not this tool's`,
  },
  checks: [{ kind: "owner-calls", pages: KINDS_FOLDER }],
};

// The page an agent reads before it touches a screen: the rules this tool holds in this
// repository, and the command to run after each kind of change. Written from what is installed, so
// it never names a rule that is not held or a file that is not there.
export const RULES_PAGE = ".claude/rules/design-assembly.md";
// The section of the rules page whose lines no check holds: a person reviews them.
export const UNHELD_SECTION = "No check holds these: a person reviews them";
// The words of the rules page that say what the gate takes as a button for an action: the brief
// reads the line that holds them for the actions slot of every sheet.
export const TOAST_BUTTON = "a toast's button the screen raises";
// The words of the rules page that say a row's actions button takes no name for each action, and
// that two rules meet at a row's waiting state behind it: the brief reads these lines too.
export const NO_NAME_EACH = "takes no name for each action";
export const WAITING_WORDS = "which gives way is the owner's";
// The words of the rules page that say a control of an action carries the action's name: the brief
// reads the line that holds them for the actions slot too.
export const ACTION_MARK = "carries the action's name on itself";

// What the owner fixed before any value, as the lines of the rules page: each principle that is
// theirs, the direction they took, and how an agent uses them. A principle the owner did not fix
// is named apart, as settling nothing. Empty where the blueprint has neither.
const oneLine = (words) => String(words).replace(/\s+/g, " ").trim();
function fixedFirst(blueprint, asks) {
  // A principle with no words cannot be said: the guide refuses such a blueprint, and here it is
  // passed over.
  const principles = principlesOf(blueprint).filter(
    (principle) => oneLine(principle.statement) !== "",
  );
  const theirs = principles.filter((principle) => principle.confirmed);
  const unfixed = principles.filter((principle) => !principle.confirmed);
  const direction = directionOf(blueprint);
  if (principles.length === 0 && !direction) return [];
  const named = (list) => list.map((principle) => `\`${ROW_PREFIX}${principle.id}\``).join(", ");
  return [
    ...theirs.map(
      (principle) => `\`${ROW_PREFIX}${principle.id}\`: ${oneLine(principle.statement)}`,
    ),
    direction &&
      `The direction the owner took is \`${direction.id}\`: ${oneLine(direction.character)}`,
    // Whoever wrote it there: only a principle the owner fixed is theirs.
    unfixed.length > 0 &&
      `In the blueprint but not fixed by the owner, so settling nothing: ${named(unfixed)}.`,
    `No check holds these lines: they are what every other choice rests on. Where a choice is still open, take what they favour and say which line it rests on. Where they do not speak, or pull two ways, the choice is the owner's${asks ? ": ask it as the section on the owner's questions says" : ""}. Never add a line here or reword one: only the owner fixes a principle or takes a direction.`,
  ];
}

// What the rules page tells a builder to do before it builds or changes a screen: run the brief
// of that screen and build from its sheet, and ask what the sheet does not hold. The twelve slots
// are not every question of a screen: a builder that queues the open ones and asks nothing else
// decides the rest alone. `asks` is whether the page has the section on the owner's questions to
// point at; without it the call is named.
const briefFirst = (asks) => [
  ...BRIEF_FIRST,
  "",
  "The twelve slots are the choices every screen meets. They are not every question of the screen:",
  "a sheet with nothing open does not mean nothing is left to ask. Any other choice that no ledger,",
  "component or page of a kind settles is still the owner's, and is asked one question each: the",
  "name and the shape of a new concept, the word a reader sees for it, which look a control takes,",
  "what another screen does with what this one adds. The sheet names where such choices hide on",
  ...(asks
    ? [
        "the screen. Ask each as the section «Questions only the owner answers» says, and go on with",
        "your recommendation.",
      ]
    : [
        "the screen. Ask each with `/design-assembly:decide --ask`, with what you recommend and what",
        "it rests on, and go on with your recommendation.",
      ]),
];
const BRIEF_FIRST = [
  "Before you build or change a screen, run `/design-assembly:brief <screen id>`, with the screen's",
  "`id` in the ledger of screens; a screen that is not built yet is entered there first, with",
  "`status: planned`. It gives one sheet of twelve slots, every choice the screen's builder meets.",
  "A settled slot names the file and the line its answer comes from, or the owner's answer: build",
  "from it. An asked slot has a question that waits on the owner: go on with its recommendation,",
  "unless it says it is hard to undo. An open slot has nothing behind it: ask it before you choose",
  "alone, with the call the sheet gives, or all of them at once with `--queue`. Never answer a",
  "slot for the owner.",
];

// Whether the ledger of screens of a repository gives some screen a button for an action.
export function ledgerButtons(target) {
  const ledger = readScreenLedger(screensText(target, SCREEN_LEDGER));
  return offersOf(ledger ?? {}).screens.some((screen) => screen.actions.length > 0);
}

// What a typeface choice is called on the rules page.
const FONT_WORDS = {
  floor: (value) => `the floor's font (\`${value}\`)`,
  system: () => "the system font, which no file loads",
  text: () => "the text typeface",
};

// The lines of the rules page about the typeface: only where the repository holds its rows.
// `fonts` is what the build loads, as its adapter reads it, and `stylesheet` the repository's
// stylesheet: where no guide chose the typefaces, they are the stylesheet's as found, and a
// variable the stylesheet does not set is the one the build's font loader sets.
function typefaceRules(checks, blueprint, { fonts = [], stylesheet } = {}) {
  const values = Object.fromEntries(
    (checks.typeface ?? []).map((check) => [check.variable, check.expected]),
  );
  const [textVariable, headingVariable] = FONT_VARIABLES;
  const choice = blueprint?.layers?.foundations?.choice ?? {};
  const decided = LATER_CHOICES.some((key) => choice[key] !== undefined);
  const unset = (variable) => {
    const load = fonts.find((item) => item.variable === variable);
    return load
      ? `the typeface ${load.by} sets as \`${variable}\``
      : `\`${variable}\`, which the stylesheet does not set`;
  };
  const words = (key, variable) =>
    values[variable] === undefined
      ? unset(variable)
      : sourceFontId(choice[key]) !== null
        ? `\`${values[variable]}\`, the font of \`${sourceFontFile(choice[key])}\``
        : (FONT_WORDS[choice[key]]?.(values[variable]) ?? `\`${values[variable]}\``);
  const held = [textVariable, headingVariable].filter((variable) => variable in values);
  const holds = held.length === 2 ? "both" : `\`${held[0]}\` to it`;
  const where = stylesheet ? `\`${stylesheet}\`` : "the stylesheet";
  return [
    "typeface" in checks &&
      (decided
        ? `Running text is set in ${words("text_font", textVariable)} and headings in ${words("heading_font", headingVariable)}, as \`${BLUEPRINT}\` decides: the generated block of the stylesheet names them as \`${textVariable}\` and \`${headingVariable}\`, and the gate holds both.`
        : `Running text is set in ${words("text_font", textVariable)} and headings in ${words("heading_font", headingVariable)}, as ${where} sets them today, adopted as found: the gate holds ${holds}.`),
    "typeface" in checks &&
      `Never name a typeface in a screen or a component: text takes \`${textVariable}\` from the page, and a heading takes \`${headingVariable}\`. Another typeface is the owner's answer in the guide, never a class.`,
    "font-loaded" in checks &&
      "Every typeface the stylesheet names is loaded, or is one every device has: a new one comes with what loads it (an @font-face rule, a font package the stylesheet imports, or the build's own font loader), or the gate fails.",
  ];
}

// What the rules page says of the colour roles, where the contrast row measures the pairs of the
// table of colour roles: where each role's value comes from in this repository, grouped by the
// question that speaks for it, and how its pairs are held.
function colourRules(checks, blueprint) {
  const pairs = checks["color-contrast"] ?? [];
  const beyond = pairs.some(
    (check) => !["--primary", "--primary-foreground"].includes(check.foreground),
  );
  if (!beyond) return [];
  const waiting = pairs.filter((check) => check.waits).length;
  const foundations = blueprint?.layers?.foundations ?? {};
  const family =
    foundations.roles?.["color-roles-neutral"]?.source === "formula"
      ? foundations.choice?.neutral_family
      : undefined;
  const tones = (checks["status-tone"] ?? []).find((check) => check.kind === "tones");
  const named = (items) =>
    items.length === 1 ? items[0] : `${items.slice(0, -1).join(", ")} and ${items.at(-1)}`;
  const chosen = tones ? STATUS_TONES.filter((entry) => tones.chosen.includes(entry.role)) : [];
  const own = (checks["brand-exceptions"] ?? []).map((check) => check.variable);
  return [
    `Every colour role of the stylesheet stands in the table of colour roles (\`${ROLES_FILE}\` of the plugin), with where its value comes from and the pairs it is measured in; \`status --roles\` prints it. A screen or a component takes a colour only through a role.`,
    ...roleSentences(wordsOf(blueprint), blueprint?.layers?.foundations?.choice).map(
      (sentence) => `${sentence}.`,
    ),
    family &&
      `The neutral family ${family} writes every neutral role in light and dark mode: never write a grey, a neutral value or an opacity of one in a screen or a component; a surface or a text takes its role.`,
    chosen.length > 0 &&
      `The status tones of this product are ${named(chosen.map((entry) => entry.tone))}: a screen says how something went only with ${named(chosen.map((entry) => `\`${entry.role}\``))}. A tone not among them has no role, and adding one is the owner's answer in the guide; the gate fails when a role of a tone nobody chose is declared.`,
    own.length > 0 &&
      `${named([...new Set(own)])} ${new Set(own).size === 1 ? "is" : "are"} the brand's own colour, by the owner's word (row brand-exceptions), held to that value and measured like every role.`,
    `Every pair the table declares is measured in light and dark mode at the threshold of the conformance level: ${pairs.length} in all${waiting > 0 ? `, of which ${waiting} below the threshold wait on the owner, named on every run and held at the ratio each began to wait at until the owner answers` : ""}.`,
  ];
}

// `facts.buttons` is whether the ledger of screens gives some screen a button for an action;
// `facts.fonts` and `facts.stylesheet`, what the build loads and the stylesheet, for the typeface.
export function rulesPage(checks, has, blueprint = null, facts = {}) {
  const held = (id) => id in checks;
  // Where a screen is entered in the ledger: its own file, or the one file every screen shares.
  const inFragments = Object.values(checks)
    .flat()
    .some((check) => check.kind === FRAGMENTS && ledgerOf(check) === "screens");
  const entryFile = inFragments
    ? `\`${fragmentsFolder(SCREEN_LEDGER)}/<id>.yaml\`, its own file in the ledger every tool reads, named after its \`id\``
    : `\`${SCREEN_LEDGER}\`, the ledger every tool reads`;
  const sharedFile = inFragments
    ? ` in \`${fragmentsFolder(SCREEN_LEDGER)}/${FRAGMENTS_SHARED}\``
    : "";
  const entryOf = inFragments
    ? `A screen's file under \`${fragmentsFolder(SCREEN_LEDGER)}\``
    : `A screen's entry in \`${SCREEN_LEDGER}\``;
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
    // Where the repository keeps a ledger of screens, a builder is handed one sheet for its screen.
    // It stands before the rules, to be read first, and is no rule itself: no check holds it.
    ...(held("screen-ledger") ? ["", ...briefFirst(held("decision-sheet"))] : []),
  ];
  const section = (title, items) => {
    const shown = items.filter(Boolean);
    if (shown.length > 0) lines.push("", `## ${title}`, "", ...shown.map((item) => `- ${item}`));
  };
  section(FIXED_SECTION, fixedFirst(blueprint, held("decision-sheet")));
  section("Type", typefaceRules(checks, blueprint, facts));
  section("Colour", colourRules(checks, blueprint));
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
        ? "A row shows one action as a button. Two or more go behind one button on the row, at every width: `RowActions` (`src/components/ui/row-actions.tsx`), given a `name` that says which row it acts on and the actions as buttons, those that can be taken back first and a delete last. Two text buttons do not fit beside the data at 320px, and one rule for every width keeps one way to reach each state. The button shows only an ellipsis, ⋯, so it takes the same small room at every width; a screen reader hears its name. Its list floats below the button and never widens the column; one is open at a time; pressing an action closes it and gives focus back to the row's button, which you hold with `pending` while the action waits; from one second of `pending` on, it turns itself into a turning circle and a screen reader hears `busyName`, which says what it is doing: each row keeps its own clock, so write no timer of your own. A state behind it is reached by pressing the row's button, then the action. It " +
          NO_NAME_EACH +
          ": each is a button of the screen, inside a list a screen reader hears as `name`, and the name each button is heard by is its own words, which the screen chooses from the repository's words; where no page says them, ask. Never build a list of a row's actions of a screen's own."
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
    held("state-matrix") &&
      has("src/components/ui/row-actions.tsx") &&
      `A state is listed with words it puts on the page, which the browser test waits for. \`RowActions\` says a row's action is waiting only by \`busyName\`, which a screen reader hears and which puts no word on the page, so a row's waiting state behind it has no words of its own. Two rules meet there, and ${WAITING_WORDS}: do not list such a state with words the page shows before it, such as the row's name; the brief of the screen gives the question to ask.`,
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
      "An action on a row that asks first closes its dialog as soon as the person confirms: the row's own control waits for the answer, so the other rows can still be used. From there it is an action done at once: done, it is told through `notifyDone`; failed, through `notifyFailed`, whose button tries again without asking again. The browser test fails when the dialog is still open after the person answered.",
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
    held("screen-ledger")
      ? `A screen is listed twice: in \`src/screens.ts\`, how each of its states is reached, and in ${entryFile}: its \`id\`, \`route\`, \`title\` (the key of its title among the repository's words), \`family\` (the \`nhom\` of the page of its kind), \`status\` and the names of its \`states\`, in the code's order. Add both in the same change. The gate fails when the two list different screens, and \`tests/screens-ledger.test.ts\` when a title or the states differ. States in \`src/screens.ts\` may be built by a function: the checks read them from the ledger.`
      : held("state-matrix") &&
        "The gate reads `src/screens.ts` as written: list each screen and each of its states in full there, never built by a function or spread from another list, or the gate does not see them.",
    held("screen-actions") &&
      `${entryOf} also says what it shows (\`shows\`, entities of \`ontology/\`), the action a role must hold to open it (\`entry\`, or null for every role) and the actions it has buttons for (\`actions\`). A button for an action is any button a person presses on the screen, ${TOAST_BUTTON} among them, such as the undo of an action done there: list its action in \`actions\`, so the gate checks that whoever opens the screen may run it. The gate reads the row alone, so it cannot tell a toast's button from one drawn on the screen: an action whose only button is a toast's still needs one of its own, on this screen or another. Every action of \`ontology/actions.yaml\` is offered on a screen to every role that may run it; an action that has no screen is listed under \`no_screen\`${sharedFile} with \`later: <where>\`, or \`never: <reason>\` with \`decided_by\`, the person who decided, never you. The gate fails when an action is offered to nobody who may run it, when a screen shows a record to a role that may not view it, and when a button is one no role that opens its screen may press.`,
    held("screen-actions") &&
      facts.buttons === true &&
      `A control that runs an action of \`${MODEL}/actions.yaml\` ${ACTION_MARK}: \`${MARK}="<action name>"\`, on the button itself, wherever it is drawn: on a row, in the list behind a row's actions button, in a dialog that asks${has("src/lib/notify.ts") ? ", and on a toast, whose button carries it when `notifyDone` and `notifyFailed` are given the action's name in its `action`" : ", and on a toast"}. Only a button for an action the screen's row lists in \`actions\` carries it; a control that runs none of them, such as one that opens a record, closes, filters or loads the list again, carries none. A button's words change with the data and the language, its action does not: a browser test knows the button by its mark, never by its words.`,
    held(SEEN_DECISION) &&
      `\`${SEEN_TEST}\` opens every built screen as each role of the model, entering by \`${browser.door.file}\`, and walks its states: it fails when a role does not see a button its row and the model give it, sees one they do not give it, or finds a control or the words of a screen it may not open at that screen's route. A locked button still counts as seen: draw a button only for a role that may press it. A new role of the model gets its way in in \`${browser.door.file}\`, in the same change. That file is the repository's: this plugin never writes it, and an agent writes no sign-in a person did not give.`,
    held("navigation-in-frame") &&
      (has("src/components/app-frame.tsx")
        ? "Moving between screens is the frame's. Once there is more than one screen, `src/App.tsx` draws `AppFrame` (`src/components/app-frame.tsx`) with the list of screens, each given a `title` from the repository's words: it moves between them without loading the page again, marks the open one, leaves a screen's toasts behind and draws the toaster once. A screen never links to another screen: the gate fails when one does."
        : "Moving between screens is the frame's: one navigation in the application's frame, the same place and order on every screen. A screen never links to another screen: the gate fails when one does."),
    held("empty-state-actions") &&
      "An empty state offers a button only where the person can fill the list from this screen; otherwise at most one link inside its words. A link dressed as a button fails the gate.",
  ]);
  section("The system itself", [
    held("tier-direction") &&
      "The code has parts, listed from the top down in `design/parts.json`. A file imports only its own part and the parts listed after it: a component never imports a screen. What two screens share: logic and data move down a part; a piece of drawing they share becomes a component of the repository's own, in the part between the screens and the component library (named `shared` where the guide wrote the list). One screen's own drawing stays in that screen. This holds for what screens of one kind copy from its reference screen too: loading, trying again and filtering that two list screens do alike are one shared piece, not two copies.",
    held("escapes") &&
      "When you find a fault that every check let through, add a line to `design/escapes.md` before you fix it: the date, what slipped, the layer that should have caught it, and what was done.",
    (held("tier-direction") || held("escapes")) &&
      "A departure on purpose stays beside the rule it bends, with its reason: a lint exception, a screen excused from the states, a file left out of its kind.",
  ]);
  section("Questions only the owner answers", [
    held("decision-sheet") &&
      `A choice that \`design/decisions.yaml\`, the components and the pages of kinds do not settle is not yours to make alone. Ask it on the decision sheet, \`/design-assembly:decide --ask "QUESTION" --recommend TEXT --because TEXT --easy-to-undo\` (or \`--hard-to-undo\`; add \`--item decision:ID\` when it is about one row of the ledger), and go on with your recommendation: it writes one new file, \`${WAITING_FOLDER}/<id>.json\`, and touches nothing else. Never write an answer for the owner. A judgment you write into the ledger says in its note that a person has not confirmed it, or a question names it: the gate fails otherwise.`,
    held("owner-calls") &&
      `A new kind of screen and the brand colour are the owner's alone. Before you add a page of a new kind of screen, \`${KINDS_FOLDER}/<kind>.md\`, or change the \`--primary\` line of \`:root\`, ask with \`--item pattern:NAME\` or \`--item source-color:VALUE\`, and stop there: the gate fails on the branch until the owner keeps that very item.`,
  ]);
  section(UNHELD_SECTION, [
    has("ontology/glossary.md") &&
      "A screen that needs a concept or an action the data model does not name adds it to `ontology/` first, in the same change, and says in the change's description that the data model changed and a person reviews it before it merges. Only where the repository forbids an agent to change the data model does the agent stop and ask. It never names the concept in a screen alone.",
    "A row of `design/decisions.yaml` is for a rule a second screen must follow. A choice that only one screen makes stays in that screen.",
    held("page-layouts") &&
      "One item changing never sends the whole list back to its loading state: the row stays until the answer, then the list changes in place.",
    held("page-layouts") &&
      "An undo puts the thing back where it was and shows no second toast: the screen shows the result. A failed undo says where the thing is now.",
    held("page-layouts") &&
      "An empty state says why it is empty and how items get there, and never copies the navigation.",
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
      "A component or one of its variants changed: run `make design-components`. Look a component and its variants up in `design/component-registry.json` before reading its source; when the file is not there, the repository keeps it out of git and the same command writes it.",
    held("column-align") &&
      "A field's column type or the table of column types changed: run `make design-columns`.",
    "Never edit by hand the files those commands write, `design/theme.json`, `tools/design-assembly/` or `mk/design-assembly.mk`.",
  ]);
  return `${lines.join("\n")}\n`;
}

// The tool and its gate step, as they are copied into a repository, and the stamp that says which
// version of this plugin wrote them.
export function vendored() {
  const files = {};
  const templates = path.join(PLUGIN, "templates");
  const copy = (folder) => {
    for (const name of readdirSync(path.join(templates, folder)).sort()) {
      const full = path.join(templates, folder, name);
      if (statSync(full).isDirectory()) copy(`${folder}/${name}`);
      else files[`${folder}/${name}`] = readFileSync(full, "utf8");
    }
  };
  // The tool's adapters sit in a folder of their own beside it.
  for (const folder of ["tools/design-assembly", MK_FOLDER]) copy(folder);
  files[STAMP] = stampText();
  return files;
}

// The decisions this plugin answers, as ledger rows, and the checks its tool runs for each.
// Ids are those of references/standard-decisions.json.
function decisions(blueprint, theme, foundations, styles, before = []) {
  const level = blueprint.layers.context.choice.conformance_level;
  const modular = foundations.choice.type_scale === "modular";
  const recorded = `${BLUEPRINT}`;
  const modes = theme.modes.map((mode) => ({ name: modeOf(mode.selector), scope: mode.selector }));
  const contrastChecks = pairChecks(measurePairs(styles, level, modes), wordsOf(blueprint), before);
  // A person's call that the guide proposed is not theirs yet: the row says so until they confirm.
  // A layer the guide proposed may hold one answer the person has since given: `confirmed` lists
  // those choice keys, so that one row stops saying it is a proposal and the others still do.
  const proposed = (layer, key) => {
    const entry = blueprint.layers[layer];
    if ((entry.confirmed ?? []).includes(key)) return {};
    // An answer the family core gave is a person's: the owner of the family settled it.
    if (entry.inherited?.[key]) return {};
    if (entry.source === "proposed") {
      return { note: "proposed by the guide; a person has not confirmed it" };
    }
    // Read off the repository is not a person's answer either, until a person says so.
    if (entry.source === "repo") {
      return { note: "read from the repository; a person has not confirmed it" };
    }
    return {};
  };
  // A judgment the owner gave says who gave it and when, where the blueprint has it.
  const call = (id, layer, key) => {
    const said = blueprint.layers[layer]?.answered?.[key];
    const pending = proposed(layer, key);
    return {
      id,
      layer,
      kind: "judgment",
      source: recorded,
      ...(pending.note ? pending : said ? { note: `answered by ${said.by} on ${said.on}` } : {}),
    };
  };
  const rows = [
    call("product-type", "context", "product_type"),
    call("conformance-level", "context", "conformance_level"),
    // The owner's design principles: one judgment row each, a proposal saying so.
    ...principleRows(blueprint),
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
      source: `WCAG 2.2 level ${level}, contrast ratio for text and for parts that are not text`,
      check: TOOL,
      note: contrastNote(contrastChecks),
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
  rows.push(...toneRows(blueprint, foundations, theme, checks));
  if (theme.fonts) {
    const [textVariable, headingVariable] = FONT_VARIABLES;
    const choice = foundations.choice;
    const pending =
      proposed("foundations", "text_font").note ?? proposed("foundations", "heading_font").note;
    const said = blueprint.layers.foundations.answered?.text_font;
    rows.push({
      id: "typeface",
      layer: "foundations",
      kind: "closed",
      source: `${BLUEPRINT}, text typeface ${choice.text_font}, heading typeface ${choice.heading_font}`,
      check: TOOL,
      note: pending ?? (said ? `answered by ${said.by} on ${said.on}` : undefined),
    });
    checks.typeface = [
      { kind: "value", scope: ":root", variable: textVariable, expected: theme.fonts.text },
      { kind: "value", scope: ":root", variable: headingVariable, expected: theme.fonts.heading },
      // Each font of the sources ledger the typeface names can still be chosen: a row gone, a
      // licence missing or a pin that no longer holds is said here, under the typeface's row.
      ...[...new Set([choice.text_font, choice.heading_font])]
        .filter((value) => sourceFontId(value) !== null)
        .map((value) => ({ kind: "font-row", value })),
    ];
  }
  rows.push(...markRows(blueprint, checks));
  return { rows, inputs: foundations.inputs, checks };
}

// The row of the mark the foundations layer chose from the sources ledger, with the check that holds
// it; `checks` takes the check. None for the floor's text, which makes no file and has nothing to
// hold, and none where the blueprint names no mark (spec 0017).
function markRows(blueprint, checks) {
  const value = blueprint.layers.foundations.choice?.mark;
  if (sourceLogoId(value) === null) return [];
  const said = blueprint.layers.foundations.answered?.mark;
  checks.mark = [{ kind: "logo-row", value }];
  return [
    {
      id: "mark",
      layer: "foundations",
      kind: "closed",
      source: `${BLUEPRINT}, mark ${value}`,
      check: TOOL,
      note: `${said ? `answered by ${said.by} on ${said.on}; ` : ""}the gate holds that the row is there, whole, with its licence, and that its pin still holds the files of the mark`,
    },
  ];
}

// The rows of the status tones the owner chose, and of the brand's own colours for them, with the
// checks that hold them; `checks` takes the checks. None until the owner's word is that the formula
// writes the tones.
function toneRows(blueprint, foundations, theme, checks) {
  const tones = foundations.inputs.statusTones ?? [];
  if (tones.length === 0) return [];
  const said = blueprint.layers.foundations.roles?.["color-roles-status"];
  const rows = [
    {
      id: "status-tone",
      layer: "foundations",
      kind: "closed",
      source: `${BLUEPRINT}, status tones ${tones.map((tone) => tone.tone).join(", ")}, at the hues of the plugin's closed list (references/status-tones.json)`,
      check: TOOL,
      note: `answered by ${said.by} on ${said.on}; the gate holds that each tone chosen is written in light and dark mode and that no tone left out is declared, the contrast row that each reaches its threshold on the background`,
    },
  ];
  checks["status-tone"] = [
    {
      kind: "tones",
      scopes: theme.modes.map((mode) => mode.selector),
      chosen: tones.map((tone) => tone.role),
      absent: STATUS_TONES.filter((entry) => !tones.some((tone) => tone.tone === entry.tone)).map(
        (entry) => ({ role: entry.role, tone: entry.tone }),
      ),
    },
  ];
  const own = blueprint.layers.foundations.brand_exceptions ?? {};
  if (Object.keys(own).length > 0) {
    rows.push({
      id: "brand-exceptions",
      layer: "foundations",
      kind: "closed",
      source: `${BLUEPRINT}, foundations.brand_exceptions`,
      check: TOOL,
      note: Object.entries(own)
        .map(
          ([role, item]) =>
            `${role}: ${item.why.trim().replace(/\.?$/, ".")} Answered by ${item.by} on ${item.on}`,
        )
        .join("; "),
    });
    checks["brand-exceptions"] = Object.entries(own).flatMap(([role, item]) =>
      theme.modes.map((mode) => ({
        kind: "value",
        scope: mode.selector,
        variable: role,
        expected: ownWritten(item[mode.selector === ":root" ? "light" : "dark"]),
      })),
    );
  }
  return rows;
}

// The check that every typeface the stylesheet names is loaded, with its ledger row; or why it is
// not added. `nothing`: the stylesheet names no typeface of its own.
// `chosen` is the fonts of the sources ledger the typeface names: for one nothing loads yet, the
// build's adapter says what a person writes.
export function fontsPlan(target, styles, stylesheet, chosen = []) {
  const variables = declaredFonts(styles);
  if (variables.length === 0) return { nothing: true };
  const loads = readLoads(target, styles.css, stylesheet);
  const problems = fontProblems(styles, variables, stylesheet, loads);
  if (problems.length > 0) {
    const hint = buildOf(target).fontHint;
    const hints = chosen
      .map((font) => [font, hint?.(font, stylesheet)])
      .filter(([, what]) => what)
      .map(([font, what]) => `to load ${font.family}, the font of ${font.file}, ${what}`);
    return { failing: { id: "font-loaded", why: [...problems, ...hints].join("; ") } };
  }
  return {
    what: `every typeface ${stylesheet} names is loaded, as the ${loads.build} stack loads one, or is one every device has`,
    row: {
      id: "font-loaded",
      layer: "foundations",
      kind: "closed",
      source: `${stylesheet}, the typeface each of ${variables.join(" and ")} names first`,
      check: TOOL,
      note: "the first typeface of each list, against what the adapter of the build can see load it: an @font-face rule or a font package of the stylesheet, or the build's own font loader in a layout file; that the file holds the weights a screen uses is not checked",
    },
    checks: [{ kind: "font-loaded", variables }],
  };
}

// One page per decided layer: what was chosen, why, what was turned down, what the machine holds.
function record(layer, entry, rows, values, blueprint) {
  const lines = [`# ${layer.title[0].toUpperCase()}${layer.title.slice(1)}`, ""];
  lines.push(`Status: decided (${entry.source}).`, "", "## Choice", "");
  for (const choice of layer.choices.filter((c) => applies(c, values))) {
    // A choice the blueprint does not name, that reads as one of its options then, says nothing.
    if (values[choice.key] === undefined && choice.unset !== undefined) continue;
    if (values[choice.key] === undefined) {
      const kept = choice.asked_by ? entry.roles?.[choice.asked_by] : null;
      lines.push(
        kept?.source === "floor"
          ? `- ${choice.name}: not written: its roles are kept from the floor (answered by ${kept.by} on ${kept.on})`
          : `- ${choice.name}: not answered yet: the floor's declarations stay as they are`,
      );
      continue;
    }
    const chosen = choice.key in (entry.choice ?? {});
    // A choice that answers a question of the table of colour roles carries the owner's word there.
    const said = choice.asked_by ? entry.roles?.[choice.asked_by] : entry.answered?.[choice.key];
    const note = !chosen
      ? " (not asked: the floor's value)"
      : said
        ? ` (answered by ${said.by} on ${said.on})`
        : "";
    const shown = [values[choice.key]].flat().join(", ");
    lines.push(`- ${choice.name}: \`${shown}\`${note}`);
  }
  if (layer.id === "context") lines.push(...principleRecord(blueprint));
  if (layer.id === "foundations" && entry.direction) {
    lines.push(
      "",
      "## Direction",
      "",
      `Drawn from the direction \`${entry.direction}\` of the guide.`,
    );
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
  const theme = buildTheme(foundations.inputs, css, fontsOf(target));
  const files = { [FILES.css]: applyBlock(css, renderBlock(theme)) };
  // Every pair of the table of colour roles is measured on the stylesheet as it is about to be.
  const { rows, inputs, checks } = decisions(
    blueprint,
    theme,
    foundations,
    loadStyles(target, FILES.css, files),
    JSON.parse(read(FILES.theme) ?? "{}").checks?.["color-contrast"] ?? [],
  );
  // The design tokens file is read from the stylesheet as it is about to be written.
  const held = JSON.parse(read(FILES.theme) ?? "{}").checks?.[TOKENS_DECISION];
  const tokens = tokensPlan(target, loadStyles(target, FILES.css, files), FILES.css, Boolean(held));
  const fonts = fontsPlan(
    target,
    loadStyles(target, FILES.css, files),
    FILES.css,
    theme.fonts?.sources ?? [],
  );
  if (fonts.row) {
    rows.push(fonts.row);
    checks["font-loaded"] = fonts.checks;
  }
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
  // The pieces of the starter kit this run lays, or a build laid and nobody changed, carry their
  // source in the intake ledger, so the gate does not read them as made by the branch.
  Object.assign(files, starterIntakePlan(target, files, opening.layout));
  // Every ledger this run leaves has the one shape the contract gives it. Read as it is about to
  // be written; the decisions ledger is written below, and checked by the gate from then on.
  const ledgerFiles = { decisions: FILES.ledger };
  // A ledger may be a folder of fragments: it is read as the one text they give.
  const onDisk = (kind, file) =>
    kind in FRAGMENT_LEDGERS ? screensText(target, file, kind) : read(file);
  for (const [kind, ledger] of Object.entries(LEDGERS)) {
    if (!ledger.file || kind === "decisions") continue;
    const file = { tokens: tokens.file, components: components.file }[kind] ?? ledger.file;
    if (file && (file in files || onDisk(kind, file) !== null)) ledgerFiles[kind] = file;
  }
  const shapes = Object.entries(ledgerFiles)
    .filter(([kind]) => kind !== "decisions")
    .flatMap(([kind, file]) => shapeProblems(kind, files[file] ?? onDisk(kind, file), file));
  const kindPages = Object.keys(readPages(target)).length > 0;
  for (const [file, text] of Object.entries(readPages(target))) {
    shapes.push(...shapeProblems("screen-kinds", text, file));
  }
  if (shapes.length === 0) {
    const floating = floatingParts(target);
    const item = {
      what: `${Object.keys(ledgerFiles).length} ledgers${kindPages ? " and the pages of screen kinds" : ""} have the one shape the contract gives them`,
      row: {
        layer: "governance",
        kind: "closed",
        source: "the design-assembly contract, one shape per ledger with its version",
        check: TOOL,
        note: "that each ledger present has its shape and a version this tool reads; what a ledger says is held by the rows about it",
      },
      checks: [
        { kind: "shapes", ledgers: ledgerFiles, ...(kindPages ? { pages: KINDS_FOLDER } : {}) },
        // A repository that keeps its ledger of screens as one file per screen said so on its
        // disk or in its tool data: the choice is carried over, never made here.
        ...fragmentsChecks(target, priorTheme(target), ledgerFiles.screens ?? SCREEN_LEDGER),
        ...(ledgerFiles.intake
          ? fragmentsChecks(target, priorTheme(target), ledgerFiles.intake, "intake")
          : []),
        // No file of the code uses an item of an outside source taken down and not taken in.
        {
          ...TAKEN_DOWN_CHECK,
          sources: SOURCE_FOLDER,
          ...(ledgerFiles.intake && ledgerFiles.intake !== LEDGERS.intake.file
            ? { intake: ledgerFiles.intake }
            : {}),
        },
        // A component file a branch adds, or a row made by hand it writes, holds the choice.
        {
          ...CHOOSE_FIRST_CHECK,
          ...(ledgerFiles.intake && ledgerFiles.intake !== LEDGERS.intake.file
            ? { intake: ledgerFiles.intake }
            : {}),
        },
        // The floating parts of each item of an outside source are opened by a browser test.
        ...floating.checks,
        // A repository of a family: the locked answers of the core it pinned.
        ...(readPinnedCore(target) === null ? [] : [FAMILY_CORE_CHECK]),
        // A repository with a logo row: the pin of every logo row.
        // and that the page icons and the images of the app frame are files of a logo row.
        ...(readLogoSources(target).length === 0 ? [] : [LOGO_PINS_CHECK, LOGO_USE_CHECK]),
      ],
    };
    Object.assign(files, floating.files);
    governance.held["ledger-shapes"] = item;
    rows.push({ id: "ledger-shapes", ...item.row });
    checks["ledger-shapes"] = item.checks;
  } else {
    governance.failing.push({
      id: "ledger-shapes",
      why: `${shapes.slice(0, 3).join("; ")}${shapes.length > 3 ? `; and ${shapes.length - 3} more` : ""}`,
    });
  }
  const targets = targetPlan(target, inputs.conformanceLevel);
  if (targets.row) {
    rows.push(targets.row);
    checks["target-size"] = targets.checks;
  }
  // A check this tool already holds is never dropped because its rule is broken today: the row
  // stays, so the check stays, and the gate fails with the real reason.
  // A lint rule this tool re-runs is kept the same way, for as long as the row points at it.
  const pointed = parseLedger(read(FILES.ledger) ?? "")
    .filter((row) => heldHere(row, prior))
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
    // What a person wrote of the change map is theirs: kept as it is.
    ...(before.affected ? { affected: before.affected } : {}),
  };
  files[FILES.theme] = renderJson(data, lineWidth(target));
  files[RULES_PAGE] = rulesPage(checks, (file) => file in files || read(file) !== null, blueprint, {
    buttons: ledgerButtons(target),
  });
  // The ledger may hold rows this plugin did not write: they are kept exactly as they are.
  // A principle the blueprint no longer lists leaves the ledger with it; a row another hand wrote
  // under the same prefix names another source and stays.
  const ledgerBefore = read(FILES.ledger);
  const gone = (ledgerBefore === null ? [] : parseLedger(ledgerBefore))
    .filter((row) => String(row.id).startsWith(ROW_PREFIX))
    .filter((row) => String(row.source ?? "") === BLUEPRINT)
    .map((row) => String(row.id))
    .filter((id) => !rows.some((row) => row.id === id));
  files[FILES.ledger] = mergeLedger(ledgerBefore, rows, gone);
  // A repository of a family: each row of an answer of the core it pinned says where it stands.
  const member = readMember(target, files);
  if (member && !member.pinned.unreadable) {
    files[FILES.ledger] = markLedger(files[FILES.ledger], member.pinned, member.values, {
      reasons: blueprintReasons(blueprint),
    }).text;
  }
  // A repository that left a family: a row written again keeps saying where its answer once came
  // from.
  files[FILES.ledger] = keepLeftMarks(ledgerBefore, files[FILES.ledger]);
  for (const layer of LAYERS.filter((l) => l.built)) {
    const entry = blueprint.layers[layer.id];
    if (entry.status !== "decided") continue;
    const values = layer.id === "foundations" ? foundations.choice : entry.choice;
    const listed = [...rows, ...templates.known];
    files[`design/decisions/${layer.id}.md`] = record(layer, entry, listed, values, blueprint);
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
    fonts,
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

// The lines of writeFiles as a machine reads them: only the files written, or that would be.
export function writtenFiles(lines) {
  return lines
    .map((line) => [line.slice(0, 9).trim(), line.slice(10)])
    .filter(([change]) => change !== "unchanged")
    .map(([change, file]) => fileChange(file, change));
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

const USAGE = `usage: node apply.mjs [--target DIR] [--dry-run] [--replace] [--json]

  --target   The repository to write into. The folder this is run from when not given.
  --dry-run  Preview without writing: the primary color role for light and dark, the contrast
             ratio each reaches, the type scale, the corner radius, and the files that would
             change. Works before approval, as soon as context and foundations are decided.
  (none)     Write. Needs design/blueprint.json with status "approved" and every built layer
             decided.
  --replace  Generate even where the repository holds values of its own: a primary color role
             with its own hue, or values taken in by the adopt script. Without it the guide
             refuses to write over them.
  --json     One JSON document: the blueprint layer by layer, and the files written or that
             would be.

  Ends with 0 when done, 1 when a built layer is not decided yet or the preview shows a write
  that would be refused, 2 on a wrong call or a blueprint that cannot be written from.
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
  for (const mode of theme.modes.filter((item) => (item.neutrals ?? []).length > 0)) {
    lines.push(
      `neutral roles, ${modeOf(mode.selector)} mode: ${mode.neutrals.length} written by the neutral family's formula`,
    );
  }
  for (const mode of theme.modes.filter((item) => (item.tones ?? []).length > 0)) {
    lines.push(
      `status tones, ${modeOf(mode.selector)} mode: ${mode.tones.map((tone) => `${tone.role} ${tone.own ? tone.written : formatOklch(tone.color)}${tone.own ? " (the brand's own)" : ""}`).join(", ")}`,
    );
  }
  if (theme.fonts) {
    const [textVariable, headingVariable] = FONT_VARIABLES;
    lines.push(
      `typeface: running text ${theme.fonts.text} (${textVariable}), headings ${theme.fonts.heading} (${headingVariable})`,
    );
  } else {
    lines.push(
      "typeface: not answered yet; the floor's declarations stay as they are until the owner answers",
    );
  }
  return lines;
}

// The blueprint as a machine reads it: for each layer, what was decided and who decided it.
function blueprintFacts(blueprint) {
  return {
    status: blueprint.status ?? null,
    layers: LAYERS.map((layer) => {
      const entry = blueprint.layers?.[layer.id] ?? {};
      const decided = entry.status === "decided";
      return {
        id: layer.id,
        built: layer.built,
        status: entry.status ?? null,
        ...(decided ? { choice: entry.choice ?? {}, source: entry.source ?? null } : {}),
        ...(decided && entry.confirmed ? { confirmed: entry.confirmed } : {}),
      };
    }),
  };
}

function main(args) {
  const call = readCall(args, { "--dry-run": "switch", "--replace": "switch" });
  if (call.problem) return refuse(call.problem, USAGE);
  if (call.help) return void stdout.write(USAGE);
  const { target } = call;
  const dryRun = call.flags["--dry-run"] === true;
  const stop = (message) => {
    throw new Refusal(message);
  };
  // What a person reads, line by line; a machine gets `result` instead. Nothing is printed before
  // the call is known to end well, so a refusal never follows half an answer.
  const lines = [];
  const say = (line) => lines.push(line);
  const end = (result, work) =>
    finish({
      json: call.json,
      result: { dry_run: dryRun, ...result },
      text: `${lines.join("\n")}\n`,
      work,
    });
  // A ledger of a newer shape than this plugin knows was written by a newer plugin: write nothing.
  const newer = newerLedgers(target);
  if (newer.length > 0) stop(`${newer.join("; ")}. Nothing was written`);
  const floor = floorProblem(target);
  if (floor) stop(floor);
  const blueprintPath = path.join(target, BLUEPRINT);
  if (!existsSync(blueprintPath) && dryRun) {
    say(
      `the floor is in place. ${BLUEPRINT} is not there yet: write it, in the shape the guide's first step gives, then run this again.`,
    );
    // A repository that declares no family, on a machine that keeps a core, is asked about it once.
    const first = readPinnedCore(target) === null ? familyQuestion(target).question : null;
    if (first) say(`family: ${first.question} ${first.recommendation}`);
    // No layer is decided yet: that is work for a person.
    return end(
      {
        blueprint: null,
        principles: [],
        recommendations: [],
        directions: [],
        ...(first ? { family_question: first } : {}),
      },
      true,
    );
  }
  if (!existsSync(blueprintPath)) {
    stop(
      `the floor is in place. ${BLUEPRINT} is missing: write it, in the shape the guide's first step gives, then run this again.`,
    );
  }
  const blueprint = readJson(blueprintPath);
  const problems = [
    ...blueprintProblems(blueprint, {
      preview: dryRun,
      sources: readFontSources(target),
      logos: readLogoSources(target),
    }),
    // A repository of a family: what the blueprint holds against the core it pinned.
    ...blueprintCoreProblems(target, blueprint),
  ];
  if (problems.length > 0) {
    const what = dryRun ? "previewed" : "applied";
    stop(`${BLUEPRINT} cannot be ${what}:\n  ${problems.join("\n  ")}`);
  }

  const own = call.flags["--replace"] === true ? null : ownValuesProblem(target);
  if (own && !dryRun) {
    stop(
      `${own}.\n  Keep them: run the adopt script instead.\n  Replace them: run this again with --replace.`,
    );
  }
  const facts = {
    blueprint: blueprintFacts(blueprint),
    principles: principlesOf(blueprint),
    recommendations: recommendations(blueprint),
    directions: directionsFor(blueprint),
    // The preview of a write this command would refuse: said to a machine as it is to a person.
    ...(own ? { refused: own } : {}),
  };
  // A built layer that is not decided is work for a person, whatever else was written.
  const undecided = LAYERS.filter((l) => l.built && blueprint.layers[l.id].status !== "decided");

  const css = readFileSync(path.join(target, FILES.css), "utf8");
  const foundations = themeInputs(blueprint);
  const theme = buildTheme(foundations.inputs, css, fontsOf(target));
  for (const line of themeSummary(theme)) say(line);
  for (const line of principleLines(blueprint)) say(line);
  for (const direction of facts.directions) {
    say(`direction ${direction.id}: ${direction.character}`);
  }
  const followed = blueprint.layers?.foundations?.direction;
  if (followed) say(`direction: the foundations were drawn from ${followed}`);
  // A repository of a family is told what the core answered; one that declares none, while this
  // machine keeps a core, is asked the one question about a family.
  // Said last, so the person reads at the end what was not asked and who settled it.
  const member = readMember(target);
  const asked = member ? null : familyQuestion(target).question;
  const familyLines = member?.pinned.unreadable
    ? [
        `family core: its copy here cannot be read (${member.pinned.unreadable}): the repository inherits nothing, and the guide asks every question`,
      ]
    : member
      ? inheritedSummary(member.pinned)
      : asked
        ? [`family: ${asked.question} ${asked.recommendation}`]
        : [];
  if (member && !member.pinned.unreadable) {
    facts.family_core = { family: member.pinned.family, pin: member.pinned.label };
  }
  if (asked) facts.family_question = asked;
  if (own) {
    say(`note: ${own}. Writing will be refused: adopt the values, or pass --replace.`);
  }
  if (foundations.defaulted.length > 0) {
    say(
      `note: foundations was decided before ${foundations.defaulted.join(", ")} could be chosen; ` +
        "the floor's values are kept. Run the guide again to choose them.",
    );
  }

  const pending = LAYERS.filter(
    (l) =>
      l.built &&
      blueprint.layers[l.id].status !== "decided" &&
      !(LATER_LAYERS.includes(l.id) && blueprint.layers[l.id].status === "planned"),
  );
  if (pending.length > 0) {
    say(`files: shown once these layers are decided: ${pending.map((l) => l.title).join(", ")}`);
    for (const line of familyLines) say(line);
    return end(facts, true);
  }
  const {
    files,
    tokens,
    components,
    targets,
    columns,
    patterns,
    templates,
    governance,
    fonts,
    kept,
  } = plan(target, blueprint);
  const unmet = (id) =>
    kept.includes(id)
      ? "Its check stays, and the gate fails until that changes"
      : "No check is added until that changes";
  for (const [id, item] of Object.entries(patterns.held)) say(`${id}: ${item.what}`);
  for (const item of patterns.failing) {
    say(`note: ${item.id}: ${item.why}. ${unmet(item.id)}.`);
  }
  for (const note of patterns.notes) say(`hint: ${note}.`);
  for (const [id, item] of Object.entries(templates.held)) say(`${id}: ${item.what}`);
  if (templates.recordPanel) {
    const opening = recordLayout(blueprint);
    const whose = opening.confirmed ? "as the person chose" : "proposed, until a person chooses";
    say(`record-panel: a record opens ${opening.layout}, ${whose}`);
  }
  for (const row of templates.rows) {
    const how = row.check ? `proved by ${row.check}` : "recorded, for a person to confirm";
    say(`${row.id}: ${how}`);
  }
  for (const item of templates.failing) {
    say(`note: ${item.id}: ${item.why}. ${unmet(item.id)}.`);
  }
  for (const note of templates.notes) say(`hint: ${note}.`);
  for (const [id, item] of Object.entries(governance.held)) say(`${id}: ${item.what}`);
  for (const item of governance.failing) {
    say(`note: ${item.id}: ${item.why}. ${unmet(item.id)}.`);
  }
  if (columns.problem) {
    say(`note: column types: ${columns.problem}. No check is added until the table is right.`);
  } else {
    say(
      `column types: ${columns.fields} field(s) of the data model name a column type; alignment, width and density come from it`,
    );
    if (columns.fields === 0) {
      say(
        "hint: no field names a column type yet. The three table rules are held all the same. Give a field of the data model a `display` key and run the guide again: it then holds display-kind and installs the typed table parts.",
      );
    }
    for (const item of columns.failing) {
      say(`note: ${item.id}: ${item.why}. ${unmet(item.id)}.`);
    }
  }
  if (fonts.what) say(`font-loaded: ${fonts.what}`);
  if (fonts.failing) say(`note: font-loaded: ${fonts.failing.why}. ${unmet("font-loaded")}.`);
  if (targets.what) say(`target size: ${targets.what}`);
  else if (targets.below?.length > 0) {
    say(
      `note: target size: ${targets.below.join("; ")} are below the ${targets.min}px the conformance level asks. No check is added: the components change first, or the level does.`,
    );
  }
  for (const artifact of [tokens, components]) {
    if (artifact.skipped) say(`note: ${artifact.skipped}.`);
  }
  for (const variable of tokens.unresolved ?? []) {
    say(`note: ${variable} points nowhere, so it is not in the design tokens file.`);
  }
  const written = writeFiles(target, files, dryRun);
  for (const line of written) say(line);
  for (const line of familyLines) say(line);
  if (dryRun) say("preview only: nothing was written");
  return end({ ...facts, files: writtenFiles(written) }, undecided.length > 0 || Boolean(own));
}

await start(import.meta.url, main);
