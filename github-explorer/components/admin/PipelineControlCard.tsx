'use client';

import React, { useEffect, useRef, useState } from 'react';
import { StatsCard } from '@/components/ui/stats-card';
import { formatDistanceToNow } from 'date-fns';
import { usePipelineStatus } from '@/hooks/admin/use-pipeline-status';
import { usePipelineOperations } from '@/hooks/admin/use-pipeline-operations';
import { usePipelineStats } from '@/hooks/admin/use-pipeline-stats';
import { useAdminEvents } from './AdminEventContext';
import { useEntityCounts } from '@/hooks/admin/use-entity-counts';
import { 
  GitBranch, 
  Database, 
  UserPlus, 
  Loader2, 
  AlertCircle,
  PlayCircle,
  StopCircle,
  Activity
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import { apiClient } from '@/lib/client/api-client';

type PipelineType = 'github_sync' | 'data_processing' | 'data_enrichment';

export interface PipelineControlCardProps {
  pipelineType: PipelineType;
  title: string;
  description: string;
}

export function PipelineControlCard({ 
  pipelineType,
  title,
  description,
}: PipelineControlCardProps) {
  // Use the pipeline status hook
  const { 
    status, 
    isLoading, 
    error, 
    refetch 
  } = usePipelineStatus(pipelineType);
  
  // Use the pipeline stats hook
  const { stats, isLoading: statsLoading } = usePipelineStats();
  
  // We don't need these from the hook anymore as we're going back to direct API calls
  const { 
    startPipeline, 
    stopPipeline, 
    isStarting: hookIsStarting, 
    isStopping: hookIsStopping 
  } = usePipelineOperations();
  
  // Create local state for tracking loading states
  const [localIsStarting, setLocalIsStarting] = useState<Record<PipelineType, boolean>>({
    github_sync: false,
    data_processing: false,
    data_enrichment: false
  });
  
  const [localIsStopping, setLocalIsStopping] = useState<Record<PipelineType, boolean>>({
    github_sync: false,
    data_processing: false,
    data_enrichment: false
  });
  
  // Get entity counts for displaying numbers
  const { counts } = useEntityCounts();
  
  // Use ref to track polling interval
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  // Use the admin events context for real-time updates
  const { latestEventsByType } = useAdminEvents();
  
  // State to track live activity progress
  const [currentActivity, setCurrentActivity] = useState<string | null>(null);
  const [itemsProcessed, setItemsProcessed] = useState<number | null>(null);
  
  // Set up polling when the pipeline is running
  useEffect(() => {
    // Clear any existing interval
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
    
    // If the pipeline is running, start polling for updates
    if (status?.isRunning) {
      pollingIntervalRef.current = setInterval(() => {
        refetch();
      }, 2000); // Poll every 2 seconds
    }
    
    // Cleanup on unmount
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, [status?.isRunning, refetch]);
  
  // Update state based on real-time events
  useEffect(() => {
    // Look for events related to this pipeline type
    const relevantEvents = [
      'pipeline_started',
      'pipeline_progress',
      'pipeline_execution_completed',
      'pipeline_error',
      'pipeline_stopped'
    ];
    
    for (const eventType of relevantEvents) {
      const event = latestEventsByType[eventType];
      if (event && event.data && event.data.pipelineType === pipelineType) {
        // We found an event for this pipeline
        
        // Update UI based on event type
        if (eventType === 'pipeline_progress' && event.data.progress) {
          setCurrentActivity(event.data.progress.currentStep || event.data.progress.phase || null);
          setItemsProcessed(event.data.progress.itemsProcessed || null);
        } else if (eventType === 'pipeline_execution_completed') {
          setCurrentActivity(null);
          setItemsProcessed(event.data.itemsProcessed || null);
          // Refetch to update status
          refetch();
        } else if (eventType === 'pipeline_started') {
          setCurrentActivity('Starting pipeline...');
          setItemsProcessed(null);
          // Refetch to update status
          refetch();
        } else if (eventType === 'pipeline_stopped' || eventType === 'pipeline_error') {
          setCurrentActivity(null);
          setItemsProcessed(null);
          // Refetch to update status
          refetch();
        }
        
        // No need to check further events
        break;
      }
    }
  }, [latestEventsByType, pipelineType, refetch]);
  
  // Get the updated title based on pipeline type
  const getUpdatedTitle = () => {
    switch (pipelineType) {
      case 'github_sync':
        return "Closed Merge Requests";
      case 'data_processing':
        return "Pending Entity Extraction";
      case 'data_enrichment':
        return "Pending Entity Enrichment";
      default:
        return title;
    }
  };
  
  // Get the updated description based on pipeline type
  const getUpdatedDescription = () => {
    switch (pipelineType) {
      case 'github_sync':
        return "Pull new raw data from recent merge requests";
      case 'data_processing':
        return "Process raw GitHub data into entities";
      case 'data_enrichment':
        return "Enrich extracted entities with details";
      default:
        return description;
    }
  };
  
  // Get the appropriate icon based on pipeline type
  const getIcon = () => {
    switch (pipelineType) {
      case 'github_sync':
        return <GitBranch className="h-5 w-5" />;
      case 'data_processing':
        return <Database className="h-5 w-5" />;
      case 'data_enrichment':
        return <UserPlus className="h-5 w-5" />;
      default:
        return <Database className="h-5 w-5" />;
    }
  };
  
  // Format the last run date
  const getFormattedDate = () => {
    if (!status?.lastRun) return 'Never';
    
    try {
      return formatDistanceToNow(new Date(status.lastRun), { addSuffix: true });
    } catch (e) {
      return 'Invalid date';
    }
  };
  
  // Get the status badge color
  const getStatusColor = () => {
    if (!status) return 'gray';
    
    if (status.isActive) {
      return status.isRunning ? 'yellow' : 'green';
    }
    
    return 'gray';
  };
  
  // Get the count of relevant items for this pipeline
  const getItemCount = () => {
    if (!stats) return 0;
    
    switch (pipelineType) {
      case 'github_sync':
        // Show total count of all closed raw merge requests
        return stats.closedMergeRequestsRaw || 0;
      case 'data_processing':
        // Show count of unprocessed raw merge requests
        return stats.unprocessedMergeRequests || 0;
      case 'data_enrichment':
        // Use totalUnenriched directly instead of calculating
        return stats.totalUnenriched || 0;
      default:
        return 0;
    }
  };
  
  // Get the status text with count
  const getStatusText = () => {
    if (!status) return 'Unknown';
    
    const count = getItemCount();
    
    if (status.isActive && status.isRunning) {
      return `Running (${count})`;
    }
    
    // Show items remaining count
    return count > 0 ? `${count} pending` : 'No items pending';
  };
  
  // Handle start button click
  const handleStart = async () => {
    try {
      // Set loading state for this pipeline type
      setLocalIsStarting(prev => ({...prev, [pipelineType]: true}));
      
      // Debugging: Log pipeline type being passed to API
      console.log("Starting pipeline with type:", pipelineType);
      
      // Use the API client
      const result = await apiClient.pipeline.start(pipelineType);
      
      // Show success toast
      toast({
        title: "Pipeline Started",
        description: `Started ${pipelineType} pipeline successfully`,
        variant: "default"
      });
      
      // Immediately refetch status to potentially clear "running" state
      // if the execution completed directly
      refetch();
    } catch (error) {
      console.error("Error starting pipeline:", error);
      // Show error toast
      toast({
        title: "Pipeline Start Failed",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive"
      });
    } finally {
      // Reset loading state
      setLocalIsStarting(prev => ({...prev, [pipelineType]: false}));
    }
  };
  
  // Handle stop button click
  const handleStop = async () => {
    try {
      // Set loading state for this pipeline type
      setLocalIsStopping(prev => ({...prev, [pipelineType]: true}));
      
      // Use the API client
      const result = await apiClient.pipeline.stop(pipelineType);
      
      // Show success toast
      toast({
        title: "Pipeline Stopped",
        description: `Stopped ${pipelineType} pipeline successfully`,
        variant: "default"
      });
      
      refetch();
    } catch (error) {
      console.error("Error stopping pipeline:", error);
      // Show error toast
      toast({
        title: "Pipeline Stop Failed",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive"
      });
    } finally {
      // Reset loading state
      setLocalIsStopping(prev => ({...prev, [pipelineType]: false}));
    }
  };
  
  // Render action buttons
  const renderActionButtons = () => {
    const isRunning = status?.isRunning;
    const loading = localIsStarting[pipelineType] || localIsStopping[pipelineType];
    
    return (
      <>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={handleStart}
          disabled={loading || isRunning}
        >
          {localIsStarting[pipelineType] ? (
            <Loader2 className="h-4 w-4 mr-1 animate-spin" />
          ) : (
            <PlayCircle className="h-4 w-4 mr-1" />
          )}
          Start
        </Button>
        
        {isRunning && (
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleStop}
            disabled={loading}
          >
            {localIsStopping[pipelineType] ? (
              <Loader2 className="h-4 w-4 mr-1 animate-spin" />
            ) : (
              <StopCircle className="h-4 w-4 mr-1" />
            )}
            Stop
          </Button>
        )}
      </>
    );
  };
  
  // Render live activity indicator
  const renderLiveActivity = () => {
    if (!currentActivity) return null;
    
    return (
      <div className="flex items-center mt-2 text-xs text-muted-foreground">
        <Activity className="h-3 w-3 mr-1 animate-pulse text-yellow-500" />
        <span>
          {currentActivity}
          {itemsProcessed !== null && ` (${itemsProcessed} items)`}
        </span>
      </div>
    );
  };
  
  if (error) {
    return (
      <StatsCard
        title={getUpdatedTitle()}
        value="Error"
        description={getUpdatedDescription()}
        icon={<AlertCircle className="h-5 w-5 text-red-500" />}
        footer={`Failed to load status`}
        color="red"
        actionButtons={renderActionButtons()}
      />
    );
  }
  
  return (
    <StatsCard
      title={getUpdatedTitle()}
      icon={getIcon()}
      description={getUpdatedDescription()}
      value={isLoading ? 'Loading...' : getStatusText()}
      valueColor={getStatusColor()}
      footer={
        <div className="flex w-full justify-between items-center">
          <div className="text-xs text-muted-foreground">
            Last run: {isLoading ? '...' : getFormattedDate()}
            {renderLiveActivity()}
          </div>
          <div className="flex gap-2">
            {renderActionButtons()}
          </div>
        </div>
      }
    />
  );
} 