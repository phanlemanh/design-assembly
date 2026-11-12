---
name: handoff
description: Hand a repository's design system to a person the way a professional designer hands one to a client — one book, drawn from the repository itself, that shows the colours by role with their contrast ratios, the type scale, corner radius and spacing, each kind of screen beside its reference screen, how a person gets from state to state, and every state of every screen, and says how many decisions are held, claimed, recorded and still open. Every value in it is read from the repository, never typed; it is drawn in the system it describes. Use when the user wants to see, present, review, share or hand over their design system, asks for a style guide, brand sheet, design system documentation or a state gallery, wants to show a client or a team what was decided, or after the guide or adopting has finished. Not for choosing values (the guide shows those on a specimen sheet) and not for drawing diagrams.
---

# Hand the design system over

The guide decides and the gate holds. This shows: one book a person can read without opening a
file of the repository. It is the other half of the specimen sheet. That one is looked at before a
decision; this one after.

Scripts are in `${CLAUDE_PLUGIN_ROOT}/scripts/` (if the variable is not expanded, use the `scripts/`
folder two levels above this file). `references/book.md` says what each sheet is for and what it
may not do: read it before you change or judge a sheet.

## The standard

A book is ready to hand over when all eight hold. The script gives the first, second, third, sixth
and eighth; the others are yours to check by looking.

1. Every value on a page is read from the repository. None is typed.
2. A colour is shown by its role, on the ground it sits on, with the contrast ratio its text
   reaches. Never a row of bare values.
3. Real, not drawn for the occasion: the repository's own screens, every state, at the widths it
   is checked at.
4. It says what is decided, who decided it, and what is open. A proposal nobody confirmed is
   marked as one.
5. One thing to look at per sheet. Nothing is there for decoration.
6. It is drawn in the system it describes: its colours, its sizes, its corner radius.
7. It reads for the person it is for: one page that answers "what do I have", then the detail.
8. The same state of the repository gives the same book.

## 1. Know what there is to show

Run `/design-assembly:audit` first. The book reports what the repository has; it does not make a
thin system look whole. Where foundations are not decided yet, say so and offer the guide instead:
a book of the floor's defaults is not a handoff.

## 2. Choose who it is for, and in what form

Infer both; ask only when the request leaves them open, in one question.

| Dial       | Options              | Default  | What changes                                                                                                 |
| ---------- | -------------------- | -------- | ------------------------------------------------------------------------------------------------------------ |
| `audience` | `client`, `builder`  | `client` | `builder` adds the values as written, which ratios the gate holds, how a state is produced, and the commands |
| `format`   | `html`, `pdf`, `png` | `html`   | `pdf` to print or attach; `png` gives one picture per sheet, for slides                                      |

The book is always one page that needs nothing else: its pictures are inside it. `pdf` and `png`
are written beside it, never instead of it.

## 3. Its words, in the repository's language

The labels are English. A repository whose documents are in another language keeps its own in
`design/book-words.json`. If the file is not there and the language is not English, write it once:
`book.mjs --target <repo> --words-template` prints every label; translate the values, keep the
keys, keep the terms of `references/vocabulary.json` in English. Under `questions`, give each
open decision the cover shows its question in that language, by its id. The file is the repository's from
then on. Never put a number, a colour or a name of the repository in it: those come from the
repository each time.

## 4. Draw it

`node ${CLAUDE_PLUGIN_ROOT}/scripts/book.mjs --target <repo> [--audience ...] [--format ...]`.

It prints where the book is, the three numbers, and a `note:` for every pair of text and ground
that does not reach the contrast ratio of the conformance level. Where the repository has no
browser to draw with, the states are listed without pictures and the script says so.

## 5. Look before you show

Open the book yourself, or look at the picture of each sheet (`--format png`), before the person
sees it. Go through this list; fix what is yours to fix, and say the rest out loud.

- [ ] Does the cover answer "what do I have" without scrolling: the number answered, how it
      splits, how far it reaches, what is open?
- [ ] Is every `note:` the script printed visible on the colour sheet, and will you read it out?
- [ ] Does each state's picture show the state its name says, at both widths? A picture of the
      wrong state is worse than none.
- [ ] Is any text cut off, overlapping, or too small to read at the size the sheet shows it?
- [ ] Does anything on a sheet not come from the repository? Then it should not be there.
- [ ] Are the words the person's language, and do they say what the picture shows?
- [ ] Would a designer hand this to a client as it is? If something only looks unfinished, say
      which sheet and why, instead of sending it.

## 6. Walk the person through it

Put the book in front of them in whatever way the session allows: open the page, send the
picture, or give the path. Then go sheet by sheet, in the book's order, one or two sentences each:
what the sheet answers, the one thing to look at, and what on it is still open.

- **Cover.** The three numbers are different things; never add claimed to held. Say how many of
  the recorded are proposals nobody confirmed.
- **Colour.** Read out every pair below the contrast ratio. Say which ratios the gate holds and
  which the book only measured.
- **Type and shape.** Say what the book cannot show: the font file is not inside it.
- **Kinds of screen.** The words are the repository's own page, not a summary of it. Say whether
  a person has confirmed the page or it is still a proposal.
- **Paths.** It shows the states the repository lists and how each is reached. A path that is not
  listed is not checked: if the person expects one that is missing, that is a state to add.
- **States.** The pictures are the repository's own screens at the narrowest and the widest
  width it is checked at.
- **What it does not show.** Read that sheet out. It is part of the handoff.

A fault the book makes visible and no check caught goes into `design/escapes.md` before anything
is changed, as the repository's own rule says.

## 7. What handing over is not

- The book is not an approval. Never record that a person accepted, confirmed or signed anything
  because they were shown it. A decision of theirs is recorded only when they give it, the way the
  guide says.
- It is not kept in the repository's history: it is drawn again when needed. A book sent earlier
  is checked with `book.mjs --target <repo> --check <book.html>`: it says which parts no longer
  match the repository.
- Export to `pdf` or `png` only when asked.

## Marks of a book made carelessly

| Mark                                                   | Why it fails                                        |
| ------------------------------------------------------ | --------------------------------------------------- |
| A row of colour values with no role and no ground      | Nobody uses a value; they use a role on something   |
| "Accessible" with no ratio beside it                   | A claim a reader cannot check                       |
| A drawing of a screen instead of the screen            | It will be wrong the day the screen changes         |
| A component or a state the repository does not have    | The book promises what cannot be built from         |
| Every sheet equally loud                               | The reader cannot tell what to look at              |
| A total with held, claimed and recorded added together | It hides what was not run and what nobody confirmed |
| Placeholder words                                      | The system has words of its own: use them           |
| A cover that says "complete"                           | Something is always open; the book says what        |
