// Item 9.2, slice 2 of specification 0012: the neutral family and the status tones as choices of
// the foundations, written by named formulas so that every pair the table of colour roles declares
// reaches its threshold from the moment it is written (criterion 8); a brand's own status colour
// through the row brand-exceptions; a pair that waits held to the ratio it was measured at; and a
// repository set up before this version that changes no value (criterion 10 for the new choices).
import "./helpers/own-cores.mjs";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { execPath } from "node:process";
import { after, test } from "node:test";
import { fileURLToPath } from "node:url";

import { rulesPage } from "../scripts/apply.mjs";
import { brief } from "../scripts/brief.mjs";
import {
  COLOR_ROLES,
  keepsWaiting,
  measurePairs,
  PAIRS,
  rolesLines,
  wordsFromListed,
} from "../scripts/color-roles.mjs";
import { recommendations } from "../scripts/principles.mjs";
import { choices, specimenPlan } from "../scripts/specimen.mjs";
import { fullStatus } from "../scripts/status.mjs";
import { STAMP, TOOL_COPY, treeHash } from "../scripts/stamp.mjs";
import { contrast, parseColor } from "../templates/tools/design-assembly/color.mjs";
import {
  NEUTRAL_FAMILIES,
  NEUTRAL_ROLES,
  neutralRoles,
  over,
  TONE_TINT,
  toneColor,
} from "../templates/tools/design-assembly/color-formulas.mjs";
import { parseLedger } from "../templates/tools/design-assembly/ledger.mjs";
import {
  applyBlock,
  buildTheme,
  readBlock,
  readVariable,
  renderBlock,
  THRESHOLDS,
  withoutBlock,
} from "../templates/tools/design-assembly/theme.mjs";
import { briefRepository, BUILT } from "./helpers/brief-repo.mjs";

const PLUGIN = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const ROOT = path.resolve(PLUGIN, "../..");
const reference = (name) => JSON.parse(readFileSync(path.join(PLUGIN, "references", name), "utf8"));
const LAYERS = reference("layers.json").layers;
const STARTERS = reference("source-colors.json").starters.map((item) => item.color);
const TONES = reference("status-tones.json").tones;
// The floor this plugin serves, as the sample application has it before any guide ran.
const FLOOR_CSS = withoutBlock(readFileSync(path.join(ROOT, "src/index.css"), "utf8"));
const MODES = [
  { name: "light", scope: ":root", dark: false },
  { name: "dark", scope: ".dark", dark: true },
];
// A tone of the closed list as the formula reads it: its colour of each mode.
const toneOf = (entry) => ({
  ...entry,
  light: parseColor(entry.light),
  dark: parseColor(entry.dark),
});
const NEUTRAL = COLOR_ROLES.roles.filter((entry) => entry.formula === "neutral-family");

const made = [];
after(() => made.forEach((dir) => rmSync(dir, { recursive: true, force: true })));
const empty = () => {
  const dir = realpathSync(mkdtempSync(path.join(tmpdir(), "design-neutral-status-")));
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
const apply = (dir) => {
  const done = run(script("apply.mjs"), "--target", dir);
  assert.equal(done.status, 0, done.stderr || done.stdout);
  return done;
};
const refused = (dir) => {
  const done = run(script("apply.mjs"), "--target", dir);
  assert.notEqual(done.status, 0, done.stdout);
  return done;
};

const SAID = { by: "Owner Name", on: "2026-11-21" };
// A blueprint the guide can write from. `roles` is the owner's word for each question of the
// table; `neutral` and `tones` the two choices; `exceptions` the brand's own status colours.
function blueprint({
  color = "#0246ff",
  level = "AA",
  roles = {},
  neutral,
  tones,
  exceptions,
} = {}) {
  const foundations = { source_color: color, text_font: "floor", heading_font: "text" };
  if (neutral !== undefined) foundations.neutral_family = neutral;
  if (tones !== undefined) foundations.status_tones = tones;
  const choices = {
    context: { product_type: "application", conformance_level: level },
    patterns: { record_panel: "beside" },
    foundations,
  };
  const layers = {};
  for (const layer of LAYERS) {
    layers[layer.id] = layer.built
      ? { status: "decided", source: "user", choice: choices[layer.id], why: "For the test." }
      : { status: "planned" };
  }
  layers.foundations.answered = { text_font: SAID, heading_font: SAID };
  layers.foundations.roles = Object.fromEntries(
    Object.entries(roles).map(([question, source]) => [question, { source, ...SAID }]),
  );
  if (exceptions) layers.foundations.brand_exceptions = exceptions;
  return { version: 1, status: "approved", layers };
}
// Every question of the table answered, the neutral roles and the status tones by their formulas.
const answered = (options = {}) =>
  blueprint({
    neutral: "grey",
    tones: ["error"],
    ...options,
    roles: {
      "color-roles-sidebar": "follows",
      "color-roles-neutral": "formula",
      "color-roles-status": "formula",
      "color-roles-chart": "floor",
      ...options.roles,
    },
  });

function repository(content = blueprint(), css = FLOOR_CSS) {
  const dir = empty();
  put(dir, "src/index.css", css);
  put(dir, "Makefile", text(ROOT, "Makefile"));
  put(dir, "design/blueprint.json", JSON.stringify(content, null, 2));
  const font = "node_modules/@fontsource-variable/geist";
  put(dir, `${font}/package.json`, text(ROOT, `${font}/package.json`));
  put(dir, `${font}/index.css`, text(ROOT, `${font}/index.css`));
  return dir;
}
const block = (dir) => readBlock(text(dir, "src/index.css"));
const contrastChecks = (dir) => json(dir, "design/theme.json").checks["color-contrast"];
const rowOf = (dir, id) =>
  parseLedger(text(dir, "design/decisions.yaml")).find((item) => item.id === id);
const green = (dir) => {
  const done = gate(dir);
  assert.equal(done.status, 0, done.stderr);
  return done;
};

// Every pair of the table measured on a stylesheet: the floor with the block a theme gives.
function pairsOf(theme, level) {
  const css = applyBlock(FLOOR_CSS, renderBlock(theme));
  return measurePairs({ css, base: "", files: [] }, level, MODES);
}

// ---- the formulas -------------------------------------------------------------------------------

test("the neutral formula writes exactly the neutral roles of the table, read on the grounds the table declares", () => {
  assert.deepEqual(
    NEUTRAL_ROLES.map((entry) => entry.role).sort(),
    NEUTRAL.map((entry) => entry.role).sort(),
  );
  for (const entry of NEUTRAL) {
    const ladder = NEUTRAL_ROLES.find((item) => item.role === entry.role);
    assert.deepEqual(ladder.on ?? [], entry.on ?? [], entry.role);
    assert.equal(entry.choice, "neutral_family", entry.role);
    assert.equal(entry.asks, "color-roles-neutral", entry.role);
  }
  assert.deepEqual(NEUTRAL_FAMILIES, ["grey", "tinted"]);
});

test("every starting source colour, at both levels, in both modes and for both families, gives neutral roles whose every pair reaches its threshold", () => {
  for (const level of Object.keys(THRESHOLDS)) {
    for (const family of NEUTRAL_FAMILIES) {
      for (const color of STARTERS) {
        for (const mode of MODES) {
          const values = neutralRoles(family, parseColor(color), THRESHOLDS[level].text, mode.dark);
          for (const entry of NEUTRAL_ROLES.filter((item) => item.on)) {
            for (const ground of entry.on) {
              const ratio = contrast(values[entry.role], values[ground]);
              assert.ok(
                ratio >= THRESHOLDS[level].text,
                `${family} ${color} ${level} ${mode.name}: ${entry.role} on ${ground} is ${ratio.toFixed(2)}:1`,
              );
            }
          }
          if (family === "grey") {
            for (const value of Object.values(values).filter((item) => item.l !== undefined)) {
              assert.equal(value.c, 0);
            }
          }
        }
      }
    }
  }
});

test("on the stylesheet as written, every pair the table declares between roles the formulas write reaches its threshold", () => {
  for (const level of Object.keys(THRESHOLDS)) {
    for (const family of NEUTRAL_FAMILIES) {
      for (const color of STARTERS) {
        const theme = buildTheme(
          {
            sourceColor: color,
            conformanceLevel: level,
            neutralFamily: family,
            statusTones: TONES,
            follows: {
              "--sidebar-primary": "--primary",
              "--sidebar-primary-foreground": "--primary-foreground",
              "--sidebar-ring": "--ring",
            },
          },
          FLOOR_CSS,
        );
        const measured = pairsOf(theme, level);
        assert.equal(measured.length, PAIRS.length * 2);
        for (const pair of measured) {
          assert.notEqual(pair.ratio, null, `${pair.foreground} in ${pair.mode}: ${pair.why}`);
          assert.ok(
            pair.ratio >= pair.min,
            `${family} ${color} ${level}: ${pair.foreground} on ${pair.background} in ${pair.mode} is ${pair.ratio.toFixed(2)}:1`,
          );
        }
      }
    }
  }
});

test("each status tone keeps the hue of the closed list, and reaches the threshold on the background and on its own tint", () => {
  for (const level of Object.keys(THRESHOLDS)) {
    for (const family of NEUTRAL_FAMILIES) {
      for (const color of STARTERS) {
        for (const mode of MODES) {
          const ground = neutralRoles(family, parseColor(color), THRESHOLDS[level].text, mode.dark)[
            "--background"
          ];
          for (const entry of TONES) {
            const tone = toneOf(entry);
            const value = toneColor(tone, ground, THRESHOLDS[level].text, mode.dark);
            assert.ok(Math.abs(value.h - tone[mode.name].h) < 0.01, `${entry.tone} keeps its hue`);
            const tint = over(value, TONE_TINT[mode.name], ground);
            assert.ok(contrast(value, ground) >= THRESHOLDS[level].text, `${entry.tone} ${level}`);
            assert.ok(contrast(value, tint) >= THRESHOLDS[level].text, `${entry.tone} on its tint`);
          }
        }
      }
    }
  }
  assert.ok(TONES.find((entry) => entry.tone === "error").always);
  assert.equal(TONES.find((entry) => entry.tone === "error").role, "--destructive");
});

test("where no value can reach the threshold, the formula says so in one sentence and writes nothing", () => {
  assert.throws(
    () => neutralRoles("grey", parseColor("#0246ff"), 22, false),
    (error) =>
      /^the neutral family grey cannot give --foreground a lightness that reaches 22:1 on --background in light mode, so nothing is written/.test(
        error.message,
      ) && !error.message.includes("\n"),
  );
  // A floor whose background is a mid grey: no lightness of the amber's band reads on it at AAA.
  const grey = parseColor("oklch(0.6 0 0)");
  assert.throws(
    () => toneColor(toneOf(TONES.find((entry) => entry.tone === "warning")), grey, 7, false),
    (error) =>
      /^the warning tone cannot reach 7:1 on the background and on its own tint in light mode without leaving its hue, so nothing is written for it/.test(
        error.message,
      ),
  );
  // Through the guide: the stylesheet is left as it was, and the sentence is said.
  const dir = repository(
    answered({
      roles: { "color-roles-neutral": "floor" },
      neutral: undefined,
      tones: ["error", "warning"],
      level: "AAA",
    }),
    FLOOR_CSS.replace("--background: oklch(1 0 0);", "--background: oklch(0.6 0 0);"),
  );
  const css = text(dir, "src/index.css");
  const said = refused(dir);
  assert.match(
    said.stderr,
    /the error tone cannot reach 7:1 .*: keep its role from the floor, or choose a lower conformance level/,
  );
  assert.equal(text(dir, "src/index.css"), css);
});

// ---- the neutral family -------------------------------------------------------------------------

test("pure grey: every neutral role is written in both modes without a hue, every pair passes, and the gate holds it", () => {
  const dir = repository(answered({ neutral: "grey" }));
  apply(dir);
  for (const scope of [":root", ".dark"]) {
    for (const entry of NEUTRAL) {
      const value = readVariable(block(dir), scope, entry.role);
      assert.ok(value, `${entry.role} is not written in ${scope}`);
      assert.match(value, /^oklch\([\d.]+ 0 0( \/ \d+%)?\)$/, `${entry.role} in ${scope}`);
    }
  }
  const checks = contrastChecks(dir);
  assert.deepEqual(
    checks.filter((item) => item.waits),
    [],
  );
  const muted = checks.find(
    (item) =>
      item.scope === ":root" &&
      item.foreground === "--muted-foreground" &&
      item.background === "--muted",
  );
  assert.ok(muted);
  const done = green(dir);
  assert.doesNotMatch(done.stdout, /not checked until the owner answers/);
  // The floor's own part is not touched.
  assert.equal(withoutBlock(text(dir, "src/index.css")), FLOOR_CSS);
});

test("grey leaning to the source colour: every neutral role takes the source's hue, and follows it when it changes", () => {
  const dir = repository(answered({ neutral: "tinted" }));
  apply(dir);
  const hueOf = (value) => parseColor(value).h;
  const source = parseColor("#0246ff");
  const muted = readVariable(block(dir), ":root", "--muted");
  assert.ok(Math.abs(hueOf(muted) - source.h) < 0.01, muted);
  assert.ok(parseColor(muted).c > 0, muted);
  green(dir);
  put(
    dir,
    "design/blueprint.json",
    JSON.stringify(answered({ neutral: "tinted", color: "#c2410c" }), null, 2),
  );
  apply(dir);
  const after = readVariable(block(dir), ":root", "--muted");
  assert.notEqual(after, muted);
  assert.ok(Math.abs(hueOf(after) - parseColor("#c2410c").h) < 0.01, after);
  green(dir);
});

test("kept from the floor is still an answer: the block writes no neutral role, and the pair below is a check", () => {
  const dir = repository(
    answered({ roles: { "color-roles-neutral": "floor" }, neutral: undefined }),
  );
  apply(dir);
  assert.equal(readVariable(block(dir), ":root", "--muted"), null);
  const red = gate(dir);
  assert.notEqual(red.status, 0);
  assert.match(
    red.stderr,
    /--muted-foreground on --muted in light mode \(:root\) has a contrast ratio of 4\.34:1/,
  );
});

test("the neutral family and the status tones go with the owner's word that the formula writes their roles", () => {
  const dir = repository(blueprint({ neutral: "grey" }));
  assert.match(
    refused(dir).stderr,
    /neutral family is written only once roles\.color-roles-neutral is formula/,
  );
  put(
    dir,
    "design/blueprint.json",
    JSON.stringify(blueprint({ roles: { "color-roles-neutral": "formula" } }), null, 2),
  );
  assert.match(refused(dir).stderr, /foundations: no neutral family/);
  put(dir, "design/blueprint.json", JSON.stringify(answered({ neutral: "silver" }), null, 2));
  assert.match(refused(dir).stderr, /neutral family must be one of grey, tinted/);
  const unnamed = answered();
  delete unnamed.layers.foundations.roles["color-roles-neutral"].by;
  put(dir, "design/blueprint.json", JSON.stringify(unnamed, null, 2));
  assert.match(refused(dir).stderr, /roles\.color-roles-neutral .*who gave it and when/);
});

// ---- the status tones ---------------------------------------------------------------------------

const TONE_ROLES = ["--success", "--warning", "--info"];

test("the error tone alone writes the destructive role in both modes, and no other tone's role", () => {
  const dir = repository(answered({ tones: ["error"] }));
  apply(dir);
  for (const scope of [":root", ".dark"]) {
    assert.ok(readVariable(block(dir), scope, "--destructive"), scope);
    for (const role of TONE_ROLES)
      assert.equal(readVariable(text(dir, "src/index.css"), scope, role), null);
  }
  assert.doesNotMatch(block(dir), /--color-success|--color-warning|--color-info/);
  const row = rowOf(dir, "status-tone");
  assert.ok(row, "the ledger has no status-tone row");
  assert.match(row.source, /status tones error/);
  assert.match(row.note, /answered by Owner Name on 2026-11-21/);
  green(dir);
});

for (const tone of TONES.filter((entry) => !entry.always)) {
  test(`the ${tone.tone} tone, chosen, writes ${tone.role} in both modes, measured on the background, and reaches the framework's classes`, () => {
    const dir = repository(answered({ tones: ["error", tone.tone] }));
    apply(dir);
    for (const scope of [":root", ".dark"]) {
      const value = readVariable(block(dir), scope, tone.role);
      assert.ok(value, `${tone.role} in ${scope}`);
      const hue = parseColor(value).h;
      assert.ok(Math.abs(hue - parseColor(tone[scope === ":root" ? "light" : "dark"]).h) < 0.01);
      assert.ok(
        contrastChecks(dir).some(
          (item) =>
            item.scope === scope &&
            item.foreground === tone.role &&
            item.background === "--background",
        ),
        `${tone.role} on --background in ${scope} is not measured`,
      );
    }
    assert.match(block(dir), new RegExp(`--color-${tone.role.slice(2)}: var\\(${tone.role}\\);`));
    for (const other of TONE_ROLES.filter((role) => role !== tone.role)) {
      assert.equal(readVariable(block(dir), ":root", other), null, other);
    }
    green(dir);
  });
}

test("the status tones take the error tone always, and only tones of the closed list", () => {
  const dir = repository(answered({ tones: ["success"] }));
  assert.match(refused(dir).stderr, /status tones always take error/);
  put(
    dir,
    "design/blueprint.json",
    JSON.stringify(answered({ tones: ["error", "purple"] }), null, 2),
  );
  assert.match(refused(dir).stderr, /status tones are among error, success, warning, information/);
});

test("the status-tone row holds the tones chosen: a role of a tone not chosen, declared after the block, turns the gate red", () => {
  const dir = repository(answered({ tones: ["error"] }));
  apply(dir);
  const checks = json(dir, "design/theme.json").checks["status-tone"];
  assert.ok(checks?.length > 0);
  const css = text(dir, "src/index.css");
  put(dir, "src/index.css", `${css}\n:root {\n  --warning: oklch(0.7 0.17 70);\n}\n`);
  const red = gate(dir);
  assert.notEqual(red.status, 0);
  assert.match(red.stderr, /status-tone: .*--warning.*the owner did not choose the warning tone/);
});

// ---- a brand's own status colour ----------------------------------------------------------------

const OWN = {
  light: "oklch(0.45 0.13 150)",
  dark: "oklch(0.8 0.15 150)",
  why: "The brand's own green.",
  ...SAID,
};

test("a brand's own status colour enters through brand-exceptions with a name and a day, and is measured like any other", () => {
  const dir = repository(
    answered({ tones: ["error", "success"], exceptions: { "--success": OWN } }),
  );
  apply(dir);
  assert.equal(readVariable(block(dir), ":root", "--success"), OWN.light);
  assert.equal(readVariable(block(dir), ".dark", "--success"), OWN.dark);
  const row = rowOf(dir, "brand-exceptions");
  assert.ok(row, "the ledger has no brand-exceptions row");
  assert.match(row.note, /--success: The brand's own green\. Answered by Owner Name on 2026-11-21/);
  assert.ok(
    contrastChecks(dir).some(
      (item) => item.foreground === "--success" && item.scope === ".dark" && !item.waits,
    ),
  );
  green(dir);
  // A hand edit of the brand's colour is not what the owner gave.
  const css = text(dir, "src/index.css");
  put(
    dir,
    "src/index.css",
    css.replace(`--success: ${OWN.light};`, "--success: oklch(0.46 0.13 150);"),
  );
  assert.notEqual(gate(dir).status, 0);
});

test("a brand's own status colour below the threshold, without a name and a day, or for a tone not chosen, is refused", () => {
  const dir = repository(
    answered({
      tones: ["error", "success"],
      exceptions: { "--success": { ...OWN, light: "oklch(0.8 0.15 150)" } },
    }),
  );
  assert.match(
    refused(dir).stderr,
    /brand exception --success in light mode is \d\.\d\d:1 on --background, below 4\.5:1/,
  );
  const { by, ...unnamed } = OWN;
  assert.ok(by);
  put(
    dir,
    "design/blueprint.json",
    JSON.stringify(
      answered({ tones: ["error", "success"], exceptions: { "--success": unnamed } }),
      null,
      2,
    ),
  );
  assert.match(refused(dir).stderr, /brand_exceptions\.--success .*who gave it and when/);
  put(
    dir,
    "design/blueprint.json",
    JSON.stringify(answered({ tones: ["error"], exceptions: { "--success": OWN } }), null, 2),
  );
  assert.match(refused(dir).stderr, /brand_exceptions\.--success: the success tone is not chosen/);
});

// ---- a pair that waits is held to the ratio it was measured at ----------------------------------

test("a pair that waits is held to the ratio it was measured at when it began to wait", () => {
  const dir = repository();
  apply(dir);
  const waiting = contrastChecks(dir).find(
    (item) =>
      item.scope === ":root" &&
      item.foreground === "--muted-foreground" &&
      item.background === "--muted",
  );
  assert.equal(waiting.waits, "color-roles-neutral");
  assert.equal(waiting.measured, 4.34);
  green(dir);
  // Worse than when it began to wait: red, though the owner has not answered.
  const css = text(dir, "src/index.css");
  const worse = css.replace(
    "--muted-foreground: oklch(0.556 0 0);",
    "--muted-foreground: oklch(0.62 0 0);",
  );
  put(dir, "src/index.css", worse);
  const red = gate(dir);
  assert.notEqual(red.status, 0);
  assert.match(
    red.stderr,
    /--muted-foreground on --muted in light mode \(:root\) measured 4\.34:1 when it began to wait on color-roles-neutral, and is now \d\.\d\d:1/,
  );
  // The guide run again does not take the worse number as the new start.
  apply(dir);
  const again = contrastChecks(dir).find(
    (item) =>
      item.scope === ":root" &&
      item.foreground === "--muted-foreground" &&
      item.background === "--muted",
  );
  assert.equal(again.measured, 4.34);
  assert.notEqual(gate(dir).status, 0);
  // Back as it was, or better, and the guide run again: green, still held at the same ratio.
  put(dir, "src/index.css", css);
  apply(dir);
  green(dir);
});

// ---- the guide shows both choices ---------------------------------------------------------------

test("the sheet draws the neutral family on the repository's screen, light and dark, pure grey first with what it rests on", () => {
  const dir = repository(blueprint());
  const plan = specimenPlan(dir, { section: "neutral" });
  const section = plan.sections.find((item) => item.id === "neutral");
  assert.ok(section, "no neutral section");
  assert.equal(section.key, "neutral_family");
  assert.deepEqual(
    section.options.map((option) => option.value),
    ["grey", "tinted"],
  );
  for (const option of section.options) {
    assert.deepEqual(option.modes, ["light", "dark"]);
    assert.match(option.css, /--muted-foreground: oklch/);
    assert.ok(
      option.notes.some((note) => /--muted-foreground on --muted .*:1/.test(note)),
      option.value,
    );
  }
  assert.match(section.options[0].notes.join(" "), /recommended/);
  const said = recommendations(blueprint()).find((item) => item.key === "neutral_family");
  assert.equal(said.option, "grey");
  assert.ok(said.basis.text.length > 0);
  assert.deepEqual(choices(plan).neutral.A, { neutral_family: "grey" });
});

test("the sheet draws the status tones light and dark, the error tone first and always taken, each tone with its ratios", () => {
  const dir = repository(blueprint());
  const plan = specimenPlan(dir, { section: "status" });
  const section = plan.sections.find((item) => item.id === "status");
  assert.ok(section, "no status section");
  assert.equal(section.key, "status_tones");
  assert.equal(section.many, true);
  assert.deepEqual(
    section.options.map((option) => option.value),
    ["error", "success", "warning", "information"],
  );
  for (const option of section.options) {
    assert.deepEqual(option.modes, ["light", "dark"]);
    assert.ok(
      option.notes.some((note) => /on the background.*:1/.test(note)),
      option.value,
    );
  }
  assert.match(section.options[0].notes.join(" "), /always/);
  const said = recommendations(blueprint()).find((item) => item.key === "status_tones");
  assert.deepEqual(said.option, ["error"]);
  assert.ok(said.basis.text.length > 0);
});

test("the owner's answers reach the record of the foundations with their name and day", () => {
  const dir = repository(answered({ neutral: "tinted", tones: ["error", "warning"] }));
  apply(dir);
  const page = text(dir, "design/decisions/foundations.md");
  assert.match(page, /neutral family: `tinted` \(answered by Owner Name on 2026-11-21\)/);
  assert.match(page, /status tones: `error, warning` \(answered by Owner Name on 2026-11-21\)/);
});

// ---- a repository of before ---------------------------------------------------------------------

// A repository the guide wrote with the previous version: no word for the neutral roles or the
// status tones, the pairs below waiting without the ratio they began at, stamped 0.31.0.
function before() {
  const dir = repository(
    blueprint({ roles: { "color-roles-sidebar": "follows", "color-roles-chart": "floor" } }),
  );
  apply(dir);
  const theme = json(dir, "design/theme.json");
  theme.checks["color-contrast"] = theme.checks["color-contrast"].map((item) =>
    Object.fromEntries(Object.entries(item).filter(([key]) => key !== "measured")),
  );
  delete theme.checks["status-tone"];
  put(dir, "design/theme.json", `${JSON.stringify(theme, null, 2)}\n`);
  put(dir, `${TOOL_COPY}/scale.mjs`, `${text(dir, `${TOOL_COPY}/scale.mjs`)}// older\n`);
  put(
    dir,
    STAMP,
    `${JSON.stringify({ version: "0.31.0", tree: treeHash(path.join(dir, TOOL_COPY)) })}\n`,
  );
  return dir;
}

test("upgrade on a repository the guide wrote before changes no value, leaves the gate green, and the new choices wait", () => {
  const dir = before();
  const stylesheet = text(dir, "src/index.css");
  const upgraded = run(script("upgrade.mjs"), "--target", dir, "--json");
  assert.equal(upgraded.status, 0, upgraded.stderr || upgraded.stdout);
  assert.equal(text(dir, "src/index.css"), stylesheet);
  green(dir);
  const asked = fullStatus(dir).waiting.filter((item) => item.id.startsWith("color-roles-"));
  assert.deepEqual(asked.map((item) => item.id).sort(), [
    "color-roles-neutral",
    "color-roles-status",
  ]);
  const neutral = asked.find((item) => item.id === "color-roles-neutral");
  assert.equal(neutral.answer, "/design-assembly:new");
  assert.match(
    neutral.recommendation,
    /^Let the neutral family's formula write them, in pure grey/,
  );
  assert.match(
    neutral.basis,
    /--muted-foreground on --muted in light mode is 4\.34:1, below 4\.5:1/,
  );
  const status = asked.find((item) => item.id === "color-roles-status");
  assert.match(
    status.recommendation,
    /^Let the status tone formula write them, with the error tone/,
  );
  // The guide run again keeps every value and the gate green.
  apply(dir);
  assert.equal(text(dir, "src/index.css"), stylesheet);
  green(dir);
});

test("adopt on a repository adopted before changes no value, leaves the gate green, and the new choices wait", () => {
  const dir = empty();
  put(dir, "src/index.css", FLOOR_CSS);
  put(dir, "Makefile", text(ROOT, "Makefile"));
  const first = run(script("adopt.mjs"), "--target", dir, "--conformance-level", "AA");
  assert.ok([0, 1].includes(first.status), first.stderr);
  const stylesheet = text(dir, "src/index.css");
  green(dir);
  const upgraded = run(script("upgrade.mjs"), "--target", dir, "--json");
  assert.equal(upgraded.status, 0, upgraded.stderr || upgraded.stdout);
  const again = run(script("adopt.mjs"), "--target", dir);
  assert.ok([0, 1].includes(again.status), again.stderr);
  assert.equal(text(dir, "src/index.css"), stylesheet);
  green(dir);
  const asked = fullStatus(dir).waiting.filter((item) => item.id.startsWith("color-roles-"));
  for (const id of ["color-roles-neutral", "color-roles-status"]) {
    const item = asked.find((entry) => entry.id === id);
    assert.ok(item, id);
    assert.equal(item.answer, "/design-assembly:decide");
    assert.doesNotMatch(item.recommendation, /blueprint/);
    assert.match(
      item.recommendation,
      /the formula writes them only where the guide writes this repository's values/,
    );
  }
});

// ---- the rules page, the brief and the table in words -------------------------------------------

test("the rules page says the neutral family and the status tones only where the repository has the rows", () => {
  const dir = repository(answered({ neutral: "tinted", tones: ["error", "success"] }));
  apply(dir);
  const page = text(dir, ".claude/rules/design-assembly.md");
  assert.match(page, /neutral family tinted/);
  assert.match(page, /status tones of this product are error and success/);
  const bare = repository(blueprint());
  apply(bare);
  const plain = text(bare, ".claude/rules/design-assembly.md");
  assert.doesNotMatch(plain, /neutral family|status tones/);
  // Read the same way by the brief sheet.
  const repo = briefRepository({ ".claude/rules/design-assembly.md": page });
  try {
    const slot = brief(repo.dir, BUILT).slots.find((item) => item.id === "rules");
    assert.match(JSON.stringify(slot.answer), /neutral family tinted/);
  } finally {
    repo.remove();
  }
  assert.ok(rulesPage({}, () => false, answered()).length > 0);
});

test("the table in words says the neutral roles come from the neutral family, and a tone not chosen writes nothing", () => {
  const words = answered({ neutral: "tinted" }).layers.foundations.roles;
  const lines = rolesLines(words, { neutral_family: "tinted", status_tones: ["error"] });
  assert.ok(
    lines.some((line) =>
      /^--muted: the formula neutral-family, from the owner's neutral family \(tinted\)/.test(line),
    ),
    lines.join("\n"),
  );
  assert.ok(
    lines.some((line) =>
      /^--success: not written: the owner did not choose the success tone/.test(line),
    ),
  );
  assert.ok(
    lines.some((line) =>
      /^--destructive: the formula status-tone, from the owner's status tones/.test(line),
    ),
  );
});

test("an answer on the waiting list: a value of the choice is the formula, and «keep» means what the question recommended the day it was asked", () => {
  const row = (question, extra) => ({
    id: question,
    item: `decision:${question}`,
    by: "Owner Name",
    on: "2026-11-22",
    ...extra,
  });
  const words = wordsFromListed([
    row("color-roles-neutral", { answer: "value", said: "tinted" }),
    row("color-roles-status", { answer: "value", said: "error, warning" }),
  ]);
  assert.equal(words["color-roles-neutral"].source, "formula");
  assert.equal(words["color-roles-status"].source, "formula");
  // Asked before this version, the question recommended to wait: keeping it was to wait.
  assert.deepEqual(
    wordsFromListed([row("color-roles-neutral", { answer: "keep", asked_on: "2026-11-21" })]),
    {},
  );
  assert.equal(
    keepsWaiting("color-roles-neutral", { answer: "keep", asked_on: "2026-11-21" }),
    true,
  );
  // Asked with this version's recommendation, keeping it is the formula.
  assert.equal(
    wordsFromListed([row("color-roles-neutral", { answer: "keep", asked_on: "2026-11-22" })])[
      "color-roles-neutral"
    ].source,
    "formula",
  );
  assert.equal(
    keepsWaiting("color-roles-neutral", { answer: "keep", asked_on: "2026-11-22" }),
    false,
  );
  // A value the choice does not take is no word.
  assert.deepEqual(
    wordsFromListed([row("color-roles-neutral", { answer: "value", said: "beige" })]),
    {},
  );
});

test("a status tone the floor does not have is never said to be kept from the floor", () => {
  for (const words of [{}, { "color-roles-status": { source: "floor", ...SAID } }]) {
    const lines = rolesLines(words);
    for (const role of ["--success", "--warning", "--info"]) {
      const line = lines.find((item) => item.startsWith(`${role}:`));
      assert.match(line, /not written: the floor has no such role/, line);
    }
    const page = rulesPage(
      {
        "color-contrast": [
          {
            kind: "contrast",
            scope: ":root",
            foreground: "--foreground",
            background: "--background",
            min: 4.5,
          },
        ],
      },
      () => false,
      blueprint({
        roles: Object.fromEntries(Object.entries(words).map(([id, word]) => [id, word.source])),
      }),
    );
    assert.doesNotMatch(page, /--success/);
  }
});

test("a question about the same row of the ledger replaces the one that waits when it says so, and only then", () => {
  const dir = repository();
  apply(dir);
  const ask = (...extra) =>
    run(
      script("decide.mjs"),
      "--target",
      dir,
      "--ask",
      "Which neutral family?",
      "--recommend",
      "Pure grey",
      "--because",
      "For the test.",
      "--easy-to-undo",
      "--item",
      "decision:color-roles-neutral",
      ...extra,
    );
  put(
    dir,
    "design/waiting/color-roles-neutral.json",
    `${JSON.stringify({ id: "color-roles-neutral", question: "Kept from the floor?", recommendation: "Wait", basis: "For the test.", hard_to_undo: false, item: "decision:color-roles-neutral", asked_on: "2026-11-21" })}\n`,
  );
  const twice = ask("--id", "neutral-family");
  assert.notEqual(twice.status, 0);
  assert.match(twice.stderr + twice.stdout, /is asked already in color-roles-neutral/);
  const replacing = ask("--id", "neutral-family", "--replaces", "color-roles-neutral");
  assert.ok([0, 1].includes(replacing.status), replacing.stderr);
  const written = json(dir, "design/waiting/neutral-family.json");
  assert.deepEqual(written.replaces, ["color-roles-neutral"]);
  const ids = fullStatus(dir).waiting.map((item) => item.id);
  assert.ok(ids.includes("neutral-family"), ids.join(", "));
  assert.equal(ids.includes("color-roles-neutral"), false, ids.join(", "));
});

// ---- what the independent review of this slice found ------------------------------------------

test("the status tones in any order are the same answer, and a tone named twice is refused", () => {
  const dir = repository(answered({ tones: ["success", "error"] }));
  apply(dir);
  green(dir);
  put(
    dir,
    "design/blueprint.json",
    JSON.stringify(answered({ tones: ["error", "error"] }), null, 2),
  );
  assert.match(refused(dir).stderr, /status tones name error twice/);
});

test("a brand's own colour written in capitals is written as the formatter leaves it, so formatting keeps the gate green", () => {
  const own = { ...OWN, light: "#15803D", dark: "#4ADE80" };
  const dir = repository(
    answered({ tones: ["error", "success"], exceptions: { "--success": own } }),
  );
  apply(dir);
  assert.equal(readVariable(block(dir), ":root", "--success"), "#15803d");
  const done = spawnSync("npx", ["prettier", "--write", path.join(dir, "src/index.css")], {
    cwd: ROOT,
    encoding: "utf8",
  });
  assert.equal(done.status, 0, done.stderr);
  green(dir);
});

test("a pair that waits keeps the ratio it began at when one of its questions is answered and another still waits", () => {
  const dir = repository();
  apply(dir);
  const ring = () =>
    contrastChecks(dir).find(
      (item) =>
        item.scope === ":root" &&
        item.foreground === "--sidebar-ring" &&
        item.background === "--sidebar",
    );
  assert.equal(ring().measured, 2.48);
  const css = text(dir, "src/index.css");
  put(
    dir,
    "src/index.css",
    css.replace("--sidebar-ring: oklch(0.708 0 0);", "--sidebar-ring: oklch(0.8 0 0);"),
  );
  assert.notEqual(gate(dir).status, 0);
  // The owner keeps the sidebar from the floor; the pair still waits on the neutral question.
  put(
    dir,
    "design/blueprint.json",
    JSON.stringify(blueprint({ roles: { "color-roles-sidebar": "floor" } }), null, 2),
  );
  apply(dir);
  assert.equal(ring().waits, "color-roles-neutral");
  assert.equal(ring().measured, 2.48);
  assert.notEqual(gate(dir).status, 0);
});

test("the changed copy of a pair held at its ratio fails on that ratio, not on an unreadable role", async () => {
  const { KINDS_FOR_TEST } = await import("../templates/tools/design-assembly/check.mjs");
  const dir = repository();
  apply(dir);
  const check = contrastChecks(dir).find((item) => item.measured);
  const state = { css: text(dir, "src/index.css"), base: "", files: [] };
  const changed = KINDS_FOR_TEST.contrast.change(state, check);
  assert.match(KINDS_FOR_TEST.contrast.run(changed, check), /may not get worse/);
});

test("an owner who kept waiting for the neutral family is asked again now that it has come", () => {
  const dir = before();
  put(
    dir,
    "design/waiting/color-roles-neutral.json",
    `${JSON.stringify({ id: "color-roles-neutral", question: "Kept from the floor?", recommendation: "Wait", basis: "For the test.", hard_to_undo: false, item: "decision:color-roles-neutral", asked_on: "2026-11-21", answer: "keep", by: "Owner Name", on: "2026-11-21" })}\n`,
  );
  const neutral = fullStatus(dir).waiting.find((item) => item.id === "color-roles-neutral");
  assert.ok(neutral, "the neutral question is not asked again");
  assert.match(
    neutral.basis,
    /kept waiting .* on 2026-11-21, and the choice it waited for has come/,
  );
});

test("a question of the waiting list with candidates: «keep» takes its first candidate, whatever the table recommends", () => {
  const row = {
    id: "status-tones",
    item: "decision:color-roles-status",
    candidates: [{ name: "floor" }, { name: "error" }],
    answer: "keep",
    by: "Owner Name",
    on: "2026-11-22",
    asked_on: "2026-11-22",
  };
  assert.equal(wordsFromListed([row])["color-roles-status"].source, "floor");
  const chosen = { ...row, answer: "value", said: "error" };
  assert.equal(wordsFromListed([chosen])["color-roles-status"].source, "formula");
});

test("the note of a pair that waits says it is held at the ratio it began at", () => {
  const dir = repository();
  apply(dir);
  assert.match(
    green(dir).stdout,
    /--muted-foreground on --muted in light mode \(:root\) measures 4\.34:1, below 4\.5:1: not checked until the owner answers color-roles-neutral, and held at 4\.34:1, the ratio it began to wait at/,
  );
  assert.match(
    text(dir, ".claude/rules/design-assembly.md"),
    /held at the ratio each began to wait at/,
  );
});
