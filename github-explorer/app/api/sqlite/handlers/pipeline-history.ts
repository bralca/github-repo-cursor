import { NextRequest, NextResponse } from 'next/server';
import { withDb } from '@/lib/database/connection';

/**
 * Ensure a date string is valid ISO format or null
 */
function formatDateOrNull(dateString: string | null): string | null {
  if (!dateString) return null;
  try {
    // Try to create a valid date and convert to ISO string
    const date = new Date(dateString);
    // Check if date is valid
    if (isNaN(date.getTime())) return null;
    return date.toISOString();
  } catch (e) {
    return null;
  }
}

/**
 * Handler for the pipeline history API endpoint
 * Returns the history of pipeline executions
 */
export async function handlePipelineHistory(request: NextRequest) {
  try {
    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const pipelineType = searchParams.get('pipeline_type');
    const limit = parseInt(searchParams.get('limit') || '10', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);
    
    // Validate pipeline type if provided
    if (pipelineType && !['github_sync', 'data_processing', 'data_enrichment', 'ai_analysis'].includes(pipelineType)) {
      return NextResponse.json(
        { error: 'Invalid pipeline type' },
        { status: 400 }
      );
    }
    
    // Get pipeline history from database
    const history = await withDb(async (db) => {
      // Build the query based on whether pipeline_type was specified
      let query = 'SELECT * FROM pipeline_history';
      const params: any[] = [];
      
      if (pipelineType) {
        query += ' WHERE pipeline_type = ?';
        params.push(pipelineType);
      }
      
      // Add sorting and pagination
      query += ' ORDER BY started_at DESC LIMIT ? OFFSET ?';
      params.push(limit, offset);
      
      // Execute the query
      return await db.all(query, params);
    });
    
    // Format the response
    const formattedHistory = history.map((entry: any) => {
      // Ensure date strings are valid ISO format
      const startedAt = formatDateOrNull(entry.started_at);
      const completedAt = formatDateOrNull(entry.completed_at);
      
      // Calculate duration only if both dates are valid
      let duration = null;
      if (startedAt && completedAt) {
        const startTime = new Date(startedAt).getTime();
        const endTime = new Date(completedAt).getTime();
        duration = endTime - startTime;
      }
      
      return {
        id: entry.id ? String(entry.id) : '',
        pipelineType: entry.pipeline_type || '',
        status: entry.status || 'unknown',
        startedAt: startedAt,
        completedAt: completedAt,
        itemsProcessed: typeof entry.items_processed === 'number' ? entry.items_processed : null,
        errorMessage: entry.error_message || null,
        duration: duration
      };
    });
    
    return NextResponse.json(formattedHistory);
  } catch (error: any) {
    console.error('Error fetching pipeline history:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch pipeline history' },
      { status: 500 }
    );
  }
} 