import type { ValueNode } from "graphql";
import { GraphQLScalarType, Kind } from "graphql";

import { typeDefs as teamTypeDefs, resolvers as teamResolvers } from "./team.js";
import { typeDefs as playerTypeDefs, resolvers as playerResolvers } from "./player.js";
import { typeDefs as matchTypeDefs, resolvers as matchResolvers } from "./match.js";
import { typeDefs as predictionTypeDefs, resolvers as predictionResolvers } from "./prediction.js";
import { typeDefs as groupTypeDefs, resolvers as groupResolvers } from "./group.js";
import { typeDefs as modelMetricsTypeDefs, resolvers as modelMetricsResolvers } from "./model-metrics.js";
import { typeDefs as venueTypeDefs, resolvers as venueResolvers } from "./venue.js";

/**
 * Parses a GraphQL literal AST node into a JavaScript value.
 */
function parseJSONLiteral(ast: ValueNode): unknown {
  switch (ast.kind) {
    case Kind.STRING:
      return ast.value;
    case Kind.BOOLEAN:
      return ast.value;
    case Kind.INT:
      return Number.parseInt(ast.value, 10);
    case Kind.FLOAT:
      return Number.parseFloat(ast.value);
    case Kind.OBJECT: {
      const obj: Record<string, unknown> = {};
      for (const field of ast.fields) {
        obj[field.name.value] = parseJSONLiteral(field.value);
      }
      return obj;
    }
    case Kind.LIST:
      return ast.values.map((v) => parseJSONLiteral(v));
    case Kind.NULL:
      return null;
    default:
      return null;
  }
}

/**
 * Custom JSON scalar for flexible data fields (calibration, etc.).
 */
const JSONScalar = new GraphQLScalarType({
  name: "JSON",
  description: "Arbitrary JSON value",
  serialize(value: unknown) {
    return value;
  },
  parseValue(value: unknown) {
    return value;
  },
  parseLiteral(ast: ValueNode) {
    return parseJSONLiteral(ast);
  },
});

/**
 * Base type declaration — other files extend via `extend type Query`.
 */
export const typeDefs = `#graphql
  type Query
`;

// Apollo Server configuration — not imported by codegen
const apolloSchema = {
  typeDefsList: [
    typeDefs,
    teamTypeDefs,
    playerTypeDefs,
    matchTypeDefs,
    predictionTypeDefs,
    groupTypeDefs,
    modelMetricsTypeDefs,
    venueTypeDefs,
  ] as const,

  resolversList: [
    {
      JSON: JSONScalar,
    },
    teamResolvers,
    playerResolvers,
    matchResolvers,
    predictionResolvers,
    groupResolvers,
    modelMetricsResolvers,
    venueResolvers,
  ] as const,
};

export { apolloSchema };
