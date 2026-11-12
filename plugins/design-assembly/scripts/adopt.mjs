// Takes in what a repository already has: adds ledger rows for the proofs it finds, and checks
// around the values the stylesheet holds today. It never changes the stylesheet, the lint
// configuration, the tests or a row that is already in the ledger, and it adds a check only when
// that check passes on the repository as it is and was seen failing on a changed copy.
// Usage: node adopt.mjs --target DIR [--dry-run] [--conformance-level AA|AAA]
//                       [--product-type TYPE] [--record ID[,ID]]
import { existsSync, readFileSync, realpathSync } from "node:fs";
import path from "node:path";
import { argv, exit, stderr, stdout } from "node:process";
import { fileURLToPath } from "node:url";

import { FILES, runChecks } from "../templates/tools/design-assembly/check.mjs";
import { contrast } from "../templates/tools/design-assembly/color.mjs";
import { lineWidth, renderJson } from "../templates/tools/design-assembly/json.mjs";
import {
  LEDGER,
  mergeLedger,
  parseLedger,
  TOOL,
} from "../templates/tools/design-assembly/ledger.mjs";
import { SPACING_UNIT_PX, TYPE_VARIABLES } from "../templates/tools/design-assembly/scale.mjs";
import {
  DARK_SCOPES,
  findStylesheet,
  loadStyles,
  ownValue,
  resolve,
} from "../templates/tools/design-assembly/styles.mjs";
import { THRESHOLDS, withoutBlock } from "../templates/tools/design-assembly/theme.mjs";
import { COMPONENTS_DECISION, readFolder } from "../templates/tools/design-assembly/components.mjs";
import { TOKENS_DECISION } from "../templates/tools/design-assembly/tokens.mjs";
import {
  columnsPlan,
  componentsPlan,
  gateProblem,
  patternsPlan,
  targetPlan,
  tokensPlan,
  vendored,
  writeFiles,
} from "./apply.mjs";
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

// The pairs of color roles the tool can check today: the primary on the background, and the text
// on the primary.
const PAIRS = [
  ["--primary", "--background"],
  ["--primary-foreground", "--primary"],
];
// Decisions about a value the stylesheet holds. The guide generates these; adopting keeps them.
const VALUES = ["color-contrast", "type-scale-values", "spacing-values", "radius-value"];
// A person's calls this script can write a row for, once the person confirms what it sees.
const RECORDABLE = ["source-color"];

const read = (root, file) =>
  existsSync(path.join(root, file)) ? readFileSync(path.join(root, file), "utf8") : null;
const layerOf = (id) => STANDARD.find((decision) => decision.id === id).layer;
const declares = (css, name) =>
  new RegExp(`(^|[\\s;{])${name.replace(/[-]/g, "\\-")}\\s*:`, "m").test(css);

// The contrast ratio of each pair in each mode, as the stylesheet stands. A pair that cannot be
// read says why instead of a ratio.
export function contrastToday(styles) {
  const dark = DARK_SCOPES.find((scope) =>
    PAIRS.flat().some((name) => ownValue(styles, scope, name) !== null),
  );
  const modes = [{ name: "light", scope: ":root" }];
  if (dark) modes.push({ name: "dark", scope: dark });
  return modes.map((mode) => ({
    ...mode,
    pairs: PAIRS.map(([foreground, background]) => {
      const found = [foreground, background].map((name) => [
        name,
        resolve(styles, mode.scope, name),
      ]);
      const blocked = found.find(([, value]) => !value?.color);
      if (blocked) {
        const why = blocked[1]
          ? `${blocked[0]} is written as ${blocked[1].value}`
          : `${blocked[0]} is not declared`;
        return { foreground, background, ratio: null, why };
      }
      return { foreground, background, ratio: contrast(found[0][1].color, found[1][1].color) };
    }),
  }));
}

// Checks this plugin's tool could hold for the values the stylesheet has now, per decision, and
// what could not be read.
function valueCandidates(styles, level, open) {
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
      const min = THRESHOLDS[level].text;
      const below = seen.filter((pair) => pair.ratio < min);
      if (below.length > 0) {
        failing.push({
          id: "color-contrast",
          why: below
            .map((pair) => `${label(pair)} is ${pair.ratio.toFixed(2)}:1, below ${min}:1`)
            .join("; "),
        });
      } else {
        const modes = [...new Set(seen.map((pair) => pair.mode))];
        const whole = blind.length === 0;
        candidates["color-contrast"] = {
          what: `the primary color roles reach ${min}:1 in ${modes.join(" and ")} mode (${seen.length} pairs)`,
          row: {
            kind: "formula",
            source: `WCAG 2.2 level ${level}, contrast ratio for text`,
            note: `the primary color roles in ${modes.join(" and ")} mode${whole ? "" : "; the pairs that could not be read are not checked"}`,
          },
          checks: seen.map((pair) => ({
            kind: "contrast",
            scope: pair.scope,
            foreground: pair.foreground,
            background: pair.background,
            min,
          })),
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
export function adoption(root, { conformanceLevel = null, productType = null, record = [] } = {}) {
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

  const ledgerText = read(root, LEDGER);
  const have = new Set((ledgerText === null ? [] : parseLedger(ledgerText)).map((row) => row.id));
  const theme = JSON.parse(read(root, FILES.theme) ?? "null");
  const result = {
    stylesheet: theme?.stylesheet ?? findStylesheet(root),
    files_read: [],
    contrast: [],
    rows: [],
    failing: [],
    unreadable: [],
    unclaimed: [],
    kept: [],
    person: [],
    in_ledger: have.size,
    files: {},
  };
  const open = (id) => !have.has(id) && !result.rows.some((row) => row.id === id);
  const add = (id, row, how) => result.rows.push({ id, layer: layerOf(id), ...row, how });

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
    const { candidates, failing, unreadable } = valueCandidates(styles, level, open);
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
      for (const variable of tokens.unresolved) {
        result.unreadable.push({ id: TOKENS_DECISION, why: `${variable} points nowhere` });
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
    const columns = columnsPlan(root, { starter: false, code: false });
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
    const patterns = patternsPlan(root, { starter: false });
    for (const [id, item] of Object.entries(patterns.held).filter(([key]) => open(key))) {
      const row = { kind: item.row.kind, source: item.row.source, note: item.row.note };
      candidates[id] = { what: item.what, row, checks: item.checks };
    }
    for (const item of patterns.failing) if (open(item.id)) result.failing.push(item);
    const artifacts = { [TOKENS_DECISION]: tokens, [COMPONENTS_DECISION]: components };
    const gate = gateProblem(root);
    const ids = Object.keys(candidates);
    if (gate && ids.length > 0) {
      result.person.push({
        id: "checks-in-gate",
        why: `${gate}. Until the gate can run this plugin's tool, no check is added for ${ids.join(", ")}`,
      });
    } else if (ids.length > 0) {
      if (open("checks-in-gate")) {
        candidates["checks-in-gate"] = {
          what: "make check runs this tool, in a way that can fail",
          row: { kind: "standard", source: "make check" },
          checks: [{ kind: "gate" }],
        };
      }
      // Each candidate is run by the tool itself on the repository as it is: a check is added only
      // when it passes now and fails on a changed copy.
      const trial = {
        root,
        stylesheet: result.stylesheet,
        ...styles,
        gate: vendored()[FILES.gate],
        displays: columns.displays ?? {},
        files: {
          ...Object.fromEntries(
            Object.values(artifacts)
              .filter((artifact) => artifact.file)
              .map((artifact) => [artifact.file, artifact.content]),
          ),
          ...Object.fromEntries(
            Object.values(candidates)
              .flatMap((candidate) => candidate.checks)
              .flatMap((item) => [item.file, item.types, item.registry])
              .filter((file) => file && existsSync(path.join(root, file)))
              .map((file) => [file, read(root, file)]),
          ),
          ...columns.files,
        },
        folders: Object.fromEntries(
          Object.values(candidates)
            .flatMap((candidate) => candidate.checks)
            .filter((item) => item.folder)
            .map((item) => [item.folder, readFolder(root, item.folder)]),
        ),
        theme: {
          checks: Object.fromEntries(
            Object.entries(candidates).map(([id, candidate]) => [id, candidate.checks]),
          ),
        },
      };
      for (const outcome of runChecks(trial)) {
        if (outcome.held) {
          checks[outcome.id] = candidates[outcome.id].checks;
          add(
            outcome.id,
            { ...candidates[outcome.id].row, check: TOOL, what: candidates[outcome.id].what },
            "held",
          );
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
  if (open("source-color")) {
    const primary = styles ? ownValue(styles, ":root", "--primary") : null;
    if (record.includes("source-color")) {
      if (primary === null) throw new Error("--record source-color: --primary is not declared");
      add("source-color", { kind: "judgment", source: result.stylesheet }, "recorded");
    } else if (primary !== null) {
      result.person.push({
        id: "source-color",
        why: `--primary is ${primary} in ${result.stylesheet}. If that is the decided brand colour, run again with --record source-color`,
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

  if (result.rows.length > 0) {
    // Only the ledger's own keys are written: how a row is held is for the report.
    result.files[LEDGER] = mergeLedger(ledgerText, result.rows);
  }
  const tooled = Object.keys(checks);
  const said =
    (conformanceLevel && conformanceLevel !== recorded) ||
    (productType && productType !== knownType);
  if (tooled.length > 0 || said) {
    const adopted = [
      ...new Set([...(theme?.adopted ?? []), ...tooled.filter((id) => VALUES.includes(id))]),
    ];
    const data = {
      version: 1,
      ...(result.stylesheet ? { stylesheet: result.stylesheet } : {}),
      inputs: {
        ...theme?.inputs,
        ...(level ? { conformanceLevel: level } : {}),
        ...(productType ? { productType } : {}),
      },
      ...(adopted.length > 0 ? { adopted } : {}),
      checks: { ...theme?.checks, ...checks },
    };
    result.files[FILES.theme] = renderJson(data, lineWidth(root));
  }
  if (tooled.length > 0) Object.assign(result.files, vendored());
  return result;
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
  lines.push(`already in the ledger: ${result.in_ledger} decision(s), left as they are`);
  section("contrast ratios today:", result.contrast, (mode) => {
    const pairs = mode.pairs.map((pair) => {
      const value =
        pair.ratio === null ? `cannot be read (${pair.why})` : `${pair.ratio.toFixed(2)}:1`;
      return `${pair.foreground} on ${pair.background} ${value}`;
    });
    return `${mode.name} (${mode.scope}): ${pairs.join("; ")}`;
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
  section("would fail today, so nothing was added:", result.failing, reason);
  section("cannot be read here:", result.unreadable, reason);
  section("a proof is there but the ledger cannot point at it yet:", result.unclaimed, reason);
  section("already kept by the repository, and left as it is:", result.kept, reason);
  section("needs a person:", result.person, reason);
  return lines;
}

const USAGE = `usage: node adopt.mjs --target DIR [--dry-run] [--conformance-level AA|AAA]
                      [--product-type ${PRODUCT_TYPES.join("|")}] [--record ID[,ID]]

  --dry-run            Show what would be added. Nothing is written.
  --conformance-level  The level the product commits to, as a person stated it. Writes that row
                       and lets the contrast of the color roles be checked against it.
  --product-type       What kind of product the screens are for, as a person stated it.
  --record             Write a row for a person's call the script can only see, once the person
                       has confirmed it. Takes: ${RECORDABLE.join(", ")}.

  Adds rows to design/decisions.yaml and, where a value can be checked, this plugin's tool and
  its gate step. Changes no stylesheet, no lint configuration, no test and no existing row.
`;

function main() {
  const args = argv.slice(2);
  if (args.includes("--help") || args.includes("-h")) {
    stdout.write(USAGE);
    exit(0);
  }
  const value = (flag) => (args.includes(flag) ? args[args.indexOf(flag) + 1] : undefined);
  const target = value("--target");
  if (!target || !existsSync(path.resolve(target))) {
    stderr.write(USAGE);
    exit(2);
  }
  const root = path.resolve(target);
  const dryRun = args.includes("--dry-run");
  let result;
  try {
    result = adoption(root, {
      conformanceLevel: value("--conformance-level") ?? null,
      productType: value("--product-type") ?? null,
      record: (value("--record") ?? "").split(",").filter(Boolean),
    });
  } catch (error) {
    stderr.write(`design-assembly: ${error.message}\n`);
    exit(2);
  }
  for (const line of report(result)) stdout.write(`${line}\n`);
  stdout.write("\nfiles:\n");
  const written = writeFiles(root, result.files, dryRun);
  for (const line of written) stdout.write(`  ${line}\n`);
  if (written.length === 0) stdout.write("  nothing to write\n");
  if (dryRun) stdout.write("preview only: nothing was written\n");
  else {
    const changed = written.filter((line) => !line.startsWith("unchanged")).length;
    stdout.write(
      `done: ${result.rows.length} row(s) added to the ledger, ${changed} file(s) written\n`,
    );
  }
}

if (argv[1] && realpathSync(argv[1]) === realpathSync(fileURLToPath(import.meta.url))) main();
