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
  text,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

const tstz = (name: string) => timestamp(name, { withTimezone: true });

export const users = pgTable(
  'users',
  {
    id:           uuid('id').primaryKey().defaultRandom(),
    firstName:    varchar('first_name', { length: 255 }),
    lastName:     varchar('last_name', { length: 255 }),
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
    id:             uuid('id').primaryKey().defaultRandom(),
    storeId:        uuid('store_id').notNull().references(() => stores.id, { onDelete: 'cascade' }),
    userId:         uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    stationId:      uuid('station_id').notNull().references(() => gamingStations.id, { onDelete: 'restrict' }),
    eventId:        uuid('event_id').references(() => events.id, { onDelete: 'set null' }),
    durationMins:   integer('duration_mins').notNull(),
    ratePerHour:    numeric('rate_per_hour', { precision: 10, scale: 2 }).notNull(),
    opponentType:   varchar('opponent_type', { length: 50 }),
    opponentUserId: uuid('opponent_user_id').references(() => users.id, { onDelete: 'set null' }),
    game:           varchar('game', { length: 255 }),
    notes:          varchar('notes', { length: 1000 }),
    status:         varchar('status', { length: 20 }).notNull().default('active'),
    startedAt:      tstz('started_at').notNull().defaultNow(),
    endedAt:        tstz('ended_at'),
    createdAt:      tstz('created_at').notNull().defaultNow(),
    updatedAt:      tstz('updated_at').notNull().defaultNow(),
  },
  (table) => [
    index('idx_gaming_sessions_store_id').on(table.storeId),
    index('idx_gaming_sessions_user_id').on(table.userId),
    index('idx_gaming_sessions_station_id').on(table.stationId),
    index('idx_gaming_sessions_status').on(table.status),
    index('idx_gaming_sessions_opponent_user_id').on(table.opponentUserId),
    index('idx_gaming_sessions_event_id').on(table.eventId),
  ],
);

export const events = pgTable(
  'events',
  {
    id:             uuid('id').primaryKey().defaultRandom(),
    storeId:        uuid('store_id').references(() => stores.id, { onDelete: 'cascade' }),
    title:          varchar('title', { length: 255 }).notNull(),
    game:           varchar('game', { length: 255 }),
    eventType:      varchar('event_type', { length: 50 }).notNull().default('tournament'),
    entryFeeType:   varchar('entry_fee_type', { length: 50 }).notNull().default('entry_fee'),
    eligibleSessions: integer('eligible_sessions').notNull().default(1),
    startDate:      tstz('start_date').notNull(),
    endDate:        tstz('end_date'),
    prizePool:      numeric('prize_pool', { precision: 10, scale: 2 }),
    maxPlayers:     integer('max_players'),
    currentPlayers: integer('current_players').notNull().default(0),
    status:         varchar('status', { length: 20 }).notNull().default('upcoming'),
    description:    varchar('description', { length: 1000 }),
    createdAt:      tstz('created_at').notNull().defaultNow(),
    updatedAt:      tstz('updated_at').notNull().defaultNow(),
  },
  (table) => [
    index('idx_events_status').on(table.status),
    index('idx_events_store_id').on(table.storeId),
  ],
);

export const eventResults = pgTable(
  'event_results',
  {
    id:               uuid('id').primaryKey().defaultRandom(),
    eventId:          uuid('event_id').notNull().references(() => events.id, { onDelete: 'cascade' }),
    playerUsername:   varchar('player_username', { length: 255 }).notNull(),
    result:           varchar('result', { length: 20 }).notNull(),
    placement:        integer('placement'),
    score:            varchar('score', { length: 100 }),
    pointsEarned:     integer('points_earned'),
    kills:            integer('kills').notNull().default(0),
    deaths:           integer('deaths').notNull().default(0),
    assists:          integer('assists').notNull().default(0),
    createdAt:        tstz('created_at').notNull().defaultNow(),
  },
  (table) => [
    index('idx_event_results_event_id').on(table.eventId),
  ],
);

export const promotions = pgTable(
  'promotions',
  {
    id:              uuid('id').primaryKey().defaultRandom(),
    storeId:         uuid('store_id').references(() => stores.id, { onDelete: 'cascade' }),
    title:           varchar('title', { length: 255 }).notNull(),
    type:            varchar('type', { length: 50 }).notNull().default('discount'),
    promoCode:       varchar('promo_code', { length: 50 }).notNull().unique(),
    discountValue:   numeric('discount_value', { precision: 5, scale: 2 }),
    status:          varchar('status', { length: 20 }).notNull().default('scheduled'),
    startDate:       tstz('start_date').notNull(),
    endDate:         tstz('end_date').notNull(),
    targetAudience:  varchar('target_audience', { length: 50 }).notNull().default('all_players'),
    maxUsage:        integer('max_usage'),
    currentUsage:    integer('current_usage').notNull().default(0),
    description:     varchar('description', { length: 1000 }),
    createdAt:       tstz('created_at').notNull().defaultNow(),
    updatedAt:       tstz('updated_at').notNull().defaultNow(),
  },
  (table) => [
    index('idx_promotions_status').on(table.status),
    index('idx_promotions_store_id').on(table.storeId),
    index('idx_promotions_promo_code').on(table.promoCode),
  ],
);

export const pricingOptions = pgTable(
  'pricing_options',
  {
    id:           uuid('id').primaryKey().defaultRandom(),
    storeId:      uuid('store_id').notNull().references(() => stores.id, { onDelete: 'cascade' }),
    durationMins: integer('duration_mins').notNull(),
    ratePerHour:  numeric('rate_per_hour', { precision: 10, scale: 2 }).notNull(),
    label:        varchar('label', { length: 100 }),
    isActive:     boolean('is_active').notNull().default(true),
    createdAt:    tstz('created_at').notNull().defaultNow(),
  },
  (table) => [
    index('idx_pricing_options_store_id').on(table.storeId),
  ],
);

export const games = pgTable(
  'games',
  {
    id:          uuid('id').primaryKey().defaultRandom(),
    storeId:     uuid('store_id').notNull().references(() => stores.id, { onDelete: 'cascade' }),
    name:        varchar('name', { length: 255 }).notNull(),
    thumbnail:   text('thumbnail'), // Base64 encoded JPEG
    isActive:    boolean('is_active').notNull().default(true),
    createdAt:   tstz('created_at').notNull().defaultNow(),
    updatedAt:   tstz('updated_at').notNull().defaultNow(),
  },
  (table) => [
    index('idx_games_store_id').on(table.storeId),
  ],
);

export const gameSessionResults = pgTable(
  'game_session_results',
  {
    id:                 uuid('id').primaryKey().defaultRandom(),
    sessionId:          uuid('session_id').notNull().references(() => gamingSessions.id, { onDelete: 'cascade' }),
    game:               varchar('game', { length: 255 }),
    score:              integer('score'),
    placement:          integer('placement'),
    result:             varchar('result', { length: 50 }),
    kills:              integer('kills').notNull().default(0),
    deaths:             integer('deaths').notNull().default(0),
    assists:            integer('assists').notNull().default(0),
    gameType:           varchar('game_type', { length: 20 }).default('solo'),
    opponentUserId:     uuid('opponent_user_id').references(() => users.id, { onDelete: 'set null' }),
    player1Score:       integer('player1_score'),
    player2Score:       integer('player2_score'),
    winner:             varchar('winner', { length: 20 }),
    verificationStatus: varchar('verification_status', { length: 20 }).default('pending'),
    verifiedBy:         uuid('verified_by').references(() => users.id, { onDelete: 'set null' }),
    verifiedAt:         tstz('verified_at'),
    verificationNotes:  varchar('verification_notes', { length: 1000 }),
    createdAt:          tstz('created_at').notNull().defaultNow(),
  },
  (table) => [
    index('idx_game_session_results_session_id').on(table.sessionId),
    index('idx_game_session_results_opponent_user_id').on(table.opponentUserId),
    index('idx_game_session_results_verification_status').on(table.verificationStatus),
  ],
);

export const eventRegistrations = pgTable(
  'event_registrations',
  {
    id:                    uuid('id').primaryKey().defaultRandom(),
    eventId:               uuid('event_id').notNull().references(() => events.id, { onDelete: 'cascade' }),
    gamerId:               uuid('gamer_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    totalEligibleSessions: integer('total_eligible_sessions').notNull().default(1),
    usedSessions:          integer('used_sessions').notNull().default(0),
    status:                varchar('status', { length: 50 }).notNull().default('active'),
    currentRound:          varchar('current_round', { length: 50 }),
    isEliminated:          boolean('is_eliminated').notNull().default(false),
    createdAt:             tstz('created_at').notNull().defaultNow(),
    updatedAt:             tstz('updated_at').notNull().defaultNow(),
  },
  (table) => [
    index('idx_event_registrations_event_id').on(table.eventId),
    index('idx_event_registrations_gamer_id').on(table.gamerId),
  ],
);

export const sessionRecords = pgTable(
  'session_records',
  {
    id:               uuid('id').primaryKey().defaultRandom(),
    registrationId:   uuid('registration_id').notNull().references(() => eventRegistrations.id, { onDelete: 'cascade' }),
    sessionNumber:    integer('session_number').notNull(),
    status:           varchar('status', { length: 50 }).notNull().default('scheduled'),
    tournamentRound:  varchar('tournament_round', { length: 50 }),
    roundNumber:      integer('round_number'),
    matchResult:      varchar('match_result', { length: 50 }),
    createdAt:        tstz('created_at').notNull().defaultNow(),
  },
  (table) => [
    index('idx_session_records_registration_id').on(table.registrationId),
  ],
);

export const tournamentBrackets = pgTable(
  'tournament_brackets',
  {
    id:                  uuid('id').primaryKey().defaultRandom(),
    eventId:             uuid('event_id').notNull().references(() => events.id, { onDelete: 'cascade' }),
    roundName:           varchar('round_name', { length: 100 }).notNull(),
    roundNumber:         integer('round_number').notNull(),
    sessionRequirement:  integer('session_requirement').notNull().default(1),
    createdAt:           tstz('created_at').notNull().defaultNow(),
  },
  (table) => [
    index('idx_tournament_brackets_event_id').on(table.eventId),
  ],
);
