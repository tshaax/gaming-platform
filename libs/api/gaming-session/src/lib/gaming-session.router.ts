import { Router, Request, Response } from 'express';
import { GamingSessionService } from './gaming-session.service';
import { authenticate, requireRole } from '@org/api/auth';
import type { ApiResponse } from '@org/models';

interface CreateSessionRequest {
  userId?: string;
  stationId: string;
  durationMins: number;
  ratePerHour: string;
  opponentType?: string;
  eventId?: string;
  notes?: string;
}

interface CreateStationRequest {
  name: string;
}

interface CreateDurationRequest {
  minutes: number;
}

interface CreateRateRequest {
  ratePerHour: string;
  label?: string;
}

interface CreatePricingRequest {
  durationMins: number;
  ratePerHour: string;
  label?: string;
}

interface CreateGameRequest {
  name: string;
  thumbnail?: string;
}

interface UpdateGameRequest {
  name?: string;
  thumbnail?: string;
}

interface UpdateSessionDetailsRequest {
  game?: string;
  opponentUserId?: string;
}

interface SubmitResultRequest {
  game?: string;
  score?: number;
  placement?: number;
  result?: string;
  kills?: number;
  deaths?: number;
  assists?: number;
  gameType?: 'solo' | 'vs';
  opponentUserId?: string;
  player1Score?: number;
  player2Score?: number;
  winner?: string;
}

interface ExtendSessionRequest {
  additionalMins: number;
}

export function createGamingSessionRouter(gamingSessionService: GamingSessionService): Router {
  const router = Router();

  // Create gaming session
  router.post(
    '/',
    authenticate,
    async (req: Request, res: Response) => {
      try {
        const user = (req as any).user;
        const storeId = user.storeId;
        const input = req.body as CreateSessionRequest;

        // Use userId from request body (for cashiers creating sessions for players)
        // or fall back to JWT token's sub (for players creating their own sessions)
        const userId = input.userId || user.sub;

        const session = await gamingSessionService.createGamingSession({
          storeId,
          userId,
          stationId: input.stationId,
          durationMins: input.durationMins,
          ratePerHour: input.ratePerHour,
          opponentType: input.opponentType,
          eventId: input.eventId,
          notes: input.notes,
        });

        const body: ApiResponse<typeof session> = { data: session, success: true };
        res.status(201).json(body);
      } catch (err: unknown) {
        const error = err as Error;
        console.error('[Gaming Session Error]', error);
        res.status(500).json({
          data: null,
          success: false,
          error: error.message || 'Failed to create gaming session',
        });
      }
    },
  );

  // Get gaming sessions by store
  router.get(
    '/store/:storeId',
    authenticate,
    async (req: Request, res: Response) => {
      try {
        const { storeId } = req.params;
        const sessions = await gamingSessionService.getGamingSessionsByStore(storeId);
        const body: ApiResponse<typeof sessions> = { data: sessions, success: true };
        res.json(body);
      } catch (err: unknown) {
        const error = err as Error;
        res.status(500).json({
          data: null,
          success: false,
          error: error.message || 'Failed to fetch gaming sessions',
        });
      }
    },
  );

  // Get gaming sessions by user
  router.get(
    '/user',
    authenticate,
    async (req: Request, res: Response) => {
      try {
        const user = (req as any).user;
        const storeId = user.storeId;
        const sessions = await gamingSessionService.getGamingSessionsByUser(user.sub, storeId);
        const body: ApiResponse<typeof sessions> = { data: sessions, success: true };
        res.json(body);
      } catch (err: unknown) {
        const error = err as Error;
        res.status(500).json({
          data: null,
          success: false,
          error: error.message || 'Failed to fetch gaming sessions',
        });
      }
    },
  );

  // Get active sessions for current user
  router.get(
    '/user/active',
    authenticate,
    async (req: Request, res: Response) => {
      try {
        const user = (req as any).user;
        const sessions = await gamingSessionService.getActiveSessionsForUser(user.sub);
        const body: ApiResponse<typeof sessions> = { data: sessions, success: true };
        res.json(body);
      } catch (err: unknown) {
        const error = err as Error;
        res.status(500).json({
          data: null,
          success: false,
          error: error.message || 'Failed to fetch active gaming sessions',
        });
      }
    },
  );

  // Update session details (game and opponent)
  router.put(
    '/:sessionId/details',
    authenticate,
    async (req: Request, res: Response) => {
      try {
        const { sessionId } = req.params;
        const input = req.body as UpdateSessionDetailsRequest;

        const session = await gamingSessionService.updateSessionDetails(
          sessionId,
          input.game,
          input.opponentUserId,
        );
        const body: ApiResponse<typeof session> = { data: session, success: true };
        res.json(body);
      } catch (err: unknown) {
        const error = err as Error;
        res.status(500).json({
          data: null,
          success: false,
          error: error.message || 'Failed to update session details',
        });
      }
    },
  );

  // Submit result without ending session (allows multiple games per session)
  router.post(
    '/:sessionId/results',
    authenticate,
    async (req: Request, res: Response) => {
      try {
        const { sessionId } = req.params;
        const input = req.body as SubmitResultRequest;

        // Create result record
        const result = await gamingSessionService.createSessionResult(sessionId, {
          game: input.game,
          score: input.score,
          placement: input.placement,
          result: input.result,
          kills: input.kills,
          deaths: input.deaths,
          assists: input.assists,
          gameType: input.gameType,
          opponentUserId: input.opponentUserId,
          player1Score: input.player1Score,
          player2Score: input.player2Score,
          winner: input.winner,
        });

        const body: ApiResponse<typeof result> = { data: result, success: true };
        res.json(body);
      } catch (err: unknown) {
        const error = err as Error;
        res.status(500).json({
          data: null,
          success: false,
          error: error.message || 'Failed to submit result',
        });
      }
    },
  );

  // End session manually
  router.post(
    '/:sessionId/end-and-submit-results',
    authenticate,
    async (req: Request, res: Response) => {
      try {
        const { sessionId } = req.params;
        const input = req.body as SubmitResultRequest;

        // Create result record
        await gamingSessionService.createSessionResult(sessionId, {
          game: input.game,
          score: input.score,
          placement: input.placement,
          result: input.result,
          kills: input.kills,
          deaths: input.deaths,
          assists: input.assists,
          gameType: input.gameType,
          opponentUserId: input.opponentUserId,
          player1Score: input.player1Score,
          player2Score: input.player2Score,
          winner: input.winner,
        });

        // End the session
        const endedSession = await gamingSessionService.endGamingSession(sessionId);

        const body: ApiResponse<typeof endedSession> = { data: endedSession, success: true };
        res.json(body);
      } catch (err: unknown) {
        const error = err as Error;
        res.status(500).json({
          data: null,
          success: false,
          error: error.message || 'Failed to submit result',
        });
      }
    },
  );

  // Get session result
  router.get(
    '/:sessionId/results',
    authenticate,
    async (req: Request, res: Response) => {
      try {
        const { sessionId } = req.params;
        const result = await gamingSessionService.getSessionResult(sessionId);
        const body: ApiResponse<typeof result> = { data: result, success: true };
        res.json(body);
      } catch (err: unknown) {
        const error = err as Error;
        res.status(500).json({
          data: null,
          success: false,
          error: error.message || 'Failed to fetch session result',
        });
      }
    },
  );

  // Update session result
  router.put(
    '/results/:resultId',
    authenticate,
    async (req: Request, res: Response) => {
      try {
        const { resultId } = req.params;
        const input = req.body as SubmitResultRequest;

        const updated = await gamingSessionService.updateSessionResult(resultId, {
          game: input.game,
          score: input.score,
          placement: input.placement,
          result: input.result,
          kills: input.kills,
          deaths: input.deaths,
          assists: input.assists,
        });

        const body: ApiResponse<typeof updated> = { data: updated, success: true };
        res.json(body);
      } catch (err: unknown) {
        const error = err as Error;
        res.status(500).json({
          data: null,
          success: false,
          error: error.message || 'Failed to update session result',
        });
      }
    },
  );

  // End gaming session
  router.put(
    '/:sessionId/end',
    authenticate,
    async (req: Request, res: Response) => {
      try {
        const { sessionId } = req.params;
        const session = await gamingSessionService.endGamingSession(sessionId);
        const body: ApiResponse<typeof session> = { data: session, success: true };
        res.json(body);
      } catch (err: unknown) {
        const error = err as Error;
        res.status(500).json({
          data: null,
          success: false,
          error: error.message || 'Failed to end gaming session',
        });
      }
    },
  );

  // Extend gaming session with additional time
  router.post(
    '/:sessionId/extend',
    authenticate,
    async (req: Request, res: Response) => {
      try {
        const { sessionId } = req.params;
        const input = req.body as ExtendSessionRequest;

        if (!input.additionalMins || input.additionalMins <= 0) {
          res.status(400).json({
            data: null,
            success: false,
            error: 'additionalMins must be a positive number',
          });
          return;
        }

        const session = await gamingSessionService.extendGamingSession(sessionId, input.additionalMins);
        const body: ApiResponse<typeof session> = { data: session, success: true };
        res.json(body);
      } catch (err: unknown) {
        const error = err as Error;
        res.status(500).json({
          data: null,
          success: false,
          error: error.message || 'Failed to extend gaming session',
        });
      }
    },
  );

  // Gaming stations endpoints
  router.get(
    '/stations/:storeId',
    authenticate,
    async (req: Request, res: Response) => {
      try {
        const { storeId } = req.params;
        const stations = await gamingSessionService.getGamingStationsByStore(storeId);
        const body: ApiResponse<typeof stations> = { data: stations, success: true };
        res.json(body);
      } catch (err: unknown) {
        const error = err as Error;
        res.status(500).json({
          data: null,
          success: false,
          error: error.message || 'Failed to fetch gaming stations',
        });
      }
    },
  );

  router.post(
    '/stations',
    authenticate,
    requireRole('admin'),
    async (req: Request, res: Response) => {
      try {
        const input = req.body as CreateStationRequest & { storeId: string };
        const storeId = input.storeId;

        if (!storeId) {
          res.status(400).json({
            data: null,
            success: false,
            error: 'storeId is required',
          });
          return;
        }

        const station = await gamingSessionService.createGamingStation(storeId, input.name);
        const body: ApiResponse<typeof station> = { data: station, success: true };
        res.status(201).json(body);
      } catch (err: unknown) {
        const error = err as Error;
        res.status(500).json({
          data: null,
          success: false,
          error: error.message || 'Failed to create gaming station',
        });
      }
    },
  );

  router.delete(
    '/stations/:stationId',
    authenticate,
    requireRole('admin'),
    async (req: Request, res: Response) => {
      try {
        const { stationId } = req.params;
        await gamingSessionService.deleteGamingStation(stationId);
        const body: ApiResponse<null> = { data: null, success: true };
        res.json(body);
      } catch (err: unknown) {
        const error = err as Error;
        res.status(500).json({
          data: null,
          success: false,
          error: error.message || 'Failed to delete gaming station',
        });
      }
    },
  );

  // Duration options endpoints - now uses pricing options as single source of truth
  router.get(
    '/durations/:storeId',
    authenticate,
    async (req: Request, res: Response) => {
      try {
        const { storeId } = req.params;
        // Get pricing options and map to duration format
        // This eliminates duplication and keeps duration/rate aligned
        const pricingOptions = await gamingSessionService.getPricingOptionsByStore(storeId);
        const durations = pricingOptions.map((p: any) => ({
          id: p.id,
          minutes: p.durationMins,
          isActive: p.isActive,
          // Include rate info so frontend can display it if needed
          ratePerHour: p.ratePerHour,
          label: p.label,
        }));
        const body: ApiResponse<typeof durations> = { data: durations, success: true };
        res.json(body);
      } catch (err: unknown) {
        const error = err as Error;
        res.status(500).json({
          data: null,
          success: false,
          error: error.message || 'Failed to fetch duration options',
        });
      }
    },
  );

  router.post(
    '/durations',
    authenticate,
    requireRole('admin'),
    async (req: Request, res: Response) => {
      try {
        const input = req.body as CreateDurationRequest & { storeId: string };
        const storeId = input.storeId;

        if (!storeId) {
          res.status(400).json({
            data: null,
            success: false,
            error: 'storeId is required',
          });
          return;
        }

        const option = await gamingSessionService.createDurationOption(storeId, input.minutes);
        const body: ApiResponse<typeof option> = { data: option, success: true };
        res.status(201).json(body);
      } catch (err: unknown) {
        const error = err as Error;
        res.status(500).json({
          data: null,
          success: false,
          error: error.message || 'Failed to create duration option',
        });
      }
    },
  );

  router.delete(
    '/durations/:durationId',
    authenticate,
    requireRole('admin'),
    async (req: Request, res: Response) => {
      try {
        const { durationId } = req.params;
        await gamingSessionService.deleteDurationOption(durationId);
        const body: ApiResponse<null> = { data: null, success: true };
        res.json(body);
      } catch (err: unknown) {
        const error = err as Error;
        res.status(500).json({
          data: null,
          success: false,
          error: error.message || 'Failed to delete duration option',
        });
      }
    },
  );

  // Rate options endpoints
  router.get(
    '/rates/:storeId',
    authenticate,
    async (req: Request, res: Response) => {
      try {
        const { storeId } = req.params;
        const options = await gamingSessionService.getRateOptionsByStore(storeId);
        const body: ApiResponse<typeof options> = { data: options, success: true };
        res.json(body);
      } catch (err: unknown) {
        const error = err as Error;
        res.status(500).json({
          data: null,
          success: false,
          error: error.message || 'Failed to fetch rate options',
        });
      }
    },
  );

  router.post(
    '/rates',
    authenticate,
    requireRole('admin'),
    async (req: Request, res: Response) => {
      try {
        const input = req.body as CreateRateRequest & { storeId: string };
        const storeId = input.storeId;

        if (!storeId) {
          res.status(400).json({
            data: null,
            success: false,
            error: 'storeId is required',
          });
          return;
        }

        const option = await gamingSessionService.createRateOption(
          storeId,
          input.ratePerHour,
          input.label,
        );
        const body: ApiResponse<typeof option> = { data: option, success: true };
        res.status(201).json(body);
      } catch (err: unknown) {
        const error = err as Error;
        res.status(500).json({
          data: null,
          success: false,
          error: error.message || 'Failed to create rate option',
        });
      }
    },
  );

  router.delete(
    '/rates/:rateId',
    authenticate,
    requireRole('admin'),
    async (req: Request, res: Response) => {
      try {
        const { rateId } = req.params;
        await gamingSessionService.deleteRateOption(rateId);
        const body: ApiResponse<null> = { data: null, success: true };
        res.json(body);
      } catch (err: unknown) {
        const error = err as Error;
        res.status(500).json({
          data: null,
          success: false,
          error: error.message || 'Failed to delete rate option',
        });
      }
    },
  );

  // Pricing options endpoints (combined duration + rate)
  router.get(
    '/pricing/:storeId',
    authenticate,
    async (req: Request, res: Response) => {
      try {
        const { storeId } = req.params;
        const options = await gamingSessionService.getPricingOptionsByStore(storeId);
        const body: ApiResponse<typeof options> = { data: options, success: true };
        res.json(body);
      } catch (err: unknown) {
        const error = err as Error;
        res.status(500).json({
          data: null,
          success: false,
          error: error.message || 'Failed to fetch pricing options',
        });
      }
    },
  );

  router.post(
    '/pricing',
    authenticate,
    requireRole('admin'),
    async (req: Request, res: Response) => {
      try {
        const input = req.body as CreatePricingRequest & { storeId: string };
        const storeId = input.storeId;

        if (!storeId) {
          res.status(400).json({
            data: null,
            success: false,
            error: 'storeId is required',
          });
          return;
        }

        const option = await gamingSessionService.createPricingOption(
          storeId,
          input.durationMins,
          input.ratePerHour,
          input.label,
        );
        const body: ApiResponse<typeof option> = { data: option, success: true };
        res.status(201).json(body);
      } catch (err: unknown) {
        const error = err as Error;
        res.status(500).json({
          data: null,
          success: false,
          error: error.message || 'Failed to create pricing option',
        });
      }
    },
  );

  router.delete(
    '/pricing/:pricingId',
    authenticate,
    requireRole('admin'),
    async (req: Request, res: Response) => {
      try {
        const { pricingId } = req.params;
        await gamingSessionService.deletePricingOption(pricingId);
        const body: ApiResponse<null> = { data: null, success: true };
        res.json(body);
      } catch (err: unknown) {
        const error = err as Error;
        res.status(500).json({
          data: null,
          success: false,
          error: error.message || 'Failed to delete pricing option',
        });
      }
    },
  );

  // Games endpoints
  router.get(
    '/games/:storeId',
    authenticate,
    async (req: Request, res: Response) => {
      try {
        const { storeId } = req.params;
        const gamesList = await gamingSessionService.getGamesByStore(storeId);
        const body: ApiResponse<typeof gamesList> = { data: gamesList, success: true };
        res.json(body);
      } catch (err: unknown) {
        const error = err as Error;
        res.status(500).json({
          data: null,
          success: false,
          error: error.message || 'Failed to fetch games',
        });
      }
    },
  );

  router.post(
    '/games',
    authenticate,
    requireRole('admin'),
    async (req: Request, res: Response) => {
      try {
        const input = req.body as CreateGameRequest & { storeId: string };
        const storeId = input.storeId;

        if (!storeId) {
          res.status(400).json({
            data: null,
            success: false,
            error: 'storeId is required',
          });
          return;
        }

        const game = await gamingSessionService.createGame(
          storeId,
          input.name,
          input.thumbnail,
        );
        const body: ApiResponse<typeof game> = { data: game, success: true };
        res.status(201).json(body);
      } catch (err: unknown) {
        const error = err as Error;
        res.status(500).json({
          data: null,
          success: false,
          error: error.message || 'Failed to create game',
        });
      }
    },
  );

  router.put(
    '/games/:gameId',
    authenticate,
    requireRole('admin'),
    async (req: Request, res: Response) => {
      try {
        const { gameId } = req.params;
        const input = req.body as UpdateGameRequest;

        const game = await gamingSessionService.updateGame(
          gameId,
          input.name || '',
          input.thumbnail,
        );
        const body: ApiResponse<typeof game> = { data: game, success: true };
        res.json(body);
      } catch (err: unknown) {
        const error = err as Error;
        res.status(500).json({
          data: null,
          success: false,
          error: error.message || 'Failed to update game',
        });
      }
    },
  );

  router.delete(
    '/games/:gameId',
    authenticate,
    requireRole('admin'),
    async (req: Request, res: Response) => {
      try {
        const { gameId } = req.params;
        await gamingSessionService.deleteGame(gameId);
        const body: ApiResponse<null> = { data: null, success: true };
        res.json(body);
      } catch (err: unknown) {
        const error = err as Error;
        res.status(500).json({
          data: null,
          success: false,
          error: error.message || 'Failed to delete game',
        });
      }
    },
  );

  return router;
}
