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

## Actions on a row

- A column that holds a row's actions and no data uses `TableActionsHead` and `TableActions` (`src/components/ui/table-actions.tsx`). When the table is wider than its place it scrolls sideways inside itself, and that column stays in place.
- The first column of a typed table stays in place too from 640px up. On a phone it scrolls with the data, so every column can still be read.
- A row shows one action as a button. Two or more go behind one button on the row, at every width: `RowActions` (`src/components/ui/row-actions.tsx`), given a `name` that says which row it acts on and the actions as buttons, those that can be taken back first and a delete last. Two text buttons do not fit beside the data at 320px, and one rule for every width keeps one way to reach each state. The button shows only an ellipsis, ⋯, so it takes the same small room at every width; a screen reader hears its name. Its list floats below the button and never widens the column; one is open at a time; pressing an action closes it and gives focus back to the row's button, which you hold with `pending` while the action waits; from one second of `pending` on, it turns itself into a turning circle and a screen reader hears `busyName`, which says what it is doing: each row keeps its own clock, so write no timer of your own. A state behind it is reached by pressing the row's button, then the action. Never build a list of a row's actions of a screen's own.
- Each row waits on its own: while one row's action waits, the other rows can still be used.
- A button that says it is working keeps its width: write its label with `HeldLabel` (`src/components/held-label.tsx`), giving both the label and the label while it waits.

## A record beside a list

- A record opened from a list opens with `WithRecord` (`src/components/record-panel.tsx`), and the screen keeps which one is open with `useOpenRecord` (`src/lib/open-record.ts`). It opens as the person chose in `design/blueprint.json`: beside the list, over it, or in its place. Never build a panel, a sheet or a page of a screen's own for it.
- A record that opens over the list starts below the application frame's header, the page's banner, and never covers it. While it is open the header can still be pressed, which closes it; the keyboard and a screen reader reach the header once it is closed.
- The record's name in its row is the button that opens it. The record's title is its name; it shows the record's fields under the same headers as the table's columns.
- A screen that opens a record lists a state for it in `src/screens.ts`, reached by pressing that button, so the browser test measures it at every width.
- To change how a record opens, change the answer in `design/blueprint.json` and run the guide again. Never edit the `RECORD_LAYOUT` line by hand: the gate fails when it differs from the answer.

## Words

- A screen writes no word itself: not between tags, not in `aria-label`, `placeholder`, `title` or `alt`, not as a header or label in code. Take every word from the repository's one place for words.
- An error message is an `Alert` of the destructive kind with a title that says what happened and a description that says what to do next.

## States

- Every screen in `src/screens.ts` declares the states listed in `design/states.json`. A screen that loads no data is excused in that file, with a reason: that is a person's decision.

## Telling a person

- The result of an action is told through `notifyDone` in `src/lib/notify.ts`; pass it the undo when the action can be taken back.
- An action done at once that fails is told through `notifyFailed` in the same module: what was not done, what to do next, and a button that tries again. Never drop a failure, and never tell a failed undo as done.
- A failure where the dialog or form is still open is shown in it, not in a toast. What the person typed is kept.
- An action on a row that asks first closes its dialog as soon as the person confirms: the row's own control waits for the answer, so the other rows can still be used. From there it is an action done at once: done, it is told through `notifyDone`; failed, through `notifyFailed`, whose button tries again without asking again. The browser test fails when the dialog is still open after the person answered.
- Anything a toast's button does can also be done from the screen itself: the toast is never the only way.
- When a person leaves a screen its toasts go with it: whatever moves between screens calls `notifyClear` of the same module.
- Never call a toast library from a screen, and never `alert`, `confirm` or `prompt`. One module calls the toast library; a second one, whatever its name, fails the gate.

## After an action

- Focus never falls on nothing: the browser test of every page fails when, after the last action of a state, nothing has focus.
- While an action done at once waits for its answer, the control that started it is held and keeps focus. A control that is removed, or disabled in a way that drops it from the keyboard, loses focus. From one second on, the control says it is working.
- When a control leaves the page (its row is removed, its dialog closes on a deleted item, its state is replaced), move focus: to the same control on the row after it (the button that opens a row's actions, where they are behind one), else on the row before, else to the button of the state shown in place of the table, else to the screen's top heading.
- When an undo brings a row back, focus goes to that row's same control, so a person is where the thing they took back now is.
- Wherever focus is sent, it shows: a heading or any element given `tabIndex={-1}` to receive focus gets the same visible ring as a control.
- At every width, every control of the first row of a table is inside the window, and the columns that stay in place leave room to read the widest column that scrolls: the browser test fails when either is not so.
- A button of a toast gives focus back to where the person was before the toast: the notification module does this.

## A screen

- Every screen is of one kind. A kind has a page under `design/patterns`: read it before building a screen of that kind, and build it like the reference screen the page names.
- A new screen is listed in `src/screens.ts`, and its file is one the page of its kind names. A screen of a new kind needs its page first: that is a person's decision.
- Every state of every screen is checked in a browser at the widths of `design/screen-sizes.json`: one main region, one top heading, no sideways scroll, the accessibility checks. A screen with an action done at once lists a state for that action failing.
- A screen is listed twice: in `src/screens.ts`, how each of its states is reached, and in `design/screens.yaml`, the ledger every tool reads: its `id`, `route`, `title` (the key of its title among the repository's words), `family` (the `nhom` of the page of its kind), `status` and the names of its `states`, in the code's order. Add both in the same change. The gate fails when the two list different screens, and `tests/screens-ledger.test.ts` when a title or the states differ. States in `src/screens.ts` may be built by a function: the checks read them from the ledger.
- A screen's entry in `design/screens.yaml` also says what it shows (`shows`, entities of `ontology/`), the action a role must hold to open it (`entry`, or null for every role) and the actions it has buttons for (`actions`). Every action of `ontology/actions.yaml` is offered on a screen to every role that may run it; an action that has no screen is listed under `no_screen` with `later: <where>`, or `never: <reason>` with `decided_by`, the person who decided, never you. The gate fails when an action is offered to nobody who may run it, when a screen shows a record to a role that may not view it, and when a button is one no role that opens its screen may press.
- Moving between screens is the frame's. Once there is more than one screen, `src/App.tsx` draws `AppFrame` (`src/components/app-frame.tsx`) with the list of screens, each given a `title` from the repository's words: it moves between them without loading the page again, marks the open one, leaves a screen's toasts behind and draws the toaster once. A screen never links to another screen: the gate fails when one does.
- An empty state offers a button only where the person can fill the list from this screen; otherwise at most one link inside its words. A link dressed as a button fails the gate.

## The system itself

- The code has parts, listed from the top down in `design/parts.json`. A file imports only its own part and the parts listed after it: a component never imports a screen. What two screens share: logic and data move down a part; a piece of drawing they share becomes a component of the repository's own, in the part between the screens and the component library (named `shared` where the guide wrote the list). One screen's own drawing stays in that screen. This holds for what screens of one kind copy from its reference screen too: loading, trying again and filtering that two list screens do alike are one shared piece, not two copies.
- When you find a fault that every check let through, add a line to `design/escapes.md` before you fix it: the date, what slipped, the layer that should have caught it, and what was done.
- A departure on purpose stays beside the rule it bends, with its reason: a lint exception, a screen excused from the states, a file left out of its kind.

## No check holds these: a person reviews them

- A screen that needs a concept or an action the data model does not name adds it to `ontology/` first, in the same change, and says in the change's description that the data model changed and a person reviews it before it merges. Only where the repository forbids an agent to change the data model does the agent stop and ask. It never names the concept in a screen alone.
- A row of `design/decisions.yaml` is for a rule a second screen must follow. A choice that only one screen makes stays in that screen.
- One item changing never sends the whole list back to its loading state: the row stays until the answer, then the list changes in place.
- An undo puts the thing back where it was and shows no second toast: the screen shows the result. A failed undo says where the thing is now.
- An empty state says why it is empty and how items get there, and never copies the navigation.
- A screen does not link to other screens from beside its heading: moving between screens belongs to the application's frame, in the same place and order on every screen. The place beside the heading is for the screen's main action.

## Controls

- A control is at least 24px high. Do not add a smaller size to a component, and do not shrink one in a screen.

## After a change

- A value in the stylesheet changed: run `make design-tokens`.
- A component or one of its variants changed: run `make design-components`. Look a component and its variants up in `design/component-registry.json` before reading its source; when the file is not there, the repository keeps it out of git and the same command writes it.
- A field's column type or the table of column types changed: run `make design-columns`.
- Never edit by hand the files those commands write, `design/theme.json`, `tools/design-assembly/` or `mk/design-assembly.mk`.
