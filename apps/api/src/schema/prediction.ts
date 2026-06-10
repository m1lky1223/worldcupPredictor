export const typeDefs = `#graphql
  type Factor {
    factor: String!
    weight: Float!
  }

  type Prediction {
    homeWin: Float!
    draw: Float!
    awayWin: Float!
    confidence: Float!
    factors: [Factor!]!
    createdAt: String!
  }
`;

export const resolvers = {};
