// What a machine can measure on a drawn screen, with no model called: whether text reaches the
// contrast ratio on the ground it stands on, and whether text is broken inside a word or cut off by
// its box. Two halves, kept apart from any command so that a check could use them too:
//
//   probe()      runs inside the page and reports what is there: each text with its colour and the
//                layers under it, each word laid on more than one line, each text its box cuts.
//   the rest     plain functions on what a probe reports: the colour a reader sees, the ratio
//                asked, the marks of one picture, and the findings of many pictures.
//
// Nothing here reads a file, a clock or a browser of its own: the same reports give the same
// findings.
import { LEDGER } from "../templates/tools/design-assembly/ledger.mjs";
import { THRESHOLDS } from "../templates/tools/design-assembly/theme.mjs";

// The kinds of finding, and how heavy each is where a user meets it. A text a reader cannot read is
// broken today; a word broken or a line cut holds less than it says.
export const SEVERITY = { contrast: "high", "broken-word": "medium", "cut-off": "medium" };
const ORDER = ["high", "medium", "low"];
// The row of the decisions ledger each kind rests on, where a repository keeps one.
const ROW_OF = { contrast: "color-contrast" };
// The level a repository that names none is measured at, and the ratio large text is asked at each.
const DEFAULT_LEVEL = "AA";
const LARGE_TEXT = { AA: 3, AAA: 4.5 };
// Large text, in CSS pixels: 18 points, or 14 points when bold.
const LARGE_PX = 24;
const LARGE_BOLD_PX = 18.66;

// ---- inside the page ------------------------------------------------------------------------------

// Reads the page it is run in. It is sent to the browser as text, so it uses nothing from outside
// itself. Every place is given in the page's own pixels from its top left corner, whatever is
// scrolled. A text is the words an element holds itself, not those of the elements inside it.
export function probe() {
  const { document, getComputedStyle, NodeFilter, scrollX, scrollY } = globalThis;
  const SKIPPED = new Set(["SCRIPT", "STYLE", "NOSCRIPT", "TEMPLATE", "OPTION", "TITLE"]);
  // A break after a dash of any kind, a slash, a soft hyphen or a zero-width space is the writer's
  // own; scripts written without spaces break anywhere.
  const OWN_BREAK = /[\p{Pd}/\u00ad\u200b]/u;
  const NO_SPACES =
    /[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Hangul}\p{Script=Thai}\p{Script=Lao}\p{Script=Khmer}\p{Script=Myanmar}]/u;
  const TOO_SMALL = 4;
  const XHTML = "http://www.w3.org/1999/xhtml";
  const ROOTS = new Set([document.documentElement, document.body]);

  // Any colour the browser can write, as the red, green, blue and strength it paints.
  const canvas = document.createElement("canvas");
  canvas.width = 1;
  canvas.height = 1;
  const pen = canvas.getContext("2d", { willReadFrequently: true });
  const known = new Map();
  const rgba = (css) => {
    if (!known.has(css)) {
      pen.clearRect(0, 0, 1, 1);
      pen.fillStyle = "rgba(0, 0, 0, 0)";
      pen.fillStyle = css;
      pen.fillRect(0, 0, 1, 1);
      const [r, g, b, a] = pen.getImageData(0, 0, 1, 1).data;
      known.set(css, [r, g, b, Math.round((a / 255) * 1000) / 1000]);
    }
    return known.get(css);
  };
  const styles = new Map();
  const styleOf = (element) => {
    if (!styles.has(element)) styles.set(element, getComputedStyle(element));
    return styles.get(element);
  };
  const round = (value) => Math.round(value * 10) / 10;
  const placed = (box) => ({
    x: round(box.left + scrollX),
    y: round(box.top + scrollY),
    width: round(box.right - box.left),
    height: round(box.bottom - box.top),
  });
  const around = (boxes) => ({
    left: Math.min(...boxes.map((box) => box.left)),
    top: Math.min(...boxes.map((box) => box.top)),
    right: Math.max(...boxes.map((box) => box.right)),
    bottom: Math.max(...boxes.map((box) => box.bottom)),
  });
  const boxesOf = (node, from = 0, to = node.data.length) => {
    const range = document.createRange();
    range.setStart(node, from);
    range.setEnd(node, to);
    return [...range.getClientRects()].filter((box) => box.width > 0 && box.height > 0);
  };
  // Where an element is, by its tags from the nearest element that has a name of its own.
  const pathOf = (element) => {
    const steps = [];
    for (let at = element; at && at !== document.documentElement; at = at.parentElement) {
      if (at.id) {
        steps.unshift(`#${at.id}`);
        break;
      }
      const tag = at.tagName.toLowerCase();
      const twins = [...(at.parentElement?.children ?? [])].filter(
        (other) => other.tagName === at.tagName,
      );
      steps.unshift(twins.length > 1 ? `${tag}:nth-of-type(${twins.indexOf(at) + 1})` : tag);
    }
    return steps.join(" > ");
  };
  const wordsOf = (text) => text.replace(/\s+/g, " ").trim().slice(0, 80);

  // The colour the browser paints the page itself in, under every element: white, or a dark one
  // where the page says it follows a dark system. Read off an element that is there for a moment.
  const sheet = document.createElement("div");
  sheet.style.cssText = "position:absolute;width:0;height:0;background-color:Canvas";
  document.documentElement.append(sheet);
  const paper = rgba(getComputedStyle(sheet).backgroundColor).slice(0, 3);
  sheet.remove();
  const page = {
    width: document.documentElement.scrollWidth,
    height: document.documentElement.scrollHeight,
  };
  // Whether a place is on the page at all: what lies wholly beyond it is in no picture.
  const onPage = ({ x, y, width, height }) =>
    x < page.width && y < page.height && x + width > 0 && y + height > 0;

  // The elements that hold words a reader can see, each with the text nodes that are its own.
  const holders = new Map();
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    const element = node.parentElement;
    if (!element || node.data.trim() === "" || SKIPPED.has(element.tagName)) continue;
    // Words drawn inside a drawing are painted by its own rules, not as text on a ground.
    if (element.namespaceURI !== XHTML) continue;
    if (
      element.checkVisibility &&
      !element.checkVisibility({ checkVisibilityCSS: true, checkOpacity: true })
    )
      continue;
    const boxes = boxesOf(node);
    // Words kept for a screen reader alone sit in a box of one pixel: nobody sees them.
    if (boxes.length === 0 || boxes.every((box) => box.width <= 1 || box.height <= 1)) continue;
    if (!holders.has(element)) holders.set(element, []);
    holders.get(element).push({ node, boxes });
  }

  // The layers under a text, the page first: each ground an element paints and how faint the
  // element is drawn. `picture` says a picture or a gradient lies under the text before any ground
  // that hides it, so no one colour can be named.
  const layersOf = (element) => {
    const layers = [];
    let picture = false;
    let hidden = false;
    for (let at = element; at; at = at.parentElement) {
      const style = styleOf(at);
      const color = rgba(style.backgroundColor);
      const opacity = Number(style.opacity);
      if (!hidden && style.backgroundImage !== "none") picture = true;
      if (color[3] > 0 || opacity < 1) layers.unshift({ color, opacity });
      if (color[3] === 1) hidden = true;
    }
    return { layers, picture };
  };

  // The box that cuts an element's text along one axis: the nearest one that hides what does not
  // fit. One that scrolls instead cuts nothing, and the page itself is only read across.
  const cutterOf = (element, axis) => {
    for (let at = element; at; at = at.parentElement) {
      const how = styleOf(at)[axis === "x" ? "overflowX" : "overflowY"];
      if (how === "auto" || how === "scroll") return null;
      if (how === "hidden" || how === "clip") return ROOTS.has(at) && axis === "y" ? null : at;
    }
    return null;
  };
  const hiddenBy = (element, box, size) => {
    for (const axis of ["x", "y"]) {
      const cutter = cutterOf(element, axis);
      if (!cutter) continue;
      const edge = ROOTS.has(cutter)
        ? { left: 0, right: document.documentElement.clientWidth, top: 0, bottom: 0 }
        : cutter.getBoundingClientRect();
      const [low, high, from, to] =
        axis === "x"
          ? [edge.left, edge.right, box.left, box.right]
          : [edge.top, edge.bottom, box.top, box.bottom];
      // A box with no room at all hides its text on purpose: a closed panel, not a cut line.
      if (high - low < TOO_SMALL) continue;
      // A text wholly outside the box is kept off the screen on purpose, as a panel not yet
      // slid in: only a text shown in part is cut.
      if (to <= low || from >= high) continue;
      const over = Math.max(to - high, low - from);
      // Down the page a text box is a little taller than its line; only a real line counts.
      if (over > (axis === "x" ? 1 : Math.max(2, size * 0.3))) {
        const shown =
          axis === "x"
            ? { ...box, left: Math.max(from, low), right: Math.min(to, high) }
            : { ...box, top: Math.max(from, low), bottom: Math.min(to, high) };
        // A box that shortens its text and says so, with an ellipsis or a limit of lines.
        const how = styleOf(cutter);
        const clamp = how.webkitLineClamp;
        const marked =
          (axis === "x" && how.textOverflow === "ellipsis") ||
          (clamp !== undefined && clamp !== "" && clamp !== "none");
        return { axis, hidden: round(over), shown, marked };
      }
    }
    return null;
  };

  // The first word of a text node that turns onto another line where the writer put no break. A
  // letter starts a new line when it stands lower than the middle of the one before it: letters of
  // one line may sit a pixel apart where two fonts meet.
  const brokenIn = (node) => {
    for (const found of node.data.matchAll(/\S+/gu)) {
      const [word] = found;
      if (word.length < 2 || NO_SPACES.test(word)) continue;
      const boxes = boxesOf(node, found.index, found.index + word.length);
      if (new Set(boxes.map((box) => Math.round(box.top))).size < 2) continue;
      const turns = [];
      let middle = null;
      for (let at = 0; at < word.length; at += 1) {
        const [box] = boxesOf(node, found.index + at, found.index + at + 1);
        if (!box) continue;
        if (middle !== null && box.top > middle) turns.push(at);
        middle = box.top + box.height / 2;
      }
      if (turns.some((at) => !OWN_BREAK.test(word[at - 1]))) {
        return { word: word.slice(0, 80), lines: turns.length + 1, boxes };
      }
    }
    return null;
  };

  const report = { texts: [], broken: [], cut: [], shortened: [] };
  for (const [element, own] of holders) {
    const box = around(own.flatMap((item) => item.boxes));
    if (!onPage(placed(box))) continue;
    const style = styleOf(element);
    const path = pathOf(element);
    const text = wordsOf(own.map((item) => item.node.data).join(" "));
    const size = parseFloat(style.fontSize);
    // A control that cannot be used is asked no ratio.
    if (!element.closest(":disabled, [aria-disabled='true']")) {
      report.texts.push({
        path,
        text,
        rect: placed(box),
        color: rgba(style.color),
        ...layersOf(element),
        size,
        bold: Number(style.fontWeight) >= 700,
      });
    }
    for (const item of own) {
      const found = brokenIn(item.node);
      if (!found) continue;
      report.broken.push({
        path,
        word: found.word,
        lines: found.lines,
        rect: placed(around(found.boxes)),
      });
      break;
    }
    const cut = hiddenBy(element, box, size);
    if (cut) {
      (cut.marked ? report.shortened : report.cut).push({
        path,
        text,
        axis: cut.axis,
        hidden: cut.hidden,
        rect: placed(cut.shown),
      });
    }
  }
  return { page, paper, ...report };
}

// ---- the colour a reader sees ---------------------------------------------------------------------

// The page colour taken where a probe reports none.
const PAPER = [255, 255, 255];
// One colour laid over another at a strength, channel by channel. Nothing is rounded until the
// colour is written: a ratio near the one asked must not turn on a rounding.
const blend = (top, under, strength) =>
  [0, 1, 2].map((at) => top[at] * strength + under[at] * (1 - strength));

// What is painted where a text stands, and beside it: each layer over the one behind, the text
// last. A layer drawn faint fades with everything in it against what was behind it.
function paint(layers, at, behind, text) {
  if (at === layers.length) return text ? blend(text, behind, text[3]) : behind;
  const { color, opacity } = layers[at];
  const within = paint(layers, at + 1, blend(color, behind, color[3]), text);
  return blend(within, behind, opacity);
}
const exact = (sample, paper) => ({
  text: paint(sample.layers, 0, paper, sample.color),
  ground: paint(sample.layers, 0, paper, null),
});

// The two colours of a text as the probe reports it, as they are written: the text itself and the
// ground beside it. `paper` is the colour of the page under every layer.
export function painted(sample, paper = PAPER) {
  const { text, ground } = exact(sample, paper);
  return { text: text.map(Math.round), ground: ground.map(Math.round) };
}

const hex = (color) => `#${color.map((channel) => channel.toString(16).padStart(2, "0")).join("")}`;
// Relative luminance and the contrast ratio as WCAG defines them, from the colour as painted.
const linear = (channel) =>
  channel / 255 <= 0.04045 ? channel / 255 / 12.92 : ((channel / 255 + 0.055) / 1.055) ** 2.4;
const luminance = ([r, g, b]) => 0.2126 * linear(r) + 0.7152 * linear(g) + 0.0722 * linear(b);
function exactRatio({ text, ground }) {
  const [high, low] = [luminance(text), luminance(ground)].sort((x, y) => y - x);
  return (high + 0.05) / (low + 0.05);
}
// A ratio as it is written: cut to two places, never rounded up to the one asked.
const written = (ratio) => Math.floor(ratio * 100 + 1e-9) / 100;

// The contrast ratio of a text against its ground, as it is written.
export const ratioOf = (sample, paper = PAPER) => written(exactRatio(exact(sample, paper)));

// The ratio the level asks of a text of this size.
export function neededRatio(level, { size, bold }) {
  const named = level in THRESHOLDS ? level : DEFAULT_LEVEL;
  const large = size >= LARGE_PX || (bold && size >= LARGE_BOLD_PX);
  return large ? LARGE_TEXT[named] : THRESHOLDS[named].text;
}

// ---- one picture ----------------------------------------------------------------------------------

// What one picture shows broken, and what on it could not be measured. A mark's `key` says which
// break it is, so the same break on another picture is known for the same.
export function marksOf(probed, { level, theme }) {
  const found = [];
  const unjudged = [];
  const paper = probed.paper ?? PAPER;
  for (const sample of probed.texts ?? []) {
    const where = { path: sample.path, text: sample.text };
    if (sample.picture) {
      unjudged.push({ kind: "text-on-a-picture", key: `text-on-a-picture|${sample.path}`, where });
      continue;
    }
    const needed = neededRatio(level, sample);
    const ratio = exactRatio(exact(sample, paper));
    if (ratio >= needed) continue;
    const colors = painted(sample, paper);
    const pair = { text: hex(colors.text), ground: hex(colors.ground) };
    found.push({
      kind: "contrast",
      // The same two colours in a theme are one thing to fix, wherever they are used.
      key: `contrast|${theme}|${pair.text}|${pair.ground}|${needed}`,
      where,
      position: sample.rect,
      measured: { ratio: written(ratio), needed, ...pair, size: sample.size, bold: sample.bold },
    });
  }
  for (const word of probed.broken ?? []) {
    found.push({
      kind: "broken-word",
      key: `broken-word|${word.path}|${word.word}`,
      where: { path: word.path, text: word.word },
      position: word.rect,
      measured: { lines: word.lines },
    });
  }
  for (const line of probed.cut ?? []) {
    found.push({
      kind: "cut-off",
      key: `cut-off|${line.path}`,
      where: { path: line.path, text: line.text },
      position: line.rect,
      measured: { axis: line.axis, hidden: line.hidden },
    });
  }
  // A text its box shortens and says so is no break: whether what is hidden matters is for a person.
  for (const line of probed.shortened ?? []) {
    unjudged.push({
      kind: "text-shortened",
      key: `text-shortened|${line.path}`,
      where: { path: line.path, text: line.text },
    });
  }
  return { found, unjudged };
}

// ---- many pictures --------------------------------------------------------------------------------

const FIX = {
  contrast: ({ needed }) =>
    `Give the text a colour that reaches ${needed}:1 on this ground, or change the ground. Where the two colours are roles of the design system, change the role, not this one place.`,
  "broken-word": () =>
    "Let the word stay on one line: give it room, shorten it, or let the line turn between words only.",
  "cut-off": () =>
    "Give the text room, let it turn onto another line, or show the whole of it another way: a reader cannot see what is cut.",
};

// What a finding rests on: the row of the decisions ledger that speaks of it, or, said plainly,
// nothing. `rows` are the rows the repository keeps.
function restsOn(kind, rows) {
  const id = ROW_OF[kind];
  if (!id) {
    return {
      kind: "nothing",
      note: "no row of the decisions ledger is about text broken inside a word or cut off",
    };
  }
  const row = rows.find((candidate) => candidate.id === id);
  if (!row) {
    return {
      kind: "nothing",
      note: `the decisions ledger of this repository has no row ${id}`,
    };
  }
  return { kind: "ledger-row", ledger: LEDGER, id, check: row.check ?? null };
}

// The findings of the pictures of one screen, the heaviest first, each numbered: one for each
// break, however many pictures show it. Its note goes on the first picture that shows it.
// `themes` say which themes a user can reach: a break seen only where no user can come is low,
// and says why. Also what could not be measured, each place once.
export function findingsOf(shots, { themes, rows = [], level = null }) {
  const unreached = new Map(
    themes.filter((theme) => !theme.reachable).map((theme) => [theme.name, theme.how]),
  );
  const breaks = new Map();
  const unseen = new Map();
  for (const shot of shots) {
    const marks = marksOf(shot.probed, { level, theme: shot.theme });
    for (const mark of marks.found) {
      if (!breaks.has(mark.key)) breaks.set(mark.key, { ...mark, shots: [], places: new Set() });
      const known = breaks.get(mark.key);
      if (!known.shots.includes(shot)) known.shots.push(shot);
      known.places.add(mark.where.path);
    }
    for (const item of marks.unjudged) {
      if (!unseen.has(item.key)) {
        unseen.set(item.key, { kind: item.kind, where: item.where, seen_in: [] });
      }
      unseen.get(item.key).seen_in.push(shot.id);
    }
  }
  const found = [...breaks.values()].map((mark) => {
    const hidden = mark.shots.every((shot) => unreached.has(shot.theme));
    const [first] = mark.shots;
    return {
      kind: mark.kind,
      severity: hidden ? "low" : SEVERITY[mark.kind],
      where: mark.where,
      picture: first.id,
      position: mark.position,
      measured: mark.measured,
      seen_in: mark.shots.map((shot) => shot.id),
      places: mark.places.size,
      fix: FIX[mark.kind](mark.measured),
      rests_on: restsOn(mark.kind, rows),
      ...(hidden
        ? {
            low_because: `seen only in ${first.theme}, which no user of the application can reach yet: ${unreached.get(first.theme)}`,
          }
        : {}),
    };
  });
  // The heaviest first; among equals, the order the pictures showed them in.
  const sorted = ORDER.flatMap((severity) => found.filter((item) => item.severity === severity));
  return {
    findings: sorted.map((finding, index) => ({ number: index + 1, ...finding })),
    unjudged: [...unseen.values()],
  };
}
