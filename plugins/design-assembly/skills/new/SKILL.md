---
name: new
description: Guide a person through the decision layers of a design system for their repository — product context, accessibility, foundations, conformance — with a recommendation at each layer, then generate the design tokens and the checks that hold them, so Claude Code can build screens without guessing. Use when the user wants to create, set up or start a design system, choose a brand colour or theme for a repository, or make a repository's design decisions checkable.
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

## 1. Check the repository

The guide builds on a design floor; it does not lay one. Run
`node ${CLAUDE_PLUGIN_ROOT}/scripts/apply.mjs --target <repo> --dry-run`.

- It refuses because the floor is missing: say what is missing in plain words and stop. A repository
  set up with `repo-setup` and its design layer has the floor.
- It refuses because `design/blueprint.json` is missing: that is the normal start. Go on.
- `design/blueprint.json` exists: resume from the first layer that is `pending`.

## 2. Show the whole picture

List the layers from `references/layers.json` in order, each with its state: already known, to
decide, or not built yet. Say in one line that the layers marked not built are announced and
skipped in this version. Invite the person to paste anything they have already decided, in any
form, and mark what they give as `source: user`.

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

Only two answers come from the person and nobody else: the product type, when the repository does
not already record it, and the source color. Do not ask about anything a layer page says the
machine derives.

Keep the blueprint `status` at `designing` until the final review.

## 5. Final review

Run `apply.mjs --target <repo> --dry-run` and show:

- one line per layer: what was chosen and where it came from (`user`, `proposed`, `repo`);
- the primary for light and dark and the contrast ratio each reaches, and any note that the source
  color had to move;
- the files that would be created or updated.

On approval, set `status: approved`. The approval is the person's: never set it for them.

## 6. Build without stopping

1. `node ${CLAUDE_PLUGIN_ROOT}/scripts/apply.mjs --target <repo>`.
2. `make format`, then `make design-assembly`. Then the repository's own `make check`.
3. A failure of `make design-assembly` means a decision is no longer held. Read the message: it
   names the decision and what is wrong. Fix the cause, never the check.
4. `make design-rate`, and explain the number: the determinism rate is the share of decisions held
   by a check that was seen failing. Decisions of kind judgment have no check by design.

## 7. Finish

Offer one commit. Then a short summary: what was decided, the determinism rate and what it does not
measure (whether the result looks good), what is not built yet, and that running this guide again
with the same answers changes nothing.

## Rules

- Never edit `tools/design-assembly/`, `mk/design-assembly.mk` or the generated block in
  `src/index.css` by hand. Change the blueprint and run `apply.mjs` again.
- Never weaken a check to make it pass.
- Never present a layer that is not built as if it were.
- Never change a choice the person stated without asking.
