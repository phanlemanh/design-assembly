// What the first builder trial with the brief pointed at (trial 12 of the screen role), each as
// the trial's own situation on a throwaway repository. The sheet says that its twelve slots are
// not every question of the screen, and names where other choices hide, read from the repository.
// A slot is not settled by what the branch has just written: the sheet compares with where the
// branch left the main one, and says what it could not compare. The other screens a screen touches
// are recommended from what the rows and the data model say. A question that waits is held
// against what stands in the repository now, where that can be read. The kind slot does not give
// the reference screen's job as the screen's own, and the decision sheet takes no question about
// a slot of a screen the ledger of screens does not have.
import "./helpers/own-cores.mjs";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import { env, execPath } from "node:process";
import { after, test } from "node:test";
import { fileURLToPath, pathToFileURL } from "node:url";

import { rulesPage } from "../scripts/apply.mjs";
import { readCatalogue } from "../scripts/brief-slots.mjs";
import { EXIT } from "../scripts/command.mjs";
import { WAITING_FOLDER } from "../templates/tools/design-assembly/waiting.mjs";
import {
  branchRepository,
  briefRepository,
  BUILT,
  commitAll,
  git,
  lines,
  PLANNED,
  row,
} from "./helpers/brief-repo.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const PLUGIN = path.resolve(HERE, "..");
const BRIEF = path.join(PLUGIN, "scripts/brief.mjs");
const DECIDE = path.join(PLUGIN, "scripts/decide.mjs");
const FIXED_DAY = pathToFileURL(path.join(HERE, "helpers/fixed-day.mjs")).href;
const CATALOGUE = readCatalogue();
const recommendOf = (id) => CATALOGUE.slots.find((slot) => slot.id === id).ask.recommend;
// The screen the builder of the trial adds: a second list of the records the built screen lists.
const NEW = "shelf";

const removals = [];
after(() => removals.forEach((remove) => remove()));
const keep = (made) => {
  removals.push(made.remove);
  return made.dir;
};
const run = (args, options = {}) =>
  spawnSync(execPath, [BRIEF, ...args], { encoding: "utf8", ...options });
const sheet = (dir, id, more = []) => {
  const called = run([id, "--target", dir, "--json", ...more]);
  assert.ok([EXIT.done, EXIT.work].includes(called.status), called.stderr);
  return JSON.parse(called.stdout);
};
const told = (dir, id, more = []) => {
  const called = run([id, "--target", dir, ...more]);
  assert.ok([EXIT.done, EXIT.work].includes(called.status), called.stderr);
  return called.stdout;
};
const slotOf = (result, id) => result.slots.find((slot) => slot.id === id);
const edit = (dir, file, change) =>
  writeFileSync(path.join(dir, file), change(readFileSync(path.join(dir, file), "utf8")));

// What the builder of the trial did before it ran the sheet: a field and two actions added to the
// data model, then the new screen entered in the ledger of screens, declared ahead. One of the
// two actions is pressed on the new screen; the other can only be pressed on the built one.
function builderWrites(dir) {
  edit(dir, "ontology/entities/Order.yaml", (text) =>
    lines(text.trimEnd(), "  shelved: { type: boolean, required: true, display: text }"),
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
  edit(dir, "design/screens.yaml", (text) =>
    lines(
      text.trimEnd(),
      ...row({
        id: NEW,
        route: "/shelf",
        status: "planned",
        shows: "Order",
        actions: "restoreOrder",
      }),
    ),
  );
}
const trial = (change) => {
  const dir = keep(branchRepository(change));
  builderWrites(dir);
  return dir;
};

// --- 1. The sheet does not narrow what a builder asks -------------------------------------------

test("the sheet says its twelve slots are not every question of the screen, for a person, for a machine and on the page", () => {
  const dir = trial();
  const result = sheet(dir, NEW);
  // For a machine: the statement, the call that asks any other choice, and where such choices
  // hide on this screen.
  assert.match(result.beyond.note, /twelve slots/);
  assert.match(result.beyond.note, /not every question of this screen/);
  assert.match(result.beyond.note, /decide --ask/);
  assert.match(result.beyond.ask, /^\/design-assembly:decide --ask /);
  assert.match(result.beyond.call, /decide\.mjs/);
  assert.match(result.beyond.call, /--ask /);
  assert.ok(Array.isArray(result.beyond.places));
  // For a person at a terminal.
  const shown = told(dir, NEW);
  assert.match(shown, /beyond the twelve slots/);
  assert.ok(shown.includes(result.beyond.note));
  // On the page.
  const out = path.join(dir, "..", `${path.basename(dir)}-out`);
  removals.push(() => rmSync(out, { recursive: true, force: true }));
  const called = run([NEW, "--target", dir, "--out", out]);
  assert.equal(called.status, EXIT.work, called.stderr);
  const page = readFileSync(path.join(out, "screen-brief.html"), "utf8");
  assert.match(page, /not every question of this screen/);
});

test("a sheet whose open slots were queued still tells the builder to ask what the slots do not hold", () => {
  const dir = trial();
  const queued = run([NEW, "--target", dir, "--queue"]);
  assert.equal(queued.status, EXIT.work, queued.stderr);
  assert.match(queued.stdout, /queued: \d+ questions/);
  // Right where it says what was queued: these are the slots' questions, and no more.
  const [head] = queued.stdout.split("screen brief:");
  assert.match(head, /a choice of this screen that is on no slot is not among them/);
  assert.match(head, /decide --ask/);
  assert.match(queued.stdout, /beyond the twelve slots/);
  // And once nothing is open any more, the sheet still says so.
  const again = sheet(dir, NEW);
  assert.equal(again.summary.open, 0);
  assert.match(again.beyond.note, /not every question of this screen/);
  assert.match(told(dir, NEW), /nothing open on this sheet does not mean nothing is left to ask/);
});

test("the sheet names where other choices hide, each read from the repository and none made up", () => {
  const dir = trial();
  const result = sheet(dir, NEW);
  const placeOf = (slot) => result.beyond.places.filter((place) => place.slot === slot);
  // Words: the concept this branch adds needs a name and a word for a reader, and no place the
  // repository keeps its words in names it yet.
  const [words] = placeOf("words");
  assert.match(words.says, /restoreOrder/);
  assert.match(words.says, /shelved/);
  assert.match(words.says, /src\/lib\/labels\.ts|design\/terms\.json/);
  assert.equal(words.number, 6);
  // Components: which variant a control takes is on no slot; the ledger says which have any.
  const [components] = placeOf("components");
  assert.match(components.says, /Button/);
  assert.match(components.says, /variant/);
  // Kind: what a person comes to this screen for is written nowhere.
  assert.equal(placeOf("kind").length, 1);
  // Each place says where it was read.
  for (const place of result.beyond.places) assert.ok(place.source?.file, place.slot);
  // A row of the content layer whose source is words, not a file, names no place to look in.
  const worded = trial({
    "design/decisions.yaml": (text) =>
      lines(
        text.trimEnd(),
        "  - id: tone",
        "    layer: content",
        "    kind: judgment",
        '    source: "e.g. plain verbs on every button"',
      ),
  });
  const [said] = sheet(worded, NEW).beyond.places.filter((place) => place.slot === "words");
  assert.match(said.says, /\(src\/lib\/labels\.ts, design\/terms\.json\)/);
  // A source that names a folder is not read as a file: the sheet is still given.
  const foldered = trial({
    "design/decisions.yaml": (text) => text.replace("design/terms.json", "design/words.d"),
    "design/words.d/en.json": "{}\n",
  });
  assert.equal(
    sheet(foldered, NEW).beyond.places.filter((place) => place.slot === "words").length,
    1,
  );
  // A repository whose words name the concept, and whose components have no variant, has neither
  // place: nothing is listed that the repository does not show.
  const quiet = keep(
    branchRepository({
      "design/component-registry.json": (text) =>
        JSON.stringify({
          ...JSON.parse(text),
          components: JSON.parse(text).components.map((item) =>
            Object.fromEntries(Object.entries(item).filter(([key]) => key !== "variants")),
          ),
        }),
      "src/lib/labels.ts":
        "export const LABELS = { restoreOrder: 'Restore', shelveOrder: 'Shelve', shelved: 'Shelved' };\n",
    }),
  );
  builderWrites(quiet);
  const other = sheet(quiet, NEW);
  assert.deepEqual(
    other.beyond.places.filter((place) => ["words", "components"].includes(place.slot)),
    [],
  );
});

test("the rules page says the sheet is not every question, and points at the decision sheet for the rest", () => {
  const page = rulesPage(
    {
      "screen-ledger": [{ kind: "screen-ledger" }],
      "decision-sheet": [{ kind: "decision-sheet" }],
    },
    () => false,
  );
  const [opening] = page.split("\n## ");
  assert.match(opening, /\/design-assembly:brief <screen id>/);
  assert.match(opening.replace(/\s+/g, " "), /not every question of (the|this) screen/);
  assert.match(opening.replace(/\s+/g, " "), /Questions only the owner answers/);
  // With no decision sheet held there is no such section to point at: the call is named instead.
  const bare = rulesPage({ "screen-ledger": [{ kind: "screen-ledger" }] }, () => false);
  const [first] = bare.split("\n## ");
  assert.match(first.replace(/\s+/g, " "), /not every question of (the|this) screen/);
  assert.doesNotMatch(first, /Questions only the owner answers/);
  assert.match(first, /decide --ask/);
});

// --- 2. A slot is not settled by what the branch has just written -------------------------------

test("what the builder added to the data model a minute ago opens slot 10, by name, and the question asks its shape", () => {
  const dir = trial();
  // Nothing is committed yet, as in the trial: the working tree is compared with the main branch.
  const result = sheet(dir, NEW);
  assert.equal(result.branch.compared, true);
  assert.equal(result.branch.main, "main");
  const model = slotOf(result, "model-changes");
  assert.equal(model.state, "open");
  const why = model.why.join(" ");
  assert.match(why, /this branch/);
  for (const name of ["restoreOrder", "shelveOrder", "Order.shelved"]) {
    assert.ok(why.includes(name), name);
  }
  // What was there before the branch is not named.
  assert.doesNotMatch(why, /cancelOrder|Order\.total/);
  assert.deepEqual(
    result.model_changes.written.map((item) => `${item.change} ${item.what} ${item.name}`),
    ["added action shelveOrder", "added action restoreOrder", "added field Order.shelved"],
  );
  assert.deepEqual(result.model_changes.actions, []);
  // The question says what was written, and the recommendation is about what is written, not
  // about adding it.
  const [open] = result.open.filter((slot) => slot.id === "model-changes");
  assert.match(open.ask.question, /restoreOrder/);
  assert.match(open.ask.recommendation, /shape/);
  assert.notEqual(open.ask.recommendation, recommendOf("model-changes"));
  assert.ok(open.call.includes(open.ask.recommendation.replace(/'/g, "'\\''")));
  // The same record is shown by the built screen, so its sheet opens the slot too, with the same
  // names: one question a screen that shows the record.
  const shared = slotOf(sheet(dir, BUILT), "model-changes");
  assert.equal(shared.state, "open");
  assert.ok(shared.why.join(" ").includes("shelveOrder"));
  // Committed on the branch, it is still this branch's: the sheet compares with where the branch
  // left the main one, not with the last commit.
  commitAll(dir, "The builder's work");
  const committed = sheet(dir, NEW);
  assert.equal(slotOf(committed, "model-changes").state, "open");
  assert.deepEqual(committed.branch, { compared: true, main: "main", on_main: false, why: null });
  // Once the main branch has it, the repository has settled it.
  git(dir, "branch", "--force", "main", "work");
  const merged = sheet(dir, NEW);
  assert.equal(slotOf(merged, "model-changes").state, "settled");
  assert.equal(merged.branch.on_main, true);
});

test("a change to a field that was there is this branch's too, and what has nothing to do with the screen is left out", () => {
  const dir = keep(
    branchRepository({
      "ontology/entities/Parcel.yaml": lines(
        "name: Parcel",
        "properties:",
        "  id: { type: integer }",
      ),
    }),
  );
  // The other shape the trial's builder could have taken: a new value of a field that is there.
  edit(dir, "ontology/entities/Order.yaml", (text) =>
    text.replace("customer: { type: string,", "customer: { type: text,"),
  );
  edit(dir, "ontology/entities/Parcel.yaml", (text) =>
    lines(text.trimEnd(), "  weight: { type: number }"),
  );
  const result = sheet(dir, BUILT);
  const model = slotOf(result, "model-changes");
  assert.equal(model.state, "open");
  assert.match(model.why.join(" "), /changes the field Order\.customer/);
  assert.doesNotMatch(model.why.join(" "), /Parcel/);
  // The same field written with its keys in another order is the same field: nothing changed.
  edit(dir, "ontology/entities/Order.yaml", (text) =>
    text
      .replace("customer: { type: text,", "customer: { type: string,")
      .replace(
        "total: { type: number, required: true, display: money }",
        "total: { display: money, required: true, type: number }",
      ),
  );
  assert.equal(slotOf(sheet(dir, BUILT), "model-changes").state, "settled");
});

test("a line read from what this branch wrote says so, in the row and in the data model, and the slot stays settled", () => {
  const dir = trial();
  commitAll(dir, "The builder's first step");
  const result = sheet(dir, NEW);
  // The row is new on the branch: every line read from it is the branch's own. So is the line of
  // a field or an action the branch wrote into the data model.
  const marked = ["kind", "shows", "actions", "states", "words"];
  for (const id of marked) {
    const slot = slotOf(result, id);
    assert.equal(slot.state, "settled", id);
    assert.equal(slot.written_on_branch, true, id);
    for (const item of slot.answer.filter((line) => line.source.row === NEW)) {
      assert.equal(item.source.branch, "new", id);
    }
  }
  const branchOf = (id, row) =>
    slotOf(result, id).answer.find((item) => item.source.row === row).source.branch;
  assert.equal(branchOf("shows", "shelved"), "new");
  assert.equal(branchOf("shows", "total"), undefined);
  assert.equal(branchOf("actions", "restoreOrder"), "new");
  assert.equal(branchOf("actions", "listOrders"), undefined);
  assert.deepEqual(
    result.slots.filter((slot) => slot.written_on_branch).map((slot) => slot.id),
    marked,
  );
  assert.equal(result.summary.settled_on_branch, marked.length);
  const shown = told(dir, NEW);
  assert.match(shown, /row shelf, `states`, written on this branch/);
  assert.match(shown, /compared with where this branch left main/);
  assert.match(shown, /5 of the settled slots rest on what this branch wrote/);
  // The built screen's row was there before the branch: only the field the branch gave the
  // record it shows is marked.
  const built = sheet(dir, BUILT);
  assert.deepEqual(
    built.slots.filter((slot) => slot.written_on_branch).map((slot) => slot.id),
    ["shows"],
  );
  // One key of a row that was there, changed on the branch, is marked alone.
  edit(dir, "design/screens.yaml", (text) =>
    text.replace("      - cancelOrder\n", "      - cancelOrder\n      - shelveOrder\n"),
  );
  const changed = sheet(dir, BUILT);
  const buttons = slotOf(changed, "actions").answer.filter((item) => item.source.key === "actions");
  assert.equal(slotOf(changed, "actions").written_on_branch, true);
  assert.equal(slotOf(changed, "states").written_on_branch, undefined);
  assert.ok(buttons.every((item) => item.source.branch === "changed"));
});

test("a repository with no git, with no commit, or on its main branch still gets a sheet, which says what it could not compare", () => {
  // No git at all.
  const bare = trial();
  rmSync(path.join(bare, ".git"), { recursive: true, force: true });
  const none = sheet(bare, NEW);
  assert.equal(none.branch.compared, false);
  assert.match(none.branch.why, /not a git repository/);
  assert.equal(slotOf(none, "model-changes").state, "settled");
  assert.match(told(bare, NEW), /not compared with a main branch: .*not a git repository/);
  assert.ok(slotOf(none, "shows").answer.every((item) => item.source.branch === undefined));
  // No commit yet.
  const unborn = keep(briefRepository());
  const first = sheet(unborn, PLANNED);
  assert.equal(first.branch.compared, false);
  assert.match(first.branch.why, /no commit/);
  // On the main branch: what is committed there is the repository's, and only what is not
  // committed yet is compared.
  const onMain = keep(branchRepository());
  git(onMain, "checkout", "--quiet", "main");
  builderWrites(onMain);
  const dirty = sheet(onMain, NEW);
  assert.deepEqual(dirty.branch, {
    compared: true,
    main: "main",
    on_main: true,
    why: "nothing is committed past main here: only what is not committed yet is compared",
  });
  assert.equal(slotOf(dirty, "model-changes").state, "open");
  commitAll(onMain, "Straight on main");
  const clean = sheet(onMain, NEW);
  assert.equal(slotOf(clean, "model-changes").state, "settled");
  assert.match(told(onMain, NEW), /nothing is committed past main here/);
  // No main branch git knows: said, not failed.
  const lone = keep(branchRepository());
  git(lone, "branch", "--quiet", "--delete", "--force", "main");
  const alone = sheet(lone, BUILT);
  assert.equal(alone.branch.compared, false);
  assert.match(alone.branch.why, /no main branch/);
});

test("a target that is a folder of a larger git repository is compared the same way", () => {
  const made = branchRepository({}, { under: "apps/web" });
  const dir = keep(made);
  builderWrites(dir);
  // Something outside the folder changes too: it is not the folder's, and is not read.
  writeFileSync(path.join(made.root, "README.md"), "Outside.\n");
  const result = sheet(dir, NEW);
  assert.equal(result.branch.compared, true);
  assert.deepEqual(
    result.model_changes.written.map((item) => item.name),
    ["shelveOrder", "restoreOrder", "Order.shelved"],
  );
  assert.equal(slotOf(result, "states").answer[0].source.branch, "new");
  assert.equal(slotOf(sheet(dir, BUILT), "states").written_on_branch, undefined);
});

test("the sheet of a branch is the same on two different days, byte for byte", () => {
  const dir = trial();
  const on = (day, args) =>
    spawnSync(execPath, ["--import", FIXED_DAY, BRIEF, ...args], {
      encoding: "utf8",
      env: { ...env, DESIGN_ASSEMBLY_TEST_DAY: day },
    });
  const days = ["2026-11-21", "2031-02-03"];
  for (const args of [
    [NEW, "--target", dir, "--json"],
    [NEW, "--target", dir],
    [BUILT, "--target", dir],
  ]) {
    const [one, two] = days.map((day) => on(day, args));
    assert.equal(one.status, EXIT.work, one.stderr);
    assert.equal(two.stdout, one.stdout);
    assert.doesNotMatch(one.stdout, /2026-11-21|2031-02-03/);
  }
});

// --- 3. Slot 12 recommends from what the sheet reads --------------------------------------------

test("a screen that cannot work unless another changes is not told to change no other screen", () => {
  const dir = trial();
  const result = sheet(dir, NEW);
  const [open] = result.open.filter((slot) => slot.id === "touched-screens");
  const { recommendation, basis } = open.ask;
  assert.doesNotMatch(recommendation, /Change no other screen/);
  // Which screens to look at, and what for: the action of the data model no screen has a button
  // for, on a record this screen shows.
  assert.match(recommendation, new RegExp(`\\b${BUILT}\\b`));
  assert.match(basis.text, /shelveOrder/);
  assert.match(basis.text, /no screen of the ledger has a button for/);
  // The action the new screen brings changes a record the built screen shows too.
  assert.match(basis.text, /restoreOrder/);
  assert.equal(basis.kind, "measurement");
  assert.ok(open.call.includes("--recommend"));
});

test("where no other screen names what this one names, the recommendation is still to change none", () => {
  // A second screen that shows another record and opens with another action.
  const dir = keep(
    branchRepository({
      "ontology/entities/Parcel.yaml": lines(
        "name: Parcel",
        "properties:",
        "  id: { type: integer }",
      ),
      "ontology/actions.yaml": (text) =>
        lines(
          text.trimEnd(),
          "  - name: listParcels",
          "    entity: Parcel",
          "    kind: query",
          "    roles: [clerk]",
        ),
    }),
  );
  edit(dir, "design/screens.yaml", (text) =>
    lines(
      text.trimEnd(),
      "  - id: parcels",
      "    route: /parcels",
      "    title: parcelsTitle",
      "    family: list",
      "    status: planned",
      "    shows:",
      "      - Parcel",
      "    entry: listParcels",
      "    actions: []",
      "    states: [ready, loading, empty, error, no-results]",
    ),
  );
  const result = sheet(dir, "parcels");
  const [open] = result.open.filter((slot) => slot.id === "touched-screens");
  assert.equal(open.ask.recommendation, recommendOf("touched-screens"));
  assert.match(open.ask.basis.text, /none names an action or an entity this screen names/);
});

// A question about a slot, as the trial's builder queued it: with the recommendation the list of
// slots had then.
function ask(dir, screen, slot, recommendation) {
  const called = spawnSync(
    execPath,
    [
      DECIDE,
      "--target",
      dir,
      "--ask",
      `About ${slot} of ${screen}?`,
      "--recommend",
      recommendation,
      "--because",
      "What the sheet read.",
      "--easy-to-undo",
      "--item",
      `screen:${screen}:${slot}`,
      "--id",
      `screen-${screen}-${slot}`,
      "--on",
      "2026-11-21",
    ],
    { encoding: "utf8" },
  );
  // A question waits once it is asked: the decision sheet ends with work left.
  assert.equal(called.status, EXIT.work, called.stderr);
}

test("a sheet run after building says where what stands now goes against a recommendation that waits", () => {
  const dir = trial();
  commitAll(dir, "The builder's first step");
  ask(dir, NEW, "touched-screens", recommendOf("touched-screens"));
  ask(dir, NEW, "navigation", recommendOf("navigation"));
  // Nothing built yet: nothing goes against either.
  const before = sheet(dir, NEW);
  assert.deepEqual(slotOf(before, "touched-screens").asked.against, []);
  assert.deepEqual(slotOf(before, "navigation").asked.against, []);
  // The builder builds: the built screen gains the new action, in its row and in its source, and
  // the new screen goes into the screen list before another screen, not last.
  edit(dir, "design/screens.yaml", (text) =>
    text
      .replace("      - cancelOrder\n", "      - cancelOrder\n      - shelveOrder\n")
      .replace("status: planned", "status: built"),
  );
  edit(dir, "src/screens/Orders.tsx", (text) => `${text}// offers shelveOrder\n`);
  writeFileSync(path.join(dir, "src/screens/Shelf.tsx"), "export const Shelf = () => null;\n");
  edit(dir, "src/screens.ts", (text) =>
    text.replace(
      '  {\n    path: "/archive",',
      '  {\n    path: "/shelf",\n    load: () => import("@/screens/Shelf").then((m) => m.Shelf),\n    states: [{ name: "ready", shows: "Shelf" }],\n  },\n  {\n    path: "/archive",',
    ),
  );
  const result = sheet(dir, NEW);
  // Slot 12: asked, and the branch changed another screen while the recommendation says none.
  const touched = slotOf(result, "touched-screens");
  assert.equal(touched.state, "asked");
  assert.equal(touched.asked.against.length, 1);
  assert.match(touched.asked.against[0], new RegExp(`\\b${BUILT}\\b`));
  assert.match(touched.asked.against[0], /its row/);
  assert.match(touched.asked.against[0], /src\/screens\/Orders\.tsx/);
  // Slot 11: the repository now says where the screen stands, so the slot is settled; the question
  // still waits, and its recommendation was the last place.
  const navigation = slotOf(result, "navigation");
  assert.equal(navigation.state, "settled");
  assert.equal(navigation.waits.id, `screen-${NEW}-navigation`);
  assert.equal(navigation.waits.recommendation, recommendOf("navigation"));
  assert.equal(navigation.waits.against.length, 1);
  assert.match(navigation.waits.against[0], /second of 3/);
  // For a person: said where the slot is, and counted at the top.
  const shown = told(dir, NEW);
  assert.match(shown, /goes against the recommendation that waits/);
  assert.match(shown, /2 questions that wait recommend what the repository no longer does/);
  assert.equal(result.summary.against, 2);
  // Another screen this branch adds is a screen of its own, not one this screen changed.
  edit(dir, "design/screens.yaml", (text) =>
    lines(
      text.trimEnd(),
      ...row({
        id: "late",
        route: "/late",
        status: "planned",
        shows: "Order",
        actions: "cancelOrder",
      }),
    ),
  );
  const [still] = slotOf(sheet(dir, NEW), "touched-screens").asked.against;
  assert.doesNotMatch(still, /\blate\b/);
  // A recommendation in other words is not judged: what changed is said, and not called against.
  rmSync(path.join(dir, WAITING_FOLDER, `screen-${NEW}-touched-screens.json`));
  ask(dir, NEW, "touched-screens", "Give the list of orders a button for it.");
  const other = slotOf(sheet(dir, NEW), "touched-screens");
  assert.deepEqual(other.asked.against, []);
  assert.match(other.asked.now.join(" "), new RegExp(`\\b${BUILT}\\b`));
  assert.doesNotMatch(other.asked.now.join(" "), /\blate\b/);
  // It is what the branch holds against the main one, whenever the question was asked: the sheet
  // does not say it happened after.
  const worded = told(dir, NEW);
  assert.match(worded, /stands now, beside the recommendation that waits: this branch changes/);
  assert.doesNotMatch(worded, /since the question was asked/);
});

// --- 4. The kind slot --------------------------------------------------------------------------

test("the kind slot gives the job of the reference screen as that screen's, never as this screen's own", () => {
  const dir = trial();
  const job = "Find one order in the list, then act on it";
  const mine = slotOf(sheet(dir, NEW), "kind").answer.map((item) => item.says);
  const line = mine.find((says) => says.includes(job));
  assert.match(line, /the reference screen/);
  assert.match(line, /src\/screens\/Orders\.tsx/);
  assert.match(line, /not said of this screen/);
  assert.ok(mine.every((says) => !/What a person comes to a screen of this kind for/.test(says)));
  // The reference screen itself: the job is its own.
  const reference = slotOf(sheet(dir, BUILT), "kind").answer.map((item) => item.says);
  assert.ok(reference.some((says) => says === `What a person comes to this screen for: ${job}`));
  const result = sheet(dir, NEW);
  assert.equal(result.kind.task, job);
  assert.equal(result.kind.task_of, "src/screens/Orders.tsx");
});

// --- 5. The decision sheet takes no question about a screen the ledger does not have ------------

test("decide --ask refuses a question about a slot of a screen the ledger of screens does not have", () => {
  const dir = keep(briefRepository());
  const asking = (item, target = dir) =>
    spawnSync(
      execPath,
      [
        DECIDE,
        "--target",
        target,
        "--ask",
        "Where does it go?",
        "--recommend",
        "Last.",
        "--because",
        "The order as it stands.",
        "--easy-to-undo",
        "--item",
        item,
      ],
      { encoding: "utf8" },
    );
  const waiting = () =>
    existsSync(path.join(dir, WAITING_FOLDER)) ? readdirSync(path.join(dir, WAITING_FOLDER)) : [];
  const refused = asking("screen:nowhere:navigation");
  assert.equal(refused.status, EXIT.wrong, refused.stdout);
  assert.match(refused.stderr, /nowhere is not a screen of the ledger of screens/);
  assert.match(refused.stderr, new RegExp(`it has: ${BUILT}, ${PLANNED}`));
  assert.match(refused.stderr, /Nothing was written/);
  assert.deepEqual(waiting(), []);
  // A screen the ledger has is asked as before.
  const taken = asking(`screen:${PLANNED}:navigation`);
  assert.equal(taken.status, EXIT.work, taken.stderr);
  assert.deepEqual(waiting(), [`screen-${PLANNED}-navigation.json`]);
  // A repository with no ledger of screens has no screen to ask about.
  const bare = keep(briefRepository({ "design/screens.yaml": null }));
  const none = asking(`screen:${BUILT}:navigation`, bare);
  assert.equal(none.status, EXIT.wrong, none.stdout);
  assert.match(none.stderr, /no ledger of screens/);
  // A ledger of screens that cannot be read is a refusal that names it, not a fault of the code.
  const broken = keep(briefRepository({ "design/screens.yaml": "screens: [\n  - id: {\n" }));
  const unread = asking(`screen:${BUILT}:navigation`, broken);
  assert.equal(unread.status, EXIT.wrong, unread.stdout);
  assert.match(unread.stderr, /design\/screens\.yaml/);
  assert.doesNotMatch(unread.stderr, /\n\s+at /);
  // Another kind of item is not looked up among the screens.
  assert.equal(asking("decision:labels").status, EXIT.work);
});
