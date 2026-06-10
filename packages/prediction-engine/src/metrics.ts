import { eq, inArray } from "drizzle-orm";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import { schemas as s } from "@worldcup/domain";

const MODEL_VERSION = "1.0.0";

interface CalibrationBin {
  bin: string; // e.g., "0.0-0.1"
  count: number;
  accuracy: number; // observed accuracy in this bin
}

/**
 * ModelMetricsService computes aggregate model performance metrics.
 *
 * All metrics are append-only — each call creates a new row in modelMetrics
 * so we can track how the model improves over time.
 */
export class ModelMetricsService {
  private readonly db: NodePgDatabase;

  constructor(db: NodePgDatabase) {
    this.db = db;
  }

  /**
   * Calculate and store model performance metrics.
   *
   * Computes:
   * - Accuracy: fraction of predictions where the highest-probability outcome occurred
   * - Brier score: mean squared error between predicted probabilities and actual outcomes
   * - Log loss: cross-entropy between predicted probabilities and actual outcomes
   * - Calibration: predictions grouped by confidence decile
   */
  async calculateMetrics(): Promise<{
    accuracy: number;
    brierScore: number;
    logLoss: number;
    calibration: CalibrationBin[];
  }> {
    // Fetch all completed matches that have at least one prediction
    const completedMatches = await this.db
      .select()
      .from(s.matches)
      .where(eq(s.matches.status, "Completed"));

    if (completedMatches.length === 0) {
      const emptyCalibration = this.buildCalibrationBins([]);
      const result = { accuracy: 0, brierScore: 0, logLoss: 0, calibration: emptyCalibration };
      await this.storeMetrics(result);
      return result;
    }

    const matchIds = completedMatches.map((m) => m.id);

    // Fetch the most recent prediction for each match (append-only, so take latest by id)
    // We do this efficiently by getting all predictions for our matches
    const allPredictions = await this.db
      .select()
      .from(s.predictions)
      .where(inArray(s.predictions.matchId, matchIds));

    // For each match, get the latest prediction (highest id = most recent)
    const latestPredictions = new Map<number, typeof s.predictions.$inferSelect>();
    for (const p of allPredictions) {
      const existing = latestPredictions.get(p.matchId);
      if (!existing || p.id > existing.id) {
        latestPredictions.set(p.matchId, p);
      }
    }

    const predictions = Array.from(latestPredictions.values());
    if (predictions.length === 0) {
      const emptyCalibration = this.buildCalibrationBins([]);
      const result = { accuracy: 0, brierScore: 0, logLoss: 0, calibration: emptyCalibration };
      await this.storeMetrics(result);
      return result;
    }

    // Build a lookup from matchId to match outcome
    const matchOutcome = new Map<number, { actualHomeWin: boolean; actualDraw: boolean; actualAwayWin: boolean }>();
    for (const m of completedMatches) {
      matchOutcome.set(m.id, {
        actualHomeWin: m.homeScore! > m.awayScore!,
        actualDraw: m.homeScore! === m.awayScore!,
        actualAwayWin: m.awayScore! > m.homeScore!,
      });
    }

    // Compute metrics
    let correctCount = 0;
    let totalBrier = 0;
    let totalLogLoss = 0;
    const calibrationData: { confidence: number; correct: boolean }[] = [];

    for (const p of predictions) {
      const outcome = matchOutcome.get(p.matchId);
      if (!outcome) continue;

      // Determine predicted outcome (highest probability)
      const predictedOutcome =
        p.homeWin >= p.draw && p.homeWin >= p.awayWin
          ? "homeWin"
          : p.draw >= p.homeWin && p.draw >= p.awayWin
            ? "draw"
            : "awayWin";

      // Accuracy
      const wasCorrect =
        (predictedOutcome === "homeWin" && outcome.actualHomeWin) ||
        (predictedOutcome === "draw" && outcome.actualDraw) ||
        (predictedOutcome === "awayWin" && outcome.actualAwayWin);

      if (wasCorrect) correctCount++;

      // Brier score: sum of squared differences
      const brierHome = (p.homeWin - (outcome.actualHomeWin ? 1 : 0)) ** 2;
      const brierDraw = (p.draw - (outcome.actualDraw ? 1 : 0)) ** 2;
      const brierAway = (p.awayWin - (outcome.actualAwayWin ? 1 : 0)) ** 2;
      totalBrier += brierHome + brierDraw + brierAway;

      // Log loss: -sum(y * log(p)) for each class
      const eps = 1e-15; // prevent log(0)
      const ll =
        (outcome.actualHomeWin ? -Math.log(Math.max(p.homeWin, eps)) : 0) +
        (outcome.actualDraw ? -Math.log(Math.max(p.draw, eps)) : 0) +
        (outcome.actualAwayWin ? -Math.log(Math.max(p.awayWin, eps)) : 0);
      totalLogLoss += ll;

      // Calibration data
      calibrationData.push({
        confidence: p.confidence,
        correct: wasCorrect,
      });
    }

    const n = predictions.length;
    const accuracy = Number((correctCount / n).toFixed(4));
    const brierScore = Number((totalBrier / n).toFixed(4));
    const logLoss = Number((totalLogLoss / n).toFixed(4));
    const calibration = this.buildCalibrationBins(calibrationData);

    const result = { accuracy, brierScore, logLoss, calibration };
    await this.storeMetrics(result);
    return result;
  }

  // ────────── private ──────────

  private async storeMetrics(result: {
    accuracy: number;
    brierScore: number;
    logLoss: number;
    calibration: CalibrationBin[];
  }): Promise<void> {
    await this.db.insert(s.modelMetrics).values({
      accuracy: result.accuracy,
      brierScore: result.brierScore,
      logLoss: result.logLoss,
      calibration: result.calibration as unknown as Record<string, unknown>,
      modelVersion: MODEL_VERSION,
    });
  }

  private buildCalibrationBins(
    data: { confidence: number; correct: boolean }[],
  ): CalibrationBin[] {
    const bins: CalibrationBin[] = [];
    const binSize = 0.1;

    for (let i = 0; i < 10; i++) {
      const lower = i * binSize;
      const upper = lower + binSize;
      const binLabel = `${lower.toFixed(1)}-${upper.toFixed(1)}`;

      const inBin = data.filter(
        (d) => d.confidence >= lower && d.confidence < upper,
      );

      if (inBin.length === 0) {
        bins.push({ bin: binLabel, count: 0, accuracy: 0 });
      } else {
        const correctInBin = inBin.filter((d) => d.correct).length;
        bins.push({
          bin: binLabel,
          count: inBin.length,
          accuracy: Number((correctInBin / inBin.length).toFixed(4)),
        });
      }
    }

    return bins;
  }
}
