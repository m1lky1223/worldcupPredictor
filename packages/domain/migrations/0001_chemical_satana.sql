CREATE TABLE IF NOT EXISTS "match_events" (
	"id" serial PRIMARY KEY NOT NULL,
	"match_id" integer NOT NULL,
	"team_id" text NOT NULL,
	"player_id" integer,
	"event_type" text NOT NULL,
	"minute" integer NOT NULL,
	"extra_time_minute" integer,
	"detail" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "model_metrics" (
	"id" serial PRIMARY KEY NOT NULL,
	"calculated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"accuracy" real NOT NULL,
	"brier_score" real NOT NULL,
	"log_loss" real NOT NULL,
	"calibration" jsonb NOT NULL,
	"model_version" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "player_match_performances" (
	"id" serial PRIMARY KEY NOT NULL,
	"player_id" integer NOT NULL,
	"match_id" integer NOT NULL,
	"team_id" text NOT NULL,
	"rating" real NOT NULL,
	"minutes_played" integer DEFAULT 0 NOT NULL,
	"goals" integer DEFAULT 0 NOT NULL,
	"assists" integer DEFAULT 0 NOT NULL,
	"yellow_cards" integer DEFAULT 0 NOT NULL,
	"red_cards" integer DEFAULT 0 NOT NULL,
	"shots" integer,
	"shots_on_target" integer,
	"passes_attempted" integer,
	"passes_completed" integer,
	"tackles" integer,
	"interceptions" integer,
	"saves" integer,
	"goals_conceded" integer,
	"clean_sheet" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "prediction_input_snapshots" (
	"id" serial PRIMARY KEY NOT NULL,
	"prediction_id" integer NOT NULL,
	"home_team_elo" integer NOT NULL,
	"away_team_elo" integer NOT NULL,
	"home_squad_rating" real NOT NULL,
	"away_squad_rating" real NOT NULL,
	"home_tournament_form" real NOT NULL,
	"away_tournament_form" real NOT NULL,
	"home_player_availability" real NOT NULL,
	"away_player_availability" real NOT NULL,
	"market_signal" real,
	"input_data" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "provider_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"provider" text NOT NULL,
	"entity_type" text NOT NULL,
	"raw_jsonb" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "team_match_stats" (
	"id" serial PRIMARY KEY NOT NULL,
	"team_id" text NOT NULL,
	"match_id" integer NOT NULL,
	"possession" real,
	"shots" integer,
	"shots_on_target" integer,
	"passes_attempted" integer,
	"passes_completed" integer,
	"corners" integer,
	"fouls" integer,
	"yellow_cards" integer DEFAULT 0 NOT NULL,
	"red_cards" integer DEFAULT 0 NOT NULL,
	"offsides" integer,
	"expected_goals" real,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "venues" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"city" text NOT NULL,
	"country" text NOT NULL,
	"provider_id" text
);
--> statement-breakpoint
ALTER TABLE "matches" ADD COLUMN "provider_id" text;--> statement-breakpoint
ALTER TABLE "players" ADD COLUMN "provider_id" text;--> statement-breakpoint
ALTER TABLE "teams" ADD COLUMN "provider_id" text;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "matches_provider_idx" ON "matches" ("provider_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "players_provider_idx" ON "players" ("provider_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "teams_provider_idx" ON "teams" ("provider_id");--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "match_events" ADD CONSTRAINT "match_events_match_id_matches_id_fk" FOREIGN KEY ("match_id") REFERENCES "matches"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "match_events" ADD CONSTRAINT "match_events_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "teams"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "match_events" ADD CONSTRAINT "match_events_player_id_players_id_fk" FOREIGN KEY ("player_id") REFERENCES "players"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "player_match_performances" ADD CONSTRAINT "player_match_performances_player_id_players_id_fk" FOREIGN KEY ("player_id") REFERENCES "players"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "player_match_performances" ADD CONSTRAINT "player_match_performances_match_id_matches_id_fk" FOREIGN KEY ("match_id") REFERENCES "matches"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "player_match_performances" ADD CONSTRAINT "player_match_performances_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "teams"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "prediction_input_snapshots" ADD CONSTRAINT "prediction_input_snapshots_prediction_id_predictions_id_fk" FOREIGN KEY ("prediction_id") REFERENCES "predictions"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "team_match_stats" ADD CONSTRAINT "team_match_stats_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "teams"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "team_match_stats" ADD CONSTRAINT "team_match_stats_match_id_matches_id_fk" FOREIGN KEY ("match_id") REFERENCES "matches"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
