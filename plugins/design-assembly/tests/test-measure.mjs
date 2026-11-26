// What is measured on a drawn screen, apart from the browser that draws it: the colour a reader
// sees where text stands on its ground, the ratio the level asks of it, and how the marks of many
// pictures become findings a person can count. The page itself is read by a probe that runs in the
// browser; these tests give the same code what such a probe reports.
import "./helpers/own-cores.mjs";
import assert from "node:assert/strict";
import { test } from "node:test";

import {
  findingsOf,
  marksOf,
  neededRatio,
  painted,
  ratioOf,
  SEVERITY,
} from "../scripts/measure.mjs";

const WHITE = [255, 255, 255, 1];
const BLACK = [0, 0, 0, 1];
const page = (color) => ({ color, opacity: 1 });
// A text as the probe reports it: its own colour and every layer under it, the page first.
const text = (over = {}) => ({
  path: "main > p",
  text: "Updated two days ago",
  rect: { x: 24, y: 96, width: 180, height: 24 },
  color: [154, 154, 154, 1],
  layers: [page(WHITE)],
  size: 16,
  bold: false,
  picture: false,
  ...over,
});
const probed = (over = {}) => ({
  page: { width: 320, height: 640 },
  texts: [],
  broken: [],
  cut: [],
  ...over,
});
const shot = (id, theme, over = {}) => ({
  id,
  state: "ready",
  width: 320,
  theme,
  file: `shots/${id}.png`,
  probed: probed(over),
});
const BOTH = [
  { name: "light", reachable: true },
  { name: "dark", reachable: true },
];
const DARK_UNREACHED = [
  { name: "light", reachable: true },
  { name: "dark", reachable: false, how: "no switch was found" },
];
const ROW = { id: "color-contrast", check: "tool:tools/design-assembly/check.mjs" };

test("text is measured on the colour a reader sees: every layer under it, laid one over the other", () => {
  assert.equal(ratioOf(text({ color: BLACK })), 21);
  assert.equal(ratioOf(text({ color: WHITE })), 1);
  // A ground half seen through shows the page under it: black at half strength on white is grey.
  const veiled = text({ color: BLACK, layers: [page(WHITE), page([0, 0, 0, 0.5])] });
  assert.deepEqual(painted(veiled).ground, [128, 128, 128]);
  // A text half seen through takes on its ground.
  const faint = text({ color: [0, 0, 0, 0.5] });
  assert.deepEqual(painted(faint).text, [128, 128, 128]);
  assert.ok(ratioOf(faint) < 4.5);
  // A part drawn faint fades with everything in it against what is behind: black text in a white
  // box at half strength over a black page is grey text on a grey box.
  const faded = text({
    color: BLACK,
    layers: [page(BLACK), { color: WHITE, opacity: 0.5 }],
  });
  assert.deepEqual(painted(faded), { text: [0, 0, 0], ground: [128, 128, 128] });
});

test("text on the page's own colour is measured against that colour, dark where the page follows a dark system", () => {
  const onPage = text({ color: WHITE, layers: [] });
  assert.equal(ratioOf(onPage), 1);
  assert.ok(ratioOf(onPage, [18, 18, 18]) > 15);
  const dark = marksOf(probed({ paper: [18, 18, 18], texts: [onPage] }), {
    level: "AA",
    theme: "dark",
  });
  assert.deepEqual(dark.found, []);
  const light = marksOf(probed({ texts: [onPage] }), { level: "AA", theme: "light" });
  assert.equal(light.found[0].measured.ground, "#ffffff");
});

test("a ratio does not turn on a rounding: layers are laid exactly, and written only at the end", () => {
  // Two white veils at half strength over black: laid exactly the ground is 191.25, where a
  // rounding after each layer would give 128 and then 192.
  const veils = text({
    color: BLACK,
    layers: [page(BLACK), page([255, 255, 255, 0.5]), page([255, 255, 255, 0.5])],
  });
  assert.deepEqual(painted(veils).ground, [191, 191, 191]);
});

test("a text its box shortens and says so is not a finding: it is named for a person's eye", () => {
  const marks = marksOf(
    probed({
      shortened: [
        { path: "td > span", text: "A long label", axis: "x", hidden: 40, rect: text().rect },
      ],
    }),
    { level: "AA", theme: "light" },
  );
  assert.deepEqual(marks.found, []);
  assert.deepEqual(marks.unjudged, [
    {
      kind: "text-shortened",
      key: "text-shortened|td > span",
      where: { path: "td > span", text: "A long label" },
    },
  ]);
});

test("the ratio asked of a text depends on the level and on how large the text is", () => {
  assert.equal(neededRatio("AA", { size: 16, bold: false }), 4.5);
  assert.equal(neededRatio("AA", { size: 24, bold: false }), 3);
  assert.equal(neededRatio("AA", { size: 19, bold: true }), 3);
  assert.equal(neededRatio("AA", { size: 19, bold: false }), 4.5);
  assert.equal(neededRatio("AAA", { size: 16, bold: false }), 7);
  assert.equal(neededRatio("AAA", { size: 24, bold: false }), 4.5);
  // A repository that names no level is measured at the level most products commit to.
  assert.equal(neededRatio(null, { size: 16, bold: false }), 4.5);
});

test("a picture's marks: a text below its ratio, and nothing for one that reaches it", () => {
  const marks = marksOf(
    probed({ texts: [text(), text({ path: "main > h1", text: "Orders", color: BLACK })] }),
    { level: "AA", theme: "light" },
  );
  assert.equal(marks.found.length, 1);
  const [mark] = marks.found;
  assert.equal(mark.kind, "contrast");
  assert.equal(mark.measured.ratio, 2.81);
  assert.equal(mark.measured.needed, 4.5);
  assert.equal(mark.measured.text, "#9a9a9a");
  assert.equal(mark.measured.ground, "#ffffff");
  assert.deepEqual(mark.position, { x: 24, y: 96, width: 180, height: 24 });
  // A ratio is never rounded up to the one asked: 4.499 is short of 4.5.
  const near = marksOf(probed({ texts: [text({ color: [118, 118, 118, 1] })] }), {
    level: "AA",
    theme: "light",
  });
  assert.equal(near.found.length, 0, "4.54:1 reaches 4.5:1");
  const short = marksOf(probed({ texts: [text({ color: [120, 120, 120, 1] })] }), {
    level: "AA",
    theme: "light",
  });
  assert.equal(short.found.length, 1);
  assert.ok(short.found[0].measured.ratio < 4.5);
});

test("text on a picture is not measured, and is said: it needs a person's eye", () => {
  const marks = marksOf(probed({ texts: [text({ picture: true })] }), {
    level: "AA",
    theme: "light",
  });
  assert.deepEqual(marks.found, []);
  assert.equal(marks.unjudged.length, 1);
  assert.equal(marks.unjudged[0].kind, "text-on-a-picture");
});

test("the same pair of colours in many places and many pictures is one finding", () => {
  const two = { texts: [text(), text({ path: "main > p:nth-of-type(2)", text: "Shown since" })] };
  const { findings } = findingsOf(
    [
      shot("ready-320-light", "light", two),
      { ...shot("ready-1280-light", "light", two), width: 1280 },
    ],
    { themes: BOTH, rows: [ROW], level: "AA" },
  );
  assert.equal(findings.length, 1);
  const [finding] = findings;
  assert.equal(finding.number, 1);
  assert.equal(finding.kind, "contrast");
  assert.equal(finding.severity, SEVERITY.contrast);
  assert.equal(finding.picture, "ready-320-light");
  assert.deepEqual(finding.seen_in, ["ready-320-light", "ready-1280-light"]);
  assert.equal(finding.places, 2);
  assert.deepEqual(finding.position, { x: 24, y: 96, width: 180, height: 24 });
  assert.match(finding.fix, /4\.5:1/);
});

test("a finding rests on the ledger row that speaks of it, and says plainly when none does", () => {
  const shots = [
    shot("ready-320-light", "light", {
      texts: [text()],
      broken: [{ path: "main > p", word: "Internationalization", lines: 3, rect: text().rect }],
      cut: [{ path: "main > p", text: "A long line", axis: "x", hidden: 140, rect: text().rect }],
    }),
  ];
  const held = findingsOf(shots, { themes: BOTH, rows: [ROW], level: "AA" }).findings;
  assert.deepEqual(
    held.map((finding) => [finding.number, finding.kind, finding.severity]),
    [
      [1, "contrast", "high"],
      [2, "broken-word", "medium"],
      [3, "cut-off", "medium"],
    ],
  );
  assert.deepEqual(held[0].rests_on, {
    kind: "ledger-row",
    ledger: "design/decisions.yaml",
    id: "color-contrast",
    check: ROW.check,
  });
  for (const finding of held.slice(1)) {
    assert.equal(finding.rests_on.kind, "nothing");
    assert.match(finding.rests_on.note, /no row/i);
  }
  const bare = findingsOf(shots, { themes: BOTH, rows: [], level: "AA" }).findings;
  assert.equal(bare[0].rests_on.kind, "nothing");
  assert.match(bare[0].rests_on.note, /no row .*color-contrast/);
});

test("a finding seen only in a theme no user can reach is low, and says why", () => {
  const dim = { texts: [text({ color: [63, 63, 70, 1], layers: [page([9, 9, 11, 1])] })] };
  const shots = [shot("ready-320-light", "light"), shot("ready-320-dark", "dark", dim)];
  const [reached] = findingsOf(shots, { themes: BOTH, rows: [ROW], level: "AA" }).findings;
  assert.equal(reached.severity, "high");
  assert.equal(reached.low_because, undefined);
  const [unreached] = findingsOf(shots, {
    themes: DARK_UNREACHED,
    rows: [ROW],
    level: "AA",
  }).findings;
  assert.equal(unreached.severity, "low");
  assert.match(unreached.low_because, /only in dark/);
  assert.match(unreached.low_because, /no switch was found/);
  // A break seen in light too is as heavy as it is there: only what no user meets is low.
  const word = { broken: [{ path: "nav > a", word: "Dashboard", lines: 2, rect: text().rect }] };
  const both = [shot("ready-320-light", "light", word), shot("ready-320-dark", "dark", word)];
  const [kept] = findingsOf(both, { themes: DARK_UNREACHED, rows: [ROW], level: "AA" }).findings;
  assert.equal(kept.severity, "medium");
  assert.deepEqual(kept.seen_in, ["ready-320-light", "ready-320-dark"]);
});

test("findings are numbered the heaviest first, and the same pictures give the same numbers", () => {
  const shots = [
    shot("ready-320-light", "light", {
      broken: [{ path: "nav > a", word: "Dashboard", lines: 2, rect: text().rect }],
      texts: [text()],
    }),
  ];
  const once = findingsOf(shots, { themes: BOTH, rows: [ROW], level: "AA" });
  assert.deepEqual(
    once.findings.map((finding) => [finding.number, finding.severity]),
    [
      [1, "high"],
      [2, "medium"],
    ],
  );
  assert.deepEqual(findingsOf(shots, { themes: BOTH, rows: [ROW], level: "AA" }), once);
});
