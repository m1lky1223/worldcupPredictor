import http from "http";
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
  ListPromptsRequestSchema,
  GetPromptRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { eq, and, desc, asc, sql } from "drizzle-orm";
import { db, schemas as s } from "@worldcup/domain";

// 1. Initialize MCP Server
export const mcpServer = new Server(
  {
    name: "worldcup-mcp",
    version: "1.0.0",
  },
  {
    capabilities: {
      resources: {},
      tools: {},
      prompts: {},
    },
  }
);

// 2. Token Auth & Rate Limiting Configurations
const MCP_TOKEN = process.env.MCP_TOKEN || "dev-token";
const rateLimits = new Map<string, { count: number; resetTime: number }>();

function authenticate(req: http.IncomingMessage): boolean {
  const url = new URL(req.url || "", `http://${req.headers.host || "localhost"}`);
  const queryToken = url.searchParams.get("token") || url.searchParams.get("auth");
  if (queryToken === MCP_TOKEN) return true;

  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    return authHeader.substring(7) === MCP_TOKEN;
  }
  return false;
}

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const limit = rateLimits.get(ip);
  if (!limit || now > limit.resetTime) {
    rateLimits.set(ip, { count: 1, resetTime: now + 60000 });
    return true;
  }
  if (limit.count >= 100) return false;
  limit.count++;
  return true;
}

function logAudit(action: string, details: any) {
  console.log(
    `[AUDIT] ${new Date().toISOString()} - Action: ${action} - Details: ${JSON.stringify(details)}`
  );
}

// 3. FIFA Tiebreaker Helper Logic (extracted from apps/api/src/schema/group.ts)
interface RawTeamStats {
  teamId: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
}

function computeTeamStats(
  matchesList: any[],
  teamIds: string[]
): RawTeamStats[] {
  const statsMap = new Map<string, RawTeamStats>();
  for (const teamId of teamIds) {
    statsMap.set(teamId, {
      teamId,
      played: 0,
      won: 0,
      drawn: 0,
      lost: 0,
      goalsFor: 0,
      goalsAgainst: 0,
    });
  }

  function ensureStats(teamId: string): RawTeamStats {
    let stats = statsMap.get(teamId);
    if (!stats) {
      stats = { teamId, played: 0, won: 0, drawn: 0, lost: 0, goalsFor: 0, goalsAgainst: 0 };
      statsMap.set(teamId, stats);
    }
    return stats;
  }

  for (const match of matchesList) {
    if (
      match.homeScore === null ||
      match.awayScore === null ||
      match.homeTeamId === null ||
      match.awayTeamId === null
    ) {
      continue;
    }
    const home = ensureStats(match.homeTeamId);
    const away = ensureStats(match.awayTeamId);

    home.played++;
    away.played++;
    home.goalsFor += match.homeScore;
    home.goalsAgainst += match.awayScore;
    away.goalsFor += match.awayScore;
    away.goalsAgainst += match.homeScore;

    if (match.homeScore > match.awayScore) {
      home.won++;
      away.lost++;
    } else if (match.homeScore < match.awayScore) {
      home.lost++;
      away.won++;
    } else {
      home.drawn++;
      away.drawn++;
    }
  }
  return Array.from(statsMap.values());
}

function h2hGDForTeam(team: string, opponent: string, matchesList: any[]): number {
  for (const match of matchesList) {
    if (match.homeScore === null || match.awayScore === null) continue;
    if (
      (match.homeTeamId === team && match.awayTeamId === opponent) ||
      (match.homeTeamId === opponent && match.awayTeamId === team)
    ) {
      return match.homeTeamId === team
        ? match.homeScore - match.awayScore
        : match.awayScore - match.homeScore;
    }
  }
  return 0;
}

function findTiedTeams(stats: RawTeamStats[]): string[][] {
  const pointGroups = new Map<number, string[]>();
  for (const s of stats) {
    const pts = s.won * 3 + s.drawn;
    const group = pointGroups.get(pts) ?? [];
    group.push(s.teamId);
    pointGroups.set(pts, group);
  }
  return Array.from(pointGroups.values()).filter((g) => g.length > 1);
}

function buildStandingsEntries(stats: RawTeamStats[], tiedGroups: string[][]) {
  return stats.map((s) => {
    const pts = s.won * 3 + s.drawn;
    const tiedWith = tiedGroups
      .filter((g) => g.includes(s.teamId))
      .flat()
      .filter((tid) => tid !== s.teamId);

    return {
      teamId: s.teamId,
      points: pts,
      goalDifference: s.goalsFor - s.goalsAgainst,
      goalsFor: s.goalsFor,
      teamIdsTied: tiedWith,
    };
  });
}

function sortStandings(entries: any[], matchesList: any[]): string[] {
  return entries
    .slice()
    .sort((a, b) => {
      if (a.points !== b.points) return b.points - a.points;
      if (a.goalDifference !== b.goalDifference) return b.goalDifference - a.goalDifference;
      if (a.goalsFor !== b.goalsFor) return b.goalsFor - a.goalsFor;

      const aTied = a.teamIdsTied ?? [];
      const isTwoTeamTie = aTied.length === 1 && aTied[0] === b.teamId;
      if (isTwoTeamTie) {
        const gdA = h2hGDForTeam(a.teamId, aTied[0], matchesList);
        const gdB = -gdA;
        if (gdA !== gdB) return gdB - gdA;
      }
      return a.teamId < b.teamId ? -1 : 1;
    })
    .map((e) => e.teamId);
}

async function getGroupStandingsInternal(groupName?: string) {
  const allTeams = await db.select().from(s.teams).orderBy(s.teams.groupName);
  const groupNames = groupName
    ? [groupName]
    : [...new Set(allTeams.map((t) => t.groupName))].sort();

  const results = [];
  for (const gn of groupNames) {
    const groupTeams = allTeams.filter((t) => t.groupName === gn);
    const teamIds = groupTeams.map((t) => t.id);
    if (teamIds.length === 0) continue;

    const allGroupMatches = await db
      .select()
      .from(s.matches)
      .where(eq(s.matches.stage, "Group"));

    const groupMatches = allGroupMatches.filter(
      (m) =>
        m.homeTeamId !== null &&
        m.awayTeamId !== null &&
        teamIds.includes(m.homeTeamId) &&
        teamIds.includes(m.awayTeamId)
    );

    const completedMatches = groupMatches.filter(
      (m) => m.status === "Completed" && m.homeScore !== null && m.awayScore !== null
    );

    const stats = computeTeamStats(completedMatches, teamIds);
    const tiedGroups = findTiedTeams(stats);
    const entries = buildStandingsEntries(stats, tiedGroups);
    const sortedTeamIds = sortStandings(entries, completedMatches);

    const teamMap = new Map(groupTeams.map((t) => [t.id, t]));
    const standings = sortedTeamIds.map((tid, idx) => {
      const st = stats.find((x) => x.teamId === tid)!;
      const pts = st.won * 3 + st.drawn;
      const position = idx + 1;
      return {
        team: teamMap.get(tid)!,
        played: st.played,
        won: st.won,
        drawn: st.drawn,
        lost: st.lost,
        goalsFor: st.goalsFor,
        goalsAgainst: st.goalsAgainst,
        goalDifference: st.goalsFor - st.goalsAgainst,
        points: pts,
        position,
        qualified: position <= 2,
        eliminated: position === teamIds.length,
      };
    });

    results.push({
      groupName: gn,
      standings,
    });
  }
  return results;
}

// Helper to format match output cleanly
function formatMatch(match: any, homeTeam: any, awayTeam: any, prediction: any) {
  return {
    id: match.id,
    matchNumber: match.matchNumber,
    kickoffTime: match.kickoffTime,
    stage: match.stage,
    status: match.status,
    score: match.status !== "Scheduled" ? { home: match.homeScore, away: match.awayScore } : null,
    homeTeam: homeTeam ? { id: homeTeam.id, name: homeTeam.name, elo: homeTeam.eloRating } : null,
    awayTeam: awayTeam ? { id: awayTeam.id, name: awayTeam.name, elo: awayTeam.eloRating } : null,
    prediction: prediction
      ? {
          homeWin: prediction.homeWin,
          draw: prediction.draw,
          awayWin: prediction.awayWin,
          confidence: prediction.confidence,
        }
      : null,
  };
}

// 4. Implement MCP Resources Capability
mcpServer.setRequestHandler(ListResourcesRequestSchema, async () => {
  logAudit("list_resources", {});
  return {
    resources: [
      {
        uri: "matches",
        name: "World Cup Matches",
        mimeType: "application/json",
        description: "List of all matches in the tournament",
      },
      {
        uri: "teams",
        name: "World Cup Teams",
        mimeType: "application/json",
        description: "List of all 48 participating teams and their Elo ratings",
      },
      {
        uri: "players",
        name: "Player Leaderboard",
        mimeType: "application/json",
        description: "Leaderboard of players sorted by influence scores",
      },
      {
        uri: "groups",
        name: "Group Standings",
        mimeType: "application/json",
        description: "FIFA tiebreaker standings for all groups",
      },
      {
        uri: "bracket",
        name: "Knockout Bracket Projection",
        mimeType: "application/json",
        description: "List of knockout matches and projected matchups",
      },
      {
        uri: "model/metrics",
        name: "Prediction Model Performance Metrics",
        mimeType: "application/json",
        description: "Accuracy, Brier score, log loss, and calibration data",
      },
      {
        uri: "freshness",
        name: "Data Provider Freshness Status",
        mimeType: "application/json",
        description: "Metadata on last successful sync times",
      },
    ],
  };
});

mcpServer.setRequestHandler(ReadResourceRequestSchema, async (request) => {
  const uri = request.params.uri;
  logAudit("read_resource", { uri });

  if (uri === "matches") {
    const allMatches = await db.select().from(s.matches).orderBy(s.matches.matchNumber);
    const allTeams = await db.select().from(s.teams);
    const teamMap = new Map(allTeams.map((t) => [t.id, t]));

    const result = allMatches.map((m) => {
      const home = m.homeTeamId ? teamMap.get(m.homeTeamId) : null;
      const away = m.awayTeamId ? teamMap.get(m.awayTeamId) : null;
      return formatMatch(m, home, away, null);
    });
    return {
      contents: [{ uri, mimeType: "application/json", text: JSON.stringify(result, null, 2) }],
    };
  }

  const matchDetailMatch = uri.match(/^matches\/(\d+)$/);
  if (matchDetailMatch) {
    const matchId = Number(matchDetailMatch[1]);
    const [match] = await db.select().from(s.matches).where(eq(s.matches.id, matchId)).limit(1);
    if (!match) throw new Error(`Match not found: ${matchId}`);

    const home = match.homeTeamId
      ? await db.select().from(s.teams).where(eq(s.teams.id, match.homeTeamId)).limit(1).then((r) => r[0])
      : null;
    const away = match.awayTeamId
      ? await db.select().from(s.teams).where(eq(s.teams.id, match.awayTeamId)).limit(1).then((r) => r[0])
      : null;

    const [pred] = await db
      .select()
      .from(s.predictions)
      .where(eq(s.predictions.matchId, matchId))
      .orderBy(desc(s.predictions.createdAt))
      .limit(1);

    const odds = await db
      .select()
      .from(s.oddsHistory)
      .where(eq(s.oddsHistory.matchId, matchId))
      .orderBy(desc(s.oddsHistory.createdAt))
      .limit(5);

    const detailedResult = {
      ...formatMatch(match, home, away, pred),
      odds,
    };
    return {
      contents: [{ uri, mimeType: "application/json", text: JSON.stringify(detailedResult, null, 2) }],
    };
  }

  if (uri === "teams") {
    const allTeams = await db.select().from(s.teams).orderBy(desc(s.teams.eloRating));
    return {
      contents: [{ uri, mimeType: "application/json", text: JSON.stringify(allTeams, null, 2) }],
    };
  }

  if (uri === "players") {
    const allPlayers = await db
      .select()
      .from(s.players)
      .orderBy(desc(s.players.influenceScore))
      .limit(200);
    return {
      contents: [{ uri, mimeType: "application/json", text: JSON.stringify(allPlayers, null, 2) }],
    };
  }

  if (uri === "groups") {
    const standings = await getGroupStandingsInternal();
    return {
      contents: [{ uri, mimeType: "application/json", text: JSON.stringify(standings, null, 2) }],
    };
  }

  if (uri === "bracket") {
    const knockoutStages = ["Round of 32", "Round of 16", "Quarterfinals", "Semifinals", "Third Place", "Final"];
    const bracketMatches = await db
      .select()
      .from(s.matches)
      .where(sql`stage IN (${sql.join(knockoutStages)})`)
      .orderBy(s.matches.matchNumber);

    const allTeams = await db.select().from(s.teams);
    const teamMap = new Map(allTeams.map((t) => [t.id, t]));

    const result = bracketMatches.map((m) => {
      const home = m.homeTeamId ? teamMap.get(m.homeTeamId) : null;
      const away = m.awayTeamId ? teamMap.get(m.awayTeamId) : null;
      return formatMatch(m, home, away, null);
    });

    return {
      contents: [{ uri, mimeType: "application/json", text: JSON.stringify(result, null, 2) }],
    };
  }

  if (uri === "model/metrics") {
    const [metrics] = await db
      .select()
      .from(s.modelMetrics)
      .orderBy(desc(s.modelMetrics.calculatedAt))
      .limit(1);
    return {
      contents: [{ uri, mimeType: "application/json", text: JSON.stringify(metrics || null, null, 2) }],
    };
  }

  if (uri === "freshness") {
    const rows = await db.execute<{
      provider: string;
      entity_type: string;
      last_synced_at: Date;
      status: string;
    }>(
      sql`
        SELECT provider, entity_type, last_synced_at, status
        FROM provider_freshness
        ORDER BY provider, entity_type
      `
    );
    const freshness = rows.rows.map((r) => ({
      provider: r.provider,
      entityType: r.entity_type,
      lastSyncedAt: r.last_synced_at,
      status: r.status,
    }));
    return {
      contents: [{ uri, mimeType: "application/json", text: JSON.stringify(freshness, null, 2) }],
    };
  }

  throw new Error(`Unsupported resource URI: ${uri}`);
});

// 5. Implement MCP Tools Capability
mcpServer.setRequestHandler(ListToolsRequestSchema, async () => {
  logAudit("list_tools", {});
  return {
    tools: [
      {
        name: "get_matches",
        description: "Retrieve matches, optionally filtered by stage or status.",
        inputSchema: {
          type: "object",
          properties: {
            stage: {
              type: "string",
              enum: ["Group", "RoundOf32", "RoundOf16", "Quarterfinals", "Semifinals", "ThirdPlace", "Final"],
              description: "Optional tournament stage filter",
            },
            status: {
              type: "string",
              enum: ["Scheduled", "Live", "Completed"],
              description: "Optional match status filter",
            },
          },
        },
      },
      {
        name: "get_match_detail",
        description: "Get detailed information about a match, including prediction and odds.",
        inputSchema: {
          type: "object",
          properties: {
            id: { type: "integer", description: "Match database ID" },
          },
          required: ["id"],
        },
      },
      {
        name: "get_team",
        description: "Get team profile and current Elo rating.",
        inputSchema: {
          type: "object",
          properties: {
            id: { type: "string", description: "Three-letter team code (e.g. ARG)" },
          },
          required: ["id"],
        },
      },
      {
        name: "get_player",
        description: "Get player details and influence score.",
        inputSchema: {
          type: "object",
          properties: {
            id: { type: "integer", description: "Player database ID" },
          },
          required: ["id"],
        },
      },
      {
        name: "get_group_table",
        description: "Get group standings calculated via FIFA tiebreaker rules.",
        inputSchema: {
          type: "object",
          properties: {
            groupName: { type: "string", description: "Group letter (e.g. A)" },
          },
        },
      },
      {
        name: "get_bracket_projection",
        description: "Get the current knockout stage bracket structure and matches.",
        inputSchema: { type: "object", properties: {} },
      },
      {
        name: "get_match_prediction",
        description: "Get prediction details including win/draw/away probabilities and human-readable explanation factors.",
        inputSchema: {
          type: "object",
          properties: {
            matchId: { type: "integer", description: "Match database ID" },
          },
          required: ["matchId"],
        },
      },
      {
        name: "compare_prediction_to_market",
        description: "Compare model win/draw/away probabilities with market implied odds.",
        inputSchema: {
          type: "object",
          properties: {
            matchId: { type: "integer", description: "Match database ID" },
          },
          required: ["matchId"],
        },
      },
      {
        name: "get_model_metrics",
        description: "Get predictive model accuracy, brier score, and cross-entropy log loss.",
        inputSchema: { type: "object", properties: {} },
      },
      {
        name: "get_data_freshness",
        description: "Get last sync timestamp and status of external APIs.",
        inputSchema: { type: "object", properties: {} },
      },
    ],
  };
});

// GQL stage filter mapping helpers
const stageGqlToDbMap: Record<string, string> = {
  Group: "Group",
  RoundOf32: "Round of 32",
  RoundOf16: "Round of 16",
  Quarterfinals: "Quarterfinals",
  Semifinals: "Semifinals",
  ThirdPlace: "Third Place",
  Final: "Final",
};

mcpServer.setRequestHandler(CallToolRequestSchema, async (request) => {
  const name = request.params.name;
  const args = request.params.arguments || {};
  logAudit("call_tool", { name, args });

  switch (name) {
    case "get_matches": {
      const stageFilter = args.stage ? stageGqlToDbMap[args.stage as string] : undefined;
      const statusFilter = args.status as string | undefined;

      const allMatches = await db.select().from(s.matches).orderBy(s.matches.matchNumber);
      const allTeams = await db.select().from(s.teams);
      const teamMap = new Map(allTeams.map((t) => [t.id, t]));

      const filtered = allMatches.filter((m) => {
        if (stageFilter && m.stage !== stageFilter) return false;
        if (statusFilter && m.status !== statusFilter) return false;
        return true;
      });

      const items = filtered.map((m) => {
        const home = m.homeTeamId ? teamMap.get(m.homeTeamId) : null;
        const away = m.awayTeamId ? teamMap.get(m.awayTeamId) : null;
        return formatMatch(m, home, away, null);
      });

      return {
        content: [{ type: "text", text: JSON.stringify(items, null, 2) }],
      };
    }

    case "get_match_detail": {
      const matchId = args.id as number;
      const [match] = await db.select().from(s.matches).where(eq(s.matches.id, matchId)).limit(1);
      if (!match) throw new Error(`Match not found: ${matchId}`);

      const home = match.homeTeamId
        ? await db.select().from(s.teams).where(eq(s.teams.id, match.homeTeamId)).limit(1).then((r) => r[0])
        : null;
      const away = match.awayTeamId
        ? await db.select().from(s.teams).where(eq(s.teams.id, match.awayTeamId)).limit(1).then((r) => r[0])
        : null;

      const [pred] = await db
        .select()
        .from(s.predictions)
        .where(eq(s.predictions.matchId, matchId))
        .orderBy(desc(s.predictions.createdAt))
        .limit(1);

      const odds = await db
        .select()
        .from(s.oddsHistory)
        .where(eq(s.oddsHistory.matchId, matchId))
        .orderBy(desc(s.oddsHistory.createdAt))
        .limit(5);

      const detail = {
        ...formatMatch(match, home, away, pred),
        odds,
      };

      return {
        content: [{ type: "text", text: JSON.stringify(detail, null, 2) }],
      };
    }

    case "get_team": {
      const teamId = args.id as string;
      const [team] = await db.select().from(s.teams).where(eq(s.teams.id, teamId)).limit(1);
      if (!team) throw new Error(`Team not found: ${teamId}`);
      return {
        content: [{ type: "text", text: JSON.stringify(team, null, 2) }],
      };
    }

    case "get_player": {
      const playerId = args.id as number;
      const [player] = await db.select().from(s.players).where(eq(s.players.id, playerId)).limit(1);
      if (!player) throw new Error(`Player not found: ${playerId}`);
      return {
        content: [{ type: "text", text: JSON.stringify(player, null, 2) }],
      };
    }

    case "get_group_table": {
      const groupName = args.groupName as string | undefined;
      const standings = await getGroupStandingsInternal(groupName);
      return {
        content: [{ type: "text", text: JSON.stringify(standings, null, 2) }],
      };
    }

    case "get_bracket_projection": {
      const knockoutStages = ["Round of 32", "Round of 16", "Quarterfinals", "Semifinals", "Third Place", "Final"];
      const bracketMatches = await db
        .select()
        .from(s.matches)
        .where(sql`stage IN (${sql.join(knockoutStages)})`)
        .orderBy(s.matches.matchNumber);

      const allTeams = await db.select().from(s.teams);
      const teamMap = new Map(allTeams.map((t) => [t.id, t]));

      const items = bracketMatches.map((m) => {
        const home = m.homeTeamId ? teamMap.get(m.homeTeamId) : null;
        const away = m.awayTeamId ? teamMap.get(m.awayTeamId) : null;
        return formatMatch(m, home, away, null);
      });

      // Render a visual Mermaid diagram for AI hosts to display the bracket structure
      const mermaidLines = [
        "graph TD",
        "  subgraph Round_of_32",
      ];
      bracketMatches.filter(m => m.stage === "Round of 32").forEach(m => {
        const homeLabel = m.homeTeamId || `TBD_M${m.matchNumber}_H`;
        const awayLabel = m.awayTeamId || `TBD_M${m.matchNumber}_A`;
        mermaidLines.push(`    M${m.matchNumber}["Match #${m.matchNumber}: ${homeLabel} vs ${awayLabel}"]`);
      });
      mermaidLines.push("  end");

      const visualText = `### Bracket Projections\n\n\`\`\`mermaid\n${mermaidLines.join("\n")}\n\`\`\``;

      return {
        content: [
          { type: "text", text: JSON.stringify(items, null, 2) },
          { type: "text", text: visualText }
        ],
      };
    }

    case "get_match_prediction": {
      const matchId = args.matchId as number;
      const [match] = await db.select().from(s.matches).where(eq(s.matches.id, matchId)).limit(1);
      if (!match) throw new Error(`Match not found: ${matchId}`);

      const [pred] = await db
        .select()
        .from(s.predictions)
        .where(eq(s.predictions.matchId, matchId))
        .orderBy(desc(s.predictions.createdAt))
        .limit(1);

      if (!pred) {
        return {
          content: [{ type: "text", text: JSON.stringify({ prediction: null }, null, 2) }],
        };
      }

      // Visual win probability bar chart
      const homePct = Math.round(pred.homeWin * 100);
      const drawPct = Math.round(pred.draw * 100);
      const awayPct = Math.round(pred.awayWin * 100);
      
      const homeBar = "█".repeat(Math.round(homePct / 5));
      const drawBar = "█".repeat(Math.round(drawPct / 5));
      const awayBar = "█".repeat(Math.round(awayPct / 5));

      const visualWidget = `
### Match Prediction Probabilities
- **Home Win**: ${homePct}% [${homeBar}]
- **Draw**:     ${drawPct}% [${drawBar}]
- **Away Win**: ${awayPct}% [${awayBar}]

Confidence: ${Math.round(pred.confidence * 100)}%
Explanation Factors:
${(pred.factors as Array<{ factor: string; weight: number }>).map((f) => `  * ${f.factor} (weight: ${Math.round(f.weight * 100)}%)`).join("\n")}
`;

      return {
        content: [
          { type: "text", text: JSON.stringify(pred, null, 2) },
          { type: "text", text: visualWidget }
        ],
      };
    }

    case "compare_prediction_to_market": {
      const matchId = args.matchId as number;
      const [match] = await db.select().from(s.matches).where(eq(s.matches.id, matchId)).limit(1);
      if (!match) throw new Error(`Match not found: ${matchId}`);

      const [pred] = await db
        .select()
        .from(s.predictions)
        .where(eq(s.predictions.matchId, matchId))
        .orderBy(desc(s.predictions.createdAt))
        .limit(1);

      const [odds] = await db
        .select()
        .from(s.oddsHistory)
        .where(eq(s.oddsHistory.matchId, matchId))
        .orderBy(desc(s.oddsHistory.createdAt))
        .limit(1);

      if (!pred || !odds) {
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({ comparison: null, error: "Missing prediction or odds history" }),
            },
          ],
        };
      }

      // Compute market implied probabilities (with margin removed)
      const rawHome = 1 / odds.homeOdds;
      const rawDraw = 1 / odds.drawOdds;
      const rawAway = 1 / odds.awayOdds;
      const sum = rawHome + rawDraw + rawAway;

      const market = {
        homeWin: rawHome / sum,
        draw: rawDraw / sum,
        awayWin: rawAway / sum,
        margin: sum - 1,
      };

      const diff = {
        homeWin: pred.homeWin - market.homeWin,
        draw: pred.draw - market.draw,
        awayWin: pred.awayWin - market.awayWin,
      };

      const comparison = {
        matchId,
        bookmaker: odds.bookmaker,
        odds: {
          home: odds.homeOdds,
          draw: odds.drawOdds,
          away: odds.awayOdds,
        },
        modelProbabilities: {
          home: pred.homeWin,
          draw: pred.draw,
          away: pred.awayWin,
        },
        marketProbabilities: {
          home: market.homeWin,
          draw: market.draw,
          away: market.awayWin,
          margin: market.margin,
        },
        difference: diff,
      };

      return {
        content: [{ type: "text", text: JSON.stringify(comparison, null, 2) }],
      };
    }

    case "get_model_metrics": {
      const [metrics] = await db
        .select()
        .from(s.modelMetrics)
        .orderBy(desc(s.modelMetrics.calculatedAt))
        .limit(1);
      return {
        content: [{ type: "text", text: JSON.stringify(metrics || null, null, 2) }],
      };
    }

    case "get_data_freshness": {
      const rows = await db.execute<{
        provider: string;
        entity_type: string;
        last_synced_at: Date;
        status: string;
      }>(
        sql`
          SELECT provider, entity_type, last_synced_at, status
          FROM provider_freshness
          ORDER BY provider, entity_type
        `
      );
      const freshness = rows.rows.map((r) => ({
        provider: r.provider,
        entityType: r.entity_type,
        lastSyncedAt: r.last_synced_at,
        status: r.status,
      }));
      return {
        content: [{ type: "text", text: JSON.stringify(freshness, null, 2) }],
      };
    }

    default:
      throw new Error(`Unknown tool name: ${name}`);
  }
});

// 6. Implement MCP Prompts Capability
mcpServer.setRequestHandler(ListPromptsRequestSchema, async () => {
  logAudit("list_prompts", {});
  return {
    prompts: [
      {
        name: "summarize_match_prediction",
        description: "Summarize the prediction and key factors for a specific match.",
        arguments: [
          { name: "matchId", description: "ID of the match", required: true },
        ],
      },
      {
        name: "explain_prediction_change",
        description: "Explain why the prediction for a match changed historically.",
        arguments: [
          { name: "matchId", description: "ID of the match", required: true },
        ],
      },
      {
        name: "summarize_team_form",
        description: "Analyze and summarize a team's current form and Elo rating.",
        arguments: [
          { name: "teamId", description: "Three-letter team ID (e.g. ARG)", required: true },
        ],
      },
      {
        name: "compare_two_teams",
        description: "Compare two teams head-to-head based on ratings, form, and players.",
        arguments: [
          { name: "teamA", description: "First team ID", required: true },
          { name: "teamB", description: "Second team ID", required: true },
        ],
      },
      {
        name: "explain_model_performance",
        description: "Provide an analysis of the prediction model's performance metrics.",
        arguments: [],
      },
    ],
  };
});

mcpServer.setRequestHandler(GetPromptRequestSchema, async (request) => {
  const name = request.params.name;
  const args = request.params.arguments || {};
  logAudit("get_prompt", { name, args });

  switch (name) {
    case "summarize_match_prediction": {
      const matchId = Number(args.matchId);
      const [match] = await db.select().from(s.matches).where(eq(s.matches.id, matchId)).limit(1);
      if (!match) throw new Error(`Match not found: ${matchId}`);

      const home = match.homeTeamId
        ? await db.select().from(s.teams).where(eq(s.teams.id, match.homeTeamId)).limit(1).then((r) => r[0])
        : null;
      const away = match.awayTeamId
        ? await db.select().from(s.teams).where(eq(s.teams.id, match.awayTeamId)).limit(1).then((r) => r[0])
        : null;

      const [pred] = await db
        .select()
        .from(s.predictions)
        .where(eq(s.predictions.matchId, matchId))
        .orderBy(desc(s.predictions.createdAt))
        .limit(1);

      return {
        messages: [
          {
            role: "system",
            content: {
              type: "text",
              text: "You are an expert sports analyst specializing in predicting international soccer outcomes using Elo-based rating models.",
            },
          },
          {
            role: "user",
            content: {
              type: "text",
              text: `Please summarize the prediction for the upcoming match between ${home?.name || "TBD"} and ${away?.name || "TBD"}.\n\n` +
                `Match Details:\n` +
                `- Stage: ${match.stage}\n` +
                `- Kickoff Time: ${match.kickoffTime}\n\n` +
                `Ratings:\n` +
                `- ${home?.name || "Home"}: Elo ${home?.eloRating || "N/A"}\n` +
                `- ${away?.name || "Away"}: Elo ${away?.eloRating || "N/A"}\n\n` +
                `Model Prediction:\n` +
                `- Home Win Probability: ${pred ? Math.round(pred.homeWin * 100) : "N/A"}%\n` +
                `- Draw Probability: ${pred ? Math.round(pred.draw * 100) : "N/A"}%\n` +
                `- Away Win Probability: ${pred ? Math.round(pred.awayWin * 100) : "N/A"}%\n` +
                `- Model Confidence: ${pred ? Math.round(pred.confidence * 100) : "N/A"}%\n` +
                `- Key Factors:\n` +
                `${(pred?.factors as Array<{ factor: string; weight: number }> | undefined)?.map((f) => `  * ${f.factor} (weight: ${Math.round(f.weight * 100)}%)`).join("\n") || "  None"}`,
            },
          },
        ],
      };
    }

    case "explain_prediction_change": {
      const matchId = Number(args.matchId);
      const [match] = await db.select().from(s.matches).where(eq(s.matches.id, matchId)).limit(1);
      if (!match) throw new Error(`Match not found: ${matchId}`);

      const home = match.homeTeamId
        ? await db.select().from(s.teams).where(eq(s.teams.id, match.homeTeamId)).limit(1).then((r) => r[0])
        : null;
      const away = match.awayTeamId
        ? await db.select().from(s.teams).where(eq(s.teams.id, match.awayTeamId)).limit(1).then((r) => r[0])
        : null;

      const predictionHistory = await db
        .select()
        .from(s.predictions)
        .where(eq(s.predictions.matchId, matchId))
        .orderBy(asc(s.predictions.createdAt));

      return {
        messages: [
          {
            role: "system",
            content: {
              type: "text",
              text: "You are an analytical assistant helping to interpret shifts in statistical forecast models.",
            },
          },
          {
            role: "user",
            content: {
              type: "text",
              text: `Analyze the shift in win probability predictions over time for the match ${home?.name || "TBD"} vs ${away?.name || "TBD"}.\n\n` +
                `Prediction History:\n` +
                `${predictionHistory.map((p) => `- Timestamp: ${p.createdAt.toISOString()}\n  Home Win: ${Math.round(p.homeWin * 100)}% | Draw: ${Math.round(p.draw * 100)}% | Away Win: ${Math.round(p.awayWin * 100)}%\n  Factors: ${JSON.stringify(p.factors)}`).join("\n\n")}`,
            },
          },
        ],
      };
    }

    case "summarize_team_form": {
      const teamId = args.teamId as string;
      const [team] = await db.select().from(s.teams).where(eq(s.teams.id, teamId)).limit(1);
      if (!team) throw new Error(`Team not found: ${teamId}`);

      const recentMatches = await db
        .select()
        .from(s.matches)
        .where(
          and(
            sql`(home_team_id = ${teamId} OR away_team_id = ${teamId})`,
            eq(s.matches.status, "Completed")
          )
        )
        .orderBy(desc(s.matches.kickoffTime))
        .limit(5);

      const eloSnapshots = await db
        .select()
        .from(s.ratingsSnapshots)
        .where(eq(s.ratingsSnapshots.teamId, teamId))
        .orderBy(desc(s.ratingsSnapshots.createdAt))
        .limit(10);

      return {
        messages: [
          {
            role: "system",
            content: {
              type: "text",
              text: "You are a football analytics writer summarizing team conditions, streaks, and ratings snapshots.",
            },
          },
          {
            role: "user",
            content: {
              type: "text",
              text: `Analyze current form and Elo changes for ${team.name} (${team.id}).\n\n` +
                `Current Rating: Elo ${team.eloRating}\n\n` +
                `Recent matches:\n` +
                `${recentMatches.map((m) => `- vs ${m.homeTeamId === teamId ? m.awayTeamId : m.homeTeamId} (${m.stage}): Score ${m.homeScore}-${m.awayScore} (${m.status})`).join("\n") || "- None completed yet"}\n\n` +
                `Elo History snapshots (recent to oldest):\n` +
                `${eloSnapshots.map((s) => `- ${s.createdAt.toISOString()}: Elo ${s.eloRating}`).join("\n") || "- No rating snapshots yet"}`,
            },
          },
        ],
      };
    }

    case "compare_two_teams": {
      const teamAId = args.teamA as string;
      const teamBId = args.teamB as string;

      const [teamA] = await db.select().from(s.teams).where(eq(s.teams.id, teamAId)).limit(1);
      const [teamB] = await db.select().from(s.teams).where(eq(s.teams.id, teamBId)).limit(1);

      if (!teamA || !teamB) throw new Error(`One or both teams not found: ${teamAId}, ${teamBId}`);

      const topPlayersA = await db
        .select()
        .from(s.players)
        .where(eq(s.players.teamId, teamAId))
        .orderBy(desc(s.players.influenceScore))
        .limit(3);

      const topPlayersB = await db
        .select()
        .from(s.players)
        .where(eq(s.players.teamId, teamBId))
        .orderBy(desc(s.players.influenceScore))
        .limit(3);

      return {
        messages: [
          {
            role: "system",
            content: {
              type: "text",
              text: "You are a tactical preview writer comparing team strengths, key players, and ratings.",
            },
          },
          {
            role: "user",
            content: {
              type: "text",
              text: `Please write a head-to-head tactical comparison between ${teamA.name} and ${teamB.name}.\n\n` +
                `Team Details:\n` +
                `- ${teamA.name}: Elo ${teamA.eloRating} | Group ${teamA.groupName}\n` +
                `- ${teamB.name}: Elo ${teamB.eloRating} | Group ${teamB.groupName}\n\n` +
                `Key Players:\n` +
                `Top 3 for ${teamA.name}:\n` +
                `${topPlayersA.map((p) => `- ${p.name} (${p.position}) - Influence: ${p.influenceScore}`).join("\n")}\n\n` +
                `Top 3 for ${teamB.name}:\n` +
                `${topPlayersB.map((p) => `- ${p.name} (${p.position}) - Influence: ${p.influenceScore}`).join("\n")}`,
            },
          },
        ],
      };
    }

    case "explain_model_performance": {
      const [metrics] = await db
        .select()
        .from(s.modelMetrics)
        .orderBy(desc(s.modelMetrics.calculatedAt))
        .limit(1);

      return {
        messages: [
          {
            role: "system",
            content: {
              type: "text",
              text: "You are a machine learning scientist explaining prediction accuracy, Brier Score (mean squared error), and log loss (cross-entropy).",
            },
          },
          {
            role: "user",
            content: {
              type: "text",
              text: `Explain the latest predictive model performance metrics and what they say about model calibration.\n\n` +
                `Latest Performance Metrics (Calculated at: ${metrics ? metrics.calculatedAt.toISOString() : "N/A"}):\n` +
                `- Model Version: ${metrics?.modelVersion || "N/A"}\n` +
                `- Accuracy: ${metrics ? (metrics.accuracy * 100).toFixed(1) : "N/A"}%\n` +
                `- Brier Score: ${metrics ? metrics.brierScore.toFixed(4) : "N/A"} (closer to 0 is better)\n` +
                `- Log Loss: ${metrics ? metrics.logLoss.toFixed(4) : "N/A"} (lower is better)\n\n` +
                `Calibration Bins Data:\n` +
                `${metrics ? JSON.stringify(metrics.calibration, null, 2) : "N/A"}`,
            },
          },
        ],
      };
    }

    default:
      throw new Error(`Unknown prompt: ${name}`);
  }
});

// 7. Standalone & SSE Server Transport Hook
let transport: SSEServerTransport | null = null;

export async function handleSseConnection(res: http.ServerResponse) {
  transport = new SSEServerTransport("/message", res);
  await mcpServer.connect(transport);
}

export async function handlePostMessage(req: http.IncomingMessage, res: http.ServerResponse) {
  if (transport) {
    await transport.handlePostMessage(req, res);
  } else {
    res.writeHead(400, { "Content-Type": "text/plain" });
    res.end("No active SSE session");
  }
}

// Stdio / HTTP bootstrap
const isMain =
  process.argv[1]?.includes("apps/mcp/src/index.ts") ||
  process.argv[1]?.includes("apps/mcp/dist/index.js") ||
  process.argv.includes("--stdio") ||
  (typeof require !== "undefined" && require.main === module);

if (isMain) {
  if (process.argv.includes("--stdio")) {
    const stdioTransport = new StdioServerTransport();
    mcpServer.connect(stdioTransport).then(() => {
      console.error("MCP Server connected via Stdio");
    });
  } else {
    const httpServer = http.createServer(async (req, res) => {
      // CORS headers
      res.setHeader("Access-Control-Allow-Origin", "*");
      res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
      res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

      if (req.method === "OPTIONS") {
        res.writeHead(200);
        res.end();
        return;
      }

      // Audit request rate limits
      const ip = req.socket.remoteAddress || "unknown";
      if (!checkRateLimit(ip)) {
        res.writeHead(429, { "Content-Type": "text/plain" });
        res.end("Too many requests");
        return;
      }

      // Authenticate
      const isSseInitiation = req.method === "GET" && req.url?.startsWith("/sse");
      const isPostMessage = req.method === "POST" && req.url?.startsWith("/message");

      if (isSseInitiation || isPostMessage) {
        if (!authenticate(req)) {
          res.writeHead(401, { "Content-Type": "text/plain" });
          res.end("Unauthorized");
          return;
        }
      }

      const url = new URL(req.url || "", `http://${req.headers.host || "localhost"}`);
      if (req.method === "GET" && url.pathname === "/sse") {
        await handleSseConnection(res);
      } else if (req.method === "POST" && url.pathname === "/message") {
        await handlePostMessage(req, res);
      } else {
        res.writeHead(404, { "Content-Type": "text/plain" });
        res.end("Not Found");
      }
    });

    const port = process.env.PORT || 4001;
    httpServer.listen(port, () => {
      console.log(`MCP server listening on port ${port}`);
    });
  }
}
