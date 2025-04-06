/**
 * Standard error handler for database operations
 * @param {Error} error - The error object
 * @param {Object} res - Express response object
 */
export const handleDbError = (error, res) => {
  console.log('[DEBUG] Error caught:', error);
  console.log('[DEBUG] Error stack:', error.stack);
  console.error('Database error:', error);
  
  // Determine status code based on error type
  let statusCode = 500;
  let message = 'Database operation failed';
  
  // Check for specific error types
  if (error.code === 'SQLITE_CONSTRAINT') {
    statusCode = 409; // Conflict
    message = 'Database constraint violation';
  } else if (error.code === 'SQLITE_BUSY') {
    statusCode = 503; // Service Unavailable
    message = 'Database is busy, try again later';
  } else if (error.code === 'SQLITE_READONLY') {
    statusCode = 500; // Internal Server Error
    message = 'Database is read-only';
  } else if (error.code === 'SQLITE_MISUSE') {
    statusCode = 500; // Internal Server Error
    message = 'Database connection error';
  }
  
  // Send error response
  res.status(statusCode).json({
    error: message,
    details: error.message
  });
}; 