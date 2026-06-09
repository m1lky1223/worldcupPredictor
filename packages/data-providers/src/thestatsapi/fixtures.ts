// ────────── Fixtures Adapter ──────────
//
// Fetches fixture (match) data from TheStatsAPI and maps it
// into the normalized NormalizedMatch domain type.

import { NormalizedMatch } from "../types.js";
import { ConcreteTheStatsApiClient } from "./client.js";
import { fixtureMappingConfig, mapRawEntity } from "./mapper.js";

/**
 * Adapter for syncing fixtures (matches) from TheStatsAPI.
 *
 * Uses the ConcreteTheStatsApiClient to fetch raw fixture data
 * and the declarative mapper to normalize it into domain types.
 */
export class FixturesAdapter {
  private client: ConcreteTheStatsApiClient;

  constructor(client?: ConcreteTheStatsApiClient) {
    this.client = client ?? new ConcreteTheStatsApiClient();
  }

  /**
   * Fetch all fixtures from TheStatsAPI and return them as
   * an array of NormalizedMatch.
   */
  async fetch(): Promise<NormalizedMatch[]> {
    const response = await this.client.getFixtures();

    if (!response.data || !Array.isArray(response.data)) {
      console.warn("[FixturesAdapter] Warning: fixtures response missing 'data' array. Returning empty list.");
      return [];
    }

    const fixtures: NormalizedMatch[] = [];

    for (const raw of response.data) {
      try {
        const mapped = mapRawEntity(raw as Record<string, unknown>, fixtureMappingConfig, "fixture") as {
          providerId: string | null;
          matchNumber: number;
          kickoffTime: Date;
          status: string;
          stage: string;
          homeTeamId: string | null;
          awayTeamId: string | null;
          homeTeamName: string | null;
          awayTeamName: string | null;
          venueName: string | null;
          venueCity: string | null;
        };

        fixtures.push({
          matchNumber: mapped.matchNumber,
          providerId: mapped.providerId,
          homeTeamId: mapped.homeTeamId,
          awayTeamId: mapped.awayTeamId,
          status: this.normalizeStatus(mapped.status),
          stage: mapped.stage,
          kickoffTime: mapped.kickoffTime,
          venueName: mapped.venueName,
          venueCity: mapped.venueCity,
        });
      } catch (err) {
        console.warn(
          `[FixturesAdapter] Warning: failed to map fixture. Skipping. Error: ${err instanceof Error ? err.message : String(err)}`,
        );
      }
    }

    return fixtures;
  }

  /**
   * Normalize a raw status string to the expected union type.
   * Falls back to "Scheduled" for unknown values.
   */
  private normalizeStatus(raw: string): NormalizedMatch["status"] {
    const normalized = raw.toLowerCase();
    if (normalized === "live" || normalized === "in_play") {
      return "Live";
    }
    if (normalized === "completed" || normalized === "finished") {
      return "Completed";
    }
    return "Scheduled";
  }
}
