// What a kind of screen is, read from source: the page each kind has, which kind every screen
// belongs to, the real screen each kind names as its reference, and the screen sizes pages are
// checked at.
import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";

import { CORE_STATES, readScreens } from "./patterns.mjs";

// One page per kind of screen. The folder and the front matter are the ones the acceptance kit
// reads, so a repository keeps one page for both tools; the keys are in the kit's own language.
export const KINDS_FOLDER = "design/patterns";
const KEY = {
  kind: "nhom", // the kind's name, equal to the file name
  task: "nhan_viec", // the main task of a person on a screen of this kind
  files: "nhan_dien", // globs of the source files that draw a screen of this kind
  reference: "mau_dang_chay", // { tep }: the source file of the kind's reference screen
  file: "tep",
  exceptions: "ngoai_le", // [{ tep, khoi?, ly_do }]: without `khoi`, the file leaves the kind
  part: "khoi",
};
// Files in the folder that are not a kind of screen.
const NOT_A_KIND = ["README.md", "lech-lot.md"];

// The file a person owns: the widths every page is checked at.
export const SIZES_FILE = "design/screen-sizes.json";
// The browser test this tool installs, which reads that file.
export const PAGES_TEST = "tests/e2e/templates.spec.ts";
// WCAG 2.2, reflow: a page must work at a width of 320 CSS pixels.
export const REFLOW_WIDTH = 320;
export const STARTER_WIDTHS = [REFLOW_WIDTH, 1440];

// Every page of the folder, by path.
export function readPages(root, folder = KINDS_FOLDER) {
  const full = path.join(root, folder);
  if (!existsSync(full)) return {};
  const found = {};
  for (const name of readdirSync(full).sort()) {
    if (!name.endsWith(".md") || NOT_A_KIND.includes(name)) continue;
    found[path.posix.join(folder, name)] = readFileSync(path.join(full, name), "utf8");
  }
  return found;
}

const scalar = (text) => {
  const value = text.trim();
  const quoted = /^(["'])(.*)\1$/.exec(value);
  return quoted ? quoted[2] : value.replace(/\s+#.*$/, "");
};

// Splits `a, "b, c", {d: e}` at the commas that are not inside quotes or brackets.
function splitFlow(text) {
  const parts = [];
  let depth = 0;
  let quote = null;
  let from = 0;
  for (let i = 0; i < text.length; i += 1) {
    const c = text[i];
    if (quote) quote = c === quote ? null : quote;
    else if (c === '"' || c === "'") quote = c;
    else if (c === "[" || c === "{") depth += 1;
    else if (c === "]" || c === "}") depth -= 1;
    else if (c === "," && depth === 0) {
      parts.push(text.slice(from, i));
      from = i + 1;
    }
  }
  parts.push(text.slice(from));
  return parts.map((part) => part.trim()).filter((part) => part !== "");
}

function flow(text) {
  const value = text.trim();
  if (value.startsWith("[") && value.endsWith("]")) return splitFlow(value.slice(1, -1)).map(flow);
  if (value.startsWith("{") && value.endsWith("}")) {
    return Object.fromEntries(
      splitFlow(value.slice(1, -1)).map((pair) => {
        const at = pair.indexOf(":");
        return [pair.slice(0, at).trim(), flow(pair.slice(at + 1))];
      }),
    );
  }
  return scalar(value);
}

// The lines of a block that sit deeper than `indent`, as a value: a list, a map or nothing.
function block(lines, indent) {
  const inner = [];
  // A list may sit at the indent of its own key.
  const inside = (line) =>
    line.trim() === "" ||
    line.search(/\S/) > indent ||
    (line.search(/\S/) === indent && /^\s*-(\s|$)/.test(line));
  while (lines.length > 0 && inside(lines[0])) inner.push(lines.shift());
  const own = inner.filter((line) => line.trim() !== "" && !line.trim().startsWith("#"));
  if (own.length === 0) return "";
  const depth = own[0].search(/\S/);
  if (own[0].trim().startsWith("- ") || own[0].trim() === "-") {
    const items = [];
    while (own.length > 0) {
      const first = own.shift();
      const rest = first.slice(depth + 1).replace(/^ /, "");
      const body = [];
      while (own.length > 0 && own[0].search(/\S/) > depth) body.push(own.shift());
      const field = /^([\w-]+):(\s|$)/.test(rest);
      // `- key: value` opens a map whose other keys follow, indented under it.
      if (field) items.push(map([" ".repeat(depth + 2) + rest, ...body]));
      else items.push(body.length > 0 ? block(body, depth) : flow(rest));
    }
    return items;
  }
  return map(own);
}

function map(lines) {
  const found = {};
  const rest = [...lines];
  while (rest.length > 0) {
    const line = rest.shift();
    if (line.trim() === "" || line.trim().startsWith("#")) continue;
    const field = /^(\s*)([\w-]+):\s*(.*)$/.exec(line);
    if (!field) continue;
    found[field[2]] = field[3].trim() === "" ? block(rest, field[1].length) : flow(field[3]);
  }
  return found;
}

// The front matter of a page as data, or null when the page has none. Reads the block style and
// the one-line style of YAML that such pages use; nothing here depends on a YAML library.
export function frontMatter(text) {
  const found = /^---\r?\n([\s\S]*?)\r?\n---(\r?\n|$)/.exec(text ?? "");
  return found ? map(found[1].split(/\r?\n/)) : null;
}

const list = (value) => (Array.isArray(value) ? value : value ? [value] : []);

// Each kind of screen a repository describes: its name, its main task, the files of its screens
// and the file of its reference screen.
export function readKinds(pages) {
  return Object.entries(pages).map(([file, text]) => {
    const data = frontMatter(text) ?? {};
    const named = data[KEY.files];
    // A list of globs, or a map that keeps the list under its file key.
    const globs = list(Array.isArray(named) ? named : named?.[KEY.file]).filter(
      (glob) => typeof glob === "string",
    );
    const left = list(data[KEY.exceptions])
      .filter((item) => item && typeof item === "object" && !list(item[KEY.part]).length)
      .map((item) => item[KEY.file]);
    return {
      file,
      name: path.posix.basename(file, ".md"),
      kind: typeof data[KEY.kind] === "string" ? data[KEY.kind] : "",
      task: typeof data[KEY.task] === "string" ? data[KEY.task].trim() : "",
      globs,
      left,
      reference:
        typeof data[KEY.reference] === "object" ? (data[KEY.reference][KEY.file] ?? "") : "",
    };
  });
}

// A glob as a pattern: `**` crosses folders, `*` and `?` stay inside one.
export function globPattern(glob) {
  let pattern = "";
  for (let i = 0; i < glob.length; i += 1) {
    const c = glob[i];
    if (c === "*" && glob[i + 1] === "*") {
      const folders = glob[i + 2] === "/";
      pattern += folders ? "(?:.*/)?" : ".*";
      i += folders ? 2 : 1;
    } else if (c === "*") pattern += "[^/]*";
    else if (c === "?") pattern += "[^/]";
    else pattern += c.replace(/[.+^${}()|[\]\\]/g, "\\$&");
  }
  return new RegExp(`^${pattern}$`);
}

const belongs = (kind, file) =>
  !kind.left.includes(file) && kind.globs.some((glob) => globPattern(glob).test(file));

// Each screen of the registry with the source file that draws it: the module its `load` imports.
// `sources` are the source files there are, by path; the file is null when none can be told.
export function screenFiles(registryText, sources) {
  const text = registryText ?? "";
  const starts = [...text.matchAll(/\bpath:\s*["']([^"']+)["']/g)];
  return readScreens(text).map((screen, index) => {
    const slice = text.slice(starts[index].index, starts[index + 1]?.index ?? text.length);
    const module = /\bimport\(\s*["']([^"']+)["']\s*\)/.exec(slice)?.[1];
    if (!module) return { ...screen, file: null };
    const base = module.startsWith("@/")
      ? `src/${module.slice(2)}`
      : path.posix.join("src", module);
    const tries = [base, `${base}.tsx`, `${base}.jsx`, `${base}/index.tsx`, `${base}/index.jsx`];
    return { ...screen, file: tries.find((file) => file in sources) ?? null };
  });
}

// Why the screens are not each of one described kind, or null.
export function kindsProblem(pages, registryText, sources, folder = KINDS_FOLDER) {
  const kinds = readKinds(pages);
  if (kinds.length === 0) return `no page under ${folder} describes a kind of screen`;
  const found = [];
  for (const kind of kinds) {
    const missing = [
      ...(kind.kind ? [] : [KEY.kind]),
      ...(kind.task ? [] : [`${KEY.task}: the main task`]),
      ...(kind.globs.length > 0 ? [] : [`${KEY.files}: the files of its screens`]),
    ];
    if (missing.length > 0) found.push(`${kind.file} has no ${missing.join(", no ")}`);
    else if (kind.kind !== kind.name) {
      found.push(`${kind.file} names the kind ${kind.kind}, not ${kind.name} as its file does`);
    }
  }
  const screens = screenFiles(registryText, sources);
  if (screens.length === 0) found.push("no screen is listed, so no screen is measured");
  for (const screen of screens) {
    if (screen.file === null) {
      found.push(`${screen.path}: cannot tell which file draws it`);
      continue;
    }
    const of = kinds.filter((kind) => belongs(kind, screen.file));
    if (of.length === 0) {
      found.push(
        `${screen.path} (${screen.file}) is of no kind: add its file to the page of its kind, or describe a new kind`,
      );
    } else if (of.length > 1) {
      found.push(`${screen.path} (${screen.file}) is of ${of.map((k) => k.name).join(" and ")}`);
    }
  }
  return found.length > 0 ? found.slice(0, 5).join("; ") : null;
}

// Why a kind's reference screen cannot stand as one, or null. It is a real screen of the registry,
// of that kind, and it declares every state a view of data has.
export function referenceProblem(pages, registryText, statesText, sources) {
  const kinds = readKinds(pages);
  if (kinds.length === 0) return "no kind of screen is described, so no reference is measured";
  let table;
  try {
    table = JSON.parse(statesText ?? "{}");
  } catch {
    table = {};
  }
  const required = table.required ?? CORE_STATES;
  const screens = screenFiles(registryText, sources);
  const found = [];
  for (const kind of kinds) {
    if (!kind.reference) {
      found.push(`${kind.file} names no reference screen (${KEY.reference}.${KEY.file})`);
      continue;
    }
    const screen = screens.find((item) => item.file === kind.reference);
    if (!screen) {
      found.push(`${kind.file}: ${kind.reference} is not the file of a listed screen`);
    } else if (!belongs(kind, kind.reference)) {
      found.push(`${kind.file}: ${kind.reference} is not of the kind ${kind.name}`);
    } else if (screen.path in (table.exempt ?? {})) {
      found.push(`${kind.file}: ${screen.path} is excused from the states, so it shows none`);
    } else {
      const missing = required.filter((state) => !screen.states.includes(state));
      if (missing.length > 0) {
        found.push(`${kind.file}: ${screen.path} declares no state named ${missing.join(", ")}`);
      }
    }
  }
  return found.length > 0 ? found.slice(0, 5).join("; ") : null;
}

// Why the screen sizes are not ones pages are checked at, or null.
export function sizesProblem(sizesText, testText, file = SIZES_FILE, test = PAGES_TEST) {
  if (sizesText === null || sizesText === undefined) return `${file} is missing`;
  let widths;
  try {
    widths = JSON.parse(sizesText).widths;
  } catch {
    return `${file} is not valid JSON`;
  }
  if (!Array.isArray(widths) || widths.length === 0) return `${file} lists no width`;
  if (widths.some((width) => !Number.isInteger(width) || width <= 0)) {
    return `${file}: every width is a whole number of CSS pixels`;
  }
  if (Math.min(...widths) > REFLOW_WIDTH) {
    return `${file}: the narrowest width is ${Math.min(...widths)}px, and a page must work at ${REFLOW_WIDTH}px`;
  }
  if (testText === null || testText === undefined) {
    return `${test} is missing, so no page is checked at these widths`;
  }
  if (!testText.includes(path.posix.basename(file))) {
    return `${test} does not read ${file}, so pages are not checked at these widths`;
  }
  return null;
}
