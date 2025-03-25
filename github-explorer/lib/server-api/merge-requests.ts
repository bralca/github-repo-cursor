import { fetchFromServerApi } from './server-fetch';

/**
 * Types for merge request data
 */
export interface MergeRequestSEOData {
  id: string;
  github_id: number;
  repository_id: string;
  repository_github_id: string;
  title: string;
  state: string;
  created_at: string;
  author_id?: string;
  author_github_id?: string;
}

export interface MergeRequestDetail extends MergeRequestSEOData {
  description?: string;
  is_draft?: boolean;
  updated_at?: string;
  closed_at?: string;
  merged_at?: string;
  merged_by_id?: string;
  merged_by_github_id?: string;
  commits_count?: number;
  additions?: number;
  deletions?: number;
  changed_files?: number;
  complexity_score?: number;
  review_time_hours?: number;
  cycle_time_hours?: number;
  labels?: string[];
  source_branch?: string;
  target_branch?: string;
  review_count?: number;
  comment_count?: number;
}

/**
 * Get a merge request by its slug
 * @param slug The merge request slug (typically "repoOwner/repoName/prNumber")
 * @returns The merge request data or null if not found
 */
export async function getMergeRequestBySlug(slug: string): Promise<MergeRequestDetail | null> {
  try {
    return await fetchFromServerApi<MergeRequestDetail>(`merge-requests/${slug}`);
  } catch (error) {
    console.error(`Error fetching merge request by slug ${slug}:`, error);
    return null;
  }
}

/**
 * Get SEO data for a merge request by its slug
 * @param slug The merge request slug
 * @returns The merge request SEO data or null if not found
 */
export async function getMergeRequestSEODataBySlug(slug: string): Promise<MergeRequestSEOData | null> {
  try {
    return await fetchFromServerApi<MergeRequestSEOData>(`merge-requests/${slug}/seo`);
  } catch (error) {
    console.error(`Error fetching merge request SEO data by slug ${slug}:`, error);
    return null;
  }
}

/**
 * Get a merge request by repository ID and PR number
 * @param repositoryId The repository ID
 * @param prNumber The PR number
 * @returns The merge request data or null if not found
 */
export async function getMergeRequestByNumber(repositoryId: string, prNumber: number): Promise<MergeRequestDetail | null> {
  try {
    return await fetchFromServerApi<MergeRequestDetail>(
      `merge-requests/repository/${repositoryId}/number/${prNumber}`
    );
  } catch (error) {
    console.error(`Error fetching merge request by repository ID ${repositoryId} and PR number ${prNumber}:`, error);
    return null;
  }
}

/**
 * Get a merge request by its GitHub ID and repository GitHub ID
 * @param repositoryGithubId The repository's GitHub ID
 * @param prNumber The PR number
 * @returns The merge request data or null if not found
 */
export async function getMergeRequestByGithubId(repositoryGithubId: string, prNumber: number): Promise<MergeRequestDetail | null> {
  try {
    return await fetchFromServerApi<MergeRequestDetail>(
      `merge-requests/repository/github/${repositoryGithubId}/number/${prNumber}`
    );
  } catch (error) {
    console.error(`Error fetching merge request by GitHub ID ${repositoryGithubId} and PR number ${prNumber}:`, error);
    return null;
  }
}

/**
 * Get SEO data for a merge request by its GitHub ID and repository GitHub ID
 * @param repositoryGithubId The repository's GitHub ID
 * @param prNumber The PR number
 * @returns The merge request SEO data or null if not found
 */
export async function getMergeRequestSEODataByGithubId(repositoryGithubId: string, prNumber: number): Promise<MergeRequestSEOData | null> {
  try {
    return await fetchFromServerApi<MergeRequestSEOData>(
      `merge-requests/repository/github/${repositoryGithubId}/number/${prNumber}/seo`
    );
  } catch (error) {
    console.error(`Error fetching merge request SEO data by GitHub ID ${repositoryGithubId} and PR number ${prNumber}:`, error);
    return null;
  }
} 