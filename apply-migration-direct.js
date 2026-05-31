const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const pool = new Pool({
  connectionString: "postgresql://neondb_owner:npg_z6RjZUbvY0uC@ep-morning-glade-aq9yogi3-pooler.c-8.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"
});

async function applyMigration() {
  const client = await pool.connect();
  try {
    console.log('Reading migration file...');
    const migrationPath = path.join(__dirname, 'drizzle/migrations/0002_slow_gorgon.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    console.log('Applying migration...');

    // Split by statement breakpoints
    const statements = migrationSQL
      .split('\n')
      .filter(line => !line.startsWith('-->'))
      .join('\n')
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0)
      .map(stmt => stmt + ';');

    for (let i = 0; i < statements.length; i++) {
      const stmt = statements[i];
      console.log(`\nExecuting statement ${i + 1}/${statements.length}...`);
      console.log(`SQL: ${stmt.substring(0, 80)}...`);
      await client.query(stmt);
      console.log(`✅ Statement ${i + 1} executed successfully`);
    }

    console.log('\n✅ Migration applied successfully!');

    // Verify tables exist
    console.log('\nVerifying tables...');
    const eventsCheck = await client.query(
      "SELECT EXISTS(SELECT 1 FROM information_schema.tables WHERE table_name='events')"
    );
    const resultsCheck = await client.query(
      "SELECT EXISTS(SELECT 1 FROM information_schema.tables WHERE table_name='event_results')"
    );

    console.log(`Events table exists: ${eventsCheck.rows[0].exists}`);
    console.log(`Event_results table exists: ${resultsCheck.rows[0].exists}`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Migration error:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  } finally {
    client.release();
  }
}

applyMigration().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
