import { eq } from "drizzle-orm";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import { schemas as s, db as defaultDb } from "@worldcup/domain";
import type { SyncProvider } from "@worldcup/data-providers";

export async function syncFixtures(
  provider: SyncProvider,
  _payload: { force?: boolean },
  db: NodePgDatabase = defaultDb as any,
): Promise<{ synced: number }> {
  const fixtures = await provider.fetchFixtures();
  let synced = 0;

  for (const fixture of fixtures) {
    const existing = await db
      .select()
      .from(s.matches)
      .where(eq(s.matches.matchNumber, fixture.matchNumber))
      .limit(1);

    if (existing.length > 0) {
      const current = existing[0];
      const updateFields: Record<string, any> = {};

      if (fixture.homeTeamId && fixture.homeTeamId !== current.homeTeamId) {
        updateFields.homeTeamId = fixture.homeTeamId;
      }
      if (fixture.awayTeamId && fixture.awayTeamId !== current.awayTeamId) {
        updateFields.awayTeamId = fixture.awayTeamId;
      }
      if (fixture.status !== current.status) {
        updateFields.status = fixture.status;
      }
      if (fixture.providerId && fixture.providerId !== current.providerId) {
        updateFields.providerId = fixture.providerId;
      }

      if (Object.keys(updateFields).length > 0) {
        await db
          .update(s.matches)
          .set(updateFields)
          .where(eq(s.matches.id, current.id));
      }
    } else {
      await db.insert(s.matches).values({
        matchNumber: fixture.matchNumber,
        homeTeamId: fixture.homeTeamId,
        awayTeamId: fixture.awayTeamId,
        status: fixture.status,
        stage: fixture.stage,
        kickoffTime: fixture.kickoffTime,
        providerId: fixture.providerId,
      });
    }
    synced++;
  }

  return { synced };
}
