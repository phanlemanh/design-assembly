// The harvest of a review (specification 0009, slice 2): an eye's findings read in one fixed shape,
// and every finding, measured or seen, put in one of three groups by what it rests on.
// - A row of the decisions ledger that a check holds, or a line of the rules page the gate holds:
//   the check let it through, and the line for the ledger of escapes is given.
// - A line of the rules page no check holds, a principle the owner fixed, or a row no check holds:
//   a question for the owner, given as the very call of the decision sheet that asks it.
// - Nothing: it is for a person's eye, and no question is asked.
// Nothing here writes. The questions are made by the code of the decision sheet itself, in memory;
// the review command writes them only when it is told to.
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { newerLedgers } from "../templates/tools/design-assembly/contract.mjs";
import { SLIPS_FILE } from "../templates/tools/design-assembly/governance.mjs";
import { LEDGER } from "../templates/tools/design-assembly/ledger.mjs";
import { RULES_PAGE, UNHELD_SECTION } from "./apply.mjs";
import { readCapabilities } from "./capabilities.mjs";
import { Refusal } from "./command.mjs";
import { askedIdOf, askedIn, askOf, readState } from "./decide.mjs";

const PLUGIN = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
export const FINDINGS_FILE = "review-findings.json";
export const FINDINGS_VERSION = 1;
// The design review socket, whose plugs from outside that are skills are its eyes.
const SOCKET = "design-review";
// What a finding of the default plug says it was found by.
export const MEASURE = "review";
export const GROUPS = ["escape", "question", "person"];
const SEVERITY_OF_AN_EYE = ["high", "medium", "low"];
// The order findings stand in: the heaviest first.
const ORDER = ["high", "medium", "low", "note"];
const KINDS = ["ledger-row", "rule-line", "principle", "nothing"];
const FILE_KEYS = ["version", "screen", "eye", "findings"];
const FINDING_KEYS = ["picture", "severity", "saw", "fix", "place", "rests_on"];
const REST_KEYS = {
  "ledger-row": ["kind", "ledger", "id"],
  "rule-line": ["kind", "file", "line"],
  principle: ["kind", "id"],
  nothing: ["kind", "note"],
};

const list = (value) => (Array.isArray(value) ? value : []);
const isObject = (value) => value !== null && typeof value === "object" && !Array.isArray(value);
const words = (value) => typeof value === "string" && value.trim() !== "";
const oneLine = (text) => String(text).replace(/\s+/g, " ").trim();

// The eyes of the design review socket: each plug from outside the socket board names for it that
// is a skill, with the names a session lists it under. Read from the board, never written here.
export function eyesOf({ plugs } = readCapabilities()) {
  return plugs
    .filter((plug) => list(plug.sockets).includes(SOCKET) && plug.kind === "skill")
    .map((plug) => ({ id: plug.id, names: [...list(plug.names)] }));
}

// ---- the contract --------------------------------------------------------------------------------

// What one finding rests on, made whole from what the repository holds, or why it cannot be.
function restOf(on, facts) {
  if (!isObject(on)) return { problem: "has no rests_on" };
  if (!KINDS.includes(on.kind)) {
    return {
      problem: `its rests_on is one of ${KINDS.join(", ")}, and says ${JSON.stringify(on.kind)}`,
    };
  }
  const unknown = Object.keys(on).filter((key) => !REST_KEYS[on.kind].includes(key));
  if (unknown.length > 0) {
    return {
      problem: `its rests_on has unknown key ${unknown.map((key) => `'${key}'`).join(", ")}`,
    };
  }
  if (on.kind === "ledger-row") {
    if (on.ledger !== undefined && on.ledger !== LEDGER) {
      return { problem: `rests_on: a row it rests on is a row of ${LEDGER}` };
    }
    const row = facts.decisions.find((candidate) => String(candidate.id) === String(on.id));
    if (!row) return { problem: `rests_on: ${on.id} is not a row of ${LEDGER}` };
    return {
      rest: {
        kind: on.kind,
        ledger: LEDGER,
        id: String(row.id),
        check: row.check ?? null,
        layer: row.layer ?? null,
      },
    };
  }
  if (on.kind === "rule-line") {
    if (on.file !== undefined && on.file !== RULES_PAGE) {
      return { problem: `rests_on: a line it rests on is a line of ${RULES_PAGE}` };
    }
    const line = facts.rules.lines.find((candidate) => candidate.line === on.line);
    if (!line) {
      return {
        problem: `rests_on: line ${on.line} of ${RULES_PAGE} is not a rule the pack lists for this screen`,
      };
    }
    return {
      rest: {
        kind: on.kind,
        file: RULES_PAGE,
        line: line.line,
        section: line.section,
        text: line.text,
        held: line.section !== UNHELD_SECTION,
      },
    };
  }
  if (on.kind === "principle") {
    const principle = facts.principles.find((candidate) => candidate.id === on.id);
    if (principle) return { rest: { kind: on.kind, ...principle } };
    if (facts.unfixed_principles.includes(on.id)) {
      return {
        problem: `rests_on: ${on.id} is in the blueprint but not fixed by the owner, so it settles nothing`,
      };
    }
    return { problem: `rests_on: ${on.id} is not a principle the owner fixed` };
  }
  if (on.note !== undefined && !words(on.note)) {
    return { problem: "its rests_on note is empty" };
  }
  return {
    rest: {
      kind: "nothing",
      note: words(on.note)
        ? oneLine(on.note)
        : "the eye named nothing of the repository it rests on",
    },
  };
}

const PLACE = ["x", "y", "width", "height"];
const placeProblem = (place) =>
  isObject(place) &&
  Object.keys(place).every((key) => PLACE.includes(key)) &&
  PLACE.every((key) => Number.isFinite(place[key]) && place[key] >= 0)
    ? null
    : "its place is not x, y, width and height in pixels of the page";

// Every way one finding cannot be harvested, and the finding as it is read where it can.
function findingOf(finding, facts) {
  if (!isObject(finding)) return { problems: ["is not an object"] };
  const problems = Object.keys(finding)
    .filter((key) => !FINDING_KEYS.includes(key))
    .map((key) => `unknown key '${key}'`);
  if (!words(finding.picture)) problems.push("names no picture");
  if (finding.severity === undefined || finding.severity === null) problems.push("has no severity");
  else if (!SEVERITY_OF_AN_EYE.includes(finding.severity)) {
    problems.push(
      `its severity ${JSON.stringify(finding.severity)} is not one of ${SEVERITY_OF_AN_EYE.join(", ")}`,
    );
  }
  if (!words(finding.saw)) problems.push("does not say what the eye saw");
  if (finding.fix !== undefined && !words(finding.fix)) problems.push("its fix is empty");
  if (finding.place !== undefined && placeProblem(finding.place)) {
    problems.push(placeProblem(finding.place));
  }
  const { rest, problem } = restOf(finding.rests_on, facts);
  if (problem) problems.push(problem);
  if (problems.length > 0) return { problems };
  return {
    problems: [],
    read: {
      picture: finding.picture,
      severity: finding.severity,
      saw: oneLine(finding.saw),
      ...(finding.fix !== undefined ? { fix: oneLine(finding.fix) } : {}),
      ...(finding.place !== undefined ? { place: finding.place } : {}),
      rests_on: rest,
    },
  };
}

// The findings file an eye wrote, read against what the repository holds for this screen. Refused,
// with every finding that lacks something named and what it lacks, when one cannot be harvested.
export function readFindings(text, facts, { eyes = eyesOf(), file = FINDINGS_FILE } = {}) {
  const refused = (why) => new Refusal(`${file}: ${why}`);
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    throw refused("it is not JSON");
  }
  if (!isObject(data)) throw refused("it is not an object that holds findings");
  const names = eyes.flatMap((eye) => eye.names);
  const whole = Object.keys(data)
    .filter((key) => !FILE_KEYS.includes(key))
    .map((key) => `unknown key '${key}'`);
  if (data.version !== FINDINGS_VERSION) {
    whole.push(
      `it is written in version ${FINDINGS_VERSION}, and says ${JSON.stringify(data.version)}`,
    );
  }
  if (data.screen !== facts.screen.id) {
    whole.push(`its findings are of the screen ${data.screen}, not ${facts.screen.id}`);
  }
  if (!names.includes(data.eye)) {
    whole.push(
      `${data.eye} is not an eye the socket board names for the design review socket (${names.join(", ") || "it names none"})`,
    );
  }
  if (!Array.isArray(data.findings)) whole.push("it has no list of findings");
  if (whole.length > 0) throw refused(whole.join("; "));
  const read = data.findings.map((finding) => findingOf(finding, facts));
  const problems = read
    .map((item, index) => [index, item.problems])
    .filter(([, found]) => found.length > 0)
    .map(([index, found]) => `finding ${index + 1}: ${found.join(", ")}`);
  if (problems.length > 0) {
    throw refused(`${problems.join("; ")}. Nothing was harvested`);
  }
  return { eye: data.eye, findings: read.map((item) => item.read) };
}

// The findings that name a picture this review did not draw, one line each.
// The findings that name a picture this review did not draw, or a place that lies outside the
// page of their picture, one line each. Both are known only once the pictures are drawn.
export function pictureProblems(read, shots) {
  return read.findings.flatMap((finding, index) => {
    const at = `finding ${index + 1}`;
    const shot = shots.find((candidate) => candidate.id === finding.picture);
    if (!shot) return [`${at}: ${finding.picture} is not a picture this review drew`];
    const { place } = finding;
    const page = shot.page;
    if (!place || !page) return [];
    const inside = place.x + place.width <= page.width && place.y + place.height <= page.height;
    return inside
      ? []
      : [
          `${at}: its place (${place.x}, ${place.y}, ${place.width} × ${place.height}) lies outside ${finding.picture}, which is ${page.width} × ${page.height} pixels`,
        ];
  });
}

// An eye's findings in the shape of the findings the machine measures. One the eye placed nowhere
// is noted on its whole picture.
export function seenFindings(read, shots) {
  return read.findings.map((finding) => {
    const { page } = shots.find((shot) => shot.id === finding.picture);
    return {
      by: read.eye,
      kind: "seen",
      severity: finding.severity,
      where: { path: null, text: finding.saw },
      picture: finding.picture,
      position: finding.place ?? { x: 0, y: 0, width: page.width, height: page.height },
      measured: null,
      seen_in: [finding.picture],
      places: 1,
      fix: finding.fix ?? "The eye gave no fix: how to change the screen is for a person to say.",
      rests_on: finding.rests_on,
    };
  });
}

// The findings of the machine and of an eye as one list, the heaviest first, numbered once. Among
// equals the machine's stand first, each list in its own order.
export function mergeFindings(measured, seen = []) {
  const all = [...measured.map((finding) => ({ ...finding, by: finding.by ?? MEASURE })), ...seen];
  return ORDER.flatMap((severity) => all.filter((finding) => finding.severity === severity)).map(
    (finding, index) => {
      const rest = Object.fromEntries(Object.entries(finding).filter(([key]) => key !== "number"));
      return { number: index + 1, ...rest };
    },
  );
}

// ---- the harvest ---------------------------------------------------------------------------------

// What a finding says in a few words, whoever found it.
const SAID = {
  contrast: ({ where, measured }) =>
    `«${where.text}» reaches ${measured.ratio}:1 where ${measured.needed}:1 is asked`,
  "broken-word": ({ where }) => `the word «${where.text}» is broken in its middle`,
  "cut-off": ({ where }) => `«${where.text}» is cut off by its box`,
  seen: ({ where }) => where.text,
};
export const saidOf = (finding) => (SAID[finding.kind] ?? SAID.seen)(finding);
export const finderOf = (finding) =>
  finding.by === MEASURE ? "the review's own measure" : `the eye ${finding.by}`;

// A cell of a line of the ledger of escapes: one line, and no bar that would split it.
const cell = (text) => oneLine(text).replace(/\|/g, "\\|");
const slipLine = (cells) => `| ${cells.map(cell).join(" | ")} |`;
const quote = (text) => `'${String(text).replace(/'/g, "'\\''")}'`;

// What a finding no check holds rests on, in words for the owner.
function basisOf(on) {
  if (on.kind === "ledger-row") return `the row ${on.id} of ${LEDGER}, which no check holds`;
  if (on.kind === "rule-line") {
    return `line ${on.line} of ${RULES_PAGE} («${on.text}»), which no check holds`;
  }
  return `the principle ${on.id} the owner fixed («${on.statement}»), which no check holds`;
}

// A finding a check let through: what the line of the ledger of escapes says (`slip`, the same on
// any day), and the line itself, dated `day`, the day the review ran, to be pasted that day.
function escapeOf(finding, screen, on, day) {
  const what = `On the screen ${screen.id} (${screen.route}): ${saidOf(finding)}; found by ${finderOf(finding)} on the picture ${finding.picture}`;
  const held =
    on.kind === "ledger-row"
      ? {
          layer: on.layer,
          done: `Not fixed yet: the check ${on.check} of the row ${on.id} let it through`,
          why: `the row ${on.id} of ${LEDGER} has a check, ${on.check}, and it let this through`,
        }
      : {
          layer: null,
          done: `Not fixed yet: the gate holds line ${on.line} of ${RULES_PAGE} and let it through`,
          why: `the gate holds line ${on.line} of ${RULES_PAGE}, under «${on.section}», and let this through; the rules page names no layer, so whoever adds the line writes the layer that should have caught it`,
        };
  return {
    group: "escape",
    file: SLIPS_FILE,
    layer: held.layer,
    slip: { what, layer: held.layer, done: held.done },
    day,
    line: slipLine([day, what, held.layer ?? "", held.done]),
    why: held.why,
  };
}

function questionOf(finding, screen, on, target, plugin) {
  const basis = basisOf(on);
  const ask = {
    question: `On the screen ${screen.id}, ${finderOf(finding)} saw: ${saidOf(finding)}. Should a rule of this repository hold it, or is it left?`,
    recommendation:
      "Leave the rules as they are: fix this screen as the finding says, and make it a rule only once a second screen needs it.",
    basis: `It rests on ${basis}. One review saw it on one screen, and a row of ${LEDGER} is for a rule a second screen must follow.`,
    hard_to_undo: false,
    ...(on.kind === "ledger-row" ? { item: `decision:${on.id}` } : {}),
  };
  const call = [
    "node",
    quote(path.join(plugin, "scripts/decide.mjs")),
    "--target",
    quote(target),
    "--ask",
    quote(ask.question),
    "--recommend",
    quote(ask.recommendation),
    "--because",
    quote(ask.basis),
    "--easy-to-undo",
    ...(ask.item ? ["--item", quote(ask.item)] : []),
  ].join(" ");
  return { group: "question", ask, call, queued: null };
}

// What becomes of each finding, one entry for each, in the order of the findings. `on` is the day
// a line for the ledger of escapes is dated with. The machine never makes a finding a rule: it gives
// the line to add or the question to ask, and writes neither.
export function harvestOf(findings, facts, { target, on: day, plugin = PLUGIN }) {
  return findings.map((finding) => {
    const at = { finding: finding.number };
    const rest = finding.rests_on;
    if (rest.kind === "nothing") {
      return {
        ...at,
        group: "person",
        why: `it rests on nothing this repository has decided (${rest.note}): it is for a person's eye, and no question is asked until someone takes it up`,
      };
    }
    // A row the machine measured against names no layer: the ledger has it.
    const on =
      rest.kind === "ledger-row" && rest.layer === undefined
        ? {
            ...rest,
            layer: facts.decisions.find((row) => String(row.id) === rest.id)?.layer ?? null,
          }
        : rest;
    const held =
      (on.kind === "ledger-row" && Boolean(on.check)) || (on.kind === "rule-line" && on.held);
    return held
      ? { ...at, ...escapeOf(finding, facts.screen, on, day) }
      : { ...at, ...questionOf(finding, facts.screen, on, target, plugin) };
  });
}

// Where a question of the harvest stands on the waiting list already: it waits, or the owner
// answered it; null where it is not there.
function standing(state, ask) {
  const before = askedIn(state, { id: askedIdOf(ask), item: ask.item });
  if (!before) return null;
  return before.answer ? { answered: before.id, answer: before.answer } : { waits: before.id };
}

// The harvest with each question that is on the waiting list already told so, read and nothing
// written: a call that would only be refused as asked before is not offered. A waiting list that
// cannot be read changes nothing here; asking is where it is refused.
export function listedOf(target, harvest) {
  let state;
  try {
    state = readState(target);
  } catch {
    return harvest;
  }
  return harvest.map((entry) => {
    const known = entry.group === "question" ? standing(state, entry.ask) : null;
    return known ? { ...entry, queued: known } : entry;
  });
}

// The questions of a harvest as new files of the waiting list, made by the decision sheet's own
// code and held in memory: each file, and each question told where it went. A question already on
// the list, asked by an earlier review or answered since, is not asked again. Refused as a whole,
// and nothing written, where one question cannot be asked, or where its file is there already and
// the list does not read it: the review makes new files and never writes over one.
export function queueOf(target, harvest, { on } = {}) {
  const newer = newerLedgers(target);
  if (newer.length > 0) throw new Refusal(`${newer.join("; ")}. Nothing was written`);
  let state = readState(target);
  const files = {};
  const queued = harvest.map((entry) => {
    if (entry.group !== "question") return entry;
    const known = standing(state, entry.ask);
    if (known) return { ...entry, queued: known };
    const { question, recommendation, basis, item } = entry.ask;
    const asked = askOf(target, state, {
      question,
      recommend: recommendation,
      because: basis,
      hard: false,
      easy: true,
      item,
      on,
    });
    if (existsSync(path.join(target, asked.file))) {
      throw new Refusal(
        `${asked.file} is there already, and the waiting list does not read it as a question: the review writes no file over another. Nothing was written`,
      );
    }
    state = asked.state;
    files[asked.file] = asked.content;
    return { ...entry, queued: { id: asked.asked.id, file: asked.file } };
  });
  return { files, harvest: queued };
}
