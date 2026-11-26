// What a tool from outside made, read as tokens: a token file of groups and `$value`s (the format of
// the design token community group), the front matter of a DESIGN.md, or an export of variables by
// collection and mode. Every token comes back with what was written and the value it ends at: a
// reference is followed, an expression with `calc()` and `var()` is computed, and a value that
// cannot be read says why. It reads text it is given; it calls no model and no network.
import { existsSync, readFileSync, statSync } from "node:fs";
import path from "node:path";

import { readYaml } from "../templates/tools/design-assembly/yaml.mjs";

export const KINDS = ["tokens", "design-md", "variables", "system"];
// The pixels of one rem, as a browser reads a length when nothing changes its root size.
const REM_PX = 16;
const MODES = ["light", "dark"];
const DEPTH = 32;

const isObject = (value) => value !== null && typeof value === "object" && !Array.isArray(value);
const round = (value) => Number(value.toFixed(4));

// ---- expressions ---------------------------------------------------------------------------------

// The pieces of an expression: numbers with a unit, a token named by a reference or a variable, an
// operator or a bracket.
function piecesOf(text) {
  const pattern =
    /\s*(?:(-?\d*\.?\d+)(px|rem|em)?|var\(\s*--([\w-]+)\s*\)|\{([^}]+)\}|([+\-*/()])|calc\()/y;
  const pieces = [];
  let at = 0;
  while (at < text.length) {
    pattern.lastIndex = at;
    const found = pattern.exec(text);
    if (!found) {
      if (/^\s*$/.test(text.slice(at))) break;
      throw new Error(`cannot read ${text.trim()}`);
    }
    at = pattern.lastIndex;
    if (found[1] !== undefined) pieces.push({ number: Number(found[1]), unit: found[2] ?? null });
    else if (found[3] !== undefined) pieces.push({ variable: found[3] });
    else if (found[4] !== undefined) pieces.push({ reference: found[4].trim() });
    else if (found[5] !== undefined) pieces.push({ operator: found[5] });
    else pieces.push({ operator: "(" });
  }
  return pieces;
}

// A length in pixels, or a bare number.
const lengthOf = (number, unit) =>
  unit === "rem" || unit === "em"
    ? { value: number * REM_PX, px: true }
    : { value: number, px: unit === "px" };

// Reads a written value as a length or a number, or throws.
function readValue(written, where) {
  const plain = /^\s*(-?\d*\.?\d+)(px|rem|em)?\s*$/.exec(String(written));
  if (!plain) throw new Error(`${where} is ${written}, which is not a length or a number`);
  return lengthOf(Number(plain[1]), plain[2] ?? null);
}

// One operation of two values, kept a length where it is one.
function operate(operator, left, right) {
  if (operator === "*") {
    if (left.px && right.px) throw new Error("a length times a length is not a length");
    return { value: left.value * right.value, px: left.px || right.px };
  }
  if (operator === "/") {
    if (right.px) throw new Error("a length divided by a length is not a length");
    if (right.value === 0) throw new Error("a value is divided by zero");
    return { value: left.value / right.value, px: left.px };
  }
  if (left.px !== right.px) throw new Error("a length and a bare number are added");
  return {
    value: operator === "+" ? left.value + right.value : left.value - right.value,
    px: left.px,
  };
}

// Computes the pieces by the usual order: brackets, then times and divided by, then plus and minus.
function compute(pieces, lookup) {
  let at = 0;
  const atom = () => {
    const piece = pieces[at++];
    if (!piece) throw new Error("an expression ends too soon");
    if (piece.operator === "(") {
      const value = level(["+", "-"]);
      if (pieces[at++]?.operator !== ")") throw new Error("a bracket is not closed");
      return value;
    }
    if (piece.operator === "-") {
      const value = atom();
      return { ...value, value: -value.value };
    }
    if (piece.number !== undefined) return lengthOf(piece.number, piece.unit);
    if (piece.variable !== undefined) {
      return readValue(lookup.variable(piece.variable), `var(--${piece.variable})`);
    }
    if (piece.reference !== undefined) {
      return readValue(lookup.reference(piece.reference), `{${piece.reference}}`);
    }
    throw new Error(`${piece.operator} stands where a value should`);
  };
  // One level of operators: times and divided by over atoms, plus and minus over those.
  const level = (operators) => {
    const next = operators[0] === "+" ? () => level(["*", "/"]) : atom;
    let left = next();
    while (operators.includes(pieces[at]?.operator)) {
      const operator = pieces[at++].operator;
      left = operate(operator, left, next());
    }
    return left;
  };
  const result = level(["+", "-"]);
  if (at !== pieces.length) throw new Error("an expression goes on after its end");
  return result;
}

// How an expression finds the tokens it names: a map of path to final value, or an object that
// resolves a path when asked and lists every path.
function lookupOf(source) {
  const get = typeof source.get === "function" ? (key) => source.get(key) : (key) => source[key];
  const paths = source.paths ?? Object.keys(source);
  const reference = (key) => {
    const value = get(key);
    if (value === undefined || value === null) throw new Error(`{${key}} names no token`);
    return value;
  };
  const variable = (name) => {
    const key = paths.find((item) => item.replaceAll(".", "-") === name);
    if (key === undefined) throw new Error(`var(--${name}) names no token`);
    return reference(key);
  };
  return { reference, variable };
}

// The final value of a written value: a whole reference is the value it names; an expression of
// lengths is computed to pixels; anything else is the value as written. Throws with why when a
// name points nowhere or the sum cannot be done.
export function evaluate(written, source) {
  const text = String(written).trim();
  const lookup = lookupOf(source);
  const whole = /^\{([^}]+)\}$/.exec(text);
  if (whole) return String(lookup.reference(whole[1].trim()));
  if (!/calc\(|var\(|\{|^-?\d*\.?\d+(rem|em)$/.test(text)) return text;
  const result = compute(piecesOf(text), lookup);
  return result.px ? `${round(result.value)}px` : `${round(result.value)}`;
}

// ---- the three shapes ----------------------------------------------------------------------------

// The groups under which a group named light or dark is a mode of the theme, not a shade.
const THEME_ROOTS = ["color", "colors", "colour", "colours", "theme", "themes"];

// Where a path names a mode: a group named light or dark at the top, or right under a group of
// colours. Deeper, as `primary.light`, it is a shade of that colour and the path keeps it.
function modeOf(segments) {
  const at = segments.findIndex(
    (segment, index) =>
      MODES.includes(segment.toLowerCase()) &&
      (index === 0 || (index === 1 && THEME_ROOTS.includes(segments[0].toLowerCase()))),
  );
  if (at === -1) return { mode: null, logical: segments.join(".") };
  return {
    mode: segments[at].toLowerCase(),
    logical: segments.filter((_, index) => index !== at).join("."),
  };
}

// The mode a named mode of an export is: light or dark by its name, else the default is no mode
// and the others are known by their name.
function namedMode(name, isDefault) {
  if (/dark/i.test(name)) return "dark";
  if (/light/i.test(name)) return "light";
  return isDefault ? null : String(name).toLowerCase();
}

// A colour written as channels from 0 to 1, as `#rrggbb`.
function channelsHex({ r, g, b }) {
  const byte = (value) =>
    Math.round(Math.min(1, Math.max(0, Number(value))) * 255)
      .toString(16)
      .padStart(2, "0");
  return `#${byte(r)}${byte(g)}${byte(b)}`;
}

// A `$value` that is not text, written as text: a dimension of value and unit, or a colour with
// its hex.
function writtenOf(value) {
  if (typeof value === "string" || typeof value === "number") return String(value);
  if (isObject(value) && value.value !== undefined && value.unit !== undefined) {
    return `${value.value}${value.unit}`;
  }
  if (isObject(value) && typeof value.hex === "string") return value.hex;
  if (isObject(value) && ["r", "g", "b"].every((key) => typeof value[key] === "number")) {
    return channelsHex(value);
  }
  return null;
}

// The tokens of a token file: every node with a `$value`, by the path of its groups.
function fromTokenFile(data) {
  const found = [];
  const walk = (node, segments) => {
    if (!isObject(node)) return;
    if ("$value" in node) {
      found.push({ segments, written: writtenOf(node.$value) });
      return;
    }
    for (const [key, child] of Object.entries(node)) {
      if (!key.startsWith("$")) walk(child, [...segments, key]);
    }
  };
  walk(data, []);
  return found.map(({ segments, written }) => ({
    token: segments.join("."),
    ...modeOf(segments),
    written,
  }));
}

// Whether a token file is in the shape of a design system's tokens: each family a list of tokens
// with a name and a value, colours with a value per theme, type as families and groups of styles.
const isSystemList = (data) =>
  isObject(data) &&
  (Array.isArray(data.color?.tokens) ||
    Array.isArray(data.type?.groups) ||
    Array.isArray(data.spacing?.tokens) ||
    Array.isArray(data.radius?.tokens));

// The tokens of a design system's list: a colour by its name and theme, the first theme light where
// none is named so, a reference `{other}` to a colour of the same theme; the families and the font
// sizes of the type; the other families as they are listed.
function fromSystemList(data) {
  const found = [];
  const themes = Array.isArray(data.color?.themes) ? data.color.themes : [];
  const ids = themes.map((theme) => String(theme?.id ?? ""));
  // A theme is light or dark by its id or name, the first light where neither says; another is
  // known by its id.
  const modeIn = (id, index) => {
    const said = `${id} ${themes[index]?.name ?? ""}`;
    if (/dark/i.test(said)) return "dark";
    if (/light/i.test(said) || index === 0) return "light";
    return id.toLowerCase();
  };
  for (const item of Array.isArray(data.color?.tokens) ? data.color.tokens : []) {
    const name = `color.${item?.name}`;
    const value = item?.value;
    const written = (text) => {
      const alias = /^\{([^}]+)\}$/.exec(String(text ?? ""))?.[1];
      return alias ? `{color.${alias}}` : writtenOf(text);
    };
    if (!isObject(value)) {
      found.push({ token: name, mode: null, logical: name, written: written(value) });
      continue;
    }
    ids.forEach((id, index) => {
      // A theme the token does not hold takes the first theme's value.
      const text = value[id] ?? value[ids[0]];
      const mode = modeIn(id, index);
      found.push({ token: `${name}@${mode}`, mode, logical: name, written: written(text) });
    });
  }
  for (const [key, stack] of Object.entries(
    isObject(data.type?.families) ? data.type.families : {},
  )) {
    const token = `font.family.${key}`;
    found.push({ token, mode: null, logical: token, written: writtenOf(stack) });
  }
  for (const group of Array.isArray(data.type?.groups) ? data.type.groups : []) {
    for (const style of Array.isArray(group?.styles) ? group.styles : []) {
      if (style?.fontSize === undefined) continue;
      const token = `font.size.${style.name}`;
      found.push({ token, mode: null, logical: token, written: writtenOf(style.fontSize) });
    }
  }
  for (const family of ["spacing", "radius"]) {
    for (const item of Array.isArray(data[family]?.tokens) ? data[family].tokens : []) {
      // A name that starts with its family's, as `radius-md`, is that step of the family.
      const token = `${family}.${String(item?.name).replace(new RegExp(`^${family}-`), "")}`;
      found.push({ token, mode: null, logical: token, written: writtenOf(item?.value) });
    }
  }
  return found;
}

// The tokens of the front matter of a DESIGN.md: every value of its maps, by its path, and its name.
function fromDesignMd(source) {
  const text = source.replace(/^\uFEFF/, "");
  const front = /^---\r?\n([\s\S]*?)\r?\n---\s*(\r?\n|$)/.exec(text);
  if (!front) throw new Error("it has no front matter between two lines of ---");
  const data = readYaml(front[1]);
  const found = [];
  const walk = (node, segments) => {
    if (isObject(node)) {
      for (const [key, child] of Object.entries(node)) walk(child, [...segments, key]);
    } else if (segments.length > 1) {
      found.push({ token: segments.join("."), ...modeOf(segments), written: String(node) });
    }
  };
  for (const key of ["colors", "typography", "rounded", "spacing"]) {
    if (data[key] !== undefined) walk(data[key], [key]);
  }
  return { tokens: found, name: typeof data.name === "string" ? data.name : null };
}

// The tokens of an export of variables: each variable in each mode of its collection, its name's
// slashes read as the dots of a path, a reference to another variable written as one.
function fromVariables(data) {
  const meta = isObject(data.meta) ? data.meta : data;
  const collections = isObject(meta.variableCollections) ? meta.variableCollections : {};
  const variables = isObject(meta.variables) ? meta.variables : null;
  if (!variables) throw new Error("it lists no variables");
  const pathOf = (variable) => String(variable.name).split("/").join(".");
  const found = [];
  for (const variable of Object.values(variables)) {
    const collection = collections[variable.variableCollectionId] ?? {};
    const modes = Array.isArray(collection.modes) ? collection.modes : [];
    for (const [modeId, value] of Object.entries(variable.valuesByMode ?? {})) {
      const named = modes.find((mode) => mode.modeId === modeId)?.name ?? modeId;
      const mode = namedMode(named, modeId === collection.defaultModeId);
      const alias = isObject(value) && value.type === "VARIABLE_ALIAS" ? variables[value.id] : null;
      const written = alias
        ? `{${pathOf(alias)}}`
        : isObject(value) && value.type === "VARIABLE_ALIAS"
          ? `{${value.id}}`
          : writtenOf(value);
      const token = pathOf(variable);
      found.push({ token: mode ? `${token}@${mode}` : token, mode, logical: token, written });
    }
  }
  return found;
}

// ---- reading ------------------------------------------------------------------------------------

// The kind of what a path holds: a folder is a system of tokens and a README, a .md file is a
// DESIGN.md, a JSON file is an export of variables when it lists variables by collection, else a
// token file.
export function kindOf(file, text) {
  if (statSync(file).isDirectory()) return "system";
  if (file.toLowerCase().endsWith(".md")) return "design-md";
  const data = JSON.parse(text);
  const meta = isObject(data?.meta) ? data.meta : data;
  return isObject(meta?.variables) && isObject(meta?.variableCollections) ? "variables" : "tokens";
}

// Every token of a text of one kind, each with its final value, and the ones that could not be read.
export function readTokens(kind, text) {
  let name = null;
  let raw;
  if (kind === "design-md") ({ tokens: raw, name } = fromDesignMd(text));
  else if (kind === "variables") raw = fromVariables(JSON.parse(text));
  else {
    const data = JSON.parse(text);
    raw = isSystemList(data) ? fromSystemList(data) : fromTokenFile(data);
  }
  const byToken = new Map(raw.map((item) => [item.token, item]));
  const done = new Map();
  const resolve = (token, seen) => {
    if (done.has(token)) return done.get(token);
    const item = byToken.get(token);
    if (!item) return undefined;
    if (seen.includes(token)) throw new Error(`${token} refers back to itself`);
    if (seen.length > DEPTH) throw new Error(`${token} refers through too many tokens`);
    if (item.written === null)
      throw new Error(`${token} holds a value that is not text, a length or a colour`);
    const source = {
      // A reference in a mode reads the same token in that mode first.
      get: (key) =>
        (item.mode && byToken.has(`${key}@${item.mode}`)
          ? resolve(`${key}@${item.mode}`, [...seen, token])
          : undefined) ?? resolve(key, [...seen, token]),
      paths: raw.filter((other) => other.mode === null).map((other) => other.token),
    };
    const value = evaluate(item.written, source);
    done.set(token, value);
    return value;
  };
  const tokens = [];
  const unread = [];
  for (const item of raw) {
    try {
      tokens.push({ ...item, value: resolve(item.token, []) });
    } catch (error) {
      unread.push({ token: item.token, written: item.written, why: error.message });
    }
  }
  return { tokens, unread, name };
}

// Reads what a path holds: a file of one kind, or a system folder (its tokens.json, and the first
// heading of its README.md as its name). Throws with why when it cannot be read.
export function readOutside(file, kind = null) {
  const folder = statSync(file).isDirectory();
  const text = folder ? null : readFileSync(file, "utf8");
  const found = kind ?? kindOf(file, text);
  if (!KINDS.includes(found)) throw new Error(`--kind is one of ${KINDS.join(", ")}`);
  if (found !== "system") return { kind: found, ...readTokens(found, text) };
  const tokens = readTokens("tokens", readFileSync(path.join(file, "tokens.json"), "utf8"));
  return { kind: "system", ...tokens, name: readmeName(file) };
}

// The name a system folder's README gives it, its first heading, or null where it has none.
function readmeName(folder) {
  const readme = path.join(folder, "README.md");
  if (!existsSync(readme)) return null;
  return /^#\s+(.+)$/m.exec(readFileSync(readme, "utf8"))?.[1]?.trim() ?? null;
}
