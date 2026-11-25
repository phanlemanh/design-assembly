---
name: core
description: Build the core of a family of products — the answers the repositories of one family share, each locked or a default, in a folder of its own on this machine — from the answers a person settled in the family's first repository, after the person answers the lock-or-default sheet; and check the shape of a core folder. Use when a second product of the same family uses the plugin and the user says the repositories belong together ("this app is of the same family as that one", "share the design answers between our products", "make a core for the family", "check our core folder"). Not for a repository that stands alone, never to write into a repository of the family, and never to push anything.
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
a part has a newer shape than this plugin knows (then the plugin must be updated).

Not built yet: a repository declaring its family and pinning the core, inheriting its answers in
`new` and `adopt`, the gate holding locked answers, the blocks of the core, and pushing the core
anywhere.
