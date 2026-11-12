# Layer: product context

**Framing.** What kind of product are the screens for, and which accessibility conformance level
does it commit to? Later layers read both: the level fixes every contrast ratio the guide solves
and checks; the product type sets which type scale is recommended and, later, density and
templates.

**Depends on:** nothing.

## Product type

**Only one sensible answer when:** the repository already records it. A repository set up with
`repo-setup` has `design_surface` in `.repo-setup.json`: `tool` means `application`, `content` means
`content-site`. Then say it in one line, and move on.

| Option         | Why                                                 | Trade-off                         | Wrong when                           | Label       |
| -------------- | --------------------------------------------------- | --------------------------------- | ------------------------------------ | ----------- |
| `application`  | People work in the screens all day: lists, forms    | Dense views need stricter rules   | People mostly read long text         | `automated` |
| `content-site` | People mostly read: marketing, documentation, posts | Fewer components, more typography | Staff enter and edit data on screens | `automated` |

**Recommendation when the person hands this to Claude:** infer it from the README and the existing
screens. Back-office screens, dashboards and forms mean `application`.

## Conformance level

**Only one sensible answer when:** the person handed the guide to Claude and named no legal or
contractual requirement. Then take AA in one line and move on. In review each layer, ask one
question with AA recommended: only the person knows whether a contract or a regulator asks for
more.

| Option | Why                                                         | Trade-off                                                          | Wrong when                                | Label       |
| ------ | ----------------------------------------------------------- | ------------------------------------------------------------------ | ----------------------------------------- | ----------- |
| `AA`   | The level most products commit to and most laws ask for     | None for this guide                                                | A contract or regulator asks for AAA      | `automated` |
| `AAA`  | Stricter: text needs a contrast ratio of 7:1 instead of 4.5 | Fewer colours qualify, so the primary moves further from the brand | Nobody asked for it: the look pays for it | `automated` |

Level A is not offered: it has no contrast requirement for text, so the guide would have nothing to
hold.

What the level sets, from WCAG 2.2: at AA, text needs a contrast ratio of at least 4.5:1 (success
criterion 1.4.3) and interface components at least 3:1 (1.4.11). Levels add up: AA includes
everything in A.

## Recording

Write to `layers.context` in `design/blueprint.json`: `status`, `source`, `choice`, `why`,
`rejected`. `source` is `repo` only when both answers were read from the repository; `user` when the
person gave either; otherwise `proposed`.

Choice keys:

- `product_type`: `application` or `content-site`.
- `conformance_level`: `AA` or `AAA`.

Both become rows of the ledger, of kind judgment.
