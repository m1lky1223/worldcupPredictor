// ────────── Teams Adapter ──────────
//
// Fetches team and squad data from TheStatsAPI and maps them
// into the normalized NormalizedTeam and NormalizedPlayer types.

import { NormalizedTeam, NormalizedPlayer } from "../types.js";
import { ConcreteTheStatsApiClient } from "./client.js";
import { teamMappingConfig, playerMappingConfig, mapRawEntity } from "./mapper.js";

/**
 * Adapter for syncing teams and squads from TheStatsAPI.
 *
 * Uses the ConcreteTheStatsApiClient to fetch raw team/squad
 * data and the declarative mapper to normalize results.
 */
export class TeamsAdapter {
  private client: ConcreteTheStatsApiClient;

  constructor(client?: ConcreteTheStatsApiClient) {
    this.client = client ?? new ConcreteTheStatsApiClient();
  }

  /**
   * Fetch all teams from TheStatsAPI and return them as
   * an array of NormalizedTeam.
   *
   * Sets a default eloRating of 1500 when the provider does
   * not supply one.
   */
  async fetch(): Promise<NormalizedTeam[]> {
    const response = await this.client.getTeams();

    if (!response.data || !Array.isArray(response.data)) {
      console.warn("[TeamsAdapter] Warning: teams response missing 'data' array. Returning empty list.");
      return [];
    }

    const teams: NormalizedTeam[] = [];

    for (const raw of response.data) {
      try {
        const mapped = mapRawEntity(raw as Record<string, unknown>, teamMappingConfig, "team") as {
          providerId: string | null;
          name: string;
          id: string;
          groupName: string;
          flagUrl: string | null;
        };

        // NormalizedTeam.eloRating needs post-processing from raw data
        const rawElo = (raw as Record<string, unknown>).elo_rating;

        teams.push({
          id: mapped.id,
          name: mapped.name,
          groupName: mapped.groupName,
          flagUrl: mapped.flagUrl,
          eloRating: typeof rawElo === "number" ? rawElo : 1500,
          providerId: mapped.providerId,
        });
      } catch (err) {
        console.warn(
          `[TeamsAdapter] Warning: failed to map team. Skipping. Error: ${err instanceof Error ? err.message : String(err)}`,
        );
      }
    }

    return teams;
  }

  /**
   * Fetch the squad (players) for a given team from TheStatsAPI
   * and return them as NormalizedPlayer[].
   *
   * @param teamId         Internal team identifier (3-letter code, e.g. "ARG")
   * @param providerTeamId TheStatsAPI team identifier for the API call
   */
  async fetchSquads(teamId: string, providerTeamId: string): Promise<NormalizedPlayer[]> {
    const response = await this.client.getSquad(providerTeamId);

    if (!response.data || !Array.isArray(response.data)) {
      console.warn(`[TeamsAdapter] Warning: squad response missing 'data' for team ${teamId}. Returning empty list.`);
      return [];
    }

    const players: NormalizedPlayer[] = [];

    for (const raw of response.data) {
      try {
        const mapped = mapRawEntity(raw as Record<string, unknown>, playerMappingConfig, "player") as {
          providerId: string;
          name: string;
          position: string;
          shirtNumber: number;
          teamId: string;
        };

        players.push({
          providerId: mapped.providerId,
          name: mapped.name,
          position: this.normalizePosition(mapped.position),
          teamId,
          influenceScore: 50, // Default — provider may not supply this
        });
      } catch (err) {
        console.warn(
          `[TeamsAdapter] Warning: failed to map player for team ${teamId}. Skipping. Error: ${err instanceof Error ? err.message : String(err)}`,
        );
      }
    }

    return players;
  }

  /**
   * Map raw position strings to the NormalizedPlayer union type.
   * Returns "Midfielder" for unrecognized positions as a safe default.
   */
  private normalizePosition(
    raw: string,
  ): "Goalkeeper" | "Defender" | "Midfielder" | "Forward" {
    const lower = raw.toLowerCase().trim();
    if (lower === "goalkeeper" || lower === "gk" || lower === "goalkeeper") {
      return "Goalkeeper";
    }
    if (lower === "defender" || lower === "def" || lower === "defence" || lower === "centre-back" || lower === "full-back") {
      return "Defender";
    }
    if (lower === "forward" || lower === "fwd" || lower === "striker" || lower === "attacker") {
      return "Forward";
    }
    // Default to Midfielder
    return "Midfielder";
  }
}
