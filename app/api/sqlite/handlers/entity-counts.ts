import { NextRequest, NextResponse } from 'next/server';
import { withDb } from '@/lib/database/connection';

/**
 * Handler for entity counts endpoint
 */
export async function handleEntityCounts(request: NextRequest) {
  try {
    const counts = await withDb(async (db) => {
      // Initialize counts object
      const counts = {
        repositories: 0,
        contributors: 0,
        merge_requests: 0,
        commits: 0,
        // Add enriched counts
        enriched_repositories: 0,
        enriched_contributors: 0,
        enriched_merge_requests: 0,
        enriched_commits: 0
      };

      // Helper function to check if a table exists
      async function tableExists(tableName: string): Promise<boolean> {
        const result = await db.get(
          "SELECT name FROM sqlite_master WHERE type='table' AND name=?",
          [tableName]
        );
        return !!result;
      }
      
      // Get repository count
      try {
        if (await tableExists('repositories')) {
          const repoCount = await db.get('SELECT COUNT(*) as count FROM repositories');
          counts.repositories = repoCount?.count || 0;
          
          // Get enriched repositories count
          const enrichedRepoCount = await db.get('SELECT COUNT(*) as count FROM repositories WHERE is_enriched = 1');
          counts.enriched_repositories = enrichedRepoCount?.count || 0;
        }
      } catch (e) {
        console.warn('Error counting repositories:', e);
      }
      
      // Get contributors count
      try {
        if (await tableExists('contributors')) {
          const contributorCount = await db.get('SELECT COUNT(*) as count FROM contributors');
          counts.contributors = contributorCount?.count || 0;
          
          // Get enriched contributors count
          const enrichedContribCount = await db.get('SELECT COUNT(*) as count FROM contributors WHERE is_enriched = 1');
          counts.enriched_contributors = enrichedContribCount?.count || 0;
        }
      } catch (e) {
        console.warn('Error counting contributors:', e);
      }
      
      // Get merge requests count
      try {
        if (await tableExists('merge_requests')) {
          const mrCount = await db.get('SELECT COUNT(*) as count FROM merge_requests');
          counts.merge_requests = mrCount?.count || 0;
          
          // Get enriched merge requests count
          const enrichedMrCount = await db.get('SELECT COUNT(*) as count FROM merge_requests WHERE is_enriched = 1');
          counts.enriched_merge_requests = enrichedMrCount?.count || 0;
        }
      } catch (e) {
        console.warn('Error counting merge requests:', e);
      }
      
      // Get commits count
      try {
        if (await tableExists('commits')) {
          const commitCount = await db.get('SELECT COUNT(*) as count FROM commits');
          counts.commits = commitCount?.count || 0;
          
          // Get enriched commits count
          const enrichedCommitCount = await db.get('SELECT COUNT(*) as count FROM commits WHERE is_enriched = 1');
          counts.enriched_commits = enrichedCommitCount?.count || 0;
        }
      } catch (e) {
        console.warn('Error counting commits:', e);
      }
      
      return counts;
    });
    
    return NextResponse.json(counts);
  } catch (error: any) {
    console.error('Error in entity counts API:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
} 