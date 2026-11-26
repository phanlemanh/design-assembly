// Item 7.5 of the plan (spec 0016, criterion 16): on the way of a second repository into its family,
// `adopt` asks the family question first and holds back every question a core this machine knows
// answers; once the repository joined, no question the core answers is put to the person; and the
// question about a locked answer the repository holds otherwise is on the decision sheet after the
// one adopt run that laid the value, written by the code the join uses, under the same id. A
// repository that stands alone is asked what plugin 0.68.0 asked it. Every repository and core is a
// fixture in a throwaway folder, and each test keeps its own list of cores.
import "./helpers/own-cores.mjs";
import assert from "node:assert/strict";
import { existsSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { after, test } from "node:test";

import {
  adopted,
  answer,
  BRAND,
  cleanup,
  core,
  coreFolder,
  empty,
  FAMILY,
  floor,
  gate,
  join,
  JOINED_ON,
  json,
  MEMBER,
  noteOf,
  OWNER,
  pinOf,
  PLUGIN,
  primaryOf,
  put,
  read,
  run,
  snapshot,
} from "./helpers/core-family.mjs";
import { listOf } from "./helpers/known-core.mjs";
import { KINDS, MACHINES, observe, readRecord } from "./helpers/stand-alone.mjs";

after(cleanup);

const VERSION = JSON.parse(
  readFileSync(path.join(PLUGIN, ".claude-plugin/plugin.json"), "utf8"),
).version;
const WAITING = "design/waiting";
const skill = (name) => readFileSync(path.join(PLUGIN, "skills", name, "SKILL.md"), "utf8");
const preview = (dir, list, more = []) =>
  run("adopt.mjs", ["--target", dir, "--dry-run", ...more], list);
const previewData = (dir, list, more = []) =>
  JSON.parse(preview(dir, list, ["--json", ...more]).stdout);
const adopt = (dir, list, more = []) =>
  run(
    "adopt.mjs",
    ["--target", dir, "--conformance-level", "AA", "--product-type", "application", ...more],
    list,
  );
const idsOf = (data) => data.person.map((item) => item.id);
const waitingIn = (dir) =>
  existsSync(path.join(dir, WAITING)) ? readdirSync(path.join(dir, WAITING)).sort() : [];
// A core folder of another family, holding the answers given.
function otherCore(name, family, answers) {
  const dir = coreFolder({ name });
  put(dir, "core.json", json({ ...read(dir, "core.json"), family }));
  put(dir, "answers.json", json({ version: 1, answers }));
  return dir;
}
// The questions of a preview that a core answers: an item whose id is an answer of the core and
// that is not the question about a difference, which names its file of the decision sheet.
const askedAgain = (data, place) => {
  const answered = new Set(read(place, "answers.json").answers.map((item) => item.id));
  return data.person.filter((item) => answered.has(item.id) && !item.question);
};

// ---- point 1: a repository that stands alone ---------------------------------------------------

for (const kind of Object.keys(KINDS)) {
  for (const machine of Object.keys(MACHINES)) {
    test(`a repository of no family is asked what plugin 0.68.0 asked it: ${kind}, ${machine}`, () => {
      const before = readRecord().kinds[kind][machine];
      const dir = KINDS[kind]();
      const now = observe(dir, MACHINES[machine](dir), VERSION);
      for (const form of ["text", "json"]) {
        assert.equal(now[form].exit, before[form].exit, `${form}: exit`);
        assert.equal(now[form].out, before[form].out, `${form}: output`);
        assert.equal(now[form].err, before[form].err, `${form}: errors`);
      }
    });
  }
}

// ---- point 2: the family question first, and what a known core answers held back ---------------

test("before the family answer, the family question is first and what the known core answers is held back", () => {
  const dir = floor();
  const place = coreFolder();
  const list = listOf(place);
  const before = snapshot(dir);

  const data = previewData(dir, list);
  // The family question first; the core answers the colour, so the colour is not asked; what the
  // core does not answer is asked as before.
  assert.deepEqual(idsOf(data), ["family", "conformance-level", "product-type"]);
  assert.deepEqual(data.held_back, [
    {
      id: "source-color",
      answered_by: [{ family: FAMILY, core: place, hold: "locked" }],
      why: `the family core ${FAMILY} answers it (locked): not asked if this repository joins that family, asked as before if it joins none`,
    },
  ]);
  // The questions left are worded as on a repository of no family.
  const alone = readRecord().kinds["no ledgers"]["no list"];
  const asked = Object.fromEntries(
    JSON.parse(alone.json.out).person.map((item) => [item.id, item]),
  );
  for (const id of ["conformance-level", "product-type"]) {
    assert.deepEqual(
      data.person.find((item) => item.id === id),
      asked[id],
    );
  }

  const said = preview(dir, list);
  assert.equal(said.status, 1);
  const lines = said.stdout.split("\n");
  const at = lines.indexOf("needs a person:");
  assert.match(lines[at + 1], /^ {2}family: Is this repository of the same family as /);
  assert.match(lines[at + 2], /^ {2}conformance-level: /);
  assert.match(lines[at + 3], /^ {2}product-type: /);
  const held = lines.indexOf(
    "held back until the family question is answered (put that one question to the person first, alone, then run this again):",
  );
  assert.ok(held > at, said.stdout);
  assert.equal(
    lines[held + 1],
    `  source-color: the family core ${FAMILY} answers it (locked): not asked if this repository joins that family, asked as before if it joins none`,
  );
  // The colour's own question is nowhere in what is printed.
  assert.doesNotMatch(said.stdout, /--record source-color/);
  assert.deepEqual(snapshot(dir), before);
});

test("a default of the core is held back as a locked answer is, and what no core answers never is", () => {
  const dir = floor();
  // The core holds the colour as a default.
  const defaults = otherCore("default-core", "Fam Default", [
    answer("source-color", "value", BRAND, "default", null),
  ]);
  const data = previewData(dir, listOf(defaults));
  assert.deepEqual(idsOf(data), ["family", "conformance-level", "product-type"]);
  assert.deepEqual(
    data.held_back.map((item) => [item.id, item.answered_by[0].hold]),
    [["source-color", "default"]],
  );

  // A core that does not answer the colour: nothing is held back, and the colour is asked as on a
  // repository of no family, after the family question.
  const silent = otherCore("silent-core", "Fam Silent", [
    answer("record-panel", "value", "beside", "locked", null),
  ]);
  const list = listOf(silent);
  const plain = previewData(dir, list);
  assert.deepEqual(idsOf(plain), ["family", "conformance-level", "source-color", "product-type"]);
  assert.deepEqual(plain.held_back, []);
  assert.doesNotMatch(preview(dir, list).stdout, /held back until the family question/);
});

test("with two cores known, a question either of them answers is held back, and each line names the core that answers it", () => {
  const dir = floor();
  const one = otherCore("one-core", "Fam One", [
    answer("source-color", "value", BRAND, "locked", null),
  ]);
  const two = otherCore("two-core", "Fam Two", [
    answer("record-panel", "value", "beside", "locked", null),
  ]);
  const list = listOf(one, two);
  const data = previewData(dir, list);
  assert.deepEqual(idsOf(data), ["family", "conformance-level", "product-type"]);
  assert.deepEqual(data.held_back, [
    {
      id: "source-color",
      answered_by: [{ family: "Fam One", core: one, hold: "locked" }],
      why: "the family core Fam One answers it (locked): not asked if this repository joins that family, asked as before if it joins none or another",
    },
  ]);
});

test("after a no, the questions held back are asked as on a repository of no family", () => {
  const dir = floor();
  const list = listOf(coreFolder());
  assert.ok(previewData(dir, list).held_back.length > 0);
  assert.equal(core(["--target", dir, "--decline", "--on", JOINED_ON], list).status, 0);
  const data = previewData(dir, list);
  const alone = JSON.parse(readRecord().kinds["no ledgers"]["no list"].json.out);
  assert.deepEqual(data.person, alone.person);
  assert.equal(data.held_back, undefined);
});

// ---- point 3: the skills -----------------------------------------------------------------------

test("the skills put the family question alone first, and say what comes back after it", () => {
  const adoptSkill = skill("adopt");
  // The family question is put alone, before the rest of what needs a person.
  assert.match(
    adoptSkill,
    /When `needs a person` lists `family`[^#]*Put that one question to the person alone, before anything\s+else of `needs a person`/,
  );
  assert.match(adoptSkill, /Never put a held-back question to the person/);
  // The rest is asked together only once the family question is gone.
  assert.match(adoptSkill, /Once no `family` line is left, ask together, in one message/);
  assert.doesNotMatch(adoptSkill, /Ask together, in one message: what `needs a person` lists/);
  // The member's steps of the core skill agree: after the join, the preview is run again, and no
  // second join is needed for the question about a difference.
  const coreSkill = skill("core");
  assert.match(coreSkill, /Run the preview of `adopt` again/);
  assert.match(coreSkill, /asks the same question, under the same id, in that run/);
  assert.match(coreSkill, /Never join\s+a second time to get the question/);
  // The guide asks it before any layer.
  assert.match(skill("new"), /before any question of a layer/);
});

// ---- point 4: joined with no ledgers, then adopted ---------------------------------------------

test("joined with no ledgers, then adopted: the question about the locked colour is on the sheet after that one run", () => {
  const dir = floor();
  const place = coreFolder();
  const list = listOf(place);
  const pin = pinOf(place);
  const id = `core-source-color-${pin}`;
  const file = `${WAITING}/${id}.json`;

  // The order the skill gives: the family answer, the join, then adopt.
  assert.equal(join(dir, place, list).status, 0);
  assert.deepEqual(waitingIn(dir), []);

  // The preview says the question is among the files it would write, and writes nothing.
  const shown = preview(dir, list, ["--conformance-level", "AA", "--product-type", "application"]);
  assert.match(shown.stdout, new RegExp(`create {4}${file}`));
  assert.match(
    shown.stdout,
    new RegExp(
      `source-color: --primary is .*, and the family core this repository pinned locks ${BRAND}: follow the core, or keep this colour as an exception with its reason\\. The question is put on the decision sheet with the files below \\(${file}\\)`,
    ),
  );
  assert.deepEqual(waitingIn(dir), []);

  const done = adopt(dir, list);
  assert.equal(done.status, 1, done.stderr);
  // What adopt says of the question is true when it is printed: the file is there.
  assert.doesNotMatch(done.stdout, /core --join asked it/);
  assert.match(done.stdout, new RegExp(`\\(${file}\\)`));
  assert.deepEqual(waitingIn(dir), [`${id}.json`]);

  // The same question the join asks of a repository that held the colour when it joined.
  const late = adopted();
  const lateDone = join(late, place, listOf(place));
  assert.equal(lateDone.status, 1, lateDone.stderr);
  const [mine, theirs] = [dir, late].map((repository) => read(repository, file));
  for (const key of ["id", "question", "recommendation", "basis"]) {
    assert.deepEqual(mine[key], theirs[key], key);
  }

  // The gate's red row names the question that waits.
  const red = gate(dir);
  assert.equal(red.status, 1);
  assert.match(
    red.stderr,
    new RegExp(
      `source-color: design/tokens.json holds #[0-9a-f]{6}, and the family core this repository pinned locks ${BRAND} \\(pin ${pin}\\) with no exception recorded: the question ${id} waits on the decision sheet`,
    ),
  );

  // Nothing writes the question twice: adopt again, the join again, the settling.
  const kept = snapshot(dir).filter((line) => line.startsWith(WAITING));
  const again = adopt(dir, list);
  assert.equal(again.status, 1, again.stderr);
  assert.match(again.stdout, new RegExp(`The question waits on the decision sheet \\(${id}\\)`));
  const rejoined = join(dir, place, list);
  assert.equal(rejoined.status, 1, rejoined.stderr);
  assert.match(rejoined.stdout, new RegExp(`question ${id}`));
  const settled = core(["--target", dir, "--settle", "--by", MEMBER, "--on", JOINED_ON], list);
  assert.notEqual(settled.status, 2, settled.stderr);
  assert.deepEqual(
    snapshot(dir).filter((line) => line.startsWith(WAITING)),
    kept,
  );

  // The owner keeps the colour with a reason: the gate is green, and adopt asks nothing of it.
  const answers = path.join(empty(), "answers.txt");
  writeFileSync(answers, `${id} refuse the product keeps its own colour\n`);
  const decided = run(
    "decide.mjs",
    ["--target", dir, "--answers", answers, "--by", OWNER, "--on", JOINED_ON],
    list,
  );
  assert.notEqual(decided.status, 2, decided.stderr);
  assert.equal(
    core(["--target", dir, "--settle", "--by", MEMBER, "--on", JOINED_ON], list).status,
    0,
  );
  assert.equal(gate(dir).status, 0, gate(dir).stderr);
  assert.ok(!idsOf(previewData(dir, list)).includes("source-color"));
});

test("a member with no question on the sheet: the gate's red row reads as before", () => {
  const dir = floor();
  const place = coreFolder();
  const list = listOf(place);
  assert.equal(join(dir, place, list).status, 0);
  assert.equal(adopt(dir, list).status, 1);
  // The question taken away by hand: the row says what it said before item 7.5.
  const pin = pinOf(place);
  const gone = path.join(dir, WAITING, `core-source-color-${pin}.json`);
  writeFileSync(gone, readFileSync(gone, "utf8").replace(`core-source-color-${pin}`, "moved"));
  const red = gate(dir);
  assert.match(
    red.stderr,
    /with no exception recorded: follow the core, or keep it as an exception with its reason \(core --settle\)/,
  );
});

test("joined with no ledgers, then adopted: a default the repository holds otherwise is its own answer from before it joined, and nothing is asked", () => {
  const dir = floor();
  const place = otherCore("default-core", "Fam Default", [
    answer("source-color", "value", BRAND, "default", null),
  ]);
  const list = listOf(place);
  const pin = pinOf(place);
  assert.equal(join(dir, place, list).status, 0);
  const shown = previewData(dir, list, [
    "--conformance-level",
    "AA",
    "--product-type",
    "application",
  ]);
  assert.deepEqual(askedAgain(shown, place), []);
  assert.ok(!idsOf(shown).includes("source-color"));
  const done = adopt(dir, list);
  assert.equal(done.status, 0, done.stdout + done.stderr);
  assert.deepEqual(waitingIn(dir), []);
  assert.equal(
    noteOf(dir, "source-color"),
    `changed from the family core at ${pin}: the repository's own answer from before it joined the family (by ${MEMBER} on ${JOINED_ON}); answered by ${MEMBER} on ${JOINED_ON}`,
  );
  assert.equal(gate(dir).status, 0, gate(dir).stderr);
  // The same mark the join writes on a repository that held the colour when it joined.
  const late = adopted();
  assert.equal(join(late, place, listOf(place)).status, 0);
  assert.equal(noteOf(late, "source-color"), noteOf(dir, "source-color"));
});

// ---- point 5: after the join, nothing the core answers is asked --------------------------------

test("after the join, the preview puts no question the core answers to the person", () => {
  // The repository holds another colour than the core locks: the one line about the colour is the
  // question about the difference, and names its file of the decision sheet.
  const dir = floor();
  const place = coreFolder();
  const list = listOf(place);
  assert.equal(join(dir, place, list).status, 0);
  const data = previewData(dir, list);
  assert.equal(askedAgain(data, place).length, 0);
  assert.deepEqual(idsOf(data), ["conformance-level", "source-color", "product-type"]);
  assert.equal(
    data.person.find((item) => item.id === "source-color").question,
    `core-source-color-${pinOf(place)}`,
  );
  assert.equal(data.held_back, undefined);
  assert.equal(data.family_question, undefined);

  // The repository holds the colour the core locks: the colour is not on the list at all.
  const same = floor();
  const samePlace = coreFolder({ colour: primaryOf(adopted()) });
  const sameList = listOf(samePlace);
  assert.equal(join(same, samePlace, sameList).status, 0);
  const sameData = previewData(same, sameList);
  assert.equal(askedAgain(sameData, samePlace).length, 0);
  assert.deepEqual(idsOf(sameData), ["conformance-level", "product-type"]);
});

test("on a member, status and the decision sheet ask the core's question about the colour, not the colour again", () => {
  const dir = floor();
  const place = coreFolder();
  const list = listOf(place);
  assert.equal(join(dir, place, list).status, 0);
  assert.equal(adopt(dir, list).status, 1);
  const id = `core-source-color-${pinOf(place)}`;
  const sheet = run("decide.mjs", ["--target", dir], list);
  assert.match(sheet.stdout, new RegExp(`^ {2}${id}: `, "m"));
  assert.doesNotMatch(sheet.stdout, /^ {2}source-color: /m);
  assert.doesNotMatch(sheet.stdout, /--record source-color/);
  const said = run("status.mjs", ["--target", dir], list);
  assert.doesNotMatch(said.stdout, /--record source-color/);
  assert.doesNotMatch(said.stdout, /\d+\. source-color: /);
});
