// The ledger of screens joined with the domain model: an action offered to nobody who may run it,
// a record shown to a role that may not view it, and a button no role that opens the screen may
// press each fail; what the model or the ledger plans for later is listed as a debt.
import assert from "node:assert/strict";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { env } from "node:process";
import { test } from "node:test";

import {
  modelOf,
  offersOf,
  readModel,
  screenActions,
  screenActionsDebts,
  screenActionsProblem,
  screenTable,
} from "../templates/tools/design-assembly/screen-actions.mjs";
import { runChecks } from "../templates/tools/design-assembly/check.mjs";
import {
  readScreenLedger,
  renderScreenLedger,
} from "../templates/tools/design-assembly/screen-ledger.mjs";

const ROLES = [{ name: "agent" }, { name: "lead", inherits: ["agent"] }, { name: "admin" }];

const ACTIONS = [
  { name: "viewOrders", entity: "Order", kind: "query", roles: ["agent"] },
  { name: "createOrder", entity: "Order", kind: "create", roles: ["agent"] },
  { name: "removeOrder", entity: "Order", kind: "delete", roles: ["lead"] },
  { name: "listMembers", entity: "Member", kind: "query", roles: ["admin"] },
  { name: "inviteMember", entity: "Member", kind: "create", roles: ["admin"] },
];

const ENTITIES = { Order: {}, Member: {}, OrderLine: { lifecycle: { via: "Order" } } };

const LEDGER = {
  screens: [
    {
      id: "orders",
      status: "built",
      entry: "viewOrders",
      shows: ["Order", "OrderLine"],
      actions: ["createOrder", "removeOrder"],
    },
    {
      id: "members",
      status: "built",
      entry: "listMembers",
      shows: ["Member"],
      actions: ["inviteMember"],
    },
  ],
};

const run = (ledger = LEDGER, { actions = ACTIONS, roles = ROLES, entities = ENTITIES } = {}) =>
  screenActions(offersOf(ledger), modelOf({ actions, roles, entities }));

const rules = (result) => result.problems.map((problem) => problem.rule);
const screen = (id, change) => ({
  screens: LEDGER.screens.map((item) => (item.id === id ? { ...item, ...change } : item)),
});

test("a ledger that agrees with the model has no problem and no debt", () => {
  assert.deepEqual(run(), { problems: [], debts: [] });
});

test("a ledger that declares nothing of this is not checked", () => {
  const bare = { screens: [{ id: "orders", status: "built", states: ["ready"] }] };
  assert.equal(offersOf(bare).declared, false);
  assert.equal(offersOf(LEDGER).declared, true);
});

test("a role holds an action it inherits, and one a scope map names", () => {
  const model = modelOf({
    roles: ROLES,
    actions: [...ACTIONS, { name: "sign", kind: "command", scope: { admin: "company" } }],
    entities: ENTITIES,
  });
  const holders = (name) => model.actions.find((action) => action.name === name).holders;
  assert.deepEqual(holders("viewOrders"), ["agent", "lead"]);
  assert.deepEqual(holders("removeOrder"), ["lead"]);
  assert.deepEqual(holders("sign"), ["admin"]);
});

// (a) An action of the model that no screen offers to a role that may run it.

test("an action no screen offers is a problem that names it and who may run it", () => {
  const result = run(screen("orders", { actions: ["createOrder"] }));
  assert.deepEqual(rules(result), ["unoffered"]);
  assert.match(result.problems[0].text, /removeOrder/);
  assert.match(result.problems[0].text, /lead/);
});

test("an action offered only where a role that may run it cannot open is a problem", () => {
  // inviteMember moves to the orders screen, which admin cannot open.
  const result = run({
    screens: [
      { ...LEDGER.screens[0], actions: ["createOrder", "removeOrder", "inviteMember"] },
      { ...LEDGER.screens[1], actions: [] },
    ],
  });
  const unoffered = result.problems.filter((problem) => problem.rule === "unoffered");
  assert.equal(unoffered.length, 1);
  assert.equal(unoffered[0].action, "inviteMember");
  assert.deepEqual(unoffered[0].roles, ["admin"]);
});

test("a query is offered where its entity is shown, also through the entity it lives by", () => {
  const actions = [
    ...ACTIONS,
    { name: "readStock", entity: "Stock", kind: "query", roles: ["agent"] },
  ];
  const entities = { ...ENTITIES, Stock: {}, Shelf: { lifecycle: { via: "Stock" } } };
  const missing = run(LEDGER, { actions, entities });
  assert.deepEqual(rules(missing), ["unoffered"]);
  const shown = run(screen("orders", { shows: ["Order", "OrderLine", "Shelf"] }), {
    actions,
    entities,
  });
  assert.deepEqual(shown.problems, []);
});

test("an action listed as having no screen is a debt when later, and silent when never", () => {
  const ledger = {
    ...screen("orders", { actions: ["createOrder"] }),
    no_screen: { removeOrder: { later: "roadmap row 12" } },
  };
  const later = run(ledger);
  assert.deepEqual(later.problems, []);
  assert.equal(later.debts.length, 1);
  assert.match(later.debts[0].text, /removeOrder.*roadmap row 12/);

  const never = run({
    ...ledger,
    no_screen: { removeOrder: { never: "done by import only", decided_by: "Lan, 2026-01-05" } },
  });
  assert.deepEqual(never, { problems: [], debts: [] });
});

test("the list of actions without a screen is held to its own shape", () => {
  const base = screen("orders", { actions: ["createOrder"] });
  const unsigned = run({ ...base, no_screen: { removeOrder: { never: "import only" } } });
  assert.deepEqual(rules(unsigned), ["ledger"]);
  assert.match(unsigned.problems[0].text, /decided_by/);

  const stale = run({ ...LEDGER, no_screen: { removeOrder: { later: "row 12" } } });
  assert.deepEqual(rules(stale), ["ledger"]);
  assert.match(stale.problems[0].text, /orders/);

  const unknown = run({ ...LEDGER, no_screen: { archiveOrder: { later: "row 12" } } });
  assert.deepEqual(rules(unknown), ["ledger"]);
});

test("an action only a planned screen offers, or the model marks planned, is a debt", () => {
  const planned = run(screen("members", { status: "planned" }));
  assert.deepEqual(planned.problems, []);
  assert.deepEqual(
    planned.debts.map((debt) => debt.action),
    ["listMembers", "inviteMember"],
  );

  const marked = run(LEDGER, {
    actions: ACTIONS.map((action) =>
      action.name === "removeOrder" ? { ...action, status: "planned" } : action,
    ),
  });
  assert.deepEqual(marked.problems, []);
  assert.deepEqual(
    marked.debts.map((debt) => debt.action),
    ["removeOrder"],
  );
});

// (b) A screen shows an entity to a role that may not view it.

test("a screen that shows an entity to a role that may not view it is a problem", () => {
  // Opened by every role, the orders screen shows Order, and OrderLine that lives by it, to admin.
  const result = run(screen("orders", { entry: null }));
  assert.deepEqual(rules(result), ["unseen", "unseen"]);
  assert.deepEqual(
    result.problems.map((problem) => [problem.screen, problem.entity, problem.roles]),
    [
      ["orders", "Order", ["admin"]],
      ["orders", "OrderLine", ["admin"]],
    ],
  );
});

test("a screen that shows an entity nobody may view is a problem, unless the model answers", () => {
  const entities = { ...ENTITIES, Receipt: {} };
  const shows = screen("orders", { shows: ["Order", "Receipt"] });
  const silent = run(shows, { entities });
  assert.deepEqual(rules(silent), ["unseen"]);
  assert.match(silent.problems[0].text, /no query action/);

  const later = run(shows, {
    entities: { ...entities, Receipt: { lifecycle: { query: { later: "row 20" } } } },
  });
  assert.deepEqual(later.problems, []);
  assert.match(later.debts[0].text, /Receipt.*row 20/);

  const never = run(shows, {
    entities: {
      ...entities,
      Receipt: { lifecycle: { query: { never: "kept off screen", decided_by: "Lan" } } },
    },
  });
  assert.deepEqual(rules(never), ["unseen"]);
  assert.match(never.problems[0].text, /never/);
});

test("a screen that shows something the model does not have is a problem", () => {
  const result = run(screen("orders", { shows: ["Order", "Invoice"] }));
  assert.deepEqual(rules(result), ["unknown"]);
  assert.match(result.problems[0].text, /Invoice/);
});

// (c) A button offered where no role that may press it gets in.

test("a button no role that opens the screen may press is a problem", () => {
  const result = run({
    screens: [
      LEDGER.screens[0],
      { ...LEDGER.screens[1], actions: ["inviteMember", "createOrder"] },
    ],
  });
  assert.deepEqual(rules(result), ["unreachable"]);
  assert.equal(result.problems[0].screen, "members");
  assert.equal(result.problems[0].action, "createOrder");
});

test("a button or an entry that names an action the model does not have is a problem", () => {
  const button = run(screen("orders", { actions: ["createOrder", "removeOrder", "shipOrder"] }));
  assert.deepEqual(rules(button), ["unknown"]);
  const entry = run(screen("members", { entry: "seeMembers" }));
  assert.ok(rules(entry).includes("unknown"));
});

// Debts the model records.

test("what the model plans for later is listed with the screens that show the entity", () => {
  const result = run(LEDGER, {
    entities: { ...ENTITIES, Order: { lifecycle: { update: { later: "roadmap row 9" } } } },
  });
  assert.deepEqual(result.problems, []);
  assert.equal(result.debts.length, 1);
  assert.match(result.debts[0].text, /Order.*update.*roadmap row 9.*orders/);
});

// A repository that spells the keys its own way, and a frame around every screen.

test("a ledger may name its own spelling of the keys, and a frame around the screens", () => {
  const own = {
    keys: { entry: "vao", actions: "nut", frame: "khung", shows: "hien" },
    khung: { nut: ["removeOrder"] },
    screens: [
      { id: "orders", status: "built", vao: "viewOrders", hien: ["Order"], nut: ["createOrder"] },
      {
        id: "members",
        status: "built",
        vao: "listMembers",
        hien: ["Member"],
        nut: ["inviteMember"],
      },
    ],
  };
  assert.deepEqual(run(own), { problems: [], debts: [] });
});

// The answer the ledger now gives: what each role sees and may do on each screen.

test("the table says, for each screen and role, what is seen and which buttons there are", () => {
  const table = screenTable(
    offersOf(LEDGER),
    modelOf({ actions: ACTIONS, roles: ROLES, entities: ENTITIES }),
  );
  const cell = (id, role) => table.find((row) => row.screen === id && row.role === role);
  assert.deepEqual(cell("orders", "agent"), {
    screen: "orders",
    status: "built",
    role: "agent",
    opens: true,
    sees: ["Order", "OrderLine"],
    buttons: ["createOrder"],
  });
  assert.deepEqual(cell("orders", "lead").buttons, ["createOrder", "removeOrder"]);
  assert.deepEqual(cell("orders", "admin"), {
    screen: "orders",
    status: "built",
    role: "admin",
    opens: false,
    sees: [],
    buttons: [],
  });
});

// The gate reads the ledger as text and the model from the repository's files.

const LEDGER_TEXT = [
  "version: 1",
  "screens:",
  "  - id: orders",
  "    route: /orders",
  "    title: null",
  "    family: null",
  "    status: built",
  "    entry: viewOrders",
  "    shows:",
  "      - Order",
  "    actions:",
  "      - createOrder",
  "      - removeOrder",
  "  - id: members",
  "    route: /members",
  "    title: null",
  "    family: null",
  "    status: built",
  "    entry: listMembers",
  "    shows: [Member]",
  "    actions: [inviteMember]",
  "",
].join("\n");

const READ = { present: true, actions: ACTIONS, roles: ROLES, entities: ENTITIES };

test("the gate passes a ledger written as text that agrees with the model", () => {
  assert.equal(screenActionsProblem(LEDGER_TEXT, READ), null);
  assert.deepEqual(screenActionsDebts(LEDGER_TEXT, READ), []);
});

test("the gate names the first problems and counts the rest", () => {
  const text = LEDGER_TEXT.replace("      - removeOrder\n", "").replace("[inviteMember]", "[]");
  const problem = screenActionsProblem(text, READ);
  assert.match(problem, /design\/screens\.yaml and ontology\/ disagree/);
  assert.match(problem, /removeOrder/);
  assert.match(problem, /inviteMember/);
});

test("the gate is silent without actions in the model, or without a ledger", () => {
  assert.equal(screenActionsProblem(LEDGER_TEXT, { ...READ, present: false }), null);
  assert.equal(screenActionsProblem(null, READ), null);
});

test("the model is read from the repository's files, lifecycle or not", () => {
  const root = mkdtempSync(path.join(tmpdir(), "screen-actions-"));
  mkdirSync(path.join(root, "ontology/entities"), { recursive: true });
  writeFileSync(
    path.join(root, "ontology/actions.yaml"),
    "actions:\n  - name: viewOrders\n    entity: Order\n    kind: query\n    roles: [agent]\n",
  );
  writeFileSync(path.join(root, "ontology/roles.yaml"), "roles:\n  - name: agent\n");
  writeFileSync(path.join(root, "ontology/entities/Order.yaml"), "name: Order\n");
  writeFileSync(
    path.join(root, "ontology/entities/Line.yaml"),
    "name: Line\nlifecycle: { via: Order }\n",
  );
  writeFileSync(path.join(root, "ontology/entities/_template.yaml"), "name: Example\n");
  const read = readModel(root);
  assert.equal(read.present, true);
  assert.deepEqual(Object.keys(read.entities), ["Line", "Order"]);
  assert.deepEqual(modelOf(read).entities.Line.lifecycle, { via: "Order" });
  assert.equal(readModel(path.join(root, "nowhere")).present, false);
});

// The reference repository, when it is on this machine: read, never written.
const REFERENCE = env.DESIGN_ASSEMBLY_REFERENCE_LEDGER;
const reference = REFERENCE && existsSync(path.join(REFERENCE, "ontology/actions.yaml"));

test(
  "the reference repository's model and ledger are read in its own spelling",
  { skip: !reference && "the reference repository is not on this machine" },
  () => {
    const read = readModel(REFERENCE);
    assert.ok(read.actions.length > 0);
    const ledger = readScreenLedger(
      readFileSync(path.join(REFERENCE, "design/screens.yaml"), "utf8"),
    );
    const offers = offersOf(ledger, { entry: "vao", actions: "nut", frame: "khung" });
    assert.ok(offers.declared);
    const result = screenActions(offers, modelOf(read));
    // Every problem names a rule this check knows.
    for (const problem of result.problems) {
      assert.ok(["unknown", "unseen", "unreachable", "unoffered", "ledger"].includes(problem.rule));
    }
  },
);

// The check as the gate runs it: held, seen failing on a changed copy, and its debts listed.

const gateState = (text, model = READ) => ({
  theme: {
    checks: {
      "screen-actions": [
        { kind: "screen-actions", file: "design/screens.yaml", model: "ontology" },
      ],
    },
  },
  files: { "design/screens.yaml": text },
  models: { ontology: model },
});

test("the gate holds a ledger that agrees, and sees the check fail on a changed copy", () => {
  const [result] = runChecks(gateState(LEDGER_TEXT));
  assert.equal(result.problem, null);
  assert.equal(result.seenFailing, true);
  assert.equal(result.held, true);
});

test("the gate fails once the ledger stops declaring, or the model loses its actions", () => {
  const bare =
    "version: 1\nscreens:\n  - id: orders\n    route: /orders\n    title: null\n    family: null\n    status: built\n";
  assert.match(runChecks(gateState(bare))[0].problem, /no longer says/);
  assert.match(
    runChecks(gateState(LEDGER_TEXT, { ...READ, present: false }))[0].problem,
    /actions\.yaml is missing/,
  );
});

test("the gate lists the debts without failing", () => {
  // The members screen leaves; seeing members is planned for later, with no screen yet.
  const ledger = `${LEDGER_TEXT.slice(0, LEDGER_TEXT.indexOf("  - id: members"))}no_screen:\n  listMembers: { later: roadmap row 3 }\n`;
  const model = { ...READ, actions: ACTIONS.filter((action) => action.name !== "inviteMember") };
  const [result] = runChecks(gateState(ledger, model));
  assert.equal(result.problem, null);
  assert.deepEqual(result.notes, ["listMembers has no screen yet: later (roadmap row 3)"]);
});

test("the ledger is written back with what each screen shows, opens with and offers", () => {
  const screens = readScreenLedger(LEDGER_TEXT).screens;
  const again = readScreenLedger(renderScreenLedger({ screens })).screens;
  assert.deepEqual(
    again.map(({ shows, entry, actions }) => ({ shows, entry, actions })),
    [
      { shows: ["Order"], entry: "viewOrders", actions: ["createOrder", "removeOrder"] },
      { shows: ["Member"], entry: "listMembers", actions: ["inviteMember"] },
    ],
  );
});
