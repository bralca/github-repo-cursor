import { NextResponse } from 'next/server';
import { withDb } from '@/lib/database/connection';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ repositoryId: string; commitId: string }> }
) {
  try {
    const resolvedParams = await params;
    const { repositoryId, commitId } = resolvedParams;

    // Validate params
    if (!repositoryId || !commitId) {
      return NextResponse.json(
        { error: 'Repository ID and Commit ID are required' },
        { status: 400 }
      );
    }

    // Get commit details
    const commitDetails = await withDb(async (db) => {
      // First get a single commit record to get basic info
      const commit = await db.get(`
        SELECT 
          id,
          github_id,
          sha,
          message,
          committed_at,
          complexity_score
        FROM 
          commits
        WHERE 
          repository_github_id = ? 
          AND github_id = ?
        LIMIT 1
      `, [repositoryId, commitId]);

      if (!commit) {
        return null;
      }

      // Then get aggregated stats for all files in this commit
      const stats = await db.get(`
        SELECT 
          SUM(additions) as additions,
          SUM(deletions) as deletions,
          COUNT(*) as changed_files
        FROM 
          commits
        WHERE 
          repository_github_id = ? 
          AND github_id = ?
      `, [repositoryId, commitId]);

      // Get contributor info
      const contributor = await db.get(`
        SELECT 
          c.name as contributor_name,
          c.username as contributor_username,
          c.avatar as contributor_avatar
        FROM 
          commits cm
        JOIN
          contributors c ON cm.contributor_github_id = c.github_id
        WHERE 
          cm.repository_github_id = ? 
          AND cm.github_id = ?
        LIMIT 1
      `, [repositoryId, commitId]);

      // Combine all data
      return {
        ...commit,
        ...stats,
        ...contributor
      };
    });

    if (!commitDetails) {
      return NextResponse.json(
        { error: 'Commit not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(commitDetails);
  } catch (error) {
    console.error('Error fetching commit details:', error);
    return NextResponse.json(
      { error: 'Failed to fetch commit details' },
      { status: 500 }
    );
  }
} 