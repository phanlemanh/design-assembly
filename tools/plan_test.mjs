// The plan of record is held by a command: where the work stands, and whether a branch says which
// item of the plan it serves. Run with `node --test tools/plan_test.mjs`.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

import { commitProblems, parkedByGroup, planProblems, position, trailers } from "./plan.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const real = () => JSON.parse(readFileSync(path.join(ROOT, "docs/plan/plan.json"), "utf8"));
// The plan of record as it stood on the day it was approved: stage 0 open, nothing started. The
// rules are tested from there, so they keep holding as the real plan moves on.
const fresh = () => {
  const plan = real();
  plan.stages.forEach((stage, index) => {
    stage.state = index === 0 ? "current" : "next";
    delete stage.closed;
    for (const item of stage.items) item.state = "todo";
  });
  return plan;
};
const copy = (change) => {
  const plan = fresh();
  change(plan);
  return plan;
};

test("the plan of record has no problem, and one stage is the current one", () => {
  const plan = real();
  assert.deepEqual(planProblems(plan), []);
  assert.equal(plan.stages.filter((stage) => stage.state === "current").length, 1);
  assert.ok(position(plan).current.items.length > 0);
});

test("a plan nobody approved, or with no way to say a stage is done, is a problem", () => {
  assert.match(
    planProblems(copy((plan) => delete plan.approved)).join("\n"),
    /no person approved this plan/,
  );
  assert.match(
    planProblems(copy((plan) => (plan.stages[1].done_when = []))).join("\n"),
    /stage 1 does not say when it is done/,
  );
});

test("work in a later stage before the current one closes is a problem, unless it runs beside it", () => {
  // Named by its id: the file lists stages in the order they closed, which is not their numbers'.
  const ahead = copy((plan) => {
    const stage = plan.stages.find((each) => each.id === 3);
    stage.items.find((item) => item.id === "3.1").state = "doing";
  });
  assert.match(planProblems(ahead).join("\n"), /item 3\.1 is doing while stage 0 is still open/);
  // Stage 2 runs beside stage 1: once stage 1 is the current one, work in stage 2 is in order.
  const beside = copy((plan) => {
    const [zero, one, two] = plan.stages;
    for (const item of zero.items) item.state = "done";
    zero.state = "done";
    zero.closed = { on: "2026-11-16", evidence: "make check green five times" };
    one.state = "current";
    two.items[0].state = "doing";
  });
  assert.deepEqual(planProblems(beside), []);
});

test("a stage is closed only with every item done and the evidence written down", () => {
  const early = copy((plan) => {
    plan.stages[0].state = "done";
    plan.stages[1].state = "current";
  });
  const found = planProblems(early).join("\n");
  assert.match(found, /stage 0 is done but item 0\.\d is not/);
  assert.match(found, /stage 0 is done with no record of when and on what evidence/);
});

test("two current stages, or none, is a problem", () => {
  assert.match(
    planProblems(copy((plan) => (plan.stages[1].state = "current"))).join("\n"),
    /2 stages are current/,
  );
  assert.match(
    planProblems(copy((plan) => (plan.stages[0].state = "next"))).join("\n"),
    /no stage is current/,
  );
});

test("something set aside names the stage it waits for", () => {
  const lost = copy((plan) => (plan.parked[0].stage = 42));
  assert.match(
    planProblems(lost).join("\n"),
    /set aside for stage 42, which the plan does not have/,
  );
});

test("what is set aside is shown by group, in the order the plan gives its groups", () => {
  const grouped = copy((plan) => {
    plan.parked_groups = [
      { id: "seam", name: "The seam" },
      { id: "small", name: "Small things" },
      { id: "empty", name: "Nothing here" },
    ];
    plan.parked = [
      { what: "one", stage: 0, why_not_now: "later", group: "small" },
      { what: "two", stage: 0, why_not_now: "later", group: "seam" },
      { what: "three", stage: 0, why_not_now: "later" },
      { what: "four", stage: 0, why_not_now: "later", group: "seam" },
    ];
  });
  assert.deepEqual(planProblems(grouped), []);
  assert.deepEqual(
    parkedByGroup(grouped).map((group) => [group.name, group.entries.map((entry) => entry.what)]),
    [
      ["The seam", ["two", "four"]],
      ["Small things", ["one"]],
      [null, ["three"]],
    ],
  );
  // A plan that names no groups shows what is set aside as one list, in its own order.
  const flat = copy((plan) => delete plan.parked_groups);
  assert.equal(parkedByGroup(flat).length, 1);
  assert.equal(parkedByGroup(flat)[0].entries.length, flat.parked.length);
});

test("something set aside in a group the plan does not have, or a group named twice, is a problem", () => {
  const lost = copy((plan) => {
    plan.parked_groups = [{ id: "seam", name: "The seam" }];
    plan.parked[0].group = "nowhere";
  });
  assert.match(
    planProblems(lost).join("\n"),
    /is set aside in the group nowhere, which the plan does not have/,
  );
  const twice = copy((plan) => {
    plan.parked_groups = [
      { id: "seam", name: "The seam" },
      { id: "seam", name: "Again" },
    ];
  });
  assert.match(
    planProblems(twice).join("\n"),
    /the group seam of what is set aside is named twice/,
  );
  const unnamed = copy((plan) => (plan.parked_groups = [{ id: "seam" }]));
  assert.match(planProblems(unnamed).join("\n"), /the group seam of what is set aside has no name/);
});

test("a commit's trailer is read from its last lines", () => {
  assert.deepEqual(trailers("fix: a thing\n\nBody.\n\nPlan: 0.1\nCo-Authored-By: someone"), [
    "0.1",
  ]);
  assert.deepEqual(trailers("fix: a thing\n\nPlan: off-plan — the owner asked for it"), [
    "off-plan — the owner asked for it",
  ]);
  assert.deepEqual(trailers("fix: a thing\n\nThe plan: nothing"), []);
});

test("a branch says which item it serves, or that it is off the plan and why", () => {
  const plan = real();
  const said = ["feat: the status command\n\nPlan: 0.2"];
  assert.deepEqual(commitProblems(plan, said), []);
  // No commit yet is not a problem: there is nothing to tie.
  assert.deepEqual(commitProblems(plan, []), []);
  assert.match(
    commitProblems(plan, ["feat: something nice"]).join("\n"),
    /no commit of this branch names an item of the plan/,
  );
  assert.match(
    commitProblems(plan, ["feat: x\n\nPlan: 9.9"]).join("\n"),
    /Plan: 9\.9 names no item of the plan/,
  );
  assert.match(
    commitProblems(plan, ["feat: x\n\nPlan: off-plan"]).join("\n"),
    /off-plan with no reason/,
  );
  assert.deepEqual(commitProblems(plan, ["feat: x\n\nPlan: off-plan — the owner asked today"]), []);
  // An item of a stage that is not open yet is named as such: the first such item of the plan of
  // record, whichever stage is open today. When the open stage is the last one, no stage of the
  // plan of record waits, so the case is read on a copy of it with one more stage at the end.
  const { open } = position(plan);
  const waits = (stage) =>
    stage.state !== "done" && !open.has(stage.id) && (stage.items ?? []).length > 0;
  const stageAfterTheLast = {
    id: 99,
    name: "A stage after the last",
    state: "later",
    parallel: [],
    items: [{ id: "99.1", what: "An item that waits", state: "todo" }],
    done_when: ["Something is shown by a command"],
    needs_owner: [],
  };
  const withOneWaiting = plan.stages.some(waits)
    ? plan
    : { ...plan, stages: [...plan.stages, stageAfterTheLast] };
  const later = withOneWaiting.stages.find(waits);
  const item = later.items[0].id;
  assert.match(
    commitProblems(withOneWaiting, [`feat: x\n\nPlan: ${item}`]).join("\n"),
    new RegExp(
      `Plan: ${item.replace(".", "\\.")} is an item of stage ${later.id}, which is not open`,
    ),
  );
});
