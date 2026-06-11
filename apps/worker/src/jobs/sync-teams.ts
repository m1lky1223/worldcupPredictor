import { eq } from "drizzle-orm";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import { schemas as s, db as defaultDb } from "@worldcup/domain";
import type { SyncProvider } from "@worldcup/data-providers";

export async function syncTeams(
  provider: SyncProvider,
  _payload: { force?: boolean },
  db: NodePgDatabase = defaultDb as any,
): Promise<{ synced: number }> {
  const teams = await provider.fetchTeams();
  let synced = 0;

  for (const team of teams) {
    const existing = await db
      .select()
      .from(s.teams)
      .where(eq(s.teams.id, team.id))
      .limit(1);

    if (existing.length > 0) {
      await db
        .update(s.teams)
        .set({
          name: team.name,
          groupName: team.groupName,
          flagUrl: team.flagUrl,
          providerId: team.providerId,
        })
        .where(eq(s.teams.id, team.id));
    } else {
      await db.insert(s.teams).values({
        id: team.id,
        name: team.name,
        groupName: team.groupName,
        flagUrl: team.flagUrl,
        eloRating: team.eloRating,
        providerId: team.providerId,
      });
    }
    synced++;
  }

  return { synced };
}
