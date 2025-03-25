import { fetchFromApi } from './api';

// Types for ranking data
export interface ContributorRanking {
  id: string;
  contributor_id: string;
  contributor_github_id: string;
  rank_position: number;
  username: string;
  name?: string;
  avatar?: string;
  total_score: number;
  code_volume_score: number;
  code_efficiency_score: number;
  commit_impact_score: number;
  collaboration_score?: number;
  repo_popularity_score?: number;
  repo_influence_score: number;
  followers_score: number;
  profile_completeness_score: number;
  followers_count: number;
  repositories_contributed: number;
  raw_commits_count: number;
  raw_lines_added: number;
  raw_lines_removed: number;
  calculation_timestamp: string;
  location?: string;
  twitter_username?: string;
  top_languages?: string;
  most_popular_repository?: {
    name: string;
    full_name: string;
    url: string;
    stars: number;
    github_id?: string;
  };
  most_collaborative_merge_request?: {
    id?: string;
    github_id?: string;
    title: string;
    repository_url: string;
    repository_name?: string;
    repository_github_id?: string;
    collaborators: {
      id: string;
      github_id: string;
      name: string;
      username: string;
      avatar: string;
    }[];
    collaborator_count: number;
  };
}

interface RankingsResponse {
  rankings: ContributorRanking[];
  timestamp: string;
}

export interface RankingCalculationResponse {
  success: boolean;
  message: string;
  stats?: {
    calculationsCount: number;
    latestCalculation: string;
    contributorsRanked: number;
  };
}

/**
 * Rankings API client for interacting with contributor ranking endpoints
 */
export const rankingsApi = {
  /**
   * Get the latest contributor rankings
   * @returns Latest contributor rankings data
   */
  async getLatest(): Promise<RankingsResponse> {
    return await fetchFromApi<RankingsResponse>(
      'contributor-rankings',
      'POST',
      undefined,
      {
        operation: 'get_latest'
      }
    );
  },
  
  /**
   * Get contributor rankings for a specific timeframe
   * @param timeframe Timeframe to get rankings for ('24h', '7d', '30d', 'all')
   * @returns Contributor rankings for the specified timeframe
   */
  async getByTimeframe(timeframe: '24h' | '7d' | '30d' | 'all'): Promise<RankingsResponse> {
    return await fetchFromApi<RankingsResponse>(
      'contributor-rankings',
      'POST',
      undefined,
      {
        operation: 'get_by_timeframe',
        timeframe
      }
    );
  },
  
  /**
   * Calculate new contributor rankings
   * @returns Result of the calculation operation
   */
  async calculate(): Promise<RankingCalculationResponse> {
    return await fetchFromApi<RankingCalculationResponse>(
      'contributor-rankings',
      'POST',
      undefined,
      {
        operation: 'calculate'
      }
    );
  }
}; 