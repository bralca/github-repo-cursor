/**
 * API Client for commits
 * Handles fetching commit data from the backend
 */

import { fetchFromApi } from './api';

/**
 * Get commit data by SHA
 * @param sha Commit SHA
 * @param repositoryId Repository ID
 * @returns Commit data or null if not found
 */
export async function getCommitSEODataBySha(sha: string, repositoryId: string) {
  try {
    return await fetchFromApi(`repositories/${repositoryId}/commits/${sha}`);
  } catch (error) {
    console.error(`Error fetching commit by SHA ${sha}:`, error);
    return null;
  }
}

/**
 * Get files changed in a commit
 * @param sha Commit SHA
 * @param repositoryId Repository ID
 * @returns Array of changed files
 */
export async function getCommitFiles(sha: string, repositoryId: string) {
  try {
    return await fetchFromApi(`repositories/${repositoryId}/commits/${sha}/files`);
  } catch (error) {
    console.error(`Error fetching files for commit ${sha}:`, error);
    return [];
  }
} 