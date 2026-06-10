import type { IncomingMessage } from "http";
import type { GraphQLContext, ContextUser } from "@worldcup/domain";
import { db } from "@worldcup/domain";
import { createDataLoaders } from "./dataloaders.js";

/**
 * Extract a header value from IncomingMessage.headers (may be string | string[] | undefined).
 */
function getHeaderValue(
  headers: IncomingMessage["headers"],
  name: string,
): string | undefined {
  const v = headers[name];
  if (Array.isArray(v)) return v[0];
  return v;
}

/**
 * Extracts a stub user identity from the incoming request.
 *
 * Phase 3 uses a dev-mode header (x-user-id) or defaults to an anonymous session.
 * Phase 8 will replace this with real Google OAuth session parsing.
 */
function resolveUser(req: IncomingMessage): ContextUser {
  const userId = getHeaderValue(req.headers, "x-user-id");

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
  req: IncomingMessage;
}): GraphQLContext {
  return {
    db,
    user: resolveUser(req),
    loaders: createDataLoaders(),
  };
}

export type { GraphQLContext };
