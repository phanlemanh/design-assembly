// The conform command (specification 0015, slice 3, criteria 7 and 8): an item of an outside source
// is recorded as taken down, every change to its code is a recorded patch with its reason, the
// patches are applied again on a newer item as taken down and stop, naming the patch, where one no
// longer fits; running it twice gives the same hashes; a hand edit is reported for the very file;
// and a rule turned off for the item's folder in the formatter, the lint configuration or the type
// check needs its exemption. No model and no network: patches are applied by the local git.
import "./helpers/own-cores.mjs";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { execPath } from "node:process";
import { after, test } from "node:test";
import { fileURLToPath } from "node:url";

import { shapeProblems } from "../templates/tools/design-assembly/contract.mjs";
import { inventory } from "../scripts/inventory.mjs";
import {
  cleanUp,
  COMPONENT,
  empty,
  healthyFiles,
  json,
  put,
  repo,
  sha,
  source,
} from "./helpers/store-repo.mjs";

const PLUGIN = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const CONFORM = path.join(PLUGIN, "scripts/conform.mjs");
const INTAKE = path.join(PLUGIN, "scripts/intake.mjs");
const DECIDE = path.join(PLUGIN, "scripts/decide.mjs");

after(cleanUp);

const read = (dir, file) => readFileSync(path.join(dir, file), "utf8");
const node = (script, args) => spawnSync(execPath, [script, ...args], { encoding: "utf8" });
const conform = (dir, ...args) =>
  node(CONFORM, ["--target", dir, "--need", "narrow-list", ...args]);
const git = (dir, ...args) =>
  spawnSync("git", ["-c", "user.name=Test", "-c", "user.email=test@example.invalid", ...args], {
    cwd: dir,
    encoding: "utf8",
  });
const commit = (dir) => {
  git(dir, "add", "-A");
  git(dir, "commit", "-q", "-m", "state");
};

const MAIN = "src/components/kit/narrow-list.tsx";
const CHIP = "src/components/kit/narrow-chip.tsx";
const RECORD = "design/conform/narrow-list.json";
// An item as taken down: a file of a few lines, so that a patch touches one and leaves the others.
const lines = (label, extra = "") =>
  [
    "export function NarrowList({ rows }: { rows: string[] }) {",
    `  const label = "${label}";`,
    "  const count = rows.length;",
    "  return (",
    "    <div>",
    "      {label}: {count}",
    "    </div>",
    "  );",
    "}",
    extra,
  ].join("\n");
const TAKEN = lines("Filter");
const CHIP_CODE = COMPONENT("NarrowChip");
const store = (files = {}) => {
  const dir = repo({
    ...healthyFiles(),
    "design/theme.json": json({ version: 1, checks: {} }),
    [MAIN]: TAKEN,
    [CHIP]: CHIP_CODE,
    ...files,
  });
  git(dir, "init", "-q");
  commit(dir);
  return dir;
};
const recordOf = (dir) => JSON.parse(read(dir, RECORD));
const started = (files = {}) => {
  const dir = store(files);
  const run = conform(
    dir,
    "--source",
    "kit",
    "--item",
    "filter-bar",
    "--file",
    MAIN,
    "--file",
    CHIP,
  );
  assert.equal(run.status, 0, run.stderr);
  commit(dir);
  return dir;
};
// The repository's labels for the list: the change the patch records.
const patched = (dir) => {
  put(dir, MAIN, TAKEN.replace('"Filter"', '"Lọc"'));
  const run = conform(
    dir,
    "--patch",
    MAIN,
    "--reason",
    "the words of the list are the repository's",
  );
  assert.equal(run.status, 0, run.stderr);
  commit(dir);
};

test("the item is recorded as taken down: every file with its hash, no patch, no exemption, and the record holds its shape", () => {
  const dir = started();
  const record = recordOf(dir);
  assert.deepEqual(record, {
    version: 1,
    need: "narrow-list",
    source: "kit",
    item: "filter-bar",
    pin_sha256: record.pin_sha256,
    taken: [
      { file: CHIP, sha256: sha(CHIP_CODE) },
      { file: MAIN, sha256: sha(TAKEN) },
    ],
    conformed: [
      { file: CHIP, sha256: sha(CHIP_CODE) },
      { file: MAIN, sha256: sha(TAKEN) },
    ],
    patches: [],
    exemptions: [],
  });
  assert.match(record.pin_sha256, /^[0-9a-f]{64}$/);
  assert.deepEqual(shapeProblems("conform", read(dir, RECORD), RECORD), []);
  // A second start is refused: the record is there.
  const again = conform(dir, "--source", "kit", "--item", "filter-bar", "--file", MAIN);
  assert.equal(again.status, 2);
  assert.match(again.stderr, /design\/conform\/narrow-list\.json is there already/);
  // A source that is not pinned is refused.
  const other = store();
  const strange = conform(other, "--source", "nowhere", "--item", "filter-bar", "--file", MAIN);
  assert.equal(strange.status, 2);
  assert.match(strange.stderr, /nowhere is no pinned source/);
});

test("a change to the item's code is recorded as a patch with its reason, as a diff on the file as it was", () => {
  const dir = started();
  patched(dir);
  const record = recordOf(dir);
  assert.equal(record.patches.length, 1);
  const [patch] = record.patches;
  assert.equal(patch.file, MAIN);
  assert.equal(patch.reason, "the words of the list are the repository's");
  assert.match(patch.diff, /^-\s+const label = "Filter";$/m);
  assert.match(patch.diff, /^\+\s+const label = "Lọc";$/m);
  // Taken down stays as it was; after patching is the file as it is now.
  assert.equal(record.taken.find((entry) => entry.file === MAIN).sha256, sha(TAKEN));
  assert.equal(record.conformed.find((entry) => entry.file === MAIN).sha256, sha(read(dir, MAIN)));
  assert.deepEqual(shapeProblems("conform", read(dir, RECORD), RECORD), []);
});

test("criterion 7: run twice, the command gives the same hashes and writes nothing the second time", () => {
  const dir = started();
  patched(dir);
  const before = read(dir, RECORD);
  const first = conform(dir, "--json");
  const second = conform(dir, "--json");
  assert.equal(first.status, 0, first.stderr);
  assert.equal(second.status, 0, second.stderr);
  assert.deepEqual(JSON.parse(first.stdout).conformed, JSON.parse(second.stdout).conformed);
  assert.equal(read(dir, RECORD), before);
  // Asked to conform an item that is already conformed, it says so and writes nothing.
  const again = conform(dir, "--taken-down");
  assert.equal(again.status, 0, again.stderr);
  assert.match(again.stdout, /already conformed/);
  assert.equal(read(dir, RECORD), before);
});

test("criterion 7: a newer item as taken down gets its patches again; one that no longer fits stops the command, naming the patch", () => {
  const dir = started();
  patched(dir);
  // The source pinned again and a newer item, changed far from the patch: the patch is applied again.
  put(dir, "design/sources/kit.json", json(source("2026-11-19T08:00:00.000Z")));
  const newer = lines("Filter", "export const version = 2;\n");
  put(dir, MAIN, newer);
  const ok = conform(dir, "--taken-down");
  assert.equal(ok.status, 0, ok.stderr);
  assert.equal(read(dir, MAIN), newer.replace('"Filter"', '"Lọc"'));
  const record = recordOf(dir);
  assert.equal(record.taken.find((entry) => entry.file === MAIN).sha256, sha(newer));
  assert.equal(record.conformed.find((entry) => entry.file === MAIN).sha256, sha(read(dir, MAIN)));
  commit(dir);
  // A newer item that changes the very line the patch touches: the command stops, writes nothing.
  const kept = read(dir, RECORD);
  put(dir, "design/sources/kit.json", json(source("2026-11-23T08:00:00.000Z")));
  put(dir, MAIN, lines("Filter by", "export const version = 3;\n"));
  const stopped = conform(dir, "--taken-down");
  assert.notEqual(stopped.status, 0);
  assert.match(
    stopped.stderr,
    /patch 1 of src\/components\/kit\/narrow-list\.tsx \("the words of the list are the repository's"\) no longer fits the file as taken down/,
  );
  assert.equal(read(dir, RECORD), kept);
  assert.equal(read(dir, MAIN), lines("Filter by", "export const version = 3;\n"));
  // A file of the item that is not on disk stops it too.
  git(dir, "checkout", "--", MAIN);
  git(dir, "rm", "-q", CHIP);
  const missing = conform(dir, "--taken-down");
  assert.notEqual(missing.status, 0);
  assert.match(
    missing.stderr,
    /src\/components\/kit\/narrow-chip\.tsx is not on disk: take the item down again/,
  );
});

test("a hand edit with no patch is not taken for a newer item: --taken-down needs the source pinned again, and names each file it takes down again", () => {
  const dir = started();
  patched(dir);
  const pinned = recordOf(dir).pin_sha256;
  assert.match(pinned, /^[0-9a-f]{64}$/);
  // A hand edit of a file no patch touches, with the source's pin as the record was written at.
  const edited = `${CHIP_CODE}// changed by hand\n`;
  put(dir, CHIP, edited);
  const kept = read(dir, RECORD);
  const refused = conform(dir, "--taken-down");
  assert.equal(refused.status, 2);
  assert.match(
    refused.stderr,
    /src\/components\/kit\/narrow-chip\.tsx is neither the file as taken down nor the file after patching, and the pin of kit is the one the record was written at: nothing shows the item was taken down again/,
  );
  assert.equal(read(dir, RECORD), kept);
  assert.equal(read(dir, CHIP), edited);
  assert.equal(conform(dir).status, 1);
  // The same item taken down again, at the same pin: its patches are applied again.
  put(dir, CHIP, CHIP_CODE);
  put(dir, MAIN, TAKEN);
  const same = conform(dir, "--taken-down");
  assert.equal(same.status, 0, same.stderr);
  assert.equal(read(dir, MAIN), TAKEN.replace('"Filter"', '"Lọc"'));
  assert.equal(read(dir, RECORD), kept);
  commit(dir);
  // The source pinned again and a newer file taken down: taken, and named.
  put(dir, "design/sources/kit.json", json(source("2026-11-19T08:00:00.000Z")));
  const newer = `${CHIP_CODE}export const chipVersion = 2;\n`;
  put(dir, CHIP, newer);
  const taken = conform(dir, "--taken-down");
  assert.equal(taken.status, 0, taken.stderr);
  assert.match(taken.stdout, /taken down again: src\/components\/kit\/narrow-chip\.tsx/);
  const record = recordOf(dir);
  assert.equal(record.taken.find((entry) => entry.file === CHIP).sha256, sha(newer));
  assert.notEqual(record.pin_sha256, pinned);
  assert.equal(conform(dir).status, 0);
  // A record that holds no hash of the pin, as one written before the conform command did.
  const old = Object.fromEntries(
    Object.entries(recordOf(dir)).filter(([key]) => key !== "pin_sha256"),
  );
  put(dir, RECORD, json(old));
  put(dir, CHIP, edited);
  const unproven = conform(dir, "--taken-down");
  assert.equal(unproven.status, 2);
  assert.match(
    unproven.stderr,
    /narrow-chip\.tsx is neither the file as taken down nor the file after patching, and the record holds no hash of the pin of kit/,
  );
  // It says what to do with the old record, and does not send the person back to the start call.
  assert.match(
    unproven.stderr,
    /remove the record by hand, take the item down, start the record again, and record each change again with --patch/,
  );
});

test("the source pinned again with nothing newer for the item: the check says the record's pin is behind, --taken-down records the new pin, and a later hand edit is still refused", () => {
  const dir = started();
  patched(dir);
  const pinned = recordOf(dir).pin_sha256;
  // The source pinned again, for another item of it: nothing of this item is touched.
  put(dir, "design/sources/kit.json", json(source("2026-11-19T08:00:00.000Z")));
  const behind = conform(dir);
  assert.equal(behind.status, 1);
  assert.match(behind.stdout, /the pin of kit is no longer the one the record was written at/);
  const recorded = conform(dir, "--taken-down");
  assert.equal(recorded.status, 0, recorded.stderr);
  assert.match(recorded.stdout, /already conformed/);
  assert.notEqual(recordOf(dir).pin_sha256, pinned);
  assert.equal(conform(dir).status, 0);
  // Run twice, it writes nothing the second time.
  const kept = read(dir, RECORD);
  assert.equal(conform(dir, "--taken-down").status, 0);
  assert.equal(read(dir, RECORD), kept);
  // A hand edit made later is not taken for a newer item.
  put(dir, CHIP, `${CHIP_CODE}// changed by hand\n`);
  const refused = conform(dir, "--taken-down");
  assert.equal(refused.status, 2);
  assert.match(
    refused.stderr,
    /narrow-chip\.tsx is neither the file as taken down nor the file after patching/,
  );
  assert.equal(read(dir, RECORD), kept);
});

test("a pin kept in its own file reads as the same pin, written another way; changed there, the record's pin is behind", () => {
  const dir = started();
  const { pin, ...rest } = source();
  const reordered = Object.fromEntries(Object.entries(pin).reverse());
  put(dir, "tools/kit/pin.json", json(reordered));
  put(dir, "design/sources/kit.json", json({ ...rest, pin_file: "tools/kit/pin.json" }));
  assert.equal(conform(dir).status, 0);
  put(dir, "tools/kit/pin.json", json({ ...pin, fetched_at: "2026-11-19T08:00:00.000Z" }));
  const behind = conform(dir);
  assert.equal(behind.status, 1);
  assert.match(behind.stdout, /the pin of kit is no longer the one the record was written at/);
});

test("a hand edit of the item is named for the very file, and a record written by hand under 0.51.0 is said to hold a patch it cannot apply again", () => {
  const dir = started();
  patched(dir);
  put(dir, CHIP, `${CHIP_CODE}// changed by hand\n`);
  const run = conform(dir);
  assert.equal(run.status, 1);
  assert.match(
    run.stdout,
    /src\/components\/kit\/narrow-chip\.tsx is not the file the record holds after patching, and no patch records the change/,
  );
  // As 0.51.0 left it: a patch with its reason and no diff.
  const hand = store();
  put(
    hand,
    RECORD,
    json({
      version: 1,
      need: "narrow-list",
      source: "kit",
      item: "filter-bar",
      taken: [{ file: MAIN, sha256: sha(TAKEN) }],
      conformed: [{ file: MAIN, sha256: sha(TAKEN) }],
      patches: [{ file: MAIN, reason: "written by hand" }],
      exemptions: [],
    }),
  );
  assert.deepEqual(shapeProblems("conform", read(hand, RECORD), RECORD), []);
  const said = conform(hand);
  assert.equal(said.status, 1);
  assert.match(
    said.stdout,
    /patch 1 of src\/components\/kit\/narrow-list\.tsx \("written by hand"\) records a reason and no diff, as a record written by hand before the conform command: it cannot be applied again until it is recorded with --patch/,
  );
});

// ---- the folder of the item, left out of the formatter, the lint configuration or the type check -----

const FOLDER_CASES = [
  [".prettierignore", "src/components/kit/\n", "formatter-ignore"],
  ["eslint.config.js", 'export default [{ ignores: ["src/components/kit/**"] }];\n', "lint-config"],
  ["tsconfig.json", '{ "exclude": ["src/components/kit"] }\n', "typecheck-exclude"],
];

test("a rule turned off for the item's folder in the formatter, the lint configuration or the type check needs its exemption", () => {
  for (const [config, text, rule] of FOLDER_CASES) {
    const dir = started({ [config]: text });
    const run = conform(dir);
    assert.equal(run.status, 1, config);
    assert.match(
      run.stdout,
      new RegExp(
        `${config.replace(".", "\\.")} names the folder src/components/kit of the item, so ${rule} is turned off for it, and the record has no exemption ${rule} for ${config.replace(".", "\\.")}`,
      ),
      config,
    );
    const exempt = conform(
      dir,
      "--exempt",
      rule,
      "--file",
      config,
      "--reason",
      "the item is the source's code",
    );
    assert.equal(exempt.status, 0, exempt.stderr);
    assert.deepEqual(recordOf(dir).exemptions, [
      { rule, file: config, reason: "the item is the source's code" },
    ]);
    assert.deepEqual(shapeProblems("conform", read(dir, RECORD), RECORD), [], config);
    assert.equal(conform(dir).status, 0, config);
  }
});

test("intake refuses the row while the item's folder is left out of the formatter with no exemption", () => {
  const dir = started({ ".prettierignore": "src/components/kit/\n" });
  const ask = node(INTAKE, ["--target", dir, "--need", "narrow-list", "filter", "bar"]);
  assert.equal(ask.status, 1, ask.stderr);
  const answers = path.join(empty(), "answers.txt");
  writeFileSync(answers, "intake-narrow-list giữ\n");
  node(DECIDE, ["--target", dir, "--answers", answers, "--by", "The Owner", "--on", "2026-11-18"]);
  const refused = node(INTAKE, ["--target", dir, "--need", "narrow-list", "--file", MAIN]);
  assert.equal(refused.status, 2);
  assert.match(
    refused.stderr,
    /\.prettierignore names the folder src\/components\/kit of the item, so formatter-ignore is turned off for it/,
  );
});

// ---- criterion 8: inventory names a hand edit of every file of the item ---------------------------

test("criterion 8: a file of an outside item edited by hand after it was taken in is reported changed with no record, for every file of the item", () => {
  const dir = started();
  const row = `  - name: NarrowList\n    file: ${MAIN}\n    source: filter-bar\n    from: kit\n    need: narrow-list\n    approved: 2026-11-18\n    approved_by: The Owner\n    taken: ${sha(TAKEN)}\n    conform: ${RECORD}\n`;
  put(
    dir,
    "design/intake.yaml",
    read(dir, "design/intake.yaml").replace("\nbefore:", `\n${row}before:`),
  );
  const modified = (result) =>
    result.findings
      .filter((finding) => finding.kind === "modified")
      .flatMap((finding) => finding.items.map((item) => item.file));
  assert.deepEqual(modified(inventory(dir)), []);
  // Not the file the row names: another file of the item.
  put(dir, CHIP, `${CHIP_CODE}// changed by hand\n`);
  const found = inventory(dir);
  assert.deepEqual(modified(found), [CHIP]);
  const evidence = found.findings.find((finding) => finding.kind === "modified").evidence[0];
  assert.equal(
    evidence,
    `${CHIP} is not the file the conform record ${RECORD} holds after patching, and no patch records the change`,
  );
});
