// The design review record: what a review found on one drawn screen, set on the frame every
// document of this plugin shares. The pictures carry numbered notes, one for each finding; the
// findings stand by severity; and the last part says what was not seen, first of all that no eye
// has looked at the pictures. Built from the facts of the answer for a machine and from nothing
// else, so the same facts give the same page.
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { SIZES_FILE } from "../templates/tools/design-assembly/screens.mjs";
import { readCapabilities } from "./capabilities.mjs";
import { plural, SEVERITIES } from "./document.mjs";
import { SHOTS_FOLDER } from "./review-shots.mjs";
import { VERSION } from "./stamp.mjs";

const PLUGIN = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const LIMITS = JSON.parse(readFileSync(path.join(PLUGIN, "references/limits.json"), "utf8")).limits;
const SOCKET = "design-review";
export const REVIEW = "/design-assembly:review";
// The widest a picture is shown on the page, in CSS pixels: the width the page itself is set to.
const WIDEST = 960;

// The open limit of the socket: what of a design review nothing does yet. It is the first thing
// the record says it did not see.
export function eyeLimit() {
  const { limit } = readCapabilities().table.capabilities.find((item) => item.id === SOCKET);
  return LIMITS.find((row) => row.id === limit && row.status === "open") ?? null;
}

const quoted = (text) => `«${text}»`;
// What a finding says in one line, and what was measured, by its kind.
const TITLE = {
  contrast: ({ where, measured }) =>
    `Text too faint for its ground: ${quoted(where.text)} reaches ${measured.ratio}:1 where ${measured.needed}:1 is asked`,
  "broken-word": ({ where, measured }) =>
    `A word broken in its middle: ${quoted(where.text)} is laid on ${measured.lines} lines`,
  "cut-off": ({ where, measured }) =>
    `Text cut off by its box: ${quoted(where.text)} loses ${measured.hidden}px ${measured.axis === "x" ? "across" : "down"}`,
};
const MEASURED = {
  contrast: ({ measured, places }) =>
    `Text ${measured.text} on ${measured.ground}, at ${measured.size}px${measured.bold ? " bold" : ""}: ${measured.ratio}:1, and the level asks ${measured.needed}:1. The same two colours stand at ${plural(places, "place", "places")} of the screen.`,
  "broken-word": ({ measured }) =>
    `The word has no break of the writer's own and stands on ${measured.lines} lines.`,
  "cut-off": ({ measured }) =>
    `${measured.hidden}px of the text lie outside the box that hides what does not fit, ${measured.axis === "x" ? "across" : "down"} the page.`,
};
const restsOn = ({ rests_on: on }) =>
  on.kind === "ledger-row"
    ? `Rests on row ${on.id} of ${on.ledger}${on.check ? `, held by ${on.check}` : ", which no check holds"}.`
    : `Rests on nothing this repository has decided: ${on.note}.`;
const pictureOf = (shots, id) => shots.find((shot) => shot.id === id);
const named = (shot) => shot.file ?? shot.id;

function findingOf(finding, shots) {
  const { x, y, width, height } = finding.position;
  return {
    number: finding.number,
    severity: finding.severity,
    title: TITLE[finding.kind](finding),
    detail: finding.low_because ? `Low because it is ${finding.low_because}.` : null,
    evidence: [
      MEASURED[finding.kind](finding),
      `Note ${finding.number} on ${named(pictureOf(shots, finding.picture))}, at ${x}, ${y} of the page (${width} × ${height} px): ${finding.where.path}.`,
      `Seen on ${finding.seen_in.length} of ${plural(shots.length, "picture", "pictures")}: ${finding.seen_in.join(", ")}.`,
      restsOn(finding),
    ],
  };
}

// Each picture as the frame shows it: its file beside the page, and the notes of the findings
// first seen on it, each placed in hundredths of the picture.
function picturesOf(shots, findings) {
  const of = (value, whole) => Math.min(100, Math.max(0, (value / whole) * 100));
  return shots
    .filter((shot) => shot.file !== null)
    .map((shot) => ({
      file: shot.file,
      alt: `The screen in the state ${shot.state}, ${shot.width} pixels wide, in ${shot.theme}`,
      caption: `${shot.state} · ${shot.width}px · ${shot.theme}`,
      width: Math.min(shot.page.width, WIDEST),
      height: Math.round(shot.page.height * (Math.min(shot.page.width, WIDEST) / shot.page.width)),
      notes: findings
        .filter((finding) => finding.picture === shot.id)
        .map(({ number, position }) => ({
          number,
          x: of(position.x, shot.page.width),
          y: of(position.y, shot.page.height),
          width: of(position.width, shot.page.width),
          height: of(position.height, shot.page.height),
        })),
    }));
}

const UNJUDGED_NOTE = {
  "text-on-a-picture": (item) =>
    `${quoted(item.where.text)} (${item.where.path}) stands on a picture or a gradient, so no one ground can be named and its contrast was not measured.`,
  "text-shortened": (item) =>
    `${quoted(item.where.text)} (${item.where.path}) is shortened by its box, which says so with an ellipsis or a limit of lines: whether a reader misses what is hidden was not judged.`,
  "state-not-drawn": (item) => item.note,
  "no-dark-theme": (item) => item.note,
};

// What the record did not see: that no eye looked, what on this screen could not be measured or
// drawn, and the open limits of the review and of every document.
function blindOf(unjudged) {
  const eye = eyeLimit();
  const open = (area) => LIMITS.filter((row) => row.area === area && row.status === "open");
  const group = (title, rows) => rows.map(({ id, note }) => ({ group: title, id, note }));
  return [
    ...(eye ? group("No eye yet", [eye]) : []),
    ...unjudged.map((item) => ({
      group: "On this screen, for a person's eye",
      id: item.kind,
      note: UNJUDGED_NOTE[item.kind](item),
    })),
    ...group("What the two measures never see", open("review")),
    ...group("Of every document", open("document")),
  ];
}

const tallyOf = (findings) =>
  SEVERITIES.map((severity) => [
    severity,
    findings.filter((finding) => finding.severity === severity).length,
  ])
    .filter(([, count]) => count > 0)
    .map(([severity, count]) => `${count} ${severity}`)
    .join(", ");

function scopeOf(result) {
  const { screen, widths, themes, shots, level } = result;
  const declared = result.widths_declared;
  const dark = themes.find((theme) => theme.name === "dark");
  const states = [...new Set(shots.map((shot) => shot.state))];
  return [
    `The screen ${screen.id}, opened at ${screen.route}${screen.file ? ` and drawn by ${screen.file}` : ""}`,
    `Drawn ${widths.join(", ")} pixels wide: ${declared ? `the widths of ${SIZES_FILE}` : `the two widths every floor starts from, since the repository has no ${SIZES_FILE}`}`,
    `In light${dark.drawn ? " and in dark" : ""}; of dark: ${dark.how}`,
    `In ${plural(states.length, "state", "states")}: ${states.join(", ")}`,
    `Measured with no model called: the contrast of text on its ground at level ${level ?? "AA, the level taken where the repository names none"}, and text broken inside a word or cut off`,
    shots.some((shot) => shot.file !== null)
      ? `${plural(shots.length, "picture", "pictures")}, each a file in ${SHOTS_FOLDER}/ beside this page`
      : `${plural(shots.length, "picture", "pictures")} drawn and read, none kept`,
  ];
}

// The record as data for the frame. `origin` is where the page comes from: the repository's name,
// its last commit and that commit's day.
export function recordOf(result, origin) {
  const { screen, findings, shots, unjudged } = result;
  const shown = findings.map((finding) => findingOf(finding, shots));
  const unheld = findings.filter((finding) => finding.rests_on.kind === "nothing");
  const again = `${REVIEW} ${screen.id}`;
  return {
    kind: "design-review",
    title: "Design review record",
    lede: "One screen as it is drawn, what a machine measured on it, and what still waits for an eye.",
    origin,
    version: VERSION,
    scope: scopeOf(result),
    decision: {
      conclusion:
        findings.length === 0
          ? `The two measures found nothing on ${screen.id}; no eye has looked at it yet.`
          : `${plural(findings.length, "finding", "findings")} on ${screen.id}: ${tallyOf(findings)}. No eye has looked at the pictures yet.`,
      figures: [
        { value: String(findings.length), label: "findings, one numbered note each" },
        { value: String(shots.length), label: "pictures drawn and measured" },
        { value: String(unheld.length), label: "findings no rule of this repository holds" },
      ],
      attention: shown.slice(0, 3).map((item) => ({
        title: item.title,
        detail: item.evidence[1],
      })),
      decide: unheld.map((finding) => ({
        what: `Finding ${finding.number}: make it a rule, or leave it?`,
        detail: `${TITLE[finding.kind](finding)}. ${restsOn(finding)}`,
      })),
    },
    findings: shown,
    pictures: picturesOf(shots, findings),
    register: {
      title: "Each picture, as it was drawn",
      columns: ["Picture", "State", "Width", "Theme", "Notes on it"],
      rows: shots.map((shot) => [
        named(shot),
        shot.state,
        `${shot.width}px`,
        shot.theme,
        findings
          .filter((finding) => finding.picture === shot.id)
          .map((finding) => finding.number)
          .join(", ") || "none",
      ]),
    },
    recommendations: findings.map((finding) => ({
      about: `Finding ${finding.number}`,
      what: finding.fix,
      basis: { kind: "measurement", text: MEASURED[finding.kind](finding) },
      action:
        "Change the screen, or the design system where the break comes from it, then draw and measure the screen again.",
      command: again,
    })),
    next:
      findings.length === 0
        ? []
        : [
            { command: null, why: "Fix what the findings name, the heaviest first." },
            { command: again, why: "Draw and measure again: a finding that is gone is fixed." },
          ],
    blind: blindOf(unjudged),
    empty: {
      findings:
        "The two measures found nothing on this screen. That is not a pass: no eye has looked.",
    },
  };
}
