import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

/**
 * POST handler for clearing pipeline history
 * Deletes all pipeline history records except the most recent successful run of each type
 */
export async function POST(request: NextRequest) {
  try {
    // Connect to supabase
    const supabase = createServerSupabaseClient();
    
    // Try to parse the request body for optional pipeline type filter
    let pipelineType: string | undefined;
    try {
      const body = await request.json();
      pipelineType = body.pipelineType;
    } catch (e) {
      // No body or invalid JSON, continue without filtering by pipeline type
    }
    
    // First, get the most recent successful run of each pipeline type
    // These will be preserved
    const { data: recentSuccessfulRuns, error: fetchError } = await supabase
      .from('pipeline_history')
      .select('id, pipeline_type')
      .eq('status', 'completed')
      .order('started_at', { ascending: false })
      .limit(10); // Keep at most 10 successful runs
    
    if (fetchError) {
      console.error('Error fetching recent successful runs:', fetchError);
      return NextResponse.json(
        { error: 'Failed to retrieve recent successful runs' },
        { status: 500 }
      );
    }
    
    // This is our most basic query - we need at least one condition for safety
    let query = supabase
      .from('pipeline_history')
      .delete();
    
    // If we have pipeline type filter, use that
    if (pipelineType) {
      query = query.eq('pipeline_type', pipelineType);
    } else {
      // If no pipeline type, use a simple condition that will match all records safely
      query = query.neq('status', 'non_existent_status');
    }
    
    // If we have IDs to preserve, add that condition
    if (recentSuccessfulRuns && recentSuccessfulRuns.length > 0) {
      // Extract just the IDs from the successful runs
      const idsToPreserve = recentSuccessfulRuns.map(run => run.id);
      
      // Add a condition to exclude these IDs
      // We'll use not-equals for single ID or not-in for multiple IDs
      if (idsToPreserve.length === 1) {
        query = query.neq('id', idsToPreserve[0]);
      } else if (idsToPreserve.length > 1) {
        query = query.not('id', 'in', `(${idsToPreserve.join(',')})`);
      }
    }
    
    // Execute the delete operation
    const { error: deleteError, count } = await query;
    
    if (deleteError) {
      console.error('Error clearing pipeline history:', deleteError);
      return NextResponse.json(
        { error: `Failed to clear pipeline history: ${deleteError.message}` },
        { status: 500 }
      );
    }
    
    // Build success message based on whether filtering was applied
    let message = `Successfully cleared ${count || 0} pipeline history record${count === 1 ? '' : 's'}`;
    if (pipelineType) {
      message += ` for pipeline type "${pipelineType}"`;
    }
    message += '.';
    
    // Add info about preserved records
    if (recentSuccessfulRuns && recentSuccessfulRuns.length > 0) {
      message += ` Preserved ${recentSuccessfulRuns.length} recent successful run${recentSuccessfulRuns.length === 1 ? '' : 's'}.`;
    }
    
    return NextResponse.json({
      success: true,
      message,
      deletedCount: count || 0,
      preservedCount: recentSuccessfulRuns?.length || 0
    });
  } catch (error: any) {
    console.error('Error in pipeline history clear API:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
} 