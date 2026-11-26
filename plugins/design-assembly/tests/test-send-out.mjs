// The bridge out, its second half (specification 0014, criterion 14 and open question 7): the
// system bundle goes to a tool from outside only with the owner's leave, given for this repository
// and this plug, written as a row with a name and a day and taken back the same way; the run that
// sends says first what goes where; a push is recorded where the repository keeps it, and the
// owner is asked once whether to make the system the default there; status says when the copy
// there is behind the ledgers. Nothing here sends anything: the skill does, after this says it may.
import "./helpers/own-cores.mjs";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import {
  cpSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
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
import { pushedOf, sendOut, PUSHED } from "../scripts/send-out.mjs";
import { report, status } from "../scripts/status.mjs";
import { readLedger } from "../templates/tools/design-assembly/ledger.mjs";
import { readWaiting, rowProblems } from "../templates/tools/design-assembly/waiting.mjs";

const PLUGIN = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const ROOT = path.resolve(PLUGIN, "../..");
const BRING_OUT = path.join(PLUGIN, "scripts/bring-out.mjs");
const ON = "2026-11-24";
const PLUG = "claude-design";
const COPIED = [
  "design",
  "DESIGN.md",
  "src",
  "tools/design-assembly",
  "Makefile",
  "mk",
  "package.json",
];

const made = [];
after(() => made.forEach((dir) => rmSync(dir, { recursive: true, force: true })));
const read = (dir, file) => readFileSync(path.join(dir, file), "utf8");
const put = (dir, file, text) => {
  mkdirSync(path.dirname(path.join(dir, file)), { recursive: true });
  writeFileSync(path.join(dir, file), text);
};
const cli = (...args) => spawnSync(execPath, [BRING_OUT, ...args], { encoding: "utf8" });

// A copy of this repository with its exports, its waiting list emptied.
function copyRepo() {
  const dir = mkdtempSync(path.join(tmpdir(), "design-send-out-"));
  made.push(dir);
  for (const file of COPIED)
    cpSync(path.join(ROOT, file), path.join(dir, file), { recursive: true });
  rmSync(path.join(dir, "design/waiting"), { recursive: true, force: true });
  return dir;
}
// Answers a question the way the decision sheet writes it back.
function answer(dir, id, fields) {
  const file = `design/waiting/${id}.json`;
  const row = JSON.parse(read(dir, file));
  put(dir, file, `${JSON.stringify({ ...row, ...fields, by: "Owner Name", on: ON }, null, 2)}\n`);
}
const rowOf = (dir, id) => (readLedger(dir) ?? []).find((row) => row.id === id);

test("question 7: without the owner's leave nothing may be sent, and the leave is asked once, for this repository and this plug", () => {
  const dir = copyRepo();
  const asked = sendOut(dir, PLUG, { on: ON });
  assert.equal(asked.send, null);
  assert.deepEqual(asked.waits, [`send-${PLUG}`]);
  const [question] = readWaiting(dir).rows;
  assert.equal(question.id, `send-${PLUG}`);
  assert.deepEqual(rowProblems(question, question.id), []);
  assert.match(
    question.question,
    /design system bundle of this repository be sent to claude-design/,
  );
  assert.match(question.where, /design\/export\/system/);
  // The plug the owner named at the handoff socket: leave is the recommendation, on their word.
  assert.equal(question.candidates[0].name, "allow");
  assert.match(question.basis, /d0088/);
  // Asked again, it is not asked twice.
  assert.deepEqual(sendOut(dir, PLUG, { on: ON }).files, []);
});

test("criterion 14: with the leave, the run says first what goes where, and sends nothing itself", () => {
  const dir = copyRepo();
  sendOut(dir, PLUG, { on: ON });
  answer(dir, `send-${PLUG}`, { answer: "keep" });
  const allowed = sendOut(dir, PLUG, { on: ON });
  assert.equal(rowOf(dir, `send-${PLUG}`).note, `confirmed by Owner Name on ${ON}`);
  assert.equal(rowOf(dir, `send-${PLUG}`).kind, "judgment");
  assert.ok(!existsSync(path.join(dir, `design/waiting/send-${PLUG}.json`)));
  assert.deepEqual(allowed.send.files, [
    "design/export/system/README.md",
    "design/export/system/tokens.json",
    "design/export/system/components.md",
    "design/export/system/assets.json",
  ]);
  assert.match(allowed.send.to, /private artifact/);
  assert.match(allowed.send.stamp, /^[0-9a-f]{12}$/);
  assert.ok(!existsSync(path.join(dir, PUSHED)));
  const shown = cli("--target", dir, "--send", PLUG, "--on", ON);
  assert.equal(shown.status, 0, shown.stderr);
  assert.match(shown.stdout, /^sends: design\/export\/system\/README\.md, /m);
  assert.match(shown.stdout, /^to: The design values and files/m);
});

test("criterion 14: a push is recorded, the default is asked once, and status says when the copy there falls behind", () => {
  const dir = copyRepo();
  sendOut(dir, PLUG, { on: ON });
  answer(dir, `send-${PLUG}`, { answer: "keep" });
  sendOut(dir, PLUG, { on: ON });
  const pushed = sendOut(dir, PLUG, { on: ON, pushed: true });
  const record = pushedOf(dir);
  assert.equal(record.pushes[0].plug, PLUG);
  assert.equal(record.pushes[0].on, ON);
  assert.equal(record.pushes[0].stamp, pushed.send.stamp);
  // The default is asked, recommended where the account has none yet.
  const question = readWaiting(dir).rows.find((row) => row.id === `default-${PLUG}`);
  assert.deepEqual(rowProblems(question, question.id), []);
  assert.equal(question.candidates[0].name, "yes");
  // Where the account has a default already, keeping it comes first.
  const other = copyRepo();
  sendOut(other, PLUG, { on: ON });
  answer(other, `send-${PLUG}`, { answer: "keep" });
  sendOut(other, PLUG, { on: ON, pushed: true, accountHasDefault: true });
  const kept = readWaiting(other).rows.find((row) => row.id === `default-${PLUG}`);
  assert.equal(kept.candidates[0].name, "no");
  // Status names the copy there, and says when the ledgers have moved past it.
  const now = status(dir);
  assert.deepEqual(now.pushed, [
    { plug: PLUG, on: ON, stamp: pushed.send.stamp, ledgers: pushed.send.stamp, behind: false },
  ]);
  assert.match(
    report(now),
    new RegExp(
      `^ {2}pushed: ${PLUG} on ${ON}, written from ${pushed.send.stamp}; the ledgers are at the same state$`,
      "m",
    ),
  );
  const tokens = JSON.parse(read(dir, "design/tokens.json"));
  tokens.color.primary.$value = "#cc0000";
  put(dir, "design/tokens.json", `${JSON.stringify(tokens, null, 2)}\n`);
  const later = status(dir);
  assert.equal(later.pushed[0].behind, true);
  assert.match(report(later), /the ledgers are at [0-9a-f]{12}: the copy there is behind/);
});

test("the leave is taken back as it was given, and then nothing is sent", () => {
  const dir = copyRepo();
  sendOut(dir, PLUG, { on: ON });
  answer(dir, `send-${PLUG}`, { answer: "keep" });
  sendOut(dir, PLUG, { on: ON });
  const back = sendOut(dir, PLUG, { on: ON, revoke: true, by: "Owner Name" });
  assert.equal(back.send, null);
  assert.equal(rowOf(dir, `send-${PLUG}`).note, `refused by Owner Name on ${ON}: leave taken back`);
  const after = sendOut(dir, PLUG, { on: ON });
  assert.equal(after.send, null);
  assert.match(after.says, /took the leave back on 2026-11-24: nothing is sent/);
  // A refused question sends nothing either.
  const refused = copyRepo();
  sendOut(refused, PLUG, { on: ON });
  answer(refused, `send-${PLUG}`, { answer: "refuse", said: "Not yet" });
  const nothing = sendOut(refused, PLUG, { on: ON });
  assert.equal(nothing.send, null);
  assert.match(nothing.says, /refused/);
});

test("a stale bundle, a plug that is not one of the handoff socket, or a revoke with no name are refused", () => {
  const dir = copyRepo();
  const tokens = JSON.parse(read(dir, "design/tokens.json"));
  tokens.color.primary.$value = "#cc0000";
  put(dir, "design/tokens.json", `${JSON.stringify(tokens, null, 2)}\n`);
  assert.throws(
    () => sendOut(dir, PLUG, { on: ON }),
    /the exports are behind the ledgers: write them again with make design-exports before anything is sent/,
  );
  assert.throws(
    () => sendOut(copyRepo(), "stitch", { on: ON }),
    /stitch is no plug of the handoff socket/,
  );
  assert.throws(
    () => sendOut(copyRepo(), PLUG, { on: ON, revoke: true }),
    /--revoke needs --by NAME/,
  );
  const wrong = cli("--target", copyRepo(), "--send", "nobody", "--json");
  assert.equal(wrong.status, 2);
  assert.equal(wrong.stdout, "");
  assert.match(wrong.stderr, /^design-assembly: nobody is no plug of the handoff socket/);
});

test("review: taking the leave back while its question waits leaves the waiting list readable, and the leave can be asked again", () => {
  const dir = copyRepo();
  sendOut(dir, PLUG, { on: ON });
  sendOut(dir, PLUG, { on: ON, revoke: true, by: "Owner Name" });
  const ids = (readLedger(dir) ?? []).map((row) => String(row.id));
  assert.doesNotThrow(() => readWaiting(dir, ids));
  assert.ok(!existsSync(path.join(dir, `design/waiting/send-${PLUG}.json`)));
  const again = sendOut(dir, PLUG, { on: ON, reask: true });
  assert.deepEqual(again.waits, [`send-${PLUG}`]);
  assert.equal(rowOf(dir, `send-${PLUG}`), undefined);
  assert.doesNotThrow(() =>
    readWaiting(
      dir,
      (readLedger(dir) ?? []).map((row) => String(row.id)),
    ),
  );
  // A row and its question left together by a run that stopped between them are taken apart.
  answer(dir, `send-${PLUG}`, { answer: "keep" });
  const both = JSON.parse(read(dir, `design/waiting/send-${PLUG}.json`));
  sendOut(dir, PLUG, { on: ON });
  put(dir, `design/waiting/send-${PLUG}.json`, `${JSON.stringify(both, null, 2)}\n`);
  sendOut(dir, PLUG, { on: ON });
  assert.ok(!existsSync(path.join(dir, `design/waiting/send-${PLUG}.json`)));
});

test("review: a waiting list kept as one shared file stops every run that would ask, before anything is written", () => {
  const dir = copyRepo();
  put(dir, "design/waiting-list.json", `${JSON.stringify({ version: 1, rows: [] }, null, 2)}\n`);
  assert.throws(
    () => sendOut(dir, PLUG, { on: ON }),
    /one shared file, design\/waiting-list\.json: split it first/,
  );
});

// ---- review of PR #110 ---------------------------------------------------------------------------

// The plug files as they are, with one plug changed.
function capsWith(change) {
  const caps = JSON.parse(JSON.stringify(readCapabilities()));
  change(caps.plugs.find((plug) => plug.id === PLUG));
  return caps;
}
function withLeave() {
  const dir = copyRepo();
  sendOut(dir, PLUG, { on: ON });
  answer(dir, `send-${PLUG}`, { answer: "keep" });
  sendOut(dir, PLUG, { on: ON });
  return dir;
}

test("review: a leave counts only for what its row records; where the bundle would go, or what goes, changed, it is asked again", () => {
  const dir = withLeave();
  const elsewhere = capsWith((plug) => {
    plug.sends = "The whole repository, to another service.";
  });
  const moved = sendOut(dir, PLUG, { on: ON, caps: elsewhere });
  assert.equal(moved.send, null);
  assert.deepEqual(moved.waits, [`send-${PLUG}`]);
  assert.match(
    moved.says,
    /the leave was given for .*private artifact.*; it would now go to The whole repository, to another service\.: asked again/,
  );
  assert.equal(rowOf(dir, `send-${PLUG}`), undefined);
  assert.doesNotThrow(() =>
    readWaiting(
      dir,
      (readLedger(dir) ?? []).map((row) => String(row.id)),
    ),
  );
  // A row that recorded fewer files than now go is no leave for the files added.
  const fewer = withLeave();
  const ledger = read(fewer, "design/decisions.yaml");
  put(fewer, "design/decisions.yaml", ledger.replace(/design\/export\/system\/README\.md, /, ""));
  const grown = sendOut(fewer, PLUG, { on: ON });
  assert.equal(grown.send, null);
  assert.match(grown.says, /asked again/);
});

test("review: what keep means comes from the rule, not from the order a file gives; a question reordered by hand is refused with its file", () => {
  const unnamed = capsWith((plug) => {
    delete plug.recommended_by_owner;
  });
  const dir = copyRepo();
  sendOut(dir, PLUG, { on: ON, caps: unnamed });
  const file = `design/waiting/send-${PLUG}.json`;
  const question = JSON.parse(read(dir, file));
  assert.deepEqual(
    question.candidates.map((item) => item.name),
    ["not-now", "allow"],
  );
  put(
    dir,
    file,
    `${JSON.stringify({ ...question, candidates: [...question.candidates].reverse() }, null, 2)}\n`,
  );
  answer(dir, `send-${PLUG}`, { answer: "keep" });
  assert.throws(
    () => sendOut(dir, PLUG, { on: ON, caps: unnamed }),
    /design\/waiting\/send-claude-design\.json leads with allow, which the rule does not give for claude-design: not-now comes first/,
  );
  assert.equal(rowOf(dir, `send-${PLUG}`), undefined);
});

test("review: the skill sends only when the run printed what goes and where, never on the exit code alone", () => {
  const skill = read(PLUGIN, "skills/bring-out/SKILL.md");
  assert.match(skill, /only when the run printed\s+both `sends:` and `to:`/);
  assert.match(skill, /never on the exit code alone/);
});

// ---- review of PR #115 ---------------------------------------------------------------------------

test("review: a leave asked again because the place changed says so, shows what it was for and what it would be, and does not lead with allow", () => {
  const dir = withLeave();
  const elsewhere = capsWith((plug) => {
    plug.sends = "The whole repository, to another service.";
  });
  sendOut(dir, PLUG, { on: ON, caps: elsewhere });
  const question = JSON.parse(read(dir, `design/waiting/send-${PLUG}.json`));
  assert.deepEqual(rowProblems(question, question.id), []);
  assert.match(question.question, /^Asked again:/);
  assert.match(question.question, /private artifact/);
  assert.match(question.question, /The whole repository, to another service\./);
  assert.deepEqual(
    question.candidates.map((item) => item.name),
    ["not-now", "allow"],
  );
  assert.match(
    question.recommendation,
    /^not-now: what goes, or where it goes, changed since the leave was given/,
  );
  assert.doesNotMatch(question.basis, /the owner's word/);
  // The guard follows the same rule: the run does not refuse its own question.
  answer(dir, `send-${PLUG}`, { answer: "keep" });
  const kept = sendOut(dir, PLUG, { on: ON, caps: elsewhere });
  assert.equal(kept.send, null);
  assert.match(kept.says, /kept not-now/);
  // The owner's own allow gives the leave for the new place.
  const other = withLeave();
  sendOut(other, PLUG, { on: ON, caps: elsewhere });
  answer(other, `send-${PLUG}`, { answer: "value", said: "allow" });
  const allowed = sendOut(other, PLUG, { on: ON, caps: elsewhere });
  assert.equal(allowed.send.to, "The whole repository, to another service.");
});

test("review: what the owner did is said as they did it: kept not-now, answered not-now, or refused the question", () => {
  const unnamed = capsWith((plug) => {
    delete plug.recommended_by_owner;
  });
  const said = (fields) => {
    const dir = copyRepo();
    sendOut(dir, PLUG, { on: ON, caps: unnamed });
    answer(dir, `send-${PLUG}`, fields);
    return sendOut(dir, PLUG, { on: ON, caps: unnamed }).says;
  };
  assert.match(said({ answer: "keep" }), /^Owner Name kept not-now on 2026-11-24: nothing is sent/);
  assert.match(
    said({ answer: "value", said: "not-now" }),
    /^Owner Name answered not-now on 2026-11-24: nothing is sent/,
  );
  assert.match(
    said({ answer: "refuse", said: "No" }),
    /^Owner Name refused the question on 2026-11-24: nothing is sent/,
  );
  for (const fields of [{ answer: "keep" }, { answer: "refuse" }]) {
    assert.doesNotMatch(said(fields), fields.answer === "keep" ? /refused/ : /kept/);
  }
});

// ---- review of PR #116 ---------------------------------------------------------------------------

test("review: allow leads only where the owner's word was said of the place the question is about, on a first asking, a --reask and an asking again", () => {
  const elsewhere = capsWith((plug) => {
    plug.sends = "The whole repository, to another service.";
  });
  // Never given, and the plug now sends elsewhere: not-now first, and the basis says why.
  const fresh = copyRepo();
  sendOut(fresh, PLUG, { on: ON, caps: elsewhere });
  const first = JSON.parse(read(fresh, `design/waiting/send-${PLUG}.json`));
  assert.deepEqual(
    first.candidates.map((item) => item.name),
    ["not-now", "allow"],
  );
  assert.match(
    first.basis,
    /was said of .*private artifact.*; the plug now sends The whole repository/,
  );
  // The reviewer's case: asked again, kept not-now, then --reask: still not-now first.
  const dir = withLeave();
  sendOut(dir, PLUG, { on: ON, caps: elsewhere });
  answer(dir, `send-${PLUG}`, { answer: "keep" });
  sendOut(dir, PLUG, { on: ON, caps: elsewhere });
  sendOut(dir, PLUG, { on: ON, caps: elsewhere, reask: true });
  const again = JSON.parse(read(dir, `design/waiting/send-${PLUG}.json`));
  assert.deepEqual(
    again.candidates.map((item) => item.name),
    ["not-now", "allow"],
  );
  assert.doesNotMatch(again.recommendation, /^allow/);
  // Where only the files that go changed and the place is the word's own, allow leads again.
  const grown = withLeave();
  const ledger = read(grown, "design/decisions.yaml");
  put(grown, "design/decisions.yaml", ledger.replace(/design\/export\/system\/README\.md, /, ""));
  sendOut(grown, PLUG, { on: ON });
  const regrown = JSON.parse(read(grown, `design/waiting/send-${PLUG}.json`));
  assert.match(regrown.question, /^Asked again:/);
  assert.deepEqual(
    regrown.candidates.map((item) => item.name),
    ["allow", "not-now"],
  );
});
