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
import { eq, and } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import { users, stores, userStoreMemberships } from './schema';

async function seed() {
  const pool = new Pool({ connectionString: process.env['DATABASE_URL']! });
  const db   = drizzle(pool);

  const adminEmail    = 'admin@gaming.local';
  const adminPassword = 'Admin1234!';

  // Check or create store
  let [existingStore] = await db
    .select()
    .from(stores)
    .where(eq(stores.slug, 'main-store'));

  let store = existingStore;
  if (!store) {
    const [newStore] = await db
      .insert(stores)
      .values({ name: 'Main Store', slug: 'main-store' })
      .returning({ id: stores.id });
    store = newStore;
    console.log('Created store:', store.id);
  } else {
    console.log('Store already exists:', store.id);
  }

  // Check or create admin user
  let [existingUser] = await db
    .select()
    .from(users)
    .where(eq(users.email, adminEmail));

  let user = existingUser;
  if (!user) {
    const passwordHash = await bcrypt.hash(adminPassword, 12);
    const [newUser] = await db
      .insert(users)
      .values({ email: adminEmail, passwordHash })
      .returning({ id: users.id });
    user = newUser;
    console.log('Created admin user:', user.id);
  } else {
    console.log('Admin user already exists:', user.id);
  }

  // Check or create membership
  const [membership] = await db
    .select()
    .from(userStoreMemberships)
    .where(and(eq(userStoreMemberships.userId, user.id), eq(userStoreMemberships.storeId, store.id)));

  if (!membership) {
    await db.insert(userStoreMemberships).values({
      userId:  user.id,
      storeId: store.id,
      role:    'admin',
    });
    console.log('Admin membership created.');
  } else {
    console.log('Admin membership already exists.');
  }

  console.log(`\nStore ID   : ${store.id}`);
  console.log(`Admin email: ${adminEmail}`);
  console.log(`Password   : ${adminPassword}  <-- change this!`);

  await pool.end();
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
