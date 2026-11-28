// Three rules the owner gave for the brand assets (spec 0017 as amended, decision 0134, item 12.3):
// which icon set the product takes is the owner's call, asked when a row is written for a set
// nobody chose and held by the wall; a mark built in the repository, from a package a plug left, is
// the repository's asset as its code is, so its row waits on no sentence of a person; and an icon
// set that is an outside package is used under the licence that package itself declares, read from
// the installed package. What is brought from outside still waits on a person's sentence. No command
// reaches the network, and the made-up names are only data of these tests.
import "./helpers/own-cores.mjs";
import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import path from "node:path";
import { env, execPath } from "node:process";
import { after, test } from "node:test";
import { pathToFileURL } from "node:url";

import { brandAssets } from "../scripts/brand-assets.mjs";
import { shapeProblems } from "../templates/tools/design-assembly/contract.mjs";
import * as calls from "../templates/tools/design-assembly/owner-calls.mjs";
import * as ledger from "../templates/tools/design-assembly/sources-ledger.mjs";
import * as waiting from "../templates/tools/design-assembly/waiting.mjs";

import {
  adopted,
  cleanup,
  empty,
  floor,
  json,
  listIn,
  OWNER,
  PLUGIN,
  put,
  read,
  ROOT,
  SCRIPTS,
  sha,
  snapshot,
  text,
} from "./helpers/core-family.mjs";

after(cleanup);

const NO_NETWORK = path.join(PLUGIN, "tests/helpers/no-network.mjs");
const RELEASES = JSON.parse(text(PLUGIN, "references/releases.json")).releases;
const said = (done) => done.stdout + done.stderr;
// Every command of these tests runs with the network unreachable, and says what it reached for.
const reached = [];
function run(file, ...args) {
  const log = path.join(empty(), "reached.log");
  const result = spawnSync(execPath, ["--import", NO_NETWORK, file, ...args], {
    encoding: "utf8",
    env: { ...env, DESIGN_ASSEMBLY_NETWORK_LOG: log, DESIGN_ASSEMBLY_CORES: listIn() },
  });
  if (existsSync(log)) reached.push(`${path.basename(file)}: ${readFileSync(log, "utf8")}`);
  return result;
}
const ON = "2026-11-28";
const iconSource = (dir, ...args) =>
  run(path.join(SCRIPTS, "icon-source.mjs"), "--target", dir, "--on", ON, ...args);
const logoSource = (dir, ...args) =>
  run(path.join(SCRIPTS, "logo-source.mjs"), "--target", dir, "--on", ON, ...args);
const decide = (dir, ...args) => run(path.join(SCRIPTS, "decide.mjs"), "--target", dir, ...args);
const adopt = (dir, ...args) =>
  run(path.join(SCRIPTS, "adopt.mjs"), "--target", dir, "--conformance-level", "AA", ...args);
const gate = (dir) => run(path.join(dir, "tools/design-assembly/check.mjs"), "--target", dir);
const git = (dir, ...args) => {
  const done = spawnSync("git", ["-C", dir, ...args], { encoding: "utf8" });
  assert.equal(done.status, 0, `git ${args.join(" ")}: ${done.stderr}`);
  return done.stdout;
};
// The files of a folder as they are, the folders themselves and what is installed left out.
const files = (dir) =>
  snapshot(dir).filter((line) => !line.endsWith("/") && !line.startsWith("node_modules/"));

// ---- a made-up icon package, a made-up mark ------------------------------------------------------

const ICONS = "@quillmark/glyphs";
const ICONS_ID = "quillmark-glyphs";
const ICONS_ROW = `${ledger.SOURCES_FOLDER}/${ICONS_ID}.json`;
const ICONS_ITEM = `icon-set:${ICONS_ID}`;
const ICONS_QUESTION = `${waiting.WAITING_FOLDER}/icon-set-${ICONS_ID}.json`;
const INSTALLED = `node_modules/${ICONS}/package.json`;
const lockfile = (dir, version = "2.4.1", license = "ISC") =>
  put(
    dir,
    "package-lock.json",
    json({
      name: "harbor-ledger",
      lockfileVersion: 3,
      packages: {
        "": { name: "harbor-ledger" },
        [`node_modules/${ICONS}`]: { version, ...(license ? { license } : {}) },
      },
    }),
  );
// The package as it is installed: its own file says its name, its version and its licence.
const install = (dir, more = { license: "ISC" }, version = "2.4.1") =>
  put(dir, INSTALLED, json({ name: ICONS, version, ...more }));
// A repository whose lockfile pins the package, with the package installed where given.
function withIcons({ installed = { license: "ISC" }, make = floor } = {}) {
  const dir = make === floor ? floor("harbor-ledger") : make();
  lockfile(dir);
  if (installed) install(dir, installed);
  return dir;
}
// The owner's answer about the icon set, as the decision sheet writes it back.
const answered = (dir, answer = "keep", more = {}) =>
  put(
    dir,
    ICONS_QUESTION,
    json({
      id: `icon-set-${ICONS_ID}`,
      question: `Does the product take the icon set ${ICONS}?`,
      recommendation: `Keep ${ICONS}.`,
      basis: "The owner was asked before the row was written.",
      hard_to_undo: true,
      item: ICONS_ITEM,
      asked_on: "2026-11-27",
      answer,
      by: OWNER,
      on: ON,
      ...more,
    }),
  );
const questions = (dir) =>
  existsSync(path.join(dir, waiting.WAITING_FOLDER))
    ? readdirSync(path.join(dir, waiting.WAITING_FOLDER)).sort()
    : [];

const PRODUCT = "Moss Heron";
const MARK_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><circle cx="16" cy="16" r="14" fill="#1f7a5c"/></svg>\n`;
const MONO_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><circle cx="16" cy="16" r="14"/></svg>\n`;
const MARK_PACKAGE = "design/brand/heron";
const MARK_ROW = "design/sources/logo.json";
const MANIFEST = {
  version: 1,
  kind: "logo-package",
  made: { by: "logo-design", on: "2026-11-27" },
  title: PRODUCT,
  idea: "A pond seen from above.",
  palette: [{ name: "pond", value: "#1f7a5c" }],
  build: { grid: 32, radius: 14 },
  files: [
    { file: "heron-mark.svg", sha256: sha(MARK_SVG), role: "mark", variant: "color" },
    { file: "heron-mono.svg", sha256: sha(MONO_SVG), role: "mark", variant: "mono" },
  ],
};
// The package a plug left in the repository: its two files and its manifest.
function leavePackage(dir) {
  put(dir, `${MARK_PACKAGE}/heron-mark.svg`, MARK_SVG);
  put(dir, `${MARK_PACKAGE}/heron-mono.svg`, MONO_SVG);
  put(dir, `${MARK_PACKAGE}/manifest.json`, json(MANIFEST));
  return dir;
}
// The owner's answer that keeps the mark, as the decision sheet writes it back.
const markKept = (dir) =>
  put(
    dir,
    `${waiting.WAITING_FOLDER}/mark-heron.json`,
    json({
      id: "mark-heron",
      question: "Which mark does the product take?",
      item: "logo:logo",
      asked_on: "2026-11-27",
      answer: "keep",
      by: OWNER,
      on: ON,
    }),
  );
// A logo row as the package path writes it.
const builtRow = (more = {}) => ({
  version: 1,
  id: "logo",
  kind: "logo",
  title: PRODUCT,
  pin: {
    files: [
      {
        file: `${MARK_PACKAGE}/heron-mark.svg`,
        sha256: sha(MARK_SVG),
        role: "mark",
        variant: "color",
      },
      {
        file: `${MARK_PACKAGE}/heron-mono.svg`,
        sha256: sha(MONO_SVG),
        role: "mark",
        variant: "mono",
      },
    ],
  },
  made: { by: "logo-design", on: "2026-11-27" },
  licence: ledger.REPOSITORY_ASSET_LICENCE,
  licence_from: { rule: "repository-asset" },
  proposed: { by: "logo-source", on: ON },
  ...more,
});

// A repository on git, its main branch with a decision ledger, and a branch made from it.
function onGit(dir = empty()) {
  git(dir, "init", "-q", "-b", "main");
  git(dir, "config", "user.name", "Test Person");
  git(dir, "config", "user.email", "test@example.com");
  if (!existsSync(path.join(dir, "design/decisions.yaml"))) {
    put(dir, "design/decisions.yaml", "version: 1\ndecisions: []\n");
    put(dir, "src/index.css", ":root {\n  --primary: oklch(0.5 0.1 160);\n}\n");
  }
  put(dir, ".gitignore", "node_modules/\n");
  git(dir, "add", "-A");
  git(dir, "commit", "-q", "-m", "start");
  git(dir, "checkout", "-q", "-b", "feature");
  return dir;
}
const WHERE = {
  pages: "design/patterns",
  stylesheet: "src/index.css",
  ledger: "design/decisions.yaml",
};
const listOf = (dir, reader = waiting) => ({ rows: reader.readWaiting(dir)?.rows ?? [] });
const wall = (dir) =>
  calls.wallProblem({ branch: calls.branchFacts(dir, WHERE), waiting: listOf(dir) });
// A row of an icon set that is a package, as a person finished it.
const iconRow = (more = {}) => ({
  version: 1,
  id: ICONS_ID,
  kind: "icon-set",
  title: ICONS,
  module: ICONS,
  pin: { package: ICONS, version: "2.4.1" },
  licence: "ISC, as the owner read it in the package.",
  ...more,
});

// ---- rule 3: an outside package is used under the licence it declares ---------------------------

test("icon-source writes the licence the installed package declares into the row, and the row says where it came from", () => {
  const dir = withIcons();
  const done = iconSource(dir, "--package", ICONS);
  assert.ok([0, 1].includes(done.status), said(done));
  const row = read(dir, ICONS_ROW);
  assert.equal(row.licence, "ISC");
  assert.deepEqual(row.licence_from, { package: ICONS, version: "2.4.1", file: INSTALLED });
  assert.deepEqual(row.proposed, { by: "icon-source", on: ON });
  assert.deepEqual(shapeProblems("sources", text(dir, ICONS_ROW), ICONS_ROW), []);
  // The row is whole: nothing waits on a person's sentence.
  const [set] = ledger.readIconSets(dir);
  assert.equal(set.held, true);
  assert.equal(set.waits, null);
  assert.equal(set.licence, "ISC");
  assert.match(
    done.stdout,
    /^licence: ISC, as the package @quillmark\/glyphs declares it at 2\.4\.1 \(node_modules\/@quillmark\/glyphs\/package\.json\)/m,
  );
  assert.doesNotMatch(done.stdout, /write the licence the icon set is used under/);
  const data = JSON.parse(
    iconSource(withIcons(), "--package", ICONS, "--dry-run", "--json").stdout,
  );
  assert.equal(data.icon_set.licence, "ISC");
  assert.equal(data.next, null);
});

test("a package that declares no licence, or is not installed, leaves the row proposed and waiting on a person's sentence", () => {
  for (const [why, make, says] of [
    ["not installed", () => withIcons({ installed: null }), /is not installed here/],
    ["no licence declared", () => withIcons({ installed: {} }), /declares no licence/],
    [
      "declares that it grants none",
      () => withIcons({ installed: { license: "UNLICENSED" } }),
      /declares no licence/,
    ],
    [
      "points at a file",
      () => withIcons({ installed: { license: "SEE LICENSE IN LICENSE.md" } }),
      /points at a file/,
    ],
    [
      "written another way than one text",
      () => withIcons({ installed: { license: { type: "ISC" } } }),
      /declares no licence/,
    ],
    [
      "installed at another version than the lockfile pins",
      () => {
        const dir = withIcons({ installed: null });
        install(dir, { license: "ISC" }, "2.5.0");
        return dir;
      },
      /is installed at 2\.5\.0, and package-lock\.json pins 2\.4\.1/,
    ],
    [
      "the lockfile states another licence",
      () => {
        const dir = withIcons();
        lockfile(dir, "2.4.1", "MIT");
        return dir;
      },
      /package-lock\.json says it states MIT/,
    ],
    [
      "the installed folder is another package",
      () => {
        const dir = withIcons({ installed: null });
        put(dir, INSTALLED, json({ name: "@other/thing", version: "2.4.1", license: "ISC" }));
        return dir;
      },
      /is not the package/,
    ],
  ]) {
    const dir = make();
    const done = iconSource(dir, "--package", ICONS);
    assert.equal(done.status, 1, `${why}: ${said(done)}`);
    const row = read(dir, ICONS_ROW);
    assert.equal(row.licence, undefined, why);
    assert.equal(row.licence_from, undefined, why);
    assert.deepEqual(row.proposed, { by: "icon-source", on: ON }, why);
    assert.match(done.stdout, says, why);
    assert.match(
      done.stdout,
      /^next: write the licence the icon set is used under into licence of design\/sources\/quillmark-glyphs\.json/m,
      why,
    );
    const [set] = ledger.readIconSets(dir);
    assert.equal(set.held, false, why);
    assert.match(set.waits, /has no licence yet/, why);
  }
});

test("a folder of the repository's own icons still waits on a person's sentence", () => {
  const dir = floor("harbor-ledger");
  put(dir, "src/icons/anchor.svg", "<svg/>\n");
  const done = iconSource(dir, "--folder", "src/icons");
  assert.equal(done.status, 1, said(done));
  const row = read(dir, `${ledger.SOURCES_FOLDER}/icons.json`);
  assert.equal(row.licence, undefined);
  assert.equal(row.licence_from, undefined);
  assert.match(done.stdout, /^next: write the licence the icon set is used under/m);
});

test("the gate holds that a licence said to come from a package comes from the package the row pins", () => {
  const from = { package: ICONS, version: "2.4.1", file: INSTALLED };
  const shape = (row) => shapeProblems("sources", json(row), ICONS_ROW).join("\n");
  assert.equal(shape(iconRow({ licence: "ISC", licence_from: from })), "");
  assert.match(
    shape(iconRow({ licence: "ISC", licence_from: { ...from, package: "@other/thing" } })),
    /quillmark-glyphs\.json says its licence comes from the package @other\/thing, and its pin is the package @quillmark\/glyphs/,
  );
  // A licence read at one version is not the licence of another: once the row pins a newer
  // version, the licence is read again.
  assert.match(
    shape(
      iconRow({
        pin: { package: ICONS, version: "3.0.0" },
        licence: "ISC",
        licence_from: from,
      }),
    ),
    /quillmark-glyphs\.json pins @quillmark\/glyphs at 3\.0\.0, and its licence was read from the package at 2\.4\.1/,
  );
  // A row of the repository's own files has no package to take a licence from.
  const filed = {
    version: 1,
    id: ICONS_ID,
    kind: "icon-set",
    folder: "src/icons",
    pin: { files: [{ file: "src/icons/anchor.svg", sha256: sha("<svg/>\n") }] },
    licence: "ISC",
    licence_from: from,
  };
  assert.match(shape(filed), /says its licence comes from the package/);
  // And a licence said to come from somewhere is there.
  assert.match(
    shape(iconRow({ licence: undefined, licence_from: from, proposed: { by: "x", on: ON } })),
    /says where its licence comes from and has no licence/,
  );
  // The ledger stays at version 1, and the contract says the key.
  assert.equal(ledger.SOURCES_VERSION, 1);
  const contract = text(PLUGIN, "references/contract.md");
  assert.match(contract, /`licence_from`/);
});

test("adopt proposes the repository's own icon set with the licence its installed package declares, and asks no licence of a person", () => {
  const dir = floor("harbor-ledger");
  put(dir, "package.json", json({ name: "harbor-ledger", dependencies: { [ICONS]: "^2.0.0" } }));
  // The settings of the component library name a set by a word the plugin knows; the package it
  // maps to is the plugin's data, so this test installs that one.
  put(
    dir,
    "components.json",
    json({ style: "new-york", tailwind: { css: "src/index.css" }, iconLibrary: "lucide" }),
  );
  const name = "lucide-react";
  put(
    dir,
    "package-lock.json",
    json({
      name: "harbor-ledger",
      lockfileVersion: 3,
      packages: {
        "": { name: "harbor-ledger" },
        [`node_modules/${name}`]: { version: "1.3.0", license: "ISC" },
      },
    }),
  );
  put(dir, `node_modules/${name}/package.json`, json({ name, version: "1.3.0", license: "ISC" }));
  const preview = JSON.parse(adopt(dir, "--dry-run", "--json").stdout);
  assert.equal(
    preview.person.some((item) => item.id === "icon-set-licence"),
    false,
    "adopt asks a person for a licence the package declares",
  );
  const done = adopt(dir);
  assert.ok([0, 1].includes(done.status), said(done));
  const row = read(dir, `${ledger.SOURCES_FOLDER}/${name}.json`);
  assert.equal(row.licence, "ISC");
  assert.deepEqual(row.licence_from, {
    package: name,
    version: "1.3.0",
    file: `node_modules/${name}/package.json`,
  });
  assert.equal(row.own, true);
});

// ---- rule 2: a mark built in the repository is the repository's asset ---------------------------

test("logo-source --package writes the row's licence by the rule, says so in the row, and waits on no sentence of a person", () => {
  assert.match(String(ledger.REPOSITORY_ASSET_LICENCE), /\S/);
  const dir = leavePackage(adopted());
  markKept(dir);
  const done = logoSource(dir, "--package", MARK_PACKAGE);
  // The owner chose the mark and the licence is the rule's: nothing waits on a person.
  assert.equal(done.status, 0, said(done));
  assert.deepEqual(read(dir, MARK_ROW), builtRow());
  assert.deepEqual(shapeProblems("sources", text(dir, MARK_ROW), MARK_ROW), []);
  const [mark] = ledger.readLogoSources(dir);
  assert.equal(mark.held, true);
  assert.equal(mark.waits, null);
  assert.match(
    done.stdout,
    /^licence: by the rule for a mark built in the repository, not a person's sentence: /m,
  );
  assert.doesNotMatch(done.stdout, /write who holds the right to use the mark/);
  assert.match(done.stdout, new RegExp(`chosen: by ${OWNER} on ${ON}, in mark-heron`));
  // Status asks no licence of the mark.
  const status = run(path.join(SCRIPTS, "status.mjs"), "--target", dir, "--json");
  assert.equal(
    JSON.parse(status.stdout).waiting.some((item) => item.id === "logo-licence-logo"),
    false,
  );
});

test("without the owner's choice, the row written from a package still names the owner's call as the next step, and nothing about a licence", () => {
  const dir = leavePackage(adopted());
  const done = logoSource(dir, "--package", MARK_PACKAGE);
  assert.equal(done.status, 1, said(done));
  assert.equal(read(dir, MARK_ROW).licence, ledger.REPOSITORY_ASSET_LICENCE);
  assert.match(
    done.stdout,
    /^next: a new mark, or a changed file of one, is the owner's call: ask with decide --ask --item logo:logo/m,
  );
  assert.doesNotMatch(done.stdout, /write who holds the right to use the mark/);
});

test("a mark brought in from files the repository already keeps still waits on a person's sentence", () => {
  const dir = adopted();
  put(dir, "public/brand/mark.svg", MARK_SVG);
  const done = logoSource(dir, "--file", "public/brand/mark.svg:mark:color");
  assert.equal(done.status, 1, said(done));
  const row = read(dir, MARK_ROW);
  assert.equal(row.licence, undefined);
  assert.equal(row.licence_from, undefined);
  assert.match(
    done.stdout,
    /^next: write who holds the right to use the mark, and where it may be used, into licence of design\/sources\/logo\.json/m,
  );
  const [mark] = ledger.readLogoSources(dir);
  assert.equal(mark.held, false);
  assert.match(mark.waits, /no licence yet/);
});

test("the gate holds that only a row of a mark made in the repository carries the rule's licence, in the rule's words", () => {
  const shape = (row) => shapeProblems("sources", json(row), MARK_ROW).join("\n");
  assert.equal(shape(builtRow()), "");
  // A row that names no maker was not written from a package: the rule is not its licence.
  assert.match(
    shape(builtRow({ made: undefined })),
    /logo\.json says its licence comes from the rule for a mark built in the repository, and names no maker/,
  );
  // A person's own words are a person's sentence: the row no longer says the rule wrote them.
  assert.match(
    shape(builtRow({ licence: "Ours, everywhere." })),
    /logo\.json says its licence comes from the rule for a mark built in the repository, and its licence is not the rule's/,
  );
  assert.match(shape(builtRow({ licence_from: { rule: "some-other-rule" } })), /licence_from/);
  // A row a person finished in their own words reads as before.
  assert.equal(shape(builtRow({ licence: "Ours, everywhere.", licence_from: undefined })), "");
});

test("from the package to the gate: the owner keeps the mark, the row is written with no sentence of a person, and the gate is green", () => {
  const dir = onGit(adopted());
  assert.equal(gate(dir).status, 0);
  leavePackage(dir);
  markKept(dir);
  const done = logoSource(dir, "--package", MARK_PACKAGE);
  assert.equal(done.status, 0, said(done));
  const checked = gate(dir);
  assert.equal(checked.status, 0, said(checked));
});

// ---- rule 1: which icon set the product takes is the owner's call -------------------------------

test("the waiting list takes the item icon-set:<id>, and it is the owner's call", () => {
  assert.equal(waiting.itemProblem(ICONS_ITEM), null);
  assert.equal(waiting.mustAsk(ICONS_ITEM), true);
  assert.notEqual(waiting.itemProblem("icon-set:Not An Id"), null);
  assert.equal(waiting.iconSetItem?.(ICONS_ID), ICONS_ITEM);
  const dir = adopted();
  const done = decide(
    dir,
    "--ask",
    "Which icon set does the product take?",
    "--item",
    ICONS_ITEM,
    "--recommend",
    "the set the starter pieces import",
    "--because",
    "one set in the repository, not two",
    "--hard-to-undo",
  );
  assert.ok([0, 1].includes(done.status), said(done));
  assert.match(
    done.stdout,
    /stop: icon-set:quillmark-glyphs is the owner's call\. Do not build on it until the owner keeps it here/,
  );
});

test("icon-source puts one question for the owner on the waiting list when it writes the row of a set nobody chose", () => {
  const dir = withIcons();
  const before = files(dir);
  const preview = iconSource(dir, "--package", ICONS, "--dry-run");
  assert.match(preview.stdout, /create +design\/waiting\/icon-set-quillmark-glyphs\.json/);
  assert.deepEqual(files(dir), before, "the preview wrote something");

  const done = iconSource(dir, "--package", ICONS);
  // The licence is the package's own, and still the command ends with work: the owner is asked.
  assert.equal(done.status, 1, said(done));
  assert.deepEqual(questions(dir), [`icon-set-${ICONS_ID}.json`]);
  const asked = read(dir, ICONS_QUESTION);
  assert.equal(asked.item, ICONS_ITEM);
  assert.equal(asked.asked_on, ON);
  assert.equal(asked.answer, undefined);
  assert.equal(asked.hard_to_undo, true);
  assert.match(asked.question, /@quillmark\/glyphs/);
  assert.match(asked.basis, /design\/sources\/quillmark-glyphs\.json/);
  // The question reads as any question of the waiting list does.
  assert.deepEqual(
    waiting.readWaiting(dir).rows.map((row) => row.item),
    [ICONS_ITEM],
  );
  assert.match(
    done.stdout,
    /^owner: asked in design\/waiting\/icon-set-quillmark-glyphs\.json: which icon set the product takes is the owner's call\. Stop, and build on it once the owner keeps it/m,
  );
  const data = JSON.parse(
    iconSource(withIcons(), "--package", ICONS, "--dry-run", "--json").stdout,
  );
  assert.deepEqual(data.owner, {
    item: ICONS_ITEM,
    asked: { id: `icon-set-${ICONS_ID}`, file: ICONS_QUESTION },
    waits: null,
    chosen: null,
  });
});

test("when the owner kept the set before the row was written, nothing is asked, and the command says who chose it", () => {
  const dir = withIcons();
  answered(dir);
  const kept = text(dir, ICONS_QUESTION);
  const done = iconSource(dir, "--package", ICONS);
  // Chosen by the owner, licensed by its package: nothing is left for a person.
  assert.equal(done.status, 0, said(done));
  assert.deepEqual(questions(dir), [`icon-set-${ICONS_ID}.json`]);
  assert.equal(text(dir, ICONS_QUESTION), kept);
  assert.match(
    done.stdout,
    new RegExp(`^chosen: by ${OWNER} on ${ON}, in icon-set-${ICONS_ID} of the waiting list`, "m"),
  );
  assert.doesNotMatch(done.stdout, /^owner: asked/m);
});

test("a set the owner refused, or answered in other words, gets no row", () => {
  for (const [answer, more, says] of [
    ["refuse", { said: "not this one" }, /the owner refused icon-set:quillmark-glyphs/],
    [
      "value",
      { said: "the set with filled shapes" },
      /answered icon-set:quillmark-glyphs .*in their own words/,
    ],
  ]) {
    const dir = withIcons();
    answered(dir, answer, more);
    const before = files(dir);
    const done = iconSource(dir, "--package", ICONS);
    assert.equal(done.status, 2, said(done));
    assert.match(done.stderr, says);
    assert.match(done.stderr, /Nothing was written/);
    assert.deepEqual(files(dir), before);
  }
});

test("a question that waits already is not asked twice", () => {
  const dir = withIcons();
  answered(dir, undefined, { answer: undefined, by: undefined, on: undefined });
  const kept = text(dir, ICONS_QUESTION);
  const done = iconSource(dir, "--package", ICONS);
  assert.equal(done.status, 1, said(done));
  assert.equal(existsSync(path.join(dir, ICONS_ROW)), true);
  assert.deepEqual(questions(dir), [`icon-set-${ICONS_ID}.json`]);
  assert.equal(text(dir, ICONS_QUESTION), kept);
  assert.match(
    done.stdout,
    /^owner: icon-set:quillmark-glyphs is asked already in icon-set-quillmark-glyphs, which waits on the owner/m,
  );
});

test("the row of a folder of drawn icons, written new, asks the owner too", () => {
  const dir = withIcons({ make: adopted });
  put(dir, ICONS_ROW, json(iconRow()));
  put(dir, `node_modules/${ICONS}/dist/anchor.js`, "export const Anchor = 1;\n");
  put(dir, "src/icons/seal-check.svg", "<svg/>\n");
  const done = iconSource(
    dir,
    "--draw",
    "src/icons/seal-check.svg",
    "--need",
    "seal-check",
    "--why",
    "The pinned set has no seal with a check.",
  );
  assert.equal(done.status, 1, said(done));
  assert.equal(read(dir, `${ledger.SOURCES_FOLDER}/icons.json`).folder, "src/icons");
  assert.deepEqual(questions(dir), ["icon-set-icons.json"]);
  assert.equal(read(dir, `${waiting.WAITING_FOLDER}/icon-set-icons.json`).item, "icon-set:icons");
  // A second drawn icon joins the row, and asks nothing more.
  put(dir, "src/icons/wave-split.svg", "<svg/>\n");
  iconSource(dir, "--draw", "src/icons/wave-split.svg", "--need", "wave-split", "--why", "None.");
  assert.deepEqual(questions(dir), ["icon-set-icons.json"]);
});

test("a branch that adds an icon set row is red at the wall until the owner keeps icon-set:<id>", () => {
  const dir = onGit();
  assert.equal(wall(dir), null);
  put(dir, ICONS_ROW, json(iconRow()));
  assert.match(
    wall(dir),
    /icon-set:quillmark-glyphs: a new icon set \(design\/sources\/quillmark-glyphs\.json\) is the owner's call, and the waiting list holds no answer for it: ask with decide --ask --item icon-set:quillmark-glyphs, and build on it once the owner keeps it/,
  );
  answered(dir, undefined, { answer: undefined, by: undefined, on: undefined });
  assert.match(wall(dir), /icon-set-quillmark-glyphs waits on the owner's answer/);
  answered(dir, "refuse");
  assert.match(
    wall(dir),
    /icon-set:quillmark-glyphs: .* the owner refused in icon-set-quillmark-glyphs/,
  );
  answered(dir, "value", { said: "the set with filled shapes" });
  assert.match(wall(dir), /the owner answered otherwise in icon-set-quillmark-glyphs/);
  answered(dir);
  assert.equal(wall(dir), null);
});

test("a row that was on the main branch is not asked for; a version, a licence, sizes or a drawn file ask nothing, and another set under the same row does", () => {
  const dir = empty();
  put(dir, "design/decisions.yaml", "version: 1\ndecisions: []\n");
  put(dir, "src/index.css", ":root {\n  --primary: oklch(0.5 0.1 160);\n}\n");
  // Rows written before this version of the plugin: one held, one still proposed.
  put(dir, ICONS_ROW, json(iconRow()));
  const OWN = `${ledger.SOURCES_FOLDER}/icons.json`;
  const own = {
    version: 1,
    id: "icons",
    kind: "icon-set",
    folder: "src/icons",
    pin: { files: [{ file: "src/icons/anchor.svg", sha256: sha("<svg/>\n") }] },
    proposed: { by: "icon-source", on: "2026-11-26" },
  };
  put(dir, OWN, json(own));
  onGit(dir);
  assert.equal(wall(dir), null);
  assert.deepEqual(calls.ownersItems(calls.branchFacts(dir, WHERE)), []);
  put(
    dir,
    ICONS_ROW,
    json(
      iconRow({
        pin: { package: ICONS, version: "2.5.0" },
        licence: "ISC, read again.",
        sizes: [16, 20],
      }),
    ),
  );
  put(
    dir,
    OWN,
    json({
      ...own,
      pin: { files: [...own.pin.files, { file: "src/icons/seal.svg", sha256: sha("<svg/>") }] },
      drawn: [{ file: "src/icons/seal.svg", need: "seal", why: "The set has none." }],
    }),
  );
  assert.equal(wall(dir), null);
  // Another package under the row's id is another set: the owner's call.
  put(
    dir,
    ICONS_ROW,
    json(iconRow({ module: "@other/glyphs", pin: { package: "@other/glyphs", version: "1.0.0" } })),
  );
  assert.match(wall(dir), /icon-set:quillmark-glyphs: a new icon set/);
  // And so is another folder.
  put(dir, ICONS_ROW, json(iconRow()));
  put(dir, OWN, json({ ...own, folder: "src/glyphs" }));
  assert.match(wall(dir), /icon-set:icons: a new icon set/);
});

test("from the row to the gate: a branch that writes the row of a set nobody chose is red until the owner keeps it on the decision sheet", () => {
  const dir = onGit(adopted());
  assert.equal(gate(dir).status, 0);
  lockfile(dir);
  install(dir);
  const written = iconSource(dir, "--package", ICONS);
  assert.equal(written.status, 1, said(written));
  const held = gate(dir);
  assert.equal(held.status, 1, said(held));
  assert.match(
    said(held),
    /icon-set:quillmark-glyphs: a new icon set \(design\/sources\/quillmark-glyphs\.json\) is the owner's call; icon-set-quillmark-glyphs waits on the owner's answer/,
  );
  const answers = path.join(empty(), "answers.txt");
  writeFileSync(answers, `icon-set-${ICONS_ID} keep\n`);
  const kept = decide(dir, "--answers", answers, "--by", OWNER, "--on", ON);
  assert.ok([0, 1].includes(kept.status), said(kept));
  const open = gate(dir);
  assert.equal(open.status, 0, said(open));
  // The row carries the package's own licence with where it came from, and is held.
  const [set] = ledger.readIconSets(dir);
  assert.equal(set.held, true);
});

test("a repository with no row of either kind is asked nothing: the wall names no item, and no question is written", () => {
  const dir = onGit(adopted());
  const before = files(dir);
  assert.deepEqual(calls.ownersItems(calls.branchFacts(dir, WHERE)), []);
  assert.equal(gate(dir).status, 0);
  // Saying which set is recommended writes nothing and asks nothing.
  iconSource(dir);
  assert.deepEqual(files(dir), before);
  assert.deepEqual(questions(dir), []);
});

// ---- the tool a repository installed before this version ----------------------------------------

const OLDER = RELEASES.find((release) => release.version === "0.78.0");
// The tool of 0.78.0, taken from the tree of git the plugin's list of releases records for it.
function olderTool(into) {
  mkdirSync(into, { recursive: true });
  const archive = execFileSync("git", ["-C", ROOT, "archive", OLDER.tool], {
    maxBuffer: 1 << 30,
  });
  execFileSync("tar", ["-x", "-C", into], { input: archive });
  return into;
}
function withOlderTool(dir) {
  rmSync(path.join(dir, "tools/design-assembly"), { recursive: true });
  olderTool(path.join(dir, "tools/design-assembly"));
  put(dir, "design/tool-stamp.json", json({ version: OLDER.version, tree: OLDER.tool }));
  return dir;
}

test("on a repository whose installed tool of 0.78.0 predates the item, icon-source and decide write nothing and name upgrade first, and the gate stays green", () => {
  const dir = withOlderTool(withIcons({ make: adopted }));
  const green = gate(dir);
  assert.equal(green.status, 0, said(green));
  const before = files(dir);
  for (const done of [
    iconSource(dir, "--package", ICONS),
    decide(
      dir,
      "--ask",
      "Which icon set?",
      "--item",
      ICONS_ITEM,
      "--recommend",
      "this one",
      "--because",
      "it is pinned",
      "--hard-to-undo",
    ),
  ]) {
    assert.equal(done.status, 2, said(done));
    assert.match(
      done.stderr,
      /predates the item icon-set:<id> of the waiting list, so its gate would read the question as broken: bring the tool up with upgrade first/,
    );
    assert.match(done.stderr, /Nothing was written/);
  }
  assert.deepEqual(files(dir), before);
  assert.equal(gate(dir).status, 0);
});

test("the tool of 0.78.0 reads a row that says where its licence came from as a held row", async () => {
  const old = olderTool(path.join(empty(), "tool"));
  const before = await import(pathToFileURL(path.join(old, "contract.mjs")).href);
  const from = { package: ICONS, version: "2.4.1", file: INSTALLED };
  assert.deepEqual(
    before.shapeProblems(
      "sources",
      json(iconRow({ licence: "ISC", licence_from: from })),
      ICONS_ROW,
    ),
    [],
  );
  assert.deepEqual(before.shapeProblems("sources", json(builtRow()), MARK_ROW), []);
});

test("the wall reads a kind of screen, the brand colour and a mark exactly as the tool of 0.78.0 did", async () => {
  const old = olderTool(path.join(empty(), "tool"));
  const before = {
    calls: await import(pathToFileURL(path.join(old, "owner-calls.mjs")).href),
    waiting: await import(pathToFileURL(path.join(old, "waiting.mjs")).href),
  };
  const dir = onGit();
  put(dir, "design/patterns/board.md", "# Board\n");
  put(dir, "design/patterns/inbox.md", "# Inbox\n");
  put(dir, "src/index.css", ":root {\n  --primary: oklch(0.6 0.2 30);\n}\n");
  put(dir, "public/brand/mark.svg", MARK_SVG);
  put(
    dir,
    MARK_ROW,
    json({
      version: 1,
      id: "logo",
      kind: "logo",
      pin: {
        files: [
          { file: "public/brand/mark.svg", sha256: sha(MARK_SVG), role: "mark", variant: "color" },
        ],
      },
      licence: "Ours, everywhere.",
    }),
  );
  const ask = (id, item, more = {}) =>
    put(
      dir,
      `${waiting.WAITING_FOLDER}/${id}.json`,
      json({ id, question: `About ${item}?`, item, ...more }),
    );
  ask("q-board", "pattern:board", { answer: "keep", by: OWNER, on: ON });
  ask("q-inbox", "pattern:inbox", { recommendation: "a list", hard_to_undo: true });
  ask("q-colour", "source-color:oklch(0.6 0.2 30)", {
    answer: "refuse",
    said: "keep blue",
    by: OWNER,
    on: ON,
  });
  const then = before.calls.wallProblem({
    branch: before.calls.branchFacts(dir, WHERE),
    waiting: listOf(dir, before.waiting),
  });
  assert.match(then, /logo:logo/);
  assert.equal(wall(dir), then);
});

test("the readers of the brand assets say where a licence came from when no person wrote it, and nothing for a person's sentence", () => {
  const dir = leavePackage(withIcons({ make: adopted }));
  markKept(dir);
  answered(dir);
  assert.equal(iconSource(dir, "--package", ICONS).status, 0);
  assert.equal(logoSource(dir, "--package", MARK_PACKAGE).status, 0);
  const assets = brandAssets(dir);
  assert.match(
    assets.marks[0].licence_from,
    /^the rule for a mark built in the repository, not a person's sentence$/,
  );
  assert.match(
    assets.icons[0].licence_from,
    /^the package @quillmark\/glyphs, which declares it at 2\.4\.1 \(node_modules\/@quillmark\/glyphs\/package\.json\), not a person's sentence$/,
  );
  // A person's own sentence says nothing of where it came from.
  put(dir, ICONS_ROW, json(iconRow()));
  assert.equal(brandAssets(dir).icons[0].licence_from, null);
});

// ---- no network, and the names are only data -----------------------------------------------------

test("the commands of these rules reach for nothing on the network", () => {
  const dir = leavePackage(withIcons({ make: adopted }));
  iconSource(dir, "--package", ICONS, "--dry-run");
  logoSource(dir, "--package", MARK_PACKAGE, "--dry-run");
  adopt(dir, "--dry-run");
  assert.deepEqual(reached, []);
});

test("the made-up names of these tests are only data of the repositories they make", () => {
  const named = (folder) =>
    readdirSync(path.join(PLUGIN, folder), { recursive: true })
      .map((file) => path.join(folder, String(file)))
      .filter((file) => statSync(path.join(PLUGIN, file)).isFile())
      .filter((file) => {
        const words = readFileSync(path.join(PLUGIN, file), "utf8").toLowerCase();
        return ["moss heron", "quillmark", "harbor-ledger"].some((name) => words.includes(name));
      });
  for (const folder of ["scripts", "templates", "references", "skills", "hooks"]) {
    assert.deepEqual(named(folder), [], folder);
  }
});
