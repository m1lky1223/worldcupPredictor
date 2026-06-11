import { eq } from "drizzle-orm";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import { schemas as s, db as defaultDb } from "@worldcup/domain";
import { JobType, jobQueue, getJobOptions } from "../queue.js";

const FINALIZE_LOCK_PREFIX = "finalize-lock:";
const LOCK_TTL_MS = 30000;

export async function finalizeMatch(
  payload: { matchId: number },
  db: NodePgDatabase = defaultDb as any,
): Promise<{ finalized: boolean; matchNumber?: number }> {
  const lockKey = `${FINALIZE_LOCK_PREFIX}${payload.matchId}`;
  const redis = (db as any).session?.client;

  if (redis) {
    const lockAcquired = await redis.set(lockKey, "1", "PX", LOCK_TTL_MS, "NX");
    if (!lockAcquired) {
      return { finalized: false };
    }
  }

  try {
    const [match] = await db
      .select()
      .from(s.matches)
      .where(eq(s.matches.id, payload.matchId))
      .limit(1);

    if (!match) throw new Error(`Match not found: ${payload.matchId}`);
    if (match.status !== "Live" && match.status !== "Scheduled") {
      return { finalized: false, matchNumber: match.matchNumber };
    }

    if (match.homeScore === null || match.awayScore === null) {
      throw new Error(`Cannot finalize match ${match.matchNumber}: missing scores`);
    }

    await db
      .update(s.matches)
      .set({ status: "Completed" })
      .where(eq(s.matches.id, match.id));

    await jobQueue.add(
      JobType.UpdateRatings,
      { matchId: match.id },
      { ...getJobOptions(JobType.UpdateRatings), delay: 1000 },
    );

    await jobQueue.add(
      JobType.RecalculatePredictions,
      { allScheduled: true },
      { ...getJobOptions(JobType.RecalculatePredictions), delay: 5000 },
    );

    return { finalized: true, matchNumber: match.matchNumber };
  } finally {
    if (redis) {
      await redis.del(lockKey).catch(() => {});
    }
  }
}
