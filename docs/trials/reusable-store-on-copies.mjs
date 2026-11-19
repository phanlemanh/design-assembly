// find and inventory, measured on throwaway copies of real repositories. Never writes to a repository it is given:
// each one is cloned into a temporary folder, find runs on the clone, and the clone is removed
// unless --keep is given. On each clone it checks that every call ends with 0 or 1 and no stack
// trace, that the same call twice gives the same answer, and that the tree, ignored files and all,
// is the same afterwards. On the reference repository it also pins the catalog that repository
// already keeps as an outside source, pointing at its own pin file, and then changes one byte of
// the snapshot to see the source become unreadable.
// Usage: node docs/trials/reusable-store-on-copies.mjs [--app] [--reference DIR] [--web DIR]
//        [--workspace DIR] [--keep]
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import {
  appendFileSync,
  existsSync,
  lstatSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { performance } from "node:perf_hooks";
import { argv, execPath, exit, stdout } from "node:process";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const FIND = path.join(ROOT, "plugins/design-assembly/scripts/find.mjs");
const INVENTORY = path.join(ROOT, "plugins/design-assembly/scripts/inventory.mjs");
const arg = (name) => (argv.includes(name) ? path.resolve(argv[argv.indexOf(name) + 1]) : null);
const keep = argv.includes("--keep");

// The repositories to measure, by the role each plays.
const given = [
  argv.includes("--app") ? ["the example application (this repository)", ROOT] : null,
  arg("--reference") ? ["the reference repository", arg("--reference")] : null,
  arg("--web") ? ["a web repository outside the family", arg("--web")] : null,
  arg("--workspace") ? ["a workspace repository of the same family", arg("--workspace")] : null,
].filter(Boolean);
if (given.length === 0) {
  stdout.write("reusable-store-on-copies: give --app, --reference, --web or --workspace\n");
  exit(2);
}

// What each copy is asked: a need in English, one in the reference repository's own words, a
// component name, and a word only an outside catalog holds.
const ASKED = ["many rows", "bảng nhiều dòng", "data table", "page header", "gantt"];
// The catalog the reference repository keeps, as an outside source pointing at its own pin.
const REFERENCE_SOURCE = {
  version: 1,
  id: "reui",
  title: "ReUI",
  order: 1,
  pin_file: "tools/reui_catalog/pin.json",
  snapshot: "tools/reui_catalog/snapshot",
  catalog: "design/reui-catalog.json",
};

const sha = (bytes) => createHash("sha256").update(bytes).digest("hex");
function snapshot(dir, at = "") {
  return readdirSync(path.join(dir, at))
    .filter((name) => !(at === "" && name === ".git"))
    .sort()
    .flatMap((name) => {
      const relative = path.posix.join(at, name);
      const full = path.join(dir, relative);
      if (lstatSync(full).isDirectory()) return [`${relative}/`, ...snapshot(dir, relative)];
      return [`${relative} ${sha(readFileSync(full))}`];
    });
}
const find = (dir, words) => {
  const started = performance.now();
  const call = spawnSync(execPath, [FIND, ...words.split(" "), "--target", dir, "--json"], {
    encoding: "utf8",
    maxBuffer: 1 << 28,
  });
  return { ...call, ms: Math.round(performance.now() - started) };
};

const inventory = (dir) => {
  const started = performance.now();
  const call = spawnSync(execPath, [INVENTORY, "--target", dir, "--json"], {
    encoding: "utf8",
    maxBuffer: 1 << 28,
  });
  return { ...call, ms: Math.round(performance.now() - started) };
};
const tally = (list, keyOf) =>
  Object.entries(
    list.reduce(
      (counts, item) => ({ ...counts, [keyOf(item)]: (counts[keyOf(item)] ?? 0) + 1 }),
      {},
    ),
  )
    .map(([key, count]) => `${key} ${count}`)
    .join(", ") || "none";

const rows = [];
const stock = [];
const notes = [];
const folders = [];
for (const [role, repository] of given) {
  const copy = mkdtempSync(path.join(tmpdir(), "design-assembly-find-"));
  folders.push(copy);
  if (spawnSync("git", ["clone", "-q", "--no-hardlinks", repository, copy]).status !== 0) {
    notes.push(`${role}: could not be cloned`);
    continue;
  }
  const head = spawnSync("git", ["-C", copy, "log", "-1", "--format=%h %cs"], { encoding: "utf8" });
  notes.push(`${role}: commit ${head.stdout.trim()}`);
  const pinned =
    role === "the reference repository" && existsSync(path.join(copy, REFERENCE_SOURCE.pin_file));
  if (pinned) {
    mkdirSync(path.join(copy, "design/sources"), { recursive: true });
    writeFileSync(
      path.join(copy, "design/sources/reui.json"),
      `${JSON.stringify(REFERENCE_SOURCE, null, 2)}\n`,
    );
  }
  const before = snapshot(copy);
  for (const words of ASKED) {
    const first = find(copy, words);
    const second = find(copy, words);
    const clean = [0, 1].includes(first.status) && !/\n\s+at /.test(first.stderr);
    const result = clean ? JSON.parse(first.stdout) : null;
    const top = result?.matches[0];
    rows.push({
      role,
      words,
      exit: first.status,
      same: second.stdout === first.stdout,
      answer: top ? `${top.name} (${top.store})` : "none",
      matches: result?.matches.length ?? "-",
      near: result?.near.length ?? "-",
      read: result
        ? result.searched
            .filter((entry) => entry.read !== null)
            .map((entry) => entry.store)
            .join(", ")
        : "-",
      ms: first.ms,
    });
  }
  const first = inventory(copy);
  const second = inventory(copy);
  const clean = first.status === 0 && !/\n\s+at /.test(first.stderr);
  const result = clean ? JSON.parse(first.stdout) : null;
  stock.push({
    role,
    exit: first.status,
    same: second.stdout === first.stdout,
    items: result ? tally(result.items, (item) => item.state ?? "unknown") : "-",
    findings: result ? tally(result.findings, (finding) => finding.kind) : first.stderr.trim(),
    blind: result
      ? [...new Set(result.blind.map((entry) => entry.kind))].join(", ") || "none"
      : "-",
    ms: first.ms,
  });
  if (result) {
    for (const entry of result.blind)
      notes.push(`${role}, inventory did not look at ${entry.kind}: ${entry.why}`);
    for (const finding of result.findings) {
      notes.push(
        `${role}, inventory found ${finding.kind}: ${finding.items.map((item) => item.file ?? item.name).join(", ")} (${finding.evidence[0]})`,
      );
    }
  }
  const same = JSON.stringify(snapshot(copy)) === JSON.stringify(before);
  notes.push(
    `${role}: the tree is ${same ? "the same" : "NOT the same"} after ${ASKED.length * 2 + 2} calls`,
  );
  if (pinned) {
    const pin = JSON.parse(readFileSync(path.join(copy, REFERENCE_SOURCE.pin_file), "utf8"));
    const file = path.join(copy, REFERENCE_SOURCE.snapshot, pin.files[0].file);
    const kept = readFileSync(file);
    appendFileSync(file, "x");
    const changed = JSON.parse(find(copy, "gantt").stdout);
    const entry = changed.searched.find((item) => item.store === "sources/reui");
    notes.push(
      `${role}, one byte added to ${pin.files[0].file}: ${changed.matches.length} matches from the source; it says: ${entry?.why}`,
    );
    writeFileSync(file, kept);
  }
}

stdout.write(
  [
    "| Repository | Words | Exit | Same twice | Nearest answer | Matches | Near | Stores read | ms |",
    "| --- | --- | --- | --- | --- | --- | --- | --- | --- |",
    ...rows.map(
      (row) =>
        `| ${row.role} | ${row.words} | ${row.exit} | ${row.same ? "yes" : "no"} | ${row.answer} | ${row.matches} | ${row.near} | ${row.read} | ${row.ms} |`,
    ),
    "",
    "| Repository | inventory exit | Same twice | Pieces by state | Findings | Not looked at | ms |",
    "| --- | --- | --- | --- | --- | --- | --- |",
    ...stock.map(
      (row) =>
        `| ${row.role} | ${row.exit} | ${row.same ? "yes" : "no"} | ${row.items} | ${row.findings} | ${row.blind} | ${row.ms} |`,
    ),
    "",
    ...notes.map((note) => `- ${note}`),
    "",
  ].join("\n"),
);
if (!keep) for (const folder of folders) rmSync(folder, { recursive: true, force: true });
