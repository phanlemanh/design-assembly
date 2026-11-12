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
| `design/tokens.json`                | The design tokens, for tools that do not read CSS. Written from the stylesheet               | `make design-tokens` only            |
| `design/component-registry.json`    | The component manifest: every exported component with its variants. Written from the source  | `make design-components` only        |
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

| Kind          | Passes when                                                                           |
| ------------- | ------------------------------------------------------------------------------------- |
| `generated`   | The block in the stylesheet is exactly what the source color gives                    |
| `contrast`    | Two color roles reach the contrast ratio of the conformance level                     |
| `value`       | A variable resolves to the decided value, whatever is written after it                |
| `absent`      | The stylesheet does not redeclare variables that the floor's scale owns               |
| `scale`       | Every step of the type scale is larger than the one before                            |
| `tokens`      | The design tokens file is exactly what the stylesheet gives                           |
| `components`  | The component manifest is exactly what the component source gives                     |
| `target-size` | Every control declares a height that reaches the target size of the conformance level |
| `gate`        | `make check` runs the tool in a way that can fail                                     |

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
