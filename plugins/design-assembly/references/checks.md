# What the guide leaves in a repository, and how it is held

Read this when you build (step 6 of the guide) or explain a failing check.

## The files

| File                                | What it is                                                                                   | Who edits it                         |
| ----------------------------------- | -------------------------------------------------------------------------------------------- | ------------------------------------ |
| `design/blueprint.json`             | What the person chose, layer by layer, with why and what was turned down                     | You, during the guide                |
| `design/decisions.yaml`             | The ledger: one row per design decision, pointing at the proof that holds it                 | People, and the scripts for new rows |
| `design/theme.json`                 | What this plugin's tool needs to check its decisions: the inputs and the checks per decision | `apply.mjs` and `adopt.mjs` only     |
| `design/decisions/<layer>.md`       | A decision record per decided layer                                                          | `apply.mjs` only                     |
| The marked block in `src/index.css` | The design tokens                                                                            | `apply.mjs` only                     |
| `tools/design-assembly/`            | The checks. They belong to the plugin: change them in the plugin and run the guide again     | Nobody, in the repository            |
| `mk/design-assembly.mk`             | Adds `design-assembly` to `make check`, and `make design-rate`                               | Nobody, in the repository            |

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

## How a value is read

The tool reads the stylesheet the repository names (`design/theme.json`, else `components.json`,
else `src/index.css`), with its relative imports put in place. A variable that points at another
with `var()` is followed, down to the framework's own theme. A value it cannot turn into a colour,
such as a mix of two colours, is not guessed: the check says it cannot read it, and adopting adds
no check for it.

## What a check of this plugin is

Its tool reads the real files (the stylesheet, the gate), not a copy of what was intended. Every
run also changes a copy of those files so that the check must fail, and reports a check that still
passes: a check that cannot fail proves nothing.

| Kind        | Passes when                                                             |
| ----------- | ----------------------------------------------------------------------- |
| `generated` | The block in the stylesheet is exactly what the source color gives      |
| `contrast`  | Two color roles reach the contrast ratio of the conformance level       |
| `value`     | A variable resolves to the decided value, whatever is written after it  |
| `absent`    | The stylesheet does not redeclare variables that the floor's scale owns |
| `scale`     | Every step of the type scale is larger than the one before              |
| `gate`      | `make check` runs the tool in a way that can fail                       |

The tool also checks that it and the ledger agree in both directions: every row that points at it
has checks behind it, and every decision it holds is a row.

## Held, claimed, recorded

`make design-rate` lists every row of the ledger:

- `held`: this plugin's tool ran the check now and saw it fail on a changed copy.
- `claimed`: the row names another check (a lint rule, a test). It resolves, and was not run here.
- `recorded`: a judgment, written down. No check, by design.
- `no check`: decided, and nothing holds it yet.
- `FAILING`: the check fails, or the pointer does not resolve.

Visual regression and design lint for components are not in this version.
