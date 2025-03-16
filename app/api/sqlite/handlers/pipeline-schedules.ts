import { NextRequest, NextResponse } from 'next/server';
import { withDb } from '@/lib/database/connection';

/**
 * Handler for pipeline schedules endpoint
 */
export async function handlePipelineSchedules(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const pipelineType = searchParams.get('pipeline_type');
    
    const schedules = await withDb(async (db) => {
      let query = 'SELECT * FROM pipeline_schedules';
      const params: any[] = [];
      
      // Add pipeline type filter if provided
      if (pipelineType) {
        query += ' WHERE pipeline_type = ?';
        params.push(pipelineType);
      }
      
      // Add ordering
      query += ' ORDER BY pipeline_type';
      
      // Execute the query
      const schedules = await db.all(query, params);
      
      // Parse parameters JSON for each schedule
      for (const schedule of schedules) {
        if (schedule.parameters && typeof schedule.parameters === 'string') {
          try {
            schedule.parameters = JSON.parse(schedule.parameters);
          } catch (e) {
            console.warn(`Failed to parse schedule parameters for ${schedule.pipeline_type}:`, e);
          }
        }
      }
      
      return schedules;
    });
    
    return NextResponse.json({ schedules });
  } catch (error: any) {
    console.error('Error in pipeline schedules API:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
} 