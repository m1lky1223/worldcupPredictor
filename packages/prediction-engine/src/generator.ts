import { eq, and } from "drizzle-orm";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import {
  Factor,
  PredictionPayload,
  schemas as s,
} from "@worldcup/domain";
import { EloRating } from "./elo.js";

const MODEL_VERSION = "1.0.0";

/**
 * PredictionGenerator produces and persists match predictions.
 *
 * Each prediction is append-only: old predictions are never overwritten,
 * ensuring a full history is preserved for model metrics and audit.
 */
export class PredictionGenerator {
  private readonly db: NodePgDatabase;
  private readonly elo: EloRating;

  constructor(db: NodePgDatabase, elo?: EloRating) {
    this.db = db;
    this.elo = elo ?? new EloRating();
  }

  /**
   * Generate a prediction for a single match by ID.
   * Returns the stored PredictionPayload or null if match/teams not found.
   */
  async generatePrediction(matchId: number): Promise<PredictionPayload | null> {
    const [match] = await this.db
      .select()
      .from(s.matches)
      .where(eq(s.matches.id, matchId))
      .limit(1);

    if (!match) return null;

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

    return this.computeAndStore(match, homeTeam, awayTeam);
  }

  /**
   * Generate predictions for all Scheduled matches.
   * Returns an array of stored PredictionPayloads.
   */
  async generateAllPredictions(): Promise<PredictionPayload[]> {
    const scheduledMatches = await this.db
      .select()
      .from(s.matches)
      .where(eq(s.matches.status, "Scheduled"));

    const results: PredictionPayload[] = [];

    for (const match of scheduledMatches) {
      const [homeTeam, awayTeam] = await Promise.all([
        this.db
          .select()
          .from(s.teams)
          .where(eq(s.teams.id, match.homeTeamId!))
          .limit(1)
          .then((rows) => rows[0]),
        this.db
          .select()
          .from(s.teams)
          .where(eq(s.teams.id, match.awayTeamId!))
          .limit(1)
          .then((rows) => rows[0]),
      ]);

      if (!homeTeam || !awayTeam) continue;

      const payload = await this.computeAndStore(match, homeTeam, awayTeam);
      results.push(payload);
    }

    return results;
  }

  // ────────── private ──────────

  private async computeAndStore(
    match: typeof s.matches.$inferSelect,
    homeTeam: typeof s.teams.$inferSelect,
    awayTeam: typeof s.teams.$inferSelect,
  ): Promise<PredictionPayload> {
    const homeElo = homeTeam.eloRating;
    const awayElo = awayTeam.eloRating;

    // Core probability computation
    const probs = this.elo.matchProbability(homeElo, awayElo);

    // Compute squad ratings from player influence scores
    const homeSquadRating = await this.computeSquadRating(homeTeam.id);
    const awaySquadRating = await this.computeSquadRating(awayTeam.id);

    // Compute tournament form (matches played so far / wins)
    const homeForm = await this.computeTournamentForm(homeTeam.id);
    const awayForm = await this.computeTournamentForm(awayTeam.id);

    // Player availability (simple: % of squad with influenceScore > 0)
    const homeAvailability = await this.computePlayerAvailability(homeTeam.id);
    const awayAvailability = await this.computePlayerAvailability(awayTeam.id);

    // Data freshness: how soon is the match (affects confidence)
    const msToKickoff = new Date(match.kickoffTime).getTime() - Date.now();
    const daysToKickoff = Math.max(0, msToKickoff / (1000 * 60 * 60 * 24));

    // Confidence based on Elo gap and data freshness
    const eloGap = Math.abs(homeElo - awayElo);
    const eloConfidence = Math.min(eloGap / 400, 0.5);
    const freshnessConfidence = Math.max(0, 1 - daysToKickoff / 90);
    const confidence = Number(
      Math.min(0.95, Math.max(0.4, 0.5 + eloConfidence + freshnessConfidence * 0.3)).toFixed(4),
    );

    // Human-readable factors
    const factors: Factor[] = [
      {
        factor: `Elo difference: ${homeTeam.id} (${homeElo}) vs ${awayTeam.id} (${awayElo})`,
        weight: 0.35,
      },
      {
        factor: "Home advantage (neutral venue, tournament setting)",
        weight: 0.15,
      },
      {
        factor: `Squad strength: ${homeTeam.id} ${homeSquadRating.toFixed(1)} vs ${awayTeam.id} ${awaySquadRating.toFixed(1)}`,
        weight: 0.25,
      },
      {
        factor: `Tournament form: ${homeTeam.id} ${homeForm.toFixed(1)} — ${awayTeam.id} ${awayForm.toFixed(1)}`,
        weight: 0.15,
      },
      {
        factor: `Player availability: ${(homeAvailability * 100).toFixed(0)}% vs ${(awayAvailability * 100).toFixed(0)}%`,
        weight: 0.10,
      },
    ];

    const timestamp = new Date().toISOString();

    const payload: PredictionPayload = {
      homeWin: probs.homeWin,
      draw: probs.draw,
      awayWin: probs.awayWin,
      confidence,
      factors,
      timestamp,
      modelVersion: MODEL_VERSION,
    };

    // Insert prediction (append-only — never updates)
    const [insertedPrediction] = await this.db
      .insert(s.predictions)
      .values({
        matchId: match.id,
        homeWin: payload.homeWin,
        draw: payload.draw,
        awayWin: payload.awayWin,
        confidence: payload.confidence,
        factors: payload.factors as unknown as Record<string, unknown>,
      })
      .returning();

    // Insert input snapshot linked to the prediction
    await this.db.insert(s.predictionInputSnapshots).values({
      predictionId: insertedPrediction.id,
      homeTeamElo: homeElo,
      awayTeamElo: awayElo,
      homeSquadRating,
      awaySquadRating,
      homeTournamentForm: homeForm,
      awayTournamentForm: awayForm,
      homePlayerAvailability: homeAvailability,
      awayPlayerAvailability: awayAvailability,
      inputData: {
        homeTeamId: homeTeam.id,
        awayTeamId: awayTeam.id,
        matchId: match.id,
        stage: match.stage,
        kickoffTime: match.kickoffTime.toISOString(),
      } as unknown as Record<string, unknown>,
    });

    return payload;
  }

  /**
   * Compute a squad strength rating from the mean influence score of all
   * players on the team. Returns a value 0–100.
   */
  private async computeSquadRating(teamId: string): Promise<number> {
    const players = await this.db
      .select()
      .from(s.players)
      .where(eq(s.players.teamId, teamId));

    if (players.length === 0) return 50; // neutral default

    const sum = players.reduce((acc, p) => acc + p.influenceScore, 0);
    return sum / players.length;
  }

  /**
   * Compute tournament form: ratio of completed matches won.
   * Returns a value 0–1.
   */
  private async computeTournamentForm(teamId: string): Promise<number> {
    const teamMatches = await this.db
      .select()
      .from(s.matches)
      .where(
        and(
          eq(s.matches.status, "Completed"),
          // Matches where this team is home or away
        ),
      );

    const relevantMatches = teamMatches.filter(
      (m) => m.homeTeamId === teamId || m.awayTeamId === teamId,
    );

    if (relevantMatches.length === 0) return 0.5; // neutral

    let points = 0;
    for (const m of relevantMatches) {
      if (m.homeScore === null || m.awayScore === null) continue;
      if (m.homeTeamId === teamId) {
        if (m.homeScore > m.awayScore) points += 1;
        else if (m.homeScore === m.awayScore) points += 0.5;
      } else {
        if (m.awayScore > m.homeScore) points += 1;
        else if (m.awayScore === m.homeScore) points += 0.5;
      }
    }

    return points / relevantMatches.length;
  }

  /**
   * Compute player availability as the fraction of squad members with
   * a non-zero influence score. Returns 0–1.
   */
  private async computePlayerAvailability(teamId: string): Promise<number> {
    const players = await this.db
      .select()
      .from(s.players)
      .where(eq(s.players.teamId, teamId));

    if (players.length === 0) return 0.8; // optimistic default

    const available = players.filter((p) => p.influenceScore > 0).length;
    return available / players.length;
  }
}
