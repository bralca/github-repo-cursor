import { NextRequest, NextResponse } from 'next/server';
import { withDb } from '@/lib/database/connection';

/**
 * Handler for getting the count of items to be processed by pipelines
 */
export async function handlePipelineItemCount(request: NextRequest) {
  try {
    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const pipelineType = searchParams.get('pipeline_type');
    
    if (!pipelineType) {
      return NextResponse.json(
        { error: 'Pipeline type is required' },
        { status: 400 }
      );
    }
    
    // Get the item count from the database
    const count = await withDb(async (db) => {
      // Different count queries based on pipeline type
      switch (pipelineType) {
        case 'github_sync':
          // Count from closed_merge_requests_raw table
          const tableExists = await db.get(
            "SELECT name FROM sqlite_master WHERE type='table' AND name='closed_merge_requests_raw'"
          );
          
          if (!tableExists) {
            console.log("Table closed_merge_requests_raw does not exist");
            return 0;
          }
          
          // Count all items in the closed_merge_requests_raw table
          const rawMrResult = await db.get('SELECT COUNT(*) as count FROM closed_merge_requests_raw');
          return rawMrResult?.count || 0;
          
        case 'data_processing':
          // Count raw merge requests that need processing
          const tableExists2 = await db.get(
            "SELECT name FROM sqlite_master WHERE type='table' AND name='closed_merge_requests_raw'"
          );
          
          if (!tableExists2) {
            console.log("Table closed_merge_requests_raw does not exist");
            return 0;
          }
          
          // Count unprocessed items
          const rawResult = await db.get('SELECT COUNT(*) as count FROM closed_merge_requests_raw WHERE is_processed = 0');
          return rawResult?.count || 0;
          
        case 'data_enrichment':
          // Count entities that need enrichment (sum across tables)
          let totalCount = 0;
          
          try {
            // Check if repositories table exists
            const repoTableExists = await db.get(
              "SELECT name FROM sqlite_master WHERE type='table' AND name='repositories'"
            );
            
            if (repoTableExists) {
              // Count repositories needing enrichment
              const repoEnrichResult = await db.get('SELECT COUNT(*) as count FROM repositories WHERE is_enriched = 0');
              totalCount += repoEnrichResult?.count || 0;
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
              // Count contributors needing enrichment
              const contribResult = await db.get('SELECT COUNT(*) as count FROM contributors WHERE is_enriched = 0');
              totalCount += contribResult?.count || 0;
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
              // Count merge requests needing enrichment
              const mrResult = await db.get('SELECT COUNT(*) as count FROM merge_requests WHERE is_enriched = 0');
              totalCount += mrResult?.count || 0;
            }
          } catch (e) {
            console.warn('Error counting unenriched merge requests:', e);
          }
          
          return totalCount;
          
        case 'ai_analysis':
          // Count commits that need AI analysis
          try {
            // Check if commits table exists
            const commitsTableExists = await db.get(
              "SELECT name FROM sqlite_master WHERE type='table' AND name='commits'"
            );
            
            if (!commitsTableExists) {
              return 0;
            }
            
            const commitResult = await db.get('SELECT COUNT(*) as count FROM commits WHERE complexity_score IS NULL');
            return commitResult?.count || 0;
          } catch (e) {
            console.warn('Error counting commits for AI analysis:', e);
            return 0;
          }
          
        default:
          throw new Error(`Unknown pipeline type: ${pipelineType}`);
      }
    });
    
    return NextResponse.json({ pipelineType, count });
  } catch (error: any) {
    console.error('Error fetching pipeline item count:', error);
    
    // Return appropriate error response
    if (error.message?.includes('Unknown pipeline type')) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: error.message || 'Failed to fetch pipeline item count' },
      { status: 500 }
    );
  }
} 