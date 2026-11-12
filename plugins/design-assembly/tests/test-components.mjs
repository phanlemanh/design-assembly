// The component manifest: what is read from component source, that the file is held to the source
// in both directions, that a person's own file is never written over, and, when the acceptance kit
// is on this machine, that its plan check accepts the names and variants and rejects wrong ones.
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { env, execPath } from "node:process";
import { after, test } from "node:test";
import { fileURLToPath } from "node:url";

import { readComponents, readFolder } from "../templates/tools/design-assembly/components.mjs";
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
        variants: all,
        defaults: { variant: "default", size: "default" },
      },
      {
        // Braces and brackets inside class names are text, not structure.
        name: "Toggle",
        category: "component",
        file: "ui/toggle.tsx",
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
