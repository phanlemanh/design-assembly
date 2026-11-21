// The screen brief (specification 0010, slice 2): what an open slot asks. An open slot gives the
// very call of the decision sheet that asks it, with a recommendation and what it rests on; with
// --queue each open slot becomes one new file of the waiting list, all or nothing; a slot whose
// question waits is asked, and one the owner answered is settled by that answer, with the name and
// the day the answer carries. The rules page points a builder at the sheet, and the socket board
// names the command as the plug of the screen brief socket. Each test runs the commands on a
// throwaway repository.
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
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { env, execPath } from "node:process";
import { after, test } from "node:test";
import { fileURLToPath, pathToFileURL } from "node:url";

import { readCatalogue } from "../scripts/brief-slots.mjs";
import { EXIT } from "../scripts/command.mjs";
import { BASES } from "../scripts/document.mjs";
import {
  readWaiting,
  WAITING_FOLDER,
  WAITING_LIST,
} from "../templates/tools/design-assembly/waiting.mjs";
import { BUILT, briefRepository, DROPS, PLANNED } from "./helpers/brief-repo.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const PLUGIN = path.resolve(HERE, "..");
const BRIEF = path.join(PLUGIN, "scripts/brief.mjs");
const DECIDE = path.join(PLUGIN, "scripts/decide.mjs");
const FIXED_DAY = pathToFileURL(path.join(HERE, "helpers/fixed-day.mjs")).href;
const CATALOGUE = readCatalogue();
const OWNER = "Owner Of The Sample";
const ANSWERED = "2026-12-01";

const removals = [];
after(() => removals.forEach((remove) => remove()));
const folder = () => {
  const dir = mkdtempSync(path.join(tmpdir(), "design-brief-asks-"));
  removals.push(() => rmSync(dir, { recursive: true, force: true }));
  return dir;
};
const sample = (change) => {
  const made = briefRepository(change);
  removals.push(made.remove);
  return made.dir;
};
const run = (args, options = {}) =>
  spawnSync(execPath, [BRIEF, ...args], { encoding: "utf8", ...options });
const sheet = (dir, id = BUILT, more = []) => {
  const called = run([id, "--target", dir, "--json", ...more]);
  assert.ok([EXIT.done, EXIT.work].includes(called.status), called.stderr);
  return JSON.parse(called.stdout);
};
const slotOf = (result, id) => result.slots.find((slot) => slot.id === id);
const itemOf = (screen, slot) => `screen:${screen}:${slot}`;

// Every file of a repository with the hash of its bytes, the folder of git left out.
function tree(dir, at = "") {
  return readdirSync(path.join(dir, at))
    .sort()
    .filter((name) => !(at === "" && name === ".git"))
    .flatMap((name) => {
      const relative = path.posix.join(at, name);
      const full = path.join(dir, relative);
      if (lstatSync(full).isDirectory()) return [`${relative}/`, ...tree(dir, relative)];
      return [`${relative} ${createHash("sha256").update(readFileSync(full)).digest("hex")}`];
    });
}
// The files of a tree, without the folders.
const filesOf = (dir) => tree(dir).filter((line) => !line.endsWith("/"));

// The owner's answers, given through the decision sheet's own command.
function answer(dir, lines, { by = OWNER, on = ANSWERED } = {}) {
  const file = path.join(folder(), "answers.txt");
  writeFileSync(file, `${lines.join("\n")}\n`);
  const called = spawnSync(
    execPath,
    [DECIDE, "--target", dir, "--answers", file, "--by", by, "--on", on, "--json"],
    { encoding: "utf8" },
  );
  assert.ok([EXIT.done, EXIT.work].includes(called.status), called.stderr);
  return JSON.parse(called.stdout);
}

test("criterion 4: an open slot gives the very call of the decision sheet that asks it, and nothing is written", () => {
  const dir = sample();
  const before = tree(dir);
  const planned = sheet(dir, PLANNED);
  // The planned screen names an action and an entity the data model lacks: slot 10 is open. Slots
  // 11 and 12 of a planned screen are open until they are asked.
  assert.deepEqual(
    planned.open.map((slot) => slot.id),
    ["model-changes", "navigation", "touched-screens"],
  );
  assert.deepEqual(planned.asked, []);
  for (const open of planned.open) {
    const slot = slotOf(planned, open.id);
    assert.equal(slot.state, "open");
    assert.deepEqual(open.ask, slot.ask);
    assert.equal(open.call, slot.call);
    const { ask, call } = open;
    assert.equal(ask.item, itemOf(PLANNED, open.id));
    assert.equal(ask.id, `screen-${PLANNED}-${open.id}`);
    assert.ok(ask.question.includes(PLANNED), ask.question);
    assert.ok(ask.recommendation.trim().length > 0);
    // What the recommendation rests on: a standard, a principle or a measurement, and what the
    // sheet read of this repository.
    assert.ok(ask.basis.kind in BASES, open.id);
    for (const reason of slot.why) assert.ok(ask.basis.text.includes(reason), reason);
    assert.equal(typeof ask.hard_to_undo, "boolean");
    for (const said of [
      `'${DECIDE}'`,
      `--target '${dir}'`,
      "--ask ",
      "--recommend ",
      "--because ",
      ask.hard_to_undo ? "--hard-to-undo" : "--easy-to-undo",
      `--item '${ask.item}'`,
      `--id '${ask.id}'`,
    ]) {
      assert.ok(call.includes(said), `${open.id}: ${said}`);
    }
  }
  const model = slotOf(planned, "model-changes");
  assert.match(model.ask.question, /refundOrder/);
  assert.match(model.ask.question, /Return/);
  // The two slots no ledger holds rest on what the sheet measured in the ledgers that are there.
  assert.match(slotOf(planned, "navigation").ask.basis.text, /2 screens.*\/archive/);
  assert.match(slotOf(planned, "touched-screens").ask.basis.text, /other screen/);
  // A slot that is settled asks nothing.
  for (const slot of planned.slots.filter((item) => item.state === "settled")) {
    assert.equal(slot.ask, undefined, slot.id);
    assert.equal(slot.call, undefined, slot.id);
  }
  // A person at a terminal is given the same calls, and told nothing was written.
  const shown = run([PLANNED, "--target", dir]);
  assert.equal(shown.status, EXIT.work);
  for (const open of planned.open) {
    assert.ok(shown.stdout.includes(open.call), open.id);
    assert.ok(shown.stdout.includes(open.ask.recommendation), open.id);
  }
  assert.match(shown.stdout, /nothing was written: run again with --queue to put 3 questions/);
  assert.deepEqual(tree(dir), before);
});

test("criterion 4: the printed call, run as it stands, writes the very file --queue writes", () => {
  const dir = sample();
  const twin = folder();
  cpSync(dir, twin, { recursive: true });
  const { open } = sheet(dir, PLANNED);
  const day = "2026-11-21";
  const queued = spawnSync(
    execPath,
    ["--import", FIXED_DAY, BRIEF, PLANNED, "--target", dir, "--queue"],
    {
      encoding: "utf8",
      env: { ...env, DESIGN_ASSEMBLY_TEST_DAY: day },
    },
  );
  assert.equal(queued.status, EXIT.work, queued.stderr);
  for (const slot of open) {
    const call = slot.call.replace(`--target '${dir}'`, `--target '${twin}'`);
    const done = spawnSync("sh", ["-c", `${call} --on ${day}`], { encoding: "utf8" });
    assert.equal(done.status, EXIT.work, done.stderr);
    const file = `${WAITING_FOLDER}/${slot.ask.id}.json`;
    assert.equal(
      readFileSync(path.join(twin, file), "utf8"),
      readFileSync(path.join(dir, file), "utf8"),
      slot.id,
    );
  }
  assert.deepEqual(tree(twin), tree(dir));
});

test("criterion 5: --queue writes one new file of the waiting list for each open slot and nothing else, and the slot is then asked", () => {
  const dir = sample();
  const before = filesOf(dir);
  const open = sheet(dir, PLANNED).open;
  const called = run([PLANNED, "--target", dir, "--queue", "--json"]);
  assert.equal(called.status, EXIT.work, called.stderr);
  const result = JSON.parse(called.stdout);
  const made = open.map((slot) => `${WAITING_FOLDER}/${slot.ask.id}.json`);
  assert.deepEqual(
    result.files,
    made.map((file) => ({ path: file, change: "create" })),
  );
  // Only new files, and only of the waiting list: every file that was there is as it was.
  const now = filesOf(dir);
  assert.deepEqual(
    now.filter((line) => !before.includes(line)).map((line) => line.split(" ")[0]),
    [...made].sort(),
  );
  assert.deepEqual(
    before.filter((line) => !now.includes(line)),
    [],
  );
  // The list reads each one as a question about that slot of that screen.
  const rows = readWaiting(dir).rows;
  assert.deepEqual(rows.map((row) => row.item).sort(), open.map((slot) => slot.ask.item).sort());
  for (const slot of open) {
    const row = rows.find((item) => item.item === slot.ask.item);
    assert.equal(row.id, slot.ask.id);
    assert.equal(row.question, slot.ask.question);
    assert.equal(row.recommendation, slot.ask.recommendation);
    assert.equal(row.basis, slot.ask.basis.text);
    assert.equal(row.hard_to_undo, slot.ask.hard_to_undo);
    assert.equal(row.answer, undefined);
  }
  // The answer of the run that queued, and of the run after, say the slots are asked.
  for (const told of [result, sheet(dir, PLANNED)]) {
    assert.deepEqual(told.open, []);
    assert.deepEqual(
      told.asked.map((slot) => slot.id),
      open.map((slot) => slot.id),
    );
    for (const slot of told.asked) {
      const first = open.find((item) => item.id === slot.id);
      assert.equal(slotOf(told, slot.id).state, "asked");
      assert.deepEqual(slot.asked, {
        id: first.ask.id,
        file: `${WAITING_FOLDER}/${first.ask.id}.json`,
        question: first.ask.question,
        recommendation: first.ask.recommendation,
        basis: first.ask.basis.text,
        hard_to_undo: first.ask.hard_to_undo,
        // Nothing was built since: nothing stands against the recommendation that waits.
        against: [],
        now: [],
      });
      assert.deepEqual(slotOf(told, slot.id).asked, slot.asked);
      assert.equal(slotOf(told, slot.id).call, undefined);
    }
    assert.equal(told.summary.asked, open.length);
    assert.equal(told.summary.open, 0);
  }
  // A person reads the question and its recommendation, and where to answer.
  const shown = run([PLANNED, "--target", dir]);
  assert.equal(shown.status, EXIT.work);
  for (const slot of open) {
    assert.ok(shown.stdout.includes(slot.ask.recommendation), slot.id);
    assert.ok(shown.stdout.includes(`${WAITING_FOLDER}/${slot.ask.id}.json`), slot.id);
  }
  // An asked slot gives no call of its own. The sheet still gives the one call that asks a choice
  // no slot holds: slots that are asked are not everything there is to ask.
  const [ofSlots, beyond] = shown.stdout.split("beyond the twelve slots:");
  assert.doesNotMatch(ofSlots, /--ask/);
  assert.match(beyond, /--ask 'QUESTION'/);
  // Asked once: a second --queue writes nothing, and the tree is as the first left it.
  const again = run([PLANNED, "--target", dir, "--queue", "--json"]);
  assert.equal(again.status, EXIT.work, again.stderr);
  assert.deepEqual(JSON.parse(again.stdout).files, []);
  assert.deepEqual(filesOf(dir), now);
});

test("criterion 5: --queue is all or nothing, and never writes over a file that is there", () => {
  const open = sheet(sample(), PLANNED).open;
  // The last question's file is there, and is no question: the waiting list cannot be read, so the
  // sheet itself cannot be made. Nothing is written, the first questions included.
  const blocked = sample();
  const last = `${WAITING_FOLDER}/${open.at(-1).ask.id}.json`;
  mkdirSync(path.join(blocked, WAITING_FOLDER), { recursive: true });
  writeFileSync(path.join(blocked, last), "not a question\n");
  const before = tree(blocked);
  const refused = run([PLANNED, "--target", blocked, "--queue", "--json"]);
  assert.equal(refused.status, EXIT.wrong);
  assert.equal(refused.stdout, "");
  assert.match(refused.stderr, /^design-assembly: /);
  assert.deepEqual(tree(blocked), before);
  assert.equal(readFileSync(path.join(blocked, last), "utf8"), "not a question\n");
  // A question that cannot be asked stops them all: here the ledger of decisions has a row with
  // the id of the last question, which the decision sheet refuses, and the first two are not
  // written either.
  const taken = sample({
    "design/decisions.yaml": (text) =>
      `${text}  - id: ${open.at(-1).ask.id}\n    layer: governance\n    kind: closed\n    source: "a row with the id of a question"\n`,
  });
  const held = tree(taken);
  const stopped = run([PLANNED, "--target", taken, "--queue"]);
  assert.equal(stopped.status, EXIT.wrong);
  assert.match(stopped.stderr, /is the id of a row of .*Nothing was written/);
  assert.deepEqual(tree(taken), held);
  // A waiting list kept as one shared file would be changed by a question: refused.
  const shared = sample({
    [WAITING_LIST]: `${JSON.stringify({ version: 1, rows: [] }, null, 2)}\n`,
  });
  const kept = tree(shared);
  const split = run([PLANNED, "--target", shared, "--queue"]);
  assert.equal(split.status, EXIT.wrong);
  assert.match(split.stderr, /one shared file.*Nothing was written/);
  assert.deepEqual(tree(shared), kept);
  // A tool copied in before the item kind was known would read the question as broken.
  const old = sample({
    "design/tool-stamp.json": `${JSON.stringify({ version: "0.23.0", tree: "0".repeat(40) }, null, 2)}\n`,
  });
  const aged = tree(old);
  const early = run([PLANNED, "--target", old, "--queue"]);
  assert.equal(early.status, EXIT.wrong);
  assert.match(early.stderr, /0\.23\.0.*bring it up to 0\.24\.0.*Nothing was written/);
  assert.deepEqual(tree(old), aged);
  assert.equal(run([PLANNED, "--target", old]).status, EXIT.work);
  // --queue is the one flag that writes: a wrong flag beside it is refused before anything is.
  const wrong = run([PLANNED, "--target", sample(), "--queue", "--dry-run"]);
  assert.equal(wrong.status, EXIT.wrong);
});

test("criterion 5: a slot the owner answered through the decision sheet is settled, its source the answer with the name and the day it carries", () => {
  const dir = sample();
  const open = sheet(dir, PLANNED, ["--queue"]).asked;
  const [model, navigation, touched] = open.map((slot) => slot.asked);
  answer(dir, [
    `${model.id} giữ`,
    `${navigation.id} Put it second, after the list of orders`,
    `${touched.id} bác The list of orders gains a link to it`,
  ]);
  const result = sheet(dir, PLANNED);
  assert.deepEqual(result.open, []);
  assert.deepEqual(result.asked, []);
  const told = {
    "model-changes": [/kept the recommendation/, model.recommendation],
    navigation: [/answered/, "Put it second, after the list of orders"],
    "touched-screens": [/refused the recommendation/, "The list of orders gains a link to it"],
  };
  for (const [id, [how, words]] of Object.entries(told)) {
    const slot = slotOf(result, id);
    assert.equal(slot.state, "settled", id);
    const line = slot.answer.at(-1);
    assert.match(line.says, how, id);
    assert.ok(line.says.includes(words), `${id}: ${line.says}`);
    assert.deepEqual(line.source, {
      file: `${WAITING_FOLDER}/screen-${PLANNED}-${id}.json`,
      row: `screen-${PLANNED}-${id}`,
      by: OWNER,
      on: ANSWERED,
    });
    assert.equal(slot.settled_by.by, OWNER);
    assert.equal(slot.settled_by.on, ANSWERED);
    assert.equal(slot.ask, undefined);
    assert.equal(slot.asked, undefined);
    // What the repository itself still does not say stays on the sheet.
    assert.ok(slot.why.length > 0, id);
  }
  assert.equal(result.summary.settled, 12);
  assert.equal(result.summary.settled_by_answer, 3);
  const shown = run([PLANNED, "--target", dir]).stdout;
  assert.ok(shown.includes(`answered by ${OWNER} on ${ANSWERED}`), shown);
  // A refusal with no words in its place is said as that.
  const bare = sample();
  const [first] = sheet(bare, BUILT, ["--queue"]).asked;
  answer(bare, [`${first.asked.id} bác`]);
  assert.match(
    slotOf(sheet(bare, BUILT), first.id).answer.at(-1).says,
    /refused the recommendation .* and said nothing in its place/,
  );
});

test("criterion 8: exit 0 is reached through the command itself, once the owner has answered every slot that was open", () => {
  const dir = sample();
  // The built screen of the sample has one open slot, the one no ledger holds.
  const first = run([BUILT, "--target", dir, "--json"]);
  assert.equal(first.status, EXIT.work);
  assert.deepEqual(
    JSON.parse(first.stdout).open.map((slot) => slot.id),
    ["touched-screens"],
  );
  // Asked, it still leaves work: the question waits on the owner.
  const queued = run([BUILT, "--target", dir, "--queue", "--json"]);
  assert.equal(queued.status, EXIT.work);
  assert.equal(run([BUILT, "--target", dir]).status, EXIT.work);
  // Answered, all twelve are settled, for a machine and for a person.
  answer(dir, [`${JSON.parse(queued.stdout).asked[0].asked.id} giữ`]);
  for (const mode of [["--json"], []]) {
    const done = run([BUILT, "--target", dir, ...mode]);
    assert.equal(done.status, EXIT.done, done.stderr);
  }
  const result = sheet(dir, BUILT);
  assert.ok(result.slots.every((slot) => slot.state === "settled"));
  assert.deepEqual(result.summary, {
    slots: 12,
    settled: 12,
    asked: 0,
    open: 0,
    settled_by_answer: 1,
    settled_waiting: 0,
    settled_on_branch: 0,
    against: 0,
  });
  assert.match(run([BUILT, "--target", dir]).stdout, /12 of 12 slots settled/);
});

test("each slot is open with nothing, asked with a question that waits, and settled once the owner answers", () => {
  for (const slot of CATALOGUE.slots) {
    const id = slot.id;
    // The two slots no ledger holds are open on the planned screen as it stands.
    const screen = DROPS[id] ? BUILT : PLANNED;
    const dir = sample(DROPS[id] ?? {});
    const open = slotOf(sheet(dir, screen), id);
    assert.equal(open.state, "open", id);
    assert.equal(open.ask.item, itemOf(screen, id));
    sheet(dir, screen, ["--queue"]);
    const asked = slotOf(sheet(dir, screen), id);
    assert.equal(asked.state, "asked", id);
    assert.equal(asked.asked.recommendation, open.ask.recommendation, id);
    answer(dir, [`${asked.asked.id} giữ`]);
    const settled = slotOf(sheet(dir, screen), id);
    assert.equal(settled.state, "settled", id);
    assert.equal(settled.answer.at(-1).source.by, OWNER, id);
  }
});

test("a question about a slot counts only for that slot of that screen, whoever wrote it", () => {
  const dir = sample();
  const put = (row) => {
    mkdirSync(path.join(dir, WAITING_FOLDER), { recursive: true });
    writeFileSync(
      path.join(dir, WAITING_FOLDER, `${row.id}.json`),
      `${JSON.stringify(row, null, 2)}\n`,
    );
  };
  // An agent asked it in its own words, under its own id, and marked it hard to undo.
  put({
    id: "where-returns-goes",
    question: "Where does the returns screen go?",
    recommendation: "Under orders.",
    basis: "It is about orders.",
    hard_to_undo: true,
    item: itemOf(PLANNED, "navigation"),
    asked_on: "2026-11-20",
  });
  // One with the id the sheet asks under, and no item, is the slot's question too.
  put({ id: `screen-${PLANNED}-touched-screens`, question: "Does another screen change?" });
  // A question about the same slot of another screen settles nothing here.
  put({
    id: "screen-orders-model-changes",
    question: "Another screen's.",
    recommendation: "None.",
    basis: "None.",
    hard_to_undo: false,
    item: itemOf(BUILT, "model-changes"),
    asked_on: "2026-11-20",
  });
  const result = sheet(dir, PLANNED);
  const navigation = slotOf(result, "navigation");
  assert.equal(navigation.state, "asked");
  assert.equal(navigation.asked.id, "where-returns-goes");
  assert.equal(navigation.asked.recommendation, "Under orders.");
  assert.equal(navigation.asked.hard_to_undo, true);
  assert.equal(slotOf(result, "model-changes").state, "open");
  const touched = slotOf(result, "touched-screens");
  assert.equal(touched.state, "asked");
  assert.equal(touched.asked.recommendation, null);
  // A question that is hard to undo is not built on until the owner answers.
  const shown = run([PLANNED, "--target", dir]).stdout;
  assert.match(shown, /hard to undo: do not build on it until the owner answers/);
  // A slot the repository settles is settled by the repository: a question about it changes nothing.
  put({
    id: "screen-returns-kind",
    question: "Which kind?",
    recommendation: "List.",
    basis: "The row.",
    hard_to_undo: false,
    item: itemOf(PLANNED, "kind"),
    asked_on: "2026-11-20",
  });
  const kind = slotOf(sheet(dir, PLANNED), "kind");
  assert.equal(kind.state, "settled");
  assert.equal(kind.asked, undefined);
  // A waiting list that cannot be read is a repository that cannot be read.
  writeFileSync(path.join(dir, WAITING_FOLDER, "broken.json"), "{ not json");
  const broken = run([PLANNED, "--target", dir, "--json"]);
  assert.equal(broken.status, EXIT.wrong);
  assert.equal(broken.stdout, "");
  assert.match(broken.stderr, /broken\.json is not JSON/);
});

test("a slot the sheet cannot ask says so, and offers no call the decision sheet would refuse", () => {
  // A screen whose id the waiting list cannot name: the slot is open, with why it cannot be asked.
  const odd = sample({
    "design/screens.yaml": (text) => text.replace("  - id: returns", '  - id: "my returns"'),
  });
  const called = run(["my returns", "--target", odd, "--json"]);
  assert.equal(called.status, EXIT.work, called.stderr);
  const result = JSON.parse(called.stdout);
  assert.ok(result.open.length >= 3);
  for (const slot of result.open) {
    assert.equal(slot.ask, undefined, slot.id);
    assert.equal(slot.call, undefined, slot.id);
    assert.match(slot.cannot_ask, /does not name one screen/, slot.id);
  }
  const shown = run(["my returns", "--target", odd]).stdout;
  // No slot gives a call. The one call the sheet still prints asks a choice no slot holds, and
  // names no screen: the decision sheet takes it.
  const [ofSlots, beyond] = shown.split("beyond the twelve slots:");
  assert.doesNotMatch(ofSlots, /--ask|run again with --queue/);
  assert.match(beyond, /--ask 'QUESTION'/);
  assert.doesNotMatch(beyond, /--item/);
  assert.match(shown, /cannot be asked: .*does not name one screen/);
  // --queue has nothing it can ask there: it writes nothing and says so.
  const before = tree(odd);
  const queued = run(["my returns", "--target", odd, "--queue", "--json"]);
  assert.equal(queued.status, EXIT.work, queued.stderr);
  assert.deepEqual(JSON.parse(queued.stdout).files, []);
  assert.deepEqual(tree(odd), before);
  // A question about something else under the id the sheet would ask with: the same.
  const taken = sample();
  mkdirSync(path.join(taken, WAITING_FOLDER), { recursive: true });
  writeFileSync(
    path.join(taken, WAITING_FOLDER, "SCREEN-returns-navigation.json"),
    `${JSON.stringify({ id: "SCREEN-returns-navigation", question: "Else?", item: "decision:labels" }, null, 2)}\n`,
  );
  const navigation = slotOf(sheet(taken, PLANNED), "navigation");
  assert.equal(navigation.state, "open");
  assert.equal(navigation.call, undefined);
  assert.match(navigation.cannot_ask, /SCREEN-returns-navigation is in the waiting list already/);
  // The other open slots of that sheet are still asked by --queue, and only they.
  const rest = run([PLANNED, "--target", taken, "--queue", "--json"]);
  assert.equal(rest.status, EXIT.work, rest.stderr);
  assert.deepEqual(
    JSON.parse(rest.stdout).files.map((file) => file.path),
    ["model-changes", "touched-screens"].map(
      (slot) => `${WAITING_FOLDER}/screen-${PLANNED}-${slot}.json`,
    ),
  );
});

test("an asked slot tells a builder to go on only where the question recommends something and says it is easy to undo", () => {
  const dir = sample();
  mkdirSync(path.join(dir, WAITING_FOLDER), { recursive: true });
  const put = (row) =>
    writeFileSync(
      path.join(dir, WAITING_FOLDER, `${row.id}.json`),
      `${JSON.stringify(row, null, 2)}\n`,
    );
  // No recommendation: nothing to go on with.
  put({ id: "bare", question: "Where does it go?", item: itemOf(PLANNED, "navigation") });
  // A recommendation, and no word on whether it is hard to undo.
  put({
    id: "silent",
    question: "Does another screen change?",
    recommendation: "None does.",
    item: itemOf(PLANNED, "touched-screens"),
  });
  // A recommendation that says it is easy to undo.
  put({
    id: "easy",
    question: "Does the model change?",
    recommendation: "Add them first.",
    basis: "The row.",
    hard_to_undo: false,
    item: itemOf(PLANNED, "model-changes"),
  });
  const shown = run([PLANNED, "--target", dir]).stdout;
  const after = (id) =>
    shown
      .slice(shown.indexOf(`: ${id}, `))
      .split("\n")
      .slice(1, 4)
      .join("\n");
  assert.match(after("bare"), /recommendation: none given/);
  assert.match(after("bare"), /nothing to go on with: do not build on it until the owner answers/);
  assert.match(after("silent"), /does not say whether it is hard to undo: do not build on it/);
  assert.match(after("easy"), /go on with the recommendation until the owner answers/);
  assert.equal((shown.match(/go on with the recommendation until/g) ?? []).length, 1);
  // The document says the same of each.
  const out = folder();
  run([PLANNED, "--target", dir, "--out", out]);
  const page = readFileSync(path.join(out, "screen-brief.html"), "utf8");
  assert.match(page, /Nothing to go on with: do not build on it/);
  assert.match(page, /does not say whether it is hard to undo: do not build on it/);
});

test("a waiting list kept as one shared file is read for the state of a slot, and --queue beside --out writes both and nothing else", () => {
  const shared = sample({
    [WAITING_LIST]: `${JSON.stringify(
      {
        version: 1,
        rows: [
          {
            id: "nav",
            question: "Where?",
            recommendation: "Last.",
            item: itemOf(PLANNED, "navigation"),
          },
          {
            id: "touch",
            question: "Which?",
            item: itemOf(PLANNED, "touched-screens"),
            answer: "value",
            said: "None",
            by: OWNER,
            on: ANSWERED,
          },
        ],
      },
      null,
      2,
    )}\n`,
  });
  const result = sheet(shared, PLANNED);
  assert.equal(slotOf(result, "navigation").asked.file, WAITING_LIST);
  const touched = slotOf(result, "touched-screens");
  assert.equal(touched.state, "settled");
  assert.deepEqual(touched.answer.at(-1).source, {
    file: WAITING_LIST,
    row: "touch",
    by: OWNER,
    on: ANSWERED,
  });
  // --queue with --out: the document, and the new files of the waiting list.
  const dir = sample();
  const out = folder();
  const before = filesOf(dir);
  const called = run([PLANNED, "--target", dir, "--queue", "--out", out, "--json"]);
  assert.equal(called.status, EXIT.work, called.stderr);
  const files = JSON.parse(called.stdout).files;
  assert.deepEqual(
    files.map((file) => file.change),
    ["create", "create", "create", "create"],
  );
  assert.equal(files[0].path, path.join(out, "screen-brief.html"));
  assert.ok(files.slice(1).every((file) => file.path.startsWith(`${WAITING_FOLDER}/`)));
  assert.equal(filesOf(dir).length, before.length + 3);
  // The document is of the sheet as it is once the questions are asked.
  assert.match(readFileSync(path.join(out, "screen-brief.html"), "utf8"), /3 are asked and wait/);
});

test("the summary says how many settled slots hold a line that waits on another slot, for a person and for a machine", () => {
  const dir = sample();
  const planned = sheet(dir, PLANNED);
  // The entity and the action the model lacks are said in slots 2 and 3, which wait on slot 10.
  assert.deepEqual(planned.summary, {
    slots: 12,
    settled: 9,
    asked: 0,
    open: 3,
    settled_by_answer: 0,
    settled_waiting: 2,
    settled_on_branch: 0,
    against: 0,
  });
  const shown = run([PLANNED, "--target", dir]).stdout;
  assert.match(
    shown,
    /9 of 12 slots settled, 0 asked, 3 open; 2 of the settled slots hold a line that waits on another slot/,
  );
  const out = folder();
  assert.equal(run([PLANNED, "--target", dir, "--out", out]).status, EXIT.work);
  const page = readFileSync(path.join(out, "screen-brief.html"), "utf8");
  assert.match(page, /2 of them hold a line that waits on another slot/);
  // Where no settled slot waits, the summary says so in the count and adds no words.
  const built = sheet(dir, BUILT);
  assert.equal(built.summary.settled_waiting, 0);
  assert.equal(
    run([BUILT, "--target", dir]).stdout.split("\n")[1],
    "  11 of 12 slots settled, 0 asked, 1 open",
  );
});

test("on two different days the same repository gives the same sheet, asked or answered; only the day a question was asked differs, in its own file", () => {
  const days = ["2026-11-21", "2031-02-03"];
  const on = (day, args) =>
    spawnSync(execPath, ["--import", FIXED_DAY, BRIEF, ...args], {
      encoding: "utf8",
      env: { ...env, DESIGN_ASSEMBLY_TEST_DAY: day },
    });
  const dir = sample();
  const start = folder();
  cpSync(dir, start, { recursive: true });
  const reset = () => {
    rmSync(dir, { recursive: true, force: true });
    cpSync(start, dir, { recursive: true });
  };
  // What is printed while every slot is open: the same on both days, with no day in it.
  for (const mode of [["--json"], []]) {
    const [a, b] = days.map((day) => on(day, [PLANNED, "--target", dir, ...mode]));
    assert.equal(a.status, EXIT.work, a.stderr);
    assert.equal(b.stdout, a.stdout);
    assert.doesNotMatch(a.stdout, /2026-11-21|2031-02-03/);
  }
  // --queue on each day: what it prints is the same; the files it writes differ in one line, the
  // day the question was asked, as the decision sheet writes it for any question.
  const queued = days.map((day) => {
    reset();
    const said = on(day, [PLANNED, "--target", dir, "--queue", "--json"]);
    assert.equal(said.status, EXIT.work, said.stderr);
    const files = JSON.parse(said.stdout).files.map((file) => file.path);
    const after = ["--json", null].map(
      (mode) => on(days[0], [PLANNED, "--target", dir, ...(mode ? [mode] : [])]).stdout,
    );
    const out = folder();
    on(day, [PLANNED, "--target", dir, "--out", out]);
    return {
      said: said.stdout,
      after,
      page: readFileSync(path.join(out, "screen-brief.html"), "utf8"),
      written: Object.fromEntries(
        files.map((file) => [file, readFileSync(path.join(dir, file), "utf8")]),
      ),
    };
  });
  assert.equal(queued[1].said, queued[0].said);
  assert.deepEqual(queued[1].after, queued[0].after);
  assert.equal(queued[1].page, queued[0].page);
  for (const said of [queued[0].said, ...queued[0].after, queued[0].page]) {
    assert.doesNotMatch(said, /2026-11-21|2031-02-03/);
  }
  for (const [file, text] of Object.entries(queued[0].written)) {
    const other = queued[1].written[file];
    assert.notEqual(other, text, file);
    assert.equal(other.replace(days[1], days[0]), text, file);
    assert.equal(JSON.parse(text).asked_on, days[0]);
  }
  // Answered: the sheet carries the day the answer carries, and is the same whatever day it runs.
  answer(
    dir,
    Object.keys(queued[1].written).map((file) => `${path.basename(file, ".json")} giữ`),
  );
  for (const mode of [["--json"], []]) {
    const [a, b] = days.map((day) => on(day, [PLANNED, "--target", dir, ...mode]));
    assert.equal(a.status, EXIT.done, a.stderr);
    assert.equal(b.stdout, a.stdout);
    assert.ok(a.stdout.includes(ANSWERED));
    assert.doesNotMatch(a.stdout, /2026-11-21|2031-02-03/);
  }
});

test("the document asks the owner for each open slot with its recommendation and what it rests on, and names the asked ones", () => {
  const dir = sample();
  const out = folder();
  const { open } = sheet(dir, PLANNED);
  assert.equal(run([PLANNED, "--target", dir, "--out", out]).status, EXIT.work);
  const page = readFileSync(path.join(out, "screen-brief.html"), "utf8");
  const part = (id, next) =>
    page.slice(page.indexOf(`data-part="${id}"`), page.indexOf(`data-part="${next}"`));
  for (const slot of open) {
    // The recommendation stands with what it rests on, and the step after says how it is asked.
    assert.ok(part("recommendations", "next").includes(`Slot ${slot.number}`), slot.id);
    assert.ok(part("decision", "findings").includes(`Slot ${slot.number}`), slot.id);
  }
  assert.ok(part("next", "blind").includes(`/design-assembly:brief ${PLANNED} --queue`));
  // Once asked, the page says the questions wait, and sends the owner to the decision sheet.
  sheet(dir, PLANNED, ["--queue"]);
  const asked = folder();
  assert.equal(run([PLANNED, "--target", dir, "--out", asked]).status, EXIT.work);
  const after = readFileSync(path.join(asked, "screen-brief.html"), "utf8");
  assert.match(after, /3 are asked and wait on the owner/);
  assert.ok(after.includes("/design-assembly:decide"));
  assert.ok(!after.includes(`/design-assembly:brief ${PLANNED} --queue`));
});
