import * as dotenv from 'dotenv';
dotenv.config({ path: '.env' });

import { Pool } from 'pg';
import bcrypt from 'bcryptjs';
import { drizzle } from 'drizzle-orm/node-postgres';
import { eq } from 'drizzle-orm';
import { users, stores, userStoreMemberships, games } from './schema';

const BCRYPT_ROUNDS = 12;

interface TestAccount {
  email: string;
  cellphone: string;
  password: string;
  role: 'admin' | 'cashier' | 'gamer';
}

export const TEST_ACCOUNTS: TestAccount[] = [
  {
    email: 'admin@playground.com',
    cellphone: '+1-555-0001',
    password: 'admin123',
    role: 'admin',
  },
  {
    email: 'cashier@playground.com',
    cellphone: '+1-555-0002',
    password: 'cashier123',
    role: 'cashier',
  },
  {
    email: 'gamer@playground.com',
    cellphone: '+1-555-0003',
    password: 'gamer123',
    role: 'gamer',
  },
];

async function seed() {
  const pool = new Pool({
    connectionString: process.env['DATABASE_URL'],
  });

  const db = drizzle(pool);

  try {
    console.log('Starting seed...');

    // Create or get test store
    const storeResult = await db
      .insert(stores)
      .values({
        name: 'Test Store',
        slug: 'test-store',
        address: '123 Gaming Ave, Test City, TC 12345',
        manager: 'Store Manager',
        contactPerson: 'Contact Person',
        contactPhone: '+1-555-0100',
      })
      .onConflictDoNothing()
      .returning({ id: stores.id });

    let storeId: string;

    if (storeResult.length > 0) {
      storeId = storeResult[0].id;
      console.log('✓ Created test store:', storeId);
    } else {
      // Store already exists, fetch it
      const existing = await db
        .select({ id: stores.id })
        .from(stores)
        .where(undefined)
        .limit(1);

      if (existing.length === 0) {
        throw new Error('Failed to create or find test store');
      }
      storeId = existing[0].id;
      console.log('✓ Test store already exists:', storeId);
    }

    // Create test accounts
    for (const account of TEST_ACCOUNTS) {
      const passwordHash = await bcrypt.hash(account.password, BCRYPT_ROUNDS);

      let userId: string;

      // Try to insert user, ignore if email/cellphone already exists
      const userResult = await db
        .insert(users)
        .values({
          email: account.email.toLowerCase(),
          cellphone: account.cellphone,
          passwordHash,
        })
        .onConflictDoNothing()
        .returning({ id: users.id });

      if (userResult.length > 0) {
        userId = userResult[0].id;
        console.log(`✓ Created ${account.role} user: ${account.email}`);
      } else {
        // User already exists, we need to find their ID by email
        const existing = await db
          .select({ id: users.id })
          .from(users)
          .where(eq(users.email, account.email.toLowerCase()))
          .limit(1);

        if (existing.length === 0) {
          console.warn(
            `⚠ Could not find or create user for ${account.email}`,
          );
          continue;
        }
        userId = existing[0].id;
        console.log(`✓ ${account.role} user already exists: ${account.email}`);
      }

      // Create or update membership
      await db
        .insert(userStoreMemberships)
        .values({
          userId,
          storeId,
          role: account.role,
        })
        .onConflictDoNothing();

      console.log(
        `✓ Assigned ${account.role} role at test store`,
      );
    }

    // Create sample games for the test store
    const sampleGames = [
      { name: 'League of Legends' },
      { name: 'Dota 2' },
      { name: 'Counter-Strike 2' },
      { name: 'Valorant' },
      { name: 'Fortnite' },
    ];

    for (const game of sampleGames) {
      // Insert games, ignore if already exist
      await db
        .insert(games)
        .values({
          storeId,
          name: game.name,
          thumbnail: null,
          isActive: true,
        })
        .onConflictDoNothing();
      console.log(`✓ Game available: ${game.name}`);
    }

    // Create pricing options for the store
    const pricingTable = require('./schema').pricingOptions;
    const samplePricing = [
      { durationMins: 30, ratePerHour: '2.50', label: '30 min', isActive: true },
      { durationMins: 60, ratePerHour: '4.50', label: '1 hour', isActive: true },
      { durationMins: 120, ratePerHour: '8.00', label: '2 hours', isActive: true },
      { durationMins: 180, ratePerHour: '11.00', label: '3 hours', isActive: true },
    ];

    for (const pricing of samplePricing) {
      await db
        .insert(pricingTable)
        .values({
          storeId,
          ...pricing,
        })
        .onConflictDoNothing();
      console.log(`✓ Pricing configured: ${pricing.label} @ €${pricing.ratePerHour}/hour`);
    }

    console.log('\n✅ Seed completed successfully!\n');
    console.log('Test Accounts:');
    console.log('─'.repeat(80));
    TEST_ACCOUNTS.forEach((account) => {
      console.log(`\nRole: ${account.role.toUpperCase()}`);
      console.log(`  Email:    ${account.email}`);
      console.log(`  Phone:    ${account.cellphone}`);
      console.log(`  Password: ${account.password}`);
    });
    console.log('\n' + '─'.repeat(80));
  } catch (error) {
    console.error('❌ Seed failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

seed();
