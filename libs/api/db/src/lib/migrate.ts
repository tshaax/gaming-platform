import * as dotenv from 'dotenv';
dotenv.config({ path: '.env' });

import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import path from 'path';

async function runMigrations() {
  const pool = new Pool({
    connectionString: process.env['DATABASE_URL'],
  });

  const db = drizzle(pool);

  try {
    console.log('Running migrations...');
    const migrationsFolder = path.join(process.cwd(), 'drizzle/migrations');
    await migrate(db, { migrationsFolder });
    console.log('✅ Migrations completed successfully!');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

runMigrations();
