---
name: bring-out
description: Write a repository's design ledgers out for tools that do not read them — a DESIGN.md, and a design system bundle of a README, tokens of both themes, type, spacing, corners, the components and the assets — each stamped with the state of the ledgers, and put them under the gate so it goes red when a ledger changes and an export is not written again. Use when the user wants a DESIGN.md, wants to give their design system to another tool or an assistant, or asks why the gate says an export is stale. Not for reading a file from another tool (that is bring-in), and it sends nothing anywhere.
---

# Write the ledgers out

The ledgers stay where a value is changed: an export is written from them and never read back as
one. This command writes files of the repository only. It sends nothing to any account or service,
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

## 3. What it does not do

It does not send the bundle to any account, and it does not set any system as a default anywhere:
that comes later, after the owner's leave for the repository and the tool. Each component is listed,
not drawn; the handoff book draws them.
