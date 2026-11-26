// The member's report, slice 2 of item 7.2 (spec 0016, criteria 1, 12, 15 and 20): a repository of a
// family tells the core which needs it has answered, each by its key, its name and what it is for,
// and nothing else; the move prints first exactly what it writes, writes only in the core folder,
// and writes nothing when the folder cannot be reached. Joining and pinning again write it too;
// taking a block in says it is behind and writes nowhere outside the repository. A block taken from
// the core is told as a use, and the store's entry follows: `used_by` and `second_use`. Leaving
// takes the report out with the member's line. `core --check` holds the shape of every report.
// Nothing calls a model or the network, and each test keeps its own list of cores.
import "./helpers/own-cores.mjs";
import assert from "node:assert/strict";
import { existsSync, rmSync } from "node:fs";
import path from "node:path";
import { after, test } from "node:test";

import {
  familyCoreProblems,
  readPinnedCore,
} from "../templates/tools/design-assembly/contract.mjs";

import {
  answerSheet,
  cleanUp,
  FAMILY,
  git,
  join,
  listIn,
  MEMBER,
  put,
  read,
  run,
  snapshot,
  text,
} from "./helpers/core-blocks-repo.mjs";
import * as gated from "./helpers/core-family.mjs";
import {
  core,
  DATA_REGION_ROW,
  family,
  FILTER_BAR,
  FILTER_BAR_ROW,
  joined,
  json,
  ledgerOf,
  promote,
  repoOf,
  report,
  reportFile,
  SAYS,
  TABLE_ACTIONS_ROW,
  withoutFilterBar,
} from "./helpers/family-needs.mjs";

after(cleanUp);
after(gated.cleanup);

const NEEDS = [
  { need: "many-rows", name: "DataRegion", description: SAYS["many-rows"] },
  { need: "filter-list", name: "FilterBar", description: SAYS["filter-list"] },
];
const check = (place, list) => core(["--check", "--core", place], list);

// ---- criterion 12: what a report holds, and that it is printed first ---------------------------

test("a member's report holds each need by its key, its name and what it is for, and nothing else; the move prints the file whole first and writes only in the core folder", () => {
  const { place, list } = family();
  const dir = repoOf("member-app", { rows: [TABLE_ACTIONS_ROW] });
  joined(dir, place, list);
  // Nothing to tell yet: a piece of the starter kit is every repository's.
  assert.equal(existsSync(path.join(place, reportFile("member-app"))), false);
  put(dir, "design/intake.yaml", ledgerOf());
  const before = snapshot(dir);
  const coreBefore = snapshot(place);

  const dry = report(dir, list, ["--dry-run"]);
  assert.equal(dry.status, 0, dry.stderr);
  assert.match(dry.stdout, /would write the report of member-app, in the core folder only:/);
  assert.match(dry.stdout, /create +.*members\/member-app\.json/);
  // The file is printed whole, as it would be written.
  const whole = `${JSON.stringify({ version: 2, repository: "member-app", needs: NEEDS }, null, 2)}`;
  for (const line of whole.split("\n")) assert.ok(dry.stdout.includes(line.trim()), line);
  assert.match(dry.stdout, /no code, no text of a file, no path and no value/);
  assert.deepEqual(snapshot(place), coreBefore);
  assert.deepEqual(snapshot(dir), before);

  const done = report(dir, list);
  assert.equal(done.status, 0, done.stderr);
  assert.match(done.stdout, /wrote the report of member-app, in the core folder only:/);
  assert.match(done.stdout, /nothing was written in member-app/);
  assert.deepEqual(read(place, reportFile("member-app")), {
    version: 2,
    repository: "member-app",
    needs: NEEDS,
  });
  // Only the report changed in the core, and nothing in the repository.
  assert.deepEqual(snapshot(dir), before);
  assert.deepEqual(
    snapshot(place)
      .filter((line) => !coreBefore.includes(line))
      .map((line) => line.split(" ")[0]),
    ["members/", "members/member-app.json"],
  );
  // No code, no path, no hash, no source's name, no person: the keys are all it has.
  const written = text(place, reportFile("member-app"));
  for (const word of ["src/", ".tsx", "data-grid-1", "kit", "the owner", "approved", "taken"]) {
    assert.ok(!written.includes(word), word);
  }
  assert.ok(!written.includes(FAMILY));
  assert.deepEqual(familyCoreProblems(place), []);
  assert.equal(check(place, list).status, 0);

  // Said again, it changes nothing.
  const again = report(dir, list);
  assert.equal(again.status, 0);
  assert.match(again.stdout, /says this already: nothing was written/);
  // What is left out is said with why: the starter piece is every repository's.
  assert.match(done.stdout, /left out of the report: 1/);
  assert.match(done.stdout, /TableActions \(row-actions-column\): a piece of the starter kit/);
});

test("a row with no description, a retired row and a need that is no key are left out, each with why; an e-mail address in a description stops the report", () => {
  const { place, list } = family();
  const dir = repoOf("member-app", {
    rows: [
      { ...DATA_REGION_ROW, description: null },
      { ...FILTER_BAR_ROW, retired: true },
      { ...FILTER_BAR_ROW, need: "Filter_List2", name: "FilterTwo" },
      { ...FILTER_BAR_ROW, need: "narrow-list", name: "NarrowBar", description: "Narrows a list" },
    ],
  });
  joined(dir, place, list);
  assert.deepEqual(read(place, reportFile("member-app")).needs, [
    { need: "narrow-list", name: "NarrowBar", description: "Narrows a list" },
  ]);
  const said = report(dir, list, ["--dry-run"]);
  assert.match(said.stdout, /DataRegion \(many-rows\): its row does not say what the block is for/);
  assert.match(said.stdout, /FilterBar \(filter-list\): retired in this repository/);
  assert.match(said.stdout, /FilterTwo \(Filter_List2\): its need is not a key/);

  put(
    dir,
    "design/intake.yaml",
    ledgerOf([{ ...FILTER_BAR_ROW, description: "Ask pat@example.invalid about it" }]),
  );
  const before = snapshot(place);
  const refused = report(dir, list);
  assert.equal(refused.status, 2);
  assert.match(refused.stderr, /e-mail address/);
  assert.match(refused.stderr, /Nothing was written/);
  assert.deepEqual(snapshot(place), before);
});

// ---- when a report is written ------------------------------------------------------------------

test("the first repository of a family reports without joining: nothing of it is written, and it declares nothing", () => {
  const { first, place, list } = family();
  const before = snapshot(first);
  // It holds no declaration, so it names the core.
  const unnamed = report(first, list);
  assert.equal(unnamed.status, 2);
  assert.match(unnamed.stderr, /declares no family/);
  assert.match(unnamed.stderr, /--core DIR/);
  const done = report(first, list, ["--core", place]);
  assert.equal(done.status, 0, done.stdout + done.stderr);
  assert.deepEqual(read(place, reportFile("first-app")).needs, NEEDS);
  assert.deepEqual(snapshot(first), before);
  assert.equal(existsSync(path.join(first, "design/sources/core.json")), false);
  assert.equal(check(place, list).status, 0);

  // A repository that is neither the first nor a member has nothing to say to this core.
  const stranger = repoOf("stranger-app");
  const coreBefore = snapshot(place);
  const refused = report(stranger, list, ["--core", place]);
  assert.equal(refused.status, 2);
  assert.match(
    refused.stderr,
    /neither the first repository of the family .* nor one of its members/,
  );
  assert.deepEqual(snapshot(place), coreBefore);
});

test("joining and pinning again write the report, said first; the copy gains every member's report, held by the pin", () => {
  const { first, place, list } = family();
  assert.equal(report(first, list, ["--core", place]).status, 0);
  const dir = withoutFilterBar("member-app");
  const coreBefore = snapshot(place);
  const before = snapshot(dir);

  const dry = join(dir, place, list, ["--dry-run"]);
  assert.equal(dry.status, 0, dry.stdout + dry.stderr);
  assert.match(
    dry.stdout,
    /in the core folder: .*members\/member-app\.json: the report of member-app/,
  );
  assert.match(dry.stdout, /"need": "many-rows"/);
  assert.deepEqual(snapshot(place), coreBefore);
  assert.deepEqual(snapshot(dir), before);

  const done = joined(dir, place, list);
  assert.match(
    done.stdout,
    /in the core folder: .*members\/member-app\.json: the report of member-app.*\(written\)/,
  );
  assert.deepEqual(read(place, reportFile("member-app")).needs, [NEEDS[0]]);
  // The copy holds both reports, byte for byte, and the pin lists them: names only, never code.
  for (const name of ["first-app", "member-app"]) {
    assert.equal(text(dir, `design/core/${reportFile(name)}`), text(place, reportFile(name)));
  }
  const pinned = read(dir, "design/sources/core.json").pin.files.map((entry) => entry.file);
  assert.ok(
    pinned.includes("members/first-app.json") && pinned.includes("members/member-app.json"),
  );
  assert.equal(readPinnedCore(dir).unreadable, null);
  assert.match(done.stdout, /the copy holds the reports of 2 repositories/);

  // Pinning again writes what the ledger says now.
  put(
    dir,
    "design/intake.yaml",
    ledgerOf([DATA_REGION_ROW, { ...FILTER_BAR_ROW, need: "narrow-list", name: "NarrowBar" }]),
  );
  const again = joined(dir, place, list);
  assert.match(again.stdout, /members\/member-app\.json: the report of member-app.*\(written\)/);
  assert.equal(read(place, reportFile("member-app")).needs.length, 2);
  assert.equal(readPinnedCore(dir).unreadable, null);
  assert.equal(check(place, list).status, 0);
});

test("taking a block in writes nothing in the core and says the report is behind; core --report then tells the use, and the store's entry says a second use", () => {
  const { first, place, list } = family();
  assert.equal(promote(first, place, list, "filter-list").status, 0);
  const third = withoutFilterBar("third-app");
  joined(third, place, list);
  const dir = withoutFilterBar("second-app");
  joined(dir, place, list);
  assert.deepEqual(read(place, "blocks/index.json").blocks[0].used_by, ["first-app"]);

  assert.equal(
    run("intake.mjs", ["--target", dir, "--need", "filter-list", "bar"], list).status,
    1,
  );
  assert.ok(answerSheet(dir, "intake-filter-list keep", list).status <= 1);
  assert.equal(core(["--target", dir, "--take", "filter-list"], list).status, 0);
  const coreBefore = snapshot(place);
  const taken = run(
    "intake.mjs",
    ["--target", dir, "--need", "filter-list", "--file", "src/components/filter-bar.tsx"],
    list,
  );
  assert.equal(taken.status, 0, taken.stdout + taken.stderr);
  // Taking in reads and writes the repository alone, on every machine the same.
  assert.deepEqual(snapshot(place), coreBefore);
  assert.match(taken.stdout, /note: the family core is not told of this yet: core --report/);
  const moved = core(["--target", dir, "--moved"], list);
  assert.match(moved.stdout, /this repository's report to the core is behind its intake ledger/);

  const dry = report(dir, list, ["--dry-run"]);
  assert.match(
    dry.stdout,
    /update +.*blocks\/index\.json: FilterBar \(filter-list\) is used by second-app too: a second use/,
  );
  assert.deepEqual(snapshot(place), coreBefore);
  const done = report(dir, list);
  assert.equal(done.status, 0, done.stdout + done.stderr);
  // The block is the core's: told as a use, never as a need the repository answered.
  assert.deepEqual(read(place, reportFile("second-app")), {
    version: 2,
    repository: "second-app",
    needs: [NEEDS[0]],
    uses: ["filter-list"],
  });
  const [entry] = read(place, "blocks/index.json").blocks;
  assert.deepEqual(entry.used_by, ["first-app", "second-app"]);
  assert.equal(entry.second_use, true);
  assert.equal(text(place, "blocks/filter-list/filter-bar.tsx"), FILTER_BAR);
  assert.equal(check(place, list).status, 0);
  // The one that reported is told nothing new; another member hears of the use, and is not told
  // to pin again for it.
  const mine = core(["--target", dir, "--moved"], list).stdout;
  assert.doesNotMatch(mine, /report to the core is behind|list of blocks is not the one copied/);
  const theirs = core(["--target", third, "--moved"], list).stdout;
  assert.match(
    theirs,
    /block used: FilterBar \(filter-list\) is used by second-app too: a second use/,
  );
  assert.doesNotMatch(theirs, /list of blocks is not the one copied/);
  assert.match(theirs, /the report of second-app in the core is not the one copied here/);
});

// ---- a core that cannot be reached -------------------------------------------------------------

test("a core that cannot be reached: nothing is written anywhere, the move says so, and the repository goes on", () => {
  const { place, list } = family();
  const dir = repoOf("member-app");
  joined(dir, place, list);
  const before = snapshot(dir);
  const coreBefore = snapshot(place);
  // Another machine: its list names no core.
  const elsewhere = listIn();
  const said = report(dir, elsewhere);
  assert.equal(said.status, 2);
  assert.match(said.stderr, /the core's folder cannot be reached/);
  assert.match(said.stderr, /nothing was written/);
  assert.match(said.stderr, /the repository goes on as it is/);
  assert.deepEqual(snapshot(dir), before);
  assert.deepEqual(snapshot(place), coreBefore);
  // Its own commands read as before: the copy is all they need.
  assert.equal(run("find.mjs", ["--target", dir, "filter", "bar"], elsewhere).status, 0);
});

// ---- leaving -----------------------------------------------------------------------------------

test("leaving takes the report out with the member's line, said first; where the core cannot be reached the move says what is left there", () => {
  const { place, list } = family();
  const dir = repoOf("member-app");
  joined(dir, place, list);
  assert.ok(existsSync(path.join(place, reportFile("member-app"))));
  const leave = (where, more = []) =>
    core(
      ["--target", dir, "--leave", "--by", MEMBER, "--why", "Sold to another company", ...more],
      where,
    );
  const dry = leave(list, ["--dry-run"]);
  assert.match(
    dry.stdout,
    /in the core folder: .*members\/member-app\.json: deletes the report of member-app/,
  );
  assert.ok(existsSync(path.join(place, reportFile("member-app"))));

  // On a machine that cannot reach the core, the repository leaves and the report is left to do.
  const away = repoOf("away-app");
  joined(away, place, list);
  const gone = core(
    ["--target", away, "--leave", "--by", MEMBER, "--why", "Sold to another company"],
    listIn(),
  );
  assert.equal(gone.status, 1);
  assert.match(gone.stdout, /left to do in the core: .*delete its report, members\/away-app\.json/);
  assert.ok(existsSync(path.join(place, reportFile("away-app"))));

  const done = leave(list);
  assert.equal(done.status, 0, done.stdout + done.stderr);
  assert.match(
    done.stdout,
    /members\/member-app\.json: deletes the report of member-app.*\(deleted\)/,
  );
  assert.equal(existsSync(path.join(place, reportFile("member-app"))), false);
  assert.ok(!read(place, "core.json").members.some((each) => each.repository === "member-app"));
});

// ---- core --check ------------------------------------------------------------------------------

test("core --check holds the shape of every report and names the file and the place: a key beyond the three, a wrong name, a need told twice, an address, a use the store does not offer or does not name", () => {
  const { first, place, list } = family();
  assert.equal(promote(first, place, list, "filter-list").status, 0);
  const good = { version: 2, repository: "first-app", needs: NEEDS };
  const broken = (data, file = reportFile("first-app")) => {
    put(place, file, json(data));
    const said = check(place, list);
    rmSync(path.join(place, file));
    assert.equal(said.status, 1, said.stdout);
    return said.stdout;
  };
  // Never code, never a path, never a value: the three keys are all a need has.
  for (const key of ["file", "code", "sha256", "value"]) {
    assert.match(
      broken({ ...good, needs: [{ ...NEEDS[0], [key]: "x" }] }),
      new RegExp(`members/first-app\\.json\\.needs\\[0\\]\\.${key}`),
      key,
    );
  }
  assert.match(
    broken({ ...good, needs: [{ need: "many-rows", name: "DataRegion" }] }),
    /needs\[0\]\.description/,
  );
  assert.match(
    broken(good, reportFile("other-app")),
    /is named other-app\.json and its repository is first-app/,
  );
  assert.match(
    broken({ ...good, needs: [NEEDS[0], NEEDS[0]] }),
    /members\/first-app\.json tells the need many-rows twice/,
  );
  assert.match(
    broken({ ...good, needs: [{ ...NEEDS[0], description: "Ask pat@example.invalid" }] }),
    /members\/first-app\.json\.needs\[0\]\.description holds an e-mail address/,
  );
  assert.match(
    broken({ ...good, uses: ["no-such-need"] }),
    /members\/first-app\.json\.uses\[0\] is no-such-need, which the store neither offers nor retired/,
  );
  assert.equal(check(place, list).status, 0);
});

test("a store's entry that lost the name of a repository that uses the block is written again at that repository's next report: the core is never locked by it", () => {
  const { first, place, list } = family();
  assert.equal(promote(first, place, list, "filter-list").status, 0);
  const dir = withoutFilterBar("second-app");
  joined(dir, place, list);
  assert.equal(
    run("intake.mjs", ["--target", dir, "--need", "filter-list", "bar"], list).status,
    1,
  );
  assert.ok(answerSheet(dir, "intake-filter-list keep", list).status <= 1);
  assert.equal(core(["--target", dir, "--take", "filter-list"], list).status, 0);
  assert.equal(
    run(
      "intake.mjs",
      ["--target", dir, "--need", "filter-list", "--file", "src/components/filter-bar.tsx"],
      list,
    ).status,
    0,
  );
  assert.equal(report(dir, list).status, 0);
  // A hand takes the name out of the store's entry.
  const index = read(place, "blocks/index.json");
  put(
    place,
    "blocks/index.json",
    json({ ...index, blocks: index.blocks.map((block) => ({ ...block, used_by: ["first-app"] })) }),
  );
  assert.equal(check(place, list).status, 0);
  assert.match(
    core(["--target", dir, "--moved"], list).stdout,
    /this repository's report to the core is behind its intake ledger \(the core is not told of 1 block of the core it uses\)/,
  );
  const mended = report(dir, list);
  assert.equal(mended.status, 0, mended.stdout + mended.stderr);
  assert.match(mended.stdout, /FilterBar \(filter-list\) is used by second-app too: a second use/);
  assert.deepEqual(read(place, "blocks/index.json").blocks[0].used_by, ["first-app", "second-app"]);
});

// ---- criteria 1, 15 and 20 ---------------------------------------------------------------------

test("a repository that stands alone has nothing to report and is not written; from a separate working folder the report is the main folder's", () => {
  const alone = repoOf("alone-app");
  const list = listIn();
  const before = snapshot(alone);
  const said = report(alone, list);
  assert.equal(said.status, 2);
  assert.match(said.stderr, /declares no family/);
  assert.deepEqual(snapshot(alone), before);
  assert.equal(existsSync(list), false, "no list of cores is made");

  const { place, list: mine } = family();
  const dir = repoOf("member-app", { rows: [TABLE_ACTIONS_ROW] });
  joined(dir, place, mine);
  put(dir, "design/intake.yaml", ledgerOf());
  git(dir, "init", "-q", "-b", "main");
  git(dir, "add", "-A");
  git(dir, "commit", "-q", "-m", "joined");
  const work = path.join(path.dirname(dir), "member-work");
  assert.equal(git(dir, "worktree", "add", "-q", work).status, 0);
  const main = report(dir, mine, ["--dry-run", "--json"]);
  const other = report(work, mine, ["--dry-run", "--json"]);
  assert.equal(other.status, main.status);
  assert.deepEqual(JSON.parse(other.stdout).report, JSON.parse(main.stdout).report);
  assert.equal(report(work, mine).status, 0);
  assert.equal(read(place, reportFile("member-app")).repository, "member-app");
  // The family's name is in the core's declaration, never in a report.
  assert.ok(!text(place, reportFile("member-app")).includes(FAMILY));
});

// ---- the gate of a member whose copy holds reports ---------------------------------------------

test("a member with a gate reads a copy that holds reports: the gate is as green as before the reports, and red once a report in the copy is changed", () => {
  const { dir, place, list } = gated.member();
  const before = gated.gate(dir);
  // Another repository of the family told the core what it answered; the member pins again.
  gated.put(
    place,
    "core.json",
    gated.json({
      ...gated.read(place, "core.json"),
      members: [
        ...gated.read(place, "core.json").members,
        { repository: "other-app", joined: "2026-11-26" },
      ],
    }),
  );
  gated.put(
    place,
    reportFile("other-app"),
    gated.json({ version: 2, repository: "other-app", needs: NEEDS }),
  );
  assert.ok(gated.join(dir, place, list).status <= 1);
  assert.ok(existsSync(path.join(dir, "design/core", reportFile("other-app"))));
  const after = gated.gate(dir);
  // The exports are the repository's own step, which the join says; nothing else moved.
  const lines = (run) =>
    (run.stdout + run.stderr)
      .split("\n")
      .filter((line) => !/design-exports|problem\(s\)|held by/.test(line));
  assert.deepEqual(lines(after), lines(before));
  assert.equal(readPinnedCore(dir).unreadable, null);
  // A report changed in the copy is a copy that differs from its pin: unreadable, and said so.
  gated.put(dir, `design/core/${reportFile("other-app")}`, gated.json({ version: 2 }));
  assert.match(
    readPinnedCore(dir).unreadable,
    /members\/other-app\.json is not the file the core was pinned with/,
  );
  assert.notEqual(gated.gate(dir).status, 0);
});

// ---- a ledger that tells nothing ---------------------------------------------------------------

test("an intake ledger that is gone or cannot be read tells nothing and corrects nothing: the report the core holds stays, and the move says what could not be read", () => {
  const { place, list } = family();
  const dir = repoOf("member-app");
  joined(dir, place, list);
  const held = text(place, reportFile("member-app"));
  assert.equal(JSON.parse(held).needs.length, 2);
  const ledger = text(dir, "design/intake.yaml");
  for (const broken of [null, "version: 1\nblocks: [\n"]) {
    if (broken === null) rmSync(path.join(dir, "design/intake.yaml"));
    else put(dir, "design/intake.yaml", broken);
    const said = report(dir, list);
    assert.equal(said.status, 0, said.stderr);
    assert.match(said.stdout, /the intake ledger of member-app tells nothing \(/);
    assert.match(said.stdout, /the report the core holds of member-app is left as it is/);
    assert.doesNotMatch(said.stdout, /wrote the report/);
    assert.equal(text(place, reportFile("member-app")), held);
    // Pinning again keeps it too, and says so.
    const again = join(dir, place, list);
    assert.ok(again.status <= 1, again.stderr);
    assert.match(
      again.stdout,
      /members\/member-app\.json is left as it is: the intake ledger of member-app tells nothing/,
    );
    assert.equal(text(place, reportFile("member-app")), held);
    assert.equal(text(dir, `design/core/${reportFile("member-app")}`), held);
  }
  put(dir, "design/intake.yaml", ledger);
  assert.match(report(dir, list).stdout, /says this already/);
});

test("a row taken from the core that names no block of it, and a second row for one need, are left out and named; a core folder that is not there is refused in plain words", () => {
  const { first, place, list } = family();
  const dir = repoOf("member-app", {
    rows: [
      FILTER_BAR_ROW,
      { ...FILTER_BAR_ROW, name: "SecondBar" },
      { ...DATA_REGION_ROW, from: "core", source: "", need: "rows-again", name: "CoreRows" },
    ],
  });
  joined(dir, place, list);
  const said = report(dir, list, ["--dry-run"]);
  assert.match(
    said.stdout,
    /SecondBar \(filter-list\): a second row for a need an earlier row answers/,
  );
  assert.match(
    said.stdout,
    /CoreRows \(rows-again\): taken from the core, and its row does not say which block/,
  );
  assert.deepEqual(
    read(place, reportFile("member-app")).needs.map((one) => one.name),
    ["FilterBar"],
  );
  const nowhere = report(first, list, ["--core", path.join(place, "no-such-folder")]);
  assert.equal(nowhere.status, 2);
  assert.match(nowhere.stderr, /no-such-folder is not a folder\. Nothing was written/);
});
