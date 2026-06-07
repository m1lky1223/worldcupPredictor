import { pgTable, text, integer, timestamp, real, jsonb, serial } from "drizzle-orm/pg-core";

export const teams = pgTable("teams", {
  id: text("id").primaryKey(), // e.g., 'ARG', 'FRA'
  name: text("name").notNull(),
  groupName: text("group_name").notNull(), // 'A' - 'L' (12 groups of 4 teams)
  flagUrl: text("flag_url"),
  eloRating: integer("elo_rating").default(1500).notNull(),
});

export const players = pgTable("players", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  teamId: text("team_id").references(() => teams.id).notNull(),
  position: text("position").notNull(), // 'Goalkeeper', 'Defender', 'Midfielder', 'Forward'
  influenceScore: integer("influence_score").default(50).notNull(),
});

export const matches = pgTable("matches", {
  id: serial("id").primaryKey(),
  matchNumber: integer("match_number").notNull().unique(),
  homeTeamId: text("home_team_id").references(() => teams.id),
  awayTeamId: text("away_team_id").references(() => teams.id),
  status: text("status").default("Scheduled").notNull(), // 'Scheduled', 'Live', 'Completed'
  stage: text("stage").notNull(), // 'Group', 'Round of 32', 'Round of 16', 'Quarterfinals', 'Semifinals', 'Final'
  kickoffTime: timestamp("kickoff_time", { withTimezone: true }).notNull(),
  homeScore: integer("home_score"),
  awayScore: integer("away_score"),
});

export const predictions = pgTable("predictions", {
  id: serial("id").primaryKey(),
  matchId: integer("match_id").references(() => matches.id).notNull(),
  homeWin: real("home_win").notNull(), // probability 0.0 - 1.0
  draw: real("draw").notNull(),
  awayWin: real("away_win").notNull(),
  confidence: real("confidence").notNull(),
  factors: jsonb("factors").notNull(), // Array of contributing factors e.g., [{ factor: '...', weight: 0.2 }]
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const ratingsSnapshots = pgTable("ratings_snapshots", {
  id: serial("id").primaryKey(),
  teamId: text("team_id").references(() => teams.id).notNull(),
  playerId: integer("player_id").references(() => players.id),
  eloRating: integer("elo_rating").notNull(),
  influenceScore: integer("influence_score"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const oddsHistory = pgTable("odds_history", {
  id: serial("id").primaryKey(),
  matchId: integer("match_id").references(() => matches.id).notNull(),
  bookmaker: text("bookmaker").notNull(), // e.g., 'DraftKings', 'Bet365'
  homeOdds: real("home_odds").notNull(),
  drawOdds: real("draw_odds").notNull(),
  awayOdds: real("away_odds").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});
