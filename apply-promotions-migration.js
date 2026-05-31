const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || "postgresql://neondb_owner:npg_z6RjZUbvY0uC@ep-morning-glade-aq9yogi3-pooler.c-8.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"
});

const migrationSQL = `
CREATE TABLE IF NOT EXISTS "promotions" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "store_id" uuid REFERENCES "stores"("id") ON DELETE cascade,
  "title" varchar(255) NOT NULL,
  "type" varchar(50) NOT NULL DEFAULT 'discount',
  "promo_code" varchar(50) NOT NULL UNIQUE,
  "discount_value" numeric(5, 2),
  "status" varchar(20) NOT NULL DEFAULT 'scheduled',
  "start_date" timestamp with time zone NOT NULL,
  "end_date" timestamp with time zone NOT NULL,
  "target_audience" varchar(50) NOT NULL DEFAULT 'all_players',
  "max_usage" integer,
  "current_usage" integer NOT NULL DEFAULT 0,
  "description" varchar(1000),
  "created_at" timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at" timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "idx_promotions_status" ON "promotions" USING btree ("status");
CREATE INDEX IF NOT EXISTS "idx_promotions_store_id" ON "promotions" USING btree ("store_id");
CREATE INDEX IF NOT EXISTS "idx_promotions_promo_code" ON "promotions" USING btree ("promo_code");
`;

async function applyMigration() {
  const client = await pool.connect();
  try {
    console.log('Applying promotions migration...');

    const statements = migrationSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0);

    for (let i = 0; i < statements.length; i++) {
      console.log(`\nExecuting statement ${i + 1}/${statements.length}...`);
      console.log(`SQL: ${statements[i].substring(0, 80)}...`);
      await client.query(statements[i]);
      console.log(`✅ Statement ${i + 1} executed`);
    }

    console.log('\n✅ Promotions migration applied successfully!');
    process.exit(0);
  } catch (error) {
    if (error.message.includes('already exists')) {
      console.log('ℹ️  Tables already exist - migration may have been applied already');
      process.exit(0);
    }
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    client.release();
  }
}

applyMigration();
