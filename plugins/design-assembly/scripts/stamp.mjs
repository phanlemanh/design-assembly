// The tool stamp: the one file a repository keeps that says which version of this plugin its copy
// of the tool came from, and the hash git gives that folder as it was written. Every command that
// writes the tool into a repository writes the stamp with it; status and upgrade read it. The
// version is never trusted alone: the hash of the folder as it is now says whether the copy is
// still the one that was stamped.
import { Buffer } from "node:buffer";
import { createHash } from "node:crypto";
import { existsSync, lstatSync, readdirSync, readFileSync, readlinkSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { TOOL } from "../templates/tools/design-assembly/ledger.mjs";

const PLUGIN = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const json = (file) => JSON.parse(readFileSync(path.join(PLUGIN, file), "utf8"));

// The version of the plugin that is running.
export const VERSION = json(".claude-plugin/plugin.json").version;
// Where a repository keeps its copy of the tool, and where this plugin keeps the one it installs.
export const TOOL_COPY = path.posix.dirname(TOOL.slice("tool:".length));
export const TOOL_SOURCE = path.join(PLUGIN, "templates", TOOL_COPY);
// Where the repository keeps the stamp.
export const STAMP = "design/tool-stamp.json";
// Every released version of this plugin, with the tree of the tool it installs. Kept by
// `make plugin-version` in this plugin's own repository, and checked there by its gate.
export const RELEASES_FILE = "references/releases.json";
export const RELEASES = json(RELEASES_FILE).releases;

const hashOf = (type, body) =>
  createHash("sha1").update(`${type} ${body.length}\0`).update(body).digest();

// The tree object git would write for a folder, or null when the folder is missing or holds no
// file. Names that start with a dot are left out: a file an editor or the system drops into the
// folder is not the tool.
function treeOf(dir) {
  if (!existsSync(dir) || !statSync(dir).isDirectory()) return null;
  const entries = [];
  for (const name of readdirSync(dir)) {
    if (name.startsWith(".")) continue;
    const full = path.join(dir, name);
    const found = lstatSync(full);
    if (found.isDirectory()) {
      const hash = treeOf(full);
      // git sorts a folder as if its name ended with a slash, and keeps no empty folder.
      if (hash) entries.push({ mode: "40000", name, hash, order: `${name}/` });
    } else if (found.isSymbolicLink()) {
      const hash = hashOf("blob", Buffer.from(readlinkSync(full)));
      entries.push({ mode: "120000", name, hash, order: name });
    } else {
      const mode = found.mode & 0o111 ? "100755" : "100644";
      entries.push({ mode, name, hash: hashOf("blob", readFileSync(full)), order: name });
    }
  }
  if (entries.length === 0) return null;
  entries.sort((a, b) => Buffer.compare(Buffer.from(a.order), Buffer.from(b.order)));
  return hashOf(
    "tree",
    Buffer.concat(
      entries.flatMap((entry) => [Buffer.from(`${entry.mode} ${entry.name}\0`), entry.hash]),
    ),
  );
}

// The hash git gives a folder as a tree, in hex, so that a stamp written by git and one computed
// here are the same text.
export function treeHash(dir) {
  return treeOf(dir)?.toString("hex") ?? null;
}

// The tree of the tool this plugin installs.
export const installedTree = () => treeHash(TOOL_SOURCE);

// The stamp as a repository keeps it: the version of the plugin, and the tree of the tool as it
// was written. Two keys, laid out as a formatter leaves them.
export const stampText = (version = VERSION, tree = installedTree()) =>
  `${JSON.stringify({ version, tree }, null, 2)}\n`;

// The stamp of a repository, or null when it has none. A stamp that cannot be read is a repository
// that cannot be read: the caller stops, it does not guess.
export function readStamp(root) {
  const file = path.join(root, STAMP);
  if (!existsSync(file)) return null;
  let data;
  try {
    data = JSON.parse(readFileSync(file, "utf8"));
  } catch {
    throw new Error(`${STAMP} is not JSON`);
  }
  if (typeof data?.version !== "string" || !/^[0-9a-f]{40}$/.test(String(data?.tree))) {
    throw new Error(`${STAMP} does not give a version and the tree of ${TOOL_COPY}`);
  }
  return { version: data.version, tree: data.tree };
}

// The released version whose tool has this tree, or null: a copy with no stamp can still be named
// by its content when it is exactly the tool of a release.
export const releaseOf = (tree) =>
  tree === null ? null : (RELEASES.find((release) => release.tool === tree)?.version ?? null);
