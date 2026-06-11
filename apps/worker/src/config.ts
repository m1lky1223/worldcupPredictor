export const config = {
  redisUrl: process.env.REDIS_URL || "redis://localhost:6379",
  databaseUrl: process.env.DATABASE_URL || "postgres://postgres:password@localhost:5432/worldcup",
  providerMode: (process.env.PROVIDER_MODE || "mock") as "mock" | "real" | "hybrid",
  pollingIntervalMs: parseInt(process.env.POLLING_INTERVAL_MS || "60000", 10),
  livePollingIntervalMs: parseInt(process.env.LIVE_POLLING_INTERVAL_MS || "30000", 10),
  maxSyncRetries: parseInt(process.env.MAX_SYNC_RETRIES || "3", 10),
  metricsIntervalMs: parseInt(process.env.METRICS_INTERVAL_MS || "300000", 10),
};
