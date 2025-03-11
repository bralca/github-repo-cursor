/**
 * Validation Middleware
 * 
 * This middleware handles request validation.
 */

import { logger } from '../utils/logger.js';

/**
 * Validate that required parameters are present in request
 * @param {Array} paramNames - Names of parameters to validate
 * @returns {function} - Express middleware function
 */
export function validateRequestParams(paramNames = []) {
  return (req, res, next) => {
    try {
      // Check for missing params in request parameters
      const missingParams = paramNames.filter(param => !req.params[param]);
      
      if (missingParams.length > 0) {
        logger.warn(`Missing request parameters: ${missingParams.join(', ')}`, {
          params: req.params,
          missingParams
        });
        
        return res.status(400).json({
          success: false,
          error: 'Bad Request',
          details: `Missing required parameters: ${missingParams.join(', ')}`
        });
      }
      
      next();
    } catch (error) {
      logger.error(`Validation error: ${error.message}`, { error });
      res.status(500).json({
        success: false,
        error: 'Internal Server Error',
        details: 'An error occurred during request validation'
      });
    }
  };
}

export default {
  validateRequestParams
}; 