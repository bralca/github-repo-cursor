'use client';

import React, { useEffect } from 'react';
import { useEntityCounts } from '@/hooks/admin/use-entity-counts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Grid2X2Icon, UsersIcon, GitPullRequestIcon, GitCommitIcon, Loader2, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatDistanceToNow } from 'date-fns';
import { useAdminEvents } from './AdminEventContext';

interface EntityStatsOverviewProps {}

export function EntityStatsOverview({}: EntityStatsOverviewProps) {
  // The hook is already using the new API
  const { counts, isLoading, error, refetch } = useEntityCounts();
  
  // Use the admin events context for real-time updates
  const { connectionStatus, lastEventTimestamp, latestEventsByType } = useAdminEvents();
  
  // Trigger a refetch when pipeline events are received
  useEffect(() => {
    // These are the event types that should trigger a refetch
    const refetchTriggerEvents = [
      'pipeline_execution_completed',
      'pipeline_status_changed',
      'pipeline_progress'
    ];
    
    // Check if we have any of these events in the latest events
    const shouldRefetch = refetchTriggerEvents.some(
      eventType => latestEventsByType[eventType]
    );
    
    if (shouldRefetch) {
      refetch();
    }
  }, [latestEventsByType, refetch]);
  
  // Format the last updated timestamp
  const getLastUpdatedText = () => {
    if (!lastEventTimestamp) {
      return 'Never updated';
    }
    
    try {
      return `Last updated ${formatDistanceToNow(new Date(lastEventTimestamp), { addSuffix: true })}`;
    } catch (e) {
      return 'Last updated: Unknown';
    }
  };
  
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
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Entity Statistics</CardTitle>
          <CardDescription>Overview of entities in the system</CardDescription>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => refetch()}
          className="ml-auto"
        >
          <RefreshCw className="h-4 w-4 mr-1" />
          Refresh
        </Button>
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
      <CardFooter className="flex justify-between items-center text-xs text-muted-foreground">
        <div>{getLastUpdatedText()}</div>
        <div className="flex items-center">
          <div className={`w-2 h-2 rounded-full mr-2 ${
            connectionStatus === 'connected' ? 'bg-green-500' : 
            connectionStatus === 'connecting' ? 'bg-yellow-500' : 'bg-gray-500'
          }`} />
          <span>
            {connectionStatus === 'connected' ? 'Live updates active' : 
             connectionStatus === 'connecting' ? 'Connecting...' : 'Live updates inactive'}
          </span>
        </div>
      </CardFooter>
    </Card>
  );
} 