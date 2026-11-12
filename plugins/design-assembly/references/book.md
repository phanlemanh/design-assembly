# The sheets of the book

`scripts/book.mjs` draws one book from one repository. A sheet answers one question. Each has a
budget: past it, the sheet stops saying one thing.

The book keeps, inside itself, a list of every fact it shows (`design-book-facts`). `--check`
reads that list back and compares it with the repository: the parts that differ are named. The
pictures are not part of the list: they are drawn, not compared.

| Sheet            | The question it answers                      | Read from                                              |
| ---------------- | -------------------------------------------- | ------------------------------------------------------ |
| Cover            | What do I have, and what is open?            | The audit: coverage, tiers, open core decisions        |
| Colour           | Which colours, and what may sit on what?     | The design tokens file, the stylesheet, the theme data |
| Type and shape   | Which sizes, corners and distances?          | The design tokens file, the stylesheet                 |
| Kinds of screen  | What is each kind for, and built like?       | The kind pages, and the reference screen each names    |
| Paths            | How does a person get from state to state?   | The screen registry, read with its words resolved      |
| States           | What does every screen show, in every state? | The screen registry, the screen sizes                  |
| What is not here | What does this book not show?                | Fixed text, in the repository's words                  |

## Cover

- One number is the largest thing on the page: core decisions answered, out of all core decisions.
- Under it, the split: held, claimed, recorded, and how many of the recorded nobody confirmed.
  Four different things, four different marks. Never one total.
- The tiers in order, each with its state in plain words.
- Open core decisions as the questions they are, not as ids.
- Budget: nothing else. No picture, no colour beyond the primary.

## Colour

- A role is a tile painted in its own colour, with text in the colour that role's text takes, on
  a panel painted in that mode's background. Light and dark side by side.
- Beside the role's name, the contrast ratio. Below the level's ratio, the tile says what it
  needs: it is never hidden and never softened.
- `builder` adds the value as the stylesheet writes it and marks the ratios the gate holds.
- The source color, and whether the primary is that colour or moved from it, per mode.
- The tonal palette as one strip.
- Budget: seven surface roles as tiles; three roles of text on the background; three lines. Every
  other role the stylesheet declares is a small mark at the end, for `builder` only.
- A colour with transparency has no single ratio: the sheet says it was not measured.

## Type and shape

- Every step of the type scale at its own size, largest first, with size and line height in
  pixels. The sample line comes from the repository's words file, so it shows the letters and
  marks its language needs.
- The corner radii as shapes; the spacing scale as bars at true size; the smallest control at
  true size.
- The font is named, and the sheet says the font file is not inside the book.
- Budget: no paragraph of text. Sizes are compared by eye, not explained.

## Kinds of screen

- One kind per block: its name, its main task set large, and the picture of its reference screen;
  beside them, what the kind's page says, in the page's own words and order.
- A `client` is not shown sections that hold code; a `builder` is shown the page whole.
- The book never rewrites the page. A page that reads badly here reads badly in the repository:
  fix it there.
- Budget: the page as written. A kind whose page runs past one screen of reading is two kinds, or
  a page that explains instead of deciding: say so to the person.

## Paths

- The states reached by the data alone sit side by side. Every other state follows an action, in
  a row read left to right: the action, then the state it leads to, then the next action.
- A state hangs under the state its own steps pass through. Where no listed state stands at an
  earlier step, the state keeps all its steps on its own arrow.
- The pictures are whole, at the narrowest width: what tells a failure from a success is often at
  the bottom of the screen.
- `builder` adds what the data source answers for a state.
- This sheet needs the browser: the steps are read with the repository's own words on them.
  Without one it says so and shows nothing.
- Budget: one screen's states per map. It shows what is listed, not what is possible: a path the
  registry does not list is not on it.

## States

- One row per state: its name, how a person reaches it, a picture at the narrowest width and one
  at the widest. The pictures are taken after the state's own text is on the page.
- `builder` adds what the data source answers for the state.
- Budget: every state of every screen, and nothing that is not a state. A screen with more than
  twelve states is two screens' worth of reading: say so to the person.
- Without a browser the rows are there and the pictures are not; the sheet says why.

## What is not here

- Three lines, each one thing the book does not show, and one paragraph on how the book is kept
  from saying something the repository does not.
- This sheet is never left out.
