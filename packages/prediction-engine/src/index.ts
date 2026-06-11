/**
 * @worldcup/prediction-engine
 *
 * Elo-based prediction engine for the 2026 World Cup Predictor.
 *
 * ## Quick Start
 *
 * ```ts
 * import { EloRating } from "@worldcup/prediction-engine";
 *
 * const elo = new EloRating();
 * const probs = elo.matchProbability(1500, 1500);
 * // { homeWin: 0.375, draw: 0.25, awayWin: 0.375 }
 * ```
 *
 * ## Architecture
 *
 * - **EloRating** — Core Elo math (expected score, rating updates, match probabilities).
 * - **PredictionGenerator** — Queries matches/teams from DB, computes predictions, stores
 *   them append-only with input data snapshots.
 * - **RatingService** — Updates team Elo after a completed match, records snapshots.
 * - **ModelMetricsService** — Computes aggregate accuracy, Brier score, log loss,
 *   and calibration bins.
 */

export { EloRating } from "./elo.js";
export type { MatchProbabilities } from "./elo.js";
export { PredictionGenerator } from "./generator.js";
export { RatingService } from "./ratings.js";
export { ModelMetricsService } from "./metrics.js";

import { Factor, PredictionPayload } from "@worldcup/domain";
import { EloRating } from "./elo.js";

/**
 * Calculate match outcome probabilities from two Elo ratings.
 *
 * Uses the improved draw-probability model from EloRating.matchProbability
 * where draw likelihood decreases as the rating gap widens.
 *
 * This is a convenience wrapper — for full pipeline use PredictionGenerator.
 */
export function calculateEloProbability(homeElo: number, awayElo: number): PredictionPayload {
  const elo = new EloRating();
  const probs = elo.matchProbability(homeElo, awayElo);

  const factors: Factor[] = [
    { factor: "Baseline Elo rating difference", weight: 0.8 },
  ];

  return {
    homeWin: probs.homeWin,
    draw: probs.draw,
    awayWin: probs.awayWin,
    confidence: 0.75,
    factors,
    timestamp: new Date().toISOString(),
    modelVersion: "1.0.0",
  };
}
