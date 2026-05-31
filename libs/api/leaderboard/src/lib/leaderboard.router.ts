import { Router, Request, Response } from 'express';
import { ZodError, z } from 'zod';
import { LeaderboardService } from './leaderboard.service';
import { authenticate, requireRole } from '@org/api/auth';
import type { ApiResponse } from '@org/models';

export function createLeaderboardRouter(leaderboardService: LeaderboardService): Router {
  const router = Router();

  // Get leaderboard data with optional filters
  router.get('/', authenticate, async (req: Request, res: Response) => {
    try {
      const storeId = req.query.storeId as string | undefined;
      const game = req.query.game as string | undefined;

      const data = await leaderboardService.getLeaderboardData(storeId, game);
      const body: ApiResponse<typeof data> = { data, success: true };
      res.json(body);
    } catch (err) {
      handleError(err, res);
    }
  });

  // Get top players
  router.get('/top-players', authenticate, async (req: Request, res: Response) => {
    try {
      const storeId = req.query.storeId as string | undefined;
      const game = req.query.game as string | undefined;

      const topPlayers = await leaderboardService.getTopPlayers(storeId, game);
      const body: ApiResponse<typeof topPlayers> = { data: topPlayers, success: true };
      res.json(body);
    } catch (err) {
      handleError(err, res);
    }
  });

  // Get unique games
  router.get('/games', authenticate, async (req: Request, res: Response) => {
    try {
      const games = await leaderboardService.getUniqueGames();
      const body: ApiResponse<typeof games> = { data: games, success: true };
      res.json(body);
    } catch (err) {
      handleError(err, res);
    }
  });

  // Delete a result - admin only
  router.delete('/:resultId', authenticate, requireRole('admin'), async (req: Request, res: Response) => {
    try {
      await leaderboardService.deleteResult(req.params.resultId);
      const body: ApiResponse<null> = {
        data: null,
        success: true,
        message: 'Result deleted successfully',
      };
      res.json(body);
    } catch (err) {
      handleError(err, res);
    }
  });

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
