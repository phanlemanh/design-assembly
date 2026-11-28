// The plug that builds a mark (spec 0017, item 12.3, slice 1): its plug file says it is a skill at
// the brand assets socket and what it needs on the machine, and the board lists it, unmeasured and
// never asked; a package it leaves, with its manifest, goes through logo-source into a logo row that
// says which plug made the mark and on which day, while the name and the day of the person who
// chose it come from the waiting list; and an icon drawn beyond the pinned set goes up the ladder:
// drawn only where the set lacks it, recorded with the need and why, kept in a folder an icon set
// row pins. No command reaches the network, and the made-up names are only data of these tests.
import "./helpers/own-cores.mjs";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import {
  existsSync,
  mkdirSync,
  symlinkSync,
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

import { plugProblems, readCapabilities } from "../scripts/capabilities.mjs";
import { namesUnder } from "../scripts/icon-drawn.mjs";
import { plan } from "../scripts/plugs.mjs";
import { LOGO_PACKAGE, shapeProblems } from "../templates/tools/design-assembly/contract.mjs";
import {
  readLogoSources,
  REPOSITORY_ASSET_LICENCE,
} from "../templates/tools/design-assembly/sources-ledger.mjs";
import { adopted, listIn, OWNER } from "./helpers/core-family.mjs";

const PLUGIN = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const NO_NETWORK = path.join(PLUGIN, "tests/helpers/no-network.mjs");

const made = [];
after(() => made.forEach((dir) => rmSync(dir, { recursive: true, force: true })));
const empty = () => {
  const dir = realpathSync(mkdtempSync(path.join(tmpdir(), "design-mark-plug-")));
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
// Every command of these tests runs with the network unreachable, and says what it reached for.
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
const iconSource = (dir, ...args) => run(script("icon-source.mjs"), "--target", dir, ...args);
const plugs = (...args) => run(script("plugs.mjs"), ...args);
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

// ---- criterion 16: the plug that builds a mark is on the board -----------------------------------

const PLUG_FILE = "references/plugs/logo-design.json";

test("the plug file of logo-design declares a skill at the brand assets socket, and what it needs on the machine", () => {
  const plug = JSON.parse(text(PLUGIN, PLUG_FILE));
  assert.equal(plug.id, "logo-design");
  assert.equal(plug.kind, "skill");
  assert.deepEqual(plug.sockets, ["brand-assets"]);
  assert.deepEqual(plug.skills, ["logo-design"]);
  assert.deepEqual(plug.needs, ["machine"]);
  assert.match(plug.machine, /\S/);
  // What it asks is what the skill asks: up to three questions put in one sitting, not one.
  assert.match(plug.about, /at most three questions in one sitting/);
  assert.doesNotMatch(plug.about, /one question/);
  // No measured entry: the measured runs never saw a row held, and a measured entry makes the board
  // ask the owner to choose the plug.
  assert.equal(plug.measured, undefined);
  assert.equal(plug.recommended_by_owner, undefined);
  // It sends nothing anywhere: it needs no account and no network.
  assert.equal(plug.sends, undefined);
  assert.deepEqual(readCapabilities().problems, []);
});

test("a plug file that needs the machine says what must be on it, and one that says it lists the need", () => {
  const { table } = readCapabilities();
  const at = "references/plugs/drawer.json";
  const base = {
    id: "drawer",
    about: "A fixture skill that draws.",
    kind: "skill",
    sockets: ["brand-assets"],
    names: ["drawer"],
    skills: ["drawer"],
    file: at,
  };
  assert.deepEqual(
    plugProblems([{ ...base, needs: ["machine"], machine: "A runner." }], table),
    [],
  );
  for (const [fields, said] of [
    [{ needs: ["machine"] }, `${at}: needs the machine and does not say what must be on it`],
    [
      { needs: [], machine: "A runner." },
      `${at}: says what must be on the machine and does not list machine among its needs`,
    ],
    [{ needs: ["machine"], machine: " " }, `${at}: machine is a written text`],
    [{ needs: ["money"] }, `${at}: needs money, which is none of account, network, machine`],
  ]) {
    assert.deepEqual(plugProblems([{ ...base, ...fields }], table), [said]);
  }
});

test("the board lists logo-design at brand assets, absent or in the session, unmeasured, with what it needs on the machine, and never asks about it", () => {
  const dir = empty();
  const shown = plugs("--target", dir);
  assert.equal(shown.status, 0, shown.stderr);
  assert.match(shown.stdout, /logo-design +absent, unmeasured, needs machine/);
  assert.match(shown.stdout, /^ {6}on the machine: \S/m);
  const held = plugs("--target", dir, "--json", "--skill", "their-plugin:logo-design");
  assert.equal(held.status, 0, held.stderr);
  const result = JSON.parse(held.stdout);
  const socket = result.sockets.find((item) => item.id === "brand-assets");
  const candidate = socket.candidates.find((item) => item.id === "logo-design");
  assert.equal(candidate.state, "in-session");
  assert.equal(candidate.measured, "unmeasured");
  assert.deepEqual(candidate.needs, ["machine"]);
  assert.match(candidate.machine, /\S/);
  // Unmeasured, it is listed and never asked: no question, no file.
  assert.deepEqual(result.questions, []);
  assert.deepEqual(result.files, []);
  assert.deepEqual(snapshot(dir), []);
});

test("once measured, the plug in the session is asked about at brand assets: the rule that holds it back is the measure", () => {
  const caps = readCapabilities();
  const measured = caps.plugs.map((plug) =>
    plug.id === "logo-design"
      ? { ...plug, measured: { "brand-assets": { record: "d0088", beats_plugin: false } } }
      : plug,
  );
  const session = { skills: ["logo-design"], servers: [], signIn: [] };
  const asked = plan(empty(), { caps: { ...caps, plugs: measured }, on: "2026-11-27", session });
  const question = asked.questions.find((item) => item.id === "plug-brand-assets");
  assert.ok(question, "a measured plug in the session is not asked about");
  assert.ok(question.candidates.some((item) => item.name === "logo-design"));
  const unmeasured = plan(empty(), { caps, on: "2026-11-27", session });
  assert.equal(
    unmeasured.questions.some((item) => item.id === "plug-brand-assets"),
    false,
  );
});

// ---- criteria 4 and 17: a package of mark files, with its manifest, becomes a logo row ----------

// A made-up product and its made-up mark, drawn here, in two variants.
const PRODUCT = "Moss Heron";
const MARK_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><circle cx="16" cy="16" r="14" fill="#1f7a5c"/><path d="M10 22c4-10 8-12 12-12" stroke="#fff" stroke-width="3" fill="none"/></svg>\n`;
const MONO_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><path d="M10 22c4-10 8-12 12-12" stroke="#000" stroke-width="3" fill="none"/></svg>\n`;
const PACKAGE = "design/brand/heron";
const ROW = "design/sources/logo.json";
const MANIFEST = {
  version: 1,
  kind: "logo-package",
  made: { by: "logo-design", on: "2026-11-26" },
  title: PRODUCT,
  idea: "A heron's neck drawn as one stroke inside a pond.",
  palette: [
    { name: "pond", value: "#1f7a5c" },
    { name: "stroke", value: "#ffffff" },
  ],
  build: { grid: 32, radius: 14, stroke: 3 },
  files: [
    { file: "heron-mark.svg", sha256: sha(MARK_SVG), role: "mark", variant: "color" },
    { file: "heron-mono.svg", sha256: sha(MONO_SVG), role: "mark", variant: "mono" },
  ],
};

// An adopted repository holding a package the plug left: its two files and its manifest.
function packaged(manifest = MANIFEST) {
  const dir = adopted();
  put(dir, `${PACKAGE}/heron-mark.svg`, MARK_SVG);
  put(dir, `${PACKAGE}/heron-mono.svg`, MONO_SVG);
  if (manifest) put(dir, `${PACKAGE}/manifest.json`, pretty(manifest));
  return dir;
}
// The owner's answer on the decision sheet that keeps the mark, as the sheet writes it back.
const kept = (dir) =>
  put(
    dir,
    "design/waiting/mark-heron.json",
    pretty({
      id: "mark-heron",
      kind: "question",
      question: "Which of the three marks does the product take?",
      item: "logo:logo",
      asked_on: "2026-11-26",
      candidates: [{ name: "pond-stroke" }, { name: "two-reeds" }],
      answer: "keep",
      by: OWNER,
      on: "2026-11-27",
    }),
  );

test("the manifest of a mark package has its shape in the contract", () => {
  assert.equal(LOGO_PACKAGE.file, "manifest.json");
  assert.deepEqual(LOGO_PACKAGE.problems(MANIFEST, "m.json"), []);
  const contract = text(PLUGIN, "references/contract.md");
  assert.match(contract, /manifest\.json/);
  assert.match(contract, /logo-package/);
  // What the plug cannot say: who chose, or anything the contract does not name.
  assert.deepEqual(LOGO_PACKAGE.problems({ ...MANIFEST, chosen: { by: OWNER } }, "m.json"), [
    "m.json.chosen is not in the contract",
  ]);
  for (const [broken, said] of [
    [{ ...MANIFEST, made: { by: "someone@example.com", on: "2026-11-26" } }, /m\.json\.made\.by/],
    [{ ...MANIFEST, files: [] }, /m\.json\.files names no file/],
    [
      { ...MANIFEST, files: [{ ...MANIFEST.files[0], file: "../out.svg" }] },
      /m\.json\.files\[0\]\.file/,
    ],
    [{ ...MANIFEST, idea: undefined }, /m\.json\.idea is missing/],
    [{ ...MANIFEST, files: [MANIFEST.files[0], MANIFEST.files[0]] }, /names heron-mark\.svg twice/],
  ]) {
    assert.match(
      LOGO_PACKAGE.problems(JSON.parse(JSON.stringify(broken)), "m.json").join("; "),
      said,
    );
  }
});

test("logo-source --package writes the logo row from the package: which plug made it and on which day; who chose it comes from the waiting list", () => {
  const dir = packaged();
  kept(dir);
  const before = snapshot(dir);
  const gateBefore = gate(dir).status;
  const done = logoSource(dir, "--package", PACKAGE, "--on", "2026-11-27");
  // The owner chose the mark, and its licence is the rule's: nothing waits on a person.
  assert.equal(done.status, 0, done.stdout + done.stderr);
  assert.equal(done.reached, "");
  assert.deepEqual(json(dir, ROW), {
    version: 1,
    id: "logo",
    kind: "logo",
    title: PRODUCT,
    pin: {
      files: [
        {
          file: `${PACKAGE}/heron-mark.svg`,
          sha256: sha(MARK_SVG),
          role: "mark",
          variant: "color",
        },
        { file: `${PACKAGE}/heron-mono.svg`, sha256: sha(MONO_SVG), role: "mark", variant: "mono" },
      ],
    },
    made: { by: "logo-design", on: "2026-11-26" },
    // A mark built in the repository is its asset, as its code is: the rule writes the licence,
    // and the row says so.
    licence: REPOSITORY_ASSET_LICENCE,
    licence_from: { rule: "repository-asset" },
    proposed: { by: "logo-source", on: "2026-11-27" },
  });
  assert.match(
    done.stdout,
    /mark: Moss Heron, from the package design\/brand\/heron, made by logo-design on 2026-11-26; its 2 file\(s\) match the hashes its manifest lists/,
  );
  assert.match(
    done.stdout,
    new RegExp(`chosen: by ${OWNER} on 2026-11-27, in mark-heron of the waiting list`),
  );
  assert.doesNotMatch(done.stdout, /then: a new mark/);
  // No file of the package changed: only the row, and the checks laid beside it.
  const after = snapshot(dir).filter(
    (line) => !line.startsWith(ROW) && !line.startsWith("design/theme.json"),
  );
  assert.deepEqual(
    after,
    before.filter((line) => !line.startsWith("design/theme.json")),
  );
  assert.equal(gate(dir).status, gateBefore);
  const [mark] = readLogoSources(dir);
  assert.deepEqual(mark.drift, []);
  assert.equal(mark.waits, null);
  assert.equal(mark.held, true);
  const data = JSON.parse(
    logoSource(packaged(), "--package", PACKAGE, "--dry-run", "--json").stdout,
  );
  assert.equal(data.package, PACKAGE);
  assert.deepEqual(data.made, { by: "logo-design", on: "2026-11-26" });
  assert.equal(data.chosen, null);
});

test("without the owner's answer, the row names the owner's call as the next step", () => {
  const dir = packaged();
  const done = logoSource(dir, "--package", PACKAGE);
  assert.equal(done.status, 1, done.stderr);
  assert.doesNotMatch(done.stdout, /chosen:/);
  assert.match(
    done.stdout,
    /next: a new mark, or a changed file of one, is the owner's call: ask with decide --ask --item logo:logo/,
  );
});

test("a package with no manifest, a file it does not name, a file off its hash, or a file it names and lacks, is refused in one sentence naming the file", () => {
  for (const [make, said] of [
    [
      () => packaged(null),
      /design\/brand\/heron holds no manifest\.json: a package of mark files is read with the manifest its plug leaves beside them/,
    ],
    [
      () => {
        const dir = packaged();
        put(dir, `${PACKAGE}/heron-extra.svg`, MONO_SVG);
        return dir;
      },
      /design\/brand\/heron\/heron-extra\.svg is in the package and its manifest does not name it/,
    ],
    [
      () => {
        const dir = packaged();
        put(dir, `${PACKAGE}/heron-mono.svg`, MARK_SVG);
        return dir;
      },
      /design\/brand\/heron\/heron-mono\.svg is not the file the manifest lists: its sha256 differs from design\/brand\/heron\/manifest\.json/,
    ],
    [
      () => {
        const dir = packaged();
        rmSync(path.join(dir, PACKAGE, "heron-mono.svg"));
        return dir;
      },
      /design\/brand\/heron\/manifest\.json names heron-mono\.svg, which is not in the package/,
    ],
    [
      () => packaged({ ...MANIFEST, chosen: { by: OWNER, on: "2026-11-27" } }),
      /design\/brand\/heron\/manifest\.json\.chosen is not in the contract/,
    ],
  ]) {
    const dir = make();
    const done = logoSource(dir, "--package", PACKAGE);
    assert.equal(done.status, 2, done.stdout + done.stderr);
    assert.match(done.stderr, said);
    assert.match(done.stderr, /Nothing was written/);
    assert.equal(existsSync(path.join(dir, ROW)), false);
  }
  const dir = packaged();
  const both = logoSource(
    dir,
    "--package",
    PACKAGE,
    "--file",
    `${PACKAGE}/heron-mark.svg:mark:color`,
  );
  assert.equal(both.status, 2);
  assert.match(both.stderr, /give --file or --package, not both/);
  const outside = logoSource(dir, "--package", "../elsewhere");
  assert.equal(outside.status, 2);
  assert.match(outside.stderr, /\.\.\/elsewhere is not a folder of the repository/);
});

// ---- criterion 18: an icon drawn beyond the pinned set goes up the ladder -----------------------

const GLYPHS = "@mossheron/glyphs";
const LOCK = pretty({
  name: "heron-app",
  lockfileVersion: 3,
  packages: {
    "": { name: "heron-app" },
    [`node_modules/${GLYPHS}`]: { version: "1.2.0", license: "ISC" },
  },
});
const DRAWN = (name) =>
  `export const ${name} = () => (\n  <svg viewBox="0 0 24 24"><path d="M4 12h16" /></svg>\n);\n`;
const SEAL = "src/icons/seal-check.tsx";
const DRAWN_ROW = "design/sources/icons.json";

// An adopted repository whose icon set is a made-up package, installed, its row licensed.
function pinnedSet() {
  const dir = adopted();
  put(dir, "package-lock.json", LOCK);
  put(dir, `node_modules/${GLYPHS}/package.json`, pretty({ name: GLYPHS, version: "1.2.0" }));
  for (const name of ["anchor", "arrow-right"]) {
    put(dir, `node_modules/${GLYPHS}/dist/icons/${name}.js`, `export default "${name}";\n`);
  }
  const done = iconSource(dir, "--package", GLYPHS);
  assert.equal(done.status, 1, done.stdout + done.stderr);
  const row = "design/sources/mossheron-glyphs.json";
  put(dir, row, pretty({ ...json(dir, row), licence: "ISC, as the owner read it." }));
  return dir;
}

test("an icon the pinned set lacks is drawn into a folder an icon set row pins, with the need and why, and the check of the icons used stays green for it", () => {
  const dir = pinnedSet();
  put(dir, SEAL, DRAWN("SealCheck"));
  const done = iconSource(
    dir,
    "--draw",
    SEAL,
    "--need",
    "seal-check",
    "--why",
    "The pinned set has no seal with a check for a verified record.",
    "--on",
    "2026-11-27",
  );
  assert.equal(done.status, 1, done.stdout + done.stderr);
  assert.equal(done.reached, "");
  const row = json(dir, DRAWN_ROW);
  assert.equal(row.kind, "icon-set");
  assert.equal(row.folder, "src/icons");
  assert.deepEqual(row.pin.files, [{ file: SEAL, sha256: sha(DRAWN("SealCheck")) }]);
  assert.deepEqual(row.drawn, [
    {
      file: SEAL,
      need: "seal-check",
      why: "The pinned set has no seal with a check for a verified record.",
      on: "2026-11-27",
    },
  ]);
  assert.deepEqual(shapeProblems("sources", text(dir, DRAWN_ROW), DRAWN_ROW), []);
  assert.match(
    done.stdout,
    /the pinned set lacks it: @mossheron\/glyphs \(design\/sources\/mossheron-glyphs\.json\) has no icon seal-check/,
  );
  // The drawn file writes an svg element, and sits in the folder of an icon set row: green.
  const green = gate(dir);
  assert.equal(green.status, 0, green.stdout + green.stderr);
  // The same drawing in a screen is red: the folder is what keeps it out of the check.
  put(dir, "src/screens/heron-list.tsx", DRAWN("HeronList"));
  assert.notEqual(gate(dir).status, 0);
  rmSync(path.join(dir, "src/screens/heron-list.tsx"));

  // A second drawn icon joins the same row, and every pin it held stays.
  const WAVE = "src/icons/wave-split.tsx";
  put(dir, WAVE, DRAWN("WaveSplit"));
  const second = iconSource(dir, "--draw", WAVE, "--need", "WaveSplit", "--why", "No split wave.");
  assert.equal(second.status, 1, second.stderr);
  const grown = json(dir, DRAWN_ROW);
  assert.deepEqual(
    grown.pin.files.map((entry) => entry.file),
    [SEAL, WAVE],
  );
  assert.deepEqual(
    grown.drawn.map((entry) => entry.need),
    ["seal-check", "WaveSplit"],
  );
});

test("an icon the pinned set has is not drawn; nor one with no set pinned, a set not installed, or no need or why", () => {
  const dir = pinnedSet();
  put(dir, "src/icons/anchor.tsx", DRAWN("Anchor"));
  for (const need of ["anchor", "Anchor", "arrow_right"]) {
    const refused = iconSource(dir, "--draw", "src/icons/anchor.tsx", "--need", need, "--why", "x");
    assert.equal(refused.status, 2, refused.stdout);
    assert.match(
      refused.stderr,
      /@mossheron\/glyphs \(design\/sources\/mossheron-glyphs\.json\) has an icon (anchor|arrow-right): take it from the pinned set; an icon is drawn only when the set lacks it\. Nothing was written/,
    );
  }
  assert.equal(existsSync(path.join(dir, DRAWN_ROW)), false);
  for (const args of [
    ["--why", "x"],
    ["--need", "seal-check"],
  ]) {
    const missing = iconSource(dir, "--draw", "src/icons/anchor.tsx", ...args);
    assert.equal(missing.status, 2);
    assert.match(
      missing.stderr,
      /--draw takes --need, the icon the screen needs, and --why, why the pinned set does not answer it/,
    );
  }
  const bare = adopted();
  put(bare, SEAL, DRAWN("SealCheck"));
  const unpinned = iconSource(bare, "--draw", SEAL, "--need", "seal-check", "--why", "x");
  assert.equal(unpinned.status, 2);
  assert.match(
    unpinned.stderr,
    /the sources ledger pins no icon set: an icon is drawn only when the pinned set lacks it, so pin the set first with icon-source --package or --folder/,
  );
  rmSync(path.join(dir, "node_modules"), { recursive: true });
  put(dir, SEAL, DRAWN("SealCheck"));
  const blind = iconSource(dir, "--draw", SEAL, "--need", "seal-check", "--why", "x");
  assert.equal(blind.status, 2);
  assert.match(
    blind.stderr,
    /@mossheron\/glyphs is not installed here, so whether it has an icon seal-check cannot be read: install it as the repository installs a package; nothing is fetched here/,
  );
});

test("a drawn icon the row's pin does not hold, or one recorded on a package's row, is red in the shapes of the ledgers", () => {
  const file = "design/sources/icons.json";
  const row = {
    version: 1,
    id: "icons",
    kind: "icon-set",
    folder: "src/icons",
    pin: { files: [{ file: SEAL, sha256: sha("x") }] },
    licence: "Ours.",
    drawn: [{ file: "src/icons/other.tsx", need: "other", why: "None." }],
  };
  assert.deepEqual(shapeProblems("sources", pretty(row), file), [
    `${file} records the drawn icon src/icons/other.tsx, which its pin does not hold`,
  ]);
  const onPackage = { ...row, folder: undefined, pin: { package: GLYPHS, version: "1.2.0" } };
  assert.match(
    shapeProblems("sources", pretty(onPackage), file).join("; "),
    /is a package's icon set and records drawn icons: a drawn icon goes into the folder of an icon set row of the repository's own files/,
  );
  const unsaid = { ...row, drawn: [{ file: SEAL, need: "seal" }] };
  assert.match(
    shapeProblems("sources", pretty(unsaid), file).join("; "),
    /drawn\[0\]\.why is missing/,
  );
});

test("a package that holds a link is refused by the link's path, and nothing is read through it", () => {
  const dir = packaged();
  symlinkSync("/nonexistent-mark-file", path.join(dir, PACKAGE, "heron-dead.svg"));
  const done = logoSource(dir, "--package", PACKAGE);
  assert.equal(done.status, 2, done.stdout + done.stderr);
  assert.match(
    done.stderr,
    /design\/brand\/heron\/heron-dead\.svg is no plain file: a package holds files of its own, never a link\. Nothing was written/,
  );
  assert.equal(existsSync(path.join(dir, ROW)), false);
});

test("the names of a package's icons are its files of code or drawing, never its way in, and a package too large to read whole is refused", () => {
  const dir = empty();
  for (const file of [
    "package.json",
    "index.js",
    "README.md",
    "dist/icons/anchor.js",
    "dist/svg/wave.svg",
  ]) {
    put(dir, file, "x\n");
  }
  assert.deepEqual([...namesUnder(dir)].sort(), ["anchor", "wave"]);
  assert.throws(
    () => namesUnder(dir, { most: 1, said: "@made/up" }),
    /@made\/up holds more than 1 files, so the names of its icons cannot be read whole/,
  );
});

// ---- criterion 1, again: a repository with no row of the new kinds is unchanged -----------------

test("on a repository with no package and no drawn icon, the board names the new plug and writes nothing, asks nothing", () => {
  const dir = adopted();
  const before = snapshot(dir);
  const shown = plugs("--target", dir, "--json");
  assert.equal(shown.status, 0, shown.stderr);
  const result = JSON.parse(shown.stdout);
  const socket = result.sockets.find((item) => item.id === "brand-assets");
  assert.ok(socket.candidates.some((item) => item.id === "logo-design"));
  assert.deepEqual(result.questions, []);
  assert.deepEqual(snapshot(dir), before);
});

// ---- criteria 20 and 21: no network, and the names are only data of these tests -----------------

test("the package path, the drawn icon and the board reach for nothing on the network", () => {
  const dir = packaged();
  put(dir, SEAL, DRAWN("SealCheck"));
  for (const done of [
    logoSource(dir, "--package", PACKAGE, "--dry-run"),
    iconSource(dir, "--draw", SEAL, "--need", "seal-check", "--why", "x", "--dry-run"),
    plugs("--target", dir, "--skill", "logo-design"),
  ]) {
    assert.equal(done.reached, "", done.stdout + done.stderr);
  }
});

test("the made-up names of these tests are only data of the repositories they make", () => {
  const named = (folder) =>
    readdirSync(path.join(PLUGIN, folder), { recursive: true })
      .map((file) => path.join(folder, String(file)))
      .filter((file) => statSync(path.join(PLUGIN, file)).isFile())
      .filter((file) => {
        const words = readFileSync(path.join(PLUGIN, file), "utf8").toLowerCase();
        return ["moss heron", "mossheron", "heron"].some((name) => words.includes(name));
      });
  for (const folder of ["scripts", "templates", "references", "skills", "hooks"]) {
    assert.deepEqual(named(folder), [], folder);
  }
});
