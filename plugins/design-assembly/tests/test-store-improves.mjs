// The store improves (specification 0015, slice 6, criteria 12 and 13): change widens a block, saying
// first which screens it reaches, asking the owner, then recording the change on the block's row;
// and the inventory names each item of an outside source that stands behind its source's pin, by
// the pin its conform record was written at. Nothing calls a model or the network.
import "./helpers/own-cores.mjs";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { lstatSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { execPath } from "node:process";
import { after, test } from "node:test";
import { fileURLToPath } from "node:url";

import { shapeProblems } from "../templates/tools/design-assembly/contract.mjs";
import { readIntakeLedger } from "../templates/tools/design-assembly/intake-ledger.mjs";
import { ledgerText } from "../templates/tools/design-assembly/screen-fragments.mjs";
import {
  BLOCKS,
  cleanUp,
  COMPONENT,
  empty,
  FETCHED,
  healthyFiles,
  intake,
  json,
  put,
  repo,
  sha,
  source,
} from "./helpers/store-repo.mjs";

const PLUGIN = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const CHANGE = path.join(PLUGIN, "scripts/change.mjs");
const DECIDE = path.join(PLUGIN, "scripts/decide.mjs");
const INVENTORY = path.join(PLUGIN, "scripts/inventory.mjs");
const OWNER = ["--by", "The Owner", "--on", "2026-11-18"];
const WHY = "Every list filters by date as well";
const FILTER = "src/components/filter-bar.tsx";

after(cleanUp);

const node = (script, args) => spawnSync(execPath, [script, ...args], { encoding: "utf8" });
const changeJson = (dir, ...args) => {
  const run = node(CHANGE, ["--target", dir, ...args, "--json"]);
  return { status: run.status, stderr: run.stderr, result: JSON.parse(run.stdout || "null") };
};
const inventoryJson = (dir) => JSON.parse(node(INVENTORY, ["--target", dir, "--json"]).stdout);
function answer(dir, line) {
  const file = path.join(empty(), "answers.txt");
  writeFileSync(file, `${line}\n`);
  const run = node(DECIDE, ["--target", dir, "--answers", file, ...OWNER]);
  assert.ok([0, 1].includes(run.status), run.stderr);
}
function snapshot(dir, at = "") {
  return readdirSync(path.join(dir, at))
    .sort()
    .flatMap((name) => {
      const relative = path.posix.join(at, name);
      const full = path.join(dir, relative);
      if (lstatSync(full).isDirectory()) return [`${relative}/`, ...snapshot(dir, relative)];
      return [`${relative} ${createHash("sha256").update(readFileSync(full)).digest("hex")}`];
    });
}
const blockOf = (dir, need) =>
  readIntakeLedger(ledgerText(dir, "design/intake.yaml", "intake")).blocks.find(
    (item) => item.need === need,
  );
const store = (files = {}) =>
  repo({ ...healthyFiles(), "design/theme.json": json({ version: 1, checks: {} }), ...files });
const WIDER = COMPONENT("FilterBar").replace("rows.length", "rows.length + 1");
const modifiedOf = (dir) => inventoryJson(dir).findings.filter((item) => item.kind === "modified");

// ---- criterion 12: change widens a block ----------------------------------------------------------

test("criterion 12: widening a block says first which screens it reaches, asks the owner, and writes nothing else", () => {
  const dir = store();
  const before = snapshot(dir);
  const { status, result } = changeJson(dir, "filter-list", "--widen", "--why", WHY);
  assert.equal(status, 1, result?.next);
  assert.deepEqual(result.impact.screens, ["team"]);
  const now = snapshot(dir).filter((line) => !before.includes(line) && !line.endsWith("/"));
  assert.deepEqual(
    now.map((line) => line.slice(0, line.lastIndexOf(" "))),
    ["design/waiting/change-filter-list.json"],
  );
  const question = JSON.parse(
    readFileSync(path.join(dir, "design/waiting/change-filter-list.json"), "utf8"),
  );
  assert.match(question.question, /Widen the block FilterBar/);
  assert.match(question.basis, new RegExp(WHY));
  assert.match(question.basis, /team/);
  assert.equal(blockOf(dir, "filter-list").changed, undefined);
});

test("criterion 12: once the owner keeps it and the file holds the change, the change is recorded on the row, with its hash", () => {
  const dir = store();
  changeJson(dir, "filter-list", "--widen", "--why", WHY);
  answer(dir, "change-filter-list giữ");
  // The file is as it was taken in: nothing to record yet.
  const waiting = changeJson(dir, "filter-list");
  assert.equal(waiting.status, 1);
  assert.match(waiting.result.next, /widen src\/components\/filter-bar\.tsx/);
  assert.equal(blockOf(dir, "filter-list").changed, undefined);
  put(dir, FILTER, WIDER);
  const done = changeJson(dir, "filter-list");
  assert.equal(done.status, 0, done.stderr);
  assert.deepEqual(blockOf(dir, "filter-list").changed, {
    on: "2026-11-18",
    by: "The Owner",
    why: WHY,
    sha256: sha(WIDER),
  });
  assert.deepEqual(
    shapeProblems("intake", ledgerText(dir, "design/intake.yaml", "intake"), "design/intake.yaml"),
    [],
  );
  assert.deepEqual(modifiedOf(dir), []);
  // An edit after the change was recorded is a hand edit again.
  put(dir, FILTER, `${WIDER}// later\n`);
  assert.match(JSON.stringify(modifiedOf(dir)), /filter-bar\.tsx/);
});

test("criterion 12: a block widened once is widened again on a question of its own, and the newer change replaces the older", () => {
  const dir = store();
  changeJson(dir, "filter-list", "--widen", "--why", WHY);
  answer(dir, "change-filter-list giữ");
  put(dir, FILTER, WIDER);
  changeJson(dir, "filter-list");
  // The answered question was carried out: it is not taken for the next widening.
  const again = changeJson(dir, "filter-list", "--widen", "--why", "It sorts too");
  assert.equal(again.status, 1);
  assert.equal(again.result.waiting, "change-filter-list-2");
  answer(dir, "change-filter-list-2 giữ");
  const widest = `${WIDER}// sorts\n`;
  put(dir, FILTER, widest);
  assert.equal(changeJson(dir, "filter-list").status, 0);
  assert.deepEqual(blockOf(dir, "filter-list").changed, {
    on: "2026-11-18",
    by: "The Owner",
    why: "It sorts too",
    sha256: sha(widest),
  });
});

test("criterion 12: widening refuses an item an outside source holds through its conform record, and a block the ledger does not keep", () => {
  const conformed = {
    ...BLOCKS[0],
    conform: "design/conform/many-rows.json",
  };
  const text = intake([conformed, ...BLOCKS.slice(1)]).replace(
    "    taken:",
    "    conform: design/conform/many-rows.json\n    taken:",
  );
  const dir = store({ "design/intake.yaml": text });
  const before = snapshot(dir);
  const outside = changeJson(dir, "many-rows", "--widen", "--why", WHY);
  assert.equal(outside.status, 2);
  assert.match(outside.stderr, /conform --need many-rows --patch/);
  const nowhere = changeJson(dir, "no-such-need", "--widen", "--why", WHY);
  assert.equal(nowhere.status, 2);
  assert.deepEqual(snapshot(dir), before);
  // --widen says why.
  assert.equal(changeJson(dir, "filter-list", "--widen").status, 2);
  assert.equal(changeJson(dir, "filter-list", "--widen", "--retire", "--why", WHY).status, 2);
});

// ---- criterion 13: an item behind its pin ---------------------------------------------------------

// JSON with its keys in order, hashed: the pin as a conform record keeps it.
const stable = (value) =>
  Array.isArray(value)
    ? `[${value.map(stable).join(",")}]`
    : value !== null && typeof value === "object"
      ? `{${Object.keys(value)
          .sort()
          .map((key) => `${JSON.stringify(key)}:${stable(value[key])}`)
          .join(",")}}`
      : JSON.stringify(value);
const pinHashOf = (fetched = FETCHED) => sha(stable(source(fetched).pin));
const record = (need, item, file, pin = pinHashOf()) => ({
  version: 1,
  need,
  source: "kit",
  item,
  ...(pin ? { pin_sha256: pin } : {}),
  taken: [{ file, sha256: "0".repeat(64) }],
  conformed: [{ file, sha256: "0".repeat(64) }],
  patches: [],
  exemptions: [],
});
const behind = (dir) =>
  inventoryJson(dir)
    .findings.filter((item) => item.kind === "outdated")
    .flatMap((item) => item.evidence);

test("criterion 13: when the source is pinned again, the inventory names each item conformed at the older pin, taken in or only taken down", () => {
  const dir = store({
    "design/conform/narrow-list.json": json(
      record("narrow-list", "filter-bar", "src/components/kit/narrow-list.tsx"),
    ),
  });
  assert.deepEqual(
    behind(dir).filter((line) => /filter-bar/.test(line)),
    [],
  );
  // Pinned again on the same day: the pin's files differ, its day does not.
  const repinned = source();
  repinned.pin.files[0].sha256 = "1".repeat(64);
  put(dir, "design/sources/kit.json", json(repinned));
  const lines = behind(dir);
  assert.ok(
    lines.some((line) => /filter-bar/.test(line) && /narrow-list/.test(line) && /kit/.test(line)),
    lines.join("\n"),
  );
});

test("criterion 13: a record written before its pin was kept, or a source with no pin, cannot be compared, and the inventory says so", () => {
  const dir = store({
    "design/conform/narrow-list.json": json(
      record("narrow-list", "filter-bar", "src/components/kit/narrow-list.tsx", null),
    ),
  });
  const blind = inventoryJson(dir).blind.filter((item) => item.kind === "outdated");
  assert.match(JSON.stringify(blind), /narrow-list/);
  const unpinned = store({
    "design/conform/narrow-list.json": json(
      record("narrow-list", "filter-bar", "src/components/kit/narrow-list.tsx"),
    ),
  });
  // The source's file keeps no pin at all.
  const { pin, ...rest } = source();
  assert.ok(pin);
  put(unpinned, "design/sources/kit.json", json(rest));
  const said = JSON.stringify(inventoryJson(unpinned).blind);
  assert.match(said, /filter-bar \(narrow-list\)|kit/);
  assert.equal(
    inventoryJson(unpinned).findings.some((item) => /narrow-list/.test(JSON.stringify(item))),
    false,
  );
});
