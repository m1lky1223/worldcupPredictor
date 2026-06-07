# ROADMAP.md — 2026 World Cup Predictor

## Phasing Strategy

Fine granularity. 11 phases, each focused and independently shippable. Run plans in parallel where independent. Tournament starts June 11 — phases 1–7 are pre-launch critical.

---

## Phase 1 — Monorepo & Local Infrastructure
**Goal:** Full stack runs locally from `docker compose up`. Every engineer can onboard from a cold clone.

### Plans
1. `P1.1` Scaffold monorepo with `apps/` and `packages/` using npm workspaces + TypeScript project references
2. `P1.2` Docker Compose: web, api, mcp, worker, postgres, redis + `.env.example`
3. `P1.3` Shared `packages/config` (tsconfig, eslint, prettier)
4. `P1.4` Database: choose ORM (Prisma or Drizzle), initial migration, seed script
5. `P1.5` CI baseline: lint + typecheck on PR

**Exit criteria:** `docker compose up` cold starts all services; migrations apply; seed script runs.

---

## Phase 2 — Domain Schema & Provider Adapters
**Goal:** All domain entities modeled, at least one fixture/squad provider integrated in mock mode.

### Plans
1. `P2.1` Full database schema (all entities from REQUIREMENTS F2)
2. `P2.2` Provider adapter interface in `packages/data-providers`
3. `P2.3` Fixture + team sync adapter (chosen provider, mock + real mode)
4. `P2.4` Squad + player sync adapter
5. `P2.5` Seed: 48 teams, all groups, all fixtures loaded locally

**Exit criteria:** All 48 teams, all fixtures, all groups queryable from the database.

---

## Phase 3 — GraphQL API Core
**Goal:** Apollo GraphQL API serves dashboard, match, team, group, and bracket queries.

### Plans
1. `P3.1` Apollo server setup at `:4000/graphql` with auth middleware
2. `P3.2` Dashboard query (todayMatches, teamRankings, modelMetrics skeleton)
3. `P3.3` Match list + match detail resolvers
4. `P3.4` Team rankings + team profile resolvers
5. `P3.5` Player leaderboard + player profile resolvers
6. `P3.6` Group table + bracket projection resolvers

**Exit criteria:** All major GraphQL queries return data; resolver tests pass.

---

## Phase 4 — Web UI Foundation
**Goal:** Modern.js app renders all 8 pages with real GraphQL data. Mobile-first, dark mode.

### Plans
1. `P4.1` Modern.js app scaffold with Apollo Client, routing, design tokens
2. `P4.2` Dashboard page (today's matches, rating changes, group highlights)
3. `P4.3` Match list page + match detail page
4. `P4.4` Teams page + team profile page
5. `P4.5` Players page + player profile page
6. `P4.6` Groups page + bracket page
7. `P4.7` Model tracker page (accuracy, Brier, log loss)
8. `P4.8` Responsive polish + mobile QA

**Exit criteria:** All 8 routes render with real data; passes mobile viewport QA.

---

## Phase 5 — Prediction Engine
**Goal:** Elo-based prediction engine produces and stores versioned predictions for all fixtures.

### Plans
1. `P5.1` `packages/prediction-engine` — Elo rating computation
2. `P5.2` Prediction output shape: `{ homeWin, draw, awayWin, confidence, factors[], timestamp, modelVersion }`
3. `P5.3` Human-readable explanation factors
4. `P5.4` Prediction storage (append-only, input snapshot per prediction)
5. `P5.5` Graceful fallback: team-level prediction when player data missing
6. `P5.6` Bulk prediction generation for all scheduled fixtures
7. `P5.7` Unit tests for prediction engine (core value prop)

**Exit criteria:** All scheduled matches have predictions; prediction history preserved across recalculations.

---

## Phase 6 — Worker: Polling, Finalization & Rating Updates
**Goal:** BullMQ worker runs all sync and post-match jobs. Predictions recalculate within 5 min of finalization.

### Plans
1. `P6.1` BullMQ setup with Redis, job registry, adaptive polling scheduler
2. `P6.2` `sync-fixtures`, `sync-teams`, `sync-squads` jobs
3. `P6.3` `sync-match-statuses` + `sync-live-match` polling jobs
4. `P6.4` `finalize-match` job (idempotent, locked, immutable snapshot)
5. `P6.5` `update-team-ratings` + `update-player-ratings` jobs
6. `P6.6` `recalculate-predictions` job (triggered by finalize-match, ≤5 min SLA)
7. `P6.7` `calculate-model-metrics` job
8. `P6.8` Provider freshness tracking across all jobs
9. `P6.9` Local mock-provider mode: replay match status transitions end-to-end

**Exit criteria:** End-to-end test: mock match finalized → ratings updated → predictions recalculated within 5 min.

---

## Phase 7 — Odds Integration
**Goal:** The Odds API integrated. Odds displayed in match detail and model tracker. No gambling language.

### Plans
1. `P7.1` Odds sync adapter (The Odds API)
2. `P7.2` `sync-odds` worker job
3. `P7.3` MarketOddsSnapshot storage
4. `P7.4` GraphQL: odds + implied probability queries, market vs model diff
5. `P7.5` UI: odds comparison in match detail (display only, neutral language)
6. `P7.6` UI: market vs model section in model tracker

**Exit criteria:** Odds visible in match detail; implied probabilities computed; model vs market diff shown.

---

## Phase 8 — Authentication & Authorization
**Goal:** Google OAuth works in production. Dev-mode identity works locally. MCP tokens scoped.

### Plans
1. `P8.1` Google OAuth 2.0 / OIDC — browser login, HTTP-only cookie sessions
2. `P8.2` Dev-mode seeded identity for local Docker (no Google creds needed)
3. `P8.3` Role system: anonymous, user, admin, service_agent
4. `P8.4` MCP bearer token issuance + scoped access
5. `P8.5` Admin-only GraphQL mutations

**Exit criteria:** Google login works; dev-mode login works; unauthenticated users can read all public data; admin routes protected.

---

## Phase 9 — Remote MCP Server
**Goal:** Remote MCP server accessible at `/mcp` with all read-only tools and resources.

### Plans
1. `P9.1` MCP server app scaffold at `:4001/mcp` (Streamable HTTP)
2. `P9.2` All 10 resources (matches, match detail, teams, players, groups, bracket, model metrics, freshness)
3. `P9.3` All 10 tools (get_matches, get_match_detail, get_team, get_player, get_group_table, get_bracket_projection, get_match_prediction, compare_prediction_to_market, get_model_metrics, get_data_freshness)
4. `P9.4` 5 prompts (summarize_match_prediction, explain_prediction_change, summarize_team_form, compare_two_teams, explain_model_performance)
5. `P9.5` Token auth + rate limiting + audit logging
6. `P9.6` Optional stdio bridge for local CLI clients
7. `P9.7` Integration test: agent client queries MCP endpoint

**Exit criteria:** All MCP tools return correct data; rate limiting enforced; token auth validated.

---

## Phase 10 — Observability & Operational Hardening
**Goal:** Operators can answer: are matches fresh? did finalization succeed? are predictions current?

### Plans
1. `P10.1` Structured logging across all services
2. `P10.2` Provider health + freshness dashboards (operational, not user-facing)
3. `P10.3` Job failure tracking + alerting
4. `P10.4` GraphQL resolver + MCP tool latency tracking
5. `P10.5` Data freshness indicators in UI (user-facing)
6. `P10.6` Error boundaries and graceful degradation audit (hide sections vs. show errors)

**Exit criteria:** Operational dashboards answer all questions from RFC observability section.

---

## Phase 11 — Pre-Launch QA & Data Seeding
**Goal:** Tournament data complete, all flows tested, product launched before June 11.

### Plans
1. `P11.1` Full fixture + squad data loaded for all 48 teams
2. `P11.2` Baseline Elo ratings seeded for all 48 teams
3. `P11.3` Initial predictions generated for all group-stage fixtures
4. `P11.4` End-to-end smoke test: full match lifecycle (kickoff → live → final → updated predictions)
5. `P11.5` Mobile + desktop UI QA across all 8 pages
6. `P11.6` Content audit: no gambling language, all probability disclaimers present
7. `P11.7` Deployment to production (Vercel or equivalent)
8. `P11.8` Production smoke test

**Exit criteria:** All launch criteria from PRD §16 met. App live before June 11.

---

## Phase Dependencies

```
Phase 1 (infra)
  └── Phase 2 (schema + adapters)
        ├── Phase 3 (GraphQL API)
        │     └── Phase 4 (Web UI)       ← parallel with Phase 5
        ├── Phase 5 (Prediction Engine)  ← parallel with Phase 3
        │     └── Phase 6 (Worker)
        │           └── Phase 7 (Odds)
        └── Phase 8 (Auth)               ← parallel with Phase 3–7
              └── Phase 9 (MCP)
Phase 10 (Observability) ← can start after Phase 6
Phase 11 (Pre-launch QA) ← depends on all prior phases
```

---

## Post-MVP Backlog

- Saved picks
- Private group leaderboards
- Notifications / alerts
- Match prediction sharing
- Module Federation
- Admin MCP tools
- Odds as model input (re-evaluate post-MVP)
