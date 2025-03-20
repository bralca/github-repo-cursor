'use client';

import { useState, useEffect } from 'react';
import { getMergeRequestBySlug } from '@/lib/database/merge-requests';
import { parseRepositorySlug, parseMergeRequestSlug } from '@/lib/url-utils';

interface UseMergeRequestDataOptions {
  initialData?: any;
  skipFetch?: boolean;
}

/**
 * Hook for loading merge request data on the client
 * 
 * @param repositorySlug The repository slug from the URL
 * @param mergeRequestSlug The merge request slug from the URL
 * @param options Options for the data fetching
 * @returns Merge request data and loading/error states
 */
export function useMergeRequestData(
  repositorySlug: string, 
  mergeRequestSlug: string, 
  options: UseMergeRequestDataOptions = {}
) {
  const [data, setData] = useState<any>(options.initialData || null);
  const [isLoading, setIsLoading] = useState<boolean>(!options.initialData && !options.skipFetch);
  const [error, setError] = useState<Error | null>(null);
  const [isRetrying, setIsRetrying] = useState<boolean>(false);

  // Function to fetch the data
  const fetchData = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Parse the slugs to get the GitHub IDs
      const repoInfo = parseRepositorySlug(repositorySlug);
      const mrInfo = parseMergeRequestSlug(mergeRequestSlug);
      
      if (!repoInfo || !mrInfo) {
        throw new Error('Invalid repository or merge request slug');
      }

      // Fetch the merge request data
      const mergeRequestData = await getMergeRequestBySlug(repositorySlug, mergeRequestSlug);
      if (!mergeRequestData) {
        throw new Error('Merge request not found');
      }

      setData(mergeRequestData);
    } catch (err) {
      console.error('Error fetching merge request data:', err);
      setError(err instanceof Error ? err : new Error('Failed to load merge request data'));
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

  // Fetch data on mount or when slugs change
  useEffect(() => {
    if (!options.skipFetch) {
      fetchData();
    }
  }, [repositorySlug, mergeRequestSlug, options.skipFetch]);

  return {
    data,
    isLoading,
    error,
    retry,
    isRetrying
  };
} 