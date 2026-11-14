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

| Ledger         | File                             | Question                                                         | Writer                                     | Shape |
| -------------- | -------------------------------- | ---------------------------------------------------------------- | ------------------------------------------ | ----- |
| `decisions`    | `design/decisions.yaml`          | What the repository decided, and what holds each decision        | People, and the guide for its own rows     | 1     |
| `blueprint`    | `design/blueprint.json`          | What the person answered, layer by layer                         | The person, through the guide              | 1     |
| `tokens`       | `design/tokens.json`             | Which values exist                                               | `make design-tokens`                       | none  |
| `components`   | `design/component-registry.json` | Which components exist, where, and of what                       | `make design-components`                   | 2     |
| `column-types` | `design/column-types.json`       | Which column types the repository has                            | A person                                   | 1     |
| `columns`      | `design/columns.json`            | How each column type is aligned and sized, and each field's type | `make design-columns`                      | 1     |
| `states`       | `design/states.json`             | Which states every screen declares, and which are excused        | A person                                   | 1     |
| `screen-sizes` | `design/screen-sizes.json`       | The widths every page is checked at                              | A person                                   | 1     |
| `parts`        | `design/parts.json`              | The parts of the code from the top down                          | A person                                   | 1     |
| `screens`      | `design/screens.yaml`            | Which screens exist, of which kind, with which states            | A person or an agent, with each new screen | 1     |
| `screen-kinds` | `design/patterns/<kind>.md`      | How a screen of each kind is built                               | A person                                   | none  |

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
  component a page of a screen kind names as the frame of its screens is a template.
- `source`: `library` for the component library's folder, `own` for the repository's own
  components beside it.
- `parts`: the other components of the same file it is drawn with.
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
`statuses`. A repository may keep keys of its own, on a screen or beside the screens, such as who
may open it: they are its extension, and are read without complaint.

The ledger says what there is; the code that lists the screens says how each state is reached. The
gate holds that both list the same built screens, that no id or route is listed twice, and that
each family is the kind of a page; the screen checks read the states from the ledger. The
repository's own test, installed once, reads both while the code runs and holds that each screen's
title and states are the code's, so states built by a function are read too.

### screen-kinds

One page per kind of screen, with the front matter the acceptance kit defines. Eight keys are
required: `nhom`, `doi_tuong`, `khuon` (with `ten`), `nhan_dien`, `mau_dang_chay`, `khe_bat_buoc`,
`cam_ngoai_khuon` and `ngoai_le`. These are read when present: `don_vi` (`man` or `phan-tu`),
`cam_ho`, `thay_cho`, `khe_tuy_chon`, `luat`, `nhan_viec`, `lop_trinh_bay` and
`thanh_phan_tang_ngan`. No other key. The keys are in the kit's own language: they are its format,
which this plugin reads and does not rename.

## Not settled yet

Two ledgers have no one shape yet:

- `intake`: which need got which block, and who approved it. One repository keeps one so far.
- `sources`: which outside libraries blocks come from, in what order, at which pin. Likewise.
