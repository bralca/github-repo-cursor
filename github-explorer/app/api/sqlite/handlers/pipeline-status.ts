import { NextRequest, NextResponse } from 'next/server';
import { withDb } from '@/lib/database/connection';

/**
 * Handler for the pipeline status API endpoint
 * Returns the current status of the pipeline from SQLite
 */
export async function handlePipelineStatus(request: NextRequest) {
  try {
    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const pipelineType = searchParams.get('pipeline_type');
    
    // If pipeline type is specified, get status for that pipeline only
    if (pipelineType) {
      const status = await getPipelineStatusByType(pipelineType);
      return NextResponse.json(status);
    }
    
    // Otherwise, get status for all pipelines
    const allStatuses = await getAllPipelineStatuses();
    return NextResponse.json(allStatuses);
  } catch (error: any) {
    console.error('Error fetching pipeline status:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch pipeline status' },
      { status: 500 }
    );
  }
}

/**
 * Get the status of a specific pipeline
 */
async function getPipelineStatusByType(pipelineType: string) {
  return await withDb(async (db) => {
    console.log(`Fetching status for pipeline type: ${pipelineType}`);
    
    // Get the pipeline status
    const result = await db.get(
      'SELECT * FROM pipeline_status WHERE pipeline_type = ?',
      [pipelineType]
    );
    
    if (!result) {
      return {
        pipelineType,
        status: 'unknown',
        isRunning: false,
        updatedAt: null
      };
    }
    
    return {
      pipelineType: result.pipeline_type,
      status: result.status,
      isRunning: Boolean(result.is_running),
      updatedAt: result.updated_at
    };
  });
}

/**
 * Get the status of all pipelines
 */
async function getAllPipelineStatuses() {
  return await withDb(async (db) => {
    console.log('Fetching status for all pipelines');
    
    // Get all pipeline statuses
    const results = await db.all('SELECT * FROM pipeline_status ORDER BY pipeline_type');
    
    // Return formatted results
    return results.map(result => ({
      pipelineType: result.pipeline_type,
      status: result.status,
      isRunning: Boolean(result.is_running),
      updatedAt: result.updated_at
    }));
  });
} 