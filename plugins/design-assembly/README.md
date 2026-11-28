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
- `/design-assembly:conform` conforms an item of an outside source before it is taken in: it records
  the item as taken down, every change to its code as a patch with its reason (the diff from the file
  as last committed), and each rule it is let off; it applies the patches again on a newer item as
  taken down, stopping and naming a patch that no longer fits; and it says whether the record holds.
  It uses the local git to make and apply a diff, fetches nothing and runs no install line.
- `/design-assembly:plugs` shows which plug works each socket of the capability table: the
  plugin's own, the plugs from outside that can fill it, where each stands in the repository,
  whether it was measured and in which decision record, and what it needs. Where a measured plug is
  in the repository it puts the choice to the owner on the waiting list, four questions at most a
  round, and writes each answer as a row `plug-<socket>` of the decision ledger with the owner's
  name and day. The skill passes the session's skills and servers, matched only to the names the
  plug files declare; a chosen plug that is not here falls back to the plugin's plug, with a line
  that says so. `--out DIR` writes the plugs board, and `new` and `adopt` run the step once.
- `/design-assembly:bring-in` reads what a tool from outside made (a token file, a DESIGN.md, an
  export of variables, or a system folder of tokens and a README) into one candidate direction,
  every expression and reference computed to its final value. The candidate is drawn beside the
  plugin's directions with `specimen --from`, and never written to a ledger; a value against one
  the owner settled is a question on the waiting list, and the ledger wins until they answer.
  `bring-in --ways` says, for a design tool whose plug file lists them, each way a person gets a
  file the command reads, the first first; no reader of a design file is bundled, downloaded or
  run. An export of variables that was brought in is kept with a pin: `scripts/variables-source.mjs`
  writes a row of the kind `variables` in the sources ledger from the file the repository keeps,
  and `--check` says when that file is no longer the one pinned.
- `/design-assembly:bring-out` writes the design ledgers out for tools that do not read them: a
  `DESIGN.md` and a design system bundle under `design/export/system/` (a README, tokens of both
  themes, the components and the assets), each stamped with the state of the ledgers. The gate goes
  red when a ledger changes and an export is not written again (`make design-exports`). It sends
  nothing anywhere.
- `/design-assembly:core` builds the core of a product family when a second product of it uses the
  plugin: it reads the answers a person settled in the family's first repository (from its
  blueprint, or from its decision ledger and token file when it was adopted), lays out the
  lock-or-default sheet of four questions, and, once a person answered, writes the family core, a
  folder of a fixed, versioned shape outside every repository of the family
  (`references/contract.md`). It never writes in the first repository, calls no network and pushes
  nothing; `--check` says what is wrong with a core folder. `--change` lets the family's owner change
  one answer of the core (its value, locked or a default, or an answer added from a repository
  where a person settled it), each change kept in the answer's history with who, when and why; it
  writes nothing in a member repository. `--join` lets a repository declare its family and pin the
  core, a copy kept inside it and compared by hash: each answer it already holds is compared, a
  locked one it holds otherwise becomes a question for its owner, and the gate holds the locked
  answers; `--settle` writes the owner's exceptions in; `--inherit` gives the guide's blueprint
  what the core answers; `--take` copies a block of the core out of that copy into the repository,
  once its owner kept it, to be conformed and taken in as an item of an outside source is. `--leave`
  lets a repository leave its family on its owner's word, with their name and reason: the
  declaration and the copy are removed, each answer it inherited becomes its own with its value as
  it was and a mark of where it once came from, the gate's check and the questions about the core
  are taken off, and the core's list of members loses it where the core folder can be reached. A
  machine that built or pinned a core keeps a list of them outside every repository, so `new` and
  `adopt` ask a new repository one question about its family, first and alone, holding back what a
  core of the list answers until it is answered; a repository that stands alone on a
  machine with no core is never asked about a family. `--moved` tells a member that its core moved ahead of its pin, answer by answer, where this machine can look at the core's folder (`status` and `inventory` say the same), and with `--draw` shows a change on the repository's own screen, before and after, in light and in dark; `--accept` and `--accept-all` take the core's answer for what a person accepts, and nothing follows by itself. `--publish` records the family owner's leave to publish the core to one private place and says first what would go where; no script calls the network, so the session pushes, after the person's yes. The plugin's one hook (`hooks/hooks.json`) prints one line at the start of a session when something about the core waits in the repository, and nothing otherwise. `--promote` lets the family's owner put a block of a repository's own store into the core on their word, saying "no second use yet" (a block of an outside source only with its licence line read out and a person's yes; `--replace` replaces a block's files, recording who and why); `--propose` lets a member propose upward a block it changed or an answer it holds otherwise, written in the core folder only, and the owner lists them with `--proposals` and answers with `--grant` (carried out as `--change` or the replace) or `--refuse`; `--retire` takes an answer or a block out of the core into `retired.json`, whole, with who, when and why, and a member that accepts it keeps what it had as its own. `--report` lets a repository of the family tell the core which needs it answered, each by its key, its name and what the block is for, never code, and which blocks of the core it uses (the store's entry then says who uses a block, and when that is its second use): the file is printed whole before it is written, in the core folder only; joining writes it too, leaving deletes it, and the family's first repository reports without joining. `find` and `intake` in a member then say when another repository of the family answered a need the family's store does not hold, and `--propose NEED --graduate` puts the question to the family's owner, who grants it (`--choose` where two repositories answered it in two ways; `--from` to promote at once from the repository that has the block) or refuses it; the periodic line of `status` says how many needs of the family wait on a graduation, and which.
- `/design-assembly:change` retires a block of the store, or merges it into the block of another
  need. It says the impact first: the screens that reach the block's file (every screen when that
  cannot be traced), the frame, the components that import it, the checks that name its file, and
  each import line to fix. Then it asks the owner once on the waiting list, and after the answer
  writes `retired` (and `merged_into`) into the block's entry, with the owner's name and day. It
  never removes a file and never changes a screen's code.
- `/design-assembly:brief` hands the builder of one screen one sheet, read once before the screen
  is built or changed. The screen is one of the ledger of screens, built or declared ahead
  (`status: planned`). The sheet has twelve slots, a closed list: the kind and the reference
  screen, what the screen shows, its actions and roles, its states, its components, its words, the
  rules that apply, the principles and the direction, the widths and the checks, changes to the
  data model, its place in the navigation, and the other screens it touches. Each slot is settled,
  with the file and the row or line the answer comes from, or the owner's answer with their name
  and the day; asked, with the question that waits and its recommendation; or open, with the very
  call of the decision sheet that asks it. It asks nothing itself and answers nothing: with
  `--queue` each open slot becomes one new file of the waiting list (item
  `screen:<screen id>:<slot>`), all of them or none, and nothing else is written. It ends with 0
  once all twelve are settled. The twelve slots are the choices every screen meets and not every
  question of one screen: the sheet says so, names where other choices of this screen hide (read
  from the repository), and gives the call that asks one. It compares the working tree with where
  the branch left the main one: a line read from what the branch wrote says so, what the branch
  wrote into the data model opens slot 10 by name, and a question that waits is held against what
  stands in the repository now; with no git or no main branch it says what it could not compare.
  The rules page tells a builder to run it first, where the repository has a ledger of screens.
- `/design-assembly:review` reviews one screen that is already built, by its picture. It draws the
  screen at every declared width, in light and in dark (and in every state with `--states`), and
  measures on what was drawn, with no model called, the contrast of text on its ground and text
  broken inside a word or cut off. Each finding has a number, its picture and place, how heavy it
  is, a way to fix it and the ledger row it rests on, or that it rests on none; a finding seen only
  in a theme no user can reach yet is low, and says why. Read-only: with `--out DIR` it writes the
  pictures, a pack for a reviewer (`review-pack.json`) and the design review record, where each
  finding is a numbered note on a picture, into that folder and nowhere else. No eye looks at the
  pictures yet, and every answer says so.
- `status` and `audit` each hand their answer over as a document: `--out DIR` writes the status
  report or the design audit report into that folder, as one page that needs nothing else, and
  `--format pdf` prints it too. Every document is set on one frame of six parts (the cover, one
  page for the person who decides, the findings with their evidence, the recommendations with
  what each rests on, the next steps, and what the document does not see), in the look of the
  repository and of the handoff book. Without `--out` no file is written.
- The handoff book (`/design-assembly:handoff`) has a sheet of dos and don'ts: for each rule the
  ledger holds that has a picture, a small example that keeps it and one that breaks it, drawn
  with the repository's own values (`scripts/examples.mjs`), and, where its screens can be drawn,
  its first screen as it is beside the same screen with only that rule broken by a stylesheet.
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
- Before any value, the owner fixes three to five design principles, picked from
  `references/principles.json` or written in their own words. Each is a row of the ledger, and
  every recommendation of the guide says what it rests on: a principle the owner fixed, or a
  standard (`scripts/principles.mjs`).
- Then whole design directions, from `references/directions.json`: three, each a colour, a type
  scale and a corner radius that go together, drawn on the repository's own screen in light and
  dark, the ones that agree best with the owner's principles first (`scripts/directions.mjs`,
  `specimen.mjs --section direction`). One letter sets all three; each value can be refined after.
- `scripts/specimen.mjs` shows the choices of foundations instead of describing them: it draws
  the repository's own screen once per option, in light and in dark, on one sheet, and a person
  answers with a letter. The options come from closed lists and the same functions that write the
  values, so what is seen is what the gate will hold.
- The typeface of running text and of headings is a choice of the foundations too: the floor's
  font or the system font. The gate holds the values the generated block names, and that each
  typeface the stylesheet names is loaded, as the adapter of the repository's build sees it load.
  Nothing is fetched. A font of the brand comes in through its row of the sources ledger, of the
  kind `font`, with its pin and its licence: `scripts/font-source.mjs` writes the row from a
  package the lockfile pins or files already in the repository, and a person writes the licence.
  The mark comes in the same way, as a row of the kind `logo`: `scripts/logo-source.mjs` writes it
  from files of the mark already in the repository, each with its role and its variant, and draws
  nothing; the foundations layer then chooses the floor's text or that row. With `--into` it adds
  files to that row. Once a repository has a logo row, the gate holds that the page icons and the
  images of the app frame are its files (`logo-use`), a new row or a changed file of one waits on
  the owner's word (`decide --ask --item logo:<id>`), `status` and `audit` say what the mark lacks,
  and the handoff book shows it on a page of brand assets. A mark brought in from files waits on a
  person's sentence of who holds the right to use it; a mark built in the repository, from a
  package a plug left (`logo-source --package`), is the repository's asset as its code is: its row
  carries the licence of that rule, says so under `licence_from`, and waits on no sentence.
- The icon set comes in the same way, as a row of the kind `icon-set`: `scripts/icon-source.mjs`
  writes it from a package the lockfile pins or a folder of the repository's own icon files, each
  hashed where it is; adopt proposes it from the icon set the component library's settings name.
  A set that is an outside package is used under the licence that package declares: the command
  reads it from the installed package, writes it into the row and says where it came from
  (`licence_from`); where the package declares none or is not installed, and for a folder of the
  repository's own files, a person writes the licence. Which icon set the product takes is the
  owner's call: a row written for a set the owner has not kept puts one question on the waiting
  list (`icon-set:<id>`), and the wall holds a branch that adds the row until the owner keeps it.
  The gate holds the pin once a row is there.
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
  for the agent that builds the next screen. It opens with the principles the owner fixed and
  the direction they took, where the blueprint has them.
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

| Kind         | Does                                                                            | Today                              |
| ------------ | ------------------------------------------------------------------------------- | ---------------------------------- |
| `build`      | Opens a screen of the repository in a browser                                   | Vite, Next.js                      |
| `browser`    | Drives the browser the repository tests its pages with                          | Playwright                         |
| `values`     | Reads and writes the design values                                              | Tailwind 4                         |
| `components` | Knows the component library's folder, and how a component declares its variants | shadcn, in the app or in a package |
| `source`     | Reads screens and components to check words, states and controls                | React                              |
| `lint`       | Runs the repository's own lint on a text, to see which of its rules reject it   | ESLint                             |
| `routes`     | Knows which files draw the screen at a route, where the folders say it          | Next.js                            |

A repository is drawn with the build its packages name, and with the first build when they name
none. A build adapter says what its server does (`serves`): the Next.js one runs the repository's
own development server apart from the plugin, so it serves no page of the plugin's own and loads no
module for it. There the book draws each screen of the ledger of screens as it opens at its route,
and says that the components and the other states are not drawn; the record section of the
sheet is not drawn.

The component library's files are read from its settings, never guessed from a folder's name: an
alias of the package's own is followed through its exports, so a library kept in a package of a
monorepo is found there. Where the library shares its folder with the package's own components,
only the files named for one of the library's items are its own (the items are its registry's,
kept in the adapter with the day they were read). Every check that leaves the library out reads
that one list.

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
