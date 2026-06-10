import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import type * as schema from "./db/schema.js";

/**
 * DataLoader proxy interface used in GraphQL context.
 * Provides batched/cached lookups for team, match, and player entities.
 * Implemented by `DataLoader<K, V>` from the `dataloader` package.
 */
export interface DataLoaderProxy<K, V> {
  load(key: K): Promise<V>;
  loadMany(keys: K[]): Promise<V[]>;
}

/**
 * Typed loaders available on every resolver's context.
 */
export interface DataLoaders {
  team: DataLoaderProxy<string, typeof schema.teams.$inferSelect | null>;
  match: DataLoaderProxy<number, typeof schema.matches.$inferSelect | null>;
  player: DataLoaderProxy<number, typeof schema.players.$inferSelect | null>;
}

/**
 * Stub user information for Phase 3.
 * Phase 8 will replace this with real Google OAuth session data.
 */
export interface ContextUser {
  isAuthenticated: boolean;
  role: "anonymous" | "admin" | "user";
  userId?: string;
}

/**
 * Typed context object passed to every GraphQL resolver.
 *
 * @field db - Drizzle ORM database client (NodePostgres)
 * @field user - Authentication info (stubbed in Phase 3)
 * @field loaders - DataLoader instances for N+1 prevention
 */
export interface GraphQLContext {
  db: NodePgDatabase<typeof schema>;
  user: ContextUser;
  loaders: DataLoaders;
}
