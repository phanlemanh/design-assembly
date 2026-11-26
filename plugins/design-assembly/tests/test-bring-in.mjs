// The bridge in (specification 0014, criteria 9 and 15): what a tool from outside made, read into one
// candidate direction that stands beside the plugin's on the sheet. Three kinds of sample are read:
// a token file in the token format the design token group writes, a DESIGN.md, and an export of
// variables by collection and mode; and a system folder of tokens and a README. A value written as
// an expression or a reference becomes its final value; a value against a row the owner settled
// becomes a question, never a new row. Every sample is a fixture: nothing calls a model or the
// network.
import "./helpers/own-cores.mjs";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { execPath } from "node:process";
import { after, test } from "node:test";
import { fileURLToPath } from "node:url";

import { bringIn, candidateFrom, conflictsOf } from "../scripts/bring-in.mjs";
import { evaluate, readTokens } from "../scripts/outside-tokens.mjs";
import { specimenPlan } from "../scripts/specimen.mjs";
import { readWaiting, rowProblems } from "../templates/tools/design-assembly/waiting.mjs";
import { withoutBlock } from "../templates/tools/design-assembly/theme.mjs";
import { DESIGN_MD, TOKENS, VARIABLES } from "./helpers/bring-in-samples.mjs";

const PLUGIN = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const ROOT = path.resolve(PLUGIN, "../..");
const BRING_IN = path.join(PLUGIN, "scripts/bring-in.mjs");
const ON = "2026-11-23";

const made = [];
after(() => made.forEach((dir) => rmSync(dir, { recursive: true, force: true })));
const empty = () => {
  const dir = mkdtempSync(path.join(tmpdir(), "design-bring-in-"));
  made.push(dir);
  return dir;
};
const put = (dir, file, text) => {
  mkdirSync(path.dirname(path.join(dir, file)), { recursive: true });
  writeFileSync(path.join(dir, file), text);
  return path.join(dir, file);
};
const cli = (...args) => spawnSync(execPath, [BRING_IN, ...args], { encoding: "utf8" });

// A repository whose owner settled the colour, the type scale and the corner radius.
function settledRepo() {
  const dir = empty();
  put(dir, "src/index.css", withoutBlock(readFileSync(path.join(ROOT, "src/index.css"), "utf8")));
  put(
    dir,
    "design/blueprint.json",
    `${JSON.stringify({
      version: 1,
      status: "approved",
      layers: {
        context: {
          status: "decided",
          source: "user",
          choice: { product_type: "application", conformance_level: "AA" },
        },
        foundations: {
          status: "decided",
          source: "user",
          choice: {
            source_color: "#0246ff",
            type_scale: "standard",
            spacing_unit: "4px",
            corner_radius: "small",
          },
        },
      },
    })}\n`,
  );
  return dir;
}

test("expressions and references become final values, and what cannot be read says why", () => {
  const tokens = { "radius.base": "10px", "space.unit": "0.25rem" };
  assert.equal(evaluate("calc(var(--radius-base) - 4px)", tokens), "6px");
  assert.equal(evaluate("calc({radius.base} * 2)", tokens), "20px");
  assert.equal(evaluate("calc((var(--radius-base) + 2px) / 2)", tokens), "6px");
  assert.equal(evaluate("calc(var(--space-unit) * 3)", tokens), "12px");
  assert.equal(evaluate("{radius.base}", tokens), "10px");
  assert.equal(evaluate("2rem", tokens), "32px");
  assert.throws(
    () => evaluate("calc(var(--nowhere) - 4px)", tokens),
    /var\(--nowhere\) names no token/,
  );
  assert.throws(() => evaluate("calc(10px * 2px)", tokens), /a length times a length/);
  // A reference that comes back to itself is named, not followed for ever.
  const read = readTokens("tokens", JSON.stringify({ a: { $value: "{b}" }, b: { $value: "{a}" } }));
  assert.deepEqual(
    read.unread.map((item) => item.token),
    ["a", "b"],
  );
  assert.match(read.unread[0].why, /refers back to itself/);
});

test("criterion 9: a token file becomes one candidate direction, its expressions computed", () => {
  const dir = empty();
  const file = put(dir, "outside/tokens.json", JSON.stringify(TOKENS));
  const candidate = candidateFrom(file);
  assert.equal(candidate.source.kind, "tokens");
  assert.deepEqual(candidate.values, {
    source_color: "#cc785c",
    type_scale: "modular",
    type_ratio: "minor-third",
    corner_radius: "medium",
  });
  assert.deepEqual(candidate.assumed, []);
  assert.deepEqual(candidate.fonts, { text: "Inter", heading: "Fraunces" });
  const resolved = Object.fromEntries(candidate.resolved.map((item) => [item.token, item.value]));
  assert.equal(resolved["radius.sm"], "8px");
  assert.equal(resolved["radius.lg"], "16px");
  assert.equal(resolved["color.accent"], "#cc785c");
  // The dark group is read as the dark mode of the colour it names.
  assert.equal(candidate.dark.source_color, "#e0957b");
});

test("criterion 9: a DESIGN.md becomes one candidate direction, its references followed", () => {
  const dir = empty();
  const file = put(dir, "DESIGN.md", DESIGN_MD);
  const candidate = candidateFrom(file);
  assert.equal(candidate.source.kind, "design-md");
  assert.equal(candidate.name, "Daylight Prestige");
  assert.deepEqual(candidate.values, {
    source_color: "#1a1c1e",
    type_scale: "standard",
    corner_radius: "extra-small",
  });
  assert.deepEqual(candidate.fonts, { text: "Public Sans", heading: "Public Sans" });
});

test("criterion 9: an export of variables becomes one candidate direction, its modes and aliases read", () => {
  const dir = empty();
  const file = put(dir, "variables.json", JSON.stringify(VARIABLES));
  const candidate = candidateFrom(file);
  assert.equal(candidate.source.kind, "variables");
  assert.deepEqual(candidate.values, {
    source_color: "#0246ff",
    type_scale: "standard",
    corner_radius: "small",
  });
  // Nothing in the export says the type scale: the floor's is drawn, and said.
  assert.deepEqual(candidate.assumed, ["type_scale"]);
  assert.equal(candidate.dark.source_color, "#668cff");
});

test("criterion 15: a system folder of tokens and a README becomes one candidate direction, named by its README", () => {
  const dir = empty();
  put(dir, "system/tokens.json", JSON.stringify(TOKENS));
  put(dir, "system/README.md", "# Clay Studio\n\nA warm system for a studio.\n");
  const candidate = candidateFrom(path.join(dir, "system"));
  assert.equal(candidate.source.kind, "system");
  assert.equal(candidate.name, "Clay Studio");
  assert.equal(candidate.values.source_color, "#cc785c");
  assert.equal(candidate.values.corner_radius, "medium");
  // A corner radius between two of the plugin's is taken to the nearest, and said.
  put(
    dir,
    "odd/tokens.json",
    JSON.stringify({
      color: { primary: { $value: "#336699" } },
      radius: { base: { $value: "calc(9px + 0.5px)" } },
    }),
  );
  const odd = candidateFrom(path.join(dir, "odd"));
  assert.equal(odd.values.corner_radius, "floor");
  assert.deepEqual(odd.approximated, [{ key: "corner_radius", from: "9.5px", to: "floor (10px)" }]);
});

test("criteria 9 and 15: a value against a row the owner settled becomes a question, and the ledger is left alone", () => {
  const dir = settledRepo();
  const file = put(dir, "outside/tokens.json", JSON.stringify(TOKENS));
  const conflicts = conflictsOf(dir, candidateFrom(file));
  assert.deepEqual(
    conflicts.map((item) => [item.key, item.settled, item.outside]),
    [
      ["source_color", "#0246ff", "#cc785c"],
      ["type_scale", "standard", "modular"],
      ["corner_radius", "small", "medium"],
    ],
  );
  const result = bringIn(dir, file, { on: ON, dryRun: false });
  assert.equal(result.questions.length, 3);
  for (const question of result.questions) {
    assert.deepEqual(rowProblems(question, question.id), [], question.id);
    assert.match(question.recommendation, /^Keep /);
    assert.match(question.basis, /the ledger wins/);
  }
  assert.deepEqual(
    (readWaiting(dir)?.rows ?? []).map((row) => row.id),
    result.questions.map((question) => question.id).sort(),
  );
  // The blueprint and the ledger are not touched, and the same file asks nothing twice.
  assert.match(
    readFileSync(path.join(dir, "design/blueprint.json"), "utf8"),
    /"corner_radius":"small"/,
  );
  assert.ok(!existsSync(path.join(dir, "design/decisions.yaml")));
  assert.deepEqual(bringIn(dir, file, { on: ON, dryRun: false }).files, []);
  // A source that agrees with every settled value asks nothing.
  const agreeing = put(dir, "variables.json", JSON.stringify(VARIABLES));
  assert.deepEqual(conflictsOf(dir, candidateFrom(agreeing)), []);
  // A value the guide proposed and nobody confirmed is not a settled row: nothing to ask.
  const proposed = settledRepo();
  const blueprint = JSON.parse(readFileSync(path.join(proposed, "design/blueprint.json"), "utf8"));
  blueprint.layers.foundations.source = "proposed";
  put(proposed, "design/blueprint.json", JSON.stringify(blueprint));
  assert.deepEqual(conflictsOf(proposed, candidateFrom(file)), []);
});

test("the command: --json by the common contract, 1 while questions wait, 2 on a file it cannot read", () => {
  const dir = settledRepo();
  const file = put(dir, "outside/tokens.json", JSON.stringify(TOKENS));
  const preview = cli("--target", dir, "--from", file, "--json", "--dry-run", "--on", ON);
  assert.equal(preview.status, 1, preview.stderr);
  const data = JSON.parse(preview.stdout);
  assert.deepEqual(Object.keys(data), ["candidate", "questions", "files", "dry_run"]);
  assert.equal(data.files.length, 3);
  assert.ok(!existsSync(path.join(dir, "design/waiting")));
  const shown = cli("--target", dir, "--from", file, "--on", ON);
  assert.equal(shown.status, 1);
  assert.match(shown.stdout, /^candidate direction: tokens /m);
  assert.match(shown.stdout, /corner radius medium/);
  const quiet = cli("--target", empty(), "--from", file, "--json");
  assert.equal(quiet.status, 0, quiet.stderr);
  for (const args of [
    ["--from", path.join(dir, "nowhere.json")],
    ["--from", put(dir, "bad.json", "{ no")],
    [],
  ]) {
    const wrong = cli("--target", dir, ...args, "--json");
    assert.equal(wrong.status, 2, args.join(" "));
    assert.equal(wrong.stdout, "");
    assert.match(wrong.stderr, /^(usage|design-assembly): /);
  }
});

test("the candidate stands beside the plugin's directions on the sheet, with what it rests on", () => {
  const dir = settledRepo();
  const file = put(dir, "outside/tokens.json", JSON.stringify(TOKENS));
  const plan = specimenPlan(dir, { section: "direction", from: [file] });
  const options = plan.sections.find((item) => item.id === "direction").options;
  const outside = options.at(-1);
  assert.equal(options.length, 4);
  assert.match(
    outside.label,
    /^from tokens\.json: #cc785c, modular, minor-third, corner radius medium$/,
  );
  assert.ok(
    outside.notes.some((note) => /taken from .*tokens\.json, never written to a ledger/.test(note)),
  );
  assert.ok(outside.notes.some((note) => /^fonts named: Inter, Fraunces/.test(note)));
  assert.deepEqual(outside.choice, {
    source_color: "#cc785c",
    type_scale: "modular",
    type_ratio: "minor-third",
    corner_radius: "medium",
  });
});

test("the skill of the command exists, runs the script, writes no value in, and answers nothing for anyone", () => {
  const skill = readFileSync(path.join(PLUGIN, "skills/bring-in/SKILL.md"), "utf8");
  assert.match(skill, /^---\nname: bring-in\ndescription: \S/);
  assert.match(skill, /scripts\/bring-in\.mjs --from <path> --target <repo>/);
  assert.match(skill, /specimen\.mjs --target <repo> --section direction --from <path>/);
  assert.match(skill, /answers nothing for anyone/);
  assert.match(skill, /the ledger wins/);
});

test("review: the primary colour is the colour group's, a shade named light or dark is no mode, and the pick is said", () => {
  const dir = empty();
  const nested = put(
    dir,
    "nested.json",
    JSON.stringify({
      color: { text: { primary: { $value: "#111111" } }, primary: { $value: "#ff5500" } },
    }),
  );
  const picked = candidateFrom(nested);
  assert.equal(picked.values.source_color, "#ff5500");
  assert.equal(picked.picked.source_color, "color.primary");
  const shades = put(
    dir,
    "shades/DESIGN.md",
    [
      "---",
      "name: Shades",
      "colors:",
      "  primary:",
      '    light: "#99ccff"',
      '    main: "#3366ff"',
      '    dark: "#003366"',
      "---",
      "",
    ].join("\n"),
  );
  const shaded = candidateFrom(shades);
  assert.equal(shaded.values.source_color, "#3366ff");
  assert.equal(shaded.dark, null);
});

test("review: modes are read from their names, whichever is the default", () => {
  const dir = empty();
  const darkFirst = JSON.parse(JSON.stringify(VARIABLES));
  const collection = darkFirst.meta.variableCollections.c1;
  collection.defaultModeId = "m2";
  collection.modes = [
    { modeId: "m1", name: "Light Mode" },
    { modeId: "m2", name: "Dark Mode" },
  ];
  const candidate = candidateFrom(put(dir, "dark-first.json", JSON.stringify(darkFirst)));
  assert.equal(candidate.values.source_color, "#0246ff");
  assert.equal(candidate.dark.source_color, "#668cff");
});

test("review: two sources of one name ask apart, and a changed value asks anew", () => {
  const dir = settledRepo();
  const first = put(dir, "one/tokens.json", JSON.stringify(TOKENS));
  const second = put(dir, "two/tokens.json", JSON.stringify(TOKENS));
  const a = bringIn(dir, first, { on: ON });
  const b = bringIn(dir, second, { on: ON });
  assert.equal(a.questions.length, 3);
  assert.equal(b.questions.length, 3);
  assert.notDeepEqual(
    a.questions.map((item) => item.id),
    b.questions.map((item) => item.id),
  );
  const changed = JSON.parse(JSON.stringify(TOKENS));
  changed.radius.base.$value = "16px";
  put(dir, "one/tokens.json", JSON.stringify(changed));
  const again = bringIn(dir, first, { on: ON });
  const radius = again.questions.find((item) => item.id.endsWith("corner-radius"));
  assert.match(radius.question, /corner radius large/);
  assert.equal(again.files.length, 1);
});

test("review: too few sizes, or a step far from every ratio, keep the standard scale and say so", () => {
  const dir = empty();
  const two = candidateFrom(
    put(
      dir,
      "two.json",
      JSON.stringify({
        color: { primary: { $value: "#336699" } },
        font: { size: { sm: { $value: "14px" }, xl: { $value: "2rem" } } },
      }),
    ),
  );
  assert.equal(two.values.type_scale, "standard");
  assert.deepEqual(two.assumed, ["type_scale", "corner_radius"]);
  assert.ok(two.unread.some((item) => /too few sizes above the base/.test(item.why)));
});

// ---- review of PR #108 ---------------------------------------------------------------------------

test("review: rgb(), hsl() and 8-digit hex are read; an unreadable primary is named and never replaced by another role's colour", () => {
  const dir = empty();
  const read = (colour) =>
    candidateFrom(
      put(
        dir,
        `c-${colour.length}-${colour.charCodeAt(4)}.json`,
        JSON.stringify({ color: { primary: { $value: colour } } }),
      ),
    ).values.source_color;
  assert.equal(read("rgb(10 20 30)"), "#0a141e");
  assert.equal(read("rgb(10, 20, 30)"), "#0a141e");
  assert.equal(read("rgba(10, 20, 30, 0.5)"), "#0a141e");
  assert.equal(read("hsl(0 100% 50%)"), "#ff0000");
  assert.equal(read("hsl(120, 100%, 25%)"), "#008000");
  assert.equal(read("#0246ff80"), "#0246ff");
  // Read since item 7.4: CIE Lab, as CSS writes it.
  assert.equal(read("lab(54.29% 80.8 69.89)"), "#ff0000");
  const unreadable = put(
    dir,
    "unreadable.json",
    JSON.stringify({
      color: {
        primary: { $value: "color(display-p3 0.5 0.2 0.1)" },
        accent: { $value: "#ff0000" },
      },
    }),
  );
  assert.throws(
    () => candidateFrom(unreadable),
    /its primary colour color\.primary is written color\(display-p3 0\.5 0\.2 0\.1\), which cannot be read: nothing is guessed/,
  );
});

test("review: the question names the source as the repository does, and two checkouts give it one id", () => {
  const first = settledRepo();
  const second = settledRepo();
  const inside = (dir) => put(dir, "outside/tokens.json", JSON.stringify(TOKENS));
  const a = bringIn(first, inside(first), { on: ON });
  const b = bringIn(second, inside(second), { on: ON });
  assert.deepEqual(
    a.questions.map((item) => item.id),
    b.questions.map((item) => item.id),
  );
  for (const question of a.questions) {
    assert.ok(!question.basis.includes(first), question.basis);
    assert.match(question.basis, /comes from outside\/tokens\.json/);
  }
  // A source outside the repository is named by its file alone, and said to be outside.
  const away = empty();
  const outside = put(away, "brand/tokens.json", JSON.stringify(TOKENS));
  const c = bringIn(settledRepo(), outside, { on: ON });
  for (const question of c.questions) {
    assert.ok(!question.basis.includes(away), question.basis);
    assert.match(question.basis, /comes from tokens\.json, outside the repository/);
  }
});

test("review: a day that is no day is refused by the command's own message", () => {
  const dir = settledRepo();
  const file = put(dir, "outside/tokens.json", JSON.stringify(TOKENS));
  const wrong = cli("--target", dir, "--from", file, "--on", "2026-13-40");
  assert.equal(wrong.status, 2);
  assert.match(wrong.stderr, /--on 2026-13-40 is not a day written YYYY-MM-DD/);
});
