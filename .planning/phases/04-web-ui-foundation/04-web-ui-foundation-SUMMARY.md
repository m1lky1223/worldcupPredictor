---
phase: 04
plan: web-ui-foundation
type: direct-execution
subsystem: web
tags: [react, modernjs, mui, apollo-client, graphql, routing]
key-files:
  created:
    - apps/web/src/apollo.ts
    - apps/web/src/Layout.tsx
    - apps/web/src/pages/Dashboard.tsx
    - apps/web/src/pages/MatchList.tsx
    - apps/web/src/pages/MatchDetail.tsx
    - apps/web/src/pages/Teams.tsx
    - apps/web/src/pages/TeamProfile.tsx
    - apps/web/src/pages/Players.tsx
    - apps/web/src/pages/PlayerProfile.tsx
    - apps/web/src/pages/Groups.tsx
    - apps/web/src/pages/ModelTracker.tsx
  modified:
    - apps/web/src/App.tsx
    - apps/web/package.json
tech-stack:
  added:
    - react-router-dom
    - @mui/icons-material
    - @mui/material (direct dep)
    - @emotion/react (direct dep)
    - @emotion/styled (direct dep)
decisions:
  - Used react-router-dom instead of Modern.js file-based routing for explicit route control
  - Co-located GraphQL gql query strings in page components (no separate fragment files)
  - Shared Layout component with responsive AppBar/Drawer navigation
  - Probability bars use native MUI Stack with colored Box segments (no chart library)
metrics:
  duration: ~25 min
  commits: 8
  total-files-created: 11
  total-files-modified: 3
  build: successful (17.8s)
  typecheck: passes (0 errors)
---

# Phase 4: Web UI Foundation Summary

Built the complete Modern.js web UI with all 8 pages, Apollo Client integration, responsive MUI layout, and routing. The app connects to the GraphQL API at `localhost:4000/graphql` and renders real tournament data with dark mode.

## One-liner

Full Modern.js web UI with 8 pages, Apollo Client GraphQL integration, MUI dark theme, mobile-first responsive layout, and atomic commits per page group.

## Progress

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Foundation: Apollo Client + Layout + Router | `e54a46a` | apollo.ts, Layout.tsx, App.tsx, package.json |
| 2 | Dashboard page | `e4b4dc9` | Dashboard.tsx |
| 3 | Match List + Match Detail pages | `2f16709` | MatchList.tsx, MatchDetail.tsx |
| 4 | Teams + Team Profile pages | `975d472` | Teams.tsx, TeamProfile.tsx |
| 5 | Players + Player Profile pages | `8218069` | Players.tsx, PlayerProfile.tsx |
| 6 | Groups + Model Tracker pages | `4d01dc5` | Groups.tsx, ModelTracker.tsx |
| 7 | Icon dependency | `ef97a68` | package.json |
| 8 | TS strict fixes + MUI dep alignment | `73c05cb`, `e288512` | All pages + package.json |

## Pages Built

### Dashboard (/) — `Dashboard.tsx`
- Queries matches (upcoming 6), all teams, and all group standings
- Match cards with score display, status chips, and click-to-detail
- Top 10 teams by Elo rating table
- Group standings highlights (first 4 groups)
- Responsive 3-column card grid on desktop

### Match List (/matches) — `MatchList.tsx`
- All matches with stage filter dropdown (Group/RoundOf32/RoundOf16/Quarterfinals/Semifinals/Final)
- Match cards with team flags, scores, status chips
- Prediction display with confidence percentage
- Responsive single-column stacked layout

### Match Detail (/matches/:id) — `MatchDetail.tsx`
- Full match header with team info, Elo ratings, group names
- Three-color probability bar (Home Win/Draw/Away Win)
- Prediction confidence badge and timestamp
- Contributing factors with weighted linear progress bars
- Odds comparison table across bookmakers
- Navigation back to match list and to team profiles

### Teams (/teams) — `Teams.tsx`
- Full league table of all qualified teams
- Sorted by Elo rating (descending)
- Flag icons, group chips, rank numbers
- Clickable rows to team profiles

### Team Profile (/teams/:id) — `TeamProfile.tsx`
- Team header with large flag, name, group chip, Elo badge
- Player roster filtered by team
- Player position chips, influence scores
- Clickable rows to player profiles

### Players (/players) — `Players.tsx`
- Player leaderboard ranked by influence score
- Position chips, team affiliation with flags
- Paginated display (up to 200 players)

### Player Profile (/players/:id) — `PlayerProfile.tsx`
- Player name, position, influence score
- Team affiliation card with flag, group, Elo
- Navigation to team profile

### Groups (/groups) — `Groups.tsx`
- Full group standings tables for all 12 groups
- W/D/L/GF/GA/GD/Pts columns
- Qualified/eliminated visual indicators (green/red text)
- Responsive 2-column grid on desktop

### Model Tracker (/model) — `ModelTracker.tsx`
- Metric cards: Accuracy (%), Brier Score, Log Loss
- Color-coded linear progress bars per metric
- Calibration chart with bin-level linear progress bars
- Model version and last-calculated timestamp

## Deviations from Plan

None — plan executed as written.

## Quality Gates

| Gate | Result |
|------|--------|
| TypeScript strict (`tsc --noEmit`) | ✅ Pass (0 errors) |
| Modern.js production build | ✅ Pass (17.8s, 1.3MB output) |
| Mobile-first responsive layout | ✅ MUI Grid/Stack with breakpoints |
| Co-located GraphQL fragments | ✅ gql queries in each page component |
| MUI components only (no Tailwind) | ✅ Consistent dark theme |

## Self-Check: PASSED

- All 11 source files exist and are verified
- All 8 commits exist in git log
- TypeScript strict mode compiles with 0 errors
- Modern.js production build completes successfully
