---
name: status
description: Say where a repository's design system stands right now and what waits on its owner, without changing anything — the deliverable tier it has reached, one line per rhythm of the repository's life, every answer that waits on the owner with a recommendation and what the recommendation rests on, whether the repository's copy of the tool is the installed plugin's, and the command to run next. Use when the user asks for status or progress, "where are we", "what is waiting on me", "what do I have to decide", "what should I run next", or whether the repository runs the current tool. Not for the state of each standard decision or why a check fails (that is the audit).
---

# Status of a repository's design system

Read-only. It writes nothing in the repository, and it calls no model: the same repository always
gives the same answer. Run it at any moment; it is the short answer, and the audit is the long
one. Only when asked for a document does it write a file, and only into the folder named.

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
- `waiting on the owner`: each answer only a person can give. Three kinds are listed: a row of
  `design/decisions.yaml` whose note says a person has not confirmed it, a call only a person
  can make that the ledger has no row for, and a question of the waiting list (`design/waiting/`) that
  nobody answered. Each has a `recommendation`, a `because` and an `answer with`.
  `/design-assembly:decide` takes the answer to a row nobody confirmed and to a question of the
  waiting list. A permission in the waiting list is not counted: only the owner gives it.
- `tool`: whether the repository's copy under `tools/design-assembly/` is the tool of the
  installed plugin. Content decides, not the version number. The tool stamp
  (`design/tool-stamp.json`, written by the guide, adopt and upgrade) says which version the copy
  came from, and `changed after it was stamped` says someone edited the copy since. `no stamp`
  means the repository was adopted before stamps; a copy that is exactly the tool of a recorded
  release is then named by that version.
- `sockets`: how many sockets of the capability table (`references/capabilities.json`) have a
  default plug, and the id of each empty one, whose reason is a row of `references/limits.json`.
  `plugged in here` follows only when a plug from outside (`references/plugs/`) is found in this
  repository. The whole board is in `--json`.
- `status does not see`: the limits of this report, by id, in `references/limits.json`.
- `next`, then `then`: the commands to run, in order. On a repository with no design floor (no
  stylesheet, or a Makefile that does not include `mk/*.mk`), the last line says what is missing
  instead, and the guide and adopting are not offered: they would refuse. Say what is missing, and
  that the plugin builds on a floor and does not lay one.

## 3. Say it to the person

- Start with what waits on them, as a number, then each item as a question. Give the
  recommendation with what it rests on. A recommendation rests on a measurement taken on this
  repository now, or on a standard; the script never recommends a value it cannot ground, and
  neither do you.
- A proposal is not the person's answer. Do not say a row is decided while it is listed here, and
  do not answer for the person.
- More than five items: the screen shows five in full and names the rest. `--json` has them all.
- When the tool differs, `next` names `/design-assembly:upgrade`: offer its preview
  (`--dry-run`), which says what bringing the installed tool in would change. Do not copy files by
  hand.
- Always say the one thing this report cannot know: it reads the ledgers and the waiting list, so
  a question that waits somewhere else (a pull request, a conversation, a page of prose) is not
  counted. "Nothing in the ledgers or the waiting list" is not "nothing waits".
- A decision that is failing or bypassed does not wait on the owner's answer: status names the
  audit as the next command, and ends with `1`, because something is left to fix. Run the audit
  for the places.

## 4. With `--json`

| Key       | Holds                                                                                                           |
| --------- | --------------------------------------------------------------------------------------------------------------- |
| `tier`    | `id` of the tier reached or `null`, `state` (`reached`, `claimed`, `none`), `next`                              |
| `held`    | Core decisions this plugin's tool ran again now                                                                 |
| `claimed` | Core decisions that rest on a check nothing here ran again                                                      |
| `rhythms` | One entry per rhythm: `id`, `name`, `says`                                                                      |
| `waiting` | One entry per answer: `id`, `source`, `question`, `recommendation`, `basis`, `answer`                           |
| `tool`    | `recorded` (the tool stamp or `null`), `installed`, `copy`, `differs`, `says`                                   |
| `next`    | Commands in order: `command`, `why`. Empty when this version has nothing to run                                 |
| `sockets` | One entry per capability: `id`, `name`, `plug`, `state` (`plugged`, `empty`), `limit`, `outside` (`id`, `here`) |
| `missing` | What the repository lacks before the plugin can build on it, as one sentence, or `null` on a floor              |
| `files`   | Only with `--out`: each file written, `path` and `change` (`create` or `update`)                                |

`source` is `ledger` or `waiting-list`.

## 5. The status report, a document to hand over

`node ${CLAUDE_PLUGIN_ROOT}/scripts/status.mjs --target <repo> --out <folder>` writes
`status-report.html` into that folder: the same answer on the frame every document of this plugin
shares. Without `--out` no file is written. A relative folder is read from where the command is
run, never against the repository.

- The six parts, always in this order: the cover (the document's name, the repository, the date,
  the plugin's version, the scope examined), one page for the person who decides (the conclusion,
  the three things most worth attention, what they must decide), the findings by severity with
  their evidence, the recommendations with what each rests on and what to do, the next steps with
  the command to run, and what the document does not see. A part with nothing to show says so in
  one line.
- The date on the cover is the day of the repository's last commit, never today's: the same
  repository gives the same page, byte for byte.
- `--format pdf` also prints `status-report.pdf` from the page, with the browser in the
  repository's own packages. Where there is none, the page is still written, the call ends with
  `1`, and the screen says why. Say so; do not look for another browser.
- The report writes out the first five questions and names the rest, as the screen does.
- Give the person the path the screen prints after `document:`. Do not rewrite the document's
  findings in your own words, and do not add a recommendation it does not make.

Use the terms in `references/vocabulary.json`.
