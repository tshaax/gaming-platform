-- Add tournament round tracking to session_records
ALTER TABLE "session_records" ADD COLUMN "tournament_round" varchar(50);
ALTER TABLE "session_records" ADD COLUMN "round_number" integer;
ALTER TABLE "session_records" ADD COLUMN "match_result" varchar(50);

-- Add tournament bracket info to event_registrations
ALTER TABLE "event_registrations" ADD COLUMN "current_round" varchar(50);
ALTER TABLE "event_registrations" ADD COLUMN "is_eliminated" boolean DEFAULT false;

-- Create tournament_brackets table
CREATE TABLE "tournament_brackets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event_id" uuid NOT NULL,
	"round_name" varchar(100) NOT NULL,
	"round_number" integer NOT NULL,
	"session_requirement" integer NOT NULL DEFAULT 1,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);

-- Create foreign key
ALTER TABLE "tournament_brackets" ADD CONSTRAINT "tournament_brackets_event_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;

-- Create index
CREATE INDEX "idx_tournament_brackets_event_id" ON "tournament_brackets" USING btree ("event_id");
