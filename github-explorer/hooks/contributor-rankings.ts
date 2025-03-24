import { useState, useEffect } from 'react';
import { apiClient, ContributorRanking } from '@/lib/client/api-client';

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
        // Use the API client instead of a direct fetch to the SQLite API
        const data = await apiClient.rankings.getLatest();
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
  
  const setTimeframe = async (timeframe: Timeframe) => {
    // Actually fetch data for the selected timeframe
    setSelectedTimeframe(timeframe);
    setIsLoading(true);
    
    try {
      const data = await apiClient.rankings.getByTimeframe(timeframe);
      setRankings(data.rankings || []);
    } catch (err: any) {
      console.error(`Error fetching rankings for timeframe ${timeframe}:`, err);
      setError(err.message || 'An error occurred while fetching rankings');
    } finally {
      setIsLoading(false);
    }
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