// The status on throwaway repositories: nothing, a floor, one the guide proposed every answer for,
// and one a person answered. Every claim is shown in both directions, and every run leaves the
// repository as it found it.
import "./helpers/own-cores.mjs";
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

import { readCapabilities, socketsOf } from "../scripts/capabilities.mjs";
import { fullStatus, report, STAMP, status, treeHash } from "../scripts/status.mjs";
import { withoutBlock } from "../templates/tools/design-assembly/theme.mjs";

import { passingFloor, roleWords } from "./helpers/answered-roles.mjs";

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
// The floor of the sample application, kept with a muted text that reaches the threshold.
function floor() {
  const dir = empty();
  put(dir, "src/index.css", passingFloor(withoutBlock(text(ROOT, "src/index.css"))));
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
  // The colour roles came later too: where the person gave the answers, the owner spoke to each
  // question of the table of colour roles, as a repository of this version has it.
  if (source === "user") layers.foundations.roles = roleWords();
  // So did the name and day of the source colour, as the guide writes it since 0.33.0: where the
  // person gave the answers, every value of the foundations has the owner's word.
  if (source === "user") {
    layers.foundations.answered.source_color = { by: "Owner Name", on: "2026-11-21" };
  }
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
// The questions of the table of colour roles a guided repository is asked until the owner speaks
// to each, after the person's calls.
const ROLE_QUESTIONS = [
  "color-roles-sidebar",
  "color-roles-neutral",
  "color-roles-status",
  "color-roles-chart",
];
const CALLS = ["product-type", "conformance-level", "source-color", ...ROLE_QUESTIONS];
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
    "sockets",
    "missing",
    "pushed",
  ]);
  // On a floor, nothing is missing before the plugin can build.
  assert.equal(result.missing, null);
  assert.deepEqual(result.tier, { id: "audit", state: "reached", next: "foundations" });
  // Held and claimed are two numbers, never one: a claim was not run again here.
  assert.equal(typeof result.held, "number");
  assert.ok(result.held >= 2);
  assert.equal(result.claimed, 0);
  for (const item of result.waiting) {
    assert.deepEqual(Object.keys(item), [
      "id",
      "source",
      "question",
      "recommendation",
      "basis",
      "answer",
    ]);
    for (const value of Object.values(item)) assert.ok(String(value).trim() !== "", item.id);
  }
  assert.deepEqual(Object.keys(result.tool), ["recorded", "installed", "copy", "differs", "says"]);
  for (const step of result.next) assert.deepEqual(Object.keys(step), ["command", "why"]);
  for (const socket of result.sockets) {
    assert.deepEqual(Object.keys(socket), [
      "id",
      "name",
      "plug",
      "state",
      "limit",
      "chosen",
      "outside",
    ]);
  }
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
  // The decision sheet records a person's answer to a row nobody confirmed.
  assert.equal(color.answer, "/design-assembly:decide");
  assert.equal(color.source, "ledger");
  // The questions of the table of colour roles are answered in the guide.
  assert.deepEqual(
    result.next.map((step) => step.command),
    ["/design-assembly:decide", "/design-assembly:new"],
  );
  // The other direction: the row as a person leaves it, with no note that it is a proposal.
  edit(dir, LEDGER, (ledger) =>
    ledger.replace(
      /(- id: source-color\n(?: {4}(?!note:).*\n)*) {4}note: .*\n/,
      (whole, before) => before,
    ),
  );
  assert.deepEqual(ids(status(dir)), ["product-type", "conformance-level", ...ROLE_QUESTIONS]);
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
  assert.match(result.next[0].why, /^1 decision is failing or bypassed \(type-scale\)/);
  // Nothing waits on a person, and something is left to fix: the call ends with 1.
  assert.equal(cli("--target", dir).status, 1);
});

test("the tool: the repository's copy against the installed plugin's, and the stamp when there is one", () => {
  const dir = applied("user");
  // The guide stamps what it writes; this test starts from a repository adopted before stamps.
  rmSync(path.join(dir, STAMP));
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
  assert.match(printed, /^waiting on the owner: 7$/m);
  // The first five in full; the rest by name, as a long list does.
  for (const item of result.waiting.slice(0, 5)) {
    assert.ok(printed.includes(`${item.id}: ${item.question}`), item.id);
    assert.ok(printed.includes(`recommendation: ${item.recommendation}`), item.id);
    assert.ok(printed.includes(`because: ${item.basis}`), item.id);
    assert.ok(printed.includes(`answer with: ${item.answer}`), item.id);
  }
  assert.ok(printed.includes(`tool: ${result.tool.says}`));
  assert.match(printed, /^next: \/design-assembly:decide, 3 answers wait on the owner/m);
  assert.ok(printed.split("\n").length <= 40, "more than one screen");

  const quiet = report(status(applied("user")));
  assert.match(quiet, /^waiting on the owner: nothing in the ledgers or the waiting list$/m);
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
  // The intake command has been built since item 3.3: the line says so, never that it is missing.
  assert.doesNotMatch(says(run, "intake"), /not built/);
  assert.match(says(run, "intake"), /^the intake command takes a block in/);
  assert.match(says(run, "intake"), /nothing records yet which need got which block/);
  // A ledger, by hand or by the command, is named, with whether it has its shape.
  const kept = applied("user");
  put(
    kept,
    "design/intake.yaml",
    "version: 1\nblocks:\n  - name: Header\n    file: src/header.tsx\n    source: made-by-hand\n    need: page-head\n    approved: 2026-11-16\n",
  );
  assert.match(
    says(status(kept), "intake"),
    /^the intake command takes a block in; design\/intake\.yaml records which need got which block, with the one shape of the contract$/,
  );
  put(kept, "design/intake.yaml", "version: 1\nblocks: []\nkhoi: 1\nkeys: 2\n");
  assert.match(says(status(kept), "intake"), /not of the contract's shape/);
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

// A waiting list as a repository keeps one: two questions that wait, one a person answered, and
// one permission, which no answer settles.
const LIST = {
  version: 1,
  rows: [
    {
      id: "Q1",
      group: "A. Built already",
      question: "Does the bar stay on top?",
      recommendation: "Keep it",
      basis: "It is built this way, and decision 0025 records it",
    },
    { id: "Q2", kind: "question", question: "Is the second sample screen the right one?" },
    {
      id: "Q3",
      question: "Does a change of screen keep the page?",
      answer: "keep",
      by: "A Person",
      on: "2026-01-02",
    },
    { id: "P1", kind: "permission", question: "Let the plugin be installed in another repository" },
  ],
};
const WAITING_LIST = "design/waiting-list.json";

test("a question of the waiting list that nobody answered waits on the owner, and decide is the command that answers", () => {
  const dir = applied("user");
  assert.deepEqual(ids(fullStatus(dir)), []);
  put(dir, WAITING_LIST, `${JSON.stringify(LIST, null, 2)}\n`);
  const result = fullStatus(dir);
  // The answered row and the permission do not wait: the rule is the decision sheet's own.
  assert.deepEqual(ids(result), ["Q1", "Q2"]);
  for (const item of result.waiting) {
    assert.equal(item.source, "waiting-list");
    assert.equal(item.answer, "/design-assembly:decide");
    assert.match(item.basis, /^a measurement on this repository: /);
  }
  const [first, second] = result.waiting;
  assert.equal(first.question, "Does the bar stay on top?");
  assert.equal(first.recommendation, "Keep it");
  assert.ok(first.basis.endsWith("It is built this way, and decision 0025 records it"));
  // A row that recommends nothing is listed as that, never with an answer made up for it.
  assert.match(second.recommendation, /^none given/);
  assert.match(second.basis, /gives no ground/);
  assert.deepEqual(result.next, [
    { command: "/design-assembly:decide", why: "2 answers wait on the owner (Q1, Q2)" },
  ]);
  const printed = report(result);
  assert.match(printed, /^waiting on the owner: 2 \(0 in the ledgers, 2 in the waiting list\)$/m);
  assert.match(printed, /^ {5}answer with: \/design-assembly:decide$/m);
  assert.match(printed, /^next: \/design-assembly:decide, 2 answers wait on the owner/m);
  // The command says the same, and ends with 1 because something waits.
  const called = cli("--target", dir, "--json");
  assert.equal(called.status, 1);
  assert.deepEqual(JSON.parse(called.stdout), result);
  assert.equal(cli("--target", dir).stdout, printed);

  // The other direction: every question answered, and nothing waits again.
  const answered = LIST.rows.map((row) =>
    row.kind === "permission" || row.answer
      ? row
      : { ...row, answer: "keep", by: "A Person", on: "2026-01-02" },
  );
  put(dir, WAITING_LIST, `${JSON.stringify({ ...LIST, rows: answered })}\n`);
  assert.deepEqual(ids(fullStatus(dir)), []);
  assert.equal(cli("--target", dir).status, 0);
});

test("rows of the ledger nobody confirmed and rows of the waiting list are counted together, under one command", () => {
  const dir = applied("proposed");
  put(dir, WAITING_LIST, `${JSON.stringify(LIST)}\n`);
  const result = fullStatus(dir);
  assert.deepEqual(ids(result), [...CALLS, "Q1", "Q2"]);
  assert.deepEqual(
    result.next.map((step) => step.command),
    ["/design-assembly:decide", "/design-assembly:new"],
  );
  assert.match(result.next[0].why, /^5 answers wait on the owner/);
  assert.match(
    report(result),
    /^waiting on the owner: 9 \(7 in the ledgers, 2 in the waiting list\)$/m,
  );
  // What the ledgers alone say stays what the decision sheet is built on: it never lists a row of
  // the waiting list, which the sheet reads for itself.
  assert.deepEqual(ids(status(dir)), CALLS);
});

test("a waiting list that cannot be read is a repository that cannot be read, not a list with nothing in it", () => {
  const dir = applied("user");
  put(dir, WAITING_LIST, "{ not json");
  const called = cli("--target", dir, "--json");
  assert.equal(called.status, 2);
  assert.equal(called.stdout, "");
  assert.match(
    called.stderr,
    /^design-assembly: this repository cannot be read: .*waiting-list\.json/,
  );
  put(dir, WAITING_LIST, `${JSON.stringify({ version: 1, rows: [{ id: "Q1" }] })}\n`);
  assert.equal(cli("--target", dir).status, 2);
});

test("the skill of the command exists and calls the script", () => {
  const skill = readFileSync(path.join(PLUGIN, "skills/status/SKILL.md"), "utf8");
  assert.match(skill, /^---\nname: status\ndescription: \S/);
  assert.match(skill, /scripts\/status\.mjs --target/);
});

test("the socket board: each capability with its plug or its limit, on two lines that keep one screen", () => {
  const result = status(applied("proposed"));
  const { table } = readCapabilities();
  assert.deepEqual(
    result.sockets.map((socket) => socket.id),
    table.capabilities.map((item) => item.id),
  );
  const empty = result.sockets.filter((socket) => socket.state === "empty");
  assert.ok(empty.length > 0);
  for (const socket of empty) assert.equal(socket.plug, null, socket.id);
  for (const socket of empty) assert.ok(socket.limit, socket.id);
  const printed = report(result);
  const plugged = result.sockets.length - empty.length;
  assert.match(
    printed,
    new RegExp(
      `^sockets: ${plugged} of ${result.sockets.length} with a default plug; empty: ${empty.map((s) => s.id).join(", ")} \\(references/limits\\.json of this plugin\\)$`,
      "m",
    ),
  );
  assert.ok(printed.split("\n").length <= 40, "more than one screen");
  // A fixture repository holds nothing an outside plug detects: no plug is plugged in here.
  assert.doesNotMatch(printed, /plugged in here/);
  assert.ok(result.sockets.every((socket) => socket.outside.every((plug) => !plug.here)));
});

test("criterion 7: the board has a chosen column, a line for a plug chosen and not here, and the exit code does not change", () => {
  const dir = applied("user");
  assert.equal(cli("--target", dir).status, 0);
  const before = status(dir);
  assert.ok(before.sockets.every((socket) => socket.chosen === null));
  assert.doesNotMatch(report(before), /chosen/);
  edit(
    dir,
    LEDGER,
    (ledger) =>
      `${ledger}  - id: plug-handoff\n    layer: governance\n    kind: judgment\n    source: "plug:claude-design"\n    note: "confirmed by Owner Name on 2026-11-23"\n  - id: plug-direction\n    layer: governance\n    kind: judgment\n    source: "plug:directions"\n    note: "answered by Owner Name on 2026-11-23"\n`,
  );
  const result = status(dir);
  const at = (id) => result.sockets.find((socket) => socket.id === id);
  assert.deepEqual(at("handoff").chosen, {
    plug: "claude-design",
    by: "Owner Name",
    on: "2026-11-23",
    state: "chosen-but-missing",
  });
  assert.equal(
    at("handoff").outside.find((plug) => plug.id === "claude-design").state,
    "chosen-but-missing",
  );
  assert.equal(at("direction").chosen.state, "plugin");
  assert.equal(at("foundations").chosen, null);
  const printed = report(result);
  assert.match(printed, /^ {2}chosen: directions \(direction\), claude-design \(handoff\)$/m);
  assert.match(
    printed,
    /^ {2}chosen-but-missing: claude-design \(handoff\), which this repository does not show$/m,
  );
  assert.ok(printed.split("\n").length <= 40, "more than one screen");
  // The exit code does not change: nothing more waits on the owner.
  assert.deepEqual(result.waiting, before.waiting);
  assert.equal(cli("--target", dir).status, 0);
  assert.equal(cli("--target", dir, "--json").status, 0);
});

test("a board with no empty socket prints no empty part, and a plug is here only where its file is", () => {
  const read = readCapabilities();
  const full = JSON.parse(JSON.stringify(read.table));
  for (const item of full.capabilities) {
    if (!item.plugs.some((plug) => plug.default)) {
      item.plugs = [{ id: "stand-in", kind: "core", default: true, scripts: [] }];
    }
  }
  const dir = empty();
  const board = socketsOf(dir, { table: full, plugs: read.plugs });
  const printed = report({ ...status(applied("user")), sockets: board });
  assert.match(printed, /^sockets: 20 of 20 with a default plug$/m);
  assert.doesNotMatch(printed, /empty:/);

  // The same board, on a repository that depends on the package one plug detects.
  const detecting = read.plugs.find((plug) => plug.detect?.package);
  put(
    dir,
    "package.json",
    JSON.stringify({ devDependencies: { [detecting.detect.package]: "1.0.0" } }),
  );
  const here = socketsOf(dir, { table: full, plugs: read.plugs });
  const marked = here.flatMap((socket) =>
    socket.outside.filter((plug) => plug.here).map((plug) => plug.id),
  );
  assert.deepEqual([...new Set(marked)], [detecting.id]);
  assert.match(
    report({ ...status(applied("user")), sockets: here }),
    new RegExp(`^  plugged in here: ${detecting.id} \\(`, "m"),
  );

  // A repository whose package file cannot be read plugs nothing in.
  put(dir, "package.json", "{ not json");
  assert.ok(
    socketsOf(dir, { table: full, plugs: read.plugs }).every((s) =>
      s.outside.every((plug) => !plug.here),
    ),
  );
});
