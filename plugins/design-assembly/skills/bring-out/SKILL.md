---
name: bring-out
description: Write a repository's design ledgers out for tools that do not read them — a DESIGN.md, and a design system bundle of a README, tokens of both themes, type, spacing, corners, the components and the assets — each stamped with the state of the ledgers, and put them under the gate so it goes red when a ledger changes and an export is not written again. Use when the user wants a DESIGN.md, wants to give their design system to another tool or an assistant, or asks why the gate says an export is stale. Also sends the bundle to a tool from outside, only with the owner's leave for this repository and that tool, after saying what goes where, and records the push. Not for reading a file from another tool (that is bring-in).
---

# Write the ledgers out

The ledgers stay where a value is changed: an export is written from them and never read back as
one. The command writes files of the repository only. It sends nothing to any account or service,
calls no model and no network, and answers nothing for anyone.

Scripts are in `${CLAUDE_PLUGIN_ROOT}/scripts/` (if the variable is not expanded, use the `scripts/`
folder two levels above this file).

## 1. Run it

`node ${CLAUDE_PLUGIN_ROOT}/scripts/bring-out.mjs --target <repo>`. It writes `DESIGN.md` at the
root and the bundle under `design/export/system/` (`README.md`, `tokens.json`, `components.md`,
`assets.json`), adds one check of the gate for each to `design/theme.json`, and the row
`design-exports` of the decision ledger, which points at the tool. `--name NAME` names the system;
by default the name the exports already have, else the package's name. Add `--json` for the data,
`--dry-run` to write nothing.

It ends with `0` when the exports are written, or would be, and with `2` on a wrong call or a
repository with no `design/tokens.json` to write from: the reason is on the error stream and nothing
is written.

## 2. After a ledger changes

The gate says which export was written from which state of the ledgers, and which state they are
in now. Write them again with `make design-exports` (or this command); never change an export by
hand, since the gate holds the data files to what the ledgers give.

## 3. Send the bundle to a tool from outside

Only with the owner's leave, given for this repository and this plug, and only a bundle that says
what the ledgers say now.

1. `node ${CLAUDE_PLUGIN_ROOT}/scripts/bring-out.mjs --send <plug> --target <repo>`. Without the
   leave it puts the question `send-<plug>` on the waiting list and ends with `1`: tell the user it
   waits on the decision sheet (`/design-assembly:decide`), and send nothing. Never answer it for
   them. A refusal, or leave taken back, sends nothing.
2. With the leave it prints what goes (`sends:`) and where (`to:`). Say both to the user before
   anything leaves the machine, then send the files the way the session reaches that tool, with
   the user watching. If the user stops you, stop.
3. After the push, run it again with `--pushed`, adding `--account-has-default` when the account
   already has a default system. It records the push in `design/export/pushed.json` and asks the
   question `default-<plug>` on the first push (and again only once that question is taken away):
   whether to make the system the default there. Make it the default only after the owner answers
   yes on the decision sheet.
4. To take the leave back: `--send <plug> --revoke --by <name>`, with the name the person gave. It
   is written as a row of the decision ledger with the name and the day, and nothing is sent after
   it. To ask again, after a refusal or a leave taken back: `--send <plug> --reask`.

`status` says, for each push, which state of the ledgers it was written from, and when the copy
there is behind them.

## 4. What it does not do

It never sends anything by itself, and never sets a default without the owner's yes. Each component
is listed, not drawn; the handoff book draws them.
