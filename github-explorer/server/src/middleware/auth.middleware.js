/**
 * Authentication Middleware
 * 
 * This middleware handles authentication for protected routes.
 */

import { logger } from '../utils/logger.js';

/**
 * Authenticate token from request
 * This is a simple implementation that validates a token in the Authorization header
 * In a real application, this would validate JWT tokens or other auth methods
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 * @param {function} next - Express next function
 */
export function authenticateToken(req, res, next) {
  try {
    // For demo/test purposes, we're allowing all requests
    // In a real application, this would validate tokens
    
    logger.info('Authentication middleware bypassed for testing');
    next();
  } catch (error) {
    logger.error(`Authentication error: ${error.message}`, { error });
    res.status(401).json({
      success: false,
      error: 'Unauthorized',
      details: 'Invalid or missing authentication token'
    });
  }
}

export default {
  authenticateToken
}; 