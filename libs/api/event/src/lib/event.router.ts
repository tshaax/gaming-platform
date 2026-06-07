import { Router, Request, Response } from 'express';
import { ZodError, z } from 'zod';
import { EventService } from './event.service';
import { authenticate, requireRole } from '@org/api/auth';
import type { ApiResponse } from '@org/models';

const createEventSchema = z.object({
  title: z.string().min(2),
  game: z.string().optional(),
  eventType: z.string().optional(),
  entryFeeType: z.string().optional(),
  eligibleSessions: z.number().optional(),
  startDate: z.string(),
  endDate: z.string().optional(),
  prizePool: z.string().optional(),
  maxPlayers: z.number().optional(),
  status: z.string().optional(),
  description: z.string().optional(),
});

const updateEventSchema = z.object({
  title: z.string().min(2).optional(),
  game: z.string().optional(),
  eventType: z.string().optional(),
  entryFeeType: z.string().optional(),
  eligibleSessions: z.number().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  prizePool: z.string().optional(),
  maxPlayers: z.number().optional(),
  currentPlayers: z.number().optional(),
  status: z.string().optional(),
  description: z.string().optional(),
});

const createEventResultSchema = z.object({
  playerUsername: z.string(),
  result: z.string(),
  placement: z.number().optional(),
  score: z.string().optional(),
  pointsEarned: z.number().optional(),
  kills: z.number().optional(),
  deaths: z.number().optional(),
  assists: z.number().optional(),
});

const registerForEventSchema = z.object({
  gamerId: z.string(),
  totalEligibleSessions: z.number().optional(),
});

const createTournamentBracketSchema = z.object({
  roundName: z.string(),
  roundNumber: z.number(),
  sessionRequirement: z.number().optional(),
});

const updateGamerTournamentStatusSchema = z.object({
  currentRound: z.string(),
  matchResult: z.enum(['win', 'loss']),
});

const canAdvanceSchema = z.object({
  nextRoundNumber: z.number(),
});

export function createEventRouter(eventService: EventService): Router {
  const router = Router();

  // Get all events with optional status filter
  router.get('/', authenticate, async (req: Request, res: Response) => {
    try {
      const status = req.query.status as string | undefined;
      const allEvents = await eventService.getAllEvents(status);
      const body: ApiResponse<typeof allEvents> = { data: allEvents, success: true };
      res.json(body);
    } catch (err) {
      handleError(err, res);
    }
  });

  // Create event - admin only
  router.post(
    '/',
    authenticate,
    requireRole('admin'),
    async (req: Request, res: Response) => {
      try {
        const input = createEventSchema.parse(req.body);
        const event = await eventService.createEvent(input);
        const body: ApiResponse<typeof event> = { data: event, success: true };
        res.status(201).json(body);
      } catch (err) {
        handleError(err, res);
      }
    },
  );

  // Get event by ID
  router.get('/:id', authenticate, async (req: Request, res: Response) => {
    try {
      const event = await eventService.getEvent(req.params.id);
      const body: ApiResponse<typeof event> = { data: event, success: true };
      res.json(body);
    } catch (err) {
      handleError(err, res);
    }
  });

  // Update event - admin only
  router.put(
    '/:id',
    authenticate,
    requireRole('admin'),
    async (req: Request, res: Response) => {
      try {
        const input = updateEventSchema.parse(req.body);
        const event = await eventService.updateEvent(req.params.id, input);
        const body: ApiResponse<typeof event> = { data: event, success: true };
        res.json(body);
      } catch (err) {
        handleError(err, res);
      }
    },
  );

  // Delete event - admin only
  router.delete(
    '/:id',
    authenticate,
    requireRole('admin'),
    async (req: Request, res: Response) => {
      try {
        await eventService.deleteEvent(req.params.id);
        const body: ApiResponse<null> = {
          data: null,
          success: true,
          message: 'Event deleted successfully',
        };
        res.json(body);
      } catch (err) {
        handleError(err, res);
      }
    },
  );

  // Get event results
  router.get('/:id/results', authenticate, async (req: Request, res: Response) => {
    try {
      const results = await eventService.getEventResults(req.params.id);
      const body: ApiResponse<typeof results> = { data: results, success: true };
      res.json(body);
    } catch (err) {
      handleError(err, res);
    }
  });

  // Add event result - admin only
  router.post(
    '/:id/results',
    authenticate,
    requireRole('admin'),
    async (req: Request, res: Response) => {
      try {
        const input = createEventResultSchema.parse(req.body);
        const result = await eventService.addEventResult(req.params.id, input);
        const body: ApiResponse<typeof result> = { data: result, success: true };
        res.status(201).json(body);
      } catch (err) {
        handleError(err, res);
      }
    },
  );

  // Delete event result - admin only
  router.delete(
    '/:id/results/:resultId',
    authenticate,
    requireRole('admin'),
    async (req: Request, res: Response) => {
      try {
        await eventService.deleteEventResult(req.params.resultId);
        const body: ApiResponse<null> = {
          data: null,
          success: true,
          message: 'Event result deleted successfully',
        };
        res.json(body);
      } catch (err) {
        handleError(err, res);
      }
    },
  );

  // Register gamer for event
  router.post(
    '/:id/register',
    authenticate,
    async (req: Request, res: Response) => {
      try {
        const input = registerForEventSchema.parse(req.body);
        const registration = await eventService.registerForEvent(req.params.id, input);
        const body: ApiResponse<typeof registration> = { data: registration, success: true };
        res.status(201).json(body);
      } catch (err) {
        handleError(err, res);
      }
    },
  );

  // Get registration details
  router.get(
    '/:eventId/registration/:gamerId',
    authenticate,
    async (req: Request, res: Response) => {
      try {
        const registration = await eventService.getRegistration(
          req.params.eventId,
          req.params.gamerId
        );
        const body: ApiResponse<typeof registration> = { data: registration, success: true };
        res.json(body);
      } catch (err) {
        handleError(err, res);
      }
    },
  );

  // Use a session from registration
  router.post(
    '/registrations/:registrationId/use-session',
    authenticate,
    async (req: Request, res: Response) => {
      try {
        const result = await eventService.useSession(req.params.registrationId);
        const body: ApiResponse<typeof result> = { data: result, success: true };
        res.json(body);
      } catch (err) {
        handleError(err, res);
      }
    },
  );

  // Create tournament bracket - admin only
  router.post(
    '/:eventId/tournament-brackets',
    authenticate,
    requireRole('admin'),
    async (req: Request, res: Response) => {
      try {
        const input = createTournamentBracketSchema.parse(req.body);
        const bracket = await eventService.createTournamentBracket(req.params.eventId, input);
        const body: ApiResponse<typeof bracket> = { data: bracket, success: true };
        res.status(201).json(body);
      } catch (err) {
        handleError(err, res);
      }
    },
  );

  // Get tournament brackets
  router.get(
    '/:eventId/tournament-brackets',
    authenticate,
    async (req: Request, res: Response) => {
      try {
        const brackets = await eventService.getTournamentBrackets(req.params.eventId);
        const body: ApiResponse<typeof brackets> = { data: brackets, success: true };
        res.json(body);
      } catch (err) {
        handleError(err, res);
      }
    },
  );

  // Update gamer tournament status
  router.post(
    '/registrations/:registrationId/tournament-status',
    authenticate,
    async (req: Request, res: Response) => {
      try {
        const input = updateGamerTournamentStatusSchema.parse(req.body);
        const updated = await eventService.updateGamerTournamentStatus(
          req.params.registrationId,
          input
        );
        const body: ApiResponse<typeof updated> = { data: updated, success: true };
        res.json(body);
      } catch (err) {
        handleError(err, res);
      }
    },
  );

  // Check if gamer can advance
  router.post(
    '/:eventId/registrations/:registrationId/can-advance',
    authenticate,
    async (req: Request, res: Response) => {
      try {
        const input = canAdvanceSchema.parse(req.body);
        const result = await eventService.canAdvanceInTournament(
          req.params.registrationId,
          req.params.eventId,
          input.nextRoundNumber
        );
        const body: ApiResponse<typeof result> = { data: result, success: true };
        res.json(body);
      } catch (err) {
        handleError(err, res);
      }
    },
  );

  // Get player's event registrations with event details
  router.get(
    '/player/:playerId/registrations',
    authenticate,
    async (req: Request, res: Response) => {
      try {
        const registrations = await eventService.getPlayerEventRegistrations(
          req.params.playerId
        );
        const body: ApiResponse<typeof registrations> = { data: registrations, success: true };
        res.json(body);
      } catch (err) {
        handleError(err, res);
      }
    },
  );

  // Get event leaderboard
  router.get(
    '/:eventId/leaderboard',
    authenticate,
    async (req: Request, res: Response) => {
      try {
        const leaderboard = await eventService.getEventLeaderboard(req.params.eventId);
        const body: ApiResponse<typeof leaderboard> = { data: leaderboard, success: true };
        res.json(body);
      } catch (err) {
        handleError(err, res);
      }
    },
  );

  return router;
}

function handleError(err: unknown, res: Response): void {
  if (err instanceof ZodError) {
    const body: ApiResponse<null> = {
      data: null,
      success: false,
      error: err.issues.map((e) => `${e.path.join('.')}: ${e.message}`).join('; '),
    };
    res.status(400).json(body);
    return;
  }

  if (err instanceof Error) {
    const body: ApiResponse<null> = { data: null, success: false, error: err.message };
    res.status(500).json(body);
    return;
  }

  res.status(500).json({ data: null, success: false, error: 'Unknown error' });
}
