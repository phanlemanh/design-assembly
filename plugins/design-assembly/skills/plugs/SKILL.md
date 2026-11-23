---
name: plugs
description: Show which plug works each socket of a repository's design system — the plugin's own plug, the plugs from outside that can fill it, where each stands in the repository, whether it was measured and in which decision record, and what it needs (an account, the network, what it sends where) — and put to the owner, on the waiting list, the choice of a plug for a socket where a measured one is in the repository, four questions at most a round. Once the owner answered on the decision sheet, writes each choice as a row of the decision ledger with their name and day. Use when the user asks which outside tools are plugged in, "which tool does what here", "set up the plugs", "choose a plug for this socket", or what was chosen. Not for answering the questions (that is decide), and not for reviewing a screen.
---

# Plugs: one plug for each socket

This command answers nothing for anyone and asks nothing itself: its questions go to the waiting
list and are answered on the decision sheet, like every other question. It writes a row of the
decision ledger only for a question the owner answered, with the name and day the sheet recorded.
It calls no model and no network.

Scripts are in `${CLAUDE_PLUGIN_ROOT}/scripts/` (if the variable is not expanded, use the `scripts/`
folder two levels above this file).

## 1. Run it

`node ${CLAUDE_PLUGIN_ROOT}/scripts/plugs.mjs --target <repo>`. Without `--target` it reads the
folder it is run from. Add `--json` for the data, `--dry-run` to see which files would be written
and write none.

It ends with:

- `0`: no question about a plug waits.
- `1`: a question about a plug waits on the owner. Not an error.
- `2`: a wrong call, a waiting list or a plug file that cannot be read, or a question on the waiting
  list that recommends a plug that may not be recommended. The reason is on the error stream and
  nothing is written. Repeat the reason; do not guess the board.

## 2. Read the board

One line for each socket, by stage: its plug, `closed` when no plug from outside may fill it, and
the plug chosen for it with who chose it and when. Under it, each plug from outside:

- where it stands: `in-repo` (a file or package of it is in the repository), `chosen-but-missing`
  (the ledger chose it and the repository does not show it), or `absent`;
- `measured in dNNNN`, the decision record that holds its measure, or `unmeasured`;
- what it needs, and what it sends where.

## 3. The questions

A socket is asked only where a plug from outside that was measured is in the repository. The
recommendation comes first: a plug from outside only when its measure beat the plugin's plug, or
when the owner named it for that socket (its basis then names the record and the owner's words
with the day); otherwise the plugin's plug. An unmeasured plug is never the recommendation. At
most four questions wait at once; the rest are asked in a later round.

Tell the user the questions wait on the decision sheet (`/design-assembly:decide`). After they
answer, run this command again: it writes each answer as a row `plug-<socket>` of the decision
ledger and takes the answered question off the waiting list. Running it again with the same answers
asks nothing.

## 4. Not here yet

This command sees the repository, not the session. Matching the skills and servers of the session
to the plug files, the page that shows the whole board, and falling back to the plugin's plug when
a chosen plug is missing come in a later slice. Until then a plug that only a session holds reads
`absent`, or `chosen-but-missing` once chosen.
