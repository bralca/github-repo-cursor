import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

/**
 * GET handler for pipeline schedules
 * Fetches pipeline schedules from the server
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const pipelineType = searchParams.get('pipeline_type');
    
    // Create authenticated Supabase client
    const supabase = createServerSupabaseClient();
    
    // Fetch pipeline schedules from the database
    let query = supabase
      .from('pipeline_schedules')
      .select('*');
    
    // Filter by pipeline type if provided
    if (pipelineType) {
      query = query.eq('pipeline_type', pipelineType);
    }
    
    const { data: schedules, error } = await query
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching pipeline schedules:', error);
      return NextResponse.json(
        { error: 'Failed to fetch pipeline schedules' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ schedules });
  } catch (error) {
    console.error('Error in pipeline schedules API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST handler for pipeline schedules
 * Creates or updates pipeline schedules
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { pipeline_type, cron_expression, is_active } = body;
    
    // Basic validation
    if (!pipeline_type || !cron_expression) {
      return NextResponse.json(
        { error: 'Pipeline type and cron expression are required' },
        { status: 400 }
      );
    }
    
    // Create authenticated Supabase client
    const supabase = createServerSupabaseClient();
    
    // Create or update the schedule
    const schedule: {
      pipeline_type: string;
      cron_expression: string;
      is_active: boolean;
      updated_at: string;
      created_at?: string;
    } = {
      pipeline_type,
      cron_expression,
      is_active: is_active !== undefined ? is_active : true,
      updated_at: new Date().toISOString(),
    };
    
    // Check if schedule already exists
    const { data: existingSchedule, error: queryError } = await supabase
      .from('pipeline_schedules')
      .select('id')
      .eq('pipeline_type', pipeline_type)
      .maybeSingle();
    
    let result;
    
    if (existingSchedule) {
      // Update existing schedule
      const { data, error } = await supabase
        .from('pipeline_schedules')
        .update(schedule)
        .eq('id', existingSchedule.id)
        .select()
        .single();
      
      if (error) {
        console.error('Error updating pipeline schedule:', error);
        return NextResponse.json(
          { error: 'Failed to update pipeline schedule' },
          { status: 500 }
        );
      }
      
      result = data;
    } else {
      // Create new schedule
      schedule.created_at = new Date().toISOString();
      
      const { data, error } = await supabase
        .from('pipeline_schedules')
        .insert(schedule)
        .select()
        .single();
      
      if (error) {
        console.error('Error creating pipeline schedule:', error);
        return NextResponse.json(
          { error: 'Failed to create pipeline schedule' },
          { status: 500 }
        );
      }
      
      result = data;
    }
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error in pipeline schedules API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 