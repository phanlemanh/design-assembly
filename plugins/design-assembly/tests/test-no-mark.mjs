// A repository with no mark of its own is unchanged by item 12.2 (spec 0017, criterion 1): on the
// four kinds of repository that criterion names (no ledger, adopted, built by the guide, adopted with
// no Makefile), status, audit, the preview of adopt as text and as data, the preview of the guide and
// the gate print and end as plugin 0.69.0 printed and ended, before the item was built. The record
// was made with tests/helpers/no-mark.mjs on that version; the words that move with every version
// (its number, the counts of its known limits, the folder a fixture sits in, the day) are put back
// to one word on both sides.
import "./helpers/own-cores.mjs";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { after, test } from "node:test";

import { cleanup, PLUGIN } from "./helpers/core-family.mjs";
import { KINDS, observe, readRecord } from "./helpers/no-mark.mjs";

after(cleanup);

const VERSION = JSON.parse(
  readFileSync(path.join(PLUGIN, ".claude-plugin/plugin.json"), "utf8"),
).version;

for (const kind of Object.keys(KINDS)) {
  test(`the ${kind} repository, with no mark, reads, asks and ends as it did before item 12.2`, () => {
    const before = readRecord().kinds[kind];
    const now = observe(KINDS[kind](), VERSION);
    assert.deepEqual(Object.keys(now), Object.keys(before), `${kind}: the commands run`);
    for (const command of Object.keys(before)) {
      assert.equal(now[command].exit, before[command].exit, `${kind}, ${command}: exit`);
      assert.equal(now[command].out, before[command].out, `${kind}, ${command}: output`);
      assert.equal(now[command].err, before[command].err, `${kind}, ${command}: errors`);
    }
  });
}
