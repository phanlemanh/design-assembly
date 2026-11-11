# Layer: foundations

**Framing.** What does the theme start from? In this version the guide covers colour only: the
person gives one source color, and the machine derives the tonal palette and the color roles from
it. Type scale, spacing scale, shape, density and motion stay as the floor set them.

**Depends on:** product context, accessibility. The conformance level fixes the contrast ratio every
color role must reach.

**Only one sensible answer when:** never. The source color is brand character: only the person
knows it. If they have none yet, propose one and say it is a proposal.

## The one question

Ask for the source color as `#rrggbb`. Then run `apply.mjs --dry-run` and show, before anything is
written:

- the primary for light and for dark, and the contrast ratio each reaches;
- whether the source color itself could be kept. When it does not reach the threshold on the
  background, the machine keeps its hue and moves its lightness to the nearest value that does, and
  prints a note. Tell the person in those words: the brand colour is still the source, the button
  colour is a step away from it.

## What the machine derives

| Derived                       | How                                                                                                       | Held by                                          |
| ----------------------------- | --------------------------------------------------------------------------------------------------------- | ------------------------------------------------ |
| Tonal palette, tones 0 to 100 | The source color's hue and chroma at each tone, cut to what a screen can show                             | Regenerating must give the same text             |
| Color role primary            | The source color when it meets the contrast ratio on the background, else the nearest lightness that does | A contrast check on the values in the stylesheet |
| Color role on-primary         | Near-white or near-black, whichever reads better on the primary                                           | A contrast check                                 |
| Focus ring                    | The primary                                                                                               | The same check as the primary                    |

The floor names its variables its own way: on-primary is written to `--primary-foreground`.

The background is read from the repository's own stylesheet, so the roles are solved against the
real page, not an assumed white.

## Options for a person who has no colour yet

| Option                         | Why                           | Trade-off                            | Label       |
| ------------------------------ | ----------------------------- | ------------------------------------ | ----------- |
| A colour from their brand      | The product looks like theirs | It may need to move to meet contrast | `automated` |
| A colour proposed by Claude    | Something to react to today   | It carries no brand meaning          | `automated` |
| Keep the floor's neutral theme | Nothing to decide             | The guide generates no colour tokens | `manual`    |

**Recommendation when the person hands this to Claude:** propose one colour, record
`source: proposed`, and show it in the final review so the person can replace it.

## Not in this version

Secondary and tertiary palettes, the other color roles, and every foundation other than colour. Say
so when asked; do not improvise them.

## Recording

Write to `layers.foundations` in `design/blueprint.json`: `status`, `source`, `choice`, `why`,
`rejected`.

Choice keys:

- `source_color`: a `#rrggbb` colour.
