import { useQuery } from '@tanstack/react-query';
import { fetchFromApi } from '@/lib/client/api';

export interface ImpactData {
  added: number;
  removed: number;
  total: number;
  total_impact_score: number;
  ratio: {
    additions: number;
    deletions: number;
  };
  specializations: Record<string, number>;
  languages: Record<string, number>;
  repository_breakdown: {
    repository_id: string;
    repository_name: string;
    added: number;
    removed: number;
    total: number;
  }[];
}

export function useContributorImpact(contributorId: string, timeframe?: string) {
  return useQuery<ImpactData>({
    queryKey: ['contributorImpact', contributorId, timeframe],
    queryFn: async () => {
      return await fetchFromApi<ImpactData>(`contributors/${contributorId}/impact`, 'GET', 
        timeframe ? { timeframe } : undefined
      );
    },
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });
} 