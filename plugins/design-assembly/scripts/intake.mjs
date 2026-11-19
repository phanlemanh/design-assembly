// intake: take a block into the store for a need, by the ladder of three rungs, with every choice
// made by the owner through the waiting list. Rung one: the intake ledger has a block for the need,
// and that is the answer; nothing is written. Rung two: the starter kit of this plugin, else the
// outside sources the repository pinned, give up to three candidates, and one question goes to the
// waiting list. Rung three: made by hand, with why. Once the owner answered on the decision sheet,
// the next call carries the answer out: it copies a piece of the starter kit, gives the install
// line of an outside source without running it, or takes the file made by hand, and writes one
// row with the owner's name and day. No row carries a person's name before a person answered.
// With --before it lists, once the owner keeps them, the components screens use that were made
// before the ledger. No model is called and nothing is fetched or run.
// Usage: node intake.mjs --need KEY [words of the need] [--kind component|block]
//        [--by-hand --why SENTENCE] [--file PATH] [--dry-run] [--target DIR] [--json]
//        [--out DIR [--format html|pdf]]
//        node intake.mjs --before [--dry-run] [--target DIR] [--json]
// Exit: 0 the need has its row (or nothing came before that is not listed); 1 a question waits on
// the owner, a file waits to be made, or the owner refused; 2 a wrong call, or a repository that
// cannot be read. On 2 nothing is written.
import { createHash } from "node:crypto";
import { existsSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { stdout } from "node:process";
import { fileURLToPath } from "node:url";

import { lineWidth, renderJson } from "../templates/tools/design-assembly/json.mjs";
import { readLedger } from "../templates/tools/design-assembly/ledger.mjs";
import { BY_HAND, spellingOf } from "../templates/tools/design-assembly/intake-ledger.mjs";
import { readYaml } from "../templates/tools/design-assembly/yaml.mjs";
import {
  picked,
  questionFile,
  readWaiting,
  rowProblems,
  WAITING_LIST,
} from "../templates/tools/design-assembly/waiting.mjs";
import { ownedFileOf, writeFiles, writtenFiles } from "./apply.mjs";
import { finish, readCall, Refusal, start } from "./command.mjs";
import { DOCUMENT_FLAGS, handOver, plural, requested } from "./document.mjs";
import { find, wordsOf } from "./find.mjs";
import { ledgerWith, yamlValue } from "./intake-write.mjs";
import { inventory } from "./inventory.mjs";
import { readStamp, VERSION } from "./stamp.mjs";
import { componentsOf, fileOf, insideRoot, readIntake, readTheme, text } from "./store.mjs";

const PLUGIN = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const LIMITS = JSON.parse(readFileSync(path.join(PLUGIN, "references/limits.json"), "utf8")).limits;

const NEED = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const KINDS = ["component", "block"];
const CANDIDATES = 3;
// The first version whose tool reads a question with candidates: a tool copied in before it would
// read one as broken, so no question is written there until the repository upgrades.
export const QUESTIONS_SINCE = "0.12.0";
const BEFORE_ID = "intake-before";
const BEFORE_WHY = "made before the intake ledger was kept";
const STORES = { starter: "the starter kit of this plugin", "by-hand": "made by hand" };
const storeWords = (store) =>
  STORES[store] ?? `the outside source ${store.replace(/^sources\//, "")}`;

const sha = (content) => createHash("sha256").update(content).digest("hex");
const today = () => {
  const now = new Date();
  const two = (value) => String(value).padStart(2, "0");
  return `${now.getFullYear()}-${two(now.getMonth() + 1)}-${two(now.getDate())}`;
};
const older = (version, than) => {
  const parts = (value) => String(value).split(".").map(Number);
  const [a, b] = [parts(version), parts(than)];
  for (let index = 0; index < 3; index += 1) {
    if ((a[index] || 0) !== (b[index] || 0)) return (a[index] || 0) < (b[index] || 0);
  }
  return false;
};

// ---- what the repository holds --------------------------------------------------------------------

// The intake ledger and what stands around it, read once. A ledger that cannot be read stops the
// call before anything is written. The waiting list is read only past rung one: a block the ledger
// keeps is the answer whatever the waiting list holds.
function readState(root) {
  const theme = readTheme(root);
  const intake = readIntake(root, theme);
  const none = intake.why !== null && intake.why.startsWith("no intake ledger");
  if (!intake.ledger && !none) throw new Refusal(`${intake.why}. Nothing was written`);
  const spelled = intake.ledger?.spelled ?? spellingOf(readYaml(""));
  const byHand = text(intake.ledger?.values?.[BY_HAND]) ?? BY_HAND;
  return { root, theme, intake, spelled, byHand, stamp: readStamp(root) };
}

// The waiting list, read once when a question is read or written. One kept as one shared file
// stops the call: a question would change that file.
function waitingOf(state) {
  if (state.waiting === undefined) {
    const ledgerIds = (readLedger(state.root) ?? []).map((row) => String(row.id));
    state.waiting = readWaiting(state.root, ledgerIds);
  }
  if (state.waiting?.shape === "file") {
    throw new Refusal(
      `the waiting list is one shared file, ${WAITING_LIST}, and a question would change it: split it first, with decide --split. Nothing was written`,
    );
  }
  return state.waiting;
}

// The ledger as one that can take a new entry: its blocks are a list.
function writable(state) {
  if (!Array.isArray(state.intake.ledger?.blocks ?? [])) {
    throw new Refusal(`${state.intake.kept}: its blocks are not a list. Nothing was written`);
  }
}

// Why a question cannot be written to this repository, or null.
function questionProblem(state) {
  if (state.stamp && older(state.stamp.version, QUESTIONS_SINCE)) {
    return `the tool of this repository is ${state.stamp.version}, which reads a question with candidates as broken: bring it up with upgrade first, then ask again. Nothing was written`;
  }
  return null;
}

// The questions the waiting list asks about an item, the last asked last.
const rowsOf = (state, item) => (waitingOf(state)?.rows ?? []).filter((row) => row.item === item);
const rowOf = (state, item) => rowsOf(state, item).at(-1);

// A question as one file of the waiting list, checked as the gate checks it.
function questionFiles(root, state, row) {
  const problem = questionProblem(state);
  if (problem) throw new Refusal(problem);
  const clash = (waitingOf(state)?.rows ?? []).find(
    (other) => other.id.toLowerCase() === row.id.toLowerCase(),
  );
  if (clash) {
    throw new Refusal(
      `the waiting list has a question ${clash.id} about something else: take it away or answer it first. Nothing was written`,
    );
  }
  const problems = rowProblems(row, row.id);
  if (problems.length > 0) throw new Refusal(`${problems.join("; ")}. Nothing was written`);
  return { [questionFile(row.id)]: renderJson(row, lineWidth(root)) };
}

// ---- rung two: the candidates ---------------------------------------------------------------------

// The places a piece of the starter kit is copied to, and the template each comes from; or why it
// cannot be copied here.
function starterPlaces(root, files) {
  const places = [];
  for (const file of files) {
    const template = path.basename(file);
    const to = ownedFileOf(root, template);
    if (!to) return { why: `the guide has no place for ${template} in this repository` };
    const content = readFileSync(path.join(PLUGIN, "templates/owned", template), "utf8");
    const there = existsSync(path.join(root, to))
      ? readFileSync(path.join(root, to), "utf8")
      : null;
    if (there !== null && there !== content) {
      return { why: `${to} is there already and is not the template ${template}`, in: to };
    }
    places.push({ template, to, content, there: there !== null });
  }
  return { places };
}

// Why a candidate's words cannot become a row of the ledger, or null: checked when the question
// is asked, so that no answer is given for a row that cannot be written.
function unkept(candidate) {
  for (const key of ["name", "source", "from", "pin", "description"]) {
    if (candidate[key] === undefined) continue;
    try {
      yamlValue(candidate[key]);
    } catch (error) {
      return error.message;
    }
  }
  return null;
}

// A piece find offers, as the owner is given it to pick.
function candidateOf(root, piece, need, words) {
  const why = piece.need === need ? `its need is ${need}` : `it holds every word of "${words}"`;
  const said = {
    name: piece.name,
    kind: piece.kind,
    store: piece.store,
    source: piece.name,
    ...(piece.description ? { description: piece.description } : {}),
    ...(piece.pin ? { pin: piece.pin } : {}),
    ...(piece.reference ? { reference: piece.reference } : {}),
    why,
  };
  if (piece.store === "starter") {
    const { places, why: cannot } = starterPlaces(root, piece.files);
    if (!places) return { left: `${piece.name} is in the starter kit, but ${cannot}` };
    return {
      candidate: {
        ...said,
        from: "starter",
        files: piece.files,
        to: places.map((place) => place.to),
      },
    };
  }
  return {
    candidate: {
      ...said,
      from: piece.source,
      ...(piece.install ? { install: piece.install } : {}),
    },
  };
}

// What the stores beyond the repository's own offer for a need, and what the repository's own
// holds that has the words under another need: near, never taken for it.
function candidatesFor(root, { need, words, kind, byHand, why }) {
  const own = find(root, { words, kind });
  const near = own.matches
    .filter((piece) => piece.tier === 1)
    .map((piece) => ({
      name: piece.name,
      kind: piece.kind,
      store: piece.store,
      file: piece.file,
      ...(piece.need ? { need: piece.need } : {}),
    }));
  const farther = find(root, { words, kind, from: 2, limit: CANDIDATES });
  const notes = [];
  const found = [];
  for (const piece of farther.matches) {
    const made = candidateOf(root, piece, need, words);
    const cannot = made.candidate ? unkept(made.candidate) : null;
    if (made.candidate && !cannot) found.push(made.candidate);
    else notes.push(made.left ?? `${piece.name} is left out: ${cannot}`);
  }
  const searched = farther.searched
    .filter((entry) => entry.read !== null)
    .map((entry) => entry.store);
  const reason =
    why ??
    `nothing in ${searched.length > 0 ? searched.join(", ") : "the starter kit or a pinned source"} answers "${words}"`;
  const hand = { name: "by-hand", store: "by-hand", why: reason };
  const candidates = byHand ? [hand, ...found] : [...found, hand];
  return { candidates, near, notes };
}

// Whether fresh candidates offer what a refused question did not: another first one, or others.
const offersOther = (refused, candidates) =>
  JSON.stringify(candidates.map((item) => item.name)) !==
  JSON.stringify((refused.candidates ?? []).map((item) => item.name));

// The question that asks the owner which block answers the need. Asked again after a refusal, it
// is the second, third... question about the need, and its id says so.
function needQuestion(state, need, candidates, before = 0) {
  const [first] = candidates;
  return {
    id: before === 0 ? `intake-${need}` : `intake-${need}-${before + 1}`,
    group: "blocks to take in",
    question: `Which block answers the need ${need}?`,
    recommendation:
      first.store === "by-hand"
        ? "make it by hand"
        : `${first.name}, from ${storeWords(first.store)}`,
    basis: first.why,
    hard_to_undo: false,
    where: state.intake.kept,
    if_refused: `no block is taken in for ${need}; ask again with other words, or make it by hand with --by-hand --why`,
    item: `need:${need}`,
    asked_on: today(),
    candidates,
  };
}

// ---- after the answer -----------------------------------------------------------------------------

// The candidate the owner picked, or null when they refused.
function chosenOf(question) {
  if (question.answer === "refuse") return null;
  if (question.answer === "keep") return question.candidates[0];
  const [name] = picked(question, question.said);
  const found = question.candidates.find((candidate) => candidate.name === name);
  if (!found) {
    throw new Refusal(
      `${question.id} was answered ${name}, which is none of its candidates. Nothing was written`,
    );
  }
  return found;
}

// The file the caller names, checked: inside the repository and there.
function namedFile(root, named) {
  const file = fileOf(named);
  const full = path.join(root, file);
  if (!existsSync(full) || !statSync(full).isFile()) {
    throw new Refusal(`${file} is not a file of this repository. Nothing was written`);
  }
  return { file, content: readFileSync(full, "utf8") };
}

// The name a block is known by in code: the component its file exports, else the given one.
function codeName(root, file, otherwise) {
  const exported = componentsOf(root)
    .components.filter((component) => component.file === file)
    .map((component) => component.name);
  return exported[0] ?? otherwise;
}

// The row of the ledger for a picked candidate, in the contract's keys and order, and the files of
// the starter kit that come with it; or what is still missing before it can be written.
function rowFor(root, state, { need, question, chosen, named }) {
  const approved = { approved: question.on, approved_by: question.by };
  if (chosen.store === "starter") {
    if (named) {
      throw new Refusal(
        "--file names the file of a block made by hand or taken from a source; a piece of the starter kit is copied from its templates",
      );
    }
    const { places, why, in: blocking } = starterPlaces(root, chosen.files);
    if (!places) {
      throw new Refusal(
        `${blocking ?? chosen.name}: ${why}; it is never written over. Nothing was written`,
      );
    }
    const files = Object.fromEntries(
      places.filter((place) => !place.there).map((place) => [place.to, place.content]),
    );
    return {
      files,
      row: {
        name: chosen.name,
        file: places[0].to,
        source: chosen.source,
        from: "starter",
        pin: `design-assembly ${VERSION}`,
        need,
        ...(chosen.description ? { description: chosen.description } : {}),
        ...approved,
        taken: sha(places[0].content),
      },
    };
  }
  if (!named) return { missing: true };
  const { file, content } = namedFile(root, named);
  const external = chosen.store !== "by-hand";
  return {
    files: {},
    row: {
      name: codeName(root, file, external ? chosen.name : need),
      file,
      source: external ? chosen.source : state.byHand,
      ...(external ? { from: chosen.from } : {}),
      ...(external && chosen.pin ? { pin: chosen.pin } : {}),
      need,
      ...(external
        ? chosen.description
          ? { description: chosen.description }
          : {}
        : { description: chosen.why }),
      ...approved,
      taken: sha(content),
    },
  };
}

// ---- the need -------------------------------------------------------------------------------------

const answerOf = (row) =>
  row.answer === "refuse"
    ? `refused by ${row.by} on ${row.on}${row.said ? `: ${row.said}` : ""}`
    : `answered by ${row.by} on ${row.on}`;

function needCall(root, state, options) {
  const { need, words, kind, byHand, why, named } = options;
  const base = { need, rung: null, candidates: [], near: [], waiting: null, chosen: null };
  const block = state.intake.blocks.find((item) => text(item.need) === need);
  if (block?.retired) {
    throw new Refusal(
      `the block for ${need}, ${text(block.name) ?? "(unnamed)"}, was retired: a new block is asked for under another need key`,
    );
  }
  if (block?.merged_into) {
    throw new Refusal(
      `the block for ${need} was merged into ${text(block.merged_into)}: ask for that need instead`,
    );
  }
  if (block) {
    return {
      ...base,
      question: null,
      rung: "store",
      row: block,
      next: `use ${text(block.name)}, ${fileOf(block.file) ?? "in the repository"}: the intake ledger has it for ${need}`,
      writes: {},
      work: false,
    };
  }
  const item = `need:${need}`;
  const question = rowOf(state, item);
  // Asked afresh when nothing was asked, or when the owner refused and this call offers what the
  // refused question did not: other words, or by hand. The refused question stays, as it was.
  const fresh =
    !question || question.answer === "refuse"
      ? candidatesFor(root, { need, words, kind, byHand, why })
      : null;
  if (fresh && (!question || offersOther(question, fresh.candidates))) {
    const row = needQuestion(state, need, fresh.candidates, rowsOf(state, item).length);
    return {
      ...base,
      rung: rungOf(fresh.candidates[0]),
      candidates: fresh.candidates,
      near: fresh.near,
      waiting: row.id,
      question: "asked",
      notes: fresh.notes,
      row: null,
      next: `asked the owner in ${questionFile(row.id)}: go on with ${row.recommendation}; the row is written once the owner answers on the decision sheet, and this is called again`,
      writes: questionFiles(root, state, row),
      work: true,
    };
  }
  if (!Array.isArray(question.candidates) || question.candidates.length === 0) {
    throw new Refusal(
      `${question.id} asks about ${item} with no candidates to pick from: take it away from the waiting list, then ask again. Nothing was written`,
    );
  }
  const asked = {
    ...base,
    candidates: question.candidates,
    waiting: question.id,
    question: question.answer ? "answered" : "waits",
    row: null,
  };
  if (!question.answer) {
    return {
      ...asked,
      rung: rungOf(question.candidates[0]),
      next: `${question.id} waits on the owner: answer it on the decision sheet, then call this again`,
      writes: {},
      work: true,
    };
  }
  const chosen = chosenOf(question);
  if (!chosen) {
    return {
      ...asked,
      rung: rungOf(question.candidates[0]),
      next: `${question.id} was ${answerOf(question)}: no block is taken in for ${need}; to ask again, give other words, or --by-hand --why`,
      writes: {},
      work: true,
    };
  }
  const made = rowFor(root, state, { need, question, chosen, named });
  const rung = rungOf(chosen);
  if (made.missing) {
    const install = chosen.install ?? null;
    return {
      ...asked,
      rung,
      chosen,
      install,
      next:
        rung === "external"
          ? `${question.id} was ${answerOf(question)}: take ${chosen.name} in${install ? ` with ${install}` : ""} (it may need the network and new packages, so ask the owner before you run it; this command never runs it), then call this again with --file PATH, the block's file`
          : `${question.id} was ${answerOf(question)}: make the block, then call this again with --file PATH, its file`,
      writes: {},
      work: true,
    };
  }
  writable(state);
  const writes = {
    ...made.files,
    ...ledgerWith(root, state.intake.file, "blocks", [made.row], state.spelled),
  };
  return {
    ...asked,
    rung,
    chosen,
    install: chosen.install ?? null,
    row: made.row,
    next: `${made.row.name} is recorded for ${need}, approved by ${question.by} on ${question.on}`,
    writes,
    work: false,
  };
}

const rungOf = (candidate) =>
  candidate.store === "starter"
    ? "starter"
    : candidate.store === "by-hand"
      ? "by-hand"
      : "external";

// ---- what came before the ledger ------------------------------------------------------------------

// The components screens or the frame use, made in the repository, that no block records and the
// list of what came before does not name: one per file. Null, with why, when it cannot be told.
function unlisted(root, state) {
  const stock = inventory(root);
  const unknown = stock.blind.find(
    (entry) => entry.kind === "unrecorded" && entry.why !== state.intake.why,
  );
  if (unknown) return { why: unknown.why };
  const recorded = new Set(state.intake.blocks.map((block) => fileOf(block.file)));
  const listed = Array.isArray(state.intake.ledger?.before) ? state.intake.ledger.before : [];
  const files = new Set(listed.map((entry) => fileOf(entry?.file)).filter(Boolean));
  const names = new Set(listed.map((entry) => text(entry?.name)).filter(Boolean));
  const byFile = new Map();
  for (const item of stock.items) {
    if (item.kind !== "component" || item.source !== "own" || item.state !== "in-use") continue;
    if (recorded.has(item.file) || files.has(item.file) || names.has(item.name)) continue;
    if (byFile.has(item.file)) continue;
    byFile.set(item.file, {
      name: item.name,
      file: item.file,
      used_by: item.used_by.length > 0 ? item.used_by : ["the frame"],
    });
  }
  return { found: [...byFile.values()] };
}

function beforeCall(root, state) {
  const base = {
    need: null,
    rung: "before",
    candidates: [],
    near: [],
    chosen: null,
    row: null,
    question: null,
  };
  const now = unlisted(root, state);
  if (!now.found) {
    return {
      ...base,
      waiting: null,
      before: [],
      next: `which components screens use cannot be told: ${now.why}`,
      writes: {},
      work: true,
    };
  }
  const which =
    wordsOf(path.basename(state.intake.file).replace(/\.ya?ml$/, "")).join("-") || "intake";
  const item = `before:${which}`;
  const question = rowOf(state, item);
  if (!question) {
    if (now.found.length === 0) {
      return {
        ...base,
        waiting: null,
        before: [],
        next: "nothing screens use was made before the ledger and left out of it",
        writes: {},
        work: false,
      };
    }
    const row = {
      id: BEFORE_ID,
      group: "blocks to take in",
      question: `List these components in the intake ledger as made before it was kept: ${now.found.map((entry) => entry.name).join(", ")}?`,
      recommendation: "list all of them",
      basis: "screens or the frame use them, and no block of the ledger records them",
      hard_to_undo: false,
      where: state.intake.kept,
      if_refused: "each is reported as unrecorded until a block is taken in for it with --need",
      item,
      asked_on: today(),
      candidates: now.found,
    };
    return {
      ...base,
      candidates: now.found,
      waiting: row.id,
      question: "asked",
      before: [],
      next: `asked the owner in ${questionFile(row.id)}: the list is written once the owner answers on the decision sheet, and this is called again`,
      writes: questionFiles(root, state, row),
      work: true,
    };
  }
  if (!Array.isArray(question.candidates)) {
    throw new Refusal(
      `${question.id} asks about ${item} with no candidates to pick from: take it away from the waiting list, then ask again. Nothing was written`,
    );
  }
  const asked = {
    ...base,
    candidates: question.candidates,
    waiting: question.id,
    question: question.answer ? "answered" : "waits",
    before: [],
  };
  if (!question.answer) {
    return {
      ...asked,
      next: `${question.id} waits on the owner: answer it on the decision sheet, then call this again`,
      writes: {},
      work: true,
    };
  }
  if (question.answer === "refuse") {
    return {
      ...asked,
      next: `${question.id} was ${answerOf(question)}: nothing is listed`,
      writes: {},
      work: true,
    };
  }
  const names =
    question.answer === "keep"
      ? question.candidates.map((entry) => entry.name)
      : picked(question, question.said);
  const taken = now.found.filter((entry) => names.includes(entry.name));
  const later = now.found.filter(
    (entry) => !question.candidates.some((candidate) => candidate.name === entry.name),
  );
  const entries = taken.map((entry) => ({
    name: entry.name,
    file: entry.file,
    why: BEFORE_WHY,
    approved: question.on,
    approved_by: question.by,
  }));
  if (entries.length > 0) writable(state);
  const writes =
    entries.length > 0 ? ledgerWith(root, state.intake.file, "before", entries, state.spelled) : {};
  const left = now.found.filter((entry) => !names.includes(entry.name) && !later.includes(entry));
  const after = [
    left.length > 0
      ? `; ${left.map((entry) => entry.name).join(", ")} not listed, as the owner answered: take each in with --need`
      : "",
    later.length > 0
      ? `; ${later.map((entry) => entry.name).join(", ")} came after the question: take each in with --need`
      : "",
  ].join("");
  return {
    ...asked,
    before: entries,
    next: `${plural(entries.length, "component is", "components are")} listed as made before the ledger, ${answerOf(question)}${after}`,
    writes,
    work: later.length > 0,
  };
}

// ---- for a person ---------------------------------------------------------------------------------

function candidateLines(candidates) {
  return candidates.map((candidate, index) => {
    if (!candidate.store) {
      const users = Array.isArray(candidate.used_by) ? candidate.used_by.join(", ") : "?";
      return `  ${index + 1}. ${candidate.name}, ${candidate.file ?? "?"}: used by ${users}`;
    }
    const about = [storeWords(candidate.store), candidate.pin].filter(Boolean).join(", ");
    return `  ${index + 1}. ${candidate.name} (${about})${candidate.why ? `: ${candidate.why}` : ""}`;
  });
}

export function report(result, written) {
  const head =
    result.rung === "before"
      ? "intake: what came before the ledger"
      : `intake: ${result.need}, ${result.rung === "store" ? "in the store already" : `rung ${result.rung}`}`;
  const lines = [head];
  if (result.row) lines.push(`row: ${text(result.row.name)}, ${fileOf(result.row.file)}`);
  if (result.candidates.length > 0 && ["asked", "waits"].includes(result.question)) {
    lines.push("candidates:", ...candidateLines(result.candidates));
  }
  if (result.near.length > 0) {
    lines.push(
      "near, in the repository under another need or none (never taken for this one):",
      ...result.near.map(
        (piece) => `  ${piece.name} (${piece.store}${piece.need ? `, need ${piece.need}` : ""})`,
      ),
    );
  }
  if (result.install) lines.push(`install line, not run: ${result.install}`);
  for (const note of result.notes ?? []) lines.push(`note: ${note}`);
  if (written.length > 0) {
    lines.push(
      `${result.dry_run ? "would write" : "files"}:`,
      ...written.map((line) => `  ${line}`),
    );
  }
  lines.push(`next: ${result.next}`);
  if (result.dry_run) lines.push("preview only: nothing was written");
  return `${lines.join("\n")}\n`;
}

// ---- the document ---------------------------------------------------------------------------------

export function documentOf(result, origin) {
  const measured = (value) => ({ kind: "measurement", text: value });
  const waits = result.waiting !== null && result.row === null;
  const blind = LIMITS.filter(
    (limit) => ["intake", "document"].includes(limit.area) && limit.status === "open",
  );
  return {
    kind: "intake-report",
    title: "Intake report",
    lede: "How a block was taken into the store for a need, and what waits on the owner.",
    origin,
    version: VERSION,
    scope: [
      result.rung === "before" ? "What came before the intake ledger" : `The need: ${result.need}`,
    ],
    decision: {
      conclusion: result.next,
      figures: [
        { value: String(result.candidates.length), label: "candidates" },
        { value: String(result.near.length), label: "near, under another need" },
        { value: String(result.files.length), label: "files written" },
      ],
      attention: waits
        ? [{ title: `${result.waiting} waits on the owner`, detail: result.next }]
        : [],
      decide: [],
    },
    findings: result.candidates.map((candidate) => ({
      severity: "note",
      title: `${candidate.name}, ${storeWords(candidate.store)}`,
      evidence: [candidate.why, candidate.reference, candidate.install].filter(Boolean),
    })),
    recommendations: [
      {
        what: waits ? "Answer the question on the decision sheet" : "Nothing waits",
        basis: measured(result.next),
        action: result.next,
      },
    ],
    next: [{ why: result.next }],
    blind: blind.map(({ id, note }) => ({ id, note })),
  };
}

// ---- the call -------------------------------------------------------------------------------------

const CALL =
  "usage: node intake.mjs --need KEY [words of the need] [--kind component|block] [--by-hand --why SENTENCE] [--file PATH] [--dry-run] [--target DIR] [--json] [--out DIR [--format html|pdf]]\n       node intake.mjs --before [--dry-run] [--target DIR] [--json]\n";

// The call as options, or a refusal that says what is wrong with it.
function optionsOf(call) {
  const flags = call.flags;
  const wrong = (why) => new Refusal(`${why}\n${CALL.trimEnd()}`);
  if (flags["--before"]) {
    const others = ["--need", "--kind", "--by-hand", "--why", "--file"].filter(
      (flag) => flags[flag] !== undefined,
    );
    if (others.length > 0 || call.words.length > 0) {
      throw wrong(
        `--before lists what came before the ledger; it takes no ${others[0] ?? "words"}`,
      );
    }
    return { before: true };
  }
  const need = flags["--need"];
  if (need === undefined)
    throw wrong("say the need with --need KEY, or list what came before with --before");
  if (!NEED.test(need))
    throw wrong(`${need} is not a need key: lower-case letters and digits, a dash between words`);
  const kind = flags["--kind"] ?? null;
  if (kind !== null && !KINDS.includes(kind)) throw wrong("--kind is component or block");
  const byHand = flags["--by-hand"] === true;
  const why = flags["--why"];
  if (byHand !== (why !== undefined)) {
    throw wrong(
      "--by-hand and --why go together: making it by hand says why the stores do not answer",
    );
  }
  if (why !== undefined && why.trim() === "") throw wrong("--why is a sentence");
  if (why !== undefined) {
    try {
      yamlValue(why.trim());
    } catch (error) {
      throw wrong(`--why becomes the block's description in the ledger, and ${error.message}`);
    }
  }
  const named = flags["--file"];
  if (named !== undefined && !insideRoot(call.target, fileOf(named))) {
    throw wrong(`${named} is outside the repository`);
  }
  const words = call.words.join(" ");
  return {
    need,
    words: wordsOf(words).length > 0 ? words : need.replaceAll("-", " "),
    kind,
    byHand,
    why: why?.trim() ?? null,
    named: named ?? null,
  };
}

async function main(args) {
  const call = readCall(
    args,
    {
      "--need": "value",
      "--kind": "value",
      "--by-hand": "switch",
      "--why": "value",
      "--file": "value",
      "--before": "switch",
      "--dry-run": "switch",
      ...DOCUMENT_FLAGS,
    },
    { words: true },
  );
  if (call.problem) throw new Refusal(`${call.problem}\n${CALL.trimEnd()}`);
  if (call.help) {
    stdout.write(CALL);
    return;
  }
  const options = optionsOf(call);
  const asked = requested(call);
  const dryRun = call.flags["--dry-run"] === true;
  const root = call.target;
  const state = readState(root);
  const planned = options.before ? beforeCall(root, state) : needCall(root, state, options);
  const { writes, work, ...result } = planned;
  const lines = writeFiles(root, writes, dryRun);
  const files = writtenFiles(lines);
  const notes = [...(result.notes ?? [])];
  if (!state.theme) {
    notes.push(
      "this repository has not taken this plugin in: no gate holds the intake ledger or the waiting list until it does",
    );
  }
  const answer = { ...result, notes, install: result.install ?? null, files, dry_run: dryRun };
  const handed = await handOver(asked, root, (origin) => documentOf(answer, origin));
  finish({
    json: call.json,
    // The files of the repository, then the document's.
    result: { ...answer, ...handed.data, files: [...files, ...(handed.data.files ?? [])] },
    text: `${report(
      answer,
      lines.filter((line) => !line.startsWith("unchanged")),
    )}${handed.text}`,
    work: work || (!state.theme && files.length > 0) || handed.work,
  });
}

await start(import.meta.url, main);
