import { withDb } from './connection';
import { parseMergeRequestSlug, generateMergeRequestSlug } from '../url-utils';
import { Database as SQLiteDatabase } from 'sqlite';
import { Database } from '@/types/database';

/**
 * Merge Request entity with basic information
 */
export interface MergeRequest {
  id: string;
  github_id: number;
  repository_id: string;
  repository_github_id: number;
  author_id: string;
  author_github_id: number;
  title: string;
  description: string | null;
  state: string;
  is_draft: boolean;
  created_at: string;
  updated_at: string;
  closed_at: string | null;
  merged_at: string | null;
  merged_by_id: string | null;
  merged_by_github_id: number | null;
  commits_count: number;
  additions: number;
  deletions: number;
  changed_files: number;
  complexity_score: number | null;
  review_time_hours: number | null;
  cycle_time_hours: number | null;
  labels: string | null;
  source_branch: string | null;
  target_branch: string | null;
  review_count: number;
  comment_count: number;
}

/**
 * Merge Request data with minimal fields needed for SSR
 */
export interface MergeRequestBaseData {
  id: string;
  github_id: number;
  repository_id: string;
  repository_github_id: number;
  author_id: string;
  author_github_id: number;
  title: string;
  state: string;
  created_at: string;
  updated_at: string;
}

/**
 * Merge Request data with fields needed for SEO metadata
 */
export interface MergeRequestSEOData extends MergeRequestBaseData {
  description: string | null;
  merged_at: string | null;
  commits_count: number;
  additions: number;
  deletions: number;
  changed_files: number;
  complexity_score: number | null;
}

/**
 * Get a merge request by its GitHub ID and repository GitHub ID
 * @param mergeRequestGithubId The GitHub ID of the merge request
 * @param repositoryGithubId The GitHub ID of the repository
 * @returns The merge request or null if not found
 */
export async function getMergeRequestByGithubId(
  mergeRequestGithubId: string,
  repositoryGithubId: string
): Promise<MergeRequest | null> {
  return withDb(async (db) => {
    const mergeRequest = await db.get<MergeRequest>(
      `SELECT * FROM merge_requests 
       WHERE github_id = ? AND repository_github_id = ?`,
      [mergeRequestGithubId, repositoryGithubId]
    );
    
    return mergeRequest || null;
  });
}

/**
 * Get a merge request by its slug (title-githubId)
 * This function extracts the githubId from the slug, and uses the repository GitHub ID
 * from the URL structure /:repositorySlug/merge-requests/:mergeRequestSlug
 * @param slug The merge request slug
 * @param repositoryGithubId The GitHub ID of the repository
 * @returns The merge request or null if not found
 */
export async function getMergeRequestBySlug(
  slug: string,
  repositoryGithubId: string
): Promise<MergeRequest | null> {
  const slugInfo = parseMergeRequestSlug(slug);
  
  if (!slugInfo) {
    return null;
  }
  
  return getMergeRequestByGithubId(
    slugInfo.githubId,
    repositoryGithubId
  );
}

/**
 * Get minimal merge request data needed for SSR by GitHub IDs
 * @param mergeRequestGithubId The GitHub ID of the merge request
 * @param repositoryGithubId The GitHub ID of the repository
 * @returns Basic merge request data or null if not found
 */
export async function getMergeRequestBaseDataByGithubId(
  mergeRequestGithubId: string,
  repositoryGithubId: string
): Promise<MergeRequestBaseData | null> {
  return withDb(async (db) => {
    const mergeRequest = await db.get<MergeRequestBaseData>(
      `SELECT id, github_id, repository_id, repository_github_id,
              author_id, author_github_id, title, state, created_at, updated_at
       FROM merge_requests 
       WHERE github_id = ? AND repository_github_id = ?`,
      [mergeRequestGithubId, repositoryGithubId]
    );
    
    return mergeRequest || null;
  });
}

/**
 * Get minimal merge request data needed for SSR by slug
 * @param slug The merge request slug
 * @param repositoryGithubId The GitHub ID of the repository
 * @returns Basic merge request data or null if not found
 */
export async function getMergeRequestBaseDataBySlug(
  slug: string,
  repositoryGithubId: string
): Promise<MergeRequestBaseData | null> {
  const slugInfo = parseMergeRequestSlug(slug);
  
  if (!slugInfo) {
    return null;
  }
  
  return getMergeRequestBaseDataByGithubId(
    slugInfo.githubId,
    repositoryGithubId
  );
}

/**
 * Get merge request data needed for SEO metadata by GitHub IDs
 * @param mergeRequestGithubId The GitHub ID of the merge request
 * @param repositoryGithubId The GitHub ID of the repository
 * @returns SEO-relevant merge request data or null if not found
 */
export async function getMergeRequestSEODataByGithubId(
  mergeRequestGithubId: string,
  repositoryGithubId: string
): Promise<MergeRequestSEOData | null> {
  return withDb(async (db) => {
    const mergeRequest = await db.get<MergeRequestSEOData>(
      `SELECT id, github_id, repository_id, repository_github_id,
              author_id, author_github_id, title, state, created_at, updated_at,
              description, merged_at, commits_count, additions, deletions,
              changed_files, complexity_score
       FROM merge_requests 
       WHERE github_id = ? AND repository_github_id = ?`,
      [mergeRequestGithubId, repositoryGithubId]
    );
    
    return mergeRequest || null;
  });
}

/**
 * Get merge request data needed for SEO metadata by slug
 * @param slug The merge request slug
 * @param repositoryGithubId The GitHub ID of the repository
 * @returns SEO-relevant merge request data or null if not found
 */
export async function getMergeRequestSEODataBySlug(
  slug: string,
  repositoryGithubId: string
): Promise<MergeRequestSEOData | null> {
  const slugInfo = parseMergeRequestSlug(slug);
  
  if (!slugInfo) {
    return null;
  }
  
  return getMergeRequestSEODataByGithubId(
    slugInfo.githubId,
    repositoryGithubId
  );
}

/**
 * Get a list of merge requests for a repository with pagination
 * @param repositoryGithubId The GitHub ID of the repository
 * @param page Page number (1-based)
 * @param limit Number of items per page
 * @param state Optional filter by state (open, closed, merged)
 * @returns Array of merge requests with their slugs
 */
export async function getRepositoryMergeRequests(
  repositoryGithubId: string,
  page: number = 1,
  limit: number = 10,
  state?: string
): Promise<(MergeRequest & { slug: string })[]> {
  return withDb(async (db) => {
    const offset = (page - 1) * limit;
    
    let query = `
      SELECT * FROM merge_requests 
      WHERE repository_github_id = ?
    `;
    
    const params: any[] = [repositoryGithubId];
    
    if (state) {
      query += ' AND state = ?';
      params.push(state);
    }
    
    query += ` 
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `;
    
    params.push(limit, offset);
    
    const mergeRequests = await db.all(query, params) as MergeRequest[];
    
    // Add slugs to each merge request
    return mergeRequests.map((mr) => ({
      ...mr,
      slug: generateMergeRequestSlug(mr.title, mr.github_id.toString())
    }));
  });
}

/**
 * Get merge requests authored by a contributor
 * @param contributorGithubId The GitHub ID of the contributor
 * @param page Page number (1-based)
 * @param limit Number of items per page
 * @returns Array of merge requests with their slugs
 */
export async function getContributorMergeRequests(
  contributorGithubId: string,
  page: number = 1,
  limit: number = 10
): Promise<(MergeRequest & { slug: string; repository_name: string })[]> {
  return withDb(async (db) => {
    const offset = (page - 1) * limit;
    
    const mergeRequests = await db.all(`
      SELECT mr.*, r.name as repository_name
      FROM merge_requests mr
      JOIN repositories r ON mr.repository_id = r.id
      WHERE mr.author_github_id = ?
      ORDER BY mr.created_at DESC
      LIMIT ? OFFSET ?
    `, [contributorGithubId, limit, offset]) as (MergeRequest & { repository_name: string })[];
    
    // Add slugs to each merge request
    return mergeRequests.map((mr) => ({
      ...mr,
      slug: generateMergeRequestSlug(mr.title, mr.github_id.toString())
    }));
  });
}

/**
 * Search merge requests by title or description
 * @param query The search query
 * @param limit Maximum number of results
 * @returns Array of merge requests matching the query
 */
export async function searchMergeRequests(
  query: string,
  limit: number = 10
): Promise<(MergeRequest & { slug: string; repository_name: string })[]> {
  return withDb(async (db) => {
    const searchPattern = `%${query}%`;
    
    const mergeRequests = await db.all(`
      SELECT mr.*, r.name as repository_name
      FROM merge_requests mr
      JOIN repositories r ON mr.repository_id = r.id
      WHERE mr.title LIKE ? OR mr.description LIKE ?
      ORDER BY mr.created_at DESC
      LIMIT ?
    `, [searchPattern, searchPattern, limit]) as (MergeRequest & { repository_name: string })[];
    
    // Add slugs to each merge request
    return mergeRequests.map((mr) => ({
      ...mr,
      slug: generateMergeRequestSlug(mr.title, mr.github_id.toString())
    }));
  });
}

/**
 * Get total count of merge requests
 * @returns The total number of merge requests
 */
export async function getMergeRequestCount(repositoryGithubId?: string): Promise<number> {
  return withDb(async (db) => {
    let query = 'SELECT COUNT(*) as count FROM merge_requests';
    const params: string[] = [];
    
    if (repositoryGithubId) {
      query += ' WHERE repository_github_id = ?';
      params.push(repositoryGithubId);
    }
    
    const result = await db.get<{ count: number }>(query, params);
    
    return result?.count || 0;
  });
} 