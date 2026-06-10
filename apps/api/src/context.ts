import type { GraphQLContext, ContextUser } from "@worldcup/domain";
import { db } from "@worldcup/domain";
import { createDataLoaders } from "./dataloaders.js";

/**
 * Extracts a stub user identity from the incoming request.
 *
 * Phase 3 uses a dev-mode header (x-user-id) or defaults to an anonymous session.
 * Phase 8 will replace this with real Google OAuth session parsing.
 */
function resolveUser(request: { headers: Record<string, string | string[]> }): ContextUser {
  const userId = Array.isArray(request.headers["x-user-id"])
    ? request.headers["x-user-id"][0]
    : request.headers["x-user-id"];

  if (typeof userId === "string" && userId.length > 0) {
    return {
      isAuthenticated: true,
      role: "user",
      userId,
    };
  }

  return {
    isAuthenticated: false,
    role: "anonymous",
  };
}

/**
 * Builds the typed GraphQL context for every request.
 *
 * Usage with ApolloServer:
 * ```
 * const server = new ApolloServer<GraphQLContext>({ ... });
 * const { url } = await startStandaloneServer(server, {
 *   context: async ({ req }) => createContext({ req }),
 * });
 * ```
 */
export function createContext({
  req,
}: {
  req: { headers: Record<string, string | string[]> };
}): GraphQLContext {
  return {
    db,
    user: resolveUser(req),
    loaders: createDataLoaders(),
  };
}

export type { GraphQLContext };
