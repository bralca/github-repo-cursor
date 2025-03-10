/**
 * This is a simplified type definition for the Supabase database.
 * Ideally, these types should be generated from the database schema using
 * the Supabase CLI. For now, we'll define the main types manually.
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      repositories: {
        Row: {
          id: number
          name: string
          description: string | null
          url: string
          stars: number
          forks: number
          is_enriched: boolean | null
          health_percentage: number | null
          open_issues_count: number
          last_updated: string | null
          size_kb: number | null
          watchers_count: number
          primary_language: string | null
          license: string | null
          created_at: string
        }
        Insert: {
          id?: number
          name: string
          description?: string | null
          url: string
          stars?: number
          forks?: number
          is_enriched?: boolean | null
          health_percentage?: number | null
          open_issues_count?: number
          last_updated?: string | null
          size_kb?: number | null
          watchers_count?: number
          primary_language?: string | null
          license?: string | null
          created_at?: string
        }
        Update: {
          id?: number
          name?: string
          description?: string | null
          url?: string
          stars?: number
          forks?: number
          is_enriched?: boolean | null
          health_percentage?: number | null
          open_issues_count?: number
          last_updated?: string | null
          size_kb?: number | null
          watchers_count?: number
          primary_language?: string | null
          license?: string | null
          created_at?: string
        }
      }
      contributors: {
        Row: {
          id: string
          username: string
          name: string | null
          avatar: string | null
          is_enriched: boolean | null
          bio: string | null
          company: string | null
          blog: string | null
          twitter_username: string | null
          location: string | null
          followers: number | null
          repositories: number | null
          impact_score: number | null
          role_classification: string | null
          top_languages: string[] | null
          organizations: string[] | null
          first_contribution: string | null
          last_contribution: string | null
          direct_commits: number | null
          pull_requests_merged: number | null
          pull_requests_rejected: number | null
          code_reviews: number | null
          issues_opened: number | null
          issues_resolved: number | null
        }
        Insert: {
          id: string
          username: string
          name?: string | null
          avatar?: string | null
          is_enriched?: boolean | null
          bio?: string | null
          company?: string | null
          blog?: string | null
          twitter_username?: string | null
          location?: string | null
          followers?: number | null
          repositories?: number | null
          impact_score?: number | null
          role_classification?: string | null
          top_languages?: string[] | null
          organizations?: string[] | null
          first_contribution?: string | null
          last_contribution?: string | null
          direct_commits?: number | null
          pull_requests_merged?: number | null
          pull_requests_rejected?: number | null
          code_reviews?: number | null
          issues_opened?: number | null
          issues_resolved?: number | null
        }
        Update: {
          id?: string
          username?: string
          name?: string | null
          avatar?: string | null
          is_enriched?: boolean | null
          bio?: string | null
          company?: string | null
          blog?: string | null
          twitter_username?: string | null
          location?: string | null
          followers?: number | null
          repositories?: number | null
          impact_score?: number | null
          role_classification?: string | null
          top_languages?: string[] | null
          organizations?: string[] | null
          first_contribution?: string | null
          last_contribution?: string | null
          direct_commits?: number | null
          pull_requests_merged?: number | null
          pull_requests_rejected?: number | null
          code_reviews?: number | null
          issues_opened?: number | null
          issues_resolved?: number | null
        }
      }
      contributor_repository: {
        Row: {
          contributor_id: string
          repository_id: number
          contribution_count: number | null
        }
        Insert: {
          contributor_id: string
          repository_id: number
          contribution_count?: number | null
        }
        Update: {
          contributor_id?: string
          repository_id?: number
          contribution_count?: number | null
        }
      }
      merge_requests: {
        Row: {
          id: number
          title: string | null
          description: string | null
          status: string | null
          author: string | null
          author_avatar: string | null
          created_at: string | null
          updated_at: string | null
          closed_at: string | null
          merged_at: string | null
          base_branch: string | null
          head_branch: string | null
          repository_id: number | null
          commits: number | null
          files_changed: number | null
          review_comments: number | null
          lines_added: number | null
          lines_removed: number | null
          cycle_time_hours: number | null
          review_time_hours: number | null
          complexity_score: number | null
          is_enriched: boolean | null
          github_link: string | null
          labels: string[] | null
        }
        Insert: {
          id: number
          title?: string | null
          description?: string | null
          status?: string | null
          author?: string | null
          author_avatar?: string | null
          created_at?: string | null
          updated_at?: string | null
          closed_at?: string | null
          merged_at?: string | null
          base_branch?: string | null
          head_branch?: string | null
          repository_id?: number | null
          commits?: number | null
          files_changed?: number | null
          review_comments?: number | null
          lines_added?: number | null
          lines_removed?: number | null
          cycle_time_hours?: number | null
          review_time_hours?: number | null
          complexity_score?: number | null
          is_enriched?: boolean | null
          github_link?: string | null
          labels?: string[] | null
        }
        Update: {
          id?: number
          title?: string | null
          description?: string | null
          status?: string | null
          author?: string | null
          author_avatar?: string | null
          created_at?: string | null
          updated_at?: string | null
          closed_at?: string | null
          merged_at?: string | null
          base_branch?: string | null
          head_branch?: string | null
          repository_id?: number | null
          commits?: number | null
          files_changed?: number | null
          review_comments?: number | null
          lines_added?: number | null
          lines_removed?: number | null
          cycle_time_hours?: number | null
          review_time_hours?: number | null
          complexity_score?: number | null
          is_enriched?: boolean | null
          github_link?: string | null
          labels?: string[] | null
        }
      }
      commits: {
        Row: {
          id: string
          hash: string
          title: string
          author: string
          date: string
          diff: string
          repository_id: number | null
          merge_request_id: number | null
          is_analyzed: boolean | null
          created_at: string
          is_enriched: boolean | null
          files_changed: number | null
          author_email: string | null
          author_name: string | null
          committer_name: string | null
          committer_email: string | null
          message_body: string | null
          verification_verified: boolean | null
          verification_reason: string | null
          stats_additions: number | null
          stats_deletions: number | null
          stats_total: number | null
          parents: Json[] | null
          authored_date: string | null
          committed_date: string | null
        }
        Insert: {
          id?: string
          hash: string
          title: string
          author: string
          date: string
          diff: string
          repository_id?: number | null
          merge_request_id?: number | null
          is_analyzed?: boolean | null
          created_at?: string
          is_enriched?: boolean | null
          files_changed?: number | null
          author_email?: string | null
          author_name?: string | null
          committer_name?: string | null
          committer_email?: string | null
          message_body?: string | null
          verification_verified?: boolean | null
          verification_reason?: string | null
          stats_additions?: number | null
          stats_deletions?: number | null
          stats_total?: number | null
          parents?: Json[] | null
          authored_date?: string | null
          committed_date?: string | null
        }
        Update: {
          id?: string
          hash?: string
          title?: string
          author?: string
          date?: string
          diff?: string
          repository_id?: number | null
          merge_request_id?: number | null
          is_analyzed?: boolean | null
          created_at?: string
          is_enriched?: boolean | null
          files_changed?: number | null
          author_email?: string | null
          author_name?: string | null
          committer_name?: string | null
          committer_email?: string | null
          message_body?: string | null
          verification_verified?: boolean | null
          verification_reason?: string | null
          stats_additions?: number | null
          stats_deletions?: number | null
          stats_total?: number | null
          parents?: Json[] | null
          authored_date?: string | null
          committed_date?: string | null
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
} 