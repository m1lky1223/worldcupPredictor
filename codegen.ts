import type { CodegenConfig } from "@graphql-codegen/cli";

const config: CodegenConfig = {
  overwrite: true,
  schema: "apps/api/src/**/*.ts",
  generates: {
    "packages/domain/src/generated/graphql.ts": {
      plugins: ["typescript", "typescript-resolvers"],
      config: {
        useIndexSignature: true,
        useTypeImports: true,
        contextType: "../graphql-context.js#GraphQLContext"
      }
    }
  }
};

export default config;
