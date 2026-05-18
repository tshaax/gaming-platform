/**
 * One-time seed: creates the first store and admin user.
 * Run with: npx tsx drizzle/seed.ts
 *
 * Set DATABASE_URL in .env before running.
 * The admin credentials printed here are for local dev only — change them immediately in production.
 */
import * as dotenv from 'dotenv';
dotenv.config();

import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import bcrypt from 'bcryptjs';
import { users, stores, userStoreMemberships } from './schema';

async function seed() {
  const pool = new Pool({ connectionString: process.env['DATABASE_URL']! });
  const db   = drizzle(pool);

  const adminEmail    = 'admin@gaming.local';
  const adminPassword = 'Admin1234!';

  const [store] = await db
    .insert(stores)
    .values({ name: 'Main Store', slug: 'main-store' })
    .returning({ id: stores.id });

  console.log('Created store:', store.id);

  const passwordHash = await bcrypt.hash(adminPassword, 12);

  const [user] = await db
    .insert(users)
    .values({ email: adminEmail, passwordHash })
    .returning({ id: users.id });

  console.log('Created admin user:', user.id);

  await db.insert(userStoreMemberships).values({
    userId:  user.id,
    storeId: store.id,
    role:    'admin',
  });

  console.log('Admin membership created.');
  console.log(`\nStore ID   : ${store.id}`);
  console.log(`Admin email: ${adminEmail}`);
  console.log(`Password   : ${adminPassword}  <-- change this!`);

  await pool.end();
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
