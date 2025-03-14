import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

/**
 * GET handler for cron jobs
 * Fetches all cron jobs or filters by pipeline type
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const pipelineType = searchParams.get('pipeline_type');
    
    // Create authenticated Supabase client
    const supabase = createServerSupabaseClient();
    
    let query = supabase
      .from('pipeline_schedules')
      .select('*')
      .order('created_at', { ascending: false });
    
    // Filter by pipeline type if provided
    if (pipelineType) {
      query = query.eq('pipeline_type', pipelineType);
    }
    
    const { data, error } = await query;
    
    if (error) {
      console.error('Error fetching cron jobs:', error);
      return NextResponse.json(
        { error: 'Failed to fetch cron jobs' },
        { status: 500 }
      );
    }
    
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in cron jobs API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST handler for cron jobs
 * Creates or updates a cron job for a specific pipeline
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { pipeline_type, cron_expression, is_active } = body;
    
    // Validate required fields
    if (!pipeline_type || !cron_expression) {
      return NextResponse.json(
        { error: 'Pipeline type and cron expression are required' },
        { status: 400 }
      );
    }
    
    // Create authenticated Supabase client
    const supabase = createServerSupabaseClient();
    
    // Check if a schedule already exists for this pipeline type
    const { data: existingSchedule, error: fetchError } = await supabase
      .from('pipeline_schedules')
      .select('*')
      .eq('pipeline_type', pipeline_type)
      .maybeSingle();
    
    if (fetchError) {
      console.error('Error checking existing schedule:', fetchError);
      return NextResponse.json(
        { error: 'Failed to check existing schedule' },
        { status: 500 }
      );
    }
    
    let result;
    
    if (existingSchedule) {
      // Update existing schedule
      const { data, error: updateError } = await supabase
        .from('pipeline_schedules')
        .update({
          cron_expression,
          is_active: is_active !== undefined ? is_active : existingSchedule.is_active,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingSchedule.id)
        .select()
        .single();
      
      if (updateError) {
        console.error('Error updating schedule:', updateError);
        return NextResponse.json(
          { error: 'Failed to update schedule' },
          { status: 500 }
        );
      }
      
      result = data;
    } else {
      // Create new schedule
      const { data, error: insertError } = await supabase
        .from('pipeline_schedules')
        .insert({
          pipeline_type,
          cron_expression,
          is_active: is_active !== undefined ? is_active : true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();
      
      if (insertError) {
        console.error('Error creating schedule:', insertError);
        return NextResponse.json(
          { error: 'Failed to create schedule' },
          { status: 500 }
        );
      }
      
      result = data;
    }
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error in cron jobs API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PATCH handler for cron jobs
 * Updates the active status of a cron job
 */
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { pipeline_type, is_active } = body;
    
    // Validate required fields
    if (!pipeline_type || is_active === undefined) {
      return NextResponse.json(
        { error: 'Pipeline type and active status are required' },
        { status: 400 }
      );
    }
    
    // Create authenticated Supabase client
    const supabase = createServerSupabaseClient();
    
    // Update the active status
    const { data, error } = await supabase
      .from('pipeline_schedules')
      .update({
        is_active,
        updated_at: new Date().toISOString()
      })
      .eq('pipeline_type', pipeline_type)
      .select()
      .single();
    
    if (error) {
      console.error('Error updating cron job status:', error);
      return NextResponse.json(
        { error: 'Failed to update cron job status' },
        { status: 500 }
      );
    }
    
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in cron jobs API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 