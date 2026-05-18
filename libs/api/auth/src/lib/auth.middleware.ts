import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import type { JwtAccessPayload, UserRole } from '@org/models';

export function authenticate(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers['authorization'];

  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json({
      success: false,
      data: null,
      error: 'Missing or malformed Authorization header',
    });
    return;
  }

  const token = authHeader.slice(7);

  try {
    const payload = jwt.verify(token, process.env['JWT_SECRET']!) as JwtAccessPayload;

    if (payload.type !== 'access') {
      res.status(401).json({ success: false, data: null, error: 'Invalid token type' });
      return;
    }

    (req as Request & { user: JwtAccessPayload }).user = payload;
    next();
  } catch {
    res.status(401).json({ success: false, data: null, error: 'Invalid or expired token' });
  }
}

export function requireRole(...roles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const user = (req as Request & { user?: JwtAccessPayload }).user;

    if (!user || !roles.includes(user.role)) {
      res.status(403).json({ success: false, data: null, error: 'Insufficient permissions' });
      return;
    }

    next();
  };
}
