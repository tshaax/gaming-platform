-- Add eligible_sessions column to events table
ALTER TABLE "events" ADD COLUMN "eligible_sessions" integer DEFAULT 1;

-- Create event_registrations table
CREATE TABLE "event_registrations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event_id" uuid NOT NULL,
	"gamer_id" uuid NOT NULL,
	"total_eligible_sessions" integer NOT NULL DEFAULT 1,
	"used_sessions" integer NOT NULL DEFAULT 0,
	"status" varchar(50) NOT NULL DEFAULT 'active',
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

-- Create session_records table
CREATE TABLE "session_records" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"registration_id" uuid NOT NULL,
	"session_number" integer NOT NULL,
	"status" varchar(50) NOT NULL DEFAULT 'scheduled',
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);

-- Add foreign keys
ALTER TABLE "event_registrations" ADD CONSTRAINT "event_registrations_event_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "event_registrations" ADD CONSTRAINT "event_registrations_gamer_id_fk" FOREIGN KEY ("gamer_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "session_records" ADD CONSTRAINT "session_records_registration_id_fk" FOREIGN KEY ("registration_id") REFERENCES "public"."event_registrations"("id") ON DELETE cascade ON UPDATE no action;

-- Create indexes
CREATE INDEX "idx_event_registrations_event_id" ON "event_registrations" USING btree ("event_id");
CREATE INDEX "idx_event_registrations_gamer_id" ON "event_registrations" USING btree ("gamer_id");
CREATE INDEX "idx_session_records_registration_id" ON "session_records" USING btree ("registration_id");
