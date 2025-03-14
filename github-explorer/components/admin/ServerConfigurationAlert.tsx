'use client';

import { useState } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function ServerConfigurationAlert() {
  const [isShowingDetails, setIsShowingDetails] = useState(false);
  
  return (
    <Alert variant="destructive" className="mb-4">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>Server Configuration Required</AlertTitle>
      <AlertDescription className="mt-2">
        <p className="mb-2">
          Pipeline operations require a Node.js server to be configured. Manual pipeline operations 
          will not work until this is set up.
        </p>
        
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => setIsShowingDetails(!isShowingDetails)}
          className="mt-2"
        >
          {isShowingDetails ? 'Hide Instructions' : 'Show Setup Instructions'}
        </Button>
        
        {isShowingDetails && (
          <div className="mt-4 space-y-3 p-3 border rounded-md bg-slate-50 dark:bg-slate-900">
            <p className="text-sm">
              To enable pipeline operations, add the following environment variables to your .env file:
            </p>
            
            <pre className="text-xs p-2 rounded-md bg-slate-100 dark:bg-slate-800 overflow-x-auto">
              PIPELINE_SERVER_URL=http://your-server-url<br />
              PIPELINE_SERVER_API_KEY=your-api-key
            </pre>
            
            <p className="text-sm mt-2">
              Then, ensure your Node.js server is running and configured to handle pipeline operations 
              at the following endpoints:
            </p>
            
            <pre className="text-xs p-2 rounded-md bg-slate-100 dark:bg-slate-800 overflow-x-auto">
              POST /api/pipeline/start - Start a pipeline<br />
              POST /api/pipeline/stop - Stop a running pipeline
            </pre>
            
            <p className="text-sm mt-2">
              Your server should accept a payload with <code className="text-xs p-1 rounded bg-slate-200 dark:bg-slate-700">pipelineType</code> and <code className="text-xs p-1 rounded bg-slate-200 dark:bg-slate-700">runId</code>.
            </p>
          </div>
        )}
      </AlertDescription>
    </Alert>
  );
} 