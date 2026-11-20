// The design review record: what a review found on one drawn screen, set on the frame every
// document of this plugin shares. The pictures carry numbered notes, one for each finding; the
// findings stand by severity, the machine's and an eye's alike, each with what becomes of it; and
// the last part says what was not seen: that no eye has looked at the pictures, or what the words
// of the eye that did cannot tell. Built from the facts of the answer for a machine and from
// nothing else, so the same facts give the same page.
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { SLIPS_FILE } from "../templates/tools/design-assembly/governance.mjs";
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
  seen: ({ by, where }) => `Seen by ${by}: ${where.text}`,
};
export const titleOf = (finding) => TITLE[finding.kind](finding);
const MEASURED = {
  contrast: ({ measured, places }) =>
    `Text ${measured.text} on ${measured.ground}, at ${measured.size}px${measured.bold ? " bold" : ""}: ${measured.ratio}:1, and the level asks ${measured.needed}:1. The same two colours stand at ${plural(places, "place", "places")} of the screen.`,
  "broken-word": ({ measured }) =>
    `The word has no break of the writer's own and stands on ${measured.lines} lines.`,
  "cut-off": ({ measured }) =>
    `${measured.hidden}px of the text lie outside the box that hides what does not fit, ${measured.axis === "x" ? "across" : "down"} the page.`,
  seen: ({ by }) => `${by} saw this on the picture, in its own words; no machine measured it.`,
};
function restsOn({ rests_on: on }) {
  if (on.kind === "ledger-row") {
    return `Rests on row ${on.id} of ${on.ledger}${on.check ? `, held by ${on.check}` : ", which no check holds"}.`;
  }
  if (on.kind === "rule-line") {
    return `Rests on line ${on.line} of ${on.file}, ${quoted(on.text)}, under ${quoted(on.section)}${on.held ? ", which the gate holds" : ", which no check holds"}.`;
  }
  if (on.kind === "principle") {
    return `Rests on the principle ${on.id} the owner fixed: ${quoted(on.statement)}.`;
  }
  return `Rests on nothing this repository has decided: ${on.note}.`;
}
// What becomes of a finding, in one sentence of its evidence.
function harvestWords(entry) {
  if (entry.group === "escape") {
    return `A check let it through: add this line to ${entry.file} before the fix: ${entry.line}`;
  }
  if (entry.group === "question") {
    const where = entry.queued?.file
      ? `it is on the waiting list, as ${entry.queued.id}`
      : entry.queued?.waits
        ? `it waits on the owner already, as ${entry.queued.waits}`
        : entry.queued?.answered
          ? `the owner answered it already, in ${entry.queued.answered}`
          : "the review with --queue puts it on the waiting list";
    return `A question for the owner, since no check holds what it rests on: ${where}.`;
  }
  return "For a person's eye: it rests on nothing, and no question is asked until someone takes it up.";
}
const pictureOf = (shots, id) => shots.find((shot) => shot.id === id);
// What a recommendation to fix a finding rests on: what was measured, the principle or the rule
// an eye named, or, for an eye's finding that rests on nothing, no recommendation at all.
function basisOf(finding) {
  if (finding.kind !== "seen")
    return { kind: "measurement", text: MEASURED[finding.kind](finding) };
  const on = finding.rests_on;
  if (on.kind === "principle") return { kind: "principle", text: `${on.id}: ${on.statement}` };
  if (on.kind === "nothing") return null;
  return { kind: "standard", text: restsOn(finding) };
}
const named = (shot) => shot.file ?? shot.id;

// Where on its picture a finding's note is, in words: the place measured or named, or the whole
// picture where an eye named none.
function placeWords(finding, shot) {
  const { x, y, width, height } = finding.position;
  const whole =
    finding.kind === "seen" &&
    x === 0 &&
    y === 0 &&
    width === shot?.page?.width &&
    height === shot?.page?.height;
  if (whole)
    return `Note ${finding.number} on ${named(shot)}, over the whole picture: the eye named no place.`;
  const what = finding.where.path ?? "the place the eye named";
  return `Note ${finding.number} on ${named(shot)}, at ${x}, ${y} of the page (${width} × ${height} px): ${what}.`;
}

function findingOf(finding, shots, entry) {
  return {
    number: finding.number,
    severity: finding.severity,
    title: TITLE[finding.kind](finding),
    detail: finding.low_because ? `Low because it is ${finding.low_because}.` : null,
    evidence: [
      MEASURED[finding.kind](finding),
      placeWords(finding, pictureOf(shots, finding.picture)),
      `Seen on ${finding.seen_in.length} of ${plural(shots.length, "picture", "pictures")}: ${finding.seen_in.join(", ")}.`,
      restsOn(finding),
      ...(entry ? [harvestWords(entry)] : []),
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

// What the record did not see: that no eye looked, or what the words of the eye that did cannot
// tell; what on this screen could not be measured or drawn, and the findings that rest on nothing;
// and the open limits of the review and of every document.
function blindOf(result) {
  const { unjudged, eye: looked, findings, harvest } = result;
  const eye = eyeLimit();
  const open = (area) => LIMITS.filter((row) => row.area === area && row.status === "open");
  const group = (title, rows) => rows.map(({ id, note }) => ({ group: title, id, note }));
  const person = "On this screen, for a person's eye";
  return [
    ...(looked.looked
      ? group(`What the words of ${looked.by} cannot tell`, eye ? [eye] : [])
      : group("No eye yet", [
          { id: "no-eye", note: `No eye has looked at the pictures: ${looked.why}.` },
          ...(eye ? [eye] : []),
        ])),
    ...unjudged.map((item) => ({
      group: person,
      id: item.kind,
      note: UNJUDGED_NOTE[item.kind](item),
    })),
    ...harvest
      .filter((entry) => entry.group === "person")
      .map((entry) => {
        const finding = findings.find((item) => item.number === entry.finding);
        return {
          group: person,
          id: `finding-${entry.finding}`,
          note: `Finding ${entry.finding}, ${titleOf(finding)}: it rests on nothing, and no question is asked until someone takes it up.`,
        };
      }),
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
    ...(result.eye.looked
      ? [
          `Looked at by ${result.eye.by}, a reviewer the socket board names, with the pictures and the pack: ${plural(result.eye.findings, "finding", "findings")} of its own`,
        ]
      : []),
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
  const { screen, findings, shots, harvest, eye } = result;
  const entryOf = (finding) => harvest.find((entry) => entry.finding === finding.number);
  const shown = findings.map((finding) => findingOf(finding, shots, entryOf(finding)));
  // What no check holds: a question for the owner, or a finding for a person's eye.
  const open = findings.filter((finding) =>
    ["question", "person"].includes(entryOf(finding)?.group),
  );
  const escaped = harvest.filter((entry) => entry.group === "escape");
  const unasked = harvest.filter((entry) => entry.group === "question" && !entry.queued);
  const asked = harvest.filter((entry) => entry.group === "question" && entry.queued);
  const again = `${REVIEW} ${screen.id}`;
  const looked = eye.looked
    ? `${eye.by} looked at the pictures; ${plural(eye.findings, "finding is", "findings are")} its own.`
    : "No eye has looked at the pictures yet.";
  return {
    kind: "design-review",
    title: "Design review record",
    lede: eye.looked
      ? "One screen as it is drawn, what a machine measured on it and what an eye saw, and what becomes of each finding."
      : "One screen as it is drawn, what a machine measured on it, and what still waits for an eye.",
    origin,
    version: VERSION,
    scope: scopeOf(result),
    decision: {
      conclusion:
        findings.length === 0
          ? eye.looked
            ? `Neither the two measures nor ${eye.by} found anything on ${screen.id}.`
            : `The two measures found nothing on ${screen.id}; no eye has looked at it yet.`
          : `${plural(findings.length, "finding", "findings")} on ${screen.id}: ${tallyOf(findings)}. ${looked}`,
      figures: [
        { value: String(findings.length), label: "findings, one numbered note each" },
        { value: String(shots.length), label: "pictures drawn and measured" },
        { value: String(open.length), label: "findings no check of this repository holds" },
      ],
      attention: shown.slice(0, 3).map((item) => ({
        title: item.title,
        detail: item.evidence[1],
      })),
      decide: open.map((finding) => ({
        what: `Finding ${finding.number}: make it a rule, or leave it?`,
        detail: `${titleOf(finding)}. ${restsOn(finding)} ${harvestWords(entryOf(finding))}`,
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
    recommendations: findings
      .filter((finding) => basisOf(finding) !== null)
      .map((finding) => ({
        about: `Finding ${finding.number}`,
        what: finding.fix,
        basis: basisOf(finding),
        action:
          "Change the screen, or the design system where the break comes from it, then draw and measure the screen again.",
        command: again,
      })),
    next:
      findings.length === 0
        ? []
        : [
            ...(escaped.length > 0
              ? [
                  {
                    command: null,
                    why: `Add the line of each finding a check let through to ${SLIPS_FILE}, before the fix: ${plural(escaped.length, "line", "lines")}.`,
                  },
                ]
              : []),
            { command: null, why: "Fix what the findings name, the heaviest first." },
            ...(unasked.length > 0
              ? [
                  {
                    command: `${again} --queue`,
                    why: `Put ${plural(unasked.length, "question", "questions")} for the owner on the waiting list: the review writes one new file each and nothing else.`,
                  },
                ]
              : []),
            ...(asked.length > 0
              ? [
                  {
                    command: "/design-assembly:decide",
                    why: "The owner answers the questions on the decision sheet: a rule, or left as it is.",
                  },
                ]
              : []),
            { command: again, why: "Draw and measure again: a finding that is gone is fixed." },
          ],
    blind: blindOf(result),
    empty: {
      findings:
        "The two measures found nothing on this screen. That is not a pass: no eye has looked.",
    },
  };
}
