import { withDb } from './connection';
import { parseContributorSlug, generateContributorSlug } from '../url-utils';
import { Database as SQLiteDatabase } from 'sqlite';
import { Database } from '@/types/database';

/**
 * Contributor entity with basic information
 */
export interface Contributor {
  id: string;
  github_id: number;
  username: string | null;
  name: string | null;
  avatar: string | null;
  bio: string | null;
  company: string | null;
  blog: string | null;
  twitter_username: string | null;
  location: string | null;
  followers: number | null;
  repositories: number | null;
  impact_score: number | null;
  role_classification: string | null;
  direct_commits: number | null;
  pull_requests_merged: number | null;
  pull_requests_rejected: number | null;
  code_reviews: number | null;
  first_contribution: string | null;
  last_contribution: string | null;
}

/**
 * Contributor data with minimal fields needed for SSR
 */
export interface ContributorBaseData {
  id: string;
  github_id: number;
  username: string | null;
  name: string | null;
  avatar: string | null;
}

/**
 * Contributor data with fields needed for SEO metadata
 */
export interface ContributorSEOData extends ContributorBaseData {
  bio: string | null;
  company: string | null;
  location: string | null;
  repositories: number | null;
  impact_score: number | null;
  role_classification: string | null;
}

/**
 * Get a contributor by their GitHub ID
 * @param githubId The GitHub ID of the contributor
 * @returns The contributor or null if not found
 */
export async function getContributorByGithubId(githubId: string): Promise<Contributor | null> {
  return withDb(async (db) => {
    const contributor = await db.get<Contributor>(
      `SELECT * FROM contributors WHERE github_id = ?`,
      [githubId]
    );
    
    return contributor || null;
  });
}

/**
 * Get a contributor by their slug (username-githubId)
 * @param slug The contributor slug
 * @returns The contributor or null if not found
 */
export async function getContributorBySlug(slug: string): Promise<Contributor | null> {
  const slugInfo = parseContributorSlug(slug);
  
  if (!slugInfo) {
    return null;
  }
  
  return getContributorByGithubId(slugInfo.githubId);
}

/**
 * Get minimal contributor data needed for SSR by GitHub ID
 * @param githubId The GitHub ID of the contributor
 * @returns Basic contributor data or null if not found
 */
export async function getContributorBaseDataByGithubId(githubId: string): Promise<ContributorBaseData | null> {
  return withDb(async (db) => {
    const contributor = await db.get<ContributorBaseData>(
      `SELECT id, github_id, username, name, avatar
       FROM contributors
       WHERE github_id = ?`,
      [githubId]
    );
    
    return contributor || null;
  });
}

/**
 * Get minimal contributor data needed for SSR by slug
 * @param slug The contributor slug
 * @returns Basic contributor data or null if not found
 */
export async function getContributorBaseDataBySlug(slug: string): Promise<ContributorBaseData | null> {
  const slugInfo = parseContributorSlug(slug);
  
  if (!slugInfo) {
    return null;
  }
  
  return getContributorBaseDataByGithubId(slugInfo.githubId);
}

/**
 * Get contributor data needed for SEO metadata by GitHub ID
 * @param githubId The GitHub ID of the contributor
 * @returns SEO-relevant contributor data or null if not found
 */
export async function getContributorSEODataByGithubId(githubId: string): Promise<ContributorSEOData | null> {
  return withDb(async (db) => {
    const contributor = await db.get<ContributorSEOData>(
      `SELECT id, github_id, username, name, avatar,
              bio, company, location, repositories,
              impact_score, role_classification
       FROM contributors
       WHERE github_id = ?`,
      [githubId]
    );
    
    return contributor || null;
  });
}

/**
 * Get contributor data needed for SEO metadata by slug
 * @param slug The contributor slug
 * @returns SEO-relevant contributor data or null if not found
 */
export async function getContributorSEODataBySlug(slug: string): Promise<ContributorSEOData | null> {
  const slugInfo = parseContributorSlug(slug);
  
  if (!slugInfo) {
    return null;
  }
  
  return getContributorSEODataByGithubId(slugInfo.githubId);
}

/**
 * Get a list of top contributors with pagination
 * @param page Page number (1-based)
 * @param limit Number of items per page
 * @returns Array of contributors with their slugs
 */
export async function getTopContributors(page: number = 1, limit: number = 10): Promise<(Contributor & { slug: string })[]> {
  return withDb(async (db) => {
    const offset = (page - 1) * limit;
    
    const contributors = await db.all<Contributor>(
      `SELECT * FROM contributors 
       WHERE username IS NOT NULL
       ORDER BY impact_score DESC, followers DESC
       LIMIT ? OFFSET ?`,
      [limit, offset]
    );
    
    // Add slugs to each contributor
    return contributors.map((contributor) => ({
      ...contributor,
      slug: generateContributorSlug(contributor.username || 'user', contributor.github_id.toString())
    }));
  });
}

/**
 * Get contributors for a specific repository by repository GitHub ID
 * @param repositoryGithubId The GitHub ID of the repository
 * @param limit Maximum number of contributors to return
 * @returns Array of contributors with their slugs
 */
export interface ContributorWithCommitCount extends Contributor {
  commit_count: number;
}

export async function getRepositoryContributors(
  repositoryGithubId: string,
  limit: number = 10
): Promise<(ContributorWithCommitCount & { slug: string })[]> {
  return withDb(async (db) => {
    const contributors = await db.all<ContributorWithCommitCount>(
      `SELECT c.*, cr.commit_count
       FROM contributors c
       JOIN contributor_repository cr ON c.id = cr.contributor_id
       JOIN repositories r ON cr.repository_id = r.id
       WHERE r.github_id = ?
       ORDER BY cr.commit_count DESC
       LIMIT ?`,
      [repositoryGithubId, limit]
    );
    
    // Add slugs to each contributor
    return contributors.map((contributor) => ({
      ...contributor,
      slug: generateContributorSlug(contributor.username || 'user', contributor.github_id.toString())
    }));
  });
}

/**
 * Search contributors by username, name, or company
 * @param query The search query
 * @param limit Maximum number of results
 * @returns Array of contributors matching the query
 */
export async function searchContributors(query: string, limit: number = 10): Promise<(Contributor & { slug: string })[]> {
  return withDb(async (db) => {
    const searchPattern = `%${query}%`;
    
    const contributors = await db.all<Contributor>(
      `SELECT * FROM contributors 
       WHERE username LIKE ? OR name LIKE ? OR company LIKE ?
       ORDER BY impact_score DESC, followers DESC
       LIMIT ?`,
      [searchPattern, searchPattern, searchPattern, limit]
    );
    
    // Add slugs to each contributor
    return contributors.map((contributor) => ({
      ...contributor,
      slug: generateContributorSlug(contributor.username || 'user', contributor.github_id.toString())
    }));
  });
}

/**
 * Get total count of contributors
 * @returns The total number of contributors
 */
export async function getContributorCount(): Promise<number> {
  return withDb(async (db) => {
    const result = await db.get<{ count: number }>(
      'SELECT COUNT(*) as count FROM contributors'
    );
    
    return result?.count || 0;
  });
} 