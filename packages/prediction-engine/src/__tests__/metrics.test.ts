import { describe, it, expect, vi, beforeEach } from "vitest";
import { ModelMetricsService } from "../metrics.js";
import { schemas as s } from "@worldcup/domain";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";

describe("ModelMetricsService", () => {
  let mockDb: any;
  let metricsService: ModelMetricsService;

  beforeEach(() => {
    mockDb = {
      select: vi.fn(),
      insert: vi.fn(),
    };
    metricsService = new ModelMetricsService(mockDb as unknown as NodePgDatabase);
  });

  describe("calculateMetrics", () => {
    it("should return empty metrics if there are no completed matches", async () => {
      mockDb.select.mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([]),
        }),
      });

      const mockValues = vi.fn().mockResolvedValue(undefined);
      mockDb.insert.mockReturnValue({ values: mockValues });

      const result = await metricsService.calculateMetrics();
      expect(result.accuracy).toBe(0);
      expect(result.brierScore).toBe(0);
      expect(result.logLoss).toBe(0);
      expect(result.calibration.length).toBe(10);
      expect(mockDb.insert).toHaveBeenCalledWith(s.modelMetrics);
    });

    it("should correctly compute accuracy, Brier score, and log loss", async () => {
      const mockMatches = [
        { id: 1, status: "Completed", homeScore: 2, awayScore: 1, homeTeamId: "ARG", awayTeamId: "FRA" },
        { id: 2, status: "Completed", homeScore: 1, awayScore: 1, homeTeamId: "BRA", awayTeamId: "GER" },
      ];

      // Match 1: Home Win (ARG won). Prediction had homeWin=0.6, draw=0.2, awayWin=0.2, confidence=0.6
      // Match 2: Draw. Prediction had homeWin=0.3, draw=0.4, awayWin=0.3, confidence=0.4
      const mockPredictions = [
        { id: 10, matchId: 1, homeWin: 0.6, draw: 0.2, awayWin: 0.2, confidence: 0.6 },
        { id: 11, matchId: 2, homeWin: 0.3, draw: 0.4, awayWin: 0.3, confidence: 0.4 },
      ];

      mockDb.select
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockResolvedValue(mockMatches),
          }),
        })
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockResolvedValue(mockPredictions),
          }),
        });

      const mockValues = vi.fn().mockResolvedValue(undefined);
      mockDb.insert.mockReturnValue({ values: mockValues });

      const result = await metricsService.calculateMetrics();

      // Accuracy:
      // Match 1: Predict homeWin (0.6), actual is homeWin -> Correct (1)
      // Match 2: Predict draw (0.4), actual is draw -> Correct (1)
      // Total accuracy: 1.0
      expect(result.accuracy).toBe(1.0);

      // Brier score:
      // Match 1: (0.6 - 1)^2 + (0.2 - 0)^2 + (0.2 - 0)^2 = 0.16 + 0.04 + 0.04 = 0.24
      // Match 2: (0.3 - 0)^2 + (0.4 - 1)^2 + (0.3 - 0)^2 = 0.09 + 0.36 + 0.09 = 0.54
      // Mean Brier score: (0.24 + 0.54) / 2 = 0.39
      expect(result.brierScore).toBeCloseTo(0.39, 2);

      // Log loss:
      // Match 1: -ln(0.6) = 0.5108
      // Match 2: -ln(0.4) = 0.9163
      // Mean log loss: (0.5108 + 0.9163) / 2 = 0.7136
      expect(result.logLoss).toBeCloseTo(0.7136, 4);

      // Calibration:
      // Match 1 (conf 0.6) is in bin 0.6-0.7
      // Match 2 (conf 0.4) is in bin 0.4-0.5
      const bin04 = result.calibration.find((b) => b.bin === "0.4-0.5");
      const bin06 = result.calibration.find((b) => b.bin === "0.6-0.7");
      expect(bin04?.count).toBe(1);
      expect(bin04?.accuracy).toBe(1.0);
      expect(bin06?.count).toBe(1);
      expect(bin06?.accuracy).toBe(1.0);
    });
  });
});
