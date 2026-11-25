---
name: core
description: Build the core of a family of products — the answers the repositories of one family share, each locked or a default, in a folder of its own on this machine — from the answers a person settled in the family's first repository, after the person answers the lock-or-default sheet; check the shape of a core folder; let the family's owner change an answer of the core (its value, locked or a default, or an answer added), each change with who, when and why; let a repository declare its family and pin the core, compare the answers it already holds, and settle the owner's answers about those that differ; tell a member that its family's core moved ahead of its pin, show a change before and after on the repository's own screen, and accept it answer by answer; and record the family owner's leave to publish the core to a private repository, saying first what would go where. Use when a second product of the same family uses the plugin and the user says the repositories belong together ("this app is of the same family as that one", "share the design answers between our products", "make a core for the family", "join our family core", "check our core folder", "lock the source colour for the whole family", "change the family's widths", "did our core change?", "show me what the core changed", "accept the new brand colour from the core", "put our core on a private repository"), when new or adopt asked whether a repository is of the same family as a core of this machine, or when the line at the start of a session said the core moved, a question about it waits, or a locked answer is held otherwise. Not for a repository that stands alone. No script pushes anything: the session creates a repository and pushes only after the person's yes.
---

# Build the core of a family

The core is a folder outside every repository of the family. This command reads the first
repository and never writes there; it writes the core only after a person answered the sheet, with
their name and the day. No script calls a model or the network, and none pushes: publishing the
core to a private repository is section 11, done by the session after the person's yes.

Scripts are in `${CLAUDE_PLUGIN_ROOT}/scripts/` (if the variable is not expanded, use the `scripts/`
folder two levels above this file).

## 1. When

Only when the user says this repository is of the same family as another, or points at the other
one. A repository that stands alone is never asked about a family. The first repository is the one
whose answers the family starts from; ask the user which it is when they have not said.

## 2. Read the first repository

`node ${CLAUDE_PLUGIN_ROOT}/scripts/core.mjs --target <first repository> [--family <name>]`. Add
`--json` for the data. It reads the blueprint when the guide built the repository, and the decision
ledger, the token file and the widths when it was adopted. It prints:

- the answers a person settled there, each with the check that holds it (or that none does) and
  who settled it when the ledgers say so: only these may go into the core. Each is a `value` a
  member compares (the source colour, how a record opens, the type scale, the widths) or a `rule`,
  whose words are what its row says and which its check holds; a value the repository does not hold
  is said to be not read, and is never its row's words;
- a rule of the repository's own that the standard does not know, listed and proposed in neither
  set: it may be a rule of one kind of screen, which stays outside the core;
- the answers left out, each with why: one the guide proposed and nobody confirmed, one that waits
  or was refused on the decision sheet, one the repository has not answered;
- the lock-or-default sheet, four questions: the family's name, the answers proposed as locked, the
  answers proposed as defaults, and where the core lives.

It ends with `1` while the sheet waits on a person, `0` when no answer is settled there (then tell
the user a person settles the first repository's answers first, with `new`, `adopt` or `decide`),
and `2` for a wrong call or a repository that cannot be read: repeat the reason.

## 3. Ask the sheet

Ask the four questions in one sitting, each with its recommendation first, its basis, where it is
written and what refusing it means. Never answer them for the person. A locked answer is kept as it
is by every repository of the family; a default is where a new repository starts, and may change.
Say which locked answers no check holds. For an answer whose value was not read, ask the person
for the value as part of their answer. Ask the person's name for the record when you do not know
it; never write an e-mail address: the command refuses one.

## 4. Build

`node ${CLAUDE_PLUGIN_ROOT}/scripts/core.mjs --target <first repository> --build --family <name>
--core <folder> --by <name> --lock <id> --lock <id> --default <id>`, one flag for each answer, as
the person answered, and `--value <id>=<value>` for each value they gave (`#rrggbb` for the colour,
an option of the blueprint's choice for how a record opens, `standard` or `modular <ratio>` for the
type scale, widths joined by commas). The core records such a value as given by the person on that
day. An answer they kept out of both sets is left out of the core. Add `--dry-run`
to see the files first. It refuses, writes nothing and says why when an answer is not one a person
settled, when a value is missing or not written as asked, when the folder lies inside any git work
tree but its own (the root of a repository made for the core, empty but for git's folder, is
taken), is not empty, or holds a core of a newer shape, and when a name holds an e-mail address. Tell the user the folder and the files written, and that nothing was written in the
first repository.

## 5. Check a core

`node ${CLAUDE_PLUGIN_ROOT}/scripts/core.mjs --check --core <folder>` ends with `0` when the shape
holds and `1` with each problem naming the file and the place; `2` when the folder is not there or
a part has a newer shape than this plugin knows (then the plugin must be updated).

## 6. Change an answer of the core

Only the family's owner changes the core, and only in its folder. One answer a call:

`node ${CLAUDE_PLUGIN_ROOT}/scripts/core.mjs --change <id> --core <folder> --by <name> --why
"<reason>"` and one or two of:

- `--value <value>`: a new value, written as the build takes `--value` (`#rrggbb`, an option of how
  a record opens, `standard` or `modular <ratio>`, widths joined by commas). A rule is never given a
  value: its words are its row's;
- `--hold locked` or `--hold default`: raise a default to locked, or lower a locked answer;
- `--from <repository> --hold <hold>`: add an answer the core does not hold, settled by a person in
  that repository and read as the build reads the first one; when its ledgers do not hold the value,
  give it with `--value`. An answer nobody settled there is refused, with why.

Ask the owner for the reason in their words before you call; it is required and recorded. Before
you raise an answer to locked, say the rule the command prints first: an answer is locked only once
a difference between the family's repositories has done real harm. The owner still decides; the
command does not refuse. Add `--dry-run` to show what would change; add `--on <day>` for another
day. Each change is kept in the answer's `history`: what it was, what it became, who, when, why.

It ends with `0` once the change is written (or would be), and when the change changes nothing (it
says so and writes nothing). It ends with `2` and writes nothing for a missing reason or name, an
e-mail address in a name, a reason or a value, a value not written as asked, an answer the core does
not hold given no `--from`, a core of a newer shape (update the plugin), a core that does not hold
its shape (run `--check`), or a core inside a repository that is not its own. It writes nothing in
any member repository: tell the user each member learns the core moved where it can look at this
folder (section 9), and that a person there accepts the change, answer by answer. It commits
nothing, even when the core is a repository of its own: committing and review are the owner's.

## 7. A repository joins the family

Only on the person's word that this repository is of the family: their own words, or their yes to
the one question `new` or `adopt` asked (`core.mjs --ask` prints it). A no is kept on this machine:
`node ${CLAUDE_PLUGIN_ROOT}/scripts/core.mjs --target <repo> --decline`; the repository is not asked
again, and nothing is written in it.

1. Preview: `core.mjs --target <repo> --join --core <folder> --by <name> --dry-run`. Without
   `--core` it takes the one core of the machine's list, and refuses to guess between two. Show the
   person what it says: the answers of the core and where each stands in this repository, the
   files it writes here, and the line it writes into the core folder (the repository joins the
   members); nothing is written yet.
2. On their yes, the same call without `--dry-run`. It writes `design/sources/core.json` (the
   family and the pin), the copy of the core in `design/core`, the mark on each row of the
   decision ledger whose answer the core holds, and, where the repository's gate is this plugin's,
   the check `family-core` under `ledger-shapes`. Nothing of the repository's values is written
   over.
3. It ends with `1` when a locked answer is held otherwise here: a question waits on the decision
   sheet for each, `core-<id>-<pin>`. Read it to the owner with its recommendation (follow the
   core). Keep means follow: the repository changes its value itself, and the gate is red until it
   does. Refuse, with the reason in their own words, means keep this repository's answer as an
   exception. Write their answer with `/design-assembly:decide`, then run
   `core.mjs --target <repo> --settle --by <name>`: the exception goes into the row's note and the
   gate holds it. A reason the owner gives in the session goes in with `--why <id>=<reason>`.
   Never answer for them.

A copy of the core that differs from its hashes cannot be read: every move says why, the
repository inherits nothing and its own answers stand, and the gate is red until it is pinned
again with `--join`.

## 8. The guide on a member

After the guide's step 1 writes the blueprint, run `core.mjs --target <repo> --inherit`. It writes
into the blueprint each answer of the core the guide would ask, marked `inherited` with the pin and
whether it is locked, and prints the guide's questions: `inherited` are not asked, `filled` are
defaults the person may change (with the reason under `changed.<key>`: `why`, `by`, `on`), `asked`
are asked as before. The guide's preview and build print, last, what the core answered and who
settled it when: read that out.

## 9. The core moved ahead of the pin

A member keeps a copy of the core, and nothing follows the core by itself. Where this machine can
look at the core's folder (the machine's list of cores names it), `status`, `inventory` and

`node ${CLAUDE_PLUGIN_ROOT}/scripts/core.mjs --target <repo> --moved`

name each answer that changed (what it was in the copy, what it is in the core, who changed it,
when and why), each answer added and each the core no longer holds, and, under `here:`, what
accepting it would meet in this repository. It ends with `1` when the core is ahead, `0` when it is
where the repository pinned it, and `0` when the folder cannot be looked at: it says why, the
repository goes on with its copy, and that is no error. A core kept elsewhere on this machine is
named with `--core <folder>`, and the machine's list then holds it. If the core's list of blocks
differs it says so and no more: no move takes the blocks of a core yet.

Read the changes to the person. For a change whose value can be seen, show it:

`core.mjs --target <repo> --moved --draw [--only <id>]... [--out <folder>]`

It lists the value before and after for each change, and draws the repository's own screen before
(A) and after (B), in light and in dark, for the source colour and the type scale; open the sheet
it names for the person. Where it cannot draw (no browser in the repository, no stylesheet, an
answer no picture shows) it says why, and the values in words are the answer. It writes nothing of
the repository's sources.

The person accepts, one answer or all, and you never accept for them:

`core.mjs --target <repo> --accept <id> [--accept <id>]... --by <name>` or
`core.mjs --target <repo> --accept-all --by <name>`, with `--dry-run` first to show what it writes.

The copy takes the core's answer for each one accepted and keeps its own for the rest; the pin
moves, and what was left still shows as ahead. No value of the repository is written over: a locked
answer it then holds otherwise becomes a question `core-<id>-<pin>` on the decision sheet (follow
the core, or keep it as an exception with the reason: section 7, step 3), and the gate is red until
the owner answers; a default it holds otherwise stays, recorded as the repository's own. An
exception given before still stands while the core's answer it was given against did not change.
It ends with `1` when a changed answer was left or a question waits, and says when the
repository's exports fall behind (`make design-exports`).

## 10. The line at the start of a session

The plugin's hook prints one line when a session opens in a member where something waits: the core
moved ahead of the pin, a question about the core waits on the owner, or a locked answer is held
otherwise with no exception. When you see that line, say it to the person once, in their language,
and offer to look (section 9, or the decision sheet); do nothing more until they say so. It is
silent everywhere else; a repository that stands alone never sees it.

## 11. Publish the core to a private repository

Only the family's owner decides this, and no script sends anything. Ask once, after a core is built
or when the owner brings it up: "Shall I put the core on a private repository, so the family's
other machines can reach it?" If they say no, the local folder is fully usable as it is: do not ask
again in this session, and record nothing.

1. Look first: `core.mjs --publish --core <folder> [--to <place>]`. It prints the leave (none,
   given, or taken back), every file that would go, the place, the remote's name, that the
   repository is private, and whether the folder is a git repository yet. Read that to the owner.
2. On their yes, with the place in their words (`host/owner/name`, or the address of the remote):
   `core.mjs --publish --core <folder> --allow --to <place> --by <name>`. The leave is one line of
   the core's `core.json`: for this family and this place only. An address that carries a password
   or a token is refused; never write one.
3. Run step 1 again. Push only when it prints both `sends:` and `to:`, and only what it lists. If a
   file is marked as no part of a core, tell the owner before anything goes. Then, in the core's
   folder, showing each command before you run it:
   - make the folder a git repository if it is none yet (`git init`), and record its files there;
   - create the repository private, for example `gh repo create <owner>/<name> --private --source .
--remote origin`; never public, and where the repository existed already, check that it is
     private (`gh repo view <owner>/<name> --json visibility`) before anything goes to it;
   - `git push -u origin <branch>`.
4. Record it: `core.mjs --publish --core <folder> --pushed --by <name>`. The record is kept in the
   machine's list of cores, not in the folder that was pushed; step 1 then says when the folder
   moved past what was pushed.

Ask first every time the place is new: step 1 says so (`a new place is asked first`) when the
place named, or the folder's remote, is not the one the leave was given for; a yes for the new
place is a new `--allow`. `core.mjs --publish --core <folder> --revoke --by <name>` takes the leave
back: nothing is sent from then on, and what was pushed before stays where it is.

Not built yet: the blocks of the core, leaving a family, and renaming a family.
