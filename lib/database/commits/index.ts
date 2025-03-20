/**
 * Commit database queries
 * Functions for retrieving commit data from the database
 */

import { getDBConnection } from '../connection';
import { parseRepositorySlug } from '@/lib/url-utils';

/**
 * Get a commit by its SHA and repository slug
 * @param repositorySlug The SEO-friendly repository slug
 * @param sha The commit SHA
 * @returns The commit data or null if not found
 */
export async function getCommitBySha(repositorySlug: string, sha: string) {
  const db = await getDBConnection();
  const repoInfo = parseRepositorySlug(repositorySlug);
  
  if (!repoInfo) {
    return null;
  }
  
  try {
    const result = await db.get(
      `SELECT c.*, r.name as repository_name, r.owner as repository_owner
       FROM commits c
       JOIN repositories r ON c.repository_id = r.github_id
       WHERE c.sha = ? AND r.github_id = ?`,
      [sha, repoInfo.githubId]
    );
    
    if (!result) {
      return null;
    }
    
    // Get commit files if available
    const files = await db.all(
      `SELECT * FROM commit_files WHERE commit_sha = ? AND repository_id = ?`,
      [sha, repoInfo.githubId]
    );
    
    return {
      ...result,
      files: files || []
    };
  } catch (error) {
    console.error('Error fetching commit by SHA:', error);
    return null;
  }
}

/**
 * Get commits for a repository
 * @param repositorySlug The SEO-friendly repository slug
 * @param page The page number (1-based)
 * @param pageSize The number of commits per page
 * @returns An array of commits
 */
export async function getRepositoryCommits(repositorySlug: string, page = 1, pageSize = 20) {
  const db = await getDBConnection();
  const repoInfo = parseRepositorySlug(repositorySlug);
  
  if (!repoInfo) {
    return [];
  }
  
  try {
    const offset = (page - 1) * pageSize;
    
    const result = await db.all(
      `SELECT c.*, r.name as repository_name, r.owner as repository_owner
       FROM commits c
       JOIN repositories r ON c.repository_id = r.github_id
       WHERE r.github_id = ?
       ORDER BY c.committed_date DESC
       LIMIT ? OFFSET ?`,
      [repoInfo.githubId, pageSize, offset]
    );
    
    return result || [];
  } catch (error) {
    console.error('Error fetching repository commits:', error);
    return [];
  }
} 