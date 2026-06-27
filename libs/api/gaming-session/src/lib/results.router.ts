import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { ResultsService } from './results.service';

const saveResultSchema = z.object({
  sessionId: z.string().uuid(),
  game: z.string().min(1).max(255),
  score: z.number().int().nonnegative(),
  result: z.string().optional(),
  placement: z.number().int().optional(),
  kills: z.number().int().nonnegative().optional(),
  deaths: z.number().int().nonnegative().optional(),
  assists: z.number().int().nonnegative().optional(),
  gameType: z.string().optional(),
  opponentUserId: z.string().uuid().optional(),
  player1Score: z.number().int().optional(),
  player2Score: z.number().int().optional(),
  winner: z.string().optional(),
  ocrResults: z.string().optional(),
  captureImage: z.string().optional(),
});

export function createResultsRouter(service: ResultsService): Router {
  const router = Router();

  // Save game result
  router.post('/', async (req: Request, res: Response) => {
    try {
      const input = saveResultSchema.parse(req.body);
      const result = await service.saveGameResult(input);
      console.log('Result saved successfully:', result.id);
      res.status(201).json({
        success: true,
        data: result,
      });
    } catch (error) {
      console.error('Error saving result:', error);
      const message = error instanceof Error ? error.message : 'Failed to save result';
      res.status(400).json({
        success: false,
        data: null,
        error: message,
      });
    }
  });

  // Get pending results for a store
  router.get('/pending/:storeId', async (req: Request, res: Response) => {
    try {
      const { storeId } = req.params;
      const results = await service.getPendingResults(storeId);
      res.json({
        success: true,
        data: results,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fetch pending results';
      res.status(500).json({
        success: false,
        data: null,
        error: message,
      });
    }
  });

  // Get count of pending results
  router.get('/pending-count/:storeId', async (req: Request, res: Response) => {
    try {
      const { storeId } = req.params;
      const count = await service.getPendingResultsCount(storeId);
      res.json({
        success: true,
        data: { count },
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fetch count';
      res.status(500).json({
        success: false,
        data: null,
        error: message,
      });
    }
  });

  // Get all results for a store
  router.get('/:storeId', async (req: Request, res: Response) => {
    try {
      const { storeId } = req.params;
      const results = await service.getAllResults(storeId);
      res.json({
        success: true,
        data: results,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fetch results';
      res.status(500).json({
        success: false,
        data: null,
        error: message,
      });
    }
  });

  // Verify result
  router.put('/:resultId/verify', async (req: Request, res: Response) => {
    try {
      const { resultId } = req.params;
      const { approved, verificationNotes, verifiedBy } = req.body;

      if (!verifiedBy) {
        return res.status(401).json({
          success: false,
          data: null,
          error: 'Verified by user ID is required',
        });
      }

      await service.verifyResult(resultId, verifiedBy, approved, verificationNotes);
      res.json({
        success: true,
        data: { message: 'Result verified' },
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to verify result';
      res.status(400).json({
        success: false,
        data: null,
        error: message,
      });
    }
  });

  return router;
}
