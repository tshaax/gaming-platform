CREATE TABLE "event_registrations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event_id" uuid NOT NULL,
	"gamer_id" uuid NOT NULL,
	"total_eligible_sessions" integer DEFAULT 1 NOT NULL,
	"used_sessions" integer DEFAULT 0 NOT NULL,
	"status" varchar(50) DEFAULT 'active' NOT NULL,
	"current_round" varchar(50),
	"is_eliminated" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "session_records" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"registration_id" uuid NOT NULL,
	"session_number" integer NOT NULL,
	"status" varchar(50) DEFAULT 'scheduled' NOT NULL,
	"tournament_round" varchar(50),
	"round_number" integer,
	"match_result" varchar(50),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tournament_brackets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event_id" uuid NOT NULL,
	"round_name" varchar(100) NOT NULL,
	"round_number" integer NOT NULL,
	"session_requirement" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "events" ADD COLUMN "eligible_sessions" integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE "event_registrations" ADD CONSTRAINT "event_registrations_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_registrations" ADD CONSTRAINT "event_registrations_gamer_id_users_id_fk" FOREIGN KEY ("gamer_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session_records" ADD CONSTRAINT "session_records_registration_id_event_registrations_id_fk" FOREIGN KEY ("registration_id") REFERENCES "public"."event_registrations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tournament_brackets" ADD CONSTRAINT "tournament_brackets_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_event_registrations_event_id" ON "event_registrations" USING btree ("event_id");--> statement-breakpoint
CREATE INDEX "idx_event_registrations_gamer_id" ON "event_registrations" USING btree ("gamer_id");--> statement-breakpoint
CREATE INDEX "idx_session_records_registration_id" ON "session_records" USING btree ("registration_id");--> statement-breakpoint
CREATE INDEX "idx_tournament_brackets_event_id" ON "tournament_brackets" USING btree ("event_id");