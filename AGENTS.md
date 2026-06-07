# AGENTS.md — 2026 World Cup Predictor

## Project Overview

A web application that predicts 2026 FIFA World Cup match outcomes and updates predictions as the tournament unfolds. The tournament starts June 11, 2026 (Mexico time). See [docs/prd.md](docs/prd.md) for full product requirements.

## Architecture

### Tech Stack

- **Frontend:** Next.js (App Router) with TypeScript
- **Styling:** Vanilla CSS with CSS custom properties (design tokens). No Tailwind.
- **State Management:** React Server Components + client hooks where needed
- **Data Layer:** Server actions and API routes for data fetching
- **Database:** SQLite via better-sqlite3 for local dev; evaluate migration to PostgreSQL/Turso for production
- **Prediction Engine:** TypeScript module using Elo-based ratings with adjustments for form, player availability, and venue
- **Odds Data:** The Odds API (free tier) for market comparison — display only, does not feed into the model
- **Deployment:** Vercel (target)

### Directory Structure

```
worldcupPredictor/
├── AGENTS.md                  # This file
├── docs/                      # Product and engineering documentation
│   ├── prd.md                 # Product requirements
│   └── engineering-prd.md     # Engineering/technical spec (when created)
├── src/
│   ├── app/                   # Next.js App Router pages and layouts
│   │   ├── layout.tsx         # Root layout
│   │   ├── page.tsx           # Dashboard (home)
│   │   ├── matches/           # Match list and detail pages
│   │   ├── teams/             # Team rankings and profiles
│   │   ├── players/           # Player leaderboard and profiles
│   │   ├── groups/            # Group tables
│   │   ├── bracket/           # Knockout bracket
│   │   └── model/             # Model tracker / accuracy
│   ├── components/            # Shared React components
│   │   ├── ui/                # Primitive UI components (cards, badges, charts)
│   │   └── domain/            # Domain-specific components (match card, team badge, etc.)
│   ├── lib/                   # Core business logic (non-React)
│   │   ├── db/                # Database schema, migrations, queries
│   │   ├── prediction/        # Prediction engine (Elo, adjustments, explanations)
│   │   ├── data/              # Data ingestion and sync from APIs
│   │   └── odds/              # Odds fetching and implied probability calc
│   ├── hooks/                 # Custom React hooks
│   ├── types/                 # Shared TypeScript types and interfaces
│   └── styles/                # Global CSS, design tokens, component styles
│       ├── globals.css        # CSS reset, custom properties, base styles
│       └── tokens.css         # Design tokens (colors, spacing, typography)
├── data/                      # Static seed data (fixtures, teams, squads)
├── scripts/                   # CLI scripts for data sync, seeding, predictions
├── public/                    # Static assets (flags, icons)
├── tests/                     # Test files mirroring src/ structure
├── .env.local                 # Local environment variables (not committed)
├── .gitignore
├── package.json
├── tsconfig.json
└── next.config.ts
```

## Coding Conventions

### General

- Use TypeScript strict mode. No `any` unless absolutely necessary and documented.
- Prefer named exports over default exports.
- Keep files focused: one component, one hook, one utility per file.
- Use descriptive names. Avoid abbreviations except well-known ones (e.g., `db`, `api`, `url`).

### Components

- Use functional components with explicit prop types.
- Co-locate component CSS in `src/styles/components/` using BEM-style class naming.
- Server Components by default. Add `'use client'` only when the component needs interactivity, hooks, or browser APIs.
- Keep components small. Extract sub-components when a file exceeds ~150 lines.

### Data & Types

- Define shared types in `src/types/`. Domain types go in domain-specific files (e.g., `match.ts`, `team.ts`, `player.ts`).
- Database queries live in `src/lib/db/queries/`. One file per domain entity.
- Never expose raw database types to components. Map through typed interfaces.

### Prediction Engine

- All prediction logic lives in `src/lib/prediction/`.
- Predictions must produce: `{ homeWin: number, draw: number, awayWin: number, confidence: number, factors: Factor[], timestamp: string }`.
- Every prediction must be stored with its timestamp so historical comparisons work.
- Explanations must be human-readable strings, not technical jargon.

### Styling

- Use CSS custom properties defined in `tokens.css` for all colors, spacing, typography, shadows, and radii.
- Dark mode is the default theme. Support light mode via `prefers-color-scheme`.
- Mobile-first responsive design. Breakpoints: `640px` (sm), `768px` (md), `1024px` (lg), `1280px` (xl).
- Use `clamp()` for fluid typography.
- Animations: prefer `transform` and `opacity` for performance. Use `prefers-reduced-motion` to disable non-essential animations.

### API & Data Fetching

- External API calls go through `src/lib/data/` modules, never called directly from components.
- All external fetches must have error handling, timeouts, and rate-limit awareness.
- Cache external API responses in the database to reduce API calls and improve reliability.
- Use environment variables for all API keys and endpoints.

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

## Environment Variables

```
# Data APIs
FOOTBALL_API_KEY=         # API-Football or chosen provider
ODDS_API_KEY=             # The Odds API

# Database
DATABASE_URL=             # SQLite path or PostgreSQL connection string

# App
NEXT_PUBLIC_APP_URL=      # Public URL for meta tags and sharing
```

## Useful Commands

```bash
npm run dev               # Start dev server
npm run build             # Production build
npm run seed              # Seed database with tournament data
npm run predict           # Run prediction engine for upcoming matches
npm run sync              # Sync latest results from data API
npm run test              # Run tests
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

<!-- BEGIN BEADS CODEX SETUP: generated by bd setup codex -->
## Beads Issue Tracker

Use Beads (`bd`) for durable task tracking in repositories that include it. Use the `beads` skill at `.agents/skills/beads/SKILL.md` (project install) or `~/.agents/skills/beads/SKILL.md` (global install) for Beads workflow guidance, then use the `bd` CLI for issue operations.

### Quick Reference

```bash
bd ready                # Find available work
bd show <id>            # View issue details
bd update <id> --claim  # Claim work
bd close <id>           # Complete work
bd prime                # Refresh Beads context
```

### Rules

- Use `bd` for all task tracking; do not create markdown TODO lists.
- Run `bd prime` when Beads context is missing or stale. Codex 0.129.0+ can load Beads context automatically through native hooks; use `/hooks` to inspect or toggle them.
- Keep persistent project memory in Beads via `bd remember`; do not create ad hoc memory files.

**Architecture in one line:** issues live in a local Dolt DB; sync uses `refs/dolt/data` on your git remote; `.beads/issues.jsonl` is a passive export. See https://github.com/gastownhall/beads/blob/main/docs/SYNC_CONCEPTS.md for details and anti-patterns.
<!-- END BEADS CODEX SETUP -->
