// The design system of a repository as a book a person can be handed: what the screens are built
// from, shown; what holds each decision, counted; what is still open, said.
//
// Every value on a page is read from the repository, never typed: the design tokens file, the
// stylesheet, the ledger, the screen registry. The pictures are the repository's own screens. The
// book is drawn in the system it describes: its colours, its type sizes, its corner radius.
// Usage: node book.mjs --target DIR [--audience client|builder] [--format html|pdf|png]
//          [--words FILE] [--out DIR] [--facts]
//        node book.mjs --target DIR --check BOOK.html
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, realpathSync, writeFileSync } from "node:fs";
import path from "node:path";
import { argv, exit, stderr, stdout } from "node:process";
import { fileURLToPath, pathToFileURL } from "node:url";

import { contrast, parseColor } from "../templates/tools/design-assembly/color.mjs";
import { REGISTRY as COMPONENTS } from "../templates/tools/design-assembly/components.mjs";
import { readSources } from "../templates/tools/design-assembly/governance.mjs";
import { REGISTRY } from "../templates/tools/design-assembly/patterns.mjs";
import { toPx, toRatio } from "../templates/tools/design-assembly/scale.mjs";
import {
  readKinds,
  readPages,
  screenFiles,
  SIZES_FILE,
} from "../templates/tools/design-assembly/screens.mjs";
import {
  DEFAULT_STYLESHEET,
  findStylesheet,
  loadStyles,
  resolve,
} from "../templates/tools/design-assembly/styles.mjs";
import { buildTheme, THRESHOLDS } from "../templates/tools/design-assembly/theme.mjs";
import { TOKENS } from "../templates/tools/design-assembly/tokens.mjs";
import { inventory } from "./inventory.mjs";
import { openStage } from "./stage.mjs";

export const OUT = "coverage/design-book";
// A repository's own words for the book, in the language its documents are written in.
export const WORDS_FILE = "design/book-words.json";
const FACTS_ID = "design-book-facts";
const TONES = [0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 95, 98, 99, 100];
// The roles a person meets on a screen, in the order they are shown. The rest are listed small.
const SURFACES = ["background", "card", "popover", "muted", "secondary", "accent", "primary"];
const LINES = ["border", "input", "ring"];
const SPACING_STEPS = [1, 2, 3, 4, 6, 8, 12];

// Every label the book prints. A repository replaces any of them in its own words file.
export const WORDS = {
  title: "Design system",
  lede: "What this product's screens are built from, what holds each decision in place, and what is still open.",
  revision: "state of the repository",
  contents: "In this book",
  decisions: "Decisions",
  decisionsLede: "of the decisions every design system has to answer are answered here.",
  held: "held by a check that runs",
  claimed: "named by a check that was not run again",
  recorded: "a person's call, written down",
  unconfirmed: "of those are a proposal nobody has confirmed yet",
  open: "open",
  tiers: "How far it reaches",
  tierStates: {
    reached: "reached",
    claimed: "complete, resting on checks not run again",
    missing: "not reached",
    blocked: "complete, but an earlier one is not",
  },
  stillOpen: "Still open",
  nothingOpen: "No core decision is open.",
  // A core decision's question, by its id, in the repository's own language.
  questions: {},
  colorTitle: "Colour",
  colorQuestion: "Which colours there are, and what may sit on what",
  colorLede:
    "A colour is used by its role, never by its value. Each role is shown on the ground it sits on, in light and in dark, with the contrast ratio its text reaches.",
  source: "source color",
  sourceKept: "the primary is the source color itself",
  sourceMoved: "the primary moved from the source to reach the contrast ratio",
  light: "light",
  dark: "dark",
  textOnGround: "Text on its ground",
  lines: "Lines",
  palette: "Tonal palette of the primary",
  otherRoles: "Other roles the stylesheet declares",
  needs: "needs",
  heldTag: "held",
  notRead: "not measured",
  typeTitle: "Type and shape",
  typeQuestion: "Which sizes, which corners, which distances",
  typeLede: "Every size, corner and distance on a screen is one of these steps.",
  typeScale: "Type scale",
  sample: "The quick brown fox 0123456789",
  fontStack: "font",
  fontNote:
    "The font file is not inside this book: a device without it shows the next one in the list.",
  radius: "Corner radius",
  spacing: "Spacing scale",
  unit: "unit",
  target: "Smallest control",
  componentsTitle: "Components",
  componentsQuestion: "Which pieces the screens are built from, and the forms each takes",
  componentsLede:
    "The repository's own components, drawn from its source: one row for each thing a component can vary by, every other one left as it is by default.",
  atLeast: "at least",
  notAlone: "not drawn, needs another component around it",
  listedTitle: "Listed in the component manifest",
  listedLede: "None could be drawn here, so this is only the list the repository keeps.",
  runningSample: "the file the page names as its running sample",
  noWidths: "The repository does not list the widths it checks in a file this book reads.",
  partsTitle: "Parts",
  partsLede:
    "These work only inside another component. They are seen where they are used, on the screens.",
  kindsTitle: "Kinds of screen",
  kindsQuestion: "What each kind of screen is for, and what it is built like",
  kindsLede:
    "A new screen is one of these kinds. It is built like the kind's reference screen, shown here beside what the repository says about the kind.",
  referenceScreen: "reference screen",
  noKinds: "No kind of screen is described yet.",
  pathsTitle: "Paths",
  pathsQuestion: "How a person gets from one state to the next",
  pathsLede:
    "Every state of a screen, joined by the action that leads to it. Read from the repository's own list of states, and drawn from its own screens.",
  whenData: "when the data answers",
  afterAction: "After an action",
  noPaths:
    "The paths are drawn from the screens themselves: without a browser there is nothing to draw.",
  statesTitle: "States",
  statesQuestion: "What every screen shows, in every state",
  statesLede:
    "The repository's own screens, drawn as a person meets them. Each state is checked in a browser at these widths.",
  kind: "kind of screen",
  task: "main task",
  reached: "reached by",
  opens: "opening the screen",
  scenario: "the data answers",
  press: "press",
  fill: "type into",
  closeTitle: "What this book does not show",
  closeLede: "A book that claims more than it shows is worse than none.",
  notShown: [
    "A component in use: pressed, focused, or with real content in it. The sheet draws each one at rest.",
    "The components in dark: they are drawn in light.",
    "What a state looks like while it changes: the pictures are of states at rest.",
    "Whether the result looks right. No check measures that: a person looks.",
  ],
  staysTrue: "How it stays true",
  staysTrueText:
    "This book is drawn from the repository each time. It keeps a list of every value it shows; when the repository changes, checking the book against it says so.",
  commands: "For the person who builds",
  noPictures: "No picture could be drawn here: the repository has no browser to draw with.",
};

const escape = (text) =>
  String(text).replace(
    /[&<>"]/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c],
  );

function ratio(text, ground) {
  const a = parseColor(String(text ?? ""));
  const b = parseColor(String(ground ?? ""));
  // A colour with transparency sits on whatever is under it: no single ratio can be given.
  if (!a || !b || /\//.test(String(text)) || /\//.test(String(ground))) return null;
  return Number(contrast(a, b).toFixed(2));
}

// Everything the book says, as data. Read from the repository and from nothing else, so the same
// state of the repository gives the same facts.
export function collectFacts(target) {
  const read = (file) =>
    existsSync(path.join(target, file)) ? readFileSync(path.join(target, file), "utf8") : null;
  const json = (file) => {
    try {
      return JSON.parse(read(file) ?? "null");
    } catch {
      return null;
    }
  };
  const theme = json("design/theme.json") ?? {};
  const stylesheet = theme.stylesheet ?? findStylesheet(target) ?? DEFAULT_STYLESHEET;
  const styles = loadStyles(target, stylesheet);
  const tokens = json(TOKENS) ?? {};
  const level = theme.inputs?.conformanceLevel ?? null;
  const min = THRESHOLDS[level]?.text ?? null;
  const value = (name) => resolve(styles, ":root", name)?.value ?? null;

  const colors = Object.entries(tokens.color ?? {}).map(([name, token]) => ({
    name,
    light: token.$value,
    dark: token.$extensions?.["design-assembly"]?.dark ?? token.$value,
  }));
  const color = (name) => colors.find((item) => item.name === name);
  // The pairs the gate itself checks, so the book can say which ratios are held and which are
  // only measured here.
  const heldPairs = (theme.checks?.["color-contrast"] ?? []).map(
    (check) => `${check.foreground.replace(/^--/, "")} on ${check.background.replace(/^--/, "")}`,
  );
  const pair = (text, ground) => {
    const a = color(text);
    const b = color(ground);
    if (!a || !b) return null;
    return {
      text,
      ground,
      light: ratio(a.light, b.light),
      dark: ratio(a.dark, b.dark),
      held: heldPairs.includes(`${text} on ${ground}`),
    };
  };
  const pairs = [
    pair("foreground", "background"),
    ...colors
      .filter((item) => color(`${item.name}-foreground`))
      .map((item) => pair(`${item.name}-foreground`, item.name)),
    pair("muted-foreground", "background"),
    pair("primary", "background"),
    pair("destructive", "background"),
  ].filter(Boolean);

  let source = null;
  if (theme.inputs?.sourceColor && level) {
    try {
      const built = buildTheme(theme.inputs, styles.css);
      source = {
        color: theme.inputs.sourceColor,
        moved: Object.fromEntries(
          built.modes.map((mode) => [mode.selector === ":root" ? "light" : "dark", mode.adjusted]),
        ),
      };
    } catch {
      source = { color: theme.inputs.sourceColor, moved: null };
    }
  }

  const type = Object.entries(tokens.text ?? {}).map(([step, token]) => {
    const size = toPx(token.$value);
    const leading = toRatio(value(`--text-${step}--line-height`));
    return {
      step,
      size: token.$value,
      px: size,
      line: size && leading ? Math.round(size * leading) : null,
    };
  });
  const unit = toPx(value("--spacing"));

  const audit = inventory(target);
  const core = audit.decisions.filter((decision) => decision.core);
  const pages = readPages(target);
  // What the page of a kind says after its front matter: its words, kept as written.
  const bodyOf = (file) =>
    (pages[file] ?? "").replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n?/, "").trim();
  const kinds = readKinds(pages).map((kind) => ({
    name: kind.name,
    task: kind.task,
    reference: kind.reference,
    body: bodyOf(kind.file),
  }));
  const revision = spawnSync("git", ["-C", target, "rev-parse", "--short", "HEAD"], {
    encoding: "utf8",
  });
  const dirty =
    spawnSync("git", ["-C", target, "status", "--porcelain"], {
      encoding: "utf8",
    }).stdout?.trim() !== "";
  return {
    name: json("package.json")?.name ?? path.basename(target),
    // A plus says the repository had changes not yet committed when it was read.
    revision: revision.status === 0 ? `${revision.stdout.trim()}${dirty ? "+" : ""}` : null,
    level,
    threshold: min,
    stylesheet,
    colors,
    pairs,
    palette: TONES.map((tone) => ({ tone, color: value(`--palette-primary-${tone}`) })).filter(
      (entry) => entry.color,
    ),
    source,
    font: /var\(/.test(value("--font-sans") ?? "var(") ? null : value("--font-sans"),
    type,
    radius: Object.entries(tokens.radius ?? {}).map(([step, token]) => ({
      step,
      size: token.$value,
      px: toPx(token.$value),
    })),
    spacing: unit,
    target: theme.checks?.["target-size"]?.[0]?.min ?? null,
    coverage: audit.coverage,
    unconfirmed: core
      .filter((d) => d.state === "recorded" && /has not (confirmed|reviewed)/.test(d.note ?? ""))
      .map((d) => d.id),
    tiers: audit.tiers.map((tier) => ({ id: tier.id, state: tier.state })),
    open: core
      .filter((d) => !["held", "claimed", "recorded"].includes(d.state))
      .map((d) => ({ id: d.id, question: d.question })),
    slips: audit.slips,
    components: (json(COMPONENTS)?.components ?? []).map((entry) => ({
      name: entry.name,
      file: entry.file,
      variants: entry.variants ?? [],
      control: entry.control === true,
      min_height: entry.min_height ?? null,
    })),
    kinds,
    screens: screenFiles(read(REGISTRY) ?? "", readSources(target)).map((screen) => ({
      path: screen.path,
      file: screen.file,
      states: screen.states,
    })),
    widths: json(SIZES_FILE)?.widths ?? [],
  };
}

// Pairs of text and ground that do not reach the contrast ratio of the conformance level. The
// book shows them as they are; a person decides what to do about each.
export function belowThreshold(facts) {
  if (facts.threshold === null) return [];
  // Only the pairs the colour sheet draws: a pair made up from two names that the product never
  // sets on each other would be a note about nothing.
  const shown = (pair) =>
    (SURFACES.includes(pair.ground) &&
      pair.text === (pair.ground === "background" ? "foreground" : `${pair.ground}-foreground`)) ||
    (pair.ground === "background" &&
      ["muted-foreground", "primary", "destructive"].includes(pair.text));
  return facts.pairs
    .filter(shown)
    .flatMap((pair) =>
      ["light", "dark"]
        .filter((mode) => pair[mode] !== null && pair[mode] < facts.threshold)
        .map(
          (mode) =>
            `${pair.text} on ${pair.ground} reaches ${pair[mode].toFixed(2)}:1 in ${mode}, below the ${facts.threshold}:1 the conformance level asks${pair.held ? "" : ". No check holds this pair"}`,
        ),
    );
}

// ---- pages -------------------------------------------------------------------------------------

const sheet = (number, eyebrow, question, lede, body) => `
<section class="sheet">
  <header class="sheet-head">
    <p class="eyebrow"><span>${String(number).padStart(2, "0")}</span>${escape(eyebrow)}</p>
    <h2>${escape(question)}</h2>
    <p class="lede">${escape(lede)}</p>
  </header>
  ${body}
</section>`;

function cover(facts, w) {
  const c = facts.coverage;
  const confirmed = c.recorded - facts.unconfirmed.length;
  const parts = [
    ["held", c.held],
    ["claimed", c.claimed],
    ["recorded", confirmed],
    ["unconfirmed", facts.unconfirmed.length],
    ["open", c.core - c.answered],
  ].filter(([, count]) => count > 0);
  const bar = parts
    .map(([name, count]) => `<i class="seg ${name}" style="flex:${count}" title="${count}"></i>`)
    .join("");
  const stat = (count, label, name) =>
    `<div class="stat"><b>${count}</b><span><i class="key ${name}"></i>${escape(label)}</span></div>`;
  const tiers = facts.tiers
    .map(
      (tier) =>
        `<li class="${tier.state}"><span>${escape(tier.id.replaceAll("-", " "))}</span><em>${escape(w.tierStates[tier.state] ?? tier.state)}</em></li>`,
    )
    .join("");
  const open =
    facts.open.length > 0
      ? `<ul class="plain">${facts.open.map((item) => `<li>${escape(w.questions?.[item.id] ?? item.question)}</li>`).join("")}</ul>`
      : `<p>${escape(w.nothingOpen)}</p>`;
  return `
<section class="sheet cover">
  <p class="eyebrow">${escape(w.title)}${facts.revision ? ` · ${escape(w.revision)} ${escape(facts.revision)}` : ""}</p>
  <h1>${escape(facts.name)}</h1>
  <p class="lede">${escape(w.lede)}</p>
  <div class="cover-grid">
    <div>
      <h3>${escape(w.decisions)}</h3>
      <p class="big"><b>${c.answered}</b><span>/ ${c.core}</span></p>
      <p class="muted">${escape(w.decisionsLede)}</p>
      <div class="bar">${bar}</div>
      <div class="stats">
        ${stat(c.held, w.held, "held")}
        ${stat(c.claimed, w.claimed, "claimed")}
        ${stat(c.recorded, w.recorded, "recorded")}
      </div>
      ${facts.unconfirmed.length > 0 ? `<p class="note"><i class="key unconfirmed"></i><b>${facts.unconfirmed.length}</b> ${escape(w.unconfirmed)}</p>` : ""}
    </div>
    <div>
      <h3>${escape(w.tiers)}</h3>
      <ol class="tiers">${tiers}</ol>
      <h3>${escape(w.stillOpen)}</h3>
      ${open}
    </div>
  </div>
</section>`;
}

function colorSheet(facts, w, audience) {
  const color = (name) => facts.colors.find((item) => item.name === name);
  const pairOf = (text, ground) =>
    facts.pairs.find((item) => item.text === text && item.ground === ground);
  const badge = (value, held) => {
    if (value === null) return `<span class="ratio">${escape(w.notRead)}</span>`;
    const below = facts.threshold !== null && value < facts.threshold;
    return `<span class="ratio${below ? " below" : ""}">${value.toFixed(2)}:1${below ? ` · ${escape(w.needs)} ${facts.threshold}:1` : ""}${held && audience === "builder" ? ` · ${escape(w.heldTag)}` : ""}</span>`;
  };
  const ground = (mode) => {
    const of = (name) => color(name)?.[mode];
    const tiles = SURFACES.filter((name) => color(name))
      .map((name) => {
        const text = name === "background" ? "foreground" : `${name}-foreground`;
        const found = pairOf(text, name);
        return `<div class="tile" style="background:${escape(of(name))};color:${escape(of(text) ?? of("foreground"))};border-color:${escape(of("border"))}">
          <b>Aa</b><span>${escape(name)}</span>${found ? badge(found[mode], found.held) : ""}
          ${audience === "builder" ? `<code>${escape(of(name))}</code>` : ""}
        </div>`;
      })
      .join("");
    const texts = [
      ["muted-foreground", "background"],
      ["primary", "background"],
      ["destructive", "background"],
    ]
      .map(([text, base]) => [text, pairOf(text, base)])
      .filter(([, found]) => found)
      .map(
        ([text, found]) =>
          `<li><b style="color:${escape(of(text))}">Aa ${escape(text)}</b>${badge(found[mode], found.held)}</li>`,
      )
      .join("");
    const lines = LINES.filter((name) => color(name))
      .map(
        (name) =>
          `<span class="line" style="border-color:${escape(of(name))}">${escape(name)}</span>`,
      )
      .join("");
    return `<div class="ground" style="background:${escape(of("background"))};color:${escape(of("foreground"))};border-color:${escape(of("border"))}">
      <p class="eyebrow" style="color:${escape(of("muted-foreground"))}">${escape(w[mode])}</p>
      <div class="tiles">${tiles}</div>
      <h4 style="color:${escape(of("muted-foreground"))}">${escape(w.textOnGround)}</h4>
      <ul class="texts">${texts}</ul>
      <h4 style="color:${escape(of("muted-foreground"))}">${escape(w.lines)}</h4>
      <div class="lines">${lines}</div>
    </div>`;
  };
  const source = facts.source
    ? `<div class="source">
        <span class="chip" style="background:${escape(facts.source.color)}"></span>
        <div><b>${escape(w.source)}</b> <code>${escape(facts.source.color)}</code>
        ${(facts.source.moved ? ["light", "dark"] : [])
          .map(
            (mode) =>
              `<p><span class="chip small" style="background:${escape(color("primary")?.[mode])}"></span>${escape(w[mode])}: ${escape(facts.source.moved[mode] ? w.sourceMoved : w.sourceKept)}</p>`,
          )
          .join("")}</div>
      </div>`
    : "";
  const palette =
    facts.palette.length > 0
      ? `<h3>${escape(w.palette)}</h3><div class="palette">${facts.palette
          .map(
            (entry) =>
              `<span${entry.tone >= 60 ? ' class="pale"' : ""} style="background:${escape(entry.color)}"><em>${entry.tone}</em></span>`,
          )
          .join("")}</div>`
      : "";
  const featured = new Set([...SURFACES, ...LINES, "foreground", "destructive"]);
  const rest = facts.colors.filter(
    (item) => !featured.has(item.name) && !featured.has(item.name.replace(/-foreground$/, "")),
  );
  const others =
    audience === "builder" && rest.length > 0
      ? `<h3>${escape(w.otherRoles)}</h3><div class="others">${rest
          .map(
            (item) =>
              `<span><i style="background:${escape(item.light)}"></i><i style="background:${escape(item.dark)}"></i>${escape(item.name)}</span>`,
          )
          .join("")}</div>`
      : "";
  return sheet(
    1,
    w.colorTitle,
    w.colorQuestion,
    w.colorLede,
    `${source}<div class="grounds">${ground("light")}${ground("dark")}</div>${palette}${others}`,
  );
}

function typeSheet(facts, w) {
  const steps = [...facts.type]
    .reverse()
    .map(
      (step) =>
        `<li><span class="meta">text-${escape(step.step)}<em>${step.px ?? "?"} / ${step.line ?? "?"} px</em></span><span class="specimen" style="font-size:${escape(step.size)};line-height:${step.line && step.px ? (step.line / step.px).toFixed(3) : 1.3}">${escape(w.sample)}</span></li>`,
    )
    .join("");
  const radius = facts.radius
    .map(
      (step) =>
        `<div><i style="border-radius:${escape(step.size)}"></i><b>${escape(step.step)}</b><em>${step.px ?? "?"} px</em></div>`,
    )
    .join("");
  const spacing = facts.spacing
    ? `<h3>${escape(w.spacing)}</h3><div class="spacing">${SPACING_STEPS.map(
        (step) =>
          `<div><i style="width:${step * facts.spacing}px"></i><b>${step}</b><em>${step * facts.spacing} px</em></div>`,
      ).join("")}</div><p class="muted">1 ${escape(w.unit)} = ${facts.spacing} px</p>`
    : "";
  const target = facts.target
    ? `<h3>${escape(w.target)}</h3><div class="target"><i style="width:${facts.target}px;height:${facts.target}px"></i><em>${facts.target} px</em></div>`
    : "";
  return sheet(
    2,
    w.typeTitle,
    w.typeQuestion,
    w.typeLede,
    `<div class="two">
      <div>
        <h3>${escape(w.typeScale)}</h3>
        <ol class="type">${steps}</ol>
        ${facts.font ? `<p class="muted">${escape(w.fontStack)}: <code>${escape(facts.font)}</code> · ${escape(w.fontNote)}</p>` : ""}
      </div>
      <div>
        <h3>${escape(w.radius)}</h3>
        <div class="radii">${radius}</div>
        ${spacing}
        ${target}
      </div>
    </div>`,
  );
}

// A page's own words as markup: headings, paragraphs, lists, code. Nothing else is understood,
// and everything is written as text.
export function renderWords(markdown, { code = true } = {}) {
  const inline = (text) =>
    escape(text)
      .replace(/`([^`]+)`/g, "<code>$1</code>")
      .replace(/\*\*([^*]+)\*\*/g, "<b>$1</b>");
  const out = [];
  const lines = markdown.split(/\r?\n/);
  let paragraph = [];
  let list = null;
  const flush = () => {
    if (paragraph.length > 0) out.push(`<p>${inline(paragraph.join(" "))}</p>`);
    paragraph = [];
    if (list) {
      out.push(
        `<${list.tag}>${list.items.map((item) => `<li>${inline(item)}</li>`).join("")}</${list.tag}>`,
      );
    }
    list = null;
  };
  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];
    if (/^```/.test(line)) {
      flush();
      const block = [];
      for (i += 1; i < lines.length && !/^```/.test(lines[i]); i += 1) block.push(lines[i]);
      if (code) out.push(`<pre>${escape(block.join("\n"))}</pre>`);
      continue;
    }
    const heading = /^#{1,6}\s+(.*)$/.exec(line);
    const item = /^\s*(?:(\d+)\.|[-*])\s+(.*)$/.exec(line);
    if (heading) {
      flush();
      out.push(`<h4>${inline(heading[1])}</h4>`);
    } else if (item) {
      const tag = item[1] ? "ol" : "ul";
      if (paragraph.length > 0 || (list && list.tag !== tag)) flush();
      list ??= { tag, items: [] };
      list.items.push(item[2]);
    } else if (line.trim() === "") flush();
    else if (list && /^\s+\S/.test(line)) list.items[list.items.length - 1] += ` ${line.trim()}`;
    else {
      if (list) flush();
      paragraph.push(line.trim());
    }
  }
  flush();
  return out.join("\n");
}

// A section that holds code is for the person who builds: left out for a client.
function forClient(markdown) {
  return markdown
    .split(/\n(?=#{1,6}\s)/)
    .filter((section) => !/^```/m.test(section))
    .join("\n");
}

// The page the components are drawn on: served by the stage while it is open, and nowhere in the
// repository. It loads a component from the repository's own source and draws it once per option,
// each in its own root, so one that cannot stand alone fails by itself.
const HARNESS = "/@design-assembly/harness.js";
const HARNESS_CODE = `
import React from "react";
import { createRoot } from "react-dom/client";
class Catch extends React.Component {
  constructor(props) { super(props); this.state = { failed: false }; }
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch() {}
  render() { return this.state.failed ? null : this.props.children; }
}
const frames = () => new Promise((done) => requestAnimationFrame(() => requestAnimationFrame(done)));
window.__designAssembly = {
  async draw(items) {
    document.querySelectorAll("body > *").forEach((node) => { node.style.display = "none"; });
    const stage = document.createElement("div");
    stage.style.cssText = "padding:24px;display:flex;flex-direction:column;gap:24px;width:760px";
    document.body.append(stage);
    const report = {};
    for (const item of items) {
      let module = null;
      try { module = await import(/* @vite-ignore */ "/" + item.file); } catch { module = null; }
      const Component = module ? module[item.name] : null;
      const block = document.createElement("div");
      block.dataset.daItem = item.id;
      block.style.cssText = "display:flex;flex-direction:column;gap:18px;padding:6px";
      stage.append(block);
      const failed = [];
      let drawn = 0;
      for (const row of item.rows) {
        const line = document.createElement("div");
        line.style.cssText = "display:flex;flex-wrap:wrap;align-items:flex-end;gap:18px 24px";
        block.append(line);
        for (const cell of row.cells) {
          const box = document.createElement("div");
          box.style.cssText = "display:flex;flex-direction:column;align-items:flex-start;gap:6px";
          const slot = document.createElement("div");
          const caption = document.createElement("span");
          caption.textContent = cell.label;
          caption.style.cssText = "font:11px ui-monospace,SFMono-Regular,Menlo,monospace;opacity:0.6";
          box.append(slot, caption);
          line.append(box);
          const attempt = async (text) => {
            if (!Component) return false;
            const root = createRoot(slot);
            root.render(React.createElement(Catch, null, React.createElement(Component, cell.props, text)));
            await frames();
            const size = slot.getBoundingClientRect();
            const shown = slot.childElementCount > 0 && size.width > 0 && size.height > 0;
            if (!shown) root.unmount();
            return shown;
          };
          // With its text first; an element that takes none, such as a field, without.
          if ((await attempt(cell.text)) || (await attempt(undefined))) drawn += 1;
          else {
            failed.push(cell.label);
            box.remove();
          }
        }
      }
      if (drawn === 0) block.remove();
      report[item.id] = { drawn, failed };
    }
    await frames();
    return report;
  },
};
`;

// What of a component is drawn: one row per thing it can vary by, every other one at its default.
// A component with nothing to vary by is drawn once. Only a component that can vary, or that a
// person operates, is drawn alone: the rest are parts, and are seen where they are used.
export function componentItems(components) {
  return components
    .filter((entry) => (entry.variants ?? []).length > 0 || entry.control)
    .map((entry) => {
      const axes = {};
      for (const option of entry.variants ?? []) {
        const at = option.indexOf("=");
        (axes[option.slice(0, at)] ??= []).push(option.slice(at + 1));
      }
      const rows = Object.entries(axes).map(([axis, values]) => ({
        axis,
        cells: values.map((value) => ({
          label: `${axis}=${value}`,
          props: { [axis]: value },
          // A size made for an icon is given a mark, not a word that would not fit it.
          text: /^icon/.test(value) ? "+" : value,
        })),
      }));
      if (rows.length === 0) {
        rows.push({ axis: null, cells: [{ label: entry.name, props: {}, text: entry.name }] });
      }
      return { id: `${entry.file}|${entry.name}`, file: entry.file, name: entry.name, rows };
    });
}

async function drawComponents(stage, facts) {
  const items = componentItems(facts.components);
  const images = {};
  if (items.length === 0) return { images, report: {} };
  const context = await stage.browser.newContext({
    viewport: { width: 860, height: 700 },
    deviceScaleFactor: 2,
    reducedMotion: "reduce",
  });
  const page = await context.newPage();
  // Any page of the application carries its stylesheet: the first screen will do.
  await page.goto(`${stage.origin}${facts.screens[0]?.path ?? "/"}`, { waitUntil: "networkidle" });
  await page.addScriptTag({ type: "module", url: `${stage.origin}${HARNESS}` });
  await page.waitForFunction("Boolean(window.__designAssembly)", null, { timeout: 8000 });
  const report = await page.evaluate(
    `window.__designAssembly.draw(${JSON.stringify(items).replaceAll("<", "\\u003c")})`,
  );
  for (const item of items.filter((entry) => report[entry.id]?.drawn > 0)) {
    const picture = await page.locator(`[data-da-item="${item.id}"]`).screenshot();
    images[item.id] = `data:image/png;base64,${picture.toString("base64")}`;
  }
  await context.close();
  return { images, report };
}

function componentsSheet(facts, w, audience, drawn) {
  const items = componentItems(facts.components);
  const pictures = drawn?.components?.images ?? {};
  const report = drawn?.components?.report ?? {};
  const shown = items
    .filter((item) => pictures[item.id])
    .map((item) => {
      const entry = facts.components.find((c) => `${c.file}|${c.name}` === item.id);
      const failed = report[item.id]?.failed ?? [];
      const axes = item.rows
        .filter((row) => row.axis)
        .map((row) => `${row.axis} × ${row.cells.length}`);
      return `<article class="component">
        <div>
          <h3 class="component-name">${escape(item.name)}</h3>
          <p class="muted">${escape(axes.join(" · "))}${entry?.min_height ? `${axes.length > 0 ? " · " : ""}${escape(w.atLeast)} ${escape(entry.min_height)}` : ""}</p>
          ${audience === "builder" ? `<p class="muted"><code>${escape(item.file)}</code></p>` : ""}
          ${failed.length > 0 ? `<p class="muted">${escape(w.notAlone)}: ${escape(failed.join(", "))}</p>` : ""}
        </div>
        <figure><img src="${pictures[item.id]}" alt="${escape(item.name)}" /></figure>
      </article>`;
    })
    .join("");
  // Everything else, by the file it lives in: parts of something larger, seen on the screens.
  const alone = new Set(items.filter((item) => pictures[item.id]).map((item) => item.id));
  const families = new Map();
  for (const entry of facts.components) {
    const family = families.get(entry.file) ?? { lead: entry.name, parts: [] };
    if (!alone.has(`${entry.file}|${entry.name}`) && entry.name !== family.lead) {
      family.parts.push(entry.name);
    }
    families.set(entry.file, family);
  }
  // A family is listed when something of it is not drawn above: its parts, or the whole of it.
  const parts = [...families.entries()]
    .filter(([file, family]) => family.parts.length > 0 || !alone.has(`${file}|${family.lead}`))
    .map(
      ([, family]) =>
        `<li><b>${escape(family.lead)}</b>${family.parts.length > 0 ? ` <span>${escape(family.parts.join(" · "))}</span>` : ""}</li>`,
    )
    .join("");
  const none = drawn?.components ? "" : `<p class="note">${escape(w.noPictures)}</p>`;
  return sheet(
    3,
    w.componentsTitle,
    w.componentsQuestion,
    w.componentsLede,
    `${none}${shown}${parts ? `<h3>${escape(shown ? w.partsTitle : w.listedTitle)}</h3><p class="muted">${escape(shown ? w.partsLede : w.listedLede)}</p><ul class="parts">${parts}</ul>` : ""}`,
  );
}

function kindsSheet(facts, w, audience, drawn) {
  const wide = facts.widths.length > 0 ? Math.max(...facts.widths) : 1440;
  const kinds = facts.kinds
    .map((kind) => {
      const screen = facts.screens.find((item) => item.file === kind.reference);
      const state = screen?.states[0];
      const image = screen ? drawn?.images?.[`${screen.path}|${state}|${wide}`] : null;
      const where = `${escape(screen ? w.referenceScreen : w.runningSample)}${screen ? ` · <code>${escape(screen.path)}</code>` : ""}${audience === "builder" ? ` · <code>${escape(kind.reference)}</code>` : ""}`;
      const picture = image
        ? `<figure><img src="${image}" alt="${escape(`${kind.name}, ${w.referenceScreen}`)}" /><figcaption>${where}</figcaption></figure>`
        : `<p class="muted">${where}</p>`;
      const body = audience === "builder" ? kind.body : forClient(kind.body);
      return `<article class="kind-sheet">
        <div>
          <p class="eyebrow">${escape(w.kind)}</p>
          <h3 class="kind-name">${escape(kind.name)}</h3>
          <p class="task"><span>${escape(w.task)}</span>${escape(kind.task)}</p>
          ${picture}
        </div>
        <div class="words">${renderWords(body, { code: audience === "builder" })}</div>
      </article>`;
    })
    .join("");
  return sheet(
    4,
    w.kindsTitle,
    w.kindsQuestion,
    w.kindsLede,
    kinds || `<p class="note">${escape(w.noKinds)}</p>`,
  );
}

// The states of a screen as a tree: a state hangs under the state its own steps pass through.
// A state reached without any step is where the data alone leads.
export function pathsOf(screen, how) {
  const states = screen.states.map((name) => ({
    name,
    scenario: how?.[`${screen.path}|${name}`]?.scenario ?? null,
    steps: how?.[`${screen.path}|${name}`]?.steps ?? [],
  }));
  const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
  const nodes = new Map();
  const roots = [];
  for (const state of [...states].sort((a, b) => a.steps.length - b.steps.length)) {
    let parent = null;
    for (let cut = state.steps.length - 1; cut >= 1 && !parent; cut -= 1) {
      const prefix = state.steps.slice(0, cut);
      parent =
        states.find((other) => other.scenario === state.scenario && same(other.steps, prefix)) ??
        states.find((other) => other.scenario === null && same(other.steps, prefix)) ??
        null;
    }
    const node = {
      name: state.name,
      scenario: state.scenario,
      edge: state.steps.slice(parent ? parent.steps.length : 0),
      children: [],
    };
    nodes.set(state.name, node);
    if (parent) nodes.get(parent.name).children.push(node);
    else roots.push(node);
  }
  // Keep the order the repository lists its states in.
  const order = (list) => {
    list.sort((a, b) => screen.states.indexOf(a.name) - screen.states.indexOf(b.name));
    list.forEach((node) => order(node.children));
    return list;
  };
  return order(roots);
}

function pathsSheet(facts, w, audience, drawn) {
  if (!drawn?.how) {
    return sheet(
      5,
      w.pathsTitle,
      w.pathsQuestion,
      w.pathsLede,
      `<p class="note">${escape(w.noPaths)}</p>`,
    );
  }
  const narrow = facts.widths.length > 0 ? Math.min(...facts.widths) : 1440;
  const label = (node) => {
    const steps = node.edge.map((step) =>
      "press" in step
        ? `${escape(w.press)} «${escape(step.press)}»`
        : `${escape(w.fill)} «${escape(step.fill)}»`,
    );
    return steps.join("<br />");
  };
  const node = (screen, item) => {
    const image = drawn.images?.[`${screen.path}|${item.name}|${narrow}`];
    return `<div class="node">${image ? `<img src="${image}" alt="${escape(item.name)}" />` : ""}<b>${escape(item.name)}</b>${item.scenario && audience === "builder" ? `<code>${escape(item.scenario)}</code>` : ""}</div>`;
  };
  const branch = (screen, item) => {
    const kids = item.children.map((child) => branch(screen, child)).join("");
    return `<div class="kid"><span class="edge">${label(item)}</span><div class="branch">
      ${node(screen, item)}
      ${kids ? `<div class="kids">${kids}</div>` : ""}
    </div></div>`;
  };
  const maps = facts.screens
    .map((screen) => {
      const roots = pathsOf(screen, drawn.how);
      // Where the data alone leads, side by side; then one row per action, read left to right.
      const alone = roots.filter((item) => item.edge.length === 0);
      const acted = roots.filter((item) => item.edge.length > 0);
      return `<div class="map">
        <h3>${escape(w.opens)} <code>${escape(screen.path)}</code> · ${escape(w.whenData)}</h3>
        <div class="strip">${alone.map((item) => node(screen, item)).join("")}</div>
        ${acted.length > 0 ? `<h3>${escape(w.afterAction)}</h3><div class="rows">${acted.map((item) => branch(screen, item)).join("")}</div>` : ""}
      </div>`;
    })
    .join("");
  return sheet(5, w.pathsTitle, w.pathsQuestion, w.pathsLede, maps);
}

function statesSheet(facts, w, audience, drawn) {
  const widths = facts.widths.length > 0 ? facts.widths : [1440];
  const narrow = Math.min(...widths);
  const wide = Math.max(...widths);
  const screens = facts.screens
    .map((screen) => {
      const states = screen.states
        .map((name) => {
          const how = drawn?.how?.[`${screen.path}|${name}`];
          const steps = how
            ? [
                ...(how.scenario && audience === "builder"
                  ? [`${w.scenario} <code>${escape(how.scenario)}</code>`]
                  : []),
                ...how.steps.map((step) =>
                  "press" in step
                    ? `${escape(w.press)} «${escape(step.press)}»`
                    : `${escape(w.fill)} «${escape(step.fill)}»`,
                ),
              ]
            : [];
          const picture = (width, cls) => {
            const image = drawn?.images?.[`${screen.path}|${name}|${width}`];
            return image
              ? `<figure class="${cls}"><img src="${image}" alt="${escape(`${screen.path} ${name}, ${width}px`)}" /><figcaption>${width} px</figcaption></figure>`
              : "";
          };
          return `<article class="state">
            <div class="state-head">
              <h4>${escape(name)}</h4>
              <p class="muted">${escape(w.reached)}: ${steps.length > 0 ? steps.join(" → ") : escape(w.opens)}</p>
              ${narrow !== wide ? picture(narrow, "narrow") : ""}
            </div>
            ${picture(wide, "wide")}
          </article>`;
        })
        .join("");
      return `<div class="screen"><h3><code>${escape(screen.path)}</code></h3>${states}</div>`;
    })
    .join("");
  const none = drawn?.images ? "" : `<p class="note">${escape(w.noPictures)}</p>`;
  return sheet(
    6,
    w.statesTitle,
    w.statesQuestion,
    // The widths are the repository's own list. Where it keeps none this book can read, say so:
    // a width nobody listed is never printed.
    facts.widths.length > 0
      ? `${w.statesLede} ${facts.widths.map((width) => `${width} px`).join(", ")}.`
      : w.noWidths,
    `${none}${screens}`,
  );
}

function closing(w, audience) {
  const commands =
    audience === "builder"
      ? `<h3>${escape(w.commands)}</h3><ul class="plain mono"><li>make check</li><li>make design-assembly</li><li>make design-rate</li><li>make design-tokens</li></ul>`
      : "";
  return sheet(
    7,
    w.closeTitle,
    w.closeTitle,
    w.closeLede,
    `<div class="two"><div><ul class="plain">${w.notShown.map((line) => `<li>${escape(line)}</li>`).join("")}</ul></div>
     <div><h3>${escape(w.staysTrue)}</h3><p>${escape(w.staysTrueText)}</p>${commands}</div></div>`,
  );
}

// The book as one page that needs nothing else: its pictures are inside it.
export function renderBook(facts, { audience = "client", words = {}, drawn = null } = {}) {
  const w = {
    ...WORDS,
    ...words,
    tierStates: { ...WORDS.tierStates, ...words.tierStates },
    questions: { ...WORDS.questions, ...words.questions },
  };
  const color = (name, mode = "light") =>
    facts.colors.find((item) => item.name === name)?.[mode] ?? null;
  const radius = facts.radius.find((step) => step.step === "lg")?.size ?? "0.5rem";
  const size = (step, fallback) => facts.type.find((item) => item.step === step)?.size ?? fallback;
  // The facts never hold a picture: they are what a later check compares against the repository.
  const manifest = JSON.stringify(facts).replaceAll("<", "\\u003c");
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${escape(w.title)} · ${escape(facts.name)}</title>
<style>
  :root {
    --bg: ${color("background") ?? "#fff"}; --fg: ${color("foreground") ?? "#111"};
    --muted: ${color("muted-foreground") ?? "#666"}; --surface: ${color("muted") ?? "#f4f4f5"};
    --line: ${color("border") ?? "#e4e4e7"}; --accent: ${color("primary") ?? "#111"};
    --on-accent: ${color("primary-foreground") ?? "#fff"}; --radius: ${radius};
    --xs: ${size("xs", "0.75rem")}; --sm: ${size("sm", "0.875rem")}; --base: ${size("base", "1rem")};
    --lg: ${size("lg", "1.125rem")}; --xl: ${size("xl", "1.25rem")}; --h2: ${size("3xl", "1.875rem")};
    --h1: ${size("5xl", "3rem")};
  }
  * { box-sizing: border-box; }
  body { margin: 0; background: var(--bg); color: var(--fg); font: var(--sm)/1.55 ${facts.font ?? "system-ui, sans-serif"}; -webkit-font-smoothing: antialiased; }
  .book { max-width: 1240px; margin: 0 auto; padding: 0 56px 96px; }
  .sheet { padding: 72px 0 56px; border-top: 1px solid var(--line); break-inside: avoid-page; }
  .sheet.cover { border-top: 0; padding-top: 96px; }
  .eyebrow { margin: 0 0 12px; font-size: var(--xs); letter-spacing: 0.12em; text-transform: uppercase; color: var(--muted); }
  .eyebrow span { color: var(--accent); margin-right: 12px; font-variant-numeric: tabular-nums; }
  h1 { margin: 0; font-size: var(--h1); line-height: 1.05; letter-spacing: -0.02em; font-weight: 650; }
  h2 { margin: 0; font-size: var(--h2); line-height: 1.15; letter-spacing: -0.01em; font-weight: 620; max-width: 24ch; }
  h3 { margin: 40px 0 12px; font-size: var(--xs); letter-spacing: 0.1em; text-transform: uppercase; color: var(--muted); font-weight: 600; }
  h4 { margin: 20px 0 8px; font-size: var(--xs); letter-spacing: 0.08em; text-transform: uppercase; font-weight: 600; }
  .lede { margin: 16px 0 0; max-width: 62ch; font-size: var(--lg); line-height: 1.5; color: var(--muted); }
  .muted { color: var(--muted); margin: 8px 0 0; }
  code, .mono { font: 0.92em ui-monospace, SFMono-Regular, Menlo, monospace; }
  .plain { margin: 0; padding: 0; list-style: none; }
  .plain li { padding: 10px 0; border-top: 1px solid var(--line); max-width: 62ch; }
  .two, .cover-grid { display: grid; grid-template-columns: 1.15fr 1fr; gap: 72px; }
  .cover-grid { margin-top: 56px; }
  .two { margin-top: 48px; }
  .cover-grid h3:first-child, .two h3:first-child { margin-top: 0; }
  .big { margin: 0; display: flex; align-items: baseline; gap: 12px; line-height: 1; }
  .big b { font-size: 112px; font-weight: 650; letter-spacing: -0.04em; }
  .big span { font-size: var(--h2); color: var(--muted); }
  .bar { display: flex; gap: 3px; height: 14px; margin: 28px 0 20px; }
  .seg, .key { background: var(--accent); border-radius: 2px; }
  .seg.claimed, .key.claimed { background: color-mix(in oklab, var(--accent) 45%, var(--bg)); }
  .seg.recorded, .key.recorded { background: var(--fg); }
  .seg.unconfirmed, .key.unconfirmed { background: repeating-linear-gradient(135deg, var(--fg) 0 2px, transparent 2px 5px); outline: 1px solid var(--fg); outline-offset: -1px; }
  .seg.open { background: transparent; outline: 1px dashed var(--muted); outline-offset: -1px; }
  .key { display: inline-block; width: 10px; height: 10px; margin-right: 8px; }
  .stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; }
  .stat b { display: block; font-size: var(--h2); font-weight: 620; line-height: 1.1; }
  .stat span { display: block; padding-left: 18px; text-indent: -18px; color: var(--muted); font-size: var(--xs); }
  .note { margin: 20px 0 0; padding: 12px 14px; border: 1px solid var(--line); border-radius: var(--radius); }
  .tiers { margin: 0; padding: 0; list-style: none; counter-reset: tier; }
  .tiers li { display: flex; justify-content: space-between; gap: 16px; padding: 10px 0; border-top: 1px solid var(--line); counter-increment: tier; }
  .tiers li span::before { content: counter(tier); display: inline-block; width: 24px; color: var(--muted); font-variant-numeric: tabular-nums; }
  .tiers em { font-style: normal; color: var(--muted); text-align: right; }
  .tiers li.reached em { color: var(--accent); font-weight: 600; }
  .source { display: flex; gap: 16px; align-items: flex-start; margin-top: 40px; }
  .source p { margin: 6px 0 0; color: var(--muted); }
  .chip { display: inline-block; width: 56px; height: 56px; border-radius: var(--radius); flex: none; }
  .chip.small { width: 12px; height: 12px; border-radius: 3px; margin-right: 8px; vertical-align: -1px; }
  .grounds { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-top: 32px; }
  .ground { padding: 24px; border: 1px solid; border-radius: calc(var(--radius) * 1.4); }
  .tiles { display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 10px; }
  .tile { display: flex; flex-direction: column; gap: 2px; min-height: 112px; padding: 12px; border: 1px solid; border-radius: var(--radius); }
  .tile b { font-size: var(--xl); font-weight: 600; margin-bottom: auto; }
  .tile span, .tile code { font-size: var(--xs); }
  .tile code { opacity: 0.75; }
  .ratio { font-variant-numeric: tabular-nums; opacity: 0.85; }
  .ratio.below { opacity: 1; font-weight: 700; text-decoration: underline wavy; }
  .texts { margin: 0; padding: 0; list-style: none; }
  .texts li { display: flex; justify-content: space-between; gap: 16px; padding: 6px 0; font-size: var(--xs); }
  .texts b { font-size: var(--sm); }
  .lines { display: flex; gap: 10px; flex-wrap: wrap; }
  .line { padding: 8px 14px; border: 2px solid; border-radius: var(--radius); font-size: var(--xs); }
  .palette { display: flex; border-radius: var(--radius); overflow: hidden; border: 1px solid var(--line); }
  .palette span { flex: 1; height: 64px; position: relative; }
  .palette em { position: absolute; left: 6px; bottom: 4px; font: 10px ui-monospace, monospace; font-style: normal; color: #fff; }
  .palette span.pale em { color: #111; }
  .others { display: flex; flex-wrap: wrap; gap: 8px 20px; font-size: var(--xs); color: var(--muted); }
  .others i { display: inline-block; width: 12px; height: 12px; border: 1px solid var(--line); margin-right: 3px; vertical-align: -2px; }
  .type { margin: 0; padding: 0; list-style: none; }
  .type li { display: grid; grid-template-columns: 120px 1fr; gap: 16px; align-items: baseline; padding: 10px 0; border-top: 1px solid var(--line); }
  .type .meta { font-size: var(--xs); color: var(--muted); }
  .type .meta em { display: block; font-style: normal; font-variant-numeric: tabular-nums; }
  .type .specimen { white-space: nowrap; overflow: hidden; text-overflow: clip; font-weight: 500; }
  .radii { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; }
  .radii i { display: block; height: 72px; border: 1.5px solid var(--fg); background: var(--surface); }
  .radii b, .spacing b { display: block; margin-top: 8px; font-size: var(--xs); }
  .radii em, .spacing em, .target em { font-style: normal; font-size: var(--xs); color: var(--muted); font-variant-numeric: tabular-nums; }
  .spacing { display: flex; align-items: flex-end; gap: 20px; flex-wrap: wrap; }
  .spacing i { display: block; height: 28px; background: var(--accent); border-radius: 2px; }
  .target { display: flex; align-items: center; gap: 12px; }
  .target i { display: block; border: 1.5px solid var(--fg); border-radius: 4px; }
  .component { display: grid; grid-template-columns: 220px 1fr; gap: 40px; align-items: start; padding: 28px 0; border-top: 1px solid var(--line); }
  .sheet-head + .component { margin-top: 40px; }
  .component-name { margin: 0; font-size: var(--xl); font-weight: 620; letter-spacing: -0.01em; text-transform: none; color: var(--fg); }
  .component figure img { width: auto; max-width: 100%; border: 0; border-radius: 0; }
  .parts { margin: 16px 0 0; padding: 0; list-style: none; columns: 2; column-gap: 56px; }
  .parts li { padding: 8px 0; border-top: 1px solid var(--line); break-inside: avoid; }
  .parts span { color: var(--muted); font-size: var(--xs); }
  .kind-sheet { display: grid; grid-template-columns: 1.25fr 1fr; gap: 64px; margin-top: 48px; }
  .kind-name { margin: 0; font-size: var(--h2); font-weight: 620; line-height: 1.1; letter-spacing: -0.01em; text-transform: none; color: var(--fg); }
  .task { margin: 16px 0 28px; font-size: var(--lg); line-height: 1.45; max-width: 44ch; }
  .task span { display: block; margin-bottom: 4px; font-size: var(--xs); letter-spacing: 0.1em; text-transform: uppercase; color: var(--muted); }
  .words { max-width: 60ch; }
  .words h4 { margin: 28px 0 8px; color: var(--muted); }
  .words h4:first-child { margin-top: 0; }
  .words p { margin: 0 0 10px; }
  .words ol, .words ul { margin: 0 0 10px; padding-left: 20px; }
  .words li { margin: 4px 0; }
  .words pre { margin: 0 0 10px; padding: 12px 14px; overflow-x: auto; background: var(--surface); border-radius: var(--radius); font: 12px/1.5 ui-monospace, SFMono-Regular, Menlo, monospace; }
  .map { margin-top: 24px; }
  .strip { display: flex; flex-wrap: wrap; gap: 24px; }
  .rows { display: grid; grid-auto-flow: row dense; grid-template-columns: 1fr 1fr; gap: 32px 24px; align-items: center; overflow-x: auto; padding-bottom: 8px; }
  .rows > .kid:has(.kids) { grid-column: 1 / -1; }
  .branch { display: flex; align-items: center; }
  .kids { display: flex; flex-direction: column; gap: 20px; }
  .kid { display: flex; align-items: center; }
  .edge { position: relative; flex: none; width: 190px; padding: 0 44px 0 0; text-align: right; font-size: var(--xs); line-height: 1.35; color: var(--muted); }
  .rows > .kid > .edge { width: 170px; text-align: left; padding-right: 44px; color: var(--fg); }
  .edge::after { content: "→"; position: absolute; right: 14px; top: 50%; transform: translateY(-50%); color: var(--accent); font-size: var(--base); }
  .node { flex: none; width: 132px; text-align: center; }
  .node img { display: block; width: 100%; border: 1px solid var(--line); border-radius: calc(var(--radius) * 0.7); }
  .node b { display: block; margin-top: 6px; font: 600 var(--xs) ui-monospace, SFMono-Regular, Menlo, monospace; }
  .node code { display: block; font-size: 10px; color: var(--muted); }
  .screen > h3 { margin-top: 48px; }
  .state { display: grid; grid-template-columns: 248px 1fr; gap: 32px; padding: 28px 0; border-top: 1px solid var(--line); break-inside: avoid; }
  .state h4 { margin: 0; font: 600 var(--base) ui-monospace, SFMono-Regular, Menlo, monospace; letter-spacing: 0; text-transform: none; }
  figure { margin: 0; }
  figure img { display: block; width: 100%; border: 1px solid var(--line); border-radius: var(--radius); }
  figure.narrow { margin-top: 16px; width: 200px; }
  figcaption { margin-top: 6px; font-size: var(--xs); color: var(--muted); font-variant-numeric: tabular-nums; }
  @media print { .book { padding: 0 24px; } .sheet { padding: 40px 0; } }
</style>
</head>
<body>
<main class="book">
${cover(facts, w)}
${colorSheet(facts, w, audience)}
${typeSheet(facts, w)}
${componentsSheet(facts, w, audience, drawn)}
${kindsSheet(facts, w, audience, drawn)}
${pathsSheet(facts, w, audience, drawn)}
${statesSheet(facts, w, audience, drawn)}
${closing(w, audience)}
</main>
<script type="application/json" id="${FACTS_ID}">${manifest}</script>
</body>
</html>
`;
}

// The facts a book was drawn from, read back out of it.
export function factsOf(html) {
  const found = new RegExp(
    `<script type="application/json" id="${FACTS_ID}">([\\s\\S]*?)</script>`,
  ).exec(html ?? "");
  if (!found) return null;
  try {
    return JSON.parse(found[1]);
  } catch {
    return null;
  }
}

// What a book says that the repository no longer does, by the part of the facts that differs.
export function staleParts(html, facts) {
  const then = factsOf(html);
  if (then === null) return ["the book holds no list of what it shows"];
  return [...new Set([...Object.keys(then), ...Object.keys(facts)])]
    .filter((key) => JSON.stringify(then[key]) !== JSON.stringify(facts[key]))
    .sort();
}

// Draws every state of every screen at the narrowest and the widest of the widths, the way a
// person reaches it. Returns the pictures as data, and how each state was reached.
async function drawStates(target, facts) {
  const stage = await openStage(target, { modules: { [HARNESS]: HARNESS_CODE } });
  if (stage.problem) return { problem: stage.problem };
  const images = {};
  const how = {};
  let components;
  let partial = null;
  try {
    const { SCREENS } = await stage.load(`/${REGISTRY}`);
    const widths = facts.widths.length > 0 ? facts.widths : [1440];
    const shown = [...new Set([Math.min(...widths), Math.max(...widths)])];
    for (const width of shown) {
      const context = await stage.browser.newContext({
        // Short windows: a state is told by what is at the top of the screen, and a tall picture
        // of empty space pushes the next state off the page.
        viewport: { width, height: width < 600 ? 560 : 540 },
        deviceScaleFactor: width < 600 ? 2 : 1.5,
        reducedMotion: "reduce",
      });
      for (const screen of SCREENS ?? []) {
        for (const state of screen.states) {
          const page = await context.newPage();
          const steps = state.steps ?? [];
          how[`${screen.path}|${state.name}`] = { scenario: state.scenario ?? null, steps };
          const url = state.scenario ? `${screen.path}?scenario=${state.scenario}` : screen.path;
          await page.goto(`${stage.origin}${url}`, { waitUntil: "networkidle" });
          for (const step of steps) {
            if ("press" in step) {
              await page.getByRole("button", { name: step.press, exact: true }).click();
            } else await page.getByLabel(step.fill, { exact: true }).fill(step.text);
          }
          // The state is on the page once its own text is.
          await page.getByText(state.shows, { exact: false }).first().waitFor({ timeout: 8000 });
          await page.waitForTimeout(350);
          const picture = await page.screenshot();
          images[`${screen.path}|${state.name}|${width}`] =
            `data:image/png;base64,${picture.toString("base64")}`;
          await page.close();
        }
      }
      await context.close();
    }
  } catch (error) {
    await stage.close();
    return { problem: `drawing stopped: ${error.message.split("\n")[0]}` };
  }
  // The components are drawn apart: when they fail, the pictures of the states are kept. The
  // development server may load the page again while it prepares a package for the first time, so
  // one more try is made.
  try {
    try {
      components = await drawComponents(stage, facts);
    } catch {
      components = await drawComponents(stage, facts);
    }
  } catch (error) {
    components = null;
    partial = `the components could not be drawn: ${error.message.split("\n")[0]}`;
  } finally {
    await stage.close();
  }
  return { images, how, components, partial };
}

// The same book as a file to print, or as one picture per sheet for slides.
async function exportBook(target, file, format, out) {
  const stage = await openStage(target);
  if (stage.problem) return stage.problem;
  try {
    const context = await stage.browser.newContext({
      viewport: { width: 1440, height: 900 },
      deviceScaleFactor: 2,
    });
    const page = await context.newPage();
    await page.goto(pathToFileURL(file).href);
    if (format === "pdf") {
      await page.pdf({
        path: path.resolve(target, out, "book.pdf"),
        printBackground: true,
        width: "1440px",
        height: "1018px",
      });
    } else {
      const sheets = page.locator(".sheet");
      for (let i = 0; i < (await sheets.count()); i += 1) {
        await sheets.nth(i).screenshot({
          path: path.resolve(target, out, `sheet-${String(i).padStart(2, "0")}.png`),
        });
      }
    }
  } catch (error) {
    return `the ${format} could not be written: ${error.message.split("\n")[0]}`;
  } finally {
    await stage.close();
  }
  return null;
}

async function main() {
  const args = argv.slice(2);
  const value = (flag) => (args.includes(flag) ? args[args.indexOf(flag) + 1] : undefined);
  if (!value("--target")) {
    stderr.write(
      "usage: node book.mjs --target DIR [--audience client|builder] [--format html|pdf|png] [--words FILE] [--out DIR] [--facts] [--words-template]\n       node book.mjs --target DIR --check BOOK.html\n",
    );
    exit(2);
  }
  const target = path.resolve(value("--target"));
  const facts = collectFacts(target);
  if (args.includes("--facts")) {
    stdout.write(`${JSON.stringify(facts, null, 2)}\n`);
    return;
  }
  if (args.includes("--words-template")) {
    stdout.write(`${JSON.stringify(WORDS, null, 2)}\n`);
    return;
  }
  const checked = value("--check");
  if (checked) {
    const file = path.resolve(checked);
    if (!existsSync(file)) {
      stderr.write(`design-assembly: ${checked} is not there\n`);
      exit(2);
    }
    const stale = staleParts(readFileSync(file, "utf8"), facts);
    if (stale.length === 0) {
      stdout.write("the book says what the repository says\n");
      return;
    }
    stderr.write(
      `design-assembly: the book no longer says what the repository says (${stale.join(", ")}): draw it again\n`,
    );
    exit(1);
  }
  const audience = value("--audience") ?? "client";
  const format = value("--format") ?? "html";
  if (!["client", "builder"].includes(audience) || !["html", "pdf", "png"].includes(format)) {
    stderr.write(
      "design-assembly: --audience is client or builder; --format is html, pdf or png\n",
    );
    exit(2);
  }
  const wordsFile = value("--words") ?? path.join(target, WORDS_FILE);
  const words = existsSync(wordsFile) ? JSON.parse(readFileSync(wordsFile, "utf8")) : {};
  const drawn = await drawStates(target, facts);
  if (drawn.problem) stdout.write(`note: no picture was drawn: ${drawn.problem}\n`);
  if (drawn.partial) stdout.write(`note: ${drawn.partial}\n`);
  const out = value("--out") ?? OUT;
  mkdirSync(path.resolve(target, out), { recursive: true });
  const file = path.resolve(target, out, "book.html");
  writeFileSync(file, renderBook(facts, { audience, words, drawn: drawn.problem ? null : drawn }));
  stdout.write(`book: ${file}\n`);
  stdout.write(
    `for: ${audience}. ${facts.coverage.answered} of ${facts.coverage.core} core decisions answered; ${facts.unconfirmed.length} recorded and not confirmed; ${facts.open.length} open\n`,
  );
  for (const line of belowThreshold(facts)) stdout.write(`note: ${line}\n`);
  if (format !== "html") {
    const problem = await exportBook(target, file, format, out);
    stdout.write(
      problem
        ? `note: ${problem}\n`
        : `also written as ${format} in ${path.resolve(target, out)}\n`,
    );
  }
}

if (argv[1] && realpathSync(argv[1]) === realpathSync(fileURLToPath(import.meta.url))) await main();
