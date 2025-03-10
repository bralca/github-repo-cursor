/**
 * Base application error class with additional metadata support
 */
export class AppError extends Error {
  statusCode: number;
  code: string;
  details?: any;
  isOperational: boolean;

  constructor(
    message: string,
    statusCode: number = 500,
    code: string = 'INTERNAL_ERROR',
    details?: any,
    isOperational: boolean = true
  ) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    this.isOperational = isOperational;
    Error.captureStackTrace(this, this.constructor);
    this.name = this.constructor.name;
  }

  /**
   * Serializes the error for consistent response formatting
   */
  toJSON() {
    return {
      success: false,
      error: {
        message: this.message,
        code: this.code,
        ...(this.details && { details: this.details }),
      },
    };
  }
}

/**
 * Error for resource not found cases (404)
 */
export class NotFoundError extends AppError {
  constructor(message: string = 'Resource not found', details?: any) {
    super(message, 404, 'NOT_FOUND', details, true);
  }
}

/**
 * Error for validation failures (400)
 */
export class ValidationError extends AppError {
  constructor(message: string = 'Validation error', details?: any) {
    super(message, 400, 'VALIDATION_ERROR', details, true);
  }
}

/**
 * Error for unauthorized access attempts (401)
 */
export class UnauthorizedError extends AppError {
  constructor(message: string = 'Unauthorized access', details?: any) {
    super(message, 401, 'UNAUTHORIZED', details, true);
  }
}

/**
 * Error for forbidden access attempts (403)
 */
export class ForbiddenError extends AppError {
  constructor(message: string = 'Forbidden access', details?: any) {
    super(message, 403, 'FORBIDDEN', details, true);
  }
}

/**
 * Error for rate limiting (429)
 */
export class RateLimitError extends AppError {
  constructor(message: string = 'Rate limit exceeded', details?: any) {
    super(message, 429, 'RATE_LIMIT_EXCEEDED', details, true);
  }
}

/**
 * Error for external service failures (502)
 */
export class ExternalServiceError extends AppError {
  constructor(message: string = 'External service error', details?: any) {
    super(message, 502, 'EXTERNAL_SERVICE_ERROR', details, true);
  }
}

/**
 * Error for database operation failures (500)
 */
export class DatabaseError extends AppError {
  constructor(message: string = 'Database operation failed', details?: any) {
    super(message, 500, 'DATABASE_ERROR', details, true);
  }
}

/**
 * Create appropriate error based on status code
 */
export const createHttpError = (
  statusCode: number,
  message: string,
  details?: any
): AppError => {
  switch (statusCode) {
    case 400:
      return new ValidationError(message, details);
    case 401:
      return new UnauthorizedError(message, details);
    case 403:
      return new ForbiddenError(message, details);
    case 404:
      return new NotFoundError(message, details);
    case 429:
      return new RateLimitError(message, details);
    case 502:
      return new ExternalServiceError(message, details);
    default:
      return new AppError(message, statusCode, 'HTTP_ERROR', details);
  }
}; 