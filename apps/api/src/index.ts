import { ApolloServer } from "@apollo/server";
import { startStandaloneServer } from "@apollo/server/standalone";
import type { GraphQLContext } from "@worldcup/domain";
import { apolloSchema } from "./schema/index.js";
import { createContext } from "./context.js";

const server = new ApolloServer<GraphQLContext>({
  typeDefs: apolloSchema.typeDefsList,
  resolvers: apolloSchema.resolversList,
  formatError: (formattedError) => {
    return {
      message: formattedError.message,
      extensions: {
        code: formattedError.extensions?.code ?? "INTERNAL_SERVER_ERROR",
        ...(formattedError.extensions?.exception
          ? { exception: formattedError.extensions.exception }
          : {}),
      },
    };
  },
});

const port = Number(process.env.GRAPHQL_PORT) || 4000;

const isMain = process.argv[1]?.includes("apps/api/src/index.ts") || 
               process.argv[1]?.includes("apps/api/dist/index.js") || 
               (typeof require !== "undefined" && require.main === module);

if (isMain) {
  startStandaloneServer(server, {
    listen: { port },
    context: async ({ req }) => createContext({ req }),
  }).then(({ url }) => {
    console.log(`🚀 GraphQL API Server ready at ${url}`);
  });
}
