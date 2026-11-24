---
name: intake
description: Take a block into the store of a repository for a need, by the ladder of three rungs — a block the intake ledger already keeps for that need, then a piece of the starter kit or an item of a pinned outside source, then one made by hand with why — and record it in the intake ledger with who approved it and when, once the owner has answered on the decision sheet. Also lists, once the owner keeps it, what screens used before the ledger was kept. Use when the user or an agent needs a new block, component or way of working on a screen ("we need a filter bar", "take this block in", "record this component", "add it to the store"), after find says nothing answers a need, or when the inventory reports a component as unrecorded. Not for searching the store (that is find), taking stock of it (that is inventory), or retiring or merging a block.
---

# Take a block in

Every choice is the owner's, made once on the decision sheet: this command never picks a block for
them and never writes a person's name before that person answered. It calls no model, fetches
nothing and runs no install line. It writes a question to the waiting list, and, after the answer,
the block's row in the intake ledger and, for a piece of the starter kit, its files.

Scripts are in `${CLAUDE_PLUGIN_ROOT}/scripts/` (if the variable is not expanded, use the `scripts/`
folder two levels above this file).

## 1. Ask for the need

`node ${CLAUDE_PLUGIN_ROOT}/scripts/intake.mjs --need <key> [words of the need] --target <repo>`.
The key is the need in lower-case words with dashes, such as `narrow-list`; the words are what to
search for, the key's own words when none are given. `--kind component|block` keeps one kind. Add
`--json` for the data, `--dry-run` to see which files would be written and write none.

- **Rung one, the store.** The intake ledger has a block for this need: use it. Nothing is written
  and the call ends with 0. This is the second time a need is asked: nobody is called.
- **Rung two, the starter kit or an outside source.** Up to three candidates, the starter kit's
  first, else the pinned sources' in their order, and "by-hand" last, go to the waiting list as one
  question, `design/waiting/intake-<key>.json`. The call ends with 1. Go on with the recommended
  candidate while it waits, as the sheet says; the row is written only after the answer.
- **Rung three, by hand.** `--by-hand --why SENTENCE` asks to make it by hand, and the sentence is
  shown to the owner as you wrote it. With no candidate at all, by hand is the only one.

A piece of the repository that holds the words under another need is listed as near, never taken
for this one: two needs are not the same need because their words match.

## 2. The owner answers

Send the owner to the decision sheet (`/design-assembly:decide`). They keep the recommendation,
name another candidate (or `by-hand`), or refuse. Never answer for them.

## 3. Call it again

The same call, after the answer:

- **A piece of the starter kit** is copied where the guide puts it, and its row is written. A file
  of the repository's own in its place stops the call: nothing is written over.
- **An item of an outside source:** the question says what it brings (its files, packages, the
  items it asks for, the repository's files it asks to write over), read from the pinned snapshot.
  After the answer, the call gives its install line and does not run it. The line may need the
  network and new packages, so ask the owner before you run it. The item is then taken down, not
  taken in: conform it with `/design-assembly:conform`, which writes its conform record,
  `design/conform/<need>.json` (every file with its hash as taken down and after patching, each patch
  with its reason and diff, each rule it is let off with its file and reason). Then call again with
  `--file PATH`, the block's file: the row is written only when the record is whole, the files on
  disk are the ones it holds, and every rule turned off in a file's comment or for its folder in the
  configuration has its exemption. No exemption lets the item off a rule the decision ledger holds.
  When the record lets the item off anything, the call first puts the list to the owner as one
  question, `design/waiting/exemptions-<need>.json`, and ends with 1; the row is written once the
  owner keeps that very list, and a list changed since is asked again. Until then a page that
  imports the item turns the gate red. The question also says, under `the gate:`, what the gate
  holds of the item once it is taken in: the browser test `tests/e2e/floating-parts.spec.ts` opens
  each floating part of it on the screens that use it (each dialog, menu or list box it opens must
  have a name, and its own text on the screen must be in the repository's words table), and the
  repository's own accessibility check runs with each part open, or the question says that check
  does not run there. Intake runs no browser: the gate does.
- **By hand:** make the block, then call again with `--file PATH`. The row also keeps the words
  searched and the nearest thing the stores gave for them, or `none`: the gate holds a row made by
  hand that a branch writes to both, and names a component file a branch adds with no row. Never
  write a component file and leave it out of the ledger: take it in here first.

The row carries the name, the file, the source, the source's id and pin, the need, a description,
the day and the name of the answer, and the hash of the file as it was taken in.

## 4. What came before the ledger

`intake.mjs --before` lists the components screens or the frame use that no block records, as one
question. Once the owner keeps it (or names some of them, a comma between each), the next call
writes them to the ledger's list of what came before, so the inventory stops reporting them.

## 5. How it ends

- `0`: the need has its row, or nothing came before that is left out.
- `1`: a question waits on the owner, a file waits to be made, or the owner refused.
- `2`: a wrong call, or a repository that cannot be read: a ledger a newer plugin wrote, a waiting
  list kept as one shared file (split it with `decide --split`), a tool older than one that reads a
  question with candidates (run `upgrade`), a retired block for the need. Nothing is written.
  Repeat the reason; do not guess.

`--out <folder>` also writes the intake report, `intake-report.html`, into that folder and nowhere
else; `--format pdf` prints it too, with the repository's own browser.

## 6. What it does not do

It does not search by meaning, show a candidate as a picture, run an install line, retire or merge
a block, or edit a screen. `references/limits.json` says so in the rows of the area `intake`.
