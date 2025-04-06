import useSWR from 'swr';
import { apiClient } from '@/lib/client/api-client';
import { ContributorDetail, contributorsApi } from '@/lib/client/contributors-api';
import { CACHE_TTL } from '@/lib/client/cache-utils';

/**
 * Options for the useContributorData hook
 */
export interface ContributorDataOptions {
  /**
   * Time in seconds to refresh the data
   * Default: 1 hour
   */
  refreshInterval?: number;
  
  /**
   * Whether to revalidate on focus
   * Default: true
   */
  revalidateOnFocus?: boolean;
  
  /**
   * Whether to deduplicate requests within a time window
   * Default: true
   */
  dedupingInterval?: number;
}

/**
 * Hook to fetch contributor data with SWR
 * 
 * @param id Contributor ID or username
 * @param options Options for SWR behavior
 * @returns Object containing contributor data and loading/error states
 */
export function useContributorData(id: string, options: ContributorDataOptions = {}) {
  const {
    refreshInterval = CACHE_TTL.DEFAULT, // 1 hour default
    revalidateOnFocus = true,
    dedupingInterval = 5000 // 5 seconds default
  } = options;
  
  const isUsername = !id.includes('-'); // Simple heuristic to detect if this is a username or UUID
  
  const { data, error, isLoading, isValidating, mutate } = useSWR(
    id ? `contributor-${id}` : null, // Don't fetch if no ID is provided
    async () => {
      return isUsername
        ? await contributorsApi.getByUsername(id)
        : await contributorsApi.getById(id);
    },
    {
      refreshInterval: refreshInterval * 1000, // Convert to milliseconds
      revalidateOnFocus,
      dedupingInterval
    }
  );
  
  /**
   * Force a refresh of the contributor data
   */
  const refresh = async () => {
    return await mutate(
      isUsername
        ? contributorsApi.getByUsername(id, true) // Force refresh from API
        : contributorsApi.getById(id, true), // Force refresh from API
      { 
        revalidate: true, 
        populateCache: true 
      }
    );
  };
  
  return {
    data,
    isLoading,
    isValidating,
    error,
    refresh
  };
}

/**
 * Hook to fetch contributor activity data with SWR
 * 
 * @param id Contributor ID
 * @param options Options for SWR behavior
 * @returns Object containing contributor activity data and loading/error states
 */
export function useContributorActivity(id: string, options: ContributorDataOptions = {}) {
  const {
    refreshInterval = CACHE_TTL.DEFAULT, // 1 hour default
    revalidateOnFocus = true,
    dedupingInterval = 5000 // 5 seconds default
  } = options;
  
  const { data, error, isLoading, isValidating, mutate } = useSWR(
    id ? `contributor-${id}-activity` : null, // Don't fetch if no ID is provided
    async () => {
      return await contributorsApi.getActivity(id);
    },
    {
      refreshInterval: refreshInterval * 1000, // Convert to milliseconds
      revalidateOnFocus,
      dedupingInterval
    }
  );
  
  /**
   * Force a refresh of the activity data
   */
  const refresh = async () => {
    return await mutate(
      contributorsApi.getActivity(id, true), // Force refresh from API
      { 
        revalidate: true, 
        populateCache: true 
      }
    );
  };
  
  return {
    data,
    isLoading,
    isValidating,
    error,
    refresh
  };
}

/**
 * Hook to fetch contributor impact data with SWR
 * 
 * @param id Contributor ID
 * @param options Options for SWR behavior
 * @returns Object containing contributor impact data and loading/error states
 */
export function useContributorImpact(id: string, options: ContributorDataOptions = {}) {
  const {
    refreshInterval = CACHE_TTL.DEFAULT, // 1 hour default
    revalidateOnFocus = true,
    dedupingInterval = 5000 // 5 seconds default
  } = options;
  
  const { data, error, isLoading, isValidating, mutate } = useSWR(
    id ? `contributor-${id}-impact` : null, // Don't fetch if no ID is provided
    async () => {
      return await contributorsApi.getImpact(id);
    },
    {
      refreshInterval: refreshInterval * 1000, // Convert to milliseconds
      revalidateOnFocus,
      dedupingInterval
    }
  );
  
  /**
   * Force a refresh of the impact data
   */
  const refresh = async () => {
    return await mutate(
      contributorsApi.getImpact(id, true), // Force refresh from API
      { 
        revalidate: true, 
        populateCache: true 
      }
    );
  };
  
  return {
    data,
    isLoading,
    isValidating,
    error,
    refresh
  };
}

/**
 * Hook to fetch contributor repositories with SWR
 * 
 * @param id Contributor ID
 * @param options Options for SWR behavior
 * @returns Object containing contributor repositories and loading/error states
 */
export function useContributorRepositories(id: string, options: ContributorDataOptions = {}) {
  const {
    refreshInterval = CACHE_TTL.DEFAULT, // 1 hour default
    revalidateOnFocus = true,
    dedupingInterval = 5000 // 5 seconds default
  } = options;
  
  const { data, error, isLoading, isValidating, mutate } = useSWR(
    id ? `contributor-${id}-repositories` : null, // Don't fetch if no ID is provided
    async () => {
      return await contributorsApi.getRepositories(id);
    },
    {
      refreshInterval: refreshInterval * 1000, // Convert to milliseconds
      revalidateOnFocus,
      dedupingInterval
    }
  );
  
  /**
   * Force a refresh of the repositories data
   */
  const refresh = async () => {
    return await mutate(
      contributorsApi.getRepositories(id, true), // Force refresh from API
      { 
        revalidate: true, 
        populateCache: true 
      }
    );
  };
  
  return {
    data,
    isLoading,
    isValidating,
    error,
    refresh
  };
} 