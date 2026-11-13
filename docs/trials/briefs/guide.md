# Standard brief — the guide, from a repository with no design system

Fixed since trial 7. Changing a word here cuts the series in `../results.tsv`.

## Your situation

You are working in a repository that has the floor a scaffolding tool laid down — a React app built
with Vite, Tailwind, a component library, a Makefile with a `check` target — and nothing that says
what its design system is. You have just installed a Claude Code plugin called design-assembly.

You are the only agent on this repository. Nobody has run the plugin here before.

## What to do

Run the plugin's `new` skill from the beginning to the end, taking the depth that stops at every
layer with a real choice. Do not read the plugin's own source to work out what it will ask; use it
the way a person who installed it would.

When the skill tells you to ask the person something, stop and ask. The session running this trial
answers for the person. Take the answer as given — it may be ordinary words rather than a value or
a letter, and turning it into the right value is your job, not theirs.

You are finished when the repository's own `make check` passes and the plugin's audit reports the
coverage it has reached.

## What to report

1. The coverage the audit reports at the end, and whether `make check` passes.
2. Every question you asked the person, in the order you asked them.
3. Every place the skill left you to decide something yourself, with what you chose and why. This
   is the number the trial exists for, so do not round it down: a step where two readings of the
   instructions were both defensible counts, even if your choice turned out right.
4. Anything the skill told you to do that you could not do, or that failed.
5. Anything the skill said that turned out not to be true of this repository.

Report what happened, not what should have happened. A report that the run went perfectly is only
useful if it is true.
