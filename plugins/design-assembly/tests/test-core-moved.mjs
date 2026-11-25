// The core of a family of products, slice 3 (spec 0016, criteria 1, 9, 15 and 20): a member learns
// that its family's core moved ahead of the pin, answer by answer, from `status`, `inventory` and
// `core --moved`; nothing in the repository changes until a person accepts, one answer or all; the
// pin and the copy move with what was accepted; a locked answer the repository then holds otherwise
// becomes a question, and nothing is written over; a core that cannot be looked at is said, never
// an error; and a repository that stands alone is unchanged. Fixtures only: no model, no network,
// and a list of cores of each test's own.
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { chmodSync, existsSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import { env, execPath } from "node:process";
import { after, test } from "node:test";

import { answerChanges } from "../scripts/core-moved.mjs";

import {
  ACCEPTED_ON,
  adopted,
  answer,
  BRAND,
  change,
  CHANGED_ON,
  cleanup,
  COPY,
  copyPin,
  core,
  coreFolder,
  DECLARATION,
  empty,
  FAMILY,
  floor,
  gate,
  git,
  guided,
  holding,
  join,
  json,
  listIn,
  member,
  MEMBER,
  noMakefile,
  noteOf,
  OTHER,
  OWNER,
  pinOf,
  PLUGIN,
  primaryOf,
  put,
  read,
  run,
  sha,
  snapshot,
  text,
} from "./helpers/core-family.mjs";

after(cleanup);

const accept = (dir, list, args, more = []) =>
  core(["--target", dir, ...args, "--by", MEMBER, "--on", ACCEPTED_ON, ...more], list);
const status = (dir, list, more = []) => run("status.mjs", ["--target", dir, ...more], list);
const inventory = (dir, list, more = []) => run("inventory.mjs", ["--target", dir, ...more], list);
// The family's owner edits the answers by hand: an answer added, one taken out.
function edit(place, make) {
  const data = read(place, "answers.json");
  put(place, "answers.json", json({ ...data, answers: make(data.answers) }));
}

// ---- criterion 9: the core moved ahead of the pin ----------------------------------------------

test("a member is told the core moved: status, inventory and core --moved name each answer, with who, when and why", () => {
  const { dir, place, list } = member();
  const pin = copyPin(dir);
  // Where the core is where the repository pinned it, each says so and nothing waits.
  const still = core(["--target", dir, "--moved"], list);
  assert.equal(still.status, 0, still.stderr);
  assert.match(still.stdout, /is where this repository pinned it: nothing waits/);
  assert.match(status(dir, list).stdout, /the core \(.*\) is where this repository pinned it/);

  // The owner changes a value, raises a default to locked, adds an answer and takes one out.
  change(place, list, "type-scale-values", [
    "--value",
    "modular major-third",
    "--why",
    "the product reads at a distance",
  ]);
  change(place, list, "type-scale-values", ["--hold", "locked", "--why", "two apps drifted apart"]);
  edit(place, (answers) => [
    ...answers.filter((item) => item.id !== "table-density"),
    {
      ...answer("empty-state", "rule", "an empty list says what to do next", "default", null),
      by: OWNER,
      on: CHANGED_ON,
      why: "Added by the owner: the lists read alike.",
    },
  ]);
  const before = snapshot(dir);

  const moved = core(["--target", dir, "--moved", "--json"], list);
  assert.equal(moved.status, 1, moved.stderr);
  const data = JSON.parse(moved.stdout);
  assert.equal(data.state, "ahead");
  assert.equal(data.pin, pin);
  assert.equal(data.core_pin, pinOf(place));
  assert.deepEqual(
    data.changes.map((item) => [item.id, item.change]),
    [
      ["type-scale-values", "value and hold"],
      ["empty-state", "added"],
      ["table-density", "retired"],
    ],
  );
  // What it was in the copy, what it is in the core, and each change of its history.
  const scale = data.changes[0];
  assert.deepEqual(scale.was, { value: "standard", hold: "default" });
  assert.deepEqual(scale.now, { value: "modular major-third", hold: "locked" });
  assert.deepEqual(
    scale.steps.map((step) => [step.by, step.on, step.why]),
    [
      [OWNER, CHANGED_ON, "the product reads at a distance"],
      [OWNER, CHANGED_ON, "two apps drifted apart"],
    ],
  );

  const said = core(["--target", dir, "--moved"], list).stdout;
  assert.match(
    said,
    /is ahead of the pin: it is at [0-9a-f]{12}, with 1 answer changed, 1 added, 1 retired/,
  );
  assert.match(
    said,
    /changed: type-scale-values: its value standard became modular major-third; its hold default became locked; in 2 changes:/,
  );
  assert.match(
    said,
    new RegExp(
      `standard, default became modular major-third, default, by ${OWNER} on ${CHANGED_ON}, because the product reads at a distance`,
    ),
  );
  assert.match(
    said,
    new RegExp(
      `added: empty-state: an empty list says what to do next, default; by ${OWNER} on ${CHANGED_ON}, because Added by the owner`,
    ),
  );
  assert.match(
    said,
    /retired: table-density: it was .* in the copy, and the core no longer holds it/,
  );
  assert.match(said, /nothing here changes until a person accepts/);

  // status and inventory say the same of each answer, as text and as data.
  for (const told of [status(dir, list), inventory(dir, list)]) {
    assert.match(
      told.stdout,
      /is ahead of the pin: it is at [0-9a-f]{12}, with 1 answer changed, 1 added, 1 retired/,
    );
    assert.match(
      told.stdout,
      /changed: type-scale-values: its value standard became modular major-third/,
    );
    assert.match(told.stdout, /because two apps drifted apart/);
    assert.match(told.stdout, /added: empty-state/);
    assert.match(told.stdout, /retired: table-density/);
    assert.match(told.stdout, /core --accept <id> takes one, core --accept-all takes all/);
  }
  assert.equal(JSON.parse(status(dir, list, ["--json"]).stdout).core.moved.changes.length, 3);
  const counted = JSON.parse(inventory(dir, list, ["--json"]).stdout).core;
  assert.equal(counted.state, "ahead");
  assert.deepEqual(
    counted.changes.map((item) => item.id),
    ["type-scale-values", "empty-state", "table-density"],
  );
  // Looking writes nothing, and the gate is as green as before: the repository holds its copy.
  assert.deepEqual(snapshot(dir), before);
  assert.equal(gate(dir).status, 0, gate(dir).stderr);
});

test("a change with no entry of history says nobody is named; a file written otherwise changes no answer", () => {
  const { dir, place, list } = member();
  // The same answers, laid out otherwise: the hash moved and no answer did.
  writeFileSync(path.join(place, "answers.json"), JSON.stringify(read(place, "answers.json")));
  const form = JSON.parse(core(["--target", dir, "--moved", "--json"], list).stdout);
  assert.equal(form.state, "ahead");
  assert.equal(form.form_only, true);
  assert.deepEqual(form.changes, []);
  assert.match(
    core(["--target", dir, "--moved"], list).stdout,
    /its answers file is written otherwise and no answer differs: accepting moves the pin and changes no answer/,
  );
  // Accepting it moves the pin to the core's and changes no answer.
  const taken = accept(dir, list, ["--accept-all"]);
  assert.equal(taken.status, 0, taken.stderr);
  assert.equal(copyPin(dir), pinOf(place));
  assert.equal(core(["--target", dir, "--moved"], list).status, 0);

  // A value changed by hand, with no entry of history: said, with nobody named.
  edit(place, (answers) =>
    answers.map((item) => (item.id === "record-panel" ? { ...item, value: "over" } : item)),
  );
  const said = core(["--target", dir, "--moved"], list).stdout;
  assert.match(
    said,
    /changed: record-panel: its value beside became over; the core's history does not say who changed it/,
  );
  // The differences between two sets of answers are read the same whoever calls, and whatever
  // order the keys of an answer are written in.
  assert.deepEqual(answerChanges([], []), []);
  const one = answer("source-color", "value", BRAND, "locked", null);
  const turned = Object.fromEntries(Object.entries(one).reverse());
  assert.deepEqual(answerChanges([one], [turned]), []);
  assert.equal(answerChanges([one], [{ ...turned, hold: "default" }])[0].change, "hold");
});

test("accepting lands whole or not at all: a file that cannot be written leaves the copy and its hashes as they were", () => {
  const { dir, place, list } = member();
  change(place, list, "record-panel", [
    "--hold",
    "default",
    "--why",
    "one app opens records in place",
  ]);
  const before = snapshot(dir);
  const coreBefore = snapshot(place);
  // The declaration cannot be written: the copy, written first, is put back.
  chmodSync(path.join(dir, DECLARATION), 0o444);
  const stopped = accept(dir, list, ["--accept-all"]);
  chmodSync(path.join(dir, DECLARATION), 0o644);
  assert.equal(stopped.status, 2, stopped.stdout);
  assert.match(
    stopped.stderr,
    /a file could not be written .*: nothing was accepted, and what had been written was put back as it was/,
  );
  assert.deepEqual(snapshot(dir), before);
  assert.deepEqual(snapshot(place), coreBefore);
  assert.equal(gate(dir).status, 0, gate(dir).stderr);
  // Once it can be written, the same call goes through.
  assert.equal(accept(dir, list, ["--accept-all"]).status, 0);
  assert.equal(gate(dir).status, 0, gate(dir).stderr);
});

test("the core's list of blocks differing is said, and nothing more of it", () => {
  const { dir, place, list } = member();
  put(
    place,
    "blocks/index.json",
    json({
      version: 1,
      blocks: [
        {
          need: "data-table",
          name: "Data table",
          files: [{ file: "blocks/data-table/table.tsx", sha256: sha("x") }],
          adapters: [],
          used_by: ["first-app"],
          promoted: { by: OWNER, on: CHANGED_ON },
          second_use: false,
        },
      ],
    }),
  );
  const moved = core(["--target", dir, "--moved"], list);
  // The answers are the ones pinned: nothing waits on a person.
  assert.equal(moved.status, 0, moved.stderr);
  assert.match(moved.stdout, /the core's list of blocks is not the one copied here/);
  assert.doesNotMatch(moved.stdout, /data-table/);
  assert.match(status(dir, list).stdout, /the core's list of blocks is not the one copied here/);
  assert.match(inventory(dir, list).stdout, /the core's list of blocks is not the one copied here/);
});

test("a core that cannot be looked at is said and is no error: the repository goes on with its copy", () => {
  const { dir, place, list } = member();
  change(place, list, "record-panel", ["--value", "over", "--why", "panels cover the list"]);
  const reached = status(dir, list);
  const cases = {
    "no list on this machine": [listIn(), /this machine keeps no list of cores/],
    "a list nobody can read": [
      (() => {
        const file = listIn();
        writeFileSync(file, "{ not json");
        return file;
      })(),
      /the machine's list of cores cannot be read/,
    ],
    "a list that names no core of the family": [
      (() => {
        const file = listIn();
        writeFileSync(file, json({ version: 1, cores: [], declined: [] }));
        return file;
      })(),
      /names no core of this family/,
    ],
    "a folder that is gone": [
      (() => {
        const file = listIn();
        writeFileSync(
          file,
          json({
            version: 1,
            cores: [
              { family: FAMILY, path: path.join(empty(), "gone"), on: "2026-11-26", how: "pinned" },
            ],
            declined: [],
          }),
        );
        return file;
      })(),
      /is not there/,
    ],
  };
  for (const [name, [file, why]] of Object.entries(cases)) {
    const before = snapshot(dir);
    const moved = core(["--target", dir, "--moved"], file);
    assert.equal(moved.status, 0, `${name}: ${moved.stderr}`);
    assert.match(moved.stdout, /the core's folder cannot be looked at/, name);
    assert.match(moved.stdout, why, name);
    assert.match(moved.stdout, /the repository goes on with its copy/, name);
    const told = status(dir, file);
    assert.equal(told.status, reached.status, name);
    assert.match(told.stdout, /the core's folder cannot be looked at \(/, name);
    assert.match(told.stdout, /locked answers: 3/, name);
    const counted = inventory(dir, file);
    assert.equal(counted.status, 0, name);
    assert.match(counted.stdout, /not looked at:\n(.*\n)* {2}family-core: /, name);
    // Accepting needs the core: refused, with nothing written.
    const refused = accept(dir, file, ["--accept-all"]);
    assert.equal(refused.status, 2, name);
    assert.match(refused.stderr, /cannot be looked at .*nothing was accepted/, name);
    assert.deepEqual(snapshot(dir), before, name);
    assert.equal(gate(dir).status, 0, name);
  }
  // A core kept elsewhere is named by its folder, and the machine's list then holds it.
  const fresh = listIn();
  const pointed = core(["--target", dir, "--moved", "--core", place], fresh);
  assert.equal(pointed.status, 1, pointed.stderr);
  assert.match(pointed.stdout, /the machine's list of cores holds this core from now on/);
  assert.equal(core(["--target", dir, "--moved"], fresh).status, 1);
  // A folder that holds the core of another family is not this repository's core.
  const stranger = coreFolder({ name: "other-core" });
  put(stranger, "core.json", json({ ...read(stranger, "core.json"), family: "Another Family" }));
  const wrong = core(["--target", dir, "--moved", "--core", stranger], listIn());
  assert.equal(wrong.status, 0);
  assert.match(wrong.stdout, /is the core of another family/);
});

// ---- accepting, answer by answer ---------------------------------------------------------------

test("a person accepts one answer, then the rest: the copy, the pin, the record and the core's member list move with each", () => {
  const { dir, place, list } = member();
  const first = copyPin(dir);
  change(place, list, "record-panel", [
    "--hold",
    "default",
    "--why",
    "one app opens records in place",
  ]);
  change(place, list, "failed-action", [
    "--hold",
    "default",
    "--why",
    "kept by a test in each app",
  ]);
  const before = snapshot(dir);

  // Said first: a dry run writes nothing, here or in the core's folder.
  const coreBefore = snapshot(place);
  const dry = accept(dir, list, ["--accept", "record-panel"], ["--dry-run"]);
  assert.equal(dry.status, 1, dry.stderr);
  assert.match(dry.stdout, /would accept from the family core .*: record-panel/);
  assert.match(
    dry.stdout,
    /in the core folder: .*core\.json: member-app is at pin [0-9a-f]{12} since 2026-11-28 \(not written: --dry-run\)/,
  );
  assert.deepEqual(snapshot(dir), before);
  assert.deepEqual(snapshot(place), coreBefore);

  // One answer: the copy holds the core's answer for it and the earlier one for the other.
  const one = accept(dir, list, ["--accept", "record-panel"]);
  assert.equal(one.status, 1, one.stderr);
  assert.match(one.stdout, /left as they were, still to accept or not: failed-action/);
  const pin = copyPin(dir);
  assert.notEqual(pin, first);
  assert.notEqual(pin, pinOf(place));
  const copy = read(dir, `${COPY}/answers.json`).answers;
  const now = read(place, "answers.json").answers;
  const byId = (answers, id) => answers.find((item) => item.id === id);
  assert.deepEqual(byId(copy, "record-panel"), byId(now, "record-panel"));
  assert.equal(byId(copy, "failed-action").hold, "locked");
  // The declaration: the hashes of the copy as it is, the day, and what was accepted and left.
  const source = read(dir, DECLARATION);
  for (const file of ["core.json", "answers.json", "blocks/index.json"]) {
    assert.equal(
      source.pin.files.find((entry) => entry.file === file).sha256,
      sha(readFileSync(path.join(dir, COPY, file))),
      file,
    );
  }
  assert.equal(source.pin.taken_on, ACCEPTED_ON);
  assert.deepEqual(source.accepted, {
    by: MEMBER,
    on: ACCEPTED_ON,
    answers: ["record-panel"],
    core: pinOf(place),
    left: ["failed-action"],
  });
  // The core's list of members holds the new pin; the ledger's marks name it; the gate is green.
  assert.equal(
    read(place, "core.json").members.find((item) => item.repository === "member-app").pin,
    pin,
  );
  assert.match(
    noteOf(dir, "failed-action"),
    new RegExp(`^inherited from the family core at ${pin}`),
  );
  assert.equal(gate(dir).status, 0, gate(dir).stderr);
  // What was left still shows as ahead, and only that.
  const left = JSON.parse(core(["--target", dir, "--moved", "--json"], list).stdout);
  assert.deepEqual(
    left.changes.map((item) => item.id),
    ["failed-action"],
  );

  // The rest: the copy is the core's answers byte for byte, and the pin is the core's.
  const all = accept(dir, list, ["--accept-all"]);
  assert.equal(all.status, 0, all.stderr);
  assert.match(all.stdout, /the core's own: the copy is the core's answers, byte for byte/);
  assert.deepEqual(
    readFileSync(path.join(dir, COPY, "answers.json")),
    readFileSync(path.join(place, "answers.json")),
  );
  assert.equal(copyPin(dir), pinOf(place));
  assert.deepEqual(read(dir, DECLARATION).accepted.left, []);
  assert.equal(core(["--target", dir, "--moved"], list).status, 0);
  assert.match(status(dir, list).stdout, /is where this repository pinned it/);
  assert.equal(gate(dir).status, 0, gate(dir).stderr);
  // Nothing more to accept: said, and nothing written.
  const again = snapshot(dir);
  const none = accept(dir, list, ["--accept-all"]);
  assert.equal(none.status, 0, none.stderr);
  assert.match(none.stdout, /there is nothing to accept, and nothing was written/);
  assert.deepEqual(snapshot(dir), again);
});

test("a locked answer the repository would then hold otherwise becomes a question: nothing is written over", () => {
  const { dir, place, list } = member();
  const colour = primaryOf(dir);
  const sheet = text(dir, "src/index.css");
  const tokens = text(dir, "design/tokens.json");
  change(place, list, "source-color", ["--value", OTHER, "--why", "the brand was redrawn"]);

  // Looking says what accepting would meet here.
  const looked = core(["--target", dir, "--moved"], list).stdout;
  assert.match(
    looked,
    new RegExp(
      `here: this repository holds ${colour} in design/tokens.json: accepting it asks the owner`,
    ),
  );
  const taken = accept(dir, list, ["--accept", "source-color"]);
  assert.equal(taken.status, 1, taken.stderr);
  const pin = copyPin(dir);
  assert.equal(pin, pinOf(place));
  assert.match(taken.stdout, new RegExp(`question core-source-color-${pin}`));
  assert.match(
    taken.stdout,
    /waiting on the owner: source-color: nothing of the repository was written over/,
  );
  const question = read(dir, `design/waiting/core-source-color-${pin}.json`);
  assert.match(question.question, new RegExp(`locks ${OTHER}`));
  // No value of the repository was written over: the stylesheet and the token file are as before.
  assert.equal(text(dir, "src/index.css"), sheet);
  assert.equal(text(dir, "design/tokens.json"), tokens);
  // The gate is red until the owner answers, as on joining; an exception with its reason holds it.
  const red = gate(dir);
  assert.equal(red.status, 1);
  assert.match(red.stderr, new RegExp(`source-color: design/tokens.json holds .* locks ${OTHER}`));
  const settled = core(
    [
      "--target",
      dir,
      "--settle",
      "--by",
      MEMBER,
      "--on",
      ACCEPTED_ON,
      "--why",
      "source-color=this product keeps its own brand",
    ],
    list,
  );
  assert.equal(settled.status, 0, settled.stderr);
  assert.equal(gate(dir).status, 0, gate(dir).stderr);
});

test("a reason given in the session closes its question: nothing waits, for status or for the session's first line", () => {
  const { dir, place, list } = member();
  change(place, list, "source-color", ["--value", OTHER, "--why", "the brand was redrawn"]);
  assert.equal(accept(dir, list, ["--accept-all"]).status, 1);
  const pin = copyPin(dir);
  const file = `design/waiting/core-source-color-${pin}.json`;
  const asked = read(dir, file);
  assert.equal(asked.answer, undefined);
  const waitingIds = () =>
    JSON.parse(status(dir, list, ["--json"]).stdout).waiting.map((item) => item.id);
  const line = () =>
    spawnSync(execPath, [path.join(PLUGIN, "scripts/session-line.mjs"), "--target", dir], {
      encoding: "utf8",
      env: { ...env, DESIGN_ASSEMBLY_CORES: list },
    });
  assert.ok(waitingIds().includes(`core-source-color-${pin}`));
  assert.match(line().stdout, /1 question about the core waits on the owner/);

  // The person gives the reason in the session: the exception is recorded, and the question is
  // answered as the decision sheet would write it, a refusal with the reason, the name and the day.
  const why = "this product keeps its own brand";
  const settle = (more = []) =>
    core(
      [
        "--target",
        dir,
        "--settle",
        "--by",
        MEMBER,
        "--on",
        ACCEPTED_ON,
        "--why",
        `source-color=${why}`,
        ...more,
      ],
      list,
    );
  const dry = settle(["--dry-run"]);
  assert.match(
    dry.stdout,
    new RegExp(
      `would answer on the decision sheet, as the row's note says: core-source-color-${pin}`,
    ),
  );
  assert.equal(read(dir, file).answer, undefined, "a dry run answers nothing");
  const settled = settle();
  assert.equal(settled.status, 0, settled.stderr);
  assert.match(
    settled.stdout,
    new RegExp(
      `answered on the decision sheet, as the row's note says: core-source-color-${pin}: refused with its reason, so it waits no longer`,
    ),
  );
  assert.deepEqual(read(dir, file), {
    ...asked,
    answer: "refuse",
    said: why,
    by: MEMBER,
    on: ACCEPTED_ON,
  });
  // Nothing waits: the decision sheet, status and the session's first line say so, and the gate holds.
  const sheet = run("decide.mjs", ["--target", dir, "--json"], list);
  assert.ok(!JSON.parse(sheet.stdout).questions.some((item) => item.id.startsWith("core-")));
  assert.ok(!waitingIds().some((id) => id.startsWith("core-")));
  assert.equal(line().stdout, "");
  assert.equal(gate(dir).status, 0, gate(dir).stderr);
  // status ends as it does on the same repository with no such question on its list.
  const withAnswer = status(dir, list);
  const listed = waitingIds();
  rmSync(path.join(dir, file));
  const without = status(dir, list);
  assert.equal(withAnswer.status, without.status);
  assert.deepEqual(waitingIds(), listed);

  // A question left unanswered beside an exception already recorded, as a settle of an earlier
  // version left it: neither status nor the line counts it, and the next settle closes it.
  put(dir, file, json(asked));
  assert.ok(!waitingIds().some((id) => id.startsWith("core-")));
  assert.equal(line().stdout, "");
  assert.equal(status(dir, list).status, without.status);
  const again = core(["--target", dir, "--settle", "--by", MEMBER, "--on", "2026-11-30"], list);
  assert.equal(again.status, 0, again.stderr);
  // The answer is the one the note holds: who gave the reason, and when.
  assert.deepEqual(read(dir, file), {
    ...asked,
    answer: "refuse",
    said: why,
    by: MEMBER,
    on: ACCEPTED_ON,
  });
});

test("where the copy cannot be read, core --moved names no pin: it says the pin cannot be read, and why", () => {
  const { dir, list } = member();
  const copy = path.join(dir, COPY, "answers.json");
  writeFileSync(copy, readFileSync(copy, "utf8").replace("locked", "default"));
  const moved = core(["--target", dir, "--moved"], list);
  assert.equal(moved.status, 0, moved.stderr);
  assert.doesNotMatch(moved.stdout, /null|undefined/);
  assert.match(moved.stdout, new RegExp(`^family core: ${FAMILY}: the pin cannot be read$`, "m"));
  assert.match(moved.stdout, /the copy of the core here cannot be read \(.*sha256 differs\)/);
  // A declaration nobody can read names no family either.
  writeFileSync(path.join(dir, DECLARATION), "{ not json");
  const lost = core(["--target", dir, "--moved"], list);
  assert.equal(lost.status, 0, lost.stderr);
  assert.doesNotMatch(lost.stdout, /null|undefined/);
  assert.match(
    lost.stdout,
    /^family core: the family this repository declares: the pin cannot be read$/m,
  );
  for (const script of ["status.mjs", "inventory.mjs"]) {
    assert.doesNotMatch(
      run(script, ["--target", dir], list).stdout,
      /pinned (here )?at null|family core: null/,
    );
  }
});

test("an exception stands when another answer is accepted, and a question about the earlier pin is asked anew", () => {
  // The repository joins a core that locks another colour: a question waits about the first pin.
  const dir = adopted();
  const place = coreFolder({ colour: OTHER });
  const list = listIn();
  assert.equal(join(dir, place, list).status, 1);
  const first = copyPin(dir);
  const asked = `design/waiting/core-source-color-${first}.json`;
  assert.ok(existsSync(path.join(dir, asked)));

  // Another answer moves; accepting it takes the old question away and asks it at the new pin.
  change(place, list, "failed-action", [
    "--hold",
    "default",
    "--why",
    "kept by a test in each app",
  ]);
  const one = accept(dir, list, ["--accept-all"]);
  assert.equal(one.status, 1, one.stderr);
  const second = copyPin(dir);
  assert.ok(!existsSync(path.join(dir, asked)), "the question about the earlier pin is gone");
  assert.match(one.stdout, new RegExp(`took away ${asked}: it asked about the earlier pin`));
  assert.ok(existsSync(path.join(dir, `design/waiting/core-source-color-${second}.json`)));

  // The owner keeps the repository's colour as an exception, with the reason.
  const why = "this product keeps its own brand";
  const settled = core(
    [
      "--target",
      dir,
      "--settle",
      "--by",
      MEMBER,
      "--on",
      ACCEPTED_ON,
      "--why",
      `source-color=${why}`,
    ],
    list,
  );
  assert.equal(settled.status, 0, settled.stderr);
  assert.match(
    noteOf(dir, "source-color"),
    new RegExp(`^kept against the family core at ${second}: ${why}`),
  );

  // Yet another answer moves: the exception stands at the new pin, and nobody is asked again.
  change(place, list, "record-panel", [
    "--hold",
    "default",
    "--why",
    "one app opens records in place",
  ]);
  const two = accept(dir, list, ["--accept", "record-panel"]);
  assert.equal(two.status, 0, two.stderr);
  const third = copyPin(dir);
  assert.notEqual(third, second);
  assert.match(
    noteOf(dir, "source-color"),
    new RegExp(
      `^kept against the family core at ${third}: ${why} \\(by ${MEMBER} on ${ACCEPTED_ON}\\)`,
    ),
  );
  assert.ok(!existsSync(path.join(dir, `design/waiting/core-source-color-${third}.json`)));
  assert.equal(gate(dir).status, 0, gate(dir).stderr);

  // The locked answer itself changes: the exception was against the earlier value, so the owner
  // is asked again.
  change(place, list, "source-color", ["--value", "#00695c", "--why", "the brand was redrawn"]);
  const three = accept(dir, list, ["--accept-all"]);
  assert.equal(three.status, 1, three.stderr);
  assert.ok(existsSync(path.join(dir, `design/waiting/core-source-color-${copyPin(dir)}.json`)));
});

test("a default the core changed stays the repository's own answer, recorded with its reason", () => {
  const { dir, place, list } = member({ make: guided, colour: BRAND });
  const blueprint = text(dir, "design/blueprint.json");
  change(place, list, "type-scale-values", [
    "--value",
    "modular major-third",
    "--why",
    "the product reads at a distance",
  ]);
  const looked = core(["--target", dir, "--moved"], list).stdout;
  assert.match(
    looked,
    /here: this repository holds standard in design\/blueprint\.json: a default may be held otherwise, so it stays/,
  );
  const taken = accept(dir, list, ["--accept-all"]);
  assert.equal(taken.status, 0, taken.stderr);
  assert.match(
    taken.stdout,
    /here: this repository holds its own, recorded with its reason; this repository holds standard/,
  );
  const pin = copyPin(dir);
  assert.equal(
    noteOf(dir, "type-scale-values").split(";")[0],
    `changed from the family core at ${pin}: the repository's own answer from before the family core changed this default (by ${MEMBER} on ${ACCEPTED_ON})`,
  );
  assert.equal(text(dir, "design/blueprint.json"), blueprint);
});

test("a move that leaves the exports behind says so, and wrong calls write nothing", () => {
  const { dir, place, list } = member({ make: guided, colour: BRAND });
  const brought = run("bring-out.mjs", ["--target", dir], list);
  assert.equal(brought.status, 0, brought.stderr);
  change(place, list, "record-panel", [
    "--hold",
    "default",
    "--why",
    "one app opens records in place",
  ]);
  const before = snapshot(dir);
  // Wrong calls: nobody named, an answer that did not change, two moves at once, a stray flag.
  for (const [args, why] of [
    [["--target", dir, "--accept-all"], /say who accepts, with --by NAME/],
    [
      ["--target", dir, "--accept", "source-color", "--by", MEMBER],
      /source-color did not change in the core/,
    ],
    [["--target", dir, "--accept-all", "--moved", "--by", MEMBER], /are two calls; give one/],
    [["--target", dir, "--moved", "--by", MEMBER], /--by is not taken by --moved/],
    [["--target", dir, "--moved", "--only", "record-panel"], /--only and --out go with --draw/],
    [["--target", dir, "--accept-all", "--by", "dan@example.invalid"], /e-mail address/],
  ]) {
    const refused = core(args, list);
    assert.equal(refused.status, 2, args.join(" "));
    assert.match(refused.stderr, why);
  }
  assert.deepEqual(snapshot(dir), before);
  const dry = accept(dir, list, ["--accept-all"], ["--dry-run", "--json"]);
  assert.equal(dry.status, 0, dry.stderr);
  const preview = JSON.parse(dry.stdout);
  assert.ok(preview.exports.behind.includes("DESIGN.md"));
  assert.deepEqual(snapshot(dir), before);
  const done = accept(dir, list, ["--accept-all"]);
  assert.match(
    done.stdout,
    /the exports are behind the design ledgers \(DESIGN\.md, .*\), so the gate's row design-exports is red until they are written again: make design-exports/,
  );
});

test("core --change says how members learn of it", () => {
  const place = coreFolder();
  const said = change(place, listIn(), "record-panel", [
    "--value",
    "over",
    "--why",
    "panels cover the list",
  ]);
  assert.match(
    said.stdout,
    /each member learns the core moved ahead of its pin where it can look at this folder .* a person there accepts the change, answer by answer \(core --accept\)/,
  );
  assert.doesNotMatch(said.stdout, /a later slice/);
});

// ---- criterion 20: a separate working folder of git --------------------------------------------

test("from a separate working folder of git, the core is found the same and accepting writes the same", () => {
  const { dir, place, list } = member();
  git(dir, "init", "-q", "-b", "main");
  git(dir, "add", "-A");
  git(dir, "commit", "-q", "-m", "joined");
  const work = path.join(path.dirname(dir), "member-work");
  assert.equal(git(dir, "worktree", "add", "-q", work).status, 0);
  change(place, list, "record-panel", [
    "--hold",
    "default",
    "--why",
    "one app opens records in place",
  ]);

  const same = (script, args) => {
    const main = run(script, ["--target", dir, ...args], list);
    const other = run(script, ["--target", work, ...args], list);
    assert.equal(other.status, main.status, `${script} ${args.join(" ")}`);
    assert.equal(other.stdout, main.stdout, `${script} ${args.join(" ")}`);
  };
  same("core.mjs", ["--moved"]);
  same("core.mjs", ["--accept-all", "--by", MEMBER, "--on", ACCEPTED_ON, "--dry-run"]);
  const told = (target) =>
    status(target, list)
      .stdout.split("\n")
      .filter((line) => /the core|changed:|accepts/.test(line));
  assert.deepEqual(told(work), told(dir));
  assert.ok(told(dir).length >= 3);
  // Accepted from the separate folder, the core's line is the repository's, by its main folder.
  const done = accept(work, list, ["--accept-all"]);
  assert.equal(done.status, 0, done.stderr);
  assert.deepEqual(
    read(place, "core.json").members.map((item) => item.repository),
    ["member-app"],
  );
  assert.equal(copyPin(work), pinOf(place));
});

// ---- criteria 1, 14 and 15 ---------------------------------------------------------------------

test("a repository that stands alone: status and inventory read no core, say no word of one and write nothing", () => {
  const FAMILY_WORDS = /family core|the core|core --/i;
  const kinds = { "no ledgers": () => floor(), adopted, guided, "no Makefile": noMakefile };
  for (const [kind, make] of Object.entries(kinds)) {
    const dir = make();
    // No list, a list nobody can read, and a list that holds a core: the same in every way.
    const held = listIn();
    writeFileSync(
      held,
      json({
        version: 1,
        cores: [{ family: FAMILY, path: coreFolder(), on: "2026-11-26", how: "built" }],
        declined: [{ repository: dir, on: "2026-11-26" }],
      }),
    );
    const broken = listIn();
    writeFileSync(broken, "{ not json");
    const before = snapshot(dir);
    const seen = [listIn(), broken, held].map((list) => {
      const calls = [
        ["status.mjs", ["--target", dir, "--json"]],
        ["status.mjs", ["--target", dir]],
        ["inventory.mjs", ["--target", dir, "--json"]],
        ["inventory.mjs", ["--target", dir]],
      ].map(([script, args]) => {
        const done = run(script, args, list);
        assert.doesNotMatch(done.stdout, FAMILY_WORDS, `${kind}: ${script}`);
        return [script, done.status, done.stdout];
      });
      assert.ok(!("core" in JSON.parse(calls[0][2])), kind);
      assert.ok(!("core" in JSON.parse(calls[2][2])), kind);
      // The moves of a member refuse, and write nothing.
      for (const args of [["--moved"], ["--accept-all", "--by", MEMBER]]) {
        const refused = core(["--target", dir, ...args], list);
        assert.equal(refused.status, 2, `${kind}: ${args[0]}`);
        assert.match(refused.stderr, /this repository declares no family/, kind);
      }
      return calls;
    });
    assert.deepEqual(seen[1], seen[0], kind);
    assert.deepEqual(seen[2], seen[0], kind);
    assert.deepEqual(snapshot(dir), before, `${kind}: nothing written`);
  }
});

test("no move reaches the network, and the family's name lands only in the copy and the declaration", () => {
  const { dir, place, list } = member();
  change(place, list, "record-panel", [
    "--hold",
    "default",
    "--why",
    "one app opens records in place",
  ]);
  const log = path.join(empty(), "network.log");
  const guarded = (script, args) =>
    run(script, args, list, { guard: true, env: { DESIGN_ASSEMBLY_NETWORK_LOG: log } });
  assert.equal(guarded("core.mjs", ["--target", dir, "--moved"]).status, 1);
  assert.equal(guarded("status.mjs", ["--target", dir]).stderr, "");
  assert.equal(guarded("inventory.mjs", ["--target", dir]).status, 0);
  assert.equal(
    guarded("core.mjs", ["--target", dir, "--accept-all", "--by", MEMBER, "--on", ACCEPTED_ON])
      .status,
    0,
  );
  assert.ok(!existsSync(log) || readFileSync(log, "utf8") === "", "the network was reached");
  assert.deepEqual(holding(dir, FAMILY), [`${COPY}/core.json`, DECLARATION]);
  // The plugin's files of this slice name no family, and none opens a connection.
  for (const file of [
    "scripts/core-moved.mjs",
    "scripts/core-moved-call.mjs",
    "scripts/core-accept.mjs",
    "scripts/core-eye.mjs",
    "scripts/core-publish.mjs",
    "scripts/session-line.mjs",
    "hooks/hooks.json",
  ]) {
    const words = readFileSync(path.join(PLUGIN, file), "utf8");
    assert.ok(!words.includes(FAMILY) && !/tidewater/i.test(words), file);
    assert.doesNotMatch(
      words,
      /node:(https?|net|tls|dgram|dns)|\bfetch\(|XMLHttpRequest|WebSocket/,
      `${file} names a way to the network`,
    );
  }
  rmSync(log, { force: true });
});
