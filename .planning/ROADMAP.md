# ROADMAP.md — 2026 World Cup Predictor

## Phasing Strategy

Fine granularity. 11 phases, each focused and independently shippable. Run plans in parallel where independent. Tournament starts June 11 — phases 1–7 are pre-launch critical.

## Milestones

- ✅ **v1.0** — Phases 1-7 (pre-launch critical)
- 📋 **v1.1** — Phases 8-11 (post-launch hardening)

---

### 🚧 v1.0 (In Progress)

**Milestone Goal:** Launch before June 11, 2026 tournament start. Dashboard, predictions, worker, and odds integrated.

#### Phase 1: Monorepo & Local Infrastructure

**Goal:** Full stack runs locally from `docker compose up`. Every engineer can onboard from a cold clone.

**Depends on:** Nothing (first phase)

**Success Criteria:**
1. `docker compose up` cold starts all services and healthchecks pass.
2. Programmatic migrations and conditional database seeding run to completion before other services start.
3. Cucumber BDD integration tests run and pass green inside the docker compose network.

**Plans:** 2 plans

Plans:
- [x] **01-01**: Scaffold `apps/mcp`, setup GraphQL Codegen, baseline Docker Compose services, and configure CI linting/typechecking.
- [x] **01-02**: Database migrations & seeding initialization inside `db-migrate` container, sequencing docker-compose startup, and configuring Cucumber BDD tests inside a test runner container.

#### Phase 2: Domain Schema & Provider Adapters

**Goal:** All domain entities modeled, at least one fixture/squad provider integrated in mock mode.

**Depends on:** Phase 1

**Success Criteria:** All 48 teams, all fixtures, all groups queryable from the database.

**Plans:** 3 plans

Plans:
- [x] **02-01**: Provider interfaces + HTTP client + MockSyncProvider (normalized types, rate-limited client, squad generation, match replay)
- [x] **02-02**: Full Drizzle schema + migrations + seed (13 tables, 48 teams, 104 matches, immutability triggers)
- [x] **02-03**: TheStatsAPI adapters (declarative mapper, ConcreteTheStatsApiClient, 3 entity sync adapters)

#### Phase 3: GraphQL API Core

**Goal:** Apollo GraphQL API serves dashboard, match, team, group, and bracket queries.

**Depends on:** Phase 2

**Plans:** TBD

Plans:
- [ ] **03-01**: Apollo server setup at `:4000/graphql` with auth middleware
- [ ] **03-02**: Dashboard query (todayMatches, teamRankings, modelMetrics skeleton)
- [ ] **03-03**: Match list + match detail resolvers
- [ ] **03-04**: Team rankings + team profile resolvers
- [ ] **03-05**: Player leaderboard + player profile resolvers
- [ ] **03-06**: Group table + bracket projection resolvers

**Exit criteria:** All major GraphQL queries return data; resolver tests pass.

#### Phase 4: Web UI Foundation

**Goal:** Modern.js app renders all 8 pages with real GraphQL data. Mobile-first, dark mode.

**Depends on:** Phase 3 (can run in parallel with Phase 5)

**Plans:** 8 plans

Plans:
- [x] **04-01**: Modern.js app scaffold with Apollo Client, routing, design tokens
- [x] **04-02**: Dashboard page (today's matches, rating changes, group highlights)
- [x] **04-03**: Match list page + match detail page
- [x] **04-04**: Teams page + team profile page
- [x] **04-05**: Players page + player profile page
- [x] **04-06**: Groups page + bracket page
- [x] **04-07**: Model tracker page (accuracy, Brier, log loss)
- [x] **04-08**: Responsive polish + mobile QA

**Exit criteria:** All 8 routes render with real data; passes mobile viewport QA.

#### Phase 5: Prediction Engine

**Goal:** Elo-based prediction engine produces and stores versioned predictions for all fixtures.

**Depends on:** Phase 2 (can run in parallel with Phase 3)

**Plans:** 7 plans

Plans:
- [ ] **05-01**: `packages/prediction-engine` — Elo rating computation
- [ ] **05-02**: Prediction output shape: `{ homeWin, draw, awayWin, confidence, factors[], timestamp, modelVersion }`
- [ ] **05-03**: Human-readable explanation factors
- [ ] **05-04**: Prediction storage (append-only, input snapshot per prediction)
- [ ] **05-05**: Graceful fallback: team-level prediction when player data missing
- [ ] **05-06**: Bulk prediction generation for all scheduled fixtures
- [ ] **05-07**: Unit tests for prediction engine (core value prop)

**Exit criteria:** All scheduled matches have predictions; prediction history preserved across recalculations.

#### Phase 6: Worker: Polling, Finalization & Rating Updates

**Goal:** BullMQ worker runs all sync and post-match jobs. Predictions recalculate within 5 min of finalization.

**Depends on:** Phase 5

**Plans:** 9 plans

Plans:
- [ ] **06-01**: BullMQ setup with Redis, job registry, adaptive polling scheduler
- [ ] **06-02**: `sync-fixtures`, `sync-teams`, `sync-squads` jobs
- [ ] **06-03**: `sync-match-statuses` + `sync-live-match` polling jobs
- [ ] **06-04**: `finalize-match` job (idempotent, locked, immutable snapshot)
- [ ] **06-05**: `update-team-ratings` + `update-player-ratings` jobs
- [ ] **06-06**: `recalculate-predictions` job (triggered by finalize-match, ≤5 min SLA)
- [ ] **06-07**: `calculate-model-metrics` job
- [ ] **06-08**: Provider freshness tracking across all jobs
- [ ] **06-09**: Local mock-provider mode: replay match status transitions end-to-end

**Exit criteria:** End-to-end test: mock match finalized → ratings updated → predictions recalculated within 5 min.

#### Phase 7: Odds Integration

**Goal:** The Odds API integrated. Odds displayed in match detail and model tracker. No gambling language.

**Depends on:** Phase 6

**Plans:** 6 plans

Plans:
- [ ] **07-01**: Odds sync adapter (The Odds API)
- [ ] **07-02**: `sync-odds` worker job
- [ ] **07-03**: MarketOddsSnapshot storage
- [ ] **07-04**: GraphQL: odds + implied probability queries, market vs model diff
- [ ] **07-05**: UI: odds comparison in match detail (display only, neutral language)
- [ ] **07-06**: UI: market vs model section in model tracker

**Exit criteria:** Odds visible in match detail; implied probabilities computed; model vs market diff shown.

---

### 📋 v1.1 (Planned)

**Milestone Goal:** Auth, MCP, observability, pre-launch QA, and deployment.

#### Phase 8: Authentication & Authorization

**Goal:** Google OAuth works in production. Dev-mode identity works locally. MCP tokens scoped.

**Depends on:** Phase 2 (can run in parallel with Phases 3–7)

**Plans:** 5 plans

Plans:
- [ ] **08-01**: Google OAuth 2.0 / OIDC — browser login, HTTP-only cookie sessions
- [ ] **08-02**: Dev-mode seeded identity for local Docker (no Google creds needed)
- [ ] **08-03**: Role system: anonymous, user, admin, service_agent
- [ ] **08-04**: MCP bearer token issuance + scoped access
- [ ] **08-05**: Admin-only GraphQL mutations

**Exit criteria:** Google login works; dev-mode login works; unauthenticated users can read all public data; admin routes protected.

#### Phase 9: Remote MCP Server

**Goal:** Remote MCP server accessible at `/mcp` with all read-only tools and resources.

**Depends on:** Phase 8

**Plans:** 7 plans

Plans:
- [ ] **09-01**: MCP server app scaffold at `:4001/mcp` (Streamable HTTP)
- [ ] **09-02**: All 10 resources (matches, match detail, teams, players, groups, bracket, model metrics, freshness)
- [ ] **09-03**: All 10 tools (get_matches, get_match_detail, get_team, get_player, get_group_table, get_bracket_projection, get_match_prediction, compare_prediction_to_market, get_model_metrics, get_data_freshness)
- [ ] **09-04**: 5 prompts (summarize_match_prediction, explain_prediction_change, summarize_team_form, compare_two_teams, explain_model_performance)
- [ ] **09-05**: Token auth + rate limiting + audit logging
- [ ] **09-06**: Optional stdio bridge for local CLI clients
- [ ] **09-07**: Integration test: agent client queries MCP endpoint

**Exit criteria:** All MCP tools return correct data; rate limiting enforced; token auth validated.

#### Phase 10: Observability & Operational Hardening

**Goal:** Operators can answer: are matches fresh? did finalization succeed? are predictions current?

**Depends on:** Phase 6 (can start after Phase 6)

**Plans:** 6 plans

Plans:
- [ ] **10-01**: Structured logging across all services
- [ ] **10-02**: Provider health + freshness dashboards (operational, not user-facing)
- [ ] **10-03**: Job failure tracking + alerting
- [ ] **10-04**: GraphQL resolver + MCP tool latency tracking
- [ ] **10-05**: Data freshness indicators in UI (user-facing)
- [ ] **10-06**: Error boundaries and graceful degradation audit (hide sections vs. show errors)

**Exit criteria:** Operational dashboards answer all questions from RFC observability section.

#### Phase 11: Pre-Launch QA & Data Seeding

**Goal:** Tournament data complete, all flows tested, product launched before June 11.

**Depends on:** All prior phases

**Plans:** 8 plans

Plans:
- [ ] **11-01**: Full fixture + squad data loaded for all 48 teams
- [ ] **11-02**: Baseline Elo ratings seeded for all 48 teams
- [ ] **11-03**: Initial predictions generated for all group-stage fixtures
- [ ] **11-04**: End-to-end smoke test: full match lifecycle (kickoff → live → final → updated predictions)
- [ ] **11-05**: Mobile + desktop UI QA across all 8 pages
- [ ] **11-06**: Content audit: no gambling language, all probability disclaimers present
- [ ] **11-07**: Deployment to production (Vercel or equivalent)
- [ ] **11-08**: Production smoke test

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

## Progress

| Phase | Milestone | Plans | Status | Completed |
|-------|-----------|-------|--------|-----------|
| 1. Infra | v1.0 | 2/2 | Complete | 2026-06-09 |
| 2. Schema & Adapters | v1.0 | 3/3 | Complete | 2026-06-09 |
| 3. GraphQL API Core | v1.0 | 0/6 | Not started | - |
| 4. Web UI Foundation | v1.0 | 0/8 | Not started | - |
| 5. Prediction Engine | v1.0 | 0/7 | Not started | - |
| 6. Worker | v1.0 | 0/9 | Not started | - |
| 7. Odds Integration | v1.0 | 0/6 | Not started | - |
| 8. Auth | v1.1 | 0/5 | Not started | - |
| 9. MCP Server | v1.1 | 0/7 | Not started | - |
| 10. Observability | v1.1 | 0/6 | Not started | - |
| 11. Pre-Launch QA | v1.1 | 0/8 | Not started | - |

## Post-MVP Backlog

- Saved picks
- Private group leaderboards
- Notifications / alerts
- Match prediction sharing
- Module Federation
- Admin MCP tools
- Odds as model input (re-evaluate post-MVP)
