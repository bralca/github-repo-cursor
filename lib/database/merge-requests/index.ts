/**
 * Merge request database queries
 * Functions for retrieving merge request data from the database
 */

import { getDBConnection } from '../connection';
import { parseRepositorySlug, parseMergeRequestSlug } from '@/lib/url-utils';

/**
 * Get a merge request by its slug
 * @param repositorySlug The SEO-friendly repository slug
 * @param mergeRequestSlug The SEO-friendly merge request slug
 * @returns The merge request data or null if not found
 */
export async function getMergeRequestBySlug(repositorySlug: string, mergeRequestSlug: string) {
  const db = await getDBConnection();
  const repoInfo = parseRepositorySlug(repositorySlug);
  const mrInfo = parseMergeRequestSlug(mergeRequestSlug);
  
  if (!repoInfo || !mrInfo) {
    return null;
  }
  
  try {
    const result = await db.get(
      `SELECT mr.*, r.name as repository_name, r.owner as repository_owner
       FROM merge_requests mr
       JOIN repositories r ON mr.repository_id = r.github_id
       WHERE mr.github_id = ? AND r.github_id = ?`,
      [mrInfo.githubId, repoInfo.githubId]
    );
    return result || null;
  } catch (error) {
    console.error('Error fetching merge request by slug:', error);
    return null;
  }
}

/**
 * Get a merge request by its GitHub ID and repository GitHub ID
 * @param mergeRequestGithubId The GitHub ID of the merge request
 * @param repositoryGithubId The GitHub ID of the repository
 * @returns The merge request data or null if not found
 */
export async function getMergeRequestByGithubId(mergeRequestGithubId: number, repositoryGithubId: number) {
  const db = await getDBConnection();
  
  try {
    const result = await db.get(
      `SELECT mr.*, r.name as repository_name, r.owner as repository_owner
       FROM merge_requests mr
       JOIN repositories r ON mr.repository_id = r.github_id
       WHERE mr.github_id = ? AND r.github_id = ?`,
      [mergeRequestGithubId, repositoryGithubId]
    );
    return result || null;
  } catch (error) {
    console.error('Error fetching merge request by GitHub ID:', error);
    return null;
  }
} 