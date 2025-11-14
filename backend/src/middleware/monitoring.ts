import { Request, Response, NextFunction } from 'express';
import { MonitoringService } from '@/services/MonitoringService';
import logger from '@/utils/logger';
import { v4 as uuidv4 } from 'uuid';

declare global {
  namespace Express {
    interface Request {
      id: string;
      startTime: number;
      userId?: string;
      tenantId?: string;
    }
    interface Response {
      responseTime?: number;
    }
  }
}

const monitoring = MonitoringService.getInstance(logger);

/**
 * Middleware to add request ID and tracking
 */
export const requestIdMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  // Use x-request-id header if provided, otherwise generate new ID
  req.id = req.headers['x-request-id'] as string || uuidv4();
  req.startTime = Date.now();

  // Add request ID to response headers
  res.setHeader('x-request-id', req.id);

  next();
};

/**
 * Middleware for performance monitoring
 * Tracks response times and identifies slow requests
 */
export const performanceMonitoringMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  const start = process.hrtime.bigint();

  // Intercept res.send to capture response timing
  const originalSend = res.send;
  res.send = function (data: any) {
    const end = process.hrtime.bigint();
    const duration = Number(end - start) / 1_000_000; // Convert to milliseconds

    res.responseTime = duration;

    // Add response time to headers
    res.setHeader('x-response-time', `${duration.toFixed(2)}ms`);

    // Log slow requests (threshold: 1000ms)
    if (duration > 1000) {
      logger.warn('Slow HTTP request', {
        requestId: req.id,
        method: req.method,
        path: req.path,
        statusCode: res.statusCode,
        duration: `${duration.toFixed(2)}ms`,
        userId: req.userId,
      });

      monitoring.addBreadcrumb(
        `Slow request: ${duration.toFixed(2)}ms`,
        'performance',
        'warning',
        {
          method: req.method,
          path: req.path,
          duration: duration.toFixed(2),
        }
      );
    }

    // Log errors (5xx status codes)
    if (res.statusCode >= 500) {
      logger.error('Server error response', {
        requestId: req.id,
        method: req.method,
        path: req.path,
        statusCode: res.statusCode,
        duration: `${duration.toFixed(2)}ms`,
      });

      monitoring.addBreadcrumb(
        `Server error: ${res.statusCode}`,
        'error',
        'error',
        {
          method: req.method,
          path: req.path,
          statusCode: res.statusCode,
        }
      );
    }

    // Log info level for all other requests
    if (duration < 1000 && res.statusCode < 400) {
      logger.http('HTTP request completed', {
        requestId: req.id,
        method: req.method,
        path: req.path,
        statusCode: res.statusCode,
        duration: `${duration.toFixed(2)}ms`,
        userId: req.userId,
      });
    }

    return originalSend.call(this, data);
  };

  next();
};

/**
 * Middleware for error tracking and logging
 * Captures all errors and sends them to Sentry
 */
export const errorTrackingMiddleware = (err: Error, req: Request, res: Response, next: NextFunction): void => {
  logger.error('Unhandled error', {
    requestId: req.id,
    method: req.method,
    path: req.path,
    error: err.message,
    stack: err.stack,
    userId: req.userId,
  });

  // Capture in Sentry with context
  monitoring.captureException(err, {
    requestId: req.id,
    method: req.method,
    path: req.path,
    userId: req.userId,
    tenantId: req.tenantId,
  });

  // Add breadcrumb
  monitoring.addBreadcrumb(
    `Error: ${err.message}`,
    'error',
    'error',
    {
      method: req.method,
      path: req.path,
    }
  );

  // Send error response if not already sent
  if (!res.headersSent) {
    res.status(500).json({
      error: 'Internal Server Error',
      requestId: req.id,
      message: process.env.NODE_ENV === 'development' ? err.message : undefined,
    });
  }

  next(err);
};

/**
 * Middleware to set user context for monitoring
 * Call this after authentication middleware to set user ID
 */
export const setMonitoringUserContextMiddleware = (req: Request, _res: Response, next: NextFunction): void => {
  if (req.userId) {
    monitoring.setUserContext(req.userId);
    req.userId = req.userId;
  }

  next();
};

/**
 * Middleware to log security-related events
 * Track authentication failures, authorization failures, etc.
 */
export const securityEventLoggingMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  // Capture failed authentication attempts (401 responses)
  const originalSend = res.send;
  res.send = function (data: any) {
    if (res.statusCode === 401) {
      monitoring.logSecurityEvent('Authentication Failed', 'medium', {
        requestId: req.id,
        method: req.method,
        path: req.path,
        ip: req.ip,
      });
    }

    if (res.statusCode === 403) {
      monitoring.logSecurityEvent('Authorization Failed', 'medium', {
        requestId: req.id,
        method: req.method,
        path: req.path,
        userId: req.userId,
      });
    }

    return originalSend.call(this, data);
  };

  next();
};

/**
 * Middleware to periodically log system health metrics
 */
export const systemHealthLoggingMiddleware = (interval: number = 60000) => {
  // Log health metrics periodically
  setInterval(() => {
    const health = monitoring.getHealthStatus();

    logger.info('System health check', {
      status: health.status,
      uptime: `${Math.round(health.uptime)}s`,
      memoryUsed: `${Math.round(health.memory.heapUsed / 1024 / 1024)}MB`,
      memoryTotal: `${Math.round(health.memory.heapTotal / 1024 / 1024)}MB`,
      errorRate: `${health.metrics.errorRate.toFixed(2)}%`,
      avgResponseTime: `${health.metrics.averageResponseTime}ms`,
      totalRequests: health.metrics.totalRequests,
    });
  }, interval);

  return (_req: Request, _res: Response, next: NextFunction) => {
    next();
  };
};
