import { AppError } from './AppError';
import { ZodError } from 'zod';

// ============================================
// INTEGRATION ERRORS
// ============================================

export class AllegroIntegrationError extends AppError {
  constructor(message: string, details?: Record<string, any>, traceId?: string) {
    super(
      'ALLEGRO_INTEGRATION_ERROR',
      502,
      `Allegro API error: ${message}`,
      details,
      traceId
    );
  }
}

export class BaseLinkerIntegrationError extends AppError {
  constructor(message: string, details?: Record<string, any>, traceId?: string) {
    super(
      'BASELINKER_INTEGRATION_ERROR',
      502,
      `BaseLinker API error: ${message}`,
      details,
      traceId
    );
  }
}

export class KSeFIntegrationError extends AppError {
  constructor(message: string, details?: Record<string, any>, traceId?: string) {
    super(
      'KSEF_INTEGRATION_ERROR',
      502,
      `KSeF e-invoicing error: ${message}`,
      details,
      traceId
    );
  }
}

export class EmailDeliveryError extends AppError {
  constructor(recipient: string, reason: string, traceId?: string) {
    super(
      'EMAIL_DELIVERY_FAILED',
      500,
      `Failed to send email to ${recipient}: ${reason}`,
      { recipient, reason },
      traceId
    );
  }
}

export class SMSDeliveryError extends AppError {
  constructor(phoneNumber: string, reason: string, traceId?: string) {
    super(
      'SMS_DELIVERY_FAILED',
      500,
      `Failed to send SMS to ${phoneNumber}: ${reason}`,
      { phoneNumber, reason },
      traceId
    );
  }
}

export class WebhookDeliveryError extends AppError {
  constructor(url: string, statusCode: number, traceId?: string) {
    super(
      'WEBHOOK_DELIVERY_FAILED',
      502,
      `Webhook delivery to ${url} failed with status ${statusCode}`,
      { url, statusCode },
      traceId
    );
  }
}

// ============================================
// AUTHENTICATION & AUTHORIZATION ERRORS
// ============================================

export class UnauthorizedError extends AppError {
  constructor(message = 'Authentication required', traceId?: string) {
    super(
      'UNAUTHORIZED',
      401,
      message,
      undefined,
      traceId
    );
  }
}

export class ForbiddenError extends AppError {
  constructor(resource?: string, action?: string, traceId?: string) {
    const message = resource && action
      ? `Access forbidden: insufficient permissions to ${action} ${resource}`
      : 'Access forbidden: insufficient permissions';
    
    super(
      'FORBIDDEN',
      403,
      message,
      { resource, action },
      traceId
    );
  }
}

export class InvalidTokenError extends AppError {
  constructor(reason?: string, traceId?: string) {
    super(
      'INVALID_TOKEN',
      401,
      `Invalid or expired authentication token${reason ? `: ${reason}` : ''}`,
      { reason },
      traceId
    );
  }
}

export class TokenExpiredError extends AppError {
  constructor(traceId?: string) {
    super(
      'TOKEN_EXPIRED',
      401,
      'Authentication token has expired. Please log in again.',
      undefined,
      traceId
    );
  }
}

export class InvalidCredentialsError extends AppError {
  constructor(traceId?: string) {
    super(
      'INVALID_CREDENTIALS',
      401,
      'Invalid email or password',
      undefined,
      traceId
    );
  }
}

export class AccountLockedError extends AppError {
  constructor(reason: string, traceId?: string) {
    super(
      'ACCOUNT_LOCKED',
      403,
      `Account is locked: ${reason}`,
      { reason },
      traceId
    );
  }
}

// ============================================
// VALIDATION ERRORS
// ============================================

export class ValidationError extends AppError {
  constructor(message: string, details?: Record<string, any>, traceId?: string) {
    super(
      'VALIDATION_ERROR',
      400,
      message,
      details,
      traceId
    );
  }

  /**
   * Create ValidationError from Zod error
   */
  static fromZodError(zodError: ZodError, traceId?: string): ValidationError {
    const fieldErrors: Record<string, string[]> = {};
    
    zodError.errors.forEach((error) => {
      const field = error.path.join('.');
      if (!fieldErrors[field]) {
        fieldErrors[field] = [];
      }
      fieldErrors[field].push(error.message);
    });

    return new ValidationError(
      'Request validation failed',
      { fields: fieldErrors },
      traceId
    );
  }
}

export class InvalidInputError extends AppError {
  constructor(field: string, message: string, traceId?: string) {
    super(
      'INVALID_INPUT',
      400,
      `Invalid ${field}: ${message}`,
      { field },
      traceId
    );
  }
}

export class MissingRequiredFieldError extends AppError {
  constructor(field: string, traceId?: string) {
    super(
      'MISSING_REQUIRED_FIELD',
      400,
      `Required field '${field}' is missing`,
      { field },
      traceId
    );
  }
}

// ============================================
// RATE LIMITING ERRORS
// ============================================

export class RateLimitExceededError extends AppError {
  constructor(limit: number, windowMs: number, retryAfter: number, traceId?: string) {
    const windowMinutes = Math.ceil(windowMs / 60000);
    super(
      'RATE_LIMIT_EXCEEDED',
      429,
      `Rate limit exceeded: ${limit} requests per ${windowMinutes} minute(s). Retry after ${retryAfter} seconds.`,
      { limit, windowMs, retryAfter },
      traceId
    );
  }
}

// ============================================
// DATABASE ERRORS
// ============================================

export class DatabaseError extends AppError {
  constructor(operation: string, details?: Record<string, any>, traceId?: string) {
    super(
      'DATABASE_ERROR',
      500,
      `Database operation failed: ${operation}`,
      details,
      traceId,
      false // Not operational - programmer error
    );
  }
}

export class DatabaseConnectionError extends AppError {
  constructor(message: string, traceId?: string) {
    super(
      'DATABASE_CONNECTION_ERROR',
      503,
      `Database connection error: ${message}`,
      undefined,
      traceId,
      false
    );
  }
}

export class DuplicateRecordError extends AppError {
  constructor(entity: string, field: string, value: any, traceId?: string) {
    super(
      'DUPLICATE_RECORD',
      409,
      `${entity} with ${field} '${value}' already exists`,
      { entity, field, value },
      traceId
    );
  }
}

// ============================================
// GENERAL ERRORS
// ============================================

export class NotFoundError extends AppError {
  constructor(resource: string, identifier?: string, traceId?: string) {
    const message = identifier
      ? `${resource} with identifier '${identifier}' not found`
      : `${resource} not found`;
    
    super(
      'NOT_FOUND',
      404,
      message,
      { resource, identifier },
      traceId
    );
  }
}

export class ConflictError extends AppError {
  constructor(message: string, details?: Record<string, any>, traceId?: string) {
    super(
      'CONFLICT',
      409,
      message,
      details,
      traceId
    );
  }
}

export class InternalServerError extends AppError {
  constructor(message = 'An unexpected error occurred', details?: Record<string, any>, traceId?: string) {
    super(
      'INTERNAL_SERVER_ERROR',
      500,
      message,
      details,
      traceId,
      false // Not operational
    );
  }
}

export class ServiceUnavailableError extends AppError {
  constructor(service: string, traceId?: string) {
    super(
      'SERVICE_UNAVAILABLE',
      503,
      `Service ${service} is temporarily unavailable`,
      { service },
      traceId
    );
  }
}

export class ExternalServiceError extends AppError {
  constructor(service: string, message: string, details?: Record<string, any>, traceId?: string) {
    super(
      'EXTERNAL_SERVICE_ERROR',
      502,
      `External service ${service} error: ${message}`,
      { service, ...details },
      traceId
    );
  }
}
