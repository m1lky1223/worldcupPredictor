import { eq } from "drizzle-orm";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import { schemas as s } from "@worldcup/domain";
import { EloRating } from "./elo.js";

/**
 * RatingService updates team Elo ratings after a completed match.
 *
 * Called by the worker after a match transitions to Completed status.
 * Records a historical snapshot before each rating change so the
 * prediction engine can reconstruct the state at any point in time.
 */
export class RatingService {
  private readonly db: NodePgDatabase;
  private readonly elo: EloRating;

  constructor(db: NodePgDatabase, elo?: EloRating) {
    this.db = db;
    this.elo = elo ?? new EloRating();
  }

  /**
   * Update ratings for both teams after a completed match.
   * Returns the updated Elo ratings or null if match/teams not found.
   */
  async updateRatingsAfterMatch(
    matchId: number,
  ): Promise<{ homeTeamId: string; homeNewElo: number; awayTeamId: string; awayNewElo: number } | null> {
    const [match] = await this.db
      .select()
      .from(s.matches)
      .where(eq(s.matches.id, matchId))
      .limit(1);

    if (!match || match.status !== "Completed") return null;
    if (match.homeScore === null || match.awayScore === null) return null;

    const [homeTeam] = await this.db
      .select()
      .from(s.teams)
      .where(eq(s.teams.id, match.homeTeamId!))
      .limit(1);

    const [awayTeam] = await this.db
      .select()
      .from(s.teams)
      .where(eq(s.teams.id, match.awayTeamId!))
      .limit(1);

    if (!homeTeam || !awayTeam) return null;

    // Expected scores
    const homeExpected = this.elo.expectedScore(homeTeam.eloRating, awayTeam.eloRating);
    const awayExpected = 1 - homeExpected;

    // Actual outcomes: win = 1, draw = 0.5, loss = 0
    let homeActual: number;
    let awayActual: number;

    if (match.homeScore > match.awayScore) {
      homeActual = 1;
      awayActual = 0;
    } else if (match.homeScore < match.awayScore) {
      homeActual = 0;
      awayActual = 1;
    } else {
      homeActual = 0.5;
      awayActual = 0.5;
    }

    // Compute new ratings
    const homeNewElo = this.elo.updateRating(homeTeam.eloRating, homeExpected, homeActual);
    const awayNewElo = this.elo.updateRating(awayTeam.eloRating, awayExpected, awayActual);

    // Record pre-update snapshots
    await Promise.all([
      this.db.insert(s.ratingsSnapshots).values({
        teamId: homeTeam.id,
        eloRating: homeTeam.eloRating,
        createdAt: new Date(),
      }),
      this.db.insert(s.ratingsSnapshots).values({
        teamId: awayTeam.id,
        eloRating: awayTeam.eloRating,
        createdAt: new Date(),
      }),
    ]);

    // Update team Elo ratings
    await Promise.all([
      this.db
        .update(s.teams)
        .set({ eloRating: homeNewElo })
        .where(eq(s.teams.id, homeTeam.id)),
      this.db
        .update(s.teams)
        .set({ eloRating: awayNewElo })
        .where(eq(s.teams.id, awayTeam.id)),
    ]);

    return {
      homeTeamId: homeTeam.id,
      homeNewElo,
      awayTeamId: awayTeam.id,
      awayNewElo,
    };
  }
}
