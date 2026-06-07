# 2026 FIFA World Cup Predictor

A modern, full-stack web application designed to forecast and track the outcomes of the 2026 FIFA World Cup. The system features a dynamic Elo-based rating model, updates predictions automatically as matches conclude, and exposes data through a clean user interface, a GraphQL API, and a built-in remote Model Context Protocol (MCP) server for AI agent integration.

The tournament begins on **June 11, 2026** (Mexico time) / **June 12, 2026** (Melbourne time).

---

## Key Features

*   **Dynamic Elo Forecasts:** Computes and displays win/draw/loss probability percentages and confidence ratings for every match, backed by clear, human-readable explanatory factors.
*   **Tournament Dashboard:** Responsive tournament hubs, group tables, qualification probabilities, and a visual knockout bracket projection.
*   **Odds & Market Context:** Periodically syncs betting odds to compare implied bookmaker probabilities against Elo predictions (strictly display-only).
*   **Model Performance Tracker:** Open metrics dashboard tracking model accuracy, Brier scores, log loss, and calibration over the course of the tournament.
*   **AI Agent Friendly:** Native remote MCP server endpoints allow agentic tools and developer CLIs to easily query tournament states, match histories, and predictions.

---

## Repository Documentation Index

This repository uses a structured documentation layout for humans and AI systems:

*   **[AGENTS.md](file:///Users/rony/dev/worldcupPredictor/AGENTS.md):** The single source of truth for repository guidelines, coding conventions, product rules, and agent instructions.
*   **[ARCHITECTURE.md](file:///Users/rony/dev/worldcupPredictor/ARCHITECTURE.md):** High-level component layers, Monorepo package layouts, database schema mappings, and Domain-Driven Design (DDD) specifications.
*   **[AI_NOTES.md](file:///Users/rony/dev/worldcupPredictor/AI_NOTES.md):** Integration guide detailing GSD planning, task tracking with Beads (`bd`), local environment ports, and agent workflow instructions.
*   **[docs/rfc-0001-architecture.md](file:///Users/rony/dev/worldcupPredictor/docs/rfc-0001-architecture.md):** Original engineering proposal and rationale.
*   **[docs/prd.md](file:///Users/rony/dev/worldcupPredictor/docs/prd.md):** Complete product requirement specifications.

---

## Tech Stack

*   **Monorepo Manager:** pnpm workspaces
*   **Frontend:** [Modern.js](https://modernjs.dev/) (React + TypeScript) styled natively with [Material UI (MUI)](https://mui.com/material-ui/)
*   **API Gateway:** Apollo GraphQL Server (Node.js + TypeScript)
*   **Background Processing:** BullMQ + Redis job runner
*   **Database & ORM:** PostgreSQL + [Drizzle ORM](https://orm.drizzle.team/)
*   **Data Providers:** TheStatsAPI (canonical fixture, lineup, and player data) and The Odds API (market data)

---

## Monorepo Layout

```
worldcupPredictor/
├── apps/
│   ├── web/                   # Modern.js Web UI & Web MCP Server (Port 3000)
│   ├── api/                   # Apollo GraphQL API Server (Port 4000)
│   └── worker/                # BullMQ background worker service
├── packages/
│   ├── domain/                # Shared domain models and constants
│   ├── prediction-engine/     # Elo ratings and probability calculator
│   ├── data-providers/        # Anti-Corruption Layer (ACL) for provider APIs
│   ├── ui/                    # Shared Material UI theme overrides and widgets
│   └── config/                # Shared tsconfig, eslint, and prettier settings
├── infra/
│   ├── docker/                # Service Dockerfiles
│   └── compose/               # Local Docker Compose setup
├── .planning/                 # GSD planning state (ROADMAP, PROJECT requirements)
└── graphify-out/              # Pre-built Codebase Knowledge Graph
```

---

## Local Development Setup

### Prerequisites

- **Node.js** (v18.x or higher, v20/v22 recommended)
- **pnpm** (v10.x or higher)
- **Docker** and **Docker Compose**

### Step-by-Step Startup

Follow these steps to configure and start the entire application stack:

#### 1. Install Dependencies
Run from the root directory to bootstrap the pnpm workspaces:
```bash
pnpm install
```

#### 2. Set Up Environment Variables
Create your local `.env` configuration file from the template:
```bash
cp .env.example .env
```

#### 3. Spin Up Local Databases
Launch the local PostgreSQL and Redis instances in the background:
```bash
docker compose up -d postgres redis
```

#### 4. Apply Migrations and Seed Data
Run the database migrations and seed canonical national team roster and fixture records:
```bash
pnpm seed
```

#### 5. Run the Application Stack
You can start the applications either directly on your local machine or fully dockerized:

##### Option A: Local Development Server (Recommended for Frontend/API editing)
Run typescript compilation and launch dev servers for the web frontend, api, and worker:
```bash
# Compile TypeScript workspaces
npx tsc --build

# Run all dev servers in parallel
pnpm dev
```

##### Option B: Full Dockerized Stack (Simulates Staging/Production)
Build and run the entire stack (including web app, api, and background worker containers):
```bash
docker compose up --build -d
```

---

## Service Endpoints

Once running, the services respond at the following local ports:
*   **Web Frontend & Web MCP:** [http://localhost:3000](http://localhost:3000) (MCP server endpoint at `/api/mcp`)
*   **GraphQL Playground:** [http://localhost:4000/graphql](http://localhost:4000/graphql)
*   **Postgres DB:** `localhost:5432`
*   **Redis:** `localhost:6379`

---

## Workspace Commands

Run these scripts from the root directory to manage the workspace:

```bash
pnpm dev               # Launch development servers in parallel
pnpm build             # Compile all TypeScript workspaces and build the web bundle
pnpm seed              # Re-run migrations and load canonical teams & fixtures
pnpm lint              # Run global code lint checks via ESLint
pnpm typecheck         # Verify type safety across the monorepo
pnpm test              # Run the test suite via Vitest
```

---

## Task & Progress Tracking

This project uses **Beads (bd)** to manage issue state and dependencies. All work must be tracked via the `bd` CLI:

*   `bd ready` — Check for unblocked, unclaimed tasks in your current backlog.
*   `bd update <id> --claim` — Claim a task before beginning work.
*   `bd close <id> --reason="..."` — Close a task upon completion and verification.
