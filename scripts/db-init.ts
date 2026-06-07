import "dotenv/config";
import { existsSync, readFileSync } from "fs";
import { join } from "path";
import pg from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import * as schema from "../packages/domain/src/db/schema.js";
import { teams, matches } from "../packages/domain/src/db/schema.js";

const { Pool } = pg;

async function init() {
  console.log("🚀 Starting database migrations and conditional seeding...");

  // 1. Resolve host
  const isDocker = existsSync("/.dockerenv") || process.env.IS_DOCKER === "true";
  let databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    const host = isDocker ? "postgres" : "localhost";
    databaseUrl = `postgres://postgres:password@${host}:5432/worldcup`;
  } else {
    const url = new URL(databaseUrl);
    if (isDocker && (url.hostname === "localhost" || url.hostname === "127.0.0.1")) {
      url.hostname = "postgres";
      databaseUrl = url.toString();
    } else if (!isDocker && url.hostname === "postgres") {
      url.hostname = "localhost";
      databaseUrl = url.toString();
    }
  }

  // Sync back to environment
  process.env.DATABASE_URL = databaseUrl;
  console.log(`Resolved DATABASE_URL: ${databaseUrl.replace(/:[^:@/]+@/, ":****@")}`);

  const pool = new Pool({
    connectionString: databaseUrl,
  });
  const db = drizzle(pool, { schema });

  // 2. Run migrations
  try {
    console.log("Applying Drizzle migrations...");
    await migrate(db, { migrationsFolder: join(process.cwd(), "packages/domain/migrations") });
    console.log("Migrations applied successfully.");
  } catch (err) {
    console.error("❌ Failed to apply migrations:", err);
    await pool.end();
    process.exit(1);
  }

  // 3. Check if seeding is required (query teams)
  try {
    console.log("Checking if seeding is required...");
    const existingTeams = await db.select().from(teams).limit(1);

    if (existingTeams.length === 0) {
      console.log("No teams found. Seeding initial data...");

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
    } else {
      console.log("Database already populated. Seeding skipped.");
    }
  } catch (err) {
    console.error("❌ Database query or seeding failed:", err);
    await pool.end();
    process.exit(1);
  }

  await pool.end();
  console.log("👋 Done initializing database.");
  process.exit(0);
}

init().catch((err) => {
  console.error("❌ Unexpected failure in db-init:", err);
  process.exit(1);
});
