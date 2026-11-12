---
name: audit
description: Audit a repository's design system without changing it — measure how many of the standard design decisions it answers, say which are held, claimed, recorded, not held, bypassed or have no row, which deliverable tier the repository has reached, what the next tier is missing, and which skill to run next. Works on any repository, whether it has no design system, a partial one or a complete one. Use when the user asks where their design system stands, how deterministic or complete it is, what to do next, or why a design check fails.
---

# Audit the design system of a repository

Read-only. It changes nothing, and it does not need the design floor. Run it first on any
repository, before the guide and before adopting.

Scripts are in `${CLAUDE_PLUGIN_ROOT}/scripts/` (if the variable is not expanded, use the `scripts/`
folder two levels above this file).

## 1. Run it

`node ${CLAUDE_PLUGIN_ROOT}/scripts/inventory.mjs --target <repo>`. Add `--all` to list every core
decision, not only the open ones, and `--json` for the data.

It measures the repository against `references/standard-decisions.json`: the decisions a design
system has to answer. A decision seen in two or more sources is core; a tier needs its core
decisions.

## 2. Read the first lines

- `source files read`: the repository's own screens and components, searched for values written
  around a scale. Files of the component library are left out.
- `coverage`: "N of M core decisions answered", then how: held and re-run here, claimed and not
  re-run, recorded. Give the three numbers separately. Never add claimed to held.
- `beyond the core`: rows of the ledger for standard decisions only one source names. They are not
  in the coverage numbers.
- `ledger`: every row of `design/decisions.yaml`, core or not, and how many name a check that
  exists and is wired into the gate.

A decision is answered only when the ledger has a row for it. What the audit can see without a row
is printed under the decision as `seen:` and is not an answer.

## 3. Read the states

| State       | Meaning                                                                    | What closes it                                                                                        |
| ----------- | -------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| `held`      | This plugin's tool ran the check now and saw it fail on a changed copy     | Nothing. `covers:` says how far the check reaches                                                     |
| `claimed`   | The ledger names a check that exists and is wired in; nothing here ran it  | Nothing, if the claim is true                                                                         |
| `recorded`  | The ledger has a row for a person's call. No check, by design              | Nothing. A `note:` under it says when the guide proposed it and nobody confirmed                      |
| `not held`  | The ledger has a row for it, and the row names no check                    | A check, and its pointer in the row. `seen:` names a proof the row does not point at, if one is there |
| `no row`    | The ledger has no row. `seen:` says what the repository shows, if anything | See below                                                                                             |
| `undecided` | The audit can see that nothing answers it                                  | A person decides                                                                                      |
| `BYPASSED`  | The repository's own source goes around it in the places listed            | Fix those places first: a check would fail today                                                      |
| `FAILING`   | Its check fails, or its pointer does not resolve                           | Read the reason printed under it                                                                      |

Under a `no row` decision, `seen:` is one of:

- "a proof the repository already runs": a lint rule or a tool. Adopting adds the row.
- "a proof the ledger cannot point at yet": usually a test that does not name its decision.
  Adopting reports it and adds nothing.
- a value that looks like the answer, ending in "a person confirms it". It is not the person's
  decision until they say so.
- nothing: never decided, or decided somewhere the audit cannot read.

## 4. Read the tiers

Lowest first: audit, foundations, core components, interaction patterns and content guidelines,
templates, governance (`references/tiers.json`). Each says:

- `reached`: every core decision is held or recorded, and the artifacts are in place.
- `claimed`: complete, but some decisions rest on checks the audit did not re-run. Say so.
- `not reached`, with the open decisions and the missing artifacts. A missing artifact is printed
  with the path the acceptance kit reads it from and, in brackets, what it is.
- `complete, but a lower tier is not`: its own decisions and artifacts are there. It does not count
  as reached while a tier below it is not.

## 5. Say what to do next

The last line, `next:`, names the skill to run. It is decided from the files, not from a reading of
the report: follow it, and repeat its reason to the person.

- `/design-assembly:new, ...`: the repository has no brand colour of its own. The guide chooses
  the values with the person, and ends by adopting what the repository already proves: there is
  no separate adopt step to run after it.
- `/design-assembly:adopt`: there is something to take in. When it adds "Not the guide", the
  stylesheet has a primary color role of its own, which the guide would replace.
- "nothing more to generate or adopt now": the scripts have nothing left to do. The line names
  what the repository can still close by itself, such as a test that needs a `decision:<id>` tag;
  the rest belongs to layers this version does not build. Do not invent a way to close those.

Before that line:

- Anything `BYPASSED` or `FAILING`: list it first. That work is the repository's own.
- The lowest tier that is not reached: name its open decisions and missing artifacts. Do not list
  higher tiers in detail unless asked.
- If the ledger uses older layer names, say that they are read as they are and can be renamed
  whenever convenient.
- Say what the audit does not measure: whether the screens look good or serve their users.

Use the terms in `references/vocabulary.json`.
