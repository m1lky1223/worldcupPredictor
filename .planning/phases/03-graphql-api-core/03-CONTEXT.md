# Phase 3: GraphQL API Core - Context

**Gathered:** 2026-06-09
**Status:** Ready for planning

<domain>
## Phase Boundary

Apollo GraphQL API serves all read queries for the dashboard, match detail, team profiles, player profiles, group tables, and bracket projections. This phase covers only queries — no mutations. Auth is stubbed (wired in Phase 8).

</domain>

<decisions>
## Implementation Decisions

### Auth Boundary
- **D-01:** Phase 3 uses a stub auth layer that returns anonymous/default context (isAuthenticated=false, role=anonymous). No real auth middleware. Phase 8 will wire Google OAuth and proper session handling. The stub provides a typed `Context` interface that Phase 8 can swap out.
- **D-02:** The `contextType` in `codegen.ts` should be updated from `"any"` to the real typed context to ensure resolver type safety from the start.

### API Data Scope
- **D-03:** Expose a focused set of GraphQL types matching what the dashboard and pages need: Team, Player, Match, Prediction, RatingsSnapshot, OddsHistory, Venue, ModelMetrics, GroupStandings.
- **D-04:** Internal/operational tables (matchEvents, playerMatchPerformances, teamMatchStats, predictionInputSnapshots, providerLogs) are NOT exposed in the public GraphQL schema. Their data flows through resolver logic on parent types (e.g., match stats on Match type).

### Bracket Projection
- **D-05:** Start with group standings only (points, goal difference, head-to-head, qualification position). Return a simple ranked list per group with qualified/eliminated status. Full knockout bracket tree with path-to-final projections is deferred.

### Pagination & Sorting
- **D-06:** Use offset-based pagination (limit/offset) for list queries. Simpler to implement and sufficient for the data volumes (48 teams, 104 matches, ~1300 players). Cursor pagination can be added later if needed.
- **D-07:** Default sort orders: matches by kickoffTime ascending (upcoming first), teams by eloRating descending, players by influenceScore descending. Default page size is 20 for matches and players; teams returns all 48 (no pagination).

### Schema Organization
- **D-08:** Define GraphQL typeDefs as SDL string literals in per-entity files under a `src/schema/` directory (e.g., `src/schema/match.ts`, `src/schema/team.ts`). Each file exports its typeDefs string and resolver object. A central `src/schema/index.ts` merges them. No `.graphql` file watcher needed.
- **D-09:** Resolvers live alongside their typeDefs in the same file. Pattern: export `typeDefs` + `resolvers` from each entity file, merge in index.ts.

### DataLoader & N+1 Prevention
- **D-10:** Use DataLoader from the start for team, match, and player lookups. Add `dataloader` to `apps/api/package.json` dependencies. This prevents N+1 queries when resolving relationships (e.g., match → home team).

### Error Handling
- **D-11:** Standard Apollo Server error formatting with structured error codes. Use `GraphQLError` with `extensions.code` for business-logic errors (e.g., "NOT_FOUND", "INVALID_ARGUMENT"). Let Apollo handle validation errors automatically.

### the agent's Discretion
- Exact directory structure under `src/` (schema vs resolvers vs utils split)
- DataLoader batch function implementation details
- Error message wording and extension detail level
- Whether to use `graphql-tools` or manual typeDef concatenation
- Test file organization and naming
- Connection to Drizzle queries (raw SQL via drizzle or helper functions)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Product & Architecture
- `docs/prd.md` — Product requirements defining all MVP queries and data display needs
- `docs/rfc-0001-architecture.md` — Architecture doc detailing GraphQL API design, service layout
- `AGENTS.md` — Project conventions, architecture, GraphQL best practices

### Project Planning
- `.planning/PROJECT.md` — Project overview, tech stack decisions
- `.planning/STATE.md` — Current project state and phase tracking
- `.planning/ROADMAP.md` §Phase 3 — Phase goal, plan descriptions, exit criteria
- `.planning/phases/02-domain-schema-provider-adapters/02-CONTEXT.md` — Phase 2 context (schema decisions, provider_id handling)

### Existing Code
- `apps/api/src/index.ts` — Current Apollo Server bootstrap (to be expanded)
- `packages/domain/src/generated/graphql.ts` — Codegen output (regenerated after schema changes)
- `packages/domain/src/db/schema.ts` — Drizzle schema defining all database types resolvers query
- `packages/domain/src/db/index.ts` — Drizzle DB connection (imported by resolvers)
- `packages/domain/src/index.ts` — Domain package exports
- `codegen.ts` — Codegen configuration

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `apps/api/src/index.ts` — Apollo Server 4 bootstrap with `startStandaloneServer`. Currently has inline hello-world schema — needs to be expanded to use merged typeDefs/resolvers from `src/schema/`.
- `codegen.ts` — GraphQL Codegen configured with `typescript` + `typescript-resolvers` plugins. Reads typeDefs from `apps/api/src/**/*.ts`, outputs to `packages/domain/src/generated/graphql.ts`. Currently uses `contextType: "any"`.
- `packages/domain/src/db/index.ts` — Drizzle DB connection, available to resolvers via context.
- `packages/domain/src/generated/graphql.ts` — Generated resolver types (currently only `Query.hello`). Will auto-update via `npm run codegen`.
- Root `package.json` scripts: `"codegen"` and `"codegen:watch"` already configured.

### Established Patterns
- Drizzle ORM for database queries (resolvers use `db.select().from(schema.teams)` etc.)
- Codegen-first: write typeDefs → run codegen → implement resolvers against generated types
- Domain package pattern: types and db client shared via `@worldcup/domain`
- Environment-based configuration (GRAPHQL_PORT env var)

### Integration Points
- Resolvers import `db` from `@worldcup/domain` and query Drizzle schema tables
- Schema typeDefs in `src/schema/*.ts` feed codegen → generated types in `packages/domain/src/generated/graphql.ts`
- Context builder in `src/context.ts` creates typed context object passed to all resolvers
- Future Phase 8 swaps the stub auth context for real Google OAuth
- Future Phase 4 (Web UI) consumes these GraphQL queries
- `dataloader` package needs to be added to `apps/api/package.json`

</code_context>

<specifics>
## Specific Ideas

- Resolver pattern: each entity folder exports `typeDefs: string` and `resolvers: Resolvers` object. Central merge in `src/schema/index.ts`.
- Context type should include: `{ db: DrizzleClient, user: { isAuthenticated: boolean, role: string, userId?: string } }`.
- For the stub auth, extract userId from a dev-mode header (`x-user-id`) or default to anonymous.
- Group standings resolver queries matches for a group, computes points (W=3, D=1, L=0), GD, head-to-head tiebreaker, returns ranked list.

</specifics>

<deferred>
## Deferred Ideas

- **Full knockout bracket tree** — path-to-final projections with predicted winners per round. More complex domain logic. Defer until group standings are proven.
- **Cursor-based pagination** — offset pagination is sufficient for MVP data volumes. Add cursor if latency becomes an issue or data grows beyond 48 teams.
- **Real auth with Google OAuth** — Phase 8. The stub in Phase 3 provides the interface contract.
- **Mutations** — No write operations in Phase 3 scope. Mutations for admin/worker operations are TBD.
- **Internal/operational table exposure** — matchEvents, playerMatchPerformances, teamMatchStats, predictionInputSnapshots may be exposed later if needed by the UI.

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 03-graphql-api-core*
*Context gathered: 2026-06-09*
