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
  What waits is read from the ledgers and from the waiting list, `design/waiting/`.
- `/design-assembly:find` says whether the store already answers a need before anything new is
  built: the repository's own blocks, components and kinds of screen first, then the starter kit
  (`references/starter.json`), then the outside sources it pinned under `design/sources/`, stopping
  at the first that answers. It matches words, never meaning, calls no model and fetches nothing.
- `/design-assembly:inventory` takes stock of the store: how many pieces each store and each kind
  holds, the state of each piece of the repository (in use, unused, retired, retired and still in
  use), six kinds of finding (`unused`, `unrecorded`, `duplicate`, `outdated`, `modified`,
  `promote`), each with its evidence, and what it could not look at and why. Read-only; `--strict`
  ends with 1 on a finding.
- `/design-assembly:intake` takes a block into the store for a need, by three rungs: the block the
  intake ledger keeps for that need; else up to three candidates from the starter kit or the pinned
  sources, put to the owner as one question of the waiting list; else made by hand, with why. Once
  the owner answers on the decision sheet, it copies the starter kit's files or takes the file named,
  and writes one row with the owner's name and day. It never runs an install line and never writes
  a person's name before that person answered. `--before` lists what screens used before the ledger
  was kept, once the owner keeps it.
- `/design-assembly:change` retires a block of the store, or merges it into the block of another
  need. It says the impact first: the screens that reach the block's file (every screen when that
  cannot be traced), the frame, the components that import it, the checks that name its file, and
  each import line to fix. Then it asks the owner once on the waiting list, and after the answer
  writes `retired` (and `merged_into`) into the block's entry, with the owner's name and day. It
  never removes a file and never changes a screen's code.
- `status` and `audit` each hand their answer over as a document: `--out DIR` writes the status
  report or the design audit report into that folder, as one page that needs nothing else, and
  `--format pdf` prints it too. Every document is set on one frame of six parts (the cover, one
  page for the person who decides, the findings with their evidence, the recommendations with
  what each rests on, the next steps, and what the document does not see), in the look of the
  repository and of the handoff book. Without `--out` no file is written.
- `/design-assembly:decide` puts every question that waits on the owner on one sheet, each with
  one recommendation and what it rests on, and takes the answers in one go: a row of the ledger
  nobody confirmed, and the questions of the waiting list when the repository keeps one. It
  writes an answer only when a person gave it, with their name and the date; a refusal stays, with
  what they said.
  An agent that builds queues a question with `--ask`, one new file under `design/waiting/`, and
  goes on with its own recommendation; a new kind of screen and the brand colour wait for the
  owner, and the gate holds both (`decision-sheet`, `owner-calls`).
- `/design-assembly:upgrade` brings the installed plugin's tool into a repository that already runs
  a copy of it. It previews first, every time: the tool files that change, the entries of the
  ledgers the tool writes that would be added, removed or changed, the decisions that change state,
  and whether the repository's gate stays green. It writes the tool folder, the tool stamp
  (`design/tool-stamp.json`) and those ledgers, and stops without writing when an entry would be
  lost or the gate would be red, unless the person accepts it. `--out DIR` writes the release
  notes. The guide and adopt write the stamp too, so status can say which version a copy came from
  and whether it was changed since.
- Every command takes `--target DIR` (the folder it is run from when not given) and `--json` (one
  JSON document for another plugin), and ends with `0` when done, `1` when done with work left
  for a person or something to fix, and `2` on a wrong call or a repository it cannot read. The
  commands that write take `--dry-run`. `references/checks.md` has the table.
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
| `lint`       | Runs the repository's own lint on a text, to see which of its rules reject it   | ESLint     |
| `routes`     | Knows which files draw the screen at a route, where the folders say it          | Next.js    |

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

The version goes up whenever a change reaches what a repository receives: anything under
`templates/`, and the scripts under `scripts/`. `references/releases.json` records, for each
version, the git tree of those two folders and of the tool a repository copies; the gate of this
repository (`make plugin-version-check`) fails when they are not the trees recorded for the current
version, and when a version main has released is recorded again with other trees. After such a
change, run `make plugin-version VERSION=x.y.z` with the next version (or with the current one, while
main has not released it): it writes both manifests, the record, and this repository's own tool
stamp.

Renamed in 0.9.0: the audit runs from `scripts/audit.mjs`, and its function is `audit`. In 0.9.0
`scripts/inventory.mjs` refused every call with exit `2` and named the new script; from 0.11.0 it is
the inventory command of the reusable store, which answers the same flags differently.
