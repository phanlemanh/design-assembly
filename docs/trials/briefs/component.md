# Standard brief — use a block for a need

Fixed since the measurement of the components socket on 2026-11-23 (plan item 10.2). Changing a word
here cuts the series of that socket. It measures how much a builder still has to decide alone when
a block for a need comes from the store, against when it is made by hand. Two arms run it, each on
its own copy; the one paragraph that differs between them is given below the brief, as it was
given to each.

## What you may read

Everything in the repository you are given. The parts that would tell you the answers — the
plugin's own source, the decision records, the specifications — have been removed from your copy
before you started. Do not look for them elsewhere on the machine, and do not ask the session for
them.

Read what the repository tells a builder to read, in the order it says to read it.

Do not fetch anything from the network and do not install packages: everything you need is in the
copy.

## The work

Every list screen of the app filters its items by name, with one field. The people who use it also
need to narrow a list by an item's status and by its date. Add that to the list, on every screen
that shows it.

{the paragraph of the arm}

You are finished when `make check` passes. If it still fails after six rounds of fixing, stop and
report where it stands.

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

## The paragraph of each arm

**The store's block.** The repository's store already holds a block for this need: its row is in
`design/intake/filter-by-status-and-date.yaml`, and its files are in the repository. Use that
block.

**By hand.** The store holds no block for this need, and the owner has said it is to be made by
hand, as a component of the repository's own: the question and its answer are in
`design/waiting/intake-filter-by-status-and-date.json`. Make it, and name its file in your report.
