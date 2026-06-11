import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import { db as defaultDb } from "@worldcup/domain";
import { ModelMetricsService } from "@worldcup/prediction-engine";

export async function calculateMetrics(
  _payload: { force?: boolean },
  db: NodePgDatabase = defaultDb as any,
): Promise<{ accuracy: number; brierScore: number; logLoss: number }> {
  const metricsService = new ModelMetricsService(db);
  const result = await metricsService.calculateMetrics();

  return {
    accuracy: result.accuracy,
    brierScore: result.brierScore,
    logLoss: result.logLoss,
  };
}
