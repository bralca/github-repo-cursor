import { useInfiniteQuery } from '@tanstack/react-query';
import { fetchFromApi } from '@/lib/client/api';

export interface ContributorRepository {
  id: string;
  name: string;
  full_name: string;
  description: string | null;
  language: string | null;
  contributions: number;
  last_contribution_date: string;
}

export interface RepositoriesResponse {
  data: ContributorRepository[];
  pagination: {
    limit: number;
    offset: number;
    total: number;
    has_more: boolean;
  };
}

export interface RepositoriesQueryOptions {
  initialData?: {
    pages: RepositoriesResponse[];
    pageParams: number[];
  };
}

export function useContributorRepositories(
  contributorId: string,
  options?: RepositoriesQueryOptions
) {
  return useInfiniteQuery<RepositoriesResponse, Error, RepositoriesResponse, [string, string], number>({
    queryKey: ['contributorRepositories', contributorId],
    queryFn: async ({ pageParam = 0 }) => {
      const limit = 5;
      const offset = pageParam * limit;
      return await fetchFromApi<RepositoriesResponse>(
        `contributors/${contributorId}/repositories`, 
        'GET',
        { limit: limit.toString(), offset: offset.toString() }
      );
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage) => {
      if (!lastPage.pagination.has_more) return null;
      const currentOffset = lastPage.pagination.offset;
      const limit = lastPage.pagination.limit;
      return currentOffset / limit + 1;
    },
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    initialData: options?.initialData,
  });
} 