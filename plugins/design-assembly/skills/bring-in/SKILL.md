---
name: bring-in
description: Read what a tool from outside made — a token file, a DESIGN.md, an export of variables, or a design system folder of tokens and a README — into one candidate direction that stands beside the plugin's directions on the sheet, with every expression and reference computed to its final value, and put each value that goes against one the owner settled to the owner as a question, the ledger winning until they answer. Use when the user brings a design system or a token file from another tool ("use the tokens from this tool", "here is our DESIGN.md", "take the system we made elsewhere", "compare this export with what we have"). Not for taking a component into the store (that is intake), and never to write the values in directly.
---

# Bring a direction in from outside

What a tool from outside made is a candidate, never an answer: this command writes nothing to a
ledger or a stylesheet. It writes only questions to the waiting list, for the values that go
against values the owner settled. It calls no model and no network, and answers nothing for anyone.

Scripts are in `${CLAUDE_PLUGIN_ROOT}/scripts/` (if the variable is not expanded, use the `scripts/`
folder two levels above this file).

## 1. Get the file

Ask the user for the file or folder the tool made, or read it where they point. Read only what the
user names. A file reached through the network or a tool from outside is that tool's to give: when
reading it needs an account or sends anything out, the user starts it, and you say first what goes
where.

## 2. Run it

`node ${CLAUDE_PLUGIN_ROOT}/scripts/bring-in.mjs --from <path> --target <repo>`. The kind is read
from the path: a folder is a system of `tokens.json` and `README.md`, a `.md` file is a DESIGN.md,
a JSON file of variables by collection is an export of variables, any other JSON file is a token
file; `--kind tokens|design-md|variables|system` says it when that guess is wrong. Add `--json` for
the data, `--dry-run` to write no question. When an export of variables holds its source colour in
two collections with two values, the command refuses and names both: ask the user which, and run it
again with `--collection <name>` (or the collection's id, where two share a name); never choose one
for them.

It ends with:

- `0`: no value goes against a value the owner settled.
- `1`: questions wait on the owner. Not an error.
- `2`: a wrong call, or a source or a repository that cannot be read, or a source with no primary
  colour. The reason is on the error stream and nothing is written. Repeat the reason.

## 3. Say what it read

Tell the user the candidate's colour (and the token it was taken from), type scale and corner
radius, then each line under it as it is: what an expression or a reference was computed to, what the source does not say (the floor's
value is drawn), what was taken to the plugin's nearest value, what could not be read, and the
fonts it names (a typeface is chosen with its source, not here). For an export of variables, also
say each line of what it counted: the values read, the collections set aside as copies of a library
or hidden from publishing, the variables the foundations do not use, the values the export holds
none for, the axes of modes it did not carry and the mode it took, and colours below full alpha.

## 4. Draw it beside the plugin's directions

`node ${CLAUDE_PLUGIN_ROOT}/scripts/specimen.mjs --target <repo> --section direction --from <path>`
draws the candidate as the last direction of the sheet, on the repository's own screen, light and
dark, with the contrast it reaches. Dark is derived from its source colour, as for every direction;
a dark colour of the source's own is said beside it, not drawn. Picking it writes its values as
the owner's answer, as for any direction, through the guide.

## 5. The questions

Each value against a settled one is a question on the decision sheet (`/design-assembly:decide`),
recommending the settled value: the ledger wins over an outside source. A refusal changes nothing
by itself; the outside value is taken only when the guide runs again and the owner picks it.
