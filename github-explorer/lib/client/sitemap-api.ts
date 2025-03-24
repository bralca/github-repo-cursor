import { fetchFromApi } from './api';

// Types for sitemap status
export interface SitemapStatusResponse {
  status: string;
  lastGenerated: string | null;
  urlCount: number | null;
  error: string | null;
}

// Types for sitemap operation responses
export interface SitemapOperationResponse {
  success: boolean;
  message: string;
}

/**
 * Sitemap API client for interacting with sitemap-related endpoints
 */
export const sitemapApi = {
  /**
   * Get the current status of the sitemap
   * @returns The current sitemap status
   */
  async getStatus(): Promise<SitemapStatusResponse> {
    return await fetchFromApi<SitemapStatusResponse>('sitemap-status');
  },
  
  /**
   * Trigger generation of a new sitemap
   * @returns Response indicating success or failure
   */
  async generate(): Promise<SitemapOperationResponse> {
    return await fetchFromApi<SitemapOperationResponse>(
      'generate-sitemap',
      'POST'
    );
  }
}; 