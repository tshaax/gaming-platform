ALTER TABLE "game_session_results" ADD COLUMN "verified_by" uuid REFERENCES "users"(id) ON DELETE SET NULL;
ALTER TABLE "game_session_results" ADD COLUMN "verified_at" timestamp with time zone;
ALTER TABLE "game_session_results" ADD COLUMN "verification_status" varchar(20) DEFAULT 'pending';
ALTER TABLE "game_session_results" ADD COLUMN "verification_notes" varchar(1000);
CREATE INDEX "idx_game_session_results_verification_status" ON "game_session_results"("verification_status");
