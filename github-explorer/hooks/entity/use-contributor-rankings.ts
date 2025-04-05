import { useQuery } from '@tanstack/react-query';
import { fetchFromApi } from '@/lib/client/api';

export interface ContributorRankingData {
  rank: number;
  absolute_rank: number;
  total_ranked: number;
  percentile: number;
  calculation_date: string;
  scores: {
    total: number;
    code_volume: number;
    code_efficiency: number;
    commit_impact: number;
    repo_influence: number;
    followers: number;
    profile_completeness: number;
    collaboration: number;
    repo_popularity: number;
  };
  percentiles: {
    total: number;
    code_volume: number;
    code_efficiency: number;
    commit_impact: number;
    repo_influence: number;
    followers: number;
  };
  raw_metrics: {
    followers_count: number;
    lines_added: number;
    lines_removed: number;
    commits_count: number;
    repositories_contributed: number;
  };
  trend?: {
    previous_timestamp: string;
    previous_rank: number;
    previous_score: number;
    rank_change: number;
    score_change: number;
  };
}

export function useContributorRankings(contributorId: string) {
  return useQuery<ContributorRankingData>({
    queryKey: ['contributorRankings', contributorId],
    queryFn: async () => {
      return await fetchFromApi<ContributorRankingData>(`contributors/${contributorId}/rankings`);
    },
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });
} 