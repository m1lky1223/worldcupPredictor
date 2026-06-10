import { desc, eq } from "drizzle-orm";
import { schemas } from "@worldcup/domain";
import type { GraphQLContext } from "@worldcup/domain";

export const typeDefs = `#graphql
  type Team {
    id: ID!
    name: String!
    groupName: String!
    flagUrl: String
    eloRating: Int!
  }

  extend type Query {
    teams: [Team!]!
    team(id: ID!): Team
  }
`;

interface TeamArgs {
  id: string;
}

export const resolvers = {
  Query: {
    teams: async (
      _parent: unknown,
      _args: unknown,
      context: GraphQLContext,
    ) => {
      return context.db
        .select()
        .from(schemas.teams)
        .orderBy(desc(schemas.teams.eloRating));
    },

    team: async (
      _parent: unknown,
      args: TeamArgs,
      context: GraphQLContext,
    ) => {
      const [team] = await context.db
        .select()
        .from(schemas.teams)
        .where(eq(schemas.teams.id, args.id))
        .limit(1);
      return team ?? null;
    },
  },
};
