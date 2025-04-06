import { fetchFromApi, CACHE_TAGS } from './api';

// Default cache TTL for contributor data (1 hour in seconds)
const CONTRIBUTOR_DATA_TTL = 3600;

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
  top_languages: string | null; // JSON string
  organizations: string | null; // JSON string
  first_contribution: string | null;
  last_contribution: string | null;
  direct_commits: number | null;
  pull_requests_merged: number | null;
  pull_requests_rejected: number | null;
  code_reviews: number | null;
  is_placeholder: boolean;
  is_bot: boolean;
  created_at: string;
  updated_at: string;
  is_enriched: boolean;
}

export interface ContributorDetail extends Contributor {
  contributedRepositories: {
    id: string;
    github_id: number;
    name: string;
    full_name: string;
    stars: number;
    commit_count: number;
  }[];
  merge_requests: {
    id: string;
    github_id: number;
    title: string;
    state: string;
    repository_id: string;
    repository_name: string;
    created_at: string;
  }[];
  commits: {
    id: string;
    github_id: string;
    message: string;
    committed_at: string;
    repository_id: string;
    repository_name: string;
  }[];
}

/**
 * Contributors API client for interacting with contributor endpoints
 */
export const contributorsApi = {
  /**
   * Get all contributors
   * @param page Page number to retrieve
   * @param limit Number of contributors per page
   * @param forceRefresh Optional flag to force a fresh request bypassing the cache
   * @returns List of contributors
   */
  async getAll(page = 1, limit = 20, forceRefresh = false): Promise<{ contributors: Contributor[], total: number }> {
    return await fetchFromApi<{ contributors: Contributor[], total: number }>(
      'contributors',
      'GET',
      { page: page.toString(), limit: limit.toString() },
      undefined,
      {
        // 1-hour cache with selective revalidation through cache tags
        revalidate: CONTRIBUTOR_DATA_TTL,
        forceRefresh,
        tags: [CACHE_TAGS.CONTRIBUTORS]
      }
    );
  },
  
  /**
   * Get a contributor by their username
   * @param username Contributor username
   * @param forceRefresh Optional flag to force a fresh request bypassing the cache
   * @returns Contributor detail with associated entities
   */
  async getByUsername(username: string, forceRefresh = false): Promise<ContributorDetail> {
    const endpoint = `contributors/${encodeURIComponent(username)}`;
    return await fetchFromApi<ContributorDetail>(
      endpoint,
      'GET',
      undefined,
      undefined,
      {
        // 1-hour cache with selective revalidation through cache tags
        revalidate: CONTRIBUTOR_DATA_TTL,
        forceRefresh,
        tags: [CACHE_TAGS.CONTRIBUTORS, `contributor-${username}`]
      }
    );
  },
  
  /**
   * Get a contributor by their ID
   * @param id Contributor ID
   * @param forceRefresh Optional flag to force a fresh request bypassing the cache
   * @returns Contributor detail with associated entities
   */
  async getById(id: string, forceRefresh = false): Promise<ContributorDetail> {
    const endpoint = `contributors/id/${id}`;
    return await fetchFromApi<ContributorDetail>(
      endpoint,
      'GET',
      undefined,
      undefined,
      {
        // 1-hour cache with selective revalidation through cache tags
        revalidate: CONTRIBUTOR_DATA_TTL,
        forceRefresh,
        tags: [CACHE_TAGS.CONTRIBUTORS, `contributor-${id}`]
      }
    );
  },
  
  /**
   * Get a contributor's activity data
   * @param id Contributor ID
   * @param forceRefresh Optional flag to force a fresh request bypassing the cache
   * @returns Contributor activity metrics
   */
  async getActivity(id: string, forceRefresh = false): Promise<any> {
    const endpoint = `contributors/${id}/activity`;
    return await fetchFromApi(
      endpoint,
      'GET',
      undefined,
      undefined,
      {
        // 1-hour cache with selective revalidation through cache tags
        revalidate: CONTRIBUTOR_DATA_TTL,
        forceRefresh,
        tags: [CACHE_TAGS.CONTRIBUTORS, `contributor-${id}-activity`]
      }
    );
  },
  
  /**
   * Get a contributor's impact metrics
   * @param id Contributor ID
   * @param forceRefresh Optional flag to force a fresh request bypassing the cache
   * @returns Contributor impact metrics
   */
  async getImpact(id: string, forceRefresh = false): Promise<any> {
    const endpoint = `contributors/${id}/impact`;
    return await fetchFromApi(
      endpoint,
      'GET',
      undefined,
      undefined,
      {
        // 1-hour cache with selective revalidation through cache tags
        revalidate: CONTRIBUTOR_DATA_TTL,
        forceRefresh,
        tags: [CACHE_TAGS.CONTRIBUTORS, `contributor-${id}-impact`]
      }
    );
  },
  
  /**
   * Get repositories a contributor has contributed to
   * @param id Contributor ID
   * @param forceRefresh Optional flag to force a fresh request bypassing the cache
   * @returns List of repositories
   */
  async getRepositories(id: string, forceRefresh = false): Promise<any> {
    const endpoint = `contributors/${id}/repositories`;
    return await fetchFromApi(
      endpoint,
      'GET',
      undefined,
      undefined,
      {
        // 1-hour cache with selective revalidation through cache tags
        revalidate: CONTRIBUTOR_DATA_TTL,
        forceRefresh,
        tags: [CACHE_TAGS.CONTRIBUTORS, CACHE_TAGS.REPOSITORIES, `contributor-${id}-repos`]
      }
    );
  }
}; 