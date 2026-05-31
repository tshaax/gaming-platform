import { Router, Request, Response } from 'express';
import { ZodError, z } from 'zod';
import { EventService } from './event.service';
import { authenticate, requireRole } from '@org/api/auth';
import type { ApiResponse } from '@org/models';

const createEventSchema = z.object({
  title: z.string().min(2),
  game: z.string().optional(),
  eventType: z.string().optional(),
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
