---
name: new
description: Guide a person through the decision layers of a design system for their repository — product context and foundations today — with a recommendation at each layer, then generate the design tokens, the checks that hold them and the ledger rows that record them, so Claude Code can build screens without guessing. Use when the user wants to create, set up or start a design system in a repository that has no brand values of its own yet, choose a brand colour, type scale or corner radius for a repository, or make a repository's design decisions checkable.
---

# Guide a person to a design system Claude Code can build from

One flow for everyone; only the number of stops differs. A newcomer may not know what a design
token is. A professional designer arrives with a brand and wants it kept.

Scripts are in `${CLAUDE_PLUGIN_ROOT}/scripts/` (if the variable is not expanded, use the `scripts/`
folder two levels above this file). Layer pages are in `${CLAUDE_PLUGIN_ROOT}/references/layers/`.

## Words

Every name you show comes from `references/vocabulary.json`. Keep the term in English in every
conversation language, and explain it in one clause the first time it appears. Do not coin a word
for something the list already names, and do not use a word its `avoid` lists.

## 0. Audit first

Run `/design-assembly:audit` on the repository before anything else. If it shows that the
repository already has its own brand values (a source color recorded from the stylesheet, a ledger
with foundations rows), stop: the guide generates the primary color roles and would replace them.
Offer `/design-assembly:adopt` instead, which keeps those values and puts checks around them.

`apply.mjs` enforces this. It refuses to write where the stylesheet has a primary color role with
a hue of its own, or where values were adopted. `--replace` lifts the refusal: pass it only when
the person has said, in their own words, that the existing values are to be given up.

## 1. Check the repository

The guide builds on a design floor; it does not lay one. Run
`node ${CLAUDE_PLUGIN_ROOT}/scripts/apply.mjs --target <repo> --dry-run`.

The floor is checked first, then the blueprint.

- It refuses because the floor is missing: say what is missing in plain words and stop. A repository
  set up with `repo-setup` and its design layer has the floor.
- It refuses because `design/blueprint.json` is missing: that is the normal start. Create it with
  the shape below, then go on.
- `design/blueprint.json` exists: resume from the first built layer that is `pending`.

The blueprint is the only file you write by hand. Its shape:

```json
{
  "version": 1,
  "status": "designing",
  "depth": "hand | review",
  "layers": {
    "<layer id>": {
      "status": "pending | decided | planned",
      "source": "user | proposed | repo",
      "choice": { "<choice key>": "<value>" },
      "why": "one or two sentences",
      "rejected": [{ "option": "<value or name>", "why": "one sentence" }]
    }
  }
}
```

Every layer of `references/layers.json` has an entry. A built layer starts as `pending`; a layer
with `built: false` is `{"status": "planned"}`. `source`, `choice`, `why` and `rejected` are written
when the layer is decided. Choice keys are listed at the end of each layer page.

`rejected` lists only the options that were actually offered and turned down. It is `[]` when the
person gave the value without being offered alternatives, and for a layer with a single option.

`source` says who the answer came from: `user` when the person gave it, `repo` when it was read from
the repository, `proposed` for everything else, including a layer with a single option.

## 2. Show the whole picture

List the layers from `references/layers.json` in order, each with its state: already known, to
decide, or not built yet. Say in one line that the layers marked not built are announced and
skipped in this version. Invite the person to paste anything they have already decided, in any
form, and mark what they give as `source: user`. This is not a stop: go on in the same message.

## 3. Choose the depth

Infer it; ask only if unclear.

- **Hand it to Claude**: no design preferences stated. Take the recommendation at every layer and
  stop only at the final review.
- **Review each layer**: stop at every layer with a real choice.

## 4. Go through the layers

For each layer with `built: true`, read `references/layers/<id>.md` and run this loop:

1. **Framing**: one sentence on what this layer decides and what earlier layers imply.
2. **Options**: two or three, each with why, trade-off and when it is wrong. Recommended first.
3. **Decide**: write the layer to `design/blueprint.json` with `status: decided`, `source`,
   `choice`, `why` and `rejected`.

A layer with only one sensible answer gets one line, no question. A layer with `built: false` is
recorded as `{"status": "planned"}`.

Four answers belong to the person, because they are taste or brand: the product type, when the
repository does not already record it; the source color; the type scale; and the corner radius. The
conformance level is theirs too when a contract or a regulator sets it; otherwise it is AA. In
**review each layer**, ask for them. In **hand it to Claude**, propose them, record
`source: proposed`, and put them first in the final review so the person can replace them. Never
ask about anything a layer page says the machine derives.

As soon as product context and foundations are decided, run the preview,
`apply.mjs --target <repo> --dry-run`. It works before approval and prints, for light and dark, the
primary and the contrast ratio it reaches, and whether the source color had to move; then the type
scale, the spacing scale and the corner radius, and any note. In **review each layer**, show those
lines in the foundations stop. Quote the numbers it prints; never estimate a contrast ratio or a
size yourself.

Keep the blueprint `status` at `designing` until the final review.

## 5. Final review

Run the preview again, `apply.mjs --target <repo> --dry-run`, and show:

- one line per layer: what was chosen and where it came from (`user`, `proposed`, `repo`);
- the primary for light and dark and the contrast ratio each reaches, and any note that the source
  color had to move;
- the type scale and the corner radius, and any note about small type sizes;
- the files that would be created or updated.

On approval, set `status: approved`. The approval is the person's: never set it for them. If the
person wants another colour or level instead, change that layer, keep `status: designing`, and show
the preview again.

## 6. Build without stopping

1. `node ${CLAUDE_PLUGIN_ROOT}/scripts/apply.mjs --target <repo>`. It writes the tokens into the
   stylesheet, its rows into the ledger `design/decisions.yaml`, the component manifest
   `design/component-registry.json` read from the component source, the design tokens file
   `design/tokens.json` read back from that stylesheet, and installs the checks into the
   repository's gate. `references/checks.md` says what each file is. If a tokens file was already
   there and says something else, it is kept and the script says so: tell the person.
2. `make format`, then `make design-assembly`. Then the repository's own `make check`.
3. A failure of `make design-assembly` means a decision is no longer held. Read the message: it
   names the decision and what is wrong. Fix the cause, never the check.
4. `make design-rate`, and explain the number: the determinism rate is the share of the ledger's
   decisions that have a check. `held` means this plugin's tool ran it now and saw it fail on a
   changed copy; `claimed` means another check is named and was not run here. Decisions of kind
   judgment have no check by design: the product type, the conformance level and the source color
   are a person's calls. What follows from them, such as every contrast ratio, is checked.
5. `/design-assembly:audit` again, and show which tier the repository has reached and what the
   next one misses.

## 7. Finish

Offer one commit. Then a short summary: what was decided, the determinism rate and what it does not
measure (whether the result looks good), what is not built yet, and that running this guide again
with the same answers changes nothing.

## Rules

- Never edit `tools/design-assembly/`, `mk/design-assembly.mk`, `design/theme.json` or the
  generated block in `src/index.css` by hand. Change the blueprint and run `apply.mjs` again.
- In `design/decisions.yaml`, touch only what `apply.mjs` writes. Rows another person wrote stay
  exactly as they are.
- Never weaken a check to make it pass.
- Never present a layer that is not built as if it were.
- Never change a choice the person stated without asking.
