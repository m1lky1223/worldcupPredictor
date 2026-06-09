# Phase 2: Domain Schema & Provider Adapters - Context

**Gathered:** 2026-06-09
**Status:** Ready for planning

<domain>
## Phase Boundary

Full database schema for all domain entities (F2) and provider adapter layer that syncs data from TheStatsAPI into those entities (F3). This covers:
- Complete Drizzle schema for all entity types required by the application
- Provider adapter interface and implementation for TheStatsAPI
- Mock provider mode for local development
- Seed data with all 48 teams, all fixtures, all groups

</domain>

<decisions>
## Implementation Decisions

### Schema Expansion Approach
- **D-01:** Schema expanded iteratively alongside adapters, not all-at-once. Add tables as needed by each adapter (e.g., Venue + Group when syncing fixtures; SquadMembership when syncing squads).
- **D-02:** Players scoped to current squad via team_id FK on players table. No SquadMembership join table for MVP (YAGNI).
- **D-03:** Single provider_logs table for raw provider data snapshots (provider, entity_type, raw_jsonb, created_at — append-only). Not separate ProviderSource + ProviderRawSnapshot tables.
- **D-04:** Keep existing combined ratingsSnapshots table as-is for MVP. No split into separate team_rating_snapshots + player_rating_snapshots yet.

### Provider Adapter Interface
- **D-05:** SyncProvider with methods per entity type (fetchFixtures, fetchTeams, fetchSquads, fetchPlayers, fetchMatchStats). Each returns strongly-typed domain types.
- **D-06:** Adapters return domain types — normalization happens inside the adapter, not a separate layer.
- **D-07:** One file per entity adapter under a provider directory (e.g., src/thestatsapi/fixtures.ts, src/thestatsapi/teams.ts).
- **D-08:** Shared HTTP client (TheStatsApiClient) handles auth, rate limiting, retries, base URL. Entity adapters/parsers transform responses to domain types.

### TheStatsAPI Normalization Layer
- **D-09:** Declarative mapping config for field transformations (config objects mapping provider field → domain field).
- **D-10:** Graceful degradation — skip missing optional fields, log warnings. Do not abort on partial data.
- **D-11:** Mock provider generates data programmatically (factories/fakers), not from static JSON files.

### Player/Squad Seed Data
- **D-12:** No static player/squad seed data. Mock mode uses programmatic mock data; real mode fetches from TheStatsAPI. db-init seeds only teams + fixtures.
- **D-13:** Initially use mock data during development; once ingestion pipeline is operational, switch to real provider data.

### Provider ID Mapping
- **D-14:** Store provider_id as nullable text column directly on entity tables (teams.provider_id, players.provider_id, etc.). No separate mapping table for MVP per KISS/YAGNI. Extract to mapping table if a second provider is added later.
- **D-15:** Internal IDs remain 3-letter codes for teams (stable, independent of provider). provider_id column is purely for sync mapping.

### the agent's Discretion
- Agent has discretion over exact declarative mapping config schema (field mapping structure, validation rules).
- Agent has discretion over mock data factory implementation details (faker library choice, data generation approach).
- Agent has discretion over migration naming and organization.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Product & Architecture
- `docs/prd.md` — Product requirements document defining all MVP functionality and priorities
- `docs/rfc-0001-architecture.md` — Architectural design document detailing stack layout and service design
- `AGENTS.md` — Project conventions, monorepo directory layout, design principles, and guidelines

### Project Planning
- `.planning/REQUIREMENTS.md` — Requirements F2 (Database Schema) and F3 (Data Ingestion) are the primary scope
- `.planning/PROJECT.md` — Project overview and key decisions (Drizzle, TheStatsAPI, odds display-only)
- `.planning/STATE.md` — Current project state
- `.planning/phases/01-monorepo-local-infrastructure/01-CONTEXT.md` — Phase 1 decisions (D-01 through D-06)

### Existing Code
- `packages/domain/src/db/schema.ts` — Existing DB schema (baseline for iterative expansion)
- `packages/data-providers/src/index.ts` — Existing SyncProvider skeleton and MockSyncProvider
- `data/teams.json` — Static team seed data (48 teams, 12 groups)
- `data/fixtures.json` — Static fixtures seed data
- `scripts/seed.ts` — Existing seeding script
- `scripts/db-init.ts` — Existing initialization script (migrations + conditional seeding)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `packages/domain/src/db/schema.ts` — 6 existing tables (teams, players, matches, predictions, ratingsSnapshots, oddsHistory). These are the baseline for schema expansion.
- `packages/domain/src/db/index.ts` — Drizzle DB connection setup with pool and schema export.
- `packages/domain/src/index.ts` — Domain package exports: DB connection, schemas, graphql types, PredictionPayload interface.
- `packages/data-providers/src/index.ts` — Bare SyncProvider interface (fetchFixtures, fetchTeams → unknown[]) + empty MockSyncProvider.
- `packages/domain/drizzle.config.ts` — Drizzle Kit configuration for migrations.
- `packages/domain/migrations/` — Existing migration files from Phase 1.

### Established Patterns
- Drizzle ORM with pgTable definitions for schema modeling.
- Domain package pattern: central package exports DB, schemas, types consumed by all apps.
- pnpm workspaces for monorepo dependency management.
- `onConflictDoUpdate` for idempotent seeding.
- Dual-resolve hostnames (Docker service name vs localhost) via IS_DOCKER env check.

### Integration Points
- New schema tables go in `packages/domain/src/db/schema.ts` (iterative additions).
- Provider adapters need to return types compatible with domain schemas.
- Shared HTTP client (TheStatsApiClient) needs rate limiting + retry logic + env-based auth.
- MockSyncProvider needs to return programmatically generated plausible data matching domain types.
- db-init and seed scripts need updating if schema changes affect them.

</code_context>

<specifics>
## Specific Ideas

- Mock data should be generated programmatically using factories (plausible but not real data).
- Provider ID mapping: store the provider's ID directly on the entity table as a nullable column, avoiding a separate mapping table until a second provider is needed.
- Schema additions happen as each adapter is built — adapter first, then the table it needs.

</specifics>

<deferred>
## Deferred Ideas

- **SquadMembership join table** — needed for player career tracking and cross-tournament data. Defer to post-MVP when player history matters.
- **Separate team/player rating snapshots** — the combined ratingsSnapshots table is sufficient for MVP. Split if rating granularity becomes a requirement.
- **Multi-provider ID mapping table** — extract from direct columns when a second provider is added.
- **Static player seed data** — not needed; programmatic mock suffices for dev, real API data for production.

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 02-domain-schema-provider-adapters*
*Context gathered: 2026-06-09*
