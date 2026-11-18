// The ledger of outside sources: which libraries a repository picks blocks from, in what order, at
// which pin, and where the list of what each one offers is kept. One file per source,
// `design/sources/<id>.json`, so that pinning one source again writes that file alone.
//
// Nothing here fetches. A source is pinned by the repository's own tool or by a person; this reads
// the pin, compares the snapshot it names with the hashes it records, and reads the catalog. A
// source that cannot be read this way is said to be unreadable, with why, and offers nothing.
import { createHash } from "node:crypto";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";

export const SOURCES_FOLDER = "design/sources";
export const SOURCES_VERSION = 1;

const isMap = (value) => value !== null && typeof value === "object" && !Array.isArray(value);
const text = (value) => (typeof value === "string" ? value : undefined);

// The items of a catalog, each with its name, kind, title, description, and where it can be seen.
// A catalog lists its items, or keeps them in groups: an item in a group takes the group's kind,
// group and category, and the group's page when it has none of its own.
export function catalogItems(catalog) {
  const item = (entry, group = {}) => {
    const read = {
      name: text(entry?.name),
      kind: text(entry?.kind) ?? text(group.kind),
      title: text(entry?.title),
      description: text(entry?.description),
      group: text(entry?.group) ?? text(group.group),
      category: text(entry?.category) ?? text(group.category),
      page: text(entry?.page) ?? text(group.base),
    };
    return Object.fromEntries(Object.entries(read).filter(([, value]) => value !== undefined));
  };
  const flat = Array.isArray(catalog?.items) ? catalog.items.map((entry) => item(entry)) : [];
  const grouped = Array.isArray(catalog?.groups)
    ? catalog.groups.flatMap((group) =>
        Array.isArray(group?.items) ? group.items.map((entry) => item(entry, group)) : [],
      )
    : [];
  return [...flat, ...grouped].filter((entry) => entry.name);
}

// A path a source names, inside the repository, or null when it leads out of it.
function inside(root, file) {
  const full = path.resolve(root, String(file));
  const relative = path.relative(path.resolve(root), full);
  return relative.startsWith("..") || path.isAbsolute(relative) ? null : full;
}

// Why a path a source names cannot be read, or null.
const outside = (root, file, what) =>
  inside(root, file) === null ? `${file}, ${what}, is outside the repository` : null;

const isFile = (full) => existsSync(full) && statSync(full).isFile();
const readJson = (root, file) => JSON.parse(readFileSync(inside(root, file), "utf8"));

// Why the snapshot a pin names differs from it, or null when every file matches. What could not
// be compared is said in `blind`.
function snapshotProblem(root, source, pin, blind) {
  if (!Array.isArray(pin?.files)) {
    blind.push(`${source.id} is pinned by a version, so no snapshot of it is compared`);
    return null;
  }
  if (source.snapshot === undefined) {
    blind.push(`${source.id} names no snapshot folder, so its pinned files are not compared`);
    return null;
  }
  if (typeof source.snapshot !== "string") return `its snapshot is not the path of a folder`;
  for (const entry of pin.files) {
    const file = path.posix.join(source.snapshot, String(entry?.file ?? ""));
    const away = outside(root, file, "a file of its pin");
    if (away) return away;
    const full = inside(root, file);
    if (!existsSync(full)) return `${file}, a file of its pin, is not there`;
    if (!isFile(full)) return `${file}, a file of its pin, cannot be read as a file`;
    const hash = createHash("sha256").update(readFileSync(full)).digest("hex");
    if (hash !== entry.sha256) {
      return `${file} is not the file it was pinned with: its sha256 differs from the pin`;
    }
  }
  return null;
}

// One source as the tools use it, read from its file: its pin, the items of its catalog, and why
// it is unreadable when it is.
function readSource(root, name) {
  const file = `${SOURCES_FOLDER}/${name}`;
  const id = name.replace(/\.json$/, "");
  const blind = [];
  const unreadable = (why) => ({ id, file, unreadable: why, items: null, blind });
  let source;
  try {
    source = readJson(root, file);
  } catch {
    return unreadable(`${file} is not valid JSON`);
  }
  if (!isMap(source)) return unreadable(`${file} is not an object`);
  const version = Number(source.version);
  if (Number.isFinite(version) && version > SOURCES_VERSION) {
    return unreadable(
      `${file} has shape ${version} and this tool knows shape ${SOURCES_VERSION}: update the design-assembly plugin`,
    );
  }
  const said = {
    id,
    file,
    title: text(source.title) ?? id,
    order: typeof source.order === "number" ? source.order : null,
    catalog: text(source.catalog) ?? null,
    install: text(source.install) ?? null,
    licence: text(source.licence) ?? null,
  };
  for (const [key, what] of [
    ["pin_file", "the file its pin is kept in"],
    ["snapshot", "its snapshot"],
    ["catalog", "its catalog"],
  ]) {
    const away = typeof source[key] === "string" ? outside(root, source[key], what) : null;
    if (away) return { ...said, ...unreadable(away) };
  }
  let pin = isMap(source.pin) ? source.pin : null;
  if (!pin && source.pin_file) {
    try {
      pin = readJson(root, source.pin_file);
    } catch {
      return {
        ...said,
        ...unreadable(`${source.pin_file}, the file its pin is kept in, cannot be read`),
      };
    }
  }
  if (!isMap(pin)) return { ...said, ...unreadable(`${file} has no pin`) };
  const snapshot = snapshotProblem(root, { ...source, id }, pin, blind);
  if (snapshot) return { ...said, pin, ...unreadable(snapshot) };
  if (!said.catalog) return { ...said, pin, ...unreadable(`${file} names no catalog`) };
  let catalog;
  try {
    catalog = readJson(root, said.catalog);
  } catch {
    return { ...said, pin, ...unreadable(`${said.catalog}, its catalog, cannot be read`) };
  }
  return { ...said, pin, unreadable: null, items: catalogItems(catalog), blind };
}

// Every pinned source of a repository, in the order they are looked through: by `order`, the
// smallest first and a source without one last, then by id. Empty when it keeps none.
export function readPinnedSources(root) {
  const folder = path.join(root, SOURCES_FOLDER);
  if (!existsSync(folder) || !statSync(folder).isDirectory()) return [];
  return readdirSync(folder)
    .filter((name) => name.endsWith(".json") && isFile(path.join(folder, name)))
    .sort()
    .map((name) => readSource(root, name))
    .sort(
      (a, b) =>
        (a.order ?? Infinity) - (b.order ?? Infinity) || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0),
    );
}
