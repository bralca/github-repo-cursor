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
        commits: 0
      };
      
      // Get repository count
      try {
        const repoCount = await db.get('SELECT COUNT(*) as count FROM repositories');
        counts.repositories = repoCount?.count || 0;
      } catch (e) {
        console.warn('Error counting repositories:', e);
      }
      
      // Get contributors count
      try {
        const contributorCount = await db.get('SELECT COUNT(*) as count FROM contributors');
        counts.contributors = contributorCount?.count || 0;
      } catch (e) {
        console.warn('Error counting contributors:', e);
      }
      
      // Get merge requests count
      try {
        const mrCount = await db.get('SELECT COUNT(*) as count FROM merge_requests');
        counts.merge_requests = mrCount?.count || 0;
      } catch (e) {
        console.warn('Error counting merge requests:', e);
      }
      
      // Get commits count
      try {
        const commitCount = await db.get('SELECT COUNT(*) as count FROM commits');
        counts.commits = commitCount?.count || 0;
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