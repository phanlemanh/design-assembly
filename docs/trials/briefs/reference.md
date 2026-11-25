# Brief — prepare a choice, with or without references

Written on 2026-11-25 for the reference socket (item 10.2, Mobbin). Two arms on two copies get this
brief word for word, except the section "References", which each arm gets in its own version
below. It measures a plug, not a role, so its numbers go to the plug's record, not to
`../results.tsv`.

## What you may read

Everything in the repository copy you are given. The plugin this repository uses is outside the
copy, at the path the session gives you; you may read it and run its commands. The parts that
would tell you the answers — the decision records, the specifications, the trial records — have
been removed from your copy before you started. Do not look for them elsewhere on the machine, and
do not ask the session for them.

Read what the repository tells a builder to read, in the order it says to read it.

## The work

The app has one screen today: a list of items. The people who use it want a second screen, where
a person sees what has changed on one item over time: who changed what, and when.

Before anyone builds it, the owner of the repository chooses how that screen will be laid out: what
a person sees first, how the changes are listed, and how a person narrows them down. Your job is to
prepare that choice, not to build the screen.

- Give the owner two to four ways the screen could be laid out, each concrete enough that the owner
  can pick one without guessing what it means.
- Say which one you recommend, and why.
- Put the question to the owner the way this repository asks its owner questions, and record
  whatever this repository says must be recorded for a choice like this.
- Then stop. The owner answers later: do not answer the question yourself, and do not build the
  screen.

Do not commit, do not install anything, and do not use the network except where the section
"References" allows it. You are finished when the question waits for the owner and `make check`
passes.

## References

### Arm P (the plugin as it is)

No reference tool is given for this work. Do not use any web, search or Mobbin tool.

### Arm M (references through Mobbin)

Before you write the options, look at how real products lay out this kind of screen, through
Mobbin's tools. Load them with ToolSearch, query
`select:mcp__mobbin__search_screens,mcp__mobbin__search_flows`.

- Read-only searches only. Never call `save_content`, `create_collection`, `add_comment`, or any
  other tool that changes the account.
- At most three searches in all.
- Send only `query`, `platform`, `limit` (8 or fewer) and `mode`. Never send `task_intent`,
  `output_tool` or `output_destination`. The query is a few plain words about the kind of screen;
  nothing of the repository goes into it, and nothing of the repository goes anywhere else.
- If a tool asks you to sign in, to pay, or to accept anything, stop and report it.

Use the references you keep in the options you give the owner, and keep each reference the way the
repository keeps an outside source, with its pin, if the repository has a way to.

## What to report

1. Whether `make check` passes, and how many rounds of fixing it took to get there.
2. The question as the owner will see it, and the files you wrote or changed.
3. **Every place you had to decide something yourself** because no page in the repository or the
   plugin said which way to go. One entry for each: what the choice was, which two ways were both
   defensible, what you chose, and where you looked before giving up. Do not round it down.
4. Every rule you found that you could not follow, and what you did instead.
5. Every fault you hit that no check caught.
6. Anything a page told you that turned out not to be true of this repository.
7. Arm M only: each search, with exactly the fields you sent, and what came back (how many results,
   which products); which references you kept, and how you kept them.

Report what happened, not what should have happened.
