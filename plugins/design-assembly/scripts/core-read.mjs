// The first repository of a family, read for its core (spec 0016, criteria 3 and 4): the answers a
// person settled there, each with its value, the check that holds it and who settled it when the
// ledgers say so; the answers left out, each with why; and the lock-or-default sheet, four
// questions at most, that a person answers before a core is built. It reads the blueprint when the
// guide built the repository, and the decision ledger, the token file and the widths when it was
// adopted. It writes nothing, and calls no model and no network.
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync, realpathSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { CORE, LEDGERS, newerLedgers } from "../templates/tools/design-assembly/contract.mjs";
import { LAYER_ALIASES, readLedger } from "../templates/tools/design-assembly/ledger.mjs";
import { readWaiting, STAMP, UNCONFIRMED } from "../templates/tools/design-assembly/waiting.mjs";
import { candidateFrom } from "./bring-in.mjs";
import { Refusal } from "./command.mjs";

const PLUGIN = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const readJson = (file) => JSON.parse(readFileSync(path.join(PLUGIN, file), "utf8"));
export const CATALOGUE = readJson("references/core-questions.json");
const STANDARD = new Map(
  readJson("references/standard-decisions.json").decisions.map((row) => [row.id, row]),
);
// At most this many questions in one sitting of the lock-or-default sheet.
export const SITTING = 4;
const FILES = {
  blueprint: LEDGERS.blueprint.file,
  decisions: LEDGERS.decisions.file,
  tokens: LEDGERS.tokens.file,
  widths: LEDGERS["screen-sizes"].file,
};
const DECLARATION = CORE.parts.declaration.file;
const ANSWERS = CORE.parts.answers.file;

const git = (root, ...args) => {
  const run = spawnSync("git", ["-C", root, ...args], { encoding: "utf8" });
  return run.status === 0 ? run.stdout.trim() : null;
};

// The main folder of a repository: the one git keeps its history beside, read through the folder
// git shares with every working folder of it, so a separate working folder (a worktree) gives the
// repository's main folder and not its own; the folder itself outside git.
export function homeOf(root) {
  const common = git(root, "rev-parse", "--path-format=absolute", "--git-common-dir");
  if (common && path.basename(common) === ".git") return realpathSync(path.dirname(common));
  return realpathSync(root);
}

// The name a repository goes by: the name of its main folder.
export const repositoryName = (root) => path.basename(homeOf(root));

// The commit the repository stands at, or null outside git or before a first commit.
export const commitOf = (root) => git(root, "rev-parse", "HEAD");

function readJsonOf(root, file) {
  const full = path.join(root, file);
  if (!existsSync(full)) return null;
  try {
    return JSON.parse(readFileSync(full, "utf8"));
  } catch {
    throw new Refusal(`${file} is not JSON, so this repository cannot be read`);
  }
}

// What the waiting list asks about each row of the decision ledger, by the row's id: the last
// question about it.
function askedRows(root, ids) {
  let waiting;
  try {
    waiting = readWaiting(root, ids);
  } catch (error) {
    throw new Refusal(`the waiting list cannot be read: ${error.message}`);
  }
  const asked = new Map();
  for (const row of waiting?.rows ?? []) {
    const id = /^decision:(.+)$/.exec(String(row.item ?? ""))?.[1];
    if (id) asked.set(id, row);
  }
  return asked;
}

const said = (by, on) => (by && on ? ` by ${by} on ${on}` : "");

// Whether a person settled an answer, read as the decision sheet and the guide write it: a
// question about it that waits or was refused, a note that says nobody confirmed it, a blueprint
// answer the guide proposed or read off the repository, are not settled. Who settled it and when,
// where a ledger says so. A row with no mark at all is the repository's own decision, as the gate
// takes it, and is settled with no name.
function verdictOf({ row, choice, asked }) {
  if (asked && !asked.answer) {
    return { why: `it waits on the decision sheet as ${asked.id}: a person has not answered it` };
  }
  if (asked?.answer === "refuse") {
    return { why: `it was refused on the decision sheet (${asked.id})${said(asked.by, asked.on)}` };
  }
  const note = String(row?.note ?? "");
  if (UNCONFIRMED.test(note)) {
    return { why: "its row of the decision ledger says a person has not confirmed it" };
  }
  const stamp = STAMP.exec(note);
  if (stamp?.[1] === "refused") return { why: `it was refused${said(stamp[2], stamp[3])}` };
  const named = asked?.answer
    ? { by: asked.by ?? null, on: asked.on ?? null }
    : stamp
      ? { by: stamp[2], on: stamp[3] }
      : { by: null, on: null };
  if (choice) {
    const { layer, entry, key } = choice;
    if (entry.status !== "decided") {
      return { why: `the ${layer} layer of the blueprint is ${entry.status ?? "not decided"}` };
    }
    const confirmed = (entry.confirmed ?? []).includes(key);
    if (entry.source !== "user" && !confirmed) {
      const whose = entry.source === "repo" ? "read from the repository" : "proposed by the guide";
      return { why: `its answer in the blueprint was ${whose}, and a person has not confirmed it` };
    }
    const answered = entry.answered?.[key];
    return {
      settled: true,
      by: answered?.by ?? named.by,
      on: answered?.on ?? named.on,
    };
  }
  if (!row) return { why: "the repository has not answered it" };
  return { settled: true, ...named };
}

// The choice of the blueprint an answer is, where the blueprint has it.
function choiceOf(blueprint, entry) {
  if (!blueprint || !entry.blueprint) return null;
  const { layer, key } = entry.blueprint;
  const found = blueprint.layers?.[layer];
  if (!found || !Object.hasOwn(found.choice ?? {}, key)) return null;
  return { layer, key, entry: found, value: found.choice[key] };
}

// The value of an answer and the file it was read from. Null with why where it cannot be read.
function valueOf(root, entry, { row, choice }) {
  if (choice) {
    const { value, entry: layer } = choice;
    const ratio = layer.choice?.type_ratio;
    const shown =
      entry.id === "type-scale-values" && value === "modular" && ratio ? `modular ${ratio}` : value;
    return { value: shown, ledger: FILES.blueprint };
  }
  if (entry.value === "tokens") {
    if (!existsSync(path.join(root, FILES.tokens))) {
      return { why: `${FILES.tokens} is not there, so the colour cannot be read` };
    }
    try {
      const colour = candidateFrom(path.join(root, FILES.tokens), "tokens").values.source_color;
      return { value: colour, ledger: FILES.tokens };
    } catch (error) {
      return { why: error.message.replace(path.join(root, FILES.tokens), FILES.tokens) };
    }
  }
  if (entry.value === "screen-sizes") {
    const widths = readJsonOf(root, FILES.widths)?.widths;
    if (Array.isArray(widths) && widths.length > 0) return { value: widths, ledger: FILES.widths };
  }
  if (row?.source) return { value: row.source, ledger: FILES.decisions };
  return { why: "the repository's ledgers give it no value" };
}

const layerOf = (row) => {
  const layer = String(row.layer ?? "");
  return Object.hasOwn(LAYER_ALIASES, layer) ? LAYER_ALIASES[layer] : layer;
};

// The questions of a repository that may go into a core: those the catalogue lists, then every
// behaviour rule its ledger has, in the ledger's order.
function questionsOf(rows) {
  const listed = CATALOGUE.questions.map((entry) => ({ ...entry, group: entry.id }));
  const named = new Set(listed.map((entry) => entry.id));
  const behaviours = rows
    .filter((row) => layerOf(row) === CATALOGUE.behaviour.layer && !named.has(String(row.id)))
    .map((row) => ({ id: String(row.id), start: CATALOGUE.behaviour.start, group: "behaviour" }));
  return [...listed, ...behaviours];
}

const questionText = (id) =>
  STANDARD.get(id)?.question ?? `What does the rule ${id} of the repository hold?`;

// The first repository read for a core: its name and commit, how it keeps its answers, the answers
// a person settled (the candidates), and the answers left out with why. Throws a refusal when a
// ledger cannot be read or is of a newer shape than this plugin reads.
export function readFirst(root) {
  const newer = newerLedgers(root);
  if (newer.length > 0) throw new Refusal(`${newer.join("; ")}. Nothing was written`);
  const blueprint = readJsonOf(root, FILES.blueprint);
  const rows = readLedger(root);
  const kind = blueprint ? "blueprint" : rows ? "ledgers" : "none";
  const ledger = rows ?? [];
  const asked = askedRows(
    root,
    ledger.map((row) => String(row.id)),
  );
  const home = homeOf(root);
  const repository = path.basename(home);
  const candidates = [];
  const leftOut = [];
  if (kind !== "none") {
    for (const entry of questionsOf(ledger)) {
      const row = ledger.find((item) => String(item.id) === entry.id) ?? null;
      const choice = choiceOf(blueprint, entry);
      if (!row && !choice) {
        if (entry.group !== "behaviour") {
          leftOut.push({ id: entry.id, why: "the repository has not answered it" });
        }
        continue;
      }
      const verdict = verdictOf({ row, choice, asked: asked.get(entry.id) });
      if (!verdict.settled) {
        leftOut.push({ id: entry.id, why: verdict.why });
        continue;
      }
      const value = valueOf(root, entry, { row, choice });
      if (value.why) {
        leftOut.push({ id: entry.id, why: value.why });
        continue;
      }
      candidates.push({
        id: entry.id,
        question: questionText(entry.id),
        group: entry.group,
        start: entry.start,
        value: value.value,
        check: row?.check ?? null,
        origin: { repository, ledger: value.ledger, by: verdict.by, on: verdict.on },
      });
    }
  }
  return {
    repository,
    path: realpathSync(root),
    home,
    commit: commitOf(root),
    kind,
    candidates,
    left_out: leftOut,
  };
}

// The folder a core lives in when the person names none: beside the main folder of the first
// repository, named after the family when its name is given.
export function placeOf(home, family) {
  const slug = String(family ?? "")
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return path.join(path.dirname(home), `${slug || "family"}-core`);
}

const idsOf = (candidates, hold) =>
  candidates.filter((item) => item.start === hold).map((item) => item.id);
const joined = (ids) => (ids.length > 0 ? ids.join(", ") : "none");

// The lock-or-default sheet: the family's name, the answers proposed as locked, those proposed as
// defaults, and where the core lives. Each question has what the decision sheet asks of one.
export function sheetOf(first, { family = null, core }) {
  const locked = idsOf(first.candidates, "locked");
  const defaults = idsOf(first.candidates, "default");
  const unheld = first.candidates
    .filter((item) => item.start === "locked" && item.check === null)
    .map((item) => item.id);
  const sheet = [
    {
      id: "family",
      question: "What is this family of products called?",
      recommendation: family ?? first.repository,
      basis: family
        ? "The name you gave. The family's name is yours: the plugin names no family."
        : `${first.repository} is the only name the machine has, the first repository's. The family's name is yours: the plugin names no family.`,
      where: `${path.join(core, DECLARATION)}`,
      if_refused: "No core is built until the family has a name.",
      hard_to_undo: false,
    },
    {
      id: "locked",
      question:
        "Which answers does every repository of the family keep as they are (locked), so that none is asked them again?",
      recommendation: joined(locked),
      basis: `Start with few locks: the source colour, how a record opens and the behaviour rules. A member that differs from a locked answer asks the family's owner, or keeps an exception with a reason. ${unheld.length > 0 ? `No check holds ${unheld.join(", ")}: the core says so, and no member counts it as held.` : "A check of the first repository holds each of them."}`,
      where: path.join(core, ANSWERS),
      if_refused: "Nothing is locked: each answer you keep in the core is a default.",
      hard_to_undo: false,
      candidates: first.candidates.map((item) => item.id),
    },
    {
      id: "default",
      question:
        "Which answers does a new repository of the family start from, and may change (default)?",
      recommendation: joined(defaults),
      basis:
        "Table density, the type scale and the widths checked fit most repositories of a family and differ for some: filled in for a new repository, changed with a reason. Screen kinds, column kinds and copy stay outside the core.",
      where: path.join(core, ANSWERS),
      if_refused: "Those answers stay out of the core: a new repository is asked them as today.",
      hard_to_undo: false,
      candidates: first.candidates.map((item) => item.id),
    },
    {
      id: "place",
      question: "Where does the core live?",
      recommendation: core,
      basis:
        "A folder on this machine, beside the first repository. Whether it becomes a git repository is yours; nothing is sent anywhere.",
      where: core,
      if_refused:
        "Name another folder; the core is never written inside a repository of the family.",
      hard_to_undo: false,
    },
  ];
  return sheet.slice(0, SITTING);
}
