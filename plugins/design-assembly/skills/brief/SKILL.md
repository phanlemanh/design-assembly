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

The twelve slots are the choices every screen meets. They are not every question of this screen:
a sheet with nothing open does not mean nothing is left to ask (section 5).

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
  it rests on, the item `screen:<screen id>:<slot>`, or a shared item, below), and `call`, the very
  call of the decision sheet that asks it. Do not choose alone: ask it first. A slot the decision sheet would refuse to
  ask says so in `cannot_ask` and gives no call (the screen's id has a space, a colon, a comma or a
  slash in it, or another question has the id already): tell the user, who settles it by hand.

`summary` counts them: `settled`, `asked`, `open`, how many the owner's answer settled
(`settled_by_answer`), how many settled slots wait on another (`settled_waiting`), how many rest
on what this branch wrote (`settled_on_branch`) and how many questions that wait recommend what
the repository no longer does (`against`). `asked` and `open` list the slots in those states. A
settled slot means the repository says something, not that it says enough for this screen: read
the answers.

### What this branch wrote

The sheet reads the working tree, and sets it beside what the repository had where this branch
left the main one, the base the gate's own checks compare with. `branch` says how: `compared`,
the name of the main branch, and `why` where nothing or not everything was compared (no git, no
commit yet, no main branch git knows, a shallow checkout, or nothing committed past the main
branch, where only what is not committed is compared). Nothing is fetched.

- A line read from a row of the ledger of screens, or from an action or a field of the data
  model, that this branch wrote carries `branch` in its source (`new` or `changed`) and reads
  «written on this branch». It is what the builder declared a minute ago, not what the repository
  had settled: the slot stays settled, and you say so when you report it.
- What this branch wrote into the data model for the screen opens slot 10 by name: the action,
  the entity or the field, added, changed or removed. Its name and its shape are this branch's
  own choice; the question puts them to the owner.
- Where nothing was compared, the sheet cannot tell, and says so on its third line and in slot 10. Do not read a slot as settled by the repository there if you wrote its source yourself.

### A question that waits, held against what stands now

Run the sheet again after building. A question that waits carries `against`: what in the
repository now goes against its recommendation, where the sheet can read it (other screens this
branch changed while the recommendation was to change none; a place in the screen list that is
not the last while the recommendation was the last). `now` is what stands beside a
recommendation in other words, which the sheet cannot judge. Both are read against the main
branch, whenever the question was asked. A slot the repository now settles
while its question still waits carries the question in `waits`. Where `against` is not empty,
tell the user: the owner would read a recommendation the change already went against. Ask the
question again in words that fit what was built, or undo what goes against it; never edit the
question's file to fit.

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
- Two slots are asked once for every screen they concern, so one thing to decide is one question
  however many sheets you queue: principles and direction under `screens:principles`, and a change
  to the data model under `screens:model-changes:NAMES`, the names it is about sorted and joined
  with `+`. The sheet of every screen whose row or branch has those names reads that one question,
  asked or answered. A question under a screen's own item is still read, for that screen. A branch
  that writes more into the data model is asked again, under the larger set of names. Where the
  repository's tool is older than 0.26.0, or its stamp cannot be read, these are asked one a screen,
  under the screen's own item, as its gate reads them.
- The owner answers on the decision sheet, `/design-assembly:decide`. On the next run the slot is
  settled by that answer: kept (the recommendation stands), refused (with what they said in its
  place) or their own words. A refusal with nothing said in its place tells you what not to do
  only: ask the user what to do instead.
- A repository whose copied tool is older than the one that reads this kind of question refuses
  `--queue` and says so: run the upgrade first.

## 5. Beyond the twelve slots

`beyond` says it on every sheet, and so does the text: the slots are not every question of this
screen. Any other choice that no ledger, component or page of a kind settles is still the owner's.
Ask each one, one question each, with `/design-assembly:decide --ask "QUESTION" --recommend TEXT
--because TEXT --easy-to-undo` (or `--hard-to-undo`), and go on with your recommendation;
`beyond.call` is that call for this repository. Queuing the open slots does not do this for you:
`--queue` writes the slots' questions and no more.

`beyond.places` names where such choices hide on this screen, each read from the repository and
listed only while it is there: what a person comes to this screen for, where the page of the kind
says it of its reference screen alone; which look a control takes, where components have more
than one; the name in code and the word a reader sees for a concept that is new to the data
model, where no place the repository keeps its words in names it yet; whether a toast's button
counts among the actions of the row, where the rules page does not say it; the name each button
behind a row's actions button is heard by, which the component takes no name for; and the words
of a row's waiting state behind that button, where two rules meet. That last place carries its own
question, one for the repository: `ask` and `call` while nobody asked it, `asked` while it waits,
`settled_by` once the owner answered. Run its call as printed. The list is a help, not the
whole of it: the shape of a new concept, sample data, the spoken name of a control, what another
screen does with what this one adds are asked the same way when no page settles them.

## 6. What you do after

- Tell the user how the sheet stands in one line (`summary`), then the slots that are open or
  asked, each with its question and recommendation, then what you will ask beyond the slots. Do not paste the whole sheet unless asked;
  with `--out`, show the document.
- Build only when the user asked for the screen. Build from the settled slots, like the reference
  screen the first slot names, and in the frame the components slot names.
- Slot 12 recommends from what the rows and the data model say: where it names screens to look
  at, look at each before you build, run the brief of each one you change, and say which changed.
- After building, run the sheet again and read `against`, run the checks the sheet lists, then
  `/design-assembly:review <screen id>`.
- The sheet says at its end what it does not see. Repeat those limits when they touch what the
  user asked; do not present a sheet with nothing open as "the screen is fully specified".
