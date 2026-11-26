// The keys the intake ledger gains for the reusable store, all of them optional so that the shape
// stays 1: which pinned source a block came from, the hash of its file when it was taken in, a
// change made on purpose, a block retired or merged into another, the things made before the
// ledger, and how the repository writes the value "made by hand". A tool of an older version reads
// a ledger with these keys as keys of the repository's own, and holds it as before.
import "./helpers/own-cores.mjs";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { after, test } from "node:test";
import { fileURLToPath, pathToFileURL } from "node:url";

import { shapeProblems } from "../templates/tools/design-assembly/contract.mjs";
import {
  BY_HAND,
  INTAKE_KEYS,
  isByHand,
  keysLine,
  readIntakeLedger,
} from "../templates/tools/design-assembly/intake-ledger.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "../../..");
// The last commit of the plugin at version 0.7.3, the one before these keys.
const BEFORE = "03e2a99";
const TOOL = "plugins/design-assembly/templates/tools/design-assembly";

const made = [];
after(() => made.forEach((dir) => rmSync(dir, { recursive: true, force: true })));

const HASH = "a".repeat(64);

export const WITH_NEW_KEYS = [
  "version: 1",
  "values: { by-hand: made-by-hand }",
  "before:",
  "  - name: FormDialog",
  "    file: src/components/form-dialog.tsx",
  "    record: people-and-roles",
  "    why: Made before this ledger existed",
  "blocks:",
  "  - name: DataRegion",
  "    file: src/components/data-region.tsx",
  "    source: data-grid-6",
  "    from: kit",
  "    pin: 2026-11-11",
  "    need: many-rows",
  "    approved: 2026-11-12",
  "    approved_by: the owner",
  `    taken: ${HASH}`,
  '    changed: { on: 2026-11-15, why: "Rows are 32 px high here" }',
  "  - name: OldHeader",
  "    file: src/components/old-header.tsx",
  "    source: made-by-hand",
  "    need: page-head",
  "    approved: 2026-11-12",
  "    retired: { on: 2026-11-18, by: the owner, why: Merged into the frame }",
  "    merged_into: app-frame",
  "",
].join("\n");

test("the new keys are keys of the contract a repository may spell its own way", () => {
  for (const key of [
    "from",
    "taken",
    "changed",
    "retired",
    "merged_into",
    "before",
    "values",
    "why",
  ]) {
    assert.ok(INTAKE_KEYS.includes(key), key);
  }
});

test("a ledger with every new key holds, and each key is read in the contract's terms", () => {
  assert.deepEqual(shapeProblems("intake", WITH_NEW_KEYS), []);
  const ledger = readIntakeLedger(WITH_NEW_KEYS);
  assert.equal(ledger.blocks[0].from, "kit");
  assert.equal(ledger.blocks[0].taken, HASH);
  assert.deepEqual(ledger.blocks[0].changed, { on: "2026-11-15", why: "Rows are 32 px high here" });
  assert.equal(ledger.blocks[1].merged_into, "app-frame");
  assert.deepEqual(ledger.before, [
    {
      name: "FormDialog",
      file: "src/components/form-dialog.tsx",
      record: "people-and-roles",
      why: "Made before this ledger existed",
    },
  ]);
});

test("each new key written wrong is named", () => {
  const swap = (from, to) => shapeProblems("intake", WITH_NEW_KEYS.replace(from, to)).join("\n");
  assert.match(swap(`taken: ${HASH}`, "taken: abc"), /taken is "abc"/);
  assert.match(swap("from: kit", "from: Kit One"), /from is "Kit One"/);
  assert.match(
    swap('{ on: 2026-11-15, why: "Rows are 32 px high here" }', "{ on: 2026-11-15 }"),
    /changed\.why is missing/,
  );
  assert.match(swap("by: the owner, ", ""), /retired\.by is missing/);
  assert.match(
    swap("retired: { on: 2026-11-18", "retired: { on: yesterday"),
    /retired\.on is "yesterday"/,
  );
  assert.match(
    swap("merged_into: app-frame", "merged_into: The Frame"),
    /merged_into is "The Frame"/,
  );
  assert.match(
    swap("    why: Made before this ledger existed\n", ""),
    /before\[0\]\.why is missing/,
  );
  assert.match(swap("values: { by-hand: made-by-hand }", "values: by hand"), /values is string/);
});

test("a repository that spells the new keys its own way is read in the contract's keys", () => {
  const own = [
    "version: 1",
    "keys: { blocks: khoi, name: ten, file: tep, source: nguon, need: nhu_cau, approved: duyet, before: khoi_co_truoc, why: vi_sao }",
    "values: { by-hand: tao-tay }",
    "khoi_co_truoc:",
    "  - ten: FormDialog",
    "    ho_so: moi-nguoi-gan-vai",
    "    vi_sao: Made before this ledger",
    "khoi:",
    "  - ten: PageHeader",
    "    tep: src/components/templates/page-header.tsx",
    "    nguon: tao-tay",
    "    nhu_cau: dau-trang",
    "    duyet: 2026-11-12",
    "    retired: { on: 2026-11-18, by: the owner, vi_sao: Merged into the frame }",
    "",
  ].join("\n");
  assert.deepEqual(shapeProblems("intake", own), []);
  const ledger = readIntakeLedger(own);
  assert.equal(ledger.blocks[0].retired.why, "Merged into the frame");
  assert.deepEqual(ledger.before, [
    { name: "FormDialog", ho_so: "moi-nguoi-gan-vai", why: "Made before this ledger" },
  ]);
  assert.equal(isByHand(ledger, ledger.blocks[0]), true);
  // Missing in the repository's spelling, a key is named both ways.
  assert.match(
    shapeProblems("intake", own.replace("    vi_sao: Made before this ledger\n", "")).join(),
    /before \(khoi_co_truoc\)\[0\]\.why \(vi_sao\) is missing/,
  );
});

test("made by hand is the contract's word, or the one the repository gives under values", () => {
  const ledger = readIntakeLedger(WITH_NEW_KEYS);
  assert.equal(BY_HAND, "by-hand");
  assert.equal(isByHand(ledger, ledger.blocks[1]), true);
  assert.equal(isByHand(ledger, ledger.blocks[0]), false);
  const plain = readIntakeLedger("version: 1\nblocks:\n  - source: by-hand\n");
  assert.equal(isByHand(plain, plain.blocks[0]), true);
});

test("the tool of version 0.7.3 holds a ledger with the new keys, as keys of the repository's own", async () => {
  const dir = mkdtempSync(path.join(tmpdir(), "design-assembly-old-tool-"));
  made.push(dir);
  const archive = spawnSync("git", ["-C", ROOT, "archive", BEFORE, TOOL], { maxBuffer: 1 << 26 });
  assert.equal(archive.status, 0, String(archive.stderr));
  const untar = spawnSync("tar", ["-x", "-C", dir], { input: archive.stdout });
  assert.equal(untar.status, 0, String(untar.stderr));
  const old = await import(pathToFileURL(path.join(dir, TOOL, "contract.mjs")).href);
  assert.deepEqual(old.shapeProblems("intake", WITH_NEW_KEYS), []);
});

// Taken from the old tool, to read a ledger exactly as it read it before these keys.
async function oldIntakeReader() {
  const dir = mkdtempSync(path.join(tmpdir(), "design-assembly-old-reader-"));
  made.push(dir);
  const archive = spawnSync("git", ["-C", ROOT, "archive", BEFORE, TOOL], { maxBuffer: 1 << 26 });
  spawnSync("tar", ["-x", "-C", dir], { input: archive.stdout });
  return import(pathToFileURL(path.join(dir, TOOL, "intake-ledger.mjs")).href);
}

const withoutSpelling = (ledger) =>
  Object.fromEntries(Object.entries(ledger).filter(([key]) => key !== "spelled"));

test("a ledger without the new keys reads as the tool of 0.7.3 read it, in either spelling", async () => {
  const old = await oldIntakeReader();
  const ledgers = [
    "version: 1\nblocks:\n  - name: A\n    file: a.tsx\n    source: kit-1\n    need: a-need\n    approved: 2026-11-12\n    owner_note: kept\nnotes: beside the blocks\n",
    "version: 1\nkeys: { blocks: khoi, name: ten, need: nhu_cau, record: ho_so }\nkhoi_co_truoc:\n  - ten: FormDialog\nkhoi:\n  - ten: A\n    nhu_cau: a-need\n    ho_so: round-1\n",
  ];
  for (const text of ledgers) {
    assert.deepEqual(
      withoutSpelling(readIntakeLedger(text)),
      withoutSpelling(old.readIntakeLedger(text)),
    );
  }
});

test("a repository that spells an older key with the name of a new one reads as before", async () => {
  const old = await oldIntakeReader();
  const text = [
    "version: 1",
    "keys: { source: from, description: why, name: before }",
    "blocks:",
    "  - before: DataRegion",
    "    file: src/components/data-region.tsx",
    "    from: data-grid-6",
    "    need: many-rows",
    "    why: Many rows to read",
    "    approved: 2026-11-12",
    "",
  ].join("\n");
  assert.deepEqual(shapeProblems("intake", text), []);
  const ledger = readIntakeLedger(text);
  assert.equal(ledger.blocks[0].source, "data-grid-6");
  assert.equal(ledger.blocks[0].name, "DataRegion");
  assert.equal(ledger.blocks[0].description, "Many rows to read");
  assert.deepEqual(withoutSpelling(ledger), withoutSpelling(old.readIntakeLedger(text)));
  // And the line a fragment is read with keeps only what the repository spelled.
  assert.equal(
    keysLine(ledger.spelled),
    "keys: { name: before, source: from, description: why }\n",
  );
});

test("a key of the repository's own that bears a new key's name is named when it leaves the shape", () => {
  const text = [
    "version: 1",
    "blocks:",
    "  - name: A",
    "    file: a.tsx",
    "    source: kit-1",
    "    need: a-need",
    "    approved: 2026-11-12",
    "    retired: true",
    "",
  ].join("\n");
  assert.match(
    shapeProblems("intake", text).join(),
    /blocks\[0\]\.retired is string, the contract says object/,
  );
});
