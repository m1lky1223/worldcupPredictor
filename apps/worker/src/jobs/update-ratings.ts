import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import { db as defaultDb } from "@worldcup/domain";
import { RatingService } from "@worldcup/prediction-engine";

export async function updateRatings(
  payload: { matchId: number },
  db: NodePgDatabase = defaultDb as any,
): Promise<{ updated: boolean }> {
  const ratingService = new RatingService(db);
  const result = await ratingService.updateRatingsAfterMatch(payload.matchId);

  if (!result) {
    return { updated: false };
  }

  return { updated: true };
}
