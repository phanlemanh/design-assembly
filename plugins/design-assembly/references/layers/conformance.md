# Layer: conformance

**Framing.** How does the repository keep what was decided? Each decision the machine derived gets
a check, and the checks join the repository's own gate.

**Depends on:** foundations.

**Only one sensible answer when:** always, in this version. Say it in one line and move on.

## Options

| Option       | Why                                                                        | Trade-off                 | Wrong when | Label       |
| ------------ | -------------------------------------------------------------------------- | ------------------------- | ---------- | ----------- |
| `make-check` | The checks run in `make check`, so they also run in CI and for every agent | One more step in the gate | Never      | `automated` |

## What gets installed

- `tools/design-assembly/`: the checks. They belong to the plugin; change them in the plugin and
  run the guide again.
- `mk/design-assembly.mk`: adds the target `design-assembly` to `make check`, and `make
design-rate` to print the determinism rate.

## What a check is

A check reads the real files (the stylesheet, the gate), not a copy of what was intended. Every run
also changes a copy of those files so that the check must fail, and reports a check that still
passes: a check that cannot fail proves nothing.

Three kinds exist today:

| Kind        | Passes when                                                        |
| ----------- | ------------------------------------------------------------------ |
| `generated` | The block in the stylesheet is exactly what the source color gives |
| `contrast`  | Two color roles reach the contrast ratio of the conformance level  |
| `gate`      | `make check` runs the checks in a way that can fail                |

Visual regression and design lint for components are not in this version.

## Recording

Write to `layers.conformance` in `design/blueprint.json`: `status`, `source`, `choice`, `why`.

Choice keys:

- `gate`: `make-check`.
