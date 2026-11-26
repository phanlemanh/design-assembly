// The bridge in reads a real export of variables (spec 0018, item 13.1, criteria 1 to 7 and open
// question 5): on a made-up export in the shape of a real file's, an alias across collections is
// followed to the mode it means, no name overwrites another, a source colour held twice is never
// picked silently, copies of a library stay out, what the foundations cannot use is counted in one
// line, every axis of modes not carried is named, and no value is lost to a hole of the bridge. The
// kinds it does not change read as they did before. Nothing calls a model or the network.
import "./helpers/own-cores.mjs";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { env, execPath } from "node:process";
import { after, test } from "node:test";
import { fileURLToPath } from "node:url";

import { bringIn, candidateFrom, conflictsOf, report } from "../scripts/bring-in.mjs";
import { readOutside } from "../scripts/outside-tokens.mjs";
import { withoutBlock } from "../templates/tools/design-assembly/theme.mjs";
import { observe, readRecord } from "./helpers/bring-in-kinds.mjs";
import {
  COPY_PRIMARY,
  exportOf,
  INK_300,
  INK_500,
  NORTH,
  reversed,
  SOUTH,
} from "./helpers/variables-export.mjs";

const PLUGIN = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const ROOT = path.resolve(PLUGIN, "../..");
const BRING_IN = path.join(PLUGIN, "scripts/bring-in.mjs");
const NO_NETWORK = path.join(PLUGIN, "tests/helpers/no-network.mjs");
const ON = "2026-11-26";

const made = [];
after(() => made.forEach((dir) => rmSync(dir, { recursive: true, force: true })));
const empty = () => {
  const dir = mkdtempSync(path.join(tmpdir(), "design-bring-in-variables-"));
  made.push(dir);
  return dir;
};
const put = (dir, file, text) => {
  mkdirSync(path.dirname(path.join(dir, file)), { recursive: true });
  writeFileSync(path.join(dir, file), text);
  return path.join(dir, file);
};
const saved = (data, name = "variables.json") => put(empty(), name, JSON.stringify(data));
const read = (data) => readOutside(saved(data), "variables");
const valueOf = (tokens, token) => tokens.find((item) => item.token === token)?.value;
const shown = (data, options) =>
  report({ candidate: candidateFrom(saved(data), null, options), questions: [] });

// A repository whose owner settled the colour, the type scale, the corner radius and the typeface.
function settledRepo(typeface = { text_font: "floor", heading_font: "text" }) {
  const dir = empty();
  put(dir, "src/index.css", withoutBlock(readFileSync(path.join(ROOT, "src/index.css"), "utf8")));
  const choice = {
    source_color: "#0246ff",
    type_scale: "standard",
    spacing_unit: "4px",
    corner_radius: "small",
    ...typeface,
  };
  put(
    dir,
    "design/blueprint.json",
    `${JSON.stringify({
      version: 1,
      status: "approved",
      layers: { foundations: { status: "decided", source: "user", choice } },
    })}\n`,
  );
  return dir;
}

test("criterion 1: an alias into a collection of light and dark modes is followed to the mode it means", () => {
  const { tokens, unread } = read(exportOf());
  // Tone has no light or dark mode: each of its modes takes Look's default, Light.
  for (const mode of ["", "@strong", "@quiet"]) {
    assert.equal(valueOf(tokens, `Tone:icon.fg${mode}`), INK_500, mode);
  }
  assert.ok(!unread.some((item) => /icon\.fg/.test(item.token)), JSON.stringify(unread));
  // A mode of the same name is taken where the collection pointed at has one.
  assert.equal(valueOf(tokens, "Look:color.link@light"), "#0055aa");
  assert.equal(valueOf(tokens, "Look:color.link@dark"), "#5599ee");
  // An alias names one variable: a variable of the same name in a collection of light and dark is
  // never taken for it.
  for (const mode of ["@light", "@dark", "@south light"]) {
    assert.equal(valueOf(tokens, `Looks:color.accent-default${mode}`), "#aa2288", mode);
  }
});

test("criterion 2: the same name in two collections keeps both values, whatever the order read", () => {
  const data = exportOf();
  const { tokens } = read(data);
  assert.equal(valueOf(tokens, "Base:color.accent"), "#aa2288");
  assert.equal(valueOf(tokens, "Look:color.accent@dark"), "#222222");
  // Breaking: the same export listed the other way round reads the same tokens and candidate.
  const back = read(reversed(data));
  assert.deepEqual(back.tokens, tokens);
  const forth = candidateFrom(saved(data));
  const flipped = candidateFrom(saved(reversed(data)));
  for (const key of ["values", "picked", "dark", "fonts", "assumed", "variables", "unread"]) {
    assert.deepEqual(flipped[key], forth[key], key);
  }
});

test("criterion 3: a source colour held by two collections with two values is refused, and --collection chooses", () => {
  const data = exportOf();
  // Breaking: the copy of the library taken out of the copies is read as a collection of its own.
  delete data.meta.variableCollections["c-lib"].remote;
  delete data.meta.variableCollections["c-lib"].hiddenFromPublishing;
  const file = saved(data);
  // Collections are listed by name, whatever order the export lists them in.
  assert.throws(
    () => candidateFrom(file),
    /its primary colour color\.primary is held by 2 collections with 2 values: #cc3300 in Look \(c-lib\), #3366cc in Look \(c-look\); nothing is guessed: say which with --collection <name>/,
  );
  assert.equal(candidateFrom(file, null, { collection: "c-look" }).values.source_color, INK_500);
  assert.equal(
    candidateFrom(file, null, { collection: "Look (c-lib)" }).values.source_color,
    COPY_PRIMARY,
  );
  assert.throws(
    () => candidateFrom(file, null, { collection: "Look" }),
    /--collection Look names 2 collections: Look \(c-lib\), Look \(c-look\); name one by its id/,
  );
  assert.throws(
    () => candidateFrom(file, null, { collection: "Nowhere" }),
    /--collection Nowhere names no collection read: Base, Look \(c-lib\), Look \(c-look\), Looks, Size, Tone/,
  );
  // The command takes it, and refuses it for a kind that has no collections.
  const run = spawnSync(
    execPath,
    [BRING_IN, "--target", empty(), "--from", file, "--collection", "c-look", "--json"],
    {
      encoding: "utf8",
    },
  );
  assert.equal(run.status, 0, run.stderr);
  assert.equal(JSON.parse(run.stdout).candidate.values.source_color, INK_500);
  const tokens = put(
    empty(),
    "tokens.json",
    JSON.stringify({ color: { primary: { $value: "#336699" } } }),
  );
  const wrong = spawnSync(
    execPath,
    [BRING_IN, "--target", empty(), "--from", tokens, "--collection", "x"],
    {
      encoding: "utf8",
    },
  );
  assert.equal(wrong.status, 2);
  assert.match(wrong.stderr, /--collection is for an export of variables/);
  // Two collections that agree on the colour ask nothing; their dark colours are held apart too.
  const channels = (hex) => ({
    r: Number.parseInt(hex.slice(1, 3), 16) / 255,
    g: Number.parseInt(hex.slice(3, 5), 16) / 255,
    b: Number.parseInt(hex.slice(5, 7), 16) / 255,
    a: 1,
  });
  data.meta.variables["v-lib-primary"].valuesByMode["x-light"] = channels(INK_500);
  assert.throws(
    () => candidateFrom(saved(data)),
    /its dark primary colour color\.primary is held by 2 collections with 2 values: #ee5522 in Look \(c-lib\), #6699ff in Look \(c-look\)/,
  );
  data.meta.variables["v-lib-primary"].valuesByMode["x-dark"] = channels(INK_300);
  assert.equal(candidateFrom(saved(data)).values.source_color, INK_500);
});

test("criterion 4: copies of a library and collections hidden from publishing stay out, counted in one line", () => {
  const data = exportOf();
  const candidate = candidateFrom(saved(data));
  assert.equal(candidate.values.source_color, INK_500);
  // The copy's size of 40px would make the scale modular: it is not read.
  assert.equal(candidate.values.type_scale, "standard");
  const { tokens } = read(data);
  assert.ok(!tokens.some((item) => item.collection_id === "c-lib"));
  assert.match(
    shown(data),
    /^ {2}set aside, not in the candidate: 1 collection copied from a library or hidden from publishing \(Look\), 4 variables; an alias into it is still followed$/m,
  );
  // Either mark sets a collection aside.
  for (const mark of ["remote", "hiddenFromPublishing"]) {
    const one = exportOf();
    delete one.meta.variableCollections["c-lib"][mark];
    assert.equal(candidateFrom(saved(one)).values.type_scale, "standard", mark);
  }
});

test("criterion 5: true-or-false variables are counted in one line, not one line each", () => {
  const text = shown(exportOf());
  assert.match(
    text,
    /^ {2}not for the foundations: 1 variable of type BOOLEAN \(2 values\), counted and not read$/m,
  );
  assert.ok(!/not read: .*show/.test(text), text);
});

test("criterion 6: each axis of modes not carried is named, with the mode taken", () => {
  const text = shown(exportOf());
  assert.match(text, /^ {2}mode axis not carried: Tone \(Plain, Strong, Quiet\): took Plain$/m);
  assert.match(text, /^ {2}mode axis not carried: Size \(Base, Small, Large, Huge\): took Base$/m);
  assert.match(
    text,
    /^ {2}mode axis not carried: Looks \(North Light, North Dark, South Light\): took North Light as light and North Dark as dark; not carried: South Light, which reads light too$/m,
  );
  // Look carries both its modes: no line.
  assert.ok(!/mode axis not carried: Look \(/.test(text), text);
});

test("criterion 7: on an export of the real shape no value is lost to a hole of the bridge", () => {
  const data = exportOf();
  const candidate = candidateFrom(saved(data));
  // The one value not read is an alias to no variable at all.
  assert.deepEqual(
    candidate.unread.map((item) => [item.token, item.why]),
    [["Look:color.lost@light", "{v-nowhere} names no token"]],
  );
  const { values, no_value: none } = candidate.variables;
  assert.deepEqual(values, { read: 40, variables: 25, collections: 5 });
  assert.deepEqual(none, { empty: 1, missing: 1, aliases: 1, undeclared: 1, orphans: 0 });
  // Every value of a kept collection is read, or counted with why.
  const kept = Object.values(data.meta.variables).filter(
    (item) => item.variableCollectionId !== "c-lib" && item.resolvedType !== "BOOLEAN",
  );
  const modes = (item) => data.meta.variableCollections[item.variableCollectionId].modes.length;
  const pairs = kept.reduce((sum, item) => sum + modes(item), 0);
  // A variable with no value counts once; its every mode is a pair with no value.
  const emptyPairs = kept
    .filter((item) => Object.keys(item.valuesByMode).length === 0)
    .reduce((sum, item) => sum + modes(item), 0);
  assert.equal(
    values.read + emptyPairs + none.missing + none.aliases + candidate.unread.length,
    pairs,
  );
  // A variable of a collection the export does not list is counted, never lost in silence.
  const orphan = exportOf();
  orphan.meta.variables["v-orphan"] = {
    id: "v-orphan",
    name: "color/stray",
    resolvedType: "COLOR",
    variableCollectionId: "c-gone",
    valuesByMode: { "g-1": { r: 0, g: 0, b: 0, a: 1 } },
  };
  assert.equal(candidateFrom(saved(orphan)).variables.no_value.orphans, 1);
  assert.match(shown(orphan), /1 variable names a collection the export does not list/);
  // A mode the export writes as nothing is passed over, not a crash.
  const odd = exportOf();
  odd.meta.variableCollections["c-size"].modes.push(null);
  assert.equal(candidateFrom(saved(odd)).values.source_color, INK_500);
  assert.match(shown(data), /^ {2}read: 40 values of 25 variables in 5 collections$/m);
});

test("beyond the seven: two modes that both read light keep both values, and the default is the one carried", () => {
  const { tokens } = read(exportOf());
  assert.equal(valueOf(tokens, "Looks:color.brand@light"), NORTH);
  assert.equal(valueOf(tokens, "Looks:color.brand@south light"), SOUTH);
  assert.equal(valueOf(tokens, "Looks:color.brand@dark"), "#448811");
});

test("beyond the seven: no value in the export is counted apart from an alias that names no token", () => {
  const text = shown(exportOf());
  assert.match(
    text,
    /^ {2}no value in the export: 1 variable holds none, 1 value is missing in a mode of its collection, 1 alias ends at one of them, 1 value sits under a mode its collection does not declare$/m,
  );
  assert.equal(text.match(/^ {2}not read: /gm).length, 1);
  assert.match(text, /^ {2}not read: Look:color\.lost@light: \{v-nowhere\} names no token$/m);
});

test("beyond the seven: copies are set aside before names are compared, so a collection is named once", () => {
  const { tokens } = read(exportOf());
  assert.ok(tokens.some((item) => item.token === "Look:color.primary@light"));
  assert.ok(!tokens.some((item) => item.collection.includes("(")));
  assert.equal(candidateFrom(saved(exportOf())).picked.source_color, "Look:color.primary");
});

test("beyond the seven: a colour below full alpha keeps it and says so; a name twice in one collection keeps both", () => {
  const data = exportOf();
  const { tokens } = read(data);
  assert.equal(valueOf(tokens, "Base:ink.fade"), "#3366cc80");
  const dup = tokens
    .filter((item) => item.token === "Look:color.dup@light")
    .map((item) => item.value);
  assert.deepEqual(dup, ["#010203", "#070809"]);
  // A hidden variable of a visible collection is read like any other.
  assert.equal(valueOf(tokens, "Look:color.muted@light"), "#777777");
  // A colour reached through an alias keeps its alpha too, and is counted.
  const through = exportOf();
  through.meta.variables["v-veil"] = {
    id: "v-veil",
    name: "color/veil",
    resolvedType: "COLOR",
    variableCollectionId: "c-base",
    valuesByMode: { "b-value": { type: "VARIABLE_ALIAS", id: "v-ink-fade" } },
  };
  assert.equal(valueOf(read(through).tokens, "Base:color.veil"), "#3366cc80");
  assert.equal(candidateFrom(saved(through)).variables.alpha, 2);
  const text = shown(data);
  assert.match(
    text,
    /^ {2}alpha: 1 colour value below full alpha, kept as #rrggbbaa; a direction draws its colour opaque$/m,
  );
  assert.match(
    text,
    /^ {2}one name held by more than one variable of a collection, each kept: color\.dup in Look \(2\)$/m,
  );
  assert.match(text, /^ {2}colour taken from Look:color\.primary$/m);
  assert.equal(candidateFrom(saved(data)).dark.source_color, INK_300);
});

test("open question 5: a typeface that differs from the ledger's becomes a question", () => {
  const file = saved(exportOf());
  // The floor's typeface, read from the floor's stylesheet.
  const floor = settledRepo();
  assert.deepEqual(
    conflictsOf(floor, candidateFrom(file)).map((item) => [item.key, item.settled, item.outside]),
    [
      ["source_color", "#0246ff", INK_500],
      ["text_font", "floor", "Lumen Grotesk"],
    ],
  );
  const result = bringIn(floor, file, { on: ON, dryRun: true });
  const question = result.questions.find((item) => item.id.endsWith("text-font"));
  assert.match(
    question.question,
    /^The outside direction variables has the typeface of running text Lumen Grotesk; the owner settled Geist Variable \(floor\)\. Keep Geist Variable \(floor\)\?$/,
  );
  assert.match(question.if_refused, /a typeface is chosen with its source/);
  // A font of the sources ledger, by its family.
  const sourced = settledRepo({ text_font: "source:harbor", heading_font: "text" });
  put(
    sourced,
    "design/sources/harbor.json",
    JSON.stringify({
      version: 1,
      id: "harbor",
      kind: "font",
      title: "Harbor Sans",
      family: "Harbor Sans",
    }),
  );
  assert.ok(conflictsOf(sourced, candidateFrom(file)).some((item) => item.key === "text_font"));
  // The same family asks nothing.
  put(
    sourced,
    "design/sources/harbor.json",
    JSON.stringify({
      version: 1,
      id: "harbor",
      kind: "font",
      title: "Lumen",
      family: "Lumen Grotesk",
    }),
  );
  assert.ok(!conflictsOf(sourced, candidateFrom(file)).some((item) => item.key === "text_font"));
  // A typeface nobody settled asks nothing.
  const open = settledRepo({});
  assert.ok(!conflictsOf(open, candidateFrom(file)).some((item) => item.key === "text_font"));
  // The system font: a named family differs from it, a generic family is it.
  const system = settledRepo({ text_font: "system", heading_font: "text" });
  assert.ok(conflictsOf(system, candidateFrom(file)).some((item) => item.key === "text_font"));
  const generic = exportOf();
  generic.meta.variables["v-family"].valuesByMode["b-value"] = "system-ui, sans-serif";
  const genericFile = saved(generic);
  assert.ok(
    !conflictsOf(system, candidateFrom(genericFile)).some((item) => item.key === "text_font"),
  );
  // A heading typeface of its own is asked apart from the text's.
  const headed = exportOf();
  headed.meta.variables["v-heading"] = {
    id: "v-heading",
    name: "font/family/heading",
    resolvedType: "STRING",
    variableCollectionId: "c-base",
    valuesByMode: { "b-value": "Quill Serif" },
  };
  const fonts = conflictsOf(floor, candidateFrom(saved(headed)))
    .filter((item) => item.key.endsWith("_font"))
    .map((item) => [item.key, item.outside, item.settled_name]);
  assert.deepEqual(fonts, [
    ["text_font", "Lumen Grotesk", "Geist Variable"],
    ["heading_font", "Quill Serif", "Geist Variable"],
  ]);
  // A stylesheet that cannot be found asks nothing rather than fail the run.
  const broken = settledRepo();
  put(broken, "components.json", "{ no");
  assert.doesNotThrow(() => conflictsOf(broken, candidateFrom(file)));
});

test("the kinds 13.1 does not change, and the sheet with nothing brought in, read as plugin 0.76.0 printed them", () => {
  assert.deepEqual(observe(made), readRecord());
});

test("the command reads the export with the network unreachable", () => {
  const log = path.join(empty(), "network.log");
  writeFileSync(log, "");
  const run = spawnSync(
    execPath,
    [
      "--import",
      NO_NETWORK,
      BRING_IN,
      "--target",
      settledRepo(),
      "--from",
      saved(exportOf()),
      "--dry-run",
      "--on",
      ON,
    ],
    { encoding: "utf8", env: { ...env, DESIGN_ASSEMBLY_NETWORK_LOG: log } },
  );
  assert.equal(run.status, 1, run.stderr);
  assert.match(run.stdout, /^candidate direction: variables \(an export of variables, /m);
  assert.equal(readFileSync(log, "utf8"), "");
});
