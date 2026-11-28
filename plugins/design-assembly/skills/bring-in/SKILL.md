---
name: bring-in
description: Read what a tool from outside made — a token file, a DESIGN.md, an export of variables, or a design system folder of tokens and a README — into one candidate direction that stands beside the plugin's directions on the sheet, with every expression and reference computed to its final value, and put each value that goes against one the owner settled to the owner as a question, the ledger winning until they answer. Says how a person gets a file from a design tool that has a plug file, the first way first, and keeps an export of variables that was brought in under the sources ledger with a pin, so a later change of the file is seen. Use when the user brings a design system or a token file from another tool ("use the tokens from this tool", "here is our DESIGN.md", "take the system we made elsewhere", "compare this export with what we have"). Not for taking a component into the store (that is intake), and never to write the values in directly.
---

# Bring a direction in from outside

What a tool from outside made is a candidate, never an answer: this command writes nothing to a
ledger or a stylesheet. It writes only questions to the waiting list, for the values that go
against values the owner settled. It calls no model and no network, and answers nothing for anyone.
Keeping the export it read (step 6) is a command of its own, which writes one row of the sources
ledger and nothing else.

Scripts are in `${CLAUDE_PLUGIN_ROOT}/scripts/` (if the variable is not expanded, use the `scripts/`
folder two levels above this file).

## 1. Get the file

Ask the user for the file or folder the tool made, or read it where they point. Read only what the
user names.

When the system still lives in a design tool and the user has no file yet, run
`node ${CLAUDE_PLUGIN_ROOT}/scripts/bring-in.mjs --ways`. For each plug file that lists them, it
prints the ways a person gets a file this command reads. Tell the user each way as it is printed,
in the order it prints them, the first first: the first is the way to lead with, the others come
after it. A way marked `not read yet` is one this command cannot read today: say so, with the
reason printed beside it. Do not say the bridge reads it, and do not turn its files by hand into a
shape the command reads.

A way that starts from the design file saved to the machine needs a reader of that file, which is
somebody else's program. Never download, install, build or run a reader of a design file for the
user, and do not look for one on their machine. The user runs it themself and hands over the JSON it
leaves. The line `on the machine:` under the ways says what must be there, and names the reader
that was tried and its licence, which the user reads before running it. The design file itself
stays where the user saved it: it never enters a repository.

A tool's server in the session is not a way to bring a system in: it tells the setup step
(`/design-assembly:plugs`) that the tool is there, and this command asks nothing more of it. If the
user still asks for something to be looked up through it, the user starts it. Before each call to a
tool's service, say what is sent and where, as the line `sends:` under the ways says it, and that
the call costs one call of the account's quota. Call only its tools that read; never one that
writes to the design file or changes anything in the tool.

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

## 6. Keep the export

An export of variables that was brought in is kept in the repository with a pin, so that a later
change of it is seen. The export holds the values of the user's design system: it enters the
repository only when the user puts it there. The user puts the JSON file in the repository, in a
folder other than `design/sources/` (such as `design/outside/`); never the design file it was read
from. Then run
`node ${CLAUDE_PLUGIN_ROOT}/scripts/variables-source.mjs --target <repo> --file <path> --plug <id>`,
with the id of the plug the export came through, as `--ways` printed it (leave `--plug` out when it
came through none), and `--on <day>` when it was taken on another day than today. It writes one row
of the sources ledger, `design/sources/<id>.json`, with the day, the file's `sha256` and the plug,
and copies or changes no other file. It refuses a file that is not the JSON of variables, a file
outside the repository, and a row that is already there: repeat the reason.

`node ${CLAUDE_PLUGIN_ROOT}/scripts/variables-source.mjs --target <repo> --check` says, for every
kept export, whether its file is still the one that was pinned. It ends with `1` and names the row
and the file when one differs: say the line as it is. When the changed file is the newer export the
user means to keep, run the command with `--again --id <id>`, which pins the file as it is now,
with the day, and keeps every other word of the row; otherwise the user puts the pinned file back.
A formatter of the repository that rewrites the file changes its hash: pin the file after the
formatter ran over it, or keep its folder out of the formatter's reach.
