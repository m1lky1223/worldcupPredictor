import { desc } from "drizzle-orm";
import { schemas } from "@worldcup/domain";
import type { GraphQLContext } from "@worldcup/domain";

export const typeDefs = `#graphql
  type ModelMetrics {
    accuracy: Float!
    brierScore: Float!
    logLoss: Float!
    calibration: JSON!
    modelVersion: String!
    calculatedAt: String!
  }

  extend type Query {
    modelMetrics: ModelMetrics
  }
`;

export const resolvers = {
  Query: {
    modelMetrics: async (
      _parent: unknown,
      _args: unknown,
      context: GraphQLContext,
    ) => {
      const [metrics] = await context.db
        .select()
        .from(schemas.modelMetrics)
        .orderBy(desc(schemas.modelMetrics.calculatedAt))
        .limit(1);
      return metrics ?? null;
    },
  },
};
