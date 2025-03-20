'use client';

import { useState, useEffect } from 'react';
import { getRepositoryBySlug } from '@/lib/database/repositories';
import { parseRepositorySlug } from '@/lib/url-utils';

interface UseRepositoryDataOptions {
  initialData?: any;
  skipFetch?: boolean;
}

/**
 * Hook for loading repository data on the client
 * 
 * @param repositorySlug The repository slug from the URL
 * @param options Options for the data fetching
 * @returns Repository data and loading/error states
 */
export function useRepositoryData(repositorySlug: string, options: UseRepositoryDataOptions = {}) {
  const [data, setData] = useState<any>(options.initialData || null);
  const [isLoading, setIsLoading] = useState<boolean>(!options.initialData && !options.skipFetch);
  const [error, setError] = useState<Error | null>(null);
  const [isRetrying, setIsRetrying] = useState<boolean>(false);

  // Function to fetch the data
  const fetchData = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Parse the slug to get the GitHub ID
      const parsed = parseRepositorySlug(repositorySlug);
      if (!parsed) {
        throw new Error('Invalid repository slug');
      }

      // Fetch the repository data
      const repositoryData = await getRepositoryBySlug(repositorySlug);
      if (!repositoryData) {
        throw new Error('Repository not found');
      }

      setData(repositoryData);
    } catch (err) {
      console.error('Error fetching repository data:', err);
      setError(err instanceof Error ? err : new Error('Failed to load repository data'));
    } finally {
      setIsLoading(false);
      setIsRetrying(false);
    }
  };

  // Retry function exposed to the component
  const retry = () => {
    setIsRetrying(true);
    fetchData();
  };

  // Fetch data on mount or when slug changes
  useEffect(() => {
    if (!options.skipFetch) {
      fetchData();
    }
  }, [repositorySlug, options.skipFetch]);

  return {
    data,
    isLoading,
    error,
    retry,
    isRetrying
  };
} 