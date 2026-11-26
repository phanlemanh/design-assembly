// Which screens a change reaches (test impact analysis), as a command that only reads: from each
// screen's page, through every file it imports, to the files a change touched. What cannot be
// traced asks for the whole suite. Tried on this repository, whose screens are listed in code, and
// on a made-up repository whose screens are the pages of its folders.
import "./helpers/own-cores.mjs";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { execPath } from "node:process";
import { after, test } from "node:test";
import { fileURLToPath } from "node:url";

import { shapeProblems } from "../templates/tools/design-assembly/contract.mjs";
import { ROOT } from "./helpers/guided-repo.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const PLUGIN = path.resolve(HERE, "..");
const TOOL = path.join(PLUGIN, "templates/tools/design-assembly/affected.mjs");

const made = [];
after(() => made.forEach((dir) => rmSync(dir, { recursive: true, force: true })));

function folder(files) {
  const dir = mkdtempSync(path.join(tmpdir(), "design-assembly-affected-"));
  made.push(dir);
  for (const [file, content] of Object.entries(files)) {
    mkdirSync(path.dirname(path.join(dir, file)), { recursive: true });
    writeFileSync(path.join(dir, file), content);
  }
  return dir;
}

const affected = (dir, ...args) =>
  spawnSync(execPath, [TOOL, "--target", dir, ...args], { encoding: "utf8", maxBuffer: 1 << 28 });
// The answer for a machine, for the files given.
function answer(dir, ...files) {
  const said = affected(dir, "--json", ...files.flatMap((file) => ["--files", file]));
  assert.equal(said.status, 0, said.stderr);
  return JSON.parse(said.stdout);
}
const ids = (result) => result.screens.map((screen) => screen.id);
const git = (dir, ...args) =>
  spawnSync(
    "git",
    ["-C", dir, "-c", "user.name=test", "-c", "user.email=test@example.com", ...args],
    { encoding: "utf8" },
  );

test("in this repository a file of one screen reaches that screen alone, at the widths it is checked at", () => {
  const result = answer(ROOT, "src/example/OverdueScreen.tsx");
  assert.equal(result.all, false);
  assert.deepEqual(result.why, []);
  assert.deepEqual(ids(result), ["overdue"]);
  const [overdue] = result.screens;
  assert.equal(overdue.route, "/overdue");
  assert.deepEqual(overdue.sizes, [320, 1440]);
  assert.deepEqual(overdue.why, ["src/example/OverdueScreen.tsx"]);
  assert.deepEqual(result.unmapped, []);
  // A file only the other screen imports, two imports away, reaches only that one.
  assert.deepEqual(ids(answer(ROOT, "src/lib/slow.ts")), ["reference"]);
  // A file both import reaches both, and is no reason to run everything.
  const both = answer(ROOT, "src/lib/labels.ts");
  assert.equal(both.all, false);
  assert.deepEqual(ids(both).sort(), ["overdue", "reference"]);
});

test("in this repository the stylesheet, the frame and a file of no screen ask for everything", () => {
  const sheet = answer(ROOT, "src/index.css");
  assert.equal(sheet.all, true);
  assert.deepEqual(sheet.why, [{ file: "src/index.css", reason: "the stylesheet" }]);
  const frame = answer(ROOT, "src/components/app-frame.tsx");
  assert.equal(frame.all, true);
  assert.deepEqual(frame.why, [
    { file: "src/components/app-frame.tsx", reason: "a file the tool data names global" },
  ]);
  const lost = answer(ROOT, "vite.config.ts");
  assert.equal(lost.all, true);
  assert.deepEqual(lost.why, [{ file: "vite.config.ts", reason: "not a file of any screen" }]);
  assert.deepEqual(lost.unmapped, ["vite.config.ts"]);
  // A file the tool data says reaches no screen is no reason, and reaches none.
  const notes = answer(ROOT, "wiki/log.md");
  assert.equal(notes.all, false);
  assert.deepEqual(notes.screens, []);
  assert.deepEqual(notes.unmapped, []);
});

test("a screen's own file of the ledger reaches that screen, and the shared part every screen", () => {
  assert.deepEqual(ids(answer(ROOT, "design/screens/overdue.yaml")), ["overdue"]);
  const shared = answer(ROOT, "design/screens/_shared.yaml");
  assert.equal(shared.all, true);
  assert.equal(shared.why[0].reason, "the part of the ledger of screens every screen shares");
});

test("a person reads one line per screen, or why the whole suite runs", () => {
  const one = affected(ROOT, "--files", "src/example/OverdueScreen.tsx,src/lib/slow.ts");
  assert.equal(one.status, 0, one.stderr);
  assert.match(one.stdout, /^affected: 2 files changed, 2 screens$/m);
  assert.match(
    one.stdout,
    /^ {2}\/overdue \(overdue\) at 320, 1440 px: src\/example\/OverdueScreen\.tsx$/m,
  );
  assert.match(one.stdout, /^ {2}\/ \(reference\) at 320, 1440 px: src\/lib\/slow\.ts$/m);
  assert.match(one.stdout, /^ {2}tests whose name holds one of these routes: /m);
  const all = affected(ROOT, "--files", "src/index.css");
  assert.match(all.stdout, /^affected: run everything: src\/index\.css is the stylesheet$/m);
});

test("the machine gets a pattern that picks the tests named after the screens", () => {
  const result = answer(ROOT, "src/example/OverdueScreen.tsx", "src/lib/slow.ts");
  const pattern = new RegExp(result.grep);
  assert.ok(pattern.test("page /overdue ready at 320px"));
  assert.ok(pattern.test("page / loading at 1440px"));
  assert.ok(!pattern.test("page /overdue-later ready at 320px"));
  assert.equal(answer(ROOT, "src/index.css").grep, null);
  assert.equal(answer(ROOT, "wiki/log.md").grep, null);
});

test("a screen may name its own widths in the ledger, which the contract holds to numbers", () => {
  const ledger = [
    "version: 1",
    "screens:",
    "  - id: items",
    "    route: /items",
    "    title: null",
    "    family: null",
    "    status: built",
    "    sizes:",
    "      - 375",
    "      - 1280",
    "",
  ].join("\n");
  assert.deepEqual(shapeProblems("screens", ledger), []);
  assert.match(
    shapeProblems("screens", ledger.replace("- 375", "- wide")).join("; "),
    /sizes\[0\] is "wide", which is not written as the contract says/,
  );
  const dir = folder({
    "design/screens.yaml": ledger,
    "design/screen-sizes.json": '{ "version": 1, "widths": [320, 1440] }\n',
    "src/screens.ts":
      'export const SCREENS = [{ path: "/items", load: () => import("@/pages/Items") }];\n',
    "src/pages/Items.tsx": "export const Items = () => null;\n",
    "design/theme.json": JSON.stringify({
      version: 1,
      checks: {
        s: [{ kind: "screen-ledger", file: "design/screens.yaml", registry: "src/screens.ts" }],
      },
    }),
  });
  const [items] = answer(dir, "src/pages/Items.tsx").screens;
  assert.deepEqual(items.sizes, [375, 1280]);
});

// A repository whose screens are the pages of its folders: groups in brackets add nothing to the
// route, and the layouts on a page's way wrap it.
function routed() {
  const page = (body) => `${body}\nexport default function Page() { return null; }\n`;
  return folder({
    "package.json": JSON.stringify({ dependencies: { next: "15.0.0" } }),
    "design/screens.yaml": [
      "version: 1",
      "screens:",
      ...["items", "team", "login"].flatMap((id) => [
        `  - id: ${id}`,
        `    route: /${id}`,
        "    title: null",
        "    family: null",
        "    status: built",
      ]),
      "  - id: later",
      "    route: /later",
      "    title: null",
      "    family: null",
      "    status: planned",
      "",
    ].join("\n"),
    "src/app/layout.tsx": page('import "./globals.css";'),
    "src/app/globals.css": "body {}\n",
    "src/app/(app)/layout.tsx": page('import { Shell } from "@/modules/shell";'),
    "src/app/(app)/loading.tsx": page(""),
    "src/app/(app)/items/page.tsx": page('import { List } from "@/modules/items/list";'),
    "src/app/(app)/team/page.tsx": page('import { Team } from "../../../modules/team";'),
    "src/app/login/page.tsx": page(""),
    "src/app/api/items/route.ts":
      'import { store } from "@/modules/items/store";\nexport function GET() {}\n',
    "src/modules/items/list.tsx":
      'import { cell } from "./cell";\nimport { store } from "./store";\nexport const List = cell + store;\n',
    "src/modules/items/store.ts": "export const store = 1;\n",
    "src/modules/items/cell.ts": "export const cell = 1;\n",
    "src/modules/team/index.tsx": "export const Team = 1;\n",
    "src/modules/shell.tsx": "export const Shell = 1;\n",
  });
}

test("where the folders are the screens, a page's own module reaches its screen alone", () => {
  const dir = routed();
  assert.deepEqual(ids(answer(dir, "src/modules/items/cell.ts")), ["items"]);
  assert.deepEqual(ids(answer(dir, "src/modules/team/index.tsx")), ["team"]);
  assert.deepEqual(ids(answer(dir, "src/app/login/page.tsx")), ["login"]);
});

test("where the folders are the screens, a layout reaches every page under it, and the top one all", () => {
  const dir = routed();
  assert.deepEqual(ids(answer(dir, "src/app/(app)/layout.tsx")).sort(), ["items", "team"]);
  assert.deepEqual(ids(answer(dir, "src/modules/shell.tsx")).sort(), ["items", "team"]);
  assert.deepEqual(ids(answer(dir, "src/app/(app)/loading.tsx")).sort(), ["items", "team"]);
  assert.deepEqual(ids(answer(dir, "src/app/layout.tsx")).sort(), ["items", "login", "team"]);
  // A file a page imports and code the server runs imports too may reach any screen that calls that
  // code while it runs, which imports do not show: everything runs.
  const served = answer(dir, "src/modules/items/store.ts");
  assert.equal(served.all, true);
  assert.deepEqual(served.why, [
    {
      file: "src/modules/items/store.ts",
      reason: "also reached from src/app/api/items/route.ts, which the server runs for any screen",
    },
  ]);
  // A file no page imports still asks for everything.
  assert.equal(answer(dir, "src/app/api/items/route.ts").all, true);
  // A stylesheet the top layout imports is a file of every screen under it.
  const sheet = answer(dir, "src/app/globals.css");
  assert.equal(sheet.all, false);
  assert.deepEqual(ids(sheet).sort(), ["items", "login", "team"]);
});

test("a repository with no ledger of screens, or none that can be traced, runs everything", () => {
  const bare = folder({ "src/a.ts": "export const a = 1;\n" });
  const result = answer(bare, "src/a.ts");
  assert.equal(result.all, true);
  assert.deepEqual(result.why, [
    { file: null, reason: "this repository has no ledger of screens" },
  ]);
  // Nothing changed: nothing to run, whatever the repository has.
  const none = JSON.parse(affected(bare, "--json", "--files", "").stdout);
  assert.equal(none.all, false);
  assert.deepEqual(none.screens, []);
  // A screen whose page cannot be told: a change of any source file cannot be ruled out of it.
  const blind = folder({
    "design/screens.yaml":
      "version: 1\nscreens:\n  - id: a\n    route: /a\n    title: null\n    family: null\n    status: built\n",
    "src/a.ts": "export const a = 1;\n",
  });
  const said = answer(blind, "src/a.ts");
  assert.equal(said.all, true);
  assert.match(
    JSON.stringify(said.why),
    /no file draws the screen a \(\/a\) that this tool can find/,
  );
});

test("without --files it reads what changed since the branch left the main one, the working tree included", () => {
  const dir = routed();
  assert.equal(git(dir, "init", "-q", "-b", "main").status, 0);
  git(dir, "add", "-A");
  assert.equal(git(dir, "commit", "-q", "-m", "base").status, 0);
  git(dir, "switch", "-q", "-c", "work");
  writeFileSync(path.join(dir, "src/modules/items/cell.ts"), "export const cell = 2;\n");
  git(dir, "commit", "-q", "-am", "items");
  // Not committed yet, and not known to git yet: both are part of the change.
  writeFileSync(path.join(dir, "src/app/login/page.tsx"), "export default () => 1;\n");
  writeFileSync(path.join(dir, "src/modules/team/extra.ts"), "export const extra = 1;\n");
  const said = affected(dir, "--json");
  assert.equal(said.status, 0, said.stderr);
  const result = JSON.parse(said.stdout);
  assert.deepEqual(result.changed.sort(), [
    "src/app/login/page.tsx",
    "src/modules/items/cell.ts",
    "src/modules/team/extra.ts",
  ]);
  // The new file is imported by nothing yet: it reaches no screen, and cannot be traced.
  assert.equal(result.all, true);
  assert.deepEqual(result.unmapped, ["src/modules/team/extra.ts"]);
  // Against a base named, only what changed since.
  const since = JSON.parse(affected(dir, "--json", "--base", "HEAD").stdout);
  assert.deepEqual(since.changed.sort(), ["src/app/login/page.tsx", "src/modules/team/extra.ts"]);
});

test("a wrong call, or changes it cannot read, end with 2 and no answer; nothing is ever written", () => {
  const dir = routed();
  for (const args of [["--nope"], ["--base"], ["--files", "a", "--base", "main"]]) {
    const said = affected(dir, ...args);
    assert.equal(said.status, 2, args.join(" "));
    assert.equal(said.stdout, "");
  }
  // Not a git repository, and no files named: there is no change to read.
  const said = affected(dir);
  assert.equal(said.status, 2);
  assert.match(said.stderr, /not a git repository: name the files with --files/);
  assert.equal(git(dir, "init", "-q").status, 0);
  git(dir, "add", "-A");
  git(dir, "commit", "-q", "-m", "base");
  answer(dir, "src/modules/items/cell.ts");
  assert.equal(git(dir, "status", "--porcelain").stdout, "");
});

test("the guide keeps what the tool data says of the change map, and the make step runs the command", () => {
  const theme = JSON.parse(readFileSync(path.join(ROOT, "design/theme.json"), "utf8"));
  assert.deepEqual(Object.keys(theme.affected).sort(), ["global", "none"]);
  const make = readFileSync(path.join(PLUGIN, "templates/mk/design-assembly.mk"), "utf8");
  assert.match(make, /^design-affected: ## .+\n\t@node tools\/design-assembly\/affected\.mjs/m);
  const words = JSON.parse(readFileSync(path.join(PLUGIN, "references/vocabulary.json"), "utf8"));
  assert.ok(words.terms.some((term) => term.term === "test impact analysis"));
});

test("the guide's next run keeps the change map the person wrote in the tool data", async () => {
  const { floorFiles } = await import("./helpers/guided-repo.mjs");
  const dir = folder(floorFiles());
  const apply = path.join(PLUGIN, "scripts/apply.mjs");
  assert.equal(spawnSync(execPath, [apply, "--target", dir]).status, 0);
  const file = path.join(dir, "design/theme.json");
  const map = { global: ["src/App.tsx"], none: ["docs/**"] };
  writeFileSync(file, JSON.stringify({ ...JSON.parse(readFileSync(file, "utf8")), affected: map }));
  assert.equal(spawnSync(execPath, [apply, "--target", dir]).status, 0);
  assert.deepEqual(JSON.parse(readFileSync(file, "utf8")).affected, map);
  // Adopting keeps it too, in a repository whose tool data held nothing else.
  const own = folder(
    floorFiles({ "design/theme.json": JSON.stringify({ version: 1, affected: map }) }),
  );
  spawnSync(execPath, [path.join(PLUGIN, "scripts/adopt.mjs"), "--target", own]);
  const adopted = JSON.parse(readFileSync(path.join(own, "design/theme.json"), "utf8"));
  assert.ok(Object.keys(adopted.checks ?? {}).length > 0, "adopting wrote no check");
  assert.deepEqual(adopted.affected, map);
  // The installed command reads it.
  const said = spawnSync(
    execPath,
    [
      path.join(dir, "tools/design-assembly/affected.mjs"),
      "--target",
      dir,
      "--json",
      "--files",
      "docs/a.md",
    ],
    { encoding: "utf8" },
  );
  assert.equal(said.status, 0, said.stderr);
  assert.equal(JSON.parse(said.stdout).all, false);
});

// Five pages, each reaching one shared file its own way.
function waysIn() {
  const page = (body) => `${body}\nexport default function Page() { return null; }\n`;
  return folder({
    "package.json": JSON.stringify({ dependencies: { next: "15.0.0" } }),
    "tsconfig.json": JSON.stringify({
      compilerOptions: { paths: { "@/*": ["./src/*"], "~/*": ["./src/*"] } },
    }),
    "design/screens.yaml": [
      "version: 1",
      "screens:",
      ...["a", "b", "c", "d", "e"].flatMap((id) => [
        `  - id: ${id}`,
        `    route: /${id}`,
        "    title: null",
        "    family: null",
        "    status: built",
      ]),
      "",
    ].join("\n"),
    "src/app/a/page.tsx": page('import { one } from "@/lib/one";'),
    "src/app/b/page.tsx": page('const { two } = require("../../lib/two");'),
    "src/app/c/page.tsx": page("const three = import(`../../lib/three`);"),
    "src/app/d/page.tsx": page('import { four } from "../../lib/four.js";'),
    "src/app/e/page.tsx": page('import { five } from "~/lib/five";'),
    "src/lib/one.ts": 'import { shared } from "./shared";\nexport const one = shared;\n',
    "src/lib/two.ts": 'import { shared } from "./shared";\nexport const two = shared;\n',
    "src/lib/three.ts": 'import { shared } from "./shared";\nexport const three = shared;\n',
    "src/lib/four.ts": 'import { shared } from "./shared";\nexport const four = shared;\n',
    "src/lib/five.ts": 'import { shared } from "./shared";\nexport const five = shared;\n',
    "src/lib/shared.ts": "export const shared = 1;\n",
  });
}

test("a file reached through require, a plain template, an ending of the build or an alias of the repository is followed", () => {
  const dir = waysIn();
  const result = answer(dir, "src/lib/shared.ts");
  assert.equal(result.all, false, JSON.stringify(result.why));
  assert.deepEqual(ids(result).sort(), ["a", "b", "c", "d", "e"]);
});

test("an import the tool cannot follow from a screen asks for everything, never for that screen's share alone", () => {
  const dir = waysIn();
  writeFileSync(
    path.join(dir, "src/app/c/page.tsx"),
    "const name = 'three';\nconst three = import(`../../lib/${name}`);\nexport default function Page() { return null; }\n",
  );
  const result = answer(dir, "src/lib/shared.ts");
  assert.equal(result.all, true);
  assert.match(
    result.why[0].reason,
    /the screen c \(\/c\) imports what this tool cannot follow: src\/app\/c\/page\.tsx imports `\.\.\/\.\.\/lib\/\$\{name\}`/,
  );
  // An import of the repository's own that names no file is as blind.
  writeFileSync(path.join(dir, "src/app/c/page.tsx"), 'import { gone } from "@/lib/gone";\n');
  assert.match(answer(dir, "src/lib/shared.ts").why[0].reason, /imports `@\/lib\/gone`/);
});

test("an import is not taken for a comment because a string holds the signs of one", () => {
  const dir = waysIn();
  writeFileSync(
    path.join(dir, "src/app/a/page.tsx"),
    'const glob = "src/*";\nimport { one } from "@/lib/one";\nconst end = "*/";\nexport default function Page() { return null; }\n',
  );
  assert.ok(ids(answer(dir, "src/lib/one.ts")).includes("a"));
});

test("a file the tool data says reaches no screen is still a screen's when a screen imports it", () => {
  const dir = waysIn();
  writeFileSync(
    path.join(dir, "design/theme.json"),
    JSON.stringify({ version: 1, affected: { none: ["src/lib/**"] } }),
  );
  assert.deepEqual(ids(answer(dir, "src/lib/one.ts")), ["a"]);
  // A file of no screen is let go as the tool data says.
  writeFileSync(path.join(dir, "src/lib/unused.ts"), "export const unused = 1;\n");
  assert.equal(answer(dir, "src/lib/unused.ts").all, false);
});

test("in a folder of a larger repository, and with more changes than fit a small buffer, every change is read", () => {
  const outer = folder({ "README.md": "outer\n" });
  const dir = path.join(outer, "app");
  mkdirSync(dir);
  for (const [file, text] of Object.entries({
    "design/screens.yaml":
      "version: 1\nscreens:\n  - id: a\n    route: /a\n    title: null\n    family: null\n    status: built\n",
    "src/screens.ts": 'export const SCREENS = [{ path: "/a", load: () => import("@/pages/A") }];\n',
    "src/pages/A.tsx": "export const A = 1;\n",
  })) {
    mkdirSync(path.dirname(path.join(dir, file)), { recursive: true });
    writeFileSync(path.join(dir, file), text);
  }
  assert.equal(git(outer, "init", "-q", "-b", "main").status, 0);
  git(outer, "add", "-A");
  assert.equal(git(outer, "commit", "-q", "-m", "base").status, 0);
  git(outer, "switch", "-q", "-c", "work");
  writeFileSync(path.join(dir, "src/pages/A.tsx"), "export const A = 2;\n");
  const inside = JSON.parse(affected(dir, "--json").stdout);
  assert.deepEqual(inside.changed, ["src/pages/A.tsx"]);
  assert.deepEqual(ids(inside), ["a"]);
  // A change outside the folder cannot be traced from it.
  writeFileSync(path.join(outer, "README.md"), "changed\n");
  const outside = JSON.parse(affected(dir, "--json").stdout);
  assert.equal(outside.all, true);
  assert.ok(
    outside.unmapped.some((file) => file.endsWith("README.md")),
    JSON.stringify(outside),
  );
  // Many new files, more than a small buffer holds: none is lost.
  const many = path.join(dir, "notes");
  mkdirSync(many);
  const name = (n) =>
    `a-note-whose-name-is-long-enough-to-fill-a-buffer-${String(n).padStart(6, "0")}.txt`;
  for (let n = 0; n < 20000; n += 1) writeFileSync(path.join(many, name(n)), "");
  const said = affected(dir, "--json");
  assert.equal(said.status, 0, said.stderr);
  assert.equal(
    JSON.parse(said.stdout).changed.filter((file) => file.startsWith("notes/")).length,
    20000,
  );
});

test("help is help whatever else is asked, and a base is never read as a flag of git", () => {
  const said = affected("/no/such/folder", "--help");
  assert.equal(said.status, 0);
  assert.match(said.stdout, /^Usage: affected\.mjs/);
  const dir = routed();
  git(dir, "init", "-q", "-b", "main");
  git(dir, "add", "-A");
  git(dir, "commit", "-q", "-m", "base");
  const flag = affected(dir, "--json", "--base", "-x");
  assert.equal(flag.status, 2);
  assert.match(flag.stderr, /-x is not a commit git knows/);
});
