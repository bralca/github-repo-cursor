/**
 * Retry Utility
 *
 * Provides a utility function to retry operations that might fail due to transient errors
 * like database locks. Implements exponential backoff with jitter to prevent
 * thundering herd issues when multiple retries happen at once.
 */

import { logger } from './logger.js';

// Default retry configuration
const DEFAULT_RETRY_CONFIG = {
  retries: 5,                      // Maximum number of retry attempts
  initialDelay: 100,               // Initial delay in milliseconds
  maxDelay: 5000,                  // Maximum delay in milliseconds
  factor: 2,                       // Exponential backoff factor
  jitter: true,                    // Whether to add jitter
  retryableErrors: [               // Error types that should trigger a retry
    'SQLITE_BUSY',                 // Database is locked
    'SQLITE_LOCKED',               // A table in the database is locked
    'database is locked'           // Text-based error for database locks
  ]
};

/**
 * Determines if an error should be retried based on configuration
 * @param {Error} error - The error to evaluate
 * @param {Array<string>} retryableErrors - List of error codes/messages that should be retried
 * @returns {boolean} True if the error should be retried
 */
function isRetryableError(error, retryableErrors) {
  if (!error) return false;
  
  // Check for SQLite error code
  if (error.code && retryableErrors.includes(error.code)) {
    return true;
  }
  
  // Check error message for known patterns
  if (error.message) {
    return retryableErrors.some(retryableError => 
      error.message.toLowerCase().includes(retryableError.toLowerCase())
    );
  }
  
  return false;
}

/**
 * Calculate delay with exponential backoff and optional jitter
 * @param {number} attempt - Current attempt number (0-based)
 * @param {Object} config - Retry configuration
 * @returns {number} Delay in milliseconds
 */
function calculateDelay(attempt, config) {
  // Calculate exponential backoff
  const exponentialDelay = Math.min(
    config.maxDelay,
    config.initialDelay * Math.pow(config.factor, attempt)
  );
  
  // Add jitter if enabled (random value between 0-30% of the delay)
  if (config.jitter) {
    const jitterAmount = exponentialDelay * 0.3; // 30% jitter
    return exponentialDelay + (Math.random() * jitterAmount);
  }
  
  return exponentialDelay;
}

/**
 * Executes a function with retry logic for transient errors
 * @param {Function} fn - Async function to execute
 * @param {Object} options - Retry options
 * @returns {Promise<any>} Result of the function execution
 */
async function withRetry(fn, options = {}) {
  // Merge default config with provided options
  const config = { ...DEFAULT_RETRY_CONFIG, ...options };
  let lastError;
  
  for (let attempt = 0; attempt <= config.retries; attempt++) {
    try {
      // On first attempt, just execute the function
      return await fn();
    } catch (error) {
      lastError = error;
      
      // Check if we should retry
      const shouldRetry = (
        attempt < config.retries && 
        isRetryableError(error, config.retryableErrors)
      );
      
      if (!shouldRetry) {
        // Non-retryable error or last attempt, just throw
        throw error;
      }
      
      // Calculate delay for next retry
      const delay = calculateDelay(attempt, config);
      
      // Log retry attempt
      logger.warn(`Retrying operation after error (attempt ${attempt + 1}/${config.retries}, delay: ${Math.round(delay)}ms)`, {
        errorCode: error.code,
        errorMessage: error.message,
        retryAttempt: attempt + 1,
        maxRetries: config.retries,
        delay: Math.round(delay)
      });
      
      // Wait before next retry
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  // This should not be reached due to throw in the loop,
  // but just in case, throw the last error
  throw lastError;
}

export { withRetry, isRetryableError, DEFAULT_RETRY_CONFIG }; 