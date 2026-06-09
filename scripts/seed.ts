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
  process.exit(0);
}

seed().catch((err) => {
  console.error("❌ Seeding failed:", err);
  process.exit(1);
});
