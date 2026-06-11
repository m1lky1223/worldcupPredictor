import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import { schemas as s, db as defaultDb } from "@worldcup/domain";
import { OddsAdapter } from "@worldcup/data-providers";

export async function syncOdds(
  _payload: {},
  db: NodePgDatabase = defaultDb as any,
): Promise<{ synced: number }> {
  const adapter = new OddsAdapter();
  const oddsEntries = await adapter.fetchOdds();
  let synced = 0;

  const allMatches = await db
    .select({
      id: s.matches.id,
      matchNumber: s.matches.matchNumber,
      homeTeamId: s.matches.homeTeamId,
      awayTeamId: s.matches.awayTeamId,
    })
    .from(s.matches);

  const allTeams = await db
    .select({ id: s.teams.id, name: s.teams.name })
    .from(s.teams);

  for (const entry of oddsEntries) {
    const match = allMatches.find(
      (m) => m.matchNumber === entry.matchNumber,
    );

    if (!match) {
      const homeTeam = allTeams.find((t) => t.id === entry.homeTeamId);
      const awayTeam = allTeams.find((t) => t.id === entry.awayTeamId);
      if (!homeTeam || !awayTeam) continue;

      const matchByName = allMatches.find(
        (m) => m.homeTeamId === homeTeam.id && m.awayTeamId === awayTeam.id,
      );
      if (!matchByName) continue;

      await db.insert(s.oddsHistory).values({
        matchId: matchByName.id,
        bookmaker: entry.bookmaker,
        homeOdds: entry.homeOdds,
        drawOdds: entry.drawOdds,
        awayOdds: entry.awayOdds,
      });
      synced++;
      continue;
    }

    await db.insert(s.oddsHistory).values({
      matchId: match.id,
      bookmaker: entry.bookmaker,
      homeOdds: entry.homeOdds,
      drawOdds: entry.drawOdds,
      awayOdds: entry.awayOdds,
    });
    synced++;
  }

  return { synced };
}
