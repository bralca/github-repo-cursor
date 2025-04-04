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
  direct_commits: number | null;
  pull_requests_merged: number | null;
  pull_requests_rejected: number | null;
  code_reviews: number | null;
  first_contribution: string | null;
  last_contribution: string | null;
  top_languages: string[] | null;
  organizations: string[] | null;
  is_bot: boolean;
  created_at: string;
  updated_at: string;
}

export interface Organization {
  id: string;
  login: string;
  avatar_url: string;
}

export interface ProfileMetadata {
  active_period: string;
  organizations: Organization[];
  top_languages: string[];
  first_contribution_date: string;
  last_contribution_date: string;
  followers: number;
}

export interface ImpactMetrics {
  added: number;
  removed: number;
  total: number;
  ratio: {
    additions: number;
    deletions: number;
  };
}

export type TimeFrame = '30days' | '90days' | '6months' | '1year' | 'all'; 