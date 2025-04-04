import { useQuery } from '@tanstack/react-query';
import { fetchFromApi } from '@/lib/client/api';
import { Timeframe } from '@/types/common';

export interface ActivityData {
  total_commits: number;
  first_commit_date: string;
  last_commit_date: string;
  active_days?: number;
  activity: Record<string, number>; // Date in YYYY-MM-DD format to commit count
  monthly_averages: { month: string; average: string }[]; // month in YYYY-MM format
}

export function useContributorActivity(contributorId: string, timeframe: Timeframe = '30days') {
  return useQuery<ActivityData>({
    queryKey: ['contributorActivity', contributorId, timeframe],
    queryFn: async () => {
      return await fetchFromApi<ActivityData>(`contributors/${contributorId}/activity`, 'GET', { timeframe });
    },
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });
} 