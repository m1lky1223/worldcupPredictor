# Phase 6: Worker — Polling, Finalization & Rating Updates

**Goal:** BullMQ worker runs all sync and post-match jobs. Predictions recalculate within 5 min of finalization.

**Exit criteria:** End-to-end test: mock match finalized → ratings updated → predictions recalculated within 5 min.

## Architecture

```
worker/
├── index.ts          # Worker bootstrap — loads registry, starts worker + scheduler
├── config.ts         # Typed env config
├── connection.ts     # Shared Redis connection (BullMQ-safe)
├── queue.ts          # Queue definition + typed job definitions
├── registry.ts       # Job name → handler map with typed payloads
├── scheduler.ts      # Adaptive polling scheduler (rate-limit aware)
├── freshness.ts      # Provider freshness tracking (last-synced timestamps)
└── jobs/
    ├── sync-teams.ts
    ├── sync-fixtures.ts
    ├── sync-squads.ts
    ├── sync-match-statuses.ts
    ├── sync-live-match.ts
    ├── finalize-match.ts
    ├── update-ratings.ts
    ├── recalculate-predictions.ts
    └── calculate-metrics.ts
```

Single `worldcup-jobs` queue. Job type discriminated via `job.name`. Repeatable jobs registered via `QueueScheduler`. Distributed locks via BullMQ job deduplication + Redis locks for finalization.

## Wave 1: Core Infra + Sync Jobs (06-01, 06-02, 06-03, 06-08)

- Job registry, typed queue definitions, shared Redis connection
- Adaptive polling scheduler (rate-limit aware, match-proximity aware)
- sync-teams, sync-fixtures, sync-squads jobs
- sync-match-statuses + sync-live-match polling jobs
- Provider freshness tracking table + update logic

## Wave 2: Match Finalization + Ratings + Predictions (06-04, 06-05, 06-06, 06-07)

- finalize-match: idempotent, Redis-locked, immutable snapshot
- update-ratings: calls RatingService from prediction-engine
- recalculate-predictions: calls PredictionGenerator
- calculate-metrics: calls ModelMetricsService

## Wave 3: E2E Mock Replay (06-09)

- Test script that advances mock provider step by step
- Verifies full pipeline: sync → status change → finalize → ratings → predictions

## Dependencies

- Phase 5 (prediction-engine): ✅ Complete
- Phase 2 (data-providers, domain schema): ✅ Complete
