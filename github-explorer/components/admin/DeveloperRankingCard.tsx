'use client';

import React from 'react';
import { StatsCard } from '@/components/ui/stats-card';
import { Button } from '@/components/ui/button';
import { Loader2, TrendingUp, RefreshCw, Users } from 'lucide-react';
import { useContributorRankings } from '@/hooks/admin/use-contributor-rankings';
import { formatDistanceToNow } from 'date-fns';

export function DeveloperRankingCard() {
  const { calculateRankings, isCalculating, stats, error } = useContributorRankings();

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Never';
    const date = new Date(dateString);
    return `${formatDistanceToNow(date, { addSuffix: true })}`;
  };

  return (
    <StatsCard
      title="Developer Rankings"
      description="Calculate rankings for the developer leaderboard"
      icon={<TrendingUp className="h-5 w-5" />}
      value={`${stats?.contributorsRanked || 0} Developers Ranked`}
      statusText={
        stats?.latestCalculation
          ? `Last calculated ${formatDate(stats.latestCalculation)}`
          : 'Not yet calculated'
      }
      footer={
        <div className="flex flex-col space-y-2">
          {stats && (
            <div className="text-xs text-muted-foreground">
              <span className="flex items-center">
                <RefreshCw className="h-3 w-3 mr-1" />
                {stats.calculationsCount} total calculations performed
              </span>
              <span className="flex items-center mt-1">
                <Users className="h-3 w-3 mr-1" />
                {stats.contributorsRanked} developers in latest ranking
              </span>
            </div>
          )}
          <Button
            size="sm"
            className="w-full"
            onClick={calculateRankings}
            disabled={isCalculating}
          >
            {isCalculating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Calculating...
              </>
            ) : (
              'Calculate Rankings'
            )}
          </Button>
          {error && (
            <p className="text-xs text-destructive mt-1">{error}</p>
          )}
        </div>
      }
    />
  );
} 