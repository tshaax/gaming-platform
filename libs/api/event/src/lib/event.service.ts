import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import { eq, sql, and } from 'drizzle-orm';
import { events, eventResults, eventRegistrations, sessionRecords, tournamentBrackets, gamingSessions, gameSessionResults, users } from '@org/api/db';

export interface CreateEventInput {
  storeId?: string;
  title: string;
  game?: string;
  eventType?: string;
  entryFeeType?: string;
  eligibleSessions?: number;
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
  entryFeeType?: string;
  eligibleSessions?: number;
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

export interface RegisterForEventInput {
  gamerId: string;
  totalEligibleSessions?: number;
}

export interface EventRegistration {
  id: string;
  eventId: string;
  gamerId: string;
  totalEligibleSessions: number;
  usedSessions: number;
  status: string;
  currentRound?: string;
  isEliminated: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface TournamentBracket {
  id: string;
  eventId: string;
  roundName: string;
  roundNumber: number;
  sessionRequirement: number;
  createdAt: Date;
}

export interface CreateTournamentBracketInput {
  roundName: string;
  roundNumber: number;
  sessionRequirement?: number;
}

export interface UpdateGamerRoundInput {
  currentRound: string;
  matchResult: 'win' | 'loss';
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
        entryFeeType: input.entryFeeType || 'entry_fee',
        eligibleSessions: input.eligibleSessions || 1,
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
    if (input.entryFeeType !== undefined) updateData.entryFeeType = input.entryFeeType;
    if (input.eligibleSessions !== undefined) updateData.eligibleSessions = input.eligibleSessions;
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

  async registerForEvent(eventId: string, input: RegisterForEventInput) {
    // Check if already registered
    const existing = await this.db
      .select()
      .from(eventRegistrations)
      .where(
        and(
          eq(eventRegistrations.eventId, eventId),
          eq(eventRegistrations.gamerId, input.gamerId)
        )
      )
      .limit(1);

    if (existing.length > 0) {
      throw new Error('Gamer already registered for this event');
    }

    // Get event details to get eligible sessions
    const event = await this.getEvent(eventId);
    const totalSessions = input.totalEligibleSessions || event.eligibleSessions || 1;

    // Create registration
    const [registration] = await this.db
      .insert(eventRegistrations)
      .values({
        eventId,
        gamerId: input.gamerId,
        totalEligibleSessions: totalSessions,
        usedSessions: 0,
        status: 'active',
      })
      .returning();

    // Create initial session records
    for (let i = 1; i <= totalSessions; i++) {
      await this.db
        .insert(sessionRecords)
        .values({
          registrationId: registration.id,
          sessionNumber: i,
          status: 'scheduled',
        })
        .returning();
    }

    return registration;
  }

  async getRegistration(eventId: string, gamerId: string) {
    const registration = await this.db
      .select()
      .from(eventRegistrations)
      .where(
        and(
          eq(eventRegistrations.eventId, eventId),
          eq(eventRegistrations.gamerId, gamerId)
        )
      )
      .limit(1);

    if (registration.length === 0) {
      throw new Error('Registration not found');
    }

    return registration[0];
  }

  async useSession(registrationId: string) {
    // Get current registration
    const [registration] = await this.db
      .select()
      .from(eventRegistrations)
      .where(eq(eventRegistrations.id, registrationId))
      .limit(1);

    if (!registration) {
      throw new Error('Registration not found');
    }

    // Check if sessions remaining
    const remainingSessions = registration.totalEligibleSessions - registration.usedSessions;
    if (remainingSessions <= 0) {
      throw new Error('No remaining sessions available');
    }

    // Get next scheduled session
    const [nextSession] = await this.db
      .select()
      .from(sessionRecords)
      .where(
        and(
          eq(sessionRecords.registrationId, registrationId),
          eq(sessionRecords.status, 'scheduled')
        )
      )
      .limit(1);

    if (!nextSession) {
      throw new Error('No scheduled sessions available');
    }

    // Mark session as started and increment used count
    await this.db
      .update(sessionRecords)
      .set({ status: 'started' })
      .where(eq(sessionRecords.id, nextSession.id));

    const [updated] = await this.db
      .update(eventRegistrations)
      .set({ usedSessions: registration.usedSessions + 1 })
      .where(eq(eventRegistrations.id, registrationId))
      .returning();

    return {
      registration: updated,
      sessionNumber: nextSession.sessionNumber,
    };
  }

  async createTournamentBracket(eventId: string, input: CreateTournamentBracketInput) {
    const [bracket] = await this.db
      .insert(tournamentBrackets)
      .values({
        eventId,
        roundName: input.roundName,
        roundNumber: input.roundNumber,
        sessionRequirement: input.sessionRequirement || 1,
      })
      .returning();

    return bracket;
  }

  async getTournamentBrackets(eventId: string) {
    return this.db
      .select()
      .from(tournamentBrackets)
      .where(eq(tournamentBrackets.eventId, eventId))
      .orderBy(tournamentBrackets.roundNumber);
  }

  async updateGamerTournamentStatus(
    registrationId: string,
    input: UpdateGamerRoundInput
  ) {
    const updateData: any = {
      currentRound: input.currentRound,
    };

    // If loss, mark as eliminated
    if (input.matchResult === 'loss') {
      updateData.isEliminated = true;
    }

    const [updated] = await this.db
      .update(eventRegistrations)
      .set({ ...updateData, updatedAt: new Date() })
      .where(eq(eventRegistrations.id, registrationId))
      .returning();

    return updated;
  }

  async canAdvanceInTournament(registrationId: string, eventId: string, nextRoundNumber: number) {
    const [registration] = await this.db
      .select()
      .from(eventRegistrations)
      .where(eq(eventRegistrations.id, registrationId))
      .limit(1);

    if (!registration || registration.isEliminated) {
      throw new Error('Gamer is eliminated or registration not found');
    }

    // Get next round requirements
    const [nextRound] = await this.db
      .select()
      .from(tournamentBrackets)
      .where(
        and(
          eq(tournamentBrackets.eventId, eventId),
          eq(tournamentBrackets.roundNumber, nextRoundNumber)
        )
      )
      .limit(1);

    if (!nextRound) {
      throw new Error('Next round not found');
    }

    // Check if gamer has enough sessions for next round
    const remainingSessions = registration.totalEligibleSessions - registration.usedSessions;
    if (remainingSessions < nextRound.sessionRequirement) {
      throw new Error('Not enough sessions remaining for next round');
    }

    return {
      canAdvance: true,
      nextRound: nextRound.roundName,
      sessionsRequired: nextRound.sessionRequirement,
    };
  }

  async getPlayerEventRegistrations(gamerId: string) {
    const registrations = await this.db
      .select({
        id: eventRegistrations.id,
        eventId: eventRegistrations.eventId,
        gamerId: eventRegistrations.gamerId,
        totalEligibleSessions: eventRegistrations.totalEligibleSessions,
        usedSessions: eventRegistrations.usedSessions,
        status: eventRegistrations.status,
        currentRound: eventRegistrations.currentRound,
        isEliminated: eventRegistrations.isEliminated,
        createdAt: eventRegistrations.createdAt,
        updatedAt: eventRegistrations.updatedAt,
        eventTitle: events.title,
        entryFeeType: events.entryFeeType,
        eventGame: events.game,
      })
      .from(eventRegistrations)
      .innerJoin(events, eq(eventRegistrations.eventId, events.id))
      .where(eq(eventRegistrations.gamerId, gamerId))
      .orderBy(eventRegistrations.createdAt);

    return registrations;
  }

  async getEventLeaderboard(eventId: string) {
    // Get all event registrations with user info
    const registrations = await this.db
      .select({
        registrationId: eventRegistrations.id,
        gamerId: eventRegistrations.gamerId,
        totalEligibleSessions: eventRegistrations.totalEligibleSessions,
        usedSessions: eventRegistrations.usedSessions,
        email: users.email,
        cellphone: users.cellphone,
      })
      .from(eventRegistrations)
      .leftJoin(users, eq(eventRegistrations.gamerId, users.id))
      .where(eq(eventRegistrations.eventId, eventId));

    // For each registration, fetch their gaming sessions and results
    const leaderboard = await Promise.all(
      registrations.map(async (reg) => {
        // Get gaming sessions for this player in this event
        const sessions = await this.db
          .select({
            sessionId: gamingSessions.id,
            result: gameSessionResults.result,
          })
          .from(gamingSessions)
          .leftJoin(gameSessionResults, eq(gamingSessions.id, gameSessionResults.sessionId))
          .where(
            and(
              eq(gamingSessions.userId, reg.gamerId),
              eq(gamingSessions.eventId, eventId)
            )
          );

        console.log(`Player ${reg.email || reg.cellphone} (${reg.gamerId}) sessions:`, sessions);

        // Calculate points: win = 3, draw = 1, loss = 0
        let points = 0;
        sessions.forEach(session => {
          if (session.result === 'win') {
            points += 3;
          } else if (session.result === 'draw') {
            points += 1;
          }
        });

        const entry = {
          gamerId: reg.gamerId,
          registrationId: reg.registrationId,
          username: reg.email || reg.cellphone || 'Unknown',
          points,
          gamesPlayed: sessions.length,
          wins: sessions.filter(s => s.result === 'win').length,
          draws: sessions.filter(s => s.result === 'draw').length,
          losses: sessions.filter(s => s.result === 'loss').length,
        };
        console.log(`Calculated entry for ${reg.email || reg.cellphone}:`, entry);
        return entry;
      })
    );

    // Sort by points (descending) then by gamesPlayed (descending)
    leaderboard.sort((a, b) => {
      if (b.points !== a.points) {
        return b.points - a.points;
      }
      return b.gamesPlayed - a.gamesPlayed;
    });

    // Add position to each entry
    const result = leaderboard.map((entry, index) => ({
      ...entry,
      position: index + 1,
    }));

    console.log('Leaderboard for event', eventId, ':', result);
    return result;
  }
}
