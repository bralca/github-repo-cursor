import { useQuery } from '@tanstack/react-query';
import { fetchFromApi } from '@/lib/client/api';

export interface ProfileMetadata {
  active_period: {
    first_contribution: string;
    last_contribution: string;
    duration_days: number;
    duration_formatted: string;
  };
  organizations: string[];
  top_languages: string[];
  first_contribution_date: string;
  last_contribution_date: string;
  pull_requests_total?: number;
  commits_total?: number;
  reviews_count?: number;
  issues_count?: number;
}

export function useContributorProfileMetadata(contributorId: string) {
  return useQuery<ProfileMetadata>({
    queryKey: ['contributorProfileMetadata', contributorId],
    queryFn: async () => {
      return await fetchFromApi<ProfileMetadata>(`contributors/${contributorId}/profile-metadata`);
    },
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });
} 