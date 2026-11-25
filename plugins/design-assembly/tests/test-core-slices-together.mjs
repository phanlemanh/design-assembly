// The slices of the family core in one tree (spec 0016): a member that learns its core moved and
// accepts answers (slice 3 of item 7.1) beside the blocks' files pinned in its copy and `core
// --take` (slice 1 of item 7.2), and beside `core --leave` (the second half of slice 4). Accepting
// an answer never touches a block, in the copy or taken in; a store of blocks that differs is said
// and pinned by joining again; and a repository that left is told nothing, with nothing it left
// behind coming back. Fixtures only: no model, no network, a list of cores of each test's own.
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { env, execPath } from "node:process";
import { after, test } from "node:test";

import { readPinnedCore } from "../templates/tools/design-assembly/contract.mjs";

import * as blocks from "./helpers/core-blocks-repo.mjs";
import {
  ACCEPTED_ON,
  adopted,
  change,
  cleanup,
  COPY,
  copyPin,
  core,
  coreFolder,
  DECLARATION,
  gate,
  join,
  listIn,
  MEMBER,
  noteOf,
  OTHER,
  OWNER,
  pinOf,
  PLUGIN,
  primaryOf,
  read,
  run,
  snapshot,
  text,
} from "./helpers/core-family.mjs";

after(cleanup);
after(blocks.cleanUp);

const accept = (dir, list, args, more = []) =>
  core(["--target", dir, ...args, "--by", MEMBER, "--on", ACCEPTED_ON, ...more], list);
const line = (dir, list) =>
  spawnSync(execPath, [path.join(PLUGIN, "scripts/session-line.mjs"), "--target", dir], {
    encoding: "utf8",
    env: { ...env, DESIGN_ASSEMBLY_CORES: list },
  });
const BLOCK_FILES = ["blocks/many-rows/order-rows.test.tsx", "blocks/many-rows/order-rows.tsx"];
// The entries of the pin that name a file of a block, and the bytes of those files in the copy.
const pinnedBlocks = (dir) => ({
  entries: read(dir, DECLARATION)
    .pin.files.filter((entry) => entry.file.startsWith("blocks/") && !entry.file.endsWith(".json"))
    .sort((a, b) => a.file.localeCompare(b.file)),
  files: snapshot(path.join(dir, COPY, "blocks")),
});

test("a member whose copy holds blocks' files accepts answers, one and all: the files and their entries of the pin stay, the copy reads and the gate is green", () => {
  // An adopted repository joins a core whose store holds a block: the copy holds the block's files.
  const dir = adopted();
  const place = coreFolder({ colour: primaryOf(dir) });
  blocks.putBlocks(place, [blocks.rowsBlock()]);
  const list = listIn();
  assert.equal(join(dir, place, list).status, 0);
  const before = pinnedBlocks(dir);
  assert.deepEqual(
    before.entries.map((entry) => entry.file),
    BLOCK_FILES,
  );
  assert.equal(gate(dir).status, 0, gate(dir).stderr);

  change(place, list, "record-panel", [
    "--hold",
    "default",
    "--why",
    "one app opens records in place",
  ]);
  change(place, list, "failed-action", [
    "--hold",
    "default",
    "--why",
    "kept by a test in each app",
  ]);
  // One answer, then the rest: the answers and the pin move, the blocks do not.
  for (const args of [["--accept", "record-panel"], ["--accept-all"]]) {
    const was = copyPin(dir);
    const done = accept(dir, list, args);
    assert.ok([0, 1].includes(done.status), done.stderr);
    assert.notEqual(copyPin(dir), was, args.join(" "));
    assert.deepEqual(pinnedBlocks(dir), before, args.join(" "));
    // Every file the pin lists is the file the copy holds: the copy reads, and the gate holds.
    const pinned = readPinnedCore(dir);
    assert.equal(pinned.unreadable, null, pinned.unreadable);
    assert.equal(pinned.blocks.length, 1);
    assert.equal(gate(dir).status, 0, gate(dir).stderr);
    assert.doesNotMatch(
      done.stdout,
      /blocks/,
      "accepting says nothing of blocks that did not move",
    );
  }
  assert.equal(copyPin(dir), pinOf(place));

  // The core's store of blocks moves: the three places say only that it differs, name no block,
  // and nothing waits on a person; accepting has nothing to take and leaves the copy's blocks.
  blocks.putBlocks(place, [
    blocks.rowsBlock({
      texts: {
        "order-rows.tsx": `${blocks.ROWS_CODE}// a newer block\n`,
        "order-rows.test.tsx": blocks.ROWS_TEST,
      },
    }),
  ]);
  const moved = core(["--target", dir, "--moved"], list);
  assert.equal(moved.status, 0, moved.stderr);
  for (const said of [
    moved.stdout,
    run("status.mjs", ["--target", dir], list).stdout,
    run("inventory.mjs", ["--target", dir], list).stdout,
  ]) {
    assert.match(
      said,
      /the core's list of blocks is not the one copied here: accepting answers leaves the copy's blocks as they are, and pinning the core again with core --join brings the newer ones/,
    );
    // Since slice 3 of item 7.2 the block is named; a store changed by hand says nobody.
    assert.match(
      said,
      /block changed: OrderRows \(many-rows\): its files; the store's history does not say who changed them/,
    );
  }
  assert.equal(
    line(dir, list).stdout,
    "",
    "a store of blocks that differs is no line at a session's start",
  );
  const none = accept(dir, list, ["--accept-all"]);
  assert.equal(none.status, 0, none.stderr);
  assert.match(none.stdout, /there is nothing to accept/);
  assert.deepEqual(pinnedBlocks(dir), before);
  // Joining again is what pins the newer block: the copy then holds the core's file.
  assert.equal(join(dir, place, list).status, 0);
  assert.deepEqual(
    readFileSync(path.join(dir, COPY, BLOCK_FILES[1])),
    readFileSync(path.join(place, BLOCK_FILES[1])),
  );
  assert.doesNotMatch(core(["--target", dir, "--moved"], list).stdout, /list of blocks/);
  assert.equal(gate(dir).status, 0, gate(dir).stderr);
});

test("core --take and a block taken in are untouched when answers are accepted", () => {
  // A member with a store of its own takes the family's block in, the whole way.
  const dir = blocks.storeRepo();
  const place = blocks.coreFolder();
  const list = listIn();
  assert.equal(blocks.join(dir, place, list).status, 0);
  const need = "order-rows";
  const take = (...more) =>
    blocks.run("core.mjs", ["--target", dir, "--take", "many-rows", "--need", need, ...more], list);
  assert.equal(
    blocks.run("intake.mjs", ["--target", dir, "--need", need, "order", "rows"], list).status,
    1,
  );
  assert.ok(blocks.answerSheet(dir, `intake-${need} keep`, list).status <= 1);
  assert.equal(take().status, 0);
  const taken = blocks.run(
    "intake.mjs",
    ["--target", dir, "--need", need, "--file", "src/components/order-rows.tsx"],
    list,
  );
  assert.equal(taken.status, 0, taken.stdout + taken.stderr);
  const kept = () =>
    blocks
      .snapshot(dir)
      .filter((entry) =>
        /^(src\/|design\/intake\.yaml|design\/conform\/|design\/core\/blocks\/)/.test(entry),
      );
  const inventory = () =>
    JSON.parse(blocks.run("inventory.mjs", ["--target", dir, "--json"], list).stdout).findings;
  const before = { files: kept(), findings: inventory(), again: take("--dry-run") };

  // The family's owner changes its one answer; the member is told, and accepts.
  const changed = blocks.run(
    "core.mjs",
    [
      "--change",
      "source-color",
      "--core",
      place,
      "--by",
      blocks.OWNER,
      "--why",
      "the brand was redrawn",
      "--value",
      OTHER,
    ],
    list,
  );
  assert.equal(changed.status, 0, changed.stderr);
  assert.equal(blocks.run("core.mjs", ["--target", dir, "--moved"], list).status, 1);
  const done = blocks.run(
    "core.mjs",
    ["--target", dir, "--accept-all", "--by", blocks.MEMBER, "--on", ACCEPTED_ON],
    list,
  );
  assert.equal(done.status, 0, done.stdout + done.stderr);
  assert.equal(readPinnedCore(dir).unreadable, null);
  // The block taken in, its row, its record and the copy's files are as they were; the inventory
  // finds what it found; and taking the block down again says what it said.
  assert.deepEqual(kept(), before.files);
  assert.deepEqual(inventory(), before.findings);
  const again = take("--dry-run");
  assert.equal(again.status, before.again.status);
  // It names the pin of the copy, which moved with the answers; the block and what it says did not.
  const pinless = (said) => said.replace(/core at [0-9a-f]{12}/g, "core at <pin>");
  assert.notEqual(again.stdout, before.again.stdout);
  assert.equal(pinless(again.stdout), pinless(before.again.stdout));
  assert.match(
    again.stdout,
    /is taken down for order-rows already.*: nothing to take down\nit is taken in/,
  );
  assert.equal(again.stderr, before.again.stderr);
});

test("a repository that accepted part of a change and then leaves: the copy and the record of what it accepted go, the marks turn, and nothing comes back", () => {
  const dir = adopted();
  const place = coreFolder({ colour: primaryOf(dir) });
  const list = listIn();
  assert.equal(join(dir, place, list).status, 0);
  change(place, list, "source-color", ["--value", OTHER, "--why", "the brand was redrawn"]);
  change(place, list, "failed-action", [
    "--hold",
    "default",
    "--why",
    "kept by a test in each app",
  ]);
  // It accepts the colour and leaves the other: a question waits, at the newer pin.
  assert.equal(accept(dir, list, ["--accept", "source-color"]).status, 1);
  const pin = copyPin(dir);
  const question = `design/waiting/core-source-color-${pin}.json`;
  assert.ok(existsSync(path.join(dir, question)));
  assert.deepEqual(read(dir, DECLARATION).accepted.left, ["failed-action"]);
  assert.match(
    noteOf(dir, "failed-action"),
    new RegExp(`^inherited from the family core at ${pin}`),
  );
  assert.match(
    line(dir, list).stdout,
    /is ahead of this repository's pin .*; 1 question about the core waits/,
  );
  const sheet = text(dir, "src/index.css");
  const tokens = text(dir, "design/tokens.json");

  const left = core(
    [
      "--target",
      dir,
      "--leave",
      "--by",
      MEMBER,
      "--why",
      "the product goes its own way",
      "--on",
      "2026-11-29",
    ],
    list,
  );
  assert.equal(left.status, 0, left.stdout + left.stderr);
  // The declaration, with what it recorded of the acceptance, and the whole copy are gone.
  assert.ok(!existsSync(path.join(dir, DECLARATION)));
  assert.ok(!existsSync(path.join(dir, COPY)));
  // The marks at the newer pin turn like any other: the answers are the repository's own.
  for (const id of ["failed-action", "record-panel"]) {
    const note = noteOf(dir, id);
    assert.match(note, /^own since 2026-11-29, when the repository left its family: /, id);
    assert.match(note, new RegExp(`once inherited from the family core at ${pin}`), id);
  }
  // No value of the repository moved, and its gate holds.
  assert.equal(text(dir, "src/index.css"), sheet);
  assert.equal(text(dir, "design/tokens.json"), tokens);
  assert.equal(gate(dir).status, 0, gate(dir).stderr);
  // The core's list of members lost it, at whatever pin it was.
  assert.deepEqual(read(place, "core.json").members, []);

  // Nothing comes back: the question leaving took off the list stays off, whatever is run after;
  // no line at a session's start; and the moves of a member say the repository declares no family.
  assert.ok(!existsSync(path.join(dir, question)));
  const after = snapshot(dir);
  for (const script of ["status.mjs", "inventory.mjs"]) {
    const told = run(script, ["--target", dir, "--json"], list);
    assert.ok(!("core" in JSON.parse(told.stdout)), script);
    assert.ok(
      !JSON.parse(run("status.mjs", ["--target", dir, "--json"], list).stdout).waiting.some(
        (item) => item.id.startsWith("core-"),
      ),
    );
  }
  assert.equal(line(dir, list).stdout, "");
  assert.equal(line(dir, list).status, 0);
  for (const args of [
    ["--moved"],
    ["--accept-all", "--by", MEMBER],
    ["--moved", "--core", place],
  ]) {
    const refused = core(["--target", dir, ...args], list);
    assert.equal(refused.status, 2, args.join(" "));
    assert.match(refused.stderr, /this repository declares no family/);
  }
  assert.deepEqual(snapshot(dir), after);
  assert.ok(!existsSync(path.join(dir, question)));
  // The core is still the family's: its owner changes it as before.
  change(place, list, "record-panel", [
    "--hold",
    "default",
    "--why",
    "one app opens records in place",
  ]);
  assert.equal(core(["--check", "--core", place], list).status, 0);
  assert.equal(read(place, "core.json").owner.by, OWNER);
});
