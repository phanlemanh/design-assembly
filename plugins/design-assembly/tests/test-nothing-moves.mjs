// Item 7.4 moves nothing it was not asked to move: on the four kinds of repository the other tests
// use (no ledger, adopted with a Makefile, built by the guide, another stack), the commands that read
// a repository print and end as plugin 0.65.0 printed and ended, before the item was built. The
// record was made with tests/helpers/four-kinds.mjs on that version; the words that move with every
// version (its number, the counts of its known limits, the folder a fixture sits in, the day) are
// put back to one word on both sides.
import "./helpers/own-cores.mjs";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { after, test } from "node:test";

import { cleanup, PLUGIN } from "./helpers/core-family.mjs";
import { KINDS, observe, readRecord } from "./helpers/four-kinds.mjs";

after(cleanup);

const VERSION = JSON.parse(
  readFileSync(path.join(PLUGIN, ".claude-plugin/plugin.json"), "utf8"),
).version;

for (const kind of Object.keys(KINDS)) {
  test(`the ${kind} repository reads as it did before item 7.4`, () => {
    const before = readRecord().kinds[kind];
    const now = observe(KINDS[kind](), VERSION);
    for (const command of Object.keys(before)) {
      assert.equal(now[command].exit, before[command].exit, `${kind}, ${command}: exit`);
      assert.equal(now[command].out, before[command].out, `${kind}, ${command}: output`);
      assert.equal(now[command].err, before[command].err, `${kind}, ${command}: errors`);
    }
  });
}
