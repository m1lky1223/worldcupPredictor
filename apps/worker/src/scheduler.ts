import { config } from "./config.js";
import { JobType, jobQueue, getJobOptions } from "./queue.js";

interface ScheduledJob {
  type: JobType;
  intervalMs: number;
  payload: any;
  runImmediately: boolean;
}

const scheduledJobs: ScheduledJob[] = [
  {
    type: JobType.SyncTeams,
    intervalMs: Math.max(config.pollingIntervalMs, 300000),
    payload: {},
    runImmediately: true,
  },
  {
    type: JobType.SyncFixtures,
    intervalMs: Math.max(config.pollingIntervalMs, 120000),
    payload: {},
    runImmediately: true,
  },
  {
    type: JobType.SyncMatchStatuses,
    intervalMs: config.pollingIntervalMs,
    payload: {},
    runImmediately: true,
  },
  {
    type: JobType.CalculateMetrics,
    intervalMs: config.metricsIntervalMs,
    payload: {},
    runImmediately: false,
  },
  {
    type: JobType.SyncSquads,
    intervalMs: Math.max(config.pollingIntervalMs, 600000),
    payload: {},
    runImmediately: true,
  },
  {
    type: JobType.SyncOdds,
    intervalMs: Math.max(config.pollingIntervalMs, 300000),
    payload: {},
    runImmediately: true,
  },
];


const activeTimers: ReturnType<typeof setInterval>[] = [];

export function startScheduler(): void {
  for (const job of scheduledJobs) {
    const schedule = () => {
      jobQueue
        .add(job.type, job.payload, getJobOptions(job.type))
        .catch((err) => console.error(`[Scheduler] Failed to add ${job.type}:`, err));
    };

    if (job.runImmediately) {
      schedule();
    }

    const timer = setInterval(schedule, job.intervalMs);
    activeTimers.push(timer);

    console.log(
      `[Scheduler] Registered ${job.type} every ${job.intervalMs}ms (runImmediately: ${job.runImmediately})`,
    );
  }

  console.log(`[Scheduler] Started with ${scheduledJobs.length} jobs`);
}

export function stopScheduler(): void {
  for (const timer of activeTimers) {
    clearInterval(timer);
  }
  activeTimers.length = 0;
  console.log("[Scheduler] Stopped");
}
