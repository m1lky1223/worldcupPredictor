import { ApolloClient, InMemoryCache, createHttpLink } from "@apollo/client";

const httpLink = createHttpLink({
  uri: "http://localhost:4000/graphql",
});

export const client = new ApolloClient({
  link: httpLink,
  cache: new InMemoryCache({
    typePolicies: {
      Query: {
        fields: {
          teams: {
            merge(existing, incoming) {
              return incoming;
            },
          },
          matches: {
            merge(existing, incoming) {
              return incoming;
            },
          },
          players: {
            merge(existing, incoming) {
              return incoming;
            },
          },
        },
      },
    },
  }),
});
