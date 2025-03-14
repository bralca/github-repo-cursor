import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

/**
 * GET handler for pipeline history
 * Fetches pipeline execution history from the database
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const pipelineType = searchParams.get('pipeline_type');
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const status = searchParams.get('status');
    
    // Create authenticated Supabase client
    const supabase = createServerSupabaseClient();
    
    // Fetch pipeline history from the database
    let query = supabase
      .from('pipeline_history')
      .select('*');
    
    // Filter by pipeline type if provided
    if (pipelineType) {
      query = query.eq('pipeline_type', pipelineType);
    }
    
    // Filter by status if provided
    if (status) {
      query = query.eq('status', status);
    }
    
    const { data: history, error } = await query
      .order('started_at', { ascending: false })
      .limit(limit);
    
    if (error) {
      console.error('Error fetching pipeline history:', error);
      return NextResponse.json(
        { error: 'Failed to fetch pipeline history' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ history });
  } catch (error) {
    console.error('Error in pipeline history API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 