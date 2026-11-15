// The contract: every ledger has one shape. Each rule of a shape is seen failing; the ledgers of
// this repository hold; the page of the contract names every ledger and key the data names; the
// gate turns red on a changed copy; a newer shape is never written over. When the reference
// repository and the acceptance kit are on this machine, their files and readers are tried too.
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { env, execPath } from "node:process";
import { after, test } from "node:test";
import { fileURLToPath } from "node:url";

import { readState, runChecks } from "../templates/tools/design-assembly/check.mjs";
import {
  LEDGERS,
  newerProblem,
  shapeProblems,
  UNSETTLED,
} from "../templates/tools/design-assembly/contract.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const PLUGIN = path.resolve(HERE, "..");
const ROOT = path.resolve(PLUGIN, "../..");
const APPLY = path.join(PLUGIN, "scripts/apply.mjs");

const made = [];
after(() => made.forEach((dir) => rmSync(dir, { recursive: true, force: true })));

function folder(files) {
  const dir = mkdtempSync(path.join(tmpdir(), "design-assembly-contract-"));
  made.push(dir);
  for (const [file, content] of Object.entries(files)) {
    mkdirSync(path.dirname(path.join(dir, file)), { recursive: true });
    writeFileSync(path.join(dir, file), content);
  }
  return dir;
}

const run = (script, ...args) => spawnSync(execPath, [script, ...args], { encoding: "utf8" });
const json = (data) => JSON.stringify(data);

// The files of each ledger a repository has, by kind.
function ledgerFiles(root) {
  const found = [];
  for (const [kind, ledger] of Object.entries(LEDGERS)) {
    if (ledger.folder) {
      const full = path.join(root, ledger.folder);
      if (!existsSync(full)) continue;
      for (const name of readdirSync(full).sort()) {
        if (name.endsWith(".md") && !["README.md", "lech-lot.md"].includes(name)) {
          found.push([kind, `${ledger.folder}/${name}`]);
        }
      }
    } else if (existsSync(path.join(root, ledger.file))) {
      found.push([kind, ledger.file]);
    }
  }
  return found;
}

const COMPONENT = { name: "Button", category: "component", file: "src/components/ui/button.tsx" };

test("each rule of a shape has a failing example and a passing one", () => {
  const registry = (data) => shapeProblems("components", json(data));
  assert.deepEqual(registry({ version: "2", components: [COMPONENT] }), []);
  // An older shape still reads.
  assert.deepEqual(registry({ version: "1", components: [COMPONENT] }), []);
  // A required key, a type, a closed list of values, a written form, a key outside the shape.
  assert.match(registry({ components: [COMPONENT] })[0], /\.version is missing/);
  assert.match(registry({ version: 2, components: [COMPONENT] })[0], /version is number/);
  assert.match(
    registry({ version: "2", components: [{ ...COMPONENT, level: "page" }] })[0],
    /level is "page", not one of atom/,
  );
  assert.match(
    registry({ version: "2", components: [{ ...COMPONENT, variants: ["outline"] }] })[0],
    /variants\[0\] is "outline", which is not written as the contract says/,
  );
  assert.match(
    registry({ version: "2", components: [COMPONENT], extra: true })[0],
    /\.extra is not in the contract/,
  );
  assert.match(registry([])[0], /is array, the contract says object/);
  assert.match(shapeProblems("components", "{")[0], /is not valid JSON/);

  // A colour token is hexadecimal; a token needs a known type; groups nest.
  const tokens = (data) => shapeProblems("tokens", json(data));
  assert.deepEqual(
    tokens({ color: { brand: { primary: { $type: "color", $value: "#0246ffcc" } } } }),
    [],
  );
  assert.match(
    tokens({ color: { primary: { $type: "color", $value: "oklch(0.5 0.2 260)" } } })[0],
    /not a hexadecimal colour/,
  );
  assert.match(
    tokens({ radius: { lg: { $type: "size", $value: "1rem" } } })[0],
    /not a token type the readers know/,
  );

  // The decisions ledger, read as the block-style file it is.
  const ledger = (rows) => shapeProblems("decisions", `version: 1\ndecisions:\n${rows}`);
  assert.deepEqual(ledger("  - id: a\n    layer: b\n    kind: closed\n    source: c\n"), []);
  assert.match(
    ledger("  - id: a\n    layer: b\n    kind: guess\n    source: c\n")[0],
    /kind is "guess"/,
  );
  assert.match(ledger("  - id: a\n    layer: b\n    kind: closed\n")[0], /source is missing/);

  // A page of a screen kind: the acceptance kit's eight keys, and no key it does not read.
  const page = readFileSync(path.join(ROOT, "design/patterns/danh-sach.md"), "utf8");
  assert.deepEqual(shapeProblems("screen-kinds", page, "page.md"), []);
  assert.match(
    shapeProblems("screen-kinds", page.replace(/^nhan_dien:/m, "nhan_dang:"), "page.md")[0],
    /nhan_dien is missing/,
  );
  assert.match(shapeProblems("screen-kinds", "no front matter", "page.md")[0], /no front matter/);
});

test("a ledger of a newer shape is named, and no tool of this plugin writes over it", () => {
  assert.equal(newerProblem("components", { version: "2" }), null);
  assert.match(
    newerProblem("components", { version: "3" }),
    /has shape 3 and this tool knows shape 2: update the design-assembly plugin/,
  );
  // The guide refuses to run, and changes nothing.
  const dir = folder({
    "design/blueprint.json": json({ version: 1, status: "approved", layers: {} }),
    "design/component-registry.json": json({ version: "9", components: [] }),
  });
  const applied = run(APPLY, "--target", dir);
  assert.equal(applied.status, 2, applied.stdout);
  assert.match(applied.stderr, /has shape 9 and this tool knows shape 2/);
  assert.equal(
    readFileSync(path.join(dir, "design/component-registry.json"), "utf8"),
    json({ version: "9", components: [] }),
  );
});

test("every ledger of this repository has its shape, and the gate holds it on a changed copy", () => {
  const found = ledgerFiles(ROOT);
  assert.ok(found.length >= 10, found.map(([, file]) => file).join(", "));
  for (const [kind, file] of found) {
    const text = readFileSync(path.join(ROOT, file), "utf8");
    assert.deepEqual(shapeProblems(kind, text, file), [], file);
  }
  const state = readState(ROOT);
  const shapes = runChecks(state).find((result) => result.id === "ledger-shapes");
  assert.ok(shapes, "this repository's gate holds ledger-shapes");
  assert.equal(shapes.problem, null);
  assert.equal(shapes.seenFailing, true);
});

test("the page of the contract names every ledger and every key the shapes name", () => {
  const page = readFileSync(path.join(PLUGIN, "references/contract.md"), "utf8");
  for (const [kind, ledger] of Object.entries(LEDGERS)) {
    assert.ok(page.includes(`\`${kind}\``), kind);
    if (ledger.file) assert.ok(page.includes(ledger.file), ledger.file);
    const keys = [
      ...Object.keys(ledger.root ?? {}),
      ...Object.keys(ledger.head ?? {}),
      ...Object.values(ledger.root ?? {}).flatMap((spec) => Object.keys(spec.items?.fields ?? {})),
    ];
    for (const key of keys) assert.ok(page.includes(`\`${key}\``), `${kind}.${key}`);
    if (ledger.version)
      assert.match(page, new RegExp(`\\| \`${kind}\`[^\\n]*\\| ${ledger.version} +\\|`));
  }
  for (const kind of Object.keys(UNSETTLED)) assert.ok(page.includes(`\`${kind}\``), kind);
});

// A repository on this machine that keeps ledgers of its own, built by hand before this plugin.
const REFERENCE = env.DESIGN_ASSEMBLY_REFERENCE_LEDGER
  ? path.resolve(ROOT, env.DESIGN_ASSEMBLY_REFERENCE_LEDGER)
  : null;
const noReference = !REFERENCE || !existsSync(path.join(REFERENCE, "design/decisions.yaml"));

test(
  "the reference repository's ledgers all have the one shape",
  { skip: noReference && "set DESIGN_ASSEMBLY_REFERENCE_LEDGER to a repository with a ledger" },
  () => {
    const found = Object.fromEntries(
      ledgerFiles(REFERENCE).map(([kind, file]) => [
        file,
        shapeProblems(kind, readFileSync(path.join(REFERENCE, file), "utf8"), file),
      ]),
    );
    // Since it adopted this plugin, its component register and its ledger of screens have the one
    // shape too, as its decisions ledger and its pages of screen kinds had already.
    for (const file of [
      "design/decisions.yaml",
      "design/component-registry.json",
      "design/screens.yaml",
    ]) {
      assert.ok(file in found, file);
    }
    assert.ok(Object.keys(found).some((file) => file.startsWith("design/patterns/")));
    for (const [file, problems] of Object.entries(found)) assert.deepEqual(problems, [], file);
  },
);

// A checkout of the acceptance kit on this machine.
const KIT = path.resolve(ROOT, env.DESIGN_ASSEMBLY_KIT ?? "", "design-floor/dist/ui.mjs");
const noKit = !env.DESIGN_ASSEMBLY_KIT || !existsSync(KIT);

test(
  "the acceptance kit reads this repository's component register and token file",
  { skip: noKit && "set DESIGN_ASSEMBLY_KIT to a checkout of the acceptance kit" },
  () => {
    const dir = folder({
      "plan.md": "# Reuse plan\n\n## Screen: Items\n\nPattern: none — a test\n\n- Button\n",
      "page.html":
        "<!doctype html><html><head><style>.a{color:var(--color-primary)}</style></head><body><main><h1>x</h1></main></body></html>\n",
    });
    const registry = path.join(ROOT, "design/component-registry.json");
    const tokens = path.join(ROOT, "design/tokens.json");
    const plan = run(
      KIT,
      "reuse-plan",
      "check",
      path.join(dir, "plan.md"),
      "--file",
      registry,
      "--tokens",
      tokens,
      "--json",
    );
    const read = JSON.parse(plan.stdout);
    assert.equal(read.ok, true, plan.stdout);
    assert.equal(
      read.data.registrySize,
      JSON.parse(readFileSync(registry, "utf8")).components.length,
    );
    const gate = run(KIT, "gate", path.join(dir, "page.html"), "--tokens", tokens, "--json");
    assert.equal(JSON.parse(gate.stdout).ok, true, gate.stdout);
  },
);

const ADOPT = path.join(PLUGIN, "scripts/adopt.mjs");
const AUDIT = path.join(PLUGIN, "scripts/inventory.mjs");
const own = (file) => readFileSync(path.join(ROOT, file), "utf8");

// A repository with values of its own and no ledger yet, as adopting meets one.
const existing = (extra = {}) =>
  folder({
    "src/index.css": own("src/index.css"),
    Makefile: own("Makefile"),
    "components.json": own("components.json"),
    "src/components/ui/button.tsx": own("src/components/ui/button.tsx"),
    ...extra,
  });

test("the audit counts the ledgers that have their shape, and names how the others differ", () => {
  const here = run(AUDIT, "--target", ROOT);
  assert.match(here.stdout, /^contract: (\d+) of \1 ledger file\(s\) have the one shape/m);
  const dir = existing({
    "design/screens.yaml":
      "screens:\n  - id: a\n    route: /\n    title: null\n    family: null\n    status: built\n",
  });
  const there = run(AUDIT, "--target", dir);
  assert.match(there.stdout, /^contract: 0 of 1 ledger file\(s\) have the one shape/m);
  assert.match(there.stdout, /design\/screens\.yaml differs: \.version is missing/);
});

test("adopting holds the shapes of the ledgers it leaves, and says why when one differs", () => {
  const dir = existing();
  const adopted = run(ADOPT, "--target", dir);
  assert.equal(adopted.status, 1, adopted.stderr);
  assert.match(adopted.stdout, /ledger-shapes: \d+ ledger\(s\) have the one shape/);
  const gate = run(path.join(dir, "tools/design-assembly/check.mjs"), "--target", dir);
  assert.equal(gate.status, 0, gate.stderr);
  const state = readState(dir);
  assert.ok(runChecks(state).find((result) => result.id === "ledger-shapes")?.held);
  // A ledger added after adopting is held too: one that leaves its shape turns the gate red, and
  // the gate says which file and how.
  writeFileSync(path.join(dir, "design/screens.yaml"), "version: 1\nscreens:\n  - id: a\n");
  const later = run(path.join(dir, "tools/design-assembly/check.mjs"), "--target", dir);
  assert.equal(later.status, 1);
  assert.match(
    later.stderr,
    /ledger-shapes: design\/screens\.yaml\.screens\[0\]\.route is missing/,
  );

  // A repository whose ledger differs today gets no row, and the difference is said.
  const other = existing({ "design/screens.yaml": "screens:\n  - id: a\n    route: /\n" });
  const refused = run(ADOPT, "--target", other);
  assert.equal(refused.status, 1, refused.stderr);
  assert.match(refused.stdout, /ledger-shapes: design\/screens\.yaml: \.version is missing/);
  assert.ok(
    !/^\s+- id: ledger-shapes$/m.test(
      readFileSync(path.join(other, "design/decisions.yaml"), "utf8"),
    ),
  );
});
