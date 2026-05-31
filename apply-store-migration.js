const { Pool } = require('pg');

const pool = new Pool({
  connectionString: "postgresql://neondb_owner:npg_z6RjZUbvY0uC@ep-morning-glade-aq9yogi3-pooler.c-8.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"
});

const migrationSQL = `
ALTER TABLE "events" ADD COLUMN "store_id" uuid;
ALTER TABLE "events" ADD CONSTRAINT "events_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE cascade ON UPDATE no action;
CREATE INDEX "idx_events_store_id" ON "events" USING btree ("store_id");
`;

async function applyMigration() {
  const client = await pool.connect();
  try {
    console.log('Applying store_id column migration...');

    const statements = migrationSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0);

    for (let i = 0; i < statements.length; i++) {
      console.log(`\nExecuting statement ${i + 1}/${statements.length}...`);
      console.log(`SQL: ${statements[i].substring(0, 60)}...`);
      await client.query(statements[i]);
      console.log(`✅ Statement ${i + 1} executed`);
    }

    console.log('\n✅ Migration applied successfully!');
    process.exit(0);
  } catch (error) {
    if (error.message.includes('already exists')) {
      console.log('ℹ️  Column already exists - migration may have been applied already');
      process.exit(0);
    }
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    client.release();
  }
}

applyMigration();
