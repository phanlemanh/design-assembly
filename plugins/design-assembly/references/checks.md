# What the guide leaves in a repository, and how it is held

Read this when you build (step 6 of the guide) or explain a failing check.

## The files

| File                                 | What it is                                                                                                                                            | Who edits it                                                               |
| ------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| `design/blueprint.json`              | What the person chose, layer by layer, with why and what was turned down                                                                              | You, during the guide                                                      |
| `design/decisions.yaml`              | The ledger: one row per design decision, pointing at the proof that holds it                                                                          | People, and the scripts for new rows                                       |
| `design/theme.json`                  | What this plugin's tool needs to check its decisions: the inputs and the checks per decision                                                          | `apply.mjs` and `adopt.mjs` only                                           |
| `design/decisions/<layer>.md`        | A decision record per decided layer                                                                                                                   | `apply.mjs` only                                                           |
| The marked block in `src/index.css`  | The design tokens                                                                                                                                     | `apply.mjs` only                                                           |
| `design/tokens.json`                 | The design tokens, for tools that do not read CSS. Written from the stylesheet                                                                        | `make design-tokens` only                                                  |
| `design/component-registry.json`     | The component manifest: every exported component with its variants. Written from the source                                                           | `make design-components` only                                              |
| `design/column-types.json`           | The column types of the repository: each with its base type and sample length                                                                         | A person                                                                   |
| `design/columns.json`                | What code reads: each column type with its alignment, each field with its type                                                                        | `make design-columns` only                                                 |
| `design/states.json`                 | The states every screen must declare, and the screens excused from them                                                                               | A person                                                                   |
| `design/screens.yaml`                | The ledger of screens: every screen with its route, title, kind, status and states                                                                    | A person or an agent, with each new screen. The guide writes the first one |
| `design/screens/<id>.yaml`           | The same ledger kept as one file per screen, with `_shared.yaml` for what is not a screen, when the repository asks for it                            | A person or an agent, with each new screen. The guide writes the first one |
| `design/patterns/<kind>.md`          | One page per kind of screen: its main task, the files of its screens, its reference screen                                                            | A person. The scripts write none                                           |
| `design/screen-sizes.json`           | The widths every page is checked at                                                                                                                   | A person                                                                   |
| `design/parts.json`                  | The parts of the code, from the top down: which may import which                                                                                      | A person                                                                   |
| `design/escapes.md`                  | One line per fault that every check let through, and the layer that should have caught it                                                             | A person, and the agent that finds one                                     |
| `tests/e2e/templates.spec.ts`        | The browser test of every page at those widths. Installed once, then the repository's own                                                             | The repository                                                             |
| `tests/screens-ledger.test.ts`       | The test that the ledger of screens and the code list the same titles and states, read while the code runs. Installed once, then the repository's own | The repository                                                             |
| The typed table parts and their test | Table parts that apply the column type. Installed once, then the repository's own                                                                     | The repository                                                             |
| `tools/design-assembly/`             | The checks. They belong to the plugin: change them in the plugin and run the guide again                                                              | Nobody, in the repository                                                  |
| `mk/design-assembly.mk`              | Adds `design-assembly` to `make check`, and `make design-rate`                                                                                        | Nobody, in the repository                                                  |
| `.claude/rules/design-assembly.md`   | The rules the tool holds in this repository, for the agent that builds next. Written from what is installed                                           | The scripts only                                                           |

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

A row that points at a lint rule of the repository is re-run when this plugin has texts that
break the decision. The repository's own lint reads them as one of its screen files; the decision
is held when the lint rejects every one, and the check was seen failing with the rules that
rejected them turned off. Adopting then adds the check to the tool's data, and the gate runs it
from then on; the row is not rewritten. A rule that lets a text through stays claimed, and
adopting names the text.

## The shape of each ledger

Every ledger above has one shape, stated in `contract.md`, so this plugin, the acceptance kit and
the agent that builds a screen read it alike. The `ledger-shapes` row holds it: the gate fails when
a ledger present, a page of a screen kind, or a file of `design/sources/`, leaves its shape. It
reads every file of `design/sources/` whatever its check names, so a repository that pins a source
is held from the first file. A ledger that says it has a newer
shape than the plugin knows is never written over: the guide and adopt stop, and say to update the
plugin.

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
- `$value` is the CSS text after every `var()` is followed. A colour is written in hexadecimal,
  the one form every reader takes, and the stylesheet's own text is kept under `$extensions`. A
  value that differs in dark mode is kept beside it, under `$extensions` too. The shape of the file
  is in `contract.md`.
- Groups today: `color`, `radius`, `text`. Typefaces, the spacing unit, elevation and motion have
  no token yet.
- The file is derived. Change the stylesheet, then run `make design-tokens`. The `tokens` check
  fails when the two disagree, whichever side moved.
- A tokens file a person already keeps, and that says something else, is never written over: the
  scripts say so and write none.

## The component manifest

`design/component-registry.json` (or the path the acceptance kit is told to read) lists every
component the repository's component library folder exports, and the components of its own in the
folder beside it: its name, its file, its variants and the default of each axis, its atomic level,
whether it comes from the library or is the repository's own, and the other components of its file
it is drawn with. Look a component up here before reading its source. The shape is in
`contract.md`.

- A variant is written `axis=value`, such as `size=sm`: the form a plan names it in.
- Variants are read from two places in the source: variant sets declared with the class-variance
  helper, and props typed as a closed list of words. A true/false prop is not a variant.
- The file is derived. Change the component, then run `make design-components`. The `components`
  check fails when the two disagree, whichever side moved.
- A repository may keep the file out of git, so that no pull request carries it and two pull
  requests that each touch a component do not meet in it. That is the repository's choice, off
  until asked for: `node tools/design-assembly/components.mjs --out-of-git` writes the choice into
  the tool data and says the two steps left for a person (add the file to `.gitignore`, take it
  out of the index); `--in-git` takes the choice back. The command never touches git itself. From
  then on the gate writes the file again from the source before it checks, so a clean checkout
  has it, and the `untracked` check fails while git tracks the file or does not ignore it. The
  guide carries the choice over on its next run. In a folder that is not a git repository, or on
  a machine with no git, the check has nothing to say; when git is there and will not answer, the
  check fails and says why. The gate writes over whatever is in the file, a hand edit included:
  the source is the only place a component changes.
- Whatever of the repository's own reads the file before the gate runs, a test for instance, finds
  none on a clean checkout. `node tools/design-assembly/derived.mjs` writes every derived file the
  repository keeps out of git and says which it wrote; it writes nothing in a repository that keeps
  none. The gate runs it first. The plugin's make step has it as `make design-derived`, and runs it
  before `make test` when the tests are a step of the gate (`test` is in `CHECK_TARGETS` where the
  step is included). There it says only what it wrote, and it is skipped where the installed tool
  has no such command yet. A test run some other way, by its runner alone, does not get it.
- A control (a component that renders something a person activates: a button, an input, a
  trigger, an item) is marked `control: true`, with `min_height`: the smallest height its own
  classes declare, over all its variants. A control without `min_height` takes its height from
  elsewhere, and is not measured.
- A component with no `variants` has none the reader could see. It is listed, and its variants are
  not checked.
- The level is computed from how deep a file imports other components: none is an atom, one step a
  molecule, two or more an organism. A component a page of a screen kind names as its frame is a
  template.
- States and the list of props are not in the manifest yet.
- A registry a person already keeps, and that says something else, is never written over.

## Target size

The `target-size` check holds the decision that every control reaches the target size of the
conformance level: 24 CSS pixels at AA (WCAG 2.2, 2.5.8), 44 at AAA (2.5.5).

- It reads heights from component source, not from a rendered screen: `h-`, `size-` and `min-h-`
  classes on the element the control renders and in the variant sets it calls. A size given to a
  child or a pseudo-element is not the control's. A pseudo-element placed around the control with
  a negative inset (`after:absolute after:-inset-y-2`) takes the pointer for it, so its inset is
  added to the height. A library part named `Root` is the control its library names
  (`CheckboxPrimitive.Root` is a checkbox).
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

## After an action

What happens on the screen once a person has acted. The first rule is held by the browser test of
every page; the others are a person's review, and the rules page says so.

- **Focus never falls on nothing** (`focus-after-action`). A control that leaves the page takes
  focus with it, and the browser hands focus to the document: a person at the keyboard is then
  nowhere. Focus moves to the same control on the row after the one that left (the button that
  opens a row's actions, where they are behind one), else on the row before, else to the button of the state shown in place of the table, else to the screen's top
  heading. A control that waits for an answer is held in a way that keeps focus. A button of a
  toast gives focus back to where the person was. The browser test checks, for every state that
  follows an action, that something has focus once the page has settled. It does not check that
  it is the right thing. Wherever focus is sent, it shows: a heading given `tabIndex={-1}` gets
  the same visible ring as a control.
- **A row's actions are in view** (`row-actions-in-view`). On a narrow screen a table scrolls
  sideways inside itself, and the column of actions, last in the row, ends up off the screen: a
  person sees a name and cannot act on it. The column of actions stays in place (`TableActionsHead`
  and `TableActions`, `table-actions.tsx` beside the floor's table; the guide installs them with
  the browser test, before any field is typed); the first column of a typed table stays too
  from 640px up. Pinning
  both on a phone leaves no room to read the columns between them, so there the name scrolls with
  the data. The browser test checks, at every width, that every control of the first row is
  inside the window, and that the pinned columns leave the scrolling band at least as wide as the
  widest column that scrolls. It reads the first row and the first table only, and a table built
  with other parts is held the same way.
- **A record beside a list** (`record-panel`). How one record of a list opens is the person's
  choice, made by sight on the specimen sheet (`specimen.mjs --section record`): `beside` the list
  where both fit (from 1024px; below that the record takes the list's place), `over` it as a side
  sheet, or `in-place` at every width. Where the floor's table and the browser test are, the guide
  installs `WithRecord` (`record-panel.tsx`, beside `held-label.tsx`), `useOpenRecord`
  (`src/lib/open-record.ts`) and their test, and writes the answer into the panel's one
  `RECORD_LAYOUT` line every time it runs; the rest of the panel is the repository's. The gate's
  `record-layout` check fails when that line differs from `design/blueprint.json`, so an answer
  changed without running the guide, or a hand edit, is caught. The browser test of every page
  measures any page with a record open: inside the window, beside the list or in its place as the
  line says, a dialog for `over`, and focus inside once a person opened it. A sheet `over` the
  list starts below the application frame's header (the page's banner landmark, measured when the
  sheet opens) and the test fails when the sheet starts above it or anything covers it. The header
  stays pressable with a pointer, which closes the sheet; the focus trap keeps the keyboard and a
  screen reader in the sheet until it closes. Every arrangement keeps
  the open record in the address (a link opens it, Back closes it) and gives focus back to what
  opened it. A screen that opens a record with a panel of its own is not caught. A blueprint
  written before this was asked keeps `patterns` planned: the guide then applies the proposal for
  the product type, `beside` for an application and `in-place` for a content site, and the row
  says a person has not confirmed it.
- **The actions of a row.** One shows as a button; two or more go behind one button on the row, at
  every width (two text buttons do not fit beside the data at 320px), that opens them as a list of buttons (a disclosure, not an ARIA menu: the browser tests,
  the floor's and this plugin's, reach a state by pressing a button), the ones that can be taken back first and a delete last. Each row waits on its own. A
  button that says it is working keeps its width: the guide installs `HeldLabel` beside the
  component library with the browser test, and the rules page names it. No check reads these: a
  person reviews them.
- **One item changing changes the list in place.** The row stays, with its controls held, until
  the answer; then it leaves, or stays and the failure is told. The loading state is for the
  first load and for trying again. Under a second nothing is shown; from a second on the control
  says it is working.
- **An undo puts the thing back where it was** and shows no second toast. The toast stays on the
  screen where the action was done; from another screen, the way back is that screen's own
  action. A failed undo says where the thing is now.
- **An empty state** says why it is empty and how items get there. It has a button only when the
  person can fill it from this screen.
- **Moving between screens** belongs to the application's frame: one place, the same order on
  every screen, the current screen marked. A screen does not link to other screens from beside
  its heading.

## One file per screen

A repository may keep the ledger of screens as a folder, `design/screens`, with one file per
screen named after the screen's id and one file, `_shared.yaml`, for everything that is not a
screen. Two changes that each add a screen then write two files, and do not meet in one. It is the
repository's choice, off until asked for; a repository that never asks keeps its one file and
nothing about it changes. The contract says the shape; this is what the command does.

- `node tools/design-assembly/screen-fragments.mjs` says which of the two the repository keeps.
- `--split` cuts `design/screens.yaml` into the folder. It says first every file it will write
  and that it removes the one file; `--dry-run` stops there. Lines are moved, not written again,
  so a comment and a key of the repository's own go where their screen goes. Before the one file
  is removed the fragments are read back: when an entry is lost or changed, when two entries
  share an id, when an id cannot be the name of a file (anything but plain letters, digits, dot,
  dash and underscore, or two ids that differ only by capitals), or when the folder already holds
  a file that would be read as a screen, it stops and writes nothing.
- `--join` takes it back: the one file again, the screens in the order of their ids, the
  fragments removed. A file of the repository's own in the folder is left where it is.
- `--print` writes the ledger as one text, whichever way it is kept, and changes nothing: for
  whatever of the repository's own still reads one file.
- `--copy` keeps that text as a file at the old path, `design/screens.yaml`, for the tools and
  tests of the repository's own that read it. The copy is derived: the folder stays the ledger,
  the gate and `derived.mjs` write the copy from it, and it is kept out of git, with the same
  `untracked` check as the component manifest. The command writes the choice and says the step left
  for a person, adding the file to `.gitignore`. It refuses where the ledger is one file, and where
  no gate holds the ledgers' shapes, since nothing would write the copy there. `--no-copy` takes the
  choice back and takes the copy away when it matches the folder. `--join` writes the one file in
  the copy's place and takes both choices back; the file then goes back into git.
- The command writes the choice into the tool data, as a check `screen-fragments` beside the one
  that holds the shapes of the ledgers, so a repository the guide built and one that adopted are
  held alike. The guide and adopting carry the choice over, and never write the one file again
  beside the folder. Where no gate holds the ledgers' shapes the command still splits, and says
  that nothing checks the fragments there. It never touches git: committing the folder and the
  removal of the one file is left to a person.
- The check fails when a file's name is not the id it holds, when a file has no id or lacks the
  shape of a screen, when `_shared.yaml` lists screens of its own, when the one file is back
  beside the folder and is not a copy the repository asked for, and when the folder is gone. The
  gate writes the copy again from the folder before it checks, over a hand edit too, as it does the
  component manifest: the folder is the only place a screen changes. Only a state read without that
  step, as an upgrade previews one, can hold a copy that differs, and the check names it.
- The test the guide installs, `tests/screens-ledger.test.ts`, reads either shape from this
  version on. One installed by an earlier version names the one file, and fails when that file is
  gone: delete it and run the guide again, or change its import the same way.

## One file per block

The intake ledger, `design/intake.yaml`, may be kept the same way, as `design/intake` with one file
per block named after its need. `screen-fragments.mjs --ledger intake` takes every flag above and
does the same with it; without `--ledger`, or with `--ledger screens`, the command is the ledger
of screens' as before. Each ledger's choices are its own: splitting, joining or copying one leaves
the other's checks in the tool data as they were.

- `--split` stops where two blocks name one need, or a block names none.
- The check is the same `screen-fragments`, carrying `of: intake`, and its copy's `untracked`
  check carries it too. It fails when a file's name is not the need it holds and when a file lacks
  the shape of a block, its approval day included, as well as on everything the screens' check
  fails on.
- A repository that spells the keys its own way says so under `keys` in the one file, and then in
  `_shared.yaml`: the command cuts the list by its own name and names each file by its own key.
- The ledger's path is the one the shapes check names under `ledgers.intake`, else the usual one.

## Which screens a change reaches

`node tools/design-assembly/affected.mjs`, or `make design-affected`, says which screens a change
reaches, and at which widths each is checked: test impact analysis. It only reads. It does not
change how a repository runs its tests; a repository's own runner may take the pattern it gives.

- The change is what differs from where the branch left the main one, what is not committed yet,
  and what git does not know yet; `--base REF` measures from elsewhere, and `--files` names the
  files instead, with no git needed.
- A screen is drawn from its page and from every file its page imports, however far. The page is
  the module the code that lists the screens loads at its route; where the folders of the source
  are the screens, the routes adapter finds the page at the route and the files that wrap it.
- Code the server runs on its own, which the routes adapter names (a route handler, the
  middleware), may change any screen that calls it while it runs, which no import shows: a changed
  file it reaches asks for the whole suite, even when a page imports it too.
- Imports are read as the build reads them: `from`, `import`, `import()` and `require()`, the
  aliases of the repository's TypeScript settings beside `@/`, a name ending `.js` for the `.ts`
  file it is built from, and a data file or a stylesheet a module imports. An import of the
  repository's own that names no file, or whose name is built while the code runs, cannot be
  followed: while a screen has one, every change of code asks for the whole suite.
- A screen's own file of a ledger kept as fragments reaches that screen alone.
- Whatever cannot be traced asks for the whole suite, with why: the stylesheet the tool data
  names, a file the tool data names global, the ledger of screens as one file or the part every
  screen shares, a file of no screen, and any code file while a screen's page cannot be found. A
  repository with no ledger of screens runs everything for any change.
- The tool data names the files that reach every screen and the files that reach none, as globs:
  `"affected": { "global": [...], "none": [...] }`. The guide and adopting keep it as it is. A
  file a screen imports is that screen's whatever `none` says.
- A screen is checked at the widths of `design/screen-sizes.json`, or at its own `sizes`.
- For a person: one line per screen, with the files that reach it, or why everything runs. With
  `--json`: `base`, `changed`, `all`, `why` (each with `file` and `reason`), `screens` (each with
  `id`, `route`, `sizes` and `why`), `unmapped`, and `grep`, a pattern that picks the tests whose
  names hold one of the routes. Tests that name no screen are the runner's to keep.
- It ends with 0 with an answer, and with 2 on a wrong call or a repository it cannot read.

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
  that kind, and that screen declares every required state. A screen the floor shipped as its
  sample counts while it is the only one; once the product has a screen of that kind, name one of
  the product's.
- **`primary-task`.** Recorded once the pages name it, as a person's call that nobody has
  confirmed. The order of the parts and what the words say are a person's rows to add.

The scripts never write a page: what a kind is for is decided with the person.

## What a screen shows, and which buttons it offers to whom

A screen of `design/screens.yaml` may say what it shows (`shows`, entities of the repository's
`ontology/`), the action a role must hold to open it (`entry`, null for every role) and the
actions it has buttons for (`actions`). Who sees a button is worked out, never declared: the roles
that open the screen and may run its action. Once a screen says any of this and the repository
declares actions, the row `screen-actions` is held by the tool. It fails:

- where an action of `ontology/actions.yaml` is offered on no screen to a role that may run it. A
  query action counts as offered where its entity is shown, also through an entity that lives by
  it (`lifecycle: { via: … }`). An action that has no screen is listed under `no_screen`, as
  `{ later: <where> }` or `{ never: <reason>, decided_by: <the person> }`;
- where a screen shows an entity to a role that opens it and holds no query action of that
  entity. An entity with no query action at all fails unless its file says `lifecycle.query`
  `later`; `never` fails too, since the screen shows it;
- where a button is one no role that opens its screen may run.

What the model plans `later`, an action only a planned screen offers, and a button whose action
the model marks `status: planned` are listed on every run, without failing. The model's
`lifecycle:` block is read when present, and a repository without one is checked the same way.
Every name comes from the repository being checked: the plugin keeps no vocabulary of its own. A
repository that already spells these keys its own way names them under `keys`.

Not checked here: where a button sits on the screen; that a role without the right does not see it
while the screen runs; which attributes an update changes; the difference between a right over
one's own records and over every record.

## What each role sees in a browser

A control that runs an action a screen's row lists in `actions` carries the action's name on itself,
`data-model-action="<action name>"`, wherever it is drawn: on a row, in the list behind a row's
actions button, in a dialog, on a toast. The rules page says so where the row `screen-actions` is
held and some screen declares a button. Where the repository also has the test browser of the
floor's browser checks and keeps its own file of ways in, `tests/e2e/roles.ts` (for each role of the
model, a function given the page that makes the browser that role and no other), the guide installs
`tests/e2e/screen-actions-seen.spec.ts`. It reads the gate's own table of screens by role
(`screen-actions-seen.mjs`, `walkPlanOf`), and for each built screen, each role that opens it and
the narrowest and widest width, enters by the role's way in and walks every state by the steps of
the screen list. It fails where a role does not see, at least once in a state it reached, a control
marked with each button the table gives it; where the walk met a control marked with an action
outside them, a locked one included, in a state it reached or on the way to one it did not reach;
where a role that holds every action of the screen does not reach a state; and where a role has no
way in. The guide never writes the file of ways in. Missing either, there is no row, and status
names what is missing. Adopting installs no test: for a repository that adopted, status names the
plugin's template to copy into place, and adopting then holds the row. A role that lacks an action
of the screen does not wait again for a control already found absent.

The row `screen-actions-seen` is held by the tool: the file of ways in is there, and the test is
there, names `decision:screen-actions-seen`, reads `walkPlanOf` and enters by that file. The tool
does not run the test. Not checked yet: what a role that may not open a screen sees there; a role
that opens no screen is not walked, though every test checks its way in; the frame's navigation; a
control of an action that does not carry its mark.

## Screen sizes and the page checks

`design/screen-sizes.json` lists the widths, in CSS pixels, that every page is checked at. The
narrowest is 320 or less: WCAG 2.2 asks that a page works at 320 without scrolling in two
directions. A part that needs two dimensions, such as a table of data, scrolls inside itself. A
repository adds the widths its own layouts change at.

Where the floor's browser checks are installed, the guide writes the file with 320 and 1440, and
installs a browser test that reads it. For every state of every screen, at every width, that test
checks one main region and one top heading, no sideways scroll, and the automated accessibility
checks, that focus is not lost after an action, and that a row's actions are in view. It names
`decision:one-main-one-h1`, `decision:no-sideways-scroll`, `decision:wcag-aa`,
`decision:focus-after-action` and `decision:row-actions-in-view`, so five rows point at it as
`claimed`. The row `test-screen-sizes` is held
by the tool: the widths reach down to 320, and the test opens the file and names its widths. The
tool reads the test's code, not its comments; it does not run the test, so a test that skips a
width is not caught. A failure of the browser test names the decision it belongs to.

## The system itself

Two rules about the system, and one about how it is bent on purpose.

- **`tier-direction`: which part may import which.** `design/parts.json` lists the parts of the
  code from the top down. A part names its files with globs, or says `"kinds": "design/patterns"`
  for the screens the pages of kinds name. A file is of the first part that names it, and every
  source file is of a part. A file imports only its own part and the parts listed after it. The
  guide writes the list once the kinds of screen are described: the files that start the
  application, the screens, the repository's own components (`shared`: the folder around the
  component library, without the library, where the library has such a folder), the component
  library, and everything else. A part may leave out files with `except` globs. What two screens
  share goes down a part: a piece of drawing becomes a component in `shared`; one screen's own
  drawing stays in that screen. The tool reads imports as they
  are written in source, static and dynamic; a lint rule on imports reads only the static ones.
  It does not follow an import into a package.
- **`escapes`: the record of what slipped past the checks.** `design/escapes.md` holds a table,
  one line per fault that every check let through and that a person or a later check then found:
  the date, what slipped, the layer that should have caught it, what was done. The tool checks
  that every line has all four and names a real layer. It cannot know that a fault was left out:
  an empty record passes, and the audit says that an empty record is not proof.
- **What the gate cannot hold, the rules page says.** A concept or an action a screen needs that
  the data model does not name is added to the data model first; an agent that may not change it
  stops and asks. A row of the ledger is for a rule a second screen must follow; one screen's own
  choice stays in that screen.
- **A departure on purpose stays beside the rule it bends, with its reason.** A lint exception
  says why after `--`. A screen excused from the states says why in `design/states.json`. A file
  left out of its kind says why on the kind's page (`ly_do`), which `page-layouts` now checks.
  There is no register to keep by hand: the audit counts all three in one line.

The file `design/patterns/lech-lot.md` is the acceptance kit's own record of screens that left
their frame. The audit accepts it for the tier; this tool does not write to it.

## Questions only the owner answers

The ledger stands in for the head of design: the machine chooses from the ledger and the
components, queues what they do not settle on the decision sheet, and goes on with its own
recommendation; a new kind of screen and the brand colour wait for the owner. Two rows of the
governance layer hold this, and the guide and adopting write both. What a branch adds is read from
git: against where the branch left the main branch (`origin/HEAD`, `main`, `master`, `origin/main`
or `origin/master`, the first git knows), with what is not committed yet.

- **`decision-sheet`: the total comparison.** It fails on a judgment row the branch adds or changes
  that no person answered and no question asks. A row is answered when its note carries what the
  decision sheet writes (`confirmed by`, `refused by`, `answered by`), or when the guide wrote it
  from a layer of `design/blueprint.json` that is the person's own or lists the choice under
  `confirmed`. It is asked when its note says a person has not confirmed it, which the sheet
  lists, or when a question of the waiting list names it with `item: decision:ID`. It also fails
  where source goes around a decided scale (the same detector as the audit: a raw colour, a type
  size, a spacing or a radius between square brackets, for a decision the ledger has a row for),
  and where a test of `tests/` names `decision:ID` for an id the ledger has no row for. It covers
  the choices a machine reads: values, components, kinds of screen, states, words and column
  types. Free layout inside one screen is outside it.
- **`owner-calls`: the wall.** It fails on a page under `design/patterns` that the branch adds,
  and on a root colour line (the last `--primary` of a top-level `:root` block of the stylesheet,
  as written) that differs from the base, until a question of the waiting list names that very
  item (`pattern:NAME`, or `source-color:VALUE` with the new value) and the owner kept it. A
  question asked and not answered, or answered with a refusal or other words, leaves it failing
  and says so. Raising a pull request's rank on the hosting service is not this tool's.
- **What is not compared.** Outside git, nothing: both pass, and the gate prints that it did not
  compare. A branch whose base has no decision ledger is where the repository meets the plugin,
  with the person, in the guide or while adopting: nothing it writes is compared, and nor is
  anything in a repository with no commit yet. Git that is
  there and cannot name a main branch fails both, rather than let a new kind of screen through
  unseen. A shallow checkout, as continuous integration makes one, fetches what it lacks from the
  remote named `origin`: the main branch (`main`, else `master`, or the one named; never the branch
  the remote's `HEAD` points at, which in a working folder used as a remote is the branch under
  check), then more history on both sides, 50 commits first and the step doubled for five rounds,
  then the whole history. The gate says when it fetched, as work done, not as a debt. Fetching
  writes the remote's ref of that branch and the depth of the checkout, so a shallow clone on a
  person's machine is deepened too. Each call to the remote gives up after two minutes, and git
  never asks for a password. Where the machine names no ssh command of its own, ssh is told never
  to ask either; one it names (`GIT_SSH_COMMAND`, `GIT_SSH` or `core.sshCommand`, such as the key a
  checkout of continuous integration sets) is used as it is. A shallow
  checkout with no `origin`, a remote with neither `main` nor `master` and none named, or a fetch
  that fails, fails both with what git said. A main branch of another name is named with
  `"main": "<name>"` on either check. Of several main branches git knows, the base is the newest place this branch left one, so
  a local `main` that was not pulled does not count what was merged since as this branch's. A file
  git cannot read at the base fails both; only a file the base does not have is an absence. An
  unreadable waiting list fails both. A person's answer to a judgment is read from the note of its
  row: an agent that writes one in is not caught (limit `decision-sheet-trusts-the-note`).

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
| `untracked`         | A derived file the repository keeps out of git is not tracked by git, and is ignored   |
| `screen-fragments`  | A ledger kept as one file per entry: each file is named after its id, or its need      |
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
| `import-direction`  | No source file imports a file of a part listed above its own                           |
| `slips`             | Every line of the record names a date, what slipped, a layer and what was done         |
| `decision-sheet`    | Every judgment the branch writes is answered or asked; nothing goes around a decision  |
| `owner-calls`       | A new kind of screen or root colour on the branch has the owner's kept answer          |
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

## What status reads

`scripts/status.mjs` writes nothing in the repository. It reads what the audit reads, and three
things of its own.

- **A row nobody confirmed.** A row of the ledger whose `note` says `a person has not confirmed it`
  (or `has not reviewed`) is a proposal: the guide proposed the answer, or it was read off the
  repository. Status lists it as waiting on the owner, with the call only a person can make that
  has no row at all. The ledger has no key yet for who confirmed a row and when; until it has, the
  wording of the note is the only sign.
- **The waiting list.** `design/waiting/`, or `design/waiting-list.json`, when the repository has one. Status lists
  every question of it that nobody answered; a permission and an answered row do not wait. Which
  row waits is the rule of the decision sheet, asked of `scripts/decide.mjs` and not written a
  second time. `/design-assembly:decide` takes the answer to such a question and to a row nobody
  confirmed; each entry of `waiting` says where it waits in `source`, `ledger` or `waiting-list`.
- **The tool stamp.** `design/tool-stamp.json`, when the repository has one: `version`, the
  version of the plugin the repository's copy of the tool came from, and `tree`, the hash git
  gives the folder `tools/design-assembly/` as a tree, as it was written. The guide, adopt and
  upgrade write it whenever they write the tool; it is not a ledger of the contract, and the gate
  does not read it. Status says which version the copy came from, and that the copy was changed
  after it was stamped when its tree is not the stamp's. Without a stamp, a repository adopted
  before stamps, status still compares the two folders by the same hash computed from the files,
  says `no stamp`, and names the version only when the copy is exactly the tool of a release in
  `references/releases.json`.

Status ends with `0` when nothing waits, `1` when something waits on a person, the tool differs, or
a decision is failing or bypassed, and `2` on a wrong call or a repository it cannot read.

## How every command is called and how it ends

The eleven commands that exist (`status`, `audit`, `find`, `inventory`, `intake`, `change`, `new`,
`decide`, `adopt`, `upgrade`, `handoff`)
share one contract, written once in `scripts/command.mjs` and held by
`tests/test-command-contract.mjs`.

- `--target DIR` names the repository. Without it the command reads the folder it is run from.
- `--json` prints one JSON document and nothing else. A key the specification lists that a command
  cannot give yet is left out, and a row of `references/limits.json` says so.
- `status`, `audit`, `find` and `inventory` only read: the tree is the same afterwards, byte for byte. With `--out DIR`
  they also write one document into that folder, and nowhere else (see the next section). `new`, `decide`,
  `adopt`, `upgrade`, `handoff`, `intake` and `change` take `--dry-run`, which lists the files the real run writes
  and writes nothing.
- A flag the command does not have is a wrong call, not something to pass over.

| Ends with | Means                                                                                                                     |
| --------- | ------------------------------------------------------------------------------------------------------------------------- |
| `0`       | Done, and nothing is left                                                                                                 |
| `1`       | Done, and there is work for a person or something to fix. Not an error                                                    |
| `2`       | A wrong call, or a repository that cannot be read. The reason is on the error stream, and nothing is printed as an answer |

What makes each command end with `1`:

| Command        | Ends with `1` when                                                                                 |
| -------------- | -------------------------------------------------------------------------------------------------- |
| `status`       | An answer waits on a person, the tool differs, or a decision is failing or bypassed                |
| `audit`        | A decision is not held, failing or bypassed                                                        |
| `find`         | No store answers the words asked for                                                               |
| `inventory`    | With `--strict`: something is found                                                                |
| `intake`       | A question waits on the owner, a file waits to be made, or the owner refused                       |
| `change`       | A question waits on the owner, or the owner refused                                                |
| any of the six | With `--out`: the document was written in fewer formats than asked                                 |
| `new`          | A built layer is not decided yet, or the preview shows a write that would be refused               |
| `decide`       | A question waits on the owner, or a call only a person can make that another command records       |
| `adopt`        | `needs a person` lists a question                                                                  |
| `upgrade`      | It stopped, writing nothing: a ledger entry would be lost, or the gate would be red                |
| `handoff`      | The book was written without every picture or in fewer formats than asked; a checked book is stale |

The `make` targets of this repository that call those commands end well on `0` and on `1`; only `2`
fails them. `make design-status` and `make design-decide` pass the `1` on.

## The document a command hands over

Every command has one document to hand over, and every document is set on one frame, written once
in `scripts/document.mjs` and held by `tests/test-document.mjs`. Seven commands hand theirs over
today.

| Command     | Document            | File                       |
| ----------- | ------------------- | -------------------------- |
| `status`    | Status report       | `status-report.html`       |
| `audit`     | Design audit report | `design-audit-report.html` |
| `find`      | Find report         | `find-report.html`         |
| `inventory` | Inventory report    | `inventory-report.html`    |
| `intake`    | Intake report       | `intake-report.html`       |
| `change`    | Change report       | `change-report.html`       |
| `upgrade`   | Release notes       | `release-notes.html`       |

- `--out DIR` writes the document into that folder, and nothing anywhere else. Without `--out` no
  file is written. A relative folder is read from where the command is run, never against the
  target. `--json` then has `files`: each file written, with `path` and `change`.
- The frame has six parts, always in this order, none ever dropped: the cover (the document's
  name, the repository, the date, the plugin's version, the scope examined); one page for the
  person who decides (the conclusion, the three things most worth attention, what they must
  decide); the findings by severity, each with its evidence; the recommendations, each with what
  it rests on and what to do; the next steps in order, each with the command to run; and what the
  document does not see, which lists the open rows of `references/limits.json` in its scope. A
  part with nothing to show says so in one line.
- A recommendation rests on a design principle the owner fixed, a standard, or a measurement on
  the repository. The frame refuses to draw a recommendation that names none of the three, a
  finding with no evidence, or more than three things on the page for the person.
- A design principle is one the owner fixed in the guide: a row `principle-<id>` of the context
  layer whose blueprint entry has `source: user` (`references/principles.json` holds the ones the
  guide offers, each with the options it favours). A principle the guide proposed settles nothing
  until it is kept on the decision sheet. The status report rests the call on a row of a choice
  such a principle speaks to on that principle; where two fixed principles favour two options, the
  standard stands and the disagreement is named.
- A direction of the guide (`references/directions.json`) gives each of its values a reason: a
  principle the owner fixed that favours it, the catalog principle the direction follows, or its
  character; a fixed principle that favours another option is named in that reason.
- A document is made from the facts of `--json` and from nothing else. It reads no clock: the date
  on the cover is the day of the repository's last commit, and the revision beside it carries a
  mark when work was not yet committed. The same repository gives the same page, byte for byte.
- The page is drawn in the repository's own look, read from its design tokens file by
  `scripts/family.mjs`, which the handoff book uses too; a repository without one gets plain
  values.
- `--format pdf` also prints the page to a pdf, with the browser in the target repository's own
  packages, through the one function that prints a page (`printPdf` in `scripts/stage.mjs`), which
  the handoff book uses too. Where the repository has no browser the page is still written,
  `not_written` says why, and the call ends with `1`. Two pdf files of one page are not the same
  bytes: the browser writes the moment of printing into the file.

## What decide reads and writes

`scripts/decide.mjs` gathers the questions that wait on the owner into one sheet. Without answers it
writes nothing. It reads two sources.

- **A row nobody confirmed.** The same rows status lists, by the same rule, with the recommendation
  and the basis status gives. A row is marked hard to undo when its layer is one every other layer
  is built on: context or foundations.
- **The waiting list.** Questions that wait on the owner and are not rows of a design ledger, when
  the repository has them. It is not a ledger of the contract; the gate reads it only for the
  decision sheet and the wall (see "Questions only the owner answers"). It is kept in one of two
  shapes, never both: `design/waiting/<id>.json`, one file per question named after its id, or
  the older `design/waiting-list.json`, one shared file with `version` 1 and `rows`. In a folder,
  a file that is not `.json` is no question and is left alone; two names that differ only by
  capitals cannot be read. A row has an `id` and a `question`, and may have a `kind` (`question`,
  the default, or `permission`), a `group` (the heading it is printed under), a `recommendation`,
  a `basis`, `hard_to_undo` (true or false), a `where` (the record that states it), an
  `if_refused` (what refusing costs), an `item` (the one thing it is about: `decision:ID`,
  `pattern:NAME` or `source-color:VALUE`) and `asked_on` (the day an agent asked it). A row of
  kind `permission` is something only the owner gives, step by step: it is listed, takes no
  answer, and is not counted. The questions of a folder are listed in the order of their ids.

A call only a person can make that the ledger has no row for is listed too, with the command that
records it; decide cannot take its answer.

Answers come from a file, one line each: the id, then `giữ` (or `keep`), `bác` (or `refuse`) with
a sentence saying what to change, or a value in the person's words. Each answer is written where
its question lives, with the name of the person and the date.

- **In the ledger,** only the note of the row changes: the clause that said nobody confirmed it
  becomes `confirmed by NAME on DATE`, `refused by NAME on DATE: SENTENCE` or
  `answered by NAME on DATE: VALUE`, put last in the note. The ledger has no key for who answered
  and when, and gains none: a repository that adopted earlier needs no newer tool to pass its gate.
  A kept answer to a row the guide writes from the blueprint is also listed under `confirmed` of
  its layer in `design/blueprint.json`, where the guide reads it.
- **In the waiting list,** the row gains `answer` (`keep`, `refuse`, `value`), `said`, `by` and
  `on`, and stays. In a folder only the files of the answered questions are written.

**Asking.** A building agent that meets a question nobody answered asks it with `--ask QUESTION`,
`--recommend TEXT`, `--because TEXT` and one of `--hard-to-undo` or `--easy-to-undo`; `--item`
names what it is about, `--id` its id (else one is made from the item, or from the words of the
question). Decide writes one new file under `design/waiting/` and touches no other file, so two
branches that each ask merge with nothing in common. It refuses, and writes nothing, when the
question is not whole, when its id waits already or is a row of the ledger, and when the waiting
list is still one shared file. It then tells the agent to go on with its own recommendation, or,
for an item of kind `pattern` or `source-color`, to stop: those are the owner's calls, and the wall
holds them. `--split` turns the shared file into one file per question; it writes the files from
memory, reads them back, and writes nothing if one question would not come back the same. The
shared file's own `about` is not a question and is printed, not kept.

A refusal is recorded and nothing else changes: no command of this version changes the value. One
answer that cannot be taken refuses the whole file. `--dry-run` prints each file a run would write
and what would change in it, and writes nothing.

Decide ends with `0` when no question waits, `1` while questions wait on the owner, and `2` on a
wrong call, answers that cannot be taken, or a repository it cannot read.

## What upgrade reads and writes

`scripts/upgrade.mjs` brings the installed plugin's tool into a repository that already runs a
copy of it. It reads the tool stamp, the repository's copy of the tool, the ledgers the tool writes,
and the repository as its gate reads it. Before it writes anything it prints, every time:

- **The tool files.** Each file of `tools/design-assembly/` that is created, updated, or deleted
  because the installed tool no longer has it. Names that start with a dot are left out, as they
  are from the tree of the stamp.
- **The ledgers the tool writes.** The design tokens file, the component manifest and the column
  types file, each as the installed tool would write it now, when this repository's checks name
  it. Each is compared with the file as it is, entry by entry: a token is one entry, a word of a
  list is one entry, a record of a list is read by its `name`, `id` or `file`, and anything else is
  followed down to its values. So a relation a component lost, one name in its `parts`, is one
  entry removed. The ledgers are written again only when the tool changes.
- **The decisions that change state.** Each row of `design/decisions.yaml` held one way under the
  repository's copy, run as its gate runs it, and another under the installed tool on the
  repository as the upgrade would leave it.
- **The gate.** The design-assembly step of the repository's gate, run by the installed tool on the
  repository as the upgrade would leave it: green, or red with each problem.

It stops and writes nothing, ending with `1`, when writing the ledgers again would remove an entry,
or when the gate would be red. `--accept-lost-entries` and `--accept-red-gate` say the person read
that and accepts it; the skill asks the person before passing either.

It writes the tool folder, the stamp, and the ledgers the tool writes. It never writes a ledger row
a person wrote, the stylesheet, a tool of the repository's own, or the gate step
`mk/design-assembly.mk`, which it compares and names when it differs. A repository with no copy of
the tool has nothing to upgrade: that is a wrong call, ending with `2`. `--remove`, in the
specification, is not built (limit `upgrade-has-no-remove`).

The version an upgrade brings is held in this plugin's own repository: `references/releases.json`
records, for every version, the git tree of `templates/`, of `scripts/` and of the tool, and that
repository's gate fails when they are not the trees recorded for the version the plugin says it
is, or when a version main has released is recorded again. `make plugin-version VERSION=x.y.z`
records a version.
