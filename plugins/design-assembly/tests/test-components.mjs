// The component manifest: what is read from component source, that the file is held to the source
// in both directions, that a person's own file is never written over, and, when the acceptance kit
// is on this machine, that its plan check accepts the names and variants and rejects wrong ones.
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

import {
  readComponents,
  readFolder,
  targetProblem,
  targetSizes,
} from "../templates/tools/design-assembly/components.mjs";
import { renderJson } from "../templates/tools/design-assembly/json.mjs";
import { parseLedger, TOOL } from "../templates/tools/design-assembly/ledger.mjs";
import { withoutBlock } from "../templates/tools/design-assembly/theme.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const PLUGIN = path.resolve(HERE, "..");
const ROOT = path.resolve(PLUGIN, "../..");
const APPLY = path.join(PLUGIN, "scripts/apply.mjs");
const ADOPT = path.join(PLUGIN, "scripts/adopt.mjs");
const LAYERS = JSON.parse(readFileSync(path.join(PLUGIN, "references/layers.json"), "utf8")).layers;

const made = [];
after(() => made.forEach((dir) => rmSync(dir, { recursive: true, force: true })));

function folder(files) {
  const dir = mkdtempSync(path.join(tmpdir(), "design-assembly-components-"));
  made.push(dir);
  for (const [file, content] of Object.entries(files)) {
    mkdirSync(path.dirname(path.join(dir, file)), { recursive: true });
    writeFileSync(path.join(dir, file), content);
  }
  return dir;
}

function blueprint() {
  const choices = {
    context: { product_type: "application", conformance_level: "AA" },
    patterns: { record_panel: "beside" },
    foundations: { source_color: "#0246ff" },
  };
  const layers = {};
  for (const layer of LAYERS) {
    layers[layer.id] = layer.built
      ? { status: "decided", source: "proposed", choice: choices[layer.id], why: "For the test." }
      : { status: "planned" };
  }
  return JSON.stringify({ version: 1, status: "approved", layers });
}

const own = (file) => readFileSync(path.join(ROOT, file), "utf8");
// The floor with two of its real components: one that declares variant sets, one that types a
// prop as a closed list.
const floor = (extra = {}) =>
  folder({
    "src/index.css": withoutBlock(own("src/index.css")),
    Makefile: own("Makefile"),
    "components.json": own("components.json"),
    "src/components/ui/button.tsx": own("src/components/ui/button.tsx"),
    "src/components/ui/card.tsx": own("src/components/ui/card.tsx"),
    "design/blueprint.json": blueprint(),
    ...extra,
  });

const run = (script, ...args) => spawnSync(execPath, [script, ...args], { encoding: "utf8" });
const check = (dir) => run(path.join(dir, "tools/design-assembly/check.mjs"), "--target", dir);
const components = (dir, ...args) =>
  run(path.join(dir, "tools/design-assembly/components.mjs"), "--target", dir, ...args);
const text = (dir, file) => readFileSync(path.join(dir, file), "utf8");
const edit = (dir, file, change) => {
  const before = text(dir, file);
  const next = change(before);
  assert.notEqual(next, before, `the edit of ${file} changed nothing`);
  writeFileSync(path.join(dir, file), next);
};
const REGISTRY = "design/component-registry.json";

const TOGGLE = `import { cva, type VariantProps } from "class-variance-authority";

const toggleVariants = cva(
  "inline-flex [&_svg:not([class*='size-'])]:size-4 data-[state=on]:bg-accent {not a brace}",
  {
    variants: {
      variant: {
        default: "bg-transparent",
        outline: "border border-input hover:bg-[color-mix(in_oklch,var(--a),var(--b)_5%)]",
      },
      size: { default: "h-8", "icon-xs": "size-6" },
    },
    defaultVariants: { variant: "default", size: "default" },
  },
);

function Toggle({ className, variant, size, ...props }: Props & VariantProps<typeof toggleVariants>) {
  return <button className={toggleVariants({ variant, size, className })} {...props} />;
}

export { Toggle, toggleVariants };
`;
const GROUP = `import { toggleVariants } from "./toggle";

export function ToggleGroup({
  orientation = "horizontal",
  disabled = false,
  ...props
}: Props & { orientation?: "horizontal" | "vertical"; disabled?: boolean }) {
  return <div data-orientation={orientation} {...props} />;
}

export function ToggleGroupItem({ variant, size, ...props }: ItemProps) {
  return <button className={toggleVariants({ variant, size })} {...props} />;
}

function Hidden() {
  return null;
}
`;

test("components and variants are read from source: variant sets, typed props, shared sets", () => {
  const manifest = readComponents({ "ui/toggle.tsx": TOGGLE, "ui/toggle-group.tsx": GROUP });
  const all = ["variant=default", "variant=outline", "size=default", "size=icon-xs"];
  assert.deepEqual(manifest, {
    version: "1",
    components: [
      {
        name: "ToggleGroup",
        category: "component",
        file: "ui/toggle-group.tsx",
        // A prop typed as a closed list of words is a variant axis; a boolean is not.
        variants: ["orientation=horizontal", "orientation=vertical"],
        defaults: { orientation: "horizontal" },
      },
      {
        // A variant set declared in another file belongs to every component that calls it.
        name: "ToggleGroupItem",
        category: "component",
        file: "ui/toggle-group.tsx",
        // It renders a button: a control. Its smallest height is the smallest of the set it calls.
        control: true,
        min_height: "24px",
        variants: all,
        defaults: { variant: "default", size: "default" },
      },
      {
        // Braces and brackets inside class names are text, not structure.
        name: "Toggle",
        category: "component",
        file: "ui/toggle.tsx",
        control: true,
        min_height: "24px",
        variants: all,
        defaults: { variant: "default", size: "default" },
      },
    ],
  });
  // What is not exported, and an exported helper that is not a component, are not components.
  assert.ok(!JSON.stringify(manifest).includes("Hidden"));
  assert.ok(!manifest.components.some((item) => item.name === "toggleVariants"));
});

test("the manifest is laid out as a formatter leaves it, for the width the repository uses", () => {
  const manifest = readComponents({ "ui/toggle.tsx": TOGGLE });
  for (const width of [60, 80, 200]) {
    const out = renderJson(manifest, width);
    assert.deepEqual(JSON.parse(out), manifest);
    for (const line of out.split("\n")) {
      // A line longer than the width is one that cannot be broken: a single word.
      assert.ok(line.length <= width || !line.includes(", "), line);
    }
  }
  assert.match(renderJson(manifest, 200), /"variants": \["variant=default", "variant=outline"/);
  assert.match(renderJson(manifest, 60), /"variants": \[\n\s+"variant=default",/);
});

test("the guide writes the manifest of the components the repository has", () => {
  const dir = floor();
  const applied = run(APPLY, "--target", dir);
  assert.equal(applied.status, 0, applied.stderr);
  assert.match(applied.stdout, /create\s+design\/component-registry\.json/);
  const data = JSON.parse(text(dir, REGISTRY));
  // Only what the acceptance kit's registry allows at the top.
  assert.deepEqual(Object.keys(data), ["version", "components"]);
  assert.equal(typeof data.version, "string");
  const byName = Object.fromEntries(data.components.map((item) => [item.name, item]));
  assert.deepEqual(byName.Button.defaults, { variant: "default", size: "default" });
  assert.ok(byName.Button.variants.includes("variant=outline"));
  assert.ok(byName.Button.variants.includes("size=icon-xs"));
  assert.deepEqual(byName.Card.variants, ["size=default", "size=sm"]);
  assert.equal(byName.CardHeader.file, "src/components/ui/card.tsx");
  assert.equal(byName.CardHeader.variants, undefined);

  const row = parseLedger(text(dir, "design/decisions.yaml")).find(
    (item) => item.id === "component-manifest",
  );
  assert.equal(row.check, TOOL);
  assert.equal(row.layer, "components");
  assert.equal(check(dir).status, 0, check(dir).stderr);
  assert.match(run(APPLY, "--target", dir).stdout, /unchanged design\/component-registry\.json/);
});

test("the manifest is held to the source: a change on either side turns the gate red", () => {
  const dir = floor();
  assert.equal(run(APPLY, "--target", dir).status, 0);
  const stale =
    /component-manifest: design\/component-registry\.json is not what src\/components\/ui gives/;

  // A variant is added in the source and the manifest is not written again.
  edit(dir, "src/components/ui/card.tsx", (source) =>
    source.replace('size?: "default" | "sm"', 'size?: "default" | "sm" | "lg"'),
  );
  const added = check(dir);
  assert.equal(added.status, 1);
  assert.match(added.stderr, stale);
  assert.equal(components(dir).status, 1);

  const written = components(dir, "--write");
  assert.equal(written.status, 0, written.stderr);
  assert.match(written.stdout, /wrote design\/component-registry\.json from src\/components\/ui/);
  assert.match(text(dir, REGISTRY), /"size=lg"/);
  assert.equal(check(dir).status, 0, check(dir).stderr);
  assert.match(components(dir, "--write").stdout, /is up to date/);

  // A component is added.
  writeFileSync(
    path.join(dir, "src/components/ui/chip.tsx"),
    "export function Chip() {\n  return null;\n}\n",
  );
  assert.match(check(dir).stderr, stale);
  assert.equal(components(dir, "--write").status, 0);

  // The manifest is edited by hand: a variant the source does not have.
  edit(dir, REGISTRY, (json) => json.replace('"size=lg"', '"size=huge"'));
  const edited = check(dir);
  assert.equal(edited.status, 1);
  assert.match(
    edited.stderr,
    /component-manifest: .*\(Button differs\): the source is where a component changes/,
  );

  rmSync(path.join(dir, REGISTRY));
  assert.match(
    check(dir).stderr,
    /component-manifest: design\/component-registry\.json is missing/,
  );
});

test("the manifest goes where the acceptance kit is told to read it", () => {
  const dir = floor({
    "_acceptance/config.yaml":
      'design_floor:\n  tokens: "design/tokens.json"\n  registry: "design/ui.registry.json"\n',
  });
  assert.equal(run(APPLY, "--target", dir).status, 0);
  assert.ok(existsSync(path.join(dir, "design/ui.registry.json")));
  assert.ok(!existsSync(path.join(dir, REGISTRY)));
  assert.equal(check(dir).status, 0, check(dir).stderr);
});

test("a registry a person already keeps is never written over", () => {
  const mine = '{ "version": "0.1.0", "components": [{ "name": "Page header/Default" }] }\n';
  for (const script of [APPLY, ADOPT]) {
    const dir = floor({ [REGISTRY]: mine });
    const result = run(script, "--target", dir);
    assert.equal(result.status, 0, result.stderr);
    assert.match(result.stdout, /component-registry\.json is already there and is not what/);
    assert.equal(text(dir, REGISTRY), mine);
    const ids = parseLedger(text(dir, "design/decisions.yaml")).map((row) => row.id);
    assert.ok(!ids.includes("component-manifest"));
    assert.equal(check(dir).status, 0, check(dir).stderr);
  }
});

test("adopting writes the manifest and changes no source; no components means no manifest", () => {
  const dir = floor();
  const before = readFolder(dir, "src/components/ui");
  const adopted = run(ADOPT, "--target", dir);
  assert.equal(adopted.status, 0, adopted.stderr);
  assert.deepEqual(readFolder(dir, "src/components/ui"), before);
  assert.equal(JSON.parse(text(dir, REGISTRY)).components.length, 8);
  assert.equal(check(dir).status, 0, check(dir).stderr);

  const bare = folder({
    "src/index.css": withoutBlock(own("src/index.css")),
    Makefile: own("Makefile"),
  });
  assert.equal(run(ADOPT, "--target", bare).status, 0);
  assert.ok(!existsSync(path.join(bare, REGISTRY)));
  const ids = parseLedger(text(bare, "design/decisions.yaml")).map((row) => row.id);
  assert.ok(!ids.includes("component-manifest"));
});

const control = (name, element, classes) =>
  `export function ${name}(props) {\n  return <${element} className="${classes}" {...props} />;\n}\n`;

test("a library's Root is the control it names, and a pseudo-element around it adds to its height", () => {
  const files = {
    // A checkbox drawn small, with a hit area grown around it: 16px plus 8px above and below.
    "ui/a.tsx": control(
      "Check",
      "CheckboxPrimitive.Root",
      "relative size-4 after:absolute after:-inset-x-3 after:-inset-y-2",
    ),
    // The same checkbox without the grown area is below the target.
    "ui/b.tsx": control("Small", "SwitchPrimitive.Root", "h-4"),
    // An inset that is not on a pseudo-element, or not around it, adds nothing.
    "ui/c.tsx": control("Plain", "button", "h-5 -inset-y-2 after:inset-y-2"),
  };
  const sizes = targetSizes(files, 24);
  assert.deepEqual(sizes.measured, ["Check", "Small", "Plain"]);
  const byName = Object.fromEntries(readComponents(files).components.map((c) => [c.name, c]));
  assert.equal(byName.Check.min_height, "32px");
  assert.deepEqual(sizes.below, [
    "Small (its own classes: h-4, 16px)",
    "Plain (its own classes: h-5, 20px)",
  ]);
});

test("a control's height is read from its own classes, and only from them", () => {
  const files = {
    // A child's size, a pseudo-element's size and a non-control's size are not the control's.
    "ui/a.tsx": control("Search", "input", "h-8 file:h-6 [&_svg]:size-4 *:size-3"),
    // A height under a condition is still a height the control can have.
    "ui/b.tsx": control("Pick", "SelectPrimitive.Trigger", "data-[size=sm]:h-7 md:h-9"),
    "ui/c.tsx": control("Tiny", "button", "min-h-[20px]"),
    "ui/d.tsx": control("Chip", "span", "h-5"),
    // A control with no height of its own is listed, and not measured.
    "ui/e.tsx": control("Row", "MenuPrimitive.Item", "py-1 text-sm"),
  };
  const sizes = targetSizes(files, 24);
  assert.deepEqual(sizes.measured, ["Search", "Pick", "Tiny"]);
  assert.deepEqual(sizes.unmeasured, ["Row"]);
  assert.deepEqual(sizes.below, ["Tiny (its own classes: min-h-[20px], 20px)"]);
  const byName = Object.fromEntries(readComponents(files).components.map((c) => [c.name, c]));
  assert.equal(byName.Search.min_height, "32px");
  assert.equal(byName.Pick.min_height, "28px");
  assert.equal(byName.Chip.control, undefined);
  assert.deepEqual([byName.Row.control, byName.Row.min_height], [true, undefined]);

  assert.match(targetProblem(files, 24, "ui"), /^Tiny \(.*20px\): below the 24px target size$/);
  delete files["ui/c.tsx"];
  assert.equal(targetProblem(files, 24, "ui"), null);
  // Measuring nothing is not passing.
  assert.match(
    targetProblem({ "ui/e.tsx": files["ui/e.tsx"] }, 24, "ui"),
    /no control in ui declares a height this tool can read/,
  );
});

test("the target size of the conformance level is held: a smaller control turns the gate red", () => {
  const dir = floor();
  const applied = run(APPLY, "--target", dir);
  assert.equal(applied.status, 0, applied.stderr);
  assert.match(
    applied.stdout,
    /target size: every control that declares a height is at least 24px high \(smallest: Button \(size=xs: h-6, 24px\)\)/,
  );
  const row = parseLedger(text(dir, "design/decisions.yaml")).find((r) => r.id === "target-size");
  assert.equal(row.check, TOOL);
  assert.match(
    row.note,
    /its width, and controls that take their size from elsewhere, are not measured/,
  );
  assert.equal(JSON.parse(text(dir, REGISTRY)).components[0].min_height, "24px");
  assert.equal(check(dir).status, 0, check(dir).stderr);

  edit(dir, "src/components/ui/button.tsx", (source) => source.replace('xs: "h-6 ', 'xs: "h-5 '));
  const small = check(dir);
  assert.equal(small.status, 1);
  assert.match(
    small.stderr,
    /target-size: Button \(size=xs: h-5, 20px\): below the 24px target size/,
  );
});

test("controls below the level's target size get no check, and the person is told which", () => {
  const strict = JSON.parse(blueprint());
  strict.layers.context.choice.conformance_level = "AAA";
  const dir = floor({ "design/blueprint.json": JSON.stringify(strict) });
  const applied = run(APPLY, "--target", dir);
  assert.equal(applied.status, 0, applied.stderr);
  assert.match(
    applied.stdout,
    /note: target size: Button \(size=xs: h-6, 24px\) are below the 44px/,
  );
  const ids = parseLedger(text(dir, "design/decisions.yaml")).map((r) => r.id);
  assert.ok(!ids.includes("target-size"));
  assert.equal(check(dir).status, 0, check(dir).stderr);

  // Adopting: nothing without a stated level, a held row at AA, a plain refusal at AAA.
  const bare = floor();
  assert.equal(run(ADOPT, "--target", bare).status, 0);
  assert.ok(!parseLedger(text(bare, "design/decisions.yaml")).some((r) => r.id === "target-size"));
  const level = run(ADOPT, "--target", bare, "--conformance-level", "AA");
  assert.match(level.stdout, /target-size: every control that declares a height is at least 24px/);
  assert.equal(check(bare).status, 0, check(bare).stderr);
  const high = run(ADOPT, "--target", floor(), "--conformance-level", "AAA");
  assert.match(
    high.stdout,
    /would fail today, so nothing was added:\n(.*\n)*\s+target-size: Button .*below the 44px target size/,
  );
});

// The acceptance kit's own plan check, when the kit is on this machine: a plan may only name
// registered components, variants the component has, and tokens that exist.
const KIT = path.resolve(ROOT, env.DESIGN_ASSEMBLY_KIT ?? "", "design-floor/dist/ui.mjs");
const noKit = !env.DESIGN_ASSEMBLY_KIT || !existsSync(KIT);

test(
  "the acceptance kit's plan check takes the manifest: right names pass, wrong ones are caught",
  { skip: noKit && "set DESIGN_ASSEMBLY_KIT to a checkout of the acceptance kit" },
  () => {
    const dir = floor();
    assert.equal(run(APPLY, "--target", dir).status, 0);
    const plan = (rows) =>
      `## Screen: Home\nPattern: none — single screen\n\n| Slot | Rung | Use | Reason |\n|---|---|---|---|\n${rows.join("\n")}\n`;
    const grade = (name, rows) => {
      writeFileSync(path.join(dir, name), plan(rows));
      return run(
        KIT,
        "reuse-plan",
        "check",
        path.join(dir, name),
        "--file",
        path.join(dir, REGISTRY),
        "--tokens",
        path.join(dir, "design/tokens.json"),
        "--json",
      );
    };

    const good = grade("good.md", [
      "| panel | 3 | Card | — |",
      "| action | 4 | Button (variant=outline, size=sm) | — |",
      "| tint | 6 | color.primary | — |",
    ]);
    assert.equal(good.status, 0, good.stdout + good.stderr);

    const variant = grade("variant.md", ["| action | 4 | Button (variant=loud) | — |"]);
    assert.equal(variant.status, 2);
    assert.match(variant.stdout, /BAD_VARIANT_VALUE/);

    const name = grade("name.md", ["| action | 3 | Buton | — |"]);
    assert.equal(name.status, 2);
    assert.match(name.stdout, /UNKNOWN_COMPONENT/);

    const token = grade("token.md", ["| tint | 6 | color.sunset | — |"]);
    assert.equal(token.status, 2);
  },
);

test("a repository this tool keeps no manifest for can run the command, and its gate stays green", () => {
  const dir = folder({
    "src/index.css": withoutBlock(own("src/index.css")),
    Makefile: own("Makefile"),
    "design/blueprint.json": blueprint(),
  });
  assert.equal(run(APPLY, "--target", dir).status, 0);
  const said = components(dir);
  // Nothing to manage is not a failure: the rules page of such a repository may still name the
  // command, and a red exit would turn a routine step into a broken gate.
  assert.equal(said.status, 0, said.stderr);
  assert.match(said.stdout, /manages no component manifest here/);
});

test("no tool installed into a repository declares a name the host's lint may forbid", () => {
  // Next.js forbids assigning to a variable named `module`; these files live in the host and are
  // linted with its rules, so a name like that turns the host's lint red.
  const tools = path.join(PLUGIN, "templates/tools/design-assembly");
  const found = readdirSync(tools)
    .filter((name) => name.endsWith(".mjs"))
    .filter((name) =>
      /\b(const|let|var)\s+module\b/.test(readFileSync(path.join(tools, name), "utf8")),
    );
  assert.deepEqual(found, []);
});
