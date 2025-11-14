import { Router, Request, Response } from 'express';
import { MonitoringService } from '@/services/MonitoringService';
import logger from '@/utils/logger';
import { AppDataSource } from '@/config/database';
import redis from '@/config/redis';

const router = Router();
const monitoring = MonitoringService.getInstance(logger);

/**
 * GET /api/health
 * Basic health check - used by load balancers and deployment checks
 */
router.get('/', (_req: Request, res: Response) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
  });
});

/**
 * GET /api/health/live
 * Kubernetes liveness probe - indicates if the process is still running
 */
router.get('/live', (_req: Request, res: Response) => {
  res.status(200).json({
    status: 'alive',
    timestamp: new Date().toISOString(),
  });
});

/**
 * GET /api/health/ready
 * Kubernetes readiness probe - indicates if the service is ready to handle traffic
 */
router.get('/ready', async (_req: Request, res: Response) => {
  try {
    // Check database connection
    if (!AppDataSource.isInitialized) {
      throw new Error('Database not initialized');
    }
    await AppDataSource.query('SELECT NOW()');

    // Check Redis connection
    const redisClient = redis.getInstance().getClient();
    await redisClient.ping();

    res.status(200).json({
      status: 'ready',
      timestamp: new Date().toISOString(),
      checks: {
        database: 'ok',
        redis: 'ok',
      },
    });
  } catch (error) {
    logger.error('Readiness check failed', { error: error instanceof Error ? error.message : String(error) });

    res.status(503).json({
      status: 'not-ready',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /api/health/detailed
 * Detailed health check with metrics and performance data
 * Requires authentication
 */
router.get('/detailed', async (_req: Request, res: Response) => {
  try {
    const health = monitoring.getHealthStatus();

    res.status(health.status === 'healthy' ? 200 : 503).json({
      ...health,
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
    });
  } catch (error) {
    logger.error('Detailed health check failed', { error: error instanceof Error ? error.message : String(error) });

    res.status(500).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /api/health/metrics
 * Application metrics endpoint
 */
router.get('/metrics', (_req: Request, res: Response) => {
  try {
    const metrics = monitoring.getMetrics();
    const memoryUsage = process.memoryUsage();

    res.status(200).json({
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: {
        heapUsed: `${Math.round(memoryUsage.heapUsed / 1024 / 1024)}MB`,
        heapTotal: `${Math.round(memoryUsage.heapTotal / 1024 / 1024)}MB`,
        external: `${Math.round(memoryUsage.external / 1024 / 1024)}MB`,
        rss: `${Math.round(memoryUsage.rss / 1024 / 1024)}MB`,
      },
      requests: metrics.totalRequests,
      errors: metrics.totalErrors,
      errorRate: `${metrics.errorRate.toFixed(2)}%`,
      responseTime: {
        average: `${metrics.averageResponseTime}ms`,
        median: `${metrics.medianResponseTime}ms`,
        p95: `${metrics.p95ResponseTime}ms`,
        p99: `${metrics.p99ResponseTime}ms`,
      },
    });
  } catch (error) {
    logger.error('Metrics retrieval failed', { error: error instanceof Error ? error.message : String(error) });

    res.status(500).json({
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * POST /api/health/reset-metrics
 * Reset metrics (typically called during deployments or for testing)
 */
router.post('/reset-metrics', (_req: Request, res: Response) => {
  try {
    monitoring.resetMetrics();

    res.status(200).json({
      message: 'Metrics reset successfully',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Metrics reset failed', { error: error instanceof Error ? error.message : String(error) });

    res.status(500).json({
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /api/health/version
 * Application version information
 */
router.get('/version', (_req: Request, res: Response) => {
  const pkg = require('../../../package.json');

  res.status(200).json({
    name: pkg.name,
    version: pkg.version,
    description: pkg.description,
    environment: process.env.NODE_ENV || 'development',
    nodeVersion: process.version,
    timestamp: new Date().toISOString(),
  });
});

export default router;
