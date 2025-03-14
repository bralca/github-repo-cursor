'use client';

import { useState, useEffect } from 'react';
import { useSupabaseQuery } from '@/hooks/supabase/use-supabase-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

interface EntityCount {
  total: number;
  enriched: number;
  unenriched: number;
}

interface EntityCounts {
  repositories: EntityCount;
  contributors: EntityCount;
  mergeRequests: EntityCount;
  commits: EntityCount;
}

export function EntityStatsOverview() {
  const [counts, setCounts] = useState<EntityCounts>({
    repositories: { total: 0, enriched: 0, unenriched: 0 },
    contributors: { total: 0, enriched: 0, unenriched: 0 },
    mergeRequests: { total: 0, enriched: 0, unenriched: 0 },
    commits: { total: 0, enriched: 0, unenriched: 0 },
  });
  
  // Repositories count
  const { data: repoData, isLoading: isLoadingRepo } = useSupabaseQuery<EntityCount>(
    ['entity-count', 'repositories', 'detailed'],
    async () => {
      const response = await fetch('/api/entity-counts?entity=repositories&detailed=true');
      if (!response.ok) {
        throw new Error('Failed to fetch repository counts');
      }
      const data = await response.json();
      return { 
        data: { 
          total: data.total || 0, 
          enriched: data.enriched || 0,
          unenriched: data.unenriched || 0
        }, 
        error: null 
      };
    },
    { refetchInterval: 60000 } // Refetch every minute
  );

  // Contributors count
  const { data: contribData, isLoading: isLoadingContrib } = useSupabaseQuery<EntityCount>(
    ['entity-count', 'contributors', 'detailed'],
    async () => {
      const response = await fetch('/api/entity-counts?entity=contributors&detailed=true');
      if (!response.ok) {
        throw new Error('Failed to fetch contributor counts');
      }
      const data = await response.json();
      return { 
        data: { 
          total: data.total || 0, 
          enriched: data.enriched || 0,
          unenriched: data.unenriched || 0
        }, 
        error: null 
      };
    },
    { refetchInterval: 60000 } // Refetch every minute
  );

  // Merge Requests count
  const { data: mrData, isLoading: isLoadingMR } = useSupabaseQuery<EntityCount>(
    ['entity-count', 'merge_requests', 'detailed'],
    async () => {
      const response = await fetch('/api/entity-counts?entity=merge_requests&detailed=true');
      if (!response.ok) {
        throw new Error('Failed to fetch merge request counts');
      }
      const data = await response.json();
      return { 
        data: { 
          total: data.total || 0, 
          enriched: data.enriched || 0,
          unenriched: data.unenriched || 0
        }, 
        error: null 
      };
    },
    { refetchInterval: 60000 } // Refetch every minute
  );

  // Commits count
  const { data: commitData, isLoading: isLoadingCommit } = useSupabaseQuery<EntityCount>(
    ['entity-count', 'commits', 'detailed'],
    async () => {
      const response = await fetch('/api/entity-counts?entity=commits&detailed=true');
      if (!response.ok) {
        throw new Error('Failed to fetch commit counts');
      }
      const data = await response.json();
      return { 
        data: { 
          total: data.total || 0, 
          enriched: data.enriched || 0,
          unenriched: data.unenriched || 0
        }, 
        error: null 
      };
    },
    { refetchInterval: 60000 } // Refetch every minute
  );

  useEffect(() => {
    // Update counts when data is loaded
    const newCounts = { ...counts };
    
    if (repoData) {
      newCounts.repositories = repoData;
    }
    
    if (contribData) {
      newCounts.contributors = contribData;
    }
    
    if (mrData) {
      newCounts.mergeRequests = mrData;
    }
    
    if (commitData) {
      newCounts.commits = commitData;
    }
    
    setCounts(newCounts);
  }, [repoData, contribData, mrData, commitData]);

  const isLoading = isLoadingRepo || isLoadingContrib || isLoadingMR || isLoadingCommit;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Processed Entities Overview</CardTitle>
        <CardDescription>Current count of processed entities in the database</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatItem 
              label="Repositories" 
              value={counts.repositories.total} 
              enriched={counts.repositories.enriched}
              unenriched={counts.repositories.unenriched}
            />
            <StatItem 
              label="Merge Requests" 
              value={counts.mergeRequests.total} 
              enriched={counts.mergeRequests.enriched}
              unenriched={counts.mergeRequests.unenriched}
            />
            <StatItem 
              label="Contributors" 
              value={counts.contributors.total} 
              enriched={counts.contributors.enriched}
              unenriched={counts.contributors.unenriched}
            />
            <StatItem 
              label="Commits" 
              value={counts.commits.total} 
              enriched={counts.commits.enriched}
              unenriched={counts.commits.unenriched}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function StatItem({ 
  label, 
  value, 
  enriched, 
  unenriched 
}: { 
  label: string; 
  value: number; 
  enriched: number;
  unenriched: number;
}) {
  return (
    <div className="text-center p-4 bg-muted rounded-lg flex flex-col h-[120px]">
      <p className="text-muted-foreground text-sm mb-1">{label}</p>
      <p className="text-3xl font-bold">{value.toLocaleString()}</p>
      <div className="mt-auto">
        {(enriched > 0 || unenriched > 0) ? (
          <div className="mt-2 flex justify-between text-xs">
            <span className="text-green-600">{enriched.toLocaleString()} enriched</span>
            <span className="text-amber-600">{unenriched.toLocaleString()} pending</span>
          </div>
        ) : (
          <div className="mt-2 h-4"></div> /* Empty space for consistent height */
        )}
      </div>
    </div>
  );
} 