// The family's owner promotes a block into the core, slice 3 of item 7.2 (spec 0016, criteria 1, 15,
// 20 and 21; answer 13): only a block with a row in the intake ledger of a repository of the family;
// never one the repository took from this core, a piece of the starter kit, or one of an outside
// source without its licence line and a person's word; the store's entry with each file's hash,
// the adapters, the repository, who, when, why, and no second use yet; the move writes only in the
// core folder and says first what it writes; a need the core answers is refused with the way to
// replace it, and the replace records who and why. Then a member pins the core, finds the block at
// tier 3 and takes it in. Nothing calls a model or the network, and each test keeps its own list.
import "./helpers/own-cores.mjs";
import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import path from "node:path";
import { after, test } from "node:test";

import { familyCoreProblems } from "../templates/tools/design-assembly/contract.mjs";
import { readIntakeLedger } from "../templates/tools/design-assembly/intake-ledger.mjs";
import { ledgerText } from "../templates/tools/design-assembly/screen-fragments.mjs";

import {
  answerSheet,
  cleanUp,
  coreFolder,
  empty,
  FAMILY,
  git,
  join,
  json,
  listIn,
  OWNER,
  put,
  read,
  run,
  sha,
  snapshot,
  storeRepo,
  text,
} from "./helpers/core-blocks-repo.mjs";
import { BLOCKS, COMPONENT, healthyFiles, intake, source } from "./helpers/store-repo.mjs";

after(cleanUp);

const ON = "2026-11-28";
const WHY = "Every product of the family filters its lists";
const core = (args, list, extra) => run("core.mjs", args, list, extra);
const promote = (dir, place, list, need, more = []) =>
  core(
    [
      "--target",
      dir,
      "--promote",
      need,
      "--core",
      place,
      "--by",
      OWNER,
      "--why",
      WHY,
      "--on",
      ON,
      ...more,
    ],
    list,
    { guard: true },
  );
const FILTER_BAR = COMPONENT("FilterBar");
// A member of the fixture core, with the store of its own of the store's tests: FilterBar is its own
// block (filter-list), DataRegion came from the outside source kit (many-rows), TableActions from
// the starter kit (row-actions-column).
function member(files = {}, name = "member-app") {
  const dir = storeRepo(files, name);
  const place = coreFolder({ blocks: [] });
  const list = listIn();
  const joined = join(dir, place, list);
  assert.equal(joined.status, 0, joined.stdout + joined.stderr);
  return { dir, place, list };
}

// ---- criterion 21 ------------------------------------------------------------------------------

test("a block of the repository's own store is promoted: its files with their hashes, the adapters, the repository, who, when, why, and no second use yet", () => {
  const { dir, place, list } = member();
  const before = snapshot(dir);
  const coreBefore = snapshot(place);

  // The preview prints every file it would write in the core, and writes nothing.
  const dry = promote(dir, place, list, "filter-list", ["--dry-run"]);
  assert.equal(dry.status, 0, dry.stderr);
  assert.match(
    dry.stdout,
    /would promote FilterBar \(filter-list\) from member-app: no second use yet/,
  );
  assert.match(dry.stdout, /would write, in the core folder only:/);
  assert.match(dry.stdout, /create +.*blocks\/filter-list\/filter-bar\.tsx/);
  assert.match(dry.stdout, /update +.*blocks\/index\.json/);
  assert.deepEqual(snapshot(place), coreBefore);
  assert.deepEqual(snapshot(dir), before);

  const done = promote(dir, place, list, "filter-list");
  assert.equal(done.status, 0, done.stderr);
  assert.match(
    done.stdout,
    /promoted FilterBar \(filter-list\) from member-app: no second use yet/,
  );
  assert.match(
    done.stdout,
    /adapters: components, source \(the kinds a block of code needs that member-app has/,
  );
  assert.match(done.stdout, /nothing was written in member-app/);
  // The repository is read and never written.
  assert.deepEqual(snapshot(dir), before);
  const [entry] = read(place, "blocks/index.json").blocks;
  assert.deepEqual(entry, {
    need: "filter-list",
    name: "FilterBar",
    files: [{ file: "filter-bar.tsx", sha256: sha(FILTER_BAR) }],
    adapters: ["components", "source"],
    used_by: ["member-app"],
    promoted: { by: OWNER, on: ON, why: WHY },
    second_use: false,
  });
  assert.equal(text(place, "blocks/filter-list/filter-bar.tsx"), FILTER_BAR);
  // The core holds its shape, and only the store changed in it.
  assert.deepEqual(familyCoreProblems(place), []);
  assert.equal(core(["--check", "--core", place], list).status, 0);
  const changed = snapshot(place).filter((line) => !coreBefore.includes(line));
  assert.deepEqual(
    changed.map((line) => line.split(" ")[0]),
    ["blocks/filter-list/", "blocks/filter-list/filter-bar.tsx", "blocks/index.json"],
  );
  // The member sees the store differs, block by block.
  const moved = core(["--target", dir, "--moved"], list);
  assert.match(
    moved.stdout,
    new RegExp(
      `block added: FilterBar \\(filter-list\\); promoted by ${OWNER} on ${ON}, because ${WHY}; no second use yet`,
    ),
  );
});

test("only a block with a row may be promoted: a need or a file with none is refused, and the refusal says how a block gets one", () => {
  const { dir, place, list } = member();
  const before = snapshot(place);
  for (const named of ["no-such-need", "src/pages/Team.tsx"]) {
    const refused = promote(dir, place, list, named);
    assert.equal(refused.status, 2, named);
    assert.match(
      refused.stderr,
      /a block gets its row when intake takes it in: find, then the owner's yes on the decision sheet, then intake --need NEED --file PATH/,
    );
    assert.match(refused.stderr, /Nothing was written/);
  }
  // A file a row names is the row's block.
  const byFile = promote(dir, place, list, "src/components/filter-bar.tsx", ["--dry-run"]);
  assert.equal(byFile.status, 0, byFile.stderr);
  assert.match(byFile.stdout, /FilterBar \(filter-list\)/);
  assert.deepEqual(snapshot(place), before);
});

test("a piece of the starter kit, and a block taken from this very core, are refused: every repository has the one, and the other is the core's", () => {
  const { dir, place, list } = member();
  const starter = promote(dir, place, list, "row-actions-column");
  assert.equal(starter.status, 2);
  assert.match(
    starter.stderr,
    /TableActions is a piece of the starter kit: every repository has it from the plugin/,
  );

  // A row that says the block came from the core.
  const fromCore = member({
    "design/intake.yaml": intake([
      ...BLOCKS,
      {
        name: "OrderRows",
        file: "src/components/order-rows.tsx",
        source: "many-rows",
        from: "core",
        pin: "0123456789ab",
        need: "order-rows",
      },
    ]),
    "src/components/order-rows.tsx": COMPONENT("OrderRows"),
  });
  const refused = promote(fromCore.dir, fromCore.place, fromCore.list, "order-rows");
  assert.equal(refused.status, 2);
  assert.match(
    refused.stderr,
    /OrderRows was taken from the family core at 0123456789ab: it is the core's already/,
  );
  assert.match(refused.stderr, /core --propose order-rows --block/);
  assert.deepEqual(read(fromCore.place, "blocks/index.json").blocks, []);
});

test("a block of an outside source: no licence line is refused; a licence line is shown and waits on a person's word; given, the core records it", () => {
  // The source of the store's tests states no licence.
  const { dir, place, list } = member();
  const none = promote(dir, place, list, "many-rows");
  assert.equal(none.status, 2);
  assert.match(none.stderr, /came from the outside source kit, whose row states no licence line/);
  assert.match(
    none.stderr,
    /Write the source's licence line \(licence, in design\/sources\/kit\.json\)/,
  );

  // A row whose source no source of the repository names, and whose word for made by hand the
  // ledger does not give: which it is, the refusal says how to tell.
  const unpinned = member({
    "design/sources/kit.json": null,
    "design/kit-catalog.json": null,
    "design/intake.yaml": intake([{ ...BLOCKS[0], from: undefined }, BLOCKS[1], BLOCKS[2]]),
  });
  const unknown = promote(unpinned.dir, unpinned.place, unpinned.list, "many-rows");
  assert.equal(unknown.status, 2);
  assert.match(
    unknown.stderr,
    /says it came from data-grid-1, which is no source this repository pins, and the intake ledger does not say data-grid-1 is its word for made by hand/,
  );
  assert.match(unknown.stderr, /values: \{ by-hand: data-grid-1 \}/);

  const LINE = "MIT: the code may be copied and passed on with its notice";
  const licensed = member({ "design/sources/kit.json": json({ ...source(), licence: LINE }) });
  const before = snapshot(licensed.place);
  const asked = promote(licensed.dir, licensed.place, licensed.list, "many-rows");
  assert.equal(asked.status, 1, asked.stderr);
  assert.match(asked.stdout, new RegExp(`whose licence line says:\\n  ${LINE}`));
  assert.match(asked.stdout, /run this again with --licence-allows/);
  assert.match(asked.stdout, /nothing was written/);
  assert.deepEqual(snapshot(licensed.place), before);

  const given = promote(licensed.dir, licensed.place, licensed.list, "many-rows", [
    "--licence-allows",
  ]);
  assert.equal(given.status, 0, given.stderr);
  assert.match(
    given.stdout,
    new RegExp(
      `licence: ${LINE} \\(from kit; ${OWNER} said on ${ON} it allows passing the code on\\)`,
    ),
  );
  const [entry] = read(licensed.place, "blocks/index.json").blocks;
  assert.deepEqual(entry.licence, { source: "kit", words: LINE, allowed: { by: OWNER, on: ON } });
  assert.equal(core(["--check", "--core", licensed.place], licensed.list).status, 0);
});

test("a need the core answers is refused with the way to replace it; the replace records who, when and why, and a member sees it", () => {
  const { dir, place, list } = member();
  assert.equal(promote(dir, place, list, "filter-list").status, 0);
  const again = promote(dir, place, list, "filter-list");
  assert.equal(again.status, 2);
  assert.match(
    again.stderr,
    /the core answers filter-list already, with FilterBar \(promoted by Ana Reyes on 2026-11-28\): to replace its files with these, add --replace/,
  );

  // The same files: nothing changes.
  const same = promote(dir, place, list, "filter-list", ["--replace"]);
  assert.equal(same.status, 0, same.stderr);
  assert.match(
    same.stdout,
    /holds these files already: this changes nothing, and nothing was written/,
  );

  const newer = `${FILTER_BAR}// narrows by several words\n`;
  put(dir, "src/components/filter-bar.tsx", newer);
  const replaced = core(
    [
      "--target",
      dir,
      "--promote",
      "filter-list",
      "--core",
      place,
      "--by",
      OWNER,
      "--why",
      "Narrows by several words",
      "--on",
      "2026-11-29",
      "--replace",
    ],
    list,
  );
  assert.equal(replaced.status, 0, replaced.stderr);
  assert.match(
    replaced.stdout,
    /replaced the files of FilterBar \(filter-list\) with those of member-app/,
  );
  const [entry] = read(place, "blocks/index.json").blocks;
  assert.deepEqual(entry.history, [
    {
      was: { files: [{ file: "filter-bar.tsx", sha256: sha(FILTER_BAR) }] },
      became: { files: [{ file: "filter-bar.tsx", sha256: sha(newer) }] },
      by: OWNER,
      on: "2026-11-29",
      why: "Narrows by several words",
    },
  ]);
  assert.equal(text(place, "blocks/filter-list/filter-bar.tsx"), newer);
  assert.equal(core(["--check", "--core", place], list).status, 0);
  // A history that does not end at the block's files is wrong.
  const wrong = read(place, "blocks/index.json");
  wrong.blocks[0].history[0].became.files[0].sha256 = sha("another");
  put(place, "blocks/index.json", json(wrong));
  assert.match(core(["--check", "--core", place], list).stdout, /became is not the block's files/);
});

test("wrong calls write nothing: no person, no reason, an e-mail address, an unknown adapter, an adapter the repository lacks, a core of a newer shape, a repository of no family", () => {
  const { dir, place, list } = member();
  const before = snapshot(place);
  const call = (more) =>
    core(["--target", dir, "--promote", "filter-list", "--core", place, ...more], list);
  for (const [more, why] of [
    [["--why", WHY], /say who answers for the family, with --by NAME/],
    [["--by", OWNER], /say why, once, with --why TEXT/],
    [["--by", "ana@example.invalid", "--why", WHY], /--by holds an e-mail address/],
    [["--by", OWNER, "--why", "ask ana@example.invalid"], /--why holds an e-mail address/],
    [["--by", OWNER, "--why", WHY, "--adapter", "magic"], /--adapter magic is no kind of adapter/],
    [["--by", OWNER, "--why", WHY, "--adapter", "lint"], /this repository has no lint adapter/],
    [["--by", OWNER, "--why", WHY, "--block"], /--block is not taken by --promote/],
  ]) {
    const refused = call(more);
    assert.equal(refused.status, 2, more.join(" "));
    assert.match(refused.stderr, why);
  }
  assert.deepEqual(snapshot(place), before);

  // A core of a newer shape: nothing is written, and the plugin says to update.
  const newer = read(place, "answers.json");
  put(place, "answers.json", json({ ...newer, version: 3 }));
  const refused = promote(dir, place, list, "filter-list");
  assert.equal(refused.status, 2);
  assert.match(
    refused.stderr,
    /has shape 3 and this tool knows shape 2 of a family core: update the design-assembly plugin/,
  );
  put(place, "answers.json", json(newer));

  // A repository of no family is not one the core's blocks come from.
  const alone = storeRepo({}, "alone-app");
  const stranger = promote(alone, place, list, "filter-list");
  assert.equal(stranger.status, 2);
  assert.match(
    stranger.stderr,
    /alone-app is neither the first repository of the family .* nor one of its members/,
  );
  assert.deepEqual(snapshot(place), before);
});

// ---- the whole path: promoted, pinned by a member, found at tier 3, taken in --------------------

test("after a promotion the core holds; a member that pins it finds the block at tier 3 and takes it in", () => {
  const { dir, place, list } = member();
  assert.equal(promote(dir, place, list, "filter-list").status, 0);
  assert.equal(core(["--check", "--core", place], list).status, 0);

  // A second repository of the family, with no FilterBar of its own.
  const other = storeRepo(
    {
      "src/components/filter-bar.tsx": null,
      "src/pages/Team.tsx": "export default function Team() {\n  return null;\n}\n",
      "design/intake.yaml": intake([BLOCKS[0], BLOCKS[2]]),
    },
    "second-app",
  );
  const joined = join(other, place, list);
  assert.equal(joined.status, 0, joined.stdout + joined.stderr);
  assert.match(joined.stdout, /the copy holds the code of 1 block, 1 file/);
  const found = JSON.parse(
    run("find.mjs", ["--target", other, "filter", "bar", "--json"], list).stdout,
  );
  const family = found.searched.find((each) => each.store === "family");
  assert.equal(family.items, 1);
  // Asked, kept by the owner, taken down, taken in.
  assert.equal(
    run("intake.mjs", ["--target", other, "--need", "filter-list", "bar"], list).status,
    1,
  );
  assert.ok(answerSheet(other, "intake-filter-list keep", list).status <= 1);
  const down = core(["--target", other, "--take", "filter-list"], list);
  assert.equal(down.status, 0, down.stdout + down.stderr);
  const taken = run(
    "intake.mjs",
    ["--target", other, "--need", "filter-list", "--file", "src/components/filter-bar.tsx"],
    list,
  );
  assert.equal(taken.status, 0, taken.stdout + taken.stderr);
  const rows = readIntakeLedger(ledgerText(other, "design/intake.yaml", "intake")).blocks;
  const row = rows.find((each) => each.need === "filter-list");
  assert.equal(row.from, "core");
  assert.equal(row.source, "filter-list");
  assert.equal(text(other, "src/components/filter-bar.tsx"), FILTER_BAR);
});

// ---- criteria 1, 15 and 20 ---------------------------------------------------------------------

test("from a separate working folder of git the repository is the same: promoted from either, the store names the main folder", () => {
  const { dir, place, list } = member();
  git(dir, "init", "-q", "-b", "main");
  git(dir, "add", "-A");
  git(dir, "commit", "-q", "-m", "joined");
  const work = path.join(path.dirname(dir), "member-work");
  assert.equal(git(dir, "worktree", "add", "-q", work).status, 0);
  const main = promote(dir, place, list, "filter-list", ["--dry-run", "--json"]);
  const other = promote(work, place, list, "filter-list", ["--dry-run", "--json"]);
  assert.equal(other.status, main.status);
  assert.deepEqual(JSON.parse(other.stdout).block, JSON.parse(main.stdout).block);
  assert.equal(promote(work, place, list, "filter-list").status, 0);
  assert.deepEqual(read(place, "blocks/index.json").blocks[0].used_by, ["member-app"]);
});

test("a repository that stands alone is as before; the family's name lands only in the core and a member's declaration and copy", () => {
  // Alone: the moves of a member say there is no family, and write nothing.
  const alone = storeRepo({}, "alone-app");
  const list = listIn();
  const before = snapshot(alone);
  const proposed = core(
    ["--target", alone, "--propose", "filter-list", "--block", "--by", OWNER, "--why", WHY],
    list,
  );
  assert.equal(proposed.status, 2);
  assert.match(proposed.stderr, /this repository declares no family/);
  for (const script of ["status.mjs", "inventory.mjs"]) {
    const said = run(script, ["--target", alone], list);
    assert.doesNotMatch(said.stdout, /proposal|retired by|promoted by/i, script);
  }
  assert.deepEqual(snapshot(alone), before);

  const { dir, place } = member();
  const member2 = listIn();
  assert.equal(promote(dir, place, member2, "filter-list").status, 0);
  const holding = snapshot(dir)
    .filter((line) => !line.endsWith("/"))
    .map((line) => line.split(" ")[0])
    .filter((file) => text(dir, file).includes(FAMILY));
  assert.ok(
    holding.every((file) => file.startsWith("design/core/") || file === "design/sources/core.json"),
    holding.join(", "),
  );
  assert.ok(text(place, "core.json").includes(FAMILY));
  assert.ok(!text(place, "blocks/index.json").includes(FAMILY));
  assert.ok(empty());
});

// ---- a package that keeps no src/ folder (item 7.4, decision 0120) ------------------------------

// The store fixture as a package whose source is its root: its TypeScript settings map `@/` there,
// so components live in components/ and no src/ exists.
function rootPackage(name, drop = []) {
  const dir = path.join(empty(), name);
  for (const [file, content] of Object.entries(healthyFiles())) {
    const moved = file.replace(/^src\//, "");
    if (drop.includes(moved)) continue;
    put(dir, moved, content.replaceAll("src/components/", "components/"));
  }
  put(dir, "tsconfig.json", '{\n  "compilerOptions": { "paths": { "@/*": ["./*"] } }\n}\n');
  put(dir, "design/theme.json", json({ version: 1, checks: {} }));
  return dir;
}

test("in a package with no src/ folder, a block is promoted from where its row names it, and taken into the package's own components folder", () => {
  const first = rootPackage("first-root");
  assert.equal(existsSync(path.join(first, "src")), false);
  const place = coreFolder({ blocks: [] });
  const list = listIn();
  assert.equal(join(first, place, list).status, 0);
  const done = promote(first, place, list, "filter-list");
  assert.equal(done.status, 0, done.stdout + done.stderr);
  assert.equal(text(place, "blocks/filter-list/filter-bar.tsx"), FILTER_BAR);
  assert.deepEqual(read(place, "blocks/index.json").blocks[0].adapters, ["components", "source"]);

  // A second package of the same kind, without FilterBar, takes it in.
  const other = rootPackage("second-root", ["components/filter-bar.tsx", "pages/Team.tsx"]);
  put(
    other,
    "design/intake.yaml",
    intake([BLOCKS[0], BLOCKS[2]]).replaceAll("src/components/", "components/"),
  );
  assert.equal(join(other, place, list).status, 0);
  assert.equal(
    run("intake.mjs", ["--target", other, "--need", "filter-list", "filter", "bar"], list).status,
    1,
  );
  assert.ok(answerSheet(other, "intake-filter-list keep", list).status <= 1);
  const down = core(["--target", other, "--take", "filter-list"], list);
  assert.equal(down.status, 0, down.stdout + down.stderr);
  assert.match(down.stdout, /create +components\/filter-bar\.tsx/);
  assert.equal(existsSync(path.join(other, "src")), false, "no src/ is made");
  const taken = run(
    "intake.mjs",
    ["--target", other, "--need", "filter-list", "--file", "components/filter-bar.tsx"],
    list,
  );
  assert.equal(taken.status, 0, taken.stdout + taken.stderr);
  const row = readIntakeLedger(ledgerText(other, "design/intake.yaml", "intake")).blocks.find(
    (each) => each.need === "filter-list",
  );
  assert.equal(row.file, "components/filter-bar.tsx");
  assert.equal(row.from, "core");
});
