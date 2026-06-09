import { NormalizedMatch, NormalizedTeam, NormalizedPlayer, NormalizedMatchStats } from "./types.js";

// Re-export all public types, clients, and providers
export * from "./types.js";
export * from "./base-client.js";
export * from "./mock/mock-provider.js";
export * from "./thestatsapi/client.js";
export * from "./thestatsapi/mapper.js";
export * from "./thestatsapi/fixtures.js";
export * from "./thestatsapi/teams.js";
export * from "./thestatsapi/stats.js";

// ────────── SyncProvider Interface ──────────

export interface SyncProvider {
  fetchFixtures(): Promise<NormalizedMatch[]>;
  fetchTeams(): Promise<NormalizedTeam[]>;
  fetchSquads(teamId: string, providerTeamId: string): Promise<NormalizedPlayer[]>;
  fetchMatchStats(matchId: number, providerMatchId: string): Promise<NormalizedMatchStats>;
}
