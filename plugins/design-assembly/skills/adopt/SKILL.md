---
name: adopt
description: Take in the design system a repository already has, without changing it — add ledger rows for the proofs the repository already runs (lint rules, guard tools, tagged tests), add checks around the values its stylesheet holds today (contrast of the primary color roles, corner radius, that the framework's type scale and spacing unit are not overridden), and write the design tokens file and the component manifest from what is there, so that a later change fails the gate. Never rewrites the stylesheet, the lint configuration, a test, an existing ledger row or a design file a person already keeps. Use when a repository has its own brand values or a partial design system and the user wants it kept and held, or when the audit's `next:` line names this skill.
---

# Adopt what a repository already has

The guide (`/design-assembly:new`) generates values. This does the opposite: it keeps the values
the repository has and puts a row and a check around each one it can read.

Scripts are in `${CLAUDE_PLUGIN_ROOT}/scripts/` (if the variable is not expanded, use the `scripts/`
folder two levels above this file). `references/checks.md` says what each file and each kind of
check is: read it before explaining a result.

## 1. Audit first

Run `/design-assembly:audit`. Anything `BYPASSED` or `FAILING` is the repository's own work and
comes first: adopting does not fix it.

## 2. Preview

`node ${CLAUDE_PLUGIN_ROOT}/scripts/adopt.mjs --target <repo> --dry-run`. Nothing is written.
Without `--target` it reads the folder it is run from. It ends with `0` when nothing is left for
a person, with `1` while `needs a person` lists a question (not an error: go to step 3), and with
`2` on a wrong call or a repository it cannot read, with the reason on the error stream and no
answer printed. `--json` gives the same as data: `rows` and how each is held, `rerun`, `loose`,
`person`, and `files`, the files written or that would be.

A section that is not printed has nothing in it. Read the sections to the person in this order:

| Section                                              | What it means                                                                                           |
| ---------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| `contrast ratios today`                              | The ratio each pair of color roles reaches now, per mode. Read the numbers; never estimate them         |
| `rows to add`, `held`                                | A check this plugin's tool will run. Each line says what it holds: the value kept, or the file written  |
| `rows to add`, `claimed`                             | A proof the repository already runs, named in the ledger. Not run here. Say so                          |
| `rows to add`, `recorded`                            | A person's call, written on their word                                                                  |
| `would fail today, so nothing was added`             | The value does not meet the stated level. The repository fixes it, or the person decides otherwise      |
| `cannot be read here`                                | Written in a way the tool does not read, such as a mixed colour. No check covers it. Printed every run  |
| `a proof is there but the ledger cannot point at it` | A test that does not name its decision with `decision:<id>`. Say which file; do not edit it yourself    |
| `already kept by the repository, and left as it is`  | A tokens file or a component registry a person keeps, that says something else. It is theirs: untouched |
| `rows of yours with no check, that could have one`   | The ledger already has the row, with no check. The line says what would hold it. See step 3             |
| `needs a person`                                     | The questions in step 3                                                                                 |

Column types are held only where the repository keeps a table of them
(`design/column-types.json`). Adopting writes no such table and installs no code: when the data
model names column types, there is no table and the decision is open, it says so under
`needs a person`.

A test of the repository's own that names a decision with `decision:<id>` is listed under
`claimed`, pointing at that test. Say that the tool did not run it.

Words, error messages and the channel rule are held as found, when the screens meet the rule today. The states
every screen must declare are held only where the repository keeps the list
(`design/states.json`); adopting writes none.

When a target-size line is printed, it names the smallest control and the controls it could not
measure: repeat both. It is a measure of the height declared in component source, not of a rendered screen.

A held check on the type scale or the spacing unit keeps the framework's standard: it fails when
the stylesheet declares its own sizes. It does not pin the framework's numbers.

## 3. Ask only what a person must decide

Ask together, in one message: what `needs a person` lists, and, when the preview has a
`rows of yours with no check, that could have one` table, the last question below. Ask nothing
else:

- The conformance level, AA or AAA. Show the ratios first. Pass the answer as `--conformance-level`.
- The product type. Pass the answer as `--product-type`.
- Whether the primary color role the script shows is the decided brand colour. Only on a yes, pass
  `--record source-color`.

- Whether rows of theirs that have no check should get the one the script found. Read the list
  to them. Only for the rows they name, pass `--hold <id>,<id>`: each gains one `check:` line and
  nothing else in it changes.

The script only speaks of a decision that is open: one with no row, or with a row and no check. A
decision whose row already names a check is left alone and not mentioned.

Never pass a flag on your own judgment, and never from what the audit printed under `seen:`. A
stated level that the values do not reach is not a reason to lower the level: report it.

## 4. Write

1. Run the preview again with the flags the person gave, and show what changed: the rows are not
   the same as in the first preview. A row of theirs that could now have a check and was not in
   the first preview (a target size is only measured once the level is known) was never put to
   the person: ask about that row alone before writing.
2. Run the same command without `--dry-run`. Its last line is `done:` with the number of rows and
   files; it still ends with `1` while a question for a person is open.
   It adds rows to `design/decisions.yaml`, and, when it holds any value, `design/theme.json`,
   `tools/design-assembly/` and `mk/design-assembly.mk`.
3. It also writes, from what the repository has, the design tokens file (`design/tokens.json`) and
   the component manifest (`design/component-registry.json`), unless the repository already keeps
   one that says something else: then that file is listed as kept, and `make design-tokens` or
   `make design-components` will say this tool manages none.
4. For each font the repository loads and holds, a package its lockfile pins or files inside it,
   it writes the font's row of the sources ledger, `design/sources/<id>.json`, saying it is the
   repository's own (`own: true`). It fetches nothing and writes no licence: ask the owner for the
   licence the font is used under, show what the report says the lockfile states, and write their
   words into the row's `licence`. A font it cannot pin, loaded from an address outside the
   repository or by a loader that takes it from elsewhere, gets no row: the report says so, and a
   person writes the row. A row already there is left as it is.
5. It writes `.claude/rules/design-assembly.md`: the rules it now holds here, for the agent that
   builds next. Where the guide ran here before and left a blueprint, the page keeps the
   principles and the direction the owner fixed in it; adopting asks for none.
6. Run the repository's formatter if it has one, then its gate.

From then on a change to a value in the stylesheet is followed by `make design-tokens`, and, where
adopting wrote the component manifest, a change to a component by `make design-components`. The
gate fails until the file is written again, and the message names what differs. Where the
repository keeps a manifest of its own, this tool holds nothing about components: say so.

Adopting does not take in the pages a repository keeps for its kinds of screen, its screen
sizes, the order of its parts or its record of what slipped past the checks: it only claims a browser test that names `decision:<id>`. When the audit lists
`test-screen-sizes` or `reference-implementation` as open, say that this version closes them
only through the guide.

Running adopt again adds only what is new. A row already in the ledger is never rewritten.

## 5. Say what is now true, and what is not

- Run the audit again. Give held, claimed and recorded from its `coverage` line, as three numbers,
  and the `beyond the core` line beside them. Never add claimed to held. `make design-rate` counts
  something else: every row of the ledger that names a check, held or claimed together.
- A contrast row covers what the audit prints under `covers:`: the primary on the background and
  the text on the primary, in the modes that could be read. It does not cover every pair of color
  roles.
- The brand colour itself is not pinned. A new colour that still reaches the contrast ratio passes
  once `make design-tokens` has been run: that command is the deliberate step.
- Name everything under `cannot be read here`, `a proof is there` and `already kept`: those are
  still open.
- After adopting, the guide refuses to generate over the adopted values. `--replace` on the guide
  is the person's decision to give them up.
- Then follow the repository's own rules for finished work, if it has any (its agent instructions
  may ask for a log line or a decision record).

Use the terms in `references/vocabulary.json`.
