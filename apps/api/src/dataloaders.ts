import DataLoader from "dataloader";
import { db, schemas } from "@worldcup/domain";
import { inArray } from "drizzle-orm";

/**
 * Creates DataLoader instances for entity lookups.
 *
 * Each loader batches individual `load(k)` calls into a single
 * `WHERE id IN (...)` query per tick, then caches results per request.
 *
 * Usage:
 * ```ts
 * const loaders = createDataLoaders();
 * const team = await loaders.team.load("ARG");
 * ```
 */
export function createDataLoaders() {
  return {
    team: new DataLoader<string, typeof schemas.teams.$inferSelect | null>(
      async (ids) => {
        const rows = await db
          .select()
          .from(schemas.teams)
          .where(inArray(schemas.teams.id, ids as string[]));

        const map = new Map(rows.map((r) => [r.id, r]));
        return ids.map((id) => map.get(id) ?? null);
      },
    ),

    match: new DataLoader<number, typeof schemas.matches.$inferSelect | null>(
      async (ids) => {
        const rows = await db
          .select()
          .from(schemas.matches)
          .where(inArray(schemas.matches.id, ids as number[]));

        const map = new Map(rows.map((r) => [r.id, r]));
        return ids.map((id) => map.get(id) ?? null);
      },
    ),

    player: new DataLoader<number, typeof schemas.players.$inferSelect | null>(
      async (ids) => {
        const rows = await db
          .select()
          .from(schemas.players)
          .where(inArray(schemas.players.id, ids as number[]));

        const map = new Map(rows.map((r) => [r.id, r]));
        return ids.map((id) => map.get(id) ?? null);
      },
    ),
  };
}
