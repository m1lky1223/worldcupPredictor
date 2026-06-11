import { eq } from "drizzle-orm";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import { schemas as s, db as defaultDb } from "@worldcup/domain";
import type { SyncProvider } from "@worldcup/data-providers";

export async function syncLiveMatch(
  provider: SyncProvider,
  payload: { matchId: number },
  db: NodePgDatabase = defaultDb as any,
): Promise<{ updated: boolean }> {
  const [match] = await db
    .select()
    .from(s.matches)
    .where(eq(s.matches.id, payload.matchId))
    .limit(1);

  if (!match) throw new Error(`Match not found: ${payload.matchId}`);
  if (match.status !== "Live") return { updated: false };

  const providerMatchId = match.providerId || `mock-m-${match.matchNumber}`;
  const stats = await provider.fetchMatchStats(match.id, providerMatchId);

  if (stats.status === "Completed") {
    await db
      .update(s.matches)
      .set({
        status: "Completed",
        homeScore: stats.homeScore,
        awayScore: stats.awayScore,
      })
      .where(eq(s.matches.id, match.id));

    return { updated: true };
  }

  if (stats.homeScore !== null || stats.awayScore !== null) {
    await db
      .update(s.matches)
      .set({
        homeScore: stats.homeScore,
        awayScore: stats.awayScore,
      })
      .where(eq(s.matches.id, match.id));
  }

  return { updated: false };
}
