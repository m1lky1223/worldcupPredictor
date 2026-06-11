import { createWorker } from "./queue.js";
import { buildRegistry } from "./registry.js";
import { startScheduler, stopScheduler } from "./scheduler.js";
import { config } from "./config.js";

let provider: import("@worldcup/data-providers").SyncProvider;

async function getProvider(): Promise<import("@worldcup/data-providers").SyncProvider> {
  if (provider) return provider;

  switch (config.providerMode) {
    case "real":
    case "hybrid": {
      const { RealSyncProvider } = await import("@worldcup/data-providers");
      provider = new RealSyncProvider();
      break;
    }
    case "mock":
    default: {
      const { MockSyncProvider } = await import("@worldcup/data-providers");
      provider = new MockSyncProvider();
      break;
    }
  }

  return provider;
}

async function main(): Promise<void> {
  const syncProvider = await getProvider();
  const registry = buildRegistry(syncProvider);

  const worker = createWorker(async (jobType, payload) => {
    const handler = registry.get(jobType);
    if (!handler) {
      console.warn(`[Worker] Unknown job type: ${jobType}`);
      return;
    }

    const startTime = Date.now();
    try {
      const result = await handler(payload);
      const elapsed = Date.now() - startTime;
      console.log(`[Worker] ${jobType} completed in ${elapsed}ms`, result);
    } catch (error) {
      const elapsed = Date.now() - startTime;
      console.error(`[Worker] ${jobType} failed after ${elapsed}ms:`, error);
      throw error;
    }
  });

  worker.on("completed", (job) => {
    console.log(`[Worker] Job ${job.id} (${job.name}) completed successfully`);
  });

  worker.on("failed", (job, err) => {
    console.error(`[Worker] Job ${job?.id} (${job?.name}) failed:`, err.message);
  });

  startScheduler();

  console.log(`Worker started. Provider mode: ${config.providerMode}`);
  console.log(`Polling interval: ${config.pollingIntervalMs}ms`);
}

process.on("SIGTERM", async () => {
  console.log("SIGTERM received, shutting down...");
  stopScheduler();
  const { closeConnection } = await import("./connection.js");
  await closeConnection();
  process.exit(0);
});

process.on("SIGINT", async () => {
  console.log("SIGINT received, shutting down...");
  stopScheduler();
  const { closeConnection } = await import("./connection.js");
  await closeConnection();
  process.exit(0);
});

main().catch((err) => {
  console.error("Fatal error starting worker:", err);
  process.exit(1);
});
