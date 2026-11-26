// The bridge in (specification 0014): what a tool from outside made, read into one candidate
// direction, in the choice keys every direction of the plugin uses: a source colour, a type scale
// and a corner radius. The candidate stands beside the plugin's directions on the sheet (specimen
// --from); it is never written to a ledger or a stylesheet. A value of it against a value the owner
// settled becomes a question on the waiting list, and the ledger wins until the owner says
// otherwise. It reads the file it is given and the repository's blueprint; it calls no model and no
// network.
// Usage: node bring-in.mjs --from PATH [--kind tokens|design-md|variables|system] [--target DIR]
//                          [--collection NAME] [--on DATE] [--dry-run] [--json]
// Exit: 0 nothing waits on the owner from this source; 1 a question from it waits; 2 a wrong call,
// or a source or a repository that cannot be read. On 2 nothing is written.
import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { stdout } from "node:process";

import { LEDGERS } from "../templates/tools/design-assembly/contract.mjs";
import { lineWidth, renderJson } from "../templates/tools/design-assembly/json.mjs";
import { CORNER_RADII, RATIOS } from "../templates/tools/design-assembly/scale.mjs";
import { tokenHex } from "../templates/tools/design-assembly/color.mjs";
import { firstFamily, FONT_VARIABLES } from "../templates/tools/design-assembly/fonts.mjs";
import {
  findStylesheet,
  loadStyles,
  themeDeclarations,
} from "../templates/tools/design-assembly/styles.mjs";
import {
  sourceFontFile,
  sourceFontId,
  withoutBlock,
} from "../templates/tools/design-assembly/theme.mjs";
import {
  isDay,
  questionFile,
  readWaiting,
  WAITING_LIST,
} from "../templates/tools/design-assembly/waiting.mjs";
import { writeFiles, writtenFiles } from "./apply.mjs";
import { today } from "./asking.mjs";
import { finish, readCall, Refusal, refuse, start } from "./command.mjs";
import { KINDS, readOutside } from "./outside-tokens.mjs";
import { variablesLines } from "./outside-variables.mjs";

const BLUEPRINT = LEDGERS.blueprint.file;
// The keys of a direction, in the order a direction says them.
export const KEYS = ["source_color", "type_scale", "type_ratio", "corner_radius"];
// The sizes of the framework's own type scale, in pixels: a source whose sizes are all among them
// keeps the standard scale.
const STANDARD_SIZES = [12, 14, 16, 18, 20, 24, 30, 36, 48, 60, 72, 96, 128];
// What a direction draws where the source says nothing: the floor's.
const FLOOR = { type_scale: "standard", corner_radius: "floor" };
// How near a ratio is to one of the plugin's to be that one and not an approximation, and how far
// it may be and still be taken to it.
const NEAR = 0.01;
const FAR = 0.1;
const KIND_WORDS = {
  tokens: "a token file",
  "design-md": "a DESIGN.md",
  variables: "an export of variables",
  system: "a system of tokens and a README",
};

const pxOf = (value) => {
  const found = /^(-?\d*\.?\d+)(px)?$/.exec(String(value).trim());
  return found ? Number(found[1]) : null;
};
const remPx = (rem) => Number.parseFloat(rem) * 16;
const segmentsOf = (token) => token.logical.split(".");
const base = (tokens) => tokens.filter((token) => token.mode === null || token.mode === "light");

// The groups a colour of the theme sits under, and the names a colour's own shade is the colour by.
const COLOUR_GROUPS = ["color", "colors", "colour", "colours", "palette", "brand", "theme"];
const SHADE_DEFAULTS = ["main", "default", "base", "500"];

// A colour as `#rrggbb`, from the ways a token file writes one: hexadecimal of three, four, six or
// eight digits (the alpha left out), rgb() and rgba(), hsl() and hsla(), and what the colour module
// reads. Null for anything else.
export function colourHex(value) {
  const text = String(value).trim();
  const hex = /^#([0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})$/i.exec(text)?.[1];
  if (hex) {
    const full =
      hex.length <= 4
        ? [...hex.slice(0, 3)].map((digit) => digit + digit).join("")
        : hex.slice(0, 6);
    return `#${full.toLowerCase()}`;
  }
  const rgb =
    /^rgba?\(\s*([\d.]+%?)[\s,]+([\d.]+%?)[\s,]+([\d.]+%?)(?:\s*[,/]\s*[\d.]+%?)?\s*\)$/i.exec(
      text,
    );
  if (rgb)
    return channelsToHex(
      rgb
        .slice(1, 4)
        .map((part) => (part.endsWith("%") ? Number.parseFloat(part) * 2.55 : Number(part))),
    );
  const hsl =
    /^hsla?\(\s*([\d.]+)(?:deg)?[\s,]+([\d.]+)%[\s,]+([\d.]+)%(?:\s*[,/]\s*[\d.]+%?)?\s*\)$/i.exec(
      text,
    );
  if (hsl)
    return channelsToHex(hslChannels(Number(hsl[1]), Number(hsl[2]) / 100, Number(hsl[3]) / 100));
  return tokenHex(text)?.slice(0, 7) ?? null;
}

// Three channels from 0 to 255, as `#rrggbb`.
const channelsToHex = (channels) =>
  `#${channels
    .map((value) =>
      Math.round(Math.min(255, Math.max(0, value)))
        .toString(16)
        .padStart(2, "0"),
    )
    .join("")}`;

// The channels of a colour written by its hue, saturation and lightness, from 0 to 255.
function hslChannels(hue, saturation, lightness) {
  const chroma = (1 - Math.abs(2 * lightness - 1)) * saturation;
  const at = (n) => {
    const k = (n + hue / 30) % 12;
    return lightness - (chroma / 2) * Math.max(-1, Math.min(k - 3, 9 - k, 1));
  };
  return [at(0), at(8), at(4)].map((value) => value * 255);
}

// How a token answers a name: 0 its path ends with it, 1 it is that colour's default shade, else
// not at all.
function nameRank(segments, name) {
  if (segments.at(-1) === name) return 0;
  return segments.at(-2) === name && SHADE_DEFAULTS.includes(segments.at(-1)) ? 1 : null;
}

// The colour a source names first among the names, with the token it came from: a token under a
// group of colours before one elsewhere, the name itself before a shade of it, the shortest path
// before a longer one. Null where no token has any of the names. The token a name picks is the
// colour, or nothing: one that cannot be read is named, through `unreadable`, and never passed
// over for the next name, so no colour is guessed. Where tokens of an export of variables tie for
// the name in more than one collection and their colours differ, `twice` is told, with the colour
// of each collection: no collection is picked by the order it was read in.
function colourOf(tokens, names, unreadable = () => null, twice = () => null) {
  const keyOf = (item) =>
    `${Number(!COLOUR_GROUPS.includes(item.segments[0]))}|${item.rank}|${item.segments.length}`;
  for (const name of names) {
    const ranked = tokens
      .map((token) => {
        const segments = segmentsOf(token).map((segment) => segment.toLowerCase());
        return { token, segments, rank: nameRank(segments, name) };
      })
      .filter((item) => item.rank !== null)
      .sort(
        (a, b) =>
          Number(!COLOUR_GROUPS.includes(a.segments[0])) -
            Number(!COLOUR_GROUPS.includes(b.segments[0])) ||
          a.rank - b.rank ||
          a.segments.length - b.segments.length,
      );
    if (ranked.length > 0) {
      const { token } = ranked[0];
      const held = new Map();
      for (const item of ranked.filter((other) => keyOf(other) === keyOf(ranked[0]))) {
        const at = item.token.collection;
        if (at !== undefined && !held.has(at)) held.set(at, item.token);
      }
      if (held.size > 1) {
        const bad = [...held.values()].find((other) => !colourHex(other.value));
        if (bad) return unreadable(name, bad);
        const colours = [...held.entries()].map(([at, other]) => [at, colourHex(other.value)]);
        if (new Set(colours.map(([, hex]) => hex)).size > 1) return twice(name, token, colours);
      }
      const hex = colourHex(token.value);
      const from = token.collection ? `${token.collection}:${token.logical}` : token.logical;
      if (hex) return { hex, token: from };
      return unreadable(name, token);
    }
  }
  return null;
}

// The tokens of the one collection `--collection` names, by its id, its label or its name; a
// refusal where it names none or more than one, or the source has no collections.
function narrowed(file, read, tokens, collection) {
  if (collection === null || collection === undefined) return tokens;
  if (read.kind !== "variables") {
    throw new Refusal(`--collection is for an export of variables, and ${file} is not one`);
  }
  const kept = read.variables.kept;
  const listed = kept.map((item) => item.label).join(", ");
  const exact = kept.filter((item) => item.id === collection || item.label === collection);
  const named = exact.length > 0 ? exact : kept.filter((item) => item.name === collection);
  if (named.length > 1) {
    throw new Refusal(
      `--collection ${collection} names ${named.length} collections: ${named.map((item) => item.label).join(", ")}; name one by its id`,
    );
  }
  if (named.length === 0) {
    throw new Refusal(`--collection ${collection} names no collection read: ${listed}`);
  }
  return tokens.filter((token) => token.collection_id === named[0].id);
}

// The corner radius of the source: the base of its group of radii, else the middle of them.
function radiusOf(tokens) {
  const group = base(tokens).filter((token) =>
    segmentsOf(token).some((segment) =>
      /^(radius|radii|rounded|border-?radius|corners?)$/i.test(segment),
    ),
  );
  const sized = group
    .map((token) => ({ token, px: pxOf(token.value) }))
    .filter((item) => item.px !== null && item.px < 999);
  if (sized.length === 0) return null;
  for (const name of ["base", "default", "md", "medium", "radius"]) {
    const found = sized.find((item) => segmentsOf(item.token).at(-1).toLowerCase() === name);
    if (found) return found.px;
  }
  const sorted = sized.map((item) => item.px).sort((a, b) => a - b);
  return sorted[Math.floor(sorted.length / 2)];
}

// The font sizes of the source, in pixels, each once and smallest first.
function sizesOf(tokens) {
  const sizes = base(tokens)
    .filter((token) => {
      const segments = segmentsOf(token).map((segment) => segment.toLowerCase());
      const last = segments.at(-1);
      return (
        last === "fontsize" ||
        last === "font-size" ||
        segments.some((segment, index) => segment === "font" && segments[index + 1] === "size")
      );
    })
    .map((token) => pxOf(token.value))
    .filter((px) => px !== null && px > 0);
  return [...new Set(sizes)].sort((a, b) => a - b);
}

// The fonts the source names: for text, the one a body or text style uses; for headings, the one a
// heading style uses, else the text's.
function fontsOf(tokens) {
  const families = base(tokens).filter((token) =>
    /(^|\.)(fontfamily|font-family|family)(\.|$)/i.test(token.logical),
  );
  const pick = (pattern) => families.find((token) => pattern.test(token.logical))?.value ?? null;
  const text = pick(/body|text|base|sans|paragraph/i) ?? families[0]?.value ?? null;
  return { text, heading: pick(/head|h1|display|title/i) ?? text };
}

// The type scale of the sizes: the framework's when every size is one of its sizes; else a modular
// scale whose ratio is the plugin's nearest to the middle step above the base size. Too few sizes
// above the base, or a step far from every ratio, read no scale: `why` says so.
function typeOf(sizes) {
  if (sizes.length === 0) return null;
  if (sizes.every((size) => STANDARD_SIZES.includes(Math.round(size * 100) / 100))) {
    return { type_scale: "standard" };
  }
  const above = sizes.filter((size) => size >= 16);
  if (above.length < 3) {
    return { why: `too few sizes above the base to read a ratio (${sizes.join("px, ")}px)` };
  }
  const steps = above.slice(1).map((size, index) => size / above[index]);
  const ratio = [...steps].sort((a, b) => a - b)[Math.floor(steps.length / 2)];
  const [name, value] = Object.entries(RATIOS).sort(
    (a, b) => Math.abs(a[1] - ratio) - Math.abs(b[1] - ratio),
  )[0];
  if (Math.abs(value - ratio) > FAR) {
    return { why: `a step of ${Number(ratio.toFixed(3))} is far from every ratio of the plugin` };
  }
  return { type_scale: "modular", type_ratio: name, ratio, near: Math.abs(value - ratio) <= NEAR };
}

// The plugin's corner radius nearest to a number of pixels, and whether it is that number.
function cornerOf(px) {
  // On a tie between two, the larger: a corner drawn a little round is closer to what was meant.
  const [name, rem] = Object.entries(CORNER_RADII).sort(
    (a, b) => Math.abs(remPx(a[1]) - px) - Math.abs(remPx(b[1]) - px) || remPx(b[1]) - remPx(a[1]),
  )[0];
  return { name, px: remPx(rem), exact: remPx(rem) === px };
}

const slug = (text) =>
  String(text)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

// What a path holds, read, or a refusal that says why not.
function readSource(file, kind) {
  if (!existsSync(file)) throw new Refusal(`${file} is not there`);
  try {
    return readOutside(file, kind);
  } catch (error) {
    throw new Refusal(`${file} cannot be read: ${error.message}`);
  }
}

// The type scale and corner radius of the tokens, with what was taken from the floor, what was
// taken to the plugin's nearest value, and why a scale could not be read.
function shapeOf(tokens) {
  const assumed = [];
  const approximated = [];
  const unread = [];
  const type = typeOf(sizesOf(tokens));
  if (!type?.type_scale) assumed.push("type_scale");
  if (type?.why) unread.push({ token: "font sizes", written: null, why: type.why });
  if (type?.type_scale === "modular" && !type.near) {
    approximated.push({
      key: "type_ratio",
      from: String(Number(type.ratio.toFixed(3))),
      to: `${type.type_ratio} (${RATIOS[type.type_ratio]})`,
    });
  }
  const px = radiusOf(tokens);
  const corner = px === null ? null : cornerOf(px);
  if (!corner) assumed.push("corner_radius");
  if (corner && !corner.exact) {
    approximated.push({
      key: "corner_radius",
      from: `${px}px`,
      to: `${corner.name} (${corner.px}px)`,
    });
  }
  const values = {
    type_scale: type?.type_scale ?? FLOOR.type_scale,
    ...(type?.type_ratio ? { type_ratio: type.type_ratio } : {}),
    corner_radius: corner?.name ?? FLOOR.corner_radius,
  };
  return { values, assumed, approximated, unread };
}

// The candidate direction a source holds: its values in the choice keys of a direction, the token
// its colour came from, its dark colour where it has one, what was taken from the floor because the
// source says nothing, what was taken to the plugin's nearest value, the fonts it names, every value
// an expression or a reference became, and what could not be read. Throws with why when the source
// cannot be read, or names no colour to draw it with.
export function candidateFrom(file, kind = null, { collection = null } = {}) {
  const read = readSource(file, kind);
  const { tokens } = read;
  const names = ["primary", "brand", "accent"];
  const coloured = narrowed(file, read, tokens, collection);
  const twice = (which) => (name, token, colours) => {
    const values = new Set(colours.map(([, hex]) => hex)).size;
    throw new Refusal(
      `${file}: its ${which}${name} colour ${token.logical} is held by ${colours.length} collections with ${values} values: ${colours.map(([at, hex]) => `${hex} in ${at}`).join(", ")}; nothing is guessed: say which with --collection <name>`,
    );
  };
  const colour = colourOf(
    base(coloured),
    names,
    (name, token) => {
      throw new Refusal(
        `${file}: its ${name} colour ${token.logical} is written ${token.value}, which cannot be read: nothing is guessed`,
      );
    },
    twice(""),
  );
  if (!colour) {
    throw new Refusal(
      `${file} names no primary colour that can be read, so there is no direction to draw`,
    );
  }
  const dark = colourOf(
    coloured.filter((token) => token.mode === "dark"),
    names,
    () => null,
    twice("dark "),
  );
  const shape = shapeOf(tokens);
  const name = read.name ?? path.basename(file).replace(/\.[^.]+$/, "");
  return {
    id: `outside-${slug(name) || "source"}`,
    name,
    source: { kind: read.kind, file },
    values: { source_color: colour.hex, ...shape.values },
    picked: { source_color: colour.token },
    dark: dark ? { source_color: dark.hex } : null,
    assumed: shape.assumed,
    approximated: shape.approximated,
    fonts: fontsOf(tokens),
    resolved: tokens
      .filter((token) => token.written !== token.value)
      .map(({ token, written, value }) => ({ token, written, value })),
    unread: [...read.unread, ...shape.unread],
    // What the reader of an export of variables counted and set aside; no other kind has it.
    ...(read.variables ? { variables: read.variables } : {}),
  };
}

// The blueprint of a repository, or null.
function blueprintOf(root) {
  const full = path.join(root, BLUEPRINT);
  if (!existsSync(full)) return null;
  try {
    return JSON.parse(readFileSync(full, "utf8"));
  } catch {
    throw new Refusal(`${BLUEPRINT} is not JSON`);
  }
}

const same = (key, a, b) =>
  key === "source_color" ? tokenHex(String(a)) === tokenHex(String(b)) : String(a) === String(b);

// The values of a candidate against the values the owner settled: a foundations layer the owner
// decided, each key the owner gave or confirmed. A value the guide proposed and nobody confirmed is
// not settled, and a value the candidate took from the floor is not the source's.
export function conflictsOf(root, candidate) {
  const foundations = blueprintOf(root)?.layers?.foundations;
  if (foundations?.status !== "decided") return [];
  const confirmed = Array.isArray(foundations.confirmed) ? foundations.confirmed : [];
  const theirs = (key) => foundations.source === "user" || confirmed.includes(key);
  const choice = foundations.choice ?? {};
  const keys = KEYS.filter(
    (key) =>
      choice[key] !== undefined &&
      candidate.values[key] !== undefined &&
      theirs(key) &&
      !candidate.assumed.includes(key) &&
      !same(key, choice[key], candidate.values[key]),
  ).map((key) => ({ key, settled: choice[key], outside: candidate.values[key] }));
  return [...keys, ...fontConflicts(root, candidate, choice, theirs)];
}

// The family a name of a typeface is: its first family, without quotes, in lower case.
const familyKey = (text) =>
  String(firstFamily(String(text)).name ?? text)
    .replace(/^["']|["']$/g, "")
    .trim()
    .toLowerCase();

// The family of the typeface the ledger settled for a key: the family of the font row it names, the
// floor's own declaration in the stylesheet, or the system font; null where it cannot be read.
function ledgerFamily(root, choice, key) {
  const value = choice[key];
  if (key === "heading_font" && value === "text") return ledgerFamily(root, choice, "text_font");
  if (value === "system") return "the system font";
  if (sourceFontId(value) !== null) {
    try {
      const row = JSON.parse(readFileSync(path.join(root, sourceFontFile(value)), "utf8"));
      return typeof row?.family === "string" ? row.family : null;
    } catch {
      return null;
    }
  }
  if (value !== "floor") return null;
  const sheet = findStylesheet(root);
  if (!sheet) return null;
  const declared = themeDeclarations({ css: withoutBlock(loadStyles(root, sheet).css) });
  // A family that is a variable is the variable's own declaration, followed a few steps at most.
  let variable = key === "text_font" ? FONT_VARIABLES[0] : FONT_VARIABLES[1];
  for (let step = 0; step < 4 && variable; step += 1) {
    const written = declared.findLast((item) => item.name === variable)?.value;
    if (written === undefined) return null;
    const first = firstFamily(written);
    if (!first.variable) return first.name ?? null;
    variable = first.variable;
  }
  return null;
}

// The typefaces an export of variables names against the ones the owner settled (spec 0018, open
// question 5): a family that differs is a question, as a colour is. The other kinds only name the
// fonts, as they did before item 13.1.
function fontConflicts(root, candidate, choice, theirs) {
  if (candidate.source.kind !== "variables") return [];
  const { text, heading } = candidate.fonts;
  return [
    ["text_font", text],
    ["heading_font", heading],
  ]
    .filter(([key, outside]) => outside && choice[key] !== undefined && theirs(key))
    .filter(([key]) => !(key === "heading_font" && choice[key] === "text" && heading === text))
    .map(([key, outside]) => ({ key, outside, family: ledgerFamily(root, choice, key) }))
    .filter(({ outside, family }) => family !== null && familyKey(family) !== familyKey(outside))
    .map(({ key, outside, family }) => ({
      key,
      settled: choice[key],
      outside: String(firstFamily(String(outside)).name ?? outside),
      settled_name: family,
    }));
}

// A source as the repository names it: its path from the repository's root when it is inside, else
// its file's name and that it is outside; never a path of the machine, which would land in a file
// of the repository and differ from one checkout to the next.
export function sourceOf(root, file) {
  const relative = path.relative(path.resolve(root), path.resolve(file));
  if (relative !== "" && !relative.startsWith("..") && !path.isAbsolute(relative)) {
    return { shown: relative.split(path.sep).join("/"), key: relative.split(path.sep).join("/") };
  }
  const name = path.basename(file);
  return { shown: `${name}, outside the repository`, key: `outside:${name}` };
}

// A short hash of a source's name in the repository, the same in every checkout.
const sourceHash = (source) => createHash("sha256").update(source.key).digest("hex").slice(0, 6);

const WORDS = {
  source_color: "source colour",
  type_scale: "type scale",
  type_ratio: "ratio of the type scale",
  corner_radius: "corner radius",
  text_font: "typeface of running text",
  heading_font: "typeface of headings",
};

// The question a value against the owner's asks.
function questionOf(candidate, conflict, on, source) {
  const what = WORDS[conflict.key];
  // A typeface is said by its family, and the word of the ledger beside it.
  const settled = conflict.settled_name
    ? `${conflict.settled_name} (${conflict.settled})`
    : conflict.settled;
  const font = conflict.key.endsWith("_font");
  return {
    // The path is in the id, hashed: two sources of one name ask apart.
    id: `${candidate.id}-${sourceHash(source)}-${conflict.key.replaceAll("_", "-")}`,
    kind: "question",
    group: "outside sources",
    question: `The outside direction ${candidate.name} has the ${what} ${conflict.outside}; the owner settled ${settled}. Keep ${settled}?`,
    recommendation: `Keep ${settled}: the ledger wins over an outside source.`,
    basis: `the ledger wins (specification 0014): ${settled} is the owner's answer in ${BLUEPRINT}; ${conflict.outside} comes from ${source.shown}`,
    hard_to_undo: false,
    where: `${BLUEPRINT}, foundations, ${conflict.key}`,
    if_refused: font
      ? `nothing changes by itself: a typeface is chosen with its source, as a font row of the sources ledger (font-source), then picked in the guide; the ledger changes only then`
      : `nothing changes by itself: to take ${conflict.outside}, run the guide again and pick it; the ledger changes only then`,
    asked_on: on,
  };
}

// What a run does: the candidate, the questions its values ask (the ones already waiting kept as
// they are), and the files of the new ones.
export function bringIn(
  root,
  from,
  { on = today(), dryRun = false, kind = null, collection = null } = {},
) {
  const candidate = candidateFrom(from, kind, { collection });
  const waiting = readWaiting(root, []);
  const source = sourceOf(root, from);
  const asked = conflictsOf(root, candidate).map((conflict) =>
    questionOf(candidate, conflict, on, source),
  );
  // A question that waits and asks other words, because the source's value changed, is asked anew;
  // one the owner answered stays as it is.
  const rowOf = (id) => (waiting?.rows ?? []).find((row) => row.id === id);
  const fresh = asked.filter((question) => {
    const row = rowOf(question.id);
    return !row || (row.answer === undefined && row.question !== question.question);
  });
  if (fresh.length > 0 && waiting?.shape === "file") {
    throw new Refusal(
      `the waiting list is one shared file, ${WAITING_LIST}, and a question would change it: split it first, with decide --split. Nothing was written`,
    );
  }
  const files = Object.fromEntries(
    fresh.map((question) => [questionFile(question.id), renderJson(question, lineWidth(root))]),
  );
  const waits = asked.filter((question) => rowOf(question.id)?.answer === undefined);
  return {
    candidate,
    questions: waits,
    files: writtenFiles(writeFiles(root, files, dryRun)),
    dry_run: dryRun,
  };
}

// The candidate and what waits, as a person reads it.
export function report({ candidate, questions }) {
  const { values } = candidate;
  const type = values.type_scale === "modular" ? `modular ${values.type_ratio}` : values.type_scale;
  const lines = [
    `candidate direction: ${candidate.name} (${KIND_WORDS[candidate.source.kind]}, ${candidate.source.file})`,
    `  colour ${values.source_color}${candidate.dark ? ` (dark ${candidate.dark.source_color})` : ""}, type ${type}, corner radius ${values.corner_radius}`,
  ];
  lines.push(`  colour taken from ${candidate.picked.source_color}`);
  if (candidate.variables) {
    for (const line of variablesLines(candidate.variables)) lines.push(`  ${line}`);
  }
  if (candidate.fonts.text) {
    lines.push(
      `  fonts named: ${[...new Set([candidate.fonts.text, candidate.fonts.heading])].join(", ")} (a typeface is chosen with its source, not here)`,
    );
  }
  for (const item of candidate.resolved)
    lines.push(`  computed: ${item.token} ${item.written} = ${item.value}`);
  for (const key of candidate.assumed)
    lines.push(`  not in the source, the floor's: ${WORDS[key]} ${values[key]}`);
  for (const item of candidate.approximated) {
    lines.push(`  taken to the plugin's nearest: ${WORDS[item.key]} ${item.from} as ${item.to}`);
  }
  for (const item of candidate.unread) lines.push(`  not read: ${item.token}: ${item.why}`);
  if (questions.length > 0) {
    lines.push(
      `Waiting on the owner: ${questions.length === 1 ? "1 question" : `${questions.length} questions`}; the ledger wins until they answer (/design-assembly:decide).`,
    );
    for (const question of questions) lines.push(`  ${question.id}: ${question.question}`);
  } else {
    lines.push("No value of it goes against a value the owner settled.");
  }
  lines.push(
    `Draw it beside the plugin's directions: specimen.mjs --section direction --from ${candidate.source.file}`,
  );
  return `${lines.join("\n")}\n`;
}

const USAGE =
  "usage: node bring-in.mjs --from PATH [--kind tokens|design-md|variables|system] [--target DIR] [--collection NAME] [--on DATE] [--dry-run] [--json]\n";

async function main(args) {
  const call = readCall(args, {
    "--from": "value",
    "--kind": "value",
    "--collection": "value",
    "--on": "value",
    "--dry-run": "switch",
  });
  if (call.problem) return refuse(call.problem, USAGE);
  if (call.help) return void stdout.write(USAGE);
  const from = call.flags["--from"];
  if (!from) return refuse("say what to read, with --from PATH", USAGE);
  const kind = call.flags["--kind"] ?? null;
  if (kind !== null && !KINDS.includes(kind))
    return refuse(`--kind is one of ${KINDS.join(", ")}`, USAGE);
  const on = call.flags["--on"] ?? today();
  if (!isDay(on)) return refuse(`--on ${on} is not a day written YYYY-MM-DD`, USAGE);
  const result = bringIn(call.target, path.resolve(from), {
    on,
    dryRun: call.flags["--dry-run"] === true,
    kind,
    collection: call.flags["--collection"] ?? null,
  });
  return finish({
    json: call.json,
    result,
    text: report(result),
    work: result.questions.length > 0,
  });
}

await start(import.meta.url, main);
