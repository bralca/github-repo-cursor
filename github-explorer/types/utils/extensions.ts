/**
 * Application-specific interface extensions
 * This file contains extended types for application-specific needs
 * that build upon the base database schema types.
 */

import { TableRow } from './database';

/**
 * Extended repository interface with computed properties and UI-specific fields
 */
export interface ExtendedRepository extends TableRow<'repositories'> {
  // UI display properties
  isStarred?: boolean;
  isFavorite?: boolean;
  lastVisited?: Date;
  
  // Computed metrics
  commitFrequency?: number;      // Average commits per week
  contributorCount?: number;     // Number of unique contributors
  prMergeRate?: number;          // Percentage of PRs merged vs. rejected
  avgPrReviewTime?: number;      // Average time for PR reviews in hours
  healthScore?: number;          // Overall repository health score (0-100)
  
  // Status flags for UI
  isLoading?: boolean;
  hasError?: boolean;
  errorMessage?: string;
}

/**
 * Extended contributor interface with computed metrics and UI-specific fields
 */
export interface ExtendedContributor extends TableRow<'contributors'> {
  // UI display properties
  isActive?: boolean;            // Has contributed in last 30 days
  isTeamMember?: boolean;        // Belongs to the core team
  
  // Computed metrics
  commitsLastMonth?: number;     // Commits in the last 30 days
  avgCommitSize?: number;        // Average lines changed per commit
  responseTime?: number;         // Average time to respond to issues/PRs
  contributionTrend?: 'increasing' | 'stable' | 'decreasing'; // Trend over time
  
  // Status flags for UI
  isLoading?: boolean;
  hasError?: boolean;
  errorMessage?: string;
}

/**
 * Extended merge request interface with additional fields for application needs
 */
export interface ExtendedMergeRequest extends TableRow<'merge_requests'> {
  // UI display properties
  isPriority?: boolean;          // Marked as high priority
  isBlocked?: boolean;           // Blocked by an issue or dependency
  
  // Computed metrics
  timeToMerge?: number;          // Time from creation to merge (hours)
  reviewIterations?: number;     // Number of review cycles 
  impactScore?: number;          // Estimated impact on codebase (0-100)
  
  // Related entities
  reviewers?: TableRow<'contributors'>[];  // Assigned reviewers
  relatedCommits?: TableRow<'commits'>[];  // Commits included in the PR
  
  // Status flags for UI
  isLoading?: boolean;
  hasError?: boolean;
  errorMessage?: string;
}

/**
 * Extended commit interface with additional fields for the application
 */
export interface ExtendedCommit extends TableRow<'commits'> {
  // UI display properties
  isBreaking?: boolean;          // Contains breaking changes
  isBugfix?: boolean;            // Fixes a bug
  isFeature?: boolean;           // Adds a new feature
  
  // Computed metrics
  complexity?: number;           // Code complexity change (0-100)
  impactScore?: number;          // Impact score (0-100)
  qualityScore?: number;         // Code quality score (0-100)
  
  // Related entities  
  relatedMergeRequest?: TableRow<'merge_requests'>; // Related PR
  
  // File changes breakdown
  fileChanges?: {
    filename: string;
    additions: number;
    deletions: number;
    changeType: 'added' | 'modified' | 'deleted';
  }[];
  
  // Status flags for UI
  isLoading?: boolean;
  hasError?: boolean;
  errorMessage?: string;
}

/**
 * Dashboard card view of a repository for summary displays
 */
export interface RepositoryCardView {
  id: number;
  name: string;
  description: string | null;
  stars: number;
  forks: number;
  lastUpdated: string | null;
  language: string | null;
  healthScore: number | null;
  trendIndicator: 'up' | 'down' | 'stable';
  contributorCount: number;
}

/**
 * Repository statistics for analytics views
 */
export interface RepositoryStats {
  id: number;
  name: string;
  totalCommits: number;
  totalContributors: number;
  commitsPerDay: number;
  openPRs: number;
  closedPRs: number;
  mergeRate: number;
  avgReviewTime: number;
  timeToMerge: number;
  starsGrowth: number;
  codeChurn: number;
  commitsByDay: { date: string; count: number }[];
  prsByDay: { date: string; count: number }[];
  topContributors: { id: string; username: string; commits: number }[];
}

/**
 * Contributor statistics for analytics views
 */
export interface ContributorStats {
  id: string;
  username: string;
  repositories: number;
  totalCommits: number;
  commitsPerMonth: { month: string; count: number }[];
  prsMerged: number;
  prsRejected: number;
  avgPrSize: number;
  codeQualityScore: number;
  responseTime: number;
  contributionTrend: { date: string; value: number }[];
}

/**
 * Status codes for application-specific entity states
 */
export enum EntityStatus {
  ACTIVE = 'active',
  ARCHIVED = 'archived',
  DELETED = 'deleted',
  DRAFT = 'draft',
  PENDING = 'pending'
}

/**
 * Application-specific permission levels
 */
export enum PermissionLevel {
  VIEWER = 'viewer',
  EDITOR = 'editor',
  ADMIN = 'admin',
  OWNER = 'owner'
}

/**
 * User preferences for customizing the application experience
 */
export interface UserPreferences {
  id: string;
  theme: 'light' | 'dark' | 'system';
  defaultView: 'list' | 'grid' | 'compact';
  favoriteRepositories: number[];
  notificationsEnabled: boolean;
  notificationSettings: {
    prReviews: boolean;
    mentions: boolean;
    repositoryUpdates: boolean;
    contributorUpdates: boolean;
  };
  dashboardWidgets: ('activity' | 'contributors' | 'prs' | 'commits' | 'stats')[];
  dateFormat: 'relative' | 'absolute';
} 