/**
 * Response Handler
 * 
 * This utility provides a consistent way to format and send HTTP responses
 * from Express controllers.
 */

import { logger } from './logger.js';

/**
 * Process and send a consistent API response
 * @param {object} res - Express response object
 * @param {number} statusCode - HTTP status code
 * @param {object} payload - Response payload (data, error, meta)
 * @param {string} contentType - Content type header (default: application/json)
 * @returns {object} - Express response object
 */
export function processResponse(res, statusCode = 200, payload = {}, contentType = 'application/json') {
  try {
    // Format response based on whether it's an error or success
    const isError = statusCode >= 400;
    
    // Set up consistent response payload
    const responseBody = {
      success: !isError,
      ...(payload.data && !isError ? { data: payload.data } : {}),
      ...(payload.error && isError ? { error: payload.error } : {}),
      ...(payload.details && isError ? { details: payload.details } : {}),
      ...(payload.meta ? { meta: payload.meta } : {})
    };
    
    // If this is an error, log it appropriately
    if (isError) {
      logger.error(`API Error Response: ${statusCode} ${payload.error}`, {
        statusCode,
        error: payload.error,
        details: payload.details
      });
    }
    
    return res.status(statusCode).type(contentType).send(responseBody);
  } catch (error) {
    logger.error('Error in response handler:', error);
    
    // Fallback response if something goes wrong in the response handler itself
    return res.status(500).type('application/json').send({
      success: false,
      error: 'Internal Server Error',
      details: 'An error occurred while processing the response'
    });
  }
}

export default {
  processResponse
}; 