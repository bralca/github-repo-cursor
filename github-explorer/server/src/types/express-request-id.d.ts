declare module 'express-request-id' {
  import { RequestHandler } from 'express';
  
  /**
   * Express middleware that adds a unique identifier to the request object
   */
  function expressRequestId(options?: {
    /**
     * The header to use for setting the request ID
     * @default 'x-request-id'
     */
    header?: string;
    
    /**
     * Custom request ID generator function
     */
    generator?: () => string;
  }): RequestHandler;
  
  export = expressRequestId;
} 