import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import { db as defaultDb } from "@worldcup/domain";
import { PredictionGenerator } from "@worldcup/prediction-engine";

export async function recalculatePredictions(
  payload: { matchIds?: number[]; allScheduled?: boolean },
  db: NodePgDatabase = defaultDb as any,
): Promise<{ generated: number }> {
  const generator = new PredictionGenerator(db);

  if (payload.allScheduled) {
    const results = await generator.generateAllPredictions();
    return { generated: results.length };
  }

  if (payload.matchIds && payload.matchIds.length > 0) {
    let count = 0;
    for (const matchId of payload.matchIds) {
      const result = await generator.generatePrediction(matchId);
      if (result) count++;
    }
    return { generated: count };
  }

  return { generated: 0 };
}
