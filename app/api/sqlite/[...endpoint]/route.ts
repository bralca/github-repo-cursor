import { NextRequest, NextResponse } from 'next/server';
import { handlePipelineStatus } from '../handlers/pipeline-status';
import { handlePipelineOperations } from '../handlers/pipeline-operations';
import { handlePipelineHistory } from '../handlers/pipeline-history';
import { handlePipelineItemCount } from '../handlers/pipeline-item-count';
import { handlePipelineSchedules } from '../handlers/pipeline-schedules';
import { handleEntityCounts } from '../handlers/entity-counts';

/**
 * Dynamic API route handler for all SQLite endpoints
 * This acts as a router to direct requests to the appropriate handler
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { endpoint: string[] } }
) {
  try {
    // Get the endpoint from the URL path
    const endpoint = params.endpoint[0];
    
    // Route the request to the appropriate handler
    switch (endpoint) {
      case 'pipeline-status':
        return handlePipelineStatus(request);
        
      case 'pipeline-history':
        return handlePipelineHistory(request);
        
      case 'pipeline-schedules':
        return handlePipelineSchedules(request);
        
      case 'pipeline-item-count':
        return handlePipelineItemCount(request);
        
      case 'entity-counts':
        return handleEntityCounts(request);
        
      default:
        return NextResponse.json(
          { error: `Unknown endpoint: ${endpoint}` },
          { status: 404 }
        );
    }
  } catch (error: any) {
    console.error(`Error in SQLite API (GET) [${params.endpoint.join('/')}]:`, error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Handle POST requests for SQLite endpoints
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { endpoint: string[] } }
) {
  try {
    // Get the endpoint from the URL path
    const endpoint = params.endpoint[0];
    
    // Route the request to the appropriate handler
    switch (endpoint) {
      case 'pipeline-operations':
        return handlePipelineOperations(request);
        
      default:
        return NextResponse.json(
          { error: `Unknown endpoint: ${endpoint}` },
          { status: 404 }
        );
    }
  } catch (error: any) {
    console.error(`Error in SQLite API (POST) [${params.endpoint.join('/')}]:`, error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
} 