import { Worker } from "bullmq";
import IORedis from "ioredis";

// BullMQ connection requires maxRetriesPerRequest to be null when sharing connections
const connection = new IORedis(process.env.REDIS_URL || "redis://localhost:6379", {
  maxRetriesPerRequest: null,
});

export const worker = new Worker(
  "worldcup-jobs",
  async (job) => {
    console.log(`Processing job ${job.id} of type ${job.name}`);
  },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  { connection: connection as any }
);

console.log(`🚀 BullMQ Background Worker started: ${worker.name}`);

