---
name: decide
description: Put every question that waits on a repository's owner on one sheet and take the answers in one go — each question with one recommendation and what it rests on, the ones that are hard to undo marked — then write each answer where the question lives, with the name of the person who answered and the date. Use when the user says "what do I have to decide", "let me answer what is waiting", "the decision sheet", "confirm the proposals", "keep" or "refuse" for waiting rows, or after status says answers wait on the owner. Also for an agent building a screen that meets a choice nothing settles: it queues the question with --ask and goes on. Not for a first design system (that is the guide), and not for changing a value the owner refused (no command does that yet).
---

# The decision sheet of a repository

It reads the questions that wait on the owner, prints them as one sheet, and writes an answer only
when a person gave it. It calls no model: the same repository always gives the same sheet.

Scripts are in `${CLAUDE_PLUGIN_ROOT}/scripts/` (if the variable is not expanded, use the `scripts/`
folder two levels above this file).

## The one rule

**Never write an answer the person did not give.** A recommendation on the sheet is the machine's;
it becomes an answer only when the person says so, in their own words, in this conversation. Do not
fill the answers file from the recommendations, from an earlier conversation, from a document, or
from what "they would surely say". Do not answer a question the person skipped. The script cannot
tell who wrote the answers file: this rule is the only thing that keeps a name off an answer nobody
gave.

## 1. Print the sheet

`node ${CLAUDE_PLUGIN_ROOT}/scripts/decide.mjs --target <repo>`. Without `--target` it reads the
folder it is run from. `--only ID[,ID]` narrows the sheet to some questions. `--json` gives the
data. Without `--answers` nothing is written, anywhere.

It ends with:

- `0`: no question waits.
- `1`: questions wait on the owner. Not an error.
- `2`: a wrong call, answers that cannot be taken, or a repository that cannot be read. The reason
  is on the error stream and nothing is written. Repeat the reason; do not guess.

## 2. What is on the sheet

Two sources, in this order:

- **Rows of the ledger nobody confirmed.** A row of `design/decisions.yaml` whose note says a person
  has not confirmed it: the guide proposed the answer, or it was read off the repository. The
  recommendation and what it rests on are the ones status gives.
- **The waiting list.** `design/waiting/`, one file per question, or the older shared file
  `design/waiting-list.json`, when the repository has one: questions that are not rows of a design
  ledger, as data (`references/checks.md`, "What decide reads and writes"). They are printed under
  the heading each row gives as its `group`, in the order of their ids.

Each question has an id, a `recommendation`, a `because`, and where the list gives them a `where`
and an `if refused`. `[hard to undo]` marks a row of the ledger in a layer every other layer is
built on (context, foundations), and a row of the waiting list that says so. The second line of the
sheet counts the marks and says how many rows do not say: silence is not "easy to undo".

Two more kinds are listed and take no answer here:

- `waiting too, answered with another command`: a call only a person can make that the ledger has
  no row for. It counts as waiting. The line gives the command that records it.
- `only the owner gives these`: permissions. The owner gives one step by step, in conversation; it
  is never "kept" or "refused", and it is not counted.

The last line names what this sheet cannot see, by the id of each limit in
`references/limits.json`. "No question waits" means: none in these two sources.

## 3. Put it to the person

- Show the whole sheet, in its order, in the person's language. Say the number first, then the
  questions marked hard to undo, then the rest. For each: the question, the recommendation, what it
  rests on, and what refusing costs when the sheet says it.
- A recommendation with no basis is said as such. Do not add a reason of your own.
- Ask for the answers in one go. The person may answer some and leave the rest: what they leave
  stays on the sheet.
- A question of taste has no specimen in this version: say so, and offer to draw the options with
  the guide's specimen sheet before they answer.

## 4. Write what the person answered

Write their answers to a file outside the repository, one line each, in their words:

```text
A1 giữ
A2 bác Đổi màn mẫu thứ hai thành màn «sắp hết hạn»
C1 Màn thật
```

- `ID giữ` (or `keep`): kept as it is recommended. Words after it are recorded as a remark.
- `ID bác SENTENCE` (or `refuse`): refused. The sentence says what to change; it may be left out.
- `ID VALUE`: the person's own answer, in their words, when it is neither of the two.
- Empty lines and lines that start with `#` are skipped. An id is answered once.

Then run it twice:

1. `node ${CLAUDE_PLUGIN_ROOT}/scripts/decide.mjs --target <repo> --answers <file> --dry-run`: it
   prints each answer as it would be recorded, each file it would write, and what would change in
   each. Read it back to the person when an answer could be read two ways (a typed word that became
   a value, for one).
2. The same without `--dry-run`: it writes, and prints the sheet as it now is.

`--by NAME` says who answered; without it the script takes the name git has for the repository,
and refuses when there is none. `--on YYYY-MM-DD` says when; without it, today. The name is the
person who answered, never yours.

What it writes:

- **A row of the ledger:** only the row's note changes. The clause that said nobody confirmed it is
  replaced by `confirmed by NAME on DATE`, `refused by NAME on DATE: SENTENCE`, or
  `answered by NAME on DATE: VALUE`. The shape of the ledger is untouched. When the row is one the
  guide writes from the blueprint and the answer is "keep", the choice is also listed under
  `confirmed` in `design/blueprint.json`, so the guide does not turn it back into a proposal.
- **A row of the waiting list:** it gains `answer` (`keep`, `refuse`, `value`), `said` when the
  person said something, `by` and `on`. The row stays. Kept as one file per question, only the
  answered questions' own files are written.

One answer that cannot be taken refuses the whole file: an id the sheet does not have, a
permission, a call with no row, a question answered before, a line with no answer. Nothing is
written; fix the file with the person and run again. A recorded answer is not changed by this
command.

## 5. After the answers

- A refusal or another answer is recorded and **nothing else changes**: the repository still holds
  the refused value. Every later sheet names those rows under `answered`. Say so, and ask the person
  whether to make the change now; for a value of the theme that is the guide, with their answer.
- Where a row of the waiting list names a record in `where`, add the person's answer to that
  record, in their words, with the date.
- Run `/design-assembly:status` to see what still waits elsewhere.

## 6. Asking: for an agent that builds

An agent that meets a choice the ledger, the components and the pages of kinds do not settle does
not settle it alone, and does not stop to ask in the middle of its work either. It queues the
question and goes on with its own recommendation:

`node ${CLAUDE_PLUGIN_ROOT}/scripts/decide.mjs --target <repo> --ask "QUESTION" --recommend "TEXT" --because "TEXT" --easy-to-undo`

- `--hard-to-undo` instead when the answer is hard to undo. One of the two is required, as are
  `--recommend` and `--because`.
- `--item decision:ID` when the question is about one row of `design/decisions.yaml`. A judgment the
  agent writes into the ledger is asked this way, or says in its note that a person has not
  confirmed it; the gate fails otherwise.
- `--item pattern:NAME` for a new page of a kind of screen, `--item source-color:VALUE` for a new
  brand colour, `--item logo:ID` for a new logo row of `design/sources/` or a changed file of one.
  These are the owner's calls: the script says **stop**, and the agent does not build on it. The
  gate stays red on the branch until the owner keeps that very item here.
- `--candidate NAME`, with `--item logo:ID` only, once per mark the owner chooses from, the
  recommended one first. Keeping takes the first; the owner answers with the name of another to
  choose it, and the gate reads either as the owner's choice. The package of the chosen mark says
  which candidate it holds (`candidate` in its manifest), and the row `logo-source --package`
  writes keeps it. On a repository whose installed tool predates this, the script refuses and
  names upgrade first.
- `--id ID` names the question; without it the id is made from the item, or from the words.
- It writes one new file, `design/waiting/<id>.json`, and nothing else. When the waiting list is
  still the shared file, it refuses: run `--split` once first (with `--dry-run` to see it), which
  turns the file into one file per question and writes nothing if one would be lost.

Asking is not answering: never ask and answer the same question, and never write `answer`, `by`
or `on` into a question's file by hand.

## 7. With `--json`

| Key           | Holds                                                                                                                              |
| ------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| `questions`   | `id`, `source`, `group`, `question`, `recommendation`, `basis`, `hard_to_undo`, `where`, `if_refused`                              |
| `answered`    | `id`, `source`, `answer` (`keep`, `refuse`, `value`), `said`, `by`, `on`                                                           |
| `elsewhere`   | Calls with no row: `id`, `source`, `question`, `recommendation`, `basis`, `answer_with`                                            |
| `permissions` | `id`, `source`, `group`, `what`                                                                                                    |
| `dry_run`     | Whether the call was a preview that wrote nothing                                                                                  |
| `files`       | The files written, or that would be: `path`, `change` (`create`, `update`, `remove`). Empty without answers, a question or a split |
| `recorded`    | Only with `--answers`: `by`, `on`, and `changes`, what changed in each file, by its path                                           |
| `asked`       | Only with `--ask`: `id`, `file`, `item`, and `may_go_on`, false for the owner's calls                                              |

`source` is `ledger` or `waiting-list`. `hard_to_undo` is `true`, `false`, or `null` when the row
does not say. `basis` is `null` when the waiting list gives none. With `--answers` the four lists
are the sheet as it is once the answers are written; with `--dry-run` nothing was written.

Use the terms in `references/vocabulary.json`.
