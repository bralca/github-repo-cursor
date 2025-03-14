import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

/**
 * GET handler for pipeline item counts
 * Fetches counts of items to be processed by each pipeline type
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const pipelineType = searchParams.get('pipeline_type');
    
    if (!pipelineType) {
      return NextResponse.json(
        { error: 'Pipeline type is required' },
        { status: 400 }
      );
    }
    
    // Create authenticated Supabase client
    const supabase = createServerSupabaseClient();
    
    let count = 0;
    
    // Get count based on pipeline type
    switch (pipelineType) {
      case 'github_sync':
        // Count all items in github_raw_data table
        const { count: totalRawCount, error: totalRawError } = await supabase
          .from('github_raw_data')
          .select('*', { count: 'exact', head: true });
        
        if (totalRawError) {
          console.error('Error counting github_raw_data:', totalRawError);
          return NextResponse.json(
            { error: 'Failed to count github_raw_data' },
            { status: 500 }
          );
        }
        
        count = totalRawCount || 0;
        break;
        
      case 'data_processing':
        // Count of unprocessed raw data (where processed is false)
        const { count: rawCount, error: rawError } = await supabase
          .from('github_raw_data')
          .select('*', { count: 'exact', head: true })
          .eq('processed', false);
        
        // If the column doesn't exist, try with JSONB approach as fallback
        if (rawError && rawError.message.includes('does not exist')) {
          const { count: jsonbRawCount, error: jsonbRawError } = await supabase
            .from('github_raw_data')
            .select('*', { count: 'exact', head: true })
            .is('data->processed', null);
            
          if (jsonbRawError) {
            console.error('Error counting raw data with JSONB approach:', jsonbRawError);
            return NextResponse.json(
              { error: 'Failed to count raw data' },
              { status: 500 }
            );
          }
          
          count = jsonbRawCount || 0;
        } else if (rawError) {
          console.error('Error counting raw data:', rawError);
          return NextResponse.json(
            { error: 'Failed to count raw data' },
            { status: 500 }
          );
        } else {
          count = rawCount || 0;
        }
        break;
        
      case 'data_enrichment':
        // Sum of all entities where is_enriched is false
        let totalUnenrichedCount = 0;
        
        // Count unenriched repositories
        const { count: repoCount, error: repoError } = await supabase
          .from('repositories')
          .select('*', { count: 'exact', head: true })
          .eq('is_enriched', false);
        
        if (repoError) {
          console.error('Error counting repositories:', repoError);
          // Continue with other counts instead of aborting
        } else {
          totalUnenrichedCount += repoCount || 0;
        }
        
        // Count unenriched contributors
        const { count: contribCount, error: contribError } = await supabase
          .from('contributors')
          .select('*', { count: 'exact', head: true })
          .eq('is_enriched', false);
        
        if (contribError) {
          console.error('Error counting contributors:', contribError);
        } else {
          totalUnenrichedCount += contribCount || 0;
        }
        
        // Count unenriched merge requests
        const { count: mrCount, error: mrError } = await supabase
          .from('merge_requests')
          .select('*', { count: 'exact', head: true })
          .eq('is_enriched', false);
        
        if (mrError && !mrError.message.includes('does not exist')) {
          console.error('Error counting merge requests:', mrError);
        } else if (!mrError) {
          totalUnenrichedCount += mrCount || 0;
        }
        
        count = totalUnenrichedCount;
        break;
        
      case 'ai_analysis':
        try {
          // First try to count commits where complexity_score is null
          try {
            const { count: commitCount, error: commitError } = await supabase
              .from('commits')
              .select('*', { count: 'exact', head: true })
              .is('complexity_score', null);
            
            if (!commitError) {
              count = commitCount || 0;
              break;
            }
          } catch (e) {
            console.warn('Error counting commits with complexity_score: ', e);
            // Continue to fallback approach
          }
          
          // Fallback: if the previous approach failed, just count all commits 
          // as a fallback since we can't determine which need analysis
          const { count: totalCommitCount, error: totalCommitError } = await supabase
            .from('commits')
            .select('*', { count: 'exact', head: true });
            
          if (totalCommitError) {
            console.error('Error counting total commits:', totalCommitError);
            return NextResponse.json(
              { error: 'Failed to count commits for analysis' },
              { status: 500 }
            );
          }
          
          // Return all commits as a fallback
          count = totalCommitCount || 0;
        } catch (error) {
          console.error('Error in AI analysis count:', error);
          return NextResponse.json(
            { error: 'Failed to count items for AI analysis' },
            { status: 500 }
          );
        }
        break;
        
      default:
        return NextResponse.json(
          { error: 'Invalid pipeline type' },
          { status: 400 }
        );
    }
    
    return NextResponse.json({ count });
  } catch (error) {
    console.error('Error in pipeline item count API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 