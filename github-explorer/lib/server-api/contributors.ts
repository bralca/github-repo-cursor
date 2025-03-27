import { fetchFromServerApi } from './server-fetch';

/**
 * Types for contributor data
 */
export interface ContributorSEOData {
  id: string;
  github_id: string;
  username: string;
  name?: string;
  avatar?: string;
  bio?: string;
  followers?: number;
  repositories?: number;
}

export interface ContributorDetail extends ContributorSEOData {
  company?: string;
  blog?: string;
  twitter_username?: string;
  location?: string;
  impact_score?: number;
  role_classification?: string;
  top_languages?: string[];
  first_contribution?: string;
  last_contribution?: string;
  direct_commits?: number;
  pull_requests_merged?: number;
  pull_requests_rejected?: number;
  code_reviews?: number;
  is_bot?: boolean;
}

/**
 * Get a contributor by their GitHub username/slug
 * @param slug The contributor's GitHub username/slug
 * @returns The contributor data or null if not found
 */
export async function getContributorBySlug(slug: string): Promise<ContributorDetail | null> {
  try {
    return await fetchFromServerApi<ContributorDetail>(`contributors/${slug}`);
  } catch (error) {
    console.error(`Error fetching contributor by slug ${slug}:`, error);
    return null;
  }
}

/**
 * Get SEO data for a contributor by their GitHub username/slug
 * @param slug The contributor's GitHub username/slug
 * @returns The contributor SEO data or null if not found
 */
export async function getContributorSEODataBySlug(slug: string): Promise<ContributorSEOData | null> {
  try {
    return await fetchFromServerApi<ContributorSEOData>(`contributors/${slug}/seo`);
  } catch (error) {
    console.error(`Error fetching contributor SEO data by slug ${slug}:`, error);
    return null;
  }
}

/**
 * Get a contributor by their GitHub ID
 * @param githubId The contributor's GitHub ID
 * @returns The contributor data or null if not found
 */
export async function getContributorByGithubId(githubId: string): Promise<ContributorDetail | null> {
  if (!githubId) {
    console.error('getContributorByGithubId called with empty ID');
    return null;
  }
  
  console.log(`[DEBUG API] Fetching contributor by GitHub ID: ${githubId}`);
  
  try {
    // Use the standard endpoint from API Reference Guide
    console.log(`[DEBUG API] Using standard login endpoint for GitHub ID: ${githubId}`);
    return await fetchFromServerApi<ContributorDetail>(`contributors/${githubId}`);
  } catch (error) {
    console.error(`Error fetching contributor by GitHub ID ${githubId}:`, error);
    return null;
  }
}

/**
 * Get SEO data for a contributor by their GitHub ID
 * @param githubId The contributor's GitHub ID
 * @returns The contributor SEO data or null if not found
 */
export async function getContributorSEODataByGithubId(githubId: string): Promise<ContributorSEOData | null> {
  if (!githubId) {
    console.error('getContributorSEODataByGithubId called with empty ID');
    return null;
  }
  
  try {
    // Use the standard endpoint from API Reference Guide
    return await fetchFromServerApi<ContributorSEOData>(`contributors/${githubId}/seo`);
  } catch (error) {
    console.error(`Error fetching contributor SEO data by GitHub ID ${githubId}:`, error);
    return null;
  }
} 