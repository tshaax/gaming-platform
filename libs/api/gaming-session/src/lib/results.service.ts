import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import { eq, and, desc } from 'drizzle-orm';
import { gameSessionResults, gamingSessions, users } from '@org/api/db';

export interface SaveResultInput {
  sessionId: string;
  game: string;
  score: number;
  result?: string;
  placement?: number;
  kills?: number;
  deaths?: number;
  assists?: number;
  gameType?: string;
  opponentUserId?: string;
  player1Score?: number;
  player2Score?: number;
  winner?: string;
}

export interface ResultResponse {
  id: string;
  sessionId: string;
  game: string;
  score: number;
  result?: string;
  placement?: number;
  gameType?: string;
  opponentUserId?: string;
  opponentName?: string;
  player1Score?: number;
  player2Score?: number;
  winner?: string;
  verificationStatus: string;
  verifiedBy?: string;
  verifiedAt?: string;
  verificationNotes?: string;
  createdAt: string;
  playerName: string;
}

export interface PendingResultsCount {
  count: number;
  storeId: string;
}

export class ResultsService {
  private db: ReturnType<typeof drizzle>;

  constructor(private pool: Pool) {
    this.db = drizzle(pool);
  }

  async saveGameResult(input: SaveResultInput): Promise<ResultResponse> {
    try {
      // Validate that the session exists first
      const sessions = await this.db
        .select({ id: gamingSessions.id, userId: gamingSessions.userId })
        .from(gamingSessions)
        .where(eq(gamingSessions.id, input.sessionId));

      if (!sessions.length) {
        throw new Error(`Session not found: ${input.sessionId}`);
      }

      const sessionUserId = sessions[0].userId;

      // For VS games, determine results from each player's perspective
      if (input.gameType === 'vs' && input.opponentUserId) {
        console.log('Processing as VS game...');
        let player1Result = input.result || null;
        let player2Result = input.result || null;

        if (input.winner) {
          if (input.winner === 'player1') {
            player1Result = 'win';
            player2Result = 'loss';
          } else if (input.winner === 'player2') {
            player1Result = 'loss';
            player2Result = 'win';
          } else if (input.winner === 'draw') {
            player1Result = 'draw';
            player2Result = 'draw';
          }
        }

        // Create result for player 1 (session player)
        const player1Results = await this.db
          .insert(gameSessionResults)
          .values({
            sessionId: input.sessionId,
            game: input.game,
            score: input.player1Score || 0,
            result: player1Result,
            placement: input.placement || null,
            kills: input.kills ?? 0,
            deaths: input.deaths ?? 0,
            assists: input.assists ?? 0,
            gameType: 'vs',
            opponentUserId: input.opponentUserId,
            player1Score: input.player1Score || null,
            player2Score: input.player2Score || null,
            winner: input.winner || null,
            verificationStatus: 'pending',
          })
          .returning({
            id: gameSessionResults.id,
            sessionId: gameSessionResults.sessionId,
            game: gameSessionResults.game,
            score: gameSessionResults.score,
            result: gameSessionResults.result,
            placement: gameSessionResults.placement,
            gameType: gameSessionResults.gameType,
            opponentUserId: gameSessionResults.opponentUserId,
            player1Score: gameSessionResults.player1Score,
            player2Score: gameSessionResults.player2Score,
            winner: gameSessionResults.winner,
            verificationStatus: gameSessionResults.verificationStatus,
            createdAt: gameSessionResults.createdAt,
          });

        if (!player1Results.length) {
          throw new Error('Failed to insert player 1 result');
        }

        // Get player 1 info
        const playerList = await this.db
          .select({ firstName: users.firstName, lastName: users.lastName })
          .from(users)
          .where(eq(users.id, sessionUserId));

        const playerName = playerList.length > 0
          ? `${playerList[0].firstName || ''} ${playerList[0].lastName || ''}`.trim() || 'Unknown'
          : 'Unknown';

        return {
          id: player1Results[0].id,
          sessionId: player1Results[0].sessionId,
          game: player1Results[0].game,
          score: player1Results[0].score || 0,
          result: player1Results[0].result || undefined,
          placement: player1Results[0].placement || undefined,
          gameType: player1Results[0].gameType,
          opponentUserId: player1Results[0].opponentUserId,
          player1Score: player1Results[0].player1Score,
          player2Score: player1Results[0].player2Score,
          winner: player1Results[0].winner,
          verificationStatus: player1Results[0].verificationStatus,
          createdAt: player1Results[0].createdAt.toISOString(),
          playerName,
        };
      } else {
        // Solo game - insert single result
        const results = await this.db
          .insert(gameSessionResults)
          .values({
            sessionId: input.sessionId,
            game: input.game,
            score: input.score,
            result: input.result || null,
            placement: input.placement || null,
            kills: input.kills ?? 0,
            deaths: input.deaths ?? 0,
            assists: input.assists ?? 0,
            gameType: input.gameType || null,
            opponentUserId: input.opponentUserId ? input.opponentUserId : null,
            player1Score: input.player1Score || null,
            player2Score: input.player2Score || null,
            winner: input.winner || null,
            verificationStatus: 'pending',
          })
          .returning({
            id: gameSessionResults.id,
            sessionId: gameSessionResults.sessionId,
            game: gameSessionResults.game,
            score: gameSessionResults.score,
            result: gameSessionResults.result,
            placement: gameSessionResults.placement,
            verificationStatus: gameSessionResults.verificationStatus,
            createdAt: gameSessionResults.createdAt,
          });

        if (!results.length) {
          throw new Error('Failed to insert game result');
        }

        const result = results[0];

        // Get player info
        const playerList = await this.db
          .select({ firstName: users.firstName, lastName: users.lastName })
          .from(users)
          .where(eq(users.id, sessionUserId));

        const playerName = playerList.length > 0
          ? `${playerList[0].firstName || ''} ${playerList[0].lastName || ''}`.trim() || 'Unknown'
          : 'Unknown';

        return {
          id: result.id,
          sessionId: result.sessionId,
          game: result.game,
          score: result.score || 0,
          result: result.result || undefined,
          placement: result.placement || undefined,
          verificationStatus: result.verificationStatus,
          createdAt: result.createdAt.toISOString(),
          playerName,
        };
      }
    } catch (error) {
      console.error('Error saving game result:', error);
      throw error;
    }
  }

  async getPendingResults(storeId: string): Promise<ResultResponse[]> {
    const results = await this.db
      .select({
        id: gameSessionResults.id,
        sessionId: gameSessionResults.sessionId,
        game: gameSessionResults.game,
        score: gameSessionResults.score,
        result: gameSessionResults.result,
        placement: gameSessionResults.placement,
        gameType: gameSessionResults.gameType,
        opponentUserId: gameSessionResults.opponentUserId,
        player1Score: gameSessionResults.player1Score,
        player2Score: gameSessionResults.player2Score,
        winner: gameSessionResults.winner,
        verificationStatus: gameSessionResults.verificationStatus,
        verifiedBy: gameSessionResults.verifiedBy,
        verifiedAt: gameSessionResults.verifiedAt,
        verificationNotes: gameSessionResults.verificationNotes,
        createdAt: gameSessionResults.createdAt,
        userId: gamingSessions.userId,
      })
      .from(gameSessionResults)
      .innerJoin(gamingSessions, eq(gameSessionResults.sessionId, gamingSessions.id))
      .where(
        and(
          eq(gamingSessions.storeId, storeId),
          eq(gameSessionResults.verificationStatus, 'pending'),
        ),
      )
      .orderBy(desc(gameSessionResults.createdAt));

    const responses: ResultResponse[] = [];

    for (const result of results) {
      const player = await this.db
        .select({ firstName: users.firstName, lastName: users.lastName })
        .from(users)
        .where(eq(users.id, result.userId));

      const playerName = `${player[0]?.firstName || ''} ${player[0]?.lastName || ''}`.trim() || 'Unknown';

      let opponentName: string | undefined;
      if (result.opponentUserId) {
        const opponent = await this.db
          .select({
            firstName: users.firstName,
            lastName: users.lastName,
            email: users.email,
            cellphone: users.cellphone
          })
          .from(users)
          .where(eq(users.id, result.opponentUserId));
        if (opponent[0]) {
          const fullName = `${opponent[0].firstName || ''} ${opponent[0].lastName || ''}`.trim();
          const contact = opponent[0].email || opponent[0].cellphone;
          if (fullName && contact) {
            opponentName = `${fullName} (${contact})`;
          } else if (fullName) {
            opponentName = fullName;
          } else if (contact) {
            opponentName = contact;
          }
        }
      }

      responses.push({
        id: result.id,
        sessionId: result.sessionId,
        game: result.game,
        score: result.score || 0,
        result: result.result,
        placement: result.placement || undefined,
        gameType: result.gameType,
        opponentUserId: result.opponentUserId,
        player1Score: result.player1Score,
        player2Score: result.player2Score,
        winner: result.winner,
        verificationStatus: result.verificationStatus,
        verifiedBy: result.verifiedBy || undefined,
        verifiedAt: result.verifiedAt?.toISOString(),
        verificationNotes: result.verificationNotes || undefined,
        createdAt: result.createdAt.toISOString(),
        playerName,
        opponentName,
      });
    }

    return responses;
  }

  async getPendingResultsCount(storeId: string): Promise<number> {
    const [count] = await this.db
      .select({
        count: gameSessionResults.id,
      })
      .from(gameSessionResults)
      .innerJoin(gamingSessions, eq(gameSessionResults.sessionId, gamingSessions.id))
      .where(
        and(
          eq(gamingSessions.storeId, storeId),
          eq(gameSessionResults.verificationStatus, 'pending'),
        ),
      );

    return count ? 1 : 0;
  }

  async verifyResult(
    resultId: string,
    verifiedBy: string,
    approved: boolean,
    notes?: string,
  ): Promise<void> {
    await this.db
      .update(gameSessionResults)
      .set({
        verificationStatus: approved ? 'approved' : 'rejected',
        verifiedBy: verifiedBy,
        verifiedAt: new Date(),
        verificationNotes: notes,
      })
      .where(eq(gameSessionResults.id, resultId));
  }

  async getAllResults(storeId: string, limit = 50): Promise<ResultResponse[]> {
    const results = await this.db
      .select({
        id: gameSessionResults.id,
        sessionId: gameSessionResults.sessionId,
        game: gameSessionResults.game,
        score: gameSessionResults.score,
        result: gameSessionResults.result,
        placement: gameSessionResults.placement,
        gameType: gameSessionResults.gameType,
        opponentUserId: gameSessionResults.opponentUserId,
        player1Score: gameSessionResults.player1Score,
        player2Score: gameSessionResults.player2Score,
        winner: gameSessionResults.winner,
        verificationStatus: gameSessionResults.verificationStatus,
        verifiedBy: gameSessionResults.verifiedBy,
        verifiedAt: gameSessionResults.verifiedAt,
        verificationNotes: gameSessionResults.verificationNotes,
        createdAt: gameSessionResults.createdAt,
        userId: gamingSessions.userId,
      })
      .from(gameSessionResults)
      .innerJoin(gamingSessions, eq(gameSessionResults.sessionId, gamingSessions.id))
      .where(eq(gamingSessions.storeId, storeId))
      .orderBy(desc(gameSessionResults.createdAt))
      .limit(limit);

    const responses: ResultResponse[] = [];

    for (const result of results) {
      const player = await this.db
        .select({ firstName: users.firstName, lastName: users.lastName })
        .from(users)
        .where(eq(users.id, result.userId));

      const playerName = `${player[0]?.firstName || ''} ${player[0]?.lastName || ''}`.trim() || 'Unknown';

      let opponentName: string | undefined;
      if (result.opponentUserId) {
        const opponent = await this.db
          .select({
            firstName: users.firstName,
            lastName: users.lastName,
            email: users.email,
            cellphone: users.cellphone
          })
          .from(users)
          .where(eq(users.id, result.opponentUserId));
        if (opponent[0]) {
          const fullName = `${opponent[0].firstName || ''} ${opponent[0].lastName || ''}`.trim();
          const contact = opponent[0].email || opponent[0].cellphone;
          if (fullName && contact) {
            opponentName = `${fullName} (${contact})`;
          } else if (fullName) {
            opponentName = fullName;
          } else if (contact) {
            opponentName = contact;
          }
        }
      }

      responses.push({
        id: result.id,
        sessionId: result.sessionId,
        game: result.game,
        score: result.score || 0,
        result: result.result,
        placement: result.placement || undefined,
        gameType: result.gameType,
        opponentUserId: result.opponentUserId,
        player1Score: result.player1Score,
        player2Score: result.player2Score,
        winner: result.winner,
        verificationStatus: result.verificationStatus,
        verifiedBy: result.verifiedBy || undefined,
        verifiedAt: result.verifiedAt?.toISOString(),
        verificationNotes: result.verificationNotes || undefined,
        createdAt: result.createdAt.toISOString(),
        playerName,
        opponentName,
      });
    }

    return responses;
  }
}
