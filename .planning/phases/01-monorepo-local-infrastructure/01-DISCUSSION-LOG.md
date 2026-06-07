# Phase 1: Monorepo & Local Infrastructure - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-06-07
**Phase:** 01-monorepo-local-infrastructure
**Areas discussed:** Monorepo Workspaces, Database Migrations, Database Seeding, Host & Environment Resolution, Testing Strategy, GraphQL Models

---

## Monorepo Workspaces

| Option | Description | Selected |
|--------|-------------|----------|
| pnpm | pnpm workspaces (Recommended — already initialized and faster) | ✓ |
| npm | npm workspaces (aligns strictly with ROADMAP.md, requires migrating lock/yaml files) | |
| You decide | Let the agent decide | |

**User's choice:** pnpm
**Notes:** Locks pnpm as the monorepo workspaces tool.

---

## Database Migrations

| Option | Description | Selected |
|--------|-------------|----------|
| Separate container | Separate migration container/job (Recommended — runs once on startup before api/worker boot, clean separation) | ✓ |
| Auto-applied on boot | Auto-applied inside api/worker containers on boot (simpler but runs migration checks in parallel on scale) | |
| Manual only | Manual only (developer runs pnpm db:migrate manually outside/inside Docker) | |
| You decide | Let the agent decide | |

**User's choice:** Separate migration container/job
**Notes:** Drizzle migrations run as a separate, short-lived service in docker-compose.yml.

---

## Database Seeding

| Option | Description | Selected |
|--------|-------------|----------|
| Auto-run if empty | Yes, run seed script automatically if the database has 0 teams (Recommended — seamless onboarding) | ✓ |
| Manual only | No, keep seeding strictly manual (run via pnpm seed manually by developers) | |
| You decide | Let the agent decide | |

**User's choice:** Yes, run seed script automatically if the database has 0 teams
**Notes:** Automated seeding on startup when the database contains no teams.

---

## Host & Environment Resolution

| Option | Description | Selected |
|--------|-------------|----------|
| Dual-resolve | Use a dual-resolve approach (Recommended — if running inside Docker, resolve hostnames via Docker service names 'postgres' / 'redis'; if running locally on host, fall back to 'localhost') | ✓ |
| Strict Docker-only | Strict Docker-only (always resolve to Docker hostnames; developers must run everything inside Docker) | |
| You decide | Let the agent decide | |

**User's choice:** Use a dual-resolve approach
**Notes:** Allows running services outside Docker using local hostnames while inside Docker resolves via service names.

---

## Testing Strategy

| Option | Description | Selected |
|--------|-------------|----------|
| Cucumber BDD in container | Test running inside test container in BDD style using cucumber | ✓ |

**User's choice:** test running inside test container in BDD style using cucumber.
**Notes:** User specifically requested BDD style using Cucumber running inside test containers.

---

## GraphQL Models

| Option | Description | Selected |
|--------|-------------|----------|
| Auto model generator | Auto model generator for graphql model which can be shared between api and ui | ✓ |

**User's choice:** auto model generator for graphql model which can be shared between api and ui
**Notes:** User requested auto-generating TS models from GraphQL schemas, shared between apps/api and apps/web.

---

## the agent's Discretion

- The agent has discretion over CI baseline tool configuration (such as GitHub Actions workflow details, caching configuration, and package dependencies setup).

## Deferred Ideas

None — discussion stayed within phase scope.
