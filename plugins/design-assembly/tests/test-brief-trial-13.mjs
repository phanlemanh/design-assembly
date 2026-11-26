// What the second builder trial with the brief pointed at (trial 13 of the screen role), each as
// the trial's own situation on a throwaway repository. Three kinds of choice were still decided in
// silence, and the sheet and the rules page now say where each is answered or that it is the
// owner's: whether a toast's button counts among a screen's actions, the spoken name of each
// button behind a row's actions button, and the words of a row's waiting state where that button
// puts none on the page. A question about the data model, or about something every screen shares,
// is asked once and read by the sheet of every screen it concerns. And what the sheet prints of
// its own limits names no trial and tells nothing a builder did.
import "./helpers/own-cores.mjs";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { env, execPath } from "node:process";
import { after, test } from "node:test";
import { fileURLToPath, pathToFileURL } from "node:url";

import { rulesPage } from "../scripts/apply.mjs";
import { EXIT } from "../scripts/command.mjs";
import { readWaiting, WAITING_FOLDER } from "../templates/tools/design-assembly/waiting.mjs";
import { branchRepository, BUILT, git, lines, row } from "./helpers/brief-repo.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const PLUGIN = path.resolve(HERE, "..");
const BRIEF = path.join(PLUGIN, "scripts/brief.mjs");
const DECIDE = path.join(PLUGIN, "scripts/decide.mjs");
const FIXED_DAY = pathToFileURL(path.join(HERE, "helpers/fixed-day.mjs")).href;
const LIMITS = JSON.parse(readFileSync(path.join(PLUGIN, "references/limits.json"), "utf8"));
// The screen the builder of the trial adds, and the second built screen of the trial's copy: a
// list of the late records, which shows the same records as the built one.
const NEW = "shelf";
const LATE = "late";
const RULES = ".claude/rules/design-assembly.md";
const ROW_ACTIONS = "src/components/ui/row-actions.tsx";

const removals = [];
after(() => removals.forEach((remove) => remove()));
const keep = (made) => {
  removals.push(made.remove);
  return made.dir;
};
const run = (args, options = {}) =>
  spawnSync(execPath, [BRIEF, ...args], { encoding: "utf8", ...options });
const sheet = (dir, id) => {
  const called = run([id, "--target", dir, "--json"]);
  assert.ok([EXIT.done, EXIT.work].includes(called.status), called.stderr);
  return JSON.parse(called.stdout);
};
const told = (dir, id) => {
  const called = run([id, "--target", dir]);
  assert.ok([EXIT.done, EXIT.work].includes(called.status), called.stderr);
  return called.stdout;
};
const slotOf = (result, id) => result.slots.find((slot) => slot.id === id);
const placesOf = (result, slot) => result.beyond.places.filter((place) => place.slot === slot);
const edit = (dir, file, change) =>
  writeFileSync(path.join(dir, file), change(readFileSync(path.join(dir, file), "utf8")));
const waitingFiles = (dir) => {
  const folder = path.join(dir, WAITING_FOLDER);
  try {
    return readdirSync(folder).sort();
  } catch {
    return [];
  }
};

// The rules page the guide writes for a repository like the trial's: a ledger of screens, the
// gate's check of screens and actions, the state table, the decision sheet, and the floor's
// component for a row's actions and its module for toasts.
const PAGE = rulesPage(
  {
    "screen-ledger": [{ kind: "screen-ledger" }],
    "screen-actions": [{ kind: "screen-actions" }],
    "state-matrix": [{ kind: "state-matrix" }],
    "decision-sheet": [{ kind: "decision-sheet" }],
    "notification-channel": [{ kind: "notification-channel" }],
    "column-align": [{ kind: "column-align" }],
  },
  (file) => [ROW_ACTIONS, "src/lib/notify.ts"].includes(file),
);
const flat = (text) => text.replace(/\s+/g, " ");
const lineOf = (page, pattern) => page.split("\n").find((line) => pattern.test(line)) ?? "";

// The floor's component for a row's actions, as the component ledger lists it: a name for the
// row's button and its list, and a name it is heard by while it waits; none for each action.
const withRowActions = (text, props = ["name", "pending", "busyName", "ref"]) => {
  const data = JSON.parse(text);
  return `${JSON.stringify(
    {
      ...data,
      components: [
        ...data.components,
        {
          name: "RowActions",
          category: "component",
          file: ROW_ACTIONS,
          source: "library",
          props,
        },
      ],
    },
    null,
    2,
  )}\n`;
};

// The copy of the trial: the main branch holds the built screen, a second built screen of the
// same records, the rules page the guide writes and the floor's component for a row's actions.
// The owner fixed no principle and took no direction.
function trialRepository(change = {}) {
  return keep(
    branchRepository({
      "design/screens.yaml": (text) =>
        lines(
          text.slice(0, text.indexOf("  - id: returns\n")).trimEnd(),
          ...row({
            id: LATE,
            route: "/archive",
            status: "built",
            shows: "Order",
            actions: "cancelOrder",
          }),
        ),
      "design/component-registry.json": withRowActions,
      [RULES]: PAGE,
      "design/blueprint.json": null,
      ...change,
    }),
  );
}

// What the builder of the trial wrote before it queued: a field and two actions added to the data
// model, the new screen entered in the ledger of screens, declared ahead, with three actions: one
// to bring a record back, the delete, and the one whose only button on this screen is the undo of
// a toast. The built screen gained the button that puts a record on the shelf.
function builderWrites(dir) {
  edit(dir, "ontology/entities/Order.yaml", (text) =>
    lines(text.trimEnd(), "  shelved: { type: boolean, required: false, display: text }"),
  );
  edit(dir, "ontology/actions.yaml", (text) =>
    lines(
      text.trimEnd(),
      "  - name: shelveOrder",
      "    entity: Order",
      "    kind: update",
      "    roles: [manager]",
      "  - name: restoreOrder",
      "    entity: Order",
      "    kind: update",
      "    roles: [manager]",
    ),
  );
  const shelf = row({
    id: NEW,
    route: "/shelf",
    status: "planned",
    shows: "Order",
    actions: "restoreOrder",
  });
  shelf.splice(
    shelf.indexOf("      - restoreOrder") + 1,
    0,
    "      - cancelOrder",
    "      - shelveOrder",
  );
  edit(dir, "design/screens.yaml", (text) =>
    lines(
      text
        .replace(
          "    actions:\n      - cancelOrder\n",
          "    actions:\n      - cancelOrder\n      - shelveOrder\n",
        )
        .trimEnd(),
      ...shelf,
    ),
  );
}
const trial = (change) => {
  const dir = trialRepository(change);
  builderWrites(dir);
  return dir;
};

test("the copy of the trial is what the trial had: three screens, the new one with three buttons", () => {
  const dir = trial();
  const result = sheet(dir, NEW);
  assert.deepEqual(
    result.actions.filter((item) => item.as === "button").map((item) => item.name),
    ["restoreOrder", "cancelOrder", "shelveOrder"],
  );
  assert.equal(slotOf(result, "principles").state, "open");
  assert.equal(slotOf(result, "model-changes").state, "open");
  for (const id of [BUILT, LATE])
    assert.equal(slotOf(sheet(dir, id), "model-changes").state, "open");
});

// --- 1. The three kinds of choice still decided in silence ---------------------------------------

test("the rules page and the actions slot say in so many words that a toast's button counts among a screen's actions", () => {
  // The rules page: what the gate takes as a button, a toast's among them, and what it cannot tell.
  const said = flat(lineOf(PAGE, /it has buttons for \(`actions`\)/));
  assert.match(said, /a toast's button the screen raises/);
  assert.match(said, /list its action in `actions`/);
  assert.match(said, /cannot tell a toast's button from one drawn on the screen/);
  // The actions slot of the new screen gives the same line, read from the rules page, with its line.
  const dir = trial();
  const actions = slotOf(sheet(dir, NEW), "actions");
  const line = actions.answer.find((item) => /toast's button/.test(item.says));
  assert.ok(line, "the actions slot says nothing of a toast's button");
  assert.equal(line.source.file, RULES);
  assert.equal(typeof line.source.line, "number");
  assert.match(
    readFileSync(path.join(dir, RULES), "utf8").split("\n")[line.source.line - 1],
    /a toast's button the screen raises/,
  );
  assert.equal(actions.state, "settled");
  // A rules page that does not say it: the sheet names the choice as one that hides there.
  const bare = trial({
    [RULES]: (text) =>
      text.replace(/ A button for an action is any[^\n]*?drawn on the screen[^\n]*?\./, ""),
  });
  const result = sheet(bare, NEW);
  assert.equal(
    slotOf(result, "actions").answer.some((item) => /toast's button/.test(item.says)),
    false,
  );
  const [place] = placesOf(result, "actions");
  assert.ok(place, "no place names the choice where the rules page does not say it");
  assert.match(place.says, /toast/);
  assert.match(place.says, /said on no page/);
  assert.equal(place.number, 3);
});

test("the rules page and the components slot say that the row's actions button takes no name for each action", () => {
  const said = flat(lineOf(PAGE, /`RowActions`/));
  assert.match(said, /takes no name for each action/);
  const dir = trial();
  const [place] = placesOf(sheet(dir, NEW), "components").filter((item) =>
    /busyName/.test(item.says),
  );
  assert.ok(place, "the components slot names no place for the name of each action");
  assert.match(place.says, /RowActions/);
  assert.match(place.says, /none (of them )?names a button inside/i);
  assert.match(place.says, /this screen's own choice/);
  assert.equal(place.source.file, "design/component-registry.json");
  // A screen whose row has one button puts nothing behind the row's actions button: no place.
  assert.deepEqual(
    placesOf(sheet(dir, LATE), "components").filter((item) => /busyName/.test(item.says)),
    [],
  );
  // A component ledger with no such component, or one whose props are not a list: no place, and
  // the sheet is still given.
  const plain = trial({ "design/component-registry.json": (text) => text });
  assert.deepEqual(
    placesOf(sheet(plain, NEW), "components").filter((item) => /busyName/.test(item.says)),
    [],
  );
  const stray = trial({
    "design/component-registry.json": (text) => withRowActions(text, "name busyName"),
  });
  assert.deepEqual(
    placesOf(sheet(stray, NEW), "components").filter((item) => /busyName/.test(item.says)),
    [],
  );
});

test("the states slot names the two rules that pull against each other as the owner's choice, with the call that asks it", () => {
  // The rules page says the two rules meet there and that the choice is the owner's.
  const states = flat(PAGE.split("\n## States\n")[1].split("\n## ")[0]);
  assert.match(states, /`busyName`/);
  assert.match(states, /which gives way is the owner's/);
  assert.match(states, /do not list such a state with words the page shows before it/i);
  const dir = trial();
  const [place] = placesOf(sheet(dir, NEW), "states");
  assert.ok(place, "the states slot names no choice");
  assert.equal(place.number, 4);
  assert.match(place.says, /busyName/);
  assert.match(place.says, /owner's/);
  assert.match(place.ask.question, /Which gives way/);
  assert.match(place.ask.recommendation, /out of the screen's states until the owner answers/);
  assert.equal(place.ask.hard_to_undo, false);
  assert.match(place.call, /decide\.mjs/);
  assert.match(place.call, /--id 'row-waiting-state-words'/);
  // For a person: the place and the call that asks it.
  const shown = told(dir, NEW);
  assert.match(shown, / 4 states: .*busyName/);
  assert.ok(shown.includes(place.call));
  // The call, run as it stands, writes one question; then every sheet says it waits, and gives no
  // second call: it is a question of the repository, not of one screen.
  const called = spawnSync("sh", ["-c", place.call], { encoding: "utf8" });
  assert.equal(called.status, EXIT.work, called.stderr);
  assert.deepEqual(waitingFiles(dir), ["row-waiting-state-words.json"]);
  for (const id of [NEW, BUILT]) {
    const [again] = placesOf(sheet(dir, id), "states");
    assert.equal(again.asked.id, "row-waiting-state-words");
    assert.equal(again.call, undefined);
  }
  // A screen with one button, or a repository whose components have no such name: no place.
  assert.deepEqual(placesOf(sheet(dir, LATE), "states"), []);
  const plain = trial({ "design/component-registry.json": (text) => text });
  assert.deepEqual(placesOf(sheet(plain, NEW), "states"), []);
});

// --- 2. One question for one thing to decide -----------------------------------------------------

const queueAll = (dir) => {
  for (const id of [NEW, BUILT, LATE]) {
    const called = run([id, "--target", dir, "--queue"]);
    assert.equal(called.status, EXIT.work, called.stderr);
  }
  return waitingFiles(dir);
};

test("queuing the three sheets of the trial writes one question for each thing to decide", () => {
  const dir = trial();
  const files = queueAll(dir);
  // The trial queued ten: principles three times and one addition to the data model three times.
  // Now principles once, the addition once, the place of the new screen once, and the other
  // screens each one touches once for each screen.
  assert.equal(files.length, 6, files.join(", "));
  const list = readWaiting(dir);
  const items = list.rows.map((item) => item.item).sort();
  assert.deepEqual(items, [
    "screen:late:touched-screens",
    "screen:orders:touched-screens",
    "screen:shelf:navigation",
    "screen:shelf:touched-screens",
    "screens:model-changes:Order.shelved+restoreOrder+shelveOrder",
    "screens:principles",
  ]);
  // Each sheet reads the shared questions as its own slot's, asked and waiting.
  for (const id of [NEW, BUILT, LATE]) {
    const result = sheet(dir, id);
    assert.equal(slotOf(result, "principles").state, "asked", id);
    assert.equal(slotOf(result, "principles").asked.id, "screens-principles", id);
    assert.equal(slotOf(result, "model-changes").state, "asked", id);
  }
  // The shared question says it is for every screen it concerns, and names no one screen.
  const principles = list.rows.find((item) => item.item === "screens:principles");
  assert.match(principles.question, /every screen/);
  assert.doesNotMatch(principles.question, /For the screen shelf/);
});

test("one answer of the owner settles a shared question on the sheet of every screen", () => {
  const dir = trial();
  queueAll(dir);
  const answers = path.join(dir, "..", `${path.basename(dir)}-answers.txt`);
  removals.push(() => rmSync(answers, { force: true }));
  writeFileSync(answers, "screens-principles keep\n");
  const called = spawnSync(
    execPath,
    [DECIDE, "--target", dir, "--answers", answers, "--by", "Owner", "--on", "2026-12-01"],
    { encoding: "utf8" },
  );
  assert.ok([EXIT.done, EXIT.work].includes(called.status), called.stderr);
  for (const id of [NEW, BUILT, LATE]) {
    const slot = slotOf(sheet(dir, id), "principles");
    assert.equal(slot.state, "settled", id);
    assert.equal(slot.settled_by.id, "screens-principles", id);
  }
});

test("a question that waits under one screen's own item is still read, and only for that screen", () => {
  const dir = trial();
  // A question asked before this change, under the item of one slot of one screen.
  mkdirSync(path.join(dir, WAITING_FOLDER), { recursive: true });
  writeFileSync(
    path.join(dir, WAITING_FOLDER, "screen-orders-principles.json"),
    `${JSON.stringify(
      {
        id: "screen-orders-principles",
        question:
          "For the screen orders, slot 8, principles and direction: what did the owner fix?",
        recommendation: "Build with no principle to rest on.",
        basis: "The floor's rule.",
        hard_to_undo: false,
        item: "screen:orders:principles",
        asked_on: "2026-11-20",
      },
      null,
      2,
    )}\n`,
  );
  assert.equal(slotOf(sheet(dir, BUILT), "principles").asked.id, "screen-orders-principles");
  assert.equal(slotOf(sheet(dir, NEW), "principles").state, "open");
  assert.match(slotOf(sheet(dir, NEW), "principles").state, /open/);
  const open = sheet(dir, NEW).open.find((slot) => slot.id === "principles");
  assert.equal(open.ask.item, "screens:principles");
});

// The order both builders of the trials took: run the brief and queue, then write one more name
// into the data model, then run the brief again.
const MODEL_ITEM = "screens:model-changes:Order.shelved+restoreOrder+shelveOrder";
const MODEL_ID = "screens-model-changes-Order.shelved+restoreOrder+shelveOrder";
const MORE_ITEM = "screens:model-changes:Order.shelved+restoreOrder+shelveAll+shelveOrder";
const writeMore = (dir) =>
  edit(dir, "ontology/actions.yaml", (text) =>
    lines(
      text.trimEnd(),
      "  - name: shelveAll",
      "    entity: Order",
      "    kind: update",
      "    roles: [manager]",
    ),
  );
const decideSheet = (dir) => {
  const called = spawnSync(execPath, [DECIDE, "--target", dir, "--json"], { encoding: "utf8" });
  assert.ok([EXIT.done, EXIT.work].includes(called.status), called.stderr);
  return JSON.parse(called.stdout);
};
const answerWith = (dir, line) => {
  const file = path.join(mkdtempSync(path.join(tmpdir(), "design-brief-13-answers-")), "a.txt");
  removals.push(() => rmSync(path.dirname(file), { recursive: true, force: true }));
  writeFileSync(file, `${line}\n`);
  const called = spawnSync(
    execPath,
    [DECIDE, "--target", dir, "--answers", file, "--by", "Owner", "--on", "2026-12-01"],
    { encoding: "utf8" },
  );
  assert.ok([EXIT.done, EXIT.work].includes(called.status), called.stderr);
};

test("a name written after the question of the data model was queued leaves the owner one question, about every name", () => {
  const dir = trial();
  queueAll(dir);
  const first = readFileSync(path.join(dir, WAITING_FOLDER, `${MODEL_ID}.json`), "utf8");
  assert.equal(JSON.parse(first).item, MODEL_ITEM);
  writeMore(dir);
  // The sheet asks again, about every name the branch has written, and says which question the
  // new one replaces and which names were added since.
  const result = sheet(dir, NEW);
  const open = result.open.find((slot) => slot.id === "model-changes");
  assert.equal(open.ask.item, MORE_ITEM);
  assert.deepEqual(open.ask.replaces, [MODEL_ID]);
  assert.match(open.ask.question, new RegExp(`replaces ${MODEL_ID.replace(/[.+]/g, "\\$&")}`));
  assert.match(open.ask.question, /added since it was asked: shelveAll/);
  assert.match(open.call, new RegExp(`--replaces '${MODEL_ID.replace(/[.+]/g, "\\$&")}'`));
  assert.match(told(dir, NEW), /replaces .*added since it was asked: shelveAll/);
  // Queued, the new question is one more file; the first file is not written over.
  const called = run([NEW, "--target", dir, "--queue"]);
  assert.equal(called.status, EXIT.work, called.stderr);
  assert.equal(readFileSync(path.join(dir, WAITING_FOLDER, `${MODEL_ID}.json`), "utf8"), first);
  const rows = readWaiting(dir).rows;
  const newer = rows.find((item) => item.item === MORE_ITEM);
  assert.deepEqual(newer.replaces, [MODEL_ID]);
  // The decision sheet puts one question about the data model to the owner, and shows the first
  // as replaced, not as waiting; it takes no answer for the replaced one.
  const decided = decideSheet(dir);
  const model = decided.questions.filter((item) => item.id.startsWith("screens-model-changes-"));
  assert.deepEqual(
    model.map((item) => item.id),
    [newer.id],
  );
  assert.deepEqual(decided.replaced, [
    { id: MODEL_ID, source: "waiting-list", replaced_by: newer.id },
  ]);
  const answers = path.join(mkdtempSync(path.join(tmpdir(), "design-brief-13-answers-")), "a.txt");
  removals.push(() => rmSync(path.dirname(answers), { recursive: true, force: true }));
  writeFileSync(answers, `${MODEL_ID} keep\n`);
  const refused = spawnSync(
    execPath,
    [DECIDE, "--target", dir, "--answers", answers, "--by", "Owner", "--on", "2026-12-01"],
    { encoding: "utf8" },
  );
  assert.equal(refused.status, EXIT.wrong);
  assert.match(refused.stderr, new RegExp(`replaced by ${newer.id.replace(/[.+]/g, "\\$&")}`));
  // Every sheet reads the newer question, and none asks again.
  for (const id of [NEW, BUILT, LATE]) {
    assert.equal(slotOf(sheet(dir, id), "model-changes").asked.id, newer.id, id);
  }
  assert.deepEqual(
    queueAll(dir).filter((name) => name.startsWith("screens-model-changes-")),
    [`${MODEL_ID}.json`, `${newer.id}.json`].sort(),
  );
});

test("a question the owner answered before a name was added settles those names alone, and the rest is asked", () => {
  const dir = trial();
  queueAll(dir);
  answerWith(dir, `${MODEL_ID} keep`);
  writeMore(dir);
  const result = sheet(dir, NEW);
  const slot = slotOf(result, "model-changes");
  // The answer about three names does not read as an answer about four.
  assert.equal(slot.state, "open");
  const said = slot.answer.find((line) => line.source.row === MODEL_ID);
  assert.ok(said, "the sheet does not show the answer the owner gave");
  assert.match(said.says, /^For Order\.shelved, restoreOrder, shelveOrder: the owner kept/);
  // Only what the answer does not cover is asked, and nothing answered is replaced.
  const open = result.open.find((item) => item.id === "model-changes");
  assert.equal(open.ask.item, "screens:model-changes:shelveAll");
  assert.equal(open.ask.replaces, undefined);
  assert.match(
    open.ask.question,
    new RegExp(
      `${MODEL_ID.replace(/[.+]/g, "\\$&")} answers Order\\.shelved, restoreOrder, shelveOrder`,
    ),
  );
  assert.match(told(dir, NEW), /still to ask: shelveAll/);
  // Asked, then answered: the slot is settled by the two answers, each for its own names.
  assert.equal(run([NEW, "--target", dir, "--queue"]).status, EXIT.work);
  assert.equal(slotOf(sheet(dir, NEW), "model-changes").state, "asked");
  answerWith(dir, "screens-model-changes-shelveAll keep");
  const settled = slotOf(sheet(dir, NEW), "model-changes");
  assert.equal(settled.state, "settled");
  assert.deepEqual(
    settled.answer.filter((line) => line.source.by).map((line) => line.source.row),
    [MODEL_ID, "screens-model-changes-shelveAll"],
  );
  for (const id of [BUILT, LATE])
    assert.equal(slotOf(sheet(dir, id), "model-changes").state, "settled", id);
});

test("decide --ask refuses to replace a question that is not one waiting on the owner", () => {
  const dir = trial();
  queueAll(dir);
  answerWith(dir, "screens-principles keep");
  const ask = (replaces) =>
    spawnSync(
      execPath,
      [
        DECIDE,
        "--target",
        dir,
        "--ask",
        "Q?",
        "--recommend",
        "R.",
        "--because",
        "B.",
        "--easy-to-undo",
        "--item",
        MORE_ITEM,
        "--replaces",
        replaces,
      ],
      { encoding: "utf8" },
    );
  for (const [bad, said] of [
    ["no-such-question", /no-such-question is not a question of the waiting list/],
    ["screens-principles", /screens-principles was answered/],
  ]) {
    const refused = ask(bad);
    assert.equal(refused.status, EXIT.wrong, bad);
    assert.match(refused.stderr, said, bad);
  }
  assert.equal(
    readWaiting(dir).rows.some((item) => item.item === MORE_ITEM),
    false,
  );
});

test("the shared question of the data model is the same whichever screen queues it first", () => {
  // The new screen also names an action the data model lacks, which only its row names: the
  // screens no longer have the same names, and the question is still one.
  const extra = (dir) =>
    edit(dir, "design/screens.yaml", (text) =>
      text.replace("      - restoreOrder\n", "      - restoreOrder\n      - purgeOrder\n"),
    );
  const queued = (order) => {
    const dir = trial();
    extra(dir);
    for (const id of order) {
      const called = run([id, "--target", dir, "--queue"]);
      assert.equal(called.status, EXIT.work, called.stderr);
    }
    const files = waitingFiles(dir);
    const model = files.filter((name) => name.startsWith("screens-model-changes-"));
    assert.equal(model.length, 1, files.join(", "));
    const row = JSON.parse(readFileSync(path.join(dir, WAITING_FOLDER, model[0]), "utf8"));
    for (const id of [NEW, BUILT, LATE]) {
      assert.equal(slotOf(sheet(dir, id), "model-changes").asked.id, row.id, id);
    }
    return { files, row };
  };
  const first = queued([NEW, BUILT, LATE]);
  const second = queued([LATE, BUILT, NEW]);
  assert.deepEqual(second.files, first.files);
  assert.deepEqual(second.row, first.row);
  assert.equal(
    first.row.item,
    "screens:model-changes:Order.shelved+purgeOrder+restoreOrder+shelveOrder",
  );
  assert.match(first.row.question, /a row of the ledger of screens names the action purgeOrder/);
});

test("a repository whose tool is older than the one that reads a shared question is asked one question a screen, as before", () => {
  const stamped = (version) => `${JSON.stringify({ version, tree: "0".repeat(40) }, null, 2)}\n`;
  // An older tool: the question goes under the screen's own item, which its gate reads.
  const older = trial({ "design/tool-stamp.json": stamped("0.25.1") });
  const open = sheet(older, NEW).open.find((slot) => slot.id === "principles");
  assert.equal(open.ask.item, "screen:shelf:principles");
  // A stamp the sheet cannot read, as a folder or as a stray file: the sheet is still given, and
  // asks in the form every tool reads.
  const folder = trial();
  mkdirSync(path.join(folder, "design/tool-stamp.json"), { recursive: true });
  const stray = trial({ "design/tool-stamp.json": "not json\n" });
  for (const dir of [folder, stray]) {
    const result = sheet(dir, NEW);
    assert.equal(
      result.open.find((slot) => slot.id === "principles").ask.item,
      "screen:shelf:principles",
    );
  }
  // No stamp beside a copy of the tool the sheet cannot name, or a tool folder that is a file: an
  // older tool, as far as the sheet can tell.
  const unnamed = trial({ "tools/design-assembly/waiting.mjs": "// an old copy\n" });
  const strayCopy = trial({ "tools/design-assembly": "not a folder\n" });
  for (const dir of [unnamed, strayCopy]) {
    assert.equal(
      sheet(dir, NEW).open.find((slot) => slot.id === "principles").ask.item,
      "screen:shelf:principles",
    );
  }
  // No stamp and no copy of the tool, or a stamp of this version: the shared form.
  const fresh = trial({ "design/tool-stamp.json": stamped("0.26.0") });
  for (const dir of [trial(), fresh]) {
    assert.equal(
      sheet(dir, NEW).open.find((slot) => slot.id === "principles").ask.item,
      "screens:principles",
    );
  }
});

test("the decision sheet takes a shared question and the gate's reader reads it; a shared item it cannot name is refused", () => {
  const dir = trial();
  const ask = (item) =>
    spawnSync(
      execPath,
      [
        DECIDE,
        "--target",
        dir,
        "--ask",
        "Q?",
        "--recommend",
        "R.",
        "--because",
        "B.",
        "--easy-to-undo",
        "--item",
        item,
      ],
      { encoding: "utf8" },
    );
  assert.equal(ask("screens:principles").status, EXIT.work);
  assert.equal(ask("screens:model-changes:Order.shelved+shelveOrder").status, EXIT.work);
  assert.equal(readWaiting(dir).rows.length, 2);
  // A kind every object has is no kind: refused, never a crash of the reader.
  assert.match(ask("constructor:x").stderr, /an item is one of/);
  for (const bad of [
    "screens:kind",
    "screens:model-changes:",
    "screens:model-changes:a b",
    "screens:principles:x",
  ]) {
    const refused = ask(bad);
    assert.equal(refused.status, EXIT.wrong, bad);
    assert.match(refused.stderr, /--item/, bad);
  }
});

// --- 3. The sheet does not hand a builder the last trial's findings -----------------------------

// A note that names a trial, or tells what a builder did, teaches the next builder the test.
const TELLS = [
  /\btrials?\b/i,
  /\bbuilders?\b[^.;:]*?\b(asked|decided|listed|chose|wrote|queued|counted|named|built|did)\b/i,
  /\bplaces to guess\b/i,
];

test("what the sheet prints of its own limits names no trial and tells nothing a builder did", () => {
  const dir = trial();
  const shown = told(dir, NEW);
  const [, blind] = shown.split("what the sheet does not see:\n");
  assert.ok(blind, "the sheet prints no part on what it does not see");
  // Each line is a limit's id, then its note: the ids name a limit for good, and are not read.
  const notes = blind
    .split("\n")
    .map((line) => line.replace(/^ {2}[a-z0-9-]+: /, ""))
    .join("\n");
  for (const pattern of TELLS) assert.doesNotMatch(notes, pattern);
  // The page: every note of the part it does not see.
  const out = path.join(mkdtempSync(path.join(tmpdir(), "design-brief-13-out-")), "page");
  removals.push(() => rmSync(path.dirname(out), { recursive: true, force: true }));
  const called = run([NEW, "--target", dir, "--out", out, "--json"]);
  assert.equal(called.status, EXIT.work, called.stderr);
  const page = readFileSync(path.join(out, "screen-brief.html"), "utf8");
  const [, part] = page.split(/What the sheet does not hold/);
  assert.ok(part, "the page has no part on what the sheet does not hold");
  const words = part.replace(/<code>[a-z0-9-]+<\/code>/g, " ").replace(/<[^>]+>/g, " ");
  for (const pattern of TELLS) assert.doesNotMatch(words, pattern);
});

test("no open limit a sheet or a record prints names a trial or tells what a builder did; the trial stands in where", () => {
  const printed = LIMITS.limits.filter(
    (item) => ["brief", "review", "document"].includes(item.area) && item.status === "open",
  );
  assert.ok(printed.length > 0);
  for (const item of printed) {
    for (const pattern of TELLS) assert.doesNotMatch(item.note, pattern, item.id);
  }
  // Rows that rest on a trial still say so, where a builder does not read it.
  for (const id of ["brief-sheet-narrows-what-the-builder-asks", "brief-not-tried-by-a-builder"]) {
    assert.ok(LIMITS.limits.find((item) => item.id === id).where.includes("trials"), id);
  }
});

test("the sheet of the trial's branch is the same on two different days, byte for byte, with its places and its shared questions", () => {
  const dir = trial();
  queueAll(dir);
  const on = (day, args) =>
    spawnSync(execPath, ["--import", FIXED_DAY, BRIEF, ...args], {
      encoding: "utf8",
      env: { ...env, DESIGN_ASSEMBLY_TEST_DAY: day },
    });
  for (const args of [
    [NEW, "--target", dir, "--json"],
    [NEW, "--target", dir],
    [BUILT, "--target", dir],
  ]) {
    const [one, two] = ["2026-11-21", "2031-02-03"].map((day) => on(day, args));
    assert.ok([EXIT.done, EXIT.work].includes(one.status), one.stderr);
    assert.equal(two.stdout, one.stdout);
    assert.doesNotMatch(one.stdout, /2031-02-03/);
  }
  // And the commit the sheet compares with is untouched by it.
  assert.equal(
    git(dir, "status", "--porcelain", "--untracked-files=no").includes("design/waiting"),
    false,
  );
});
