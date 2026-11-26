// The mark enters through the sources ledger (spec 0017, item 12.2, slice 1): a source of the kind
// `logo` names each file of the mark already in the repository, with its role, its variant and its
// hash; a command writes the row from those files and draws nothing; adopt proposes it from the
// page icons the build declares and writes over nothing; a row is held once a person writes who
// holds the right to use the mark; the gate holds its pin; and the foundations layer chooses the
// mark between the floor's text and such a row. No command reaches the network.
import "./helpers/own-cores.mjs";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import {
  cpSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  realpathSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { env, execPath } from "node:process";
import { after, test } from "node:test";
import { fileURLToPath } from "node:url";

import { blueprintProblems } from "../scripts/apply.mjs";
import { fullStatus } from "../scripts/status.mjs";
import { readState, runChecks } from "../templates/tools/design-assembly/check.mjs";
import { LEDGERS, shapeProblems } from "../templates/tools/design-assembly/contract.mjs";
import { parseLedger } from "../templates/tools/design-assembly/ledger.mjs";
import {
  readLogoSources,
  readPinnedSources,
} from "../templates/tools/design-assembly/sources-ledger.mjs";
import { adopted, blueprint, floor, guided, listIn, OWNER } from "./helpers/core-family.mjs";

const PLUGIN = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const ROOT = path.resolve(PLUGIN, "../..");
const NO_NETWORK = path.join(PLUGIN, "tests/helpers/no-network.mjs");
const LAYERS = JSON.parse(readFileSync(path.join(PLUGIN, "references/layers.json"), "utf8")).layers;

const made = [];
after(() => made.forEach((dir) => rmSync(dir, { recursive: true, force: true })));
const empty = () => {
  const dir = realpathSync(mkdtempSync(path.join(tmpdir(), "design-logo-source-")));
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
    env: { ...env, DESIGN_ASSEMBLY_NETWORK_LOG: log, DESIGN_ASSEMBLY_CORES: listIn() },
  });
  return { ...result, reached: existsSync(log) ? readFileSync(log, "utf8") : "" };
};
const gate = (dir) => run(path.join(dir, "tools/design-assembly/check.mjs"), "--target", dir);
const logoSource = (dir, ...args) => run(script("logo-source.mjs"), "--target", dir, ...args);
// Every file of a folder with the hash of its bytes, the git folder left out.
function snapshot(dir, at = "") {
  return readdirSync(path.join(dir, at))
    .filter((name) => name !== ".git")
    .sort()
    .flatMap((name) => {
      const relative = path.posix.join(at, name);
      const full = path.join(dir, relative);
      if (statSync(full).isDirectory()) return snapshot(dir, relative);
      return [`${relative} ${sha(readFileSync(full))}`];
    });
}
const copy = (dir) => {
  const into = path.join(empty(), path.basename(dir));
  cpSync(dir, into, { recursive: true });
  return into;
};

// A made-up product, its made-up mark drawn here, and the files of it a repository keeps. The name
// is only ever data of the repositories these tests make.
const PRODUCT = "Harbor Kite";
const MARK_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect width="32" height="32" rx="6" fill="#0246ff"/><path d="M8 22 16 8l8 14z" fill="#fff"/></svg>\n`;
const MONO_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><path d="M8 22 16 8l8 14z" fill="#000"/></svg>\n`;
const ICON_BYTES = "PNG not a real image, only bytes to hash\n";
const ROW = "design/sources/logo.json";
const MARK = "public/brand/kite-mark.svg";
const MONO = "public/brand/kite-mono.svg";
const FAVICON = "public/favicon.svg";
const TOUCH = "public/apple-touch-icon.png";

// A row of the kind logo, whole, as a person finishes it.
const held = (files = [[MARK, "mark", "color"]], more = {}) => ({
  version: 1,
  id: "logo",
  kind: "logo",
  title: PRODUCT,
  pin: {
    files: files.map(([file, role, variant, bytes = MARK_SVG]) => ({
      file,
      sha256: sha(bytes),
      role,
      variant,
    })),
  },
  licence: `${PRODUCT} is ours; used in the product and on its pages.`,
  ...more,
});

// A repository that keeps the files of its mark.
function markRepository(files = { [MARK]: MARK_SVG }) {
  const dir = path.join(empty(), "kite-app");
  put(dir, "package.json", pretty({ name: "kite-app", private: true }));
  for (const [file, content] of Object.entries(files)) put(dir, file, content);
  return dir;
}

// ---- criterion 2: the kind logo has a shape in the contract -------------------------------------

test("a row of the kind logo has its shape in the contract, and the sources ledger stays at version 1", () => {
  assert.equal(LEDGERS.sources.version, 1);
  assert.ok(LEDGERS.sources.logo, "the contract has no shape for a logo row");
  const file = ROW;
  assert.deepEqual(shapeProblems("sources", pretty(held()), file), []);
  // A row a command wrote, with no licence yet, still has its shape: it waits on a person.
  const proposed = { ...held(), proposed: { by: "logo-source", on: "2026-11-26" } };
  delete proposed.licence;
  assert.deepEqual(shapeProblems("sources", pretty(proposed), file), []);
  // Who made the mark may be written beside it.
  assert.deepEqual(
    shapeProblems(
      "sources",
      pretty(held(undefined, { made: { by: "a person", on: "2026-11-01" } })),
      file,
    ),
    [],
  );
});

test("a logo row with no pin, a file with no role or variant, or no licence and no command's word, is red and names the row", () => {
  const file = ROW;
  const noPin = held();
  delete noPin.pin;
  const said = shapeProblems("sources", pretty(noPin), file);
  assert.ok(
    said.some((line) => line.includes(file) && /no pin/.test(line)),
    said.join("\n"),
  );
  const noRole = held();
  delete noRole.pin.files[0].role;
  assert.ok(
    shapeProblems("sources", pretty(noRole), file).some(
      (line) => line.includes(`${file}.pin.files[0].role`) && /missing/.test(line),
    ),
  );
  const strangeVariant = held([[MARK, "mark", "sparkly"]]);
  assert.ok(
    shapeProblems("sources", pretty(strangeVariant), file).some((line) =>
      line.includes(`${file}.pin.files[0].variant`),
    ),
  );
  const noLicence = held();
  delete noLicence.licence;
  assert.ok(
    shapeProblems("sources", pretty(noLicence), file).some(
      (line) => line.includes(file) && /licence/.test(line),
    ),
  );
  // A file named twice in one row is one file with two roles: red.
  const twice = held([
    [MARK, "mark", "color"],
    [MARK, "favicon", "color"],
  ]);
  assert.ok(
    shapeProblems("sources", pretty(twice), file).some(
      (line) => line.includes(MARK) && /twice/.test(line),
    ),
  );
});

test("the reader of libraries does not return a logo row", () => {
  const dir = markRepository();
  put(dir, ROW, pretty(held()));
  assert.deepEqual(readPinnedSources(dir), []);
  assert.equal(readLogoSources(dir).length, 1);
});

// ---- criterion 4: the command writes the row from files already in the repository ---------------

test("logo-source writes the row from files of the repository, each with one role and one variant, and changes no file", () => {
  const dir = markRepository({ [MARK]: MARK_SVG, [MONO]: MONO_SVG });
  const before = snapshot(dir);
  const preview = logoSource(
    dir,
    "--file",
    `${MARK}:mark:color`,
    "--file",
    `${MONO}:mark:mono`,
    "--title",
    PRODUCT,
    "--on",
    "2026-11-26",
    "--dry-run",
  );
  assert.equal(preview.status, 1, preview.stderr);
  assert.match(preview.stdout, /preview only: nothing was written/);
  assert.deepEqual(snapshot(dir), before);
  const done = logoSource(
    dir,
    "--file",
    `${MARK}:mark:color`,
    "--file",
    `${MONO}:mark:mono`,
    "--title",
    PRODUCT,
    "--on",
    "2026-11-26",
  );
  assert.equal(done.status, 1, done.stderr);
  assert.equal(done.reached, "");
  const row = json(dir, ROW);
  assert.deepEqual(row, {
    version: 1,
    id: "logo",
    kind: "logo",
    title: PRODUCT,
    pin: {
      files: [
        { file: MARK, sha256: sha(MARK_SVG), role: "mark", variant: "color" },
        { file: MONO, sha256: sha(MONO_SVG), role: "mark", variant: "mono" },
      ],
    },
    proposed: { by: "logo-source", on: "2026-11-26" },
  });
  // The files of the mark are as they were: only the row is new.
  assert.deepEqual(
    snapshot(dir).filter((line) => !line.startsWith(ROW)),
    before,
  );
  assert.match(done.stdout, new RegExp(`next: .*licence of ${ROW}`));
});

test("logo-source refuses a file that is not there, a file without a role or variant, a role it does not know, and a row that is there", () => {
  const dir = markRepository();
  const cases = [
    [
      ["--file", "public/brand/gone.svg:mark:color"],
      /public\/brand\/gone\.svg is not a file of the repository/,
    ],
    [["--file", MARK], /role and its variant/],
    [
      ["--file", `${MARK}:badge:color`],
      /badge is not a role of a mark file: one of mark, wordmark/,
    ],
    [
      ["--file", `${MARK}:mark:sparkly`],
      /sparkly is not a variant of a mark file: one of color, mono, inverse/,
    ],
    [["--file", `${MARK}:mark:color`, "--file", `${MARK}:favicon:color`], /named twice/],
    [[], /--file/],
  ];
  for (const [args, said] of cases) {
    const done = logoSource(dir, ...args);
    assert.equal(done.status, 2, `${args.join(" ")}: ${done.stdout}`);
    assert.match(done.stderr, said, args.join(" "));
    assert.equal(existsSync(path.join(dir, ROW)), false);
  }
  put(dir, ROW, pretty(held()));
  const kept = text(dir, ROW);
  const again = logoSource(dir, "--file", `${MARK}:mark:color`);
  assert.equal(again.status, 2);
  assert.match(
    again.stderr,
    /design\/sources\/logo\.json is already there: a row is never written over/,
  );
  assert.equal(text(dir, ROW), kept);
});

test("a package of mark files with a manifest is not read in this slice, and the command says so in one sentence", () => {
  const dir = markRepository();
  put(dir, "brand/manifest.json", pretty({ files: [] }));
  const done = logoSource(dir, "--package", "brand");
  assert.equal(done.status, 2);
  assert.match(
    done.stderr,
    /a package of mark files with its manifest is not read yet: give each file already in the repository with --file PATH:ROLE:VARIANT/,
  );
  assert.equal(existsSync(path.join(dir, ROW)), false);
});

// ---- criterion 5: a row a command wrote is not held until a person writes its licence -----------

test("a row the command wrote is not held until a person writes who holds the right to use the mark, and status names that step and writes nothing", () => {
  const dir = adopted();
  put(dir, MARK, MARK_SVG);
  const done = logoSource(dir, "--file", `${MARK}:mark:color`, "--on", "2026-11-26");
  assert.equal(done.status, 1, done.stderr);
  const [mark] = readLogoSources(dir);
  assert.equal(mark.held, false);
  assert.match(mark.waits, /no licence yet/);
  const row = text(dir, ROW);
  const status = fullStatus(dir);
  const ask = status.waiting.find((item) => item.id === "logo-licence-logo");
  assert.ok(ask, status.waiting.map((item) => item.id).join(", "));
  assert.match(ask.question, /right to use the mark/);
  assert.match(ask.recommendation, new RegExp(`licence of ${ROW}`));
  assert.match(ask.recommendation, /no tool writes one/);
  const said = run(script("status.mjs"), "--target", dir);
  assert.match(said.stdout, /right to use the mark/);
  // Status never writes the licence.
  assert.equal(text(dir, ROW), row);
  // Once a person writes it, the row is held and the question is gone.
  put(dir, ROW, pretty({ ...json(dir, ROW), licence: "Ours; used in the product." }));
  assert.equal(readLogoSources(dir)[0].held, true);
  assert.equal(
    fullStatus(dir).waiting.some((item) => item.id === "logo-licence-logo"),
    false,
  );
});

// ---- criterion 6: adopt proposes the row from the page icons, and writes over nothing -----------

// A repository with its floor, whose page declares its icons.
function withPageIcons(head) {
  const dir = floor("kite-app");
  put(dir, "package.json", pretty({ name: "kite-app", private: true }));
  put(
    dir,
    "index.html",
    `<!doctype html>\n<html>\n<head>\n${head}\n</head>\n<body><div id="root"></div></body>\n</html>\n`,
  );
  return dir;
}
const adopt = (dir, ...more) =>
  run(
    script("adopt.mjs"),
    "--target",
    dir,
    "--conformance-level",
    "AA",
    "--product-type",
    "application",
    ...more,
  );

test("adopt proposes a logo row from the page icons the page declares, hashed in place, and writes over nothing", () => {
  const dir = withPageIcons(
    '<link rel="icon" type="image/svg+xml" href="/favicon.svg" />\n<link rel="apple-touch-icon" href="/apple-touch-icon.png" />',
  );
  put(dir, FAVICON, MARK_SVG);
  put(dir, TOUCH, ICON_BYTES);
  const before = snapshot(dir);
  const preview = adopt(dir, "--dry-run");
  assert.equal(preview.reached, "");
  assert.match(
    preview.stdout,
    /the repository's own mark, proposed as a row of the sources ledger/,
  );
  assert.match(preview.stdout, new RegExp(`${ROW}, from 2 file\\(s\\) of the repository`));
  assert.match(preview.stdout, new RegExp(`create +${ROW}`));
  assert.deepEqual(snapshot(dir), before);
  const done = adopt(dir);
  assert.ok([0, 1].includes(done.status), done.stderr);
  const row = json(dir, ROW);
  assert.equal(row.kind, "logo");
  assert.equal(row.own, true);
  assert.equal(row.proposed.by, "adopt");
  assert.equal(row.licence, undefined);
  assert.deepEqual(
    row.pin.files.map((entry) => [entry.file, entry.role, entry.sha256]),
    [
      [FAVICON, "favicon", sha(MARK_SVG)],
      [TOUCH, "app-icon", sha(ICON_BYTES)],
    ],
  );
  // The variant is the plain one, said as a guess a person checks.
  assert.ok(row.pin.files.every((entry) => entry.variant === "color"));
  assert.match(
    done.stdout,
    /needs a person:[\s\S]*logo-licence: write who holds the right to use the mark/,
  );
  assert.match(done.stdout, /variant/);
  // The mark files are as they were.
  assert.equal(text(dir, FAVICON), MARK_SVG);
  assert.equal(text(dir, TOUCH), ICON_BYTES);
  // The gate holds the pin of the row from the start.
  const theme = json(dir, "design/theme.json");
  assert.ok(theme.checks["ledger-shapes"].some((check) => check.kind === "logo-pins"));
  // Run again, the row is there and left as it is.
  const kept = text(dir, ROW);
  const again = adopt(dir, "--dry-run");
  assert.match(
    again.stdout,
    /already kept by the repository[\s\S]*logo-source: .*design\/sources\/logo\.json is already there, and is left as it is/,
  );
  assert.equal(text(dir, ROW), kept);
});

test("a page icon adopt cannot read is a person's to write, and nothing is proposed for it", () => {
  const dir = withPageIcons(
    '<link rel="icon" href="https://cdn.example.test/icon.png" />\n<link rel="icon" href="/missing.svg" />',
  );
  const done = adopt(dir, "--dry-run");
  assert.equal(done.reached, "");
  assert.match(
    done.stdout,
    /logo-source: the page declares the icon https:\/\/cdn\.example\.test\/icon\.png, which is no file of the repository/,
  );
  assert.match(
    done.stdout,
    /logo-source: the page declares the icon \/missing\.svg, which is no file of the repository/,
  );
  assert.match(done.stdout, /a person writes the row with logo-source/);
  assert.doesNotMatch(done.stdout, new RegExp(`create +${ROW}`));
});

test("on the build of a router app, adopt reads the icon files the app folder keeps by name", () => {
  const dir = withPageIcons("");
  rmSync(path.join(dir, "index.html"));
  put(
    dir,
    "package.json",
    pretty({
      name: "kite-app",
      private: true,
      dependencies: { next: "15.0.0" },
      scripts: { dev: "next dev" },
    }),
  );
  put(dir, "app/icon.svg", MARK_SVG);
  put(dir, "app/apple-icon.png", ICON_BYTES);
  const done = adopt(dir, "--dry-run", "--json");
  const result = JSON.parse(done.stdout);
  assert.deepEqual(
    result.marks.map((mark) => mark.row),
    [ROW],
  );
  assert.deepEqual(result.marks[0].files, [
    { file: "app/apple-icon.png", role: "app-icon", variant: "color" },
    { file: "app/icon.svg", role: "favicon", variant: "color" },
  ]);
});

// ---- criterion 7: the gate holds the pin of a mark ----------------------------------------------

test("one byte of a mark file changed turns the gate red, and the red sentence names the row and the file", () => {
  const dir = adopted();
  put(dir, MARK, MARK_SVG);
  const done = logoSource(dir, "--file", `${MARK}:mark:color`, "--on", "2026-11-26");
  assert.equal(done.status, 1, done.stderr);
  // The command laid the check that holds the pin beside the row.
  assert.ok(
    json(dir, "design/theme.json").checks["ledger-shapes"].some(
      (check) => check.kind === "logo-pins",
    ),
  );
  const green = gate(dir);
  assert.equal(green.status, 0, green.stdout + green.stderr);
  const shapes = runChecks(readState(dir)).find((result) => result.id === "ledger-shapes");
  assert.equal(shapes.seenFailing, true);
  put(dir, MARK, MARK_SVG.replace("#0246ff", "#0246fe"));
  const red = gate(dir);
  assert.notEqual(red.status, 0);
  assert.match(
    red.stdout + red.stderr,
    new RegExp(
      `${ROW}: ${MARK} is not the file it was pinned with: its sha256 differs from the pin`,
    ),
  );
  // A file of the pin taken away is red too.
  rmSync(path.join(dir, MARK));
  assert.match(
    gate(dir).stdout + gate(dir).stderr,
    new RegExp(`${ROW}: ${MARK}, a file of its pin, is not there`),
  );
});

test("upgrade lays the check of the pins on a repository that has a logo row and lacks it", () => {
  const dir = adopted();
  put(dir, MARK, MARK_SVG);
  put(dir, ROW, pretty(held()));
  const preview = run(script("upgrade.mjs"), "--target", dir, "--dry-run");
  assert.match(preview.stdout, /logo-pins/);
  const plain = adopted();
  const nothing = run(script("upgrade.mjs"), "--target", plain, "--dry-run");
  assert.doesNotMatch(nothing.stdout, /logo-pins/);
});

// ---- criterion 11: the mark is chosen at the foundations layer -----------------------------------

const markChoice = () =>
  LAYERS.find((layer) => layer.id === "foundations").choices.find(
    (choice) => choice.key === "mark",
  );

test("the mark of the foundations layer takes the floor's text or source:<id>, and a blueprint without it reads as the floor's text", () => {
  const choice = markChoice();
  assert.ok(choice, "the foundations layer has no mark");
  assert.deepEqual(Object.keys(choice.options), ["text"]);
  assert.equal(choice.unset, "text");
  assert.equal(choice.sourced.kind, "logo");
  assert.equal(choice.sourced.prefix, "source:");
  // Without the choice, the blueprint is whole as before.
  assert.deepEqual(blueprintProblems(blueprint(), { sources: [], logos: [] }), []);
  const said = (value, logos) => {
    const chosen = blueprint({ foundations: { mark: value } });
    chosen.layers.foundations.confirmed.push("mark");
    chosen.layers.foundations.answered.mark = { by: OWNER, on: "2026-11-26" };
    return blueprintProblems(chosen, { sources: [], logos });
  };
  assert.deepEqual(said("text", []), []);
  assert.deepEqual(said("drawn", []), [
    "foundations: mark must be one of text, or source:<id> for a logo of the sources ledger",
  ]);
  // A row that is not there, that waits on its licence, or whose pin no longer holds, is refused
  // in one sentence.
  const missing = said("source:logo", []);
  assert.equal(missing.length, 1);
  assert.match(
    missing[0],
    /foundations: mark source:logo: the sources ledger has no logo row design\/sources\/logo\.json/,
  );
  const dir = markRepository();
  const waiting = held();
  delete waiting.licence;
  put(dir, ROW, pretty({ ...waiting, proposed: { by: "logo-source", on: "2026-11-26" } }));
  const unlicensed = said("source:logo", readLogoSources(dir));
  assert.equal(unlicensed.length, 1);
  assert.match(unlicensed[0], /no licence yet/);
  put(dir, ROW, pretty(held()));
  assert.deepEqual(said("source:logo", readLogoSources(dir)), []);
  put(dir, MARK, MONO_SVG);
  const drifted = said("source:logo", readLogoSources(dir));
  assert.equal(drifted.length, 1);
  assert.match(drifted[0], /is not the file it was pinned with/);
  // A mark that is the owner's says who gave it.
  const nameless = blueprint({ foundations: { mark: "text" } });
  nameless.layers.foundations.confirmed.push("mark");
  assert.match(
    blueprintProblems(nameless, { sources: [], logos: [] }).join("\n"),
    /mark is the owner's answer, and the blueprint does not say who gave it/,
  );
});

test("the guide makes no file for the floor's text, and holds a chosen row with the gate", () => {
  // The floor's text, chosen: the same files as a blueprint that says nothing of the mark.
  const silent = copy(guided());
  const chosen = copy(guided());
  const written = (dir, foundations) => {
    const data = blueprint({ foundations });
    if (foundations.mark) {
      data.layers.foundations.confirmed.push("mark");
      data.layers.foundations.answered.mark = { by: OWNER, on: "2026-11-26" };
    }
    put(dir, "design/blueprint.json", pretty(data));
    const done = run(script("apply.mjs"), "--target", dir);
    assert.equal(done.status, 0, done.stderr);
    return snapshot(dir).map((line) => line.split(" ")[0]);
  };
  assert.deepEqual(written(chosen, { mark: "text" }), written(silent, {}));
  assert.equal(
    parseLedger(text(chosen, "design/decisions.yaml")).some((row) => row.id === "mark"),
    false,
  );
  // A row of the ledger, chosen: the guide writes the row of the mark, and the gate holds it.
  const sourced = copy(guided());
  put(sourced, MARK, MARK_SVG);
  put(sourced, ROW, pretty(held()));
  written(sourced, { mark: "source:logo" });
  const row = parseLedger(text(sourced, "design/decisions.yaml")).find(
    (item) => item.id === "mark",
  );
  assert.ok(row, "the guide wrote no row for the mark");
  assert.equal(row.layer, "foundations");
  assert.match(row.note, new RegExp(`answered by ${OWNER} on 2026-11-26`));
  const theme = json(sourced, "design/theme.json");
  assert.deepEqual(theme.checks.mark, [{ kind: "logo-row", value: "source:logo" }]);
  assert.ok(theme.checks["ledger-shapes"].some((check) => check.kind === "logo-pins"));
  const green = gate(sourced);
  assert.equal(green.status, 0, green.stdout + green.stderr);
  const mark = runChecks(readState(sourced)).find((result) => result.id === "mark");
  assert.equal(mark.held, true);
  // The licence taken out: the chosen mark cannot be chosen, and the gate says so under its row.
  const row2 = json(sourced, ROW);
  delete row2.licence;
  put(sourced, ROW, pretty(row2));
  const red = gate(sourced);
  assert.notEqual(red.status, 0);
  assert.match(red.stdout + red.stderr, /mark: .*has no licence/);
});

// ---- criteria 20 and 21: no network, and no brand of anyone in the plugin -----------------------

test("logo-source and adopt reach for nothing on the network", () => {
  const dir = withPageIcons('<link rel="icon" href="/favicon.svg" />');
  put(dir, FAVICON, MARK_SVG);
  put(dir, MARK, MARK_SVG);
  for (const done of [
    logoSource(dir, "--file", `${MARK}:mark:color`, "--dry-run"),
    adopt(dir, "--dry-run"),
    run(script("status.mjs"), "--target", dir),
  ]) {
    assert.equal(done.reached, "");
  }
});

test("the made-up name of the mark is only data of the repository: no file of the plugin outside its tests names it", () => {
  const dir = markRepository();
  const done = logoSource(dir, "--file", `${MARK}:mark:color`, "--title", PRODUCT);
  assert.equal(done.status, 1, done.stderr);
  assert.equal(json(dir, ROW).title, PRODUCT);
  // Without a title, the row is named after nothing the plugin holds: the repository's own package.
  const other = markRepository();
  rmSync(path.join(other, ROW), { force: true });
  logoSource(other, "--file", `${MARK}:mark:color`);
  assert.equal(json(other, ROW).title, "kite-app");
  const named = (folder) =>
    readdirSync(path.join(PLUGIN, folder), { recursive: true })
      .map((file) => path.join(folder, String(file)))
      .filter((file) => statSync(path.join(PLUGIN, file)).isFile())
      .filter((file) => readFileSync(path.join(PLUGIN, file), "utf8").includes(PRODUCT));
  for (const folder of ["scripts", "templates", "references", "skills"]) {
    assert.deepEqual(named(folder), [], folder);
  }
  assert.ok(!text(ROOT, "plugins/design-assembly/scripts/logo-source.mjs").includes("kite"));
});
