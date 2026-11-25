// The common contract of every command (specification 0004), held for each command that exists:
// how it is called, what a machine gets back, how it ends, and what it leaves on disk. One table,
// one row per command; a new command adds its row and is held to the same contract.
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import {
  cpSync,
  lstatSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  realpathSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { cwd, execPath } from "node:process";
import { after, test } from "node:test";
import { fileURLToPath } from "node:url";

import { EXIT, readCall } from "../scripts/command.mjs";
import { treeHash } from "../scripts/stamp.mjs";
import { withoutBlock } from "../templates/tools/design-assembly/theme.mjs";

import { passingFloor, roleWords } from "./helpers/answered-roles.mjs";

const PLUGIN = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const ROOT = path.resolve(PLUGIN, "../..");
const reference = (file) => JSON.parse(readFileSync(path.join(PLUGIN, "references", file), "utf8"));
const LAYERS = reference("layers.json").layers;
const LIMITS = reference("limits.json").limits;

// Each command of the specification that exists today. `keys` are the keys the specification
// lists for a machine; `later` are the ones the command cannot give yet, each with the open row
// of the limits ledger that says so. `cases` name a repository, how the call must end there, and,
// for a command that writes, how the real run ends (`real`) after the preview ended with `exit`.
const COMMANDS = [
  {
    name: "status",
    script: "status.mjs",
    keys: ["tier", "held", "claimed", "waiting", "tool", "next"],
    cases: [
      { on: "answered", exit: EXIT.done, why: "nothing waits" },
      { on: "proposed", exit: EXIT.work, why: "answers wait on a person" },
      { on: "bypassed", exit: EXIT.work, why: "source goes around a decision" },
    ],
  },
  {
    name: "audit",
    script: "audit.mjs",
    keys: ["decisions", "tier", "missing", "blind"],
    cases: [
      { on: "answered", exit: EXIT.done, why: "no decision is unheld or gone around" },
      { on: "bypassed", exit: EXIT.work, why: "source goes around a decision" },
    ],
  },
  {
    name: "find",
    script: "find.mjs",
    // What every call searches the store for. Words go before the flags.
    args: ["many", "rows"],
    keys: ["matches", "near", "searched"],
    cases: [
      { on: "stocked", exit: EXIT.done, why: "the intake ledger keeps a block for that need" },
      { on: "answered", exit: EXIT.work, why: "no store answers the need" },
    ],
  },
  {
    name: "inventory",
    script: "inventory.mjs",
    // With --strict a finding ends the call with 1.
    args: ["--strict"],
    keys: ["stores", "items", "findings", "blind"],
    cases: [
      { on: "answered", exit: EXIT.done, why: "nothing is found" },
      { on: "drifted", exit: EXIT.work, why: "a block's file is not the one taken in" },
    ],
  },
  {
    name: "intake",
    script: "intake.mjs",
    writes: true,
    // What every call takes a block in for.
    args: ["--need", "many-rows"],
    keys: ["rung", "candidates", "waiting", "chosen", "row", "install", "files"],
    cases: [
      { on: "stocked", exit: EXIT.done, real: EXIT.done, why: "the ledger keeps a block for it" },
      { on: "answered", exit: EXIT.work, real: EXIT.work, why: "a question waits on the owner" },
    ],
  },
  {
    name: "change",
    script: "change.mjs",
    writes: true,
    // What every call asks to retire.
    args: ["many-rows", "--retire", "--why", "Not needed"],
    keys: ["impact", "edits", "waiting", "files"],
    cases: [
      { on: "stocked", exit: EXIT.work, real: EXIT.work, why: "a question waits on the owner" },
    ],
  },
  {
    name: "new",
    script: "apply.mjs",
    writes: true,
    keys: ["blueprint", "principles", "recommendations", "directions", "files"],
    cases: [
      { on: "decided", exit: EXIT.done, real: EXIT.done, why: "every built layer is decided" },
      // With no blueprint no layer is decided, and the files cannot be listed yet.
      { on: "floor", exit: EXIT.work, real: EXIT.wrong, without: ["files"], why: "no layer" },
    ],
  },
  {
    name: "adopt",
    script: "adopt.mjs",
    writes: true,
    keys: ["rows", "rerun", "loose", "person", "files"],
    cases: [
      { on: "answered", exit: EXIT.done, real: EXIT.done, why: "nothing needs a person" },
      { on: "floor", exit: EXIT.work, real: EXIT.work, why: "three calls only a person makes" },
    ],
  },
  {
    name: "decide",
    script: "decide.mjs",
    writes: true,
    keys: ["questions", "answered"],
    cases: [
      // With no answers file nothing is written: the preview and the real run name no file.
      { on: "answered", exit: EXIT.done, real: EXIT.done, why: "no question waits" },
      { on: "proposed", exit: EXIT.work, real: EXIT.work, why: "rows nobody confirmed" },
    ],
  },
  {
    name: "handoff",
    script: "book.mjs",
    writes: true,
    keys: ["facts", "files"],
    cases: [
      // The throwaway repository has nothing to draw with: the book is written without pictures,
      // which is work left to do. A preview opens no browser, so it cannot know that.
      { on: "answered", exit: EXIT.done, real: EXIT.work, why: "a book with no picture" },
    ],
  },
  {
    name: "upgrade",
    script: "upgrade.mjs",
    writes: true,
    keys: ["from", "to", "tool_files", "ledgers", "decisions", "gate", "files"],
    cases: [
      { on: "answered", exit: EXIT.done, real: EXIT.done, why: "already the installed tool" },
      { on: "older", exit: EXIT.done, real: EXIT.done, why: "an older stamp, a safe upgrade" },
    ],
  },
];

const made = [];
after(() => made.forEach((dir) => rmSync(dir, { recursive: true, force: true })));

const put = (dir, file, text) => {
  mkdirSync(path.dirname(path.join(dir, file)), { recursive: true });
  writeFileSync(path.join(dir, file), text);
};
const text = (dir, file) => readFileSync(path.join(dir, file), "utf8");
const empty = () => {
  // The real path: a command run from inside the folder sees it under that name.
  const dir = realpathSync(mkdtempSync(path.join(tmpdir(), "design-contract-")));
  made.push(dir);
  return dir;
};
const script = (name) => path.join(PLUGIN, "scripts", name);
const run = (command, args, options = {}) =>
  spawnSync(execPath, [script(command.script), ...(command.args ?? []), ...args], {
    encoding: "utf8",
    ...options,
  });

// The throwaway repositories, each built once and copied for the call that may change it.
const BUILD = {
  // The real floor of this repository: its stylesheet without the generated block.
  floor() {
    const dir = empty();
    put(dir, "src/index.css", withoutBlock(text(ROOT, "src/index.css")));
    put(dir, "Makefile", text(ROOT, "Makefile"));
    return dir;
  },
  // The floor with an approved blueprint, before anything is written from it.
  decided: () => blueprint("user"),
  // The guide applied, with every person's call given by a person.
  answered: () => apply(blueprint("user")),
  // The guide applied, with every person's call still a proposal.
  proposed: () => apply(blueprint("proposed")),
  // The same as answered, as if an older plugin had written its tool: one file of the copy is
  // another, and the stamp names an older version.
  older() {
    const dir = apply(blueprint("user"));
    const file = "tools/design-assembly/scale.mjs";
    put(dir, file, `${text(dir, file)}// older\n`);
    const tree = treeHash(path.join(dir, "tools/design-assembly"));
    put(dir, "design/tool-stamp.json", `${JSON.stringify({ version: "0.0.1", tree })}\n`);
    return dir;
  },
  // The same as answered, with an intake ledger that keeps one block.
  stocked() {
    const dir = apply(blueprint("user"));
    put(
      dir,
      "design/intake.yaml",
      "version: 1\nblocks:\n  - name: DataRegion\n    file: src/components/data-region.tsx\n    source: by-hand\n    need: many-rows\n    approved: 2026-11-12\n",
    );
    return dir;
  },
  // The same as stocked, with the block's file there and changed since the hash taken when it came in.
  drifted() {
    const dir = BUILD.stocked();
    put(dir, "src/components/data-region.tsx", "export const DataRegion = () => null;\n");
    put(
      dir,
      "design/intake.yaml",
      `${text(dir, "design/intake.yaml")}    taken: ${"0".repeat(64)}\n`,
    );
    return dir;
  },
  // The same as answered, with one file of source that writes a space around the scale.
  bypassed() {
    const dir = apply(blueprint("user"));
    put(dir, "src/Rogue.tsx", 'export const Rogue = () => <div className="p-[13px]" />;\n');
    return dir;
  },
};
function blueprint(source) {
  const dir = BUILD.floor();
  const choices = {
    context: { product_type: "application", conformance_level: "AA" },
    patterns: { record_panel: "beside" },
    foundations: {
      source_color: "#0246ff",
      type_scale: "standard",
      spacing_unit: "4px",
      corner_radius: "small",
      text_font: "floor",
      heading_font: "text",
    },
  };
  const layers = Object.fromEntries(
    LAYERS.map((layer) => [
      layer.id,
      layer.built
        ? { status: "decided", source, choice: choices[layer.id], why: "For the test." }
        : { status: "planned" },
    ]),
  );
  // The typeface came later: the owner answered it, with their name and the day, so it waits on
  // nobody, as a repository of this version has it.
  layers.foundations.confirmed = ["text_font", "heading_font"];
  layers.foundations.answered = {
    text_font: { by: "Owner Name", on: "2026-11-21" },
    heading_font: { by: "Owner Name", on: "2026-11-21" },
  };
  // The colour roles came later too: where a person gave the answers, the owner spoke to each
  // question of the table of colour roles, on a floor whose pairs it keeps reach the threshold.
  if (source === "user") {
    layers.foundations.roles = roleWords();
    put(dir, "src/index.css", passingFloor(text(dir, "src/index.css")));
  }
  put(dir, "design/blueprint.json", JSON.stringify({ version: 1, status: "approved", layers }));
  return dir;
}
function apply(dir) {
  const applied = spawnSync(execPath, [script("apply.mjs"), "--target", dir], {
    encoding: "utf8",
  });
  assert.equal(applied.status, EXIT.done, applied.stderr);
  return dir;
}
const built = {};
function repository(kind) {
  built[kind] ??= BUILD[kind]();
  const dir = empty();
  cpSync(built[kind], dir, { recursive: true });
  return dir;
}

// Every file of a folder with the hash of its bytes: two equal snapshots are one tree, byte for byte.
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
// The files that are new or hold other bytes in the second snapshot.
function changed(before, afterwards) {
  const was = new Set(before);
  return afterwards
    .filter((line) => !line.endsWith("/") && !was.has(line))
    .map((line) => line.slice(0, line.lastIndexOf(" ")))
    .sort();
}
const preview = (command) => (command.writes ? ["--dry-run"] : []);

for (const command of COMMANDS) {
  test(`${command.name}: --json is one document with the keys the specification lists, and the call ends as the contract says`, () => {
    for (const item of command.cases) {
      const where = `${command.name} on ${item.on} (${item.why})`;
      const dir = repository(item.on);
      const before = snapshot(dir);
      const data = run(command, ["--target", dir, "--json", ...preview(command)]);
      assert.equal(data.status, item.exit, `${where}: ${data.stderr}`);
      const result = JSON.parse(data.stdout);
      const expected = command.keys.filter((key) => !(item.without ?? []).includes(key));
      for (const key of expected) assert.ok(key in result, `${where}: no ${key}`);
      for (const key of item.without ?? []) assert.ok(!(key in result), `${where}: ${key}`);
      // The same call for a person ends the same way.
      const shown = run(command, ["--target", dir, ...preview(command)]);
      assert.equal(shown.status, item.exit, `${where}, for a person: ${shown.stderr}`);
      assert.notEqual(shown.stdout.trim(), "", where);
      assert.throws(() => JSON.parse(shown.stdout), where);
      // Without --target it reads the folder it is run from, and gives the same answer twice.
      const here = run(command, ["--json", ...preview(command)], { cwd: dir });
      assert.equal(here.status, item.exit, `${where}, from inside: ${here.stderr}`);
      assert.equal(here.stdout, data.stdout, `${where}, from inside`);
      // A command that only reads, and a preview, leave the tree as it was, byte for byte.
      assert.deepEqual(snapshot(dir), before, `${where}: the tree changed`);
    }
  });

  test(`${command.name}: a key the specification lists and the command cannot give yet is left out, with an open limit`, () => {
    const [first] = command.cases;
    const dir = repository(first.on);
    const data = run(command, ["--target", dir, "--json", ...preview(command)]);
    const result = JSON.parse(data.stdout);
    for (const [key, id] of Object.entries(command.later ?? {})) {
      assert.ok(!(key in result), `${command.name}: ${key} is given, so its limit can close`);
      const limit = LIMITS.find((row) => row.id === id);
      assert.equal(limit?.status, "open", `${command.name}: no open limit ${id} for ${key}`);
    }
  });

  test(`${command.name}: a wrong call or a repository that cannot be read ends with 2 and prints no answer`, () => {
    const dir = repository("answered");
    const wrong = [
      ["--no-such-flag"],
      ["--target"],
      ["--target", path.join(tmpdir(), "design-contract-no-such-folder")],
      ["--target", script(command.script)],
    ];
    for (const args of wrong) {
      const called = run(command, [...args, "--json", ...preview(command)], { cwd: dir });
      const what = `${command.name} ${args.join(" ")}`;
      assert.equal(called.status, EXIT.wrong, what);
      assert.equal(called.stdout, "", what);
      assert.match(called.stderr, /^(usage|design-assembly): /, what);
    }
    const broken = repository("answered");
    put(broken, "design/theme.json", "{ not json");
    const before = snapshot(broken);
    for (const mode of [["--json"], []]) {
      const unreadable = run(command, ["--target", broken, ...mode, ...preview(command)]);
      assert.equal(unreadable.status, EXIT.wrong, `${command.name}: ${unreadable.stdout}`);
      assert.match(unreadable.stderr, /^design-assembly: /m, command.name);
      if (mode.length > 0) assert.equal(unreadable.stdout, "", command.name);
    }
    assert.deepEqual(snapshot(broken), before, `${command.name}: the tree changed`);
  });

  if (!command.writes) continue;

  test(`${command.name}: --dry-run names exactly the files the real run then writes`, () => {
    for (const item of command.cases) {
      const where = `${command.name} on ${item.on}`;
      const dir = repository(item.on);
      const before = snapshot(dir);
      const planned = JSON.parse(run(command, ["--target", dir, "--json", "--dry-run"]).stdout);
      const real = run(command, ["--target", dir, "--json"]);
      assert.equal(real.status, item.real, `${where}: ${real.stderr}`);
      const written = changed(before, snapshot(dir));
      if (item.real === EXIT.wrong) {
        // A refused call writes nothing and prints no answer.
        assert.deepEqual(written, [], where);
        assert.equal(real.stdout, "", where);
        continue;
      }
      assert.deepEqual(planned.files.map((file) => file.path).sort(), written, where);
      for (const file of planned.files) {
        assert.ok(["create", "update"].includes(file.change), `${where}: ${file.path}`);
      }
      // The real run says the same list, and says it did write.
      const done = JSON.parse(real.stdout);
      assert.equal(planned.dry_run, true, where);
      assert.equal(done.dry_run, false, where);
      assert.deepEqual(done.files, planned.files, where);
    }
  });
}

test("a call is read against the flags a command declares, and the target defaults to the folder it runs from", () => {
  const dir = empty();
  const flags = { "--dry-run": "switch", "--out": "value", "--color": "list" };
  const read = readCall(
    ["--target", dir, "--json", "--out", "x", "--color", "a", "--color", "b"],
    flags,
  );
  assert.deepEqual(read, {
    target: dir,
    json: true,
    help: false,
    flags: { "--out": "x", "--color": ["a", "b"] },
  });
  assert.equal(readCall([], flags).target, cwd());
  assert.equal(readCall(["-h"], flags).help, true);
  assert.match(readCall(["--plan"], flags).problem, /--plan is not a flag of this command/);
  assert.match(readCall(["--out"], flags).problem, /--out needs a value/);
  assert.match(readCall(["--out", "--json"], flags).problem, /--out needs a value/);
  assert.match(readCall(["somewhere"], flags).problem, /somewhere is not a flag/);
  assert.match(readCall(["--target", path.join(dir, "none")], flags).problem, /is not a folder/);
});

test("a flag that takes names takes one name a value: white space or an empty value is a wrong call that says how to call it", () => {
  const dir = empty();
  const flags = { "--skill": "names" };
  assert.deepEqual(
    readCall(["--target", dir, "--skill", "far-eye", "--skill", "their-plugin:far-eye"], flags)
      .flags,
    { "--skill": ["far-eye", "their-plugin:far-eye"] },
  );
  for (const value of [
    "alpha beta gamma delta",
    "alpha\tbeta",
    "alpha\nbeta",
    " alpha",
    "alpha ",
  ]) {
    const problem = readCall(["--target", dir, "--skill", value], flags).problem;
    assert.match(problem, /^--skill /, JSON.stringify(value));
    assert.match(problem, /alpha/, JSON.stringify(value));
    assert.match(problem, /white space/, JSON.stringify(value));
    assert.match(problem, /Give each name a flag of its own: --skill <name> --skill <name>/);
  }
  // The first words are named, not the whole value, which may hold every name a session lists.
  const long = readCall(["--skill", "alpha beta gamma delta epsilon"], flags).problem;
  assert.match(long, /"alpha beta gamma …"/);
  assert.doesNotMatch(long, /epsilon/);
  assert.match(readCall(["--skill", ""], flags).problem, /^--skill was given an empty value/);
});

test("a command that takes words reads every one that is not a flag or a flag's value, in order", () => {
  const dir = empty();
  const flags = { "--kind": "value" };
  const read = readCall(["many", "--kind", "block", "rows", "--target", dir], flags, {
    words: true,
  });
  assert.deepEqual(read, {
    target: dir,
    json: false,
    help: false,
    flags: { "--kind": "block" },
    words: ["many", "rows"],
  });
  assert.deepEqual(readCall(["--kind", "block"], flags, { words: true }).words, []);
  // A word that looks like a flag is still a flag the command does not have.
  assert.match(readCall(["-x"], flags, { words: true }).problem, /-x is not a flag/);
  // A word is never taken for a flag because an object has a key of that name.
  for (const word of ["constructor", "toString", "__proto__", "hasOwnProperty"]) {
    assert.deepEqual(readCall([word], flags, { words: true }).words, [word]);
    assert.match(readCall([word], flags).problem, new RegExp(`${word} is not a flag`));
  }
});
