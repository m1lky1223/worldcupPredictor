import { describe, it, expect } from "vitest";
import { EloRating } from "../elo.js";

describe("EloRating", () => {
  const elo = new EloRating();

  describe("expectedScore", () => {
    it("should return 0.5 for equal ratings", () => {
      const score = elo.expectedScore(1500, 1500);
      expect(score).toBeCloseTo(0.5, 4);
    });

    it("should return higher score for stronger team", () => {
      const scoreA = elo.expectedScore(1700, 1500);
      const scoreB = elo.expectedScore(1500, 1700);
      expect(scoreA).toBeGreaterThan(0.5);
      expect(scoreB).toBeLessThan(0.5);
      expect(scoreA + scoreB).toBeCloseTo(1.0, 4);
    });
  });

  describe("updateRating", () => {
    it("should increase rating on win when expected score is lower", () => {
      const current = 1500;
      const expected = 0.5;
      const actual = 1.0; // Win
      const updated = elo.updateRating(current, expected, actual);
      expect(updated).toBe(1516); // 1500 + 32 * (1 - 0.5)
    });

    it("should decrease rating on loss", () => {
      const current = 1500;
      const expected = 0.5;
      const actual = 0.0; // Loss
      const updated = elo.updateRating(current, expected, actual);
      expect(updated).toBe(1484); // 1500 + 32 * (0 - 0.5)
    });

    it("should keep rating same on draw for equal expected score", () => {
      const current = 1500;
      const expected = 0.5;
      const actual = 0.5; // Draw
      const updated = elo.updateRating(current, expected, actual);
      expect(updated).toBe(1500);
    });
  });

  describe("matchProbability", () => {
    it("should sum to 1.0", () => {
      const probs = elo.matchProbability(1600, 1500);
      expect(probs.homeWin + probs.draw + probs.awayWin).toBeCloseTo(1.0, 3);
    });

    it("should peak draw probability at 25% when teams are equal", () => {
      const probs = elo.matchProbability(1500, 1500);
      expect(probs.draw).toBe(0.25);
      expect(probs.homeWin).toBe(0.375);
      expect(probs.awayWin).toBe(0.375);
    });

    it("should decay draw probability as Elo gap widens", () => {
      const probsEqual = elo.matchProbability(1500, 1500);
      const probsUnequal = elo.matchProbability(1800, 1400);
      expect(probsUnequal.draw).toBeLessThan(probsEqual.draw);
      expect(probsUnequal.homeWin).toBeGreaterThan(probsUnequal.awayWin);
    });
  });
});
