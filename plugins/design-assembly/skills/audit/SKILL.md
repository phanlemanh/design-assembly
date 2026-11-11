---
name: audit
description: Report how much of a repository's design system is held by checks that can fail — the determinism rate — and explain each decision that is failing or has no check. Use when the user asks how deterministic, how complete or how well guarded their design system is, wants a score for it, or asks why a design check fails.
---

# Audit the design system of a repository

Read-only. It changes nothing.

## 1. Run it

In the repository: `make design-rate`. If the target does not exist, the guide has not been run
there: say so and offer `/design-assembly:new`.

## 2. Read the result

The first line is the determinism rate: decisions held, out of all decisions. Then one line per
decision:

| State      | Meaning                                                                           |
| ---------- | --------------------------------------------------------------------------------- |
| `held`     | A check passes on the real files, and was seen failing on a changed copy          |
| `no check` | Nothing holds this decision. Expected for kind judgment, a gap for any other kind |
| `FAILING`  | The check fails, or it cannot fail and so proves nothing                          |

The kinds, from firmest to loosest: `standard` (an existing standard is used as is), `formula` (the
same input gives the same result), `closed-list` (one of a fixed set), `judgment` (a person
decided; no machine can).

## 3. Explain

- For each `FAILING` line, give the message the check printed and the fix. The fix changes the
  cause: a hand edit in the generated block is undone by running the guide again; a rule that
  lowers a contrast ratio is removed or the source color is changed in the blueprint.
- For each `no check` line that is not of kind judgment, say that it is a gap and which layer
  would close it.
- Say what the rate does not measure: whether the screens look good or serve their users, and
  anything in layers that are not built yet.

Use the terms in `references/vocabulary.json`.
