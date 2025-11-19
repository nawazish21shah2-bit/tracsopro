import { Request, Response, NextFunction } from 'express';
import { verifyToken, TokenPayload } from '../utils/jwt.js';
import { UnauthorizedError, ForbiddenError } from '../utils/errors.js';
import prisma from '../config/database.js';

export interface AuthRequest extends Request {
  userId?: string;
  user?: any;
  clientId?: string;
  guardId?: string;
}

export const authenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedError('No token provided');
    }

    const token = authHeader.substring(7);
    const payload: TokenPayload = verifyToken(token);

    if (payload.type !== 'access') {
      throw new UnauthorizedError('Invalid token type');
    }

    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
        client: {
          select: { id: true }
        },
        guard: {
          select: { id: true }
        }
      },
    });

    if (!user) {
      throw new UnauthorizedError('User not found');
    }

    if (!user.isActive) {
      throw new UnauthorizedError('User account is inactive');
    }

    req.userId = user.id;
    req.user = user;
    
    // Set role-specific IDs
    if (user.client) {
      req.clientId = user.client.id;
    }
    if (user.guard) {
      req.guardId = user.guard.id;
    }
    next();
  } catch (error) {
    next(error);
  }
};

export const authorize = (...roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    try {
      if (!req.user) {
        throw new UnauthorizedError('Authentication required');
      }

      if (!roles.includes(req.user.role)) {
        throw new ForbiddenError('Insufficient permissions');
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

export const optionalAuth = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const payload: TokenPayload = verifyToken(token);

      if (payload.type === 'access') {
        const user = await prisma.user.findUnique({
          where: { id: payload.sub },
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            role: true,
            isActive: true,
          },
        });

        if (user && user.isActive) {
          req.userId = user.id;
          req.user = user;
        }
      }
    }

    next();
  } catch (error) {
    // Ignore auth errors for optional auth
    next();
  }
};

// Alias for backward compatibility
export const authenticateToken = authenticate;

// Super Admin specific middleware
export const requireSuperAdmin = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void => {
  try {
    if (!req.user) {
      throw new UnauthorizedError('Authentication required');
    }

    if (req.user.role !== 'SUPER_ADMIN') {
      throw new ForbiddenError('Super Admin access required');
    }

    next();
  } catch (error) {
    next(error);
  }
};

// Admin or Super Admin middleware
export const requireAdmin = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void => {
  try {
    if (!req.user) {
      throw new UnauthorizedError('Authentication required');
    }

    if (!['ADMIN', 'SUPER_ADMIN'].includes(req.user.role)) {
      throw new ForbiddenError('Admin access required');
    }

    next();
  } catch (error) {
    next(error);
  }
};
