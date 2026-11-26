// The screen brief (specification 0010, slice 1): one sheet for one screen of the ledger of
// screens, built or declared ahead, with twelve slots. Each slot is settled, with the file and the
// row or line its answer comes from, or open, with why. The repository is never written to, and the
// same repository gives the same sheet on any day. Each test runs the command on a throwaway
// repository that is only read.
import "./helpers/own-cores.mjs";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, lstatSync, mkdtempSync, readdirSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { env, execPath } from "node:process";
import { after, test } from "node:test";
import { fileURLToPath, pathToFileURL } from "node:url";

import { brief, workLeft } from "../scripts/brief.mjs";
import { catalogueProblems, READERS, readCatalogue, SLOT_STATES } from "../scripts/brief-slots.mjs";
import { EXIT } from "../scripts/command.mjs";
import { PARTS, partsOf } from "../scripts/document.mjs";
import { factsOf, PACK_FILE, packOf } from "../scripts/review-pack.mjs";
import { BUILT, briefRepository, DROPS, FILES, PLANNED, WIDTHS } from "./helpers/brief-repo.mjs";
import { canDraw, reviewRepository } from "./helpers/review-repo.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const PLUGIN = path.resolve(HERE, "..");
const BRIEF = path.join(PLUGIN, "scripts/brief.mjs");
const REVIEW = path.join(PLUGIN, "scripts/review.mjs");
const FIXED_DAY = pathToFileURL(path.join(HERE, "helpers/fixed-day.mjs")).href;
const LIMITS = JSON.parse(readFileSync(path.join(PLUGIN, "references/limits.json"), "utf8")).limits;
const CATALOGUE = readCatalogue();
const copy = (data) => JSON.parse(JSON.stringify(data));

const removals = [];
after(() => removals.forEach((remove) => remove()));
const folder = () => {
  const dir = mkdtempSync(path.join(tmpdir(), "design-brief-out-"));
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
// The answer for a machine of one screen of a repository.
const sheet = (dir, id = BUILT) => {
  const called = run([id, "--target", dir, "--json"]);
  assert.ok([EXIT.done, EXIT.work].includes(called.status), called.stderr);
  return JSON.parse(called.stdout);
};
const slotOf = (result, id) => result.slots.find((slot) => slot.id === id);

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
const hashOf = (dir) => createHash("sha256").update(tree(dir).join("\n")).digest("hex");

test("criterion 1: a sheet for a screen that is built and for one declared ahead, and the repository is as it was", () => {
  const dir = sample();
  const before = hashOf(dir);
  for (const [id, status] of [
    [BUILT, "built"],
    [PLANNED, "planned"],
  ]) {
    const result = sheet(dir, id);
    assert.equal(result.screen.id, id);
    assert.equal(result.screen.status, status);
    // The keys specification 0004 lists for a machine, and the two this specification adds.
    for (const key of [
      "screen",
      "kind",
      "reference",
      "components",
      "states",
      "rules",
      "actions",
      "checks",
      "slots",
      "open",
    ]) {
      assert.ok(key in result, `${id}: no ${key}`);
    }
    for (const key of ["components", "states", "rules", "actions", "checks", "slots", "open"]) {
      assert.ok(Array.isArray(result[key]), `${id}: ${key} is not a list`);
    }
    // For a person the same call prints the sheet, not a document for a machine.
    const shown = run([id, "--target", dir]);
    assert.match(shown.stdout, new RegExp(`^screen brief: ${id} `));
    assert.throws(() => JSON.parse(shown.stdout));
  }
  // A document is written where the call says, and nowhere in the repository.
  const out = folder();
  const handed = run([BUILT, "--target", dir, "--json", "--out", out]);
  assert.equal(handed.status, EXIT.work, handed.stderr);
  assert.deepEqual(readdirSync(out), ["screen-brief.html"]);
  assert.equal(hashOf(dir), before);
});

test("criterion 1: a screen the ledger does not have ends with 2 and names the screens it has", () => {
  const dir = sample();
  const called = run(["invoices", "--target", dir, "--json"]);
  assert.equal(called.status, EXIT.wrong);
  assert.equal(called.stdout, "");
  assert.match(called.stderr, /invoices is not a screen of the ledger; it has: orders, returns/);
  // A repository with no ledger of screens has no screen to brief.
  const bare = sample({ "design/screens.yaml": null });
  const none = run([BUILT, "--target", bare]);
  assert.equal(none.status, EXIT.wrong);
  assert.match(none.stderr, /no ledger of screens/);
});

test("criterion 2: every sheet has the twelve slots of the catalogue, in its order, each in one state", () => {
  const dir = sample();
  assert.equal(CATALOGUE.slots.length, 12);
  assert.deepEqual(
    CATALOGUE.slots.map((slot) => slot.number),
    [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
  );
  for (const id of [BUILT, PLANNED]) {
    const result = sheet(dir, id);
    assert.deepEqual(
      result.slots.map((slot) => [slot.number, slot.id, slot.name]),
      CATALOGUE.slots.map((slot) => [slot.number, slot.id, slot.name]),
    );
    for (const slot of result.slots) {
      assert.ok(SLOT_STATES.includes(slot.state), `${slot.id}: ${slot.state}`);
      // This slice asks nothing: a slot is settled, or it is open and says why.
      assert.notEqual(slot.state, "asked", slot.id);
      if (slot.state === "open") assert.ok(slot.why.length > 0, `${slot.id}: open with no why`);
      else assert.ok(slot.answer.length > 0, `${slot.id}: settled with no answer`);
    }
    assert.deepEqual(
      result.open.map((slot) => slot.id),
      result.slots.filter((slot) => slot.state === "open").map((slot) => slot.id),
    );
  }
});

test("criterion 2: a slot of the catalogue that no reader reads, and that no ledger is said not to hold, is red", () => {
  assert.deepEqual(catalogueProblems(CATALOGUE, READERS), []);
  // Each slot says where its answer is read from, or that no ledger holds it.
  for (const slot of CATALOGUE.slots) {
    assert.ok(slot.reads.length > 0 || slot.unheld?.when === "always", slot.id);
  }
  const added = copy(CATALOGUE);
  added.slots.push({
    number: 13,
    id: "motion",
    name: "motion",
    question: "How does the screen move?",
    reads: ["the motion ledger"],
  });
  assert.deepEqual(catalogueProblems(added, READERS), [
    "motion: no reader reads this slot, and the catalogue does not say that no ledger holds it",
  ]);
  // A reader the catalogue has no slot for is red too: its answer would reach no sheet.
  assert.deepEqual(catalogueProblems(CATALOGUE, { ...READERS, motion: () => ({}) }), [
    "motion: a reader with no slot of the catalogue",
  ]);
  // A slot said to be held by no ledger, and read all the same, says two things at once.
  const both = copy(CATALOGUE);
  both.slots.find((slot) => slot.id === "rules").unheld = { when: "always", why: "nothing" };
  assert.deepEqual(catalogueProblems(both, READERS), [
    "rules: said to be held by no ledger, and a reader reads it",
  ]);
  const twice = copy(CATALOGUE);
  twice.slots[1].number = 1;
  assert.deepEqual(catalogueProblems(twice, READERS), [
    "shows: its number is 1, and it stands in place 2",
  ]);
});

// What each slot says of the built screen of the sample when its source is there, a change to one
// line of that source, and what takes the source away.
const SOURCED = [
  {
    slot: "kind",
    says: /kind list/,
    edit: ["design/patterns/list.md", "Find one order", "Find one parcel"],
    drop: DROPS.kind,
    why: /no page .* describes the kind list/,
  },
  {
    slot: "shows",
    says: /Order\.total: number, shown as the column type money/,
    edit: ["ontology/entities/Order.yaml", "display: money", "display: text"],
    drop: DROPS.shows,
    why: /does not say what the screen shows/,
  },
  {
    slot: "actions",
    says: /cancelOrder .*manager/,
    edit: ["ontology/actions.yaml", "roles: [manager]", "roles: [clerk]"],
    drop: DROPS.actions,
    why: /does not say which action opens the screen/,
  },
  {
    slot: "states",
    says: /ready, loading, empty, error, no-results/,
    edit: ["design/states.json", '"no-results"', '"no-results", "ready"'],
    drop: DROPS.states,
    why: /requires error, which the row does not list/,
  },
  {
    slot: "components",
    says: /Button, TypedTable/,
    edit: ["design/component-registry.json", '"TypedTable"', '"DataTable"'],
    drop: DROPS.components,
    why: /no component ledger/,
  },
  {
    slot: "words",
    says: /src\/lib\/labels\.ts/,
    edit: ["design/decisions.yaml", "src/lib/labels.ts", "src/words.ts"],
    drop: DROPS.words,
    why: /no row of the content layer/,
  },
  {
    slot: "rules",
    says: /A screen writes no word itself\./,
    edit: [
      ".claude/rules/design-assembly.md",
      "A screen writes no word itself.",
      "A screen takes every word from one place.",
    ],
    drop: DROPS.rules,
    why: /no rules page/,
  },
  {
    slot: "principles",
    says: /workbench/,
    edit: ["design/blueprint.json", '"direction": "workbench"', '"direction": "editorial"'],
    drop: DROPS.principles,
    why: /fixed no design principle/,
  },
  {
    slot: "widths-and-checks",
    says: /320, 1280/,
    edit: ["design/screen-sizes.json", "1280", "1440"],
    drop: DROPS["widths-and-checks"],
    why: /declares no widths/,
  },
  {
    slot: "model-changes",
    says: /names nothing the data model lacks/,
    edit: ["ontology/actions.yaml", "  - name: cancelOrder", "  - name: voidOrder"],
    drop: DROPS["model-changes"],
    why: /listOrders/,
  },
  {
    slot: "navigation",
    says: /first of 2/,
    edit: ["src/screens.ts", 'path: "/archive"', 'path: "/old"'],
    drop: DROPS.navigation,
    why: /keeps no screen list/,
  },
];

test("each slot with a source is settled where the source is there, and open with a reason where it is not", () => {
  const whole = sheet(sample());
  for (const { slot: id, says, drop, why } of SOURCED) {
    const there = slotOf(whole, id);
    assert.equal(there.state, "settled", `${id}: ${there.why?.join("; ")}`);
    assert.match(there.answer.map((item) => item.says).join("\n"), says, id);
    const gone = slotOf(sheet(sample(drop)), id);
    assert.equal(gone.state, "open", id);
    assert.match(gone.why.join("\n"), why, id);
  }
  // Every slot the catalogue gives a source is in the table above.
  assert.deepEqual(
    SOURCED.map((item) => item.slot),
    CATALOGUE.slots.filter((slot) => slot.reads.length > 0).map((slot) => slot.id),
  );
});

test("criterion 3: each answer names its file and the row or line it comes from, and a changed source line changes the sheet", () => {
  const dir = sample();
  const whole = sheet(dir);
  for (const slot of whole.slots) {
    for (const item of slot.answer) {
      const { source } = item;
      const where = `${slot.id}: «${item.says}»`;
      const full = path.join(dir, source.file);
      assert.ok(existsSync(full), `${where} names ${source.file}`);
      assert.ok(
        source.row !== undefined || source.line !== undefined || source.key !== undefined,
        `${where} names no row, line or key of ${source.file}`,
      );
      // What it names is in the file it names: the row, each row of several, the key, the line.
      const text = readFileSync(full, "utf8");
      for (const row of [source.row, ...(source.rows ?? [])].filter((name) => name !== undefined)) {
        assert.ok(text.includes(row), `${where}: ${source.file} has no ${row}`);
      }
      if (source.key !== undefined) {
        const last = source.key.split(".").at(-1);
        assert.ok(text.includes(last), `${where}: ${source.file} has no ${last}`);
      }
      if (source.line !== undefined) {
        const line = text.split("\n")[source.line - 1];
        assert.ok(line !== undefined, `${where}: ${source.file} has no line ${source.line}`);
        // The line of a key of a page starts with the key.
        if (source.key !== undefined) assert.ok(line.startsWith(`${source.key}:`), where);
      }
    }
  }
  // The line a rule comes from is the line the rules page has it on.
  const rule = slotOf(whole, "rules").answer.find((item) => /writes no word/.test(item.says));
  const page = readFileSync(path.join(dir, rule.source.file), "utf8").split("\n");
  assert.equal(page[rule.source.line - 1], `- ${rule.says}`);
  // The line the screen list names the screen on is the line of its path, comments left out.
  const listed = readFileSync(path.join(dir, "src/screens.ts"), "utf8").split("\n");
  for (const id of ["states", "navigation"]) {
    const from = slotOf(whole, id).answer.find((item) => item.source.file === "src/screens.ts");
    assert.match(listed[from.source.line - 1], /path: "\/",/, id);
  }
  const commented = sample({
    "src/screens.ts": (text) => `// { path: "/", old }\n/* path: "/",\n   gone */\n${text}`,
  });
  const moved = slotOf(sheet(commented), "navigation").answer[0].source.line;
  assert.equal(moved, slotOf(whole, "navigation").answer[0].source.line + 3);
  // A principle's row is its id as the blueprint writes it.
  const fixed = slotOf(whole, "principles").answer[0];
  assert.equal(fixed.source.row, "clear-hierarchy");
  // The row an action's roles come from is the action's row in the data model.
  const cancel = slotOf(whole, "actions").answer.find((item) => /cancelOrder/.test(item.says));
  assert.deepEqual(cancel.source, { file: "ontology/actions.yaml", row: "cancelOrder" });

  for (const { slot: id, edit } of SOURCED) {
    const [file, from, to] = edit;
    const changed = sample({ [file]: (text) => text.replace(from, to) });
    assert.notEqual(readFileSync(path.join(changed, file), "utf8").indexOf(to), -1, id);
    const after = slotOf(sheet(changed), id);
    assert.notDeepEqual(after, slotOf(whole, id), `${id}: the sheet did not follow ${file}`);
  }
});

test("slot 10 is computed: an action or an entity the row names and the data model lacks leaves it open, by name", () => {
  const dir = sample();
  const built = slotOf(sheet(dir, BUILT), "model-changes");
  assert.equal(built.state, "settled");
  const planned = slotOf(sheet(dir, PLANNED), "model-changes");
  assert.equal(planned.state, "open");
  assert.match(planned.why.join("\n"), /refundOrder/);
  assert.match(planned.why.join("\n"), /Return/);
  assert.doesNotMatch(planned.why.join("\n"), /listOrders/);
  // Once the model names them, nothing is left to change.
  const named = sample({
    "ontology/actions.yaml": (text) =>
      `${text}  - name: refundOrder\n    entity: Return\n    kind: update\n    roles: [manager]\n`,
    "ontology/entities/Return.yaml":
      "name: Return\nproperties:\n  id: { type: integer, required: true }\n",
  });
  assert.equal(slotOf(sheet(named, PLANNED), "model-changes").state, "settled");
});

test("a component ledger the repository keeps out of git is read from the source, and the sheet says so", () => {
  const dir = sample({
    "design/component-registry.json": null,
    "design/theme.json": `${JSON.stringify({
      version: 1,
      checks: {
        "component-manifest": [
          {
            kind: "components",
            file: "design/component-registry.json",
            folder: "src/components/ui",
          },
        ],
      },
    })}\n`,
    "src/components/ui/button.tsx":
      "export function Button({ variant }: { variant?: string }) {\n  return <button data-variant={variant} />;\n}\n",
  });
  const before = hashOf(dir);
  const result = sheet(dir);
  const slot = slotOf(result, "components");
  assert.equal(slot.state, "settled");
  assert.match(slot.answer[0].says, /1 component can be used: Button/);
  // The file is not on disk, so the answer names the folder it was read from, and says why.
  assert.equal(slot.answer[0].source.file, "src/components/ui");
  assert.match(
    slot.answer[0].source.note,
    /design\/component-registry\.json, which is not on disk/,
  );
  assert.deepEqual(
    result.components.map((item) => [item.name, item.props]),
    [["Button", ["variant"]]],
  );
  // Reading it writes nothing: the ledger is still not on disk.
  assert.equal(hashOf(dir), before);
});

// The ledger of the sample with the row of its built screen changed.
const withRow = (change) => ({ "design/screens.yaml": change });

test("what a row does not say is open, and never read as nothing needed", () => {
  // A screen declared with its id, route and kind alone.
  const bare = sample(
    withRow((text) =>
      text.replace(
        "    shows:\n      - Order\n    entry: listOrders\n    actions:\n      - cancelOrder\n",
        "",
      ),
    ),
  );
  const result = sheet(bare);
  for (const id of ["shows", "actions", "model-changes"]) {
    assert.equal(slotOf(result, id).state, "open", id);
  }
  assert.match(slotOf(result, "model-changes").why.join("\n"), /does not say/);
  // A value that is not a list is not read as an empty list.
  const scalar = sample(
    withRow((text) => text.replace("    shows:\n      - Order\n", "    shows: Order\n")),
  );
  const one = sheet(scalar);
  assert.equal(slotOf(one, "shows").state, "open");
  assert.match(slotOf(one, "shows").why.join("\n"), /`shows` is not a list/);
  assert.equal(slotOf(one, "model-changes").state, "open");
  // A name every object has is not an entity of the data model.
  const inherited = sample(
    withRow((text) => text.replace("      - Order\n", "      - constructor\n")),
  );
  assert.match(slotOf(sheet(inherited), "model-changes").why.join("\n"), /constructor/);
});

test("slot 3 never says nobody holds an action the data model gives to a role", () => {
  const dir = sample({ "ontology/roles.yaml": null });
  const slot = slotOf(sheet(dir), "actions");
  assert.equal(slot.state, "open");
  assert.match(slot.why.join("\n"), /manager.*ontology\/roles\.yaml does not list/);
  assert.doesNotMatch(slot.answer.map((item) => item.says).join("\n"), /held by no role/);
  // An action the model gives to nobody is said so, and that is what the model says.
  const nobody = sample({
    "ontology/actions.yaml": (text) => text.replace("    roles: [manager]\n", "    roles: []\n"),
  });
  const held = slotOf(sheet(nobody), "actions");
  assert.equal(held.state, "settled");
  assert.match(held.answer.map((item) => item.says).join("\n"), /cancelOrder .*held by no role/);
});

test("an answer that waits on another slot says which, for a person and for a machine", () => {
  const dir = sample();
  const planned = sheet(dir, PLANNED);
  // One thing missing opens one slot: the entity and the action the model lacks open slot 10.
  const waiting = (id) => slotOf(planned, id).answer.filter((item) => item.waits_on !== undefined);
  assert.deepEqual(
    waiting("shows").map((item) => [item.waits_on, /Return/.test(item.says)]),
    [[10, true]],
  );
  assert.deepEqual(
    waiting("actions").map((item) => [item.waits_on, /refundOrder/.test(item.says)]),
    [[10, true]],
  );
  assert.equal(slotOf(planned, "model-changes").state, "open");
  assert.deepEqual(
    sheet(dir, BUILT).slots.flatMap((slot) => slot.answer.filter((item) => item.waits_on)),
    [],
  );
  // With no page of the kind, slot 1 is open and the components slot says the frame waits on it.
  const pageless = sheet(sample({ "design/patterns/list.md": null }));
  assert.equal(slotOf(pageless, "kind").state, "open");
  assert.deepEqual(
    slotOf(pageless, "components")
      .answer.filter((item) => item.waits_on !== undefined)
      .map((item) => [item.waits_on, /frame/.test(item.says)]),
    [[1, true]],
  );
  assert.match(run([PLANNED, "--target", dir]).stdout, /waits on slot 10/);
});

test("a ledger that spells its keys its own way is read by those keys", () => {
  const dir = sample(
    withRow((text) =>
      text
        .replace(
          "version: 1\n",
          "version: 1\nkeys:\n  shows: displays\n  entry: opens_with\n  actions: buttons\n",
        )
        .replaceAll("    shows:\n", "    displays:\n")
        .replaceAll("    entry:", "    opens_with:")
        .replaceAll("    actions:\n", "    buttons:\n"),
    ),
  );
  const result = sheet(dir);
  for (const id of ["shows", "actions", "model-changes"]) {
    assert.equal(slotOf(result, id).state, "settled", id);
  }
  assert.match(result.actions.map((action) => action.name).join(), /listOrders,cancelOrder/);
  const empty = sample(
    withRow((text) => text.replace("    actions:\n      - cancelOrder\n", "    actions: []\n")),
  );
  assert.equal(slotOf(sheet(empty), "actions").answer.at(-1).source.key, "actions");
});

test("a repository that cannot be read is refused by the name of the file, never by a fault of the code", () => {
  for (const components of [
    '{"components": {}}',
    '{"components": [null]}',
    '{"components": "x"}',
  ]) {
    const dir = sample({ "design/component-registry.json": components });
    const called = run([BUILT, "--target", dir, "--json"]);
    assert.equal(called.status, EXIT.wrong, components);
    assert.equal(called.stdout, "", components);
    assert.match(
      called.stderr,
      /^design-assembly: design\/component-registry\.json cannot be read/,
    );
  }
  // A screen that is neither built nor declared ahead has no sheet.
  const retired = sample(withRow((text) => text.replace("status: planned", "status: retired")));
  const gone = run([PLANNED, "--target", retired]);
  assert.equal(gone.status, EXIT.wrong);
  assert.match(gone.stderr, /returns is retired: a brief is of a screen that is built or planned/);
  // A reference screen outside the repository is not one of its files.
  const outside = sample({
    "design/patterns/list.md": (text) =>
      text.replace("tep: src/screens/Orders.tsx", "tep: ../../etc/hosts"),
  });
  const kind = slotOf(sheet(outside), "kind");
  assert.equal(kind.state, "open");
  assert.match(kind.why.join("\n"), /outside the repository/);
  // A row with no route says so.
  const routeless = sample(withRow((text) => text.replace("    route: /\n", "")));
  assert.match(run([BUILT, "--target", routeless]).stdout, /^screen brief: orders \(no route\)/);
});

test("slots 11 and 12 of a screen declared ahead are open, and slot 12 is open on every sheet: no ledger holds them", () => {
  const dir = sample();
  const planned = sheet(dir, PLANNED);
  for (const id of ["navigation", "touched-screens"]) {
    const slot = slotOf(planned, id);
    assert.equal(slot.state, "open", id);
    assert.match(slot.why.join("\n"), /no ledger holds/, id);
    assert.deepEqual(slot.answer, [], id);
  }
  const built = sheet(dir, BUILT);
  assert.equal(slotOf(built, "navigation").state, "settled");
  assert.equal(slotOf(built, "touched-screens").state, "open");
});

test("criterion 6: the rules, the principles and the direction of the sheet are those of the review pack for the same screen", () => {
  const dir = sample();
  const result = sheet(dir);
  // The pack as the review builds it, with no picture drawn: the same reader gives both.
  const pack = packOf(factsOf(dir, BUILT), { shots: [], themes: [], findings: [], unjudged: [] });
  assert.ok(pack.rules.lines.length > 0);
  assert.ok(pack.principles.length > 0);
  assert.deepEqual(result.rules, pack.rules.lines);
  assert.deepEqual(result.principles, pack.principles);
  assert.deepEqual(result.unfixed_principles, pack.unfixed_principles);
  assert.deepEqual(result.direction, pack.direction);
  // What the owner fixed is given apart from the rules, as in the pack: never as a rule line.
  assert.ok(result.rules.every((line) => !/principle-clear-hierarchy/.test(line.text)));
  assert.deepEqual(
    slotOf(result, "rules").answer.map((item) => [item.source.line, item.says]),
    pack.rules.lines.map((line) => [line.line, line.text]),
  );
});

test("criterion 6: the sheet and the pack a review writes of one drawn screen say the same rules, principles and direction", (t) => {
  if (!canDraw()) {
    t.skip("the repository this plugin lives in has no build or browser installed");
    return;
  }
  const made = reviewRepository();
  removals.push(made.remove);
  const out = folder();
  const reviewed = spawnSync(
    execPath,
    [REVIEW, "orders", "--target", made.dir, "--json", "--out", out],
    { encoding: "utf8" },
  );
  if (/Executable doesn't exist|browserType\.launch/.test(reviewed.stderr)) {
    t.skip("the browser of this machine is not installed");
    return;
  }
  assert.ok([EXIT.done, EXIT.work].includes(reviewed.status), reviewed.stderr);
  const pack = JSON.parse(readFileSync(path.join(out, PACK_FILE), "utf8"));
  const result = sheet(made.dir, "orders");
  assert.ok(pack.rules.lines.length > 0);
  assert.deepEqual(result.rules, pack.rules.lines);
  assert.deepEqual(result.principles, pack.principles);
  assert.deepEqual(result.unfixed_principles, pack.unfixed_principles);
  assert.deepEqual(result.direction, pack.direction);
});

test("criterion 7: the same repository on two different days gives the same answer and the same document, byte for byte", () => {
  const dir = sample();
  const days = ["2026-11-21", "2031-02-03"];
  const on = (day, args) =>
    spawnSync(execPath, ["--import", FIXED_DAY, BRIEF, ...args], {
      encoding: "utf8",
      env: { ...env, DESIGN_ASSEMBLY_TEST_DAY: day },
    });
  // The clock of each run does say another day: the test is not green for want of a clock.
  for (const day of days) {
    const told = spawnSync(
      execPath,
      ["--import", FIXED_DAY, "-e", "console.log(new Date().toISOString().slice(0, 10))"],
      { encoding: "utf8", env: { ...env, DESIGN_ASSEMBLY_TEST_DAY: day } },
    );
    assert.equal(told.stdout.trim(), day);
  }
  // The cover of the document is dated by the last commit, not by the clock.
  const git = (...args) =>
    spawnSync("git", ["-c", "user.name=Test", "-c", "user.email=test@example.invalid", ...args], {
      cwd: dir,
      env: {
        ...env,
        GIT_AUTHOR_DATE: "2026-10-05T12:00:00Z",
        GIT_COMMITTER_DATE: "2026-10-05T12:00:00Z",
      },
    });
  git("add", "--all");
  assert.equal(git("commit", "--quiet", "--message", "The sample").status, 0);
  for (const id of [BUILT, PLANNED]) {
    const answers = days.map((day) => on(day, [id, "--target", dir, "--json"]));
    const texts = days.map((day) => on(day, [id, "--target", dir]));
    const pages = days.map((day) => {
      const out = folder();
      const called = on(day, [id, "--target", dir, "--out", out]);
      assert.equal(called.status, EXIT.work, called.stderr);
      return readFileSync(path.join(out, "screen-brief.html"), "utf8");
    });
    assert.equal(answers[0].status, EXIT.work, answers[0].stderr);
    assert.equal(answers[1].stdout, answers[0].stdout, id);
    assert.equal(texts[1].stdout, texts[0].stdout, id);
    assert.equal(pages[1], pages[0], id);
    for (const said of [answers[0].stdout, texts[0].stdout, pages[0]]) {
      assert.doesNotMatch(said, /2026-11-21|2031-02-03/, id);
    }
    assert.match(pages[0], /2026-10-05/, id);
  }
});

test("criterion 8: exit 1 while a slot is open, 2 for a wrong call, and 0 once all twelve are settled", () => {
  const dir = sample();
  // 1: slot 12 is open on every sheet of this slice, so every sheet leaves work for a person.
  for (const mode of [["--json"], []]) {
    assert.equal(run([BUILT, "--target", dir, ...mode]).status, EXIT.work);
    assert.equal(run([PLANNED, "--target", dir, ...mode]).status, EXIT.work);
  }
  // 2: a wrong call prints no answer.
  const wrong = [
    [],
    [BUILT, PLANNED],
    [BUILT, "--no-such-flag"],
    [BUILT, "--format", "pdf"],
    [BUILT, "--out", folder(), "--format", "docx"],
    [BUILT, "--target", path.join(tmpdir(), "design-brief-no-such-folder")],
    ["invoices"],
  ];
  for (const args of wrong) {
    const called = run([...args, "--json"], { cwd: dir });
    assert.equal(called.status, EXIT.wrong, args.join(" "));
    assert.equal(called.stdout, "", args.join(" "));
    assert.match(called.stderr, /^design-assembly: /, args.join(" "));
  }
  // 2: a repository that cannot be read.
  const broken = sample({ "design/blueprint.json": "{ not json" });
  assert.equal(run([BUILT, "--target", broken]).status, EXIT.wrong);
  // 0: no ledger holds slot 12, so no repository reaches a sheet with nothing open in this slice.
  // The same readers, run in a process of their own over the slots a ledger does hold, settle
  // every one for the built screen of the sample, and the call then ends with 0.
  const held = { ...CATALOGUE, slots: CATALOGUE.slots.filter((slot) => slot.reads.length > 0) };
  const script = [
    `import { brief, report, workLeft } from ${JSON.stringify(pathToFileURL(BRIEF).href)};`,
    `import { finish } from ${JSON.stringify(pathToFileURL(path.join(PLUGIN, "scripts/command.mjs")).href)};`,
    `const result = brief(${JSON.stringify(dir)}, ${JSON.stringify(BUILT)}, { catalogue: ${JSON.stringify(held)} });`,
    "finish({ json: true, result, text: report(result), work: workLeft(result) });",
  ].join("\n");
  const done = spawnSync(execPath, ["--input-type=module", "-e", script], { encoding: "utf8" });
  assert.equal(done.status, EXIT.done, done.stderr);
  const result = JSON.parse(done.stdout);
  assert.equal(result.slots.length, 11);
  assert.deepEqual(result.open, []);
  assert.ok(result.slots.every((slot) => slot.state === "settled"));
  // With the whole catalogue the same screen leaves work, and the answer says which slot.
  const whole = brief(dir, BUILT);
  assert.equal(workLeft(whole), true);
  assert.deepEqual(
    whole.open.map((slot) => slot.id),
    ["touched-screens"],
  );
});

test("criterion 11: the sheet is set on the six-part frame, asks the owner for each open slot, and says what it did not see", () => {
  const dir = sample();
  const out = folder();
  const called = run([PLANNED, "--target", dir, "--json", "--out", out]);
  const result = JSON.parse(called.stdout);
  assert.deepEqual(result.files, [{ path: path.join(out, "screen-brief.html"), change: "create" }]);
  const html = readFileSync(path.join(out, "screen-brief.html"), "utf8");
  assert.deepEqual(
    partsOf(html).map((part) => part.id),
    PARTS,
  );
  const part = (id) =>
    html.slice(
      html.indexOf(`data-part="${id}"`),
      PARTS.indexOf(id) + 1 < PARTS.length
        ? html.indexOf(`data-part="${PARTS[PARTS.indexOf(id) + 1]}"`)
        : html.length,
    );
  // The page for the person who decides asks one thing for each open slot.
  assert.ok(result.open.length >= 3);
  for (const slot of result.open) {
    assert.ok(part("decision").includes(`Slot ${slot.number}`), `slot ${slot.number}`);
  }
  // The twelve slots stand on the page, each with its state.
  for (const slot of result.slots) {
    assert.ok(part("findings").includes(`${slot.number} · `), `slot ${slot.number}`);
  }
  // What it did not see: every open limit of the area, and of every document.
  const open = (area) => LIMITS.filter((row) => row.area === area && row.status === "open");
  assert.ok(open("brief").length > 0);
  for (const limit of [...open("brief"), ...open("document")]) {
    assert.ok(part("blind").includes(limit.id), limit.id);
  }
  // The text for a person names the same limits.
  const shown = run([PLANNED, "--target", dir]).stdout;
  for (const limit of open("brief")) assert.ok(shown.includes(limit.id), limit.id);
});

test("a screen kept in a file of its own is read from that file, and a planned screen needs no built one beside it", () => {
  const rows = (text) => text.slice(text.indexOf("  - id: returns"));
  const own = rows(FILES["design/screens.yaml"])
    .split("\n")
    .map((line) => line.replace(/^ {2}(- | {2})/, ""))
    .join("\n");
  const dir = sample({
    "design/screens.yaml": null,
    "design/screens/_shared.yaml":
      "version: 1\nstatuses:\n  - built\n  - planned\n# screens: one file per screen beside this one, each named after the screen's id\n",
    "design/screens/returns.yaml": own,
  });
  const result = sheet(dir, PLANNED);
  assert.equal(result.screen.status, "planned");
  assert.equal(slotOf(result, "kind").answer[0].source.file, "design/screens/returns.yaml");
  assert.deepEqual(result.widths, WIDTHS);
});
