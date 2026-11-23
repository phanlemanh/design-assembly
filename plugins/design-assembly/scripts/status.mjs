// The status: what the owner of a repository asks at any moment. Which tier the repository has
// reached, one line per rhythm of its life, what waits on the owner with a recommendation for each,
// whether the repository's copy of the tool is the installed plugin's, and the command to run next.
// Read-only: it writes nothing in the repository. The same repository always gives the same answer.
// With --out it also hands the answer over as a document, the status report, written to that
// folder and nowhere else.
// Usage: node status.mjs [--target DIR] [--json] [--out DIR [--format html|pdf]]
// Exit: 0 nothing waits; 1 something waits on a person, the tool differs, or a decision is failing
// or gone around, or the document was written in fewer formats than asked; 2 a wrong call, or a
// repository that cannot be read.
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { stdout } from "node:process";
import { fileURLToPath } from "node:url";

import { BORN, LEDGERS, missingAtBirth } from "../templates/tools/design-assembly/contract.mjs";
import { SLIPS_FILE } from "../templates/tools/design-assembly/governance.mjs";
import { readLedger } from "../templates/tools/design-assembly/ledger.mjs";
import { pinnedPackage } from "../templates/tools/design-assembly/adapters/lockfile.mjs";
import { readFontSources } from "../templates/tools/design-assembly/sources-ledger.mjs";
import { readWaiting } from "../templates/tools/design-assembly/waiting.mjs";
import {
  darkScopes,
  DEFAULT_STYLESHEET,
  findStylesheet,
  loadStyles,
  resolve,
} from "../templates/tools/design-assembly/styles.mjs";
import {
  COLOR_ROLES,
  measurePairs,
  pairSays,
  pairWaits,
  PAIRS,
  rolesLines,
  unansweredQuestions,
  keepsWaiting,
  listedSource,
  waitedForChoice,
  wordsFromListed,
  wordsOf,
} from "./color-roles.mjs";
import { finish, readCall, refuse, start } from "./command.mjs";
import { heldLines, heldRoles } from "./roles-held.mjs";
import { principleCall } from "./principles.mjs";
import { sheet, WAITING_FOLDER, WAITING_LIST } from "./decide.mjs";
import { DOCUMENT_FLAGS, handOver, plural, requested } from "./document.mjs";
import { audit, AUDIT, DECIDE, PERSON_CALLS, UNCONFIRMED } from "./audit.mjs";
import { socketsOf } from "./capabilities.mjs";
import { gateProblem, seenMissing } from "./apply.mjs";
import {
  SEEN_DECISION,
  SEEN_TEST,
} from "../templates/tools/design-assembly/screen-actions-seen.mjs";

// Where the browser test by role comes from, in this plugin.
const SEEN_TEMPLATE = "templates/owned/screen-actions-seen.spec.ts.template";
import {
  installedTree,
  readStamp,
  releaseOf,
  STAMP,
  TOOL_COPY,
  treeHash,
  VERSION,
} from "./stamp.mjs";

export { STAMP, treeHash };

const PLUGIN = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const json = (file) => JSON.parse(readFileSync(path.join(PLUGIN, file), "utf8"));
const LIMITS = json("references/limits.json").limits;
// Named from the plugin's own folder: installed elsewhere, the plugin has no `plugins/` around it.
const LIMITS_FILE = "references/limits.json of this plugin";
const UPGRADE = "/design-assembly:upgrade";
const STARTER = "/design-assembly:adopt --starter";

// How many waiting answers a person is shown in full. The rest are named, and --json has them all.
const SHOWN = 5;
const MEASURED = "a measurement on this repository: ";
const PRINCIPLED = "a design principle the owner fixed: ";
// A basis as status writes it, from the kind and the text a recommendation of the guide gives.
const PREFIXES = { measurement: MEASURED, principle: PRINCIPLED, standard: "a standard: " };
const written = (basis) => `${PREFIXES[basis.kind]}${basis.text}`;

// The repository's copy of the tool against the installed plugin's. Content decides, not the
// version number: two folders with the same tree are the same tool. The stamp says where the copy
// came from; without one, a copy that is exactly the tool of a recorded release is named by it.
function toolOf(root) {
  const recorded = readStamp(root);
  const installed = { version: VERSION, tree: installedTree() };
  const copy = treeHash(path.join(root, TOOL_COPY));
  const known = recorded ? null : releaseOf(copy);
  const noStamp = known
    ? `no stamp: by its content it is the tool of version ${known}`
    : "no stamp: the repository does not record which version it took";
  let says;
  if (copy === null) {
    says = recorded
      ? `the repository has a stamp for version ${recorded.version} and no copy of the tool`
      : "the repository has no copy of the tool, so there is nothing to compare (no stamp)";
  } else if (recorded && recorded.tree !== copy) {
    says = `the repository's copy was changed after it was stamped as version ${recorded.version}`;
  } else if (copy !== installed.tree) {
    says = recorded
      ? `the repository's copy is stamped as version ${recorded.version}; the installed plugin is version ${installed.version}, and its tool is another`
      : `the repository's copy differs from the installed plugin's, version ${installed.version} (${noStamp}${known ? "" : ", so it cannot be said where the copy came from or whether it was changed here"})`;
  } else {
    says = recorded
      ? `the repository's copy is the installed plugin's, version ${installed.version}, as stamped`
      : `the repository's copy is the installed plugin's, version ${installed.version} (${noStamp})`;
  }
  const differs =
    copy === null
      ? recorded !== null
      : copy !== installed.tree || (recorded?.tree ?? copy) !== copy;
  return { recorded, installed, copy, differs, says };
}

// The standard decisions, for the question a later choice asks.
const STANDARD = json("references/standard-decisions.json").decisions;
// The row the typeface choice writes, and the item a question about it names on the waiting list.
const TYPEFACE = "typeface";

// The rows of the waiting list, or none: a waiting list that cannot be read is the decision
// sheet's to report.
function listedRows(root, rows) {
  try {
    return (
      readWaiting(
        root,
        rows.map((row) => String(row.id)),
      )?.rows ?? []
    );
  } catch {
    return [];
  }
}

// The id of the question that asks the licence of a font of the sources ledger, here and on the
// waiting list.
export const licenceAskId = (font) => `font-licence-${font.id}`;

// The licence of each font row a command wrote and no person finished: the row has its pin and no
// licence, so it is not held and the font cannot be chosen. No tool writes a licence; the question
// waits here until a person does. A question of the same id that waits on the waiting list is the
// list's to show; one the owner answered there still waits here, until the answer is in the row.
export function fontLicenceAsks(root, rows, audited) {
  const fonts = readFontSources(root).filter((font) => font.waits);
  if (fonts.length === 0) return [];
  const listed = listedRows(root, rows);
  const answer = audited.values === "generated" ? "/design-assembly:new" : "/design-assembly:adopt";
  return fonts.flatMap((font) => {
    const asked = listed.findLast((row) => row.id === licenceAskId(font));
    if (asked && !asked.answer) return [];
    const stated = font.pin?.package ? pinnedPackage(root, font.pin.package).license : null;
    const written = `${font.file} was written by ${font.proposed.by} on ${font.proposed.on} from ${font.from}, and has no licence, so the row is not held and the font cannot be chosen`;
    return [
      {
        id: licenceAskId(font),
        source: "sources",
        question: `Which licence is the font ${font.title} used under?`,
        recommendation: asked
          ? `Write the owner's answer into licence of ${font.file}, in their words: the decision sheet recorded it and changed no row of the sources ledger.`
          : `Write the licence the font is used under into licence of ${font.file}, in the owner's words: no tool writes one.${stated ? ` The lockfile says its package states ${stated}: read it first.` : ""}`,
        basis: asked
          ? `${MEASURED}the owner answered ${asked.id} of the waiting list by ${asked.by} on ${asked.on}, and ${font.file} still has no licence`
          : `${MEASURED}${written}`,
        answer,
      },
    ];
  });
}

// The typeface, asked of a repository the guide wrote before the choice existed: its ledger has no
// row for it, and no question of the waiting list asks it. Its stylesheet keeps the floor's
// typeface until the owner answers in the guide. An answer given on the waiting list waits too,
// until the guide writes it. Null when nothing waits. A repository that adopted
// its values is not asked here: reading its own typeface comes with the sources ledger.
export function typefaceAsk(root, rows, audited) {
  if (audited.values !== "generated" || rows.length === 0) return null;
  if (rows.some((row) => String(row.id) === TYPEFACE)) return null;
  const asked = listedRows(root, rows).findLast((row) => row.item === `decision:${TYPEFACE}`);
  // A question that waits is the waiting list's to show. One the owner answered reaches no blueprint
  // by itself: it waits again, here, for the guide to write it.
  if (asked && !asked.answer) return null;
  if (asked) {
    return {
      id: TYPEFACE,
      source: "ledger",
      question: STANDARD.find((decision) => decision.id === TYPEFACE).question,
      recommendation:
        "Run the guide and write the owner's answer into the blueprint, with their name and the day: the decision sheet recorded it and changed no file the guide writes from.",
      basis: `${MEASURED}the owner answered ${asked.id} of the waiting list by ${asked.by} on ${asked.on}, and the ledger still has no row for the typeface`,
      answer: "/design-assembly:new",
    };
  }
  return {
    id: TYPEFACE,
    source: "ledger",
    question: STANDARD.find((decision) => decision.id === TYPEFACE).question,
    recommendation:
      "Keep the floor's font for running text and for headings: answer it in the guide, on the sheet that draws each typeface on this repository's screen.",
    basis: `${MEASURED}the ledger has no row for the typeface, so the stylesheet keeps the floor's declarations, and the floor's font is the one the repository already loads`,
    answer: "/design-assembly:new",
  };
}

// The owner's word for each question of the table of colour roles: the blueprint's, where the guide
// wrote the values; for a repository that adopted its own, the answers given on the waiting list,
// with who gave them and when.
function roleWordsOf(root, rows, guided) {
  return guided ? wordsOf(readBlueprint(root)) : wordsFromListed(listedRows(root, rows));
}

// The modes a repository's pairs are read in: light, and its dark selectors where it has them.
function modesOf(styles) {
  const scopes = darkScopes(styles);
  const dark =
    scopes.length === 0 ? [] : [{ name: "dark", scope: scopes.length === 1 ? scopes[0] : scopes }];
  return [{ name: "light", scope: ":root" }, ...dark];
}

// What a question of the table rests on, measured here now: each pair below its threshold that
// waits on it, and for roles that would follow, what they are and what they would follow.
// The declared pairs below the threshold here that wait on a question.
function belowFor(styles, level, question, words) {
  if (!styles || !level) return [];
  return measurePairs(styles, level, modesOf(styles)).filter(
    (pair) =>
      pair.ratio !== null && pair.ratio < pair.min && pairWaits(pair, words).includes(question.id),
  );
}

function roleBasis(styles, level, question, words) {
  const said = belowFor(styles, level, question, words).map(pairSays);
  for (const entry of COLOR_ROLES.roles.filter((item) => item.asks === question.id && item.of)) {
    for (const mode of styles ? modesOf(styles) : []) {
      const own = resolveRole(styles, mode.scope, entry.role);
      const of = resolveRole(styles, mode.scope, entry.of);
      if (own && of && own !== of) {
        said.push(`${entry.role} is ${own} in ${mode.name} mode, where ${entry.of} is ${of}`);
      }
    }
  }
  const pairs = PAIRS.filter(
    (pair) => question.roles.includes(pair.foreground) || question.roles.includes(pair.background),
  ).length;
  return `${MEASURED}${question.roles.length} role(s) of ${ROLES_TABLE} wait on this answer, in ${pairs} declared pair(s)${said.length > 0 ? `; ${said.join("; ")}` : "; every pair of them that can be read reaches its threshold"}`;
}
const ROLES_TABLE = "the table of colour roles";
const resolveRole = (styles, scope, name) => resolve(styles, scope, name)?.value ?? null;

// What the machine recommends for a question of the table, from the table itself and from how
// many of its pairs are below the threshold here.
function roleRecommendation(question, below, guided) {
  if (question.recommended === "formula") {
    const value = [question.recommended_value].flat().join(", ");
    const what =
      question.choice === "neutral_family"
        ? `Let the neutral family's formula write them, in ${value === "grey" ? "pure grey" : value}`
        : `Let the status tone formula write them, with the ${value} tone${value.includes(",") ? "s" : ""} alone to start`;
    if (!guided) {
      return `${what}: the formula writes them only where the guide writes this repository's values, so here wait for that, or keep them from the floor${below > 0 ? `, where ${below} of their pairs below the threshold become checks and turn the gate red` : ""}. ${question.why}`;
    }
    return `${what}: answer it in the guide, on the sheet that draws each value on this repository's screen. ${question.why}`;
  }
  if (question.recommended === "follows") {
    return `Let them follow the primary colour: the guide then writes them from the source colour in both modes. ${question.why}`;
  }
  if (question.later) {
    return below > 0
      ? `Do not keep them yet: wait for ${question.later}. Kept from the floor now, ${below} of their pairs below the threshold become checks and turn the gate red.`
      : `Wait for ${question.later}; keeping them from the floor now changes nothing on the screen and turns no check red.`;
  }
  return `Keep them from the floor. ${question.why ?? ""}`.trim();
}

// The questions of the table of colour roles no word answers yet, asked of a repository whose
// contrast row this plugin holds. A question that waits on the waiting list is the list's to
// show; one the owner answered there reaches a guided repository's blueprint only through the
// guide, and waits here until then.
export function colorRoleAsks(root, rows, audited) {
  if (rows.length === 0 || !rows.some((row) => String(row.id) === "color-contrast")) return [];
  let theme;
  try {
    theme = JSON.parse(readFileSync(path.join(root, "design/theme.json"), "utf8"));
  } catch {
    return [];
  }
  if (!theme?.checks?.["color-contrast"]) return [];
  const guided = audited.values === "generated";
  const words = roleWordsOf(root, rows, guided);
  const listed = listedRows(root, rows);
  const level = theme.inputs?.conformanceLevel ?? null;
  let styles = null;
  try {
    styles = loadStyles(root, theme.stylesheet ?? "src/index.css");
  } catch {
    styles = null;
  }
  const answer = guided ? "/design-assembly:new" : DECIDE;
  return unansweredQuestions(words).flatMap((question) => {
    const asked = listed.findLast((row) => row.item === `decision:${question.id}`);
    if (asked && !asked.answer) return [];
    // The owner kept the recommendation to wait: that is their word for now.
    // The owner kept waiting for a choice that has come since: asked again, saying so.
    const waited = waitedForChoice(question.id, asked);
    if (keepsWaiting(question.id, asked) && !waited) return [];
    // An answer the question does not take, or a refusal, asks again.
    const taken = asked && guided && listedSource(question.id, asked) !== null;
    return [
      {
        id: question.id,
        source: "ledger",
        question: question.question,
        recommendation: taken
          ? "Run the guide and write the owner's answer into the blueprint, under foundations.roles, with their name and the day: the decision sheet recorded it and changed no file the guide writes from."
          : roleRecommendation(question, belowFor(styles, level, question, words).length, guided),
        basis: taken
          ? `${MEASURED}the owner answered ${asked.id} of the waiting list by ${asked.by} on ${asked.on}, and the blueprint has no word for ${question.id}`
          : `${waited ? `the owner kept waiting in ${asked.id} of the waiting list, by ${asked.by} on ${asked.on}, and the choice it waited for has come; ` : asked ? `the answer «${asked.answer}» to ${asked.id} of the waiting list is none of ${question.sources.join(", ")}, so it is asked again; ` : ""}${roleBasis(styles, level, question, words)}`,
        answer,
      },
    ];
  });
}

const standardBasis = (decision) =>
  `a standard: this plugin's list of standard decisions names it${decision.core ? " as a core decision, one a tier cannot be reached without" : ""}`;

// What the machine recommends for a row nobody has confirmed, and what the recommendation rests on:
// a measurement taken on this repository now, or a standard. It never recommends an answer it
// cannot ground; where only a person can tell, it says so.
function recommend(row, decision) {
  if (!decision) {
    return {
      recommendation: `Read ${row.source} and confirm it, or give your own answer.`,
      basis: `${MEASURED}the row is the repository's own, beyond the standard decisions, and names ${row.check ? `${row.check}, which was not run here` : "no check"}`,
    };
  }
  if (decision.state === "bypassed") {
    return {
      recommendation: "Do not confirm it yet: the repository's own source goes around it.",
      basis: `${MEASURED}${decision.bypassed} place(s) in source go around it; the audit lists them`,
    };
  }
  if (decision.state === "failing") {
    return {
      recommendation: "Do not confirm it yet: its check does not pass.",
      basis: `${MEASURED}${decision.by}; the audit says why`,
    };
  }
  if (decision.state === "held") {
    return {
      recommendation: "Confirm it as it stands, or change it knowingly: a check holds it today.",
      basis: `${MEASURED}its check was run now and holds what the row says`,
    };
  }
  if (decision.state === "claimed") {
    return {
      recommendation: "Confirm it as it stands, knowing its check was not run here.",
      basis: `${MEASURED}the row names ${decision.by}, which can be found; it was not run again here`,
    };
  }
  if (/read from the repository/.test(row.note ?? "")) {
    return {
      recommendation: "Confirm it: it is what the repository already has.",
      basis: `${MEASURED}the answer was read from the repository and is kept in ${row.source}`,
    };
  }
  return {
    recommendation: `Read the proposal in ${row.source} and confirm it, or give your own answer: no check can make this call.`,
    basis: standardBasis(decision),
  };
}

// The question and the recommendation for a row: a principle speaks first where it can, the
// standard decisions and the measurements otherwise.
function fromPrinciple(row, decision, blueprint) {
  const question = decision?.question ?? `Does the repository's own decision "${row.id}" stand?`;
  const call = blueprint ? principleCall(blueprint, row.id) : null;
  if (!call) return { question, ...recommend(row, decision) };
  return {
    question: call.question ?? question,
    recommendation: call.recommendation,
    basis: written(call.basis),
  };
}

// What waits on the owner in the ledgers: every row that says nobody has confirmed it, then every
// call only a person can make that a ledger has no row for. Each is a question, never an answer.
function waitingOf(audit, rows, blueprint) {
  const decisionOf = (id) => audit.decisions.find((decision) => decision.id === id);
  const proposals = rows
    .filter((row) => UNCONFIRMED.test(row.note ?? ""))
    .map((row) => {
      const decision = decisionOf(row.id);
      return {
        id: row.id,
        source: "ledger",
        ...fromPrinciple(row, decision, blueprint),
        // The decision sheet writes a person's answer into the row, with their name and the date.
        answer: DECIDE,
      };
    });
  // A repository with no ledger has not met the plugin: nothing waits there yet.
  const inGuide = audit.next.startsWith("/design-assembly:new");
  const calls = rows.length === 0 ? [] : Object.entries(PERSON_CALLS);
  const unanswered = calls
    .map(([id, flag]) => [decisionOf(id), flag])
    .filter(([decision]) => decision && !decision.in_ledger)
    .map(([decision, flag]) => {
      const shown = decision.seen?.replace(/: a person confirms it$/, "");
      return {
        id: decision.id,
        source: "ledger",
        question: decision.question,
        recommendation: "Answer it: only a person can, and the ledger has no row for it.",
        basis: shown ? `${MEASURED}${shown}` : standardBasis(decision),
        answer: inGuide ? "/design-assembly:new" : `/design-assembly:adopt ${flag}`,
      };
    });
  return [...proposals, ...unanswered];
}

// A question of the waiting list that waits, as status lists it. What the list says for it is
// read off the repository, and is given as that: a list that grounds nothing is said to.
const fromList = (item) => ({
  id: item.id,
  source: "waiting-list",
  question: item.question,
  recommendation: item.recommendation,
  basis: `${MEASURED}${
    item.basis
      ? `the waiting list gives this ground: ${item.basis}`
      : `the waiting list gives no ground for it`
  }`,
  answer: DECIDE,
});

const RHYTHMS = [
  ["start", "the repository is born"],
  ["adopt", "the repository meets the plugin"],
  ["intake", "a feature needs a new block"],
  ["change", "every change"],
  ["periodic", "periodically, and before handing over"],
];
const VALUES = {
  generated: "the guide chose the values, and the stylesheet carries them",
  own: "the repository brought a primary color role of its own, so the guide is not for it",
  default: "no values chosen: the primary color role is still a grey default",
  none: "no stylesheet that declares color roles",
};

// What the intake rhythm has: the command is not built yet, and the ledger it would write may be
// kept by hand already.
function intakeSays(ledger) {
  const command = "the command is not built in this version of the plugin";
  if (!ledger) return `${command}: nothing records which need got which block`;
  const shape =
    ledger.differs.length === 0
      ? "with the one shape of the contract"
      : "not of the contract's shape";
  return `${command}; ${ledger.file} records which need got which block, written by hand, ${shape}`;
}

// One line per rhythm of a repository's life, each read from the repository as it is now.
function rhythmsOf(audit, broken, birth) {
  const c = audit.coverage;
  const l = audit.ledger;
  const shaped = audit.contract.filter((item) => item.differs.length === 0).length;
  const d = audit.departures;
  const departed = d.lint + d.excused + d.left;
  const slips =
    audit.slips === null
      ? "no record of what slipped past the checks"
      : audit.slips.count === 0
        ? `${SLIPS_FILE}: no line yet`
        : `${SLIPS_FILE}: ${audit.slips.count} line(s)${audit.slips.latest ? `, the latest on ${audit.slips.latest}` : ""}`;
  const says = {
    // The ledgers it has from birth belong to the repository being born.
    start: `${VALUES[audit.values]}; ${birthSays(birth)}`,
    adopt: l
      ? `${l.total} row(s) in the ledger; ${c.answered} of ${c.core} core decisions answered (${c.held} held and re-run here, ${c.claimed} claimed and not re-run, ${c.recorded} recorded)`
      : "no ledger: nothing is recorded yet",
    intake: intakeSays(audit.contract.find((item) => item.kind === "intake")),
    change: l
      ? `${l.automatic} of ${l.total} row(s) name a check that can be found; ${broken.length} failing or bypassed; ${shaped} of ${audit.contract.length} ledger file(s) have the one shape of the contract`
      : "no check that this plugin can see in the gate",
    periodic: `${slips}${departed > 0 ? `; ${departed} departure(s) on purpose` : ""}`,
  };
  return RHYTHMS.map(([id, name]) => ({ id, name, says: says[id] }));
}

// What keeps the browser test by role from being held, as a step: where the ledger joins screens
// with the model and the row of what each role sees is not there, what the repository lacks for
// it, and a command that does what the step says. The guide installs the test; adopting installs
// none and holds the row once the test is there, so for a repository that adopted the step says
// where the test comes from. Null when nothing is missing.
export function seenStepOf(root, rows, audited) {
  const ids = new Set(rows.map((row) => String(row.id)));
  if (!ids.has("screen-actions") || ids.has(SEEN_DECISION)) return null;
  const guided = audited.values === "generated";
  const missing = seenMissing(root);
  if (!existsSync(path.join(root, SEEN_TEST))) {
    missing.push(
      guided
        ? `${SEEN_TEST} is not installed yet`
        : `${SEEN_TEST} is not there, and adopting installs no test: copy it from this plugin's ${SEEN_TEMPLATE}`,
    );
  }
  if (missing.length === 0) return null;
  const command = guided ? "/design-assembly:new" : "/design-assembly:adopt";
  const then = guided
    ? `Then run ${command} again: it installs the browser test that opens each screen as each role, and holds it`
    : `Then run ${command} again: it holds the row once the test is there`;
  return { command, why: `${SEEN_DECISION} has no row: ${missing.join("; ")}. ${then}` };
}

// The commands to run next, in order: what is broken first, then what answers the owner, then what
// the audit decides from the files, then what the browser test by role still lacks. Only commands
// this plugin has. On a repository with no floor, the guide and adopting would refuse, so the
// audit's command is not offered: what is missing is said instead.
function nextOf(audit, waiting, broken, tool, seen = null, missing = null) {
  const next = [];
  if (broken.length > 0) {
    next.push({
      command: AUDIT,
      why: `${plural(broken.length, "decision is", "decisions are")} failing or bypassed (${broken
        .slice(0, SHOWN)
        .map((decision) => decision.id)
        .join(", ")}${broken.length > SHOWN ? ", ..." : ""}): the audit lists the places`,
    });
  }
  const commands = [...new Set(waiting.map((item) => item.answer.split(" ")[0]))];
  for (const command of commands) {
    const mine = waiting.filter((item) => item.answer.split(" ")[0] === command);
    next.push({
      command,
      why: `${plural(mine.length, "answer waits", "answers wait")} on the owner (${mine
        .slice(0, SHOWN)
        .map((item) => item.id)
        .join(", ")}${mine.length > SHOWN ? ", ..." : ""})`,
    });
  }
  // A copy of the tool that is not the installed plugin's is brought in by upgrade, after its
  // preview: the person reads what would change before anything does.
  if (tool.differs && tool.copy !== null) {
    next.push({
      command: UPGRADE,
      why: `${tool.says}: preview with --dry-run what would change, then upgrade`,
    });
  }
  // The audit's last line names a command when the scripts have something left to do.
  const named = /^(\/design-assembly:[a-z-]+),? (.*)$/.exec(audit.next);
  if (named && !missing && !next.some((step) => step.command === named[1])) {
    next.push({ command: named[1], why: named[2] });
  }
  if (seen) next.push(seen);
  return next;
}

// The blueprint of the guide, or null. One that does not parse is the guide's to refuse: status
// reads the ledgers without it.
function readBlueprint(root) {
  const file = path.join(root, "design/blueprint.json");
  if (!existsSync(file)) return null;
  try {
    return JSON.parse(readFileSync(file, "utf8"));
  } catch {
    return null;
  }
}

// Everything status reads from the ledgers, read once.
function readLedgers(root) {
  const audited = audit(root);
  const rows = readLedger(root) ?? [];
  const broken = audited.decisions.filter((d) => ["failing", "bypassed"].includes(d.state));
  const typeface = typefaceAsk(root, rows, audited);
  return {
    audit: audited,
    broken,
    waiting: [
      ...waitingOf(audited, rows, readBlueprint(root)),
      ...(typeface ? [typeface] : []),
      ...fontLicenceAsks(root, rows, audited),
      ...colorRoleAsks(root, rows, audited),
    ],
    tool: toolOf(root),
    sockets: socketsOf(root),
    seen: seenStepOf(root, rows, audited),
    birth: birthOf(root),
    missing: missingFloor(root),
  };
}

// What the repository lacks before this plugin can build on it, or null: a stylesheet, found where
// adopting finds one (the tool data's, the components settings', or the usual path), and a Makefile
// that lets the gate step join make check.
function missingFloor(root) {
  let theme;
  try {
    theme = JSON.parse(readFileSync(path.join(root, "design/theme.json"), "utf8"));
  } catch {
    theme = null;
  }
  const named = typeof theme?.stylesheet === "string" ? theme.stylesheet : null;
  const stylesheet = named && existsSync(path.join(root, named)) ? named : findStylesheet(root);
  if (stylesheet === null) {
    return `${named ?? DEFAULT_STYLESHEET} is missing, and no stylesheet is named elsewhere: this repository has no design floor to build on`;
  }
  return gateProblem(root);
}

// The ledgers the contract says a repository has from birth: how many there are, and which this
// repository has not.
function birthOf(root) {
  const all = Object.values(LEDGERS).filter((ledger) => ledger.born === BORN.floor).length;
  return { all, missing: missingAtBirth(root) };
}

function birthSays({ all, missing }) {
  if (missing.length === 0) return `ledgers from birth: all ${all} are here`;
  if (missing.length === all) {
    return `ledgers from birth: none of ${all} is here yet; on a floor, ${STARTER} lays them`;
  }
  return `ledgers from birth: ${missing.length} missing: ${missing.join(", ")}`;
}

function resultOf({ audit, broken, tool, sockets, seen, birth, missing }, waiting) {
  return {
    tier: audit.tier,
    // Core decisions only, as the audit counts them. Two numbers: a claim was not run again here.
    held: audit.coverage.held,
    claimed: audit.coverage.claimed,
    rhythms: rhythmsOf(audit, broken, birth),
    waiting,
    tool,
    next: nextOf(audit, waiting, broken, tool, seen, missing),
    // The socket board: which plug fills each socket of the capability table, and which is empty.
    sockets,
    // What the repository lacks before this plugin can build on it: its design floor, or the
    // Makefile line that lets the gate step join make check. Null on a floor.
    missing,
  };
}

// The reading `fullStatus` holds while it asks the decision sheet what waits in the waiting list:
// the sheet asks for this very reading, and gets it back instead of a second run of every check.
let reading = null;

// The status as the ledgers alone give it, before the waiting list is read. The decision sheet is
// built on this reading, under this name, and reads the waiting list for itself; the command and
// its document give `fullStatus`.
export function status(root) {
  if (reading?.root === root) return reading.result;
  const read = readLedgers(root);
  return resultOf(read, read.waiting);
}

// The whole status: what the ledgers say, and every question of the waiting list that nobody has
// answered. Which row of the list waits is the decision sheet's rule, asked of it and not written
// here a second time: a permission and an answered row do not wait.
export function fullStatus(root) {
  const read = readLedgers(root);
  reading = { root, result: resultOf(read, read.waiting) };
  let listed;
  try {
    listed = sheet(root).questions.filter((item) => item.source === "waiting-list");
  } finally {
    reading = null;
  }
  return resultOf(read, [...read.waiting, ...listed.map(fromList)]);
}

const TIER_NOTE = {
  reached: "reached",
  claimed: "claimed: complete, but it rests on checks that were not re-run here",
};

// The socket board on the screen, in one to four lines: how many sockets have a default plug, which
// are empty, the plugs from outside that are plugged in here, the plugs chosen, and those chosen
// and missing. The whole board is in --json.
function boardLines(sockets) {
  const empty = sockets.filter((socket) => socket.state === "empty").map((socket) => socket.id);
  const plugged = sockets.length - empty.length;
  const here = new Map();
  for (const socket of sockets) {
    for (const plug of socket.outside.filter((candidate) => candidate.here)) {
      here.set(plug.id, [...(here.get(plug.id) ?? []), socket.id]);
    }
  }
  // The plug the owner chose for a socket, and a chosen plug from outside the repository does not
  // show: a session without it keeps the plugin's plug.
  const chosen = sockets.filter((socket) => socket.chosen !== null);
  const missing = chosen.filter((socket) => socket.chosen.state === "chosen-but-missing");
  const named = (list) => list.map((socket) => `${socket.chosen.plug} (${socket.id})`).join(", ");
  return [
    `sockets: ${plugged} of ${sockets.length} with a default plug${empty.length > 0 ? `; empty: ${empty.join(", ")} (${LIMITS_FILE})` : ""}`,
    ...(here.size > 0
      ? [`  plugged in here: ${[...here].map(([id, at]) => `${id} (${at.join(", ")})`).join(", ")}`]
      : []),
    ...(chosen.length > 0 ? [`  chosen: ${named(chosen)}`] : []),
    ...(missing.length > 0
      ? [`  chosen-but-missing: ${named(missing)}, which this repository does not show`]
      : []),
  ];
}

// What the document says of a socket: its plug or its limit, and the plug chosen for it.
function socketCell(socket) {
  const plug =
    socket.state === "plugged"
      ? `plugged: ${socket.plug}${socket.limit ? `, with the limit ${socket.limit}` : ""}`
      : `empty: ${socket.limit}`;
  const chosen = socket.chosen
    ? `; chosen: ${socket.chosen.plug} by ${socket.chosen.by} on ${socket.chosen.on} (${socket.chosen.state})`
    : "";
  return `${plug}${chosen}`;
}

export function report(result) {
  const { tier, waiting, tool, next } = result;
  const above = tier.next ? `Next tier: ${tier.next}` : "No tier is above it";
  const lines = [
    tier.id
      ? `tier: ${tier.id}, ${TIER_NOTE[tier.state]}. ${above}`
      : `tier: none reached. ${above}`,
    `  core decisions: ${result.held} held and re-run here, ${result.claimed} claimed and not re-run`,
    "",
    "rhythms:",
    ...result.rhythms.map((rhythm) => `  ${rhythm.name}: ${rhythm.says}`),
    "",
  ];
  if (waiting.length === 0) {
    lines.push("waiting on the owner: nothing in the ledgers or the waiting list");
  } else {
    const listed = waiting.filter((item) => item.source === "waiting-list").length;
    lines.push(
      `waiting on the owner: ${waiting.length}${listed > 0 ? ` (${waiting.length - listed} in the ledgers, ${listed} in the waiting list)` : ""}`,
    );
    waiting.slice(0, SHOWN).forEach((item, index) => {
      lines.push(
        `  ${index + 1}. ${item.id}: ${item.question}`,
        `     recommendation: ${item.recommendation}`,
        `     because: ${item.basis}`,
        `     answer with: ${item.answer}`,
      );
    });
    if (waiting.length > SHOWN) {
      const rest = waiting.slice(SHOWN).map((item) => item.id);
      lines.push(`  and ${rest.length} more, listed with --json: ${rest.join(", ")}`);
    }
  }
  lines.push("", `tool: ${tool.says}`);
  if (tool.differs && tool.copy !== null) {
    lines.push(`  ${UPGRADE} --dry-run says what bringing the installed tool in would change`);
  }
  lines.push(...boardLines(result.sockets));
  // Where this report is blind, so that "nothing waits" does not read as more than it is.
  const blind = LIMITS.filter((limit) => limit.area === "status" && limit.status === "open");
  lines.push(
    `status does not see: ${blind.map((limit) => limit.id).join(", ")} (${LIMITS_FILE})`,
    "",
  );
  if (next.length === 0 && !result.missing) lines.push("next: nothing to run now");
  next.forEach((step, index) => {
    lines.push(`${index === 0 ? "next:" : "then:"} ${step.command}, ${step.why}`);
  });
  // A repository with no floor is told what is missing, last, never that nothing is left to do.
  if (result.missing) {
    lines.push(
      `${next.length === 0 ? "next:" : "then:"} nothing more this plugin can run here yet: ${result.missing}. The plugin builds on a design floor and does not lay one; once one is laid, ${STARTER} lays the ledgers`,
    );
  }
  return `${lines.join("\n")}\n`;
}

// The status report: the same answer as a document on the frame every document shares, made from
// the facts of the answer and from nothing else. `origin` says which state of the repository it is
// made from. What the screen cuts short the report cuts short too, and says where the rest is.
export function documentOf(result, origin) {
  const { tier, waiting, tool, next } = result;
  const broken = next.find((step) => step.command === AUDIT) ?? null;
  const listed = waiting.filter((item) => item.source === "waiting-list");
  const answers = plural(waiting.length, "answer waits", "answers wait");
  const where =
    listed.length > 0
      ? `${waiting.length - listed.length} in the ledgers, ${listed.length} in the waiting list`
      : "all of them in the ledgers";
  const reached = tier.id
    ? `The repository has reached the tier ${tier.id}${tier.state === "claimed" ? ", on checks that were not run again here" : ""}`
    : "The repository has reached no tier yet";
  const left = broken
    ? ", and a decision is failing or gone around"
    : tool.differs
      ? ", and its copy of the tool is not the installed plugin's"
      : "";
  const claimedTier = tier.state === "claimed";

  // Everything worth a person's attention, the heaviest first; the page shows the first three.
  const attention = [
    broken && {
      title: "A decision is failing, or source goes around one",
      detail: "It is work to fix, not a question to answer. The audit lists each place.",
    },
    waiting.length > 0 && {
      title: `${answers} on the owner`,
      detail: `${where}. A proposal is not an answer until a person gives it.`,
    },
    tool.differs && {
      title: "The repository's copy of the tool is not the installed plugin's",
      detail: tool.says,
    },
    claimedTier && {
      title: `The tier ${tier.id} rests on checks nothing here ran again`,
      detail: `${result.held} core decisions were run again here; ${result.claimed} are claimed.`,
    },
    tier.next && {
      title: `The next tier is ${tier.next}`,
      detail: "The audit says what it still lacks.",
    },
  ].filter(Boolean);

  // What the person must decide, by the command that takes the answer. The first questions are
  // written out, as on the screen; the rest are named.
  const shown = waiting.slice(0, SHOWN);
  const commands = [...new Set(waiting.map((item) => item.answer.split(" ")[0]))];
  const decide = commands.map((command) => {
    const mine = waiting.filter((item) => item.answer.split(" ")[0] === command);
    const rest = mine.filter((item) => !shown.includes(item));
    return {
      what: `Answer ${plural(mine.length, "question", "questions")}`,
      items: mine
        .filter((item) => shown.includes(item))
        .map((item) => `${item.id}: ${item.question}`),
      more:
        rest.length > 0
          ? `and ${rest.length} more, each on the decision sheet: ${rest.map((item) => item.id).join(", ")}`
          : null,
      command,
    };
  });

  const findings = [
    broken && {
      severity: "high",
      title: "A decision is failing, or source goes around one",
      detail:
        "A check of the gate fails, or the repository's own source writes a value around a decision. Nothing here waits on an answer.",
      evidence: [broken.why],
    },
    tool.differs && {
      severity: "medium",
      title: "The repository's copy of the tool is not the installed plugin's",
      detail: "The gate of the repository runs its own copy, whatever the plugin has since become.",
      evidence: [
        tool.says,
        `the repository's copy, as a tree: ${tool.copy ?? "none"}`,
        `the installed plugin's, version ${tool.installed.version}: ${tool.installed.tree}`,
      ],
    },
    waiting.length > 0 && {
      severity: "medium",
      title: `${answers} on the owner`,
      detail:
        "Each is a question with a recommendation, never an answer: nothing is decided until a person says so.",
      evidence: commands.map((command) => {
        const mine = waiting.filter((item) => item.answer.split(" ")[0] === command);
        return `answered with ${command}: ${mine.map((item) => item.id).join(", ")}`;
      }),
    },
    !tool.differs && {
      severity: "note",
      title: "The repository's copy of the tool",
      evidence: [tool.says],
    },
    claimedTier && {
      severity: "low",
      title: `The tier ${tier.id} rests on checks nothing here ran again`,
      detail: "A claim names a check that can be found. It was not run for this report.",
      evidence: [
        `${result.held} core decisions held and run again here`,
        `${result.claimed} core decisions claimed and not run again`,
      ],
    },
  ].filter(Boolean);

  // A basis is written "what it rests on: the fact". The two kinds status ever gives.
  const basisOf = (line) => {
    const [kind, prefix] = Object.entries(PREFIXES).find(([, lead]) => line.startsWith(lead)) ?? [
      "standard",
      "",
    ];
    return { kind, text: line.slice(prefix.length) };
  };
  const recommendations = [
    broken && {
      what: "Fix what is failing or gone around before anything is confirmed",
      basis: { kind: "measurement", text: broken.why },
      action: "Run the audit: it names each decision and each place.",
      command: AUDIT,
    },
    tool.differs && {
      what: "Preview the upgrade before the repository's copy of the tool changes",
      basis: { kind: "measurement", text: tool.says },
      action:
        "Run the upgrade with --dry-run: it lists the tool files, the ledger entries and the decisions that would change, and whether the gate stays green. Do not copy the files by hand.",
      command: `${UPGRADE} --dry-run`,
    },
    ...shown.map((item) => ({
      about: `${item.id}: ${item.question}`,
      what: item.recommendation,
      basis: basisOf(item.basis),
      action: "Give your answer; the recommendation is not one.",
      command: item.answer,
    })),
  ].filter(Boolean);
  const unshown = waiting.slice(SHOWN).map((item) => item.id);

  const blind = LIMITS.filter(
    (limit) => ["status", "document"].includes(limit.area) && limit.status === "open",
  );
  return {
    kind: "status-report",
    title: "Status report",
    lede: "Where the design system of this repository stands, what waits on its owner, and what to run next.",
    origin,
    version: VERSION,
    scope: [
      "The ledgers of the design system, read as the audit reads them",
      `The waiting list, ${WAITING_FOLDER} with one file per question or ${WAITING_LIST}, when the repository keeps one`,
      `The repository's copy of the tool, ${TOOL_COPY}, against the installed plugin's`,
      `The tool stamp, ${STAMP}: ${tool.recorded ? `version ${tool.recorded.version}` : "none in this repository"}`,
    ],
    decision: {
      conclusion: `${reached}; ${waiting.length === 0 ? "nothing waits on its owner" : `${answers} on its owner`}${left}.`,
      figures: [
        { value: String(waiting.length), label: "answers wait on the owner" },
        { value: String(result.held), label: "core decisions held, and run again here" },
        { value: String(result.claimed), label: "core decisions claimed, and not run again" },
      ],
      attention: attention.slice(0, 3),
      decide,
    },
    findings,
    register: {
      title: "Each rhythm of the repository's life, as read now",
      columns: ["Rhythm", "What the repository says"],
      groups: [
        {
          title: null,
          note: null,
          rows: result.rhythms.map((rhythm) => [rhythm.name, rhythm.says]),
        },
        {
          title: "Each socket of the capability table",
          note: boardLines(result.sockets)[0],
          rows: result.sockets.map((socket) => [socket.name, socketCell(socket)]),
        },
      ],
    },
    recommendations,
    next: next.map((step) => ({ command: step.command, why: step.why })),
    blind: blind.map(({ id, note }) => ({ id, note })),
    after: {
      recommendations:
        unshown.length > 0
          ? `${plural(unshown.length, "more question has", "more questions have")} a recommendation of their own, on the decision sheet (${DECIDE}) and with --json: ${unshown.join(", ")}.`
          : null,
    },
  };
}

const USAGE =
  "usage: node status.mjs [--target DIR] [--json] [--out DIR [--format html|pdf]] [--roles]\n";

// Something is left when an answer waits on a person, when the tool differs, or when a check
// fails or source goes around a decision: `next` then starts with the audit.
export const leavesWork = (result) =>
  result.waiting.length > 0 ||
  result.tool.differs ||
  result.next.some((step) => step.command === AUDIT);

async function main(args) {
  const call = readCall(args, { ...DOCUMENT_FLAGS, "--roles": "switch" });
  if (call.problem) return refuse(call.problem, USAGE);
  if (call.help) return void stdout.write(USAGE);
  // The table of colour roles as words: each role, its source and its pairs, with the owner's word
  // where the repository's blueprint has one.
  if (call.flags["--roles"]) {
    const blueprint = readBlueprint(call.target);
    const rows = readLedger(call.target) ?? [];
    const words = blueprint
      ? wordsOf(blueprint)
      : rows.length > 0
        ? wordsFromListed(listedRows(call.target, rows))
        : null;
    // A repository the guide or adopting wrote: each value beside its source, its rows and their
    // checks. Elsewhere, the table alone.
    const held = blueprint ? heldRoles(call.target) : null;
    const foundations = blueprint?.layers?.foundations;
    const lines = held
      ? heldLines(held)
      : rolesLines(words, foundations?.choice ?? null, foundations?.answered ?? null);
    return finish({
      json: call.json,
      result: { roles: COLOR_ROLES.roles, pairs: PAIRS, words, ...(held ? { held } : {}) },
      text: `${lines.join("\n")}\n`,
      work: false,
    });
  }
  // A wrong call for a document is refused before anything is read.
  const asked = requested(call);
  const result = fullStatus(call.target);
  const handed = await handOver(asked, call.target, (origin) => documentOf(result, origin));
  return finish({
    json: call.json,
    result: { ...result, ...handed.data },
    text: `${report(result)}${handed.text}`,
    work: leavesWork(result) || handed.work,
  });
}

await start(import.meta.url, main);
