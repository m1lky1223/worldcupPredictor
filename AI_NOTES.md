# AI Notes — 2026 World Cup Predictor

This file provides critical context, workflows, and tools for AI agents (and human developers collaborating with agents) working on the 2026 World Cup Predictor application.

---

## 1. Single Source of Truth: `AGENTS.md`

All coding conventions, stack descriptions, product rules, and environment variables are documented in [AGENTS.md](file:///Users/rony/dev/worldcupPredictor/AGENTS.md). 

### Key Ground Rules to Keep in Mind:
*   **Material UI (MUI) Design System:** Use [Material UI](https://mui.com/material-ui/) for all UI components and styling, utilizing a custom theme configured via MUI ThemeProvider. Do not use Tailwind CSS. Avoid custom CSS or stylesheets unless absolutely necessary, leveraging the MUI design system properly (via theme overrides, the `sx` prop, or the `styled()` helper).
*   **TypeScript Strict Mode:** Absolutely no `any` types unless documented and verified.
*   **Predictions:** Always output probabilistic ranges (`homeWin`, `draw`, `awayWin`), never definitive winners. Old predictions must be **appended with timestamps**, never overwritten.
*   **Odds Presentation:** Odds are strictly display-only. Present them neutrally and fail gracefully (hide the section) if they are unavailable.
*   **Data Isolation (No Direct DB Reads):** The web application (including the integrated Web MCP Server) performs absolutely no direct database queries. All data access must go through the Apollo GraphQL API (`apps/api`) to ensure a single, consistent data boundary.
*   **AI-Renderable UI:** Key MCP tools should return structured data plus compact renderable UI widgets for compatible AI hosts. Widgets must use GraphQL-backed MCP data and never query the database directly.
*   **Domain-Driven Design (DDD):** Adhere to clean DDD separation. Use Aggregates, Entities, and Value Objects. Treat `packages/data-providers` as an Anti-Corruption Layer (ACL) mapping external structures to internal domains, and `packages/prediction-engine` as a pure, side-effect-free Domain Service.

---

## 2. Task Tracking with Beads (`bd`)

We use **Beads (bd)**, a Dolt-backed issue tracker, as our single source of truth for task progress. 

> [!IMPORTANT]
> **Do not use markdown task lists, `task.md`, or `MEMORY.md` files.** Always use the `bd` CLI tool.

### Common Beads Commands:
*   `bd ready` — List available tasks that are unblocked.
*   `bd status` — View the current issue status.
*   `bd create --title="Title" --type=task` — Create a new issue/task.
*   `bd update <id> --claim` — Claim a task before beginning implementation.
*   `bd close <id> --reason="Reason"` — Close a task when completed.
*   `bd remember "context"` — Save persistent context/learnings for the repo.
*   `bd memories` — Retrieve saved context/learnings.
*   `bd prime` — Refresh beads workflow context and view full CLI reference.

---

## 3. GSD (Getting Stuff Done) Planning

This project uses the GSD framework for high-level roadmap and project status tracking. The files are located in [.planning/](file:///Users/rony/dev/worldcupPredictor/.planning/):

*   [PROJECT.md](file:///Users/rony/dev/worldcupPredictor/.planning/PROJECT.md): General project definition and key decisions (Drizzle, TheStatsAPI, display-only odds).
*   [REQUIREMENTS.md](file:///Users/rony/dev/worldcupPredictor/.planning/REQUIREMENTS.md): Functional and non-functional requirements categorized from `F1` to `F9`.
*   [ROADMAP.md](file:///Users/rony/dev/worldcupPredictor/.planning/ROADMAP.md): Outline of the 11 sequential phases from infra to post-launch maintenance.
*   [STATE.md](file:///Users/rony/dev/worldcupPredictor/.planning/STATE.md): Tracks active blockers and the current phase.

---

## 4. Local Development Stack & Endpoints

You can spin up the full local environment using Docker Compose:

```bash
docker compose up
```

### Active Ports:
*   **Web Frontend & Web MCP:** [http://localhost:3000](http://localhost:3000) (Modern.js UI & `/api/mcp` Streamable HTTP endpoint)
*   **GraphQL API:** [http://localhost:4000/graphql](http://localhost:4000/graphql) (Apollo API)
*   **PostgreSQL:** `localhost:5432`
*   **Redis:** `localhost:6379` (BullMQ queues)

### Local MCP Configuration:
*   **[mcp.json](file:///Users/rony/dev/worldcupPredictor/mcp.json):** Configures local MCP servers for compatible IDE/agent hosts. Currently configures the `mui-mcp` helper (`npx -y @mui/mcp@latest`) to assist with proper Material UI component selections and documentation.

---

## 5. Agent Best Practices

When operating inside this repository:
1.  **Check Knowledge Items (KIs):** Review KI summaries in the conversation header before beginning research or writing logic.
2.  **Verify Code Files:** Before modifying a file, view it first to ensure you have the latest code context rather than relying on stale cached summaries.
3.  **Atomic Git Commits:** Write clean, structured commit messages prefixing the type (e.g. `feat:`, `fix:`, `docs:`, `style:`, `test:`, `chore:`, `data:`). Keep changes focused.
4.  **No Direct Pushes:** Unless configured as `team-maintainer` and explicitly requested, do not run `git commit`, `git push`, or `bd dolt push` without confirming with the user.
