# Phase 1: Monorepo & Local Infrastructure - Pattern Map

**Mapped:** 2026-06-07
**Files analyzed:** 18
**Analogs found:** 14 / 18

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `scripts/db-init.ts` | utility | CRUD / file-I/O / batch | `scripts/seed.ts` | exact |
| `apps/mcp/src/index.ts` | service | request-response | `apps/api/src/index.ts` | role-match |
| `apps/mcp/package.json` | config | config | `apps/worker/package.json` | role-match |
| `apps/mcp/tsconfig.json` | config | config | `apps/worker/tsconfig.json` | role-match |
| `codegen.ts` | config | config | `packages/domain/drizzle.config.ts` | role-match |
| `packages/domain/src/generated/graphql.ts` | model | request-response | `packages/domain/src/index.ts` | role-match |
| `docker-compose.yml` | config | config | `docker-compose.yml` | exact (self) |
| `infra/docker/api.Dockerfile` | config | config | `infra/docker/api.Dockerfile` | exact (self) |
| `infra/docker/web.Dockerfile` | config | config | `infra/docker/web.Dockerfile` | exact (self) |
| `infra/docker/worker.Dockerfile` | config | config | `infra/docker/worker.Dockerfile` | exact (self) |
| `infra/docker/test.Dockerfile` | config | config | `infra/docker/api.Dockerfile` | role-match |
| `.github/workflows/ci.yml` | config | config | `package.json` (root scripts) | role-match |
| `tests/bdd/cucumber.js` | config | config | `package.json` (root scripts) | role-match |
| `.env.example` | config | config | `.env.example` | exact (self) |
| `tests/bdd/features/health.feature` | test | validation | None | no-analog |
| `tests/bdd/features/db.feature` | test | validation | None | no-analog |
| `tests/bdd/steps/health.steps.ts` | test | request-response / validation | None | no-analog |
| `tests/bdd/steps/db.steps.ts` | test | CRUD / validation | None | no-analog |

## Pattern Assignments

### `scripts/db-init.ts` (utility, CRUD / file-I/O / batch)

**Analog:** `scripts/seed.ts`

**Imports pattern** (`scripts/seed.ts` lines 1-7):
```typescript
import "dotenv/config";
import { db } from "../packages/domain/src/db/index.js";
import { teams, matches } from "../packages/domain/src/db/schema.js";
import { readFileSync } from "fs";
import { join } from "path";
import pg from "pg";
import { migrate } from "drizzle-orm/node-postgres/migrator";
```

**Core CRUD & migration pattern** (`scripts/seed.ts` lines 12-80):
```typescript
async function seed() {
  console.log("🚀 Starting database migrations and seeding...");

  // Run migrations
  try {
    console.log("Applying Drizzle migrations...");
    const migrationPool = new Pool({
      connectionString: process.env.DATABASE_URL,
    });
    // This runs migrations programmatically
    await migrate(db, { migrationsFolder: join(process.cwd(), "packages/domain/migrations") });
    await migrationPool.end();
    console.log("Migrations applied successfully.");
  } catch (err) {
    console.warn("Skipping programmatic migrations or encountered error (ensure DB is running & drizzle-kit has run):", err);
  }

  // Load static JSON seed datasets
  const teamsPath = join(process.cwd(), "data/teams.json");
  const fixturesPath = join(process.cwd(), "data/fixtures.json");

  const teamsData = JSON.parse(readFileSync(teamsPath, "utf8"));
  const fixturesData = JSON.parse(readFileSync(fixturesPath, "utf8"));

  // Seed Teams
  console.log(`Seeding ${teamsData.length} teams...`);
  for (const team of teamsData) {
    await db.insert(teams)
      .values({
        id: team.id,
        name: team.name,
        groupName: team.groupName,
        flagUrl: team.flagUrl,
        eloRating: team.eloRating,
      })
      .onConflictDoUpdate({
        target: teams.id,
        set: {
          name: team.name,
          groupName: team.groupName,
          flagUrl: team.flagUrl,
          eloRating: team.eloRating,
        }
      });
  }

  // Seed Matches/Fixtures
  console.log(`Seeding ${fixturesData.length} fixtures...`);
  for (const match of fixturesData) {
    await db.insert(matches)
      .values({
        matchNumber: match.matchNumber,
        homeTeamId: match.homeTeamId,
        awayTeamId: match.awayTeamId,
        stage: match.stage,
        kickoffTime: new Date(match.kickoffTime),
        status: "Scheduled",
      })
      .onConflictDoUpdate({
        target: matches.matchNumber,
        set: {
          homeTeamId: match.homeTeamId,
          awayTeamId: match.awayTeamId,
          stage: match.stage,
          kickoffTime: new Date(match.kickoffTime),
        }
      });
  }

  console.log("✅ Seeding completed successfully!");
  process.exit(0);
}
```

**Error handling pattern** (`scripts/seed.ts` lines 85-88):
```typescript
seed().catch((err) => {
  console.error("❌ Seeding failed:", err);
  process.exit(1);
});
```

---

### `apps/mcp/src/index.ts` (service, request-response)

**Analog:** `apps/api/src/index.ts`

**Imports pattern** (`apps/api/src/index.ts` lines 1-2):
```typescript
import { ApolloServer } from "@apollo/server";
import { startStandaloneServer } from "@apollo/server/standalone";
```

**Core patterns** (`apps/api/src/index.ts` lines 16-27):
```typescript
const server = new ApolloServer({
  typeDefs,
  resolvers,
});

const port = Number(process.env.GRAPHQL_PORT) || 4000;

startStandaloneServer(server, {
  listen: { port },
}).then(({ url }) => {
  console.log(`🚀 GraphQL API Server ready at ${url}`);
});
```

---

### `apps/mcp/package.json` (config, config)

**Analog:** `apps/worker/package.json`

**Core config pattern** (`apps/worker/package.json` lines 1-21):
```json
{
  "name": "@worldcup/worker",
  "version": "1.0.0",
  "private": true,
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "scripts": {
    "dev": "tsx src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js"
  },
  "dependencies": {
    "@worldcup/data-providers": "workspace:*",
    "@worldcup/domain": "workspace:*",
    "@worldcup/prediction-engine": "workspace:*",
    "bullmq": "^5.1.1",
    "dotenv": "^16.3.1",
    "ioredis": "^5.3.2"
  }
}
```

---

### `apps/mcp/tsconfig.json` (config, config)

**Analog:** `apps/worker/tsconfig.json`

**Core compiler config pattern** (`apps/worker/tsconfig.json` lines 1-15):
```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src/**/*"],
  "references": [
    { "path": "../../packages/config" },
    { "path": "../../packages/domain" },
    { "path": "../../packages/prediction-engine" },
    { "path": "../../packages/data-providers" }
  ]
}
```

---

### `codegen.ts` (config, config)

**Analog:** `packages/domain/drizzle.config.ts`

**Core tool configuration pattern** (`packages/domain/drizzle.config.ts` lines 1-11):
```typescript
import type { Config } from "drizzle-kit";

export default {
  schema: "./src/db/schema.ts",
  out: "./migrations",
  driver: "pg",
  dbCredentials: {
    connectionString: process.env.DATABASE_URL || "postgres://postgres:postgres@localhost:5432/worldcup",
  },
} satisfies Config;
```

---

### `packages/domain/src/generated/graphql.ts` (model, request-response)

**Analog:** `packages/domain/src/index.ts`

**Core types pattern** (`packages/domain/src/index.ts` lines 5-18):
```typescript
export interface Factor {
  factor: string;
  weight: number;
}

export interface PredictionPayload {
  homeWin: number;
  draw: number;
  awayWin: number;
  confidence: number;
  factors: Factor[];
  timestamp: string;
}
```

---

### `docker-compose.yml` (config, config)

**Analog:** `docker-compose.yml` (self)

**Core compose service pattern** (`docker-compose.yml` lines 34-50):
```yaml
  api:
    build:
      context: .
      dockerfile: infra/docker/api.Dockerfile
    container_name: worldcup-api
    ports:
      - "4000:4000"
    environment:
      DATABASE_URL: postgres://postgres:password@postgres:5432/worldcup
      REDIS_URL: redis://redis:6379
      GRAPHQL_PORT: 4000
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
```

---

### `infra/docker/test.Dockerfile` (config, config)

**Analog:** `infra/docker/api.Dockerfile`

**Core Docker build pattern** (`infra/docker/api.Dockerfile` lines 1-17):
```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
RUN npm install -g pnpm
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml tsconfig.json tsconfig.base.json ./
COPY packages/ packages/
COPY apps/ apps/
RUN pnpm install --frozen-lockfile
RUN npx tsc --build

FROM node:20-alpine
WORKDIR /app
RUN npm install -g pnpm
COPY --from=builder /app /app
ENV NODE_ENV=production
EXPOSE 4000
CMD ["node", "apps/api/dist/index.js"]
```

---

## Shared Patterns

### Configuration Inheritance
**Source:** `tsconfig.base.json`
**Apply to:** All tsconfig files (`tsconfig.json` in apps and packages)
```json
{
  "extends": "../../tsconfig.base.json"
}
```

### Dependency Injection via Environment
**Source:** `packages/domain/src/db/index.ts`
**Apply to:** All services needing database/redis/external configurations
```typescript
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});
```

---

## No Analog Found

The following test/feature files have no close analog because no unit/integration tests or Gherkin features are present in the current codebase. The planner and executor should use the research patterns outlined in `01-RESEARCH.md`.

| File | Role | Data Flow | Reason |
|------|------|-----------|--------|
| `tests/bdd/features/health.feature` | test | validation | No Gherkin features exist yet |
| `tests/bdd/features/db.feature` | test | validation | No Gherkin features exist yet |
| `tests/bdd/steps/health.steps.ts` | test | request-response | No cucumber steps exist yet |
| `tests/bdd/steps/db.steps.ts` | test | CRUD / validation | No cucumber steps exist yet |
| `.github/workflows/ci.yml` | config | config | No CI workflows exist yet |
| `tests/bdd/cucumber.js` | config | config | No Cucumber configuration exists yet |

---

## Metadata

**Analog search scope:** root, `apps/`, `packages/`, `scripts/`, `infra/`
**Files scanned:** ~50
**Pattern extraction date:** 2026-06-07
