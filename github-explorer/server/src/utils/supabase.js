/**
 * Supabase Utility (Stub Implementation)
 * 
 * This module provides mock Supabase clients for backward compatibility.
 * All operations are stubs that log actions but don't interact with Supabase.
 */

// Removed import for supabaseClientFactory
import { logger } from './logger.js';

// Create a mock Supabase client with methods that log operations
const createMockClient = () => {
  const mockClient = {
    from: (table) => {
      logger.info(`[STUB] Supabase: Accessing table ${table}`);
      return {
        select: (columns) => {
          logger.info(`[STUB] Supabase: SELECT ${columns || '*'} FROM ${table}`);
          return {
            eq: () => mockClient.from(table).select(),
            in: () => mockClient.from(table).select(),
            match: () => mockClient.from(table).select(),
            filter: () => mockClient.from(table).select(),
            order: () => mockClient.from(table).select(),
            limit: () => mockClient.from(table).select(),
            single: () => Promise.resolve({ data: null, error: null }),
            then: (callback) => Promise.resolve({ data: [], error: null }).then(callback)
          };
        },
        insert: (data) => {
          logger.info(`[STUB] Supabase: INSERT INTO ${table}`, { count: Array.isArray(data) ? data.length : 1 });
          return Promise.resolve({ data: null, error: null });
        },
        upsert: (data) => {
          logger.info(`[STUB] Supabase: UPSERT INTO ${table}`, { count: Array.isArray(data) ? data.length : 1 });
          return Promise.resolve({ data: null, error: null });
        },
        update: (data) => {
          logger.info(`[STUB] Supabase: UPDATE ${table}`);
          return {
            eq: () => Promise.resolve({ data: null, error: null }),
            match: () => Promise.resolve({ data: null, error: null }),
            in: () => Promise.resolve({ data: null, error: null })
          };
        },
        delete: () => {
          logger.info(`[STUB] Supabase: DELETE FROM ${table}`);
          return {
            eq: () => Promise.resolve({ data: null, error: null }),
            match: () => Promise.resolve({ data: null, error: null }),
            in: () => Promise.resolve({ data: null, error: null })
          };
        }
      };
      return mockClient;
    },
    rpc: (func, params) => {
      logger.info(`[STUB] Supabase: Calling RPC function ${func}`, { params });
      return Promise.resolve({ data: null, error: null });
    },
    storage: {
      from: (bucket) => {
        logger.info(`[STUB] Supabase: Accessing storage bucket ${bucket}`);
        return {
          upload: () => Promise.resolve({ data: null, error: null }),
          download: () => Promise.resolve({ data: null, error: null }),
          list: () => Promise.resolve({ data: [], error: null }),
          remove: () => Promise.resolve({ data: null, error: null })
        };
      }
    }
  };
  return mockClient;
};

/**
 * Get a Supabase service client (stub implementation)
 * @returns {Object} Mock Supabase service client
 */
export const supabase = (() => {
  try {
    logger.info('[STUB] Creating mock Supabase service client');
    return createMockClient();
  } catch (error) {
    logger.error('Error creating mock Supabase client', { error });
    throw error;
  }
})();

/**
 * Get a Supabase anon client (stub implementation)
 * @returns {Object} Mock Supabase anon client
 */
export const getAnonClient = () => {
  try {
    logger.info('[STUB] Creating mock Supabase anon client');
    return createMockClient();
  } catch (error) {
    logger.error('Error creating mock Supabase anon client', { error });
    throw error;
  }
};

export default supabase; 