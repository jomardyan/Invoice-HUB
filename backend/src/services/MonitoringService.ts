import * as Sentry from '@sentry/node';
import winston from 'winston';
import { Request, Response, NextFunction } from 'express';

/**
 * Monitoring and Error Tracking Service
 * Integrates Sentry for error tracking and performance monitoring
 */
export class MonitoringService {
  private static instance: MonitoringService;
  private logger: winston.Logger;
  private metrics: {
    requests: number;
    errors: number;
    responseTime: number[];
  };

  private constructor(logger: winston.Logger) {
    this.logger = logger;
    this.metrics = {
      requests: 0,
      errors: 0,
      responseTime: [],
    };
  }

  /**
   * Initialize Sentry for error tracking and performance monitoring
   */
  static initializeSentry(
    dsn: string,
    environment: string,
    tracesSampleRate: number = 0.1,
    _profilesSampleRate: number = 0.1
  ): void {
    Sentry.init({
      dsn,
      environment,
      tracesSampleRate,
      integrations: [
        Sentry.httpIntegration(),
        Sentry.onUncaughtExceptionIntegration(),
        Sentry.onUnhandledRejectionIntegration({
          mode: 'strict',
        }),
      ],
      // Attach stack trace to all messages
      attachStacktrace: true,
      // Capture breadcrumbs
      maxBreadcrumbs: 50,
      // Ignore certain errors
      ignoreErrors: [
        'Network request failed',
        'fetch failed',
        'cancelled',
      ],
    });

    console.log(`✓ Sentry initialized for environment: ${environment}`);
  }

  /**
   * Get or create singleton instance
   */
  static getInstance(logger?: winston.Logger): MonitoringService {
    if (!MonitoringService.instance && logger) {
      MonitoringService.instance = new MonitoringService(logger);
    }
    return MonitoringService.instance;
  }

  /**
   * Middleware for request/response monitoring
   */
  requestMonitoringMiddleware() {
    const self = this;
    return (req: Request, res: Response, next: NextFunction) => {
      const startHrTime = process.hrtime();

      // Track response finish
      const originalSend = res.send;
      res.send = function (data: any) {
        const hrTime = process.hrtime(startHrTime);
        const responseTime = hrTime[0] * 1000 + hrTime[1] / 1000000; // Convert to ms

        res.responseTime = responseTime;

        // Record metrics
        self.metrics.requests++;
        self.metrics.responseTime.push(responseTime);

        // Log slow requests (> 1 second)
        if (responseTime > 1000) {
          self.logger.warn('Slow request detected', {
            method: req.method,
            path: req.path,
            statusCode: res.statusCode,
            responseTime: `${responseTime.toFixed(2)}ms`,
          });
        }

        // Record 5xx errors
        if (res.statusCode >= 500) {
          self.metrics.errors++;
          self.logger.error('Server error', {
            method: req.method,
            path: req.path,
            statusCode: res.statusCode,
            responseTime: `${responseTime.toFixed(2)}ms`,
          });
        }

        return originalSend.call(this, data);
      };

      next();
    };
  }

  /**
   * Middleware for Sentry request/response tracking
   */
  sentryRequestHandler() {
    return (_req: Request, _res: Response, next: NextFunction) => {
      Sentry.captureMessage('HTTP Request', 'debug');
      next();
    };
  }

  /**
   * Middleware for Sentry error handler
   */
  sentryErrorHandler() {
    return (_err: Error, _req: Request, _res: Response, next: NextFunction) => {
      this.logger.error('Sentry error handler triggered');
      next(_err);
    };
  }

  /**
   * Capture exception and log it
   */
  captureException(error: unknown, context?: Record<string, any>): void {
    const err = error instanceof Error ? error : new Error(String(error));
    this.logger.error('Exception captured', {
      error: err.message,
      stack: err.stack,
      context,
    });

    Sentry.captureException(err, {
      contexts: {
        application: context,
      },
    });
  }

  /**
   * Capture message for logging
   */
  captureMessage(message: string, level: 'info' | 'warning' | 'error' = 'info', tags?: Record<string, string>): void {
    const sentryLevel = level === 'warning' ? 'warning' : level;
    this.logger.log(level, message, { tags });

    Sentry.captureMessage(message, sentryLevel);

    if (tags) {
      Sentry.setTags(tags);
    }
  }

  /**
   * Set user context for error tracking
   */
  setUserContext(userId: string, email?: string, username?: string): void {
    Sentry.setUser({
      id: userId,
      email,
      username,
    });
  }

  /**
   * Clear user context
   */
  clearUserContext(): void {
    Sentry.setUser(null);
  }

  /**
   * Add breadcrumb for tracking request flow
   */
  addBreadcrumb(
    message: string,
    category: string,
    level: 'info' | 'warning' | 'error' = 'info',
    data?: Record<string, any>
  ): void {
    Sentry.addBreadcrumb({
      message,
      category,
      level: level as Sentry.SeverityLevel,
      data,
    });

    this.logger.debug(`Breadcrumb: ${category}`, { message, data });
  }

  /**
   * Start performance monitoring span
   */
  startSpan(operationName: string, description: string): Sentry.Span {
    return Sentry.startSpan(
      {
        op: operationName,
        name: description,
      },
      (span: Sentry.Span) => span
    );
  }

  /**
   * Get current metrics
   */
  getMetrics() {
    const avgResponseTime = this.metrics.responseTime.length > 0
      ? this.metrics.responseTime.reduce((a, b) => a + b, 0) / this.metrics.responseTime.length
      : 0;

    return {
      totalRequests: this.metrics.requests,
      totalErrors: this.metrics.errors,
      errorRate: this.metrics.requests > 0 ? (this.metrics.errors / this.metrics.requests) * 100 : 0,
      averageResponseTime: avgResponseTime.toFixed(2),
      medianResponseTime: this.getMedian(this.metrics.responseTime).toFixed(2),
      p95ResponseTime: this.getPercentile(this.metrics.responseTime, 95).toFixed(2),
      p99ResponseTime: this.getPercentile(this.metrics.responseTime, 99).toFixed(2),
    };
  }

  /**
   * Reset metrics
   */
  resetMetrics(): void {
    this.metrics = {
      requests: 0,
      errors: 0,
      responseTime: [],
    };
    this.logger.info('Metrics reset');
  }

  /**
   * Health check endpoint data
   */
  getHealthStatus(): {
    status: 'healthy' | 'degraded' | 'unhealthy';
    uptime: number;
    memory: NodeJS.MemoryUsage;
    metrics: {
      totalRequests: number;
      totalErrors: number;
      errorRate: number;
      averageResponseTime: string;
      medianResponseTime: string;
      p95ResponseTime: string;
      p99ResponseTime: string;
    };
  } {
    const metrics = this.getMetrics();
    const errorRate = metrics.errorRate as unknown as number;

    let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
    if (errorRate > 10) status = 'unhealthy';
    else if (errorRate > 5) status = 'degraded';

    return {
      status,
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      metrics,
    };
  }

  /**
   * Calculate median from array of numbers
   */
  private getMedian(arr: number[]): number {
    if (arr.length === 0) return 0;
    const sorted = [...arr].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
  }

  /**
   * Calculate percentile from array of numbers
   */
  private getPercentile(arr: number[], percentile: number): number {
    if (arr.length === 0) return 0;
    const sorted = [...arr].sort((a, b) => a - b);
    const index = Math.ceil((percentile / 100) * sorted.length) - 1;
    return sorted[index] || 0;
  }

  /**
   * Log database operation metrics
   */
  logDatabaseOperation(
    operation: string,
    duration: number,
    query?: string,
    success: boolean = true
  ): void {
    this.logger.info('Database operation', {
      operation,
      duration: `${duration.toFixed(2)}ms`,
      query: query ? query.substring(0, 200) : undefined,
      success,
    });

    if (!success) {
      this.captureMessage(`Database ${operation} failed`, 'error', {
        operation,
      });
    }

    if (duration > 5000) {
      this.logger.warn('Slow database operation', {
        operation,
        duration: `${duration.toFixed(2)}ms`,
      });
    }
  }

  /**
   * Log external API call metrics
   */
  logExternalApiCall(
    apiName: string,
    method: string,
    endpoint: string,
    duration: number,
    statusCode: number,
    success: boolean = true
  ): void {
    this.logger.info('External API call', {
      apiName,
      method,
      endpoint,
      duration: `${duration.toFixed(2)}ms`,
      statusCode,
      success,
    });

    if (!success) {
      this.captureMessage(`API call to ${apiName} failed`, 'warning', {
        apiName,
        statusCode: statusCode.toString(),
      });
    }

    if (duration > 30000) {
      this.logger.warn('Slow external API call', {
        apiName,
        endpoint,
        duration: `${duration.toFixed(2)}ms`,
      });
    }
  }

  /**
   * Log business event
   */
  logBusinessEvent(eventName: string, data?: Record<string, any>): void {
    this.logger.info(`Business event: ${eventName}`, data);

    this.addBreadcrumb(eventName, 'business-event', 'info', data);
  }

  /**
   * Log security-related event
   */
  logSecurityEvent(eventName: string, severity: 'low' | 'medium' | 'high' = 'medium', data?: Record<string, any>): void {
    const level = severity === 'high' ? 'error' : 'warning';
    this.logger.log(level, `Security event: ${eventName}`, data);

    this.captureMessage(`Security: ${eventName}`, level, {
      severity,
      ...data,
    });
  }
}
