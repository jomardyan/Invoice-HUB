import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import logger from '@/utils/logger';
import { AppError, ValidationError } from '@/errors';
import { MonitoringService } from '@/services/MonitoringService';
import { v4 as uuidv4 } from 'uuid';

/**
 * Get or generate trace ID for request
 */
const getTraceId = (req: Request): string => {
  return (req.headers['x-request-id'] as string) || uuidv4();
};

/**
 * Sanitize error details to remove sensitive information
 */
const sanitizeErrorDetails = (details: any): any => {
  if (!details || typeof details !== 'object') return details;

  const sensitiveKeys = ['password', 'token', 'secret', 'apiKey', 'authorization'];
  const sanitized = { ...details };

  for (const key of Object.keys(sanitized)) {
    if (sensitiveKeys.some(sensitive => key.toLowerCase().includes(sensitive))) {
      sanitized[key] = '[REDACTED]';
    }
  }

  return sanitized;
};

/**
 * Enhanced Error Handler Middleware
 */
export const errorHandler = (
  err: Error | AppError,
  req: Request,
  res: Response,
  _next: NextFunction
) => {
  const traceId = getTraceId(req);
  const monitoring = MonitoringService.getInstance(logger);

  // Set trace ID in response header
  res.setHeader('X-Trace-Id', traceId);

  // ============================================
  // 1. Handle AppError (our custom errors)
  // ============================================
  if (err instanceof AppError) {
    const statusCode = err.statusCode;
    const isOperational = err.isOperational;

    // Log based on severity
    if (statusCode >= 500) {
      logger.error(`[${traceId}] ${err.code}: ${err.message}`, {
        code: err.code,
        statusCode,
        details: sanitizeErrorDetails(err.details),
        stack: err.stack,
        method: req.method,
        url: req.originalUrl,
        userId: (req as any).user?.id,
        companyId: (req as any).user?.companyId,
      });

      // Capture non-operational errors in Sentry
      if (!isOperational) {
        monitoring.captureException(err, {
          tags: { errorCode: err.code },
          extra: {
            traceId,
            details: sanitizeErrorDetails(err.details),
          },
        });
      }
    } else if (statusCode >= 400) {
      logger.warn(`[${traceId}] ${err.code}: ${err.message}`, {
        code: err.code,
        statusCode,
        details: sanitizeErrorDetails(err.details),
        method: req.method,
        url: req.originalUrl,
      });
    }

    return res.status(statusCode).json(err.toJSON());
  }

  // ============================================
  // 2. Handle Zod Validation Errors
  // ============================================
  if (err instanceof ZodError) {
    const validationError = ValidationError.fromZodError(err, traceId);

    logger.warn(`[${traceId}] Validation failed`, {
      errors: err.errors,
      method: req.method,
      url: req.originalUrl,
      body: sanitizeErrorDetails(req.body),
    });

    return res.status(400).json(validationError.toJSON());
  }

  // ============================================
  // 3. Handle TypeORM Errors
  // ============================================
  if (err.name === 'QueryFailedError' || err.name === 'EntityNotFoundError') {
    logger.error(`[${traceId}] Database error: ${err.message}`, {
      name: err.name,
      method: req.method,
      url: req.originalUrl,
      stack: err.stack,
    });

    // Don't expose database errors to clients
    return res.status(500).json({
      success: false,
      error: {
        code: 'DATABASE_ERROR',
        message: 'A database error occurred. Please try again later.',
        traceId,
        timestamp: new Date().toISOString(),
      },
    });
  }

  // ============================================
  // 4. Handle JWT Errors
  // ============================================
  if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    logger.warn(`[${traceId}] JWT error: ${err.message}`, {
      name: err.name,
      method: req.method,
      url: req.originalUrl,
    });

    return res.status(401).json({
      success: false,
      error: {
        code: err.name === 'TokenExpiredError' ? 'TOKEN_EXPIRED' : 'INVALID_TOKEN',
        message: err.name === 'TokenExpiredError'
          ? 'Authentication token has expired'
          : 'Invalid authentication token',
        traceId,
        timestamp: new Date().toISOString(),
      },
    });
  }

  // ============================================
  // 5. Handle Multer (File Upload) Errors
  // ============================================
  if (err.name === 'MulterError') {
    logger.warn(`[${traceId}] File upload error: ${err.message}`, {
      method: req.method,
      url: req.originalUrl,
    });

    return res.status(400).json({
      success: false,
      error: {
        code: 'FILE_UPLOAD_ERROR',
        message: `File upload failed: ${err.message}`,
        traceId,
        timestamp: new Date().toISOString(),
      },
    });
  }

  // ============================================
  // 6. Handle Unknown/Unexpected Errors
  // ============================================
  logger.error(`[${traceId}] Unhandled error: ${err.message}`, {
    name: err.name,
    message: err.message,
    stack: err.stack,
    method: req.method,
    url: req.originalUrl,
    userId: (req as any).user?.id,
    companyId: (req as any).user?.companyId,
    body: sanitizeErrorDetails(req.body),
    query: req.query,
  });

  // Always capture unexpected errors in Sentry
  monitoring.captureException(err, {
    tags: { errorType: 'unhandled' },
    extra: {
      traceId,
      method: req.method,
      url: req.originalUrl,
    },
  });

  // Return generic error message
  return res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: 'An unexpected error occurred. Please contact support if this persists.',
      traceId,
      timestamp: new Date().toISOString(),
    },
  });
};

/**
 * 404 Not Found Handler
 */
export const notFoundHandler = (req: Request, res: Response) => {
  const traceId = getTraceId(req);

  logger.warn(`[${traceId}] Route not found: ${req.method} ${req.originalUrl}`);

  res.status(404).json({
    success: false,
    error: {
      code: 'ROUTE_NOT_FOUND',
      message: `Route ${req.method} ${req.originalUrl} not found`,
      traceId,
      timestamp: new Date().toISOString(),
    },
  });
};

/**
 * Async Handler Wrapper
 * Catches async errors and passes them to error handler
 */
export const asyncHandler = (
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// Export for backward compatibility
export { AppError };
