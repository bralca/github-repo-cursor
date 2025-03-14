'use client';

import { useState, useEffect } from 'react';
import { AlertCircle, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSupabaseQuery } from '@/hooks/supabase/use-supabase-query';
import { useMutation, useQueryClient } from '@tanstack/react-query';

interface ErrorNotificationProps {
  pipelineType?: string;
}

interface PipelineError {
  id: string;
  pipeline_type: string;
  error_message: string;
  created_at: string;
}

export function ErrorNotification({ pipelineType }: ErrorNotificationProps) {
  const [dismissedErrors, setDismissedErrors] = useState<Set<string>>(new Set());
  const queryClient = useQueryClient();

  // Fetch recent pipeline errors
  const { data: errors, isLoading, error } = useSupabaseQuery<PipelineError[]>(
    ['pipeline-errors', pipelineType || 'all'],
    async () => {
      const url = pipelineType 
        ? `/api/pipeline-history?pipeline_type=${pipelineType}&status=failed&limit=5`
        : '/api/pipeline-history?status=failed&limit=5';
        
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Failed to fetch pipeline errors');
      }
      const data = await response.json();
      return { data: data.history || [], error: null };
    },
    { refetchInterval: 60000 } // Refetch every minute
  );

  // Mutation to retry a failed pipeline run
  const retryPipeline = useMutation({
    mutationFn: async (runId: string) => {
      const response = await fetch('/api/pipeline-retry', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ runId }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to retry pipeline');
      }
      
      return response.json();
    },
    onSuccess: () => {
      // Invalidate relevant queries to refetch data
      queryClient.invalidateQueries({ queryKey: ['pipeline-errors'] });
      queryClient.invalidateQueries({ queryKey: ['pipeline-history'] });
    },
  });

  // Filter out dismissed errors
  const activeErrors = errors?.filter(err => !dismissedErrors.has(err.id)) || [];

  // Handler to dismiss an error notification
  const handleDismiss = (errorId: string) => {
    setDismissedErrors(prev => new Set([...prev, errorId]));
  };

  // Handler to retry a failed pipeline run
  const handleRetry = (errorId: string) => {
    retryPipeline.mutate(errorId);
    // Also dismiss the error
    handleDismiss(errorId);
  };

  if (isLoading || activeErrors.length === 0) {
    return null; // Don't show anything if loading or no errors
  }

  return (
    <div className="space-y-2">
      {activeErrors.map(err => (
        <div 
          key={err.id} 
          className="flex items-start p-4 rounded-md bg-red-50 border border-red-200 text-red-700"
        >
          <AlertCircle className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <div className="font-medium">
              Pipeline Error: {err.pipeline_type.replace(/_/g, ' ')}
            </div>
            <p className="text-sm mt-1">{err.error_message}</p>
            <div className="mt-2 flex space-x-2">
              <Button 
                size="sm" 
                variant="outline" 
                className="text-xs h-7 bg-white border-red-200 hover:bg-red-50 hover:text-red-700"
                onClick={() => handleRetry(err.id)}
                disabled={retryPipeline.isPending}
              >
                Retry Pipeline
              </Button>
            </div>
          </div>
          <Button 
            size="sm" 
            variant="ghost" 
            className="ml-2 h-6 w-6 p-0" 
            onClick={() => handleDismiss(err.id)}
          >
            <span className="sr-only">Dismiss</span>
            <X className="h-4 w-4" />
          </Button>
        </div>
      ))}
    </div>
  );
} 