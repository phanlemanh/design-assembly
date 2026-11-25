// What a member of a family holds of the core it pinned (spec 0016, slice 2 of item 7.1), read and
// written in one place: for each answer of the core, whether the repository inherits it, changed a
// default with a reason, keeps a locked answer as an exception with a reason, or differs from a
// locked answer with none; the mark each row of the decision ledger carries for it; whether a check
// of the repository holds it; and what the guide still asks. The guide, adopt, status and the core
// command read through here. Nothing here writes a file: the callers write what it gives.
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  CORE_VALUES,
  coreMarkOf,
  memberFiles,
  memberValues,
  PINNED_CORE,
  readPinnedCore,
  sameCoreValue,
  withCoreMark,
} from "../templates/tools/design-assembly/contract.mjs";
import {
  mergeLedger,
  parseLedger,
  pointerProblem,
  readLedger,
} from "../templates/tools/design-assembly/ledger.mjs";
import { adapterOf } from "../templates/tools/design-assembly/adapters/index.mjs";
import { STAMP } from "../templates/tools/design-assembly/waiting.mjs";

const PLUGIN = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const readJson = (file) => JSON.parse(readFileSync(path.join(PLUGIN, file), "utf8"));
const STANDARD = new Map(
  readJson("references/standard-decisions.json").decisions.map((row) => [row.id, row]),
);
const CATALOGUE = readJson("references/core-questions.json");
// The layer a rule of the core the ledger lacks is written under, when the standard does not know
// it: the layer of the behaviour rules.
const RULE_LAYER = CATALOGUE.behaviour.layer;
const LINT = adapterOf("lint").prefix;

// The core a repository pinned and how it holds each answer, or null when it declares no family.
// `files` has texts that stand in for what is on disk, for a command about to write them.
export function readMember(root, files = {}) {
  const pinned = readPinnedCore(root);
  if (pinned === null) return null;
  return {
    pinned,
    values: pinned.unreadable ? {} : memberValues(pinned, memberFiles(root, files)),
  };
}

// Where one answer of the core stands in the repository: `state` is inherited, changed (a default
// the repository holds otherwise, with a reason), kept (a locked answer it holds otherwise, as an
// exception with a reason), differs (a locked answer it holds otherwise with no exception) or
// unreasoned (a default it holds otherwise with no reason); `mark` is what its row's note says
// first, or null. A reason or an exception is the one given now (`reasons`, `exceptions`, by id),
// else the one the row already carries against this pin. A rule's words are never compared.
export function stateOf(answer, pinned, held, row, { reasons = {}, exceptions = {} } = {}) {
  const pin = pinned.label;
  const prior = coreMarkOf(row?.note);
  const here = prior.mark && prior.pin === pin ? prior : null;
  const differs =
    answer.kind === "value" &&
    held?.value !== undefined &&
    !sameCoreValue(answer.id, held.value, answer.value);
  if (!differs) return { state: "inherited", mark: { mark: "inherited", pin } };
  const locked = answer.hold === "locked";
  const kind = locked ? "kept" : "changed";
  const given = (locked ? exceptions : reasons)[answer.id] ?? (here?.mark === kind ? here : null);
  if (!given) return { state: locked ? "differs" : "unreasoned", mark: null };
  return {
    state: kind,
    mark: { mark: kind, pin, why: clean(given.why), by: given.by, on: given.on },
  };
}

// A reason as a note of the ledger can keep it: the readers of the ledger undo no escape, so no
// double quote and no backslash.
const clean = (text) => String(text).replace(/"/g, "'").replace(/\\/g, "/").trim();

// Sets the note of one row and changes nothing else of the file: the line of its note is written
// again, added when the row has none, or taken away when the note is empty.
export function setNote(text, id, note) {
  const lines = text.split("\n");
  const isRow = (line) => /^\s*-\s+id:/.test(line);
  const idOf = (line) =>
    /^\s*-\s+id:\s*(.*)$/
      .exec(line)[1]
      .trim()
      .replace(/^(["'])(.*)\1$/, "$2");
  const start = lines.findIndex((line) => isRow(line) && idOf(line) === id);
  if (start === -1) return text;
  let end = lines.findIndex((line, index) => index > start && isRow(line));
  if (end === -1) end = lines.length;
  const at = lines.findIndex(
    (line, index) => index > start && index < end && /^\s*note:/.test(line),
  );
  if (at !== -1) {
    if (note === "") lines.splice(at, 1);
    else lines[at] = `${/^(\s*note:\s*)/.exec(lines[at])[1]}${JSON.stringify(note)}`;
    return lines.join("\n");
  }
  if (note === "") return text;
  let last = end - 1;
  while (last > start && (lines[last].trim() === "" || lines[last].trim().startsWith("#")))
    last -= 1;
  const indent = /^(\s*)[a-z_]+:/.exec(lines[last])?.[1] ?? "    ";
  lines.splice(last + 1, 0, `${indent}note: ${JSON.stringify(note)}`);
  return lines.join("\n");
}

// A row for an answer of the core the ledger lacks: its layer and kind as the standard decisions
// give them; its source the words of a rule, or the file the repository holds the value in, else
// the row of the core it pinned; and no check, so it is inherited and not held until a check of the
// repository holds it.
function coreRow(answer, note, held) {
  const standard = STANDARD.get(answer.id);
  return {
    id: answer.id,
    layer: standard?.layer ?? RULE_LAYER,
    kind: standard?.kind ?? "standard",
    source: answer.kind === "rule" ? clean(answer.value) : (held?.from ?? PINNED_CORE.file),
    note,
  };
}

// The ledger text with each row of an answer of the core marked, and a row added for each answer of
// the core it lacks that has a mark. Every other byte of the file stays. Gives the text and where each answer
// stands.
export function markLedger(text, pinned, values, given = {}) {
  let out = text;
  const rows = parseLedger(text);
  const added = [];
  const states = [];
  for (const answer of pinned.answers) {
    const row = rows.find((item) => String(item.id) === answer.id);
    const state = stateOf(answer, pinned, values[answer.id], row, given);
    states.push({ id: answer.id, ...state });
    // A judgment the core answers says who answered it, as the decision sheet writes an answer: the
    // family's owner for an answer inherited, the person who gave the reason for one kept or
    // changed. A gate of any version then reads it as a person's answer, and not as one a branch
    // made alone.
    const who = state.mark?.by ? state.mark : answer;
    const stamped = (note, kind) =>
      state.mark && kind === "judgment" && !STAMP.test(note)
        ? [note, `answered by ${who.by} on ${who.on}`].filter(Boolean).join("; ")
        : note;
    if (row) {
      const note = stamped(withCoreMark(row.note ?? "", state.mark), row.kind);
      if (note !== (row.note ?? "")) out = setNote(out, answer.id, note);
    } else if (state.mark) {
      const made = coreRow(answer, "", values[answer.id]);
      added.push({ ...made, note: stamped(withCoreMark("", state.mark), "judgment") });
    }
  }
  if (added.length > 0) out = mergeLedger(out, added);
  return { text: out, states, added: added.map((row) => row.id) };
}

// Whether a check of the repository holds an answer the core holds by a check (criterion 26). The
// path of a test is each repository's own, so a test or browser test of any path that names the
// decision holds it; a tool or a lint rule is the same tool or rule. The row's id is the core's.
export function heldHere(root, answer, row) {
  if (!answer.check) return { held: false, why: "no check holds it in the core either" };
  if (!row?.check) return { held: false, why: "no row of this repository names a check for it" };
  const [kind, ...rest] = String(answer.check).split(":");
  const [mine, ...mineRest] = String(row.check).split(":");
  if (kind !== mine) {
    return {
      held: false,
      why: `the core holds it by a ${kind} check, and this repository's row names ${row.check}`,
    };
  }
  if ((kind === "tool" || kind === LINT) && rest.join(":") !== mineRest.join(":")) {
    return {
      held: false,
      why: `the core holds it by ${answer.check}, and this row names ${row.check}`,
    };
  }
  const broken = pointerProblem(root, answer.id, row.check);
  return broken ? { held: false, why: broken } : { held: true, by: row.check };
}

// Who settled an answer of the core and when, as a person reads it.
export function settledWords(answer) {
  const origin = answer.origin ?? {};
  const first = origin.by
    ? `, first settled in ${origin.repository} by ${origin.by}${origin.on ? ` on ${origin.on}` : ""}`
    : origin.repository
      ? `, first read from ${origin.repository}`
      : "";
  return `${answer.hold} by ${answer.by} on ${answer.on}${first}`;
}

const shown = (value) => (typeof value === "string" ? value : JSON.stringify(value));

// Where every answer of the core stands in a repository, and how many of the locked ones a check
// here holds: what `status` says of a member. Null when the repository declares no family.
export function memberStatus(root) {
  const member = readMember(root);
  if (member === null) return null;
  const { pinned, values } = member;
  if (pinned.unreadable) {
    return { family: pinned.family, unreadable: pinned.unreadable, answers: [] };
  }
  const rows = readLedger(root) ?? [];
  const answers = pinned.answers.map((answer) => {
    const row = rows.find((item) => String(item.id) === answer.id);
    const { state } = stateOf(answer, pinned, values[answer.id], row);
    const check = heldHere(root, answer, row);
    return {
      id: answer.id,
      hold: answer.hold,
      kind: answer.kind,
      state,
      held: check.held,
      ...(check.held ? { by: check.by } : { why: check.why }),
    };
  });
  const locked = answers.filter((answer) => answer.hold === "locked");
  const count = (list, test) => list.filter(test).length;
  return {
    family: pinned.family,
    pin: pinned.label,
    taken_on: pinned.taken_on,
    unreadable: null,
    answers,
    locked: locked.length,
    defaults: answers.length - locked.length,
    // Held: a check of this repository holds it. Claimed and not held: inherited, and nothing here
    // holds it. Neither is counted as the other.
    held: count(locked, (answer) => answer.held),
    not_held: count(locked, (answer) => !answer.held && answer.state === "inherited"),
    differs: count(locked, (answer) => answer.state === "differs"),
    kept: count(locked, (answer) => answer.state === "kept"),
    changed: count(answers, (answer) => answer.state === "changed"),
  };
}

// The lines `status` prints of a member.
export function memberLines(core) {
  if (!core) return [];
  if (core.unreadable) {
    return [
      `family core: ${core.family ?? "a family"}: its copy here cannot be read (${core.unreadable}); the repository inherits nothing and its own answers stand: pin it again with core --join`,
    ];
  }
  const lines = [
    `family core: ${core.family}, pinned at ${core.pin}${core.taken_on ? ` on ${core.taken_on}` : ""}`,
    `  locked answers: ${core.locked}: ${core.held} held by a check here, ${core.not_held} inherited and not held${core.kept > 0 ? `, ${core.kept} kept against the core as exceptions` : ""}${core.differs > 0 ? `, ${core.differs} differ and wait on the owner` : ""}`,
    `  defaults: ${core.defaults}${core.changed > 0 ? `, ${core.changed} changed with a reason` : ""}`,
  ];
  for (const answer of core.answers.filter((item) => item.hold === "locked" && !item.held)) {
    lines.push(`  not held here: ${answer.id}: ${answer.why}`);
  }
  return lines;
}

// The questions of the guide, each with whether the core answers it: a locked answer is not asked
// (inherited), a default is filled in and may be changed (filled), anything else is asked as before.
export function guideQuestions(pinned) {
  const answers = new Map((pinned?.answers ?? []).map((answer) => [answer.id, answer]));
  return CATALOGUE.guide.map((question) => {
    const answer = question.answer ? answers.get(question.answer) : undefined;
    const state = !answer ? "asked" : answer.hold === "locked" ? "inherited" : "filled";
    return {
      ...question,
      state,
      ...(answer ? { value: answer.value, settled: settledWords(answer) } : {}),
    };
  });
}

// What a command says at its end of the answers the core gave, so nobody opens a ledger to trust
// it: each answer not asked, or filled in, with who settled it and when.
export function inheritedLines(pinned, states = null) {
  if (!pinned || pinned.unreadable) return [];
  const stateOfId = new Map((states ?? []).map((item) => [item.id, item.state]));
  const lines = [];
  for (const answer of pinned.answers) {
    const state = stateOfId.get(answer.id) ?? "inherited";
    if (!["inherited", "changed", "kept"].includes(state)) continue;
    const how =
      state === "inherited"
        ? answer.hold === "locked"
          ? "not asked"
          : "filled in"
        : state === "changed"
          ? "a default this repository changed, with its reason"
          : "kept against the core as an exception, with its reason";
    lines.push(`  ${answer.id}: ${shown(answer.value)}; ${how}; ${settledWords(answer)}`);
  }
  return lines;
}

// The lines a command prints at its end of what the core answered, under one heading.
export function inheritedSummary(pinned, states = null) {
  const lines = inheritedLines(pinned, states);
  return lines.length > 0
    ? [
        `answered by the family core ${pinned.family} at ${pinned.label}, not asked again:`,
        ...lines,
      ]
    : [];
}

// The reasons the blueprint gives for a default of the core it changed, by the id of the answer:
// `changed.<choice key>` of a layer, with `why`, `by` and `on`.
export function blueprintReasons(blueprint) {
  const reasons = {};
  for (const [id, place] of Object.entries(CORE_VALUES)) {
    const given = place.layer ? blueprint?.layers?.[place.layer]?.changed?.[place.key] : undefined;
    if (given?.why && given?.by && given?.on) reasons[id] = given;
  }
  return reasons;
}

// What is wrong with a blueprint against the core the repository pinned: a choice the core locks
// that the blueprint holds otherwise with no exception in the ledger, and a default it changed with
// no reason under `changed`. Empty on a repository that declares no family.
export function blueprintCoreProblems(root, blueprint) {
  const member = readMember(root);
  if (!member || member.pinned.unreadable) return [];
  const { pinned, values } = member;
  const rows = readLedger(root) ?? [];
  const reasons = blueprintReasons(blueprint);
  const problems = [];
  for (const answer of pinned.answers) {
    const place = CORE_VALUES[answer.id];
    if (!place?.layer || values[answer.id]?.from !== "design/blueprint.json") continue;
    const row = rows.find((item) => String(item.id) === answer.id);
    const { state } = stateOf(answer, pinned, values[answer.id], row, { reasons });
    if (state === "differs") {
      problems.push(
        `${place.layer}: ${place.key} is ${shown(values[answer.id].value)}, and the family core this repository pinned locks ${shown(answer.value)}: write the core's answer, or keep yours as an exception with its reason (core --settle)`,
      );
    }
    if (state === "unreasoned") {
      problems.push(
        `${place.layer}: ${place.key} is ${shown(values[answer.id].value)}, and the family core's default is ${shown(answer.value)}: say why under changed.${place.key}, with why, by and on`,
      );
    }
  }
  return problems;
}

// The widths a new repository of the family starts from, when the core holds them.
export function coreWidths(root) {
  const member = readMember(root);
  if (!member || member.pinned.unreadable) return null;
  const answer = member.pinned.answers.find((item) => item.id === "test-screen-sizes");
  return Array.isArray(answer?.value) ? answer.value : null;
}
