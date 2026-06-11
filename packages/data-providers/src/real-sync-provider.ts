import type { NormalizedMatch, NormalizedTeam, NormalizedPlayer, NormalizedMatchStats } from "./types.js";

export interface SyncProvider {
  fetchFixtures(): Promise<NormalizedMatch[]>;
  fetchTeams(): Promise<NormalizedTeam[]>;
  fetchSquads(teamId: string, providerTeamId: string): Promise<NormalizedPlayer[]>;
  fetchMatchStats(matchId: number, providerMatchId: string): Promise<NormalizedMatchStats>;
}
import { FixturesAdapter } from "./thestatsapi/fixtures.js";
import { TeamsAdapter } from "./thestatsapi/teams.js";
import { StatsAdapter } from "./thestatsapi/stats.js";
import { ConcreteTheStatsApiClient } from "./thestatsapi/client.js";

export class RealSyncProvider implements SyncProvider {
  private fixtures: FixturesAdapter;
  private teams: TeamsAdapter;
  private stats: StatsAdapter;

  constructor(client?: ConcreteTheStatsApiClient) {
    this.fixtures = new FixturesAdapter(client);
    this.teams = new TeamsAdapter(client);
    this.stats = new StatsAdapter(client);
  }

  async fetchFixtures(): Promise<NormalizedMatch[]> {
    return this.fixtures.fetch();
  }

  async fetchTeams(): Promise<NormalizedTeam[]> {
    return this.teams.fetch();
  }

  async fetchSquads(teamId: string, providerTeamId: string): Promise<NormalizedPlayer[]> {
    return this.teams.fetchSquads(teamId, providerTeamId);
  }

  async fetchMatchStats(matchId: number, providerMatchId: string): Promise<NormalizedMatchStats> {
    return this.stats.fetchMatchStats(matchId, providerMatchId);
  }
}
