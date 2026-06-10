import { eq } from "drizzle-orm";
import { schemas } from "@worldcup/domain";
import type { GraphQLContext } from "@worldcup/domain";

export const typeDefs = `#graphql
  type Venue {
    id: ID!
    name: String!
    city: String!
    country: String!
  }

  extend type Query {
    venues: [Venue!]!
    venue(id: ID!): Venue
  }
`;

interface VenueArgs {
  id: string;
}

export const resolvers = {
  Query: {
    venues: async (
      _parent: unknown,
      _args: unknown,
      context: GraphQLContext,
    ) => {
      return context.db.select().from(schemas.venues);
    },

    venue: async (
      _parent: unknown,
      args: VenueArgs,
      context: GraphQLContext,
    ) => {
      const id = Number(args.id);
      const [venue] = await context.db
        .select()
        .from(schemas.venues)
        .where(eq(schemas.venues.id, id))
        .limit(1);
      return venue ?? null;
    },
  },
};
