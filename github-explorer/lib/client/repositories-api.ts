import { fetchFromApi, CACHE_TAGS } from './api';

// Default cache TTL for repository data (1 hour in seconds)
const REPOSITORY_DATA_TTL = 3600;

export interface Repository {
  id: string;
  github_id: number;
  name: string;
  full_name: string;
  description: string | null;
  url: string;
  api_url: string;
  stars: number;
  forks: number;
  health_percentage: number | null;
  open_issues_count: number | null;
  last_updated: string | null;
  size_kb: number | null;
  watchers_count: number | null;
  primary_language: string | null;
  license: string | null;
  is_fork: boolean;
  is_archived: boolean;
  default_branch: string | null;
  source: string | null;
  owner_id: string;
  owner_github_id: number;
  created_at: string;
  updated_at: string;
  is_enriched: boolean;
}

export interface RepositoryDetail extends Repository {
  contributors: {
    id: string;
    github_id: number;
    username: string;
    name: string | null;
    avatar: string | null;
    commit_count: number;
  }[];
  merge_requests: {
    id: string;
    github_id: number;
    title: string;
    state: string;
    created_at: string;
  }[];
  commits: {
    id: string;
    github_id: string;
    message: string;
    committed_at: string;
    contributor_id: string;
    contributor_github_id: number;
  }[];
}

/**
 * Repositories API client for interacting with repository endpoints
 */
export const repositoriesApi = {
  /**
   * Get all repositories
   * @param page Page number to retrieve
   * @param limit Number of repositories per page
   * @param forceRefresh Optional flag to force a fresh request bypassing the cache
   * @returns List of repositories
   */
  async getAll(page = 1, limit = 20, forceRefresh = false): Promise<{ repositories: Repository[], total: number }> {
    return await fetchFromApi<{ repositories: Repository[], total: number }>(
      'repositories',
      'GET',
      { page: page.toString(), limit: limit.toString() },
      undefined,
      {
        // 1-hour cache with selective revalidation through cache tags
        revalidate: REPOSITORY_DATA_TTL,
        forceRefresh,
        tags: [CACHE_TAGS.REPOSITORIES]
      }
    );
  },
  
  /**
   * Get a repository by its slug
   * @param slug Repository slug (owner/name)
   * @param forceRefresh Optional flag to force a fresh request bypassing the cache
   * @returns Repository detail with associated entities
   */
  async getBySlug(slug: string, forceRefresh = false): Promise<RepositoryDetail> {
    const endpoint = `repositories/${encodeURIComponent(slug)}`;
    return await fetchFromApi<RepositoryDetail>(
      endpoint,
      'GET',
      undefined,
      undefined,
      {
        // 1-hour cache with selective revalidation through cache tags
        revalidate: REPOSITORY_DATA_TTL,
        forceRefresh,
        tags: [CACHE_TAGS.REPOSITORIES, `repository-${slug}`]
      }
    );
  },
  
  /**
   * Get a repository by its ID
   * @param id Repository ID
   * @param forceRefresh Optional flag to force a fresh request bypassing the cache
   * @returns Repository detail with associated entities
   */
  async getById(id: string, forceRefresh = false): Promise<RepositoryDetail> {
    const endpoint = `repositories/id/${id}`;
    return await fetchFromApi<RepositoryDetail>(
      endpoint,
      'GET',
      undefined,
      undefined,
      {
        // 1-hour cache with selective revalidation through cache tags
        revalidate: REPOSITORY_DATA_TTL,
        forceRefresh,
        tags: [CACHE_TAGS.REPOSITORIES, `repository-${id}`]
      }
    );
  }
}; 