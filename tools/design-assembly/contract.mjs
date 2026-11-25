// The contract of a repository's design: the ledgers, each with one shape that every tool reading
// it can rely on. This file is the only statement of those shapes; `references/contract.md` says
// the same in words for a person, and a test keeps the two in step.
//
// A shape is checked as data. Its `version` says which shape a file has: a reader of shape N reads
// every file of shape N or older, and a writer that finds a newer shape writes nothing.
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";

import { adapterOf } from "./adapters/index.mjs";
import {
  INTAKE_LEDGER,
  readIntakeLedger,
  repeatedNeeds,
  spellingProblems,
} from "./intake-ledger.mjs";
import { readYaml } from "./yaml.mjs";
import {
  FONT_FIELDS,
  FONT_STYLES,
  fontRowProblems,
  isFont,
  LADDER_PLACES,
  SOURCES_FOLDER,
} from "./sources-ledger.mjs";
import { parseLedger } from "./ledger.mjs";
import { ledgerText, readFragments } from "./screen-fragments.mjs";
import { FRAGMENTS_SHARED, fragmentsFolder, readScreenLedger } from "./screen-ledger.mjs";
import { frontMatter } from "./screens.mjs";

// A field: its type, whether it must be there, the values it may take, and what it holds.
// `fields` describes an object's own keys; `open: true` lets it carry keys of its own besides.
const text = { type: "string" };
const number = { type: "number" };
const list = (items) => ({ type: "array", items });
const required = (spec) => ({ ...spec, required: true });
// A day, `YYYY-MM-DD`; a key in small letters and dashes, as a need or the id of a source is.
const day = { ...text, pattern: "^\\d{4}-\\d{2}-\\d{2}$" };
const dashed = { ...text, pattern: "^[a-z0-9]+(-[a-z0-9]+)*$" };

// The token types the format names, the acceptance kit's list included.
export const TOKEN_TYPES = [
  "color",
  "dimension",
  "fontFamily",
  "fontWeight",
  "number",
  "duration",
  "shadow",
  "typography",
  "string",
];
const ATOMIC_LEVELS = ["atom", "molecule", "organism", "template"];

// When a repository has a ledger: from birth, once the floor is laid and the ledgers are laid on
// it without asking anyone (`adopt --starter`), or with its first entry, which only a person or a
// later round brings. A ledger of the first kind that is missing is something to say; one of the
// second kind is not.
export const BORN = { floor: "with-the-floor", firstEntry: "with-its-first-entry" };

// The folder of conform records: one file per need, for an item of an outside source taken down
// and conformed before it is taken in (spec 0015).
export const CONFORM_FOLDER = "design/conform";
// The rules an exemption may name for a whole folder of an item rather than one of its files: the
// formatter's ignore list, the lint configuration, the type check's. Such an exemption names the file
// of the configuration (spec 0015, slice 3).
export const FOLDER_RULES = ["formatter-ignore", "lint-config", "typecheck-exclude"];
// A file of an item, with the hash of its bytes.
const hashedFile = {
  type: "object",
  fields: {
    file: required(text),
    sha256: required({ ...text, pattern: "^[0-9a-f]{64}$" }),
  },
  open: true,
};

export const LEDGERS = {
  decisions: {
    file: "design/decisions.yaml",
    question: "what the repository decided, and what holds each decision",
    born: BORN.floor,
    writer: "people, and the guide for the rows it holds",
    version: 1,
    format: "yaml-ledger",
    root: {
      version: required({ type: "number|string" }),
      decisions: required(
        list({
          type: "object",
          fields: {
            id: required(text),
            layer: required(text),
            kind: required({ ...text, values: ["standard", "formula", "closed", "judgment"] }),
            source: required(text),
            check: { ...text, pattern: `^(test|e2e|tool|${adapterOf("lint").prefix}):` },
            note: text,
          },
        }),
      ),
    },
  },
  blueprint: {
    file: "design/blueprint.json",
    question: "what the person answered, layer by layer",
    born: BORN.firstEntry,
    writer: "the person, through the guide",
    version: 1,
    root: {
      version: required(number),
      status: text,
      depth: text,
      layers: required({ type: "object", open: true }),
    },
    open: true,
  },
  tokens: {
    file: "design/tokens.json",
    question: "which values exist",
    born: BORN.floor,
    writer: "make design-tokens, from the stylesheet",
    // The Design Tokens Community Group format carries no version of its own.
    version: null,
    format: "tokens",
  },
  components: {
    file: "design/component-registry.json",
    question: "which components exist, where, and of what",
    born: BORN.floor,
    writer: "make design-components, from the source",
    version: 2,
    // The acceptance kit reads the version as a string and refuses any key beside these two.
    root: {
      version: required(text),
      components: required(
        list({
          type: "object",
          fields: {
            name: required(text),
            category: required(text),
            file: required(text),
            level: { ...text, values: ATOMIC_LEVELS },
            source: { ...text, values: ["library", "own"] },
            parts: list(text),
            props: list(text),
            variants: list({ ...text, pattern: "^[^=]+=[^=]+$" }),
            defaults: { type: "object", open: true },
            control: { type: "boolean" },
            min_height: { ...text, pattern: "^\\d+(\\.\\d+)?px$" },
          },
        }),
      ),
    },
  },
  "column-types": {
    file: "design/column-types.json",
    question: "which column types the repository has",
    born: BORN.floor,
    writer: "a person",
    version: 1,
    root: {
      version: required(number),
      padding_ch: required(number),
      types: required({ type: "object", open: true }),
    },
  },
  columns: {
    file: "design/columns.json",
    question: "how each column type is aligned and how wide it starts, and each field's type",
    born: BORN.firstEntry,
    writer: "make design-columns, from the data model",
    version: 1,
    root: {
      version: required(number),
      padding_ch: required(number),
      types: required({ type: "object", open: true }),
      fields: required({ type: "object", open: true }),
    },
  },
  states: {
    file: "design/states.json",
    question: "which states every screen declares, and which screens are excused",
    born: BORN.floor,
    writer: "a person",
    version: 1,
    root: {
      version: required(number),
      required: required(list(text)),
      exempt: required({ type: "object", open: true }),
    },
  },
  "screen-sizes": {
    file: "design/screen-sizes.json",
    question: "the widths every page is checked at",
    born: BORN.floor,
    writer: "a person",
    version: 1,
    root: { version: required(number), widths: required(list(number)) },
  },
  parts: {
    file: "design/parts.json",
    question: "the parts of the code from the top down, and which may import which",
    born: BORN.firstEntry,
    writer: "a person",
    version: 1,
    root: {
      version: required(number),
      parts: required(list({ type: "object", fields: { name: required(text) }, open: true })),
    },
  },
  screens: {
    file: "design/screens.yaml",
    question: "which screens exist, of which kind, with which states",
    born: BORN.floor,
    writer: "a person or an agent, with each new screen",
    version: 1,
    format: "yaml-screens",
    // A repository may keep this ledger as a folder instead: one file per screen, named after the
    // screen's id, and one file for the keys that are not a screen. The data is the same, so the
    // shape and its version are the same; a reader takes the folder when it is there.
    fragments: {
      folder: fragmentsFolder("design/screens.yaml"),
      shared: FRAGMENTS_SHARED,
      named_by: "id",
    },
    root: {
      version: required({ type: "number|string" }),
      families: { type: "object", open: true },
      audiences: list(text),
      statuses: list(text),
      screens: required(
        list({
          type: "object",
          fields: {
            id: required(text),
            route: required({ ...text, pattern: "^/" }),
            title: required({ type: "string|null" }),
            family: required({ type: "string|null" }),
            audience: text,
            status: required({ ...text, values: ["built", "planned"] }),
            states: list(text),
            // The widths this screen is checked at, when they are not the ones every page is.
            sizes: list({ ...text, pattern: "^\\d+$" }),
            // What the screen shows, the action a role must hold to open it (null: every role),
            // and the actions it has buttons for: names of the repository's domain model.
            shows: list(text),
            entry: { type: "string|null" },
            actions: list(text),
          },
          // A repository may keep keys of its own on a screen, such as who may open it.
          open: true,
        }),
      ),
      // The frame around every screen, the actions that have no screen, and the repository's own
      // spelling of these keys.
      frame: {
        type: "object",
        fields: { shows: list(text), actions: list(text) },
        open: true,
      },
      no_screen: { type: "object", open: true },
      keys: { type: "object", open: true },
    },
    // And keys of its own beside the screens.
    open: true,
  },
  intake: {
    file: INTAKE_LEDGER,
    question: "which need got which block, from where, and who approved it on which day",
    born: BORN.firstEntry,
    writer: "the round that takes the block in, once, with its approval",
    version: 1,
    format: "yaml-intake",
    // Kept as a folder, each block is a file named after its need: one need, one answer, held by
    // the names of the files.
    fragments: {
      folder: fragmentsFolder(INTAKE_LEDGER),
      shared: FRAGMENTS_SHARED,
      named_by: "need",
    },
    root: {
      version: required({ type: "number|string" }),
      blocks: required(
        list({
          type: "object",
          fields: {
            // What it is and where its code is, where it came from (an outside library's name for
            // it, or that it was made by hand) and at which pin, which need it answers, the record
            // of the round that took it in, and who approved it on which day.
            name: required(text),
            file: required(text),
            source: required(text),
            pin: text,
            need: required({ ...text, pattern: "^[a-z0-9]+(-[a-z0-9]+)*$" }),
            description: text,
            record: text,
            approved: required({ ...text, pattern: "^\\d{4}-\\d{2}-\\d{2}$" }),
            approved_by: text,
            // The pinned source it came from, the hash of its file when it was taken in, a change
            // the repository made on purpose and why, and whether it was retired or merged into
            // the block of another need.
            from: dashed,
            taken: { ...text, pattern: "^[0-9a-f]{64}$" },
            changed: {
              type: "object",
              // Widened with change --widen (spec 0015): who answered, and the hash of the file as
              // changed, which the inventory holds the file to.
              fields: {
                on: required(day),
                why: required(text),
                by: text,
                sha256: { ...text, pattern: "^[0-9a-f]{64}$" },
              },
              open: true,
            },
            retired: {
              type: "object",
              fields: { on: required(day), by: required(text), why: required(text) },
              open: true,
            },
            merged_into: dashed,
            // The conform record of an item of an outside source, which holds the hash of every
            // file of the item after patching (spec 0015).
            conform: text,
            // Of a block made by hand: the words find was asked with, and the nearest candidate it
            // gave, or `none` when nothing answered (spec 0015, criterion 11).
            searched: text,
            nearest: text,
          },
          // A repository may keep keys of its own on a block.
          open: true,
        }),
      ),
      // The repository's own spelling of these keys, such as `{ blocks: <its list>, need: … }`.
      keys: { type: "object", open: true },
      // What the repository made before it kept this ledger, each with why it has no block.
      before: list({
        type: "object",
        fields: { name: required(text), why: required(text), file: text, record: text },
        open: true,
      }),
      // How the repository writes a value of the contract, such as `{ by-hand: <its word> }`.
      values: { type: "object", fields: { "by-hand": text }, open: true },
    },
    open: true,
  },
  sources: {
    folder: SOURCES_FOLDER,
    ending: ".json",
    question:
      "which outside libraries blocks are picked from, in what order, at which pin; and which fonts the product uses, from where, at which pin, under which licence",
    born: BORN.firstEntry,
    writer:
      "a person, or the repository's own tool that pins a source; a font's row, the guide or adopt from what the repository holds, and its licence a person; one file per source",
    version: 1,
    format: "json-sources",
    root: {
      version: required({ type: "number|string" }),
      // The name of its file, without `.json`.
      id: required(dashed),
      title: text,
      // Sources are looked through by this number, the smallest first, then by id.
      order: number,
      // The pin itself, or the file the repository already keeps it in; one of the two.
      pin: {
        type: "object",
        fields: {
          fetched_at: text,
          files: list({
            type: "object",
            fields: {
              file: required(text),
              url: text,
              bytes: number,
              sha256: required({ ...text, pattern: "^[0-9a-f]{64}$" }),
            },
            open: true,
          }),
          version: text,
        },
        open: true,
      },
      pin_file: text,
      // The folder the pinned files are kept in, where they are compared with their hashes.
      snapshot: text,
      // The list of what the source offers, kept in the repository.
      catalog: required(text),
      // How one item is taken in, with `{name}` where its name goes.
      install: text,
      // The folder of the repository its items' files are installed into: once declared, the gate
      // names a file there that the code uses and no conform record of an item taken in lists.
      folder: text,
      // Where it stands on the ladder find and intake walk: before the starter kit and the family's
      // store, or after them, where a source that says nothing stands (spec 0015).
      ladder_place: { ...text, values: LADDER_PLACES },
      // The plug of the capability table this source is, when its id is not the plug's.
      plug: dashed,
      // What taking an item in needs, in a sentence; never a key.
      licence: text,
    },
    // A source of the kind `font`: the same row, with no catalog, the family the stylesheet names,
    // the variable a font loader of the build sets for it when it has one, a pin the row itself
    // holds, and the licence the font is used under, which a person writes. `own` says the
    // repository loaded the font before the row was written; `proposed` says which command wrote
    // the row and when, and that a person has not finished it.
    font: {
      catalog: text,
      family: required({ ...text, pattern: FONT_FIELDS.family }),
      variable: { ...text, pattern: FONT_FIELDS.variable },
      pin: {
        type: "object",
        fields: {
          // The package the lockfile pins, and the version it pins it at.
          package: text,
          version: text,
          // Or each font file, by its path from the repository's root, with its hash; a file may
          // say the weight or the range of weights it holds, and its style.
          files: list({
            type: "object",
            fields: {
              file: required({ ...text, pattern: FONT_FIELDS.file }),
              sha256: required({ ...text, pattern: "^[0-9a-f]{64}$" }),
              weight: { ...text, pattern: FONT_FIELDS.weight },
              style: { ...text, values: FONT_STYLES },
            },
            open: true,
          }),
        },
        open: true,
      },
      own: { type: "boolean" },
      proposed: {
        type: "object",
        fields: { by: required(text), on: required(day) },
        open: true,
      },
    },
    open: true,
  },
  conform: {
    folder: CONFORM_FOLDER,
    ending: ".json",
    question:
      "for an item of an outside source taken down for a need: every file as taken down and after patching, each patch with its reason, each rule it is let off with its reason",
    born: BORN.firstEntry,
    writer:
      "a person, until the conform command writes it (spec 0015, slice 3); intake reads it before it takes the item in",
    version: 1,
    format: "json-conform",
    root: {
      version: required({ type: "number|string" }),
      // The need it is taken down for, which is the name of its file without `.json`.
      need: required(dashed),
      // The pinned source it comes from, by id, and its name in that source's catalog.
      source: required(dashed),
      item: required(text),
      // Since the conform command, the hash of the source's pin as the item was last taken down:
      // a file that is neither as taken down nor after patching is a newer item only once the
      // source is pinned again, and otherwise a hand edit.
      pin_sha256: { ...text, pattern: "^[0-9a-f]{64}$" },
      // Every file the item brought, with its hash as taken down; then every one after patching.
      taken: required(list(hashedFile)),
      conformed: required(list(hashedFile)),
      // Each change made to the item's code, with why, and since the conform command the change
      // itself: a unified diff from the file before the change to the file after it, applied in
      // order from the file as taken down. Empty when none.
      patches: required(
        list({
          type: "object",
          fields: { file: required(text), reason: required(text), diff: text },
          open: true,
        }),
      ),
      // Each rule the item is let off, in which file, with why; empty when none.
      exemptions: required(
        list({
          type: "object",
          fields: { rule: required(text), file: required(text), reason: required(text) },
          open: true,
        }),
      ),
    },
    open: true,
  },
  "screen-kinds": {
    folder: "design/patterns",
    question: "how a screen of each kind is built",
    born: BORN.firstEntry,
    writer: "a person",
    // The acceptance kit defines the page and has no version for it.
    version: null,
    format: "pages",
    // The eight keys the kit requires, and the ones it reads when they are there.
    head: {
      nhom: required(text),
      doi_tuong: required(text),
      khuon: required({ type: "object", fields: { ten: required(text) }, open: true }),
      nhan_dien: required({ type: "array|string|object" }),
      mau_dang_chay: required({ type: "object", open: true }),
      khe_bat_buoc: required({ type: "array" }),
      cam_ngoai_khuon: required({ type: "array" }),
      ngoai_le: required({ type: "array" }),
      don_vi: { ...text, values: ["man", "phan-tu"] },
      cam_ho: { type: "array" },
      thay_cho: { type: "array|string" },
      khe_tuy_chon: { type: "array" },
      luat: { type: "array|object" },
      nhan_viec: text,
      lop_trinh_bay: { type: "array|object|string" },
      thanh_phan_tang_ngan: { type: "array|object" },
    },
  },
};

// Ledgers the contract names whose one shape is not settled yet, and why.
export const UNSETTLED = {};

// The core of a family of products (spec 0016): not a ledger of a repository, but a folder of its
// own, on this machine, that the repositories of one family share. It has a fixed shape, versioned
// like a ledger: a tool that knows shape N reads every part of shape N or older, and one that finds
// a newer part writes nothing and says to update the plugin. Every part is a JSON file and carries
// `version`. The family's name, its answers and its blocks are the user's data, kept in the folder;
// none is named by the plugin.
export const CORE_HOLDS = ["locked", "default"];
// What an answer is: a value a member compares, or a rule, whose words are what its row says and
// which its check holds.
export const CORE_KINDS = ["value", "rule"];
// A check as a row of the decision ledger writes it.
const checkText = { ...text, pattern: `^(test|e2e|tool|${adapterOf("lint").prefix}):` };
const settled = {
  type: "object",
  fields: { by: required(text), on: required(day) },
  open: true,
};
// An e-mail address in a text a person gave, which no file of a core keeps: a core keeps names.
export const ADDRESS = /[^\s@<>()]+@[^\s@<>()]+\.[^\s@<>()]+/;
// Text that says something: never blank.
const said = { ...text, pattern: "\\S" };
// What an answer was, or became, at one change: its value and its hold.
const answerState = {
  type: "object",
  fields: {
    value: required({ type: "string|number|boolean|array|object" }),
    hold: required({ ...text, values: CORE_HOLDS }),
  },
};
// One change of an answer after it came into the core (shape 2): what it was, what it became, who
// changed it, on which day, and why. The reason is never blank.
const answerChange = {
  type: "object",
  fields: {
    was: required(answerState),
    became: required(answerState),
    by: required(said),
    on: required(day),
    why: required(said),
  },
};
// The shape in which an answer first carries its history.
export const CORE_HISTORY_SINCE = 2;
export const CORE = {
  // Shape 2 adds `history` to an answer; a part of shape 1 is read as it is.
  version: 2,
  parts: {
    // Which family the core is of, by the name the person gave it; the repository its answers were
    // first read from; the repositories that declared they are of it, each with the day it joined
    // and the pin it holds (spec 0016, answer 11: the first repository is a member only once it
    // declares so); and who built the core on which day, the family's owner (answer 10).
    declaration: {
      file: "core.json",
      question:
        "which family this core is of, where its answers came from, and which repositories are of it",
      required: true,
      root: {
        version: required(number),
        family: required({ ...text, pattern: "\\S" }),
        first: required({
          type: "object",
          fields: {
            repository: required(text),
            read_on: required(day),
            commit: required({ type: "string|null" }),
          },
          open: true,
        }),
        members: required(
          list({
            type: "object",
            fields: { repository: required(text), joined: required(day), pin: text },
            open: true,
          }),
        ),
        owner: required(settled),
      },
      open: true,
    },
    // The answers the family shares: for each, the question, whether it is a value or a rule, its
    // value (a rule's words), whether it is locked or a default, the check that holds it (null when
    // none does), why, who settled it in the core on which day, and where it came from, with who
    // settled it there when the ledger says so, and who gave the value on the sheet when the
    // ledgers did not hold it.
    answers: {
      file: "answers.json",
      question: "which answers the family shares, locked or default, and what holds each",
      required: true,
      root: {
        version: required(number),
        answers: required(
          list({
            type: "object",
            fields: {
              id: required(dashed),
              question: required(text),
              kind: required({ ...text, values: CORE_KINDS }),
              value: required({ type: "string|number|boolean|array|object" }),
              hold: required({ ...text, values: CORE_HOLDS }),
              check: required({ ...checkText, type: "string|null" }),
              why: required(text),
              by: required(text),
              on: required(day),
              origin: required({
                type: "object",
                fields: {
                  repository: required(text),
                  ledger: required(text),
                  by: { type: "string|null" },
                  on: { ...day, type: "string|null" },
                  given: settled,
                },
                open: true,
              }),
              // Each change since the answer came into the core, oldest first: `by`, `on` and
              // `why` above say how it came in and are never rewritten.
              history: list(answerChange),
            },
            open: true,
          }),
        ),
      },
      open: true,
    },
    // The store of graduated blocks: each block by its need, its files kept under
    // `blocks/<need>/` with their hashes, the adapters it needs, the repositories that use it, who
    // promoted it on which day, and whether a second repository has used it yet (answer 13).
    blocks: {
      file: "blocks/index.json",
      question: "which blocks graduated to the family, with their files, adapters and users",
      required: true,
      root: {
        version: required(number),
        blocks: required(
          list({
            type: "object",
            fields: {
              need: required(dashed),
              name: required(text),
              files: required(list(hashedFile)),
              adapters: required(list(text)),
              used_by: required(list(text)),
              promoted: required(settled),
              second_use: required({ type: "boolean" }),
            },
            open: true,
          }),
        ),
      },
      open: true,
    },
    // What each member repository has solved, one file per repository named after it: the key of
    // each need, its name and its description, and nothing else: never code, never a file's text.
    members: {
      folder: "members",
      ending: ".json",
      question: "which needs each member repository has solved, by key, name and description",
      required: false,
      root: {
        version: required(number),
        repository: required(text),
        needs: required(
          list({
            type: "object",
            fields: {
              need: required(dashed),
              name: required(text),
              description: required(text),
            },
          }),
        ),
      },
      open: true,
    },
  },
};

// Why a part of a core is of a newer shape than this tool knows, or null.
export function coreNewerProblem(data, file) {
  const found = versionOf(data);
  if (found === null || found <= CORE.version) return null;
  return `${file} has shape ${found} and this tool knows shape ${CORE.version} of a family core: update the design-assembly plugin before it writes there`;
}

// The parts of a core folder, each as { part, file, data } or { part, file, problem } when it
// cannot be read; a part that is not there and must be is { part, file, missing: true }.
export function readCoreParts(dir) {
  const found = [];
  const readOne = (part, file) => {
    try {
      found.push({ part, file, data: JSON.parse(readFileSync(path.join(dir, file), "utf8")) });
    } catch {
      found.push({ part, file, problem: `${file} is not valid JSON` });
    }
  };
  for (const [part, spec] of Object.entries(CORE.parts)) {
    if (spec.file) {
      if (existsSync(path.join(dir, spec.file))) readOne(part, spec.file);
      else if (spec.required) found.push({ part, file: spec.file, missing: true });
      continue;
    }
    const folder = path.join(dir, spec.folder);
    if (!existsSync(folder) || !statSync(folder).isDirectory()) continue;
    for (const name of readdirSync(folder).sort()) {
      if (name.endsWith(spec.ending)) readOne(part, `${spec.folder}/${name}`);
    }
  }
  return found;
}

// Every part of a core folder of a newer shape: the reasons, empty when there is none. A tool that
// writes a core writes nothing while the list is not empty.
export function newerCoreParts(dir) {
  return readCoreParts(dir)
    .filter((entry) => entry.data !== undefined)
    .map((entry) => coreNewerProblem(entry.data, entry.file))
    .filter(Boolean);
}

// What is wrong with a core folder against its shape, each line naming the file and the place:
// empty when the core holds. A part of a newer shape is said once, and its content is not judged.
export function familyCoreProblems(dir) {
  const problems = [];
  for (const entry of readCoreParts(dir)) {
    if (entry.missing) {
      problems.push(`${entry.file} is missing: a family core has it, empty or not`);
      continue;
    }
    if (entry.problem) {
      problems.push(entry.problem);
      continue;
    }
    problems.push(...corePartShapeProblems(entry.part, entry.data, entry.file));
  }
  return problems;
}

// What is wrong with the data of one part of a core, written at `file` in the core folder.
export function corePartShapeProblems(part, data, file) {
  const spec = CORE.parts[part];
  if (!spec) return [`${part} is not a part of a family core`];
  if (typeOf(data) !== "object") return [`${file} is ${typeOf(data)}, the contract says object`];
  const newer = coreNewerProblem(data, file);
  if (newer) return [newer];
  return [
    ...objectProblems(data, spec.root, spec.open, file),
    ...corePartProblems(part, data, file),
  ];
}

// What a part says that its shape alone does not hold: an answer or a block given twice, a member's
// report not named after its repository.
function corePartProblems(part, data, file) {
  const twice = (items, key) => {
    const seen = new Set();
    return (Array.isArray(items) ? items : [])
      .map((item) => item?.[key])
      .filter((value) => {
        if (typeof value !== "string") return false;
        if (!seen.has(value)) {
          seen.add(value);
          return false;
        }
        return true;
      });
  };
  if (part === "answers") {
    const answers = Array.isArray(data.answers) ? data.answers : [];
    return [
      ...twice(answers, "id").map((id) => `${file} answers ${id} twice: one question, one answer`),
      ...answers.flatMap((answer, index) =>
        historyProblems(answer, `${file}.answers[${index}]`, versionOf(data), file),
      ),
      // A rule's value is the words of its row; a value is what a member compares.
      ...answers.flatMap((answer, index) =>
        answer?.kind === "rule" && typeof answer.value !== "string"
          ? [
              `${file}.answers[${index}].value is a rule's, and a rule's value is the words of its row`,
            ]
          : [],
      ),
    ];
  }
  if (part === "blocks") {
    return twice(data.blocks, "need").map(
      (need) => `${file} keeps two blocks for the need ${need}: one need, one block`,
    );
  }
  if (part === "members" && typeof data.repository === "string") {
    const name = path.posix.basename(file);
    if (name !== `${data.repository}.json`) {
      return [
        `${file} is named ${name} and its repository is ${data.repository}: a report is named after its repository`,
      ];
    }
  }
  return [];
}

const typeOf = (value) => (value === null ? "null" : Array.isArray(value) ? "array" : typeof value);

// Whether two states of an answer are one: the same value and the same hold.
const sameState = (a, b) =>
  typeOf(a) === "object" &&
  typeOf(b) === "object" &&
  a.hold === b.hold &&
  JSON.stringify(a.value) === JSON.stringify(b.value);

// What the history of one answer, at `where`, says that its shape alone does not hold: each change
// goes on from the one before it, the last made the answer what it is, a change changes something,
// a rule is never given another value, the days go forward from the day the answer came in, and a
// name or a reason holds no e-mail address. A history in a part of shape 1 is a part of shape 2.
function historyProblems(answer, where, version, file) {
  const history = answer?.history;
  if (!Array.isArray(history) || history.length === 0) return [];
  const at = `${where}.history`;
  const problems = [];
  if (version !== null && version < CORE_HISTORY_SINCE) {
    problems.push(`${at} is of shape ${CORE_HISTORY_SINCE}, and ${file} says shape ${version}`);
  }
  history.forEach((step, index) => {
    if (typeOf(step) !== "object") return;
    const here = `${at}[${index}]`;
    const before = history[index - 1];
    if (sameState(step.was, step.became)) {
      problems.push(`${here} changes nothing: was and became are the same`);
    }
    if (
      answer.kind === "rule" &&
      typeOf(step.was) === "object" &&
      typeOf(step.became) === "object" &&
      JSON.stringify(step.was.value) !== JSON.stringify(step.became.value)
    ) {
      problems.push(`${here} gives a rule another value: a rule's words are its row's`);
    }
    if (typeOf(before) === "object" && !sameState(before.became, step.was)) {
      problems.push(`${here}.was is not what ${at}[${index - 1}] made the answer`);
    }
    const since = index === 0 ? answer.on : before?.on;
    if (typeof since === "string" && typeof step.on === "string" && step.on < since) {
      problems.push(`${here}.on is ${step.on}, before ${since}: a history goes forward`);
    }
    for (const key of ["by", "why"]) {
      if (typeof step[key] === "string" && ADDRESS.test(step[key])) {
        problems.push(
          `${here}.${key} holds an e-mail address: a core keeps names, never an address`,
        );
      }
    }
  });
  const last = history.at(-1);
  if (typeOf(last) === "object" && !sameState(last.became, answer)) {
    problems.push(
      `${at}[${history.length - 1}].became is not the answer's value and hold: the last change made the answer what it is`,
    );
  }
  return problems;
}

// What is wrong with a value against a field, each line naming where.
function fieldProblems(value, spec, where) {
  const allowed = spec.type.split("|");
  if (!allowed.includes(typeOf(value))) {
    return [`${where} is ${typeOf(value)}, the contract says ${spec.type}`];
  }
  const problems = [];
  if (spec.values && !spec.values.includes(value)) {
    problems.push(`${where} is "${value}", not one of ${spec.values.join(", ")}`);
  }
  if (spec.pattern && typeof value === "string" && !new RegExp(spec.pattern).test(value)) {
    problems.push(`${where} is "${value}", which is not written as the contract says`);
  }
  if (typeOf(value) === "array" && spec.items) {
    value.forEach((item, index) =>
      problems.push(...fieldProblems(item, spec.items, `${where}[${index}]`)),
    );
  }
  if (typeOf(value) === "object" && spec.fields) {
    problems.push(...objectProblems(value, spec.fields, spec.open, where));
  }
  return problems;
}

function objectProblems(value, fields, open, where) {
  const problems = [];
  for (const [key, spec] of Object.entries(fields)) {
    if (!(key in value)) {
      if (spec.required) problems.push(`${where}.${key} is missing`);
      continue;
    }
    problems.push(...fieldProblems(value[key], spec, `${where}.${key}`));
  }
  if (!open) {
    for (const key of Object.keys(value)) {
      if (!(key in fields)) problems.push(`${where}.${key} is not in the contract`);
    }
  }
  return problems;
}

// The version a file of a ledger says it has, as a number, or null.
export function versionOf(data) {
  const value = data?.version;
  if (value === undefined || value === null) return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

// Why a file is of a newer shape than this tool knows, or null. A newer file is never written over:
// the tool that reads it is older than the one that wrote it.
export function newerProblem(kind, data, file = LEDGERS[kind]?.file ?? LEDGERS[kind]?.folder) {
  const known = LEDGERS[kind]?.version;
  const found = versionOf(data);
  if (known === null || known === undefined || found === null || found <= known) return null;
  return `${file} has shape ${found} and this tool knows shape ${known}: update the design-assembly plugin before it writes here`;
}

// Every ledger of a repository that a newer tool wrote: the reasons, empty when there is none. A
// tool that writes ledgers asks first, and writes nothing when the list is not empty.
export function newerLedgers(root) {
  return Object.entries(LEDGERS)
    .filter(([, ledger]) => ledger.file?.endsWith(".json") && ledger.version)
    .map(([kind, ledger]) => {
      const full = path.join(root, ledger.file);
      if (!existsSync(full)) return null;
      try {
        return newerProblem(kind, JSON.parse(readFileSync(full, "utf8")));
      } catch {
        return null;
      }
    })
    .filter(Boolean);
}

// Whether a ledger is there: its file, or, for a ledger that may be kept one file per entry, a
// folder that holds at least one file.
function ledgerHere(root, ledger) {
  if (ledger.file && existsSync(path.join(root, ledger.file))) return true;
  const folder = ledger.folder ?? ledger.fragments?.folder;
  if (!folder) return false;
  const full = path.join(root, folder);
  return existsSync(full) && statSync(full).isDirectory() && readdirSync(full).length > 0;
}

// The ledgers a repository has from birth that this one has not, by file, in the contract's order.
// Read at the contract's own paths: a file moved elsewhere by the acceptance kit's settings counts
// as missing here.
export function missingAtBirth(root) {
  return Object.values(LEDGERS)
    .filter((ledger) => ledger.born === BORN.floor && !ledgerHere(root, ledger))
    .map((ledger) => ledger.file ?? ledger.folder);
}

// The token file: groups of tokens, nested as deep as a group needs, each token with a known type
// and a value. A colour's value is hexadecimal, the one form every reader takes.
function tokensProblems(data, file) {
  if (typeOf(data) !== "object") return [`${file} is ${typeOf(data)}, the contract says object`];
  const problems = [];
  const walk = (node, where) => {
    if (typeOf(node) !== "object") {
      problems.push(`${where} is ${typeOf(node)}, the contract says a token or a group`);
      return;
    }
    if (!("$value" in node) && !("$type" in node)) {
      for (const [key, child] of Object.entries(node)) walk(child, `${where}.${key}`);
      return;
    }
    if (!TOKEN_TYPES.includes(node.$type)) {
      problems.push(`${where}.$type is "${node.$type}", not a token type the readers know`);
    }
    if (!("$value" in node)) problems.push(`${where}.$value is missing`);
    else if (node.$type === "color" && !/^#[0-9a-f]{6}([0-9a-f]{2})?$/i.test(String(node.$value))) {
      problems.push(
        `${where}.$value is not a hexadecimal colour, which the acceptance kit's gate needs`,
      );
    }
    for (const key of Object.keys(node)) {
      if (!["$type", "$value", "$description", "$extensions"].includes(key)) {
        problems.push(`${where}.${key} is not in the contract`);
      }
    }
  };
  for (const [group, node] of Object.entries(data)) walk(node, group);
  return problems;
}

// What is wrong with the text of one ledger file against its shape: a list, empty when it holds.
export function shapeProblems(kind, textOfFile, file = LEDGERS[kind]?.file) {
  const ledger = LEDGERS[kind];
  if (!ledger) return [`${kind} is not a ledger of the contract`];
  if (textOfFile === null || textOfFile === undefined) return [];
  if (ledger.format === "pages") {
    const head = frontMatter(textOfFile);
    if (!head) return [`${file} has no front matter between --- lines`];
    return objectProblems(head, ledger.head, false, file).map((line) =>
      line.replace(/is not in the contract$/, "is not a key the acceptance kit reads"),
    );
  }
  if (ledger.format === "yaml-intake") return intakeProblems(textOfFile, file);
  if (ledger.format === "json-sources") return sourceProblems(textOfFile, file);
  if (ledger.format === "json-conform") return conformProblems(textOfFile, file);
  let data;
  if (ledger.format === "yaml-screens") {
    const { screens, ...rest } = readScreenLedger(textOfFile);
    data = { ...rest, ...(/^screens:/m.test(textOfFile) ? { screens } : {}) };
  } else if (ledger.format === "yaml-ledger") {
    const version = /^version:\s*(\S+)\s*$/m.exec(textOfFile)?.[1];
    data = {
      ...(version === undefined
        ? {}
        : { version: /^\d+$/.test(version) ? Number(version) : version }),
      decisions: parseLedger(textOfFile),
    };
  } else {
    try {
      data = JSON.parse(textOfFile);
    } catch {
      return [`${file} is not valid JSON`];
    }
  }
  if (ledger.format === "tokens") return tokensProblems(data, file);
  if (typeOf(data) !== "object") return [`${file} is ${typeOf(data)}, the contract says object`];
  const newer = newerProblem(kind, data);
  if (newer) return [newer];
  return objectProblems(data, ledger.root, ledger.open, file);
}

// The intake ledger, read in the contract's keys whatever its spelling: a problem names a key the
// repository spells otherwise as both, and a need answered twice is named once.
function intakeProblems(textOfFile, file) {
  const { spelled, ...data } = readIntakeLedger(textOfFile);
  const newer = newerProblem("intake", data);
  if (newer) return [newer];
  const own = Object.entries(spelled).filter(([key, value]) => value !== null && key !== value);
  const named = (line) =>
    own.reduce(
      (said, [key, value]) =>
        said.replace(new RegExp(`\\.${key}( |\\[|$)`, "g"), `.${key} (${value})$1`),
      line,
    );
  return [
    ...spellingProblems(readYaml(textOfFile)).map((line) => `${file}: ${line}`),
    ...objectProblems(data, LEDGERS.intake.root, LEDGERS.intake.open, file).map(named),
    ...repeatedNeeds(data).map(
      (need) => `${file}: two blocks answer the need ${need}: one need, one solution`,
    ),
  ];
}

// One conform record: its shape, a name that is its need, at least one file, every file taken down
// again after patching, and patches and exemptions about files of the item only.
function conformProblems(textOfFile, file) {
  let data;
  try {
    data = JSON.parse(textOfFile);
  } catch {
    return [`${file} is not valid JSON`];
  }
  if (typeOf(data) !== "object") return [`${file} is ${typeOf(data)}, the contract says object`];
  const newer = newerProblem("conform", data, file);
  if (newer) return [newer];
  const problems = objectProblems(data, LEDGERS.conform.root, LEDGERS.conform.open, file);
  const name = path.basename(file);
  if (typeof data.need === "string" && name !== `${data.need}.json`) {
    problems.push(
      `${file} is named ${name} and its need is ${data.need}: a record is named after its need`,
    );
  }
  if (problems.length > 0) return problems;
  const taken = data.taken.map((entry) => entry.file);
  if (taken.length === 0) {
    return [`${file}.taken names no file: a record holds every file of its item as taken down`];
  }
  const conformed = new Set(data.conformed.map((entry) => entry.file));
  for (const each of taken.filter((one) => !conformed.has(one))) {
    problems.push(
      `${file}.conformed leaves out ${each}, which taken holds: a record holds every file after patching`,
    );
  }
  for (const each of [...conformed].filter((one) => !taken.includes(one))) {
    problems.push(`${file}.conformed holds ${each}, which taken does not: no file of another item`);
  }
  for (const key of ["patches", "exemptions"]) {
    data[key].forEach((entry, index) => {
      // An exemption for a whole folder names the file of the configuration that lets it off.
      const folderRule = key === "exemptions" && FOLDER_RULES.includes(entry.rule);
      if (!folderRule && !taken.includes(entry.file)) {
        problems.push(
          `${file}.${key}[${index}].file is ${entry.file}, which is no file of the item`,
        );
      }
    });
  }
  return problems;
}

// One file of the ledger of sources: its shape, a name that is its id, and a pin, kept in the file
// or in the one it names, that says which files or which version it holds.
function sourceProblems(textOfFile, file) {
  let data;
  try {
    data = JSON.parse(textOfFile);
  } catch {
    return [`${file} is not valid JSON`];
  }
  if (typeOf(data) !== "object") return [`${file} is ${typeOf(data)}, the contract says object`];
  const newer = newerProblem("sources", data, file);
  if (newer) return [newer];
  // A font is a source of its own kind: what the row of a library requires, less its catalog,
  // more what a font says of itself.
  const font = isFont(data);
  const root = font ? { ...LEDGERS.sources.root, ...LEDGERS.sources.font } : LEDGERS.sources.root;
  const problems = objectProblems(data, root, LEDGERS.sources.open, file);
  const name = path.basename(file);
  if (typeof data.id === "string" && name !== `${data.id}.json`) {
    problems.push(
      `${file} is named ${name} and its id is ${data.id}: a source's file is named after its id`,
    );
  }
  if (font) return [...problems, ...fontRowProblems(data, file)];
  if (!("pin" in data) && !("pin_file" in data)) {
    problems.push(
      `${file}.pin is missing: a source holds its pin, or names the file it is kept in under pin_file`,
    );
  }
  if (typeof data.install === "string" && !data.install.includes("{name}")) {
    problems.push(`${file}.install has no {name}, where the name of the item to take in goes`);
  }
  if (typeOf(data.pin) === "object" && !("files" in data.pin) && !("version" in data.pin)) {
    problems.push(`${file}.pin names neither the files it was read from nor a version`);
  }
  return problems;
}

// Files in the folder of screen kinds that are not a kind of screen.
const NOT_A_KIND = ["README.md", "lech-lot.md"];

// The ledgers a repository has, each with its file and what is wrong with its shape. A ledger kept
// as one page per item gives one entry per page.
export function presentLedgers(root) {
  const found = [];
  for (const [kind, ledger] of Object.entries(LEDGERS)) {
    const files = [];
    if (ledger.folder) {
      const full = path.join(root, ledger.folder);
      if (existsSync(full)) {
        for (const name of readdirSync(full).sort()) {
          const isFile = statSync(path.join(full, name)).isFile();
          if (isFile && name.endsWith(ledger.ending ?? ".md") && !NOT_A_KIND.includes(name)) {
            files.push(`${ledger.folder}/${name}`);
          }
        }
      }
    } else if (ledger.fragments && readFragments(root, ledger.file, kind)) {
      // Kept as one file per entry: one ledger, named by its folder, read as one text.
      const folder = fragmentsFolder(ledger.file);
      found.push({
        kind,
        file: folder,
        problems: shapeProblems(kind, ledgerText(root, ledger.file, kind), folder),
      });
    } else if (existsSync(path.join(root, ledger.file))) files.push(ledger.file);
    for (const file of files) {
      const text = readFileSync(path.join(root, file), "utf8");
      found.push({ kind, file, problems: shapeProblems(kind, text, file) });
    }
  }
  return found;
}

// The ways a file differs from its shape, each named once however many entries have it.
export function differences(problems, file) {
  return [
    ...new Set(
      problems.map((line) =>
        line
          .replace(file, "")
          .replace(/\[\d+\]/g, "[]")
          .trim(),
      ),
    ),
  ];
}
