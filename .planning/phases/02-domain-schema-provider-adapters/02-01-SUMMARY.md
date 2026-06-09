---
phase: 02-domain-schema-provider-adapters
plan: 01
subsystem: data-providers
tags: [normalized-types, http-client, rate-limiting, retry, mock-provider, vitest]

requires:
  - phase: 01-monorepo-local-infrastructure
    provides: Monorepo scaffold, domain package with Drizzle schema, existing SyncProvider skeleton

provides:
  - Normalized data interfaces for teams, players, matches, match stats, player performances, match events
  - Shared HTTP client with rate-limiting and retry (TheStatsApiClient)
  - Programmatic MockSyncProvider for offline development and testing
  - Updated SyncProvider interface with typed method signatures
  - Unit test suite for retry logic and mock squad generation

affects:
  - 02-02-PLAN.md (depends on these types)
  - Phase 3 prediction engine (consumes these types)
  - Phase 4 UI (consumes normalized match/team data)

tech-stack:
  added: []
  patterns:
    - Normalized domain interfaces decouple provider schemas from application code
    - NonRetryableHttpError pattern for distinguishing retryable vs non-retryable errors
    - Fire-and-forget async logging to provider_logs table
    - Step-based mock replay for testing match lifecycle transitions

key-files:
  created:
    - packages/data-providers/src/types.ts
    - packages/data-providers/src/base-client.ts
    - packages/data-providers/src/mock/mock-provider.ts
    - packages/data-providers/src/__tests__/mock-provider.test.ts
    - packages/data-providers/src/__tests__/base-client.test.ts
  modified:
    - packages/data-providers/src/index.ts
  created_count: 5
  modified_count: 1

key-decisions:
  - "NonRetryableHttpError class prevents catch block from retrying 4xx (except 429) errors (Rule 1 fix)"
  - "MockSyncProvider generates 24-26 players programmatically with country-specific name pools"
  - "Exponential backoff for 5xx with jitter; Retry-After header for 429 rate limits"
  - "Fire-and-forget logging to provider_logs never blocks HTTP response"

requirements-completed:
  - F3.1
  - F3.7
  - F3.9
  - NF-07

duration: 4min
completed: 2026-06-09
---

# Phase 2 Plan 1: Normalized Types, Shared HTTP Client, and Mock Provider Summary

**Normalized data provider interfaces, TheStatsApiClient with rate-limiting and retry, programmatic MockSyncProvider for offline development**

## Performance

- **Duration:** 4 min
- **Started:** 2026-06-09T12:23:24Z
- **Completed:** 2026-06-09T12:26:46Z
- **Tasks:** 5
- **Files modified:** 6

## Accomplishments

- Defined 7 normalized domain interfaces (NormalizedTeam, NormalizedPlayer, NormalizedMatch, NormalizedMatchStats, NormalizedTeamStats, NormalizedPlayerPerformance, NormalizedMatchEvent) with strict typing and no `any`
- Implemented TheStatsApiClient with exponential backoff + jitter for 5xx errors, Retry-After header parsing for 429 rate limits, max 3 retries, and fire-and-forget DB logging to provider_logs
- Built MockSyncProvider with 48 teams, programmatic squad generation (24-26 players, correct position distribution), and step-based match replay (Scheduled → Live → Completed)
- Updated SyncProvider interface with full typed method signatures and re-export of all modules
- Added 24 Vitest unit tests covering retry behavior, squad generation, fixture progression, and match stats

## Task Commits

Each task was committed atomically:

1. **Task 1: Define normalized data interfaces** - `b81ffe6` (feat)
2. **Task 2: Implement shared HTTP client** - `f0b3914` (feat)
3. **Task 3: Implement MockSyncProvider** - `06a16e4` (feat)
4. **Task 4: Update entrypoint exports** - `1b0be24` (feat)
5. **Task 5: Write unit tests** - `750588c` (test)

## Files Created/Modified

- `packages/data-providers/src/types.ts` - 7 normalized domain interfaces with strict typing
- `packages/data-providers/src/base-client.ts` - TheStatsApiClient with retry, rate-limit, and DB audit logging
- `packages/data-providers/src/mock/mock-provider.ts` - Programmatic MockSyncProvider with squad generation and match replay
- `packages/data-providers/src/index.ts` - Updated SyncProvider interface and re-exports
- `packages/data-providers/src/__tests__/mock-provider.test.ts` - 17 tests for squad generation and fixture progression
- `packages/data-providers/src/__tests__/base-client.test.ts` - 7 tests for retry and error handling

## Decisions Made

- Used `NonRetryableHttpError` class to prevent the catch block from retrying non-retryable (4xx except 429) HTTP errors — a necessary fix found during testing
- MockSyncProvider uses country-specific name pools for major teams (ARG, FRA, BRA, ENG, GER, ITA, ESP, POR) with generic fallback names for others
- Squad size varies (24-26) by randomizing forward count (5-7), while GK/DEF/MID counts are fixed at 3/8/8
- Influence scores are scaled from team ELO rating (base = ELO/25) with random offset (-15 to +15), clamped to 40-95 range

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Non-retryable 4xx errors were being retried 3 times**
- **Found during:** Task 5 (Write unit tests)
- **Issue:** The catch block caught all errors inside the try block, including the `throw new Error()` for non-retryable 4xx (e.g. 404). This caused 4xx errors to be retried like network drops.
- **Fix:** Added `NonRetryableHttpError` class. 4xx (except 429) responses throw this error type. The catch block checks `instanceof NonRetryableHttpError` and re-throws immediately without retry. Network errors (plain Error) still retry with backoff.
- **Files modified:** `packages/data-providers/src/base-client.ts`
- **Verification:** Test for 404 now asserts exactly 1 fetch call; test for persistent 500 still asserts 3 calls
- **Committed in:** 750588c (Task 5 commit)

---

**Total deviations:** 1 auto-fixed (1 bug fix)
**Impact on plan:** Essential correctness fix — non-retryable errors shouldn't be retried. No scope creep.

## Issues Encountered

- Base client retry test for persistent 500 errors timed out at default 5s vitest timeout (backoff delay ~7s total) — increased test timeout to 15s for that test case.

## Threat Flags

(none — no new network endpoints, auth paths, or file access patterns introduced beyond what was specified)

## Next Phase Readiness

- Ready for Plan 02-02 (provider adapter implementations for TheStatsAPI fixtures, teams, squads, and stats)
- Normalized types and SyncProvider interface are the contracts that downstream adapters implement
- MockSyncProvider is fully functional for offline testing during subsequent phases

## Self-Check: PASSED

- [x] All 5 created files exist on disk
- [x] All 6 commits present in git history
- [x] Build passes (`pnpm --filter @worldcup/data-providers run build`)
- [x] Tests pass (`pnpm test` — 46 tests, 3 files)

---

*Phase: 02-domain-schema-provider-adapters*
*Completed: 2026-06-09*
