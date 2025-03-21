"use client";

import { useState, useEffect, useCallback } from 'react';

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
      const response = await fetch('/api/sqlite/sitemap-status');
      if (!response.ok) {
        throw new Error('Failed to fetch sitemap status');
      }
      const data = await response.json();
      setStatus(data);
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
      const response = await fetch('/api/sqlite/generate-sitemap', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}),
      });
      
      if (!response.ok) {
        throw new Error('Failed to generate sitemap');
      }
      
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
  
  return {
    status,
    isLoading,
    isGenerating,
    error,
    fetchStatus,
    generateSitemap,
    formattedLastUpdated,
    sitemapExists
  };
} 