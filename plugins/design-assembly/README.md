# design-assembly (plugin)

A guide. A person runs one command in their repository; the plugin leads them through decision
layers and leaves that repository with a design system Claude Code can build from without guessing,
plus a score.

The app at the repository root is the reference implementation: whatever this plugin generates is
shown there and graded by `make check`.

## What is here today

Two of the seven layers are built: product context, and foundations (color, type scale, spacing
scale, shape). Density, elevation, motion and iconography are not.

- `/design-assembly:audit` reads any repository without changing it. For each standard decision
  (`references/standard-decisions.json`) it says whether it is held, claimed, recorded, not held,
  bypassed or without a row, then the deliverable tier reached (`references/tiers.json`) and what
  the next tier misses.
- `/design-assembly:status` reads any repository without changing it and answers in one screen:
  the tier reached, one line per rhythm of the repository's life, every answer that waits on the
  owner with a recommendation and what it rests on, whether the repository's copy of the tool is
  the installed plugin's, and the command to run next. `--json` gives the same to another plugin.
- `/design-assembly:decide` puts every question that waits on the owner on one sheet, each with
  one recommendation and what it rests on, and takes the answers in one go: a row of the ledger
  nobody confirmed, and the rows of `design/waiting-list.json` when the repository keeps one. It
  writes an answer only when a person gave it, with their name and the date; a refusal stays, with
  what they said.
- `/design-assembly:adopt` takes in what a repository already has: a ledger row for each proof it
  already runs (`references/known-proofs.json`), and a check around each value its stylesheet holds
  today. It changes no value, no lint rule, no test and no existing row.
- `/design-assembly:new` guides a person through the built layers and records each decision.
- `scripts/specimen.mjs` shows the choices of foundations instead of describing them: it draws
  the repository's own screen once per option, in light and in dark, on one sheet, and a person
  answers with a letter. The options come from closed lists and the same functions that write the
  values, so what is seen is what the gate will hold.
- `scripts/apply.mjs` derives a tonal palette and the primary color roles from one source color,
  writes them into the repository's stylesheet, adds its rows to the ledger
  `design/decisions.yaml`, and installs the checks that hold them.
- Both paths leave `design/tokens.json`: the design tokens, written from the stylesheet in the
  format the acceptance kit reads, and held to the stylesheet by a check.
- The guide installs the data table layer: a table of column types, the file code reads from it,
  table parts that take alignment, width and row height from a field's column type, and checks
  that no screen sets them itself.
- Four rules about screens are read from source and held: every screen declares the states
  every view of data has, no screen writes its own words, an error message has both parts, and
  no screen opens a browser dialog or calls a toast library itself.
- A repository's own test that names a decision with `decision:<id>` is taken as a proof of it.
- Both paths leave `.claude/rules/design-assembly.md`: the rules held in that repository, written
  for the agent that builds the next screen.
- A row a repository already has, with no check, is named with what could hold it, and given its
  pointer only when a person says so.
- Both paths leave `design/component-registry.json`: the component manifest, written from the
  component source, with every variant an agent may use, and held to the source by a check.

What a repository ends up with is a standardised design system under its own `design/` folder,
reached tier by tier. The ledger is a format already in use in one of the owner's product
repositories; artifacts use the paths the acceptance kit already reads. `references/checks.md` describes
every file, and `references/contract.md` the one shape of each ledger that every reader relies on.

The guide generates the primary color roles, so it is for repositories with no brand values of
their own yet, and it refuses to write over values a repository holds as its own. Those
repositories adopt instead. Adopting reads a stylesheet across its relative imports and through
`var()`; a colour written as a mix is reported as not read, and gets no check.

## Adapters

The core works with the ledgers. Whatever must know one kind of repository lives in an adapter,
under `templates/tools/design-assembly/adapters/`: one per library or build tool, each saying its
kind and the names it owns.

| Kind         | Does                                                                            | Today      |
| ------------ | ------------------------------------------------------------------------------- | ---------- |
| `build`      | Opens a screen of the repository in a browser                                   | Vite       |
| `browser`    | Drives the browser the repository tests its pages with                          | Playwright |
| `values`     | Reads and writes the design values                                              | Tailwind 4 |
| `components` | Knows the component library's folder, and how a component declares its variants | shadcn     |
| `source`     | Reads screens and components to check words, states and controls                | React      |

`tests/test-adapters.mjs` fails when the core code names a library or build tool an adapter owns.
A new kind of repository needs its own adapters, not changes to the core. Beyond names, the core
still reads one stack's ways of writing in places: `references/limits.json` lists them.

## Vocabulary

Every name the guide shows to a person comes from `references/vocabulary.json`: industry terms, each
with its source and how far that source was checked. A professional designer should meet no new
word. Keep the term in English in every conversation language and explain it on first use.
`tests/plugin-vocabulary.test.ts` rejects a term without a source, and plugin text that uses a word
the list says to avoid.

## What goes where

Add a folder only when its first real file exists.

| Path          | Holds                                                         | Reaches the consuming repository as              |
| ------------- | ------------------------------------------------------------- | ------------------------------------------------ |
| `references/` | The vocabulary, the standard decisions, one page per layer    | What the guide says at each step                 |
| `skills/`     | The guide itself, and the score                               | Commands a person runs                           |
| `scripts/`    | Pure functions from a theme to design tokens and their checks | Files it writes, each with a check that can fail |
| `templates/`  | Component and template sources                                | Code the repository then owns                    |
| `hooks/`      | Design lint that runs after each edit                         | Immediate feedback to the agent                  |
| `registry/`   | The component manifest: components, variants, states          | What the agent looks up instead of reading code  |

## Rules for this folder

- English only. Text for end users lives in the consuming repository.
- No product context: nothing here may name a product, a customer or a business term.
- Every rule ships with a failing example and a passing one.
- A change that helps one repository is weighed against every repository that installs this.

## Try it locally

From a Claude Code session in any repository:

```text
/plugin marketplace add /absolute/path/to/design-assembly
/plugin install design-assembly@design-assembly
```

## Versions

`version` in `.claude-plugin/plugin.json` and in the marketplace entry at the repository root must
match. `tests/plugin-manifest.test.ts` checks it.
