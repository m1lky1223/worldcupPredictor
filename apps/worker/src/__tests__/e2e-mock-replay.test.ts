import { describe, it, expect, beforeAll } from "vitest";
import { eq } from "drizzle-orm";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import { db, schemas as s } from "@worldcup/domain";
import { MockSyncProvider } from "@worldcup/data-providers";
import { syncTeams } from "../jobs/sync-teams.js";
import { syncFixtures } from "../jobs/sync-fixtures.js";
import { syncSquads } from "../jobs/sync-squads.js";
import { syncMatchStatuses } from "../jobs/sync-match-statuses.js";
import { finalizeMatch } from "../jobs/finalize-match.js";
import { updateRatings } from "../jobs/update-ratings.js";
import { recalculatePredictions } from "../jobs/recalculate-predictions.js";
import { getFreshness } from "../freshness.js";

describe("E2E Mock Replay — Full Match Lifecycle", () => {
  const mockProvider = new MockSyncProvider();
  const testDb = db as unknown as NodePgDatabase;

  beforeAll(async () => {
    // Ensure teams and fixtures exist
    await syncTeams(mockProvider, {}, testDb);
    await syncFixtures(mockProvider, {}, testDb);
    await syncSquads(mockProvider, {}, testDb);
  });

  it("should have seeded teams and fixtures", async () => {
    const teams = await testDb.select().from(s.teams);
    expect(teams.length).toBeGreaterThanOrEqual(4);

    const fixtures = await testDb.select().from(s.matches);
    expect(fixtures.length).toBeGreaterThanOrEqual(6);

    const scheduledCount = fixtures.filter((f) => f.status === "Scheduled").length;
    expect(scheduledCount).toBe(fixtures.length);
  });

  it("should detect match status change to Live", async () => {
    mockProvider.advanceReplay();

    const result = await syncMatchStatuses(mockProvider, {}, testDb);
    expect(result.changed).toBeGreaterThanOrEqual(1);

    const liveMatches = await testDb
      .select()
      .from(s.matches)
      .where(eq(s.matches.status, "Live"));
    expect(liveMatches.length).toBeGreaterThanOrEqual(1);
  });

  it("should finalize match and set status to Completed", async () => {
    const liveMatches = await testDb
      .select()
      .from(s.matches)
      .where(eq(s.matches.status, "Live"))
      .limit(1);

    expect(liveMatches.length).toBe(1);
    const liveMatch = liveMatches[0];

    // Advance mock to Completed state and get scores
    mockProvider.advanceReplay();
    const stats = await mockProvider.fetchMatchStats(liveMatch.id, `mock-m-${liveMatch.matchNumber}`);

    await testDb
      .update(s.matches)
      .set({ homeScore: stats.homeScore, awayScore: stats.awayScore })
      .where(eq(s.matches.id, liveMatch.id));

    const result = await finalizeMatch({ matchId: liveMatch.id }, testDb);
    expect(result.finalized).toBe(true);

    const finalized = await testDb
      .select()
      .from(s.matches)
      .where(eq(s.matches.id, liveMatch.id))
      .limit(1)
      .then((r) => r[0]);

    expect(finalized.status).toBe("Completed");
    expect(finalized.homeScore).toBe(2);
    expect(finalized.awayScore).toBe(1);
  });

  it("should update Elo ratings after match finalization", async () => {
    const completedMatches = await testDb
      .select()
      .from(s.matches)
      .where(eq(s.matches.status, "Completed"))
      .limit(1);

    expect(completedMatches.length).toBe(1);

    const result = await updateRatings({ matchId: completedMatches[0].id }, testDb);
    expect(result.updated).toBe(true);

    const snapshots = await testDb.select().from(s.ratingsSnapshots);
    expect(snapshots.length).toBeGreaterThanOrEqual(2);
  });

  it("should recalculate predictions for upcoming matches", async () => {
    const result = await recalculatePredictions({ allScheduled: true }, testDb);
    expect(result.generated).toBeGreaterThanOrEqual(1);

    const allPredictions = await testDb.select().from(s.predictions);
    expect(allPredictions.length).toBeGreaterThanOrEqual(1);

    const snapshots = await testDb.select().from(s.predictionInputSnapshots);
    expect(snapshots.length).toBeGreaterThanOrEqual(1);
  });

  it("should track provider freshness", async () => {
    const freshness = await getFreshness(testDb);
    expect(freshness.length).toBeGreaterThanOrEqual(1);

    const teamFreshness = freshness.find((f) => f.entityType === "teams");
    expect(teamFreshness).toBeDefined();
    expect(teamFreshness!.status).toBe("success");
  });

  it("should prevent double finalization (idempotency)", async () => {
    const completedMatches = await testDb
      .select()
      .from(s.matches)
      .where(eq(s.matches.status, "Completed"))
      .limit(1);

    expect(completedMatches.length).toBe(1);

    const result = await finalizeMatch({ matchId: completedMatches[0].id }, testDb);
    expect(result.finalized).toBe(false);
  });
});
