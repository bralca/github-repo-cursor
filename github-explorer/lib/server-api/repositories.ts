import { fetchFromServerApi } from './server-fetch';

/**
 * Types for repository data
 */
export interface RepositorySEOData {
  id: string;
  github_id: string;
  name: string;
  full_name: string;
  description?: string;
  url: string;
  stars?: number;
  forks?: number;
  primary_language?: string;
}

export interface RepositoryDetail extends RepositorySEOData {
  api_url: string;
  health_percentage?: number;
  open_issues_count?: number;
  last_updated?: string;
  size_kb?: number;
  watchers_count?: number;
  license?: string;
  is_fork?: boolean;
  is_archived?: boolean;
  default_branch?: string;
  owner_id?: string;
  owner_github_id?: string;
}

/**
 * Get a repository by its slug (full_name)
 * @param slug The repository slug (full_name, e.g. "owner/repo")
 * @returns The repository data or null if not found
 */
export async function getRepositoryBySlug(slug: string): Promise<RepositoryDetail | null> {
  try {
    return await fetchFromServerApi<RepositoryDetail>(`repositories/${slug}`);
  } catch (error) {
    console.error(`Error fetching repository by slug ${slug}:`, error);
    return null;
  }
}

/**
 * Get SEO data for a repository by its slug (full_name)
 * @param slug The repository slug (full_name, e.g. "owner/repo")
 * @returns The repository SEO data or null if not found
 */
export async function getRepositorySEODataBySlug(slug: string): Promise<RepositorySEOData | null> {
  try {
    return await fetchFromServerApi<RepositorySEOData>(`repositories/${slug}/seo`);
  } catch (error) {
    console.error(`Error fetching repository SEO data by slug ${slug}:`, error);
    return null;
  }
}

/**
 * Get a repository by its GitHub ID
 * @param githubId The repository's GitHub ID
 * @returns The repository data or null if not found
 */
export async function getRepositoryByGithubId(githubId: string): Promise<RepositoryDetail | null> {
  try {
    return await fetchFromServerApi<RepositoryDetail>(`repositories/id/${githubId}`);
  } catch (error) {
    console.error(`Error fetching repository by GitHub ID ${githubId}:`, error);
    return null;
  }
}

/**
 * Get SEO data for a repository by its GitHub ID
 * @param githubId The repository's GitHub ID
 * @returns The repository SEO data or null if not found
 */
export async function getRepositorySEODataByGithubId(githubId: string): Promise<RepositorySEOData | null> {
  try {
    return await fetchFromServerApi<RepositorySEOData>(`repositories/id/${githubId}/seo`);
  } catch (error) {
    console.error(`Error fetching repository SEO data by GitHub ID ${githubId}:`, error);
    return null;
  }
} 