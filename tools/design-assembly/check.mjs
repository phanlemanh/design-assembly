// Checks what the guide generated, and shows every check failing on a changed copy.
// Usage: node tools/design-assembly/check.mjs [--rate] [--target DIR]
import { existsSync, readFileSync, realpathSync } from "node:fs";
import path from "node:path";
import { argv, cwd, exit, stderr, stdout } from "node:process";
import { fileURLToPath } from "node:url";

import { contrast, parseColor } from "./color.mjs";
import { toPx, toRatio, TYPE_STEPS } from "./scale.mjs";
import { buildTheme, readBlock, readVariable, renderBlock, withoutBlock } from "./theme.mjs";

export const FILES = {
  decisions: "design/decisions.json",
  css: "src/index.css",
  gate: "mk/design-assembly.mk",
};

// A variable as the cascade resolves it for a selector: its own declaration, else the root one.
function resolve(css, scope, name) {
  const value = readVariable(css, scope, name) ?? readVariable(css, ":root", name);
  return value === null ? null : { value, color: parseColor(value) };
}

// One entry per kind of check. `run` returns null when the check passes, else what is wrong.
// `change` returns the same state altered so that the check must fail.
const KINDS = {
  generated: {
    run(state) {
      const block = readBlock(state.css);
      if (block === null) return "the generated block is missing from src/index.css";
      const expected = renderBlock(buildTheme(state.decisions.inputs, state.css));
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
      const foreground = resolve(state.css, check.scope, check.foreground);
      const background = resolve(state.css, check.scope, check.background);
      if (!foreground?.color || !background?.color) {
        return `cannot read ${check.foreground} and ${check.background} in ${check.scope}`;
      }
      const ratio = contrast(foreground.color, background.color);
      if (ratio >= check.min) return null;
      return `${check.foreground} on ${check.background} in ${check.scope} has a contrast ratio of ${ratio.toFixed(2)}:1, below ${check.min}:1`;
    },
    change(state, check) {
      const background = resolve(state.css, check.scope, check.background);
      const same = `${check.scope} {\n  ${check.foreground}: ${background?.value ?? "oklch(1 0 0)"};\n}\n`;
      return { ...state, css: `${state.css}\n${same}` };
    },
  },
  // The variable resolves to the decided value: nothing later in the stylesheet overrides it.
  value: {
    run(state, check) {
      const found = resolve(state.css, check.scope, check.variable);
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
      return `${found.join(", ")} declared in src/index.css: the decision keeps the floor's standard, so change the decision instead`;
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
        size: toPx(resolve(state.css, ":root", `--text-${step}`)?.value),
        leading: toRatio(resolve(state.css, ":root", `--text-${step}--line-height`)?.value),
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
      const base = resolve(state.css, ":root", "--text-base")?.value ?? "1rem";
      return { ...state, css: `${state.css}\n:root {\n  --text-lg: ${base};\n}\n` };
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
  const decisions = read(FILES.decisions);
  return {
    decisions: decisions === null ? null : JSON.parse(decisions),
    css: read(FILES.css) ?? "",
    gate: read(FILES.gate),
  };
}

// Every decision with what its check says, and whether that check was seen failing.
export function runChecks(state) {
  return state.decisions.decisions.map((decision) => {
    if (!decision.check) return { id: decision.id, kind: decision.kind, checked: false };
    const kind = KINDS[decision.check.kind];
    if (!kind) {
      return { id: decision.id, kind: decision.kind, checked: true, problem: "unknown check" };
    }
    const problem = kind.run(state, decision.check);
    const seenFailing = kind.run(kind.change(state, decision.check), decision.check) !== null;
    return { id: decision.id, kind: decision.kind, checked: true, problem, seenFailing };
  });
}

export function rate(results) {
  const held = results.filter((r) => r.checked && r.problem === null && r.seenFailing).length;
  return { held, total: results.length, percent: Math.round((100 * held) / results.length) };
}

function main() {
  const args = argv.slice(2);
  const at = args.indexOf("--target");
  const root = at === -1 ? cwd() : path.resolve(args[at + 1] ?? "");
  const state = readState(root);
  if (state.decisions === null) {
    stderr.write(`design-assembly: ${FILES.decisions} is missing. Run the guide first.\n`);
    exit(1);
  }
  const results = runChecks(state);
  const problems = results.flatMap((r) => {
    if (!r.checked) return [];
    if (r.problem) return [`${r.id}: ${r.problem}`];
    return r.seenFailing ? [] : [`${r.id}: the check cannot fail, so it proves nothing`];
  });
  if (args.includes("--rate")) {
    const { held, total, percent } = rate(results);
    stdout.write(`determinism rate: ${held}/${total} (${percent}%)\n`);
    for (const r of results) {
      const label = !r.checked ? "no check" : r.problem || !r.seenFailing ? "FAILING" : "held";
      stdout.write(`  ${label.padEnd(8)} ${r.kind.padEnd(11)} ${r.id}\n`);
    }
  }
  if (problems.length > 0) {
    stderr.write(`design-assembly: ${problems.length} problem(s)\n`);
    for (const line of problems) stderr.write(`  ${line}\n`);
    exit(1);
  }
  const count = results.filter((r) => r.checked).length;
  stdout.write(`design-assembly: ${count} checks ok, each seen failing on a changed copy\n`);
}

// Runs only when this file is the script. Real paths on both sides: a folder reached through a
// link would otherwise look like an import, and the check would pass without running.
if (argv[1] && realpathSync(argv[1]) === realpathSync(fileURLToPath(import.meta.url))) main();
