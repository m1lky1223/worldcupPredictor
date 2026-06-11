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

export const resolvers = {
  Prediction: {
    createdAt: (parent: { createdAt: Date | string | number }) => {
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
