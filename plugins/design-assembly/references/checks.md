# What the guide leaves in a repository, and how it is held

Read this when you build (step 6 of the guide) or explain a failing check.

## The files

| File                                 | What it is                                                                                                  | Who edits it                         |
| ------------------------------------ | ----------------------------------------------------------------------------------------------------------- | ------------------------------------ |
| `design/blueprint.json`              | What the person chose, layer by layer, with why and what was turned down                                    | You, during the guide                |
| `design/decisions.yaml`              | The ledger: one row per design decision, pointing at the proof that holds it                                | People, and the scripts for new rows |
| `design/theme.json`                  | What this plugin's tool needs to check its decisions: the inputs and the checks per decision                | `apply.mjs` and `adopt.mjs` only     |
| `design/decisions/<layer>.md`        | A decision record per decided layer                                                                         | `apply.mjs` only                     |
| The marked block in `src/index.css`  | The design tokens                                                                                           | `apply.mjs` only                     |
| `design/tokens.json`                 | The design tokens, for tools that do not read CSS. Written from the stylesheet                              | `make design-tokens` only            |
| `design/component-registry.json`     | The component manifest: every exported component with its variants. Written from the source                 | `make design-components` only        |
| `design/column-types.json`           | The column types of the repository: each with its base type and sample length                               | A person                             |
| `design/columns.json`                | What code reads: each column type with its alignment, each field with its type                              | `make design-columns` only           |
| `design/states.json`                 | The states every screen must declare, and the screens excused from them                                     | A person                             |
| `design/patterns/<kind>.md`          | One page per kind of screen: its main task, the files of its screens, its reference screen                  | A person. The scripts write none     |
| `design/screen-sizes.json`           | The widths every page is checked at                                                                         | A person                             |
| `tests/e2e/templates.spec.ts`        | The browser test of every page at those widths. Installed once, then the repository's own                   | The repository                       |
| The typed table parts and their test | Table parts that apply the column type. Installed once, then the repository's own                           | The repository                       |
| `tools/design-assembly/`             | The checks. They belong to the plugin: change them in the plugin and run the guide again                    | Nobody, in the repository            |
| `mk/design-assembly.mk`              | Adds `design-assembly` to `make check`, and `make design-rate`                                              | Nobody, in the repository            |
| `.claude/rules/design-assembly.md`   | The rules the tool holds in this repository, for the agent that builds next. Written from what is installed | The scripts only                     |

## The ledger

`design/decisions.yaml` is the standard record, in block-style YAML a person can edit. A row has
`id`, `layer`, `kind`, `source`, and a `check` when one exists:

- `layer` is the artifact the decision constrains: context, foundations, components, patterns,
  content, templates or governance.
- `kind` says how the decision was settled: `standard` (an existing standard used as is), `formula`
  (the same input gives the same result), `closed` (one of a fixed set), `judgment` (a person
  decided; it has no check).
- `check` points at the proof: `test:<path>` or `e2e:<path>` (the file names the decision with
  `decision:<id>`), `eslint:<rule>`, or `tool:<path>` (a tool the gate runs).

The row does not hold the value. A rebrand changes the stylesheet, not the ledger.

Ids come from `references/standard-decisions.json`, so two repositories can be compared. A
repository may add rows of its own.

The guide writes only the rows it holds. They point at `tool:tools/design-assembly/check.mjs`.
Adopting adds rows for decisions that have none, and points them at the proof the repository
already runs. A row that is already there is kept byte for byte, comments included.

## Generated or adopted

A value reaches the ledger in one of two ways, and never both:

- Generated: the guide computes it from the person's choices and writes it into the marked block.
- Adopted: the repository already has it. `adopt.mjs` leaves it where it is and adds a check that
  passes on the value as found. `design/theme.json` lists these decisions under `adopted`, and
  names the `stylesheet` the checks read.

The guide refuses to generate over an adopted value, or over a primary color role that has a hue
of its own, unless it is run with `--replace`.

## The design tokens file

`design/tokens.json` (or the path the acceptance kit is told to read) holds the foundations values
in the Design Tokens Community Group format: two levels, `group.name`, each token with a `$type`
and a `$value`.

- A token is a theme variable of the stylesheet: `color.primary` is `--color-primary`. A reader
  that turns a token path into a variable name finds a variable that exists.
- `$value` is the CSS text after every `var()` is followed. A value that differs in dark mode is
  kept beside it, under `$extensions`.
- Groups today: `color`, `radius`, `text`. Typefaces, the spacing unit, elevation and motion have
  no token yet.
- The file is derived. Change the stylesheet, then run `make design-tokens`. The `tokens` check
  fails when the two disagree, whichever side moved.
- A tokens file a person already keeps, and that says something else, is never written over: the
  scripts say so and write none.

## The component manifest

`design/component-registry.json` (or the path the acceptance kit is told to read) lists every
component the repository's component folder exports: its name, its file, its variants and the
default of each axis. Look a component up here before reading its source.

- A variant is written `axis=value`, such as `size=sm`: the form a plan names it in.
- Variants are read from two places in the source: variant sets declared with the class-variance
  helper, and props typed as a closed list of words. A true/false prop is not a variant.
- The file is derived. Change the component, then run `make design-components`. The `components`
  check fails when the two disagree, whichever side moved.
- A control (a component that renders something a person activates: a button, an input, a
  trigger, an item) is marked `control: true`, with `min_height`: the smallest height its own
  classes declare, over all its variants. A control without `min_height` takes its height from
  elsewhere, and is not measured.
- A component with no `variants` has none the reader could see. It is listed, and its variants are
  not checked.
- States, the list of props, the parts of a component and components outside that folder are not
  in the manifest yet.
- A registry a person already keeps, and that says something else, is never written over.

## Target size

The `target-size` check holds the decision that every control reaches the target size of the
conformance level: 24 CSS pixels at AA (WCAG 2.2, 2.5.8), 44 at AAA (2.5.5).

- It reads heights from component source, not from a rendered screen: `h-`, `size-` and `min-h-`
  classes on the element the control renders and in the variant sets it calls. A size given to a
  child or a pseudo-element is not the control's.
- It measures height only. The width of a text control depends on its content.
- When any control is below the level's target size, no check is added: the scripts name each one.
- The message of a failing check names the control, the variant and the class.

## Column types

A column type is the kind of data a table column holds. It decides the side the column is aligned
to and how wide the column is at least.

- Six base types, named as data grids name them: `text`, `number`, `date`, `datetime`, `boolean`,
  `select`. Only `number` is aligned to the right: a quantity is compared down its column.
- A repository lists its own column types in `design/column-types.json`. Each names its base type
  and a `sample`: the length in characters of the longest value it typically shows. A person owns
  this file; the guide writes a starting table once and never again.
- A field names its column type once, in the data model: a `display` key on the property. A
  screen names the field and the header, nothing else.
- A column is at least as wide as the longer of its header and its sample, plus `padding_ch`. A
  column of base type `text` is fitted to the longest value it shows, up to its sample, plus one
  character.
- A table is dense (32px rows, no padding above and below a cell) when its columns cannot all be shown at that width, and normal
  (48px rows) otherwise.
- `design/columns.json` is derived. Change the table or a field's type, then run
  `make design-columns`.
- A screen may not set alignment or width on a table cell, nor a height on a table row. The
  `cells` check names the file and the class.

What the tool holds, and what it does not: alignment is held in full. For width it holds the
numbers and that no screen sets one; for density only that no screen sets a row height. The sum
and the choice of density are done by the typed table parts, which carry their own tests.

## States, words and error messages

Three rules a tool can read from source. Each holds part of a larger decision, and its row says
which part.

- **States.** Four states belong to every view of data: `loading`, `empty`, `error`,
  `no-results`. `design/states.json` lists the states every screen must declare (`required`) and
  the screens excused from them, each with a reason (`exempt`). A repository adds states of its
  own; the four cannot be removed. The check reads the screen registry (`src/screens.ts`). It
  shows that a screen declares a state, not that the state can be reached or what it shows: that
  is for the repository's browser tests.
- **Words.** A screen takes every word from the repository's one place for words. The check finds
  text written between two tags, and in `aria-label`, `aria-description`, `placeholder`, `title`
  and `alt`. Text assembled in code is not read.
- **Error messages.** An error message says what happened, then what to do next. The check reads
  every `Alert` of the destructive kind in a screen: it needs an `AlertTitle` and an
  `AlertDescription`. Whether the words are right is a person's review.

- **Channels.** A screen tells a person the result of an action through the repository's one
  module for it, never by calling a toast library or a dialog of the browser itself. Which channel
  a message takes (at the field, in a toast, in place of the content) is for the repository's
  tests and a person's review.

A rule the repository does not meet today gets no row: the scripts say where it is broken. Once a
row is there, its check is never removed for being broken: the gate fails and names the place.

## A failed action

An action done at once can fail, and so can its undo. The decision `failed-action` says what a
person sees then:

- The failure is told where the person acted. A dialog or form that is still open shows it. An
  action done at once tells it in a toast, through `notifyFailed` of the notification module.
- That toast stays until the person answers it. It says what was not done, then what to do next,
  it carries a button that tries again, and it is announced as an alert.
- A failed undo is never told as done: the thing is still there, and the toast says so.
- A toast with a button stays until the button or its close button is pressed, so a result that
  offers an undo stays too. One toast shows at a time; a new one takes the place of the old.
- A toast is never the only way: what its button does can also be done from the screen. A toast
  with no button goes away by itself only because the screen already shows the result.

No tool reads this from source. It is held by the repository's own test that names
`decision:failed-action`, as `claimed`. A screen with an action done at once lists a state for
that action failing in the screen registry, so the browser tests look at the toast as well.

## Kinds of screen

A screen is of one kind: a list, a record, a form. A kind has one page under `design/patterns`,
in the format the acceptance kit reads, so one page serves both tools. The front matter keys are
the kit's own. This tool reads five of them:

| Key                 | What it says                                                    |
| ------------------- | --------------------------------------------------------------- |
| `nhom`              | The kind's name, equal to the file name                         |
| `nhan_viec`         | The main task of a person on a screen of this kind              |
| `nhan_dien`         | Globs of the source files that draw a screen of this kind       |
| `mau_dang_chay.tep` | The source file of the kind's reference screen                  |
| `ngoai_le`          | Files left out; one with no `khoi` key is no longer of the kind |

A page that both tools read, for a kind named `list`, in `design/patterns/list.md`:

```markdown
---
nhom: list
doi_tuong: A screen that shows many items of one type in a table.
khuon:
  ten: Table
  nhap: "@/components/ui/table"
nhan_dien:
  - "src/lists/**/*.tsx"
mau_dang_chay:
  tep: src/lists/Orders.tsx
khe_bat_buoc: []
cam_ngoai_khuon: []
ngoai_le: []
nhan_viec: Find one order, then open it or cancel it
---

## Main task

## Order of the parts

## Words

## When to use, and when not
```

The other keys (`doi_tuong`, `khuon`, `khe_bat_buoc`, `cam_ngoai_khuon`) are the acceptance
kit's: what the kind is, the component its screens are built from, the parts that component must
be given, and the components a screen of the kind must not use directly. This tool does not read
them; keep them so the kit accepts the page. An entry of `ngoai_le` is
`{ tep: <file>, ly_do: <why> }`.

The body is for people and for the agent that builds the next screen: the main task, the order of
the parts, how the words are written, when to use the kind and when not.

- **`page-layouts`.** Every screen of the registry is of exactly one kind: the file its `load`
  imports matches the globs of one page. Each page names the kind as its file does, a main task
  and its files.
- **`reference-implementation`.** The file each page names is the file of a listed screen, of
  that kind, and that screen declares every required state. A sample that is not a screen of the
  product cannot be the reference.
- **`primary-task`.** Recorded once the pages name it, as a person's call that nobody has
  confirmed. The order of the parts and what the words say are a person's rows to add.

The scripts never write a page: what a kind is for is decided with the person.

## Screen sizes and the page checks

`design/screen-sizes.json` lists the widths, in CSS pixels, that every page is checked at. The
narrowest is 320 or less: WCAG 2.2 asks that a page works at 320 without scrolling in two
directions. A part that needs two dimensions, such as a table of data, scrolls inside itself. A
repository adds the widths its own layouts change at.

Where the floor's browser checks are installed, the guide writes the file with 320 and 1440, and
installs a browser test that reads it. For every state of every screen, at every width, that test
checks one main region and one top heading, no sideways scroll, and the automated accessibility
checks. It names `decision:one-main-one-h1`, `decision:no-sideways-scroll` and
`decision:wcag-aa`, so three rows point at it as `claimed`. The row `test-screen-sizes` is held
by the tool: the widths reach down to 320, and the test opens the file and names its widths. The
tool reads the test's code, not its comments; it does not run the test, so a test that skips a
width is not caught. A failure of the browser test names the decision it belongs to.

## A row that has no check

A repository may already have a row for a decision, with no check. The scripts never rewrite a
row. Adopting lists such rows when it finds what would hold them, and gives a row its pointer only
when a person names it with `--hold`: one `check:` line is added, and the rest of the row stays
byte for byte.

## A repository's own test as a proof

A test under `tests/` that names a standard decision with `decision:<id>` is a proof of it.
Adopting adds a row that points at the test, as `claimed`: the tool does not run it. This is how
a decision about behaviour, such as asking first or offering an undo, enters the ledger.

## How a value is read

The tool reads the stylesheet the repository names (`design/theme.json`, else `components.json`,
else `src/index.css`), with its relative imports put in place. A variable that points at another
with `var()` is followed, down to the framework's own theme. Dark-mode values are read from every dark selector the stylesheet uses (`:root.dark`, `html.dark`,
`.dark`), the strongest first. A value it cannot turn into a colour,
such as a mix of two colours, is not guessed: the check says it cannot read it, and adopting adds
no check for it.

## What a check of this plugin is

Its tool reads the real files (the stylesheet, the gate), not a copy of what was intended. Every
run also changes a copy of those files so that the check must fail, and reports a check that still
passes: a check that cannot fail proves nothing.

| Kind                | Passes when                                                                            |
| ------------------- | -------------------------------------------------------------------------------------- |
| `generated`         | The block in the stylesheet is exactly what the source color gives                     |
| `contrast`          | Two color roles reach the contrast ratio of the conformance level                      |
| `value`             | A variable resolves to the decided value, whatever is written after it                 |
| `absent`            | The stylesheet does not redeclare variables that the floor's scale owns                |
| `scale`             | Every step of the type scale is larger than the one before                             |
| `tokens`            | The design tokens file is exactly what the stylesheet gives                            |
| `components`        | The component manifest is exactly what the component source gives                      |
| `target-size`       | Every control declares a height that reaches the target size of the conformance level  |
| `column-types`      | The table of column types is well formed, and every field names one of its types       |
| `columns`           | The file code reads is exactly what the table and the data model give                  |
| `cells`             | No screen sets on a table what the column type decides                                 |
| `states`            | Every screen of the registry declares the required states, or is excused with a reason |
| `words`             | No screen writes its own words                                                         |
| `error-copy`        | Every error message a screen shows has a title and a description                       |
| `channels`          | No screen opens a browser dialog or calls a toast library itself                       |
| `screen-kinds`      | Every screen is of exactly one kind, and each kind's page names its task and its files |
| `reference-screens` | Each kind's reference is a listed screen of that kind with every required state        |
| `screen-sizes`      | The widths reach down to 320 CSS pixels, and the browser test reads them               |
| `gate`              | `make check` runs the tool in a way that can fail                                      |

The tool also checks that it and the ledger agree in both directions: every row that points at it
has checks behind it, and every decision it holds is a row.

## Held, claimed, recorded

`make design-rate` lists every row of the ledger:

- `held`: this plugin's tool ran the check now and saw it fail on a changed copy.
- `claimed`: the row names another check (a lint rule, a test). It resolves, and was not run here.
- `recorded`: a judgment, written down. No check, by design.
- `not held`: decided, and nothing holds it yet.
- `FAILING`: the check fails, or the pointer does not resolve.

Two counts exist, and they answer different questions:

- The audit's `coverage` line counts the core standard decisions that the ledger answers, and
  splits them into held, claimed and recorded. Use it to say where the design system stands.
- `make design-rate` counts every row of the ledger that names a check, held and claimed together,
  over all rows, core or not. It says how much of the ledger is automatic, not how much was run.

Visual regression and design lint for components are not in this version.
