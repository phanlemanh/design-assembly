// The four-rung ladder of stage three, measured on a throwaway copy of the reference repository.
// Never writes to the reference repository: it is cloned into a temporary folder, the steps run
// on the clone, and the clone is removed unless --keep is given.
// Usage: node docs/trials/ladder.mjs --reference DIR [--kit DIR] [--keep]
// The three answers of step two are assumptions made to measure, not the owner's words.
import { spawnSync } from "node:child_process";
import {
  cpSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { argv, execPath, exit, stdout } from "node:process";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const PLUGIN = path.join(ROOT, "plugins/design-assembly/scripts");
const arg = (name) => (argv.includes(name) ? argv[argv.indexOf(name) + 1] : null);
const reference = arg("--reference") ? path.resolve(arg("--reference")) : null;
const kit = arg("--kit") ? path.resolve(arg("--kit")) : null;
if (!reference || !existsSync(path.join(reference, ".git"))) {
  stdout.write("ladder: give --reference a repository on this machine\n");
  exit(2);
}

const node = (script, ...args) => spawnSync(execPath, [script, ...args], { encoding: "utf8" });
const git = (cwd, ...args) => spawnSync("git", ["-C", cwd, ...args], { encoding: "utf8" });

const copy = mkdtempSync(path.join(tmpdir(), "design-assembly-ladder-"));
if (spawnSync("git", ["clone", "-q", reference, copy]).status !== 0) exit(1);
// The framework's theme is the one file of its packages the stylesheet reader needs.
const theme = "node_modules/tailwindcss/theme.css";
if (existsSync(path.join(reference, theme))) {
  mkdirSync(path.dirname(path.join(copy, theme)), { recursive: true });
  cpSync(path.join(reference, theme), path.join(copy, theme));
}

function measure() {
  const audit = JSON.parse(
    node(path.join(PLUGIN, "inventory.mjs"), "--target", copy, "--json").stdout,
  );
  const shaped = audit.contract.filter((item) => item.differs.length === 0).length;
  let tier = "kit not given";
  if (kit) {
    git(copy, "add", "-A");
    const read = node(path.join(kit, "scripts/design-floor-bac.mjs"), "--root", copy, "--json");
    tier = read.status === 0 ? (JSON.parse(read.stdout).bac ?? "?") : "not read";
  }
  return {
    shapes: `${shaped} of ${audit.contract.length}`,
    answered: `${audit.coverage.answered} of ${audit.coverage.core}`,
    core: audit.coverage.held,
    held: audit.coverage.held + audit.beyond_core.held,
    tier,
  };
}

const adopt = (...flags) => {
  const run = node(path.join(PLUGIN, "adopt.mjs"), "--target", copy, ...flags);
  if (run.status !== 0) throw new Error(`adopt failed: ${run.stderr.split("\n")[0]}`);
};
const edit = (file, change) => {
  const full = path.join(copy, file);
  if (existsSync(full)) writeFileSync(full, change(readFileSync(full, "utf8")));
};

const steps = [["start", () => {}]];
steps.push(["1. adopt, no answers", () => adopt()]);
steps.push([
  "2. three assumed answers, version on the screens",
  () => {
    adopt("--conformance-level", "AA", "--product-type", "application", "--record", "source-color");
    edit("design/screens.yaml", (text) =>
      /^version:/m.test(text) ? text : text.replace(/^(?=families:|screens:)/m, "version: 1\n"),
    );
  },
]);
steps.push([
  "3. the plugin writes the register, both declared to the kit",
  () => {
    rmSync(path.join(copy, "design/component-registry.json"), { force: true });
    adopt();
    adopt();
    edit("_acceptance/config.yaml", (text) =>
      /^\s+tokens:/m.test(text)
        ? text
        : text.replace(
            /^design_floor:\n/m,
            "design_floor:\n  tokens: design/tokens.json\n  registry: design/component-registry.json\n",
          ),
    );
  },
]);

const head = git(reference, "log", "-1", "--format=%h %ad", "--date=short").stdout.trim();
stdout.write(`ladder on a copy of ${path.basename(reference)} at ${head}\n\n`);
stdout.write("step\tledgers in shape\tcore answered\tcore held\theld in all\tkit tier\n");
try {
  for (const [name, run] of steps) {
    run();
    const now = measure();
    stdout.write(
      `${name}\t${now.shapes}\t${now.answered}\t${now.core}\t${now.held}\t${now.tier}\n`,
    );
  }
} finally {
  if (argv.includes("--keep")) stdout.write(`\nthe copy is kept at ${copy}\n`);
  else rmSync(copy, { recursive: true, force: true });
}
// The reference repository must be as it was.
stdout.write(
  `\nreference repository changed: ${git(reference, "status", "--short").stdout.trim() ? "YES" : "no"}\n`,
);
