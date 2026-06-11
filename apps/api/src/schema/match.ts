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
    ThirdPlace
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

export interface MatchArgs {
  id: string;
}

export interface MatchesArgs {
  stage?: string | null;
  limit?: number | null;
  offset?: number | null;
}
const stageGqlToDbMap: Record<string, string> = {
  Group: "Group",
  RoundOf32: "Round of 32",
  RoundOf16: "Round of 16",
  Quarterfinals: "Quarterfinals",
  Semifinals: "Semifinals",
  ThirdPlace: "Third Place",
  Final: "Final",
};

const stageDbToGqlMap: Record<string, string> = {
  "Group": "Group",
  "Round of 32": "RoundOf32",
  "Round of 16": "RoundOf16",
  "Quarterfinals": "Quarterfinals",
  "Semifinals": "Semifinals",
  "Third Place": "ThirdPlace",
  "Final": "Final",
};

function mapStageDbToGql(dbStage: string): string {
  return stageDbToGqlMap[dbStage] ?? dbStage;
}

function mapStageGqlToDb(gqlStage: string): string {
  return stageGqlToDbMap[gqlStage] ?? gqlStage;
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
        conditions.push(eq(schemas.matches.stage, mapStageGqlToDb(args.stage)));
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
    stage: (parent: { stage: string }) => {
      return mapStageDbToGql(parent.stage);
    },

    homeTeam: async (
      parent: { homeTeamId?: string | null; [key: string]: unknown },
      _args: unknown,
      context: GraphQLContext,
    ) => {
      if (!parent.homeTeamId) return null;
      return context.loaders.team.load(parent.homeTeamId);
    },


    awayTeam: async (
      parent: { awayTeamId?: string | null; [key: string]: unknown },
      _args: unknown,
      context: GraphQLContext,
    ) => {
      if (!parent.awayTeamId) return null;
      return context.loaders.team.load(parent.awayTeamId);
    },

    prediction: async (
      parent: { id: number; [key: string]: unknown },
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

    kickoffTime: (parent: { kickoffTime: Date | string | number }) => {
      if (!parent.kickoffTime) return "";
      const val = parent.kickoffTime;
      if (typeof val === "string" && /^\d+$/.test(val)) {
        return new Date(Number(val)).toISOString();
      }
      const d = new Date(val);
      return isNaN(d.getTime()) ? "" : d.toISOString();
    },

    odds: async (
      parent: { id: number; [key: string]: unknown },
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

  OddsEntry: {
    updatedAt: (parent: { createdAt: Date | string | number }) => {
      const val = parent.createdAt;
      if (!val) return "";
      if (typeof val === "string" && /^\d+$/.test(val)) {
        return new Date(Number(val)).toISOString();
      }
      const d = new Date(val);
      return isNaN(d.getTime()) ? "" : d.toISOString();
    },
  },
};
