# Phase 2: Domain Schema & Provider Adapters - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-06-09
**Phase:** 02-domain-schema-provider-adapters
**Areas discussed:** Schema Expansion Approach, Provider Adapter Interface, TheStatsAPI Normalization Layer, Player/Squad Seed Data, Provider ID Mapping

---

## Schema Expansion Approach

| Option | Description | Selected |
|--------|-------------|----------|
| All entities at once | Model all F2 entities in a single pass. Clean slate, one migration. | |
| Iterative alongside adapters | Add tables as needed by each adapter. Faster time-to-value. | ✓ |

**User's choice:** Iterative alongside adapters
**Notes:** Schema grows incrementally with adapter needs.

| Option | Description | Selected |
|--------|-------------|----------|
| SquadMembership join table | players + teams many-to-many via squad_memberships. Supports future career tracking. | |
| Players scoped to current squad | player table has team_id FK. Simpler for MVP. | ✓ |

**User's choice:** Players scoped to current squad
**Notes:** YAGNI — no join table for MVP.

| Option | Description | Selected |
|--------|-------------|----------|
| Separate ProviderSource + ProviderRawSnapshot | Full audit trail with two tables. | |
| Single provider_log table | One table (provider, entity_type, raw_jsonb, created_at). Append-only. | ✓ |

**User's choice:** Single provider_log table
**Notes:** Simpler, fewer tables, still append-only.

| Option | Description | Selected |
|--------|-------------|----------|
| Replace with separate tables | Drop ratingsSnapshots, create team_rating_snapshots + player_rating_snapshots. | |
| Keep combined as-is | Existing combined table is enough for MVP. | ✓ |

**User's choice:** Keep combined as-is
**Notes:** Avoid migration churn now. Split if rating granularity becomes a requirement.

---

## Provider Adapter Interface

| Option | Description | Selected |
|--------|-------------|----------|
| Methods per entity type | fetchFixtures(), fetchTeams(), fetchSquads(), etc. Clear boundaries. | ✓ |
| Generic fetch method | fetch<T>(entity, params). Single method, entity enum. | |

**User's choice:** Methods per entity type
**Notes:** Strongly-typed, easy to test. Each adapter implements only the methods it supports.

| Option | Description | Selected |
|--------|-------------|----------|
| Adapters return domain types | Normalization inside adapter. Clean for callers. | ✓ |
| Separate normalization layer | Adapters return raw provider shapes. Better separation. | |

**User's choice:** Adapters return domain types
**Notes:** Normalization happens inside the adapter, not a separate layer.

| Option | Description | Selected |
|--------|-------------|----------|
| One file per entity adapter | src/thestatsapi/fixtures.ts, teams.ts, etc. | ✓ |
| One class per provider | Single TheStatsAPIAdapter class with all fetch methods. | |

**User's choice:** One file per entity adapter
**Notes:** Smaller files, focused responsibility.

| Option | Description | Selected |
|--------|-------------|----------|
| Shared HTTP client + entity parsers | One TheStatsApiClient for auth/rate-limits. Entity parsers transform data. | ✓ |
| Each adapter has own fetch | Simpler per-file but duplicates HTTP concerns. | |

**User's choice:** Shared HTTP client + entity parsers
**Notes:** DRY for HTTP concerns (auth, rate limiting, retries, base URL).

---

## TheStatsAPI Normalization Layer

| Option | Description | Selected |
|--------|-------------|----------|
| Mapping functions per entity | Pure functions: theStatsAPIFixtureToDomain(raw). Explicit, testable. | |
| Declarative mapping config | Config objects for field mappings. More concise. | ✓ |

**User's choice:** Declarative mapping config
**Notes:** Config objects define provider field → domain field transformations.

| Option | Description | Selected |
|--------|-------------|----------|
| Skip and log | Skip missing optional fields, log warning. Continue processing. | ✓ |
| Strict validation | Require all mapped fields. Throw on missing critical data. | |

**User's choice:** Skip and log
**Notes:** Graceful degradation — aligns with PRD guidance.

| Option | Description | Selected |
|--------|-------------|----------|
| Load from seed JSON | Read from static JSON files (like teams.json). Reviewable in git. | |
| Generate programmatically | Factories/fakers for plausible data. More variety. | ✓ |

**User's choice:** Generate programmatically
**Notes:** Mock provider uses factory generation, not static JSON.

---

## Player/Squad Seed Data

| Option | Description | Selected |
|--------|-------------|----------|
| Real data only (no static player seed) | Players from TheStatsAPI (real) or programmatic mock (local). | ✓ |
| Static player JSON files | Maintain player-squads.json alongside teams/fixtures. Deterministic. | |

**User's choice:** Real data only (no static player seed)
**Notes:** Clarified: "Initially we can use mock data but we should switch to real data once ingestion has begun. We ingest data into database and store." Mock during dev, real provider data once ingestion pipeline works.

---

## Provider ID Mapping

| Option | Description | Selected |
|--------|-------------|----------|
| Provider ID mapping table per entity | provider_id_mappings table: (internal_id, provider, entity_type, provider_entity_id). | |
| Store provider ID as column on entity | teams.provider_id, players.provider_id, etc. Simpler. | ✓ |

**User's choice:** Direct column on entity
**Notes:** User questioned "why need mapping table?" then applied KISS/YAGNI: "why not store directly on teams table? we should keep it simple." Decision: nullable provider_id column on entity tables. Extract to mapping table when a second provider is added.

| Option | Description | Selected |
|--------|-------------|----------|
| Single polymorphic table | All mappings in one provider_id_mappings. | |
| Per-entity mapping tables | Separate tables per entity type. Better FK constraints. | |

**User's choice:** (Skipped — went with direct column approach instead)

---

## the agent's Discretion

- Exact declarative mapping config schema (field mapping structure, validation rules).
- Mock data factory implementation details (faker library choice, generation approach).
- Migration naming and organization.

## Deferred Ideas

- SquadMembership join table — post-MVP for player career tracking.
- Separate team/player rating snapshots — future if rating granularity needed.
- Multi-provider ID mapping table — when a second provider is added.
- Static player seed data — not needed per current approach.
