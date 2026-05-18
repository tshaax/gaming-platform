import {
  pgTable,
  uuid,
  varchar,
  timestamp,
  index,
  primaryKey,
  check,
  boolean,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

const tstz = (name: string) => timestamp(name, { withTimezone: true });

export const users = pgTable(
  'users',
  {
    id:           uuid('id').primaryKey().defaultRandom(),
    email:        varchar('email', { length: 255 }).unique(),
    cellphone:    varchar('cellphone', { length: 20 }).unique(),
    passwordHash: varchar('password_hash', { length: 255 }).notNull(),
    createdAt:    tstz('created_at').notNull().defaultNow(),
    updatedAt:    tstz('updated_at').notNull().defaultNow(),
  },
  (table) => [
    check(
      'users_contact_check',
      sql`${table.email} IS NOT NULL OR ${table.cellphone} IS NOT NULL`,
    ),
  ],
);

export const stores = pgTable('stores', {
  id:            uuid('id').primaryKey().defaultRandom(),
  name:          varchar('name', { length: 255 }).notNull(),
  slug:          varchar('slug', { length: 100 }).notNull().unique(),
  address:       varchar('address', { length: 500 }),
  taxNumber:     varchar('tax_number', { length: 50 }),
  manager:       varchar('manager', { length: 255 }),
  contactPerson: varchar('contact_person', { length: 255 }),
  contactPhone:  varchar('contact_phone', { length: 20 }),
  createdAt:     tstz('created_at').notNull().defaultNow(),
  updatedAt:     tstz('updated_at').notNull().defaultNow(),
});

export const cashiers = pgTable(
  'cashiers',
  {
    id:                   uuid('id').primaryKey().defaultRandom(),
    userId:               uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    storeId:              uuid('store_id').notNull().references(() => stores.id, { onDelete: 'cascade' }),
    firstName:            varchar('first_name', { length: 255 }).notNull(),
    lastName:             varchar('last_name', { length: 255 }).notNull(),
    email:                varchar('email', { length: 255 }).notNull(),
    phone:                varchar('phone', { length: 20 }).notNull(),
    passwordResetRequired: boolean('password_reset_required').notNull().default(true),
    createdAt:            tstz('created_at').notNull().defaultNow(),
    updatedAt:            tstz('updated_at').notNull().defaultNow(),
  },
  (table) => [
    index('idx_cashiers_user_id').on(table.userId),
    index('idx_cashiers_store_id').on(table.storeId),
    index('idx_cashiers_email').on(table.email),
  ],
);

export const userStoreMemberships = pgTable(
  'user_store_memberships',
  {
    userId:   uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    storeId:  uuid('store_id').notNull().references(() => stores.id, { onDelete: 'cascade' }),
    role:     varchar('role', { length: 20 }).notNull(),
    joinedAt: tstz('joined_at').notNull().defaultNow(),
  },
  (table) => [
    primaryKey({ columns: [table.userId, table.storeId] }),
    index('idx_memberships_user_id').on(table.userId),
    check('membership_role_check', sql`${table.role} IN ('gamer','cashier','admin')`),
  ],
);

export const refreshTokens = pgTable(
  'refresh_tokens',
  {
    id:        uuid('id').primaryKey().defaultRandom(),
    userId:    uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    storeId:   uuid('store_id').notNull().references(() => stores.id, { onDelete: 'cascade' }),
    tokenHash: varchar('token_hash', { length: 64 }).notNull().unique(),
    expiresAt: tstz('expires_at').notNull(),
    revokedAt: tstz('revoked_at'),
    createdAt: tstz('created_at').notNull().defaultNow(),
  },
  (table) => [
    index('idx_refresh_tokens_user_id').on(table.userId),
    index('idx_refresh_tokens_token_hash').on(table.tokenHash),
  ],
);
