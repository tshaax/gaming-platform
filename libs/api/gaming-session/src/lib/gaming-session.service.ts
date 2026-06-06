import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import { eq, and } from 'drizzle-orm';
import {
  gamingSessions,
  gamingStations,
  durationOptions,
  rateOptions,
  pricingOptions,
  games,
  users,
  stores,
  gameSessionResults,
} from '@org/api/db';

interface CreateGamingSessionInput {
  storeId: string;
  userId: string;
  stationId: string;
  durationMins: number;
  ratePerHour: string;
  opponentType?: string;
  notes?: string;
}

interface GamingSession {
  id: string;
  storeId: string;
  userId: string;
  stationId: string;
  durationMins: number;
  ratePerHour: string;
  opponentType?: string;
  opponentUserId?: string;
  game?: string;
  notes?: string;
  status: string;
  startedAt: Date;
  endedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

interface GamingStation {
  id: string;
  storeId: string;
  name: string;
  isActive: boolean;
}

interface DurationOption {
  id: string;
  storeId: string;
  minutes: number;
  isActive: boolean;
}

interface RateOption {
  id: string;
  storeId: string;
  ratePerHour: string;
  label?: string;
  isActive: boolean;
}

interface PricingOption {
  id: string;
  storeId: string;
  durationMins: number;
  ratePerHour: string;
  label?: string;
  isActive: boolean;
}

interface Game {
  id: string;
  storeId: string;
  name: string;
  thumbnail?: string;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

interface ResultInput {
  game?: string;
  score?: number;
  placement?: number;
  result?: string;
  kills?: number;
  deaths?: number;
  assists?: number;
}

interface ActiveSessionData {
  id: string;
  storeId: string;
  storeName: string;
  stationName: string;
  durationMins: number;
  ratePerHour: string;
  opponentType?: string;
  notes?: string;
  game?: string;
  startedAt: Date;
}

export class GamingSessionService {
  private db: ReturnType<typeof drizzle>;

  constructor(pool: Pool) {
    this.db = drizzle(pool);
  }

  async createGamingSession(input: CreateGamingSessionInput): Promise<GamingSession> {
    const rate = typeof input.ratePerHour === 'string'
      ? parseFloat(input.ratePerHour).toString()
      : input.ratePerHour;

    const [session] = await this.db
      .insert(gamingSessions)
      .values({
        storeId: input.storeId,
        userId: input.userId,
        stationId: input.stationId,
        durationMins: input.durationMins,
        ratePerHour: rate,
        opponentType: input.opponentType,
        notes: input.notes,
        status: 'active',
      })
      .returning();

    return session as GamingSession;
  }

  async getGamingSessionsByStore(storeId: string): Promise<GamingSession[]> {
    return this.db
      .select()
      .from(gamingSessions)
      .where(eq(gamingSessions.storeId, storeId));
  }

  async getGamingSessionsByUser(userId: string, storeId: string): Promise<GamingSession[]> {
    return this.db
      .select()
      .from(gamingSessions)
      .where(
        and(
          eq(gamingSessions.userId, userId),
          eq(gamingSessions.storeId, storeId),
        ),
      );
  }

  async endGamingSession(sessionId: string): Promise<GamingSession> {
    const [updated] = await this.db
      .update(gamingSessions)
      .set({
        status: 'ended',
        endedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(gamingSessions.id, sessionId))
      .returning();

    return updated as GamingSession;
  }

  async getGamingStationsByStore(storeId: string): Promise<GamingStation[]> {
    return this.db
      .select()
      .from(gamingStations)
      .where(eq(gamingStations.storeId, storeId));
  }

  async createGamingStation(storeId: string, name: string): Promise<GamingStation> {
    const [station] = await this.db
      .insert(gamingStations)
      .values({
        storeId,
        name,
      })
      .returning();

    return station as GamingStation;
  }

  async updateGamingStation(
    stationId: string,
    name: string,
    isActive: boolean,
  ): Promise<GamingStation> {
    const [updated] = await this.db
      .update(gamingStations)
      .set({
        name,
        isActive,
        updatedAt: new Date(),
      })
      .where(eq(gamingStations.id, stationId))
      .returning();

    return updated as GamingStation;
  }

  async deleteGamingStation(stationId: string): Promise<void> {
    await this.db.delete(gamingStations).where(eq(gamingStations.id, stationId));
  }

  async getDurationOptionsByStore(storeId: string): Promise<DurationOption[]> {
    return this.db
      .select()
      .from(durationOptions)
      .where(eq(durationOptions.storeId, storeId));
  }

  async createDurationOption(storeId: string, minutes: number): Promise<DurationOption> {
    const [option] = await this.db
      .insert(durationOptions)
      .values({
        storeId,
        minutes,
      })
      .returning();

    return option as DurationOption;
  }

  async deleteDurationOption(optionId: string): Promise<void> {
    await this.db.delete(durationOptions).where(eq(durationOptions.id, optionId));
  }

  async getRateOptionsByStore(storeId: string): Promise<RateOption[]> {
    return this.db
      .select()
      .from(rateOptions)
      .where(eq(rateOptions.storeId, storeId));
  }

  async createRateOption(
    storeId: string,
    ratePerHour: string,
    label?: string,
  ): Promise<RateOption> {
    const [option] = await this.db
      .insert(rateOptions)
      .values({
        storeId,
        ratePerHour,
        label,
      })
      .returning();

    return option as RateOption;
  }

  async updateRateOption(
    optionId: string,
    ratePerHour: string,
    label?: string,
  ): Promise<RateOption> {
    const [updated] = await this.db
      .update(rateOptions)
      .set({
        ratePerHour,
        label,
      })
      .where(eq(rateOptions.id, optionId))
      .returning();

    return updated as RateOption;
  }

  async deleteRateOption(optionId: string): Promise<void> {
    await this.db.delete(rateOptions).where(eq(rateOptions.id, optionId));
  }

  async getActiveSessionsForUser(userId: string): Promise<ActiveSessionData[]> {
    return this.db
      .select({
        id: gamingSessions.id,
        storeId: gamingSessions.storeId,
        storeName: stores.name,
        stationName: gamingStations.name,
        durationMins: gamingSessions.durationMins,
        ratePerHour: gamingSessions.ratePerHour,
        opponentType: gamingSessions.opponentType,
        notes: gamingSessions.notes,
        game: gamingSessions.game,
        startedAt: gamingSessions.startedAt,
      })
      .from(gamingSessions)
      .innerJoin(stores, eq(gamingSessions.storeId, stores.id))
      .innerJoin(gamingStations, eq(gamingSessions.stationId, gamingStations.id))
      .where(
        and(
          eq(gamingSessions.userId, userId),
          eq(gamingSessions.status, 'active'),
        ),
      );
  }

  async updateSessionDetails(
    sessionId: string,
    game?: string,
    opponentUserId?: string,
  ): Promise<GamingSession> {
    const [updated] = await this.db
      .update(gamingSessions)
      .set({
        game,
        opponentUserId,
        updatedAt: new Date(),
      })
      .where(eq(gamingSessions.id, sessionId))
      .returning();

    return updated as GamingSession;
  }

  async createSessionResult(sessionId: string, data: ResultInput): Promise<unknown> {
    const [result] = await this.db
      .insert(gameSessionResults)
      .values({
        sessionId,
        game: data.game,
        score: data.score,
        placement: data.placement,
        result: data.result,
        kills: data.kills ?? 0,
        deaths: data.deaths ?? 0,
        assists: data.assists ?? 0,
      })
      .returning();

    return result;
  }

  async getPricingOptionsByStore(storeId: string): Promise<PricingOption[]> {
    return this.db
      .select()
      .from(pricingOptions)
      .where(eq(pricingOptions.storeId, storeId));
  }

  async createPricingOption(
    storeId: string,
    durationMins: number,
    ratePerHour: string,
    label?: string,
  ): Promise<PricingOption> {
    const [option] = await this.db
      .insert(pricingOptions)
      .values({
        storeId,
        durationMins,
        ratePerHour,
        label,
      })
      .returning();

    return option as PricingOption;
  }

  async deletePricingOption(optionId: string): Promise<void> {
    await this.db.delete(pricingOptions).where(eq(pricingOptions.id, optionId));
  }

  async getGamesByStore(storeId: string): Promise<Game[]> {
    return this.db
      .select()
      .from(games)
      .where(eq(games.storeId, storeId));
  }

  async createGame(
    storeId: string,
    name: string,
    thumbnail?: string,
  ): Promise<Game> {
    const [game] = await this.db
      .insert(games)
      .values({
        storeId,
        name,
        thumbnail,
      })
      .returning();

    return game as Game;
  }

  async updateGame(
    gameId: string,
    name: string,
    thumbnail?: string,
  ): Promise<Game> {
    const [updated] = await this.db
      .update(games)
      .set({
        name,
        thumbnail,
        updatedAt: new Date(),
      })
      .where(eq(games.id, gameId))
      .returning();

    return updated as Game;
  }

  async deleteGame(gameId: string): Promise<void> {
    await this.db.delete(games).where(eq(games.id, gameId));
  }
}
