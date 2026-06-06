import * as dotenv from 'dotenv';
dotenv.config({ path: '.env' });

import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import { games } from './schema';
import { sql } from 'drizzle-orm';

async function verifyGamesTable() {
  const pool = new Pool({
    connectionString: process.env['DATABASE_URL'],
  });

  const db = drizzle(pool);

  try {
    console.log('Verifying games table...\n');

    // Check table structure
    const result = await db.execute(sql`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'games'
      ORDER BY ordinal_position
    `);

    console.log('Games table structure:');
    console.log('─'.repeat(50));
    result.rows.forEach((row: any) => {
      const nullable = row.is_nullable === 'YES' ? 'nullable' : 'NOT NULL';
      console.log(`${row.column_name.padEnd(15)} ${row.data_type.padEnd(25)} ${nullable}`);
    });

    console.log('─'.repeat(50));
    console.log(`✅ Games table verified! (${result.rows.length} columns)`);
  } catch (error: any) {
    console.error('❌ Verification failed:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

verifyGamesTable();
