import { Octokit } from '@octokit/rest';
import { logger } from '../../utils/logger.js';

/**
 * GitHub Client Factory
 * 
 * Factory for creating GitHub API clients with proper authentication and configuration.
 */
class GitHubClientFactory {
  constructor() {
    this.clients = new Map();
    this.defaultClient = null;
  }
  
  /**
   * Create a new GitHub client
   * @param {Object} options - Client options
   * @returns {Octokit} GitHub client instance
   */
  createClient(options = {}) {
    const clientId = options.clientId || 'default';
    
    // Check if client already exists
    if (this.clients.has(clientId)) {
      logger.debug(`Returning existing GitHub client: ${clientId}`);
      return this.clients.get(clientId);
    }
    
    // Get GitHub token from environment or options
    const token = options.token || process.env.GITHUB_TOKEN;
    
    if (!token) {
      logger.warn('No GitHub token provided, creating unauthenticated client');
    }
    
    // Create Octokit instance with authentication
    const client = new Octokit({
      auth: token,
      userAgent: 'GitHub-Explorer/1.0.0',
      baseUrl: options.baseUrl || 'https://api.github.com',
      log: {
        debug: (message) => logger.debug(`GitHub API: ${message}`),
        info: (message) => logger.info(`GitHub API: ${message}`),
        warn: (message) => logger.warn(`GitHub API: ${message}`),
        error: (message) => logger.error(`GitHub API: ${message}`)
      },
      ...options.octokitOptions
    });
    
    // Store client in map
    this.clients.set(clientId, client);
    
    // Set as default client if none exists
    if (!this.defaultClient) {
      this.defaultClient = client;
    }
    
    logger.info(`Created new GitHub client: ${clientId}`);
    return client;
  }
  
  /**
   * Get an existing client by ID
   * @param {string} clientId - Client ID
   * @returns {Octokit} GitHub client instance
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
    logger.error(`GitHub client not found: ${clientId}`);
    throw new Error(`GitHub client not found: ${clientId}`);
  }
  
  /**
   * Create a mock client for testing
   * @returns {Object} Mock GitHub client
   */
  createMockClient() {
    // Create a mock client for testing
    const mockClient = {
      repos: {
        get: async () => ({ data: { id: 'mock-repo-id', name: 'mock-repo' } }),
        listCommits: async () => ({ data: [] }),
        listContributors: async () => ({ data: [] }),
        listLanguages: async () => ({ data: { JavaScript: 1000, TypeScript: 500 } })
      },
      pulls: {
        get: async () => ({ data: { id: 'mock-pr-id', title: 'Mock PR' } }),
        listCommits: async () => ({ data: [] })
      },
      users: {
        getByUsername: async () => ({ data: { id: 'mock-user-id', login: 'mock-user' } })
      },
      // Add more mock methods as needed
      
      // Flag to identify as mock
      isMock: true
    };
    
    // Store mock client
    this.clients.set('mock', mockClient);
    logger.info('Created mock GitHub client');
    
    return mockClient;
  }
}

// Create singleton instance
export const githubClientFactory = new GitHubClientFactory(); 