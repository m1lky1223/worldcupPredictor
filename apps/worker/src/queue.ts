import { Queue, Worker, JobsOptions } from "bullmq";
import { getConnection } from "./connection.js";

export enum JobType {
  SyncFixtures = "sync-fixtures",
  SyncTeams = "sync-teams",
  SyncSquads = "sync-squads",
  SyncMatchStatuses = "sync-match-statuses",
  SyncLiveMatch = "sync-live-match",
  FinalizeMatch = "finalize-match",
  UpdateRatings = "update-ratings",
  RecalculatePredictions = "recalculate-predictions",
  CalculateMetrics = "calculate-metrics",
  SyncOdds = "sync-odds",
}

export interface SyncFixturesPayload {
  force?: boolean;
}

export interface SyncTeamsPayload {
  force?: boolean;
}

export interface SyncSquadsPayload {
  teamId?: string;
  force?: boolean;
}

export interface SyncMatchStatusesPayload {
  matchIds?: number[];
}

export interface SyncLiveMatchPayload {
  matchId: number;
}

export interface FinalizeMatchPayload {
  matchId: number;
}

export interface UpdateRatingsPayload {
  matchId: number;
}

export interface RecalculatePredictionsPayload {
  matchIds?: number[];
  allScheduled?: boolean;
}

export interface CalculateMetricsPayload {
  force?: boolean;
}

export interface SyncOddsPayload {
  force?: boolean;
}

export type JobPayloads = {
  [JobType.SyncFixtures]: SyncFixturesPayload;
  [JobType.SyncTeams]: SyncTeamsPayload;
  [JobType.SyncSquads]: SyncSquadsPayload;
  [JobType.SyncMatchStatuses]: SyncMatchStatusesPayload;
  [JobType.SyncLiveMatch]: SyncLiveMatchPayload;
  [JobType.FinalizeMatch]: FinalizeMatchPayload;
  [JobType.UpdateRatings]: UpdateRatingsPayload;
  [JobType.RecalculatePredictions]: RecalculatePredictionsPayload;
  [JobType.CalculateMetrics]: CalculateMetricsPayload;
  [JobType.SyncOdds]: SyncOddsPayload;
};

export const QUEUE_NAME = "worldcup-jobs";

const connection = getConnection();

export const jobQueue = new Queue(QUEUE_NAME, { connection: connection as any });

export function createWorker(handler: (jobType: JobType, payload: any) => Promise<void>): Worker {
  return new Worker(
    QUEUE_NAME,
    async (job) => {
      const jobType = job.name as JobType;
      await handler(jobType, job.data);
    },
    { connection: connection as any },
  );
}

export const defaultJobOptions: JobsOptions = {
  attempts: 3,
  backoff: { type: "exponential", delay: 5000 },
  removeOnComplete: { age: 3600 * 24 },
  removeOnFail: { age: 3600 * 24 * 7 },
};

export function getJobOptions(type: JobType): JobsOptions {
  switch (type) {
    case JobType.FinalizeMatch:
      return { ...defaultJobOptions, attempts: 5, backoff: { type: "exponential", delay: 2000 } };
    case JobType.SyncMatchStatuses:
    case JobType.SyncLiveMatch:
      return { ...defaultJobOptions, attempts: 2 };
    default:
      return defaultJobOptions;
  }
}
