import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import swaggerUi from 'swagger-ui-express';
import config from './config';
import { swaggerSpec } from './config/swagger';
import { AppDataSource } from './config/database';
import RedisClient from './config/redis';
import logger from './utils/logger';
import { MonitoringService } from './services/MonitoringService';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { apiLimiter } from './middleware/rateLimiter';
import {
  requestIdMiddleware,
  performanceMonitoringMiddleware,
  errorTrackingMiddleware,
  setMonitoringUserContextMiddleware,
  securityEventLoggingMiddleware,
  systemHealthLoggingMiddleware,
} from './middleware/monitoring';
import authRoutes from './routes/auth';
import companiesRoutes from './routes/companies';
import customersRoutes from './routes/customers';
import productsRoutes from './routes/products';
import invoicesRoutes from './routes/invoices';
import templatesRoutes from './routes/templates';
import schedulerRoutes from './routes/scheduler';
import notificationsRoutes from './routes/notifications';
import reportsRoutes from './routes/reports';
import webhooksRoutes from './routes/webhooks';
import paymentsRoutes from './routes/payments';
import allegroRoutes from './routes/allegro';
import healthRoutes from './routes/health';
import adminRoutes from './routes/admin';
import SchedulerService from './services/SchedulerService';

class App {
  public app: Application;
  private monitoring: MonitoringService;

  constructor() {
    this.app = express();
    this.monitoring = MonitoringService.getInstance(logger);
    this.initializeMonitoring();
    this.initializeMiddlewares();
    this.initializeRoutes();
    this.initializeErrorHandling();
  }

  private initializeMonitoring(): void {
    // Initialize Sentry if DSN is provided
    if (config.monitoring.sentryDsn) {
      MonitoringService.initializeSentry(
        config.monitoring.sentryDsn,
        config.env,
        config.env === 'production' ? 0.1 : 1.0, // Higher sample rate in development
        config.env === 'production' ? 0.05 : 0.1
      );
      logger.info('Sentry monitoring initialized');
    }
  }

  private initializeMiddlewares(): void {
    // Request tracking and monitoring (must be early)
    this.app.use(requestIdMiddleware);
    this.app.use(this.monitoring.sentryRequestHandler());
    this.app.use(performanceMonitoringMiddleware);
    this.app.use(this.monitoring.requestMonitoringMiddleware());

    // Security
    this.app.use(helmet());
    this.app.use(cors());

    // Parsing
    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: true }));

    // Compression
    this.app.use(compression());

    // Logging
    if (config.env === 'development') {
      this.app.use(morgan('dev'));
    } else {
      this.app.use(
        morgan('combined', {
          stream: {
            write: (message: string) => logger.http(message.trim()),
          },
        })
      );
    }

    // Rate limiting
    this.app.use(`/api/${config.apiVersion}`, apiLimiter);

    // Security event logging
    this.app.use(securityEventLoggingMiddleware);

    // Set monitoring user context (after auth middleware)
    this.app.use(setMonitoringUserContextMiddleware);

    // System health logging (every 60 seconds)
    this.app.use(systemHealthLoggingMiddleware(60000));
  }

  private initializeRoutes(): void {
    // Health check routes
    this.app.use('/api/health', healthRoutes);

    // API Documentation
    this.app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
      customCss: '.swagger-ui .topbar { display: none }',
      customSiteTitle: 'Invoice-HUB API Documentation',
    }));

    // Swagger JSON
    this.app.get('/api-docs.json', (_req, res) => {
      res.setHeader('Content-Type', 'application/json');
      res.send(swaggerSpec);
    });

    // API routes
    this.app.use(`/api/${config.apiVersion}/auth`, authRoutes);
    this.app.use(`/api/${config.apiVersion}/admin`, adminRoutes);
    this.app.use(`/api/${config.apiVersion}`, companiesRoutes);
    this.app.use(`/api/${config.apiVersion}`, customersRoutes);
    this.app.use(`/api/${config.apiVersion}`, productsRoutes);
    this.app.use(`/api/${config.apiVersion}`, invoicesRoutes);
    this.app.use(`/api/${config.apiVersion}`, templatesRoutes);
    this.app.use(`/api/${config.apiVersion}`, schedulerRoutes);
    this.app.use(`/api/${config.apiVersion}`, notificationsRoutes);
    this.app.use(`/api/${config.apiVersion}/reports`, reportsRoutes);
    this.app.use(`/api/${config.apiVersion}/webhooks`, webhooksRoutes);
    this.app.use(`/api/${config.apiVersion}/payments`, paymentsRoutes);
    this.app.use(`/api/${config.apiVersion}/allegro`, allegroRoutes);
  }

  private initializeErrorHandling(): void {
    // Sentry error handler (must be before other error handling)
    this.app.use(this.monitoring.sentryErrorHandler());

    // Custom error tracking
    this.app.use(errorTrackingMiddleware);

    // Standard error handling
    this.app.use(notFoundHandler);
    this.app.use(errorHandler);
  }

  public async start(): Promise<void> {
    try {
      // Initialize Database
      await AppDataSource.initialize();
      logger.info('Database connection established');

      // Initialize Redis
      const redis = RedisClient.getInstance();
      await redis.connect();
      logger.info('Redis connection established');

      // Initialize and start scheduler
      await SchedulerService.initialize();
      await SchedulerService.start();
      logger.info('Scheduler service started');

      // Start server
      this.app.listen(config.port, () => {
        logger.info(`Server running on port ${config.port} in ${config.env} mode`);
        logger.info('Health checks available at:');
        logger.info('  - /api/health (basic)');
        logger.info('  - /api/health/live (liveness probe)');
        logger.info('  - /api/health/ready (readiness probe)');
        logger.info('  - /api/health/detailed (full status)');
        logger.info('  - /api/health/metrics (performance metrics)');
      });
    } catch (error) {
      logger.error('Failed to start application:', error);
      process.exit(1);
    }
  }

  public async stop(): Promise<void> {
    try {
      // Stop scheduler
      await SchedulerService.stop();
      logger.info('Scheduler service stopped');

      // Close database connection
      if (AppDataSource.isInitialized) {
        await AppDataSource.destroy();
        logger.info('Database connection closed');
      }

      // Close Redis connection
      const redis = RedisClient.getInstance();
      await redis.disconnect();
      logger.info('Redis connection closed');
    } catch (error) {
      logger.error('Error during shutdown:', error);
      throw error;
    }
  }
}

export default App;
