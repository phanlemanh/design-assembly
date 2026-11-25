// The family's owner changes an answer of the core (spec 0016, criterion 22, slice 4 of item 7.1):
// a value changed, a default raised to locked, a locked answer lowered to a default, an answer the
// core does not hold added from a repository where a person settled it. Every change records who,
// on which day and why, as an entry of the answer's history, which `core --check` holds. The move
// writes only the core's answers; no member repository is written or told. Every repository and
// every core is a fixture in a throwaway folder: nothing calls a model or the network.
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import {
  existsSync,
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
import { env, execPath } from "node:process";
import { after, test } from "node:test";
import { fileURLToPath } from "node:url";

import { CORE, LEDGERS } from "../templates/tools/design-assembly/contract.mjs";

const PLUGIN = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const CORE_COMMAND = path.join(PLUGIN, "scripts/core.mjs");
const NO_NETWORK = path.join(PLUGIN, "tests/helpers/no-network.mjs");
const BUILT_ON = "2026-11-25";
const ON = "2026-11-26";
// A family's name as a person gives it: the user's data, which only the core folder may hold.
const FAMILY = "Marrow Bay Tools";
const OWNER = "Ana Reyes";
const WHY = "the second product showed the darker blue reads better on its dense tables";
// The rule a command says before an answer is locked.
const LOCK_RULE = /only once a difference between the family's repositories has done real harm/;

const made = [];
after(() => made.forEach((dir) => rmSync(dir, { recursive: true, force: true })));
const empty = () => {
  const dir = realpathSync(mkdtempSync(path.join(tmpdir(), "design-core-change-")));
  made.push(dir);
  return dir;
};
const put = (dir, file, text) => {
  mkdirSync(path.dirname(path.join(dir, file)), { recursive: true });
  writeFileSync(path.join(dir, file), text);
};
const json = (data) => `${JSON.stringify(data, null, 2)}\n`;
const read = (dir, file) => JSON.parse(readFileSync(path.join(dir, file), "utf8"));
// The machine's list of cores of these tests: since slice 2, core --build writes a line there, and
// it is never the list of the person running them, nor the one other tests of the run read.
const LIST = path.join(
  realpathSync(mkdtempSync(path.join(tmpdir(), "design-core-change-list-"))),
  "cores.json",
);
const core = (args, options = {}) =>
  spawnSync(execPath, [CORE_COMMAND, ...args], {
    encoding: "utf8",
    ...options,
    env: { ...env, ...options.env, DESIGN_ASSEMBLY_CORES: LIST },
  });
const git = (dir, ...args) =>
  spawnSync(
    "git",
    ["-C", dir, "-c", "user.name=Test", "-c", "user.email=test@example.invalid", ...args],
    { encoding: "utf8" },
  );

// The decision ledger, one block per row, as the ledger is written.
function ledger(rows) {
  const lines = ["version: 1", "decisions:"];
  for (const row of rows) {
    lines.push(`  - id: ${row.id}`, `    layer: ${row.layer}`, `    kind: ${row.kind}`);
    lines.push(`    source: ${JSON.stringify(row.source)}`);
    if (row.check) lines.push(`    check: ${JSON.stringify(row.check)}`);
    if (row.note) lines.push(`    note: ${JSON.stringify(row.note)}`);
  }
  return `${lines.join("\n")}\n`;
}

const CHECK = "tool:tools/design-assembly/check.mjs";
const ROWS = [
  { id: "source-color", layer: "foundations", kind: "judgment", source: "design/blueprint.json" },
  { id: "record-panel", layer: "patterns", kind: "closed", source: "the blueprint", check: CHECK },
  {
    id: "table-density",
    layer: "components",
    kind: "formula",
    source: "columns fit",
    check: CHECK,
  },
  {
    id: "type-scale-values",
    layer: "foundations",
    kind: "standard",
    source: "scale",
    check: CHECK,
  },
  { id: "test-screen-sizes", layer: "templates", kind: "formula", source: "widths", check: CHECK },
  {
    id: "failed-action",
    layer: "patterns",
    kind: "closed",
    source: "the repository's own test of it",
    check: "test:tests/failed-action.test.tsx",
  },
  {
    id: "focus-after-action",
    layer: "patterns",
    kind: "standard",
    source: "the repository's own browser test of it",
    check: "e2e:tests/e2e/templates.spec.ts",
  },
];

// The repositories a change reads. `guided` the guide built, every answer the person's; `adopted`
// kept by adopting, its record panel not held by any ledger; `waiting` a repository whose rule
// still waits on its decision sheet.
const KINDS = {
  guided(dir) {
    put(dir, "package.json", json({ name: "guided-app", private: true }));
    put(
      dir,
      LEDGERS.blueprint.file,
      json({
        version: 1,
        status: "approved",
        layers: {
          context: { status: "decided", source: "user", choice: { product_type: "application" } },
          foundations: {
            status: "decided",
            source: "user",
            choice: { source_color: "#0246ff", type_scale: "modular", type_ratio: "1.25" },
          },
          patterns: { status: "decided", source: "user", choice: { record_panel: "over" } },
        },
      }),
    );
    put(dir, LEDGERS.decisions.file, ledger(ROWS));
    put(dir, LEDGERS["screen-sizes"].file, json({ version: 1, widths: [320, 768, 1440] }));
  },
  adopted(dir) {
    put(dir, "package.json", json({ name: "adopted-app", private: true }));
    put(
      dir,
      LEDGERS.decisions.file,
      ledger([
        { id: "source-color", layer: "foundations", kind: "judgment", source: "globals.css" },
        {
          id: "record-panel",
          layer: "patterns",
          kind: "closed",
          source: "design/behaviors.md",
          check: "test:tests/behavior.test.tsx",
          note: "answered by Bo Lindqvist on 2026-11-24",
        },
        {
          id: "undo-or-confirm",
          layer: "patterns",
          kind: "formula",
          source: "the repository's own test of undo",
          check: "test:tests/undo.test.tsx",
        },
      ]),
    );
    put(
      dir,
      LEDGERS.tokens.file,
      json({ color: { primary: { $type: "color", $value: "#cc785c" } } }),
    );
  },
  waiting(dir) {
    KINDS.adopted(dir);
    put(
      dir,
      "design/waiting/Q1.json",
      json({
        id: "Q1",
        question: "Keep undo before a delete?",
        recommendation: "Keep",
        basis: "The rule the repository wrote.",
        hard_to_undo: false,
        where: "design/decisions.yaml",
        if_refused: "Write another rule.",
        item: "decision:undo-or-confirm",
      }),
    );
  },
};

// A repository of a kind, in git with one commit, in a throwaway folder of its own.
function repository(kind) {
  const dir = path.join(empty(), `${kind}-app`);
  mkdirSync(dir);
  KINDS[kind](dir);
  git(dir, "init", "-q", "-b", "main");
  git(dir, "add", "-A");
  git(dir, "commit", "-q", "-m", "first");
  return dir;
}

// A core built by the build of slice 1 from a guided repository, beside it. focus-after-action is
// settled there and left out of the core, so a change can add it.
function builtCore() {
  const first = repository("guided");
  const place = path.join(path.dirname(first), "family-core");
  const call = core([
    "--target",
    first,
    "--build",
    "--family",
    FAMILY,
    "--core",
    place,
    "--by",
    OWNER,
    "--on",
    BUILT_ON,
    "--lock",
    "source-color",
    "--lock",
    "record-panel",
    "--lock",
    "failed-action",
    "--default",
    "table-density",
    "--default",
    "type-scale-values",
    "--default",
    "test-screen-sizes",
  ]);
  assert.equal(call.status, 0, call.stderr);
  return { first, place };
}

// A change of the core, with the owner's name, the day and a reason unless the call gives its own.
const change = (place, id, more = [], options = {}) =>
  core(
    [
      "--change",
      id,
      "--core",
      place,
      ...(more.includes("--by") ? [] : ["--by", OWNER]),
      ...(more.includes("--on") ? [] : ["--on", ON]),
      ...(more.includes("--why") ? [] : ["--why", WHY]),
      ...more,
    ],
    options,
  );

// Every file of a folder with the hash of its bytes, the git folder left out.
function snapshot(dir, at = "") {
  if (!existsSync(dir)) return [];
  return readdirSync(path.join(dir, at))
    .filter((name) => name !== ".git")
    .sort()
    .flatMap((name) => {
      const relative = path.posix.join(at, name);
      const full = path.join(dir, relative);
      if (lstatSync(full).isDirectory()) return [`${relative}/`, ...snapshot(dir, relative)];
      return [`${relative} ${createHash("sha256").update(readFileSync(full)).digest("hex")}`];
    });
}
const answerOf = (place, id) => read(place, "answers.json").answers.find((item) => item.id === id);
const checked = (place) => {
  const call = core(["--check", "--core", place, "--json"]);
  return { status: call.status, problems: JSON.parse(call.stdout || '{"problems":[]}').problems };
};

test("a value changes: the history keeps what it was, what it became, who, when and why", () => {
  const { first, place } = builtCore();
  const before = answerOf(place, "source-color");
  const untouched = snapshot(first);
  const call = change(place, "source-color", ["--value", "#1A2B3C", "--json"]);
  assert.equal(call.status, 0, call.stderr);
  const result = JSON.parse(call.stdout);
  assert.equal(result.change, "value");
  assert.deepEqual(result.was, { value: "#0246ff", hold: "locked" });
  assert.deepEqual(result.became, { value: "#1a2b3c", hold: "locked" });
  assert.equal(result.reminder, null);
  assert.equal(result.members_told, false);
  assert.deepEqual(result.files, [{ path: path.join(place, "answers.json"), change: "update" }]);

  const after = answerOf(place, "source-color");
  // The value is the new one, written as the build writes a given colour; how the answer came into
  // the core is never rewritten.
  assert.equal(after.value, "#1a2b3c");
  for (const key of ["by", "on", "why", "origin", "hold", "check", "question", "kind"]) {
    assert.deepEqual(after[key], before[key], key);
  }
  assert.deepEqual(after.history, [
    {
      was: { value: "#0246ff", hold: "locked" },
      became: { value: "#1a2b3c", hold: "locked" },
      by: OWNER,
      on: ON,
      why: WHY,
    },
  ]);
  // The other answers are as they were; the part is written at the shape this plugin knows.
  const answers = read(place, "answers.json");
  assert.equal(answers.version, CORE.version);
  assert.ok(answers.answers.filter((item) => item.id !== "source-color").every((i) => !i.history));
  assert.deepEqual(checked(place), { status: 0, problems: [] });
  // A second change goes on from the first.
  assert.equal(change(place, "source-color", ["--value", "#0246ff"]).status, 0);
  assert.deepEqual(
    answerOf(place, "source-color").history.map((step) => [step.was.value, step.became.value]),
    [
      ["#0246ff", "#1a2b3c"],
      ["#1a2b3c", "#0246ff"],
    ],
  );
  assert.equal(core(["--check", "--core", place]).status, 0);
  // Nothing outside the core: the first repository is as it was.
  assert.deepEqual(snapshot(first), untouched);
  assert.equal(git(first, "status", "--porcelain").stdout, "");
});

test("for a person: what changed, that no member was written or told, and when members learn", () => {
  const { place } = builtCore();
  const call = change(place, "test-screen-sizes", ["--value", "360, 768,1280"]);
  assert.equal(call.status, 0, call.stderr);
  assert.match(call.stdout, new RegExp(`family core: ${FAMILY}, at ${place}`));
  assert.match(
    call.stdout,
    /test-screen-sizes, its value: \[320,768,1440\] became \[360,768,1280\]/,
  );
  assert.match(call.stdout, new RegExp(`by ${OWNER} on ${ON}, because ${WHY}`));
  assert.match(call.stdout, /update {2}.*answers\.json/);
  assert.match(
    call.stdout,
    /no member repository was written or told: members learn of the change when they next read the core, which a later slice builds/,
  );
  assert.match(call.stdout, /nothing was committed or sent anywhere/);
  assert.deepEqual(answerOf(place, "test-screen-sizes").value, [360, 768, 1280]);
});

test("a value is checked for its form exactly as the build checks it, and a rule is given none", () => {
  const { place } = builtCore();
  const before = snapshot(place);
  for (const [id, value, why] of [
    ["source-color", "#12", /--value #12: source-color is a colour written #rrggbb/],
    ["record-panel", "sideways", /record-panel is one of beside, over, in-place/],
    ["type-scale-values", "modular 9", /type-scale-values is standard, or modular and one of/],
    ["test-screen-sizes", "wide", /test-screen-sizes is whole widths joined by commas/],
    [
      "failed-action",
      "show a toast",
      /failed-action is a rule, whose words are its row's: a rule is not given a value/,
    ],
    ["table-density", "dense", /table-density is a rule/],
  ]) {
    const refused = change(place, id, ["--value", value]);
    assert.equal(refused.status, 2, `${id}=${value}`);
    assert.equal(refused.stdout, "");
    assert.match(refused.stderr, why, `${id}=${value}`);
  }
  // Each form the build takes is taken here.
  assert.equal(change(place, "record-panel", ["--value", "beside"]).status, 0);
  assert.equal(change(place, "type-scale-values", ["--value", "standard"]).status, 0);
  assert.notDeepEqual(snapshot(place), before);
});

test("a default raised to locked: the rule of locking is said first, and the person decides", () => {
  const { place } = builtCore();
  const call = change(place, "table-density", ["--hold", "locked"]);
  assert.equal(call.status, 0, call.stderr);
  const lines = call.stdout.split("\n");
  assert.match(lines[0], LOCK_RULE);
  assert.match(lines[0], /You decide; this command does not refuse/);
  const answer = answerOf(place, "table-density");
  assert.equal(answer.hold, "locked");
  assert.deepEqual(answer.history[0].was, { value: answer.value, hold: "default" });
  assert.deepEqual(answer.history[0].became, { value: answer.value, hold: "locked" });
  // The same in a machine's answer, and under a dry run.
  const again = change(place, "type-scale-values", ["--hold", "locked", "--json", "--dry-run"]);
  const result = JSON.parse(again.stdout);
  assert.match(result.reminder, LOCK_RULE);
  assert.equal(result.change, "hold");
});

test("a locked answer lowered to a default, and a value and a hold changed at once", () => {
  const { place } = builtCore();
  const lowered = change(place, "record-panel", ["--hold", "default", "--json"]);
  assert.equal(lowered.status, 0, lowered.stderr);
  const result = JSON.parse(lowered.stdout);
  assert.equal(result.reminder, null);
  assert.doesNotMatch(change(place, "failed-action", ["--hold", "default"]).stdout, LOCK_RULE);
  assert.equal(answerOf(place, "record-panel").hold, "default");
  const both = JSON.parse(
    change(place, "source-color", ["--value", "#00aa55", "--hold", "default", "--json"]).stdout,
  );
  assert.equal(both.change, "value and hold");
  assert.deepEqual(both.became, { value: "#00aa55", hold: "default" });
  assert.equal(core(["--check", "--core", place]).status, 0);
});

test("an answer added from a repository where a person settled it, as the build reads the first one", () => {
  const { first, place } = builtCore();
  // focus-after-action was settled in the first repository and left out of the core.
  const added = change(place, "focus-after-action", [
    "--from",
    first,
    "--hold",
    "locked",
    "--json",
  ]);
  assert.equal(added.status, 0, added.stderr);
  const result = JSON.parse(added.stdout);
  assert.equal(result.change, "added");
  assert.equal(result.was, null);
  assert.equal(result.from, "guided-app");
  assert.match(result.reminder, LOCK_RULE);
  const answer = answerOf(place, "focus-after-action");
  assert.equal(answer.kind, "rule");
  assert.equal(answer.hold, "locked");
  assert.equal(answer.check, "e2e:tests/e2e/templates.spec.ts");
  assert.equal(answer.by, OWNER);
  assert.equal(answer.on, ON);
  assert.match(answer.why, new RegExp(`added to the core locked: ${WHY}`));
  assert.equal(answer.origin.repository, "guided-app");
  assert.equal(answer.history, undefined);
  assert.equal(git(first, "status", "--porcelain").stdout, "");

  // From a second repository: a value its ledgers do not hold is the person's to give, checked for
  // its form, and recorded as given by them on that day.
  const second = repository("adopted");
  const rule = change(place, "undo-or-confirm", ["--from", second, "--hold", "default"]);
  assert.equal(rule.status, 0, rule.stderr);
  assert.equal(answerOf(place, "undo-or-confirm").origin.repository, "adopted-app");
  // record-panel is in the core already; a core without it takes it with its given value.
  const small = builtSmall(first, "source-color");
  const ungiven = change(small, "record-panel", ["--from", second, "--hold", "default"]);
  assert.equal(ungiven.status, 2);
  assert.match(
    ungiven.stderr,
    /record-panel: its value could not be read from adopted-app .*--value <value>/,
  );
  const wrongForm = change(small, "record-panel", [
    "--from",
    second,
    "--hold",
    "default",
    "--value",
    "sideways",
  ]);
  assert.equal(wrongForm.status, 2);
  assert.match(wrongForm.stderr, /record-panel is one of beside, over, in-place/);
  const given = change(small, "record-panel", [
    "--from",
    second,
    "--hold",
    "default",
    "--value",
    "beside",
  ]);
  assert.equal(given.status, 0, given.stderr);
  const panel = answerOf(small, "record-panel");
  assert.equal(panel.value, "beside");
  assert.deepEqual(panel.origin.given, { by: OWNER, on: ON });
  assert.equal(panel.origin.by, "Bo Lindqvist");
  // A value the repository's ledgers hold is the repository's: the person gives none.
  const panelOnly = builtSmall(first, "record-panel");
  const read = change(panelOnly, "source-color", [
    "--from",
    second,
    "--hold",
    "locked",
    "--value",
    "#000000",
  ]);
  assert.equal(read.status, 2);
  assert.match(
    read.stderr,
    /the value of source-color was read from design\/tokens\.json of adopted-app/,
  );
  assert.equal(core(["--check", "--core", place]).status, 0);
  assert.equal(core(["--check", "--core", small]).status, 0);
});

// A core holding one answer alone, locked, built from the guided repository.
function builtSmall(first, id) {
  const place = path.join(empty(), "small-core");
  const call = core([
    "--target",
    first,
    "--build",
    "--family",
    FAMILY,
    "--core",
    place,
    "--by",
    OWNER,
    "--on",
    BUILT_ON,
    "--lock",
    id,
  ]);
  assert.equal(call.status, 0, call.stderr);
  return place;
}

test("only an answer a person settled is added, and an addition says its hold and where it comes from", () => {
  const { place } = builtCore();
  const before = snapshot(place);
  const waiting = repository("waiting");
  const guided = repository("guided");
  for (const [id, more, why] of [
    [
      "undo-or-confirm",
      ["--from", waiting, "--hold", "locked"],
      /undo-or-confirm is not an answer a person settled in waiting-app: it waits on the decision sheet as Q1/,
    ],
    [
      "copy-tone",
      ["--from", waiting, "--hold", "locked"],
      /copy-tone is no answer of waiting-app that may go into a core/,
    ],
    [
      "focus-after-action",
      ["--from", guided],
      /say whether focus-after-action comes in locked or a default, with --hold/,
    ],
    [
      "focus-after-action",
      ["--hold", "locked"],
      /focus-after-action is no answer of the core: to add it, name the repository a person settled it in with --from DIR/,
    ],
    ["source-color", ["--from", guided, "--hold", "locked"], /source-color is in the core already/],
    [
      "focus-after-action",
      ["--from", path.join(guided, "nowhere"), "--hold", "locked"],
      /is not a folder/,
    ],
  ]) {
    const refused = change(place, id, more);
    assert.equal(refused.status, 2, `${id} ${more.join(" ")}`);
    assert.equal(refused.stdout, "");
    assert.match(refused.stderr, why);
  }
  assert.deepEqual(snapshot(place), before);
});

test("no reason, no person, an address, an unknown answer: a wrong call, and nothing is written", () => {
  const { place } = builtCore();
  const before = snapshot(place);
  const raw = (...args) => core(["--change", "source-color", "--core", place, ...args]);
  for (const [call, why] of [
    [
      raw("--by", OWNER, "--value", "#111111"),
      /say why, with --why TEXT: every change of a core records its reason/,
    ],
    [raw("--by", OWNER, "--why", "  ", "--value", "#111111"), /say why, with --why TEXT/],
    [
      raw("--why", WHY, "--value", "#111111"),
      /say who changes the core, with --by NAME: nothing is locked, unlocked or changed without a person/,
    ],
    [
      raw("--by", "ana@example.com", "--why", WHY, "--value", "#111111"),
      /--by holds an e-mail address/,
    ],
    [
      raw("--by", OWNER, "--why", "asked by ana@example.com", "--value", "#111111"),
      /--why holds an e-mail address/,
    ],
    [
      raw("--by", OWNER, "--why", WHY, "--value", "x@example.com"),
      /--value holds an e-mail address/,
    ],
    [
      raw("--by", OWNER, "--why", WHY),
      /say what changes: --value VALUE for its value, --hold locked or --hold default for its hold/,
    ],
    [raw("--by", OWNER, "--why", WHY, "--hold", "frozen"), /--hold is locked or default/],
    [
      raw("--by", OWNER, "--why", WHY, "--value", "#111111", "--value", "#222222"),
      /--value is given once in a change/,
    ],
    [
      raw("--by", OWNER, "--why", WHY, "--value", "#111111", "--on", "2026-13-01"),
      /is not a day written YYYY-MM-DD/,
    ],
    [
      raw("--by", OWNER, "--why", WHY, "--value", "#111111", "--on", "2026-11-24"),
      /--on 2026-11-24 is before 2026-11-25, the day of the answer's last change: a history goes forward/,
    ],
    [
      core(["--change", "source-color", "--by", OWNER, "--why", WHY, "--value", "#111111"]),
      /say which core to change, with --core DIR/,
    ],
    [
      core(["--change", "source-color", "--build", "--core", place]),
      /--change is a call of its own/,
    ],
    [core(["--check", "--core", place, "--why", WHY]), /--why is a flag of --change/],
    [
      raw("--by", OWNER, "--why", WHY, "--lock", "source-color"),
      /--lock is a flag of --build, not of --change/,
    ],
    [core(["--core", place, "--hold", "locked"]), /--hold is a flag of --change/],
    [
      core([
        "--change",
        "no-such-answer",
        "--core",
        place,
        "--by",
        OWNER,
        "--why",
        WHY,
        "--value",
        "#111111",
      ]),
      /no-such-answer is no answer of the core/,
    ],
  ]) {
    assert.equal(call.status, 2, call.stderr);
    assert.equal(call.stdout, "");
    assert.match(call.stderr, why);
  }
  assert.deepEqual(snapshot(place), before);
  assert.doesNotMatch(readFileSync(path.join(place, "answers.json"), "utf8"), /@/);
});

test("a change that changes nothing is said to be so and writes nothing", () => {
  const { place } = builtCore();
  const before = snapshot(place);
  for (const more of [
    ["--value", "#0246FF"],
    ["--hold", "locked"],
    ["--value", "#0246ff", "--hold", "locked"],
  ]) {
    const call = change(place, "source-color", more);
    assert.equal(call.status, 0, call.stderr);
    assert.match(
      call.stdout,
      /source-color is already #0246ff, locked: this changes nothing, and nothing was written/,
    );
    const result = JSON.parse(change(place, "source-color", [...more, "--json"]).stdout);
    assert.equal(result.change, "none");
    assert.deepEqual(result.files, []);
  }
  assert.deepEqual(snapshot(place), before);
});

test("a dry run shows what would change and writes nothing", () => {
  const { place } = builtCore();
  const before = snapshot(place);
  const call = change(place, "source-color", ["--value", "#123456", "--dry-run"]);
  assert.equal(call.status, 0, call.stderr);
  assert.match(call.stdout, /\(not written: --dry-run\)/);
  assert.match(call.stdout, /would write:\n {2}update {2}.*answers\.json/);
  assert.match(call.stdout, /source-color, its value: #0246ff became #123456/);
  assert.deepEqual(snapshot(place), before);
});

test("a core of a newer shape is refused and left untouched", () => {
  for (const file of ["answers.json", "core.json"]) {
    const { place } = builtCore();
    put(place, file, json({ ...read(place, file), version: CORE.version + 1 }));
    const before = snapshot(place);
    const call = change(place, "source-color", ["--value", "#123456"]);
    assert.equal(call.status, 2, file);
    assert.match(
      call.stderr,
      new RegExp(
        `${file.replace(".", "\\.")} has shape ${CORE.version + 1} and this tool knows shape ${CORE.version} of a family core: update the design-assembly plugin`,
      ),
    );
    assert.deepEqual(snapshot(place), before);
  }
});

test("a core that does not hold its shape is not changed until it does", () => {
  const { place } = builtCore();
  const answers = read(place, "answers.json");
  put(
    place,
    "answers.json",
    json({ ...answers, answers: [{ ...answers.answers[0], hold: "frozen" }] }),
  );
  const before = snapshot(place);
  const call = change(place, "source-color", ["--value", "#123456"]);
  assert.equal(call.status, 2);
  assert.match(
    call.stderr,
    /does not hold its shape, so it is not changed: answers\.json\.answers\[0\]\.hold is "frozen"/,
  );
  assert.deepEqual(snapshot(place), before);
});

test("a core written at shape 1 is read as it is, and the move writes the part it changes at the shape it knows", () => {
  const { place } = builtCore();
  // As a plugin of shape 1 wrote it.
  for (const file of ["core.json", "answers.json", "blocks/index.json"]) {
    put(place, file, `${JSON.stringify({ ...read(place, file), version: 1 }, null, 2)}\n`);
  }
  assert.deepEqual(checked(place), { status: 0, problems: [] });
  assert.equal(change(place, "source-color", ["--value", "#123456"]).status, 0);
  assert.equal(read(place, "answers.json").version, CORE.version);
  assert.equal(read(place, "core.json").version, 1);
  assert.equal(read(place, "blocks/index.json").version, 1);
  assert.deepEqual(checked(place), { status: 0, problems: [] });
});

test("core --check finds a broken history and names the file and the place", () => {
  const { place } = builtCore();
  assert.equal(change(place, "source-color", ["--value", "#111111"]).status, 0);
  assert.equal(
    change(place, "source-color", ["--value", "#222222", "--on", "2026-11-27"]).status,
    0,
  );
  assert.equal(change(place, "failed-action", ["--hold", "default"]).status, 0);
  const answers = read(place, "answers.json");
  const at = answers.answers.findIndex((item) => item.id === "source-color");
  const rule = answers.answers.findIndex((item) => item.id === "failed-action");
  const broken = (edit, version = answers.version) => {
    const copy = path.join(empty(), "core");
    spawnSync("cp", ["-R", place, copy]);
    const data = JSON.parse(JSON.stringify(answers));
    edit(data.answers);
    put(copy, "answers.json", json({ ...data, version }));
    const result = checked(copy);
    assert.equal(result.status, 1, "the check is red");
    return result.problems;
  };
  const where = `answers.json.answers[${at}].history`;
  for (const [edit, expected, version] of [
    [
      (list) => {
        list[at].history[1].was.value = "#999999";
      },
      `${where}[1].was is not what ${where}[0] made the answer`,
    ],
    [
      (list) => {
        list[at].value = "#333333";
      },
      `${where}[1].became is not the answer's value and hold: the last change made the answer what it is`,
    ],
    [
      (list) => {
        list[at].history[0].became = list[at].history[0].was;
        list[at].history[1].was = list[at].history[0].was;
      },
      `${where}[0] changes nothing: was and became are the same`,
    ],
    [
      (list) => {
        delete list[at].history[0].why;
      },
      `${where}[0].why is missing`,
    ],
    [
      (list) => {
        list[at].history[0].why = " ";
      },
      `${where}[0].why is " ", which is not written as the contract says`,
    ],
    [
      (list) => {
        delete list[at].history[1].by;
      },
      `${where}[1].by is missing`,
    ],
    [
      (list) => {
        list[at].history[1].on = "2026-11-20";
      },
      `${where}[1].on is 2026-11-20, before 2026-11-26: a history goes forward`,
    ],
    [
      (list) => {
        list[at].history[0].on = "2026-11-01";
      },
      `${where}[0].on is 2026-11-01, before 2026-11-25: a history goes forward`,
    ],
    [
      (list) => {
        list[at].history[0].by = "ana@example.com";
      },
      `${where}[0].by holds an e-mail address: a core keeps names, never an address`,
    ],
    [
      (list) => {
        list[at].history[0].was.hold = "frozen";
      },
      `${where}[0].was.hold is "frozen", not one of locked, default`,
    ],
    [
      (list) => {
        list[at].history[0].guess = true;
      },
      `${where}[0].guess is not in the contract`,
    ],
    [
      (list) => {
        list[at].history = "changed";
      },
      `answers.json.answers[${at}].history is string, the contract says array`,
    ],
    [
      (list) => {
        list[rule].history[0].was.value = "another rule";
      },
      `answers.json.answers[${rule}].history[0] gives a rule another value: a rule's words are its row's`,
    ],
    [
      () => {},
      `answers.json.answers[${at}].history is of shape 2, and answers.json says shape 1`,
      1,
    ],
  ]) {
    const problems = broken(edit, version);
    assert.ok(problems.includes(expected), `${expected}\n in ${problems.join("\n")}`);
  }
});

test("from a separate working folder of git, the move reads the repository as from its main folder", () => {
  const { first, place } = builtCore();
  const work = path.join(empty(), "side");
  const added = git(first, "worktree", "add", "-q", "-b", "side", work);
  assert.equal(added.status, 0, added.stderr);
  const fromWork = JSON.parse(
    change(
      place,
      "focus-after-action",
      ["--from", work, "--hold", "default", "--json", "--dry-run"],
      {
        cwd: work,
      },
    ).stdout,
  );
  const fromMain = JSON.parse(
    change(place, "focus-after-action", [
      "--from",
      first,
      "--hold",
      "default",
      "--json",
      "--dry-run",
    ]).stdout,
  );
  assert.equal(fromWork.from, "guided-app");
  assert.deepEqual(fromWork, fromMain);
  // A core changed from inside the separate folder is the same core.
  const call = change(place, "source-color", ["--value", "#445566"], { cwd: work });
  assert.equal(call.status, 0, call.stderr);
  assert.equal(answerOf(place, "source-color").value, "#445566");
  assert.equal(git(first, "status", "--porcelain").stdout, "");
});

test("a core that is the root of its own git repository is changed like any other, and nothing is committed", () => {
  const first = repository("guided");
  const own = path.join(empty(), "family-core");
  mkdirSync(own);
  git(own, "init", "-q", "-b", "main");
  assert.equal(
    core([
      "--target",
      first,
      "--build",
      "--family",
      FAMILY,
      "--core",
      own,
      "--by",
      OWNER,
      "--on",
      BUILT_ON,
      "--lock",
      "source-color",
    ]).status,
    0,
  );
  git(own, "add", "-A");
  git(own, "commit", "-q", "-m", "the core");
  const head = git(own, "rev-parse", "HEAD").stdout;
  const call = change(own, "source-color", ["--value", "#778899"]);
  assert.equal(call.status, 0, call.stderr);
  assert.equal(git(own, "rev-parse", "HEAD").stdout, head);
  assert.equal(git(own, "status", "--porcelain").stdout, " M answers.json\n");
  // A core moved inside another repository's work tree is inside a repository, which may be one of
  // the family: refused, nothing written.
  const inside = path.join(first, "family-core");
  spawnSync("cp", ["-R", own, inside]);
  rmSync(path.join(inside, ".git"), { recursive: true, force: true });
  const before = snapshot(inside);
  const refused = change(inside, "source-color", ["--value", "#000000"]);
  assert.equal(refused.status, 2);
  assert.match(
    refused.stderr,
    /lies inside the git work tree of .*guided-app: the core is outside every repository/,
  );
  assert.deepEqual(snapshot(inside), before);
});

test("the move reaches no network", () => {
  const { first, place } = builtCore();
  const log = path.join(empty(), "network.log");
  const guarded = (args) =>
    spawnSync(execPath, ["--import", NO_NETWORK, CORE_COMMAND, ...args], {
      encoding: "utf8",
      env: { ...env, DESIGN_ASSEMBLY_NETWORK_LOG: log, DESIGN_ASSEMBLY_CORES: LIST },
    });
  const base = ["--core", place, "--by", OWNER, "--on", ON, "--why", WHY];
  assert.equal(guarded(["--change", "source-color", "--value", "#101010", ...base]).status, 0);
  assert.equal(guarded(["--change", "table-density", "--hold", "locked", ...base]).status, 0);
  const add = guarded([
    "--change",
    "focus-after-action",
    "--from",
    first,
    "--hold",
    "default",
    ...base,
  ]);
  assert.equal(add.status, 0, add.stderr);
  assert.ok(!existsSync(log) || readFileSync(log, "utf8") === "", "the network was reached");
});

// The files this slice adds under the plugin.
const SLICE_FILES = ["scripts/core-change.mjs", "tests/test-core-change.mjs"];

test("the files of the move name no family, no product and no repository", () => {
  const { place } = builtCore();
  assert.equal(change(place, "source-color", ["--value", "#202020"]).status, 0);
  // The family's name lands in the core's declaration alone.
  const holding = snapshot(place)
    .filter((line) => !line.endsWith("/"))
    .map((line) => line.split(" ")[0])
    .filter((file) => readFileSync(path.join(place, file), "utf8").includes(FAMILY));
  assert.deepEqual(holding, ["core.json"]);
  const beside = [env.DESIGN_ASSEMBLY_REFERENCE_LEDGER, env.DESIGN_ASSEMBLY_KIT]
    .filter(Boolean)
    .map((value) => path.basename(path.resolve(value)).toLowerCase())
    .filter((name) => name.length > 3);
  for (const file of SLICE_FILES) {
    const text = readFileSync(path.join(PLUGIN, file), "utf8");
    if (file !== "tests/test-core-change.mjs") assert.ok(!text.includes(FAMILY), file);
    for (const name of beside)
      assert.ok(!text.toLowerCase().includes(name), `${file} names ${name}`);
  }
});

test("the page of the contract says what a history is, and the shape it came with", () => {
  const page = readFileSync(path.join(PLUGIN, "references/contract.md"), "utf8");
  const section = page.slice(page.indexOf("## Not a ledger: the core of a family"));
  for (const word of ["`history`", "`was`", "`became`", `shape ${CORE.version}`, "shape 1"]) {
    assert.ok(section.includes(word), word);
  }
  const skill = readFileSync(path.join(PLUGIN, "skills/core/SKILL.md"), "utf8");
  for (const flag of ["--change", "--why", "--hold", "--from"])
    assert.ok(skill.includes(flag), flag);
});
