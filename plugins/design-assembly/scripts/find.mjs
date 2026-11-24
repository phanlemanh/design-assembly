// find: whether the store already answers a need, before anything new is made. It reads from the
// nearest store to the farthest and stops at the first that answers: the repository's own (its
// intake ledger, its components, its kinds of screen), then the starter kit of this plugin, then
// the family's store, then the outside sources the repository pinned, in their order; a source the
// repository declares before the starter kit is read right after its own store. Words are
// matched, never meaning: no model is called and nothing is fetched. Read-only; the same repository
// and the same words always give the same answer. With --out it also hands the answer over as a
// document, the find report, written to that folder and nowhere else.
// Usage: node find.mjs <words of the need, or a name> [--kind component|block|screen-kind|behaviour]
//        [--limit N] [--target DIR] [--json] [--out DIR [--format html|pdf]]
// Exit: 0 something answers; 1 nothing does, or the document was written in fewer formats than
// asked; 2 a wrong call, or a repository that cannot be read.
import { readFileSync } from "node:fs";
import path from "node:path";
import { stdout } from "node:process";
import { fileURLToPath } from "node:url";

import { adapterOf } from "../templates/tools/design-assembly/adapters/index.mjs";
import { screensOf } from "../templates/tools/design-assembly/affected.mjs";
import { isByHand } from "../templates/tools/design-assembly/intake-ledger.mjs";
import {
  frontMatter,
  KINDS_FOLDER,
  readKinds,
  readPages,
} from "../templates/tools/design-assembly/screens.mjs";
import {
  readPinnedSources,
  SOURCES_FOLDER,
} from "../templates/tools/design-assembly/sources-ledger.mjs";
import { finish, readCall, Refusal, start } from "./command.mjs";
import { DOCUMENT_FLAGS, handOver, plural, requested } from "./document.mjs";
import { VERSION } from "./stamp.mjs";
import { componentsOf, fileOf, pinOf, readIntake, readTheme, text } from "./store.mjs";

const PLUGIN = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const json = (file) => JSON.parse(readFileSync(path.join(PLUGIN, file), "utf8"));
const STARTER = json("references/starter.json").items;
const LIMITS = json("references/limits.json").limits;

export const KINDS = ["component", "block", "screen-kind", "behaviour"];
const LIMIT = 5;
const NEARER = "not searched: a nearer store answers";

// ---- words ----------------------------------------------------------------------------------------

// The words of a text, in lower case and without marks on their letters: cut at every sign that is
// not a letter or a digit, and where a small letter or a digit meets a capital, so that
// `DataRegion` is `data region`. A need key is written without marks, so the need a person asks
// for in a language that writes them must lose them to be that key.
export function wordsOf(text) {
  return String(text ?? "")
    .normalize("NFC")
    .replace(/(\p{Ll}|\p{N})(\p{Lu})/gu, "$1 $2")
    .replace(/(\p{Lu})(\p{Lu}\p{Ll})/gu, "$1 $2")
    .toLowerCase()
    .replace(/đ/g, "d")
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .split(/[^\p{L}\p{N}]+/u)
    .filter(Boolean);
}
const whole = (text) => wordsOf(text).join("-");

// How a piece of a store meets what was asked: given whole by its name or its need, how many of the
// words asked it holds, and whether that is a match (all of them) or only near (some).
function measure(asked, piece) {
  const words = [...new Set(wordsOf(asked))];
  const held = new Set(piece.fields.flatMap(wordsOf));
  const exact = piece.wholes.some((name) => name !== "" && name === whole(asked));
  const shared = words.filter((word) => held.has(word)).length;
  return { exact, shared, match: exact || (words.length > 0 && shared === words.length) };
}

// Outside sources answer in their order; within one store, a piece given whole first, then the one
// holding more of the words, then by name.
const byRank = (a, b) =>
  a.piece.order - b.piece.order ||
  Number(b.exact) - Number(a.exact) ||
  b.shared - a.shared ||
  (a.piece.name < b.piece.name ? -1 : a.piece.name > b.piece.name ? 1 : 0);

// ---- the stores -----------------------------------------------------------------------------------

// A piece of a store, as a person and a machine are given it. Every key is there, empty when the
// store has nothing to say about it.
function pieceOf(store, tier, said) {
  return {
    name: said.name,
    kind: said.kind,
    store,
    tier,
    file: said.file ?? null,
    ...(said.files ? { files: said.files } : {}),
    description: said.description ?? null,
    need: said.need ?? null,
    props: said.props ?? [],
    variants: said.variants ?? [],
    used_by: said.used_by ?? [],
    source: said.source ?? null,
    ...(said.from ? { from: said.from } : {}),
    pin: said.pin ?? null,
    reference: said.reference ?? null,
    ...(said.install ? { install: said.install } : {}),
    ...(said.component ? { component: said.component } : {}),
    // What the words are matched against, what counts as given whole, and the place of its store
    // among the outside sources; never printed.
    fields: said.fields,
    wholes: said.wholes ?? [said.name],
    order: said.order ?? 0,
  };
}
const HIDDEN = new Set(["fields", "wholes", "order"]);
const shown = (piece) =>
  Object.fromEntries(Object.entries(piece).filter(([key]) => !HIDDEN.has(key)));
// Whether a piece is of the kind asked for. A block whose file is a component is a component too.
const ofKind = (piece, kind) =>
  kind === null || piece.kind === kind || (kind === "component" && Boolean(piece.component));

// A name an install line may carry to a shell as it is. Any other name gets no install line.
const SAFE_NAME = /^[\w@./:-]+$/;

// Which screens reach each file, or null when it is not known, with why.
function usersOf(root, theme) {
  try {
    const { screens } = screensOf(root, theme ?? {});
    if (screens === null) return { of: () => [], why: null };
    return {
      of: (file) =>
        screens
          .filter((screen) => screen.files.has(file))
          .map((screen) => screen.id)
          .sort(),
      why: null,
    };
  } catch (error) {
    return { of: () => [], why: `which screens use a piece is not known: ${error.message}` };
  }
}

// The reference page of a block taken from a pinned source: the page its catalog gives.
function referenceOf(root, ledger, block, cache) {
  if (!block.source || isByHand(ledger, block)) return null;
  cache.sources ??= readPinnedSources(root);
  const from = block.from
    ? cache.sources.find((source) => source.id === block.from)
    : cache.sources.length === 1
      ? cache.sources[0]
      : null;
  return from?.items?.find((item) => item.name === block.source)?.page ?? null;
}

// The repository's own store, tier 1: the intake ledger, the components, the kinds of screen. A
// component that is the file of a block of the ledger is one piece with that block.
function ownStore(root, theme) {
  const users = usersOf(root, theme);
  const cache = {};
  const entries = [];

  const found = readIntake(root, theme);
  const { ledger, blocks } = found;
  const notes = [...found.notes];
  const intake = { store: "intake", read: found.read, items: null, why: found.why, pieces: [] };
  const { read, missing, problem, components } = componentsOf(root);
  const byFile = new Map(components.map((component) => [component.file, component]));
  const live = blocks.filter((block) => !block.retired && !block.merged_into);
  if (ledger) {
    intake.items = live.length;
    const retired = blocks.filter((block) => block.retired).length;
    const merged = blocks.filter((block) => !block.retired && block.merged_into).length;
    const left = [
      retired > 0 ? `${retired} retired` : null,
      merged > 0 ? `${merged} merged into another need` : null,
    ].filter(Boolean);
    if (left.length > 0) notes.push(`${left.join(" and ")} left out, never offered`);
    if (notes.length > 0) intake.why = notes.join("; ");
  }
  intake.pieces = live.map((block) => {
    const own = fileOf(block.file);
    const component = byFile.get(own);
    return pieceOf("intake", 1, {
      name: text(block.name) ?? text(block.need) ?? "(unnamed)",
      kind: "block",
      component: component?.name,
      file: own,
      description: text(block.description),
      need: text(block.need),
      props: component?.props,
      variants: component?.variants,
      used_by: own ? users.of(own) : [],
      source: text(block.source),
      from: text(block.from),
      pin: text(block.pin),
      reference: referenceOf(root, ledger, block, cache),
      fields: [block.name, block.need, block.description, component?.name]
        .map(text)
        .filter(Boolean),
      wholes: [block.name, block.need, component?.name].map(text).filter(Boolean).map(whole),
    });
  });
  entries.push(intake);

  // A retired block retires its file: its component is not offered either.
  const ledgerFiles = new Set(blocks.map((block) => fileOf(block.file)));
  const own = {
    store: "components",
    read: read ? [`${read}/`] : null,
    items: read ? components.length : null,
    why: problem ?? (read ? users.why : `no component folder at ${missing}`),
    pieces: components
      .filter((component) => !ledgerFiles.has(component.file))
      .map((component) =>
        pieceOf("components", 1, {
          name: component.name,
          kind: "component",
          file: component.file,
          props: component.props,
          variants: component.variants,
          used_by: users.of(component.file),
          source: component.source,
          fields: [component.name],
          wholes: [whole(component.name)],
        }),
      ),
  };
  entries.push(own);

  const pages = readPages(root, KINDS_FOLDER);
  const kinds = readKinds(pages);
  entries.push({
    store: "screen-kinds",
    read: kinds.length > 0 ? [`${KINDS_FOLDER}/`] : null,
    items: kinds.length > 0 ? kinds.length : null,
    why: kinds.length > 0 ? null : `no page of a kind of screen in ${KINDS_FOLDER}`,
    pieces: kinds.map((kind) => {
      const said = frontMatter(pages[kind.file]) ?? {};
      const object = text(said.doi_tuong);
      return pieceOf("screen-kinds", 1, {
        name: kind.name,
        kind: "screen-kind",
        file: kind.file,
        description: [object, kind.task].filter(Boolean).join(" ") || null,
        reference: kind.reference || null,
        fields: [kind.name, kind.kind, kind.task, object].filter(Boolean),
        wholes: [whole(kind.name), whole(kind.kind)],
      });
    }),
  });
  return entries;
}

// The starter kit of this plugin, tier 2: each piece the repository has every adapter for, and
// does not have already as a component of its own.
function starterStore(root) {
  const without = [];
  const pieces = [];
  const have = new Set(componentsOf(root).components.map((component) => component.name));
  for (const item of STARTER) {
    if (have.has(item.name)) {
      without.push(`${item.name} is already in the repository`);
      continue;
    }
    const lacking = item.needs.filter((kind) => !adapterOf(kind)?.present?.(root));
    if (lacking.length > 0) {
      without.push(
        `${item.name} needs the ${lacking.join(" and ")} ${lacking.length === 1 ? "adapter" : "adapters"}`,
      );
      continue;
    }
    const files = item.files.map((file) => `templates/owned/${file}`);
    pieces.push(
      pieceOf("starter", 2, {
        name: item.name,
        kind: item.kind,
        file: files[0],
        files,
        description: item.description,
        need: item.need,
        source: "starter",
        pin: `design-assembly ${VERSION}`,
        fields: [item.name, item.need, item.description],
        wholes: [whole(item.name), item.need],
      }),
    );
  }
  return [
    {
      store: "starter",
      read: ["references/starter.json"],
      items: pieces.length,
      why:
        without.length > 0
          ? `${plural(without.length, "piece is", "pieces are")} not offered here: ${without.join("; ")}`
          : null,
      pieces,
    },
  ];
}

// The family's store, tier 3: none exists yet.
const familyStore = () => [
  { store: "family", read: null, items: null, why: "no family store exists yet", pieces: [] },
];

// The pinned sources split by where each stands on the ladder: before the starter kit and the
// family's store, or after them, each part in the sources' order (spec 0015).
export function sourcesByPlace(sources) {
  return {
    before: sources.filter((source) => source.ladder_place === "before-starter"),
    after: sources.filter((source) => source.ladder_place !== "before-starter"),
  };
}

// The outside sources the repository pinned, tier 4, in their order. With nothing pinned at all,
// one entry says so.
function sourcesStore(sources, pinned) {
  if (pinned.length === 0) {
    return [
      {
        store: "sources",
        read: null,
        items: null,
        why: `no outside source is pinned (${SOURCES_FOLDER}/)`,
        pieces: [],
      },
    ];
  }
  return sources.map((source) => {
    const place = pinned.indexOf(source);
    const store = `sources/${source.id}`;
    return {
      store,
      read: [source.file, ...(source.catalog ? [source.catalog] : [])],
      items: source.items ? source.items.length : null,
      why: source.unreadable ?? (source.blind.length > 0 ? source.blind.join("; ") : null),
      pieces: (source.items ?? []).map((item) =>
        pieceOf(store, 4, {
          name: item.name,
          kind: item.kind ?? "block",
          description: item.description,
          source: source.id,
          pin: pinOf(source.pin),
          reference: item.page,
          install:
            source.install && SAFE_NAME.test(item.name)
              ? source.install.replaceAll("{name}", item.name)
              : null,
          order: place,
          fields: [item.name, item.title, item.description, item.group, item.category]
            .map(text)
            .filter(Boolean),
          wholes: [whole(item.name), whole(item.title)],
        }),
      ),
    };
  });
}

// ---- the search -----------------------------------------------------------------------------------

const entryOf = ({ store, tier, read, items, found, why }) => ({
  store,
  tier,
  read,
  items,
  found,
  why,
});

// The answer for a machine: what matches, from the nearest store that has anything; what is near,
// from every store read; and every store, with what was read and why it was not. `from` leaves out
// the nearer tiers: taking a block in asks the stores beyond the repository's own.
export function find(root, { words, kind = null, limit = LIMIT, from = 1 }) {
  const asked = String(words ?? "").trim();
  if (kind === "behaviour") {
    return {
      words: asked,
      kind,
      matches: [],
      near: [],
      searched: [
        {
          store: "behaviours",
          tier: null,
          read: null,
          items: null,
          found: false,
          why: "no store keeps behaviours yet",
        },
      ],
      next: "no store keeps behaviours yet: a behaviour is described in design/behaviors.md",
    };
  }
  const theme = readTheme(root);
  const pinned = readPinnedSources(root);
  const { before, after } = sourcesByPlace(pinned);
  // The stores in the order of the ladder: a source the repository declares before the starter
  // kit is read right after its own store; with nothing declared, the walk is as it always was.
  const tiers = [
    {
      tier: 1,
      read: () => ownStore(root, theme),
      unread: ["intake", "components", "screen-kinds"],
    },
    ...(before.length > 0
      ? [
          {
            tier: 4,
            read: () => sourcesStore(before, pinned),
            unread: before.map((source) => `sources/${source.id}`),
          },
        ]
      : []),
    { tier: 2, read: () => starterStore(root), unread: ["starter"] },
    { tier: 3, read: () => familyStore(), unread: ["family"] },
    ...(after.length > 0 || pinned.length === 0
      ? [{ tier: 4, read: () => sourcesStore(after, pinned), unread: ["sources"] }]
      : []),
  ].map((step, place) => ({ ...step, place }));
  const searched = [];
  const matched = [];
  const near = [];
  let answered = false;
  for (const { tier, place, read, unread } of tiers.filter((each) => each.tier >= from)) {
    if (answered) {
      for (const store of unread) {
        searched.push({ store, tier, read: null, items: null, found: false, why: NEARER });
      }
      continue;
    }
    for (const entry of read()) {
      const scored = entry.pieces
        .filter((piece) => ofKind(piece, kind))
        .map((piece) => ({ piece, place, ...measure(asked, piece) }));
      const hits = scored.filter((item) => item.match);
      matched.push(...hits);
      near.push(...scored.filter((item) => !item.match && item.shared > 0));
      searched.push(entryOf({ ...entry, tier, found: hits.length > 0 }));
    }
    answered = matched.length > 0;
  }
  const matches = matched
    .sort(byRank)
    .slice(0, limit)
    .map((item) => shown(item.piece));
  const close = near
    .sort((a, b) => a.place - b.place || byRank(a, b))
    .slice(0, limit)
    .map((item) => shown(item.piece));
  return { words: asked, kind, matches, near: close, searched, next: nextOf(matches) };
}

// What to do with the answer, in one line.
function nextOf(matches) {
  const [first] = matches;
  if (!first) {
    return "nothing in the store answers this: take a block in for the need with intake --need KEY, which asks the owner and records it in the intake ledger with who approved it and when";
  }
  if (first.tier === 1) return `use ${first.name}, ${first.file ?? "already in the repository"}`;
  if (first.tier === 2) {
    return `${first.name} is in the starter kit: take it in with intake --need ${first.need}, which asks the owner, copies ${first.files.join(", ")} from this plugin, and records it in the intake ledger`;
  }
  return `take ${first.name} in with intake --need KEY, which asks the owner, gives its install line${first.install ? ` (${first.install})` : ""} without running it, and records it in the intake ledger`;
}

// ---- for a person ---------------------------------------------------------------------------------

export const STORES = {
  1: "the repository's own store",
  2: "the starter kit of this plugin",
  3: "the family's store",
  4: "an outside source",
};

function pieceLines(piece) {
  const lines = [
    `  ${piece.name} (${piece.kind}, ${piece.store})${piece.file ? `: ${piece.file}` : ""}`,
  ];
  if (piece.need) lines.push(`    need: ${piece.need}`);
  if (piece.description) lines.push(`    ${piece.description}`);
  if (piece.props.length > 0) lines.push(`    takes: ${piece.props.join(", ")}`);
  if (piece.variants.length > 0) lines.push(`    variants: ${piece.variants.join(", ")}`);
  if (piece.used_by.length > 0) lines.push(`    used by: ${piece.used_by.join(", ")}`);
  const from = [piece.from, piece.source].filter(Boolean).join(" ");
  if (piece.tier !== 1 || piece.from) {
    lines.push(`    from: ${from || "?"}${piece.pin ? `, pinned ${piece.pin}` : ""}`);
  } else if (piece.source) lines.push(`    source: ${piece.source}`);
  if (piece.reference) lines.push(`    see: ${piece.reference}`);
  return lines;
}

export function report(result) {
  const out = [`find: "${result.words}"${result.kind ? ` (${result.kind})` : ""}`];
  if (result.matches.length > 0) {
    const tier = result.matches[0].tier;
    out.push(
      `${plural(result.matches.length, "match", "matches")}, in ${STORES[tier]}:`,
      ...result.matches.flatMap(pieceLines),
    );
  } else out.push("no match");
  if (result.near.length > 0) {
    out.push(
      "near, holding some of the words:",
      ...result.near.map((piece) => `  ${piece.name} (${piece.kind}, ${piece.store})`),
    );
  }
  out.push("searched:");
  for (const entry of result.searched) {
    const what = entry.read
      ? `${entry.read.join(", ")}${entry.items === null ? "" : `, ${plural(entry.items, "piece", "pieces")}`}`
      : "";
    const said = [what, entry.found ? "answers" : null, entry.why].filter(Boolean).join("; ");
    out.push(`  ${entry.tier ?? "-"} ${entry.store}: ${said}`);
  }
  out.push(`next: ${result.next}`);
  return `${out.join("\n")}\n`;
}

// ---- the document ---------------------------------------------------------------------------------

export function documentOf(result, origin) {
  const measured = (value) => ({ kind: "measurement", text: value });
  const read = result.searched.filter((entry) => entry.read !== null);
  const unreadable = result.searched.filter(
    (entry) => entry.read !== null && entry.items === null && entry.why,
  );
  const [first] = result.matches;
  const conclusion = first
    ? `${plural(result.matches.length, "piece answers", "pieces answer")} "${result.words}"; the nearest is ${first.name}, in ${STORES[first.tier]}.`
    : `Nothing in the store answers "${result.words}".`;
  const findings = [
    ...unreadable.map((entry) => ({
      severity: "medium",
      title: `${entry.store} cannot be read`,
      detail: "No piece of it is offered until it can be read.",
      evidence: [entry.why],
    })),
    ...result.matches.map((piece) => ({
      severity: "note",
      title: `${piece.name} answers, in ${piece.store}`,
      evidence: pieceLines(piece).map((line) => line.trim()),
    })),
    ...(first
      ? []
      : [
          {
            severity: "low",
            title: "No piece holds every word asked for",
            evidence: result.searched.map(
              (entry) => `${entry.store}: ${entry.why ?? (entry.found ? "answers" : "no match")}`,
            ),
          },
        ]),
  ];
  const recommendations = [
    first
      ? {
          what: `Reuse ${first.name} before making anything new`,
          basis: measured(`it holds every word of "${result.words}", in ${first.store}`),
          action: result.next,
        }
      : {
          what: "Take a new block in for this need",
          basis: measured(
            `${plural(read.length, "store was", "stores were")} read and no piece holds every word of "${result.words}"`,
          ),
          action: result.next,
        },
  ];
  const blind = LIMITS.filter(
    (limit) => ["find", "document"].includes(limit.area) && limit.status === "open",
  );
  return {
    kind: "find-report",
    title: "Find report",
    lede: "Whether the store of this repository already answers a need, nearest store first.",
    origin,
    version: VERSION,
    scope: [
      `The words searched for: "${result.words}"${result.kind ? `, of the kind ${result.kind}` : ""}`,
      ...result.searched.map(
        (entry) => `${entry.store}${entry.read ? `: ${entry.read.join(", ")}` : `: ${entry.why}`}`,
      ),
    ],
    decision: {
      conclusion,
      figures: [
        { value: String(result.matches.length), label: "pieces answer" },
        { value: String(result.near.length), label: "pieces hold some of the words" },
        { value: String(read.length), label: "stores read" },
      ],
      attention: unreadable.slice(0, 3).map((entry) => ({
        title: `${entry.store} cannot be read`,
        detail: entry.why,
      })),
      decide: [],
    },
    findings,
    recommendations,
    next: [{ why: result.next }],
    blind: blind.map(({ id, note }) => ({ id, note })),
  };
}

// ---- the call -------------------------------------------------------------------------------------

const CALL =
  "usage: node find.mjs <words of the need, or a name> [--kind component|block|screen-kind|behaviour] [--limit N] [--target DIR] [--json] [--out DIR [--format html|pdf]]\n";

async function main(args) {
  const call = readCall(
    args,
    { "--kind": "value", "--limit": "value", ...DOCUMENT_FLAGS },
    { words: true },
  );
  if (call.problem) throw new Refusal(`${call.problem}\n${CALL.trimEnd()}`);
  if (call.help) {
    stdout.write(CALL);
    return;
  }
  const kind = call.flags["--kind"] ?? null;
  if (kind !== null && !KINDS.includes(kind)) {
    throw new Refusal("--kind is component, block, screen-kind or behaviour");
  }
  const limitText = call.flags["--limit"] ?? String(LIMIT);
  if (!/^[1-9]\d*$/.test(limitText)) throw new Refusal("--limit is a whole number above 0");
  if (wordsOf(call.words.join(" ")).length === 0) {
    throw new Refusal(`say what to find: the words of a need, or a name\n${CALL.trimEnd()}`);
  }
  const asked = requested(call);
  const result = find(call.target, {
    words: call.words.join(" "),
    kind,
    limit: Number(limitText),
  });
  const handed = await handOver(asked, call.target, (origin) => documentOf(result, origin));
  finish({
    json: call.json,
    result: { ...result, ...handed.data },
    text: `${report(result)}${handed.text}`,
    work: result.matches.length === 0 || handed.work,
  });
}

await start(import.meta.url, main);
