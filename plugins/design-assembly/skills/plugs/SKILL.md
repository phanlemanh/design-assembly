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

`node ${CLAUDE_PLUGIN_ROOT}/scripts/plugs.mjs --target <repo> --session`, with what this session holds:
`--skill <name>` for each skill or slash command the session lists, `--server <name>` for each server it has, and
`--needs-sign-in <name>` for each server that is there and waits for a sign-in, each as the
session lists it. The command matches them only to the names the plug files declare (a name under
a plugin's prefix, `prefix:name`, counts as the name); never add a name the session does not list. `--session` says the names given are all the session
holds; without it, and without any name, a chosen plug only a session holds is not called missing.
Without `--target` it reads the folder it is run from. Add `--json` for the data, `--dry-run` to
see which files of the repository would be written and write none (the page of `--out` is still
written), `--short` for the questions alone, and
`--out DIR [--format pdf]` for the page `plugs-board.html`, which shows every socket.

It ends with:

- `0`: no question about a plug waits.
- `1`: a question about a plug waits on the owner. Not an error.
- `2`: a wrong call, a waiting list or a plug file that cannot be read, or a question on the waiting
  list that recommends a plug that may not be recommended. The reason is on the error stream and
  nothing is written. Repeat the reason; do not guess the board.

## 2. Read the board

One line for each socket, by stage: its plug, `closed` when no plug from outside may fill it, and
the plug chosen for it with who chose it and when. Under it, each plug from outside:

- where it stands: `in-repo` (a file or package of it is in the repository), `in-session` (the
  session holds one of its skills or servers), `needs-sign-in` (its server is there and waits for
  a sign-in: tell the user to give it access), `chosen-but-missing` (the ledger chose it and
  neither shows it), or `absent`;
- `measured in dNNNN`, the decision record that holds its measure, or `unmeasured`;
- what it needs, and what it sends where.

## 3. The questions

A socket is asked only where a plug from outside that was measured is in the repository or the
session. The
recommendation comes first: a plug from outside only when its measure beat the plugin's plug, or
when the owner named it for that socket (its basis then names the record and the owner's words
with the day); otherwise the plugin's plug. An unmeasured plug is never the recommendation. At
most four questions wait at once; the rest are asked in a later round.

The components socket is asked nothing. There a plug from outside is a rung on the ladder of
`intake`, not a rival to it: the board prints the repository's ladder (its own store, then the
starter kit and the sources it pinned, then made by hand) and the rung each plug from outside
stands on. Losing its measure is no reason to keep it off the ladder. A plug from outside that is
here and is no pinned source is named, with the line that `find` and `intake` do not reach it;
tell the user it is pinned by hand in `design/sources/`, since no command pins a source yet. A
question about the components socket left on the waiting list by an earlier version is taken
away, and the run says so with a line that starts with `Taken away`.

Tell the user the questions wait on the decision sheet (`/design-assembly:decide`). After they
answer, run this command again: it writes each answer as a row `plug-<socket>` of the decision
ledger and takes the answered question off the waiting list. Running it again with the same answers
asks nothing.

A waiting question whose plugs from outside are known to be gone (not in the repository, and not in
the session listed) is taken away, and the run says so with a line that starts with `Taken away`;
the socket is asked again when a measured plug is here once more.

Only when the person asks to choose again for a socket whose choice is recorded, run this with
`--reask <socket>` (the
socket's id, as the board prints it). The row `plug-<socket>` is taken out of the decision ledger
and the socket is asked again in its turn, on the decision sheet; nothing else changes.

## 4. When a chosen plug is not here

A line that starts with `falling back` names a socket whose chosen plug is not in the repository or
the session: the plugin's plug works that socket until it is. Say the line as it is, with how to add
the plug, and do not stop.
