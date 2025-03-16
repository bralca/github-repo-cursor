import { NextRequest, NextResponse } from 'next/server';
import { withDb } from '@/lib/database/connection';

/**
 * Handler for pipeline item count endpoint
 */
export async function handlePipelineItemCount(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const pipelineType = searchParams.get('pipeline_type');
    
    if (!pipelineType) {
      return NextResponse.json(
        { error: 'Pipeline type is required' },
        { status: 400 }
      );
    }
    
    const count = await withDb(async (db) => {
      let count = 0;
      
      // Get count based on pipeline type
      switch (pipelineType) {
        case 'github_sync':
          // Count all items in closed_merge_requests_raw table
          const rawCount = await db.get(
            'SELECT COUNT(*) as count FROM closed_merge_requests_raw'
          );
          count = rawCount?.count || 0;
          break;
          
        case 'data_processing':
          // Count of unprocessed raw data (specifically merge requests)
          const unprocessedCount = await db.get(
            'SELECT COUNT(*) as count FROM closed_merge_requests_raw WHERE entity_type = "merge_request"'
          );
          count = unprocessedCount?.count || 0;
          break;
          
        case 'data_enrichment':
          // Sum of all entities where is_enriched is false
          let totalUnenrichedCount = 0;
          
          try {
            // Count unenriched repositories
            const repoCount = await db.get(
              'SELECT COUNT(*) as count FROM repositories WHERE is_enriched = 0'
            );
            totalUnenrichedCount += repoCount?.count || 0;
          } catch (e) {
            console.warn('Error counting unenriched repositories:', e);
          }
          
          try {
            // Count unenriched contributors
            const contribCount = await db.get(
              'SELECT COUNT(*) as count FROM contributors WHERE is_enriched = 0'
            );
            totalUnenrichedCount += contribCount?.count || 0;
          } catch (e) {
            console.warn('Error counting unenriched contributors:', e);
          }
          
          try {
            // Count unenriched merge requests
            const mrCount = await db.get(
              'SELECT COUNT(*) as count FROM merge_requests WHERE is_enriched = 0'
            );
            totalUnenrichedCount += mrCount?.count || 0;
          } catch (e) {
            console.warn('Error counting unenriched merge requests:', e);
          }
          
          count = totalUnenrichedCount;
          break;
          
        case 'ai_analysis':
          // Count commits where complexity_score is null
          try {
            const commitCount = await db.get(
              'SELECT COUNT(*) as count FROM commits WHERE complexity_score IS NULL'
            );
            count = commitCount?.count || 0;
          } catch (e) {
            console.warn('Error counting commits for AI analysis:', e);
            
            // Fallback: count all commits
            try {
              const totalCommitCount = await db.get(
                'SELECT COUNT(*) as count FROM commits'
              );
              count = totalCommitCount?.count || 0;
            } catch (e2) {
              console.error('Error counting all commits:', e2);
            }
          }
          break;
          
        default:
          throw new Error('Invalid pipeline type');
      }
      
      return count;
    }).catch(error => {
      if (error.message === 'Invalid pipeline type') {
        throw error;
      }
      console.error('Database error in pipeline item count:', error);
      return 0;
    });
    
    return NextResponse.json({ count });
  } catch (error: any) {
    console.error('Error in pipeline item count API:', error);
    
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