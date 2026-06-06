CREATE TABLE "game_session_results" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"session_id" uuid NOT NULL,
	"game" varchar(255),
	"score" integer,
	"placement" integer,
	"result" varchar(50),
	"kills" integer DEFAULT 0 NOT NULL,
	"deaths" integer DEFAULT 0 NOT NULL,
	"assists" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pricing_options" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"store_id" uuid NOT NULL,
	"duration_mins" integer NOT NULL,
	"rate_per_hour" numeric(10, 2) NOT NULL,
	"label" varchar(100),
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "promotions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"store_id" uuid,
	"title" varchar(255) NOT NULL,
	"type" varchar(50) DEFAULT 'discount' NOT NULL,
	"promo_code" varchar(50) NOT NULL,
	"discount_value" numeric(5, 2),
	"status" varchar(20) DEFAULT 'scheduled' NOT NULL,
	"start_date" timestamp with time zone NOT NULL,
	"end_date" timestamp with time zone NOT NULL,
	"target_audience" varchar(50) DEFAULT 'all_players' NOT NULL,
	"max_usage" integer,
	"current_usage" integer DEFAULT 0 NOT NULL,
	"description" varchar(1000),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "promotions_promo_code_unique" UNIQUE("promo_code")
);
--> statement-breakpoint
ALTER TABLE "gaming_sessions" ADD COLUMN "opponent_user_id" uuid;--> statement-breakpoint
ALTER TABLE "gaming_sessions" ADD COLUMN "game" varchar(255);--> statement-breakpoint
ALTER TABLE "game_session_results" ADD CONSTRAINT "game_session_results_session_id_gaming_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."gaming_sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pricing_options" ADD CONSTRAINT "pricing_options_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "promotions" ADD CONSTRAINT "promotions_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_game_session_results_session_id" ON "game_session_results" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX "idx_pricing_options_store_id" ON "pricing_options" USING btree ("store_id");--> statement-breakpoint
CREATE INDEX "idx_promotions_status" ON "promotions" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_promotions_store_id" ON "promotions" USING btree ("store_id");--> statement-breakpoint
CREATE INDEX "idx_promotions_promo_code" ON "promotions" USING btree ("promo_code");--> statement-breakpoint
ALTER TABLE "gaming_sessions" ADD CONSTRAINT "gaming_sessions_opponent_user_id_users_id_fk" FOREIGN KEY ("opponent_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_gaming_sessions_opponent_user_id" ON "gaming_sessions" USING btree ("opponent_user_id");