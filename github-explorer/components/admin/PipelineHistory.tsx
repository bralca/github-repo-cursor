'use client';

import { useState, useEffect } from 'react';
import { useSupabaseQuery } from '@/hooks/supabase/use-supabase-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Loader2, RefreshCw, Trash2 } from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface PipelineRun {
  id: string;
  pipeline_type: string;
  started_at: string;
  completed_at: string | null;
  status: 'running' | 'completed' | 'failed';
  items_processed: number;
  error_message: string | null;
  created_at: string;
}

export function PipelineHistory() {
  const [pipelineType, setPipelineType] = useState<string | undefined>(undefined);
  const [isCleaningUp, setIsCleaningUp] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  
  const { data: pipelineHistory, isLoading, error, refetch } = useSupabaseQuery<PipelineRun[]>(
    ['pipeline-history', pipelineType || 'all'],
    async () => {
      const url = pipelineType 
        ? `/api/pipeline-history?pipeline_type=${pipelineType}&limit=10`
        : '/api/pipeline-history?limit=10';
        
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Failed to fetch pipeline history');
      }
      const data = await response.json();
      return { data: data.history || [], error: null };
    },
    { refetchInterval: 30000 } // Refetch every 30 seconds
  );
  
  // Format date for display
  const formatDate = (date: string) => {
    try {
      return format(new Date(date), 'MMM d, yyyy HH:mm:ss');
    } catch (e) {
      return 'Invalid date';
    }
  };
  
  // Format duration
  const formatDuration = (startDate: string, endDate: string | null) => {
    if (!endDate) return 'In progress';
    
    try {
      const start = new Date(startDate).getTime();
      const end = new Date(endDate).getTime();
      const durationMs = end - start;
      
      // Format as mm:ss if less than an hour, otherwise as hh:mm:ss
      const seconds = Math.floor((durationMs / 1000) % 60);
      const minutes = Math.floor((durationMs / (1000 * 60)) % 60);
      const hours = Math.floor(durationMs / (1000 * 60 * 60));
      
      if (hours > 0) {
        return `${hours}h ${minutes}m ${seconds}s`;
      } else {
        return `${minutes}m ${seconds}s`;
      }
    } catch (e) {
      return 'Unknown';
    }
  };
  
  // Get status badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'running':
        return (
          <Badge variant="secondary" className="flex items-center gap-1">
            <Loader2 className="h-3 w-3 animate-spin" />
            Running
          </Badge>
        );
      case 'completed':
        return <Badge variant="success">Completed</Badge>;
      case 'failed':
        return <Badge variant="destructive">Failed</Badge>;
      default:
        return <Badge>Unknown</Badge>;
    }
  };
  
  // Handle cleanup of stale runs
  const handleCleanupStaleRuns = async () => {
    try {
      setIsCleaningUp(true);
      const response = await fetch('/api/pipeline-history/cleanup', {
        method: 'POST',
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to clean up stale runs');
      }
      
      const data = await response.json();
      toast({
        title: "Cleanup Successful",
        description: data.message,
      });
      
      // Refetch history to show updated data
      refetch();
    } catch (error) {
      console.error('Error cleaning up stale runs:', error);
      toast({
        title: "Cleanup Failed",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive",
      });
    } finally {
      setIsCleaningUp(false);
    }
  };
  
  // Handle clearing history
  const handleClearHistory = async () => {
    try {
      setIsClearing(true);
      const response = await fetch('/api/pipeline-history/clear', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ pipelineType }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to clear history');
      }
      
      const data = await response.json();
      toast({
        title: "History Cleared",
        description: data.message,
      });
      
      // Refetch history to show updated data
      refetch();
    } catch (error) {
      console.error('Error clearing history:', error);
      toast({
        title: "Clear Failed",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive",
      });
    } finally {
      setIsClearing(false);
    }
  };
  
  // In the Select component's onValueChange handler, specify the type
  const handlePipelineTypeChange = (value: string) => {
    // If the value is "all", set it to undefined to show all pipeline types
    setPipelineType(value === "all" ? undefined : value);
  };
  
  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between py-4">
        <div>
          <CardTitle>Recent Pipeline Runs</CardTitle>
          <CardDescription>History of recent pipeline executions</CardDescription>
        </div>
        <div className="flex space-x-2">
          <Select 
            value={pipelineType || "all"} 
            onValueChange={handlePipelineTypeChange}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="All pipeline types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All pipeline types</SelectItem>
              <SelectItem value="github_sync">GitHub Sync</SelectItem>
              <SelectItem value="data_processing">Data Processing</SelectItem>
              <SelectItem value="data_enrichment">Data Enrichment</SelectItem>
              <SelectItem value="ai_analysis">AI Analysis</SelectItem>
            </SelectContent>
          </Select>
          
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleCleanupStaleRuns}
            disabled={isCleaningUp}
          >
            {isCleaningUp ? (
              <Loader2 className="h-4 w-4 mr-1 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-1" />
            )}
            Fix Stale Runs
          </Button>
          
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleClearHistory}
            disabled={isClearing}
          >
            {isClearing ? (
              <Loader2 className="h-4 w-4 mr-1 animate-spin" />
            ) : (
              <Trash2 className="h-4 w-4 mr-1" />
            )}
            Clear History
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : error ? (
          <div className="text-red-500 p-4 text-center">
            Failed to load pipeline history. Please try again later.
          </div>
        ) : pipelineHistory && pipelineHistory.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Pipeline</TableHead>
                <TableHead>Started</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Items</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pipelineHistory.map((run) => (
                <TableRow key={run.id}>
                  <TableCell className="font-medium">
                    {run.pipeline_type.replace(/_/g, ' ')}
                  </TableCell>
                  <TableCell>{formatDate(run.started_at)}</TableCell>
                  <TableCell>
                    {formatDuration(run.started_at, run.completed_at)}
                  </TableCell>
                  <TableCell>{run.items_processed}</TableCell>
                  <TableCell>{getStatusBadge(run.status)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="text-center p-4 text-muted-foreground">
            No pipeline run history available yet.
          </div>
        )}
      </CardContent>
    </Card>
  );
} 