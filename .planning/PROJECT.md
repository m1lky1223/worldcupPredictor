# PROJECT.md — 2026 World Cup Predictor

## What This Is

A full-stack web application that predicts 2026 FIFA World Cup match outcomes using an Elo-based prediction engine, updates predictions as the tournament unfolds, and exposes data through a web UI, GraphQL API, and a remote MCP server for agent/CLI access.

The tournament starts **June 11, 2026** (Mexico time) / **June 12, 2026** (Melbourne time). The product must be live and useful by then.

## Core Value

Give football fans clear, explainable predictions for every World Cup match — updated within 5 minutes of each match completing — backed by transparent model reasoning and compared against the betting market (display only, never gambling advice).

## Context

- **Source docs:** `docs/prd.md` (product), `docs/rfc-0001-architecture.md` (architecture)
- **Stack:** Modern.js + React + TypeScript (web) · Apollo GraphQL (API) · BullMQ + Redis (worker) · Postgres + Drizzle (db) · Remote MCP server (agent access)
- **Monorepo layout:** `apps/{web,api,worker}` + `packages/{domain,prediction-engine,data-providers,ui,config}`
- **Local dev:** Full Docker Compose stack (web · api · worker · postgres · redis)
- **Auth:** Google OAuth (production) + dev-mode seeded identity (local)
- **Deployment target:** Vercel or similar (TBD)

## Requirements

### Validated

(None yet — greenfield, ship to validate)

### Active

**Core Data & Infrastructure**
- [ ] Monorepo scaffolded with `apps/` and `packages/` structure
- [ ] Docker Compose runs all services locally (web, api, worker, postgres, redis)
- [ ] Database schema covers all domain entities (Team, Player, Match, Prediction, etc.)
- [ ] Migrations and seed data run from cold checkout
- [ ] Mock provider mode for local development without paid API keys

**Data Ingestion**
- [ ] Fixture sync from at least one provider
- [ ] Team and squad sync
- [ ] Match status polling (1–5 min during live windows)
- [ ] Post-match finalization job (idempotent, locked)
- [ ] Odds sync from The Odds API
- [ ] Provider adapter layer normalizes all external data to internal types

**Prediction Engine**
- [ ] Elo-based team rating baseline
- [ ] Prediction output: `{ homeWin, draw, awayWin, confidence, factors[], timestamp }`
- [ ] Predictions are append-only (never overwrite history)
- [ ] Recalculate future predictions within 5 min of match finalization
- [ ] Human-readable explanation factors (e.g. "Key player unavailable", "Recent form improved")
- [ ] Model metrics: accuracy, Brier score, log loss, calibration

**GraphQL API**
- [ ] Dashboard query (today's matches, team rankings, model metrics)
- [ ] Match list + match detail queries
- [ ] Team rankings + team profile queries
- [ ] Player leaderboard + player profile queries
- [ ] Group table queries
- [ ] Bracket/knockout projection queries
- [ ] Odds comparison queries

**Web UI**
- [ ] Dashboard page (default landing, not a marketing page)
- [ ] Match list page
- [ ] Match detail page (probabilities, factors, odds comparison, lineups)
- [ ] Teams page (rankings + profiles)
- [ ] Players page (leaderboard + profiles)
- [ ] Groups page (tables + qualification probabilities)
- [ ] Bracket page (knockout structure + projections)
- [ ] Model tracker page (accuracy, Brier, log loss, market comparison)
- [ ] Dark mode default, mobile-first responsive

**Remote MCP Server**
- [ ] Streamable HTTP transport at `/api/mcp` inside web app
- [ ] Resources: matches, match detail, teams, players, groups, bracket, model metrics, data freshness
- [ ] Tools: get_matches, get_match_detail, get_team, get_player, get_group_table, get_bracket_projection, get_match_prediction, compare_prediction_to_market, get_model_metrics, get_data_freshness
- [ ] AI-renderable UI widgets for key tools: match card, match detail, team profile, group table, bracket preview, model metrics
- [ ] Token-protected (read-only public or scoped bearer)

**Auth**
- [ ] Google OAuth (production browser login)
- [ ] Dev-mode seeded identity (local Docker, no Google creds required)
- [ ] Roles: anonymous, user, admin, service_agent

### Out of Scope (MVP)

- Saved picks or private group leaderboards — post-MVP
- Password-based login — Google only
- Module Federation — future architecture option
- Sportsbook scraping — not allowed
- Gambling advice — explicitly prohibited
- Paid subscription or marketplace
- Fantasy football / club football / non-World Cup competitions
- Admin MCP tools in MVP (MCP is read-only at launch)

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Modern.js over Next.js | Stays in React ecosystem, pairs naturally with Apollo Client | Decided |
| Apollo GraphQL API | Nested UI data needs (match → teams → predictions → odds → players) | Decided |
| BullMQ + Redis for worker | Sufficient for MVP job orchestration, polling, locking | Decided |
| Postgres over SQLite | Relational domain, audit snapshots, historical predictions | Decided |
| Remote MCP (Streamable HTTP) | Integrated into web app BFF endpoint (/api/mcp) on port 3000 | Decided |
| AI-renderable MCP UI | Key MCP tools should return structured data plus renderable widgets for compatible AI hosts | Decided |
| Data Isolation | Web app (including Web MCP) performs no direct database queries; all data access goes through the Apollo GraphQL API | **Decided** |
| Google OAuth only | No password auth in MVP | Decided |
| Material UI (MUI) | Component library and styling engine for a consistent, premium design system; no Tailwind | **Decided** |
| Should odds feed into the prediction model or display only? | Start display-only to avoid gambling-product optics; revisit post-MVP | **Display-only** |
| Prisma vs Drizzle for ORM? | Drizzle — lighter, SQL-first, better TS inference | **Drizzle** |
| Primary fixture/player provider | TheStatsAPI (thestatsapi.com) — covers fixtures, squads, player stats | **TheStatsAPI** |
| Primary odds provider | The Odds API (free tier confirmed) | **The Odds API** |

## Success Criteria

- All 48 teams, all fixtures, all groups visible before June 11
- Match predictions exist for all scheduled matches at launch
- Completed matches update results, standings, and future predictions within 5 minutes
- App works well on mobile and desktop
- Model tracker shows accuracy, Brier score, log loss
- Clear language that predictions are informational, not gambling advice

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

---
*Last updated: 2026-06-07 after initialization*
