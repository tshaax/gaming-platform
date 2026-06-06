const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function runMigration() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    console.log('Running migration: 0001_add_game_fields_and_results.sql');

    const sql = fs.readFileSync(
      path.join(__dirname, 'drizzle/migrations/0001_add_game_fields_and_results.sql'),
      'utf8'
    );

    await pool.query(sql);
    console.log('✅ Migration completed successfully!');
  } catch (err) {
    console.error('❌ Migration failed:', err.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

runMigration();
