ALTER TABLE "game_session_results" ADD COLUMN "game_type" varchar(20) DEFAULT 'solo';--> statement-breakpoint
ALTER TABLE "game_session_results" ADD COLUMN "opponent_user_id" uuid;--> statement-breakpoint
ALTER TABLE "game_session_results" ADD COLUMN "player1_score" integer;--> statement-breakpoint
ALTER TABLE "game_session_results" ADD COLUMN "player2_score" integer;--> statement-breakpoint
ALTER TABLE "game_session_results" ADD COLUMN "winner" varchar(20);--> statement-breakpoint
ALTER TABLE "game_session_results" ADD CONSTRAINT "game_session_results_opponent_user_id_users_id_fk" FOREIGN KEY ("opponent_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_game_session_results_opponent_user_id" ON "game_session_results" USING btree ("opponent_user_id");