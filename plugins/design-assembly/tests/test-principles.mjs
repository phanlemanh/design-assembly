// The design principles an owner fixes in the guide, and the reasons every recommendation of the
// guide rests on. The catalog is checked against the layers it speaks to; the rules are checked as
// functions, then on throwaway repositories with the real floor: the guide, the gate, the decision
// sheet and the status.
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { cpSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { execPath } from "node:process";
import { after, test } from "node:test";
import { fileURLToPath } from "node:url";

import { DIRECTIONS } from "../scripts/directions.mjs";
import {
  CATALOG,
  principleCall,
  principleProblems,
  principleRows,
  principlesOf,
  recommendations,
  RECOMMENDED_CHOICES,
} from "../scripts/principles.mjs";
import { status } from "../scripts/status.mjs";
import { parseLedger } from "../templates/tools/design-assembly/ledger.mjs";
import { sheetProblem } from "../templates/tools/design-assembly/owner-calls.mjs";
import { withoutBlock } from "../templates/tools/design-assembly/theme.mjs";

const PLUGIN = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const ROOT = path.resolve(PLUGIN, "../..");
const LAYERS = JSON.parse(readFileSync(path.join(PLUGIN, "references/layers.json"), "utf8")).layers;
const CHOICES = LAYERS.flatMap((layer) => layer.choices ?? []);
const script = (name) => path.join(PLUGIN, "scripts", name);

const made = [];
after(() => made.forEach((dir) => rmSync(dir, { recursive: true, force: true })));

const BASE = {
  context: { product_type: "application", conformance_level: "AA" },
  patterns: { record_panel: "beside" },
  foundations: {
    source_color: "#0246ff",
    type_scale: "standard",
    spacing_unit: "4px",
    corner_radius: "small",
  },
};
// A blueprint every built layer of which is decided, with the principles given on its context.
function blueprint(principles, { source = "user", choice = {}, status = "approved" } = {}) {
  const layers = {};
  for (const layer of LAYERS) {
    layers[layer.id] = layer.built
      ? {
          status: "decided",
          source,
          choice: { ...BASE[layer.id], ...choice[layer.id] },
          why: "For the test.",
        }
      : { status: "planned" };
  }
  if (principles !== undefined) layers.context.principles = principles;
  return { version: 1, status, layers };
}
const fixed = (...ids) => ids.map((id) => ({ id, source: "user" }));
const THREE = fixed("context-stays-in-view", "soft-and-approachable", "familiar-over-novel");

const put = (dir, file, text) => {
  mkdirSync(path.dirname(path.join(dir, file)), { recursive: true });
  writeFileSync(path.join(dir, file), text);
};
const text = (dir, file) => readFileSync(path.join(dir, file), "utf8");
function floor(content) {
  const dir = mkdtempSync(path.join(tmpdir(), "design-principles-"));
  made.push(dir);
  put(dir, "src/index.css", withoutBlock(text(ROOT, "src/index.css")));
  put(dir, "Makefile", text(ROOT, "Makefile"));
  put(dir, "design/blueprint.json", JSON.stringify(content, null, 2));
  return dir;
}
const run = (name, ...args) => spawnSync(execPath, [script(name), ...args], { encoding: "utf8" });
const apply = (dir, ...args) => run("apply.mjs", "--target", dir, ...args);
const rowsOf = (dir) => parseLedger(text(dir, "design/decisions.yaml"));
const rowOf = (dir, id) => rowsOf(dir).find((row) => row.id === id);
const recommended = (list, key) => list.find((item) => item.key === key);

// Applying is slow: each blueprint is applied once and copied for a test that changes it.
const built = new Map();
function applied(content) {
  const key = JSON.stringify(content);
  if (!built.has(key)) {
    const dir = floor(content);
    const result = apply(dir);
    assert.equal(result.status, 0, result.stderr);
    built.set(key, dir);
  }
  const copy = mkdtempSync(path.join(tmpdir(), "design-principles-"));
  made.push(copy);
  cpSync(built.get(key), copy, { recursive: true });
  return copy;
}

test("every principle of the catalog favours real options, and says why", () => {
  const ids = CATALOG.map((principle) => principle.id);
  assert.equal(new Set(ids).size, ids.length, "ids are unique");
  assert.ok(CATALOG.length >= 5, "more principles than the owner fixes, so there is a choice");
  for (const principle of CATALOG) {
    assert.match(principle.id, /^[a-z0-9]+(-[a-z0-9]+)*$/);
    assert.ok(principle.name.trim() && principle.statement.trim(), principle.id);
    assert.ok(principle.suits.every((type) => ["application", "content-site"].includes(type)));
    assert.ok(principle.favours.length > 0, `${principle.id} favours nothing`);
    for (const favour of principle.favours) {
      const choice = CHOICES.find((item) => item.key === favour.choice);
      assert.ok(choice, `${principle.id}: ${favour.choice} is not a choice`);
      assert.ok(favour.option in (choice.options ?? {}), `${principle.id}: ${favour.option}`);
      assert.ok(RECOMMENDED_CHOICES.includes(favour.choice), `${favour.choice} is recommended`);
      assert.ok(favour.why.trim(), `${principle.id}: ${favour.choice} says why`);
    }
    // A ratio only applies to a modular scale: a principle that favours one favours the scale.
    if (principle.favours.some((favour) => favour.choice === "type_ratio")) {
      assert.ok(
        principle.favours.some((f) => f.choice === "type_scale" && f.option === "modular"),
        principle.id,
      );
    }
  }
  // Each product type is offered at least the most the owner fixes.
  for (const type of ["application", "content-site"]) {
    assert.ok(CATALOG.filter((principle) => principle.suits.includes(type)).length >= 5, type);
  }
});

test("with no principle every recommendation rests on a standard, by product type", () => {
  const application = recommendations(blueprint(undefined));
  assert.deepEqual(
    application.map((item) => [item.key, item.option]),
    [
      ["conformance_level", "AA"],
      ["type_scale", "standard"],
      ["corner_radius", "floor"],
      ["text_font", "floor"],
      ["heading_font", "text"],
      ["neutral_family", "grey"],
      ["status_tones", ["error"]],
      ["record_panel", "beside"],
    ],
  );
  for (const item of application) {
    assert.equal(item.basis.kind, "standard", item.key);
    assert.ok(item.basis.text.trim(), item.key);
  }
  const content = recommendations(
    blueprint(undefined, {
      choice: { context: { product_type: "content-site" }, foundations: { type_scale: undefined } },
    }),
  );
  assert.equal(recommended(content, "type_scale").option, "modular");
  assert.equal(recommended(content, "type_ratio").option, "major-third");
  assert.equal(recommended(content, "record_panel").option, "in-place");
  // The ratio follows the scale the blueprint has, when it has one.
  const modular = recommendations(
    blueprint(undefined, {
      choice: { foundations: { type_scale: "modular", type_ratio: "major-third" } },
    }),
  );
  assert.equal(recommended(modular, "type_ratio").option, "minor-third");
});

test("a principle the owner fixed settles the choices it favours, and names itself", () => {
  const list = recommendations(blueprint(THREE));
  const radius = recommended(list, "corner_radius");
  // Two fixed principles speak to the radius and disagree: neither settles it.
  assert.equal(radius.basis.kind, "standard");
  assert.deepEqual(
    radius.conflict.map((item) => [item.option, item.principles]),
    [
      ["large", ["soft-and-approachable"]],
      ["floor", ["familiar-over-novel"]],
    ],
  );
  assert.match(radius.basis.text, /pull different ways/);
  const panel = recommended(list, "record_panel");
  assert.equal(panel.option, "beside");
  assert.deepEqual(panel.basis.principles, ["context-stays-in-view"]);
  assert.equal(panel.basis.kind, "principle");
  assert.match(panel.basis.text, /context stays in view/);
  assert.equal(panel.conflict, undefined);

  const soft = recommendations(
    blueprint(fixed("soft-and-approachable", "readable-for-everyone", "context-stays-in-view")),
  );
  assert.equal(recommended(soft, "corner_radius").option, "large");
  assert.equal(recommended(soft, "conformance_level").option, "AAA");
  assert.equal(recommended(soft, "conformance_level").basis.kind, "principle");
});

test("a principle nobody confirmed, or one in the owner's own words, settles nothing", () => {
  const proposed = THREE.map((principle) => ({ ...principle, source: "proposed" }));
  for (const item of recommendations(blueprint(proposed)))
    assert.equal(item.basis.kind, "standard");
  const own = [
    { id: "quiet-colour", source: "user", text: "Colour only marks what acts." },
    ...THREE.slice(0, 2),
  ];
  assert.deepEqual(
    principlesOf(blueprint(own)).map((p) => [p.id, p.own, p.favours.length]),
    [
      ["quiet-colour", true, 0],
      ["context-stays-in-view", false, 1],
      ["soft-and-approachable", false, 1],
    ],
  );
});

test("the blueprint's principles are three to five, named once, each with a source", () => {
  assert.deepEqual(principleProblems(blueprint(undefined)), []);
  assert.deepEqual(principleProblems(blueprint(THREE)), []);
  const say = (list, options) => principleProblems(blueprint(list, options)).join("\n");
  assert.match(say(THREE.slice(0, 2)), /three to five/);
  // While the blueprint is designed, fewer are a start, not a fault.
  assert.equal(
    principleProblems(blueprint(THREE.slice(0, 1), { status: "designing" }), { preview: true })
      .length,
    0,
  );
  assert.match(say(fixed(...CATALOG.slice(0, 6).map((p) => p.id))), /three to five/);
  assert.match(say([...THREE, THREE[0]]), /context-stays-in-view is named twice/);
  assert.match(
    say([...THREE.slice(0, 2), { id: "familiar-over-novel", source: "owner" }]),
    /source is user or proposed/,
  );
  assert.match(
    say([...THREE.slice(0, 2), { id: "own-words", source: "user" }]),
    /own-words: a principle of the owner's own words has its text/,
  );
  assert.match(
    say([...THREE.slice(0, 2), { id: "Bad Id", source: "user", text: "x" }]),
    /Bad Id: an id is lowercase words joined by hyphens/,
  );
  assert.match(say("not a list"), /principles is a list/);
});

test("each principle is a judgment row of the context layer, and a proposal says so", () => {
  const rows = principleRows(
    blueprint([...THREE.slice(0, 2), { id: "familiar-over-novel", source: "proposed" }]),
  );
  assert.deepEqual(
    rows.map((row) => [row.id, row.layer, row.kind, row.source, row.note ?? null]),
    [
      ["principle-context-stays-in-view", "context", "judgment", "design/blueprint.json", null],
      ["principle-soft-and-approachable", "context", "judgment", "design/blueprint.json", null],
      [
        "principle-familiar-over-novel",
        "context",
        "judgment",
        "design/blueprint.json",
        "proposed by the guide; a person has not confirmed it",
      ],
    ],
  );
});

test("the guide writes the principles, gives them to a machine, and the gate holds", () => {
  const dir = applied(blueprint(THREE));
  assert.deepEqual(
    rowsOf(dir)
      .filter((row) => row.id.startsWith("principle-"))
      .map((row) => row.id),
    THREE.map((principle) => `principle-${principle.id}`),
  );
  const record = text(dir, "design/decisions/context.md");
  assert.match(record, /## Design principles/);
  assert.match(record, /context-stays-in-view.*opening a record never hides the list/);
  const again = apply(dir, "--json");
  assert.equal(again.status, 0, again.stderr);
  const data = JSON.parse(again.stdout);
  assert.deepEqual(
    data.principles.map((p) => [p.id, p.source, p.confirmed]),
    THREE.map((p) => [p.id, "user", true]),
  );
  assert.ok(data.principles.every((p) => p.statement && Array.isArray(p.favours)));
  assert.equal(recommended(data.recommendations, "record_panel").basis.kind, "principle");
  // The second run changes nothing.
  assert.deepEqual(data.files, []);
  const checked = spawnSync(
    execPath,
    [path.join(dir, "tools/design-assembly/check.mjs"), "--target", dir],
    { encoding: "utf8" },
  );
  assert.equal(checked.status, 0, checked.stdout + checked.stderr);
});

test("a principle taken out of the blueprint leaves the ledger; a row of another hand stays", () => {
  const dir = applied(blueprint(THREE));
  const ledger = text(dir, "design/decisions.yaml");
  put(
    dir,
    "design/decisions.yaml",
    `${ledger}  - id: principle-of-the-team\n    layer: context\n    kind: judgment\n    source: "docs/team.md"\n`,
  );
  const fewer = blueprint([...THREE.slice(0, 2), { id: "clear-hierarchy", source: "user" }]);
  put(dir, "design/blueprint.json", JSON.stringify(fewer, null, 2));
  const result = apply(dir);
  assert.equal(result.status, 0, result.stderr);
  const ids = rowsOf(dir).map((row) => row.id);
  assert.ok(!ids.includes("principle-familiar-over-novel"));
  assert.ok(ids.includes("principle-clear-hierarchy"));
  assert.ok(ids.includes("principle-of-the-team"));
});

test("the preview says which value goes against a principle the owner fixed", () => {
  const content = blueprint(
    fixed("soft-and-approachable", "context-stays-in-view", "clear-hierarchy"),
    { status: "designing" },
  );
  const result = apply(floor(content), "--dry-run");
  assert.match(result.stdout, /principle soft-and-approachable \(user\): Shapes feel soft/);
  assert.match(
    result.stdout,
    /hint: corner_radius is small; the principle soft and approachable favours large: large corners read as soft/,
  );
  assert.doesNotMatch(result.stdout, /hint: record_panel/);
  const none = apply(floor(blueprint(undefined, { status: "designing" })), "--dry-run");
  assert.match(none.stdout, /hint: no design principle is recorded yet/);
});

test("the gate takes a principle the owner fixed as answered, and a proposal as asked", () => {
  const mixed = [...THREE.slice(0, 2), { id: "familiar-over-novel", source: "proposed" }];
  const dir = applied(blueprint(mixed));
  const checked = spawnSync(
    execPath,
    [path.join(dir, "tools/design-assembly/check.mjs"), "--target", dir],
    { encoding: "utf8" },
  );
  assert.equal(checked.status, 0, checked.stdout + checked.stderr);
  assert.equal(
    rowOf(dir, "principle-familiar-over-novel").note,
    "proposed by the guide; a person has not confirmed it",
  );
});

test("keeping a proposed principle on the decision sheet makes it the owner's in the blueprint", () => {
  const mixed = [...THREE.slice(0, 2), { id: "familiar-over-novel", source: "proposed" }];
  const dir = applied(blueprint(mixed));
  const answers = path.join(dir, "answers.txt");
  writeFileSync(answers, "principle-familiar-over-novel giữ\n");
  const decided = run(
    "decide.mjs",
    "--target",
    dir,
    "--answers",
    answers,
    "--by",
    "A Person",
    "--on",
    "2026-11-19",
  );
  assert.ok([0, 1].includes(decided.status), decided.stderr);
  const after = JSON.parse(text(dir, "design/blueprint.json"));
  assert.equal(
    after.layers.context.principles.find((p) => p.id === "familiar-over-novel").source,
    "user",
  );
  assert.match(
    rowOf(dir, "principle-familiar-over-novel").note,
    /confirmed by A Person on 2026-11-19/,
  );
  // Running the guide again keeps it the owner's: the row says no proposal.
  assert.equal(apply(dir).status, 0);
  assert.equal(rowOf(dir, "principle-familiar-over-novel").note, undefined);
});

test("the status asks about a proposed principle in its own words, and rests a call on a fixed one", () => {
  const principles = [
    ...fixed("readable-for-everyone", "context-stays-in-view"),
    { id: "clear-hierarchy", source: "proposed" },
  ];
  const dir = applied(blueprint(principles, { source: "proposed" }));
  const waiting = status(dir).waiting;
  const asked = waiting.find((item) => item.id === "principle-clear-hierarchy");
  assert.match(asked.question, /"The order of importance is seen before it is read/);
  assert.match(asked.basis, /catalog of design principles/);
  const level = waiting.find((item) => item.id === "conformance-level");
  assert.match(level.recommendation, /AAA/);
  assert.match(level.basis, /^a design principle the owner fixed: readable for everyone/);
  // A row no principle the owner fixed speaks to keeps the standard's recommendation.
  assert.doesNotMatch(waiting.find((item) => item.id === "product-type").basis, /principle/);
  // In the status document the reason is of the principle's kind.
  const out = mkdtempSync(path.join(tmpdir(), "design-principles-out-"));
  made.push(out);
  const handed = run("status.mjs", "--target", dir, "--out", out);
  assert.ok([0, 1].includes(handed.status), handed.stderr);
  assert.match(
    text(out, "status-report.html"),
    /A design principle the owner fixed:<\/b> readable for everyone/,
  );
});

test("a principle's call says to keep a value it favours, and to reconsider one it does not", () => {
  const level = (value) =>
    principleCall(
      blueprint(fixed("readable-for-everyone", "clear-hierarchy", "context-stays-in-view"), {
        choice: { context: { conformance_level: value } },
      }),
      "conformance-level",
    );
  assert.match(level("AAA").recommendation, /^Confirm it: a principle you fixed favours AAA/);
  assert.match(
    level("AA").recommendation,
    /^Reconsider it: .* favours AAA, and the blueprint has AA/,
  );
  assert.equal(level("AA").basis.kind, "principle");
  // A choice no fixed principle speaks to, and a row that is no principle, give nothing.
  assert.equal(principleCall(blueprint(THREE), "conformance-level"), null);
  assert.equal(principleCall(blueprint(THREE), "source-color"), null);
});

test("the gate: a principle row a branch adds is answered once the owner fixed it, and not before", () => {
  const row = {
    id: "principle-clear-hierarchy",
    layer: "context",
    kind: "judgment",
    source: "design/blueprint.json",
  };
  const gate = (source, status = "decided") => {
    const content = blueprint([...THREE.slice(0, 2), { id: "clear-hierarchy", source }]);
    content.layers.context.status = status;
    return sheetProblem({
      ledger: [row],
      branch: { judgments: [row.id] },
      waiting: { rows: [] },
      blueprint: content,
      sources: {},
      tagged: [],
    });
  };
  assert.equal(gate("user"), null);
  assert.match(
    gate("proposed"),
    /principle-clear-hierarchy: a judgment this branch writes, which no person answered/,
  );
  assert.match(gate("user", "pending"), /principle-clear-hierarchy/);
  // A row that says nobody confirmed it is a question already.
  assert.equal(
    sheetProblem({
      ledger: [{ ...row, note: "proposed by the guide; a person has not confirmed it" }],
      branch: { judgments: [row.id] },
      waiting: { rows: [] },
      blueprint: null,
      sources: {},
      tagged: [],
    }),
    null,
  );
});

test("an entry that is no principle is passed over where the blueprint is read, and a twice-named one counts once", () => {
  const odd = [null, { id: 5, source: "user", text: "x" }, "words", ...THREE, THREE[0]];
  assert.deepEqual(
    principlesOf(blueprint(odd)).map((p) => p.id),
    THREE.map((p) => p.id),
  );
  assert.equal(principleRows(blueprint(odd)).length, 3);
  assert.doesNotThrow(() => recommendations(blueprint(odd)));
  // The status and the sheet still read a repository whose blueprint was edited by hand that way.
  const dir = applied(
    blueprint([...THREE.slice(0, 2), { id: "clear-hierarchy", source: "proposed" }]),
  );
  const content = JSON.parse(text(dir, "design/blueprint.json"));
  content.layers.context.principles.unshift(null, { id: 5 });
  put(dir, "design/blueprint.json", JSON.stringify(content));
  assert.ok(status(dir).waiting.some((item) => item.id === "principle-clear-hierarchy"));
  const sheet = run("decide.mjs", "--target", dir, "--json");
  assert.ok([0, 1].includes(sheet.status), sheet.stderr);
});

test("refusing a proposed principle leaves it proposed in the blueprint", () => {
  const dir = applied(
    blueprint([...THREE.slice(0, 2), { id: "clear-hierarchy", source: "proposed" }]),
  );
  const answers = path.join(dir, "answers.txt");
  writeFileSync(answers, "principle-clear-hierarchy bác Not ours: we keep one size of heading.\n");
  const decided = run(
    "decide.mjs",
    "--target",
    dir,
    "--answers",
    answers,
    "--by",
    "A Person",
    "--on",
    "2026-11-19",
  );
  assert.ok([0, 1].includes(decided.status), decided.stderr);
  const after = JSON.parse(text(dir, "design/blueprint.json"));
  assert.equal(
    after.layers.context.principles.find((p) => p.id === "clear-hierarchy").source,
    "proposed",
  );
  assert.match(rowOf(dir, "principle-clear-hierarchy").note, /refused by A Person on 2026-11-19/);
});

test("the call on a principle in the owner's own words rests on the guide's standard, not on a measurement", () => {
  const own = [
    { id: "quiet-colour", source: "proposed", text: "Colour only marks what acts." },
    ...THREE.slice(0, 2),
  ];
  const call = principleCall(blueprint(own), "principle-quiet-colour");
  assert.match(call.question, /"Colour only marks what acts\."/);
  assert.equal(call.basis.kind, "standard");
  assert.match(call.basis.text, /no option of a layer follows from them/);
});

// The rules page an agent reads before it touches a screen carries what the owner fixed first.
const FIXED_HEADING = "## What the owner fixed before any value";
const intentLines = (page) => {
  const from = page.indexOf(FIXED_HEADING);
  if (from < 0) return [];
  const rest = page.slice(from + FIXED_HEADING.length);
  const next = rest.indexOf("\n## ");
  return (next < 0 ? rest : rest.slice(0, next))
    .split("\n")
    .filter((line) => line.startsWith("- "));
};

test("the rules page says each principle the owner fixed and the direction taken, one line each", async () => {
  const { rulesPage } = await import("../scripts/apply.mjs");
  const content = blueprint([
    ...THREE.slice(0, 2),
    { id: "familiar-over-novel", source: "proposed" },
    { id: "quiet-colour", source: "user", text: "Colour only\nmarks what acts." },
  ]);
  content.layers.foundations.direction = "workbench";
  const lines = intentLines(rulesPage({}, () => false, content));
  const statement = (id) => CATALOG.find((principle) => principle.id === id).statement;
  assert.deepEqual(lines.slice(0, 4), [
    `- \`principle-context-stays-in-view\`: ${statement("context-stays-in-view")}`,
    `- \`principle-soft-and-approachable\`: ${statement("soft-and-approachable")}`,
    "- `principle-quiet-colour`: Colour only marks what acts.",
    `- The direction the owner took is \`workbench\`: ${DIRECTIONS.find((d) => d.id === "workbench").character}`,
  ]);
  // A principle nobody fixed is named as that, and never as one of the owner's.
  assert.ok(!lines.some((line) => line.startsWith("- `principle-familiar-over-novel`")));
  assert.equal(
    lines[4],
    "- In the blueprint but not fixed by the owner, so settling nothing: `principle-familiar-over-novel`.",
  );
  // The last line says how they are used, and that no check holds them.
  assert.match(lines.at(-1), /no check holds/i);
  assert.equal(lines.length, 6);
});

test("the rules page has no such section where the owner fixed no principle and took no direction", async () => {
  const { rulesPage } = await import("../scripts/apply.mjs");
  const bare = rulesPage({}, () => false);
  assert.ok(!bare.includes(FIXED_HEADING));
  assert.equal(
    rulesPage({}, () => false, blueprint()),
    bare,
  );
  assert.equal(
    rulesPage({}, () => false, blueprint([])),
    bare,
  );
  // An own principle with no words, as a hand may leave it, is not a line.
  assert.equal(
    rulesPage({}, () => false, blueprint([{ id: "no-words", source: "user" }])),
    bare,
  );
  // A proposal alone settles nothing, but an agent is told so.
  const proposed = intentLines(
    rulesPage({}, () => false, blueprint([{ id: "clear-hierarchy", source: "proposed" }])),
  );
  assert.equal(proposed.length, 2);
  assert.equal(
    proposed[0],
    "- In the blueprint but not fixed by the owner, so settling nothing: `principle-clear-hierarchy`.",
  );
  // Several are named together; one with a source that is neither is not the owner's either.
  const several = intentLines(
    rulesPage(
      {},
      () => false,
      blueprint([
        { id: "clear-hierarchy", source: "proposed" },
        { id: "of-a-hand", source: "repo", text: "Written by hand." },
      ]),
    ),
  );
  assert.equal(
    several[0],
    "- In the blueprint but not fixed by the owner, so settling nothing: `principle-clear-hierarchy`, `principle-of-a-hand`.",
  );
});

test("the guide writes the rules page with every principle row of the ledger the owner fixed", () => {
  const content = blueprint([...THREE, { id: "clear-hierarchy", source: "proposed" }]);
  content.layers.foundations.direction = "workbench";
  const dir = applied(content);
  const lines = intentLines(text(dir, ".claude/rules/design-assembly.md"));
  const rows = rowsOf(dir).filter((row) => row.id.startsWith("principle-"));
  assert.equal(rows.length, 4);
  for (const row of rows) {
    const said = lines.some((line) => line.startsWith(`- \`${row.id}\`: `));
    assert.equal(said, row.note === undefined, row.id);
  }
  assert.ok(lines.some((line) => line.includes("`workbench`")));
});
