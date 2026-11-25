// A member proposes a change upward to the family's core (spec 0016, criterion 23, slice 3 of item
// 7.2), and the family's owner answers it. A proposal is a question for the family's owner, so it
// lives in the core folder, the family's data, as one file of `proposals/`: never on a member's
// waiting list, which is that repository's owner's. One file per proposal, so two members proposing
// at once never write one file.
//
// A member proposes what it holds otherwise: a block it took from the core and changed (the files as
// it has them, kept under `proposals/<id>/`), or an answer it holds another value of, as an
// exception to a locked answer or a changed default (the value and the reason). The move writes the
// proposal into the core folder only, and says first exactly what it writes; nothing of the member
// changes, so its exception stands and its gate is what it was. A core that cannot be reached means
// nothing is written.
//
// The family's owner sees the proposals that wait with `core --proposals`, and the first line of a
// session in a member says one waits. The owner grants one with `core --grant`, which is carried out
// with the moves that exist: an answer by the change move (its history records who and why), a block
// by the promotion's replace (its history records who and why); or refuses it with `core --refuse`,
// and the proposal keeps the refusal and the reason, which the member is told at its next look
// (`core --moved`, `status`). No model and no network are called, and nothing is committed.
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

import {
  blockFilesKey,
  CONFORM_FOLDER,
  CORE,
  corePartShapeProblems,
  heldFilesProblems,
  memberFiles,
  memberValue,
  sameCoreValue,
} from "../templates/tools/design-assembly/contract.mjs";
import { renderJson } from "../templates/tools/design-assembly/json.mjs";
import { readLedger } from "../templates/tools/design-assembly/ledger.mjs";
import { fileChange, Refusal } from "./command.mjs";
import { blockPinOf, CORE_SOURCE, readFamilyStore } from "./core-blocks.mjs";
import { changeCore } from "./core-change.mjs";
import {
  askLines,
  askWords,
  GRADUATION,
  graduationAsk,
  grantGraduation,
  grantLines,
  OWNER_SEES_GRADUATION,
  promotionCall,
} from "./core-graduate.mjs";
import { homeOf } from "./core-list.mjs";
import { readMember } from "./core-marks.mjs";
import { coreOf } from "./core-moved.mjs";
import { placeBlock, promoteReport, readStore, replacedBlock, storeWith } from "./core-promote.mjs";
import { proposalsIn, stateOfProposal } from "./core-records.mjs";
import { fileOf, insideRoot, readIntake, readTheme, text } from "./store.mjs";
import { coreMarkOf } from "../templates/tools/design-assembly/contract.mjs";

const WIDTH = 100;
const FOLDER = CORE.parts.proposals.folder;
export { proposalsIn, stateOfProposal };
const INDEX = CORE.parts.blocks.file;
const ANSWERS = CORE.parts.answers.file;
const NOTHING = ". Nothing was written";
export const OWNER_SEES =
  "the family's owner sees it with core --proposals --core DIR, and the first line of a session in a member says a proposal waits; the owner grants it (core --grant) or refuses it with a reason (core --refuse)";

const sha = (bytes) => createHash("sha256").update(bytes).digest("hex");
const readJson = (file) => JSON.parse(readFileSync(file, "utf8"));
const shown = (value) => (typeof value === "string" ? value : JSON.stringify(value));
// A value as a person writes it with --value: widths joined by commas, anything else as it is.
const asGiven = (value) => (Array.isArray(value) ? value.join(",") : String(value));

// The id of a new proposal about a subject: its kind, the subject, and a number one past every
// proposal of that kind and subject the core holds.
function newId(existing, kind, subject) {
  const stem = `${kind}-${subject}-`;
  const taken = existing
    .map((item) => String(item.id ?? ""))
    .filter((id) => id.startsWith(stem))
    .map((id) => Number(id.slice(stem.length)))
    .filter(Number.isInteger);
  return `${stem}${Math.max(0, ...taken) + 1}`;
}

// The core of the member's family, where this machine can reach it, read and checked: else a
// refusal that says nothing was written.
function reachCore(root, core) {
  const member = readMember(root);
  if (member === null) {
    throw new Refusal(
      "this repository declares no family: there is no core to propose to (core --join declares one)",
    );
  }
  const { pinned } = member;
  if (pinned.unreadable) {
    throw new Refusal(
      `the copy of the family core here cannot be read (${pinned.unreadable}): pin it again with core --join${NOTHING}`,
    );
  }
  const repository = path.basename(homeOf(root));
  const place = coreOf(pinned, { core, repository: () => repository });
  if (place.path === null) {
    throw new Refusal(
      `the core's folder cannot be reached (${place.why}): nothing was proposed, and nothing was written. Run this where the core's folder is, or name it with --core DIR`,
    );
  }
  readStore(place.path);
  return { pinned, repository, folder: place.path };
}

// An answer the member holds otherwise, as a proposal: the value it holds, and the core's answer as
// it is now. Refused where there is nothing to propose, or where the gate would be red meanwhile.
function answerProposal(root, { pinned, folder, id }) {
  const copied = pinned.answers.find((item) => item.id === id);
  if (copied.kind === "rule") {
    throw new Refusal(
      `${id} is a rule, whose words are its row's: a rule is not given a value to propose${NOTHING}`,
    );
  }
  const now = readJson(path.join(folder, ANSWERS)).answers.find((item) => item.id === id);
  if (!now) {
    throw new Refusal(
      `the core no longer holds ${id}: it was retired, and core --moved says so${NOTHING}`,
    );
  }
  const held = memberValue(id, memberFiles(root));
  if (held.value === undefined) {
    throw new Refusal(
      `this repository holds no value of ${id} the plugin reads: there is nothing to propose${NOTHING}`,
    );
  }
  if (sameCoreValue(id, held.value, now.value)) {
    throw new Refusal(
      `this repository holds ${shown(held.value)}, which the core holds already${sameCoreValue(id, held.value, copied.value) ? "" : ": accept it with core --accept " + id}${NOTHING}`,
    );
  }
  // While the proposal waits, a locked answer held otherwise stands only as an exception.
  const row = (readLedger(root) ?? []).find((item) => String(item.id) === id);
  const mark = coreMarkOf(row?.note);
  if (copied.hold === "locked" && !(mark.mark === "kept" && mark.pin === pinned.label)) {
    throw new Refusal(
      `${id} is locked and this repository holds ${shown(held.value)} with no exception recorded: record it first (core --settle --why ${id}=REASON), so the gate stays green while the proposal waits${NOTHING}`,
    );
  }
  return {
    subject: id,
    held: held.from,
    answer: { value: held.value, was: { value: now.value, hold: now.hold } },
  };
}

// A block the member took from the core and changed, as a proposal: its files as the member has
// them, named as the core names them. Refused where the member did not take it, or did not change it.
function blockProposal(root, { folder, id }) {
  const rows = readIntake(root, readTheme(root)).blocks.filter(
    (row) =>
      text(row.from) === CORE_SOURCE &&
      !row.own &&
      (text(row.source) === id || text(row.need) === id),
  );
  if (rows.length !== 1) {
    throw new Refusal(
      rows.length === 0
        ? `this repository took no block ${id} from the core: a block is proposed by a member that took it in and changed it${NOTHING}`
        : `${id} names ${rows.length} rows of the intake ledger: name the block by its need here${NOTHING}`,
    );
  }
  const [row] = rows;
  const subject = text(row.source);
  const copy = readFamilyStore(root).blocks?.find((block) => block.need === subject);
  const now = readJson(path.join(folder, INDEX)).blocks.find((block) => block.need === subject);
  if (!now) {
    throw new Refusal(
      `the core no longer offers ${subject}: it was retired, and core --moved says so${NOTHING}`,
    );
  }
  const recordFile = fileOf(row.conform) ?? `${CONFORM_FOLDER}/${text(row.need)}.json`;
  if (!insideRoot(root, recordFile) || !existsSync(path.join(root, recordFile))) {
    throw new Refusal(
      `${recordFile}, the conform record of ${text(row.need)}, is not there: the files of the block are not known${NOTHING}`,
    );
  }
  const record = readJson(path.join(root, recordFile));
  const names = (copy?.files ?? now.files).map((file) => file.file);
  const files = (Array.isArray(record.conformed) ? record.conformed : []).map((entry) => {
    const at = fileOf(entry?.file);
    const name = names
      .filter((each) => at === each || at?.endsWith(`/${each}`))
      .sort((a, b) => b.length - a.length)[0];
    if (!at || !name || !insideRoot(root, at) || !existsSync(path.join(root, at))) {
      throw new Refusal(
        `${at ?? "a file of the record"} is not a file of ${subject} this repository holds${NOTHING}`,
      );
    }
    return { file: name, from: at, bytes: readFileSync(path.join(root, at)) };
  });
  const listed = files.map(({ file, bytes }) => ({ file, sha256: sha(bytes) }));
  if (JSON.stringify(blockFilesKey(listed)) === JSON.stringify(blockFilesKey(now.files))) {
    throw new Refusal(
      `the files of ${subject} here are the core's already: there is nothing to propose${NOTHING}`,
    );
  }
  return {
    subject,
    need: text(row.need),
    contents: Object.fromEntries(files.map(({ file, bytes }) => [file, bytes])),
    from: Object.fromEntries(files.map(({ file, from }) => [file, from])),
    block: { name: now.name, files: listed, was: blockPinOf(now.files) },
  };
}

// The same thing proposed: the same value, or the same files.
const sameProposal = (a, b) =>
  a.answer
    ? JSON.stringify(a.answer.value) === JSON.stringify(b.answer?.value)
    : JSON.stringify(blockFilesKey(a.block?.files)) ===
      JSON.stringify(blockFilesKey(b.block?.files));

// Writes a proposal of the member into the core folder, or says what it would write.
export function proposeToCore(
  root,
  { id, asBlock = false, graduate = false, by, on, why, core = null, dryRun },
) {
  const { pinned, repository, folder } = reachCore(root, core);
  const existing = proposalsIn(folder);
  const isAnswer = !graduate && !asBlock && pinned.answers.some((item) => item.id === id);
  // A graduation asks about a block another repository has: it carries neither value nor file.
  const made = graduate
    ? graduationAsk(root, { folder, repository, need: id, existing })
    : isAnswer
      ? answerProposal(root, { pinned, folder, id })
      : blockProposal(root, { folder, id });
  const kind = graduate ? GRADUATION : isAnswer ? "answer" : "block";
  const proposal = {
    version: CORE.version,
    id: "",
    kind,
    subject: made.subject,
    repository,
    pin: pinned.label,
    by,
    on,
    why,
    ...(made.graduation
      ? { graduation: made.graduation }
      : made.answer
        ? { answer: made.answer }
        : { block: made.block }),
  };
  const base = {
    core: folder,
    family: pinned.family,
    repository,
    kind,
    subject: made.subject,
    by,
    on,
    why,
    dry_run: dryRun,
  };
  // Granted already, and the promotion not carried out yet: nothing more is asked.
  if (made.owed) return { ...base, owed: made.owed, call: made.call, files: [] };
  // A graduation is about a need of the family: one waits at a time, whoever asked.
  const waiting = existing.find(
    (item) =>
      (graduate || item.repository === repository) &&
      item.kind === kind &&
      item.subject === made.subject &&
      !item.decided &&
      !item.unreadable,
  );
  if (waiting && (graduate || sameProposal(proposal, waiting))) {
    return { ...base, already: waiting, files: [] };
  }
  if (waiting) {
    throw new Refusal(
      `${waiting.id}, a proposal of ${repository} about ${made.subject}, waits on the family's owner since ${waiting.on}: one proposal about a thing waits at a time, so the owner answers it first (core --grant or core --refuse)${NOTHING}`,
    );
  }
  proposal.id = newId(existing, kind, made.subject);
  const file = `${FOLDER}/${proposal.id}.json`;
  const problems = corePartShapeProblems("proposals", proposal, file);
  if (problems.length > 0) {
    throw new Refusal(
      `the proposal would not hold the core's shape: ${problems.join("; ")}${NOTHING}`,
    );
  }
  const files = [fileChange(path.join(folder, file), "create")];
  if (made.contents) {
    for (const name of Object.keys(made.contents)) {
      files.push(fileChange(path.join(folder, FOLDER, proposal.id, name), "create"));
    }
  }
  if (!dryRun) {
    for (const [name, bytes] of Object.entries(made.contents ?? {})) {
      const full = path.join(folder, FOLDER, proposal.id, name);
      mkdirSync(path.dirname(full), { recursive: true });
      writeFileSync(full, bytes);
    }
    mkdirSync(path.join(folder, FOLDER), { recursive: true });
    writeFileSync(path.join(folder, file), renderJson(proposal, WIDTH));
  }
  return { ...base, proposal, held_in: made.held ?? null, from: made.from ?? null, files };
}

// The proposal as a person reads it, before and after it is written.
export function proposeReport(result) {
  const where = `family core: ${result.family}, at ${result.core}`;
  if (result.owed) {
    const { decided } = result.owed;
    return [
      where,
      `${result.owed.id} asked this, and the family's owner granted it on ${decided.on} (${decided.by}, because ${decided.why}), choosing the block of ${decided.chose}: nothing was written`,
      `the promotion is owed: the family's owner runs, in ${decided.chose}: ${result.call}`,
    ];
  }
  if (result.already) {
    return [
      where,
      result.kind === GRADUATION
        ? `${result.already.id} asks this already (${result.already.repository}, on ${result.already.on}), and waits on the family's owner: nothing was written`
        : `${result.already.id} proposes this already, and waits on the family's owner since ${result.already.on}: nothing was written`,
      result.kind === GRADUATION ? OWNER_SEES_GRADUATION : OWNER_SEES,
    ];
  }
  const { proposal } = result;
  const lines = [
    where,
    `${result.dry_run ? "would write" : "wrote"} the proposal ${proposal.id} of ${result.repository}, in the core folder only:`,
    ...result.files.map((file) => `  ${file.change.padEnd(7)} ${file.path}`),
  ];
  if (proposal.graduation) {
    return [
      ...lines,
      ...askLines(proposal),
      `  by ${proposal.by} on ${proposal.on}, because ${proposal.why}`,
      OWNER_SEES_GRADUATION,
      `nothing of ${result.repository} was written`,
      "nothing was committed or sent anywhere",
    ];
  }
  if (proposal.answer) {
    lines.push(
      `  it proposes ${proposal.subject} becomes ${shown(proposal.answer.value)} (as ${result.held_in} holds it here); the core holds ${shown(proposal.answer.was.value)}, ${proposal.answer.was.hold}`,
    );
  } else {
    lines.push(
      `  it proposes the files of ${proposal.block.name} (${proposal.subject}) as this repository has them:`,
      ...proposal.block.files.map(
        (file) =>
          `    ${file.file} (from ${result.from[file.file]}), sha256 ${file.sha256.slice(0, 12)}`,
      ),
    );
  }
  lines.push(
    `  by ${proposal.by} on ${proposal.on}, because ${proposal.why}`,
    OWNER_SEES,
    `nothing of ${result.repository} was written: its own answer or block stands while the proposal waits, and its gate is as it was`,
    "nothing was committed or sent anywhere",
  );
  return lines;
}

// ---- the family's owner ----------------------------------------------------------------------------

// The proposals a core holds: those that wait on the owner first, then those answered.
export function listProposals(core) {
  const { declaration, index, retired } = readStore(core);
  const all = proposalsIn(core);
  const settled = new Set([...index.blocks, ...retired.blocks].map((block) => block.need));
  return {
    core,
    family: declaration.family,
    waiting: all.filter((item) => !item.decided),
    answered: all.filter((item) => item.decided),
    // A graduation granted whose block the store does not hold yet: the promotion is owed.
    owed: all
      .filter(
        (item) =>
          item.kind === GRADUATION &&
          item.decided?.outcome === "granted" &&
          !settled.has(item.subject),
      )
      .map((item) => ({ id: item.id, call: promotionCall(core, item), in: item.decided.chose })),
  };
}

const proposalWords = (item) =>
  item.unreadable
    ? `${item.id}: ${item.unreadable}`
    : item.kind === GRADUATION
      ? `${item.id}: ${askWords(item)}; by ${item.by} on ${item.on}, because ${item.why}`
      : `${item.id}: ${item.repository} proposes ${item.kind === "answer" ? `${item.subject} becomes ${shown(item.answer?.value)}` : `the files of ${item.block?.name} (${item.subject}): ${(item.block?.files ?? []).map((file) => file.file).join(", ")}`}; by ${item.by} on ${item.on}, because ${item.why}`;

export function listReport(result) {
  const lines = [`family core: ${result.family}, at ${result.core}`];
  if (result.waiting.length === 0) lines.push("no proposal waits on the family's owner");
  else {
    lines.push(`${result.waiting.length} proposal(s) wait on the family's owner:`);
    for (const item of result.waiting) lines.push(`  ${proposalWords(item)}`);
    lines.push(
      "grant one with core --grant ID --core DIR --by NAME --why TEXT, or refuse it with core --refuse ID --core DIR --by NAME --why TEXT",
    );
    if (result.waiting.some((item) => item.kind === GRADUATION)) {
      lines.push(
        "a graduation is granted with --choose REPOSITORY where it names two blocks; with --from DIR, the folder of the repository that has the block, the grant promotes at once, and without it the grant names the promotion to run there",
      );
    }
  }
  for (const item of result.answered) {
    const owed = (result.owed ?? []).find((each) => each.id === item.id);
    const carried =
      item.kind === GRADUATION && item.decided.outcome === "granted"
        ? owed
          ? `; chose the block of ${item.decided.chose}; the promotion is owed: run in ${owed.in}: ${owed.call}`
          : `; chose the block of ${item.decided.chose}; carried out, or settled since: the store has an entry for ${item.subject}`
        : "";
    lines.push(
      `  ${item.decided.outcome} ${item.id} (${item.repository}, ${item.subject}): by ${item.decided.by} on ${item.decided.on}, because ${item.decided.why}${carried}`,
    );
  }
  return lines;
}

// The owner's answer to a proposal: granted, carried out with the change move or the promotion's
// replace; or refused. Either way the proposal keeps the answer, who gave it, when and why.
export function decideProposal(core, request) {
  const { id, outcome, by, on, why, dryRun } = request;
  const { declaration, index } = readStore(core);
  const file = path.join(core, FOLDER, `${id}.json`);
  if (!existsSync(file)) {
    const ids = proposalsIn(core).map((item) => item.id);
    throw new Refusal(
      `the core holds no proposal ${id}: it holds ${ids.join(", ") || "none"}${NOTHING}`,
    );
  }
  const proposal = readJson(file);
  if (proposal.decided) {
    throw new Refusal(
      `${id} was answered already: ${proposal.decided.outcome} by ${proposal.decided.by} on ${proposal.decided.on}${NOTHING}`,
    );
  }
  const base = {
    core,
    family: declaration.family,
    id,
    outcome,
    proposal,
    by,
    on,
    why,
    dry_run: dryRun,
  };
  const isGraduation = proposal.kind === GRADUATION;
  for (const flag of ["choose", "from"]) {
    if (request[flag] && !(isGraduation && outcome === "granted")) {
      throw new Refusal(
        `--${flag} is said when a graduation is granted: ${id} is ${isGraduation ? "refused here" : `a proposal about ${proposal.kind === "answer" ? "an answer" : "a block's files"}`}${NOTHING}`,
      );
    }
  }
  const carried =
    outcome !== "granted"
      ? null
      : isGraduation
        ? grantGraduation(core, proposal, request)
        : grant(core, proposal, { index, by, on, why, dryRun });
  // The block came from an outside source whose licence line a person reads first: nothing is
  // answered until they say it allows passing the code on.
  if (carried?.promoted?.waits) return { ...base, waits: carried.promoted, files: [] };
  const decided = { ...proposal, decided: carried?.decided ?? { outcome, by, on, why } };
  const problems = corePartShapeProblems("proposals", decided, `${FOLDER}/${id}.json`);
  if (problems.length > 0) {
    throw new Refusal(
      `the proposal would not hold the core's shape: ${problems.join("; ")}${NOTHING}`,
    );
  }
  if (!dryRun) writeFileSync(file, renderJson(decided, WIDTH));
  return {
    ...base,
    carried,
    files: [...(carried?.files ?? []), fileChange(file, "update")],
  };
}

// A granted proposal carried out with the moves that exist: an answer by the change move, a block by
// the promotion's replace. Each records who, when and why, the proposal named.
function grant(core, proposal, { index, by, on, why, dryRun }) {
  const reason = `granted the proposal ${proposal.id} of ${proposal.repository} (${proposal.why}): ${why}`;
  if (proposal.kind === "answer") {
    const changed = changeCore(core, {
      id: proposal.subject,
      value: asGiven(proposal.answer.value),
      hold: undefined,
      from: null,
      by,
      on,
      why: reason,
      dryRun,
    });
    if (changed.change === "none") {
      throw new Refusal(
        `the core holds ${proposal.subject} as ${shown(proposal.answer.value)} already: refuse the proposal, with that as its reason${NOTHING}`,
      );
    }
    return { kind: "answer", change: changed, files: changed.files };
  }
  const was = index.blocks.find((block) => block.need === proposal.subject);
  if (!was) {
    throw new Refusal(
      `the core no longer offers ${proposal.subject}: refuse the proposal, with that as its reason${NOTHING}`,
    );
  }
  if (blockPinOf(was.files) !== proposal.block.was) {
    throw new Refusal(
      `the core's ${proposal.subject} changed since ${proposal.id} was made: its files are not the ones the proposal was made against. Refuse it with that as its reason, and the member proposes again${NOTHING}`,
    );
  }
  const folder = path.posix.join(FOLDER, proposal.id);
  const problems = heldFilesProblems(
    core,
    folder,
    proposal.block.files,
    `${FOLDER}/${proposal.id}.json.block`,
  );
  if (problems.length > 0) throw new Refusal(`${problems.join("; ")}${NOTHING}`);
  const contents = Object.fromEntries(
    proposal.block.files.map(({ file }) => [file, readFileSync(path.join(core, folder, file))]),
  );
  const entry = replacedBlock(was, {
    files: proposal.block.files,
    adapters: was.adapters,
    repository: proposal.repository,
    by,
    on,
    why: reason,
    licence: null,
  });
  const next = storeWith(index, entry);
  const files = [
    ...placeBlock(core, { need: was.need, contents, before: was.files, dryRun }),
    fileChange(path.join(core, INDEX), "update"),
  ];
  if (!dryRun) writeFileSync(path.join(core, INDEX), renderJson(next, WIDTH));
  return { kind: "block", block: entry, files };
}

export function decideReport(result) {
  const { proposal } = result;
  const lines = [
    `family core${result.dry_run ? " (not written: --dry-run)" : ""}: ${result.family}, at ${result.core}`,
    `${result.dry_run ? "would answer" : "answered"} ${result.id} of ${proposal.repository}: ${result.outcome}, by ${result.by} on ${result.on}, because ${result.why}`,
  ];
  if (result.waits) {
    return [
      lines[0],
      ...promoteReport(result.waits).slice(1),
      `${result.id} was not answered: run the grant again with --licence-allows once a person read the line`,
    ];
  }
  if (result.carried?.kind === GRADUATION) {
    lines.push(...grantLines(result, result.carried));
  } else if (result.carried?.kind === "answer") {
    const change = result.carried.change;
    lines.push(
      `  carried out with the change move: ${change.id}, its value ${shown(change.was.value)} became ${shown(change.became.value)}; its history records who, when and why`,
    );
  } else if (result.carried?.kind === "block") {
    lines.push(
      `  carried out with the promotion's replace: ${result.carried.block.name} (${result.carried.block.need}) has the files ${proposal.repository} proposed; its history records who, when and why`,
    );
  } else {
    lines.push(
      `  the proposal keeps the refusal and its reason; ${proposal.repository} is told at its next look (core --moved, status)`,
    );
  }
  lines.push(
    `${result.dry_run ? "would write" : "wrote"}, in the core folder only:`,
    ...result.files.map((file) => `  ${file.change.padEnd(9)} ${file.path}`),
    result.carried?.kind === GRADUATION
      ? `no repository was written: ${proposal.repository} is told at its next look (core --moved, status), and takes the block in once it is promoted and the store is pinned again (core --join)`
      : result.outcome === "granted"
        ? "no member repository was written: each member learns the core moved at its next look (core --moved), and accepts it there"
        : "no member repository was written",
    "nothing was committed or sent anywhere",
  );
  return lines;
}
