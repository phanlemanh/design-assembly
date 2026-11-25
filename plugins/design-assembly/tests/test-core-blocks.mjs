// The blocks of a family core, slice 1 of item 7.2 (spec 0016, criteria 1, 10, 11, 15 and 20): the
// shape check of a block store that is not empty; a member's copy of the core holds the files of
// its blocks, compared by hash; the family's store is tier 3 of the ladder find walks; a block of
// the core is taken down, conformed and taken in as an item of an outside source is; the inventory
// says when a block is behind the copy and when it was changed by hand; and a repository of no
// family is as it was. No command fills a store yet, so each core is a fixture the test writes.
// Nothing calls a model or the network, and each test keeps its own list of cores.
import assert from "node:assert/strict";
import { cpSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import { execPath } from "node:process";
import { spawnSync } from "node:child_process";
import { after, test } from "node:test";

import {
  familyCoreProblems,
  PINNED_CORE,
  readPinnedCore,
} from "../templates/tools/design-assembly/contract.mjs";
import { readIntakeLedger } from "../templates/tools/design-assembly/intake-ledger.mjs";
import { ledgerText } from "../templates/tools/design-assembly/screen-fragments.mjs";
import { withoutBlock } from "../templates/tools/design-assembly/theme.mjs";
import { blockPinOf } from "../scripts/core-blocks.mjs";

import { passingFloor } from "./helpers/answered-roles.mjs";
import {
  answerSheet,
  cleanUp,
  coreFolder,
  empty,
  entryOf,
  FAMILY,
  gate,
  git,
  join,
  json,
  listIn,
  PLUGIN,
  put,
  putBlocks,
  read,
  ROOT,
  rowsBlock,
  ROWS_CODE,
  ROWS_TEST,
  run,
  sha,
  snapshot,
  storeRepo,
  text,
} from "./helpers/core-blocks-repo.mjs";
import { blueprint } from "./helpers/guided-repo.mjs";
import { COMPONENT, source } from "./helpers/store-repo.mjs";

after(cleanUp);

const core = (args, list) => run("core.mjs", args, list);
const check = (place) => core(["--check", "--core", place], listIn());
const find = (dir, list, ...args) => run("find.mjs", ["--target", dir, ...args], list);
const found = (dir, list, ...words) => JSON.parse(find(dir, list, ...words, "--json").stdout);
const intake = (dir, list, ...args) => run("intake.mjs", ["--target", dir, ...args], list);
const intakeJson = (dir, list, ...args) => {
  const done = intake(dir, list, ...args, "--json");
  return { status: done.status, stderr: done.stderr, result: JSON.parse(done.stdout || "null") };
};
const take = (dir, list, ...args) => core(["--target", dir, "--take", ...args], list);
const conform = (dir, list, ...args) => run("conform.mjs", ["--target", dir, ...args], list);
const inventory = (dir, list) =>
  JSON.parse(run("inventory.mjs", ["--target", dir, "--json"], list).stdout);
const findingsOf = (dir, list, kind) =>
  inventory(dir, list).findings.filter((finding) => finding.kind === kind);
const stores = (result) => result.searched.map((entry) => entry.store);
const entry = (result, store) => result.searched.find((each) => each.store === store);
const blocksOf = (dir) =>
  readIntakeLedger(ledgerText(dir, "design/intake.yaml", "intake"))?.blocks ?? [];
const MAIN = "src/components/order-rows.tsx";
const TEST = "src/components/order-rows.test.tsx";
const RECORD = "design/conform/many-rows.json";
// The store of the store's tests already answers many-rows with a block of its own, so a member
// built from it takes the family's block for another need of its own.
const OWN = "order-rows";
const OWN_RECORD = `design/conform/${OWN}.json`;
const takeOwn = (dir, list, ...args) => take(dir, list, "many-rows", "--need", OWN, ...args);
const conformOwn = (dir, list, ...args) => conform(dir, list, "--need", OWN, ...args);
const COPY = "design/core/blocks/many-rows/order-rows.tsx";
const LONE = "  3 family: this repository is of no family (core --join declares one)";
// What a command says about a family of products.
const FAMILY_WORDS = /family core|family's|same family|of no family|family: /i;

// A member that took the block of the fixture core in for its need, the whole way: asked, kept by
// the owner, taken down, taken in.
function takenIn(dir, list, need = OWN) {
  assert.equal(intake(dir, list, "--need", need, "order", "rows").status, 1);
  assert.equal(answerSheet(dir, `intake-${need} keep`, list).status <= 1, true);
  const down = take(dir, list, "many-rows", "--need", need);
  assert.equal(down.status, 0, down.stdout + down.stderr);
  const done = intake(dir, list, "--need", need, "--file", MAIN);
  assert.equal(done.status, 0, done.stdout + done.stderr);
}
// A member of the fixture core, with the store of its own of the store's tests.
function member(files = {}, options = {}) {
  const dir = storeRepo(files);
  const place = coreFolder(options);
  const list = listIn();
  const joined = join(dir, place, list);
  assert.equal(joined.status, 0, joined.stdout + joined.stderr);
  return { dir, place, list };
}

// ---- the shape of a block store that is not empty ----------------------------------------------

test("core --check holds a block store that is not empty: each file is there, under its need, and is the file listed", () => {
  const place = coreFolder();
  assert.deepEqual(familyCoreProblems(place), []);
  const held = check(place);
  assert.equal(held.status, 0, held.stdout + held.stderr);
  assert.match(held.stdout, /its shape holds/);
});

test("core --check names a need kept twice, a file missing, a hash that differs, and a file outside its block", () => {
  // A need twice.
  const twice = coreFolder({ blocks: [rowsBlock(), rowsBlock({ name: "OtherRows" })] });
  assert.match(
    check(twice).stdout,
    /blocks\/index\.json keeps two blocks for the need many-rows: one need, one block/,
  );
  assert.equal(check(twice).status, 1);

  // A file the list names and the folder does not hold.
  const missing = coreFolder();
  rmSync(path.join(missing, "blocks/many-rows/order-rows.test.tsx"));
  const gone = check(missing);
  assert.equal(gone.status, 1);
  assert.match(
    gone.stdout,
    /blocks\/index\.json\.blocks\[0\]\.files\[1\]: blocks\/many-rows\/order-rows\.test\.tsx is not there/,
  );

  // A file that is not the one the list holds.
  const changed = coreFolder();
  put(changed, "blocks/many-rows/order-rows.tsx", `${ROWS_CODE}// changed in the core by hand\n`);
  const differs = check(changed);
  assert.equal(differs.status, 1);
  assert.match(
    differs.stdout,
    /blocks\/index\.json\.blocks\[0\]\.files\[0\]: blocks\/many-rows\/order-rows\.tsx is not the file listed: its sha256 differs/,
  );

  // A file named so that it leaves the folder of its block, and one named twice.
  const out = coreFolder();
  const entry = entryOf(rowsBlock());
  put(
    out,
    "blocks/index.json",
    json({
      version: 2,
      blocks: [
        {
          ...entry,
          files: [
            { file: "../answers.json", sha256: sha(text(out, "answers.json")) },
            entry.files[0],
            entry.files[0],
          ],
        },
      ],
    }),
  );
  const outside = check(out);
  assert.equal(outside.status, 1);
  assert.match(
    outside.stdout,
    /files\[0\]\.file is \.\.\/answers\.json, which leaves blocks\/many-rows\/: a block's files are kept under its need/,
  );
  assert.match(outside.stdout, /files\[2\]\.file names order-rows\.tsx twice/);

  // A hidden file, or a file in a hidden folder: a block is code, never a file tools read as
  // configuration.
  const hidden = coreFolder({
    blocks: [
      rowsBlock({ texts: { "order-rows.tsx": ROWS_CODE, ".git/hooks/pre-commit": "echo\n" } }),
    ],
  });
  const dotted = check(hidden);
  assert.equal(dotted.status, 1);
  assert.match(
    dotted.stdout,
    /files\[1\]\.file is \.git\/hooks\/pre-commit, a hidden file or one in a hidden folder/,
  );

  // A block with no file at all.
  const none = coreFolder({ blocks: [rowsBlock({ texts: {} })] });
  assert.match(check(none).stdout, /blocks\[0\]\.files names no file: a block is its files/);
  assert.equal(check(none).status, 1);
});

test("a block may say what it is for; a description that is not words is a wrong shape", () => {
  const place = coreFolder({ blocks: [rowsBlock({ description: 7 })] });
  const wrong = check(place);
  assert.equal(wrong.status, 1);
  assert.match(wrong.stdout, /blocks\[0\]\.description/);
  assert.equal(check(coreFolder({ blocks: [rowsBlock({ description: undefined })] })).status, 0);
});

// ---- what the pinned copy holds ----------------------------------------------------------------

test("joining copies the files of every block into the member, and the pin holds each by its hash", () => {
  const dir = storeRepo();
  const place = coreFolder();
  const list = listIn();
  const before = snapshot(dir);
  assert.equal(join(dir, place, list, ["--dry-run"]).status, 0);
  assert.deepEqual(snapshot(dir), before);

  const joined = join(dir, place, list);
  assert.equal(joined.status, 0, joined.stderr);
  const pin = read(dir, PINNED_CORE.file).pin.files;
  for (const file of ["blocks/many-rows/order-rows.tsx", "blocks/many-rows/order-rows.test.tsx"]) {
    const copy = readFileSync(path.join(dir, "design/core", file));
    assert.deepEqual(copy, readFileSync(path.join(place, file)), file);
    assert.equal(pin.find((each) => each.file === file)?.sha256, sha(copy), file);
  }
  const pinned = readPinnedCore(dir);
  assert.equal(pinned.unreadable, null);
  assert.equal(pinned.files["blocks/many-rows/order-rows.tsx"], sha(ROWS_CODE));
  // Nothing of the member's own code was written: taking a block is a move of its own.
  assert.ok(!existsSync(path.join(dir, MAIN)));
});

test("a repository that joined before copies held the files of blocks still reads; the block is not offered until it pins again", () => {
  // A core with an empty store, as every core was: the copy is the three parts, and reads.
  const early = member({}, { blocks: [] });
  assert.equal(read(early.dir, PINNED_CORE.file).pin.files.length, 3);
  const none = entry(found(early.dir, early.list, "order", "rows"), "family");
  assert.deepEqual(
    { read: none.read, items: none.items, why: none.why },
    {
      read: ["design/sources/core.json", "design/core/blocks/index.json"],
      items: 0,
      why: null,
    },
  );

  // A copy as an older plugin would have written it for a store that is not empty: the list of
  // blocks, and none of their files.
  const { dir, place, list } = member();
  const declared = read(dir, PINNED_CORE.file);
  declared.pin.files = declared.pin.files.filter((each) => !each.file.startsWith("blocks/many-"));
  put(dir, PINNED_CORE.file, json(declared));
  rmSync(path.join(dir, "design/core/blocks/many-rows"), { recursive: true });
  assert.equal(readPinnedCore(dir).unreadable, null);
  const old = found(dir, list, "order", "rows");
  assert.deepEqual(old.matches, []);
  assert.match(
    entry(old, "family").why,
    /1 block is not offered here: OrderRows: this repository's copy of the core does not hold blocks\/many-rows\/order-rows\.tsx: .* pin it again with core --join/,
  );
  const refused = take(dir, list, "many-rows");
  assert.equal(refused.status, 2);
  assert.match(refused.stderr, /does not hold blocks\/many-rows\/order-rows\.tsx/);
  assert.ok(!existsSync(path.join(dir, MAIN)));
  // Pinning again brings the files, and the block is offered.
  assert.equal(join(dir, place, list).status, 0);
  assert.deepEqual(
    found(dir, list, "order", "rows").matches.map((match) => match.name),
    ["OrderRows"],
  );
});

// ---- criterion 10: tier 3 of the ladder ---------------------------------------------------------

test("criterion 10: on a member, find reads the blocks of the pinned copy at tier 3 and says what a match is", () => {
  const { dir, list } = member();
  const pin = readPinnedCore(dir).label;
  const result = found(dir, list, "order", "rows");
  assert.deepEqual(stores(result), [
    "intake",
    "components",
    "screen-kinds",
    "starter",
    "family",
    "sources",
  ]);
  assert.equal(result.matches.length, 1);
  const [match] = result.matches;
  assert.deepEqual(
    {
      name: match.name,
      kind: match.kind,
      store: match.store,
      tier: match.tier,
      need: match.need,
      description: match.description,
      adapters: match.adapters,
      source: match.source,
      pin: match.pin,
      files: match.files,
    },
    {
      name: "OrderRows",
      kind: "block",
      store: "family",
      tier: 3,
      need: "many-rows",
      description: "A table for many rows of one kind, with its empty state.",
      adapters: ["components", "source"],
      source: "core",
      pin,
      files: [COPY, "design/core/blocks/many-rows/order-rows.test.tsx"],
    },
  );
  assert.deepEqual(entry(result, "family"), {
    store: "family",
    tier: 3,
    read: ["design/sources/core.json", "design/core/blocks/index.json"],
    items: 1,
    found: true,
    why: null,
  });
  // The farther tier is not read once the family's store answers.
  assert.match(entry(result, "sources").why, /a nearer store answers/);
  // For a person: the need, the name, the description, the adapters, and the core at which pin.
  const shown = find(dir, list, "order", "rows");
  assert.equal(shown.status, 0);
  for (const line of [
    "1 match, in the family's store:",
    `  OrderRows (block, family): ${COPY}`,
    "    need: many-rows",
    "    A table for many rows of one kind, with its empty state.",
    "    needs the adapters: components, source",
    `    from: the family's core, pinned ${pin}`,
    "  3 family: design/sources/core.json, design/core/blocks/index.json, 1 piece; answers",
  ]) {
    assert.ok(shown.stdout.includes(`${line}\n`), line);
  }
  assert.match(
    shown.stdout,
    /next: OrderRows is a block of the family's core: take it in with intake --need many-rows/,
  );
  // A block with no description is offered all the same, by its name and its need.
  const plain = member({}, { blocks: [rowsBlock({ description: undefined })] });
  const bare = found(plain.dir, plain.list, "order", "rows").matches[0];
  assert.equal(bare.description, null);
  assert.equal(bare.name, "OrderRows");
});

test("criterion 10: the order of the tiers does not change: the starter kit answers before the family, and a source declared before the starter kit before both", () => {
  // The starter kit and the family's store both answer: the nearer one is the answer.
  const both = member(
    {},
    { blocks: [rowsBlock({ need: "label-while-action-waits", name: "HeldLabelOfTheFamily" })] },
  );
  const near = found(both.dir, both.list, "label-while-action-waits");
  assert.deepEqual(
    near.matches.map((match) => [match.name, match.store]),
    [["HeldLabel", "starter"]],
  );
  assert.match(entry(near, "family").why, /a nearer store answers/);

  // An outside source that answers the same words as the family's block.
  const catalog = json({ items: [{ name: "order-rows-kit", kind: "block", title: "Order rows" }] });
  const after = member({ "design/kit-catalog.json": catalog });
  assert.deepEqual(
    found(after.dir, after.list, "order", "rows").matches.map((match) => match.store),
    ["family"],
  );
  const before = member({
    "design/kit-catalog.json": catalog,
    "design/sources/kit.json": json({ ...source(), ladder_place: "before-starter" }),
  });
  const first = found(before.dir, before.list, "order", "rows");
  assert.deepEqual(
    first.matches.map((match) => [match.name, match.store]),
    [["order-rows-kit", "sources/kit"]],
  );
  const order = stores(first);
  assert.ok(order.indexOf("sources/kit") < order.indexOf("starter"));
  assert.ok(order.indexOf("starter") < order.indexOf("family"));
  for (const farther of ["starter", "family"]) {
    assert.match(entry(first, farther).why, /a nearer store answers/);
  }
});

test("criterion 10: on a repository of no family, the line of tier 3 says so, and nothing is read", () => {
  const dir = storeRepo();
  const list = listIn();
  const result = found(dir, list, "order", "rows");
  assert.deepEqual(entry(result, "family"), {
    store: "family",
    tier: 3,
    read: null,
    items: null,
    found: false,
    why: "this repository is of no family (core --join declares one)",
  });
  const shown = find(dir, list, "order", "rows");
  assert.ok(shown.stdout.includes(`${LONE}\n`));
  assert.ok(!existsSync(list), "no list of cores was made");
});

test("criterion 10, broken: a copy whose hashes differ makes tier 3 unread, with why, and the walk goes on to the next tier", () => {
  const catalog = json({ items: [{ name: "order-rows-kit", kind: "block", title: "Order rows" }] });
  for (const [file, named] of [
    [
      "design/core/answers.json",
      /design\/core\/answers\.json is not the file the core was pinned with/,
    ],
    // A file of a block changed in the copy: the pin holds it too.
    [
      COPY,
      /design\/core\/blocks\/many-rows\/order-rows\.tsx is not the file the core was pinned with/,
    ],
  ]) {
    const { dir, list } = member({ "design/kit-catalog.json": catalog });
    put(dir, file, `${text(dir, file)}\n`);
    const result = found(dir, list, "order", "rows");
    const family = entry(result, "family");
    assert.deepEqual(family.read, ["design/sources/core.json"], file);
    assert.equal(family.items, null, file);
    assert.match(family.why, /^the copy of the family core in design\/core cannot be read: /, file);
    assert.match(family.why, named, file);
    assert.match(family.why, /No block of it is offered; pin it again with core --join$/, file);
    // The next tier is read, and answers.
    assert.deepEqual(
      result.matches.map((match) => [match.name, match.store]),
      [["order-rows-kit", "sources/kit"]],
      file,
    );
    // Nothing of the copy is taken, and intake offers nothing of it.
    const refused = take(dir, list, "many-rows");
    assert.equal(refused.status, 2, file);
    assert.match(refused.stderr, /cannot be read .*pin it again with core --join/, file);
    assert.ok(!existsSync(path.join(dir, MAIN)), file);
    const asked = intakeJson(dir, list, "--need", "order-rows", "--dry-run").result;
    assert.ok(!asked.candidates.some((candidate) => candidate.store === "family"), file);
  }
});

test("criterion 10, broken: a block that needs an adapter the repository lacks is not offered, with why, as the starter kit does it", () => {
  // No package says the repository builds its screens with the library the source adapter reads.
  const { dir, list } = member({ "package.json": json({ dependencies: {} }) });
  const result = found(dir, list, "order", "rows");
  assert.deepEqual(result.matches, []);
  assert.equal(entry(result, "family").items, 0);
  assert.equal(
    entry(result, "family").why,
    "1 block is not offered here: OrderRows needs the source adapter",
  );
  assert.match(entry(result, "starter").why, /needs the source adapter/);
  const before = snapshot(dir);
  const refused = take(dir, list, "many-rows");
  assert.equal(refused.status, 2);
  assert.match(refused.stderr, /OrderRows needs the source adapter, which this repository lacks/);
  assert.deepEqual(snapshot(dir), before);
});

// ---- criterion 11: taken down, conformed, taken in ----------------------------------------------

// A repository with its design floor, adopted: the ledgers, the gate and the tool, the adapters the
// block needs, in git on its main branch.
function adopted() {
  const dir = path.join(empty(), "member-app");
  put(dir, "src/index.css", passingFloor(withoutBlock(text(ROOT, "src/index.css"))));
  put(dir, "Makefile", text(ROOT, "Makefile"));
  put(dir, "package.json", json({ dependencies: { react: "19.0.0" } }));
  put(dir, "components.json", json({ aliases: { ui: "@/components/ui" } }));
  put(dir, "src/components/ui/button.tsx", COMPONENT("Button"));
  const done = run(
    "adopt.mjs",
    ["--target", dir, "--conformance-level", "AA", "--product-type", "application"],
    listIn(),
  );
  assert.ok([0, 1].includes(done.status), done.stderr);
  return dir;
}
const manifest = (dir) =>
  spawnSync(
    execPath,
    [path.join(dir, "tools/design-assembly/components.mjs"), "--target", dir, "--write"],
    { encoding: "utf8" },
  );

test("criterion 11: a block of the core is taken down, conformed and taken in; the row names the core, the pin and the hashes; the gate is green", () => {
  const dir = adopted();
  const place = coreFolder({ colour: read(dir, "design/tokens.json").color.primary.$value });
  const list = listIn();
  git(dir, "init", "-q", "-b", "main");
  git(dir, "add", "-A");
  git(dir, "commit", "-q", "-m", "adopted");
  assert.equal(join(dir, place, list).status, 0);
  git(dir, "add", "-A");
  git(dir, "commit", "-q", "-m", "joined");
  git(dir, "checkout", "-q", "-b", "take-rows");
  const pin = readPinnedCore(dir).label;
  assert.equal(gate(dir).status, 0, gate(dir).stdout);

  // Asked first, as intake asks for any block: one question, the family's block first, no row.
  const asked = intakeJson(dir, list, "--need", "many-rows");
  assert.equal(asked.status, 1, asked.stderr);
  assert.equal(asked.result.rung, "family");
  assert.equal(asked.result.question, "asked");
  const [candidate] = asked.result.candidates;
  assert.deepEqual(
    {
      name: candidate.name,
      store: candidate.store,
      source: candidate.source,
      from: candidate.from,
      pin: candidate.pin,
      take: candidate.take,
      why: candidate.why,
    },
    {
      name: "OrderRows",
      store: "family",
      source: "many-rows",
      from: "core",
      pin,
      take: "core --take many-rows --need many-rows",
      why: "its need is many-rows",
    },
  );
  assert.match(
    candidate.brings.words,
    /^2 files of its own \(order-rows\.tsx, order-rows\.test\.tsx\); it needs the components and source adapters, which this repository has; copied from this repository's copy of the family core \(design\/core\), nothing fetched$/,
  );
  assert.equal(asked.result.candidates.at(-1).store, "by-hand");
  assert.deepEqual(blocksOf(dir), []);

  // Before the owner answers nothing more is written; once they keep it, intake names the move.
  assert.equal(intake(dir, list, "--need", "many-rows").status, 1);
  assert.equal(answerSheet(dir, "intake-many-rows keep", list).status <= 1, true);
  const waits = snapshot(dir);
  const told = intake(dir, list, "--need", "many-rows");
  assert.equal(told.status, 1);
  assert.match(told.stdout, /take-down move, not run: core --take many-rows --need many-rows/);
  assert.match(
    told.stdout,
    /take OrderRows down with core --take many-rows --need many-rows \(it copies the block's files from this repository's copy of the family core, fetches nothing/,
  );
  assert.deepEqual(snapshot(dir), waits);

  // Taken down: the files are copied into the repository, never linked, and the record starts.
  const dry = take(dir, list, "many-rows", "--dry-run");
  assert.equal(dry.status, 0, dry.stderr);
  assert.match(dry.stdout, /would take OrderRows down for many-rows/);
  assert.deepEqual(snapshot(dir), waits);
  const down = take(dir, list, "many-rows");
  assert.equal(down.status, 0, down.stdout + down.stderr);
  assert.equal(text(dir, MAIN), ROWS_CODE);
  assert.equal(text(dir, TEST), ROWS_TEST);
  assert.ok(!lstatIsLink(dir, MAIN));
  const record = read(dir, RECORD);
  const files = [
    { file: TEST, sha256: sha(ROWS_TEST) },
    { file: MAIN, sha256: sha(ROWS_CODE) },
  ];
  assert.deepEqual(record, {
    version: 1,
    need: "many-rows",
    source: "core",
    item: "many-rows",
    pin_sha256: blockPinOf(entryOf(rowsBlock()).files),
    taken: files,
    conformed: files,
    patches: [],
    exemptions: [],
  });
  assert.match(
    down.stdout,
    /next: intake --need many-rows --file src\/components\/order-rows\.tsx/,
  );
  assert.match(down.stdout, /nothing was fetched/);
  assert.equal(conform(dir, list, "--need", "many-rows").status, 0);
  // Taken down and not taken in: the row is not there yet.
  assert.deepEqual(blocksOf(dir), []);

  // Taken in: the row names the core as its source, with the pin and the hashes.
  const done = intake(dir, list, "--need", "many-rows", "--file", MAIN);
  assert.equal(done.status, 0, done.stdout + done.stderr);
  assert.deepEqual(blocksOf(dir), [
    {
      name: "OrderRows",
      file: MAIN,
      source: "many-rows",
      from: "core",
      pin,
      need: "many-rows",
      description: "A table for many rows of one kind, with its empty state.",
      approved: "2026-11-27",
      approved_by: "The Owner",
      taken: sha(ROWS_CODE),
      conform: RECORD,
    },
  ]);
  // The gate is green once the repository writes its component manifest again, its own step:
  // the shapes, the item taken down and choose-first hold on the branch.
  assert.equal(manifest(dir).status, 0);
  const green = gate(dir);
  assert.equal(green.status, 0, green.stdout + green.stderr);
  assert.doesNotMatch(green.stdout, /choose-first|taken-down|not in a git repository/);
  // The inventory finds nothing behind and nothing changed by hand.
  assert.deepEqual(findingsOf(dir, list, "outdated"), []);
  assert.deepEqual(findingsOf(dir, list, "modified"), []);

  // A second intake of the same need: the store answers, and nothing is written.
  const kept = snapshot(dir);
  const again = intakeJson(dir, list, "--need", "many-rows");
  assert.equal(again.status, 0, again.stderr);
  assert.equal(again.result.rung, "store");
  assert.match(
    again.result.next,
    /use OrderRows, src\/components\/order-rows\.tsx: the intake ledger has it/,
  );
  const retake = take(dir, list, "many-rows");
  assert.equal(retake.status, 0, retake.stderr);
  assert.match(retake.stdout, /is taken down for many-rows already/);
  assert.deepEqual(snapshot(dir), kept);
  // And find now answers from the repository's own store, saying where the block came from.
  const own = found(dir, list, "many", "rows").matches[0];
  assert.deepEqual(
    [own.store, own.tier, own.from, own.source, own.pin],
    ["intake", 1, "core", "many-rows", pin],
  );
});

function lstatIsLink(dir, file) {
  return spawnSync("test", ["-L", path.join(dir, file)]).status === 0;
}

test("criterion 11: a block may be taken for a need of the repository's own, into a folder it names", () => {
  const { dir, list } = member();
  assert.equal(intake(dir, list, "--need", "order-table", "order", "rows").status, 1);
  assert.equal(answerSheet(dir, "intake-order-table keep", list).status <= 1, true);
  // A folder outside the repository, one inside the copy of the core however its name is cased,
  // and a hidden one, are refused, and nothing is written.
  const untouched = snapshot(dir);
  for (const to of ["../elsewhere", "design/core/blocks", "Design/Core/x", ".git/hooks"]) {
    const refused = take(dir, list, "many-rows", "--need", "order-table", "--to", to);
    assert.equal(refused.status, 2, to);
    assert.deepEqual(snapshot(dir), untouched, to);
  }
  // A folder named by its full path is that folder: a file in the way there is still seen.
  put(dir, "src/components/orders/order-rows.tsx", COMPONENT("SomethingElse"));
  const whole = take(
    dir,
    list,
    "many-rows",
    "--need",
    "order-table",
    "--to",
    path.join(dir, "src/components/orders"),
  );
  assert.equal(whole.status, 2);
  assert.match(
    whole.stderr,
    /src\/components\/orders\/order-rows\.tsx is there already and is not the block's file/,
  );
  assert.ok(!existsSync(path.join(dir, dir.slice(1))), "no folder named after the full path");
  rmSync(path.join(dir, "src/components/orders"), { recursive: true });
  const down = take(
    dir,
    list,
    "many-rows",
    "--need",
    "order-table",
    "--to",
    "src/components/orders",
  );
  assert.equal(down.status, 0, down.stderr);
  const file = "src/components/orders/order-rows.tsx";
  assert.equal(text(dir, file), ROWS_CODE);
  assert.equal(read(dir, "design/conform/order-table.json").item, "many-rows");
  assert.equal(intake(dir, list, "--need", "order-table", "--file", file).status, 0);
  const row = blocksOf(dir).find((block) => block.need === "order-table");
  assert.deepEqual([row.source, row.from, row.file], ["many-rows", "core", file]);
});

test("criterion 11, broken: a file in the way is never written over, and a block the copy does not hold is named", () => {
  const { dir, list } = member({ [MAIN]: COMPONENT("SomethingElse") });
  const before = snapshot(dir);
  const refused = takeOwn(dir, list);
  assert.equal(refused.status, 2);
  assert.match(
    refused.stderr,
    /src\/components\/order-rows\.tsx is there already and is not the block's file: it is never written over; name another folder with --to\. Nothing was written/,
  );
  const unknown = take(dir, list, "no-such-block");
  assert.equal(unknown.status, 2);
  assert.match(unknown.stderr, /holds no block for no-such-block: it holds many-rows/);
  // A need the repository's ledger already answers with another block.
  const taken = take(dir, list, "many-rows", "--need", "filter-list", "--to", "src/components/x");
  assert.equal(taken.status, 2);
  assert.match(
    taken.stderr,
    /the intake ledger already answers filter-list with FilterBar: one need, one solution/,
  );
  assert.deepEqual(snapshot(dir), before);
  // A component of the block's name is in the repository already, somewhere else: find does not
  // offer the block, and it is not taken beside it, in whatever folder.
  const named = member({ "src/components/legacy/order-rows-old.tsx": COMPONENT("OrderRows") });
  assert.match(
    // Asked by words only the block's description holds, so the walk reaches tier 3.
    entry(found(named.dir, named.list, "empty", "state"), "family").why,
    /OrderRows is already in the repository/,
  );
  const kept = snapshot(named.dir);
  const twice = takeOwn(named.dir, named.list, "--to", "src/components/family");
  assert.equal(twice.status, 2);
  assert.match(
    twice.stderr,
    /OrderRows is already in the repository, in src\/components\/legacy\/order-rows-old\.tsx/,
  );
  assert.deepEqual(snapshot(named.dir), kept);
  // On a repository of no family there is no core to take from.
  const lone = take(storeRepo(), listIn(), "many-rows");
  assert.equal(lone.status, 2);
  assert.match(lone.stderr, /declares no family/);
});

test("criterion 11, broken: a block that breaks a mandatory rule is refused as any item is; another rule needs its exemption, which the owner is asked to keep", () => {
  const LEDGER = [
    "version: 1",
    "decisions:",
    "  - id: whole-class-names",
    "    layer: foundations",
    "    kind: standard",
    '    source: "class names are written whole"',
    '    check: "eslint:shadcn/require-static-classes"',
    "",
  ].join("\n");
  const off = (rule) => `// eslint-disable-next-line ${rule}\n${ROWS_CODE}`;
  // A rule a decision of the repository holds: patched, never turned off.
  const held = member(
    { "design/decisions.yaml": LEDGER },
    { blocks: [rowsBlock({ texts: { "order-rows.tsx": off("shadcn/require-static-classes") } })] },
  );
  assert.equal(intake(held.dir, held.list, "--need", "many-orders", "order", "rows").status, 1);
  assert.equal(answerSheet(held.dir, "intake-many-orders keep", held.list).status <= 1, true);
  const down = take(held.dir, held.list, "many-rows", "--need", "many-orders");
  assert.equal(down.status, 1, down.stdout + down.stderr);
  assert.match(down.stdout, /rules the block turns off, settled before it is taken in:/);
  assert.match(
    down.stdout,
    /src\/components\/order-rows\.tsx turns off shadcn\/require-static-classes, which the decision whole-class-names holds: a mandatory rule is patched, never turned off/,
  );
  const waits = snapshot(held.dir);
  const refused = intake(held.dir, held.list, "--need", "many-orders", "--file", MAIN);
  assert.equal(refused.status, 2);
  assert.match(
    refused.stderr,
    /a mandatory rule is patched, never turned off\. Nothing was written/,
  );
  const exempt = conform(
    held.dir,
    held.list,
    "--need",
    "many-orders",
    "--exempt",
    "shadcn/require-static-classes",
    "--file",
    MAIN,
    "--reason",
    "the family wrote it so",
  );
  assert.equal(exempt.status, 2);
  assert.match(exempt.stderr, /a mandatory rule is never exempted/);
  assert.deepEqual(snapshot(held.dir), waits);
  assert.ok(!blocksOf(held.dir).some((block) => block.need === "many-orders"));

  // A rule no decision holds: the block is let off it only by an exemption the owner keeps.
  const free = member(
    {},
    { blocks: [rowsBlock({ texts: { "order-rows.tsx": off("no-console") } })] },
  );
  assert.equal(intake(free.dir, free.list, "--need", "many-orders", "order", "rows").status, 1);
  assert.equal(answerSheet(free.dir, "intake-many-orders keep", free.list).status <= 1, true);
  const taken = take(free.dir, free.list, "many-rows", "--need", "many-orders");
  assert.equal(taken.status, 1);
  assert.match(taken.stdout, /turns off no-console, and the conform record has no exemption/);
  assert.equal(intake(free.dir, free.list, "--need", "many-orders", "--file", MAIN).status, 2);
  assert.equal(
    conform(
      free.dir,
      free.list,
      "--need",
      "many-orders",
      "--exempt",
      "no-console",
      "--file",
      MAIN,
      "--reason",
      "the block logs on purpose",
    ).status,
    0,
  );
  const asks = intakeJson(free.dir, free.list, "--need", "many-orders", "--file", MAIN);
  assert.equal(asks.status, 1);
  assert.equal(asks.result.waiting, "exemptions-many-orders");
  assert.equal(answerSheet(free.dir, "exemptions-many-orders keep", free.list).status <= 1, true);
  assert.equal(intake(free.dir, free.list, "--need", "many-orders", "--file", MAIN).status, 0);
  assert.equal(blocksOf(free.dir).find((block) => block.need === "many-orders").from, "core");
});

test("criterion 11: a folder the repository's configuration names is said before anything is written, and another folder has none of it", () => {
  // The formatter's ignore list names the folder the repository keeps its own components in.
  const { dir, list } = member({ ".prettierignore": "src/components/\n" });
  const before = snapshot(dir);
  const dry = takeOwn(dir, list, "--dry-run");
  assert.equal(dry.status, 1, dry.stdout + dry.stderr);
  assert.match(
    dry.stdout,
    /\.prettierignore names the folder src\/components of the item, so formatter-ignore is turned off for it/,
  );
  assert.match(
    dry.stdout,
    /the repository's configuration names src\/components, which is read as setting that folder apart from a rule: in a folder it does not name, given with --to DIR, the block is held to every rule\n/,
  );
  assert.deepEqual(snapshot(dir), before);
  const elsewhere = takeOwn(dir, list, "--to", "src/family");
  assert.equal(elsewhere.status, 0, elsewhere.stdout + elsewhere.stderr);
  assert.doesNotMatch(elsewhere.stdout, /rules the block turns off|configuration names/);
  assert.equal(text(dir, "src/family/order-rows.tsx"), ROWS_CODE);
});

// ---- criterion 11: behind the copy, and changed by hand -------------------------------------------

test("criterion 11: the inventory says a block is behind once the copy pinned holds a newer one, and not before; taking it down again clears it", () => {
  const { dir, place, list } = member();
  takenIn(dir, list);
  const lines = run("inventory.mjs", ["--target", dir], list).stdout;
  assert.ok(lines.includes("  family: 1 block\n"), lines);
  assert.deepEqual(
    findingsOf(dir, list, "outdated")
      .flatMap((item) => item.evidence)
      .filter((line) => /core/.test(line)),
    [],
  );

  // The family's answers move and the block does not: pinned again, the block is not behind, and
  // its record still holds.
  put(place, "answers.json", text(place, "answers.json").replace("#0246ff", "#0246fe"));
  const first = readPinnedCore(dir).label;
  assert.equal(join(dir, place, list).status, 0);
  assert.notEqual(readPinnedCore(dir).label, first);
  const coreLines = () =>
    findingsOf(dir, list, "outdated")
      .flatMap((item) => item.evidence)
      .filter((line) => /the family's core/.test(line));
  assert.deepEqual(coreLines(), []);
  assert.equal(conformOwn(dir, list).status, 0);

  // The core's block moves: until the repository pins again, nothing is said. The repository
  // wins, by pinning.
  const NEWER = `${ROWS_CODE}// a second empty state\n`;
  putBlocks(place, [
    rowsBlock({ texts: { "order-rows.tsx": NEWER, "order-rows.test.tsx": ROWS_TEST } }),
  ]);
  assert.deepEqual(coreLines(), []);
  assert.equal(join(dir, place, list).status, 0);
  const behind = coreLines();
  assert.equal(behind.length, 1);
  assert.match(
    behind[0],
    /^OrderRows was taken down for order-rows from the family's core, and the copy pinned now \([0-9a-f]{12}\) holds another many-rows \([0-9a-f]{12}, now [0-9a-f]{12}\): take it down again with core --take many-rows --need order-rows, then run conform --need order-rows --taken-down$/,
  );
  const finding = findingsOf(dir, list, "outdated").find((item) =>
    item.evidence.includes(behind[0]),
  );
  assert.deepEqual(finding.items, [
    { name: "OrderRows", file: TEST, kind: "block", origin: "external" },
  ]);
  // The repository's own file is as it was: nothing follows the core by itself.
  assert.equal(text(dir, MAIN), ROWS_CODE);
  assert.equal(conformOwn(dir, list).status, 1);

  // Taken down again: the file that changed is written, the record follows, nothing is behind.
  const down = takeOwn(dir, list);
  assert.equal(down.status, 0, down.stdout + down.stderr);
  assert.match(
    down.stdout,
    /took the newer OrderRows down for order-rows .*: 1 file of it changed/,
  );
  assert.match(down.stdout, /next: conform --need order-rows --taken-down/);
  assert.equal(text(dir, MAIN), NEWER);
  assert.equal(conformOwn(dir, list, "--taken-down").status, 0);
  assert.deepEqual(coreLines(), []);
  assert.equal(conformOwn(dir, list).status, 0);
  assert.equal(read(dir, OWN_RECORD).taken.find((each) => each.file === MAIN).sha256, sha(NEWER));
});

test("criterion 11, broken: a block changed by hand is reported as modified, and a newer block is never taken down over the hand edit", () => {
  const { dir, place, list } = member();
  takenIn(dir, list);
  assert.deepEqual(findingsOf(dir, list, "modified"), []);
  put(dir, MAIN, `${ROWS_CODE}// changed here by hand\n`);
  const changed = findingsOf(dir, list, "modified");
  assert.equal(changed.length, 1);
  assert.deepEqual(changed[0].items, [
    { name: "OrderRows", file: MAIN, kind: "block", origin: "external" },
  ]);
  assert.match(
    changed[0].evidence[0],
    /src\/components\/order-rows\.tsx is not the file the conform record design\/conform\/order-rows\.json holds after patching, and no patch records the change/,
  );

  putBlocks(place, [
    rowsBlock({
      texts: { "order-rows.tsx": `${ROWS_CODE}// newer\n`, "order-rows.test.tsx": ROWS_TEST },
    }),
  ]);
  assert.equal(join(dir, place, list).status, 0);
  const before = snapshot(dir);
  const refused = takeOwn(dir, list);
  assert.equal(refused.status, 2);
  assert.match(
    refused.stderr,
    /src\/components\/order-rows\.tsx is neither the file as taken down nor the file design\/conform\/order-rows\.json holds after patching: it was changed by hand/,
  );
  assert.deepEqual(snapshot(dir), before);

  // A block that gains a file between two pins is not patched over: the record is started afresh.
  const grown = member();
  takenIn(grown.dir, grown.list);
  putBlocks(grown.place, [
    rowsBlock({
      texts: {
        "order-rows.tsx": ROWS_CODE,
        "order-rows.test.tsx": ROWS_TEST,
        "order-rows.css": ".rows {}\n",
      },
    }),
  ]);
  assert.equal(join(grown.dir, grown.place, grown.list).status, 0);
  const more = takeOwn(grown.dir, grown.list);
  assert.equal(more.status, 2);
  assert.match(
    more.stderr,
    /the two are not the same files in one folder\. Remove design\/conform\/order-rows\.json and the block's files by hand, take the block down afresh/,
  );
});

test("a library someone named core is a library: its item is compared by its source's pin, as before", () => {
  // No family: the row of the sources ledger named core is a library with a catalog and a pin.
  const file = "src/components/core-kit/narrow-list.tsx";
  const code = COMPONENT("NarrowList");
  const dir = storeRepo({
    [file]: code,
    "design/sources/core.json": json({ ...source(), id: "core" }),
  });
  const list = listIn();
  assert.equal(readPinnedCore(dir), null);
  const started = conform(
    dir,
    list,
    "--need",
    "narrow-list",
    "--source",
    "core",
    "--item",
    "filter-bar",
    "--file",
    file,
  );
  assert.equal(started.status, 0, started.stderr);
  // The record keeps the hash of the library's pin, and the inventory compares it with that pin.
  assert.match(read(dir, "design/conform/narrow-list.json").pin_sha256, /^[0-9a-f]{64}$/);
  assert.deepEqual(
    findingsOf(dir, list, "outdated")
      .flatMap((item) => item.evidence)
      .filter((line) => /filter-bar/.test(line)),
    [],
  );
  put(dir, "design/sources/core.json", json({ ...source("2026-11-19T08:00:00.000Z"), id: "core" }));
  const behind = findingsOf(dir, list, "outdated").flatMap((item) => item.evidence);
  assert.ok(
    behind.some((line) =>
      /filter-bar was conformed for narrow-list at a pin of core that is not the one pinned now/.test(
        line,
      ),
    ),
    behind.join("\n"),
  );
  assert.equal(
    entry(found(dir, list, "order", "rows"), "family").why,
    "this repository is of no family (core --join declares one)",
  );
});

// ---- criterion 1: a repository of no family -------------------------------------------------------

const floor = () => {
  const dir = path.join(empty(), "lone-app");
  put(dir, "src/index.css", passingFloor(withoutBlock(text(ROOT, "src/index.css"))));
  put(dir, "Makefile", text(ROOT, "Makefile"));
  return dir;
};
const cache = {};
const copyOf = (kind, make) => {
  cache[kind] ??= make();
  const dir = path.join(empty(), path.basename(cache[kind]));
  cpSync(cache[kind], dir, { recursive: true });
  return dir;
};
const KINDS = {
  "no ledgers": floor,
  adopted: () =>
    copyOf("adopted", () => {
      const dir = floor();
      const done = run(
        "adopt.mjs",
        ["--target", dir, "--conformance-level", "AA", "--product-type", "application"],
        listIn(),
      );
      assert.ok([0, 1].includes(done.status), done.stderr);
      return dir;
    }),
  "built by the guide": () =>
    copyOf("guided", () => {
      const dir = floor();
      put(dir, "design/blueprint.json", blueprint());
      const done = run("apply.mjs", ["--target", dir], listIn());
      assert.equal(done.status, 0, done.stderr);
      return dir;
    }),
  "no Makefile": () => {
    const dir = path.join(empty(), "lone-app");
    put(dir, "src/index.css", passingFloor(withoutBlock(text(ROOT, "src/index.css"))));
    return dir;
  },
};

test("criterion 1: on a repository of no family, find, intake and inventory ask nothing new, write nothing new and keep their exit codes; only the line of tier 3 speaks of a family", () => {
  for (const [kind, make] of Object.entries(KINDS)) {
    const outcomes = [];
    // Once with no list of cores on this machine, once with one nobody can read.
    for (const broken of [false, true]) {
      const dir = make();
      const list = listIn();
      if (broken) writeFileSync(list, "{ not json");
      const before = snapshot(dir);
      const calls = [
        ["find.mjs", ["--target", dir, "many", "rows"]],
        ["find.mjs", ["--target", dir, "many", "rows", "--json"]],
        ["intake.mjs", ["--target", dir, "--need", "many-rows", "--dry-run"]],
        ["intake.mjs", ["--target", dir, "--need", "many-rows", "--dry-run", "--json"]],
        ["inventory.mjs", ["--target", dir]],
        ["inventory.mjs", ["--target", dir, "--json"]],
      ];
      const seen = calls.map(([script, args]) => {
        const done = run(script, args, list);
        const out = done.stdout.replaceAll(dir, "<dir>");
        if (script === "find.mjs" && !args.includes("--json")) {
          // The one line that changed: tier 3 says the repository is of no family.
          assert.equal(out.split("\n").filter((line) => line === LONE).length, 1, kind);
          assert.doesNotMatch(out.replace(LONE, ""), FAMILY_WORDS, `${kind}: ${script}`);
        } else if (script === "find.mjs") {
          const family = JSON.parse(out).searched.filter((each) => each.store === "family");
          assert.deepEqual(
            family.map((each) => [each.read, each.items, each.found]),
            [[null, null, false]],
            kind,
          );
        } else {
          assert.doesNotMatch(out, FAMILY_WORDS, `${kind}: ${script} ${args.join(" ")}`);
        }
        return [script, args.slice(2).join(" "), done.status, out];
      });
      // Nothing asked: no question about a family, and no candidate of a family's store.
      const asked = JSON.parse(seen[3][3]);
      assert.ok(!asked.candidates.some((candidate) => candidate.store === "family"), kind);
      assert.deepEqual(snapshot(dir), before, `${kind}: nothing written`);
      assert.equal(existsSync(list), broken, `${kind}: no list made`);
      // The same exit codes as these commands have always had on such a repository: find and a
      // dry intake end with 1 when nothing answers, the inventory with 0.
      assert.deepEqual(
        seen.map(([, , status]) => status),
        [1, 1, 1, 1, 0, 0],
        kind,
      );
      // Taking for real writes the question and nothing of a family.
      const real = run("intake.mjs", ["--target", dir, "--need", "many-rows"], list);
      assert.equal(real.status, 1, `${kind}: ${real.stderr}`);
      assert.ok(!existsSync(path.join(dir, PINNED_CORE.file)), kind);
      assert.ok(!existsSync(path.join(dir, "design/core")), kind);
      assert.ok(!existsSync(path.join(dir, "design/conform")), kind);
      outcomes.push(seen);
    }
    assert.deepEqual(outcomes[1], outcomes[0], kind);
  }
});

// ---- criterion 20: a separate working folder of git -----------------------------------------------

test("criterion 20: from a separate working folder of git, the walk, the intake, the inventory and the take-down print the same", () => {
  const { dir, list } = member();
  git(dir, "init", "-q", "-b", "main");
  git(dir, "add", "-A");
  git(dir, "commit", "-q", "-m", "joined");
  const work = path.join(path.dirname(dir), "member-work");
  assert.equal(git(dir, "worktree", "add", "-q", work).status, 0);
  const same = (script, args) => {
    const main = run(script, ["--target", dir, ...args], list);
    const other = run(script, ["--target", work, ...args], list);
    assert.equal(other.status, main.status, `${script} ${args.join(" ")}`);
    assert.equal(other.stdout, main.stdout, `${script} ${args.join(" ")}`);
    return main;
  };
  assert.equal(same("find.mjs", ["order", "rows"]).status, 0);
  assert.equal(
    same("intake.mjs", ["--need", "many-orders", "order", "rows", "--dry-run"]).status,
    1,
  );
  assert.equal(same("inventory.mjs", []).status, 0);
  assert.equal(
    same("core.mjs", ["--take", "many-rows", "--need", "many-orders", "--dry-run"]).status,
    0,
  );
  // Taken in from the separate folder, the block is that folder's: the main folder is not written.
  mkdirSync(path.join(work, "design/waiting"), { recursive: true });
  takenIn(work, list, "many-orders");
  assert.ok(existsSync(path.join(work, MAIN)));
  assert.ok(!existsSync(path.join(dir, MAIN)));
  assert.equal(blocksOf(work).find((block) => block.need === "many-orders").from, "core");
});

// ---- criteria 14 and 15: no network, and the family's name stays the user's -----------------------

test("no move of this slice reaches the network, and the family's name lands only in the copy of the core and the declaration", () => {
  const { dir, place, list } = member();
  const log = path.join(empty(), "network.log");
  const guarded = (script, args) =>
    run(script, ["--target", dir, ...args], list, {
      guard: true,
      env: { DESIGN_ASSEMBLY_NETWORK_LOG: log },
    });
  assert.equal(guarded("find.mjs", ["order", "rows"]).status, 0);
  assert.equal(guarded("intake.mjs", ["--need", "many-orders", "order", "rows"]).status, 1);
  assert.equal(answerSheet(dir, "intake-many-orders keep", list).status <= 1, true);
  assert.equal(guarded("core.mjs", ["--take", "many-rows", "--need", "many-orders"]).status, 0);
  assert.equal(guarded("conform.mjs", ["--need", "many-orders"]).status, 0);
  assert.equal(guarded("intake.mjs", ["--need", "many-orders", "--file", MAIN]).status, 0);
  assert.equal(guarded("inventory.mjs", []).status, 0);
  assert.equal(
    run("core.mjs", ["--check", "--core", place], list, {
      guard: true,
      env: { DESIGN_ASSEMBLY_NETWORK_LOG: log },
    }).status,
    0,
  );
  assert.ok(!existsSync(log) || readFileSync(log, "utf8") === "", "the network was reached");

  // In the member, the name is in its declaration and its copy of the core, and nowhere else: not
  // in the row, the conform record, the question or the block's code.
  const holding = snapshot(dir)
    .filter((line) => !line.endsWith("/"))
    .map((line) => line.split(" ")[0])
    .filter((file) => readFileSync(path.join(dir, file), "utf8").includes(FAMILY));
  assert.deepEqual(holding.sort(), ["design/core/core.json", PINNED_CORE.file]);
  // The plugin's files of this slice name no family.
  for (const file of ["scripts/core-blocks.mjs", "scripts/core-take.mjs"]) {
    const words = readFileSync(path.join(PLUGIN, file), "utf8").toLowerCase();
    assert.ok(!words.includes(FAMILY.toLowerCase()) && !words.includes("lantern"), file);
  }
});
