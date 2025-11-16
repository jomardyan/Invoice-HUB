import rateLimit from 'express-rate-limit';
import config from '@/config';

// Disable rate limiting in development
const isDevelopment = process.env.NODE_ENV === 'development' || !process.env.NODE_ENV;

export const apiLimiter = isDevelopment
  ? (_req: any, _res: any, next: any) => next() // No-op middleware in dev
  : rateLimit({
      windowMs: config.rateLimiting.windowMs,
      max: config.rateLimiting.maxRequests,
      message: 'Too many requests from this IP, please try again later.',
      standardHeaders: true,
      legacyHeaders: false,
    });

export const authLimiter = isDevelopment
  ? (_req: any, _res: any, next: any) => next() // No-op middleware in dev
  : rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 5, // 5 attempts
      message: 'Too many login attempts, please try again after 15 minutes.',
      standardHeaders: true,
      legacyHeaders: false,
      skipSuccessfulRequests: true,
    });
