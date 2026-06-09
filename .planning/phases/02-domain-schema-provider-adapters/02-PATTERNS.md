# Phase 2: Domain Schema & Provider Adapters — Patterns

This document defines the list of files to be created and modified for Phase 2, mapping their roles, data flows, and design patterns, backed by concrete codebase analogs and code excerpts.

---

## Summary of Files to be Created/Modified

| File Path | Action | Role | Data Flow | Closest Analog |
| :--- | :--- | :--- | :--- | :--- |
| **`packages/domain/src/db/schema.ts`** | Modify | Database Schema | Maps DB columns to runtime types via Drizzle ORM | Itself |
| **`packages/data-providers/src/types.ts`** | Create | Domain Normalization Interfaces | Type-safe contracts for all normalized sync entities | `packages/domain/src/index.ts` |
| **`packages/data-providers/src/index.ts`** | Modify | Package Entrypoint | Re-exports classes, types, and clients | Itself |
| **`packages/data-providers/src/base-client.ts`** | Create | Base HTTP Communication | Outgoing API request → Retry/Rate-Limit → Ingestion Log → Raw JSON | *New Infrastructure* |
| **`packages/data-providers/src/thestatsapi/client.ts`** | Create | Specific HTTP API client | Extends base client with concrete endpoint routing | `packages/data-providers/src/base-client.ts` |
| **`packages/data-providers/src/thestatsapi/mapper.ts`** | Create | Declarative Data Normalization | Transforms raw JSON to Normalized types via config objects | *Utility module* |
| **`packages/data-providers/src/thestatsapi/fixtures.ts`** | Create | Ingest Adapter (Fixtures) | API Raw Fixture JSON → Mapper → `NormalizedMatch[]` | `packages/data-providers/src/index.ts` |
| **`packages/data-providers/src/thestatsapi/teams.ts`** | Create | Ingest Adapter (Teams/Squads) | API Raw Team JSON → Mapper → `NormalizedTeam[]` / `NormalizedPlayer[]` | `packages/data-providers/src/index.ts` |
| **`packages/data-providers/src/thestatsapi/stats.ts`** | Create | Ingest Adapter (Stats/Events) | API Raw Stats JSON → Mapper → `NormalizedMatchStats` | `packages/data-providers/src/index.ts` |
| **`packages/data-providers/src/mock/mock-provider.ts`** | Create | Local Mock Provider | Generates programmatic rosters + simulates live replays | `packages/data-providers/src/index.ts` (old MockSyncProvider) |
| **`scripts/db-init.ts`** | Modify | DB Migration & Seed Loader | Postgres initialization and 104-match seeding | Itself |
| **`scripts/seed.ts`** | Modify | Developer DB Seed Script | Triggers clean migrations & updates all tables | Itself |

---

## Detailed File Specifications

### 1. `packages/domain/src/db/schema.ts`
- **Role:** Database Schema Definitions (Drizzle ORM).
- **Data Flow:** Defines table structures and relational links for core entities. Reads and writes maps to these fields.
- **Closest Analog:** `packages/domain/src/db/schema.ts` (itself).
- **Code Patterns:**

*Existing Code Excerpt:*
```typescript
// packages/domain/src/db/schema.ts
import { pgTable, text, integer, timestamp, real, jsonb, serial } from "drizzle-orm/pg-core";

export const teams = pgTable("teams", {
  id: text("id").primaryKey(), // e.g., 'ARG', 'FRA'
  name: text("name").notNull(),
  groupName: text("group_name").notNull(),
  flagUrl: text("flag_url"),
  eloRating: integer("elo_rating").default(1500).notNull(),
});
```

*Proposed Modifications / Additions:*
```typescript
// Add providerId to existing tables:
export const teams = pgTable("teams", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  groupName: text("group_name").notNull(),
  flagUrl: text("flag_url"),
  eloRating: integer("elo_rating").default(1500).notNull(),
  providerId: text("provider_id"), // Added (D-14)
});

export const players = pgTable("players", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  teamId: text("team_id").references(() => teams.id).notNull(), // Scoped to team directly (D-02)
  position: text("position").notNull(),
  influenceScore: integer("influence_score").default(50).notNull(),
  providerId: text("provider_id"), // Added (D-14)
});

// New Tables:
export const venues = pgTable("venues", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  city: text("city").notNull(),
  country: text("country").notNull(),
  providerId: text("provider_id"),
});

export const matchEvents = pgTable("match_events", {
  id: serial("id").primaryKey(),
  matchId: integer("match_id").references(() => matches.id).notNull(),
  teamId: text("team_id").references(() => teams.id).notNull(),
  playerId: integer("player_id").references(() => players.id),
  eventType: text("event_type").notNull(), // 'Goal', 'YellowCard', 'RedCard', 'Substitution'
  minute: integer("minute").notNull(),
  extraTimeMinute: integer("extra_time_minute"),
  detail: text("detail"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const playerMatchPerformances = pgTable("player_match_performances", {
  id: serial("id").primaryKey(),
  playerId: integer("player_id").references(() => players.id).notNull(),
  matchId: integer("match_id").references(() => matches.id).notNull(),
  teamId: text("team_id").references(() => teams.id).notNull(),
  rating: real("rating").notNull(),
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
  saves: integer("saves"),
  goalsConceded: integer("goals_conceded"),
  cleanSheet: integer("clean_sheet"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const teamMatchStats = pgTable("team_match_stats", {
  id: serial("id").primaryKey(),
  teamId: text("team_id").references(() => teams.id).notNull(),
  matchId: integer("match_id").references(() => matches.id).notNull(),
  possession: real("possession"),
  shots: integer("shots"),
  shotsOnTarget: integer("shots_on_target"),
  passesAttempted: integer("passes_attempted"),
  passesCompleted: integer("passes_completed"),
  corners: integer("corners"),
  fouls: integer("fouls"),
  yellowCards: integer("yellow_cards").default(0).notNull(),
  redCards: integer("red_cards").default(0).notNull(),
  offsides: integer("offsides"),
  expectedGoals: real("expected_goals"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const predictionInputSnapshots = pgTable("prediction_input_snapshots", {
  id: serial("id").primaryKey(),
  predictionId: integer("prediction_id").references(() => predictions.id).notNull(),
  homeTeamElo: integer("home_team_elo").notNull(),
  awayTeamElo: integer("away_team_elo").notNull(),
  homeSquadRating: real("home_squad_rating").notNull(),
  awaySquadRating: real("away_squad_rating").notNull(),
  homeTournamentForm: real("home_tournament_form").notNull(),
  awayTournamentForm: real("away_tournament_form").notNull(),
  homePlayerAvailability: real("home_player_availability").notNull(),
  awayPlayerAvailability: real("away_player_availability").notNull(),
  marketSignal: real("market_signal"),
  inputData: jsonb("input_data").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const providerLogs = pgTable("provider_logs", {
  id: serial("id").primaryKey(),
  provider: text("provider").notNull(), // e.g. 'TheStatsAPI'
  entityType: text("entity_type").notNull(), // e.g. 'fixtures', 'squads'
  rawJsonb: jsonb("raw_jsonb").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const modelMetrics = pgTable("model_metrics", {
  id: serial("id").primaryKey(),
  calculatedAt: timestamp("calculated_at", { withTimezone: true }).defaultNow().notNull(),
  accuracy: real("accuracy").notNull(),
  brierScore: real("brier_score").notNull(),
  logLoss: real("log_loss").notNull(),
  calibration: jsonb("calibration").notNull(),
  modelVersion: text("model_version").notNull(),
});
```

---

### 2. `packages/data-providers/src/types.ts`
- **Role:** Data Normalization Interface definitions.
- **Data Flow:** Establishes compile-time contracts representing cleaned domain concepts, decoupling provider schemas from local processing.
- **Closest Analog:** `packages/domain/src/index.ts` (defining type payload contracts).
- **Code Patterns:**

```typescript
// packages/data-providers/src/types.ts

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
  homeTeamId: string | null;
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
  teamId: string;
  eventType: 'Goal' | 'YellowCard' | 'RedCard' | 'Substitution';
  minute: number;
  extraTimeMinute: number | null;
  detail: string | null;
}
```

---

### 3. `packages/data-providers/src/index.ts`
- **Role:** Package entrypoint exporter.
- **Data Flow:** Passes interfaces, clients, and mock/real sync adapters to client applications.
- **Closest Analog:** `packages/data-providers/src/index.ts` (itself).
- **Code Patterns:**

*Existing Code Excerpt:*
```typescript
export interface SyncProvider {
  fetchFixtures(): Promise<unknown[]>;
  fetchTeams(): Promise<unknown[]>;
}
```

*Proposed Modifications:*
```typescript
import { NormalizedMatch, NormalizedTeam, NormalizedPlayer, NormalizedMatchStats } from "./types.js";

export * from "./types.js";
export * from "./base-client.js";
export * from "./thestatsapi/client.js";
export * from "./mock/mock-provider.js";

export interface SyncProvider {
  fetchFixtures(): Promise<NormalizedMatch[]>;
  fetchTeams(): Promise<NormalizedTeam[]>;
  fetchSquads(teamId: string): Promise<NormalizedPlayer[]>;
  fetchMatchStats(matchId: number, providerMatchId: string): Promise<NormalizedMatchStats>;
}
```

---

### 4. `packages/data-providers/src/base-client.ts`
- **Role:** Base HTTP Communication Client.
- **Data Flow:** Sends API requests, executes rate-limiting parsing, handles backoffs, and writes raw responses asynchronously to database log tables before returning.
- **Closest Analog:** *New infrastructure module.*
- **Code Patterns:**

```typescript
// packages/data-providers/src/base-client.ts
import { db, providerLogs } from "@worldcup/domain";

export class TheStatsApiClient {
  protected apiKey: string;
  protected baseUrl: string;

  constructor() {
    this.apiKey = process.env.THESTATSAPI_KEY || "";
    this.baseUrl = "https://api.thestatsapi.com/v1";
  }

  protected async request<T>(path: string, entityType: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseUrl}${path}`;
    const headers = {
      ...options.headers,
      "Authorization": `Bearer ${this.apiKey}`,
      "Content-Type": "application/json",
    };

    let attempts = 0;
    const maxRetries = 3;

    while (attempts < maxRetries) {
      try {
        const response = await fetch(url, { ...options, headers });

        if (response.status === 429) {
          const retryAfterHeader = response.headers.get("Retry-After");
          const waitMs = retryAfterHeader ? parseInt(retryAfterHeader, 10) * 1000 : Math.pow(2, attempts) * 1000;
          console.warn(`Rate limited (429). Retrying in ${waitMs}ms...`);
          await new Promise((resolve) => setTimeout(resolve, waitMs));
          attempts++;
          continue;
        }

        if (!response.ok && response.status >= 500) {
          const waitMs = Math.pow(2, attempts) * 1000 + Math.random() * 200; // exponential + jitter
          console.warn(`Server error (${response.status}). Retrying in ${waitMs}ms...`);
          await new Promise((resolve) => setTimeout(resolve, waitMs));
          attempts++;
          continue;
        }

        if (!response.ok) {
          throw new Error(`HTTP Error: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        
        // Log raw response asynchronously to DB (D-03)
        this.logRawPayload(entityType, data).catch(err => 
          console.error("Failed to persist raw provider log:", err)
        );

        return data as T;
      } catch (error) {
        attempts++;
        if (attempts >= maxRetries) {
          throw error;
        }
      }
    }
    throw new Error("Max retry attempts reached.");
  }

  private async logRawPayload(entityType: string, rawJson: any): Promise<void> {
    await db.insert(providerLogs).values({
      provider: "TheStatsAPI",
      entityType,
      rawJsonb: rawJson,
    });
  }
}
```

---

### 5. `packages/data-providers/src/thestatsapi/client.ts`
- **Role:** Subclassed HTTP Client.
- **Data Flow:** Translates domain endpoints into physical HTTP routes.
- **Closest Analog:** `packages/data-providers/src/base-client.ts`.
- **Code Patterns:**

```typescript
// packages/data-providers/src/thestatsapi/client.ts
import { TheStatsApiClient } from "../base-client.js";

export class ConcreteTheStatsApiClient extends TheStatsApiClient {
  async getFixtures(): Promise<any> {
    return this.request("/fixtures", "fixtures");
  }

  async getTeams(): Promise<any> {
    return this.request("/teams", "teams");
  }

  async getSquad(providerTeamId: string): Promise<any> {
    return this.request(`/teams/${providerTeamId}/squad`, "squads");
  }

  async getMatchPerformance(providerMatchId: string): Promise<any> {
    return this.request(`/matches/${providerMatchId}/stats`, "match_performance");
  }
}
```

---

### 6. `packages/data-providers/src/thestatsapi/mapper.ts`
- **Role:** Declarative Normalization Utility.
- **Data Flow:** Normalizes raw objects by looking up config properties; logs warnings for missing fields.
- **Closest Analog:** *New utility patterns.*
- **Code Patterns:**

```typescript
// packages/data-providers/src/thestatsapi/mapper.ts

export const fixtureMappingConfig = {
  matchNumber: "match_no",
  providerId: "fixture_id",
  homeTeamId: "team_home.iso_code",
  awayTeamId: "team_away.iso_code",
  status: (raw: any) => {
    if (raw.status === "live") return "Live";
    if (raw.status === "finished") return "Completed";
    return "Scheduled";
  },
  stage: "tournament_stage",
  kickoffTime: (raw: any) => new Date(raw.start_time),
  venueName: "stadium.name",
  venueCity: "stadium.city",
};

// Resolver helper for nested paths ("team_home.iso_code")
function getNestedValue(obj: any, path: string): any {
  return path.split(".").reduce((acc, part) => acc && acc[part], obj);
}

export function mapRawEntity<T>(raw: any, config: Record<string, any>, entityName: string): T {
  const result: any = {};
  
  for (const [targetKey, sourceMapping] of Object.entries(config)) {
    if (typeof sourceMapping === "function") {
      try {
        result[targetKey] = sourceMapping(raw);
      } catch (err) {
        console.warn(`[Mapper Warning] Failed mapping function for ${entityName}.${targetKey}:`, err);
        result[targetKey] = null;
      }
    } else {
      const val = getNestedValue(raw, sourceMapping);
      if (val === undefined || val === null) {
        console.warn(`[Mapper Warning] Missing source field "${sourceMapping}" for ${entityName}.${targetKey}`);
        result[targetKey] = null;
      } else {
        result[targetKey] = val;
      }
    }
  }

  return result as T;
}
```

---

### 7. `packages/data-providers/src/thestatsapi/fixtures.ts`
- **Role:** Sync adapter for match fixtures.
- **Data Flow:** Fetches raw fixtures -> normalizes with mapping config -> returns `NormalizedMatch[]`.
- **Closest Analog:** `packages/data-providers/src/index.ts`.
- **Code Patterns:**

```typescript
// packages/data-providers/src/thestatsapi/fixtures.ts
import { NormalizedMatch } from "../types.js";
import { ConcreteTheStatsApiClient } from "./client.js";
import { mapRawEntity, fixtureMappingConfig } from "./mapper.js";

export class FixturesAdapter {
  constructor(private client: ConcreteTheStatsApiClient) {}

  async fetch(): Promise<NormalizedMatch[]> {
    const rawData = await this.client.getFixtures();
    if (!Array.isArray(rawData.fixtures)) {
      return [];
    }
    return rawData.fixtures.map((item: any) => 
      mapRawEntity<NormalizedMatch>(item, fixtureMappingConfig, "Match")
    );
  }
}
```

---

### 8. `packages/data-providers/src/mock/mock-provider.ts`
- **Role:** Programmatic Local Mock Provider.
- **Data Flow:** Generates in-memory factories using realistic templates, and simulated fixture timelines.
- **Closest Analog:** Existing skeleton `MockSyncProvider` in `packages/data-providers/src/index.ts`.
- **Code Patterns:**

```typescript
// packages/data-providers/src/mock/mock-provider.ts
import { SyncProvider, NormalizedMatch, NormalizedTeam, NormalizedPlayer, NormalizedMatchStats } from "../index.js";

const COUNTRY_NAME_TEMPLATES: Record<string, string[]> = {
  ARG: ["Messi", "Martinez", "Di Maria", "De Paul", "Alvarez", "Romero", "Otamendi", "Molina"],
  FRA: ["Mbappe", "Griezmann", "Dembele", "Tchouameni", "Camavinga", "Hernandez", "Saliba", "Maignan"],
  // ... rest of participating country templates
};

export class MockSyncProvider implements SyncProvider {
  private replayStep = 0;

  async fetchTeams(): Promise<NormalizedTeam[]> {
    // Generates teams based on standard baseline data
    return [
      { id: "ARG", name: "Argentina", groupName: "B", flagUrl: null, eloRating: 2100, providerId: "p-arg" },
      // ...
    ];
  }

  async fetchSquads(teamId: string): Promise<NormalizedPlayer[]> {
    const names = COUNTRY_NAME_TEMPLATES[teamId] || ["Player A", "Player B", "Player C"];
    const players: NormalizedPlayer[] = [];

    // Construct 23 players with realistic positions and influence scores based on ELO
    for (let i = 0; i < 23; i++) {
      let position: 'Goalkeeper' | 'Defender' | 'Midfielder' | 'Forward' = 'Midfielder';
      if (i < 3) position = 'Goalkeeper';
      else if (i < 11) position = 'Defender';
      else if (i < 18) position = 'Midfielder';
      else position = 'Forward';

      players.push({
        providerId: `mock-p-${teamId.toLowerCase()}-${i}`,
        name: names[i % names.length] + ` ${i + 1}`,
        position,
        teamId,
        influenceScore: Math.floor(50 + Math.random() * 45),
      });
    }

    return players;
  }

  async fetchFixtures(): Promise<NormalizedMatch[]> {
    return [
      {
        matchNumber: 1,
        providerId: "mock-m-1",
        homeTeamId: "MEX",
        awayTeamId: "USA",
        status: this.replayStep > 1 ? "Completed" : (this.replayStep === 1 ? "Live" : "Scheduled"),
        stage: "Group",
        kickoffTime: new Date("2026-06-11T17:00:00Z"),
        venueName: "Estadio Azteca",
        venueCity: "Mexico City",
      }
    ];
  }

  async fetchMatchStats(matchId: number, providerMatchId: string): Promise<NormalizedMatchStats> {
    // Return live scores vs completed stats based on this.replayStep progression
    const isCompleted = this.replayStep > 1;
    return {
      status: isCompleted ? "Completed" : "Live",
      homeScore: isCompleted ? 2 : 1,
      awayScore: isCompleted ? 1 : 0,
      teamStats: {
        home: {
          possession: 55, shots: 12, shotsOnTarget: 5, passesAttempted: 450, passesCompleted: 390,
          corners: 4, fouls: 10, yellowCards: 1, redCards: 0, offsides: 2, expectedGoals: 1.8
        },
        away: {
          possession: 45, shots: 8, shotsOnTarget: 3, passesAttempted: 380, passesCompleted: 310,
          corners: 3, fouls: 12, yellowCards: 2, redCards: 0, offsides: 1, expectedGoals: 0.9
        }
      },
      playerPerformances: [],
      events: []
    };
  }

  // Debug helper to advance mock matches for testing workflows
  advanceReplay() {
    this.replayStep++;
  }
}
```

---

### 9. `scripts/db-init.ts`
- **Role:** Database Migrations runner and Seeder.
- **Data Flow:** Validates database connectivity, deploys generated migrations, and programmatically seeds all 104 tournament match placeholders.
- **Closest Analog:** `scripts/db-init.ts` (itself).
- **Code Patterns:**

*Existing Code Excerpt:*
```typescript
// scripts/db-init.ts
      // Seed Matches/Fixtures
      console.log(`Seeding ${fixturesData.length} fixtures...`);
      for (const match of fixturesData) {
        await db.insert(matches)
          .values({
            matchNumber: match.matchNumber,
            homeTeamId: match.homeTeamId,
            awayTeamId: match.awayTeamId,
            stage: match.stage,
            kickoffTime: new Date(match.kickoffTime),
            status: "Scheduled",
          });
      }
```

*Proposed Modifications (Programmatic Group Scheduling + Knockout placeholders):*
```typescript
// Inside init():
      // 1. Programmatically schedule round-robin group fixtures (72 matches total)
      const groups = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L"];
      let matchNo = 1;
      const baseDate = new Date("2026-06-11T17:00:00Z");

      for (const groupName of groups) {
        const groupTeams = teamsData.filter((t: any) => t.groupName === groupName);
        
        // Formulate Round-Robin (4 teams -> 6 matches per group)
        // Group pairs: (0,1), (2,3), (0,2), (1,3), (0,3), (1,2)
        const pairings = [
          [0, 1], [2, 3],
          [0, 2], [1, 3],
          [0, 3], [1, 2]
        ];

        for (const [idxHome, idxAway] of pairings) {
          const home = groupTeams[idxHome];
          const away = groupTeams[idxAway];
          
          // Increment kickoff time by 3 hours per match
          const kickoff = new Date(baseDate.getTime() + (matchNo - 1) * 3 * 60 * 60 * 1000);

          await db.insert(matches)
            .values({
              matchNumber: matchNo,
              homeTeamId: home.id,
              awayTeamId: away.id,
              stage: "Group",
              kickoffTime: kickoff,
              status: "Scheduled",
            })
            .onConflictDoUpdate({
              target: matches.matchNumber,
              set: { homeTeamId: home.id, awayTeamId: away.id }
            });

          matchNo++;
        }
      }

      // 2. Seed Knockout Placeholders (32 matches total: matchNumber 73 to 104)
      const knockoutStages = [
        { count: 16, stage: "Round of 32" },
        { count: 8, stage: "Round of 16" },
        { count: 4, stage: "Quarterfinals" },
        { count: 2, stage: "Semifinals" },
        { count: 1, stage: "Third Place" },
        { count: 1, stage: "Final" }
      ];

      for (const subStage of knockoutStages) {
        for (let i = 0; i < subStage.count; i++) {
          const kickoff = new Date(baseDate.getTime() + (matchNo - 1) * 24 * 60 * 60 * 1000); // 1 day offsets
          await db.insert(matches)
            .values({
              matchNumber: matchNo,
              homeTeamId: null, // Unknown until group stages resolve
              awayTeamId: null,
              stage: subStage.stage,
              kickoffTime: kickoff,
              status: "Scheduled",
            })
            .onConflictDoUpdate({
              target: matches.matchNumber,
              set: { stage: subStage.stage }
            });

          matchNo++;
        }
      }
      console.log("✅ Seeded 104 matches successfully (72 Group, 32 Knockouts).");
```
