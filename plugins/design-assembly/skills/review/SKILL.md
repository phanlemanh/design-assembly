---
name: review
description: Review one screen that is already built, by its picture and without changing anything — draw it at every declared width in light and in dark, measure on the picture what a machine can measure (the contrast of text on its ground, and text broken inside a word or cut off), and hand back numbered findings with the picture, the place, how heavy each is, a way to fix it and what it rests on. Use when the user asks to review a screen, "look at this screen", "check the design of this page", "does it hold in dark mode", "does it hold at 320", or wants pictures of a screen for a reviewer. Pairs with building a screen: the gate being green does not mean the screen is fine. Not for why a check of the gate fails (that is the audit), and not a verdict on a feature.
---

# Review of a drawn screen

Read-only. It writes nothing in the repository, and it calls no model: the same repository gives
the same findings. Only when asked for a folder does it write files, and only into that folder.

This version is the default plug of the design review socket: it draws and it measures. **No eye
has looked at the pictures** when it is done, and every answer says so. A screen with no finding is
not a screen a designer has passed. Say that to the user in so many words; never report a review
with no findings as "the design is fine".

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

It ends with:

- `0`: the two measures found nothing.
- `1`: there are findings, or a picture that was asked for was not drawn. Not an error.
- `2`: a wrong call, a screen the ledger does not have or that is not built yet, or a repository
  with no build the plugin can draw. The reason is on the error stream and nothing is printed as an
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

Each finding has a `number`, the `picture` its note is on and its `position` on the page, a
`severity` (`high`, `medium`, `low`), what was `measured`, the pictures it was `seen_in`, a `fix`,
and `rests_on`: the row of `design/decisions.yaml` that speaks of it, or `nothing` with the reason
in plain words. Never invent a rule for a finding that rests on nothing: whether it becomes a rule
is the owner's to say.

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

## 5. What you do after

- Tell the user the findings, the heaviest first, each with its picture and what it rests on, then
  what needs a person's eye, then that no eye has looked.
- Do not fix the screen unless the user asks. A review changes nothing.
- Do not turn a finding into a rule, and do not write a question into the waiting list for one:
  that is the owner's, through the decision sheet.
- After a fix, run the review again: a finding that is gone is fixed.
- Do not say a feature passes or fails. The review measures one screen against what stands still
  in the repository; a verdict on a round of work is not its to give.
