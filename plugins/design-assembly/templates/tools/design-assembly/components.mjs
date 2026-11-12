// The component manifest: the components the source exports and the variants each one declares,
// in the registry format the acceptance kit reads. It is derived: a component is changed in its
// source file, and this file is written again from the source.
// Usage: node tools/design-assembly/components.mjs [--write] [--target DIR]
import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  realpathSync,
  statSync,
  writeFileSync,
} from "node:fs";
import path from "node:path";
import { argv, cwd, exit, stderr, stdout } from "node:process";
import { fileURLToPath } from "node:url";

// The file a repository gets when nothing names another one, and the folder read by default.
export const REGISTRY = "design/component-registry.json";
export const COMPONENTS_FOLDER = "src/components/ui";
// The id of the decision that this file says what the source says.
export const COMPONENTS_DECISION = "component-manifest";
const VERSION = "1";

// Every source file of a folder, by path from the repository root.
export function readFolder(root, folder) {
  const found = {};
  const walk = (dir) => {
    const full = path.join(root, dir);
    if (!existsSync(full)) return;
    for (const name of readdirSync(full).sort()) {
      const relative = path.posix.join(dir, name);
      if (statSync(path.join(root, relative)).isDirectory()) walk(relative);
      else if (/\.[jt]sx$/.test(name))
        found[relative] = readFileSync(path.join(root, relative), "utf8");
    }
  };
  walk(folder);
  return found;
}

// The index just past the string that opens at `at`, so that braces inside class names and
// template text are never counted.
function skipString(text, at) {
  const quote = text[at];
  for (let i = at + 1; i < text.length; i += 1) {
    if (text[i] === "\\") i += 1;
    else if (text[i] === quote) return i + 1;
  }
  return text.length;
}

// The index of the bracket that closes the one at `at`.
function closing(text, at) {
  const pairs = { "{": "}", "(": ")", "[": "]" };
  const stack = [];
  for (let i = at; i < text.length; i += 1) {
    const char = text[i];
    if (char === '"' || char === "'" || char === "`") {
      i = skipString(text, i) - 1;
    } else if (pairs[char]) stack.push(pairs[char]);
    else if (char === stack.at(-1)) {
      stack.pop();
      if (stack.length === 0) return i;
    }
  }
  return -1;
}

// The entries of the object literal that opens at `at`: each key with the text of its value.
function entries(text, at) {
  const end = closing(text, at);
  const found = [];
  let i = at + 1;
  while (i < end) {
    const key = /^\s*(?:"([^"]+)"|'([^']+)'|([A-Za-z_$][\w$]*))\s*:/.exec(text.slice(i, end));
    if (!key) break;
    let stop = i + key[0].length;
    const from = stop;
    while (stop < end && text[stop] !== ",") {
      const char = text[stop];
      if (char === '"' || char === "'" || char === "`") stop = skipString(text, stop);
      else if ("{([".includes(char)) stop = closing(text, stop) + 1;
      else stop += 1;
    }
    found.push({ key: key[1] ?? key[2] ?? key[3], value: text.slice(from, stop).trim() });
    i = stop + 1;
  }
  return found;
}

// Variant axes declared with the class-variance helper: `const name = cva(base, { variants })`.
function declaredSets(text) {
  const sets = {};
  for (const match of text.matchAll(/\bconst\s+(\w+)\s*=\s*cva\(/g)) {
    const open = match.index + match[0].length - 1;
    const call = text.slice(open, closing(text, open) + 1);
    // The options are the object after the base classes: the first brace outside a string.
    let at = 1;
    while (at < call.length && call[at] !== "{") {
      at = "\"'`".includes(call[at]) ? skipString(call, at) : at + 1;
    }
    if (at >= call.length) continue;
    const options = Object.fromEntries(entries(call, at).map((item) => [item.key, item.value]));
    const axes = {};
    for (const axis of options.variants ? entries(options.variants, 0) : []) {
      axes[axis.key] = entries(axis.value, 0).map((item) => item.key);
    }
    const defaults = {};
    for (const item of options.defaultVariants ? entries(options.defaultVariants, 0) : []) {
      const value = /^["']([^"']+)["']$/.exec(item.value);
      if (value) defaults[item.key] = value[1];
    }
    sets[match[1]] = { axes, defaults };
  }
  return sets;
}

// Names a file exports that are components: they start with a capital letter.
function exported(text) {
  const names = [];
  for (const list of text.matchAll(/^export\s*\{([^}]*)\}/gm)) {
    for (const item of list[1].split(",")) {
      const name = item
        .trim()
        .split(/\s+as\s+/)
        .at(-1);
      if (name) names.push(name);
    }
  }
  for (const direct of text.matchAll(/^export\s+(?:default\s+)?(?:function|const)\s+(\w+)/gm)) {
    names.push(direct[1]);
  }
  return [...new Set(names)].filter((name) => /^[A-Z]/.test(name));
}

// The source of one component: from its declaration to the next declaration at the left margin.
function declaration(text, name) {
  const start = new RegExp(
    `^(?:export\\s+)?(?:function\\s+${name}\\b|const\\s+${name}\\s*=)`,
    "m",
  ).exec(text);
  if (!start) return "";
  const rest = text.slice(start.index + start[0].length);
  const next = /^(?:export\b|function\b|const\b)/m.exec(rest);
  return start[0] + (next ? rest.slice(0, next.index) : rest);
}

// The manifest for a set of source files: one entry per exported component. A component's
// variants are the axes of the variant sets it calls, and the props it types as a closed list of
// words. Each is written `axis=value`, the form a plan names a variant in.
export function readComponents(files) {
  const sets = {};
  for (const text of Object.values(files)) Object.assign(sets, declaredSets(text));
  const components = [];
  for (const [file, text] of Object.entries(files).sort(([a], [b]) => (a < b ? -1 : 1))) {
    for (const name of exported(text)) {
      const source = declaration(text, name);
      const axes = {};
      const defaults = {};
      for (const [setName, set] of Object.entries(sets)) {
        if (!new RegExp(`\\b${setName}\\b`).test(source)) continue;
        Object.assign(axes, set.axes);
        Object.assign(defaults, set.defaults);
      }
      const signature = source.slice(
        0,
        source.search(/\)\s*(?::[^{]+)?\{|=>/) + 1 || source.length,
      );
      for (const prop of signature.matchAll(/(\w+)\??:\s*((?:"[^"]+"\s*\|\s*)+"[^"]+")/g)) {
        axes[prop[1]] ??= [...prop[2].matchAll(/"([^"]+)"/g)].map((value) => value[1]);
      }
      for (const given of signature.matchAll(/(\w+)\s*=\s*"([^"]+)"/g)) {
        if (given[1] in axes) defaults[given[1]] ??= given[2];
      }
      const variants = Object.entries(axes).flatMap(([axis, values]) =>
        values.map((value) => `${axis}=${value}`),
      );
      components.push({
        name,
        category: "component",
        file,
        ...(variants.length > 0 ? { variants } : {}),
        ...(Object.keys(defaults).length > 0 ? { defaults } : {}),
      });
    }
  }
  return { version: VERSION, components };
}

// The line width the repository's formatter keeps, so the file is written the way it leaves it.
export function lineWidth(root) {
  const read = (file) => {
    try {
      return JSON.parse(readFileSync(path.join(root, file), "utf8"));
    } catch {
      return null;
    }
  };
  return (
    read(".prettierrc.json")?.printWidth ??
    read(".prettierrc")?.printWidth ??
    read("package.json")?.prettier?.printWidth ??
    80
  );
}

// JSON laid out as a formatter leaves it: objects open, a list of words on one line when it fits.
export function renderManifest(manifest, width = 80) {
  const lines = (value, indent, lead, tail) => {
    const pad = " ".repeat(indent);
    if (Array.isArray(value) && value.every((item) => typeof item !== "object")) {
      const flat = `${pad}${lead}[${value.map((item) => JSON.stringify(item)).join(", ")}]${tail}`;
      if (flat.length <= width) return [flat];
    }
    if (typeof value !== "object" || value === null) {
      return [`${pad}${lead}${JSON.stringify(value)}${tail}`];
    }
    const list = Array.isArray(value);
    const items = list ? value.map((item) => ["", item]) : Object.entries(value);
    if (items.length === 0) return [`${pad}${lead}${list ? "[]" : "{}"}${tail}`];
    return [
      `${pad}${lead}${list ? "[" : "{"}`,
      ...items.flatMap(([key, item], index) =>
        lines(
          item,
          indent + 2,
          list ? "" : `${JSON.stringify(key)}: `,
          index < items.length - 1 ? "," : "",
        ),
      ),
      `${pad}${list ? "]" : "}"}${tail}`,
    ];
  };
  return `${lines(manifest, 0, "", "").join("\n")}\n`;
}

// Why the file is not what the source gives, or null. Compared as data.
export function componentsProblem(text, files, file, folder) {
  if (text === null || text === undefined) return `${file} is missing: run make design-components`;
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    return `${file} is not valid JSON: run make design-components`;
  }
  if (JSON.stringify(data) === JSON.stringify(readComponents(files))) return null;
  return `${file} is not what ${folder} gives: run make design-components instead of editing it`;
}

function main() {
  const args = argv.slice(2);
  const at = args.indexOf("--target");
  const root = at === -1 ? cwd() : path.resolve(args[at + 1] ?? "");
  const themeFile = path.join(root, "design/theme.json");
  const theme = existsSync(themeFile) ? JSON.parse(readFileSync(themeFile, "utf8")) : null;
  const check = theme?.checks?.[COMPONENTS_DECISION]?.[0];
  if (!check) {
    stderr.write("design-assembly: this repository does not keep a component manifest yet\n");
    exit(1);
  }
  const files = readFolder(root, check.folder);
  const manifest = readComponents(files);
  const full = path.join(root, check.file);
  const before = existsSync(full) ? readFileSync(full, "utf8") : null;
  const count = `${manifest.components.length} components`;
  if (componentsProblem(before, files, check.file, check.folder) === null) {
    stdout.write(`component manifest: ${check.file} is up to date (${count})\n`);
    return;
  }
  if (!args.includes("--write")) {
    stderr.write(`component manifest: ${check.file} is not what ${check.folder} gives\n`);
    exit(1);
  }
  mkdirSync(path.dirname(full), { recursive: true });
  writeFileSync(full, renderManifest(manifest, lineWidth(root)));
  stdout.write(`component manifest: wrote ${check.file} from ${check.folder} (${count})\n`);
}

if (argv[1] && realpathSync(argv[1]) === realpathSync(fileURLToPath(import.meta.url))) main();
