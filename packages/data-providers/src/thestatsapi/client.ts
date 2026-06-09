// ────────── TheStatsAPI Concrete Client ──────────
//
// Extends the shared TheStatsApiClient base class with
// endpoint-specific methods for fixtures, teams, squads,
// and match performance data.

import { TheStatsApiClient } from "../base-client.js";

/**
 * Generic response wrapper expected from TheStatsAPI.
 * Most endpoints return paginated data under a "data" key.
 */
export interface TheStatsApiResponse<T> {
  data: T[];
  pagination?: {
    total: number;
    page: number;
    perPage: number;
  };
}

/**
 * Concrete client for TheStatsAPI.
 *
 * Each method routes to a specific provider endpoint and
 * delegates authentication, rate-limiting, retries, and
 * raw-payload logging to the parent `request()` method.
 */
export class ConcreteTheStatsApiClient extends TheStatsApiClient {
  /**
   * Fetch all fixtures (matches) from TheStatsAPI.
   * Routes to GET /fixtures and logs under entity type "fixtures".
   */
  async getFixtures(): Promise<TheStatsApiResponse<Record<string, unknown>>> {
    return this.request<TheStatsApiResponse<Record<string, unknown>>>("/fixtures", "fixtures");
  }

  /**
   * Fetch all teams from TheStatsAPI.
   * Routes to GET /teams and logs under entity type "teams".
   */
  async getTeams(): Promise<TheStatsApiResponse<Record<string, unknown>>> {
    return this.request<TheStatsApiResponse<Record<string, unknown>>>("/teams", "teams");
  }

  /**
   * Fetch the squad (players) for a given provider team ID.
   * Routes to GET /teams/{providerTeamId}/squad and logs under entity type "squads".
   *
   * @param providerTeamId - The provider's team identifier
   */
  async getSquad(providerTeamId: string): Promise<TheStatsApiResponse<Record<string, unknown>>> {
    return this.request<TheStatsApiResponse<Record<string, unknown>>>(
      `/teams/${encodeURIComponent(providerTeamId)}/squad`,
      "squads",
    );
  }

  /**
   * Fetch match performance stats for a given provider match ID.
   * Routes to GET /matches/{providerMatchId}/stats and logs under entity type "match_performance".
   *
   * @param providerMatchId - The provider's match identifier
   */
  async getMatchPerformance(providerMatchId: string): Promise<TheStatsApiResponse<Record<string, unknown>>> {
    return this.request<TheStatsApiResponse<Record<string, unknown>>>(
      `/matches/${encodeURIComponent(providerMatchId)}/stats`,
      "match_performance",
    );
  }
}
