import { NextRequest, NextResponse } from 'next/server';
import { withDb } from '@/lib/database/connection';

/**
 * Handler for fetching pipeline schedules
 */
export async function handlePipelineSchedules(request: NextRequest) {
  try {
    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const pipelineType = searchParams.get('pipeline_type');
    
    // Get schedules from database
    const schedules = await withDb(async (db) => {
      let query = 'SELECT * FROM pipeline_schedules';
      const params: any[] = [];
      
      // If a specific pipeline type is requested, filter by it
      if (pipelineType) {
        query += ' WHERE pipeline_type = ?';
        params.push(pipelineType);
      }
      
      // Add ordering
      query += ' ORDER BY pipeline_type ASC';
      
      return await db.all(query, params);
    });
    
    // Format the response
    const formattedSchedules = schedules.map((schedule: any) => ({
      id: schedule.id,
      pipelineType: schedule.pipeline_type,
      cronExpression: schedule.cron_expression,
      isActive: Boolean(schedule.is_active),
      lastModified: schedule.updated_at,
      description: schedule.description
    }));
    
    return NextResponse.json(formattedSchedules);
  } catch (error: any) {
    console.error('Error fetching pipeline schedules:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch pipeline schedules' },
      { status: 500 }
    );
  }
} 