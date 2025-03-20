/**
 * Repository database queries
 * Functions for retrieving repository data from the database
 */

import { getDBConnection } from '../connection';
import { parseRepositorySlug } from '@/lib/url-utils';

/**
 * Get a repository by its slug
 * @param slug The SEO-friendly repository slug
 * @returns The repository data or null if not found
 */
export async function getRepositoryBySlug(slug: string) {
  const db = await getDBConnection();
  const repoInfo = parseRepositorySlug(slug);
  
  if (!repoInfo) {
    return null;
  }
  
  try {
    const result = await db.get(
      `SELECT * FROM repositories WHERE github_id = ?`,
      [repoInfo.githubId]
    );
    return result || null;
  } catch (error) {
    console.error('Error fetching repository by slug:', error);
    return null;
  }
}

/**
 * Get a repository by its GitHub ID
 * @param githubId The GitHub ID of the repository
 * @returns The repository data or null if not found
 */
export async function getRepositoryByGithubId(githubId: number) {
  const db = await getDBConnection();
  
  try {
    const result = await db.get(
      `SELECT * FROM repositories WHERE github_id = ?`,
      [githubId]
    );
    return result || null;
  } catch (error) {
    console.error('Error fetching repository by GitHub ID:', error);
    return null;
  }
} 