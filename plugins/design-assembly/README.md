# design-assembly (plugin)

A guide. A person runs one command in their repository; the plugin leads them through decision
layers and leaves that repository with a design system Claude Code can build from without guessing,
plus a score.

The app at the repository root is the reference implementation: whatever this plugin generates is
shown there and graded by `make check`.

## What is here today

Four of the ten decision layers: product context, accessibility, foundations (color, type scale,
spacing scale, shape) and conformance. Density, elevation, motion and iconography are not built.

- `/design-assembly:new` guides a person through those layers and records each decision.
- `scripts/apply.mjs` derives a tonal palette and the primary color roles from one source color,
  writes them into the repository's stylesheet, and installs the checks that hold them.
- `/design-assembly:audit` reports the determinism rate.

The other six layers are listed in `references/layers.json` as not built. The guide has not yet been
run from an installed plugin in a fresh session; the machine parts are covered by `tests/`.

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
| `references/` | The vocabulary, and one page per decision layer               | What the guide says at each step                 |
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
