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

import { gitFacts } from "../templates/tools/design-assembly/check.mjs";
import {
  libraryFolders,
  outOfGitChecks,
  readComponents,
  readFolder,
  targetProblem,
  targetSizes,
} from "../templates/tools/design-assembly/components.mjs";
import { shapeProblems } from "../templates/tools/design-assembly/contract.mjs";
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
const floorFiles = (extra = {}) => ({
  "src/index.css": withoutBlock(own("src/index.css")),
  Makefile: own("Makefile"),
  "components.json": own("components.json"),
  "src/components/ui/button.tsx": own("src/components/ui/button.tsx"),
  "src/components/ui/card.tsx": own("src/components/ui/card.tsx"),
  "design/blueprint.json": blueprint(),
  ...extra,
});
const floor = (extra = {}) => folder(floorFiles(extra));

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
    version: "2",
    components: [
      {
        name: "ToggleGroup",
        category: "component",
        file: "ui/toggle-group.tsx",
        // It imports another component's file: one step up from an atom.
        level: "molecule",
        source: "library",
        // A prop typed as a closed list of words is a variant axis and still a prop; a boolean is
        // only a prop.
        props: ["orientation", "disabled"],
        variants: ["orientation=horizontal", "orientation=vertical"],
        defaults: { orientation: "horizontal" },
      },
      {
        // A variant set declared in another file belongs to a component that calls it and takes
        // its axes as props.
        name: "ToggleGroupItem",
        category: "component",
        file: "ui/toggle-group.tsx",
        level: "molecule",
        source: "library",
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
        level: "atom",
        source: "library",
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
  // The manifest reads the library's folder and the repository's own components beside it.
  const stale =
    /component-manifest: design\/component-registry\.json is not what src\/components gives/;

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
  assert.match(written.stdout, /wrote design\/component-registry\.json from src\/components/);
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
  // The guide ends with 0; adopting ends with 1, with a person's calls still open on the floor.
  for (const [script, ends] of [
    [APPLY, 0],
    [ADOPT, 1],
  ]) {
    const dir = floor({ [REGISTRY]: mine });
    const result = run(script, "--target", dir);
    assert.equal(result.status, ends, result.stderr);
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
  assert.equal(adopted.status, 1, adopted.stderr);
  assert.deepEqual(readFolder(dir, "src/components/ui"), before);
  assert.equal(JSON.parse(text(dir, REGISTRY)).components.length, 8);
  assert.equal(check(dir).status, 0, check(dir).stderr);

  const bare = folder({
    "src/index.css": withoutBlock(own("src/index.css")),
    Makefile: own("Makefile"),
  });
  assert.equal(run(ADOPT, "--target", bare).status, 1);
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
  assert.equal(run(ADOPT, "--target", bare).status, 1);
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

test("each component says its level, where it comes from, and what of its file it is drawn with", () => {
  const files = {
    "src/components/ui/button.tsx":
      'export function Button() {\n  return <button className="h-9" />;\n}\n',
    "src/components/ui/dialog.tsx": [
      'import { Button } from "@/components/ui/button";',
      "export function DialogOverlay() {\n  return <div />;\n}",
      "export function DialogContent() {\n  return <DialogOverlay><Button /></DialogOverlay>;\n}",
      "",
    ].join("\n"),
    "src/components/ui/typed-table.tsx": "export function TypedTable() {\n  return <table />;\n}\n",
    "src/components/item-list.tsx": [
      'import { DialogContent } from "./ui/dialog";',
      'export const ITEM_LIST_WORDS = { title: "x" };',
      "export function ItemList() {\n  return <DialogContent />;\n}",
      "",
    ].join("\n"),
  };
  const pages = { "design/patterns/list.md": "---\nkhuon:\n  ten: TypedTable\n---\n" };
  const byName = Object.fromEntries(
    readComponents(files, { library: "src/components/ui", pages }).components.map((item) => [
      item.name,
      item,
    ]),
  );
  // Levels come from how deep a file imports other components; a screen kind's frame is a
  // template.
  assert.equal(byName.Button.level, "atom");
  assert.equal(byName.DialogContent.level, "molecule");
  assert.equal(byName.ItemList.level, "organism");
  assert.equal(byName.TypedTable.level, "template");
  // The library's components and the repository's own.
  assert.equal(byName.Button.source, "library");
  assert.equal(byName.ItemList.source, "own");
  // The parts are the other components of the same file it draws.
  assert.deepEqual(byName.DialogContent.parts, ["DialogOverlay"]);
  assert.equal(byName.DialogOverlay.parts, undefined);
  // A constant in capitals is not a component.
  assert.equal(byName.ITEM_LIST_WORDS, undefined);
  for (const item of Object.values(byName)) {
    assert.deepEqual(
      shapeProblems("components", JSON.stringify({ version: "2", components: [item] })),
      [],
    );
  }
});

test("each component lists the props it takes, as its signature names them", () => {
  const files = {
    "src/components/ui/button.tsx": [
      'const buttonVariants = cva("h-9", { variants: { size: { sm: "h-8", lg: "h-10" } } });',
      "export function Button({ className, size, asLink = false, ...props }: Props) {",
      "  return <button className={buttonVariants({ size })} {...props} />;",
      "}",
      "",
    ].join("\n"),
    "src/components/ui/field.tsx": [
      "export const Field = ({ label, hint: help, children }: FieldProps) => <div />;",
      "export const Wrapped = React.forwardRef<HTMLDivElement, P>(({ tone, className }, ref) => <div ref={ref} />);",
      "export function Bare(props: P) {\n  return <div {...props} />;\n}",
      "",
    ].join("\n"),
  };
  const byName = Object.fromEntries(
    readComponents(files, { library: "src/components/ui" }).components.map((item) => [
      item.name,
      item,
    ]),
  );
  // In the order the signature names them; not the class names, the children, nor an axis of a
  // variant set, which the variants already list; a renamed prop by the name a caller writes.
  assert.deepEqual(byName.Button.props, ["asLink"]);
  assert.deepEqual(byName.Field.props, ["label", "hint"]);
  assert.deepEqual(byName.Wrapped.props, ["tone"]);
  // Props taken whole are not named one by one.
  assert.equal(byName.Bare.props, undefined);
  for (const item of Object.values(byName)) {
    assert.deepEqual(
      shapeProblems("components", JSON.stringify({ version: "2", components: [item] })),
      [],
    );
  }
});

test("a component in the templates folder is a template, and every library's folder is a library", () => {
  const files = {
    "src/components/ui/button.tsx": "export function Button() {\n  return <button />;\n}\n",
    "src/components/vendor/badge.tsx": "export function Badge() {\n  return <span />;\n}\n",
    "src/components/templates/page-header.tsx":
      "export function PageHeader() {\n  return <header />;\n}\n",
    "src/components/templates/app-shell/sidebar.tsx":
      "export function Sidebar() {\n  return <nav />;\n}\n",
    "src/components/candidate/row-actions.tsx":
      "export function RowActions() {\n  return <div />;\n}\n",
  };
  const byName = Object.fromEntries(
    readComponents(files, {
      library: ["src/components/ui", "src/components/vendor"],
    }).components.map((item) => [item.name, item]),
  );
  assert.equal(byName.PageHeader.level, "template");
  assert.equal(byName.Sidebar.level, "template");
  assert.equal(byName.RowActions.level, "atom");
  assert.equal(byName.Badge.source, "library");
  assert.equal(byName.Button.source, "library");
  assert.equal(byName.RowActions.source, "own");
});

test("the folders of every library the settings name are read, when they are there", () => {
  const dir = mkdtempSync(path.join(tmpdir(), "design-assembly-libraries-"));
  made.push(dir);
  const settings = {
    aliases: { components: "@/components", ui: "@/components/ui" },
    registries: { "@vendor": { url: "https://example.com/{name}.json" }, "@absent": { url: "x" } },
  };
  writeFileSync(path.join(dir, "components.json"), JSON.stringify(settings));
  mkdirSync(path.join(dir, "src/components/vendor"), { recursive: true });
  assert.deepEqual(libraryFolders(dir), ["src/components/ui", "src/components/vendor"]);
});

test("comments are not structure: a variant set and a signature with comments are read whole", () => {
  const files = {
    "src/components/vendor/frame.tsx": [
      "const frameVariants = cva(",
      '  [ "flex", // the base, with a note: { not a brace',
      '    "gap-2" ],',
      "  {",
      "    variants: {",
      '      variant: { default: "border", ghost: "border-0" },',
      "      // Bars read as chrome: px stays level with the body.",
      '      spacing: { sm: "p-2", lg: "p-4" },',
      "      /* dense pins the panels flush */",
      '      dense: { true: "gap-0" },',
      "    },",
      "  },",
      ");",
      "export function Frame({",
      "  className,",
      "  // Accepted and ignored, so it is never spread onto the page, nor split here.",
      "  skeletonRows,",
      '  "aria-describedby": described,',
      "  ...props",
      "}: Props) {",
      "  return <div className={frameVariants({ className })} {...props} />;",
      "}",
      "",
    ].join("\n"),
    // Another file declares a set of the same name; each component reads its own file's first.
    "src/components/ui/frame.tsx": [
      'const frameVariants = cva("flex", { variants: { tone: { a: "x", b: "y" } } });',
      "export function UiFrame() {\n  return <div className={frameVariants()} />;\n}",
      "",
    ].join("\n"),
  };
  const byName = Object.fromEntries(
    readComponents(files, { library: "src/components/ui" }).components.map((item) => [
      item.name,
      item,
    ]),
  );
  assert.deepEqual(byName.Frame.variants, [
    "variant=default",
    "variant=ghost",
    "spacing=sm",
    "spacing=lg",
    "dense=true",
  ]);
  assert.deepEqual(byName.Frame.props, ["skeletonRows", "aria-describedby"]);
  assert.deepEqual(byName.UiFrame.variants, ["tone=a", "tone=b"]);
});

test("a component that calls another file's variant set with values of its own has none of its axes", () => {
  const files = {
    "src/components/ui/button.tsx": [
      'const buttonVariants = cva("h-9", { variants: { variant: { default: "a", outline: "b" } } });',
      "export function Button({ variant, ...props }: Props) {",
      "  return <button className={buttonVariants({ variant })} {...props} />;",
      "}",
      "export { buttonVariants };",
      "",
    ].join("\n"),
    "src/components/templates/page-state.tsx": [
      'import { buttonVariants } from "@/components/ui/button";',
      "export function PageState({ title }: Props) {",
      '  return <a className={buttonVariants({ variant: "outline" })}>{title}</a>;',
      "}",
      "",
    ].join("\n"),
  };
  const byName = Object.fromEntries(
    readComponents(files, { library: "src/components/ui" }).components.map((item) => [
      item.name,
      item,
    ]),
  );
  assert.equal(byName.PageState.variants, undefined);
  assert.deepEqual(byName.PageState.props, ["title"]);
  assert.deepEqual(byName.Button.variants, ["variant=default", "variant=outline"]);
});

test("a component re-exported through a barrel file is listed once, at the file that defines it", () => {
  const dir = folder({
    "src/components/reui/filters/filters-chip.tsx": [
      "export function FilterChip({ label, onRemove }: Props) {",
      "  return <span>{label}</span>;",
      "}",
      "",
    ].join("\n"),
    "src/components/reui/filters/filters-builder.tsx": [
      "export function FiltersBuilder({ fields, onAdd }: Props) {",
      "  return <div>{fields.length}</div>;",
      "}",
      "",
    ].join("\n"),
    "src/components/reui/filters/filters-date.tsx": [
      "export const FilterDate = ({ value }: Props) => <time>{value}</time>;",
      "",
    ].join("\n"),
    "src/components/reui/filters/filters-dnd.tsx": [
      "export function FilterHandle({ grip }: Props) {",
      "  return <i>{grip}</i>;",
      "}",
      "",
    ].join("\n"),
    // The barrel defines one component of its own and hands on the others: a list read from
    // another file, all of another file, and a name it imports and then exports.
    "src/components/reui/filters/filters.tsx": [
      'import { FilterHandle } from "@/components/reui/filters/filters-dnd";',
      "export function Filters({ query }: Props) {",
      "  return <div>{query}</div>;",
      "}",
      "export {",
      "  // The chip a custom row draws.",
      "  FilterChip,",
      '} from "@/components/reui/filters/filters-chip";',
      'export { FiltersBuilder as Builder, FiltersBuilder } from "./filters-builder";',
      'export * from "./filters-date";',
      "export { FilterHandle };",
      "",
    ].join("\n"),
  });
  const { components } = readComponents(readFolder(dir, "src/components/reui"), {
    library: "src/components/ui",
  });
  const where = components.map((item) => `${item.name} ${item.file}`).sort();
  assert.deepEqual(where, [
    "FilterChip src/components/reui/filters/filters-chip.tsx",
    "FilterDate src/components/reui/filters/filters-date.tsx",
    "FilterHandle src/components/reui/filters/filters-dnd.tsx",
    "Filters src/components/reui/filters/filters.tsx",
    "FiltersBuilder src/components/reui/filters/filters-builder.tsx",
  ]);
  const byName = Object.fromEntries(components.map((item) => [item.name, item]));
  assert.deepEqual(byName.FilterChip.props, ["label", "onRemove"]);
  assert.deepEqual(byName.FiltersBuilder.props, ["fields", "onAdd"]);
  assert.deepEqual(byName.FilterDate.props, ["value"]);
  assert.deepEqual(byName.FilterHandle.props, ["grip"]);
  assert.deepEqual(byName.Filters.props, ["query"]);
});

test("a component is drawn with the components its file hands on, as well as its own", () => {
  const dir = folder({
    "src/components/reui/filters/filters-chip.tsx": [
      "export function FilterChip({ label }: Props) {",
      "  return <span>{label}</span>;",
      "}",
      "",
    ].join("\n"),
    "src/components/reui/filters/filters-advanced.tsx": [
      "export function FiltersAdvanced({ rules }: Props) {",
      "  return <div>{rules.length}</div>;",
      "}",
      "",
    ].join("\n"),
    "src/components/ui/button.tsx": [
      "export function Button({ children }: Props) {",
      "  return <button>{children}</button>;",
      "}",
      "",
    ].join("\n"),
    // The barrel imports two components of other files, draws them, and hands them on, one in an
    // export list of its own and one in a list read from the defining file; it also draws a
    // component it imports and does not hand on.
    "src/components/reui/filters/filters.tsx": [
      'import { FiltersAdvanced } from "@/components/reui/filters/filters-advanced";',
      'import { FilterChip } from "@/components/reui/filters/filters-chip";',
      'import { Button } from "@/components/ui/button";',
      "export function Filters({ query }: Props) {",
      "  return <div>{query}<FiltersAdvanced rules={[]} /><FiltersRow /></div>;",
      "}",
      "export function FiltersRow({ rules }: Props) {",
      '  return <div><FilterChip label="a" /><Button>add</Button></div>;',
      "}",
      "export { FilterChip };",
      'export { FiltersAdvanced } from "@/components/reui/filters/filters-advanced";',
      "",
    ].join("\n"),
  });
  const { components } = readComponents(readFolder(dir, "src/components/reui"), {
    library: "src/components/ui",
  });
  const byName = Object.fromEntries(components.map((item) => [item.name, item]));
  // Each still listed once, at the file that defines it.
  assert.deepEqual(components.map((item) => item.name).sort(), [
    "FilterChip",
    "Filters",
    "FiltersAdvanced",
    "FiltersRow",
  ]);
  assert.equal(byName.FilterChip.file, "src/components/reui/filters/filters-chip.tsx");
  // What each is drawn with: its file's own components and the ones its file hands on, not a
  // component it merely imports.
  assert.deepEqual(byName.Filters.parts, ["FiltersRow", "FiltersAdvanced"]);
  assert.deepEqual(byName.FiltersRow.parts, ["FilterChip"]);
});

// A derived file a repository keeps out of git. The choice is the repository's, written in its
// tool data; a repository that never asked keeps today's behaviour.
const git = (dir, ...args) => spawnSync("git", ["-C", dir, ...args], { encoding: "utf8" });
const manifestKinds = (dir) =>
  JSON.parse(text(dir, "design/theme.json")).checks["component-manifest"].map((item) => item.kind);
const applied = () => {
  const dir = floor();
  const said = run(APPLY, "--target", dir);
  assert.equal(said.status, 0, said.stderr);
  return dir;
};

test("a manifest kept out of git: the gate is red while git tracks it, and green once git ignores it", () => {
  const dir = applied();
  assert.equal(git(dir, "init", "-q").status, 0);
  const asked = components(dir, "--out-of-git");
  assert.equal(asked.status, 0, asked.stderr);
  assert.deepEqual(manifestKinds(dir), ["components", "untracked"]);
  // Git tracks the file, so a pull request would carry it.
  git(dir, "add", "-A");
  const tracked = check(dir);
  assert.equal(tracked.status, 1, tracked.stdout);
  assert.match(
    tracked.stderr,
    /component-manifest: design\/component-registry\.json .*git tracks it/,
  );
  // Out of the index but not ignored: the next commit may take it back.
  assert.equal(git(dir, "rm", "-q", "--cached", REGISTRY).status, 0);
  const loose = check(dir);
  assert.equal(loose.status, 1, loose.stdout);
  assert.match(loose.stderr, /git does not ignore it/);
  writeFileSync(path.join(dir, ".gitignore"), `${REGISTRY}\n`);
  const held = check(dir);
  assert.equal(held.status, 0, held.stderr);
});

test("the gate draws a manifest kept out of git again before it checks, so a clean checkout is green", () => {
  const dir = applied();
  git(dir, "init", "-q");
  components(dir, "--out-of-git");
  writeFileSync(path.join(dir, ".gitignore"), `${REGISTRY}\n`);
  rmSync(path.join(dir, REGISTRY));
  const clean = check(dir);
  assert.equal(clean.status, 0, clean.stderr);
  assert.ok(existsSync(path.join(dir, REGISTRY)), "the gate did not draw the manifest again");
  // A component added in the source is in the file after the next run of the gate.
  writeFileSync(path.join(dir, "src/components/ui/toggle.tsx"), TOGGLE);
  const added = check(dir);
  assert.equal(added.status, 0, added.stderr);
  assert.match(text(dir, REGISTRY), /"Toggle"/);
});

test("a repository that never asked keeps its manifest in git: nothing new is checked or written", () => {
  const dir = applied();
  git(dir, "init", "-q");
  git(dir, "add", "-A");
  assert.deepEqual(manifestKinds(dir), ["components"]);
  const held = check(dir);
  assert.equal(held.status, 0, held.stderr);
  // A manifest that is in git and missing is still a failure, and the gate does not write it.
  rmSync(path.join(dir, REGISTRY));
  const missing = check(dir);
  assert.equal(missing.status, 1);
  assert.match(missing.stderr, /is missing/);
  assert.ok(!existsSync(path.join(dir, REGISTRY)));
});

test("keeping the manifest out of git outlives the next run of the guide, and one command takes it back", () => {
  const dir = applied();
  assert.equal(components(dir, "--out-of-git").status, 0);
  const again = run(APPLY, "--target", dir);
  assert.equal(again.status, 0, again.stderr);
  assert.deepEqual(manifestKinds(dir), ["components", "untracked"]);
  const back = components(dir, "--in-git");
  assert.equal(back.status, 0, back.stderr);
  assert.deepEqual(manifestKinds(dir), ["components"]);
});

test("outside a git repository a manifest kept out of git has nothing to answer for, and the gate is green", () => {
  const dir = applied();
  assert.equal(components(dir, "--out-of-git").status, 0);
  assert.deepEqual(manifestKinds(dir), ["components", "untracked"]);
  const held = check(dir);
  assert.equal(held.status, 0, held.stderr);
  assert.match(held.stdout, /each seen failing on a changed copy/);
});

test("a repository with no manifest of this tool is told so when asked to keep it out of git", () => {
  const dir = folder({
    "src/index.css": withoutBlock(own("src/index.css")),
    Makefile: own("Makefile"),
    "design/blueprint.json": blueprint(),
  });
  assert.equal(run(APPLY, "--target", dir).status, 0);
  const before = text(dir, "design/theme.json");
  const said = components(dir, "--out-of-git");
  assert.equal(said.status, 0, said.stderr);
  assert.match(said.stdout, /manages no component manifest here/);
  assert.equal(text(dir, "design/theme.json"), before);
});

test("a repository that adopted keeps its manifest out of git the same way, and adopting again leaves the choice alone", () => {
  const dir = floor();
  assert.equal(run(ADOPT, "--target", dir).status, 1);
  git(dir, "init", "-q");
  assert.equal(components(dir, "--out-of-git").status, 0);
  writeFileSync(path.join(dir, ".gitignore"), `${REGISTRY}\n`);
  const held = check(dir);
  assert.equal(held.status, 0, held.stderr);
  const before = text(dir, "design/theme.json");
  const again = run(ADOPT, "--target", dir);
  assert.equal(again.status, 1, again.stderr);
  // Adopting never rewrites the checks of a decision it already holds, so the data is untouched.
  assert.equal(text(dir, "design/theme.json"), before);
  assert.deepEqual(manifestKinds(dir), ["components", "untracked"]);
  const still = check(dir);
  assert.equal(still.status, 0, still.stderr);
});

test("the choice follows the manifest when the repository names another file for it", () => {
  const prior = {
    checks: {
      "component-manifest": [
        { kind: "components", file: "design/old-name.json", folder: "src/components/ui" },
        { kind: "untracked", file: "design/old-name.json" },
      ],
    },
  };
  assert.deepEqual(outOfGitChecks(prior, "design/new-name.json"), [
    { kind: "untracked", file: "design/new-name.json" },
  ]);
  // A repository that never asked, or has no tool data yet, gets nothing.
  assert.deepEqual(outOfGitChecks({ checks: { "component-manifest": [] } }, "design/x.json"), []);
  assert.deepEqual(outOfGitChecks(null, "design/x.json"), []);
});

test("git is asked about a file whose name has a space and letters outside ASCII", () => {
  const name = "design/sổ linh kiện.json";
  const dir = folder({ [name]: "{}\n", "design/other.json": "{}\n" });
  git(dir, "init", "-q");
  assert.deepEqual(gitFacts(dir, [name]), { tracked: [], ignored: [] });
  git(dir, "add", "-A");
  assert.deepEqual(gitFacts(dir, [name]).tracked, [name]);
  git(dir, "rm", "-q", "--cached", name);
  writeFileSync(path.join(dir, ".gitignore"), `${name}\n`);
  assert.deepEqual(gitFacts(dir, [name]), { tracked: [], ignored: [name] });
  // No check asks: git is not run at all.
  assert.equal(gitFacts(dir, []), null);
});

test("a target inside a larger git repository, in a folder with a space, is held the same way", () => {
  const parent = folder({});
  git(parent, "init", "-q");
  const dir = path.join(parent, "my app");
  for (const [file, content] of Object.entries(floorFiles())) {
    mkdirSync(path.dirname(path.join(dir, file)), { recursive: true });
    writeFileSync(path.join(dir, file), content);
  }
  assert.equal(run(APPLY, "--target", dir).status, 0);
  assert.equal(components(dir, "--out-of-git").status, 0);
  git(parent, "add", "-A");
  const tracked = check(dir);
  assert.equal(tracked.status, 1, tracked.stdout);
  assert.match(tracked.stderr, /git tracks it/);
  git(parent, "rm", "-q", "--cached", path.join("my app", REGISTRY));
  writeFileSync(path.join(dir, ".gitignore"), `${REGISTRY}\n`);
  const held = check(dir);
  assert.equal(held.status, 0, held.stderr);
});

test("when git is there but will not answer, the gate says so; with no git at all, nothing tracks the file", () => {
  const dir = applied();
  git(dir, "init", "-q");
  assert.equal(components(dir, "--out-of-git").status, 0);
  writeFileSync(path.join(dir, ".gitignore"), `${REGISTRY}\n`);
  const gate = path.join(dir, "tools/design-assembly/check.mjs");
  const withPath = (bin) =>
    spawnSync(execPath, [gate, "--target", dir], { encoding: "utf8", env: { ...env, PATH: bin } });
  // A git that refuses for a reason other than "not a repository", as it does for a checkout
  // owned by another user.
  const bin = folder({
    git: '#!/bin/sh\necho "fatal: detected dubious ownership in repository" >&2\nexit 128\n',
  });
  spawnSync("chmod", ["+x", path.join(bin, "git")]);
  const refused = withPath(bin);
  assert.equal(refused.status, 1, refused.stdout);
  assert.match(refused.stderr, /git could not be asked.*dubious ownership/);
  // No git on the machine: nothing can track the file.
  const none = withPath(folder({}));
  assert.equal(none.status, 0, none.stderr);
});

test("asking twice changes nothing the second time, and asking for both at once is refused", () => {
  const dir = applied();
  assert.equal(components(dir, "--out-of-git").status, 0);
  const once = text(dir, "design/theme.json");
  assert.equal(components(dir, "--out-of-git").status, 0);
  assert.equal(text(dir, "design/theme.json"), once);
  const both = components(dir, "--out-of-git", "--in-git");
  assert.equal(both.status, 1);
  assert.match(both.stderr, /one of --out-of-git and --in-git/);
  assert.equal(text(dir, "design/theme.json"), once);
});
