---
name: find
description: Say whether the store already answers a need before anything new is built — a component, a block, or a kind of screen the repository already has, a piece of this plugin's starter kit it can install, or an item of an outside source it pinned — nearest store first, with the file, what it takes, the screens that use it, and where it came from. Use when the user or an agent is about to build a component, a block or a screen and asks "do we already have", "is there a table that", "what can I reuse for", "find a component for", or before taking a new block in. Not for whether a decision is held (that is the audit) or for what waits on the owner (that is status).
---

# Find what the store already has

Read-only. It writes nothing in the repository, calls no model and fetches nothing: words are
matched, not meaning, and the same repository with the same words always gives the same answer.
Run it before building anything that might already exist. Only when asked for a document does it
write a file, and only into the folder named.

Scripts are in `${CLAUDE_PLUGIN_ROOT}/scripts/` (if the variable is not expanded, use the `scripts/`
folder two levels above this file).

## 1. Run it

`node ${CLAUDE_PLUGIN_ROOT}/scripts/find.mjs <words> --target <repo>`. The words are the need, in a
few words, or the name of a piece: `find.mjs many rows`, `find.mjs TypedTable`. Without `--target`
it reads the folder it is run from. Add `--json` for the data; another plugin calls it that way.

- `--kind component|block|screen-kind|behaviour` keeps one kind. No store keeps behaviours yet;
  a behaviour is described in the repository's `design/behaviors.md`.
- `--limit N` keeps that many matches and that many near pieces (5 by default).

It ends with:

- `0`: something in the store answers.
- `1`: nothing does. Not an error: the screen says what was searched and what to do next.
- `2`: a wrong call, or a repository that cannot be read. The reason is on the error stream, and
  nothing is printed as an answer. Repeat the reason; do not guess an answer.

## 2. Where it looks, nearest first

It stops at the first store that answers, and says so for every store it did not read.

1. The repository's own store: its intake ledger (each block's name, need and description), its
   components as the component manifest lists them (read from the component library's folder when
   the repository keeps no manifest), and its pages of kinds of screen. A block that is not in
   use any more (`retired`, or `merged_into` another need) is never offered.
2. The starter kit of this plugin, `references/starter.json`: a piece is offered only where the
   repository has every adapter it needs, and the screen says which piece lacks which adapter.
3. The family's store: the blocks of the family core the repository pinned, read from its copy
   of the core in `design/core`, never from the core folder. A match says its need, its name, its
   description when the store has one, the adapters it needs, and that it comes from the family's
   core at which pin. A block is offered only where the repository has every adapter it needs and
   its copy holds the block's files; a copy that differs from its hashes offers nothing, with why,
   and the walk goes on. On a repository of no family the line says so.
4. The outside sources the repository pinned under `design/sources/`, in their `order`. A source
   whose snapshot differs from its pin is unreadable, and none of its items is offered.

A source that declares `ladder_place: "before-starter"` is read right after the repository's own
store, before the starter kit and the family's store: the repository's rule wins over this order.
With nothing declared, the order above holds.

## 3. Read the answer

- A **match** holds every word asked for, or is named whole by its name or its need. Each one
  says what it is, which store and file, what it takes and which variants it has, which screens
  use it, where it came from and at which pin, and its page in the source.
- A **near** piece holds only some of the words. It is listed, and it never stops the search.
- `searched` names every store: what was read, how many pieces, whether it answered, and why it
  could not be read or was not reached.
- `next` says what to do: use the piece, or take a block in with `intake --need KEY`, which asks
  the owner and records it in the intake ledger.

Words in one language do not match a catalog written in another. When nothing answers, try the
words a catalog would use before deciding that nothing exists.

## 4. Hand it over as a document

`--out <folder>` also writes the find report, `find-report.html`, into that folder and nowhere
else; `--format pdf` prints it too, with the repository's own browser. The document is set on the
frame every document of this plugin shares, from the facts of `--json` and nothing else.

## 5. What it does not do

- It never takes a block in, installs a piece, runs a source's install line or writes a ledger.
- It does not match meaning: `references/limits.json` says so in the row
  `find-matches-words-not-meaning`.
