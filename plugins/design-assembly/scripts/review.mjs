// The review of a drawn screen (specification 0009): the default plug of the design review socket.
// It draws one screen of the ledger of screens at every declared width, in light and in dark,
// measures on it what a machine can measure with no model called, the contrast of text on its
// ground and text broken inside a word or cut off, and says what it found, each finding with a
// number, its picture and place, how heavy it is, a way to fix it and what it rests on.
// Read-only: it writes nothing in the repository. With --out it writes the pictures, a pack for an
// eye to read later and the design review record, into that folder and nowhere else. No eye looks
// at the pictures here, and the answer says so.
// Usage: node review.mjs <screen id> [--target DIR] [--states] [--json] [--out DIR [--format html|pdf]]
// Exit: 0 nothing was found; 1 there are findings, a picture asked for was not drawn, or the
// record was written in fewer formats than asked; 2 a wrong call, a screen the ledger does not
// have, or a repository with no build the plugin can draw.
import { existsSync, mkdirSync, readdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { stdout } from "node:process";

import { fileChange, finish, nameIn, readCall, refuse, start } from "./command.mjs";
import { DOCUMENT_FLAGS, handOver, plural, renderDocument, requested } from "./document.mjs";
import { originOf } from "./family.mjs";
import { findingsOf } from "./measure.mjs";
import { factsOf, PACK_FILE, packOf } from "./review-pack.mjs";
import { eyeLimit, recordOf } from "./review-record.mjs";
import { drawScreen, SHOTS_FOLDER } from "./review-shots.mjs";

const USAGE =
  "usage: node review.mjs <screen id> [--target DIR] [--states] [--json] [--out DIR [--format html|pdf]]\n";
const FLAGS = { ...DOCUMENT_FLAGS, "--states": "switch" };
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

// The review of one screen, as data: what the repository says of the screen, the pictures drawn,
// the findings and what could not be judged. `keep` says whether the pictures are taken as well as
// read; they come back as bytes, each under the name its file would have. Nothing is written.
export async function review(target, id, { all = false, keep = false } = {}) {
  const facts = factsOf(target, id);
  const drawn = await drawScreen(target, facts.screen, { widths: facts.widths, all, keep });
  const measured = findingsOf(drawn.shots, {
    themes: drawn.themes,
    rows: facts.decisions,
    level: facts.level,
  });
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
    findings: measured.findings,
    unjudged: unseenOf(drawn, measured),
  };
  return {
    result: {
      screen: facts.screen,
      widths: facts.widths,
      widths_declared: facts.declared,
      level: facts.level,
      ...seen,
      eye: NO_EYE,
    },
    pack: packOf(facts, seen),
    left: drawn.left,
    pictures: drawn.shots
      .filter((shot) => shot.bytes !== null)
      .map(({ file, bytes }) => ({ file, bytes })),
  };
}

const placeOf = ({ x, y }) => `${x}, ${y}`;
function findingLines(finding) {
  const on = finding.rests_on;
  return [
    `  ${finding.number} [${finding.severity}] ${finding.kind}: «${finding.where.text}» (${finding.where.path})`,
    finding.kind === "contrast"
      ? `      ${finding.measured.ratio}:1 where ${finding.measured.needed}:1 is asked, ${finding.measured.text} on ${finding.measured.ground}, at ${plural(finding.places, "place", "places")}`
      : finding.kind === "broken-word"
        ? `      laid on ${finding.measured.lines} lines with no break of its own`
        : `      ${finding.measured.hidden}px hidden ${finding.measured.axis === "x" ? "across" : "down"} by its box`,
    `      picture ${finding.picture} at ${placeOf(finding.position)}; seen on ${plural(finding.seen_in.length, "picture", "pictures")}`,
    ...(finding.low_because ? [`      low: ${finding.low_because}`] : []),
    `      rests on: ${on.kind === "ledger-row" ? `${on.ledger}, row ${on.id}` : `nothing (${on.note})`}`,
    `      fix: ${finding.fix}`,
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
    ...findings.flatMap(findingLines),
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
    `no eye has looked at the pictures: ${eyeLimit()?.note ?? NO_EYE.why}`,
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
  const { result, pack, left, pictures } = await review(call.target, call.words[0], {
    all: call.flags["--states"] === true,
    keep: out !== null,
  });
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
  const written = out
    ? `pictures: ${pictures.length} in ${path.join(out, SHOTS_FOLDER)}\npack: ${path.join(out, PACK_FILE)}\n`
    : "";
  return finish({
    json: call.json,
    result: {
      ...result,
      ...handed.data,
      ...(out ? { files: [...files, ...(handed.data.files ?? [])] } : {}),
    },
    text: `${report(result)}${written}${handed.text}`,
    work: result.findings.length > 0 || left.length > 0 || handed.work,
  });
}

await start(import.meta.url, main);
