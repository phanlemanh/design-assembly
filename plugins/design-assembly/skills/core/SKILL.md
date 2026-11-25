---
name: core
description: Build the core of a family of products — the answers the repositories of one family share, each locked or a default, in a folder of its own on this machine — from the answers a person settled in the family's first repository, after the person answers the lock-or-default sheet; check the shape of a core folder; let the family's owner change an answer of the core (its value, locked or a default, or an answer added), each change with who, when and why; and let a repository declare its family and pin the core, compare the answers it already holds, and settle the owner's answers about those that differ; and take a block of the core down into a member, from its copy of the core, once its owner kept it. Use when a second product of the same family uses the plugin and the user says the repositories belong together ("this app is of the same family as that one", "share the design answers between our products", "make a core for the family", "join our family core", "check our core folder", "lock the source colour for the whole family", "change the family's widths"), or when new or adopt asked whether a repository is of the same family as a core of this machine. Not for a repository that stands alone, and never to push anything.
---

# Build the core of a family

The core is a folder outside every repository of the family. This command reads the first
repository and never writes there; it writes the core only after a person answered the sheet, with
their name and the day. It calls no model and no network, and pushes nothing: making the folder a
repository somewhere is the user's to do, later.

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
a part has a newer shape than this plugin knows (then the plugin must be updated). For a block
store that is not empty it also holds the files: each is there under `blocks/<need>/`, is text, and
is the file the list names by its hash; a need twice, a file missing, a hash that differs and a
file named out of its folder are each named.

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
any member repository and tells no member: tell the user members learn of the change when they next
read the core, which a later slice builds. It commits nothing, even when the core is a repository of
its own: committing and review are the owner's.

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

The copy also holds the files of every block of the core, under `design/core/blocks/<need>/`, each
in the pin with its hash. They are the core's, kept to be taken from: no file of the repository
imports them, and no formatter may rewrite them. The join says so in a line of its own when it
copies a block's files, and writes no ignore line: read that line to the owner, and where the
repository's formatter, lint or type check walks `design/core`, ask before anything is added to an
ignore list.

### A block of the core

`find` offers the blocks of the copy at tier 3, and `/design-assembly:intake` asks the owner which
block answers a need. Once they kept a block of the core, take it down:
`core.mjs --target <repo> --take <block> [--need <key>] [--to DIR] [--dry-run]`, where `<block>` is
the block's need in the core and `<key>` the repository's own need when it is another. It copies
the files out of the copy, fetches nothing, starts the conform record, and says the intake call that
follows. The block lands where the repository keeps its own components, beside the library's
folder; on a repository of the standard floor that call goes through as `intake` prints it, with no
other flag. It ends with `2` and writes nothing on a repository of no family, a copy that cannot be
read, a block the copy does not hold or whose adapters the repository lacks, a file in the way, a
component of the block's name already in the repository, a need the ledger already answers, or a
folder the lint configuration itself sets apart while a decision holds a rule of the lint: then it
names `--to DIR`, a folder the configuration does not name. Run again after the copy was pinned again with a newer block, it
writes the files that changed, refuses to write over a file changed by hand, and leaves the record
to `conform --need <key> --taken-down`.

## 8. The guide on a member

After the guide's step 1 writes the blueprint, run `core.mjs --target <repo> --inherit`. It writes
into the blueprint each answer of the core the guide would ask, marked `inherited` with the pin and
whether it is locked, and prints the guide's questions: `inherited` are not asked, `filled` are
defaults the person may change (with the reason under `changed.<key>`: `why`, `by`, `on`), `asked`
are asked as before. The guide's preview and build print, last, what the core answered and who
settled it when: read that out.

Not built yet: telling a member the core moved ahead of its pin, the line at the start of a
session, putting a block into the core (promotion, a member's report, a proposal upward, retiring
one), leaving a family, renaming a family, and pushing the core anywhere.
