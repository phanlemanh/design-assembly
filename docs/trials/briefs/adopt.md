# Standard brief — adopting a repository that already has its own answers

Fixed since trial 7. Changing a word here cuts the series in `../results.tsv`.

## Your situation

You are working in a repository that already has a design system of its own: values in its
stylesheet, components, screens, tests, and a ledger of design decisions written by its team. The
team has just installed a Claude Code plugin called design-assembly and wants to know what it would
add, without losing anything they decided themselves.

## What to do

Run the plugin's `adopt` skill from the beginning to the end, then its handoff skill to draw the
book.

The hard rule of this run: **nothing the repository already decided may change.** Not a value in
the stylesheet, not a row of its ledger, not a component. If the plugin proposes to write over
something, stop and report it instead of letting it happen.

Where the skill tells you to ask the person, stop and ask; the session answers for the person.

You are finished when the repository's own `make check` passes, the audit reports its coverage, and
the handoff book is drawn.

## What to report

1. The coverage the audit reports before and after adopting, and whether `make check` passes.
2. Every file the run changed, and for each one, whether it was a file the plugin owns or a file
   the repository owned first. Check this with `git diff`, not from memory.
3. Every row the run added to the ledger, and what each row points at as its proof.
4. Every question you asked the person.
5. Every place the skill left you to decide something yourself.
6. Anything in the book that is not true of this repository: a value it invented, a name it got
   wrong, a command it names that does not exist.

Report what happened, not what should have happened.
