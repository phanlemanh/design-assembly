// A member accepts what its family's core changed (spec 0016, criterion 9, slice 3 of item 7.1): one
// answer, several, or all of them, by a person's word. The repository's copy of the core takes the
// core's answer for each one accepted and keeps its own for the rest, so the pin, the hash of the
// answers as copied, moves with every acceptance and what is left still shows as ahead. A locked
// answer the repository then holds otherwise becomes a question on the waiting list, as on joining;
// a default it holds otherwise stays, recorded as its own answer; no value of the repository is
// written over. The core's list of members takes the new pin, said first and written only where
// the folder can be written. No model and no network are called.
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";

import {
  CORE,
  coreMarkOf,
  corePartShapeProblems,
  newerLedgers,
  PINNED_CORE,
} from "../templates/tools/design-assembly/contract.mjs";
import { lineWidth, renderJson } from "../templates/tools/design-assembly/json.mjs";
import { readLedger } from "../templates/tools/design-assembly/ledger.mjs";
import { questionFile, readWaiting } from "../templates/tools/design-assembly/waiting.mjs";
import { sameContent, writeFiles, writtenFiles } from "./apply.mjs";
import { changeOf, fileChange, Refusal } from "./command.mjs";
import { answeredOf, exportsBehind, holdAnswers } from "./core-join.mjs";
import { addLine, homeOf } from "./core-list.mjs";
import { readMember } from "./core-marks.mjs";
import { movedOf, sameState } from "./core-moved.mjs";

const WIDTH = 100;
const ANSWERS = CORE.parts.answers.file;
const DECLARATION = CORE.parts.declaration.file;
const PIN_DIGITS = 12;
// The reason a default the repository holds otherwise is recorded with, when the core changed that
// default and a person accepted the change.
export const BEFORE_ACCEPTING =
  "the repository's own answer from before the family core changed this default";

const sha256 = (text) => createHash("sha256").update(text).digest("hex");
const read = (file) => (existsSync(file) ? readFileSync(file, "utf8") : null);

// The answers a repository holds a copy of once it accepts some changes of the core: the core's
// answer for each one accepted, the copy's for each one left, in the core's order; an answer the
// core no longer holds stays, after them, until its retiring is accepted.
function mixedAnswers(copied, current, accepted) {
  const taken = new Set(accepted);
  const kept = [];
  for (const now of current) {
    const copy = copied.find((item) => item.id === now.id);
    if (!copy) {
      if (taken.has(now.id)) kept.push(now);
      continue;
    }
    kept.push(taken.has(now.id) ? now : copy);
  }
  for (const copy of copied) {
    if (!current.some((item) => item.id === copy.id) && !taken.has(copy.id)) kept.push(copy);
  }
  return kept;
}

// The reasons and exceptions a repository gave against the earlier pin that still stand at the new
// one. An exception to a locked answer stands while the core's answer is the one it was given
// against; the reason a default is held otherwise stands while the repository holds it otherwise.
function carried(root, was, answers) {
  const rows = readLedger(root) ?? [];
  const answered = answeredOf(root, was.label, was.answers);
  const given = { reasons: {}, exceptions: {} };
  for (const answer of answers) {
    const before = was.answers.find((item) => item.id === answer.id);
    if (!before) continue;
    const row = rows.find((item) => String(item.id) === answer.id);
    const mark = coreMarkOf(row?.note);
    const marked = mark.pin === was.label ? mark : null;
    // The reason given for holding its own answer stands, whether it was given for a default or,
    // before the core lowered it, as the exception to a locked answer.
    if (answer.hold === "default" && marked?.why) {
      given.reasons[answer.id] = { why: marked.why, by: marked.by, on: marked.on };
    }
    if (answer.hold !== "locked" || !sameState(before, answer)) continue;
    if (marked?.mark === "kept") {
      given.exceptions[answer.id] = { why: marked.why, by: marked.by, on: marked.on };
    } else if (answered.exceptions[answer.id]) {
      given.exceptions[answer.id] = answered.exceptions[answer.id];
    }
  }
  return { given, waits: Object.values(answered.waits) };
}

// Writes the files of the copy byte for byte, since each is compared with its hash: the lines the
// writer of every other file gives, in the same form.
function writeCopy(root, files, dryRun) {
  return Object.entries(files).map(([file, text]) => {
    const full = path.join(root, file);
    const before = read(full);
    const state = before === null ? "create" : before === text ? "unchanged" : "update";
    if (state !== "unchanged" && !dryRun) {
      mkdirSync(path.dirname(full), { recursive: true });
      writeFileSync(full, text);
    }
    return `${state.padEnd(9)} ${file}`;
  });
}

// Accepts changes of the core into the repository's copy, or says what it would write. `ids` names
// the answers accepted; `all` accepts every one. Refused, with nothing written, on a repository of
// no family, a copy that cannot be read, a core that cannot be looked at, and an answer named that
// the core did not change.
export function acceptCore(root, { ids = [], all = false, by, on, core = null, dryRun }) {
  const newer = newerLedgers(root);
  if (newer.length > 0) throw new Refusal(`${newer.join("; ")}. Nothing was written`);
  const member = readMember(root);
  if (member === null) {
    throw new Refusal("this repository declares no family: there is no core to accept from");
  }
  const { pinned } = member;
  if (pinned.unreadable) {
    throw new Refusal(
      `the copy of the family core here cannot be read (${pinned.unreadable}): pin it again with core --join. Nothing was written`,
    );
  }
  const moved = movedOf(root, { core });
  if (moved.state === "unreachable") {
    throw new Refusal(
      `the core's folder cannot be looked at (${moved.why}): nothing was accepted, and the repository goes on with its copy. Nothing was written`,
    );
  }
  const repository = path.basename(homeOf(root));
  const base = {
    repository,
    family: pinned.family,
    core: moved.core,
    pin_was: pinned.label,
    pin: pinned.label,
    core_pin: moved.core_pin,
    by,
    on,
    dry_run: dryRun,
  };
  if (moved.state === "same") {
    if (ids.length > 0) {
      throw new Refusal(
        `the core is where this repository pinned it (${pinned.label}): ${ids.join(", ")} did not change, and there is nothing to accept. Nothing was written`,
      );
    }
    return { ...base, nothing: true, accepted: [], left: [], answers: [], files: [], written: [] };
  }
  const changed = moved.changes.map((change) => change.id);
  const unknown = ids.filter((id) => !changed.includes(id));
  if (unknown.length > 0) {
    throw new Refusal(
      `${unknown.join(", ")} did not change in the core since this repository pinned it; what changed: ${changed.join(", ") || "no answer, only how the file is written"}. Nothing was written`,
    );
  }
  const accepted = all ? changed : changed.filter((id) => ids.includes(id));
  const left = changed.filter((id) => !accepted.includes(id));

  // The copy: the core's own file when nothing is left, so the pin is the core's; else the mix.
  const coreText = readFileSync(path.join(moved.core, ANSWERS), "utf8");
  const coreData = JSON.parse(coreText);
  const copyData = JSON.parse(read(path.join(root, pinned.snapshot, ANSWERS)));
  const answers = mixedAnswers(pinned.answers, coreData.answers, accepted);
  const mixed = {
    ...copyData,
    version: Math.max(Number(copyData.version) || 1, Number(coreData.version) || 1),
    answers,
  };
  const problems = corePartShapeProblems("answers", mixed, ANSWERS);
  if (problems.length > 0) {
    throw new Refusal(
      `the copy would not hold the shape of a core: ${problems.join("; ")}. Nothing was written`,
    );
  }
  const copyFile = path.posix.join(pinned.snapshot, ANSWERS);
  const answersText = left.length === 0 ? coreText : renderJson(mixed, WIDTH);
  const pin = sha256(answersText).slice(0, PIN_DIGITS);

  // The core's list of members with this repository at its new pin: the copy's declaration, and
  // the line written into the core's folder.
  const declaration = JSON.parse(readFileSync(path.join(moved.core, DECLARATION), "utf8"));
  const was = declaration.members.find((item) => item.repository === repository);
  const declared = {
    ...declaration,
    members: [
      ...declaration.members.filter((item) => item.repository !== repository),
      { ...was, repository, joined: was?.joined ?? pinned.joined?.on ?? on, pin },
    ],
  };
  const declarationFile = path.posix.join(pinned.snapshot, DECLARATION);
  const declaredText = renderJson(declared, WIDTH);

  // The row of the sources ledger: the hashes of the copy as it now is, the day, and what was
  // accepted, by whom, from which state of the core, with what was left.
  const source = JSON.parse(read(path.join(root, PINNED_CORE.file)));
  const hashes = { [ANSWERS]: sha256(answersText), [DECLARATION]: sha256(declaredText) };
  const nextSource = {
    ...source,
    pin: {
      ...source.pin,
      files: source.pin.files.map((entry) =>
        entry.file in hashes ? { ...entry, sha256: hashes[entry.file] } : entry,
      ),
      taken_on: on,
    },
    accepted: { by, on, answers: accepted, core: moved.core_pin, left },
  };
  const copy = { [copyFile]: answersText, [declarationFile]: declaredText };
  const files = { [PINNED_CORE.file]: renderJson(nextSource, lineWidth(root)) };

  // The ledger at the new pin: each row marked again, the reasons that still stand carried over,
  // and a question for each locked answer the repository now holds otherwise.
  const next = { family: pinned.family, label: pin, answers };
  const { given, waits } = carried(root, pinned, answers);
  const reasons = { ...given.reasons };
  for (const id of accepted) {
    const answer = answers.find((item) => item.id === id);
    if (answer?.hold === "default" && !reasons[id]) reasons[id] = { why: BEFORE_ACCEPTING, by, on };
  }
  const held = holdAnswers(root, next, { on, reasons, exceptions: given.exceptions });
  Object.assign(files, held.files);

  // A question that waited about the earlier pin asks about a core the repository no longer pins:
  // it is taken away, and asked anew above where the answers still differ.
  const shape = waits.length > 0 ? readWaiting(root)?.shape : null;
  const withdrawn = shape === "folder" ? waits.map((id) => questionFile(id)) : [];
  const stale = shape === "file" ? waits : [];

  const exports = exportsBehind(root, { ...files, ...copy });
  // All of it lands or none does: the copy is compared with the hashes the declaration holds, so a
  // write that stops halfway would leave the gate red. Whatever was written is put back.
  const touched = [...Object.keys(copy), ...Object.keys(files), ...withdrawn];
  const before = touched.map((file) => [file, read(path.join(root, file))]);
  let written;
  try {
    written = [...writeCopy(root, copy, dryRun), ...writeFiles(root, files, dryRun)];
    if (!dryRun) for (const file of withdrawn) rmSync(path.join(root, file), { force: true });
  } catch (error) {
    for (const [file, was] of before) {
      try {
        if (was === null) rmSync(path.join(root, file), { force: true });
        else if (read(path.join(root, file)) !== was) writeFileSync(path.join(root, file), was);
      } catch {
        // What cannot be put back is said below, by the gate's own words on the next run.
      }
    }
    throw new Refusal(
      `a file could not be written (${error.message.split("\n")[0]}): nothing was accepted, and what had been written was put back as it was`,
    );
  }

  const coreFile = path.join(moved.core, DECLARATION);
  const coreWrite = {
    file: coreFile,
    says: `${repository} is at pin ${pin} since ${on}`,
    change: changeOf(root, coreFile).change,
    written: false,
    why: null,
  };
  const coreNow = readFileSync(coreFile, "utf8");
  const sameLine = sameContent(DECLARATION, coreNow, declaredText);
  if (!dryRun && !sameLine) {
    try {
      writeFileSync(coreFile, declaredText);
      coreWrite.written = true;
    } catch (error) {
      coreWrite.why = `${error.message.split("\n")[0]}: the core's list of members is left as it was; run this again where the core can be written`;
    }
  }
  const list = addLine({ family: pinned.family, path: moved.core, on, how: "pinned" }, { dryRun });
  return {
    ...base,
    pin,
    whole: left.length === 0,
    nothing: false,
    accepted: moved.changes.filter((change) => accepted.includes(change.id)),
    left,
    form_only: moved.form_only,
    blocks_differ: moved.blocks_differ,
    answers: held.answers.filter((answer) => accepted.includes(answer.id)),
    waiting: held.answers
      .filter((answer) => ["differs", "unreasoned"].includes(answer.state))
      .map((answer) => answer.id),
    withdrawn: withdrawn.map((file) => fileChange(file, "remove")),
    stale,
    core_file: { ...coreWrite, already: sameLine },
    list,
    exports,
    files: [...writtenFiles(written), ...withdrawn.map((file) => fileChange(file, "remove"))],
    written,
  };
}
