---
name: inventory
description: Take stock of the store of a repository — how many components, blocks and kinds of screen it holds, what the starter kit and the pinned outside sources offer, the state of each piece (in use, unused, retired, retired and still in use) — and find seven kinds of trouble: a piece no screen uses, one the code uses that the intake ledger does not record, one thing taken twice, a block behind the pin of its source, a block changed from its source with no reason recorded, an item let off a rule the decision ledger holds, and a component written in one screen that other screens import. Use when the user or an agent asks "what do we have", "what is unused", "is the store clean", "take an inventory", "which blocks are out of date", or before retiring or merging a block. Not for finding a piece for a need (that is find) or for whether a decision is held (that is the audit).
---

# Take stock of the store

Read-only. It writes nothing in the repository, calls no model and fetches nothing, and the same
repository always gives the same answer. What it cannot look at it names, with why, instead of
reporting a guess. Only when asked for a document does it write a file, and only into the folder
named.

Scripts are in `${CLAUDE_PLUGIN_ROOT}/scripts/` (if the variable is not expanded, use the `scripts/`
folder two levels above this file).

## 1. Run it

`node ${CLAUDE_PLUGIN_ROOT}/scripts/inventory.mjs --target <repo>`. Without `--target` it reads the
folder it is run from. Add `--json` for the data; another plugin calls it that way.

- `--store repo|starter|external|all` keeps the pieces, counts and findings of one store: what the
  repository made itself, what it took from the starter kit, or what it took from an outside source.
- `--kind component|block|screen-kind|behaviour` keeps one kind. No store keeps behaviours yet.
- `--strict` makes a finding end the call with 1, for a gate.

It ends with:

- `0`: the inventory is given, whatever it found.
- `1`: with `--strict`, something was found.
- `2`: a wrong call, or a repository that cannot be read. The reason is on the error stream, and
  nothing is printed as an answer. Repeat the reason; do not guess an answer.

## 2. What it reads

The components (as the component manifest lists them, or read from the component library's folder),
the intake ledger with its list of what came before it, the outside sources pinned under
`design/sources/` and their catalogs, the ledger of screens with every file each screen imports, the
frame of the application (what its page loads, as the build adapter reads it, or the server's own
entries), the pages of kinds of screen, and `references/starter.json`.

## 3. Read the answer

- `stores` counts each store by kind. A source whose snapshot differs from its pin cannot be read.
- `items` are the pieces of the repository: each block of the intake ledger, then each component
  whose file is not a block's. Each has its file, where it came from, the screens that use it,
  whether the frame does, and its state. A component of the component library is counted and given
  a state, never reported.
- `findings`, each with the pieces it is about and its evidence:
  - `unused`: a block or a component of the repository's own that no screen and not the frame
    imports.
  - `unrecorded`: a component of the repository's own that a screen or the frame uses, with no block
    in the intake ledger and no line in its list of what came before.
  - `duplicate`: one thing taken more than once: the same item of the same source under two needs,
    two files with the same bytes, or the same name exported by two files.
  - `outdated`: a block taken at another pin than the one its source is pinned at now. An item with
    a conform record, taken in or only taken down, is compared by the hash of the pin the record was
    written at against the hash of the source's pin now, so pinning again on the same day counts;
    take it down at the new pin and run `conform --need <key> --taken-down`. A record written before
    it kept the pin, or a source with no pin, cannot be compared and is named under `blind`.
    A block taken from the family core is compared block by block: it is behind when the copy of
    the core the repository pinned holds another block than the one its record took, and never
    because an answer of the core or another block moved. Take it down again with
    `core --take <block> --need <key>`, which writes the files that changed and never writes over
    a hand edit, then run `conform --need <key> --taken-down`. Nothing is said before the
    repository pins the core again: the repository wins, by pinning.
  - `modified`: a block whose file is not the one taken in (the hash under `taken`, or the template
    of this plugin for a piece of the starter kit), with no `changed` saying why; or not the one its
    last widening recorded under `changed.sha256`.
  - `exempts-mandatory`: an item whose conform record, written before, exempts a rule a row of the
    decision ledger holds; patch the code and take the exemption out of the record.
  - `promote`: a component written in the file of one screen that other screens import.
- `blind` names what was not looked at and why: no intake ledger, no ledger of screens, an import
  that cannot be followed or no entry of the frame (then nothing is called unused), a block with no
  hash or no pin, a source that cannot be read.

## 4. Hand it over as a document

`--out <folder>` also writes the inventory report, `inventory-report.html`, into that folder and
nowhere else; `--format pdf` prints it too, with the repository's own browser. The document is set
on the frame every document of this plugin shares, from the facts of `--json` and nothing else.

## 5. What it does not do

- It never removes, retires, merges or records anything, and never changes a screen. Retiring or
  merging a block is a question for the owner.
- It sees one thing taken twice only by name, source or bytes, never by meaning, and proposes a
  promotion only within one repository: `references/limits.json` says so in the rows of the area
  `inventory`.
