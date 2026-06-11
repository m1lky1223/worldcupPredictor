import { db as defaultDb } from "@worldcup/domain";
import { sql } from "drizzle-orm";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";

const FRESHNESS_TABLE = "provider_freshness";
const FRESHNESS_TABLE_DDL = sql`
  CREATE TABLE IF NOT EXISTS ${sql.identifier(FRESHNESS_TABLE)} (
    provider VARCHAR(100) NOT NULL,
    entity_type VARCHAR(100) NOT NULL,
    last_synced_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    status VARCHAR(20) NOT NULL DEFAULT 'success',
    PRIMARY KEY (provider, entity_type)
  )
`;

let tableEnsured = false;

async function ensureTable(db: NodePgDatabase): Promise<void> {
  if (tableEnsured) return;
  await db.execute(FRESHNESS_TABLE_DDL);
  tableEnsured = true;
}

export async function trackFreshness(
  provider: string,
  entityType: string,
  status: "success" | "error",
  db: NodePgDatabase = defaultDb as any,
): Promise<void> {
  await ensureTable(db);

  await db.execute(
    sql`
      INSERT INTO ${sql.identifier(FRESHNESS_TABLE)} (provider, entity_type, last_synced_at, status)
      VALUES (${provider}, ${entityType}, NOW(), ${status})
      ON CONFLICT (provider, entity_type)
      DO UPDATE SET last_synced_at = NOW(), status = ${status}
    `,
  );
}

export interface FreshnessEntry {
  provider: string;
  entityType: string;
  lastSyncedAt: Date;
  status: string;
}

export async function getFreshness(
  db: NodePgDatabase = defaultDb as any,
): Promise<FreshnessEntry[]> {
  await ensureTable(db);

  const rows = await db.execute<{
    provider: string;
    entity_type: string;
    last_synced_at: Date;
    status: string;
  }>(
    sql`
      SELECT provider, entity_type, last_synced_at, status
      FROM ${sql.identifier(FRESHNESS_TABLE)}
      ORDER BY provider, entity_type
    `,
  );

  return rows.rows.map((r) => ({
    provider: r.provider,
    entityType: r.entity_type,
    lastSyncedAt: r.last_synced_at,
    status: r.status,
  }));
}
