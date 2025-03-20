import { withDb } from './connection';
import { parseRepositorySlug, generateRepositorySlug } from '../url-utils';
import { Database as SQLiteDatabase } from 'sqlite';
import { Database } from '@/types/database';

/**
 * Repository entity with basic information
 */
export interface Repository {
  id: string;
  github_id: number;
  name: string;
  full_name?: string;
  description?: string;
  url?: string;
  api_url?: string;
  stars?: number;
  forks?: number;
  health_percentage?: number;
  open_issues_count?: number;
  last_updated?: string;
  size_kb?: number;
  watchers_count?: number;
  primary_language?: string;
  license?: string;
  is_fork?: boolean;
  is_archived?: boolean;
  default_branch?: string;
}

/**
 * Repository data with minimal fields needed for SSR
 */
export interface RepositoryBaseData {
  id: string;
  github_id: number;
  name: string;
  full_name: string;
  description: string | null;
  stars: number | null;
  forks: number | null;
}

/**
 * Repository data with fields needed for SEO metadata
 */
export interface RepositorySEOData extends RepositoryBaseData {
  open_issues_count: number | null;
  primary_language: string | null;
  license: string | null;
  last_updated: string | null;
}

/**
 * Get a repository by its GitHub ID
 * @param githubId The GitHub ID of the repository
 * @returns The repository or null if not found
 */
export async function getRepositoryByGithubId(githubId: string): Promise<Repository | null> {
  return withDb(async (db) => {
    const repository = await db.get<Repository>(
      `SELECT * FROM repositories WHERE github_id = ?`,
      [githubId]
    );
    
    return repository || null;
  });
}

/**
 * Get a repository by its slug (name-githubId)
 * @param slug The repository slug
 * @returns The repository or null if not found
 */
export async function getRepositoryBySlug(slug: string): Promise<Repository | null> {
  const slugInfo = parseRepositorySlug(slug);
  
  if (!slugInfo) {
    return null;
  }
  
  return getRepositoryByGithubId(slugInfo.githubId);
}

/**
 * Get minimal repository data needed for SSR by GitHub ID
 * @param githubId The GitHub ID of the repository
 * @returns Basic repository data or null if not found
 */
export async function getRepositoryBaseDataByGithubId(githubId: string): Promise<RepositoryBaseData | null> {
  return withDb(async (db) => {
    const repository = await db.get<RepositoryBaseData>(
      `SELECT id, github_id, name, full_name, description, stars, forks 
       FROM repositories
       WHERE github_id = ?`,
      [githubId]
    );
    
    return repository || null;
  });
}

/**
 * Get minimal repository data needed for SSR by slug
 * @param slug The repository slug
 * @returns Basic repository data or null if not found
 */
export async function getRepositoryBaseDataBySlug(slug: string): Promise<RepositoryBaseData | null> {
  const slugInfo = parseRepositorySlug(slug);
  
  if (!slugInfo) {
    return null;
  }
  
  return getRepositoryBaseDataByGithubId(slugInfo.githubId);
}

/**
 * Get repository data needed for SEO metadata by GitHub ID
 * @param githubId The GitHub ID of the repository
 * @returns SEO-relevant repository data or null if not found
 */
export async function getRepositorySEODataByGithubId(githubId: string): Promise<RepositorySEOData | null> {
  return withDb(async (db) => {
    const repository = await db.get<RepositorySEOData>(
      `SELECT id, github_id, name, full_name, description, stars, forks,
              open_issues_count, primary_language, license, last_updated  
       FROM repositories
       WHERE github_id = ?`,
      [githubId]
    );
    
    return repository || null;
  });
}

/**
 * Get repository data needed for SEO metadata by slug
 * @param slug The repository slug
 * @returns SEO-relevant repository data or null if not found
 */
export async function getRepositorySEODataBySlug(slug: string): Promise<RepositorySEOData | null> {
  const slugInfo = parseRepositorySlug(slug);
  
  if (!slugInfo) {
    return null;
  }
  
  return getRepositorySEODataByGithubId(slugInfo.githubId);
}

/**
 * Get a list of repositories with pagination
 * @param page Page number (1-based)
 * @param limit Number of items per page
 * @returns Array of repositories with their slugs
 */
export async function getRepositories(page: number = 1, limit: number = 10): Promise<(Repository & { slug: string })[]> {
  return withDb(async (db) => {
    const offset = (page - 1) * limit;
    
    const repositories = await db.all<Repository[]>(
      `SELECT * FROM repositories 
       ORDER BY stars DESC
       LIMIT ? OFFSET ?`,
      [limit, offset]
    );
    
    // Add slugs to each repository
    return repositories.map((repo: Repository) => ({
      ...repo,
      slug: generateRepositorySlug(repo.name, repo.github_id.toString())
    }));
  });
}

/**
 * Search repositories by name or description
 * @param query The search query
 * @param limit Maximum number of results
 * @returns Array of repositories matching the query
 */
export async function searchRepositories(query: string, limit: number = 10): Promise<(Repository & { slug: string })[]> {
  return withDb(async (db) => {
    const searchPattern = `%${query}%`;
    
    const repositories = await db.all<Repository[]>(
      `SELECT * FROM repositories 
       WHERE name LIKE ? OR full_name LIKE ? OR description LIKE ?
       ORDER BY stars DESC
       LIMIT ?`,
      [searchPattern, searchPattern, searchPattern, limit]
    );
    
    // Add slugs to each repository
    return repositories.map((repo: Repository) => ({
      ...repo,
      slug: generateRepositorySlug(repo.name, repo.github_id.toString())
    }));
  });
}

/**
 * Get total count of repositories
 * @returns The total number of repositories
 */
export async function getRepositoryCount(): Promise<number> {
  return withDb(async (db) => {
    const result = await db.get<{ count: number }>(
      'SELECT COUNT(*) as count FROM repositories'
    );
    
    return result?.count || 0;
  });
} 