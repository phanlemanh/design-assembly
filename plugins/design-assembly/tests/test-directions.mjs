// The whole directions the guide shows before any single value: a colour, a type scale and a
// corner radius that go together, each value with what it rests on. The catalog is checked against
// the layers and the principles; the choice of directions as a function; the sheet as a plan and,
// where this repository has a browser, drawn on its own screen in light and in dark.
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

import { DIRECTIONS, directionsFor, SHOW } from "../scripts/directions.mjs";
import { blueprintProblems } from "../scripts/apply.mjs";
import { CATALOG } from "../scripts/principles.mjs";
import { choices, specimenPlan } from "../scripts/specimen.mjs";
import { parseColor } from "../templates/tools/design-assembly/color.mjs";
import {
  CORNER_RADII,
  modularScale,
  typeDeclarations,
} from "../templates/tools/design-assembly/scale.mjs";
import { withoutBlock } from "../templates/tools/design-assembly/theme.mjs";

const PLUGIN = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const ROOT = path.resolve(PLUGIN, "../..");
const LAYERS = JSON.parse(readFileSync(path.join(PLUGIN, "references/layers.json"), "utf8")).layers;
const CHOICES = LAYERS.flatMap((layer) => layer.choices ?? []);
const SPECIMEN = path.join(PLUGIN, "scripts/specimen.mjs");

const made = [];
after(() => made.forEach((dir) => rmSync(dir, { recursive: true, force: true })));

const fixed = (...ids) => ids.map((id) => ({ id, source: "user" }));
// A blueprint while it is designed: the context decided, with these principles; the foundations
// as given.
function designing({ type = "application", principles, foundations } = {}) {
  const context = {
    status: "decided",
    source: "user",
    choice: { product_type: type, conformance_level: "AA" },
    why: "For the test.",
  };
  if (principles) context.principles = principles;
  const layers = {};
  for (const layer of LAYERS)
    layers[layer.id] = layer.built ? { status: "pending" } : { status: "planned" };
  layers.context = context;
  if (foundations) layers.foundations = { status: "decided", why: "For the test.", ...foundations };
  return { version: 1, status: "designing", layers };
}
function repository(blueprint) {
  const dir = mkdtempSync(path.join(tmpdir(), "design-directions-"));
  made.push(dir);
  mkdirSync(path.join(dir, "src"));
  mkdirSync(path.join(dir, "design"));
  writeFileSync(
    path.join(dir, "src/index.css"),
    withoutBlock(readFileSync(path.join(ROOT, "src/index.css"), "utf8")),
  );
  writeFileSync(path.join(dir, "design/blueprint.json"), JSON.stringify(blueprint));
  return dir;
}
const ids = (list) => list.map((direction) => direction.id);
const reason = (direction, key) => direction.reasons.find((item) => item.key === key);
const DESIGN_KEYS = ["type_scale", "type_ratio", "corner_radius"];

test("every direction of the catalog is a whole set of real values, drawn from the principles it follows", () => {
  const seen = new Set();
  const colours = new Set();
  for (const direction of DIRECTIONS) {
    assert.ok(!seen.has(direction.id), `${direction.id} twice`);
    seen.add(direction.id);
    assert.match(direction.id, /^[a-z0-9]+(-[a-z0-9]+)*$/);
    assert.ok(direction.name.trim() && direction.character.trim(), direction.id);
    assert.ok(direction.colour.trim(), `${direction.id}: what its colour does`);
    // The character speaks of type and shape only: a colour kept from the owner is not described.
    assert.doesNotMatch(
      direction.character,
      /\b(blue|teal|violet|green|red|amber|colou?r)\b/i,
      direction.id,
    );
    assert.ok(parseColor(direction.values.source_color), `${direction.id}: colour`);
    colours.add(direction.values.source_color);
    for (const [key, value] of Object.entries(direction.values)) {
      const choice = CHOICES.find((item) => item.key === key);
      assert.ok(choice, `${direction.id}: ${key} is not a choice`);
      if (choice.options) assert.ok(value in choice.options, `${direction.id}: ${key} ${value}`);
    }
    for (const key of ["source_color", "type_scale", "corner_radius"])
      assert.ok(key in direction.values, `${direction.id}: ${key}`);
    assert.equal(
      "type_ratio" in direction.values,
      direction.values.type_scale === "modular",
      `${direction.id}: a ratio goes with a modular scale`,
    );
    assert.ok(direction.follows.length > 0, `${direction.id} follows no principle`);
    for (const id of direction.follows) {
      const principle = CATALOG.find((item) => item.id === id);
      assert.ok(principle, `${direction.id}: ${id}`);
      for (const favour of principle.favours.filter((item) => item.choice in direction.values)) {
        assert.equal(
          direction.values[favour.choice],
          favour.option,
          `${direction.id} goes against ${id}`,
        );
      }
    }
  }
  assert.equal(colours.size, DIRECTIONS.length, "each direction has a colour of its own");
  // With one colour for all, two directions still differ in type or shape.
  for (const a of DIRECTIONS) {
    for (const b of DIRECTIONS.filter((other) => other !== a)) {
      assert.ok(
        DESIGN_KEYS.some((key) => a.values[key] !== b.values[key]),
        `${a.id} and ${b.id}`,
      );
    }
  }
  for (const type of ["application", "content-site"]) {
    assert.ok(
      DIRECTIONS.filter((direction) => direction.suits.includes(type)).length >= SHOW,
      type,
    );
  }
  assert.ok(SHOW >= 2);
});

test("with no principle fixed, the directions that suit the product type come first, in the catalog's order", () => {
  assert.deepEqual(ids(directionsFor(designing())), [
    "workbench",
    "precise-instrument",
    "familiar",
  ]);
  assert.deepEqual(ids(directionsFor(designing({ type: "content-site" }))), [
    "familiar",
    "friendly-service",
    "editorial",
  ]);
  // A principle only proposed does not count.
  const proposed = [{ id: "soft-and-approachable", source: "proposed" }];
  assert.deepEqual(ids(directionsFor(designing({ principles: proposed }))), [
    "workbench",
    "precise-instrument",
    "familiar",
  ]);
});

test("the directions that agree best with the owner's principles are shown, and what goes against one is said", () => {
  const blueprint = designing({
    principles: fixed("soft-and-approachable", "clear-hierarchy", "context-stays-in-view"),
  });
  const shown = directionsFor(blueprint);
  // One point for each fixed principle a direction agrees with, one off for each it goes against;
  // a principle it follows only in part counts nothing. Ties go to the catalog's order.
  assert.deepEqual(ids(shown), ["precise-instrument", "friendly-service", "clear-guide"]);
  const [precise] = shown;
  assert.deepEqual(precise.fit, {
    agrees: ["clear-hierarchy"],
    disagrees: ["soft-and-approachable"],
    mixed: [],
  });
  const ratio = reason(precise, "type_ratio");
  assert.equal(ratio.basis.kind, "principle");
  assert.deepEqual(ratio.basis.principles, ["clear-hierarchy"]);
  const radius = reason(precise, "corner_radius");
  assert.equal(radius.basis.kind, "standard");
  assert.match(
    radius.basis.text,
    /precise and technical, a principle of the catalog the owner has not fixed/,
  );
  assert.match(radius.basis.text, /soft and approachable, which the owner fixed, favours large/);
  // Every value of every direction says what it rests on.
  for (const direction of shown) {
    assert.deepEqual(
      direction.reasons.map((item) => item.key),
      Object.keys(direction.values),
    );
    for (const item of direction.reasons)
      assert.ok(item.basis.text.trim(), `${direction.id} ${item.key}`);
  }
  // Going against a fixed principle costs a place: for a content site that fixed a clear hierarchy,
  // a direction that follows it in part comes before two that go against it.
  assert.deepEqual(
    ids(directionsFor(designing({ type: "content-site", principles: fixed("clear-hierarchy") }))),
    ["clear-guide", "precise-instrument", "editorial"],
  );
  // A fixed principle that backs a value is said to be fixed, even where another pulls away.
  const contested = directionsFor(
    designing({
      principles: fixed("dense-and-scannable", "soft-and-approachable", "clear-hierarchy"),
    }),
  );
  const workbench = contested.find((direction) => direction.id === "workbench");
  assert.deepEqual(workbench.fit, {
    agrees: ["dense-and-scannable"],
    disagrees: ["soft-and-approachable"],
    mixed: ["clear-hierarchy"],
  });
  const small = reason(workbench, "corner_radius");
  assert.equal(small.basis.kind, "principle");
  assert.deepEqual(small.basis.principles, ["dense-and-scannable"]);
  assert.doesNotMatch(small.basis.text, /has not fixed/);
  assert.match(small.basis.text, /soft and approachable, which the owner fixed, favours large/);
  const colour = reason(precise, "source_color");
  assert.match(colour.basis.text, /a starter colour .* the brand colour is the owner's to give/);
});

test("a colour of the owner's own is kept in every direction; one the guide proposed is not", () => {
  const mine = directionsFor(designing(), { colors: ["#0246ff"] });
  assert.ok(mine.every((direction) => direction.values.source_color === "#0246ff"));
  assert.match(
    reason(mine[0], "source_color").basis.text,
    /the colour the owner gave, kept in every direction/,
  );
  assert.match(mine[0].character, /The colour is the owner's\.$/);
  assert.match(directionsFor(designing())[0].character, /Colour: one clear blue for what acts\.$/);
  const chosen = designing({
    foundations: { source: "user", choice: { source_color: "#123456" } },
  });
  assert.ok(
    directionsFor(chosen).every((direction) => direction.values.source_color === "#123456"),
  );
  const confirmed = designing({
    foundations: {
      source: "proposed",
      confirmed: ["source_color"],
      choice: { source_color: "#123456" },
    },
  });
  assert.ok(
    directionsFor(confirmed).every((direction) => direction.values.source_color === "#123456"),
  );
  // The first colour that is one is kept; a word that is no colour is passed over, and said.
  assert.ok(
    directionsFor(designing(), { colors: ["banana", "#336699"] }).every(
      (direction) => direction.values.source_color === "#336699",
    ),
  );
  const bad = specimenPlan(repository(designing()), { section: "direction", colors: ["banana"] });
  assert.equal(bad.sections[0].options.length, 3);
  assert.ok(
    bad.dropped.some((line) => /^banana: not a colour/.test(line)),
    bad.dropped.join("; "),
  );
  const unreadable = designing({
    foundations: { source: "user", choice: { source_color: "banana" } },
  });
  assert.ok(directionsFor(unreadable).every((d) => d.values.source_color !== "banana"));
  const proposed = designing({
    foundations: { source: "proposed", choice: { source_color: "#123456" } },
  });
  assert.ok(
    directionsFor(proposed).every((direction) => direction.values.source_color !== "#123456"),
  );
});

test("the sheet draws each direction whole, in light and in dark, with the values its letter writes", () => {
  const dir = repository(
    designing({
      principles: fixed("soft-and-approachable", "clear-hierarchy", "context-stays-in-view"),
    }),
  );
  const plan = specimenPlan(dir, { section: "direction" });
  assert.deepEqual(
    plan.sections.map((item) => item.id),
    ["direction"],
  );
  const section = plan.sections[0];
  assert.equal(section.key, "direction");
  assert.deepEqual(section.shots, ["ready", "empty"]);
  assert.deepEqual(
    section.options.map((option) => option.letter),
    ["A", "B", "C"],
  );
  for (const option of section.options) {
    assert.deepEqual(option.modes, ["light", "dark"]);
    // What is drawn is what the letter writes: the corner and, for a modular scale, the sizes.
    const values = option.choice;
    assert.ok(
      option.css.includes(`--radius: ${CORNER_RADII[values.corner_radius]};`),
      option.value,
    );
    const sizes = typeDeclarations(modularScale(values.type_ratio ?? "minor-third"));
    const largest = sizes.find((line) => line.startsWith("--text-2xl:"));
    if (values.type_scale === "modular") assert.ok(option.css.includes(largest), option.value);
    else assert.doesNotMatch(option.css, /--text-2xl:/, option.value);
    assert.match(option.css, /--primary:/);
    assert.ok(
      option.notes.some((note) => note.startsWith("follows:")),
      option.value,
    );
  }
  // The modular direction's sizes are on the page with its colour and its corner.
  assert.match(section.options[0].css, /--text-base:/);
  assert.match(section.options[0].label, /precise instrument/);
  const letters = choices(plan).direction;
  assert.deepEqual(letters.A, {
    direction: "precise-instrument",
    source_color: "oklch(0.55 0.11 195)",
    type_scale: "modular",
    type_ratio: "minor-third",
    corner_radius: "extra-small",
  });
  // The value sheets are asked after a direction is picked: the default run does not draw it.
  assert.ok(!specimenPlan(dir).sections.some((item) => item.id === "direction"));
});

test("a direction the blueprint names is one of the catalog", () => {
  const named = (direction) =>
    blueprintProblems(
      designing({
        foundations: { source: "user", direction, choice: { source_color: "#0246ff" } },
      }),
      { preview: true },
    );
  assert.ok(!named("workbench").some((line) => /direction/.test(line)));
  assert.ok(
    named("brutalist").some((line) =>
      /foundations: direction brutalist is not one of references\/directions\.json/.test(line),
    ),
  );
});

test("the guide gives a machine the directions it would show", () => {
  // The preview solves the theme, so the foundations hold a proposal; the sheet needs none.
  const dir = repository(
    designing({
      principles: fixed("soft-and-approachable", "clear-hierarchy", "context-stays-in-view"),
      foundations: { source: "proposed", choice: { source_color: "#0246ff" } },
    }),
  );
  writeFileSync(path.join(dir, "Makefile"), readFileSync(path.join(ROOT, "Makefile"), "utf8"));
  const result = spawnSync(
    execPath,
    [path.join(PLUGIN, "scripts/apply.mjs"), "--target", dir, "--dry-run", "--json"],
    { encoding: "utf8" },
  );
  assert.equal(result.status, 1, result.stderr);
  const data = JSON.parse(result.stdout);
  assert.deepEqual(ids(data.directions), ["precise-instrument", "friendly-service", "clear-guide"]);
  for (const direction of data.directions) {
    assert.deepEqual(Object.keys(direction), [
      "id",
      "name",
      "character",
      "values",
      "follows",
      "fit",
      "reasons",
    ]);
  }
  const shown = spawnSync(
    execPath,
    [path.join(PLUGIN, "scripts/apply.mjs"), "--target", dir, "--dry-run"],
    { encoding: "utf8" },
  );
  assert.match(shown.stdout, /direction precise-instrument: Exact and quiet/);
});

test("on this repository the directions are drawn on its own screen, in light and in dark", (t) => {
  if (!existsSync(path.join(ROOT, "node_modules/@playwright/test"))) {
    t.skip("the reference implementation has no browser installed");
    return;
  }
  const out = "coverage/plugin-directions-test";
  rmSync(path.join(ROOT, out), { recursive: true, force: true });
  const drawn = spawnSync(
    execPath,
    [SPECIMEN, "--target", ROOT, "--section", "direction", "--out", out],
    { encoding: "utf8" },
  );
  assert.equal(drawn.status, 0, drawn.stderr);
  assert.match(drawn.stdout, /sheet: .*plugin-directions-test\/index\.html/, drawn.stdout);
  const page = readFileSync(path.join(ROOT, out, "index.html"), "utf8");
  for (const letter of ["A", "B", "C"]) {
    for (const mode of ["light", "dark"]) {
      const file = `direction-${letter}-ready-${mode}.png`;
      assert.match(page, new RegExp(`src="${file}"`));
      assert.ok(statSync(path.join(ROOT, out, file)).size > 2000, file);
    }
  }
  const written = JSON.parse(readFileSync(path.join(ROOT, out, "choices.json"), "utf8"));
  assert.ok(written.direction.A.direction);
});
