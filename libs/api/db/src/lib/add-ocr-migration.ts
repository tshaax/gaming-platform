import * as dotenv from 'dotenv';
dotenv.config({ path: '.env' });

import { Pool } from 'pg';

async function runMigration() {
  const pool = new Pool({
    connectionString: process.env['DATABASE_URL'],
  });

  const client = await pool.connect();

  try {
    console.log('🔄 Running migration: Add OCR, Image Capture, and Parent ID columns...');

    // Check if columns already exist
    const checkQuery = `
      SELECT column_name FROM information_schema.columns
      WHERE table_name = 'game_session_results'
      AND column_name IN ('ocr_results', 'capture_image', 'parent_id');
    `;

    const result = await client.query(checkQuery);
    const existingColumns = result.rows.map((row: any) => row.column_name);

    console.log('📝 Checking columns...');

    if (!existingColumns.includes('ocr_results')) {
      await client.query('ALTER TABLE "game_session_results" ADD COLUMN "ocr_results" text;');
      console.log('   ✓ Added ocr_results column');
    } else {
      console.log('   ✓ ocr_results already exists');
    }

    if (!existingColumns.includes('capture_image')) {
      await client.query('ALTER TABLE "game_session_results" ADD COLUMN "capture_image" text;');
      console.log('   ✓ Added capture_image column');
    } else {
      console.log('   ✓ capture_image already exists');
    }

    if (!existingColumns.includes('parent_id')) {
      await client.query(`
        ALTER TABLE "game_session_results"
        ADD COLUMN "parent_id" uuid REFERENCES "game_session_results"(id) ON DELETE CASCADE;
      `);
      console.log('   ✓ Added parent_id column');

      await client.query(`
        CREATE INDEX "idx_game_session_results_parent_id"
        ON "game_session_results"("parent_id");
      `);
      console.log('   ✓ Created parent_id index');
    } else {
      console.log('   ✓ parent_id already exists');
    }

    console.log('\n✅ Migration completed successfully!');
  } catch (error: any) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  } finally {
    await client.release();
    await pool.end();
  }
}

runMigration();
