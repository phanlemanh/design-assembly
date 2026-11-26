// Takes in what a repository already has: adds ledger rows for the proofs it finds, and checks
// around the values the stylesheet holds today. It never changes the stylesheet, the lint
// configuration, the tests or a row that is already in the ledger, and it adds a check only when
// that check passes on the repository as it is and was seen failing on a changed copy.
// Usage: node adopt.mjs [--target DIR] [--dry-run] [--conformance-level AA|AAA]
//                       [--product-type TYPE] [--record ID[,ID]] [--hold ID[,ID]] [--starter]
//                       [--json]
// Exit: 0 done; 1 something still needs a person's answer; 2 a wrong call, or a repository that
// cannot be read.
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { stdout } from "node:process";
import { fileURLToPath } from "node:url";

import { finish, readCall, Refusal, refuse, start } from "./command.mjs";

import {
  checkFolders,
  FILES,
  lintResults,
  runChecks,
} from "../templates/tools/design-assembly/check.mjs";
import { contrast } from "../templates/tools/design-assembly/color.mjs";
import {
  differences,
  LEDGERS,
  newerLedgers,
  shapeProblems,
} from "../templates/tools/design-assembly/contract.mjs";
import {
  FRAGMENT_LEDGERS,
  fragmentsChecks,
  ledgerText as screensText,
  readFragments,
} from "../templates/tools/design-assembly/screen-fragments.mjs";
import { gateHost, readMakefile } from "../templates/tools/design-assembly/host-make.mjs";
import {
  DEFAULT_FOLDER,
  sourceFolder,
} from "../templates/tools/design-assembly/source-folders.mjs";
import { gateCandidate, gateFiles, gateSaid, trialPackage } from "./script-gate.mjs";
import { workspaceLines, workspaceOf } from "./workspace.mjs";
import { lineWidth, renderJson } from "../templates/tools/design-assembly/json.mjs";
import { TAKEN_DOWN_CHECK } from "../templates/tools/design-assembly/check.mjs";
import { CHOOSE_FIRST_CHECK } from "../templates/tools/design-assembly/choose-first.mjs";
import { FLOATING_CHECK } from "../templates/tools/design-assembly/floating-parts.mjs";
import {
  FAMILY_CORE_CHECK,
  readPinnedCore,
  sameCoreValue,
} from "../templates/tools/design-assembly/contract.mjs";
import { holdAnswers, reasonsBeforeJoining } from "./core-join.mjs";
import { answeredByCores, familyQuestion } from "./core-list.mjs";
import { inheritedSummary, readMember } from "./core-marks.mjs";
import { whereRulesApply } from "../templates/tools/design-assembly/lint.mjs";
import {
  PROBED,
  probeCandidates,
  probeComponent,
  ruleOf,
} from "../templates/tools/design-assembly/probes.mjs";
import {
  LEDGER,
  literally,
  mergeLedger,
  parseLedger,
  pointRow,
  TOOL,
} from "../templates/tools/design-assembly/ledger.mjs";
import { SPACING_UNIT_PX, TYPE_VARIABLES } from "../templates/tools/design-assembly/scale.mjs";
import {
  darkScopes,
  findStylesheet,
  loadStyles,
  expand,
  ownValue,
  resolve,
} from "../templates/tools/design-assembly/styles.mjs";
import { readBlock, THRESHOLDS, withoutBlock } from "../templates/tools/design-assembly/theme.mjs";
import { readWaiting } from "../templates/tools/design-assembly/waiting.mjs";
import {
  PAIRS as TABLE_PAIRS,
  pairChecks,
  pairSays,
  pairWaits,
  ROLES_FILE,
  wordsFromListed,
} from "./color-roles.mjs";
import { declaredFonts, readLoads } from "../templates/tools/design-assembly/fonts.mjs";
import { COMPONENTS_DECISION, readFolder } from "../templates/tools/design-assembly/components.mjs";
import { KINDS_FOLDER, readPages } from "../templates/tools/design-assembly/screens.mjs";
import { TOKENS, TOKENS_DECISION } from "../templates/tools/design-assembly/tokens.mjs";
import {
  BLUEPRINT,
  columnsPlan,
  componentsPlan,
  patternsPlan,
  RULES_PAGE,
  ledgerButtons,
  rulesPage,
  fontsPlan,
  targetPlan,
  tokensPlan,
  vendored,
  writeFiles,
  writtenFiles,
  DECISION_SHEET,
  FROM_FLOOR,
  floatingParts,
  OWNER_CALLS,
  ownValuesProblem,
  startingSizes,
} from "./apply.mjs";
import { licenceStep, ownFonts, today } from "./font-source.mjs";
import { licenceStep as markLicenceStep, ownMark, themeWithLogoPins } from "./logo-source.mjs";
import { readLogoSources } from "../templates/tools/design-assembly/sources-ledger.mjs";
import { findProofs } from "./proofs.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const reference = (name) =>
  JSON.parse(readFileSync(path.join(HERE, "../references", name), "utf8"));
const STANDARD = reference("standard-decisions.json").decisions;
const PRODUCT_TYPES = Object.keys(
  reference("layers.json")
    .layers.find((layer) => layer.id === "context")
    .choices.find((choice) => choice.key === "product_type").options,
);

// The pairs of colour roles the table declares, the two of the primary colour first: the primary on
// the background, and the text on the primary.
const PRIMARY_FIRST = ["--primary", "--primary-foreground"];
const PAIRS = [
  ...TABLE_PAIRS.filter((pair) => PRIMARY_FIRST.includes(pair.foreground)),
  ...TABLE_PAIRS.filter((pair) => !PRIMARY_FIRST.includes(pair.foreground)),
];
// Decisions about a value the stylesheet holds. The guide generates these; adopting keeps them.
const VALUES = ["color-contrast", "type-scale-values", "spacing-values", "radius-value"];
// A person's calls this script can write a row for, once the person confirms what it sees.
const RECORDABLE = ["source-color"];

const read = (root, file) =>
  existsSync(path.join(root, file)) ? readFileSync(path.join(root, file), "utf8") : null;
// The blueprint of a repository the guide ran in, so the rules page keeps what its owner fixed.
// Adopting neither needs one nor writes one: none is not wrong, and one that cannot be read is
// said, not refused.
function blueprintOf(root) {
  try {
    return { blueprint: JSON.parse(read(root, BLUEPRINT) ?? "null") };
  } catch {
    return {
      blueprint: null,
      problem: `${BLUEPRINT} cannot be read as JSON, so the rules page goes without what the owner fixed in it`,
    };
  }
}
const layerOf = (id) => STANDARD.find((decision) => decision.id === id).layer;
const declares = (css, name) => new RegExp(`(^|[\\s;{])${literally(name)}\\s*:`, "m").test(css);

// The contrast ratio of each pair in each mode, as the stylesheet stands. A pair that cannot be
// read says why instead of a ratio.
export function contrastToday(styles) {
  // Every dark selector the stylesheet uses applies together: a pair is read through all of them.
  const scopes = darkScopes(styles);
  const names = PAIRS.flatMap((pair) => [pair.foreground, pair.background]);
  const dark = scopes.some((scope) => names.some((name) => ownValue(styles, scope, name)));
  const modes = [{ name: "light", scope: ":root" }];
  if (dark) modes.push({ name: "dark", scope: scopes.length === 1 ? scopes[0] : scopes });
  return modes.map((mode) => ({
    ...mode,
    // A role this stylesheet does not declare is not one of its roles: its pairs are left out,
    // all but the two of the primary colour, which every stylesheet the tool reads is asked for.
    pairs: PAIRS.filter(
      (pair) =>
        PRIMARY_FIRST.includes(pair.foreground) ||
        [pair.foreground, pair.background].every((name) => resolve(styles, ":root", name)),
    ).map(({ foreground, background, kind }) => {
      const found = [foreground, background].map((name) => [
        name,
        resolve(styles, mode.scope, name),
      ]);
      const blocked = found.find(([, value]) => !value?.color);
      if (blocked) {
        const why = blocked[1]
          ? `${blocked[0]} is written as ${blocked[1].value}`
          : `${blocked[0]} is not declared`;
        return { foreground, background, kind, ratio: null, why };
      }
      return {
        foreground,
        background,
        kind,
        ratio: contrast(found[0][1].color, found[1][1].color),
      };
    }),
  }));
}

// Checks this plugin's tool could hold for the values the stylesheet has now, per decision, and
// what could not be read.
function valueCandidates(styles, level, open, words = {}) {
  const candidates = {};
  const failing = [];
  const unreadable = [];
  const own = withoutBlock(styles.css);

  if (open("color-contrast")) {
    const pairs = contrastToday(styles).flatMap((mode) =>
      mode.pairs.map((pair) => ({ ...pair, mode: mode.name, scope: mode.scope })),
    );
    const label = (pair) => `${pair.mode}: ${pair.foreground} on ${pair.background}`;
    const blind = pairs.filter((pair) => pair.ratio === null);
    const seen = pairs.filter((pair) => pair.ratio !== null);
    if (level && seen.length > 0) {
      const minOf = (pair) =>
        pair.kind === "non-text" ? THRESHOLDS[level].nonText : THRESHOLDS[level].text;
      const measured = seen.map((pair) => ({ ...pair, min: minOf(pair) }));
      const below = measured.filter((pair) => pair.ratio < pair.min);
      // A pair below its threshold whose roles are the repository's own, or kept by the owner's
      // word, is a broken state: nothing is adopted. One whose roles still wait on the owner waits
      // with them, named with its number.
      const broken = below.filter((pair) => pairWaits(pair, words).length === 0);
      if (broken.length > 0) {
        failing.push({
          id: "color-contrast",
          why: broken
            .map((pair) => `${label(pair)} is ${pair.ratio.toFixed(2)}:1, below ${pair.min}:1`)
            .join("; "),
        });
      } else {
        const modes = [...new Set(seen.map((pair) => pair.mode))];
        const whole = blind.length === 0;
        const waiting = below.map(
          (pair) => `${pairSays(pair)} and waits on ${pairWaits(pair, words).join(", ")}`,
        );
        candidates["color-contrast"] = {
          what: `every pair of the table of colour roles that can be read reaches its threshold in ${modes.join(" and ")} mode (${seen.length} pairs)${waiting.length > 0 ? `, but for ${waiting.length}: ${waiting.join("; ")}` : ""}`,
          row: {
            kind: "formula",
            source: `WCAG 2.2 level ${level}, contrast ratio for text and for parts that are not text`,
            note: `every pair of the plugin's table of colour roles (${ROLES_FILE}) in ${modes.join(" and ")} mode${waiting.length > 0 ? `; ${waiting.length} below the threshold wait on the owner and are named on every run` : ""}${whole ? "" : "; the pairs that could not be read are not checked"}`,
          },
          checks: pairChecks(measured, words),
        };
      }
    }
  }

  if (open("radius-value")) {
    const radius = ownValue(styles, ":root", "--radius");
    if (radius === null) {
      unreadable.push({ id: "radius-value", why: "--radius is not declared in :root" });
    } else {
      candidates["radius-value"] = {
        what: `--radius stays ${radius.replace(/\s+/g, " ")}`,
        row: { kind: "closed", source: "the stylesheet's corner radius, as found" },
        checks: [
          {
            kind: "value",
            scope: ":root",
            variable: "--radius",
            expected: radius.replace(/\s+/g, " "),
          },
        ],
      };
    }
  }

  if (open("type-scale-values")) {
    const ownSizes = TYPE_VARIABLES.some((name) => declares(own, name));
    candidates["type-scale-values"] = ownSizes
      ? {
          what: "the stylesheet's own type sizes: each step stays larger than the one before",
          row: { kind: "closed", source: "the stylesheet's type scale, as found" },
          checks: [{ kind: "scale" }],
        }
      : {
          what: "the framework's type sizes: fails when the stylesheet declares its own",
          row: { kind: "standard", source: "the framework's type scale" },
          checks: [{ kind: "absent", variables: TYPE_VARIABLES }],
        };
  }

  if (open("spacing-values")) {
    if (!declares(own, "--spacing")) {
      candidates["spacing-values"] = {
        what: `the framework's ${SPACING_UNIT_PX}px spacing unit: fails when the stylesheet declares its own`,
        row: { kind: "standard", source: `the framework's ${SPACING_UNIT_PX}px unit` },
        checks: [{ kind: "absent", variables: ["--spacing"] }],
      };
    } else {
      const unit = ownValue(styles, ":root", "--spacing");
      if (unit === null) {
        unreadable.push({
          id: "spacing-values",
          why: "--spacing is declared outside :root, where this tool does not read it",
        });
      } else {
        candidates["spacing-values"] = {
          what: `--spacing stays ${unit.replace(/\s+/g, " ")}`,
          row: { kind: "closed", source: "the stylesheet's spacing unit, as found" },
          checks: [
            {
              kind: "value",
              scope: ":root",
              variable: "--spacing",
              expected: unit.replace(/\s+/g, " "),
            },
          ],
        };
      }
    }
  }
  return { candidates, failing, unreadable };
}

// What adopting would add to the repository at `root`, and what it leaves for a person.
export function adoption(
  root,
  { conformanceLevel = null, productType = null, record = [], hold = [], starter = false } = {},
) {
  if (productType !== null && !PRODUCT_TYPES.includes(productType)) {
    throw new Error(`product type must be one of ${PRODUCT_TYPES.join(", ")}`);
  }
  if (conformanceLevel !== null && !(conformanceLevel in THRESHOLDS)) {
    throw new Error(`conformance level must be one of ${Object.keys(THRESHOLDS).join(", ")}`);
  }
  const strangers = record.filter((id) => !RECORDABLE.includes(id));
  if (strangers.length > 0) {
    throw new Error(
      `--record takes ${RECORDABLE.join(", ")}; it cannot write a row for ${strangers.join(", ")}`,
    );
  }

  // Laying the ledgers reads every value it finds as the floor's only where the repository shows
  // nothing of its own. Where its primary color role has a hue of its own, or it adopted values
  // of its own before (the two things that stop the guide), the ledgers are laid all the same and
  // nothing more is taken for the floor's: each value is the repository's, as adopting without
  // --starter records it.
  const theme = JSON.parse(read(root, FILES.theme) ?? "null");
  const onFloor = starter && ownValuesProblem(root) === null;
  // Where the gate is, and where the package keeps its source: asked once, read by every step.
  const host = gateHost(root);
  const { folder: source } = sourceFolder(root);

  const ledgerText = read(root, LEDGER);
  const existing = ledgerText === null ? [] : parseLedger(ledgerText);
  const have = new Set(existing.map((row) => row.id));
  // Rows of the repository's own that say a decision is made and name no check. They are never
  // touched, unless a person names them with --hold: then a row gets its pointer, and only that.
  const unheld = new Set(
    existing.filter((row) => !row.check && row.kind !== "judgment").map((row) => row.id),
  );
  const notHoldable = hold.filter((id) => !unheld.has(id));
  if (notHoldable.length > 0) {
    throw new Error(
      `--hold takes rows of the ledger that have no check; ${notHoldable.join(", ")} is not one`,
    );
  }
  const result = {
    stylesheet: theme?.stylesheet ?? findStylesheet(root),
    files_read: [],
    contrast: [],
    rows: [],
    failing: [],
    unreadable: [],
    unclaimed: [],
    pointed: [],
    holdable: [],
    kept: [],
    rerun: [],
    loose: [],
    // The fonts the repository loads today, each proposed as a row of the sources ledger.
    fonts: [],
    person: [],
    in_ledger: have.size,
    files: {},
  };
  // The ledgers a repository has from birth that only a person writes after that: laid on a floor
  // in the form the guide starts from, each to be confirmed or changed by a person.
  const starting = {};
  const taken = (id) =>
    [result.rows, result.pointed, result.holdable].some((list) => list.some((r) => r.id === id));
  // Open: no row yet, or a row of the repository's that has no check.
  const open = (id) => (!have.has(id) || unheld.has(id)) && !taken(id);
  // True when the proof is taken up now: a new row, or a pointer the person asked for.
  const add = (id, row, how) => {
    if (!have.has(id)) result.rows.push({ id, layer: layerOf(id), ...row, how });
    else if (hold.includes(id)) result.pointed.push({ id, ...row, how });
    else result.holdable.push({ id, ...row, how });
    return !have.has(id) || hold.includes(id);
  };

  const styles = result.stylesheet ? loadStyles(root, result.stylesheet) : null;
  const recorded = theme?.inputs?.conformanceLevel ?? null;
  if (conformanceLevel && recorded && conformanceLevel !== recorded) {
    throw new Error(
      `this repository already records conformance level ${recorded}; changing it is a decision for the guide, not for adopting`,
    );
  }
  const level = conformanceLevel ?? recorded;
  const checks = {};

  if (styles === null) {
    result.unreadable.push({ id: "stylesheet", why: "no stylesheet found to read values from" });
  } else {
    result.files_read = styles.files;
    // What cannot be read is said on every run, whether or not a row already covers the rest.
    result.contrast = contrastToday(styles);
    const blind = result.contrast.flatMap((mode) =>
      mode.pairs
        .filter((pair) => pair.ratio === null)
        .map((pair) => `${mode.name}: ${pair.foreground} on ${pair.background}: ${pair.why}`),
    );
    if (blind.length > 0) {
      result.unreadable.push({ id: "color-contrast", why: `${blind.join("; ")}. Not checked` });
    }
    // The owner's word for each question of the table of colour roles: on the waiting list, since
    // a repository that adopts its values has no blueprint to hold it.
    let listed;
    try {
      listed =
        readWaiting(
          root,
          existing.map((row) => String(row.id)),
        )?.rows ?? [];
    } catch {
      // A waiting list that cannot be read gives no word: the decision sheet reports it.
      listed = [];
    }
    const { candidates, failing, unreadable } = valueCandidates(
      styles,
      level,
      open,
      wordsFromListed(listed),
    );
    result.failing.push(...failing);
    result.unreadable.push(...unreadable);
    // The design tokens file is new to the repository, so writing it changes nothing it has. One
    // that is already there and says something else is a person's file, and is kept.
    const tokens = open(TOKENS_DECISION)
      ? tokensPlan(root, styles, result.stylesheet, false)
      : { skipped: null };
    if (tokens.skipped) result.kept.push({ id: TOKENS_DECISION, why: tokens.skipped });
    else if (tokens.file) {
      candidates[TOKENS_DECISION] = {
        what: `${tokens.file} says what the stylesheet says`,
        row: { kind: tokens.row.kind, source: tokens.row.source },
        checks: tokens.checks,
      };
      // One variable is said as it always was; several are said once, with why when it is known.
      if (tokens.unresolved.length === 1) {
        result.unreadable.push({
          id: TOKENS_DECISION,
          why: `${tokens.unresolved[0]} points nowhere`,
        });
      } else if (tokens.unresolved.length > 1) {
        const why =
          (styles.base ?? "") === ""
            ? ": no stylesheet read here declares them, and the framework's own theme, which may, is not installed here"
            : ": no stylesheet read here declares them";
        result.unreadable.push({
          id: TOKENS_DECISION,
          why: `${tokens.unresolved.length} variables point nowhere, so they are not in the design tokens file (${tokens.unresolved.join(", ")})${why}`,
        });
      }
    }
    // The same for the component manifest: read from the source, which is left as it is.
    const components = open(COMPONENTS_DECISION) ? componentsPlan(root, false) : {};
    if (components.skipped) {
      result.kept.push({ id: COMPONENTS_DECISION, why: components.skipped });
    } else if (components.file) {
      candidates[COMPONENTS_DECISION] = {
        what: `${components.file} lists the components and variants of ${components.checks[0].folder}`,
        row: { kind: components.row.kind, source: components.row.source },
        checks: components.checks,
      };
    }
    // Target size needs the conformance level, like contrast: without it nothing is measured
    // against anything.
    const targets = open("target-size") && level ? targetPlan(root, level) : {};
    if (targets.row) {
      candidates["target-size"] = {
        what: targets.what,
        row: { kind: targets.row.kind, source: targets.row.source, note: targets.row.note },
        checks: targets.checks,
      };
    } else if (targets.below?.length > 0) {
      result.failing.push({
        id: "target-size",
        why: `${targets.below.join("; ")}: below the ${targets.min}px target size`,
      });
    }
    // Column types: only where the repository keeps the table of them. Adopting writes no table
    // and installs no code: which column types a product has is a person's list.
    const columns = columnsPlan(root, { starter, code: false });
    if (starter && !columns.problem) Object.assign(starting, columns.files);
    const named = [...new Set(Object.values(columns.displays ?? {}))];
    if (columns.nothing && named.length > 0 && open("display-kind")) {
      result.person.push({
        id: "display-kind",
        why: `the data model names ${named.length} column type(s) (${named.join(", ")}) and there is no design/column-types.json listing them`,
      });
    } else if (columns.problem) {
      result.failing.push({ id: "display-kind", why: columns.problem });
    }
    const derived = {};
    for (const [id, item] of Object.entries(columns.held ?? {}).filter(([key]) => open(key))) {
      const row = {
        kind: item.row.kind,
        source: item.row.source,
        ...(item.row.note ? { note: item.row.note } : {}),
      };
      candidates[id] = { what: item.what, row, checks: item.checks };
      derived[id] = columns.files;
    }
    for (const item of columns.failing ?? []) if (open(item.id)) result.failing.push(item);
    // States, words and error messages: held where the repository meets the rule today. The list
    // of required states is a person's file, so adopting writes none.
    const patterns = patternsPlan(root, { starter });
    if (starter) Object.assign(starting, patterns.files, startingSizes(root));
    for (const [id, item] of Object.entries(patterns.held).filter(([key]) => open(key))) {
      const row = { kind: item.row.kind, source: item.row.source, note: item.row.note };
      candidates[id] = { what: item.what, row, checks: item.checks };
    }
    for (const item of patterns.failing) if (open(item.id)) result.failing.push(item);
    // The repository's own typefaces: held as found. That each one the stylesheet names is
    // loaded, as the build loads one; and, where no guide wrote the block, that text and headings
    // keep the typefaces they name today. In a repository the guide wrote, which typeface is the
    // owner's answer in the guide.
    if (open("font-loaded")) {
      const loaded = fontsPlan(root, styles, result.stylesheet);
      if (loaded.failing) result.failing.push(loaded.failing);
      else if (loaded.row) {
        const { kind, source, note } = loaded.row;
        candidates["font-loaded"] = {
          what: loaded.what,
          row: { kind, source, note },
          checks: loaded.checks,
        };
      }
    }
    if (open("typeface") && readBlock(read(root, result.stylesheet) ?? "") === null) {
      const named = declaredFonts(styles)
        .map((variable) => [variable, resolve(styles, ":root", variable)])
        .filter(([, found]) => found !== null)
        .map(([variable, found]) => [variable, found.value.replace(/\s+/g, " ")]);
      if (named.length > 0) {
        candidates.typeface = {
          what: named.map(([variable, value]) => `${variable} stays ${value}`).join("; "),
          row: { kind: "closed", source: "the stylesheet's typefaces, as found" },
          checks: named.map(([variable, expected]) => ({
            kind: "value",
            scope: ":root",
            variable,
            expected,
          })),
        };
      }
    }
    // The font the repository loads today is its own: its row of the sources ledger is proposed
    // from what the repository holds, a package its lockfile pins or files hashed in place. A row
    // that is there is left as it is; the licence is a person's, so the row waits on it.
    for (const font of ownFonts(root, styles, result.stylesheet, { on: today(), by: "adopt" })) {
      const own = `${font.shown} is the repository's own font, loaded by ${font.by}`;
      if (font.exists) {
        result.kept.push({
          id: "font-source",
          why: `${own}: ${font.exists} is already there, and is left as it is`,
        });
      } else if (font.cannot) {
        result.person.push({ id: "font-source", why: `${own}, and ${font.cannot}` });
      } else {
        result.files[font.row] = font.content;
        result.fonts.push({
          shown: font.shown,
          family: font.family,
          row: font.row,
          own: true,
          from: font.from,
          loaded_by: font.by,
          stated: font.stated,
        });
        result.person.push({
          id: "font-licence",
          why: `${licenceStep(font.row)}${font.stated ? `. ${font.stated}` : ""}`,
        });
      }
    }
    const artifacts = { [TOKENS_DECISION]: tokens, [COMPONENTS_DECISION]: components };
    // Every ledger the repository has, or gets in this run, has the one shape of the contract:
    // held from here on. A ledger that differs gets no row, and the differences are said.
    if (open("ledger-shapes")) {
      const planned = { tokens: tokens.file, components: components.file };
      const pending = {
        ...starting,
        ...Object.fromEntries(
          Object.values(artifacts)
            .filter((artifact) => artifact.file)
            .map((artifact) => [artifact.file, artifact.content]),
        ),
      };
      const ledgers = {};
      const wrong = [];
      for (const [kind, ledger] of Object.entries(LEDGERS)) {
        if (!ledger.file) continue;
        const file = planned[kind] ?? ledger.file;
        // A ledger that may be kept as fragments is read in either shape: one file, or one file
        // per entry.
        const text =
          pending[file] ??
          (kind in FRAGMENT_LEDGERS ? screensText(root, file, kind) : read(root, file));
        if (text === null || text === undefined) continue;
        ledgers[kind] = file;
        const differs = differences(shapeProblems(kind, text, file), file);
        if (differs.length > 0) wrong.push(`${file}: ${differs.slice(0, 3).join("; ")}`);
      }
      const pages = readPages(root);
      for (const [file, text] of Object.entries(pages)) {
        const differs = differences(shapeProblems("screen-kinds", text, file), file);
        if (differs.length > 0) wrong.push(`${file}: ${differs.slice(0, 3).join("; ")}`);
      }
      if (wrong.length > 0) result.failing.push({ id: "ledger-shapes", why: wrong.join(". ") });
      else if (Object.keys(ledgers).length > 0) {
        const withPages = Object.keys(pages).length > 0;
        candidates["ledger-shapes"] = {
          what: `${Object.keys(ledgers).length} ledger(s)${withPages ? " and the pages of screen kinds" : ""} have the one shape the contract gives them`,
          row: {
            kind: "closed",
            source: "the design-assembly contract, one shape per ledger with its version",
            note: "that each ledger present has its shape and a version this tool reads; what a ledger says is held by the rows about it",
          },
          checks: [
            { kind: "shapes", ledgers, ...(withPages ? { pages: KINDS_FOLDER } : {}) },
            // A ledger already kept as one file per entry is held as such.
            ...Object.keys(FRAGMENT_LEDGERS)
              .filter((kind) => ledgers[kind])
              .flatMap((kind) => fragmentsChecks(root, null, ledgers[kind], kind)),
            // No file of the code uses an item of an outside source taken down and not taken in.
            TAKEN_DOWN_CHECK,
            // A component file a branch adds, or a row made by hand it writes, holds the choice.
            CHOOSE_FIRST_CHECK,
            // The floating parts of each item of an outside source are opened by a browser test.
            ...floatingParts(root).checks,
            // A repository of a family: the locked answers of the core it pinned.
            ...(readPinnedCore(root) === null ? [] : [FAMILY_CORE_CHECK]),
          ],
        };
      }
    }
    const gate = host.problem ?? null;
    const ids = Object.keys(candidates);
    if (gate && ids.length > 0) {
      result.person.push({
        id: "checks-in-gate",
        why: `${gate}. Until the gate can run this plugin's tool, no check is added for ${ids.join(", ")}`,
      });
    } else if (ids.length > 0) {
      if (open("checks-in-gate")) candidates["checks-in-gate"] = gateCandidate(host);
      // The decision sheet and the wall come with the gate: every repository that runs this tool
      // gets them, as the guide writes them.
      for (const [id, item] of [
        ["decision-sheet", DECISION_SHEET],
        ["owner-calls", OWNER_CALLS],
      ]) {
        if (!open(id)) continue;
        // Adopting gives the layer and the pointer at the tool itself.
        const row = { kind: item.row.kind, source: item.row.source, note: item.row.note };
        candidates[id] = { what: item.what, row, checks: item.checks };
      }
      // A package that keeps its source elsewhere than the usual folder: each check that walks the
      // source reads that folder, as every reader does.
      if (source !== DEFAULT_FOLDER) {
        for (const candidate of Object.values(candidates)) {
          candidate.checks = candidate.checks.map((check) => ({
            ...check,
            ...(check.sources === DEFAULT_FOLDER ? { sources: source } : {}),
            ...(check.folder === DEFAULT_FOLDER ? { folder: source } : {}),
          }));
        }
      }
      // Each candidate is run by the tool itself on the repository as it is: a check is added only
      // when it passes now and fails on a changed copy.
      // A ledger that may be kept as fragments is read in either shape: one file, or one file per
      // entry. Each path is known with the ledger it is.
      const splittable = new Map(
        Object.values(candidates)
          .flatMap((candidate) => candidate.checks)
          .flatMap((item) =>
            Object.keys(FRAGMENT_LEDGERS)
              .filter((kind) => item.ledgers?.[kind])
              .map((kind) => [item.ledgers[kind], kind]),
          ),
      );
      const trial = {
        root,
        stylesheet: result.stylesheet,
        ...styles,
        gate: vendored()[FILES.gate],
        makefile: readMakefile(root),
        // Where the gate is a package script, the package file as it will be written.
        package: trialPackage(root, host),
        // What loads a typeface, as the adapter of the repository's build reads it.
        fonts: readLoads(root, styles.css, result.stylesheet),
        displays: columns.displays ?? {},
        files: {
          ...starting,
          ...Object.fromEntries(
            Object.values(artifacts)
              .filter((artifact) => artifact.file)
              .map((artifact) => [artifact.file, artifact.content]),
          ),
          ...Object.fromEntries(
            Object.values(candidates)
              .flatMap((candidate) => candidate.checks)
              .flatMap((item) => [
                item.file,
                item.types,
                item.registry,
                item.test,
                item.door,
                ...Object.values(item.ledgers ?? {}),
              ])
              .filter(Boolean)
              .map((file) => [
                file,
                splittable.has(file)
                  ? screensText(root, file, splittable.get(file))
                  : read(root, file),
              ])
              .filter(([, text]) => text !== null),
          ),
          ...columns.files,
        },
        fragments: Object.fromEntries(
          [...splittable].map(([file, kind]) => [file, readFragments(root, file, kind)]),
        ),
        folders: Object.fromEntries(
          checkFolders(Object.values(candidates).flatMap((candidate) => candidate.checks)).map(
            (folder) => [folder, readFolder(root, folder)],
          ),
        ),
        pages: Object.fromEntries(
          [
            ...new Set(
              Object.values(candidates)
                .flatMap((candidate) => candidate.checks)
                .map((item) => item.pages)
                .filter(Boolean),
            ),
          ].map((folder) => [folder, readPages(root, folder)]),
        ),
        theme: {
          checks: Object.fromEntries(
            Object.entries(candidates).map(([id, candidate]) => [id, candidate.checks]),
          ),
        },
      };
      for (const outcome of runChecks(trial)) {
        if (outcome.held) {
          const now = add(
            outcome.id,
            { ...candidates[outcome.id].row, check: TOOL, what: candidates[outcome.id].what },
            "held",
          );
          if (!now) continue;
          checks[outcome.id] = candidates[outcome.id].checks;
          const artifact = artifacts[outcome.id];
          if (artifact) result.files[artifact.file] = artifact.content;
          Object.assign(result.files, derived[outcome.id]);
        } else {
          result.unreadable.push({
            id: outcome.id,
            why:
              outcome.problem ?? "the check could not be made to fail, so it would prove nothing",
          });
        }
      }
    }
  }

  // A person's calls. The script shows what it sees; the row is written only on their word.
  if (open("conformance-level")) {
    if (conformanceLevel) {
      add("conformance-level", { kind: "judgment", source: FILES.theme }, "recorded");
    } else if (!recorded) {
      result.person.push({
        id: "conformance-level",
        why: "say which level the product commits to with --conformance-level AA or AAA; no contrast check is added before that",
      });
    }
  }
  // A repository of a family: the core it pinned answers what it holds, and is not asked again.
  const member = readMember(root);
  const pinned = member && !member.pinned.unreadable ? member.pinned : null;
  const coreColour = pinned?.answers.find((answer) => answer.id === "source-color") ?? null;
  // A colour the repository holds and its core settles otherwise: what the stylesheet shows, and
  // where its line goes among what needs a person. Where it stands is read with every answer of
  // the core, further down, once the files this run lays are known.
  let ownColour = null;
  if (open("source-color")) {
    const primary = styles ? ownValue(styles, ":root", "--primary") : null;
    const followed = primary ? expand(styles, ":root", primary) : null;
    const shown = followed && followed !== primary ? `, which is ${followed}` : "";
    const sameAsCore =
      coreColour !== null &&
      primary !== null &&
      sameCoreValue("source-color", followed ?? primary, coreColour.value);
    if (record.includes("source-color")) {
      if (primary === null) throw new Error("--record source-color: --primary is not declared");
      add("source-color", { kind: "judgment", source: result.stylesheet }, "recorded");
    } else if (sameAsCore) {
      // The family's owner settled this colour; the row says it is inherited.
      add("source-color", { kind: "judgment", source: result.stylesheet }, "recorded");
    } else if (coreColour && primary !== null) {
      ownColour = {
        at: result.person.length,
        seen: `--primary is ${primary} in ${result.stylesheet}${shown}`,
      };
    } else if (primary !== null) {
      result.person.push({
        id: "source-color",
        why: `--primary is ${primary} in ${result.stylesheet}${shown}. If that is the decided brand colour, run again with --record source-color`,
      });
    }
  }

  const knownType = theme?.inputs?.productType ?? null;
  if (open("product-type")) {
    if (productType) add("product-type", { kind: "judgment", source: FILES.theme }, "recorded");
    else if (!knownType) {
      result.person.push({
        id: "product-type",
        why: `say what kind of product this is with --product-type ${PRODUCT_TYPES.join(" or ")}`,
      });
    }
  }

  // Proofs the repository already has. Named, wired in, and not run here.
  for (const proof of findProofs(root).filter((item) => open(item.id))) {
    if (proof.problem) result.unclaimed.push({ id: proof.id, why: proof.problem });
    else add(proof.id, { kind: proof.kind, source: proof.source, check: proof.check }, "claimed");
  }

  proposeMark(root, result);

  // Rows a lint rule holds, of the repository's or added just now. The tool lints texts that break
  // the decision, and holds the row when the lint rejects every one; the row is not rewritten.
  rerunLint(root, [...existing, ...result.rows], theme, checks, result);

  if (result.rows.length > 0 || result.pointed.length > 0) {
    // Only the ledger's own keys are written: how a row is held is for the report.
    const merged = result.rows.length > 0 ? mergeLedger(ledgerText, result.rows) : ledgerText;
    result.files[LEDGER] = result.pointed.reduce(
      (text, row) => pointRow(text, row.id, row.check),
      merged,
    );
  }
  const tooled = Object.keys(checks);
  const said =
    (conformanceLevel && conformanceLevel !== recorded) ||
    (productType && productType !== knownType);
  Object.assign(result.files, starting);
  if (tooled.length > 0 || said || starter) {
    const adopted = [
      ...new Set([...(theme?.adopted ?? []), ...tooled.filter((id) => VALUES.includes(id))]),
    ];
    const floorValues = onFloor ? adopted : (theme?.[FROM_FLOOR] ?? []);
    const data = {
      version: 1,
      ...(result.stylesheet ? { stylesheet: result.stylesheet } : {}),
      inputs: {
        ...theme?.inputs,
        ...(level ? { conformanceLevel: level } : {}),
        ...(productType ? { productType } : {}),
      },
      ...(adopted.length > 0 ? { adopted } : {}),
      // Laid on a floor, the values adopted are the floor's, named one by one, and the guide may
      // replace them. A value adopted without --starter, or on a repository that has values of
      // its own, is the repository's own.
      ...(floorValues.length > 0 ? { [FROM_FLOOR]: floorValues } : {}),
      checks: { ...theme?.checks, ...checks },
      // What a person wrote of the change map is theirs: kept as it is.
      ...(theme?.affected ? { affected: theme.affected } : {}),
    };
    result.files[FILES.theme] = renderJson(data, lineWidth(root));
  }
  if (tooled.length > 0) {
    // The tool, and where the gate is: the make step, or the script of the package.
    Object.assign(result.files, gateFiles(root, host, vendored()));
    const told = gateSaid(root, host);
    result.gate_said = told.lines;
    Object.assign(result.files, told.files);
    // The browser test the check of the floating parts holds, where the repository has none.
    if ((checks["ledger-shapes"] ?? []).some((check) => check.kind === FLOATING_CHECK.kind)) {
      Object.assign(result.files, floatingParts(root).files);
    }
    // The page an agent reads first, written from every rule the tool now holds here.
    const all = { ...theme?.checks, ...checks };
    const fixed = blueprintOf(root);
    if (fixed.problem) result.unreadable.push({ id: "blueprint", why: fixed.problem });
    result.files[RULES_PAGE] = rulesPage(
      all,
      (file) => file in result.files || read(root, file) !== null,
      fixed.blueprint,
      {
        buttons: ledgerButtons(root),
        stylesheet: result.stylesheet,
        // What loads a typeface the stylesheet leaves to the build, as the adapter reads it.
        fonts: styles ? readLoads(root, styles.css, result.stylesheet).loads : [],
      },
    );
  }
  // A repository with a mark in the sources ledger, or one proposed now: the gate, where it is
  // laid, holds the pin of every logo row beside the shapes of the ledgers.
  if (result.marks || readLogoSources(root).length > 0) {
    const laid = themeWithLogoPins(root, result.files[FILES.theme] ?? read(root, FILES.theme));
    if (laid) result.files[FILES.theme] = laid;
  }
  // A repository of a family: each row of an answer of its core says where it stands, and the
  // report says what the core answered. One that declares none, while this machine keeps a core,
  // is asked the one question about a family.
  if (pinned) {
    // Compared as joining compares them, by the same code, on the files this run lays: a locked
    // answer the repository holds otherwise is asked on the decision sheet in this very run, under
    // the id the join gives it, and a default it held otherwise before it joined keeps its answer.
    // A row the ledger had already is never given that reason: only a person gives it then.
    const before = pinned.joined?.by
      ? Object.entries(reasonsBeforeJoining(pinned.answers, pinned.joined))
      : [];
    const held = holdAnswers(root, pinned, {
      on: today(),
      reasons: Object.fromEntries(before.filter(([id]) => !have.has(id))),
      pending: result.files,
      who: "adopt",
    });
    Object.assign(result.files, held.files);
    result.family_core = inheritedSummary(pinned, held.answers);
    if (ownColour) {
      const line = colourLine(ownColour.seen, coreColour, held);
      if (line) result.person.splice(ownColour.at, 0, line);
    }
  } else if (member) {
    result.unreadable.push({
      id: "family-core",
      why: `the copy of the family core here cannot be read (${member.pinned.unreadable}): the repository inherits nothing and its own answers stand; pin it again with core --join`,
    });
  } else {
    // The one question about a family comes first, and what a core of the list answers is held
    // back until it is answered: a repository that joins is never asked what its core answered.
    const { question: asked, cores = [] } = familyQuestion(root);
    if (asked) {
      const answered = answeredByCores(cores);
      result.held_back = result.person
        .filter((item) => answered.has(item.id))
        .map((item) => heldBack(item.id, answered.get(item.id), cores.length));
      result.person = [
        { id: "family", why: `${asked.question} ${asked.recommendation}` },
        ...result.person.filter((item) => !answered.has(item.id)),
      ];
      result.family_question = asked;
    }
  }
  return result;
}

// The repository's own mark, from the icons its pages declare: its row of the sources ledger is
// proposed from the files the repository keeps, hashed in place, and the licence is a person's, so
// the row waits on it. A row that is there is left as it is; what cannot be read is a person's to
// write. A repository whose pages declare no icon hears nothing of a mark.
function proposeMark(root, result) {
  const mark = ownMark(root, { on: today(), by: "adopt" });
  for (const why of mark.cannot ?? []) result.person.push({ id: "logo-source", why });
  for (const file of mark.exists ?? []) {
    result.kept.push({
      id: "logo-source",
      why: `the repository's own mark: ${file} is already there, and is left as it is`,
    });
  }
  if (!mark.proposed) return;
  result.files[mark.proposed.row] = mark.proposed.content;
  result.marks = [
    {
      row: mark.proposed.row,
      own: true,
      from: mark.proposed.from,
      files: mark.proposed.files,
    },
  ];
  result.person.push(
    { id: "logo-licence", why: markLicenceStep(mark.proposed.row) },
    {
      id: "logo-variant",
      why: `each file of ${mark.proposed.row} is written as the variant color: write mono for a file in one colour, or inverse for one drawn for a dark ground, and give the other files of the mark with logo-source`,
    },
  );
}

// A question held back until the family question is answered: which cores answer it, and what
// becomes of it after. `known` is how many cores the repository is asked about.
function heldBack(id, by, known) {
  const other = known > by.length ? " or another" : "";
  const why =
    by.length === 1
      ? `the family core ${by[0].family} answers it (${by[0].hold}): not asked if this repository joins that family, asked as before if it joins none${other}`
      : `the family cores ${by.map((core) => `${core.family} (${core.hold})`).join(", ")} answer it: not asked if this repository joins one of them, asked as before if it joins none${other}`;
  return { id, answered_by: by, why };
}

// The line about a colour the repository holds and its core settles otherwise, or null when
// nothing of it needs a person: the core's is a default, or the exception is recorded. `seen` says
// what the stylesheet shows; `held` is where every answer of the core stands, and the questions
// this run makes. The line names the question of the decision sheet, and says only what is so when
// it is printed: that the question waits, or that it is among the files of this run.
function colourLine(seen, answer, held) {
  const at = held.answers.find((item) => item.id === answer.id);
  if (answer.hold !== "locked") return null;
  const lead = `${seen}, and the family core this repository pinned locks ${answer.value}`;
  const choice = "follow the core, or keep this colour as an exception with its reason";
  if (at.state === "inherited" && at.held_here === undefined) {
    // No ledger of the repository holds the colour yet, so the join's comparison sees nothing.
    return {
      id: answer.id,
      why: `${lead}: ${choice}. No question is on the decision sheet yet: ${TOKENS} does not hold the colour, and the question is written once it does`,
      question: null,
    };
  }
  if (at.state !== "differs") return null;
  const made = held.asked[answer.id];
  const why = made
    ? `${lead}: ${choice}. The question is put on the decision sheet with the files below (${made})`
    : at.answered === "follow"
      ? `${lead}: the owner answered ${at.question} on the decision sheet to follow the core, and the repository still holds this colour. Change it to the core's: the gate is red until then`
      : at.answered
        ? `${lead}: ${at.question} was refused on the decision sheet with no reason, and an exception is kept only with its reason. Give it with core --settle --why ${answer.id}=<reason> --by <name>`
        : `${lead}: ${choice}. The question waits on the decision sheet (${at.question})`;
  return { id: answer.id, why, question: at.question };
}

// The decisions whose probe draws a component of the library, when the repository has one.
const ON_COMPONENT = ["no-restyled-component", "whole-class-names"];

// For each row that points at a lint rule and whose decision this tool can probe: where the rule
// applies, then the lint on the probes. A row whose every probe is rejected by that rule, and whose
// check was seen failing with that rule off, gains the tool's check; any other is said with why.
function rerunLint(root, rows, theme, checks, result) {
  const { folder: source } = sourceFolder(root);
  const open = rows.filter(
    (row) =>
      ruleOf(row.check) &&
      PROBED.includes(String(row.id)) &&
      !theme?.checks?.[row.id] &&
      !checks[row.id],
  );
  if (open.length === 0) return;
  const rules = [...new Set(open.map((row) => ruleOf(row.check)))];
  const found = whereRulesApply(root, rules, probeCandidates(root));
  if (found.error) {
    for (const row of open) result.loose.push({ id: String(row.id), why: found.error });
    return;
  }
  const component = probeComponent(root);
  const trial = {};
  for (const row of open) {
    const rule = ruleOf(row.check);
    const at = found.at[rule];
    if (!at) {
      result.loose.push({
        id: String(row.id),
        why: `${rule} is an error on no screen file under ${source === "." ? "the package" : source}, so no probe can be linted`,
      });
      continue;
    }
    const drawn = ON_COMPONENT.includes(String(row.id)) && component ? { component } : {};
    trial[row.id] = [{ kind: "lint", rule, at, ...drawn }];
  }
  const lint = lintResults(root, trial, rows);
  for (const outcome of runChecks({ root, ledger: rows, theme: { checks: trial }, lint })) {
    const row = open.find((item) => String(item.id) === outcome.id);
    const [check] = trial[outcome.id];
    if (!outcome.held) {
      result.loose.push({
        id: outcome.id,
        why: outcome.problem ?? "the check could not be made to fail, so it would prove nothing",
      });
      continue;
    }
    checks[outcome.id] = trial[outcome.id];
    result.rerun.push({
      id: outcome.id,
      check: row.check,
      what: `every probe is rejected, by ${check.rule}`,
    });
  }
}

const HOW = {
  held: "held      checked by this plugin's tool, seen failing on a changed copy",
  claimed: "claimed   named and wired in, not run here",
  recorded: "recorded  a person's call, no check",
};

export function report(result) {
  const lines = [];
  const section = (title, items, render) => {
    if (items.length === 0) return;
    lines.push("", title);
    for (const item of items) lines.push(`  ${render(item)}`);
  };
  const reason = (item) => `${item.id}: ${item.why}`;
  lines.push(
    result.stylesheet
      ? `stylesheet: ${result.stylesheet} (${result.files_read.length} file(s) read)`
      : "stylesheet: none found",
  );
  lines.push(
    `already in the ledger: ${result.in_ledger} decision(s). None is rewritten; a row named with --hold gains its check line`,
  );
  section("contrast ratios today:", result.contrast, (mode) => {
    const pairs = mode.pairs.map((pair) => {
      const value =
        pair.ratio === null ? `cannot be read (${pair.why})` : `${pair.ratio.toFixed(2)}:1`;
      return `${pair.foreground} on ${pair.background} ${value}`;
    });
    return `${mode.name} (${[mode.scope].flat().join(", ")}): ${pairs.join("; ")}`;
  });
  lines.push("", `rows to add: ${result.rows.length}`);
  for (const how of Object.keys(HOW)) {
    const rows = result.rows.filter((row) => row.how === how);
    if (rows.length === 0) continue;
    lines.push(`  ${HOW[how]}`);
    for (const row of rows) {
      const detail = row.what ? `: ${row.what}` : row.check ? `  (${row.check})` : "";
      lines.push(`    ${row.id}${detail}`);
    }
  }
  const proof = (row) => `${row.id}: ${row.what ?? row.check}`;
  section("rows of yours that now point at a check:", result.pointed, proof);
  section(
    "rows of yours with no check, that could have one (pass --hold with their names):",
    result.holdable,
    proof,
  );
  section(
    "rows of yours a lint rule holds, now re-run by this tool on texts that break them:",
    result.rerun,
    proof,
  );
  section(
    "rows of yours a lint rule is said to hold, that its re-run does not show, so they stay claimed:",
    result.loose,
    reason,
  );
  section(
    "the repository's own font, proposed as a row of the sources ledger (a person writes its licence):",
    result.fonts,
    (font) => `${font.shown}: ${font.row}, from ${font.from}; loaded by ${font.loaded_by}`,
  );
  section(
    "the repository's own mark, proposed as a row of the sources ledger (a person writes its licence):",
    result.marks ?? [],
    (mark) =>
      `${mark.row}, from ${mark.from}: ${mark.files.map((entry) => `${entry.file} (${entry.role})`).join(", ")}`,
  );
  section("would fail today, so nothing was added:", result.failing, reason);
  section("cannot be read here:", result.unreadable, reason);
  section("a proof is there but the ledger cannot point at it yet:", result.unclaimed, reason);
  section("already kept by the repository, and left as it is:", result.kept, reason);
  if ((result.family_core ?? []).length > 0) lines.push("", ...result.family_core);
  section("needs a person:", result.person, reason);
  section(
    "held back until the family question is answered (put that one question to the person first, alone, then run this again):",
    result.held_back ?? [],
    reason,
  );
  return lines;
}

const USAGE = `usage: node adopt.mjs [--target DIR] [--dry-run] [--conformance-level AA|AAA]
                      [--product-type ${PRODUCT_TYPES.join("|")}] [--record ID[,ID]]
                      [--hold ID[,ID]] [--starter] [--json]

  --target             The repository to adopt. The folder this is run from when not given.
  --dry-run            Show what would be added. Nothing is written.
  --conformance-level  The level the product commits to, as a person stated it. Writes that row
                       and lets the contrast of the color roles be checked against it.
  --product-type       What kind of product the screens are for, as a person stated it.
  --hold               Give rows of the ledger that have no check their pointer, once the person
                       has said which. One line is added to each row; nothing else in it changes.
  --record             Write a row for a person's call the script can only see, once the person
                       has confirmed it. Takes: ${RECORDABLE.join(", ")}.
  --starter            On a repository that has just been given its floor, also lay the ledgers
                       it has from birth that a person keeps after that (states, screens, screen
                       widths, column types), in the form the guide starts from. Asks nothing:
                       every value found is the floor's, and the guide may replace it. Where
                       the primary color role has a hue of its own, or values of the
                       repository's own were adopted before, the ledgers are laid all the same
                       and every value stays the repository's.
  --json               One JSON document: the rows added and how each is held, what the lint
                       re-run shows, what needs a person, and the files written or that would be.

  Adds rows to design/decisions.yaml and, where a value can be checked, this plugin's tool and
  its gate step. Changes no stylesheet, no lint configuration, no test and no existing row.

  Ends with 0 when done, 1 when something still needs a person's answer, 2 on a wrong call or
  a repository that cannot be read.
`;

const FLAGS = {
  "--dry-run": "switch",
  "--conformance-level": "value",
  "--product-type": "value",
  "--record": "value",
  "--hold": "value",
  "--starter": "switch",
};

function main(args) {
  const call = readCall(args, FLAGS);
  if (call.problem) return refuse(call.problem, USAGE);
  if (call.help) return void stdout.write(USAGE);
  const root = call.target;
  const dryRun = call.flags["--dry-run"] === true;
  const list = (flag) => (call.flags[flag] ?? "").split(",").filter(Boolean);
  // The root of a workspace holds nothing to adopt: the packages are named, and nothing is written.
  const space = workspaceOf(root);
  if (space) throw new Refusal(`${workspaceLines(space).join("\n")}\nNothing was written`);
  // A ledger a newer plugin wrote is never written over by this one.
  const newer = newerLedgers(root);
  if (newer.length > 0) throw new Refusal(`${newer.join("; ")}. Nothing was written`);
  let result;
  try {
    result = adoption(root, {
      conformanceLevel: call.flags["--conformance-level"] ?? null,
      productType: call.flags["--product-type"] ?? null,
      record: list("--record"),
      hold: list("--hold"),
      starter: call.flags["--starter"] === true,
    });
  } catch (error) {
    throw new Refusal(error.message);
  }
  const lines = [...report(result), "", "files:"];
  const written = writeFiles(root, result.files, dryRun);
  for (const line of written) lines.push(`  ${line}`);
  if (written.length === 0) lines.push("  nothing to write");
  if (result.gate_said?.length > 0) lines.push("", ...result.gate_said);
  if (dryRun) lines.push("preview only: nothing was written");
  else {
    const changed = written.filter((line) => !line.startsWith("unchanged")).length;
    lines.push(
      `done: ${result.rows.length} row(s) added to the ledger, ${result.pointed.length} given a check, ${changed} file(s) written`,
    );
  }
  // A machine gets what the report is written from; the files as a list, never their content.
  const facts = Object.fromEntries(
    Object.entries(result).filter(([key]) => !["files", "files_read"].includes(key)),
  );
  return finish({
    json: call.json,
    result: { dry_run: dryRun, ...facts, files: writtenFiles(written) },
    text: `${lines.join("\n")}\n`,
    work: result.person.length > 0,
  });
}

await start(import.meta.url, main);
