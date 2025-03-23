'use client';

import { useState } from 'react';
// We're keeping these imports but will handle them differently
// as we've removed the underlying implementation

/**
 * Stub hooks that return empty data after removing the pages
 */
const useRepositoryData = () => ({ 
  data: null, 
  isLoading: false, 
  error: null, 
  refetch: () => ({}) 
});

const useContributorData = () => ({ 
  data: null, 
  isLoading: false, 
  error: null, 
  refetch: () => ({}) 
});

const useMergeRequestData = () => ({ 
  data: null, 
  isLoading: false, 
  error: null, 
  refetch: () => ({}) 
});

const useCommitData = () => ({ 
  data: null, 
  isLoading: false, 
  error: null, 
  refetch: () => ({}) 
});

interface UseEntityDataOptions {
  initialData?: any;
  skipFetch?: boolean;
}

/**
 * Generic hook for loading entity data based on entity type
 * 
 * This hook is a convenient wrapper around the specific entity data hooks.
 * It provides a unified interface for loading any type of entity data.
 * 
 * @param entityType The type of entity to load
 * @param slugs Object containing the necessary slugs for the entity type
 * @param options Options for data fetching
 * @returns Entity data and loading/error states
 */
export function useEntityData(
  entityType: 'repository' | 'contributor' | 'mergeRequest' | 'commit',
  slugs: {
    repositorySlug?: string;
    contributorSlug?: string;
    mergeRequestSlug?: string;
    commitSha?: string;
    fileSlug?: string;
  },
  options: UseEntityDataOptions = {}
) {
  const [usingInitialData] = useState(!!options.initialData);

  // Return empty data with warning in console
  console.warn(`Entity type ${entityType} is no longer supported in navigation`);
  
  // Return standardized result shape with null data
  return {
    data: null,
    isLoading: false,
    error: null,
    refetch: () => {},
    usingInitialData
  };
} 