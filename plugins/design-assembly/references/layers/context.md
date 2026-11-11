# Layer: product context

**Framing.** What kind of product are the screens for? Later layers read this: density, which
templates are offered, how much text a view carries.

**Depends on:** nothing.

**Only one sensible answer when:** the repository already records it. A repository set up with
`repo-setup` has `design_surface` in `.repo-setup.json`: `tool` means `application`, `content` means
`content-site`. Then say it in one line, record `source: repo`, and move on.

## Options

| Option         | Why                                                 | Trade-off                         | Wrong when                           | Label       |
| -------------- | --------------------------------------------------- | --------------------------------- | ------------------------------------ | ----------- |
| `application`  | People work in the screens all day: lists, forms    | Dense views need stricter rules   | People mostly read long text         | `automated` |
| `content-site` | People mostly read: marketing, documentation, posts | Fewer components, more typography | Staff enter and edit data on screens | `automated` |

Labels: `automated` (`apply.mjs` records it and later layers act on it), `manual` (only recorded).

**Recommendation when the person hands this to Claude:** infer it from the README and the existing
screens. Back-office screens, dashboards and forms mean `application`.

**What it changes today.** Nothing is generated from it yet. It is recorded now because the
templates and density steps will read it; say so plainly.

## Recording

Write to `layers.context` in `design/blueprint.json`: `status`, `source` (`user`, `proposed` or
`repo`), `choice`, `why`, `rejected`.

Choice keys:

- `product_type`: `application` or `content-site`.
