import { fetchFromServerApi } from './server-fetch';

/**
 * Types for commit data
 */
export interface CommitSEOData {
  id: string;
  github_id: string; // The SHA
  repository_id: string;
  repository_github_id: string;
  contributor_id?: string;
  contributor_github_id?: string;
  message: string;
  committed_at: string;
}

export interface CommitDetail extends CommitSEOData {
  pull_request_id?: string;
  pull_request_github_id?: number;
  parents?: string[];
  filename?: string;
  status?: string;
  additions?: number;
  deletions?: number;
  patch?: string;
  complexity_score?: number;
  is_merge_commit?: boolean;
}

/**
 * Get a commit by its SHA
 * @param sha The commit SHA
 * @returns The commit data or null if not found
 */
export async function getCommitBySha(sha: string): Promise<CommitDetail | null> {
  try {
    return await fetchFromServerApi<CommitDetail>(`commits/sha/${sha}`);
  } catch (error) {
    console.error(`Error fetching commit by SHA ${sha}:`, error);
    return null;
  }
}

/**
 * Get SEO data for a commit by its SHA
 * @param sha The commit SHA
 * @returns The commit SEO data or null if not found
 */
export async function getCommitSEODataBySha(sha: string): Promise<CommitSEOData | null> {
  try {
    return await fetchFromServerApi<CommitSEOData>(`commits/sha/${sha}/seo`);
  } catch (error) {
    console.error(`Error fetching commit SEO data by SHA ${sha}:`, error);
    return null;
  }
}

/**
 * Get a commit by its ID
 * @param id The commit ID
 * @returns The commit data or null if not found
 */
export async function getCommitById(id: string): Promise<CommitDetail | null> {
  try {
    return await fetchFromServerApi<CommitDetail>(`commits/id/${id}`);
  } catch (error) {
    console.error(`Error fetching commit by ID ${id}:`, error);
    return null;
  }
}

/**
 * Get a commit by repository ID and SHA
 * @param repositoryId The repository ID
 * @param sha The commit SHA
 * @returns The commit data or null if not found
 */
export async function getCommitByRepositoryAndSha(repositoryId: string, sha: string): Promise<CommitDetail | null> {
  try {
    return await fetchFromServerApi<CommitDetail>(
      `commits/repository/${repositoryId}/sha/${sha}`
    );
  } catch (error) {
    console.error(`Error fetching commit by repository ID ${repositoryId} and SHA ${sha}:`, error);
    return null;
  }
}

/**
 * Get files changed in a commit
 * @param repositoryId The repository ID
 * @param commitId The commit ID
 * @returns Array of changed files or empty array if not found
 */
export async function getCommitFiles(repositoryId: string, commitId: string): Promise<CommitDetail[]> {
  try {
    return await fetchFromServerApi<CommitDetail[]>(
      `commits/repository/${repositoryId}/commit/${commitId}/files`
    );
  } catch (error) {
    console.error(`Error fetching commit files for repository ID ${repositoryId} and commit ID ${commitId}:`, error);
    return [];
  }
} 