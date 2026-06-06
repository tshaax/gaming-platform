import * as dotenv from 'dotenv';
dotenv.config({ path: '.env' });

import { Pool } from 'pg';
import * as fs from 'fs';
import * as path from 'path';

async function applyGamesMigration() {
  const pool = new Pool({
    connectionString: process.env['DATABASE_URL'],
  });

  const client = await pool.connect();

  try {
    console.log('Applying games table migration...');

    // Read the migration SQL
    const migrationPath = path.join(process.cwd(), 'drizzle/migrations/0005_soft_boomer.sql');
    const migrationSql = fs.readFileSync(migrationPath, 'utf-8');

    // Execute the SQL
    await client.query(migrationSql);

    console.log('✅ Games table migration applied successfully!');
  } catch (error: any) {
    if (error.message?.includes('already exists')) {
      console.log('ℹ️  Games table already exists - no migration needed');
    } else {
      console.error('❌ Migration failed:', error.message);
      process.exit(1);
    }
  } finally {
    client.release();
    await pool.end();
  }
}

applyGamesMigration();
