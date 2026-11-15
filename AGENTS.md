# design-assembly — guide for AI coding agents

A lab that assembles a design system with Claude Code on real screens: people decide top-down, the machine builds and checks bottom-up.

Stack: React + TypeScript SPA — Vite, npm, ESLint (react-hooks), Prettier, Vitest + Testing Library

## Commands (always use these, never ad-hoc tool invocations)

- `make setup` — install dependencies from the lockfile
- `make format` — auto-format
- `make lint` — lint + format check
- `make typecheck` — strict type check
- `make test` — run tests
- `make gen` — regenerate types from `ontology/` (never edit generated files)
- `make ontology` — check `ontology/` + `wiki/` consistency and generated code
- `make plan` — where the work stands against the plan of record
- `make check` — everything CI runs. **Run it before you say a task is done.**

## The plan

- The plan of record is `docs/plan/plan.json`, approved by the owner. Run `make plan` before you start:
  it prints the open stage, its items and what comes after.
- Work on an item of the open stage. One commit of every branch ends with `Plan: <item id>`, or with
  `Plan: off-plan — <why>` when the owner asks for something the plan does not have. `make check`
  holds this.
- When the owner asks for off-plan work, say in one line which stage it belongs to and which item it
  delays, then do as told.
- A finding that does not block the open stage's "done when" goes to `parked` in the plan file; it is
  not worked on now.
- A stage closes only when each "done when" line is shown by a command; write the date and the
  evidence in the stage's `closed`, and set the item states in the same change as the work.

## Before you change code

1. Read `wiki/index.md` to orient yourself.
2. If the task touches business logic, read `ontology/glossary.md` and the
   relevant `ontology/entities/*.yaml`.
3. Look for an existing implementation of the rule before writing a new one.
   Every business rule should live in exactly one place.

## Rules

- Use the names from `ontology/glossary.md`. Do not invent synonyms
  (e.g. `Client` when the glossary says `Customer`).
- Use the generated domain types; to change them, change `ontology/` and run `make gen`.
- Do not add a new entity, relation or rule to the code without adding it to
  `ontology/` in the same change. Changes to `ontology/` need human review —
  call them out in the PR description.
- Every behaviour change comes with a test.
- Never commit secrets or `.env`. Configuration goes in `.env.example`.
- Keep changes small and focused; one concern per PR.
- Commit messages follow Conventional Commits (`feat:`, `fix:`, `docs:`, `refactor:`, `test:`, `chore:`).

## After you finish a task

- `make check` is green.
- Update the wiki:
  - append one line to `wiki/log.md` (date, what changed, link to PR/issue);
  - significant technical choice → new `wiki/decisions/NNNN-title.md`;
  - production bug or outage → `wiki/incidents/YYYY-MM-DD-title.md`;
  - an entity's behaviour changed → update `wiki/entities/<entity>.md`.
- Follow the page formats in `ontology/page-types.yaml`. Link to code paths,
  do not paste code into the wiki.

## Project map

- `src/` — application code
- `tests/` — tests
- `ontology/` — domain model (source of truth for business concepts)
- `wiki/` — decisions, incidents, entity notes
- `docs/plan/` — the plan of record, as data
- `tools/` — wiki-lint, ontology code generator and the plan tool (run through `make`)
- `.claude/skills/` — procedures for agents (ontology, wiki, independent review)

## Language

- Code, identifiers, comments, tests, logs, commit messages, branch names, PR titles, the changelog,
  file names and required wiki headings: English, always.
- Instructions for AI (this file, skills, tool descriptions): English.
- Conversation: vi
- Documents: vi (tour, wiki content, specs, PR descriptions).
- Business terms: English code name, with the display name in `ontology/glossary.md`.
- Text that end users see follows the product's own language, not this rule.

## Design floor

- Building or changing a screen, or adding a component: follow `.claude/rules/ui.md`, the one page
  to read first. It points to `design/behaviors.md` for what each state shows.
