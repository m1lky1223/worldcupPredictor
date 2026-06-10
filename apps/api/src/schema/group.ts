import { eq } from "drizzle-orm";
import { schemas } from "@worldcup/domain";
import type { GraphQLContext } from "@worldcup/domain";

export const typeDefs = `#graphql
  type GroupStandingEntry {
    team: Team!
    played: Int!
    won: Int!
    drawn: Int!
    lost: Int!
    goalsFor: Int!
    goalsAgainst: Int!
    goalDifference: Int!
    points: Int!
    position: Int!
    qualified: Boolean!
    eliminated: Boolean!
  }

  type GroupStandings {
    groupName: String!
    standings: [GroupStandingEntry!]!
  }

  extend type Query {
    groupStandings(groupName: String): [GroupStandings!]!
  }
`;

interface GroupStandingsArgs {
  groupName?: string | null;
}

interface RawTeamStats {
  teamId: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
}

interface HeadToHeadKey {
  homeTeamId: string;
  awayTeamId: string;
}

/**
 * Computes raw team statistics from a list of completed matches.
 */
export function computeTeamStats(
  matches: Array<{
    homeTeamId: string | null;
    awayTeamId: string | null;
    homeScore: number | null;
    awayScore: number | null;
  }>,
): RawTeamStats[] {
  const statsMap = new Map<string, RawTeamStats>();

  function ensureStats(teamId: string): RawTeamStats {
    let stats = statsMap.get(teamId);
    if (!stats) {
      stats = {
        teamId,
        played: 0,
        won: 0,
        drawn: 0,
        lost: 0,
        goalsFor: 0,
        goalsAgainst: 0,
      };
      statsMap.set(teamId, stats);
    }
    return stats;
  }

  for (const match of matches) {
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

/**
 * Builds a lookup of head-to-head result between two teams.
 * Returns the goal difference from the perspective of teamA vs teamB.
 */
export function buildHeadToHeadLookup(
  matches: Array<{
    homeTeamId: string | null;
    awayTeamId: string | null;
    homeScore: number | null;
    awayScore: number | null;
  }>,
): Map<string, number> {
  const h2h = new Map<string, number>();

  for (const match of matches) {
    if (
      match.homeScore === null ||
      match.awayScore === null ||
      match.homeTeamId === null ||
      match.awayTeamId === null
    ) {
      continue;
    }
    const key = [match.homeTeamId, match.awayTeamId].sort().join(":");
    if (!h2h.has(key)) {
      h2h.set(key, 0);
    }
    // From perspective of home team
    const gd = match.homeScore - match.awayScore;
    h2h.set(key, h2h.get(key)! + gd);
  }

  return h2h;
}

/**
 * Resolves the head-to-head goal difference between two teams.
 */
export function getHeadToHeadGD(
  teamA: string,
  teamB: string,
  h2hCache: Map<string, number>,
): number {
  const key = [teamA, teamB].sort().join(":");
  return h2hCache.get(key) ?? 0;
}

/**
 * Returns the goal difference for `team` in the head-to-head match
 * against `opponent`. Positive means `team` scored more.
 */
function h2hGDForTeam(
  team: string,
  opponent: string,
  matches: Array<{
    homeTeamId: string | null;
    awayTeamId: string | null;
    homeScore: number | null;
    awayScore: number | null;
  }>,
): number {
  for (const match of matches) {
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

/**
 * Sorts standings entries according to FIFA tiebreaker rules:
 * 1. Points (desc)
 * 2. Goal difference (desc)
 * 3. Goals scored (desc)
 * 4. Head-to-head points between tied teams
 * 5. Head-to-head goal difference
 * 6. Head-to-head goals scored
 */
export function sortStandings(
  entries: Array<{
    teamId: string;
    points: number;
    goalDifference: number;
    goalsFor: number;
    teamIdsTied?: string[];
  }>,
  matches: Array<{
    homeTeamId: string | null;
    awayTeamId: string | null;
    homeScore: number | null;
    awayScore: number | null;
  }>,
): string[] {
  return entries
    .slice()
    .sort((a, b) => {
      // 1. Points
      if (a.points !== b.points) return b.points - a.points;

      // 2. Goal difference
      if (a.goalDifference !== b.goalDifference)
        return b.goalDifference - a.goalDifference;

      // 3. Goals scored
      if (a.goalsFor !== b.goalsFor) return b.goalsFor - a.goalsFor;

      // 4-6. Head-to-head for two-team ties
      const aTied = a.teamIdsTied ?? [];
      const bTied = b.teamIdsTied ?? [];

      const isTwoTeamTie =
        aTied.length === 1 &&
        bTied.length === 1 &&
        (aTied[0] === b.teamId || bTied[0] === a.teamId);

      if (isTwoTeamTie) {
        const gdA = h2hGDForTeam(a.teamId, aTied[0], matches);
        const gdB = -gdA; // zero-sum: B's GD is the negative of A's
        if (gdA !== gdB) return gdB - gdA;
      }

      return 0;
    })
    .map((e) => e.teamId);
}

/**
 * Determines which teams are tied on points with another team.
 */
export function findTiedTeams(stats: RawTeamStats[]): string[][] {
  const pointGroups = new Map<number, string[]>();

  for (const s of stats) {
    const pts = s.won * 3 + s.drawn;
    const group = pointGroups.get(pts) ?? [];
    group.push(s.teamId);
    pointGroups.set(pts, group);
  }

  return Array.from(pointGroups.values()).filter((g) => g.length > 1);
}

/**
 * Maps team statistics to standing entries with H2H tiebreaker info.
 */
export function buildStandingsEntries(
  stats: RawTeamStats[],
  tiedGroups: string[][],
): Array<{
  teamId: string;
  points: number;
  goalDifference: number;
  goalsFor: number;
  teamIdsTied: string[];
}> {
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

export const resolvers = {
  Query: {
    groupStandings: async (
      _parent: unknown,
      args: GroupStandingsArgs,
      context: GraphQLContext,
    ) => {
      // Get all teams grouped by group
      let teamsQuery = context.db
        .select()
        .from(schemas.teams)
        .orderBy(schemas.teams.groupName);

      const allTeams = await teamsQuery;

      // Filter by group if specified
      const groupNames = args.groupName
        ? [args.groupName]
        : [...new Set(allTeams.map((t) => t.groupName))].sort();

      const results = [];

      for (const gn of groupNames) {
        const groupTeams = allTeams.filter((t) => t.groupName === gn);
        const teamIds = groupTeams.map((t) => t.id);

        if (teamIds.length === 0) continue;

        // Get all group-stage matches and filter by team IDs in this group
      const allGroupMatches = await context.db
        .select()
        .from(schemas.matches)
        .where(eq(schemas.matches.stage, "Group"));

      const groupMatches = allGroupMatches.filter(
        (m) =>
          m.homeTeamId !== null &&
          m.awayTeamId !== null &&
          teamIds.includes(m.homeTeamId) &&
          teamIds.includes(m.awayTeamId),
      );

      const completedMatches = groupMatches.filter(
        (m) =>
          m.status === "Completed" &&
          m.homeScore !== null &&
          m.awayScore !== null,
      );

        // Compute stats
        const stats = computeTeamStats(
          completedMatches as Array<{
            homeTeamId: string | null;
            awayTeamId: string | null;
            homeScore: number | null;
            awayScore: number | null;
          }>,
        );

        // Find tie groups and compute standings
        const tiedGroups = findTiedTeams(stats);
        const entries = buildStandingsEntries(stats, tiedGroups);
        const sortedTeamIds = sortStandings(entries, completedMatches);

        // Build team lookup
        const teamMap = new Map(groupTeams.map((t) => [t.id, t]));

        // Map to final standings
        const standings = sortedTeamIds.map((teamId, idx) => {
          const st = stats.find((s) => s.teamId === teamId)!;
          const pts = st.won * 3 + st.drawn;
          const position = idx + 1;
          return {
            team: teamMap.get(teamId)!,
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
    },
  },
};
