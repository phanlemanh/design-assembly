// The screen brief (specification 0010, slice 2): where the command is plugged in. The waiting
// list takes a question about one slot of one screen, and the list of slots says what each open
// one recommends. The rules page tells a builder to run it before a screen is built or changed, the socket board names it as the
// default plug of the screen brief socket and the limits ledger says what is still open, the skill
// page says how it is run, and the readers of the sheet take the keys of a page of a kind from the
// floor's one table.
import "./helpers/own-cores.mjs";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import path from "node:path";
import { execPath } from "node:process";
import { after, test } from "node:test";
import { fileURLToPath } from "node:url";

import { rulesPage } from "../scripts/apply.mjs";
import { askProblems, catalogueProblems, READERS, readCatalogue } from "../scripts/brief-slots.mjs";
import { readCapabilities } from "../scripts/capabilities.mjs";
import { EXIT } from "../scripts/command.mjs";
import { BASES } from "../scripts/document.mjs";
import { KEY } from "../templates/tools/design-assembly/screens.mjs";
import {
  itemProblem,
  mustAsk,
  rowProblems,
  SCREEN_SLOTS,
} from "../templates/tools/design-assembly/waiting.mjs";
import { BUILT, briefRepository } from "./helpers/brief-repo.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const PLUGIN = path.resolve(HERE, "..");
const BRIEF = path.join(PLUGIN, "scripts/brief.mjs");
const LIMITS = JSON.parse(readFileSync(path.join(PLUGIN, "references/limits.json"), "utf8")).limits;
const CATALOGUE = readCatalogue();
const copyOf = (data) => JSON.parse(JSON.stringify(data));
const OWNER = "Owner Of The Sample";
const ANSWERED = "2026-12-01";
const itemOf = (screen, slot) => `screen:${screen}:${slot}`;

const removals = [];
after(() => removals.forEach((remove) => remove()));
const sample = () => {
  const made = briefRepository();
  removals.push(made.remove);
  return made.dir;
};
const sheet = (dir, id = BUILT) => {
  const called = spawnSync(execPath, [BRIEF, id, "--target", dir, "--json"], { encoding: "utf8" });
  assert.ok([EXIT.done, EXIT.work].includes(called.status), called.stderr);
  return JSON.parse(called.stdout);
};
const slotOf = (result, id) => result.slots.find((slot) => slot.id === id);

test("the waiting list takes the item kind screen:<screen id>:<slot>, a slot of the catalogue, and it is not the owner's alone", () => {
  // One list of slots a question can name, and it is the catalogue's.
  assert.deepEqual(
    SCREEN_SLOTS,
    CATALOGUE.slots.map((slot) => slot.id),
  );
  for (const slot of SCREEN_SLOTS) assert.equal(itemProblem(itemOf("returns", slot)), null, slot);
  assert.equal(itemProblem("screen:order-detail.v2:kind"), null);
  for (const bad of [
    "screen:returns",
    "screen:returns:",
    "screen::kind",
    "screen:returns:motion",
    "screen:returns:Kind",
    "screen:two words:kind",
    "screen:a/b:kind",
    "screen:returns:kind:more",
  ]) {
    assert.notEqual(itemProblem(bad), null, bad);
  }
  assert.match(itemProblem("screen:returns:motion"), /does not name one screen/);
  // The other kinds read as they did, and an unknown kind names this one among those it takes.
  assert.equal(itemProblem("decision:copy-content"), null);
  assert.match(itemProblem("page:x"), /screen:…/);
  // A builder that asks goes on with the recommendation: nothing in a branch tells the gate that
  // a screen was built on an open slot, so the gate could not hold a stop it promised.
  assert.equal(mustAsk(itemOf("returns", "navigation")), false);
  // A row of the list with such an item reads, waiting and answered.
  const row = {
    id: "screen-returns-navigation",
    question: "Where does it stand?",
    recommendation: "Last.",
    basis: "The list.",
    hard_to_undo: false,
    item: itemOf("returns", "navigation"),
    asked_on: "2026-11-21",
  };
  assert.deepEqual(rowProblems(row, row.id), []);
  assert.deepEqual(rowProblems({ ...row, answer: "keep", by: OWNER, on: ANSWERED }, row.id), []);
  assert.match(
    rowProblems({ ...row, item: "screen:returns:motion" }, row.id).join("\n"),
    /item: screen:returns:motion does not name one screen/,
  );
});

test("the catalogue gives every slot what an open one recommends, what that rests on, and whether it is hard to undo", () => {
  assert.deepEqual(catalogueProblems(CATALOGUE, READERS), []);
  assert.deepEqual(askProblems(CATALOGUE), []);
  for (const slot of CATALOGUE.slots) {
    assert.ok(slot.ask.recommend.trim().length > 0, slot.id);
    assert.ok(slot.ask.basis.kind in BASES, slot.id);
    assert.ok(slot.ask.basis.text.trim().length > 0, slot.id);
    assert.equal(typeof slot.ask.hard_to_undo, "boolean", slot.id);
  }
  const silent = copyOf(CATALOGUE);
  delete silent.slots[0].ask;
  assert.deepEqual(askProblems(silent), [
    "kind: an open slot must recommend something, say what that rests on (a principle, a standard or a measurement), and say whether it is hard to undo",
  ]);
  const baseless = copyOf(CATALOGUE);
  baseless.slots[1].ask.basis = { kind: "a hunch", text: "It feels right." };
  assert.equal(askProblems(baseless).length, 1);
  // A slot the waiting list cannot name is red: its question could not be found again.
  const renamed = copyOf(CATALOGUE);
  renamed.slots[11].id = "other-screens";
  assert.deepEqual(askProblems(renamed), [
    `other-screens: the waiting list cannot name this slot (it names: ${SCREEN_SLOTS.join(", ")})`,
    "touched-screens: the waiting list names a slot the catalogue lacks",
  ]);
});

test("criterion 9: the rules page tells a builder to run the brief before a screen is built or changed, where the repository has a ledger of screens", () => {
  const ledger = { "screen-ledger": [{ kind: "screen-ledger" }] };
  const held = rulesPage(ledger, () => false);
  assert.match(
    held,
    /Before you build or change a screen, run `\/design-assembly:brief <screen id>`/,
  );
  assert.match(held, /status: planned/);
  // It stands before the first section: read before any rule, and not itself a rule a check holds.
  const said = held.indexOf("/design-assembly:brief");
  assert.ok(said > 0 && (held.indexOf("\n## ") === -1 || said < held.indexOf("\n## ")));
  assert.ok(!held.split("\n").some((line) => line.startsWith("- ") && line.includes(":brief")));
  // A repository with no ledger of screens gets the page it got before: no word of the brief.
  const bare = rulesPage({}, () => false);
  assert.doesNotMatch(bare, /brief/);
  const other = rulesPage({ labels: [{ kind: "labels" }] }, () => false);
  assert.doesNotMatch(other, /brief/);
  // The page with the ledger is the page without it plus two paragraphs, the second on what the
  // sheet does not hold, and the ledger's own lines.
  const lines = held.split("\n");
  const from = lines.findIndex((line) => line.startsWith("Before you build or change a screen"));
  const second = lines.findIndex((line) => line.startsWith("The twelve slots are the choices"));
  assert.equal(lines[second - 1], "");
  const to = lines.findIndex((line, index) => index > second && line === "");
  const without = [...lines.slice(0, from - 1), ...lines.slice(to)].join("\n");
  assert.equal(without.slice(0, without.indexOf("\n## ")), bare.slice(0, bare.indexOf("\n## ")));
});

test("criterion 10: the brief command is the default plug of the screen brief socket, and the limit that said it had none is closed", () => {
  const { table } = readCapabilities();
  const socket = table.capabilities.find((item) => item.id === "screen-brief");
  const plug = socket.plugs.find((item) => item.default === true);
  assert.equal(plug.id, "brief");
  assert.equal(plug.kind, "command");
  assert.deepEqual(plug.scripts, ["scripts/brief.mjs"]);
  assert.ok(socket.socket.checks.includes("/design-assembly:brief"));
  // The two faces say what is true now: what a person is shown and asked, and what holds the rule.
  assert.match(socket.socket.human.shows, /twelve slots/);
  assert.match(socket.socket.human.asks, /open slot/);
  assert.equal(socket.socket.human.reason, undefined);
  assert.equal(socket.socket.machine.held_by, "/design-assembly:brief");
  const old = LIMITS.find((limit) => limit.id === "capability-screen-brief-has-no-plug");
  assert.equal(old.status, "closed");
  assert.match(old.closed_by, /brief/);
  // What is still open is said by an open limit of the brief, which the socket names.
  const left = LIMITS.find((limit) => limit.id === socket.limit);
  assert.equal(left.status, "open");
  assert.equal(left.area, "brief");
  assert.equal(socket.socket.machine.unheld, undefined);
  // The two limits this slice settles are closed, each saying by what.
  for (const id of ["brief-open-slot-not-asked", "brief-two-slots-held-by-no-ledger"]) {
    const limit = LIMITS.find((row) => row.id === id);
    assert.equal(limit.status, "closed", id);
    assert.ok(limit.closed_by.trim().length > 0, id);
  }
});

test("the skill page says how the sheet is run, what its three states mean, and that only --queue writes", () => {
  const skill = readFileSync(path.join(PLUGIN, "skills/brief/SKILL.md"), "utf8");
  assert.match(skill, /^---\nname: brief\ndescription: /);
  for (const said of [
    "scripts/brief.mjs",
    "--queue",
    "--json",
    "--out",
    "settled",
    "asked",
    "open",
    "screen:<screen id>:<slot>",
    "/design-assembly:decide",
    "status: planned",
    "waits_on",
  ]) {
    assert.ok(skill.includes(said), said);
  }
  assert.match(skill, /never answer .* for the owner/i);
  const readme = readFileSync(path.join(PLUGIN, "README.md"), "utf8");
  assert.ok(readme.includes("/design-assembly:brief"));
});

test("one table of the keys of a page of a kind: the readers of the brief take them from the floor's own", () => {
  for (const key of ["kind", "task", "reference", "file", "frame", "frameName", "frameImport"]) {
    assert.equal(typeof KEY[key], "string", key);
  }
  for (const file of ["scripts/brief-readers.mjs", "scripts/brief-slots.mjs"]) {
    const text = readFileSync(path.join(PLUGIN, file), "utf8");
    for (const word of Object.values(KEY)) {
      assert.ok(!new RegExp(`["'\`]${word}["'\`]`).test(text), `${file} spells ${word} itself`);
    }
  }
  // The sheet still reads the page by those keys.
  const kind = slotOf(sheet(sample()), "kind");
  assert.equal(kind.state, "settled");
  assert.equal(kind.answer[1].source.key, KEY.kind);
  const frame = slotOf(sheet(sample()), "components").answer.map((item) => item.source.key);
  assert.ok(frame.includes(KEY.frame) && frame.includes(KEY.required));
});
