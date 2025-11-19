/**
 * Base Application Error Class
 * All custom errors should extend this class
 */
export class AppError extends Error {
  public readonly code: string;
  public readonly statusCode: number;
  public readonly details?: Record<string, any>;
  public readonly traceId?: string;
  public readonly isOperational: boolean;
  public readonly timestamp: Date;

  constructor(
    code: string,
    statusCode: number,
    message: string,
    details?: Record<string, any>,
    traceId?: string,
    isOperational = true
  ) {
    super(message);
    
    // Maintain proper stack trace for where error was thrown (V8 only)
    Object.setPrototypeOf(this, new.target.prototype);
    Error.captureStackTrace(this, this.constructor);

    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
    this.traceId = traceId;
    this.isOperational = isOperational;
    this.timestamp = new Date();
    this.name = this.constructor.name;
  }

  /**
   * Convert error to JSON format for API responses
   */
  toJSON() {
    return {
      success: false,
      error: {
        code: this.code,
        message: this.message,
        ...(this.details && { details: this.details }),
        ...(this.traceId && { traceId: this.traceId }),
        timestamp: this.timestamp.toISOString(),
      },
    };
  }
}

/**
 * Error Severity Levels
 */
export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

/**
 * Error Categories for better classification
 */
export enum ErrorCategory {
  VALIDATION = 'validation',
  AUTHENTICATION = 'authentication',
  AUTHORIZATION = 'authorization',
  NOT_FOUND = 'not_found',
  CONFLICT = 'conflict',
  BUSINESS_LOGIC = 'business_logic',
  INTEGRATION = 'integration',
  DATABASE = 'database',
  NETWORK = 'network',
  INTERNAL = 'internal',
}
