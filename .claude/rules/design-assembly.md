---
paths: ["src/**/*.tsx"]
---

# Design rules the gate holds

`make design-assembly` checks every rule below, and `make check` runs it. A failure names the
decision, the file and what to do. `design/decisions.yaml` lists every design decision of this
repository and what holds it. This page is written by the design-assembly guide: do not edit it.

## A table of data

- A column shows a field of the data model. The field names its column type once: a `display` key on its property in `ontology/entities/`, with a type listed in `design/column-types.json`.
- To add a column: give the property its `display` key, run `make gen` and `make design-columns`, add the header to the repository's words, then use the field in the screen.
- Build the table from `TypedTable`, `TypedRow`, `TypedHead` and `TypedCell` (`src/components/ui/typed-table.tsx`). They take alignment, width and row height from the column type.
- Never put a text-alignment or width class on a table cell, or a height or text-size class on a table row, typed or plain.
- A column that holds actions and no data uses the plain table cell.

## Words

- A screen writes no word itself: not between tags, not in `aria-label`, `placeholder`, `title` or `alt`, not as a header or label in code. Take every word from the repository's one place for words.
- An error message is an `Alert` of the destructive kind with a title that says what happened and a description that says what to do next.

## States

- Every screen in `src/screens.ts` declares the states listed in `design/states.json`. A screen that loads no data is excused in that file, with a reason: that is a person's decision.

## Telling a person

- The result of an action is told through `notifyDone` in `src/lib/notify.ts`; pass it the undo when the action can be taken back.
- Never call a toast library from a screen, and never `alert`, `confirm` or `prompt`.

## Controls

- A control is at least 24px high. Do not add a smaller size to a component, and do not shrink one in a screen.

## After a change

- A value in the stylesheet changed: run `make design-tokens`.
- A component or one of its variants changed: run `make design-components`. Look a component and its variants up in `design/component-registry.json` before reading its source.
- A field's column type or the table of column types changed: run `make design-columns`.
- Never edit by hand the files those commands write, `design/theme.json`, `tools/design-assembly/` or `mk/design-assembly.mk`.
