import { Request, Response, NextFunction } from 'express';
import { createLogger, logContextStorage } from '../utils/logger';

const logger = createLogger('RequestLogger');

// Define interface for log data to avoid type errors
interface RequestLogData {
  method: string;
  url: string;
  ip: string | undefined;
  statusCode: number;
  duration: number;
  contentLength: string | number | string[];
  success: boolean;
  response?: any; // Allow response property
  [key: string]: any; // Allow any additional properties
}

/**
 * Logs the HTTP request details when it starts
 */
export const requestLoggerMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Get request start time
  const startTime = Date.now();
  const { method, originalUrl, ip } = req;

  // Create a context for this request if it doesn't exist yet
  if (!logContextStorage.getStore()) {
    logContextStorage.enterWith({});
  }

  // Log basic request info
  logger.http(`${method} ${originalUrl} - Request started`, {
    method,
    url: originalUrl,
    ip,
    userAgent: req.get('user-agent'),
    contentType: req.get('content-type'),
    query: req.query,
  });

  // Track response
  const originalEnd = res.end;
  const originalWrite = res.write;
  let responseBody = '';

  // Capture response body only in development and for non-binary responses
  if (process.env.NODE_ENV === 'development' && 
     (res.getHeader('content-type')?.toString().includes('application/json'))) {
    // @ts-ignore - monkey patch response.write
    res.write = function(chunk: any): boolean {
      if (chunk) {
        responseBody += chunk.toString();
      }
      // @ts-ignore
      return originalWrite.apply(res, arguments);
    };
  }

  // Log when the response is sent
  // @ts-ignore - monkey patch response.end
  res.end = function(): any {
    const duration = Date.now() - startTime;
    const statusCode = res.statusCode;
    const contentLength = res.getHeader('content-length') || 0;
    const successRate = statusCode < 400 ? 'success' : 'failure';

    // Determine log level based on status code
    const logLevel = statusCode >= 500 
      ? 'error' 
      : statusCode >= 400 
        ? 'warn' 
        : 'http';

    // Create log data object
    const logData: RequestLogData = {
      method,
      url: originalUrl,
      ip,
      statusCode,
      duration,
      contentLength,
      success: statusCode < 400,
    };

    // Add response body in development mode for JSON responses
    if (process.env.NODE_ENV === 'development' && responseBody && 
        res.getHeader('content-type')?.toString().includes('application/json')) {
      try {
        // Only log response bodies in development and limit size
        if (responseBody.length < 1024) {
          logData.response = JSON.parse(responseBody);
        } else {
          logData.response = '[Response too large to log]';
        }
      } catch (e) {
        // If response is not valid JSON, just log as string
        logData.response = '[Invalid JSON response]';
      }
    }

    // Log using appropriate level
    logger[logLevel](
      `${method} ${originalUrl} - ${statusCode} - ${duration}ms - ${successRate}`,
      logData
    );

    // @ts-ignore
    return originalEnd.apply(res, arguments);
  };

  next();
}; 