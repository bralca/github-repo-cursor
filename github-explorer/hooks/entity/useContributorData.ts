'use client';

import { useState, useEffect } from 'react';
import { getContributorBySlug } from '@/lib/database/contributors';
import { parseContributorSlug } from '@/lib/url-utils';

interface UseContributorDataOptions {
  initialData?: any;
  skipFetch?: boolean;
}

/**
 * Hook for loading contributor data on the client
 * 
 * @param contributorSlug The contributor slug from the URL
 * @param options Options for the data fetching
 * @returns Contributor data and loading/error states
 */
export function useContributorData(contributorSlug: string, options: UseContributorDataOptions = {}) {
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
      const parsed = parseContributorSlug(contributorSlug);
      if (!parsed) {
        throw new Error('Invalid contributor slug');
      }

      // Fetch the contributor data
      const contributorData = await getContributorBySlug(contributorSlug);
      if (!contributorData) {
        throw new Error('Contributor not found');
      }

      setData(contributorData);
    } catch (err) {
      console.error('Error fetching contributor data:', err);
      setError(err instanceof Error ? err : new Error('Failed to load contributor data'));
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
  }, [contributorSlug, options.skipFetch]);

  return {
    data,
    isLoading,
    error,
    retry,
    isRetrying
  };
} 