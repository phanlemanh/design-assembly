# Layer: interaction patterns

**Framing.** How a person moves through the screens once they are built. Most of this layer is not
a choice: the states every view of data has, the one channel that tells a person what happened, and
where focus goes after an action are derived and held by checks, and the guide installs them
without a question. When a destructive action asks first and when it offers undo has no check the
guide can install: the audit counts it once a test of the repository's own is named for it in the
ledger. One answer is the person's, because it is seen: how one record of a list opens.

**Depends on:** core components (the table a list is drawn with).

## List-detail layout

**Show it, do not describe it.** Once a screen of the repository opens a record, run
`node ${CLAUDE_PLUGIN_ROOT}/scripts/specimen.mjs --target <repo> --section record`. It opens that
screen with a record open, once per arrangement, at the narrowest and the widest width of
`design/screen-sizes.json`, and puts the pictures on one sheet with a letter each. Nothing is
written to the repository to draw it. When no screen opens a record yet, it says so and prints the
same options in words: record the recommendation as proposed, and draw the sheet in a later run,
once a screen opens one.

| Option     | Why                                                                                 | Trade-off                                                       | Wrong when                                                         | Label       |
| ---------- | ----------------------------------------------------------------------------------- | --------------------------------------------------------------- | ------------------------------------------------------------------ | ----------- |
| `beside`   | People go from record to record: the list stays in view and in its place            | The list narrows: a wide table scrolls sideways sooner          | A record has many fields or a long form that needs the whole width | `automated` |
| `over`     | A quick look that must not change the list's size; the frame's header stays in view | The list behind cannot be used until the record closes          | People compare records, or work on one for long                    | `automated` |
| `in-place` | A record is a page of its own: many fields, long text, its own actions              | The list is out of sight: going to the next record is two steps | People go through records one after another                        | `automated` |

**Recommendation:** `beside` for an `application`, `in-place` for a `content-site`. Say when it is
wrong, from the table.

Every arrangement keeps the same rules, held by the browser test of every page and by the record
panel's own test: the open record is named in the address, so a link opens it and Back closes it;
opening moves focus into the record; closing gives focus back to the control that opened it; what
was typed into the list's filter is still there.

## Recording

Write to `layers.patterns` in `design/blueprint.json`: `status`, `source`, `choice`, `why`,
`rejected`. A letter from the sheet is the person's answer: `source: user`. A recommendation the
person did not look at is `source: proposed`, and its row of the ledger says so until they confirm
it.

Choice key:

- `record_panel`: `beside`, `over` or `in-place`.

It becomes the ledger row `record-panel`, of kind closed. Where the guide installs the record panel
(the repository has the floor's table and its browser test), the guide writes the answer into the
panel's one `RECORD_LAYOUT` line, and the gate fails when the two differ.
