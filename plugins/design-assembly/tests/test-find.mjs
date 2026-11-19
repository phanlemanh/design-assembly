// find: one call that says whether the store already answers a need, read from the nearest store
// to the farthest, stopping at the first that answers: the repository's own (its intake ledger, its
// components, its kinds of screen), then the starter kit of this plugin, then the family's store,
// then the outside sources it pinned. Words are matched, never meaning; no model, no network.
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import {
  existsSync,
  lstatSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { execPath } from "node:process";
import { after, test } from "node:test";
import { fileURLToPath } from "node:url";

import { find, wordsOf } from "../scripts/find.mjs";
import { ADAPTER_KINDS, adapterOf } from "../templates/tools/design-assembly/adapters/index.mjs";
import { withoutBlock } from "../templates/tools/design-assembly/theme.mjs";

const PLUGIN = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const ROOT = path.resolve(PLUGIN, "../..");
const SCRIPT = path.join(PLUGIN, "scripts/find.mjs");
const STARTER = JSON.parse(readFileSync(path.join(PLUGIN, "references/starter.json"), "utf8"));
const LAYERS = JSON.parse(readFileSync(path.join(PLUGIN, "references/layers.json"), "utf8")).layers;

const made = [];
after(() => made.forEach((dir) => rmSync(dir, { recursive: true, force: true })));

const empty = () => {
  const dir = mkdtempSync(path.join(tmpdir(), "design-find-"));
  made.push(dir);
  return dir;
};
const put = (dir, file, text) => {
  mkdirSync(path.dirname(path.join(dir, file)), { recursive: true });
  writeFileSync(path.join(dir, file), text);
};
function repo(files) {
  const dir = empty();
  for (const [file, text] of Object.entries(files)) put(dir, file, text);
  return dir;
}
const json = (data) => `${JSON.stringify(data, null, 2)}\n`;
const sha = (text) => createHash("sha256").update(text).digest("hex");

// One outside source, pinned by the file it was read from, with its catalog.
const SNAPSHOT = "data-grid-1\nfilter-bar\n";
const SOURCE = {
  version: 1,
  id: "kit",
  title: "A component kit",
  order: 1,
  pin: {
    fetched_at: "2026-11-11T01:42:13.053Z",
    files: [{ file: "kit.txt", sha256: sha(SNAPSHOT) }],
  },
  snapshot: "tools/kit/snapshot",
  catalog: "design/kit-catalog.json",
  install: "npx add-from-kit {name}",
};
const CATALOG = {
  items: [
    {
      name: "data-grid-1",
      kind: "block",
      title: "Data grid",
      description: "Many rows to read and sort",
      page: "https://example.test/blocks/data-grid-1",
    },
    { name: "filter-bar", kind: "block", title: "Filter bar", description: "Narrow a list" },
  ],
};
const INTAKE = [
  "version: 1",
  "blocks:",
  "  - name: DataRegion",
  "    file: src/components/data-region.tsx",
  "    source: data-grid-1",
  "    from: kit",
  "    pin: 2026-11-11",
  "    need: many-rows",
  "    description: A region that holds many rows",
  "    approved: 2026-11-12",
  "  - name: FilterBar",
  "    file: src/components/filter-bar.tsx",
  "    source: by-hand",
  "    need: filter-list",
  "    approved: 2026-11-12",
  "  - name: OldHeader",
  "    file: src/components/old-header.tsx",
  "    source: by-hand",
  "    need: page-head",
  "    approved: 2026-11-12",
  "    retired: { on: 2026-11-18, by: the owner, why: Merged into the frame }",
  "",
].join("\n");
const COMPONENT = (name) =>
  `export function ${name}({ rows, dense }: { rows: string[]; dense?: boolean }) {\n  return <div data-dense={dense}>{rows.length}</div>;\n}\n`;

// A repository that keeps its own store and pins one outside source.
const stocked = () =>
  repo({
    "design/intake.yaml": INTAKE,
    "components.json": json({ aliases: { ui: "@/components/ui" } }),
    "src/components/ui/button.tsx": COMPONENT("Button"),
    "src/components/data-region.tsx": COMPONENT("DataRegion"),
    "src/components/filter-bar.tsx": COMPONENT("FilterBar"),
    "design/sources/kit.json": json(SOURCE),
    "tools/kit/snapshot/kit.txt": SNAPSHOT,
    "design/kit-catalog.json": json(CATALOG),
  });

const run = (dir, ...args) =>
  spawnSync(execPath, [SCRIPT, ...args, "--target", dir], { encoding: "utf8" });
const stores = (result) => result.searched.map((entry) => entry.store);

test("the starter kit table names every piece of templates/owned once, with the need it answers", () => {
  const owned = readdirSync(path.join(PLUGIN, "templates/owned"));
  const pieces = owned.filter((name) => !/\.(test|spec)\.tsx?\.template$/.test(name));
  const listed = STARTER.items.flatMap((item) => item.files);
  for (const file of listed) assert.ok(owned.includes(file), `${file} is not in templates/owned`);
  assert.equal(new Set(listed).size, listed.length, "a file is listed twice");
  for (const piece of pieces) assert.ok(listed.includes(piece), `${piece} answers no need`);
  const names = STARTER.items.map((item) => item.name);
  const needs = STARTER.items.map((item) => item.need);
  assert.equal(new Set(names).size, names.length);
  assert.equal(new Set(needs).size, needs.length);
  for (const item of STARTER.items) {
    assert.ok(["component", "block"].includes(item.kind), item.name);
    assert.match(item.need, /^[a-z0-9]+(-[a-z0-9]+)*$/, item.name);
    assert.match(item.description, /^[A-Z].*\.$/, item.name);
    assert.ok(item.needs.length > 0, item.name);
    for (const kind of item.needs) {
      assert.ok(kind in ADAPTER_KINDS, `${item.name}: ${kind}`);
      // Whether a repository has that adapter is the adapter's to say, never the core's.
      assert.equal(typeof adapterOf(kind).present, "function", `${kind} cannot say it is present`);
    }
  }
});

test("words are cut at spaces, dashes, underscores and changes of case, in lower case", () => {
  assert.deepEqual(wordsOf("DataRegion many_rows-grid"), [
    "data",
    "region",
    "many",
    "rows",
    "grid",
  ]);
  assert.deepEqual(wordsOf("  TypedTable  "), ["typed", "table"]);
  assert.deepEqual(wordsOf("bảng nhiều dòng"), ["bang", "nhieu", "dong"]);
  assert.deepEqual(wordsOf("Đầu trang"), ["dau", "trang"]);
  assert.deepEqual(wordsOf(""), []);
});

test("a need asked with its marks is the need key the ledger writes without them", () => {
  const dir = stocked();
  put(dir, "design/intake.yaml", INTAKE.replace("need: many-rows", "need: bang-nhieu-dong"));
  const result = find(dir, { words: "bảng nhiều dòng" });
  assert.deepEqual(
    result.matches.map((match) => [match.name, match.need]),
    [["DataRegion", "bang-nhieu-dong"]],
  );
});

test("a block the intake ledger keeps answers from the repository's own store, and nothing farther is read", () => {
  const result = find(stocked(), { words: "many rows" });
  assert.deepEqual(
    result.matches.map((match) => [match.name, match.kind, match.store, match.tier]),
    [["DataRegion", "block", "intake", 1]],
  );
  const [match] = result.matches;
  assert.equal(match.file, "src/components/data-region.tsx");
  assert.equal(match.source, "data-grid-1");
  assert.equal(match.from, "kit");
  assert.equal(match.pin, "2026-11-11");
  assert.equal(match.reference, "https://example.test/blocks/data-grid-1");
  // What it takes is read from its component, which is one answer with it, not a second.
  assert.deepEqual(match.props, ["rows", "dense"]);
  assert.deepEqual(result.near, []);
  const farther = result.searched.filter((entry) => entry.tier > 1);
  assert.ok(farther.length >= 3);
  for (const entry of farther) {
    assert.equal(entry.found, false, entry.store);
    assert.equal(entry.read, null, entry.store);
    assert.match(entry.why, /a nearer store answers/, entry.store);
  }
});

test("the same piece in the repository's store and in an outside source is found in the repository's", () => {
  const dir = stocked();
  const near = find(dir, { words: "filter bar" });
  assert.deepEqual(
    near.matches.map((match) => [match.name, match.store]),
    [["FilterBar", "intake"]],
  );
  // With the ledger gone, the same words reach the outside source, with its pin and its page.
  rmSync(path.join(dir, "design/intake.yaml"));
  rmSync(path.join(dir, "src/components/filter-bar.tsx"));
  const far = find(dir, { words: "filter bar" });
  assert.deepEqual(
    far.matches.map((match) => [match.name, match.store, match.tier]),
    [["filter-bar", "sources/kit", 4]],
  );
  assert.equal(far.matches[0].pin, "2026-11-11T01:42:13.053Z");
  assert.equal(far.matches[0].source, "kit");
});

test("a piece that shares only some of the words is near: it is listed and the search goes on", () => {
  const result = find(stocked(), { words: "data grid" });
  // DataRegion shares "data" only: near, from the nearest store. The source's data grid has both.
  assert.deepEqual(
    result.near.map((item) => [item.name, item.store]),
    [["DataRegion", "intake"]],
  );
  assert.deepEqual(
    result.matches.map((item) => [item.name, item.store]),
    [["data-grid-1", "sources/kit"]],
  );
  assert.equal(result.searched.find((entry) => entry.store === "intake").found, false);
  // Words no piece holds all of are never a match, wherever they reach.
  const none = run(stocked(), "data", "grid", "export", "--json");
  assert.equal(none.status, 1, none.stderr);
  const data = JSON.parse(none.stdout);
  assert.deepEqual(data.matches, []);
  assert.ok(data.near.length > 0);
});

test("a name or a need given whole comes first, then more shared words, then the name", () => {
  const dir = stocked();
  put(dir, "src/components/many-rows.tsx", COMPONENT("ManyRows"));
  const result = find(dir, { words: "many-rows" });
  // The block whose need is many-rows, and the component named ManyRows, both given whole.
  assert.deepEqual(
    result.matches.map((match) => match.name),
    ["DataRegion", "ManyRows"],
  );
});

test("a retired block is not offered, and the search says how many were left out", () => {
  const result = find(stocked(), { words: "old header" });
  assert.deepEqual(result.matches, []);
  assert.match(result.searched.find((entry) => entry.store === "intake").why, /1 retired/);
});

test("a repository with nothing, not in git, is searched in every store and ends with 1", () => {
  const dir = repo({ "notes.txt": "nothing here\n" });
  const called = run(dir, "many", "rows", "--json");
  assert.equal(called.status, 1, called.stderr);
  const result = JSON.parse(called.stdout);
  assert.deepEqual(stores(result), [
    "intake",
    "components",
    "screen-kinds",
    "starter",
    "family",
    "sources",
  ]);
  const by = Object.fromEntries(result.searched.map((entry) => [entry.store, entry]));
  assert.match(by.intake.why, /no intake ledger/);
  assert.match(by.starter.why, /needs? the (components|source) adapter/);
  assert.match(by.family.why, /no family store/);
  assert.match(by.sources.why, /no outside source is pinned/);
  assert.match(result.next, /intake ledger/);
  // The command that takes a block in is named, now that it exists.
  assert.match(result.next, /intake --need/);
  const shown = run(dir, "many", "rows");
  assert.equal(shown.status, 1);
  assert.match(shown.stdout, /searched/i);
  assert.match(shown.stdout, /intake ledger/);
});

test("a piece of the starter kit is offered only where the repository has every adapter it needs", () => {
  const without = repo({ "components.json": json({ aliases: { ui: "@/components/ui" } }) });
  const missing = find(without, { words: "typed table" });
  assert.deepEqual(missing.matches, []);
  assert.match(
    missing.searched.find((entry) => entry.store === "starter").why,
    /TypedTable needs the source adapter/,
  );
  const ready = repo({
    "components.json": json({ aliases: { ui: "@/components/ui" } }),
    "package.json": json({ dependencies: { react: "19.0.0" } }),
  });
  const offered = find(ready, { words: "typed table" });
  assert.deepEqual(
    offered.matches.map((match) => [match.name, match.store, match.tier, match.kind]),
    [["TypedTable", "starter", 2, "component"]],
  );
  assert.deepEqual(offered.matches[0].files, [
    "templates/owned/typed-table.tsx.template",
    "templates/owned/typed-table.test.tsx.template",
  ]);
});

test("a store that cannot be read says why, and the search goes on to the next", () => {
  const dir = stocked();
  put(dir, "design/intake.yaml", INTAKE.replace("version: 1", "version: 2"));
  put(dir, "tools/kit/snapshot/kit.txt", `${SNAPSHOT}edited\n`);
  const result = find(dir, { words: "data grid" });
  const by = Object.fromEntries(result.searched.map((entry) => [entry.store, entry]));
  assert.match(by.intake.why, /shape 2.*update the design-assembly plugin/);
  assert.match(by["sources/kit"].why, /kit\.txt.*sha256/);
  assert.equal(by["sources/kit"].items, null);
  assert.deepEqual(result.matches, []);
});

test("--kind keeps one kind, and no store keeps behaviours yet", () => {
  const dir = stocked();
  assert.deepEqual(find(dir, { words: "data region", kind: "screen-kind" }).matches, []);
  // A block whose file is a component is offered when a component is asked for.
  assert.deepEqual(
    find(dir, { words: "data region", kind: "component" }).matches.map((match) => match.name),
    ["DataRegion"],
  );
  assert.deepEqual(
    find(dir, { words: "data region", kind: "block" }).matches.map((match) => match.name),
    ["DataRegion"],
  );
  const behaviour = run(dir, "retry", "--kind", "behaviour", "--json");
  assert.equal(behaviour.status, 1);
  assert.deepEqual(JSON.parse(behaviour.stdout).searched, [
    {
      store: "behaviours",
      tier: null,
      read: null,
      items: null,
      found: false,
      why: "no store keeps behaviours yet",
    },
  ]);
  const wrong = run(dir, "retry", "--kind", "colour");
  assert.equal(wrong.status, 2);
  assert.match(wrong.stderr, /--kind is component, block, screen-kind or behaviour/);
});

test("--limit keeps that many matches and that many near, and a call without words is wrong", () => {
  const dir = stocked();
  const one = JSON.parse(run(dir, "rows", "--limit", "1", "--json").stdout);
  assert.ok(one.matches.length <= 1);
  for (const args of [[], ["--limit", "0", "rows"], ["--limit", "many", "rows"], ["--json"]]) {
    const called = run(dir, ...args);
    assert.equal(called.status, 2, args.join(" "));
    assert.equal(called.stdout, "", args.join(" "));
  }
  assert.match(run(dir).stderr, /say what to find/);
});

// A module the call is started with, so that it can open no connection and start no program.
function blocker() {
  const file = path.join(empty(), "block.mjs");
  writeFileSync(
    file,
    [
      'import { createRequire, syncBuiltinESMExports } from "node:module";',
      "const require = createRequire(import.meta.url);",
      'const refuse = () => { throw new Error("blocked by the test"); };',
      'const net = require("node:net");',
      "net.connect = refuse; net.createConnection = refuse; net.Socket.prototype.connect = refuse;",
      'const dns = require("node:dns"); dns.lookup = refuse;',
      'const child = require("node:child_process");',
      "for (const name of ['spawn', 'spawnSync', 'exec', 'execSync', 'execFile', 'execFileSync', 'fork']) child[name] = refuse;",
      "globalThis.fetch = refuse;",
      "syncBuiltinESMExports();",
      "",
    ].join("\n"),
  );
  return file;
}

// Every file of a folder with the hash of its bytes, ignored files and all.
function snapshot(dir, at = "") {
  return readdirSync(path.join(dir, at))
    .sort()
    .flatMap((name) => {
      const relative = path.posix.join(at, name);
      const full = path.join(dir, relative);
      if (lstatSync(full).isDirectory()) return [`${relative}/`, ...snapshot(dir, relative)];
      return [`${relative} ${sha(readFileSync(full))}`];
    });
}

// A repository taken in by the tool of version 0.7.3, as git keeps it, with a store of its own.
function olderTool() {
  const old = empty();
  const archive = spawnSync("git", ["-C", ROOT, "archive", "03e2a99", "plugins/design-assembly"], {
    maxBuffer: 1 << 28,
  });
  assert.equal(archive.status, 0, String(archive.stderr));
  assert.equal(spawnSync("tar", ["-x", "-C", old], { input: archive.stdout }).status, 0);
  const dir = repo({
    "src/index.css": withoutBlock(readFileSync(path.join(ROOT, "src/index.css"), "utf8")),
    Makefile: readFileSync(path.join(ROOT, "Makefile"), "utf8"),
  });
  const choices = {
    context: { product_type: "application", conformance_level: "AA" },
    patterns: { record_panel: "beside" },
    foundations: { source_color: "#0246ff" },
  };
  const layers = Object.fromEntries(
    LAYERS.map((layer) => [
      layer.id,
      layer.built
        ? { status: "decided", source: "user", choice: choices[layer.id], why: "For the test." }
        : { status: "planned" },
    ]),
  );
  put(dir, "design/blueprint.json", JSON.stringify({ version: 1, status: "approved", layers }));
  const applied = spawnSync(
    execPath,
    [path.join(old, "plugins/design-assembly/scripts/apply.mjs"), "--target", dir],
    { encoding: "utf8" },
  );
  assert.equal(applied.status, 0, applied.stderr);
  put(dir, "design/intake.yaml", INTAKE.split("  - name: OldHeader")[0]);
  return dir;
}

// A repository built with Next.js: its screens are the pages of its folders, its components sit
// outside src/, and it keeps an intake ledger.
const nextShaped = () =>
  repo({
    "package.json": json({ dependencies: { next: "15.0.0", react: "19.0.0" } }),
    "app/page.tsx": "export default function Page() {\n  return <main>home</main>;\n}\n",
    "components/ui/button.tsx": COMPONENT("Button"),
    "design/intake.yaml": INTAKE.split("  - name: FilterBar")[0],
  });

test("on three shapes of repository find opens no connection, starts no program, writes nothing, and says the same twice", () => {
  const block = blocker();
  for (const [shape, dir] of [
    ["nothing, not in git", repo({ "notes.txt": "nothing\n" })],
    ["taken in by the tool of 0.7.3", olderTool()],
    ["built with Next.js", nextShaped()],
    ["with its own store and a pinned source", stocked()],
  ]) {
    const before = snapshot(dir);
    const call = () =>
      spawnSync(execPath, ["--import", block, SCRIPT, "many", "rows", "--target", dir, "--json"], {
        encoding: "utf8",
      });
    const first = call();
    assert.ok([0, 1].includes(first.status), `${shape}: ${first.stderr}`);
    assert.doesNotMatch(first.stderr, /blocked by the test|\n\s+at /, shape);
    const second = call();
    assert.equal(second.stdout, first.stdout, shape);
    assert.deepEqual(snapshot(dir), before, `${shape}: the tree changed`);
  }
});

test("in this repository a component of its own answers with its file, its variants and the screens that use it", () => {
  const called = run(ROOT, "typed", "table", "--json");
  assert.equal(called.status, 0, called.stderr);
  const result = JSON.parse(called.stdout);
  const match = result.matches.find((item) => item.name === "TypedTable");
  assert.ok(match, JSON.stringify(result.matches.map((item) => item.name)));
  assert.equal(match.store, "components");
  assert.equal(match.tier, 1);
  assert.equal(match.file, "src/components/ui/typed-table.tsx");
  assert.ok(match.used_by.length > 0, "no screen uses it");
  for (const key of ["props", "variants", "source", "pin", "reference"])
    assert.ok(key in match, key);
  // The starter kit has a piece of the same name, but the repository's own answered first.
  assert.ok(result.matches.every((item) => item.tier === 1));
  assert.ok(existsSync(path.join(ROOT, match.file)));
});

test("in this repository a kind of screen is found by the words of its main task", () => {
  const result = find(ROOT, { words: "danh sách", kind: "screen-kind" });
  assert.deepEqual(
    result.matches.map((match) => [match.name, match.store, match.file]),
    [["danh-sach", "screen-kinds", "design/patterns/danh-sach.md"]],
  );
  assert.equal(result.matches[0].reference, "src/example/ReferenceScreen.tsx");
});

test("a block keeps the name of its component: asked by that name, or for a component, it answers", () => {
  const dir = stocked();
  const byName = find(dir, { words: "DataRegion" });
  assert.deepEqual(
    byName.matches.map((match) => [match.name, match.store, match.component]),
    [["DataRegion", "intake", "DataRegion"]],
  );
  put(dir, "design/intake.yaml", INTAKE.replace("name: DataRegion", "name: data-block"));
  assert.deepEqual(
    find(dir, { words: "DataRegion", kind: "component" }).matches.map((match) => [
      match.name,
      match.store,
    ]),
    [["data-block", "intake"]],
  );
});

test("outside sources answer in their order, before the name of a piece", () => {
  const dir = stocked();
  rmSync(path.join(dir, "design/intake.yaml"));
  rmSync(path.join(dir, "src/components/filter-bar.tsx"));
  put(
    dir,
    "design/sources/zoo.json",
    json({ ...SOURCE, id: "zoo", order: 0, catalog: "design/zoo.json" }),
  );
  put(
    dir,
    "design/zoo.json",
    json({ items: [{ name: "zz-filter-bar", kind: "block", title: "Filter bar" }] }),
  );
  assert.deepEqual(
    find(dir, { words: "filter bar" }).matches.map((match) => match.name),
    ["zz-filter-bar", "filter-bar"],
  );
});

test("an install line is built only for a name that is safe to give a shell", () => {
  const dir = stocked();
  put(
    dir,
    "design/kit-catalog.json",
    json({ items: [{ name: "x; touch pwned", kind: "block", title: "Filter bar" }] }),
  );
  rmSync(path.join(dir, "design/intake.yaml"));
  rmSync(path.join(dir, "src/components/filter-bar.tsx"));
  const [match] = find(dir, { words: "filter bar" }).matches;
  assert.equal(match.name, "x; touch pwned");
  assert.equal(match.install, undefined);
  assert.doesNotMatch(find(dir, { words: "filter bar" }).next, /add-from-kit/);
});

test("words with no letter or digit in them are a wrong call", () => {
  for (const words of ["  ", "___"]) {
    const called = run(stocked(), words);
    assert.equal(called.status, 2, JSON.stringify(words));
    assert.match(called.stderr, /say what to find/);
  }
});

test("an intake ledger whose blocks are not a list, or not blocks, says so instead of reading as empty", () => {
  const dir = stocked();
  put(dir, "design/intake.yaml", "version: 1\nblocks: nope\n");
  assert.match(
    find(dir, { words: "many rows" }).searched.find((entry) => entry.store === "intake").why,
    /blocks are not a list/,
  );
  put(dir, "design/intake.yaml", `${INTAKE}  - just a word\n`);
  assert.match(
    find(dir, { words: "many rows" }).searched.find((entry) => entry.store === "intake").why,
    /1 entry is not a block/,
  );
});

test("an intake ledger the tool data names outside the repository is not read", () => {
  const dir = stocked();
  put(
    dir,
    "design/theme.json",
    json({
      checks: { "ledger-shapes": [{ kind: "shapes", ledgers: { intake: "../elsewhere.yaml" } }] },
    }),
  );
  const entry = find(dir, { words: "many rows" }).searched.find((item) => item.store === "intake");
  assert.equal(entry.read, null);
  assert.match(entry.why, /outside the repository/);
});

test("a check of the component manifest that names no folder makes the components unreadable, not the call", () => {
  const dir = stocked();
  put(dir, "design/theme.json", json({ checks: { "component-manifest": [{}] } }));
  const called = run(dir, "many", "rows", "--json");
  assert.equal(called.status, 0, called.stderr);
  const entry = JSON.parse(called.stdout).searched.find((item) => item.store === "components");
  assert.match(entry.why, /cannot be read/);
});

test("a piece of the starter kit the repository already has as a component is not offered again", () => {
  const dir = repo({
    "components.json": json({ aliases: { ui: "@/components/ui" } }),
    "package.json": json({ dependencies: { react: "19.0.0" } }),
    "src/components/ui/table-actions.tsx": COMPONENT("TableActions"),
  });
  const result = find(dir, { words: "data table" });
  assert.ok(!result.matches.some((match) => match.name === "TableActions" && match.tier === 2));
  assert.match(
    result.searched.find((entry) => entry.store === "starter").why,
    /TableActions is already in the repository/,
  );
});
