import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

/**
 * POST handler for pipeline retry
 * Retries a failed pipeline run by creating a new run with the same parameters
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { runId } = body;
    
    if (!runId) {
      return NextResponse.json(
        { error: 'Run ID is required' },
        { status: 400 }
      );
    }
    
    // Create authenticated Supabase client
    const supabase = createServerSupabaseClient();
    
    // Get the failed run details
    const { data: failedRun, error: fetchError } = await supabase
      .from('pipeline_history')
      .select('*')
      .eq('id', runId)
      .eq('status', 'failed')
      .single();
    
    if (fetchError || !failedRun) {
      console.error('Error fetching failed run:', fetchError);
      return NextResponse.json(
        { error: 'Failed run not found' },
        { status: 404 }
      );
    }
    
    // Create a new run based on the failed one
    const newRun = {
      pipeline_type: failedRun.pipeline_type,
      started_at: new Date().toISOString(),
      status: 'running',
      items_processed: 0,
      created_at: new Date().toISOString(),
    };
    
    const { data: newRunData, error: insertError } = await supabase
      .from('pipeline_history')
      .insert(newRun)
      .select()
      .single();
    
    if (insertError) {
      console.error('Error creating new run:', insertError);
      return NextResponse.json(
        { error: 'Failed to create new run' },
        { status: 500 }
      );
    }
    
    // Return the new run data
    return NextResponse.json(newRunData);
  } catch (error) {
    console.error('Error in pipeline retry API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 