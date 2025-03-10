import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { addRequestId } from '../utils/logger';

// Define the interface without extending the Request interface to avoid conflicts
interface RequestWithId {
  id: string;
}

/**
 * Middleware to add a unique request ID to each request
 * Simpler implementation replacing express-request-id
 */
export const requestIdMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  // Cast to any as an intermediate step to avoid TypeScript errors
  const reqAny = req as any;
  
  // Generate a new UUID v4
  const id = uuidv4();
  
  // Assign it to the request object
  reqAny.id = id;
  
  // Add it as a response header
  res.setHeader('X-Request-ID', id);
  
  next();
};

/**
 * Middleware to add the request ID to the logger context
 */
export const requestIdLoggerMiddleware = (
  req: Request,
  _res: Response,
  next: NextFunction
): void => {
  // Cast to any as an intermediate step
  const reqAny = req as any;
  if (reqAny.id) {
    addRequestId(reqAny.id);
  }
  next();
}; 