ALTER TABLE "game_session_results" ADD COLUMN "parent_id" uuid REFERENCES "game_session_results"(id) ON DELETE CASCADE;
CREATE INDEX "idx_game_session_results_parent_id" ON "game_session_results"("parent_id");
