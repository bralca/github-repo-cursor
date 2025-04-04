import { useInfiniteQuery } from '@tanstack/react-query';
import { fetchFromApi } from '@/lib/client/api';

// Base interface for all activity types
export interface BaseActivity {
  id: string;
  type: 'commit' | 'pull_request';
  timestamp: string;
  repository: {
    id: string;
    name: string;
    url: string;
  };
}
  
// Commit-specific activity
export interface CommitActivity extends BaseActivity {
  type: 'commit';
  message: string;
  sha: string;
  filename?: string;
  status?: 'added' | 'modified' | 'deleted';
  additions?: number;
  deletions?: number;
}
  
// Pull request-specific activity
export interface PullRequestActivity extends BaseActivity {
  type: 'pull_request';
  title: string;
  number: number;
  state: 'open' | 'closed' | 'merged';
  additions?: number;
  deletions?: number;
}

export type Activity = CommitActivity | PullRequestActivity;

export interface ActivityDay {
  date: string; // YYYY-MM-DD
  activities: Activity[];
}

export enum ActivityType {
  Commit = 'commit',
  PullRequest = 'pull_request',
  Review = 'review',
  Issue = 'issue',
  Comment = 'comment'
}

export interface ActivityItem {
  id: string;
  type: ActivityType;
  timestamp: string;
  title: string;
  description?: string;
  repository_id: string;
  repository_name: string;
  additions?: number;
  deletions?: number;
  url?: string;
  state?: string;
  sha?: string;
}

export interface RecentActivityResponse {
  data: ActivityItem[];
  pagination: {
    limit: number;
    offset: number;
    total: number;
    has_more: boolean;
  };
}

export interface RecentActivityQueryOptions {
  initialData?: {
    pages: RecentActivityResponse[];
    pageParams: number[];
  };
}

export function useContributorRecentActivity(contributorId: string) {
  return useInfiniteQuery<RecentActivityResponse, Error, RecentActivityResponse, [string, string], number>({
    queryKey: ['contributorRecentActivity', contributorId],
    queryFn: async ({ pageParam = 0 }) => {
      const limit = 20;
      const offset = pageParam * limit;
      return await fetchFromApi<RecentActivityResponse>(
        `contributors/${contributorId}/recent-activity`,
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
  });
} 