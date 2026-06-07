import { ApolloServer } from "@apollo/server";
import { startStandaloneServer } from "@apollo/server/standalone";

export const typeDefs = `#graphql
  type Query {
    hello: String
  }
`;

const resolvers = {
  Query: {
    hello: () => "world",
  },
};

const server = new ApolloServer({
  typeDefs,
  resolvers,
});

const port = Number(process.env.GRAPHQL_PORT) || 4000;

const isMain = process.argv[1]?.includes("apps/api/src/index.ts") || 
               process.argv[1]?.includes("apps/api/dist/index.js") || 
               (typeof require !== "undefined" && require.main === module);

if (isMain) {
  startStandaloneServer(server, {
    listen: { port },
  }).then(({ url }) => {
    console.log(`🚀 GraphQL API Server ready at ${url}`);
  });
}
