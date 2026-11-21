// The typeface as a choice of the foundations (item 9.1, slice 1): the typeface of running text and
// of headings, the floor's or the system font, asked by the guide like the other choices; the block
// the guide writes names both, the design tokens file has a group `font`, and the gate holds that
// a typeface the stylesheet names is loaded, as each build stack loads one. A repository set up
// before this version keeps every value and a green gate, and the question waits on its owner.
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import {
  cpSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  realpathSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { execPath } from "node:process";
import { after, test } from "node:test";
import { fileURLToPath } from "node:url";

import { blueprintProblems, rulesPage, themeInputs } from "../scripts/apply.mjs";
import { brief } from "../scripts/brief.mjs";
import { fullStatus } from "../scripts/status.mjs";
import { specimenPlan } from "../scripts/specimen.mjs";
import { STAMP, TOOL_COPY, treeHash } from "../scripts/stamp.mjs";
import { gateProblems, readState, runChecks } from "../templates/tools/design-assembly/check.mjs";
import { loadStyles } from "../templates/tools/design-assembly/styles.mjs";
import { readTokens } from "../templates/tools/design-assembly/tokens.mjs";
import { firstFamily } from "../templates/tools/design-assembly/fonts.mjs";
import { parseLedger } from "../templates/tools/design-assembly/ledger.mjs";
import {
  buildTheme,
  readBlock,
  renderBlock,
  SYSTEM_FONT,
  withoutBlock,
} from "../templates/tools/design-assembly/theme.mjs";
import { briefRepository, BUILT } from "./helpers/brief-repo.mjs";

const PLUGIN = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const ROOT = path.resolve(PLUGIN, "../..");
const LAYERS = JSON.parse(readFileSync(path.join(PLUGIN, "references/layers.json"), "utf8")).layers;
const FLOOR_CSS = withoutBlock(readFileSync(path.join(ROOT, "src/index.css"), "utf8"));
const FLOOR_TEXT = '"Geist Variable", sans-serif';

const made = [];
after(() => made.forEach((dir) => rmSync(dir, { recursive: true, force: true })));
const empty = () => {
  const dir = realpathSync(mkdtempSync(path.join(tmpdir(), "design-typeface-")));
  made.push(dir);
  return dir;
};
const put = (dir, file, content) => {
  mkdirSync(path.dirname(path.join(dir, file)), { recursive: true });
  writeFileSync(path.join(dir, file), content);
};
const text = (dir, file) => readFileSync(path.join(dir, file), "utf8");
const json = (dir, file) => JSON.parse(text(dir, file));
const run = (script, ...args) => spawnSync(execPath, [script, ...args], { encoding: "utf8" });
const script = (name) => path.join(PLUGIN, "scripts", name);
const gate = (dir) => run(path.join(dir, "tools/design-assembly/check.mjs"), "--target", dir);
const foundationsOf = (choice) =>
  LAYERS.find((layer) => layer.id === "foundations").choices.find((item) => item.key === choice);

const ANSWERED = { by: "Owner Name", on: "2026-11-21" };
// A blueprint the guide can write from, with the typeface answered as `fonts` says.
function blueprint(fonts = {}, { source = "user", answered = true } = {}) {
  const choices = {
    context: { product_type: "application", conformance_level: "AA" },
    patterns: { record_panel: "beside" },
    foundations: { source_color: "#0246ff", ...fonts },
  };
  const layers = {};
  for (const layer of LAYERS) {
    layers[layer.id] = layer.built
      ? { status: "decided", source, choice: choices[layer.id], why: "For the test." }
      : { status: "planned" };
  }
  if (answered && Object.keys(fonts).length > 0) {
    layers.foundations.answered = Object.fromEntries(
      Object.keys(fonts).map((key) => [key, ANSWERED]),
    );
  }
  return { version: 1, status: "approved", layers };
}

// A repository with the floor of this one, and the blueprint given.
function repository(content) {
  const dir = empty();
  put(dir, "src/index.css", FLOOR_CSS);
  put(dir, "Makefile", text(ROOT, "Makefile"));
  put(dir, "design/blueprint.json", JSON.stringify(content, null, 2));
  // The floor's font package, as the stylesheet imports it: what loads the floor's typeface.
  const font = "node_modules/@fontsource-variable/geist";
  put(dir, `${font}/package.json`, text(ROOT, `${font}/package.json`));
  put(dir, `${font}/index.css`, text(ROOT, `${font}/index.css`));
  return dir;
}

// ---- the choice ---------------------------------------------------------------------------------

test("the foundations layer asks the typeface of text and of headings, and names the third kind it cannot take yet", () => {
  const textFont = foundationsOf("text_font");
  const headingFont = foundationsOf("heading_font");
  assert.deepEqual(Object.keys(textFont.options), ["floor", "system"]);
  assert.deepEqual(Object.keys(headingFont.options), ["text", "floor", "system"]);
  for (const choice of [textFont, headingFont]) {
    assert.deepEqual(Object.keys(choice.not_yet), ["source"]);
    // One sentence, that says what is missing and when it comes.
    assert.match(choice.not_yet.source, /sources ledger/);
    assert.match(choice.not_yet.source, /next version/);
    assert.equal(choice.not_yet.source.split(/\.\s/).length, 1);
  }
});

test("a font from the sources ledger is refused with one sentence; an unknown value is refused as any other", () => {
  const asked = blueprintProblems(blueprint({ text_font: "source", heading_font: "text" }));
  assert.equal(asked.length, 1, asked.join("\n"));
  assert.match(asked[0], /^foundations: text typeface source: .*sources ledger.*next version/);
  assert.doesNotMatch(asked[0], /must be one of/);
  const heading = blueprintProblems(blueprint({ text_font: "floor", heading_font: "source" }));
  assert.equal(heading.length, 1);
  assert.match(heading[0], /^foundations: heading typeface source: /);
  const strange = blueprintProblems(blueprint({ text_font: "comic", heading_font: "text" }));
  assert.deepEqual(strange, ["foundations: text typeface must be one of floor, system"]);
});

test("a blueprint decided before the typeface existed is not wrong: the choice waits", () => {
  assert.deepEqual(blueprintProblems(blueprint()), []);
  const { inputs } = themeInputs(blueprint());
  assert.equal("textFont" in inputs, false);
  // Half an answer is not one.
  assert.deepEqual(blueprintProblems(blueprint({ text_font: "system" })), [
    "foundations: no heading typeface",
  ]);
});

test("the owner's answer reaches the blueprint with a name and a date, a proposal without", () => {
  const unnamed = blueprintProblems(
    blueprint({ text_font: "system", heading_font: "text" }, { answered: false }),
  );
  assert.equal(unnamed.length, 2, unnamed.join("\n"));
  assert.match(unnamed[0], /text typeface is the owner's answer.*answered\.text_font/);
  const badDay = blueprint({ text_font: "system", heading_font: "text" });
  badDay.layers.foundations.answered.text_font = { by: "Owner Name", on: "21/11/2026" };
  assert.equal(blueprintProblems(badDay).length, 1);
  // A proposal of the guide needs no name: nobody answered it yet.
  assert.deepEqual(
    blueprintProblems(
      blueprint(
        { text_font: "system", heading_font: "text" },
        { source: "proposed", answered: false },
      ),
    ),
    [],
  );
});

test("the guide recommends a typeface and says what the recommendation rests on", () => {
  const preview = run(
    script("apply.mjs"),
    "--target",
    repository(blueprint()),
    "--dry-run",
    "--json",
  );
  const data = JSON.parse(preview.stdout);
  const keys = data.recommendations.map((item) => item.key);
  assert.ok(keys.includes("text_font"), keys.join(", "));
  assert.ok(keys.includes("heading_font"), keys.join(", "));
  const textFont = data.recommendations.find((item) => item.key === "text_font");
  assert.equal(textFont.option, "floor");
  assert.ok(textFont.basis.text.length > 0);
});

test("the specimen sheet draws each typeface it can take, and none it cannot", () => {
  const dir = repository(blueprint());
  const plan = specimenPlan(dir, { section: "typeface" });
  const sections = Object.fromEntries(plan.sections.map((section) => [section.key, section]));
  assert.deepEqual(Object.keys(sections), ["text_font", "heading_font"]);
  assert.deepEqual(
    sections.text_font.options.map((option) => [option.letter, option.value]),
    [
      ["A", "floor"],
      ["B", "system"],
    ],
  );
  assert.deepEqual(
    sections.heading_font.options.map((option) => option.value),
    ["text", "floor", "system"],
  );
  const system = sections.text_font.options.find((option) => option.value === "system");
  assert.ok(system.css.includes(SYSTEM_FONT), system.css);
  const floor = sections.text_font.options.find((option) => option.value === "floor");
  assert.ok(floor.css.includes(FLOOR_TEXT), floor.css);
});

// ---- the value ----------------------------------------------------------------------------------

test("the block names the typeface of text and of headings; without an answer it names none", () => {
  const base = { sourceColor: "#0246ff", conformanceLevel: "AA" };
  const none = renderBlock(buildTheme(base, FLOOR_CSS));
  assert.doesNotMatch(none, /--font-/);
  const floor = renderBlock(
    buildTheme({ ...base, textFont: "floor", headingFont: "text" }, FLOOR_CSS),
  );
  assert.match(floor, new RegExp(`--font-sans: ${FLOOR_TEXT.replaceAll('"', '"')};`));
  assert.match(floor, /--font-heading: var\(--font-sans\);/);
  const system = renderBlock(
    buildTheme({ ...base, textFont: "system", headingFont: "floor" }, FLOOR_CSS),
  );
  assert.ok(system.includes(`--font-sans: ${SYSTEM_FONT};`), system);
  // The floor's heading font is the floor's, even where text is set in another one.
  assert.ok(system.includes(`--font-heading: ${FLOOR_TEXT};`), system);
  // The block that names fonts is read by the framework's theme, after the floor's own.
  assert.match(system, /@theme inline \{\n {2}--font-sans: /);
  assert.throws(
    () => buildTheme({ ...base, textFont: "source", headingFont: "text" }, FLOOR_CSS),
    /sources ledger/,
  );
});

test("the guide writes the block, the font tokens and the typeface row; a new answer changes both; a hand edit turns the gate red", () => {
  const dir = repository(blueprint({ text_font: "floor", heading_font: "text" }));
  const first = run(script("apply.mjs"), "--target", dir);
  assert.equal(first.status, 0, first.stderr);
  const css = text(dir, "src/index.css");
  assert.ok(readBlock(css).includes(`--font-sans: ${FLOOR_TEXT};`));
  const tokens = json(dir, "design/tokens.json");
  assert.deepEqual(tokens.font.sans.$type, "fontFamily");
  assert.equal(tokens.font.sans.$value, "Geist Variable");
  assert.equal(tokens.font.sans.$extensions["design-assembly"].css, FLOOR_TEXT);
  assert.equal(tokens.font.heading.$value, "Geist Variable");
  const rows = parseLedger(text(dir, "design/decisions.yaml"));
  const typeface = rows.find((row) => row.id === "typeface");
  assert.ok(typeface, "no typeface row");
  assert.equal(typeface.kind, "closed");
  assert.match(typeface.note, /answered by Owner Name on 2026-11-21/);
  assert.ok(rows.some((row) => row.id === "font-loaded"));
  // The decision record says the answer, with who gave it and when.
  assert.match(
    text(dir, "design/decisions/foundations.md"),
    /text typeface: `floor` \(answered by Owner Name on 2026-11-21\)/,
  );
  const green = gate(dir);
  assert.equal(green.status, 0, green.stderr);

  // Another answer: the block and the tokens follow.
  put(
    dir,
    "design/blueprint.json",
    JSON.stringify(blueprint({ text_font: "system", heading_font: "text" }), null, 2),
  );
  assert.equal(run(script("apply.mjs"), "--target", dir).status, 0);
  assert.ok(readBlock(text(dir, "src/index.css")).includes(`--font-sans: ${SYSTEM_FONT};`));
  assert.equal(json(dir, "design/tokens.json").font.sans.$value, "ui-sans-serif");
  assert.equal(gate(dir).status, 0);

  // A hand edit of the block is not in force: the gate says so.
  put(
    dir,
    "src/index.css",
    text(dir, "src/index.css").replace(
      `--font-sans: ${SYSTEM_FONT};`,
      `--font-sans: ${FLOOR_TEXT};`,
    ),
  );
  const red = gate(dir);
  assert.notEqual(red.status, 0);
  assert.match(red.stderr, /generated block is not what the source color gives/);
});

test("a declaration after the block that names another typeface turns the gate red", () => {
  const dir = repository(blueprint({ text_font: "system", heading_font: "text" }));
  assert.equal(run(script("apply.mjs"), "--target", dir).status, 0);
  put(
    dir,
    "src/index.css",
    `${text(dir, "src/index.css")}\n@theme inline {\n  --font-sans: "Geist Variable", sans-serif;\n}\n`,
  );
  const red = gate(dir);
  assert.notEqual(red.status, 0);
  assert.match(
    red.stderr,
    /typeface: --font-sans in :root is "Geist Variable", sans-serif, not the decided/,
  );
});

// ---- the check that a typeface is loaded --------------------------------------------------------

// A repository with only what the check reads: the stylesheet, the tool data naming the check, and
// whatever `files` adds.
function fontRepository(css, files = {}, stylesheet = "src/index.css") {
  const dir = empty();
  put(dir, stylesheet, css);
  put(
    dir,
    "design/theme.json",
    JSON.stringify({
      version: 1,
      stylesheet,
      checks: {
        "font-loaded": [{ kind: "font-loaded", variables: ["--font-sans", "--font-heading"] }],
      },
    }),
  );
  for (const [file, content] of Object.entries(files)) put(dir, file, content);
  return dir;
}
const fontResult = (dir) => runChecks(readState(dir)).find((result) => result.id === "font-loaded");
const theme = (sans, heading = "var(--font-sans)") =>
  `@theme inline {\n  --font-heading: ${heading};\n  --font-sans: ${sans};\n}\n`;

test("the first typeface of a list is the one the page means; a generic family needs nothing", () => {
  assert.deepEqual(firstFamily('"Geist Variable", sans-serif'), { name: "Geist Variable" });
  assert.deepEqual(firstFamily("Inter, sans-serif"), { name: "Inter" });
  assert.deepEqual(firstFamily("ui-sans-serif, system-ui, sans-serif"), {
    generic: "ui-sans-serif",
  });
  assert.deepEqual(firstFamily("var(--font-inter), sans-serif"), { variable: "--font-inter" });
});

test("a typeface nothing loads turns the gate red, and the sentence names it and where it is named", () => {
  const dir = fontRepository(theme('"Inter", sans-serif'));
  const result = fontResult(dir);
  assert.ok(result.problem, "a typeface nothing loads passed");
  assert.match(result.problem, /--font-sans in src\/index\.css names the typeface "Inter"/);
  assert.match(result.problem, /nothing in the repository loads it/);
  // The heading names it through the text's variable: said once, where it is named.
  assert.equal(result.problem.match(/"Inter"/g).length, 1, result.problem);
});

test("the system font needs nothing loaded, and the check is still seen failing on a changed copy", () => {
  const result = fontResult(fontRepository(theme(SYSTEM_FONT)));
  assert.equal(result.problem, null);
  assert.equal(result.seenFailing, true);
});

test("first stack: an @font-face rule, or a font package the stylesheet imports, loads a typeface", () => {
  const stack = {
    "package.json": JSON.stringify({ devDependencies: { vite: "8.0.0" } }),
    "vite.config.ts": "export default {};\n",
  };
  const faced = fontRepository(
    `@font-face {\n  font-family: "Inter";\n  src: url("./inter.woff2") format("woff2");\n}\n${theme('"Inter", sans-serif')}`,
    stack,
  );
  assert.equal(fontResult(faced).problem, null);
  assert.equal(fontResult(faced).seenFailing, true);

  const packaged = fontRepository(`@import "brand-type";\n${theme('"Brand Sans", sans-serif')}`, {
    ...stack,
    "node_modules/brand-type/package.json": JSON.stringify({
      name: "brand-type",
      style: "brand.css",
    }),
    "node_modules/brand-type/brand.css":
      "@font-face {\n  font-family: 'Brand Sans';\n  src: url(./files/brand.woff2) format('woff2');\n}\n",
  });
  assert.equal(fontResult(packaged).problem, null);
  // A package that is imported and loads another typeface loads nothing named here.
  const other = fontRepository(`@import "brand-type";\n${theme('"Inter", sans-serif')}`, {
    ...stack,
    "node_modules/brand-type/package.json": JSON.stringify({
      name: "brand-type",
      style: "brand.css",
    }),
    "node_modules/brand-type/brand.css": "@font-face {\n  font-family: 'Brand Sans';\n}\n",
  });
  assert.match(fontResult(other).problem, /"Inter"/);
});

test("second stack: its font loader in a layout file, setting the variable the stylesheet names, loads it", () => {
  const stack = {
    "package.json": JSON.stringify({ dependencies: { next: "16.0.0" } }),
    "next.config.mjs": "export default {};\n",
  };
  const layout = [
    'import { Inter } from "next/font/google";',
    "",
    'const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });',
    "",
    "export default function RootLayout({ children }) {",
    "  return <html className={inter.variable}>{children}</html>;",
    "}",
    "",
  ].join("\n");
  const css = theme("var(--font-inter), sans-serif");
  const loaded = fontRepository(
    css,
    { ...stack, "src/app/layout.tsx": layout },
    "src/app/globals.css",
  );
  assert.equal(fontResult(loaded).problem, null);
  assert.equal(fontResult(loaded).seenFailing, true);
  // The same stylesheet with no loader that sets the variable: red, and the variable is named.
  const missing = fontRepository(css, stack, "src/app/globals.css");
  assert.match(
    fontResult(missing).problem,
    /--font-sans in src\/app\/globals\.css names the typeface var\(--font-inter\)/,
  );
  assert.match(fontResult(missing).problem, /layout file/);
  // The loader writes its family under a name of its own: a stylesheet that names the family in
  // words gets the fallback, so a loader with a variable does not load it by name.
  const byName = fontRepository(
    theme('"Inter", sans-serif'),
    {
      ...stack,
      "src/app/layout.tsx": layout,
    },
    "src/app/globals.css",
  );
  assert.match(fontResult(byName).problem, /names the typeface "Inter"/);
});

test("second stack: a loader called with no variable loads nothing a stylesheet can name", () => {
  const dir = fontRepository(
    theme('"Inter", sans-serif'),
    {
      "package.json": JSON.stringify({ dependencies: { next: "16.0.0" } }),
      "app/layout.tsx": [
        'import { Inter } from "next/font/google";',
        "",
        'const inter = Inter({ subsets: ["latin"] });',
        "",
        "export default function RootLayout({ children }) {",
        "  return <html className={inter.className}>{children}</html>;",
        "}",
        "",
      ].join("\n"),
    },
    "app/globals.css",
  );
  const result = fontResult(dir);
  assert.match(result.problem, /--font-sans in app\/globals\.css names the typeface "Inter"/);
  assert.deepEqual(readState(dir).fonts.loads, []);
});

test("a font package the stylesheet imports and the repository has not installed is named as such", () => {
  const dir = fontRepository(`@import "brand-type";\n${theme('"Brand Sans", sans-serif')}`, {
    "package.json": JSON.stringify({ devDependencies: { vite: "8.0.0" } }),
  });
  const result = fontResult(dir);
  // Still red: nothing here shows the typeface is loaded, and the gate cannot read what would.
  assert.ok(result.problem, "an unread package passed");
  assert.match(result.problem, /names the typeface "Brand Sans"/);
  assert.match(
    result.problem,
    /the package brand-type, which src\/index\.css imports, is not installed here/,
  );
  assert.match(result.problem, /Install the repository's packages, then run the gate again/);
  assert.doesNotMatch(result.problem, /no package the stylesheet imports does/);
});

// ---- a repository set up before this version ----------------------------------------------------

// The guide applied with the plugin of before: no typeface asked, no font row, no font tokens, and
// a tool copy the installed plugin no longer has.
function before() {
  const dir = repository(blueprint());
  assert.equal(run(script("apply.mjs"), "--target", dir).status, 0);
  const themeData = json(dir, "design/theme.json");
  delete themeData.checks["font-loaded"];
  put(dir, "design/theme.json", `${JSON.stringify(themeData, null, 2)}\n`);
  const ledger = text(dir, "design/decisions.yaml").replace(
    /\n {2}- id: font-loaded\n(?: {4}.*\n)+/,
    "\n",
  );
  put(dir, "design/decisions.yaml", ledger);
  const tokens = json(dir, "design/tokens.json");
  delete tokens.font;
  put(dir, "design/tokens.json", `${JSON.stringify(tokens, null, 2)}\n`);
  put(dir, `${TOOL_COPY}/scale.mjs`, `${text(dir, `${TOOL_COPY}/scale.mjs`)}// older\n`);
  put(
    dir,
    STAMP,
    `${JSON.stringify({ version: "0.28.0", tree: treeHash(path.join(dir, TOOL_COPY)) })}\n`,
  );
  return dir;
}

test("upgrade and adopt on a repository of before change no value, leave the gate green, and the typeface waits", () => {
  const dir = before();
  assert.doesNotMatch(text(dir, "design/decisions.yaml"), /font-loaded/);
  const stylesheet = text(dir, "src/index.css");
  const blueprintText = text(dir, "design/blueprint.json");

  const upgraded = run(script("upgrade.mjs"), "--target", dir, "--json");
  assert.equal(upgraded.status, 0, upgraded.stderr || upgraded.stdout);
  assert.equal(text(dir, "src/index.css"), stylesheet);
  // The tokens file gains the typefaces the stylesheet already names: added, nothing changed.
  const tokens = json(dir, "design/tokens.json");
  assert.equal(tokens.font.sans.$value, "Geist Variable");
  assert.equal(gate(dir).status, 0, gate(dir).stderr);

  const adopted = run(script("adopt.mjs"), "--target", dir);
  assert.ok([0, 1].includes(adopted.status), adopted.stderr);
  assert.equal(text(dir, "src/index.css"), stylesheet);
  assert.equal(text(dir, "design/blueprint.json"), blueprintText);
  const green = gate(dir);
  assert.equal(green.status, 0, green.stderr);

  const waiting = fullStatus(dir).waiting.find((item) => item.id === "typeface");
  assert.ok(waiting, "the typeface does not wait");
  assert.equal(waiting.answer, "/design-assembly:new");
  assert.match(waiting.question, /typeface/);
  assert.ok(waiting.recommendation.length > 0 && waiting.basis.length > 0);
  // Said by the command a person runs.
  const said = run(script("status.mjs"), "--target", dir);
  assert.match(said.stdout, /typeface: Which typeface does running text use/);
});

test("a typeface question already on the waiting list is not asked a second time", () => {
  const dir = before();
  put(
    dir,
    "design/waiting/typeface-of-text-and-headings.json",
    `${JSON.stringify({
      id: "typeface-of-text-and-headings",
      kind: "question",
      question: "Which typeface does running text use, and which do headings use?",
      recommendation: "Keep the floor's font for both",
      basis: "For the test.",
      hard_to_undo: false,
      item: "decision:typeface",
    })}\n`,
  );
  const ids = fullStatus(dir).waiting.map((item) => item.id);
  assert.ok(ids.includes("typeface-of-text-and-headings"), ids.join(", "));
  assert.equal(ids.includes("typeface"), false, ids.join(", "));
});

test("an answer the owner gave on the waiting list still waits until the guide writes it into the blueprint", () => {
  const dir = before();
  put(
    dir,
    "design/waiting/typeface-of-text-and-headings.json",
    `${JSON.stringify({
      id: "typeface-of-text-and-headings",
      kind: "question",
      question: "Which typeface does running text use, and which do headings use?",
      recommendation: "Keep the floor's font for both",
      basis: "For the test.",
      hard_to_undo: false,
      item: "decision:typeface",
      answer: "keep",
      by: "Owner Name",
      on: "2026-11-22",
    })}\n`,
  );
  const waiting = fullStatus(dir).waiting.find((item) => item.id === "typeface");
  assert.ok(waiting, "an answer that reached no blueprint is not said");
  assert.equal(waiting.answer, "/design-assembly:new");
  assert.match(
    waiting.basis,
    /answered .*typeface-of-text-and-headings.* by Owner Name on 2026-11-22/,
  );
});

test("a floor that no longer declares the font it was kept for: the gate says so, it does not stop", () => {
  const dir = repository(blueprint({ text_font: "floor", heading_font: "text" }));
  assert.equal(run(script("apply.mjs"), "--target", dir).status, 0);
  put(
    dir,
    "src/index.css",
    text(dir, "src/index.css").replace(
      /\n {2}--font-heading: var\(--font-sans\);\n {2}--font-sans: [^;]+;/,
      "",
    ),
  );
  const { problems } = gateProblems(readState(dir));
  assert.ok(
    problems.some((line) => /tonal-palette: .*names no --font-sans/.test(line)),
    problems.join("\n"),
  );
  const red = gate(dir);
  assert.equal(red.status, 1, red.stderr);
});

test("a typeface the build's font loader sets is no value of the tokens file, and not said to point nowhere", () => {
  const dir = empty();
  put(dir, "src/app/globals.css", theme("var(--font-inter), sans-serif"));
  const { tokens, unresolved } = readTokens(loadStyles(dir, "src/app/globals.css"));
  assert.equal("font" in tokens, false);
  // The type steps point at the framework, which this folder does not install: only fonts are asked.
  assert.deepEqual(
    unresolved.filter((name) => name.startsWith("--font-")),
    [],
  );
});

// ---- the rules page and the brief ---------------------------------------------------------------

const TYPEFACE_CHECKS = {
  typeface: [
    { kind: "value", scope: ":root", variable: "--font-sans", expected: SYSTEM_FONT },
    { kind: "value", scope: ":root", variable: "--font-heading", expected: "var(--font-sans)" },
  ],
  "font-loaded": [{ kind: "font-loaded", variables: ["--font-sans", "--font-heading"] }],
};
const none = () => false;
const typefaceLine = (page) => page.split("\n").find((line) => /typeface/i.test(line)) ?? null;

test("the rules page says the typeface of text and of headings only where the repository has the row", () => {
  const page = rulesPage(
    TYPEFACE_CHECKS,
    none,
    blueprint({ text_font: "system", heading_font: "text" }),
  );
  const line = typefaceLine(page);
  assert.ok(line, "the rules page says nothing of the typeface");
  assert.match(line, /system font/);
  assert.match(line, /--font-sans/);
  assert.match(page, /Never name a typeface in a screen or a component/);
  assert.equal(typefaceLine(rulesPage({}, none, blueprint())), null);
});

test("the brief sheet reads the typeface rule through the same reader as every other rule", () => {
  const page = rulesPage(
    TYPEFACE_CHECKS,
    none,
    blueprint({ text_font: "system", heading_font: "text" }),
  );
  const made = briefRepository({ ".claude/rules/design-assembly.md": page });
  try {
    const slot = brief(made.dir, BUILT).slots.find((item) => item.id === "rules");
    const said = JSON.stringify(slot.answer);
    assert.match(said, /Never name a typeface in a screen or a component/);
  } finally {
    made.remove();
  }
});

// ---- the decision sheet -------------------------------------------------------------------------

test("confirming the proposed typeface on the decision sheet makes both choices the owner's", () => {
  const dir = repository(
    blueprint(
      { text_font: "floor", heading_font: "text" },
      { source: "proposed", answered: false },
    ),
  );
  assert.equal(run(script("apply.mjs"), "--target", dir).status, 0);
  const row = parseLedger(text(dir, "design/decisions.yaml")).find(
    (item) => item.id === "typeface",
  );
  assert.match(row.note, /a person has not confirmed it/);
  const answers = path.join(dir, "answers.txt");
  writeFileSync(answers, "typeface giữ\n");
  const decided = run(
    script("decide.mjs"),
    "--target",
    dir,
    "--answers",
    answers,
    "--by",
    "Owner Name",
    "--on",
    "2026-11-21",
  );
  assert.ok([0, 1].includes(decided.status), decided.stderr);
  const foundations = json(dir, "design/blueprint.json").layers.foundations;
  assert.deepEqual(foundations.confirmed, ["text_font", "heading_font"]);
  assert.deepEqual(foundations.answered.text_font, ANSWERED);
  // The guide run again keeps it the owner's.
  assert.equal(run(script("apply.mjs"), "--target", dir).status, 0);
  const again = parseLedger(text(dir, "design/decisions.yaml")).find(
    (item) => item.id === "typeface",
  );
  assert.doesNotMatch(again.note, /has not confirmed/);
  assert.match(again.note, /answered by Owner Name on 2026-11-21/);
});

// The copy made in `before` can be read by the other tests: it is not written by them.
test("the fixture of before is the shape a 0.28.0 repository has", () => {
  const dir = before();
  const copy = empty();
  cpSync(dir, copy, { recursive: true });
  assert.equal(readBlock(text(copy, "src/index.css")).includes("--font-"), false);
  assert.equal("font" in json(copy, "design/tokens.json"), false);
});
