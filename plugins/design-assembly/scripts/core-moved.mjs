// Whether the core of a member's family moved ahead of the pin (spec 0016, criterion 9, slice 3 of
// item 7.1): where the core lives on this machine, read from the machine's list of cores; whether
// its answers are the ones the repository copied; and, when they are not, each answer that changed
// (what it was in the copy, what it is in the core, who changed it, when and why, as the answer's
// history says), each answer added and each the core no longer holds. A core that cannot be looked
// at is not an error: the reason is given, and the repository goes on with its copy. Nothing here
// writes a file, and nothing calls a model or the network: `status`, `inventory`, the line at the
// start of a session and the moves of `core` read through here.
import { createHash } from "node:crypto";
import { existsSync, readFileSync, realpathSync, statSync } from "node:fs";
import path from "node:path";

import {
  blockFilesKey,
  CORE,
  coreMarkOf,
  memberFiles,
  memberValue,
  readPinnedCore,
  sameCoreValue,
} from "../templates/tools/design-assembly/contract.mjs";
import { coreProblem, homeOf, readList } from "./core-list.mjs";
import { proposalsIn, retiredIn, stateOfProposal } from "./core-records.mjs";

const ANSWERS = CORE.parts.answers.file;
const BLOCKS = CORE.parts.blocks.file;
const DECLARATION = CORE.parts.declaration.file;
const PIN_DIGITS = 12;

const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");
// Data as text with the keys of every object in one order, so two answers that hold the same are
// the same however a tool or a hand wrote them out.
const canon = (value) =>
  JSON.stringify(value, (key, item) =>
    item !== null && typeof item === "object" && !Array.isArray(item)
      ? Object.fromEntries(Object.entries(item).sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0)))
      : item,
  );
const same = (a, b) => canon(a) === canon(b);
const shown = (value) => (typeof value === "string" ? value : JSON.stringify(value));
const stateOf = (answer) => ({ value: answer.value, hold: answer.hold });
export const sameState = (a, b) => a.hold === b.hold && same(a.value, b.value);

// The id of the question about a locked answer the repository holds otherwise: it names the
// answer and the pin it was asked at.
export const coreQuestionId = (id, pin) => `core-${id}-${pin}`;

// The questions about the core whose answer is recorded already: a locked answer the repository
// keeps as an exception, its reason in the row's note against this pin. Such a question waits on
// nobody, whatever its file says, and no reader counts it.
export function settledQuestions(pinned, rows = []) {
  const settled = new Set();
  for (const answer of pinned?.answers ?? []) {
    const mark = coreMarkOf(rows.find((row) => String(row.id) === answer.id)?.note);
    if (mark.mark === "kept" && mark.pin === pinned.label) {
      settled.add(coreQuestionId(answer.id, pinned.label));
    }
  }
  return settled;
}

// The main folder of a repository, read from git's own files and with no git run: the folder
// itself, or, from a separate working folder, the one its `.git` file leads back to. The line at
// the start of a session names the repository this way, on a machine with or without git.
export function mainFolderOf(root) {
  try {
    const dot = path.join(root, ".git");
    if (statSync(dot).isDirectory()) return realpathSync(root);
    const named = /^gitdir:\s*(.+)$/m.exec(readFileSync(dot, "utf8"))?.[1]?.trim();
    if (!named) return realpathSync(root);
    const gitDir = path.resolve(root, named);
    const common = path.resolve(
      gitDir,
      readFileSync(path.join(gitDir, "commondir"), "utf8").trim(),
    );
    return path.basename(common) === ".git"
      ? realpathSync(path.dirname(common))
      : realpathSync(root);
  } catch {
    return realpathSync(root);
  }
}

// Where the core of a member's family lives on this machine: { path } or { path: null, why }. A
// folder the call names is taken as it is; else the machine's list is read for the cores of the
// family, and where it holds more than one, the one whose members name this repository. `shape`
// false skips the check of the whole folder, for a reader that must be fast.
export function coreOf(pinned, { core = null, repository = null, shape = true } = {}) {
  const nowhere = (why) => ({ path: null, why });
  let folder = core;
  if (folder === null) {
    const list = readList();
    if (list.missing) return nowhere("this machine keeps no list of cores");
    if (list.problem)
      return nowhere(`the machine's list of cores cannot be read (${list.problem})`);
    const listed = list.cores.filter((entry) => entry.family === pinned.family);
    if (listed.length === 0) {
      return nowhere(`the machine's list of cores (${list.file}) names no core of this family`);
    }
    const mine =
      listed.length === 1
        ? listed
        : listed.filter((entry) => membersOf(entry.path).includes(repository?.()));
    if (mine.length !== 1) {
      return nowhere(
        `the machine's list of cores names ${listed.length} cores of this family, and ${mine.length === 0 ? "none" : "more than one"} lists this repository: say which with --core DIR`,
      );
    }
    folder = mine[0].path;
  }
  if (!existsSync(folder) || !statSync(folder).isDirectory()) {
    return nowhere(`${folder} is not there`);
  }
  if (shape) {
    const wrong = coreProblem(folder);
    if (wrong) return nowhere(wrong);
    if (declarationOf(folder)?.family !== pinned.family) {
      return nowhere(`${folder} is the core of another family`);
    }
  }
  return { path: realpathSync(folder), why: null };
}

// The answers a core's folder holds now, read from its answers file alone, or null when that
// cannot be read: what a reader that must be fast compares with the copy.
export function answersIn(folder) {
  try {
    const found = JSON.parse(readFileSync(path.join(folder, ANSWERS), "utf8")).answers;
    return Array.isArray(found) ? found : null;
  } catch {
    return null;
  }
}

function declarationOf(folder) {
  try {
    return JSON.parse(readFileSync(path.join(folder, DECLARATION), "utf8"));
  } catch {
    return null;
  }
}
const membersOf = (folder) =>
  (declarationOf(folder)?.members ?? []).map((member) => member?.repository);

// The changes of an answer the core made after the copy was taken, as its history says them: the
// entries past the ones the copy holds; null when the core's history does not go on from the copy's.
function stepsSince(copy, now) {
  const before = Array.isArray(copy.history) ? copy.history : [];
  const after = Array.isArray(now.history) ? now.history : [];
  if (after.length < before.length || !same(after.slice(0, before.length), before)) return null;
  return after.slice(before.length);
}

// What a change is called, by what differs between the copy's answer and the core's.
function changeName(copy, now) {
  const value = !same(copy.value, now.value);
  const hold = copy.hold !== now.hold;
  if (value && hold) return "value and hold";
  if (value) return "value";
  if (hold) return "hold";
  return copy.check !== now.check ? "check" : "record";
}

// The answers of the core against the answers a repository copied: each that changed, each added,
// each the core no longer holds, in the core's order and then the copy's.
export function answerChanges(copied, current, retired = {}) {
  const changes = [];
  for (const now of current) {
    const copy = copied.find((item) => item.id === now.id);
    if (!copy) {
      changes.push({
        id: now.id,
        change: "added",
        kind: now.kind,
        was: null,
        now: stateOf(now),
        check: now.check ?? null,
        steps: [],
        by: now.by,
        on: now.on,
        why: now.why,
      });
      continue;
    }
    if (same(copy, now)) continue;
    const steps = stepsSince(copy, now);
    changes.push({
      id: now.id,
      change: changeName(copy, now),
      kind: now.kind,
      was: stateOf(copy),
      now: stateOf(now),
      ...(copy.check === now.check ? {} : { check_was: copy.check ?? null }),
      check: now.check ?? null,
      // Who changed it, when and why, where the core's history says so; none where the folder was
      // changed with no entry of history.
      steps: steps ?? [],
      unsigned: steps === null || steps.length === 0,
    });
  }
  for (const copy of copied) {
    if (current.some((item) => item.id === copy.id)) continue;
    // Who retired it, when and why, where the core's folder records it (`retired.json`).
    const record = retired[copy.id];
    changes.push({
      id: copy.id,
      change: "retired",
      kind: copy.kind,
      was: stateOf(copy),
      now: null,
      check: null,
      steps: [],
      ...(record ? { by: record.by, on: record.on, why: record.why } : {}),
    });
  }
  return changes;
}

// What accepting one change would meet in this repository: the value it holds for the answer, and
// what follows from holding another.
function hereOf(change, files) {
  if (change.now === null || change.kind !== "value") return {};
  const held = memberValue(change.id, files);
  if (held.value === undefined) return {};
  const differs = !sameCoreValue(change.id, held.value, change.now.value);
  return {
    held_here: held.value,
    held_in: held.from,
    would: !differs ? "holds" : change.now.hold === "locked" ? "ask" : "keep",
  };
}

// The blocks of the core's store against those the repository's copy holds (slice 3 of item 7.2):
// each added, with who promoted it, when and why; each whose files changed, with who replaced them,
// when and why, as the block's history says past what the copy holds; and each the store no longer
// offers, with who retired it, when and why, where the core's folder records it.
export function blockChanges(copied = [], current = [], retired = {}) {
  const changes = [];
  for (const now of current) {
    const copy = copied.find((item) => item.need === now.need);
    if (!copy) {
      changes.push({
        need: now.need,
        name: now.name,
        change: "added",
        by: now.promoted?.by ?? null,
        on: now.promoted?.on ?? null,
        why: now.promoted?.why ?? null,
        second_use: Boolean(now.second_use),
      });
      continue;
    }
    if (same(blockFilesKey(copy.files), blockFilesKey(now.files))) continue;
    const before = Array.isArray(copy.history) ? copy.history.length : 0;
    const steps = Array.isArray(now.history) ? now.history.slice(before) : [];
    changes.push({
      need: now.need,
      name: now.name,
      change: "changed",
      steps,
      unsigned: steps.length === 0,
    });
  }
  for (const copy of copied) {
    if (current.some((item) => item.need === copy.need)) continue;
    const record = retired[copy.need];
    changes.push({
      need: copy.need,
      name: copy.name,
      change: "retired",
      ...(record ? { by: record.by, on: record.on, why: record.why } : {}),
    });
  }
  return changes;
}

// The proposals of this repository the core holds, each with its state, and how many of the
// family's proposals wait on its owner.
function proposalsOf(folder, repository) {
  const all = proposalsIn(folder);
  return {
    proposals: all
      .filter((item) => item.repository === repository && !item.unreadable)
      .map((item) => ({
        id: item.id,
        kind: item.kind,
        subject: item.subject,
        on: item.on,
        state: stateOfProposal(item),
        ...(item.decided ? { decided: item.decided } : {}),
      })),
    proposals_waiting: all.filter((item) => !item.unreadable && !item.decided).length,
  };
}

// The core a member pinned against the core's folder now. Null on a repository that declares no
// family. `state` is `unreadable` (the copy cannot be read: the repository inherits nothing),
// `unreachable` (the core's folder cannot be looked at, with why), `same` or `ahead`; when ahead,
// `changes` has each answer, `form_only` says the file differs and no answer does, and
// `blocks_differ` says the core's list of blocks is not the one copied.
export function movedOf(root, { core = null } = {}) {
  const pinned = readPinnedCore(root);
  if (pinned === null) return null;
  const base = { family: pinned.family, pin: pinned.label, core: null, core_pin: null };
  if (pinned.unreadable) return { ...base, state: "unreadable", why: pinned.unreadable };
  const place = coreOf(pinned, { core, repository: () => path.basename(homeOf(root)) });
  if (place.path === null) return { ...base, state: "unreachable", why: place.why };
  const text = readFileSync(path.join(place.path, ANSWERS), "utf8");
  const hash = sha256(text);
  const blocksCopied = (readPinned(root, pinned, BLOCKS) ?? "").toString();
  const blocksNow = readFileSync(path.join(place.path, BLOCKS));
  const blocksDiffer = sha256(blocksNow) !== sha256(blocksCopied);
  const retired = retiredIn(place.path);
  const repository = path.basename(homeOf(root));
  const found = {
    ...base,
    core: place.path,
    core_pin: hash.slice(0, PIN_DIGITS),
    why: null,
    block_changes: blocksDiffer
      ? blockChanges(
          pinned.blocks ?? [],
          JSON.parse(blocksNow.toString()).blocks ?? [],
          retired.blocks,
        )
      : [],
    ...proposalsOf(place.path, repository),
  };
  if (hash === pinned.sha256) {
    return { ...found, state: "same", changes: [], form_only: false, blocks_differ: blocksDiffer };
  }
  const files = memberFiles(root);
  const changes = answerChanges(pinned.answers, JSON.parse(text).answers, retired.answers).map(
    (change) => ({
      ...change,
      ...hereOf(change, files),
    }),
  );
  return {
    ...found,
    state: "ahead",
    changes,
    form_only: changes.length === 0,
    blocks_differ: blocksDiffer,
  };
}

// One file of the copy of the core a repository keeps, as its bytes, or null.
function readPinned(root, pinned, file) {
  const full = path.join(root, pinned.snapshot, file);
  return existsSync(full) ? readFileSync(full) : null;
}

const stateWords = (state) => `${shown(state.value)}, ${state.hold}`;
const stepWords = (step) => `by ${step.by} on ${step.on}, because ${step.why}`;

// One change as a person reads it: what it was in the copy, what it is in the core, and who
// changed it, when and why.
export function changeLines(change) {
  if (change.change === "added") {
    return [
      `added: ${change.id}: ${stateWords(change.now)}; by ${change.by} on ${change.on}, because ${change.why}`,
    ];
  }
  if (change.change === "retired") {
    return [
      `retired: ${change.id}: it was ${stateWords(change.was)} in the copy, and the core no longer holds it; ${change.by ? `retired ${stepWords(change)}` : "the core's folder does not say who took it out"}`,
    ];
  }
  const what = [
    ...(same(change.was.value, change.now.value)
      ? []
      : [`its value ${shown(change.was.value)} became ${shown(change.now.value)}`]),
    ...(change.was.hold === change.now.hold
      ? []
      : [`its hold ${change.was.hold} became ${change.now.hold}`]),
    ...("check_was" in change
      ? [`what holds it ${change.check_was ?? "nothing"} became ${change.check ?? "nothing"}`]
      : []),
  ];
  const head = `changed: ${change.id}: ${what.length > 0 ? what.join("; ") : "its record in the core, not its value or hold"}`;
  if (change.unsigned) {
    return [`${head}; the core's history does not say who changed it`];
  }
  if (change.steps.length === 1) return [`${head}; ${stepWords(change.steps[0])}`];
  return [
    `${head}; in ${change.steps.length} changes:`,
    ...change.steps.map(
      (step) => `  ${stateWords(step.was)} became ${stateWords(step.became)}, ${stepWords(step)}`,
    ),
  ];
}

// What accepting a change would meet here, in words, or null.
export function hereWords(change) {
  if (change.would === "holds") return `this repository holds ${shown(change.held_here)} already`;
  if (change.would === "ask") {
    return `this repository holds ${shown(change.held_here)} in ${change.held_in}: accepting it asks the owner to follow the core or keep that as an exception, and the gate's check of locked answers is red until then`;
  }
  if (change.would === "keep") {
    return `this repository holds ${shown(change.held_here)} in ${change.held_in}: a default may be held otherwise, so it stays, recorded as this repository's own answer`;
  }
  return null;
}

// The blocks of a core are pinned with the copy and taken from it (core --take): accepting an
// answer never moves them, so a store that differs is said, with the move that pins it.
export const BLOCKS_WORDS =
  "the core's list of blocks is not the one copied here: accepting answers leaves the copy's blocks as they are, and pinning the core again with core --join brings the newer ones, with every answer of the core as it is now";
export const ACCEPT_WORDS =
  "nothing here changes until a person accepts: core --moved shows each change, core --accept <id> takes one, core --accept-all takes all";

// One change of the core's store as a person reads it.
export function blockChangeLines(change) {
  const who = (said) =>
    said.by ? `by ${said.by} on ${said.on}${said.why ? `, because ${said.why}` : ""}` : null;
  if (change.change === "added") {
    return [
      `block added: ${change.name} (${change.need}); promoted ${who(change) ?? "by no one the store names"}${change.second_use ? "" : "; no second use yet"}`,
    ];
  }
  if (change.change === "retired") {
    return [
      `block retired: ${change.name} (${change.need}); ${change.by ? `retired ${who(change)}` : "the core's folder does not say who took it out"}; accepting it (core --accept ${change.need}) leaves a block taken in here as this repository's own`,
    ];
  }
  if (change.unsigned) {
    return [
      `block changed: ${change.name} (${change.need}): its files; the store's history does not say who changed them`,
    ];
  }
  return [
    `block changed: ${change.name} (${change.need}): its files were replaced ${change.steps.map((step) => who(step)).join("; then ")}`,
  ];
}

// The proposals of this repository as a person reads them: each that waits, and each the owner
// answered, with the answer and its reason.
export function proposalLines(moved) {
  return (moved.proposals ?? []).map((item) =>
    item.state === "waiting"
      ? `proposal ${item.id} of this repository waits on the family's owner since ${item.on}`
      : `proposal ${item.id} of this repository was ${item.state} by ${item.decided.by} on ${item.decided.on}, because ${item.decided.why}${item.state === "refused" ? ": this repository keeps its own, as it stood" : ": the core changed, and accepting it is here as for any change"}`,
  );
}

// The lines `status` and `inventory` print of a member's core against its pin. Empty on a
// repository that declares no family, and on one whose copy cannot be read, which `status` says.
export function movedLines(moved) {
  if (!moved || moved.state === "unreadable") return [];
  if (moved.state === "unreachable") {
    return [
      `  the core's folder cannot be looked at (${moved.why}): whether the core moved is not known, and the repository goes on with its copy`,
    ];
  }
  const blocks = [
    ...(moved.block_changes ?? []).flatMap((change) =>
      blockChangeLines(change).map((line) => `    ${line}`),
    ),
    ...(moved.blocks_differ ? [`  ${BLOCKS_WORDS}`] : []),
    ...proposalLines(moved).map((line) => `  ${line}`),
  ];
  if (moved.state === "same") {
    return [`  the core (${moved.core}) is where this repository pinned it`, ...blocks];
  }
  const lines = [
    `  the core (${moved.core}) is ahead of the pin: it is at ${moved.core_pin}, with ${countWords(moved.changes)}`,
  ];
  if (moved.form_only) {
    lines.push(
      "    its answers file is written otherwise and no answer differs: accepting moves the pin and changes no answer",
    );
  }
  for (const change of moved.changes) {
    const [first, ...rest] = changeLines(change);
    lines.push(`    ${first}`, ...rest.map((line) => `    ${line}`));
  }
  lines.push(...blocks, `  ${ACCEPT_WORDS}`);
  return lines;
}

// How many answers changed, were added and were retired, in words.
export function countWords(changes) {
  const count = (test) => changes.filter(test).length;
  const changed = count((item) => !["added", "retired"].includes(item.change));
  const added = count((item) => item.change === "added");
  const retired = count((item) => item.change === "retired");
  const answers = (n) => `${n} answer${n === 1 ? "" : "s"}`;
  const parts = [
    ...(changed > 0 ? [`${answers(changed)} changed`] : []),
    ...(added > 0 ? [`${added} added`] : []),
    ...(retired > 0 ? [`${retired} retired`] : []),
  ];
  return parts.length > 0 ? parts.join(", ") : "no answer changed";
}
