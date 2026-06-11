import IORedis from "ioredis";
import { config } from "./config.js";

let connection: IORedis | null = null;

export function getConnection(): IORedis {
  if (!connection) {
    connection = new IORedis(config.redisUrl, {
      maxRetriesPerRequest: null,
      enableOfflineQueue: false,
    });
  }
  return connection;
}

export async function closeConnection(): Promise<void> {
  if (connection) {
    await connection.quit();
    connection = null;
  }
}
