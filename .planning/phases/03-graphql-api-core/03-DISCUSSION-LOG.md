# Phase 3: GraphQL API Core - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-06-09
**Phase:** 3-graphql-api-core
**Areas discussed:** Bracket projection, API data scope, Auth boundary, Pagination defaults

---

## Bracket Projection

| Option | Description | Selected |
|--------|-------------|----------|
| Group table only | Points, GD, head-to-head, qualification status | ✓ |
| Full knockout bracket | Path-to-final with predicted winners per round | |

**User's choice:** Agent discretion (user said "i trust your judgement")
**Notes:** Group standings is the essential MVP capability. Full bracket projection is complex domain logic that depends on group outcomes — better to prove the group standings work first.

---

## API Data Scope

| Option | Description | Selected |
|--------|-------------|----------|
| Full exposure | All 13 tables available in GraphQL schema | |
| Focused exposure | Only what dashboard and pages need | ✓ |

**User's choice:** Agent discretion
**Notes:** MatchEvents, PlayerMatchPerformances, TeamMatchStats, PredictionInputSnapshots, ProviderLogs are operational/internal tables. Their data flows through parent resolvers (e.g., match stats on Match type). Keeps the schema clean and focused on what consumers need.

---

## Auth Boundary

| Option | Description | Selected |
|--------|-------------|----------|
| Stub placeholder | Anonymous/default context, typed interface for Phase 8 | ✓ |
| Real auth middleware | Google OAuth or session-based auth now | |

**User's choice:** Agent discretion
**Notes:** Phase 3 is queries-only (no mutations) so there's no write-protection need. Building a stub keeps Phase 3 focused on the query layer while defining the context interface contract for Phase 8.

---

## Pagination Defaults

| Option | Description | Selected |
|--------|-------------|----------|
| (decided by agent) | 20 per page for matches/players, all teams, offset-based | ✓ |

**User's choice:** Agent discretion
**Notes:** Offset pagination is simpler and sufficient for the data volumes (48 teams, 104 matches, ~1300 players). Default sorts: matches by kickoffTime, teams by eloRating, players by influenceScore.

---

## the agent's Discretion

All four gray areas were decided by the agent per user's "i trust your judgement" response:
- Bracket projection → group standings only
- API data scope → focused exposure (not all 13 tables)
- Auth boundary → stub placeholder with typed interface
- Pagination defaults → offset-based, 20 per page

---

## Deferred Ideas

- Full knockout bracket tree — Phase 3.5 or later iteration
- Cursor-based pagination — if data volume demands it
- Real auth with Google OAuth — Phase 8
- Mutations — not in scope for Phase 3
- Internal/operational table exposure — if UI needs change
