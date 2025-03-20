'use client';

import { useSQLiteEntityCounts } from '@/hooks/admin/use-sqlite-entity-counts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Grid2X2Icon, UsersIcon, GitPullRequestIcon, GitCommitIcon, Loader2 } from 'lucide-react';

interface EntityStatsOverviewProps {
  useSQLite?: boolean; // Flag to use SQLite instead of Supabase
}

export function EntityStatsOverview({ useSQLite = true }: EntityStatsOverviewProps) {
  // Use the SQLite hook for entity counts
  const { counts, isLoading, error } = useSQLiteEntityCounts();
  
  // Show loading state
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Entity Statistics</CardTitle>
          <CardDescription>Overview of entities in the system</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center items-center py-10">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }
  
  // Show error state
  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Entity Statistics</CardTitle>
          <CardDescription>Overview of entities in the system</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md bg-destructive/15 p-4 text-destructive">
            <p>Failed to load entity statistics: {error.message}</p>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  // Format numbers with commas
  const formatNumber = (num: number) => {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Entity Statistics</CardTitle>
        <CardDescription>Overview of entities in the system</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="flex items-center p-4 border rounded-lg">
            <Grid2X2Icon className="mr-3 h-5 w-5 text-blue-500" />
            <div>
              <p className="text-sm font-medium">Repositories</p>
              <p className="text-2xl font-bold">{formatNumber(counts.repositories)}</p>
              <p className="text-xs text-muted-foreground">
                {formatNumber(counts.enriched_repositories || 0)} enriched
              </p>
            </div>
          </div>
          
          <div className="flex items-center p-4 border rounded-lg">
            <UsersIcon className="mr-3 h-5 w-5 text-green-500" />
            <div>
              <p className="text-sm font-medium">Contributors</p>
              <p className="text-2xl font-bold">{formatNumber(counts.contributors)}</p>
              <p className="text-xs text-muted-foreground">
                {formatNumber(counts.enriched_contributors || 0)} enriched
              </p>
            </div>
          </div>
          
          <div className="flex items-center p-4 border rounded-lg">
            <GitPullRequestIcon className="mr-3 h-5 w-5 text-purple-500" />
            <div>
              <p className="text-sm font-medium">Merge Requests</p>
              <p className="text-2xl font-bold">{formatNumber(counts.mergeRequests)}</p>
              <p className="text-xs text-muted-foreground">
                {formatNumber(counts.enriched_merge_requests || 0)} enriched
              </p>
            </div>
          </div>
          
          <div className="flex items-center p-4 border rounded-lg">
            <GitCommitIcon className="mr-3 h-5 w-5 text-orange-500" />
            <div>
              <p className="text-sm font-medium">Commits</p>
              <p className="text-2xl font-bold">{formatNumber(counts.commits)}</p>
              <p className="text-xs text-muted-foreground">
                {formatNumber(counts.enriched_commits || 0)} enriched
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 