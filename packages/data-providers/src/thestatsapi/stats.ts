// ────────── Match Stats Adapter ──────────
//
// Fetches match performance data from TheStatsAPI (team stats,
// player performances, match events) and maps into the
// NormalizedMatchStats domain type.

import {
  NormalizedMatchStats,
  NormalizedTeamStats,
  NormalizedPlayerPerformance,
  NormalizedMatchEvent,
} from "../types.js";
import { ConcreteTheStatsApiClient } from "./client.js";

/**
 * Adapter for syncing match performance data from TheStatsAPI.
 *
 * Fetches the raw match performance payload and transforms it
 * into a fully-typed NormalizedMatchStats structure that
 * includes team-level stats, individual player performances,
 * and match events (goals, cards, substitutions).
 */
export class StatsAdapter {
  private client: ConcreteTheStatsApiClient;

  constructor(client?: ConcreteTheStatsApiClient) {
    this.client = client ?? new ConcreteTheStatsApiClient();
  }

  /**
   * Fetch match performance data for a specific match.
   *
   * @param matchId         Internal match identifier
   * @param providerMatchId TheStatsAPI match identifier for the API call
   */
  async fetchMatchStats(matchId: number, providerMatchId: string): Promise<NormalizedMatchStats> {
    const response = await this.client.getMatchPerformance(providerMatchId);

    if (!response.data || !Array.isArray(response.data)) {
      console.warn(
        `[StatsAdapter] Warning: match stats response missing 'data' for match ${matchId}. Returning empty stats.`,
      );
      return this.emptyStats();
    }

    // TheStatsAPI returns match stats as an array; we use the first entry
    const raw = response.data[0] as Record<string, unknown> | undefined;
    if (!raw) {
      console.warn(
        `[StatsAdapter] Warning: no match stats data for match ${matchId}. Returning empty stats.`,
      );
      return this.emptyStats();
    }

    return {
      status: this.normalizeStatus(raw.status as string | undefined),
      homeScore: this.safeNumber(raw.home_score),
      awayScore: this.safeNumber(raw.away_score),
      teamStats: {
        home: this.mapTeamStats(raw.home_team_stats as Record<string, unknown> | undefined),
        away: this.mapTeamStats(raw.away_team_stats as Record<string, unknown> | undefined),
      },
      playerPerformances: this.mapPlayerPerformances(
        raw.player_performances as Array<Record<string, unknown>> | undefined,
      ),
      events: this.mapEvents(raw.events as Array<Record<string, unknown>> | undefined),
    };
  }

  /**
   * Normalize the raw status string to the expected union.
   */
  private normalizeStatus(raw: string | undefined): "Live" | "Completed" {
    if (!raw) return "Completed";
    const normalized = raw.toLowerCase();
    if (normalized === "live" || normalized === "in_play" || normalized === "inprogress") {
      return "Live";
    }
    return "Completed";
  }

  /**
   * Safely convert a raw value to a number or null.
   */
  private safeNumber(value: unknown): number | null {
    if (value === null || value === undefined) return null;
    if (typeof value === "number") return isNaN(value) ? null : value;
    if (typeof value === "string") {
      const parsed = Number(value);
      return isNaN(parsed) ? null : parsed;
    }
    return null;
  }

  /**
   * Safely convert a raw value to a number with a default.
   */
  private safeNumberDefault(value: unknown, defaultVal: number): number {
    const parsed = this.safeNumber(value);
    return parsed !== null ? parsed : defaultVal;
  }

  /**
   * Map raw team stats into NormalizedTeamStats.
   */
  private mapTeamStats(raw: Record<string, unknown> | undefined): NormalizedTeamStats {
    if (!raw) {
      return this.emptyTeamStats();
    }

    return {
      possession: this.safeNumber(raw.possession),
      shots: this.safeNumber(raw.shots),
      shotsOnTarget: this.safeNumber(raw.shots_on_target),
      passesAttempted: this.safeNumber(raw.passes_attempted),
      passesCompleted: this.safeNumber(raw.passes_completed),
      corners: this.safeNumber(raw.corners),
      fouls: this.safeNumber(raw.fouls),
      yellowCards: this.safeNumberDefault(raw.yellow_cards, 0),
      redCards: this.safeNumberDefault(raw.red_cards, 0),
      offsides: this.safeNumber(raw.offsides),
      expectedGoals: this.safeNumber(raw.expected_goals),
    };
  }

  /**
   * Map raw player performances into NormalizedPlayerPerformance[].
   */
  private mapPlayerPerformances(
    raw: Array<Record<string, unknown>> | undefined,
  ): NormalizedPlayerPerformance[] {
    if (!raw || !Array.isArray(raw)) return [];

    return raw.map((p) => ({
      playerProviderId: String(p.player_id ?? ""),
      playerName: String(p.player_name ?? ""),
      rating: this.safeNumberDefault(p.rating, 0),
      minutesPlayed: this.safeNumberDefault(p.minutes_played, 0),
      goals: this.safeNumberDefault(p.goals, 0),
      assists: this.safeNumberDefault(p.assists, 0),
      yellowCards: this.safeNumberDefault(p.yellow_cards, 0),
      redCards: this.safeNumberDefault(p.red_cards, 0),
      shots: this.safeNumber(p.shots),
      shotsOnTarget: this.safeNumber(p.shots_on_target),
      passesAttempted: this.safeNumber(p.passes_attempted),
      passesCompleted: this.safeNumber(p.passes_completed),
      tackles: this.safeNumber(p.tackles),
      interceptions: this.safeNumber(p.interceptions),
      saves: this.safeNumber(p.saves),
      goalsConceded: this.safeNumber(p.goals_conceded),
      cleanSheet: this.safeNumber(p.clean_sheet),
    }));
  }

  /**
   * Map raw match events into NormalizedMatchEvent[].
   */
  private mapEvents(raw: Array<Record<string, unknown>> | undefined): NormalizedMatchEvent[] {
    if (!raw || !Array.isArray(raw)) return [];

    return raw.map((e) => {
      const rawType = String(e.event_type ?? "").toLowerCase();
      return {
        playerProviderId: e.player_id ? String(e.player_id) : null,
        teamId: String(e.team_id ?? ""),
        eventType: this.normalizeEventType(rawType),
        minute: this.safeNumberDefault(e.minute, 0),
        extraTimeMinute: this.safeNumber(e.extra_time_minute),
        detail: e.detail ? String(e.detail) : null,
      };
    });
  }

  /**
   * Map raw event type to the Expected union.
   */
  private normalizeEventType(
    raw: string,
  ): "Goal" | "YellowCard" | "RedCard" | "Substitution" {
    if (raw === "goal" || raw === "goals") return "Goal";
    if (raw === "yellow_card" || raw === "yellowcard") return "YellowCard";
    if (raw === "red_card" || raw === "redcard") return "RedCard";
    if (raw === "substitution" || raw === "sub") return "Substitution";
    return "Goal";
  }

  private emptyTeamStats(): NormalizedTeamStats {
    return {
      possession: null,
      shots: null,
      shotsOnTarget: null,
      passesAttempted: null,
      passesCompleted: null,
      corners: null,
      fouls: null,
      yellowCards: 0,
      redCards: 0,
      offsides: null,
      expectedGoals: null,
    };
  }

  private emptyStats(): NormalizedMatchStats {
    return {
      status: "Completed",
      homeScore: null,
      awayScore: null,
      teamStats: {
        home: this.emptyTeamStats(),
        away: this.emptyTeamStats(),
      },
      playerPerformances: [],
      events: [],
    };
  }
}
