// Reads a repository's stylesheet the way the cascade sees it: the entry file with its relative
// imports put in place, and the framework's theme kept apart as the lowest layer.
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

import { parseColor } from "./color.mjs";
import { readVariable } from "./theme.mjs";

export const DEFAULT_STYLESHEET = "src/index.css";
const FRAMEWORK_THEME = "node_modules/tailwindcss/theme.css";

const read = (root, file) =>
  existsSync(path.join(root, file)) ? readFileSync(path.join(root, file), "utf8") : null;

// Where the repository says its stylesheet is, or null.
export function findStylesheet(root) {
  const config = read(root, "components.json");
  const declared = config ? JSON.parse(config).tailwind?.css : null;
  if (declared && read(root, declared) !== null) return declared;
  return read(root, DEFAULT_STYLESHEET) === null ? null : DEFAULT_STYLESHEET;
}

// `css` is the repository's own text in cascade order; `base` is the framework's theme, read only
// when a value points into it. `files` lists what was read.
export function loadStyles(root, entry) {
  const files = [];
  const inline = (file) => {
    const text = read(root, file);
    if (text === null || files.includes(file)) return "";
    files.push(file);
    return text.replace(/^@import\s+["'](\.{1,2}\/[^"']+)["'];?[ \t]*$/gm, (_, relative) =>
      inline(path.posix.join(path.posix.dirname(file), relative)),
    );
  };
  return { css: inline(entry), base: read(root, FRAMEWORK_THEME) ?? "", files };
}

// The selectors a repository may write its dark mode under, most common first.
export const DARK_SCOPES = [".dark", ":root.dark", "html.dark"];

// A variable the repository's own text declares for a selector, or null: no fallback to the root.
export function ownValue(styles, scope, name) {
  return readVariable(styles.css, scope, name);
}

function declared(styles, scope, name) {
  const own = readVariable(styles.css, scope, name) ?? readVariable(styles.css, ":root", name);
  if (own !== null) return own;
  const pattern = new RegExp(`(?:^|[\\s;{])${name}\\s*:\\s*([^;]+);`, "g");
  return [...(styles.base ?? "").matchAll(pattern)].pop()?.[1].trim() ?? null;
}

// A variable as the cascade resolves it for a selector. `value` is what is written; `color` is
// what it ends up as after following var(), or null when that cannot be read here.
export function resolve(styles, scope, name) {
  const value = declared(styles, scope, name);
  if (value === null) return null;
  let current = value;
  for (let depth = 0; depth < 8; depth += 1) {
    const pointer = /^var\(\s*(--[\w-]+)\s*\)$/.exec(current);
    if (!pointer) break;
    current = declared(styles, scope, pointer[1]);
    if (current === null) return { value, color: null };
  }
  return { value, color: parseColor(current) };
}
