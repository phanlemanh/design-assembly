// A font enters through the sources ledger (item 9.1, slice 2): a source of the kind `font` says
// where the font comes from, its pin and its licence; a typeface other than the floor's or the
// system's is chosen only when that row is there; the guide and adopt write the row from what the
// repository already holds, and a person fills the licence. No command reaches the network.
import "./helpers/own-cores.mjs";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  realpathSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { env, execPath } from "node:process";
import { after, test } from "node:test";
import { fileURLToPath } from "node:url";

import { blueprintProblems, rulesPage } from "../scripts/apply.mjs";
import { collectFacts, renderBook } from "../scripts/book.mjs";
import { fullStatus } from "../scripts/status.mjs";
import { specimenPlan } from "../scripts/specimen.mjs";
import { readState, runChecks } from "../templates/tools/design-assembly/check.mjs";
import { LEDGERS, shapeProblems } from "../templates/tools/design-assembly/contract.mjs";
import { parseLedger } from "../templates/tools/design-assembly/ledger.mjs";
import * as ledger from "../templates/tools/design-assembly/sources-ledger.mjs";
import {
  buildTheme,
  readBlock,
  renderBlock,
  SYSTEM_FONT,
  withoutBlock,
} from "../templates/tools/design-assembly/theme.mjs";

const PLUGIN = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const ROOT = path.resolve(PLUGIN, "../..");
const LAYERS = JSON.parse(readFileSync(path.join(PLUGIN, "references/layers.json"), "utf8")).layers;
const FLOOR_CSS = withoutBlock(readFileSync(path.join(ROOT, "src/index.css"), "utf8"));
const NO_NETWORK = path.join(PLUGIN, "tests/helpers/no-network.mjs");

const made = [];
after(() => made.forEach((dir) => rmSync(dir, { recursive: true, force: true })));
const empty = () => {
  const dir = realpathSync(mkdtempSync(path.join(tmpdir(), "design-font-source-")));
  made.push(dir);
  return dir;
};
const put = (dir, file, content) => {
  mkdirSync(path.dirname(path.join(dir, file)), { recursive: true });
  writeFileSync(path.join(dir, file), content);
};
const text = (dir, file) => readFileSync(path.join(dir, file), "utf8");
const json = (dir, file) => JSON.parse(text(dir, file));
const pretty = (data) => `${JSON.stringify(data, null, 2)}\n`;
const sha = (bytes) => createHash("sha256").update(bytes).digest("hex");
const script = (name) => path.join(PLUGIN, "scripts", name);
// Every command of these tests runs with the network unreachable: a connection to anything but
// this machine throws, and is written down.
const run = (file, ...args) => {
  const log = path.join(empty(), "reached.log");
  const result = spawnSync(execPath, ["--import", NO_NETWORK, file, ...args], {
    encoding: "utf8",
    env: { ...env, DESIGN_ASSEMBLY_NETWORK_LOG: log },
  });
  return { ...result, reached: existsSync(log) ? readFileSync(log, "utf8") : "" };
};
const gate = (dir) => run(path.join(dir, "tools/design-assembly/check.mjs"), "--target", dir);
const foundationsOf = (choice) =>
  LAYERS.find((layer) => layer.id === "foundations").choices.find((item) => item.key === choice);

// The bytes of a font file: what is hashed, never drawn.
const FONT_BYTES = "wOF2 not a real font, only bytes to hash\n";
const FONT_FILE = "src/fonts/brand-sans.woff2";

// A font that is a package the lockfile pins.
const packaged = (more = {}) => ({
  version: 1,
  id: "brand-sans",
  kind: "font",
  title: "Brand Sans",
  family: "Brand Sans",
  pin: { package: "brand-type", version: "1.2.0" },
  licence: "SIL Open Font License 1.1, as the owner read it in the package.",
  ...more,
});
// A font kept as files of the repository.
const filed = (more = {}) => ({
  version: 1,
  id: "brand-sans",
  kind: "font",
  title: "Brand Sans",
  family: "Brand Sans",
  pin: { files: [{ file: FONT_FILE, sha256: sha(FONT_BYTES), weight: "100 900" }] },
  licence: "Bought for this product: the owner holds the licence.",
  ...more,
});
const LOCKFILE = (version = "1.2.0") =>
  pretty({
    name: "sample",
    lockfileVersion: 3,
    packages: {
      "": { name: "sample" },
      "node_modules/brand-type": { version, license: "OFL-1.1" },
    },
  });
const PACKAGE = {
  "node_modules/brand-type/package.json": pretty({
    name: "brand-type",
    version: "1.2.0",
    style: "brand.css",
  }),
  "node_modules/brand-type/brand.css":
    "@font-face {\n  font-family: 'Brand Sans';\n  src: url(./files/brand.woff2) format('woff2');\n}\n",
};

const ANSWERED = { by: "Owner Name", on: "2026-11-21" };
// A blueprint the guide can write from, with the typeface answered as `fonts` says.
function blueprint(fonts = {}) {
  const choices = {
    context: { product_type: "application", conformance_level: "AA" },
    patterns: { record_panel: "beside" },
    foundations: { source_color: "#0246ff", ...fonts },
  };
  const layers = {};
  for (const layer of LAYERS) {
    layers[layer.id] = layer.built
      ? { status: "decided", source: "user", choice: choices[layer.id], why: "For the test." }
      : { status: "planned" };
  }
  if (Object.keys(fonts).length > 0) {
    layers.foundations.answered = Object.fromEntries(
      Object.keys(fonts).map((key) => [key, ANSWERED]),
    );
  }
  return { version: 1, status: "approved", layers };
}

// A repository with the floor of this one, the blueprint given, and whatever `files` adds.
function repository(content, files = {}) {
  const dir = empty();
  put(dir, "src/index.css", FLOOR_CSS);
  put(dir, "Makefile", text(ROOT, "Makefile"));
  put(dir, "package.json", pretty({ name: "sample", devDependencies: { vite: "8.0.0" } }));
  put(dir, "vite.config.ts", "export default {};\n");
  put(dir, "design/blueprint.json", pretty(content));
  // The floor's font package, as the stylesheet imports it: what loads the floor's typeface.
  const font = "node_modules/@fontsource-variable/geist";
  put(dir, `${font}/package.json`, text(ROOT, `${font}/package.json`));
  put(dir, `${font}/index.css`, text(ROOT, `${font}/index.css`));
  for (const [file, value] of Object.entries(files)) put(dir, file, value);
  return dir;
}

const ROW = `${ledger.SOURCES_FOLDER}/brand-sans.json`;

// ---- the kind of source -------------------------------------------------------------------------

test("a font is a kind of source: its row says the family, its pin and its licence", () => {
  assert.deepEqual(shapeProblems("sources", pretty(packaged()), ROW), []);
  assert.deepEqual(shapeProblems("sources", pretty(filed()), ROW), []);
  // The kind names no catalog: a font offers no blocks.
  assert.equal("catalog" in packaged(), false);
});

test("a font row with no pin, or with no licence, breaks its shape, and the sentence names the row and what is missing", () => {
  const noLicence = shapeProblems("sources", pretty(packaged({ licence: undefined })), ROW);
  assert.equal(noLicence.length, 1, noLicence.join("\n"));
  assert.match(noLicence[0], /^design\/sources\/brand-sans\.json is a font and has no licence/);
  const blank = shapeProblems("sources", pretty(packaged({ licence: "  " })), ROW);
  assert.match(blank.join("\n"), /has no licence/);

  const noPin = shapeProblems("sources", pretty(packaged({ pin: undefined })), ROW);
  assert.equal(noPin.length, 1, noPin.join("\n"));
  assert.match(noPin[0], /^design\/sources\/brand-sans\.json is a font and has no pin/);
  // A pin that names neither a package at a version nor a file with its hash pins nothing.
  for (const pin of [{}, { version: "1.2.0" }, { package: "brand-type" }, { files: [] }]) {
    const found = shapeProblems("sources", pretty(packaged({ pin })), ROW);
    assert.match(found.join("\n"), /is a font and has no pin/, JSON.stringify(pin));
  }
  // A pin kept in another file is not a font's pin: the row itself says it.
  const elsewhere = shapeProblems(
    "sources",
    pretty(packaged({ pin: undefined, pin_file: "design/pin.json" })),
    ROW,
  );
  assert.match(elsewhere.join("\n"), /is a font and has no pin/);
  const noFamily = shapeProblems("sources", pretty(packaged({ family: undefined })), ROW);
  assert.match(noFamily.join("\n"), /design\/sources\/brand-sans\.json\.family is missing/);
});

test("the gate turns red on a font row with no licence, and on one with no pin", () => {
  const dir = empty();
  put(dir, "design/theme.json", pretty({ checks: { "ledger-shapes": [{ kind: "shapes" }] } }));
  put(dir, ROW, pretty(packaged()));
  const shapes = () => runChecks(readState(dir)).find((result) => result.id === "ledger-shapes");
  assert.equal(shapes().problem, null);
  assert.equal(shapes().seenFailing, true);
  put(dir, ROW, pretty(packaged({ licence: undefined })));
  assert.match(shapes().problem, /design\/sources\/brand-sans\.json is a font and has no licence/);
  put(dir, ROW, pretty(packaged({ pin: undefined })));
  assert.match(shapes().problem, /design\/sources\/brand-sans\.json is a font and has no pin/);
});

test("a row a command wrote and no person finished is not held: no licence yet, and the gate stays green", () => {
  const proposed = packaged({ licence: undefined, proposed: { by: "adopt", on: "2026-11-21" } });
  assert.deepEqual(shapeProblems("sources", pretty(proposed), ROW), []);
  // The pin is the machine's to write: a proposal without one is still wrong.
  const noPin = shapeProblems("sources", pretty({ ...proposed, pin: undefined }), ROW);
  assert.match(noPin.join("\n"), /is a font and has no pin/);
  const dir = empty();
  put(dir, ROW, pretty(proposed));
  const [font] = ledger.readFontSources(dir);
  assert.equal(font.held, false);
  assert.match(font.waits, /licence/);
});

test("rows of the kinds that exist today are read exactly as before", () => {
  const library = {
    version: 1,
    id: "kit",
    pin: { version: "3.1.0" },
    catalog: "design/kit-catalog.json",
  };
  const file = `${ledger.SOURCES_FOLDER}/kit.json`;
  assert.deepEqual(shapeProblems("sources", pretty(library), file), []);
  // A library still needs its catalog, said in the words of before.
  assert.deepEqual(shapeProblems("sources", pretty({ ...library, catalog: undefined }), file), [
    "design/sources/kit.json.catalog is missing",
  ]);
  // A key `kind` of the repository's own, with a word this plugin gives no meaning, changes nothing.
  assert.deepEqual(shapeProblems("sources", pretty({ ...library, kind: "registry" }), file), []);
  assert.equal(LEDGERS.sources.version, 1);

  const dir = empty();
  put(dir, file, pretty(library));
  put(dir, "design/kit-catalog.json", pretty({ items: [{ name: "grid" }] }));
  put(dir, ROW, pretty(packaged()));
  put(dir, "package-lock.json", LOCKFILE());
  // The sources blocks are picked from are the libraries: a font offers none and is not one.
  assert.deepEqual(
    ledger.readPinnedSources(dir).map((source) => [source.id, source.items.length]),
    [["kit", 1]],
  );
  assert.deepEqual(
    ledger.readFontSources(dir).map((font) => font.id),
    ["brand-sans"],
  );
});

test("the contract says what a font row holds", () => {
  const contract = text(PLUGIN, "references/contract.md");
  const section = contract.slice(contract.indexOf("### sources"));
  for (const word of ["`kind`", "`font`", "`family`", "`licence`", "`package`", "`proposed`"]) {
    assert.ok(section.includes(word), `contract.md does not say ${word} of a font`);
  }
});

// ---- the pin ------------------------------------------------------------------------------------

test("a font's pin is compared with what the repository holds: the lockfile's version, each file's hash", () => {
  const dir = empty();
  put(dir, ROW, pretty(packaged()));
  put(dir, "package-lock.json", LOCKFILE());
  const read = () => ledger.readFontSources(dir)[0];
  assert.equal(read().held, true);
  assert.deepEqual(read().drift, []);
  assert.match(read().from, /the package brand-type at 1\.2\.0/);
  // The lockfile moved on: the pin no longer says what the repository has.
  put(dir, "package-lock.json", LOCKFILE("1.3.0"));
  assert.match(
    read().drift.join("\n"),
    /pins brand-type at 1\.2\.0.*package-lock\.json pins 1\.3\.0/,
  );
  // A lockfile that does not pin the package pins no font.
  put(dir, "package-lock.json", pretty({ lockfileVersion: 3, packages: { "": {} } }));
  assert.match(read().drift.join("\n"), /package-lock\.json does not pin brand-type/);
  // No lockfile this tool reads: said, not counted as a difference.
  rmSync(path.join(dir, "package-lock.json"));
  assert.deepEqual(read().drift, []);
  assert.match(read().blind.join("\n"), /no lockfile this tool reads/);

  put(dir, ROW, pretty(filed()));
  put(dir, FONT_FILE, FONT_BYTES);
  assert.deepEqual(read().drift, []);
  assert.match(read().from, /1 file of the repository/);
  put(dir, FONT_FILE, `${FONT_BYTES}changed`);
  assert.match(
    read().drift.join("\n"),
    /src\/fonts\/brand-sans\.woff2 is not the file it was pinned with/,
  );
  rmSync(path.join(dir, FONT_FILE));
  assert.match(read().drift.join("\n"), /src\/fonts\/brand-sans\.woff2.*is not there/);
  put(dir, ROW, pretty(filed({ pin: { files: [{ file: "../x.woff2", sha256: sha("x") }] } })));
  assert.match(read().drift.join("\n"), /outside the repository/);
  // A link inside the repository that leads out of it is outside too.
  const away = path.join(empty(), "away.woff2");
  writeFileSync(away, FONT_BYTES);
  symlinkSync(away, path.join(dir, "src/fonts/link.woff2"));
  put(
    dir,
    ROW,
    pretty(filed({ pin: { files: [{ file: "src/fonts/link.woff2", sha256: sha(FONT_BYTES) }] } })),
  );
  assert.match(read().drift.join("\n"), /outside the repository/);
});

// ---- the third value of the typeface choice -----------------------------------------------------

test("the typeface choice names its third value, a font of the sources ledger, and nothing it cannot take", () => {
  for (const key of ["text_font", "heading_font"]) {
    const choice = foundationsOf(key);
    assert.equal("not_yet" in choice, false, `${key} still names a value it cannot take`);
    assert.equal(choice.sourced.kind, "font");
    assert.equal(choice.sourced.prefix, "source:");
    assert.match(choice.sourced.says, /sources ledger/);
    assert.doesNotMatch(choice.sourced.says, /next version/);
  }
  assert.doesNotMatch(text(PLUGIN, "references/layers.json"), /not_yet/);
});

test("a font with no row is refused with one sentence that says which row is missing", () => {
  const asked = blueprint({ text_font: "source:brand-sans", heading_font: "text" });
  const none = blueprintProblems(asked, { sources: [] });
  assert.equal(none.length, 1, none.join("\n"));
  assert.match(none[0], /^foundations: text typeface source:brand-sans: /);
  assert.match(none[0], /the sources ledger has no font row design\/sources\/brand-sans\.json/);
  assert.equal(none[0].split(/\.\s/).length, 1, "more than one sentence");
  const heading = blueprintProblems(
    blueprint({ text_font: "floor", heading_font: "source:brand-sans" }),
    { sources: [] },
  );
  assert.equal(heading.length, 1);
  assert.match(heading[0], /^foundations: heading typeface source:brand-sans: .*has no font row/);
  // The word alone names no row, and an unknown word is refused as any other.
  const bare = blueprintProblems(blueprint({ text_font: "source", heading_font: "text" }), {
    sources: [],
  });
  assert.deepEqual(bare, [
    "foundations: text typeface must be one of floor, system, or source:<id> for a font of the sources ledger",
  ]);
});

test("a font row whose fields the contract refuses is not held, and nothing of it reaches the stylesheet", () => {
  const dir = empty();
  const injected = "400; } body { display: none } @font-face { x: 1";
  put(dir, FONT_FILE, FONT_BYTES);
  for (const entry of [
    { file: FONT_FILE, sha256: sha(FONT_BYTES), weight: injected },
    { file: FONT_FILE, sha256: sha(FONT_BYTES), style: "oblique; } body {" },
  ]) {
    put(dir, ROW, pretty(filed({ pin: { files: [entry] } })));
    const [font] = ledger.readFontSources(dir);
    assert.equal(font.held, false, JSON.stringify(entry));
    assert.ok(font.problems.length > 0);
    assert.throws(
      () =>
        buildTheme(
          {
            sourceColor: "#0246ff",
            conformanceLevel: "AA",
            textFont: "source:brand-sans",
            headingFont: "text",
          },
          FLOOR_CSS,
          { sources: ledger.readFontSources(dir), faces: () => [injected] },
        ),
      /design\/sources\/brand-sans\.json/,
    );
  }
  put(dir, ROW, pretty(filed({ variable: "--x; } body {" })));
  assert.equal(ledger.readFontSources(dir)[0].held, false);
});

test("a font whose row is there, pinned and licensed, can be chosen; one that waits on its licence cannot", () => {
  const dir = empty();
  put(dir, ROW, pretty(packaged()));
  put(dir, "package-lock.json", LOCKFILE());
  const asked = blueprint({ text_font: "source:brand-sans", heading_font: "text" });
  assert.deepEqual(blueprintProblems(asked, { sources: ledger.readFontSources(dir) }), []);
  put(
    dir,
    ROW,
    pretty(packaged({ licence: undefined, proposed: { by: "guide", on: "2026-11-21" } })),
  );
  const waits = blueprintProblems(asked, { sources: ledger.readFontSources(dir) });
  assert.equal(waits.length, 1, waits.join("\n"));
  assert.match(waits[0], /design\/sources\/brand-sans\.json has no licence yet/);
  // A row whose pin no longer holds is not what was pinned.
  put(dir, ROW, pretty(packaged()));
  put(dir, "package-lock.json", LOCKFILE("2.0.0"));
  const moved = blueprintProblems(asked, { sources: ledger.readFontSources(dir) });
  assert.match(moved.join("\n"), /pins brand-type at 1\.2\.0/);
  // A library is no font.
  const library = { version: 1, id: "kit", pin: { version: "1" }, catalog: "c.json" };
  put(dir, `${ledger.SOURCES_FOLDER}/kit.json`, pretty(library));
  const wrong = blueprintProblems(blueprint({ text_font: "source:kit", heading_font: "text" }), {
    sources: ledger.readFontSources(dir),
  });
  assert.match(wrong.join("\n"), /the sources ledger has no font row design\/sources\/kit\.json/);
});

test("the block names the family of a font of the sources ledger, by its name or by the variable its loader sets", () => {
  const base = { sourceColor: "#0246ff", conformanceLevel: "AA" };
  const dir = empty();
  put(dir, ROW, pretty(packaged()));
  put(dir, "package-lock.json", LOCKFILE());
  const sources = ledger.readFontSources(dir);
  const named = renderBlock(
    buildTheme({ ...base, textFont: "source:brand-sans", headingFont: "text" }, FLOOR_CSS, {
      sources,
    }),
  );
  assert.ok(named.includes(`--font-sans: "Brand Sans", ${SYSTEM_FONT};`), named);
  assert.match(named, /--font-heading: var\(--font-sans\);/);
  // Headings alone in the font, text in the floor's.
  const heading = renderBlock(
    buildTheme({ ...base, textFont: "floor", headingFont: "source:brand-sans" }, FLOOR_CSS, {
      sources,
    }),
  );
  assert.ok(heading.includes(`--font-heading: "Brand Sans", ${SYSTEM_FONT};`), heading);
  // A font a loader of the build sets under a variable is reached through that variable.
  put(dir, ROW, pretty(packaged({ variable: "--font-brand" })));
  const variable = renderBlock(
    buildTheme({ ...base, textFont: "source:brand-sans", headingFont: "text" }, FLOOR_CSS, {
      sources: ledger.readFontSources(dir),
    }),
  );
  assert.ok(variable.includes(`--font-sans: var(--font-brand), ${SYSTEM_FONT};`), variable);
  assert.throws(
    () =>
      buildTheme({ ...base, textFont: "source:other", headingFont: "text" }, FLOOR_CSS, {
        sources,
      }),
    /no font row design\/sources\/other\.json/,
  );
});

test("the specimen sheet draws each font of the sources ledger that can be chosen, and says why another cannot", () => {
  const dir = repository(blueprint(), {
    [ROW]: pretty(packaged()),
    "package-lock.json": LOCKFILE(),
    [`${ledger.SOURCES_FOLDER}/waiting.json`]: pretty(
      packaged({
        id: "waiting",
        family: "Waiting Sans",
        licence: undefined,
        proposed: { by: "guide", on: "2026-11-21" },
      }),
    ),
  });
  const plan = specimenPlan(dir, { section: "typeface" });
  const sections = Object.fromEntries(plan.sections.map((section) => [section.key, section]));
  assert.deepEqual(
    sections.text_font.options.map((option) => option.value),
    ["floor", "system", "source:brand-sans"],
  );
  assert.deepEqual(
    sections.heading_font.options.map((option) => option.value),
    ["text", "floor", "system", "source:brand-sans"],
  );
  const brand = sections.text_font.options.find((option) => option.value === "source:brand-sans");
  assert.ok(brand.css.includes('"Brand Sans"'), brand.css);
  assert.match(brand.label, /Brand Sans/);
  assert.match(plan.dropped.join("\n"), /source:waiting.*has no licence yet/);
});

// ---- the guide writes it ------------------------------------------------------------------------

test("first stack, a font kept as files: the guide writes the block with what loads it, the tokens and the rows, and the gate holds the row", () => {
  const dir = repository(blueprint({ text_font: "source:brand-sans", heading_font: "text" }), {
    [ROW]: pretty(filed()),
    [FONT_FILE]: FONT_BYTES,
  });
  const applied = run(script("apply.mjs"), "--target", dir);
  assert.equal(applied.status, 0, applied.stderr || applied.stdout);
  assert.equal(applied.reached, "");
  const block = readBlock(text(dir, "src/index.css"));
  assert.ok(block.includes(`--font-sans: "Brand Sans", ${SYSTEM_FONT};`), block);
  // The loading code, on the stack whose adapter knows how: an @font-face rule for each file.
  assert.match(
    block,
    /@font-face \{\n {2}font-family: "Brand Sans";\n {2}src: url\("\.\/fonts\/brand-sans\.woff2"\) format\("woff2"\);\n {2}font-weight: 100 900;\n {2}font-display: swap;\n\}/,
  );
  // The floor's own part of the stylesheet is as it was.
  assert.equal(withoutBlock(text(dir, "src/index.css")), FLOOR_CSS);
  const tokens = json(dir, "design/tokens.json");
  assert.equal(tokens.font.sans.$value, "Brand Sans");
  assert.equal(tokens.font.heading.$value, "Brand Sans");
  const rows = parseLedger(text(dir, "design/decisions.yaml"));
  const typeface = rows.find((row) => row.id === "typeface");
  assert.match(typeface.source, /text typeface source:brand-sans/);
  assert.ok(
    rows.some((row) => row.id === "font-loaded"),
    "font-loaded is not held",
  );
  assert.equal(json(dir, "design/theme.json").inputs.textFont, "source:brand-sans");
  const rules = text(dir, ".claude/rules/design-assembly.md");
  assert.match(rules, /Brand Sans.*design\/sources\/brand-sans\.json/);
  const green = gate(dir);
  assert.equal(green.status, 0, green.stderr);
  assert.equal(green.reached, "");

  // The row loses its licence: the font is no longer one that can be chosen, and the gate says so.
  put(dir, ROW, pretty(filed({ licence: undefined })));
  const unlicensed = gate(dir);
  assert.notEqual(unlicensed.status, 0);
  assert.match(unlicensed.stderr, /design\/sources\/brand-sans\.json is a font and has no licence/);
  // The fault is the typeface's, and stands under its row, not under the generated block's.
  assert.match(
    unlicensed.stderr,
    /^ {2}typeface: .*brand-sans\.json is a font and has no licence/m,
  );
  assert.doesNotMatch(unlicensed.stderr, /^ {2}tonal-palette:/m);
  // The file is no longer the one that was pinned.
  put(dir, ROW, pretty(filed()));
  put(dir, FONT_FILE, `${FONT_BYTES}changed`);
  const moved = gate(dir);
  assert.notEqual(moved.status, 0);
  assert.match(moved.stderr, /src\/fonts\/brand-sans\.woff2 is not the file it was pinned with/);
  assert.match(
    moved.stderr,
    /^ {2}typeface: .*brand-sans\.woff2 is not the file it was pinned with/m,
  );
  assert.doesNotMatch(moved.stderr, /^ {2}tonal-palette:/m);
  // A repository the guide wrote before the typeface row checked its fonts still hears the
  // fault, from the generated block, as it did then.
  const theme = json(dir, "design/theme.json");
  const older = {
    ...theme,
    checks: {
      ...theme.checks,
      typeface: theme.checks.typeface.filter((check) => check.kind !== "font-row"),
    },
  };
  put(dir, "design/theme.json", `${JSON.stringify(older, null, 2)}\n`);
  const heard = gate(dir);
  assert.notEqual(heard.status, 0);
  assert.match(
    heard.stderr,
    /^ {2}tonal-palette: .*brand-sans\.woff2 is not the file it was pinned with/m,
  );
  put(dir, "design/theme.json", `${JSON.stringify(theme, null, 2)}\n`);
  // The row is gone.
  put(dir, FONT_FILE, FONT_BYTES);
  rmSync(path.join(dir, ROW));
  const gone = gate(dir);
  assert.notEqual(gone.status, 0);
  assert.match(gone.stderr, /the sources ledger has no font row design\/sources\/brand-sans\.json/);
  assert.match(gone.stderr, /^ {2}typeface: the sources ledger has no font row/m);
  assert.doesNotMatch(gone.stderr, /^ {2}tonal-palette:/m);
});

test("first stack, a font that is a package: a person writes the one line that loads it, and font-loaded holds it like any other", () => {
  const dir = repository(blueprint({ text_font: "source:brand-sans", heading_font: "text" }), {
    [ROW]: pretty(packaged()),
    "package-lock.json": LOCKFILE(),
    ...PACKAGE,
  });
  // Nothing loads it yet: the guide writes the value and says what is missing, with the line.
  const first = run(script("apply.mjs"), "--target", dir);
  assert.match(first.stdout, /font-loaded: .*names the typeface "Brand Sans"/);
  assert.match(first.stdout, /@import "brand-type";/);
  assert.doesNotMatch(readBlock(text(dir, "src/index.css")), /@font-face/);
  // The person writes the import, at the top of the stylesheet, and runs the guide again.
  put(dir, "src/index.css", `@import "brand-type";\n${text(dir, "src/index.css")}`);
  const second = run(script("apply.mjs"), "--target", dir);
  assert.equal(second.status, 0, second.stderr || second.stdout);
  const rows = parseLedger(text(dir, "design/decisions.yaml"));
  assert.ok(rows.some((row) => row.id === "font-loaded"));
  assert.equal(gate(dir).status, 0, gate(dir).stderr);
  // The import goes: the gate is red on the font, as on any typeface nothing loads.
  put(dir, "src/index.css", text(dir, "src/index.css").replace('@import "brand-type";\n', ""));
  const red = gate(dir);
  assert.notEqual(red.status, 0);
  assert.match(
    red.stderr,
    /font-loaded: --font-sans in src\/index\.css names the typeface "Brand Sans"/,
  );
  // The lockfile moves to another version: the row no longer pins what the repository has.
  put(dir, "src/index.css", `@import "brand-type";\n${text(dir, "src/index.css")}`);
  put(dir, "package-lock.json", LOCKFILE("1.3.0"));
  const moved = gate(dir);
  assert.notEqual(moved.status, 0);
  assert.match(moved.stderr, /pins brand-type at 1\.2\.0.*package-lock\.json pins 1\.3\.0/);
  assert.match(moved.stderr, /^ {2}typeface: .*pins brand-type at 1\.2\.0/m);
  assert.doesNotMatch(moved.stderr, /^ {2}tonal-palette:/m);
});

test("second stack: the guide writes the value and no loading code, and says a person writes it", () => {
  const dir = repository(blueprint({ text_font: "source:brand-sans", heading_font: "text" }), {
    [ROW]: pretty(filed({ variable: "--font-brand" })),
    [FONT_FILE]: FONT_BYTES,
    "package.json": pretty({ name: "sample", dependencies: { next: "16.0.0" } }),
    "next.config.mjs": "export default {};\n",
  });
  rmSync(path.join(dir, "vite.config.ts"));
  const applied = run(script("apply.mjs"), "--target", dir);
  const block = readBlock(text(dir, "src/index.css"));
  assert.ok(block.includes(`--font-sans: var(--font-brand), ${SYSTEM_FONT};`), block);
  assert.doesNotMatch(block, /@font-face/);
  assert.match(applied.stdout, /font-loaded: .*names the typeface var\(--font-brand\)/);
  assert.match(applied.stdout, /layout file/);
});

test("the rules page names a font of the sources ledger with its row", () => {
  const checks = {
    typeface: [
      {
        kind: "value",
        scope: ":root",
        variable: "--font-sans",
        expected: `"Brand Sans", ${SYSTEM_FONT}`,
      },
      { kind: "value", scope: ":root", variable: "--font-heading", expected: "var(--font-sans)" },
    ],
  };
  const page = rulesPage(
    checks,
    () => false,
    blueprint({ text_font: "source:brand-sans", heading_font: "text" }),
  );
  assert.match(page, /the font of `design\/sources\/brand-sans\.json`/);
});

// ---- who writes the row -------------------------------------------------------------------------

test("the guide's command writes the row of a font the lockfile pins: its version, no licence, and nothing fetched", () => {
  const dir = repository(blueprint(), { "package-lock.json": LOCKFILE(), ...PACKAGE });
  const written = run(
    script("font-source.mjs"),
    "--target",
    dir,
    "--family",
    "Brand Sans",
    "--package",
    "brand-type",
    "--on",
    "2026-11-21",
    "--json",
  );
  assert.equal(written.status, 1, written.stderr || written.stdout);
  assert.equal(written.reached, "");
  const row = json(dir, ROW);
  assert.deepEqual(row, {
    version: 1,
    id: "brand-sans",
    kind: "font",
    title: "Brand Sans",
    family: "Brand Sans",
    pin: { package: "brand-type", version: "1.2.0" },
    proposed: { by: "font-source", on: "2026-11-21" },
  });
  const said = JSON.parse(written.stdout);
  assert.equal(said.row, ROW);
  assert.match(said.next, /licence/);
  // What the lockfile says the package states is shown to the person, never written for them.
  assert.match(said.stated, /OFL-1\.1/);
  assert.deepEqual(shapeProblems("sources", text(dir, ROW), ROW), []);
  // A second call writes over nothing.
  const again = run(
    script("font-source.mjs"),
    "--target",
    dir,
    "--family",
    "Brand Sans",
    "--package",
    "brand-type",
  );
  assert.equal(again.status, 2);
  assert.match(again.stderr, /design\/sources\/brand-sans\.json is already there/);
  assert.deepEqual(json(dir, ROW), row);
});

test("a package the lockfile does not pin gets no row: the machine fetches nothing", () => {
  const dir = repository(blueprint(), { "package-lock.json": LOCKFILE() });
  const refused = run(
    script("font-source.mjs"),
    "--target",
    dir,
    "--family",
    "Other Sans",
    "--package",
    "other-type",
  );
  assert.equal(refused.status, 2);
  assert.match(refused.stderr, /package-lock\.json does not pin other-type/);
  assert.match(refused.stderr, /nothing is fetched/);
  assert.equal(existsSync(path.join(dir, ledger.SOURCES_FOLDER)), false);
  assert.equal(refused.reached, "");
});

test("the guide's command writes the row of font files already in the repository, hashed in place", () => {
  const dir = repository(blueprint(), { [FONT_FILE]: FONT_BYTES });
  const preview = run(
    script("font-source.mjs"),
    "--target",
    dir,
    "--family",
    "Brand Sans",
    "--files",
    FONT_FILE,
    "--dry-run",
  );
  assert.equal(existsSync(path.join(dir, ROW)), false, preview.stdout);
  const written = run(
    script("font-source.mjs"),
    "--target",
    dir,
    "--family",
    "Brand Sans",
    "--files",
    FONT_FILE,
    "--id",
    "brand-sans",
    "--on",
    "2026-11-21",
  );
  assert.equal(written.status, 1, written.stderr || written.stdout);
  assert.deepEqual(json(dir, ROW).pin, { files: [{ file: FONT_FILE, sha256: sha(FONT_BYTES) }] });
  assert.equal("licence" in json(dir, ROW), false);
  assert.match(written.stdout, /licence/);
  const missing = run(
    script("font-source.mjs"),
    "--target",
    dir,
    "--family",
    "Gone Sans",
    "--files",
    "src/fonts/gone.woff2",
  );
  assert.equal(missing.status, 2);
  assert.match(missing.stderr, /src\/fonts\/gone\.woff2 is not a file of the repository/);
  // A link that leads out of the repository is not a file of it.
  const away = path.join(empty(), "away.woff2");
  writeFileSync(away, FONT_BYTES);
  symlinkSync(away, path.join(dir, "src/fonts/link.woff2"));
  const linked = run(
    script("font-source.mjs"),
    "--target",
    dir,
    "--family",
    "Link Sans",
    "--files",
    "src/fonts/link.woff2",
  );
  assert.equal(linked.status, 2);
  assert.match(linked.stderr, /src\/fonts\/link\.woff2 is not a file of the repository/);
});

test("status names the licence of a written row as the next step, until a person fills it", () => {
  const dir = repository(blueprint({ text_font: "floor", heading_font: "text" }), {
    [FONT_FILE]: FONT_BYTES,
  });
  assert.equal(run(script("apply.mjs"), "--target", dir).status, 0);
  run(
    script("font-source.mjs"),
    "--target",
    dir,
    "--family",
    "Brand Sans",
    "--files",
    FONT_FILE,
    "--on",
    "2026-11-21",
  );
  // The row is written and not held: the gate is as green as before.
  assert.equal(gate(dir).status, 0, gate(dir).stderr);
  const waiting = fullStatus(dir).waiting.find((item) => item.id === "font-licence-brand-sans");
  assert.ok(waiting, "the licence does not wait");
  assert.match(waiting.question, /licence.*Brand Sans/);
  assert.match(waiting.recommendation, /into licence of design\/sources\/brand-sans\.json/);
  assert.match(waiting.basis, /font-source on 2026-11-21/);
  assert.match(waiting.basis, /is not held and the font cannot be chosen/);
  // The command whose page leads the person to it.
  assert.equal(waiting.answer, "/design-assembly:new");
  const said = run(script("status.mjs"), "--target", dir);
  assert.equal(said.reached, "");
  assert.match(
    said.stdout,
    /font-licence-brand-sans: Which licence is the font Brand Sans used under/,
  );
  assert.match(said.stdout, /next: \/design-assembly:new, .*font-licence-brand-sans/);
  // A person fills it: the row is held from then on, and nothing waits.
  put(dir, ROW, pretty({ ...json(dir, ROW), licence: "The owner holds the licence." }));
  assert.equal(
    fullStatus(dir).waiting.some((item) => item.id === "font-licence-brand-sans"),
    false,
  );
  assert.equal(ledger.readFontSources(dir)[0].held, true);
});

test("a licence question already on the waiting list is not asked a second time", () => {
  const dir = repository(blueprint({ text_font: "floor", heading_font: "text" }), {
    [ROW]: pretty(filed({ licence: undefined, proposed: { by: "adopt", on: "2026-11-21" } })),
    [FONT_FILE]: FONT_BYTES,
  });
  assert.equal(run(script("apply.mjs"), "--target", dir).status, 0);
  const asked = run(
    script("decide.mjs"),
    "--target",
    dir,
    "--ask",
    "Which licence does the font Brand Sans come under?",
    "--recommend",
    "The licence the owner bought it under",
    "--because",
    "the row was written from the files of the repository, and the licence is a person's to give",
    "--easy-to-undo",
    "--id",
    "font-licence-brand-sans",
  );
  assert.ok([0, 1].includes(asked.status), asked.stderr || asked.stdout);
  const waiting = fullStatus(dir).waiting.filter((item) => item.id === "font-licence-brand-sans");
  assert.equal(waiting.length, 1, JSON.stringify(waiting, null, 2));
});

// ---- adopting keeps a repository's own font ------------------------------------------------------

// A repository that never met the plugin and loads a font of its own: only what adopting reads.
const GATED = "CHECK_TARGETS := lint\n-include mk/*.mk\ncheck: $(CHECK_TARGETS)\n";
const ROLES = [
  ":root {",
  "  --radius: 0.625rem;",
  "  --background: #ffffff;",
  "  --primary: #0246ff;",
  "  --primary-foreground: #ffffff;",
  "}",
  "",
].join("\n");
const NAMES = (first) =>
  `@theme inline {\n  --font-sans: ${first}, sans-serif;\n  --font-heading: var(--font-sans);\n}\n`;
function ownRepository(files) {
  const dir = empty();
  put(dir, "Makefile", GATED);
  for (const [file, content] of Object.entries(files)) put(dir, file, content);
  return dir;
}
const adopt = (dir, ...args) =>
  run(script("adopt.mjs"), "--target", dir, "--conformance-level", "AA", ...args);
// Every file of a repository with its bytes, the plugin's own folders aside: what adopting must
// leave as it found it.
const kept = (dir, files) => Object.fromEntries(files.map((file) => [file, text(dir, file)]));

test("first stack: adopt proposes the row of a font the repository already loads from a package, as its own, and writes over nothing", () => {
  const css = `@import "brand-type";\n\n${ROLES}${NAMES('"Brand Sans"')}`;
  const dir = ownRepository({
    "package.json": pretty({ name: "sample", devDependencies: { vite: "8.0.0" } }),
    "vite.config.ts": "export default {};\n",
    "package-lock.json": LOCKFILE(),
    "src/index.css": css,
    ...PACKAGE,
  });
  const before = kept(dir, ["src/index.css", "package.json", "package-lock.json", "Makefile"]);
  const preview = adopt(dir, "--dry-run", "--json");
  assert.equal(existsSync(path.join(dir, ROW)), false);
  const planned = JSON.parse(preview.stdout);
  assert.deepEqual(
    planned.fonts.map((font) => [font.row, font.family, font.own]),
    [[ROW, "Brand Sans", true]],
  );

  const adopted = adopt(dir);
  assert.ok([0, 1].includes(adopted.status), adopted.stderr || adopted.stdout);
  assert.equal(adopted.reached, "");
  assert.match(adopted.stdout, /the repository's own font/);
  assert.match(adopted.stdout, /Brand Sans.*design\/sources\/brand-sans\.json/);
  const row = json(dir, ROW);
  assert.equal(row.kind, "font");
  assert.equal(row.family, "Brand Sans");
  assert.equal(row.own, true);
  assert.deepEqual(row.pin, { package: "brand-type", version: "1.2.0" });
  assert.equal(row.proposed.by, "adopt");
  assert.match(row.proposed.on, /^\d{4}-\d{2}-\d{2}$/);
  assert.equal("licence" in row, false, "a tool wrote a licence");
  // Nothing the repository had is written over.
  assert.deepEqual(kept(dir, Object.keys(before)), before);
  // The gate holds what the repository does today: its font is loaded, and stays the one named.
  const rows = parseLedger(text(dir, "design/decisions.yaml"));
  assert.ok(
    rows.some((item) => item.id === "font-loaded"),
    "font-loaded is not held",
  );
  const typeface = rows.find((item) => item.id === "typeface");
  assert.ok(typeface, "the typeface is not held as found");
  assert.match(typeface.source, /as found/);
  const green = gate(dir);
  assert.equal(green.status, 0, green.stderr);
  // The licence waits on a person, named by status with the command of a repository that adopted.
  const waiting = fullStatus(dir).waiting.find((item) => item.id === "font-licence-brand-sans");
  assert.ok(waiting, "the licence does not wait");
  assert.equal(waiting.answer, "/design-assembly:adopt");
  assert.match(waiting.recommendation, /states OFL-1\.1/);

  // A person fills the licence; adopting again leaves their row as they wrote it.
  put(dir, ROW, pretty({ ...row, licence: "OFL 1.1, read by the owner." }));
  const filled = text(dir, ROW);
  const again = adopt(dir);
  assert.ok([0, 1].includes(again.status), again.stderr);
  assert.equal(text(dir, ROW), filled);
  assert.match(again.stdout, /design\/sources\/brand-sans\.json is already there/);
  // The font goes: the gate is red, since the stylesheet still names it.
  put(dir, "src/index.css", css.replace('@import "brand-type";\n', ""));
  assert.notEqual(gate(dir).status, 0);
});

test("first stack: a font the repository keeps as files gets its row with each file hashed in place", () => {
  const css = `@font-face {\n  font-family: "Brand Sans";\n  src: url("./fonts/brand-sans.woff2") format("woff2");\n  font-weight: 100 900;\n}\n\n${ROLES}${NAMES('"Brand Sans"')}`;
  const dir = ownRepository({
    "package.json": pretty({ name: "sample", devDependencies: { vite: "8.0.0" } }),
    "vite.config.ts": "export default {};\n",
    "src/index.css": css,
    [FONT_FILE]: FONT_BYTES,
  });
  const adopted = adopt(dir);
  assert.ok([0, 1].includes(adopted.status), adopted.stderr || adopted.stdout);
  const row = json(dir, ROW);
  assert.deepEqual(row.pin, { files: [{ file: FONT_FILE, sha256: sha(FONT_BYTES) }] });
  assert.equal(row.own, true);
  assert.equal(text(dir, "src/index.css"), css);
  assert.equal(gate(dir).status, 0, gate(dir).stderr);
});

test("a font the stylesheet loads from an address outside the repository gets no row, and adopt says why", () => {
  const css = `@font-face {\n  font-family: "Brand Sans";\n  src: url("https://fonts.example.test/brand.woff2");\n}\n\n${ROLES}${NAMES('"Brand Sans"')}`;
  const dir = ownRepository({
    "package.json": pretty({ name: "sample", devDependencies: { vite: "8.0.0" } }),
    "vite.config.ts": "export default {};\n",
    "src/index.css": css,
  });
  const adopted = adopt(dir);
  assert.equal(adopted.status, 1, adopted.stderr || adopted.stdout);
  assert.equal(adopted.reached, "", "adopt reached for the address");
  assert.equal(existsSync(path.join(dir, ledger.SOURCES_FOLDER)), false);
  assert.match(adopted.stdout, /"Brand Sans" is the repository's own font/);
  assert.match(adopted.stdout, /nothing is fetched/);
});

const LAYOUT = (loader) =>
  [
    loader,
    'import "./globals.css";',
    "",
    "export default function RootLayout({ children }) {",
    "  return <html className={brand.variable}>{children}</html>;",
    "}",
    "",
  ].join("\n");
const SECOND = {
  "package.json": pretty({ name: "sample", dependencies: { next: "16.0.0" } }),
  "next.config.mjs": "export default {};\n",
  // Where the repository says its stylesheet is.
  "components.json": JSON.stringify({ tailwind: { css: "app/globals.css" } }),
  "app/globals.css": `${ROLES}${NAMES("var(--font-brand)")}`,
};

test("second stack: adopt proposes the row of a font its loader takes from files of the repository, with the variable the loader sets", () => {
  const layout = LAYOUT(
    [
      'import localFont from "next/font/local";',
      "",
      "const brand = localFont({",
      '  src: [{ path: "./fonts/brand-sans.woff2", weight: "100 900" }],',
      '  variable: "--font-brand",',
      "});",
    ].join("\n"),
  );
  const dir = ownRepository({
    ...SECOND,
    "app/layout.tsx": layout,
    "app/fonts/brand-sans.woff2": FONT_BYTES,
  });
  const before = kept(dir, ["app/globals.css", "app/layout.tsx", "package.json"]);
  const adopted = adopt(dir);
  assert.ok([0, 1].includes(adopted.status), adopted.stderr || adopted.stdout);
  assert.equal(adopted.reached, "");
  assert.match(adopted.stdout, /the repository's own font/);
  const row = json(dir, ROW);
  assert.equal(row.kind, "font");
  assert.equal(row.variable, "--font-brand");
  assert.equal(row.own, true);
  assert.deepEqual(row.pin, {
    files: [{ file: "app/fonts/brand-sans.woff2", sha256: sha(FONT_BYTES) }],
  });
  assert.equal("licence" in row, false);
  assert.deepEqual(kept(dir, Object.keys(before)), before);
  const rows = parseLedger(text(dir, "design/decisions.yaml"));
  assert.ok(
    rows.some((item) => item.id === "font-loaded"),
    "font-loaded is not held",
  );
  const green = gate(dir);
  assert.equal(green.status, 0, green.stderr);
});

test("second stack: a font the loader does not take from files of the repository gets no row, and adopt says a person writes it", () => {
  const layout = LAYOUT(
    [
      'import { Inter } from "next/font/google";',
      "",
      'const brand = Inter({ subsets: ["latin"], variable: "--font-brand" });',
    ].join("\n"),
  );
  const dir = ownRepository({ ...SECOND, "app/layout.tsx": layout });
  const adopted = adopt(dir);
  assert.equal(adopted.status, 1, adopted.stderr || adopted.stdout);
  assert.equal(adopted.reached, "");
  assert.equal(existsSync(path.join(dir, ledger.SOURCES_FOLDER)), false);
  assert.match(adopted.stdout, /var\(--font-brand\) is the repository's own font/);
  assert.match(adopted.stdout, /the font loader in app\/layout\.tsx/);
  assert.match(adopted.stdout, /a person writes the row/);
  assert.equal(gate(dir).status, 0, gate(dir).stderr);
});

// ---- the handoff book ---------------------------------------------------------------------------

test("the handoff book names the font and where it comes from, from the sources ledger where a row exists", () => {
  const css = `@import "brand-type";\n\n${ROLES}${NAMES('"Brand Sans"')}`;
  const dir = ownRepository({
    "package.json": pretty({ name: "sample", devDependencies: { vite: "8.0.0" } }),
    "vite.config.ts": "export default {};\n",
    "package-lock.json": LOCKFILE(),
    "src/index.css": css,
    ...PACKAGE,
  });
  // No row yet: the book says what loads the font, and that the ledger has no row for it.
  const bare = collectFacts(dir).fonts;
  assert.deepEqual(
    bare.map((font) => [font.role, font.family, font.row]),
    [["text and headings", "Brand Sans", null]],
  );
  assert.deepEqual(bare[0].loaded, {
    via: "package",
    file: "src/index.css",
    specifier: "brand-type",
  });
  const unlisted = renderBook(collectFacts(dir));
  assert.match(unlisted, /Brand Sans/);
  assert.match(
    unlisted,
    /the package <code>brand-type<\/code>, which <code>src\/index\.css<\/code> imports/,
  );
  assert.match(unlisted, /no row in the sources ledger/);

  put(dir, ROW, pretty(packaged()));
  const [font] = collectFacts(dir).fonts;
  assert.equal(font.row, ROW);
  assert.equal(font.from, "the package brand-type at 1.2.0");
  assert.match(font.licence, /SIL Open Font License/);
  const page = renderBook(collectFacts(dir));
  assert.match(page, /Brand Sans/);
  assert.match(page, /the package brand-type at 1\.2\.0/);
  assert.match(page, /design\/sources\/brand-sans\.json/);
  assert.match(page, /SIL Open Font License/);
  // A row that waits on its licence is named as such; a pin that moved is said.
  put(
    dir,
    ROW,
    pretty(packaged({ licence: undefined, proposed: { by: "adopt", on: "2026-11-21" } })),
  );
  assert.match(renderBook(collectFacts(dir)), /licence not written yet/);
  put(dir, ROW, pretty(packaged()));
  put(dir, "package-lock.json", LOCKFILE("1.3.0"));
  assert.match(collectFacts(dir).fonts[0].differs, /package-lock\.json pins 1\.3\.0/);
  // The same facts on every reading, and from the command, with the network unreachable.
  assert.deepEqual(collectFacts(dir), collectFacts(dir));
  const facts = run(script("book.mjs"), "--target", dir, "--facts");
  assert.equal(facts.status, 0, facts.stderr);
  assert.equal(facts.reached, "");
  assert.equal(JSON.parse(facts.stdout).fonts[0].family, "Brand Sans");
});

test("the book of a repository that names only the system font names no font to load", () => {
  const dir = ownRepository({ "src/index.css": `${ROLES}${NAMES("ui-sans-serif, system-ui")}` });
  assert.deepEqual(collectFacts(dir).fonts, []);
});

// ---- no command reaches the network ---------------------------------------------------------------

test("every command that touches a font runs with the network unreachable, and reaches for nothing", () => {
  const dir = repository(blueprint({ text_font: "source:brand-sans", heading_font: "text" }), {
    [ROW]: pretty(filed()),
    [FONT_FILE]: FONT_BYTES,
    "package-lock.json": LOCKFILE(),
    ...PACKAGE,
  });
  const calls = [
    ["apply.mjs", "--dry-run"],
    ["apply.mjs"],
    ["specimen.mjs", "--section", "typeface", "--plan"],
    ["adopt.mjs", "--conformance-level", "AA", "--dry-run"],
    ["font-source.mjs", "--family", "Brand Type", "--package", "brand-type", "--dry-run"],
    ["logo-source.mjs", "--file", `${FONT_FILE}:mark:color`, "--dry-run"],
    ["icon-source.mjs", "--package", "brand-type", "--dry-run"],
    ["status.mjs"],
    ["decide.mjs"],
    ["book.mjs", "--facts"],
    ["upgrade.mjs", "--dry-run"],
  ];
  for (const [name, ...args] of calls) {
    const result = run(script(name), "--target", dir, ...args);
    assert.equal(result.reached, "", `${name} reached for ${result.reached}`);
    assert.ok([0, 1].includes(result.status), `${name}: ${result.stderr || result.stdout}`);
  }
  const checked = gate(dir);
  assert.equal(checked.reached, "");
  assert.equal(checked.status, 0, checked.stderr);
  // The guard is not green because it sees nothing: each way out is caught and written down, in
  // this process and in a child that inherits its environment.
  const probes = {
    'await fetch("https://example.test/font.woff2").catch(() => {});':
      /a fetch of https:\/\/example\.test/,
    'import net from "node:net"; try { net.connect(9, "10.255.255.1"); } catch {}':
      /a connection to 10\.255\.255\.1/,
    'import http from "node:http"; try { http.get("http://10.255.255.1:9/"); } catch {}':
      /a connection to 10\.255\.255\.1/,
    'import { lookup } from "node:dns/promises"; await lookup("example.test").catch(() => {});':
      /the address of example\.test/,
    'import dns from "node:dns"; await dns.promises.resolve4("example.test").catch(() => {});':
      /the address of example\.test/,
    'import { spawnSync } from "node:child_process"; spawnSync(process.execPath, ["-e", "fetch(\\"https://example.test/\\").catch(() => {})"]);':
      /a fetch of https:\/\/example\.test/,
  };
  for (const [code, caught] of Object.entries(probes)) {
    const probe = path.join(empty(), "probe.mjs");
    writeFileSync(probe, `${code}\n`);
    assert.match(run(probe).reached, caught, code);
  }
});
