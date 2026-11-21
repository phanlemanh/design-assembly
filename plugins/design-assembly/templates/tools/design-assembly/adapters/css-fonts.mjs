// What a stylesheet loads by itself: the typefaces of its own @font-face rules, and those of the
// packages it imports by name, read from where the repository installed them. Shared by the build
// adapters, whose stacks both load a font this way; nothing here is fetched.
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

// The typefaces the @font-face rules of a text declare, as written, quotes taken off.
export function faceFamilies(css) {
  const found = [];
  for (const rule of String(css).matchAll(/@font-face\s*\{([^}]*)\}/g)) {
    const family = /font-family\s*:\s*(["']?)([^;"']+)\1\s*;?/.exec(rule[1])?.[2]?.trim();
    if (family && !found.includes(family)) found.push(family);
  }
  return found;
}

// The packages a stylesheet imports by name: an import that is not a path and not an address.
export function importedPackages(css) {
  const found = [];
  for (const match of String(css).matchAll(/@import\s+(?:url\(\s*)?["']([^"']+)["']/g)) {
    const name = match[1];
    if (/^(\.{1,2}\/|\/|[a-z][a-z0-9+.-]*:)/i.test(name)) continue;
    if (!found.includes(name)) found.push(name);
  }
  return found;
}

const readJson = (file) => {
  try {
    return JSON.parse(readFileSync(file, "utf8"));
  } catch {
    return null;
  }
};

// The stylesheet a package import names, in the repository's installed packages, or null: the
// file of the path after the package's name, else what the package says its stylesheet is.
export function packageStylesheet(root, specifier) {
  const { folder } = packageFolder(root, specifier);
  const rest = specifier
    .split("/")
    .slice(specifier.startsWith("@") ? 2 : 1)
    .join("/");
  if (!existsSync(folder)) return null;
  const candidates = [];
  if (rest) candidates.push(rest, `${rest}.css`);
  else {
    const data = readJson(path.join(folder, "package.json")) ?? {};
    const entry = data.exports?.["."] ?? data.exports;
    const fromExports =
      typeof entry === "string" ? entry : (entry?.style ?? entry?.default ?? entry?.import);
    candidates.push(fromExports, data.style, data.main, "index.css");
  }
  const file = candidates
    .filter((item) => typeof item === "string" && item.endsWith(".css"))
    .map((item) => path.join(folder, item))
    .find((item) => existsSync(item));
  return file ?? null;
}

// The folder a package import names among the repository's installed packages.
function packageFolder(root, specifier) {
  const parts = specifier.split("/");
  const name = specifier.startsWith("@") ? parts.slice(0, 2).join("/") : parts[0];
  return { name, folder: path.join(root, "node_modules", name) };
}

// Every typeface a stylesheet loads by itself, each with what loads it; and each package it imports
// that is not installed here, whose typefaces could not be read.
export function stylesheetLoads(root, css, stylesheet) {
  const loads = faceFamilies(css).map((family) => ({
    family,
    by: `an @font-face rule of ${stylesheet}`,
  }));
  for (const specifier of importedPackages(css)) {
    const { name, folder } = packageFolder(root, specifier);
    if (!existsSync(folder)) {
      if (!loads.some((item) => item.missing === name)) loads.push({ missing: name });
      continue;
    }
    const file = packageStylesheet(root, specifier);
    if (!file) continue;
    for (const family of faceFamilies(readFileSync(file, "utf8"))) {
      loads.push({ family, by: `the package ${specifier}, which ${stylesheet} imports` });
    }
  }
  return loads;
}
