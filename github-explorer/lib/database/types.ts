// Common types for database entities
export interface Repository {
  id: number;
  github_id: string | number;
  name: string;
  full_name?: string;
  description?: string;
  stars?: number;
  forks?: number;
  primary_language?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Contributor {
  id: number;
  github_id: string | number;
  name?: string;
  username?: string;
  avatar?: string;
  bio?: string;
  created_at?: string;
  updated_at?: string;
}

export interface MergeRequest {
  id: number;
  github_id: string | number;
  title: string;
  description?: string;
  state?: string;
  created_at?: string;
  updated_at?: string;
  repository_id?: number;
}

export interface Commit {
  id: number;
  github_id: string | number;
  sha: string;
  message: string;
  additions?: number;
  deletions?: number;
  changed_files?: number;
  complexity_score?: number;
  committed_at?: string;
  created_at?: string;
  updated_at?: string;
}

export interface CommitFile {
  id?: number;
  commit_id?: number;
  filename: string;
  status?: string;
  additions?: number;
  deletions?: number;
  changes?: number;
  content?: string;
}