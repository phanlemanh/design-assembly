// The bridge in (specification 0014, criteria 9 and 15): what a tool from outside made, read into one
// candidate direction that stands beside the plugin's on the sheet. Three kinds of sample are read:
// a token file in the token format the design token group writes, a DESIGN.md, and an export of
// variables by collection and mode; and a system folder of tokens and a README. A value written as
// an expression or a reference becomes its final value; a value against a row the owner settled
// becomes a question, never a new row. Every sample is a fixture: nothing calls a model or the
// network.
// And the plug a design tool's system comes through (specification 0018, criteria 10 to 12, with 15
// and 16): its plug file says the ways a person gets a file the bridge reads, the saved file first;
// the board shows where it stands and never asks about it while it is unmeasured; and the skill
// says each way, runs no reader for the person, and says what a call sends before it is made.
import "./helpers/own-cores.mjs";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { env, execPath } from "node:process";
import { after, test } from "node:test";
import { fileURLToPath } from "node:url";

import { bringIn, candidateFrom, conflictsOf } from "../scripts/bring-in.mjs";
import {
  coreFiles,
  coreProblems,
  outsideNamesIn,
  plugProblems,
  readCapabilities,
} from "../scripts/capabilities.mjs";
import { plan, recommendationOf } from "../scripts/plugs.mjs";
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

// ---- specification 0018, criteria 10 to 12, 15 and 16: the plug a design tool's system comes through

const NO_NETWORK = path.join(PLUGIN, "tests/helpers/no-network.mjs");
const PLUGS = path.join(PLUGIN, "scripts/plugs.mjs");
// A command run with the network unreachable, with what it reached for.
function offline(file, ...args) {
  const log = path.join(empty(), "reached.log");
  const done = spawnSync(execPath, ["--import", NO_NETWORK, file, ...args], {
    encoding: "utf8",
    env: { ...env, DESIGN_ASSEMBLY_NETWORK_LOG: log },
  });
  return { ...done, reached: existsSync(log) ? readFileSync(log, "utf8") : "" };
}
// The plug file that says the ways to bring a file in: the only one, found by what it declares, so
// that no file but the plug's own names the tool.
const caps = () => readCapabilities();
const filePlug = () => caps().plugs.find((plug) => Array.isArray(plug.ways));
// Every file under a folder of the plugin, by its path from the plugin, with its text.
const filesUnder = (folder) =>
  readdirSync(path.join(PLUGIN, folder), { recursive: true })
    .map((name) => path.posix.join(folder, String(name).split(path.sep).join("/")))
    .filter((file) => statSync(path.join(PLUGIN, file)).isFile())
    .map((file) => ({ path: file, text: readFileSync(path.join(PLUGIN, file), "utf8") }));

test("0018 criterion 10: the plug file fills direction and foundations, says how a session lists it, what it needs and what it sends, and is measured at foundations alone", () => {
  const plug = filePlug();
  assert.ok(plug, "no plug file says the ways to bring a file in");
  assert.deepEqual(plug.sockets, ["direction", "foundations"]);
  // A session lists it by its server, which only tells the setup step that it is there.
  assert.ok(plug.mcp_servers.length > 0);
  assert.equal(plug.skills, undefined);
  assert.deepEqual(plug.needs, ["account", "network", "machine"]);
  assert.match(plug.sends, /file key and node ids/);
  assert.match(plug.sends, /the file path sends nothing/);
  // The two things the saved-file way needs, and the reader that was tried with its licence.
  assert.match(plug.machine, /right to save the file to (this|the) machine/);
  assert.match(plug.machine, /reader the person runs themself/);
  assert.match(plug.machine, /licence/);
  assert.match(plug.machine, /does not bundle, download, build or call/);
  // Measured on the four measures at the foundations socket, where the run of item 13.4 took the
  // numbers from a real saved file; the direction socket was not measured, so it has no entry
  // there. It did not beat the plugin's plug, and no word of the owner recommends it.
  assert.deepEqual(plug.measured, { foundations: { record: "d0135", beats_plugin: false } });
  assert.equal(plug.recommended_by_owner, undefined);
  assert.deepEqual(caps().problems, []);
});

test("0018 criterion 10: the saved file is the first way and the bridge reads it; the tool's own export is the second, and is said not to be read yet", () => {
  const { ways } = filePlug();
  assert.equal(ways.length, 2);
  const [first, second] = ways;
  assert.equal(first.reads, "variables");
  assert.equal(first.not_read, undefined);
  // The person runs the reader: the plug file says so in the way itself.
  assert.match(first.how, /yourself|themself/);
  assert.match(first.how, /never enters a repository/);
  assert.equal(second.reads, undefined);
  assert.match(second.not_read, /does not read (that|this|the) folder yet/);
  assert.match(second.how, /\S/);
});

test("0018 criterion 10: a plug file's ways are held to their shape, each red with its file", () => {
  const { table } = caps();
  const at = "references/plugs/drafting.json";
  const base = {
    id: "drafting",
    about: "A fixture tool that keeps a system.",
    sockets: ["direction"],
    names: ["Drafting"],
    needs: [],
    file: at,
  };
  const read = { id: "saved-file", how: "Save it, read it yourself.", reads: "variables" };
  const waits = { id: "own-export", how: "Export it.", not_read: "No reader yet." };
  assert.deepEqual(plugProblems([{ ...base, ways: [read, waits] }], table), []);
  for (const [ways, said] of [
    [[], `${at}: ways is a list of the ways to get a file, each with an id and how`],
    ["a file", `${at}: ways is a list of the ways to get a file, each with an id and how`],
    [[{ how: "Save it.", reads: "variables" }], `${at}: a way has no id written in-dashes`],
    [[{ id: "saved-file", reads: "variables" }], `${at}: the way saved-file does not say how`],
    [
      [{ id: "saved-file", how: "Save it." }],
      `${at}: the way saved-file says neither which kind the bridge reads it as, nor why it is not read`,
    ],
    [
      [{ ...read, not_read: "And yet." }],
      `${at}: the way saved-file says both that the bridge reads it and why it is not read`,
    ],
    [
      [{ ...read, reads: "paper" }],
      `${at}: the way saved-file is read as paper, which is none of tokens, design-md, variables, system`,
    ],
    [[read, read], `${at}: the way saved-file is listed twice`],
    [
      [waits, read],
      `${at}: the first way is the one a person is led to, and the bridge does not read own-export`,
    ],
  ]) {
    assert.deepEqual(plugProblems([{ ...base, ways }], table), [said], JSON.stringify(ways));
  }
});

test("0018 criterion 16: the tool, the reader that was tried and its licence are named in the plug's folder only", () => {
  const plug = filePlug();
  const [tool, ...reader] = plug.names;
  // The reader and its licence are names the clean-core check looks for too, and the plug file
  // says them where it says what must be on the machine.
  assert.ok(
    reader.length >= 2,
    "the reader that was tried and its licence are not among the names",
  );
  for (const name of reader) assert.ok(plug.machine.includes(name), name);
  const core = coreFiles().map((file) => ({
    path: file,
    text: readFileSync(path.join(PLUGIN, file), "utf8"),
  }));
  assert.deepEqual(coreProblems(caps().plugs, core), []);
  // Past the core: no file of the plugin outside the plugs' folder names the tool, and none at
  // all, its tests among them, names the reader or its licence.
  const outside = (file) => !file.path.startsWith("references/plugs/");
  const rest = [
    ...["scripts", "templates", "skills", "hooks", "references"].flatMap(filesUnder),
    { path: "README.md", text: readFileSync(path.join(PLUGIN, "README.md"), "utf8") },
  ].filter(outside);
  const named = (files, names) =>
    files
      .filter((file) => outsideNamesIn(file.text, [{ names }]).length > 0)
      .map((file) => file.path);
  assert.deepEqual(named(rest, [tool, ...plug.mcp_servers]), []);
  assert.deepEqual(named([...rest, ...filesUnder("tests")], reader), []);
  // Seen failing: the same look finds a name put into a file.
  assert.deepEqual(named([{ path: "x.md", text: `read with ${reader[0]}` }], reader), ["x.md"]);
});

test("0018 criterion 11: the board shows the plug absent, in the session or waiting for a sign-in, as the session lists its server", () => {
  const plug = filePlug();
  const [server] = plug.mcp_servers;
  const dir = empty();
  const stateOf = (...args) => {
    const shown = offline(PLUGS, "--target", dir, "--json", "--dry-run", "--session", ...args);
    assert.ok([0, 1].includes(shown.status), shown.stderr);
    assert.equal(shown.reached, "");
    const result = JSON.parse(shown.stdout);
    // Measured at foundations and not at direction: the board says each as it is.
    const states = ["direction", "foundations"].map((id) => {
      const candidate = result.sockets
        .find((socket) => socket.id === id)
        .candidates.find((item) => item.id === plug.id);
      assert.equal(candidate.measured, id === "foundations" ? "d0135" : "unmeasured");
      assert.deepEqual(candidate.needs, plug.needs);
      return candidate.state;
    });
    // Only a measured plug that is here is asked about (the next test): one that is absent or
    // waits for a sign-in leaves no question and no file.
    if (!states.includes("in-session")) {
      assert.equal(shown.status, 0, shown.stderr);
      assert.deepEqual(result.questions, []);
      assert.deepEqual(result.files, []);
    }
    return states;
  };
  assert.deepEqual(stateOf(), ["absent", "absent"]);
  assert.deepEqual(stateOf("--server", server), ["in-session", "in-session"]);
  // A server listed under a plugin's prefix is the same server.
  assert.deepEqual(stateOf("--server", `their-plugin:${server}`), ["in-session", "in-session"]);
  assert.deepEqual(stateOf("--needs-sign-in", server), ["needs-sign-in", "needs-sign-in"]);
  // A skill of the same name is not its server: only what the plug file declares counts.
  assert.deepEqual(stateOf("--skill", server), ["absent", "absent"]);
  const board = offline(PLUGS, "--target", dir, "--session", "--needs-sign-in", server);
  assert.equal(board.status, 0, board.stderr);
  assert.match(board.stdout, new RegExp(`${plug.id} +needs-sign-in, unmeasured, needs account`));
  assert.match(
    board.stdout,
    new RegExp(`${plug.id} +needs-sign-in, measured in d0135, needs account`),
  );
  assert.match(board.stdout, new RegExp(`${plug.id} waits for a sign-in`));
  assert.deepEqual(readdirSync(dir), []);
});

test("0018 criterion 11: measured at foundations alone, it is offered there and never recommended, and at direction no question offers it", () => {
  const all = caps();
  const plug = filePlug();
  // A session that holds every plug from outside by every name its file declares.
  const session = {
    skills: all.plugs.flatMap((each) => each.skills ?? []),
    servers: all.plugs.flatMap((each) => each.mcp_servers ?? []),
    signIn: [],
  };
  const offeredAt = (planned, id) =>
    recommendationOf(planned.sockets.find((socket) => socket.id === id))?.candidates ?? [];
  const asked = plan(empty(), { caps: all, on: ON, session });
  // It did not beat the plugin's plug, and no word of the owner names it: no question of the
  // round recommends it, whichever socket the question is about.
  for (const question of asked.questions) {
    assert.ok(!question.recommendation.startsWith(`${plug.id}:`), question.recommendation);
  }
  // At the foundations socket, where it was measured, the session is asked about it.
  const question = asked.questions.find((item) => item.id === "plug-foundations");
  assert.ok(question.candidates.some((candidate) => candidate.name === plug.id));
  // At every other socket of the board it is not among what a question would offer: direction,
  // which it fills too, was not measured.
  assert.ok(asked.questions.some((item) => item.id === "plug-direction"));
  for (const socket of asked.sockets.filter((each) => each.id !== "foundations")) {
    assert.ok(
      offeredAt(asked, socket.id).every((candidate) => candidate.name !== plug.id),
      `the ${socket.id} socket would offer the plug, which was not measured there`,
    );
  }
  for (const id of plug.sockets) assert.ok(offeredAt(asked, id).length > 0, id);
  // What lets it be offered is the measure: without one, the same session is not asked about it
  // at foundations either; with one at direction, it is asked about there too.
  const withMeasure = (measured) => ({
    ...all,
    plugs: all.plugs.map((each) => (each.id === plug.id ? { ...each, measured } : each)),
  });
  const before = plan(empty(), { caps: withMeasure(undefined), on: ON, session });
  assert.ok(offeredAt(before, "foundations").every((candidate) => candidate.name !== plug.id));
  const both = plan(empty(), {
    caps: withMeasure({
      ...plug.measured,
      direction: { record: "d0088", beats_plugin: false },
    }),
    on: ON,
    session,
  });
  assert.ok(offeredAt(both, "direction").some((candidate) => candidate.name === plug.id));
  // And a question written by hand that recommends it is refused, with its file: at direction
  // because it was never measured there, at foundations because it did not beat the plugin's plug.
  const byHand = (socket, plugins) => {
    const dir = empty();
    put(
      dir,
      `design/waiting/plug-${socket}.json`,
      `${JSON.stringify({
        id: `plug-${socket}`,
        kind: "question",
        question: `Which plug works the ${socket} socket in this repository?`,
        recommendation: `${plug.id}: by hand`,
        basis: "none",
        hard_to_undo: false,
        where: `the ${socket} socket`,
        if_refused: `the ${socket} socket keeps the plugin's plug ${plugins}`,
        item: `decision:plug-${socket}`,
        asked_on: ON,
        candidates: [
          { name: plug.id, about: "by hand" },
          { name: plugins, about: "as today" },
        ],
      })}\n`,
    );
    return dir;
  };
  assert.throws(
    () => plan(byHand("direction", "directions"), { caps: all, on: ON, session }),
    new RegExp(
      `plug-direction\\.json recommends ${plug.id}, which was never measured at the direction socket: an unmeasured plug is never the recommendation`,
    ),
  );
  assert.throws(
    () => plan(byHand("foundations", "tokens"), { caps: all, on: ON, session }),
    new RegExp(
      `plug-foundations\\.json recommends ${plug.id}, which was measured in d0135 and did not beat the plugin's plug at the foundations socket`,
    ),
  );
});

test("0018 criterion 12: bring-in --ways says each way to get a file, the saved file first, and that the tool's own export is not read yet", () => {
  const plug = filePlug();
  const shown = offline(BRING_IN, "--ways");
  assert.equal(shown.status, 0, shown.stderr);
  assert.equal(shown.reached, "");
  const lines = shown.stdout.split("\n");
  const [first, second] = plug.ways;
  const at = (text) => lines.findIndex((line) => line.includes(text));
  assert.ok(at(`${plug.id}: 2 ways to get a file`) >= 0, shown.stdout);
  const one = at(`1. ${first.id}, read as an export of variables: ${first.how}`);
  const two = at(`2. ${second.id}, not read yet: ${second.not_read} ${second.how}`);
  assert.ok(one >= 0 && two > one, shown.stdout);
  assert.ok(at(`sends: ${plug.sends}`) > two, shown.stdout);
  assert.ok(at(`on the machine: ${plug.machine}`) > two, shown.stdout);
  // The same as data, by the common contract; and nothing is written anywhere.
  const data = JSON.parse(offline(BRING_IN, "--ways", "--json").stdout);
  assert.deepEqual(data.plugs, [
    { id: plug.id, ways: plug.ways, sends: plug.sends, machine: plug.machine },
  ]);
  // It reads no source: with one named too, the call is wrong.
  const both = offline(BRING_IN, "--ways", "--from", "anything.json");
  assert.equal(both.status, 2);
  assert.match(both.stderr, /give --ways or --from, not both/);
});

test("0018 criterion 12: the skill says each way as the plug file gives it, runs no reader for the person, and says what a call sends before it is made", () => {
  const skill = readFileSync(path.join(PLUGIN, "skills/bring-in/SKILL.md"), "utf8").replace(
    /\s+/g,
    " ",
  );
  assert.match(skill, /scripts\/bring-in\.mjs --ways/);
  assert.match(skill, /in the order it prints them, the first first/);
  // A way the bridge does not read yet is said as that, never passed off as read.
  assert.match(skill, /`not read yet`/);
  assert.match(skill, /Do not say the bridge reads it/);
  // The reader of a saved design file is the person's to get and to run.
  assert.match(skill, /Never download, install, build or run a reader/);
  assert.match(skill, /The user runs it themself and hands over the JSON it leaves/);
  // Before any call to the tool's service: what is sent, where, and what it costs.
  assert.match(skill, /Before each call to a tool's service, say what is sent and where/);
  assert.match(skill, /costs one call of the account's quota/);
  assert.match(skill, /Call only its tools that read; never one that writes/);
  // The server of a tool is no way to bring a system in.
  assert.match(skill, /not a way to bring a system in/);
});
