# Graph Report - worldcupPredictor  (2026-06-07)

## Corpus Check
- 24 files · ~15,138 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 240 nodes · 221 edges · 23 communities (19 shown, 4 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `345d15ac`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- [[_COMMUNITY_Community 0|Community 0]]
- [[_COMMUNITY_Community 1|Community 1]]
- [[_COMMUNITY_Community 2|Community 2]]
- [[_COMMUNITY_Community 3|Community 3]]
- [[_COMMUNITY_Community 4|Community 4]]
- [[_COMMUNITY_Community 5|Community 5]]
- [[_COMMUNITY_Community 6|Community 6]]
- [[_COMMUNITY_Community 7|Community 7]]
- [[_COMMUNITY_Community 8|Community 8]]
- [[_COMMUNITY_Community 9|Community 9]]
- [[_COMMUNITY_Community 10|Community 10]]
- [[_COMMUNITY_Community 11|Community 11]]
- [[_COMMUNITY_Community 12|Community 12]]
- [[_COMMUNITY_Community 13|Community 13]]
- [[_COMMUNITY_Community 14|Community 14]]
- [[_COMMUNITY_Community 15|Community 15]]
- [[_COMMUNITY_Community 16|Community 16]]
- [[_COMMUNITY_Community 17|Community 17]]
- [[_COMMUNITY_Community 18|Community 18]]
- [[_COMMUNITY_Community 19|Community 19]]
- [[_COMMUNITY_Community 20|Community 20]]
- [[_COMMUNITY_Community 21|Community 21]]
- [[_COMMUNITY_Community 22|Community 22]]

## God Nodes (most connected - your core abstractions)
1. `RFC 0001: Application Architecture` - 24 edges
2. `2026 World Cup Predictor - Product Requirements` - 18 edges
3. `ROADMAP.md — 2026 World Cup Predictor` - 15 edges
4. `Functional Requirements` - 10 edges
5. `AGENTS.md — 2026 World Cup Predictor` - 10 edges
6. `Coding Conventions` - 9 edges
7. `Application Architecture — 2026 World Cup Predictor` - 9 edges
8. `7. MVP Scope` - 9 edges
9. `PROJECT.md — 2026 World Cup Predictor` - 8 edges
10. `STATE.md — 2026 World Cup Predictor` - 7 edges

## Surprising Connections (you probably didn't know these)
- None detected - all connections are within the same source files.

## Import Cycles
- None detected.

## Communities (23 total, 4 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.07
Nodes (26): Phase 10 — Observability & Operational Hardening, Phase 11 — Pre-Launch QA & Data Seeding, Phase 1 — Monorepo & Local Infrastructure, Phase 2 — Domain Schema & Provider Adapters, Phase 3 — GraphQL API Core, Phase 4 — Web UI Foundation, Phase 5 — Prediction Engine, Phase 6 — Worker: Polling, Finalization & Rating Updates (+18 more)

### Community 1 - "Community 1"
Cohesion: 0.09
Nodes (22): 1. Bounded Contexts, 1. Modern.js Web App (`apps/web`), 2. Apollo GraphQL API (`apps/api`), 2. Domain Objects (Aggregates, Entities, and Value Objects), 3. Background Worker (`apps/worker`), 3. Domain Services, 4. Anti-Corruption Layer (ACL), A. Tournament Context (+14 more)

### Community 2 - "Community 2"
Cohesion: 0.09
Nodes (22): Authentication and Authorization, Context, Data Ingestion, Docker and Environment Configuration, Goals, GraphQL API Shape, Local Development Requirement, Module Federation Strategy (+14 more)

### Community 3 - "Community 3"
Cohesion: 0.11
Nodes (17): 10. Odds and Market Comparison, 11. Authentication, 12. Data Expectations, 13. UX Principles, 14. Success Metrics, 15. Risks, 16. Open Product Decisions, 17. Launch Criteria (+9 more)

### Community 4 - "Community 4"
Cohesion: 0.12
Nodes (15): commit_docs, granularity, mode, model_profile, parallelization, plan_review, source_grounding, ship (+7 more)

### Community 5 - "Community 5"
Cohesion: 0.13
Nodes (14): F1 — Monorepo & Infrastructure, F2 — Database Schema, F3 — Data Ingestion, F4 — Worker Jobs, F5 — Prediction Engine, F6 — GraphQL API, F7 — Web UI, F8 — Remote MCP Server (+6 more)

### Community 6 - "Community 6"
Cohesion: 0.14
Nodes (13): Agent Context Profiles, AGENTS.md — 2026 World Cup Predictor, Architecture, Beads Issue Tracker, Directory Structure, Environment Variables, Key Product Rules, Project Overview (+5 more)

### Community 7 - "Community 7"
Cohesion: 0.17
Nodes (11): Active, Context, Core Value, Evolution, Key Decisions, Out of Scope (MVP), PROJECT.md — 2026 World Cup Predictor, Requirements (+3 more)

### Community 8 - "Community 8"
Cohesion: 0.18
Nodes (10): 1. Single Source of Truth: `AGENTS.md`, 2. Task Tracking with Beads (`bd`), 3. GSD (Getting Stuff Done) Planning, 4. Local Development Stack & Endpoints, 5. Agent Best Practices, Active Ports:, AI Notes — 2026 World Cup Predictor, Common Beads Commands: (+2 more)

### Community 9 - "Community 9"
Cohesion: 0.22
Nodes (9): API & Data Fetching, Coding Conventions, Components, Data & Types, General, Git, Prediction Engine, Styling & UI Components (+1 more)

### Community 10 - "Community 10"
Cohesion: 0.22
Nodes (8): Beads - AI-Native Issue Tracking, Essential Commands, Get Started with Beads, Learn More, Quick Start, What is Beads?, Why Beads?, Working with Issues

### Community 11 - "Community 11"
Cohesion: 0.22
Nodes (9): 7.1 Dashboard, 7.2 Matches, 7.3 Match Detail, 7.4 Teams, 7.5 Players, 7.6 Groups, 7.7 Bracket, 7.8 Model Tracker (+1 more)

### Community 12 - "Community 12"
Cohesion: 0.25
Nodes (7): Active Blockers, Current Phase, Last Action, Notes, Phase History, STATE.md — 2026 World Cup Predictor, Status

### Community 13 - "Community 13"
Cohesion: 0.29
Nodes (6): Beads, Core CLI Workflow, First Step, Preferred Route, Rules, What Belongs In Beads

### Community 14 - "Community 14"
Cohesion: 0.29
Nodes (7): Access Control, MCP and AI-Renderable UI Interface, MCP Prompts, MCP Resources, MCP Tools, Renderable UI Resources, Transport

### Community 15 - "Community 15"
Cohesion: 0.33
Nodes (5): backend, database, dolt_database, dolt_mode, project_id

### Community 16 - "Community 16"
Cohesion: 0.33
Nodes (5): hooks, PostCompact, PreCompact, SessionStart, UserPromptSubmit

### Community 17 - "Community 17"
Cohesion: 0.33
Nodes (6): Agent Interface, API, Database, Frontend, Technology Choices, Worker

### Community 18 - "Community 18"
Cohesion: 0.50
Nodes (3): npx, mui-mcp, @mui/mcp

## Knowledge Gaps
- **176 isolated node(s):** `last_dolt_commit`, `timestamp`, `database`, `backend`, `dolt_mode` (+171 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **4 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `RFC 0001: Application Architecture` connect `Community 2` to `Community 17`, `Community 14`?**
  _High betweenness centrality (0.020) - this node is a cross-community bridge._
- **Why does `2026 World Cup Predictor - Product Requirements` connect `Community 3` to `Community 11`?**
  _High betweenness centrality (0.010) - this node is a cross-community bridge._
- **What connects `last_dolt_commit`, `timestamp`, `database` to the rest of the system?**
  _176 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.07407407407407407 - nodes in this community are weakly interconnected._
- **Should `Community 1` be split into smaller, more focused modules?**
  _Cohesion score 0.08695652173913043 - nodes in this community are weakly interconnected._
- **Should `Community 2` be split into smaller, more focused modules?**
  _Cohesion score 0.08695652173913043 - nodes in this community are weakly interconnected._
- **Should `Community 3` be split into smaller, more focused modules?**
  _Cohesion score 0.1111111111111111 - nodes in this community are weakly interconnected._