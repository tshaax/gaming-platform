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
  ocrResults?: string;
  captureImage?: string;
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
  ocrResults?: string;
  captureImage?: string;
  verificationStatus: string;
  verifiedBy?: string;
  verifiedAt?: string;
  verificationNotes?: string;
  createdAt: string;
  playerName: string;
  children?: Omit<ResultResponse, 'children'>[];
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

      // Check if this has OCR/image data - if so, create parent-child structure
      const hasOCRData = input.ocrResults || input.captureImage;

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

        // Create result for player 1 (session player) - use parent-child structure like solo
        let vsParentResult: any = null;

        if (hasOCRData) {
          // Create parent WITHOUT OCR/image
          const vsParentResults = await this.db
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
            .returning();

          vsParentResult = vsParentResults[0];

          // Create child WITH OCR/image linked to parent
          await this.db
            .insert(gameSessionResults)
            .values({
              sessionId: input.sessionId,
              parentId: vsParentResult.id,
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
              ocrResults: input.ocrResults || null,
              captureImage: input.captureImage || null,
              verificationStatus: 'pending',
            })
            .returning();
        } else {
          // No OCR/image - create single result
          const vsSingleResults = await this.db
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
            .returning();
          vsParentResult = vsSingleResults[0];
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
          id: vsParentResult.id,
          sessionId: vsParentResult.sessionId,
          game: vsParentResult.game,
          score: vsParentResult.score || 0,
          result: vsParentResult.result || undefined,
          placement: vsParentResult.placement || undefined,
          gameType: vsParentResult.gameType,
          opponentUserId: vsParentResult.opponentUserId,
          player1Score: vsParentResult.player1Score,
          player2Score: vsParentResult.player2Score,
          winner: vsParentResult.winner,
          verificationStatus: vsParentResult.verificationStatus,
          createdAt: vsParentResult.createdAt.toISOString(),
          playerName,
        };
      } else {
        // Solo game - create parent result and optional child for OCR/image
        let parentResult: any = null;

        if (hasOCRData) {
          // Create parent WITHOUT OCR/image
          const parentResults = await this.db
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
            .returning();

          parentResult = parentResults[0];

          // Create child WITH OCR/image linked to parent
          await this.db
            .insert(gameSessionResults)
            .values({
              sessionId: input.sessionId,
              parentId: parentResult.id,
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
              ocrResults: input.ocrResults || null,
              captureImage: input.captureImage || null,
              verificationStatus: 'pending',
            })
            .returning();
        } else {
          // No OCR/image - create single result
          const singleResults = await this.db
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
            .returning();
          parentResult = singleResults[0];
        }

        const retrievedResult = await this.db
          .select({
            id: gameSessionResults.id,
            sessionId: gameSessionResults.sessionId,
            game: gameSessionResults.game,
            score: gameSessionResults.score,
            result: gameSessionResults.result,
            placement: gameSessionResults.placement,
            ocrResults: gameSessionResults.ocrResults,
            captureImage: gameSessionResults.captureImage,
            verificationStatus: gameSessionResults.verificationStatus,
            createdAt: gameSessionResults.createdAt,
          })
          .from(gameSessionResults)
          .where(eq(gameSessionResults.id, parentResult.id));

        if (!retrievedResult.length) {
          throw new Error('Failed to insert game result');
        }

        const result = retrievedResult[0];

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
        ocrResults: gameSessionResults.ocrResults,
        captureImage: gameSessionResults.captureImage,
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
          eq(gameSessionResults.parentId, null),
        ),
      )
      .orderBy(desc(gameSessionResults.createdAt));

    const responses: ResultResponse[] = [];

    for (const result of results) {
      // Fetch children for this result
      const children = await this.db
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
          ocrResults: gameSessionResults.ocrResults,
          captureImage: gameSessionResults.captureImage,
          verificationStatus: gameSessionResults.verificationStatus,
          verifiedBy: gameSessionResults.verifiedBy,
          verifiedAt: gameSessionResults.verifiedAt,
          verificationNotes: gameSessionResults.verificationNotes,
          createdAt: gameSessionResults.createdAt,
        })
        .from(gameSessionResults)
        .where(eq(gameSessionResults.parentId, result.id));

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
        ocrResults: result.ocrResults || undefined,
        captureImage: result.captureImage || undefined,
        verificationStatus: result.verificationStatus,
        verifiedBy: result.verifiedBy || undefined,
        verifiedAt: result.verifiedAt?.toISOString(),
        verificationNotes: result.verificationNotes || undefined,
        createdAt: result.createdAt.toISOString(),
        playerName,
        opponentName,
        children: children.length > 0 ? children.map(c => ({
          id: c.id,
          sessionId: c.sessionId,
          game: c.game,
          score: c.score || 0,
          result: c.result,
          placement: c.placement || undefined,
          gameType: c.gameType,
          opponentUserId: c.opponentUserId,
          player1Score: c.player1Score,
          player2Score: c.player2Score,
          winner: c.winner,
          ocrResults: c.ocrResults || undefined,
          captureImage: c.captureImage || undefined,
          verificationStatus: c.verificationStatus,
          verifiedBy: c.verifiedBy || undefined,
          verifiedAt: c.verifiedAt?.toISOString(),
          verificationNotes: c.verificationNotes || undefined,
          createdAt: c.createdAt.toISOString(),
          playerName,
          opponentName,
        })) : undefined,
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
        ocrResults: gameSessionResults.ocrResults,
        captureImage: gameSessionResults.captureImage,
        verificationStatus: gameSessionResults.verificationStatus,
        verifiedBy: gameSessionResults.verifiedBy,
        verifiedAt: gameSessionResults.verifiedAt,
        verificationNotes: gameSessionResults.verificationNotes,
        createdAt: gameSessionResults.createdAt,
        userId: gamingSessions.userId,
      })
      .from(gameSessionResults)
      .innerJoin(gamingSessions, eq(gameSessionResults.sessionId, gamingSessions.id))
      .where(and(eq(gamingSessions.storeId, storeId), eq(gameSessionResults.parentId, null)))
      .orderBy(desc(gameSessionResults.createdAt))
      .limit(limit);

    const responses: ResultResponse[] = [];

    for (const result of results) {
      // Fetch children for this result
      const children = await this.db
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
          ocrResults: gameSessionResults.ocrResults,
          captureImage: gameSessionResults.captureImage,
          verificationStatus: gameSessionResults.verificationStatus,
          verifiedBy: gameSessionResults.verifiedBy,
          verifiedAt: gameSessionResults.verifiedAt,
          verificationNotes: gameSessionResults.verificationNotes,
          createdAt: gameSessionResults.createdAt,
        })
        .from(gameSessionResults)
        .where(eq(gameSessionResults.parentId, result.id));

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
        ocrResults: result.ocrResults || undefined,
        captureImage: result.captureImage || undefined,
        verificationStatus: result.verificationStatus,
        verifiedBy: result.verifiedBy || undefined,
        verifiedAt: result.verifiedAt?.toISOString(),
        verificationNotes: result.verificationNotes || undefined,
        createdAt: result.createdAt.toISOString(),
        playerName,
        opponentName,
        children: children.length > 0 ? children.map(c => ({
          id: c.id,
          sessionId: c.sessionId,
          game: c.game,
          score: c.score || 0,
          result: c.result,
          placement: c.placement || undefined,
          gameType: c.gameType,
          opponentUserId: c.opponentUserId,
          player1Score: c.player1Score,
          player2Score: c.player2Score,
          winner: c.winner,
          ocrResults: c.ocrResults || undefined,
          captureImage: c.captureImage || undefined,
          verificationStatus: c.verificationStatus,
          verifiedBy: c.verifiedBy || undefined,
          verifiedAt: c.verifiedAt?.toISOString(),
          verificationNotes: c.verificationNotes || undefined,
          createdAt: c.createdAt.toISOString(),
          playerName,
          opponentName,
        })) : undefined,
      });
    }

    return responses;
  }
}
