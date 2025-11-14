import { Request, Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '@/types';
import { verifyAccessToken } from '@/utils/jwt';
import logger from '@/utils/logger';

export const authMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        status: 'error',
        statusCode: 401,
        message: 'Missing or invalid authorization header',
      });
      return;
    }

    const token = authHeader.substring(7); // Remove "Bearer " prefix

    const payload = verifyAccessToken(token);
    if (!payload) {
      res.status(401).json({
        status: 'error',
        statusCode: 401,
        message: 'Invalid or expired token',
      });
      return;
    }

    // Attach user info to request
    (req as AuthenticatedRequest).user = {
      id: payload.userId,
      email: payload.email,
      tenantId: payload.tenantId,
      roles: payload.roles,
    };

    next();
  } catch (error) {
    logger.error('Auth middleware error:', error);
    res.status(500).json({
      status: 'error',
      statusCode: 500,
      message: 'Internal server error',
    });
  }
};

export const requireRole = (allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const authReq = req as AuthenticatedRequest;

    if (!authReq.user) {
      res.status(401).json({
        status: 'error',
        statusCode: 401,
        message: 'Unauthorized',
      });
      return;
    }

    const hasRole = authReq.user.roles.some((role) => allowedRoles.includes(role));

    if (!hasRole) {
      res.status(403).json({
        status: 'error',
        statusCode: 403,
        message: 'Forbidden: Insufficient permissions',
      });
      return;
    }

    next();
  };
};

export const requireTenant = (req: Request, res: Response, next: NextFunction): void => {
  const authReq = req as AuthenticatedRequest;

  if (!authReq.user || !authReq.user.tenantId) {
    res.status(401).json({
      status: 'error',
      statusCode: 401,
      message: 'Tenant ID not found in request',
    });
    return;
  }

  // Verify tenant matches route parameter if present
  if (req.params.tenantId && req.params.tenantId !== authReq.user.tenantId) {
    res.status(403).json({
      status: 'error',
      statusCode: 403,
      message: 'Forbidden: Cannot access other tenants data',
    });
    return;
  }

  next();
};
