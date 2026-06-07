import { Given, When, Then } from "@cucumber/cucumber";
import assert from "assert";
import { existsSync } from "fs";
import pg from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "../../../packages/domain/src/db/schema.js";
import { teams } from "../../../packages/domain/src/db/schema.js";

const { Pool } = pg;

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

let pool: pg.Pool;
let db: any;
let teamCount = 0;

Given("the database is initialized", function () {
  pool = new Pool({
    connectionString: databaseUrl,
  });
  db = drizzle(pool, { schema });
});

When("I query the database for teams", async function () {
  const result = await db.select().from(teams);
  teamCount = result.length;
});

Then("I should find teams registered in the system", async function () {
  assert.ok(teamCount > 0, "Expected at least one team to be seeded in the database");
  await pool.end();
});
