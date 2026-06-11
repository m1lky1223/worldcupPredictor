import { desc, eq, sql } from "drizzle-orm";
import { schemas } from "@worldcup/domain";
import type { GraphQLContext } from "@worldcup/domain";

export const typeDefs = `#graphql
  enum PlayerPosition {
    Goalkeeper
    Defender
    Midfielder
    Forward
  }

  type Player {
    id: ID!
    name: String!
    team: Team!
    position: PlayerPosition!
    influenceScore: Int!
  }

  type PaginationInfo {
    total: Int!
    limit: Int!
    offset: Int!
  }

  type PlayerConnection {
    items: [Player!]!
    pagination: PaginationInfo!
  }

  extend type Query {
    players(limit: Int, offset: Int): PlayerConnection!
    player(id: ID!): Player
  }
`;

export interface PlayerArgs {
  id: string;
}

export interface PlayersArgs {
  limit?: number | null;
  offset?: number | null;
}

export const resolvers = {
  Query: {
    players: async (
      _parent: unknown,
      args: PlayersArgs,
      context: GraphQLContext,
    ) => {
      const limit = args.limit ?? 20;
      const offset = args.offset ?? 0;

      const countResult = await context.db
        .select({ count: sql<number>`count(*)` })
        .from(schemas.players);
      const total = Number(countResult[0].count);

      const items = await context.db
        .select()
        .from(schemas.players)
        .orderBy(desc(schemas.players.influenceScore))
        .limit(limit)
        .offset(offset);

      return {
        items,
        pagination: { total, limit, offset },
      };
    },

    player: async (
      _parent: unknown,
      args: PlayerArgs,
      context: GraphQLContext,
    ) => {
      const id = Number(args.id);
      const [player] = await context.db
        .select()
        .from(schemas.players)
        .where(eq(schemas.players.id, id))
        .limit(1);
      return player ?? null;
    },
  },

  Player: {
    team: async (
      parent: { teamId: string },
      _args: unknown,
      context: GraphQLContext,
    ) => {
      return context.loaders.team.load(parent.teamId);
    },
  },
};
