import { NextRequest, NextResponse } from 'next/server';
import { withDb } from '@/lib/database/connection';

/**
 * Handler for pipeline operations endpoint
 */
export async function handlePipelineOperations(request: NextRequest) {
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
    const now = new Date().toISOString();
    
    // Insert history record and get the ID
    const historyId = await withDb(async (db) => {
      // Log the started operation to pipeline_history
      const historyResult = await db.run(
        `INSERT INTO pipeline_history 
         (pipeline_type, status, started_at, completed_at, items_processed) 
         VALUES (?, ?, ?, ?, ?)`,
        [
          actualPipelineType,
          actualOperation === 'stop' ? 'stopped' : 'running',
          now,
          actualOperation === 'stop' ? now : null,
          0
        ]
      );
      
      return historyResult.lastID;
    });
    
    // Check server URL configuration
    const serverUrl = process.env.PIPELINE_SERVER_URL;
    if (!serverUrl) {
      console.error('PIPELINE_SERVER_URL environment variable is not configured');
      
      // Update history entry to show failure
      await withDb(async (db) => {
        await db.run(
          `UPDATE pipeline_history 
           SET status = ?, completed_at = ?, error_message = ? 
           WHERE id = ?`,
          ['failed', now, 'Pipeline server URL not configured', historyId]
        );
      });
      
      return NextResponse.json({ 
        error: 'Pipeline server URL not configured in environment variables',
        details: 'Please configure PIPELINE_SERVER_URL in .env or .env.local' 
      }, { status: 500 });
    }
    
    console.log(`Connecting to pipeline server at: ${serverUrl}/api/pipeline/${actualOperation}`);
    
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
          history_id: historyId
        }),
      });
      
      if (!serverResponse.ok) {
        const serverError = await serverResponse.json().catch(() => ({ error: 'Unknown server error' }));
        console.error('Pipeline server returned an error:', serverError);
        
        // Update history entry to show failure
        await withDb(async (db) => {
          await db.run(
            `UPDATE pipeline_history 
             SET status = ?, completed_at = ?, error_message = ? 
             WHERE id = ?`,
            ['failed', new Date().toISOString(), `Pipeline server error: ${serverError.error || serverResponse.statusText}`, historyId]
          );
        });
        
        return NextResponse.json({ error: `Pipeline server error: ${serverError.error || serverResponse.statusText}` }, { status: 500 });
      }
      
      const serverData = await serverResponse.json();
      
      return NextResponse.json({ success: true, data: serverData });
    } catch (error: any) {
      console.error('Error calling pipeline server:', error);
      
      // Update history entry to show failure
      await withDb(async (db) => {
        await db.run(
          `UPDATE pipeline_history 
           SET status = ?, completed_at = ?, error_message = ? 
           WHERE id = ?`,
          ['failed', new Date().toISOString(), `Failed to connect to pipeline server: ${error.message || 'Unknown error'}`, historyId]
        );
      });
      
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