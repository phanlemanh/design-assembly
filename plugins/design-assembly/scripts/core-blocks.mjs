// The blocks of the family core a repository pinned, as its own commands read them (spec 0016,
// slice 1 of item 7.2): the family's store is tier 3 of the ladder find and intake walk, a block of
// it is an item the repository takes down, conforms and takes in as it does an item of an outside
// source, and the inventory tells a block behind the copy from one changed by hand. Everything is
// read from the copy of the core the repository keeps, compared with its pin before any of it is
// believed; the core folder is never reached for, so the answer is the same on every machine.
// Read-only: the move that takes a block down is in core-take.mjs.
import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

import { adapterOf } from "../templates/tools/design-assembly/adapters/index.mjs";
import {
  CORE,
  coreBlockFile,
  hiddenInBlock,
  PINNED_CORE,
  readPinnedCore,
  staysInBlock,
} from "../templates/tools/design-assembly/contract.mjs";
import { CORE_ID } from "../templates/tools/design-assembly/sources-ledger.mjs";
import { componentsOf, fileOf, text } from "./store.mjs";

// The name of the family's store among the stores find walks, and what a row of the intake ledger
// and a conform record name as where a block of the core came from: the id of the declaration.
export const FAMILY_STORE = "family";
export const CORE_SOURCE = CORE_ID;
// What tier 3 says on a repository that declares no family.
export const NO_FAMILY = "this repository is of no family (core --join declares one)";
// How a person reads where a block of the core comes from.
export const CORE_WORDS = "the family's core";

const sha = (bytes) => createHash("sha256").update(bytes).digest("hex");
const plural = (count, one, many) => `${count} ${count === 1 ? one : many}`;
const INDEX = CORE.parts.blocks.file;

// The hash that names a block as a copy of the core holds it: of its files, each with its hash, in
// the order of their names. It moves when a file of the block changes, comes or goes, and with
// nothing else: another block, an answer of the core or a member joining leave it as it is.
export const blockPinOf = (files) =>
  sha(
    JSON.stringify(
      [...files]
        .map(({ file, sha256 }) => [String(file), String(sha256)])
        .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0)),
    ),
  );

// Why a block of the copy cannot be taken, or null: a file named so that it leaves its folder, a
// file the pin does not hold (a copy pinned before copies held the files of blocks), or a file
// that is not the one the list of blocks names.
function unheld(pinned, block) {
  const files = Array.isArray(block.files) ? block.files : [];
  if (files.length === 0) return "the core's list names no file for it";
  for (const { file, sha256 } of files) {
    if (!staysInBlock(file)) return `its file ${file} leaves the folder of its need`;
    if (hiddenInBlock(file)) return `its file ${file} is hidden, or lies in a hidden folder`;
    const kept = coreBlockFile(block.need, file);
    const held = pinned.files?.[kept];
    if (held === undefined) {
      return `this repository's copy of the core does not hold ${kept}: the copy was pinned before copies held the files of blocks, so pin it again with core --join`;
    }
    if (held !== sha256) {
      return `${path.posix.join(pinned.snapshot, kept)} is not the file the core's list of blocks names: its sha256 differs`;
    }
  }
  return null;
}

// Whether the repository declares a family: `design/sources/core.json` is a declaration. A library
// someone named `core` is a library, and an item of it is an item of an outside source.
export const declaresFamily = (root) => readPinnedCore(root) !== null;

// The family's store as the repository holds it. `declared` is false on a repository of no family.
// A copy that cannot be read gives `unreadable`, why. Else the family, the pin, what was read, and
// every block of the copy, each with where its files are kept in the repository's copy, the hash
// that names it, and `left`, why it is not offered here, or null: its files are not in the copy,
// the repository lacks an adapter it needs, or a component of that name is in the repository.
export function readFamilyStore(root) {
  const pinned = readPinnedCore(root);
  if (pinned === null) return { declared: false };
  const read = [PINNED_CORE.file];
  if (pinned.unreadable) {
    return { declared: true, read, unreadable: pinned.unreadable, blocks: [] };
  }
  const have = new Set(componentsOf(root).components.map((component) => component.name));
  const blocks = (pinned.blocks ?? []).map((block) => {
    const files = Array.isArray(block.files) ? block.files : [];
    const adapters = Array.isArray(block.adapters)
      ? block.adapters.filter((kind) => text(kind))
      : [];
    const lacking = adapters.filter((kind) => !adapterOf(kind)?.present?.(root));
    const broken = unheld(pinned, block);
    const left =
      broken ??
      (have.has(block.name)
        ? "is already in the repository"
        : lacking.length > 0
          ? `needs the ${lacking.join(" and ")} ${lacking.length === 1 ? "adapter" : "adapters"}`
          : null);
    return {
      need: block.need,
      name: block.name,
      description: text(block.description),
      adapters,
      // The adapters it needs that the repository lacks, and whether a component of its name is
      // in the repository already: the block itself, once it is taken in.
      lacking,
      in_repository: have.has(block.name),
      broken,
      files: files.map(({ file, sha256 }) => ({
        file,
        sha256,
        kept: path.posix.join(pinned.snapshot, coreBlockFile(block.need, file)),
      })),
      pin_sha256: blockPinOf(files),
      left: left === null ? null : broken ? `${block.name}: ${left}` : `${block.name} ${left}`,
    };
  });
  return {
    declared: true,
    read: [...read, path.posix.join(pinned.snapshot, INDEX)],
    unreadable: null,
    family: pinned.family,
    pin: pinned.label,
    snapshot: pinned.snapshot,
    blocks,
  };
}

// The family's store as one store of the ladder: what was read, how many blocks are offered, why
// the store or a block of it is not, and the blocks offered. find makes its pieces of them.
export function familyStoreEntry(root) {
  const store = readFamilyStore(root);
  const entry = { store: FAMILY_STORE, read: null, items: null, why: NO_FAMILY, blocks: [] };
  if (!store.declared) return entry;
  if (store.unreadable) {
    return {
      ...entry,
      read: store.read,
      why: `the copy of the family core in ${PINNED_CORE.snapshot} cannot be read: ${store.unreadable}. No block of it is offered; pin it again with core --join`,
    };
  }
  const offered = store.blocks.filter((block) => block.left === null);
  const without = store.blocks.filter((block) => block.left !== null).map((block) => block.left);
  return {
    store: FAMILY_STORE,
    read: store.read,
    items: offered.length,
    why:
      without.length > 0
        ? `${plural(without.length, "block is", "blocks are")} not offered here: ${without.join("; ")}`
        : null,
    pin: store.pin,
    blocks: offered,
  };
}

// The hash that names a block in the copy of the core the repository holds now, by the block's
// need, or null: no family, a copy that cannot be read, or no such block.
export function blockPinSha256(root, need) {
  const store = readFamilyStore(root);
  if (!store.declared || store.unreadable) return null;
  return store.blocks.find((block) => block.need === need)?.pin_sha256 ?? null;
}

// What a block of the core brings, for the question the owner is asked before it is taken in: its
// files, the adapters it needs, and that nothing is fetched.
export function blockBrings(block) {
  const files = block.files.map((entry) => entry.file);
  const words = [
    `${plural(files.length, "file", "files")} of its own (${files.join(", ")})`,
    block.adapters.length > 0
      ? `it needs the ${block.adapters.join(" and ")} ${block.adapters.length === 1 ? "adapter" : "adapters"}, which this repository has`
      : "it needs no adapter",
    `copied from this repository's copy of the family core (${PINNED_CORE.snapshot}), nothing fetched`,
  ].join("; ");
  return { files: files.length, packages: [], asks_for: [], writes_over: [], words };
}

// ---- for the inventory ----------------------------------------------------------------------------

// Each block of the core taken down that is behind the copy the repository holds now, by its
// conform record: the record keeps the hash that named the block when it was taken down, compared
// with the hash that names it in the copy now. What cannot be compared is said through `blind`.
export function coreBlocksBehind(root, records, blind) {
  const mine = records.filter((record) => text(record.source) === CORE_SOURCE);
  if (mine.length === 0) return [];
  const store = readFamilyStore(root);
  // On a repository that declares no family, `core` is the id of a library, if of anything: its
  // items are compared as those of any outside source.
  if (!store.declared) return [];
  const found = [];
  for (const record of mine) {
    const need = text(record.need);
    const item = text(record.item) ?? need;
    const said = `${item} (${need})`;
    if (store.unreadable) {
      blind(
        "outdated",
        `the copy of the family core cannot be read (${store.unreadable}), so ${said} cannot be compared`,
        [item],
      );
      continue;
    }
    const block = store.blocks.find((each) => each.need === item);
    if (!block) {
      blind(
        "outdated",
        `the copy of the family core holds no block ${item}, so ${said} cannot be compared`,
        [item],
      );
      continue;
    }
    if (!text(record.pin_sha256)) {
      blind(
        "outdated",
        `the conform record of ${need} does not say which ${item} of the core it took, so it cannot be compared: conform --need ${need} --taken-down records it`,
        [item],
      );
      continue;
    }
    if (text(record.pin_sha256) === block.pin_sha256) continue;
    const file = (Array.isArray(record.conformed) ? record.conformed : [])
      .map((entry) => fileOf(entry?.file))
      .find(Boolean);
    found.push({
      source: CORE_SOURCE,
      item: { name: block.name, file: file ?? null, kind: "block", origin: "external" },
      line: `${block.name} was taken down for ${need} from ${CORE_WORDS}, and the copy pinned now (${store.pin}) holds another ${item} (${text(record.pin_sha256).slice(0, 12)}, now ${block.pin_sha256.slice(0, 12)}): take it down again with core --take ${item} --need ${need}, then run conform --need ${need} --taken-down`,
    });
  }
  return found;
}

// The family's store as the inventory counts it, or null on a repository of no family.
export function familyStoreCount(root) {
  const store = readFamilyStore(root);
  if (!store.declared) return null;
  return store.unreadable
    ? { store: FAMILY_STORE, kind: null, count: null, why: store.unreadable }
    : { store: FAMILY_STORE, kind: "block", count: store.blocks.length };
}

// The text of a file of a block, read from the repository's copy, or null when it is not there.
export function blockFileText(root, kept) {
  const full = path.join(root, kept);
  return existsSync(full) ? readFileSync(full, "utf8") : null;
}
