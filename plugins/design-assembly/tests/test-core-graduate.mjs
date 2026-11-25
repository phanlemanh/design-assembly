// The proposal to graduate, slice 2 of item 7.2 (spec 0016, criteria 1, 13, 15, 18 and 20; answer
// 6): when find or intake in a member meets a need another repository of the family answered and
// the family's store does not hold, the output says which repository, the block's name and what it
// is for, and names the next step, never taking anything from that repository; the periodic line
// of status says how many needs of the family wait on a graduation, and which. The question is a
// proposal in the core folder, of a kind of its own; the family's owner grants it, choosing one
// block where two repositories answered the need in two ways, and the promotion is carried out in
// the repository that has the block, by the owner's word. A refusal is kept and the block is not
// proposed again; a need the core retired is not proposed; a repository that lacks an adapter a
// block of code needs is not proposed to. Then the whole path: granted, promoted, pinned, found
// at tier 3, taken in, and the store's entry says a second use.
// Nothing calls a model or the network, and each test keeps its own list of cores.
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { after, test } from "node:test";

import {
  answerSheet,
  cleanUp,
  empty,
  FAMILY,
  git,
  listIn,
  MEMBER,
  OWNER,
  PLUGIN,
  put,
  read,
  run,
  snapshot,
  text,
} from "./helpers/core-blocks-repo.mjs";
import { cleanup } from "./helpers/core-family.mjs";
import {
  core,
  family,
  FILTER_BAR,
  FILTER_BAR_ROW,
  joined,
  json,
  ledgerOf,
  ON,
  promote,
  repoOf,
  report,
  SAYS,
  TABLE_ACTIONS_ROW,
  WHY,
  withoutFilterBar,
} from "./helpers/family-needs.mjs";
import { KINDS, observe, readRecord } from "./helpers/four-kinds.mjs";
import { healthyFiles, source } from "./helpers/store-repo.mjs";

after(cleanUp);
after(cleanup);

const ID = "graduation-filter-list-1";
const YES = "Both products filter their lists the same way";
const find = (dir, list, words, more = []) =>
  run("find.mjs", ["--target", dir, ...words, ...more], list, { guard: true });
const found = (dir, list, words) => JSON.parse(find(dir, list, words, ["--json"]).stdout);
const status = (dir, list) => run("status.mjs", ["--target", dir], list, { guard: true }).stdout;
const periodic = (dir, list) => /^ {2}periodically.*$/m.exec(status(dir, list))?.[0] ?? "";
const sessionLine = (dir, list) => run("session-line.mjs", ["--target", dir], list).stdout;
const propose = (dir, list, need = "filter-list", more = []) =>
  core(
    [
      "--target",
      dir,
      "--propose",
      need,
      "--graduate",
      "--by",
      MEMBER,
      "--why",
      WHY,
      "--on",
      ON,
      ...more,
    ],
    list,
    { guard: true },
  );
const answer = (move, place, list, more = [], id = ID) =>
  core([move, id, "--core", place, "--by", OWNER, "--why", YES, "--on", ON, ...more], list, {
    guard: true,
  });
const proposals = (place, list) => core(["--proposals", "--core", place], list);
const check = (place, list) => core(["--check", "--core", place], list);

// The family of the tests: the first repository told the core what it answered, and a second
// repository, with no FilterBar of its own, joined after.
function asking() {
  const { first, place, list } = family({ firstRows: [FILTER_BAR_ROW, TABLE_ACTIONS_ROW] });
  assert.equal(report(first, list, ["--core", place]).status, 0);
  const dir = withoutFilterBar("second-app");
  joined(dir, place, list);
  return { first, place, list, dir };
}

// ---- criterion 13, at the moment of need -------------------------------------------------------

test("find in a member meets a need another repository of the family answered: it says which, the block's name and what it is for, and names the next step; the ladder's order is as it was", () => {
  const { place, list, dir, first } = asking();
  const before = snapshot(dir);
  const coreBefore = snapshot(place);
  const firstBefore = snapshot(first);

  // No store answers "long list": the family is where the walk ends.
  const said = find(dir, list, ["long", "list"]);
  assert.equal(said.status, 1);
  assert.match(said.stdout, /in the family, not in its store yet/);
  assert.match(said.stdout, /FilterBar \(need filter-list\), answered by first-app/);
  assert.ok(said.stdout.includes(SAYS["filter-list"]));
  assert.match(
    said.stdout,
    /next: FilterBar answers this in first-app, a repository of the family/,
  );
  assert.match(
    said.stdout,
    /ask the family's owner to promote it with core --propose filter-list --graduate/,
  );
  assert.match(said.stdout, /nothing is taken from first-app directly/);
  const data = found(dir, list, ["long", "list"]);
  assert.deepEqual(data.family_needs, [
    {
      repository: "first-app",
      need: "filter-list",
      name: "FilterBar",
      description: SAYS["filter-list"],
      proposed: true,
    },
  ]);
  assert.deepEqual(data.matches, []);
  // The stores are walked in the order they always were, and the family's store stays tier 3.
  assert.deepEqual(
    data.searched.map((entry) => [entry.tier, entry.store]),
    [
      [1, "intake"],
      [1, "components"],
      [1, "screen-kinds"],
      [2, "starter"],
      [3, "family"],
      [4, "sources/kit"],
    ],
  );

  // An outside source answers "filter bar": the family is nearer, so the question comes first.
  const outside = found(dir, list, ["filter", "bar"]);
  assert.equal(outside.matches[0].tier, 4);
  assert.equal(outside.family_needs.length, 1);
  assert.match(outside.next, /before a block is made or taken from outside/);

  // Reading wrote nothing, here, in the core or in the repository that has the block.
  assert.deepEqual(snapshot(dir), before);
  assert.deepEqual(snapshot(place), coreBefore);
  assert.deepEqual(snapshot(first), firstBefore);

  // A member that answered the need itself is told nothing: its own store is nearest.
  const third = repoOf("third-app");
  joined(third, place, list);
  const own = found(third, list, ["filter", "bar"]);
  assert.equal(own.matches[0].tier, 1);
  assert.deepEqual(own.family_needs, []);
  assert.doesNotMatch(find(third, list, ["filter", "bar"]).stdout, /in the family/);
});

test("of two needs of the family that hold the words, the one given whole by its key is said first", () => {
  const { first, place, list } = family({
    firstRows: [
      {
        ...FILTER_BAR_ROW,
        need: "wide-trim",
        name: "WideTrim",
        description: "A trim cell for wide screens",
      },
      {
        ...FILTER_BAR_ROW,
        need: "trim-cell",
        name: "TrimText",
        description: "Trims a long text in a cell",
      },
    ],
  });
  assert.equal(report(first, list, ["--core", place]).status, 0);
  const dir = withoutFilterBar("second-app");
  joined(dir, place, list);
  const data = found(dir, list, ["trim", "cell"]);
  assert.deepEqual(
    data.family_needs.map((one) => one.need),
    ["trim-cell", "wide-trim"],
  );
  assert.match(data.next, /core --propose trim-cell --graduate/);
});

test("intake says the same before it asks the owner, and offers nothing of another repository: the question's candidates are the stores' own", () => {
  const { place, list, dir } = asking();
  const coreBefore = snapshot(place);
  const asked = run(
    "intake.mjs",
    ["--target", dir, "--need", "filter-list", "long", "list", "--json"],
    list,
    { guard: true },
  );
  assert.equal(asked.status, 1, asked.stderr);
  const result = JSON.parse(asked.stdout);
  assert.equal(result.family_needs[0].repository, "first-app");
  assert.ok(
    result.notes.some((note) =>
      /in the family, not in its store yet: FilterBar \(need filter-list\), answered by first-app/.test(
        note,
      ),
    ),
  );
  assert.ok(result.notes.some((note) => /core --propose filter-list --graduate/.test(note)));
  // The core is the only way between two repositories: no candidate comes from first-app.
  assert.deepEqual(
    result.candidates.map((candidate) => candidate.store),
    ["by-hand"],
  );
  assert.ok(!JSON.stringify(result.candidates).includes("first-app"));
  assert.deepEqual(snapshot(place), coreBefore);
});

test("a repository that lacks an adapter a block of code needs is not proposed to, with why", () => {
  const { first, place, list } = family();
  assert.equal(report(first, list, ["--core", place]).status, 0);
  // No React: the source adapter is not there.
  const dir = withoutFilterBar("bare-app", { "package.json": json({ dependencies: {} }) });
  joined(dir, place, list);
  const said = find(dir, list, ["long", "list"]);
  assert.match(
    said.stdout,
    /not proposed here: this repository has no source adapter, which a block of code needs/,
  );
  assert.doesNotMatch(said.stdout, /next: FilterBar answers this/);
  const [need] = found(dir, list, ["long", "list"]).family_needs;
  assert.equal(need.proposed, false);
  assert.match(need.why, /no source adapter/);
  const before = snapshot(place);
  const refused = propose(dir, list);
  assert.equal(refused.status, 2);
  assert.match(refused.stderr, /filter-list is not proposed to bare-app: it has no source adapter/);
  assert.deepEqual(snapshot(place), before);
});

// ---- the question, and the whole path ----------------------------------------------------------

test("the question is a proposal in the core folder, printed first; granted, the output names the exact promotion; promoted, pinned, found at tier 3 and taken in, the store's entry says a second use", () => {
  const { first, place, list, dir } = asking();
  const before = snapshot(dir);
  const coreBefore = snapshot(place);

  const dry = propose(dir, list, "filter-list", ["--dry-run"]);
  assert.equal(dry.status, 0, dry.stderr);
  assert.match(
    dry.stdout,
    new RegExp(`would write the proposal ${ID} of second-app, in the core folder only:`),
  );
  assert.match(
    dry.stdout,
    /it asks the family's owner to promote a block for filter-list into the family's store/,
  );
  assert.match(dry.stdout, /FilterBar of first-app: A bar of filters over a long list/);
  assert.deepEqual(snapshot(place), coreBefore);

  const asked = propose(dir, list);
  assert.equal(asked.status, 0, asked.stderr);
  assert.deepEqual(read(place, `proposals/${ID}.json`), {
    version: 2,
    id: ID,
    kind: "graduation",
    subject: "filter-list",
    repository: "second-app",
    pin: read(place, "core.json").members[0].pin,
    by: MEMBER,
    on: ON,
    why: WHY,
    graduation: {
      candidates: [
        {
          repository: "first-app",
          need: "filter-list",
          name: "FilterBar",
          description: SAYS["filter-list"],
        },
      ],
    },
  });
  // A question, never a thing done: one file in the core, nothing in the asker, no block anywhere.
  assert.deepEqual(snapshot(dir), before);
  assert.deepEqual(
    snapshot(place)
      .filter((line) => !coreBefore.includes(line))
      .map((line) => line.split(" ")[0]),
    ["proposals/", `proposals/${ID}.json`],
  );
  assert.deepEqual(read(place, "blocks/index.json").blocks, []);
  assert.equal(check(place, list).status, 0);
  // Asked again, by anyone: it waits already.
  const again = propose(dir, list);
  assert.equal(again.status, 0);
  assert.match(again.stdout, new RegExp(`${ID} asks this already`));

  // The owner is told where 0119 tells them: the list, and the one line of a session.
  const listed = proposals(place, list);
  assert.equal(listed.status, 1);
  assert.match(
    listed.stdout,
    new RegExp(
      `${ID}: second-app asks that a block for filter-list graduate: FilterBar of first-app`,
    ),
  );
  const line = sessionLine(dir, list);
  assert.match(line, /1 proposal to the family core waits on the family's owner/);
  assert.equal(line.trim().split("\n").length, 1);
  assert.match(
    periodic(dir, list),
    /1 need of the family waits on a graduation: filter-list \(asked by second-app/,
  );

  // Granted with no folder named: the yes is recorded with who and why, and nothing is promoted.
  const granted = answer("--grant", place, list);
  assert.equal(granted.status, 0, granted.stderr);
  assert.match(granted.stdout, /chose FilterBar of first-app for filter-list/);
  const call = `core --promote filter-list --core '${place}' --by '${OWNER}' --why 'granted ${ID} of second-app: ${YES}'`;
  assert.ok(granted.stdout.includes(call), granted.stdout);
  assert.deepEqual(read(place, `proposals/${ID}.json`).decided, {
    outcome: "granted",
    by: OWNER,
    on: ON,
    why: YES,
    chose: "first-app",
  });
  assert.deepEqual(read(place, "blocks/index.json").blocks, []);
  // Until it is carried out, it is owed, and said so wherever the family looks.
  const owed = proposals(place, list);
  assert.equal(owed.status, 1);
  assert.match(owed.stdout, /the promotion is owed/);
  assert.match(
    periodic(dir, list),
    /filter-list \(granted on .* by .*: FilterBar of first-app, not promoted yet\)/,
  );
  assert.match(
    core(["--target", dir, "--moved"], list).stdout,
    new RegExp(`proposal ${ID} of this repository was granted by ${OWNER}`),
  );
  assert.equal(sessionLine(dir, list), "", "an answered proposal waits on no answer");

  // The owner runs the call in the repository that has the block.
  const done = core(
    [
      "--target",
      first,
      "--promote",
      "filter-list",
      "--core",
      place,
      "--by",
      OWNER,
      "--why",
      `granted ${ID} of second-app: ${YES}`,
      "--on",
      ON,
    ],
    list,
    { guard: true },
  );
  assert.equal(done.status, 0, done.stdout + done.stderr);
  assert.equal(proposals(place, list).status, 0);
  assert.equal(check(place, list).status, 0);

  // The asker pins the store, finds the block at tier 3 and takes it in as any block of the core.
  joined(dir, place, list);
  const now = found(dir, list, ["filter", "bar"]);
  assert.equal(now.matches[0].tier, 3);
  assert.deepEqual(now.family_needs, []);
  assert.equal(
    run("intake.mjs", ["--target", dir, "--need", "filter-list", "bar"], list).status,
    1,
  );
  assert.ok(answerSheet(dir, "intake-filter-list keep", list).status <= 1);
  assert.equal(core(["--target", dir, "--take", "filter-list"], list).status, 0);
  const taken = run(
    "intake.mjs",
    ["--target", dir, "--need", "filter-list", "--file", "src/components/filter-bar.tsx"],
    list,
  );
  assert.equal(taken.status, 0, taken.stdout + taken.stderr);
  assert.equal(text(dir, "src/components/filter-bar.tsx"), FILTER_BAR);
  assert.equal(report(dir, list).status, 0);
  const [entry] = read(place, "blocks/index.json").blocks;
  assert.deepEqual(entry.used_by, ["first-app", "second-app"]);
  assert.equal(entry.second_use, true);
  assert.match(periodic(dir, list), /no need of the family waits on a graduation/);
  assert.equal(sessionLine(dir, list), "");
  assert.equal(check(place, list).status, 0);
});

test("with the folder of the repository that has the block, the grant promotes at once, by the owner's name and reason; never without them, and never from another folder", () => {
  const { first, place, list, dir } = asking();
  assert.equal(propose(dir, list).status, 0);
  const coreBefore = snapshot(place);
  const firstBefore = snapshot(first);

  // No person, or no reason: nothing is answered and nothing is promoted.
  for (const drop of ["--by", "--why"]) {
    const args = ["--grant", ID, "--core", place, "--by", OWNER, "--why", YES, "--from", first];
    args.splice(args.indexOf(drop), 2);
    const wrong = core(args, list);
    assert.equal(wrong.status, 2, drop);
  }
  // The folder of a repository that does not have the block.
  const elsewhere = answer("--grant", place, list, ["--from", dir]);
  assert.equal(elsewhere.status, 2);
  assert.match(elsewhere.stderr, /--from .* is second-app, and the block chosen is first-app's/);
  // A preview writes nothing.
  const dry = answer("--grant", place, list, ["--from", first, "--dry-run"]);
  assert.equal(dry.status, 0, dry.stderr);
  assert.deepEqual(snapshot(place), coreBefore);

  const done = answer("--grant", place, list, ["--from", first]);
  assert.equal(done.status, 0, done.stdout + done.stderr);
  assert.match(done.stdout, /promoted FilterBar \(filter-list\) from first-app: no second use yet/);
  const [entry] = read(place, "blocks/index.json").blocks;
  assert.equal(entry.need, "filter-list");
  assert.deepEqual(entry.used_by, ["first-app"]);
  assert.deepEqual(entry.promoted, {
    by: OWNER,
    on: ON,
    why: `granted ${ID} of second-app: ${YES}`,
  });
  assert.equal(entry.second_use, false);
  assert.equal(text(place, "blocks/filter-list/filter-bar.tsx"), FILTER_BAR);
  assert.equal(read(place, `proposals/${ID}.json`).decided.chose, "first-app");
  // The repository that has the block is read and never written.
  assert.deepEqual(snapshot(first), firstBefore);
  assert.equal(proposals(place, list).status, 0);
  assert.equal(check(place, list).status, 0);
  // The asker hears at its next look, with the block added to the store.
  const moved = core(["--target", dir, "--moved"], list).stdout;
  assert.match(moved, /block added: FilterBar \(filter-list\)/);
  assert.match(moved, new RegExp(`proposal ${ID} of this repository was granted`));
  assert.match(moved, /it is promoted: core --join pins the store, and find gives it at tier 3/);
});

test("a refusal is kept with its reason, the asker hears it, and the same block is not proposed again", () => {
  const { place, list, dir } = asking();
  assert.equal(propose(dir, list).status, 0);
  const no = "The two filter bars will part ways next quarter";
  const refused = core(
    ["--refuse", ID, "--core", place, "--by", OWNER, "--why", no, "--on", ON],
    list,
  );
  assert.equal(refused.status, 0, refused.stderr);
  assert.deepEqual(read(place, `proposals/${ID}.json`).decided, {
    outcome: "refused",
    by: OWNER,
    on: ON,
    why: no,
  });
  assert.deepEqual(read(place, "blocks/index.json").blocks, []);
  assert.match(
    core(["--target", dir, "--moved"], list).stdout,
    new RegExp(`proposal ${ID} of this repository was refused by ${OWNER} on ${ON}, because ${no}`),
  );
  assert.match(periodic(dir, list), /no need of the family waits on a graduation/);
  assert.equal(sessionLine(dir, list), "");

  const before = snapshot(place);
  const again = propose(dir, list);
  assert.equal(again.status, 2);
  assert.match(
    again.stderr,
    new RegExp(
      `the family's owner refused to graduate FilterBar of first-app for filter-list \\(${ID}, by ${OWNER} on ${ON}, because ${no}\\)`,
    ),
  );
  assert.match(again.stderr, /is not proposed again/);
  assert.deepEqual(snapshot(place), before);
  assert.equal(check(place, list).status, 0);
});

test("two repositories answered one need in two ways: status counts it in both, the proposal lists both, the owner chooses one, and the other keeps its own and hears of the choice", () => {
  const { first, place, list } = family();
  assert.equal(report(first, list, ["--core", place]).status, 0);
  const dir = repoOf("second-app", {
    rows: [
      { ...FILTER_BAR_ROW, name: "NarrowBar", description: "Narrows a list by its fields" },
      TABLE_ACTIONS_ROW,
    ],
  });
  joined(dir, place, list);
  const ledger = text(dir, "design/intake.yaml");
  assert.match(
    periodic(dir, list),
    /1 need of the family waits on a graduation: filter-list \(answered in 2 ways, by first-app and second-app: the family's owner chooses one; core --propose filter-list --graduate asks\)/,
  );

  const asked = propose(dir, list);
  assert.equal(asked.status, 0, asked.stderr);
  assert.match(asked.stdout, /it asks the family's owner to choose one block for filter-list/);
  assert.match(asked.stdout, /FilterBar of first-app: /);
  assert.match(asked.stdout, /NarrowBar of second-app: Narrows a list by its fields/);
  assert.deepEqual(
    read(place, `proposals/${ID}.json`).graduation.candidates.map((one) => [
      one.repository,
      one.name,
    ]),
    [
      ["first-app", "FilterBar"],
      ["second-app", "NarrowBar"],
    ],
  );
  // The owner must say which: a grant that chooses none writes nothing.
  const before = snapshot(place);
  const unchosen = answer("--grant", place, list);
  assert.equal(unchosen.status, 2);
  assert.match(
    unchosen.stderr,
    /names 2 blocks: say which with --choose REPOSITORY \(first-app or second-app\)/,
  );
  assert.deepEqual(snapshot(place), before);
  const stranger = answer("--grant", place, list, ["--choose", "third-app"]);
  assert.equal(stranger.status, 2);

  const done = answer("--grant", place, list, ["--choose", "first-app", "--from", first]);
  assert.equal(done.status, 0, done.stdout + done.stderr);
  assert.equal(read(place, "blocks/index.json").blocks[0].name, "FilterBar");
  assert.equal(read(place, `proposals/${ID}.json`).decided.chose, "first-app");
  // The other keeps its own, untouched, and hears of the choice at its next look.
  assert.equal(text(dir, "design/intake.yaml"), ledger);
  const moved = core(["--target", dir, "--moved"], list).stdout;
  assert.match(
    moved,
    new RegExp(
      `the family's owner chose FilterBar of first-app for filter-list \\(${ID}, by ${OWNER} on ${ON}, because ${YES}\\): this repository keeps its own NarrowBar, as it stood`,
    ),
  );
  assert.match(periodic(dir, list), /no need of the family waits on a graduation/);
  assert.equal(check(place, list).status, 0);
});

test("two repositories that each hold a block of one name for one need are counted too, said as they are", () => {
  // Both took the same table from the same outside source: two copies, neither the family's.
  const { first, place, list } = family();
  assert.equal(report(first, list, ["--core", place]).status, 0);
  const dir = withoutFilterBar("second-app");
  joined(dir, place, list);
  assert.match(
    periodic(dir, list),
    /1 need of the family waits on a graduation: many-rows \(answered by first-app and second-app, each with its own DataRegion: the family's owner chooses one/,
  );
});

test("a need the core retired, a need the store holds, a need nobody else answered and an unknown need are not proposed, each with why", () => {
  const { first, place, list, dir } = asking();
  const no = (need, pattern) => {
    const before = snapshot(place);
    const said = propose(dir, list, need);
    assert.equal(said.status, 2, need);
    assert.match(said.stderr, pattern);
    assert.match(said.stderr, /Nothing was written/);
    assert.deepEqual(snapshot(place), before);
  };
  no("no-such-need", /no repository of the family tells the core it answered no-such-need/);
  // The asker's own need, which no other repository answered.
  assert.equal(
    core(
      [
        "--target",
        dir,
        "--propose",
        "many-rows",
        "--graduate",
        "--block",
        "--by",
        MEMBER,
        "--why",
        WHY,
      ],
      list,
    ).status,
    2,
  );
  assert.equal(promote(first, place, list, "filter-list").status, 0);
  no("filter-list", /the family's store holds filter-list already, with FilterBar/);
  assert.equal(
    core(
      [
        "--retire",
        "filter-list",
        "--block",
        "--core",
        place,
        "--by",
        OWNER,
        "--why",
        "Each product keeps its own",
        "--on",
        ON,
      ],
      list,
    ).status,
    0,
  );
  no(
    "filter-list",
    /the core retired its block of filter-list on .* a need the core retired is not proposed again/,
  );
  // Where the folder is looked at, the periodic line does not count it either.
  assert.match(periodic(dir, list), /no need of the family waits on a graduation/);
});

test("where the core's folder cannot be looked at, status counts from the copy and says so; asking writes nothing and says why", () => {
  const { first, place, list } = family();
  assert.equal(report(first, list, ["--core", place]).status, 0);
  const dir = repoOf("second-app", {
    rows: [{ ...FILTER_BAR_ROW, name: "NarrowBar" }, TABLE_ACTIONS_ROW],
  });
  joined(dir, place, list);
  const elsewhere = listIn();
  assert.match(
    periodic(dir, elsewhere),
    /1 need of the family waits on a graduation: filter-list \(answered in 2 ways.*as this repository's copy of the core tells it at its pin: the core's folder cannot be looked at/,
  );
  const before = snapshot(place);
  const said = propose(dir, elsewhere);
  assert.equal(said.status, 2);
  assert.match(said.stderr, /the core's folder cannot be reached/);
  assert.deepEqual(snapshot(place), before);
});

// ---- criteria 1, 15, 18 and 20 -----------------------------------------------------------------

const VERSION = JSON.parse(
  readFileSync(path.join(PLUGIN, ".claude-plugin/plugin.json"), "utf8"),
).version;

for (const kind of Object.keys(KINDS)) {
  test(`a repository that stands alone, ${kind}: find, intake, status and the first line of a session say nothing of a family, ask nothing new and write nothing`, () => {
    const dir = KINDS[kind]();
    const list = listIn();
    const before = snapshot(dir);
    // find and status print and end as they did before the slice: the record of the four kinds.
    const record = readRecord().kinds[kind];
    const now = observe(dir, VERSION);
    for (const command of ["find", "status", "inventory"]) {
      assert.equal(now[command].exit, record[command].exit, command);
      assert.equal(now[command].out, record[command].out, command);
    }
    const data = found(dir, list, ["button"]);
    assert.ok(!("family_needs" in data));
    const asked = run(
      "intake.mjs",
      ["--target", dir, "--need", "long-list", "--dry-run", "--json"],
      list,
      { guard: true },
    );
    if (asked.status !== 2) {
      const result = JSON.parse(asked.stdout);
      assert.ok(!("family_needs" in result));
      assert.ok(!JSON.stringify(result.notes ?? []).includes("family"));
    }
    assert.doesNotMatch(status(dir, list), /graduation|report to the core/);
    assert.equal(sessionLine(dir, list), "");
    const refused = propose(dir, list);
    assert.equal(refused.status, 2);
    assert.match(refused.stderr, /declares no family/);
    assert.deepEqual(snapshot(dir), before);
  });
}

test("from a separate working folder of git, find and the question are the main folder's; the family's name is in the core's declaration, the member's declaration and its copy only", () => {
  const { place, list, dir } = asking();
  git(dir, "init", "-q", "-b", "main");
  git(dir, "add", "-A");
  git(dir, "commit", "-q", "-m", "joined");
  const work = path.join(path.dirname(dir), "second-work");
  assert.equal(git(dir, "worktree", "add", "-q", work).status, 0);
  assert.deepEqual(
    found(work, list, ["long", "list"]).family_needs,
    found(dir, list, ["long", "list"]).family_needs,
  );
  const main = propose(dir, list, "filter-list", ["--dry-run", "--json"]);
  const other = propose(work, list, "filter-list", ["--dry-run", "--json"]);
  assert.equal(other.status, main.status);
  assert.deepEqual(JSON.parse(other.stdout).proposal, JSON.parse(main.stdout).proposal);
  assert.equal(propose(work, list).status, 0);
  assert.equal(read(place, `proposals/${ID}.json`).repository, "second-app");

  const holds = (root) =>
    snapshot(root)
      .filter((line) => !line.endsWith("/"))
      .map((line) => line.split(" ")[0])
      .filter((file) => text(root, file).includes(FAMILY));
  assert.deepEqual(holds(place), ["core.json"]);
  assert.deepEqual(holds(dir), ["design/core/core.json", "design/sources/core.json"]);
});

// ---- the block of an outside source, the shape of the question, wrong calls --------------------

test("a block that came from an outside source graduates only once a person read its licence line: the grant waits, answers nothing and promotes nothing until then", () => {
  const LINE = "MIT: the code may be copied and passed on with its notice";
  const { first, place, list } = family();
  put(first, "design/sources/kit.json", json({ ...source(), licence: LINE }));
  assert.equal(report(first, list, ["--core", place]).status, 0);
  const dir = withoutFilterBar("second-app");
  joined(dir, place, list);
  const id = "graduation-many-rows-1";
  assert.equal(propose(dir, list, "many-rows").status, 0);
  const before = snapshot(place);
  const waits = answer("--grant", place, list, ["--choose", "first-app", "--from", first], id);
  assert.equal(waits.status, 1, waits.stderr);
  assert.ok(waits.stdout.includes(LINE));
  assert.match(
    waits.stdout,
    new RegExp(`${id} was not answered: run the grant again with --licence-allows`),
  );
  assert.deepEqual(snapshot(place), before);
  const given = answer(
    "--grant",
    place,
    list,
    ["--choose", "first-app", "--from", first, "--licence-allows"],
    id,
  );
  assert.equal(given.status, 0, given.stdout + given.stderr);
  const [entry] = read(place, "blocks/index.json").blocks;
  assert.deepEqual(entry.licence, { source: "kit", words: LINE, allowed: { by: OWNER, on: ON } });
  assert.equal(read(place, `proposals/${id}.json`).decided.outcome, "granted");
  assert.equal(check(place, list).status, 0);
});

test("core --check holds the shape of a graduation: its blocks answer the need it is about, it carries no value and no file, and one granted names the block chosen", () => {
  const { place, list, dir } = asking();
  assert.equal(propose(dir, list).status, 0);
  const good = read(place, `proposals/${ID}.json`);
  const broken = (data) => {
    put(place, `proposals/${ID}.json`, json(data));
    const said = check(place, list);
    assert.equal(said.status, 1, said.stdout);
    return said.stdout;
  };
  const [block] = good.graduation.candidates;
  assert.match(
    broken({ ...good, graduation: undefined }),
    /proposes a graduation and names no block/,
  );
  assert.match(
    broken({ ...good, graduation: { candidates: [] } }),
    /graduation\.candidates names no block/,
  );
  assert.match(
    broken({ ...good, graduation: { candidates: [{ ...block, need: "other-need" }] } }),
    /graduation\.candidates\[0\]\.need is other-need, and the proposal is about filter-list/,
  );
  // Never code, never a path: a block is named by four words.
  assert.match(
    broken({ ...good, graduation: { candidates: [{ ...block, file: "src/x.tsx" }] } }),
    /graduation\.candidates\[0\]\.file/,
  );
  assert.match(
    broken({ ...good, answer: { value: "x", was: { value: "y", hold: "locked" } } }),
    /proposes a graduation and holds a value or files/,
  );
  const granted = { outcome: "granted", by: OWNER, on: ON, why: YES };
  assert.match(broken({ ...good, decided: granted }), /decided\.chose is missing/);
  assert.match(
    broken({ ...good, decided: { ...granted, chose: "nobody" } }),
    /decided\.chose is nobody/,
  );
  put(place, `proposals/${ID}.json`, json(good));
  assert.equal(check(place, list).status, 0);
});

test("wrong calls write nothing: --graduate with --block, a choice or a folder given to a proposal that is no graduation or to a refusal, an address in a name", () => {
  const { first, place, list, dir } = asking();
  const before = snapshot(place);
  const both = propose(dir, list, "filter-list", ["--block"]);
  assert.equal(both.status, 2);
  assert.match(both.stderr, /--graduate .* and --block .*: give one/);
  const address = core(
    [
      "--target",
      dir,
      "--propose",
      "filter-list",
      "--graduate",
      "--by",
      "pat@example.invalid",
      "--why",
      WHY,
    ],
    list,
  );
  assert.equal(address.status, 2);
  assert.deepEqual(snapshot(place), before);
  assert.equal(propose(dir, list).status, 0);
  const asked = snapshot(place);
  const refusing = core(
    ["--refuse", ID, "--core", place, "--by", OWNER, "--why", YES, "--choose", "first-app"],
    list,
  );
  assert.equal(refusing.status, 2);
  const folder = core(
    ["--refuse", ID, "--core", place, "--by", OWNER, "--why", YES, "--from", first],
    list,
  );
  assert.equal(folder.status, 2);
  assert.deepEqual(snapshot(place), asked);
});

test("the first line of a session stays one line: a core ahead of the pin and a graduation that waits are said together, and nothing is said once nothing waits", () => {
  const { first, place, list, dir } = asking();
  assert.equal(sessionLine(dir, list), "");
  assert.equal(propose(dir, list).status, 0);
  put(place, "answers.json", text(place, "answers.json").replace("#0246ff", "#0246fe"));
  const line = sessionLine(dir, list);
  assert.equal(line.trim().split("\n").length, 1);
  assert.match(line, /is ahead of this repository's pin/);
  assert.match(line, /1 proposal to the family core waits on the family's owner/);
  // As the hook hands it to a session: one message.
  const hook = JSON.parse(run("session-line.mjs", ["--hook", "--target", dir], list).stdout);
  assert.equal(hook.systemMessage.split("\n").length, 1);
  assert.equal(answer("--grant", place, list, ["--from", first]).status, 0);
  joined(dir, place, list);
  assert.equal(sessionLine(dir, list), "");
});

// ---- a package that keeps no src/ folder and has no Makefile (item 7.4, decision 0120) ----------

// The store fixture as a package whose source is its root: its TypeScript settings map `@/` there,
// so components live in components/, no src/ exists, and nothing of it is a Makefile.
function rootPackage(name, rows, drop = []) {
  const dir = path.join(empty(), name);
  for (const [file, content] of Object.entries(healthyFiles())) {
    const moved = file.replace(/^src\//, "");
    if (drop.includes(moved)) continue;
    put(dir, moved, content.replaceAll("src/components/", "components/"));
  }
  put(dir, "tsconfig.json", '{\n  "compilerOptions": { "paths": { "@/*": ["./*"] } }\n}\n');
  put(dir, "design/theme.json", json({ version: 1, checks: {} }));
  put(dir, "design/intake.yaml", ledgerOf(rows).replaceAll("src/components/", "components/"));
  return dir;
}

test("in a package with no src/ folder and no Makefile, the asking member goes the whole path: told at find, asks, and takes the promoted block into its own components folder", () => {
  const { first, place, list } = family({ firstRows: [FILTER_BAR_ROW, TABLE_ACTIONS_ROW] });
  assert.equal(report(first, list, ["--core", place]).status, 0);
  const dir = rootPackage(
    "second-root",
    [TABLE_ACTIONS_ROW],
    ["components/filter-bar.tsx", "pages/Team.tsx"],
  );
  assert.equal(existsSync(path.join(dir, "src")), false);
  assert.equal(existsSync(path.join(dir, "Makefile")), false);
  joined(dir, place, list);
  assert.equal(found(dir, list, ["long", "list"]).family_needs[0].name, "FilterBar");
  assert.equal(propose(dir, list).status, 0);
  assert.equal(answer("--grant", place, list, ["--from", first]).status, 0);
  joined(dir, place, list);
  assert.equal(found(dir, list, ["filter", "bar"]).matches[0].tier, 3);
  assert.equal(
    run("intake.mjs", ["--target", dir, "--need", "filter-list", "bar"], list).status,
    1,
  );
  assert.ok(answerSheet(dir, "intake-filter-list keep", list).status <= 1);
  const down = core(["--target", dir, "--take", "filter-list"], list);
  assert.equal(down.status, 0, down.stdout + down.stderr);
  assert.match(down.stdout, /create +components\/filter-bar\.tsx/);
  assert.equal(
    run(
      "intake.mjs",
      ["--target", dir, "--need", "filter-list", "--file", "components/filter-bar.tsx"],
      list,
    ).status,
    0,
  );
  assert.equal(report(dir, list).status, 0);
  assert.equal(existsSync(path.join(dir, "src")), false, "no src/ is made");
  assert.equal(existsSync(path.join(dir, "Makefile")), false, "no Makefile is made");
  const [entry] = read(place, "blocks/index.json").blocks;
  assert.deepEqual(entry.used_by, ["first-app", "second-root"]);
  assert.equal(entry.second_use, true);
  assert.equal(check(place, list).status, 0);
});

test("the promotion a grant prints is safe to run as it is: a repository's name, a reason or a folder with a quote, a space or a command in it stays one word", () => {
  const { place, list } = family({ firstRows: [FILTER_BAR_ROW, TABLE_ACTIONS_ROW] });
  const first = repoOf("first-app", { rows: [FILTER_BAR_ROW, TABLE_ACTIONS_ROW] });
  assert.equal(report(first, list, ["--core", place]).status, 0);
  // A member whose folder's name a shell would run, were it not quoted.
  const odd = "odd $(touch pwned) `touch pwned` 'app";
  const dir = withoutFilterBar(odd);
  joined(dir, place, list);
  assert.equal(propose(dir, list).status, 0);
  const why = "It's the same bar; $HOME is no reason";
  const granted = core(
    ["--grant", ID, "--core", place, "--by", OWNER, "--why", why, "--on", ON],
    list,
  );
  assert.equal(granted.status, 0, granted.stderr);
  const printed = granted.stdout.split("\n").find((line) => /^ +core --promote /.test(line));
  assert.ok(printed, granted.stdout);
  // A shell reads the line back into exactly the words meant, and runs nothing.
  const scratch = empty();
  const read = spawnSync("sh", ["-c", `set -- ${printed.trim()}; printf '%s\\n' "$@"`], {
    cwd: scratch,
    encoding: "utf8",
  });
  assert.equal(read.status, 0, read.stderr);
  assert.deepEqual(read.stdout.trimEnd().split("\n"), [
    "core",
    "--promote",
    "filter-list",
    "--core",
    place,
    "--by",
    OWNER,
    "--why",
    `granted ${ID} of ${odd}: ${why}`,
  ]);
  assert.equal(existsSync(path.join(scratch, "pwned")), false);
});
