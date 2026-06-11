---
status: testing
phase: 02-domain-schema-provider-adapters
source:
  - .planning/phases/02-domain-schema-provider-adapters/02-01-SUMMARY.md
  - .planning/phases/02-domain-schema-provider-adapters/02-02-SUMMARY.md
  - .planning/phases/02-domain-schema-provider-adapters/02-03-SUMMARY.md
started: 2026-06-10T11:15:00Z
updated: 2026-06-10T11:10:20Z
---

## Current Test

number: 2
name: Retrieve Normalized Domain Entities
expected: |
  SyncProvider interface (fetchTeams, fetchFixtures, fetchSquads, fetchMatchStats) correctly returns strictly typed normalized domain entities (NormalizedTeam, NormalizedMatch, etc.) with no 'any'.
awaiting: user response

## Tests

### 1. Cold Start Smoke Test
expected: Kill any running server/service. Clear ephemeral state (temp DBs, caches, lock files). Start the application from scratch. Server boots without errors, any seed/migration completes, and a primary query (health check, homepage load, or basic API call) returns live data.
result: pass

### 2. Retrieve Normalized Domain Entities
expected: SyncProvider interface (fetchTeams, fetchFixtures, fetchSquads, fetchMatchStats) correctly returns strictly typed normalized domain entities (NormalizedTeam, NormalizedMatch, etc.) with no 'any'.
result: [pending]

### 3. Database Migration and Seeding
expected: All Drizzle migrations are applied on startup, and db-init.ts programmatically seeds all 48 teams and 104 matches (72 group stage round-robin, 32 knockout placeholders) idempotently using onConflictDoUpdate.
result: [pending]

### 4. Snapshot Immutability Triggers
expected: Postgres BEFORE UPDATE OR DELETE triggers prevent modifications on predictions, ratings_snapshots, prediction_input_snapshots, provider_logs, and model_metrics tables.
result: [pending]

### 5. Data Ingestion & Retry Logic
expected: ConcreteTheStatsApiClient rate limiting (HTTP 429), retries (3 attempts), and logging to provider_logs function correctly with exponential backoff and jitter.
result: [pending]

## Summary

total: 5
passed: 1
issues: 0
pending: 4
skipped: 0

## Gaps

[none yet]
