// The design tokens file: what is read from a stylesheet, that the file is held to the stylesheet
// in both directions, that a person's own file is never written over, and, when the acceptance kit
// is on this machine, that its own reader takes the file.
import "./helpers/own-cores.mjs";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { env, execPath } from "node:process";
import { after, test } from "node:test";
import { fileURLToPath } from "node:url";

import { parseLedger, TOOL } from "../templates/tools/design-assembly/ledger.mjs";
import { loadStyles } from "../templates/tools/design-assembly/styles.mjs";
import { withoutBlock } from "../templates/tools/design-assembly/theme.mjs";
import { readTokens, renderTokens, tokenCss } from "../templates/tools/design-assembly/tokens.mjs";
import { kitFile } from "./helpers/kit.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const PLUGIN = path.resolve(HERE, "..");
const ROOT = path.resolve(PLUGIN, "../..");
const APPLY = path.join(PLUGIN, "scripts/apply.mjs");
const ADOPT = path.join(PLUGIN, "scripts/adopt.mjs");
const LAYERS = JSON.parse(readFileSync(path.join(PLUGIN, "references/layers.json"), "utf8")).layers;
// The types the acceptance kit's reader knows, as its intake contract lists them.
const KNOWN_TYPES = [
  "color",
  "dimension",
  "fontFamily",
  "fontWeight",
  "number",
  "duration",
  "shadow",
  "typography",
  "string",
];

const made = [];
after(() => made.forEach((dir) => rmSync(dir, { recursive: true, force: true })));

function folder(files) {
  const dir = mkdtempSync(path.join(tmpdir(), "design-assembly-tokens-"));
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
const floor = (extra = {}) =>
  folder({
    "src/index.css": withoutBlock(own("src/index.css")),
    Makefile: own("Makefile"),
    "design/blueprint.json": blueprint(),
    ...extra,
  });

const run = (script, ...args) => spawnSync(execPath, [script, ...args], { encoding: "utf8" });
const check = (dir) => run(path.join(dir, "tools/design-assembly/check.mjs"), "--target", dir);
const tokens = (dir, ...args) =>
  run(path.join(dir, "tools/design-assembly/tokens.mjs"), "--target", dir, ...args);
const text = (dir, file) => readFileSync(path.join(dir, file), "utf8");
const edit = (dir, file, change) => {
  const before = text(dir, file);
  const next = change(before);
  assert.notEqual(next, before, `the edit of ${file} changed nothing`);
  writeFileSync(path.join(dir, file), next);
};

const SHEET = [
  "@theme inline {",
  "  --font-sans: 'Inter', sans-serif;",
  "  --color-primary: var(--primary);",
  "  --color-border: var(--border);",
  "  --color-lost: var(--nowhere);",
  "  --radius-sm: calc(var(--radius) * 0.6);",
  "  --radius-lg: var(--radius);",
  "  --radius-odd: calc(var(--radius) - 2px);",
  "  --text-lg--line-height: 1.5;",
  "}",
  "",
  ":root {",
  "  --radius: 0.625rem;",
  "  --primary: var(--brand);",
  "  --brand: #0246ff;",
  "  --border: oklch(0.922 0 0);",
  "  --text-base: 1rem;",
  "}",
  "",
  ".dark {",
  "  --primary: color-mix(in oklch, var(--brand) 60%, white);",
  "}",
  "",
].join("\n");

test("tokens are the theme variables of the stylesheet, followed to their values", () => {
  const dir = folder({ "src/index.css": SHEET });
  const { tokens: found, unresolved } = readTokens(loadStyles(dir, "src/index.css"));
  assert.deepEqual(found, {
    color: {
      primary: {
        $type: "color",
        $value: "#0246ff",
        // A value that differs in dark mode is kept beside the base one, as written.
        $extensions: { "design-assembly": { dark: "color-mix(in oklch, #0246ff 60%, white)" } },
      },
      // A colour is written in hexadecimal, which every reader takes; the stylesheet's own text
      // is kept beside it.
      border: {
        $type: "color",
        $value: "#e5e5e5",
        $extensions: { "design-assembly": { css: "oklch(0.922 0 0)" } },
      },
    },
    radius: {
      // A length times a number is folded; any other expression is kept as CSS.
      sm: { $type: "dimension", $value: "0.375rem" },
      lg: { $type: "dimension", $value: "0.625rem" },
      odd: { $type: "dimension", $value: "calc(0.625rem - 2px)" },
    },
    // Only the type step this stylesheet can resolve: there is no framework here.
    text: { base: { $type: "dimension", $value: "1rem" } },
    // A typeface is the family it means, the first of its list; the list stays beside it.
    font: {
      sans: {
        $type: "fontFamily",
        $value: "Inter",
        $extensions: { "design-assembly": { css: "'Inter', sans-serif" } },
      },
    },
  });
  // A pointer that leads nowhere is not turned into a token, and is said aloud.
  assert.deepEqual(unresolved.slice(0, 1), ["--color-lost"]);
});

test("the guide writes the file, in a form the kit's reader and a formatter both keep", () => {
  const dir = floor();
  const applied = run(APPLY, "--target", dir);
  assert.equal(applied.status, 0, applied.stderr);
  assert.match(applied.stdout, /create\s+design\/tokens\.json/);
  const file = text(dir, "design/tokens.json");
  const data = JSON.parse(file);

  const styles = loadStyles(dir, "src/index.css");
  assert.equal(file, renderTokens(readTokens(styles).tokens));
  // No arrays: a formatter lays arrays out its own way, and would fight the generator.
  assert.ok(!file.includes("["));
  for (const [group, entries] of Object.entries(data)) {
    assert.match(group, /^[a-z]+$/);
    for (const [name, token] of Object.entries(entries)) {
      assert.match(name, /^[a-z0-9-]+$/, name);
      assert.ok(KNOWN_TYPES.includes(token.$type), `${group}.${name}`);
      assert.equal(typeof token.$value, "string", `${group}.${name}`);
      assert.ok(!token.$value.includes("var("), `${group}.${name}`);
      // The path is a variable the stylesheet has: `--group-name`.
      if (group !== "text") assert.match(styles.css, new RegExp(`--${group}-${name}\\s*:`));
    }
  }
  // Every colour is hexadecimal: the acceptance kit's gate reads no other form.
  for (const [name, token] of Object.entries(data.color)) {
    assert.match(token.$value, /^#[0-9a-f]{6}([0-9a-f]{2})?$/, name);
  }
  // The primary color role is the generated one, as the stylesheet writes it, with its dark value
  // beside it.
  assert.match(data.color.primary.$extensions["design-assembly"].css, /^oklch\(/);
  assert.match(data.color.primary.$extensions["design-assembly"].dark, /^oklch\(/);

  const row = parseLedger(text(dir, "design/decisions.yaml")).find(
    (item) => item.id === "design-tokens",
  );
  assert.equal(row.check, TOOL);
  assert.equal(check(dir).status, 0, check(dir).stderr);
  assert.match(run(APPLY, "--target", dir).stdout, /unchanged design\/tokens\.json/);
});

test("the file is held to the stylesheet: an edit on either side turns the gate red", () => {
  const dir = floor();
  assert.equal(run(APPLY, "--target", dir).status, 0);

  // The stylesheet moves and the file is not written again.
  edit(dir, "src/index.css", (css) => css.replace(/--border: [^;]+;/, "--border: oklch(0.5 0 0);"));
  const stale = check(dir);
  assert.equal(stale.status, 1);
  // The message names the token and both values, so it is clear which side moved.
  assert.match(
    stale.stderr,
    /design-tokens: design\/tokens\.json is not what src\/index\.css gives \(color\.border: the stylesheet gives oklch\(0\.5 0 0\), the file says oklch\(0\.922 0 0\)/,
  );
  assert.equal(tokens(dir).status, 1);

  // Writing it again from the stylesheet is the way back.
  const written = tokens(dir, "--write");
  assert.equal(written.status, 0, written.stderr);
  assert.match(written.stdout, /wrote design\/tokens\.json from src\/index\.css/);
  assert.equal(
    tokenCss(JSON.parse(text(dir, "design/tokens.json")).color.border),
    "oklch(0.5 0 0)",
  );
  assert.equal(check(dir).status, 0, check(dir).stderr);
  assert.match(tokens(dir, "--write").stdout, /is up to date/);

  // The file is edited by hand.
  edit(dir, "design/tokens.json", (json) => json.replace("oklch(0.5 0 0)", "#808080"));
  const edited = check(dir);
  assert.equal(edited.status, 1);
  assert.match(edited.stderr, /design-tokens: .*the file says #808080.*run make design-tokens/);

  // The file is gone.
  rmSync(path.join(dir, "design/tokens.json"));
  const gone = check(dir);
  assert.equal(gone.status, 1);
  assert.match(gone.stderr, /design-tokens: design\/tokens\.json is missing/);
});

test("the file goes where the acceptance kit is told to read it", () => {
  const dir = floor({
    "_acceptance/config.yaml": 'design_floor:\n  tokens: "design/brand.tokens.json"\n',
  });
  assert.equal(run(APPLY, "--target", dir).status, 0);
  assert.ok(existsSync(path.join(dir, "design/brand.tokens.json")));
  assert.ok(!existsSync(path.join(dir, "design/tokens.json")));
  assert.equal(check(dir).status, 0, check(dir).stderr);
});

test("a tokens file a person already keeps is never written over", () => {
  const mine = '{ "color": { "brand": { "$type": "color", "$value": "#123456" } } }\n';
  // The guide ends with 0; adopting ends with 1, with a person's calls still open on the floor.
  for (const [script, ends] of [
    [APPLY, 0],
    [ADOPT, 1],
  ]) {
    const dir = floor({ "design/tokens.json": mine });
    const result = run(script, "--target", dir);
    assert.equal(result.status, ends, result.stderr);
    assert.match(result.stdout, /design\/tokens\.json is already there and is not what/);
    assert.equal(text(dir, "design/tokens.json"), mine);
    const ids = parseLedger(text(dir, "design/decisions.yaml")).map((row) => row.id);
    assert.ok(!ids.includes("design-tokens"));
    assert.equal(check(dir).status, 0, check(dir).stderr);
  }
});

test("adopting writes the file from the values the repository has, changing none", () => {
  const dir = floor();
  const css = text(dir, "src/index.css");
  const adopted = run(ADOPT, "--target", dir);
  assert.equal(adopted.status, 1, adopted.stderr);
  assert.equal(text(dir, "src/index.css"), css);
  const data = JSON.parse(text(dir, "design/tokens.json"));
  // The floor's own grey primary, not a generated one.
  assert.equal(tokenCss(data.color.primary), "oklch(0.205 0 0)");
  assert.equal(check(dir).status, 0, check(dir).stderr);
});

// The acceptance kit's own reader, when the kit is on this machine: it turns a token path into a
// variable name, and counts a declaration as a token when it uses one.
const KIT = kitFile(
  env.DESIGN_ASSEMBLY_KIT && path.resolve(ROOT, env.DESIGN_ASSEMBLY_KIT),
  "design-floor/dist/ui.mjs",
);
const noKit = KIT === null;

test(
  "the acceptance kit's reader takes the file and recognises its variables",
  { skip: noKit && "set DESIGN_ASSEMBLY_KIT to a checkout of the acceptance kit" },
  () => {
    const dir = floor();
    assert.equal(run(APPLY, "--target", dir).status, 0);
    const page = (style) =>
      `<!doctype html><html><head><style>\n${style}\n</style></head><body><main><h1>x</h1></main></body></html>\n`;
    writeFileSync(
      path.join(dir, "clean.html"),
      page(
        // The throwaway repository has no framework, so no type step: three variables it does have.
        ".a { color: var(--color-primary); border-color: var(--color-border); border-radius: var(--radius-lg); }",
      ),
    );
    writeFileSync(path.join(dir, "raw.html"), page(".a { color: #123456; }"));
    const grade = (file) =>
      run(
        KIT,
        "token-coverage",
        path.join(dir, file),
        "--tokens",
        path.join(dir, "design/tokens.json"),
        "--json",
      );

    const clean = grade("clean.html");
    assert.equal(clean.status, 0, clean.stdout + clean.stderr);
    assert.deepEqual(
      {
        token: JSON.parse(clean.stdout).data.overall.token,
        raw: JSON.parse(clean.stdout).data.overall.raw,
      },
      { token: 3, raw: 0 },
    );
    // And it still tells a raw colour from a token.
    const raw = grade("raw.html");
    assert.equal(raw.status, 2);
    assert.equal(JSON.parse(raw.stdout).data.overall.raw, 1);

    // The kit's gate loads the file too: it compares colours as hexadecimal, and refuses a file
    // with none.
    const gate = run(
      KIT,
      "gate",
      path.join(dir, "clean.html"),
      "--tokens",
      path.join(dir, "design/tokens.json"),
      "--json",
    );
    assert.notEqual(JSON.parse(gate.stdout).error?.code, "TOKENS_NOT_READABLE", gate.stdout);
    assert.equal(JSON.parse(gate.stdout).ok, true, gate.stdout);
  },
);

test("dark values are read from every dark selector the stylesheet uses", () => {
  // Color roles under one selector, further values under another: both are the dark mode.
  const sheet = [
    "@theme inline {",
    "  --color-primary: var(--primary);",
    "  --color-success: var(--success);",
    "}",
    ":root {",
    "  --primary: #0246ff;",
    "  --success: #15803d;",
    "}",
    ":root.dark {",
    "  --primary: #7aa2ff;",
    "}",
    ".dark {",
    "  --success: #34d399;",
    "  --primary: #000000;",
    "}",
    "",
  ].join("\n");
  const dir = folder({ "src/index.css": sheet });
  const { tokens: found } = readTokens(loadStyles(dir, "src/index.css"));
  assert.equal(found.color.success.$extensions["design-assembly"].dark, "#34d399");
  // Where both name a variable, the class on the root element wins, as in the browser.
  assert.equal(found.color.primary.$extensions["design-assembly"].dark, "#7aa2ff");
});
