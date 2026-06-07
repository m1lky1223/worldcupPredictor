# REQUIREMENTS.md — 2026 World Cup Predictor

## Table Stakes (Must Ship for MVP)

These are non-negotiable for launch. Any phase that touches one must complete it.

| ID | Requirement | Phase |
|----|-------------|-------|
| TS-01 | All 48 teams, all fixtures, all groups visible | Phase 2 |
| TS-02 | Match predictions exist for all scheduled matches | Phase 4 |
| TS-03 | Completed matches update results, standings, and future predictions within 5 min | Phase 5 |
| TS-04 | App works on mobile and desktop | Phase 3 |
| TS-05 | Clear language that predictions are informational, not gambling advice | All UI |
| TS-06 | No gambling language or encouragement | All UI |
| TS-07 | Docker Compose runs full stack locally from cold checkout | Phase 1 |
| TS-08 | Historical predictions never overwritten | Phase 4 |

## Functional Requirements

### F1 — Monorepo & Infrastructure

- [ ] `F1.1` Monorepo scaffolded with `apps/{web,api,mcp,worker}` and `packages/{domain,prediction-engine,data-providers,ui,config}`
- [ ] `F1.2` TypeScript strict mode across all apps and packages
- [ ] `F1.3` Shared `tsconfig`, `eslint`, and tooling in `packages/config`
- [ ] `F1.4` Docker Compose: web, api, mcp, worker, postgres, redis
- [ ] `F1.5` `.env.example` with all required variables documented
- [ ] `F1.6` Database migrations applied on startup
- [ ] `F1.7` Seed data loads from cold checkout
- [ ] `F1.8` Mock provider mode works without paid API keys
- [ ] `F1.9` Tests runnable inside containers
- [ ] `F1.10` Hot reload for all services in local Docker

### F2 — Database Schema

- [ ] `F2.1` Core entities: Team, Player, SquadMembership, Venue, Group, Match, MatchEvent
- [ ] `F2.2` Stats entities: PlayerMatchPerformance, TeamMatchStats
- [ ] `F2.3` Rating entities: TeamRatingSnapshot, PlayerRatingSnapshot (append-only)
- [ ] `F2.4` Prediction entities: MatchPrediction, PredictionInputSnapshot (append-only)
- [ ] `F2.5` Odds entities: MarketOddsSnapshot
- [ ] `F2.6` Provider entities: ProviderSource, ProviderRawSnapshot
- [ ] `F2.7` Model entities: ModelMetric
- [ ] `F2.8` Provider ID mapping tables (internal IDs stable, independent of provider IDs)
- [ ] `F2.9` All snapshots immutable after creation

### F3 — Data Ingestion

- [ ] `F3.1` Provider adapter interface in `packages/data-providers`
- [ ] `F3.2` Fixture sync adapter (at least one provider)
- [ ] `F3.3` Team and squad sync adapter
- [ ] `F3.4` Match status polling adapter (1–5 min during live windows)
- [ ] `F3.5` Player/team performance sync adapter
- [ ] `F3.6` Odds sync adapter (The Odds API)
- [ ] `F3.7` All adapters: retry logic, rate-limit handling, provider freshness tracking
- [ ] `F3.8` Provider ID → internal ID mapping on ingest
- [ ] `F3.9` Local fixture mode with replayed match transitions for testing

### F4 — Worker Jobs

- [ ] `F4.1` BullMQ job queue backed by Redis
- [ ] `F4.2` `sync-fixtures` job (idempotent)
- [ ] `F4.3` `sync-teams` job (idempotent)
- [ ] `F4.4` `sync-squads` job (idempotent)
- [ ] `F4.5` `sync-match-statuses` job (idempotent)
- [ ] `F4.6` `sync-live-match` job (polling, locked)
- [ ] `F4.7` `finalize-match` job (idempotent, locked, immutable snapshot)
- [ ] `F4.8` `update-player-ratings` job
- [ ] `F4.9` `update-team-ratings` job
- [ ] `F4.10` `recalculate-predictions` job (append-only, triggered after finalize-match)
- [ ] `F4.11` `sync-odds` job
- [ ] `F4.12` `calculate-model-metrics` job
- [ ] `F4.13` Adaptive polling schedule (pre-tournament / match-day / live / off-hours)
- [ ] `F4.14` All jobs record provider freshness

### F5 — Prediction Engine

- [ ] `F5.1` Prediction engine in `packages/prediction-engine`
- [ ] `F5.2` Elo-based team rating baseline
- [ ] `F5.3` Inputs: baseline team strength (35%), player quality (30%), tournament form (15%), player availability (10%), market signal (10%)
- [ ] `F5.4` Output shape: `{ homeWin, draw, awayWin, confidence, factors[], timestamp, modelVersion }`
- [ ] `F5.5` Graceful fallback: if player data missing, use team-level prediction
- [ ] `F5.6` Human-readable explanation factors (non-technical)
- [ ] `F5.7` Predictions append-only (never overwrite)
- [ ] `F5.8` Input snapshot stored with each prediction for auditability
- [ ] `F5.9` Recalculation triggered within 5 min of match finalization
- [ ] `F5.10` Model metrics computed: accuracy, Brier score, log loss, calibration

### F6 — GraphQL API

- [ ] `F6.1` Apollo GraphQL API at `:4000/graphql`
- [ ] `F6.2` Dashboard query (todayMatches, teamRankings, modelMetrics)
- [ ] `F6.3` Match list query with filters (status, date, group, round)
- [ ] `F6.4` Match detail query (prediction, score, odds, events, player performances)
- [ ] `F6.5` Team rankings query
- [ ] `F6.6` Team detail query (squad, match history, rating snapshots)
- [ ] `F6.7` Player leaderboard query
- [ ] `F6.8` Player detail query (performances, form score)
- [ ] `F6.9` Group table query (standings, GD, remaining fixtures, qualification probability)
- [ ] `F6.10` Bracket/knockout projection query
- [ ] `F6.11` Model metrics query
- [ ] `F6.12` Odds comparison query (implied probabilities, market vs model diff)
- [ ] `F6.13` Public read-only access for anonymous users
- [ ] `F6.14` Authenticated mutations for user-specific features (if added)
- [ ] `F6.15` Admin mutations require admin role

### F7 — Web UI

- [ ] `F7.1` Modern.js app at `:3000`
- [ ] `F7.2` Dashboard page (default landing — NOT a marketing page)
- [ ] `F7.3` Match list page (all fixtures, kickoff, teams, venue, status, score, prediction)
- [ ] `F7.4` Match detail page (probabilities, confidence, factors, lineups, odds comparison, post-match summary)
- [ ] `F7.5` Teams page (ranking table, ratings, form)
- [ ] `F7.6` Team profile page (squad, match history)
- [ ] `F7.7` Players page (leaderboard with stats and form)
- [ ] `F7.8` Player profile page (match-by-match performance)
- [ ] `F7.9` Groups page (tables, GD, remaining fixtures, qualification probability)
- [ ] `F7.10` Bracket page (knockout structure, projections, placeholder teams before settlement)
- [ ] `F7.11` Model tracker page (accuracy, Brier score, log loss, calibration, market comparison)
- [ ] `F7.12` Dark mode default, light mode via `prefers-color-scheme`
- [ ] `F7.13` Mobile-first responsive (breakpoints: 640px, 768px, 1024px, 1280px)
- [ ] `F7.14` Predictions shown with uncertainty — never as certainty
- [ ] `F7.15` Graceful degradation: hide odds section if unavailable, fall back to team-level if player data missing
- [ ] `F7.16` Data freshness indicators where relevant

### F8 — Remote MCP Server

- [ ] `F8.1` MCP server at `:4001/mcp` (Streamable HTTP transport)
- [ ] `F8.2` Optional stdio bridge for local CLI compatibility
- [ ] `F8.3` Resources: worldcup://matches, worldcup://matches/{id}, worldcup://teams, worldcup://teams/{id}, worldcup://players, worldcup://players/{id}, worldcup://groups, worldcup://bracket, worldcup://model/metrics, worldcup://providers/freshness
- [ ] `F8.4` Tools: get_matches, get_match_detail, get_team, get_player, get_group_table, get_bracket_projection, get_match_prediction, compare_prediction_to_market, get_model_metrics, get_data_freshness
- [ ] `F8.5` Prompts: summarize_match_prediction, explain_prediction_change, summarize_team_form, compare_two_teams, explain_model_performance
- [ ] `F8.6` Read-only at MVP launch (no admin tools exposed)
- [ ] `F8.7` Token-based auth (bearer tokens / API keys, not Google OAuth)
- [ ] `F8.8` Rate limiting per client
- [ ] `F8.9` Audit logging for tool calls
- [ ] `F8.10` No provider API keys or raw licensed data exposed

### F9 — Authentication & Authorization

- [ ] `F9.1` Google OAuth 2.0 / OpenID Connect for browser login
- [ ] `F9.2` Dev-mode seeded identity (no Google creds needed for local Docker)
- [ ] `F9.3` Roles: anonymous, user, admin, service_agent
- [ ] `F9.4` HTTP-only cookie sessions (no localStorage tokens)
- [ ] `F9.5` Logout and session expiration
- [ ] `F9.6` MCP uses scoped bearer tokens, not Google login

## Non-Functional Requirements

| ID | Requirement |
|----|-------------|
| NF-01 | Prediction freshness: ≤5 min from match finalization |
| NF-02 | Match status polling: 1–5 min during live windows |
| NF-03 | No provider API keys exposed to browser or MCP |
| NF-04 | All snapshots (predictions, ratings, raw provider data) immutable |
| NF-05 | Internal IDs stable and independent of provider IDs |
| NF-06 | All jobs idempotent |
| NF-07 | All external fetches have retry logic and rate-limit handling |
| NF-08 | App runs fully locally with Docker Compose |

## Open Questions (Blocking Decisions)

| ID | Question | Impact |
|----|----------|--------|
| OQ-01 | Which provider for fixtures/players (API-Football, Sportmonks, BALLDONTLIE)? | F3 |
| OQ-02 | Prisma or Drizzle for ORM? | F2 |
| OQ-03 | Should odds feed into the prediction model or display only? | F5 |
| OQ-04 | Should MCP be public read-only or require token for all access? | F8 |
| OQ-05 | Minimum acceptable player data coverage for launch? | F5, F7 |
