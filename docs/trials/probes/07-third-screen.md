# Probe brief, trial 7 — a third screen of the same kind

Written for this trial only. It probes what was built just before it: the application frame, the
second screen of the list kind, and the parts of drawing the two screens share.

## What you may read

Everything in the repository you are given. The parts that would tell you the answers have been
removed from your copy before you started. Do not look for them elsewhere on the machine.

Read what the repository tells a builder to read, in the order it says to read it.

## The work

The app has two screens: every item, and the items that are overdue. People also want to see the
items that are still waiting, on a screen of their own, reached the same way as the other two.
From it a person must be able to look at one item's details. Nobody can make an item wait from
this screen; an item waits until someone acts on it elsewhere.

Build that screen. It must work at every width this repository checks.

You are finished when `make check` passes.

## What to report

1. Whether `make check` passes, and how many rounds of fixing it took.
2. **What you reused and what you wrote new.** Name every part of the repository you used as it
   was, every part you copied and changed, and every part you wrote from nothing. Count the lines
   you added and the lines you changed, from `git diff --stat`.
3. Whether you had to change the frame of the application to make the new screen reachable, and
   why or why not.
4. **Every place you had to decide something yourself** because no page said which way to go: the
   choice, the two defensible ways, what you chose, where you looked first.
5. Every fault you hit that no check caught.
6. Anything a page told you that turned out not to be true of this repository.

Report what happened, not what should have happened.
