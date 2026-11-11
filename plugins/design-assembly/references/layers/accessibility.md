# Layer: accessibility

**Framing.** Which conformance level does the product commit to? Every contrast ratio the guide
solves and checks comes from this one answer.

**Depends on:** product context.

**Only one sensible answer when:** the person has no legal or contractual requirement beyond the
usual. Then take AA in one line and move on.

## Options

| Option | Why                                                         | Trade-off                                                          | Wrong when                                | Label       |
| ------ | ----------------------------------------------------------- | ------------------------------------------------------------------ | ----------------------------------------- | ----------- |
| `AA`   | The level most products commit to and most laws ask for     | None for this guide                                                | A contract or regulator asks for AAA      | `automated` |
| `AAA`  | Stricter: text needs a contrast ratio of 7:1 instead of 4.5 | Fewer colours qualify, so the primary moves further from the brand | Nobody asked for it: the look pays for it | `automated` |

Level A is not offered: it has no contrast requirement for text, so the guide would have nothing to
hold.

What the level sets, from WCAG 2.2: at AA, text needs a contrast ratio of at least 4.5:1 (success
criterion 1.4.3) and interface components at least 3:1 (1.4.11). Levels add up: AA includes
everything in A.

**Recommendation when the person hands this to Claude:** `AA`.

## Recording

Write to `layers.accessibility` in `design/blueprint.json`: `status`, `source`, `choice`, `why`,
`rejected`.

Choice keys:

- `conformance_level`: `AA` or `AAA`.
