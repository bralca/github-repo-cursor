import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

/**
 * POST handler for cleaning up pipeline history
 * Updates any stale "running" pipeline runs to "failed" status
 */
export async function POST(request: NextRequest) {
  try {
    // Connect to supabase
    const supabase = createServerSupabaseClient();
    
    // Get the current timestamp minus 1 hour to find stale runs
    const oneHourAgo = new Date();
    oneHourAgo.setHours(oneHourAgo.getHours() - 1);
    
    // Update any "running" status pipeline runs that have been running for more than 1 hour
    const { data, error, count } = await supabase
      .from('pipeline_history')
      .update({
        status: 'failed',
        completed_at: new Date().toISOString(),
        error_message: 'Pipeline run automatically marked as failed due to timeout'
      })
      .eq('status', 'running')
      .lt('started_at', oneHourAgo.toISOString())
      .select('id');
    
    if (error) {
      console.error('Error cleaning up stale pipeline runs:', error);
      return NextResponse.json(
        { error: `Failed to clean up stale pipeline runs: ${error.message}` },
        { status: 500 }
      );
    }
    
    const updatedCount = count || (data ? data.length : 0);
    
    return NextResponse.json({
      success: true,
      message: `Successfully cleaned up ${updatedCount} stale pipeline run${updatedCount === 1 ? '' : 's'}.`,
      updatedCount
    });
  } catch (error) {
    console.error('Unexpected error cleaning up stale pipeline runs:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred while cleaning up stale pipeline runs' },
      { status: 500 }
    );
  }
} 