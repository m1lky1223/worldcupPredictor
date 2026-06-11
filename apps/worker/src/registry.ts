import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import { db as defaultDb } from "@worldcup/domain";
import type { SyncProvider } from "@worldcup/data-providers";
import { JobType } from "./queue.js";
import { syncTeams } from "./jobs/sync-teams.js";
import { syncFixtures } from "./jobs/sync-fixtures.js";
import { syncSquads } from "./jobs/sync-squads.js";
import { syncMatchStatuses } from "./jobs/sync-match-statuses.js";
import { syncLiveMatch } from "./jobs/sync-live-match.js";
import { finalizeMatch } from "./jobs/finalize-match.js";
import { updateRatings } from "./jobs/update-ratings.js";
import { recalculatePredictions } from "./jobs/recalculate-predictions.js";
import { calculateMetrics } from "./jobs/calculate-metrics.js";
import { syncOdds } from "./jobs/sync-odds.js";
import { trackFreshness } from "./freshness.js";

export type JobHandler = (payload: any) => Promise<any>;

export function buildRegistry(
  provider: SyncProvider,
  db: NodePgDatabase = defaultDb as any,
): Map<JobType, JobHandler> {
  const registry = new Map<JobType, JobHandler>();

  registry.set(JobType.SyncTeams, async (payload) => {
    const result = await syncTeams(provider, payload, db);
    await trackFreshness("data-provider", "teams", "success");
    return result;
  });

  registry.set(JobType.SyncFixtures, async (payload) => {
    const result = await syncFixtures(provider, payload, db);
    await trackFreshness("data-provider", "fixtures", "success");
    return result;
  });

  registry.set(JobType.SyncSquads, async (payload) => {
    const result = await syncSquads(provider, payload, db);
    await trackFreshness("data-provider", "squads", "success");
    return result;
  });

  registry.set(JobType.SyncMatchStatuses, async (payload) => {
    const result = await syncMatchStatuses(provider, payload, db);
    if (result.changed > 0) {
      await trackFreshness("data-provider", "match-statuses", "success");
    }
    return result;
  });

  registry.set(JobType.SyncLiveMatch, async (payload) => {
    const result = await syncLiveMatch(provider, payload, db);
    if (result.updated) {
      await trackFreshness("data-provider", "live-match", "success");
    }
    return result;
  });

  registry.set(JobType.FinalizeMatch, async (payload) => {
    const result = await finalizeMatch(payload, db);
    if (result.finalized) {
      await trackFreshness("worker", "finalize-match", "success");
    }
    return result;
  });

  registry.set(JobType.UpdateRatings, async (payload) => {
    const result = await updateRatings(payload, db);
    if (result.updated) {
      await trackFreshness("worker", "update-ratings", "success");
    }
    return result;
  });

  registry.set(JobType.RecalculatePredictions, async (payload) => {
    const result = await recalculatePredictions(payload, db);
    if (result.generated > 0) {
      await trackFreshness("worker", "predictions", "success");
    }
    return result;
  });

  registry.set(JobType.CalculateMetrics, async (payload) => {
    const result = await calculateMetrics(payload, db);
    await trackFreshness("worker", "metrics", "success");
    return result;
  });

  registry.set(JobType.SyncOdds, async (payload) => {
    const result = await syncOdds(payload, db);
    if (result.synced > 0) {
      await trackFreshness("odds-api", "odds", "success");
    }
    return result;
  });

  return registry;
}
