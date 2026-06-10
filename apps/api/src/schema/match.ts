import { desc, eq, and, sql } from "drizzle-orm";
import { schemas } from "@worldcup/domain";
import type { GraphQLContext } from "@worldcup/domain";

export const typeDefs = `#graphql
  enum MatchStatus {
    Scheduled
    Live
    Completed
  }

  enum MatchStage {
    Group
    RoundOf32
    RoundOf16
    Quarterfinals
    Semifinals
    Final
  }

  type Match {
    id: ID!
    matchNumber: Int!
    homeTeam: Team
    awayTeam: Team
    status: MatchStatus!
    stage: MatchStage!
    kickoffTime: String!
    homeScore: Int
    awayScore: Int
    prediction: Prediction
    odds: [OddsEntry!]
  }

  type OddsEntry {
    bookmaker: String!
    homeOdds: Float!
    drawOdds: Float!
    awayOdds: Float!
    updatedAt: String!
    matchId: ID!
  }

  type MatchConnection {
    items: [Match!]!
    pagination: PaginationInfo!
  }

  extend type Query {
    match(id: ID!): Match
    matches(stage: MatchStage, limit: Int, offset: Int): MatchConnection!
  }
`;

interface MatchArgs {
  id: string;
}

interface MatchesArgs {
  stage?: string | null;
  limit?: number | null;
  offset?: number | null;
}

export const resolvers = {
  Query: {
    match: async (
      _parent: unknown,
      args: MatchArgs,
      context: GraphQLContext,
    ) => {
      const id = Number(args.id);
      const [match] = await context.db
        .select()
        .from(schemas.matches)
        .where(eq(schemas.matches.id, id))
        .limit(1);
      return match ?? null;
    },

    matches: async (
      _parent: unknown,
      args: MatchesArgs,
      context: GraphQLContext,
    ) => {
      const limit = args.limit ?? 20;
      const offset = args.offset ?? 0;

      const conditions = [];
      if (args.stage) {
        conditions.push(eq(schemas.matches.stage, args.stage));
      }

      const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

      const items = await context.db
        .select()
        .from(schemas.matches)
        .where(whereClause)
        .orderBy(schemas.matches.kickoffTime)
        .limit(limit)
        .offset(offset);

      const totalResult = await context.db
        .select({ count: sql<number>`count(*)` })
        .from(schemas.matches)
        .where(whereClause);
      const total = Number(totalResult[0]?.count ?? 0);

      return {
        items,
        pagination: { total, limit, offset },
      };
    },
  },

  Match: {
    homeTeam: async (
      parent: { homeTeamId: string | null },
      _args: unknown,
      context: GraphQLContext,
    ) => {
      if (!parent.homeTeamId) return null;
      return context.loaders.team.load(parent.homeTeamId);
    },

    awayTeam: async (
      parent: { awayTeamId: string | null },
      _args: unknown,
      context: GraphQLContext,
    ) => {
      if (!parent.awayTeamId) return null;
      return context.loaders.team.load(parent.awayTeamId);
    },

    prediction: async (
      parent: { id: number },
      _args: unknown,
      context: GraphQLContext,
    ) => {
      const [pred] = await context.db
        .select()
        .from(schemas.predictions)
        .where(eq(schemas.predictions.matchId, parent.id))
        .orderBy(desc(schemas.predictions.createdAt))
        .limit(1);
      return pred ?? null;
    },

    odds: async (
      parent: { id: number },
      _args: unknown,
      context: GraphQLContext,
    ) => {
      return context.db
        .select()
        .from(schemas.oddsHistory)
        .where(eq(schemas.oddsHistory.matchId, parent.id))
        .orderBy(desc(schemas.oddsHistory.createdAt));
    },
  },
};
