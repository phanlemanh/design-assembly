// Checks the decisions this tool holds, shows every check failing on a changed copy, and validates
// the ledger that points at them.
// Usage: node tools/design-assembly/check.mjs [--rate] [--target DIR]
import { existsSync, readFileSync, realpathSync } from "node:fs";
import path from "node:path";
import { argv, cwd, exit, stderr, stdout } from "node:process";
import { fileURLToPath } from "node:url";

import { contrast } from "./color.mjs";
import { componentsProblem, readFolder } from "./components.mjs";
import {
  LAYER_ALIASES,
  LAYERS,
  LEDGER,
  ledgerProblems,
  oldLayerNames,
  parseLedger,
  pointerProblem,
  TOOL,
} from "./ledger.mjs";
import { toPx, toRatio, TYPE_STEPS } from "./scale.mjs";
import { DEFAULT_STYLESHEET, findStylesheet, loadStyles, resolve } from "./styles.mjs";
import { buildTheme, readBlock, renderBlock, withoutBlock } from "./theme.mjs";
import { tokensProblem } from "./tokens.mjs";

export const FILES = {
  // What this tool needs to check its decisions: the stylesheet it reads, the inputs the decisions
  // were derived from, and one or more checks per decision id. The ledger says that the decisions
  // exist; this file says how this tool proves them.
  theme: "design/theme.json",
  ledger: LEDGER,
  // Where the guide writes its generated block. The checks read the stylesheet the tool data
  // names, which may be another file.
  css: DEFAULT_STYLESHEET,
  gate: "mk/design-assembly.mk",
};

// One entry per kind of check. `run` returns null when the check passes, else what is wrong.
// `change` returns the same state altered so that the check must fail.
const KINDS = {
  generated: {
    run(state) {
      const block = readBlock(state.css);
      if (block === null) return `the generated block is missing from ${state.stylesheet}`;
      const expected = renderBlock(buildTheme(state.theme.inputs, state.css));
      if (block === expected) return null;
      return "the generated block is not what the source color gives: run the guide again instead of editing it";
    },
    change(state) {
      const block = readBlock(state.css) ?? "";
      const edited = block.replace(/(--ring: oklch\()([\d.]+)/, (_, head, lightness) => {
        return `${head}${Number(lightness) > 0.5 ? "0.111" : "0.888"}`;
      });
      return { ...state, css: state.css.replace(block, edited) };
    },
  },
  contrast: {
    run(state, check) {
      const foreground = resolve(state, check.scope, check.foreground);
      const background = resolve(state, check.scope, check.background);
      if (!foreground?.color || !background?.color) {
        return `cannot read ${check.foreground} and ${check.background} in ${check.scope}`;
      }
      const ratio = contrast(foreground.color, background.color);
      if (ratio >= check.min) return null;
      return `${check.foreground} on ${check.background} in ${check.scope} has a contrast ratio of ${ratio.toFixed(2)}:1, below ${check.min}:1`;
    },
    change(state, check) {
      const background = resolve(state, check.scope, check.background);
      const same = `${check.scope} {\n  ${check.foreground}: ${background?.value ?? "oklch(1 0 0)"};\n}\n`;
      return { ...state, css: `${state.css}\n${same}` };
    },
  },
  // The variable resolves to the decided value: nothing later in the stylesheet overrides it.
  value: {
    run(state, check) {
      const found = resolve(state, check.scope, check.variable);
      if (found === null) return `${check.variable} is not declared in ${check.scope}`;
      if (found.value.replace(/\s+/g, " ") === check.expected) return null;
      return `${check.variable} in ${check.scope} is ${found.value}, not the decided ${check.expected}`;
    },
    change(state, check) {
      const other = check.expected === "1px" ? "2px" : "1px";
      return {
        ...state,
        css: `${state.css}\n${check.scope} {\n  ${check.variable}: ${other};\n}\n`,
      };
    },
  },
  // The floor's standard is kept: the stylesheet declares none of these variables itself.
  absent: {
    run(state, check) {
      const own = withoutBlock(state.css);
      const found = check.variables.filter((name) =>
        new RegExp(`(^|[\\s;{])${name.replace(/[-]/g, "\\-")}\\s*:`, "m").test(own),
      );
      if (found.length === 0) return null;
      return `${found.join(", ")} declared in ${state.stylesheet}: the decision keeps the framework's standard, so change the decision instead`;
    },
    change(state, check) {
      return { ...state, css: `${state.css}\n:root {\n  ${check.variables[0]}: 1px;\n}\n` };
    },
  },
  // Every step of the type scale is larger than the one before, and its lines do not overlap.
  scale: {
    run(state) {
      const steps = TYPE_STEPS.map(([step]) => ({
        step,
        size: toPx(resolve(state, ":root", `--text-${step}`)?.value),
        leading: toRatio(resolve(state, ":root", `--text-${step}--line-height`)?.value),
      }));
      const unreadable = steps.find((s) => s.size === null || s.leading === null);
      if (unreadable) return `cannot read --text-${unreadable.step} and its line height`;
      for (let i = 1; i < steps.length; i += 1) {
        if (steps[i].size <= steps[i - 1].size) {
          return `text-${steps[i].step} (${steps[i].size}px) is not larger than text-${steps[i - 1].step} (${steps[i - 1].size}px)`;
        }
      }
      const tight = steps.find((s) => s.leading < 1);
      if (tight) return `text-${tight.step} has a line height below its size, so its lines overlap`;
      return null;
    },
    change(state) {
      const base = resolve(state, ":root", "--text-base")?.value ?? "1rem";
      return { ...state, css: `${state.css}\n:root {\n  --text-lg: ${base};\n}\n` };
    },
  },
  // The design tokens file says what the stylesheet says: it was written from it, not by hand.
  tokens: {
    run(state, check) {
      return tokensProblem(state.files?.[check.file], state, check.file, state.stylesheet);
    },
    // A new theme variable is a new token: the file on disk no longer matches.
    change(state) {
      return { ...state, css: `${state.css}\n@theme inline {\n  --color-changed-copy: #000;\n}\n` };
    },
  },
  // The component manifest says what the source says: the components exported, and their variants.
  components: {
    run(state, check) {
      const files = state.folders?.[check.folder] ?? {};
      return componentsProblem(state.files?.[check.file], files, check.file, check.folder);
    },
    // A new source file is a new component: the file on disk no longer matches.
    change(state, check) {
      const added = `${check.folder}/changed-copy.tsx`;
      const files = {
        ...state.folders?.[check.folder],
        [added]: "export function ChangedCopy() {}\n",
      };
      return { ...state, folders: { ...state.folders, [check.folder]: files } };
    },
  },
  gate: {
    run(state) {
      if (state.gate === null) return `${FILES.gate} is missing, so make check does not run this`;
      if (!/^CHECK_TARGETS \+= .*\bdesign-assembly\b/m.test(state.gate)) {
        return `${FILES.gate} does not add design-assembly to CHECK_TARGETS`;
      }
      if (!/^\t@?node tools\/design-assembly\/check\.mjs$/m.test(state.gate)) {
        return `${FILES.gate} does not run the check, or runs it in a way that cannot fail`;
      }
      return null;
    },
    change(state) {
      return { ...state, gate: (state.gate ?? "").replace(/^\t@?node /m, "\t-@node ") };
    },
  },
};

export function readState(root) {
  const read = (file) => {
    const full = path.join(root, file);
    return existsSync(full) ? readFileSync(full, "utf8") : null;
  };
  const theme = read(FILES.theme);
  const ledger = read(FILES.ledger);
  const data = theme === null ? null : JSON.parse(theme);
  const stylesheet = data?.stylesheet ?? findStylesheet(root) ?? DEFAULT_STYLESHEET;
  // Other files a check names, as they are on disk.
  const checks = Object.values(data?.checks ?? {}).flat();
  const named = checks.filter((check) => check.file).map((check) => [check.file, read(check.file)]);
  // Source folders a check names, file by file.
  const folders = checks
    .filter((check) => check.folder)
    .map((check) => [check.folder, readFolder(root, check.folder)]);
  return {
    root,
    theme: data,
    ledger: ledger === null ? null : parseLedger(ledger),
    stylesheet,
    // `css` is the repository's own text with its relative imports put in place; `base` is the
    // framework's theme, read only when a value points into it.
    ...loadStyles(root, stylesheet),
    files: Object.fromEntries(named),
    folders: Object.fromEntries(folders),
    gate: read(FILES.gate),
  };
}

// For every decision this tool holds: what is wrong, or null, and whether each of its checks was
// seen failing on a changed copy.
export function runChecks(state) {
  return Object.entries(state.theme?.checks ?? {}).map(([id, checks]) => {
    const problems = [];
    let seenFailing = true;
    for (const check of checks) {
      const kind = KINDS[check.kind];
      if (!kind) {
        problems.push(`unknown check ${check.kind}`);
        continue;
      }
      const problem = kind.run(state, check);
      if (problem) problems.push(problem);
      if (kind.run(kind.change(state, check), check) === null) seenFailing = false;
    }
    return {
      id,
      problem: problems.length > 0 ? problems.join("; ") : null,
      seenFailing,
      held: problems.length === 0 && seenFailing,
    };
  });
}

// The ledger and this tool must agree in both directions.
function crossProblems(state, results) {
  const rows = state.ledger ?? [];
  const pointed = rows.filter((row) => row.check === TOOL).map((row) => row.id);
  const held = results.map((r) => r.id);
  return [
    ...pointed
      .filter((id) => !held.includes(id))
      .map((id) => `${id}: the ledger points at this tool, which holds no check for it`),
    ...held
      .filter((id) => !pointed.includes(id))
      .map((id) => `${id}: held by this tool but not a row of ${FILES.ledger} that points at it`),
  ];
}

// Every row of the ledger with how it is held.
export function ledgerView(state) {
  const results = runChecks(state);
  return (state.ledger ?? []).map((row) => {
    const id = String(row.id);
    if (!row.check)
      return { id, kind: row.kind, state: row.kind === "judgment" ? "recorded" : "not held" };
    if (row.check === TOOL) {
      const mine = results.find((r) => r.id === id);
      return { id, kind: row.kind, state: mine?.held ? "held" : "FAILING" };
    }
    const broken = pointerProblem(state.root, id, row.check);
    return { id, kind: row.kind, state: broken ? "FAILING" : "claimed", by: row.check };
  });
}

function main() {
  const args = argv.slice(2);
  const at = args.indexOf("--target");
  const root = at === -1 ? cwd() : path.resolve(args[at + 1] ?? "");
  const state = readState(root);
  if (state.theme === null || state.ledger === null) {
    stderr.write(
      `design-assembly: ${FILES.theme} or ${FILES.ledger} is missing. Run the guide first.\n`,
    );
    exit(1);
  }
  const results = runChecks(state);
  const problems = [
    ...results.flatMap((r) => {
      if (r.problem) return [`${r.id}: ${r.problem}`];
      return r.seenFailing ? [] : [`${r.id}: the check cannot fail, so it proves nothing`];
    }),
    ...crossProblems(state, results),
    ...ledgerProblems(root, state.ledger, [...LAYERS, ...Object.keys(LAYER_ALIASES)]),
  ];
  if (args.includes("--rate")) {
    const view = ledgerView(state);
    const count = (name) => view.filter((row) => row.state === name).length;
    const automatic = count("held") + count("claimed");
    const percent = Math.round((100 * automatic) / view.length);
    stdout.write(`determinism rate: ${automatic}/${view.length} (${percent}%)\n`);
    stdout.write(
      `  ${count("held")} held and re-run here, ${count("claimed")} claimed by another check and not re-run\n`,
    );
    for (const row of view) {
      stdout.write(
        `  ${row.state.padEnd(8)} ${row.kind.padEnd(8)} ${row.id}${row.by ? `  (${row.by})` : ""}\n`,
      );
    }
    for (const line of oldLayerNames(state.ledger))
      stdout.write(`  note: older layer name, ${line}\n`);
  }
  if (problems.length > 0) {
    stderr.write(`design-assembly: ${problems.length} problem(s)\n`);
    for (const line of problems) stderr.write(`  ${line}\n`);
    exit(1);
  }
  const count = results.reduce((sum, r) => sum + state.theme.checks[r.id].length, 0);
  stdout.write(
    `design-assembly: ${results.length} decisions held by ${count} checks, each seen failing on a changed copy\n`,
  );
}

// Runs only when this file is the script. Real paths on both sides: a folder reached through a
// link would otherwise look like an import, and the check would pass without running.
if (argv[1] && realpathSync(argv[1]) === realpathSync(fileURLToPath(import.meta.url))) main();
