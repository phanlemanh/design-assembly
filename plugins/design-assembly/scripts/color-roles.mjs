// The table of colour roles (references/color-roles.json), read once: every role of the floor's
// stylesheet, where its value comes from, and the pairs of text and ground it is measured in. The
// guide, adopt, status and the rules page read it here, and nowhere else.
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { contrast, parseColor } from "../templates/tools/design-assembly/color.mjs";
import { resolve } from "../templates/tools/design-assembly/styles.mjs";
import { THRESHOLDS } from "../templates/tools/design-assembly/theme.mjs";

const PLUGIN = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
export const ROLES_FILE = "references/color-roles.json";
export const COLOR_ROLES = JSON.parse(readFileSync(path.join(PLUGIN, ROLES_FILE), "utf8"));
const roleOf = (name) => COLOR_ROLES.roles.find((entry) => entry.role === name) ?? null;

// Every pair the table declares, in the order of its roles: the role read as text (or as a part
// that is not text), the ground it is read on, and which threshold measures it.
export const PAIRS = COLOR_ROLES.roles.flatMap((entry) => [
  ...(entry.on ?? []).map((ground) => ({
    foreground: entry.role,
    background: ground,
    kind: "text",
  })),
  ...(entry.against ?? []).map((ground) => ({
    foreground: entry.role,
    background: ground,
    kind: "non-text",
  })),
]);

// The mode a scope stands for, as the table names it; a scope of its own is a dark one.
export const modeOf = (scope) => COLOR_ROLES.modes[[scope].flat()[0]] ?? "dark";

// The colour roles a stylesheet declares in its light and dark blocks: each custom property whose
// value is a colour. What the floor's stylesheet declares is what the table must hold.
export function floorRoles(css) {
  const found = [];
  for (const selector of Object.keys(COLOR_ROLES.modes)) {
    const blocks = new RegExp(`(?:^|\\n)${selector.replaceAll(".", "\\.")}\\s*\\{([^}]*)\\}`, "g");
    for (const block of css.matchAll(blocks)) {
      for (const [, name, value] of block[1].matchAll(/(--[\w-]+)\s*:\s*([^;]+);/g)) {
        if (parseColor(value.trim()) && !found.includes(name)) found.push(name);
      }
    }
  }
  return found;
}

// Why the table does not hold a stylesheet: each colour role it declares and the table has no
// line for. Empty when every role stands in the table.
export function tableProblems(css) {
  return floorRoles(css)
    .filter((name) => !roleOf(name))
    .map(
      (name) =>
        `${name} is a colour role of the stylesheet and has no line in ${ROLES_FILE}: say where its value comes from and which pairs it is measured in`,
    );
}

// The owner's word for each question of the table, as the blueprint holds it.
export const wordsOf = (blueprint) => blueprint?.layers?.foundations?.roles ?? {};

// The owner's word for each question, as the answers given on the waiting list hold it: the rows
// whose item names a question of the table, with who answered and when. For a repository with no
// blueprint, which adopted its own values.
export function wordsFromListed(rows) {
  const words = {};
  for (const row of rows ?? []) {
    const id = /^decision:(.+)$/.exec(row.item ?? "")?.[1];
    const source = listedSource(id, row);
    if (source) words[id] = { source, by: row.by, on: row.on };
  }
  return words;
}

// The source an answer on the waiting list gives a question of the table, or null: a source the
// question takes, in the owner's words, or "keep": the recommended one. Keeping a recommendation
// to wait is no word yet. An answer in the owner's own words may also name a value of the choice
// the formula reads, such as a neutral family or a list of status tones: that is the formula.
export function listedSource(id, row) {
  const question = COLOR_ROLES.questions[id];
  if (!question || !row?.answer) return null;
  // A question with candidates says what it recommends itself: «keep» takes its first one.
  const first = Array.isArray(row.candidates) ? row.candidates[0]?.name : undefined;
  const kept = row.answer === "keep" && first !== undefined;
  const said = kept ? first : row.answer === "value" ? String(row.said ?? "").trim() : row.answer;
  if (question.sources.includes(said)) return said;
  if (said === "keep") return keptBefore(question, row) ? null : (question.recommended ?? null);
  return question.choice && valuesOf(question.choice, said) ? "formula" : null;
}

// The values of a choice an answer names, or null: one option, or for a choice that takes many,
// options split at commas.
const LAYER_CHOICES = JSON.parse(
  readFileSync(path.join(PLUGIN, "references/layers.json"), "utf8"),
).layers.flatMap((layer) => layer.choices ?? []);
export const choiceOf = (key) => LAYER_CHOICES.find((choice) => choice.key === key) ?? null;
function valuesOf(key, said) {
  const choice = choiceOf(key);
  if (!choice?.options) return null;
  const names = choice.many
    ? String(said)
        .split(",")
        .map((name) => name.trim())
    : [String(said)];
  return names.length > 0 && names.every((name) => name in choice.options) ? names : null;
}

// The roles that take another role's value now: those the owner said follow. Each role and the
// role it follows.
export function followsOf(words) {
  return Object.fromEntries(
    COLOR_ROLES.roles
      .filter((entry) => entry.source === "follows" && words[entry.asks]?.source === "follows")
      .map((entry) => [entry.role, entry.of]),
  );
}

// The questions a role still waits on: none for a role a formula writes or one the owner spoke to.
// A role a formula writes from a choice the owner makes in answer to a question waits on it too.
const waitsOf = (name, words) => {
  const entry = roleOf(name);
  if (!entry || !entry.asks) return [];
  return words[entry.asks] ? [] : [entry.asks];
};

// The questions of the table nobody has answered yet, each with its roles.
export function unansweredQuestions(words) {
  return Object.entries(COLOR_ROLES.questions)
    .filter(([id]) => !words[id])
    .map(([id, question]) => ({
      id,
      ...question,
      roles: COLOR_ROLES.roles.filter((entry) => entry.asks === id).map((entry) => entry.role),
    }));
}

// The owner's word for each question, in the blueprint: one line per problem.
export function wordsProblems(words) {
  if (words === null || typeof words !== "object" || Array.isArray(words)) {
    return [
      "foundations: roles is the owner's word for each question of the table of colour roles",
    ];
  }
  return Object.entries(words).flatMap(([id, word]) => {
    const question = COLOR_ROLES.questions[id];
    if (!question)
      return [
        `foundations: roles names ${id}, which is not a question of the table of colour roles`,
      ];
    const found = [];
    if (!question.sources.includes(word?.source)) {
      found.push(`foundations: roles.${id} takes ${question.sources.join(" or ")}`);
    }
    const named =
      typeof word?.by === "string" &&
      word.by.trim() !== "" &&
      /^\d{4}-\d{2}-\d{2}$/.test(word?.on ?? "");
    if (!named) {
      found.push(
        `foundations: roles.${id} is the owner's word, and the blueprint does not say who gave it and when: write by and on (YYYY-MM-DD)`,
      );
    }
    return found;
  });
}

// Every declared pair in each mode, as the stylesheet stands: its ratio, or why it cannot be read.
// `modes` is a list of { name, scope }.
export function measurePairs(styles, level, modes) {
  const thresholds = THRESHOLDS[level];
  return modes.flatMap((mode) =>
    PAIRS.map((pair) => {
      const min = pair.kind === "text" ? thresholds.text : thresholds.nonText;
      const found = [pair.foreground, pair.background].map((name) => [
        name,
        resolve(styles, mode.scope, name),
      ]);
      const blocked = found.find(([, value]) => !value?.color);
      const measured = { ...pair, mode: mode.name, scope: mode.scope, min };
      if (blocked) {
        const why = blocked[1]
          ? `${blocked[0]} is written as ${blocked[1].value}`
          : `${blocked[0]} is not declared`;
        return { ...measured, ratio: null, why };
      }
      return { ...measured, ratio: contrast(found[0][1].color, found[1][1].color) };
    }),
  );
}

// A measured pair as one sentence.
export const pairSays = (pair) =>
  `${pair.foreground} on ${pair.background} in ${pair.mode} mode is ${pair.ratio.toFixed(2)}:1, below ${pair.min}:1`;

// The questions a measured pair waits on, given the owner's word. The two pairs of the primary
// colour, the primary on its ground and the text on the primary, wait on nothing: the guide writes
// them to reach the threshold, and in a repository that adopted its values the primary is the
// repository's own, which no answer of the table speaks for. Below the threshold they are a fault,
// as they were before the table. Every other pair waits on the questions of its roles.
export const pairWaits = (pair, words) => {
  if (pair.kind === "text" && PRIMARY_TEXT.includes(pair.foreground)) return [];
  return [...new Set([...waitsOf(pair.foreground, words), ...waitsOf(pair.background, words)])];
};
const PRIMARY_TEXT = ["--primary", "--primary-foreground"];

// Whether an answer on the waiting list keeps a recommendation to wait: the owner's word is to
// wait, and nothing is asked again until the choice that answers it comes.
export const keepsWaiting = (question, row) =>
  row?.answer === "keep" &&
  !Array.isArray(row?.candidates) &&
  (!COLOR_ROLES.questions[question]?.recommended ||
    keptBefore(COLOR_ROLES.questions[question], row));

// Whether the owner kept waiting for a choice that this version brings: the question now takes a
// choice, so it is asked again.
export const waitedForChoice = (question, row) =>
  keepsWaiting(question, row) && Boolean(COLOR_ROLES.questions[question]?.choice);

// Whether an answer «keep» kept a recommendation the question no longer gives: it was asked
// before the day the recommendation changed, or says no day. A question asked then was to wait.
const keptBefore = (question, row) =>
  Boolean(question?.recommended_since) &&
  !(typeof row?.asked_on === "string" && row.asked_on >= question.recommended_since);

// The checks of the gate for the pairs measured: one per pair that can be read. A pair below its
// threshold whose roles still wait on the owner is checked with `waits`: the gate names it with
// its ratio and does not fail on it, until the owner answers and the guide runs again.
// A pair that waits is held to the ratio it was measured at when it began to wait (`measured`,
// to the hundredth the gate says): it may get no worse while the owner has not
// answered. `before` is the checks the gate held until now: a pair that already waited on the same
// question keeps the ratio it began at, so running the guide again never takes a worse number as
// the new start.
export function pairChecks(measured, words, before = []) {
  return measured
    .filter((pair) => pair.ratio !== null)
    .map((pair) => {
      const waits = pair.ratio < pair.min ? pairWaits(pair, words).join(", ") : "";
      // The same pair that waited before on a question it still waits on keeps its ratio, even
      // when another of its questions has been answered since.
      const still = (check) =>
        String(check.waits ?? "")
          .split(", ")
          .some((question) => waits.split(", ").includes(question));
      const held = before.find(
        (check) =>
          check.kind === "contrast" &&
          waits !== "" &&
          still(check) &&
          check.foreground === pair.foreground &&
          check.background === pair.background &&
          JSON.stringify(check.scope) === JSON.stringify(pair.scope) &&
          typeof check.measured === "number",
      );
      return {
        kind: "contrast",
        scope: pair.scope,
        foreground: pair.foreground,
        background: pair.background,
        min: pair.min,
        ...(waits ? { waits, measured: held?.measured ?? Number(pair.ratio.toFixed(2)) } : {}),
      };
    });
}

// Where a role's value comes from, in words, with the owner's word where the table asks one.
// `answered` is the blueprint's record of who gave a choice of the foundations and when: a role
// a formula writes from the source colour names it where the blueprint has it.
export function sourceWords(entry, words, choice = null, answered = null) {
  const word = entry.asks ? words?.[entry.asks] : null;
  const said = word ? `, the owner's word (${entry.asks}, ${word.by} on ${word.on})` : "";
  const named = entry.choice?.replace("_", " ");
  if (entry.source === "formula" && !entry.asks) {
    const given = answered?.[entry.choice];
    const owner = given ? `, the owner's word (${given.by} on ${given.on})` : "";
    return `the formula ${entry.formula}, from the owner's ${named}${owner}`;
  }
  if (entry.source === "formula") {
    // A role the floor does not have is written only where the owner chose its tone.
    if (entry.floor === false && (!word || word.source === "floor")) {
      return `not written: the floor has no such role, and it is written once the owner chooses the ${entry.tone} tone (${entry.asks})`;
    }
    if (word?.source === "floor") return `kept from the floor${said}`;
    if (!word) {
      return words === null
        ? `the formula ${entry.formula}, from the owner's ${named}, once the owner answers (${entry.asks})`
        : `kept from the floor until the owner answers ${entry.asks}, then the formula ${entry.formula}`;
    }
    const value = choice?.[entry.choice];
    if (entry.tone && Array.isArray(value) && !value.includes(entry.tone)) {
      return `not written: the owner did not choose the ${entry.tone} tone (${entry.asks}, ${word.by} on ${word.on})`;
    }
    const shown = Array.isArray(value) ? value.join(", ") : value;
    return `the formula ${entry.formula}, from the owner's ${named}${shown ? ` (${shown})` : ""}${said}`;
  }
  if (entry.source === "follows") {
    if (word?.source === "floor") return `kept from the floor${said}`;
    if (word) return `follows ${entry.of}${said}`;
    return words === null
      ? `follows ${entry.of}, once the owner says so (${entry.asks})`
      : `follows ${entry.of} once the owner says so; kept from the floor until then (${entry.asks})`;
  }
  if (word) return `kept from the floor${said}`;
  return words === null
    ? `kept from the floor, by the owner's word (${entry.asks})`
    : `kept from the floor, waiting on the owner (${entry.asks})`;
}

// The pairs a role is measured in, in words.
function pairWords(entry) {
  const parts = [];
  if (entry.on?.length) parts.push(`text on ${entry.on.join(", ")}`);
  if (entry.against?.length)
    parts.push(`a part that is not text against ${entry.against.join(", ")}`);
  const under = PAIRS.filter((pair) => pair.background === entry.role).map((p) => p.foreground);
  if (under.length > 0) parts.push(`ground of ${under.join(", ")}`);
  if (parts.length === 0) return `Not measured: ${entry.unmeasured}`;
  return `Measured: ${parts.join("; ")}`;
}

// The table as words, one line per role: its source and its pairs. `words` is a repository's
// owner's word for each question, or null for the table alone.
// `choice` is the foundations' choices, for the values a formula reads.
export function rolesLines(words = null, choice = null, answered = null) {
  return COLOR_ROLES.roles.map(
    (entry) =>
      `${entry.role}: ${sourceWords(entry, words, choice, answered)}. ${pairWords(entry)}.`,
  );
}

// The sentences of the rules page: where each role's value comes from in this repository. Roles
// whose source reads the same, such as those kept from the floor under one question, share one
// sentence; a role that follows or comes from a formula has its own.
export function roleSentences(words, choice = null) {
  const groups = new Map();
  for (const entry of COLOR_ROLES.roles) {
    const said = sourceWords(entry, words, choice);
    if (said.startsWith("not written")) continue;
    const own = said.startsWith("follows") || (said.startsWith("the formula") && !entry.asks);
    const key = own ? entry.role : said;
    groups.set(key, { said, roles: [...(groups.get(key)?.roles ?? []), entry.role] });
  }
  return [...groups.values()].map(({ said, roles }) => {
    const named =
      roles.length === 1 ? roles[0] : `${roles.slice(0, -1).join(", ")} and ${roles.at(-1)}`;
    if (said.startsWith("follows")) return `${named} ${said}`;
    if (said.startsWith("the formula")) {
      return `${named} ${roles.length === 1 ? "comes" : "come"} from ${said}`;
    }
    return `${named} ${roles.length === 1 ? "is" : "are"} ${said}`;
  });
}
