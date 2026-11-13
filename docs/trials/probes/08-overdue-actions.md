# Probe brief, trial 8 — two new actions on the overdue list

Written for this trial only. It probes what was built just before it: the rule that two or more
actions on a row go behind one button, the part that draws that button, and the rule for a
concept the data model does not have yet.

## What you may read

Everything in the repository you are given. The parts that would tell you the answers have been
removed from your copy before you started. Do not look for them elsewhere on the machine.

Read what the repository tells a builder to read, in the order it says to read it.

## The work

The app has two screens: every item, and the items that are overdue. On the overdue screen, people
want two things on each item's row:

- push the item's date back by one week, which can be taken back if it was a mistake;
- mark the item as chased up. That cannot be taken back, and a person must be able to see on the
  list which items have already been chased up.

Build it. It must work at every width this repository checks.

You are finished when `make check` passes.

## What to report

1. Whether `make check` passes, and how many rounds of fixing it took.
2. **Every place you had to decide something yourself** because no page said which way to go: the
   choice, the two defensible ways, what you chose, where you looked first.
3. Every time you stopped and asked the person, and why; and every time a page told you not to ask
   and you went on.
4. **What you reused and what you wrote new.** Name every part of the repository you used as it
   was, every part you copied and changed, and every part you wrote from nothing.
5. Every fault you hit that no check caught.
6. Anything a page told you that turned out not to be true of this repository.

Report what happened, not what should have happened.
