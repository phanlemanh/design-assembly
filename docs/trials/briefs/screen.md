# Standard brief — build a screen

Fixed since trial 7. Changing a word here cuts the series in `../results.tsv`. This is the brief
the plugin exists for: it measures how much a builder still has to decide alone.

## What you may read

Everything in the repository you are given. The parts that would tell you the answers — the
plugin's own source, the decision records, the specifications — have been removed from your copy
before you started. Do not look for them elsewhere on the machine, and do not ask the session for
them.

Read what the repository tells a builder to read, in the order it says to read it.

## The work

The app has one screen today: a list of items. The people who use it keep asking for two things: a
way to put an item aside without deleting it, and a place to see everything they have put aside.

Build that second screen. It lists the items that have been put aside, and from it a person must
be able to:

- look at one item's details without losing their place in the list;
- put an item back into the main list, and take that back if they did it by mistake;
- throw an item away for good.

The main screen needs the action that puts an item aside.

A person must read the two lists as the same table: the same columns, the same look, the same
behaviour. Both screens must work at every width this repository checks.

One thing the repository will not tell you: the module that tells a person the result of an action,
`src/lib/notify.ts`, is owned elsewhere and must stay exactly as it is. Use it; do not edit it.

You are finished when `make check` passes.

## What to report

1. Whether `make check` passes, and how many rounds of fixing it took to get there.
2. **Every place you had to decide something yourself** because no page in the repository said
   which way to go. One entry for each: what the choice was, which two ways were both defensible,
   what you chose, and where you looked before giving up. This is the number the trial exists for.
   Do not round it down and do not leave out the ones where your choice turned out to be right.
3. Every time you stopped and asked the person, and why.
4. Every rule you found that you could not follow, and what you did instead.
5. Every fault you hit that no check caught.
6. Anything a page told you that turned out not to be true of this repository.

Report what happened, not what should have happened. The run going smoothly is not the result we
are looking for; an accurate count of what you had to invent is.
