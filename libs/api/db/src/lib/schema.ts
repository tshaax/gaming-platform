import {
  pgTable,
  uuid,
  varchar,
  timestamp,
  index,
  primaryKey,
  check,
  boolean,
  integer,
  numeric,
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

export const gamingStations = pgTable(
  'gaming_stations',
  {
    id:        uuid('id').primaryKey().defaultRandom(),
    storeId:   uuid('store_id').notNull().references(() => stores.id, { onDelete: 'cascade' }),
    name:      varchar('name', { length: 255 }).notNull(),
    isActive:  boolean('is_active').notNull().default(true),
    createdAt: tstz('created_at').notNull().defaultNow(),
    updatedAt: tstz('updated_at').notNull().defaultNow(),
  },
  (table) => [
    index('idx_gaming_stations_store_id').on(table.storeId),
  ],
);

export const durationOptions = pgTable(
  'duration_options',
  {
    id:        uuid('id').primaryKey().defaultRandom(),
    storeId:   uuid('store_id').notNull().references(() => stores.id, { onDelete: 'cascade' }),
    minutes:   integer('minutes').notNull(),
    isActive:  boolean('is_active').notNull().default(true),
    createdAt: tstz('created_at').notNull().defaultNow(),
  },
  (table) => [
    index('idx_duration_options_store_id').on(table.storeId),
  ],
);

export const rateOptions = pgTable(
  'rate_options',
  {
    id:        uuid('id').primaryKey().defaultRandom(),
    storeId:   uuid('store_id').notNull().references(() => stores.id, { onDelete: 'cascade' }),
    ratePerHour: numeric('rate_per_hour', { precision: 10, scale: 2 }).notNull(),
    label:     varchar('label', { length: 100 }),
    isActive:  boolean('is_active').notNull().default(true),
    createdAt: tstz('created_at').notNull().defaultNow(),
  },
  (table) => [
    index('idx_rate_options_store_id').on(table.storeId),
  ],
);

export const gamingSessions = pgTable(
  'gaming_sessions',
  {
    id:           uuid('id').primaryKey().defaultRandom(),
    storeId:      uuid('store_id').notNull().references(() => stores.id, { onDelete: 'cascade' }),
    userId:       uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    stationId:    uuid('station_id').notNull().references(() => gamingStations.id, { onDelete: 'restrict' }),
    durationMins: integer('duration_mins').notNull(),
    ratePerHour:  numeric('rate_per_hour', { precision: 10, scale: 2 }).notNull(),
    opponentType: varchar('opponent_type', { length: 50 }),
    notes:        varchar('notes', { length: 1000 }),
    status:       varchar('status', { length: 20 }).notNull().default('active'),
    startedAt:    tstz('started_at').notNull().defaultNow(),
    endedAt:      tstz('ended_at'),
    createdAt:    tstz('created_at').notNull().defaultNow(),
    updatedAt:    tstz('updated_at').notNull().defaultNow(),
  },
  (table) => [
    index('idx_gaming_sessions_store_id').on(table.storeId),
    index('idx_gaming_sessions_user_id').on(table.userId),
    index('idx_gaming_sessions_station_id').on(table.stationId),
    index('idx_gaming_sessions_status').on(table.status),
  ],
);
