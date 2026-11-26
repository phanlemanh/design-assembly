// change: a block of the store is retired, or merged into the block of another need, only on the
// owner's answer (specification 0006, part B4). First the impact: which screens reach the block's
// file, which components import it, which checks name it, and each import line to fix. Then one
// question on the waiting list. Once the owner keeps it, the block's entry in the intake ledger says
// so; no file is removed and no screen's code is changed.
import "./helpers/own-cores.mjs";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { lstatSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { execPath } from "node:process";
import { after, test } from "node:test";
import { fileURLToPath } from "node:url";

import { screensOf } from "../templates/tools/design-assembly/affected.mjs";
import { shapeProblems } from "../templates/tools/design-assembly/contract.mjs";
import { readIntakeLedger } from "../templates/tools/design-assembly/intake-ledger.mjs";
import { ledgerText } from "../templates/tools/design-assembly/screen-fragments.mjs";
import {
  BLOCKS,
  block,
  cleanUp,
  COMPONENT,
  empty,
  healthyFiles,
  ITEMS,
  json,
  put,
  repo,
} from "./helpers/store-repo.mjs";

const PLUGIN = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const CHANGE = path.join(PLUGIN, "scripts/change.mjs");
const DECIDE = path.join(PLUGIN, "scripts/decide.mjs");
const INVENTORY = path.join(PLUGIN, "scripts/inventory.mjs");
// The day of the answer is not today: the ledger carries the answer's day, never the clock's.
const OWNER = ["--by", "The Owner", "--on", "2026-11-18"];
const WHY = "Two tables are one too many";

after(cleanUp);

const text = (dir, file) => readFileSync(path.join(dir, file), "utf8");
const data = (dir, file) => JSON.parse(text(dir, file));
const node = (script, args) => spawnSync(execPath, [script, ...args], { encoding: "utf8" });
const change = (dir, ...args) => node(CHANGE, ["--target", dir, ...args]);
const changeJson = (dir, ...args) => {
  const run = change(dir, ...args, "--json");
  return {
    status: run.status,
    stderr: run.stderr,
    result: run.stdout ? JSON.parse(run.stdout) : null,
  };
};
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
const changed = (before, now) =>
  now
    .filter((line) => !line.endsWith("/") && !before.includes(line))
    .map((line) => line.slice(0, line.lastIndexOf(" ")))
    .sort();
const sourceOf = (dir) => snapshot(dir).filter((line) => line.startsWith("src/"));

const THEME = json({ version: 1, checks: {} });
const store = (files = {}) => repo({ ...healthyFiles(), "design/theme.json": THEME, ...files });
const ledger = (dir, file = "design/intake.yaml") =>
  readIntakeLedger(ledgerText(dir, file, "intake"));
const blockOf = (dir, need, file) => ledger(dir, file).blocks.find((item) => item.need === need);
const shapeOf = (dir, file = "design/intake.yaml") =>
  shapeProblems("intake", ledgerText(dir, file, "intake"), file);
const stateOf = (dir, name) =>
  JSON.parse(node(INVENTORY, ["--target", dir, "--json"]).stdout).items.find(
    (item) => item.name === name,
  )?.state;
// Retired, then answered: the steps every test of a kept question takes.
function retired(dir) {
  change(dir, "many-rows", "--retire", "--why", WHY);
  answer(dir, "change-many-rows giữ");
}

test("the impact comes first: the screens screensOf says reach the file, the components that import it, and each import line", () => {
  const dir = store({
    "src/components/region-card.tsx": `import { DataRegion } from "./data-region";\n${COMPONENT("RegionCard")}`,
  });
  const before = snapshot(dir);
  const { status, result } = changeJson(dir, "many-rows", "--retire", "--why", WHY, "--dry-run");
  assert.equal(status, 1);
  const reach = screensOf(dir, {})
    .screens.filter((screen) => screen.files.has("src/components/data-region.tsx"))
    .map((screen) => screen.id);
  assert.deepEqual(result.impact.screens, reach);
  assert.deepEqual(result.impact.screens, ["items"]);
  assert.equal(result.impact.all, false);
  assert.deepEqual(result.impact.components, ["RegionCard"]);
  assert.deepEqual(result.edits, [
    {
      file: "src/components/region-card.tsx",
      line: 1,
      import: 'import { DataRegion } from "./data-region";',
    },
    {
      file: "src/pages/Items.tsx",
      line: 1,
      import: 'import { DataRegion } from "@/components/data-region";',
    },
  ]);
  // A preview writes nothing, and names the one file the real call writes.
  assert.deepEqual(snapshot(dir), before);
  assert.deepEqual(
    result.files.map((item) => item.path),
    ["design/waiting/change-many-rows.json"],
  );
  // A block is named by its need or by its name.
  const named = changeJson(dir, "DataRegion", "--retire", "--why", WHY, "--dry-run");
  assert.deepEqual(named.result.impact, result.impact);
});

test("the question goes to the waiting list, with the impact in its basis, and the ledger is not touched", () => {
  const dir = store();
  const before = snapshot(dir);
  const { status, result } = changeJson(dir, "many-rows", "--retire", "--why", WHY);
  assert.equal(status, 1);
  assert.equal(result.waiting, "change-many-rows");
  assert.deepEqual(changed(before, snapshot(dir)), ["design/waiting/change-many-rows.json"]);
  const question = data(dir, "design/waiting/change-many-rows.json");
  assert.equal(question.item, "block:many-rows");
  assert.match(question.question, /DataRegion/);
  assert.match(question.basis, new RegExp(WHY));
  assert.match(question.basis, /items/);
  assert.equal(question.answer, undefined);
  assert.doesNotMatch(JSON.stringify(question), /The Owner/);
  // Asked again before the answer: it waits, and nothing changes.
  const asked = snapshot(dir);
  assert.equal(change(dir, "many-rows", "--retire", "--why", WHY).status, 1);
  assert.deepEqual(snapshot(dir), asked);
});

test("once kept, the entry says it is retired with the answer's name and day; no file goes and no screen changes", () => {
  const dir = store();
  retired(dir);
  const code = sourceOf(dir);
  const before = snapshot(dir);
  const preview = changeJson(dir, "many-rows", "--dry-run");
  assert.equal(preview.status, 0, preview.stderr);
  assert.deepEqual(snapshot(dir), before);
  const { status, result } = changeJson(dir, "many-rows");
  assert.equal(status, 0);
  const written = changed(before, snapshot(dir));
  assert.deepEqual(written, ["design/intake.yaml"]);
  assert.deepEqual(
    preview.result.files.map((item) => item.path),
    written,
  );
  assert.deepEqual(blockOf(dir, "many-rows").retired, {
    on: "2026-11-18",
    by: "The Owner",
    why: WHY,
  });
  assert.deepEqual(result.row.retired, blockOf(dir, "many-rows").retired);
  // Everything else of the entry, and every other entry, is as it was.
  const was = ledger(repo(healthyFiles())).blocks;
  const { retired: entered, ...rest } = blockOf(dir, "many-rows");
  assert.equal(entered.why, WHY);
  assert.deepEqual(rest, was[0]);
  assert.deepEqual(ledger(dir).blocks.slice(1), was.slice(1));
  assert.deepEqual(shapeOf(dir), []);
  // The code is the same, byte for byte, and the inventory sees a screen still using it.
  assert.deepEqual(sourceOf(dir), code);
  assert.equal(stateOf(dir, "DataRegion"), "retired-in-use");
  // Called again, nothing is left.
  const done = snapshot(dir);
  const again = changeJson(dir, "many-rows", "--retire", "--why", WHY);
  assert.equal(again.status, 0);
  assert.match(again.result.next, /retired/);
  assert.deepEqual(snapshot(dir), done);
});

test("merging into another need: the entry is retired and names the need it was merged into", () => {
  const dir = store();
  const { status } = changeJson(dir, "filter-list", "--merge-into", "many-rows");
  assert.equal(status, 1);
  const question = data(dir, "design/waiting/change-filter-list.json");
  assert.match(question.question, /FilterBar.*many-rows/);
  answer(dir, "change-filter-list giữ");
  assert.equal(change(dir, "filter-list").status, 0);
  const entry = blockOf(dir, "filter-list");
  assert.equal(entry.merged_into, "many-rows");
  assert.equal(entry.retired.by, "The Owner");
  assert.match(entry.retired.why, /merged into many-rows/);
  assert.deepEqual(shapeOf(dir), []);
  assert.equal(stateOf(dir, "FilterBar"), "retired-in-use");
});

test("a merge goes only into another need the ledger keeps, not retired", () => {
  const dir = store();
  const before = snapshot(dir);
  for (const [into, why] of [
    ["no-such-need", /no-such-need is no need/],
    ["filter-list", /not merged into its own need/],
  ]) {
    const run = change(dir, "filter-list", "--merge-into", into);
    assert.equal(run.status, 2, into);
    assert.equal(run.stdout, "");
    assert.match(run.stderr, why);
  }
  retired(dir);
  change(dir, "many-rows");
  const after = snapshot(dir);
  assert.equal(change(dir, "filter-list", "--merge-into", "many-rows").status, 2);
  assert.deepEqual(snapshot(dir), after);
  assert.notDeepEqual(after, before);
});

test("a refusal writes nothing; asked again with another change, it is a new question", () => {
  const dir = store();
  change(dir, "many-rows", "--retire", "--why", WHY);
  answer(dir, "change-many-rows bác the screens still need it");
  const before = snapshot(dir);
  const refused = changeJson(dir, "many-rows", "--retire", "--why", WHY);
  assert.equal(refused.status, 1);
  assert.match(refused.result.next, /refused.*the screens still need it/);
  assert.deepEqual(snapshot(dir), before);
  const merge = changeJson(dir, "many-rows", "--merge-into", "filter-list");
  assert.equal(merge.status, 1);
  assert.equal(merge.result.waiting, "change-many-rows-2");
  assert.equal(data(dir, "design/waiting/change-many-rows.json").answer, "refuse");
});

test("a kept question is carried out as it was asked: a call that asks for another change is wrong", () => {
  const dir = store();
  retired(dir);
  const before = snapshot(dir);
  const run = change(dir, "many-rows", "--merge-into", "filter-list");
  assert.equal(run.status, 2);
  assert.match(run.stderr, /change-many-rows/);
  assert.deepEqual(snapshot(dir), before);
});

test("a ledger kept as one file per block: only the block's own file changes", () => {
  const files = healthyFiles();
  delete files["design/intake.yaml"];
  const dir = repo({
    ...files,
    "design/theme.json": THEME,
    "design/intake/_shared.yaml": "version: 1\n",
  });
  for (const said of BLOCKS) {
    const entry = block(said)
      .replace(/^ {2}- /, "")
      .replace(/^ {4}/gm, "");
    put(dir, `design/intake/${said.need}.yaml`, `${entry}\n`);
  }
  retired(dir);
  const before = snapshot(dir);
  assert.equal(change(dir, "many-rows").status, 0);
  assert.deepEqual(changed(before, snapshot(dir)), ["design/intake/many-rows.yaml"]);
  assert.equal(blockOf(dir, "many-rows", "design/intake.yaml").retired.why, WHY);
  assert.deepEqual(shapeOf(dir), []);
});

test("a ledger in the repository's own words is written in those words", () => {
  const own = [
    "version: 1",
    "keys: { blocks: khoi, name: ten, file: tep, source: nguon, need: nhu_cau, approved: duyet, retired: nghi, why: vi_sao }",
    "khoi:",
    "  - ten: DataRegion",
    "    tep: src/components/data-region.tsx",
    "    nguon: tao-tay",
    "    nhu_cau: many-rows",
    "    duyet: 2026-11-12",
    "  - ten: FilterBar",
    "    tep: src/components/filter-bar.tsx",
    "    nguon: tao-tay",
    "    nhu_cau: filter-list",
    "    duyet: 2026-11-12",
    "",
  ].join("\n");
  const dir = store({ "design/intake.yaml": own });
  retired(dir);
  assert.equal(change(dir, "many-rows").status, 0);
  const written = text(dir, "design/intake.yaml");
  assert.match(written, /^ {4}nghi:$/m);
  assert.match(written, /^ {6}vi_sao: Two tables are one too many$/m);
  assert.doesNotMatch(written, /^\s+(retired|why):/m);
  assert.equal(blockOf(dir, "many-rows").retired.why, WHY);
  assert.equal(blockOf(dir, "filter-list").retired, undefined);
  assert.deepEqual(shapeOf(dir), []);
});

test("what cannot be traced reaches every screen: no ledger of screens, or an import that cannot be followed", () => {
  const files = healthyFiles();
  const opaque = store({
    "src/pages/Team.tsx": `const page = "x";\nimport(\`./\${page}\`);\n${files["src/pages/Team.tsx"]}`,
  });
  const unlisted = healthyFiles();
  delete unlisted["design/screens.yaml"];
  const noScreens = repo({ ...unlisted, "design/theme.json": THEME });
  for (const dir of [opaque, noScreens]) {
    const { result } = changeJson(dir, "many-rows", "--retire", "--why", WHY, "--dry-run");
    assert.equal(result.impact.all, true);
    assert.ok(result.impact.why.length > 0);
  }
});

test("the checks of the tool data that name the block's file are part of the impact", () => {
  const dir = store({
    "design/theme.json": json({
      version: 1,
      checks: { "row-actions": [{ kind: "component", file: "src/components/data-region.tsx" }] },
    }),
  });
  const { result } = changeJson(dir, "many-rows", "--retire", "--why", WHY, "--dry-run");
  assert.deepEqual(result.impact.checks, ["row-actions"]);
});

test("a name the ledger does not keep, no ledger at all, or a wrong call ends with 2 and writes nothing", () => {
  const dir = store();
  const before = snapshot(dir);
  for (const args of [
    [],
    ["no-such-block", "--retire", "--why", WHY],
    ["many-rows"],
    ["many-rows", "--retire"],
    ["many-rows", "--retire", "--why", " "],
    ["many-rows", "--retire", "--why", WHY, "--merge-into", "filter-list"],
    ["many-rows", "filter-list", "--retire", "--why", WHY],
    ["many-rows", "--retire", "--why", "two\nlines"],
  ]) {
    const run = change(dir, ...args, "--json");
    assert.equal(run.status, 2, `${args.join(" ")}: ${run.stdout}`);
    assert.equal(run.stdout, "", args.join(" "));
    assert.doesNotMatch(run.stderr, /\n\s+at /, args.join(" "));
  }
  assert.deepEqual(snapshot(dir), before);
  const files = healthyFiles();
  delete files["design/intake.yaml"];
  const bare = repo({ ...files, "design/theme.json": THEME });
  const run = change(bare, "many-rows", "--retire", "--why", WHY);
  assert.equal(run.status, 2);
  assert.match(run.stderr, /no intake ledger/);
});

test("a tool copied in before questions could name a block is told to upgrade, and nothing is written", () => {
  const dir = store({
    "design/tool-stamp.json": json({ version: "0.12.0", tree: "0".repeat(40) }),
  });
  const before = snapshot(dir);
  const run = change(dir, "many-rows", "--retire", "--why", WHY);
  assert.equal(run.status, 2);
  assert.match(run.stderr, /upgrade/);
  assert.deepEqual(snapshot(dir), before);
});

test("the same call twice gives the same answer", () => {
  const dir = store();
  const first = change(dir, "many-rows", "--retire", "--why", WHY, "--dry-run", "--json").stdout;
  assert.equal(
    change(dir, "many-rows", "--retire", "--why", WHY, "--dry-run", "--json").stdout,
    first,
  );
  assert.ok(ITEMS.includes("DataRegion"));
});

test("the decision sheet shows the question with its impact, and the change is the one candidate", () => {
  const dir = store();
  change(dir, "many-rows", "--retire", "--why", WHY);
  const shown = node(DECIDE, ["--target", dir]);
  assert.equal(shown.status, 1, shown.stderr);
  assert.match(shown.stdout, /change-many-rows: Retire the block DataRegion \(many-rows\)\?/);
  assert.match(
    shown.stdout,
    /because: Two tables are one too many\. Impact: it reaches the screens items/,
  );
  assert.match(shown.stdout, /1\. retire/);
  const machine = JSON.parse(node(DECIDE, ["--target", dir, "--json"]).stdout);
  assert.equal(machine.questions[0].item, "block:many-rows");
});

test("a block in the middle of the ledger is changed in its own entry, and the entries around it are as they were", () => {
  const dir = store();
  const was = ledger(dir).blocks;
  change(dir, "filter-list", "--retire", "--why", WHY);
  answer(dir, "change-filter-list giữ");
  assert.equal(change(dir, "filter-list").status, 0);
  const now = ledger(dir).blocks;
  assert.deepEqual(now[0], was[0]);
  assert.deepEqual(now[2], was[2]);
  const { retired: kept, ...rest } = now[1];
  assert.deepEqual(rest, was[1]);
  assert.equal(kept.why, WHY);
});

test("a ledger the change cannot be written into so that it reads back the same is never written: a list key given twice", () => {
  // The reader keeps the last of two lists of one name; a change written into the first would be lost.
  const twice = `version: 1\nblocks:\n${block(BLOCKS[1])}\nblocks:\n${block(BLOCKS[0])}\n`;
  const dir = store({ "design/intake.yaml": twice });
  retired(dir);
  const before = snapshot(dir);
  const run = change(dir, "many-rows");
  assert.equal(run.status, 2);
  assert.match(run.stderr, /would not read back/);
  assert.deepEqual(snapshot(dir), before);
});

test("a block kept in a file not named after its need is found by its need, and changed there", () => {
  const files = healthyFiles();
  delete files["design/intake.yaml"];
  const dir = repo({
    ...files,
    "design/theme.json": THEME,
    "design/intake/_shared.yaml": "version: 1\n",
  });
  put(
    dir,
    "design/intake/data-region.yaml",
    `${block(BLOCKS[0])
      .replace(/^ {2}- /, "")
      .replace(/^ {4}/gm, "")}\n`,
  );
  retired(dir);
  const before = snapshot(dir);
  assert.equal(change(dir, "many-rows").status, 0);
  assert.deepEqual(changed(before, snapshot(dir)), ["design/intake/data-region.yaml"]);
});

test("an entry that already holds an empty retired, or a need two entries answer, is refused before anything is asked", () => {
  const empty = store({
    "design/intake.yaml": `version: 1\nblocks:\n${block(BLOCKS[0])}\n    retired: null\n${block(BLOCKS[1])}\n`,
  });
  const twice = store({
    "design/intake.yaml": `version: 1\nblocks:\n${block(BLOCKS[0])}\n${block({ ...BLOCKS[1], need: "many-rows" })}\n`,
  });
  for (const [dir, why] of [
    [empty, /retired with nothing in it/],
    [twice, /two blocks .* answer the need many-rows/],
  ]) {
    const before = snapshot(dir);
    const run = change(dir, "many-rows", "--retire", "--why", WHY);
    assert.equal(run.status, 2);
    assert.match(run.stderr, why);
    assert.deepEqual(snapshot(dir), before);
  }
});

test("a ledger written with CRLF keeps CRLF on the lines the change adds", () => {
  const dir = store();
  put(dir, "design/intake.yaml", text(dir, "design/intake.yaml").replace(/\n/g, "\r\n"));
  retired(dir);
  assert.equal(change(dir, "many-rows").status, 0);
  const written = text(dir, "design/intake.yaml");
  assert.doesNotMatch(written, /[^\r]\n/);
  assert.equal(blockOf(dir, "many-rows").retired.why, WHY);
});

test("another change asked while a question waits is said not to be asked", () => {
  const dir = store();
  change(dir, "many-rows", "--retire", "--why", WHY);
  const { status, result } = changeJson(dir, "many-rows", "--merge-into", "filter-list");
  assert.equal(status, 1);
  assert.match(result.next, /"merge into filter-list" is not asked while it waits for "retire"/);
});
