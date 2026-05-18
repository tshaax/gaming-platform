CREATE TABLE "cashiers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"store_id" uuid NOT NULL,
	"first_name" varchar(255) NOT NULL,
	"last_name" varchar(255) NOT NULL,
	"email" varchar(255) NOT NULL,
	"phone" varchar(20) NOT NULL,
	"password_reset_required" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "stores" ADD COLUMN "address" varchar(500);--> statement-breakpoint
ALTER TABLE "stores" ADD COLUMN "tax_number" varchar(50);--> statement-breakpoint
ALTER TABLE "stores" ADD COLUMN "manager" varchar(255);--> statement-breakpoint
ALTER TABLE "stores" ADD COLUMN "contact_person" varchar(255);--> statement-breakpoint
ALTER TABLE "stores" ADD COLUMN "contact_phone" varchar(20);--> statement-breakpoint
ALTER TABLE "stores" ADD COLUMN "updated_at" timestamp with time zone DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "cashiers" ADD CONSTRAINT "cashiers_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cashiers" ADD CONSTRAINT "cashiers_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_cashiers_user_id" ON "cashiers" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_cashiers_store_id" ON "cashiers" USING btree ("store_id");--> statement-breakpoint
CREATE INDEX "idx_cashiers_email" ON "cashiers" USING btree ("email");