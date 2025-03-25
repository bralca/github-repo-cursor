"use client";

import { useState, useEffect, useCallback } from 'react';
import { apiClient, SitemapStatusResponse } from '@/lib/client/api-client';

interface SitemapMetadata {
  entity_type: string;
  url_count: number;
  last_updated: string;
}

interface SitemapStatus {
  sitemapExists: boolean;
  sitemapMetadata: SitemapMetadata[];
  lastUpdated: number | null;
  fileCount: number;
}

/**
 * Hook for managing sitemap generation
 */
export function useSitemapGeneration() {
  const [status, setStatus] = useState<SitemapStatus | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Function to fetch the current sitemap status
  const fetchStatus = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Use the API client instead of a direct fetch
      const apiResponse = await apiClient.sitemap.getStatus();
      
      // Map API response to our status format
      setStatus({
        sitemapExists: apiResponse.status !== 'not_generated',
        sitemapMetadata: [], // We'll populate this from the API response
        lastUpdated: apiResponse.lastGenerated ? new Date(apiResponse.lastGenerated).getTime() : null,
        fileCount: apiResponse.urlCount || 0
      });
    } catch (err: any) {
      setError(err.message || 'Failed to fetch sitemap status');
      console.error('Error fetching sitemap status:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);
  
  // Function to trigger sitemap generation
  const generateSitemap = useCallback(async () => {
    setIsGenerating(true);
    setError(null);
    
    try {
      // Use the API client instead of a direct fetch
      await apiClient.sitemap.generate();
      
      // Fetch the updated status
      await fetchStatus();
    } catch (err: any) {
      setError(err.message || 'Failed to generate sitemap');
      console.error('Error generating sitemap:', err);
    } finally {
      setIsGenerating(false);
    }
  }, [fetchStatus]);
  
  // Fetch status on mount
  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);
  
  // Format the last updated date
  const formattedLastUpdated = status?.lastUpdated 
    ? new Date(status.lastUpdated).toLocaleString() 
    : 'Never';
  
  // Check if sitemap exists
  const sitemapExists = status?.sitemapExists || false;
  
  // Extract lastUpdated for the component
  const lastUpdated = formattedLastUpdated;

  // Add refreshStatus as an alias for fetchStatus for better semantics
  const refreshStatus = fetchStatus;
  
  // Convert error to isError boolean
  const isError = error !== null;
  
  return {
    status,
    isLoading,
    isGenerating,
    error,
    isError,
    fetchStatus,
    refreshStatus,
    generateSitemap,
    formattedLastUpdated,
    lastUpdated,
    sitemapExists
  };
} 