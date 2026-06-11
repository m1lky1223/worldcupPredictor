import { eq } from "drizzle-orm";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import { schemas as s, db as defaultDb } from "@worldcup/domain";
import type { SyncProvider } from "@worldcup/data-providers";

export async function syncSquads(
  provider: SyncProvider,
  payload: { teamId?: string; force?: boolean },
  db: NodePgDatabase = defaultDb as any,
): Promise<{ synced: number; teamsProcessed: number }> {
  let teamsToSync: { id: string; providerId: string | null }[];

  if (payload.teamId) {
    const team = await db
      .select()
      .from(s.teams)
      .where(eq(s.teams.id, payload.teamId))
      .limit(1)
      .then((r) => r[0]);

    if (!team) throw new Error(`Team not found: ${payload.teamId}`);
    teamsToSync = [team];
  } else {
    teamsToSync = await db.select().from(s.teams);
  }

  let synced = 0;

  for (const team of teamsToSync) {
    const squad = await provider.fetchSquads(team.id, team.providerId || team.id);

    for (const player of squad) {
      const existing = await db
        .select()
        .from(s.players)
        .where(eq(s.players.providerId, player.providerId))
        .limit(1);

      if (existing.length > 0) {
        await db
          .update(s.players)
          .set({
            name: player.name,
            position: player.position,
            influenceScore: player.influenceScore,
          })
          .where(eq(s.players.id, existing[0].id));
      } else {
        await db.insert(s.players).values({
          name: player.name,
          teamId: player.teamId,
          position: player.position,
          influenceScore: player.influenceScore,
          providerId: player.providerId,
        });
      }
      synced++;
    }
  }

  return { synced, teamsProcessed: teamsToSync.length };
}
