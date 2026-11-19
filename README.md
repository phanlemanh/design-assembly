# design-assembly

A lab that assembles a design system with Claude Code on real screens: people decide top-down, the machine builds and checks bottom-up.

## Quick start

Prerequisites: Node.js 22 (see .nvmrc), `make`, `git`.

```bash
git clone <this-repo-url>
cd design-assembly
make setup     # install dependencies
make check     # lint + typecheck + test — should be green
make dev       # run locally
```

## Everyday commands

| Command          | What it does                             |
| ---------------- | ---------------------------------------- |
| `make setup`     | Install dependencies (from the lockfile) |
| `make dev`       | Run the project locally                  |
| `make format`    | Auto-format the code                     |
| `make lint`      | Lint and check formatting                |
| `make typecheck` | Strict type checking                     |
| `make test`      | Run the tests                            |
| `make check`     | Everything CI runs — run before every PR |

## Project map

| Path        | Purpose                                                          |
| ----------- | ---------------------------------------------------------------- |
| `src/`      | Application code                                                 |
| `tests/`    | Automated tests                                                  |
| `ontology/` | Domain model: glossary, entities, relations (source of truth)    |
| `wiki/`     | Decisions, incidents and domain notes, kept up to date by agents |
| `CLAUDE.md` | Onboarding guide for AI coding agents                            |

## Stack

React + TypeScript SPA — Vite, npm, ESLint (react-hooks), Prettier, Vitest + Testing Library

## Configuration

Copy `.env.example` to `.env` and fill in the values. Never commit `.env`.

## License

MIT — see [LICENSE](LICENSE).
