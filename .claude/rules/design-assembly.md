---
paths: ["src/**/*.tsx"]
---

# Design rules the gate holds

`make design-assembly` checks what this page lists, and `make check` runs it. A failure names
the decision and what is wrong. `design/decisions.yaml` lists every design decision of this
repository and what holds it. This page is written by the design-assembly scripts: do not edit
it.

## A table of data

- A column shows a field of the data model. The field names its column type once: a `display` key on its property in `ontology/entities/`, with a type listed in `design/column-types.json`.
- To add a column: give the property its `display` key, run `make gen` and `make design-columns`, add the header to the repository's words, then use the field in the screen.
- Build the table from `TypedTable`, `TypedRow`, `TypedHead` and `TypedCell` (`src/components/ui/typed-table.tsx`). They take alignment, width and row height from the column type.
- Never put a text-alignment or width class on a table cell, or a height or text-size class on a table row, typed or plain.
- A column that holds actions and no data uses `TypedActionsHead` and `TypedActions` from the same file. On a narrow screen the table scrolls sideways under its first column and its column of actions: both stay in place, so a row's name and its actions are always in view.

## Actions on a row

- A row shows at most two actions as buttons. Three or more go into one menu on the row. The actions that can be taken back come first, a delete comes last.
- Each row waits on its own: while one row's action waits, the other rows can still be used.
- A button that says it is working keeps its width: write its label with `HeldLabel` (`src/components/held-label.tsx`), giving both the label and the label while it waits.

## Words

- A screen writes no word itself: not between tags, not in `aria-label`, `placeholder`, `title` or `alt`, not as a header or label in code. Take every word from the repository's one place for words.
- An error message is an `Alert` of the destructive kind with a title that says what happened and a description that says what to do next.

## States

- Every screen in `src/screens.ts` declares the states listed in `design/states.json`. A screen that loads no data is excused in that file, with a reason: that is a person's decision.

## Telling a person

- The result of an action is told through `notifyDone` in `src/lib/notify.ts`; pass it the undo when the action can be taken back.
- An action done at once that fails is told through `notifyFailed` in the same module: what was not done, what to do next, and a button that tries again. Never drop a failure, and never tell a failed undo as done.
- A failure where the dialog or form is still open is shown in it, not in a toast. What the person typed is kept.
- Anything a toast's button does can also be done from the screen itself: the toast is never the only way.
- When a person leaves a screen its toasts go with it: whatever moves between screens calls `notifyClear` of the same module.
- Never call a toast library from a screen, and never `alert`, `confirm` or `prompt`. One module calls the toast library; a second one, whatever its name, fails the gate.

## After an action

- Focus never falls on nothing: the browser test of every page fails when, after the last action of a state, nothing has focus.
- While an action done at once waits for its answer, the control that started it is held and keeps focus. A control that is removed, or disabled in a way that drops it from the keyboard, loses focus. From one second on, the control says it is working.
- When a control leaves the page (its row is removed, its dialog closes on a deleted item, its state is replaced), move focus: to the same action on the row after it, else on the row before, else to the button of the state shown in place of the table, else to the screen's top heading.
- Wherever focus is sent, it shows: a heading or any element given `tabIndex={-1}` to receive focus gets the same visible ring as a control.
- At the narrowest width, every control of the first row of a table is inside the window: the browser test fails when one is not.
- A button of a toast gives focus back to where the person was before the toast: the notification module does this.

## A screen

- Every screen is of one kind. A kind has a page under `design/patterns`: read it before building a screen of that kind, and build it like the reference screen the page names.
- A new screen is listed in `src/screens.ts`, and its file is one the page of its kind names. A screen of a new kind needs its page first: that is a person's decision.
- Every state of every screen is checked in a browser at the widths of `design/screen-sizes.json`: one main region, one top heading, no sideways scroll, the accessibility checks. A screen with an action done at once lists a state for that action failing.

## The system itself

- The code has parts, listed from the top down in `design/parts.json`. A file imports only its own part and the parts listed after it: a component never imports a screen. What two screens share: logic and data move down a part; a piece of drawing they share becomes a component of the repository's own, in the part between the screens and the component library (named `shared` where the guide wrote the list). One screen's own drawing stays in that screen.
- When you find a fault that every check let through, add a line to `design/escapes.md` before you fix it: the date, what slipped, the layer that should have caught it, and what was done.
- A screen that needs a concept or an action the data model does not name adds it to `ontology/` first, in the same change. An agent that may not change the data model stops and asks: it never names the concept in a screen alone.
- A row of `design/decisions.yaml` is for a rule a second screen must follow. A choice that only one screen makes stays in that screen.
- A departure on purpose stays beside the rule it bends, with its reason: a lint exception, a screen excused from the states, a file left out of its kind.

## No check holds these: a person reviews them

- One item changing never sends the whole list back to its loading state: the row stays until the answer, then the list changes in place.
- An undo puts the thing back where it was and shows no second toast: the screen shows the result. A failed undo says where the thing is now.
- An empty state says why it is empty and how items get there. It has a button only when the person can fill it from this screen; otherwise at most one link inside its text. Never a link dressed as a primary button, and never a copy of the navigation.
- A screen does not link to other screens from beside its heading: moving between screens belongs to the application's frame, in the same place and order on every screen. The place beside the heading is for the screen's main action.

## Controls

- A control is at least 24px high. Do not add a smaller size to a component, and do not shrink one in a screen.

## After a change

- A value in the stylesheet changed: run `make design-tokens`.
- A component or one of its variants changed: run `make design-components`. Look a component and its variants up in `design/component-registry.json` before reading its source.
- A field's column type or the table of column types changed: run `make design-columns`.
- Never edit by hand the files those commands write, `design/theme.json`, `tools/design-assembly/` or `mk/design-assembly.mk`.
