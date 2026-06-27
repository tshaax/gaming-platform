import * as dotenv from 'dotenv';
dotenv.config({ path: '.env' });

import { Pool } from 'pg';

async function runMigration() {
  const pool = new Pool({
    connectionString: process.env['DATABASE_URL'],
  });

  const client = await pool.connect();

  try {
    console.log('🔄 Running migration: Add OCR and Image Capture columns...');

    // Check if columns already exist
    const checkQuery = `
      SELECT column_name FROM information_schema.columns
      WHERE table_name = 'game_session_results'
      AND column_name IN ('ocr_results', 'capture_image');
    `;

    const result = await client.query(checkQuery);

    if (result.rows.length > 0) {
      console.log('⚠️  Columns already exist:');
      result.rows.forEach((row: any) => console.log(`   - ${row.column_name}`));
      console.log('✓ No migration needed!');
    } else {
      console.log('📝 Adding columns to game_session_results...');

      await client.query('ALTER TABLE "game_session_results" ADD COLUMN "ocr_results" text;');
      console.log('   ✓ Added ocr_results column');

      await client.query('ALTER TABLE "game_session_results" ADD COLUMN "capture_image" text;');
      console.log('   ✓ Added capture_image column');

      console.log('\n✅ Migration completed successfully!');
    }
  } catch (error: any) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  } finally {
    await client.release();
    await pool.end();
  }
}

runMigration();
