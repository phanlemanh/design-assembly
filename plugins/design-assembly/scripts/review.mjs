// The review of a drawn screen (specification 0009): the default plug of the design review socket.
// It draws one screen of the ledger of screens at every declared width, in light and in dark,
// measures on it what a machine can measure with no model called, the contrast of text on its
// ground and text broken inside a word or cut off, and says what it found, each finding with a
// number, its picture and place, how heavy it is, a way to fix it and what it rests on.
// Read-only: it writes nothing in the repository. With --out it writes the pictures, a pack for an
// eye to read later and the design review record, into that folder and nowhere else. No eye looks
// at the pictures here: an eye the socket board names reads them in the user's own session, writes
// what it saw into a findings file, and --findings hands that file back to be harvested. Every
// finding, measured or seen, is then put in one of three groups by what it rests on (see
// review-harvest.mjs). Only with --queue does anything reach the repository: the questions of the
// harvest, each as one new file of the waiting list, the way the decision sheet asks them.
// Usage: node review.mjs <screen id> [--target DIR] [--states] [--findings FILE [--queue]] [--json]
//                        [--out DIR [--format html|pdf]]
// Exit: 0 nothing was found; 1 there are findings, a picture asked for was not drawn, or the
// record was written in fewer formats than asked; 2 a wrong call, a screen the ledger does not
// have, a findings file that cannot be harvested, or a repository with no build the plugin can draw.
import { existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import path from "node:path";
import { stdout } from "node:process";

import { writeFiles, writtenFiles } from "./apply.mjs";
import { fileChange, finish, nameIn, readCall, Refusal, refuse, start } from "./command.mjs";
import { DOCUMENT_FLAGS, handOver, plural, renderDocument, requested } from "./document.mjs";
import { today } from "./decide.mjs";
import { originOf } from "./family.mjs";
import { findingsOf } from "./measure.mjs";
import {
  eyesOf,
  finderOf,
  harvestOf,
  listedOf,
  mergeFindings,
  pictureProblems,
  queueOf,
  readFindings,
  saidOf,
  seenFindings,
} from "./review-harvest.mjs";
import { factsOf, PACK_FILE, packOf } from "./review-pack.mjs";
import { eyeLimit, recordOf } from "./review-record.mjs";
import { drawScreen, SHOTS_FOLDER } from "./review-shots.mjs";

const USAGE =
  "usage: node review.mjs <screen id> [--target DIR] [--states] [--findings FILE [--queue]] [--json] [--out DIR [--format html|pdf]]\n";
const FLAGS = {
  ...DOCUMENT_FLAGS,
  "--states": "switch",
  "--findings": "value",
  "--queue": "switch",
};
// What every answer says of the eye: this command has none.
export const NO_EYE = {
  looked: false,
  why: "no reviewer has looked at the pictures: only what a machine can measure was measured",
};

// What was asked for and could not be seen, beside what the measures left unjudged: a state that
// was not drawn, and a dark theme the application does not have.
function unseenOf(drawn, measured) {
  const dark = drawn.themes.find((theme) => theme.name === "dark");
  const at = (item) =>
    item.width ? ` at ${item.width} pixels wide in ${item.theme}` : " at any width";
  return [
    ...measured.unjudged,
    ...drawn.left.map((item) => ({
      kind: "state-not-drawn",
      note: `The state ${item.state} was not drawn${at(item)}: ${item.why}.`,
    })),
    ...(dark.drawn
      ? []
      : [{ kind: "no-dark-theme", note: `Only light was drawn and measured: ${dark.how}.` }]),
  ];
}

// What every answer says of an eye that looked: which one, and that its words are its own.
const eyeOf = (read) => ({
  looked: true,
  by: read.eye,
  findings: read.findings.length,
  why: `${read.eye} looked at the pictures and the pack; what it saw is in its own words, and no check holds them`,
});

// The review of one screen, as data: what the repository says of the screen, the pictures drawn,
// the findings, what becomes of each, and what could not be judged. `keep` says whether the
// pictures are taken as well as read; they come back as bytes, each under the name its file would
// have. `findings` is the text of an eye's findings file: it is read before anything is drawn, and
// a file that cannot be harvested is refused then, by `file`, the name the caller gave it. `on` is
// the day each line for the ledger of escapes is dated with in the answers; the record leaves it
// out. Nothing is written.
export async function review(
  target,
  id,
  { all = false, keep = false, findings = null, file = undefined, on = today() } = {},
) {
  const facts = factsOf(target, id);
  const read = findings === null ? null : readFindings(findings, facts, { file });
  const drawn = await drawScreen(target, facts.screen, { widths: facts.widths, all, keep });
  // Which pictures there are is known only once they are drawn: a state the screen list does not
  // say how to reach, or a dark theme the application lacks, draws none; and a picture's page size
  // is known only then. So a finding on a picture that is not there, or placed outside its page,
  // is refused here, still before anything is written.
  if (read) {
    const lost = pictureProblems(read, drawn.shots);
    if (lost.length > 0) throw new Refusal(`${lost.join("; ")}. Nothing was harvested`);
  }
  const measured = findingsOf(drawn.shots, {
    themes: drawn.themes,
    rows: facts.decisions,
    level: facts.level,
  });
  const own = mergeFindings(measured.findings);
  const combined = read ? mergeFindings(measured.findings, seenFindings(read, drawn.shots)) : own;
  const seen = {
    // A picture as it is told of: what the probe read on it has become the findings.
    shots: drawn.shots.map(({ id, file, state, width, theme, page }) => ({
      id,
      file,
      state,
      width,
      theme,
      page,
    })),
    themes: drawn.themes,
    findings: own,
    unjudged: unseenOf(drawn, measured),
  };
  return {
    result: {
      screen: facts.screen,
      widths: facts.widths,
      widths_declared: facts.declared,
      level: facts.level,
      ...seen,
      findings: combined,
      eye: read ? eyeOf(read) : NO_EYE,
      eyes: eyesOf(),
      harvest: listedOf(target, harvestOf(combined, facts, { target, on })),
    },
    // The pack is what an eye reads before it looks: the machine's findings alone.
    pack: packOf(facts, seen),
    left: drawn.left,
    pictures: drawn.shots
      .filter((shot) => shot.bytes !== null)
      .map(({ file, bytes }) => ({ file, bytes })),
  };
}

const placeOf = ({ x, y }) => `${x}, ${y}`;
// What a finding rests on, in a few words.
export function restWords(on) {
  if (on.kind === "ledger-row") return `${on.ledger}, row ${on.id}`;
  if (on.kind === "rule-line") return `${on.file}, line ${on.line} («${on.text}»)`;
  if (on.kind === "principle") return `the principle ${on.id} («${on.statement}»)`;
  return `nothing (${on.note})`;
}
// Whether an eye's finding is noted on its whole picture: the eye named no place.
const wholeOf = (finding, shots) => {
  const page = shots.find((shot) => shot.id === finding.picture)?.page;
  const { x, y, width, height } = finding.position;
  return x === 0 && y === 0 && width === page?.width && height === page?.height;
};
function seenLines(finding, shots) {
  return [
    `  ${finding.number} [${finding.severity}] seen by ${finding.by}: ${finding.where.text}`,
    wholeOf(finding, shots)
      ? `      picture ${finding.picture}, over the whole picture: the eye named no place`
      : `      picture ${finding.picture} at ${placeOf(finding.position)}`,
    `      rests on: ${restWords(finding.rests_on)}`,
    `      fix: ${finding.fix}`,
  ];
}
function findingLines(finding, shots) {
  if (finding.kind === "seen") return seenLines(finding, shots);
  return [
    `  ${finding.number} [${finding.severity}] ${finding.kind}: «${finding.where.text}» (${finding.where.path})`,
    finding.kind === "contrast"
      ? `      ${finding.measured.ratio}:1 where ${finding.measured.needed}:1 is asked, ${finding.measured.text} on ${finding.measured.ground}, at ${plural(finding.places, "place", "places")}`
      : finding.kind === "broken-word"
        ? `      laid on ${finding.measured.lines} lines with no break of its own`
        : `      ${finding.measured.hidden}px hidden ${finding.measured.axis === "x" ? "across" : "down"} by its box`,
    `      picture ${finding.picture} at ${placeOf(finding.position)}; seen on ${plural(finding.seen_in.length, "picture", "pictures")}`,
    ...(finding.low_because ? [`      low: ${finding.low_because}`] : []),
    `      rests on: ${restWords(finding.rests_on)}`,
    `      fix: ${finding.fix}`,
  ];
}

// What becomes of each finding, for a person at a terminal.
function harvestLines(result) {
  const { harvest, findings } = result;
  if (harvest.length === 0) return [];
  const numbered = (entry) => findings.find((finding) => finding.number === entry.finding);
  const lines = ["", "harvest: what becomes of each finding"];
  for (const entry of harvest) {
    const finding = numbered(entry);
    if (entry.group === "escape") {
      lines.push(
        `  ${entry.finding} escaped: ${entry.why}; add to ${entry.file}:`,
        `      ${entry.line}`,
      );
    } else if (entry.group === "question") {
      const where = entry.queued?.file
        ? `queued as ${entry.queued.file}`
        : entry.queued?.waits
          ? `waits on the owner already, as ${entry.queued.waits}`
          : entry.queued?.answered
            ? `answered already, in ${entry.queued.answered}`
            : null;
      lines.push(
        `  ${entry.finding} a question for the owner: ${saidOf(finding)} (${finderOf(finding)})`,
        ...(where ? [`      ${where}`] : [`      ${entry.call}`]),
      );
    } else {
      lines.push(`  ${entry.finding} for a person's eye: ${entry.why}`);
    }
  }
  const unasked = harvest.filter((entry) => entry.group === "question" && entry.queued === null);
  if (unasked.length > 0) {
    lines.push(
      `nothing was written: run again with --queue to put ${plural(unasked.length, "question", "questions")} on the waiting list, or run each call`,
    );
  }
  return lines;
}

// What the answer says of the eye: which one looked, or that none did and which the board names.
function eyeLines(result) {
  if (result.eye.looked) {
    return [
      `seen by ${result.eye.by}: ${plural(result.eye.findings, "finding", "findings")} of its own, beside what the machine measured`,
      `  ${eyeLimit()?.note ?? result.eye.why}`,
    ];
  }
  const names = result.eyes.flatMap((eye) => eye.names);
  return [
    `no eye has looked at the pictures: ${NO_EYE.why}`,
    ...(names.length > 0
      ? [
          `  the socket board names ${names.join(", ")} as an eye: hand it the pictures and the pack, and give its findings back with --findings`,
        ]
      : []),
  ];
}

// The answer for a person at a terminal.
export function report(result) {
  const { screen, shots, findings, themes, unjudged } = result;
  const dark = themes.find((theme) => theme.name === "dark");
  const states = [...new Set(shots.map((shot) => shot.state))];
  return [
    `design review: ${screen.id} (${screen.route})`,
    `  ${plural(shots.length, "picture", "pictures")}: ${result.widths.join(", ")} pixels wide, light${dark.drawn ? " and dark" : ""}, ${plural(states.length, "state", "states")} (${states.join(", ")})`,
    `  dark: ${dark.how}`,
    `  measured: the contrast of text on its ground${result.level ? ` at level ${result.level}` : " at level AA (the repository names no level)"}; text broken inside a word or cut off`,
    "",
    findings.length === 0 ? "findings: none" : `findings: ${findings.length}, the heaviest first`,
    ...findings.flatMap((finding) => findingLines(finding, shots)),
    ...harvestLines(result),
    ...(unjudged.length > 0
      ? [
          "",
          "needs a person's eye:",
          ...unjudged.map(
            (item) => `  ${item.kind}: ${item.note ?? `«${item.where.text}» (${item.where.path})`}`,
          ),
        ]
      : []),
    "",
    ...eyeLines(result),
    "",
  ].join("\n");
}

// What a folder holds before the review writes there: it says which of its files are new.
const namesIn = (folder) => (existsSync(folder) ? new Set(readdirSync(folder)) : new Set());
const keptIn = (out) => ({ own: namesIn(out), shots: namesIn(path.join(out, SHOTS_FOLDER)) });

// The pictures and the pack as files a machine is told of, each new or written over.
function filesOf(target, out, shots, kept) {
  const change = (file, was) =>
    fileChange(nameIn(target, path.join(out, file)), was ? "update" : "create");
  return [
    ...shots
      .filter((shot) => shot.file !== null)
      .map((shot) => change(shot.file, kept.shots.has(path.basename(shot.file)))),
    change(PACK_FILE, kept.own.has(PACK_FILE)),
  ];
}

// The text of the findings file the call names, or null; a name that is no file is a wrong call.
function findingsText(named) {
  if (named === undefined) return null;
  const file = path.resolve(named);
  if (!existsSync(file) || !statSync(file).isFile()) {
    throw new Refusal(`${named} is not a file: --findings names the file an eye wrote`);
  }
  return readFileSync(file, "utf8");
}

async function main(args) {
  const call = readCall(args, FLAGS, { words: true });
  if (call.problem) return refuse(call.problem, USAGE);
  if (call.help) return void stdout.write(USAGE);
  if (call.words.length === 0) {
    return refuse("say which screen to review, by its id in the ledger of screens", USAGE);
  }
  if (call.words.length > 1) return refuse("a review is of one screen at a time", USAGE);
  // A wrong call for a document is refused before anything is read or drawn.
  const asked = requested(call);
  const out = asked?.out ?? null;
  const findings = findingsText(call.flags["--findings"]);
  const queue = call.flags["--queue"] === true;
  const reviewed = await review(call.target, call.words[0], {
    all: call.flags["--states"] === true,
    keep: out !== null,
    findings,
    file: call.flags["--findings"],
  });
  const { pack, left, pictures } = reviewed;
  // The questions are made before anything is written: a question that cannot be asked leaves
  // nothing behind, in the repository or in the folder.
  const queued = queue ? queueOf(call.target, reviewed.result.harvest) : null;
  const result = queued ? { ...reviewed.result, harvest: queued.harvest } : reviewed.result;
  let files = [];
  if (out) {
    // The record is drawn once before anything is written: a review that cannot be handed over
    // leaves nothing behind.
    renderDocument(recordOf(result, originOf(call.target, { apart: out })));
    files = filesOf(call.target, out, result.shots, keptIn(out));
    mkdirSync(path.join(out, SHOTS_FOLDER), { recursive: true });
    for (const picture of pictures) writeFileSync(path.join(out, picture.file), picture.bytes);
    writeFileSync(path.join(out, PACK_FILE), `${JSON.stringify(pack, null, 2)}\n`);
  }
  const handed = await handOver(asked, call.target, (origin) => recordOf(result, origin));
  // Only new files of the waiting list, only when asked, and last: once they are written nothing
  // else of the review can fail.
  const asking = queued ? writtenFiles(writeFiles(call.target, queued.files, false)) : [];
  const written = out
    ? `pictures: ${pictures.length} in ${path.join(out, SHOTS_FOLDER)}\npack: ${path.join(out, PACK_FILE)}\n`
    : "";
  return finish({
    json: call.json,
    result: {
      ...result,
      ...handed.data,
      ...(out || queue ? { files: [...files, ...(handed.data.files ?? []), ...asking] } : {}),
    },
    text: `${report(result)}${written}${handed.text}`,
    work: result.findings.length > 0 || left.length > 0 || handed.work,
  });
}

await start(import.meta.url, main);
