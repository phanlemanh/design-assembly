// inventory: what the store holds and whether it can be trusted (interface inventory). It counts the
// pieces of each store and each kind, gives each piece of the repository its state, and finds six
// kinds of trouble: a piece no screen uses, one the code uses that the ledger does not record, one
// thing taken twice, a block behind the pin of its source, a block changed from its source with no
// reason recorded, and a component written in a screen that other screens import. What it cannot
// look at it names, with why, rather than report a guess. Read-only; the same repository always gives
// the same answer. With --out it also hands the answer over as a document, the inventory report.
// Usage: node inventory.mjs [--store repo|starter|external|all] [--kind component|block|screen-kind|behaviour]
//        [--strict] [--target DIR] [--json] [--out DIR [--format html|pdf]]
// Exit: 0 the inventory is given; 1 with --strict when there is a finding, or when the document was
// written in fewer formats than asked; 2 a wrong call, or a repository that cannot be read.
import { workspaceLines, workspaceOf } from "./workspace.mjs";
import { createHash } from "node:crypto";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { stdout } from "node:process";
import { fileURLToPath } from "node:url";

import { screensOf } from "../templates/tools/design-assembly/affected.mjs";
import { isByHand } from "../templates/tools/design-assembly/intake-ledger.mjs";
import { KINDS_FOLDER, readKinds, readPages } from "../templates/tools/design-assembly/screens.mjs";
import { CONFORM_FOLDER } from "../templates/tools/design-assembly/contract.mjs";
import { mandatoryOff, mandatoryRules } from "./conform-rules.mjs";
import { movedLines, movedOf } from "./core-moved.mjs";
import {
  pinSha256,
  readPinnedSources,
} from "../templates/tools/design-assembly/sources-ledger.mjs";
import { finish, readCall, Refusal, start } from "./command.mjs";
import { coreBlocksBehind, CORE_SOURCE, declaresFamily, familyStoreCount } from "./core-blocks.mjs";
import { DOCUMENT_FLAGS, handOver, plural, requested } from "./document.mjs";
import { VERSION } from "./stamp.mjs";
import {
  componentsOf,
  fileOf,
  insideRoot,
  isMap,
  pinOf,
  readIntake,
  readTheme,
  text,
} from "./store.mjs";

const PLUGIN = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const json = (file) => JSON.parse(readFileSync(path.join(PLUGIN, file), "utf8"));
const STARTER = json("references/starter.json").items;
const LIMITS = json("references/limits.json").limits;

export const FINDINGS = [
  "unused",
  "unrecorded",
  "duplicate",
  "outdated",
  "modified",
  "exempts-mandatory",
  "promote",
];
export const STORES = ["repo", "starter", "external", "all"];
export const KINDS = ["component", "block", "screen-kind", "behaviour"];
const BEHAVIOURS = "no store keeps behaviours yet: a behaviour is described in design/behaviors.md";
// The word a block of the ledger names the starter kit by, as where it came from.
const STARTER_SOURCE = "starter";

const sha = (bytes) => createHash("sha256").update(bytes).digest("hex");
// What a block is called in a sentence: its name, else its need.
const nameOf = (block) => text(block.name) ?? text(block.need) ?? "(unnamed)";
// Whether a block records a reason it was changed from its source: words, or a map with something in it.
const hasReason = (value) =>
  isMap(value) ? Object.keys(value).length > 0 : Boolean(text(value)?.trim());
// The bytes of a file of the repository, or null when it cannot be read.
const bytesOf = (root, file) => {
  try {
    return readFileSync(path.join(root, file));
  } catch {
    return null;
  }
};
const isFile = (root, file) =>
  existsSync(path.join(root, file)) && statSync(path.join(root, file)).isFile();

// ---- who uses what --------------------------------------------------------------------------------

// Which screens reach each file and whether the frame does, or why that is not known. Unused is only
// said when every user is known: each screen, the frame, and every import followed.
function usageOf(root, theme) {
  let read;
  try {
    read = screensOf(root, theme ?? {});
  } catch (error) {
    return { known: false, why: `which screens use a piece is not known: ${error.message}` };
  }
  const { screens, served = [], routed = false, frame = null } = read;
  if (screens === null) {
    return {
      known: false,
      why: `no ledger of screens at ${read.ledger}: which screens use a piece is not known`,
    };
  }
  const framed = new Set([...(frame?.files ?? []), ...served.flatMap((entry) => [...entry.files])]);
  const opaque = [
    ...screens.flatMap((screen) => screen.opaque),
    ...(frame?.opaque ?? []),
    ...served.flatMap((entry) => entry.opaque),
  ];
  const pageless = screens.filter((screen) => screen.pages.length === 0).map((screen) => screen.id);
  const whole =
    pageless.length > 0
      ? `the page of ${pageless.join(", ")} is not found: a piece only ${pageless.length === 1 ? "that screen reaches" : "those screens reach"} would be called unused`
      : frame === null && !routed
        ? "no entry of the application's frame was found (no module its index.html loads): a piece only the frame reaches would be called unused"
        : opaque.length > 0
          ? `${plural(opaque.length, "import cannot", "imports cannot")} be followed, the first ${opaque[0].name} in ${opaque[0].file}: a piece only it reaches would be called unused`
          : null;
  return {
    known: true,
    whole,
    screens,
    entries: frame?.entries ?? [],
    screensOf: (file) =>
      screens
        .filter((screen) => screen.files.has(file))
        .map((screen) => screen.id)
        .sort(),
    inFrame: (file) => framed.has(file),
  };
}

// ---- the pieces -----------------------------------------------------------------------------------

// Where a block came from: the starter kit, an outside source, or the repository's own hands.
function originOf(ledger, block) {
  if (text(block.from) === STARTER_SOURCE) return "starter";
  if (!text(block.source) || isByHand(ledger, block)) return "repo";
  return "external";
}

// The state of a piece: retired, and still in use or not; else in use or not. Null when who uses
// it is not known.
function stateOf(usage, file, retired) {
  const used = usage.known && file ? usage.screensOf(file).length > 0 || usage.inFrame(file) : null;
  if (retired) return used ? "retired-in-use" : "retired";
  if (used === null) return null;
  return used ? "in-use" : "unused";
}

function usersOn(usage, file) {
  return {
    used_by: usage.known && file ? usage.screensOf(file) : [],
    frame: Boolean(usage.known && file && usage.inFrame(file)),
  };
}

// Every piece of the repository: each block of the intake ledger, then each component its file is
// not a block's, in the order they are read.
function piecesOf(read, usage) {
  const { intake, components } = read;
  const byFile = new Map(components.map((component) => [component.file, component]));
  const blockFiles = new Set(intake.blocks.map((block) => fileOf(block.file)).filter(Boolean));
  const blocks = intake.blocks.map((block) => {
    const file = fileOf(block.file);
    const retired = Boolean(block.retired) || Boolean(block.merged_into);
    return {
      name: nameOf(block),
      kind: "block",
      store: "intake",
      origin: originOf(intake.ledger, block),
      file,
      component: byFile.get(file)?.name ?? null,
      source: text(block.source),
      from: text(block.from),
      pin: text(block.pin),
      ...usersOn(usage, file),
      state: stateOf(usage, file, retired),
    };
  });
  const own = components
    .filter((component) => !blockFiles.has(component.file))
    .map((component) => ({
      name: component.name,
      kind: "component",
      store: "components",
      origin: "repo",
      file: component.file,
      source: component.source,
      ...usersOn(usage, component.file),
      state: stateOf(usage, component.file, false),
    }));
  return [...blocks, ...own];
}

// ---- the stores -----------------------------------------------------------------------------------

const countBy = (list, kindOf) =>
  [...new Set(list.map(kindOf))].sort().map((kind) => ({
    kind,
    count: list.filter((item) => kindOf(item) === kind).length,
  }));

function storesOf(read) {
  const kinds = readKinds(readPages(read.root, KINDS_FOLDER));
  const repo = [
    { store: "repo", kind: "block", count: read.intake.blocks.length },
    { store: "repo", kind: "component", count: read.components.length },
    { store: "repo", kind: "screen-kind", count: kinds.length },
  ];
  const starter = countBy(STARTER, (item) => item.kind).map((entry) => ({
    store: "starter",
    ...entry,
  }));
  const external = read.sources.flatMap((source) =>
    source.items
      ? countBy(source.items, (item) => item.kind ?? "block").map((entry) => ({
          store: "external",
          source: source.id,
          ...entry,
        }))
      : [{ store: "external", source: source.id, kind: null, count: null, why: source.unreadable }],
  );
  // The family's store, on a repository that declares a family: the blocks its copy of the core
  // holds. A repository of no family has no such line.
  const family = familyStoreCount(read.root);
  return [...repo, ...starter, ...(family ? [family] : []), ...external];
}

// ---- the findings ---------------------------------------------------------------------------------

const about = (piece) => ({
  name: piece.name,
  file: piece.file,
  kind: piece.kind,
  origin: piece.origin,
});

// What each file of the repository's own store is: the blocks that name it and the components in
// it, own components only.
function ownFiles(pieces) {
  const files = new Map();
  for (const piece of pieces) {
    if (!piece.file || (piece.kind === "component" && piece.source !== "own")) continue;
    files.set(piece.file, [...(files.get(piece.file) ?? []), piece]);
  }
  return files;
}

function unusedOf(read, pieces, usage) {
  return [...ownFiles(pieces)]
    .filter(
      ([file, held]) => isFile(read.root, file) && held.every((piece) => piece.state === "unused"),
    )
    .map(([file, held]) => ({
      kind: "unused",
      items: [about(held[0])],
      evidence: [
        `no screen imports ${file}, and neither does the frame`,
        `screens read: ${usage.screens.map((screen) => screen.id).join(", ") || "none"}; the frame starts from ${usage.entries.join(", ") || "the server's own entries"}`,
      ],
    }));
}

function unrecordedOf(read, pieces) {
  const recorded = new Set(read.intake.blocks.map((block) => fileOf(block.file)));
  const before = Array.isArray(read.intake.ledger.before)
    ? read.intake.ledger.before.filter(isMap)
    : [];
  const listedFiles = new Set(before.map((entry) => fileOf(entry.file)).filter(Boolean));
  const listedNames = new Set(before.map((entry) => text(entry.name)).filter(Boolean));
  return [...ownFiles(pieces)]
    .filter(
      ([file, held]) =>
        held.every((piece) => piece.kind === "component") &&
        held.some((piece) => piece.state === "in-use") &&
        !recorded.has(file) &&
        !listedFiles.has(file) &&
        !held.some((piece) => listedNames.has(piece.name)),
    )
    .map(([file, held]) => ({
      kind: "unrecorded",
      items: [about(held[0])],
      evidence: [
        `${held.map((piece) => piece.name).join(", ")} in ${file} is used by ${[...new Set(held.flatMap((piece) => piece.used_by))].join(", ") || "the frame"}`,
        `${read.intake.kept} has no block for ${file}, and its list of what came before does not name it`,
      ],
    }));
}

// Groups of files that are one thing taken more than once: the same item of the same source under
// two needs, the same bytes, or the same name exported by two files of the repository's own.
function duplicateOf(read, pieces) {
  // A file only retired blocks name is what retiring was for: it is nobody's second copy.
  const files = new Map(
    [...ownFiles(pieces)].filter(
      ([, held]) =>
        !held.every((piece) => piece.kind === "block" && piece.state?.startsWith("retired")),
    ),
  );
  const parent = new Map([...files.keys()].map((file) => [file, file]));
  const top = (file) => (parent.get(file) === file ? file : top(parent.get(file)));
  const why = [];
  const join = (a, b, said) => {
    if (a === b || !parent.has(a) || !parent.has(b)) return;
    parent.set(top(b), top(a));
    why.push({ files: [a, b], said });
  };
  const firstBy = (keyOf, said) => {
    const seen = new Map();
    for (const [file, held] of files) {
      for (const key of keyOf(file, held)) {
        if (seen.has(key)) join(seen.get(key), file, said(key, seen.get(key), file));
        else seen.set(key, file);
      }
    }
  };
  // Only an item the catalog of a readable source holds: a word it does not hold, such as the
  // repository's own word for made by hand not declared under `values`, names no item at all.
  const itemOf = (block) => {
    const source = sourceOf(read, block);
    const name = text(block.source);
    return source?.items?.some((item) => item.name === name) ? `${source.id} ${name}` : null;
  };
  firstBy(
    (file) =>
      read.live
        .filter((block) => fileOf(block.file) === file)
        .map(itemOf)
        .filter(Boolean),
    (key, a, b) => `${a} and ${b} are both ${key} of the same source`,
  );
  firstBy(
    (file) => {
      const bytes = isFile(read.root, file) ? bytesOf(read.root, file) : null;
      return bytes ? [sha(bytes)] : [];
    },
    (key, a, b) => `${a} and ${b} hold the same bytes`,
  );
  firstBy(
    (file, held) => held.filter((piece) => piece.kind === "component").map((piece) => piece.name),
    (key, a, b) => `${a} and ${b} both export ${key}`,
  );
  const groups = new Map();
  for (const file of files.keys()) groups.set(top(file), [...(groups.get(top(file)) ?? []), file]);
  return [...groups.values()]
    .filter((group) => group.length > 1)
    .map((group) => ({
      kind: "duplicate",
      items: group.sort().map((file) => about(files.get(file)[0])),
      evidence: why
        .filter((reason) => group.includes(reason.files[0]))
        .map((reason) => reason.said),
    }));
}

// The source a block was taken from: the one it names, or the only one pinned.
function sourceOf(read, block) {
  const from = text(block.from);
  if (from) return read.sources.find((source) => source.id === from) ?? null;
  return read.sources.length === 1 ? read.sources[0] : null;
}

// The conform records of the repository, each with its file, as written: one that cannot be read
// is the shape check's to name.
function conformRecords(root) {
  const folder = path.join(root, CONFORM_FOLDER);
  if (!existsSync(folder)) return [];
  return readdirSync(folder)
    .filter((name) => name.endsWith(".json"))
    .sort()
    .map((name) => {
      try {
        return {
          file: `${CONFORM_FOLDER}/${name}`,
          ...JSON.parse(readFileSync(path.join(folder, name), "utf8")),
        };
      } catch {
        return null;
      }
    })
    .filter((record) => isMap(record) && text(record.need) && text(record.source));
}

// Each item conformed at a pin of its source that is no longer the source's pin: its record keeps
// the hash of the pin it was written at, compared with the hash of the pin the repository holds
// now. Taken in or only taken down, each item is named. Nothing is fetched.
function recordsBehind(read, blind) {
  const records = conformRecords(read.root);
  // A block of the family core is compared with the repository's copy of the core, block by block.
  const family = declaresFamily(read.root);
  const found = family ? coreBlocksBehind(read.root, records, blind) : [];
  for (const record of records) {
    if (family && text(record.source) === CORE_SOURCE) continue;
    const need = text(record.need);
    const item = text(record.item) ?? need;
    const source = read.sources.find((each) => each.id === text(record.source));
    const said = `${item} (${need})`;
    if (!source && text(record.source) === CORE_SOURCE) {
      // A block of a family core, on a repository that is of no family any more.
      blind(
        "outdated",
        `${said} was taken from a family core this repository is no longer of: the block is the repository's own now, and is compared with no core`,
        [item],
      );
      continue;
    }
    if (!source) {
      blind("outdated", `${said} names a source that is not pinned`, [item]);
      continue;
    }
    const now = pinSha256(read.root, source.id);
    if (now === null) {
      blind("outdated", `${source.id} has no pin that can be read, so ${said} cannot be compared`, [
        item,
      ]);
      continue;
    }
    if (!text(record.pin_sha256)) {
      blind(
        "outdated",
        `the conform record of ${need} was written before it kept its source's pin, so it cannot be compared: conform --need ${need} --taken-down records it`,
        [item],
      );
      continue;
    }
    if (text(record.pin_sha256) === now) continue;
    const file = (Array.isArray(record.conformed) ? record.conformed : [])
      .map((entry) => fileOf(entry?.file))
      .find(Boolean);
    found.push({
      source: source.id,
      item: { name: item, file: file ?? null, kind: "block", origin: "external" },
      line: `${item} was conformed for ${need} at a pin of ${source.id} that is not the one pinned now (${text(record.pin_sha256).slice(0, 12)}, now ${now.slice(0, 12)}): take it down at the new pin and run conform --need ${need} --taken-down`,
    });
  }
  return found;
}

function outdatedOf(read, blind) {
  const behind = new Map();
  // An item with a conform record is compared by the pin the record holds.
  for (const { source, item, line } of recordsBehind(read, blind)) {
    behind.set(source, [...(behind.get(source) ?? []), { item, line }]);
  }
  for (const block of read.live.filter(
    (item) => originOf(read.intake.ledger, item) === "external" && !text(item.conform),
  )) {
    const name = nameOf(block);
    const source = sourceOf(read, block);
    if (!source) blind("outdated", `${name} names a source that is not pinned`, [name]);
    else if (!source.items)
      blind("outdated", `${source.id} cannot be read: ${source.unreadable}`, [name]);
    else if (!text(block.pin))
      blind("outdated", "a block with no pin cannot be compared with its source", [name]);
    else {
      const now = pinOf(source.pin);
      // The pin as the source keeps it, the day it was fetched, or its version.
      const forms = [now, text(source.pin?.fetched_at)?.slice(0, 10), text(source.pin?.version)];
      if (forms.includes(text(block.pin))) continue;
      behind.set(source.id, [
        ...(behind.get(source.id) ?? []),
        {
          item: {
            name: text(block.name),
            file: fileOf(block.file),
            kind: "block",
            origin: "external",
          },
          line: `${name} was taken at ${text(block.pin)}; ${source.id} is pinned at ${now}`,
        },
      ]);
    }
  }
  return [...behind.values()].map((lagging) => ({
    kind: "outdated",
    items: lagging.map(({ item }) => item),
    evidence: lagging.map(({ line }) => line),
  }));
}

// The template of this plugin a block of the starter kit was copied from, or null.
function templateOf(block) {
  const item = STARTER.find((piece) => piece.name === text(block.source));
  if (!item) return null;
  const base = `${path.posix.basename(fileOf(block.file) ?? "")}.template`;
  const file = item.files.find((name) => name === base) ?? item.files[0];
  return path.join(PLUGIN, "templates/owned", file);
}

// A block taken in with its conform record: every file of the item, against the hash the record
// holds after patching. A file changed since is a hand edit, for no patch records it (spec 0015).
function conformedOf(read, block, blind) {
  const name = nameOf(block);
  const file = fileOf(block.conform);
  const bytes = file && isFile(read.root, file) ? bytesOf(read.root, file) : null;
  const record = (() => {
    try {
      return bytes === null ? null : JSON.parse(String(bytes));
    } catch {
      return null;
    }
  })();
  if (!Array.isArray(record?.conformed)) {
    blind("modified", `the conform record of a block cannot be read: ${file ?? "none named"}`, [
      name,
    ]);
    return [];
  }
  const found = [];
  for (const entry of record.conformed) {
    const each = fileOf(entry?.file);
    const content = each && isFile(read.root, each) ? bytesOf(read.root, each) : null;
    if (content === null) {
      blind("modified", `a file of a conformed block is not there: ${each ?? "none named"}`, [
        name,
      ]);
      continue;
    }
    if (sha(content) === entry.sha256) continue;
    found.push({
      kind: "modified",
      items: [{ name, file: each, kind: "block", origin: originOf(read.intake.ledger, block) }],
      evidence: [
        `${each} is not the file the conform record ${file} holds after patching, and no patch records the change`,
      ],
    });
  }
  return found;
}

function modifiedOf(read, blind) {
  const found = [];
  for (const block of read.live) {
    const name = nameOf(block);
    const file = fileOf(block.file);
    // A change recorded with the hash of the file as changed holds the file to that hash; one
    // recorded with a reason only lets the file be, as before (spec 0015).
    const recorded = isMap(block.changed) ? text(block.changed.sha256) : null;
    if (recorded) {
      const bytes = file && isFile(read.root, file) ? bytesOf(read.root, file) : null;
      if (bytes === null) {
        blind("modified", `the file of a block is not there: ${file ?? "none named"}`, [name]);
      } else if (sha(bytes) !== recorded) {
        found.push({
          kind: "modified",
          items: [{ name, file, kind: "block", origin: originOf(read.intake.ledger, block) }],
          evidence: [
            `${file} is not the file its change of ${text(block.changed.on) ?? "an unknown day"} recorded, and no later change is recorded: widen it again with change --widen`,
          ],
        });
      }
      continue;
    }
    if (hasReason(block.changed)) continue;
    if (text(block.conform)) {
      found.push(...conformedOf(read, block, blind));
      continue;
    }
    if (!file || !isFile(read.root, file)) {
      blind("modified", `the file of a block is not there: ${file ?? "none named"}`, [name]);
      continue;
    }
    const bytes = bytesOf(read.root, file);
    if (bytes === null) {
      blind("modified", `the file of a block cannot be read: ${file}`, [name]);
      continue;
    }
    const starter = originOf(read.intake.ledger, block) === "starter";
    const template = starter ? templateOf(block) : null;
    let against;
    if (template && existsSync(template))
      against = {
        hash: sha(readFileSync(template)),
        from: `the template of design-assembly ${VERSION}`,
      };
    else if (text(block.taken))
      against = { hash: text(block.taken), from: "the hash taken when it came in" };
    else {
      blind(
        "modified",
        starter
          ? `${text(block.source)} is not a piece of the starter kit`
          : "a block with no hash taken when it came in cannot be compared",
        [name],
      );
      continue;
    }
    if (sha(bytes) !== against.hash) {
      found.push({
        kind: "modified",
        items: [{ name, file, kind: "block", origin: originOf(read.intake.ledger, block) }],
        evidence: [
          `${file} is not ${against.from}, and the block records no reason it was changed`,
        ],
      });
    }
  }
  return found;
}

// A component written in the file of one screen that other screens import: it belongs in the store.
function promoteOf(read, usage) {
  const pages = [...new Set(usage.screens.flatMap((screen) => screen.pages))].sort();
  const found = [];
  for (const page of pages) {
    const said = String((isFile(read.root, page) && bytesOf(read.root, page)) || "");
    const names = [
      ...said.matchAll(
        /^export\s+(?:async\s+)?(?:function|const|class)\s+([A-Z][A-Za-z0-9]*[a-z][A-Za-z0-9]*)\b/gm,
      ),
    ].map((match) => match[1]);
    if (names.length === 0) continue;
    const owners = usage.screens
      .filter((screen) => screen.pages.includes(page))
      .map((screen) => screen.id);
    const others = usage.screensOf(page).filter((id) => !owners.includes(id));
    if (owners.length === 0 || others.length === 0) continue;
    found.push({
      kind: "promote",
      items: [{ name: names[0], file: page, kind: "component", origin: "repo" }],
      evidence: [
        `${names.join(", ")} ${names.length === 1 ? "is" : "are"} written in ${page}, the page of ${owners.join(", ")}`,
        `${plural(others.length, "other screen imports", "other screens import")} it: ${others.join(", ")}`,
      ],
    });
  }
  return found;
}

// ---- the inventory --------------------------------------------------------------------------------

function findingsOf(read, pieces, usage, blind) {
  const found = [];
  if (!usage.known) for (const kind of ["unused", "unrecorded", "promote"]) blind(kind, usage.why);
  else {
    if (usage.whole) blind("unused", usage.whole);
    else found.push(...unusedOf(read, pieces, usage));
    found.push(...promoteOf(read, usage));
  }
  const ledgerKinds = ["unrecorded", "duplicate", "outdated", "modified"];
  if (!read.intake.ledger) {
    for (const kind of ledgerKinds) blind(kind, read.intake.why);
    return found;
  }
  for (const note of read.intake.notes) blind("intake", note);
  if (!Array.isArray(read.intake.ledger.blocks ?? [])) {
    for (const kind of ledgerKinds) blind(kind, `${read.intake.kept}: its blocks are not a list`);
    return found;
  }
  if (usage.known) found.push(...unrecordedOf(read, pieces));
  found.push(...duplicateOf(read, pieces), ...outdatedOf(read, blind), ...modifiedOf(read, blind));
  found.push(...exemptsMandatoryOf(read));
  return found;
}

// Each item whose conform record exempts a rule a row of the decision ledger holds: a record
// written before the rule was mandatory. The gate leaves it be; conforming it again is refused until
// the exemption is out (the addendum of spec 0015).
function exemptsMandatoryOf(read) {
  const mandatory = mandatoryRules(read.root);
  if (mandatory.size === 0) return [];
  return conformRecords(read.root)
    .map((record) => ({
      record,
      lines: mandatoryOff(read.root, { ...record, conformed: [] }, () => null, mandatory),
    }))
    .filter(({ lines }) => lines.length > 0)
    .map(({ record, lines }) => ({
      kind: "exempts-mandatory",
      items: [
        {
          name: text(record.item) ?? text(record.need),
          file:
            (Array.isArray(record.conformed) ? record.conformed : [])
              .map((entry) => fileOf(entry?.file))
              .find(Boolean) ?? null,
          kind: "block",
          origin: "external",
        },
      ],
      evidence: [`${record.file} was written before these rules were mandatory`, ...lines],
    }));
}

const keep = (store, kind) => (thing) =>
  (store === "all" || thing.origin === store) &&
  (kind === null || thing.kind === kind || (kind === "component" && Boolean(thing.component)));

export function inventory(root, { store = "all", kind = null } = {}) {
  if (kind === "behaviour") {
    return {
      store,
      kind,
      stores: [],
      items: [],
      findings: [],
      blind: [{ kind: "behaviour", why: BEHAVIOURS, items: [] }],
    };
  }
  const theme = readTheme(root);
  const blind = [];
  const say = (what, why, items = []) => {
    const same = blind.find((entry) => entry.kind === what && entry.why === why);
    if (same) same.items.push(...items);
    else blind.push({ kind: what, why, items: [...items] });
  };
  const found = readIntake(root, theme);
  // A file a block names outside the repository is never read: the block keeps no file.
  const blocks = found.blocks.map((block) => {
    const file = fileOf(block.file);
    if (!file || insideRoot(root, file)) return block;
    say("blocks", "the file a block names is outside the repository, and is not read", [
      nameOf(block),
    ]);
    return { ...block, file: null };
  });
  const intake = { ...found, blocks };
  const { components, problem, read: folder, said: learnt } = componentsOf(root);
  const sources = readPinnedSources(root);
  const live = blocks.filter((block) => !block.retired && !block.merged_into);
  const read = { root, intake, components, sources, live };
  const usage = usageOf(root, theme);
  if (problem) say("components", problem);
  const pieces = piecesOf(read, usage);
  const findings = findingsOf(read, pieces, usage, say);
  const wanted = keep(store, kind);
  const stores = storesOf(read).filter(
    (entry) => (store === "all" || entry.store === store) && (kind === null || entry.kind === kind),
  );
  // A repository of a family: whether its core moved ahead of the pin, answer by answer. A core
  // that cannot be looked at is named among what was not looked at. A repository of no family has
  // no such key, and reads nothing outside itself.
  const moved = movedOf(root);
  if (moved?.state === "unreachable") say("family-core", moved.why);
  if (moved?.state === "unreadable") {
    say("family-core", `the copy of the core here cannot be read (${moved.why})`);
  }
  return {
    store,
    kind,
    stores,
    items: pieces.filter(wanted).map(({ origin, ...piece }) => ({ ...piece, origin })),
    findings: findings.filter((finding) => finding.items.some(wanted)),
    blind,
    ...(moved ? { core: moved } : {}),
    // Where the repository's components were read, said where it is not the usual folder.
    ...(learnt ? { components_read: `${folder}/ (${learnt})` } : {}),
  };
}

// ---- for a person ---------------------------------------------------------------------------------

function storeLines(stores) {
  const groups = new Map();
  for (const entry of stores) {
    const key = entry.source ? `${entry.store} ${entry.source}` : entry.store;
    const said =
      entry.count === null
        ? `cannot be read: ${entry.why}`
        : plural(entry.count, entry.kind, `${entry.kind}s`);
    groups.set(key, [...(groups.get(key) ?? []), said]);
  }
  return [...groups].map(([key, said]) => `  ${key}: ${said.join(", ")}`);
}

export function report(result) {
  const states = ["in-use", "unused", "retired", "retired-in-use"].map(
    (state) => `${result.items.filter((piece) => piece.state === state).length} ${state}`,
  );
  const out = [
    `inventory: ${plural(result.items.length, "piece", "pieces")} of the repository (${states.join(", ")}), ${plural(result.findings.length, "finding", "findings")}`,
    "stores:",
    ...storeLines(result.stores),
    ...(result.components_read ? [`  repo components read from ${result.components_read}`] : []),
  ];
  if (result.findings.length > 0) {
    out.push("findings:");
    for (const finding of result.findings) {
      out.push(
        `  ${finding.kind}: ${finding.items.map((item) => item.file ?? item.name).join(", ")}`,
      );
      out.push(...finding.evidence.map((line) => `    ${line}`));
    }
  }
  if (result.core && ["same", "ahead"].includes(result.core.state)) {
    out.push(
      `family core: ${result.core.family}, pinned at ${result.core.pin}`,
      ...movedLines(result.core),
    );
  }
  out.push("not looked at:");
  if (result.blind.length === 0) out.push("  nothing");
  for (const entry of result.blind) {
    out.push(
      `  ${entry.kind}: ${entry.why}${entry.items.length > 0 ? ` (${entry.items.join(", ")})` : ""}`,
    );
  }
  return `${out.join("\n")}\n`;
}

// ---- the document ---------------------------------------------------------------------------------

const SEVERITY = {
  unused: "low",
  unrecorded: "medium",
  duplicate: "medium",
  outdated: "medium",
  modified: "medium",
  "exempts-mandatory": "medium",
  promote: "low",
};
const WHAT = {
  unused: "No screen uses it",
  unrecorded: "The code uses it and the ledger does not record it",
  duplicate: "One thing taken more than once",
  outdated: "Behind the pin of its source",
  modified: "Changed from its source with no reason recorded",
  "exempts-mandatory": "Let off a rule the decision ledger holds",
  promote: "Used by more than one screen from inside one of them",
};
const ACTION = {
  unused: "Remove it, or say in the ledger why it stays",
  unrecorded: "Record it in the intake ledger, or list it among what came before",
  duplicate: "Keep one, and retire the other",
  outdated: "Take the block again at the pin of its source, or record why it stays",
  modified: "Record the change and why under `changed`, or take the block again",
  "exempts-mandatory": "Patch the code, and take the exemption out of the conform record",
  promote: "Move it into the store of the repository and record it",
};

export function documentOf(result, origin) {
  const measured = (value) => ({ kind: "measurement", text: value });
  const named = (finding) => finding.items.map((item) => item.file ?? item.name).join(", ");
  const conclusion =
    result.findings.length === 0
      ? `No finding in ${plural(result.items.length, "piece", "pieces")} of the repository.`
      : `${plural(result.findings.length, "finding", "findings")} in ${plural(result.items.length, "piece", "pieces")} of the repository.`;
  const kinds = FINDINGS.filter((kind) => result.findings.some((finding) => finding.kind === kind));
  return {
    kind: "inventory-report",
    title: "Inventory report",
    lede: "What the store of this repository holds, and whether it can be trusted.",
    origin,
    version: VERSION,
    scope: [
      ...storeLines(result.stores).map((line) => line.trim()),
      ...result.blind.map((entry) => `Not looked at, ${entry.kind}: ${entry.why}`),
    ],
    decision: {
      conclusion,
      figures: [
        { value: String(result.items.length), label: "pieces of the repository" },
        { value: String(result.findings.length), label: "findings" },
        { value: String(result.blind.length), label: "things not looked at" },
      ],
      attention: result.findings.slice(0, 3).map((finding) => ({
        title: `${WHAT[finding.kind]}: ${named(finding)}`,
        detail: finding.evidence[0],
      })),
      decide: [],
    },
    findings: result.findings.map((finding) => ({
      severity: SEVERITY[finding.kind],
      title: `${WHAT[finding.kind]}: ${named(finding)}`,
      evidence: finding.evidence,
    })),
    recommendations: kinds.map((kind) => ({
      what: ACTION[kind],
      basis: measured(
        `${plural(result.findings.filter((finding) => finding.kind === kind).length, "finding", "findings")} of the kind ${kind}`,
      ),
      action: ACTION[kind],
    })),
    next: [
      { why: result.findings.length === 0 ? "nothing to do" : ACTION[result.findings[0].kind] },
    ],
    blind: LIMITS.filter(
      (limit) => ["inventory", "document"].includes(limit.area) && limit.status === "open",
    ).map(({ id, note }) => ({ id, note })),
  };
}

// ---- the call -------------------------------------------------------------------------------------

const CALL =
  "usage: node inventory.mjs [--store repo|starter|external|all] [--kind component|block|screen-kind|behaviour] [--strict] [--target DIR] [--json] [--out DIR [--format html|pdf]]\n";

async function main(args) {
  const call = readCall(args, {
    "--store": "value",
    "--kind": "value",
    "--strict": "switch",
    ...DOCUMENT_FLAGS,
  });
  if (call.problem) throw new Refusal(`${call.problem}\n${CALL.trimEnd()}`);
  if (call.help) {
    stdout.write(CALL);
    return;
  }
  const store = call.flags["--store"] ?? "all";
  if (!STORES.includes(store)) throw new Refusal("--store is repo, starter, external or all");
  const kind = call.flags["--kind"] ?? null;
  if (kind !== null && !KINDS.includes(kind)) {
    throw new Refusal("--kind is component, block, screen-kind or behaviour");
  }
  const asked = requested(call);
  const counted = inventory(call.target, { store, kind });
  // The root of a workspace that holds nothing of its own: which package to aim at instead.
  const space = workspaceOf(call.target);
  const result = space ? { ...counted, workspace: space } : counted;
  const handed = await handOver(asked, call.target, (origin) => documentOf(result, origin));
  const said = space ? `${workspaceLines(space).join("\n")}\n\n` : "";
  finish({
    json: call.json,
    result: { ...result, ...handed.data },
    text: `${said}${report(result)}${handed.text}`,
    work:
      (Boolean(call.flags["--strict"]) && result.findings.length > 0) ||
      handed.work ||
      Boolean(space),
  });
}

await start(import.meta.url, main);
