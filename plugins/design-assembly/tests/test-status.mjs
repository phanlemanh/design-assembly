// The status on throwaway repositories: nothing, a floor, one the guide proposed every answer for,
// and one a person answered. Every claim is shown in both directions, and every run leaves the
// repository as it found it.
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import {
  cpSync,
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
import { execPath } from "node:process";
import { after, test } from "node:test";
import { fileURLToPath } from "node:url";

import { report, STAMP, status, treeHash } from "../scripts/status.mjs";
import { withoutBlock } from "../templates/tools/design-assembly/theme.mjs";

const PLUGIN = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const ROOT = path.resolve(PLUGIN, "../..");
const STATUS = path.join(PLUGIN, "scripts/status.mjs");
const reference = (file) => JSON.parse(readFileSync(path.join(PLUGIN, "references", file), "utf8"));
const LAYERS = reference("layers.json").layers;
const VERSION = JSON.parse(
  readFileSync(path.join(PLUGIN, ".claude-plugin/plugin.json"), "utf8"),
).version;
const TOOL_COPY = "tools/design-assembly";
const LEDGER = "design/decisions.yaml";

const made = [];
after(() => made.forEach((dir) => rmSync(dir, { recursive: true, force: true })));

const put = (dir, file, text) => {
  mkdirSync(path.dirname(path.join(dir, file)), { recursive: true });
  writeFileSync(path.join(dir, file), text);
};
const text = (dir, file) => readFileSync(path.join(dir, file), "utf8");
const edit = (dir, file, change) => put(dir, file, change(text(dir, file)));
const empty = () => {
  const dir = mkdtempSync(path.join(tmpdir(), "design-status-"));
  made.push(dir);
  return dir;
};
// A repository with the real floor of this one: its stylesheet without the generated block.
function floor() {
  const dir = empty();
  put(dir, "src/index.css", withoutBlock(text(ROOT, "src/index.css")));
  put(dir, "Makefile", text(ROOT, "Makefile"));
  return dir;
}
// The same, after the guide was applied. `source` says who gave the answers: "proposed" leaves
// every person's call as a proposal nobody confirmed, "user" records them as a person's.
function build(source) {
  const dir = floor();
  const choices = {
    context: { product_type: "application", conformance_level: "AA" },
    patterns: { record_panel: "beside" },
    foundations: {
      source_color: "#0246ff",
      type_scale: "standard",
      spacing_unit: "4px",
      corner_radius: "small",
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
  put(dir, "design/blueprint.json", JSON.stringify({ version: 1, status: "approved", layers }));
  const run = spawnSync(execPath, [path.join(PLUGIN, "scripts/apply.mjs"), "--target", dir]);
  assert.equal(run.status, 0, String(run.stderr));
  return dir;
}
// Applying is slow, so each kind is built once and copied for a test that changes it.
const built = {};
function applied(source) {
  built[source] ??= build(source);
  const dir = empty();
  cpSync(built[source], dir, { recursive: true });
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
const cli = (...args) => spawnSync(execPath, [STATUS, ...args], { encoding: "utf8" });
const ids = (result) => result.waiting.map((item) => item.id);
const CALLS = ["product-type", "conformance-level", "source-color"];
// The block of one row in the ledger text, from its `- id:` line to the next row.
const rowBlock = (id) => new RegExp(`  - id: ${id}\\n(?:    .*\\n)*`);

test("the machine gets the keys the specification lists, and nothing it cannot rely on", () => {
  const result = status(applied("proposed"));
  assert.deepEqual(Object.keys(result), [
    "tier",
    "held",
    "claimed",
    "rhythms",
    "waiting",
    "tool",
    "next",
  ]);
  assert.deepEqual(result.tier, { id: "audit", state: "reached", next: "foundations" });
  // Held and claimed are two numbers, never one: a claim was not run again here.
  assert.equal(typeof result.held, "number");
  assert.ok(result.held >= 2);
  assert.equal(result.claimed, 0);
  for (const item of result.waiting) {
    assert.deepEqual(Object.keys(item), ["id", "question", "recommendation", "basis", "answer"]);
    for (const value of Object.values(item)) assert.ok(String(value).trim() !== "", item.id);
  }
  assert.deepEqual(Object.keys(result.tool), ["recorded", "installed", "copy", "differs", "says"]);
  for (const step of result.next) assert.deepEqual(Object.keys(step), ["command", "why"]);
});

test("a folder with nothing in it: no tier, nothing waiting, nothing to compare", () => {
  const dir = empty();
  const result = status(dir);
  assert.deepEqual(result.tier, { id: null, state: "none", next: "audit" });
  assert.equal(result.held, 0);
  assert.deepEqual(result.waiting, []);
  assert.equal(result.tool.copy, null);
  assert.equal(result.tool.differs, false);
  assert.deepEqual(result.next, []);
  assert.equal(cli("--target", dir).status, 0);
});

test("a floor with no ledger: nothing waits yet, and the next command is the guide", () => {
  const result = status(floor());
  assert.deepEqual(result.waiting, []);
  assert.deepEqual(
    result.next.map((step) => step.command),
    ["/design-assembly:new"],
  );
});

test("an answer the guide proposed waits on the owner until a person confirms it", () => {
  const dir = applied("proposed");
  const result = status(dir);
  assert.deepEqual(ids(result), CALLS);
  const color = result.waiting.find((item) => item.id === "source-color");
  assert.equal(color.question, "Which source color does the theme start from?");
  assert.equal(color.answer, "/design-assembly:new");
  assert.deepEqual(
    result.next.map((step) => step.command),
    ["/design-assembly:new"],
  );
  // The other direction: the row as a person leaves it, with no note that it is a proposal.
  edit(dir, LEDGER, (ledger) =>
    ledger.replace(
      /(- id: source-color\n(?: {4}(?!note:).*\n)*) {4}note: .*\n/,
      (whole, before) => before,
    ),
  );
  assert.deepEqual(ids(status(dir)), ["product-type", "conformance-level"]);
  // And a repository whose answers a person gave has nothing waiting at all.
  const answered = status(applied("user"));
  assert.deepEqual(answered.waiting, []);
  assert.deepEqual(answered.next, []);
});

test("a call only a person can make, with no row in the ledger, waits too", () => {
  const dir = applied("user");
  const whole = text(dir, LEDGER);
  edit(dir, LEDGER, (ledger) => ledger.replace(rowBlock("product-type"), ""));
  const result = status(dir);
  assert.deepEqual(ids(result), ["product-type"]);
  assert.match(result.waiting[0].answer, /^\/design-assembly:adopt --product-type /);
  put(dir, LEDGER, whole);
  assert.deepEqual(ids(status(dir)), []);
});

test("every recommendation says what it rests on: a measurement here, or a standard", () => {
  const dir = applied("proposed");
  for (const item of status(dir).waiting) {
    assert.match(item.basis, /^(a measurement on this repository|a standard): /, item.id);
  }
  // A proposal that a check holds, and one whose check now fails, get opposite recommendations,
  // each from what was measured.
  edit(dir, LEDGER, (ledger) =>
    ledger.replace(
      /(- id: radius-value\n(?: {4}.*\n)*? {4}check: .*\n)/,
      '$1    note: "proposed by the guide; a person has not confirmed it"\n',
    ),
  );
  const held = status(dir).waiting.find((item) => item.id === "radius-value");
  assert.match(held.recommendation, /^Confirm it as it stands/);
  assert.match(held.basis, /^a measurement on this repository: its check was run now and holds/);
  edit(dir, "src/index.css", (css) => css.replace(/--radius:\s*[^;]+;/g, "--radius: 3rem;"));
  const failing = status(dir).waiting.find((item) => item.id === "radius-value");
  assert.match(failing.recommendation, /^Do not confirm it yet/);
  assert.match(failing.basis, /^a measurement on this repository: .*reports a problem/);
});

test("a decision that source goes around is the audit's to list: it is next, and it does not wait on a person", () => {
  const dir = applied("user");
  assert.deepEqual(status(dir).next, []);
  put(dir, "src/Screen.tsx", 'export const Screen = () => <p className="text-[13px]">x</p>;\n');
  const result = status(dir);
  assert.deepEqual(result.waiting, []);
  assert.equal(result.next[0].command, "/design-assembly:audit");
  assert.match(result.next[0].why, /^1 decision\(s\) failing or bypassed/);
  // Nothing waits on a person, and something is left to fix: the call ends with 1.
  assert.equal(cli("--target", dir).status, 1);
});

test("the tool: the repository's copy against the installed plugin's, and the stamp when there is one", () => {
  const dir = applied("user");
  const same = status(dir).tool;
  assert.equal(same.recorded, null);
  assert.match(same.says, /no stamp/);
  assert.deepEqual(same.installed, {
    version: VERSION,
    tree: treeHash(path.join(PLUGIN, "templates/tools/design-assembly")),
  });
  assert.equal(same.copy, same.installed.tree);
  assert.equal(same.differs, false);
  assert.equal(cli("--target", dir).status, 0);

  // One byte of the copy changed: it differs, and that alone ends the run with 1.
  const file = `${TOOL_COPY}/scale.mjs`;
  const original = text(dir, file);
  put(dir, file, `${original}\n`);
  const changed = status(dir).tool;
  assert.equal(changed.differs, true);
  assert.notEqual(changed.copy, changed.installed.tree);
  assert.match(changed.says, /differs from the installed plugin's.*no stamp/);
  assert.equal(cli("--target", dir).status, 1);
  assert.deepEqual(status(dir).waiting, []);

  // A stamp that names the changed copy: status reads it, and still says the plugin's is another.
  put(dir, STAMP, `${JSON.stringify({ version: "0.0.0", tree: changed.copy })}\n`);
  const stamped = status(dir).tool;
  assert.deepEqual(stamped.recorded, { version: "0.0.0", tree: changed.copy });
  assert.equal(stamped.differs, true);
  assert.match(stamped.says, /stamped as version 0\.0\.0.*installed plugin is version/);

  // The copy put back, the stamp still naming the changed one: changed after it was stamped.
  put(dir, file, original);
  const drifted = status(dir).tool;
  assert.equal(drifted.differs, true);
  assert.match(drifted.says, /changed after it was stamped/);

  // The stamp naming the copy as it is, the plugin's own: nothing differs.
  put(dir, STAMP, `${JSON.stringify({ version: VERSION, tree: same.copy })}\n`);
  const settled = status(dir).tool;
  assert.equal(settled.differs, false);
  assert.match(settled.says, /as stamped/);
  assert.equal(cli("--target", dir).status, 0);
});

test("the hash of a folder is the one git gives its tree", (t) => {
  const dir = applied("user");
  const git = (...args) => spawnSync("git", ["-C", dir, ...args], { encoding: "utf8" });
  if (git("init", "-q").status !== 0) return t.skip("git is not here");
  git("add", "-A");
  const tree = git("write-tree", `--prefix=${TOOL_COPY}/`).stdout.trim();
  assert.match(tree, /^[0-9a-f]{40}$/);
  assert.equal(treeHash(path.join(dir, TOOL_COPY)), tree);
  assert.equal(treeHash(path.join(dir, "no-such-folder")), null);
});

test("status writes nothing: the tree is the same byte for byte after every kind of run", () => {
  for (const dir of [empty(), floor(), applied("proposed"), applied("user")]) {
    const before = snapshot(dir);
    cli("--target", dir);
    cli("--target", dir, "--json");
    spawnSync(execPath, [STATUS], { cwd: dir });
    assert.deepEqual(snapshot(dir), before);
  }
  // The snapshot can see a change: one byte more is another tree.
  const dir = floor();
  const before = snapshot(dir);
  put(dir, "Makefile", `${text(dir, "Makefile")}\n`);
  assert.notDeepEqual(snapshot(dir), before);
});

test("the same repository gives the same answer twice, to a person and to a machine", () => {
  const dir = applied("proposed");
  const first = cli("--target", dir);
  const data = cli("--target", dir, "--json");
  assert.equal(cli("--target", dir).stdout, first.stdout);
  assert.equal(cli("--target", dir, "--json").stdout, data.stdout);
  assert.equal(first.stdout, report(status(dir)));
  assert.deepEqual(JSON.parse(data.stdout), status(dir));
  // With no --target it reads the folder it is run from.
  const here = spawnSync(execPath, [STATUS, "--json"], { cwd: dir, encoding: "utf8" });
  assert.equal(here.stdout, data.stdout);
  // The answer does not carry where the repository sits on this machine.
  assert.ok(!first.stdout.includes(dir) && !data.stdout.includes(dir));
});

test("exit codes: 0 nothing is left, 1 something waits, the tool differs or a decision is gone around, 2 a wrong call or an unreadable repository", () => {
  assert.equal(cli("--target", applied("user")).status, 0);
  const waiting = cli("--target", applied("proposed"));
  assert.equal(waiting.status, 1);
  assert.equal(cli("--target", applied("proposed"), "--json").status, 1);

  const wrong = [
    ["--target"],
    ["--target", path.join(tmpdir(), "design-status-no-such-folder")],
    ["--target", STATUS],
    ["--all"],
    ["somewhere"],
  ];
  for (const args of wrong) {
    const run = cli(...args);
    assert.equal(run.status, 2, args.join(" "));
    assert.equal(run.stdout, "", args.join(" "));
    assert.match(run.stderr, /^(usage|design-assembly): /, args.join(" "));
  }

  // A ledger that cannot be read is not "nothing waits".
  const broken = applied("user");
  put(broken, "design/theme.json", "{ not json");
  const unreadable = cli("--target", broken);
  assert.equal(unreadable.status, 2);
  assert.match(unreadable.stderr, /^design-assembly: this repository cannot be read: /);
  const stamp = applied("user");
  put(stamp, STAMP, '{ "version": 1 }\n');
  const badStamp = cli("--target", stamp, "--json");
  assert.equal(badStamp.status, 2);
  assert.match(badStamp.stderr, /tool-stamp\.json/);
});

test("a person gets one screen: the tier, a line per rhythm, what waits with its recommendation, the tool, and the next command", () => {
  const result = status(applied("proposed"));
  const printed = report(result);
  assert.match(printed, /^tier: audit, reached\. Next tier: foundations$/m);
  assert.match(
    printed,
    new RegExp(`${result.held} held and re-run here, ${result.claimed} claimed and not re-run`),
  );
  assert.deepEqual(
    result.rhythms.map((rhythm) => rhythm.id),
    ["start", "adopt", "intake", "change", "periodic"],
  );
  for (const rhythm of result.rhythms) {
    assert.ok(printed.includes(`  ${rhythm.name}: ${rhythm.says}`), rhythm.id);
  }
  assert.match(printed, /^waiting on the owner: 3$/m);
  for (const item of result.waiting) {
    assert.ok(printed.includes(`${item.id}: ${item.question}`), item.id);
    assert.ok(printed.includes(`recommendation: ${item.recommendation}`), item.id);
    assert.ok(printed.includes(`because: ${item.basis}`), item.id);
    assert.ok(printed.includes(`answer with: ${item.answer}`), item.id);
  }
  assert.ok(printed.includes(`tool: ${result.tool.says}`));
  assert.match(printed, /^next: \/design-assembly:new, /m);
  assert.ok(printed.split("\n").length <= 40, "more than one screen");

  const quiet = report(status(applied("user")));
  assert.match(quiet, /^waiting on the owner: nothing in the ledgers$/m);
  assert.match(quiet, /^next: nothing to run now/m);
});

test("a long list still fits one screen: the first answers in full, the rest by name", () => {
  const dir = applied("proposed");
  // Every row that has a check is turned into a proposal nobody confirmed.
  edit(dir, LEDGER, (ledger) =>
    ledger.replace(
      /( {4}check: .*\n)(?! {4}note:)/g,
      '$1    note: "proposed by the guide; a person has not confirmed it"\n',
    ),
  );
  const result = status(dir);
  assert.ok(result.waiting.length > 5, "the list is not long");
  const printed = report(result);
  assert.match(printed, new RegExp(`^waiting on the owner: ${result.waiting.length}$`, "m"));
  assert.equal(printed.match(/^ {5}answer with: /gm).length, 5);
  const rest = result.waiting.slice(5).map((item) => item.id);
  assert.ok(printed.includes(`and ${rest.length} more, listed with --json: ${rest.join(", ")}`));
  assert.ok(printed.split("\n").length <= 40, "more than one screen");
});

test("the rhythms are read from the repository: each line changes when the repository does", () => {
  const says = (result, id) => result.rhythms.find((rhythm) => rhythm.id === id).says;
  const bare = status(empty());
  const start = status(floor());
  const run = status(applied("user"));
  assert.match(says(bare, "start"), /no stylesheet/);
  assert.match(says(start, "start"), /grey default/);
  assert.match(says(run, "start"), /the guide chose the values/);
  assert.match(says(start, "adopt"), /no ledger/);
  assert.match(says(run, "adopt"), /core decisions answered/);
  assert.match(says(start, "change"), /no check/);
  assert.match(says(run, "change"), /0 failing or bypassed/);
  assert.match(says(run, "intake"), /not built in this version/);
  assert.match(says(start, "periodic"), /no record of what slipped/);
  assert.match(says(run, "periodic"), /no line yet/);
});

test("every report says what status cannot see, and names no command the plugin does not have", () => {
  const open = reference("limits.json").limits.filter(
    (limit) => limit.area === "status" && limit.status === "open",
  );
  assert.ok(open.length > 0, "no limit is written for status");
  for (const dir of [empty(), applied("proposed")]) {
    const result = status(dir);
    const printed = report(result);
    for (const limit of open) assert.ok(printed.includes(limit.id), limit.id);
    const named = `${printed}\n${JSON.stringify(result)}`.match(/\/design-assembly:[a-z-]+/g) ?? [];
    for (const command of new Set(named)) {
      const skill = path.join(PLUGIN, "skills", command.split(":")[1], "SKILL.md");
      assert.ok(existsSync(skill), `${command} is not a command of this plugin`);
    }
  }
});

test("the skill of the command exists and calls the script", () => {
  const skill = readFileSync(path.join(PLUGIN, "skills/status/SKILL.md"), "utf8");
  assert.match(skill, /^---\nname: status\ndescription: \S/);
  assert.match(skill, /scripts\/status\.mjs --target/);
});
