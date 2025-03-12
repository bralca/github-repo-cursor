# GitHub Explorer Database Schema

This document provides a comprehensive overview of the database schema used in the GitHub Explorer application. The schema is designed to efficiently store and manage GitHub data including repositories, contributors, commits, merge requests, and related analytics.

## Table of Contents:

- [Overview](#overview)
- [Tables](#tables)
  - [Repositories](#repositories)
  - [Contributors](#contributors)
  - [Contributor_Repository](#contributor_repository)
  - [Merge Requests](#merge_requests)
  - [Commits](#commits)
  - [Github_Raw_Data](#github_raw_data)
  - [Contribution_History](#contribution_history)
  - [Pull_Request_Activities](#pull_request_activities)
  - [Pull_Request_Comments](#pull_request_comments)
  - [Pull_Request_Reviewers](#pull_request_reviewers)
  - [Star_History](#star_history)
  - [Commit_Analyses](#commit_analyses)
  - [Analysis_Prompts](#analysis_prompts)
  - [Pipeline_Runs](#pipeline_runs)
  - [Schema_Migrations](#schema_migrations)
  - [Pipeline_Schedules](#pipeline_schedules)
  - [Pipeline_Configurations](#pipeline_configurations)
  - [Notification_Settings](#notification_settings)
- [Database Functions and Triggers](#database-functions-and-triggers)
- [Entity-Relationship Diagram](#entity-relationship-diagram)
- [Feature Relationships](#feature-relationships)
- [Data Integrity and Validation](#data-integrity-and-validation)
- [Performance Considerations](#performance-considerations)
- [Recent Changes](#recent-changes)
  - [Migration 008: Entity Enrichment Implementation](#migration-008-entity-enrichment-implementation)
  - [Migration 007: Extend BIGINT Support for GitHub IDs](#migration-007-extend-bigint-support-for-github-ids)
  - [Migration 006: Update ID Columns for GitHub Integration](#migration-006-update-id-columns-for-github-integration)
  - [Migration 009: Added GitHub Raw Data Table](#migration-009-added-github-raw-data-table)
  - [Migration 010: Added Source Field to Entity Tables](#migration-010-added-source-field-to-entity-tables)

## Overview

The GitHub Explorer database is structured around core GitHub entities: repositories, contributors, merge requests (pull requests), and commits. It includes additional tables for analytics, historical data tracking, and metadata. The schema supports the application's core functionality of visualizing, analyzing, and exploring GitHub project data.

## Tables

### Repositories

Stores information about GitHub repositories being tracked in the system.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | integer | NO | nextval('repositories_id_seq') | Primary key |
| name | text | NO | | Repository name |
| description | text | YES | | Repository description |
| url | text | NO | | Repository URL |
| stars | integer | NO | 0 | Star count |
| forks | integer | NO | 0 | Fork count |
| is_enriched | boolean | YES | false | Flag indicating if repository has been enriched with additional data |
| health_percentage | integer | YES | | Repository health score (0-100) |
| open_issues_count | integer | NO | 0 | Count of open issues |
| last_updated | timestamp with time zone | YES | | Last update timestamp |
| size_kb | integer | YES | | Repository size in KB |
| watchers_count | integer | NO | 0 | Number of watchers |
| primary_language | text | YES | | Primary programming language |
| license | text | YES | | License information |
| source | text | YES | | Identifies the source of this repository data |
| created_at | timestamp with time zone | NO | timezone('utc'::text, now()) | Creation timestamp |

**Primary Key**: id  
**Indexes**: Primary key index on id  

### Contributors

Stores information about GitHub users who have contributed to tracked repositories.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | text | NO | | Primary key (GitHub username) |
| username | text | NO | | GitHub username |
| name | text | YES | | Display name |
| avatar | text | YES | | URL to avatar image |
| is_enriched | boolean | YES | false | Flag indicating if profile has been enriched |
| bio | text | YES | | User bio |
| company | text | YES | | Company affiliation |
| blog | text | YES | | Blog URL |
| twitter_username | text | YES | | Twitter username |
| location | text | YES | | User location |
| followers | integer | YES | 0 | Follower count |
| repositories | integer | YES | 0 | Number of public repositories |
| impact_score | integer | YES | 0 | Calculated impact score |
| role_classification | text | YES | | Classified contributor role |
| top_languages | text[] | YES | | Array of most used languages |
| organizations | text[] | YES | | Array of organization memberships |
| first_contribution | timestamp with time zone | YES | | Date of first contribution |
| last_contribution | timestamp with time zone | YES | | Date of most recent contribution |
| direct_commits | integer | YES | 0 | Number of direct commits |
| pull_requests_merged | integer | YES | 0 | Number of merged PRs |
| pull_requests_rejected | integer | YES | 0 | Number of rejected PRs |
| code_reviews | integer | YES | 0 | Number of code reviews |
| issues_opened | integer | YES | 0 | Number of issues opened |
| issues_resolved | integer | YES | 0 | Number of issues resolved |
| source | text | YES | | Identifies the source of this contributor data |

**Primary Key**: id  
**Indexes**: Primary key index on id, index on username  

### Contributor_Repository

Junction table establishing many-to-many relationships between contributors and repositories.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| contributor_id | text | NO | | References contributors.id |
| repository_id | bigint | NO | | References repositories.id |
| contribution_count | integer | YES | 0 | Count of contributions |

**Primary Key**: (contributor_id, repository_id)  
**Foreign Keys**:  
- contributor_id references contributors.id  
- repository_id references repositories.id  

### Merge_Requests

Stores information about pull/merge requests from GitHub.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | bigint | NO | | Primary key (GitHub PR ID) |
| title | text | YES | | PR title |
| description | text | YES | | PR description |
| status | text | YES | | PR status (open, closed, merged) |
| author | text | YES | | Author username |
| author_avatar | text | YES | | URL to author's avatar |
| created_at | timestamp with time zone | YES | | Creation timestamp |
| updated_at | timestamp with time zone | YES | | Last update timestamp |
| closed_at | timestamp with time zone | YES | | Closing timestamp |
| merged_at | timestamp with time zone | YES | | Merging timestamp |
| base_branch | text | YES | | Target branch |
| head_branch | text | YES | | Source branch |
| repository_id | bigint | YES | | References repositories.id |
| commits | integer | YES | 0 | Number of commits |
| files_changed | integer | YES | 0 | Number of files changed |
| review_comments | integer | YES | 0 | Number of review comments |
| lines_added | integer | YES | 0 | Lines of code added |
| lines_removed | integer | YES | 0 | Lines of code removed |
| cycle_time_hours | double precision | YES | | Time from creation to merge in hours |
| review_time_hours | double precision | YES | | Time spent in review in hours |
| complexity_score | integer | YES | | Calculated complexity score |
| is_enriched | boolean | YES | false | Flag indicating if PR has been enriched |
| github_link | text | YES | | URL to PR on GitHub |
| labels | text[] | YES | '{}' | Array of PR labels |
| source | text | YES | | Identifies the source of this merge request data |

**Primary Key**: id  
**Foreign Keys**: repository_id references repositories.id  
**Indexes**: Primary key index on id, index on repository_id, index on author  

### Commits

Stores information about git commits.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | uuid | NO | gen_random_uuid() | Primary key |
| hash | text | NO | | Git commit hash |
| title | text | NO | | Commit message title |
| author | text | NO | | Author username |
| date | timestamp with time zone | NO | | Commit date |
| diff | text | NO | | Commit diff content |
| repository_id | integer | YES | | References repositories.id |
| merge_request_id | integer | YES | | References merge_requests.id |
| is_analyzed | boolean | YES | false | Flag indicating if commit has been analyzed |
| created_at | timestamp with time zone | NO | timezone('utc'::text, now()) | Record creation timestamp |
| is_enriched | boolean | YES | false | Flag indicating if commit has been enriched |
| files_changed | integer | YES | | Number of files changed |
| author_email | text | YES | | Author's email |
| author_name | text | YES | | Author's name |
| committer_name | text | YES | | Committer's name |
| committer_email | text | YES | | Committer's email |
| message_body | text | YES | | Full commit message body |
| verification_verified | boolean | YES | | Flag indicating if commit was verified |
| verification_reason | text | YES | | Verification reason |
| stats_additions | integer | YES | | Number of lines added |
| stats_deletions | integer | YES | | Number of lines deleted |
| stats_total | integer | YES | | Total line changes |
| parents | jsonb[] | YES | | Array of parent commit hashes |
| authored_date | timestamp with time zone | YES | | Date authored |
| committed_date | timestamp with time zone | YES | | Date committed |
| source | text | YES | | Identifies the source of this commit data |

**Primary Key**: id  
**Foreign Keys**:  
- repository_id references repositories.id  
- merge_request_id references merge_requests.id  
**Indexes**: Primary key index on id, index on hash, index on author, indexes on repository_id and merge_request_id  

### Github_Raw_Data

Stores raw GitHub API data for later processing.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | bigint | NO | | Primary key |
| data | jsonb | NO | | Raw API response data |
| pr_number | integer | NO | | Pull request number |
| repo_id | bigint | NO | | Repository ID |
| repo_name | text | NO | | Repository name |
| processed | boolean | YES | false | Flag indicating if data has been processed |
| source | text | YES | | Identifies the source of the data (e.g., "edge-function", "pipeline-test") |
| created_at | timestamp with time zone | NO | timezone('utc'::text, now()) | Creation timestamp |
| updated_at | timestamp with time zone | NO | timezone('utc'::text, now()) | Last update timestamp |

**Primary Key**: id  
**Indexes**: Primary key index on id, index on repo_id, index on processed, index on source  

### Contribution_History

Tracks historical contribution data over time.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | integer | NO | nextval('contribution_history_id_seq') | Primary key |
| contributor_id | text | NO | | References contributors.id |
| date | timestamp with time zone | NO | | Contribution date |
| contribution_type | text | NO | | Type of contribution |
| contribution_count | integer | NO | 1 | Count of contributions |
| repository_id | integer | YES | | References repositories.id |
| created_at | timestamp with time zone | NO | timezone('utc'::text, now()) | Record creation timestamp |

**Primary Key**: id  
**Foreign Keys**:  
- contributor_id references contributors.id  
- repository_id references repositories.id  
**Indexes**: Primary key index on id, indexes on contributor_id, repository_id, and date  

### Pull_Request_Activities

Tracks activities and events related to pull requests.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | integer | NO | nextval('pull_request_activities_id_seq') | Primary key |
| pull_request_id | bigint | NO | | References merge_requests.id |
| actor | text | NO | | Username of the actor |
| activity_type | text | NO | | Type of activity |
| created_at | timestamp with time zone | NO | | Activity timestamp |
| created_at_system | timestamp with time zone | NO | timezone('utc'::text, now()) | Record creation timestamp |
| details | jsonb | YES | | Additional activity details |

**Primary Key**: id  
**Foreign Keys**: pull_request_id references merge_requests.id  
**Indexes**: Primary key index on id, index on pull_request_id, index on actor  

### Pull_Request_Comments

Stores comments on pull requests.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | integer | NO | nextval('pull_request_comments_id_seq') | Primary key |
| pull_request_id | bigint | NO | | References merge_requests.id |
| github_id | bigint | NO | | Comment ID from GitHub |
| author | text | NO | | Comment author username |
| content | text | NO | | Comment content |
| created_at | timestamp with time zone | NO | | Creation timestamp |
| updated_at | timestamp with time zone | YES | | Last update timestamp |
| file_path | text | YES | | File path if a review comment |
| line_number | integer | YES | | Line number if a review comment |

**Primary Key**: id  
**Foreign Keys**: pull_request_id references merge_requests.id  
**Indexes**: Primary key index on id, index on pull_request_id, index on author  

### Pull_Request_Reviewers

Tracks reviewers assigned to pull requests.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | integer | NO | nextval('pull_request_reviewers_id_seq') | Primary key |
| pull_request_id | bigint | NO | | References merge_requests.id |
| reviewer_id | text | NO | | References contributors.id |
| status | text | NO | | Review status |
| submitted_at | timestamp with time zone | NO | | Submission timestamp |
| created_at | timestamp with time zone | NO | timezone('utc'::text, now()) | Record creation timestamp |

**Primary Key**: id  
**Foreign Keys**:  
- pull_request_id references merge_requests.id  
- reviewer_id references contributors.id  
**Indexes**: Primary key index on id, indexes on pull_request_id and reviewer_id  

### Star_History

Tracks repository star count over time.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | integer | NO | nextval('star_history_id_seq') | Primary key |
| repository_id | integer | NO | | References repositories.id |
| date | timestamp with time zone | NO | | Date of star count |
| stars_count | integer | NO | | Number of stars |
| cumulative | boolean | NO | true | Whether count is cumulative |
| created_at | timestamp with time zone | NO | timezone('utc'::text, now()) | Record creation timestamp |

**Primary Key**: id  
**Foreign Keys**: repository_id references repositories.id  
**Indexes**: Primary key index on id, index on repository_id, index on date  

### Commit_Analyses

Stores AI-generated analyses of commits.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | uuid | NO | gen_random_uuid() | Primary key |
| commit_id | uuid | YES | | References commits.id |
| title | text | NO | | Analysis title |
| content | text | NO | | Analysis content |
| icon | text | NO | | Icon for the analysis |
| score | integer | YES | | Analysis score |
| prompt_id | integer | YES | | References analysis_prompts.id |
| created_at | timestamp with time zone | NO | timezone('utc'::text, now()) | Creation timestamp |

**Primary Key**: id  
**Foreign Keys**:  
- commit_id references commits.id  
- prompt_id references analysis_prompts.id  
**Indexes**: Primary key index on id, index on commit_id  

### Analysis_Prompts

Stores prompts used for generating commit analyses.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | integer | NO | nextval('analysis_prompts_id_seq') | Primary key |
| number | integer | NO | | Prompt sequence number |
| sample_prompt | text | NO | | Sample prompt text |
| description | text | NO | | Prompt description |
| data_point | text | NO | | Data point being analyzed |
| confidence_score | integer | NO | | Confidence score for analyses |
| data_required | enum | NO | | Type of data required (Patch only, Patch or Before/After) |
| created_at | timestamp with time zone | NO | timezone('utc'::text, now()) | Creation timestamp |

**Primary Key**: id  
**Indexes**: Primary key index on id, index on number  

### Pipeline_Runs

Tracks data pipeline execution runs.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | uuid | NO | | Primary key |
| status | text | NO | | Run status |
| started_at | timestamp with time zone | NO | | Start timestamp |
| completed_at | timestamp with time zone | YES | | Completion timestamp |
| created_at | timestamp with time zone | NO | now() | Creation timestamp |
| github_sync_completed | boolean | NO | false | Flag for GitHub sync step |
| data_processing_completed | boolean | NO | false | Flag for data processing step |
| enrichment_completed | boolean | NO | false | Flag for enrichment step |
| contributor_repo_update_completed | boolean | NO | false | Flag for contributor-repo update step |
| error | text | YES | | Error message if failed |
| current_enrichment_offset | integer | NO | 0 | Current offset in enrichment process |

**Primary Key**: id  
**Indexes**: Primary key index on id, index on status  

### Schema_Migrations

Tracks executed database migrations for schema version management.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | uuid | NO | uuid_generate_v4() | Primary key |
| migration_name | text | NO | | Migration filename |
| executed_at | timestamp with time zone | NO | NOW() | Execution timestamp |
| checksum | text | YES | | File checksum for validation |
| execution_time | integer | YES | | Migration execution time in ms |
| success | boolean | NO | TRUE | Whether migration executed successfully |

**Primary Key**: id  
**Indexes**: Primary key index on id, unique index on migration_name  

### Pipeline_Schedules

Stores pipeline execution schedules with cron expressions.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | uuid | NO | uuid_generate_v4() | Primary key |
| pipeline_type | text | NO | | Type of pipeline to run |
| schedule_name | text | NO | | Schedule name |
| cron_expression | text | NO | | Cron expression for schedule |
| configuration_id | uuid | YES | | References pipeline_configurations.id |
| is_active | boolean | NO | TRUE | Whether schedule is active |
| last_run_at | timestamp with time zone | YES | | Last execution time |
| next_run_at | timestamp with time zone | YES | | Next scheduled execution |
| last_result | jsonb | YES | | Result of last execution |
| created_by | uuid | YES | | User who created schedule |
| created_at | timestamp with time zone | NO | NOW() | Creation timestamp |
| updated_at | timestamp with time zone | YES | | Last update timestamp |
| time_zone | text | NO | 'UTC' | Timezone for schedule |

**Primary Key**: id  
**Foreign Keys**: configuration_id references pipeline_configurations.id  
**Indexes**: Primary key index on id, indexes on pipeline_type, is_active, next_run_at  

### Pipeline_Configurations

Stores pipeline configuration templates.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | uuid | NO | uuid_generate_v4() | Primary key |
| name | text | NO | | Configuration name |
| pipeline_type | text | NO | | Type of pipeline |
| description | text | YES | | Configuration description |
| configuration | jsonb | NO | '{}' | Configuration parameters |
| is_active | boolean | NO | TRUE | Whether configuration is active |
| is_default | boolean | NO | FALSE | Whether configuration is default |
| created_by | uuid | YES | | User who created configuration |
| created_at | timestamp with time zone | NO | NOW() | Creation timestamp |
| updated_at | timestamp with time zone | YES | | Last update timestamp |
| version | integer | NO | 1 | Configuration version |

**Primary Key**: id  
**Indexes**: Primary key index on id, indexes on pipeline_type, is_active, is_default  

### Notification_Settings

Stores notification configuration settings for pipeline events.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | uuid | NO | uuid_generate_v4() | Primary key |
| level | text | NO | | Notification level (info, warning, error) |
| email_enabled | boolean | NO | FALSE | Whether email notifications are enabled |
| email_recipients | text | YES | | List of email recipients |
| webhook_enabled | boolean | NO | FALSE | Whether webhook notifications are enabled |
| webhook_url | text | YES | | Webhook URL |
| is_active | boolean | NO | TRUE | Whether settings are active |
| created_at | timestamp with time zone | NO | NOW() | Creation timestamp |
| updated_at | timestamp with time zone | YES | | Last update timestamp |

**Primary Key**: id  
**Indexes**: Primary key index on id, index on level  
**Constraints**: UNIQUE(level)  

## Database Functions and Triggers

The database includes several functions and triggers to enhance functionality:

### Functions

1. **get_top_contributors_by_commits(limit_count integer)**
   - Returns top contributors based on commit count
   - Parameters: limit_count - maximum number of contributors to return
   - Returns: Table with author (text) and count (bigint)

2. **get_contributor_merge_requests(contributor_id text, limit_count integer DEFAULT 10)**
   - Returns merge requests where a contributor has commits
   - Parameters: contributor_id, limit_count
   - Returns: Table with merge request details

3. **get_contributor_merge_requests_with_impact(p_contributor_id text, p_limit integer DEFAULT 10)**
   - Returns merge requests with contributor impact metrics
   - Parameters: p_contributor_id, p_limit
   - Returns: Table with merge request details and impact metrics

4. **increment_contributor_stats(p_contributor_id text, p_direct_commits integer DEFAULT 0, p_pull_requests_merged integer DEFAULT 0, p_pull_requests_rejected integer DEFAULT 0)**
   - Increments contributor statistics
   - Parameters: p_contributor_id, p_direct_commits, p_pull_requests_merged, p_pull_requests_rejected
   - Returns: void

5. **get_repository_contributors_by_commits(repo_id integer, limit_count integer)**
   - Returns top contributors for a specific repository
   - Parameters: repo_id, limit_count
   - Returns: Table with author, repository_id, and contribution_count

6. **update_contributor_repository_direct()**
   - Updates the contributor_repository table based on commit data
   - Returns: JSON with operation statistics

7. **invoke_full_pipeline()**
   - Invokes the complete data pipeline process
   - Returns: JSON with operation result

8. **list_cron_jobs()**
   - Lists all scheduled cron jobs in the database
   - Returns: Table with job details

9. **delete_all_cron_jobs()**
   - Deletes all scheduled cron jobs
   - Returns: JSON with operation result

10. **get_repository_commit_counts()**
    - Gets commit counts per repository
    - Returns: Table with repository_id and count

11. **get_repository_merge_request_counts()**
    - Gets merge request counts per repository
    - Returns: Table with repository_id and count

12. **log_migration_execution(p_migration_name text, p_checksum text, p_execution_time integer, p_success boolean)**
    - Logs a migration execution to the schema_migrations table
    - Parameters: p_migration_name, p_checksum, p_execution_time, p_success
    - Returns: UUID of the created/updated record

### Triggers

1. **update_updated_at_column()**
   - Updates the updated_at column to current timestamp on record update
   - Applied to: profiles, canvas_images, canvas_connections, canvas_image_metadata

## Entity-Relationship Diagram

```
[Repositories] 1──────*─┐
      │                 │
      │                 ↓
      │          [Star_History]
      │
      │                 ┌─────────*─[Pull_Request_Comments]
      │                 │
      │                 ├─────────*─[Pull_Request_Activities]
      │                 │
      │                 │
      │                 │         
      ├──────1───*─[Merge_Requests]────*─┐
      │                 │               │
      │                 │               │
      │                 │               ↓
      │                 │         [Pull_Request_Reviewers]
      │                 │               │
      │                 │               │
      ↓                 ↓               │
[Commits]────*─────[Commit_Analyses]    │
      │                 ↑               │
      │                 │               │
      │            [Analysis_Prompts]   │
      │                                 │
      │                                 │
[Contributors]←──────────────────────────┘
      │                 ↑
      │                 │
      ├─────*───1─[Contribution_History]
      │
      └─────*───*─[Contributor_Repository]
                          ↑
                          │
                   [Github_Raw_Data]
                          │
                          ↓
                    [Pipeline_Runs]
```

Legend:
- 1 = one (cardinality)
- * = many (cardinality)
- → = relationship direction

## Feature Relationships

### Repository Exploration
- The `repositories` table serves as the central entity for repository exploration
- `star_history` tracks star counts over time for trending analysis
- `commits` and `merge_requests` provide repository activity metrics

### Contributor Analysis
- `contributors` stores GitHub user data
- `contributor_repository` maps contributors to repositories with contribution counts
- `contribution_history` tracks contribution patterns over time
- Functions like `get_top_contributors_by_commits` provide analytics capabilities

### Merge Request Insights
- `merge_requests` stores core PR data
- `pull_request_comments`, `pull_request_activities`, and `pull_request_reviewers` add context
- Metrics like `cycle_time_hours` and `complexity_score` facilitate performance analysis

### Commit Analysis
- `commits` contains core commit data including diffs
- `commit_analyses` stores AI-generated insights about commits
- `analysis_prompts` provides templates for generating analyses

### Data Pipeline
- `github_raw_data` stores raw data from GitHub API for processing
- `pipeline_runs` tracks pipeline execution status
- The `is_enriched` flags across various tables indicate enrichment status

## Data Integrity and Validation

The database schema enforces several data integrity mechanisms:

1. **Primary Keys**: Each table has a well-defined primary key to ensure record uniqueness.

2. **Foreign Keys**: Relationships between tables are enforced through foreign key constraints:
   - `merge_requests.repository_id` references `repositories.id`
   - `commits.repository_id` references `repositories.id`
   - `commits.merge_request_id` references `merge_requests.id`
   - `contributor_repository` enforces valid relationships between contributors and repositories

3. **Not-Null Constraints**: Critical fields are marked as NOT NULL:
   - Repository identifiers and names
   - Contributor identifiers and usernames
   - Commit essential metadata (hash, title, author)

4. **Default Values**: Sensible defaults are provided for many fields:
   - Timestamp fields default to current time
   - Counter fields initialize to 0
   - Boolean flags default to false

5. **Data Types**: Appropriate types are used for different data categories:
   - Text for variable-length strings
   - Integer/Bigint for numeric IDs and counts
   - Timestamp with time zone for temporal data
   - Boolean for flags
   - JSONB for structured data

## Performance Considerations

The database schema includes several performance optimizations:

1. **Indexing Strategy**:
   - Primary keys are automatically indexed
   - Foreign key columns are indexed to optimize joins
   - Frequently filtered columns (author, status, date) have indexes

2. **Denormalization**: Some calculated or frequently accessed data is denormalized:
   - Contribution counts in the contributor_repository table
   - Star counts in the repositories table
   - Lines added/removed in merge_requests

3. **Materialized View**: The repository_top_contributors view materializes complex joins for faster access to frequently needed analytics.

4. **Efficient Types**:
   - UUIDs for entities requiring globally unique identifiers
   - Text arrays for lists rather than separate junction tables where appropriate
   - JSONB for flexible schema elements without requiring table alterations

5. **Pipeline Processing**:
   - Raw data is stored before processing, allowing retries and debugging
   - Processing flags track stages to enable incremental processing
   - Enrichment offset tracking enables resumable operations

6. **Query Optimization**:
   - Analytics functions encapsulate complex queries
   - Timestamp fields enable time-range filtering
   - Boolean flags for filtering processed/unprocessed records

## Recent Changes

### Migration 008: Entity Enrichment Implementation

We've implemented a comprehensive enrichment process for GitHub entities that enhances the stored data with additional details from the GitHub API. This enrichment process:

1. **Enriches Repositories** with extended details including:
   - Size in kilobytes
   - Open issues count
   - Watchers count
   - Primary programming language
   - License information

2. **Enriches Contributors** with extended profile information including:
   - Full name
   - Bio and company
   - Blog and Twitter details
   - Location
   - Follower and repository counts

3. **Enriches Pull Requests** with additional metrics including:
   - Files changed count
   - Review comments count
   - Lines added and removed
   - Labels

4. **Enriches Commits** with detailed information including:
   - Files changed
   - Author and committer details (name and email)
   - Full commit message
   - Verification status
   - Line change statistics (additions, deletions, total)
   - Parent commit references
   - Timestamps for authoring and committing

The enrichment process uses the GitHub API to fetch detailed data for each entity and updates the corresponding records in the database, setting the `is_enriched` flag to `true` for enriched records. This improves the data quality and enables more advanced analytics and visualizations.

### Migration 007: Extend BIGINT Support for GitHub IDs

To fully accommodate GitHub's large ID values (which can exceed PostgreSQL's integer limit of 2,147,483,647), the following additional columns have been changed from `INTEGER` to `BIGINT`:

- `github_id` in `repositories` table
- `github_id` in `contributors` table
- `contributor_id` in `repository_contributors` table 
- `contributor_id` in `commits` table
- `github_id` in `issues` table
- `creator_id` in `issues` table
- `assignee_id` in `issues` table
- `github_id` in `pull_requests` table
- `creator_id` in `pull_requests` table
- `merged_by_id` in `pull_requests` table

This comprehensive update ensures all GitHub IDs can be stored directly without modification, maintaining data integrity across the entire database.

### Migration 006: Update ID Columns for GitHub Integration

To accommodate GitHub's large ID values (which can exceed PostgreSQL's integer limit of 2,147,483,647), the following columns have been changed from `INTEGER` to `BIGINT`:

- `repository_id` in `commits` table
- `merge_request_id` in `commits` table
- `repository_id` in `merge_requests` table
- `repository_id` in `contributor_repository` table

This change ensures that GitHub's IDs can be stored directly without modification, maintaining the integrity of references between GitHub and our database.

### Migration 009: Added GitHub Raw Data Table

We've implemented a `github_raw_data` table to serve as a staging area for GitHub API data before processing. This table:

1. **Stores Complete API Responses**: Uses JSONB to store full API response data
2. **Tracks Processing Status**: Includes a `processed` flag to manage pipeline workflow
3. **Supports Source Identification**: The `source` field tracks the origin of the data
4. **Prevents Duplicates**: Has a unique constraint on repository ID and PR number
5. **Facilitates Efficient Queries**: Includes indices for common query patterns

This addition enhances the pipeline architecture by:
- Providing a clear separation between raw data acquisition and processing
- Creating an audit trail for data sources
- Enabling more resilient pipeline execution with better error recovery
- Supporting multiple data ingestion sources (edge functions, test scripts, etc.)

### Migration 010: Added Source Field to Entity Tables

We've added a `source` field to all entity tables (repositories, contributors, merge_requests, commits) to track the origin of data across the entire pipeline. This enhancement:

1. **Enables Data Provenance Tracking**: Each record now indicates where it came from (edge function, test script, etc.)
2. **Supports Multi-Source Integration**: The system can now handle data from multiple sources while maintaining clear separation
3. **Facilitates Debugging**: Issues can be traced back to their origin more easily
4. **Enhances Reporting**: Reports can be filtered by data source for more targeted analysis
5. **Improves Test Data Management**: Test data can be easily identified and excluded from production analytics

This change complements the existing `source` field in the `github_raw_data` table, creating a consistent tracking mechanism throughout the entire data flow.
