// The review of a drawn screen, slice 2 (specification 0009, criteria 4, 5 and 8): an eye's findings
// are read in one fixed shape and refused when one of them cannot be harvested; each finding, the
// ones the machine measured and the ones an eye saw, is put in one of three groups by what it rests
// on; and only with --queue does a question reach the waiting list, one new file each. Every
// findings file here is written by hand, so no model is called and each test gives one answer.
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import {
  cpSync,
  lstatSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { execPath } from "node:process";
import { after, test } from "node:test";
import { fileURLToPath } from "node:url";

import { readCapabilities } from "../scripts/capabilities.mjs";
import { EXIT } from "../scripts/command.mjs";
import { partsOf, renderDocument } from "../scripts/document.mjs";
import { originOf } from "../scripts/family.mjs";
import { review } from "../scripts/review.mjs";
import { recordOf } from "../scripts/review-record.mjs";
import { factsOf } from "../scripts/review-pack.mjs";
import {
  eyesOf,
  FINDINGS_FILE,
  GROUPS,
  harvestOf,
  mergeFindings,
  listedOf,
  pictureProblems,
  queueOf,
  readFindings,
  seenFindings,
} from "../scripts/review-harvest.mjs";
import { slipsProblem } from "../templates/tools/design-assembly/governance.mjs";
import { WAITING_FOLDER, WAITING_LIST } from "../templates/tools/design-assembly/waiting.mjs";
import { canDraw, reviewRepository } from "./helpers/review-repo.mjs";

const PLUGIN = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const REVIEW = path.join(PLUGIN, "scripts/review.mjs");
const LIMITS = JSON.parse(readFileSync(path.join(PLUGIN, "references/limits.json"), "utf8")).limits;
const DAY = "2026-11-20";

const removals = [];
after(() => removals.forEach((remove) => remove()));
const folder = () => {
  const dir = mkdtempSync(path.join(tmpdir(), "design-harvest-"));
  removals.push(() => rmSync(dir, { recursive: true, force: true }));
  return dir;
};
const sample = (options) => {
  const made = reviewRepository({ unheld: true, unchecked: true, ...options });
  removals.push(made.remove);
  return made.dir;
};
const run = (args, options = {}) =>
  spawnSync(execPath, [REVIEW, ...args], { encoding: "utf8", ...options });

function tree(dir, at = "") {
  return readdirSync(path.join(dir, at))
    .sort()
    .filter((name) => !(at === "" && ["node_modules", ".git"].includes(name)))
    .flatMap((name) => {
      const relative = path.posix.join(at, name);
      const full = path.join(dir, relative);
      if (lstatSync(full).isDirectory()) return [`${relative}/`, ...tree(dir, relative)];
      return [`${relative} ${createHash("sha256").update(readFileSync(full)).digest("hex")}`];
    });
}

// The eye the socket board names, read from the board as the skill reads it: never written here.
const [EYE] = eyesOf();
const EYE_NAME = EYE?.names[0];
const PICTURE = "orders-ready-320-light";
const lineOf = (facts, words) => facts.rules.lines.find((line) => line.text === words).line;

// A findings file an eye would write after reading the pack, one finding for each thing it can rest
// on: a row a check holds, a held line of the rules page, a line no check holds, a principle the
// owner fixed, a row no check holds, and nothing.
function eyeFile(facts, change = (findings) => findings) {
  const findings = [
    {
      picture: PICTURE,
      severity: "high",
      saw: "The date under the title is too faint to read",
      fix: "Give the date the colour of the body text.",
      rests_on: { kind: "ledger-row", id: "color-contrast" },
    },
    {
      picture: "orders-ready-1280-light",
      severity: "medium",
      saw: "The refresh button has no words but its own name",
      rests_on: { kind: "rule-line", line: lineOf(facts, "A screen writes no word itself.") },
    },
    {
      picture: "orders-empty-320-light",
      severity: "medium",
      saw: "The empty state does not say how orders get there",
      fix: "Say that orders appear once a customer places one.",
      place: { x: 24, y: 80, width: 272, height: 24 },
      rests_on: {
        kind: "rule-line",
        line: lineOf(facts, "An empty state says why it is empty and how items get there."),
      },
    },
    {
      picture: PICTURE,
      severity: "low",
      saw: "The heading and the first line are of one weight, so nothing leads the eye",
      rests_on: { kind: "principle", id: "principle-clear-hierarchy" },
    },
    {
      picture: "orders-empty-1280-dark",
      severity: "low",
      saw: "The empty state's words are the same as the heading's",
      rests_on: { kind: "ledger-row", id: "empty-state-words" },
    },
    {
      picture: "orders-ready-1280-dark",
      severity: "low",
      saw: "The page feels empty on a wide window",
      rests_on: { kind: "nothing" },
    },
  ];
  return JSON.stringify({
    version: 1,
    screen: "orders",
    eye: EYE_NAME,
    findings: change(findings),
  });
}

const shotsOf = (facts) =>
  facts.screen.states.flatMap((state) =>
    facts.widths.flatMap((width) =>
      ["light", "dark"].map((theme) => ({ id: `orders-${state}-${width}-${theme}`, state })),
    ),
  );

test("the socket board names one eye for the design review socket, a skill, and the core names none", () => {
  const { plugs } = readCapabilities();
  const eyes = eyesOf();
  assert.equal(eyes.length, 1);
  const plug = plugs.find((candidate) => candidate.id === eyes[0].id);
  assert.ok(plug.sockets.includes("design-review"));
  assert.equal(plug.kind, "skill");
  assert.deepEqual(eyes[0].names, plug.names);
  // A plug that is not a skill, as an engine of a package, is no eye.
  for (const other of plugs.filter((candidate) => candidate.kind !== "skill")) {
    assert.ok(!eyes.some((eye) => eye.id === other.id), other.id);
  }
});

test("criterion 4: a whole findings file is read, and each finding says what it rests on in full", () => {
  const dir = sample();
  const facts = factsOf(dir, "orders");
  const read = readFindings(eyeFile(facts), facts);
  assert.equal(read.eye, EYE_NAME);
  assert.equal(read.findings.length, 6);
  const [row, held, unheld, principle, unchecked, nothing] = read.findings.map((f) => f.rests_on);
  assert.deepEqual(row, {
    kind: "ledger-row",
    ledger: "design/decisions.yaml",
    id: "color-contrast",
    check: "tool:tools/design-assembly/check.mjs",
    layer: "foundations",
  });
  assert.equal(held.kind, "rule-line");
  assert.equal(held.file, ".claude/rules/design-assembly.md");
  assert.equal(held.section, "Words");
  assert.equal(held.held, true);
  assert.equal(held.text, "A screen writes no word itself.");
  assert.equal(unheld.held, false);
  assert.equal(unheld.section, "No check holds these: a person reviews them");
  assert.equal(principle.kind, "principle");
  assert.equal(principle.statement, facts.principles[0].statement);
  assert.deepEqual(
    { check: unchecked.check, layer: unchecked.layer },
    { check: null, layer: "patterns" },
  );
  assert.equal(nothing.kind, "nothing");
  assert.ok(nothing.note.length > 0);
});

test("criterion 4: a finding with no picture, no severity or no rests_on is refused, and the refusal names the finding and what it lacks", () => {
  const dir = sample();
  const facts = factsOf(dir, "orders");
  const cases = [
    [(f) => [f[0], { ...f[1], picture: undefined }], /finding 2: .*no picture/],
    [(f) => [{ ...f[0], severity: undefined }], /finding 1: .*no severity/],
    [(f) => [f[0], f[1], { ...f[2], rests_on: undefined }], /finding 3: .*no rests_on/],
    [(f) => [{ ...f[0], severity: "urgent" }], /finding 1: .*severity .*high, medium, low/],
    [(f) => [{ ...f[0], saw: " " }], /finding 1: .*does not say what the eye saw/],
    [(f) => [{ ...f[0], rests_on: { kind: "hunch" } }], /finding 1: .*rests_on .*one of/],
    [
      (f) => [{ ...f[0], rests_on: { kind: "ledger-row", id: "no-such-row" } }],
      /finding 1: .*no-such-row is not a row of design\/decisions\.yaml/,
    ],
    [
      (f) => [{ ...f[0], rests_on: { kind: "rule-line", line: 2 } }],
      /finding 1: .*line 2 of .*design-assembly\.md is not a rule/,
    ],
    [
      (f) => [{ ...f[0], rests_on: { kind: "principle", id: "principle-dense-and-scannable" } }],
      /finding 1: .*principle-dense-and-scannable .*not fixed by the owner/,
    ],
    [(f) => [{ ...f[0], mood: "sad" }], /finding 1: .*unknown key 'mood'/],
  ];
  for (const [change, said] of cases) {
    assert.throws(() => readFindings(eyeFile(facts, change), facts), said, String(said));
  }
  // Every finding that lacks something is named, not only the first.
  assert.throws(
    () =>
      readFindings(
        eyeFile(facts, (f) => [{ ...f[0], picture: undefined }, f[1], { ...f[2], severity: null }]),
        facts,
      ),
    (error) =>
      /finding 1: .*no picture/.test(error.message) &&
      /finding 3: .*no severity/.test(error.message),
  );
  // The file as a whole: not JSON, of another screen, or by an eye the board does not name.
  assert.throws(() => readFindings("{ not json", facts), /not JSON/);
  const whole = JSON.parse(eyeFile(facts));
  assert.throws(
    () => readFindings(JSON.stringify({ ...whole, screen: "returns" }), facts),
    /of the screen returns, not orders/,
  );
  assert.throws(
    () => readFindings(JSON.stringify({ ...whole, eye: "a-made-up-eye" }), facts),
    /a-made-up-eye is not an eye the socket board names/,
  );
  assert.throws(() => readFindings(JSON.stringify({ ...whole, version: 9 }), facts), /version 1/);
  // A finding on a picture the review did not draw is named once the pictures are known.
  const read = readFindings(
    eyeFile(facts, (f) => [{ ...f[0], picture: "orders-ready-640-light" }]),
    facts,
  );
  assert.deepEqual(pictureProblems(read, shotsOf(facts)), [
    "finding 1: orders-ready-640-light is not a picture this review drew",
  ]);
});

test("criterion 4: a finding whose place lies outside the page of its picture is refused, once the page is known", () => {
  const dir = sample();
  const facts = factsOf(dir, "orders");
  const shots = shotsOf(facts).map((shot) => ({
    ...shot,
    page: { width: shot.id.includes("-320-") ? 320 : 1280, height: 600 },
  }));
  const placed = (place) =>
    readFindings(
      eyeFile(facts, (f) => [f[0], { ...f[2], picture: PICTURE, place }]),
      facts,
    );
  // Inside the page, to its very edge: taken.
  assert.deepEqual(pictureProblems(placed({ x: 0, y: 0, width: 320, height: 600 }), shots), []);
  // Past its right edge, or below its foot: refused, naming the finding.
  for (const place of [
    { x: 300, y: 10, width: 40, height: 20 },
    { x: 10, y: 590, width: 40, height: 20 },
    { x: 400, y: 10, width: 10, height: 10 },
  ]) {
    assert.deepEqual(pictureProblems(placed(place), shots), [
      `finding 2: its place (${place.x}, ${place.y}, ${place.width} × ${place.height}) lies outside ${PICTURE}, which is 320 × 600 pixels`,
    ]);
  }
});

test("the findings of an eye and those the machine measured read the same way, numbered together, the heaviest first", () => {
  const dir = sample();
  const facts = factsOf(dir, "orders");
  const read = readFindings(eyeFile(facts), facts);
  const shots = shotsOf(facts).map((shot) => ({
    ...shot,
    page: { width: shot.id.includes("-320-") ? 320 : 1280, height: 600 },
  }));
  const seen = seenFindings(read, shots);
  const measured = [
    {
      number: 1,
      kind: "contrast",
      severity: "medium",
      where: { path: "main > p", text: "Updated two days ago" },
      picture: PICTURE,
      position: { x: 24, y: 60, width: 160, height: 24 },
      measured: { ratio: 2.84, needed: 4.5 },
      seen_in: [PICTURE],
      places: 1,
      fix: "Give the text a colour that reaches 4.5:1.",
      rests_on: {
        kind: "ledger-row",
        ledger: "design/decisions.yaml",
        id: "color-contrast",
        check: "tool:tools/design-assembly/check.mjs",
      },
    },
  ];
  const all = mergeFindings(measured, seen);
  assert.deepEqual(
    all.map((finding) => finding.number),
    [1, 2, 3, 4, 5, 6, 7],
  );
  assert.deepEqual(
    all.map((finding) => [finding.severity, finding.by]),
    [
      ["high", EYE_NAME],
      ["medium", "review"],
      ["medium", EYE_NAME],
      ["medium", EYE_NAME],
      ["low", EYE_NAME],
      ["low", EYE_NAME],
      ["low", EYE_NAME],
    ],
  );
  // The same keys on both, so a reader of --json or of the record reads one shape.
  const keys = (finding) => Object.keys(finding).sort();
  for (const finding of all) {
    for (const key of [
      "number",
      "by",
      "kind",
      "severity",
      "where",
      "picture",
      "position",
      "seen_in",
      "fix",
      "rests_on",
    ]) {
      assert.ok(key in finding, `${finding.number} has no ${key}`);
    }
  }
  assert.deepEqual(keys(all[0]), keys(all[1]));
  const said = all.find(
    (finding) => finding.where.text === "The empty state does not say how orders get there",
  );
  assert.equal(said.kind, "seen");
  assert.deepEqual(said.position, { x: 24, y: 80, width: 272, height: 24 });
  // A finding whose eye named no place is noted on its whole picture.
  const whole = all.find((finding) => finding.where.text.startsWith("The refresh button"));
  assert.deepEqual(whole.position, { x: 0, y: 0, width: 1280, height: 600 });
  assert.match(whole.fix, /no fix/);
});

test("criterion 5: each finding is in one of three groups, by what it rests on", () => {
  const dir = sample();
  const facts = factsOf(dir, "orders");
  const read = readFindings(eyeFile(facts), facts);
  const shots = shotsOf(facts).map((shot) => ({ ...shot, page: { width: 320, height: 600 } }));
  const findings = mergeFindings([], seenFindings(read, shots));
  const harvest = harvestOf(findings, facts, { target: dir, on: DAY });
  assert.deepEqual(GROUPS, ["escape", "question", "person"]);
  assert.equal(harvest.length, findings.length);
  const byText = (words) =>
    harvest.find((entry) => findings[entry.finding - 1].where.text.startsWith(words));

  // A row a check holds: the check let it through. The line for the ledger of escapes is printed,
  // with the day, what slipped, the layer of the row and what was done, and the gate reads it whole.
  const escaped = byText("The date under the title");
  assert.equal(escaped.group, "escape");
  assert.equal(escaped.file, "design/escapes.md");
  assert.match(escaped.line, /^\| 2026-11-20 \| .+ \| foundations \| .+ \|$/);
  assert.match(escaped.line, /color-contrast/);
  const table = `| Date | Slip | Layer | Done |\n| --- | --- | --- | --- |\n${escaped.line}\n`;
  assert.equal(slipsProblem(table), null);

  // A line of the rules page the gate holds: the gate let it through. The rules page names no
  // layer, so the cell is left for a person, and the line says so.
  const heldLine = byText("The refresh button");
  assert.equal(heldLine.group, "escape");
  assert.equal(heldLine.layer, null);
  assert.match(heldLine.line, /^\| 2026-11-20 \| .+ \| {2}\| .+ \|$/);
  assert.match(heldLine.why, /layer/);
  // Pasted as it is, the gate refuses it until a person writes the layer: the machine names none.
  const pasted = (line) => `| Date | Slip | Layer | Done |\n| --- | --- | --- | --- |\n${line}\n`;
  assert.match(slipsProblem(pasted(heldLine.line)), /names no layer/);
  assert.equal(slipsProblem(pasted(heldLine.line.replace("|  |", "| content |"))), null);

  // A line no check holds, a principle, and a row no check holds: a question for the owner, as the
  // exact call of the decision sheet. A row no check holds is asked about as that row.
  for (const words of [
    "The empty state does not say",
    "The heading and the first line",
    "The empty state's words",
  ]) {
    const entry = byText(words);
    assert.equal(entry.group, "question", words);
    assert.match(
      entry.call,
      /scripts\/decide\.mjs' --target '.+' --ask '.+' --recommend '.+' --because '.+' --easy-to-undo/,
    );
    assert.equal(entry.queued, null);
  }
  assert.equal(byText("The empty state's words").ask.item, "decision:empty-state-words");
  assert.match(byText("The empty state's words").call, /--item 'decision:empty-state-words'/);
  assert.equal(byText("The heading and the first line").ask.item, undefined);
  assert.match(byText("The heading and the first line").ask.basis, /principle-clear-hierarchy/);
  assert.match(byText("The empty state does not say").ask.basis, /no check holds/);

  // Nothing: for a person's eye, and no question.
  const person = byText("The page feels empty");
  assert.equal(person.group, "person");
  assert.equal(person.call, undefined);
  assert.match(person.why, /person/);
});

test("criterion 5: the machine's own findings are harvested too: a contrast row a check holds let it through, a broken word rests on nothing", () => {
  const dir = sample();
  const facts = factsOf(dir, "orders");
  const findings = [
    {
      number: 1,
      by: "review",
      kind: "contrast",
      severity: "medium",
      where: { path: "p", text: "Updated" },
      measured: { ratio: 2.84, needed: 4.5 },
      picture: PICTURE,
      rests_on: {
        kind: "ledger-row",
        ledger: "design/decisions.yaml",
        id: "color-contrast",
        check: "tool:tools/design-assembly/check.mjs",
      },
    },
    {
      number: 2,
      by: "review",
      kind: "broken-word",
      severity: "medium",
      where: { path: "p", text: "Internationalization" },
      picture: PICTURE,
      rests_on: { kind: "nothing", note: "no row" },
    },
  ];
  const harvest = harvestOf(findings, facts, { target: dir, on: DAY });
  assert.deepEqual(
    harvest.map((entry) => entry.group),
    ["escape", "person"],
  );
  assert.match(harvest[0].line, /the review's own measure/);
});

test("criterion 5: --queue writes each question as one new file of the waiting list, the same file the printed call writes, and nothing else", () => {
  const dir = sample();
  const facts = factsOf(dir, "orders");
  const read = readFindings(eyeFile(facts), facts);
  const shots = shotsOf(facts).map((shot) => ({ ...shot, page: { width: 320, height: 600 } }));
  const findings = mergeFindings([], seenFindings(read, shots));
  const harvest = harvestOf(findings, facts, { target: dir, on: DAY });
  const queued = queueOf(dir, harvest, { on: DAY });
  const files = Object.keys(queued.files);
  assert.equal(files.length, 3);
  assert.ok(files.every((file) => file.startsWith(`${WAITING_FOLDER}/`) && file.endsWith(".json")));
  for (const entry of queued.harvest.filter((item) => item.group === "question")) {
    assert.ok(files.includes(entry.queued.file), entry.queued.file);
  }
  // queueOf writes nothing itself.
  assert.deepEqual(
    readdirSync(dir).includes("design") &&
      readdirSync(path.join(dir, "design")).includes("waiting"),
    false,
  );
  // The printed call, run on a copy, writes the very file --queue writes.
  const copy = folder();
  cpSync(dir, copy, { recursive: true });
  const entry = queued.harvest.find((item) => item.ask?.item === "decision:empty-state-words");
  const call = entry.call.replace(`--target '${dir}'`, `--target '${copy}'`);
  const done = spawnSync("sh", ["-c", `${call} --on ${DAY}`], { encoding: "utf8" });
  assert.equal(done.status, EXIT.work, done.stderr);
  assert.equal(
    readFileSync(path.join(copy, entry.queued.file), "utf8"),
    queued.files[entry.queued.file],
  );
  // Asked again once it is there: it waits already, and no file is made for it.
  cpSync(path.join(copy, WAITING_FOLDER), path.join(dir, WAITING_FOLDER), { recursive: true });
  const again = queueOf(
    dir,
    harvestOf(findings, factsOf(dir, "orders"), { target: dir, on: DAY }),
    { on: DAY },
  );
  assert.equal(Object.keys(again.files).length, 2);
  assert.deepEqual(
    again.harvest.find((item) => item.ask?.item === "decision:empty-state-words").queued,
    { waits: entry.queued.id },
  );
});

test("criterion 5: --queue is refused, and nothing written, where the waiting list is one shared file", () => {
  const dir = sample();
  writeFileSync(
    path.join(dir, WAITING_LIST),
    `${JSON.stringify({ version: 1, rows: [] }, null, 2)}\n`,
  );
  const facts = factsOf(dir, "orders");
  const read = readFindings(eyeFile(facts), facts);
  const shots = shotsOf(facts).map((shot) => ({ ...shot, page: { width: 320, height: 600 } }));
  const harvest = harvestOf(mergeFindings([], seenFindings(read, shots)), facts, {
    target: dir,
    on: DAY,
  });
  assert.throws(() => queueOf(dir, harvest, { on: DAY }), /one shared file.*Nothing was written/);
});

test("criterion 5: --queue never writes over a file of the waiting list it does not read as a question", () => {
  const dir = sample();
  const facts = factsOf(dir, "orders");
  const read = readFindings(eyeFile(facts), facts);
  const shots = shotsOf(facts).map((shot) => ({ ...shot, page: { width: 320, height: 600 } }));
  const harvest = harvestOf(mergeFindings([], seenFindings(read, shots)), facts, {
    target: dir,
    on: DAY,
  });
  const [first] = Object.keys(queueOf(dir, harvest, { on: DAY }).files);
  // A file of that name that is no question: the waiting list refuses to be read, or the review
  // refuses to write over it; either way nothing is written over it.
  mkdirSync(path.join(dir, WAITING_FOLDER), { recursive: true });
  writeFileSync(path.join(dir, first), "not a question\n");
  const before = tree(dir);
  assert.throws(() => queueOf(dir, harvest, { on: DAY }), /not JSON|there already/);
  assert.deepEqual(tree(dir), before);
  assert.equal(readFileSync(path.join(dir, first), "utf8"), "not a question\n");
});

test("without --queue a question already on the waiting list is told so, and no call is offered for it", () => {
  const dir = sample();
  const facts = factsOf(dir, "orders");
  const read = readFindings(eyeFile(facts), facts);
  const shots = shotsOf(facts).map((shot) => ({ ...shot, page: { width: 320, height: 600 } }));
  const harvest = harvestOf(mergeFindings([], seenFindings(read, shots)), facts, {
    target: dir,
    on: DAY,
  });
  const queued = queueOf(dir, harvest, { on: DAY });
  const [file] = Object.keys(queued.files);
  mkdirSync(path.join(dir, WAITING_FOLDER), { recursive: true });
  writeFileSync(path.join(dir, file), queued.files[file]);
  const listed = listedOf(dir, harvest);
  const asked = queued.harvest.find((entry) => entry.queued?.file === file);
  const told = listed.find((entry) => entry.finding === asked.finding);
  assert.deepEqual(told.queued, { waits: asked.queued.id });
  assert.equal(
    listed.filter((entry) => entry.group === "question" && entry.queued === null).length,
    2,
  );
});

// ---- the command, on a drawn screen ---------------------------------------------------------------

function drawn(t) {
  if (!canDraw()) {
    t.skip("the repository this plugin lives in has no build or browser installed");
    return false;
  }
  return true;
}
const skipped = (t, called) => {
  if (/Executable doesn't exist|browserType\.launch/.test(called.stderr)) {
    t.skip("the browser of this machine is not installed");
    return true;
  }
  return false;
};

test("criterion 4: a findings file that cannot be harvested ends with 2 before anything is drawn, and leaves nothing behind", () => {
  const dir = sample();
  const facts = factsOf(dir, "orders");
  const file = path.join(folder(), FINDINGS_FILE);
  writeFileSync(
    file,
    eyeFile(facts, (f) => [f[0], { ...f[1], severity: undefined }]),
  );
  const before = tree(dir);
  const into = path.join(folder(), "review");
  const called = run([
    "orders",
    "--target",
    dir,
    "--states",
    "--findings",
    file,
    "--out",
    into,
    "--json",
  ]);
  assert.equal(called.status, EXIT.wrong, called.stdout);
  assert.equal(called.stdout, "");
  assert.match(called.stderr, /finding 2: .*no severity/);
  // The refusal names the file the caller gave, whatever it is called.
  assert.ok(called.stderr.startsWith(`design-assembly: ${file}: `), called.stderr);
  const named = path.join(folder(), "findings-bad.json");
  writeFileSync(
    named,
    eyeFile(facts, (f) => [{ ...f[0], picture: undefined }]),
  );
  const other = run(["orders", "--target", dir, "--findings", named, "--json"]);
  assert.equal(other.status, EXIT.wrong, other.stdout);
  assert.ok(other.stderr.startsWith(`design-assembly: ${named}: finding 1: `), other.stderr);
  assert.doesNotMatch(other.stderr, /review-findings\.json/);
  assert.deepEqual(tree(dir), before);
  assert.deepEqual(readdirSync(path.dirname(into)), []);
  // --findings names a file; --queue alone is a call of its own, and wrong words are refused.
  assert.equal(
    run(["orders", "--target", dir, "--findings", path.join(dir, "none.json")]).status,
    EXIT.wrong,
  );
});

test("criteria 5 and 8: with an eye's findings the review harvests them, says which eye looked, and changes nothing in the repository", (t) => {
  if (!drawn(t)) return;
  const dir = sample();
  const facts = factsOf(dir, "orders");
  const into = folder();
  const file = path.join(into, FINDINGS_FILE);
  writeFileSync(file, eyeFile(facts));
  const before = tree(dir);
  const called = run([
    "orders",
    "--target",
    dir,
    "--states",
    "--findings",
    file,
    "--out",
    into,
    "--json",
  ]);
  if (skipped(t, called)) return;
  assert.equal(called.status, EXIT.work, called.stderr);
  assert.deepEqual(tree(dir), before, "without --queue nothing in the repository changes");
  const result = JSON.parse(called.stdout);
  assert.equal(result.eye.looked, true);
  assert.equal(result.eye.by, EYE_NAME);
  assert.equal(result.eye.findings, 6);
  assert.deepEqual(result.eyes, eyesOf());
  const seen = result.findings.filter((finding) => finding.by === EYE_NAME);
  assert.equal(seen.length, 6);
  assert.ok(result.findings.some((finding) => finding.by === "review"));
  assert.deepEqual(
    result.findings.map((finding) => finding.number),
    result.findings.map((_, index) => index + 1),
  );
  assert.equal(result.harvest.length, result.findings.length);
  assert.ok(result.harvest.every((entry) => GROUPS.includes(entry.group)));
  assert.ok(result.harvest.every((entry) => entry.queued === undefined || entry.queued === null));
  // The record says which eye looked, not that none did, and has a note for every finding.
  const page = readFileSync(path.join(into, "design-review.html"), "utf8");
  assert.ok(page.includes(EYE_NAME));
  assert.doesNotMatch(page, /No eye has looked at the pictures/);
  const notes = [...page.matchAll(/data-note="(\d+)"/g)].map((match) => Number(match[1]));
  assert.equal(new Set(notes).size, result.findings.length);
  assert.ok(partsOf(page).length > 0);
  // For a person at a terminal: the groups, the line for the ledger of escapes, the call.
  const shown = run(["orders", "--target", dir, "--states", "--findings", file]);
  assert.equal(shown.status, EXIT.work, shown.stderr);
  assert.match(shown.stdout, new RegExp(`seen by ${EYE_NAME}`));
  assert.doesNotMatch(shown.stdout, /no eye has looked/);
  assert.match(shown.stdout, /add to design\/escapes\.md:\n +\| \d{4}-\d{2}-\d{2} \|/);
  assert.match(shown.stdout, /decide\.mjs' --target/);
  assert.match(shown.stdout, /nothing was written: run again with --queue/);
  assert.deepEqual(tree(dir), before);
});

test("criterion 5: with --queue only new files of the waiting list appear, one for each question", (t) => {
  if (!drawn(t)) return;
  const dir = sample();
  const facts = factsOf(dir, "orders");
  const file = path.join(folder(), FINDINGS_FILE);
  writeFileSync(file, eyeFile(facts));
  const before = tree(dir);
  const called = run([
    "orders",
    "--target",
    dir,
    "--states",
    "--findings",
    file,
    "--queue",
    "--json",
  ]);
  if (skipped(t, called)) return;
  assert.equal(called.status, EXIT.work, called.stderr);
  const result = JSON.parse(called.stdout);
  const after = tree(dir);
  const added = after.filter((line) => !before.includes(line));
  const gone = before.filter((line) => !after.includes(line));
  assert.deepEqual(gone, []);
  const questions = result.harvest.filter((entry) => entry.group === "question");
  assert.equal(questions.length, 3);
  assert.deepEqual(
    added.map((line) => line.split(" ")[0]).sort(),
    [`${WAITING_FOLDER}/`, ...questions.map((entry) => entry.queued.file)].sort(),
  );
  assert.deepEqual(
    result.files.map((change) => change.path).sort(),
    questions.map((entry) => entry.queued.file).sort(),
  );
  // Run again: the questions wait already, and nothing more is written.
  const again = run([
    "orders",
    "--target",
    dir,
    "--states",
    "--findings",
    file,
    "--queue",
    "--json",
  ]);
  assert.equal(again.status, EXIT.work, again.stderr);
  assert.deepEqual(tree(dir), after);
  assert.ok(
    JSON.parse(again.stdout)
      .harvest.filter((entry) => entry.group === "question")
      .every((entry) => typeof entry.queued.waits === "string"),
  );
});

test("criterion 8: the skill hands the pictures and the pack to the eye the socket board names, never by its own words", () => {
  const skill = readFileSync(path.join(PLUGIN, "skills/review/SKILL.md"), "utf8");
  for (const said of [
    "--findings",
    FINDINGS_FILE,
    "--queue",
    "eyes",
    "rests_on",
    "design/escapes.md",
  ]) {
    assert.ok(skill.includes(said), said);
  }
  for (const eye of eyesOf()) {
    for (const name of eye.names) assert.ok(!skill.includes(name), name);
  }
  assert.match(skill, /no eye has looked/i);
});

test("the same repository reviewed on two different days gives the same record, byte for byte", async (t) => {
  if (!drawn(t)) return;
  const dir = sample();
  const facts = factsOf(dir, "orders");
  const findings = eyeFile(facts, (f) => [f[0], f[1]]);
  const origin = originOf(dir);
  const pages = [];
  let lines;
  try {
    const days = ["2026-11-20", "2026-12-24"];
    const done = [];
    for (const on of days)
      done.push(await review(dir, "orders", { all: true, keep: true, findings, on }));
    for (const { result } of done) pages.push(renderDocument(recordOf(result, origin)));
    lines = done.map(({ result }) => result.harvest.filter((entry) => entry.group === "escape"));
  } catch (error) {
    if (/Executable doesn't exist|browserType\.launch/.test(error.message)) {
      t.skip("the browser of this machine is not installed");
      return;
    }
    throw error;
  }
  assert.ok(lines[0].length > 0, "the sample gives lines for the ledger of escapes");
  assert.equal(pages[1], pages[0]);
  assert.doesNotMatch(pages[0], /2026-11-20|2026-12-24/);
  // The answer for a machine still dates each line with the day it was run, to be pasted that day.
  assert.ok(
    lines[0].every(
      (entry) => entry.day === "2026-11-20" && entry.line.startsWith("| 2026-11-20 |"),
    ),
  );
  assert.ok(
    lines[1].every(
      (entry) => entry.day === "2026-12-24" && entry.line.startsWith("| 2026-12-24 |"),
    ),
  );
});

test("the limit of the socket is narrowed to what an eye still leaves open", () => {
  const { table } = readCapabilities();
  const socket = table.capabilities.find((item) => item.id === "design-review");
  const old = LIMITS.find((limit) => limit.id === "capability-design-review-no-eye-on-the-picture");
  assert.equal(old.status, "closed");
  assert.match(old.closed_by, /harvest/);
  const open = LIMITS.find((limit) => limit.id === socket.limit);
  assert.equal(open.status, "open");
  assert.notEqual(open.id, old.id);
  assert.match(socket.socket.outputs.join(" "), /rules page/);
});
