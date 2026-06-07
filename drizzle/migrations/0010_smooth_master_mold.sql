ALTER TABLE "gaming_sessions" ADD COLUMN "event_id" uuid;--> statement-breakpoint
ALTER TABLE "gaming_sessions" ADD CONSTRAINT "gaming_sessions_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_gaming_sessions_event_id" ON "gaming_sessions" USING btree ("event_id");