/**
 * Database client index file
 * 
 * This is a transitional file that provides exports for both direct database access
 * (which will be phased out) and API-based access (which is the new approach).
 * 
 * In Next.js 15, all database access should be done through API routes.
 */

// Re-export the connection utilities for transitional purposes
export * from './connection';

// Warning about database access
console.warn(
  'WARNING: Direct database access from the frontend is being phased out in favor of API-based access. ' +
  'Please update your code to use the API client modules in lib/client/ instead.'
); 