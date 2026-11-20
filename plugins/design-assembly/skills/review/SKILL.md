---
name: review
description: Review one screen that is already built, by its picture and without changing anything — draw it at every declared width in light and in dark, measure on the picture what a machine can measure (the contrast of text on its ground, and text broken inside a word or cut off), hand the pictures to a reviewer skill where the session has one the socket board names, and hand back numbered findings with the picture, the place, how heavy each is, a way to fix it, what it rests on and what becomes of it. Use when the user asks to review a screen, "look at this screen", "check the design of this page", "does it hold in dark mode", "does it hold at 320", or wants pictures of a screen for a reviewer. Pairs with building a screen: the gate being green does not mean the screen is fine. Not for why a check of the gate fails (that is the audit), and not a verdict on a feature.
---

# Review of a drawn screen

Read-only. It writes nothing in the repository, and the command calls no model: the same
repository gives the same findings. Only when asked for a folder does it write files, and only into
that folder. Only with `--queue` does it write in the repository: new files of the waiting list,
and nothing else.

A review has four parts. The command draws the screen and measures it; an **eye**, a reviewer skill
the socket board names, looks at the pictures; the command then harvests every finding, the
machine's and the eye's, by what it rests on. Where the session has no such skill, the review ends
after the command's own run, and **no eye has looked at the pictures**: every answer says so. A
screen with no finding is not a screen a designer has passed. Say that to the user in so many
words; never report a review with no findings as "the design is fine".

Scripts are in `${CLAUDE_PLUGIN_ROOT}/scripts/` (if the variable is not expanded, use the `scripts/`
folder two levels above this file).

## 1. Run it

`node ${CLAUDE_PLUGIN_ROOT}/scripts/review.mjs <screen id> --target <repo>`

- `<screen id>` is the `id` of one screen of the ledger of screens (`design/screens.yaml`, or its
  own file under `design/screens/`). One screen at a time. If the user names a screen by its title
  or its route, read the ledger and use its id; if two screens fit, ask which.
- `--states` draws every state of the screen, not only the one it opens in. A state is drawn only
  where the application's own screen list says how it is reached; one that cannot be reached is
  named as not drawn.
- `--out DIR` writes the pictures, the pack and the record into `DIR`. Without it the screen is
  still drawn and measured, and no file is written anywhere. Name a folder outside the repository,
  or one the repository ignores.
- `--format pdf` beside `--out` also prints the record.
- `--json` gives the data; another plugin calls it that way.
- `--findings FILE` hands back the findings file an eye wrote (section 6). Draw with the same
  `--states` as the run the eye looked at: a finding names its picture by the picture's id.
- `--queue`, beside `--findings` or alone, writes the questions of the harvest to the waiting list.
  Add it only when the user asks for the questions to be queued.

It ends with:

- `0`: the two measures found nothing.
- `1`: there are findings, or a picture that was asked for was not drawn. Not an error.
- `2`: a wrong call, a screen the ledger does not have or that is not built yet, a findings file
  that cannot be harvested, or a repository with no build the plugin can draw. The reason is on the error stream and nothing is printed as an
  answer. Repeat the reason; do not review the screen from its code instead.

The repository's own build serves the screen and the repository's own browser draws it, so both
must be installed there. The build keeps what it prepared in the packages folder, as on any run of
its development server; no file of the repository changes.

## 2. What it draws

One picture for each width of `design/screen-sizes.json` (the two widths every floor starts from
where the repository declares none), once in light and once in dark, for each state drawn. Each
picture is of the whole page.

Dark is asked for the way the floor's stylesheet reads it, and as the system would ask. The answer
says of dark one of three things, and you repeat it:

- the screen turns dark when the system asks, or a source file of the application sets dark
  itself: users reach it, and a finding there is as heavy as anywhere;
- no switch was found: a finding seen **only** in dark is `low`, with the reason. It is still a
  finding. It becomes heavy the day the application gets its switch;
- neither the system nor a dark class on the root changes the screen: the application has no dark
  theme this command can turn on, and only light is drawn.

## 3. What it measures, and what a finding carries

Two things, on what was drawn:

- **contrast**: the colour of each text against the ground a reader sees under it, every layer
  laid over the one behind, at the ratio the repository's conformance level asks (level AA where it
  names none; large text is asked less). The same two colours in many places are one finding.
- **broken-word** and **cut-off**: a word laid on more than one line with no break of the writer's
  own, and a text the box around it hides part of with nothing to say so. A text its box shortens
  with an ellipsis or a limit of lines is not a finding: it is named for a person's eye.

Each finding has a `number`, `by` (`review` for the command's own measure, or the name of the eye
that saw it), a `kind` (`contrast`, `broken-word`, `cut-off`, or `seen` for an eye's), the
`picture` its note is on and its `position` on the page, a `severity` (`high`, `medium`, `low`),
what was `measured` (nothing, for an eye's), the pictures it was `seen_in`, a `fix`, and
`rests_on`: a row of `design/decisions.yaml` (`ledger-row`), a line of the rules page
(`rule-line`), a principle the owner fixed (`principle`), or `nothing` with the reason in plain
words. Never invent a rule for a finding that rests on nothing: whether it becomes a rule is the
owner's to say.

`unjudged` lists what could not be measured or drawn on this screen: text on a picture or a
gradient, text shortened with an ellipsis, a state nothing says how to reach, a dark theme the
application does not have. Read it out as "needs a person's eye", not as passed.

## 4. What it hands over with `--out`

- `shots/`: the pictures, named `<screen>-<state>-<width>-<theme>.png`.
- `review-pack.json`: for an eye that reads the pictures later. It lists the pictures, the lines of
  the rules page that apply to the screen, the principles and the direction the owner fixed, the
  screen's row of the ledger and the ledger rows the measures rest on, and what was measured. Two
  runs on the same repository give the same pack.
- `design-review.html`: the design review record, on the frame every document of this plugin
  shares. The pictures carry numbered notes, one for each finding; the findings stand by severity;
  the page for the person asks, for each finding no rule holds, whether it becomes a rule or is
  left; and the last part says what was not seen, first of all that no eye has looked at the
  pictures.

Show the user the record, or the pictures with the findings beside them. Do not paste the pack.

## 5. The harvest: what becomes of each finding

`harvest` has one entry for each finding, by its number, in one of three groups:

- `escape`: it rests on a row a check holds, or on a line of the rules page the gate holds. The
  check let it through. The entry gives the `line` to add to `design/escapes.md`; the command adds
  nothing. Where the rules page names no layer the layer cell is empty, and whoever adds the line
  writes the layer that should have caught it.
- `question`: it rests on a line of the rules page no check holds, a principle the owner fixed, or
  a row no check holds. The entry gives the question, and `call`, the very call of the decision
  sheet that asks it. With `--queue` the command asks it, one new file of the waiting list each,
  and says in `queued` where it went, or that it waits or was answered already.
- `person`: it rests on nothing. It is for a person's eye, and no question is asked.

## 6. Hand the pictures to an eye

Only after a run with `--out DIR`, and only in this session: the pictures never leave it.

1. Read `eyes` in the `--json` answer. Each entry is a skill the socket board names as a plug of
   the design review socket, with the `names` a session lists it under. Find, among the skills this
   session lists, one whose name is one of those names, or ends with a colon and one of them. Use
   the name as the board gives it; never take a reviewer skill the board does not name.
2. If there is none, stop here: the review is the command's run alone. Say that no eye has looked
   at the pictures, and which eye the board names, so the user can add it.
3. If there is one, run it. Give it the pictures of `DIR/shots/` and `DIR/review-pack.json`, and
   ask it to say, for each thing it sees: on which picture, how heavy, what it saw, how to fix it,
   and where on the page if it can say.
4. Write what it said into `DIR/review-findings.json`, nothing added and nothing left out:

   ```json
   {
     "version": 1,
     "screen": "<screen id>",
     "eye": "<the name the board gives>",
     "findings": [
       {
         "picture": "<the id of a picture of the pack>",
         "severity": "high | medium | low",
         "saw": "what the eye saw, in its words",
         "fix": "how to fix it, if it said",
         "place": { "x": 0, "y": 0, "width": 0, "height": 0 },
         "rests_on": { "kind": "rule-line", "line": 12 }
       }
     ]
   }
   ```

   `fix` and `place` may be left out. `rests_on` is one of `{ "kind": "ledger-row", "id": "<row of
the ledger>" }`, `{ "kind": "rule-line", "line": <the line number the pack gives> }`,
   `{ "kind": "principle", "id": "<a principle of the pack>" }` or `{ "kind": "nothing" }`. Name
   only what the pack lists, and only where what the eye said is what that row, line or principle
   says; where it is not, the finding rests on nothing. A finding with no picture, no severity or
   no `rests_on` is refused, with the finding and what it lacks.

5. Run the command again with `--findings DIR/review-findings.json`, the same `--states` and the
   same `--out DIR`. The record and the answers then say which eye looked.

## 7. What you do after

- Tell the user the findings, the heaviest first, each with its picture, who found it and what it
  rests on; then what becomes of each: the lines for `design/escapes.md`, the questions for the
  owner, and what needs a person's eye; then which eye looked, or that no eye has looked.
- Do not fix the screen unless the user asks. A review changes nothing.
- Do not turn a finding into a rule. Do not add the lines to `design/escapes.md` yourself unless the
  user asks. Do not queue the questions unless the user asks; then run the review with `--queue`,
  which asks them through the decision sheet's own code: the owner answers them there.
- After a fix, run the review again: a finding that is gone is fixed.
- Do not say a feature passes or fails. The review measures one screen against what stands still
  in the repository; a verdict on a round of work is not its to give.
