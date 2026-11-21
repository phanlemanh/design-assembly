// The specimen sheet: the choices of foundations shown on the repository's own screen. What it
// shows is decided without a browser, and is the same on every run; drawing it needs one.
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { execPath } from "node:process";
import { after, test } from "node:test";
import { fileURLToPath } from "node:url";

import {
  around,
  choices,
  colorCandidates,
  decided,
  renderSheet,
  shotsOf,
  specimenPlan,
} from "../scripts/specimen.mjs";
import { contrast, parseColor } from "../templates/tools/design-assembly/color.mjs";
import { CORNER_RADII, RATIOS } from "../templates/tools/design-assembly/scale.mjs";
import { buildTheme, withoutBlock } from "../templates/tools/design-assembly/theme.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const PLUGIN = path.resolve(HERE, "..");
const ROOT = path.resolve(PLUGIN, "../..");
const SPECIMEN = path.join(PLUGIN, "scripts/specimen.mjs");
const STARTERS = JSON.parse(
  readFileSync(path.join(PLUGIN, "references/source-colors.json"), "utf8"),
);

const made = [];
after(() => made.forEach((dir) => rmSync(dir, { recursive: true, force: true })));

const own = (file) => readFileSync(path.join(ROOT, file), "utf8");
function repository(blueprint) {
  const dir = mkdtempSync(path.join(tmpdir(), "design-assembly-specimen-"));
  made.push(dir);
  mkdirSync(path.join(dir, "src"));
  mkdirSync(path.join(dir, "design"));
  writeFileSync(path.join(dir, "src/index.css"), withoutBlock(own("src/index.css")));
  if (blueprint) writeFileSync(path.join(dir, "design/blueprint.json"), JSON.stringify(blueprint));
  return dir;
}
const layers = (context, foundations) => ({
  version: 1,
  status: "designing",
  layers: {
    context: context ? { status: "decided", choice: context } : { status: "pending" },
    foundations: foundations ? { status: "decided", choice: foundations } : { status: "pending" },
  },
});
const run = (...args) => spawnSync(execPath, [SPECIMEN, ...args], { encoding: "utf8" });
const section = (plan, id) => plan.sections.find((item) => item.id === id);

test("what is not decided yet is shown with the floor's answer, and said", () => {
  const nothing = decided({});
  assert.equal(nothing.conformanceLevel, "AA");
  assert.equal(nothing.typeScale, "standard");
  assert.deepEqual(nothing.assumed, ["conformance level AA", "product type application"]);
  const some = decided(layers({ product_type: "content-site", conformance_level: "AAA" }));
  assert.equal(some.conformanceLevel, "AAA");
  assert.deepEqual(some.assumed, []);
});

test("the source colors shown: the person's own first, then the decided one, then starters apart in hue", () => {
  const state = decided(layers(null, { source_color: "#0246ff" }));
  const { shown, problems } = colorCandidates(state, ["#aa3300", "not-a-colour"]);
  assert.deepEqual(problems, ["not-a-colour: not a colour written as #rrggbb or oklch(L C H)"]);
  assert.deepEqual(
    shown.slice(0, 2).map((item) => [item.color, item.label]),
    [
      ["#aa3300", "yours"],
      ["#0246ff", "decided so far"],
    ],
  );
  assert.equal(shown.length, STARTERS.show);
  // No starter sits close in hue to a colour already on the sheet: the blue one is left out.
  assert.ok(!shown.some((item) => item.label === "starter: blue"));
  for (const item of shown.slice(2)) {
    for (const other of shown.filter((x) => x !== item)) {
      const gap = Math.abs(item.hue - other.hue);
      assert.ok(
        Math.min(gap, 360 - gap) >= STARTERS.apart_degrees,
        `${item.label} near ${other.label}`,
      );
    }
  }
  // With nothing decided, the list is the starters in their own order.
  const fresh = colorCandidates(decided({})).shown;
  assert.deepEqual(
    fresh.map((item) => item.label),
    STARTERS.starters.slice(0, STARTERS.show).map((item) => `starter: ${item.name}`),
  );
});

test("one step around a colour moves by fixed amounts, and a step a screen cannot show is left out", () => {
  const steps = around("oklch(0.55 0.1 200)");
  const by = Object.fromEntries(steps.shown.map((step) => [step.label, parseColor(step.color)]));
  assert.equal(steps.shown[0].color, "oklch(0.55 0.1 200)");
  assert.equal(Math.round(by["hue 20 degrees on"].h), 220);
  assert.equal(Math.round(by["hue 20 degrees back"].h), 180);
  assert.equal(Number(by.lighter.l.toFixed(2)), 0.61);
  assert.equal(Number(by.darker.l.toFixed(2)), 0.49);
  assert.ok(by.softer.c < 0.1);
  // The blue of the reference implementation is already as strong as a screen shows it.
  const full = around("#0246ff");
  assert.deepEqual(full.same, ["stronger"]);
  assert.ok(!full.shown.some((step) => step.label === "stronger"));
  // A step an eye could not tell from the colour itself is left out too.
  const green = around("oklch(0.55 0.15 150)");
  assert.ok(green.same.includes("stronger"), JSON.stringify(green.same));
  assert.equal(around("nonsense"), null);
});

test("every colour option on the sheet already reaches the contrast ratio, in light and in dark", () => {
  for (const level of ["AA", "AAA"]) {
    const dir = repository(layers({ product_type: "application", conformance_level: level }));
    const css = readFileSync(path.join(dir, "src/index.css"), "utf8");
    const plan = specimenPlan(dir, { section: "color", colors: ["#ffee00"] });
    const min = level === "AA" ? 4.5 : 7;
    const options = section(plan, "color").options;
    assert.ok(options.length >= 3);
    for (const option of options) {
      const theme = buildTheme({ sourceColor: option.value, conformanceLevel: level }, css);
      for (const mode of theme.modes) {
        assert.ok(
          contrast(mode.primary, mode.background) >= min,
          `${option.value} ${mode.selector}`,
        );
        assert.ok(
          contrast(mode.onPrimary, mode.primary) >= min,
          `${option.value} ${mode.selector}`,
        );
      }
      // What the card puts on the page is the block the guide would write for that colour.
      assert.match(option.css, /--primary: oklch\(/);
      assert.equal(option.swatches.length, 2);
      assert.ok(option.notes.every((note) => /:1 on the background/.test(note)));
    }
    // A yellow cannot be the primary as it is: the card says it moved.
    assert.match(options[0].notes[0], /moved from the source to reach the contrast ratio/);
  }
});

test("the type scale shows the standard sizes and the ratios that suit the product type", () => {
  const tool = repository(layers({ product_type: "application", conformance_level: "AA" }));
  const options = section(specimenPlan(tool, { section: "type" }), "type").options;
  assert.deepEqual(
    options.map((option) => option.value),
    ["standard", "modular, major-second", "modular, minor-third"],
  );
  assert.match(options[2].notes.join(" "), /text-xs is 11px: below the floor's smallest size/);
  assert.equal(options[1].steps.length, 9);
  const reading = repository(layers({ product_type: "content-site", conformance_level: "AA" }));
  assert.deepEqual(
    section(specimenPlan(reading, { section: "type" }), "type").options.map((o) => o.value),
    ["standard", "modular, major-third", "modular, perfect-fourth"],
  );
  const every = section(specimenPlan(tool, { section: "type", allRatios: true }), "type").options;
  assert.equal(every.length, 1 + Object.keys(RATIOS).length);
});

test("the corner radius shows every step of the shape scale", () => {
  const dir = repository();
  const options = section(specimenPlan(dir, { section: "radius" }), "radius").options;
  assert.deepEqual(
    options.map((option) => option.value),
    Object.keys(CORNER_RADII),
  );
  assert.match(options[1].css, /--radius: 0rem;/);
});

test("a letter stands for exactly what the blueprint takes", () => {
  const dir = repository(layers({ product_type: "application", conformance_level: "AA" }));
  const picked = choices(specimenPlan(dir));
  assert.deepEqual(picked.radius.B, { corner_radius: "none" });
  assert.deepEqual(picked.type.A, { type_scale: "standard" });
  assert.deepEqual(picked.type.B, { type_scale: "modular", type_ratio: "major-second" });
  assert.deepEqual(picked.color.A, { source_color: STARTERS.starters[0].color });
});

test("the plan is the same on every run, and writes nothing to the repository", () => {
  const dir = repository(
    layers({ product_type: "application", conformance_level: "AA" }, { source_color: "#0246ff" }),
  );
  const first = run("--target", dir, "--plan");
  const second = run("--target", dir, "--plan");
  assert.equal(first.status, 0, first.stderr);
  assert.equal(first.stdout, second.stdout);
  assert.ok(!existsSync(path.join(dir, "coverage")));
  assert.deepEqual(Object.keys(JSON.parse(first.stdout).choices), [
    "color",
    "type",
    "radius",
    "text-font",
    "heading-font",
    "neutral",
    "status",
  ]);
});

test("the review section shows the screen as it is beside what the blueprint decides", () => {
  const dir = repository(
    layers({ product_type: "application", conformance_level: "AA" }, { source_color: "#0246ff" }),
  );
  const review = section(specimenPlan(dir, { section: "review" }), "review");
  assert.deepEqual(
    review.options.map((option) => option.value),
    ["now", "decided"],
  );
  assert.equal(review.options[0].css, "");
  // With no colour decided there is nothing to compare.
  assert.equal(specimenPlan(repository(), { section: "review" }).sections.length, 0);
});

test("the states a picture needs are read from the registry: the first screen, without steps", () => {
  const registry = [
    "export const SCREENS = [",
    '  { path: "/items", states: [',
    '    { name: "ready", shows: L.a },',
    '    { name: "empty", scenario: "none", shows: L.b },',
    '    { name: "confirm", scenario: "slow", steps: ask, shows: L.c },',
    "  ] },",
    "];",
  ].join("\n");
  assert.deepEqual(shotsOf(registry), { ready: "/items", empty: "/items?scenario=none" });
  assert.deepEqual(shotsOf(""), { ready: "/" });
});

test("the sheet is a page with a letter on every card, and text from the repository is escaped", () => {
  const dir = repository(layers({ product_type: "application", conformance_level: "AA" }));
  const plan = specimenPlan(dir, { section: "radius" });
  plan.sections[0].options[0].label = "<b>floor</b>";
  const page = renderSheet(plan, {
    radius: { A: [{ file: "radius-A-ready-light.png", what: "ready, light" }] },
  });
  assert.match(page, /<b>A<\/b><span>&lt;b&gt;floor&lt;\/b&gt;<\/span>/);
  assert.match(page, /<img src="radius-A-ready-light\.png" alt="A, ready, light" \/>/);
  assert.match(page, /conformance level AA/);
  assert.equal(renderSheet(plan, {}), renderSheet(plan, {}));
});

test("without a browser in the repository the same options are printed in words", () => {
  const dir = repository(layers({ product_type: "application", conformance_level: "AA" }));
  const said = run("--target", dir, "--section", "radius");
  assert.equal(said.status, 0, said.stderr);
  assert.match(said.stdout, /corner radius: How round are the corners\?/);
  assert.match(said.stdout, /^ {2}B {2}none \(0rem\) {2}\[none\]$/m);
  assert.match(said.stdout, /no sheet was drawn: the repository has no browser to draw with/);
});

test("on a repository with a browser the sheet is drawn from its own screen", (t) => {
  if (!existsSync(path.join(ROOT, "node_modules/@playwright/test"))) {
    t.skip("the reference implementation has no browser installed");
    return;
  }
  const out = "coverage/plugin-specimen-test";
  rmSync(path.join(ROOT, out), { recursive: true, force: true });
  const drawn = run("--target", ROOT, "--section", "radius", "--out", out);
  assert.equal(drawn.status, 0, drawn.stderr);
  assert.match(drawn.stdout, /sheet: .*plugin-specimen-test\/index\.html/, drawn.stdout);
  const page = readFileSync(path.join(ROOT, out, "index.html"), "utf8");
  for (const letter of ["A", "F"]) {
    const file = `radius-${letter}-ready-light.png`;
    assert.match(page, new RegExp(`src="${file}"`));
    assert.ok(statSync(path.join(ROOT, out, file)).size > 2000, file);
  }
  assert.ok(statSync(path.join(ROOT, out, "sheet.png")).size > 2000);
  assert.deepEqual(
    JSON.parse(readFileSync(path.join(ROOT, out, "choices.json"), "utf8")).radius.C,
    {
      corner_radius: "extra-small",
    },
  );
});

test("how a record opens is offered as the list-detail layout, the recommendation first", () => {
  const application = specimenPlan(
    repository(layers({ product_type: "application", conformance_level: "AA" })),
    { section: "record" },
  );
  const record = section(application, "record");
  assert.equal(record.key, "record_panel");
  assert.deepEqual(
    record.options.map((option) => [option.letter, option.value]),
    [
      ["A", "beside"],
      ["B", "over"],
      ["C", "in-place"],
    ],
  );
  assert.deepEqual(choices(application).record.C, { record_panel: "in-place" });
  // Every option says what it is, from the same list the guide records.
  for (const option of record.options) assert.ok(option.notes.length > 0, option.value);
  // A content site reads records as pages: that is offered first there.
  const site = specimenPlan(
    repository(layers({ product_type: "content-site", conformance_level: "AA" })),
    { section: "record" },
  );
  assert.equal(section(site, "record").options[0].value, "in-place");
  // It is asked on its own: the full sheet of foundations does not carry it.
  const all = specimenPlan(repository(layers()), {});
  assert.equal(section(all, "record"), undefined);
});

test("on a repository whose screen opens a record, each arrangement is drawn at two widths", (t) => {
  if (!existsSync(path.join(ROOT, "node_modules/@playwright/test"))) {
    t.skip("the reference implementation has no browser installed");
    return;
  }
  const out = "coverage/plugin-specimen-record-test";
  rmSync(path.join(ROOT, out), { recursive: true, force: true });
  const drawn = run("--target", ROOT, "--section", "record", "--out", out);
  assert.equal(drawn.status, 0, drawn.stderr);
  assert.match(drawn.stdout, /sheet: .*plugin-specimen-record-test\/index\.html/, drawn.stdout);
  for (const letter of ["A", "B", "C"]) {
    for (const width of [1440, 320]) {
      const file = `record-${letter}-${width}.png`;
      assert.ok(statSync(path.join(ROOT, out, file)).size > 2000, file);
    }
  }
  // The arrangement was changed as the page was served: the repository's own file is untouched.
  assert.match(own("src/components/record-panel.tsx"), /RECORD_LAYOUT: RecordLayout = "/);
});

test("a repository where no screen opens a record gets the options in words, and why", (t) => {
  if (!existsSync(path.join(ROOT, "node_modules/@playwright/test"))) {
    t.skip("the reference implementation has no browser installed");
    return;
  }
  const dir = repository(layers({ product_type: "application", conformance_level: "AA" }));
  const said = run("--target", dir, "--section", "record");
  assert.equal(said.status, 0, said.stderr);
  assert.match(said.stdout, /^ {2}A {2}beside the list, where both fit {2}\[beside\]$/m);
  assert.match(said.stdout, /no sheet was drawn: /);
});
