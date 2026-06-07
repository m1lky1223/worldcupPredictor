# RFC 0001: Application Architecture

## Status

Draft

## Context

We are building a 2026 World Cup predictor product. The PRD defines the user-facing product scope: match predictions, tournament dashboard, team/player tracking, post-match updates, odds comparison, and model performance tracking.

This RFC proposes the initial technical architecture needed to support that product. The system must ingest tournament data, update after completed matches, preserve historical predictions, serve a responsive web UI, and expose agent-accessible MCP tools/resources with renderable UI widgets.

## Goals

- Define the first implementation architecture.
- Separate UI, API, background processing, and persistence responsibilities.
- Support frequent match and odds updates during tournament windows.
- Preserve prediction and rating history for auditability.
- Keep prediction logic reusable across API and worker processes.
- Expose a remote MCP interface so agent clients and CLIs can query the deployed system.
- Expose AI-renderable UI widgets through the MCP interface for compatible AI tools.
- Ensure the full system can run locally inside Docker.
- Allow future growth into Module Federation without requiring it for MVP.

## Non-Goals

- Choose the final paid data provider.
- Define the complete database schema.
- Define the final prediction algorithm.
- Introduce Module Federation in MVP.
- Implement saved picks, private groups, or leaderboards beyond the minimum identity support needed for Google login.
- Build a gambling or betting-advice product.

## Local Development Requirement

The complete application must be runnable locally inside Docker.

Local Docker should include:

```text
web
api
worker
postgres
redis
```

Local Docker may also include optional support services:

```text
mailpit or similar local email sink, if auth/email is added
mock-provider service, if provider APIs need to be simulated
adminer, pgadmin, or another local database inspection tool
```

The local environment should support:

- Running the Modern.js UI.
- Running the Apollo GraphQL API.
- Running the Web MCP server over Streamable HTTP from the web app.
- Running the worker service.
- Running Postgres and Redis.
- Applying database migrations.
- Loading seed data for fixtures, teams, squads, predictions, and sample odds.
- Running jobs against either real provider APIs or local fixture/mock data.
- Running automated tests without requiring cloud services.
- Using local agent clients against the MCP endpoint.

Expected local endpoints:

```text
http://localhost:3000          web
http://localhost:3000/api/mcp  MCP Streamable HTTP endpoint
http://localhost:4000/graphql  GraphQL API
localhost:5432                 Postgres
localhost:6379                 Redis
```

Exact ports can change if needed, but they must be documented and configurable.

Local Docker should be treated as the primary onboarding path for engineering work.

## Proposed Architecture

```text
Modern.js Web App
  -> Apollo Client
  -> user-facing UI
  -> Web MCP Streamable HTTP endpoint at /api/mcp
  -> AI-renderable MCP/App UI widgets
  -> all data access goes through GraphQL

Apollo GraphQL API
  -> read/query layer
  -> product mutations if needed
  -> Google-authenticated sessions for protected user/admin actions if needed

Worker Service
  -> provider polling
  -> fixture/team/player sync
  -> completed-match finalization
  -> rating updates
  -> prediction recalculation
  -> odds sync

Postgres
  -> normalized tournament data
  -> rating snapshots
  -> prediction versions
  -> odds history
  -> provider identity mapping

Redis
  -> job queue
  -> job locks
  -> short-lived cache

External Providers
  -> fixtures
  -> teams
  -> squads
  -> match status
  -> player/team stats
  -> ratings/rankings
  -> market odds
```

## Technology Choices

### Frontend

- Modern.js.
- React.
- TypeScript.
- Apollo Client.
- ECharts or Recharts for visualizations.

Rationale:

- Modern.js keeps the UI in the React ecosystem without using Next.js.
- Apollo Client pairs naturally with the proposed GraphQL API.
- The product requires nested, view-specific data such as match, teams, players, predictions, odds, and rating changes.

### API

- Apollo GraphQL API.
- Node.js.
- TypeScript.
- Fastify integration if needed for HTTP performance and plugin ecosystem.

Rationale:

- GraphQL fits the UI's nested data needs.
- TypeScript allows shared contracts between UI, API, worker, and prediction packages.
- Apollo has mature tooling for schema development, caching, and client integration.

### Agent Interface

- Web MCP server hosted inside the Modern.js web app.
- Streamable HTTP transport for deployed access.
- Renderable UI resources/widgets for compatible AI tools.
- Optional stdio bridge for local CLI clients that do not support remote MCP directly.
- TypeScript MCP SDK or compatible implementation.

Rationale:

- The product should be accessible to agent workflows after deployment, not only to the web UI.
- MCP provides a standard tool/resource interface for AI clients.
- Streamable HTTP is the appropriate transport for a remote, multi-client MCP server.
- UI resources let compatible AI tools render focused product surfaces rather than plain text only.
- A stdio bridge can preserve compatibility with CLIs that only launch local MCP subprocesses.

### Worker

- Node.js.
- TypeScript.
- BullMQ.
- Redis.

Rationale:

- The product needs scheduled polling and post-match processing.
- BullMQ is sufficient for MVP job orchestration.
- Redis can support queueing, locks, and short-lived cache.

### Database

- Postgres.
- Drizzle.

Rationale:

- The domain is relational: teams, players, matches, groups, predictions, odds, and snapshots.
- Postgres gives reliable querying, constraints, and historical audit storage.

## Suggested Monorepo Layout

```text
apps/
  web/                 Modern.js UI
  api/                 Apollo GraphQL API
  worker/              polling and rating updates

packages/
  domain/              shared domain types and constants
  prediction-engine/   ratings and probability logic
  data-providers/      provider clients and normalization
  ui/                  shared UI components
  config/              shared lint, tsconfig, and tooling

infra/
  docker/              Dockerfiles and local service configuration
  compose/             Docker Compose files
  seed/                local seed data and fixture snapshots
```

## MCP and AI-Renderable UI Interface

The deployed system should include a Web MCP server inside the Modern.js web app so external agent clients and CLI-based agents can query tournament context through a standard protocol.

The MCP server should not replace the GraphQL API. It should be an agent-oriented facade over GraphQL. The web app, including MCP tools/resources/widgets, must not perform direct database reads.

### Transport

Primary transport:

```text
Streamable HTTP
```

Local compatibility option:

```text
stdio bridge/proxy
```

The remote MCP endpoint can be exposed at a stable URL such as:

```text
https://app.example.com/api/mcp
```

The stdio bridge can be a small local package or command that forwards JSON-RPC messages between a local CLI and the remote Streamable HTTP MCP endpoint.

For local Docker, the MCP endpoint should be reachable at:

```text
http://localhost:3000/api/mcp
```

Agent CLIs running on the host machine should be able to connect to this local endpoint. Agent CLIs running inside another container should connect through the Docker Compose service name.

### MCP Resources

Initial resources:

```text
worldcup://matches
worldcup://matches/{matchId}
worldcup://teams
worldcup://teams/{teamId}
worldcup://players
worldcup://players/{playerId}
worldcup://groups
worldcup://bracket
worldcup://model/metrics
worldcup://providers/freshness
```

Resource payloads should be concise and agent-friendly. They should include timestamps and data freshness where relevant.

### Renderable UI Resources

Compatible AI tools should be able to render focused product UI from MCP tool calls.

Initial UI resources:

```text
ui://worldcup/dashboard-summary
ui://worldcup/match-card
ui://worldcup/match-detail
ui://worldcup/team-profile
ui://worldcup/player-profile
ui://worldcup/group-table
ui://worldcup/bracket-preview
ui://worldcup/model-metrics
```

The UI resources should be self-contained HTML/CSS/JavaScript widgets that render in a sandboxed iframe in compatible hosts.

Tool descriptors should attach renderable UI metadata where supported:

```text
_meta.ui.resourceUri              MCP Apps-style UI resource link
_meta["openai/outputTemplate"]    OpenAI Apps SDK compatibility link
```

The server should prefer static templates plus structured tool output:

- The MCP resource defines the visual template.
- The MCP tool returns `structuredContent` for model-visible data and widget input.
- Widget-only metadata may be returned in `_meta` when supported by the host.
- Widgets should use the same visual language as the Modern.js app.
- Widgets must not fetch directly from Postgres or external providers.
- Widgets should rely on the MCP tool result or GraphQL-backed MCP calls.

Renderable widgets are not a replacement for the full web app. They are compact surfaces for AI-hosted workflows, such as a match prediction card, team form summary, group table, or model performance panel.

### MCP Tools

Initial tools:

```text
get_matches
get_match_detail
get_team
get_player
get_group_table
get_bracket_projection
get_match_prediction
compare_prediction_to_market
get_model_metrics
get_data_freshness
```

Tools that should return renderable UI when the host supports it:

```text
get_matches                    ui://worldcup/dashboard-summary
get_match_detail               ui://worldcup/match-detail
get_match_prediction           ui://worldcup/match-card
get_team                       ui://worldcup/team-profile
get_player                     ui://worldcup/player-profile
get_group_table                ui://worldcup/group-table
get_bracket_projection         ui://worldcup/bracket-preview
get_model_metrics              ui://worldcup/model-metrics
```

Potential admin tools, protected separately:

```text
refresh_match
refresh_odds
trigger_prediction_recalc
```

Admin tools should require elevated authorization and should not be exposed to public/anonymous clients.

### MCP Prompts

Potential prompts:

```text
summarize_match_prediction
explain_prediction_change
summarize_team_form
compare_two_teams
explain_model_performance
```

Prompts should produce compact, source-aware summaries that agents can reuse in conversations or reports.

### Access Control

MCP access should support:

- Read-only public or token-protected mode for normal tournament queries.
- Token-protected admin mode for refresh/recalculation tools.
- Rate limits per API key or client.
- Audit logs for tool calls.

The MCP server must not expose provider API keys, raw licensed data beyond allowed terms, or internal-only operational details.

## Authentication and Authorization

Interactive user authentication should use Google login.

Authentication requirements:

- Use Google OAuth 2.0 / OpenID Connect for browser-based login.
- Do not implement password-based login in MVP.
- Store application user records keyed by Google's stable subject identifier.
- Store email and profile metadata only as needed for product features.
- Use secure HTTP-only cookies for browser sessions.
- Support logout and session expiration.
- Support local Docker development without requiring every developer to configure Google credentials.

Local auth modes:

```text
google
dev
```

`google` mode uses real Google OAuth credentials.

`dev` mode provides a seeded local user/admin identity for Docker development and automated tests.

Authorization roles:

```text
anonymous
user
admin
service_agent
```

Initial access model:

- Anonymous users can access public read-only tournament data if the product remains public.
- Authenticated users can access user-specific features if saved picks, groups, or preferences are added.
- Admin users can access protected operational actions.
- Service agents can access MCP/API surfaces through scoped tokens.

MCP authentication:

- Agent and CLI access should use scoped bearer tokens or API keys, not interactive Google login.
- Tokens should be issued to either a Google-authenticated user or an internal service identity.
- MCP tokens should be scoped separately for read-only tools and admin tools.
- Admin MCP tools must require explicit admin/service scopes.

GraphQL authentication:

- Public read-only GraphQL queries may be allowed if the product is public.
- User-specific mutations require a valid Google-authenticated session.
- Admin mutations require an admin role.
- Service-to-service access should use scoped service credentials, not browser sessions.

## GraphQL API Shape

The GraphQL API should serve product views rather than exposing raw provider structures.

Core query areas:

```text
dashboard
matches
match detail
teams
team detail
players
player detail
groups
bracket
model metrics
odds
```

Initial schema sketch:

```graphql
type Match {
  id: ID!
  kickoffAt: DateTime!
  status: MatchStatus!
  venue: Venue
  homeTeam: Team
  awayTeam: Team
  score: Score
  prediction: MatchPrediction
  odds: [MarketOdds!]!
  events: [MatchEvent!]!
  playerPerformances: [PlayerMatchPerformance!]!
}

type Team {
  id: ID!
  name: String!
  code: String!
  group: Group
  rating: TeamRating
  squad: [Player!]!
  matches: [Match!]!
}

type Player {
  id: ID!
  name: String!
  position: String!
  team: Team!
  baseRating: Float
  currentRating: Float
  formRating: Float
  performances: [PlayerMatchPerformance!]!
}

type MatchPrediction {
  id: ID!
  createdAt: DateTime!
  homeWinProbability: Float!
  drawProbability: Float!
  awayWinProbability: Float!
  modelVersion: String!
  explanationFactors: [PredictionFactor!]!
}

type MarketOdds {
  bookmaker: String!
  market: String!
  homePrice: Float
  drawPrice: Float
  awayPrice: Float
  impliedHomeProbability: Float
  impliedDrawProbability: Float
  impliedAwayProbability: Float
  observedAt: DateTime!
}
```

Example dashboard query:

```graphql
query Dashboard {
  todayMatches {
    id
    kickoffAt
    status
    homeTeam { name code }
    awayTeam { name code }
    score { home away }
    prediction {
      homeWinProbability
      drawProbability
      awayWinProbability
    }
  }
  teamRankings {
    team { id name code }
    rating { current previous change }
  }
  modelMetrics {
    accuracy
    brierScore
    logLoss
  }
}
```

## Data Ingestion

The system should use provider adapters that normalize external data into internal domain models.

Selected providers:

- FIFA official schedule and squad data as canonical reference.
- TheStatsAPI for fixtures, squads, lineups, match stats, player stats, and xG.
- The Odds API for odds display and market comparison.
- FIFA rankings or national-team Elo ratings for baseline team strength.

Fallback candidates:

- BALLDONTLIE FIFA API.
- API-Football / API-SPORTS.
- Sportmonks.
- Betfair Exchange API, if exchange-specific market data becomes necessary.

Provider adapters should:

- Map provider IDs to internal IDs.
- Normalize statuses, positions, markets, and team/player identities.
- Preserve provider response metadata.
- Support retries and rate-limit handling.
- Avoid leaking provider-specific shapes into the UI.

## Worker Jobs

Initial jobs:

```text
sync-fixtures
sync-teams
sync-squads
sync-match-statuses
sync-live-match
finalize-match
update-player-ratings
update-team-ratings
recalculate-predictions
sync-odds
calculate-model-metrics
```

Job requirements:

- Jobs must be idempotent.
- Jobs must use locks where duplicate execution would create inconsistent snapshots.
- Jobs must retry transient provider failures.
- Jobs must record provider freshness.
- Completed match snapshots should be immutable.
- Prediction recalculation should append new versions rather than overwrite old predictions.

Polling strategy:

- Before tournament: sync fixtures, squads, and odds several times per day.
- Match day before kickoff: poll relevant fixtures and odds more frequently.
- During live match windows: poll match status every 1 to 5 minutes, subject to provider limits.
- After final whistle: run finalization and rating jobs immediately.
- Off hours: reduce polling frequency.

Local mode:

- Workers must support a local/mock-provider mode.
- Local mode should not require paid provider credentials.
- Local mode should be able to replay sample match status transitions.
- Local mode should support testing the completed-match update loop end to end.

## Prediction Engine

The first prediction engine should be transparent and deterministic.

Initial model inputs:

- Baseline team strength.
- Player quality.
- Expected or confirmed lineups.
- Tournament form.
- Player availability.
- Market odds are not an input in MVP.

Initial weighting proposal:

```text
40% baseline team strength
30% player quality
20% current tournament form
10% player availability
```

Odds are display-only in MVP. They are used for comparison, benchmarking, and calibration analysis, but not for v1 prediction generation.

Historical predictions must store:

- Match ID.
- Prediction timestamp.
- Model version.
- Input snapshot version.
- Team ratings used.
- Player ratings used.
- Odds used, if applicable.
- Predicted probabilities.
- Explanation factors.

## Persistence Principles

Core entities:

- Team.
- Player.
- SquadMembership.
- Venue.
- Group.
- Match.
- MatchEvent.
- PlayerMatchPerformance.
- TeamMatchStats.
- TeamRatingSnapshot.
- PlayerRatingSnapshot.
- MatchPrediction.
- PredictionInputSnapshot.
- MarketOddsSnapshot.
- ProviderSource.
- ProviderRawSnapshot.
- ModelMetric.

Important invariants:

- Internal IDs should be stable and independent of provider IDs.
- Provider-specific IDs should be stored in mapping tables.
- Prediction history should never be overwritten.
- Rating snapshots should be append-only.
- Completed match snapshots should be immutable.
- Provider raw snapshots should be retained where licensing permits.

## Module Federation Strategy

Module Federation 2.0 is a future architecture option, not an MVP requirement.

MVP approach:

- Build one Modern.js app.
- Maintain clean feature boundaries.
- Keep shared UI and domain contracts in packages.

Potential future remotes:

- Matches.
- Teams.
- Players.
- Bracket simulator.
- Model analytics.
- Odds comparison.
- Admin/data tools.

Adopt Module Federation when one or more of these is true:

- Different teams need independent frontend deployment.
- Heavy feature modules need independent loading.
- Admin/private tools should be deployed separately from the public app.
- Plugin-style feature loading becomes a product requirement.

## Security and Compliance

- Do not expose provider API keys to the browser.
- Do not expose provider API keys through MCP tools or resources.
- Store secrets in environment variables or a secret manager.
- Provide `.env.example` files for local Docker configuration.
- Keep real `.env` files out of version control.
- Respect provider licensing and redistribution terms.
- Avoid sportsbook scraping.
- Include clear product language that predictions are informational and not gambling advice.
- If user-specific features are added, revisit privacy, profile retention, account deletion, and export requirements.

## Docker and Environment Configuration

The repository should include Docker configuration sufficient to run the full stack locally.

Expected files:

```text
docker-compose.yml
docker-compose.override.yml, if useful for local-only overrides
.env.example
apps/web/Dockerfile
apps/api/Dockerfile
apps/worker/Dockerfile
```

The Docker setup should support:

- Cold start from a clean checkout.
- Dependency installation.
- Database creation.
- Database migrations.
- Seed data loading.
- Hot reload for web, API, and worker services where feasible.
- Running tests inside containers.
- Switching between mock provider mode and real provider mode.

Required environment categories:

```text
DATABASE_URL
REDIS_URL
GRAPHQL_PORT
WEB_PORT
PROVIDER_MODE
AUTH_MODE
GOOGLE_CLIENT_ID
GOOGLE_CLIENT_SECRET
SESSION_SECRET
THESTATSAPI_KEY, optional for local mock mode
THE_ODDS_API_KEY, optional for local mock mode
```

Provider mode options:

```text
mock
real
hybrid
```

`mock` mode should use local fixtures only.

`real` mode should use configured provider credentials.

`hybrid` mode may use real data for some providers and local fixtures for missing or paid data.

## Observability

Track:

- Provider API failures.
- Provider freshness.
- Job failures and retries.
- Queue depth.
- Match status transitions.
- Match finalization status.
- Prediction recalculation status.
- GraphQL resolver latency.
- MCP tool latency and errors.
- UI errors.
- Data freshness shown to users where relevant.

Operational dashboards should answer:

- Are today's matches fresh?
- Did the latest completed match finalize correctly?
- Are predictions current?
- Are odds current?
- Are provider APIs healthy?
- Are workers falling behind?
- Are MCP clients receiving fresh and authorized data?
- Is the local Docker stack healthy?

## Rollout Plan

1. Scaffold monorepo, web app, API app, MCP app, worker app, and shared packages.
2. Add Docker Compose for web, API, MCP, worker, Postgres, and Redis.
3. Add migrations, seed data, and mock provider mode.
4. Model fixtures, teams, groups, venues, and players.
5. Import fixtures and teams from an initial provider or local seed data.
6. Add baseline predictions and prediction history.
7. Build dashboard and match detail queries.
8. Add read-only remote MCP resources and tools for matches, teams, predictions, and freshness.
9. Add match status polling.
10. Add completed-match finalization.
11. Add rating updates and future prediction recalculation.
12. Add odds integration.
13. Add model metrics.
14. Add optional stdio bridge for local agent CLIs if needed.

## Risks

- Provider coverage may be incomplete or inconsistent.
- Provider terms may restrict raw data retention.
- Player ratings may be noisy or unavailable.
- Odds APIs may have licensing or regional constraints.
- The model may overreact to small tournament sample sizes.
- GraphQL queries can become expensive without resolver batching and caching.
- MCP tools can become an accidental public API if authorization and rate limits are weak.
- Different agent CLIs may support different MCP transports, requiring a bridge or compatibility layer.
- Docker local development can drift from production if configuration is not shared carefully.
- Mock provider data may hide real provider edge cases.
- Starting Module Federation too early could slow MVP delivery.

## Open Questions

- Should the first model be fully heuristic or calibrated against historical tournaments?
- How much raw provider data can be stored under provider terms?
- What is the minimum acceptable data freshness during live match windows?
- Should the remote MCP server be public read-only, token-protected, or both?
- Which agent CLIs must be supported at launch, and do they support Streamable HTTP directly?
- Should admin MCP tools exist in MVP, or should MCP be read-only at launch?
- Which Google Workspace or email domains, if any, should receive admin access by default?
- Should local Docker include a dedicated mock-provider service or keep mock data inside the data provider package?
- Which local seed dataset should be committed for repeatable development?
- When, if ever, should Module Federation be introduced?

## References

- Model Context Protocol transports: https://modelcontextprotocol.io/docs/concepts/transports
