# The contract: one shape per ledger

Everything about a repository's design lives in a set of ledgers. Each answers one question, has
one writer, and has one shape that every tool reading it can rely on: this plugin, the acceptance
kit that grades each feature, and the agent that builds the next screen.

The shapes are stated once, as data, in `templates/tools/design-assembly/contract.mjs`. This page
says the same in words. A test fails when the two disagree.

## Versions

A ledger that carries `version` says which shape it has. A tool that knows shape N reads every file
of shape N or older. A tool that finds a newer shape writes nothing, and says to update the plugin:
an older plugin never rewrites what a newer one wrote. The token file and the pages of screen kinds
carry no version, because their formats belong to a standard and to the acceptance kit.

The gate holds the shapes through the `ledger-shapes` row: every ledger present, and every page of
a screen kind, must have its shape.

## The ledgers

| Ledger         | File                             | Question                                                            | Writer                                     | From birth  | Shape |
| -------------- | -------------------------------- | ------------------------------------------------------------------- | ------------------------------------------ | ----------- | ----- |
| `decisions`    | `design/decisions.yaml`          | What the repository decided, and what holds each decision           | People, and the guide for its own rows     | yes         | 1     |
| `blueprint`    | `design/blueprint.json`          | What the person answered, layer by layer                            | The person, through the guide              | first entry | 1     |
| `tokens`       | `design/tokens.json`             | Which values exist                                                  | `make design-tokens`                       | yes         | none  |
| `components`   | `design/component-registry.json` | Which components exist, where, and of what                          | `make design-components`                   | yes         | 2     |
| `column-types` | `design/column-types.json`       | Which column types the repository has                               | A person                                   | yes         | 1     |
| `columns`      | `design/columns.json`            | How each column type is aligned and sized, and each field's type    | `make design-columns`                      | first entry | 1     |
| `states`       | `design/states.json`             | Which states every screen declares, and which are excused           | A person                                   | yes         | 1     |
| `screen-sizes` | `design/screen-sizes.json`       | The widths every page is checked at                                 | A person                                   | yes         | 1     |
| `parts`        | `design/parts.json`              | The parts of the code from the top down                             | A person                                   | first entry | 1     |
| `screens`      | `design/screens.yaml`            | Which screens exist, of which kind, with which states               | A person or an agent, with each new screen | yes         | 1     |
| `intake`       | `design/intake.yaml`             | Which need got which block, from where, approved by whom, when      | The round that takes the block in, once    | first entry | 1     |
| `sources`      | `design/sources/<id>.json`       | Which outside libraries and fonts come in, at which pin             | A person, the pinning tool, `font-source`  | first entry | 1     |
| `conform`      | `design/conform/<need>.json`     | What an outside item brought, how it was conformed, what is let off | A person, until the conform command        | first entry | 1     |
| `screen-kinds` | `design/patterns/<kind>.md`      | How a screen of each kind is built                                  | A person                                   | first entry | none  |

### decisions

Block-style YAML: `version`, then `decisions`, a list of rows. A row has `id`, `layer`, `kind` (one
of `standard`, `formula`, `closed`, `judgment`) and `source`, and may have `check` (written
`test:`, `e2e:`, `tool:` or `eslint:` and a target) and `note`. No other key. What each row means
is in `checks.md`.

In a repository of a family, the note of a row whose id is an answer of the core it pinned begins
with a mark (spec 0016): `inherited from the family core at <pin>`; `changed from the family core
at <pin>: <why> (by <name> on <day>)`, for a default the repository holds otherwise; or `kept
against the family core at <pin>: <why> (by <name> on <day>)`, for a locked answer it keeps as an
exception. `<pin>` is the first twelve hexadecimal digits of the hash of the core's answers as the
repository copied them. Whatever else the note says follows after `; `. A judgment the core
answers, and every row the core adds, also ends with `answered by <name> on <day>`, as the decision
sheet writes an answer: the family's owner, or the person who gave the reason. A row with no mark
reads as before; a row the core has and the ledger lacks is added with its mark and no check, inherited and
not held until a check of the repository holds it. A question of the waiting list about a locked
answer the repository holds otherwise, `core-<id>-<pin>`, waits no longer once the row carries the
`kept` mark against that pin: `core --settle` answers it as the decision sheet would, a refusal
with the reason, the name and the day of the mark, and no reader counts it as waiting.

Once the repository left its family (`core --leave`, spec 0016, criterion 25), each such mark is
turned, and no value changes: the note begins with `own since <day>, when the repository left its
family: <why> (by <name>), once ` and then the mark the row carried, word for word (`inherited from
the family core at <pin>`, `changed from the family core at <pin>: <why> (by <name> on <day>)` or
`kept against the family core at <pin>: <why> (by <name> on <day>)`). `<day>` is the day it left,
`<name>` who said so and `<why>` their reason; the pin says where the answer once came from, and
the note never names the family. Whatever else the note says, the `answered by` of a judgment
included, follows after `; ` as before, so the row stays a person's answer. An exception and a
changed default keep their reason and mean nothing more: the answer is the repository's own. A row
the core added stays, with this mark; where its `source` was `design/sources/core.json`, because
only the copy held its value, the `source` becomes that value. The guide keeps the mark on a row it
writes again. A repository that joins a family again has its new mark written in this one's place.

Once the family core retired an answer and a person accepted the retiring (`core --accept <id>`, or
`core --join` pinning again; slice 3 of item 7.2, criterion 24), its row is turned the same way, and
no value changes: the note begins with `own since <day>, when the family core retired it: <why> (by
<name>), once ` and then the mark the row carried, word for word. `<day>` is the day it was accepted,
`<name>` and `<why>` who retired it in the core and the reason, as the core's `retired.json` gives
them (where the core's folder records no retiring: `no one the core names` and `the core's folder
does not say why`). Every other row keeps its mark. Both forms are read as no mark of a core.

### blueprint

`version`, `layers` (one entry per layer, with its status and the choice), and the guide's own
keys: `status`, `depth`, the language of the conversation, an approval note. Other keys are kept.

In a repository of a family, a layer may also say `inherited`, by choice key, `{ pin, hold }`: the
choice is the answer of the core it pinned, locked or a default, so the guide does not ask it; and
`changed`, by choice key, `{ why, by, on }`: a default of the core the repository holds otherwise,
and why. A blueprint without them reads as before.

Once the repository left its family, a layer says neither: it says `own`, by choice key, `{ since,
by, why, once }`: the day the choice became the repository's own, who said the repository leaves
and why, and what the choice once was, `inherited` (then also `pin`, and `hold`) or `changed` (then
also `pin`, and `changed`, the reason it carried: `why`, `by`, `on`). No choice changes. A choice
once inherited stays a person's answer: where the layer is not the owner's as a whole, its key is
listed under `confirmed` and `answered` says who settled it, the family's owner as the core
recorded it, or the person leaving where the copy could not be read. A choice inherited again loses
its entry under `own`. The choice of an answer the core retired, once accepted, is turned the same
way, and its entry under `own` also says `how: "retired"`, with who retired it in the core and why;
every other choice keeps its mark.

### tokens

The Design Tokens Community Group format. Groups nest as deep as a group needs; a token has
`$type` (one of `color`, `dimension`, `fontFamily`, `fontWeight`, `number`, `duration`, `shadow`,
`typography`, `string`) and `$value`, and may have `$description` and `$extensions`.

A colour's `$value` is hexadecimal, `#rrggbb`, or `#rrggbbaa` when it has an alpha. That is the one
form every reader takes: the acceptance kit's gate compares colours as hexadecimal and refuses a
file without any, and its coverage measure reads an object value as a token made of several. The
colour as the stylesheet writes it, in whatever notation, is kept under
`$extensions["design-assembly"].css`, and its dark value under `.dark`.

### components

A JSON object with exactly two keys, `version` and `components`: the acceptance kit refuses any
other. `version` is a string. Each entry is one exported component:

- `name`, `category` and `file`: the component, what it is, and where.
- `level`: `atom`, `molecule`, `organism` or `template`. Computed, never declared: how deep the
  file imports other components (none an atom, one step a molecule, two or more an organism). A
  component in a folder named `templates`, or one a page of a screen kind names as the frame of
  its screens, is a template.
- `source`: `library` for the folder of a component library (the library's own, and the folder of
  each other registry its settings name), `own` for the repository's own components beside them.
- `parts`: the other components of its file it is drawn with: those the file defines, and those it
  imports and exports again.
- `props`: the props its signature names one by one, in that order, by the name a caller writes;
  not `className`, `children` or a variant axis.
- `variants`: each written `axis=value`, and `defaults`, the default of each axis.
- `control` and `min_height`: a component a person activates, and the smallest height its own
  classes declare, written in `px`.

No other key. A file of shape 1 had no `level`, `source` or `parts`, and still reads.

### column-types, columns, states, screen-sizes, parts

`column-types`: `version`, `padding_ch` and `types`. `columns`: the same with `fields`. `states`:
`version`, `required` (a list of state names) and `exempt`. `screen-sizes`: `version` and `widths`
(numbers). `parts`: `version` and `parts`, each with a `name`. What each holds is in `checks.md`.

### screens

Block-style YAML: `version`, then `screens`, a list. A screen has `id`, `route` (written from `/`),
`title` (the key of its title among the repository's words, or null), `family` (the `nhom` of the
page of its kind, or null), `status` (`built` or `planned`), and may have `audience` and `states`,
the names of the states it shows. Beside the screens the file may name `families`, `audiences` and
`statuses`. A screen may also have `sizes`, the widths it is checked at when they are not the ones
of `screen-sizes` (whole numbers). A repository may keep keys of its own, on a screen or beside the
screens, such as who may open it: they are its extension, and are read without complaint.

Three more keys of a screen join the ledger with the repository's domain model: `shows`, the
entities it shows; `entry`, the action a role must hold to open it, or null for every role; and
`actions`, the actions it has buttons for. Every name is one of the repository's own `ontology/`.
Beside the screens, `frame` says the same (`shows`, `actions`) for the frame around every screen;
`no_screen` lists each action that has no screen, as `{ later: <where> }` or
`{ never: <reason>, decided_by: <the person> }`; and `keys` gives the repository's own spelling of
these keys, such as `{ entry: vao, actions: nut, frame: khung }`. Once a screen declares any of
them and the repository declares actions, the gate holds that every action is offered to every role
that may run it, that no screen shows a record to a role that may not view it, and that no button
is one no role that opens its screen may press. What the model or the ledger plans for later is
listed on every run.

A repository may keep this ledger as a folder instead of one file, so that two changes that each
add a screen write two files and never meet in one. The folder is the ledger's path without its
ending, `design/screens`: each screen is `design/screens/<id>.yaml`, the keys of that screen at
the left margin, and everything that is not a screen (`version`, `families`, `audiences`,
`statuses`, `frame`, `no_screen`, `keys`, the repository's own keys) is in
`design/screens/_shared.yaml`. The data is the same, so the shape and its version are the same.
Every reader takes both for good: the folder when it holds `_shared.yaml`, else the one file; a
folder of that name without `_shared.yaml` is not a ledger. The screens are then read in the
order of their ids. A file's name is the id inside it, so two screens with one id cannot both be
there; the gate fails on a file named otherwise, on a file without the shape of a screen, and on
the one file kept beside the folder. It is the repository's choice, off until asked for:
`node tools/design-assembly/screen-fragments.mjs --split` cuts the one file, `--join` takes that
back, and `--print` gives the ledger as one text; `checks.md` says what each does. A repository
whose own readers still need the one file may also keep it as a copy (`--copy`): derived from the
folder, out of git, never a second source.

The ledger says what there is; the code that lists the screens says how each state is reached. The
gate holds that both list the same built screens, that no id or route is listed twice, and that
each family is the kind of a page; the screen checks read the states from the ledger. The
repository's own test, installed once, reads both while the code runs and holds that each screen's
title and states are the code's, so states built by a function are read too.

### intake

Block-style YAML: `version`, then `blocks`, a list: one entry per block the repository took in. A
block has `name` (what it is), `file` (where its code is), `source` (the name an outside library
gives it, or that it was made by hand), `need` (the need it answers, a key in small letters and
dashes) and `approved` (the day it was approved, `YYYY-MM-DD`), and may have `pin` (the version of
the source it came from), `description` (the need in one plain sentence), `record` (the record of
the round that took it in) and `approved_by`. A repository may keep keys of its own on a block or
beside the blocks. A need has one answer, so the gate fails when two blocks name one need.

A repository that already spells these keys its own way says so beside the blocks under `keys`,
such as `{ blocks: <its list>, need: <its key>, approved: <its key> }`: every reader then takes the
ledger in the contract's keys, and the gate names a key both ways when it is missing.

Like the screens, the ledger may be kept as a folder, `design/intake`: each block is
`design/intake/<need>.yaml`, and the rest, `keys` included, is in `design/intake/_shared.yaml`. The
name of a block's file is its need, so one need with two answers cannot both be there. A block is
written by one round, once, its approval included, so each file has one writer.
`node tools/design-assembly/screen-fragments.mjs --ledger intake` takes every flag the screens take,
and `checks.md` says what each does.

A block may also say, for the reusable store: `from`, the id of the pinned source it came from,
which a repository with one source may leave out; `taken`, the `sha256` of its file when it was
taken in; `changed`, `{ on, why }`, when the repository changed it on purpose since, and since
spec 0015 maybe `by`, who answered, and `sha256`, the hash of its file as changed, which `change
--widen` writes and the inventory holds the file to; `retired`,
`{ on, by, why }`, when it was retired; and `merged_into`, the need whose block took its place.
Beside the blocks, `before` lists what the repository made before it kept this ledger, each with
`name` and `why` and maybe `file` and `record`; and `values` says how the repository writes a value
of the contract, today one: `{ by-hand: <its word> }` for the source of a block made by hand, which
the contract writes `by-hand`. Every one of these keys may be spelled the repository's way under
`keys`, `why` included. All are optional, so the shape stays 1: an older tool reads them as keys of
the repository's own.

A block taken from an outside source since spec 0015 also says `conform`: the path of its conform
record, `design/conform/<need>.json`, which holds the hash of every file of the item after
patching. Optional like the others: a block written before it still reads, and `intake` asks for
the record only when it writes a new row for an outside item.

A block taken from the family core the repository pinned (spec 0016, slice 1 of item 7.2) is
written as a block of an outside source is, and names the core as where it came from: `from` is
`core`, the id of the declaration; `source` is the block's need in the core, the key the core's
store keeps it by; `pin` is the pin of the core it was taken at, the twelve digits; `taken` is the
`sha256` of its file as taken in; and `conform` is the path of its conform record, which holds the
hash of every file of the block as taken down and after patching, and the hash that names the
block in the copy. `need` is the repository's own need, which may be another key than the core's.
No key is new, so the shape stays 1.

Once the family core retired such a block and a person accepted it (`core --accept <need>`, or
`core --join` pinning again), the block stays where it is, as the repository's own, and its row
gains `own`: `since` (the day it was accepted), `by` and `why` (who retired it in the core, and the
reason the core gives). `from: core` and `pin` stay, and say where it once came from; the block is
then compared with no core. Optional, so the shape stays 1.

Once the repository left its family (`core --leave`), such a block stays where it is, as the
repository's own, and its row is not rewritten: `from: core` and `pin` then say where the block
once came from, and at which pin of the core of the family the repository was of; they name no
core the repository holds, and the block is compared with none. Its conform record stays too, and
still holds its files after patching, so a change made by hand is still seen. The move that leaves
names each such block; the inventory says it is compared with no core.

A block made by hand since slice 5 of that spec also says `searched`, the words `find` was asked
with, and `nearest`, the nearest thing the stores gave for them, nearer store first: a name the
repository's own store, a pinned catalog or the starter kit holds, or `none` when nothing answered.
`intake` writes both. The gate holds them on a row made by hand that a branch writes, against where
it left the main branch, so a row written before reads as before; the same check names a component
file the branch adds with no row and no entry under `before` (`checks.md`, `choose-first`).

A piece of the starter kit the guide's build lays gets its row as the build writes it, as `intake`
writes one for a piece it copies: `source` and `from` are `starter`, `pin` is
`design-assembly <version>`, `taken` is the hash of the file as laid, and `approved` is the day of
the build, with no person named, since the owner's go-ahead to build is the approval and no question
is asked for the piece. The build also writes the row for a piece a build laid before it wrote rows,
while its file is still as laid and the branch adds it; a piece the main branch has stays as it is. It writes none for a piece a row or `before` already names, nor for
a file the repository has edited, which the gate then holds as any file the branch adds.

### sources

One file per pinned source, `design/sources/<id>.json`, so that pinning one source again writes
that file alone; there is no single-file shape. A source has `version`, `id` (small letters and
dashes, the name of its file) and `catalog` (the path, in the repository, of the list of what it
offers), and may have `title`, `order` (a number: sources are looked through the smallest first,
then by id) and `licence` (what taking an item in needs, in a sentence, never a key), and `install`,
how one item is taken in, with `{name}` where its name goes. It names its pin in one of two ways: as
`pin`, or as `pin_file`, the path of a file the repository already keeps it in: the pin itself, or
a catalog that keeps its own pin under `pin`, so a repository that pinned a catalog in that shape
points both `pin_file` and `catalog` at it. A pin holds the
`files` the source was read from, each with `file` and `sha256` and maybe `url` and `bytes`, and
maybe `fetched_at`; or a `version`. `snapshot` names the folder those files are kept in. Since
spec 0015 a source may also declare `folder`, the folder of the repository its items' files are
installed into: once it does, the gate names a file there that the code imports and that no
conform record of an item taken in lists, and the file an older row of the intake ledger names
counts as taken in. Optional, so a source written before it reads as before, and says nothing to
the gate. Since slice 4 of that spec a source may declare `ladder_place`, where it stands on the
ladder `find` and `intake` walk: `before-starter`, read right after the repository's own store and
before the starter kit and the family's store, or `after-family`, after them, where a source that
declares nothing stands; and `plug`, the id of the plug of the capability table it is, when its own
id is not the plug's. Both optional: a source written before reads as before. Keys of the
repository's own are kept.

A catalog lists `items`, or keeps them in `groups`; an item has `name`, and may have `kind`,
`title`, `description`, `group`, `category` and `page`; an item of a group takes the group's
`kind`, `group` and `category`, and its `base` as its page. A catalog holds no code.

No tool of this plugin fetches. Each reader compares the files of the snapshot with the hashes of
the pin: a source whose snapshot differs, whose pin file or catalog cannot be read, or of a newer
shape, is unreadable, says why, and offers nothing. A source pinned by a version has no snapshot to
compare, and says so. Whether a catalog is kept in git is the repository's choice, as with every
derived file.

A source of the kind `core` is the family the repository declared it is of, and the core it pinned
(spec 0016, answer 4): `design/sources/core.json`, id `core`, since a repository is of one family.
It offers no block of a library: its `catalog` names the copy's list of blocks, so a tool older
than the kind reads it as a library that offers nothing. It has `family`, the name the core gives;
`snapshot`, the folder of the repository its copy of the core is kept in, `design/core`, holding the
core's `core.json`, `answers.json` and `blocks/index.json`; `pin.files`, each file of that copy with
its `sha256`, and maybe `pin.taken_on`, the day it was copied; and `joined`, who said the
repository is of the family and when (`by`, `on`). Every reader compares the copy with the hashes
first: a copy that differs, a file missing, a part of a wrong or newer shape, is unreadable, says
why, and the repository inherits nothing; its own answers stand. The gate, where it holds the core's
locked answers, says so in red. `core --leave` removes this file and the copy, the files the pin
lists and the three parts and nothing else of that folder, whether the copy can be read or not; the
check `family-core` and the questions about the core that wait on the owner (`core-<id>-<pin>`) go
with them, and the repository reads as one that declares no family.

Since slice 1 of item 7.2 the copy also holds the files of every block of the core, each where the
core keeps it, `design/core/blocks/<need>/<file>`, byte for byte, and `pin.files` lists each with
its `sha256` beside the three parts: a member takes a block from its own copy, at its pin, on any
machine, with the core folder out of reach, and a file of a block changed in the copy makes the
copy unreadable like any other. The copy is the core's, not the repository's code: nothing of the
repository imports from it, and a formatter or a lint that walks the whole repository must leave
it as it is. A copy pinned before that holds the list of blocks and no file of a block: it still
reads, the block is not offered, with why, and pinning again with `core --join` brings the files.

Since slice 2 of item 7.2 the copy also holds the report of every repository of the family, each
where the core keeps it, `design/core/members/<repository>.json`, byte for byte, and `pin.files`
lists each with its `sha256`: names only, never code. `find` and `intake` read the family's needs
from these, so a repository gives one answer on every machine, with the core folder out of reach;
they know a need another repository answered as of the pin, and pinning again brings the newer
reports. A copy pinned before that holds no report: it still reads, and no need of the family is
said. The repository's own report in the copy is the one written when it pinned.
The pin a member is named by stays the first twelve hexadecimal digits of the hash of
`answers.json`: a block that changes moves the hash that names that block (see `conform`), not the
pin.

The core's folder may move ahead of the pin: its `answers.json` is then not the one copied. Nothing
of the repository follows by itself. A person accepts the change, one answer or all (`core
--accept`), and the copy then holds the core's answer for each one accepted and its earlier one for
each one left, in the core's order; an answer the core no longer holds stays in the copy until its
retiring is accepted. The pin is the hash of that copy, so it moves with every acceptance, and when
nothing is left the copy is the core's `answers.json` byte for byte and the pin is the core's own.
The row then has `accepted`, the last acceptance: `by` and `on` (who accepted, and when), `answers`
(the ids taken), `core` (the first twelve hexadecimal digits of the hash of the core's answers
then) and `left` (the ids that changed and were not taken, empty when the copy is whole);
`pin.taken_on` is that day. A row with no `accepted` reads as before. Accepting writes no value of
the repository: a locked answer it then holds otherwise becomes a question on the waiting list, as
on joining, and a default it holds otherwise stays, its row marked `changed` with the reason. The
copy's list of blocks and the files of its blocks are left as they were copied, each with its
entry of `pin.files`: pinning the core again with `core --join` is what brings the newer blocks.

A source may say its `kind`. One other kind has a meaning here, `font`: a typeface the product uses that
is neither the floor's nor the system's. A source with no `kind`, or with a word of the
repository's own, is a library as above, and is read as before. A font has `version`, `id`,
`kind` and `family` (the name a stylesheet calls it by), and no `catalog`: it offers no block. It
may have `title`, and `variable`, the CSS variable a font loader of the build sets for it, which a
stylesheet then names instead of the family. Two things are required of it:

- its `pin`, held in the row itself, never in a `pin_file`: either `package` and `version`, the
  package the font comes in and the version the repository's lockfile pins it at; or `files`, each
  font file by its path from the repository's root (`file`) with its `sha256`, and maybe the
  `weight` it holds (`400`, or a range as `100 900`) and its `style` (`normal` or `italic`). Where
  a font comes from is what its pin names.
- its `licence`, the licence the font is used under, in a person's words. No tool writes it.

A row a command wrote says so under `proposed`: `by`, the command, and `on`, the day. Such a row
has its pin and may still lack its licence; it is then not held, the font cannot be chosen, and
`status` asks for the licence. Once a person writes the licence the row is held like any other, and
`proposed` stays as the record of where the row came from. `own: true` says the repository loaded
this font before the row was written: its own font, kept as found.

The gate fails on a font row with no pin, and on one with no licence that no command proposed;
the sentence names the row and what is missing. A typeface chosen from the ledger is held further:
the gate fails when its row is gone, loses its licence, or pins what the repository no longer has
(the lockfile pins another version, a file has another hash). The pin of a font nobody chose is
compared by the readers that name it, the handoff book and `status`, not by the gate.

A source of the kind `icon-set` is the icon set the product uses (spec 0017; the ledger stays at
version 1). It has `version`, `id` and `kind`, and no `catalog`: it offers no block, and `find` and
`intake` look for none in it. It may have `title`; `module`, the module the code imports icons
from, which is the package where the set is one; `folder`, the folder of the repository its own
icon files are kept in, where the set is the repository's own files; `sizes`, the sizes in pixels
the product draws icons at, as a list of numbers; and `stroke`, the stroke width of a set drawn in
strokes, a number. A person answers `sizes` and `stroke`; no tool writes them, and none holds them
yet. Two things are required of it, as of a font:

- its `pin`, held in the row itself: either `package` and `version`, the package and the version
  the repository's lockfile pins it at; or `files`, each icon file by its path from the
  repository's root (`file`) with its `sha256`.
- its `licence`, the licence the icon set is used under, in a person's words. No tool writes it.

`proposed` and `own` say what they say of a font: a row `icon-source` or `adopt` wrote has its pin
and waits on its licence, unheld, and `status` asks for the licence; `own: true` says the
repository used the set before the row was written. `icon-source` writes the row from a package the
lockfile pins or from a folder of the repository, each file hashed where it is; it fetches and
installs nothing and never writes over a row, nor writes a second row for a package a row pins.
`adopt` proposes the row of the set the component library's settings name, where the lockfile pins
its package, and writes over nothing. Neither writes a row of the kind, nor lays its check, on a
repository whose own copy of the tool predates the kind (its `sources-ledger.mjs` names no
`ICON_SET_KIND`): that gate would read the row as a library with no catalog. They say to bring the
tool up with `upgrade` first, and what would then be proposed.

The gate fails on an icon set row with no pin, and on one with no licence that no command proposed.
Once the repository has a row of the kind, the check `icon-set-pin` is laid under the row that holds
the ledgers' shapes (by `icon-source`, `adopt` or `upgrade`), and the gate fails when an icon set
pins what the repository no longer has: the lockfile pins another version or does not pin the
package, or a file is gone or has another hash. The sentence names the row. A repository with no
row of the kind has no such check and reads as before.

A source of the kind `logo` is the mark of the product (spec 0017), from files the repository
already keeps. It offers no block of a library, so it has no `catalog`, and the readers of
libraries leave it out. It has `version`, `id` (`logo` unless a person gives another), `kind` and
`pin`, and may have `title`, the name of the product the mark stands for. Its `pin` holds `files`,
each file of the mark by its path from the repository's root (`file`) with its `sha256`, its `role`
and its `variant`, each one word: the role is what the file is for, `mark` (the symbol alone),
`wordmark` (the name drawn as letters), `lockup-horizontal` or `lockup-vertical` (the two side by
side, or one above the other), `favicon` (the icon a browser shows for the page) or `app-icon` (the
icon of the installed app); the variant is how it is coloured, `color`, `mono` (one colour) or
`inverse` (drawn for a dark ground). A file is named once. Its `licence` says, in a person's words,
who holds the right to use the mark and where it may be used; no tool writes it. As with a font, a
row a command wrote says so under `proposed` and is not held until a person writes the licence;
`own: true` says the repository kept these files before the row was written; and `made`, `by` and
maybe `on`, may say who made the mark (a person's hand, or a plug) and when. The version of the
ledger stays 1.

`logo-source` writes the row from files named with their role and variant, hashed where they are;
it draws, fetches and changes no file, and never writes over a row. `adopt` proposes the row from
the icons the pages declare, as the adapter of the build reads them. The gate fails on a logo row
with no pin, a file without its role or variant or named twice, and one with no licence that no
command proposed. Where the repository has a logo row, the check `logo-pins` beside the shapes of
the ledgers fails on a file of its pin changed by one byte, gone, or led out of the repository; the
sentence names the row. Beside it, the check `logo-use` fails on a page icon the build declares, and
on an image the app frame shows, that no logo row pins: the adapter of the build says where page
icons are declared and which files are the frame (the files right under `src/` on one build; the
layout files of the app router and the modules of the repository they import on the other), and an
image is one the frame imports by a path, or names by an address from the root of the site served
from the public folder. `logo-source --into ID` adds files to a row already there, each hashed where
it is, and changes nothing the row pins or says. A new logo row, or a changed file of one, is the
owner's call: the waiting list asks it with the item `logo:ID`, and the wall `owner-calls` holds the
branch until the owner keeps it. What a mark lacks (no one-colour variant, no page icon), and an
icon set with no sizes, `status` and `audit` say without turning the gate red; the handoff book
shows the rows on a page of brand assets. The foundations layer chooses the mark: `text`, the floor's, the product's
name in the heading typeface with no file made, which a blueprint that names no mark reads as; or
`source:<id>`, a logo row, chosen only when it is held and its pin holds. The row the guide writes
for a chosen row, `mark`, is held by the check `logo-row`.

### conform

One file per need, `design/conform/<need>.json`, for an item of an outside source that was taken
down for that need and conformed before it is taken in (spec 0015). It has `version`, `need` (the
name of its file), `source` (the id of the pinned source) and `item` (the item's name in the
source's catalog); since the conform command, `pin_sha256`, not required, the hash of the source's
pin as the item was last taken down; and four lists, each required and each allowed to be empty but the first two:
`taken`, every file the item brought, each with `file` and its `sha256` as taken down; `conformed`,
the same files with their `sha256` after patching; `patches`, each change made to the item's code,
with `file` and `reason`, and since the conform command `diff`, the unified diff from the file before
the change to the file after it, applied in order from the file as taken down; and `exemptions`, each
rule the item is let off, with `rule`, `file` and `reason`. An exemption whose `rule` is one of
`formatter-ignore`, `lint-config` or `typecheck-exclude` lets the item's whole folder off, and its
`file` is the configuration file that does it, not a file of the item. A record written by hand
before the conform command, its patches with no `diff`, still reads: the command says each such patch
cannot be applied again until it is recorded with `--patch`. With `--taken-down`, a file that is
neither as taken down nor after patching is taken for a newer item only when the source's pin is no
longer the one `pin_sha256` holds; otherwise it is a hand edit, and the command refuses it, naming
the file. Run under a pin `pin_sha256` does not hold, it records the pin even when nothing is newer,
and the plain check says when the record's pin is behind the source's. The gate fails when a part is missing, when `taken` names no file, when `conformed` does
not hold exactly the files of `taken`, when a patch or an exemption is about a file that is not the
item's, and when the file is not named after its need. A repository may keep keys of its own.

A block of the family core the repository pinned has the same record (spec 0016, answer 7: one
way in for everything that is not the repository's). Its `source` is `core`; its `item` is the
block's need in the core; and its `pin_sha256` is the hash that names the block in the repository's
copy of the core: the `sha256` of the block's files, each with its hash, in the order of their
names. That hash moves when a file of the block changes, comes or goes, and with nothing else, so
an answer of the core that changes, another block, or a member that joins leave the record as it
is. `core --take` starts the record as it copies the files out of the copy, with `taken` and
`conformed` alike and no patch; the inventory reports the block as `outdated` when the hash in the
record is not the one of the copy now, and `core --take` then writes the files that changed, for
`conform --taken-down` to apply the patches on.

A record whose need no row of the intake ledger answers is an item **taken down and not taken in**:
the gate fails when a file of the repository's code imports one of its files, naming the item, its
source and its need. So does a file in the `folder` a source declares that the code imports and no
record of an item taken in lists, an item installed with no record at all among them: the gate
names the file and the source. Code inside a declared folder may import its neighbours freely. `intake` writes the row only when the record is whole, its files on disk are
the files it holds after patching, and every rule turned off in them (a lint comment that turns a
rule off, `@ts-nocheck`, `@ts-ignore`, `@ts-expect-error`) or for their folder (named in the
formatter's ignore list, the lint configuration or the type check's) has its exemption; the row
then says `conform`. The conform command writes the record, and its skill says how.

A configuration file names a folder when it names that folder itself, written whole: maybe from the
root (`/` or `./` before it), maybe with a glob after it (`<folder>/`, `<folder>/**`). A folder
inside it that the file names (`<folder>/ui/**`), a folder whose name starts with its name, and the
folder of that name under another one are other folders. So the base library's folder, set apart
by the repository, does not set the folder beside it apart, where the repository keeps its own
components and where a block of the family core lands. The reading is of the text, as before: a
glob that covers a folder without naming it is not seen.

### screen-kinds

One page per kind of screen, with the front matter the acceptance kit defines. Eight keys are
required: `nhom`, `doi_tuong`, `khuon` (with `ten`), `nhan_dien`, `mau_dang_chay`, `khe_bat_buoc`,
`cam_ngoai_khuon` and `ngoai_le`. These are read when present: `don_vi` (`man` or `phan-tu`),
`cam_ho`, `thay_cho`, `khe_tuy_chon`, `luat`, `nhan_viec`, `lop_trinh_bay` and
`thanh_phan_tang_ngan`. No other key. The keys are in the kit's own language: they are its format,
which this plugin reads and does not rename.

## From birth

A ledger marked **yes** is there from the day a repository is born: once the floor is laid,
`adopt --starter` lays it without asking anyone (the decisions, tokens and components as adopting
always writes them, the others in the form the guide starts from), and `status`
names each one that is missing on the line of the rhythm "the repository is born". A ledger marked
**first entry** comes with its first entry, which only a person or a later round brings: the
person's first answer, a block taken in, a data model's columns, a part, a source, an item taken
down, a page about a kind of screen. Its absence is not a gap. The mark is `born` in the contract, `with-the-floor` or
`with-its-first-entry`, and is read at the contract's own paths.

## Not a ledger: the core of a family

The repositories of one family of products may share a core (spec 0016): the answers the family
shares, and the blocks that graduated to it. The core is not a ledger of a repository and the gate
of a repository does not read it: it is a folder of its own on the user's machine, outside every
repository of the family, which may become a git repository of its own or not. Its shape is stated
in `contract.mjs` as `CORE`, beside the ledgers, and is shape 2. Every part is a JSON file that
carries `version`; a tool that finds a part of a newer shape writes nothing and says to update the
plugin, as for a ledger. Shape 2 adds one thing to shape 1, the `history` of an answer; a part of
shape 1 is read as it is, and a tool that changes a part writes that part at shape 2 and leaves the
others as they are. The family's name, its answers and its blocks are the user's data, kept in
the folder; the plugin names none of them. `core --check` says what is wrong with a core folder,
each problem naming the file and the place.

| Part          | File                        | Holds                                                                      |
| ------------- | --------------------------- | -------------------------------------------------------------------------- |
| `declaration` | `core.json`                 | The family's name, where the answers came from, the members, the owner     |
| `answers`     | `answers.json`              | The answers the family shares, each locked or a default, and what holds it |
| `blocks`      | `blocks/index.json`         | The blocks that graduated to the family, with their files and users        |
| `members`     | `members/<repository>.json` | What each member repository has solved, by need, and what it uses          |
| `retired`     | `retired.json`              | The answers and blocks the core retired, whole, with who, when and why     |
| `proposals`   | `proposals/<id>.json`       | What members proposed to the family's owner, and what the owner answered   |

`declaration`: `version`; `family`, the name the person gave, never blank; `first`, the repository
the answers were first read from, with `repository` (its name), `read_on` (the day) and `commit`
(where it stood, or null outside git); `members`, the repositories that declared they are of the
family, each with `repository`, `joined` (a day) and maybe `pin`, empty until a repository declares
so, the first one included; `owner`, the person who answered the lock-or-default sheet, with
`by` and `on`: the family's owner; and maybe `publish`, the leave to publish the core to a private
repository (spec 0016, answer 9), absent until a person gives it: `to`, the one place it is given
for, kept as host and path with no scheme, no user and no secret; `allowed` (`by`, `on`), who gave
it and when; and `taken_back` (`by`, `on`) once it was taken back. The leave is for the family and
for that place: another place is asked anew, and a leave taken back sends nothing until a new one
is given. No command sends anything: the leave is what the session reads before it creates the
repository and pushes, each time after the person's yes. A member's `pin` is the first twelve hexadecimal digits of the
hash of `answers.json` as the member copied it: a member joining changes `core.json` and not the
pin. The command that joins writes the member into the core folder only where the folder can be
written, and says first what it writes there. The command that leaves takes the repository's line out of `members`
the same way: only where the core folder can be reached and holds its shape, saying first the line
it takes out; where it cannot, the repository leaves all the same, the line stays, and the command
says what is left to do there.

`answers`: `version` and `answers`, one entry per question, no question twice. An answer has `id`
(the id of its row in the decision ledger), `question`, `kind` (`value`, a value a member
compares, or `rule`, whose words are what its row says and which its check holds), `value` (for a
value, as the repository settled it: the blueprint's choice, the colour of the token file, the
widths; never the words of a row; for a rule, the words of its row), `hold`
(`locked` or `default`), `check` (the check of its row, which holds it, or null when none does: an
answer no check holds is never counted as held), `why`, `by` and `on` (who made it locked or a
default on the sheet, and when; nothing is locked without that answer), and `origin`: the
`repository` and `ledger` it was read from, and `by` and `on` where that ledger names who settled
it, null where it does not, and `given` (`by` and `on`) when the ledgers did not hold the value and
the person gave it on the sheet.

An answer may carry `history` (shape 2): each change the family's owner made to it after it came
into the core, oldest first, with `was` and `became` (each its `value` and its `hold`), `by`, `on`
and `why`, the reason, never blank. A change changes something: its `was` and `became` differ. Each
`was` is what the change before it `became`, and the last `became` is the answer's `value` and `hold`
now. A rule is never given another value, only another hold. The days go forward from the answer's
`on`. `by`, `on` and `why` of the answer itself say how it came into the core and are never
rewritten; an answer added after the core was built came in from a repository where a person
settled it, read as the first repository is read, and its `why` gives the owner's reason. A history
in a part that says shape 1 is a wrong shape. `core --check` holds each of these and names the
place: the file, the answer and the change.

`blocks`: `version` and `blocks`, one per need, no need twice. A block has `need`, `name`, `files`
(each with `file` and `sha256`, kept under `blocks/<need>/`), `adapters` (the kinds of adapter it
needs, as the starter kit names them: a repository that lacks one is not offered the block),
`used_by` (the repositories that use it), `promoted` (`by` and `on`) and `second_use`, false until a
second repository has used it; and maybe `description`, what it is for in a sentence. The list is
empty when a core is built.

Since slice 3 of item 7.2, `core --promote` fills it on the family's owner's word (spec 0016,
answer 13), with no second use: a block of a repository of the family, one with a row in its intake
ledger, is copied in, its files under `blocks/<need>/` byte for byte with the hash of each; `name`
and `description` are its row's; `adapters` are the kinds the person names, each one the repository
has, or else those of `components` and `source` the repository has; `used_by` is that repository;
`promoted` has `by`, `on` and `why`, the reason; and `second_use` is false, which the command says as
"no second use yet". A block that came from an outside source also has `licence`: `source` (the id
of the source), `words` (its licence line, as its row states it) and `allowed` (`by` and `on`), the
person who said that line allows passing the block's code on to the family's other repositories. A
block whose files were replaced, by the promotion's `--replace` or by a member's proposal granted,
has `history`: each replacing, oldest first, with `was` and `became` (each its `files`, with their
hashes), `by`, `on` and `why`; each `was` is what the one before it `became`, the last `became` is
the block's `files` now, and the days go forward from `promoted.on`. A replacing keeps the names and
hashes of the files it replaced, not their bytes: a file the block no longer has leaves its folder.
`used_by` then gains the repository the files came from, and `second_use` is true once it names two.

For a store that is not empty, `core --check` also holds the files, and names each by the list, the
block and the file: a block names at least one file; a `file` is a path inside the folder of its
need, never one that leads out of it (`..`, a path from the root), no part of its name starts with
a dot, and it is named once; each file is
there, at `blocks/<need>/<file>`; it is text, UTF-8, since a block is code a member copies as it
is; and its bytes have the `sha256` listed. Each word of `adapters` is a kind of adapter this plugin
knows (`build`, `browser`, `values`, `components`, `source`, `lint`, `routes`): another word would
make every member read the block as needing what it can never have. A core whose store fails any of
these is not joined: `core --join` refuses it and writes nothing. The kinds are held where a core is
checked and joined, not in the shape a member's gate reads its copy by, so a tool copied in before
a kind existed still reads a copy that names it.

`members`: one file per member repository, named after it, with `version`, `repository` and `needs`,
each with `need`, `name` and `description` and nothing else: never code, never the text of a file.
The folder may be missing until a member reports.

Since slice 2 of item 7.2 a report is written by `core --report`, by `core --join` (joining and
pinning again) and by no other command; `core --leave` deletes it with the member's line. It is
read from the repository's intake ledger and from nothing else, so the same ledger gives the same
file: it carries no day and no person. An intake ledger that is not there, or cannot be read, tells
nothing and corrects nothing: a report the core holds is left as it is, and the move says what
could not be read. `needs` has one entry for each block the repository answered
itself, made by hand or taken from an outside source: the row's `need`, its `name` and its
`description`, never a path, a hash, a source's name, a value or code. Left out, each said with
why: a row with no `description`, a row retired or merged, a piece of the starter kit (every
repository has it from the plugin), a need that is no key, and a block the core retired that the
repository keeps as its own. A report may also have `uses`: the needs of the core whose block the
repository took in (`from: core` on its row), each a key and nothing else, since the block is the
core's and no need the repository answered. A need is told once, a use is told once, and a use
names a need the store offers or retired. The first repository of a family, which joins only when
its owner says so (spec 0016, answer 11), reports without joining: `core --report --core DIR`
writes its report and nothing in the repository. The move prints the file whole before it writes
it, writes only in the core folder, and writes nothing when the folder cannot be reached.

`used_by` and `second_use` of a block follow the reports: the move that writes a report writes
first, in `blocks/index.json`, the name of the repository into `used_by` of each block its `uses`
names, and `second_use` becomes true once `used_by` names two. It is the member's own word about
its own use, as its line under `members` in `core.json` is; no file of a block changes, and a block
still reaches the store only by the family's owner's word. A name is never taken out of `used_by`,
and `second_use` never goes back to false: a repository that left once used the block. An entry
that lost a name is written again at that repository's next report or pin.

`retired`: `retired.json`, missing until the core retires something (criterion 24), with `version`,
`answers` and `blocks`. `core --retire` takes an answer out of `answers.json`, or a block out of
`blocks/index.json`, and keeps it here whole, as it was, its `history` included, with `retired`:
`by`, `on` and `why`, never blank. Nothing is deleted from the record: the files of a retired block
stay where they were, under `blocks/<need>/`, and `core --check` holds them to their hashes as it
holds those of the store. A need the store offers whose retired block keeps its files in the same
folder is wrong: a retired need is not promoted again. An answer retired may come back with
`core --change --from`, and its retiring stays here. A member reads the answer or the block as
retired because the core no longer holds it, as before, and reads here who retired it, when and why.

`proposals`: one file per proposal of a member to the family's owner (criterion 23),
`proposals/<id>.json`, missing until a member proposes. A proposal has `version`, `id` (its kind,
its subject and a number, as `answer-source-color-1`: the name of its file), `kind` (`answer`,
`block` or, since slice 2 of item 7.2, `graduation`), `subject` (the answer's id, or the block's need in the core), `repository` (the member
proposing), `pin` (the pin it held), and `by`, `on` and `why`. For an answer it has `answer`: `value`,
the value the member holds, and `was`, the core's `value` and `hold` when it was made. For a block it
has `block`: `name`, `files` (the files as the member has them, each with `file` and `sha256`, kept
under `proposals/<id>/` and held to their hashes) and `was`, the hash that named the core's block
when it was made. Once the family's owner answered, `decided`: `outcome` (`granted` or `refused`),
`by`, `on` and `why`. A granted answer is carried out by `core --change`, its history saying who
granted it and why; a granted block by the promotion's replace, its history saying the same. A
refused proposal keeps the refusal and the reason, and the member is told at its next look. One
proposal of a member about one thing waits at a time.

Since slice 2 of item 7.2 a proposal may be of the kind `graduation` (criterion 13, answer 6): a
member asks the family's owner to promote a block a repository of the family already has, for a
need the family's store does not hold. Its `subject` is the need, and it has `graduation`:
`candidates`, one for each repository that told the core it answered that need, each with
`repository`, `need`, `name` and `description` as that repository's report says, and nothing else:
it carries no value, no file and no code. Where two repositories answered the need in two ways it
lists both, for the owner to choose one. One graduation about a need waits at a time, whichever
member asked. `decided` of one granted also has `chose`, the repository whose block the owner
chose. Granting promotes nothing by itself: the block is promoted with `core --promote`, in the
repository that has it, by the owner's name and the reason `granted <id> of <repository>: <why>`;
the grant prints that call, each word a person gave in single quotes so a shell runs none of it, and
runs it only when the owner names that repository's folder in the
same call (`--from DIR`). A block the owner refused is not proposed again for that need, and a need
the core retired is not proposed.

Only answers a person settled go into a core: a row the guide proposed or read off the repository
and nobody confirmed (its note says a person has not confirmed it), a blueprint answer the guide
proposed, a question about the row that waits or was refused on the decision sheet, are left out
and the command says why. A row with no such mark is the repository's own decision, as the gate
takes it, and its origin names no one when the ledger does not. A behaviour rule the standard
decisions do not know is the repository's own, maybe a rule of one kind of screen: it is listed and
proposed in neither set. The core lies outside every git work tree but its own: a folder inside a
repository is refused, and the root of a repository made for the core is taken. Its files keep
names, never an e-mail address. `core --change` changes one answer of a core in its folder, its
value, its hold, or an answer added, and writes nothing into a member repository. A member learns
of it where it can look at the core's folder: `status`, `inventory` and `core --moved` name each
answer that changed, with what it was in the copy, what it is in the core, and who changed it,
when and why as its `history` says; each answer added; and each the core no longer holds. A core
that cannot be looked at is said, never an error, and the member goes on with its copy.

## Not a ledger: the machine's list of cores

Each core this machine built or pinned, with the folder it lives in, and each repository whose
person said it is of no family listed there, by its main folder (spec 0016, criterion 17). It is one
file on the machine, outside every repository: the file `DESIGN_ASSEMBLY_CORES` names, else
`$XDG_CONFIG_HOME/design-assembly/cores.json`, else `~/.config/design-assembly/cores.json`. No
command sends it anywhere, and none writes over a list it cannot read. With a core in it that can be
read, `new` and `adopt` ask a repository that declares no family one question, whether it is of that
family; a list missing or that cannot be read asks nothing and says no error. A member finds its
core's folder through the list, by the family's name, and where the list holds more than one core
of that name, by the one whose members name the repository. The list may also hold `pushed`, each
push of a core the session made and recorded: `path` (the core's folder), `to` (the place), `on`,
`by` and `state` (a short hash of the folder's files as pushed), the last push to each place; it is
kept here and not in the core's folder, so that recording a push changes nothing of what was
pushed.

## Not a ledger: the line at the start of a session

The plugin has one hook (spec 0016, answer 12), declared in `hooks/hooks.json` for the start of a
session: it runs `scripts/session-line.mjs`, which prints at most one line, and only when something
about the family's core waits in the repository the session opened: the core moved ahead of the
pin, a question about the core waits on the owner, or a locked answer is held otherwise with no
exception. In every other case it prints nothing: a repository of no family, a folder that is no
repository, a copy or a list that cannot be read. It reads the declaration first and nothing more
where there is none; it writes no file, calls no model, no network and no git, and ends well
whatever goes wrong, so it never stops a session from opening.

A repository that left its family is recorded among those that said no, by its main folder, with
the day and `how: "left"`: it is not asked at once whether it is of a family, and joins one again
with `core --join`. The core it left stays on the list. A list that cannot be read is left as it
is, and the repository leaves all the same.

## Not a ledger: the waiting list

The questions that wait on the owner are not a ledger of the contract: they are not design
decisions, the audit does not count them, and their shape is stated in `waiting.mjs`, not in
`contract.mjs`. They are kept as one file per question, `design/waiting/<id>.json`, or in the older
shared file `design/waiting-list.json`; never both. The gate reads them for two rows of the
decisions ledger, `decision-sheet` and `owner-calls`, and `checks.md` says how.

Since item 11.8 of spec 0015 a question may carry `exemptions`, a list of what an item of an outside
source is let off, each with `rule`, `file` and `reason`, under the item `exemptions:<need>`.
`intake` asks it before it writes the row of the item, and writes the row only once the owner kept
that very list: a list changed since the answer is asked again. The decision sheet lays it out by
rule and reason, with the files beneath each.

A rule a row of the decision ledger holds (its check `eslint:<rule>`, or a check of kind `lint` of
the tool data) is mandatory for an item of an outside source: `conform --exempt` refuses it, and
`intake` refuses an item that turns it off by any comment, by a comment that names no rule, by the
lint's own comment that sets it below an error inside the file, or by a lint configuration or ignore
file that sets a folder of the item apart. The base library's own
folder, set apart by the repository, is the repository's, not the item's. A record written before
keeps the gate green; `conform`'s plain check and the inventory name the exemption.
