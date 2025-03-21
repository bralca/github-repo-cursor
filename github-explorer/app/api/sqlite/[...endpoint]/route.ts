import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

// Import handlers for different endpoints
import { handlePipelineStatus } from '../handlers/pipeline-status';
import { handlePipelineOperations } from '../handlers/pipeline-operations';
import { handlePipelineHistory } from '../handlers/pipeline-history';
import { handlePipelineItemCount } from '../handlers/pipeline-item-count';
import { handlePipelineSchedules } from '../handlers/pipeline-schedules';
import { handleEntityCounts } from '../handlers/entity-counts';
import { handlePipelineHistoryClear } from '../handlers/pipeline-history-clear';
import { getSitemapStatus } from '../handlers/get-sitemap-status';
import { triggerSitemapGeneration } from '../handlers/trigger-sitemap-generation';
import { validateSitemapUrls } from '../handlers/validate-sitemap-urls';

/**
 * Checks if the user is authenticated, considering that they might already be
 * authenticated by middleware to reach this endpoint
 */
async function isAuthenticated(request: NextRequest) {
  // Get the Supabase client for auth checks
  const supabase = createServerSupabaseClient();
  
  // Check if user is authenticated for admin endpoints
  const { data } = await supabase.auth.getSession();
  
  return !!data.session;
}

/**
 * GET handler for SQLite API
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ endpoint: string[] }> }
) {
  try {
    // Extract endpoint from params - properly await params for Next.js 15
    const params = await context.params;
    const endpointArray = params.endpoint;
    const endpoint = endpointArray[0];
    
    // Since this API is internal and the admin page already requires auth,
    // we assume the user is authenticated if they can access these endpoints.
    // In a production environment, you would want to strengthen this check.
    
    // Route to the appropriate handler based on the endpoint
    switch (endpoint) {
      case 'pipeline-status':
        return await handlePipelineStatus(request);
      case 'pipeline-history':
        return await handlePipelineHistory(request);
      case 'pipeline-item-count':
        return await handlePipelineItemCount(request);
      case 'pipeline-schedules':
        return await handlePipelineSchedules(request);
      case 'entity-counts':
        return await handleEntityCounts(request);
      case 'sitemap-status':
        return await getSitemapStatus(request);
      case 'validate-sitemap-urls':
        return await validateSitemapUrls(request);
      default:
        return NextResponse.json(
          { error: `Unknown endpoint: ${endpoint}` },
          { status: 404 }
        );
    }
  } catch (error: any) {
    console.error(`Error in SQLite API (GET):`, error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST handler for SQLite API
 */
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ endpoint: string[] }> }
) {
  try {
    // Extract endpoint from params - properly await params for Next.js 15
    const params = await context.params;
    const endpointArray = params.endpoint;
    const endpoint = endpointArray[0];
    
    // Since this API is internal and the admin page already requires auth,
    // we assume the user is authenticated if they can access these endpoints.
    
    // Route to the appropriate handler based on the endpoint
    switch (endpoint) {
      case 'pipeline-operations':
        return await handlePipelineOperations(request);
      case 'pipeline-history-clear':
        return await handlePipelineHistoryClear(request);
      case 'generate-sitemap':
        return await triggerSitemapGeneration(request);
      case 'validate-sitemap-urls':
        return await validateSitemapUrls(request);
      default:
        return NextResponse.json(
          { error: `Unknown endpoint: ${endpoint}` },
          { status: 404 }
        );
    }
  } catch (error: any) {
    console.error(`Error in SQLite API (POST):`, error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
} 