import { NextRequest, NextResponse } from 'next/server';
import { withDb } from '@/lib/database/connection';

/**
 * Handler for clearing pipeline history in SQLite database
 * @param request NextRequest containing optional pipeline_type filter
 * @returns JSON response indicating success or failure
 */
export async function handlePipelineHistoryClear(request: NextRequest) {
  try {
    // Try to parse the request body for optional pipeline type filter
    let pipelineType: string | undefined;
    try {
      const body = await request.json();
      pipelineType = body.pipelineType;
      console.log('Pipeline type from request:', pipelineType);
    } catch (e) {
      console.log('No body or invalid JSON in request');
      // No body or invalid JSON, continue without filtering by pipeline type
    }
    
    // Execute the clear operation in the database
    const result = await withDb(async (db) => {
      try {
        // Get initial count
        const countQuery = "SELECT COUNT(*) as count FROM pipeline_history";
        const initialCount = await db.get(countQuery);
        console.log('Initial pipeline_history count:', initialCount?.count);
        
        // MUCH simpler approach - delete everything
        let deleteQuery;
        let params: any[] = [];
        
        if (pipelineType) {
          // If filtering by type, delete only records of that type
          deleteQuery = "DELETE FROM pipeline_history WHERE pipeline_type = ?";
          params = [pipelineType];
        } else {
          // Delete all records
          deleteQuery = "DELETE FROM pipeline_history";
        }
        
        console.log('Delete query:', deleteQuery);
        console.log('Delete params:', params);
        
        // Execute the delete operation
        const result = await db.run(deleteQuery, params);
        console.log('Delete result:', result);
        
        // Get final count
        const finalCount = await db.get(countQuery);
        console.log('Final pipeline_history count:', finalCount?.count);
        
        return {
          deletedCount: result.changes,
          finalCount: finalCount?.count || 0
        };
      } catch (error) {
        console.error('Error executing SQL:', error);
        return {
          deletedCount: 0,
          finalCount: 0,
          error: error instanceof Error ? error.message : 'Unknown SQL error'
        };
      }
    });
    
    // Build success message
    let message;
    if (result.error) {
      message = `No records were cleared. ${result.error}`;
    } else {
      message = `Successfully cleared ${result.deletedCount} pipeline history record${result.deletedCount === 1 ? '' : 's'}`;
      if (pipelineType) {
        message += ` for pipeline type "${pipelineType}"`;
      }
      message += '.';
    }
    
    console.log('Sending success response:', { message, ...result });
    
    return NextResponse.json({
      success: true,
      message,
      deletedCount: result.deletedCount
    });
  } catch (error: any) {
    console.error('Error in SQLite pipeline history clear handler:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to clear pipeline history' },
      { status: 500 }
    );
  }
} 