import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export function attachUser(req: Request, _res: Response, next: NextFunction) {
  // If you use Authorization: Bearer <token>
  const auth = req.headers.authorization;
  if (auth?.startsWith('Bearer ')) {
    const token = auth.slice(7);
    try {
      // Verify the token properly instead of just decoding
      const payload: any = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret');
      // Map your real payload fields here
      req.user = {
        id: payload.sub ?? payload.id,
        userId: payload.userId ?? payload.id,
        role: payload.role ?? 'user',
        ngoId: payload.ngoId ?? null,
        vendorId: payload.vendorId ?? null,
      };
    } catch (error) {
      // Log the error but don't crash - user stays undefined
      console.log('Token verification failed:', error.message);
    }
  }

  // Dev fallback (optional): allow a fake user via headers for local testing
  if (!req.user && process.env.DEV_FAKE_USER === '1') {
    const role = (req.headers['x-dev-role'] as string) || 'admin';
    req.user = {
      id: (req.headers['x-dev-user-id'] as string) || '1',
      role: role as any,
      ngoId: (req.headers['x-dev-ngo-id'] as string) || null,
      vendorId: (req.headers['x-dev-vendor-id'] as string) || null,
    };
  }

  next();
}

export function requireRole(roles: Array<'admin' | 'ngo' | 'vendor' | 'user'>) {
  return (req: Request, res: Response, next: NextFunction) => {
    const role = req.user?.role;
    if (!role || !roles.includes(role)) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    return next();
  };
}
