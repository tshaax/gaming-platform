import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import { eq, isNull, sql } from 'drizzle-orm';
import { events, eventResults } from '@org/api/db';

export interface TopPlayer {
  playerUsername: string;
  totalPoints: number;
  rank: number;
  rankTier: string;
}

export interface GameResult {
  id: string;
  playerUsername: string;
  game: string;
  score: string | null;
  pointsEarned: number | null;
  kills: number;
  deaths: number;
  assists: number;
  result: string;
  placement: number | null;
  createdAt: Date;
}

export class LeaderboardService {
  private db: any;

  constructor(private pool: Pool) {
    this.db = drizzle(pool);
  }

  async getLeaderboardData(storeId?: string | null, game?: string) {
    try {
      let query = this.db
        .select({
          id: eventResults.id,
          playerUsername: eventResults.playerUsername,
          game: events.game,
          score: eventResults.score,
          pointsEarned: eventResults.pointsEarned,
          kills: eventResults.kills,
          deaths: eventResults.deaths,
          assists: eventResults.assists,
          result: eventResults.result,
          placement: eventResults.placement,
          createdAt: eventResults.createdAt,
        })
        .from(eventResults)
        .innerJoin(events, eq(eventResults.eventId, events.id));

      // Filter by store
      if (storeId && storeId !== 'all') {
        query = query.where(eq(events.storeId, storeId));
      } else if (storeId === null || storeId === 'all') {
        // All stores - no filter or include all including null storeId
        // No additional where clause needed
      }

      // Filter by game if provided
      if (game && game !== 'all') {
        query = query.where(eq(events.game, game));
      }

      const results = await query;
      return results;
    } catch (error) {
      console.error('Database error in getLeaderboardData:', error);
      throw error;
    }
  }

  async getTopPlayers(storeId?: string | null, game?: string): Promise<TopPlayer[]> {
    try {
      const results = await this.getLeaderboardData(storeId, game);

      // Calculate total points per player
      const playerPoints: Record<string, number> = {};
      results.forEach((result: any) => {
        const points = result.pointsEarned || 0;
        playerPoints[result.playerUsername] =
          (playerPoints[result.playerUsername] || 0) + points;
      });

      // Sort by points and assign ranks
      const sortedPlayers = Object.entries(playerPoints)
        .sort((a, b) => b[1] - a[1])
        .map(([playerUsername, totalPoints], index) => {
          const rank = index + 1;
          const rankTier = this.getRankTier(rank);
          return { playerUsername, totalPoints, rank, rankTier };
        });

      return sortedPlayers.slice(0, 10);
    } catch (error) {
      console.error('Database error in getTopPlayers:', error);
      throw error;
    }
  }

  async getUniqueGames(): Promise<string[]> {
    try {
      const results = await this.db
        .selectDistinct({ game: events.game })
        .from(events)
        .where(sql`${events.game} IS NOT NULL`);

      return results
        .map((r: any) => r.game)
        .filter((game: string | null) => game !== null && game !== undefined);
    } catch (error) {
      console.error('Database error in getUniqueGames:', error);
      throw error;
    }
  }

  async deleteResult(resultId: string) {
    try {
      const [deleted] = await this.db
        .delete(eventResults)
        .where(eq(eventResults.id, resultId))
        .returning();

      if (!deleted) {
        throw new Error('Result not found');
      }

      return { success: true };
    } catch (error) {
      console.error('Database error in deleteResult:', error);
      throw error;
    }
  }

  private getRankTier(rank: number): string {
    if (rank <= 10) return 'Legend';
    if (rank <= 50) return 'Master';
    if (rank <= 100) return 'Diamond';
    if (rank <= 500) return 'Platinum';
    return 'Gold';
  }
}
