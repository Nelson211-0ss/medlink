import { NextFunction, Request, Response } from 'express';
import { verifyAccessToken } from '../utils/jwt';
import { UnauthorizedError } from '../utils/errors';
import { USER_STATUS } from '../utils/constants';

const extractToken = (req: Request): string | null => {
  const header = req.headers.authorization;
  if (header?.startsWith('Bearer ')) return header.slice(7);
  if (req.cookies?.access_token) return req.cookies.access_token as string;
  return null;
};

export const authenticate = (req: Request, _res: Response, next: NextFunction) => {
  const token = extractToken(req);
  if (!token) return next(new UnauthorizedError('Authentication token missing'));
  try {
    const payload = verifyAccessToken(token);
    req.user = {
      id: payload.sub,
      email: payload.email,
      role: payload.role,
      status: USER_STATUS.ACTIVE,
    };
    next();
  } catch {
    next(new UnauthorizedError('Invalid or expired token'));
  }
};

/** Attach user if present, but never reject. Useful for public+personalized routes. */
export const optionalAuth = (req: Request, _res: Response, next: NextFunction) => {
  const token = extractToken(req);
  if (!token) return next();
  try {
    const payload = verifyAccessToken(token);
    req.user = {
      id: payload.sub,
      email: payload.email,
      role: payload.role,
      status: USER_STATUS.ACTIVE,
    };
  } catch {
    /* ignore */
  }
  next();
};
