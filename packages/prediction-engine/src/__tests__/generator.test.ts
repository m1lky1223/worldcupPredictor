import "dotenv/config";
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { PredictionGenerator } from "../generator.js";
import { eq } from "drizzle-orm";


describe("PredictionGenerator Integration", () => {
  let db: any;
  let s: any;
  let pool: any;
  let generator: PredictionGenerator;

  beforeAll(async () => {
    const domain = await import("@worldcup/domain");
    db = domain.db;
    s = domain.schemas;
    pool = domain.pool;
    generator = new PredictionGenerator(db as any);

    // Clear prediction table before starting tests
    await pool.query("TRUNCATE predictions RESTART IDENTITY CASCADE");
  });

  afterAll(async () => {
    if (pool) {
      // Clear prediction table after tests complete
      await pool.query("TRUNCATE predictions RESTART IDENTITY CASCADE");
    }
  });

  it("should generate a prediction for a match", async () => {
    // Find a scheduled match in the database (seeded on start)
    const [match] = await db
      .select()
      .from(s.matches)
      .where(eq(s.matches.status, "Scheduled"))
      .limit(1);

    expect(match).toBeDefined();

    const prediction = await generator.generatePrediction(match.id);
    expect(prediction).not.toBeNull();
    expect(prediction!.homeWin).toBeGreaterThanOrEqual(0);
    expect(prediction!.awayWin).toBeGreaterThanOrEqual(0);
    expect(prediction!.draw).toBeGreaterThanOrEqual(0);
    expect(prediction!.confidence).toBeGreaterThanOrEqual(0.4);
    expect(prediction!.factors.length).toBeGreaterThan(0);
    expect(prediction!.modelVersion).toBe("1.0.0");

    // Check that it was inserted in the database
    const predictions = await db
      .select()
      .from(s.predictions)
      .where(eq(s.predictions.matchId, match.id));
    expect(predictions.length).toBe(1);

    // Check input snapshot was created
    const snapshots = await db
      .select()
      .from(s.predictionInputSnapshots)
      .where(eq(s.predictionInputSnapshots.predictionId, predictions[0].id));
    expect(snapshots.length).toBe(1);
    expect(typeof snapshots[0].homeTeamElo).toBe("number");
  });

  it("should generate predictions for all scheduled matches", async () => {
    // Clear predictions
    await pool.query("TRUNCATE predictions RESTART IDENTITY CASCADE");

    const results = await generator.generateAllPredictions();
    expect(results.length).toBeGreaterThan(0);

    const allPredictions = await db.select().from(s.predictions);
    expect(allPredictions.length).toBe(results.length);
  });
});
