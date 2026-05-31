const { Pool } = require('pg');

const pool = new Pool({
  connectionString: "postgresql://neondb_owner:npg_z6RjZUbvY0uC@ep-morning-glade-aq9yogi3-pooler.c-8.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"
});

const createEventsSql = `
CREATE TABLE "events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" varchar(255) NOT NULL,
	"game" varchar(255),
	"event_type" varchar(50) DEFAULT 'tournament' NOT NULL,
	"start_date" timestamp with time zone NOT NULL,
	"end_date" timestamp with time zone,
	"prize_pool" numeric(10, 2),
	"max_players" integer,
	"current_players" integer DEFAULT 0 NOT NULL,
	"status" varchar(20) DEFAULT 'upcoming' NOT NULL,
	"description" varchar(1000),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
`;

const createEventResultsSql = `
CREATE TABLE "event_results" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event_id" uuid NOT NULL,
	"player_username" varchar(255) NOT NULL,
	"result" varchar(20) NOT NULL,
	"placement" integer,
	"score" varchar(100),
	"points_earned" integer,
	"kills" integer DEFAULT 0 NOT NULL,
	"deaths" integer DEFAULT 0 NOT NULL,
	"assists" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
`;

const createForeignKeySql = `
ALTER TABLE "event_results" ADD CONSTRAINT "event_results_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;
`;

const createIndexSql = `
CREATE INDEX "idx_event_results_event_id" ON "event_results" USING btree ("event_id");
CREATE INDEX "idx_events_status" ON "events" USING btree ("status");
`;

async function createTables() {
  const client = await pool.connect();
  try {
    console.log('Creating events table...');
    await client.query(createEventsSql);
    console.log('✅ Events table created');

    console.log('Creating event_results table...');
    await client.query(createEventResultsSql);
    console.log('✅ Event_results table created');

    console.log('Creating foreign key constraint...');
    await client.query(createForeignKeySql);
    console.log('✅ Foreign key constraint created');

    console.log('Creating indexes...');
    await client.query(createIndexSql);
    console.log('✅ Indexes created');

    console.log('\n✅ All missing tables created successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    client.release();
  }
}

createTables().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
