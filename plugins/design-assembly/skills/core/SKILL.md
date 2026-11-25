---
name: core
description: Build the core of a family of products — the answers the repositories of one family share, each locked or a default, in a folder of its own on this machine — from the answers a person settled in the family's first repository, after the person answers the lock-or-default sheet; check the shape of a core folder; let the family's owner change an answer of the core (its value, locked or a default, or an answer added), each change with who, when and why; let a repository declare its family and pin the core, compare the answers it already holds, and settle the owner's answers about those that differ; tell a member that its family's core moved ahead of its pin, show a change before and after on the repository's own screen, and accept it answer by answer; record the family owner's leave to publish the core to a private repository, saying first what would go where; take a block of the core down into a member, from its copy of the core, once its owner kept it; let the family's owner promote a block of a repository into the core on their word, retire an answer or a block, and grant or refuse a member's proposal; let a member propose upward a block it changed or an answer it holds otherwise; let a repository of the family tell the core which needs it answered (its report: key, name and what the block is for, never code), and let a member ask the family's owner that a block another repository has graduate into the family's store; and let a repository leave its family on its owner's word, each answer it inherited becoming its own with its value as it was. Use when a second product of the same family uses the plugin and the user says the repositories belong together ("this app is of the same family as that one", "share the design answers between our products", "make a core for the family", "join our family core", "check our core folder", "lock the source colour for the whole family", "change the family's widths", "did our core change?", "show me what the core changed", "accept the new brand colour from the core", "put our core on a private repository", "take this app out of the family", "this product leaves the family", "put this block into the family core", "propose our change to the core", "retire that answer from the core", "tell the core what this app has", "ask the owner to promote the block the other app has", "which needs of the family wait on a graduation?"), when find or intake said another repository of the family answered a need, when new or adopt asked whether a repository is of the same family as a core of this machine, or when the line at the start of a session said the core moved, a question about it waits, or a locked answer is held otherwise. Not for a repository that stands alone. No script pushes anything: the session creates a repository and pushes only after the person's yes.
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
   files it writes here, and what it writes into the core folder: the line by which the
   repository joins the members, and its report (section 16), printed whole; nothing is written
   yet.
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
   gate holds it. A reason the owner gives in the session goes in with `--why <id>=<reason>`: the
   question is then answered on the sheet as a refusal with that reason, their name and the day,
   so it waits no longer.
   Never answer for them.

A copy of the core that differs from its hashes cannot be read: every move says why, the
repository inherits nothing and its own answers stand, and the gate is red until it is pinned
again with `--join`.

The copy also holds the files of every block of the core, under `design/core/blocks/<need>/`, each
in the pin with its hash. They are the core's, kept to be taken from: no file of the repository
imports them, and no formatter may rewrite them. The join says so in a line of its own when it
copies a block's files, and writes no ignore line: read that line to the owner, and where the
repository's formatter, lint or type check walks `design/core`, ask before anything is added to an
ignore list. The copy holds the reports of the family's repositories too, under
`design/core/members/`: what each answered, by need, name and what it is for, never code. `find`
and `intake` read the family's needs from there, as of the pin.

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

A repository that leaves its family (`--leave`) loses the copy, the blocks' files in it included,
and keeps every block it took in: the block is its own from then on, its row of the intake ledger
is not rewritten (`from: core` and the pin say where it once came from), and the move names each
such block. `find` then prints tier 3 as for a repository of no family.

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
differs it says so and no more: accepting answers leaves the copy's blocks and their files as they
are, and pinning the core again with `--join` is what brings the newer blocks (it takes every
answer of the core as it is now, so say that first).

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

## 12. A repository leaves its family

Only on the word of the repository's owner, in their own words, with their reason. Ask their name
and the reason before you call; both are required and recorded, and the command refuses an e-mail
address in either. No value of the repository changes: leaving turns the marks, never an answer.

1. Preview: `core.mjs --target <repo> --leave --by <name> --why "<reason>" --dry-run`. Show the
   person what it says: the answers that become the repository's own, the files it changes and
   removes here, the questions about the core it takes off the waiting list, the line it takes
   out of the core's `core.json`, and the report of the repository it deletes there
   (`members/<repository>.json`: the family counts the needs of its own repositories). Nothing is
   written yet. Add `--core <folder>` when the machine's
   list does not hold the core, or holds two cores of the family that name this repository.
2. On their yes, the same call without `--dry-run`. It removes `design/sources/core.json` and the
   copy in `design/core`; turns the mark of each row of the decision ledger the core answered into
   `own since <day>, when the repository left its family: <why> (by <name>), once <the mark it
carried>`, the rest of the note staying; turns the blueprint's `inherited` and `changed` into
   `own`, by choice key; takes the check `family-core` off the gate; takes the questions
   `core-<id>-<pin>` that wait off the waiting list, naming each (one the owner already answered
   stays, as the record); and records on this machine that the repository left, so it is not asked
   at once whether it is of a family.
3. Read out what it says of the exports: when they fall behind the ledgers the gate's row of the
   exports is red until the repository writes them again (`make design-exports`). The move writes
   none.

It ends with `0` once the repository left and nothing is left to do, and on a repository of no
family, which is told so and written nothing. It ends with `1` when the repository left and its
line could not be taken out of the core's list of members, because the core folder was not reached,
is of a newer shape, does not hold its shape or cannot be written: say what the command says is
left to do there, by hand, and that `core --check` holds the shape. It ends with `2` and writes
nothing for a missing name or reason, an e-mail address in either, a core named with `--core` that
is of another family, two cores of the family on the machine's list that both name the repository,
a waiting list or a blueprint that cannot be read. A copy of the core that cannot be read does not
stop it: the move then works from the declaration and the marks alone, and says so; a value only
that copy held is then not kept, and the row says so.

A repository that left can join again, the same family or another, with `--join`: its rows are
marked anew, and an exception it once kept is given again. A member of one family is refused a
second until it leaves the first.

## 13. The family's owner promotes a block into the core

Only on the word of the family's owner, with their reason (spec 0016, answer 13): a block they know
the family will share goes in before a second repository needs it, and the store says "no second use
yet". Ask their name and the reason; both are required, and an e-mail address in either is refused.

1. Preview, from the repository the block is used in:
   `core.mjs --target <repo> --promote <need> --core <folder> --by <name> --why "<reason>" --dry-run`.
   `<need>` is the need of the block's row in the intake ledger (a file a row names works too). Show
   what it prints: every file it would write in the core folder, under `blocks/<need>/`, with the
   store's list; the adapters, either named with `--adapter <kind>` (each a kind the repository has)
   or the kinds `components` and `source` the repository has; and that nothing is written in the
   repository.
2. On their yes, the same call without `--dry-run`.

It refuses, writing nothing: a need or a file with no row (say how a block gets one: find, the
owner's yes, `intake --need <need> --file <path>`); a block the repository took from the core (it is
the core's already: a change of it goes up as a proposal, section 14); a piece of the starter kit
(every repository has it); a block of an outside source whose row states no licence line; a need
the core already answers (say: `--replace` replaces its files, and the block's history records who,
when and why); a retired need; a repository that is neither the core's first repository nor a
member; a core of a newer shape, one that does not hold its shape, or one inside a repository.

A block of an outside source whose source states a licence line ends with `1` and writes nothing:
read the line out to the person, word for word, and ask whether it allows passing the block's code
on to the family's other repositories. Only on their yes, call again with `--licence-allows`; the
store records the line, who said so and when. On a no, the block stays in that repository alone.

Members learn of the block as of any change of the store: `core --moved` names it, and `core
--join` pins it; a member then finds it at tier 3 and takes it down with `--take` (section 7).

## 14. A member proposes a change upward

When a member holds something otherwise and the person wants the family to follow: a block it took
from the core and changed, or an answer it holds as an exception or as a changed default. Ask their
name and the reason.

`core.mjs --target <repo> --propose <id> [--block] --by <name> --why "<reason>" [--core <folder>]
[--dry-run]`: `<id>` is the answer's id, or with `--block` the block's need (the core's, or the
repository's own). Preview first with `--dry-run`, and show what it writes: one file
`proposals/<id>.json` in the core folder, with the value and the reason, or the block's files as
the repository has them under `proposals/<id>/`. Nothing of the repository is written: its exception
stands while the proposal waits, and its gate is as it was. A locked answer held otherwise with no
exception is refused: record the exception first (`core --settle --why <id>=<reason>`). The same
proposal made again is said once; another about the same thing while one waits is refused. A core
the machine cannot reach means nothing is written: say so, and offer `--core <folder>`.

The family's owner sees what waits with `core.mjs --proposals --core <folder>` (it ends with `1`
while one waits), and the first line of a session in a member says a proposal waits. On the
owner's word, with their reason:

- `core.mjs --grant <id> --core <folder> --by <name> --why "<reason>"`: an answer is changed as
  `--change` changes it, a block's files replaced as `--promote --replace` replaces them; each
  records who, when and why, naming the proposal. Members learn of it at their next look.
- `core.mjs --refuse <id> --core <folder> --by <name> --why "<reason>"`: the proposal keeps the
  refusal and the reason, the core does not change, and the member is told at its next look
  (`core --moved`, `status`).

### A block another repository has: asking that it graduate

When `find` or `intake` in a member said `in the family, not in its store yet`, another repository
of the family answered the need and the family's store does not hold it (spec 0016, answer 6). The
step before a block is made or taken from outside is a question to the family's owner. Say what
was printed (which repository, the block's name, what it is for), and ask the person for their
name and why the repository needs it. Never copy the block from the other repository: the core is
the only way between two.

`core.mjs --target <repo> --propose <need> --graduate --by <name> --why "<reason>" [--core <folder>]
[--dry-run]`, where `<need>` is the need as the other repository keys it, which `find` printed.
Preview first. It writes one file `proposals/graduation-<need>-<n>.json` in the core folder, naming
each block that answers the need in the family by repository, name and what it is for: no code, no
path, no value. Where two repositories answered the need in two ways it lists both, and asks the
owner to choose one. It writes nothing and ends with `2`, saying why, when the family's store
holds the need already (pin it: `core --join`), the core retired it, no other repository answered
it, the owner refused that block before, or this repository lacks an adapter a block of code needs;
asked again while it waits, or once it was granted, it says so and writes nothing.

The family's owner sees it with `--proposals`, and answers on their word, with their reason:

- `core.mjs --grant <id> --core <folder> --by <name> --why "<reason>"`, with `--choose <repository>`
  where the proposal names two blocks. It records the yes, who, when, why and the block chosen,
  and promotes nothing: it prints the exact call to run in the repository that has the block,
  `core --promote <need> --core '<folder>' --by '<name>' --why 'granted <id> of <repository>:
<reason>'` (section 13), each word in single quotes so it runs as printed whatever a name or a reason holds.
  Read that call to the owner and run it there on their word. Until then
  `--proposals` ends with `1` and says the promotion is owed.
- With `--from <folder of the repository that has the block>` the same call promotes at once, by
  the owner's name and reason given there, and never without them. Offer it when that repository is
  on this machine. A block that came from an outside source still waits on its licence line: the
  call ends with `1`, answers nothing, and is run again with `--licence-allows` only on the
  person's yes (section 13); `--adapter <kind>` names the adapters as for a promotion.
- `core.mjs --refuse <id> ...` keeps the refusal with its reason; that block is not proposed again
  for that need.

The member that asked is told at its next look (`core --moved`, `status`). Once the block is
promoted it pins the store (`core --join`), finds the block at tier 3 and takes it in (section 7);
`core --report` then tells the core it uses the block, and the store's entry says a second use. A
repository whose block was not chosen keeps its own, untouched, and is told of the choice at its
next look.

`status` in a member says, on its periodic line, how many needs of the family wait on a
graduation and which: one asked and not answered, one granted and not promoted yet, and one two
repositories answered in two ways that nobody asked about. Where the core's folder cannot be
looked at it counts from the copy and says so.

## 15. The family's owner retires an answer or a block

Only on the word of the family's owner, with their reason.
`core.mjs --retire <id> [--block] --core <folder> --by <name> --why "<reason>" [--dry-run]`. Preview
first. The answer leaves `answers.json`, or the block leaves `blocks/index.json`, and is kept whole
in `retired.json` with who, when and why; a block's files stay where they were. Nothing is deleted
from the record, and nothing of a member is written.

A member is told at its next look (`core --moved`, `status`, `inventory`): who retired what, when
and why. Nothing changes there until a person accepts: `core --accept <id>` (or `--accept-all`, or
pinning again with `--join`). Then an answer it inherited becomes its own, its row's note beginning
`own since <day>, when the family core retired it: <why> (by <name>), once <the mark it carried>`,
and a choice of its blueprint likewise under `own`; a block it took in stays where it is, its row of
the intake ledger gaining `own`; a block it never took only leaves the copy, and tier 3 no longer
offers it. No gate turns red. Read out what it says of the exports.

## 16. A repository tells the core what it answered

The report of a repository is one file of the core folder, `members/<repository>.json` (spec 0016,
criterion 12): for each block the repository answered itself, the need's key, the block's name and
what it is for, as its row of the intake ledger says; and, under `uses`, the needs of the core
whose block it took in. Nothing else: no code, no text of a file, no path, no hash and no value.
The other repositories of the family read it from their copy of the core, so `find` and `intake`
there say when one of them needs what this one has.

`core.mjs --target <repo> --report [--core <folder>] [--dry-run]`. Preview first, and show the
person the file: the command prints it whole before it writes it. It writes in the core folder
only, never in the repository, and nothing at all when the core's folder cannot be reached: it
then ends with `2` and says so, and the repository goes on as it is. Where the report tells a use,
it first writes the name of the repository into `used_by` of that block in the store's list, and
says when that is the block's second use. Where the intake ledger is gone or cannot be read, it
reports nothing, leaves the report the core holds as it is, and says what could not be read: mend
the ledger first. It says each row it left out, with why: a row with no
`description` (ask the person for the sentence and add it to the row), a row retired or merged, a
piece of the starter kit, a block the core retired that the repository keeps as its own.

- Joining and pinning again (`--join`) write the report too, and print it first.
- Taking a block in (`intake`) never writes in the core folder: it says the core is not told yet,
  and names this move. `core --moved` and `status` say when the report is behind the intake
  ledger.
- Leaving (`--leave`) deletes the report with the member's line; where the core cannot be
  reached, it says what is left to do there by hand.
- The first repository of a family, which joins only when its owner says so, reports without
  joining: the same call with `--core <folder>`. Nothing of it is written, and it declares
  nothing.

Not built yet: moving to another family in one step, dissolving a family, and renaming a family.
