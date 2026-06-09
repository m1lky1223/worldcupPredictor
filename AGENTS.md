# AGENTS.md — 2026 World Cup Predictor

> This file is the single source of truth for agent instructions. CLAUDE.md has been merged here.

## Project Overview

A web application that predicts 2026 FIFA World Cup match outcomes and updates predictions as the tournament unfolds. The tournament starts June 11, 2026 (Mexico time). See [docs/prd.md](docs/prd.md) for full product requirements.

## Architecture

### Tech Stack

- **Frontend:** Modern.js + React + TypeScript
- **Styling:** Material UI (MUI) components and engine. Custom theme configured in the UI package. No Tailwind.
- **API:** Apollo GraphQL (Node.js + TypeScript)
- **Worker:** BullMQ + Redis (job queue, polling, post-match processing)
- **Database:** Postgres + Drizzle ORM
- **Prediction Engine:** TypeScript module (`packages/prediction-engine`) using Elo-based ratings
- **Data Provider:** TheStatsAPI (fixtures, squads, players, match stats, lineups, xG)
- **Odds Data:** The Odds API — display only, does not feed into the model
- **Agent Interface:** Remote MCP server (Streamable HTTP hosted in web app at `/api/mcp` on port 3000) with AI-renderable UI widgets
- **Auth:** Google OAuth (production) + dev-mode seeded identity (local Docker)
- **Deployment:** Vercel (target)

### Directory Structure

```
worldcupPredictor/
├── AGENTS.md                  # This file
├── docs/                      # Product and engineering documentation
│   ├── prd.md                 # Product requirements
│   └── rfc-0001-architecture.md
├── apps/
│   ├── web/                   # Modern.js UI + Web MCP Server (port 3000)
│   ├── api/                   # Apollo GraphQL API (port 4000)
│   └── worker/                # BullMQ worker service
├── packages/
│   ├── domain/                # Shared domain types and constants
│   ├── prediction-engine/     # Elo ratings and probability logic
│   ├── data-providers/        # TheStatsAPI adapter and normalization
│   ├── ui/                    # Shared UI components
│   └── config/                # Shared tsconfig, eslint, prettier
├── infra/
│   ├── docker/                # Dockerfiles for each service
│   └── compose/               # Docker Compose files
├── data/                      # Static seed data (fixtures, teams, squads)
├── scripts/                   # CLI scripts for data sync, seeding, predictions
├── .planning/                 # GSD planning files (PROJECT.md, ROADMAP.md, etc.)
├── .beads/                    # Beads issue tracker database
├── .env.example               # Example env vars (committed)
├── .env.local                 # Local secrets (not committed)
├── .gitignore
├── package.json               # npm workspace root
├── tsconfig.json
└── docker-compose.yml
```

## Coding Conventions

### General

- Use TypeScript strict mode. No `any` unless absolutely necessary and documented.
- Prefer named exports over default exports.
- Keep files focused: one component, one hook, one utility per file.
- Use descriptive names. Avoid abbreviations except well-known ones (e.g., `db`, `api`, `url`).

### Architectural Principles

*   **SOLID:**
    *   *Single Responsibility (SRP):* Keep background processing (workers), API gateway services, Elo rating calculations, and UI presentation separated.
    *   *Open/Closed (OCP):* Design prediction models to allow extending outcome calculations with new factors without modifying the core simulation loops.
    *   *Liskov Substitution (LSP):* Third-party data providers must implement standard provider interfaces from `packages/data-providers`.
    *   *Interface Segregation (ISP):* Keep GraphQL endpoints modular and query-specific rather than deploying bloated schemas.
    *   *Dependency Inversion (DIP):* Rely on normalized domain types, isolating the core business logic from external API shifts via the Anti-Corruption Layer.
*   **DRY (Don't Repeat Yourself):** Share types in `packages/domain` and reuse calculation functions. Reuse GraphQL fragments on the frontend instead of repeating identical fields.
*   **KISS (Keep It Simple, Stupid):** Write straightforward, readable TypeScript math for rating calculations. Avoid complex generic types unless absolutely necessary.
*   **YAGNI (You Aren't Gonna Need It):** Do not write code or add features/dependencies until they are actually needed. Avoid speculative development or implementing structures for hypothetical future requirements.
*   **CQRS (Command Query Responsibility Segregation):**
    *   Separate write operations (background workers syncing data and recalculating predictions in Postgres) from read operations (GraphQL querying database indices).
    *   The web application serves read-only queries and triggers jobs asynchronously; it never executes direct database writes.


### Components & React Best Practices

- Use functional components with explicit prop types.
- Server Components by default. Add `'use client'` only when the component needs interactivity, state hooks, or browser APIs.
- Separate presentation components (pure, styled with MUI) from smart container components that fetch GraphQL queries.
- Keep components small. Extract sub-components when a file exceeds ~150 lines.
- AI-renderable MCP widgets should be compact, self-contained UI surfaces that reuse the same design tokens and never query the database directly.

### Modern.js & Module Federation

- Organize logic into monorepo packages (`packages/`) to keep dependencies isolated and reusable.
- Structure UI components and layouts to support future **Module Federation** deployments. Ensure component entry points in `packages/ui` use dynamic imports and runtime check safety boundaries.

### Data & Types

- Define shared types in `src/types/`. Domain types go in domain-specific files (e.g., `match.ts`, `team.ts`, `player.ts`).
- Database queries live in `src/lib/db/queries/`. One file per domain entity.
- Never expose raw database types to components. Map through typed interfaces.

### Prediction Engine

- All prediction logic lives in `src/lib/prediction/`.
- Predictions must produce: `{ homeWin: number, draw: number, awayWin: number, confidence: number, factors: Factor[], timestamp: string }`.
- Every prediction must be stored with its timestamp so historical comparisons work.
- Explanations must be human-readable strings, not technical jargon.

### Styling & UI Components

- Use [Material UI](https://mui.com/material-ui/) components for all user interface layouts, typography, input fields, and custom controls.
- Configure all design tokens (colors, typography, spacing, shadows, border-radii) using a custom Material UI Theme (`createTheme`).
- Maintain a default dark mode theme and support light mode via MUI's theme toggling or `prefers-color-scheme`.
- Avoid custom CSS or stylesheets unless absolutely necessary. Leverage the Material UI design system properly by customizing the custom theme configuration, using themed component overrides, or utilizing MUI's native `sx` prop and `styled()` helper for layout adjustments.
- Implement mobile-first responsive layouts using MUI layout components (e.g., `Grid`, `Stack`, `Container`, `Box`) with responsive array/object values.
- Animations: Prefer MUI transition components (`Fade`, `Collapse`, `Grow`) or CSS transitions using transform and opacity. Respect user preferences for reduced motion.

### API & GraphQL Best Practices

- External API calls go through `src/lib/data/` modules, never called directly from components.
- All external fetches must have error handling, timeouts, and rate-limit awareness.
- Cache external API responses in the database to reduce API calls and improve reliability.
- Use environment variables for all API keys and endpoints.
- **GraphQL Best Practices:**
  - Design query and mutation schemas based on client view requirements, not database tables.
  - Colocate GraphQL fragments with the UI components that render the data.
  - Mitigate N+1 database queries by using DataLoader batching inside resolvers.
  - Enforce authentication/authorization boundaries in resolvers; do not expose internal database errors to clients.

### Testing

- Test prediction logic thoroughly — it's the core value prop.
- Use Vitest for unit tests.
- Test components with React Testing Library when behavior is non-trivial.
- Name test files `*.test.ts` or `*.test.tsx` alongside source files, or in `tests/` mirroring `src/`.

### Git

- Commit messages: `type: short description` (e.g., `feat: add match detail page`, `fix: correct group tiebreaker logic`).
- Types: `feat`, `fix`, `refactor`, `docs`, `style`, `test`, `chore`, `data`.
- Keep commits atomic — one logical change per commit.

## Key Product Rules

1. **Dashboard-first**: The home page is the tournament dashboard, not a marketing page.
2. **Predictions ≠ certainty**: Always present probabilities, never definitive outcomes.
3. **No gambling encouragement**: Odds are shown as market context only. Use neutral language.
4. **Graceful degradation**: If player data is missing, fall back to team-level predictions. If odds data is unavailable, hide that section — don't show errors.
5. **Freshness target**: Update predictions within 5 minutes of a match being marked final.
6. **Historical preservation**: Never overwrite old predictions. Append new ones with timestamps.
7. **AI-renderable UI**: Key MCP tools should be able to return structured data plus renderable UI widgets for compatible AI hosts.

## Environment Variables

```
# Data Providers
THESTATSAPI_KEY=          # TheStatsAPI bearer token

# Database
DATABASE_URL=             # Postgres connection string
REDIS_URL=                # Redis connection string

# Auth
GOOGLE_CLIENT_ID=         # Google OAuth client ID
GOOGLE_CLIENT_SECRET=     # Google OAuth client secret
SESSION_SECRET=           # HTTP-only cookie session secret
AUTH_MODE=                # google | dev

# Services
GRAPHQL_PORT=4000
WEB_PORT=3000
PROVIDER_MODE=            # mock | real | hybrid

# App
NEXT_PUBLIC_APP_URL=      # Public URL for meta tags and sharing
```

## Useful Commands

```bash
docker compose up         # Start full local stack
npm run dev               # Start dev server (web only)
npm run build             # Production build
npm run seed              # Seed database with tournament data
npm run predict           # Run prediction engine for upcoming matches
npm run sync              # Sync latest results from TheStatsAPI
npm run test              # Run tests
bd ready                  # Find available work (beads)
bd prime                  # Refresh beads workflow context
```

<!-- BEGIN BEADS INTEGRATION v:1 profile:minimal hash:970c3bf2 -->
## Beads Issue Tracker

This project uses **bd (beads)** for issue tracking. Run `bd prime` to see full workflow context and commands.

### Quick Reference

```bash
bd ready              # Find available work
bd show <id>          # View issue details
bd update <id> --claim  # Claim work
bd close <id>         # Complete work
```

### Rules

- Use `bd` for ALL task tracking — do NOT use TodoWrite, TaskCreate, or markdown TODO lists
- Run `bd prime` for detailed command reference and session close protocol
- Use `bd remember` for persistent knowledge — do NOT use MEMORY.md files

**Architecture in one line:** issues live in a local Dolt DB; sync uses `refs/dolt/data` on your git remote; `.beads/issues.jsonl` is a passive export. See https://github.com/gastownhall/beads/blob/main/docs/SYNC_CONCEPTS.md for details and anti-patterns.

## Agent Context Profiles

The managed Beads block is task-tracking guidance, not permission to override repository, user, or orchestrator instructions.

- **Conservative (default)**: Use `bd` for task tracking. Do not run git commits, git pushes, or Dolt remote sync unless explicitly asked. At handoff, report changed files, validation, and suggested next commands.
- **Minimal**: Keep tool instruction files as pointers to `bd prime`; use the same conservative git policy unless active instructions say otherwise.
- **Team-maintainer**: Only when the repository explicitly opts in, agents may close beads, run quality gates, commit, and push as part of session close. A current "do not commit" or "do not push" instruction still wins.

## Session Completion

This protocol applies when ending a Beads implementation workflow. It is subordinate to explicit user, repository, and orchestrator instructions.

1. **File issues for remaining work** - Create beads for anything that needs follow-up
2. **Run quality gates** (if code changed) - Tests, linters, builds
3. **Update issue status** - Close finished work, update in-progress items
4. **Handle git/sync by active profile**:
   ```bash
   # Conservative/minimal/default: report status and proposed commands; wait for approval.
   git status

   # Team-maintainer opt-in only, unless current instructions forbid it:
   git pull --rebase
   bd dolt push
   git push
   git status
   ```
5. **Hand off** - Summarize changes, validation, issue status, and any blocked sync/commit/push step

**Critical rules:**
- Explicit user or orchestrator instructions override this Beads block.
- Do not commit or push without clear authority from the active profile or the current user request.
- If a required sync or push is blocked, stop and report the exact command and error.
<!-- END BEADS INTEGRATION -->
