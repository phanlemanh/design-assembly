---
name: status
description: Say where a repository's design system stands right now and what waits on its owner, without changing anything — the deliverable tier it has reached, one line per rhythm of the repository's life, every answer that waits on the owner with a recommendation and what the recommendation rests on, whether the repository's copy of the tool is the installed plugin's, and the command to run next. Use when the user asks for status or progress, "where are we", "what is waiting on me", "what do I have to decide", "what should I run next", or whether the repository runs the current tool. Not for the state of each standard decision or why a check fails (that is the audit).
---

# Status of a repository's design system

Read-only. It writes nothing, in the repository or anywhere else, and it calls no model: the same
repository always gives the same answer. Run it at any moment; it is the short answer, and the
audit is the long one.

Scripts are in `${CLAUDE_PLUGIN_ROOT}/scripts/` (if the variable is not expanded, use the `scripts/`
folder two levels above this file).

## 1. Run it

`node ${CLAUDE_PLUGIN_ROOT}/scripts/status.mjs --target <repo>`. Without `--target` it reads the
folder it is run from. Add `--json` for the data; another plugin calls it that way.

It ends with:

- `0`: nothing waits, and nothing is left to fix.
- `1`: something waits on a person, the tool differs, or a decision is failing or bypassed. Not
  an error.
- `2`: a wrong call, or a repository that cannot be read. The reason is on the error stream, and
  nothing is printed as an answer. Repeat the reason; do not guess a status.

## 2. Read the screen, top to bottom

- `tier`: the highest deliverable tier with every tier below it in place
  (`references/tiers.json`), then the next one. `claimed` means complete, but resting on checks
  that were not run again here: say so. The line under it gives two numbers of core decisions,
  held and claimed. Never add them.
- `rhythms`: one line for each rhythm of a repository's life, read from the repository as it is
  now: it is born (where its values come from), it meets the plugin (the ledger), a feature needs
  a new block (not built in this version), every change (the checks in the gate and the shape of
  the ledgers), and periodically (the record of what slipped past the checks).
- `waiting on the owner`: each answer only a person can give. Two kinds are listed: a row of
  `design/decisions.yaml` whose note says a person has not confirmed it, and a call only a person
  can make that the ledger has no row for. Each has a `recommendation`, a `because` and an
  `answer with`.
- `tool`: whether the repository's copy under `tools/design-assembly/` is the tool of the
  installed plugin. Content decides, not the version number. `no stamp` means the repository does
  not record which version it took; no command of this version writes the tool stamp
  (`design/tool-stamp.json`), so today every repository reads that way.
- `status does not see`: the limits of this report, by id, in `references/limits.json`.
- `next`, then `then`: the commands to run, in order.

## 3. Say it to the person

- Start with what waits on them, as a number, then each item as a question. Give the
  recommendation with what it rests on. A recommendation rests on a measurement taken on this
  repository now, or on a standard; the script never recommends a value it cannot ground, and
  neither do you.
- A proposal is not the person's answer. Do not say a row is decided while it is listed here, and
  do not answer for the person.
- More than five items: the screen shows five in full and names the rest. `--json` has them all.
- When the tool differs, say that this version has no command that brings the installed tool into
  a repository, and name the limit the screen prints. Do not copy files by hand unless the person
  asks.
- Always say the one thing this report cannot know: it reads the ledgers, so a question that waits
  somewhere else (a review list in prose, a pull request, a conversation) is not counted.
  "Nothing in the ledgers" is not "nothing waits".
- A decision that is failing or bypassed does not wait on the owner's answer: status names the
  audit as the next command, and ends with `1`, because something is left to fix. Run the audit
  for the places.

## 4. With `--json`

| Key       | Holds                                                                              |
| --------- | ---------------------------------------------------------------------------------- |
| `tier`    | `id` of the tier reached or `null`, `state` (`reached`, `claimed`, `none`), `next` |
| `held`    | Core decisions this plugin's tool ran again now                                    |
| `claimed` | Core decisions that rest on a check nothing here ran again                         |
| `rhythms` | One entry per rhythm: `id`, `name`, `says`                                         |
| `waiting` | One entry per answer: `id`, `question`, `recommendation`, `basis`, `answer`        |
| `tool`    | `recorded` (the tool stamp or `null`), `installed`, `copy`, `differs`, `says`      |
| `next`    | Commands in order: `command`, `why`. Empty when this version has nothing to run    |

Use the terms in `references/vocabulary.json`.
