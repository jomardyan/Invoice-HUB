import winston from 'winston';
import config from '@/config';

const logLevels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

const logColors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'white',
};

winston.addColors(logColors);

/**
 * Structured logging format for better log aggregation
 * Includes timestamp, level, service name, request context, and metadata
 */
const structuredFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  winston.format.errors({ stack: true }),
  winston.format.json(),
  winston.format.printf((info: any) => {
    const { timestamp, level, message, service = 'invoice-hub', requestId, userId, tenantId } = info;
    const meta = { ...info };
    delete meta.timestamp;
    delete meta.level;
    delete meta.message;
    delete meta.service;
    delete meta.requestId;
    delete meta.userId;
    delete meta.tenantId;

    // Build structured log entry
    const logEntry = {
      timestamp,
      level,
      service,
      message,
      ...(requestId && { requestId }),
      ...(userId && { userId }),
      ...(tenantId && { tenantId }),
      ...(Object.keys(meta).length > 0 && { metadata: meta }),
    };

    return JSON.stringify(logEntry);
  })
);

/**
 * Console format for development - colorized and human-readable
 */
const consoleFormat = winston.format.combine(
  winston.format.timestamp({ format: 'HH:mm:ss' }),
  winston.format.colorize({ all: true }),
  winston.format.printf((info: any) => {
    const { timestamp, level, message } = info;
    const meta = { ...info };
    delete meta.timestamp;
    delete meta.level;
    delete meta.message;
    const metaString = Object.keys(meta).length ? '\n' + JSON.stringify(meta, null, 2) : '';
    return `${timestamp as string} [${level}]: ${message as string}${metaString}`;
  })
);

// Console transport for development/debugging
const consoleTransport = new winston.transports.Console({
  format: config.monitoring.logLevel === 'debug' ? consoleFormat : structuredFormat,
});

// File transports for production
const transports: winston.transport[] = [consoleTransport];

// Add file transports in production or when explicitly configured
if (config.env !== 'test') {
  transports.push(
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
      format: structuredFormat,
      maxsize: 10485760, // 10MB
      maxFiles: 5,
    }),
    new winston.transports.File({
      filename: 'logs/combined.log',
      format: structuredFormat,
      maxsize: 10485760, // 10MB
      maxFiles: 5,
    })
  );

  // Add separate file for performance/slow requests
  transports.push(
    new winston.transports.File({
      filename: 'logs/performance.log',
      level: 'warn',
      format: structuredFormat,
      maxsize: 5242880, // 5MB
      maxFiles: 3,
    })
  );
}

const logger = winston.createLogger({
  level: config.monitoring.logLevel,
  levels: logLevels,
  defaultMeta: { service: 'invoice-hub' },
  transports,
  exitOnError: false,
});

/**
 * Logger with context methods for structured logging
 */
export const createContextLogger = (requestId?: string, userId?: string, tenantId?: string) => {
  return {
    error: (message: string, meta?: any) =>
      logger.error(message, { requestId, userId, tenantId, ...meta }),
    warn: (message: string, meta?: any) =>
      logger.warn(message, { requestId, userId, tenantId, ...meta }),
    info: (message: string, meta?: any) =>
      logger.info(message, { requestId, userId, tenantId, ...meta }),
    http: (message: string, meta?: any) =>
      logger.http(message, { requestId, userId, tenantId, ...meta }),
    debug: (message: string, meta?: any) =>
      logger.debug(message, { requestId, userId, tenantId, ...meta }),
  };
};

export default logger;
