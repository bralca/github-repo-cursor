import { fetchFromApi } from './api';

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
  repositories: {
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
   * @returns List of contributors
   */
  async getAll(page = 1, limit = 20): Promise<{ contributors: Contributor[], total: number }> {
    return await fetchFromApi<{ contributors: Contributor[], total: number }>(
      'contributors',
      'GET',
      { page: page.toString(), limit: limit.toString() }
    );
  },
  
  /**
   * Get a contributor by their username
   * @param username Contributor username
   * @returns Contributor detail with associated entities
   */
  async getByUsername(username: string): Promise<ContributorDetail> {
    return await fetchFromApi<ContributorDetail>(
      `contributors/${encodeURIComponent(username)}`
    );
  },
  
  /**
   * Get a contributor by their ID
   * @param id Contributor ID
   * @returns Contributor detail with associated entities
   */
  async getById(id: string): Promise<ContributorDetail> {
    return await fetchFromApi<ContributorDetail>(
      `contributors/id/${id}`
    );
  }
}; 