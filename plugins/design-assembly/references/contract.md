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

### blueprint

`version`, `layers` (one entry per layer, with its status and the choice), and the guide's own
keys: `status`, `depth`, the language of the conversation, an approval note. Other keys are kept.

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
taken in; `changed`, `{ on, why }`, when the repository changed it on purpose since; `retired`,
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

### sources

One file per pinned source, `design/sources/<id>.json`, so that pinning one source again writes
that file alone; there is no single-file shape. A source has `version`, `id` (small letters and
dashes, the name of its file) and `catalog` (the path, in the repository, of the list of what it
offers), and may have `title`, `order` (a number: sources are looked through the smallest first,
then by id) and `licence` (what taking an item in needs, in a sentence, never a key), and `install`,
how one item is taken in, with `{name}` where its name goes. It names its pin in one of two ways: as
`pin`, or as `pin_file`, the path of a file the repository already keeps it in. A pin holds the
`files` the source was read from, each with `file` and `sha256` and maybe `url` and `bytes`, and
maybe `fetched_at`; or a `version`. `snapshot` names the folder those files are kept in. Since
spec 0015 a source may also declare `folder`, the folder of the repository its items' files are
installed into: once it does, the gate names a file there that the code imports and that no
conform record of an item taken in lists, and the file an older row of the intake ledger names
counts as taken in. Optional, so a source written before it reads as before, and says nothing to
the gate. Keys of the repository's own are kept.

A catalog lists `items`, or keeps them in `groups`; an item has `name`, and may have `kind`,
`title`, `description`, `group`, `category` and `page`; an item of a group takes the group's
`kind`, `group` and `category`, and its `base` as its page. A catalog holds no code.

No tool of this plugin fetches. Each reader compares the files of the snapshot with the hashes of
the pin: a source whose snapshot differs, whose pin file or catalog cannot be read, or of a newer
shape, is unreadable, says why, and offers nothing. A source pinned by a version has no snapshot to
compare, and says so. Whether a catalog is kept in git is the repository's choice, as with every
derived file.

A source may say its `kind`. One kind has a meaning here, `font`: a typeface the product uses that
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

A record whose need no row of the intake ledger answers is an item **taken down and not taken in**:
the gate fails when a file of the repository's code imports one of its files, naming the item, its
source and its need. So does a file in the `folder` a source declares that the code imports and no
record of an item taken in lists, an item installed with no record at all among them: the gate
names the file and the source. Code inside a declared folder may import its neighbours freely. `intake` writes the row only when the record is whole, its files on disk are
the files it holds after patching, and every rule turned off in them (a lint comment that turns a
rule off, `@ts-nocheck`, `@ts-ignore`, `@ts-expect-error`) or for their folder (named in the
formatter's ignore list, the lint configuration or the type check's) has its exemption; the row
then says `conform`. The conform command writes the record, and its skill says how.

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

## Not a ledger: the waiting list

The questions that wait on the owner are not a ledger of the contract: they are not design
decisions, the audit does not count them, and their shape is stated in `waiting.mjs`, not in
`contract.mjs`. They are kept as one file per question, `design/waiting/<id>.json`, or in the older
shared file `design/waiting-list.json`; never both. The gate reads them for two rows of the
decisions ledger, `decision-sheet` and `owner-calls`, and `checks.md` says how.
