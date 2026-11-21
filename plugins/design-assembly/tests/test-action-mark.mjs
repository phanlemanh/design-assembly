// The mark of an action: a control that runs an action of the model carries the action's name on
// itself, and the browser test knows the button by it, never by its words. The rules page and the
// actions slot of the brief say so only where the repository has actions and a ledger of screens
// that declares buttons; the parts the guide installs that draw an action's button take its name
// and put the mark, each with its own test.
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import path from "node:path";
import { execPath } from "node:process";
import { after, test } from "node:test";
import { fileURLToPath } from "node:url";

import { ACTION_MARK, ownedFileOf, patternsPlan, rulesPage } from "../scripts/apply.mjs";
import { EXIT } from "../scripts/command.mjs";
import { adapter as browser } from "../templates/tools/design-assembly/adapters/playwright.mjs";
import {
  MARK,
  SEEN_DECISION,
  SEEN_TEST,
} from "../templates/tools/design-assembly/screen-actions-seen.mjs";
import { briefRepository, BUILT } from "./helpers/brief-repo.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const PLUGIN = path.resolve(HERE, "..");
const BRIEF = path.join(PLUGIN, "scripts/brief.mjs");
const RULES = ".claude/rules/design-assembly.md";
const template = (name) => readFileSync(path.join(PLUGIN, "templates/owned", name), "utf8");

const removals = [];
after(() => removals.forEach((remove) => remove()));

const JOINED = {
  "screen-ledger": [{ kind: "screen-ledger" }],
  "screen-actions": [{ kind: "screen-actions" }],
};
const none = () => false;
const markLine = (page) => page.split("\n").find((line) => line.includes(ACTION_MARK)) ?? null;

test("the mark has a name of its own: a toast library sets data-action on the button it draws", () => {
  assert.equal(MARK, "data-model-action");
  // The toast module never leaves the library's own attribute on a button it raises.
  assert.doesNotMatch(template("notify.ts.template"), /"data-action"/);
});

test("the rules page says a control of an action carries its mark, where buttons are declared", () => {
  const line = markLine(rulesPage(JOINED, none, null, { buttons: true }));
  assert.ok(line, "the rules page says nothing of the mark");
  assert.ok(line.includes(`\`${MARK}="<action name>"\``));
  assert.match(line, /never by its words/);
  // Only a button the screen's row lists carries it.
  assert.match(line, /lists in `actions`/);
  // No ledger that declares buttons, or no join of the ledger with the model: no such line.
  assert.equal(markLine(rulesPage(JOINED, none, null, { buttons: false })), null);
  assert.equal(markLine(rulesPage(JOINED, none)), null);
  assert.equal(markLine(rulesPage({}, none, null, { buttons: true })), null);
});

test("the line names the toast's way to the mark where the module is, and the test where it is held", () => {
  const plain = markLine(rulesPage(JOINED, none, null, { buttons: true }));
  assert.doesNotMatch(plain, /notifyDone/);
  assert.doesNotMatch(plain, new RegExp(SEEN_TEST.replace(/[./]/g, "\\$&")));
  const page = rulesPage(
    { ...JOINED, [SEEN_DECISION]: [{ kind: SEEN_DECISION }] },
    (file) => file === "src/lib/notify.ts",
    null,
    { buttons: true },
  );
  const line = markLine(page);
  assert.match(line, /`notifyDone` and `notifyFailed`/);
  assert.ok(page.includes(`\`${SEEN_TEST}\``));
  assert.ok(page.includes(`\`${browser.door.file}\``));
});

const sheet = (dir) => {
  const called = spawnSync(execPath, [BRIEF, BUILT, "--target", dir, "--json"], {
    encoding: "utf8",
  });
  assert.ok([EXIT.done, EXIT.work].includes(called.status), called.stderr);
  return JSON.parse(called.stdout);
};
const actionsOf = (result) => result.slots.find((slot) => slot.id === "actions");

test("the actions slot gives the rule of the mark, read from its line of the rules page", () => {
  const page = rulesPage(JOINED, none, null, { buttons: true });
  const made = briefRepository({ [RULES]: page });
  removals.push(made.remove);
  const slot = actionsOf(sheet(made.dir));
  const line = slot.answer.find((item) => item.says.includes(MARK));
  assert.ok(line, "the actions slot says nothing of the mark");
  assert.match(line.says, /data-model-action="<action name>"/);
  assert.equal(line.source.file, RULES);
  assert.ok(page.split("\n")[line.source.line - 1].includes(ACTION_MARK));
  // A rules page that does not say it: the slot says nothing of a mark.
  const bare = briefRepository({ [RULES]: rulesPage(JOINED, none) });
  removals.push(bare.remove);
  assert.equal(
    actionsOf(sheet(bare.dir)).answer.some((item) => item.says.includes(MARK)),
    false,
  );
});

test("the toast's button takes the action's name and puts the mark, with a test of its own", () => {
  const notify = template("notify.ts.template");
  assert.match(notify, /action\?: string/);
  assert.ok(notify.includes(`"${MARK}"`));
  // The test comes with the module, where the guide installs it.
  assert.equal(ownedFileOf(PLUGIN, "notify.test.tsx.template"), "tests/notify.test.tsx");
  const test = template("notify.test.tsx.template");
  assert.ok(test.includes(MARK));
  assert.match(test, /notifyDone/);
  assert.match(test, /notifyFailed/);
});

test("a row's actions and a table's actions keep the mark of the buttons a screen gives them", () => {
  // Neither draws a button of its own for an action: the screen gives them its buttons, which
  // carry the mark, and their tests show the mark is there where they draw the buttons.
  for (const name of ["row-actions.test.tsx.template", "table-actions.test.tsx.template"]) {
    assert.ok(template(name).includes(`${MARK}=`), `${name} does not test the mark`);
  }
});

// A repository whose toast module was installed before the module took an action's name, and one
// that never had it: the test of the toast's mark comes only with a module that takes the name.
test("the toast's test is installed only with a module that takes the action's name", () => {
  const EARLIER = [
    "export type Choice = { label: string; run: () => void; close: string };",
    "export function notifyDone() {}",
    "",
  ].join("\n");
  const placed = (notify) => {
    const made = briefRepository({
      "package.json": JSON.stringify({ dependencies: { sonner: "^2" } }),
      ...(notify === null ? {} : { "src/lib/notify.ts": notify }),
    });
    removals.push(made.remove);
    return Object.keys(patternsPlan(made.dir, { starter: true, code: true }).files);
  };
  // Neither there: both are installed together.
  assert.ok(placed(null).includes("src/lib/notify.ts"));
  assert.ok(placed(null).includes("tests/notify.test.tsx"));
  // The earlier module stays the repository's, and its test would be red against it.
  assert.ok(!placed(EARLIER).includes("tests/notify.test.tsx"));
  // A module that already takes the name gets the test.
  assert.ok(placed(template("notify.ts.template")).includes("tests/notify.test.tsx"));
});
