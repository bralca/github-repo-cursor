import { useState, useEffect } from 'react';

interface ContributorRanking {
  rank_position: number;
  contributor_id: string;
  total_score: number;
  code_volume_score: number;
  code_efficiency_score: number;
  commit_impact_score: number;
  repo_influence_score: number;
  raw_lines_added: number;
  raw_lines_removed: number;
  raw_commits_count: number;
  repositories_contributed: number;
  calculation_timestamp: string;
  username?: string;
  name?: string;
  avatar?: string;
}

type Timeframe = '24h' | '7d' | '30d' | 'all';

export function useContributorRankings() {
  const [rankings, setRankings] = useState<ContributorRanking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTimeframe, setSelectedTimeframe] = useState<Timeframe>('7d');
  
  const timeframes: Timeframe[] = ['24h', '7d', '30d', 'all'];
  
  useEffect(() => {
    async function fetchRankings() {
      setIsLoading(true);
      setError(null);
      
      try {
        const response = await fetch('/api/sqlite/contributor-rankings', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            operation: 'get_latest',
          }),
        });
        
        if (!response.ok) {
          throw new Error('Failed to fetch rankings');
        }
        
        const data = await response.json();
        setRankings(data.rankings || []);
      } catch (err: any) {
        console.error('Error fetching contributor rankings:', err);
        setError(err.message || 'An error occurred while fetching rankings');
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchRankings();
  }, []);
  
  const setTimeframe = (timeframe: Timeframe) => {
    // In a real implementation, we would refetch the data for the selected timeframe
    setSelectedTimeframe(timeframe);
  };
  
  return {
    rankings,
    isLoading,
    error,
    timeframes,
    selectedTimeframe,
    setTimeframe,
  };
} 