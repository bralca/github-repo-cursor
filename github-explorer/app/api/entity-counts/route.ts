import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

/**
 * GET handler for entity counts
 * Fetches the count of processed entities from the database
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const entity = searchParams.get('entity');
    const detailed = searchParams.get('detailed') === 'true';
    
    if (!entity) {
      return NextResponse.json(
        { error: 'Entity type is required' },
        { status: 400 }
      );
    }
    
    // Create authenticated Supabase client
    const supabase = createServerSupabaseClient();
    
    // Get count based on entity type
    switch (entity) {
      case 'repositories': {
        if (detailed) {
          // Get total count
          const { count: total, error: totalError } = await supabase
            .from('repositories')
            .select('*', { count: 'exact', head: true });
            
          // Get enriched count
          const { count: enriched, error: enrichedError } = await supabase
            .from('repositories')
            .select('*', { count: 'exact', head: true })
            .eq('is_enriched', true);
          
          // Get unenriched count
          const { count: unenriched, error: unenrichedError } = await supabase
            .from('repositories')
            .select('*', { count: 'exact', head: true })
            .eq('is_enriched', false);
          
          if (totalError || enrichedError || unenrichedError) {
            console.error('Error counting repositories:', { totalError, enrichedError, unenrichedError });
            return NextResponse.json(
              { error: 'Failed to count repositories' },
              { status: 500 }
            );
          }
          
          return NextResponse.json({
            total: total || 0,
            enriched: enriched || 0,
            unenriched: unenriched || 0
          });
        } else {
          // Just get total count
          const { count, error } = await supabase
            .from('repositories')
            .select('*', { count: 'exact', head: true });
          
          if (error) {
            console.error('Error counting repositories:', error);
            return NextResponse.json(
              { error: 'Failed to count repositories' },
              { status: 500 }
            );
          }
          
          return NextResponse.json({ count: count || 0 });
        }
      }
        
      case 'contributors': {
        if (detailed) {
          // Get total count
          const { count: total, error: totalError } = await supabase
            .from('contributors')
            .select('*', { count: 'exact', head: true });
            
          // Get enriched count
          const { count: enriched, error: enrichedError } = await supabase
            .from('contributors')
            .select('*', { count: 'exact', head: true })
            .eq('is_enriched', true);
          
          // Get unenriched count
          const { count: unenriched, error: unenrichedError } = await supabase
            .from('contributors')
            .select('*', { count: 'exact', head: true })
            .eq('is_enriched', false);
          
          if (totalError || enrichedError || unenrichedError) {
            console.error('Error counting contributors:', { totalError, enrichedError, unenrichedError });
            return NextResponse.json(
              { error: 'Failed to count contributors' },
              { status: 500 }
            );
          }
          
          return NextResponse.json({
            total: total || 0,
            enriched: enriched || 0,
            unenriched: unenriched || 0
          });
        } else {
          // Just get total count
          const { count, error } = await supabase
            .from('contributors')
            .select('*', { count: 'exact', head: true });
          
          if (error) {
            console.error('Error counting contributors:', error);
            return NextResponse.json(
              { error: 'Failed to count contributors' },
              { status: 500 }
            );
          }
          
          return NextResponse.json({ count: count || 0 });
        }
      }
        
      case 'merge_requests': {
        if (detailed) {
          // Get total count
          const { count: total, error: totalError } = await supabase
            .from('merge_requests')
            .select('*', { count: 'exact', head: true });
            
          let enriched = 0;
          let unenriched = 0;
          
          // Try to get enriched/unenriched counts only if the is_enriched column exists
          try {
            // Get enriched count
            const { count: enrichedCount, error: enrichedError } = await supabase
              .from('merge_requests')
              .select('*', { count: 'exact', head: true })
              .eq('is_enriched', true);
            
            // Get unenriched count
            const { count: unenrichedCount, error: unenrichedError } = await supabase
              .from('merge_requests')
              .select('*', { count: 'exact', head: true })
              .eq('is_enriched', false);
              
            if (!enrichedError && !unenrichedError) {
              enriched = enrichedCount || 0;
              unenriched = unenrichedCount || 0;
            }
          } catch (e) {
            console.warn('is_enriched column may not exist on merge_requests table');
          }
          
          if (totalError) {
            console.error('Error counting merge requests:', totalError);
            return NextResponse.json(
              { error: 'Failed to count merge requests' },
              { status: 500 }
            );
          }
          
          return NextResponse.json({
            total: total || 0,
            enriched: enriched,
            unenriched: unenriched
          });
        } else {
          // Just get total count
          const { count, error } = await supabase
            .from('merge_requests')
            .select('*', { count: 'exact', head: true });
          
          if (error) {
            console.error('Error counting merge requests:', error);
            return NextResponse.json(
              { error: 'Failed to count merge requests' },
              { status: 500 }
            );
          }
          
          return NextResponse.json({ count: count || 0 });
        }
      }
        
      case 'commits': {
        if (detailed) {
          // Get total count
          const { count: total, error: totalError } = await supabase
            .from('commits')
            .select('*', { count: 'exact', head: true });
            
          let enriched = 0;
          let unenriched = 0;
          
          // Try to get enriched/unenriched counts based on is_enriched column first
          try {
            // Get enriched count
            const { count: enrichedCount, error: enrichedError } = await supabase
              .from('commits')
              .select('*', { count: 'exact', head: true })
              .eq('is_enriched', true);
            
            // Get unenriched count
            const { count: unenrichedCount, error: unenrichedError } = await supabase
              .from('commits')
              .select('*', { count: 'exact', head: true })
              .eq('is_enriched', false);
              
            if (!enrichedError && !unenrichedError) {
              enriched = enrichedCount || 0;
              unenriched = unenrichedCount || 0;
            } else {
              // Fallback to complexity_score as an indication of enrichment
              const { count: analyzedCount, error: analyzedError } = await supabase
                .from('commits')
                .select('*', { count: 'exact', head: true })
                .not('complexity_score', 'is', null);
                
              const { count: unanalyzedCount, error: unanalyzedError } = await supabase
                .from('commits')
                .select('*', { count: 'exact', head: true })
                .is('complexity_score', null);
                
              if (!analyzedError && !unanalyzedError) {
                enriched = analyzedCount || 0;
                unenriched = unanalyzedCount || 0;
              }
            }
          } catch (e) {
            console.warn('Error getting enriched/unenriched counts for commits, falling back to complexity_score');
            // Fallback to complexity_score as an indication of enrichment
            try {
              const { count: analyzedCount, error: analyzedError } = await supabase
                .from('commits')
                .select('*', { count: 'exact', head: true })
                .not('complexity_score', 'is', null);
                
              const { count: unanalyzedCount, error: unanalyzedError } = await supabase
                .from('commits')
                .select('*', { count: 'exact', head: true })
                .is('complexity_score', null);
                
              if (!analyzedError && !unanalyzedError) {
                enriched = analyzedCount || 0;
                unenriched = unanalyzedCount || 0;
              }
            } catch (innerError) {
              console.error('Error falling back to complexity_score for commits enrichment status', innerError);
            }
          }
          
          if (totalError) {
            console.error('Error counting commits:', totalError);
            return NextResponse.json(
              { error: 'Failed to count commits' },
              { status: 500 }
            );
          }
          
          return NextResponse.json({
            total: total || 0,
            enriched: enriched,
            unenriched: unenriched
          });
        } else {
          // Just get total count
          const { count, error } = await supabase
            .from('commits')
            .select('*', { count: 'exact', head: true });
          
          if (error) {
            console.error('Error counting commits:', error);
            return NextResponse.json(
              { error: 'Failed to count commits' },
              { status: 500 }
            );
          }
          
          return NextResponse.json({ count: count || 0 });
        }
      }
        
      default:
        return NextResponse.json(
          { error: 'Invalid entity type' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Error in entity counts API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 