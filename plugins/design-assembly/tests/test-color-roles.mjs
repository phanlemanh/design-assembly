// Item 9.2, slice 1 of specification 0012: the table of colour roles, the roles that follow the
// primary colour, contrast on every pair the table declares, and a repository set up before this
// version that neither changes a value nor turns red (criteria 6, 7, 9 and 10).
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
  floorRoles,
  PAIRS,
  rolesLines,
  tableProblems,
  wordsFromListed,
} from "../scripts/color-roles.mjs";
import { fullStatus } from "../scripts/status.mjs";
import { STAMP, TOOL_COPY, treeHash } from "../scripts/stamp.mjs";
import { parseLedger } from "../templates/tools/design-assembly/ledger.mjs";
import {
  readBlock,
  readVariable,
  withoutBlock,
} from "../templates/tools/design-assembly/theme.mjs";
import { briefRepository, BUILT } from "./helpers/brief-repo.mjs";

const PLUGIN = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const ROOT = path.resolve(PLUGIN, "../..");
const LAYERS = JSON.parse(readFileSync(path.join(PLUGIN, "references/layers.json"), "utf8")).layers;
// The floor this plugin serves, as the sample application has it before any guide ran.
const FLOOR_CSS = withoutBlock(readFileSync(path.join(ROOT, "src/index.css"), "utf8"));

const made = [];
after(() => made.forEach((dir) => rmSync(dir, { recursive: true, force: true })));
const empty = () => {
  const dir = realpathSync(mkdtempSync(path.join(tmpdir(), "design-color-roles-")));
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

const SAID = { by: "Owner Name", on: "2026-11-21" };
// A blueprint the guide can write from. `roles` is the owner's word for each question of the
// table of colour roles, as the guide writes it.
function blueprint({ color = "#0246ff", level = "AA", roles } = {}) {
  const choices = {
    context: { product_type: "application", conformance_level: level },
    patterns: { record_panel: "beside" },
    foundations: { source_color: color, text_font: "floor", heading_font: "text" },
  };
  const layers = {};
  for (const layer of LAYERS) {
    layers[layer.id] = layer.built
      ? { status: "decided", source: "user", choice: choices[layer.id], why: "For the test." }
      : { status: "planned" };
  }
  layers.foundations.answered = { text_font: SAID, heading_font: SAID };
  if (roles) {
    layers.foundations.roles = Object.fromEntries(
      Object.entries(roles).map(([question, source]) => [question, { source, ...SAID }]),
    );
  }
  return { version: 1, status: "approved", layers };
}

// A repository with the floor this plugin serves, and the blueprint given.
function repository(content = blueprint()) {
  const dir = empty();
  put(dir, "src/index.css", FLOOR_CSS);
  put(dir, "Makefile", text(ROOT, "Makefile"));
  put(dir, "design/blueprint.json", JSON.stringify(content, null, 2));
  const font = "node_modules/@fontsource-variable/geist";
  put(dir, `${font}/package.json`, text(ROOT, `${font}/package.json`));
  put(dir, `${font}/index.css`, text(ROOT, `${font}/index.css`));
  return dir;
}
const setBlueprint = (dir, content) =>
  put(dir, "design/blueprint.json", JSON.stringify(content, null, 2));
const block = (dir) => readBlock(text(dir, "src/index.css"));
const contrastChecks = (dir) => json(dir, "design/theme.json").checks["color-contrast"];

// ---- the table ----------------------------------------------------------------------------------

test("every colour role of the floor stands in the table exactly once", () => {
  const floor = floorRoles(FLOOR_CSS);
  // The sample application's 31 roles, the eight of the sidebar among them.
  assert.equal(floor.length, 31, floor.join(", "));
  assert.deepEqual(tableProblems(FLOOR_CSS), []);
  const named = COLOR_ROLES.roles.map((entry) => entry.role);
  assert.equal(new Set(named).size, named.length, "a role stands twice");
  for (const role of floor) assert.ok(named.includes(role), `${role} is not in the table`);
});

test("a role of the floor that the table does not hold is a problem", () => {
  const more = FLOOR_CSS.replace(
    "--background: oklch(1 0 0);",
    "--background: oklch(1 0 0);\n  --brand-glow: oklch(0.7 0.1 40);",
  );
  const found = tableProblems(more);
  assert.equal(found.length, 1, found.join("\n"));
  assert.match(found[0], /--brand-glow/);
  assert.match(found[0], /no line in references\/color-roles\.json/);
});

test("each role says where its value comes from, and is measured or says why not", () => {
  const questions = Object.keys(COLOR_ROLES.questions);
  const formulas = Object.keys(COLOR_ROLES.formulas);
  const grounds = new Set(PAIRS.map((pair) => pair.background));
  for (const entry of COLOR_ROLES.roles) {
    const at = `${entry.role}: `;
    assert.ok(["formula", "follows", "floor"].includes(entry.source), `${at}${entry.source}`);
    if (entry.source === "formula") assert.ok(formulas.includes(entry.formula), at);
    if (entry.source === "follows") {
      const of = COLOR_ROLES.roles.find((other) => other.role === entry.of);
      assert.equal(of?.source, "formula", `${at}follows a role no formula writes`);
    }
    if (entry.source !== "formula") assert.ok(questions.includes(entry.asks), `${at}asks nothing`);
    const measured =
      (entry.on ?? []).length + (entry.against ?? []).length > 0 || grounds.has(entry.role);
    assert.ok(measured || entry.unmeasured, `${at}in no pair, and says not why`);
  }
  // The pairs a person reads and a ring: the trial with an outside tool measured the same fifteen.
  assert.equal(PAIRS.length, 15);
  assert.ok(PAIRS.some((p) => p.foreground === "--muted-foreground" && p.background === "--muted"));
  assert.equal(PAIRS.find((p) => p.foreground === "--ring").kind, "non-text");
});

test("the table prints as words: each role, its source and its pairs", () => {
  const lines = rolesLines();
  assert.equal(lines.filter((line) => /^--/.test(line)).length, 31);
  const sidebar = lines.find((line) => line.startsWith("--sidebar-primary:"));
  assert.match(sidebar, /follows --primary/);
  assert.match(sidebar, /color-roles-sidebar/);
  const muted = lines.find((line) => line.startsWith("--muted-foreground:"));
  assert.match(muted, /kept from the floor/);
  assert.match(muted, /text on --muted, --background/);
  assert.match(
    lines.find((line) => line.startsWith("--muted:")),
    /ground of --muted-foreground/,
  );
  assert.match(
    lines.find((line) => line.startsWith("--chart-1:")),
    /Not measured: /,
  );
  // Through the command a person runs.
  const said = run(script("status.mjs"), "--roles");
  assert.equal(said.status, 0, said.stderr);
  assert.match(said.stdout, /^--sidebar-primary: follows --primary/m);
  assert.match(said.stdout, /^--primary: the formula primary-on-background/m);
});

// ---- roles that follow --------------------------------------------------------------------------

test("without the owner's word the sidebar keeps the floor's values: the block is the one of before", () => {
  const dir = repository();
  apply(dir);
  assert.doesNotMatch(block(dir), /--sidebar-/);
  assert.equal(gate(dir).status, 0, gate(dir).stderr);
});

test("the roles that follow the primary colour change with the source colour, in both modes", () => {
  const dir = repository(blueprint({ roles: { "color-roles-sidebar": "follows" } }));
  apply(dir);
  const css = text(dir, "src/index.css");
  for (const scope of [":root", ".dark"]) {
    assert.equal(
      readVariable(block(dir), scope, "--sidebar-primary"),
      readVariable(block(dir), scope, "--primary"),
    );
    assert.equal(
      readVariable(block(dir), scope, "--sidebar-primary-foreground"),
      readVariable(block(dir), scope, "--primary-foreground"),
    );
    assert.equal(
      readVariable(block(dir), scope, "--sidebar-ring"),
      readVariable(block(dir), scope, "--ring"),
    );
  }
  // The floor's blue of the dark sidebar is no longer the one in force.
  assert.equal(
    readVariable(withoutBlock(css), ".dark", "--sidebar-primary"),
    "oklch(0.488 0.243 264.376)",
  );
  const darkBefore = readVariable(block(dir), ".dark", "--sidebar-primary");
  assert.notEqual(darkBefore, "oklch(0.488 0.243 264.376)");
  assert.equal(gate(dir).status, 0, gate(dir).stderr);

  setBlueprint(dir, blueprint({ color: "#c2410c", roles: { "color-roles-sidebar": "follows" } }));
  apply(dir);
  const darkAfter = readVariable(block(dir), ".dark", "--sidebar-primary");
  assert.notEqual(darkAfter, darkBefore);
  assert.equal(darkAfter, readVariable(block(dir), ".dark", "--primary"));
  // The floor's own part is not touched.
  assert.equal(withoutBlock(text(dir, "src/index.css")), FLOOR_CSS);
  assert.equal(gate(dir).status, 0, gate(dir).stderr);
});

test("an answer in the blueprint that the guide has not written is not in force, and the gate says so", () => {
  const dir = repository();
  apply(dir);
  setBlueprint(dir, blueprint({ roles: { "color-roles-sidebar": "follows" } }));
  const red = gate(dir);
  assert.notEqual(red.status, 0);
  assert.match(red.stderr, /^ {2}tonal-palette: .*colorRoles/m);
});

test("the owner's word for a question of the table needs a name and a day, and a source it takes", () => {
  const dir = repository();
  const wrong = blueprint();
  wrong.layers.foundations.roles = {
    "color-roles-neutral": { source: "follows", ...SAID },
    "color-roles-chart": { source: "floor" },
    "color-roles-nothing": { source: "floor", ...SAID },
  };
  setBlueprint(dir, wrong);
  const refused = run(script("apply.mjs"), "--target", dir);
  assert.notEqual(refused.status, 0);
  assert.match(refused.stderr, /color-roles-neutral.*takes floor/);
  assert.match(refused.stderr, /color-roles-chart.*who gave it and when/);
  assert.match(refused.stderr, /color-roles-nothing.*not a question of the table/);
});

// ---- every pair is measured ---------------------------------------------------------------------

test("the gate measures every pair the table declares, in light and in dark", () => {
  const dir = repository();
  apply(dir);
  const checks = contrastChecks(dir);
  assert.equal(checks.length, PAIRS.length * 2);
  for (const scope of [":root", ".dark"]) {
    for (const pair of PAIRS) {
      const found = checks.find(
        (item) =>
          item.scope === scope &&
          item.foreground === pair.foreground &&
          item.background === pair.background,
      );
      assert.ok(found, `${pair.foreground} on ${pair.background} in ${scope} is not measured`);
      assert.equal(found.min, pair.kind === "text" ? 4.5 : 3);
    }
  }
  const row = parseLedger(text(dir, "design/decisions.yaml")).find(
    (item) => item.id === "color-contrast",
  );
  assert.match(
    row.note,
    /every pair of the plugin.s table of colour roles \(references\/color-roles\.json\)/,
  );
  assert.equal(gate(dir).status, 0, gate(dir).stderr);
});

test("a pair of the floor below the threshold is named with its number, and waits on its question", () => {
  const dir = repository();
  apply(dir);
  const waiting = contrastChecks(dir).filter((item) => item.waits);
  const muted = waiting.find(
    (item) => item.foreground === "--muted-foreground" && item.background === "--muted",
  );
  assert.equal(muted.scope, ":root");
  assert.equal(muted.waits, "color-roles-neutral");
  // The floor's sidebar ring against the sidebar waits on the sidebar's question.
  assert.ok(waiting.some((item) => item.foreground === "--sidebar-ring" && item.scope === ":root"));
  const green = gate(dir);
  assert.equal(green.status, 0, green.stderr);
  assert.match(
    green.stdout,
    /--muted-foreground on --muted in light mode \(:root\) measures 4\.34:1, below 4\.5:1: not checked until the owner answers color-roles-neutral/,
  );
});

test("on a changed copy, one pair below the threshold turns the gate red with the pair, the mode, the ratio and the threshold", () => {
  const dir = repository();
  apply(dir);
  const css = text(dir, "src/index.css");
  put(
    dir,
    "src/index.css",
    css.replace(
      "--secondary-foreground: oklch(0.205 0 0);",
      "--secondary-foreground: oklch(0.9 0 0);",
    ),
  );
  const red = gate(dir);
  assert.notEqual(red.status, 0);
  assert.match(
    red.stderr,
    /color-contrast: --secondary-foreground on --secondary in light mode \(:root\) has a contrast ratio of 1\.\d\d:1, below 4\.5:1/,
  );
});

test("once the owner keeps the neutral roles from the floor, the pair below the threshold is a check, and it is red", () => {
  const dir = repository(blueprint({ roles: { "color-roles-neutral": "floor" } }));
  apply(dir);
  const muted = contrastChecks(dir).find(
    (item) =>
      item.scope === ":root" &&
      item.foreground === "--muted-foreground" &&
      item.background === "--muted",
  );
  assert.equal(muted.waits, undefined);
  const red = gate(dir);
  assert.notEqual(red.status, 0);
  assert.match(
    red.stderr,
    /--muted-foreground on --muted in light mode \(:root\) has a contrast ratio of 4\.34:1, below 4\.5:1/,
  );
});

test("at AAA the threshold for text is 7:1 and for a ring 3:1", () => {
  const dir = repository(blueprint({ level: "AAA" }));
  apply(dir);
  const checks = contrastChecks(dir);
  assert.equal(checks.find((item) => item.foreground === "--foreground").min, 7);
  assert.equal(checks.find((item) => item.foreground === "--ring").min, 3);
});

// ---- a repository of before ---------------------------------------------------------------------

// A repository the guide wrote with the previous version: its contrast check has the two pairs of
// the primary colour in each mode, and its tool copy is stamped 0.30.0.
function before() {
  const dir = repository();
  apply(dir);
  const theme = json(dir, "design/theme.json");
  theme.checks["color-contrast"] = theme.checks["color-contrast"]
    .filter((item) => ["--primary", "--primary-foreground"].includes(item.foreground))
    .filter((item) => ["--background", "--primary"].includes(item.background))
    .map((item) => Object.fromEntries(Object.entries(item).filter(([key]) => key !== "waits")));
  put(dir, "design/theme.json", `${JSON.stringify(theme, null, 2)}\n`);
  put(dir, `${TOOL_COPY}/scale.mjs`, `${text(dir, `${TOOL_COPY}/scale.mjs`)}// older\n`);
  put(
    dir,
    STAMP,
    `${JSON.stringify({ version: "0.30.0", tree: treeHash(path.join(dir, TOOL_COPY)) })}\n`,
  );
  return dir;
}

const roleQuestions = (dir) =>
  fullStatus(dir).waiting.filter((item) => item.id.startsWith("color-roles-"));

test("upgrade on a repository the guide wrote before changes no value, leaves the gate green, and the roles wait", () => {
  const dir = before();
  assert.equal(contrastChecks(dir).length, 4);
  const stylesheet = text(dir, "src/index.css");
  const upgraded = run(script("upgrade.mjs"), "--target", dir, "--json");
  assert.equal(upgraded.status, 0, upgraded.stderr || upgraded.stdout);
  assert.equal(text(dir, "src/index.css"), stylesheet);
  assert.equal(gate(dir).status, 0, gate(dir).stderr);

  const asked = roleQuestions(dir);
  assert.deepEqual(asked.map((item) => item.id).sort(), [
    "color-roles-chart",
    "color-roles-neutral",
    "color-roles-sidebar",
    "color-roles-status",
  ]);
  for (const item of asked) {
    assert.equal(item.answer, "/design-assembly:new");
    assert.ok(item.recommendation.length > 0 && item.basis.length > 0, item.id);
  }
  const neutral = asked.find((item) => item.id === "color-roles-neutral");
  assert.match(
    neutral.basis,
    /--muted-foreground on --muted in light mode is 4\.34:1, below 4\.5:1/,
  );
  const sidebar = asked.find((item) => item.id === "color-roles-sidebar");
  assert.match(sidebar.basis, /--sidebar-primary is oklch\(0\.488 0\.243 264\.376\) in dark mode/);
  // The guide run again keeps every value and the gate green: the pair below waits.
  apply(dir);
  assert.equal(text(dir, "src/index.css"), stylesheet);
  assert.equal(gate(dir).status, 0, gate(dir).stderr);
});

test("a question of the table already on the waiting list is not asked a second time", () => {
  const dir = before();
  put(
    dir,
    "design/waiting/neutral-roles.json",
    `${JSON.stringify({
      id: "neutral-roles",
      kind: "question",
      question: "Are the neutral roles kept from the floor?",
      recommendation: "Wait for the neutral family",
      basis: "For the test.",
      hard_to_undo: false,
      item: "decision:color-roles-neutral",
    })}\n`,
  );
  const ids = fullStatus(dir).waiting.map((item) => item.id);
  assert.ok(ids.includes("neutral-roles"), ids.join(", "));
  assert.equal(ids.includes("color-roles-neutral"), false, ids.join(", "));
  assert.ok(ids.includes("color-roles-sidebar"), ids.join(", "));
});

// A repository that adopted its own values with the previous version: the floor, its own primary,
// and the two pairs of the primary colour checked.
function adoptedBefore() {
  const dir = empty();
  put(dir, "src/index.css", FLOOR_CSS);
  put(dir, "Makefile", text(ROOT, "Makefile"));
  const font = "node_modules/@fontsource-variable/geist";
  put(dir, `${font}/package.json`, text(ROOT, `${font}/package.json`));
  put(dir, `${font}/index.css`, text(ROOT, `${font}/index.css`));
  const adopted = run(script("adopt.mjs"), "--target", dir, "--conformance-level", "AA");
  assert.ok([0, 1].includes(adopted.status), adopted.stderr);
  const theme = json(dir, "design/theme.json");
  theme.checks["color-contrast"] = theme.checks["color-contrast"]
    .filter((item) => ["--primary", "--primary-foreground"].includes(item.foreground))
    .filter((item) => ["--background", "--primary"].includes(item.background))
    .map((item) => Object.fromEntries(Object.entries(item).filter(([key]) => key !== "waits")));
  put(dir, "design/theme.json", `${JSON.stringify(theme, null, 2)}\n`);
  put(
    dir,
    STAMP,
    `${JSON.stringify({ version: "0.30.0", tree: treeHash(path.join(dir, TOOL_COPY)) })}\n`,
  );
  return dir;
}

test("adopt measures every pair: what reaches the threshold is held, what is below waits, named with its number", () => {
  const dir = empty();
  put(dir, "src/index.css", FLOOR_CSS);
  put(dir, "Makefile", text(ROOT, "Makefile"));
  const adopted = run(script("adopt.mjs"), "--target", dir, "--conformance-level", "AA");
  assert.ok([0, 1].includes(adopted.status), adopted.stderr);
  assert.match(
    adopted.stdout,
    /--muted-foreground on --muted in light mode is 4\.34:1, below 4\.5:1/,
  );
  const checks = contrastChecks(dir);
  assert.ok(checks.length > 4, `${checks.length} pairs`);
  assert.equal(
    checks.find(
      (item) =>
        item.foreground === "--muted-foreground" &&
        item.background === "--muted" &&
        item.scope === ":root",
    ).waits,
    "color-roles-neutral",
  );
  const green = gate(dir);
  assert.equal(green.status, 0, green.stderr);
});

test("upgrade and adopt on a repository adopted before change no value, leave the gate green, and the roles wait", () => {
  const dir = adoptedBefore();
  const stylesheet = text(dir, "src/index.css");
  assert.equal(gate(dir).status, 0, gate(dir).stderr);
  const upgraded = run(script("upgrade.mjs"), "--target", dir, "--json");
  assert.equal(upgraded.status, 0, upgraded.stderr || upgraded.stdout);
  const adopted = run(script("adopt.mjs"), "--target", dir);
  assert.ok([0, 1].includes(adopted.status), adopted.stderr);
  assert.equal(text(dir, "src/index.css"), stylesheet);
  assert.equal(gate(dir).status, 0, gate(dir).stderr);
  const asked = roleQuestions(dir);
  assert.ok(asked.length >= 3, asked.map((item) => item.id).join(", "));
  for (const item of asked) assert.equal(item.answer, "/design-assembly:decide");
  const neutral = asked.find((item) => item.id === "color-roles-neutral");
  assert.match(
    neutral.basis,
    /--muted-foreground on --muted in light mode is 4\.34:1, below 4\.5:1/,
  );
});

// ---- the rules page and the brief ---------------------------------------------------------------

const ROLE_CHECKS = {
  "color-contrast": PAIRS.map((pair) => ({
    kind: "contrast",
    scope: ":root",
    foreground: pair.foreground,
    background: pair.background,
    min: pair.kind === "text" ? 4.5 : 3,
  })),
};
const none = () => false;
const colourLines = (page) => page.split("\n").filter((line) => /colour role/i.test(line));

test("the rules page says the colour roles and where each comes from only where the repository has the rows", () => {
  const page = rulesPage(
    ROLE_CHECKS,
    none,
    blueprint({ roles: { "color-roles-sidebar": "follows" } }),
  );
  const lines = colourLines(page);
  assert.ok(lines.length > 0, "the rules page says nothing of the colour roles");
  assert.match(page, /--sidebar-primary follows --primary/);
  assert.match(
    page,
    /--muted-foreground, .* are kept from the floor, waiting on the owner \(color-roles-neutral\)/,
  );
  assert.deepEqual(colourLines(rulesPage({}, none, blueprint())), []);
});

test("the brief sheet reads the colour roles through the same reader as every other rule", () => {
  const page = rulesPage(
    ROLE_CHECKS,
    none,
    blueprint({ roles: { "color-roles-sidebar": "follows" } }),
  );
  const repo = briefRepository({ ".claude/rules/design-assembly.md": page });
  try {
    const slot = brief(repo.dir, BUILT).slots.find((item) => item.id === "rules");
    assert.match(JSON.stringify(slot.answer), /--sidebar-primary follows --primary/);
  } finally {
    repo.remove();
  }
});

test("an answer on the waiting list is a word for its question: its source, or the recommended one when kept", () => {
  const row = (question, answer) => ({
    id: question,
    item: `decision:${question}`,
    answer,
    by: "Owner Name",
    on: "2026-11-20",
  });
  const words = wordsFromListed([
    row("color-roles-sidebar", "keep"),
    row("color-roles-chart", "floor"),
    // Keeping a recommendation to wait is no word yet; an answer the question does not take is none.
    row("color-roles-neutral", "keep"),
    row("color-roles-status", "purple"),
    { id: "Q1", item: "decision:typeface", answer: "keep" },
  ]);
  assert.deepEqual(words, {
    "color-roles-sidebar": { source: "follows", by: "Owner Name", on: "2026-11-20" },
    "color-roles-chart": { source: "floor", by: "Owner Name", on: "2026-11-20" },
  });
});

test("a pair of a role a formula writes, or of the repository's own primary, never waits: adopt takes nothing below", () => {
  const dir = empty();
  // A light primary of the repository's own, with dark text on it: the text passes, the primary on
  // white does not.
  put(
    dir,
    "src/index.css",
    FLOOR_CSS.replace("--primary: oklch(0.205 0 0);", "--primary: #9db8ff;").replace(
      "--primary-foreground: oklch(0.985 0 0);",
      "--primary-foreground: #0a0a0a;",
    ),
  );
  put(dir, "Makefile", text(ROOT, "Makefile"));
  const adopted = run(script("adopt.mjs"), "--target", dir, "--conformance-level", "AA");
  assert.ok([0, 1].includes(adopted.status), adopted.stderr);
  assert.match(
    adopted.stdout,
    /would fail today, so nothing was added:\n(?:.*\n)*?\s+color-contrast: light: --primary on --background is \d\.\d\d:1, below 4\.5:1/,
  );
  const rows = parseLedger(text(dir, "design/decisions.yaml"));
  assert.equal(
    rows.some((row) => row.id === "color-contrast"),
    false,
  );
});

test("an owner who keeps the recommendation to wait is not asked again, on either path", () => {
  const keep = (dir, question) =>
    put(
      dir,
      `design/waiting/${question}.json`,
      `${JSON.stringify({
        id: question,
        question: "For the test.",
        recommendation: "Wait",
        basis: "For the test.",
        hard_to_undo: false,
        item: `decision:${question}`,
        answer: "keep",
        by: "Owner Name",
        on: "2026-11-20",
      })}\n`,
    );
  const guided = before();
  keep(guided, "color-roles-neutral");
  const guidedIds = fullStatus(guided).waiting.map((item) => item.id);
  assert.equal(guidedIds.includes("color-roles-neutral"), false, guidedIds.join(", "));
  assert.ok(guidedIds.includes("color-roles-status"), guidedIds.join(", "));

  const own = adoptedBefore();
  keep(own, "color-roles-neutral");
  const ownIds = fullStatus(own).waiting.map((item) => item.id);
  assert.equal(ownIds.includes("color-roles-neutral"), false, ownIds.join(", "));
  for (const item of fullStatus(own).waiting) {
    assert.doesNotMatch(item.recommendation, /blueprint/, item.id);
  }
});

test("status --roles on a repository that adopted its values reads the owner's word from the waiting list", () => {
  const dir = adoptedBefore();
  const asked = run(script("status.mjs"), "--target", dir, "--roles");
  assert.match(
    asked.stdout,
    /^--chart-1: kept from the floor, waiting on the owner \(color-roles-chart\)/m,
  );
  put(
    dir,
    "design/waiting/color-roles-chart.json",
    `${JSON.stringify({
      id: "color-roles-chart",
      question: "For the test.",
      recommendation: "Keep them from the floor",
      basis: "For the test.",
      hard_to_undo: false,
      item: "decision:color-roles-chart",
      answer: "keep",
      by: "Owner Name",
      on: "2026-11-20",
    })}\n`,
  );
  const said = run(script("status.mjs"), "--target", dir, "--roles");
  assert.match(
    said.stdout,
    /^--chart-1: kept from the floor, the owner's word \(color-roles-chart, Owner Name on 2026-11-20\)/m,
  );
});
