import { PredictionPayload, Factor } from "@worldcup/domain";

export function calculateEloProbability(homeElo: number, awayElo: number): PredictionPayload {
  const ratingDiff = awayElo - homeElo;
  const homeWinProb = 1 / (1 + Math.pow(10, ratingDiff / 400));
  const drawProb = 0.25; // baseline draw probability
  const awayWinProb = 1 - homeWinProb - drawProb;

  const factors: Factor[] = [
    { factor: "Baseline Elo rating difference", weight: 0.8 },
  ];

  return {
    homeWin: Number(homeWinProb.toFixed(4)),
    draw: drawProb,
    awayWin: Number(awayWinProb.toFixed(4)),
    confidence: 0.75,
    factors,
    timestamp: new Date().toISOString(),
  };
}
