import "dotenv/config";
import { db } from "../packages/domain/src/db/index.js";
import { teams, matches } from "../packages/domain/src/db/schema.js";
import { readFileSync } from "fs";
import { join } from "path";
import pg from "pg";
import { migrate } from "drizzle-orm/node-postgres/migrator";


const { Pool } = pg;

async function seed() {
  console.log("🚀 Starting database migrations and seeding...");

  // Run migrations
  try {
    console.log("Applying Drizzle migrations...");
    const migrationPool = new Pool({
      connectionString: process.env.DATABASE_URL,
    });
    // This runs migrations programmatically
    await migrate(db, { migrationsFolder: join(process.cwd(), "packages/domain/migrations") });
    await migrationPool.end();
    console.log("Migrations applied successfully.");
  } catch (err) {
    console.warn("Skipping programmatic migrations or encountered error (ensure DB is running & drizzle-kit has run):", err);
  }

  // Load static JSON seed datasets
  const teamsPath = join(process.cwd(), "data/teams.json");
  const fixturesPath = join(process.cwd(), "data/fixtures.json");

  const teamsData = JSON.parse(readFileSync(teamsPath, "utf8"));
  const fixturesData = JSON.parse(readFileSync(fixturesPath, "utf8"));

  // Seed Teams
  console.log(`Seeding ${teamsData.length} teams...`);
  for (const team of teamsData) {
    await db.insert(teams)
      .values({
        id: team.id,
        name: team.name,
        groupName: team.groupName,
        flagUrl: team.flagUrl,
        eloRating: team.eloRating,
      })
      .onConflictDoUpdate({
        target: teams.id,
        set: {
          name: team.name,
          groupName: team.groupName,
          flagUrl: team.flagUrl,
          eloRating: team.eloRating,
        }
      });
  }

  // Seed Matches/Fixtures
  console.log(`Seeding ${fixturesData.length} fixtures...`);
  for (const match of fixturesData) {
    await db.insert(matches)
      .values({
        matchNumber: match.matchNumber,
        homeTeamId: match.homeTeamId,
        awayTeamId: match.awayTeamId,
        stage: match.stage,
        kickoffTime: new Date(match.kickoffTime),
        status: "Scheduled",
      })
      .onConflictDoUpdate({
        target: matches.matchNumber,
        set: {
          homeTeamId: match.homeTeamId,
          awayTeamId: match.awayTeamId,
          stage: match.stage,
          kickoffTime: new Date(match.kickoffTime),
        }
      });
  }

  console.log("✅ Seeding completed successfully!");
  process.exit(0);
}

seed().catch((err) => {
  console.error("❌ Seeding failed:", err);
  process.exit(1);
});
