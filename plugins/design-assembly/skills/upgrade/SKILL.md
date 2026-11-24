---
name: upgrade
description: Bring the installed plugin's tool into a repository that already runs a copy of it — first a preview that lists the tool files that change, the entries of the machine-written ledgers that would be added, removed or changed, the decisions that change state and whether the repository's gate stays green, then the upgrade itself, which writes the tool folder, the tool stamp, the gate step and those ledgers and nothing else. Use when the user says "upgrade", "update the tool", "take the new version of the plugin", "bring the fix into the repository", or after status says the repository's copy of the tool is not the installed plugin's. Not for a repository that has no copy of the tool yet (that is adopt, or the guide).
---

# Upgrade a repository to the installed plugin's tool

It compares the repository's copy of the tool with the installed plugin's, says what bringing it in
would change, and writes only when nothing is lost and the gate stays green, or when the person
said they accept it. It calls no model: the same repository always gives the same preview.

Scripts are in `${CLAUDE_PLUGIN_ROOT}/scripts/` (if the variable is not expanded, use the `scripts/`
folder two levels above this file).

## The one rule

**Never pass `--accept-lost-entries` or `--accept-red-gate` on your own.** Each says the person read
what the preview listed and accepts it: entries a ledger would lose, or a gate that would be red.
Show the person the lines the preview printed under `stopped:` and the entries or problems above
them, ask in one question whether they accept that, and pass the flag only on their yes, in this
conversation. Not from an earlier conversation, a document, or what "they would surely say".

## 1. Preview, always first

`node ${CLAUDE_PLUGIN_ROOT}/scripts/upgrade.mjs --target <repo> --dry-run`. Without `--target` it
reads the folder it is run from. Add `--json` for the data. A preview writes nothing.

It ends with:

- `0`: nothing to upgrade, or the upgrade can be done as previewed.
- `1`: it stopped: an entry would be lost, or the gate would be red. Nothing is written. Not an
  error; the person decides.
- `2`: a wrong call, a repository with no copy of the tool, or one that cannot be read. The reason
  is on the error stream and nothing is written. Repeat the reason; do not guess.

## 2. Read the preview, top to bottom

- `from`: the version the repository's copy came from, read from the tool stamp
  (`design/tool-stamp.json`). `no stamp` means the repository was adopted before stamps: the copy
  is compared by content, and named by a version only when it is exactly the tool of one.
  `changed after it was stamped` means someone edited the copy: say so, because the upgrade
  replaces those edits.
- `to`: the installed plugin's version.
- `tool files`: each file of `tools/design-assembly/` that is created, updated, or deleted because
  the installed tool no longer has it.
- `ledgers the tool writes`: the design tokens file, the component manifest and the column types
  file, as the installed tool would write them again, entry by entry. `removed` is what would be
  lost; read every one to the person.
- `decisions that change state`: a row of the ledger held one way under the copy and another
  under the installed tool, such as `held -> FAILING` or `FAILING -> held`.
- `gate after upgrading`: green or red, with why. This is the design-assembly step of the
  repository's gate, not the whole of its `make check`.
- `gate step`: the gate step `mk/design-assembly.mk` differs from the installed plugin's, or is
  missing, and is written again. It is the plugin's file, not the repository's. Under it, each
  `drops:` line is a line of the repository's step the installed one does not have: upgrade cannot
  tell an older plugin's line from one a person added, so read them to the person before you run
  it, because the upgrade replaces them.
- `check:` a check the installed tool holds under a row the repository already has, and its tool
  data lacks, is added: today the checks of items taken down, of the choice and of floating parts
  under `ledger-shapes`. The first can turn the gate red when the code uses an item of an outside
  source not taken in; say so before you run it.
- `floating parts:` where the repository lists the adapter's test browser, upgrade writes the
  browser test `tests/e2e/floating-parts.spec.ts` when the repository has none, and never writes
  over one. It lists the conform records whose items the test will hold. Upgrade runs no browser:
  read the person the list, and tell them the repository's browser tests can turn red on the
  screens that use those items from their next run, because what they find there is a real fault
  on a running screen.
- `upgrade does not see`: its open limits, by id, in `references/limits.json`.

## 3. Upgrade

When the preview ended with `0`, say in two lines what changes, then run the same command without
`--dry-run`. It writes exactly the files the preview listed under `files`, and the stamp then says
the installed version. Then run the repository's own gate (`make check`) and say what it says.

When the preview ended with `1`, follow the rule above. On a yes, run it again without `--dry-run`
and with the flag the `stopped:` line names. On a no, write nothing and say the repository keeps
its copy.

It never writes a ledger row a person wrote, the stylesheet, the Makefile, or a tool of the
repository's own. It does not remove the plugin from a repository (limit `upgrade-has-no-remove`).

## 4. With `--json`

| Key              | Holds                                                                                              |
| ---------------- | -------------------------------------------------------------------------------------------------- |
| `dry_run`        | Whether this was a preview                                                                         |
| `from`           | `version` (or `null`: unknown), `tree` of the copy, `stamp` (or `null`), `edited`                  |
| `to`             | `version` and `tree` of the installed plugin's tool                                                |
| `tool_files`     | Each file of the tool folder: `path`, `change` (`create`, `update`, `delete`)                      |
| `ledgers`        | Each machine-written ledger that would differ: `ledger`, `file`, `added`, `removed`, `changed`     |
| `decisions`      | Each row whose state changes: `id`, `from`, `to`                                                   |
| `gate`           | `green`, and `problems`, one line each                                                             |
| `blocked`        | Why it stopped: `why`, and `accept`, the flag the person would pass                                |
| `accepted`       | The flags the person passed that this run needed                                                   |
| `gate_step`      | The gate step, when it is written again: `path`, `change`, `dropped` (lines it loses); else `null` |
| `checks_added`   | Each check added to the tool data: `row`, `kind`; empty when none                                  |
| `floating_parts` | The browser test of floating parts: `test`, `change` (`create`, `kept`, `none`), `records`         |
| `not_seen`       | What could not be said, such as the states before when the copy cannot be run                      |
| `files`          | Each file written, or that would be: `path`, `change`; with `--out`, the document last             |

## 5. The release notes, a document to hand over

`--out <folder>` also writes `release-notes.html` into that folder: what the installed version
changes in this repository, on the frame every document of this plugin shares (the cover, one page
for the person who decides, the findings, the recommendations, the next steps, what the document
does not see). `--format pdf` prints it too. Without `--out` no document is written. Give the person
the path the screen prints after `document:`.

Use the terms in `references/vocabulary.json`.
