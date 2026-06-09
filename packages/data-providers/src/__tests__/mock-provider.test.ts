import { describe, it, expect } from "vitest";
import { MockSyncProvider } from "../mock/mock-provider.js";

describe("MockSyncProvider", () => {
  const provider = new MockSyncProvider();

  describe("fetchTeams", () => {
    it("should return 48 teams", async () => {
      const teams = await provider.fetchTeams();
      expect(teams).toHaveLength(48);
    });

    it("should include Argentina, France, and Mexico", async () => {
      const teams = await provider.fetchTeams();
      const ids = teams.map((t) => t.id);
      expect(ids).toContain("ARG");
      expect(ids).toContain("FRA");
      expect(ids).toContain("MEX");
    });

    it("should assign every team to a group letter", async () => {
      const teams = await provider.fetchTeams();
      for (const team of teams) {
        expect(team.groupName).toMatch(/^[A-Z]$/);
      }
    });

    it("should assign each team a numeric eloRating", async () => {
      const teams = await provider.fetchTeams();
      for (const team of teams) {
        expect(typeof team.eloRating).toBe("number");
        expect(team.eloRating).toBeGreaterThan(1400);
      }
    });
  });

  describe("fetchSquads", () => {
    it("should return 23-26 players per team", async () => {
      const teamIds = ["ARG", "FRA", "MEX", "KSA", "JPN", "SLV"];
      for (const teamId of teamIds) {
        const squad = await provider.fetchSquads(teamId, `p-${teamId.toLowerCase()}`);
        expect(squad.length).toBeGreaterThanOrEqual(23);
        expect(squad.length).toBeLessThanOrEqual(26);
      }
    });

    it("should include exactly 3 Goalkeepers per squad", async () => {
      const squad = await provider.fetchSquads("ARG", "p-arg");
      const goalkeepers = squad.filter((p) => p.position === "Goalkeeper");
      expect(goalkeepers).toHaveLength(3);
    });

    it("should include exactly 8 Defenders per squad", async () => {
      const squad = await provider.fetchSquads("ARG", "p-arg");
      const defenders = squad.filter((p) => p.position === "Defender");
      expect(defenders).toHaveLength(8);
    });

    it("should include exactly 8 Midfielders per squad", async () => {
      const squad = await provider.fetchSquads("ARG", "p-arg");
      const midfielders = squad.filter((p) => p.position === "Midfielder");
      expect(midfielders).toHaveLength(8);
    });

    it("should include 5+ Forwards per squad", async () => {
      const squad = await provider.fetchSquads("ARG", "p-arg");
      const forwards = squad.filter((p) => p.position === "Forward");
      expect(forwards.length).toBeGreaterThanOrEqual(5);
    });

    it("should assign influence scores between 40 and 95", async () => {
      const squad = await provider.fetchSquads("ARG", "p-arg");
      for (const player of squad) {
        expect(player.influenceScore).toBeGreaterThanOrEqual(40);
        expect(player.influenceScore).toBeLessThanOrEqual(95);
      }
    });

    it("should assign each player a providerId, name, and teamId", async () => {
      const squad = await provider.fetchSquads("BRA", "p-bra");
      for (const player of squad) {
        expect(player.providerId).toBeTruthy();
        expect(player.name).toBeTruthy();
        expect(player.teamId).toBe("BRA");
      }
    });
  });

  describe("fetchFixtures", () => {
    it("should return all fixtures as Scheduled at step 0", async () => {
      const fixtures = await provider.fetchFixtures();
      expect(fixtures.every((f) => f.status === "Scheduled")).toBe(true);
    });

    it("should advance first match to Live after advanceReplay", async () => {
      const stepProvider = new MockSyncProvider();
      stepProvider.advanceReplay();
      const fixtures = await stepProvider.fetchFixtures();
      expect(fixtures[0].status).toBe("Live");
    });

    it("should mark first match Completed and second Live after 2 advances", async () => {
      const stepProvider = new MockSyncProvider();
      stepProvider.advanceReplay();
      stepProvider.advanceReplay();
      const fixtures = await stepProvider.fetchFixtures();
      expect(fixtures[0].status).toBe("Completed");
      expect(fixtures[1].status).toBe("Live");
    });
  });

  describe("fetchMatchStats", () => {
    it("should return Live status when replayStep is low", async () => {
      const stats = await provider.fetchMatchStats(1, "mock-m-1");
      expect(stats.status).toBe("Live");
    });

    it("should return Completed status after several advances", async () => {
      const stepProvider = new MockSyncProvider();
      stepProvider.advanceReplay();
      stepProvider.advanceReplay();
      stepProvider.advanceReplay();
      const stats = await stepProvider.fetchMatchStats(1, "mock-m-1");
      expect(stats.status).toBe("Completed");
      expect(stats.homeScore).toBe(2);
      expect(stats.awayScore).toBe(1);
    });

    it("should return teamStats with team stats fields", async () => {
      const stepProvider = new MockSyncProvider();
      stepProvider.advanceReplay();
      stepProvider.advanceReplay();
      stepProvider.advanceReplay();
      const stats = await stepProvider.fetchMatchStats(1, "mock-m-1");
      expect(stats.teamStats.home.possession).toBeTypeOf("number");
      expect(stats.teamStats.away.shots).toBeTypeOf("number");
      expect(stats.teamStats.home.expectedGoals).toBeTypeOf("number");
    });
  });
});
