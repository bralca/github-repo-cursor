import 'express';
import 'express-request-id';

declare global {
  namespace Express {
    interface Request {
      id: string;
    }
  }
} 