# design-assembly (plugin)

The engine of this repository: what a consuming repository installs so that Claude Code can build
screens from a design system without guessing. The app at the repository root is the proving
ground: whatever this plugin generates is shown there and graded by `make check`.

## What is here today

Only the manifest. There are no skills, hooks, commands or scripts yet, so installing the plugin
changes nothing. The first slice is described in
`wiki/specs/0001-design-system-for-claude-code.md`.

## What goes where

Add a folder only when its first real file exists.

| Path         | Holds                                                                 | Reaches the consuming repository as               |
| ------------ | --------------------------------------------------------------------- | ------------------------------------------------- |
| `scripts/`   | The generator: pure functions from seeds to values, shapes and checks | Files it writes, each with a check that can fail  |
| `templates/` | Component and screen sources the generator fills in                   | Code the repository then owns                     |
| `skills/`    | Procedures: how to assemble a screen, how to add a component          | Instructions loaded on demand                     |
| `hooks/`     | Checks that run after each edit                                       | Immediate feedback to the agent                   |
| `registry/`  | Machine-readable catalogue: component, variants, states               | What the agent looks up instead of reading source |

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
