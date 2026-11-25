// Accepting by eye (spec 0016, criterion 19): for a change of the family's core whose value can be
// seen, the repository's own screen is drawn before and after, in light and in dark, on the
// specimen sheet; a repository with no browser gets the values before and after in words, and why
// there is no picture. What is drawn is decided without a browser and is the same on every run;
// drawing it needs one, and that test is skipped where the test machine has none.
import assert from "node:assert/strict";
import { existsSync, readFileSync, rmSync, statSync } from "node:fs";
import path from "node:path";
import { after, test } from "node:test";

import { eyeLines, eyePlan, lookByEye, looksOf } from "../scripts/core-eye.mjs";
import { renderSheet } from "../scripts/specimen.mjs";

import {
  BRAND,
  change,
  cleanup,
  core,
  guided,
  member,
  OTHER,
  put,
  ROOT,
  snapshot,
  text,
} from "./helpers/core-family.mjs";

after(cleanup);

// Changes as `core --moved` gives them, for a repository that holds the earlier values.
const colour = {
  id: "source-color",
  change: "value",
  kind: "value",
  was: { value: BRAND, hold: "locked" },
  now: { value: OTHER, hold: "locked" },
  held_here: BRAND,
  would: "ask",
};
const scale = {
  id: "type-scale-values",
  change: "value",
  kind: "value",
  was: { value: "standard", hold: "default" },
  now: { value: "modular major-third", hold: "default" },
  held_here: "standard",
  would: "keep",
};

test("what a picture shows is decided without a browser: the colour and the type scale, before and after, light and dark", () => {
  const dir = guided();
  const looks = looksOf([colour, scale]);
  assert.deepEqual(
    looks.map((look) => [look.id, look.before, look.here, look.after, look.drawn]),
    [
      ["source-color", BRAND, BRAND, OTHER, true],
      ["type-scale-values", "standard", "standard", "modular major-third", true],
    ],
  );
  const plan = eyePlan(dir, looks);
  assert.deepEqual(
    plan.sections.map((section) => section.id),
    ["source-color", "type-scale-values"],
  );
  for (const section of plan.sections) {
    const [before, after] = section.options;
    assert.equal(before.letter, "A");
    assert.equal(before.css, "", "before is the repository as it is: nothing is put on the page");
    assert.equal(after.letter, "B");
    assert.notEqual(after.css, "");
    for (const option of [before, after]) assert.deepEqual(option.modes, ["light", "dark"]);
  }
  // The colour is solved as the guide would write it, in light and in dark.
  const after = plan.sections[0].options[1];
  assert.match(after.css, /--primary:/);
  assert.match(after.css, /\.dark/);
  assert.equal(after.value, OTHER);
  assert.equal(after.swatches.length, 2);
  // The type scale is the one the gate would hold.
  assert.match(plan.sections[1].options[1].css, /--text-base:/);
  // The same input gives the same sheet, and the sheet says in its own words what it shows.
  assert.equal(renderSheet(plan, {}), renderSheet(eyePlan(dir, looks), {}));
  assert.match(
    renderSheet(plan, {}),
    /beside the same screen with the answer of the family core, in light and in dark/,
  );
  // Looking at one answer only.
  assert.deepEqual(
    looksOf([colour, scale], ["type-scale-values"]).map((look) => look.id),
    ["type-scale-values"],
  );
});

test("a change no picture shows is listed in words, with why", () => {
  const cases = [
    [
      { ...colour, now: { value: BRAND, hold: "default" } },
      /its value did not change, only its hold/,
    ],
    [
      { ...colour, would: "holds", held_here: OTHER },
      /this repository holds the core's value already/,
    ],
    [
      {
        id: "failed-action",
        change: "hold",
        kind: "rule",
        was: { value: "x", hold: "locked" },
        now: { value: "y", hold: "locked" },
      },
      /a rule has no value to draw/,
    ],
    [
      {
        id: "record-panel",
        change: "value",
        kind: "value",
        was: { value: "beside", hold: "locked" },
        now: { value: "over", hold: "locked" },
      },
      /how a record opens is an arrangement/,
    ],
    [
      {
        id: "test-screen-sizes",
        change: "value",
        kind: "value",
        was: { value: [320], hold: "default" },
        now: { value: [360], hold: "default" },
      },
      /change no screen/,
    ],
    [
      {
        id: "table-density",
        change: "retired",
        kind: "rule",
        was: { value: "x", hold: "default" },
        now: null,
      },
      /the core no longer holds it/,
    ],
    [{ ...scale, now: { value: "modular no-such-ratio", hold: "default" } }, null],
  ];
  for (const [given, why] of cases) {
    const [look] = looksOf([given]);
    if (why === null) {
      // A value the plugin cannot draw is found when the sheet is planned, and said.
      const plan = eyePlan(guided(), [look]);
      assert.deepEqual(plan.sections, []);
      assert.match(plan.dropped[0].why, /is not a type scale this plugin draws/);
      continue;
    }
    assert.equal(look.drawn, false, given.id);
    assert.match(look.why, why, given.id);
  }
});

test("on a repository with no browser the values before and after are listed, with why there is no picture", async () => {
  const { dir, place, list } = member({ make: guided, colour: BRAND });
  change(place, list, "source-color", ["--value", OTHER, "--why", "the brand was redrawn"]);
  change(place, list, "record-panel", [
    "--hold",
    "default",
    "--why",
    "one app opens records in place",
  ]);
  const before = snapshot(dir);
  const said = core(["--target", dir, "--moved", "--draw"], list);
  assert.equal(said.status, 1, said.stderr);
  assert.match(said.stdout, /before and after, by value:/);
  assert.match(
    said.stdout,
    new RegExp(
      `source-color: ${BRAND} in the copy, ${BRAND} held here; ${OTHER} in the core$`,
      "m",
    ),
  );
  assert.match(
    said.stdout,
    /record-panel: beside in the copy, beside held here; beside in the core; no picture: its value did not change, only its hold/,
  );
  assert.match(
    said.stdout,
    /no picture was drawn: the repository has no browser to draw with .*\. The values before and after are the ones above\./,
  );
  // Nothing of the repository was written to look.
  assert.deepEqual(snapshot(dir), before);
  // As data, and for one answer only.
  const data = JSON.parse(
    core(["--target", dir, "--moved", "--draw", "--only", "source-color", "--json"], list).stdout,
  );
  assert.deepEqual(
    data.eye.looks.map((look) => look.id),
    ["source-color"],
  );
  assert.equal(data.eye.sheet, null);
  assert.match(data.eye.why, /no browser to draw with/);
  // An answer that did not change is said so, and nothing is drawn where the core did not move.
  const none = core(["--target", dir, "--moved", "--draw", "--only", "type-scale-values"], list);
  assert.match(
    none.stdout,
    /type-scale-values: did not change in the core, so there is nothing to look at/,
  );
  // A repository whose tool data names another stylesheet is drawn from that one: the sheet is
  // planned from it, and what stops the drawing is the browser, not the path.
  const sheet = text(dir, "src/index.css");
  const theme = JSON.parse(text(dir, "design/theme.json"));
  put(dir, "src/app/globals.css", sheet);
  put(
    dir,
    "design/theme.json",
    `${JSON.stringify({ ...theme, stylesheet: "src/app/globals.css" })}\n`,
  );
  rmSync(path.join(dir, "src/index.css"));
  assert.match(eyePlan(dir, looksOf([colour])).sections[0].options[1].css, /--primary:/);
  assert.match((await lookByEye(dir, [colour])).why, /no browser to draw with/);
  // Without a stylesheet there is no screen to draw.
  rmSync(path.join(dir, "src/app/globals.css"));
  const bare = await lookByEye(dir, [colour]);
  assert.equal(bare.sheet, null);
  assert.match(bare.why, /src\/app\/globals\.css is missing: there is no screen to draw/);
  assert.match(eyeLines(bare).at(-1), /no picture was drawn: src\/app\/globals\.css is missing/);
});

test("on a repository with a browser its own screen is drawn before and after, in light and in dark", async (t) => {
  if (!existsSync(path.join(ROOT, "node_modules/@playwright/test"))) {
    t.skip("the reference implementation has no browser installed");
    return;
  }
  const out = "coverage/plugin-core-eye-test";
  rmSync(path.join(ROOT, out), { recursive: true, force: true });
  const sheet = text(ROOT, "src/index.css");
  const drawn = await lookByEye(ROOT, [colour, scale], { out });
  assert.equal(drawn.why, null, drawn.why);
  assert.equal(drawn.sheet, path.join(ROOT, out, "index.html"));
  const page = readFileSync(drawn.sheet, "utf8");
  for (const id of ["source-color", "type-scale-values"]) {
    for (const letter of ["A", "B"]) {
      for (const mode of ["light", "dark"]) {
        const file = `${id}-${letter}-ready-${mode}.png`;
        assert.match(page, new RegExp(`src="${file}"`), file);
        assert.ok(statSync(path.join(ROOT, out, file)).size > 2000, file);
      }
    }
  }
  // Before and after are two pictures: the core's colour changed what the screen shows.
  const picture = (letter) =>
    readFileSync(path.join(ROOT, out, `source-color-${letter}-ready-light.png`));
  assert.ok(!picture("A").equals(picture("B")), "the picture after is the picture before");
  assert.ok(statSync(drawn.picture).size > 2000);
  assert.match(
    eyeLines(drawn).join("\n"),
    /each change is drawn before \(A\) and after \(B\), in light and in dark/,
  );
  // The stylesheet of the repository is as it was.
  assert.equal(text(ROOT, "src/index.css"), sheet);
});
