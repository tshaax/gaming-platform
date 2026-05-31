import { Router, Request, Response } from 'express';
import { ZodError, z } from 'zod';
import { PromotionService } from './promotions.service';
import { authenticate, requireRole } from '@org/api/auth';
import type { ApiResponse } from '@org/models';

const createPromotionSchema = z.object({
  storeId: z.string().optional(),
  title: z.string().min(2),
  type: z.string(),
  promoCode: z.string(),
  discountValue: z.number().optional(),
  status: z.string().optional(),
  startDate: z.string(),
  endDate: z.string(),
  targetAudience: z.string().optional(),
  maxUsage: z.number().optional(),
  description: z.string().optional(),
});

const updatePromotionSchema = z.object({
  storeId: z.string().optional(),
  title: z.string().min(2).optional(),
  type: z.string().optional(),
  promoCode: z.string().optional(),
  discountValue: z.number().optional(),
  status: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  targetAudience: z.string().optional(),
  maxUsage: z.number().optional(),
  currentUsage: z.number().optional(),
  description: z.string().optional(),
});

export function createPromotionRouter(promotionService: PromotionService): Router {
  const router = Router();

  // Get all promotions
  router.get('/', authenticate, async (req: Request, res: Response) => {
    try {
      const status = req.query.status as string | undefined;
      const storeId = req.query.storeId as string | undefined;
      const allPromotions = await promotionService.getAllPromotions(status, storeId);
      const body: ApiResponse<typeof allPromotions> = { data: allPromotions, success: true };
      res.json(body);
    } catch (err) {
      handleError(err, res);
    }
  });

  // Create promotion - admin only
  router.post(
    '/',
    authenticate,
    requireRole('admin'),
    async (req: Request, res: Response) => {
      try {
        const input = createPromotionSchema.parse(req.body);
        const promotion = await promotionService.createPromotion(input);
        const body: ApiResponse<typeof promotion> = { data: promotion, success: true };
        res.status(201).json(body);
      } catch (err) {
        handleError(err, res);
      }
    },
  );

  // Get promotion by ID
  router.get('/:id', authenticate, async (req: Request, res: Response) => {
    try {
      const promotion = await promotionService.getPromotion(req.params.id);
      const body: ApiResponse<typeof promotion> = { data: promotion, success: true };
      res.json(body);
    } catch (err) {
      handleError(err, res);
    }
  });

  // Update promotion - admin only
  router.put(
    '/:id',
    authenticate,
    requireRole('admin'),
    async (req: Request, res: Response) => {
      try {
        const input = updatePromotionSchema.parse(req.body);
        const promotion = await promotionService.updatePromotion(req.params.id, input);
        const body: ApiResponse<typeof promotion> = { data: promotion, success: true };
        res.json(body);
      } catch (err) {
        handleError(err, res);
      }
    },
  );

  // Delete promotion - admin only
  router.delete(
    '/:id',
    authenticate,
    requireRole('admin'),
    async (req: Request, res: Response) => {
      try {
        await promotionService.deletePromotion(req.params.id);
        const body: ApiResponse<null> = {
          data: null,
          success: true,
          message: 'Promotion deleted successfully',
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
