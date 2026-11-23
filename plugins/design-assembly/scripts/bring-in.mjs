// The bridge in (specification 0014): what a tool from outside made, read into one candidate
// direction, in the choice keys every direction of the plugin uses: a source colour, a type scale
// and a corner radius. The candidate stands beside the plugin's directions on the sheet (specimen
// --from); it is never written to a ledger or a stylesheet. A value of it against a value the owner
// settled becomes a question on the waiting list, and the ledger wins until the owner says
// otherwise. It reads the file it is given and the repository's blueprint; it calls no model and no
// network.
// Usage: node bring-in.mjs --from PATH [--kind tokens|design-md|variables|system] [--target DIR]
//                          [--on DATE] [--dry-run] [--json]
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

// How a token answers a name: 0 its path ends with it, 1 it is that colour's default shade, else
// not at all.
function nameRank(segments, name) {
  if (segments.at(-1) === name) return 0;
  return segments.at(-2) === name && SHADE_DEFAULTS.includes(segments.at(-1)) ? 1 : null;
}

// The colour a source names first among the names, with the token it came from: a token under a
// group of colours before one elsewhere, the name itself before a shade of it, the shortest path
// before a longer one. Null where no colour that can be read has any of the names.
function colourOf(tokens, names) {
  for (const name of names) {
    const ranked = tokens
      .filter((token) => tokenHex(token.value) !== null)
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
      return { hex: tokenHex(ranked[0].token.value).slice(0, 7), token: ranked[0].token.logical };
    }
  }
  return null;
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
export function candidateFrom(file, kind = null) {
  const read = readSource(file, kind);
  const { tokens } = read;
  const names = ["primary", "brand", "accent"];
  const colour = colourOf(base(tokens), names);
  if (!colour) {
    throw new Refusal(
      `${file} names no primary colour that can be read, so there is no direction to draw`,
    );
  }
  const dark = colourOf(
    tokens.filter((token) => token.mode === "dark"),
    names,
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
  return KEYS.filter(
    (key) =>
      choice[key] !== undefined &&
      candidate.values[key] !== undefined &&
      theirs(key) &&
      !candidate.assumed.includes(key) &&
      !same(key, choice[key], candidate.values[key]),
  ).map((key) => ({ key, settled: choice[key], outside: candidate.values[key] }));
}

// A short hash of a path, the same for the same path on every run.
const pathHash = (file) =>
  createHash("sha256").update(path.resolve(file)).digest("hex").slice(0, 6);

const WORDS = {
  source_color: "source colour",
  type_scale: "type scale",
  type_ratio: "ratio of the type scale",
  corner_radius: "corner radius",
};

// The question a value against the owner's asks.
function questionOf(candidate, conflict, on) {
  const what = WORDS[conflict.key];
  return {
    // The path is in the id, hashed: two sources of one name ask apart.
    id: `${candidate.id}-${pathHash(candidate.source.file)}-${conflict.key.replaceAll("_", "-")}`,
    kind: "question",
    group: "outside sources",
    question: `The outside direction ${candidate.name} has the ${what} ${conflict.outside}; the owner settled ${conflict.settled}. Keep ${conflict.settled}?`,
    recommendation: `Keep ${conflict.settled}: the ledger wins over an outside source.`,
    basis: `the ledger wins (specification 0014): ${conflict.settled} is the owner's answer in ${BLUEPRINT}; ${conflict.outside} comes from ${candidate.source.file}`,
    hard_to_undo: false,
    where: `${BLUEPRINT}, foundations, ${conflict.key}`,
    if_refused: `nothing changes by itself: to take ${conflict.outside}, run the guide again and pick it; the ledger changes only then`,
    asked_on: on,
  };
}

// What a run does: the candidate, the questions its values ask (the ones already waiting kept as
// they are), and the files of the new ones.
export function bringIn(root, from, { on = today(), dryRun = false, kind = null } = {}) {
  const candidate = candidateFrom(from, kind);
  const waiting = readWaiting(root, []);
  const asked = conflictsOf(root, candidate).map((conflict) => questionOf(candidate, conflict, on));
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
  "usage: node bring-in.mjs --from PATH [--kind tokens|design-md|variables|system] [--target DIR] [--on DATE] [--dry-run] [--json]\n";

async function main(args) {
  const call = readCall(args, {
    "--from": "value",
    "--kind": "value",
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
  });
  return finish({
    json: call.json,
    result,
    text: report(result),
    work: result.questions.length > 0,
  });
}

await start(import.meta.url, main);
