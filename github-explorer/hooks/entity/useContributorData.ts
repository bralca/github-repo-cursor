'use client';

import { useEntityData } from '@/hooks/entity/mockEntityHooks';

interface UseContributorDataOptions {
  initialData?: any;
  skipFetch?: boolean;
}

/**
 * Stub hook for loading contributor data on the client
 * This now redirects to the mock implementation since we've removed the actual data sources.
 * 
 * @param contributorSlug The contributor slug from the URL
 * @param options Options for the data fetching
 * @returns Contributor data and loading/error states
 */
export function useContributorData(contributorSlug: string, options: UseContributorDataOptions = {}) {
  console.warn('Using stub implementation of useContributorData');
  
  const result = useEntityData(
    'contributor',
    { contributorSlug },
    options
  );
  
  return {
    data: result.data,
    isLoading: result.isLoading,
    error: result.error,
    retry: result.retry || (() => {}),
    isRetrying: result.isRetrying || false
  };
} 