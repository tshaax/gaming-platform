require('dotenv').config();
process.env.DATABASE_URL = "postgresql://neondb_owner:npg_z6RjZUbvY0uC@ep-morning-glade-aq9yogi3-pooler.c-8.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require";

const { spawn } = require('child_process');

const child = spawn('npx', ['drizzle-kit', 'migrate', '--config=drizzle/drizzle.config.ts'], {
  cwd: process.cwd(),
  env: { ...process.env, DATABASE_URL: process.env.DATABASE_URL }
});

let output = '';
let errorOutput = '';

child.stdout.on('data', (data) => {
  process.stdout.write(data);
  output += data;
});

child.stderr.on('data', (data) => {
  process.stderr.write(data);
  errorOutput += data;
});

child.on('close', (code) => {
  console.log(`\nMigration process exited with code ${code}`);
  if (code === 0) {
    console.log('✅ Migration applied successfully!');
  }
  process.exit(code);
});

// Set a timeout of 5 minutes
setTimeout(() => {
  console.error('\n❌ Migration timeout after 5 minutes');
  child.kill();
  process.exit(1);
}, 5 * 60 * 1000);
