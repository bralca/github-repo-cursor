import { NextRequest, NextResponse } from 'next/server';
import { withDb } from '@/lib/database/connection';

/**
 * Handler for pipeline history endpoint
 */
export async function handlePipelineHistory(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const pipelineType = searchParams.get('pipeline_type');
    const limitParam = searchParams.get('limit') || '10';
    
    // Parse limit parameter
    const limit = parseInt(limitParam, 10);
    if (isNaN(limit) || limit <= 0) {
      return NextResponse.json(
        { error: 'Invalid limit parameter' },
        { status: 400 }
      );
    }
    
    const history = await withDb(async (db) => {
      let query = 'SELECT * FROM pipeline_history';
      const params: any[] = [];
      
      // Add pipeline type filter if provided
      if (pipelineType) {
        query += ' WHERE pipeline_type = ?';
        params.push(pipelineType);
      }
      
      // Add ordering and limit
      query += ' ORDER BY started_at DESC LIMIT ?';
      params.push(limit);
      
      // Execute the query
      return await db.all(query, params);
    });
    
    return NextResponse.json({ history });
  } catch (error: any) {
    console.error('Error in pipeline history API:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
} 