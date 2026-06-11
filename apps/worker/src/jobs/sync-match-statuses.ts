import { inArray, eq, and, lte } from "drizzle-orm";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import { schemas as s, db as defaultDb } from "@worldcup/domain";
import type { SyncProvider } from "@worldcup/data-providers";
import { JobType, jobQueue, getJobOptions } from "../queue.js";

export async function syncMatchStatuses(
  provider: SyncProvider,
  payload: { matchIds?: number[] },
  db: NodePgDatabase = defaultDb as any,
): Promise<{ checked: number; changed: number }> {
  let matchesToCheck: typeof s.matches.$inferSelect[];

  if (payload.matchIds && payload.matchIds.length > 0) {
    matchesToCheck = await db
      .select()
      .from(s.matches)
      .where(inArray(s.matches.id, payload.matchIds));
  } else {
    const now = new Date();
    matchesToCheck = await db
      .select()
      .from(s.matches)
      .where(
        and(
          eq(s.matches.status, "Scheduled"),
          lte(s.matches.kickoffTime, new Date(now.getTime() + 3 * 60 * 60 * 1000)),
        ),
      );
  }

  let changed = 0;

  for (const match of matchesToCheck) {
    const fixtures = await provider.fetchFixtures();
    const updatedFixture = fixtures.find((f) => f.matchNumber === match.matchNumber);
    if (!updatedFixture) continue;

    if (updatedFixture.status !== match.status) {
      await db
        .update(s.matches)
        .set({ status: updatedFixture.status })
        .where(eq(s.matches.id, match.id));

      changed++;

      if (updatedFixture.status === "Live") {
        await jobQueue.add(
          JobType.SyncLiveMatch,
          { matchId: match.id },
          getJobOptions(JobType.SyncLiveMatch),
        );
      }

      if (updatedFixture.status === "Completed") {
        await jobQueue.add(
          JobType.FinalizeMatch,
          { matchId: match.id },
          getJobOptions(JobType.FinalizeMatch),
        );
      }
    }
  }

  return { checked: matchesToCheck.length, changed };
}
