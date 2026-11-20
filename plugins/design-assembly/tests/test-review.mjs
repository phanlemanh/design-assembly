// The review of a drawn screen (specification 0009, slice 1): the screen is drawn at every declared
// width in light and in dark, two things are measured on it with no model called, a pack is written
// for an eye to read later, and a record is handed to a person. The repository is never written to.
// Each test runs the command on a throwaway application with places planted to break a measurement.
import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import {
  existsSync,
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

import { readCapabilities, socketsOf } from "../scripts/capabilities.mjs";
import { EXIT } from "../scripts/command.mjs";
import { PARTS, partsOf } from "../scripts/document.mjs";
import { canDraw, PLANTED, reviewRepository, WIDTHS } from "./helpers/review-repo.mjs";

const PLUGIN = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const REVIEW = path.join(PLUGIN, "scripts/review.mjs");
const json = (file) => JSON.parse(readFileSync(path.join(PLUGIN, file), "utf8"));
const LIMITS = json("references/limits.json").limits;
const PNG = Buffer.from([0x89, 0x50, 0x4e, 0x47]);

const removals = [];
after(() => removals.forEach((remove) => remove()));
const folder = () => {
  const dir = mkdtempSync(path.join(tmpdir(), "design-review-"));
  removals.push(() => rmSync(dir, { recursive: true, force: true }));
  return dir;
};
const sample = (options) => {
  const made = reviewRepository(options);
  removals.push(made.remove);
  return made.dir;
};
const run = (args, options = {}) =>
  spawnSync(execPath, [REVIEW, ...args], { encoding: "utf8", ...options });

// Every file of a repository with the hash of its bytes, the packages folder left out: that is
// where the repository's own build keeps what it prepared, as it does on every run of its
// development server, and no file of the repository is there.
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
const hashOf = (dir) => createHash("sha256").update(tree(dir).join("\n")).digest("hex");

// One review of a sample, run once and read by every test that asks for the same one. A machine
// with no browser to draw with skips the test instead of failing it.
const kept = {};
function reviewed(t, key, { repository = {}, args = [], out = false } = {}) {
  if (!canDraw()) {
    t.skip("the repository this plugin lives in has no build or browser installed");
    return null;
  }
  if (!kept[key]) {
    const dir = sample(repository);
    const before = hashOf(dir);
    const into = out ? folder() : null;
    const called = run([
      "orders",
      "--target",
      dir,
      "--json",
      ...args,
      ...(into ? ["--out", into] : []),
    ]);
    kept[key] = { dir, before, out: into, called };
  }
  const { called } = kept[key];
  if (/Executable doesn't exist|browserType\.launch/.test(called.stderr)) {
    t.skip("the browser of this machine is not installed");
    return null;
  }
  assert.ok([EXIT.done, EXIT.work].includes(called.status), called.stderr);
  return { ...kept[key], result: JSON.parse(called.stdout) };
}
const kinds = (result) => result.findings.map((finding) => finding.kind).sort();

test("criterion 1: one picture for each declared width, in light and in dark, written to --out and nowhere else", (t) => {
  const first = reviewed(t, "planted", { out: true });
  if (!first) return;
  const { result, out, dir, before } = first;
  assert.deepEqual(result.widths, WIDTHS);
  assert.deepEqual(
    result.shots.map((shot) => [shot.state, shot.width, shot.theme]),
    WIDTHS.flatMap((width) => ["light", "dark"].map((theme) => ["ready", width, theme])),
  );
  for (const shot of result.shots) {
    const picture = readFileSync(path.join(out, shot.file));
    assert.ok(picture.subarray(0, 4).equals(PNG), `${shot.file} is not a picture`);
    assert.ok(shot.page.width >= shot.width && shot.page.height > 0, shot.file);
  }
  // The repository is as it was: the hash of its tree before and after is the same.
  assert.equal(hashOf(dir), before);
  assert.deepEqual(
    readdirSync(path.join(out, "shots")).sort(),
    result.shots.map((s) => path.basename(s.file)).sort(),
  );
});

test("criterion 1: with --states there is a picture for each state of the screen, and the tree is still the same", (t) => {
  const all = reviewed(t, "states", { args: ["--states"], out: true });
  if (!all) return;
  const { result, out, dir, before } = all;
  assert.deepEqual([...new Set(result.shots.map((shot) => shot.state))], ["ready", "empty"]);
  assert.equal(result.shots.length, 2 * WIDTHS.length * 2);
  for (const shot of result.shots) assert.ok(existsSync(path.join(out, shot.file)), shot.file);
  assert.equal(hashOf(dir), before);
});

test("without --out no file is written anywhere: the screen is still drawn and measured", (t) => {
  const bare = reviewed(t, "clean", { repository: { planted: [] } });
  if (!bare) return;
  const { result, dir, before, called } = bare;
  assert.equal(called.status, EXIT.done, "a screen with nothing found ends with 0");
  assert.deepEqual(result.findings, []);
  assert.equal(result.shots.length, WIDTHS.length * 2);
  assert.ok(result.shots.every((shot) => shot.file === null));
  assert.equal(result.files, undefined);
  assert.equal(hashOf(dir), before);
});

test("what a machine cannot judge is named for a person's eye, never counted and never passed over", (t) => {
  const bare = reviewed(t, "clean", { repository: { planted: [] } });
  if (!bare) return;
  // The screen holds words on a gradient and a line its box shortens with an ellipsis: neither is
  // a finding, and both are said. What is plainly fine on it, a word turning at its own hyphen or
  // dash, a panel kept off the screen, words for a screen reader, a control that cannot be used,
  // is neither.
  assert.deepEqual(
    bare.result.unjudged.map((item) => [item.kind, item.where.text]),
    [
      ["text-on-a-picture", "Words on a gradient"],
      ["text-shortened", "A label its box shortens with a mark"],
    ],
  );
  assert.ok(bare.result.unjudged.every((item) => item.seen_in.length === WIDTHS.length * 2));
});

test("a screen on the browser's own page colour is measured against that colour in dark", (t) => {
  const own = reviewed(t, "own page", { repository: { planted: [], ownPage: true } });
  if (!own) return;
  // In dark the browser paints a dark page and light text: nothing to find, and users reach it.
  assert.deepEqual(own.result.findings, []);
  assert.equal(own.result.shots.length, WIDTHS.length * 2);
  const dark = own.result.themes.find((theme) => theme.name === "dark");
  assert.equal(dark.reachable, true);
  assert.match(dark.how, /system/);
});

test("an application with no dark theme is drawn in light alone, and a state nothing says how to reach is named", (t) => {
  const plain = reviewed(t, "no dark, no list", {
    repository: { planted: [], dark: false, listed: false },
    args: ["--states"],
    out: true,
  });
  if (!plain) return;
  const { result, called, out } = plain;
  assert.deepEqual(
    result.shots.map((shot) => [shot.state, shot.width, shot.theme]),
    WIDTHS.map((width) => ["ready", width, "light"]),
  );
  const dark = result.themes.find((theme) => theme.name === "dark");
  assert.deepEqual([dark.drawn, dark.reachable], [false, false]);
  const kinds = result.unjudged.map((item) => item.kind);
  assert.ok(kinds.includes("no-dark-theme"));
  const missed = result.unjudged.find((item) => item.kind === "state-not-drawn");
  assert.match(missed.note, /The state empty was not drawn/);
  // A picture that was asked for and not drawn is work left, with nothing found.
  assert.deepEqual(result.findings, []);
  assert.equal(called.status, EXIT.work);
  const page = readFileSync(path.join(out, "design-review.html"), "utf8");
  assert.match(page, /In light; of dark:/);
  assert.match(page, /<code>no-dark-theme<\/code>/);
  assert.match(page, /<code>state-not-drawn<\/code>/);
});

test("criterion 2: the pack an eye reads later lists the pictures, the rules, what the owner fixed and the screen's rows", (t) => {
  const first = reviewed(t, "planted", { out: true });
  if (!first) return;
  const pack = JSON.parse(readFileSync(path.join(first.out, "review-pack.json"), "utf8"));
  assert.equal(pack.screen.id, "orders");
  assert.deepEqual(
    pack.pictures.map((picture) => picture.file),
    first.result.shots.map((shot) => shot.file),
  );
  // Every line of the rules page but the ones that say what the owner fixed, each with where it is.
  assert.equal(pack.rules.file, ".claude/rules/design-assembly.md");
  assert.deepEqual(
    pack.rules.lines.map((line) => [line.section, line.text]),
    [
      ["Words", "A screen writes no word itself."],
      ["Words", "An error message says what happened and what to do next."],
    ],
  );
  assert.ok(pack.rules.lines.every((line) => Number.isInteger(line.line) && line.line > 0));
  // Only a principle the owner fixed is theirs; one nobody confirmed is named apart.
  assert.deepEqual(
    pack.principles.map((principle) => principle.id),
    ["principle-clear-hierarchy"],
  );
  assert.ok(pack.principles[0].statement.length > 0);
  assert.deepEqual(pack.unfixed_principles, ["principle-dense-and-scannable"]);
  assert.equal(pack.direction.id, "workbench");
  assert.ok(pack.direction.character.length > 0);
  const rows = pack.ledger_rows.map((row) => [row.ledger, row.id]);
  assert.deepEqual(rows, [
    ["design/screens.yaml", "orders"],
    ["design/decisions.yaml", "color-contrast"],
  ]);
  assert.equal(pack.ledger_rows[0].row.route, "/");
  assert.deepEqual(pack.findings, first.result.findings);
});

test("criterion 2: two runs on the same repository give the same pack, the pictures apart", (t) => {
  const first = reviewed(t, "planted", { out: true });
  const again = reviewed(t, "planted again", { out: true });
  if (!first || !again) return;
  const read = (run) => readFileSync(path.join(run.out, "review-pack.json"), "utf8");
  assert.equal(read(again), read(first));
  // And the same record for a person, which names its pictures and does not carry them.
  const record = (run) => readFileSync(path.join(run.out, "design-review.html"), "utf8");
  assert.equal(record(again), record(first));
});

test("criterion 3: a screen planted to break the two measurements in three places gives exactly three findings", (t) => {
  const first = reviewed(t, "planted", { out: true });
  if (!first) return;
  const { result, called } = first;
  assert.equal(called.status, EXIT.work, "findings leave work");
  assert.deepEqual(PLANTED.length, 3);
  assert.deepEqual(kinds(result), ["broken-word", "contrast", "cut-off"]);
  assert.deepEqual(
    result.findings.map((finding) => finding.number),
    [1, 2, 3],
  );
  const shots = result.shots.map((shot) => shot.id);
  for (const finding of result.findings) {
    const at = `finding ${finding.number}`;
    assert.ok(shots.includes(finding.picture), `${at}: its picture is not one that was drawn`);
    for (const key of ["x", "y", "width", "height"]) {
      assert.equal(typeof finding.position[key], "number", `${at}: no ${key}`);
    }
    assert.ok(["high", "medium", "low"].includes(finding.severity), at);
    assert.ok(finding.fix.length > 0, `${at}: no way to fix it`);
    assert.ok(["ledger-row", "nothing"].includes(finding.rests_on.kind), at);
    assert.ok(finding.seen_in.length > 0 && finding.seen_in.every((id) => shots.includes(id)), at);
  }
  const by = Object.fromEntries(result.findings.map((finding) => [finding.kind, finding]));
  // The pale text: measured, with the ratio it reaches and the one asked, on the contrast row.
  assert.equal(by.contrast.measured.ratio, 2.81);
  assert.equal(by.contrast.measured.needed, 4.5);
  assert.equal(by.contrast.where.text, "Updated two days ago");
  assert.deepEqual(by.contrast.rests_on, {
    kind: "ledger-row",
    ledger: "design/decisions.yaml",
    id: "color-contrast",
    check: "tool:tools/design-assembly/check.mjs",
  });
  // It is pale only in light; the word and the line break at every width and in both themes.
  assert.ok(by.contrast.seen_in.every((id) => id.endsWith("-light")));
  assert.equal(by["broken-word"].where.text, "Internationalization");
  assert.equal(by["broken-word"].seen_in.length, WIDTHS.length * 2);
  assert.match(by["cut-off"].where.text, /^A long line/);
  assert.equal(by["cut-off"].rests_on.kind, "nothing");
  assert.match(by["cut-off"].rests_on.note, /no row/i);
});

test("criterion 3: with one place taken away two findings are left, and with all three away none", (t) => {
  const two = reviewed(t, "without pale", { repository: { planted: ["broken", "cut"] } });
  if (!two) return;
  assert.deepEqual(kinds(two.result), ["broken-word", "cut-off"]);
  assert.equal(two.called.status, EXIT.work);
  const none = reviewed(t, "clean", { repository: { planted: [] } });
  assert.deepEqual(none.result.findings, []);
});

test("a finding seen only in dark is low where no user can reach dark, and says why", (t) => {
  const unreached = reviewed(t, "dim", { repository: { planted: [...PLANTED, "dim"] } });
  if (!unreached) return;
  const dark = unreached.result.themes.find((theme) => theme.name === "dark");
  assert.equal(dark.reachable, false);
  assert.match(dark.how, /no .*switch/i);
  const dim = unreached.result.findings.find((finding) => finding.where.text.startsWith("Shown"));
  assert.equal(dim.kind, "contrast");
  assert.equal(dim.severity, "low");
  assert.match(dim.low_because, /only in dark/);
  assert.ok(dim.seen_in.every((id) => id.endsWith("-dark")));
  assert.equal(unreached.result.findings.length, 4);
  // The heaviest first: the one a user meets today comes before it.
  assert.equal(unreached.result.findings.at(-1).number, dim.number);
});

test("the same finding is as heavy as any other where the application has a switch of its own, or follows the system", (t) => {
  for (const [key, repository] of [
    ["dim with a switch", { planted: ["dim"], toggle: true }],
    ["dim following the system", { planted: ["dim"], follows: true }],
  ]) {
    const reached = reviewed(t, key, { repository });
    if (!reached) return;
    const dark = reached.result.themes.find((theme) => theme.name === "dark");
    assert.equal(dark.reachable, true, key);
    assert.deepEqual(
      reached.result.findings.map((finding) => [finding.kind, finding.severity]),
      [["contrast", "high"]],
      key,
    );
  }
});

test("criterion 6: the notes on the pictures are as many as the findings of the record, one number each", (t) => {
  const first = reviewed(t, "planted", { out: true });
  if (!first) return;
  const page = readFileSync(path.join(first.out, "design-review.html"), "utf8");
  const notes = [...page.matchAll(/data-note="(\d+)"/g)].map((match) => Number(match[1]));
  const listed = [...page.matchAll(/<li class="finding" data-finding="(\d+)"/g)].map((match) =>
    Number(match[1]),
  );
  assert.deepEqual(notes.sort(), [1, 2, 3]);
  assert.deepEqual(listed, [1, 2, 3]);
  assert.equal(notes.length, first.result.findings.length);
  // Every picture that was drawn is on the page, by its file beside the page.
  for (const shot of first.result.shots) assert.ok(page.includes(`src="${shot.file}"`), shot.file);
  // The six parts of every document, in order, and none of them empty here.
  assert.deepEqual(
    partsOf(page).map((part) => part.id),
    PARTS,
  );
});

test("criterion 7: with no eye in the session the record is still written, and says that no eye has looked", (t) => {
  const first = reviewed(t, "planted", { out: true });
  if (!first) return;
  assert.deepEqual(first.result.eye, {
    looked: false,
    why: "no reviewer has looked at the pictures: only what a machine can measure was measured",
  });
  const page = readFileSync(path.join(first.out, "design-review.html"), "utf8");
  const blind = page.slice(page.indexOf('data-part="blind"'));
  assert.match(blind, /No eye has looked at the pictures/);
  // It lists the open limits in its scope, and no closed one.
  const open = LIMITS.filter(
    (limit) => ["review", "document"].includes(limit.area) && limit.status === "open",
  );
  assert.ok(open.some((limit) => limit.area === "review"));
  for (const limit of open) assert.ok(blind.includes(`<code>${limit.id}</code>`), limit.id);
  const closed = LIMITS.filter(
    (limit) => ["review", "document"].includes(limit.area) && limit.status === "closed",
  );
  for (const limit of closed) assert.ok(!blind.includes(`<code>${limit.id}</code>`), limit.id);
  // For a person at a terminal the same is said in so many words.
  const shown = run(["orders", "--target", first.dir]);
  assert.equal(shown.status, EXIT.work, shown.stderr);
  assert.match(shown.stdout, /no eye has looked at the pictures/);
  assert.throws(() => JSON.parse(shown.stdout));
});

test("a machine gets the keys the specification lists", (t) => {
  const first = reviewed(t, "planted", { out: true });
  if (!first) return;
  for (const key of ["screen", "shots", "findings", "unjudged"]) {
    assert.ok(key in first.result, `no ${key}`);
  }
  assert.equal(first.result.screen.id, "orders");
  assert.deepEqual(
    first.result.files.map((file) => path.basename(file.path)).sort(),
    [
      ...first.result.shots.map((shot) => path.basename(shot.file)),
      "design-review.html",
      "review-pack.json",
    ].sort(),
  );
});

test("a wrong call, a screen the ledger does not have, and a screen not built yet end with 2 and print no answer", () => {
  const dir = sample();
  const before = hashOf(dir);
  const wrong = [
    [["--target", dir], /which screen/],
    [["orders", "returns", "--target", dir], /one screen/],
    [["no-such-screen", "--target", dir], /orders, returns/],
    [["returns", "--target", dir], /planned/],
    [["orders", "--target", dir, "--no-such-flag"], /not a flag/],
    [["orders", "--target", dir, "--format", "pdf"], /--out/],
  ];
  for (const [args, said] of wrong) {
    const called = run([...args, "--json"]);
    assert.equal(called.status, EXIT.wrong, args.join(" "));
    assert.equal(called.stdout, "", args.join(" "));
    assert.match(called.stderr, said, args.join(" "));
  }
  assert.equal(hashOf(dir), before);
  // A refused call leaves nothing in the folder it was given, not even the folder.
  const into = path.join(folder(), "review");
  assert.equal(run(["returns", "--target", dir, "--out", into]).status, EXIT.wrong);
  assert.equal(existsSync(into), false);
});

test("a repository with no build the plugin can draw ends with 2, and says so", () => {
  // The ledger of screens alone: nothing to serve the screen with, and no browser.
  const dir = folder();
  mkdirSync(path.join(dir, "design"));
  writeFileSync(
    path.join(dir, "design/screens.yaml"),
    "version: 1\nscreens:\n  - id: orders\n    route: /\n    status: built\n    states:\n      - ready\n",
  );
  const before = hashOf(dir);
  const into = path.join(folder(), "review");
  for (const mode of [["--json"], ["--out", into]]) {
    const called = run(["orders", "--target", dir, ...mode]);
    assert.equal(called.status, EXIT.wrong, called.stdout);
    assert.equal(called.stdout, "");
    assert.match(
      called.stderr,
      /^design-assembly: this repository has no build the plugin can draw/,
    );
  }
  assert.equal(hashOf(dir), before);
  assert.equal(existsSync(into), false, "a review that could not draw leaves no folder behind");
  // And one with no ledger of screens has no screen to name.
  const bare = folder();
  const called = run(["orders", "--target", bare]);
  assert.equal(called.status, EXIT.wrong);
  assert.match(called.stderr, /no ledger of screens/);
});

test("criterion 9: the design review socket has the review command as its default plug, and its limit is the part still open", () => {
  const { table } = readCapabilities();
  const socket = table.capabilities.find((item) => item.id === "design-review");
  const plug = socket.plugs.find((candidate) => candidate.default === true);
  assert.equal(plug.id, "review");
  assert.equal(plug.kind, "command");
  assert.deepEqual(plug.scripts, ["scripts/review.mjs"]);
  assert.ok(socket.socket.checks.includes("/design-assembly:review"));
  assert.equal(socket.plugs.filter((candidate) => candidate.default === true).length, 1);
  // The gate still holds the rows a finding names; it is no longer what looks.
  assert.ok(
    socket.plugs.some((candidate) => candidate.id === "gate" && candidate.default === false),
  );
  const old = LIMITS.find((limit) => limit.id === "capability-design-review-sees-no-picture");
  assert.equal(old.status, "closed");
  assert.match(old.closed_by, /review/);
  const narrowed = LIMITS.find((limit) => limit.id === socket.limit);
  assert.equal(narrowed.status, "open");
  assert.notEqual(narrowed.id, old.id);
  assert.match(narrowed.note, /no eye/i);
  const board = socketsOf(PLUGIN).find((item) => item.id === "design-review");
  assert.equal(board.plug, "review");
  assert.equal(board.limit, narrowed.id);
});

test("the skill says how to ask for a review, what it measures and what it does not see", () => {
  const skill = readFileSync(path.join(PLUGIN, "skills/review/SKILL.md"), "utf8");
  assert.match(skill, /^---\nname: review\ndescription: /);
  assert.match(skill, /scripts\/review\.mjs/);
  for (const said of ["--states", "--out", "--json", "review-pack.json", "design-review.html"]) {
    assert.ok(skill.includes(said), said);
  }
  assert.match(skill, /no eye has looked/i);
});
