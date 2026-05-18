import { Router, Request, Response } from 'express';
import { ZodError, z } from 'zod';
import { CashierService } from './cashier.service';
import { authenticate, requireRole } from '@org/api/auth';
import type { ApiResponse } from '@org/models';

const createCashierSchema = z.object({
  firstName: z.string().min(2),
  lastName: z.string().min(2),
  email: z.string().email(),
  phone: z.string().min(7),
  storeId: z.string().uuid(),
  password: z.string().min(8),
});

const updateCashierSchema = z.object({
  firstName: z.string().min(2).optional(),
  lastName: z.string().min(2).optional(),
  email: z.string().email().optional(),
  phone: z.string().min(7).optional(),
});

export function createCashierRouter(cashierService: CashierService): Router {
  const router = Router();

  // Create cashier - admin only
  router.post(
    '/',
    authenticate,
    requireRole('admin'),
    async (req: Request, res: Response) => {
      try {
        const input = createCashierSchema.parse(req.body);
        const cashier = await cashierService.createCashier(input);
        const body: ApiResponse<typeof cashier> = { data: cashier, success: true };
        res.status(201).json(body);
      } catch (err) {
        handleError(err, res);
      }
    },
  );

  // Get all cashiers - admin only
  router.get('/', authenticate, requireRole('admin'), async (req: Request, res: Response) => {
    try {
      const cashiers = await cashierService.getAllCashiers();
      const body: ApiResponse<typeof cashiers> = { data: cashiers, success: true };
      res.json(body);
    } catch (err) {
      handleError(err, res);
    }
  });

  // Get cashiers by store - admin only
  router.get('/:storeId', authenticate, requireRole('admin'), async (req: Request, res: Response) => {
    try {
      const cashiers = await cashierService.getCashiersByStore(req.params.storeId);
      const body: ApiResponse<typeof cashiers> = { data: cashiers, success: true };
      res.json(body);
    } catch (err) {
      handleError(err, res);
    }
  });

  // Update cashier - admin only
  router.put(
    '/:id',
    authenticate,
    requireRole('admin'),
    async (req: Request, res: Response) => {
      try {
        const input = updateCashierSchema.parse(req.body);
        const cashier = await cashierService.updateCashier(req.params.id, input);
        const body: ApiResponse<typeof cashier> = { data: cashier, success: true };
        res.json(body);
      } catch (err) {
        handleError(err, res);
      }
    },
  );

  // Delete cashier - admin only
  router.delete(
    '/:id',
    authenticate,
    requireRole('admin'),
    async (req: Request, res: Response) => {
      try {
        await cashierService.deleteCashier(req.params.id);
        const body: ApiResponse<null> = {
          data: null,
          success: true,
          message: 'Cashier deleted successfully',
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
