import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

/**
 * POST handler for pipeline operations
 * Triggers operations on the Node.js server for different pipeline types
 */
export async function POST(request: NextRequest) {
  try {
    const requestBody = await request.json();
    
    // Support both camelCase and snake_case parameter names
    const { 
      operation, 
      pipelineType, 
      pipeline_type,
      parameters
    } = requestBody;
    
    // Use snake_case params if available, otherwise use camelCase
    const actualOperation = operation;
    const actualPipelineType = pipeline_type || pipelineType;
    
    if (!actualOperation) {
      return NextResponse.json({ error: 'Operation is required' }, { status: 400 });
    }
    
    if (!actualPipelineType) {
      return NextResponse.json({ error: 'Pipeline type is required' }, { status: 400 });
    }
    
    // Validate operation is one of start, stop, restart
    if (!['start', 'stop', 'restart'].includes(actualOperation)) {
      return NextResponse.json({ error: 'Invalid operation' }, { status: 400 });
    }
    
    // Create a history record
    const supabase = createServerSupabaseClient();
    
    // Check server URL configuration
    const serverUrl = process.env.PIPELINE_SERVER_URL;
    if (!serverUrl) {
      console.error('PIPELINE_SERVER_URL environment variable is not configured');
      return NextResponse.json({ 
        error: 'Pipeline server URL not configured in environment variables',
        details: 'Please configure PIPELINE_SERVER_URL in .env or .env.local' 
      }, { status: 500 });
    }
    
    console.log(`Connecting to pipeline server at: ${serverUrl}/api/pipeline/${actualOperation}`);
    
    // Log the started operation to pipeline_history
    // Note: Removed 'parameters' field as it doesn't exist in the table schema
    console.log(`Creating pipeline history entry for ${actualPipelineType}`);
    const { data: historyEntry, error: historyError } = await supabase
      .from('pipeline_history')
      .insert({
        pipeline_type: actualPipelineType,
        status: actualOperation === 'stop' ? 'failed' : 'running',
        started_at: new Date().toISOString(),
        completed_at: actualOperation === 'stop' ? new Date().toISOString() : null,
        items_processed: 0
      })
      .select()
      .single();
    
    if (historyError) {
      console.error('Error creating pipeline history entry:', historyError);
      
      // Check if it's an RLS policy error
      if (historyError.code === 'PGRST301') {
        return NextResponse.json({ 
          error: 'Database permission denied: Row-level security policy prevented the operation',
          details: 'Your user role may not have permission to insert records into the pipeline_history table.',
          originalError: historyError
        }, { status: 403 });
      }
      
      return NextResponse.json({ 
        error: historyError.message, 
        details: historyError.details || 'Check server logs for more information',
        code: historyError.code
      }, { status: 500 });
    }
    
    // Call pipeline server to execute the operation
    try {
      const serverApiUrl = `${serverUrl}/api/pipeline/${actualOperation}`;
      console.log(`Sending request to pipeline server: ${serverApiUrl}`);
      
      const serverResponse = await fetch(serverApiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': process.env.PIPELINE_SERVER_API_KEY || ''
        },
        body: JSON.stringify({
          pipeline_type: actualPipelineType,
          parameters,
          history_id: historyEntry.id
        }),
      });
      
      if (!serverResponse.ok) {
        const serverError = await serverResponse.json().catch(() => ({ error: 'Unknown server error' }));
        console.error('Pipeline server returned an error:', serverError);
        return NextResponse.json({ error: `Pipeline server error: ${serverError.error || serverResponse.statusText}` }, { status: 500 });
      }
      
      const serverData = await serverResponse.json();
      return NextResponse.json({ success: true, data: serverData });
    } catch (error: any) {
      console.error('Error calling pipeline server:', error);
      
      // Update history entry to show failure
      await supabase
        .from('pipeline_history')
        .update({
          status: 'failed',
          completed_at: new Date().toISOString(),
          error_message: `Failed to connect to pipeline server: ${error.message || 'Unknown error'}`
        })
        .eq('id', historyEntry.id);
      
      // Check if it's a connection error and provide helpful message
      const isConnectionError = error.code === 'UND_ERR_SOCKET' || 
                               error.code === 'ECONNREFUSED' ||
                               error.message?.includes('fetch failed');
      
      if (isConnectionError) {
        return NextResponse.json({ 
          error: 'Cannot connect to pipeline server',
          details: `Make sure the pipeline server is running at ${serverUrl} and accessible`
        }, { status: 503 });
      }
      
      return NextResponse.json({ 
        error: `Error calling pipeline server: ${error.message}`,
        details: 'Check server logs for more information'
      }, { status: 500 });
    }
  } catch (error: any) {
    console.error('Unexpected error in pipeline operations API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 