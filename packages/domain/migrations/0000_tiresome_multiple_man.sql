CREATE TABLE IF NOT EXISTS "matches" (
	"id" serial PRIMARY KEY NOT NULL,
	"match_number" integer NOT NULL,
	"home_team_id" text,
	"away_team_id" text,
	"status" text DEFAULT 'Scheduled' NOT NULL,
	"stage" text NOT NULL,
	"kickoff_time" timestamp with time zone NOT NULL,
	"home_score" integer,
	"away_score" integer,
	CONSTRAINT "matches_match_number_unique" UNIQUE("match_number")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "odds_history" (
	"id" serial PRIMARY KEY NOT NULL,
	"match_id" integer NOT NULL,
	"bookmaker" text NOT NULL,
	"home_odds" real NOT NULL,
	"draw_odds" real NOT NULL,
	"away_odds" real NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "players" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"team_id" text NOT NULL,
	"position" text NOT NULL,
	"influence_score" integer DEFAULT 50 NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "predictions" (
	"id" serial PRIMARY KEY NOT NULL,
	"match_id" integer NOT NULL,
	"home_win" real NOT NULL,
	"draw" real NOT NULL,
	"away_win" real NOT NULL,
	"confidence" real NOT NULL,
	"factors" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "ratings_snapshots" (
	"id" serial PRIMARY KEY NOT NULL,
	"team_id" text NOT NULL,
	"player_id" integer,
	"elo_rating" integer NOT NULL,
	"influence_score" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "teams" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"group_name" text NOT NULL,
	"flag_url" text,
	"elo_rating" integer DEFAULT 1500 NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "matches" ADD CONSTRAINT "matches_home_team_id_teams_id_fk" FOREIGN KEY ("home_team_id") REFERENCES "teams"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "matches" ADD CONSTRAINT "matches_away_team_id_teams_id_fk" FOREIGN KEY ("away_team_id") REFERENCES "teams"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "odds_history" ADD CONSTRAINT "odds_history_match_id_matches_id_fk" FOREIGN KEY ("match_id") REFERENCES "matches"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "players" ADD CONSTRAINT "players_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "teams"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "predictions" ADD CONSTRAINT "predictions_match_id_matches_id_fk" FOREIGN KEY ("match_id") REFERENCES "matches"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "ratings_snapshots" ADD CONSTRAINT "ratings_snapshots_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "teams"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "ratings_snapshots" ADD CONSTRAINT "ratings_snapshots_player_id_players_id_fk" FOREIGN KEY ("player_id") REFERENCES "players"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
