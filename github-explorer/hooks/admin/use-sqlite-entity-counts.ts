import { useQuery } from '@tanstack/react-query';
import { sqliteClient } from '@/lib/database/sqlite';

interface EntityCounts {
  repositories: number;
  contributors: number;
  mergeRequests: number;
  commits: number;
  files?: number;
  comments?: number;
  enriched_repositories?: number;
  enriched_contributors?: number;
  enriched_merge_requests?: number;
  enriched_commits?: number;
}

/**
 * Hook to fetch entity counts using SQLite
 * @returns Entity counts data, loading state, and error
 */
export function useSQLiteEntityCounts() {
  const { data, isLoading, error, refetch } = useQuery<EntityCounts>({
    queryKey: ['sqlite-entity-counts'],
    queryFn: async () => {
      try {
        return await sqliteClient.entities.getCounts();
      } catch (error: any) {
        console.error('Error fetching entity counts:', error);
        throw new Error(error.message || 'Failed to fetch entity counts');
      }
    },
    refetchInterval: 60000, // Refetch every minute
  });

  return {
    counts: data || { 
      repositories: 0, 
      contributors: 0, 
      mergeRequests: 0, 
      commits: 0,
      enriched_repositories: 0,
      enriched_contributors: 0,
      enriched_merge_requests: 0,
      enriched_commits: 0
    },
    isLoading,
    error,
    refetch,
  };
} 