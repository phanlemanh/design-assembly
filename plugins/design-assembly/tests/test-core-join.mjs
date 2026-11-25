// The core of a family of products, slice 2 (spec 0016, criteria 1, 5, 6, 7, 8, 14, 15, 17, 20 and
// the member's side of 26): a repository declares its family and pins the core, with a copy kept
// inside it and compared by hash; the machine's list of cores and the one question about a family;
// the guide and adopt on a member; a repository that already has answers joins; the gate holds the
// locked answers; the commands run the same from a separate working folder of git; and a repository
// that stands alone is unchanged. Every repository and core is a fixture in a throwaway folder;
// nothing calls a model or the network, and each test keeps its own list of cores, never the list
// of the person running them.
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
  realpathSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { env, execPath } from "node:process";
import { after, test } from "node:test";
import { fileURLToPath } from "node:url";

import {
  coreMarkOf,
  lockedCoreProblems,
  PINNED_CORE,
} from "../templates/tools/design-assembly/contract.mjs";
import { pointRow } from "../templates/tools/design-assembly/ledger.mjs";
import { readPinnedSources } from "../templates/tools/design-assembly/sources-ledger.mjs";
import { withoutBlock } from "../templates/tools/design-assembly/theme.mjs";
import { guideQuestions } from "../scripts/core-marks.mjs";

import { passingFloor } from "./helpers/answered-roles.mjs";

const PLUGIN = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const ROOT = path.resolve(PLUGIN, "../..");
const SCRIPTS = path.join(PLUGIN, "scripts");
const NO_NETWORK = path.join(PLUGIN, "tests/helpers/no-network.mjs");
const LAYERS = JSON.parse(readFileSync(path.join(PLUGIN, "references/layers.json"), "utf8")).layers;
const LEDGER = "design/decisions.yaml";
const THEME = "design/theme.json";
const BUILT_ON = "2026-11-25";
const JOINED_ON = "2026-11-26";
// A family's name as a person gives it: the user's data, which only the core and the member's
// declaration may hold.
const FAMILY = "Quillon Harbour Suite";
const OWNER = "Ana Reyes";
const MEMBER = "Bo Tran";
const BRAND = "#0246ff";
// What a command says about a family of products; the guide's "neutral family" of colours is not it.
const FAMILY_WORDS = /family core|same family|of no family|family: /i;

const made = [];
after(() => made.forEach((dir) => rmSync(dir, { recursive: true, force: true })));
const empty = () => {
  const dir = realpathSync(mkdtempSync(path.join(tmpdir(), "design-core-join-")));
  made.push(dir);
  return dir;
};
const put = (dir, file, text) => {
  mkdirSync(path.dirname(path.join(dir, file)), { recursive: true });
  writeFileSync(path.join(dir, file), text);
};
const text = (dir, file) => readFileSync(path.join(dir, file), "utf8");
const json = (data) => `${JSON.stringify(data, null, 2)}\n`;
const read = (dir, file) => JSON.parse(text(dir, file));
const sha = (bytes) => createHash("sha256").update(bytes).digest("hex");
const git = (dir, ...args) =>
  spawnSync(
    "git",
    ["-C", dir, "-c", "user.name=Test", "-c", "user.email=test@example.invalid", ...args],
    { encoding: "utf8" },
  );

// A list of cores of a test's own: the file the commands are pointed at, which may not exist yet.
const listIn = () => path.join(empty(), "cores.json");
const run = (script, args, list, extra = {}) =>
  spawnSync(
    execPath,
    [...(extra.guard ? ["--import", NO_NETWORK] : []), path.join(SCRIPTS, script), ...args],
    {
      encoding: "utf8",
      env: { ...env, ...extra.env, DESIGN_ASSEMBLY_CORES: list },
    },
  );
const core = (args, list, extra) => run("core.mjs", args, list, extra);
const gate = (dir) =>
  spawnSync(execPath, [path.join(dir, "tools/design-assembly/check.mjs"), "--target", dir], {
    encoding: "utf8",
  });

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
      return [`${relative} ${sha(readFileSync(full))}`];
    });
}

// ---- repositories ------------------------------------------------------------------------------

// A repository with its design floor, the folder named so its name says what it is.
function floor(name = "member-app") {
  const dir = path.join(empty(), name);
  put(dir, "src/index.css", passingFloor(withoutBlock(text(ROOT, "src/index.css"))));
  put(dir, "Makefile", text(ROOT, "Makefile"));
  return dir;
}
const cache = {};
const copyOf = (kind, make) => {
  cache[kind] ??= make();
  const dir = path.join(empty(), path.basename(cache[kind]));
  cpSync(cache[kind], dir, { recursive: true });
  return dir;
};
// Adopted: the ledgers adopt writes from the floor, its gate and its tool. No list of cores.
const adopted = () =>
  copyOf("adopted", () => {
    const dir = floor();
    const done = run(
      "adopt.mjs",
      ["--target", dir, "--conformance-level", "AA", "--product-type", "application"],
      listIn(),
    );
    assert.ok([0, 1].includes(done.status), done.stderr);
    return dir;
  });
// The blueprint of the guide: every built layer decided, the guide's proposals.
function blueprint({ foundations = {}, patterns = { record_panel: "beside" } } = {}) {
  const choices = {
    context: { product_type: "application", conformance_level: "AA" },
    patterns,
    foundations: {
      source_color: BRAND,
      type_scale: "standard",
      spacing_unit: "4px",
      corner_radius: "small",
      text_font: "floor",
      heading_font: "text",
      ...foundations,
    },
  };
  const layers = Object.fromEntries(
    LAYERS.map((layer) => [
      layer.id,
      layer.built
        ? { status: "decided", source: "proposed", choice: choices[layer.id], why: "For the test." }
        : { status: "planned" },
    ]),
  );
  layers.foundations.confirmed = ["text_font", "heading_font"];
  layers.foundations.answered = {
    text_font: { by: OWNER, on: BUILT_ON },
    heading_font: { by: OWNER, on: BUILT_ON },
  };
  return { version: 1, status: "approved", layers };
}
// Built by the guide from a blueprint of its proposals.
const guided = () =>
  copyOf("guided", () => {
    const dir = floor();
    put(dir, "design/blueprint.json", json(blueprint()));
    const done = run("apply.mjs", ["--target", dir], listIn());
    assert.equal(done.status, 0, done.stderr);
    return dir;
  });
// No Makefile: only a stylesheet.
function noMakefile() {
  const dir = path.join(empty(), "member-app");
  put(dir, "src/index.css", passingFloor(withoutBlock(text(ROOT, "src/index.css"))));
  return dir;
}

// ---- a core ------------------------------------------------------------------------------------

const answer = (id, kind, value, hold, check) => ({
  id,
  question: `Which ${id} does the family keep?`,
  kind,
  value,
  hold,
  check,
  why: `Settled in first-app; made ${hold} on the lock-or-default sheet.`,
  by: OWNER,
  on: BUILT_ON,
  origin: { repository: "first-app", ledger: LEDGER, by: OWNER, on: "2026-11-20" },
});
// A core folder as `core --build` writes it, beside the repositories of the test.
function coreFolder({ colour = BRAND } = {}) {
  const dir = path.join(empty(), "quillon-core");
  put(
    dir,
    "core.json",
    json({
      version: 1,
      family: FAMILY,
      first: { repository: "first-app", read_on: BUILT_ON, commit: null },
      members: [],
      owner: { by: OWNER, on: BUILT_ON },
    }),
  );
  put(
    dir,
    "answers.json",
    json({
      version: 1,
      answers: [
        answer("source-color", "value", colour, "locked", null),
        answer("record-panel", "value", "beside", "locked", "tool:tools/design-assembly/check.mjs"),
        answer(
          "failed-action",
          "rule",
          "a failed action says what failed",
          "locked",
          "test:tests/failed-action.test.tsx",
        ),
        answer(
          "type-scale-values",
          "value",
          "standard",
          "default",
          "tool:tools/design-assembly/check.mjs",
        ),
        answer(
          "table-density",
          "rule",
          "whether the columns fit at their least width",
          "default",
          "tool:tools/design-assembly/check.mjs",
        ),
      ],
    }),
  );
  put(dir, "blocks/index.json", json({ version: 1, blocks: [] }));
  return dir;
}
const primaryOf = (dir) => read(dir, "design/tokens.json").color.primary.$value;
const join = (dir, place, list, more = []) =>
  core(
    ["--target", dir, "--join", "--core", place, "--by", MEMBER, "--on", JOINED_ON, ...more],
    list,
  );
const pinOf = (place) => sha(readFileSync(path.join(place, "answers.json"))).slice(0, 12);
const rowOf = (dir, id) => {
  const block = new RegExp(`  - id: ${id}\\n((?:    .*\\n?)*)`).exec(text(dir, LEDGER));
  return block ? block[1] : null;
};
const noteOf = (dir, id) => /note: "(.*)"/.exec(rowOf(dir, id) ?? "")?.[1] ?? null;

// ---- criterion 5: declare and pin -------------------------------------------------------------

test("a repository declares its family and pins the core: the row, the copy, its hashes and the member list", () => {
  const dir = adopted();
  const place = coreFolder({ colour: primaryOf(dir) });
  const list = listIn();
  const before = snapshot(dir);
  const coreBefore = snapshot(place);

  // Said first, written nothing: the dry run names the line it would write into the core folder.
  const dry = join(dir, place, list, ["--dry-run"]);
  assert.equal(dry.status, 0, dry.stderr);
  assert.match(
    dry.stdout,
    /in the core folder: .*core\.json: member-app joins on 2026-11-26, at pin [0-9a-f]{12} \(not written: --dry-run\)/,
  );
  assert.deepEqual(snapshot(dir), before);
  assert.deepEqual(snapshot(place), coreBefore);
  assert.ok(!existsSync(list), "a dry run writes no list");

  const done = join(dir, place, list);
  assert.equal(done.status, 0, done.stderr);
  const pin = pinOf(place);
  const source = read(dir, PINNED_CORE.file);
  assert.equal(source.kind, "core");
  assert.equal(source.id, "core");
  assert.equal(source.family, FAMILY);
  assert.deepEqual(source.joined, { by: MEMBER, on: JOINED_ON });
  // The copy is the core, byte for byte, and the pin holds the hash of each file.
  for (const file of ["core.json", "answers.json", "blocks/index.json"]) {
    const copy = readFileSync(path.join(dir, "design/core", file));
    assert.deepEqual(copy, readFileSync(path.join(place, file)), file);
    assert.equal(source.pin.files.find((entry) => entry.file === file).sha256, sha(copy), file);
  }
  // The core's list of members gains the repository, by its name, with its pin.
  assert.deepEqual(read(place, "core.json").members, [
    { repository: "member-app", joined: JOINED_ON, pin },
  ]);
  // Each row of an answer says it is inherited, and names the pin; the gate holds the locked ones.
  // A row the core brings says who answered it, as the decision sheet writes an answer.
  assert.equal(
    noteOf(dir, "source-color"),
    `inherited from the family core at ${pin}; answered by ${OWNER} on ${BUILT_ON}`,
  );
  assert.match(
    noteOf(dir, "failed-action"),
    new RegExp(`^inherited from the family core at ${pin}`),
  );
  assert.ok(read(dir, THEME).checks["ledger-shapes"].some((check) => check.kind === "family-core"));
  const green = gate(dir);
  assert.equal(green.status, 0, green.stderr);
  // The machine's list holds the core it pinned.
  assert.deepEqual(read(path.dirname(list), "cores.json").cores, [
    { family: FAMILY, path: realpathSync(place), on: JOINED_ON, how: "pinned" },
  ]);
  // The core is not a library: the readers of the sources ledger do not offer it.
  assert.deepEqual(
    readPinnedSources(dir).map((item) => item.id),
    [],
  );
  // Pinning again changes nothing of the member list but the pin.
  assert.equal(join(dir, place, list).status, 0);
  assert.equal(read(place, "core.json").members.length, 1);
});

test("joining on a branch keeps the gate green: the rows the core brings say who answered them", () => {
  const dir = adopted();
  const place = coreFolder({ colour: primaryOf(dir) });
  const list = listIn();
  git(dir, "init", "-q", "-b", "main");
  git(dir, "add", "-A");
  git(dir, "commit", "-q", "-m", "adopted");
  git(dir, "checkout", "-q", "-b", "join-the-family");
  assert.equal(join(dir, place, list).status, 0);
  const checked = gate(dir);
  assert.equal(checked.status, 0, checked.stderr);
  assert.doesNotMatch(checked.stderr, /decision-sheet/);
});

test("a copy that differs from its hashes is unreadable: the command says why, the repository inherits nothing", () => {
  const dir = adopted();
  const place = coreFolder({ colour: primaryOf(dir) });
  const list = listIn();
  assert.equal(join(dir, place, list).status, 0);
  const answers = path.join(dir, "design/core/answers.json");
  writeFileSync(answers, readFileSync(answers, "utf8").replace("beside", "over"));
  const before = snapshot(dir);

  for (const move of [["--settle", "--by", MEMBER], ["--inherit"]]) {
    const refused = core(["--target", dir, ...move], list);
    assert.equal(refused.status, 2, move.join(" "));
    assert.match(
      refused.stderr,
      /design\/core\/answers\.json is not the file the core was pinned with: its sha256 differs/,
    );
  }
  const status = run("status.mjs", ["--target", dir], list);
  assert.match(
    status.stdout,
    /its copy here cannot be read .* the repository inherits nothing and its own answers stand/,
  );
  const adopting = run("adopt.mjs", ["--target", dir, "--dry-run", "--json"], list);
  assert.ok(JSON.parse(adopting.stdout).unreadable.some((item) => item.id === "family-core"));
  // The gate names the copy, so a hand edit of it never lets a locked answer go.
  const red = gate(dir);
  assert.equal(red.status, 1);
  assert.match(red.stderr, /the copy of the family core in design\/core cannot be read/);
  assert.deepEqual(snapshot(dir), before);
});

// ---- criterion 17: the machine's list and the one question -------------------------------------

test("the machine's list: a core built is listed, and a repository that declares no family is asked one question", () => {
  const list = listIn();
  // A core built from a first repository is listed: an adopted one, whose colour a person recorded.
  const first = adopted();
  const recorded = run("adopt.mjs", ["--target", first, "--record", "source-color"], listIn());
  assert.ok([0, 1].includes(recorded.status), recorded.stderr);
  const place = path.join(path.dirname(first), "built-core");
  const built = core(
    [
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
    ],
    list,
  );
  assert.equal(built.status, 0, built.stderr);
  assert.match(built.stdout, /the machine's list of cores gains this core/);
  assert.deepEqual(
    read(path.dirname(list), "cores.json").cores.map((entry) => entry.how),
    ["built"],
  );

  // Case 1, a core that can be read: exactly one question, from the core command, adopt and the guide.
  const dir = floor("next-app");
  const before = snapshot(dir);
  const asked = core(["--target", dir, "--ask"], list);
  assert.equal(asked.status, 1, asked.stderr);
  assert.equal(asked.stdout.match(/one question:/g).length, 1);
  assert.match(asked.stdout, new RegExp(`Is this repository of the same family as ${FAMILY}`));
  const adopting = JSON.parse(
    run("adopt.mjs", ["--target", dir, "--dry-run", "--json"], list).stdout,
  );
  assert.deepEqual(adopting.person.filter((item) => item.id === "family").length, 1);
  const guide = run("apply.mjs", ["--target", dir, "--dry-run", "--json"], list);
  assert.equal(JSON.parse(guide.stdout).family_question.id, "family");
  assert.deepEqual(snapshot(dir), before);

  // Case 2, a no: kept on this machine, never in the repository; the repository is not asked again.
  const declined = core(["--target", dir, "--decline", "--on", JOINED_ON], list);
  assert.equal(declined.status, 0, declined.stderr);
  assert.deepEqual(snapshot(dir), before);
  assert.deepEqual(read(path.dirname(list), "cores.json").declined, [
    { repository: realpathSync(dir), on: JOINED_ON },
  ]);
  const again = core(["--target", dir, "--ask"], list);
  assert.equal(again.status, 0);
  assert.match(again.stdout, /no question about a family: a person said on 2026-11-26/);
  const adoptedAgain = JSON.parse(
    run("adopt.mjs", ["--target", dir, "--dry-run", "--json"], list).stdout,
  );
  assert.ok(!adoptedAgain.person.some((item) => item.id === "family"));

  // Case 3, no list: no question, no error, and no list made.
  const none = path.join(empty(), "cores.json");
  const quiet = core(["--target", dir, "--ask"], none);
  assert.equal(quiet.status, 0);
  assert.equal(quiet.stderr, "");
  assert.ok(!existsSync(none));

  // Case 4, a list that cannot be read: no question and no error; it is never written over.
  const broken = path.join(empty(), "cores.json");
  writeFileSync(broken, "{ not json");
  const blind = core(["--target", floor("other-app"), "--ask"], broken);
  assert.equal(blind.status, 0);
  assert.equal(blind.stderr, "");
  assert.match(blind.stdout, /the list of cores cannot be read/);
  const adoptBlind = run(
    "adopt.mjs",
    ["--target", floor("third-app"), "--dry-run", "--json"],
    broken,
  );
  assert.ok(!JSON.parse(adoptBlind.stdout).person.some((item) => item.id === "family"));
  assert.equal(core(["--target", dir, "--decline"], broken).status, 2);
  assert.equal(readFileSync(broken, "utf8"), "{ not json");
});

// ---- criterion 6: the guide on a member --------------------------------------------------------

test("the guide on a member: a locked answer is not asked, a default is filled in, the rest is asked; it says what it skipped", () => {
  const dir = floor();
  const place = coreFolder();
  const list = listIn();
  // The person starts the blueprint; the core then answers what it holds.
  const start = blueprint();
  delete start.layers.foundations.choice.source_color;
  delete start.layers.foundations.choice.type_scale;
  start.layers.patterns = { status: "pending" };
  put(dir, "design/blueprint.json", json(start));
  assert.equal(join(dir, place, list).status, 0);
  const pin = pinOf(place);

  const alone = guideQuestions(null);
  assert.equal(alone.filter((item) => item.state === "asked").length, 12);
  const inherited = core(["--target", dir, "--inherit", "--json"], list);
  assert.equal(inherited.status, 0, inherited.stderr);
  const result = JSON.parse(inherited.stdout);
  // Twelve questions alone; three fewer here: two locked, not asked, and one default, filled in.
  assert.equal(result.asked, 9);
  assert.deepEqual(
    result.questions
      .filter((item) => item.state !== "asked")
      .map((item) => [item.place, item.state]),
    [
      ["foundations.source_color", "inherited"],
      ["foundations.type_scale", "filled"],
      ["patterns.record_panel", "inherited"],
    ],
  );
  const written = read(dir, "design/blueprint.json").layers;
  assert.equal(written.foundations.choice.source_color, BRAND);
  assert.deepEqual(written.foundations.inherited.source_color, { pin, hold: "locked" });
  assert.equal(written.patterns.status, "decided");

  // The guide builds: each row the core answered says so, and the end of the run says who settled it.
  const applied = run("apply.mjs", ["--target", dir], list);
  assert.equal(applied.status, 0, applied.stderr);
  assert.equal(noteOf(dir, "source-color"), `inherited from the family core at ${pin}`);
  assert.equal(noteOf(dir, "type-scale-values"), `inherited from the family core at ${pin}`);
  const tail = applied.stdout.slice(applied.stdout.indexOf("answered by the family core"));
  assert.match(
    tail,
    new RegExp(
      `source-color: ${BRAND}; not asked; locked by ${OWNER} on ${BUILT_ON}, first settled in first-app by ${OWNER} on 2026-11-20`,
    ),
  );
  assert.match(tail, /type-scale-values: standard; filled in; default by/);
  assert.equal(gate(dir).status, 0, gate(dir).stderr);

  // A default changed needs its reason; with it, the row says changed, and the gate stays green.
  const changed = read(dir, "design/blueprint.json");
  changed.layers.foundations.choice.type_scale = "modular";
  changed.layers.foundations.choice.type_ratio = "major-third";
  put(dir, "design/blueprint.json", json(changed));
  const noReason = run("apply.mjs", ["--target", dir], list);
  assert.equal(noReason.status, 2);
  assert.match(noReason.stderr, /say why under changed\.type_scale/);
  changed.layers.foundations.changed = {
    type_scale: { why: "long reports read better on a larger scale", by: MEMBER, on: JOINED_ON },
  };
  put(dir, "design/blueprint.json", json(changed));
  const withReason = run("apply.mjs", ["--target", dir], list);
  assert.equal(withReason.status, 0, withReason.stderr);
  assert.equal(
    noteOf(dir, "type-scale-values"),
    `changed from the family core at ${pin}: long reports read better on a larger scale (by ${MEMBER} on ${JOINED_ON})`,
  );
  assert.equal(gate(dir).status, 0, gate(dir).stderr);

  // A locked answer is not the blueprint's to change: the guide refuses, and writes nothing.
  const locked = read(dir, "design/blueprint.json");
  locked.layers.foundations.choice.source_color = "#cc785c";
  put(dir, "design/blueprint.json", json(locked));
  const before = snapshot(dir);
  const refused = run("apply.mjs", ["--target", dir], list);
  assert.equal(refused.status, 2);
  assert.match(
    refused.stderr,
    /source_color is #cc785c, and the family core this repository pinned locks #0246ff/,
  );
  assert.deepEqual(snapshot(dir), before);
});

test("adopt on a member: the colour the core settled is not asked, and the report says who settled it", () => {
  const dir = floor();
  const list = listIn();
  // The floor's primary, as adopting reads it, is the colour the family locked.
  const probe = adopted();
  const place = coreFolder({ colour: primaryOf(probe) });
  assert.equal(join(dir, place, list).status, 0);
  const preview = JSON.parse(
    run(
      "adopt.mjs",
      [
        "--target",
        dir,
        "--dry-run",
        "--json",
        "--conformance-level",
        "AA",
        "--product-type",
        "application",
      ],
      list,
    ).stdout,
  );
  assert.ok(!preview.person.some((item) => item.id === "source-color"));
  assert.ok(preview.rows.some((row) => row.id === "source-color" && row.how === "recorded"));
  const done = run(
    "adopt.mjs",
    ["--target", dir, "--conformance-level", "AA", "--product-type", "application"],
    list,
  );
  assert.match(
    done.stdout,
    /answered by the family core .* not asked again:\n {2}source-color: .*; not asked; locked by Ana Reyes/,
  );
  assert.match(noteOf(dir, "source-color"), /^inherited from the family core at /);
  assert.ok(read(dir, THEME).checks["ledger-shapes"].some((check) => check.kind === "family-core"));
  assert.equal(gate(dir).status, 0, gate(dir).stderr);
});

// ---- criteria 7 and 8: a repository with answers joins, and the gate holds the locked ones -------

test("a repository with answers of its own joins: a differing locked answer becomes a question, nothing is written over", () => {
  const dir = adopted();
  const place = coreFolder();
  const list = listIn();
  const pin = pinOf(place);
  const kept = ["src/index.css", "design/tokens.json"].map((file) =>
    sha(readFileSync(path.join(dir, file))),
  );
  const done = join(dir, place, list);
  assert.equal(done.status, 1, done.stderr);
  assert.match(
    done.stdout,
    /source-color: #0246ff: differs from the locked answer: a question waits on the owner; this repository holds #/,
  );
  const question = read(dir, `design/waiting/core-source-color-${pin}.json`);
  assert.match(
    question.question,
    /Follow the core, or keep this repository's answer as an exception\?/,
  );
  // Nothing of the repository's values moved, and the row says nothing it does not hold.
  assert.deepEqual(
    ["src/index.css", "design/tokens.json"].map((file) => sha(readFileSync(path.join(dir, file)))),
    kept,
  );
  assert.equal(noteOf(dir, "source-color"), null);
  // Answers it holds the same, or not at all, are inherited.
  assert.match(noteOf(dir, "failed-action"), /^inherited from the family core at /);

  // Criterion 8, broken: the gate is red, naming the answer and the pin.
  const red = gate(dir);
  assert.equal(red.status, 1);
  assert.match(
    red.stderr,
    new RegExp(
      `source-color: design/tokens.json holds #[0-9a-f]{6}, and the family core this repository pinned locks #0246ff \\(pin ${pin}\\) with no exception recorded`,
    ),
  );

  // The owner keeps the repository's colour, with a reason: the exception is recorded, and the gate holds it.
  const answers = path.join(empty(), "answers.txt");
  writeFileSync(
    answers,
    `core-source-color-${pin} refuse the product keeps its grey for its regulator\n`,
  );
  const decided = run(
    "decide.mjs",
    ["--target", dir, "--answers", answers, "--by", OWNER, "--on", JOINED_ON],
    list,
  );
  // Other questions of the repository may still wait: the sheet ends with 1 then.
  assert.notEqual(decided.status, 2, decided.stderr);
  const settled = core(["--target", dir, "--settle", "--by", MEMBER, "--on", JOINED_ON], list);
  assert.equal(settled.status, 0, settled.stderr);
  assert.equal(
    noteOf(dir, "source-color"),
    `kept against the family core at ${pin}: the product keeps its grey for its regulator (by ${OWNER} on ${JOINED_ON}); answered by ${OWNER} on ${JOINED_ON}`,
  );
  assert.equal(gate(dir).status, 0, gate(dir).stderr);
  // Settling again changes nothing.
  const twice = core(["--target", dir, "--settle", "--by", MEMBER, "--dry-run"], list);
  assert.match(twice.stdout, /nothing to write/);
});

test("the gate: a locked value held otherwise is red without an exception; a default or a rule never is", () => {
  const pinned = {
    label: "0123456789ab",
    unreadable: null,
    answers: [
      { id: "source-color", kind: "value", hold: "locked", value: BRAND },
      { id: "type-scale-values", kind: "value", hold: "default", value: "standard" },
      {
        id: "failed-action",
        kind: "rule",
        hold: "locked",
        value: "a failed action says what failed",
      },
    ],
  };
  const values = {
    "source-color": { value: "oklch(0.51 0.274 263.68)", from: "design/blueprint.json" },
    "type-scale-values": { value: "modular 1.25", from: "design/blueprint.json" },
    "failed-action": { unread: "a rule" },
  };
  // The same colour in another notation is the same colour.
  assert.deepEqual(lockedCoreProblems({ pinned, values }, []), []);
  values["source-color"] = { value: "#cc785c", from: "design/tokens.json" };
  assert.equal(lockedCoreProblems({ pinned, values }, []).length, 1);
  const row = (note) => [{ id: "source-color", note }];
  assert.deepEqual(
    lockedCoreProblems(
      { pinned, values },
      row("kept against the family core at 0123456789ab: ours (by Bo Tran on 2026-11-26)"),
    ),
    [],
  );
  // An exception against another pin does not hold this one.
  assert.equal(
    lockedCoreProblems(
      { pinned, values },
      row("kept against the family core at ba9876543210: ours (by Bo Tran on 2026-11-26)"),
    ).length,
    1,
  );
  // A repository that declares no family has nothing here.
  assert.deepEqual(lockedCoreProblems(null, []), []);
  // A mark is read back as written, the rest of the note kept after it.
  assert.deepEqual(
    coreMarkOf(
      "inherited from the family core at 0123456789ab; answered by Ana Reyes on 2026-11-20",
    ),
    {
      mark: "inherited",
      pin: "0123456789ab",
      why: null,
      by: null,
      on: null,
      rest: "answered by Ana Reyes on 2026-11-20",
    },
  );
});

// ---- criterion 26: a locked answer and the check that holds it --------------------------------

test("a locked answer is held where the member has the check, and taking the check away lowers the count", () => {
  const dir = adopted();
  const place = coreFolder({ colour: primaryOf(dir) });
  const list = listIn();
  assert.equal(join(dir, place, list).status, 0);
  const count = () => JSON.parse(run("status.mjs", ["--target", dir, "--json"], list).stdout).core;
  const before = count();
  assert.equal(before.held, 0);
  assert.equal(before.not_held, 3);
  // The member's own test of the rule, at a path of its own: the row's id is the core's.
  put(dir, "tests/behaviour/failure.test.tsx", "// decision:failed-action\nexport {};\n");
  put(
    dir,
    LEDGER,
    pointRow(text(dir, LEDGER), "failed-action", "test:tests/behaviour/failure.test.tsx"),
  );
  const held = count();
  assert.equal(held.held, 1);
  assert.equal(held.not_held, 2);
  const status = run("status.mjs", ["--target", dir], list).stdout;
  assert.match(status, /locked answers: 3: 1 held by a check here, 2 inherited and not held/);
  // Broken: the check taken away, the answer is inherited and not held again.
  put(
    dir,
    LEDGER,
    text(dir, LEDGER).replace('    check: "test:tests/behaviour/failure.test.tsx"\n', ""),
  );
  const taken = count();
  assert.equal(taken.held, 0);
  assert.equal(taken.not_held, 3);
  assert.match(
    run("status.mjs", ["--target", dir], list).stdout,
    /not held here: failed-action: no row of this repository names a check for it/,
  );
});

// ---- criterion 20: a separate working folder ---------------------------------------------------

test("from a separate working folder of git, every move finds the same core and prints the same", () => {
  const dir = adopted();
  const place = coreFolder({ colour: primaryOf(dir) });
  const list = listIn();
  git(dir, "init", "-q", "-b", "main");
  git(dir, "add", "-A");
  git(dir, "commit", "-q", "-m", "adopted");
  assert.equal(join(dir, place, list).status, 0);
  git(dir, "add", "-A");
  git(dir, "commit", "-q", "-m", "joined");
  const work = path.join(path.dirname(dir), "member-work");
  assert.equal(git(dir, "worktree", "add", "-q", work).status, 0);

  const same = (args) => {
    const main = core(["--target", dir, ...args], list);
    const other = core(["--target", work, ...args], list);
    assert.equal(other.status, main.status, args.join(" "));
    assert.equal(other.stdout, main.stdout, args.join(" "));
  };
  same(["--join", "--core", place, "--by", MEMBER, "--on", JOINED_ON, "--dry-run"]);
  // The core named by the machine's list, the one it holds, is the same from both.
  same(["--join", "--by", MEMBER, "--on", JOINED_ON, "--dry-run"]);
  same(["--settle", "--by", MEMBER, "--on", JOINED_ON, "--dry-run"]);
  same(["--check", "--core", place]);
  same(["--ask"]);
  const status = (target) =>
    run("status.mjs", ["--target", target], list)
      .stdout.split("\n")
      .filter(
        (line) =>
          line.startsWith("family core") ||
          line.startsWith("  locked") ||
          line.startsWith("  not held"),
      );
  assert.deepEqual(status(work), status(dir));

  // A no said from the separate folder is the repository's: the main folder is not asked either.
  const fresh = path.join(empty(), "lone-app");
  mkdirSync(fresh);
  git(fresh, "init", "-q", "-b", "main");
  git(fresh, "commit", "-q", "--allow-empty", "-m", "first");
  const freshWork = path.join(path.dirname(fresh), "lone-work");
  git(fresh, "worktree", "add", "-q", freshWork);
  assert.equal(core(["--target", fresh, "--ask"], list).status, 1);
  assert.equal(core(["--target", freshWork, "--decline", "--on", JOINED_ON], list).status, 0);
  assert.equal(core(["--target", fresh, "--ask"], list).status, 0);
});

// ---- criterion 1: a repository that stands alone ----------------------------------------------

test("a repository that stands alone, on a machine with no core: nothing asked, nothing written, the same exit codes", () => {
  const kinds = {
    "no ledgers": () => floor(),
    adopted,
    guided,
    "no Makefile": noMakefile,
  };
  for (const [kind, make] of Object.entries(kinds)) {
    const outcomes = [];
    // Once with no list on this machine, once with a list nobody can read: the same in every way.
    for (const broken of [false, true]) {
      const dir = make();
      const list = listIn();
      if (broken) writeFileSync(list, "{ not json");
      const before = snapshot(dir);
      const calls = [
        ["status.mjs", ["--target", dir]],
        ["audit.mjs", ["--target", dir]],
        ["adopt.mjs", ["--target", dir, "--dry-run"]],
        ["apply.mjs", ["--target", dir, "--dry-run"]],
      ];
      const seen = calls.map(([script, args]) => {
        const done = run(script, args, list);
        assert.doesNotMatch(done.stdout, FAMILY_WORDS, `${kind}: ${script}`);
        return [script, done.status, done.stdout.replaceAll(dir, "<dir>")];
      });
      if (existsSync(path.join(dir, "tools/design-assembly/check.mjs"))) {
        const checked = gate(dir);
        assert.doesNotMatch(checked.stdout + checked.stderr, FAMILY_WORDS, kind);
        seen.push(["gate", checked.status, checked.stdout]);
      }
      assert.deepEqual(snapshot(dir), before, `${kind}: nothing written`);
      assert.equal(existsSync(list), broken, `${kind}: no list made`);
      // Adopting for real writes no file of a family and lays no check of one.
      const adopting = run(
        "adopt.mjs",
        ["--target", dir, "--conformance-level", "AA", "--product-type", "application"],
        list,
      );
      assert.ok(!existsSync(path.join(dir, PINNED_CORE.file)), kind);
      assert.ok(!existsSync(path.join(dir, "design/core")), kind);
      if (existsSync(path.join(dir, THEME))) {
        assert.ok(!text(dir, THEME).includes("family-core"), kind);
      }
      seen.push(["adopt", adopting.status, ""]);
      outcomes.push(seen);
    }
    assert.deepEqual(outcomes[1], outcomes[0], kind);
  }
});

// ---- criteria 14 and 15: no network, and the family's name stays the user's ---------------------

test("no move of a member reaches the network, and the family's name lands only in the core and the declaration", () => {
  const dir = adopted();
  const place = coreFolder();
  const list = listIn();
  const log = path.join(empty(), "network.log");
  const guarded = (args) =>
    core(args, list, { guard: true, env: { DESIGN_ASSEMBLY_NETWORK_LOG: log } });
  assert.equal(guarded(["--target", dir, "--join", "--core", place, "--by", MEMBER]).status, 1);
  assert.equal(guarded(["--target", dir, "--settle", "--by", MEMBER, "--dry-run"]).status, 1);
  assert.equal(guarded(["--target", dir, "--ask"]).status, 0);
  assert.equal(guarded(["--target", floor("lone-app"), "--decline"]).status, 0);
  assert.ok(!existsSync(log) || readFileSync(log, "utf8") === "", "the network was reached");

  // In the member, the name is in its declaration and its copy of the core, and nowhere else.
  const holding = snapshot(dir)
    .filter((line) => !line.endsWith("/"))
    .map((line) => line.split(" ")[0])
    .filter((file) => readFileSync(path.join(dir, file), "utf8").includes(FAMILY));
  assert.deepEqual(holding.sort(), ["design/core/core.json", PINNED_CORE.file]);
  // The plugin's files of this slice name no family.
  for (const file of [
    "scripts/core-join.mjs",
    "scripts/core-join-call.mjs",
    "scripts/core-list.mjs",
    "scripts/core-marks.mjs",
  ]) {
    const words = readFileSync(path.join(PLUGIN, file), "utf8");
    assert.ok(!words.includes(FAMILY) && !words.toLowerCase().includes("quillon"), file);
  }
});

test("upgrade lays the check of locked answers on a member that lacks it", () => {
  const dir = adopted();
  const place = coreFolder({ colour: primaryOf(dir) });
  const list = listIn();
  assert.equal(join(dir, place, list).status, 0);
  const theme = read(dir, THEME);
  theme.checks["ledger-shapes"] = theme.checks["ledger-shapes"].filter(
    (check) => check.kind !== "family-core",
  );
  put(dir, THEME, json(theme));
  const plan = run("upgrade.mjs", ["--target", dir, "--dry-run", "--json"], list);
  assert.ok(
    JSON.parse(plan.stdout).checks_added.some((item) => item.kind === "family-core"),
    plan.stdout,
  );
  // One that stands alone gains no such check.
  const alone = run("upgrade.mjs", ["--target", adopted(), "--dry-run", "--json"], list);
  assert.ok(!JSON.parse(alone.stdout).checks_added.some((item) => item.kind === "family-core"));
});
