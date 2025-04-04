import { useInfiniteQuery } from '@tanstack/react-query';
import { fetchFromApi } from '@/lib/client/api';

export interface MergeRequest {
  id: string;
  number: number;
  title: string;
  description: string | null;
  state: 'open' | 'closed' | 'merged';
  merged_at: string | null;
  closed_at: string | null;
  created_at: string;
  updated_at: string;
  additions: number;
  deletions: number;
  files_changed: number;
  repository: {
    id: string;
    name: string;
    full_name: string;
  };
}

export interface MergeRequestsResponse {
  data: MergeRequest[];
  pagination: {
    limit: number;
    offset: number;
    total: number;
    has_more: boolean;
  };
}

export interface MergeRequestsQueryOptions {
  initialData?: {
    pages: MergeRequestsResponse[];
    pageParams: number[];
  };
}

export function useContributorMergeRequests(
  contributorId: string,
  state: 'all' | 'open' | 'closed' | 'merged' = 'all'
) {
  return useInfiniteQuery<MergeRequestsResponse, Error, MergeRequestsResponse, [string, string, string], number>({
    queryKey: ['contributorMergeRequests', contributorId, state],
    queryFn: async ({ pageParam = 0 }) => {
      const limit = 10;
      const offset = pageParam * limit;
      return await fetchFromApi<MergeRequestsResponse>(
        `contributors/${contributorId}/merge-requests`,
        'GET',
        { limit: limit.toString(), offset: offset.toString(), state }
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
  });
} 