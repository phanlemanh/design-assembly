---
name: brief
description: Hand the builder of one screen one sheet to read once, before the screen is built or changed — twelve slots, every choice that builder meets (the kind and the reference screen, what the screen shows, its actions and roles, its states, its components, its words, the rules that apply, the principles and the direction, the widths and the checks, changes to the data model, its place in the navigation, the other screens it touches), each one settled with the file and line it comes from, asked with the question that waits on the owner, or open with the very call that asks it. Use before building a new screen or changing one, when the user says "brief this screen", "what do I need to build this screen", "what is decided for this screen", "what is still open", or when the rules page of the repository tells you to run it. Read-only unless the user asks for the open slots to be queued. Not a review of a screen that is built (that is the review), and it does not build the screen.
---

# The brief of one screen

Read-only. It writes nothing in the repository, calls no model and reads no clock for the sheet:
the same repository gives the same sheet, byte for byte. Only when asked for a folder does it write
files, and only into that folder. Only with `--queue` does it write in the repository: new files of
the waiting list, each dated with the day it was asked, and nothing else.

The sheet asks no question itself and answers none. What is open is the owner's to settle; every
question goes through the decision sheet, `/design-assembly:decide`.
Never answer a slot for the owner, and never fill an open slot with your own choice unasked.

Scripts are in `${CLAUDE_PLUGIN_ROOT}/scripts/` (if the variable is not expanded, use the `scripts/`
folder two levels above this file).

## 1. Run it

`node ${CLAUDE_PLUGIN_ROOT}/scripts/brief.mjs <screen id> --target <repo>`

- `<screen id>` is the `id` of one screen of the ledger of screens (`design/screens.yaml`, or its
  own file under `design/screens/`). One screen at a time. If the user names a screen by its title
  or its route, read the ledger and use its id; if two screens fit, ask which.
- The screen is built, or declared ahead. A screen that is not in the ledger yet has no sheet: the
  command ends with 2 and lists the screens the ledger has. Enter the screen in the ledger first,
  with `status: planned` and what is already known of it (its route, its kind, what it shows, the
  action that opens it, its buttons, its states), then run the brief. What the row leaves unsaid is
  an open slot, never read as "nothing needed".
- `--json` gives the data; another plugin calls it that way.
- `--out DIR` writes the sheet as a document into `DIR`; `--format pdf` beside it also prints it.
  Name a folder outside the repository, or one the repository ignores.
- `--queue` writes each open slot to the waiting list (section 4). Add it only when the user asks
  for the questions to be queued, or the rules page of the repository tells you to ask.

It ends with:

- `0`: all twelve slots are settled. Build from the sheet.
- `1`: a slot is asked or open. Not an error: it is what the sheet is for.
- `2`: a wrong call, a screen the ledger does not have, a question that cannot be asked, or a
  repository that cannot be read. The reason is on the error stream and nothing is printed as an
  answer. Repeat the reason; do not put a sheet together by hand instead.

## 2. The twelve slots

A closed list, the same on every sheet, in this order: `kind`, `shows`, `actions`, `states`,
`components`, `words`, `rules`, `principles`, `widths-and-checks`, `model-changes`, `navigation`,
`touched-screens`. Each slot says where its answer is read from: the screen's own row, the page of
its kind, the data model, the state table, the component ledger, the decisions ledger, the rules
page, the blueprint, the screen list of the application. No ledger holds the last one, nor the
place in the navigation of a screen that is not built yet: those two are open until they are asked.

The rules, the principles and the direction on the sheet are the ones the review reads for the
same screen: one reader gives both.

## 3. The three states of a slot

- **settled**: the repository answers it. Every line of the answer names its file and the row, key
  or line it comes from. Or the owner answered a question about it: the last line is their answer,
  from the question's own file, with their name and the day the answer carries. Build from it.
  A line that carries `waits_on` says that what it would tell is another slot's to settle: one
  thing missing opens one slot, and the others point at it. The summary counts the settled slots
  that hold such a line; read them as not whole yet.
- **asked**: a question about this slot of this screen waits on the owner (`asked`: its id, its
  file, the question, the recommendation, what it rests on). Go on with the recommendation until
  the owner answers only where the question gives one and says it is easy to undo; where it gives
  none, says it is hard to undo, or does not say, do not build on it. The sheet says which, for
  each. Say which slots you built on a recommendation, not an answer.
- **open**: nothing says. The slot gives why, the question to ask (`ask`: the recommendation, what
  it rests on, the item `screen:<screen id>:<slot>`), and `call`, the very call of the decision
  sheet that asks it. Do not choose alone: ask it first. A slot the decision sheet would refuse to
  ask says so in `cannot_ask` and gives no call (the screen's id has a space, a colon, a comma or a
  slash in it, or another question has the id already): tell the user, who settles it by hand.

`summary` counts them: `settled`, `asked`, `open`, how many the owner's answer settled
(`settled_by_answer`) and how many settled slots wait on another (`settled_waiting`). `asked` and
`open` list the slots in those states. A settled slot means the repository says something, not
that it says enough for this screen: read the answers.

A recommendation never makes up an answer the sheet has no source for. Where only the owner has
the answer (what the screen shows, of which kind it is), it says where the answer is written
before the screen is built, and that is what you do.

## 4. Asking what is open

- One slot: run its `call` as it is printed. It is the decision sheet's own `--ask`, with the item
  and the id of the question, so the sheet finds the question again on its next run.
- All of them: run the brief again with `--queue`. Each open slot becomes one new file under
  `design/waiting/`, made by the decision sheet's own code; all of them or none; never over a file
  that is there. The file carries the day the question was asked; the sheet does not.
- A question in your own words about one slot counts too, when it names the item
  `screen:<screen id>:<slot>`: ask it with `/design-assembly:decide --ask ... --item` and the sheet
  shows the slot as asked.
- The owner answers on the decision sheet, `/design-assembly:decide`. On the next run the slot is
  settled by that answer: kept (the recommendation stands), refused (with what they said in its
  place) or their own words. A refusal with nothing said in its place tells you what not to do
  only: ask the user what to do instead.
- A repository whose copied tool is older than the one that reads this kind of question refuses
  `--queue` and says so: run the upgrade first.

## 5. What you do after

- Tell the user how the sheet stands in one line (`summary`), then the slots that are open or
  asked, each with its question and recommendation. Do not paste the whole sheet unless asked;
  with `--out`, show the document.
- Build only when the user asked for the screen. Build from the settled slots, like the reference
  screen the first slot names, and in the frame the components slot names.
- After building, run the checks the sheet lists, then `/design-assembly:review <screen id>`.
- The sheet says at its end what it does not see. Repeat those limits when they touch what the
  user asked; do not present a sheet with nothing open as "the screen is fully specified".
