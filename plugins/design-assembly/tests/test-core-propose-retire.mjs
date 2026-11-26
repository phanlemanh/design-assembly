// A member proposes upward, and the family's owner retires from the core: slice 3 of item 7.2 (spec
// 0016, criteria 1, 20, 23 and 24). A proposal is a file of the core folder, written only there and
// said first; while it waits the member's exception stands and its gate is green; granted, it is
// carried out with the change move or the promotion's replace; refused, it keeps the refusal and
// the reason, and the member is told at its next look; made twice, it is said once; a core that
// cannot be reached means nothing is written. A retiring keeps the whole record in retired.json;
// a member learns of it and, once it accepts, keeps what it inherited or took in as its own, with
// where it came from; no gate turns red, and tier 3 no longer offers a retired block. Nothing calls
// a model or the network, and each test keeps its own list of cores.
import "./helpers/own-cores.mjs";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { existsSync, writeFileSync } from "node:fs";
import path from "node:path";
import { env, execPath } from "node:process";
import { after, test } from "node:test";

import { readIntakeLedger } from "../templates/tools/design-assembly/intake-ledger.mjs";
import { readFamilyStore } from "../scripts/core-blocks.mjs";
import { ledgerText } from "../templates/tools/design-assembly/screen-fragments.mjs";

import * as blocks from "./helpers/core-blocks-repo.mjs";
import {
  ACCEPTED_ON,
  BRAND,
  cleanup,
  copyPin,
  core,
  gate,
  git,
  guided,
  json,
  listIn,
  member,
  MEMBER,
  noteOf,
  OTHER,
  OWNER,
  PLUGIN,
  primaryOf,
  put,
  read,
  snapshot,
  text,
} from "./helpers/core-family.mjs";

after(cleanup);
after(blocks.cleanUp);

const PROPOSED_ON = "2026-11-29";
const ANSWERED_ON = "2026-11-30";
const RETIRED_ON = "2026-11-29";
const WHY = "this product keeps its own brand";
const line = (dir, list) =>
  spawnSync(execPath, [path.join(PLUGIN, "scripts/session-line.mjs"), "--target", dir], {
    encoding: "utf8",
    env: { ...env, DESIGN_ASSEMBLY_CORES: list },
  });
const propose = (dir, list, id, more = []) =>
  core(
    ["--target", dir, "--propose", id, "--by", MEMBER, "--why", WHY, "--on", PROPOSED_ON, ...more],
    list,
    { guard: true },
  );
const owner = (move, id, place, list, why, more = []) =>
  core(
    [move, id, "--core", place, "--by", OWNER, "--why", why, "--on", ANSWERED_ON, ...more],
    list,
    { guard: true },
  );
const settle = (dir, list) =>
  core(["--target", dir, "--settle", "--by", MEMBER, "--why", `source-color=${WHY}`], list);
// A member that holds its own colour against a core that locks another, with the exception
// recorded: its gate is green, and the proposal is what the person wants of the family.
function excepted() {
  const found = member({ colour: OTHER });
  const settled = settle(found.dir, found.list);
  assert.equal(settled.status, 0, settled.stdout + settled.stderr);
  assert.equal(gate(found.dir).status, 0, gate(found.dir).stdout);
  return found;
}

// ---- criterion 23: an answer --------------------------------------------------------------------

test("a member proposes the answer it holds as an exception: written in the core only and said first; the owner sees it and grants it, with --change", () => {
  const { dir, place, list } = excepted();
  const held = primaryOf(dir);
  const before = snapshot(dir);
  const coreBefore = snapshot(place);

  const dry = propose(dir, list, "source-color", ["--dry-run"]);
  assert.equal(dry.status, 0, dry.stderr);
  assert.match(
    dry.stdout,
    /would write the proposal answer-source-color-1 of member-app, in the core folder only:/,
  );
  assert.match(
    dry.stdout,
    new RegExp(
      `it proposes source-color becomes ${held} \\(as design/tokens\\.json holds it here\\); the core holds ${OTHER}, locked`,
    ),
  );
  assert.match(dry.stdout, new RegExp(`by ${MEMBER} on ${PROPOSED_ON}, because ${WHY}`));
  assert.deepEqual(snapshot(place), coreBefore);

  const done = propose(dir, list, "source-color");
  assert.equal(done.status, 0, done.stderr);
  assert.deepEqual(snapshot(dir), before, "nothing of the member is written");
  assert.equal(gate(dir).status, 0, "the exception stands while the proposal waits");
  const proposal = read(place, "proposals/answer-source-color-1.json");
  assert.deepEqual(proposal, {
    version: 2,
    id: "answer-source-color-1",
    kind: "answer",
    subject: "source-color",
    repository: "member-app",
    pin: copyPin(dir),
    by: MEMBER,
    on: PROPOSED_ON,
    why: WHY,
    answer: { value: held, was: { value: OTHER, hold: "locked" } },
  });
  assert.equal(core(["--check", "--core", place], list).status, 0);

  // Where the owner sees it: the list of proposals, and the first line of a session.
  const listed = core(["--proposals", "--core", place], list);
  assert.equal(listed.status, 1);
  assert.match(
    listed.stdout,
    new RegExp(`answer-source-color-1: member-app proposes source-color becomes ${held}`),
  );
  assert.match(line(dir, list).stdout, /1 proposal to the family core waits on the family's owner/);
  assert.match(
    core(["--target", dir, "--moved"], list).stdout,
    /proposal answer-source-color-1 of this repository waits on the family's owner since/,
  );

  // Granted: carried out with the change move, its history saying who and why.
  const granted = owner(
    "--grant",
    "answer-source-color-1",
    place,
    list,
    "the family follows the newer brand",
  );
  assert.equal(granted.status, 0, granted.stderr);
  assert.match(
    granted.stdout,
    new RegExp(`carried out with the change move: source-color, its value ${OTHER} became ${held}`),
  );
  const answer = read(place, "answers.json").answers.find((item) => item.id === "source-color");
  assert.equal(answer.value, held);
  assert.deepEqual(answer.history.at(-1), {
    was: { value: OTHER, hold: "locked" },
    became: { value: held, hold: "locked" },
    by: OWNER,
    on: ANSWERED_ON,
    why: `granted the proposal answer-source-color-1 of member-app (${WHY}): the family follows the newer brand`,
  });
  assert.equal(read(place, "proposals/answer-source-color-1.json").decided.outcome, "granted");
  assert.equal(core(["--proposals", "--core", place], list).status, 0);
  assert.equal(core(["--check", "--core", place], list).status, 0);
  // Every member learns of it as of any change: the core moved ahead of the pin.
  const moved = core(["--target", dir, "--moved"], list);
  assert.equal(moved.status, 1);
  assert.match(
    moved.stdout,
    new RegExp(`changed: source-color: its value ${OTHER} became ${held}`),
  );
  assert.match(moved.stdout, /proposal answer-source-color-1 of this repository was granted/);
  const taken = core(["--target", dir, "--accept-all", "--by", MEMBER, "--on", ANSWERED_ON], list);
  assert.equal(taken.status, 0, taken.stdout + taken.stderr);
  assert.equal(gate(dir).status, 0);
});

test("a refused proposal keeps the refusal and the reason; the member is told at its next look, and its exception stands", () => {
  const { dir, place, list } = excepted();
  assert.equal(propose(dir, list, "source-color").status, 0);
  const refused = owner(
    "--refuse",
    "answer-source-color-1",
    place,
    list,
    "the family keeps one brand",
  );
  assert.equal(refused.status, 0, refused.stderr);
  assert.match(
    refused.stdout,
    /the proposal keeps the refusal and its reason; member-app is told at its next look/,
  );
  assert.deepEqual(read(place, "proposals/answer-source-color-1.json").decided, {
    outcome: "refused",
    by: OWNER,
    on: ANSWERED_ON,
    why: "the family keeps one brand",
  });
  // The core did not change.
  assert.equal(
    read(place, "answers.json").answers.find((item) => item.id === "source-color").value,
    OTHER,
  );
  const told = new RegExp(
    `proposal answer-source-color-1 of this repository was refused by ${OWNER} on ${ANSWERED_ON}, because the family keeps one brand: this repository keeps its own, as it stood`,
  );
  assert.match(core(["--target", dir, "--moved"], list).stdout, told);
  assert.match(blocks.run("status.mjs", ["--target", dir], list).stdout, told);
  assert.equal(gate(dir).status, 0);
  // Answered once: a second answer is refused, and a new proposal takes the next number.
  assert.equal(owner("--grant", "answer-source-color-1", place, list, "after all").status, 2);
  const again = propose(dir, list, "source-color");
  assert.equal(again.status, 0, again.stderr);
  assert.ok(existsSync(path.join(place, "proposals/answer-source-color-2.json")));
});

test("a proposal made twice is said once; another while one waits is refused; a locked answer with no exception, and a core out of reach, write nothing", () => {
  const { dir, place, list } = excepted();
  assert.equal(propose(dir, list, "source-color").status, 0);
  const coreBefore = snapshot(place);
  const twice = propose(dir, list, "source-color");
  assert.equal(twice.status, 0, twice.stderr);
  assert.match(
    twice.stdout,
    /answer-source-color-1 proposes this already, and waits on the family's owner since 2026-11-29: nothing was written/,
  );
  assert.deepEqual(snapshot(place), coreBefore);
  // Another value while the first waits.
  const tokens = read(dir, "design/tokens.json");
  put(
    dir,
    "design/tokens.json",
    json({
      ...tokens,
      color: { ...tokens.color, primary: { ...tokens.color.primary, $value: "#123456" } },
    }),
  );
  const other = propose(dir, list, "source-color");
  assert.equal(other.status, 2);
  assert.match(
    other.stderr,
    /answer-source-color-1, a proposal of member-app about source-color, waits on the family's owner since 2026-11-29/,
  );
  assert.deepEqual(snapshot(place), coreBefore);

  // A locked answer held otherwise with no exception: the gate would be red meanwhile.
  const bare = member({ colour: OTHER });
  const red = propose(bare.dir, bare.list, "source-color");
  assert.equal(red.status, 2);
  assert.match(
    red.stderr,
    /record it first \(core --settle --why source-color=REASON\), so the gate stays green while the proposal waits/,
  );
  assert.equal(existsSync(path.join(bare.place, "proposals")), false);

  // The core out of reach: this machine's list names no core of the family.
  const away = listIn();
  const unreached = propose(dir, away, "source-color");
  assert.equal(unreached.status, 2);
  assert.match(
    unreached.stderr,
    /the core's folder cannot be reached \(this machine keeps no list of cores\): nothing was proposed, and nothing was written/,
  );
  assert.deepEqual(snapshot(place), coreBefore);
  // Wrong calls.
  for (const [more, why] of [
    [
      ["--target", dir, "--propose", "source-color", "--why", WHY],
      /say who proposes, with --by NAME/,
    ],
    [
      ["--target", dir, "--propose", "source-color", "--by", "dan@example.invalid", "--why", WHY],
      /e-mail address/,
    ],
    [
      ["--target", dir, "--propose", "failed-action", "--by", MEMBER, "--why", WHY],
      /failed-action is a rule/,
    ],
    [
      ["--target", dir, "--propose", "record-panel", "--by", MEMBER, "--why", WHY],
      /holds no value of record-panel|which the core holds already/,
    ],
  ]) {
    const refused = core(more, list);
    assert.equal(refused.status, 2, more.join(" "));
    assert.match(refused.stderr, why);
  }
  assert.deepEqual(snapshot(place), coreBefore);
});

test("from a separate working folder of git, a proposal names the same repository and proposes the same", () => {
  const { dir, list } = excepted();
  git(dir, "init", "-q", "-b", "main");
  git(dir, "add", "-A");
  git(dir, "commit", "-q", "-m", "joined");
  const work = path.join(path.dirname(dir), "member-work");
  assert.equal(git(dir, "worktree", "add", "-q", work).status, 0);
  const main = JSON.parse(propose(dir, list, "source-color", ["--dry-run", "--json"]).stdout);
  const other = JSON.parse(propose(work, list, "source-color", ["--dry-run", "--json"]).stdout);
  assert.deepEqual(other.proposal, main.proposal);
  assert.equal(other.proposal.repository, "member-app");
});

// ---- criterion 23: a block ------------------------------------------------------------------------

const OWN = "order-rows";
const MAIN = "src/components/order-rows.tsx";
// A member that took the block of the fixture core in, the whole way, for its need order-rows.
function blockMember() {
  const dir = blocks.storeRepo();
  const place = blocks.coreFolder();
  const list = blocks.listIn();
  assert.equal(blocks.join(dir, place, list).status, 0);
  const run = (script, args) => blocks.run(script, ["--target", dir, ...args], list);
  assert.equal(run("intake.mjs", ["--need", OWN, "order", "rows"]).status, 1);
  assert.ok(blocks.answerSheet(dir, `intake-${OWN} keep`, list).status <= 1);
  const down = run("core.mjs", ["--take", "many-rows", "--need", OWN]);
  assert.equal(down.status, 0, down.stdout + down.stderr);
  const done = run("intake.mjs", ["--need", OWN, "--file", MAIN]);
  assert.equal(done.status, 0, done.stdout + done.stderr);
  return { dir, place, list, run };
}
const rowOf = (dir, need) =>
  readIntakeLedger(ledgerText(dir, "design/intake.yaml", "intake")).blocks.find(
    (each) => each.need === need,
  );

test("a member proposes a block it took from the core and changed: the files as it has them; granted, the promotion's replace carries it out", () => {
  const { dir, place, list, run } = blockMember();
  const changed = `${blocks.ROWS_CODE}// keeps the header in view\n`;
  put(dir, MAIN, changed);
  assert.equal(run("inventory.mjs", ["--json"]).status <= 1, true);
  const before = snapshot(dir);
  const done = blocks.run(
    "core.mjs",
    [
      "--target",
      dir,
      "--propose",
      OWN,
      "--block",
      "--by",
      blocks.MEMBER,
      "--why",
      "the header stays in view",
      "--on",
      PROPOSED_ON,
    ],
    list,
  );
  assert.equal(done.status, 0, done.stdout + done.stderr);
  assert.match(
    done.stdout,
    /wrote the proposal block-many-rows-1 of member-app, in the core folder only:/,
  );
  assert.match(
    done.stdout,
    /it proposes the files of OrderRows \(many-rows\) as this repository has them:/,
  );
  assert.match(done.stdout, /order-rows\.tsx \(from src\/components\/order-rows\.tsx\), sha256/);
  assert.deepEqual(snapshot(dir), before);
  assert.equal(text(place, "proposals/block-many-rows-1/order-rows.tsx"), changed);
  assert.equal(blocks.run("core.mjs", ["--check", "--core", place], list).status, 0);
  // A file of the proposal that is not the one listed is wrong.
  put(place, "proposals/block-many-rows-1/order-rows.tsx", "changed by hand\n");
  assert.match(
    blocks.run("core.mjs", ["--check", "--core", place], list).stdout,
    /proposals\/block-many-rows-1\/order-rows\.tsx is not the file listed/,
  );
  put(place, "proposals/block-many-rows-1/order-rows.tsx", changed);

  const granted = blocks.run(
    "core.mjs",
    [
      "--grant",
      "block-many-rows-1",
      "--core",
      place,
      "--by",
      blocks.OWNER,
      "--why",
      "every list keeps its header",
      "--on",
      ANSWERED_ON,
    ],
    list,
  );
  assert.equal(granted.status, 0, granted.stdout + granted.stderr);
  assert.match(
    granted.stdout,
    /carried out with the promotion's replace: OrderRows \(many-rows\) has the files member-app proposed/,
  );
  assert.equal(text(place, "blocks/many-rows/order-rows.tsx"), changed);
  const [entry] = read(place, "blocks/index.json").blocks;
  assert.equal(entry.history.length, 1);
  assert.equal(
    entry.history[0].why,
    "granted the proposal block-many-rows-1 of member-app (the header stays in view): every list keeps its header",
  );
  assert.deepEqual(entry.used_by, ["first-app", "member-app"]);
  assert.equal(entry.second_use, true);
  assert.equal(blocks.run("core.mjs", ["--check", "--core", place], list).status, 0);
  assert.match(
    blocks.run("core.mjs", ["--target", dir, "--moved"], list).stdout,
    new RegExp(
      `block changed: OrderRows \\(many-rows\\): its files were replaced by ${blocks.OWNER} on ${ANSWERED_ON}, because granted the proposal block-many-rows-1`,
    ),
  );
  // A block the member did not change, or did not take, is nothing to propose.
  const same = blocks.run(
    "core.mjs",
    ["--target", dir, "--propose", OWN, "--block", "--by", blocks.MEMBER, "--why", "again"],
    list,
  );
  assert.equal(same.status, 2);
  assert.match(same.stderr, /are the core's already: there is nothing to propose/);
  const none = blocks.run(
    "core.mjs",
    ["--target", dir, "--propose", "filter-list", "--block", "--by", blocks.MEMBER, "--why", "x"],
    list,
  );
  assert.equal(none.status, 2);
  assert.match(none.stderr, /this repository took no block filter-list from the core/);
});

// ---- criterion 24 ---------------------------------------------------------------------------------

test("retiring an answer keeps it whole in retired.json; a member is told who, when and why; once accepted its row is its own, with where it came from; no gate turns red", () => {
  const { dir, place, list } = member();
  const pin = copyPin(dir);
  const was = read(place, "answers.json").answers.find((item) => item.id === "table-density");
  const coreBefore = snapshot(place);
  const retire = (more = []) =>
    core(
      [
        "--retire",
        "table-density",
        "--core",
        place,
        "--by",
        OWNER,
        "--why",
        "the tables differ too much",
        "--on",
        RETIRED_ON,
        ...more,
      ],
      list,
      { guard: true },
    );
  const dry = retire(["--dry-run"]);
  assert.equal(dry.status, 0, dry.stderr);
  assert.match(
    dry.stdout,
    /would retire the answer table-density \(default\), by Mai Okafor on 2026-11-29, because the tables differ too much/,
  );
  assert.deepEqual(snapshot(place), coreBefore);
  const done = retire();
  assert.equal(done.status, 0, done.stderr);
  assert.match(
    done.stdout,
    /it leaves answers\.json and is kept whole in retired\.json, its history included: nothing is deleted from the record/,
  );
  assert.equal(
    read(place, "answers.json").answers.some((item) => item.id === "table-density"),
    false,
  );
  assert.deepEqual(read(place, "retired.json"), {
    version: 2,
    answers: [
      { ...was, retired: { by: OWNER, on: RETIRED_ON, why: "the tables differ too much" } },
    ],
    blocks: [],
  });
  assert.equal(core(["--check", "--core", place], list).status, 0);
  assert.match(retire().stdout, /table-density was retired already, by Mai Okafor on 2026-11-29/);

  // The member learns of it at its next look; nothing of it changes before a person accepts.
  const before = snapshot(dir);
  const moved = core(["--target", dir, "--moved"], list);
  assert.match(
    moved.stdout,
    /retired: table-density: it was .* in the copy, and the core no longer holds it; retired by Mai Okafor on 2026-11-29, because the tables differ too much/,
  );
  assert.deepEqual(snapshot(dir), before);
  assert.equal(gate(dir).status, 0);
  const accepted = core(
    ["--target", dir, "--accept", "table-density", "--by", MEMBER, "--on", ACCEPTED_ON],
    list,
  );
  assert.equal(accepted.status, 0, accepted.stdout + accepted.stderr);
  assert.match(
    accepted.stdout,
    /the row table-density is this repository's own: once inherited from the family core at/,
  );
  assert.match(
    noteOf(dir, "table-density"),
    new RegExp(
      `^own since ${ACCEPTED_ON}, when the family core retired it: the tables differ too much \\(by ${OWNER}\\), once inherited from the family core at ${pin}`,
    ),
  );
  assert.equal(
    read(dir, "design/core/answers.json").answers.some((item) => item.id === "table-density"),
    false,
  );
  assert.equal(gate(dir).status, 0, "a retiring makes no gate red");
  // The other answers keep their marks.
  assert.match(noteOf(dir, "source-color"), /^inherited from the family core at /);
});

test("a retired choice of the blueprint becomes the repository's own, under own, saying the core retired it", () => {
  const { dir, place, list } = member({ make: guided, colour: BRAND });
  const inherit = core(["--target", dir, "--inherit"], list);
  assert.equal(inherit.status, 0, inherit.stdout + inherit.stderr);
  const pin = copyPin(dir);
  assert.ok(read(dir, "design/blueprint.json").layers.foundations.inherited.type_scale);
  assert.equal(
    core(
      [
        "--retire",
        "type-scale-values",
        "--core",
        place,
        "--by",
        OWNER,
        "--why",
        "each app keeps its own scale",
        "--on",
        RETIRED_ON,
      ],
      list,
    ).status,
    0,
  );
  const done = core(
    ["--target", dir, "--accept", "type-scale-values", "--by", MEMBER, "--on", ACCEPTED_ON],
    list,
  );
  assert.equal(done.status, 0, done.stdout + done.stderr);
  const layer = read(dir, "design/blueprint.json").layers.foundations;
  assert.deepEqual(layer.own.type_scale, {
    since: ACCEPTED_ON,
    by: OWNER,
    why: "each app keeps its own scale",
    how: "retired",
    once: "inherited",
    pin,
    hold: "default",
  });
  assert.equal(layer.inherited?.type_scale, undefined);
  assert.ok(layer.inherited.source_color, "the colour is still inherited");
});

test("retiring a block: its record and files stay in the core; a member that took it in keeps it as its own, its row saying so; tier 3 no longer offers it", () => {
  const { dir, place, list, run } = blockMember();
  const kept = text(place, "blocks/many-rows/order-rows.tsx");
  const done = blocks.run(
    "core.mjs",
    [
      "--retire",
      "many-rows",
      "--block",
      "--core",
      place,
      "--by",
      blocks.OWNER,
      "--why",
      "each app draws its own rows",
      "--on",
      RETIRED_ON,
    ],
    list,
  );
  assert.equal(done.status, 0, done.stdout + done.stderr);
  assert.match(
    done.stdout,
    /its files stay where they were, held to their hashes: blocks\/many-rows\/order-rows\.tsx, blocks\/many-rows\/order-rows\.test\.tsx/,
  );
  assert.deepEqual(read(place, "blocks/index.json").blocks, []);
  assert.equal(read(place, "retired.json").blocks[0].retired.why, "each app draws its own rows");
  assert.equal(text(place, "blocks/many-rows/order-rows.tsx"), kept);
  assert.equal(blocks.run("core.mjs", ["--check", "--core", place], list).status, 0);
  // A retired need is not promoted again: its files keep the folder.
  put(
    place,
    "blocks/index.json",
    json({ version: 2, blocks: [blocks.entryOf(blocks.rowsBlock())] }),
  );
  assert.match(
    blocks.run("core.mjs", ["--check", "--core", place], list).stdout,
    /a retired need is not promoted again/,
  );
  put(place, "blocks/index.json", json({ version: 2, blocks: [] }));

  const moved = run("core.mjs", ["--moved"]);
  assert.match(
    moved.stdout,
    /block retired: OrderRows \(many-rows\); retired by Ana Reyes on 2026-11-29, because each app draws its own rows; accepting it \(core --accept many-rows\)/,
  );
  const accepted = run("core.mjs", [
    "--accept",
    "many-rows",
    "--by",
    blocks.MEMBER,
    "--on",
    ACCEPTED_ON,
  ]);
  assert.equal(accepted.status, 0, accepted.stdout + accepted.stderr);
  assert.match(
    accepted.stdout,
    /OrderRows \(order-rows, src\/components\/order-rows\.tsx\) stays where it is, as this repository's own/,
  );
  assert.match(accepted.stdout, /the pin stays at [0-9a-f]{12}: no answer was accepted/);
  assert.doesNotMatch(accepted.stdout, /the core's list of blocks is not the one copied here/);
  // The copy's list is the core's again, byte for byte: nothing is left to report.
  assert.equal(text(dir, "design/core/blocks/index.json"), text(place, "blocks/index.json"));
  assert.doesNotMatch(
    run("core.mjs", ["--moved"]).stdout,
    /list of blocks is not the one copied|block retired/,
  );
  assert.deepEqual(rowOf(dir, OWN).own, {
    since: ACCEPTED_ON,
    by: blocks.OWNER,
    why: "each app draws its own rows",
  });
  assert.equal(rowOf(dir, OWN).from, "core", "the row still says where it once came from");
  assert.ok(existsSync(path.join(dir, MAIN)));
  assert.equal(existsSync(path.join(dir, "design/core/blocks/many-rows/order-rows.tsx")), false);
  assert.equal(read(dir, "design/core/blocks/index.json").blocks.length, 0);
  assert.ok(
    !read(dir, "design/sources/core.json").pin.files.some((entry) =>
      entry.file.includes("many-rows"),
    ),
  );
  // The copy still reads, tier 3 offers nothing, and the inventory compares the block with no core.
  const store = readFamilyStore(dir);
  assert.equal(store.unreadable, null, "the copy still reads");
  assert.deepEqual(store.blocks, [], "tier 3 offers no retired block");
  assert.match(
    run("inventory.mjs", []).stdout,
    /was taken from the family core, which retired it: the block is the repository's own now, and is compared with no core/,
  );
});

test("a member that did not take a retired block in only sees it leave its copy; one with a gate stays green", () => {
  // A member with a gate, whose core holds a block it never took.
  const { dir, place, list } = member();
  blocks.putBlocks(place, [blocks.rowsBlock()]);
  const joined = core(
    ["--target", dir, "--join", "--core", place, "--by", MEMBER, "--on", ACCEPTED_ON],
    list,
  );
  assert.equal(joined.status, 0, joined.stdout + joined.stderr);
  assert.equal(gate(dir).status, 0);
  const intake = existsSync(path.join(dir, "design/intake.yaml"))
    ? text(dir, "design/intake.yaml")
    : null;
  assert.equal(
    core(
      [
        "--retire",
        "many-rows",
        "--block",
        "--core",
        place,
        "--by",
        OWNER,
        "--why",
        "nobody uses it",
        "--on",
        RETIRED_ON,
      ],
      list,
    ).status,
    0,
  );
  assert.equal(gate(dir).status, 0, "a retiring not yet accepted makes no gate red");
  const done = core(["--target", dir, "--accept-all", "--by", MEMBER, "--on", "2026-11-30"], list);
  assert.equal(done.status, 0, done.stdout + done.stderr);
  assert.match(done.stdout, /many-rows was never taken in here: it only leaves the copy/);
  assert.equal(gate(dir).status, 0, gate(dir).stdout);
  assert.equal(
    existsSync(path.join(dir, "design/intake.yaml")) ? text(dir, "design/intake.yaml") : null,
    intake,
  );
  assert.equal(existsSync(path.join(dir, "design/core/blocks/many-rows")), false);
});

test("pinning again brings a retiring with it: a block taken in becomes the repository's own the same way", () => {
  const { dir, place, list, run } = blockMember();
  assert.equal(
    blocks.run(
      "core.mjs",
      [
        "--retire",
        "many-rows",
        "--block",
        "--core",
        place,
        "--by",
        blocks.OWNER,
        "--why",
        "each app draws its own rows",
        "--on",
        RETIRED_ON,
      ],
      list,
    ).status,
    0,
  );
  const again = run("core.mjs", [
    "--join",
    "--core",
    place,
    "--by",
    blocks.MEMBER,
    "--on",
    ACCEPTED_ON,
  ]);
  assert.equal(again.status, 0, again.stdout + again.stderr);
  assert.match(
    again.stdout,
    /OrderRows \(order-rows\) stays where it is, as this repository's own: the core retired it/,
  );
  assert.equal(rowOf(dir, OWN).own.why, "each app draws its own rows");
});

test("retiring: wrong calls write nothing, a day before the answer's last change is refused, and the family's name stays out of a member's ledgers", () => {
  const { dir, place, list } = member();
  const before = snapshot(place);
  for (const [more, why] of [
    [
      ["--retire", "no-such", "--core", place, "--by", OWNER, "--why", "x"],
      /the core holds no answer or block no-such/,
    ],
    [
      ["--retire", "table-density", "--core", place, "--why", "x"],
      /say who answers for the family/,
    ],
    [
      [
        "--retire",
        "table-density",
        "--core",
        place,
        "--by",
        OWNER,
        "--why",
        "mail ana@example.invalid",
      ],
      /e-mail address/,
    ],
    [
      [
        "--retire",
        "table-density",
        "--core",
        place,
        "--by",
        OWNER,
        "--why",
        "x",
        "--on",
        "2026-01-01",
      ],
      /before 2026-11-25, the day of its last change/,
    ],
    [["--retire", "table-density", "--by", OWNER, "--why", "x"], /say which core, with --core DIR/],
  ]) {
    const refused = core(more, list);
    assert.equal(refused.status, 2, more.join(" "));
    assert.match(refused.stderr, why);
  }
  assert.deepEqual(snapshot(place), before);
  assert.equal(
    core(
      [
        "--retire",
        "table-density",
        "--core",
        place,
        "--by",
        OWNER,
        "--why",
        "x",
        "--on",
        RETIRED_ON,
      ],
      list,
    ).status,
    0,
  );
  assert.equal(
    core(["--target", dir, "--accept-all", "--by", MEMBER, "--on", ACCEPTED_ON], list).status,
    0,
  );
  for (const file of ["design/decisions.yaml", "design/tokens.json", "design/theme.json"]) {
    if (existsSync(path.join(dir, file))) assert.ok(!text(dir, file).includes("Tidewater"), file);
  }
  writeFileSync(path.join(place, "retired.json"), "not json");
  assert.match(core(["--check", "--core", place], list).stdout, /retired\.json is not valid JSON/);
});
