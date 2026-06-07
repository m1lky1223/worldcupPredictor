# Phase 1: Monorepo & Local Infrastructure - Context

**Gathered:** 2026-06-07
**Status:** Ready for planning

<domain>
## Phase Boundary

Full stack runs locally from `docker compose up`. Every engineer can onboard from a cold clone. Specifically, this phase sets up the pnpm workspaces monorepo structure, Docker Compose (web, api, mcp, worker, postgres, redis), shared packages, Drizzle ORM migrations/seeding, and CI baseline with linting/typechecking.

</domain>

<decisions>
## Implementation Decisions

### Monorepo Workspaces
- **D-01:** Lock in `pnpm` workspaces for the monorepo instead of npm workspaces. This matches the existing `pnpm-workspace.yaml` and `pnpm-lock.yaml` files.

### Database Migrations
- **D-02:** Database migrations will be executed and applied in a separate migration container/job (e.g. `db-migrate` service in `docker-compose.yml`) that runs to completion before the API and worker start, using Docker Compose `depends_on` service completion checks.

### Database Seeding
- **D-03:** Run the seed script automatically on container startup if a query checks and finds that 0 teams exist in the database (seamless developer onboarding).

### Host & Environment Resolution
- **D-04:** Use a dual-resolve approach for service hostnames: if running inside Docker, resolve via Docker service names (`postgres` / `redis`); if running locally outside Docker on host machine, fall back to `localhost`.

### Testing Strategy
- **D-05:** Test suites will run inside the test containers in a BDD (Behavior-Driven Development) style using Cucumber.

### GraphQL Models
- **D-06:** Use an auto-model generator (like GraphQL Code Generator) to compile GraphQL schema types, which will be housed in a shared package (e.g., `packages/domain` or a dedicated package) and shared between the API and UI packages.

### the agent's Discretion
- The agent has discretion over CI baseline tool configuration (such as GitHub Actions workflow details, caching configuration, and package dependencies setup).

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project Specifications
- `docs/prd.md` — The product requirements document defining all MVP functionality and priorities.
- `docs/rfc-0001-architecture.md` — The architectural design document detailing stack layout and service design.
- `AGENTS.md` — Project coding conventions, monorepo directory layout, design principles, and guidelines.
- `AI_NOTES.md` — Operational details regarding local development ports, databases, and GSD/Beads workflow instructions.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `docker-compose.yml`: Existing compose file defines postgres, redis, api, web, and worker services. It should be updated to include the `db-migrate` container/job.
- `infra/docker/`: Contains basic Dockerfiles for `api`, `web`, and `worker` services. These should be modified or verified for compatibility with `pnpm` build configurations.

### Established Patterns
- Monorepo layout: Code is divided into `apps/` (api, web, worker) and `packages/` (config, domain, prediction-engine, ui, data-providers).

### Integration Points
- Node.js version 20 as specified in the Dockerfiles.
- Drizzle ORM configurations and environment variable injection hooks in the apps.

</code_context>

<specifics>
## Specific Ideas

- Cucumber BDD tests should run within a test container, aligning with the BDD style requirements.
- Shared models and types generated from GraphQL schemas should be stored in a reusable monorepo package (e.g. `packages/domain` or a dedicated model package) so both `apps/api` and `apps/web` can import them.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 01-monorepo-local-infrastructure*
*Context gathered: 2026-06-07*
