import { createClient } from '@supabase/supabase-js';
import { logger } from '../../utils/logger.js';

/**
 * Supabase Client Factory
 * 
 * Factory for creating Supabase clients with proper authentication and configuration.
 * Supports different authentication levels:
 * - anon: Public access with limited permissions (default)
 * - service_role: Administrative access with full permissions
 */
class SupabaseClientFactory {
  constructor() {
    this.clients = new Map();
    this.defaultClient = null;
  }
  
  /**
   * Create a new Supabase client
   * @param {Object} options - Client options
   * @param {string} [options.clientId] - Client identifier
   * @param {string} [options.authLevel='anon'] - Authentication level ('anon' or 'service_role')
   * @param {string} [options.url] - Supabase URL
   * @param {string} [options.key] - Supabase key
   * @param {Object} [options.clientOptions] - Additional client options
   * @returns {SupabaseClient} Supabase client instance
   */
  createClient(options = {}) {
    const clientId = options.clientId || 'default';
    const authLevel = options.authLevel || 'anon';
    
    // Create a unique client ID that includes the auth level
    const fullClientId = `${clientId}_${authLevel}`;
    
    // Check if client already exists
    if (this.clients.has(fullClientId)) {
      logger.debug(`Returning existing Supabase client: ${fullClientId}`);
      return this.clients.get(fullClientId);
    }
    
    // Get Supabase URL and key from environment or options
    const supabaseUrl = options.url || process.env.SUPABASE_URL;
    let supabaseKey;
    
    // Select appropriate key based on auth level
    if (authLevel === 'service_role') {
      supabaseKey = options.key || process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
      if (!supabaseKey) {
        logger.error('Service role key required but not provided');
        throw new Error('SUPABASE_SERVICE_KEY or SUPABASE_SERVICE_ROLE_KEY is required for service_role authentication');
      }
    } else {
      supabaseKey = options.key || process.env.SUPABASE_KEY;
    }
    
    if (!supabaseUrl || !supabaseKey) {
      logger.warn('Missing Supabase URL or key, creating mock client for testing');
      return this.createMockClient(authLevel);
    }
    
    // Create Supabase client with appropriate configuration
    const client = createClient(supabaseUrl, supabaseKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false
      },
      db: {
        schema: 'public'
      },
      ...options.clientOptions
    });
    
    // Add helper properties
    client.authLevel = authLevel;
    client.isMock = false;
    
    // Store client in map
    this.clients.set(fullClientId, client);
    
    // Set as default client if none exists
    if (!this.defaultClient) {
      this.defaultClient = client;
    }
    
    logger.info(`Created new Supabase client: ${fullClientId} (${authLevel})`);
    return client;
  }
  
  /**
   * Get an existing client by ID and auth level
   * @param {string} clientId - Client ID
   * @param {string} [authLevel='anon'] - Authentication level
   * @returns {SupabaseClient} Supabase client instance
   */
  getClient(clientId = 'default', authLevel = 'anon') {
    const fullClientId = `${clientId}_${authLevel}`;
    
    // Return existing client or create new one
    if (this.clients.has(fullClientId)) {
      return this.clients.get(fullClientId);
    }
    
    // Create new client with specified auth level
    return this.createClient({ clientId, authLevel });
  }
  
  /**
   * Get a client with service role authentication
   * @param {string} clientId - Client ID
   * @returns {SupabaseClient} Supabase client instance
   */
  getServiceClient(clientId = 'default') {
    return this.getClient(clientId, 'service_role');
  }
  
  /**
   * Create a mock client for testing
   * @param {string} authLevel - Authentication level to mock
   * @returns {Object} Mock Supabase client
   */
  createMockClient(authLevel = 'anon') {
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
      rpc: (func, params) => ({
        data: null,
        error: null
      }),
      // Mock properties
      isMock: true,
      authLevel
    };
    
    // Store mock client
    const fullClientId = `mock_${authLevel}`;
    this.clients.set(fullClientId, mockClient);
    logger.info(`Created mock Supabase client (${authLevel})`);
    
    return mockClient;
  }
}

// Create singleton instance
export const supabaseClientFactory = new SupabaseClientFactory(); 