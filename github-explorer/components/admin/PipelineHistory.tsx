'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Loader2, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { usePipelineHistory } from '@/hooks/admin/use-pipeline-history';

interface PipelineRun {
  id: string;
  pipelineType: string;
  startedAt: string;
  completedAt: string | null;
  status: 'running' | 'completed' | 'failed';
  itemsProcessed: number | null;
  errorMessage: string | null;
}

interface PipelineHistoryProps {
  useSQLite?: boolean; // Flag kept for backward compatibility
}

export function PipelineHistory({ useSQLite = true }: PipelineHistoryProps) {
  const [pipelineType, setPipelineType] = useState<string | undefined>(undefined);
  const [isClearing, setIsClearing] = useState(false);
  
  // Use the new API hook for pipeline history
  const { 
    history, 
    isLoading, 
    error,
    refetch,
    clearHistory,
    isClearing: isClearingFromHook
  } = usePipelineHistory(pipelineType);
  
  // Format date for display
  const formatDate = (date: string | null) => {
    if (!date) return 'N/A';
    
    try {
      return format(new Date(date), 'MMM d, yyyy HH:mm:ss');
    } catch (e) {
      console.error('Error formatting date:', e);
      return 'Invalid date';
    }
  };
  
  // Format duration
  const formatDuration = (startDate: string | null, endDate: string | null) => {
    if (!startDate || !endDate) return 'In progress';
    
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
  
  // Handle clearing history
  const handleClearHistory = () => {
    clearHistory();
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
            onClick={handleClearHistory}
            disabled={isClearingFromHook}
          >
            {isClearingFromHook ? (
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
        ) : history && history.length > 0 ? (
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
              {history.map((run) => (
                <TableRow key={run.id}>
                  <TableCell className="font-medium">
                    {run.pipelineType.replace(/_/g, ' ')}
                  </TableCell>
                  <TableCell>{formatDate(run.startedAt)}</TableCell>
                  <TableCell>
                    {formatDuration(run.startedAt, run.completedAt)}
                  </TableCell>
                  <TableCell>{run.itemsProcessed}</TableCell>
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