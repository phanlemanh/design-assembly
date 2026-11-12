---
name: audit
description: Audit a repository's design system without changing it — measure how many of the standard design decisions it answers, say which are held, claimed, recorded, not held, bypassed or have no row, which deliverable tier the repository has reached, and what the next tier is missing. Works on any repository, whether it has no design system, a partial one or a complete one. Use when the user asks where their design system stands, how deterministic or complete it is, what to do next, or why a design check fails.
---

# Audit the design system of a repository

Read-only. It changes nothing, and it does not need the design floor. Run it first on any
repository, before the guide.

Scripts are in `${CLAUDE_PLUGIN_ROOT}/scripts/` (if the variable is not expanded, use the `scripts/`
folder two levels above this file).

## 1. Run it

`node ${CLAUDE_PLUGIN_ROOT}/scripts/inventory.mjs --target <repo>`. Add `--all` to list every core
decision, not only the open ones, and `--json` for the data.

It measures the repository against `references/standard-decisions.json`: the decisions a design
system has to answer. A decision seen in two or more sources is core; a tier needs its core
decisions.

## 2. Read the coverage line

"N of M core decisions answered", then how: held and re-run here, claimed and not re-run, recorded.
Give the three numbers separately. Never add claimed to held.

## 3. Read the states

| State       | Meaning                                                                                  | What closes it                                      |
| ----------- | ---------------------------------------------------------------------------------------- | --------------------------------------------------- |
| `held`      | This plugin's tool ran the check now and saw it fail on a changed copy                   | Nothing                                             |
| `claimed`   | The ledger or a lint rule names a check that resolves; the audit did not run it          | Nothing, if the claim is true                       |
| `recorded`  | A person's call is written down. No check, by design                                     | Nothing                                             |
| `not held`  | It is decided, and nothing would catch a change                                          | A check, and its pointer in the ledger              |
| `no row`    | The ledger has no row and the audit can see nothing: never decided, or decided elsewhere | A row in the ledger, once a person says which it is |
| `undecided` | The audit can see that nothing answers it                                                | A person decides                                    |
| `BYPASSED`  | It is decided, and the repository's own source goes around it in the places listed       | Fix those places first: a check would fail today    |
| `FAILING`   | Its check fails, or its pointer does not resolve                                         | Read the reason printed under it                    |

## 4. Read the tiers

Lowest first: audit, foundations, core components, interaction patterns and content guidelines,
templates, governance (`references/tiers.json`). Each says:

- `reached`: every core decision is held or recorded, and the artifacts are in place.
- `claimed`: complete, but some decisions rest on checks the audit did not re-run. Say so.
- `not reached`, with the open decisions and the missing artifacts. Artifacts are named by the path
  the acceptance kit reads them from, when the repository's `_acceptance/config.yaml` names one.

## 5. Say what to do next

- Anything `BYPASSED` or `FAILING`: list it first. That work is the repository's own.
- The lowest tier that is not reached: name its open decisions and missing artifacts. Do not list
  higher tiers in detail unless asked.
- `no row` or `undecided`, in a repository that has no brand values of its own yet: offer
  `/design-assembly:new`.
- The same in a repository that already has its own values: do not offer the guide. This version
  generates the primary color roles from a source color and would replace the ones the repository
  has. Adding rows and checks around existing values is not built yet; say so.
- If the ledger uses older layer names, say that they are read as they are and can be renamed
  whenever convenient.
- Say what the audit does not measure: whether the screens look good or serve their users.

Use the terms in `references/vocabulary.json`.
