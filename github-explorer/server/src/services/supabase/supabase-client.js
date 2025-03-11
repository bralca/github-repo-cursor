import { createClient } from '@supabase/supabase-js';
import { logger } from '../../utils/logger.js';

/**
 * Supabase Client Factory
 * 
 * Factory for creating Supabase clients with proper authentication and configuration.
 */
class SupabaseClientFactory {
  constructor() {
    this.clients = new Map();
    this.defaultClient = null;
  }
  
  /**
   * Create a new Supabase client
   * @param {Object} options - Client options
   * @returns {SupabaseClient} Supabase client instance
   */
  createClient(options = {}) {
    const clientId = options.clientId || 'default';
    
    // Check if client already exists
    if (this.clients.has(clientId)) {
      logger.debug(`Returning existing Supabase client: ${clientId}`);
      return this.clients.get(clientId);
    }
    
    // Get Supabase URL and key from environment or options
    const supabaseUrl = options.url || process.env.SUPABASE_URL;
    const supabaseKey = options.key || process.env.SUPABASE_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      logger.warn('Missing Supabase URL or key, creating mock client for testing');
      return this.createMockClient();
    }
    
    // Create Supabase client
    const client = createClient(supabaseUrl, supabaseKey, {
      auth: {
        persistSession: false
      },
      ...options.clientOptions
    });
    
    // Store client in map
    this.clients.set(clientId, client);
    
    // Set as default client if none exists
    if (!this.defaultClient) {
      this.defaultClient = client;
    }
    
    logger.info(`Created new Supabase client: ${clientId}`);
    return client;
  }
  
  /**
   * Get an existing client by ID
   * @param {string} clientId - Client ID
   * @returns {SupabaseClient} Supabase client instance
   */
  getClient(clientId = 'default') {
    // Return existing client or create new one
    if (this.clients.has(clientId)) {
      return this.clients.get(clientId);
    }
    
    // If default client requested but doesn't exist, create it
    if (clientId === 'default') {
      return this.createClient();
    }
    
    // Client doesn't exist
    logger.error(`Supabase client not found: ${clientId}`);
    throw new Error(`Supabase client not found: ${clientId}`);
  }
  
  /**
   * Create a mock client for testing
   * @returns {Object} Mock Supabase client
   */
  createMockClient() {
    // Create a mock client for testing
    const mockClient = {
      from: (table) => ({
        select: () => ({
          eq: () => ({
            single: async () => ({ data: null, error: null }),
            maybeSingle: async () => ({ data: null, error: null }),
            execute: async () => ({ data: [], error: null })
          }),
          execute: async () => ({ data: [], error: null })
        }),
        insert: () => ({
          execute: async () => ({ data: { id: 'mock-id' }, error: null })
        }),
        update: () => ({
          eq: () => ({
            execute: async () => ({ data: { id: 'mock-id' }, error: null })
          })
        }),
        delete: () => ({
          eq: () => ({
            execute: async () => ({ data: null, error: null })
          })
        })
      }),
      // Flag to identify as mock
      isMock: true
    };
    
    // Store mock client
    this.clients.set('mock', mockClient);
    logger.info('Created mock Supabase client');
    
    return mockClient;
  }
}

// Create singleton instance
export const supabaseClientFactory = new SupabaseClientFactory(); 