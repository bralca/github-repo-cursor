import { NextRequest, NextResponse } from 'next/server';
import { withDb } from '@/lib/database/connection';

/**
 * Handles operations related to the pipeline like start, stop, schedule
 */
export async function handlePipelineOperations(request: NextRequest) {
  try {
    // Parse the request body
    const body = await request.json();
    const { operation, pipelineType } = body;
    
    if (!operation) {
      return NextResponse.json(
        { error: 'Operation is required' },
        { status: 400 }
      );
    }
    
    if (!pipelineType) {
      return NextResponse.json(
        { error: 'Pipeline type is required' },
        { status: 400 }
      );
    }
    
    // Handle different operations
    switch (operation) {
      case 'start':
        return await startPipeline(pipelineType);
        
      case 'stop':
        return await stopPipeline(pipelineType);
        
      case 'toggle_schedule':
        const { isActive } = body;
        if (isActive === undefined) {
          return NextResponse.json(
            { error: 'isActive parameter is required for toggle_schedule' },
            { status: 400 }
          );
        }
        return await toggleSchedule(pipelineType, isActive);
        
      default:
        return NextResponse.json(
          { error: `Unknown operation: ${operation}` },
          { status: 400 }
        );
    }
  } catch (error: any) {
    console.error('Error in pipeline operations API:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Start a pipeline by sending a request to the pipeline server
 */
async function startPipeline(pipelineType: string) {
  try {
    // Call the pipeline server to start the pipeline
    const serverUrl = process.env.PIPELINE_SERVER_URL;
    const apiKey = process.env.PIPELINE_API_KEY;
    
    if (!serverUrl) {
      throw new Error('Pipeline server URL not configured');
    }
    
    console.log(`Starting pipeline ${pipelineType} direct execution`);
    
    // Make the actual API call to the server for direct execution
    const response = await fetch(`${serverUrl}/api/pipeline/start`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        pipeline_type: pipelineType,
        direct_execution: true // Signal that this is a direct execution
      })
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error(`Server returned error: ${response.status}`, errorData);
      
      return NextResponse.json(
        { error: `Pipeline server error: ${errorData.error || 'Unknown error'}` },
        { status: 500 }
      );
    }
    
    // Get the result of direct execution
    const result = await response.json();
    
    console.log(`Successfully executed ${pipelineType} pipeline:`, result);
    
    // Return the result directly to the frontend
    return NextResponse.json({ 
      success: true,
      completed: true, // Important flag for frontend to know execution is complete 
      message: result.message || `${pipelineType} pipeline execution completed`,
      itemsProcessed: result.itemsProcessed || 0,
      error: result.error || null
    });
  } catch (error: any) {
    console.error(`Error executing ${pipelineType} pipeline:`, error);
    
    return NextResponse.json(
      { error: error.message || `Failed to execute ${pipelineType} pipeline` },
      { status: 500 }
    );
  }
}

/**
 * Stop a running pipeline
 */
async function stopPipeline(pipelineType: string) {
  try {
    // Update the database to reflect that the pipeline has stopped
    await withDb(async (db) => {
      // Update the pipeline status
      await db.run(
        `UPDATE pipeline_status 
         SET status = 'stopped', is_running = 0, updated_at = datetime('now')
         WHERE pipeline_type = ?`,
        [pipelineType]
      );
      
      // Update the latest history entry
      await db.run(
        `UPDATE pipeline_history
         SET status = 'stopped', completed_at = datetime('now')
         WHERE pipeline_type = ? AND status = 'running'`,
        [pipelineType]
      );
    });
    
    // In a real implementation, we would call the pipeline server with fetch
    
    return NextResponse.json({ success: true, message: `${pipelineType} pipeline stopped` });
  } catch (error: any) {
    console.error(`Error stopping ${pipelineType} pipeline:`, error);
    return NextResponse.json(
      { error: error.message || `Failed to stop ${pipelineType} pipeline` },
      { status: 500 }
    );
  }
}

/**
 * Toggle the schedule for a pipeline
 */
async function toggleSchedule(pipelineType: string, isActive: boolean) {
  try {
    await withDb(async (db) => {
      // Update the pipeline schedule
      await db.run(
        `UPDATE pipeline_schedules 
         SET is_active = ?, updated_at = datetime('now')
         WHERE pipeline_type = ?`,
        [isActive ? 1 : 0, pipelineType]
      );
    });
    
    return NextResponse.json({ 
      success: true, 
      message: `${pipelineType} pipeline schedule ${isActive ? 'activated' : 'deactivated'}` 
    });
  } catch (error: any) {
    console.error(`Error toggling schedule for ${pipelineType} pipeline:`, error);
    return NextResponse.json(
      { error: error.message || `Failed to toggle schedule for ${pipelineType} pipeline` },
      { status: 500 }
    );
  }
} 