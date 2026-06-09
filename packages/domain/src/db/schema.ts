import { pgTable, text, integer, timestamp, real, jsonb, serial, index } from "drizzle-orm/pg-core";

// ────────── Existing Tables (expanded) ──────────

export const teams = pgTable("teams", {
  id: text("id").primaryKey(), // e.g., 'ARG', 'FRA'
  name: text("name").notNull(),
  groupName: text("group_name").notNull(), // 'A' - 'L' (12 groups of 4 teams)
  flagUrl: text("flag_url"),
  eloRating: integer("elo_rating").default(1500).notNull(),
  providerId: text("provider_id"),
}, (table) => ({
  providerIdx: index("teams_provider_idx").on(table.providerId),
}));

export const players = pgTable("players", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  teamId: text("team_id").references(() => teams.id).notNull(),
  position: text("position").notNull(), // 'Goalkeeper', 'Defender', 'Midfielder', 'Forward'
  influenceScore: integer("influence_score").default(50).notNull(),
  providerId: text("provider_id"),
}, (table) => ({
  providerIdx: index("players_provider_idx").on(table.providerId),
}));

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
  providerId: text("provider_id"),
}, (table) => ({
  providerIdx: index("matches_provider_idx").on(table.providerId),
}));

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

// ────────── New Tables ──────────

export const venues = pgTable("venues", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  city: text("city").notNull(),
  country: text("country").notNull(),
  providerId: text("provider_id"),
});

export const matchEvents = pgTable("match_events", {
  id: serial("id").primaryKey(),
  matchId: integer("match_id").references(() => matches.id).notNull(),
  teamId: text("team_id").references(() => teams.id).notNull(),
  playerId: integer("player_id").references(() => players.id),
  eventType: text("event_type").notNull(), // 'Goal', 'YellowCard', 'RedCard', 'Substitution'
  minute: integer("minute").notNull(),
  extraTimeMinute: integer("extra_time_minute"),
  detail: text("detail"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const playerMatchPerformances = pgTable("player_match_performances", {
  id: serial("id").primaryKey(),
  playerId: integer("player_id").references(() => players.id).notNull(),
  matchId: integer("match_id").references(() => matches.id).notNull(),
  teamId: text("team_id").references(() => teams.id).notNull(),
  rating: real("rating").notNull(),
  minutesPlayed: integer("minutes_played").default(0).notNull(),
  goals: integer("goals").default(0).notNull(),
  assists: integer("assists").default(0).notNull(),
  yellowCards: integer("yellow_cards").default(0).notNull(),
  redCards: integer("red_cards").default(0).notNull(),
  shots: integer("shots"),
  shotsOnTarget: integer("shots_on_target"),
  passesAttempted: integer("passes_attempted"),
  passesCompleted: integer("passes_completed"),
  tackles: integer("tackles"),
  interceptions: integer("interceptions"),
  saves: integer("saves"),
  goalsConceded: integer("goals_conceded"),
  cleanSheet: integer("clean_sheet"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const teamMatchStats = pgTable("team_match_stats", {
  id: serial("id").primaryKey(),
  teamId: text("team_id").references(() => teams.id).notNull(),
  matchId: integer("match_id").references(() => matches.id).notNull(),
  possession: real("possession"),
  shots: integer("shots"),
  shotsOnTarget: integer("shots_on_target"),
  passesAttempted: integer("passes_attempted"),
  passesCompleted: integer("passes_completed"),
  corners: integer("corners"),
  fouls: integer("fouls"),
  yellowCards: integer("yellow_cards").default(0).notNull(),
  redCards: integer("red_cards").default(0).notNull(),
  offsides: integer("offsides"),
  expectedGoals: real("expected_goals"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const predictionInputSnapshots = pgTable("prediction_input_snapshots", {
  id: serial("id").primaryKey(),
  predictionId: integer("prediction_id").references(() => predictions.id).notNull(),
  homeTeamElo: integer("home_team_elo").notNull(),
  awayTeamElo: integer("away_team_elo").notNull(),
  homeSquadRating: real("home_squad_rating").notNull(),
  awaySquadRating: real("away_squad_rating").notNull(),
  homeTournamentForm: real("home_tournament_form").notNull(),
  awayTournamentForm: real("away_tournament_form").notNull(),
  homePlayerAvailability: real("home_player_availability").notNull(),
  awayPlayerAvailability: real("away_player_availability").notNull(),
  marketSignal: real("market_signal"),
  inputData: jsonb("input_data").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const providerLogs = pgTable("provider_logs", {
  id: serial("id").primaryKey(),
  provider: text("provider").notNull(), // e.g. 'TheStatsAPI'
  entityType: text("entity_type").notNull(), // e.g. 'fixtures', 'squads'
  rawJsonb: jsonb("raw_jsonb").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const modelMetrics = pgTable("model_metrics", {
  id: serial("id").primaryKey(),
  calculatedAt: timestamp("calculated_at", { withTimezone: true }).defaultNow().notNull(),
  accuracy: real("accuracy").notNull(),
  brierScore: real("brier_score").notNull(),
  logLoss: real("log_loss").notNull(),
  calibration: jsonb("calibration").notNull(),
  modelVersion: text("model_version").notNull(),
});
