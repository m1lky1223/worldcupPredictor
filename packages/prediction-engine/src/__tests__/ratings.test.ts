import { describe, it, expect, vi, beforeEach } from "vitest";
import { RatingService } from "../ratings.js";
import { schemas as s } from "@worldcup/domain";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";

describe("RatingService", () => {
  let mockDb: any;
  let ratingService: RatingService;

  beforeEach(() => {
    mockDb = {
      select: vi.fn(),
      insert: vi.fn(),
      update: vi.fn(),
    };
    ratingService = new RatingService(mockDb as unknown as NodePgDatabase);
  });

  describe("updateRatingsAfterMatch", () => {
    it("should return null if match not found", async () => {
      mockDb.select.mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([]),
          }),
        }),
      });

      const result = await ratingService.updateRatingsAfterMatch(1);
      expect(result).toBeNull();
    });

    it("should return null if match status is not Completed", async () => {
      const mockMatch = { id: 1, status: "Scheduled", homeTeamId: "ARG", awayTeamId: "FRA" };
      mockDb.select.mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([mockMatch]),
          }),
        }),
      });

      const result = await ratingService.updateRatingsAfterMatch(1);
      expect(result).toBeNull();
    });

    it("should calculate new Elos, insert snapshots, and update teams", async () => {
      const mockMatch = {
        id: 1,
        status: "Completed",
        homeTeamId: "ARG",
        awayTeamId: "FRA",
        homeScore: 3,
        awayScore: 1,
      };
      const mockHomeTeam = { id: "ARG", eloRating: 1800 };
      const mockAwayTeam = { id: "FRA", eloRating: 1700 };

      // Chained returns for the three selects: match, homeTeam, awayTeam
      mockDb.select
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue([mockMatch]),
            }),
          }),
        })
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue([mockHomeTeam]),
            }),
          }),
        })
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue([mockAwayTeam]),
            }),
          }),
        });

      const mockValues = vi.fn().mockResolvedValue(undefined);
      mockDb.insert.mockReturnValue({ values: mockValues });

      const mockWhere = vi.fn().mockResolvedValue(undefined);
      const mockSet = vi.fn().mockReturnValue({ where: mockWhere });
      mockDb.update.mockReturnValue({ set: mockSet });

      const result = await ratingService.updateRatingsAfterMatch(1);

      expect(result).not.toBeNull();
      // ARG rating: 1800. Expected win probability is higher but let's check
      // expected score for ARG = 1 / (1 + 10^((1700-1800)/400)) = 1 / (1 + 10^(-0.25)) = 0.64
      // ARG won: actual = 1
      // ARG new rating: 1800 + 32 * (1 - 0.64) = 1800 + 32 * 0.36 = 1812
      expect(result?.homeNewElo).toBeGreaterThan(1800);
      expect(result?.awayNewElo).toBeLessThan(1700);

      // Verify db.insert was called for snapshots
      expect(mockDb.insert).toHaveBeenCalledWith(s.ratingsSnapshots);
      expect(mockValues).toHaveBeenCalledTimes(2);

      // Verify db.update was called for team rating updates
      expect(mockDb.update).toHaveBeenCalledWith(s.teams);
      expect(mockSet).toHaveBeenCalledTimes(2);
    });
  });
});
