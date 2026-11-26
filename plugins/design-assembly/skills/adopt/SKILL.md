---
name: adopt
description: Take in the design system a repository already has, without changing it — add ledger rows for the proofs the repository already runs (lint rules, guard tools, tagged tests), add checks around the values its stylesheet holds today (contrast of every pair of colour roles the plugin's table declares, corner radius, that the framework's type scale and spacing unit are not overridden), and write the design tokens file and the component manifest from what is there, so that a later change fails the gate. Never rewrites the stylesheet, the lint configuration, a test, an existing ledger row or a design file a person already keeps. Use when a repository has its own brand values or a partial design system and the user wants it kept and held, or when the audit's `next:` line names this skill.
---

# Adopt what a repository already has

The guide (`/design-assembly:new`) generates values. This does the opposite: it keeps the values
the repository has and puts a row and a check around each one it can read.

Scripts are in `${CLAUDE_PLUGIN_ROOT}/scripts/` (if the variable is not expanded, use the `scripts/`
folder two levels above this file). `references/checks.md` says what each file and each kind of
check is: read it before explaining a result.

## When a repository has only just been given its floor

A tool that sets repositories up (or a person) may lay the ledgers right after the floor, before
anyone is asked anything: `adopt.mjs --target <repo> --starter`. It does what this page describes,
and also lays the ledgers a repository has from birth that a person keeps after that (states,
screens, screen widths, column types) in the form the guide starts from. It asks nothing and passes
no answer for anyone: each call only a person can make stays on the waiting list that `status`
prints. It ends with 1 while answers wait.

Whose the values are depends on what the repository shows:

- On a floor with nothing of the repository's own (its primary color role is still a grey, and it
  adopted no value before), every value found is recorded as the floor's, and the guide may later
  replace it. Offer the guide (`/design-assembly:new`) now or later.
- Where the primary color role has a hue of its own, such as a brand colour given when the
  repository was set up, or where values of the repository's own were adopted before, the ledgers
  are laid all the same and nothing is taken for the floor's: every value is the repository's, as
  this page records it. The guide is not for that repository: the next step is this skill from
  step 1, which asks the person whether that colour is the decided brand colour.

A value adopted later without `--starter` is the repository's own, and the guide does not write
over it unless a person says to replace it. `status` says which of the two a repository is, on the
line of the rhythm "the repository is born": a grey default, or a primary color role of its own
that the guide is not for. Its `next:` line names this skill in both cases, while answers wait.
Never answer a question of the guide or of this page yourself.

## 1. Audit first

Run `/design-assembly:audit`. Anything `BYPASSED` or `FAILING` is the repository's own work and
comes first: adopting does not fix it.

### Then the plugs, once

Right after the audit, and before the preview, run the setup step of the plugs once:
`node ${CLAUDE_PLUGIN_ROOT}/scripts/plugs.mjs --target <repo> --short --session`, and pass what
this session holds: `--skill <name>` for each skill or slash command the session lists, `--server <name>` for each server it
has, and `--needs-sign-in <name>` for each server that is there and waits for a sign-in. Pass the
names as the session lists them; the command matches only the names the plug files declare.
Give each name a flag of its own, written out in the call: `--skill one-skill --skill another-skill`, never several names in one value, whether joined by a space or joined by a comma or a semicolon. Names kept together in one variable do not become separate arguments in every shell, and the command refuses a value with white space, a comma or a semicolon in it, or an empty one, as a wrong call. Its line `Read from the session:` says how many names of each kind it read; when that is not how many you gave, the names did not reach it as you meant.

- When it ends with `0` and says no measured plug is in the repository or this session, the step
  does not stop: say its line in one sentence and go on.
- When it ends with `1`, questions about plugs wait on the decision sheet. Say so, with the
  recommendation of each. Go on with the plugin's own plug at every socket while they wait: a
  recommendation is not an answer, and nothing is acted on until the person answers.
- A line that starts with `falling back` says a chosen plug is not here: say it as it is.
- The step may leave questions on the waiting list (`design/waiting/plug-<socket>.json`), and
  writes nothing else; say so, since what comes next may say it writes nothing.
- Run it once in this guide; the person runs `/design-assembly:plugs` again whenever they like.

## 2. Preview

`node ${CLAUDE_PLUGIN_ROOT}/scripts/adopt.mjs --target <repo> --dry-run`. Nothing is written.
Without `--target` it reads the folder it is run from. It ends with `0` when nothing is left for
a person, with `1` while `needs a person` lists a question (not an error: go to step 3), and with
`2` on a wrong call or a repository it cannot read, with the reason on the error stream and no
answer printed. `--json` gives the same as data: `rows` and how each is held, `rerun`, `loose`,
`person`, `held_back` (what waits behind the family question, step 3), and `files`, the files
written or that would be.

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
| `held back until the family question is answered`    | Questions a family core this machine knows answers. Never put them to the person: see step 3            |

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

### The family question first, alone

When `needs a person` lists `family`, it is its first line: whether this repository is of the same
family as a core this machine keeps. Put that one question to the person alone, before anything
else of `needs a person`, and wait for the answer. A repository of a family is never asked what its
core answered, so the rest is only known once this is answered.

- Yes: follow `/design-assembly:core`, step 7, then run the preview again.
- No: `core.mjs --target <repo> --decline`, then run the preview again; it is not asked again.

While the question is open, the preview lists under `held back until the family question is
answered` each question a core this machine knows answers, with the core that answers it, locked or
by default. Never put a held-back question to the person, and never answer one with a flag. After
the answer the preview is another: a repository that joined is not asked them, and one of no family
is asked them as before, under `needs a person`. With several cores known, a question any of them
answers is held back, so a repository that joins one that does not answer it is asked after the
join, once.

### Then the rest, together

Once no `family` line is left, ask together, in one message: what `needs a person` lists, and, when
the preview has a `rows of yours with no check, that could have one` table, the last question
below. Ask nothing else:

- The conformance level, AA or AAA. Show the ratios first. Pass the answer as `--conformance-level`.
- The product type. Pass the answer as `--product-type`.
- Whether the primary color role the script shows is the decided brand colour. Only on a yes, pass
  `--record source-color`. On a repository of a family whose core settled the colour, the script
  does not ask it: the row is written as inherited, or, where the core's colour is a default and
  the repository held its own before it joined, as the repository's own answer from before it
  joined. Where the core locks another colour, the line names the core's question about the
  difference, `core-source-color-<pin>`: adopt puts it on the decision sheet itself, in the run
  that lays `design/tokens.json`, and says whether the question waits there or is among the files
  of this run. Read that question to the owner as `/design-assembly:core`, step 7, says; no second
  `core --join` is needed for it.

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
   `tools/design-assembly/` and `mk/design-assembly.mk`. A repository that keeps no Makefile and
   has a `package.json` gets no make step and no Makefile: the gate is the package script
   `design:check` (`design-assembly:check` where `design:check` is already a script of its own,
   which is never written over), and the report ends with a `gate:` line that says the command to
   run. Read that line out, and say that the repository's own check and CI run the design check
   only once a person joins the script there. Where the acceptance kit's file is in the folder
   adopted, the command is declared to it; where it is above, at the root of a workspace, the line
   to add is said: show it.
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
   Likewise for the mark: from the icons the pages declare, as the adapter of the build reads them,
   it writes one logo row, `design/sources/logo.json`, each file hashed where it is with its role
   and the variant `color`, and says the repository kept them (`own: true`). It draws, fetches and
   changes no file. Ask the owner who holds the right to use the mark and where, and write their
   words into the row's `licence`; correct a variant the report names, and add the other files of
   the mark with `logo-source`. An icon it cannot read, an address outside the repository or a
   file that is not there, gets nothing: the report says so. A logo row already there is left as
   it is, and the gate holds the pin of every logo row from then on.
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

- On a repository of a family, read out the lines under `answered by the family core`: each answer
  not asked, with who settled it and when.

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
