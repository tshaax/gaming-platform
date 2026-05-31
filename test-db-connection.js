const { Pool } = require('pg');

const pool = new Pool({
  connectionString: "postgresql://neondb_owner:npg_z6RjZUbvY0uC@ep-morning-glade-aq9yogi3-pooler.c-8.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"
});

async function checkDatabase() {
  try {
    console.log('Connecting to database...');
    const client = await pool.connect();

    console.log('Checking if events table exists...');
    const result = await client.query(`
      SELECT EXISTS(
        SELECT 1 FROM information_schema.tables
        WHERE table_name='events'
      );
    `);

    const tableExists = result.rows[0].exists;
    console.log(`Events table exists: ${tableExists}`);

    if (tableExists) {
      console.log('\nQuerying events table...');
      const eventsResult = await client.query('SELECT * FROM events LIMIT 1');
      console.log('Events table schema:');
      eventsResult.rows.forEach(row => {
        console.log('Row:', row);
      });
      console.log('Columns:', Object.keys(eventsResult.fields.map(f => f.name)));
    }

    console.log('\nChecking if event_results table exists...');
    const resultsCheck = await client.query(`
      SELECT EXISTS(
        SELECT 1 FROM information_schema.tables
        WHERE table_name='event_results'
      );
    `);

    console.log(`Event_results table exists: ${resultsCheck.rows[0].exists}`);

    client.release();
    console.log('\n✅ Database connection successful!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Database error:', error.message);
    process.exit(1);
  }
}

checkDatabase();
