/**
 * EloRating — core Elo calculation engine for the 2026 World Cup Predictor.
 *
 * Based on the classic Elo rating system with a draw probability adjustment
 * that shrinks as the rating gap widens.
 */

const DEFAULT_K = 32;
const DEFAULT_RATING = 1500;

export interface MatchProbabilities {
  homeWin: number;
  draw: number;
  awayWin: number;
}

export class EloRating {
  private readonly K: number;

  constructor(kFactor: number = DEFAULT_K) {
    this.K = kFactor;
  }

  static get DEFAULT_RATING(): number {
    return DEFAULT_RATING;
  }

  /**
   * Compute the expected score for player/team A against player/team B.
   * Returns a value between 0 and 1 representing A's expected outcome.
   */
  expectedScore(ratingA: number, ratingB: number): number {
    return 1 / (1 + Math.pow(10, (ratingB - ratingA) / 400));
  }

  /**
   * Update a rating given its expected score and the actual outcome.
   * `actual` is 1 for win, 0.5 for draw, 0 for loss.
   */
  updateRating(current: number, expected: number, actual: number): number {
    return Math.round(current + this.K * (actual - expected));
  }

  /**
   * Compute match probabilities from home/away Elo ratings.
   *
   * Draw probability is modeled as ~25% of the non-differentiated probability,
   * decreasing as the rating gap grows. The three probabilities always sum to 1.0.
   */
  matchProbability(homeElo: number, awayElo: number): MatchProbabilities {
    const rawHomeWin = this.expectedScore(homeElo, awayElo);
    const rawAwayWin = 1 - rawHomeWin;

    // Draw probability: peaks at ~25% when teams are equal, decays as gap widens
    const gapFactor = 1 - Math.abs(rawHomeWin - rawAwayWin);
    const drawProb = 0.25 * gapFactor;

    // Scale home and away to fill remaining probability
    const remaining = 1 - drawProb;
    const homeWin = rawHomeWin * remaining;
    const awayWin = rawAwayWin * remaining;

    return {
      homeWin: Number(homeWin.toFixed(4)),
      draw: Number(drawProb.toFixed(4)),
      awayWin: Number(awayWin.toFixed(4)),
    };
  }
}
