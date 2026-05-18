import { Router, Request, Response } from 'express';
import { ZodError, z } from 'zod';
import { StoreService } from './store.service';
import { authenticate, requireRole } from '@org/api/auth';
import type { ApiResponse } from '@org/models';

const createStoreSchema = z.object({
  name: z.string().min(2),
  slug: z.string().min(2),
  address: z.string().optional(),
  taxNumber: z.string().optional(),
  manager: z.string().optional(),
  contactPerson: z.string().optional(),
  contactPhone: z.string().optional(),
});

const updateStoreSchema = z.object({
  name: z.string().min(2).optional(),
  slug: z.string().min(2).optional(),
  address: z.string().optional(),
  taxNumber: z.string().optional(),
  manager: z.string().optional(),
  contactPerson: z.string().optional(),
  contactPhone: z.string().optional(),
});

export function createStoreRouter(storeService: StoreService): Router {
  const router = Router();

  // Create store - admin only
  router.post(
    '/',
    authenticate,
    requireRole('admin'),
    async (req: Request, res: Response) => {
      try {
        const input = createStoreSchema.parse(req.body);
        const store = await storeService.createStore(input);
        const body: ApiResponse<typeof store> = { data: store, success: true };
        res.status(201).json(body);
      } catch (err) {
        handleError(err, res);
      }
    },
  );

  // Get all stores
  router.get('/', authenticate, async (req: Request, res: Response) => {
    try {
      const stores = await storeService.getAllStores();
      const body: ApiResponse<typeof stores> = { data: stores, success: true };
      res.json(body);
    } catch (err) {
      handleError(err, res);
    }
  });

  // Get store by ID
  router.get('/:id', authenticate, async (req: Request, res: Response) => {
    try {
      const store = await storeService.getStore(req.params.id);
      const body: ApiResponse<typeof store> = { data: store, success: true };
      res.json(body);
    } catch (err) {
      handleError(err, res);
    }
  });

  // Update store - admin only
  router.put(
    '/:id',
    authenticate,
    requireRole('admin'),
    async (req: Request, res: Response) => {
      try {
        const input = updateStoreSchema.parse(req.body);
        const store = await storeService.updateStore(req.params.id, input);
        const body: ApiResponse<typeof store> = { data: store, success: true };
        res.json(body);
      } catch (err) {
        handleError(err, res);
      }
    },
  );

  // Delete store - admin only
  router.delete('/:id', authenticate, requireRole('admin'), async (req: Request, res: Response) => {
    try {
      await storeService.deleteStore(req.params.id);
      const body: ApiResponse<null> = {
        data: null,
        success: true,
        message: 'Store deleted successfully',
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
