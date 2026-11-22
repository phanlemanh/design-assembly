// The screen facts command: for an acceptance kit that reads a repository's screens instead of
// having them declared again, it prints the screens a feature touches, each with its id, route and
// family, the states it must have once the state table's exemptions are taken off, and the actions
// on it with the roles that hold them. It reads the ledger through the one reader every tool uses,
// so one file and one file per screen give the same answer, and so does a ledger that spells its
// keys its own way. Its keys are pinned here; the kit holds them from its side with a sample.
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { execPath } from "node:process";
import { after, test } from "node:test";
import { fileURLToPath } from "node:url";

import { splitLedger } from "../templates/tools/design-assembly/screen-ledger.mjs";
import { ROOT } from "./helpers/guided-repo.mjs";

const PLUGIN = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const TOOL = path.join(PLUGIN, "templates/tools/design-assembly/screen-facts.mjs");

// The keys of the answer and of each screen in it: the contract the kit reads.
const ANSWER_KEYS = ["keys_not_found", "ledger", "screens", "states_table", "unknown"];
const SCREEN_KEYS = [
  "actions",
  "entry",
  "exempt",
  "family",
  "id",
  "must_have",
  "route",
  "states",
  "status",
  "title",
];

const made = [];
after(() => made.forEach((dir) => rmSync(dir, { recursive: true, force: true })));

function folder(files) {
  const dir = mkdtempSync(path.join(tmpdir(), "design-assembly-screen-facts-"));
  made.push(dir);
  for (const [file, content] of Object.entries(files)) {
    mkdirSync(path.dirname(path.join(dir, file)), { recursive: true });
    writeFileSync(path.join(dir, file), content);
  }
  return dir;
}
const facts = (dir, ...args) =>
  spawnSync(execPath, [TOOL, "--target", dir, ...args], { encoding: "utf8" });
function answer(dir, ...args) {
  const said = facts(dir, "--json", ...args);
  assert.equal(said.status, 0, said.stderr || said.stdout);
  return JSON.parse(said.stdout);
}
const keysOf = (value) => Object.keys(value).sort();

test("on this repository: each screen with its route, family, the states it must have and the actions with their roles", () => {
  const result = answer(ROOT);
  assert.deepEqual(keysOf(result), ANSWER_KEYS);
  assert.equal(result.ledger, "design/screens");
  assert.equal(result.states_table, "design/states.json");
  assert.deepEqual(result.unknown, []);
  for (const screen of result.screens) assert.deepEqual(keysOf(screen), SCREEN_KEYS);
  const byId = Object.fromEntries(result.screens.map((screen) => [screen.id, screen]));
  assert.deepEqual(Object.keys(byId).sort(), ["overdue", "reference"]);
  const reference = byId.reference;
  assert.equal(reference.route, "/");
  assert.equal(reference.family, "danh-sach");
  assert.equal(reference.title, "screenTitle");
  assert.equal(reference.status, "built");
  assert.deepEqual(reference.must_have, ["loading", "empty", "error", "no-results"]);
  assert.equal(reference.exempt, null);
  assert.ok(reference.states.includes("confirm-delete"));
  assert.deepEqual(reference.entry, { action: "listItems", roles: ["user"] });
  assert.deepEqual(reference.actions, [
    { name: "createItem", roles: ["user"] },
    { name: "deleteItem", roles: ["user"] },
  ]);
  assert.deepEqual(byId.overdue.actions, []);
});

test("the screens a feature touches are named by id or by route; one the ledger does not have ends with 1", () => {
  assert.deepEqual(
    answer(ROOT, "--screens", "overdue").screens.map((screen) => screen.id),
    ["overdue"],
  );
  assert.deepEqual(
    answer(ROOT, "--screens", "/,overdue").screens.map((screen) => screen.id),
    ["reference", "overdue"],
  );
  const said = facts(ROOT, "--json", "--screens", "overdue,settings");
  assert.equal(said.status, 1, said.stderr);
  const result = JSON.parse(said.stdout);
  assert.deepEqual(result.unknown, ["settings"]);
  assert.deepEqual(
    result.screens.map((screen) => screen.id),
    ["overdue"],
  );
  // A person reads the same, one screen per line, and what the ledger does not have.
  const text = facts(ROOT, "--screens", "overdue,settings").stdout;
  assert.match(text, /overdue \/overdue \(danh-sach\)/);
  assert.match(text, /must have: loading, empty, error, no-results/);
  assert.match(text, /not in the ledger of screens: settings/);
});

// A repository of its own: a ledger whose keys are spelled as the reference repository spells them,
// a screen excused from the states, one open to every role, and a planned one.
const LEDGER = `version: 1
keys:
  entry: vao
  actions: nut
screens:
  - id: orders
    route: /orders
    title: ordersTitle
    family: list
    status: built
    vao: listOrders
    nut:
      - cancelOrder
      - archiveOrder
    states:
      - ready
      - loading
      - empty
      - error
      - no-results
  - id: welcome
    route: /welcome
    title: null
    family: null
    status: built
    vao: null
    states:
      - ready
  - id: report
    route: /report
    title: null
    family: list
    status: planned
`;
const MODEL = {
  "ontology/actions.yaml": `actions:
  - name: listOrders
    roles: [clerk]
  - name: cancelOrder
    roles: [manager]
`,
  "ontology/roles.yaml": `roles:
  - name: clerk
  - name: manager
    inherits: [clerk]
`,
};
const STATES = `${JSON.stringify({
  version: 1,
  required: ["loading", "empty", "error", "no-results"],
  exempt: { "/welcome": "A page of words only: it loads nothing." },
})}\n`;

function oneFile() {
  return folder({ "design/screens.yaml": LEDGER, "design/states.json": STATES, ...MODEL });
}
function onePerScreen() {
  const { shared, fragments, problems } = splitLedger(LEDGER);
  assert.deepEqual(problems, []);
  return folder({
    "design/screens/_shared.yaml": shared,
    ...Object.fromEntries(fragments.map((item) => [`design/screens/${item.name}`, item.text])),
    "design/states.json": STATES,
    ...MODEL,
  });
}

test("a ledger as one file and as one file per screen give the same screens, the repository's own key spelling read", () => {
  const one = answer(oneFile());
  const folders = answer(onePerScreen());
  assert.equal(one.ledger, "design/screens.yaml");
  assert.equal(folders.ledger, "design/screens");
  // The folder is read in the order of its files' names, the one file in its own order.
  const byName = (screens) => [...screens].sort((a, b) => (a.id < b.id ? -1 : 1));
  assert.deepEqual(byName(folders.screens), byName(one.screens));
  const byId = Object.fromEntries(one.screens.map((screen) => [screen.id, screen]));
  for (const screen of one.screens) assert.deepEqual(keysOf(screen), SCREEN_KEYS);
  // The roles that hold an action, inherited ones too; an action the model does not have, nobody.
  assert.deepEqual(byId.orders.entry, { action: "listOrders", roles: ["clerk", "manager"] });
  assert.deepEqual(byId.orders.actions, [
    { name: "cancelOrder", roles: ["manager"] },
    { name: "archiveOrder", roles: [] },
  ]);
  // Excused from the states by its route: it must have none, and says why.
  assert.deepEqual(byId.welcome.must_have, []);
  assert.equal(byId.welcome.exempt, "A page of words only: it loads nothing.");
  // A screen open to every role names every role, and one with no buttons has no actions.
  assert.deepEqual(byId.welcome.entry, { action: null, roles: ["clerk", "manager"] });
  assert.deepEqual(byId.welcome.actions, []);
  // A planned screen is listed as planned, and must have the states once it is built.
  assert.equal(byId.report.status, "planned");
  assert.deepEqual(byId.report.must_have, ["loading", "empty", "error", "no-results"]);
  assert.equal(byId.report.entry, null);
});

test("the key spelling may be given on the call instead, as the reference repository's measure gives it", () => {
  const dir = folder({
    "design/screens.yaml": LEDGER.replace(/^keys:\n(?: {2}.*\n)+/m, ""),
    "design/states.json": STATES,
    ...MODEL,
  });
  const orders = answer(dir, "--keys", "entry=vao,actions=nut").screens.find(
    (screen) => screen.id === "orders",
  );
  assert.deepEqual(orders.entry, { action: "listOrders", roles: ["clerk", "manager"] });
  assert.equal(orders.actions.length, 2);
  assert.deepEqual(answer(dir, "--keys", "entry=vao,actions=nut").keys_not_found, []);
});

test("a ledger spelled its own way and read without being told says which keys it did not find, never an empty answer", () => {
  const dir = folder({
    "design/screens.yaml": LEDGER.replace(/^keys:\n(?: {2}.*\n)+/m, ""),
    "design/states.json": STATES,
    ...MODEL,
  });
  const said = facts(dir, "--json");
  // Ids, routes and states still read: the answer is usable, and ends with 0.
  assert.equal(said.status, 0, said.stderr);
  const result = JSON.parse(said.stdout);
  assert.deepEqual(result.keys_not_found, [
    { key: "entry", looked_for: "entry" },
    { key: "actions", looked_for: "actions" },
  ]);
  const orders = result.screens.find((screen) => screen.id === "orders");
  assert.equal(orders.route, "/orders");
  assert.ok(orders.states.includes("loading"));
  // Not found is not none: no screen's actions read as an empty list.
  assert.equal(orders.entry, null);
  assert.ok(result.screens.every((screen) => screen.actions === null));
  const text = facts(dir).stdout;
  assert.match(text, /no screen of the ledger has the key entry, nor actions/);
  assert.match(text, /--keys/);

  // A ledger where some screens have the key and others do not is not that case.
  const some = answer(oneFile());
  assert.deepEqual(some.keys_not_found, []);
  assert.deepEqual(some.screens.find((screen) => screen.id === "welcome").actions, []);
  assert.deepEqual(answer(ROOT).keys_not_found, []);
});

test("without a model the roles cannot be said; without a state table what a screen must have cannot be said, and the answer still ends with 0", () => {
  const noModel = answer(folder({ "design/screens.yaml": LEDGER, "design/states.json": STATES }));
  const orders = noModel.screens.find((screen) => screen.id === "orders");
  assert.deepEqual(orders.entry, { action: "listOrders", roles: null });
  assert.deepEqual(orders.actions[0], { name: "cancelOrder", roles: null });

  const said = facts(folder({ "design/screens.yaml": LEDGER, ...MODEL }), "--json");
  assert.equal(said.status, 0, said.stderr);
  const result = JSON.parse(said.stdout);
  assert.equal(result.states_table, null);
  assert.ok(result.screens.every((screen) => screen.must_have === null));
});

test("a wrong call, or a repository whose ledger or state table cannot be read, ends with 2 and no answer", () => {
  const cases = {
    "no ledger": facts(folder({ "design/states.json": STATES }), "--json"),
    "state table that is not JSON": facts(
      folder({ "design/screens.yaml": LEDGER, "design/states.json": "{ no" }),
      "--json",
    ),
    "unknown flag": facts(oneFile(), "--everything"),
    "flag without its value": facts(oneFile(), "--screens"),
    "key spelling that does not read": facts(oneFile(), "--keys", "entry"),
  };
  for (const [name, said] of Object.entries(cases)) {
    assert.equal(said.status, 2, `${name}: ${said.stdout}`);
    assert.equal(said.stdout, "", name);
    assert.match(said.stderr, /^design-assembly: /, name);
  }
  const help = facts(oneFile(), "--help");
  assert.equal(help.status, 0);
  assert.match(help.stdout, /^Usage: screen-facts\.mjs/);
});

test("the make step runs the command, and the tool's reference page says what it prints", async () => {
  const { readFileSync } = await import("node:fs");
  const step = readFileSync(path.join(PLUGIN, "templates/mk/design-assembly.mk"), "utf8");
  assert.match(step, /^design-screen-facts:.*##/m);
  assert.match(step, /node tools\/design-assembly\/screen-facts\.mjs/);
  const page = readFileSync(path.join(PLUGIN, "references/checks.md"), "utf8");
  for (const key of [...ANSWER_KEYS, ...SCREEN_KEYS])
    assert.match(page, new RegExp(`\`${key}\``), key);
});
