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
`rejected`. `source` is `user` only when the person gave both answers. When one was read from the
repository and the person gave the other, `source` is `repo` and the person's choice key is listed
under `confirmed`, such as `"confirmed": ["conformance_level"]`; when the person gave one and you
proposed the other, `source` is `proposed` with the same list. Only the listed rows then say a
person decided; the row of the other answer says it was read or proposed, until a person confirms
it. When both were read from the repository, `source` is `repo` and nothing is listed.

Choice keys:

- `product_type`: `application` or `content-site`.
- `conformance_level`: `AA` or `AAA`.

Both become rows of the ledger, of kind judgment.

## Design principles

Asked after the two answers above and before the foundations: three to five statements of what
the design favours, picked from `references/principles.json` or written in the owner's own words
(see "Design principles first" in the guide). Write them to `layers.context.principles`, each
`{ "id", "source" }`, with `text` for the owner's own words. Each becomes a row of the ledger,
`principle-<id>`, of kind judgment, and is listed on the layer's record page. A principle whose
`source` is `proposed` says in its row that a person has not confirmed it; keeping it on the
decision sheet makes it the owner's.

A blueprint that lists no principles was decided before they existed and is still applied: the
preview says so in a `hint:` line.
