import { NextRequest, NextResponse } from 'next/server';
import { withDb } from '@/lib/database/connection';

/**
 * Handler for pipeline status endpoint
 */
export async function handlePipelineStatus(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const pipelineType = searchParams.get('pipeline_type');
    
    if (!pipelineType) {
      return NextResponse.json(
        { error: 'Pipeline type is required' },
        { status: 400 }
      );
    }
    
    // Use the withDb utility for connection management
    const status = await withDb(async (db) => {
      // Get the pipeline schedule
      const schedule = await db.get(
        'SELECT * FROM pipeline_schedules WHERE pipeline_type = ?',
        [pipelineType]
      );
      
      // Get the latest history entry
      const lastRun = await db.get(
        'SELECT * FROM pipeline_history WHERE pipeline_type = ? ORDER BY started_at DESC LIMIT 1',
        [pipelineType]
      );
      
      // Get the item count based on pipeline type
      let itemCount = 0;
      
      switch (pipelineType) {
        case 'github_sync':
          // Count all items in closed_merge_requests_raw table
          const rawCount = await db.get(
            'SELECT COUNT(*) as count FROM closed_merge_requests_raw'
          );
          itemCount = rawCount?.count || 0;
          break;
          
        case 'data_processing':
          // Count of unprocessed raw data
          const unprocessedCount = await db.get(
            'SELECT COUNT(*) as count FROM closed_merge_requests_raw WHERE entity_type = "merge_request"'
          );
          itemCount = unprocessedCount?.count || 0;
          break;
          
        case 'data_enrichment':
          // Sum of all entities where is_enriched is false
          let totalUnenrichedCount = 0;
          
          // Count unenriched repositories
          const repoCount = await db.get(
            'SELECT COUNT(*) as count FROM repositories WHERE is_enriched = 0'
          );
          totalUnenrichedCount += repoCount?.count || 0;
          
          // Count unenriched contributors
          const contribCount = await db.get(
            'SELECT COUNT(*) as count FROM contributors WHERE is_enriched = 0'
          );
          totalUnenrichedCount += contribCount?.count || 0;
          
          // Count unenriched merge requests
          const mrCount = await db.get(
            'SELECT COUNT(*) as count FROM merge_requests WHERE is_enriched = 0'
          );
          totalUnenrichedCount += mrCount?.count || 0;
          
          itemCount = totalUnenrichedCount;
          break;
          
        case 'ai_analysis':
          // Count commits where complexity_score is null
          const commitCount = await db.get(
            'SELECT COUNT(*) as count FROM commits WHERE complexity_score IS NULL'
          );
          itemCount = commitCount?.count || 0;
          break;
          
        default:
          throw new Error('Invalid pipeline type');
      }
      
      // Create the pipeline status object
      return {
        itemCount,
        lastRun: lastRun?.completed_at || lastRun?.started_at || null,
        isActive: schedule?.is_active || false,
        isRunning: lastRun?.status === 'running',
        errorMessage: lastRun?.status === 'failed' ? lastRun.error_message : undefined,
      };
    });
    
    return NextResponse.json(status);
  } catch (error: any) {
    console.error('Error in pipeline status API:', error);
    
    // Return appropriate error response
    if (error.message === 'Invalid pipeline type') {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
} 