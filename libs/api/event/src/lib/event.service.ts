import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import { eq, sql } from 'drizzle-orm';
import { events, eventResults } from '@org/api/db';

export interface CreateEventInput {
  storeId?: string;
  title: string;
  game?: string;
  eventType?: string;
  startDate: string;
  endDate?: string;
  prizePool?: string;
  maxPlayers?: number;
  status?: string;
  description?: string;
}

export interface UpdateEventInput {
  storeId?: string | null;
  title?: string;
  game?: string;
  eventType?: string;
  startDate?: string;
  endDate?: string;
  prizePool?: string;
  maxPlayers?: number;
  currentPlayers?: number;
  status?: string;
  description?: string;
}

export interface CreateEventResultInput {
  playerUsername: string;
  result: string;
  placement?: number;
  score?: string;
  pointsEarned?: number;
  kills?: number;
  deaths?: number;
  assists?: number;
}

export class EventService {
  private db: any;

  constructor(private pool: Pool) {
    this.db = drizzle(pool);
  }

  async getAllEvents(status?: string) {
    try {
      if (status && status !== 'all') {
        return this.db.select().from(events).where(eq(events.status, status));
      }
      return this.db.select().from(events);
    } catch (error) {
      console.error('Database error in getAllEvents:', error);
      throw error;
    }
  }

  async getEvent(eventId: string) {
    const [event] = await this.db
      .select()
      .from(events)
      .where(eq(events.id, eventId))
      .limit(1);

    if (!event) {
      throw new Error('Event not found');
    }

    return event;
  }

  async createEvent(input: CreateEventInput) {
    const [event] = await this.db
      .insert(events)
      .values({
        storeId: input.storeId || null,
        title: input.title,
        game: input.game,
        eventType: input.eventType || 'tournament',
        startDate: new Date(input.startDate),
        endDate: input.endDate ? new Date(input.endDate) : null,
        prizePool: input.prizePool,
        maxPlayers: input.maxPlayers,
        status: input.status || 'upcoming',
        description: input.description,
      })
      .returning();

    return event;
  }

  async updateEvent(eventId: string, input: UpdateEventInput) {
    const updateData: any = {};
    if (input.storeId !== undefined) updateData.storeId = input.storeId;
    if (input.title !== undefined) updateData.title = input.title;
    if (input.game !== undefined) updateData.game = input.game;
    if (input.eventType !== undefined) updateData.eventType = input.eventType;
    if (input.startDate !== undefined) updateData.startDate = new Date(input.startDate);
    if (input.endDate !== undefined) updateData.endDate = input.endDate ? new Date(input.endDate) : null;
    if (input.prizePool !== undefined) updateData.prizePool = input.prizePool;
    if (input.maxPlayers !== undefined) updateData.maxPlayers = input.maxPlayers;
    if (input.currentPlayers !== undefined) updateData.currentPlayers = input.currentPlayers;
    if (input.status !== undefined) updateData.status = input.status;
    if (input.description !== undefined) updateData.description = input.description;
    updateData.updatedAt = new Date();

    const [updated] = await this.db
      .update(events)
      .set(updateData)
      .where(eq(events.id, eventId))
      .returning();

    if (!updated) {
      throw new Error('Event not found');
    }

    return updated;
  }

  async deleteEvent(eventId: string) {
    const [deleted] = await this.db
      .delete(events)
      .where(eq(events.id, eventId))
      .returning();

    if (!deleted) {
      throw new Error('Event not found');
    }

    return { success: true };
  }

  async getEventResults(eventId: string) {
    return this.db
      .select()
      .from(eventResults)
      .where(eq(eventResults.eventId, eventId));
  }

  async addEventResult(eventId: string, input: CreateEventResultInput) {
    const [result] = await this.db
      .insert(eventResults)
      .values({
        eventId,
        playerUsername: input.playerUsername,
        result: input.result,
        placement: input.placement,
        score: input.score,
        pointsEarned: input.pointsEarned,
        kills: input.kills || 0,
        deaths: input.deaths || 0,
        assists: input.assists || 0,
      })
      .returning();

    return result;
  }

  async deleteEventResult(resultId: string) {
    const [deleted] = await this.db
      .delete(eventResults)
      .where(eq(eventResults.id, resultId))
      .returning();

    if (!deleted) {
      throw new Error('Event result not found');
    }

    return { success: true };
  }
}
