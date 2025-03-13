
# GitHub Analytics Data Integration Roadmap

This document outlines the comprehensive plan for integrating real data from our Supabase database into each page of the GitHub Analytics application.

## Table of Contents

1. [Overview](#overview)
2. [Homepage](#homepage)
3. [Repository Page](#repository-page)
4. [Contributors Page](#contributors-page)
5. [Merge Requests Page](#merge-requests-page)
6. [Commits Page](#commits-page)
7. [Implementation Timeline](#implementation-timeline)
8. [Data Pipeline Enhancements](#data-pipeline-enhancements)

## Overview

The GitHub Analytics application currently uses mock data across several key pages. This roadmap defines the steps needed to replace this mock data with real data from our Supabase database, enhance our data schemas where needed, and implement additional data processing logic.

### Current Status

- **Data Pipeline**: Basic implementation exists in `dataPipeline.ts` but requires optimization
- **Database Schema**: Core tables exist but need enhancements for additional metrics
- **UI Components**: Ready to accept real data but using mock data currently
- **API Integration**: GitHub API integration needs to be expanded for complete data collection

### General Approach

For each page, we will:
1. Identify data gaps between what's displayed and what's available in the database
2. Enhance database schema where needed
3. Extend data pipeline for new data points
4. Implement Supabase queries and data transformations
5. Connect UI components to real data
6. Add loading states and error handling

## Homepage

### Components Using Mock Data

1. **StatsOverview**: Repository and contributor counts
2. **TopContributors**: Contributor rankings and metrics
3. **DeveloperExcellence**: Commit quality awards
4. **TrendingRepos**: Repository popularity metrics
5. **HottestPRs**: Active merge request data

### Data Gaps

| Component | Missing Data Points | Current Status | Acquisition Method |
|-----------|---------------------|----------------|-------------------|
| StatsOverview | Aggregated repository and contributor stats | Partial data exists (counts available but not aggregated) | Backend calculation using existing tables |
| TopContributors | Contribution scores, active duration, ranking | Raw data exists in contributors table but scores not calculated | Backend calculation based on existing metrics |
| DeveloperExcellence | AI analysis of commits, scoring system | Missing completely | New GitHub API integration + AI evaluation pipeline |
| TrendingRepos | Growth metrics, activity trends | Missing star history data | GitHub API for historical star data + backend calculation |
| HottestPRs | Comment counts, review intensity scores | Raw data exists but intensity not calculated | Backend calculation based on comment density and timeline |

### Implementation Plan

1. **Stats Overview (Priority: High)**
   - **Data Source**: Aggregation query on existing tables
   - **Frontend Changes**:
     - Create `useOverviewStats()` React Query hook in `src/hooks/useOverviewStats.ts`
     - Add loading and error states to `StatsOverview` component
     - Replace hardcoded values with dynamic data
   - **Backend Changes**:
     - Create Supabase function for efficient aggregation
   - **Database Changes**: None needed
   - **Implementation Details**:
     ```typescript
     // Example hook implementation
     export const useOverviewStats = () => {
       return useQuery({
         queryKey: ['overviewStats'],
         queryFn: async () => {
           const { data, error } = await supabase.rpc('get_overview_stats');
           if (error) throw error;
           return data;
         }
       });
     }
     ```
     
   - **Database Function**:
     ```sql
     -- Function to get aggregated stats for the overview
     CREATE OR REPLACE FUNCTION get_overview_stats()
     RETURNS json AS $$
     DECLARE
       result json;
     BEGIN
       SELECT json_build_object(
         'totalRepos', (SELECT COUNT(*) FROM repositories),
         'activeContributors', (SELECT COUNT(*) FROM contributors WHERE last_contribution > NOW() - INTERVAL '30 days'),
         'prsThisWeek', (SELECT COUNT(*) FROM merge_requests WHERE created_at > NOW() - INTERVAL '7 days'),
         'dailyCommits', (SELECT COUNT(*) FROM commits WHERE date > NOW() - INTERVAL '1 day')
       ) INTO result;
       
       RETURN result;
     END;
     $$ LANGUAGE plpgsql;
     ```

2. **Top Contributors (Priority: High)**
   - **Data Source**: Raw data exists but needs calculation
   - **Frontend Changes**:
     - Create `useTopContributors(limit)` hook in `src/hooks/useTopContributors.ts`
     - Modify `TopContributors` component to handle loading states and data formatting
   - **Backend Changes**:
     - Create Supabase function to calculate contribution scores
   - **Database Changes**: 
     - Add `contribution_score` column to contributors table
     - Add `active_streak_days` column to track active periods
   - **Implementation Details**:
     - Contribution score algorithm:
       ```typescript
       // Backend calculation (in Edge Function or RPC)
       const contributionScore = 
         (direct_commits * 1) + 
         (pull_requests_merged * 3) + 
         (code_reviews * 2) + 
         (issues_resolved * 1);
       ```
     - Frontend hook:
       ```typescript
       export const useTopContributors = (limit = 3) => {
         return useQuery({
           queryKey: ['topContributors', limit],
           queryFn: async () => {
             const { data, error } = await supabase
               .from('contributors')
               .select('*')
               .order('contribution_score', { ascending: false })
               .limit(limit);
               
             if (error) throw error;
             return data;
           }
         });
       }
       ```

3. **Developer Excellence (Priority: Medium)**
   - **Data Source**: Missing completely, needs new data collection and AI processing
   - **Frontend Changes**:
     - Create `useExcellenceAwards()` hook in `src/hooks/useExcellenceAwards.ts`
     - Update `DeveloperExcellence` component with loading states
   - **Backend Changes**:
     - Create new GitHub API integration for detailed commit data
     - Build AI analysis pipeline to evaluate commits
     - Set up scheduled job to analyze new commits
   - **Database Changes**: 
     - Create new `commit_awards` table
     - Add relationship to `contributors` table
   - **Implementation Details**:
     - GitHub API integration:
       ```typescript
       // Edge Function to fetch and analyze commits
       async function fetchCommitDetails(repo, commit_sha) {
         const octokit = new Octokit({ auth: GITHUB_TOKEN });
         return await octokit.repos.getCommit({
           owner: repo.split('/')[0],
           repo: repo.split('/')[1],
           ref: commit_sha
         });
       }
       ```
     - AI analysis using OpenAI:
       ```typescript
       async function analyzeCommit(commit) {
         const response = await openai.createCompletion({
           model: "gpt-4o-mini",
           prompt: `Analyze this commit:\n${JSON.stringify(commit)}\n\nEvaluate for code quality, impact, and complexity...`,
           max_tokens: 500
         });
         return {
           commitId: commit.sha,
           analysis: response.choices[0].text,
           score: calculateScore(response.choices[0].text)
         };
       }
       ```

4. **Trending Repositories (Priority: Medium)**
   - **Data Source**: Star history missing, repository data exists but lacks trending metrics
   - **Frontend Changes**:
     - Create `useTrendingRepositories()` hook in `src/hooks/useTrendingRepositories.ts`
     - Modify TrendingRepos component to show growth trends
   - **Backend Changes**:
     - Create GitHub API integration to track historical star counts
     - Implement trending algorithm based on growth rate
   - **Database Changes**: 
     - Add `star_history` table to store time-series data
     - Add `growth_rate` column to repositories table
   - **Implementation Details**:
     - GitHub API for star history:
       ```typescript
       // Edge Function to collect star history
       async function fetchStarHistory(repo) {
         const octokit = new Octokit({ auth: GITHUB_TOKEN });
         // Get current star count 
         const { data } = await octokit.repos.get({
           owner: repo.split('/')[0],
           repo: repo.split('/')[1]
         });
         
         // We need to store this with a timestamp to build history
         return {
           repoId: repo.id,
           stars: data.stargazers_count,
           timestamp: new Date()
         };
       }
       ```
     - Growth calculation (weekly basis):
       ```typescript
       // SQL function to calculate growth rates
       CREATE OR REPLACE FUNCTION calculate_repo_growth()
       RETURNS void AS $$
       BEGIN
         UPDATE repositories r
         SET growth_rate = (
           SELECT (current.stars - previous.stars)
           FROM star_history current
           JOIN star_history previous ON previous.repo_id = current.repo_id
           WHERE current.repo_id = r.id
           AND current.timestamp = (SELECT MAX(timestamp) FROM star_history WHERE repo_id = r.id)
           AND previous.timestamp = (SELECT MAX(timestamp) FROM star_history WHERE repo_id = r.id AND timestamp < current.timestamp - INTERVAL '7 days')
         );
       END;
       $$ LANGUAGE plpgsql;
       ```

5. **Hottest PRs (Priority: Medium)**
   - **Data Source**: Raw data exists but review intensity not calculated
   - **Frontend Changes**:
     - Create `useHottestPullRequests()` hook in `src/hooks/useHottestPullRequests.ts`
     - Update HottestPRs component with dynamic data
   - **Backend Changes**:
     - Create algorithm to calculate "review intensity"
   - **Database Changes**: 
     - Add `review_intensity` column to merge_requests table
   - **Implementation Details**:
     - Review intensity calculation:
       ```typescript
       // Function to calculate review intensity
       function calculateReviewIntensity(pr) {
         const commentDensity = pr.review_comments / (pr.lines_added + pr.lines_removed);
         const timeOpenHours = (Date.now() - new Date(pr.created_at).getTime()) / (1000 * 60 * 60);
         const commentRate = pr.review_comments / timeOpenHours;
         
         // Combined score weighted 70/30
         return (commentDensity * 0.7) + (commentRate * 0.3);
       }
       ```
     - SQL implementation:
       ```sql
       -- Update review intensity for all PRs
       CREATE OR REPLACE FUNCTION update_review_intensity()
       RETURNS void AS $$
       BEGIN
         UPDATE merge_requests
         SET review_intensity = CASE
           WHEN (lines_added + lines_removed) = 0 THEN 0
           ELSE (
             -- Comment density (70%)
             (review_comments::float / NULLIF(lines_added + lines_removed, 0)::float) * 0.7 +
             -- Comment rate per hour (30%) with max age of 336 hours (2 weeks)
             (review_comments::float / LEAST(
               EXTRACT(EPOCH FROM (NOW() - created_at)) / 3600, 
               336
             )::float) * 0.3
           )
         END;
       END;
       $$ LANGUAGE plpgsql;
       ```

## Repository Page

### Data Gaps

| Data Point | Current Status | Acquisition Method |
|------------|----------------|-------------------|
| Watchers count | Missing completely | GitHub API integration |
| Primary language | Missing completely | GitHub API integration |
| License information | Missing completely | GitHub API integration |
| Repository size | Missing completely | GitHub API integration |
| Last updated timestamp | Missing completely | GitHub API integration |
| Health percentage | Missing completely, requires calculation | Custom algorithm based on multiple metrics |

### Database Enhancements

1. Add columns to the `repositories` table:
   - `watchers_count` (integer)
   - `primary_language` (text)
   - `license` (text)
   - `size_kb` (integer)
   - `last_updated` (timestamp)
   - `open_issues_count` (integer)
   - `health_percentage` (integer)

### Implementation Plan

1. **Schema Updates (Priority: High)**
   - **Frontend Changes**: None needed initially
   - **Backend Changes**: 
     - Modify GitHub API integration to fetch additional repository details
   - **Database Changes**:
     - Add new columns to repositories table
     ```sql
     ALTER TABLE repositories 
     ADD COLUMN watchers_count INTEGER DEFAULT 0,
     ADD COLUMN primary_language TEXT,
     ADD COLUMN license TEXT,
     ADD COLUMN size_kb INTEGER,
     ADD COLUMN last_updated TIMESTAMP,
     ADD COLUMN open_issues_count INTEGER DEFAULT 0,
     ADD COLUMN health_percentage INTEGER;
     ```
   - **Implementation Details**:
     - GitHub API integration:
       ```typescript
       // Edge Function to fetch repository details
       async function fetchRepositoryDetails(repoName) {
         const octokit = new Octokit({ auth: GITHUB_TOKEN });
         const [owner, repo] = repoName.split('/');
         
         const { data } = await octokit.repos.get({
           owner,
           repo
         });
         
         return {
           id: data.id,
           watchers_count: data.watchers_count,
           primary_language: data.language,
           license: data.license?.name || null,
           size_kb: data.size,
           last_updated: data.updated_at,
           open_issues_count: data.open_issues_count
         };
       }
       ```

2. **Health Metrics (Priority: Medium)**
   - **Data Source**: Multiple metrics needed, some from GitHub API, some calculated
   - **Frontend Changes**:
     - Create `useRepositoryHealth(repoId)` hook
     - Add health indicators to repository dashboard
   - **Backend Changes**:
     - Implement repository health score algorithm
   - **Database Changes**: None additional beyond schema update
   - **Implementation Details**:
     ```typescript
     // Health score calculation algorithm (in Edge Function or backend)
     function calculateHealthScore(repo) {
       // Recent activity: 25%
       const activityScore = calculateActivityScore(repo.last_updated);
       
       // Issue resolution: 25%
       const issueScore = calculateIssueResolutionScore(repo.id);
       
       // Documentation: 25% (requires additional API calls to check README, etc.)
       const docScore = calculateDocumentationScore(repo.id);
       
       // Test coverage: 25% (requires GitHub API to check for test files)
       const testScore = calculateTestCoverageScore(repo.id);
       
       return Math.round((activityScore + issueScore + docScore + testScore) / 4 * 100);
     }
     ```

3. **Data Visualization (Priority: Medium)**
   - **Data Source**: Existing data plus new calculated metrics
   - **Frontend Changes**:
     - Implement `ContributionHeatmap` with real data
     - Create `useRepositoryTimeline` hook for fetching events
   - **Backend Changes**:
     - Create API for timeline data aggregation
   - **Database Changes**: 
     - Create `repository_events` table to store timeline data
   - **Implementation Details**:
     - Timeline data structure:
       ```typescript
       interface RepositoryEvent {
         id: string;
         repository_id: number;
         event_type: 'commit' | 'pull_request' | 'release' | 'issue';
         actor_id: string;
         actor_name: string;
         actor_avatar: string;
         title: string;
         description?: string;
         url?: string;
         created_at: Date;
       }
       ```
     - GitHub API integration for events:
       ```typescript
       async function fetchRepositoryEvents(repoName) {
         const octokit = new Octokit({ auth: GITHUB_TOKEN });
         const [owner, repo] = repoName.split('/');
         
         return await octokit.activity.listRepoEvents({
           owner,
           repo,
           per_page: 100
         });
       }
       ```

4. **UI Integration (Priority: High)**
   - **Data Source**: Various tables and calculated metrics
   - **Frontend Changes**:
     - Create `useRepositoryDetails(repoId)` hook in `src/hooks/useRepositoryDetails.ts`
     - Implement loading states in all repository components
     - Create error handling for failed data fetching
   - **Backend Changes**:
     - Optimize query performance for repository dashboard
   - **Database Changes**: None additional
   - **Implementation Details**:
     ```typescript
     // Repository details query hook
     export const useRepositoryDetails = (repoId: number) => {
       return useQuery({
         queryKey: ['repository', repoId],
         queryFn: async () => {
           const { data, error } = await supabase
             .from('repositories')
             .select(`
               *,
               contributors:contributor_repository(contributor_id, contribution_count)
             `)
             .eq('id', repoId)
             .single();
             
           if (error) throw error;
           return data;
         }
       });
     }
     ```

## Contributors Page

### Data Gaps

| Data Point | Current Status | Acquisition Method |
|------------|----------------|-------------------|
| Extended profile data | Missing completely | GitHub API integration |
| Contribution breakdown | Raw data exists but relationship data incomplete | Calculation from existing data |
| Computed metrics | Raw data exists but metrics not calculated | Backend calculation |
| Historical contribution trends | Missing time-based data | GitHub API integration + time series storage |

### Database Enhancements

1. Enhance `contributors` table with additional fields:
   - `bio` (text)
   - `company` (text)
   - `blog` (text)
   - `twitter_username` (text)
   - `role_classification` (text) - "Core Developer", "Maintainer", etc.

2. Create new table for contribution history:
   - `contribution_history` - time series data of contributor activities

### Implementation Plan

1. **Database Schema Updates (Priority: High)**
   - **Frontend Changes**: None needed initially
   - **Backend Changes**: 
     - Extend GitHub API integration for user profile data
   - **Database Changes**:
     ```sql
     -- Add new columns to contributors table
     ALTER TABLE contributors
     ADD COLUMN bio TEXT,
     ADD COLUMN company TEXT,
     ADD COLUMN blog TEXT,
     ADD COLUMN twitter_username TEXT,
     ADD COLUMN role_classification TEXT;
     
     -- Create contribution history table
     CREATE TABLE contribution_history (
       id SERIAL PRIMARY KEY,
       contributor_id TEXT REFERENCES contributors(id),
       date DATE NOT NULL,
       commit_count INTEGER DEFAULT 0,
       pr_count INTEGER DEFAULT 0,
       review_count INTEGER DEFAULT 0,
       issue_count INTEGER DEFAULT 0,
       created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
     );
     
     -- Add index for performance
     CREATE INDEX idx_contribution_history_contributor_id ON contribution_history(contributor_id);
     CREATE INDEX idx_contribution_history_date ON contribution_history(date);
     ```
   - **Implementation Details**:
     - GitHub API integration for user profiles:
       ```typescript
       async function fetchUserProfile(username) {
         const octokit = new Octokit({ auth: GITHUB_TOKEN });
         
         const { data } = await octokit.users.getByUsername({
           username
         });
         
         return {
           bio: data.bio,
           company: data.company,
           blog: data.blog,
           twitter_username: data.twitter_username,
           avatar: data.avatar_url,
           name: data.name,
           location: data.location
         };
       }
       ```

2. **Data Pipeline Enhancements (Priority: High)**
   - **Data Source**: GitHub API + existing data
   - **Frontend Changes**: None needed initially
   - **Backend Changes**:
     - Implement contributor role classification logic
     - Create time series data collection for contribution history
   - **Database Changes**: None additional beyond schema updates
   - **Implementation Details**:
     - Role classification algorithm:
       ```typescript
       function classifyContributorRole(contributor) {
         const totalContributions = 
           contributor.direct_commits + 
           contributor.pull_requests_merged + 
           contributor.code_reviews;
           
         // Classify based on contribution patterns
         if (totalContributions > 1000) return 'Core Developer';
         if (totalContributions > 500) return 'Regular Contributor';
         if (contributor.code_reviews > 200) return 'Maintainer';
         if (contributor.pull_requests_merged > 100) return 'Active Contributor';
         return 'Occasional Contributor';
       }
       ```
     - Contribution history collection:
       ```typescript
       async function updateContributionHistory() {
         // Get all contributors
         const { data: contributors } = await supabase
           .from('contributors')
           .select('id');
           
         // For each contributor
         for (const contributor of contributors) {
           // Get today's counts from various sources
           const todayCounts = await getTodayContributionCounts(contributor.id);
           
           // Insert into history table
           await supabase
             .from('contribution_history')
             .upsert({
               contributor_id: contributor.id,
               date: new Date().toISOString().split('T')[0],
               commit_count: todayCounts.commits,
               pr_count: todayCounts.prs,
               review_count: todayCounts.reviews,
               issue_count: todayCounts.issues
             });
         }
       }
       ```

3. **Contributor Profile Page (Priority: Medium)**
   - **Data Source**: Enhanced contributors table
   - **Frontend Changes**:
     - Create `useContributorProfile(username)` hook in `src/hooks/useContributorProfile.ts`
     - Implement loading states in ContributorHero component
     - Add error handling for failed profile fetches
   - **Backend Changes**:
     - Create optimized query for contributor profile
   - **Database Changes**: None additional
   - **Implementation Details**:
     ```typescript
     // Contributor profile hook
     export const useContributorProfile = (username: string) => {
       return useQuery({
         queryKey: ['contributor', username],
         queryFn: async () => {
           const { data, error } = await supabase
             .from('contributors')
             .select(`
               *,
               repositories:contributor_repository(repository_id)
             `)
             .eq('username', username)
             .single();
             
           if (error) throw error;
           
           // If we need to fetch repositories details
           if (data?.repositories?.length) {
             const repoIds = data.repositories.map(r => r.repository_id);
             const { data: repoData } = await supabase
               .from('repositories')
               .select('id, name, description, stars')
               .in('id', repoIds);
               
             data.repositoryDetails = repoData;
           }
           
           return data;
         }
       });
     }
     ```

4. **Contribution Metrics (Priority: Medium)**
   - **Data Source**: Raw data exists, needs calculation
   - **Frontend Changes**:
     - Create visualization components for contribution breakdown
     - Implement time series charts for contribution history
   - **Backend Changes**:
     - Create algorithms for impact score calculation
   - **Database Changes**: None additional
   - **Implementation Details**:
     - Impact score calculation:
       ```typescript
       // Impact score algorithm
       function calculateImpactScore(contributor) {
         // Base score from direct contributions
         const baseScore = 
           (contributor.direct_commits * 1) + 
           (contributor.pull_requests_merged * 3) + 
           (contributor.code_reviews * 2);
           
         // Adjust for consistency (using contribution_history)
         const consistencyFactor = calculateConsistencyFactor(contributor.id);
         
         // Adjust for complexity (if we have that data)
         const complexityFactor = calculateComplexityFactor(contributor.id);
         
         return Math.round(baseScore * consistencyFactor * complexityFactor);
       }
       ```

## Merge Requests Page

### Data Gaps

| Data Point | Current Status | Acquisition Method |
|------------|----------------|-------------------|
| Reviewer information | Missing completely | GitHub API integration |
| PR comments data | Missing completely | GitHub API integration |
| PR metrics (review time, cycle time) | Raw data exists but metrics not calculated | Backend calculation |
| PR timeline data | Missing completely | GitHub API integration |
| PR activity data | Missing completely | GitHub API integration |

### Database Enhancements

1. Create new tables:
   - `pull_request_reviewers` - linking reviewers to PRs
   - `pull_request_comments` - storing comment data
   - `pull_request_activities` - timeline of PR events

2. Enhance `merge_requests` table with:
   - `review_time_hours` (float)
   - `cycle_time_hours` (float)
   - `complexity_score` (integer)

### Implementation Plan

1. **Schema Updates (Priority: High)**
   - **Frontend Changes**: None needed initially
   - **Backend Changes**: None needed initially
   - **Database Changes**:
     ```sql
     -- Add metrics columns to merge_requests
     ALTER TABLE merge_requests
     ADD COLUMN review_time_hours FLOAT,
     ADD COLUMN cycle_time_hours FLOAT,
     ADD COLUMN complexity_score INTEGER;
     
     -- Create PR reviewers table
     CREATE TABLE pull_request_reviewers (
       id SERIAL PRIMARY KEY,
       merge_request_id BIGINT REFERENCES merge_requests(id),
       reviewer_id TEXT REFERENCES contributors(id),
       state TEXT,
       submitted_at TIMESTAMP WITH TIME ZONE,
       created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
     );
     
     -- Create PR comments table
     CREATE TABLE pull_request_comments (
       id SERIAL PRIMARY KEY,
       merge_request_id BIGINT REFERENCES merge_requests(id),
       author_id TEXT REFERENCES contributors(id),
       body TEXT,
       created_at TIMESTAMP WITH TIME ZONE,
       updated_at TIMESTAMP WITH TIME ZONE
     );
     
     -- Create PR activities table
     CREATE TABLE pull_request_activities (
       id SERIAL PRIMARY KEY,
       merge_request_id BIGINT REFERENCES merge_requests(id),
       actor_id TEXT REFERENCES contributors(id),
       event_type TEXT NOT NULL,
       details JSONB,
       created_at TIMESTAMP WITH TIME ZONE
     );
     
     -- Add indexes for performance
     CREATE INDEX idx_pr_reviewers_mr_id ON pull_request_reviewers(merge_request_id);
     CREATE INDEX idx_pr_comments_mr_id ON pull_request_comments(merge_request_id);
     CREATE INDEX idx_pr_activities_mr_id ON pull_request_activities(merge_request_id);
     ```
   - **Implementation Details**:
     - PR metrics calculation:
       ```typescript
       // Calculate PR metrics
       function calculatePRMetrics(pr) {
         // Review time: time from creation to first review
         const reviewTime = calculateReviewTime(pr);
         
         // Cycle time: time from creation to merge
         const cycleTime = pr.merged_at 
           ? (new Date(pr.merged_at) - new Date(pr.created_at)) / (1000 * 60 * 60)
           : null;
           
         // Complexity score based on changes and files
         const complexityScore = calculateComplexityScore(pr);
         
         return {
           review_time_hours: reviewTime,
           cycle_time_hours: cycleTime,
           complexity_score: complexityScore
         };
       }
       ```

2. **Data Pipeline Enhancements (Priority: High)**
   - **Data Source**: GitHub API + calculated metrics
   - **Frontend Changes**: None needed initially
   - **Backend Changes**:
     - Extend GitHub API integration to fetch PR comments and reviews
     - Implement metrics calculation in data pipeline
   - **Database Changes**: None additional beyond schema updates
   - **Implementation Details**:
     - GitHub API integration for PR reviews:
       ```typescript
       async function fetchPullRequestReviews(repo, prNumber) {
         const octokit = new Octokit({ auth: GITHUB_TOKEN });
         const [owner, repoName] = repo.split('/');
         
         return await octokit.pulls.listReviews({
           owner,
           repo: repoName,
           pull_number: prNumber
         });
       }
       ```
     - GitHub API integration for PR comments:
       ```typescript
       async function fetchPullRequestComments(repo, prNumber) {
         const octokit = new Octokit({ auth: GITHUB_TOKEN });
         const [owner, repoName] = repo.split('/');
         
         return await octokit.pulls.listReviewComments({
           owner,
           repo: repoName,
           pull_number: prNumber
         });
       }
       ```

3. **PR List View (Priority: High)**
   - **Data Source**: Enhanced merge_requests table
   - **Frontend Changes**:
     - Create `usePullRequests(filters)` hook with filtering
     - Update PullRequestList component to handle real data
     - Add loading and error states
   - **Backend Changes**:
     - Create optimized queries for PR listing with filters
   - **Database Changes**: None additional
   - **Implementation Details**:
     ```typescript
     // PR list hook with filtering
     export const usePullRequests = (filters = {}) => {
       return useQuery({
         queryKey: ['pullRequests', filters],
         queryFn: async () => {
           let query = supabase
             .from('merge_requests')
             .select(`
               *,
               repository:repositories(id, name),
               reviewers:pull_request_reviewers(reviewer_id, state)
             `);
             
           // Apply filters
           if (filters.status) query = query.eq('status', filters.status);
           if (filters.author) query = query.eq('author', filters.author);
           if (filters.repository) query = query.eq('repository_id', filters.repository);
           
           // Apply sorting
           const { sortBy, sortDirection } = filters;
           if (sortBy) {
             query = query.order(sortBy, { ascending: sortDirection === 'asc' });
           } else {
             query = query.order('created_at', { ascending: false });
           }
           
           const { data, error } = await query;
           if (error) throw error;
           return data;
         }
       });
     }
     ```

4. **PR Details View (Priority: Medium)**
   - **Data Source**: Multiple tables for complete PR data
   - **Frontend Changes**:
     - Create `usePullRequestDetails(prId)` hook
     - Implement timeline visualization with actual events
     - Add reviewer information display
   - **Backend Changes**:
     - Create optimized queries for detailed PR view
   - **Database Changes**: None additional
   - **Implementation Details**:
     ```typescript
     // PR details hook
     export const usePullRequestDetails = (prId: number) => {
       return useQuery({
         queryKey: ['pullRequest', prId],
         queryFn: async () => {
           // Get basic PR info
           const { data: pr, error } = await supabase
             .from('merge_requests')
             .select(`
               *,
               repository:repositories(id, name)
             `)
             .eq('id', prId)
             .single();
             
           if (error) throw error;
           
           // Get reviewers
           const { data: reviewers } = await supabase
             .from('pull_request_reviewers')
             .select(`
               *,
               contributor:contributors(id, username, avatar, name)
             `)
             .eq('merge_request_id', prId);
           
           // Get comments
           const { data: comments } = await supabase
             .from('pull_request_comments')
             .select(`
               *,
               author:contributors(id, username, avatar, name)
             `)
             .eq('merge_request_id', prId)
             .order('created_at', { ascending: true });
           
           // Get timeline
           const { data: timeline } = await supabase
             .from('pull_request_activities')
             .select(`
               *,
               actor:contributors(id, username, avatar, name)
             `)
             .eq('merge_request_id', prId)
             .order('created_at', { ascending: true });
           
           return {
             ...pr,
             reviewers: reviewers || [],
             comments: comments || [],
             timeline: timeline || []
           };
         }
       });
     }
     ```

## Commits Page

### Data Gaps

| Data Point | Current Status | Acquisition Method |
|------------|----------------|-------------------|
| Commit context (repository, branch) | Missing repository relationship | Database relationship + GitHub API |
| Extended author information | Basic data exists, needs relationship | Database relationship |
| Commit analysis integration | Analysis table exists but limited integration | Enhanced analysis pipeline |
| Diff visualization context | Basic diff exists but context limited | Enhanced GitHub API integration |

### Database Enhancements

1. Enhance `commits` table with:
   - `repository_id` (foreign key)
   - `branch` (text)
   - `parent_hash` (text)
   - `stats_summary` (jsonb)

### Implementation Plan

1. **Schema Updates (Priority: Medium)**
   - **Frontend Changes**: None needed initially
   - **Backend Changes**: None needed initially
   - **Database Changes**:
     ```sql
     -- Update commits table with additional fields
     ALTER TABLE commits
     ADD COLUMN repository_id INTEGER REFERENCES repositories(id),
     ADD COLUMN branch TEXT,
     ADD COLUMN parent_hash TEXT,
     ADD COLUMN stats_summary JSONB;
     
     -- Add index for performance
     CREATE INDEX idx_commits_repository_id ON commits(repository_id);
     ```
   - **Implementation Details**:
     - GitHub API integration for extended commit data:
       ```typescript
       async function fetchCommitDetails(repo, commitHash) {
         const octokit = new Octokit({ auth: GITHUB_TOKEN });
         const [owner, repoName] = repo.split('/');
         
         const { data } = await octokit.repos.getCommit({
           owner,
           repo: repoName,
           ref: commitHash
         });
         
         return {
           parent_hash: data.parents[0]?.sha,
           stats_summary: {
             additions: data.stats.additions,
             deletions: data.stats.deletions,
             total: data.stats.total
           },
           files: data.files.map(f => ({
             filename: f.filename,
             status: f.status,
             additions: f.additions,
             deletions: f.deletions,
             changes: f.changes
           }))
         };
       }
       ```

2. **Data Pipeline Improvements (Priority: High)**
   - **Data Source**: GitHub API + repository context
   - **Frontend Changes**: None needed initially
   - **Backend Changes**:
     - Enhance commit processing to extract more metadata
     - Link commits to repositories and authors
   - **Database Changes**: None additional beyond schema updates
   - **Implementation Details**:
     ```typescript
     // Enhanced commit processing
     async function processCommit(commitData, repoId) {
       // Extract basic commit info
       const { sha, commit, author, committer, parents, files, stats } = commitData;
       
       // Find or create author in contributors table
       const authorId = await findOrCreateContributor(author);
       
       // Determine branch (requires additional API call)
       const branch = await determineBranch(repoId, sha);
       
       // Insert commit record
       await supabase.from('commits').insert({
         hash: sha,
         title: commit.message.split('\n')[0],
         author: authorId,
         date: commit.author.date,
         diff: generateDiff(files),
         repository_id: repoId,
         branch,
         parent_hash: parents[0]?.sha,
         stats_summary: stats
       });
     }
     ```

3. **Commit Analysis (Priority: Medium)**
   - **Data Source**: Existing analysis table but needs enhancement
   - **Frontend Changes**:
     - Create `useCommitAnalysis(commitId)` hook
     - Enhance UI to display multiple analysis aspects
   - **Backend Changes**:
     - Enhance AI analysis integration
     - Store analysis results in structured format
   - **Database Changes**: 
     - Update `commit_analyses` schema if needed
   - **Implementation Details**:
     ```typescript
     // Enhanced commit analysis hook
     export const useCommitAnalysis = (commitId: string) => {
       return useQuery({
         queryKey: ['commitAnalysis', commitId],
         queryFn: async () => {
           const { data, error } = await supabase
             .from('commit_analyses')
             .select('*')
             .eq('commit_id', commitId);
             
           if (error) throw error;
           return data || [];
         }
       });
     }
     ```
     - Improved analysis generation:
       ```typescript
       async function analyzeCommit(commit) {
         // Fetch the full commit with diff
         const { data: commitData } = await supabase
           .from('commits')
           .select('*')
           .eq('id', commit.id)
           .single();
         
         // Get analysis prompts
         const { data: prompts } = await supabase
           .from('analysis_prompts')
           .select('*');
           
         // For each prompt, generate an analysis
         for (const prompt of prompts) {
           const analysisPrompt = generatePromptFromTemplate(
             prompt.sample_prompt, 
             commitData
           );
           
           const analysisResult = await generateAIAnalysis(analysisPrompt);
           
           // Store the analysis
           await supabase.from('commit_analyses').insert({
             commit_id: commit.id,
             prompt_id: prompt.id,
             title: prompt.data_point,
             content: analysisResult.content,
             score: analysisResult.score,
             icon: getIconForAnalysisType(prompt.data_point)
           });
         }
       }
       ```

4. **UI Enhancements (Priority: Medium)**
   - **Data Source**: Integrated data from multiple tables
   - **Frontend Changes**:
     - Create `useCommitDetails(commitHash)` hook
     - Implement improved diff visualization
     - Show commit in repository context
   - **Backend Changes**:
     - Create optimized queries for commit details
   - **Database Changes**: None additional
   - **Implementation Details**:
     ```typescript
     // Commit details hook
     export const useCommitDetails = (commitHash: string) => {
       return useQuery({
         queryKey: ['commit', commitHash],
         queryFn: async () => {
           const { data: commit, error } = await supabase
             .from('commits')
             .select(`
               *,
               repository:repositories(id, name),
               analyses:commit_analyses(*)
             `)
             .eq('hash', commitHash)
             .single();
             
           if (error) throw error;
           
           // Get author details
           const { data: author } = await supabase
             .from('contributors')
             .select('*')
             .eq('id', commit.author)
             .single();
             
           return {
             ...commit,
             authorDetails: author
           };
         }
       });
     }
     ```

## Implementation Timeline

### Phase 1: Foundation (Weeks 1-2)
- Database schema enhancements for all entities
- Extended data pipeline implementation
- Basic Supabase query hooks

### Phase 2: Core Pages (Weeks 3-4)
- Homepage data integration
- Repository page data integration
- Error handling and loading states

### Phase 3: Advanced Features (Weeks 5-6)
- Contributors page data integration
- Merge Requests page data integration
- Metrics calculations and algorithms

### Phase 4: Refinement (Weeks 7-8)
- Commits page data integration
- Performance optimizations
- Data visualization enhancements

## Data Pipeline Enhancements

The current data pipeline in `dataPipeline.ts` needs several improvements:

### Optimization Areas

1. **Error Handling**
   - Implement more robust error tracking
   - Add retry mechanisms for API failures
   ```typescript
   async function fetchWithRetry(apiCall, maxRetries = 3) {
     let lastError;
     for (let i = 0; i < maxRetries; i++) {
       try {
         return await apiCall();
       } catch (error) {
         console.error(`API call failed (attempt ${i+1}/${maxRetries}):`, error);
         lastError = error;
         // Exponential backoff
         await new Promise(r => setTimeout(r, 1000 * Math.pow(2, i)));
       }
     }
     throw lastError;
   }
   ```

2. **Performance**
   - Implement batch processing
   ```typescript
   async function processBatch(items, processFn, batchSize = 10) {
     for (let i = 0; i < items.length; i += batchSize) {
       const batch = items.slice(i, i + batchSize);
       await Promise.all(batch.map(processFn));
     }
   }
   ```
   - Add rate limiting for GitHub API compliance
   ```typescript
   class RateLimiter {
     queue = [];
     processing = false;
     rateLimit = 10; // requests per second
     
     async add(fn) {
       return new Promise((resolve, reject) => {
         this.queue.push({ fn, resolve, reject });
         if (!this.processing) this.processQueue();
       });
     }
     
     async processQueue() {
       this.processing = true;
       while (this.queue.length > 0) {
         const batch = this.queue.splice(0, this.rateLimit);
         const promises = batch.map(async ({ fn, resolve, reject }) => {
           try {
             const result = await fn();
             resolve(result);
           } catch (error) {
             reject(error);
           }
         });
         
         await Promise.all(promises);
         // Wait for 1 second before next batch
         await new Promise(r => setTimeout(r, 1000));
       }
       this.processing = false;
     }
   }
   ```
   - Use worker threads for heavy processing
   ```typescript
   // In a real implementation, you'd use worker threads or web workers
   // This is a simplified example
   function createWorker(processFn) {
     return {
       process: async (data) => {
         // Simulate offloading to a worker
         return processFn(data);
       }
     };
   }
   ```

3. **Data Validation**
   - Add schema validation for incoming data
   ```typescript
   import { z } from 'zod';
   
   // Define schema
   const repositorySchema = z.object({
     id: z.number(),
     name: z.string(),
     description: z.string().nullable(),
     stars: z.number(),
     forks: z.number(),
     url: z.string().url()
   });
   
   // Validate data
   function validateRepository(data) {
     try {
       return repositorySchema.parse(data);
     } catch (error) {
       console.error('Repository validation failed:', error);
       throw new Error('Invalid repository data format');
     }
   }
   ```
   - Implement data quality checks
   ```typescript
   function checkDataQuality(data, checks) {
     const issues = [];
     
     for (const [field, check] of Object.entries(checks)) {
       if (!check(data[field])) {
         issues.push(`Field "${field}" failed quality check`);
       }
     }
     
     return {
       valid: issues.length === 0,
       issues
     };
   }
   ```

4. **Extensibility**
   - Refactor to modular architecture
   ```typescript
   // Processor interface
   interface DataProcessor {
     canProcess(data: any): boolean;
     process(data: any): Promise<any>;
   }
   
   // Processor registry
   class ProcessorRegistry {
     processors: DataProcessor[] = [];
     
     register(processor: DataProcessor) {
       this.processors.push(processor);
     }
     
     async process(data: any) {
       for (const processor of this.processors) {
         if (processor.canProcess(data)) {
           return await processor.process(data);
         }
       }
       throw new Error('No suitable processor found');
     }
   }
   ```
   - Add plugin system for custom processors
   ```typescript
   // Plugin system example
   class Pipeline {
     processors = new ProcessorRegistry();
     hooks = new Map();
     
     // Register a hook
     registerHook(hookName, callback) {
       if (!this.hooks.has(hookName)) {
         this.hooks.set(hookName, []);
       }
       this.hooks.get(hookName).push(callback);
     }
     
     // Execute hooks
     async executeHook(hookName, data) {
       if (!this.hooks.has(hookName)) return data;
       
       let result = data;
       for (const callback of this.hooks.get(hookName)) {
         result = await callback(result);
       }
       return result;
     }
     
     // Process with hooks
     async process(data) {
       // Pre-processing hooks
       data = await this.executeHook('pre-process', data);
       
       // Core processing
       const result = await this.processors.process(data);
       
       // Post-processing hooks
       return await this.executeHook('post-process', result);
     }
   }
   ```

### Implementation Priority

1. Error handling and data validation (High)
2. Performance improvements (Medium)
3. Extensibility features (Low)

## Conclusion

This roadmap provides a comprehensive plan for replacing mock data with real data from our Supabase database across all application pages. By following this plan, we'll create a fully functional GitHub Analytics application that provides valuable insights into repository and contributor metrics.

The implementation should proceed in phases, starting with the database schema enhancements and core data pipeline improvements, followed by integration with the UI components page by page.
