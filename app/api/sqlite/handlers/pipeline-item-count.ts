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
          try {
            const tableExists = await db.get(
              "SELECT name FROM sqlite_master WHERE type='table' AND name='closed_merge_requests_raw'"
            );
            
            if (!tableExists) {
              console.log("Table closed_merge_requests_raw does not exist");
              return 0;
            }
            
            const rawCount = await db.get(
              'SELECT COUNT(*) as count FROM closed_merge_requests_raw'
            );
            count = rawCount?.count || 0;
          } catch (e) {
            console.warn('Error counting github_sync items:', e);
            return 0;
          }
          break;
          
        case 'data_processing':
          // Count of unprocessed raw data
          try {
            const tableExists = await db.get(
              "SELECT name FROM sqlite_master WHERE type='table' AND name='closed_merge_requests_raw'"
            );
            
            if (!tableExists) {
              console.log("Table closed_merge_requests_raw does not exist");
              return 0;
            }
            
            const unprocessedCount = await db.get(
              'SELECT COUNT(*) as count FROM closed_merge_requests_raw WHERE is_processed = 0'
            );
            count = unprocessedCount?.count || 0;
          } catch (e) {
            console.warn('Error counting data_processing items:', e);
            return 0;
          }
          break;
          
        case 'data_enrichment':
          // Sum of all entities where is_enriched is false
          let totalUnenrichedCount = 0;
          
          try {
            // Check if repositories table exists
            const repoTableExists = await db.get(
              "SELECT name FROM sqlite_master WHERE type='table' AND name='repositories'"
            );
            
            if (repoTableExists) {
              // Count unenriched repositories
              const repoCount = await db.get(
                'SELECT COUNT(*) as count FROM repositories WHERE is_enriched = 0'
              );
              totalUnenrichedCount += repoCount?.count || 0;
            }
          } catch (e) {
            console.warn('Error counting unenriched repositories:', e);
          }
          
          try {
            // Check if contributors table exists
            const contribTableExists = await db.get(
              "SELECT name FROM sqlite_master WHERE type='table' AND name='contributors'"
            );
            
            if (contribTableExists) {
              // Count unenriched contributors
              const contribCount = await db.get(
                'SELECT COUNT(*) as count FROM contributors WHERE is_enriched = 0'
              );
              totalUnenrichedCount += contribCount?.count || 0;
            }
          } catch (e) {
            console.warn('Error counting unenriched contributors:', e);
          }
          
          try {
            // Check if merge_requests table exists
            const mrTableExists = await db.get(
              "SELECT name FROM sqlite_master WHERE type='table' AND name='merge_requests'"
            );
            
            if (mrTableExists) {
              // Count unenriched merge requests
              const mrCount = await db.get(
                'SELECT COUNT(*) as count FROM merge_requests WHERE is_enriched = 0'
              );
              totalUnenrichedCount += mrCount?.count || 0;
            }
          } catch (e) {
            console.warn('Error counting unenriched merge requests:', e);
          }
          
          count = totalUnenrichedCount;
          break;
          
        case 'ai_analysis':
          // Count commits where complexity_score is null
          try {
            // Check if commits table exists
            const commitsTableExists = await db.get(
              "SELECT name FROM sqlite_master WHERE type='table' AND name='commits'"
            );
            
            if (!commitsTableExists) {
              return 0;
            }
            
            const commitCount = await db.get(
              'SELECT COUNT(*) as count FROM commits WHERE complexity_score IS NULL'
            );
            count = commitCount?.count || 0;
          } catch (e) {
            console.warn('Error counting commits for AI analysis:', e);
            return 0;
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