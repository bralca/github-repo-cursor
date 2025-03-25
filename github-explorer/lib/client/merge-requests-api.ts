/**
 * API Client for merge requests
 * Handles fetching merge request data from the backend
 */

import { fetchFromApi } from './api';

/**
 * Get merge request data by GitHub ID
 * @param githubId Merge request GitHub ID
 * @param repositoryId Repository GitHub ID
 * @returns Merge request data or null if not found
 */
export async function getMergeRequestSEODataByGithubId(githubId: string, repositoryId: string) {
  try {
    return await fetchFromApi(`repositories/${repositoryId}/merge-requests/${githubId}`);
  } catch (error) {
    console.error(`Error fetching merge request ${githubId} for repository ${repositoryId}:`, error);
    return null;
  }
}

/**
 * Get merge request data by slug
 * @param slug Merge request slug
 * @param repositoryId Repository GitHub ID
 * @returns Merge request data or null if not found
 */
export async function getMergeRequestBySlug(slug: string, repositoryId: string) {
  try {
    return await fetchFromApi(`repositories/${repositoryId}/merge-requests/slug/${slug}`);
  } catch (error) {
    console.error(`Error fetching merge request by slug ${slug}:`, error);
    return null;
  }
}

/**
 * Get merge requests for a repository
 * @param repositoryId Repository GitHub ID
 * @param page Page number
 * @param limit Number of items per page
 * @returns Array of merge requests
 */
export async function getRepositoryMergeRequests(repositoryId: string, page = 1, limit = 10) {
  try {
    return await fetchFromApi(
      `repositories/${repositoryId}/merge-requests`,
      'GET',
      { page: page.toString(), limit: limit.toString() }
    );
  } catch (error) {
    console.error(`Error fetching merge requests for repository ${repositoryId}:`, error);
    return [];
  }
} 