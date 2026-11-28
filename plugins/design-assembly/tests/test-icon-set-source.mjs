// The icon set enters through the sources ledger (item 12.1, slice 1; spec 0017): a source of the
// kind `icon-set` says the module the code imports icons from, its pin and its licence; a command
// writes the row from what the repository already holds, a package its lockfile pins or a folder of
// its own files hashed in place; adopt proposes the row from the component library's settings and
// writes over nothing; the gate holds the pin. The licence is a person's to write. No command
// reaches the network, and a repository with no row of the kind reads as it did before.
import "./helpers/own-cores.mjs";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import {
  existsSync,
  readdirSync,
  readFileSync,
  statSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import path from "node:path";
import { env, execPath } from "node:process";
import { after, test } from "node:test";

import { fullStatus } from "../scripts/status.mjs";
import { readState, runChecks } from "../templates/tools/design-assembly/check.mjs";
import { LEDGERS, shapeProblems } from "../templates/tools/design-assembly/contract.mjs";
import * as ledger from "../templates/tools/design-assembly/sources-ledger.mjs";

import { KINDS, observe, readRecord } from "./helpers/brand-free.mjs";
import {
  adopted,
  cleanup,
  empty,
  floor,
  json,
  PLUGIN,
  put,
  read,
  SCRIPTS,
  snapshot,
  text,
} from "./helpers/core-family.mjs";

after(cleanup);

const VERSION = JSON.parse(
  readFileSync(path.join(PLUGIN, ".claude-plugin/plugin.json"), "utf8"),
).version;
const NO_NETWORK = path.join(PLUGIN, "tests/helpers/no-network.mjs");
const sha = (bytes) => createHash("sha256").update(bytes).digest("hex");

// Every command of these tests runs with the network unreachable: a connection to anything but
// this machine throws, and is written down.
function run(file, ...args) {
  const log = path.join(empty(), "reached.log");
  const result = spawnSync(execPath, ["--import", NO_NETWORK, file, ...args], {
    encoding: "utf8",
    env: { ...env, DESIGN_ASSEMBLY_NETWORK_LOG: log },
  });
  return { ...result, reached: existsSync(log) ? readFileSync(log, "utf8") : "" };
}
const command = (dir, ...args) =>
  run(path.join(SCRIPTS, "icon-source.mjs"), "--target", dir, "--on", "2026-11-26", ...args);
const gate = (dir) => run(path.join(dir, "tools/design-assembly/check.mjs"), "--target", dir);

// A made-up icon package: its name is data of the repository, never of the plugin.
const PACKAGE = "@quillmark/glyphs";
const ID = "quillmark-glyphs";
const ROW = `${ledger.SOURCES_FOLDER}/${ID}.json`;
const LOCKFILE = (version = "2.4.1", name = PACKAGE) =>
  json({
    name: "harbor-ledger",
    lockfileVersion: 3,
    packages: {
      "": { name: "harbor-ledger" },
      [`node_modules/${name}`]: { version, license: "ISC" },
    },
  });
// Icons the repository keeps as its own files.
const ICONS = {
  "src/icons/anchor.svg": '<svg viewBox="0 0 24 24"><path d="M12 2v20"/></svg>\n',
  "src/icons/compass.svg": '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/></svg>\n',
};

// A row of the kind, as a person finished it.
const packaged = (more = {}) => ({
  version: 1,
  id: ID,
  kind: "icon-set",
  title: PACKAGE,
  module: PACKAGE,
  pin: { package: PACKAGE, version: "2.4.1" },
  licence: "ISC, as the owner read it in the package.",
  ...more,
});
const filed = (more = {}) => ({
  version: 1,
  id: "harbor-icons",
  kind: "icon-set",
  title: "Harbor icons",
  folder: "src/icons",
  pin: {
    files: Object.entries(ICONS).map(([file, bytes]) => ({ file, sha256: sha(bytes) })),
  },
  licence: "Drawn for this product: the owner holds the rights.",
  ...more,
});

// The files of a folder as they are, the folder of git left out.
const files = (dir) => snapshot(dir).filter((line) => !line.endsWith("/"));

// ---- criterion 1: a repository with no row of the new kinds reads as before -------------------

for (const kind of Object.keys(KINDS)) {
  test(`a repository with no row of the new kinds reads as plugin 0.69.0 read it: ${kind}`, () => {
    const before = readRecord().kinds[kind];
    const now = observe(KINDS[kind](), VERSION);
    assert.deepEqual(Object.keys(now), Object.keys(before), `${kind}: the commands asked`);
    for (const name of Object.keys(before)) {
      assert.equal(now[name].exit, before[name].exit, `${kind}, ${name}: exit`);
      assert.equal(now[name].out, before[name].out, `${kind}, ${name}: output`);
      assert.equal(now[name].err, before[name].err, `${kind}, ${name}: errors`);
    }
  });
}

// ---- criterion 2: the kind of source in the contract -------------------------------------------

test("an icon set is a kind of source whose shape the contract writes, and the ledger stays at version 1", () => {
  assert.equal(LEDGERS.sources.version, 1);
  assert.ok(LEDGERS.sources["icon-set"], "the contract has no shape for an icon set");
  assert.deepEqual(shapeProblems("sources", json(packaged()), ROW), []);
  assert.deepEqual(
    shapeProblems("sources", json(filed()), `${ledger.SOURCES_FOLDER}/harbor-icons.json`),
    [],
  );
  // What a person answers of the set, its sizes and its stroke, has a shape too.
  assert.deepEqual(
    shapeProblems("sources", json(packaged({ sizes: [16, 20, 24], stroke: 1.5 })), ROW),
    [],
  );
  assert.match(
    shapeProblems("sources", json(packaged({ sizes: ["big"] })), ROW).join("\n"),
    /sizes/,
  );
  // An icon set offers no blocks: it names no catalog.
  assert.equal("catalog" in packaged(), false);
  const contract = text(PLUGIN, "references/contract.md");
  const section = contract.slice(contract.indexOf("### sources"));
  for (const word of ["`icon-set`", "`module`", "`folder`", "`sizes`", "`stroke`"]) {
    assert.ok(section.includes(word), `contract.md does not say ${word} of an icon set`);
  }
});

test("an icon set row with no pin, or with no licence and no command that proposed it, breaks its shape, and the sentence names the row", () => {
  const noPin = shapeProblems("sources", json(packaged({ pin: undefined })), ROW);
  assert.equal(noPin.length, 1, noPin.join("\n"));
  assert.match(noPin[0], /^design\/sources\/quillmark-glyphs\.json is an icon set and has no pin/);
  for (const pin of [{}, { package: PACKAGE }, { version: "2.4.1" }, { files: [] }]) {
    const found = shapeProblems("sources", json(packaged({ pin })), ROW);
    assert.match(found.join("\n"), /is an icon set and has no pin/, JSON.stringify(pin));
  }
  const noLicence = shapeProblems("sources", json(packaged({ licence: undefined })), ROW);
  assert.equal(noLicence.length, 1, noLicence.join("\n"));
  assert.match(
    noLicence[0],
    /^design\/sources\/quillmark-glyphs\.json is an icon set and has no licence/,
  );
  // A row a command wrote waits on its licence without breaking its shape.
  const proposed = packaged({
    licence: undefined,
    proposed: { by: "icon-source", on: "2026-11-26" },
  });
  assert.deepEqual(shapeProblems("sources", json(proposed), ROW), []);
});

test("the gate's ledger-shapes check turns red on an icon set row with no pin, and on one with no licence", () => {
  const dir = empty();
  put(dir, "design/theme.json", json({ checks: { "ledger-shapes": [{ kind: "shapes" }] } }));
  put(dir, ROW, json(packaged()));
  const shapes = () => runChecks(readState(dir)).find((result) => result.id === "ledger-shapes");
  assert.equal(shapes().problem, null);
  put(dir, ROW, json(packaged({ pin: undefined })));
  assert.match(shapes().problem, /quillmark-glyphs\.json is an icon set and has no pin/);
  put(dir, ROW, json(packaged({ licence: undefined })));
  assert.match(shapes().problem, /quillmark-glyphs\.json is an icon set and has no licence/);
});

test("the reader of libraries does not return an icon set; the reader of icon sets does", () => {
  const dir = empty();
  put(
    dir,
    `${ledger.SOURCES_FOLDER}/kit.json`,
    json({ version: 1, id: "kit", pin: { version: "3.1.0" }, catalog: "design/kit.json" }),
  );
  put(dir, "design/kit.json", json({ items: [{ name: "grid" }] }));
  put(dir, ROW, json(packaged()));
  put(dir, "package-lock.json", LOCKFILE());
  assert.deepEqual(
    ledger.readPinnedSources(dir).map((source) => source.id),
    ["kit"],
  );
  assert.deepEqual(ledger.readFontSources(dir), []);
  const [set] = ledger.readIconSets(dir);
  assert.equal(set.id, ID);
  assert.equal(set.module, PACKAGE);
  assert.equal(set.held, true);
  assert.deepEqual(set.drift, []);
});

// ---- criterion 3: the command writes the row ---------------------------------------------------

test("the command writes the row of an icon package the lockfile pins and does not hold installed: its version, no licence, nothing fetched, nothing else touched but the question to the owner", () => {
  const dir = floor("harbor-ledger");
  put(dir, "package-lock.json", LOCKFILE());
  const before = files(dir);
  const preview = command(dir, "--package", PACKAGE, "--dry-run");
  assert.equal(preview.reached, "");
  assert.equal(preview.status, 1, preview.stderr);
  assert.match(preview.stdout, /preview only: nothing was written/);
  assert.deepEqual(files(dir), before, "the preview wrote something");

  const done = command(dir, "--package", PACKAGE);
  assert.equal(done.reached, "");
  assert.equal(done.status, 1, done.stderr);
  const row = read(dir, ROW);
  assert.deepEqual(row, {
    version: 1,
    id: ID,
    kind: "icon-set",
    title: PACKAGE,
    module: PACKAGE,
    pin: { package: PACKAGE, version: "2.4.1" },
    proposed: { by: "icon-source", on: "2026-11-26" },
  });
  assert.match(done.stdout, /the package @quillmark\/glyphs at 2\.4\.1, as the lockfile pins it/);
  assert.match(
    done.stdout,
    /package-lock\.json says the package @quillmark\/glyphs states the licence ISC/,
  );
  assert.match(
    done.stdout,
    /^next: write the licence the icon set is used under into licence of design\/sources\/quillmark-glyphs\.json/m,
  );
  // The package is not installed here, so the licence it declares cannot be read, and is said so.
  assert.match(done.stdout, /^licence: the package @quillmark\/glyphs is not installed here/m);
  // The row and the question that asks the owner which set the product takes are the files
  // added; every file of the repository is as it was.
  const QUESTION = `design/waiting/icon-set-${ID}.json`;
  assert.equal(read(dir, QUESTION).item, `icon-set:${ID}`);
  assert.deepEqual(
    files(dir).filter((line) => !line.startsWith(`${ROW} `) && !line.startsWith(`${QUESTION} `)),
    before,
  );
});

test("an icon package the lockfile does not pin gets no row: the machine fetches and installs nothing", () => {
  const dir = floor("harbor-ledger");
  const before = files(dir);
  const none = command(dir, "--package", PACKAGE);
  assert.equal(none.reached, "");
  assert.equal(none.status, 2);
  assert.match(none.stderr, /no lockfile this tool reads/);
  put(dir, "package-lock.json", LOCKFILE("2.4.1", "@other/thing"));
  const unpinned = command(dir, "--package", PACKAGE);
  assert.equal(unpinned.status, 2);
  assert.match(unpinned.stderr, /package-lock\.json does not pin @quillmark\/glyphs/);
  assert.match(unpinned.stderr, /Nothing was written/);
  assert.equal(existsSync(path.join(dir, ROW)), false);
  assert.deepEqual(
    files(dir).filter((line) => !line.startsWith("package-lock.json ")),
    before,
  );
});

test("the command writes the row of a folder of the repository's own icons, each file hashed in place", () => {
  const dir = floor("harbor-ledger");
  for (const [file, bytes] of Object.entries(ICONS)) put(dir, file, bytes);
  put(dir, "src/icons/set/wave.svg", "<svg/>\n");
  const done = command(dir, "--folder", "src/icons", "--title", "Harbor icons");
  assert.equal(done.status, 1, done.stderr);
  const row = read(dir, `${ledger.SOURCES_FOLDER}/icons.json`);
  assert.equal(row.kind, "icon-set");
  assert.equal(row.folder, "src/icons");
  assert.equal(row.title, "Harbor icons");
  assert.equal("module" in row, false);
  assert.deepEqual(row.pin.files, [
    { file: "src/icons/anchor.svg", sha256: sha(ICONS["src/icons/anchor.svg"]) },
    { file: "src/icons/compass.svg", sha256: sha(ICONS["src/icons/compass.svg"]) },
    { file: "src/icons/set/wave.svg", sha256: sha("<svg/>\n") },
  ]);
  assert.match(done.stdout, /3 file\(s\) of the repository, hashed where they are/);
  // The icons are where they were, byte for byte.
  for (const [file, bytes] of Object.entries(ICONS)) assert.equal(text(dir, file), bytes);
});

test("a folder that is not in the repository, or holds no file, gets no row", () => {
  const dir = floor("harbor-ledger");
  put(dir, "src/empty/.keep", "");
  for (const folder of ["../away", "src/missing", "src/index.css", "src/empty", "."]) {
    const refused = command(dir, "--folder", folder);
    assert.equal(refused.status, 2, folder);
    assert.match(refused.stderr, /Nothing was written/, folder);
  }
  // A link inside the repository that leads out of it is outside too.
  const away = empty();
  put(away, "far.svg", "<svg/>\n");
  symlinkSync(away, path.join(dir, "src/linked"));
  const linked = command(dir, "--folder", "src/linked");
  assert.equal(linked.status, 2);
  assert.equal(existsSync(path.join(dir, ledger.SOURCES_FOLDER)), false);
});

test("the command never writes over a row, nor writes a second row for a package a row pins", () => {
  const dir = floor("harbor-ledger");
  put(dir, "package-lock.json", LOCKFILE());
  put(dir, ROW, json(packaged()));
  const kept = text(dir, ROW);
  const again = command(dir, "--package", PACKAGE);
  assert.equal(again.status, 2);
  assert.match(again.stderr, /design\/sources\/quillmark-glyphs\.json is already there/);
  assert.equal(text(dir, ROW), kept);
  const other = command(dir, "--package", PACKAGE, "--id", "glyphs-again");
  assert.equal(other.status, 2);
  assert.match(
    other.stderr,
    /design\/sources\/quillmark-glyphs\.json already pins @quillmark\/glyphs/,
  );
  assert.equal(existsSync(path.join(dir, `${ledger.SOURCES_FOLDER}/glyphs-again.json`)), false);
});

test("a wrong call is refused with a sentence and writes nothing", () => {
  const dir = floor("harbor-ledger");
  // With nothing named, the command recommends a set and writes nothing (slice 2): not wrong.
  for (const args of [
    ["--package", PACKAGE, "--folder", "src"],
    ["--package", PACKAGE, "--recommended"],
    ["--package", PACKAGE, "--on", "today"],
  ]) {
    const refused = command(dir, ...args);
    assert.equal(refused.status, 2, args.join(" "));
  }
  assert.equal(existsSync(path.join(dir, ledger.SOURCES_FOLDER)), false);
});

// ---- criterion 5: a row the command writes waits on a person's licence --------------------------

test("a row the command wrote is not held until a person writes its licence, and status names that step and writes nothing", () => {
  const dir = adopted();
  put(dir, "package-lock.json", LOCKFILE());
  assert.equal(command(dir, "--package", PACKAGE).status, 1);
  const [set] = ledger.readIconSets(dir);
  assert.equal(set.held, false);
  assert.match(set.waits, /quillmark-glyphs\.json has no licence yet/);
  // The gate stays green on a row that waits on its licence.
  const checked = gate(dir);
  assert.equal(checked.status, 0, checked.stdout + checked.stderr);

  const before = files(dir);
  const status = run(path.join(SCRIPTS, "status.mjs"), "--target", dir, "--json");
  assert.equal(status.reached, "");
  assert.equal(status.status, 1);
  const asked = JSON.parse(status.stdout).waiting.find(
    (item) => item.id === `icon-set-licence-${ID}`,
  );
  assert.ok(asked, "status does not ask the licence of the icon set");
  assert.equal(asked.question, `Which licence is the icon set ${PACKAGE} used under?`);
  assert.match(
    asked.recommendation,
    /into licence of design\/sources\/quillmark-glyphs\.json, in the owner's words: no tool writes one/,
  );
  assert.match(asked.recommendation, /states ISC/);
  const words = run(path.join(SCRIPTS, "status.mjs"), "--target", dir).stdout;
  assert.match(words, /Which licence is the icon set @quillmark\/glyphs used under\?/);
  assert.deepEqual(files(dir), before, "status wrote something");
  assert.equal(read(dir, ROW).licence, undefined);

  // Once a person wrote it, the row is held and nothing is asked.
  put(dir, ROW, json({ ...read(dir, ROW), licence: "ISC, read by the owner." }));
  assert.equal(ledger.readIconSets(dir)[0].held, true);
  const quiet = fullStatus(dir);
  assert.equal(
    quiet.waiting.some((item) => item.id === `icon-set-licence-${ID}`),
    false,
  );
});

// ---- criterion 6: adopt proposes, and writes over nothing --------------------------------------

// A repository whose component library's settings name an icon set its lockfile pins.
function withLibrary(word = "lucide", pinned = "lucide-react") {
  const dir = floor("harbor-ledger");
  put(dir, "package.json", json({ name: "harbor-ledger", dependencies: { [pinned]: "^1.0.0" } }));
  put(
    dir,
    "components.json",
    json({ style: "new-york", tailwind: { css: "src/index.css" }, iconLibrary: word }),
  );
  put(dir, "package-lock.json", LOCKFILE("1.3.0", pinned));
  put(dir, "src/app.tsx", `import { Anchor } from "${pinned}";\nexport const App = Anchor;\n`);
  return dir;
}
const adopt = (dir, ...args) =>
  run(path.join(SCRIPTS, "adopt.mjs"), "--target", dir, "--conformance-level", "AA", ...args);

test("adopt proposes the row of the icon set the library's settings name, as the repository's own, and writes over nothing", () => {
  const dir = withLibrary();
  const before = files(dir);
  const preview = adopt(dir, "--dry-run", "--json");
  assert.equal(preview.reached, "");
  const data = JSON.parse(preview.stdout);
  assert.deepEqual(data.icon_sets, [
    {
      row: "design/sources/lucide-react.json",
      module: "lucide-react",
      named_by: "components.json",
      from: "the package lucide-react at 1.3.0, as the lockfile pins it",
      stated:
        "package-lock.json says the package lucide-react states the licence ISC: read it, and write the licence the icon set is used under in your own words",
    },
  ]);
  assert.ok(
    data.files.some((item) => item.path === "design/sources/lucide-react.json"),
    "the row is not among the files the preview would write",
  );
  const row = {
    version: 1,
    id: "lucide-react",
    kind: "icon-set",
    title: "lucide-react",
    module: "lucide-react",
    pin: { package: "lucide-react", version: "1.3.0" },
    own: true,
    proposed: { by: "adopt", on: "<day>" },
  };
  assert.ok(
    data.person.some(
      (item) =>
        item.id === "icon-set-licence" &&
        /licence of design\/sources\/lucide-react\.json/.test(item.why),
    ),
  );
  assert.deepEqual(files(dir), before, "the preview wrote something");
  const words = adopt(dir, "--dry-run").stdout;
  assert.match(
    words,
    /the repository's own icon set, proposed as a row of the sources ledger \(a person writes its licence\):\n {2}lucide-react: design\/sources\/lucide-react\.json, from the package lucide-react at 1\.3\.0, as the lockfile pins it; named by components\.json/,
  );

  // The real run writes the row and lays the check of its pin; every file the repository had is
  // as it was.
  const done = adopt(dir);
  assert.ok([0, 1].includes(done.status), done.stderr);
  const written = read(dir, "design/sources/lucide-react.json");
  assert.match(written.proposed.on, /^\d{4}-\d{2}-\d{2}$/);
  assert.deepEqual({ ...written, proposed: { ...written.proposed, on: "<day>" } }, row);
  const had = new Map(before.map((line) => line.split(" ")));
  for (const line of files(dir)) {
    const [file, hash] = line.split(" ");
    if (had.has(file)) assert.equal(hash, had.get(file), `${file} changed`);
  }
  const shapes = read(dir, "design/theme.json").checks["ledger-shapes"];
  assert.ok(
    shapes.some((check) => check.kind === "icon-set-pin"),
    "the pin is not held",
  );
  assert.equal(gate(dir).status, 0);
});

test("adopt leaves a row that is there as it is, and says why it writes none when it cannot", () => {
  const kept = withLibrary();
  put(
    kept,
    "design/sources/lucide-react.json",
    json(
      packaged({
        id: "lucide-react",
        module: "lucide-react",
        pin: { package: "lucide-react", version: "1.3.0" },
      }),
    ),
  );
  const there = JSON.parse(adopt(kept, "--dry-run", "--json").stdout);
  assert.equal(there.icon_sets, undefined);
  assert.equal(
    there.files.some((item) => item.path === "design/sources/lucide-react.json"),
    false,
  );
  assert.ok(
    there.kept.some(
      (item) =>
        item.id === "icon-set-source" && /lucide-react\.json is already there/.test(item.why),
    ),
  );
  // A row of another id that pins the same package is left as it is too.
  const other = withLibrary();
  put(
    other,
    ROW,
    json(packaged({ module: "lucide-react", pin: { package: "lucide-react", version: "1.3.0" } })),
  );
  const pinned = JSON.parse(adopt(other, "--dry-run", "--json").stdout);
  assert.equal(pinned.icon_sets, undefined);
  assert.ok(pinned.kept.some((item) => item.id === "icon-set-source"));

  // The lockfile does not pin the package the settings name.
  const unpinned = withLibrary();
  put(unpinned, "package-lock.json", LOCKFILE("1.3.0", "@other/thing"));
  const none = JSON.parse(adopt(unpinned, "--dry-run", "--json").stdout);
  assert.equal(none.icon_sets, undefined);
  assert.ok(
    none.person.some(
      (item) =>
        item.id === "icon-set-source" &&
        /components\.json names the icon set lucide, and package-lock\.json does not pin lucide-react/.test(
          item.why,
        ),
    ),
  );
  // A word of the settings this plugin does not know, or no lockfile this tool reads: the tool
  // cannot read it, says so, and leaves the person nothing new to answer.
  const unknown = withLibrary("seaglass", "seaglass-icons");
  const said = adopt(unknown, "--dry-run", "--json");
  const saidData = JSON.parse(said.stdout);
  assert.equal(saidData.icon_sets, undefined);
  assert.ok(
    saidData.unreadable.some(
      (item) =>
        item.id === "icon-set-source" &&
        /components\.json names the icon set seaglass, which this plugin cannot map to a package: a person writes the row with icon-source --package/.test(
          item.why,
        ),
    ),
  );
  assert.equal(
    saidData.person.some((item) => item.id.startsWith("icon-set")),
    false,
  );
  const unlocked = withLibrary();
  put(unlocked, "package-lock.json", "not json");
  const lockless = JSON.parse(adopt(unlocked, "--dry-run", "--json").stdout);
  assert.ok(
    lockless.unreadable.some(
      (item) =>
        item.id === "icon-set-source" &&
        /no lockfile this tool reads, so the version of lucide-react cannot be pinned/.test(
          item.why,
        ),
    ),
  );
  assert.equal(
    lockless.person.some((item) => item.id.startsWith("icon-set")),
    false,
  );
});

// ---- criterion 7: the gate holds the pin --------------------------------------------------------

test("changing the icon package's version in the lockfile turns the gate red, and the red line names the row", () => {
  const dir = adopted();
  put(dir, "package-lock.json", LOCKFILE());
  assert.equal(command(dir, "--package", PACKAGE).status, 1);
  // The command laid the check of the pin under the row that holds the ledgers' shapes.
  const shapes = read(dir, "design/theme.json").checks["ledger-shapes"];
  assert.ok(shapes.some((check) => check.kind === "icon-set-pin"));
  put(dir, ROW, json({ ...read(dir, ROW), licence: "ISC, read by the owner." }));
  const green = gate(dir);
  assert.equal(green.reached, "");
  assert.equal(green.status, 0, green.stdout + green.stderr);

  put(dir, "package-lock.json", LOCKFILE("2.5.0"));
  const red = gate(dir);
  assert.notEqual(red.status, 0);
  assert.match(
    red.stdout + red.stderr,
    /ledger-shapes: design\/sources\/quillmark-glyphs\.json pins @quillmark\/glyphs at 2\.4\.1, and package-lock\.json pins 2\.5\.0/,
  );
  // Taken out of the lockfile: red too.
  put(dir, "package-lock.json", LOCKFILE("2.4.1", "@other/thing"));
  assert.match(
    gate(dir).stdout + gate(dir).stderr,
    /quillmark-glyphs\.json pins @quillmark\/glyphs at 2\.4\.1, and package-lock\.json does not pin @quillmark\/glyphs/,
  );
});

test("a byte changed in a file of an icon set kept as files turns the pin check red, and the check is seen failing", () => {
  const dir = empty();
  for (const [file, bytes] of Object.entries(ICONS)) put(dir, file, bytes);
  put(dir, `${ledger.SOURCES_FOLDER}/harbor-icons.json`, json(filed()));
  put(
    dir,
    "design/theme.json",
    json({ checks: { "ledger-shapes": [{ kind: "shapes" }, ledger.ICON_SET_CHECK] } }),
  );
  const result = () => runChecks(readState(dir)).find((item) => item.id === "ledger-shapes");
  assert.equal(result().problem, null);
  assert.equal(result().seenFailing, true);
  put(dir, "src/icons/anchor.svg", `${ICONS["src/icons/anchor.svg"]} `);
  assert.match(
    result().problem,
    /design\/sources\/harbor-icons\.json: src\/icons\/anchor\.svg is not the file it was pinned with/,
  );
});

test("upgrade lays the check of the pin on a repository that has an icon set row and no such check", () => {
  const dir = adopted();
  put(dir, "package-lock.json", LOCKFILE());
  put(dir, ROW, json(packaged()));
  const preview = run(path.join(SCRIPTS, "upgrade.mjs"), "--target", dir, "--dry-run");
  assert.equal(preview.reached, "");
  assert.match(preview.stdout, /icon-set-pin/);
  assert.match(
    preview.stdout,
    /when the lockfile no longer pins an icon package at the version its row of the sources ledger pins/,
  );
});

test("adopt adds no check of the pin while an icon set row already pins what the lockfile no longer has, and says why", () => {
  const dir = withLibrary();
  put(
    dir,
    "design/sources/lucide-react.json",
    json(
      packaged({
        id: "lucide-react",
        module: "lucide-react",
        pin: { package: "lucide-react", version: "1.0.0" },
      }),
    ),
  );
  const data = JSON.parse(adopt(dir, "--dry-run", "--json").stdout);
  assert.ok(
    data.unreadable.some(
      (item) =>
        item.id === "ledger-shapes" &&
        /lucide-react\.json pins lucide-react at 1\.0\.0, and package-lock\.json pins 1\.3\.0/.test(
          item.why,
        ),
    ),
    JSON.stringify(data.unreadable),
  );
});

// ---- a repository whose installed tool predates the kind --------------------------------------

// The repository's copy of the tool made into one from before the kind: it gives the word no
// meaning, so its gate reads a row of the kind as a library, which must name a catalog.
function aged(dir) {
  const copy = path.join(dir, "tools/design-assembly");
  for (const name of readdirSync(copy)) {
    const file = path.join(copy, name);
    if (!name.endsWith(".mjs") || statSync(file).isDirectory()) continue;
    const before = readFileSync(file, "utf8");
    const after = before
      .replace(
        /export const isIconSet = \(source\) => isMap\(source\) && source\.kind === ICON_SET_KIND;/,
        "export const isIconSet = () => false;",
      )
      .replaceAll("ICON_SET_KIND", "UNKNOWN_KIND");
    if (after !== before) writeFileSync(file, after);
  }
}
// An adopted repository with its library's settings, its lockfile and an old copy of the tool; the
// settings name the icon set only after it was adopted, as a repository adopted long ago.
function adoptedLongAgo() {
  const dir = floor("harbor-ledger");
  put(
    dir,
    "package.json",
    json({ name: "harbor-ledger", dependencies: { "lucide-react": "^1.0.0" } }),
  );
  put(dir, "components.json", json({ style: "new-york", tailwind: { css: "src/index.css" } }));
  put(dir, "package-lock.json", LOCKFILE("1.3.0", "lucide-react"));
  for (let round = 0; round < 2; round += 1) {
    const done = adopt(dir, "--product-type", "application");
    assert.ok([0, 1].includes(done.status), done.stderr);
  }
  aged(dir);
  put(
    dir,
    "components.json",
    json({ style: "new-york", tailwind: { css: "src/index.css" }, iconLibrary: "lucide" }),
  );
  return dir;
}

test("on a repository whose installed tool predates the kind, adopt writes no icon set row, names the upgrade step, and its gate stays as it was", () => {
  const dir = adoptedLongAgo();
  const before = gate(dir);
  assert.equal(before.status, 0, before.stdout + before.stderr);
  const theme = text(dir, "design/theme.json");

  const preview = JSON.parse(adopt(dir, "--dry-run", "--json").stdout);
  assert.equal(preview.icon_sets, undefined);
  const step = preview.person.find((item) => item.id === "icon-set-source");
  assert.ok(step, JSON.stringify(preview.person));
  assert.match(
    step.why,
    /components\.json names the icon set lucide, and the repository's copy of the tool, tools\/design-assembly, predates the kind icon-set, so its gate would read the row as broken: bring the tool up with upgrade first, then run adopt again; it would then propose design\/sources\/lucide-react\.json, the package lucide-react at 1\.3\.0, as the lockfile pins it/,
  );

  const done = adopt(dir);
  assert.ok([0, 1].includes(done.status), done.stderr);
  assert.equal(existsSync(path.join(dir, "design/sources/lucide-react.json")), false);
  assert.equal(
    text(dir, "design/theme.json"),
    theme,
    "a check the old tool does not know was laid",
  );
  const after = gate(dir);
  assert.equal(after.status, before.status, after.stdout + after.stderr);

  // The command says the same, and writes nothing.
  const refused = command(dir, "--package", "lucide-react");
  assert.equal(refused.status, 2);
  assert.match(
    refused.stderr,
    /predates the kind icon-set, so its gate would read the row as broken: bring the tool up with upgrade first/,
  );
  assert.match(refused.stderr, /Nothing was written/);
  assert.equal(existsSync(path.join(dir, "design/sources/lucide-react.json")), false);
});

// ---- criterion 21: the names are the repository's data -----------------------------------------

test("the plugin names no icon package of these tests: what the command writes comes from the repository", () => {
  const plain = ["scripts", "templates", "references", "skills", "hooks"];
  const walk = (folder) =>
    readdirSync(folder).flatMap((name) => {
      const full = path.join(folder, name);
      return statSync(full).isDirectory() ? walk(full) : [full];
    });
  for (const folder of plain) {
    for (const file of walk(path.join(PLUGIN, folder))) {
      const words = readFileSync(file, "utf8");
      for (const made of ["quillmark", "harbor", "seaglass"]) {
        assert.equal(words.toLowerCase().includes(made), false, `${file} names ${made}`);
      }
    }
  }
});
