import * as dotenv from 'dotenv';
dotenv.config({ path: '.env' });

import { Pool } from 'pg';
import bcrypt from 'bcryptjs';
import { drizzle } from 'drizzle-orm/node-postgres';
import { users, stores, userStoreMemberships } from './schema';

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

      // Check if user already exists
      const existingUser = await db
        .select({ id: users.id })
        .from(users)
        .where(undefined)
        .limit(1);

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
        // User already exists, we need to find their ID
        // Query by email or cellphone
        const existing = await db
          .select({ id: users.id })
          .from(users)
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
