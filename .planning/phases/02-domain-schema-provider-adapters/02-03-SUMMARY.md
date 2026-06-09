---
phase: 02-domain-schema-provider-adapters
plan: 03
subsystem: data-providers
tags: thestatsapi, adapter, mapper, normalization, vitest

# Dependency graph
requires:
  - phase: 02-domain-schema-provider-adapters
    plan: 01
    provides: normalized types (NormalizedMatch, NormalizedTeam, etc.) and shared HTTP client (TheStatsApiClient)
  - phase: 02-domain-schema-provider-adapters
    plan: 02
    provides: database schema expansion and SyncProvider interface
provides:
  - Declarative field-mapping engine (getNestedValue, mapRawEntity, mapping configs)
  - ConcreteTheStatsApiClient with endpoint-specific methods (fixtures, teams, squads, match stats)
  - Entity sync adapters: FixturesAdapter, TeamsAdapter, StatsAdapter
  - Unit and integration test suites for mapper and adapter pipeline
affects: worker service (match polling), prediction-engine (data consumption), seed/sync scripts

# Tech tracking
tech-stack:
  added: []
  patterns:
    - declarative field mapping via dot-path resolution and transformer functions
    - adapter-per-entity pattern (one file per domain entity under provider directory)
    - graceful degradation with console.warn for missing optional provider fields

key-files:
  created:
    - packages/data-providers/src/thestatsapi/mapper.ts
    - packages/data-providers/src/thestatsapi/client.ts
    - packages/data-providers/src/thestatsapi/fixtures.ts
    - packages/data-providers/src/thestatsapi/teams.ts
    - packages/data-providers/src/thestatsapi/stats.ts
    - packages/data-providers/src/__tests__/mapper.test.ts
    - packages/data-providers/src/__tests__/integration.test.ts
  modified:
    - packages/data-providers/src/index.ts

key-decisions:
  - "Mapper uses string dot-paths for simple extractions and function transformers for complex conversions (e.g. Date parsing)"
  - "Console.warn for missing optional fields instead of throwing — graceful degradation"
  - "Adapters instantiate their own ConcreteTheStatsApiClient by default but accept it via constructor for DI/testability"
  - "Spy types in tests use `any` with lint suppression due to vitest/TypeScript strict mode incompatibility with ReturnType<typeof vi.spyOn>"

patterns-established:
  - "Adapter-per-entity: one file per domain entity (fixtures.ts, teams.ts, stats.ts) under the provider directory"
  - "Status normalization: raw status strings mapped to strict union types (Scheduled/Live/Completed) in adapters"
  - "Default fallbacks for provider-missing fields (eloRating=1500, influenceScore=50)"

requirements-completed:
  - F3.2
  - F3.3
  - F3.4
  - F3.5
  - F3.8

# Metrics
duration: 7 min
completed: 2026-06-09
---

# Phase 2 Plan 3: TheStatsAPI Provider Adapters Summary

**Declarative normalization mapper, concrete API client, and entity sync adapters for TheStatsAPI with full test coverage**

## Performance

- **Duration:** 7 min
- **Started:** 2026-06-09T22:28:00Z
- **Completed:** 2026-06-09T22:35:00Z
- **Tasks:** 5
- **Files modified:** 8

## Accomplishments

- Implemented declarative field-mapping engine with dot-path resolution (`getNestedValue`), function transformers, and graceful degradation via `console.warn` for missing optional fields
- Created `fixtureMappingConfig`, `teamMappingConfig`, and `playerMappingConfig` declarative configs
- Extended `TheStatsApiClient` as `ConcreteTheStatsApiClient` with typed endpoint methods for fixtures, teams, squads, and match performance
- Built `FixturesAdapter` — fetches and normalizes matches via `/fixtures` endpoint
- Built `TeamsAdapter` — fetches teams via `/teams` and squads via `/teams/{id}/squad`
- Built `StatsAdapter` — fetches match performance stats via `/matches/{id}/stats` including team stats, player performances, and match events
- Updated package entrypoint (`index.ts`) to export all thestatsapi modules
- Wrote 25 new tests (17 mapper unit tests + 8 integration tests) all passing

## Task Commits

Each task was committed atomically:

1. **Task 1: Declarative Normalization Mapper** - `cd27432` (feat)
2. **Task 2: Concrete HTTP API Client** - `2c472c2` (feat)
3. **Task 3: Entity Sync Adapters (fixtures, teams, stats)** - `113d97e` (feat)
4. **Task 4: Export adapters in package index** - `8d965b2` (feat)
5. **Task 5: Unit and integration tests** - `5e4f763` (test)

**Plan metadata:** (committed after SUMMARY)

## Files Created/Modified

### Created
- `packages/data-providers/src/thestatsapi/mapper.ts` — Declarative field mapping engine with `getNestedValue`, `mapRawEntity`, and mapping configs
- `packages/data-providers/src/thestatsapi/client.ts` — `ConcreteTheStatsApiClient` extending shared base client with endpoint methods
- `packages/data-providers/src/thestatsapi/fixtures.ts` — `FixturesAdapter` for match synchronization
- `packages/data-providers/src/thestatsapi/teams.ts` — `TeamsAdapter` for team and squad synchronization
- `packages/data-providers/src/thestatsapi/stats.ts` — `StatsAdapter` for match performance data
- `packages/data-providers/src/__tests__/mapper.test.ts` — 17 unit tests for the declarative mapper
- `packages/data-providers/src/__tests__/integration.test.ts` — 8 integration tests for the adapter pipeline

### Modified
- `packages/data-providers/src/index.ts` — Added exports for all thestatsapi modules

## Decisions Made

- **Declarative mapping over imperative conversion:** Mapper uses string dot-paths for simple field extractions and function transformers for complex conversions (e.g., Date parsing), with graceful degradation on missing fields via `console.warn`
- **Adapter constructor accepts optional client:** Each adapter defaults to creating its own `ConcreteTheStatsApiClient` but accepts one via constructor for dependency injection and testability
- **Default values for provider-missing fields:** `eloRating` defaults to 1500, `influenceScore` defaults to 50 when the provider does not supply these values
- **Status normalization:** Raw status strings are normalized to strict union types (`Scheduled`, `Live`, `Completed`) with fuzzy matching for variations like `in_play`, `finished`, `inprogress`

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing Critical] Added mapper to index.ts exports beyond plan spec**
- **Found during:** Task 4 (Export adapters in package index)
- **Issue:** Plan specified only client and three adapter exports, but the mapper (`mapRawEntity`, `getNestedValue`, configs) is a key public API that consumers and future plans need
- **Fix:** Added `export * from "./thestatsapi/mapper.js"` to index.ts
- **Files modified:** packages/data-providers/src/index.ts
- **Verification:** Build passes, all tests pass
- **Committed in:** 8d965b2 (Task 4 commit)

**2. [Rule 1 - Bug] Vitest spy type incompatibility with strict TypeScript**
- **Found during:** Task 5 verification (pnpm run build)
- **Issue:** `let fetchSpy: ReturnType<typeof vi.spyOn>` caused TS errors because vitest v1.6.1's vi.spyOn returns a more specific generic type than `ReturnType` infers
- **Fix:** Changed spy variable types to `any` with eslint-disable annotations
- **Files modified:** packages/data-providers/src/__tests__/mapper.test.ts, packages/data-providers/src/__tests__/integration.test.ts
- **Verification:** Build passes, tests still pass
- **Committed in:** 5e4f763 (Task 5 commit, the fix was applied to the original test files before committing)

---

**Total deviations:** 2 auto-fixed (1 missing critical, 1 bug)
**Impact on plan:** Both auto-fixes necessary for correctness and future usability. No scope creep.

## Issues Encountered

- **TypeScript strict mode vs vitest spy generics:** `ReturnType<typeof vi.spyOn>` returns `MockInstance<unknown[], unknown>` but `vi.spyOn(console, "warn")` returns `MockInstance<[message?: any, ...optionalParams: any[]], void>`. Resolved by using looser `any` type annotations on spy variables with eslint-disable comments.

## Stub Tracking

- **`teams.ts` line ~90:** `influenceScore: 50` — hardcoded default for player influence when provider does not supply it. This is intentional (provider data may not include influence scores) and will be refined when prediction-engine integrates actual squad ratings.
- **`teams.ts` lines ~35-37:** `eloRating: typeof rawElo === "number" ? rawElo : 1500` — fallback to 1500 when TheStatsAPI does not supply elo_rating. Intentional gracefulness per D-10.

## Threat Flags

None identified — all files are internal to the data-providers package and process external JSON through the mapper which sanitizes types (per threat model). No new network endpoints, auth paths, or trust-boundary changes were introduced beyond those already scoped in the base client.

## Next Phase Readiness

- All TheStatsAPI adapter infrastructure is in place and tested (mapper, client, fixtures, teams, stats)
- Ready for worker service integration: match polling, data synchronization scripts, and prediction engine data consumption
- Next plan (02-04) should wire these adapters into the worker's sync pipeline
- Test coverage for the adapter pipeline is robust with 25 new tests

## Self-Check: PASSED

- ✅ All 7 created files exist on disk
- ✅ All 5 task commits found in git log
- ✅ Full workspace build passes (pnpm run build)
- ✅ All 71 tests pass (pnpm test)
