import { Request, Response, NextFunction } from 'express';
import { AuthService, UserSessionPayload } from '../services/authService.ts';
import { UserRole } from '../db/types.ts';

declare global {
  namespace Express {
    interface Request {
      user?: UserSessionPayload;
    }
  }
}

export function authenticateToken(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  let token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!token && req.cookies && req.cookies.token) {
    token = req.cookies.token;
  }

  if (!token) {
    res.status(401).json({ success: false, error: 'Authentication required. Please sign in.' });
    return;
  }

  const payload = AuthService.verifyToken(token);
  if (!payload) {
    res.status(401).json({ success: false, error: 'Invalid or expired session. Please sign in again.' });
    return;
  }

  req.user = payload;
  next();
}

export function optionalAuthenticateToken(req: Request, _res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  let token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!token && req.cookies && req.cookies.token) {
    token = req.cookies.token;
  }

  if (token) {
    const payload = AuthService.verifyToken(token);
    if (payload) {
      req.user = payload;
    }
  }

  next();
}

export function requireRole(...allowedRoles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Authentication required' });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        error: `Access denied. Requires one of roles: [${allowedRoles.join(', ')}]. Current role: ${req.user.role}`,
      });
      return;
    }

    next();
  };
}
