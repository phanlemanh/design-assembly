---
name: conform
description: Conform an item of an outside source to the repository before it is taken in — record the item as taken down, record every change to its code as a patch with its reason, record each rule it is let off, apply the patches again on a newer item as taken down, and say whether the record holds. Use after the owner kept an outside candidate and its install line has run ("conform the item", "record this change to the vendored code", "the source shipped a new version"), when intake refuses a row because the conform record is missing or a rule is off with no exemption, or when the inventory reports a file of a conformed block as changed. Not for taking the item in (that is intake), finding a block (find), or editing the item's code by hand.
---

# Conform an outside item

An item from an outside source never fits the repository as it comes. The repository accepts that,
and conforms it before it is taken in: every change to its code is a recorded patch with its
reason, applied on the item as taken down, and every rule it is let off is an exemption with its
reason. A hand edit is never taken for a patch. The command calls no model, uses no network and runs
no install line; it uses the local git to make and apply a diff, and the repository's git for the
file as last committed.

Scripts are in `${CLAUDE_PLUGIN_ROOT}/scripts/` (if the variable is not expanded, use the `scripts/`
folder two levels above this file).

## 1. Start the record, once the item is taken down

After the owner kept the candidate and the person ran its install line:

`node ${CLAUDE_PLUGIN_ROOT}/scripts/conform.mjs --need <key> --source <id> --item <name> --file <path> [--file <path>...] --target <repo>`

Name every file the install line brought for the item. The record, `design/conform/<key>.json`,
holds each with its hash as taken down; nothing is patched yet. Commit it.

## 2. Change the item only through a patch

For a single component, wrap it in a component of the repository's own first; change its code only
where a wrapper cannot reach. To change a file of the item: commit the file as the record holds it,
make the change, then

`node ${CLAUDE_PLUGIN_ROOT}/scripts/conform.mjs --need <key> --patch <path> --reason "<why>"`

The patch is the diff from the file as committed to the file as it is, kept in the record with its
reason, in order. A rule the item is let off, in one of its files or for its folder, is

`node ${CLAUDE_PLUGIN_ROOT}/scripts/conform.mjs --need <key> --exempt <rule> --file <path> --reason "<why>"`

A rule turned off in a comment of a file (`eslint-disable`, `@ts-nocheck`, `@ts-ignore`,
`@ts-expect-error`) is exempted for that file. A folder left out of the formatter
(`formatter-ignore`, in `.prettierignore`), named in the lint configuration (`lint-config`) or in the
type check's (`typecheck-exclude`, a `tsconfig*.json`) is exempted for that configuration file.

## 3. Say whether the record holds

`node ${CLAUDE_PLUGIN_ROOT}/scripts/conform.mjs --need <key>` ends with 0 when every file is the
record's file after patching, the patches lead back to the files as taken down, and every rule off
is exempted. Each line that keeps it from holding is printed, and it ends with 1:

- a file changed with no patch: record the change with `--patch`, or take the item down again;
- a patch with no diff, from a record written by hand before this command: record it again with
  `--patch`;
- a rule off with no exemption: record the exemption, or turn the rule back on.

Run twice, it gives the same hashes and writes nothing. Then take the item in with `intake`.

## 4. A newer item from the source

Pin the source again, take the item down again with its install line, then

`node ${CLAUDE_PLUGIN_ROOT}/scripts/conform.mjs --need <key> --taken-down`

The patches are applied again, in order, on the files as taken down, and the command names each
file it takes down again. A file that is neither as taken down nor after patching is a newer item
only when the source's pin has changed since the record was written; otherwise it is a hand edit,
and the command ends with 2, names the file and writes nothing: record the change with `--patch`, or
take the item down again. The same item taken down again at the same pin needs no new pin.

When a patch no longer fits, the command ends with 2, names the patch and writes nothing: make the
change again on the newer file, record it, and drop the old patch. A patch at the very top of a
short file has no line above it to anchor on, so a line the newer item adds above it stops it too.
A file of the item not on disk stops it the same way.

## What it does not do

It does not take the item in, fetch the item, run its install line, or decide that a rule may be
let off: each exemption carries a person's reason. It reads a folder rule as text, so a glob that
covers the folder without naming it is not seen.
