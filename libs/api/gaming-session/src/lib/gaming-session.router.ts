import { Router, Request, Response } from 'express';
import { GamingSessionService } from './gaming-session.service';
import { authenticate, requireRole } from '@org/api/auth';
import type { ApiResponse } from '@org/models';

interface CreateSessionRequest {
  stationId: string;
  durationMins: number;
  ratePerHour: string;
  opponentType?: string;
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

        const session = await gamingSessionService.createGamingSession({
          storeId,
          userId: user.sub,
          stationId: input.stationId,
          durationMins: input.durationMins,
          ratePerHour: input.ratePerHour,
          opponentType: input.opponentType,
          notes: input.notes,
        });

        const body: ApiResponse<typeof session> = { data: session, success: true };
        res.status(201).json(body);
      } catch (err: unknown) {
        const error = err as Error;
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

  // Duration options endpoints
  router.get(
    '/durations/:storeId',
    authenticate,
    async (req: Request, res: Response) => {
      try {
        const { storeId } = req.params;
        const options = await gamingSessionService.getDurationOptionsByStore(storeId);
        const body: ApiResponse<typeof options> = { data: options, success: true };
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

  return router;
}
