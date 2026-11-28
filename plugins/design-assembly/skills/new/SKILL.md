---
name: new
description: Guide a person through the decision layers of a design system for their repository — product context, the three to five design principles the owner fixes first, whole design directions drawn on the repository's own screen in light and dark, and foundations today — with a recommendation at each layer that says which principle or standard it rests on, then generate the design tokens, the checks that hold them and the ledger rows that record them, so Claude Code can build screens without guessing. Use when the user wants to create, set up or start a design system in a repository that has no brand values of its own yet, choose a brand colour, type scale or corner radius for a repository, or when the audit's `next:` line names this skill. For a repository that already has its own brand values, use the adopt skill instead.
---

# Guide a person to a design system Claude Code can build from

One flow for everyone; only the number of stops differs. A newcomer may not know what a design
token is. A professional designer arrives with a brand and wants it kept.

Scripts are in `${CLAUDE_PLUGIN_ROOT}/scripts/` (if the variable is not expanded, use the `scripts/`
folder two levels above this file). Layer pages are in `${CLAUDE_PLUGIN_ROOT}/references/layers/`.

## Words

Every name you show comes from `references/vocabulary.json`. Keep the term in English in every
conversation language, and explain it in one clause the first time it appears. Do not coin a word
for something the list already names, and do not use a word its `avoid` lists.

## 0. Audit first

Run `/design-assembly:audit` on the repository before anything else, and read its last line,
`next:`. Go on with this guide only when that line names `/design-assembly:new`. When it names only
`/design-assembly:adopt`, stop: the repository has values of its own, the guide generates the
primary color roles and would replace them, and adopting keeps them.

A stylesheet whose primary color role is a grey is the floor's default, not a brand colour: the
guide is for that repository.

A person's call that the guide proposed (the product type, the conformance level, the source
color, when nobody stated them) is written to the ledger with a note saying a person has not
confirmed it, and the audit prints that note. Say so in the summary; the note goes when the person
gives the answer and the guide runs again.

`apply.mjs` enforces this. It refuses to write where the stylesheet has a primary color role with
a hue of its own, or where values were adopted. `--replace` lifts the refusal: pass it only when
the person has said, in their own words, that the existing values are to be given up.

## 1. Check the repository

The guide builds on a design floor; it does not lay one. Run
`node ${CLAUDE_PLUGIN_ROOT}/scripts/apply.mjs --target <repo> --dry-run`.

The floor is checked first, then the blueprint.

- It refuses because the floor is missing: say what is missing in plain words and stop. A repository
  set up with `repo-setup` and its design layer has the floor.
- It says the floor is in place and `design/blueprint.json` is not there yet: that is the normal
  start. The preview ends with `1`, which is not an error: no layer is decided yet. Create the
  file with the shape below, then go on.

The script ends with `0` when it is done, with `1` when a built layer is not decided yet or the
preview shows a write that would be refused, and with `2` when it refuses: a wrong call, no floor,
or a blueprint it cannot write from. On `2` the reason is on the error stream and nothing is
printed as an answer. Without `--target` it reads the folder it is run from; `--json` gives the
blueprint layer by layer and the files written or that would be, as data.

- `design/blueprint.json` exists: resume from the first built layer that is `pending`.

### A family, once

The preview may print a line that starts with `family:`: this machine keeps the core of a family
of products, and this repository declares none. Ask the person that one question, as printed, and
nothing more about it. Ask it alone, before the plugs and before any question of a layer: a
repository of a family is not asked what its core answered, so no layer is asked while this is
open. Yes: follow `/design-assembly:core`, step 7. No: run
`core.mjs --target <repo> --decline`, and the repository is not asked again. A repository that
already declares its family is not asked.

On a repository of a family, run `core.mjs --target <repo> --inherit` once the blueprint is written
(`/design-assembly:core`, step 8). Then a choice the blueprint marks `inherited` with
`hold: locked` is not asked; one with `hold: default` is shown filled in, and a change is written
with its reason under `changed.<key>`, `{ "why": "<their words>", "by": "<their name>", "on":
"<today>" }`; keep both marks when you write the layer. The guide refuses a locked answer changed
without an exception, and a default changed without its reason. At the end, read out the lines
under `answered by the family core`: each answer not asked, with who settled it and when.

The blueprint is the only file you write by hand. Its shape:

```json
{
  "version": 1,
  "status": "designing",
  "depth": "hand | review",
  "layers": {
    "<layer id>": {
      "status": "pending | decided | planned",
      "source": "user | proposed | repo",
      "choice": { "<choice key>": "<value>" },
      "why": "one or two sentences",
      "rejected": [{ "option": "<value or name>", "why": "one sentence" }]
    }
  }
}
```

The context layer also lists the design principles, once they are fixed (step 4):
`"principles": [{ "id": "<catalog id or own id>", "source": "user | proposed", "text": "only for own words" }]`.

Every layer of `references/layers.json` has an entry. A built layer starts as `pending`; a layer
with `built: false` is `{"status": "planned"}`. `source`, `choice`, `why` and `rejected` are written
when the layer is decided. Choice keys are listed at the end of each layer page.

`depth` records which of the two depths of step 3 was used, `hand` or `review`. Nothing reads it
back; it is there for the next person.

`rejected` lists only the options that were actually offered to the person and turned down. It is
`[]` when the person gave the value without being offered alternatives, for a layer with a single
option, and when the guide was handed to Claude and nobody was there to turn anything down.

`why` is copied into the decision record of the layer. Write it in the language the repository's
own documents use.

`source` says who the answer came from: `user` when the person gave it, `repo` when it was read from
the repository, `proposed` for everything else, including a layer with a single option.

### Then the plugs, once

Once the repository is checked, and before any layer, run the setup step of the plugs once:
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

## 2. Show the whole picture

List the layers from `references/layers.json` in order, each with its state: already known, to
decide, or not built yet. A layer that is not built has no question for the person in this
version. Say so in one line, and say that the guide still installs, in step 6, the rules of
those layers that need no decision: they are listed there, not here. Invite the person to paste anything they have already decided, in any
form, and mark what they give as `source: user`. This is not a stop: go on in the same message.

## 3. Choose the depth

Infer it; ask only if unclear.

- **Hand it to Claude**: no design preferences stated. Take the recommendation at every layer and
  stop only at the final review.
- **Review each layer**: stop at every layer with a real choice.

## 4. Go through the layers

For each layer with `built: true`, read `references/layers/<id>.md` and run this loop:

1. **Framing**: one sentence on what this layer decides and what earlier layers imply.
2. **Options**: two or three, each with why, trade-off and when it is wrong. Recommended first.
3. **Decide**: write the layer to `design/blueprint.json` with `status: decided`, `source`,
   `choice`, `why` and `rejected`.

A layer with only one sensible answer gets one line, no question. A layer with `built: false` is
recorded as `{"status": "planned"}`.

### Design principles first

Right after the product type and the conformance level, and before any value is shown, the owner
fixes three to five design principles: short statements of what the design favours when two good
options pull different ways. They come from `references/principles.json`. Offer first the ones
whose `suits` lists the product type, each with its statement and what it favours, in one list;
the person picks three to five, or writes one of their own. A principle in their own words gets an
id of lowercase words joined by hyphens and its `text`; it is recorded and can be cited, but no
option follows from it. A catalog principle whose wording they want changed keeps its id and gets
`text`, as long as the meaning stays: otherwise it is their own.

Write them to `layers.context.principles`, in the order the person gives them. `source` is `user`
for each the person picked or wrote, `proposed` for each you put forward that they did not answer.
In **hand it to Claude**, propose three that suit the product type, record them as `proposed`, and
put them first in the final review: they become rows of the ledger that say a person has not
confirmed them, and wait on the decision sheet. Never write `user` for a principle the person did
not pick.

From here on every recommendation you give rests on something, and you say what:
`apply.mjs --target <repo> --dry-run --json` gives `recommendations`, one per choice the guide
recommends, each with the option and its `basis`. A basis of kind `principle` names the principles
it rests on; quote them. A basis of kind `standard` says no principle the owner fixed speaks to the
choice, or that two of them pull different ways (`conflict` lists them): say so, and let the person
choose. Only a principle with `source: user` settles anything. The preview prints a `hint:` for
each value of the blueprint that goes against a principle the owner fixed: read it out; the person
may keep the value knowingly.

Ten answers belong to the person, because they are taste or brand: the product type, when the
repository does not already record it; the source color; the type scale; the corner radius; the
typeface of text and of headings; the neutral family; the status tones; whether the sidebar
follows the primary colour; whether the chart roles are kept from the floor; and the list-detail
layout. The
conformance level is theirs too when a contract or a regulator sets it; otherwise it is AA. In
**review each layer**, ask for them. In **hand it to Claude**, propose them, record
`source: proposed`, and put them first in the final review so the person can replace them. Never
ask about anything a layer page says the machine derives.

### Directions first

Before any single value of the foundations is asked, the person sees whole directions: a colour,
a type scale and a corner radius that go together, drawn on the repository's own screen in light
and in dark. Run `node ${CLAUDE_PLUGIN_ROOT}/scripts/specimen.mjs --target <repo> --section direction`
(add `--color <colour>` when the person has a colour of their own). It shows the three directions
of `references/directions.json` that agree best with the principles the owner fixed, the best
first, and prints for each what it follows, which fixed principle it goes against, and what each
value rests on.

- Put the sheet in front of the person as below, and ask one question: which direction is the
  product's. Recommend A, and give its reasons as the sheet prints them; say which fixed principle
  a direction goes against.
- **A letter is the person's answer for all three values.** `choices.json` gives, for that letter,
  `direction` and the choice keys: write `direction` to `layers.foundations.direction` and the
  rest to `layers.foundations.choice`, with `source: user`, and beside them who gave the source
  color and when: `"answered": { "source_color": { "by": "<their name>", "on": "<today>" } }`.
- A colour of the owner's own is kept in every direction: the directions then differ in type and
  shape only. A colour the guide proposed is not the owner's, and each direction brings its own.
- Then refine: only the values the person wants changed are asked one by one, on the sheets
  below. A value they change keeps the direction named; say that the foundations are now the
  direction with that change.

In **hand it to Claude**, take direction A, record `source: proposed` with `direction`, and show
the direction sheet at the final review.

### Show, then ask

The choices of foundations are things a person sees, so they are shown, not described. To refine
a value of the direction the person picked, or where no direction was asked, run `node ${CLAUDE_PLUGIN_ROOT}/scripts/specimen.mjs --target <repo>`. It draws
the repository's own screen once per option, in light and in dark, on one sheet, and prints where
the sheet is, where one picture of the whole sheet is, and what each letter stands for.

- Put the sheet in front of the person in whatever way the session allows: open the page in the
  browser pane, send the picture, or give the path to open. Then ask one section at a time, with
  the letters as the answers and your recommendation first. Give the reason for the
  recommendation, its trade-off and when it would be wrong, in one or two sentences; say what the
  choice leaves undecided.
- **A letter is the person's answer.** Write the value the script prints for that letter
  (`choices.json` has them) to the blueprint. When the person answered every choice of the layer,
  the layer is `source: user`. When they answered some and the rest are still your proposals,
  keep `source: proposed` and list the choice keys they answered under `confirmed`, such as
  `"confirmed": ["source_color"]`: only those rows stop saying they are a proposal. The same
  holds when a person simply says a proposed value is right. Never write a value the sheet did
  not show, and never list a key the person did not answer.
- The source color the person gave is written with who gave it and when, under
  `answered.source_color`, `{ "by": "<their name>", "on": "<today>" }`, with the name the person
  goes by in this repository. The row of the source color then says so, and `status --roles` names
  it beside each role the formula writes from it. A source color you proposed has none.
- The person has a colour of their own: pass it with `--color <colour>`, once per colour, and it
  is drawn first.
- "Warmer", "lighter", "less loud": run `--around <colour>`. It draws one step in each direction
  around that colour, by fixed amounts. Ask again with the new letters. Never move a colour by
  your own estimate.
- Every option on the sheet already meets the conformance level: where a source color does not
  reach the contrast ratio, the sheet shows the primary that does, and its note says it moved.
  Read that note out for the option the person picks.
- The sheet draws the screen the repository has. Say what that screen does not show: a screen that
  uses two sizes shows little of a type scale, so the sheet lists every step beside it.
- The script says so when it could not draw (no browser in the repository). It still prints the
  same options in words: go on with those, and say that nothing could be shown.

In **hand it to Claude**, do not stop here: draw the sheet for the final review instead.

### The typeface

After the corner radius, ask the typeface of running text, then of headings, on the sheet
`specimen.mjs --target <repo> --section typeface` draws: the floor's font and the system font for
text; the same as text, the floor's and the system font for headings; then each font of the
sources ledger whose row is whole. Recommend the floor's font, with headings in the same typeface,
and say what that rests on as the preview's `recommendations` give it.

A font of the brand comes in through its row of the sources ledger, `design/sources/<id>.json`,
and is chosen as `source:<id>`. Never fetch, download or copy a font. Write the row only from what
the repository already holds, with `node <plugin>/scripts/font-source.mjs --target <repo> --family
"<name>"` and one of: `--package <name>`, a package the repository's lockfile already pins (the
row takes the pinned version); or `--files <path>,<path>`, font files already in the repository
(each is hashed where it is). A font that is neither: say that the person installs the package or
puts the files in the repository first, and stop there. The row has no licence: ask the owner for
the licence the font is used under, show what the command printed the lockfile states, and never
write a licence yourself. Until the licence is in the row the font cannot be chosen, the sheet
leaves it out and says why, and `status` names the licence as the next step.

A letter is the person's answer: write `text_font` and `heading_font` to
`layers.foundations.choice`, and beside them who answered and when,
`"answered": { "text_font": { "by": "<their name>", "on": "<today>" }, "heading_font": { ... } }`,
with the name the person goes by in this repository. A typeface you proposed has no `answered`;
the row then says a person has not confirmed it, and the decision sheet asks it. The guide
refuses a typeface that is the owner's without a name and a date.

A blueprint decided before this choice existed has neither key: the guide leaves the floor's
declarations as they are, and `status` lists the question until it is answered here.

### The mark

After the typeface, look in the sources ledger for a row of the kind `logo`. With none, ask
nothing and write nothing: the mark is the floor's, the product's name set in the heading typeface,
and no file is made. Never draw, generate or fetch a mark, and never offer a letter in a box made
from the name: that is a brand decision nobody gave.

With one or more, ask one question: the floor's text (`text`) or a row (`source:<id>`). Name each
row with its files, their roles and variants, and whether it can be chosen: a row whose licence is
not written, or whose files no longer match their pin, cannot, and the guide refuses it. The mark is
the owner's to choose: recommend nothing, and put the question to the owner. Their answer goes to
`layers.foundations.choice.mark`, with `answered.mark`, `{ "by": "<their name>", "on": "<today>" }`.

A mark the repository keeps and the ledger lacks comes in through its row: `node
<plugin>/scripts/logo-source.mjs --target <repo> --file <path>:<role>:<variant>`, once per file,
for files already in the repository (roles `mark`, `wordmark`, `lockup-horizontal`,
`lockup-vertical`, `favicon`, `app-icon`; variants `color`, `mono`, `inverse`). The row has no
licence: ask the owner who holds the right to use the mark and where it may be used, and write
their words into the row's `licence`; never write one yourself.

A mark an outside plug of the brand assets socket built, once the owner chose it, comes in from
the package it left: `node <plugin>/scripts/logo-source.mjs --target <repo> --package <folder>`. The
command reads the package's `manifest.json`, compares every file with the hash it lists, and refuses
a package that does not match; the row says which plug made the mark and on which day. Never write
who chose the mark yourself: the command reads it from the owner's answer on the waiting list. A
mark built in the repository this way is the repository's asset, as its code is: the command
writes the row's licence by that rule and says so in the row (`licence_from`). Ask the owner for
no sentence about the right to use it, and write none; that sentence is asked only for a mark
brought in with `--file`.

### The neutral family and the status tones

After the typeface, ask the neutral family on the sheet `specimen.mjs --target <repo> --section
neutral` draws, in light and in dark: pure grey (`grey`), the floor's own family, and grey leaning
to the source colour (`tinted`). Each is drawn with every neutral role its formula writes, and the
sheet prints the ratio of `--muted-foreground` on `--muted` and the lowest pair: every one already
reaches the conformance level. Recommend pure grey, and say what that rests on as the preview's
`recommendations` give it. "Kept from the floor" stays an answer: say that the floor's own muted
text is below the threshold on this floor, so keeping it turns the gate red.

Then the status tones, on `specimen.mjs --target <repo> --section status`: each tone of the
plugin's closed list (`references/status-tones.json`), drawn in light and dark with its ratio on
the background and on its own tint. The person picks letters: the error tone is always taken, and
a tone not picked writes no role. Recommend the error tone alone unless a screen already says that
something went well, needs attention, or is only information. Never offer a hue of your own: the
hue of each tone is the list's.

A letter is the person's answer. Write it to the blueprint in two places: the value under
`layers.foundations.choice` (`"neutral_family": "grey"`, `"status_tones": ["error", "success"]`),
and the owner's word that the formula writes those roles under
`layers.foundations.roles.color-roles-neutral` and `.color-roles-status`, `{ "source": "formula",
"by": "<their name>", "on": "<today>" }`. Kept from the floor is `"source": "floor"` with no value
under `choice`. The guide refuses a value without that word, a word without its value, and a list
of tones without the error tone.

A brand that has its own colour for a status tone gives it under
`layers.foundations.brand_exceptions`, keyed by the tone's role: `{ "--success": { "light":
"<colour>", "dark": "<colour>", "why": "<the owner's reason>", "by": "<their name>", "on":
"<today>" } }`. Only for a tone the owner chose, only from the owner's own words, never proposed by
you. The guide writes the colour as given, adds the row `brand-exceptions`, and measures it like
every role: below the threshold it refuses, and says the ratio.

### The sidebar, the chart roles and the font's licence

Then the two questions of the table of colour roles that no sheet draws, each once, in words
(`status.mjs --roles` prints the table; `references/color-roles.json` has each question's
`question`, `recommended` and `why`): `color-roles-sidebar`, whether the sidebar's primary, its
text and its ring follow the primary colour or are kept from the floor; and `color-roles-chart`,
whether the five chart roles are kept from the floor. Ask them here, before the final review, not
in the build step: the build does not stop. Recommend what the table recommends and give its
`why`. The person's words are their answer: write it under `layers.foundations.roles.<question>`,
`{ "source": "follows" | "floor", "by": "<their name>", "on": "<today>" }`, the source the question
takes. A question the person leaves open waits on the owner; say so, and say which roles keep the
floor's value until then.

The typeface the person chose may need a row of the sources ledger that the build writes without
its licence: the floor's own font, or a font the repository loads from a package or from files.
Ask the licence now, beside these two: show what the lockfile states for the font's package (its
`license` entry), and ask the licence the font is used under. Write nothing yet. After the build
writes the row (step 6, `adopt.mjs` proposes it), put the person's words into its `licence`, as
they gave them, then run `make design-assembly`. Never write a licence they did not give.

### How a record opens

The interaction patterns layer asks one thing, and it is seen too: how a record of a list opens
(`references/layers/patterns.md`). Run `specimen.mjs --target <repo> --section record`. It finds
the first state of the screen registry that opens a record and draws it once per arrangement, at
the widest and the narrowest width the pages are checked at. Ask with the letters, the
recommendation first, as above; a letter is the person's answer and is written to
`layers.patterns` with `source: user`. When the script says no screen opens a record yet, say so,
record the recommendation as `source: proposed`, and tell the person the sheet can be drawn once a
screen opens one. In **hand it to Claude**, propose it and show the sheet at the final review when
it can be drawn.

As soon as product context and foundations are decided, run the preview,
`apply.mjs --target <repo> --dry-run`. It works before approval and prints, for light and dark, the
primary and the contrast ratio it reaches, and whether the source color had to move; then the type
scale, the spacing scale and the corner radius, and any note. In **review each layer**, show those
lines in the foundations stop. Quote the numbers it prints; never estimate a contrast ratio or a
size yourself.

Keep the blueprint `status` at `designing` until the final review.

## 5. Final review

Run `specimen.mjs --target <repo> --section review`: it draws the screen as it is now beside the
screen as it will be. Show that first. In **hand it to Claude**, also draw the full sheet
(`specimen.mjs --target <repo>`) and put the proposed values in front of the person as letters
they can change: this is the one place they are asked to look. A letter they give here is their
answer and is recorded as `source: user`; a value they did not look at stays `proposed`.

Then run the preview again, `apply.mjs --target <repo> --dry-run`, and show:

- the design principles, each with its source, and any `hint:` that a value goes against one;
- one line per layer: what was chosen and where it came from (`user`, `proposed`, `repo`);
- the primary for light and dark and the contrast ratio each reaches, and any note that the source
  color had to move;
- the type scale and the corner radius, and any note about small type sizes;
- the typeface, the neutral family, the status tones, and the owner's word for each question of
  the table of colour roles, with any question still open and the licence of a font, if asked;
- the files that would be created or updated.

On approval, set `status: approved`. The approval is the person's: never set it for them. If the
person wants another colour or level instead, change that layer, keep `status: designing`, and show
the preview again.

## 6. Build without stopping

1. `node ${CLAUDE_PLUGIN_ROOT}/scripts/apply.mjs --target <repo>`. It writes the tokens into the
   stylesheet, its rows into the ledger `design/decisions.yaml`, the component manifest
   `design/component-registry.json` read from the component source, the design tokens file
   `design/tokens.json` read back from that stylesheet, the tool's data `design/theme.json`, a
   decision record per layer under `design/decisions/`, and installs the checks into the
   repository's gate. `references/checks.md` says what each file is. If a tokens file or a
   component registry was already there and says something else, it is kept and the script says
   so: tell the person.

   It also writes `.claude/rules/design-assembly.md`: the rules it now holds here, where the
   agent that builds the next screen reads them first. It names only what is installed. The
   page opens with what the owner fixed before any value: each principle that is theirs and the
   direction they took, one line each. A principle the owner has not fixed is named there as
   settling nothing.

   The preview's list of files is the full list of what is written. Beyond the files named
   above it holds the starting tables a person owns from then on (`design/column-types.json`,
   `design/states.json`) and the file derived from the first (`design/columns.json`).

   The generated block sets the tonal palette of the source color (`--palette-primary-*`), the
   primary color role, the text on it and the focus ring, in light and dark, the corner radius,
   and, once answered, the typeface of text and of headings. Every other color role has a line
   in the plugin's table of colour roles (`references/color-roles.json`; `status.mjs --roles`
   prints it): where its value comes from and the pairs it is measured in. The sidebar's primary,
   its text and its ring follow the primary colour once the owner says so; the neutral roles and
   the status tones are written by their formulas once the owner chose a neutral family and the
   tones; the chart roles keep the floor's value. Each of those is a question of the table, asked
   once for its group in step 4, before the final review, and written into the blueprint under
   `layers.foundations.roles.<question>`, with `source` (`follows`, `formula` or `floor`, as the
   question takes), `by` (their name) and `on` (the day, YYYY-MM-DD). Never a value, and never on
   the owner's behalf. This step does not stop to ask: a question with no answer waits on the
   owner, and `status` names it. Say so if the person expects the whole theme to turn to their
   colour.

2. `node ${CLAUDE_PLUGIN_ROOT}/scripts/adopt.mjs --target <repo>`, with no flags. The guide writes
   only the rows for what it generated; this adds the rows for what the floor already proves with
   its lint rules and guard tool. Without it the audit still shows those decisions with no row.
   It ends with `1` when it still lists a question under `needs a person`: that is not a failure
   of this step.
   Then the icon set: `node ${CLAUDE_PLUGIN_ROOT}/scripts/icon-source.mjs --target <repo>`, with
   nothing named. It writes nothing and says which set is recommended: none where the sources
   ledger has an icon set row; the set the code already imports, where it imports one; else the
   set the pieces of the starter kit import, read from the plugin's data, so the repository holds
   one set and not two. Put it to the person: take it, or name another. It installs nothing: a set
   the lockfile does not pin is installed the way the repository installs a package, then its row
   is written with `--recommended` (or `--package <name>` for another set, `--folder <path>` for
   icons kept as files). Which set the product takes is the owner's call, never yours: where the
   owner has not kept it, the command writes one question about it on the waiting list
   (`icon-set:<id>`) and says `owner: asked in …`. Stop there, put that question to the owner
   with the decision sheet, and go on once they keep it; a branch that adds the row is red at the
   gate until then. A set the owner refused gets no row. The licence of a package is the one the
   installed package declares: the command writes it into the row and says where it was read, so
   ask nobody for it. Only where the command prints `next: write the licence …` (the package is
   not installed or declares none, or the icons are files of the repository), ask the owner for
   it and write their words into the row's `licence`; never write one yourself. Where the gate
   is installed, the row answers `icons` and the gate holds, from then on, that the code takes
   its icons from it: read out any `gate: red today:` line.
3. `make format`, then `make design-assembly`. Then the repository's own `make check`.
4. A failure of `make design-assembly` means a decision is no longer held. Read the message: it
   names the decision and what is wrong. Fix the cause, never the check.
5. `/design-assembly:audit` again. Give held, claimed and recorded from its `coverage` line as
   three numbers, with the `beyond the core` line beside them, then which tier the repository has
   reached and what the next one misses. `held` means this plugin's tool ran the check now and saw
   it fail on a changed copy; `claimed` means another check is named and was not run here. Never
   add the two.
   Then `node ${CLAUDE_PLUGIN_ROOT}/scripts/status.mjs --target <repo> --roles`: one line per
   colour role and per typeface, with its value in light and dark, where it comes from with the
   owner's word, and the rows of the ledger and the checks that hold it, then a `whole:` line.
   Read out the `whole:` line and every `not whole:` line: a value without the owner's word, or
   without a row and its check.
6. `make design-rate` prints a different count: every row of the ledger that names a check, held
   and claimed together, over all rows. Give it only with that explanation. Decisions of kind
   judgment have no check by design: the product type, the conformance level and the source color
   are a person's calls.
7. Repeat the `typeface:` and `font-loaded:` lines. The gate now holds that the typeface the
   stylesheet names is loaded, as the repository's build loads one. A font of the sources ledger
   kept as files is loaded by the block itself on the first build stack, which writes an
   `@font-face` rule for each file. A font that is a package: the person writes the one import
   line the guide prints at the top of the stylesheet, then runs the guide again. On the second
   build stack the guide writes no loading code: the person calls the build's font loader in a
   layout file, as the line printed says. The gate is red until something loads it. Say so.
8. Say how far the contrast check reaches: every pair the table of colour roles declares, in
   light and dark, at the threshold of the conformance level. Read out each `note:` line of the
   form `<pair> in <mode> mode measures <ratio>, below <threshold>: not checked until the owner
answers <question>`: that pair is the floor's, below the threshold, and becomes a check, red,
   once the owner keeps its roles from the floor. Until then it is held to the ratio it was
   measured at: it may get no worse. Once the owner lets a formula write its roles, it passes
   from the moment the guide writes them. Never change a colour to make it pass.
9. Lines that start with `note:` and `hint:` mean different things. A `note:` says a rule is not
   met today and names the place: no check was added for it, or, if the row was already there,
   its check stays and the gate fails. A `hint:` says nothing is wrong: it names something the
   person may want to do later. Read both out, and never call a hint a failure.
10. Repeat the `column types:` line. The guide wrote `design/column-types.json` with six starting
    types if there was none: its sample lengths are a proposal, and the file is the person's from
    now on. A field names its column type with a `display` key in the data model. With the first
    field that does, the guide also holds `display-kind` and installs the typed table parts
    (`TypedTable`, `TypedRow`, `TypedHead`, `TypedCell`), which the repository then owns; before
    that it prints a `hint:` and installs neither. Adding a `display` key changes the data model:
    follow the repository's own rule for such a change.
11. Repeat the lines for `state-matrix`, `labels`, `error-copy` and `notification-channel`. Where
    the repository already depends on the toast library, the guide installs the toast and the one
    module screens tell results through; otherwise it prints how to get them. Never install a
    package yourself: say in the summary what is missing and what adding it would give. This is
    not a stop.
    Then, for all four: a `note:` for one of them means the repository does not meet that rule
    today; read out the place it names. The list of states every screen must declare
    (`design/states.json`) is the person's from now on, and excusing a screen there needs a
    reason. Each of the four rows holds only what can be read from source; its note says what.
12. Kinds of screen. Repeat the lines for `test-screen-sizes`, `one-main-one-h1`,
    `no-sideways-scroll`, `wcag-aa`, `focus-after-action` and `row-actions-in-view`: where the floor's browser checks are installed, the guide
    wrote `design/screen-sizes.json` with 320 and 1440 and installed a browser test that checks
    every state of every screen at those widths. The widths are the person's from now on; the
    narrowest stays at 320 or less.
    Where the ledger of screens says what each screen opens with and offers, and the repository
    declares actions and roles, the rules page now says that a control of an action carries
    `data-model-action="<action name>"`. Repeat the line for `screen-actions-seen` when the script
    printed one: it installed `tests/e2e/screen-actions-seen.spec.ts`, which opens every built
    screen as each role of the model, entering by `tests/e2e/roles.ts`, and fails when a role does
    not see a button it may press, sees one it may not, or finds anything of a screen it may not
    open. When `status` says instead that `tests/e2e/roles.ts` is missing, the row waits for that
    file, and it is the person's: how a browser becomes each role (a sign-in, a stored session,
    nothing at all) is theirs to say. The guide writes no sign-in code, and neither do you: say
    what the file must hold, in the shape the line names, one way in per role, and let the person
    write it. Where they ask you to type it for them, write only the steps they told you, say that
    the file is theirs, and never fill a step they did not give. Then run the script again.
    A `hint:` that no page describes a kind of screen means the kinds are not held yet. The guide
    never writes such a page. Offer to write one with the person, per kind of screen the
    repository has, starting from the example `references/checks.md` gives under "Kinds of
    screen". Ask what a person comes to that kind of screen to do: that sentence is the main
    task. Propose the order of the parts from the screens that exist, and name as the reference
    one screen of the registry that declares every required state; a screen the floor shipped as
    its sample counts while it is the only one. Then run the script again: it holds
    `page-layouts` and `reference-implementation`, and records `primary-task`.
    Three rows are the person's calls, and the scripts cannot tell whether a person made them:
    `primary-task`, which the script writes with a note that nobody has confirmed it, and
    `information-order` and `copy-content`, which you add to the ledger by hand, as `judgment`
    rows of the `context` layer with no check and a `source` that names the page. These three
    rows are the one exception to the rule that you touch only what `apply.mjs` writes. For each:
    when the person gave the answer or read the page and agreed, the row has no note; when you
    proposed it, its note ends with `a person has not confirmed it`, and the audit names the row
    as not confirmed. The scripts keep a row as a person left it.
    The browser test can go red on screens that were there before it: a state that follows an
    action and leaves nothing focused is a real fault of that screen. Never make it pass by
    changing the test or leaving the state out. Do this, in order: add a line to
    `design/escapes.md` (the fault, the layer `patterns`, what will be done); read out the states
    it names; then fix the screen, which is the repository's own code: a control that waits is
    held in a way that keeps focus, and a control that leaves hands focus on
    (`references/checks.md`, "After an action"). A row whose actions leave the window on a narrow
    screen (`row-actions-in-view`) takes its column of actions from `TableActionsHead` and
    `TableActions`, which the guide installs with the browser test where the floor's table is; a
    waiting button's label is written with `HeldLabel`. Never pin a column with classes in the
    screen: the floor's lint rejects them, and the floor's components are not edited. The fix changes how a control behaves, so say it
    in the summary as your change, not as part of what the guide generated. A test of the
    repository that asserted the old behaviour changes with it.
    Say what a failed action does (`references/checks.md`, "A failed action"), and that a screen
    with an action done at once lists a state for that action failing. Where no toast is
    installed, say that the rule stands and the module that tells a failure is not there yet.
13. The system itself. Repeat the lines for `tier-direction` and `escapes`. The guide wrote
    `design/parts.json`, the parts of the code from the top down, once a kind of screen was
    described; read the parts out and ask whether the order is right, because the list is the
    person's from now on. A `note:` for `tier-direction` names an import that goes against the
    order today: no check was added, and moving the shared code is the repository's work.
    The guide also wrote `design/escapes.md` with no line. Say what it is for: when anyone finds
    a fault that every check let through, a line goes in before the fix. Say plainly that no tool
    can tell a fault was left out, and that the audit calls an empty record what it is.
14. Repeat the `target size:` line the script printed: the smallest control and the controls it
    could not measure. If it printed a note instead, some controls are below what the conformance
    level asks and no check was added: name them, and say that the components change first or the
    level does. That choice is the person's.

## 7. Finish

Offer one commit. Then a short summary: what was decided, the three numbers and what they do not
measure (whether the result looks good), what is not built yet, and that running this guide again
with the same answers changes nothing. A source color Claude proposed is a placeholder, not a brand
decision: say so in the summary.

Then follow the repository's own rules for finished work, if it has any: its agent instructions
may ask for a log line or a decision record for a choice like this one.

## Rules

- Never edit `tools/design-assembly/`, `mk/design-assembly.mk`, `design/theme.json` or the
  generated block in `src/index.css` by hand. Change the blueprint and run `apply.mjs` again.
- In `design/decisions.yaml`, touch only what `apply.mjs` writes. Rows another person wrote stay
  exactly as they are.
- Never weaken a check to make it pass.
- Never present a layer that is not built as if it were.
- Never change a choice the person stated without asking.
