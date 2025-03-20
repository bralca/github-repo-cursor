import { withDb } from './connection';
import { parseFileSlug, generateFileSlug } from '../url-utils';
import { Database as SQLiteDatabase } from 'sqlite';
import { Database } from '@/types/database';

/**
 * Commit entity with basic information
 */
export interface Commit {
  id: string;
  github_id: string;
  sha: string;
  repository_id: string;
  repository_github_id: number;
  contributor_id: string | null;
  contributor_github_id: number | null;
  message: string;
  additions: number;
  deletions: number;
  files_changed: number;
  is_merge_commit: boolean;
  committed_at: string;
  pull_request_id: string | null;
  pull_request_github_id: number | null;
  complexity_score: number | null;
  is_placeholder_author: boolean;
  parents: string | null;
  is_enriched: boolean;
}

/**
 * Commit data with minimal fields needed for SSR
 */
export interface CommitBaseData {
  id: string;
  github_id: string;
  sha: string;
  repository_id: string;
  repository_github_id: number;
  contributor_id: string | null;
  contributor_github_id: number | null;
  message: string;
  committed_at: string;
}

/**
 * Commit data with fields needed for SEO metadata
 */
export interface CommitSEOData extends CommitBaseData {
  additions: number;
  deletions: number;
  files_changed: number;
  complexity_score: number | null;
}

/**
 * Get a commit by its SHA (github_id)
 * @param sha The SHA (github_id) of the commit
 * @param repositoryGithubId The GitHub ID of the repository
 * @returns The commit or null if not found
 */
export async function getCommitBySha(
  sha: string,
  repositoryGithubId: string
): Promise<Commit | null> {
  return withDb(async (db) => {
    const commit = await db.get<Commit>(
      `SELECT * FROM commits 
       WHERE (sha = ? OR github_id = ?) AND repository_github_id = ?`,
      [sha, sha, repositoryGithubId]
    );
    
    return commit || null;
  });
}

/**
 * Get minimal commit data needed for SSR by SHA
 * @param sha The SHA (github_id) of the commit
 * @param repositoryGithubId The GitHub ID of the repository
 * @returns Basic commit data or null if not found
 */
export async function getCommitBaseDataBySha(
  sha: string,
  repositoryGithubId: string
): Promise<CommitBaseData | null> {
  return withDb(async (db) => {
    const commit = await db.get<CommitBaseData>(
      `SELECT id, github_id, sha, repository_id, repository_github_id,
              contributor_id, contributor_github_id, message, committed_at
       FROM commits 
       WHERE (sha = ? OR github_id = ?) AND repository_github_id = ?`,
      [sha, sha, repositoryGithubId]
    );
    
    return commit || null;
  });
}

/**
 * Get commit data needed for SEO metadata by SHA
 * @param sha The SHA (github_id) of the commit
 * @param repositoryGithubId The GitHub ID of the repository
 * @returns SEO-relevant commit data or null if not found
 */
export async function getCommitSEODataBySha(
  sha: string,
  repositoryGithubId: string
): Promise<CommitSEOData | null> {
  return withDb(async (db) => {
    const commit = await db.get<CommitSEOData>(
      `SELECT id, github_id, sha, repository_id, repository_github_id,
              contributor_id, contributor_github_id, message, committed_at,
              additions, deletions, files_changed, complexity_score
       FROM commits 
       WHERE (sha = ? OR github_id = ?) AND repository_github_id = ?`,
      [sha, sha, repositoryGithubId]
    );
    
    return commit || null;
  });
}

/**
 * Get a list of commits for a repository with pagination
 * @param repositoryGithubId The GitHub ID of the repository
 * @param page Page number (1-based)
 * @param limit Number of items per page
 * @returns Array of commits
 */
export async function getRepositoryCommits(
  repositoryGithubId: string,
  page: number = 1,
  limit: number = 10
): Promise<Commit[]> {
  return withDb(async (db) => {
    const offset = (page - 1) * limit;
    
    const commits = await db.all(`
      SELECT * FROM commits 
      WHERE repository_github_id = ?
      ORDER BY committed_at DESC
      LIMIT ? OFFSET ?
    `, [repositoryGithubId, limit, offset]) as Commit[];
    
    return commits;
  });
}

/**
 * Get commits authored by a contributor
 * @param contributorGithubId The GitHub ID of the contributor
 * @param page Page number (1-based)
 * @param limit Number of items per page
 * @returns Array of commits with repository name
 */
export interface CommitWithRepository extends Commit {
  repository_name: string;
}

export async function getContributorCommits(
  contributorGithubId: string,
  page: number = 1,
  limit: number = 10
): Promise<CommitWithRepository[]> {
  return withDb(async (db) => {
    const offset = (page - 1) * limit;
    
    const commits = await db.all(`
      SELECT c.*, r.name as repository_name
      FROM commits c
      JOIN repositories r ON c.repository_id = r.id
      WHERE c.contributor_github_id = ?
      ORDER BY c.committed_at DESC
      LIMIT ? OFFSET ?
    `, [contributorGithubId, limit, offset]) as CommitWithRepository[];
    
    return commits;
  });
}

/**
 * Get commits for a specific merge request
 * @param mergeRequestGithubId The GitHub ID of the merge request
 * @param repositoryGithubId The GitHub ID of the repository
 * @param limit Maximum number of commits to return
 * @returns Array of commits
 */
export async function getMergeRequestCommits(
  mergeRequestGithubId: string,
  repositoryGithubId: string,
  limit: number = 10
): Promise<Commit[]> {
  return withDb(async (db) => {
    const commits = await db.all(`
      SELECT * FROM commits
      WHERE pull_request_github_id = ? AND repository_github_id = ?
      ORDER BY committed_at DESC
      LIMIT ?
    `, [mergeRequestGithubId, repositoryGithubId, limit]) as Commit[];
    
    return commits;
  });
}

/**
 * Search commits by message
 * @param query The search query
 * @param limit Maximum number of results
 * @returns Array of commits matching the query with repository name
 */
export async function searchCommits(
  query: string,
  limit: number = 10
): Promise<CommitWithRepository[]> {
  return withDb(async (db) => {
    const searchPattern = `%${query}%`;
    
    const commits = await db.all(`
      SELECT c.*, r.name as repository_name
      FROM commits c
      JOIN repositories r ON c.repository_id = r.id
      WHERE c.message LIKE ?
      ORDER BY c.committed_at DESC
      LIMIT ?
    `, [searchPattern, limit]) as CommitWithRepository[];
    
    return commits;
  });
}

/**
 * Get total count of commits
 * @param repositoryGithubId Optional repository GitHub ID to filter by
 * @returns The total number of commits
 */
export async function getCommitCount(repositoryGithubId?: string): Promise<number> {
  return withDb(async (db) => {
    let query = 'SELECT COUNT(*) as count FROM commits';
    const params: string[] = [];
    
    if (repositoryGithubId) {
      query += ' WHERE repository_github_id = ?';
      params.push(repositoryGithubId);
    }
    
    const result = await db.get<{ count: number }>(query, params);
    
    return result?.count || 0;
  });
} 