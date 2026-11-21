// The browser test by role, its pure part: the walking plan is the gate's own table of screens by
// role, never a second reckoning of who may do what, and the comparison of what a walk saw with
// what the table allows gives one sentence per problem, naming the screen, the role, the action and
// the state, and what to do. Nothing here starts a browser.
import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { after, test } from "node:test";

import {
  doorProblem,
  MARK,
  seenProblems,
  walkPlan,
  walkPlanOf,
  widthsOf,
} from "../templates/tools/design-assembly/screen-actions-seen.mjs";
import {
  modelOf,
  offersOf,
  screenTable,
} from "../templates/tools/design-assembly/screen-actions.mjs";

const made = [];
after(() => made.forEach((dir) => rmSync(dir, { recursive: true, force: true })));

// Two roles: a clerk who may see and add orders, and a lead who also removes them.
const ROLES = [{ name: "clerk" }, { name: "lead", inherits: ["clerk"] }];
const ACTIONS = [
  { name: "viewOrders", entity: "Order", kind: "query", roles: ["clerk"] },
  { name: "addOrder", entity: "Order", kind: "create", roles: ["clerk"] },
  { name: "removeOrder", entity: "Order", kind: "delete", roles: ["lead"] },
];
const LEDGER = {
  screens: [
    {
      id: "orders",
      route: "/orders",
      status: "built",
      entry: "viewOrders",
      shows: ["Order"],
      actions: ["addOrder", "removeOrder"],
    },
    {
      id: "returns",
      route: "/returns",
      status: "planned",
      entry: "viewOrders",
      shows: ["Order"],
      actions: [],
    },
  ],
  frame: { actions: [] },
};
const MODEL = { actions: ACTIONS, roles: ROLES, entities: { Order: {} } };

const rowOf = (plan, screen, role) =>
  plan.find((row) => row.screen === screen && row.role === role);

test("the walking plan is the gate's table, for each built screen and each role", () => {
  const plan = walkPlan(LEDGER, MODEL);
  // The planned screen and the frame are not walked: neither is a page a browser opens.
  assert.deepEqual(
    plan.map((row) => `${row.screen}/${row.role}`),
    ["orders/clerk", "orders/lead"],
  );
  // Opens and buttons are the table's, read as the gate reads them.
  const table = screenTable(offersOf(LEDGER), modelOf(MODEL)).filter(
    (row) => row.screen === "orders",
  );
  for (const row of table) {
    const planned = rowOf(plan, "orders", row.role);
    assert.equal(planned.opens, row.opens);
    assert.deepEqual(planned.buttons, row.buttons);
  }
  assert.deepEqual(rowOf(plan, "orders", "clerk"), {
    screen: "orders",
    route: "/orders",
    role: "clerk",
    opens: true,
    buttons: ["addOrder"],
    actions: ["addOrder", "removeOrder"],
    holdsAll: false,
  });
  assert.equal(rowOf(plan, "orders", "lead").holdsAll, true);
});

test("a model without actions, or a ledger that declares no buttons, gives no walk", () => {
  assert.deepEqual(walkPlan(LEDGER, { ...MODEL, actions: [] }), []);
  assert.deepEqual(walkPlan({ screens: [{ id: "orders", status: "built" }] }, MODEL), []);
});

// A repository on disk, with its model in ontology/ and its ledger of screens.
function repository(actions) {
  const dir = mkdtempSync(path.join(tmpdir(), "design-assembly-seen-"));
  made.push(dir);
  const put = (file, text) => {
    mkdirSync(path.dirname(path.join(dir, file)), { recursive: true });
    writeFileSync(path.join(dir, file), text);
  };
  const list = (items) => items.map((item) => `      - ${item}`).join("\n");
  put("ontology/roles.yaml", "roles:\n  - name: clerk\n  - name: lead\n    inherits: [clerk]\n");
  put(
    "ontology/actions.yaml",
    `actions:\n${actions
      .map(
        (action) =>
          `  - name: ${action.name}\n    entity: Order\n    kind: ${action.kind}\n    roles: [${action.roles.join(", ")}]`,
      )
      .join("\n")}\n`,
  );
  put("ontology/entities/Order.yaml", "name: Order\n");
  put(
    "design/screens.yaml",
    `version: 1\nstatuses:\n  - built\n  - planned\nscreens:\n  - id: orders\n    route: /orders\n    title: null\n    family: null\n    status: built\n    shows:\n      - Order\n    entry: viewOrders\n    actions:\n${list(["addOrder", "removeOrder"])}\n    states:\n      - ready\n`,
  );
  return dir;
}

test("one right changed in the model of a repository changes the plan with it", () => {
  const dir = repository(ACTIONS);
  const before = walkPlanOf(dir);
  assert.deepEqual(rowOf(before, "orders", "clerk").buttons, ["addOrder"]);
  // The clerk is given removeOrder too, in the model and nowhere else.
  const file = path.join(dir, "ontology/actions.yaml");
  writeFileSync(file, readFileSync(file, "utf8").replace("roles: [lead]", "roles: [clerk]"));
  const after = walkPlanOf(dir);
  assert.deepEqual(rowOf(after, "orders", "clerk").buttons, ["addOrder", "removeOrder"]);
  assert.equal(rowOf(after, "orders", "clerk").holdsAll, true);
});

// What a walk saw: each state of the screen, whether it was reached, and the marks found there.
const state = (name, marks, reached = true, why = null) => ({
  name,
  reached,
  marks,
  ...(why ? { why } : {}),
});

test("a role that sees each of its buttons, and nothing else, has no problem", () => {
  const plan = walkPlan(LEDGER, MODEL);
  const lead = rowOf(plan, "orders", "lead");
  const clerk = rowOf(plan, "orders", "clerk");
  assert.deepEqual(
    seenProblems(lead, [state("ready", ["removeOrder"]), state("empty", ["addOrder"])]),
    [],
  );
  // The clerk may fail to reach a state whose steps need a button it lacks.
  assert.deepEqual(
    seenProblems(clerk, [
      state("ready", ["addOrder"]),
      state("confirm-remove", [], false, "the control to press, «Remove», is not on the page"),
    ]),
    [],
  );
});

test("an action the role may run and never sees is a sentence with the screen, role and action", () => {
  const lead = rowOf(walkPlan(LEDGER, MODEL), "orders", "lead");
  const problems = seenProblems(lead, [state("ready", ["addOrder"])], { width: 320 });
  assert.equal(problems.length, 1);
  assert.match(problems[0], /^screen orders, role lead, at 320px: /);
  assert.match(problems[0], new RegExp(`${MARK}="removeOrder"`));
  assert.match(problems[0], /states reached: ready/);
  assert.match(
    problems[0],
    /Put data-model-action="removeOrder" on the control that runs removeOrder/,
  );
});

test("a mark seen only in a state the role did not reach does not count", () => {
  const lead = rowOf(walkPlan(LEDGER, MODEL), "orders", "lead");
  const problems = seenProblems(lead, [
    state("ready", ["addOrder"]),
    state("removed", ["removeOrder"], false, "«Removed» never appeared"),
  ]);
  // The lead holds every action of the screen, so the state left unreached is a problem too.
  assert.equal(problems.length, 2);
  assert.ok(problems.some((line) => /did not reach the state/.test(line)));
  assert.ok(problems.some((line) => /removeOrder/.test(line) && /no control marked/.test(line)));
});

test("a role that holds every action of the screen reaches every state", () => {
  const lead = rowOf(walkPlan(LEDGER, MODEL), "orders", "lead");
  const [problem] = seenProblems(lead, [
    state("ready", ["addOrder", "removeOrder"]),
    state("error", [], false, "«Could not load» never appeared"),
  ]);
  assert.match(problem, /^screen orders, role lead, state error: /);
  assert.match(problem, /holds every action of the screen and did not reach the state/);
  assert.match(problem, /«Could not load» never appeared/);
});

test("a mark of an action outside the role's buttons names the state where it was seen", () => {
  const clerk = rowOf(walkPlan(LEDGER, MODEL), "orders", "clerk");
  const problems = seenProblems(clerk, [
    state("ready", ["addOrder", "removeOrder"]),
    state("record-open", ["removeOrder"]),
  ]);
  assert.equal(problems.length, 2);
  assert.match(problems[0], /^screen orders, role clerk, state ready: /);
  assert.match(problems[0], /data-model-action="removeOrder" is on the page/);
  assert.match(problems[0], /clerk may not run removeOrder/);
  // Not seeing means not on the page: a locked button still counts as seen.
  assert.match(problems[0], /a locked button still counts as seen/);
  assert.match(problems[1], /state record-open/);
});

test("a mark of an action the screen's row does not list, or of no action, says so", () => {
  const lead = rowOf(walkPlan(LEDGER, MODEL), "orders", "lead");
  const [unlisted, nothing] = seenProblems(lead, [
    state("ready", ["addOrder", "removeOrder", "viewOrders", "true"]),
  ]);
  assert.match(unlisted, /data-model-action="viewOrders"/);
  assert.match(unlisted, /the row of orders lists no button for viewOrders/);
  assert.match(nothing, /data-model-action="true"/);
  assert.match(nothing, /names no action/);
});

test("a role with no way in is named, with the file it is missing from", () => {
  const file = "tests/e2e/roles.ts";
  assert.equal(doorProblem("lead", { lead: () => {} }, file), null);
  const problem = doorProblem("lead", { clerk: () => {} }, file);
  assert.match(problem, /role lead has no way in/);
  assert.match(problem, new RegExp(file.replace(/[./]/g, "\\$&")));
});

test("the walk runs at the narrowest and the widest width a person listed", () => {
  assert.deepEqual(widthsOf({ widths: [768, 320, 1440, 1024] }), [320, 1440]);
  assert.deepEqual(widthsOf({ widths: [390] }), [390]);
});

test("a mark outside the role's buttons met on the way to a state not reached is a problem too", () => {
  const plan = walkPlan({ screens: [{ ...LEDGER.screens[0], actions: ["removeOrder"] }] }, MODEL);
  const clerk = rowOf(plan, "orders", "clerk");
  assert.deepEqual(clerk.buttons, []);
  const problems = seenProblems(clerk, [
    state("ready", []),
    state("confirm-remove", ["removeOrder"], false, "«Remove this order?» never appeared"),
  ]);
  assert.equal(problems.length, 1);
  assert.match(problems[0], /^screen orders, role clerk, state confirm-remove: /);
  assert.match(problems[0], /on the way to the state, which was not reached/);
  assert.match(problems[0], /clerk may not run removeOrder/);
});
