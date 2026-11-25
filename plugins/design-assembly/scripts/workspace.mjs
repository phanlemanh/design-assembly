// The root of a workspace of packages: a folder whose package file lists the folders of its
// packages, and that holds no screens and no stylesheet of its own. Aimed there, the commands that
// read a repository say so, name the packages that hold screens or a stylesheet, and say to aim at
// one with --target; nothing is written at the root.
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";

import { findStylesheet } from "../templates/tools/design-assembly/styles.mjs";
import { sourceFolder, walkSource } from "../templates/tools/design-assembly/source-folders.mjs";

const SOURCE = /\.[jt]sx$/;
const PACKAGE = "package.json";

const readJson = (file) => {
  try {
    return existsSync(file) ? JSON.parse(readFileSync(file, "utf8")) : null;
  } catch {
    return null;
  }
};

// The folders a package file lists as its workspace: `workspaces` as a list, or under `packages`.
function listed(root) {
  const data = readJson(path.join(root, PACKAGE));
  const spaces = data?.workspaces;
  const list = Array.isArray(spaces)
    ? spaces
    : Array.isArray(spaces?.packages)
      ? spaces.packages
      : [];
  return list.filter((item) => typeof item === "string" && !item.startsWith("!"));
}

// The folders a pattern of the list names: a folder, or every folder of one (`dir/*`). A pattern of
// another shape names nothing here, and is said.
function expand(root, pattern) {
  const plain = pattern.replace(/\/+$/, "");
  if (!plain.includes("*")) return [plain];
  const star = /^([^*]+)\/\*$/.exec(plain);
  if (!star) return null;
  const full = path.join(root, star[1]);
  if (!existsSync(full) || !statSync(full).isDirectory()) return [];
  return readdirSync(full)
    .sort()
    .filter((name) => !name.startsWith(".") && statSync(path.join(full, name)).isDirectory())
    .map((name) => `${star[1]}/${name}`);
}

// What one package holds: its source files under the folder it keeps them in, and its stylesheet.
function packageOf(root, folder) {
  const dir = path.join(root, folder);
  const { folder: source } = sourceFolder(dir);
  const files = walkSource(dir, source, (file) => SOURCE.test(file)).length;
  const stylesheet = findStylesheet(dir);
  return { path: folder, files, stylesheet };
}

// Whether a folder holds nothing a command reads: no stylesheet it names, and no screen or
// component under the folder it keeps its source in.
// A root that keeps screens of its own in a folder its settings do not name says so with
// source_folder in design/theme.json, and is then read as any repository: files of another kind
// of source beside the packages, such as the fixtures of a test kit, do not make it one.
function holdsNothing(root) {
  if (findStylesheet(root) !== null) return false;
  const { folder } = sourceFolder(root);
  const mine = (file) => SOURCE.test(file) || file.endsWith(".css");
  return walkSource(root, folder, mine).length === 0;
}

// The workspace a folder is the root of, or null: `{ packages, others, unread }`. `packages` are
// those that hold screens or a stylesheet; `others` counts the rest; `unread` lists patterns of
// the list this does not expand. Null as well when the folder holds something of its own: it is
// then read as any repository is.
export function workspaceOf(root) {
  const patterns = listed(root);
  if (patterns.length === 0) return null;
  const folders = [];
  const unread = [];
  for (const pattern of patterns) {
    const found = expand(root, pattern);
    if (found === null) unread.push(pattern);
    else folders.push(...found);
  }
  if (!holdsNothing(root)) return null;
  const all = [...new Set(folders)]
    .filter((folder) => existsSync(path.join(root, folder, PACKAGE)))
    .map((folder) => packageOf(root, folder));
  const packages = all.filter((item) => item.files > 0 || item.stylesheet !== null);
  return { packages, others: all.length - packages.length, unread };
}

// The workspace in words, one line each, for a person.
export function workspaceLines(space) {
  const total = space.packages.length + space.others;
  const lines = [
    `workspace: this folder is the root of a workspace of ${total} package(s), and holds no screens and no stylesheet of its own`,
  ];
  if (space.packages.length === 0) {
    lines.push("  no package holds screens or a stylesheet that this plugin reads");
  } else {
    lines.push("  packages that hold screens or a stylesheet:");
    for (const item of space.packages) {
      const parts = [`${item.files} source file(s)`];
      if (item.stylesheet) parts.push(`stylesheet ${item.stylesheet}`);
      lines.push(`    ${item.path}: ${parts.join(", ")}`);
    }
  }
  if (space.unread.length > 0) {
    lines.push(`  not expanded here: ${space.unread.join(", ")}`);
  }
  const first = space.packages[0]?.path;
  lines.push(
    first
      ? `  aim at one with --target, as --target ${first}; nothing is read or written at the root`
      : "  nothing is read or written at the root",
    "  a root that keeps screens of its own names their folder with source_folder in design/theme.json, and is then read as any repository",
  );
  return lines;
}
