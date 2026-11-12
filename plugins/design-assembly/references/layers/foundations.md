# Layer: foundations

**Framing.** What does the theme start from? The person gives a source color and picks a type scale
and a corner radius; the machine derives the rest and checks it. Spacing stays on the floor's unit.
Density, elevation, motion and iconography are not in this version.

**Depends on:** product context. Its conformance level fixes the contrast ratio every color role
must reach. Its product type sets which type scale is recommended.

**Only one sensible answer when:** never for the source color: it is brand character, only the
person knows it. Spacing always has one answer in this version: say it in one line.

## The questions

Show before asking: `scripts/specimen.mjs` draws every option of this layer on the repository's
own screen, and the person answers with a letter (see "Show, then ask" in the guide). The words
below are for explaining a letter, not for choosing by.

Ask one section at a time, in this order: each is shown on the sheet before it is asked. The
sheet shows the type scales that suit the product type; `--all-ratios` draws every one, when the
person asks for a stronger or a gentler scale than those. After `--around`, draw the other
sections again with `--section type` and `--section radius`.

1. **Source color**, as `#rrggbb` or as the stylesheet writes a colour, `oklch(L C H)`. Never
   convert a colour by hand: copy it in the form you found it.
2. **Type scale**: the floor's standard, or a modular scale. If modular, which ratio.
3. **Corner radius**: one step of the shape scale.

Then record the layer as `decided`, keep the blueprint `designing`, and run
`apply.mjs --target <repo> --dry-run`. The preview needs no approval. Show, quoting its lines:

- the primary for light and for dark, and the contrast ratio each reaches;
- whether the source color itself could be kept. When it does not reach the threshold on the
  background, the machine keeps its hue and moves its lightness to the nearest value that does;
  chroma follows where the screen cannot show the colour at that lightness.
  Tell the person in those words: the brand colour is still the source, the button colour is a
  step away from it;
- the type sizes and line heights, when the scale is modular;
- the corner radius.

If the person wants something else, change that choice and preview again. Never estimate a
contrast ratio or a size yourself: the preview computes them from the repository's real stylesheet.

## Color

| Option                         | Why                           | Trade-off                            | Label       |
| ------------------------------ | ----------------------------- | ------------------------------------ | ----------- |
| A colour from their brand      | The product looks like theirs | It may need to move to meet contrast | `automated` |
| A colour proposed by Claude    | Something to react to today   | It carries no brand meaning          | `automated` |
| Keep the floor's neutral theme | Nothing to decide             | The guide generates no colour tokens | `manual`    |

| Derived                       | How                                                                                                       | Held by                                          |
| ----------------------------- | --------------------------------------------------------------------------------------------------------- | ------------------------------------------------ |
| Tonal palette, tones 0 to 100 | The source color's hue and chroma at each tone, cut to what a screen can show                             | Regenerating must give the same text             |
| Color role primary            | The source color when it meets the contrast ratio on the background, else the nearest lightness that does | A contrast check on the values in the stylesheet |
| Color role on-primary         | Near-white or near-black, whichever reads better on the primary                                           | A contrast check                                 |
| Focus ring                    | The primary                                                                                               | The same check as the primary                    |

**When Claude proposes the colour.** Any choice is a placeholder: say so, and record
`source: proposed`. Prefer a colour with a hue that the repository already uses somewhere, and say
where it came from; if there is none, say that the pick is arbitrary. It is not a brand decision
until the person says it is.

The generated block changes the primary color role, the text on it, the focus ring and the corner
radius. Every other color role keeps the floor's value.

The floor names its variables its own way: on-primary is written to `--primary-foreground`. The
background is read from the repository's own stylesheet, so the roles are solved against the real
page, not an assumed white.

## Type scale

| Option     | Why                                                                   | Trade-off                                                | Wrong when                                         | Label       |
| ---------- | --------------------------------------------------------------------- | -------------------------------------------------------- | -------------------------------------------------- | ----------- |
| `standard` | The floor's sizes, 12 to 48px: every Tailwind user already knows them | The steps are hand-picked, not related by one ratio      | The brand needs a stronger typographic voice       | `automated` |
| `modular`  | Every size follows from text-base and one ratio: a modular scale      | `text-sm` no longer means 14px; people used to it notice | Screens are dense and the team relies on the sizes | `automated` |

A modular scale keeps text-base at 16px and multiplies by the ratio for each step up, divides for
each step down, rounding to whole pixels. The ratios, smallest first: minor second 1.067, major
second 1.125, minor third 1.2, major third 1.25, perfect fourth 1.333.

Larger ratios give stronger hierarchy at both ends. At perfect fourth, text-5xl is 90px and text-xs
is 9px. From minor third up, text-xs falls below the floor's smallest size of 12px, and the preview
prints a note. No standard sets a minimum text size, so the guide warns instead of refusing.

Line height follows the floor's named leadings: 1.5 for text-base and smaller, 1.25 above. It is
then rounded up to the 4px unit, so lines sit on a baseline grid.

**Held by:** with `standard`, a check that the stylesheet declares none of the type scale variables
itself. With `modular`, a check that every step reads back larger than the one before and that no
line height is below its size.

## Spacing scale

One option: the floor's 4px unit. In this floor the same unit also sizes controls (width, height,
size), so changing it would resize every component. That is a density decision, and density is not
in this version. Say so in one line.

**Held by:** a check that the stylesheet does not declare `--spacing` itself.

## Shape

The corner radius, named as in the Material Design 3 shape scale: `none` 0, `extra-small` 4px,
`small` 8px, `medium` 12px, `large` 16px. `floor` keeps the floor's 10px. The floor derives its
smaller and larger radii from this one value.

**Held by:** a check that `--radius` resolves to the decided value, so a rule added later in the
stylesheet cannot change it unnoticed.

## What the floor's components do not follow

Checked in a browser on 2026-11-11 with the shadcn components the floor installs:

- The default and small buttons set their own text size (`0.8rem`), so a modular scale does not
  reach them.
- Small buttons and the select trigger cap their corner radius at 10 to 12px, so `medium` and
  `large` round inputs and cards more than those controls.

Tell the person this when they pick `modular` or a radius above `floor`. The guide does not edit
the vendor's components; the core components layer is where this will be closed.

## Recommendation when the person hands this to Claude

Propose a source color and record `source: proposed`. Keep `standard` for an application and
propose `modular` with `major-third` for a content site. Keep the floor's corner radius. Put all
three first in the final review so the person can replace them.

## Recording

Write to `layers.foundations` in `design/blueprint.json`: `status`, `source`, `choice`, `why`,
`rejected`.

Choice keys:

- `source_color`: a `#rrggbb` colour.
- `type_scale`: `standard` or `modular`.
- `type_ratio`: only when `type_scale` is `modular`: `minor-second`, `major-second`, `minor-third`,
  `major-third` or `perfect-fourth`.
- `spacing_unit`: `4px`.
- `corner_radius`: `floor`, `none`, `extra-small`, `small`, `medium` or `large`.

A blueprint decided before these keys existed keeps the floor's values; the preview says so.
