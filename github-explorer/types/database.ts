/**
 * Database types for SQLite database
 */

export interface Database {
  contributors: {
    id: string;
    github_id: number;
    username: string | null;
    name: string | null;
    avatar: string | null;
    is_enriched: boolean;
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
    first_contribution: string | null; // Timestamp
    last_contribution: string | null; // Timestamp
    direct_commits: number | null;
    pull_requests_merged: number | null;
    pull_requests_rejected: number | null;
    code_reviews: number | null;
    is_placeholder: boolean;
    created_at: string; // Timestamp
    updated_at: string; // Timestamp
  };

  repositories: {
    id: string;
    github_id: number;
    name: string;
    full_name: string;
    description: string | null;
    url: string;
    api_url: string;
    stars: number;
    forks: number;
    is_enriched: boolean;
    health_percentage: number | null;
    open_issues_count: number;
    last_updated: string | null; // Timestamp
    size_kb: number | null;
    watchers_count: number;
    primary_language: string | null;
    license: string | null;
    is_fork: boolean;
    is_archived: boolean;
    default_branch: string;
    source: string;
    owner_id: string | null; // Foreign key
    owner_github_id: number | null;
    created_at: string; // Timestamp
    updated_at: string; // Timestamp
  };

  merge_requests: {
    id: string;
    github_id: number;
    repository_id: string;
    repository_github_id: number;
    author_id: string;
    author_github_id: number;
    title: string;
    description: string | null;
    state: string;
    is_draft: boolean;
    created_at: string; // Timestamp
    updated_at: string; // Timestamp
    closed_at: string | null; // Timestamp
    merged_at: string | null; // Timestamp
    merged_by_id: string | null; // Foreign key
    merged_by_github_id: number | null;
    commits_count: number;
    additions: number;
    deletions: number;
    changed_files: number;
    complexity_score: number | null;
    review_time_hours: number | null;
    cycle_time_hours: number | null;
    labels: string | null; // JSON string
    source_branch: string | null;
    target_branch: string | null;
    is_enriched: boolean;
    review_count: number;
    comment_count: number;
  };

  commits: {
    id: string;
    github_id: string; // SHA hash
    sha: string; // Same as github_id for compatibility
    repository_id: string;
    repository_github_id: number;
    contributor_id: string | null;
    contributor_github_id: number | null;
    author: string | null; // Deprecated
    message: string;
    additions: number;
    deletions: number;
    files_changed: number;
    is_merge_commit: boolean;
    committed_at: string; // Timestamp
    pull_request_id: string | null;
    pull_request_github_id: number | null;
    complexity_score: number | null;
    is_placeholder_author: boolean;
    parents: string | null; // JSON string
    is_enriched: boolean;
    created_at: string; // Timestamp
    updated_at: string; // Timestamp
  };

  contributor_repository: {
    id: string;
    contributor_id: string;
    contributor_github_id: number;
    repository_id: string;
    repository_github_id: number;
    commit_count: number;
    pull_requests: number;
    reviews: number;
    issues_opened: number;
    first_contribution_date: string | null; // Timestamp
    last_contribution_date: string | null; // Timestamp
    lines_added: number;
    lines_removed: number;
    created_at: string; // Timestamp
    updated_at: string; // Timestamp
  };

  closed_merge_requests_raw: {
    id: number;
    entity_type: string;
    github_id: string;
    data: string; // JSON string
    fetched_at: string; // Timestamp
    api_endpoint: string | null;
    etag: string | null;
    created_at: string; // Timestamp
  };

  pipeline_history: {
    id: number;
    pipeline_type: string;
    status: string;
    started_at: string; // Timestamp
    completed_at: string | null; // Timestamp
    items_processed: number;
    error_message: string | null;
    details: string | null; // JSON string
  };

  pipeline_schedules: {
    id: number;
    pipeline_type: string;
    is_active: boolean;
    schedule: string; // Cron expression
    last_run: string | null; // Timestamp
    parameters: string | null; // JSON string
  };
} 