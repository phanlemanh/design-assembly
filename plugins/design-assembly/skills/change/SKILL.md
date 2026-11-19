---
name: change
description: Retire a block of a repository's store, or merge it into the block of another need, once the owner has answered on the decision sheet — after saying what it reaches first, the screens, the frame, the components that import it, the checks that name its file, and each import line to fix. Use when the user or an agent wants to drop, deprecate, retire, replace or merge a block or component that the intake ledger keeps ("retire the old table", "merge these two filters", "we do not need this block any more"), or after the inventory reports a duplicate. Not for taking a block in (that is intake), for changing a decision of the decision ledger, or for editing the screens that import the block.
---

# Retire or merge a block

The change is the owner's to make, once, on the decision sheet: this command never retires a block
for them, never writes a person's name before that person answered, never removes a file and never
changes a screen's code. It calls no model and fetches nothing.

Scripts are in `${CLAUDE_PLUGIN_ROOT}/scripts/` (if the variable is not expanded, use the `scripts/`
folder two levels above this file).

## 1. Ask for the change

`node ${CLAUDE_PLUGIN_ROOT}/scripts/change.mjs <need or name> --retire --why SENTENCE --target <repo>`,
or `--merge-into NEED` (with `--why` if you have a reason of your own). The block is named by its
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
No file is removed. A screen that still imports the block keeps working, and the inventory reports
the block as retired and still in use until the import lines listed are fixed: fix them, or have
them fixed, as a change of its own.

Refused, the block stays. A later call that asks for another change (a merge instead of retiring,
or into another need) is a new question, `change-<need>-2`, and the refused one stays as it was.

## 4. How it ends

- `0`: the change is written, or the block was retired already and nothing is left.
- `1`: a question waits on the owner, or the owner refused.
- `2`: a wrong call, a block the intake ledger does not keep, a repository with no intake ledger,
  a merge into a need that is not there or is retired, a call that asks for another change than
  the one the owner kept, a waiting list kept as one shared file (split it with `decide --split`),
  or a tool older than one that reads a question about a block (run `upgrade`). Nothing is written.
  Repeat the reason; do not guess.

`--out <folder>` also writes the change report, `change-report.html`, into that folder and nowhere
else; `--format pdf` prints it too, with the repository's own browser.

## 5. What it does not do

It does not edit an import line, remove a file, change a decision of the decision ledger
(`--to`) or move a screen to the values of the system (`--migrate`): `references/limits.json` says
so in the rows of the area `change`.
