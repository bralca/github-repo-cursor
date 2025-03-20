/**
 * Contributor database queries
 * Functions for retrieving contributor data from the database
 */

import { getDBConnection } from '../connection';
import { parseContributorSlug } from '@/lib/url-utils';

/**
 * Get a contributor by their slug
 * @param slug The SEO-friendly contributor slug
 * @returns The contributor data or null if not found
 */
export async function getContributorBySlug(slug: string) {
  const db = await getDBConnection();
  const contributorInfo = parseContributorSlug(slug);
  
  if (!contributorInfo) {
    return null;
  }
  
  try {
    const result = await db.get(
      `SELECT * FROM contributors WHERE github_id = ?`,
      [contributorInfo.githubId]
    );
    return result || null;
  } catch (error) {
    console.error('Error fetching contributor by slug:', error);
    return null;
  }
}

/**
 * Get a contributor by their GitHub ID
 * @param githubId The GitHub ID of the contributor
 * @returns The contributor data or null if not found
 */
export async function getContributorByGithubId(githubId: number) {
  const db = await getDBConnection();
  
  try {
    const result = await db.get(
      `SELECT * FROM contributors WHERE github_id = ?`,
      [githubId]
    );
    return result || null;
  } catch (error) {
    console.error('Error fetching contributor by GitHub ID:', error);
    return null;
  }
} 