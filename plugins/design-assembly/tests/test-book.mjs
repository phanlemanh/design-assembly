// The book a design system is handed over as: every value on a page is read from the repository,
// the same state gives the same book, and a book says when it no longer matches.
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { execPath } from "node:process";
import { after, test } from "node:test";
import { fileURLToPath } from "node:url";

import {
  belowThreshold,
  collectFacts,
  componentItems,
  factsOf,
  pathsOf,
  renderBook,
  renderWords,
  staleParts,
  WORDS,
} from "../scripts/book.mjs";
import { audit } from "../scripts/audit.mjs";
import { withoutBlock } from "../templates/tools/design-assembly/theme.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const PLUGIN = path.resolve(HERE, "..");
const ROOT = path.resolve(PLUGIN, "../..");
const BOOK = path.join(PLUGIN, "scripts/book.mjs");
const APPLY = path.join(PLUGIN, "scripts/apply.mjs");
const LAYERS = JSON.parse(readFileSync(path.join(PLUGIN, "references/layers.json"), "utf8")).layers;

const made = [];
after(() => made.forEach((dir) => rmSync(dir, { recursive: true, force: true })));

const own = (file) => readFileSync(path.join(ROOT, file), "utf8");
const run = (script, ...args) => spawnSync(execPath, [script, ...args], { encoding: "utf8" });

// A repository the guide has been through, with no browser in it.
function guided() {
  const dir = mkdtempSync(path.join(tmpdir(), "design-assembly-book-"));
  made.push(dir);
  mkdirSync(path.join(dir, "src"));
  mkdirSync(path.join(dir, "design"));
  const choices = {
    context: { product_type: "application", conformance_level: "AA" },
    patterns: { record_panel: "beside" },
    foundations: { source_color: "#ffee00" },
  };
  const layers = {};
  for (const layer of LAYERS) {
    layers[layer.id] = layer.built
      ? { status: "decided", source: "proposed", choice: choices[layer.id], why: "For the test." }
      : { status: "planned" };
  }
  writeFileSync(path.join(dir, "src/index.css"), withoutBlock(own("src/index.css")));
  writeFileSync(path.join(dir, "Makefile"), own("Makefile"));
  writeFileSync(
    path.join(dir, "src/screens.ts"),
    'export const SCREENS = [{ path: "/", states: [{ name: "ready", shows: "x" }, { name: "loading", shows: "y" }] }];\n',
  );
  writeFileSync(path.join(dir, "package.json"), JSON.stringify({ name: "sample-product" }));
  writeFileSync(
    path.join(dir, "design/blueprint.json"),
    JSON.stringify({ version: 1, status: "approved", layers }),
  );
  const applied = run(APPLY, "--target", dir);
  assert.equal(applied.status, 0, applied.stderr);
  return dir;
}

test("the facts are read from the repository, and are the same on every reading", () => {
  const dir = guided();
  const facts = collectFacts(dir);
  assert.deepEqual(collectFacts(dir), facts);
  assert.equal(facts.name, "sample-product");
  assert.equal(facts.level, "AA");
  assert.equal(facts.threshold, 4.5);
  assert.equal(facts.source.color, "#ffee00");
  // A yellow cannot be the primary on a white page: the facts say it moved.
  assert.equal(facts.source.moved.light, true);
  const audited = audit(dir);
  assert.deepEqual(facts.coverage, audited.coverage);
  assert.deepEqual(
    facts.screens.map((screen) => [screen.path, screen.states]),
    [["/", ["ready", "loading"]]],
  );
  assert.deepEqual(facts.kinds, []);
  const tokens = JSON.parse(readFileSync(path.join(dir, "design/tokens.json"), "utf8"));
  assert.equal(facts.colors.length, Object.keys(tokens.color).length);
  assert.equal(facts.palette.length, 14);
  // The type scale and the spacing unit are the framework's: read where the framework is installed.
  const real = collectFacts(ROOT);
  assert.equal(real.type.find((step) => step.step === "sm").px, 14);
  assert.equal(real.type.find((step) => step.step === "sm").line, 20);
  assert.equal(real.spacing, 4);
});

test("a ratio is measured for every pair of text and ground, and the pairs the gate holds are marked", () => {
  const facts = collectFacts(guided());
  const pair = (text, ground) =>
    facts.pairs.find((item) => item.text === text && item.ground === ground);
  assert.ok(pair("foreground", "background").light > 15);
  assert.equal(pair("primary-foreground", "primary").held, true);
  assert.equal(pair("primary", "background").held, true);
  assert.equal(pair("muted-foreground", "muted").held, false);
  assert.ok(pair("primary", "background").light >= 4.5);
  // The floor's own muted text on its muted ground falls short: the book says so, and says that
  // no check holds it.
  const notes = belowThreshold(facts);
  assert.ok(
    notes.some((line) => /muted-foreground on muted reaches 4\.\d\d:1 in light/.test(line)),
  );
  assert.ok(notes.every((line) => /No check holds this pair/.test(line)));
});

test("every colour on a page is one the repository has: none is typed", () => {
  const dir = guided();
  const facts = collectFacts(dir);
  const page = renderBook(facts, { audience: "builder" });
  const known = new Set([
    ...facts.colors.flatMap((color) => [color.light, color.dark]),
    ...facts.palette.map((entry) => entry.color),
    facts.source.color,
  ]);
  // Outside its own stylesheet and its list of facts, the page writes a colour only as a value.
  const body = page.slice(
    page.indexOf("</style>"),
    page.indexOf('<script type="application/json"'),
  );
  const used = [
    ...body.matchAll(/(?:background|color|border-color):(oklch\([^)]*\)|#[0-9a-f]{3,8})/g),
  ].map((match) => match[1]);
  assert.ok(used.length > 40);
  for (const value of used)
    assert.ok(known.has(value), `${value} is on the page and not in the repository`);
});

test("the book needs nothing else, and carries the list of what it shows", () => {
  const facts = collectFacts(guided());
  const page = renderBook(facts);
  assert.doesNotMatch(page, /https?:\/\//);
  assert.doesNotMatch(page, /<script src|<link /);
  assert.deepEqual(factsOf(page), facts);
  assert.deepEqual(staleParts(page, facts), []);
  assert.equal(renderBook(facts), page);
  assert.deepEqual(staleParts("<html></html>", facts), ["the book holds no list of what it shows"]);
});

test("the cover never adds held, claimed and recorded together, and marks what nobody confirmed", () => {
  const facts = collectFacts(guided());
  const page = renderBook(facts);
  const c = facts.coverage;
  assert.match(page, new RegExp(`<p class="big"><b>${c.answered}</b><span>/ ${c.core}</span>`));
  for (const [count, label] of [
    [c.held, WORDS.held],
    [c.claimed, WORDS.claimed],
    [c.recorded, WORDS.recorded],
  ]) {
    assert.ok(page.includes(`<b>${count}</b><span><i class="key`) && page.includes(label));
  }
  assert.ok(facts.unconfirmed.length > 0);
  assert.ok(page.includes(`<b>${facts.unconfirmed.length}</b> ${WORDS.unconfirmed}`));
  // What is open is shown as the question it is.
  for (const item of facts.open.slice(0, 3))
    assert.ok(page.includes(item.question.replaceAll("&", "&amp;")));
});

test("a pair below the contrast ratio is shown as it is, with what it needs", () => {
  const page = renderBook(collectFacts(guided()));
  assert.match(page, /<span class="ratio below">4\.\d\d:1 · needs 4\.5:1<\/span>/);
});

test("for a builder the book adds values and what the gate holds; for a client it does not", () => {
  const facts = collectFacts(guided());
  const client = renderBook(facts, { audience: "client" });
  const builder = renderBook(facts, { audience: "builder" });
  assert.doesNotMatch(client, /<code>oklch\(1 0 0\)<\/code>/);
  assert.match(builder, /<code>oklch\(1 0 0\)<\/code>/);
  assert.doesNotMatch(client, /· held<\/span>/);
  assert.match(builder, /· held<\/span>/);
  assert.doesNotMatch(client, /make design-assembly/);
  assert.match(builder, /make design-assembly/);
  assert.doesNotMatch(client, new RegExp(WORDS.otherRoles));
});

test("the repository's own words replace the labels, and are written as text", () => {
  // The reference implementation has a type scale to set the sample line in.
  const facts = collectFacts(ROOT);
  const page = renderBook(facts, {
    words: { colorTitle: "Màu <b>", tierStates: { reached: "đạt" }, sample: "Ă â ê ô ơ ư đ" },
  });
  assert.match(page, /Màu &lt;b&gt;/);
  assert.match(page, /<em>đạt<\/em>/);
  assert.ok(page.includes("Ă â ê ô ơ ư đ"));
  // A label the file does not give stays as it was.
  assert.ok(page.includes(WORDS.typeQuestion));
});

test("without a browser the book is still drawn: the states are listed, and it says why there is no picture", () => {
  const dir = guided();
  const drawn = run(BOOK, "--target", dir);
  assert.equal(drawn.status, 1, drawn.stderr);
  assert.match(drawn.stdout, /note: no picture was drawn: the repository has no browser/);
  assert.match(drawn.stdout, /note: muted-foreground on muted reaches/);
  const page = readFileSync(path.join(dir, "coverage/design-book/book.html"), "utf8");
  assert.match(page, /<h4>loading<\/h4>/);
  assert.ok(page.includes(WORDS.noPictures));
  assert.doesNotMatch(page, /data:image/);
});

test("a book says when it no longer matches the repository, and which part", () => {
  const dir = guided();
  assert.equal(run(BOOK, "--target", dir).status, 1);
  const book = path.join(dir, "coverage/design-book/book.html");
  const fresh = run(BOOK, "--target", dir, "--check", book);
  assert.equal(fresh.status, 0, fresh.stderr);
  assert.match(fresh.stdout, /the book says what the repository says/);
  // A colour changes in the design tokens file: the book is stale in exactly that part.
  const tokens = path.join(dir, "design/tokens.json");
  writeFileSync(tokens, readFileSync(tokens, "utf8").replace("oklch(0.97 0 0)", "oklch(0.9 0 0)"));
  const stale = run(BOOK, "--target", dir, "--check", book);
  // Stale is an answer, not a refusal: it is printed where answers are, and the call ends with 1.
  assert.equal(stale.status, 1);
  assert.match(
    stale.stdout,
    /no longer says what the repository says \(.*colors.*\): draw it again/,
  );
  assert.equal(run(BOOK, "--target", dir, "--check", path.join(dir, "nope.html")).status, 2);
});

test("the labels can be printed for a repository to translate", () => {
  const printed = run(BOOK, "--target", guided(), "--words-template");
  assert.equal(printed.status, 0, printed.stderr);
  assert.deepEqual(JSON.parse(printed.stdout), WORDS);
});

test("on a repository with a browser every state is drawn at the narrowest and the widest width", (t) => {
  if (!existsSync(path.join(ROOT, "node_modules/@playwright/test"))) {
    t.skip("the reference implementation has no browser installed");
    return;
  }
  const out = "coverage/plugin-book-test";
  rmSync(path.join(ROOT, out), { recursive: true, force: true });
  const drawn = run(BOOK, "--target", ROOT, "--audience", "builder", "--out", out);
  assert.equal(drawn.status, 0, drawn.stderr);
  assert.doesNotMatch(drawn.stdout, /without pictures|drawing stopped/, drawn.stdout);
  const page = readFileSync(path.join(ROOT, out, "book.html"), "utf8");
  const facts = factsOf(page);
  const states = facts.screens.reduce((sum, screen) => sum + screen.states.length, 0);
  // One picture per state and width; the paths and the kinds show some of them again.
  const pictures = new Set(page.match(/<img src="data:image\/png;base64,[^"]{0,400}/g));
  assert.ok(pictures.size >= states, String(pictures.size));
  // The components are drawn from the repository's own source, each alone.
  for (const name of ["Button", "Badge", "Input"]) {
    assert.match(page, new RegExp(`<h3 class="component-name">${name}</h3>`), name);
    assert.match(page, new RegExp(`<img src="data:image/png;base64,[^"]+" alt="${name}" />`), name);
  }
  // A part that works only inside another component is named, not drawn.
  assert.match(page, /<li><b>Dialog<\/b> <span>[^<]*DialogContent/);
  assert.doesNotMatch(page, /<h3 class="component-name">DialogContent<\/h3>/);
  assert.equal(page.match(/<figure class="(narrow|wide)">/g).length, states * 2);
  // How a state is reached is told in the repository's own words for its buttons.
  assert.match(page, /bấm «Thêm mục»/);
  // The paths: the states reached by data alone sit side by side, the rest follow an action.
  assert.match(page, /<div class="strip"><div class="node"><img /);
  assert.match(page, /<div class="rows"><div class="kid"><span class="edge">/);
  assert.deepEqual(staleParts(page, collectFacts(ROOT)), []);
});

test("a page's own words become markup, and nothing in them is taken as markup", () => {
  const words = renderWords(
    [
      "Intro line one",
      "and line two with `code` and **weight**.",
      "",
      "## Order of the parts",
      "",
      "1. The title: one <h1>.",
      "2. The filter,",
      "   only when there are items.",
      "",
      "- a point",
      "",
      "```tsx",
      "<Table />",
      "```",
    ].join("\n"),
  );
  assert.match(
    words,
    /<p>Intro line one and line two with <code>code<\/code> and <b>weight<\/b>\.<\/p>/,
  );
  assert.match(words, /<h4>Order of the parts<\/h4>/);
  assert.match(
    words,
    /<ol><li>The title: one &lt;h1&gt;\.<\/li><li>The filter, only when there are items\.<\/li><\/ol>/,
  );
  assert.match(words, /<ul><li>a point<\/li><\/ul>/);
  assert.match(words, /<pre>&lt;Table \/&gt;<\/pre>/);
  assert.doesNotMatch(renderWords("```\ncode\n```", { code: false }), /<pre>/);
});

test("the states of a screen hang under the state their own steps pass through", () => {
  const screen = {
    path: "/",
    states: ["ready", "empty", "ask", "saving", "failed", "added", "undone"],
  };
  const ask = { press: "Delete A" };
  const yes = { press: "Delete" };
  const add = { press: "Add" };
  const how = {
    "/|ready": { scenario: null, steps: [] },
    "/|empty": { scenario: "empty", steps: [] },
    "/|ask": { scenario: null, steps: [ask] },
    "/|saving": { scenario: "slow", steps: [ask, yes] },
    "/|failed": { scenario: "fail", steps: [ask, yes] },
    "/|added": { scenario: "empty", steps: [add] },
    "/|undone": { scenario: "empty", steps: [add, { press: "Undo" }] },
  };
  const roots = pathsOf(screen, how);
  const shape = (nodes) => nodes.map((node) => [node.name, node.edge.length, shape(node.children)]);
  assert.deepEqual(shape(roots), [
    ["ready", 0, []],
    ["empty", 0, []],
    // Two states one more press away hang under the state that press starts from.
    [
      "ask",
      1,
      [
        ["saving", 1, []],
        ["failed", 1, []],
      ],
    ],
    ["added", 1, [["undone", 1, []]]],
  ]);
  // A state whose earlier step no listed state stops at keeps all its steps on its own edge.
  const lone = pathsOf(
    { path: "/", states: ["deep"] },
    { "/|deep": { scenario: "x", steps: [ask, yes] } },
  );
  assert.equal(lone[0].edge.length, 2);
});

test("a kind of screen is shown with its own words, and a client is spared the code", () => {
  const facts = collectFacts(ROOT);
  assert.equal(facts.kinds.length, 1);
  assert.match(facts.kinds[0].body, /## /);
  assert.equal(facts.screens[0].file, facts.kinds[0].reference);
  const client = renderBook(facts, { audience: "client" });
  const builder = renderBook(facts, { audience: "builder" });
  assert.ok(client.includes(`<h3 class="kind-name">${facts.kinds[0].name}</h3>`));
  assert.doesNotMatch(client, /<pre>/);
  assert.match(builder, /<pre>/);
  // The page of the kind is part of what the book says: change it and the book is stale.
  const changed = { ...facts, kinds: [{ ...facts.kinds[0], body: "Something else." }] };
  assert.deepEqual(staleParts(renderBook(facts), changed), ["kinds"]);
});

test("an open question is asked in the repository's own language when it gives one", () => {
  const facts = { ...collectFacts(guided()) };
  facts.open = [{ id: "record-panel", question: "How does a record open beside a list?" }];
  assert.ok(renderBook(facts).includes("How does a record open beside a list?"));
  const own = renderBook(facts, { words: { questions: { "record-panel": "Hồ sơ mở thế nào?" } } });
  // What a person reads, without the list of facts the book carries at its end.
  const read = own.slice(0, own.indexOf('<script type="application/json"'));
  assert.ok(read.includes("Hồ sơ mở thế nào?"));
  assert.ok(!read.includes("How does a record open beside a list?"));
});

test("a component is drawn once for each thing it can vary by; parts are not drawn alone", () => {
  const items = componentItems([
    {
      name: "Button",
      file: "src/ui/button.tsx",
      variants: ["variant=default", "variant=outline", "size=default", "size=icon-sm"],
      control: true,
    },
    { name: "Input", file: "src/ui/input.tsx", variants: [], control: true },
    { name: "AlertTitle", file: "src/ui/alert.tsx", variants: [], control: false },
  ]);
  assert.deepEqual(
    items.map((item) => item.id),
    ["src/ui/button.tsx|Button", "src/ui/input.tsx|Input"],
  );
  const [button, input] = items;
  assert.deepEqual(
    button.rows.map((row) => [row.axis, row.cells.map((cell) => cell.label)]),
    [
      ["variant", ["variant=default", "variant=outline"]],
      ["size", ["size=default", "size=icon-sm"]],
    ],
  );
  // One thing varies in a cell; the rest stay at the component's own default.
  assert.deepEqual(button.rows[0].cells[1].props, { variant: "outline" });
  assert.equal(button.rows[0].cells[1].text, "outline");
  assert.equal(button.rows[1].cells[1].text, "+");
  assert.deepEqual(input.rows, [
    { axis: null, cells: [{ label: "Input", props: {}, text: "Input" }] },
  ]);
});

test("the components of the book are the component manifest's, and changing it makes a book stale", () => {
  const facts = collectFacts(ROOT);
  const manifest = JSON.parse(
    readFileSync(path.join(ROOT, "design/component-registry.json"), "utf8"),
  );
  assert.deepEqual(
    facts.components.map((entry) => entry.name),
    manifest.components.map((entry) => entry.name),
  );
  const page = renderBook(facts);
  const fewer = { ...facts, components: facts.components.slice(1) };
  assert.deepEqual(staleParts(page, fewer), ["components"]);
  // Without pictures the families are still named, and the sheet says why nothing is drawn.
  assert.ok(page.includes(WORDS.noPictures));
  assert.ok(page.includes(`<ul class="parts"><li><b>${manifest.components[0].name}</b>`));
});

test("on a repository the guide did not build, the book says only what the repository has", () => {
  const facts = { ...collectFacts(guided()), widths: [], font: null };
  facts.kinds = [
    { name: "grid", task: "Read rows", reference: "src/demo/showcase.tsx", body: "## Use" },
  ];
  facts.components = [
    { name: "Button", file: "src/ui/button.tsx", variants: [], control: false, min_height: null },
  ];
  const page = renderBook(facts, { audience: "builder" });
  const read = page.slice(0, page.indexOf('<script type="application/json"'));
  // No width is named that the repository did not list.
  assert.ok(read.includes(WORDS.noWidths));
  assert.doesNotMatch(read, /1440 px/);
  // A file that is no listed screen is not called the reference screen.
  assert.ok(read.includes(WORDS.runningSample));
  // Names that could not be drawn are a list, not "parts that work only inside another".
  assert.ok(read.includes(WORDS.listedTitle));
  assert.ok(!read.includes(WORDS.partsLede));
  // Only commands the tool itself installs.
  assert.doesNotMatch(read, /make design-audit/);
  assert.match(read, /make design-tokens/);
});

test("a note is printed only for a pair the colour sheet draws", () => {
  const facts = collectFacts(guided());
  facts.pairs.push({
    text: "warning-foreground",
    ground: "warning",
    light: 1.7,
    dark: 1.9,
    held: false,
  });
  const notes = belowThreshold(facts);
  assert.ok(!notes.some((line) => line.includes("warning")));
  assert.ok(notes.some((line) => line.includes("muted-foreground on muted")));
});

test("when nothing could be drawn, the book says the reason, not always the browser", () => {
  const facts = collectFacts(guided());
  for (const [unable, word] of [
    ["screens", WORDS.noPicturesScreens],
    ["stopped", WORDS.noPicturesStopped],
    ["browser", WORDS.noPictures],
  ]) {
    const page = renderBook(facts, { unable });
    assert.ok(page.includes(word), unable);
    // A repository with a browser is never told it has none.
    if (unable !== "browser") assert.ok(!page.includes(WORDS.noPictures), unable);
  }
});

test("a repository that keeps its screens elsewhere is told so, not that it lacks a browser", () => {
  const dir = guided();
  rmSync(path.join(dir, "src/screens.ts"));
  const drawn = run(BOOK, "--target", dir);
  assert.equal(drawn.status, 1, drawn.stderr);
  assert.match(drawn.stdout, /note: no picture was drawn: there is no src\/screens\.ts/);
  const page = readFileSync(path.join(dir, "coverage/design-book/book.html"), "utf8");
  assert.ok(page.includes(WORDS.noPicturesScreens));
  assert.ok(!page.includes(WORDS.noPictures));
});

test("the distances drawn are a few multiples of the unit, and the book does not claim they are all", () => {
  // A repository's own lint may allow half steps and many more; the book reads only the unit.
  const facts = collectFacts(ROOT);
  assert.ok(facts.spacing, "this repository declares its unit of distance");
  const page = renderBook(facts);
  assert.ok(!page.includes("is one of these steps"));
  assert.ok(page.includes("These are examples: the repository may allow other steps."));
});
