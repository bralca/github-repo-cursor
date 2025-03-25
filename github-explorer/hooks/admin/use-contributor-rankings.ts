import { useState } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { apiClient } from '@/lib/client/api-client';

interface RankingStats {
  calculationsCount: number;
  latestCalculation: string;
  contributorsRanked: number;
}

interface UseContributorRankingsReturn {
  calculateRankings: () => Promise<void>;
  isCalculating: boolean;
  stats: RankingStats | null;
  error: string | null;
}

export function useContributorRankings(): UseContributorRankingsReturn {
  const [isCalculating, setIsCalculating] = useState(false);
  const [stats, setStats] = useState<RankingStats | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const calculateRankings = async () => {
    setIsCalculating(true);
    setError(null);
    
    try {
      const data = await apiClient.rankings.calculate();
      
      if (data.stats) {
        setStats(data.stats);
      }
      
      toast({
        title: 'Success',
        description: `Rankings calculated for ${data.stats?.contributorsRanked || 0} contributors`,
        variant: 'default',
      });
      
    } catch (error: any) {
      setError(error.message || 'An error occurred while calculating rankings');
      
      toast({
        title: 'Error',
        description: error.message || 'Failed to calculate rankings',
        variant: 'destructive',
      });
    } finally {
      setIsCalculating(false);
    }
  };

  return {
    calculateRankings,
    isCalculating,
    stats,
    error,
  };
} 