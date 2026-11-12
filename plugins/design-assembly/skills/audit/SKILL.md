---
name: audit
description: Audit a repository's design system without changing it — say which design decisions are undecided, bypassed, decided but not held, claimed or held, which deliverable tier the repository has reached, and what the next tier is missing. Works on any repository, whether it has no design system, a partial one or a complete one. Use when the user asks where their design system stands, how deterministic or complete it is, what to do next, or why a design check fails.
---

# Audit the design system of a repository

Read-only. It changes nothing, and it does not need the design floor. Run it first on any
repository, before the guide.

Scripts are in `${CLAUDE_PLUGIN_ROOT}/scripts/` (if the variable is not expanded, use the `scripts/`
folder two levels above this file).

## 1. Run it

`node ${CLAUDE_PLUGIN_ROOT}/scripts/inventory.mjs --target <repo>` (add `--json` for the data).

If the repository has run the guide, also run `make design-rate` there: it lists every decision in
the ledger with its check.

## 2. Read the decisions

One line per foundations decision:

| State       | Meaning                                                                                | What closes it                                   |
| ----------- | -------------------------------------------------------------------------------------- | ------------------------------------------------ |
| `undecided` | Nothing in the repository answers it                                                   | A person decides, in the guide                   |
| `BYPASSED`  | It is decided, and the repository's own source goes around it in the places listed     | Fix those places first; a check would fail today |
| `not held`  | It is decided and followed, and nothing would catch a change                           | The guide adds a check; the value stays          |
| `claimed`   | The repository's own ledger or lint says a check exists; the audit did not run it      | Nothing, if the claim is true                    |
| `held`      | A check was run now, passed on the real files, and was seen failing on a changed copy  | Nothing                                          |
| `recorded`  | A person's call (product type, conformance level) is written down. No check, by design | Nothing                                          |

Never turn `claimed` into `held` in what you tell the person. Say whose claim it is.

## 3. Read the tiers

The tiers are named in `references/tiers.json`, lowest first: audit, foundations, core components,
interaction patterns and content guidelines, templates, governance. Each line says reached, not
reached with what is missing, or "artifacts present, not verified in this version". A tier above
foundations is never called reached by this version: say that the files exist and that nothing
here has checked them.

The missing artifacts are named by the path the acceptance kit reads them from, when the
repository's `_acceptance/config.yaml` names one.

## 4. Say what to do next

- Anything `BYPASSED`: list the files. That is the first work, and it is the repository's own.
- Anything `undecided` or `not held`, in a repository that has no brand values of its own yet:
  offer `/design-assembly:new`.
- The same in a repository that already has its own values: do not offer the guide. This version
  of the guide generates the primary color roles from a source color and would replace the ones
  the repository has. Adding checks around existing values is not built yet; say so.
- The first tier that is not reached: name its missing artifacts.
- Say what the audit does not measure: whether the screens look good or serve their users, and
  anything above foundations beyond the presence of files.

Use the terms in `references/vocabulary.json`.
