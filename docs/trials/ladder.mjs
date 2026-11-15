// The four-rung ladder of stage three, measured on a throwaway copy of the reference repository.
// Never writes to the reference repository: it is cloned into a temporary folder, the steps run
// on the clone, and the clone is removed unless --keep is given.
// Usage: node docs/trials/ladder.mjs --reference DIR [--kit DIR] [--keep]
// The three answers of step two are assumptions made to measure, not the owner's words.
import { spawnSync } from "node:child_process";
import {
  appendFileSync,
  cpSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  symlinkSync,
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
// The copy reads the packages of the reference repository through a link: its lint is one of
// them, and the plugin re-runs it. Nothing here writes to them. The link is kept out of the copy's
// index, so the kit reads the same files as before.
if (existsSync(path.join(reference, "node_modules"))) {
  symlinkSync(path.join(reference, "node_modules"), path.join(copy, "node_modules"));
  appendFileSync(path.join(copy, ".git/info/exclude"), "\nnode_modules\n");
} else {
  // Without them, the framework's theme is the one file the stylesheet reader needs.
  const theme = "node_modules/tailwindcss/theme.css";
  if (existsSync(path.join(reference, theme))) {
    mkdirSync(path.dirname(path.join(copy, theme)), { recursive: true });
    cpSync(path.join(reference, theme), path.join(copy, theme));
  }
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

// After step three, the register this plugin wrote against the one the repository's own tool
// wrote, by component name. The repository's tool keeps one entry per file, with its parts.
function compareRegisters() {
  const file = "design/component-registry.json";
  const theirs = JSON.parse(readFileSync(path.join(reference, file), "utf8")).components ?? [];
  const mine = JSON.parse(readFileSync(path.join(copy, file), "utf8")).components ?? [];
  const parts = new Map();
  for (const family of theirs) {
    for (const part of family.parts ?? []) parts.set(part.name, { ...part, level: family.level });
  }
  const byName = new Map(mine.map((item) => [item.name, item]));
  const same = { level: 0, props: 0, variants: 0, both: 0 };
  const differ = { props: [], variants: [] };
  const notComponents = [];
  for (const [name, part] of parts) {
    const item = byName.get(name);
    if (!item) {
      notComponents.push(name);
      continue;
    }
    same.both += 1;
    if (part.level === item.level) same.level += 1;
    if (JSON.stringify(part.props ?? []) === JSON.stringify(item.props ?? [])) same.props += 1;
    else differ.props.push(name);
    const axes = Object.entries(part.variants ?? {}).flatMap(([axis, values]) =>
      values.map((value) => `${axis}=${value}`),
    );
    if (JSON.stringify(axes.sort()) === JSON.stringify([...(item.variants ?? [])].sort())) {
      same.variants += 1;
    } else differ.variants.push(name);
  }
  const templates = (list) =>
    new Set(list.filter((item) => item.level === "template").map((item) => item.file)).size;
  const own = new Set(
    mine.filter((item) => item.source === "own").map((item) => path.posix.dirname(item.file)),
  );
  return [
    "",
    `register, this plugin's against the repository's own tool, by name (${same.both} in both):`,
    `  level the same\t${same.level} of ${same.both}`,
    `  props the same\t${same.props} of ${same.both}${differ.props.length ? `; differ: ${differ.props.join(", ")}` : ""}`,
    `  variants the same\t${same.variants} of ${same.both}${differ.variants.length ? `; differ: ${differ.variants.join(", ")}` : ""}`,
    `  template files\t${templates(mine)} here, ${templates(theirs)} there`,
    `  only in the repository's tool\t${notComponents.length}: names it lists that are not exported components here`,
    `  the repository's own, by folder\t${[...own].sort().join(", ")}`,
  ];
}

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
  for (const line of compareRegisters()) stdout.write(`${line}\n`);
} finally {
  if (argv.includes("--keep")) stdout.write(`\nthe copy is kept at ${copy}\n`);
  else {
    // The link goes first, alone, so that removing the copy never reaches the packages it links to.
    rmSync(path.join(copy, "node_modules"), { force: true });
    rmSync(copy, { recursive: true, force: true });
  }
}
// The reference repository must be as it was.
stdout.write(
  `\nreference repository changed: ${git(reference, "status", "--short").stdout.trim() ? "YES" : "no"}\n`,
);
