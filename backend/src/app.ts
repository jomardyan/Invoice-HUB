import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import config from './config';
import { AppDataSource } from './config/database';
import RedisClient from './config/redis';
import logger from './utils/logger';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { apiLimiter } from './middleware/rateLimiter';
import authRoutes from './routes/auth';
import companiesRoutes from './routes/companies';
import customersRoutes from './routes/customers';
import productsRoutes from './routes/products';
import invoicesRoutes from './routes/invoices';
import templatesRoutes from './routes/templates';
import schedulerRoutes from './routes/scheduler';
import notificationsRoutes from './routes/notifications';
import SchedulerService from './services/SchedulerService';

class App {
  public app: Application;

  constructor() {
    this.app = express();
    this.initializeMiddlewares();
    this.initializeRoutes();
    this.initializeErrorHandling();
  }

  private initializeMiddlewares(): void {
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
  }

  private initializeRoutes(): void {
    // Health check
    this.app.get('/health', (_req, res) => {
      res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        environment: config.env,
      });
    });

    // API routes
    this.app.use(`/api/${config.apiVersion}/auth`, authRoutes);
    this.app.use(`/api/${config.apiVersion}`, companiesRoutes);
    this.app.use(`/api/${config.apiVersion}`, customersRoutes);
    this.app.use(`/api/${config.apiVersion}`, productsRoutes);
    this.app.use(`/api/${config.apiVersion}`, invoicesRoutes);
    this.app.use(`/api/${config.apiVersion}`, templatesRoutes);
    this.app.use(`/api/${config.apiVersion}`, schedulerRoutes);
    this.app.use(`/api/${config.apiVersion}`, notificationsRoutes);
  }

  private initializeErrorHandling(): void {
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
