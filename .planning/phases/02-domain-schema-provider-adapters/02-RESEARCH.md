# Phase 2 Research: Domain Schema & Provider Adapters

This document answers the core question: **"What do I need to know to PLAN Phase 2 well?"** based on requirements, architectural RFC-0001, and the gathered decisions in `02-CONTEXT.md`.

---

## 1. Requirements Map & Decisions

The table below maps each requirement ID in the scope of Phase 2 to its implementation approach, integrating the specific **User Decisions (D-01 through D-15)**.

| Requirement ID | Description | Decided Approach & Reference |
|:---|:---|:---|
| **TS-01** | All 48 teams, all fixtures, all groups visible | Seed all 48 teams (statically from `teams.json`) and generate/load 72 group stage fixtures. Mock provider dynamically produces full rosters. **(D-12, D-13)** |
| **F2.1** | Core entities: Team, Player, SquadMembership, Venue, Group, Match, MatchEvent | Players mapped directly to Teams (`team_id` FK). No separate `SquadMembership` join table for MVP. **(D-02)**. Add tables: `venues`, `match_events`. |
| **F2.2** | Stats entities: PlayerMatchPerformance, TeamMatchStats | Add tables: `player_match_performances` and `team_match_stats` to store post-match data. |
| **F2.3** | Rating entities: TeamRatingSnapshot, PlayerRatingSnapshot | Keep the existing combined `ratings_snapshots` table. Filter by `player_id IS NULL` for team ratings. **(D-04)** |
| **F2.4** | Prediction entities: MatchPrediction, PredictionInputSnapshot | Keep `predictions` as MatchPrediction. Add `prediction_input_snapshots` to store the exact weights/ratings used during calculation. |
| **F2.5** | Odds entities: MarketOddsSnapshot | Keep existing `odds_history` table. |
| **F2.6** | Provider entities: ProviderSource, ProviderRawSnapshot | Consolidate into a single append-only `provider_logs` table (source, entity_type, raw_jsonb, timestamp). **(D-03)** |
| **F2.7** | Model entities: ModelMetric | Add `model_metrics` table for log loss, Brier score, accuracy, and calibration tracking. |
| **F2.8** | Provider ID mapping tables | Store `provider_id` as a nullable text column directly on entity tables (`teams.provider_id`, `players.provider_id`, etc.). No separate mapping table. **(D-14)** |
| **F2.9** | All snapshots immutable after creation | Restrict writes via application-level insertion-only operations and DB checks where applicable. |
| **F3.1** | Provider adapter interface in `packages/data-providers` | Define `SyncProvider` with per-entity methods (`fetchTeams`, `fetchFixtures`, `fetchSquads`, `fetchMatchStats`). **(D-05)** |
| **F3.2** | Fixture sync adapter (TheStatsAPI) | Implement `TheStatsApiProvider.fetchFixtures()` using declarative mapping. **(D-09)** |
| **F3.3** | Team and squad sync adapter | Implement `fetchTeams()` and `fetchSquads()` for player/roster sync. **(D-06, D-07)** |
| **F3.4** | Match status polling adapter | Adapter methods to fetch live match statuses and event logs. |
| **F3.5** | Player/team performance sync adapter | Adapter methods to parse post-match stats and match events. |
| **F3.7** | All adapters: retry logic, rate-limit handling, freshness | Implement in a shared `TheStatsApiClient` utilizing backoff, jitter, and response header parsing. **(D-08)** |
| **F3.8** | Provider ID → internal ID mapping on ingest | Map provider IDs on ingest using the direct `provider_id` columns. Keep 3-letter internal IDs for teams. **(D-14, D-15)** |
| **F3.9** | Local fixture mode with replayed transitions | `MockSyncProvider` programmatically generates mock squads and replays scheduled -> live -> completed match transitions. **(D-11)** |
| **NF-04** | Snapshot immutability | Restrict modification of `predictions`, `ratings_snapshots`, and `provider_logs`. |
| **NF-05** | Stable internal IDs independent of provider IDs | 3-letter codes for teams remain primary key; other tables use stable serial IDs. |
| **NF-07** | External fetches rate-limit and retry handling | Centralized HTTP client interceptors and error handlers. |

---

## 2. Database Schema Design (F2)

Following the iterative expansion approach **(D-01)**, we expand the baseline schema file (`packages/domain/src/db/schema.ts`) to incorporate new tables and fields.

### Extended Existing Tables

1. **`teams`**:
   - Add `providerId: text("provider_id")` (indexable, nullable).
2. **`players`**:
   - Add `providerId: text("provider_id")` (indexable, nullable).
   - Scoped directly to `teamId` via foreign key reference (no join table) **(D-02)**.
3. **`matches`**:
   - Add `providerId: text("provider_id")` (indexable, nullable).
   - Add `venueId: integer("venue_id").references(() => venues.id)` (nullable).

### New Tables

#### 1. Venues (`venues`)
Represents the stadium and geographical context.
```typescript
export const venues = pgTable("venues", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  city: text("city").notNull(),
  country: text("country").notNull(),
  providerId: text("provider_id"),
});
```

#### 2. Match Events (`match_events`)
Tracks key match milestones for UI display and prediction updates.
```typescript
export const matchEvents = pgTable("match_events", {
  id: serial("id").primaryKey(),
  matchId: integer("match_id").references(() => matches.id).notNull(),
  teamId: text("team_id").references(() => teams.id).notNull(),
  playerId: integer("player_id").references(() => players.id),
  eventType: text("event_type").notNull(), // 'Goal', 'YellowCard', 'RedCard', 'Substitution'
  minute: integer("minute").notNull(),
  extraTimeMinute: integer("extra_time_minute"), // e.g. 90+3
  detail: text("detail"), // e.g. 'Penalty', 'OwnGoal', 'SubstitutedOut'
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});
```

#### 3. Player Match Performances (`player_match_performances`)
Contains granular individual player statistics for a specific match.
```typescript
export const playerMatchPerformances = pgTable("player_match_performances", {
  id: serial("id").primaryKey(),
  playerId: integer("player_id").references(() => players.id).notNull(),
  matchId: integer("match_id").references(() => matches.id).notNull(),
  teamId: text("team_id").references(() => teams.id).notNull(),
  rating: real("rating").notNull(), // Match performance rating (e.g. 7.2)
  minutesPlayed: integer("minutes_played").default(0).notNull(),
  goals: integer("goals").default(0).notNull(),
  assists: integer("assists").default(0).notNull(),
  yellowCards: integer("yellow_cards").default(0).notNull(),
  redCards: integer("red_cards").default(0).notNull(),
  shots: integer("shots"),
  shotsOnTarget: integer("shots_on_target"),
  passesAttempted: integer("passes_attempted"),
  passesCompleted: integer("passes_completed"),
  tackles: integer("tackles"),
  interceptions: integer("interceptions"),
  saves: integer("saves"), // for Goalkeepers
  goalsConceded: integer("goals_conceded"), // for Goalkeepers/Defenders
  cleanSheet: integer("clean_sheet"), // 0 or 1
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});
```

#### 4. Team Match Stats (`team_match_stats`)
Aggregated team performance metrics for a specific match, including Expected Goals (xG).
```typescript
export const teamMatchStats = pgTable("team_match_stats", {
  id: serial("id").primaryKey(),
  teamId: text("team_id").references(() => teams.id).notNull(),
  matchId: integer("match_id").references(() => matches.id).notNull(),
  possession: real("possession"), // percentage (e.g. 54.2)
  shots: integer("shots"),
  shotsOnTarget: integer("shots_on_target"),
  passesAttempted: integer("passes_attempted"),
  passesCompleted: integer("passes_completed"),
  corners: integer("corners"),
  fouls: integer("fouls"),
  yellowCards: integer("yellow_cards").default(0).notNull(),
  redCards: integer("red_cards").default(0).notNull(),
  offsides: integer("offsides"),
  expectedGoals: real("expected_goals"), // xG
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});
```

#### 5. Prediction Input Snapshots (`prediction_input_snapshots`)
Stores the exact state of prediction variables at the time a prediction is generated.
```typescript
export const predictionInputSnapshots = pgTable("prediction_input_snapshots", {
  id: serial("id").primaryKey(),
  predictionId: integer("prediction_id").references(() => predictions.id).notNull(),
  homeTeamElo: integer("home_team_elo").notNull(),
  awayTeamElo: integer("away_team_elo").notNull(),
  homeSquadRating: real("home_squad_rating").notNull(), // player quality
  awaySquadRating: real("away_squad_rating").notNull(),
  homeTournamentForm: real("home_tournament_form").notNull(),
  awayTournamentForm: real("away_tournament_form").notNull(),
  homePlayerAvailability: real("home_player_availability").notNull(),
  awayPlayerAvailability: real("away_player_availability").notNull(),
  marketSignal: real("market_signal"), // odds baseline
  inputData: jsonb("input_data").notNull(), // Full individual player and team state JSON
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});
```

#### 6. Provider Logs (`provider_logs`)
Consolidated, append-only raw JSON logs from external sources **(D-03)**.
```typescript
export const providerLogs = pgTable("provider_logs", {
  id: serial("id").primaryKey(),
  provider: text("provider").notNull(), // e.g. 'TheStatsAPI', 'The Odds API'
  entityType: text("entity_type").notNull(), // e.g. 'fixtures', 'squads', 'live_status'
  rawJsonb: jsonb("raw_jsonb").notNull(), // raw provider payload
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});
```

#### 7. Model Metrics (`model_metrics`)
Tracks the statistical quality of model predictions over time.
```typescript
export const modelMetrics = pgTable("model_metrics", {
  id: serial("id").primaryKey(),
  calculatedAt: timestamp("calculated_at", { withTimezone: true }).defaultNow().notNull(),
  accuracy: real("accuracy").notNull(),
  brierScore: real("brier_score").notNull(),
  logLoss: real("log_loss").notNull(),
  calibration: jsonb("calibration").notNull(), // accuracy per probability bucket
  modelVersion: text("model_version").notNull(),
});
```

### Snapshot Immutability (F2.9)
To guarantee immutability:
- Databases permissions should restrict `UPDATE` and `DELETE` queries on `predictions`, `ratings_snapshots`, `prediction_input_snapshots`, `provider_logs`, and `model_metrics`.
- Drizzle models should encapsulate write access inside specific insert functions, throwing compilation errors if an update is attempted.

---

## 3. Data Ingestion & Provider Adapters (F3)

### Package Directory Structure
To support named, separate adapter modules **(D-07)** and a shared HTTP client **(D-08)**, we will layout `packages/data-providers` as follows:

```text
packages/data-providers/
├── src/
│   ├── index.ts                 # Main export point (SyncProvider, MockSyncProvider, Normalized types)
│   ├── types.ts                 # Shared normalization interface definitions
│   ├── base-client.ts           # TheStatsApiClient base class (rate limiting, retries, auth)
│   ├── thestatsapi/             # Real provider implementation
│   │   ├── client.ts            # Extension of base client containing endpoint paths
│   │   ├── fixtures.ts          # Fixture sync adapter
│   │   ├── teams.ts             # Team and squad sync adapter
│   │   ├── stats.ts             # Match polling and performance sync adapter
│   │   └── mapper.ts            # Declarative field transformation mapping configs
│   └── mock/                    # Mock provider implementation
│       └── mock-provider.ts     # Programmatic MockSyncProvider
```

### Clean Normalized Interfaces
Adapters will parse provider-specific payloads into clean, stable domain types before returning:

```typescript
export interface NormalizedTeam {
  id: string; // Internal 3-letter code, e.g. 'ARG'
  name: string;
  groupName: string;
  flagUrl: string | null;
  eloRating: number;
  providerId: string | null;
}

export interface NormalizedPlayer {
  providerId: string;
  name: string;
  position: 'Goalkeeper' | 'Defender' | 'Midfielder' | 'Forward';
  teamId: string;
  influenceScore: number;
}

export interface NormalizedMatch {
  matchNumber: number;
  providerId: string | null;
  homeTeamId: string | null; // 3-letter code
  awayTeamId: string | null;
  status: 'Scheduled' | 'Live' | 'Completed';
  stage: string;
  kickoffTime: Date;
  venueName: string | null;
  venueCity: string | null;
}

export interface NormalizedMatchStats {
  status: 'Live' | 'Completed';
  homeScore: number | null;
  awayScore: number | null;
  teamStats: {
    home: NormalizedTeamStats;
    away: NormalizedTeamStats;
  };
  playerPerformances: NormalizedPlayerPerformance[];
  events: NormalizedMatchEvent[];
}

export interface NormalizedTeamStats {
  possession: number | null;
  shots: number | null;
  shotsOnTarget: number | null;
  passesAttempted: number | null;
  passesCompleted: number | null;
  corners: number | null;
  fouls: number | null;
  yellowCards: number;
  redCards: number;
  offsides: number | null;
  expectedGoals: number | null;
}

export interface NormalizedPlayerPerformance {
  playerProviderId: string;
  playerName: string;
  rating: number;
  minutesPlayed: number;
  goals: number;
  assists: number;
  yellowCards: number;
  redCards: number;
  shots: number | null;
  shotsOnTarget: number | null;
  passesAttempted: number | null;
  passesCompleted: number | null;
  tackles: number | null;
  interceptions: number | null;
  saves: number | null;
  goalsConceded: number | null;
  cleanSheet: number | null;
}

export interface NormalizedMatchEvent {
  playerProviderId: string | null;
  teamId: string; // internal team ID
  eventType: 'Goal' | 'YellowCard' | 'RedCard' | 'Substitution';
  minute: number;
  extraTimeMinute: number | null;
  detail: string | null;
}
```

### Shared HTTP Client (`TheStatsApiClient`) Design
The shared HTTP client handles infrastructural concerns dynamically:
1. **Authentication**: Injects `Authorization: Bearer ${process.env.THESTATSAPI_KEY}` headers on all requests.
2. **Rate Limiting**: Parses standard headers (`X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`). If a request triggers a `429 Too Many Requests`, the client reads the `Retry-After` header (or defaults to exponential decay) and queues subsequent requests.
3. **Retries**: Implements exponential backoff with jitter for transient errors (HTTP status codes `5xx` and network drops). Maximum retry attempts default to 3.
4. **Append-Only Ingestion Logging**: Interceptors write each successful raw response to `provider_logs` asynchronously, providing a clear auditing history.

### Normalization Mapping Layer (D-09, D-10)
Instead of verbose imperative routines, field mapping is done declaratively:

```typescript
const fixtureMappingConfig = {
  id: "fixture_id",
  matchNumber: "match_no",
  kickoffTime: (raw: any) => new Date(raw.start_time),
  homeTeamId: "team_home.iso_code",
  awayTeamId: "team_away.iso_code",
  venueName: "stadium.name",
  venueCity: "stadium.location",
};
```
- **Graceful Degradation**: If an optional field is missing from the payload (e.g. `stadium.name`), the mapper logs a warning and leaves the field `null`, allowing the ingest pipeline to continue rather than crash.

---

## 4. Local Mock Mode & Dynamic Replays (F3.9)

To support local developer environments running offline without API credentials:

### Programmatic Mock Data Factory (D-11)
Instead of static JSON files, `MockSyncProvider` dynamically generates realistic squads:
- Pre-defines array templates of country-specific names for all 48 participating countries.
- Generates 23–26 players per team on demand.
- Distributes player positions: 3 Goalkeepers, 8 Defenders, 8 Midfielders, 5 Forwards.
- Assigns randomized influence scores (40 to 95) based on a normal distribution centered on team baseline Elo rating.

### Match Replay Ingestion System
For testing end-to-end event loops (status changes, updates, rating recalculation):
- The `MockSyncProvider` hosts a progression counter or respects a timeline configuration.
- **Scheduled**: Returns a match with null scores.
- **Live**: Simulates a live match state. Score increases incrementally, random cards and substitutions are generated.
- **Completed**: Computes stable post-match stats. Generates realistic player match performances:
  - Forwards who scored get higher ratings.
  - Goalkeepers/defenders with clean sheets get boosted ratings.
  - Cards negatively affect performance ratings.

---

## 5. Seed Data Strategy (TS-01)

### The 48-Team Baseline
The `data/teams.json` file contains a complete list of 48 teams mapped to their official groups (12 groups, A through L). This is seeded directly on startup.

### Fixtures Expansion
The current `data/fixtures.json` contains only 6 sample matches. To meet **TS-01** ("All fixtures visible"), we must expand this:
- **Group Stage Schedule (72 Matches)**: Can be programmatically pre-calculated inside the seed scripts:
  - Inside each of the 12 groups, pair the 4 teams using standard round-robin scheduling (6 matches per group).
  - Assign sequential kickoff times starting June 11, 2026.
  - Store matches as `Scheduled` with empty scores.
- **Knockout Stage (32 Matches)**: Seed placeholders (e.g., `1A vs 2B`, `Winner 73 vs Winner 74`) with match numbers 73 to 104, establishing the full bracket tree on day one.

---

## 6. Verification & Quality Gate Plan

To ensure the Phase 2 implementation satisfies requirements and contains zero regressions, we will enforce three layers of automated validation:

### 1. Unit Tests (Vitest)
- **Mapping Correctness**: Verify the declarative mapper handles key modifications, string-to-date conversions, and gracefully handles missing properties (logging a warning rather than throwing).
- **HTTP Client Retries**: Mock networking errors and verify the client executes up to 3 retries, handles rate-limit headers (HTTP 429), and successfully backsoff.
- **Mock Factories**: Verify programmatic player generators produce the correct roster sizes, position balances, and influence boundaries.

### 2. Integration Tests (Vitest + DB)
- **Migration & Seeding Loop**: Spin up Postgres, apply Drizzle migrations, run `db-init.ts`, and verify all 48 teams and 104 matches exist in the database with correct foreign keys.
- **Idempotency checks**: Running the seed script multiple times should not create duplicate teams or matches (uses `onConflictDoUpdate`).
- **Sync End-to-End**: Run `sync-fixtures` and check that the raw response is successfully saved to `provider_logs` and internal match records are updated.

### 3. BDD Tests (Cucumber)
Write feature files covering ingest scenarios. Example:

```gherkin
Feature: Match Data Synchronization
  Scenario: Successfully ingesting fixtures from data provider
    Given a clean database populated with 48 teams
    When the fixture sync worker runs
    Then 104 matches should exist in the database
    And a provider log entry should be recorded for the ingest event
    And no match records should be duplicated
```

---

## 7. What Do I Need to Know to Plan This Phase Well?

### Critical Dependencies
1. **Phase 1 Infrastructure**: Verify that Docker Compose (Postgres, Redis) is healthy and that Drizzle can connect to the target database.
2. **Environment Variables**: Ensure `PROVIDER_MODE` (real | mock) can be toggled easily.

### Recommended Development Sequence
1. **Scaffold types and client**: Define the clean normalized domain interfaces and implement the `TheStatsApiClient` HTTP layer.
2. **Implement Mock Provider**: Write the programmatic player factories and fixture timeline generator. This unlocks testing the database schemas without external network calls.
3. **Database Schema Expansion**: Expand `schema.ts`, generate migrations using `drizzle-kit`, and apply them using `db-init.ts`.
4. **Declarative Mapper**: Implement the mapping rules for TheStatsAPI.
5. **Real Provider Adapter**: Write the actual entity fetching classes for TheStatsAPI.
6. **Seed & Verification**: Expand the seeding process to cover all 104 matches, and run integration/BDD quality gates.
