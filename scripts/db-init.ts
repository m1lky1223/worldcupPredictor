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
    const existingMatches = await db.select().from(matches).limit(105);
    const needsMatchSeed = existingMatches.length < 104;

    if (existingTeams.length === 0 || needsMatchSeed) {
      if (existingTeams.length === 0) {
        console.log("No teams found. Seeding initial data...");
      } else {
        console.log(`Found ${existingMatches.length} matches, need 104. Re-seeding matches...`);
      }

      // Load static JSON seed datasets
      const teamsPath = join(process.cwd(), "data/teams.json");

      const teamsData = JSON.parse(readFileSync(teamsPath, "utf8"));

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

      // Seed 104 Matches programmatically
      // 72 Group Stage: 12 groups x 6 round-robin matches
      const groups = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L"];
      let matchNo = 1;
      const baseDate = new Date("2026-06-11T17:00:00Z");

      // Group stage round-robin pairings (4 teams → 6 matches)
      const pairings: [number, number][] = [[0, 1], [2, 3], [0, 2], [1, 3], [0, 3], [1, 2]];

      for (const groupName of groups) {
        const groupTeams = teamsData.filter((t: any) => t.groupName === groupName);

        for (const [idxHome, idxAway] of pairings) {
          const home = groupTeams[idxHome];
          const away = groupTeams[idxAway];

          // Offset kickoff by 3 hours per match
          const kickoff = new Date(baseDate.getTime() + (matchNo - 1) * 3 * 60 * 60 * 1000);

          await db.insert(matches)
            .values({
              matchNumber: matchNo,
              homeTeamId: home.id,
              awayTeamId: away.id,
              stage: "Group",
              kickoffTime: kickoff,
              status: "Scheduled",
            })
            .onConflictDoUpdate({
              target: matches.matchNumber,
              set: { homeTeamId: home.id, awayTeamId: away.id, stage: "Group", kickoffTime: kickoff }
            });

          matchNo++;
        }
      }

      // Seed Knockout Placeholders (32 matches: matchNumber 73 to 104)
      const knockoutStages: { count: number; stage: string }[] = [
        { count: 16, stage: "Round of 32" },
        { count: 8, stage: "Round of 16" },
        { count: 4, stage: "Quarterfinals" },
        { count: 2, stage: "Semifinals" },
        { count: 1, stage: "Third Place" },
        { count: 1, stage: "Final" },
      ];

      for (const subStage of knockoutStages) {
        for (let i = 0; i < subStage.count; i++) {
          // Offset by 1 day per knockout match
          const kickoff = new Date(baseDate.getTime() + (matchNo - 1) * 24 * 60 * 60 * 1000);

          await db.insert(matches)
            .values({
              matchNumber: matchNo,
              homeTeamId: null,
              awayTeamId: null,
              stage: subStage.stage,
              kickoffTime: kickoff,
              status: "Scheduled",
            })
            .onConflictDoUpdate({
              target: matches.matchNumber,
              set: { stage: subStage.stage, kickoffTime: kickoff }
            });

          matchNo++;
        }
      }

      const groupCount = 12 * 6; // 72
      const knockoutCount = 16 + 8 + 4 + 2 + 1 + 1; // 32
      console.log(`✅ Seeded ${groupCount + knockoutCount} matches successfully (${groupCount} Group, ${knockoutCount} Knockouts).`);
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
