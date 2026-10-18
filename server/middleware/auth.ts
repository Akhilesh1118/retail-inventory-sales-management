import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AuthTokenPayload, UserRole } from '../types/index.ts';
import { db } from '../db/dataStore.ts';

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET?.trim();
  if (!secret || secret.length < 32 || /replace|placeholder|change-me/i.test(secret)) {
    throw new Error('JWT_SECRET must be set to a private random value of at least 32 characters.');
  }
  return secret;
}

export function assertAuthConfiguration(): void {
  getJwtSecret();
}

export interface AuthenticatedRequest extends Request {
  user?: AuthTokenPayload;
}

export function generateToken(payload: AuthTokenPayload): string {
  return jwt.sign(payload, getJwtSecret(), {
    expiresIn: (process.env.JWT_EXPIRES_IN || '7d') as any
  });
}

export function authenticateToken(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

  if (!token) {
    res.status(401).json({
      error: 'Unauthorized',
      message: 'Access token is missing. Please log in.'
    });
    return;
  }

  try {
    const decoded = jwt.verify(token, getJwtSecret()) as AuthTokenPayload;
    
    // Verify that the user still exists and is active
    const user = db.findUserById(decoded.userId);
    if (!user || !user.isActive) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'User account not found or has been deactivated.'
      });
      return;
    }

    req.user = {
      userId: user._id,
      username: user.username,
      email: user.email,
      role: user.role,
      fullName: user.fullName
    };
    next();
  } catch (err: any) {
    res.status(401).json({
      error: 'Unauthorized',
      message: 'Invalid or expired authentication token.'
    });
  }
}

export function optionalAuthenticateToken(
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction
): void {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

  if (!token) {
    return next();
  }

  try {
    const decoded = jwt.verify(token, getJwtSecret()) as AuthTokenPayload;
    const user = db.findUserById(decoded.userId);
    if (user && user.isActive) {
      req.user = {
        userId: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        fullName: user.fullName
      };
    }
  } catch (_e) {
    // Continue as guest
  }
  next();
}

export function requireRole(allowedRoles: UserRole[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'Authentication required.'
      });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        error: 'Forbidden',
        message: `Action requires one of the following roles: [${allowedRoles.join(', ')}]. You have '${req.user.role}'.`
      });
      return;
    }

    next();
  };
}

export const requireAdmin = requireRole(['admin']);
export const requireStaffOrAdmin = requireRole(['admin', 'staff']);
