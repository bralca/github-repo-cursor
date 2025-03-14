/**
 * Supabase Utility
 * 
 * This module provides access to Supabase clients.
 */

import { supabaseClientFactory } from '../services/supabase/supabase-client.js';
import { logger } from './logger.js';

/**
 * Get a Supabase service client
 * @returns {Object} Supabase service client
 */
export const supabase = (() => {
  try {
    // Create and return a service client with admin privileges
    return supabaseClientFactory.getServiceClient();
  } catch (error) {
    logger.error('Error creating Supabase client', { error });
    throw error;
  }
})();

/**
 * Get a Supabase anon client
 * @returns {Object} Supabase anon client
 */
export const getAnonClient = () => {
  try {
    return supabaseClientFactory.getClient();
  } catch (error) {
    logger.error('Error creating Supabase anon client', { error });
    throw error;
  }
};

export default supabase; 