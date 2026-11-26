// The mark is held (spec 0017, item 12.2, slice 2): once a repository has a logo row, the page
// icons its build declares and the images its app frame imports are files of a logo row, or the
// gate is red; a new logo row, or a changed file of one, is the owner's call, asked with the item
// logo:<id> and held by the wall until the owner keeps it; status and audit say what the brand
// assets lack without turning the gate red; and the handoff book has a page of brand assets, drawn
// from the pinned files themselves. A repository with no row of the new kinds reads as before. No
// command reaches the network.
import "./helpers/own-cores.mjs";
import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import {
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
import { Buffer } from "node:buffer";
import { env, execPath } from "node:process";
import { after, test } from "node:test";
import { fileURLToPath } from "node:url";

import * as book from "../scripts/book.mjs";
import { RELEASES } from "../scripts/stamp.mjs";
import { readState, runChecks } from "../templates/tools/design-assembly/check.mjs";
import { branchFacts, wallProblem } from "../templates/tools/design-assembly/owner-calls.mjs";
import {
  itemProblem,
  mustAsk,
  readWaiting,
  WAITING_FOLDER,
} from "../templates/tools/design-assembly/waiting.mjs";
import { adopted, listIn } from "./helpers/core-family.mjs";

const PLUGIN = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const ROOT = path.resolve(PLUGIN, "../..");
const NO_NETWORK = path.join(PLUGIN, "tests/helpers/no-network.mjs");

const made = [];
after(() => made.forEach((dir) => rmSync(dir, { recursive: true, force: true })));
const empty = () => {
  const dir = realpathSync(mkdtempSync(path.join(tmpdir(), "design-mark-held-")));
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
// The pictures of the mark beside the facts, as the book command takes them.
const pictures = (dir, facts) => (book.markPictures ? book.markPictures(dir, facts) : {});
const said = (done) => done.stdout + done.stderr;
const logoSource = (dir, ...args) => run(script("logo-source.mjs"), "--target", dir, ...args);
const git = (dir, ...args) => {
  const done = spawnSync("git", ["-C", dir, ...args], { encoding: "utf8" });
  assert.equal(done.status, 0, `git ${args.join(" ")}: ${done.stderr}`);
  return done.stdout;
};

// A made-up product and its made-up mark, drawn here. The name is only ever data of the
// repositories these tests make.
const PRODUCT = "Saltmarsh Loom";
const MARK_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><circle cx="16" cy="16" r="14" fill="#2f6d5a"/><path d="M9 20h14M9 12h14" stroke="#fff" stroke-width="3"/></svg>\n`;
const MONO_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><path d="M9 20h14M9 12h14" stroke="#000" stroke-width="3"/></svg>\n`;
const OTHER_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 8 8"><rect width="8" height="8" fill="#c33"/></svg>\n`;
const ROW = "design/sources/logo.json";
const MARK = "public/brand/loom-mark.svg";
const MONO = "public/brand/loom-mono.svg";
const FAVICON = "public/favicon.svg";
const ICONS = { "src/icons/shuttle.svg": '<svg viewBox="0 0 24 24"><path d="M2 12h20"/></svg>\n' };
const ICON_ROW = "design/sources/loom-icons.json";

// A logo row, whole, as a person finishes it.
const logoRow = (files = [[MARK, "mark", "color", MARK_SVG]], more = {}) => ({
  version: 1,
  id: "logo",
  kind: "logo",
  title: PRODUCT,
  pin: {
    files: files.map(([file, role, variant, bytes]) => ({
      file,
      sha256: sha(bytes),
      role,
      variant,
    })),
  },
  licence: `${PRODUCT} is ours; used in the product and on its pages.`,
  ...more,
});
// An icon set kept as files of the repository, as a person finishes it.
const iconRow = (more = {}) => ({
  version: 1,
  id: "loom-icons",
  kind: "icon-set",
  title: "Loom icons",
  folder: "src/icons",
  pin: { files: Object.entries(ICONS).map(([file, bytes]) => ({ file, sha256: sha(bytes) })) },
  licence: "Drawn for this product: the owner holds the rights.",
  ...more,
});

// An adopted repository built with Vite, its page and its mark's files in place.
function viteApp(head = `<link rel="icon" type="image/svg+xml" href="/favicon.svg" />`) {
  const dir = adopted();
  put(
    dir,
    "package.json",
    pretty({ name: "loom-app", private: true, devDependencies: { vite: "7.0.0" } }),
  );
  put(
    dir,
    "index.html",
    `<!doctype html>\n<html>\n<head>\n${head}\n</head>\n<body><div id="root"></div></body>\n</html>\n`,
  );
  put(dir, FAVICON, MARK_SVG);
  put(dir, MARK, MARK_SVG);
  put(dir, MONO, MONO_SVG);
  return dir;
}
// The licence of the row, written as a person writes it.
function licensed(dir) {
  const row = json(dir, ROW);
  row.licence = `${PRODUCT} is ours; used in the product and on its pages.`;
  put(dir, ROW, pretty(row));
}
const hasCheck = (dir, kind) =>
  json(dir, "design/theme.json").checks["ledger-shapes"].some((check) => check.kind === kind);

// ---- criterion 9: the gate holds the mark --------------------------------------------------------

test("on a repository with a logo row, a page icon the page declares that no logo row pins turns the gate red, and the sentence names the file", () => {
  const dir = viteApp();
  const done = logoSource(dir, "--file", `${MARK}:mark:color`, "--on", "2026-11-26");
  assert.equal(done.status, 1, said(done));
  // The command laid the check of the mark's use beside the check of its pins.
  assert.ok(hasCheck(dir, "logo-pins"));
  assert.ok(hasCheck(dir, "logo-use"));
  assert.match(
    done.stdout,
    /gate: the check logo-use holds that the page icons and the images of the app frame are files of a logo row/,
  );
  licensed(dir);
  const red = gate(dir);
  assert.notEqual(red.status, 0, said(red));
  assert.match(
    said(red),
    new RegExp(
      `${FAVICON}, a page icon the build declares \\(index\\.html\\), is no file of a logo row: add it to the row with logo-source --into logo, or declare a file a logo row pins`,
    ),
  );
  // The page icon added to the row: green.
  const into = logoSource(dir, "--into", "logo", "--file", `${FAVICON}:favicon:color`);
  assert.equal(into.status, 0, said(into));
  const green = gate(dir);
  assert.equal(green.status, 0, said(green));
  const shapes = runChecks(readState(dir)).find((result) => result.id === "ledger-shapes");
  assert.equal(shapes.seenFailing, true);
});

test("an image the app frame imports, or names from the public folder, that no logo row pins turns the gate red", () => {
  const dir = viteApp("");
  put(dir, ROW, pretty(logoRow()));
  const theme = json(dir, "design/theme.json");
  theme.checks["ledger-shapes"].push({ kind: "logo-pins" }, { kind: "logo-use" });
  put(dir, "design/theme.json", pretty(theme));
  assert.equal(gate(dir).status, 0, said(gate(dir)));
  // An import of an image of the repository's own.
  put(dir, "src/assets/side.svg", OTHER_SVG);
  put(
    dir,
    "src/App.tsx",
    'import side from "./assets/side.svg";\nexport const App = () => <main><img src={side} alt="" /></main>;\n',
  );
  const red = gate(dir);
  assert.notEqual(red.status, 0);
  assert.match(
    said(red),
    /src\/assets\/side\.svg, an image the app frame imports in src\/App\.tsx, is no file of a logo row: add it to the row with logo-source --into logo, or show a file a logo row pins/,
  );
  // An address from the root of the site, served from the public folder.
  put(dir, "public/brand/banner.svg", OTHER_SVG);
  put(dir, "src/App.tsx", 'export const App = () => <img src="/brand/banner.svg" alt="" />;\n');
  assert.match(
    said(gate(dir)),
    /public\/brand\/banner\.svg, an image the app frame imports in src\/App\.tsx, is no file of a logo row/,
  );
  // The mark's own file, shown by the frame: green. A screen below the frame is not the frame.
  put(
    dir,
    "src/App.tsx",
    `export const App = () => <img src="/brand/loom-mark.svg" alt="${PRODUCT}" />;\n`,
  );
  put(
    dir,
    "src/screens/Report.tsx",
    'import chart from "../assets/side.svg";\nexport const R = () => <img src={chart} />;\n',
  );
  const green = gate(dir);
  assert.equal(green.status, 0, said(green));
});

test("on the build of a router app, the icons the app folder keeps and the images its layouts and what they import show are held", () => {
  const dir = adopted();
  put(
    dir,
    "package.json",
    pretty({
      name: "loom-app",
      private: true,
      dependencies: { next: "15.0.0" },
      scripts: { dev: "next dev" },
    }),
  );
  put(dir, MARK, MARK_SVG);
  put(dir, "src/app/icon.svg", MARK_SVG);
  put(
    dir,
    "src/app/layout.tsx",
    'import { Frame } from "@/components/frame";\nexport default function Layout({ children }) { return <Frame>{children}</Frame>; }\n',
  );
  put(
    dir,
    "src/components/frame.tsx",
    'export function Frame({ children }) { return <aside><img src="/brand/loom-mark.svg" alt="" />{children}</aside>; }\n',
  );
  put(dir, ROW, pretty(logoRow()));
  const theme = json(dir, "design/theme.json");
  theme.checks["ledger-shapes"].push({ kind: "logo-pins" }, { kind: "logo-use" });
  put(dir, "design/theme.json", pretty(theme));
  const red = runChecks(readState(dir)).find((result) => result.id === "ledger-shapes");
  assert.match(
    red.problem ?? "",
    /src\/app\/icon\.svg, a page icon the build declares \(src\/app\/icon\.svg\), is no file of a logo row/,
  );
  put(
    dir,
    ROW,
    pretty(
      logoRow([
        [MARK, "mark", "color", MARK_SVG],
        ["src/app/icon.svg", "favicon", "color", MARK_SVG],
      ]),
    ),
  );
  assert.equal(
    runChecks(readState(dir)).find((result) => result.id === "ledger-shapes").problem,
    null,
  );
  // The frame one step down shows another image: red.
  put(dir, "public/brand/other.svg", OTHER_SVG);
  put(
    dir,
    "src/components/frame.tsx",
    'export function Frame({ children }) { return <aside><img src="/brand/other.svg" alt="" />{children}</aside>; }\n',
  );
  assert.match(
    runChecks(readState(dir)).find((result) => result.id === "ledger-shapes").problem ?? "",
    /public\/brand\/other\.svg, an image the app frame imports in src\/components\/frame\.tsx, is no file of a logo row/,
  );
});

test("a repository with no logo row is not checked for its page icons: nothing is laid, and the gate is as green", () => {
  const dir = viteApp();
  const before = gate(dir);
  assert.equal(before.status, 0, said(before));
  assert.equal(hasCheck(dir, "logo-use"), false);
  const upgraded = run(script("upgrade.mjs"), "--target", dir, "--dry-run");
  assert.doesNotMatch(upgraded.stdout, /logo-use/);
});

test("upgrade lays the check of the mark's use on a repository that has a logo row and lacks it", () => {
  const dir = viteApp();
  put(
    dir,
    ROW,
    pretty(
      logoRow([
        [MARK, "mark", "color", MARK_SVG],
        [FAVICON, "favicon", "color", MARK_SVG],
      ]),
    ),
  );
  const theme = json(dir, "design/theme.json");
  theme.checks["ledger-shapes"].push({ kind: "logo-pins" });
  put(dir, "design/theme.json", pretty(theme));
  const preview = run(script("upgrade.mjs"), "--target", dir, "--dry-run");
  assert.match(
    preview.stdout,
    /check: ledger-shapes gains logo-use, which turns the gate red when a page icon the build declares, or an image the app frame imports, is no file of a logo row/,
  );
});

// ---- logo-source --into: a file added to a row, nothing written over ----------------------------

test("logo-source --into adds files to a row, keeps every file and word it had, and refuses a file it pins already", () => {
  const dir = viteApp("");
  put(dir, ROW, pretty(logoRow()));
  const before = json(dir, ROW);
  const done = logoSource(dir, "--into", "logo", "--file", `${MONO}:mark:mono`);
  assert.equal(done.status, 0, said(done));
  assert.equal(done.reached, "");
  const row = json(dir, ROW);
  assert.deepEqual(row.pin.files.slice(0, 1), before.pin.files);
  assert.deepEqual(row.pin.files[1], {
    file: MONO,
    sha256: sha(MONO_SVG),
    role: "mark",
    variant: "mono",
  });
  assert.equal(row.licence, before.licence);
  const twice = logoSource(dir, "--into", "logo", "--file", `${MARK}:favicon:color`);
  assert.equal(twice.status, 2);
  assert.match(
    twice.stderr,
    /public\/brand\/loom-mark\.svg is pinned by design\/sources\/logo\.json already: a file of the mark is named once\. Nothing was written/,
  );
  const none = logoSource(dir, "--into", "nothing", "--file", `${MONO}:mark:mono`);
  assert.equal(none.status, 2);
  assert.match(
    none.stderr,
    /design\/sources\/nothing\.json is no logo row: write one first, with logo-source --file\. Nothing was written/,
  );
});

// ---- criterion 10: the mark is the owner's call --------------------------------------------------

test("decide --ask takes the item logo:<id>, and tells the agent to stop", () => {
  assert.equal(itemProblem("logo:logo"), null);
  assert.equal(mustAsk("logo:logo"), true);
  assert.notEqual(itemProblem("logo:Not An Id"), null);
  const dir = viteApp("");
  const done = run(
    script("decide.mjs"),
    "--target",
    dir,
    "--ask",
    "Which mark does the product carry?",
    "--item",
    "logo:logo",
    "--recommend",
    "the mark kept in public/brand",
    "--because",
    "the repository keeps it already",
    "--hard-to-undo",
  );
  assert.ok([0, 1].includes(done.status), said(done));
  assert.equal(done.reached, "");
  assert.match(
    done.stdout,
    /stop: logo:logo is the owner's call\. Do not build on it until the owner keeps it here; until then the gate is red for it/,
  );
  const rows = readWaiting(dir).rows;
  assert.deepEqual(
    rows.map((row) => row.item),
    ["logo:logo"],
  );
});

// A repository on git, its main branch with a ledger and no mark, and a branch made from it.
function onGit() {
  const dir = empty();
  git(dir, "init", "-q", "-b", "main");
  git(dir, "config", "user.name", "Test Person");
  git(dir, "config", "user.email", "test@example.com");
  put(dir, "design/decisions.yaml", "version: 1\ndecisions: []\n");
  put(dir, "src/index.css", ":root {\n  --primary: oklch(0.5 0.1 160);\n}\n");
  put(dir, MARK, MARK_SVG);
  put(dir, MONO, MONO_SVG);
  git(dir, "add", "-A");
  git(dir, "commit", "-q", "-m", "start");
  git(dir, "checkout", "-q", "-b", "feature");
  return dir;
}
const facts = (dir) =>
  branchFacts(dir, {
    pages: "design/patterns",
    stylesheet: "src/index.css",
    ledger: "design/decisions.yaml",
  });
const waiting = (dir) => ({ rows: readWaiting(dir)?.rows ?? [] });
const wall = (dir) => wallProblem({ branch: facts(dir), waiting: waiting(dir) });
const answer = (dir, item, verdict = "keep") =>
  put(
    dir,
    `${WAITING_FOLDER}/mark.json`,
    pretty({
      id: "mark",
      kind: "question",
      question: "Which mark?",
      item,
      answer: verdict,
      by: "The Owner",
      on: "2026-11-26",
    }),
  );

test("a branch that adds a logo row is red until the waiting list holds the owner's answer that keeps logo:<id>", () => {
  const dir = onGit();
  assert.equal(wall(dir), null);
  put(dir, ROW, pretty(logoRow()));
  assert.match(
    wall(dir),
    /logo:logo: a new mark, or a changed file of one \(design\/sources\/logo\.json\), is the owner's call, and the waiting list holds no answer for it: ask with decide --ask --item logo:logo/,
  );
  answer(dir, "logo:logo", "refuse");
  assert.match(wall(dir), /logo:logo: .* the owner refused it|logo:logo: .*refused in mark/);
  answer(dir, "logo:other");
  assert.match(wall(dir), /logo:logo/);
  answer(dir, "logo:logo");
  assert.equal(wall(dir), null);
});

test("a branch that changes a file of a logo row waits on the owner too; one that leaves the files as they are does not", () => {
  const dir = onGit();
  git(dir, "checkout", "-q", "main");
  put(dir, ROW, pretty(logoRow()));
  git(dir, "add", "-A");
  git(dir, "commit", "-q", "-m", "the mark");
  git(dir, "checkout", "-q", "-b", "words");
  // Only the licence changed: no file of the mark did.
  put(dir, ROW, pretty(logoRow(undefined, { licence: "Ours, everywhere." })));
  assert.equal(wall(dir), null);
  // A file added to the row: the mark changed.
  put(
    dir,
    ROW,
    pretty(
      logoRow([
        [MARK, "mark", "color", MARK_SVG],
        [MONO, "mark", "mono", MONO_SVG],
      ]),
    ),
  );
  assert.match(wall(dir), /logo:logo: a new mark, or a changed file of one/);
  answer(dir, "logo:logo");
  assert.equal(wall(dir), null);
});

// The tool of the release before this slice, taken from the tree of git that the plugin's list of
// releases records for it: 0.71.0 knows the kind logo and the check of its pins, and neither the
// item logo:<id> of the waiting list nor the check of the mark's use.
const OLDER = RELEASES.find((release) => release.version === "0.71.0");
function withOlderTool(dir) {
  const tool = path.join(dir, "tools/design-assembly");
  rmSync(tool, { recursive: true });
  mkdirSync(tool, { recursive: true });
  const archive = execFileSync("git", ["-C", ROOT, "archive", OLDER.tool]);
  execFileSync("tar", ["-x", "-C", tool], { input: archive });
  put(dir, "design/tool-stamp.json", pretty({ version: OLDER.version, tree: OLDER.tool }));
  return dir;
}

test("on a repository whose installed tool of 0.71.0 predates the item, decide --ask --item logo:<id> writes nothing and names upgrade first", () => {
  const dir = withOlderTool(viteApp(""));
  const before = gate(dir);
  assert.equal(before.status, 0, said(before));
  const done = run(
    script("decide.mjs"),
    "--target",
    dir,
    "--ask",
    "Which mark?",
    "--item",
    "logo:logo",
    "--recommend",
    "the kept one",
    "--because",
    "it is there",
    "--hard-to-undo",
  );
  assert.equal(done.status, 2, said(done));
  assert.match(
    done.stderr,
    /predates the item logo:<id> of the waiting list, so its gate would read the question as broken: bring the tool up with upgrade first, then ask again\. Nothing was written/,
  );
  assert.equal(existsSync(path.join(dir, WAITING_FOLDER)), false);
  assert.equal(gate(dir).status, 0);
});

test("on a repository whose installed tool of 0.71.0 predates the check of the mark's use, logo-source lays only the check of the pins, and the gate stays green", () => {
  const dir = withOlderTool(viteApp());
  const done = logoSource(dir, "--file", `${MARK}:mark:color`);
  assert.equal(done.status, 1, said(done));
  assert.ok(hasCheck(dir, "logo-pins"));
  assert.equal(hasCheck(dir, "logo-use"), false);
  assert.match(
    done.stdout,
    /the repository's copy of the tool, tools\/design-assembly, predates the check logo-use: bring the tool up with upgrade, which lays it/,
  );
  licensed(dir);
  const after = gate(dir);
  assert.equal(after.status, 0, said(after));
});

// ---- criterion 14: status and audit say what the brand assets lack ------------------------------

// A repository with a mark of one file in its colours, and an icon set with no sizes.
function lacking() {
  const dir = viteApp("");
  put(dir, ROW, pretty(logoRow()));
  for (const [file, bytes] of Object.entries(ICONS)) put(dir, file, bytes);
  put(dir, ICON_ROW, pretty(iconRow()));
  return dir;
}
// The same repository, whole: a one-colour file, a page icon, and the sizes of the icon set.
function whole() {
  const dir = lacking();
  put(
    dir,
    ROW,
    pretty(
      logoRow([
        [MARK, "mark", "color", MARK_SVG],
        [MONO, "mark", "mono", MONO_SVG],
        [FAVICON, "favicon", "color", MARK_SVG],
      ]),
    ),
  );
  put(dir, ICON_ROW, pretty(iconRow({ sizes: [16, 20], stroke: 1.5 })));
  return dir;
}

test("status says what the brand assets lack, each with its next step, and ends and gates as it would without the lack", () => {
  const short = run(script("status.mjs"), "--target", lacking());
  const full = run(script("status.mjs"), "--target", whole());
  assert.equal(short.reached, "");
  assert.equal(short.status, full.status, said(short));
  const lines = [
    /brand assets lack, which no check holds and the gate does not turn red for:/,
    /design\/sources\/logo\.json: the mark Saltmarsh Loom has no one-colour variant; next: draw one, by hand or with a plug of the brand assets socket \(plugs lists them\), then add it with logo-source --into logo --file PATH:ROLE:mono/,
    /design\/sources\/logo\.json: the mark Saltmarsh Loom has no page icon; next: add the file the page declares with logo-source --into logo --file PATH:favicon:VARIANT/,
    /design\/sources\/loom-icons\.json: the icon set Loom icons records no sizes; next: write the sizes the screens use, in px, into sizes of design\/sources\/loom-icons\.json, a person's answer: icon-source writes the row and not its sizes/,
  ];
  for (const line of lines) assert.match(short.stdout, line);
  assert.doesNotMatch(full.stdout, /brand assets lack/);
  const data = JSON.parse(run(script("status.mjs"), "--target", lacking(), "--json").stdout);
  assert.equal(data.brand_gaps.length, 3);
  assert.equal(
    JSON.parse(run(script("status.mjs"), "--target", whole(), "--json").stdout).brand_gaps,
    undefined,
  );
});

test("audit says the same lack, and the gate of either repository is green", () => {
  const short = run(script("audit.mjs"), "--target", lacking());
  const full = run(script("audit.mjs"), "--target", whole());
  assert.equal(short.status, full.status, said(short));
  assert.match(short.stdout, /brand assets: 3 thing\(s\) lacking, which no check holds:/);
  assert.match(short.stdout, /the mark Saltmarsh Loom has no one-colour variant/);
  assert.match(short.stdout, /the icon set Loom icons records no sizes/);
  assert.doesNotMatch(full.stdout, /brand assets:/);
  for (const dir of [lacking(), whole()]) {
    const theme = json(dir, "design/theme.json");
    theme.checks["ledger-shapes"].push({ kind: "logo-pins" }, { kind: "icon-set-pin" });
    put(dir, "design/theme.json", pretty(theme));
    assert.equal(gate(dir).status, 0, said(gate(dir)));
  }
});

// ---- criterion 15: the handoff book has a page of brand assets ----------------------------------

test("the book has a page of brand assets: the mark by role and variant, drawn from the pinned files, and the icon set with its sizes, stroke, pin and licence", () => {
  const dir = whole();
  const facts = book.collectFacts(dir);
  assert.deepEqual(
    facts.brand.marks[0].files.map((file) => [file.file, file.role, file.variant]),
    [
      [MARK, "mark", "color"],
      [MONO, "mark", "mono"],
      [FAVICON, "favicon", "color"],
    ],
  );
  assert.equal(facts.brand.marks[0].row, ROW);
  assert.equal(facts.brand.icons[0].row, ICON_ROW);
  // The facts never hold a picture: the page takes them from the files, beside the facts.
  assert.doesNotMatch(JSON.stringify(facts), /base64/);
  const page = book.renderBook(facts, { marks: pictures(dir, facts) });
  assert.match(page, /Brand assets/);
  const drawn = `data:image/svg+xml;base64,${Buffer.from(MONO_SVG).toString("base64")}`;
  assert.ok(page.includes(drawn), "the one-colour file is not drawn from its own bytes");
  assert.match(page, /mark · mono/);
  assert.match(page, /favicon · color/);
  assert.match(page, /Loom icons/);
  assert.match(page, /16, 20 px/);
  assert.match(page, /stroke 1\.5/);
  assert.match(page, /Drawn for this product: the owner holds the rights\./);
  assert.match(page, new RegExp(`${PRODUCT} is ours`));
  // A licence not written yet is said.
  const open = lacking();
  const row = json(open, ICON_ROW);
  delete row.licence;
  row.proposed = { by: "icon-source", on: "2026-11-26" };
  put(open, ICON_ROW, pretty(row));
  const second = book.collectFacts(open);
  assert.match(
    book.renderBook(second, { marks: pictures(open, second) }),
    /licence not written yet/,
  );
});

test("a repository that keeps the floor's text for its mark, or records no icon set, has a page that says so", () => {
  const icons = viteApp("");
  for (const [file, bytes] of Object.entries(ICONS)) put(icons, file, bytes);
  put(icons, ICON_ROW, pretty(iconRow()));
  const one = book.collectFacts(icons);
  assert.match(
    book.renderBook(one, { marks: pictures(icons, one) }),
    /The mark is the floor's text: the product's name set in the heading typeface, and no file/,
  );
  const mark = viteApp("");
  put(mark, ROW, pretty(logoRow()));
  const two = book.collectFacts(mark);
  assert.match(book.renderBook(two, { marks: pictures(mark, two) }), /No icon set is recorded yet/);
});

test("a repository with no row of the new kinds has no page of brand assets, and its facts are as before", () => {
  const dir = viteApp();
  const facts = book.collectFacts(dir);
  assert.equal(Object.hasOwn(facts, "brand"), false);
  assert.doesNotMatch(book.renderBook(facts, { marks: pictures(dir, facts) }), /Brand assets/);
});

// ---- criteria 20 and 21 --------------------------------------------------------------------------

test("every command this slice touches reaches for nothing on the network", () => {
  const dir = lacking();
  for (const done of [
    run(script("status.mjs"), "--target", dir),
    run(script("audit.mjs"), "--target", dir),
    run(script("book.mjs"), "--target", dir, "--facts"),
    logoSource(dir, "--into", "logo", "--file", `${MONO}:mark:mono`, "--dry-run"),
    run(
      script("decide.mjs"),
      "--target",
      dir,
      "--ask",
      "Which mark?",
      "--item",
      "logo:logo",
      "--recommend",
      "it",
      "--because",
      "so",
      "--hard-to-undo",
      "--dry-run",
    ),
    gate(dir),
  ]) {
    assert.equal(done.reached, "", said(done));
  }
});

test("the made-up name of the mark is only data of the repositories of these tests", () => {
  const named = (folder) =>
    readdirSync(path.join(PLUGIN, folder), { recursive: true })
      .map((file) => path.join(folder, String(file)))
      .filter((file) => statSync(path.join(PLUGIN, file)).isFile())
      .filter((file) => readFileSync(path.join(PLUGIN, file), "utf8").includes(PRODUCT));
  for (const folder of ["scripts", "templates", "references", "skills", "hooks"]) {
    assert.deepEqual(named(folder), [], folder);
  }
});
