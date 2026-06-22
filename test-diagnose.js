const { Pool } = require('pg');

async function diagnose() {
  const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/gaming_platform';

  const pool = new Pool({ connectionString, connectionTimeoutMillis: 5000 });

  try {
    // Try to connect
    const client = await pool.connect();
    console.log('✓ Connected to database');

    // Check if table exists
    const tableCheck = await client.query(`
      SELECT EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_name = 'game_session_results'
      )
    `);

    if (tableCheck.rows[0].exists) {
      console.log('✓ game_session_results table exists');

      // Get table columns
      const columns = await client.query(`
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns
        WHERE table_name = 'game_session_results'
        ORDER BY ordinal_position
      `);

      console.log('\n=== Table Columns ===');
      columns.rows.forEach(col => {
        console.log(`  ${col.column_name.padEnd(20)} ${col.data_type.padEnd(15)} ${col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'}`);
      });
    } else {
      console.log('✗ game_session_results table does NOT exist!');
    }

    client.release();
  } catch (error) {
    console.error('✗ Error:', error.message);
    if (error.code) console.error('  Code:', error.code);
  } finally {
    await pool.end();
  }
}

diagnose();
