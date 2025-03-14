'use client';

import React from 'react';
import { StatsCard } from '@/components/ui/stats-card';
import { formatDistanceToNow } from 'date-fns';
import { usePipelineStatus } from '@/hooks/admin/use-pipeline-status';
import { usePipelineOperations } from '@/hooks/admin/use-pipeline-operations';
import { 
  GitBranch, 
  Database, 
  UserPlus, 
  Brain, 
  Loader2, 
  AlertCircle,
  PlayCircle,
  StopCircle 
} from 'lucide-react';
import { Button } from '@/components/ui/button';

type PipelineType = 'github_sync' | 'data_processing' | 'data_enrichment' | 'ai_analysis';

export interface PipelineControlCardProps {
  pipelineType: PipelineType;
  title: string;
  description: string;
}

export function PipelineControlCard({ 
  pipelineType,
  title,
  description
}: PipelineControlCardProps) {
  const { status, isLoading, error, refetch } = usePipelineStatus(pipelineType);
  const { startPipeline, stopPipeline, isStarting, isStopping } = usePipelineOperations();
  
  // Get the updated title based on pipeline type
  const getUpdatedTitle = () => {
    switch (pipelineType) {
      case 'github_sync':
        return "Closed Merge Requests";
      case 'data_processing':
        return "Pending Entity Extraction";
      case 'data_enrichment':
        return "Pending Entity Enrichment";
      case 'ai_analysis':
        return "Pending AI Analysis";
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
      case 'ai_analysis':
        return "Analyze data with AI for insights";
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
      case 'ai_analysis':
        return <Brain className="h-5 w-5" />;
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
  
  // Get the status text
  const getStatusText = () => {
    if (!status) return 'Unknown';
    
    if (status.isActive) {
      return status.isRunning ? 'Running' : 'Active';
    }
    
    return 'Inactive';
  };
  
  // Handle start button click
  const handleStart = async () => {
    await startPipeline(pipelineType);
    refetch();
  };
  
  // Handle stop button click
  const handleStop = async () => {
    await stopPipeline(pipelineType);
    refetch();
  };
  
  // Render action buttons
  const renderActionButtons = () => {
    const isRunning = status?.isRunning;
    const loading = isStarting[pipelineType] || isStopping[pipelineType];
    
    return (
      <>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={handleStart}
          disabled={loading || isRunning}
        >
          {isStarting[pipelineType] ? (
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
            {isStopping[pipelineType] ? (
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
      value={isLoading ? '...' : status?.itemCount?.toString() || '0'}
      description={getUpdatedDescription()}
      icon={isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : getIcon()}
      footer={isLoading ? 'Loading...' : `Last run: ${getFormattedDate()}`}
      color={getStatusColor()}
      statusText={getStatusText()}
      actionButtons={renderActionButtons()}
    />
  );
} 