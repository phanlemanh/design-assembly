// Takes in what a repository already has: adds ledger rows for the proofs it finds, and checks
// around the values the stylesheet holds today. It never changes the stylesheet, the lint
// configuration, the tests or a row that is already in the ledger, and it adds a check only when
// that check passes on the repository as it is and was seen failing on a changed copy.
// Usage: node adopt.mjs --target DIR [--dry-run] [--conformance-level AA|AAA] [--record ID[,ID]]
import { existsSync, readFileSync, realpathSync } from "node:fs";
import path from "node:path";
import { argv, exit, stderr, stdout } from "node:process";
import { fileURLToPath } from "node:url";

import { FILES, runChecks } from "../templates/tools/design-assembly/check.mjs";
import { contrast } from "../templates/tools/design-assembly/color.mjs";
import {
  LEDGER,
  mergeLedger,
  parseLedger,
  pointerProblem,
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
import { componentsPlan, gateProblem, tokensPlan, vendored, writeFiles } from "./apply.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const reference = (name) =>
  JSON.parse(readFileSync(path.join(HERE, "../references", name), "utf8"));
const STANDARD = reference("standard-decisions.json").decisions;
const PROOFS = reference("known-proofs.json").proofs;

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
    if (blind.length > 0) {
      unreadable.push({
        id: "color-contrast",
        why: blind.map((pair) => `${label(pair)}: ${pair.why}`).join("; "),
      });
    }
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
          row: { kind: "closed", source: "the stylesheet's type scale, as found" },
          checks: [{ kind: "scale" }],
        }
      : {
          row: { kind: "standard", source: "the framework's type scale" },
          checks: [{ kind: "absent", variables: TYPE_VARIABLES }],
        };
  }

  if (open("spacing-values")) {
    if (!declares(own, "--spacing")) {
      candidates["spacing-values"] = {
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
export function adoption(root, { conformanceLevel = null, record = [] } = {}) {
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
    if (open("color-contrast")) result.contrast = contrastToday(styles);
    const { candidates, failing, unreadable } = valueCandidates(styles, level, open);
    result.failing.push(...failing);
    result.unreadable.push(...unreadable);
    // The design tokens file is new to the repository, so writing it changes nothing it has. One
    // that is already there and says something else is a person's file, and is kept.
    const tokens = open(TOKENS_DECISION)
      ? tokensPlan(root, styles, result.stylesheet, false)
      : { skipped: null };
    if (tokens.skipped) result.unclaimed.push({ id: TOKENS_DECISION, why: tokens.skipped });
    else if (tokens.file) {
      candidates[TOKENS_DECISION] = {
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
      result.unclaimed.push({ id: COMPONENTS_DECISION, why: components.skipped });
    } else if (components.file) {
      candidates[COMPONENTS_DECISION] = {
        row: { kind: components.row.kind, source: components.row.source },
        checks: components.checks,
      };
    }
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
        files: Object.fromEntries(
          Object.values(artifacts)
            .filter((artifact) => artifact.file)
            .map((artifact) => [artifact.file, artifact.content]),
        ),
        folders: components.file
          ? { [components.checks[0].folder]: readFolder(root, components.checks[0].folder) }
          : {},
        theme: {
          checks: Object.fromEntries(
            Object.entries(candidates).map(([id, candidate]) => [id, candidate.checks]),
          ),
        },
      };
      for (const outcome of runChecks(trial)) {
        if (outcome.held) {
          checks[outcome.id] = candidates[outcome.id].checks;
          add(outcome.id, { ...candidates[outcome.id].row, check: TOOL }, "held");
          const artifact = artifacts[outcome.id];
          if (artifact) result.files[artifact.file] = artifact.content;
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

  // Proofs the repository already has. Named, wired in, and not run here.
  const lintConfig = ["eslint.config.js", "eslint.config.mjs", "eslint.config.ts"]
    .map((file) => read(root, file) ?? "")
    .join("\n");
  for (const proof of PROOFS.filter((item) => open(item.id))) {
    const [prefix, ...rest] = proof.check.split(":");
    const text = prefix === "eslint" ? lintConfig : (read(root, rest.join(":")) ?? "");
    const present =
      proof.needs.every((part) => text.includes(part)) &&
      (proof.files ?? []).every((file) => read(root, file) !== null);
    if (!present) continue;
    const problem = pointerProblem(root, proof.id, proof.check);
    if (problem) result.unclaimed.push({ id: proof.id, why: problem });
    else add(proof.id, { kind: proof.kind, source: proof.source, check: proof.check }, "claimed");
  }

  if (result.rows.length > 0) {
    // Only the ledger's own keys are written: how a row is held is for the report.
    result.files[LEDGER] = mergeLedger(ledgerText, result.rows);
  }
  const tooled = Object.keys(checks);
  if (tooled.length > 0 || (conformanceLevel && conformanceLevel !== recorded)) {
    const adopted = [
      ...new Set([...(theme?.adopted ?? []), ...tooled.filter((id) => VALUES.includes(id))]),
    ];
    const data = {
      version: 1,
      ...(result.stylesheet ? { stylesheet: result.stylesheet } : {}),
      inputs: { ...theme?.inputs, ...(level ? { conformanceLevel: level } : {}) },
      ...(adopted.length > 0 ? { adopted } : {}),
      checks: { ...theme?.checks, ...checks },
    };
    result.files[FILES.theme] = `${JSON.stringify(data, null, 2)}\n`;
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
      lines.push(`    ${row.id}${row.check && row.check !== TOOL ? `  (${row.check})` : ""}`);
    }
  }
  section("would fail today, so nothing was added:", result.failing, reason);
  section("cannot be read here:", result.unreadable, reason);
  section("a proof is there but the ledger cannot point at it yet:", result.unclaimed, reason);
  section("needs a person:", result.person, reason);
  return lines;
}

const USAGE = `usage: node adopt.mjs --target DIR [--dry-run] [--conformance-level AA|AAA] [--record ID[,ID]]

  --dry-run            Show what would be added. Nothing is written.
  --conformance-level  The level the product commits to, as a person stated it. Writes that row
                       and lets the contrast of the color roles be checked against it.
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
}

if (argv[1] && realpathSync(argv[1]) === realpathSync(fileURLToPath(import.meta.url))) main();
