import { Router, Request, Response } from 'express';
import { ZodError } from 'zod';
import { AuthService } from './auth.service';
import {
  registerSchema,
  loginSchema,
  refreshSchema,
  logoutSchema,
} from './auth.schemas';
import { authenticate, requireRole } from './auth.middleware';
import type { ApiResponse, AuthTokens } from '@org/models';

export function createAuthRouter(authService: AuthService): Router {
  const router = Router();

  // Public: any user logs in
  router.post('/login', async (req: Request, res: Response) => {
    try {
      const input  = loginSchema.parse(req.body);
      const tokens = await authService.login(input);
      const body: ApiResponse<AuthTokens> = { data: tokens, success: true };
      res.json(body);
    } catch (err) {
      handleError(err, res);
    }
  });

  // Protected: cashiers register gamers; admins register cashiers/admins
  router.post(
    '/register',
    authenticate,
    (req: Request, res: Response, next) => {
      const role = req.body?.role ?? 'gamer';

      if (role === 'gamer') {
        requireRole('cashier', 'admin')(req, res, next);
      } else {
        requireRole('admin')(req, res, next);
      }
    },
    async (req: Request, res: Response) => {
      try {
        const input  = registerSchema.parse(req.body);
        const tokens = await authService.register(input);
        const body: ApiResponse<AuthTokens> = { data: tokens, success: true };
        res.status(201).json(body);
      } catch (err) {
        handleError(err, res);
      }
    },
  );

  // Semi-public: valid refresh token required (in body)
  router.post('/refresh', async (req: Request, res: Response) => {
    try {
      const input  = refreshSchema.parse(req.body);
      const result = await authService.refresh(input);
      const body: ApiResponse<typeof result> = { data: result, success: true };
      res.json(body);
    } catch (err) {
      handleError(err, res);
    }
  });

  router.post('/logout', async (req: Request, res: Response) => {
    try {
      const input = logoutSchema.parse(req.body);
      await authService.logout(input);
      const body: ApiResponse<null> = {
        data: null,
        success: true,
        message: 'Logged out',
      };
      res.json(body);
    } catch (err) {
      handleError(err, res);
    }
  });

  // Protected: get all stores for the current user
  router.get('/stores', authenticate, async (req: Request, res: Response) => {
    try {
      const user = (req as any).user;
      const stores = await authService.getUserStores(user.sub);
      const body: ApiResponse<typeof stores> = { data: stores, success: true };
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
    const code = (err as Error & { code?: string }).code;
    const known = new Set([
      'USER_EXISTS',
      'INVALID_CREDENTIALS',
      'STORE_NOT_FOUND',
      'MEMBERSHIP_NOT_FOUND',
      'TOKEN_REVOKED',
      'TOKEN_INVALID',
      'TOKEN_EXPIRED',
    ]);
    const status = known.has(code ?? '') ? 400 : 500;
    const body: ApiResponse<null> = { data: null, success: false, error: err.message };
    res.status(status).json(body);
    return;
  }

  res.status(500).json({ data: null, success: false, error: 'Unknown error' });
}
