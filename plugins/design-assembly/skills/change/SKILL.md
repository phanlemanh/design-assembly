---
name: change
description: Retire a block of a repository's store, merge it into the block of another need, or widen it for every screen that uses it, once the owner has answered on the decision sheet — after saying what it reaches first, the screens, the frame, the components that import it, the checks that name its file, and each import line. Use when the user or an agent wants to drop, deprecate, retire, replace or merge a block or component that the intake ledger keeps ("retire the old table", "merge these two filters", "we do not need this block any more"), after the inventory reports a duplicate, or when a block falls short and the temptation is a second one beside it ("the table also needs to sort", "this filter needs a date"). Not for taking a block in (that is intake), for changing an item an outside source holds through its conform record (that is conform), for changing a decision of the decision ledger, or for editing the screens that import the block.
---

# Retire, merge or widen a block

The change is the owner's to make, once, on the decision sheet: this command never retires a block
for them, never writes a person's name before that person answered, never removes a file and never
changes a screen's code. It calls no model and fetches nothing.

Scripts are in `${CLAUDE_PLUGIN_ROOT}/scripts/` (if the variable is not expanded, use the `scripts/`
folder two levels above this file).

## 1. Ask for the change

`node ${CLAUDE_PLUGIN_ROOT}/scripts/change.mjs <need or name> --retire --why SENTENCE --target <repo>`,
or `--merge-into NEED` (with `--why` if you have a reason of your own), or `--widen --why SENTENCE`
when the block falls short: one need keeps one block, made wider for every screen that uses it, never
a second block beside it for one screen. The block is named by its
need key, or by its name when one block has it. A merge goes into another need the intake ledger
keeps, not retired. Add `--json` for the data, `--dry-run` to see which files would be written.

The answer says the impact first:

- the screens that reach the block's file, as the change map traces them; every screen, with why,
  when that cannot be traced (no ledger of screens, an import that cannot be followed);
- whether the frame of the application reaches it;
- the components that import it, and the checks of the tool data that name its file;
- each import line that names its file, with the file and the line number.

Then one question goes to the waiting list, `design/waiting/change-<need>.json`, with the impact in
its basis. The call ends with 1.

## 2. The owner answers

Send the owner to the decision sheet (`/design-assembly:decide`). They keep the change, or refuse it
with what to do instead. Never answer for them.

## 3. Call it again

The same block, with no change named, carries the kept change out: the block's entry in the intake
ledger gets `retired` (the day and the name of the answer, and why), and `merged_into` for a merge.
No file is removed. For a widening, change the block's file once the owner kept it, then call again:
the entry gets `changed` (the day and the name of the answer, why, and the hash of the file as
widened). A file still as it was last recorded holds no change yet, and nothing is written; a later
edit that no widening records is reported by the inventory as modified. An item an outside source
holds through its conform record is refused: change it with a recorded patch,
`/design-assembly:conform`. A screen that still imports a retired block keeps working, and the inventory reports
the block as retired and still in use until the import lines listed are fixed: fix them, or have
them fixed, as a change of its own.

Refused, the block stays. A later call that asks for another change (a merge instead of retiring,
or into another need) is a new question, `change-<need>-2`, and the refused one stays as it was.

## 4. How it ends

- `0`: the change is written, or the block was retired already and nothing is left.
- `1`: a question waits on the owner, the owner refused, or a kept widening waits for the file.
- `2`: a wrong call, a block the intake ledger does not keep, a repository with no intake ledger,
  a merge into a need that is not there or is retired, a widening of an item held by its conform
  record, a call that asks for another change than
  the one the owner kept, a waiting list kept as one shared file (split it with `decide --split`),
  or a tool older than one that reads a question about a block (run `upgrade`). Nothing is written.
  Repeat the reason; do not guess.

`--out <folder>` also writes the change report, `change-report.html`, into that folder and nowhere
else; `--format pdf` prints it too, with the repository's own browser.

## 5. What it does not do

It does not edit an import line, remove a file, change a decision of the decision ledger
(`--to`) or move a screen to the values of the system (`--migrate`): `references/limits.json` says
so in the rows of the area `change`.
