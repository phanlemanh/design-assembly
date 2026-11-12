---
name: adopt
description: Take in the design system a repository already has, without changing it — add ledger rows for the proofs the repository already runs (lint rules, guard tools, tagged tests) and add checks around the values its stylesheet holds today (contrast of the color roles, corner radius, type scale, spacing unit), so that a later change to them fails the gate. Never rewrites the stylesheet, the lint configuration, a test or an existing ledger row. Use when a repository has its own brand values or a partial design system and the user wants it held, standardised or made deterministic for agents, or when an audit shows decisions with no row that the repository visibly answers.
---

# Adopt what a repository already has

The guide (`/design-assembly:new`) generates values. This does the opposite: it keeps the values
the repository has and puts a row and a check around each one it can read.

Scripts are in `${CLAUDE_PLUGIN_ROOT}/scripts/` (if the variable is not expanded, use the `scripts/`
folder two levels above this file).

## 1. Audit first

Run `/design-assembly:audit`. Anything `BYPASSED` or `FAILING` is the repository's own work and
comes first: adopting does not fix it.

## 2. Preview

`node ${CLAUDE_PLUGIN_ROOT}/scripts/adopt.mjs --target <repo> --dry-run`. Nothing is written. Read
the sections to the person in this order:

| Section                                              | What it means                                                                                      |
| ---------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| `contrast ratios today`                              | The ratio each pair of color roles reaches now, per mode. Read the numbers; never estimate them    |
| `rows to add`, `held`                                | A value this plugin's tool will check: it passes now and was seen failing on a changed copy        |
| `rows to add`, `claimed`                             | A proof the repository already runs, named in the ledger. Not run here. Say so                     |
| `rows to add`, `recorded`                            | A person's call, written on their word                                                             |
| `would fail today, so nothing was added`             | The value does not meet the stated level. The repository fixes it, or the person decides otherwise |
| `cannot be read here`                                | Written in a way the tool does not read, such as a mixed colour. No check, and no claim            |
| `a proof is there but the ledger cannot point at it` | Usually a test that does not name its decision with `decision:<id>`. One comment line closes it    |
| `needs a person`                                     | The questions in step 3                                                                            |

## 3. Ask only what a person must decide

At most two questions, together:

- The conformance level, AA or AAA, when no row records it. Show the ratios first. Pass the answer
  as `--conformance-level`.
- Whether the primary color role the script shows is the decided brand colour. Only on a yes, pass
  `--record source-color`.

Never pass either flag on your own judgment. A stated level that the values do not reach is not a
reason to lower the level: report it.

## 4. Write

Run the same command without `--dry-run`, with the flags the person gave. It adds rows to
`design/decisions.yaml`, and, when it holds any value, `design/theme.json`,
`tools/design-assembly/` and `mk/design-assembly.mk`. Then run the repository's gate.

Running it again adds only what is new. A row already in the ledger is never rewritten.

## 5. Say what is now true, and what is not

- Give held, claimed and recorded as three numbers. Never add claimed to held.
- A contrast row covers the pairs listed in its note: the primary on the background and the text on
  the primary, in the modes that could be read. It does not cover every pair of color roles.
- Name everything under `cannot be read here` and `a proof is there`: those are still open.
- After adopting, the guide refuses to generate over the adopted values. `--replace` on the guide
  is the person's decision to give them up.
- Run the audit again and give the new coverage line.

Use the terms in `references/vocabulary.json`.
