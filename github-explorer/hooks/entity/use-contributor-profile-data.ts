import { useQuery } from '@tanstack/react-query';
import { fetchFromApi } from '@/lib/client/api';

export interface ContributorProfileData {
  contributor: {
    id: string;
    github_id: number;
    username: string;
    name: string | null;
    avatar: string | null;
    bio: string | null;
  };
  active_period: {
    first_contribution: string;
    last_contribution: string;
    duration_days: number;
    duration_formatted: string;
  };
  top_languages: {
    name: string;
    percentage: number;
    count: number;
  }[];
  repositories: {
    data: {
      repository_id: string;
      repository_github_id: number;
      commit_count: number;
      lines_added: number;
      lines_removed: number;
      first_commit_date: string;
      last_commit_date: string;
      name: string;
      full_name: string;
      description: string | null;
      primary_language: string | null;
      stars_count: number;
      forks_count: number;
      license: string | null;
    }[];
    pagination: {
      total: number;
      limit: number;
      offset: number;
      has_more: boolean;
    };
  };
}

export function useContributorProfileData(contributorId: string) {
  return useQuery<ContributorProfileData>({
    queryKey: ['contributorProfileData', contributorId],
    queryFn: async () => {
      return await fetchFromApi<ContributorProfileData>(`contributors/${contributorId}/profile-data`);
    },
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });
} 